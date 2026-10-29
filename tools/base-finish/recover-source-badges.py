"""Recover original ZIRODESIGN badge triangles only. Requires numpy/scipy.
Usage: python recover-source-badges.py SOURCE_GLB OUT_DIR
Coordinates/normals follow build_model.py then approved rear un-stretch.
No original vehicle file is read for writing. Mount translations are applied by
mount-source-badges.mjs, independently of this immutable source recovery.
"""
from pathlib import Path
import sys,json,struct,hashlib
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
src,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
b=src.read_bytes();sha=hashlib.sha256(b).hexdigest()
assert sha=='45cae7b0f6cd85db51f401a24fc19dd7e1ba9b17d1af624a9583ffe3f766b3e0','Source differs from recovered original'
ln=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+ln]);base=28+ln
assert sum(j['accessors'][p['indices']]['count']//3 for m in j['meshes'] for p in m['primitives'])==979826
sizes={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4};types={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}
def arr(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dt=np.dtype(types[a['componentType']]);return np.ndarray((a['count'],sizes[a['type']]),dtype=dt,buffer=b,offset=base+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*sizes[a['type']]),dt.itemsize)).copy()
def transform(p,n):
 q=p[:,[2,1,0]].astype(float);q[:,0]*=-1;v=n[:,[2,1,0]].astype(float);v[:,0]*=-1
 old=np.array([-2.54582715,-1.60065,1.24003,2.39938188]);new=np.array([-2.585,-1.635,1.215,2.585]);i=np.where(q[:,0]<old[1],0,np.where(q[:,0]<old[2],1,2));sx=(np.diff(new)/np.diff(old))[i];sy=(1.93-.3965)/(1.91471124-.4078672)
 q[:,0]=new[i]+(q[:,0]-old[i])*sx;q[:,1]=.3965+(q[:,1]-.4078672)*sy;v[:,0]/=sx;v[:,1]/=sy
 rear=q[:,0]>1.215;k=1.200/1.370;q[rear,0]=1.215+(q[rear,0]-1.215)*k;v[rear,0]/=k;v/=np.linalg.norm(v,axis=1)[:,None]
 return q.astype('<f4'),v.astype('<f4')
def components(mi):
 pr=j['meshes'][mi]['primitives'][0];p=arr(pr['attributes']['POSITION']);n=arr(pr['attributes']['NORMAL']);idx=arr(pr['indices']).ravel().reshape(-1,3)
 # Position bins connect source split normals for classification only. No weld is exported.
 _,ix=np.unique(np.rint(p/.000005).astype(np.int64),axis=0,return_inverse=True);edges=ix[idx];nv=ix.max()+1
 adj=coo_matrix((np.ones(len(idx)*6),(np.concatenate([edges[:,0],edges[:,1],edges[:,2],edges[:,1],edges[:,2],edges[:,0]]),np.concatenate([edges[:,1],edges[:,2],edges[:,0],edges[:,0],edges[:,1],edges[:,2]]))),shape=(nv,nv)).tocsr();_,labels=connected_components(adj,directed=False)
 return p,n,idx,labels[edges[:,0]]
def write_glb(path,groups,name):
 blob=b'';views=[];access=[];meshes=[];nodes=[{'name':name,'children':list(range(1,len(groups)+1))}]
 for label,p,n,idx in groups:
  colors=np.tile(np.array([1,.5,0],dtype='<f4'),(len(p),1));arrays=[p,n,colors,idx.astype('<u4')];start=len(access)
  for i,a in enumerate(arrays):
   while len(blob)%4:blob+=b'\0'
   views.append({'buffer':0,'byteOffset':len(blob),'byteLength':a.nbytes});blob+=a.tobytes();ac={'bufferView':len(views)-1,'componentType':5125 if i==3 else 5126,'count':a.size if i==3 else len(a),'type':'SCALAR' if i==3 else 'VEC3'}
   if i==0:ac.update(min=p.min(0).tolist(),max=p.max(0).tolist())
   access.append(ac)
  meshes.append({'name':label,'primitives':[{'attributes':{'POSITION':start,'NORMAL':start+1,'COLOR_0':start+2},'indices':start+3,'material':0}]});nodes.append({'name':label,'mesh':len(meshes)-1})
 d={'asset':{'version':'2.0','generator':'Original ZIRODESIGN badge recovery; no retessellation'},'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':access,'materials':[{'name':'chrome','pbrMetallicRoughness':{'baseColorFactor':[.7,.73,.75,1],'metallicFactor':.45,'roughnessFactor':.52}}],'meshes':meshes,'nodes':nodes,'scenes':[{'nodes':[0]}],'scene':0}
 jb=json.dumps(d,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4);blob+=b'\0'*((-len(blob))%4);path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(jb)+len(blob))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(blob),0x004e4942)+blob)
report={'sourceSha256':sha,'sourceTriangles':979826,'sourceFileName':src.name,'mapping':{'axes':'source glTF [x,y,z] -> model [-z,y,x]','xSource':[-2.54582715,-1.60065,1.24003,2.39938188],'xTarget':[-2.585,-1.635,1.215,2.585],'height':'.3965 + (y-.4078672)*(1.930-.3965)/(1.91471124-.4078672)','rearHinge':1.215,'rearFactor':1.2/1.37,'normal':'inverse transpose of the same piecewise mapping; no recomputation'},'parts':[]}
for mi,selections in [(2,{'emblem_rear':[847]}),(4,{'emblem_front':[63],'lettering_rear':[50,52,58,59,60,61,62,64,66,68,69,70,71,74,77,78,79,81,84],'wheel_emblem_FL':[123],'wheel_emblem_FR':[4],'wheel_emblem_RL':[122],'wheel_emblem_RR':[3]})]:
 p,n,idx,labels=components(mi);q,v=transform(p,n)
 for name,cids in selections.items():
  f=np.flatnonzero(np.isin(labels,cids));vertices,remap=np.unique(idx[f],return_inverse=True);pp=q[vertices];nn=v[vertices];ii=remap.reshape(-1,3)
  groups=[]
  for cid in cids:
   groupFaces=np.flatnonzero(labels==cid);gv,gr=np.unique(idx[groupFaces],return_inverse=True);groups.append((f'source_{mi}_{cid}',q[gv],v[gv],gr.reshape(-1,3)))
  write_glb(out/(name+'.glb'),groups,name)
  (out/(name+'-source-indices.json')).write_text(json.dumps({'mesh':mi,'components':cids,'triangles':f.tolist(),'vertices':vertices.tolist()},separators=(',',':')))
  report['parts'].append({'id':name,'sourceMesh':mi,'components':cids,'triangles':len(f),'vertices':len(vertices),'positionSha256':hashlib.sha256(pp.tobytes()).hexdigest(),'normalSha256':hashlib.sha256(nn.tobytes()).hexdigest(),'sourceTriangleIdsSha256':hashlib.sha256(f.astype('<u4').tobytes()).hexdigest(),'mappedBounds':{'min':pp.min(0).tolist(),'max':pp.max(0).tolist()}})
(out/'source-recovery.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['parts'],indent=2))
