// New procedural badge geometry only. Never reads or rewrites stored vehicle meshes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const deps=path.resolve(process.argv[3]||process.env.LC200_VISUAL_DEPS||'/tmp/lc200-visual-deps');
const require=createRequire(path.join(deps,'package.json'));
const {Document,NodeIO}=require('@gltf-transform/core');
const {EXTMeshoptCompression}=require('@gltf-transform/extensions');
const {MeshoptEncoder}=require('meshoptimizer');
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const output=process.argv[2]||path.join(repo,'model');
// Author-chosen footprints, not claimed as measured OEM badge dimensions.
const mounts=[{id:'emblem_front',pivot:[-2.5565,.940,0],sign:-1,slope:0,width:.155,height:.102},
 {id:'emblem_rear',pivot:[2.32096,1.177,0],sign:1,slope:0,width:.143,height:.094}];
const entries=[];
for(const badge of mounts){
 const doc=new Document(),buffer=doc.createBuffer(),positions=[],normals=[],colors=[],indices=[];
 const nt=96,ns=8,depth=.0025;
 // Envelope of the supplied mount-face measurements; only new badge vertices use it.
 const faceX=y=>badge.sign<0?(y<=.92?-2.563:y<=.96?-2.563+(y-.92)*.325:-2.550+(y-.96)*.1625):2.3225-(y-1.10)*.020;
 function ellipse(a,b,offset,width){
  const start=positions.length/3;
  function at(t,s){const y=b*Math.sin(t)+offset,z=a*Math.cos(t);let ny=Math.sin(t)/b,nz=Math.cos(t)/a;const len=Math.hypot(ny,nz);ny/=len;nz/=len;const r=width*Math.sin(s);const yy=y+ny*r;return[faceX(badge.pivot[1]+yy)-badge.pivot[0]+badge.sign*(.00015+depth*Math.max(0,Math.min(1,(Math.cos(s)+.6)/1.2))),yy,z+nz*r];}
  for(let i=0;i<nt;i++)for(let j=0;j<ns;j++){
   const t=i/nt*Math.PI*2,s=j/ns*Math.PI*2,p=at(t,s),dt=at(t+.0001,s),ds=at(t,s+.0001),a=dt.map((v,k)=>v-p[k]),b=ds.map((v,k)=>v-p[k]);let n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const len=Math.hypot(...n);n=n.map(v=>v/len*badge.sign);
   positions.push(...p);normals.push(...n);colors.push(255,Math.round(255*(.5+.20*Math.max(0,Math.cos(s)))),0);
  }
  for(let i=0;i<nt;i++)for(let j=0;j<ns;j++){
   const a=start+i*ns+j,b=start+((i+1)%nt)*ns+j,c=start+((i+1)%nt)*ns+(j+1)%ns,d=start+i*ns+(j+1)%ns;
   indices.push(...(badge.sign>0?[a,b,c,a,c,d]:[a,c,b,a,d,c]));
  }
 }
 ellipse(badge.width/2-.004,badge.height/2-.004,0,.004);
 ellipse(badge.width*.145,badge.height/2-.0041,0,.0038);
 ellipse(badge.width*.37,badge.height*.205,badge.height*.14,.0038);
 const accessor=(name,array,type,normalized=false)=>doc.createAccessor(name,buffer).setType(type).setArray(array).setNormalized(normalized);
 const mat=doc.createMaterial('chrome').setBaseColorFactor([.70,.73,.75,1]).setMetallicFactor(.85).setRoughnessFactor(.38);
 const primitive=doc.createPrimitive().setAttribute('POSITION',accessor('POSITION',new Float32Array(positions),'VEC3')).setAttribute('NORMAL',accessor('NORMAL',new Float32Array(normals),'VEC3')).setAttribute('COLOR_0',accessor('AO_curvature',new Uint8Array(colors),'VEC3',true)).setIndices(accessor('indices',new Uint16Array(indices),'SCALAR')).setMaterial(mat);
 const mesh=doc.createMesh(badge.id).addPrimitive(primitive);const node=doc.createNode(badge.id).setTranslation(badge.pivot).setMesh(mesh);doc.createScene().addChild(node);
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 const dest=path.join(output,'parts',badge.id+'.glb');await fs.mkdir(path.dirname(dest),{recursive:true});await io.write(dest,doc);
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(let i=0;i<positions.length;i++) {const axis=i%3,v=positions[i]+badge.pivot[axis];bounds.min[axis]=Math.min(bounds.min[axis],v);bounds.max[axis]=Math.max(bounds.max[axis],v);}
 entries.push({id:badge.id,slot:badge.id,url:'parts/'+badge.id+'.glb',rootNode:badge.id,pivot:badge.pivot,pivotBasis:'badge centre on measured mounting face',zones:['chrome'],triangles:indices.length/3,bounds,rigidClass:'body',authored:{reliefMetres:depth,widthMetres:badge.width,heightMetres:badge.height,geometry:'three bevelled elliptical bands; new geometry only'}});
}
await fs.writeFile(path.join(output,'emblem-entries.json'),JSON.stringify(entries,null,2)+'\n');console.log(JSON.stringify(entries.map(e=>({id:e.id,triangles:e.triangles,bounds:e.bounds})),null,2));
