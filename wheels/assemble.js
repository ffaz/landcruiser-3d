// Approved catalogue assets load on demand. Tyre assets contribute rubber only;
// their bundled review rims and brakes are never installed.
import * as THREE from 'three';
const assets=new Map();
export async function prepare(tyre,rim,{loadAsset}){
 for(const item of [tyre,rim]){
  if(item.id==='stock'||assets.has(item.assetId))continue;
  if(!item.assetId)throw Error('Missing wheel asset: '+item.id);
  assets.set(item.assetId,await loadAsset(item.assetId));
 }
}
export function corner(tyre,rim,stockOffset_mm){
 const group=new THREE.Group(),shift=(stockOffset_mm-rim.offset_mm)/1000;
 for(const [item,rubberOnly]of [[tyre,true],[rim,false]]){
  if(item.id==='stock')continue;
  const source=assets.get(item.assetId);if(!source)throw Error('Wheel asset not prepared: '+item.id);
  const part=source.clone(true);part.visible=true;part.position.set(0,0,shift);
  part.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const zone=mesh.material.userData.zone;
   if(rubberOnly&&zone!=='tyre'){mesh.visible=false;return;}
   mesh.userData={...mesh.userData,piece:rubberOnly?'tyres':'rims',wheelComponent:rubberOnly?'tyre':'rim'};
  });
  group.add(part);
 }
 return group;
}
