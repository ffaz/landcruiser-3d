// Audit capture: renders one checkout of the viewer from exact, shared camera poses (no UI),
// so every version can be compared shot-for-shot. Never edits the checkout.
// DEPS needs playwright, pngjs and three@0.166.1 unpacked at DEPS/three/package.
// Usage: node capture.mjs DEPS CHROME REPO_DIR OUT_DIR [shotFilter]
// Typical run (see README.md): capture orig (f553e19), live (origin/main) and candidate (your branch) into
// AUDIT/orig, AUDIT/live, AUDIT/candidate, then node sheet.mjs DEPS AUDIT.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {SHOTS,BOX} from './shots.mjs';

const [deps,chromium,repo,out,filter]=process.argv.slice(2);
await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(deps,'package.json'));
const playwright=require('playwright');
const three=path.join(deps,'three','package');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.css':'text/css'};
let html=(await fs.readFile(path.join(repo,'index.html'),'utf8')).replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/');
html=html.replace('requestAnimationFrame(animate);','if(window.__auditPaused)return;requestAnimationFrame(animate);');
const end=html.lastIndexOf('</script>');
html=html.slice(0,end)+`
window.__audit={camera,controls,car,scene,renderer,THREE,
 render:()=>{typeof renderFrame==='function'?renderFrame():renderer.render(scene,camera);},
 clip:()=>{if(typeof updateClipping==='function')updateClipping();}};
`+html.slice(end);
const server=createServer(async(req,res)=>{
 try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname);
  if(p==='/'||p==='/index.html'){res.writeHead(200,{'Content-Type':types['.html']});res.end(html);return;}
  const root=p.startsWith('/three/')?three:repo,file=path.join(root,p.startsWith('/three/')?p.slice(7):p);
  if(!path.resolve(file).startsWith(path.resolve(root)))throw Error('outside');
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await playwright.chromium.launch({executablePath:chromium,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errors=[],log=[];
const groups=new Map();
for(const shot of SHOTS.filter(s=>!filter||s.name.includes(filter))){const k=`${shot.device}|${shot.studio}|${shot.paint}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(shot);}
for(const [key,shots] of groups){
 const [device,studio,paint]=key.split('|');
 const page=await browser.newPage(device==='phone'?{viewport:{width:390,height:844},deviceScaleFactor:3}:{viewport:{width:1200,height:850},deviceScaleFactor:1.5});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{timeout:180000});
 await page.waitForFunction(()=>document.querySelector('#loader.hidden'),null,{timeout:180000});
 await page.waitForTimeout(1500);
 for(let i=0;i<4&&!(await page.locator('#bgToggle').innerText()).toLowerCase().includes(studio);i++){await page.click('#bgToggle');await page.waitForTimeout(1500);}
 if(paint!=='white')await page.click(`.swatch[data-paint="${paint}"]`);
 await page.waitForTimeout(1200);
 await page.addStyleTag({content:'body *{visibility:hidden!important} canvas{visibility:visible!important}'});
 await page.evaluate(()=>{window.__auditPaused=true;});await page.waitForTimeout(300);
 for(const shot of shots){
  const info=await page.evaluate(([shot,fixed])=>{const a=window.__audit,T=a.THREE;
   a.car.updateMatrixWorld(true);const box=fixed?new T.Box3(new T.Vector3(...fixed[0]),new T.Vector3(...fixed[1])):new T.Box3().setFromObject(a.car),c=box.getCenter(new T.Vector3()),h=box.getSize(new T.Vector3()).multiplyScalar(.5);
   const target=new T.Vector3(c.x+shot.t[0]*h.x,c.y+shot.t[1]*h.y,c.z+shot.t[2]*h.z);
   const az=shot.az*Math.PI/180,el=shot.el*Math.PI/180,dir=new T.Vector3(-Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));
   a.camera.fov=shot.fov;a.camera.zoom=1;a.camera.position.copy(target).addScaledVector(dir,shot.d);
   a.controls.target.copy(target);a.camera.lookAt(target);a.camera.updateProjectionMatrix();a.camera.updateMatrixWorld(true);
   a.clip();a.camera.near=Math.min(a.camera.near,.05);a.camera.updateProjectionMatrix();a.render();
   const live=new T.Box3().setFromObject(a.car);return {box:[live.min.toArray(),live.max.toArray()],pos:a.camera.position.toArray(),target:target.toArray()};},[shot,BOX]);
  await page.screenshot({path:path.join(out,shot.file+'.png')});
  log.push({...shot,...info});
 }
 await page.close();
}
await fs.writeFile(path.join(out,'capture.json'),JSON.stringify({repo,errors,shots:log},null,1));
await browser.close();server.close();
console.log(path.basename(out),log.length,'shots, errors',errors.length);
