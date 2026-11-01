# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
from PIL import Image
import numpy as np,json,math
w=Path(sys.argv[1]);allrows=[]
for angle in [135,180,225]:
 S=np.array(Image.open(w/f'mask-seal-{angle:03}.png'));yy,xx=np.where(S[:,:,0]>220);points=[[int(x),int(y)]for x,y in zip(xx,yy)]
 state=api('state');t=state['camera']['target'];p=state['camera']['position'];r=math.hypot(p[0]-t[0],p[2]-t[2]);h=p[1]-t[1];pos=[t[0]-r*math.cos(math.radians(angle)),t[1]+h,t[2]+r*math.sin(math.radians(angle))]
 api('eval',{'code':'(()=>{const t=__creamTest;t.camera.position.fromArray('+json.dumps(pos)+');t.camera.lookAt(t.controls.target);t.camera.updateMatrixWorld(true);return true})()'})
 code="""(()=>{const t=__creamTest,out={tested:0,throughRecess:0,edgeSamples:0,frontSurfaceConflicts:[],maximumConflictMm:0},r=new t.THREE.Raycaster(),matrix=new t.THREE.Matrix3();for(const[x,y]of POINTS){r.setFromCamera(new t.THREE.Vector2((x+.5)/720-1,1-(y+.5)/500),t.camera);const hs=r.intersectObject(t.car,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true}),material=h=>Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material,seal=hs.find(h=>material(h).userData.partId?.startsWith('gap_seal_')),old=hs.find(h=>!material(h).userData.partId?.startsWith('gap_seal_')&&(!material(h).transparent||material(h).opacity>.95));out.tested++;if(!seal||!old){out.edgeSamples++;continue}const facing=old.face.normal.clone().applyMatrix3(matrix.getNormalMatrix(old.object.matrixWorld)).normalize().dot(r.ray.direction),gap=old.distance-seal.distance;if(facing>0||gap>.020||gap<=0){out.throughRecess++;continue}out.frontSurfaceConflicts.push({pixel:[x,y],oldPart:material(old).userData.partId,zone:material(old).userData.zone,node:old.object.name,face:old.faceIndex,facing,gapMm:gap*1000});out.maximumConflictMm=Math.max(out.maximumConflictMm,gap*1000)}return out})()""".replace('POINTS',json.dumps(points))
 row=api('eval',{'code':code});row['angle']=angle;allrows.append(row);print(json.dumps(row),flush=True)
(w/'seal-visibility-ray-proof-final.json').write_text(json.dumps(allrows,indent=2)+'\n')
