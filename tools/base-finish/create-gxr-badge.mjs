// New G only; X, R and punctuation are copied unchanged from the recovered source.
// Creates additive grade alternatives and a name/V8-only default lettering variant.
// Usage: node create-gxr-badge.mjs REPO DEPS REPORT
import fs from'node:fs/promises';import path from'node:path';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const[repo,deps='/tmp/lc200-visual-deps',reportPath]=process.argv.slice(2);if(!repo||!reportPath)throw Error('REPO DEPS REPORT required');
const require=createRequire(path.join(path.resolve(deps),'package.json')),imp=m=>import(pathToFileURL(require.resolve(m)).href);
const{NodeIO}=await imp('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=await imp('@gltf-transform/extensions'),{prune}=await imp('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=await imp('meshoptimizer');
const THREE=await import(pathToFileURL(path.join(path.resolve(deps),'package/build/three.module.js')).href);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const sourcePath=path.join(repo,'model/parts/lettering_rear.glb'),source=await io.read(sourcePath),manifest=JSON.parse(await fs.readFile(path.join(repo,'model/manifest.json'),'utf8')),build=JSON.parse(await fs.readFile(path.join(repo,'build.json'),'utf8'));
const grade=['source_4_74','source_4_77','source_4_78','source_4_79','source_4_81','source_4_84'],V=source.getRoot().listNodes().find(n=>n.getName()==='source_4_84'),P=V.getMesh().listPrimitives()[0].getAttribute('POSITION'),M=new THREE.Matrix4().fromArray(V.getWorldMatrix());
const points=Array.from({length:P.getCount()},(_,i)=>new THREE.Vector3(...P.getElement(i,[])).applyMatrix4(M)),box=new THREE.Box3().setFromPoints(points),size=box.getSize(new THREE.Vector3()),mean=points.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/points.length);
let yy=0,zz=0,yz=0,xy=0,xz=0;for(const p of points){const q=p.clone().sub(mean);yy+=q.y*q.y;zz+=q.z*q.z;yz+=q.y*q.z;xy+=q.x*q.y;xz+=q.x*q.z;}
const den=yy*zz-yz*yz,a=(xy*zz-xz*yz)/den,b=(xz*yy-xy*yz)/den,c=mean.x-a*mean.y-b*mean.z,delta=points.map(p=>p.x-a*p.y-b*p.z-c),back=Math.min(...delta),relief=Math.max(...delta)-back;
// Polygonal italic G matches the original grade's squared, bevelled strokes.
const outline=[[.96,.78],[.86,.94],[.73,1],[.23,1],[.05,.82],[0,.20],[.13,.04],[.27,0],[.78,0],[.96,.18],[1,.56],[.53,.56],[.51,.40],[.79,.40],[.77,.24],[.69,.18],[.30,.18],[.23,.26],[.29,.75],[.37,.82],[.68,.82],[.73,.76],[.75,.70]];
const strokeHeight=size.y*.18,bevel=.00055,shape=new THREE.Shape();outline.forEach(([u,v],i)=>{const x=(u+(v-.5)*.12)*(size.z-2*bevel),y=v*(size.y-2*bevel);if(!i)shape.moveTo(x,y);else shape.lineTo(x,y)});shape.closePath();
const geo=new THREE.ExtrudeGeometry(shape,{depth:relief-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1,curveSegments:12});geo.computeBoundingBox();const gb=geo.boundingBox.clone(),gs=gb.getSize(new THREE.Vector3()),su=size.z/gs.x,sv=size.y/gs.y;geo.translate(-gb.min.x,-gb.min.y,-gb.min.z);geo.scale(su,sv,1);
const gp=geo.getAttribute('position'),gn=geo.getAttribute('normal'),positions=new Float32Array(gp.count*3),normals=new Float32Array(gp.count*3),colors=new Float32Array(gp.count*3);
for(let i=0;i<gp.count;i++){const y=box.min.y+gp.getY(i),z=box.max.z-gp.getX(i),x=a*y+b*z+c+back+gp.getZ(i);positions.set([x,y,z],i*3);const nx=gn.getZ(i),ny=gn.getY(i)-a*nx,nz=-gn.getX(i)-b*nx,len=Math.hypot(nx,ny,nz);normals.set([nx/len,ny/len,nz/len],i*3);colors.set([1,.5,0],i*3);}
const arrayHash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const report={originalLetteringSha256:createHash('sha256').update(await fs.readFile(sourcePath)).digest('hex'),sourceV:{node:V.getName(),bounds:{min:box.min.toArray(),max:box.max.toArray()},plane:{a,b,c},reliefMetres:relief},newG:{widthMetres:size.z,heightMetres:size.y,reliefMetres:relief,nominalStrokeMetres:strokeHeight,bevelMetres:bevel,bevelSegments:3,geometry:'new italic squared G outline only; fitted to original V bounding footprint and mounting plane'},parts:[]};
for(const[id,keep,slot]of[['lettering_rear_base',n=>!grade.includes(n),'lettering_rear'],['badge_grade_VXR',n=>grade.includes(n),'badge_grade'],['badge_grade_GXR',n=>grade.includes(n)&&n!=='source_4_84','badge_grade']]){
 const doc=await io.read(sourcePath);for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();for(const n of [...doc.getRoot().listNodes()])if(n.getMesh()&&!keep(n.getName()))n.dispose();
 if(id==='badge_grade_GXR'){
  const buffer=doc.getRoot().listBuffers()[0],acc=(n,array,type)=>doc.createAccessor(n,buffer).setType(type).setArray(array),mat=doc.getRoot().listMaterials()[0];
  const p=doc.createPrimitive().setAttribute('POSITION',acc('G_position',positions,'VEC3')).setAttribute('NORMAL',acc('G_normal',normals,'VEC3')).setAttribute('COLOR_0',acc('G_neutral_shading',colors,'VEC3')).setIndices(acc('G_indices',new Uint32Array(Array.from({length:gp.count},(_,i)=>i)),'SCALAR')).setMaterial(mat);
  const node=doc.createNode('grade_G_new').setMesh(doc.createMesh('G_only_new_geometry').addPrimitive(p));doc.getRoot().listNodes().find(n=>n.getName()==='source_geometry').addChild(node);
 }
 await doc.transform(prune({keepAttributes:true,keepExtras:true}));
 const bounds=new THREE.Box3(),preserved=[];let triangles=0;
 for(const n of doc.getRoot().listNodes())if(n.getMesh())for(const p of n.getMesh().listPrimitives()){
  const P=p.getAttribute('POSITION'),wm=new THREE.Matrix4().fromArray(n.getWorldMatrix());for(let i=0;i<P.getCount();i++)bounds.expandByPoint(new THREE.Vector3(...P.getElement(i,[])).applyMatrix4(wm));triangles+=p.getIndices().getCount()/3;
  if(n.getName()!=='grade_G_new'){
   const original=source.getRoot().listNodes().find(o=>o.getName()===n.getName()).getMesh().listPrimitives()[0],attributes={};for(const s of ['POSITION','NORMAL','COLOR_0']){const A=original.getAttribute(s).getArray(),B=p.getAttribute(s).getArray();attributes[s]={sha256:arrayHash(B),byteIdentical:arrayHash(A)===arrayHash(B)};if(!attributes[s].byteIdentical)throw Error('Source glyph changed '+n.getName());}preserved.push({node:n.getName(),attributes});
  }
 }
 const pivot=bounds.getCenter(new THREE.Vector3()).toArray(),root=doc.getRoot().listScenes()[0].listChildren()[0],frame=root.listChildren().find(n=>n.getName()==='stored_frame');root.setName(id).setTranslation(pivot);frame.setTranslation(pivot.map(v=>-v));
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});const url='parts/'+id+'.glb';await io.write(path.join(repo,'model',url),doc);
 const entry={id,slot,url,rootNode:id,pivot,pivotBasis:'source glyph group centre; unchanged source glyph transforms',zones:['chrome'],triangles,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},rigidClass:'body',sourceRecovery:{from:'lettering_rear',preservedNodes:preserved.map(x=>x.node),newGeometry:id==='badge_grade_GXR'?['grade_G_new']:[]}};
 const old=manifest.parts.findIndex(p=>p.id===id);if(old<0)manifest.parts.push(entry);else manifest.parts[old]=entry;report.parts.push({id,triangles,bounds:entry.bounds,preserved});
 if(id==='badge_grade_GXR')manifest.slots.badge_grade={default:id,pivot,rigidClass:'body'};
 if(id==='lettering_rear_base'){manifest.slots.lettering_rear.default=id;build.slots.lettering_rear=id;}
}
manifest.parts.find(p=>p.id==='lettering_rear').bundlesSlots=['badge_grade'];build.slots.badge_grade='badge_grade_GXR';
await fs.writeFile(path.join(repo,'model/manifest.json'),JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(path.join(repo,'build.json'),JSON.stringify(build,null,2)+'\n');await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log('GXR created',report.newG,'parts',report.parts.map(p=>({id:p.id,triangles:p.triangles})));
