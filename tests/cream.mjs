#!/usr/bin/env node
// Cream-only visual/material regression. Source and production assets stay untouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {serveAsset,snapshotAssets,routeTestPath,testBasePath} from './serve-assets.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const options={source:path.join(repo,'index.html'),output:'/tmp/lc200-cream',deps:'/tmp/lc200-visual-deps',baseline:'/tmp/lc200-cream-before',mode:'after',assetRoot:repo};
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];
 if(!['--source','--output','--deps','--three-dir','--chromium','--baseline','--mode','--asset-root'].includes(key)||!process.argv[i+1])throw Error('Expected a named option and value');
 options[key.slice(2)]=process.argv[++i];
}
if(!['before','after'].includes(options.mode))throw Error('--mode must be before or after');
const require=createRequire(path.join(path.resolve(options.deps),'package.json'));
const {chromium}=require('playwright'),sharp=require('sharp');
const three=options['three-dir']||path.join(options.deps,'three/package');
if(JSON.parse(await fs.readFile(path.join(three,'package.json'),'utf8')).version!=='0.166.1')throw Error('Use the locally packed Three.js 0.166.1 package');
const baseline=path.resolve(options.mode==='before'?options.output:options.baseline),output=path.resolve(options.output);
const baselineLooks=options.mode==='before'?{}:JSON.parse(await fs.readFile(path.join(baseline,'baseline-looks.json'),'utf8'));
const assetRoot=path.resolve(options['asset-root']||options.assetRoot);
const original=await fs.readFile(options.source,'utf8'),sourceSha256=createHash('sha256').update(original).digest('hex');
const assetsBefore=await snapshotAssets(assetRoot);
const baselineAssets=options.mode==='before'?assetsBefore:JSON.parse(await fs.readFile(path.join(baseline,'baseline-assets.json'),'utf8'));
await fs.mkdir(output,{recursive:true});
if(options.mode==='before'){
 await fs.writeFile(path.join(output,'before.html'),original);
 await fs.writeFile(path.join(output,'baseline-assets.json'),JSON.stringify(assetsBefore,null,2)+'\n');
}

let html=original.replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/')
 .replace('requestAnimationFrame(animate);','if(window.__creamRegressionPaused)return;window.__creamRegressionRaf=requestAnimationFrame(animate);');
const end=html.lastIndexOf('</script>');
html=html.slice(0,end)+`
window.__creamRegressionPaused=false;window.__creamRegressionSuppress=true;
const __creamRegressionRender=renderer.render.bind(renderer);
let __creamScreenRenders=0,__creamTargetRenders=0;
renderer.render=(...args)=>{
 if(!window.__creamRegressionSuppress||renderer.getRenderTarget()){
  if(renderer.getRenderTarget())__creamTargetRenders++;else __creamScreenRenders++;
  return __creamRegressionRender(...args);
 }
};
car.updateMatrixWorld(true);
const __creamGeometry=[];
car.traverse(o=>{if(o.isMesh)for(const name of ['position','normal','color']){
 const a=o.geometry.getAttribute(name);if(a)__creamGeometry.push({o,name,a,bytes:new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength).slice()});
}});
const __creamMatrices=[];car.traverse(o=>__creamMatrices.push([o,o.matrix.toArray(),o.matrixWorld.toArray()]));
const __creamPoses=[];car.traverse(o=>{if(o.isMesh){const m=Array.isArray(o.material)?o.material[0]:o.material;__creamPoses.push({o,position:o.getWorldPosition(new THREE.Vector3()),wheel:m.userData.partId?.startsWith('wheel_')});}});
window.__creamRegression={
 groundState(){return{floorVisible:floor.visible,oldContactVisible:contactPlane.visible,sameTexture:floor.material.map===contactMap.texture,clipCount:floor.material.clippingPlanes?.length??0,buffers:this.buffersIntact()}},
 resume(){if(window.__creamRegressionPaused){window.__creamRegressionPaused=false;animate();}},
 pause(){window.__creamRegressionPaused=true;cancelAnimationFrame(window.__creamRegressionRaf);},
 isTweening:()=>!!tween,
 draw(){__creamScreenRenders=0;__creamTargetRenders=0;window.__creamRegressionSuppress=false;try{renderFrame();}finally{window.__creamRegressionSuppress=true;}return{screen:__creamScreenRenders,target:__creamTargetRenders};},
 buffersIntact(){return __creamGeometry.every(r=>{const a=r.o.geometry.getAttribute(r.name);if(a!==r.a)return false;const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);return bytes.length===r.bytes.length&&bytes.every((v,i)=>v===r.bytes[i]);});},
 geometryIntact(){car.updateMatrixWorld(true);return car.scale.equals(new THREE.Vector3(1,1,1))&&this.buffersIntact()&&__creamMatrices.every(([o,local,world])=>local.every((v,i)=>v===o.matrix.elements[i])&&world.every((v,i)=>v===o.matrixWorld.elements[i]));},
 liftState(){car.updateMatrixWorld(true);let bodyError=0,wheelMovement=0;for(const r of __creamPoses){const delta=r.o.getWorldPosition(new THREE.Vector3()).sub(r.position);if(r.wheel)wheelMovement=Math.max(wheelMovement,delta.length());else bodyError=Math.max(bodyError,Math.abs(delta.y-.05),Math.abs(delta.x),Math.abs(delta.z));}return{bodyY:bodyGroup.position.y,bodyError,wheelMovement,buffersIntact:this.buffersIntact()};},
 state(){
  const materials=[];car.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.push({part:m.userData.partId,node:o.name,zone:m.userData.zone,type:m.type,color:m.color?.getHexString(),emissive:m.emissive?.getHexString(),emissiveIntensity:m.emissiveIntensity,roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness,envMapIntensity:m.envMapIntensity,opacity:m.opacity,transparent:m.transparent,flatShading:m.flatShading,hasEnvMap:!!m.envMap,specularIntensity:m.specularIntensity,toneMapped:m.toneMapped,side:m.side,depthWrite:m.depthWrite,forceSinglePass:m.forceSinglePass});});
  materials.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const uniforms=u=>Object.fromEntries(Object.entries(u).map(([k,v])=>[k,v.value?.isColor?v.value.getHexString():v.value]));
  return{
   studio:studioMode,build:lcBuild.getState(),materials,
   contact:{opacity:contactMaterial.opacity,tint:contactTint.value.getHexString(),nearTint:contactNearTint.value,nearStrength:contactNearStrength.value},
   exposure:renderer.toneMappingExposure,toneMapping:renderer.toneMapping,
   key:{intensity:key.intensity,color:key.color.getHexString(),position:key.position.toArray()},
   fill:{intensity:fill.intensity,color:fill.color.getHexString(),ground:fill.groundColor.getHexString()},
   baked:uniforms(bakedUniforms),clay:uniforms(clayBakedUniforms),
   cream:typeof creamBakedUniforms==='undefined'?null:uniforms(creamBakedUniforms),
   background:getComputedStyle(document.body).backgroundImage,theme:document.querySelector('meta[name="theme-color"]').content,
   camera:{position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov},
   environmentIntensity:scene.environmentIntensity,
   renderer:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shadowEnabled:renderer.shadowMap.enabled,shadowAutoUpdate:renderer.shadowMap.autoUpdate,keyShadowMapSize:key.shadow.mapSize.toArray()},
   contactMapSize:[contactMap.width,contactMap.height],contactBlurSize:[contactBlur.width,contactBlur.height],geometryIntact:this.geometryIntact()
  };
 }
};
`+html.slice(end);
await fs.writeFile(path.join(output,'test.html'),html);
const server=createServer(async(req,res)=>{
 try{
  const p=routeTestPath(new URL(req.url,'http://localhost').pathname);
  if(p===null){res.writeHead(404);res.end();return;}
  if(p==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(p==='/'||p==='/test.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  await serveAsset(res,p,{assetRoot,threeRoot:three});
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const checks={},states={},errors=[],comparisons=[],snapshots=[];
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clone=x=>JSON.parse(JSON.stringify(x));
const sortedMaterials=a=>clone(a).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const appearance=s=>({materials:sortedMaterials(s.materials),contact:s.contact,exposure:s.exposure,toneMapping:s.toneMapping,key:s.key,fill:s.fill,baked:s.baked,clay:s.clay,background:s.background,theme:s.theme,environmentIntensity:s.environmentIntensity,renderer:s.renderer});
const cameraEqual=(a,b)=>a.fov===b.fov&&['position','target'].every(key=>a[key].every((v,i)=>Math.abs(v-b[key][i])<1e-9));
async function compareImages(beforeFile,afterFile,label){
 const [a,b]=await Promise.all([sharp(beforeFile).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(afterFile).ensureAlpha().raw().toBuffer({resolveWithObject:true})]);
 let differingPixels=0;
 if(a.info.width!==b.info.width||a.info.height!==b.info.height)throw Error('Image dimensions changed: '+label);
 for(let i=0;i<a.data.length;i+=4)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3])differingPixels++;
 const digest=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
 const row={label,width:a.info.width,height:a.info.height,differingPixels,beforeSha256:await digest(beforeFile),afterSha256:await digest(afterFile)};
 comparisons.push(row);return row;
}
let browser;
try{
 browser=await chromium.launch({executablePath:options.chromium||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));
 page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
 page.on('requestfailed',r=>errors.push({type:'request',url:r.url(),message:r.failure()?.errorText}));
 await page.goto('http://127.0.0.1:'+server.address().port+testBasePath,{timeout:120000});
 await page.waitForFunction(()=>!!window.__creamRegression,null,{timeout:120000});
 const state=()=>page.evaluate(()=>__creamRegression.state());
 const draw=()=>page.evaluate(()=>__creamRegression.draw());
 const selectStudio=async desired=>{
  for(let i=0;i<4;i++){
   if(await page.evaluate(()=>document.body.dataset.studio)===desired){await page.waitForTimeout(350);return;}
   await page.evaluate(()=>document.querySelector('#bgToggle').click());
  }
  throw Error('Cannot select '+desired);
 };
 const settle=async view=>{
  await page.evaluate(v=>{__creamRegression.resume();document.querySelector('[data-view='+v+']').click();},view);
  await page.waitForTimeout(2600);
  await page.waitForFunction(()=>!__creamRegression.isTweening(),null,{timeout:60000});
  await page.evaluate(()=>__creamRegression.pause());
 };
 const capture=async name=>{
  const passes=await draw();
  checks.noAdditionalFramePasses=(checks.noAdditionalFramePasses??true)&&passes.screen===1&&passes.target===0;
  const file=path.join(output,name+'.png');await page.screenshot({path:file,animations:'disabled',timeout:120000});
  snapshots.push(name+'.png');console.log('CAPTURE',name);return file;
 };
 if(options.mode==='before'){
  for(const studio of ['cream','slate','clay']){
   await selectStudio(studio);
   for(const view of ['front','side','rear','quarter','top']){
    await settle(view);const name='before-'+studio+'-'+view;await capture(name);
    const info=await state();states[studio+'-'+view]=info;
    await fs.writeFile(path.join(output,name+'.json'),JSON.stringify({sourceSha256,view,info},null,2)+'\n');
   }
   baselineLooks[studio]=states[studio+'-quarter'];
   if(studio!=='cream'){
    await page.evaluate(()=>lcBuild.setState({paint:{paint:'#cf855f'}}));await settle('quarter');
    await capture('before-'+studio+'-orange-quarter');
    await page.evaluate(()=>lcBuild.setState({paint:{paint:'#f4f4ef'}}));
   }
  }
  await fs.writeFile(path.join(output,'baseline-looks.json'),JSON.stringify(baselineLooks,null,2)+'\n');
  checks.baselineFixturesWritten=true;
 }else{
 // Initial Cream must have its final paint and contact settings without a studio click.
 await settle('side');const initialFile=await capture('cream-first-load-side');states.creamInitial=await state();
 checks.defaultStudioAndWhite=states.creamInitial.studio==='cream'&&states.creamInitial.build.paint.paint==='#f4f4ef';
 await selectStudio('slate');await selectStudio('clay');await selectStudio('cream');await settle('side');
 const restoredFile=await capture('cream-returned-side');states.creamReturned=await state();
 const startupComparison=await compareImages(initialFile,restoredFile,'Cream first load vs mode-cycle return');
 checks.creamInitialAndReturnMatch=startupComparison.differingPixels===0&&equal(appearance(states.creamInitial),appearance(states.creamReturned));

 for(const view of ['front','side','rear','quarter','top']){
  await settle(view);await capture('cream-white-'+view);states['cream-'+view]=await state();
 }
 const cream=states['cream-quarter'],baseCream=baselineLooks.cream;
 checks.defaultBuildPreserved=equal(cream.build,baseCream.build);
 checks.creamLightingUnchanged=equal({exposure:cream.exposure,toneMapping:cream.toneMapping,key:cream.key,fill:cream.fill,environment:cream.environmentIntensity},{exposure:baseCream.exposure,toneMapping:baseCream.toneMapping,key:baseCream.key,fill:baseCream.fill,environment:baseCream.environmentIntensity});
 checks.creamNonPaintMaterialsUnchanged=equal(sortedMaterials(cream.materials.filter(m=>m.zone!=='paint')),sortedMaterials(baseCream.materials.filter(m=>m.zone!=='paint')));
 checks.paintPhysicalPropertiesUnchanged=equal(sortedMaterials(cream.materials.filter(m=>m.zone==='paint')),sortedMaterials(baseCream.materials.filter(m=>m.zone==='paint')));
 checks.creamBackgroundUnchanged=cream.background===baseCream.background&&cream.theme===baseCream.theme;
 checks.bakedPanelSettingsUnchanged=equal(cream.baked,baseCream.baked);
 checks.creamGeometryUnchanged=cream.geometryIntact;
 checks.creamOriginalGainsPreserved=baseCream.cream?['uCreamKeyGain','uCreamFillGain','uCreamKeyDirection','uCreamKeyTint','uCreamContactPower','uCreamContactBand'].every(k=>equal(cream.cream[k],baseCream.cream[k])):true;
 checks.creamUsesExistingFloor=await page.evaluate(()=>{const g=__creamRegression.groundState();return g.floorVisible&&!g.oldContactVisible&&g.sameTexture});
 await page.evaluate(()=>document.querySelector('#baseToggle').click());await draw();
 checks.creamBaseClipping=await page.evaluate(()=>{const g=__creamRegression.groundState();return g.floorVisible&&!g.oldContactVisible&&g.clipCount===4&&g.buffers});
 await page.evaluate(()=>document.querySelector('#baseToggle').click());await draw();
 checks.creamBaseRestores=await page.evaluate(()=>{const g=__creamRegression.groundState();return g.floorVisible&&!g.oldContactVisible&&g.clipCount===0});

 checks.noExtraDrawsOrTriangles=equal(cream.renderer,baseCream.renderer);
 checks.noAdditionalShadowMaps=cream.renderer.shadowEnabled===false&&equal(cream.contactMapSize,[1024,1024])&&equal(cream.contactBlurSize,[1024,1024]);
 let allCameras=true;
 for(const view of ['front','side','rear','quarter','top']){
  const b=JSON.parse(await fs.readFile(path.join(baseline,'before-slate-'+view+'.json'),'utf8'));
  allCameras&&=cameraEqual(states['cream-'+view].camera,b.info.camera);
 }
 checks.allFivePresetCamerasUnchanged=allCameras;
 for(const studio of ['slate','clay']){
  await selectStudio(studio);
  for(const view of ['front','side','rear','quarter','top']){
   await settle(view);const file=await capture(studio+'-white-'+view);states[studio+'-'+view]=await state();
   const row=await compareImages(path.join(baseline,'before-'+studio+'-'+view+'.png'),file,studio+' white '+view);
   checks[studio+'WhiteImagesUnchanged']=(checks[studio+'WhiteImagesUnchanged']??true)&&row.differingPixels===0;
  }
  checks[studio+'AppearanceUnchanged']=equal(appearance(states[studio+'-quarter']),appearance(baselineLooks[studio]));
  await page.evaluate(()=>lcBuild.setState({paint:{paint:'#cf855f'}}));await settle('quarter');
  const file=await capture(studio+'-orange-quarter');
  const row=await compareImages(path.join(baseline,'before-'+studio+'-orange-quarter.png'),file,studio+' orange quarter');
  checks[studio+'OrangeImageUnchanged']=row.differingPixels===0;
  await page.evaluate(()=>lcBuild.setState({paint:{paint:'#f4f4ef'}}));
 }
 // Use the actual swatch buttons and custom picker, preserving authored colours.
 await selectStudio('cream');await settle('quarter');
 const swatches=await page.locator('[data-paint]').evaluateAll(es=>es.map(e=>e.dataset.paint));
 const swatchObservations=[];
 for(const color of swatches){
  await page.evaluate(c=>document.querySelector('[data-paint="'+c+'"]').click(),color);await draw();
  const s=await state();swatchObservations.push({color,build:s.build.paint.paint,paint:[...new Set(s.materials.filter(m=>m.zone==='paint').map(m=>m.color))],geometry:s.geometryIntact,background:s.background});
 }
 for(const color of ['#cf855f','#dde9f1','#ffffff','#f4f4ef']){
  await page.evaluate(c=>{const i=document.querySelector('#customPaint');i.value=c;i.dispatchEvent(new Event('input',{bubbles:true}));},color);await draw();
  const s=await state();swatchObservations.push({color,build:s.build.paint.paint,paint:[...new Set(s.materials.filter(m=>m.zone==='paint').map(m=>m.color))],geometry:s.geometryIntact,background:s.background});
 }
 states.swatches=swatchObservations;
 checks.allSwatchesAndCustomWork=swatchObservations.every(s=>s.build===s.color&&equal(s.paint,[s.color.slice(1)])&&s.geometry&&s.background===baseCream.background);
 await page.evaluate(()=>lcBuild.setState({paint:{'door_FL:paint':'#c27755','door_FL:black':'#705050'}}));await draw();
 states.creamPerPart=await state();
 const partMatches=(s,zone,color)=>s.materials.some(m=>m.part==='door_FL'&&m.zone===zone)&&s.materials.filter(m=>m.part==='door_FL'&&m.zone===zone).every(m=>m.color===color);
 checks.perPartPaintAndTrimOverride=partMatches(states.creamPerPart,'paint','c27755')&&partMatches(states.creamPerPart,'black','705050');
 await selectStudio('slate');await draw();const slatePart=await state();
 await selectStudio('clay');await draw();const clayPart=await state();
 await selectStudio('cream');await draw();const creamPart=await state();
 checks.perPartOverridesSurviveModes=[slatePart,clayPart,creamPart].every(s=>partMatches(s,'paint','c27755')&&partMatches(s,'black','705050'));
 await page.evaluate(()=>lcBuild.setState({paint:{paint:'#f4f4ef','door_FL:paint':null,'door_FL:black':null}}));await draw();
 await page.evaluate(()=>lcBuild.setState({lift_mm:50}));await draw();
 states.lift=await page.evaluate(()=>__creamRegression.liftState());
 checks.rigidLiftKeepsWheelsAndBuffers=states.lift.bodyY===.05&&states.lift.bodyError<1e-10&&states.lift.wheelMovement===0&&states.lift.buffersIntact;
 await page.evaluate(()=>lcBuild.setState({lift_mm:0}));await draw();
 checks.liftRestores=await page.evaluate(()=>lcBuild.groups.body.position.y===0&&__creamRegression.geometryIntact());
 await page.evaluate(()=>lcBuild.setState({hidden:['roof_rails'],slots:{spoiler:null}}));
 checks.hiddenAndEmptySlotsWork=await page.evaluate(()=>!lcBuild.parts.get('roof_rails').visible&&!lcBuild.parts.get('spoiler').visible);
 await page.evaluate(()=>lcBuild.setState({hidden:[],slots:{spoiler:'spoiler'}}));await settle('quarter');await draw();
 states.creamFinal=await state();
 checks.defaultBuildRestores=equal(states.creamFinal.build,baseCream.build)&&equal(appearance(states.creamFinal),appearance(cream));
 checks.geometryAndScaleIntactAfterEdits=states.creamFinal.geometryIntact;
 }
}catch(e){errors.push({type:'test',message:e.stack});}
finally{await browser?.close();await new Promise(r=>server.close(r));}
const assetsAfter=await snapshotAssets(assetRoot);
checks.modelAndBuildFilesUnchanged=equal(assetsBefore,baselineAssets)&&equal(assetsBefore,assetsAfter);
const report={testedAt:new Date().toISOString(),mode:options.mode,sourceSha256,baselineSourceSha256:createHash('sha256').update(await fs.readFile(path.join(baseline,'before.html'))).digest('hex'),passed:errors.length===0&&Object.values(checks).every(v=>v===true),checks,errors,assetFiles:assetsBefore.length,comparisons,snapshots,states};
await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,checks,errors,comparisons},null,2));
if(!report.passed)process.exitCode=1;
