#!/usr/bin/env python3
"""Verify original quantised geometry bytes and complete baked-colour coverage."""
from pathlib import Path
import argparse,struct,json
p=argparse.ArgumentParser();p.add_argument('workdir',type=Path);a=p.parse_args()
def read(p):
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0]
 assert struct.unpack_from('<I',b,8)[0]==len(b),'Invalid GLB length'
 return json.loads(b[20:20+n]),b[28+n:]
for label in ['vehicle','interior']:
 old,oldbin=read(a.workdir/(label+'.glb'));new,newbin=read(a.workdir/(label+'-baked.glb'))
 assert newbin[:len(oldbin)]==oldbin,'Original binary geometry changed'
 assert old['nodes']==new['nodes'],'Node names/transforms changed'
 assert old['accessors']==new['accessors'][:len(old['accessors'])],'Original accessors changed'
 assert old['bufferViews']==new['bufferViews'][:len(old['bufferViews'])],'Original views changed'
 assert len(old['meshes'])==len(new['meshes']),'Mesh count changed'
 count=0
 for m0,m1 in zip(old['meshes'],new['meshes']):
  assert m0.get('name')==m1.get('name') and len(m0['primitives'])==len(m1['primitives'])
  for p0,p1 in zip(m0['primitives'],m1['primitives']):
   assert {k:v for k,v in p1.items() if k!='attributes'}=={k:v for k,v in p0.items() if k!='attributes'}
   assert {k:v for k,v in p1['attributes'].items() if k!='COLOR_0'}=={k:v for k,v in p0['attributes'].items() if k!='COLOR_0'}
   color=new['accessors'][p1['attributes']['COLOR_0']];position=new['accessors'][p1['attributes']['POSITION']]
   assert color['count']==position['count'] and color['normalized'] and color['componentType']==5121 and color['type']=='VEC3'
   view=new['bufferViews'][color['bufferView']];assert view['byteStride']==4
   start=view.get('byteOffset',0)+color.get('byteOffset',0)
   assert all(newbin[start+i*4+2]==255 for i in range(color['count'])),'B channel not neutral1'
   count+=1
 print(label,'PASS: original geometry/normals/nodes unchanged;',count,'primitives with normalized linear U8 AO/curvature')
