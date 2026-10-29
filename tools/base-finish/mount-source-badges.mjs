// Rigid component mounting + lossless Meshopt only. Original car meshes are read-only.
// Usage: node mount-source-badges.mjs SOURCE_RECOVERY_DIR REPO DEPS
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [input,repo,deps='/tmp/lc200-visual-deps']=process.argv.slice(2);
if(!input||!repo)throw Error('SOURCE_RECOVERY_DIR and REPO required');
const require=createRequire(path.join(path.resolve(deps),'package.json'));
const imp=m=>import(pathToFileURL(require.resolve(m)).href);
const {NodeIO}=await imp('@gltf-transform/core');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await imp('@gltf-transform/extensions');
const {MeshoptEncoder,MeshoptDecoder}=await imp('meshoptimizer');
const threeModule=await imp('three'),THREE=threeModule.default||threeModule;const {MeshBVH,acceleratedRaycast}=await imp('three-mesh-bvh');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8'));
const build=JSON.parse(await fs.readFile(path.join(repo,'build.json'),'utf8'));
const recovery=JSON.parse(await fs.readFile(path.join(input,'source-recovery.json'),'utf8'));
const hashes=doc=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives().flatMap(p=>['POSITION','NORMAL'].map(s=>{const a=p.getAttribute(s).getArray();return createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex')})));
const supports=new Map();
async function support(ids){
 const key=ids.join(',');if(supports.has(key))return supports.get(key);
 const meshes=[];
 for(const id of ids){const e=[manifest.base,...manifest.parts].find(e=>e.id===id),doc=await io.read(path.join(repo,'model',e.url));
  for(const node of doc.getRoot().listNodes())if(node.getMesh())for(const p of node.getMesh().listPrimitives()){
   const a=p.getAttribute('POSITION'),vertices=new Float32Array(a.getCount()*3),M=new THREE.Matrix4().fromArray(node.getWorldMatrix());
   for(let i=0;i<a.getCount();i++)new THREE.Vector3(...a.getElement(i,[])).applyMatrix4(M).toArray(vertices,i*3);
   const g=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(vertices,3));g.setIndex(Array.from(p.getIndices().getArray()));g.boundsTree=new MeshBVH(g);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));m.raycast=acceleratedRaycast;m.updateMatrixWorld();meshes.push(m);
  }
 }supports.set(key,meshes);return meshes;
}
const ray=new THREE.Raycaster();ray.firstHitOnly=true;
const percentile=(a,t)=>{a=[...a].sort((a,b)=>a-b);return a[Math.round((a.length-1)*t)]};
const report={sourceSha256:recovery.sourceSha256,sourceTriangles:recovery.sourceTriangles,mapping:recovery.mapping,method:'All source triangles and transformed normals retained. One rigid translation per recovered component; ray support from immutable panels. Gaps reported along mount axis.',parts:[]};
for(const recovered of recovery.parts){
 const id=recovered.id,wheel=id.startsWith('wheel_emblem_'),front=id==='emblem_front',axis=wheel?2:0,sign=wheel?(id.endsWith('FL')||id.endsWith('RL')?1:-1):front?-1:1;
 const wheelId=wheel?id.replace('wheel_emblem_','wheel_'):null;
 const supportIds=wheel?[wheelId]:front?['grille','bumper_front']:['tailgate'];
 const meshes=await support(supportIds),doc=await io.read(path.join(input,id+'.glb')),before=hashes(doc);
 const root=doc.getRoot().listScenes()[0].listChildren()[0],outward=new THREE.Vector3().setComponent(axis,sign),dir=outward.clone().negate();
 const componentMounts=[],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],points=[];
 for(const node of doc.getRoot().listNodes())if(node.getMesh()){
  const prim=node.getMesh().listPrimitives()[0],P=prim.getAttribute('POSITION'),N=prim.getAttribute('NORMAL'),gaps=[],nodePoints=[];
  for(let i=0;i<P.getCount();i++){
   const point=new THREE.Vector3(...P.getElement(i,[])),origin=point.clone().setComponent(axis,sign*4);ray.set(origin,dir);const hit=ray.intersectObjects(meshes,false)[0];
   if(!hit)continue;
   const gap=sign*(point.getComponent(axis)-hit.point.getComponent(axis));gaps.push(gap);nodePoints.push({node:node.getName(),index:i,point:point.toArray(),surface:hit.point.toArray(),gap});
  }
  if(!gaps.length)throw Error('No mounting surface for '+id+' '+node.getName());
  const translation=[0,0,0];translation[axis]=sign*(.00001-Math.min(...gaps));node.setTranslation(translation);
  for(let i=0;i<P.getCount();i++){const p=P.getElement(i,[]).map((x,c)=>x+translation[c]);for(let c=0;c<3;c++){lo[c]=Math.min(lo[c],p[c]);hi[c]=Math.max(hi[c],p[c]);}}
  const adjusted=gaps.map(x=>x+translation[axis]*sign);
  componentMounts.push({node:node.getName(),translationMetres:translation,projectedVertices:gaps.length,unprojectedVertices:P.getCount()-gaps.length,minSurfaceGapMm:Math.min(...adjusted)*1000,p05SurfaceGapMm:percentile(adjusted,.05)*1000,medianSurfaceGapMm:percentile(adjusted,.5)*1000,maxSurfaceGapMm:Math.max(...adjusted)*1000,backFaceGapMm:null,backFaceNote:'Source is an open-backed relief shell; no closed back face exists. Minimum exposed-shell to panel clearance is measured. Higher percentiles include the intentionally raised relief and grille openings.'});points.push(...nodePoints);
 }
 const pivot=wheel?manifest.parts.find(e=>e.id===wheelId).pivot:lo.map((x,i)=>(x+hi[i])/2);
 const scene=doc.getRoot().listScenes()[0];scene.removeChild(root);root.setName('source_geometry');const partRoot=doc.createNode(id).setTranslation(pivot),frame=doc.createNode('stored_frame').setTranslation(pivot.map(x=>-x));partRoot.addChild(frame);frame.addChild(root);scene.addChild(partRoot);
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 const url='parts/'+id+'.glb',dest=path.join(repo,'model',url);await io.write(dest,doc);
 const decoded=await io.read(dest);if(JSON.stringify(hashes(decoded))!==JSON.stringify(before))throw Error('Attribute mutation '+id);
 const stat={...recovered,axis,sign,supportIds,componentMounts,positionAndNormalBytesPreserved:true};
 const bounds={min:lo,max:hi};
 const entry={id,slot:id,url,rootNode:id,pivot,pivotBasis:wheel?'same hub pivot as '+wheelId:'source badge centre; rigid surface mounting offset',zones:['chrome'],triangles:recovered.triangles,bounds,rigidClass:wheel?'wheel':'body',...(wheel?{wheelSlot:wheelId}:{}),sourceRecovery:{sourceSha256:report.sourceSha256,mesh:recovered.sourceMesh,components:recovered.components,componentMounts}};
 const old=manifest.parts.findIndex(e=>e.id===id);if(old<0)manifest.parts.push(entry);else manifest.parts[old]=entry;
 manifest.slots[id]={default:id,pivot,rigidClass:entry.rigidClass,...(wheel?{wheelSlot:wheelId}:{})};build.slots[id]=id;
 report.parts.push(stat);await fs.writeFile(path.join(input,id+'-mount-points.json'),JSON.stringify(points));console.log(id,'tri',entry.triangles,'mounts',componentMounts.map(c=>({node:c.node,shift:c.translationMetres,minGapMm:c.minSurfaceGapMm})),'bounds',bounds);
}
await fs.writeFile(path.join(repo,'model/manifest.json'),JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(path.join(repo,'build.json'),JSON.stringify(build,null,2)+'\n');await fs.writeFile(path.join(input,'mounting-report.json'),JSON.stringify(report,null,2)+'\n');
