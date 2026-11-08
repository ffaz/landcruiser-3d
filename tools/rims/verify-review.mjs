// Validate the baked review geometry and its exported normals without installing it.
import fs from 'node:fs/promises';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';
const[deps,work]=process.argv.slice(2),require=createRequire(deps+'/package.json'),imp=n=>import(pathToFileURL(require.resolve(n)).href);
const{NodeIO}=await imp('@gltf-transform/core'),{ALL_EXTENSIONS}=await imp('@gltf-transform/extensions'),{MeshoptDecoder}=await imp('meshoptimizer');await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}),doc=await io.read(work+'/parts/rim_FL_disc.glb'),data=JSON.parse(await fs.readFile(work+'/rim-data.json')),checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name);};
try{
const sub=(a,b)=>a.map((v,k)=>v-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
// Check the uncompressed source triangles too. A plausible unit normal alone
// does not catch an inward-facing bore wall carrying a front-face normal.
const winding={};let sourceBad=0,sourceInvalid=0,sourceTriangles=0;
for(const[zone,g]of Object.entries(data.groups)){
 const counts={triangles:g.positions.length/9,opposedNormals:0,degenerate:0,zMin_mm:Infinity,zMax_mm:-Infinity};sourceTriangles+=counts.triangles;
 for(let i=2;i<g.positions.length;i+=3){counts.zMin_mm=Math.min(counts.zMin_mm,g.positions[i]*1000);counts.zMax_mm=Math.max(counts.zMax_mm,g.positions[i]*1000);}
 if(g.positions.length%9||g.normals.length!==g.positions.length||g.colors.length!==g.positions.length)sourceInvalid++;
 if(![...g.positions,...g.normals,...g.colors].every(Number.isFinite))sourceInvalid++;
 for(let i=0;i<g.positions.length;i+=9){
  const a=g.positions.slice(i,i+3),b=g.positions.slice(i+3,i+6),c=g.positions.slice(i+6,i+9),face=cross(sub(b,a),sub(c,a)),area2=Math.hypot(...face);
  // Collapsed lathe poles and Boolean remnants are reported separately; they
  // cannot establish winding and are not counted as backwards surfaces.
  if(area2<1e-11){counts.degenerate++;continue;}
  const normal=[0,1,2].map(k=>(g.normals[i+k]+g.normals[i+3+k]+g.normals[i+6+k])/3),length=Math.hypot(...normal);
  if(length>1e-8&&dot(face,normal)/(area2*length)<-.1){counts.opposedNormals++;sourceBad++;}
 }
 winding[zone]=counts;
}
check('finite complete source attributes',sourceInvalid===0,{invalid:sourceInvalid});
check('source triangle count matches export declaration',sourceTriangles===data.triangles,{sourceTriangles,declared:data.triangles});
check('source normals agree with triangle winding',sourceBad===0,winding);
let normals=0,bad=0;
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
 check(mesh.getName()+' has baked attributes',!!p.getAttribute('COLOR_0')&&!!p.getAttribute('NORMAL'));
 const n=p.getAttribute('NORMAL');for(let i=0;i<n.getCount();i++){const v=n.getElement(i,[]),length=Math.hypot(...v);normals++;if(!Number.isFinite(length)||Math.abs(length-1)>.015)bad++;}
}
check('finite unit exported normals',bad===0,{normals,bad});
check('under 40000 triangles',data.triangles<=40000,data.triangles);
check('LC200 five-stud 150 mm mounting pattern',data.boltPattern==='5x150'&&data.beadSeat_mm===431.8);
const section=data.features.kmc;
const finiteFields=(value,fields)=>!!value&&fields.every(k=>Number.isFinite(value[k]));
check('explicit six-level section metadata is present',!!section&&['coneInnerRadius_mm','coneOuterRadius_mm','capFaceZ_mm','lugFloorZ_mm','lipFrontZ_mm','nutPhase_deg'].every(k=>Number.isFinite(section[k]))&&Array.isArray(section.rings)&&section.rings.length===4&&section.rings.every(r=>finiteFields(r,['innerRadius_mm','outerRadius_mm','frontZ_mm','level']))&&finiteFields(section.separatorGroove,['innerRadius_mm','outerRadius_mm','floorZ_mm'])&&finiteFields(section.outerLip,['innerRadius_mm','outerRadius_mm','frontZ_mm','level'])&&finiteFields(section.ventChannel,['innerRadius_mm','outerRadius_mm','frontZ_mm','level'])&&Array.isArray(section.ventChannel.sampleAngles_deg)&&section.ventChannel.sampleAngles_deg.length>=3&&section.ventChannel.sampleAngles_deg.every(Number.isFinite),section);
const phase=section.nutPhase_deg*Math.PI/180;
const nuts=data.groups.nut_dark.positions,bins=Array.from({length:5},()=>({x:0,y:0,n:0}));
for(let i=0;i<nuts.length;i+=3){const x=nuts[i],y=nuts[i+1];let best=0,d=Infinity;for(let k=0;k<5;k++){const a=phase+k*2*Math.PI/5,dist=Math.hypot(x-.075*Math.cos(a),y-.075*Math.sin(a));if(dist<d){d=dist;best=k;}}const b=bins[best];b.x+=x;b.y+=y;b.n++;}
const centres=bins.map(b=>[b.x/b.n,b.y/b.n]);
check('five nut clusters on a pentagon',centres.every(([x,y],k)=>{const a=phase+k*2*Math.PI/5;return Math.hypot(x-.075*Math.cos(a),y-.075*Math.sin(a))<.0002;}),centres);
check('one nut at six oclock and two across the top',centres.filter(([x,y])=>Math.abs(x)<.0002&&Math.abs(y+.075)<.0002).length===1&&centres.filter(([,y])=>y>.03).length===2&&!centres.some(([x,y])=>Math.abs(x)<.0002&&y>.07),centres);
const maxZ=Math.max(...Array.from({length:nuts.length/3},(_,i)=>nuts[3*i+2]));
check('no detached front cutter caps',Object.entries(winding).filter(([zone])=>['rim','edge_catch','nut_pocket','nut_dark','nut_edge'].includes(zone)).every(([,g])=>g.zMax_mm<=section.lipFrontZ_mm+2),{lipFrontZ_mm:section.lipFrontZ_mm,groups:winding});
// Intersect actual front-facing source triangles at fixed XY positions. This
// checks the emitted shape, rather than accepting the declared section values.
const frontTriangles=[];
// The cast face includes small edge strips in a separate finish zone. They
// are physical front surfaces too; omitting them falsely creates sampling holes.
for(const zone of ['rim','edge_catch']){
 const positions=data.groups[zone]?.positions||[];
 for(let i=0;i<positions.length;i+=9){const a=positions.slice(i,i+3),b=positions.slice(i+3,i+6),c=positions.slice(i+6,i+9);if(cross(sub(b,a),sub(c,a))[2]>1e-12)frontTriangles.push([a,b,c]);}
}
function topAt(triangles,x,y){
 let top=-Infinity;
 for(const[a,b,c]of triangles){
  const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-13)continue;
  const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/d,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/d,w=1-u-v;
  if(Math.min(u,v,w)>=-1e-7)top=Math.max(top,u*a[2]+v*b[2]+w*c[2]);
 }
 return Number.isFinite(top)?top:null;
}
function frontAt(x,y){return topAt(frontTriangles,x,y);}
function frontTrianglesFor(zones){
 const out=[];
 for(const zone of zones){const p=data.groups[zone]?.positions||[];for(let i=0;i<p.length;i+=9){const a=p.slice(i,i+3),b=p.slice(i+3,i+6),c=p.slice(i+6,i+9);if(cross(sub(b,a),sub(c,a))[2]>1e-12)out.push([a,b,c]);}}
 return out;
}
// The inward shift makes the five nut seats intersect more of the cone.
// Probe actual head surfaces against all cast face/seat surfaces to catch a
// buried crown or a surviving cutter cap without requiring the recess to be flat.
const headTriangles=frontTrianglesFor(['nut_dark','nut_edge']);
const castTriangles=frontTriangles.concat(frontTrianglesFor(['nut_pocket']));
const headClearance=[];
for(let k=0;k<5;k++){
 const a=phase+k*2*Math.PI/5,center=[.075*Math.cos(a),.075*Math.sin(a)],probes=[];
 for(const radius of [0,.004,.008,.0105])for(const t of (radius?[0,Math.PI/2,Math.PI,3*Math.PI/2]:[0])){
  const x=center[0]+radius*Math.cos(t),y=center[1]+radius*Math.sin(t),head=topAt(headTriangles,x,y),cast=topAt(castTriangles,x,y);
  // Outside the actual hexagonal head, a ray may hit only its low washer.
  // Those samples cannot establish crown visibility and are excluded.
  if(head===null||head<.085)continue;
  probes.push({radius_mm:radius*1000,x,y,headZ_mm:head*1000,castZ_mm:cast===null?null:cast*1000,clearance_mm:cast===null?null:(head-cast)*1000});
 }
 headClearance.push({index:k,center,probes});
}
check('all five nut heads remain clear of the inward cone',headClearance.every(h=>h.probes.length>=9&&h.probes.every(p=>p.clearance_mm===null||p.clearance_mm>=.2)),headClearance);
// Inspect the actual cast aperture walls, not only their catalogue dimensions.
// Every pocket-wall vertex belongs to one of the nine radial capsule openings.
const apertures=section.apertures;
check('explicit vent aperture dimensions are present',finiteFields(apertures,['count','phase_deg','centerRadius_mm','mouthLength_mm','mouthRadialWidth_mm','throatLength_mm','throatRadialWidth_mm'])&&apertures.count===9&&apertures.mouthLength_mm>apertures.throatLength_mm&&apertures.mouthRadialWidth_mm>apertures.throatRadialWidth_mm,apertures);
const aperturePhase=apertures.phase_deg*Math.PI/180,apertureStep=2*Math.PI/apertures.count;
const walls=Array.from({length:apertures.count},(_,i)=>({index:i,angle:aperturePhase+i*apertureStep,vertices:[]}));
const wallPositions=data.groups.pocket_wall?.positions||[];
for(let i=0;i<wallPositions.length;i+=3){
 const [x,y,z]=wallPositions.slice(i,i+3),angle=Math.atan2(y,x);
 const index=((Math.round((angle-aperturePhase)/apertureStep)%apertures.count)+apertures.count)%apertures.count,wall=walls[index];
 const radial=x*Math.cos(wall.angle)+y*Math.sin(wall.angle),tangent=-x*Math.sin(wall.angle)+y*Math.cos(wall.angle);
 wall.vertices.push({radial,tangent,z});
}
check('nine separately positioned cast aperture walls exist',walls.every(w=>w.vertices.length>100),walls.map(w=>({index:w.index,vertices:w.vertices.length})));
function outlineBounds(vertices){
 return{radialMin_mm:Math.min(...vertices.map(v=>v.radial))*1000,radialMax_mm:Math.max(...vertices.map(v=>v.radial))*1000,tangentMin_mm:Math.min(...vertices.map(v=>v.tangent))*1000,tangentMax_mm:Math.max(...vertices.map(v=>v.tangent))*1000,globalRadiusMin_mm:Math.min(...vertices.map(v=>Math.hypot(v.radial,v.tangent)))*1000,globalRadiusMax_mm:Math.max(...vertices.map(v=>Math.hypot(v.radial,v.tangent)))*1000};
}
const apertureBounds=walls.map(w=>{
 const top=Math.max(...w.vertices.map(v=>v.z)),bottom=Math.min(...w.vertices.map(v=>v.z));
 return{index:w.index,angle:w.angle,mouth:outlineBounds(w.vertices.filter(v=>Math.abs(v.z-top)<1e-6)),throat:outlineBounds(w.vertices.filter(v=>Math.abs(v.z-bottom)<1e-6)),topZ_mm:top*1000,bottomZ_mm:bottom*1000};
});
const boundsWidth=(b,axis)=>b[axis+'Max_mm']-b[axis+'Min_mm'];
check('aperture mouths match actual radial position and dimensions',apertureBounds.every(w=>Math.abs((w.mouth.radialMin_mm+w.mouth.radialMax_mm)/2-apertures.centerRadius_mm)<.25&&Math.abs(boundsWidth(w.mouth,'radial')-apertures.mouthRadialWidth_mm)<.4&&Math.abs(boundsWidth(w.mouth,'tangent')-apertures.mouthLength_mm)<.6),{expected:apertures,actual:apertureBounds});
// A long tangential slot's corners extend farther from the wheel axis than
// its radial-axis bounds suggest. Check the real global outline against both
// vent lands so the opening cannot leave a near-zero sliver at a shoulder.
const apertureLands=apertureBounds.map(w=>({index:w.index,inner_mm:w.mouth.globalRadiusMin_mm-section.ventChannel.innerRadius_mm,outer_mm:section.ventChannel.outerRadius_mm-w.mouth.globalRadiusMax_mm}));
check('actual aperture outlines retain inner and outer vent lands',apertureLands.every(g=>g.inner_mm>=.8&&g.outer_mm>=.8),{minimumLand_mm:.8,actual:apertureLands,ventChannel:section.ventChannel});
check('aperture throats match the larger clear openings',apertureBounds.every(w=>Math.abs((w.throat.radialMin_mm+w.throat.radialMax_mm)/2-apertures.centerRadius_mm)<.25&&Math.abs(boundsWidth(w.throat,'radial')-apertures.throatRadialWidth_mm)<.4&&Math.abs(boundsWidth(w.throat,'tangent')-apertures.throatLength_mm)<.6&&w.bottomZ_mm<w.topZ_mm-1),{expected:apertures,actual:apertureBounds});
const apertureProbes=[];
for(const wall of walls)for(const[dr,tangent]of [[0,0],[-3,0],[3,0],[0,-20],[0,20]]){
 const radial=(apertures.centerRadius_mm+dr)/1000,t=tangent/1000,x=radial*Math.cos(wall.angle)-t*Math.sin(wall.angle),y=radial*Math.sin(wall.angle)+t*Math.cos(wall.angle);
 apertureProbes.push({index:wall.index,dr,tangent,front:frontAt(x,y)});
}
check('all nine vent mouths are actual front-face openings',apertureProbes.every(p=>p.front===null),apertureProbes);
const cone=[];
// Sample the solid sectors halfway between lug-seat cutouts. Moving the cone
// inward legitimately gives it five scalloped openings around the service nuts.
const coneAngles=[.5,1.5,2.5].map(k=>phase+k*2*Math.PI/5);
for(const angle of coneAngles){
 const samples=Array.from({length:7},(_,i)=>{const r=(section.coneInnerRadius_mm+1+(section.coneOuterRadius_mm-section.coneInnerRadius_mm-2)*i/6)/1000;return{r,z:frontAt(r*Math.cos(angle),r*Math.sin(angle))};});
 check('cone surface is present at angle '+angle,samples.every(s=>s.z!==null),samples);
 const first=samples[0],last=samples.at(-1),slope=(last.z-first.z)/(last.r-first.r),residuals=samples.map(s=>Math.abs(s.z-(first.z+slope*(s.r-first.r))));
 cone.push({angle,samples,depth_mm:(last.z-first.z)*1000,maxLinearDeviation_mm:Math.max(...residuals)*1000});
}
check('broad annulus slopes inward, not a flat land',cone.every(c=>c.depth_mm>=15&&c.samples.every((s,i,a)=>!i||s.z>a[i-1].z)),cone);
check('inward annulus is a taper, not a rounded torus',cone.every(c=>c.maxLinearDeviation_mm<=1.5),cone);
// The full diagram has four ring faces: outer ring 1 at Level 1; rings 2,
// 3 and 4 on one Level 2 plane. The vent trough is between rings 2 and 3,
// and the thin inner groove is between rings 3 and 4.
const byId=new Map(section.rings.map(r=>[r.id,r])),ring1=byId.get('ring1'),ring2=byId.get('ring2'),ring3=byId.get('ring3'),ring4=byId.get('ring4'),groove=section.separatorGroove,lip=section.outerLip,vent=section.ventChannel;
check('four distinct rings follow the diagram radial order',byId.size===4&&[ring1,ring2,ring3,ring4].every(Boolean)&&ring4.innerRadius_mm<ring4.outerRadius_mm&&ring4.outerRadius_mm<groove.innerRadius_mm&&groove.innerRadius_mm<groove.outerRadius_mm&&groove.outerRadius_mm<ring3.innerRadius_mm&&ring3.innerRadius_mm<ring3.outerRadius_mm&&ring3.outerRadius_mm<vent.innerRadius_mm&&vent.innerRadius_mm<vent.outerRadius_mm&&vent.outerRadius_mm<ring2.innerRadius_mm&&ring2.innerRadius_mm<ring2.outerRadius_mm&&ring2.outerRadius_mm<ring1.innerRadius_mm&&ring1.innerRadius_mm<ring1.outerRadius_mm&&ring1.outerRadius_mm<lip.innerRadius_mm&&lip.innerRadius_mm<lip.outerRadius_mm,{rings:section.rings,groove,lip,vent});
check('ring and trough levels match the full depth diagram',lip.level===0&&ring1.level===1&&[ring2,ring3,ring4].every(r=>r.level===2)&&vent.level===3,{lip,ring1,ring2,ring3,ring4,vent});
const width=ring=>ring.outerRadius_mm-ring.innerRadius_mm;
check('outer ring 1 is slightly narrower than ring 2',width(ring1)<width(ring2)&&width(ring1)/width(ring2)>=.6,{ring1Width_mm:width(ring1),ring2Width_mm:width(ring2)});
check('ring 4 is ten percent wider than ring 3',Math.abs(width(ring4)/width(ring3)-1.10)<=.005,{ring3Width_mm:width(ring3),ring4Width_mm:width(ring4),ratio:width(ring4)/width(ring3),targetRatio:1.10,tolerance:.005});
function sampleRadialBand(band,inset=.5,count=7,angles=[.11,.81,1.77]){
 return angles.map(angle=>({angle,samples:Array.from({length:count},(_,i)=>{
  const r=(band.innerRadius_mm+inset+(band.outerRadius_mm-band.innerRadius_mm-2*inset)*i/(count-1))/1000;
  return{r,z:frontAt(r*Math.cos(angle),r*Math.sin(angle))};
 })}));
}
const rings=section.rings.map(r=>({...r,slices:sampleRadialBand(r)}));
for(const ring of rings){
 const values=ring.slices.flatMap(s=>s.samples.map(p=>p.z));
 check(ring.id+' is a continuous annular face',values.every(z=>z!==null),ring);
 check(ring.id+' face is planar rather than a rounded bead',Math.max(...values)-Math.min(...values)<=.0003&&values.every(z=>Math.abs(z-ring.frontZ_mm/1000)<=.0003),ring);
}
const sampledRing=id=>rings.find(r=>r.id===id),allZ=slices=>slices.flatMap(s=>s.samples.map(p=>p.z));
const sharedRingZ=['ring2','ring3','ring4'].flatMap(id=>allZ(sampledRing(id).slices));
check('rings 2 3 and 4 share one actual Level 2 plane',Math.max(...sharedRingZ)-Math.min(...sharedRingZ)<=.0003,{rings:sharedRingZ});
// The outer cast mark must sit on ring 2 itself. Inspect its actual source
// vertices: metadata alone would not catch lettering left on the old ring 1.
const logo=section.outerLogo,logoVertices=[];
for(let i=0;i<(data.groups.lettering?.positions.length||0);i+=3){
 const point=data.groups.lettering.positions.slice(i,i+3);
 if(Math.hypot(point[0],point[1])>.150)logoVertices.push(point);
}
check('outer logo declares ring 2 as its carrier',finiteFields(logo,['radius_mm','baseZ_mm','width_mm','height_mm'])&&logo.ring==='ring2'&&logo.radius_mm>ring2.innerRadius_mm&&logo.radius_mm<ring2.outerRadius_mm,logo);
check('outer cast logo geometry is present',logoVertices.length>0,{vertices:logoVertices.length});
const logoBounds={rMin_mm:Infinity,rMax_mm:-Infinity,yMin_mm:Infinity,yMax_mm:-Infinity,zMin_mm:Infinity,zMax_mm:-Infinity};
for(const [x,y,z]of logoVertices){
 const r=Math.hypot(x,y)*1000;
 logoBounds.rMin_mm=Math.min(logoBounds.rMin_mm,r);logoBounds.rMax_mm=Math.max(logoBounds.rMax_mm,r);
 logoBounds.yMin_mm=Math.min(logoBounds.yMin_mm,y*1000);logoBounds.yMax_mm=Math.max(logoBounds.yMax_mm,y*1000);
 logoBounds.zMin_mm=Math.min(logoBounds.zMin_mm,z*1000);logoBounds.zMax_mm=Math.max(logoBounds.zMax_mm,z*1000);
}
check('outer logo lies entirely inside ring 2 radial bounds',logoBounds.rMin_mm>=ring2.innerRadius_mm-.1&&logoBounds.rMax_mm<=ring2.outerRadius_mm+.1&&Math.abs((logoBounds.yMin_mm+logoBounds.yMax_mm)/2-logo.radius_mm)<.3,{logo,logoBounds,ring2});
check('outer logo is raised just above the Level 2 carrier face',logoBounds.zMin_mm>=ring2.frontZ_mm-.1&&logoBounds.zMax_mm<=ring2.frontZ_mm+3&&Math.abs(logoBounds.zMin_mm-logo.baseZ_mm)<=.3,{logo,logoBounds,ring2FrontZ_mm:ring2.frontZ_mm});
const lipSamples=sampleRadialBand(lip),lipZ=allZ(lipSamples),ring1Z=allZ(sampledRing('ring1').slices);
check('thin outer lip is a continuous Level 0 front face',width(lip)<=3&&lipZ.every(z=>z!==null&&Math.abs(z-lip.frontZ_mm/1000)<=.0003),{lip,lipSamples});
check('Level 0 lip stands ahead of Level 1 ring',Math.min(...lipZ)-Math.max(...ring1Z)>=.001,{lipZ,ring1Z});
check('Level 1 ring stands ahead of shared Level 2 plane',Math.min(...ring1Z)-Math.max(...sharedRingZ)>=.001,{ring1Z,sharedRingZ});
check('lip metadata matches the structural front limit',Math.abs(lip.frontZ_mm-section.lipFrontZ_mm)<.01,{lipFrontZ_mm:lip.frontZ_mm,structuralFrontZ_mm:section.lipFrontZ_mm});
const ventSamples=sampleRadialBand(vent,.5,7,vent.sampleAngles_deg.map(a=>a*Math.PI/180)),ventZ=allZ(ventSamples);
check('vent channel has a continuous floor on its solid webs',ventZ.every(z=>z!==null&&Math.abs(z-vent.frontZ_mm/1000)<=.0003),{vent,ventSamples});
check('Level 3 vent channel lies behind Level 2 rings',Math.min(...sharedRingZ)-Math.max(...ventZ)>=.002,{sharedRingZ,ventZ});
const grooveSamples=sampleRadialBand(groove,.2),ringPlane=Math.min(ring3.frontZ_mm,ring4.frontZ_mm)/1000;
check('inner groove remains thin relative to the adjacent ring faces',ring3.innerRadius_mm-ring4.outerRadius_mm<Math.min(width(ring3),width(ring4))/3&&ring3.innerRadius_mm-ring4.outerRadius_mm>=1,{mouthWidth_mm:ring3.innerRadius_mm-ring4.outerRadius_mm,ring3Width_mm:width(ring3),ring4Width_mm:width(ring4)});
check('thin inner groove has a continuous floor',grooveSamples.every(s=>s.samples.every(p=>p.z!==null)),grooveSamples);
check('thin inner groove is recessed behind rings 3 and 4',grooveSamples.every(s=>s.samples.every(p=>ringPlane-p.z>=.002&&Math.abs(p.z-groove.floorZ_mm/1000)<=.0003)),{ring3,ring4,groove,grooveSamples});
const blendWidth=ring4.innerRadius_mm-section.coneOuterRadius_mm;
check('taper meets the inner edge of ring 4 through only a small edge blend',blendWidth>=0&&blendWidth<=2.5,{ring4InnerRadius_mm:ring4.innerRadius_mm,coneOuterRadius_mm:section.coneOuterRadius_mm,blendWidth_mm:blendWidth});
const transition=[.11,.81,1.77].map(angle=>({angle,samples:[section.coneOuterRadius_mm-.5,section.coneOuterRadius_mm+blendWidth/2,ring4.innerRadius_mm-.2].map(radius_mm=>{const r=radius_mm/1000;return{radius_mm,z:frontAt(r*Math.cos(angle),r*Math.sin(angle))};})}));
check('actual taper descends inward directly from ring 4',transition.every(t=>t.samples.every(s=>s.z!==null)&&t.samples.every((s,i,a)=>!i||s.z>a[i-1].z)&&t.samples.at(-1).z-t.samples[0].z>=.0015&&Math.abs(t.samples.at(-1).z-ring4.frontZ_mm/1000)<.003),transition);
const capRadius=data.features.capDiameter_mm/2000,capPoints=[[0,0],[capRadius*.65,0],[-capRadius*.65,0],[0,capRadius*.65],[0,-capRadius*.65]],capDepths=capPoints.map(([x,y])=>frontAt(x,y));
check('cap closes the centre with a flat front',capDepths.every(z=>z!==null&&Math.abs(z-section.capFaceZ_mm/1000)<.0003),{capPoints,capDepths,expected_mm:section.capFaceZ_mm});
check('Level 4 cap sits behind the Level 3 vent floor',Math.min(...ventZ)-Math.max(...capDepths)>=.001,{ventZ,capDepths});
const floorRadius=(capRadius+.075)/2,floor=frontAt(floorRadius*Math.cos(Math.PI*.3),floorRadius*Math.sin(Math.PI*.3));
check('lug floor lies behind the cap face',floor!==null&&Math.abs(floor-section.lugFloorZ_mm/1000)<.002&&floor<Math.min(...capDepths)-.003,{floorRadius,floor,capDepths});
check('nut heads stand ahead of the cap but behind the lip',maxZ>Math.max(...capDepths)+.001&&maxZ<section.lipFrontZ_mm/1000-.001,{headMaxZ:maxZ,capDepths,lipFrontZ_mm:section.lipFrontZ_mm});
check('cap is recessed behind the surrounding face',cone.every(c=>c.samples.at(-1).z>Math.max(...capDepths)+.010),{capDepths,outerConeDepths:cone.map(c=>c.samples.at(-1).z)});
await fs.writeFile(work+'/geometry-checks.json',JSON.stringify({checks,winding,cone,headClearance,rings,outerLip:{...lip,slices:lipSamples},ventChannel:{...vent,slices:ventSamples},groove:{...groove,slices:grooveSamples},transition,apertures:{specification:apertures,bounds:apertureBounds,probes:apertureProbes}},null,2)+'\n');console.log(checks.length+'/'+checks.length+' KMC geometry checks pass');
}catch(error){
 await fs.writeFile(work+'/geometry-checks.json',JSON.stringify({checks,error:error.message},null,2)+'\n');
 console.error(error.stack);process.exitCode=1;
}
