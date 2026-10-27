"""Compact source triangle subsets without changing accessor values or stored transforms."""
from pathlib import Path
import json,sys,copy,hashlib,collections
import numpy as np
from gltf_binary import read_glb,write_glb,accessor,world_positions,node_worlds,DT,NC
source=Path(sys.argv[1]);inventory=Path(sys.argv[2]);out=Path(sys.argv[3]);reportdir=Path(sys.argv[4]);out.mkdir(parents=True,exist_ok=True);reportdir.mkdir(parents=True,exist_ok=True)
records=json.loads((inventory/'classified.json').read_text());sources={s:read_glb(source/(s+'.glb')) for s in ['vehicle','interior','garnish']};maps={}
for x in json.loads((inventory/'mapping.json').read_text()):maps[(x['source'],x['node'],x['primitive'])]=np.load(inventory/x['file'])
unknown=[r for r in records if r['part'] is None]
unknownReasons={1190:'Connected chrome belt strip spans rear door and fixed rear-quarter boundaries.',1192:'Connected chrome belt strip spans rear door and fixed rear-quarter boundaries.',1708:'Connected black underbody/body piece spans most of vehicle and rises above sill; frame/axle classification uncertain.',1778:'Rear underside black component cannot be identified confidently as frame, exhaust or bumper attachment.',2071:'Single connected clear component spans rear lamp and running-board locations.',2087:'Small central front clear component has no confidently identified lamp/camera/sensor role.'}
for i,r in enumerate(unknown,1):r['part']=f'unsorted_{i:02d}';r['classification']=unknownReasons.get(r['component'],r['classification'])
parts=collections.defaultdict(list)
for r in records:parts[r['part']].append(r)
zoneMap={'paint':'paint','chrome':'chrome','black':'black','tire':'tyre','rim':'rim','rim_second':'rim','brakedisk':'brake','windowglass':'glass','darkglass':'glass','mirror':'mirror','redglass':'lamp_red','clearglass':'lamp_clear','orangeglass':'lamp_orange','Garnish':'chrome','Original seats and cabin':'interior','interior':'interior'}
def zone(label,m):
 if label=='interior':return'interior'
 return zoneMap.get(m.get('name','').split('.')[0],m.get('name','unknown').lower())
coverage={k:np.zeros(len(v),np.uint8) for k,v in maps.items()};entries=[];proof=[];maxDeviation=0
for partid,pieces in sorted(parts.items()):
 boundsMin=np.min([r['bounds']['min']for r in pieces],axis=0);boundsMax=np.max([r['bounds']['max']for r in pieces],axis=0)
 if partid.startswith('wheel_'):
  front=partid[6]=='F';left=partid[-1]=='L';pivot=[-1.635 if front else 1.215,.3965,(.825 if front else .8225)*(1 if left else -1)];basis='specified axle/hub coordinates; no vertex rebasing'
 elif partid=='body_shell':pivot=[0,0,0];basis='stored vehicle frame'
 else:pivot=((boundsMin+boundsMax)/2).tolist();basis='component-group bounding-box centre; hinge/mount location not verified'
 j={'asset':{'version':'2.0','generator':'LC200 lossless parts foundation'},'scene':0,'scenes':[{'name':partid,'nodes':[0]}],'nodes':[{'name':partid,'translation':pivot,'children':[1],'extras':{'partId':partid,'slot':partid,'rigidClass':'wheel' if partid.startswith('wheel_')else'body'}},{'name':'stored_frame','translation':[-p for p in pivot],'children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'extensionsUsed':['KHR_mesh_quantization'],'extensionsRequired':['KHR_mesh_quantization']};binary=bytearray();materialLookup={};entryProof=[];zones=set();ntri=0
 def append_accessor(a,q,target):
  while len(binary)%4:binary.append(0)
  offset=len(binary);item=q.dtype.itemsize*len(q[0]);stride=(item+3)//4*4 if target==34962 else item
  if stride!=item:
   raw=np.zeros((len(q),stride),np.uint8);raw[:,:item]=q.view(np.uint8).reshape(len(q),item);data=raw.tobytes()
  else:data=q.tobytes()
  binary.extend(data);view={'buffer':0,'byteOffset':offset,'byteLength':len(data),'target':target}
  if target==34962:view['byteStride']=stride
  vi=len(j['bufferViews']);j['bufferViews'].append(view);aa={k:copy.deepcopy(v) for k,v in a.items() if k not in ['bufferView','byteOffset','count','min','max','sparse']};aa.update(bufferView=vi,byteOffset=0,count=len(q));aa['min']=q.min(0).tolist();aa['max']=q.max(0).tolist();ai=len(j['accessors']);j['accessors'].append(aa);return ai
 byNode=collections.defaultdict(list)
 for r in pieces:byNode[(r['source'],r['node'])].append(r)
 for (label,ni),nodePieces in sorted(byNode.items()):
  sj,sb=sources[label];sn=sj['nodes'][ni];assert not sn.get('children'),'Source hierarchy requires preservation handling';newnode={k:copy.deepcopy(v) for k,v in sn.items() if k not in ['mesh','children']};newnode.setdefault('extras',{}).update({'sourceAsset':label,'sourceNode':ni});newmesh={'name':sn.get('name','mesh'),'primitives':[]}
  for pi,sp in enumerate(sj['meshes'][sn['mesh']]['primitives']):
   ids=[r['component']for r in nodePieces if r['primitive']==pi]
   if not ids:continue
   faceIds=np.flatnonzero(np.isin(maps[(label,ni,pi)],ids));coverage[(label,ni,pi)][faceIds]+=1
   inds=accessor(sj,sb,sp['indices']).reshape(-1,3) if 'indices'in sp else np.arange(sj['accessors'][sp['attributes']['POSITION']]['count']).reshape(-1,3)
   selected=inds[faceIds];vertices=np.unique(selected);remap=np.full(sj['accessors'][sp['attributes']['POSITION']]['count'],-1,np.int64);remap[vertices]=np.arange(len(vertices));newidx=remap[selected].reshape(-1,1).astype('<u2'if len(vertices)<65536 else'<u4')
   prim={k:copy.deepcopy(v)for k,v in sp.items()if k not in ['attributes','indices','material']};prim['attributes']={}
   for semantic,ai in sp['attributes'].items():
    q=accessor(sj,sb,ai)[vertices];prim['attributes'][semantic]=append_accessor(sj['accessors'][ai],q,34962)
   ia={'type':'SCALAR','componentType':5123 if newidx.dtype.itemsize==2 else 5125};prim['indices']=append_accessor(ia,newidx,34963)
   oldmi=sp.get('material',0);mk=(label,oldmi)
   if mk not in materialLookup:
    materialLookup[mk]=len(j['materials']);m=copy.deepcopy(sj['materials'][oldmi]);m.setdefault('extras',{}).update(zone=zone(label,m),sourceMaterial=m.get('name',''));j['materials'].append(m)
   prim['material']=materialLookup[mk];zones.add(j['materials'][prim['material']]['extras']['zone'])
   ref={'asset':label,'node':ni,'primitive':pi,'vertices':len(vertices),'triangles':len(faceIds),'components':ids,'sourceVertexIdsSha256':hashlib.sha256(vertices.astype('<u4').tobytes()).hexdigest()};prim.setdefault('extras',{})['source']=ref
   newmesh['primitives'].append(prim);entryProof.append({'outputNode':len(j['nodes']),'outputPrimitive':len(newmesh['primitives'])-1,'ref':ref,'sourceVertexIds':vertices})
   ntri+=len(faceIds)
  newnode['mesh']=len(j['meshes']);j['meshes'].append(newmesh);j['nodes'][1]['children'].append(len(j['nodes']));j['nodes'].append(newnode)
 path='base.glb'if partid=='body_shell'else'parts/'+partid+'.glb';write_glb(out/path,j,binary);oj,ob=read_glb(out/path);decodedProof=[]
 for p in entryProof:
  ref=p['ref'];sj,sb=sources[ref['asset']];sp=sj['meshes'][sj['nodes'][ref['node']]['mesh']]['primitives'][ref['primitive']];op=oj['meshes'][oj['nodes'][p['outputNode']]['mesh']]['primitives'][p['outputPrimitive']];v=p['sourceVertexIds']
  for semantic in sp['attributes']:assert np.array_equal(accessor(sj,sb,sp['attributes'][semantic])[v],accessor(oj,ob,op['attributes'][semantic]))
  a=world_positions(sj,sb,ref['node'],sp)[v];b=world_positions(oj,ob,p['outputNode'],op);dev=float(np.abs(a-b).max());maxDeviation=max(maxDeviation,dev);assert dev<1e-12
  decodedProof.append({**ref,'accessorCodesByteExact':True,'worldMaxDeviationMetres':dev})
 entry={'id':partid,'slot':partid,'url':path,'pivot':pivot,'pivotBasis':basis,'zones':sorted(zones),'triangles':ntri,'bounds':{'min':boundsMin.tolist(),'max':boundsMax.tolist()},'rigidClass':'wheel'if partid.startswith('wheel_')else'body','componentIds':[r['component']for r in pieces],'classification':pieces[0]['classification']if partid.startswith('unsorted_')else'Blender loose pieces assigned by source family and bounding-box location','thumbnail':'../docs/foundation/parts/'+partid+'.png'};entries.append(entry);proof.append({'id':partid,'url':path,'primitives':decodedProof});print('EXPORTED',partid,ntri,len(binary),'raw bytes')
assert all(np.all(a==1)for a in coverage.values()),'A source triangle was dropped or assigned more than once'
missing={'arch_flares':'Flare surfaces are integrated into larger connected fender/body panels; separating them would require arbitrary face cutting.','chassis':'No confidently isolated frame/axle component; broad connected underside/body geometry is retained as unsorted_03 and rear underside attachment as unsorted_04.'}
slots={e['slot']:{'default':e['id'],'pivot':e['pivot'],'rigidClass':e['rigidClass']}for e in entries};slots.update({k:{'default':None,'reason':v,'rigidClass':'body'}for k,v in missing.items()})
base=next(e for e in entries if e['id']=='body_shell');manifest={'version':1,'units':'metres','coordinateSystem':{'x':'length; front is negative','y':'up','z':'left is positive'},'scale':1,'base':base,'parts':[e for e in entries if e!=base],'displayBase':{'url':'display-base.glb'},'slots':slots,'missingTargets':missing,'source':{'geometry':'Original stored vehicle/interior/garnish; no runtime deformation','triangles':sum(e['triangles']for e in entries),'maxVertexDeviationMetres':maxDeviation},'materials':{'zones':sorted(set(z for e in entries for z in e['zones']))}}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(reportdir/'segmentation.json').write_text(json.dumps({'blenderVersion':'4.3.2','sourceComponents':len(records),'deliveredParts':len(entries),'unsorted':[{k:v for k,v in e.items()if k!='componentIds'}for e in entries if e['id'].startswith('unsorted_')],'missingTargets':missing,'triangleCoverageExactlyOnce':True,'sourceTriangles':sum(len(v)for v in maps.values()),'outputTriangles':sum(e['triangles']for e in entries),'maxVertexDeviationMetres':maxDeviation,'maxVertexDeviationMm':maxDeviation*1000,'proof':proof},indent=2)+'\n')
