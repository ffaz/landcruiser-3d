import numpy as np,json,struct
from pathlib import Path
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
import sys
b=Path(sys.argv[1]).read_bytes();ln=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+ln]);base=28+ln
sizes={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4};types={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}
def arr(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];return np.ndarray((a['count'],sizes[a['type']]),dtype=types[a['componentType']],buffer=b,offset=base+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(types[a['componentType']]).itemsize*sizes[a['type']]),np.dtype(types[a['componentType']]).itemsize)).copy()
def mapped(p,wheel=False):
 q=p[:,[2,1,0]].copy();q[:,0]*=-1
 srcf,srcr=-1.60065,1.24003
 if wheel:
  ax=np.where(q[:,0]<(srcf+srcr)/2,srcf,srcr);dx=np.where(ax==srcf,-1.635,1.215);track=np.where(ax==srcf,.825,.8225)
  q[:,0]=dx+(q[:,0]-ax)*(.3965/.4078672)
  q[:,2]=np.sign(q[:,2])*(track+(np.abs(q[:,2])-.7944)*(.285/.346416));q[:,1]=.3965+(q[:,1]-.4078672)*(.3965/.4078672)
 else:
  old=[-2.54582715,srcf,srcr,2.39938188];new=[-2.585,-1.635,1.215,2.585];i=np.where(q[:,0]<srcf,0,np.where(q[:,0]<srcr,1,2));q[:,0]=np.array(new)[i]+(q[:,0]-np.array(old)[i])*(np.diff(new)/np.diff(old))[i];q[:,1]=.3965+(q[:,1]-.4078672)*(1.93-.3965)/(1.91471124-.4078672)
  q[:,0]=np.where(q[:,0]>1.215,1.215+(q[:,0]-1.215)*(.1200/.1370),q[:,0])
 return q

out=[]
mi=4;pr=j['meshes'][mi]['primitives'][0];p=arr(pr['attributes']['POSITION']);normal=arr(pr['attributes']['NORMAL']);idx=arr(pr['indices']).ravel().reshape(-1,3);q=mapped(p)
_,ix=np.unique(np.rint(p/.000005).astype(np.int64),axis=0,return_inverse=True);e=ix[idx];n=ix.max()+1
adj=coo_matrix((np.ones(len(idx)*6),(np.concatenate([e[:,0],e[:,1],e[:,2],e[:,1],e[:,2],e[:,0]]),np.concatenate([e[:,1],e[:,2],e[:,0],e[:,0],e[:,1],e[:,2]]))),shape=(n,n)).tocsr();_,labels=connected_components(adj,directed=False);fl=labels[e[:,0]]
for ci,side in [(46,'R'),(73,'L')]:
 faces=np.flatnonzero(fl==ci);verts,indices=np.unique(idx[faces],return_inverse=True)
 assert len(faces)==664
 # Original normal transformed by the inverse transpose of the documented import mapping.
 N=normal[verts][:,[2,1,0]].copy();N[:,0]*=-1
 N[:,0]/=((2.585-1.215)/(2.39938188-1.24003))*(1.2/1.37)
 N[:,1]/=(1.93-.3965)/(1.91471124-.4078672)
 N/=np.linalg.norm(N,axis=1)[:,None]
 out.append(dict(side=side,mesh=mi,component=ci,sourceFaces=faces.tolist(),positions=q[verts].tolist(),normals=N.tolist(),indices=indices.ravel().tolist()))
Path(sys.argv[2]).write_text(json.dumps(out))
