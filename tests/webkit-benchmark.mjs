#!/usr/bin/env node
// Real renderer benchmark; this does not certify physical iPad performance.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {serveAsset,snapshotAssets,routeTestPath,testBasePath} from './serve-assets.mjs';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const options={source:path.join(repo,'index.html'),output:path.join(os.tmpdir(),'lc200-webkit-benchmark'),
 assetRoot:repo,deps:path.join(os.tmpdir(),'lc200-visual-deps'),frames:24};
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];
 if(!['--source','--output','--deps','--three-dir','--frames','--library-path','--asset-root'].includes(key)||!process.argv[i+1])throw Error('Expected --source, --output, --deps, --three-dir, --frames or --library-path followed by a value');
 options[key.slice(2)]=process.argv[++i];
}
options.frames=Number(options.frames);
if(!Number.isInteger(options.frames)||options.frames<12||options.frames>120)throw Error('--frames must be an integer from12 to120');
for(const key of ['source','output','deps'])options[key]=path.resolve(options[key]);
const require=createRequire(path.join(options.deps,'package.json'));
const playwright=require('playwright');const {webkit,devices}=playwright;
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS='1';
const source=options.source,out=options.output;await fs.mkdir(out,{recursive:true});
const three=path.resolve(options['three-dir']||path.join(options.deps,'three','package'));
const info=JSON.parse(await fs.readFile(path.join(three,'package.json'),'utf8'));
if(info.version!=='0.166.1')throw Error('Use the exact local Three.js0.166.1 package prepared by tests/visual.mjs');
const original=await fs.readFile(source,'utf8');
let html=original.replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/');
const i=html.lastIndexOf('</script>');
html=html.slice(0,i)+`\nwindow.__perf={camera,controls,renderer,scene,car,THREE,isTweening:()=>!!tween};\n`+html.slice(i);
const server=createServer(async(req,res)=>{try{const p=routeTestPath(new URL(req.url,'http://local').pathname);if(p===null){res.writeHead(404);res.end('Use the project subpath');return;}if(p==='/favicon.ico'){res.writeHead(204);res.end();return}if(p==='/'){res.setHeader('content-type','text/html');res.end(html);return}await serveAsset(res,p,{assetRoot:options['asset-root']||options.assetRoot,threeRoot:three});}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const errors=[];let result;
try{
 browser=await webkit.launch({env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',...(options['library-path']?{LD_LIBRARY_PATH:options['library-path']+(process.env.LD_LIBRARY_PATH?':'+process.env.LD_LIBRARY_PATH:'')}:{})}});
 const page=await browser.newPage({...devices['iPad Pro 11'],viewport:{width:1366,height:1024},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})});page.on('requestfailed',r=>errors.push({type:'request',url:r.url(),message:r.failure()?.errorText}));
 await page.goto(`http://127.0.0.1:${server.address().port}${testBasePath}`,{timeout:120000});await page.waitForSelector('#loader.hidden',{state:'attached',timeout:120000});
 await page.evaluate(()=>document.querySelector('[data-view=quarter]').click());
 await page.waitForFunction(()=>window.__perf&&!window.__perf.isTweening(),null,{timeout:120000});
 result=await page.evaluate(async(frameCount)=>{
  const t=window.__perf;const intervals=[],renders=[];let previous;let active=false;let done;
  const finished=new Promise(r=>done=r);const original=t.renderer.render.bind(t.renderer);
  t.renderer.render=(...args)=>{const start=performance.now();const value=original(...args);if(active)renders.push(performance.now()-start);return value};
  const before=t.camera.position.toArray();document.querySelector('#rotate').click();
  for(let warmup=0;warmup<4;warmup++)await new Promise(requestAnimationFrame);
  active=true;
  const frame=stamp=>{if(previous!==undefined)intervals.push(stamp-previous);previous=stamp;if(intervals.length<frameCount)requestAnimationFrame(frame);else{active=false;done()}};requestAnimationFrame(frame);await finished;
  document.querySelector('#rotate').click();t.renderer.render=original;
  const summarize=a=>{const sorted=[...a].sort((a,b)=>a-b);return{samples:a.length,meanMs:a.reduce((a,b)=>a+b,0)/a.length,p50ms:sorted[Math.floor(a.length*.5)],p95ms:sorted[Math.min(a.length-1,Math.floor(a.length*.95))],minMs:sorted[0],maxMs:sorted.at(-1)}};
  const gl=t.renderer.getContext();return{raf:summarize(intervals),renderCpu:summarize(renders),intervalsMs:intervals,renderCpuMs:renders,actualRenderCalls:renders.length,rotated:t.camera.position.distanceTo(new t.THREE.Vector3(...before))>.01,viewport:[innerWidth,innerHeight],devicePixelRatio,rendererPixelRatio:t.renderer.getPixelRatio(),antialias:gl.getContextAttributes().antialias,samples:gl.getParameter(gl.SAMPLES),userAgent:navigator.userAgent};
 },options.frames);
 console.log('MEASURED',JSON.stringify(result.raf));
 await page.screenshot({path:path.join(out,'timing-view.png'),timeout:120000});
}catch(e){errors.push({type:'test',message:e.stack})}finally{await browser?.close();await new Promise(r=>server.close(r))}
const report={source,sourceSha256:createHash('sha256').update(original).digest('hex'),testedAt:new Date().toISOString(),engine:'Playwright WebKit on Linux WPE with software GL; iPad touch emulation',conditions:'1366x1024 CSS pixels, DPR1, native product renderer, Cream Quarter auto-rotate, four warmup frames then'+options.frames+' measured rAF intervals; no frame suppression',limitation:'Emulated WebKit, not a physical iPad. CPU and software GPU timing depends on host workload; not a hardware performance claim.',passed:!errors.length&&!!result?.rotated&&result?.actualRenderCalls>=options.frames-1,errors,assets:await snapshotAssets(options['asset-root']||options.assetRoot),...result};
await fs.writeFile(path.join(out,'performance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
