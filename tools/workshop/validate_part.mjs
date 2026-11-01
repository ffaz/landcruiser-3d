// Fit checker for incoming workshop parts (props such as a bull bar or roof rack).
// Checks a GLB against the house rules and a mount in model/workshop.json before it
// is registered in the manifest. Read-only; prints a JSON report; exit 1 on failure.
// Usage: node tools/workshop/validate_part.mjs PART.glb --mount NAME --deps DEPS [--max-tris 15000]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {repo} from './page.mjs';

const args=process.argv.slice(2),flag=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const file=args.find(a=>a.endsWith('.glb')),mountName=flag('mount'),deps=flag('deps',process.env.LC200_VISUAL_DEPS),maxTris=Number(flag('max-tris',15000));
if(!file||!mountName||!deps)throw Error('Usage: validate_part.mjs PART.glb --mount NAME --deps DEPS [--max-tris N]');
const require=createRequire(path.join(deps,'package.json'));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),{MeshoptDecoder}=require('meshoptimizer');
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const workshop=JSON.parse(await fs.readFile(path.join(repo,'model/workshop.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8'));
const zones=new Set([manifest.base,...manifest.parts].flatMap(p=>p.zones||[]));
const mount=workshop.mounts[mountName];
const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
check('mount exists',!!mount,mountName);
const doc=await io.read(file),root=doc.getRoot(),scene=root.getDefaultScene()||root.listScenes()[0];
const roots=scene?scene.listChildren():[];
check('single root node',roots.length===1,`${roots.length} roots`);
const id=path.basename(file,'.glb');
check('root named after the file (part id)',roots[0]?.getName()===id,roots[0]?.getName());

// World-space bounds and per-primitive checks
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let tris=0;const badZones=new Set(),missing=new Set();
const mul=(m,v)=>[0,1,2].map(r=>m[r]*v[0]+m[r+4]*v[1]+m[r+8]*v[2]+m[r+12]);
for(const node of root.listNodes()){const mesh=node.getMesh();if(!mesh)continue;const world=node.getWorldMatrix();
 for(const prim of mesh.listPrimitives()){
  const pos=prim.getAttribute('POSITION'),idx=prim.getIndices();
  tris+=(idx?idx.getCount():pos.getCount())/3;
  for(const semantic of ['NORMAL','COLOR_0'])if(!prim.getAttribute(semantic))missing.add(semantic);
  const material=prim.getMaterial(),zone=material?.getExtras()?.zone??material?.getName()?.replace(/\.\d+$/,'').toLowerCase();
  if(!zones.has(zone))badZones.add(material?.getName()||'(none)');
  const v=[0,0,0];for(let i=0;i<pos.getCount();i++){pos.getElement(i,v);const w=mul(world,v);for(let k=0;k<3;k++){if(!Number.isFinite(w[k]))throw Error('Non-finite position');min[k]=Math.min(min[k],w[k]);max[k]=Math.max(max[k],w[k]);}}
 }
}
const size=max.map((v,i)=>v-min[i]);
check('has geometry',tris>0,`${tris} triangles`);
check(`triangle budget ≤ ${maxTris}`,tris<=maxTris,`${tris}`);
check('metres (largest side 0.01–3.0 m)',Math.max(...size)>=.01&&Math.max(...size)<=3,size.map(v=>v.toFixed(3)).join(' × '));
check('NORMAL and COLOR_0 on every primitive (baked AO/curvature)',missing.size===0,[...missing].join(', ')||'ok');
check('materials use known zones',badZones.size===0,badZones.size?[...badZones].join(', ')+' — allowed: '+[...zones].join(', '):'ok');
if(mount){
 const t=roots[0]?.getTranslation()||[NaN,NaN,NaN],off=Math.hypot(...t.map((v,i)=>v-mount.pos[i]));
 check('root translation on the mount point (±2 mm)',off<=.002,`${(off*1000).toFixed(1)} mm from ${JSON.stringify(mount.pos)}`);
 const inside=[0,1,2].every(i=>min[i]>=mount.envelope.min[i]-1e-6&&max[i]<=mount.envelope.max[i]+1e-6);
 check('inside the mount envelope',inside,`min ${min.map(v=>v.toFixed(3))} max ${max.map(v=>v.toFixed(3))}`);
 const body=manifest.base.bounds;
 check('does not change the locked body length (stays within x −2.90…+2.85)',min[0]>=-2.90&&max[0]<=2.85,`${min[0].toFixed(3)}…${max[0].toFixed(3)}`);
 void body;
}
const report={file:path.relative(repo,path.resolve(file)),id,mount:mountName,triangles:tris,bounds:{min,max},
 manifestEntry:mount?{id,slot:id,url:'parts/'+path.basename(file),rootNode:id,pivot:roots[0]?.getTranslation(),rigidClass:'body',mount:mountName,triangles:tris,bounds:{min,max}}:null,
 checks,pass:checks.every(c=>c.ok)};
console.log(JSON.stringify(report,null,1));
process.exit(report.pass?0:1);
