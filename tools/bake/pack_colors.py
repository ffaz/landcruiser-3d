"""Augment the original, already quantised GLBs with linear U8 COLOR_0.
No POSITION, NORMAL, index buffer, transform, name or material is rewritten.
Only the colour attribute is new; original 16-bit position and 12-bit normal
quantisation remain intact. VEC3 colours use a four-byte-aligned vertex stride.
"""
from pathlib import Path
import json,struct,gzip,base64,sys,hashlib
import numpy as np
W=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent
bake=json.loads((W/'bake-report.json').read_text());report={'encoding':'COLOR_0, normalized UNSIGNED_BYTE VEC3, 4-byte stride, LINEAR data; R=AO, G=.5+.5*signed curvature, B=1','geometryPreserved':True,'assets':{}}
def unpack(p):
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];return b,json.loads(b[20:20+n]),bytearray(b[28+n:])
def glb(j,bin):
 j['buffers'][0]['byteLength']=len(bin);js=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4);bin+=b'\x00'*((-len(bin))%4)
 return struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(bin))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(bin),0x004e4942)+bin
for label in ['vehicle','interior']:
 before,j,b=unpack(W/(label+'.glb'));originalBin=bytes(b);newAttributeBytes=0;meshStats=[]
 for mi,mesh in enumerate(j['meshes']):
  records=[r for r in bake['meshes'] if r['label']==label and r['meshIndex']==mi]
  if not records:raise RuntimeError(f'Missing baked mesh {label} {mi}')
  for pi,p in enumerate(mesh['primitives']):
   count=j['accessors'][p['attributes']['POSITION']]['count']
   if pi==0:
    arrays=[np.load(W/r['array']) for r in records]
    a=np.mean(arrays,axis=0) # shared hub instances differ only in occlusion
   else:
    material=j['materials'][p['material']].get('name','').lower()
    if not any(t in material for t in ['glass','mirror']):raise RuntimeError(f'Unbaked opaque primitive {label}/{mi}/{pi}')
    a=np.ones((count,4),dtype=np.float32);a[:,1]=.5
   a[:,2:]=1
   q=np.rint(np.clip(a,0,1)*255).astype(np.uint8)
   assert len(q)==count
   b+=b'\x00'*((-len(b))%4);offset=len(b);data=q.tobytes();b+=data;newAttributeBytes+=len(data)
   view=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data),'byteStride':4,'target':34962})
   ai=len(j['accessors']);j['accessors'].append({'bufferView':view,'byteOffset':0,'componentType':5121,'normalized':True,'count':len(q),'type':'VEC3'})
   p['attributes']['COLOR_0']=ai
   meshStats.append({'name':mesh.get('name'),'primitive':pi,'vertices':len(q),'aoMean':float(a[:,0].mean()),'aoMin':float(a[:,0].min()),'aoMax':float(a[:,0].max()),'ridgePercent':float(np.mean(a[:,1]>.55)*100),'valleyPercent':float(np.mean(a[:,1]<.45)*100)})
 assert b[:len(originalBin)]==originalBin
 after=glb(j,b);out=W/(label+'-baked.glb');out.write_bytes(after)
 beforeGzip=gzip.compress(before,compresslevel=9,mtime=0);afterGzip=gzip.compress(after,compresslevel=9,mtime=0)
 (W/(label+'-baked.glb.gz')).write_bytes(afterGzip);(W/(label+'-baked.base64')).write_text(base64.b64encode(afterGzip).decode())
 report['assets'][label]={'originalGlbBytes':len(before),'bakedGlbBytes':len(after),'attributeBytes':newAttributeBytes,'originalGzipBytes':len(beforeGzip),'bakedGzipBytes':len(afterGzip),'gzipAddedBytes':len(afterGzip)-len(beforeGzip),'originalBase64Bytes':len(base64.b64encode(beforeGzip)),'bakedBase64Bytes':len(base64.b64encode(afterGzip)),'base64AddedBytes':len(base64.b64encode(afterGzip))-len(base64.b64encode(beforeGzip)),'bakedSha256':hashlib.sha256(after).hexdigest(),'meshes':meshStats}
report['combinedBase64AddedBytes']=sum(a['base64AddedBytes'] for a in report['assets'].values())
(W/'packing-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='assets'},indent=2));print(json.dumps({k:{q:a[q] for q in ['originalGlbBytes','bakedGlbBytes','attributeBytes','gzipAddedBytes','base64AddedBytes']} for k,a in report['assets'].items()},indent=2))
