# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
from PIL import Image
import numpy as np,json,math
w=Path(sys.argv[1]);api('reload',{'source':'current'});api('view',{'view':'quarter'});state=api('state');target=state['camera']['target'];p=state['camera']['position'];r=math.hypot(p[0]-target[0],p[2]-target[2]);h=p[1]-target[1];rows=[]
for row in json.load(open(w/'orbit-gap-proof.json')):
 angle=row['angle'];out={'angle':angle,'cabinPixelsAfter':0,'candidates':0,'classifiedParts':{}}
 if angle not in [135,180,225]:rows.append(out);continue
 a=np.array(Image.open(w/f'mask-after-{angle:03}.png'));region=np.zeros(a.shape[:2],bool)
 for x0,y0,x1,y1 in row['gapBoxes']:region[max(0,y0):min(1000,y1),max(0,x0):min(1440,x1)]=1
 yy,xx=np.where((a[:,:,0]>8)&region);pixels=[[int(x),int(y)]for x,y in zip(xx,yy)]
 pos=[target[0]-r*math.cos(math.radians(angle)),target[1]+h,target[2]+r*math.sin(math.radians(angle))]
 api('eval',{'code':'(()=>{const t=__creamTest;t.camera.position.fromArray('+json.dumps(pos)+');t.camera.lookAt(t.controls.target);t.camera.updateMatrixWorld(true);return true})()'})
 code="""(()=>{const t=__creamTest,r=new t.THREE.Raycaster(),parts={},interior=[];for(const[x,y]of POINTS){r.setFromCamera(new t.THREE.Vector2((x+.5)/720-1,1-(y+.5)/500),t.camera);const hits=r.intersectObject(t.car,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true}),mat=h=>Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material,h=hits.find(h=>!mat(h).transparent||mat(h).opacity>.95);if(!h)continue;const m=mat(h),key=m.userData.partId+':'+m.userData.zone;parts[key]=(parts[key]||0)+1;if(m.userData.zone==='interior')interior.push({pixel:[x,y],part:m.userData.partId,node:h.object.name,face:h.faceIndex})}return{parts,interior}})()""".replace('POINTS',json.dumps(pixels))
 d=api('eval',{'code':code});out.update({'candidates':len(pixels),'cabinPixelsAfter':len(d['interior']),'classifiedParts':d['parts'],'interiorHits':d['interior']});rows.append(out);print(out,flush=True)
(w/'gap-cabin-proof.json').write_text(json.dumps(rows,indent=2)+'\n');assert all(r['cabinPixelsAfter']==0 for r in rows)
