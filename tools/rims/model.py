"""Three reference-inspired 17-inch rims. New geometry only; no tyre mesh is read."""
import bpy, math, sys, json, bmesh
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];work=Path(args[0]);style=args[1];work.mkdir(parents=True,exist_ok=True)
assert style in ['disc','steel','window']
LUGS=5;PCD=.150;BORE=.1103 if style=='window' else .1101
WIDTH_IN=8.0 if style=='steel' else 8.5
WIDTH_FACTOR=WIDTH_IN*25.4/206.0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for z in ['rim','chrome','black','tyre','brake','caliper','backing','lettering','barrel','brake_detail','hubcap','hat','cap_lettering']:
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
barrel_obj.data.materials.append(materials['barrel'])
for poly in barrel_obj.data.polygons:
 if poly.index%(len(barrel)-1)>=14:poly.material_index=1
if style=='disc':
 # KM720: flat lug ring, two concentric raised steps and a shallow outer vent band.
 front=[(BORE/2,.085),(.089,.085),(.096,.105),(.112,.105),(.117,.109),(.144,.109),(.149,.115),(.160,.115),(.164,.108),(.180,.108),(.186,.117),(.212,.117)]
elif style=='steel':
 front=[(BORE/2,.102),(.062,.105),(.082,.105),(.094,.100),(.106,.095),(.118,.101),(.134,.109),(.194,.109),(.212,.113)]
else:
 # MR705: flat split-five-spoke face / ten tapered windows and a wide raised lip.
 # Rotor hat ends at .060 + .046/2 = .083. A coplanar .083 dish
 # z-fights in oblique views; move only the rim face, not the locked hardware.
 front=[(BORE/2,.0845),(.088,.0845),(.100,.091),(.111,.115),(.175,.115),(.184,.119),(.212,.119)]
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
 for i in range(9):
  poly=[]
  # Tangential capsule: 14 mm radial width, 60 mm overall length.
  for cy,start in [(.023,0),(-.023,math.pi)]:
   for j in range(13):
    a=start+j*math.pi/12;poly.append((.169+.007*math.cos(a),cy+.007*math.sin(a)))
  polygon_cut(face,poly,2*math.pi*i/9+math.pi/2)
elif style=='steel':
 for i in range(16):
  a=2*math.pi*i/16+math.pi/2+math.pi/16;cut(face,cyl('Round vent cutter',.0145,.25,.075,n=16,x=.169*math.cos(a),y=.169*math.sin(a)))
else:
 for i in range(10):
  ri,ro=(.131,.163) if i%2==0 else (.1055,.165)
  # Shared angular width: do not stretch the long (including bottom) windows.
  wi,wo=ri*math.tan(math.radians(12)),ro*math.tan(math.radians(12))
  polygon_cut(face,rounded([(ri,-wi),(ro,-wo),(ro,wo),(ri,wi)],.007),2*math.pi*i/10+math.pi/2)
# LC200 catalogue fit: accepted five-hole 150 mm PCD is unchanged.
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 cut(face,cyl('Lug bore cutter',.0095,.22,.075,n=12,x=x,y=y))
# The same bevel on every opening supplies an actual illuminated pocket wall.
bevel(face,.0018 if style=='disc' else .0012 if style=='window' else .0015)
zlug={'disc':.085,'steel':.105,'window':.083}[style]+.008
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 washer=cyl('Lug seat',.0124,.004,zlug-.006,'black' if style!='steel' else 'chrome',16,x,y);bevel(washer,.0006)
 nut=cyl('Five service nuts',.0085 if style=='steel' else .0100,.013,zlug,'black' if style!='steel' else 'chrome',6,x,y);bevel(nut,.0008)
if style!='steel':
 z={'disc':.092,'window':.090}[style];cap_r=.055 if style=='disc' else .056
 lathe('Centre-cap shoulder',[(BORE/2,z-.012),(cap_r+.001,z-.012),(cap_r,z+.002),(cap_r,z+.004),(BORE/2,z+.004)],n=40)
 cap=cyl('Flat centre cap',cap_r,.005,z+.002,'rim' if style=='disc' else 'hubcap',n=48);bevel(cap,.0007)
else:
 lathe('Raised centre hub plate',[(BORE/2,.095),(.057,.102),(.062,.105),(.065,.105)],n=48)
# Analytic lathe shading is independent of the Boolean's sparse ngon triangulation.
# This changes new-rim normals only; the steel pressing's positions are unchanged.
def surface_normal(r,theta,back=False):
 slopes=[]
 for i,(rr,zz) in enumerate(front):
  if abs(r-rr)<.00002:
   for j in [i-1,i]:
    if 0<=j<len(front)-1:
     dr=front[j+1][0]-front[j][0];dz=front[j+1][1]-front[j][1]
     if dr>1e-7:slopes.append(Vector((-dz,dr)).normalized())
   break
 if not slopes:
  for (r0,z0),(r1,z1) in zip(front,front[1:]):
   if r0-1e-5<=r<=r1+1e-5 and r1-r0>1e-7:
    slopes=[Vector((-(z1-z0),r1-r0)).normalized()];break
 n=sum(slopes,Vector((0,0))).normalized() if slopes else Vector((0,1))
 out=Vector((n.x*math.cos(theta),n.x*math.sin(theta),n.y/WIDTH_FACTOR)).normalized()
 return -out if back else out
# Shallow cast lettering; no texture or realtime pass. Kept on top of the face/cap.
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=bpy.data.fonts.load(fontpath) if Path(fontpath).exists() else None
def label(text,x,y,z,width,height,angle=0,zone='lettering'):
 curve=bpy.data.curves.new(text,'FONT');curve.body=text;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=1;curve.extrude=.00035;curve.bevel_depth=.00010;curve.bevel_resolution=0;curve.resolution_u=2
 if font:curve.font=font
 bpy.ops.object.select_all(action='DESELECT')
 o=bpy.data.objects.new(text,curve);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object
 xs=[v.co.x for v in o.data.vertices];ys=[v.co.y for v in o.data.vertices]
 o.scale=(width/(max(xs)-min(xs)),height/(max(ys)-min(ys)),1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.location=(x,y,z*WIDTH_FACTOR);o.rotation_euler.z=angle;o.data.materials.append(materials[zone]);objects.append(o);o.select_set(False)
def kmc_mark(x,y,z,width,height):
 # Squared K / joined lowercase m / open C from the manufacturer's cap mark.
 # New shallow mesh, rather than substituting a generic typeset 'KMC'.
 paths=[[(0,0),(6,0),(6,25),(0,25)],[(21,0),(14,12.5),(21,25),(14,25),(7,12.5),(14,0)],
 [(26,0),(26,25),(40,25),(44,23),(47,25),(55,25),(59,23),(61,19),(61,0),(55,0),(55,17),(53,19),(48,19),(46,17),(46,0),(40,0),(40,17),(38,19),(32,19),(32,0)],
 [(92,25),(74,25),(69,23),(66,19),(66,6),(69,2),(74,0),(92,0),(92,8),(86,8),(86,6),(76,6),(73,8),(73,17),(76,19),(86,19),(86,17),(92,17)]]
 for path in paths:
  k=len(path);vs=[(x+(px/92-.5)*width,y+(py/25-.5)*height,zz) for zz in [z,z+.00065] for px,py in path]
  # Paths have consistent clockwise outline; mesh validation determines triangulation.
  area=sum(path[i][0]*path[(i+1)%k][1]-path[(i+1)%k][0]*path[i][1] for i in range(k))
  if area<0:
   path=list(reversed(path));vs=[(x+(px/92-.5)*width,y+(py/25-.5)*height,zz) for zz in [z,z+.00065] for px,py in path]
  fs=[tuple(range(k-1,-1,-1)),tuple(range(k,2*k))]+[(i,(i+1)%k,(i+1)%k+k,i+k) for i in range(k)]
  mark=mesh('Cast KMC mark',vs,fs,'lettering')
  for poly in mark.data.polygons:poly.use_smooth=False
if style=='disc':
 # Small source-reference cap inside the accepted five service nuts.
 kmc_mark(0,.009,.09748,.069,.016);label('WHEELS',0,-.014,.0977,.062,.0055)
 lathe('Cap perimeter relief',[(.051,.0965),(.052,.0975),(.053,.0975),(.054,.0965)],n=48)
 # Tone-on-tone bead/lip step, entirely inside the accepted 462 mm flange.
 lathe('Outer bead ring step',[(.214,.117),(.216,.119),(.224,.119),(.226,.117)],n=64)
 # Centre the small mark on the flat lip land and give it cast edge relief.
 kmc_mark(0,.219,.1202,.043,.009)
elif style=='window':
 # Six individual glyphs follow the cast face's top/bottom arcs.
 for bottom in [False,True]:
  for i,ch in enumerate('METHOD'):
   a=math.pi/2+(2.5-i)*.090+(math.pi if bottom else 0)
   # Solid outer land is beyond all window edges (max radius < 170 mm).
   label(ch,.190*math.cos(a),.190*math.sin(a),.1194,.011,.012,a-math.pi/2)
 label('METHOD',0,.006,.0957,.078,.011,zone='cap_lettering')
 label('BEAD GRIP',0,-.012,.0957,.074,.0048,zone='cap_lettering')
 lathe('Raised Bead Grip outer ring',[(.208,.117),(.212,.121),(.224,.121),(.226,.118)],n=64)
# Valve seated in the rolled flange; restrained rubber and metal details.
a=-math.pi/2;x=.219*math.cos(a);y=.219*math.sin(a)
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
cyl('Dark brake backing shield',.229,.006,-.070,'backing',32)
for z in [.025,.041]:
 lathe('Vented rotor face',[(.091,z+.003),(.176,z+.003),(.177,z+.002),(.177,z-.002),(.176,z-.003),(.091,z-.003)],'brake',40,True)
for i in range(16):
 a=2*math.pi*i/16;r=.142
 bpy.ops.mesh.primitive_cube_add(size=1,location=(r*math.cos(a),r*math.sin(a),.033*WIDTH_FACTOR));o=bpy.context.object;o.name='Rotor ventilation vane';o.dimensions=(.063,.006,.012*WIDTH_FACTOR);o.rotation_euler.z=a;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(materials['brake']);objects.append(o)
cyl('Closed rotor hat and stud hub',.094,.046,.060,'hat',32)
cyl('Metal hub nose behind the centre bore',.053,.020,.090 if style=='steel' else .075,'chrome' if style=='steel' else 'hat',24)
for i in range(5):
 a=math.pi/2+2*math.pi*i/5;cyl('Hub stud',.005,.060 if style=='steel' else .036,.088 if style=='steel' else .069,'chrome' if style=='steel' else 'hat',8,.075*math.cos(a),.075*math.sin(a))
# Compact, rounded floating caliper housing behind the face.
bpy.ops.mesh.primitive_cube_add(size=1,location=(-.145,.060,.057*WIDTH_FACTOR));cal=bpy.context.object;cal.name='Brake caliper';cal.dimensions=(.058,.092,.060*WIDTH_FACTOR);cal.rotation_euler.z=-.35;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);cal.data.materials.append(materials['caliper']);objects.append(cal);bevel(cal,.008)
# Fine factory machining rings on the existing rotor face, and caliper fasteners.
# Additive detail only: accepted rotor, shield and caliper coordinates stay unchanged.
for r in [.126,.163]:
 lathe('Rotor machining witness ring',[(r+.00035,.04408),(r-.00035,.04408)],'brake_detail',64)
for sign in [-1,1]:
 dy=sign*.027;x=-.145+math.sin(.35)*dy;y=.060+math.cos(.35)*dy
 cyl('Caliper face fastener',.0045,.004,.088,'brake_detail',8,x,y)
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
  vi=me.loops[li].vertex_index;g['positions'].extend(me.vertices[vi].co)
  normal=me.corner_normals[li].vector.copy()
  if normal.length<1e-6:normal=t.normal.copy()
  if normal.length<1e-6:normal=Vector((0,0,1))
  r=math.hypot(me.vertices[vi].co.x,me.vertices[vi].co.y);z=me.vertices[vi].co.z/WIDTH_FACTOR
  if zone=='rim' and abs(t.normal.z)>.9999 and z>.09:
   normal=Vector((0,0,1 if t.normal.z>0 else -1))
  elif zone=='rim' and abs(t.normal.z)>.65:
   nearest=min(((abs(z-(z0+(z1-z0)*(r-r0)/(r1-r0))),z0+(z1-z0)*(r-r0)/(r1-r0)) for (r0,z0),(r1,z1) in zip(front,front[1:]) if r0-1e-5<=r<=r1+1e-5 and r1-r0>1e-7),default=(99,99))
   if nearest[0]<.0014:normal=surface_normal(r,math.atan2(me.vertices[vi].co.y,me.vertices[vi].co.x))
  g['normals'].extend(normal.normalized())
  ao=max(.12,min(1,sum(attr.data[li].color[:3])/3))
  # Sparse rotor vertices lie behind the face, outside the actual vent light paths.
  # Bound only new hardware AO so reflections/depth remain legible through holes.
  ao=max({'brake':.78,'caliper':.72,'backing':.62,'brake_detail':.80}.get(zone,.12),ao)
  edge=curv[vi]
  if zone=='rim' and t.normal.z>.9999 and me.vertices[vi].co.z>.09:
   ao=.98;edge=.5
  g['colors'].extend([ao,edge,0])
triangles=sum(len(g['positions'])//9 for g in groups.values())
(work/'rim-data.json').write_text(json.dumps({'style':style,'groups':groups,'triangles':triangles,'blender':bpy.app.version_string,'beadSeat_mm':431.8,'width_in':WIDTH_IN,'features':{'ventCount':9 if style=='disc' else 16 if style=='steel' else 10,'rotorDiameter_mm':354,'methodWindowRadii_mm':[131,163,105.5,165] if style=='window' else None,'capDiameter_mm':110 if style=='disc' else 112 if style=='window' else None,'rubberFillerOuter_mm':534,'metalFlange_mm':462},'boltPattern':'5x150','centreBore_mm':BORE*1000,'bake':{'type':'Cycles AO','samples':32,'target':'CORNER color attribute','curvature':'signed dihedral vertex average'}},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(work/('rim-'+style+'.blend')))
print('RIM_TRIANGLES',style,triangles)
