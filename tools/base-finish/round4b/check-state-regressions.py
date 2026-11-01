# Test-only. Usage: python SCRIPT WORKDIR
import sys
from api import api
from pathlib import Path
from PIL import Image
import numpy as np,json
w=Path(sys.argv[1]);result={}
def diff(a,b):
 A=np.array(Image.open(w/(a+'.png')).convert('RGB'));B=np.array(Image.open(w/(b+'.png')).convert('RGB'));return {'differentPixels':int(np.any(A!=B,axis=2).sum()),'maxChannelDifference':int(np.abs(A.astype(int)-B.astype(int)).max())}
def close():
 api('eval',{'code':"""(()=>{const t=__creamTest;if(!document.body.classList.contains('clean-view'))document.querySelector('#cleanToggle').click();t.camera.clearViewOffset();t.camera.position.set(3.3,1.09,1.15);t.controls.target.set(2.293,.961,.620);t.camera.lookAt(t.controls.target);t.camera.near=.01;t.camera.updateProjectionMatrix();t.camera.updateMatrixWorld(true);return true})()"""})
for source in ['baseline','current']:
 api('reload',{'source':source})
 if source=='current':api('eval',{'code':"lcBuild.setState({hidden:['gap_seal_rear_L','gap_seal_rear_R']})"})
 api('studio',{'studio':'clay'});api('view',{'view':'quarter'});api('capture',{'name':'proof-'+source+'-clay','samples':False});print(source,'clay',flush=True)
result['claySealsHidden']=diff('proof-baseline-clay','proof-current-clay')
restore="""(()=>{const t=__creamTest;t.car.traverse(o=>{if(!o.isMesh)return;for(const m of(Array.isArray(o.material)?o.material:[o.material])){const id=m.userData.partId||'',z=m.userData.zone;if(z==='chrome'&&(id==='grille'||id==='bumper_front'||id.startsWith('lamp_front_'))){m.color.set('#e1e4e5');m.roughness=.52;m.metalness=.45;m.envMapIntensity=.85;m.clearcoat=.08;m.clearcoatRoughness=.30;}if(z==='lamp_clear'&&id.startsWith('lamp_front_')){m.color.set('#dce8f2');m.opacity=.16;m.roughness=.055;m.emissive.set('#bfd4ef');m.emissiveIntensity=.025;}if(id==='emblem_front')m.envMapIntensity=8;if(id.startsWith('lamp_rear_')&&z.startsWith('lamp_')){m.emissiveIntensity=z==='lamp_red'?.32:z==='lamp_clear'?.12:.06;if(z==='lamp_red')m.color.set('#97000e');}}});return true})()"""
for source in ['baseline','current']:
 api('reload',{'source':source})
 if source=='current':api('eval',{'code':"lcBuild.setState({slots:{badge_grade:'badge_grade_GXR',lamp_rear_L:'lamp_rear_L_finish3',lamp_rear_R:'lamp_rear_R_finish3'},hidden:['gap_seal_rear_L','gap_seal_rear_R'],lamps_on:true})"})
 api('view',{'view':'quarter'})
 if source=='current':api('eval',{'code':restore})
 api('capture',{'name':'proof-'+source+'-legacy-quarter','samples':False})
 close();api('capture',{'name':'proof-'+source+'-legacy-gap','samples':False});print(source,'legacy',flush=True)
for name in ['quarter','gap']:result['isolatedHiddenSeals_'+name]=diff('proof-baseline-legacy-'+name,'proof-current-legacy-'+name)
# Actual final state: other requested changes remain enabled, so it intentionally differs from the old finish.
api('reload',{'source':'current'});api('eval',{'code':"lcBuild.setState({hidden:['gap_seal_rear_L','gap_seal_rear_R']})"});close();api('capture',{'name':'proof-final-polish-seals-hidden','samples':False})
result['combinedFinishSealsHidden_vsBaseline']=diff('proof-baseline-legacy-gap','proof-final-polish-seals-hidden')
api('eval',{'code':"lcBuild.setState({hidden:[]})"});api('studio',{'studio':'clay'});api('view',{'view':'quarter'});api('capture',{'name':'final-clay-quarter','samples':False})
api('reload',{'source':'current'});close()
for active in [False,True,False]:
 api('eval',{'code':'lcBuild.setState({lamps_on:'+str(active).lower()+'})'});close();api('capture',{'name':'lamps-'+('on'if active else'off'),'samples':False})
 key='on'if active else'off';result['emission_'+key]=api('eval',{'code':"""(()=>{const a=[];for(const[id,root]of __creamTest.parts)if(id.startsWith('lamp_rear_')&&root.visible)root.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m.userData.zone?.startsWith('lamp_'))a.push({part:id,source:m.userData.sourceMaterial,zone:m.userData.zone,emissiveIntensity:m.emissiveIntensity})});return a})()"""})
result['onOffDifference']=diff('lamps-on','lamps-off');(w/'state-proof.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True)
