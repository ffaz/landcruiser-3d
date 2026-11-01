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
const out={...base,arches:{method:'Rays from each hub centre in the side plane (10°–170° from straight ahead), across the tyre width; nearest non-wheel surface. tools/workshop/measure_arches.mjs',...arches}};
await fs.writeFile(path.join(repo,'model/workshop.json'),JSON.stringify(out,null,1)+'\n');
console.log('wrote model/workshop.json',Object.keys(out.mounts).length,'mounts',out.categories.length,'categories');
