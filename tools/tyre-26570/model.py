import bpy, math, json, sys
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
work=Path(args[0]);work.mkdir(exist_ok=True,parents=True)
STYLE=args[3] if len(args)>3 else "at"
assert STYLE in ["at","ht"]
WIDTH=int(args[1]);ASPECT=int(args[2]);DIAMETER_MM=431.8+2*WIDTH*ASPECT/100
NEW_RADIUS=DIAMETER_MM/2000;WIDTH_FACTOR=WIDTH/285
# Fresh parametric tyre geometry, anchored at the unchanged 17-inch bead seat.
# Existing GLBs, the approved A geometry and the steel rim geometry are never read or changed.
def tyre_vertex(p):
 x,y,z=p;r=math.hypot(x,y)
 new_r=.2159+(r-.2159)*(NEW_RADIUS-.2159)/(.4154-.2159)
 t=max(0,min(1,(r-.2159)/(.270-.2159)));blend=t*t*(3-2*t)
 return (x*new_r/r,y*new_r/r,z*(1+(WIDTH_FACTOR-1)*blend))

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
R=.4154;objects=[]
materials={}
for name in ['tyre','rim','chrome','brake']:
 m=bpy.data.materials.new(name);m.diffuse_color=(.08,.08,.08,1);materials[name]=m

def mesh(name,vs,fs,zone,smooth=True):
 m=bpy.data.meshes.new(name);m.from_pydata([tyre_vertex(v) for v in vs] if zone=='tyre' else vs,[],fs);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(materials[zone]);objects.append(o)
 for p in m.polygons:p.use_smooth=smooth
 return o

def lathe(name,profile,zone,n=80):
 vs=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for i in range(n) for r,z in profile];k=len(profile);fs=[]
 for i in range(n):
  for j in range(k-1):fs.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+j+1,i*k+j+1))
 return mesh(name,vs,fs,zone)

def bevel(o,width=.0015):
 bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Moulded edge','BEVEL');mod.width=width;mod.segments=1;mod.affect='EDGES';bpy.ops.object.modifier_apply(modifier=mod.name)

def cyl(name,r,depth,z,zone,n=24,x=0,y=0):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=(x,y,z));o=bpy.context.object;o.name=name;o.data.materials.append(materials[zone]);objects.append(o)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
if STYLE=="at":
 # Reference casing profile; tyre_vertex authors the requested width and diameter.
 profile=[(.2159,-.103),(.226,-.112),(.258,-.131),(.310,-.1425),(.350,-.140),(.380,-.129),(.397,-.110),(.403,-.078),(.404,-.035),(.404,.035),(.403,.078),(.397,.110),(.380,.129),(.350,.140),(.310,.1425),(.258,.131),(.226,.112),(.2159,.103)]
 lathe('Rounded rubber casing',profile,'tyre',64)
 # Four staggered rows of broad interlocking hexagonal blocks; chamfered moulded edges.
 for i in range(38):
  for col,z in enumerate([-.110,-.037,.037,.110]):
   theta=2*math.pi*(i+(col%2)*.43)/38
   width=.053 if col in [0,3] else .060
   lean=(1 if col<2 else -1)*.007
   poly=[(-.023,-width/2),(.014,-width/2),(.025,-width*.18),(.020,width/2),(-.014,width/2),(-.027,width*.15)]
   vs=[]
   for layer in range(3):
    for u,v in poly:
     inset=.90 if layer==2 else 1.0
     zz=z+v*inset;th=theta+(u*inset+lean*v/width)/R
     crown=R-.015*(abs(zz)/.1425)**3
     rr=(.397-.013*(abs(zz)/.1425)**3) if layer==0 else crown-(.0017 if layer==1 else 0)
     vs.append((rr*math.cos(th),rr*math.sin(th),zz))
   fs=[tuple(range(5,-1,-1)),tuple(range(12,18))]
   for layer in range(2):
    for j in range(6):fs.append((layer*6+j,layer*6+(j+1)%6,(layer+1)*6+(j+1)%6,(layer+1)*6+j))
   mesh('Expedition tread',vs,fs,'tyre')
 # Sidewall protector rings and moulded shoulder ribs, no lettering or branding.
 def casing_z(rad):
  p=[(r,z) for r,z in profile if z>0]
  p.sort()
  for (r0,z0),(r1,z1) in zip(p,p[1:]):
   if r0<=rad<=r1:return z0+(z1-z0)*(rad-r0)/(r1-r0)
  raise ValueError(rad)
 for sign in [-1,1]:
  for rad in [.241,.249,.355]:
   z=sign*(casing_z(rad)-.0005)
   lathe('Moulded sidewall ring',[(rad-.001,z),(rad,z+sign*.0013),(rad+.001,z)],'tyre',40)
  for i in range(38):
   a=(i+.10)*2*math.pi/38
   corners=[(.358,a-.015,.139),(.384,a+.023,.126),(.380,a+.040,.132),(.355,a+.002,.142)]
   vs=[(rr*math.cos(th),rr*math.sin(th),sign*(casing_z(rr)-.0012)) for rr,th,zz in corners]
   vs += [(rr*math.cos(th),rr*math.sin(th),sign*zz) for rr,th,zz in corners]
   fs=[(4,5,6,7)]
   for j in range(4):fs.append((j,(j+1)%4,(j+1)%4+4,j+4))
   mesh('Rooted sidewall shoulder shield',vs,fs,'tyre')
else:
 # Generic five-rib highway tread interpreted from the supplied photograph.
 # Four narrow zigzag channels; continuous ribs, rounded shoulders, smooth unbranded sidewalls.
 side=[(.2159,-.103),(.230,-.112),(.280,-.131),(.335,-.1425),(.385,-.132),(.405,-.118)]
 def crown(z):return R-.010*(abs(z)/.1425)**2
 section=[(r,z,False,0) for r,z in side]
 tread=[(-.110,0,False),(0,0,False),(.110,0,False)]
 for c in [-.073,-.025,.025,.073]:
  for dz,depth in [(-.0038,0),(-.0030,.00065),(-.0018,.0070),(.0018,.0070),(.0030,.00065),(.0038,0)]:
   tread.append((c+dz,depth,True))
 for z,depth,zig in sorted(tread):section.append((crown(z)-depth,z,zig,depth))
 section += [(r,-z,False,0) for r,z in reversed(side)]
 # Closed inner liner: the bare tyre is a real hollow casing, not an open thin shell.
 section += [(r,z,False,0) for r,z in [(.270,.116),(.380,.100),(.397,0),(.380,-.100),(.270,-.116),(.2159,-.103)]]
 n=96;k=len(section);vs=[]
 for i in range(n):
  theta=2*math.pi*i/n
  zig=[0,1,0,-1][i%4]*.00125
  for r,z,is_groove,depth in section:
   zz=z+zig if is_groove else z
   rr=crown(zz)-depth if is_groove else r
   vs.append((rr*math.cos(theta),rr*math.sin(theta),zz))
 fs=[]
 for i in range(n):
  for j in range(k-1):fs.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+j+1,i*k+j+1))
 mesh('Five continuous ribs and closed casing',vs,fs,'tyre')
 # Low moulded sidewall lines seated on the outer casing. No lettering or logos.
 def surface_z(rad):
  p=sorted([(r,-z) for r,z in side])
  for (r0,z0),(r1,z1) in zip(p,p[1:]):
   if r0<=rad<=r1:return z0+(z1-z0)*(rad-r0)/(r1-r0)
  raise ValueError(rad)
 for sign in [-1,1]:
  for rad in [.241,.355]:
   zz=sign*(surface_z(rad)-.00025)
   lathe('Fine moulded sidewall ring',[(rad-.0007,zz),(rad,zz+sign*.00085),(rad+.0007,zz)],'tyre',32)
# Rim barrel, rolled outer lips. 17-inch = .4318m bead-seat diameter.
lathe('Rolled steel rim',[(.2159,-.104),(.226,-.108),(.231,-.104),(.231,-.098),(.222,-.094),(.214,-.090),(.209,-.075),(.207,.065),(.214,.091),(.222,.105),(.231,.109),(.231,.114),(.227,.118),(.219,.117),(.2159,.109)],'rim',64)
# Pressed steel disc with actual circular ventilation holes.
disc=cyl('Pressed steel wheel face',.209,.014,.078,'rim',64)
for i in range(12):
 a=2*math.pi*i/12;c=cyl('Vent cutter',.021,.08,.078,'rim',12,.149*math.cos(a),.149*math.sin(a));bpy.context.view_layer.objects.active=disc;mod=disc.modifiers.new('Round vent','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=c;bpy.ops.object.modifier_apply(modifier=mod.name);objects.remove(c);bpy.data.objects.remove(c,do_unlink=True)
bevel(disc,.0018)
lathe('Wheel dish and hub boss',[(.040,.114),(.045,.116),(.057,.112),(.068,.099),(.084,.091),(.099,.085),(.108,.083)],'rim',64)
cyl('Blank centre cap',.040,.009,.116,'rim',48)
# Six service lug nuts, plus restrained silver perimeter fasteners, as reference A.
for i in range(6):
 a=2*math.pi*i/6;o=cyl('Six lug nuts',.008,.014,.108,'chrome',6,.067*math.cos(a),.067*math.sin(a));bevel(o,.0008)
for i in range(16):
 a=2*math.pi*(i+.5)/16;cyl('Rim perimeter bolt',.0038,.004,.116,'chrome',6,.207*math.cos(a),.207*math.sin(a))
cyl('Brake disc',.171,.012,-.052,'brake',64)
cyl('Brake hat',.076,.045,-.032,'brake',40)
# Join for a real Cycles vertex AO bake, with all new parts occluding one another.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();obj=bpy.context.object;obj.name='Expedition A' if STYLE=='at' else 'Five-rib highway'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=obj.data;me.validate();me.update();me.set_sharp_from_angle(angle=.65)
attr=me.color_attributes.new(name='Baked AO',type='FLOAT_COLOR',domain='CORNER');me.color_attributes.active_color=attr
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.bake_type='AO';scene.render.bake.target='VERTEX_COLORS';scene.render.bake.margin=0
bpy.ops.object.bake(type='AO')
# Signed edge-angle curvature, G=.5 on flat geometry; stored alongside actual baked AO.
import bmesh
bm=bmesh.new();bm.from_mesh(me);bm.verts.ensure_lookup_table();curv=[]
for v in bm.verts:
 vals=[]
 for e in v.link_edges:
  if len(e.link_faces)==2:
   try:vals.append(e.calc_face_angle_signed())
   except:pass
 q=sum(vals)/max(1,len(vals));curv.append(max(.12,min(.88,.5+q/math.pi*.6)))
bm.free();me.calc_loop_triangles();groups={}
for t in me.loop_triangles:
 zone=me.materials[t.material_index].name;g=groups.setdefault(zone,{'positions':[],'normals':[],'colors':[]})
 for li in t.loops:
  vi=me.loops[li].vertex_index;g['positions'].extend(me.vertices[vi].co);g['normals'].extend(me.corner_normals[li].vector);ao=sum(attr.data[li].color[:3])/3;g['colors'].extend([max(.12,min(1,ao)),curv[vi],0])
triangles=sum(len(g['positions'])//9 for g in groups.values())
(work/'wheel-data.json').write_text(json.dumps({'style':STYLE,'groups':groups,'triangles':triangles,'blender':bpy.app.version_string,'sizeSpec':{'sectionWidth_mm':WIDTH,'aspect':ASPECT,'beadSeat_in':17,'calculatedDiameter_mm':DIAMETER_MM},'bake':{'type':'Cycles AO','target':'CORNER color attribute','samples':24,'curvature':'signed dihedral vertex average'}},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(work/('tyre-'+STYLE+str(WIDTH)+str(ASPECT)+'.blend')))
print('TYRE_A_TRIANGLES',triangles)
