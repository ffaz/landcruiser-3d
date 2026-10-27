"""Create and bake an unbranded two-tone collectible base in Blender 4.3+.
Usage: blender -b -t 4 --python create_bake.py -- /tmp/lc200-plinth
Coordinates exported as glTF x=length,y=up,z=width; decktop y=-.002m.
"""
import bpy,bmesh,sys,argparse,json,struct,math,time,gzip,base64,hashlib
import numpy as np
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output',type=Path);p.add_argument('--samples',type=int,default=32);p.add_argument('--distance',type=float,default=.35)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);W=a.output.resolve();W.mkdir(parents=True,exist_ok=True)
start=time.time();bpy.ops.wm.read_factory_settings(use_empty=True)
def rounded_loop(length,width,radius,z,segments=8):
 pts=[]
 for cx,cy,base in [(length/2-radius,width/2-radius,0),(-length/2+radius,width/2-radius,math.pi/2),(-length/2+radius,-width/2+radius,math.pi),(length/2-radius,-width/2+radius,math.pi*1.5)]:
  for i in range(segments+1):
   angle=base+i*math.pi/(2*segments);pts.append((cx+radius*math.cos(angle),cy+radius*math.sin(angle),z))
 return pts
def create(name,length,width,radius,rings,color,roughness,metallic):
 vertices=[];faces=[]
 for inset,z in rings:vertices+=rounded_loop(length-2*inset,width-2*inset,max(.01,radius-inset),z)
 n=len(vertices)//len(rings)
 for k in range(len(rings)-1):
  for i in range(n):faces.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i))
 bot=len(vertices);vertices.append((0,0,rings[0][1]));top=len(vertices);vertices.append((0,0,rings[-1][1]))
 for i in range(n):faces.append((bot,(i+1)%n,i));faces.append((top,(len(rings)-1)*n+i,(len(rings)-1)*n+(i+1)%n))
 me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
 for poly in me.polygons:poly.use_smooth=poly.index<(len(rings)-1)*n
 mat=bpy.data.materials.new(name);mat.diffuse_color=(*color,1);mat.use_nodes=True;principled=mat.node_tree.nodes.get('Principled BSDF');principled.inputs['Base Color'].default_value=(*color,1);principled.inputs['Roughness'].default_value=roughness;principled.inputs['Metallic'].default_value=metallic;me.materials.append(mat)
 attr=me.color_attributes.new(name='BakedAOEdge',type='FLOAT_COLOR',domain='POINT');me.color_attributes.active_color=attr
 return ob
srgb=lambda x:x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
rgb=lambda h:tuple(srgb(int(h[i:i+2],16)/255) for i in [0,2,4])
objects=[create('BaseTop',6.0,3.1,.12,[(.010,-.057),(0,-.047),(0,-.010),(.008,-.002)],rgb('ded9d0'),.48,.03),create('BaseEdge',6.06,3.16,.14,[(.016,-.220),(0,-.204),(0,-.073),(.016,-.057)],rgb('353b40'),.46,.18)]
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,-.2201));floor=bpy.context.object;floor.name='Bake-only floor'
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples;s.cycles.seed=20261027;s.cycles.use_denoising=False;s.world=bpy.data.worlds.new('Bake world');s.world.light_settings.distance=a.distance;s.render.bake.target='VERTEX_COLORS'
bpy.ops.object.select_all(action='DESELECT')
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
aot=time.time();bpy.ops.object.bake(type='AO',target='VERTEX_COLORS',use_clear=True,use_selected_to_active=False);aoSeconds=time.time()-aot
report={'blenderVersion':bpy.app.version_string,'engine':'Cycles CPU','samples':a.samples,'aoDistanceMetres':a.distance,'aoBakeSeconds':aoSeconds,'groundY':-.2201,'deckTopY':-.002,'bottomY':-.220,'materials':['BaseTop','BaseEdge'],'objects':[],'encoding':'COLOR_0 normalized U8 VEC3 four-byte stride, linear R=Cycles AO, G=.5+.5signedcurvature, B=1'}
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
 report['objects'].append({'name':ob.name,'sourceVertices':n,'exportedVertices':len(vp),'triangles':len(indices)//3,'bounds':{'min':vp.min(axis=0).tolist(),'max':vp.max(axis=0).tolist()},'aoQuantiles':np.quantile(ao,[0,.05,.5,.95,1]).tolist(),'curvatureQuantiles':np.quantile(vals,[0,.05,.5,.95,1]).tolist()})
g['buffers'][0]['byteLength']=len(bin);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);bin+=b'\x00'*((-len(bin))%4);glb=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(bin))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(bin),0x004e4942)+bin
(W/'plinth.glb').write_bytes(glb);gz=gzip.compress(glb,compresslevel=9,mtime=0);(W/'plinth.glb.gz').write_bytes(gz);enc=base64.b64encode(gz);(W/'plinth.base64').write_bytes(enc)
report.update({'triangles':sum(o['triangles'] for o in report['objects']),'glbBytes':len(glb),'gzipBytes':len(gz),'base64Bytes':len(enc),'sha256':hashlib.sha256(glb).hexdigest(),'totalSeconds':time.time()-start});(W/'report.json').write_text(json.dumps(report,indent=2)+'\n')
floor.hide_render=True;bpy.ops.wm.save_as_mainfile(filepath=str(W/'plinth-baked.blend'));print('PLINTH_REPORT',json.dumps(report),flush=True)
