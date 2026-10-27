#!/usr/bin/env node
// Clay-specific visual/material regression. No production assets are rewritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {serveAsset,snapshotAssets,routeTestPath,testBasePath} from './serve-assets.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const options={source:path.join(repo,'index.html'),output:'/tmp/lc200-clay',deps:'/tmp/lc200-visual-deps',mode:'after'};
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];if(!['--source','--output','--deps','--three-dir','--chromium','--mode'].includes(key)||!process.argv[i+1])throw Error('Expected a named option and value');options[key.slice(2)]=process.argv[++i];
}
if(!['before','after','stock'].includes(options.mode))throw Error('--mode must be before, after or stock');
const require=createRequire(path.join(options.deps,'package.json')),playwright=require('playwright');
const three=options['three-dir']||path.join(options.deps,'three/package');
if(JSON.parse(await fs.readFile(path.join(three,'package.json'),'utf8')).version!=='0.166.1')throw Error('Use local Three.js0.166.1');
const original=await fs.readFile(options.source,'utf8'),sourceSha256=createHash('sha256').update(original).digest('hex');
const assetsBefore=await snapshotAssets(repo),assetSetSha256=createHash('sha256').update(JSON.stringify(assetsBefore)).digest('hex');
const output=path.join(options.output,options.mode);await fs.mkdir(output,{recursive:true});
let html=original.replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/').replace('requestAnimationFrame(animate);','if(window.__clayPaused)return; window.__clayRaf=requestAnimationFrame(animate);');
const end=html.lastIndexOf('</script>');
html=html.slice(0,end)+`\nwindow.__clayPaused=false;window.__claySuppressRender=true;
const __clayOriginalRender=renderer.render.bind(renderer);renderer.render=(...args)=>{if(!window.__claySuppressRender||renderer.getRenderTarget())return __clayOriginalRender(...args)};
const __clayGeometry=[];car.updateMatrixWorld(true);car.traverse(o=>{if(!o.isMesh)return;for(const name of ['position','normal','color']){const a=o.geometry.getAttribute(name);if(a){const data=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);__clayGeometry.push({o,name,a,bytes:data.slice()})}}});
const __clayMatrices=[];car.traverse(o=>__clayMatrices.push([o,o.matrix.toArray(),o.matrixWorld.toArray()]));
window.__clayTest={camera,controls,car,scene,renderer,THREE,
 resume(){if(window.__clayPaused){window.__clayPaused=false;animate()}},pause(){window.__clayPaused=true;cancelAnimationFrame(window.__clayRaf)},isTweening:()=>!!tween,
 draw(){window.__claySuppressRender=false;try{renderFrame()}finally{window.__claySuppressRender=true}},
 geometryIntact(){car.updateMatrixWorld(true);return car.scale.equals(new THREE.Vector3(1,1,1))&&__clayGeometry.every(r=>{const a=r.o.geometry.getAttribute(r.name);if(a!==r.a)return false;const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);return bytes.length===r.bytes.length&&bytes.every((v,i)=>v===r.bytes[i])})&&__clayMatrices.every(([o,local,world])=>local.every((v,i)=>v===o.matrix.elements[i])&&world.every((v,i)=>v===o.matrixWorld.elements[i]))},
 state(){const materials=[];car.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material]))materials.push({part:m.userData.partId,node:o.name,zone:m.userData.zone,type:m.type,color:m.color?.getHexString(),emissive:m.emissive?.getHexString(),emissiveIntensity:m.emissiveIntensity,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness,envMapIntensity:m.envMapIntensity,opacity:m.opacity,transparent:m.transparent,flatShading:m.flatShading,hasEnvMap:!!m.envMap})});materials.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({type:o.type,color:o.color?.getHexString(),ground:o.groundColor?.getHexString(),intensity:o.intensity,position:o.position.toArray()})});return {materials,lights,environmentIntensity:scene.environmentIntensity,exposure:renderer.toneMappingExposure,background:getComputedStyle(document.body).backgroundImage,theme:document.querySelector('meta[name="theme-color"]').content,build:lcBuild.getState(),camera:{position:camera.position.toArray(),target:controls.target.toArray(),distance:controls.getDistance(),fov:camera.fov},geometryIntact:this.geometryIntact(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,programs:renderer.info.programs.length,bakedUniforms:typeof bakedUniforms==='undefined'?null:Object.fromEntries(Object.entries(bakedUniforms).map(([k,u])=>[k,u.value?.isColor?u.value.getHexString():u.value]))};}
};\n`+html.slice(end);
await fs.writeFile(path.join(output,'test.html'),html);
const server=createServer(async(req,res)=>{try{const p=routeTestPath(new URL(req.url,'http://localhost').pathname);if(p===null){res.writeHead(404);res.end();return}if(p==='/favicon.ico'){res.writeHead(204);res.end();return}if(p==='/'||p==='/test.html'){res.setHeader('Content-Type','text/html');res.end(html);return}await serveAsset(res,p,{assetRoot:repo,threeRoot:three})}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const checks={},states={},errors=[],snapshots=[];let browser;
try{
 browser=await playwright.chromium.launch({executablePath:options.chromium||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})});page.on('requestfailed',r=>errors.push({type:'request',url:r.url(),message:r.failure()?.errorText}));
 await page.goto('http://127.0.0.1:'+server.address().port+testBasePath,{timeout:120000});await page.waitForFunction(()=>!!window.__clayTest,null,{timeout:120000});
 const studio=()=>page.evaluate(()=>document.body.dataset.studio||(document.body.classList.contains('clay')?'clay':document.body.classList.contains('cream')?'cream':'slate'));
 const setStudio=async desired=>{for(let tries=0;tries<3;tries++){if(await studio()===desired){await page.waitForTimeout(450);return}await page.evaluate(()=>document.querySelector('#bgToggle').click())}throw Error('Could not select '+desired)};
 const settle=async view=>{await page.evaluate(v=>{window.__clayTest.resume();document.querySelector('[data-view='+v+']').click()},view);await page.waitForTimeout(2500);await page.waitForFunction(()=>!window.__clayTest.isTweening(),null,{timeout:60000});await page.evaluate(()=>window.__clayTest.pause())};
 const draw=()=>page.evaluate(()=>window.__clayTest.draw());
 const capture=async name=>{await draw();await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',timeout:120000});snapshots.push(name+'.png');console.log('CAPTURE',name)};
 const state=()=>page.evaluate(()=>window.__clayTest.state());
 if(options.mode==='after'){
  const startingPaint=await page.evaluate(()=>lcBuild.getState().paint.paint);
  await setStudio('clay');await page.evaluate(()=>{const input=document.querySelector('#customPaint');input.value='#cf855f';input.dispatchEvent(new Event('input',{bubbles:true}))});await settle('quarter');await capture('clay-preview-quarter');
  await page.evaluate(color=>{const input=document.querySelector('#customPaint');input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}))},startingPaint);await setStudio('cream');
 }
 if(options.mode==='stock'){await setStudio('clay');await settle('quarter');await capture('clay-stock-quarter');states.stock=await state();checks.stockBuildDefault=states.stock.build.paint.paint==='#f4f4ef';checks.geometryUnchanged=states.stock.geometryIntact;}else{
 for(const mode of ['cream','slate']){await setStudio(mode);for(const view of ['front','side','quarter']){await settle(view);await capture(mode+'-'+view);states[mode+'-'+view]=await state()}}
 if(options.mode==='after'){
  await setStudio('clay');await settle('quarter');await draw();states.clayDefault=await state();checks.modeIsClay=await studio()==='clay';checks.defaultBuildPreserved=JSON.stringify(states.clayDefault.build)===JSON.stringify(states['cream-quarter'].build);checks.geometryUnchanged=states.clayDefault.geometryIntact;
  checks.paintIsMatte=states.clayDefault.materials.filter(m=>m.zone==='paint').every(m=>m.roughness>=.8&&(m.clearcoat??0)===0&&m.envMapIntensity<=.2);
  checks.darkPartsMatte=states.clayDefault.materials.filter(m=>['black','tyre'].includes(m.zone)).every(m=>m.roughness>=.8&&m.metalness===0);
  checks.chromeIsMatte=states.clayDefault.materials.filter(m=>m.zone==='chrome').every(m=>m.roughness>=.75&&m.envMapIntensity<=.25);
  checks.glassLowReflection=states.clayDefault.materials.filter(m=>m.zone==='glass').every(m=>m.envMapIntensity<=.25);
  checks.lampsMatte=states.clayDefault.materials.filter(m=>m.zone.startsWith('lamp_')).every(m=>m.roughness>=.75&&m.envMapIntensity<=.25);
  checks.noExtraDraws=states.clayDefault.drawCalls<=states['cream-quarter'].drawCalls&&states.clayDefault.triangles<=states['cream-quarter'].triangles;
  const initialBuild=await page.evaluate(()=>lcBuild.getState());
  const swatches=await page.locator('[data-paint]').evaluateAll(es=>es.map(e=>e.dataset.paint));const swatchObservations=[];
  for(const color of [...swatches,'#cf855f','#4f8da5']){await page.evaluate(c=>{const input=document.querySelector('#customPaint');input.value=c;input.dispatchEvent(new Event('input',{bubbles:true}))},color);await page.waitForTimeout(450);await draw();const s=await state();swatchObservations.push({color,background:s.background,actualPaint:s.materials.find(m=>m.zone==='paint').color,buildPaint:s.build.paint.paint,geometryIntact:s.geometryIntact});}
  states.swatchObservations=swatchObservations;checks.paintSwatches=swatchObservations.every(s=>s.actualPaint==s.color.slice(1)&&s.buildPaint===s.color&&s.geometryIntact);checks.backgroundFollowsHue=swatchObservations.at(-1).background!==swatchObservations.at(-2).background;
  await page.evaluate(()=>{const input=document.querySelector('#customPaint');input.value='#cf855f';input.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForTimeout(450);
  for(const view of ['front','side','quarter']){await settle(view);await capture('clay-'+view);states['clay-'+view]=await state()}
  await page.evaluate(()=>lcBuild.setState({paint:{'door_FL:paint':'#c27755','door_FL:black':'#705050'}}));await draw();states.clayPerPart=await state();checks.perPartPaintInClay=states.clayPerPart.materials.some(m=>m.part==='door_FL'&&m.zone==='paint')&&states.clayPerPart.materials.filter(m=>m.part==='door_FL'&&m.zone==='paint').every(m=>m.color==='c27755');checks.nonPaintOverrideInClay=states.clayPerPart.materials.some(m=>m.part==='door_FL'&&m.zone==='black')&&states.clayPerPart.materials.filter(m=>m.part==='door_FL'&&m.zone==='black').every(m=>m.color==='705050');
  await setStudio('cream');await draw();states.creamPerPart=await state();checks.perPartPaintSurvivesSwitch=states.creamPerPart.materials.filter(m=>m.part==='door_FL'&&m.zone==='paint').every(m=>m.color==='c27755')&&states.creamPerPart.build.paint['door_FL:paint']==='#c27755';checks.nonPaintOverrideSurvivesSwitch=states.creamPerPart.materials.filter(m=>m.part==='door_FL'&&m.zone==='black').every(m=>m.color==='705050')&&states.creamPerPart.build.paint['door_FL:black']==='#705050';
  await page.evaluate(s=>lcBuild.setState({paint:{paint:s.paint.paint,'door_FL:paint':null,'door_FL:black':null}}),initialBuild);await settle('quarter');await draw();states.creamRestored=await state();
  await setStudio('slate');await draw();states.slateRestored=await state();
  const look=s=>JSON.stringify({materials:s.materials,lights:s.lights,environmentIntensity:s.environmentIntensity,exposure:s.exposure,background:s.background,theme:s.theme,bakedUniforms:s.bakedUniforms});
  checks.creamRestores=look(states.creamRestored)===look(states['cream-quarter']);checks.slateRestores=look(states.slateRestored)===look(states['slate-quarter']);checks.geometryUnchangedAfterCycle=states.slateRestored.geometryIntact;
  const beforeReport=JSON.parse(await fs.readFile(path.join(options.output,'before/results.json'),'utf8').catch(()=> '{}'));
  if(beforeReport.states){const baselineLook=s=>{const value=JSON.parse(look(s));value.bakedUniforms=Object.fromEntries(Object.entries(value.bakedUniforms).filter(([k])=>['uBakedAO','uBakedRidge','uBakedValley'].includes(k)));return JSON.stringify(value)};checks.creamUnchangedFromBaseline=baselineLook(states['cream-quarter'])===baselineLook(beforeReport.states['cream-quarter']);checks.slateUnchangedFromBaseline=baselineLook(states['slate-quarter'])===baselineLook(beforeReport.states['slate-quarter']);checks.presetCamerasUnchanged=['front','side','quarter'].every(v=>{const a=states['cream-'+v].camera,b=beforeReport.states['cream-'+v].camera;return a.fov===b.fov&&Math.abs(a.distance-b.distance)<1e-9&&a.position.every((n,i)=>Math.abs(n-b.position[i])<1e-9)&&a.target.every((n,i)=>Math.abs(n-b.target[i])<1e-9)});}
 }
 }
}catch(e){errors.push({type:'test',message:e.stack})}finally{await browser?.close();await new Promise(r=>server.close(r))}
const assetsAfter=await snapshotAssets(repo);checks.assetsUnchangedDuringTest=JSON.stringify(assetsBefore)===JSON.stringify(assetsAfter);
const report={sourceSha256,assetSetSha256,mode:options.mode,passed:errors.length===0&&Object.values(checks).every(v=>v===true),checks,errors,snapshots,states};await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,errors,snapshots},null,2));if(!report.passed)process.exitCode=1;
