// Standalone, hub-pivoted rim parts; never rewrites an existing GLB.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const[repo,deps,work]=process.argv.slice(2),require=createRequire(deps+'/package.json'),imp=n=>import(pathToFileURL(require.resolve(n)).href);
const{Document,NodeIO}=await imp('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=await imp('@gltf-transform/extensions'),{MeshoptEncoder,MeshoptDecoder}=await imp('meshoptimizer'),{weld,dedup}=await imp('@gltf-transform/functions');await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const data=JSON.parse(await fs.readFile(work+'/rim-data.json')),manifest=JSON.parse(await fs.readFile(repo+'/model/manifest.json')),style=data.style;
const names={disc:'Dished disc · satin black',steel:'Round-hole steel · silver',window:'Eight-window · satin black'};
const rimFinish={disc:{color:'#555b60',roughness:.38,metalness:.70,envMapIntensity:1.6},steel:{color:'#c4c9cc',roughness:.36,metalness:.65,envMapIntensity:2.8},window:{color:'#454a4f',roughness:.40,metalness:.70,envMapIntensity:1.8}};
const defaults={rim:rimFinish[style],chrome:{color:'#858c92',roughness:.34,metalness:.85,envMapIntensity:.95},black:{color:'#242629',roughness:.85,metalness:0,envMapIntensity:.18}},report=[];
// Keep the previous tyre review assets in the repo, loading optional variants only on demand.
for(const p of manifest.parts)if(/^wheel_(FL|FR|RL|RR)_/.test(p.id))p.lazy=true;
for(const corner of ['FL','FR','RL','RR']){
 const slot='rim_'+corner,id=slot+'_'+style,pivot=manifest.slots['wheel_'+corner].pivot,sign=corner.endsWith('R')?-1:1;
 manifest.slots[slot]??={default:null,pivot,rigidClass:'wheel'};
 const doc=new Document(),buffer=doc.createBuffer(),root=doc.createNode(id).setTranslation(pivot),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const[zone,g]of Object.entries(data.groups)){
  const P=new Float32Array(g.positions),N=new Float32Array(g.normals),C=new Float32Array(g.colors),I=Uint32Array.from({length:P.length/3},(_,i)=>i);
  if(sign<0){for(let i=2;i<P.length;i+=3){P[i]*=-1;N[i]*=-1;}for(let i=0;i<I.length;i+=3)[I[i+1],I[i+2]]=[I[i+2],I[i+1]];}
  for(let i=0;i<P.length;i+=3)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],P[i+j]+pivot[j]);hi[j]=Math.max(hi[j],P[i+j]+pivot[j]);}
  const acc=(name,a,type)=>doc.createAccessor(name,buffer).setArray(a).setType(type),color=defaults[zone].color.match(/\w\w/g).map(v=>parseInt(v,16)/255),mat=doc.createMaterial(zone).setBaseColorFactor([...color,1]).setMetallicFactor(defaults[zone].metalness).setRoughnessFactor(defaults[zone].roughness).setExtras({zone});
  const prim=doc.createPrimitive().setMaterial(mat).setAttribute('POSITION',acc(zone+'_position',P,'VEC3')).setAttribute('NORMAL',acc(zone+'_normal',N,'VEC3')).setAttribute('COLOR_0',acc(zone+'_ao_curvature',C,'VEC3')).setIndices(acc(zone+'_indices',I,'SCALAR'));
  root.addChild(doc.createNode(zone).setMesh(doc.createMesh(zone).addPrimitive(prim)));
 }
 doc.createScene().addChild(root);await doc.transform(weld(),dedup());doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 const url='parts/'+id+'.glb';await io.write(repo+'/model/'+url,doc);
 const entry={id,slot,url,rootNode:id,pivot,rigidClass:'wheel',zones:Object.keys(data.groups),triangles:data.triangles,bounds:{min:lo,max:hi},beadSeat_mm:431.8,width_in:data.width_in,boltPattern:data.boltPattern,centreBore_mm:data.centreBore_mm,lazy:true,replacesWheelHardware:'wheel_'+corner,materialDefaults:defaults,bundlesSlots:['wheel_emblem_'+corner],purpose:names[style]+'; reference-inspired unbranded 17-inch rim; tyre and brake retained'};
 const index=manifest.parts.findIndex(p=>p.id===id);if(index<0)manifest.parts.push(entry);else manifest.parts[index]=entry;
 report.push({id,triangles:data.triangles,pivot,bytes:(await fs.stat(repo+'/model/'+url)).size,bounds:entry.bounds});
}
await fs.writeFile(repo+'/model/manifest.json',JSON.stringify(manifest,null,2)+'\n');
// Integrate with the current native Tyres/Rims catalogue; its fit rules and offsets are retained.
const wheels=JSON.parse(await fs.readFile(repo+'/model/wheels.json'));
const catId={disc:'kmc',steel:'steel',window:'method'}[style],rim=wheels.rims.find(r=>r.id===catId);
Object.assign(rim,{built:true,label:names[style],color:rimFinish[style].color,assetId:'rim_FL_'+style,sourceNote:'Reference-inspired face, adapted to the configured LC200 5x150 mount; not manufacturer CAD'});
await fs.writeFile(repo+'/model/wheels.json',JSON.stringify(wheels,null,2)+'\n');
await fs.writeFile(work+'/asset-report.json',JSON.stringify({design:names[style],blender:data.blender,beadSeat_mm:data.beadSeat_mm,width_in:data.width_in,boltPattern:data.boltPattern,centreBore_mm:data.centreBore_mm,bake:data.bake,files:report},null,2)+'\n');console.log(style,data.triangles,report.reduce((a,b)=>a+b.bytes,0)+' bytes');
