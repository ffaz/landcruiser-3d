import json
from capture import api,w
api('view',{'view':'top'})
r=api('eval',{'code':'''(()=>{const{THREE,camera,car}=__creamTest;let a=[];for(let y=358;y<415;y++)for(let x=1170;x<1202;x++){const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2((x+.5)/720-1,1-(y+.5)/500),camera);for(const h of r.intersectObject(car,true)){let vis=true;for(let o=h.object;o;o=o.parent)if(!o.visible)vis=false;if(!vis)continue;const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;if(m.userData.zone==='lamp_red')a.push({x,y,part:m.userData.partId,node:h.object.name,triangle:h.faceIndex,point:h.point.toArray()});break;}}return a})()'''});(w/'hairline-triangles.json').write_text(json.dumps(r,indent=2))
