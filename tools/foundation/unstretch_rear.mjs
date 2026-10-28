// Approved 2026-10-28 geometry-lock exception: undo the rear x-stretch left by the
// original 5.170 m anchor fit. For every non-wheel vertex behind the rear axle,
// world x' = H + (x - H) * k with H = 1.215 m and k = rear / 1.370; NORMAL uses the
// inverse-transpose of that scale. COLOR_0, indices, materials, names and wheel parts
// are untouched; vertices at or ahead of the axle keep their original codes.
// Writes uncompressed GLBs and manifest.json for compress_meshopt.mjs to encode.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const [input,output,reportPath,deps,rearArg='1.200']=process.argv.slice(2);
if(!input||!output||!reportPath||!deps)throw Error('Usage:node unstretch_rear.mjs MODEL_DIR OUT_DIR REPORT DEPS [REAR_OVERHANG_M]');
const H=1.215,OLD_REAR=1.370,REAR=Number(rearArg),k=REAR/OLD_REAR;
if(!(REAR>0&&REAR<=OLD_REAR))throw Error('Rear overhang must be in (0, 1.370]');
const require=createRequire(path.join(path.resolve(deps),'package.json'));
const imp=m=>import(pathToFileURL(require.resolve(m)).href);
const {NodeIO}=await imp('@gltf-transform/core');
const {ALL_EXTENSIONS}=await imp('@gltf-transform/extensions');
const {MeshoptDecoder,MeshoptEncoder}=await imp('meshoptimizer');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const manifest=JSON.parse(await fs.readFile(path.join(input,'manifest.json'),'utf8'));
const entries=[manifest.base,...manifest.parts,manifest.displayBase];

// Column-major 4x4 (glTF). apply: M*v; applyT3: transpose(M3)*v.
const apply=(m,x,y,z)=>[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];
const applyT3=(m,x,y,z)=>[m[0]*x+m[1]*y+m[2]*z,m[4]*x+m[5]*y+m[6]*z,m[8]*x+m[9]*y+m[10]*z];
function invert(m){
 const [a,b,c,d,e,f,g,h,i,j,q,l,r,n,o,p]=m;
 const b00=a*f-b*e,b01=a*g-c*e,b02=a*h-d*e,b03=b*g-c*f,b04=b*h-d*f,b05=c*h-d*g,b06=i*n-j*r,b07=i*o-q*r,b08=i*p-l*r,b09=j*o-q*n,b10=j*p-l*n,b11=q*p-l*o;
 const det=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
 return [(f*b11-g*b10+h*b09)*det,(c*b10-b*b11-d*b09)*det,(n*b05-o*b04+p*b03)*det,(q*b04-j*b05-l*b03)*det,(g*b08-e*b11-h*b07)*det,(a*b11-c*b08+d*b07)*det,(o*b02-r*b05-p*b01)*det,(i*b05-q*b02+l*b01)*det,(e*b10-f*b08+h*b06)*det,(b*b08-a*b10-d*b06)*det,(r*b04-n*b02+p*b00)*det,(j*b02-i*b04-l*b00)*det,(f*b07-e*b09-g*b06)*det,(a*b09-b*b07+c*b06)*det,(n*b01-r*b03-o*b00)*det,(i*b03-j*b01+q*b00)*det];
}
const unit=v=>{const L=Math.hypot(...v)||1;return v.map(x=>x/L);};
const scaleOf=a=>a instanceof Int16Array?32767:a instanceof Int8Array?127:a instanceof Uint16Array?65535:a instanceof Uint8Array?255:1;
const decode=(a,i,s)=>s===1?a[i]:Math.max(a[i]/s,-1);
const encode=(v,s)=>s===1?v:Math.max(-s,Math.min(s,Math.round(v*s)));
// World normal from stored local normal: inverse-transpose of M, i.e. transpose(inverse(M3)).
const worldNormal=(Minv,a,i,s)=>unit(applyT3(Minv,decode(a,i,s),decode(a,i+1,s),decode(a,i+2,s)));

const report={rule:"x' = H + (x - H) * k for non-wheel vertices with world x > H; NORMAL by inverse-transpose of diag(k,1,1)",hingeX:H,oldRearOverhang:OLD_REAR,newRearOverhang:REAR,k,parts:[]};
await fs.mkdir(output,{recursive:true});
for(const entry of entries){
 const src=path.join(input,entry.url),dst=path.join(output,entry.url);await fs.mkdir(path.dirname(dst),{recursive:true});
 const doc=await io.read(src);
 for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
 const editable=entry!==manifest.displayBase&&!/^wheel_/.test(entry.id||'');
 const stat={id:entry.id||'display_base',url:entry.url,behindHingeVertices:0,reencodedVertices:0,refitNodes:[],maxPositionErrorMm:0,maxNormalErrorDeg:0};
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const node of doc.getRoot().listNodes()){
  const mesh=node.getMesh();if(!mesh)continue;
  const M=node.getWorldMatrix(),Minv=invert(M);
  for(const prim of mesh.listPrimitives()){
   const P=prim.getAttribute('POSITION'),N=prim.getAttribute('NORMAL');
   const pa=P.getArray().slice(),ps=P.getNormalized()?scaleOf(pa):1;
   const na=N?N.getArray().slice():null,ns=N&&N.getNormalized()?scaleOf(na):1;
   const count=P.getCount(),world=new Float64Array(count*3),behind=new Uint8Array(count);
   for(let i=0;i<count;i++){
    const w=apply(M,decode(pa,i*3,ps),decode(pa,i*3+1,ps),decode(pa,i*3+2,ps));
    if(editable&&w[0]>H){w[0]=H+(w[0]-H)*k;behind[i]=1;}
    world.set(w,i*3);
   }
   // A shortened mesh can leave its stored quantisation box; refit that node only.
   let refit=false;
   if(ps!==1)for(let i=0;i<count&&!refit;i++)if(behind[i]&&apply(Minv,world[i*3],world[i*3+1],world[i*3+2]).some(v=>Math.abs(v)>1+1e-6))refit=true;
   let Mn=M;
   if(refit){
    if(node.getRotation().some((v,i)=>Math.abs(v-[0,0,0,1][i])>1e-12))throw Error('Refit needs an unrotated node '+node.getName());
    const parent=node.getParentNode(),PMinv=invert(parent?parent.getWorldMatrix():[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
    const pmin=[Infinity,Infinity,Infinity],pmax=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<count;i++){const q=apply(PMinv,world[i*3],world[i*3+1],world[i*3+2]);for(let c=0;c<3;c++){pmin[c]=Math.min(pmin[c],q[c]);pmax[c]=Math.max(pmax[c],q[c]);}}
    const T=pmin.map((v,c)=>(v+pmax[c])/2),S=Math.max(...pmax.map((v,c)=>(v-pmin[c])/2))*(1+1e-6);
    stat.refitNodes.push({node:node.getName(),oldTranslation:node.getTranslation(),oldScale:node.getScale(),newTranslation:T,newScale:[S,S,S]});
    node.setTranslation(T).setScale([S,S,S]);Mn=node.getWorldMatrix();
   }
   const Mninv=invert(Mn);
   for(let i=0;i<count;i++){
    for(let c=0;c<3;c++){lo[c]=Math.min(lo[c],world[i*3+c]);hi[c]=Math.max(hi[c],world[i*3+c]);}
    if(!behind[i]&&!refit)continue; // original codes kept byte-for-byte
    stat.behindHingeVertices+=behind[i];stat.reencodedVertices++;
    const l=apply(Mninv,world[i*3],world[i*3+1],world[i*3+2]);
    for(let c=0;c<3;c++)pa[i*3+c]=encode(l[c],ps);
    const back=apply(Mn,decode(pa,i*3,ps),decode(pa,i*3+1,ps),decode(pa,i*3+2,ps));
    stat.maxPositionErrorMm=Math.max(stat.maxPositionErrorMm,1000*Math.hypot(back[0]-world[i*3],back[1]-world[i*3+1],back[2]-world[i*3+2]));
    if(!N)continue;
    let n=worldNormal(Minv,na,i*3,ns);
    if(behind[i])n=unit([n[0]/k,n[1],n[2]]);
    // Local normal for frame Mn: transpose(Mn3) * worldNormal, renormalised.
    const nl=unit(applyT3(Mn,n[0],n[1],n[2]));
    for(let c=0;c<3;c++)na[i*3+c]=encode(nl[c],ns);
    const chk=worldNormal(Mninv,na,i*3,ns);
    stat.maxNormalErrorDeg=Math.max(stat.maxNormalErrorDeg,Math.acos(Math.min(1,chk[0]*n[0]+chk[1]*n[1]+chk[2]*n[2]))*180/Math.PI);
   }
   P.setArray(pa);if(N)N.setArray(na);
  }
 }
 stat.boundsMetres={min:lo,max:hi};
 const old=entry.bounds;stat.manifestBoundsResidualMm=old?1000*Math.max(...[0,1,2].flatMap(c=>[Math.abs(old.min[c]-lo[c]),Math.abs(old.max[c]-hi[c])])):null;
 if(stat.reencodedVertices){
  // Manifest bounds follow the geometry; bbox-centre pivots move with it. The root
  // translation is the pivot and stored_frame cancels it, so world positions are unchanged.
  stat.oldBounds=old;entry.bounds={min:lo,max:hi};
  if(/^component-group bounding-box centre/.test(entry.pivotBasis||'')){
   const pivot=lo.map((v,c)=>(v+hi[c])/2),root=doc.getRoot().listScenes()[0].listChildren()[0],frame=root.listChildren()[0];
   if(root.getName()!==entry.id||frame.getName()!=='stored_frame')throw Error('Unexpected root layout '+entry.url);
   stat.oldPivot=entry.pivot;entry.pivot=pivot;root.setTranslation(pivot);frame.setTranslation(pivot.map(v=>-v));
   if(manifest.slots?.[entry.slot]?.default===entry.id)manifest.slots[entry.slot].pivot=pivot;
  }
 }
 await io.write(dst,doc);
 report.parts.push(stat);
 if(stat.reencodedVertices)console.log('UNSTRETCH',stat.id,stat.behindHingeVertices,'behind hinge',stat.refitNodes.length,'refit nodes','maxErr',stat.maxPositionErrorMm.toFixed(4),'mm',stat.maxNormalErrorDeg.toFixed(3),'deg');
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.mkdir(path.dirname(reportPath),{recursive:true});await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
