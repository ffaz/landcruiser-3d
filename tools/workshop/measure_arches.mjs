// Measures each wheel arch as a profile of hub-relative points, by casting rays
// from the hub centre outwards in the side plane against every non-wheel part
// of the stored model. The result feeds the workshop tyre/lift clearance check.
// Usage: node tools/workshop/measure_arches.mjs DEPS CHROME [OUT.json]
import fs from 'node:fs/promises';
import {openViewer} from './page.mjs';

const [deps,chromium,out]=process.argv.slice(2);
const viewer=await openViewer({deps,chromium});
const result=await viewer.page.evaluate(async()=>{
 const THREE=await import('/three/build/three.module.js');
 const manifest=window.lcBuild.getManifest(),parts=window.lcBuild.parts;
 const targets=[];
 for(const [id,root]of parts)if(!id.startsWith('wheel_')&&root.visible)root.traverse(o=>{if(o.isMesh)targets.push(o);});
 const raycaster=new THREE.Raycaster();
 const arches={};
 // Angles in the side plane, measured from straight ahead (towards the front, -x) over the top to the rear.
 const angles=Array.from({length:19},(_,i)=>10+i*(160/18));
 for(const wheel of ['wheel_FL','wheel_RL']){
  const hub=manifest.slots[wheel].pivot;
  // Sample across the tyre width; the arch lip and the liner both count.
  const zs=[hub[2]-0.12,hub[2]-0.06,hub[2],hub[2]+0.06,hub[2]+0.12];
  const profile=[];
  for(const deg of angles){
   const a=deg*Math.PI/180,dir=new THREE.Vector3(-Math.cos(a),Math.sin(a),0);
   let best=Infinity;
   for(const z of zs){
    raycaster.set(new THREE.Vector3(hub[0],hub[1],z),dir);raycaster.far=1.2;
    const hit=raycaster.intersectObjects(targets,false)[0];
    if(hit)best=Math.min(best,hit.distance);
   }
   if(Number.isFinite(best))profile.push([+(-Math.cos(a)*best).toFixed(4),+(Math.sin(a)*best).toFixed(4)]);
  }
  arches[wheel.endsWith('FL')?'front':'rear']={hub:[hub[0],hub[1]],sampledZ:zs.map(z=>+z.toFixed(4)),points:profile};
 }
 return arches;
});
await viewer.close();
console.log(JSON.stringify(result,null,1));
if(out)await fs.writeFile(out,JSON.stringify(result,null,1)+'\n');
