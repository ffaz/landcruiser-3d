"""Three reference-inspired 17-inch rims. New geometry only; no tyre mesh is read."""
import bpy, math, sys, json, bmesh
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];work=Path(args[0]);style=args[1];work.mkdir(parents=True,exist_ok=True)
assert style in ['disc','steel','window']
LUGS=5;PCD=.150;BORE=.1103 if style=='window' else .1101
WIDTH_IN=8.0 if style=='steel' else 8.5
WIDTH_FACTOR=WIDTH_IN*25.4/206.0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for z in ['rim','chrome','black','tyre','brake']:
 m=bpy.data.materials.new(z);m.diffuse_color=(.15,.15,.15,1);materials[z]=m
objects=[]
def mesh(name,vs,fs,zone='rim'):
 m=bpy.data.meshes.new(name);m.from_pydata([(x,y,z*WIDTH_FACTOR) for x,y,z in vs],[],fs);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(materials[zone]);objects.append(o)
 for p in m.polygons:p.use_smooth=True
 return o
def lathe(name,profile,zone='rim',n=64,closed=False):
 k=len(profile);vs=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for i in range(n) for r,z in profile];fs=[]
 for i in range(n):
  for j in range(k if closed else k-1):fs.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+(j+1)%k,i*k+(j+1)%k))
 return mesh(name,vs,[tuple(reversed(f)) for f in fs] if closed else fs,zone)
def cyl(name,r,d,z,zone='rim',n=24,x=0,y=0):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=d*WIDTH_FACTOR,location=(x,y,z*WIDTH_FACTOR));o=bpy.context.object;o.name=name;o.data.materials.append(materials[zone]);objects.append(o)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
def cut(target,cutter):
 bpy.context.view_layer.objects.active=target;mod=target.modifiers.new('True opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
def bevel(obj,width=.0012):
 bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=width;mod.segments=1;mod.affect='EDGES';mod.limit_method='ANGLE';mod.angle_limit=.65;bpy.ops.object.modifier_apply(modifier=mod.name)
def polygon_cut(target,poly,a):
 vs=[]
 for z in [-.02,.20]:
  for r,t in poly:vs.append((r*math.cos(a)-t*math.sin(a),r*math.sin(a)+t*math.cos(a),z))
 k=len(poly);fs=[tuple(range(k-1,-1,-1)),tuple(range(k,2*k))]
 for j in range(k):fs.append((j,(j+1)%k,(j+1)%k+k,j+k))
 cut(target,mesh('Window cutter',vs,fs))
# Same 431.8 mm bead seat as the existing tyres; the rolled flange extends beyond it.
barrel=[(.2159,-.103),(.226,-.108),(.231,-.104),(.231,-.098),(.222,-.094),(.214,-.090),(.207,-.068),(.205,.065),(.212,.093),(.222,.105),(.231,.110),(.231,.116),(.227,.120),(.219,.117),(.2159,.103)]
# Inner return wall closes the barrel; bead-seat spacing equals the catalogue width.
barrel += [(.213,.101),(.201,.063),(.203,-.068),(.213,-.101),barrel[0]]
barrel_obj=lathe('Rolled lip and hollow barrel',barrel)
# Dark coated inner return: prevents a softbox reflection looking like daylight in a vent.
barrel_obj.data.materials.append(materials['black'])
for poly in barrel_obj.data.polygons:
 if poly.index%(len(barrel)-1)>=14:poly.material_index=1
if style=='disc':
 # KM720: flat lug ring, two concentric raised steps and a shallow outer vent band.
 front=[(BORE/2,.110),(.064,.110),(.092,.110),(.101,.110),(.105,.113),(.110,.114),(.149,.114),(.153,.114),(.157,.117),(.163,.117),(.179,.117),(.184,.113),(.212,.113)]
elif style=='steel':
 front=[(BORE/2,.102),(.062,.105),(.082,.105),(.094,.100),(.106,.095),(.118,.101),(.134,.109),(.194,.109),(.212,.113)]
else:
 # MR705: flat split-five-spoke face / ten tapered windows and a wide raised lip.
 front=[(BORE/2,.109),(.063,.111),(.090,.111),(.099,.106),(.106,.111),(.114,.116),(.197,.116),(.202,.119),(.212,.119)]
profile=front+[(r,z-.007) for r,z in reversed(front)]
face=lathe('Reference wheel face',profile,closed=True)
def rounded(poly,amount=.005,steps=3):
 out=[]
 for i,p in enumerate(poly):
  prev,nxt=poly[i-1],poly[(i+1)%len(poly)]
  def toward(q):
   d=math.hypot(q[0]-p[0],q[1]-p[1]);f=min(.4,amount/d);return(p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f)
  a,b=toward(prev),toward(nxt)
  for j in range(steps+1):
   t=j/steps;out.append(((1-t)**2*a[0]+2*(1-t)*t*p[0]+t*t*b[0],(1-t)**2*a[1]+2*(1-t)*t*p[1]+t*t*b[1]))
 return out
if style=='disc':
 for i in range(8):
  poly=[]
  # Tangential capsule: true rounded ends, 20 mm radial width, 60 mm length.
  for cy,start in [(.020,0),(-.020,math.pi)]:
   for j in range(9):
    a=start+j*math.pi/8;poly.append((.195+.010*math.cos(a),cy+.010*math.sin(a)))
  polygon_cut(face,poly,2*math.pi*i/8+math.pi/2)
elif style=='steel':
 for i in range(18):
  a=2*math.pi*(i+.5)/18;cut(face,cyl('Round vent cutter',.0145,.25,.075,n=16,x=.169*math.cos(a),y=.169*math.sin(a)))
else:
 for i in range(10):
  wi,wo=(.014,.025) if i%2==0 else (.020,.032)
  polygon_cut(face,rounded([(.126,-wi),(.198,-wo),(.198,wo),(.126,wi)],.006),2*math.pi*i/10+math.pi/2)
# LC200 catalogue fit: five mounting holes on 150 mm PCD; blank caps on black designs.
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 cut(face,cyl('Lug bore cutter',.0095,.22,.075,n=12,x=x,y=y))
bevel(face,.0012 if style!='steel' else .0015)
zlug={'disc':.110,'steel':.105,'window':.111}[style]+.008
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 washer=cyl('Lug seat',.0124,.004,zlug-.006,'rim' if style!='steel' else 'chrome',16,x,y);bevel(washer,.0006)
 nut=cyl('Five service nuts',.0085,.013,zlug,'rim' if style!='steel' else 'chrome',6,x,y);bevel(nut,.0008)
if style!='steel':
 z={'disc':.119,'window':.119}[style];cap_r=.0635 if style=='disc' else .056
 lathe('Centre-cap shoulder',[(BORE/2,z-.012),(cap_r+.001,z-.012),(cap_r+.001,z+.002),(cap_r,z+.004),(BORE/2,z+.004)],n=32)
 cap=cyl('Flat centre cap',cap_r,.005,z+.002,n=32);bevel(cap,.0007)
else:
 lathe('Raised centre hub plate',[(BORE/2,.095),(.057,.102),(.062,.105),(.065,.105)],n=48)
# Valve seated in the rolled flange; restrained rubber and metal details.
a=-math.pi/2-.08;x=.219*math.cos(a);y=.219*math.sin(a)
cyl('Valve rubber foot',.005,.010,.111,'black',12,x,y)
cyl('Valve stem',.003,.018,.121,'black',12,x,y)
cyl('Valve cap',.0037,.005,.132,'black',12,x,y)
# Fit adapter: lower rubber sidewall closes the stored tyre's oversize 516 mm opening.
# Its physical width follows the stored tyre, not the chosen rim width. Metal lip stays 462 mm.
for sign in [-1,1]:
 profile=[(.229,.112*WIDTH_FACTOR),(.232,.120*WIDTH_FACTOR),(.242,.132),(.255,.139),(.267,.138),(.267,.122),(.247,.116),(.229,.108*WIDTH_FACTOR)]
 profile=[(r,sign*z/WIDTH_FACTOR) for r,z in profile]
 if sign<0:profile.reverse()
 lathe('Black rubber bead and lower sidewall filler',profile,'tyre',56,True)
# Opaque brake dust shield closes the back of the barrel beyond the rotor's radius.
# The rotor remains a full 354 mm vented disc, rather than an oversize fake disc.
cyl('Dark brake backing shield',.229,.006,-.070,'black',32)
for z in [.025,.041]:
 lathe('Vented rotor face',[(.091,z+.003),(.176,z+.003),(.177,z+.002),(.177,z-.002),(.176,z-.003),(.091,z-.003)],'brake',40,True)
for i in range(16):
 a=2*math.pi*i/16;r=.142
 bpy.ops.mesh.primitive_cube_add(size=1,location=(r*math.cos(a),r*math.sin(a),.033*WIDTH_FACTOR));o=bpy.context.object;o.name='Rotor ventilation vane';o.dimensions=(.063,.006,.012*WIDTH_FACTOR);o.rotation_euler.z=a;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(materials['brake']);objects.append(o)
cyl('Closed rotor hat and stud hub',.094,.046,.060,'brake',32)
cyl('Dark hub nose behind the centre bore',.053,.020,.090,'black',24)
for i in range(5):
 a=math.pi/2+2*math.pi*i/5;cyl('Hub stud',.005,.060,.088,'brake',8,.075*math.cos(a),.075*math.sin(a))
# Compact, rounded floating caliper housing behind the face.
bpy.ops.mesh.primitive_cube_add(size=1,location=(-.145,.060,.057*WIDTH_FACTOR));cal=bpy.context.object;cal.name='Brake caliper';cal.dimensions=(.058,.092,.060*WIDTH_FACTOR);cal.rotation_euler.z=-.35;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);cal.data.materials.append(materials['black']);objects.append(cal);bevel(cal,.008)
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
(work/'rim-data.json').write_text(json.dumps({'style':style,'groups':groups,'triangles':triangles,'blender':bpy.app.version_string,'beadSeat_mm':431.8,'width_in':WIDTH_IN,'features':{'ventCount':8 if style=='disc' else 18 if style=='steel' else 10,'rotorDiameter_mm':354,'rubberFillerOuter_mm':534,'metalFlange_mm':462},'boltPattern':'5x150','centreBore_mm':BORE*1000,'bake':{'type':'Cycles AO','samples':32,'target':'CORNER color attribute','curvature':'signed dihedral vertex average'}},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(work/('rim-'+style+'.blend')))
print('RIM_TRIANGLES',style,triangles)
