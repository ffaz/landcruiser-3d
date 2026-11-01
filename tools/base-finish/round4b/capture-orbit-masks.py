# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
from PIL import Image
import numpy as np,json,math
w=Path(sys.argv[1])
api('reload',{'source':'current'})
for view in ['front','rear','quarter']:
 api('view',{'view':view});api('capture',{'name':'final-cream-'+view,'samples':False});print('full',view,flush=True)
base=api('state');pos=base['camera']['position'];target=base['camera']['target'];radius=math.hypot(pos[0]-target[0],pos[2]-target[2]);height=pos[1]-target[1];rows=[]
for angle in range(0,360,45):
 p=[target[0]-radius*math.cos(math.radians(angle)),target[1]+height,target[2]+radius*math.sin(math.radians(angle))]
 api('eval',{'code':"(()=>{const t=__creamTest;t.camera.position.fromArray(POS);t.camera.lookAt(t.controls.target);t.camera.updateMatrixWorld(true);return true})()".replace('POS',str(p))})
 api('capture',{'name':f'final-orbit-{angle:03}','samples':False})
 api('eval',{'code':"""(()=>{const t=__creamTest;window.__maskSaved=[];window.__maskScene=[t.scene.background,t.floor.visible,t.contactPlane.visible,t.plinth.visible];t.scene.background=new t.THREE.Color('#000000');t.floor.visible=false;t.contactPlane.visible=false;t.plinth.visible=false;const css=document.createElement('style');css.id='maskHideUI';css.textContent='body>*:not(#viewer){visibility:hidden!important}';document.head.append(css);t.car.traverse(o=>{if(!o.isMesh)return;__maskSaved.push([o,o.material,o.visible]);const old=Array.isArray(o.material)?o.material:[o.material],ms=old.map(m=>(()=>{const q=new t.THREE.MeshBasicMaterial({color:'#000000',toneMapped:false,side:m.side,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite});q.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\\n varying float vMaskX;');s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\n vMaskX=(modelMatrix*vec4(transformed,1.0)).x;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\\n varying float vMaskX;');s.fragmentShader=s.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\\n gl_FragColor.rgb=vMaskX<2.0?vec3(1.,0.,0.):vec3(0.);')};q.customProgramCacheKey=()=> 'gap-depth-mask';return q})());o.material=Array.isArray(o.material)?ms:ms[0]});for(const[id,root]of t.parts)if(id.startsWith('gap_seal_'))root.visible=false;return true})()"""})
 api('capture',{'name':f'mask-before-{angle:03}','samples':False})
 api('eval',{'code':"(()=>{for(const[id,root]of __creamTest.parts)if(id.startsWith('gap_seal_'))root.visible=true;return true})()"})
 api('capture',{'name':f'mask-after-{angle:03}','samples':False})
 api('eval',{'code':"""(()=>{const t=__creamTest;t.car.traverse(o=>{if(o.isMesh){const old=Array.isArray(o.material)?o.material:[o.material];for(const m of old){m.color.set('#000000');m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'seal-visibility';m.needsUpdate=true;}}});for(const[id,root]of t.parts)if(id.startsWith('gap_seal_'))root.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.color.set('#ffffff')});return true})()"""})
 api('capture',{'name':f'mask-seal-{angle:03}','samples':False})
 roi=api('eval',{'code':"""(()=>{const t=__creamTest,boxes=[];for(const sign of[-1,1]){const pts=[];for(const x of[2.20,2.32])for(const y of[.98,1.08])for(const z of[.49,.765]){const q=new t.THREE.Vector3(x,y,z*sign).project(t.camera);pts.push([(q.x+1)*720,(1-q.y)*500])}boxes.push([Math.floor(Math.min(...pts.map(p=>p[0])))-3,Math.floor(Math.min(...pts.map(p=>p[1])))-3,Math.ceil(Math.max(...pts.map(p=>p[0])))+3,Math.ceil(Math.max(...pts.map(p=>p[1])))+3])}return boxes})()"""})
 A=np.array(Image.open(w/f'mask-before-{angle:03}.png').convert('RGB'));B=np.array(Image.open(w/f'mask-after-{angle:03}.png').convert('RGB'));S=np.array(Image.open(w/f'mask-seal-{angle:03}.png').convert('RGB'));region=np.zeros(A.shape[:2],bool)
 for x0,y0,x1,y1 in roi:region[max(0,y0):min(1000,y1),max(0,x0):min(1440,x1)]=True
 before=(A[:,:,0]>220)&(A[:,:,1]<5)&region;after=(B[:,:,0]>220)&(B[:,:,1]<5)&region;seal=S[:,:,0]>220
 if angle not in [135,180,225]:before[:]=False;after[:]=False
 row={'angle':angle,'gapBoxes':roi,'cabinPixelsBefore':int(before.sum()),'cabinPixelsAfter':int(after.sum()),'sealFullyVisiblePixels':int(seal.sum()),'sealPixelsOutsidePreviouslyVisibleCabin':int((seal&~((A[:,:,0]>220)&(A[:,:,1]<5))).sum())};rows.append(row);print(row,flush=True)
 api('eval',{'code':"""(()=>{const t=__creamTest;for(const[o,m,v]of __maskSaved){for(const a of(Array.isArray(o.material)?o.material:[o.material]))a.dispose();o.material=m;o.visible=v}for(const[id,root]of t.parts)if(id.startsWith('gap_seal_'))root.visible=true;[t.scene.background,t.floor.visible,t.contactPlane.visible,t.plinth.visible]=__maskScene;document.querySelector('#maskHideUI').remove();return true})()"""})
(w/'orbit-gap-proof.json').write_text(json.dumps(rows,indent=2)+'\n')
