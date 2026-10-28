// New lamp variants only: original GLBs, positions, indices and COLOR_0 are never edited.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const deps=process.argv[2]||process.env.LC200_VISUAL_DEPS||'/tmp/lc200-visual-deps',require=createRequire(path.join(deps,'package.json'));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=require('@gltf-transform/extensions'),{MeshoptDecoder,MeshoptEncoder}=require('meshoptimizer');
const {Vector3,Matrix3,Matrix4}=await import(pathToFileURL(path.join(deps,'package/build/three.module.js')).href);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8')),report=[];
const scale=a=>a instanceof Int16Array?32767:a instanceof Int8Array?127:a instanceof Uint16Array?65535:a instanceof Uint8Array?255:1;
for(const side of ['L','R']){
 const originalId='lamp_rear_'+side,id=originalId+'_finish',entry=manifest.parts.find(p=>p.id===originalId),src=path.join(repo,'model',entry.url);
 const doc=await io.read(src),record={id,source:entry.url,sourcePositionsExact:true,sourceColor0Exact:true,sourceTriangleTopologyExact:true,repair:'angle-weighted geometric normals, 1 micrometre position bins, 65 degree crease threshold',primitives:[]};
 for(const node of doc.getRoot().listNodes())if(node.getMesh())for(const prim of node.getMesh().listPrimitives()){
  if(!/^(redglass|clearglass|chrome)/i.test(prim.getMaterial()?.getName()||''))continue;
  const p=prim.getAttribute('POSITION'),a=p.getArray(),s=p.getNormalized()?scale(a):1,n=p.getCount(),idx=prim.getIndices().getArray(),M=new Matrix4().fromArray(node.getWorldMatrix()),world=[];
  const groups=new Map(),incident=Array.from({length:n},()=>[]),faces=[];
  for(let i=0;i<n;i++){const v=new Vector3(...Array.from(a.subarray(i*3,i*3+3),x=>s===1?x:Math.max(-1,x/s))).applyMatrix4(M);world.push(v);const key=v.toArray().map(x=>Math.round(x*1e6)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
  for(let k=0;k<idx.length;k+=3){const ids=Array.from(idx.subarray(k,k+3)),[A,B,C]=ids.map(i=>world[i]);const norm=new Vector3().crossVectors(B.clone().sub(A),C.clone().sub(A)).normalize();if(norm.lengthSq()<.5)continue;const fi=faces.length;faces.push({normal:norm,weights:ids.map((id,j)=>{const v=world[id],u=world[ids[(j+1)%3]].clone().sub(v).normalize(),w=world[ids[(j+2)%3]].clone().sub(v).normalize();return Math.acos(Math.max(-1,Math.min(1,u.dot(w))))})});ids.forEach((id,j)=>incident[id].push([fi,j]));}
  const normalArray=new Float32Array(n*3),transpose=new Matrix3().setFromMatrix4(M).transpose(),threshold=Math.cos(65*Math.PI/180);
  for(const ids of groups.values()){
   const all=[...new Map(ids.flatMap(i=>incident[i]).map(([f,j])=>[f,[f,j]])).values()];
   for(const i of ids){let ref=new Vector3();for(const[f,j]of incident[i])ref.addScaledVector(faces[f].normal,faces[f].weights[j]);ref.normalize();let sum=new Vector3();for(const[f,j]of all)if(ref.dot(faces[f].normal)>=threshold)sum.addScaledVector(faces[f].normal,faces[f].weights[j]);if(sum.lengthSq()<1e-15)sum.copy(ref);sum.normalize().applyMatrix3(transpose).normalize();normalArray.set(sum.toArray(),i*3);}
  }
  const old=prim.getAttribute('NORMAL');prim.setAttribute('NORMAL',doc.createAccessor(id+'_smooth_lens_normals',p.getBuffer()).setType('VEC3').setArray(normalArray));
  record.primitives.push({node:node.getName(),vertices:n,triangles:idx.length/3,oldComponentType:old.getComponentType(),newComponentType:5126});
 }
 const url='parts/'+id+'.glb';doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});await io.write(path.join(repo,'model',url),doc);
 const copy=await io.read(path.join(repo,'model',url));const primitives=d=>d.getRoot().listMeshes().flatMap(m=>m.listPrimitives());const old=primitives(await io.read(src)),now=primitives(copy);
 for(let i=0;i<old.length;i++){for(const semantic of ['POSITION','COLOR_0']){const x=old[i].getAttribute(semantic),y=now[i].getAttribute(semantic);if(!Buffer.from(x.getArray().buffer,x.getArray().byteOffset,x.getArray().byteLength).equals(Buffer.from(y.getArray().buffer,y.getArray().byteOffset,y.getArray().byteLength)))throw Error('Changed '+semantic+' in new lamp copy');}const ia=old[i].getIndices().getArray(),ib=now[i].getIndices().getArray();if(ia.length!==ib.length)throw Error('Changed topology');for(let k=0;k<ia.length;k+=3)if(![0,1,2].some(r=>ia[k]===ib[k+r]&&ia[k+1]===ib[k+(r+1)%3]&&ia[k+2]===ib[k+(r+2)%3]))throw Error('Changed triangle topology');}
 const addition={...entry,id,url,rootNode:originalId,classification:'Base-finish variant: identical opening/positions/COLOR_0; repaired lens/reflector normals on this new copy only',derivedFrom:originalId};delete addition.componentIds;
 manifest.parts=manifest.parts.filter(p=>p.id!==id);manifest.parts.push(addition);manifest.slots[entry.slot].default=id;
 record.bytes=(await fs.stat(path.join(repo,'model',url))).size;report.push(record);
}
await fs.writeFile(path.join(repo,'model/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const build=JSON.parse(await fs.readFile(path.join(repo,'build.json'),'utf8'));for(const s of ['L','R'])build.slots['lamp_rear_'+s]='lamp_rear_'+s+'_finish';await fs.writeFile(path.join(repo,'build.json'),JSON.stringify(build,null,2)+'\n');
await fs.mkdir(path.join(repo,'docs/base-finish'),{recursive:true});await fs.writeFile(path.join(repo,'docs/base-finish/lamp-variants.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
