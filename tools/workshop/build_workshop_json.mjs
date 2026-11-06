// Writes model/workshop.json: the hand-authored catalog and mounts in
// workshop-base.json plus the measured arch profiles.
// Usage: node tools/workshop/build_workshop_json.mjs ARCHES.json
import fs from 'node:fs/promises';
import path from 'node:path';
import {repo} from './page.mjs';

const base=JSON.parse(await fs.readFile(path.join(repo,'tools/workshop/workshop-base.json'),'utf8'));
const arches=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8'));
for(const [name,mount]of Object.entries(base.mounts))if(!manifest.slots[mount.parentSlot])throw Error(`Mount ${name}: unknown parent slot ${mount.parentSlot}`);
const zonesOf=slot=>new Set([manifest.base,...manifest.parts].filter(p=>p.slot===slot).flatMap(p=>p.zones));
const takenIds=new Set([...Object.keys(manifest.slots),manifest.base.id,...manifest.parts.map(p=>p.id)]);
const pieceIds=new Set();
for(const piece of base.pieces||[]){
 // Piece ids share state.hidden with slots and parts, so they must never collide.
 if(takenIds.has(piece.id))throw Error(`Piece ${piece.id}: id is also a slot or part id`);
 if(pieceIds.has(piece.id))throw Error(`Piece ${piece.id}: duplicate id`);pieceIds.add(piece.id);
 if(!piece.match?.length)throw Error(`Piece ${piece.id}: no match rules`);
 for(const rule of piece.match){
  if(!manifest.slots[rule.slot])throw Error(`Piece ${piece.id}: unknown slot ${rule.slot}`);
  for(const zone of rule.zones||[])if(!zonesOf(rule.slot).has(zone))throw Error(`Piece ${piece.id}: slot ${rule.slot} has no zone ${zone}`);
  if(rule.mesh)new RegExp(rule.mesh);
  for(const axis of ['x','y','z'])if(rule[axis]&&!(rule[axis].length===2&&rule[axis][0]<rule[axis][1]))throw Error(`Piece ${piece.id}: bad ${axis} range`);
 }
 if(piece.category&&!base.categories.some(c=>c.id===piece.category))throw Error(`Piece ${piece.id}: unknown category ${piece.category}`);
}
const out={...base,arches:{method:'Rays from each hub centre in the side plane (10°–170° from straight ahead), across the tyre width; nearest non-wheel surface. tools/workshop/measure_arches.mjs',...arches}};
await fs.writeFile(path.join(repo,'model/workshop.json'),JSON.stringify(out,null,1)+'\n');
console.log('wrote model/workshop.json',Object.keys(out.mounts).length,'mounts',out.categories.length,'categories');
