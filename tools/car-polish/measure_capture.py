import sys,json;from capture import api,w
stage=sys.argv[1];api('reload',{'source':'baseline' if stage=='before' else 'current'});api('studio',{'studio':'cream'});api('view',{'view':'side'});
if stage=='after':
 c=json.loads((w/'before-cream-side.json').read_text())['info']['camera'];api('eval',{'code':'__creamTest.camera.position.fromArray('+json.dumps(c['position'])+');__creamTest.controls.target.fromArray('+json.dumps(c['target'])+');__creamTest.camera.lookAt(__creamTest.controls.target);__creamTest.camera.updateMatrixWorld(true);true'})
api('capture',{'name':stage+'-cream-side','samples':False})
print(api('eval',{'code': '[475,505,735,945].flatMap(x=>[425,500,575].map(y=>({x,y,hit:__creamTest.ray(x,y)})))'}),flush=True)
api('eval',{'code':'''(()=>{const{THREE,car}=__creamTest;window.__polishM=[];car.traverse(o=>{if(!o.isMesh)return;__polishM.push([o,o.material]);const cv=m=>new THREE.MeshBasicMaterial({color:m.userData.zone==='paint'?0x00ff00:0x000000,side:m.side,toneMapped:false});o.material=Array.isArray(o.material)?o.material.map(cv):cv(o.material)});__creamTest.draw();return true;})()'''})
api('capture',{'name':stage+'-paint-mask','samples':False})
api('eval',{'code':'__polishM.forEach(([o,m])=>o.material=m);__creamTest.draw();true'})
