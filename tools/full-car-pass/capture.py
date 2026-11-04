"""Cream frames, semantic masks, timings. Local diagnostics only; no product render passes."""
import json,pathlib,urllib.request,sys,time,os,hashlib
work=pathlib.Path('/workspace/full-car-pass/work');url=(work/'url.txt').read_text().strip();tag=sys.argv[1];source=sys.argv[2];mode=sys.argv[3] if len(sys.argv)>3 else 'all'
def api(p,d={}):
 try:return json.loads(urllib.request.urlopen(urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=240).read() or b'null')
 except urllib.error.HTTPError as e:raise RuntimeError(e.read().decode())
def ev(c):return api('eval',{'code':c})
api('reload',{'source':source});(work/tag).mkdir(exist_ok=True);poses=json.loads((work.parent/'poses.json').read_text());log=[]
meta={'source':source,'indexSha256':hashlib.sha256(pathlib.Path(source,'index.html').read_bytes()).hexdigest(),'viewport':[1600,1000],'deviceScaleFactor':1,'engine':'Chromium SwiftShader','physicalDevice':False};(work/tag/'meta.json').write_text(json.dumps(meta,indent=2)+'\n')
def checkpoint(): (work/tag/'capture.json').write_text(json.dumps(log,indent=2)+'\n')
for rim in (os.environ['LC_CAPTURE_RIMS'].split(',') if os.environ.get('LC_CAPTURE_RIMS') else ['stock'] if mode=='stock' else ['stock','kmc','method','steel']):
 ev("lcBuild.setState({rim:'"+rim+"'})")
 api('viewport',{'width':1600,'height':1000})
 for shot in poses['views']+poses['details']:
  if os.environ.get('LC_CAPTURE_FILTER') and shot['name'] not in os.environ['LC_CAPTURE_FILTER'].split(','):continue
  ev("document.body.classList.add('clean-view');__test.pose("+json.dumps(shot)+')');time.sleep(.4);name=tag+'/'+rim+'-'+shot['name'];info=api('capture',{'name':name});info.update(name=name,shot=shot);log.append(info)
  if rim=='stock':
   api('mask',{'name':name+'-mask','mode':'node'})
   if shot['name'] in ['headlamp','tail-lamp']:api('mask',{'name':name+'-interior-mask','mode':'interior'})
  if shot['name'] in ['fq','side'] and mode!='stock':
   timing=ev("(()=>{const t=__test,gl=t.renderer.getContext(),times=[];for(let i=0;i<16;i++){const a=performance.now();t.draw();gl.finish();times.push(performance.now()-a)}return{ms:times.slice(4),...t.info(),method:'synchronous renderer + gl.finish; SwiftShader Chromium, emulated device'}})()")
   info['performance']=timing
  checkpoint();print(name,flush=True)
 if mode!='stock':
  api('viewport',{'width':390,'height':844})
  for preset in ['front','side','rear','quarter','top']:
   ev("__test.resume();document.querySelector('[data-view="+preset+"]').click();true")
   time.sleep(3);ev('__test.pause();__test.draw();true')
   name=tag+'/'+rim+'-phone-'+preset;info=api('capture',{'name':name});info.update(name=name);log.append(info);checkpoint()
   if preset=='quarter':info['performance']=ev("(()=>{const t=__test,gl=t.renderer.getContext(),times=[];for(let i=0;i<16;i++){const a=performance.now();t.draw();gl.finish();times.push(performance.now()-a)}return{ms:times.slice(4),...t.info(),method:'synchronous renderer + gl.finish; 390x844 emulation, not physical phone'}})()")
(work/tag/'capture.json').write_text(json.dumps(log,indent=2)+'\n')
