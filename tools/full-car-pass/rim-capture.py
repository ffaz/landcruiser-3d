"""Reference-angle rim renders using production materials, complete hubs and brake hardware."""
import json,pathlib,urllib.request,time,sys
w=pathlib.Path('/workspace/full-car-pass/work');url=(w/'url.txt').read_text().strip();tag=sys.argv[1];(w/tag).mkdir(exist_ok=True)
def api(p,d={}):return json.loads(urllib.request.urlopen(urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=300).read() or b'null')
def ev(code):return api('eval',{'code':code})
log=[]
for rim,style in [('kmc','disc'),('method','window'),('steel','steel')]:
 api('reload',{'source':'/workspace/lc-full-car-pass'});api('viewport',{'width':1600,'height':1000});ev("lcBuild.setState({rim:'"+rim+"'})")
 ev("""(()=>{const t=__test,T=t.THREE;document.body.classList.add('clean-view');window.__rim=t.parts.get('rim_FL_STYLE').clone(true);__rim.visible=true;__rim.position.set(0,0,0);t.scene.add(__rim);t.car.visible=false;t.floor.visible=false;t.contactPlane.visible=false;t.plinth.visible=false;t.pause();return true})()""".replace('STYLE',style))
 for angle,az in [('front',90),('quarter',65)]:
  ev('__test.pose('+json.dumps(dict(target=[0,0,0],az=az,el=0 if angle=='front' else 12,d=2,fov=18))+')');time.sleep(.4)
  name=tag+'/'+rim+'-'+angle;r=api('capture',{'name':name});r['name']=name;log.append(r);print(name,flush=True)
 # Full on-car wheels with tyre: proof is never a tyreless isolated metal face.
 ev('__test.scene.remove(__rim);__test.car.visible=true;__test.floor.visible=true;true')
 for corner,target,az in [('FL',[-1.635,.3965,.97],65),('RR',[1.215,.3965,-.97],220)]:
  ev('__test.pose('+json.dumps(dict(target=target,az=az,el=5,d=6,fov=11))+')');name=tag+'/'+rim+'-car-'+corner;r=api('capture',{'name':name});r['name']=name;log.append(r);print(name,flush=True)
(w/tag/'capture.json').write_text(json.dumps(log,indent=2)+'\n')
