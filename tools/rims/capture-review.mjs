// Render an unapproved KMC candidate through the real viewer, with a transient
// test-only catalogue. Production files and approval state are never changed.
// Usage: node tools/rims/capture-review.mjs DEPS WORK [OUTPUT] [--neutral]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const neutral=process.argv.includes('--neutral');
const [depsArg,workArg,outputArg]=process.argv.slice(2).filter(v=>v!=='--neutral');
if(!depsArg||!workArg)throw Error('DEPS WORK [OUTPUT] required');
const deps=path.resolve(depsArg),work=path.resolve(workArg),out=path.resolve(outputArg||path.join(work,'captures'));
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(deps,'package.json')),{chromium}=require('playwright'),sharp=require('sharp');
const candidate=await fs.readFile(path.join(work,'parts/rim_FL_disc.glb'));
const sourceSha256=createHash('sha256').update(candidate).digest('hex');
const entry=JSON.parse(await fs.readFile(path.join(work,'review-entry.json'),'utf8'));
const neutralZones=['rim','barrel','lip','pocket_wall','edge_catch','groove_shoulder','bead_groove','hub_pad','chrome'];
const neutralFinish={color:'#9b9b9b',roughness:.4,metalness:.25,envMapIntensity:1.3,clearcoat:0};
if(neutral)for(const zone of neutralZones)entry.materialDefaults[zone]={...entry.materialDefaults[zone],...neutralFinish};
const manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8'));
const wheels=JSON.parse(await fs.readFile(path.join(repo,'model/wheels.json'),'utf8'));
Object.assign(entry,{slot:'catalog_rim_kmc',catalogAsset:true,lazy:true,url:'/__review_candidate.glb'});
manifest.parts=manifest.parts.filter(p=>p.id!==entry.id);manifest.parts.push(entry);
manifest.slots.catalog_rim_kmc={default:null,pivot:entry.pivot,rigidClass:'wheel'};
const kmc=wheels.rims.find(r=>r.id==='kmc');Object.assign(kmc,{built:true,assetId:entry.id});
let html=await fs.readFile(path.join(repo,'index.html'),'utf8');
const viewerSha256=createHash('sha256').update(html).digest('hex');
html=html.replaceAll('https://cdn.jsdelivr.net/npm/three@0.166.1/','/three/').replaceAll('requestAnimationFrame(animate);','if(!window.__reviewPaused)window.__reviewRAF=requestAnimationFrame(animate);');
const i=html.lastIndexOf('</script>');
html=html.slice(0,i)+'window.__review={THREE,camera,controls,scene,car,parts,plinth,floor,contactPlane,bakeContactShadow,renderer,renderFrame};'+html.slice(i);
const mime={'.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.wasm':'application/wasm','.png':'image/png'};
const server=createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/'||pathname==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(pathname==='/model/manifest.json'||pathname==='/model/wheels.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(pathname.endsWith('manifest.json')?manifest:wheels));return;}
 if(pathname==='/__review_candidate.glb'){res.setHeader('Content-Type','model/gltf-binary');res.end(candidate);return;}
 const root=pathname.startsWith('/three/')?path.join(deps,'node_modules/three'):repo;
 const file=path.resolve(root,pathname.startsWith('/three/')?pathname.slice(7):pathname.slice(1));
 if(!file.startsWith(root+path.sep))throw Error('Path outside asset root');
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch(e){res.writeHead(404);res.end(e.message);}});
await fs.mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const errors=[],captures=[];
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});
 await page.waitForFunction(()=>!!window.__review&&!!window.lcWorkshop,null,{timeout:120000});
 await page.evaluate(()=>lcBuild.setState({rim:'kmc',tyre:'stock'}));
 await page.evaluate(()=>{window.__reviewPaused=true;cancelAnimationFrame(window.__reviewRAF);});
 async function capture(name,settings){
  const result=await page.evaluate(({name,settings})=>{
   const t=__review,THREE=t.THREE;
   if(settings.mode==='car'){
    t.car.visible=true;t.controls.target.set(.02,.96,0);t.camera.position.set(-7.73,2.84,8.22);
   }else{
    if(!window.__reviewBeauty){
     const hub=lcBuild.getManifest().slots.wheel_FL.pivot,shift=(lcWorkshop.wheels.vehicle.stockOffset_mm-lcWorkshop.wheels.rims.find(r=>r.id==='kmc').offset_mm)/1000;
     const group=new THREE.Group(),rim=lcBuild.parts.get('rim_FL_disc').clone(true),tyre=lcBuild.parts.get('wheel_FL').clone(true);
     rim.visible=true;tyre.visible=true;tyre.traverse(n=>{if(n.isMesh)n.visible=n.material.userData.zone==='tyre';});
     group.add(rim,tyre);t.scene.add(group);window.__reviewBeauty={group,rim,tyre,hub,shift};
    }
    const b=__reviewBeauty;t.car.visible=false;b.group.visible=true;
    const wheel=settings.mode==='wheel',centre=wheel?.39655:.231;
    b.rim.position.set(0,centre,0);b.tyre.position.set(-b.hub[0],centre-b.hub[1],-b.hub[2]-b.shift);b.tyre.visible=wheel;
    b.rim.traverse(n=>{if(n.isMesh)n.visible=wheel||!['tyre','brake','hat','caliper','backing','brake_detail','hub_metal'].includes(n.material.userData.zone);});
    t.controls.target.set(0,wheel?.42:.245,0);
    const yaw=settings.yaw*Math.PI/180,pitch=settings.pitch*Math.PI/180,d=settings.distance;
    t.camera.position.copy(t.controls.target).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*d,Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d));
   }
   t.plinth.visible=false;t.floor.visible=false;t.contactPlane.visible=true;
   t.camera.near=.02;t.camera.far=40;t.camera.clearViewOffset();t.camera.lookAt(t.controls.target);t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);t.scene.updateMatrixWorld(true);t.bakeContactShadow();t.renderFrame();
   return{png:t.renderer.domElement.toDataURL('image/png'),name,settings,camera:{position:t.camera.position.toArray(),target:t.controls.target.toArray(),fov:t.camera.fov},build:lcBuild.getState()};
  },{name,settings});
  const png=Buffer.from(result.png.split(',')[1],'base64');delete result.png;
  await sharp(png).flatten({background:'#eeeeec'}).png().toFile(path.join(out,name+'.png'));
  captures.push({...result,assetSha256:sourceSha256});console.log('CAPTURED',name);
 }
 await capture('on-car',{mode:'car'});
 await capture('wheel',{mode:'wheel',yaw:-25,pitch:12,distance:3.1});
 await capture('front',{mode:'bare',yaw:0,pitch:0,distance:1.65});
 await capture('quarter',{mode:'bare',yaw:-30,pitch:10,distance:1.75});
 await capture('opposite-quarter',{mode:'bare',yaw:30,pitch:10,distance:1.75});
 await capture('steep-quarter',{mode:'bare',yaw:-45,pitch:25,distance:1.85});
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
}finally{
 await fs.writeFile(path.join(out,'captures.json'),JSON.stringify({candidate:path.join(work,'parts/rim_FL_disc.glb'),assetSha256:sourceSha256,viewerSha256,approval:'unapproved; transient test catalogue only',renderer:'Chromium/SwiftShader; pinned Three.js 0.166.1',neutralStudy:neutral?{zones:neutralZones,materialOverride:neutralFinish,lightsAndGeometryUnchanged:true}:false,captures,errors},null,2)+'\n');
 await browser?.close();await new Promise(r=>server.close(r));
}
