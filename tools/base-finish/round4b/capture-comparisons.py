# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
import json
w=Path(sys.argv[1])
cameras={'front-close':([-3.5,1.15,.6],[-2.5565,.94,0]),'front-wide':([-6.7,1.15,1.3],[-2.50,.94,0]),'lamp':([3.65,1.4,1.7],[2.23,1.16,.70]),'grade':([3.3,1.09,1.15],[2.293,.961,.620]),'gap-L':([3.3,1.09,1.15],[2.293,.961,.620]),'gap-R':([3.3,1.09,-1.15],[2.293,.961,-.620])}
for source in ['baseline','current']:
 api('reload',{'source':source})
 api('eval',{'code':"(()=>{if(!document.body.classList.contains('clean-view'))document.querySelector('#cleanToggle').click();return true})()"})
 for name,(pos,target)in cameras.items():
  code="(()=>{const t=__creamTest;t.camera.clearViewOffset();t.camera.position.fromArray(POS);t.controls.target.fromArray(TARGET);t.camera.lookAt(t.controls.target);t.camera.near=.01;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);return true})()".replace('POS',str(pos)).replace('TARGET',str(target))
  api('eval',{'code':code});api('capture',{'name':('final' if source=='current' else source)+'-'+name,'samples':False});print(source,name,flush=True)
