// Self-test for validate_part.mjs: builds two throwaway GLBs in a temp folder
// (a box on the roof mount, and the same box 5 cm off it with a bad material)
// and expects the first to pass and the second to fail.
// Usage: node tools/workshop/validate_selftest.mjs DEPS TMPDIR
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {repo} from './page.mjs';

const [deps,tmp]=process.argv.slice(2);
const require=createRequire(path.join(deps,'package.json'));
const {Document,NodeIO}=require('@gltf-transform/core');
const workshop=JSON.parse(await fs.readFile(path.join(repo,'model/workshop.json'),'utf8'));
await fs.mkdir(tmp,{recursive:true});
async function box(id,pos,zone){
 const doc=new Document(),buffer=doc.createBuffer();
 const p=[],n=[],c=[],idx=[];
 const faces=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]],h=[1.0,0.04,0.6];
 for(const f of faces){const base=p.length/3,a=f.findIndex(v=>v),u=[(a+1)%3,(a+2)%3];
  for(const [s,t] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const v=[0,0,0];v[a]=f[a]*h[a];v[u[0]]=s*h[u[0]];v[u[1]]=t*h[u[1]];p.push(...v);n.push(...f);c.push(255,128,0);}
  idx.push(base,base+1,base+2,base,base+2,base+3);}
 const acc=(name,arr,type,norm=false)=>doc.createAccessor(name,buffer).setType(type).setArray(arr).setNormalized(norm);
 const prim=doc.createPrimitive().setAttribute('POSITION',acc('P',new Float32Array(p),'VEC3')).setAttribute('NORMAL',acc('N',new Float32Array(n),'VEC3'))
  .setAttribute('COLOR_0',acc('C',new Uint8Array(c),'VEC3',true)).setIndices(acc('I',new Uint16Array(idx),'SCALAR')).setMaterial(doc.createMaterial(zone));
 doc.createScene().addChild(doc.createNode(id).setTranslation(pos).setMesh(doc.createMesh(id).addPrimitive(prim)));
 const file=path.join(tmp,id+'.glb');await new NodeIO().write(file,doc);return file;
}
const run=file=>{try{execFileSync(process.execPath,[path.join(repo,'tools/workshop/validate_part.mjs'),file,'--mount','roof','--deps',deps],{stdio:'pipe'});return true;}catch{return false;}};
const roof=workshop.mounts.roof.pos;
const good=await box('test_rack_ok',[roof[0],roof[1]+.05,roof[2]].map((v,i)=>i===1?roof[1]:v),'black');
const bad=await box('test_rack_bad',[roof[0],roof[1]+.05,roof[2]],'shiny_purple');
const okPass=run(good),badPass=run(bad);
console.log(okPass?'PASS':'FAIL','box on the roof mount passes');
console.log(!badPass?'PASS':'FAIL','box 5 cm off the mount with an unknown material fails');
process.exit(okPass&&!badPass?0:1);
