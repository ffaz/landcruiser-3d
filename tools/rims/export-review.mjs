// Export a standalone KMC review asset without enabling it in the Workshop.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const[repo,deps,work]=process.argv.slice(2),require=createRequire(deps+'/package.json'),imp=n=>import(pathToFileURL(require.resolve(n)).href);
const{Document,NodeIO}=await imp('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=await imp('@gltf-transform/extensions'),{MeshoptEncoder,MeshoptDecoder}=await imp('meshoptimizer'),{weld,dedup,quantize}=await imp('@gltf-transform/functions');await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const data=JSON.parse(await fs.readFile(work+'/rim-data.json')),manifest=JSON.parse(await fs.readFile(repo+'/model/manifest.json')),style=data.style;
const names={disc:'KMC KM720 Roswell · matte anthracite',steel:'Shanaber steel · silver',window:'Method MR705 · titanium'};
const rimFinish={disc:{color:'#55595d',roughness:.48,metalness:.12,envMapIntensity:2.8,clearcoat:.08,clearcoatRoughness:.40,specularIntensity:.35},steel:{color:'#d5dade',roughness:.44,metalness:.25,envMapIntensity:1.2},window:{color:'#8a8f94',roughness:.54,metalness:.14,envMapIntensity:3.0,clearcoat:0,specularIntensity:.35}};
const defaults={rim:rimFinish[style],lip:{...rimFinish[style],roughness:.80,metalness:.08,envMapIntensity:2.4,clearcoat:0,specularIntensity:.20},edge_catch:{...rimFinish[style],roughness:.30,metalness:.45,envMapIntensity:1.8},nut_metal:{color:style==='steel'?'#81898f':'#636b73',roughness:style==='steel'?.65:.38,metalness:.40,envMapIntensity:1.15},bead_groove:{color:'#3b4045',roughness:.78,metalness:.10,envMapIntensity:.50},groove_shoulder:{...rimFinish[style],roughness:.85,metalness:.02,envMapIntensity:2.0,clearcoat:0,specularIntensity:.15},pocket_wall:{...rimFinish[style],roughness:.40,metalness:.30,envMapIntensity:1.1},hub_metal:{color:'#bdc5cb',roughness:.40,metalness:.35,envMapIntensity:1.1},chrome:{color:'#858c92',roughness:.34,metalness:.85,envMapIntensity:.95},black:{color:'#1b1e20',roughness:.90,metalness:0,envMapIntensity:.15},tyre:{color:'#202326',roughness:.90,metalness:0,envMapIntensity:.22},brake:{color:'#4c4f52',roughness:.50,metalness:.25,envMapIntensity:.65},hat:{color:'#303438',roughness:.58,metalness:.25,envMapIntensity:.45},brake_detail:{color:'#454a4e',roughness:.52,metalness:.35,envMapIntensity:.60},barrel:{color:style==='steel'?'#939da5':'#171c20',roughness:.62,metalness:.25,envMapIntensity:.65},caliper:{color:'#53585c',roughness:.55,metalness:.25,envMapIntensity:.65},backing:{color:'#14181c',roughness:.82,metalness:.10,envMapIntensity:.25},lettering:{...rimFinish[style],roughness:.34,envMapIntensity:1.35},hubcap:{color:'#303438',roughness:.48,metalness:.35,envMapIntensity:.75},cap_lettering:{color:'#555b60',roughness:.58,metalness:.35,envMapIntensity:.75}},report=[];
if(style==='disc')for(const zone of ['brake','hat','brake_detail','caliper','backing'])Object.assign(defaults[zone],{color:'#101418',roughness:.78,metalness:.10,envMapIntensity:.20});
if(style==='window'){
 defaults.hub_pad={...rimFinish[style],roughness:.58,metalness:.20,envMapIntensity:2.0,clearcoat:0,specularIntensity:.30};
 Object.assign(defaults.hubcap,{color:'#50565c',roughness:.60,metalness:.08,envMapIntensity:1.8,clearcoat:0,specularIntensity:.30});
 Object.assign(defaults.cap_lettering,{color:'#717a82',roughness:.58,metalness:.20,envMapIntensity:1.4,clearcoat:0,specularIntensity:.30});
 Object.assign(defaults.pocket_wall,{...rimFinish[style],roughness:.55,envMapIntensity:4.0});
 Object.assign(defaults.lettering,{...rimFinish[style],roughness:.58,envMapIntensity:2.4});
 Object.assign(defaults.brake,{color:'#373c41',roughness:.62,metalness:.30,envMapIntensity:.75});
 Object.assign(defaults.caliper,{color:'#292e32',roughness:.70,metalness:.18,envMapIntensity:.55});
}
if(style==='steel'){
 Object.assign(defaults.hub_metal,{color:'#92989d',roughness:.86,metalness:.08,envMapIntensity:1.0,clearcoat:0,specularIntensity:.20});
 Object.assign(defaults.pocket_wall,{color:'#41484d',roughness:.96,metalness:0,envMapIntensity:.35,clearcoat:0,specularIntensity:.05});
 Object.assign(defaults.barrel,{color:'#495156',roughness:.88,metalness:.04,envMapIntensity:.50,clearcoat:0,specularIntensity:.10});
}
if(style==='disc'){
 Object.assign(defaults.edge_catch,{roughness:.32,metalness:.12,envMapIntensity:4.0,clearcoat:.08,clearcoatRoughness:.32,specularIntensity:.35});
 Object.assign(defaults.pocket_wall,{envMapIntensity:3.5,metalness:.12});
}
defaults.nut_edge={color:'#7b858e',roughness:.30,metalness:.60,envMapIntensity:1.5,clearcoat:0,specularIntensity:.35};
defaults.nut_dark={color:'#262b30',roughness:.38,metalness:.50,envMapIntensity:1.0,clearcoat:.05,specularIntensity:.35};
defaults.nut_pocket={color:'#303539',roughness:.65,metalness:.15,envMapIntensity:1.0,clearcoat:0,specularIntensity:.25};
for(const corner of ['FL']){
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
 // Authored rims only: ~0.03 mm position precision and 12-bit normals keep
 // cast relief below the iPad download budget without changing the source car.
 doc.createScene().addChild(root);await doc.transform(quantize({quantizePosition:14,quantizeNormal:12,quantizeColor:8}),weld(),dedup());doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 const url='parts/'+id+'.glb';await fs.mkdir(work+'/parts',{recursive:true});await io.write(work+'/'+url,doc);
 const entry={id,slot,url,rootNode:id,pivot,rigidClass:'wheel',zones:Object.keys(data.groups),triangles:data.triangles,bounds:{min:lo,max:hi},beadSeat_mm:431.8,width_in:data.width_in,boltPattern:data.boltPattern,centreBore_mm:data.centreBore_mm,lazy:true,replacesWheelHardware:'wheel_'+corner,materialDefaults:defaults,bundlesSlots:['wheel_emblem_'+corner],features:data.features,purpose:names[style]+'; 17-inch metal lip, rubber bead adapter and opaque brake package; stored tyre retained'};
 const index=manifest.parts.findIndex(p=>p.id===id);if(index<0)manifest.parts.push(entry);else manifest.parts[index]=entry;
 report.push({id,triangles:data.triangles,pivot,bytes:(await fs.stat(work+'/'+url)).size,bounds:entry.bounds});
}
await fs.writeFile(work+'/review-entry.json',JSON.stringify(manifest.parts.find(p=>p.id==='rim_FL_disc'),null,2)+'\n');
await fs.writeFile(work+'/asset-report.json',JSON.stringify({design:names[style],blender:data.blender,beadSeat_mm:data.beadSeat_mm,width_in:data.width_in,boltPattern:data.boltPattern,centreBore_mm:data.centreBore_mm,bake:data.bake,features:data.features,files:report},null,2)+'\n');console.log(style,data.triangles,report.reduce((a,b)=>a+b.bytes,0)+' bytes');
