"""Actual native-catalogue renders via the existing test-only review server."""
import pathlib,json,urllib.request,os
w=pathlib.Path(os.environ['LC_RIM_WORKDIR']);url=(w/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):
 try:return json.loads(urllib.request.urlopen(urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=240).read())
 except urllib.error.HTTPError as e:raise Exception(e.read().decode())
def ev(code):return api('eval',{'code':code})
def capture(name):api('capture',{'name':name,'samples':False});print(name,flush=True)
for source in ([] if os.environ.get('LC_SKIP_DEFAULT') else ['baseline','current']):
 api('reload',{'source':source});ev("document.body.classList.add('clean-view');true")
 for studio in ['cream','slate','clay']:
  api('studio',{'studio':studio});capture('default-'+source+'-'+studio)
for style,rim in [('disc','kmc'),('steel','steel'),('window','method')]:
 api('reload',{'source':'current'})
 ev("(async()=>{await lcBuild.setState({rim:'"+rim+"'});document.body.classList.add('clean-view');return true;})()")
 api('view',{'view':'quarter'});capture(style+'-car-quarter')
 api('view',{'view':'side'});capture(style+'-car-side')
 api('view',{'view':'quarter'})
 ev('''(()=>{const t=__creamTest;window.__rimBeauty=t.parts.get('rim_FL_'''+style+'''').clone(true);__rimBeauty.visible=true;__rimBeauty.position.set(0,.231,0);t.scene.add(__rimBeauty);t.car.visible=false;t.plinth.visible=false;t.bakeContactShadow();t.floor.visible=false;t.contactPlane.visible=true;t.controls.target.set(0,.26,0);t.camera.near=.02;t.camera.far=30;t.camera.clearViewOffset();return true;})()''')
 for name,pos in [('quarter',[.82,.63,1.75]),('front',[0,.36,1.94]),('back',[.7,.55,-1.85])]:
  ev('__creamTest.camera.position.fromArray('+json.dumps(pos)+');__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.camera.updateMatrixWorld(true);true');capture(style+'-rim-'+name)
 ev('''(()=>{const t=__creamTest;window.__wheelBeauty=t.parts.get('wheel_FL').clone(true);__wheelBeauty.visible=true;__wheelBeauty.position.set(0,.3965,0);__wheelBeauty.traverse(n=>{if(n.isMesh&&n.material.userData.zone==='tyre')n.position.z=n.userData.stockZ;});t.scene.add(__wheelBeauty);__rimBeauty.position.set(0,.3965,0);t.bakeContactShadow();t.controls.target.set(0,.42,0);t.camera.position.set(1.4,1.10,3);t.camera.lookAt(t.controls.target);return true;})()''')
 capture(style+'-wheel-quarter')
api('reload',{'source':'current'});ev("(async()=>{await lcBuild.setState({rim:'method'});document.body.classList.add('clean-view');return true;})()")
for studio in ['slate','clay']:
 api('studio',{'studio':studio});capture('window-car-'+studio)
