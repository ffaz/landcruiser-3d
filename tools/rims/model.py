"""Three reference-inspired 17-inch rims. New geometry only; no tyre mesh is read."""
import bpy, math, sys, json, bmesh
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];work=Path(args[0]);style=args[1];work.mkdir(parents=True,exist_ok=True)
assert style in ['disc','steel','window']
LUGS=5;PCD=.150;BORE=.1103 if style=='window' else .1101
WIDTH_IN=8.0 if style=='steel' else 8.5
WIDTH_FACTOR=WIDTH_IN*25.4/206.0
R=.231 # Outer metal lip edge, not the smaller raised bead-grip land.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for z in ['rim','chrome','black','tyre','brake','caliper','backing','lettering','barrel','brake_detail','hubcap','hat','cap_lettering','pocket_wall','hub_metal','bead_groove','lip','edge_catch','nut_metal','groove_shoulder','nut_pocket']:
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
 bpy.context.view_layer.objects.active=target;mod=target.modifiers.new('True opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;mod.material_mode='TRANSFER';bpy.ops.object.modifier_apply(modifier=mod.name);objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
def bevel(obj,width=.0012,segments=1,zone=None):
 bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=width;mod.segments=segments
 if zone:
  obj.data.materials.append(materials[zone]);mod.material=len(obj.data.materials)-1
 mod.affect='EDGES';mod.limit_method='ANGLE';mod.angle_limit=.65;bpy.ops.object.modifier_apply(modifier=mod.name)
def face_depth(r):
 # Float32 boundary vertices must use the inner depth, never the outer fallback.
 if r<=front[0][0]:return front[0][1]
 for (r0,z0),(r1,z1) in zip(front,front[1:]):
  if r0<=r<=r1:return z0+(z1-z0)*(r-r0)/(r1-r0)
 return front[-1][1]
def polygon_cut(target,poly,a):
 # A four-ring cutter makes a real, broad mouth chamfer rather than relying
 # on the Boolean bevel's shortest-edge clamp. The mouth silhouette stays put.
 cr=sum(r for r,t in poly)/len(poly);ct=sum(t for r,t in poly)/len(poly)
 radial=max(r for r,t in poly)-min(r for r,t in poly)
 tangent=max(t for r,t in poly)-min(t for r,t in poly)
 inset=.004 if style=='disc' else .02*R
 sr=max(.5,1-2*inset/radial);st=max(.5,1-2*inset/tangent)
 throat=[(cr+(r-cr)*sr,ct+(t-ct)*st) for r,t in poly]
 if style=='window':
  shoulder=[(r*.65+tr*.35,t*.65+tt*.35) for (r,t),(tr,tt) in zip(poly,throat)]
  rings=[(throat,lambda r,t:-.02),(throat,lambda r,t:face_depth(math.hypot(r,t))-.0055),
         (shoulder,lambda r,t:face_depth(math.hypot(r,t))-.0010),
         (poly,lambda r,t:face_depth(math.hypot(r,t))+.00005),(poly,lambda r,t:.20)]
 else:
  rings=[(throat,lambda r,t:-.02),(throat,lambda r,t:face_depth(math.hypot(r,t))-.006),
         (poly,lambda r,t:face_depth(math.hypot(r,t))+.00005),(poly,lambda r,t:.20)]
 vs=[(r*math.cos(a)-t*math.sin(a),r*math.sin(a)+t*math.cos(a),depth(r,t))
     for shape,depth in rings for r,t in shape]
 k=len(poly);top=(len(rings)-1)*k;fs=[tuple(range(k-1,-1,-1)),tuple(range(top,top+k))]
 for ring in range(len(rings)-1):
  for j in range(k):fs.append((ring*k+j,ring*k+(j+1)%k,(ring+1)*k+(j+1)%k,(ring+1)*k+j))
 cutter=mesh('Through opening and cast pocket wall',vs,fs,'pocket_wall')
 for p in cutter.data.polygons:p.use_smooth=False
 cut(target,cutter)
# Same 431.8 mm bead seat as the existing tyres; the rolled flange extends beyond it.
barrel=[(.2159,-.103),(.226,-.108),(.231,-.104),(.231,-.098),(.222,-.094),(.214,-.090),(.207,-.068),(.205,.065),(.212,.093),(.222,.105),(.231,.110),(.231,.116),(.227,.120),(.219,.117),(.2159,.103)]
if style in ['window','steel']:
 # Broad convex rolled front, still within the 462 mm flange and unchanged
 # rear bead-seat / mounting coordinates.
 barrel=barrel[:8]+[(.208,.110),(.210,.115),(.214,.119),(.219,.122),
   (.224,.122),(.228,.120),(.230,.117),(.231,.114),(.231,.110),
   (.228,.107),(.222,.105),(.2159,.103)] if style=='steel' else barrel[:8]+[(.2056,.109),(.208,.114),(.212,.118),(.217,.121),
   (.222,.122),(.226,.1208),(.229,.118),(.231,.114),(.231,.110),(.228,.107),(.222,.105),(.2159,.103)]
# Inner return wall closes the barrel; bead-seat spacing equals the catalogue width.
barrel += [(.213,.101),(.201,.063),(.203,-.068),(.213,-.101),barrel[0]]
barrel_obj=lathe('Rolled lip and hollow barrel',barrel)
# Separate inner-return finish makes the hollow barrel legible behind the face.
barrel_obj.data.materials.append(materials['barrel'])
barrel_obj.data.materials.append(materials['lip'])
for poly in barrel_obj.data.polygons:
 j=poly.index%(len(barrel)-1)
 if j>=len(barrel)-6:poly.material_index=1
 elif style=='window' and 8<=j<=16:poly.material_index=2
if style=='disc':bevel(barrel_obj,.0005,segments=2,zone='edge_catch')
if style=='disc':
 # KM720 5x150: raised centre cone, two concentric steps and outer vent band.
 front=[(.20*R,.103),(.088,.094),(.096,.094),(.112,.094),(.117,.107),(.144,.107),(.149,.119),(.155,.119),(.158,.103),(.190,.103),(.196,.119),(.212,.119)]
elif style=='steel':
 # Five-fold pressed mounting pad, integrated with the shell rather than
 # overlaid on a circular plateau. The actual rear mount bore stays 110.1 mm.
 def steel_profile(theta):
  # A few millimetres of fivefold pressing, subordinate to the circular dish.
  pad=.092+.003*math.cos(5*(theta-math.pi/2))
  return [(.27*R,.092),(.065,.095),(pad-.009,.095),(pad-.004,.0945),
          (pad+.001,.0935),(pad+.006,.0925),(pad+.010,.092),(.114,.096),(.120,.103),(.134,.116),
          (.138,.118),(.143,.116),(.147,.113),(.151,.1105),(.155,.109),
          (.184,.109),(.187,.113),(.190,.117),(.193,.118),(.195,.116),
          (.197,.112),(.199,.111),(.201,.115),(.204,.119),
          (.206,.118),(.208,.114)]
 front=steel_profile(math.pi/2)

else:
 # Rebuild the visible casting from the owner's outer-lip-normalized layout.
 # All front surfaces clear the unchanged .083 m rotor-hat front plane.
 front=[(.13*R,.110),(.14*R,.113),(.29*R,.113),(.31*R,.111),(.325*R,.104),
        (.34*R,.096),(.49*R,.096),(.57*R,.105),(.66*R,.119),(.74*R,.125),
        (.845*R,.125),(.852*R,.124),(.86*R,.122),(.867*R,.116),
        (.878*R,.116),(.883*R,.118),(.89*R,.124),(.94*R,.128),(.97*R,.124)]
if style=='window':
 # The smaller cosmetic cap does not shrink the actual rear mounting bore.
 profile=front+[(r,z-.012) for r,z in reversed(front) if r>=BORE/2]
 profile += [(BORE/2,.085),(BORE/2,.091),(.13*R,.098)]
elif style=='disc':
 profile=front+[(r,z-.007) for r,z in reversed(front) if r>=BORE/2]
 profile += [(BORE/2,.073),(BORE/2,.081),(.20*R,.096)]
else:
 profile=front+[(r,z-.007) for r,z in reversed(front)]
if style=='steel':
 profiles=[]
 for i in range(80):
  q=steel_profile(2*math.pi*i/80)
  profiles.append(q+[(r,z-.007) for r,z in reversed(q)]+[(BORE/2,.078),(BORE/2,.086),(.27*R,.090)])
 k=len(profiles[0]);vs=[(r*math.cos(2*math.pi*i/80),r*math.sin(2*math.pi*i/80),z) for i,q in enumerate(profiles) for r,z in q]
 fs=[tuple(reversed((i*k+j,((i+1)%80)*k+j,((i+1)%80)*k+(j+1)%k,i*k+(j+1)%k))) for i in range(80) for j in range(k)]
 face=mesh('Pentagonal pressed stud pad and face',vs,fs)
else:
 face=lathe('Reference wheel face',profile,closed=True)
if style=='window':
 face.data.materials.append(materials['bead_groove'])
 face.data.materials.append(materials['groove_shoulder'])
 face.data.materials.append(materials['lip'])
 for p in face.data.polygons:
  r=sum(math.hypot(face.data.vertices[i].co.x,face.data.vertices[i].co.y) for i in p.vertices)/len(p.vertices)
  if .86*R<=r<=.88*R:p.material_index=1
  elif .84*R<=r<.86*R:p.material_index=2
  elif r>=.89*R:p.material_index=3
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
def rounded_window(ri,ro,inner,outer,corner=.014):
 ai,ao=math.radians(inner/2),math.radians(outer/2)
 def polar(r,a):return (r*math.cos(a),r*math.sin(a))
 v=[polar(ro,-ao),polar(ro,ao),polar(ri,ai),polar(ri,-ai)]
 lengths=[2*ro*ao,math.dist(v[1],v[2]),2*ri*ai,math.dist(v[3],v[0])]
 def at(edge,t):
  if edge==0:return polar(ro,-ao+2*ao*t)
  if edge==2:return polar(ri,ai-2*ai*t)
  a,b=v[edge],v[(edge+1)%4];return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
 out=[]
 for i,P in enumerate(v):
  prev=(i-1)%4;f=min(.35,corner/lengths[prev]);g=min(.35,corner/lengths[i])
  A,B=at(prev,1-f),at(i,g)
  for j in range(6):
   t=j/5;out.append(tuple((1-t)**2*A[k]+2*(1-t)*t*P[k]+t*t*B[k] for k in range(2)))
  end=1-min(.35,corner/lengths[i]);steps=5 if i in [0,2] else 1
  for j in range(1,steps):out.append(at(i,g+(end-g)*j/steps))
 return out
nut_profile=[(.0118,.081),(.0135,.083),(.015,.088),(.0175,.095),(.0195,.106)]
if style=='disc':
 for i in range(9):
  poly=[]
  # Photo-proportioned broad capsule: 22 mm radial width, 68 mm length.
  for cy,start in [(.023,0),(-.023,math.pi)]:
   for j in range(13):
    a=start+j*math.pi/12;poly.append((.174+.011*math.cos(a),cy+.011*math.sin(a)))
  polygon_cut(face,poly,2*math.pi*i/9+math.pi/2)
elif style=='steel':
 for i in range(16):
  a=2*math.pi*i/16+math.pi/2+math.pi/16
  poly=[(.169+.0135*math.cos(2*math.pi*j/24),.012*math.sin(2*math.pi*j/24)) for j in range(24)]
  vs=[(r*math.cos(a)-t*math.sin(a),r*math.sin(a)+t*math.cos(a),z) for z in [-.02,.20] for r,t in poly]
  fs=[tuple(range(23,-1,-1)),tuple(range(24,48))]+[(j,(j+1)%24,(j+1)%24+24,j+24) for j in range(24)]
  cut(face,mesh('Plain radially oval pressed hole',vs,fs,'pocket_wall'))
else:
 for i in range(10):
  short=i%2==0
  ri,ro=(.59*R,.74*R) if short else (.49*R,.74*R)
  inner,outer=(19,22) if short else (30,27)
  a=math.pi/2-math.radians(i*36)
  polygon_cut(face,rounded_window(ri,ro,inner,outer),a)
if style=='disc':
 # Counterbores sink five service nuts into the raised cone; stud centres and
 # the through mounting holes remain exactly 5x150.
 for i in range(LUGS):
  a=math.pi/2+2*math.pi*i/LUGS
  cutter=lathe('Recessed nut pocket cutter',[(0,.20),(.0195,.20)]+list(reversed(nut_profile))+[(0,.081)],'nut_pocket',32,True)
  cutter.location.x=.075*math.cos(a);cutter.location.y=.075*math.sin(a)
  cut(face,cutter)
# LC200 catalogue fit: accepted five-hole 150 mm PCD is unchanged.
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 cut(face,cyl('Lug bore cutter',.0095,.22,.075,n=12,x=x,y=y))
# Pocket walls are explicit; a small finish bevel softens their mouth edges.
bevel(face,.0014 if style=='disc' else .0015 if style=='steel' else .0006,segments=2,zone='edge_catch' if style=='disc' else None)
zlug={'disc':.081,'steel':.092,'window':.103}[style]+.008
for i in range(LUGS):
 a=2*math.pi*i/LUGS+math.pi/2;x=.075*math.cos(a);y=.075*math.sin(a)
 washer=cyl('Lug seat',.0124,.004,zlug-.006,'black' if style!='steel' else 'nut_metal',16,x,y);bevel(washer,.0006)
 nut=cyl('Five service nuts',.0085 if style=='steel' else .0100,.013,zlug,'black' if style=='window' else 'nut_metal',6,x,y);bevel(nut,.001,segments=2)
if style!='steel':
 z={'disc':.106,'window':.115}[style];cap_r=.20*R if style=='disc' else .13*R
 inner=cap_r-.002
 lathe('Centre-cap shoulder',[(inner,z-.012),(cap_r+.001,z-.012),(cap_r,z+.002),(cap_r,z+.004),(inner,z+.004)],n=40)
 cap=cyl('Flat centre cap',cap_r,.005,z+.002,'rim' if style=='disc' else 'hubcap',n=48);bevel(cap,.0007)
# Steel's bore edge is already part of the pressing: do not overlay a coplanar collar.
# Analytic lathe shading is independent of the Boolean's sparse ngon triangulation.
# These normals are exported only for newly authored rim surfaces.
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
 curve=bpy.data.curves.new(text,'FONT');curve.body=text;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=1;curve.extrude=.0012 if style=='window' else .00065;curve.bevel_depth=.00035 if style=='window' else .00020;curve.bevel_resolution=0;curve.resolution_u=2
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
  bevel(mark,.00028)
  for poly in mark.data.polygons:poly.use_smooth=False
if style=='disc':
 # Small source-reference cap inside the accepted five service nuts.
 kmc_mark(0,.008,.1115,.059,.014);label('WHEELS',0,-.012,.1117,.054,.0052)
 lathe('Cap perimeter relief',[(.042,.1105),(.0435,.112),(.045,.112),(.20*R,.1105)],n=48)
 # Tone-on-tone bead/lip step, entirely inside the accepted 462 mm flange.
 lathe('Outer bead ring step',[(.214,.117),(.216,.119),(.224,.119),(.226,.117)],n=64)
 # Centre the small mark on the flat lip land and give it cast edge relief.
 kmc_mark(0,.219,.1202,.043,.009)
elif style=='window':
 # Cast METHOD in the corrected inner flat band, not beside the lip.
 for bottom in [False,True]:
  for i,ch in enumerate('METHOD'):
   a=math.pi/2+(2.5-i)*.14+(math.pi if bottom else 0)
   label(ch,.41*R*math.cos(a),.41*R*math.sin(a),.0965,.0115,.0105,a-math.pi/2)
 label('METHOD',0,.004,.1207,.044,.0068,zone='cap_lettering')
 label('BEAD GRIP',0,-.006,.1207,.042,.0032,zone='cap_lettering')
 mountain=[(-.022,.010),(-.009,.013),(-.006,.011),(.003,.015),(.009,.011),(.017,.013),(.022,.010)]
 mark=mesh('Cast mountain cap relief',[(x,y,.1208) for x,y in mountain],[tuple(reversed(range(len(mountain))))],'cap_lettering')
 for p in mark.data.polygons:p.use_smooth=False
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
if style=='steel':
 # Flat spindle end and stepped shoulder behind the open bore, not a cover.
 nose_profile=[(0,.098),(.0025,.098),(.003,.100),(.024,.100),(.027,.0995),
       (.031,.097),(.034,.090),(.037,.087),(.058,.087),(.060,.085),(.060,.080),(0,.080)]
 nose=lathe('Exposed forged hub nose',nose_profile,'hub_metal',48,True)
 # Planar metal end/annulus must not inherit a dome's averaged boundary normal.
 for p in nose.data.polygons:
  if abs(p.normal.z)>.999:p.use_smooth=False
else:
 cyl('Metal hub nose behind the centre bore',.053,.020,.075,'hat',24)
for i in range(5):
 a=math.pi/2+2*math.pi*i/5;cyl('Hub stud',.005,.060 if style=='steel' else .036,.088 if style=='steel' else .069,'hub_metal' if style=='steel' else 'hat',8,.075*math.cos(a),.075*math.sin(a))
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
  elif zone=='rim' and abs(t.normal.z)>.65 and not (style=='steel' and r<.118):
   nearest=min(((abs(z-(z0+(z1-z0)*(r-r0)/(r1-r0))),z0+(z1-z0)*(r-r0)/(r1-r0)) for (r0,z0),(r1,z1) in zip(front,front[1:]) if r0-1e-5<=r<=r1+1e-5 and r1-r0>1e-7),default=(99,99))
   if nearest[0]<.0014:normal=surface_normal(r,math.atan2(me.vertices[vi].co.y,me.vertices[vi].co.x))
  if style=='disc' and zone=='pocket_wall' and normal.z>0:
   # A slightly broader chamfer-normal lobe catches the same studio fill on
   # the weaker lower-left walls without changing their anthracite pigment.
   normal=Vector((normal.x*.85,normal.y*.85,normal.z+.18)).normalized()
  if style=='window' and zone=='pocket_wall' and normal.z>0:
   normal=Vector((normal.x*.9,normal.y*.9,normal.z+.27)).normalized()
  disc_hub=style=='disc' and zone=='rim' and abs(z-face_depth(r))<.002 and .20*R-.00002<=r<=.11202
  if disc_hub:
   # Use the actual radial strip slope, not the Boolean ngon's polygon normal.
   # Flat bands remain flat; conical strips do not become five triangulated fans.
   tr=sum(math.hypot(me.vertices[v].co.x,me.vertices[v].co.y) for v in t.vertices)/3
   slope=next(((z1-z0)/(r1-r0) for (r0,z0),(r1,z1) in zip(front,front[1:]) if r0-1e-5<=tr<=r1+1e-5 and r1-r0>1e-7),0)
   theta=math.atan2(me.vertices[vi].co.y,me.vertices[vi].co.x)
   normal=Vector((-slope*math.cos(theta),-slope*math.sin(theta),1/WIDTH_FACTOR)).normalized()
  if style=='disc' and zone=='nut_pocket':
   v=me.vertices[vi].co
   a=min((math.pi/2+2*math.pi*i/LUGS for i in range(LUGS)),key=lambda a:math.hypot(v.x-.075*math.cos(a),v.y-.075*math.sin(a)))
   dx,dy=v.x-.075*math.cos(a),v.y-.075*math.sin(a);nr=math.hypot(dx,dy)
   slopes=[]
   for (r0,z0),(r1,z1) in zip(nut_profile,nut_profile[1:]):
    if r0-1e-5<=nr<=r1+1e-5:slopes.append(Vector((-(z1-z0),r1-r0)).normalized())
   n=sum(slopes,Vector((0,0))).normalized() if slopes else Vector((-1,0))
   normal=Vector((n.x*dx/max(nr,1e-8),n.x*dy/max(nr,1e-8),n.y/WIDTH_FACTOR)).normalized()
  if style=='steel' and zone=='hub_metal' and r<.061 and z>.090:
   if abs(t.normal.z)>.999:normal=Vector((0,0,1))
  g['normals'].extend(normal.normalized())
  ao=max(.12,min(1,sum(attr.data[li].color[:3])/3))
  # Sparse rotor vertices lie behind the face, outside the actual vent light paths.
  # Bound only new hardware AO so reflections/depth remain legible through holes.
  ao=max({'brake':.78,'caliper':.72,'backing':.62,'brake_detail':.80}.get(zone,.12),ao)
  edge=curv[vi]
  if zone=='rim' and t.normal.z>.9999 and me.vertices[vi].co.z>.09:
   ao=.98;edge=.5
  if zone in ['lettering','cap_lettering']:
   # Tiny relief must not inherit almost-black vertex AO from its own extrusion.
   # The cast bevel normals, not a brighter pigment, make the mark catch light.
   ao=max(.92,ao);edge=.5
  if zone=='pocket_wall':ao=max(.85,ao);edge=.5
  if zone=='hub_metal':ao=max(.90,ao);edge=.5
  if zone=='nut_pocket':ao=.88;edge=.5
  if style=='window' and zone=='brake':
   # Radial cast-iron shading preserves the original rotor geometry. It avoids
   # a uniform window fill while retaining the existing machining rings.
   ao=.52+.30*max(0,min(1,(r-.091)/.086));edge=.5
  if zone=='edge_catch':ao=max(.92,ao);edge=.5
  if disc_hub:ao=.97;edge=.5
  g['colors'].extend([ao,edge,0])
triangles=sum(len(g['positions'])//9 for g in groups.values())
(work/'rim-data.json').write_text(json.dumps({'style':style,'groups':groups,'triangles':triangles,'blender':bpy.app.version_string,'beadSeat_mm':431.8,'width_in':WIDTH_IN,'features':{'ventCount':9 if style=='disc' else 16 if style=='steel' else 10,'rotorDiameter_mm':354,'methodWindowRadii_mm':[.59*R*1000,.74*R*1000,.49*R*1000,.74*R*1000] if style=='window' else None,'capDiameter_mm':.40*R*1000 if style=='disc' else .26*R*1000 if style=='window' else None,'rubberFillerOuter_mm':534,'metalFlange_mm':462},'boltPattern':'5x150','centreBore_mm':BORE*1000,'bake':{'type':'Cycles AO','samples':32,'target':'CORNER color attribute','curvature':'signed dihedral vertex average'}},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(work/('rim-'+style+'.blend')))
print('RIM_TRIANGLES',style,triangles)
