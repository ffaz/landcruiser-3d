// Exercise independent approved tyre/rim selection in the real viewer.
// node tools/workshop/approved-wheels.mjs DEPS CHROMIUM OUTPUT
import fs from 'node:fs/promises';
import {openViewer} from './page.mjs';
const[deps,chromium,out]=process.argv.slice(2),v=await openViewer({deps,chromium}),checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
try{
 const {page}=v;await page.waitForFunction(()=>!!window.lcWorkshop);
 check('KMC remains unapproved',await page.evaluate(()=>lcWorkshop.wheels.rims.find(r=>r.id==='kmc').built===false));
 check('KMC cannot be installed',await page.evaluate(()=>lcBuild.setState({rim:'kmc'}).then(()=>false,()=>true)));
 const tyres=['stock','at285','at26575','at28565','at26570','ht26570'];
 for(const tyre of tyres)for(const rim of ['stock','method','steel']){
  await page.evaluate(async({tyre,rim})=>{await lcBuild.setState({tyre,rim});},{tyre,rim});
  const result=await page.evaluate(()=>{
   const state=lcBuild.getState(),root=lcBuild.groups.wheels.getObjectByName('Workshop tyres and rims'),corners=[];
   for(const corner of root.children){const meshes=[];corner.traverseVisible(n=>{if(n.isMesh)meshes.push({zone:n.material.userData.zone,component:n.userData.wheelComponent,piece:n.userData.piece});});corners.push({name:corner.name,meshes});}
   const stock=[];for(const c of ['FL','FR','RL','RR']){const meshes=[];lcBuild.parts.get('wheel_'+c).traverse(n=>{if(n.isMesh&&!n.userData.pickOverlay)meshes.push({zone:n.material.userData.zone,visible:n.visible});});stock.push(meshes);}
   const fit=lcWorkshop.fitCheck(),spec=lcWorkshop.wheels.tyres.find(t=>t.id===state.tyre);
   return{state,corners,stock,mount:fit.wheel.mount.ok,diameter:lcBuild.tyreDiameterMM(),expected:spec.od_mm,rise:lcBuild.groups.wheels.position.y,body:lcBuild.groups.body.position.y};
  });
  const key=tyre+'/'+rim;
  check(key+' selects independently',result.state.tyre===tyre&&result.state.rim===rim);
  check(key+' fits the hub and rim',result.mount);
  check(key+' uses measured tyre rise',Math.abs(result.diameter-result.expected)<.001&&Math.abs(result.rise-(result.expected-793)/2000)<1e-8&&result.body===result.rise,result);
  check(key+' installs four corners',result.corners.length===(tyre==='stock'&&rim==='stock'?0:4));
  for(const corner of result.corners){
   check(key+' '+corner.name+' rubber only from tyre asset',corner.meshes.filter(m=>m.component==='tyre').every(m=>m.zone==='tyre'&&m.piece==='tyres'),corner);
   check(key+' '+corner.name+' correct selected components',(tyre==='stock'||corner.meshes.some(m=>m.component==='tyre'))&&(rim==='stock'?!corner.meshes.some(m=>m.component==='rim'):corner.meshes.some(m=>m.component==='rim')),corner);
  }
  check(key+' stock rubber and hardware visibility',result.stock.every(meshes=>meshes.every(m=>m.visible===(m.zone==='tyre'?tyre==='stock':m.zone==='brake'||rim==='stock'))),result.stock);
 }
 await page.evaluate(()=>lcBuild.setState({tyre:'at26570',rim:'method',lift_mm:50,look:{tyres:{material:'matte',color:'#222222'},rims:{material:'satin',color:'#889099'}}}));
 check('lift adds to tyre rise',await page.evaluate(()=>Math.abs(lcBuild.groups.body.position.y-lcBuild.groups.wheels.position.y-.05)<1e-8));
 check('looks apply separately',await page.evaluate(()=>{const colors={};lcBuild.groups.wheels.getObjectByName('Workshop tyres and rims').traverseVisible(n=>{if(n.isMesh&&n.userData.wheelComponent)colors[n.userData.piece]=n.material.color.getHexString();});return colors.tyres==='222222'&&colors.rims==='889099';}));
 await page.evaluate(()=>lcBuild.setState({hidden:['tyres']}));
 check('remove rubber leaves rims visible',await page.evaluate(()=>{const shown=[];lcBuild.groups.wheels.getObjectByName('Workshop tyres and rims').traverseVisible(n=>{if(n.isMesh)shown.push(n.userData.wheelComponent);});return shown.includes('rim')&&!shown.includes('tyre');}));
 await page.evaluate(()=>lcBuild.setState({hidden:[]}));
 await page.click('#workshopToggle');await page.click('#workshop [data-cat=tyres]');
 check('all approved tyres available in UI',await page.evaluate(()=>['at285','at26575','at28565','at26570','ht26570'].every(id=>{const b=document.querySelector('#workshop [data-opt='+id+']');return b&&!b.disabled;})));
 await page.click('#workshop [data-home]');await page.click('#workshop [data-cat=rims]');
 check('approved rims available, KMC disabled in UI',await page.evaluate(()=>['method','steel'].every(id=>!document.querySelector('#workshop [data-opt='+id+']').disabled)&&document.querySelector('#workshop [data-opt=kmc]').disabled));
 const share=await page.evaluate(()=>lcWorkshop.shareState(lcBuild.getState()));
 await page.evaluate(()=>lcBuild.replaceState({}));await page.evaluate(s=>lcBuild.replaceState(s),share);
 check('shared tyre/rim choices restore',await page.evaluate(()=>lcBuild.getState().tyre==='at26570'&&lcBuild.getState().rim==='method'));
 await page.evaluate(()=>lcBuild.replaceState({}));
 check('reset restores original wheels',await page.evaluate(()=>lcBuild.getState().tyre==='stock'&&lcBuild.getState().rim==='stock'&&lcBuild.groups.wheels.getObjectByName('Workshop tyres and rims').children.length===0));
 check('no browser errors',v.errors.length===0,v.errors);
 console.log(checks.length+'/'+checks.length+' approved wheel checks pass');
}finally{if(out)await fs.writeFile(out,JSON.stringify({checks,errors:v.errors},null,2));await v.close();}
