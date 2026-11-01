# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
from PIL import Image
from scipy.ndimage import label
import json,numpy as np
w=Path(sys.argv[1]);rows=[]
for side in ['L','R']:
 im=np.array(Image.open(w/('final-gap-'+side+'.png')).convert('RGB')).astype(int);region=np.zeros(im.shape[:2],bool);region[300:375,430:870]=1;sel=region&(im[:,:,0]>40)&(im[:,:,0]<170)&(im[:,:,0]-im[:,:,1]>=6)&(im[:,:,1]-im[:,:,2]>=6);labels,n=label(sel);pts=[]
 for k in range(1,n+1):
  y,x=np.where(labels==k)
  if len(x)>=2:pts.append([int(np.median(x)),int(np.median(y))])
 sign=1 if side=='L'else-1
 api('eval',{'code':"""(()=>{const t=__creamTest;if(!document.body.classList.contains('clean-view'))document.querySelector('#cleanToggle').click();t.camera.clearViewOffset();t.camera.position.set(3.3,1.09,SIGN*1.15);t.controls.target.set(2.293,.961,SIGN*.620);t.camera.lookAt(t.controls.target);t.camera.near=.01;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);return true})()""".replace('SIGN',str(sign))})
 code="""(()=>{const t=__creamTest;return POINTS.map(([x,y])=>{const r=new t.THREE.Raycaster();r.setFromCamera(new t.THREE.Vector2((x+.5)/720-1,1-(y+.5)/500),t.camera);const hs=r.intersectObject(t.car,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true});const a=(2.25-r.ray.origin.x)/r.ray.direction.x;return{pixel:[x,y],atX225:r.ray.at(a,new t.THREE.Vector3()).toArray(),hits:hs.slice(0,4).map(h=>{const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;return{part:m.userData.partId,zone:m.userData.zone,node:h.object.name,face:h.faceIndex,point:h.point.toArray()}})}})})()""".replace('POINTS',json.dumps(pts))
 d=api('eval',{'code':code});rows.append({'side':side,'tanPixels':int(sel.sum()),'rays':d});print(side,int(sel.sum()),json.dumps(d),flush=True)
(w/'close-gap-tan-probe.json').write_text(json.dumps(rows,indent=2))
