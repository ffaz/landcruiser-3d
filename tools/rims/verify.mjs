import fs from 'node:fs/promises';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';
const[repo,deps,work]=process.argv.slice(2),r=createRequire(deps+'/package.json'),{NodeIO}=r('@gltf-transform/core'),{ALL_EXTENSIONS}=r('@gltf-transform/extensions'),{MeshoptDecoder}=r('meshoptimizer');await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const manifest=JSON.parse(await fs.readFile(repo+'/model/manifest.json')),rows=[];
for(const entry of manifest.parts.filter(p=>p.replacesWheelHardware)){
 const doc=await io.read(repo+'/model/'+entry.url),root=doc.getRoot().listScenes()[0].listChildren()[0];let tris=0,aoMin=1,aoMax=0,gMin=1,gMax=0,maxRadius=0,beadMin=Infinity,beadMax=-Infinity;
 if(root.getName()!==entry.id||root.getScale().some(v=>v!==1)||root.getTranslation().some((v,i)=>Math.abs(v-entry.pivot[i])>1e-6))throw Error('Invalid root '+entry.id);
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const P=p.getAttribute('POSITION'),N=p.getAttribute('NORMAL'),C=p.getAttribute('COLOR_0');if(!P||!N||!C||N.getCount()!==P.getCount()||C.getCount()!==P.getCount())throw Error('Missing attribute '+entry.id);tris+=p.getIndices().getCount()/3;
  for(let i=0;i<P.getCount();i++){const pos=P.getElement(i,[]),normal=N.getElement(i,[]),col=C.getElement(i,[]);if([...pos,...normal,...col].some(v=>!Number.isFinite(v)))throw Error('Nonfinite '+entry.id);const len=Math.hypot(...normal);if(Math.abs(len-1)>.002)throw Error('Nonunit normal '+entry.id);const radius=Math.hypot(pos[0],pos[1]);maxRadius=Math.max(maxRadius,radius);if(Math.abs(radius-.2159)<.00001){beadMin=Math.min(beadMin,pos[2]);beadMax=Math.max(beadMax,pos[2]);}aoMin=Math.min(aoMin,col[0]);aoMax=Math.max(aoMax,col[0]);gMin=Math.min(gMin,col[1]);gMax=Math.max(gMax,col[1]);}
 }
 if(entry.boltPattern!=='5x150'||Math.abs(beadMax-beadMin-entry.width_in*.0254)>.0001)throw Error('Mount/width '+entry.id);
 if(tris!==entry.triangles||tris>12000||aoMax-aoMin<.2||Math.abs(maxRadius-.231)>.0001)throw Error('Budget/bake/bounds '+entry.id);
 rows.push({id:entry.id,triangles:tris,rootScale:root.getScale(),pivot:entry.pivot,maxFlangeDiameter_mm:maxRadius*2000,beadSeat_mm:entry.beadSeat_mm,measuredBeadWidth_mm:(beadMax-beadMin)*1000,boltPattern:entry.boltPattern,centreBore_mm:entry.centreBore_mm,AO:[aoMin,aoMax],curvature:[gMin,gMax],bytes:(await fs.stat(repo+'/model/'+entry.url)).size});
}
const baseline='c480d15',old=execFileSync('git',['ls-tree','-r','--name-only',baseline,'model'],{cwd:repo,encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.glb'));
for(const file of old){const before=execFileSync('git',['show',baseline+':'+file],{cwd:repo,maxBuffer:30e6}),after=await fs.readFile(repo+'/'+file);if(!before.equals(after))throw Error('Stored GLB changed '+file);}
const report={baseline,originalGLBsUnchanged:old.length,newRims:rows,totalNewBytes:rows.reduce((s,r)=>s+r.bytes,0)};await fs.writeFile(work+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(rows.length+' rims valid; '+old.length+' existing GLBs byte-identical; '+report.totalNewBytes+' new bytes');
