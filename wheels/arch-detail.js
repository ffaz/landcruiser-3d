// Additive die-cast suspension. Coordinates are metres in the existing car frame.
// Nothing writes into a source geometry or material. Rebuilt only on build changes.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createArchDetail(car){
 const root=new THREE.Group();root.name='Additive arch structure';car.add(root);
 const materials=[
  new THREE.MeshStandardMaterial({color:'#292d30',roughness:.82,metalness:.18}),
  new THREE.MeshStandardMaterial({color:'#363a3c',roughness:.72,metalness:.28}),
  new THREE.MeshStandardMaterial({color:'#222527',roughness:.94,metalness:0})
 ];
 let signature='';
 function update({lift,rise,hidden=[]}){
  const key=JSON.stringify([lift,rise,hidden]);if(key===signature)return;signature=key;
  for(const o of [...root.children]){o.geometry.dispose();root.remove(o);}
  const bins=materials.map(()=>[]),V=p=>new THREE.Vector3(...p);
  function put(g,mat=0){bins[mat].push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();}
  function rod(a,b,r,mat=0,segments=8){
   const va=V(a),vb=V(b),d=vb.clone().sub(va),g=new THREE.CylinderGeometry(r,r,d.length(),segments,1);
   g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));
   g.translate(...va.add(vb).multiplyScalar(.5).toArray());put(g,mat);
  }
  function coil(x,z,y0,y1,r){
   const pts=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2*5.5;pts.push(new THREE.Vector3(x+Math.cos(a)*r,y0+(y1-y0)*i/120,z+Math.sin(a)*r));}
   put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.008,5,false),1);
  }
  const wy=.3965+rise,by=rise+lift;
  // Rear live axle and differential: hub-fixed, never follows the body lift.
  rod([1.215,wy, -.76],[1.215,wy,.76],.040,0,12);
  const diff=new THREE.SphereGeometry(.095,12,8);diff.scale(1,.8,1.25);diff.translate(1.215,wy,0);put(diff);
  for(const [front,x]of [[true,-1.635],[false,1.215]])for(const side of [-1,1]){
   const slot='wheel_'+(front?'F':'R')+(side>0?'L':'R');
   if(hidden.includes(slot))continue;
   const z=v=>v*side;
   // Liner ribs follow the arch outside the unchanged tyre envelope. The
   // stepped crown is a thin moulded return, not a second flat backing panel.
   for(let i=0;i<9;i++){
    const a=(28+i*15.5)*Math.PI/180,rr=.488;
    const rib=new THREE.BoxGeometry(.022,.003,.205);rib.rotateZ(a);
    rib.translate(x+Math.cos(a)*rr,.3965+by+Math.sin(a)*rr,z(.807));put(rib,2);
   }
   if(front){
    // Double wishbones: paired chassis pivots converge on the upright.
    for(const dx of [-.19,.19]){
     rod([x+dx,.69+by,z(.43)],[x,.725+rise,z(.660)],.016,0);
     rod([x+dx,.31+by,z(.39)],[x,.325+rise,z(.660)],.023,0);
    }
    // Coil-over lower eye follows the hub; top mount follows the sprung body.
    const sx=x+.09,sz=z(.625),bottom=.325+rise,top=.875+by;
    rod([sx,bottom,sz],[x,.325+rise,z(.660)],.020,0);
    rod([sx,top,z(.43)],[sx,top,sz],.022,0);
    rod([sx,bottom,sz],[sx,top,sz],.016,1);
    rod([sx,bottom,sz],[sx,bottom+(top-bottom)*.52,sz],.026,0);
    coil(sx,sz,bottom+.11,top-.020,.045);
    rod([x-.26,.415+by,z(.40)],[x-.08,wy-.025,z(.650)],.010,1);
    rod([x,wy,z(.32)],[x,wy,z(.660)],.016,0);
    // CV bellows remain inboard of the source tyre's minimum inner surface.
    for(let i=0;i<5;i++)rod([x,wy,z(.568+i*.015)],[x,wy,z(.577+i*.015)],.033-Math.abs(i-2)*.002,2,10);
   }else{
    const sx=x-.12,sz=z(.625),bottom=.46+rise,top=.865+by;
    rod([sx,wy,sz],[sx,bottom,sz],.048,0,10);
    rod([sx,top,z(.43)],[sx,top,sz],.022,0);
    coil(sx,sz,bottom,top,.045);
    // Separate damper and upper/lower trailing links, attached at both ends.
    rod([x+.12,wy-.02,z(.61)],[x+.25,.85+by,z(.55)],.014,1);
    rod([x+.12,wy-.02,z(.61)],[x+.19,.61+rise+lift*.45,z(.58)],.024,0);
    rod([x-.63,.31+by,z(.55)],[x,wy-.025,z(.62)],.022,0);
    rod([x-.48,.59+by,z(.40)],[x,wy+.065,z(.51)],.016,0);
   }
  }
  let triangles=0;
  bins.forEach((geos,i)=>{if(!geos.length)return;const g=mergeGeometries(geos);geos.forEach(v=>v.dispose());const mesh=new THREE.Mesh(g,materials[i]);
   mesh.name=['Suspension arms and axle','Coils dampers and steering','Moulded liner ribs and CV boots'][i];
   mesh.userData.archDetail=true;mesh.raycast=()=>{};root.add(mesh);triangles+=g.attributes.position.count/3;});
  root.userData.triangles=triangles;
 }
 return {root,update};
}
