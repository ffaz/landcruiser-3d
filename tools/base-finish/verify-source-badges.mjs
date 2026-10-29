// Compare recovered raw source groups with compressed delivered badges.
// Usage: node verify-source-badges.mjs RECOVERY_DIR REPO DEPS [REPORT]
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire}from'node:module';import {pathToFileURL}from'node:url';import {createHash}from'node:crypto';
const[input,repo,deps='/tmp/lc200-visual-deps',reportPath]=process.argv.slice(2);
if(!input||!repo)throw Error('RECOVERY_DIR and REPO required');
const require=createRequire(path.join(path.resolve(deps),'package.json')),imp=m=>import(pathToFileURL(require.resolve(m)).href);
const{NodeIO}=await imp('@gltf-transform/core'),{ALL_EXTENSIONS}=await imp('@gltf-transform/extensions'),{MeshoptDecoder}=await imp('meshoptimizer');await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const recovery=JSON.parse(await fs.readFile(path.join(input,'source-recovery.json'),'utf8'));
const bytes=a=>Buffer.from(a.getArray().buffer,a.getArray().byteOffset,a.getArray().byteLength),sha=b=>createHash('sha256').update(b).digest('hex');
const sameTriangles=(a,b)=>a.length===b.length&&a.every((v,i)=>{const k=Math.floor(i/3)*3;return[0,1,2].some(r=>a[k]===b[k+r]&&a[k+1]===b[k+(r+1)%3]&&a[k+2]===b[k+(r+2)%3])});
const result={sourceSha256:recovery.sourceSha256,sourceTriangles:recovery.sourceTriangles,parts:[],passed:true};
for(const entry of recovery.parts){
 const raw=await io.read(path.join(input,entry.id+'.glb')),delivered=await io.read(path.join(repo,'model/parts',entry.id+'.glb')),row={id:entry.id,groups:[],triangles:0};
 for(const node of raw.getRoot().listNodes())if(node.getMesh()){
  const other=delivered.getRoot().listNodes().find(n=>n.getName()===node.getName());if(!other?.getMesh())throw Error('Missing source group '+node.getName());
  const a=node.getMesh().listPrimitives()[0],b=other.getMesh().listPrimitives()[0],fields={};
  for(const name of['POSITION','NORMAL','COLOR_0']){const first=bytes(a.getAttribute(name)),second=bytes(b.getAttribute(name));fields[name]={byteIdentical:first.equals(second),sha256:sha(second)};if(!fields[name].byteIdentical)result.passed=false;}
  const topologyUnchanged=sameTriangles(Array.from(a.getIndices().getArray()),Array.from(b.getIndices().getArray()));if(!topologyUnchanged)result.passed=false;
  const triangles=a.getIndices().getCount()/3;row.triangles+=triangles;row.groups.push({name:node.getName(),triangles,fields,topologyUnchanged,rigidTranslation:other.getTranslation()});
 }
 if(row.triangles!==entry.triangles)result.passed=false;result.parts.push(row);
}
if(reportPath)await fs.writeFile(reportPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,parts:result.parts.map(p=>({id:p.id,triangles:p.triangles,groups:p.groups.length}))}));if(!result.passed)process.exitCode=1;
