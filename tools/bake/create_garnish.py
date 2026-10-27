"""Create and bake a rear garnish backfill against fitted LC200 body occluders.
Usage: blender -b -t 4 --python create_bake.py -- /tmp/lc200-garnish --occluder /tmp/vehicle.glb
Coordinates exported as glTF x=length,y=up,z=width; centre rear x=2.430m.
"""
import bpy,bmesh,sys,argparse,json,struct,math,time,gzip,base64,hashlib
import numpy as np
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output',type=Path);p.add_argument('--occluder',type=Path,required=True);p.add_argument('--samples',type=int,default=32);p.add_argument('--distance',type=float,default=.35)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);W=a.output.resolve();W.mkdir(parents=True,exist_ok=True)
start=time.time();bpy.ops.wm.read_factory_settings(use_empty=True)
srgb=lambda x:x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
rgb=lambda h:tuple(srgb(int(h[i:i+2],16)/255) for i in [0,2,4])
# Source body is used only for AO occlusion, never exported or modified in app.
bpy.ops.import_scene.gltf(filepath=str(a.occluder),merge_vertices=False)
occluders=[o for o in bpy.data.objects if o.type=='MESH']
for ob in occluders:
 ob.data=ob.data.copy()
 coords=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',coords);coords=coords.reshape((-1,3))
 matrix=np.array(ob.matrix_world,dtype=np.float64);world=coords@matrix[:3,:3].T+matrix[:3,3]
 world[:,0]=np.where(world[:,0]>1.215,1.2525+(world[:,0]-1.215)*((2.5475-1.2525)/(2.585-1.215)),world[:,0]+.0375)
 world[:,2]=.4014+(world[:,2]-.3965)*((1.93-.4014)/(1.93-.3965))
 fitted=(world-matrix[:3,3])@np.linalg.inv(matrix[:3,:3]).T;ob.data.vertices.foreach_set('co',fitted.astype(np.float32).ravel());ob.data.update()
 if 'glass' in ob.name.lower() or 'mirror' in ob.name.lower():ob.hide_render=True
# Cross-section is closed, with a crowned front and 3mm top/bottom bevels.
ys=[1.020,1.023,1.035,1.050,1.065,1.080,1.095,1.107,1.110]
section=[(y,-.003 if y in (ys[0],ys[-1]) else 0) for y in ys]+[(y,-.018) for y in reversed(ys)]
zvalues=sorted(set([-.53+i*1.06/34 for i in range(35)]+[-.527,.527]))
verts=[];faces=[];nc=len(section)
for z in zvalues:
 for y,depth in section:
  t=max(0,min(1,(abs(z)-.48)/.05));t=t*t*(3-2*t)
  taperedY=y+t*(.009-.017*(y-1.020)/.090)
  # Tighten the last 50mm vertically; soften the front edge over the final 3mm.
  bevel=max(0,min(1,(abs(z)-.527)/.003))
  front=2.430-.011*((taperedY-1.065)/.045)**2-.018*(z/.53)**2
  frontBevel=.003*bevel if depth>-.017 else 0
  # glTF x,y,z -> Blender x,-z,y
  verts.append((front+depth-frontBevel,-z,taperedY))
for k in range(len(zvalues)-1):
 for i in range(nc):faces.append((k*nc+i,k*nc+(i+1)%nc,(k+1)*nc+(i+1)%nc,(k+1)*nc+i))
faces.append(tuple(reversed(range(nc))));faces.append(tuple((len(zvalues)-1)*nc+i for i in range(nc)))
me=bpy.data.meshes.new('Garnish');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('Garnish',me);bpy.context.collection.objects.link(ob)
for poly in me.polygons:poly.use_smooth=poly.index<(len(zvalues)-1)*nc
mat=bpy.data.materials.new('Garnish');mat.use_nodes=True;pr=mat.node_tree.nodes.get('Principled BSDF');pr.inputs['Base Color'].default_value=(*rgb('aab3bb'),1);pr.inputs['Roughness'].default_value=.30;pr.inputs['Metallic'].default_value=.75;me.materials.append(mat)
attr=me.color_attributes.new(name='BakedAOEdge',type='FLOAT_COLOR',domain='POINT');me.color_attributes.active_color=attr
objects=[ob]
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,-.0001));floor=bpy.context.object;floor.name='Bake-only floor'
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples;s.cycles.seed=20261027;s.cycles.use_denoising=False;s.world=bpy.data.worlds.new('Bake world');s.world.light_settings.distance=a.distance;s.render.bake.target='VERTEX_COLORS'
bpy.ops.object.select_all(action='DESELECT')
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
aot=time.time();bpy.ops.object.bake(type='AO',target='VERTEX_COLORS',use_clear=True,use_selected_to_active=False);aoSeconds=time.time()-aot
report={'blenderVersion':bpy.app.version_string,'engine':'Cycles CPU','samples':a.samples,'aoDistanceMetres':a.distance,'aoBakeSeconds':aoSeconds,'groundY':-.0001,'garnishCentre':[2.430,1.065,0],'width':1.06,'endTaperMetres':.05,'endYRange':[1.029,1.102],'occluder':'Source LC200 GLB, GXR fitted for AO only; transparent glazing excluded','materials':['Garnish'],'objects':[],'encoding':'COLOR_0 normalized U8 VEC3 four-byte stride, linear R=Cycles AO, G=.5+.5signedcurvature, B=1'}
# Pack standard glTF directly from the baked data so there is no sRGB conversion
# of AO/curvature by a display-oriented colour exporter.
bin=bytearray();g={'asset':{'version':'2.0','generator':'Blender '+bpy.app.version_string+' Cycles vertex AO + signed edge bake'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
def put(data,component,count,kind,target,minv=None,maxv=None,normalized=False,stride=None):
 global bin
 bin+=b'\x00'*((-len(bin))%4);off=len(bin);bin+=data;view={'buffer':0,'byteOffset':off,'byteLength':len(data),'target':target}
 if stride:view['byteStride']=stride
 vi=len(g['bufferViews']);g['bufferViews'].append(view);ac={'bufferView':vi,'componentType':component,'count':count,'type':kind}
 if normalized:ac['normalized']=True
 if minv is not None:ac['min']=minv
 if maxv is not None:ac['max']=maxv
 ai=len(g['accessors']);g['accessors'].append(ac);return ai
for oi,ob in enumerate(objects):
 me=ob.data;n=len(me.vertices);data=np.empty(n*4,dtype=np.float32);me.color_attributes['BakedAOEdge'].data.foreach_get('color',data);ao=np.clip(data.reshape((-1,4))[:,:3].mean(axis=1),0,1)
 bm=bmesh.new();bm.from_mesh(me);bm.verts.ensure_lookup_table();bm.verts.index_update();bm.normal_update();vals=np.zeros(n);weights=np.zeros(n)
 for edge in bm.edges:
  if not edge.is_manifold:continue
  angle=edge.calc_face_angle_signed(0);length=edge.calc_length()
  for v in edge.verts:vals[v.index]+=angle*length;weights[v.index]+=length
 vals=np.tanh(np.divide(vals,weights,out=np.zeros_like(vals),where=weights>0)*2.5);bm.free()
 colors=np.ones((n,4),dtype=np.float32);colors[:,0]=ao;colors[:,1]=.5+.5*vals;me.color_attributes['BakedAOEdge'].data.foreach_set('color',colors.ravel());q=np.rint(colors*255).astype(np.uint8)
 me.calc_loop_triangles();verts=[];normals=[];cs=[];indices=[];lookup={}
 for tri in me.loop_triangles:
  for li in tri.loops:
   vi=me.loops[li].vertex_index;pos=me.vertices[vi].co;normal=me.corner_normals[li].vector
   pp=(pos.x,pos.z,-pos.y);nn=(normal.x,normal.z,-normal.y);key=tuple(round(x,7) for x in (*pp,*nn))+tuple(int(x) for x in q[vi,:3])
   if key not in lookup:lookup[key]=len(verts);verts.append(pp);normals.append(nn);cs.append(q[vi])
   indices.append(lookup[key])
 vp=np.asarray(verts,dtype='<f4');vn=np.asarray(normals,dtype='<f4');vc=np.asarray(cs,dtype=np.uint8);ind=np.asarray(indices,dtype='<u2')
 pa=put(vp.tobytes(),5126,len(vp),'VEC3',34962,vp.min(axis=0).tolist(),vp.max(axis=0).tolist());na=put(vn.tobytes(),5126,len(vn),'VEC3',34962);ca=put(vc.tobytes(),5121,len(vc),'VEC3',34962,normalized=True,stride=4);ia=put(ind.tobytes(),5123,len(ind),'SCALAR',34963)
 mat=me.materials[0];pr=mat.node_tree.nodes.get('Principled BSDF');g['materials'].append({'name':ob.name,'pbrMetallicRoughness':{'baseColorFactor':list(pr.inputs['Base Color'].default_value),'metallicFactor':pr.inputs['Metallic'].default_value,'roughnessFactor':pr.inputs['Roughness'].default_value},'doubleSided':False})
 g['meshes'].append({'name':ob.name,'primitives':[{'attributes':{'POSITION':pa,'NORMAL':na,'COLOR_0':ca},'indices':ia,'material':oi}]});g['nodes'].append({'name':ob.name,'mesh':oi});g['scenes'][0]['nodes'].append(oi)
 report['objects'].append({'name':ob.name,'sourceVertices':n,'exportedVertices':len(vp),'triangles':len(indices)//3,'bounds':{'min':vp.min(axis=0).tolist(),'max':vp.max(axis=0).tolist()},'aoQuantiles':np.quantile(ao,[0,.05,.5,.95,1]).tolist(),'frontAOQuantiles':np.quantile(ao[np.array([i%nc<len(ys) for i in range(n)])],[0,.05,.5,.95,1]).tolist(),'curvatureQuantiles':np.quantile(vals,[0,.05,.5,.95,1]).tolist()})
g['buffers'][0]['byteLength']=len(bin);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);bin+=b'\x00'*((-len(bin))%4);glb=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(bin))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(bin),0x004e4942)+bin
(W/'garnish.glb').write_bytes(glb);gz=gzip.compress(glb,compresslevel=9,mtime=0);(W/'garnish.glb.gz').write_bytes(gz);enc=base64.b64encode(gz);(W/'garnish.base64').write_bytes(enc)
report.update({'triangles':sum(o['triangles'] for o in report['objects']),'glbBytes':len(glb),'gzipBytes':len(gz),'base64Bytes':len(enc),'sha256':hashlib.sha256(glb).hexdigest(),'totalSeconds':time.time()-start});(W/'report.json').write_text(json.dumps(report,indent=2)+'\n')
floor.hide_render=True;bpy.ops.wm.save_as_mainfile(filepath=str(W/'garnish-baked.blend'));print('GARNISH_REPORT',json.dumps(report),flush=True)
