// Lazy, parts-based wheel kit. Stock tyre/brake meshes stay in the viewer;
// the new rim is cloned rigidly to each hub. No vertex edits, maps or new passes.
import * as THREE from 'three';
const rims=new Map();
export async function prepare(tyre,rim,{loadRim}={}){
 if(tyre.id!=='stock')throw Error('This tyre model has not been integrated yet');
 if(rim.id==='stock'||rims.has(rim.id))return;
 if(!rim.assetId||!loadRim)throw Error('Rim asset is missing: '+rim.id);
 rims.set(rim.id,await loadRim(rim.assetId));
}
export function corner(tyre,rim,stockOffset_mm){
 const group=new THREE.Group();
 if(rim.id!=='stock'){
  const source=rims.get(rim.id);if(!source)throw Error('Rim was not prepared: '+rim.id);
  const part=source.clone(true);part.visible=true;
  part.position.set(0,0,(stockOffset_mm-rim.offset_mm)/1000);
  group.add(part);
 }
 return group;
}
