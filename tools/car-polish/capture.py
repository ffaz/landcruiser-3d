import sys,json,urllib.request,pathlib
w=pathlib.Path(__import__('os').environ['LC_POLISH_WORKDIR']);url=(w/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):return json.loads(urllib.request.urlopen(urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=240).read())
if __name__=='__main__':
 stage=sys.argv[1]
 api('reload',{'source':'baseline' if stage=='before' else 'current'})
 for studio in ['cream','slate','clay']:
  api('studio',{'studio':studio})
  for view in (['front','side','rear','quarter','top'] if studio!='clay' else ['quarter']):
   api('view',{'view':view});
   if stage=='after':
    c=json.loads((w/('before-'+studio+'-'+view+'.json')).read_text())['info']['camera'];api('eval',{'code':'__creamTest.camera.position.fromArray('+json.dumps(c['position'])+');__creamTest.controls.target.fromArray('+json.dumps(c['target'])+');__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.camera.updateMatrixWorld(true);true'})
   api('capture',{'name':stage+'-'+studio+'-'+view,'samples':False}); print(stage,studio,view,flush=True)
