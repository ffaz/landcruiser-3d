// Test/reference artifact only: original source materials + original source triangles.
// Apply the documented import frame for comparable camera coordinates; no finish shaders.
// Usage: node source-material-reference.mjs SOURCE_GLB OUTPUT_GLB DEPS REPORT_JSON
import fs from 'node:fs/promises';import path from 'node:path';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const[src,dest,deps,reportPath]=process.argv.slice(2);if(!reportPath)throw Error('SOURCE OUTPUT DEPS REPORT required');
const require=createRequire(path.join(path.resolve(deps),'package.json')),imp=m=>import(pathToFileURL(require.resolve(m)).href);const{NodeIO}=await imp('@gltf-transform/core');const io=new NodeIO();const bytes=await fs.readFile(src),sha=createHash('sha256').update(bytes).digest('hex');if(sha!=='45cae7b0f6cd85db51f401a24fc19dd7e1ba9b17d1af624a9583ffe3f766b3e0')throw Error('Source SHA mismatch');
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());const doc=await io.read(src),worldFrames=new Map(doc.getRoot().listNodes().map(n=>[n,n.getWorldMatrix()]));let triangles=0;
const a=[-2.54582715,-1.60065,1.24003,2.39938188],b=[-2.585,-1.635,1.215,2.585],sy=(1.930-.3965)/(1.91471124-.4078672),k=1.2/1.37;
for(const node of doc.getRoot().listNodes())if(node.getMesh())for(const p of node.getMesh().listPrimitives()){
 const P=p.getAttribute('POSITION'),N=p.getAttribute('NORMAL'),positions=new Float32Array(P.getCount()*3),normals=new Float32Array(N.getCount()*3),M=worldFrames.get(node);
 for(let i=0;i<P.getCount();i++){
  const v=P.getElement(i,[]),n=N.getElement(i,[]),wx=M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12],wy=M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13],wz=M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14];
  const old=-wz,j=old<a[1]?0:old<a[2]?1:2,sx=(b[j+1]-b[j])/(a[j+1]-a[j]);let x=b[j]+(old-a[j])*sx;const rear=x>1.215;if(rear)x=1.215+(x-1.215)*k;positions.set([x,.3965+(wy-.4078672)*sy,wx],i*3);
  // The source's two inverse scene rotations cancel; its mesh world frames are identity.
  let nx=-n[2]/sx/(rear?k:1),ny=n[1]/sy,nz=n[0],len=Math.hypot(nx,ny,nz);normals.set([nx/len,ny/len,nz/len],i*3);
 }
 P.setArray(positions);N.setArray(normals);triangles+=p.getIndices().getCount()/3;
}
for(const node of doc.getRoot().listNodes())node.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1]);
if(triangles!==979826)throw Error('Source triangle count differs');await io.write(dest,doc);
await fs.writeFile(reportPath,JSON.stringify({sourceSha256:sha,triangles,textureCount:(json.textures||[]).length,imageCount:(json.images||[]).length,geometry:'original source topology, mapped once into documented stored frame for camera comparison; no finish shaders or baked AO applied',materials:json.materials,sourceMaterialPolicy:'Every original source material factor is exported unchanged. Same Three.js 0.166.1 Cream studio illumination/camera as the finish comparison; not a claim of replicating Sketchfab renderer lighting.'},null,2)+'\n');
console.log('Source reference',triangles,'triangles',doc.getRoot().listMaterials().length,'materials',doc.getRoot().listTextures().length,'textures');
