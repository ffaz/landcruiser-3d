import pathlib,json,urllib.request,time
w=pathlib.Path(__import__('os').environ['LC_TYRE_WORKDIR']);url=(w/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):
 req=urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'})
 try:return json.loads(urllib.request.urlopen(req,timeout=240).read())
 except urllib.error.HTTPError as e:raise Exception(e.read().decode())
api('reload',{'source':'current'})
slots={f'wheel_{c}':f'wheel_{c}_at285' for c in ['FL','FR','RL','RR']}
api('eval',{'code':'lcBuild.setState({slots:'+json.dumps(slots)+',lift_mm:0});true'})
fit=api('eval',{'code':'({fit:lcWorkshop.fitCheck(),state:lcBuild.getState(),dimensions:lcWorkshop.dimensions()})'});(w/'fit.json').write_text(json.dumps(fit,indent=2))
api('eval',{'code':"document.body.classList.add('clean-view');true"})
for v in ['quarter','side','front']:
 api('view',{'view':v});api('capture',{'name':'car-A-'+v,'samples':False});print('car',v,flush=True)
# Actual asset isolated on the same studio floor/environment, no image-generation stand-in.
api('eval',{'code':'''(()=>{const t=__creamTest;window.__tyreBeauty=t.parts.get('wheel_FL_at285').clone(true);__tyreBeauty.visible=true;__tyreBeauty.position.set(0,.4154,0);t.scene.add(__tyreBeauty);t.car.visible=false;t.plinth.visible=false;t.bakeContactShadow();t.floor.visible=false;t.contactPlane.visible=true;document.body.classList.add('clean-view');return true;})()'''})
for name,pos in [('quarter',[1.4,1.1,3.0]),('front',[0,.65,3.3]),('tread',[2.8,1.3,.95])]:
 api('eval',{'code':'__creamTest.camera.position.fromArray('+json.dumps(pos)+');__creamTest.controls.target.set(0,.42,0);__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.camera.near=.02;__creamTest.camera.far=30;__creamTest.camera.clearViewOffset();__creamTest.camera.updateMatrixWorld(true);true'})
 api('capture',{'name':'tyre-A-'+name,'samples':False});print('tyre',name,flush=True)
