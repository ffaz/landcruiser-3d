"""Fixed on-car poses, stock comparisons and 3x crops; no production camera edits."""
import pathlib,json,urllib.request,os
w=pathlib.Path(os.environ['LC_RIM_WORKDIR']);url=(w/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):
 try:return json.loads(urllib.request.urlopen(urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'}),timeout=240).read())
 except urllib.error.HTTPError as e:raise Exception(e.read().decode())
def ev(c):return api('eval',{'code':c})
def cap(n):api('capture',{'name':n,'samples':False});print(n,flush=True)
api('reload',{'source':'current'});ev("document.body.classList.add('clean-view');true")
gates=[]
for studio in ['cream']:
 for corner in ['FL','RR']:
  pos=[-7.73,2.84,8.22] if corner=='FL' else [7.77,2.84,-8.22]
  for rim in (['kmc','method','steel'] if os.environ.get('LC_SKIP_STOCK') else ['stock','kmc','method','steel']):
   if os.environ.get('LC_ONLY_RIMS') and rim not in os.environ['LC_ONLY_RIMS'].split(','):continue
   ev("(async()=>{await lcBuild.setState({rim:'"+rim+"'});const t=__creamTest;t.camera.position.fromArray("+json.dumps(pos)+");t.controls.target.set(.02,.96,0);t.camera.clearViewOffset();t.camera.lookAt(t.controls.target);t.camera.updateMatrixWorld(true);return true;})()")
   info=ev("""(()=>{const t=__creamTest,state=lcBuild.getState(),cat=lcWorkshop.wheels,r=cat.rims.find(r=>r.id===state.rim),c='"""+corner+"""',p=lcBuild.getManifest().slots['wheel_'+c].pivot,v=new t.THREE.Vector3(...p);v.z+=Math.sign(p[2])*(cat.vehicle.stockOffset_mm-r.offset_mm)/1000;v.project(t.camera);const out={pixel:[(v.x+1)*720,(1-v.y)*500],misses:[],samples:0};if(state.rim==='stock')return out;
    const own=lcBuild.groups.wheels.getObjectByName('wheel_'+c+'_workshop'),part=own.children[0],stock=lcBuild.parts.get('wheel_'+c),targets=[];
    const N=state.rim==='kmc'?8:state.rim==='method'?10:18,R=state.rim==='kmc'?.195:state.rim==='method'?.162:.169;
    for(let i=0;i<N;i++){const a=2*Math.PI*i/N+Math.PI/2+(state.rim==='steel'?Math.PI/18:0);for(const dr of [-.008,-.004,0,.004,.008])for(const da of [-.06,-.03,0,.03,.06])targets.push(['vent_'+i+'_'+dr+'_'+da,(R+dr)*Math.cos(a+da),(R+dr)*Math.sin(a+da),.12]);}
    for(let i=0;i<48;i++){const a=2*Math.PI*i/48;targets.push(['bead_'+i,.247*Math.cos(a),.247*Math.sin(a),.14]);}
    targets.push(['hub',0,0,.12]);part.updateWorldMatrix(true,true);stock.updateWorldMatrix(true,true);
    for(const [name,x,y,z]of targets){const world=part.localToWorld(new t.THREE.Vector3(x,y,z)),ray=new t.THREE.Raycaster(t.camera.position,world.sub(t.camera.position).normalize(),0,50),hits=ray.intersectObjects([own,stock],true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});out.samples++;if(!hits.length)out.misses.push(name);}
    return out;})()""")
   name=f'fit-{studio}-{corner}-{rim}';cap(name);info.update(name=name,studio=studio,corner=corner,rim=rim);gates.append(info)
if os.environ.get('LC_SKIP_STOCK'):
 captured={r['name'] for r in gates}
 gates += [r for r in json.loads((w/'gap-proof.json').read_text()) if r['name'] not in captured]
(w/'gap-proof.json').write_text(json.dumps(gates,indent=2)+'\n')
if any(g['misses'] for g in gates):raise RuntimeError('Wheel coverage failed; see gap-proof.json')
# Full tyre + new rim, using a wrapper to rebase the original wheel's stored car-frame geometry.
for style,rim in [('disc','kmc'),('steel','steel'),('window','method')]:
 if os.environ.get('LC_ONLY_RIMS') and rim not in os.environ['LC_ONLY_RIMS'].split(','):continue
 api('reload',{'source':'current'})
 ev("(async()=>{await lcBuild.setState({rim:'"+rim+"'});document.body.classList.add('clean-view');return true;})()")
 cap(style+'-car-quarter');api('view',{'view':'side'});cap(style+'-car-side')
 ev('''(()=>{const t=__creamTest,src=t.parts.get('wheel_FL'),hub=lcBuild.getManifest().slots.wheel_FL.pivot,r=lcWorkshop.wheels.rims.find(r=>r.id===lcBuild.getState().rim),shift=(60-r.offset_mm)/1000;
 window.__wheelBeauty=new t.THREE.Group();__wheelBeauty.position.set(-hub[0],.39655-hub[1],-hub[2]-shift);const tyre=src.clone(true);tyre.visible=true;tyre.traverse(n=>{if(n.isMesh)n.visible=n.material.userData.zone==='tyre';});__wheelBeauty.add(tyre);t.scene.add(__wheelBeauty);
 window.__rimBeauty=t.parts.get('rim_FL_STYLE').clone(true);__rimBeauty.visible=true;__rimBeauty.position.set(0,.39655,0);t.scene.add(__rimBeauty);t.car.visible=false;t.plinth.visible=false;t.floor.visible=false;t.contactPlane.visible=true;t.bakeContactShadow();t.controls.target.set(0,.42,0);t.camera.position.set(-1.4,1.1,3);t.camera.near=.02;t.camera.far=30;t.camera.clearViewOffset();t.camera.lookAt(t.controls.target);return true;})()'''.replace('STYLE',style))
 cap(style+'-wheel-quarter')
 # Metal face comparison: hardware/adapter omitted only for the product-style reference render.
 ev("__wheelBeauty.visible=false;__rimBeauty.position.set(0,.231,0);__rimBeauty.traverse(n=>{if(n.isMesh)n.visible=['rim','chrome','lettering'].includes(n.material.userData.zone);});__creamTest.controls.target.set(0,.26,0);__creamTest.camera.position.set(-.82,.63,1.75);__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.bakeContactShadow();true")
 cap(style+'-rim-quarter')
 ev('__creamTest.camera.position.set(0,.35,1.94);__creamTest.camera.lookAt(__creamTest.controls.target);true');cap(style+'-rim-front')
