"""Blender 4.3+ CPU Cycles AO to POINT colour + welded-edge signed curvature.
Run: blender -b -t 4 --python bake_vertex.py -- /path/to/workdir
The output arrays preserve glTF source vertex ordering; the original GLBs are
augmented later, so no geometry, authored normals or node names are rewritten.
"""
import bpy,bmesh,sys,json,struct,time,math,argparse
import numpy as np
from pathlib import Path
from mathutils.kdtree import KDTree
parser=argparse.ArgumentParser();parser.add_argument('workdir',type=Path);parser.add_argument('--samples',type=int,default=32);parser.add_argument('--distance',type=float,default=.35)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);W=args.workdir.resolve()
if args.samples<1 or args.distance<=0:raise ValueError('Positive samples and AO distance required')
start=time.time();report={'blenderVersion':bpy.app.version_string,'engine':'Cycles CPU','samples':args.samples,'aoDistanceMetres':args.distance,'target':'VERTEX_COLORS / POINT FLOAT_COLOR','ao':'Cycles AO bake at the configured world.light_settings.distance, with source cabin and a floor as occluders; transparent glazing excluded from occlusion','curvature':'signed manifold edge dihedral angle after position welding; positive convex, negative concave; G=.5+.5*tanh(weightedAngle*2.5)','meshes':[]}
def log(*args): print(*args,flush=True)
def load_glb(p):
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);return j,b[28+n:]
def accessor(j,b,i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt={5120:np.int8,5121:np.uint8,5122:np.dtype('<i2'),5123:np.dtype('<u2'),5125:np.dtype('<u4'),5126:np.dtype('<f4')}[a['componentType']]
 arr=np.ndarray((a['count'],k),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(dt).itemsize*k),np.dtype(dt).itemsize)).copy()
 if a.get('normalized'):
  inf=np.iinfo(dt);arr=arr.astype(np.float32)/inf.max
  if inf.min<0:arr=np.maximum(arr,-1)
 return arr
bpy.ops.wm.read_factory_settings(use_empty=True)
source=[]
for label in ['vehicle','interior']:
 j,b=load_glb(W/(label+'.glb'));before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(W/(label+'.glb')),merge_vertices=False)
 imported=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
 for ni,node in enumerate(j['nodes']):
  if 'mesh' not in node:continue
  o=next(o for o in imported if o.name==node.get('name'))
  o.data=o.data.copy() # unique colours for shared hub instances
  primitive=j['meshes'][node['mesh']]['primitives'][0]
  original=accessor(j,b,primitive['attributes']['POSITION'])
  expected=original[:,[0,2,1]].copy();expected[:,1]*=-1
  coords=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',coords);coords=coords.reshape((-1,3))
  if len(coords)==len(expected) and float(np.max(np.abs(expected-coords)))<2e-6:
   mapping=np.arange(len(coords),dtype=np.int32);maxerr=float(np.max(np.abs(expected-coords)))
  else:
   tree=KDTree(len(coords))
   for vi,co in enumerate(coords):tree.insert(co,vi)
   tree.balance();mapped=[tree.find(co) for co in expected];mapping=np.array([x[1] for x in mapped],dtype=np.int32);maxerr=max(x[2] for x in mapped)
   if maxerr>2e-6:raise RuntimeError(f'Imported positions changed {o.name}, error {maxerr}')
  colors=o.data.color_attributes.new(name='BakedAOEdge',type='FLOAT_COLOR',domain='POINT')
  init=np.ones((len(coords),4),dtype=np.float32);init[:,1]=.5;colors.data.foreach_set('color',init.ravel());o.data.color_attributes.active_color=colors
  matname=j['materials'][primitive['material']].get('name','').lower()
  glazing=any(t in matname for t in ['glass','mirror'])
  if glazing:o.hide_render=True
  source.append({'object':o,'label':label,'nodeIndex':ni,'meshIndex':node['mesh'],'primitiveIndex':0,'coords':coords,'mapping':mapping,'originalCoords':expected,'originalOrderError':maxerr,'glazing':glazing})
log('SOURCE_ORDER_VALIDATED',len(source),'objects',sum(len(x['coords']) for x in source),'vertices')
# Add a neutral floor as a real occluder for low body/tyre ambient shading.
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,-.001));floor=bpy.context.object;floor.name='Bake-only ground occluder'
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples
scene.cycles.use_denoising=False;scene.cycles.seed=20261027
scene.world=bpy.data.worlds.new('Bake world');scene.world.light_settings.distance=args.distance
scene.render.bake.target='VERTEX_COLORS';scene.render.bake.use_clear=True
# One scene-wide AO bake keeps source parts as occluders of one another.
bpy.ops.object.select_all(action='DESELECT')
opaque=[s for s in source if not s['glazing']]
for s in opaque:s['object'].select_set(True)
bpy.context.view_layer.objects.active=opaque[0]['object']
log('CYCLES_AO_START',len(opaque),'objects')
aot=time.time();bpy.ops.object.bake(type='AO',target='VERTEX_COLORS',use_clear=True,use_selected_to_active=False)
report['aoSeconds']=time.time()-aot;log('CYCLES_AO_DONE',report['aoSeconds'])
# Curvature is baked from welded topology; split render normals do not break
# the edge graph. No topology or render normals are modified in the asset.
for idx,s in enumerate(source):
 o=s['object'];mesh=o.data;attr=mesh.color_attributes['BakedAOEdge'];n=len(mesh.vertices)
 data=np.empty(n*4,dtype=np.float32);attr.data.foreach_get('color',data);data=data.reshape((-1,4))
 ao=np.clip(data[:,:3].mean(axis=1),0,1) if not s['glazing'] else np.ones(n,dtype=np.float32)
 curv=np.zeros(n,dtype=np.float32)
 if not s['glazing']:
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5);bm.verts.ensure_lookup_table();bm.verts.index_update();bm.normal_update()
  vals=np.zeros(len(bm.verts),dtype=np.float64);weights=np.zeros(len(bm.verts),dtype=np.float64)
  for edge in bm.edges:
   if not edge.is_manifold:continue
   length=edge.calc_length()
   if length<1e-8:continue
   ang=edge.calc_face_angle_signed(0)
   # Every manifold edge participates, so triangulation does not amplify ridges.
   for v in edge.verts:vals[v.index]+=ang*length;weights[v.index]+=length
  vals=np.tanh(np.divide(vals,weights,out=np.zeros_like(vals),where=weights>0)*2.5)
  tree=KDTree(len(bm.verts))
  for v in bm.verts:tree.insert(v.co,v.index)
  tree.balance()
  for vi,co in enumerate(s['coords']):curv[vi]=vals[tree.find(co)[1]]
  bm.free()
 packed=np.empty((n,4),dtype=np.float32);packed[:,0]=ao;packed[:,1]=.5+.5*curv;packed[:,2]=0;packed[:,3]=1
 attr.data.foreach_set('color',packed.ravel())
 out=W/f"{s['label']}-node-{s['nodeIndex']:02d}.npy";np.save(out,packed[s['mapping']])
 stats={'label':s['label'],'object':o.name,'nodeIndex':s['nodeIndex'],'meshIndex':s['meshIndex'],'vertices':len(s['mapping']),'blenderVertices':n,'glazingNeutral':s['glazing'],'originalOrderMaxError':s['originalOrderError'],'aoQuantiles':np.quantile(ao,[0,.05,.25,.5,.75,.95,1]).tolist(),'curvatureQuantiles':np.quantile(curv,[0,.05,.25,.5,.75,.95,1]).tolist(),'array':out.name}
 report['meshes'].append(stats);log('ATTR',idx+1,'/',len(source),o.name,'AO',round(float(ao.mean()),3),'EDGE',round(float(curv.min()),3),round(float(curv.max()),3))
report['totalSeconds']=time.time()-start
(W/'bake-report.json').write_text(json.dumps(report,indent=2)+'\n')
# Keep an inspectable Blender file of the actual baked colour attribute.
floor.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(W/'baked-vertex.blend'))
log('BAKE_FINISHED',report['totalSeconds'])
