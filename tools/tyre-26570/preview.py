import pathlib,json,urllib.request,os
w=pathlib.Path(os.environ['LC_TYRE_WORKDIR']);u=(w/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):
 try:return json.loads(urllib.request.urlopen(urllib.request.Request(u+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=240).read())
 except urllib.error.HTTPError as e:raise Exception(e.read().decode())
for suffix in ['at26570','ht26570']:
 api('reload',{'source':'current'})
 slots={f'wheel_{c}':f'wheel_{c}_{suffix}' for c in ['FL','FR','RL','RR']}
 api('eval',{'code':'lcBuild.setState({slots:'+json.dumps(slots)+',lift_mm:0});document.body.classList.add("clean-view");true'})
 fit=api('eval',{'code':'({fit:lcWorkshop.fitCheck(),state:lcBuild.getState(),dimensions:lcWorkshop.dimensions()})'});(w/(suffix+'-fit.json')).write_text(json.dumps(fit,indent=2))
 for view in ['quarter','side']:
  api('view',{'view':view});api('capture',{'name':suffix+'-car-'+view,'samples':False});print(suffix,view,flush=True)
 radius=fit['fit']['tyre_mm']/2000
 api('eval',{'code':'''(()=>{const t=__creamTest;window.__tyreBeauty=t.parts.get('wheel_FL_'''+suffix+'''').clone(true);__tyreBeauty.visible=true;__tyreBeauty.position.set(0,'''+str(radius)+''',0);t.scene.add(__tyreBeauty);t.car.visible=false;t.plinth.visible=false;t.bakeContactShadow();t.floor.visible=false;t.contactPlane.visible=true;return true;})()'''})
 for name,pos in [('quarter',[1.4,1.10,3.0]),('front',[0,.65,3.3]),('tread',[2.8,1.3,.95])]:
  api('eval',{'code':'__creamTest.camera.position.fromArray('+json.dumps(pos)+');__creamTest.controls.target.set(0,.42,0);__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.camera.near=.02;__creamTest.camera.far=30;__creamTest.camera.clearViewOffset();__creamTest.camera.updateMatrixWorld(true);true'})
  api('capture',{'name':suffix+'-tyre-'+name,'samples':False});print(suffix,name,flush=True)

 if suffix=='ht26570':
  api('eval',{'code':"__tyreBeauty.traverse(n=>{if(n.isMesh)n.visible=n.material.userData.zone==='tyre';});__creamTest.bakeContactShadow();true"})
  api('eval',{'code':"__creamTest.camera.position.set(1.4,1.1,3.0);__creamTest.camera.lookAt(__creamTest.controls.target);true"})
  api('capture',{'name':suffix+'-bare-quarter','samples':False});print(suffix,'bare',flush=True)
