// Real UI and build API: independent rim selection, tyre preservation, restoration and studio changes.
import fs from 'node:fs/promises';
import {openViewer} from '../workshop/page.mjs';
const[deps,chromium,output]=process.argv.slice(2),viewer=await openViewer({deps,chromium}),results=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
try{
 const{page}=viewer;await page.waitForFunction(()=>!!window.lcWorkshop);
 await page.evaluate(()=>{
  window.__rimHash=root=>{let h=2166136261;root.traverse(n=>{if(!n.isMesh)return;const m=Array.isArray(n.material)?n.material:[n.material];if(!m.every(m=>m.userData.zone==='tyre'))return;for(const a of Object.values(n.geometry.attributes)){const b=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);for(const v of b)h=Math.imul(h^v,16777619);}});return h>>>0;};
  window.__rimTyreHashes=Object.fromEntries([...lcBuild.parts].filter(([id])=>/^wheel_(FL|FR|RL|RR)(_|$)/.test(id)).map(([id,p])=>[id,__rimHash(p)]));
  window.__rimInspect=()=>{const state=lcBuild.getState(),report=[];for(const c of ['FL','FR','RL','RR']){const id=state.slots['wheel_'+c],root=lcBuild.parts.get(id),rimId=state.slots['rim_'+c],rim=lcBuild.parts.get(rimId),meshes=[];root.traverse(n=>{if(n.isMesh&&n.material.userData.partId===id)meshes.push({zone:n.material.userData.zone,visible:n.visible});});report.push({corner:c,tyreUnchanged:__rimHash(root)===__rimTyreHashes[id],tyreVisible:meshes.filter(m=>m.zone==='tyre').every(m=>m.visible),brakeVisible:meshes.filter(m=>m.zone==='brake').every(m=>m.visible),oldHardwareVisible:meshes.some(m=>!['tyre','brake'].includes(m.zone)&&m.visible),rimVisible:!!rim?.visible,rim:rimId});}return{state,report,fit:lcWorkshop.fitCheck()};};
 });
 const base=await page.evaluate(()=>lcBuild.getState());
 await page.click('#workshopToggle');await page.click('#workshop [data-cat=rims]');
 for(const style of ['disc','steel','window']){
  await page.click('#workshop [data-opt=rim_'+style+']');
  const p=await page.evaluate(()=>__rimInspect());
  check(style+' UI installs all four rims',p.report.every(r=>r.rim==='rim_'+r.corner+'_'+style&&r.rimVisible),p.report);
  check(style+' retains stock tyres and brakes',p.report.every(r=>r.tyreUnchanged&&r.tyreVisible&&r.brakeVisible&&!r.oldHardwareVisible),p.report);
  check(style+' tyre size/ride unchanged',p.fit.tyre_mm===793&&p.state.lift_mm===0,p.fit);
 }
 await page.click('#workshop [data-opt=original_rim]');
 const restored=await page.evaluate(()=>__rimInspect());
 check('original rim restores stock hardware',restored.report.every(r=>r.oldHardwareVisible&&!r.rimVisible&&r.tyreUnchanged&&r.tyreVisible),restored.report);
 // Keep one rim selected while changing every available tyre package through the same patch function used by UI.
 await page.click('#workshop [data-opt=rim_steel]');
 const options=await page.evaluate(()=>{const m=new Set(lcBuild.getManifest().parts.map(e=>e.id));return lcWorkshop.data.categories.find(c=>c.id==='wheels').options.filter(o=>(o.requires||[]).every(id=>m.has(id))).map(o=>o.id);});
 for(const id of options){
  const p=await page.evaluate(async id=>{const c=lcWorkshop.data.categories.find(c=>c.id==='wheels');await lcBuild.setState(lcWorkshop.patchFor(c,c.options.find(o=>o.id===id)));return __rimInspect();},id);
  check(id+' tyre works with independent silver rim',p.report.every(r=>r.rim==='rim_'+r.corner+'_steel'&&r.rimVisible&&r.tyreVisible&&r.tyreUnchanged&&r.brakeVisible&&!r.oldHardwareVisible),p.report);
 }
 for(let i=0;i<3;i++){
  await page.click('#bgToggle');const p=await page.evaluate(()=>({studio:document.body.dataset.studio,...__rimInspect()}));
  check(p.studio+' preserves rim/tyre visibility',p.report.every(r=>r.rimVisible&&r.tyreVisible&&r.tyreUnchanged&&!r.oldHardwareVisible),p.report);
 }
 await page.click('#workshop [data-home]');await page.click('#workshop [data-sheet]');await page.click('#workshop [data-reset]');
 check('reset restores complete stock state',JSON.stringify(await page.evaluate(()=>lcBuild.getState()))===JSON.stringify(base));
 check('no console errors',viewer.errors.length===0,viewer.errors);
}finally{await viewer.close();await fs.writeFile(output,JSON.stringify({results,consoleErrors:viewer.errors},null,2)+'\n');}
console.log(results.length+'/'+results.length+' rim workshop checks passed');
