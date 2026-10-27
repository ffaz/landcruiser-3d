"""Small binary glTF reader/writer; preserve stored accessor codes and transforms."""
from pathlib import Path
import json,struct,copy
import numpy as np
DT={5120:np.dtype('i1'),5121:np.dtype('u1'),5122:np.dtype('<i2'),5123:np.dtype('<u2'),5125:np.dtype('<u4'),5126:np.dtype('<f4')}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def read_glb(path):
 b=Path(path).read_bytes();n=struct.unpack_from('<I',b,12)[0]
 return json.loads(b[20:20+n]),b[28+n:]
def write_glb(path,j,b):
 j=copy.deepcopy(j);j['buffers']=[{'byteLength':len(b)}];js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4);b=bytes(b)+b'\0'*((-len(b))%4)
 Path(path).parent.mkdir(parents=True,exist_ok=True)
 Path(path).write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b)
def accessor(j,b,ai,normalized=False):
 a=j['accessors'][ai];v=j['bufferViews'][a['bufferView']];dt=DT[a['componentType']];n=NC[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dt.itemsize*n)
 q=np.ndarray((a['count'],n),dtype=dt,buffer=b,offset=off,strides=(stride,dt.itemsize)).copy()
 if normalized and a.get('normalized'):
  q=q.astype(np.float64);bits=dt.itemsize*8
  q=np.maximum(-1,q/(2**(bits-1)-1)) if dt.kind=='i' else q/(2**bits-1)
 return q
def matrix(n):
 if 'matrix' in n:return np.array(n['matrix'],dtype=np.float64).reshape(4,4).T
 t=np.array(n.get('translation',[0,0,0]));s=np.array(n.get('scale',[1,1,1]));x,y,z,w=n.get('rotation',[0,0,0,1])
 r=np.array([[1-2*y*y-2*z*z,2*x*y-2*z*w,2*x*z+2*y*w],[2*x*y+2*z*w,1-2*x*x-2*z*z,2*y*z-2*x*w],[2*x*z-2*y*w,2*y*z+2*x*w,1-2*x*x-2*y*y]])
 m=np.eye(4);m[:3,:3]=r@np.diag(s);m[:3,3]=t;return m
def node_worlds(j):
 parent={c:i for i,n in enumerate(j['nodes']) for c in n.get('children',[])};cache={}
 def one(i):
  if i not in cache:cache[i]=(one(parent[i]) if i in parent else np.eye(4))@matrix(j['nodes'][i])
  return cache[i]
 return [one(i) for i in range(len(j['nodes']))]
def world_positions(j,b,node_index,p):
 q=accessor(j,b,p['attributes']['POSITION'],True).astype(np.float64);m=node_worlds(j)[node_index]
 return q@m[:3,:3].T+m[:3,3]
