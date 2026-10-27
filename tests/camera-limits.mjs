#!/usr/bin/env node
// Browser integration test: actual trusted touch/wheel input against every preset.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const options={source:path.join(repo,'index.html'),output:path.join(os.tmpdir(),'lc200-camera-limits'),deps:path.join(os.tmpdir(),'lc200-visual-deps')};
for(let i=2;i<process.argv.length;i++){
 const flag=process.argv[i];if(!['--source','--output','--deps','--three-dir','--library-path','--chromium'].includes(flag)||!process.argv[i+1])throw Error('Expected a supported flag followed by a value');
 options[flag.slice(2)]=process.argv[++i];
}
const source=path.resolve(options.source),out=path.resolve(options.output),label='camera-limits';
await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(path.resolve(options.deps),'package.json'));
const playwright=require('playwright');const {webkit,chromium,devices}=playwright;
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS='1';
const three=path.resolve(options['three-dir']||path.join(options.deps,'three','package'));
if(JSON.parse(await fs.readFile(path.join(three,'package.json'),'utf8')).version!=='0.166.1')throw Error('Use Three.js 0.166.1');
const original=await fs.readFile(source,'utf8');
let html=original.replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/');const end=html.lastIndexOf('</script>');
html=html.slice(0,end)+`\nwindow.__cameraTest={camera,controls,car,renderer,THREE,cameraSafety,enforceCameraSafety,isTweening:()=>!!tween};\nconst originalTestRender=renderer.render.bind(renderer);renderer.render=()=>{};\n`+html.slice(end);
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;if(p==='/favicon.ico'){res.writeHead(204);res.end();return}if(p==='/'){res.setHeader('content-type','text/html');res.end(html);return}if(p.startsWith('/three/')){const f=path.resolve(three,p.slice(7));if(!f.startsWith(three+'/'))throw Error();res.setHeader('content-type',f.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(await fs.readFile(f));return}res.writeHead(404);res.end()}catch{res.writeHead(500);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const errors=[],observations=[],required=[];let config,collisionRecovery,trust;
try{
 browser=await webkit.launch({env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',...(options['library-path']?{LD_LIBRARY_PATH:options['library-path']+(process.env.LD_LIBRARY_PATH?':'+process.env.LD_LIBRARY_PATH:'')}:{})}});
 let page=await browser.newPage({...devices['iPad Pro 11'],viewport:{width:1366,height:1024},deviceScaleFactor:1});page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:120000});await page.waitForSelector('#loader.hidden',{state:'attached',timeout:120000});
 const session=playwright._connection.toImpl(page).delegate._pageProxySession;const touch=(type,touchPoints)=>session.send('Input.dispatchTouchEvent',{type,touchPoints,modifiers:0});
 await page.evaluate(()=>{window.__trustedInput=[];for(const type of ['pointerdown','pointermove','touchstart','touchmove','wheel'])document.querySelector('canvas').addEventListener(type,e=>window.__trustedInput.push({type,trusted:e.isTrusted}),{passive:true})});
 config=await page.evaluate(()=>{const s=window.__cameraTest.cameraSafety;return{sphere:{radius:s.sphere.radius,centre:s.sphere.center.toArray()},minDistance:s.minDistance,margin:s.margin,maxPolarDegrees:s.maxPolarAngle*180/Math.PI,panBox:{min:s.panBox.min.toArray(),max:s.panBox.max.toArray()},collisionBox:{min:s.collisionBox.min.toArray(),max:s.collisionBox.max.toArray()}}});
 const observe=async(view,input)=>{await page.waitForTimeout(25);const value=await page.evaluate(()=>{const t=window.__cameraTest,s=t.cameraSafety;return{position:t.camera.position.toArray(),target:t.controls.target.toArray(),distance:t.controls.getDistance(),polar:t.controls.getPolarAngle(),insideCollisionBox:s.collisionBox.containsPoint(t.camera.position),targetInsidePanBox:s.panBox.containsPoint(t.controls.target),cameraAboveFloor:t.camera.position.y>0,distanceSafe:t.controls.getDistance()>=s.minDistance-1e-5,polarSafe:t.controls.getPolarAngle()<=s.maxPolarAngle+1e-5}});value.passed=!value.insideCollisionBox&&value.targetInsidePanBox&&value.cameraAboveFloor&&value.distanceSafe&&value.polarSafe;observations.push({view,input,...value});if(!value.passed)throw Error(`Unsafe camera after ${view} ${input}: `+JSON.stringify(value));};
 for(const view of ['front','side','rear','quarter','top']){
  await page.evaluate(v=>document.querySelector(`[data-view=${v}]`).click(),view);await page.waitForTimeout(2500);await page.waitForFunction(()=>!window.__cameraTest.isTweening());await observe(view,'preset');
  await touch('touchStart',[{id:1,x:570,y:500},{id:2,x:760,y:500}]);for(let i=1;i<=4;i++){await touch('touchMove',[{id:1,x:570-i*110,y:500},{id:2,x:760+i*110,y:500}]);await observe(view,`pinch-in-${i}`)}await touch('touchEnd',[{id:1,x:130,y:500},{id:2,x:1200,y:500}]);
  await touch('touchStart',[{id:3,x:240,y:350},{id:4,x:430,y:350}]);for(let i=1;i<=4;i++){await touch('touchMove',[{id:3,x:240+i*200,y:350+i*130},{id:4,x:430+i*200,y:350+i*130}]);await observe(view,`two-finger-pan-${i}`)}await touch('touchEnd',[{id:3,x:1040,y:870},{id:4,x:1230,y:870}]);
  await touch('touchStart',[{id:5,x:680,y:200}]);for(let i=1;i<=4;i++){await touch('touchMove',[{id:5,x:680,y:200+i*190}]);await observe(view,`rotate-below-floor-${i}`)}await touch('touchEnd',[{id:5,x:680,y:960}]);
  console.log('CAMERA PASS',view);
 }
 collisionRecovery=await page.evaluate(()=>{const t=window.__cameraTest;t.controls.target.set(999,-999,999);t.camera.position.copy(t.cameraSafety.sphere.center);t.enforceCameraSafety();return{cameraOutside:!t.cameraSafety.collisionBox.containsPoint(t.camera.position),targetInside:t.cameraSafety.panBox.containsPoint(t.controls.target),aboveFloor:t.camera.position.y>0,distanceSafe:t.controls.getDistance()>=t.cameraSafety.minDistance-1e-5}});
 trust=await page.evaluate(()=>({touch:window.__trustedInput.some(e=>e.type==='touchmove'&&e.trusted)}));
 await browser.close();
 browser=await chromium.launch({executablePath:options.chromium||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 page=await browser.newPage({viewport:{width:1366,height:1024},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:120000});await page.waitForSelector('#loader.hidden',{state:'attached',timeout:120000});
 await page.evaluate(()=>{window.__trustedWheel=false;document.querySelector('canvas').addEventListener('wheel',e=>window.__trustedWheel ||=e.isTrusted,{passive:true})});
 for(const view of ['front','side','rear','quarter','top']){
  await page.evaluate(v=>document.querySelector(`[data-view=${v}]`).click(),view);await page.waitForTimeout(2500);await page.waitForFunction(()=>!window.__cameraTest.isTweening());
  await page.mouse.move(680,450);await page.mouse.wheel(0,-30000);await page.waitForTimeout(100);await observe(view,'desktop-scroll-in');
  await page.mouse.wheel(0,30000);await page.waitForTimeout(100);await observe(view,'desktop-scroll-out');
 }
 trust.wheel=await page.evaluate(()=>window.__trustedWheel);
}catch(e){errors.push({type:'test',message:e.stack})}finally{await browser?.close();await new Promise(r=>server.close(r))}
const report={source,sourceSha256:createHash('sha256').update(original).digest('hex'),label,testedAt:new Date().toISOString(),engine:'Playwright WebKit Linux WPE iPad touch emulation plus desktop Chromium wheel input;1366x1024 DPR1',method:'Real preset buttons/tweens, trusted native wheel,pinch,two-finger pan and one-finger rotation. IntermediateGPUdraws suppressed only in test copy; camera controls and safety guard run normally.',config,observations,collisionRecovery,trustedInputs:trust,errors,passed:!errors.length&&observations.length===75&&Object.values(collisionRecovery||{}).every(Boolean)&&trust?.wheel&&trust?.touch};await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
