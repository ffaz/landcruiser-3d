"""Three reference-inspired 17-inch rims. New geometry only; no tyre mesh is read."""
import bpy, math, sys, json, bmesh
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];work=Path(args[0]);style=args[1];work.mkdir(parents=True,exist_ok=True)
assert style in ['disc','steel','window']
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for z in ['rim','chrome','black']:
 m=bpy.data.materials.new(z);m.diffuse_color=(.15,.15,.15,1);materials[z]=m
objects=[]
def mesh(name,vs,fs,zone='rim'):
 m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(materials[zone]);objects.append(o)
 for p in m.polygons:p.use_smooth=True
 return o
def lathe(name,profile,zone='rim',n=64,closed=False):
 k=len(profile);vs=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for i in range(n) for r,z in profile];fs=[]
 for i in range(n):
  for j in range(k if closed else k-1):fs.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+(j+1)%k,i*k+(j+1)%k))
 return mesh(name,vs,[tuple(reversed(f)) for f in fs] if closed else fs,zone)
def cyl(name,r,d,z,zone='rim',n=24,x=0,y=0):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=d,location=(x,y,z));o=bpy.context.object;o.name=name;o.data.materials.append(materials[zone]);objects.append(o)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
def cut(target,cutter):
 bpy.context.view_layer.objects.active=target;mod=target.modifiers.new('True opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
def bevel(obj,width=.0012):
 bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=width;mod.segments=1;mod.affect='EDGES';bpy.ops.object.modifier_apply(modifier=mod.name)
def polygon_cut(target,poly,a):
 vs=[]
 for z in [-.02,.20]:
  for r,t in poly:vs.append((r*math.cos(a)-t*math.sin(a),r*math.sin(a)+t*math.cos(a),z))
 k=len(poly);fs=[tuple(range(k-1,-1,-1)),tuple(range(k,2*k))]
 for j in range(k):fs.append((j,(j+1)%k,(j+1)%k+k,j+k))
 cut(target,mesh('Window cutter',vs,fs))
# Same 431.8 mm bead seat as the existing tyres; the rolled flange extends beyond it.
barrel=[(.2159,-.103),(.226,-.108),(.231,-.104),(.231,-.098),(.222,-.094),(.214,-.090),(.207,-.068),(.205,.065),(.212,.093),(.222,.105),(.231,.110),(.231,.116),(.227,.120),(.219,.117),(.2159,.109)]
lathe('Rolled lip and hollow barrel',barrel)
if style=='disc':
 front=[(.042,.081),(.053,.082),(.061,.080),(.084,.072),(.091,.066),(.162,.066),(.165,.0645),(.168,.0645),(.171,.066),(.179,.069),(.212,.080)]
elif style=='steel':
 front=[(.035,.083),(.047,.087),(.055,.088),(.079,.088),(.092,.078),(.105,.073),(.118,.080),(.132,.095),(.145,.099),(.193,.100),(.212,.112)]
else:
 front=[(.045,.099),(.059,.103),(.082,.101),(.096,.095),(.109,.099),(.125,.104),(.190,.112),(.212,.116)]
profile=front+[(r,z-.007) for r,z in reversed(front)]
face=lathe('Dished structural face',profile,closed=True)
if style=='disc':
 for i in range(8):
  # Narrow pill-shaped slots around the nearly solid dished face.
  ri,ro,half,cr=.184,.207,.030,.005
  poly=[(ri,-half+cr),(ri+cr,-half),(ro-cr,-half),(ro,-half+cr),(ro,half-cr),(ro-cr,half),(ri+cr,half),(ri,half-cr)]
  polygon_cut(face,poly,2*math.pi*i/8+math.pi/2)
elif style=='steel':
 for i in range(18):
  a=2*math.pi*(i+.5)/18;cut(face,cyl('Round vent cutter',.0145,.25,.075,n=16,x=.169*math.cos(a),y=.169*math.sin(a)))
else:
 for i in range(8):
  poly=[(.114,-.016),(.120,-.023),(.185,-.033),(.197,-.026),(.197,.026),(.185,.033),(.120,.023),(.114,.016)]
  polygon_cut(face,poly,2*math.pi*i/8+math.pi/2)
# Six mounting holes/cups, washers and service nuts; blank centre caps on the black designs.
for i in range(6):
 a=2*math.pi*i/6+math.pi/2;x=.06985*math.cos(a);y=.06985*math.sin(a)
 cut(face,cyl('Lug bore cutter',.0095,.22,.075,n=12,x=x,y=y))
bevel(face,.0012 if style!='steel' else .0015)
zlug={'disc':.087,'steel':.098,'window':.112}[style]
for i in range(6):
 a=2*math.pi*i/6+math.pi/2;x=.06985*math.cos(a);y=.06985*math.sin(a)
 washer=cyl('Lug seat',.0124,.004,zlug-.007,'rim' if style!='steel' else 'chrome',16,x,y);bevel(washer,.0006)
 nut=cyl('Six service nuts',.0085,.013,zlug,'rim' if style!='steel' else 'chrome',6,x,y);bevel(nut,.0008)
if style!='steel':
 z={'disc':.101,'window':.117}[style]
 lathe('Centre-cap shoulder',[(.041,z-.007),(.048,z-.007),(.052,z-.003),(.052,z+.003),(.048,z+.006),(.042,z+.006)],n=48)
 cap=cyl('Blank centre cap',.046,.007,z+.004,n=48);bevel(cap,.0009)
else:
 # The silver reference has an open centre, with a recessed hub behind it when fitted.
 lathe('Open hub rolled edge',[(.035,.079),(.036,.084),(.039,.088),(.043,.087)],n=48)
# Valve seated in the rolled flange; restrained rubber and metal details.
a=-math.pi/2-.08;x=.219*math.cos(a);y=.219*math.sin(a)
cyl('Valve rubber foot',.005,.010,.111,'black',12,x,y)
cyl('Valve stem',.003,.018,.121,'black',12,x,y)
cyl('Valve cap',.0037,.005,.132,'black',12,x,y)
# Join only the newly authored rim and bake crevice shading once.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='Rim '+style
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=obj.data;me.validate();me.update();me.set_sharp_from_angle(angle=.65)
attr=me.color_attributes.new(name='Baked AO',type='FLOAT_COLOR',domain='CORNER');me.color_attributes.active_color=attr
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.bake_type='AO';scene.render.bake.target='VERTEX_COLORS';scene.render.bake.margin=0
bpy.ops.object.bake(type='AO')
bm=bmesh.new();bm.from_mesh(me);bm.verts.ensure_lookup_table();curv=[]
for v in bm.verts:
 vals=[]
 for e in v.link_edges:
  if len(e.link_faces)==2:
   try:vals.append(e.calc_face_angle_signed())
   except:pass
 curv.append(max(.12,min(.88,.5+sum(vals)/max(1,len(vals))/math.pi*.6)))
bm.free();me.calc_loop_triangles();groups={}
for t in me.loop_triangles:
 zone=me.materials[t.material_index].name;g=groups.setdefault(zone,{'positions':[],'normals':[],'colors':[]})
 for li in t.loops:
  vi=me.loops[li].vertex_index;g['positions'].extend(me.vertices[vi].co);g['normals'].extend(me.corner_normals[li].vector);g['colors'].extend([max(.12,min(1,sum(attr.data[li].color[:3])/3)),curv[vi],0])
triangles=sum(len(g['positions'])//9 for g in groups.values())
(work/'rim-data.json').write_text(json.dumps({'style':style,'groups':groups,'triangles':triangles,'blender':bpy.app.version_string,'beadSeat_mm':431.8,'bake':{'type':'Cycles AO','samples':32,'target':'CORNER color attribute','curvature':'signed dihedral vertex average'}},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(work/('rim-'+style+'.blend')))
print('RIM_TRIANGLES',style,triangles)
