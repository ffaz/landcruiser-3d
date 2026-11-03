// Native catalogue integration: lazy rim loading, stock tyre/brake preservation,
// rigid offset shifts, all studios, original rim restoration, reset and sharing.
import fs from 'node:fs/promises';import{openViewer}from'../workshop/page.mjs';
const[deps,chromium,output]=process.argv.slice(2),v=await openViewer({deps,chromium}),results=[];
const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
try{
 const{page}=v;await page.waitForFunction(()=>!!window.lcWorkshop);
 await page.evaluate(()=>{
  window.__tyreHash=root=>{let h=2166136261;root.traverse(n=>{if(!n.isMesh||n.material.userData.zone!=='tyre')return;for(const a of Object.values(n.geometry.attributes)){const b=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);for(const x of b)h=Math.imul(h^x,16777619);}});return h>>>0;};
  window.__tyreHashes=Object.fromEntries(['FL','FR','RL','RR'].map(c=>['wheel_'+c,__tyreHash(lcBuild.parts.get('wheel_'+c))]));
  window.__inspectRims=()=>{const state=lcBuild.getState(),report=[];for(const c of ['FL','FR','RL','RR']){const id='wheel_'+c,root=lcBuild.parts.get(id),meshes=[];root.traverse(n=>{if(n.isMesh&&n.material.userData.partId===id)meshes.push({zone:n.material.userData.zone,visible:n.visible,z:n.position.z,stockZ:n.userData.stockZ});});report.push({corner:c,tyreUnchanged:__tyreHash(root)===__tyreHashes[id],tyreVisible:meshes.filter(m=>m.zone==='tyre').every(m=>m.visible),brakeVisible:meshes.filter(m=>m.zone==='brake').every(m=>m.visible),oldHardwareVisible:meshes.some(m=>!['tyre','brake'].includes(m.zone)&&m.visible),tyreShift:meshes.filter(m=>m.zone==='tyre').map(m=>m.z-m.stockZ)});}return{state,report,fit:lcWorkshop.fitCheck(),custom:lcBuild.groups.wheels.getObjectByName('Workshop tyres and rims').children.length};};
 });
 const base=await page.evaluate(()=>lcBuild.getState());
 check('default has no custom rim loaded',await page.evaluate(()=>![...lcBuild.parts.keys()].some(id=>id.startsWith('rim_'))));
 await page.click('#workshopToggle');await page.click('#workshop [data-cat=rims]');
 for(const [id,shift]of [['kmc',.042],['steel',.035],['method',.060]]){
  await page.click('#workshop [data-opt='+id+']');await page.waitForFunction(id=>lcBuild.getState().rim===id,id,{timeout:120000});
  const p=await page.evaluate(()=>__inspectRims());
  check(id+' installs four rim copies',p.custom===4&&p.state.rim===id,p);
  check(id+' keeps tyre and brake buffers',p.state.tyre==='stock'&&p.report.every(r=>r.tyreUnchanged&&r.tyreVisible&&r.brakeVisible&&!r.oldHardwareVisible),p.report);
  check(id+' applies configured rigid offset',p.report.every(r=>r.tyreShift.every(x=>Math.abs(Math.abs(x)-shift)<1e-6)),p.report);
  check(id+' passes catalogue hub/width fit',p.fit.wheel.mount.ok&&p.fit.wheel.rim.boltPattern==='5x150',p.fit.wheel);
 }
 for(let i=0;i<3;i++){await page.click('#bgToggle');const p=await page.evaluate(()=>({studio:document.body.dataset.studio,...__inspectRims()}));check(p.studio+' preserves custom rims and tyres',p.custom===4&&p.report.every(r=>r.tyreUnchanged&&r.tyreVisible&&!r.oldHardwareVisible),p);}
 await page.click('#workshop [data-opt=stock]');await page.waitForFunction(()=>lcBuild.getState().rim==='stock');
 const restored=await page.evaluate(()=>__inspectRims());
 check('original rim restores hardware and tyre offset',restored.custom===0&&restored.report.every(r=>r.oldHardwareVisible&&r.tyreUnchanged&&r.tyreVisible&&r.tyreShift.every(x=>x===0)),restored);
 await page.click('#workshop [data-opt=steel]');await page.waitForFunction(()=>lcBuild.getState().rim==='steel');
 await page.click('#workshop [data-home]');await page.click('#workshop [data-share]');
 check('share carries native rim state',await page.evaluate(()=>decodeURIComponent(location.hash).includes('"rim":"steel"')));
 await page.click('#workshop [data-sheet]');await page.click('#workshop [data-reset]');await page.waitForFunction(()=>lcBuild.getState().rim==='stock');
 check('reset restores complete stock state',JSON.stringify(await page.evaluate(()=>lcBuild.getState()))===JSON.stringify(base));
 check('no console errors',v.errors.length===0,v.errors);
}finally{await v.close();await fs.writeFile(output,JSON.stringify({results,consoleErrors:v.errors},null,2)+'\n');}
console.log(results.length+'/'+results.length+' native-rim checks passed');
