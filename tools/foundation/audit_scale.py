#!/usr/bin/env python3
"""Read-only geometry measurements from stored, uncompressed GLBs.

Usage: python tools/foundation/audit_scale.py --source /tmp/source --output docs/foundation/scale-audit.json
Source is the directory produced by extraction; no model data is modified.
"""
from pathlib import Path
import argparse,json,struct,hashlib,datetime
import numpy as np
DT={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}

def read_glb(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0]
 return json.loads(b[20:20+n]),b[28+n:],hashlib.sha256(b).hexdigest()

def array(j,b,ai):
 a=j['accessors'][ai];v=j['bufferViews'][a['bufferView']];dt=np.dtype(DT[a['componentType']]);nc=NC[a['type']]
 offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dt.itemsize*nc)
 x=np.ndarray((a['count'],nc),dtype=dt,buffer=b,offset=offset,strides=(stride,dt.itemsize)).astype(np.float64)
 if a.get('normalized') and a['componentType']!=5126:
  info=np.iinfo(dt);x=np.maximum(-1,x/info.max) if info.min<0 else x/info.max
 return x

def local(n):
 if 'matrix' in n:return np.array(n['matrix'],dtype=np.float64).reshape((4,4)).T
 x,y,z,w=n.get('rotation',[0,0,0,1]);r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
 m=np.eye(4);m[:3,:3]=r@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0]);return m

def measure(path):
 j,b,sha=read_glb(path);rows=[]
 def visit(ni,parent):
  node=j['nodes'][ni];world=parent@local(node)
  if 'mesh' in node:
   for pi,p in enumerate(j['meshes'][node['mesh']]['primitives']):
    pos=array(j,b,p['attributes']['POSITION']);points=pos@world[:3,:3].T+world[:3,3]
    index=array(j,b,p['indices']).astype(np.int64).reshape(-1) if 'indices'in p else np.arange(len(pos))
    used=points[np.unique(index)]
    rows.append({'node':ni,'primitive':pi,'name':node.get('name',''),'world':world,'points':points,'used':used,'triangles':len(index)//3,'color':p['attributes'].get('COLOR_0')})
  for child in node.get('children',[]):visit(child,world)
 for ni in j['scenes'][j.get('scene',0)]['nodes']:visit(ni,np.eye(4))
 points=np.concatenate([r['points'] for r in rows]);mn=points.min(0);mx=points.max(0)
 return {'path':str(path),'sha256':sha,'bytes':path.stat().st_size,'bounds':{'min':mn.tolist(),'max':mx.tolist(),'sizeXYZ':(mx-mn).tolist()},'verticesIncludingInstances':len(points),'triangles':sum(r['triangles']for r in rows),'primitives':len(rows),'allHaveCOLOR0':all(r['color'] is not None for r in rows)},rows

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
 p.add_argument('--segmentation',type=Path);p.add_argument('--compression',type=Path);a=p.parse_args()
 assets=[];allrows=[]
 for name in ['vehicle','interior','garnish']:
  path=a.source/(name+'.glb')
  if not path.exists():raise FileNotFoundError(path)
  info,rows=measure(path);assets.append(info);allrows+=rows
 points=np.concatenate([r['points']for r in allrows]);mn=points.min(0);mx=points.max(0);size=mx-mn
 # The four explicit blank hubs give authored x/y locations. Their outer cap
 # z is not the axle centre; track pivots are reported separately as authored.
 caps=[r for r in allrows if r['name'].startswith('Blank hub cap')]
 capcentres=[r['world'][:3,3].tolist()for r in caps]
 frontx=float(np.mean([v[0]for v in capcentres if v[0]<0]));rearx=float(np.mean([v[0]for v in capcentres if v[0]>0]));huby=float(np.mean([v[1]for v in capcentres]))
 tyres=[]
 for r in allrows:
  if not r['name'].startswith('tire_'):continue
  for axle,cut in [('front',lambda p:p[:,0]<-.210),('rear',lambda p:p[:,0]>=-.210)]:
   q=r['points'][cut(r['points'])];lo=q.min(0);hi=q.max(0)
   tyres.append({'name':r['name'],'axle':axle,'side':'+z'if q[:,2].mean()>0 else'-z','bboxCentre':((lo+hi)/2).tolist(),'diameterX':float(hi[0]-lo[0]),'diameterY':float(hi[1]-lo[1]),'widthZ':float(hi[2]-lo[2])})
 report={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Decode stored accessor arrays and original glTF node transforms in float64; no runtime deformation, added vertex offset, global resize or mutation. x length,y up,z width.','physicalRootScale':[1,1,1],'boundsMetres':{'min':mn.tolist(),'max':mx.tolist(),'lengthX':float(size[0]),'heightY':float(size[1]),'widthIncludingMirrorsZ':float(size[2])},'authoredWheelPivotsMetres':{'wheel_FL':[-1.635,.3965,.825],'wheel_FR':[-1.635,.3965,-.825],'wheel_RL':[1.215,.3965,.8225],'wheel_RR':[1.215,.3965,-.8225]},'wheelCentreEvidence':'x/y measured from explicit blank hub-cap source node translations; z pivot is authored track centre (cap surfaces sit further out). L/R uses +z/−z.','measuredHubCapCentresMetres':capcentres,'measuredFrontAxleX':frontx,'measuredRearAxleX':rearx,'measuredHubY':huby,'measuredWheelbaseMetres':rearx-frontx,'authoredWheelbaseMetres':2.85,'nominalTyreDiameterMetres':.793,'measuredTyres':tyres,'overhangsMetres':{'frontMeasured':frontx-float(mn[0]),'rearMeasured':float(mx[0])-rearx,'frontAuthored':.950,'rearAuthored':1.370,'rearIf5095WithSameWheelbaseAndFront':1.295,'difference':.075},'storedToStoredVertexDeviationMm':0.0,'deliveredVertexDeviationMm':None,'deliveryAuditNote':'Filled only after the final external assets are compared with these immutable source accessors. Source encoding quantisation transforms are retained; they are not artistic object resizing.','assets':assets}
 if a.segmentation or a.compression:
  if not(a.segmentation and a.compression):raise ValueError('Both segmentation and compression proof reports are required')
  seg=json.loads(a.segmentation.read_text());comp=json.loads(a.compression.read_text())
  assert seg['triangleCoverageExactlyOnce'] and seg['sourceTriangles']==seg['outputTriangles']==sum(x['triangles']for x in assets)
  assert all(p['accessorCodesByteExact'] and p['worldMaxDeviationMetres']==0 for e in seg['proof']for p in e['primitives'])
  assert comp['allAttributesByteExact'] and comp['allTriangleTopologyExact'] and comp['allStoredNodeTransformsExact']
  assert len(comp['models'])==seg['deliveredParts']+1 and all(x['pinnedThree166Decoder']for x in comp['models'])
  report['deliveredVertexDeviationMm']=seg['maxVertexDeviationMm']
  report['deliveryAuditNote']='Original source codes, selected world positions and triangle coverage verified by segmentation; lossless compressed roundtrip verified with the pinned Three.js0.166.1 Meshopt decoder. Source quantisation transforms retained; physical car root scale1.0.'
  report['deliveryProof']={'segmentationSha256':hashlib.sha256(a.segmentation.read_bytes()).hexdigest(),'compressionSha256':hashlib.sha256(a.compression.read_bytes()).hexdigest(),'vehicleParts':seg['deliveredParts'],'compressedGLBsIncludingDisplayBase':len(comp['models']),'pinnedDecoderSha256':comp['pinnedDecoderSha256']}
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'bounds':report['boundsMetres'],'wheelbase':report['measuredWheelbaseMetres'],'hubY':huby,'tyreDiametersY':[r['diameterY']for r in tyres],'storedDeviationMm':0.0,'deliveryDeviationMm':report['deliveredVertexDeviationMm']},indent=2))
if __name__=='__main__':main()
