"""KM720 construction from its radial section, independent of the other rims.

The broad lands are dishes, separated by small cast steps; they are not tori
laid onto a disc. Apertures have explicit, identical mouth/wall/throat loops.
Dimensions are metres in the existing wheel's local mounting coordinates.
"""
import math
import bpy
from mathutils import Vector

R=.231
LUG_PHASE=-math.pi/2 # One nut at six o'clock, two across the top.
# The broad middle annulus slopes inward toward the lug circle. Only its ends
# have small fillets: it is not a flat disc around a rounded central bowl.
INNER=[(.048,.0845),(.050,.084),(.052,.081),(.055,.075),
       (.057,.071),(.060,.070),(.074,.070),(.0755,.071),
       (.077,.076),(.0795,.0825),(.080,.0833),(.110,.110),
       # Green ring 4, Level 2: taper starts at its inner edge.
       (.1115,.1121),(.112,.1124),(.134,.1124),
       # Thin groove between rings 4 and 3, not another broad channel.
       (.1343,.1122),(.1347,.1103),(.1351,.1100),
       (.1389,.1100),(.1393,.1103),(.1397,.1122),
       # Purple ring 3, coplanar with green ring 4 and pink ring 2.
       (.140,.1124),(.160,.1124),(.1603,.1121),
       (.1612,.0946),(.1615,.094)]
# Vent band at Level 3 rises to a flat pink Level-2 ring, then a separate
# red Level-1 ring and a thin Level-0 lip. No extra trough outside the vents.
OUTER=[(.186,.094),(.1864,.0945),(.1875,.1117),
       (.188,.1124),(.202,.1124),
       (.2024,.1127),(.2105,.1167),(.211,.117),(.224,.117),
       (.2244,.1173),(.228,.1198),(.2285,.1201),(.2305,.1201),
       (.231,.1196)]
N=128


def _normal_attribute(obj,fn):
    """Keep section normals independent of long Boolean triangle diagonals."""
    a=obj.data.attributes.get('kmc_normal') or obj.data.attributes.new('kmc_normal','FLOAT_VECTOR','CORNER')
    for p in obj.data.polygons:
        for li in p.loop_indices:
            v=obj.data.vertices[obj.data.loops[li].vertex_index].co
            a.data[li].vector=fn(v,p)


def _section_normal(profile,r,theta,scale):
    slopes=[]
    for (r0,z0),(r1,z1) in zip(profile,profile[1:]):
        if r0-2e-5<=r<=r1+2e-5 and r1-r0>1e-8:
            slopes.append(Vector((-(z1-z0)*scale,r1-r0)).normalized())
    n=sum(slopes,Vector((0,0))).normalized() if slopes else Vector((0,1))
    return Vector((n.x*math.cos(theta),n.x*math.sin(theta),n.y))


def _lathe(c,name,front,back,zone='rim',n=N):
    obj=c['lathe'](name,front+back,zone,n,True)
    # Author each exposed strip's true section normal, with soft small fillets
    # and planar wide lands. The rear skin is not given front-facing normals.
    def normal(v,p):
        r=math.hypot(v.x,v.y);z=v.z/c['WIDTH_FACTOR']
        nearest=min((abs(z-(z0+(z1-z0)*(r-r0)/(r1-r0))) for (r0,z0),(r1,z1) in zip(front,front[1:]) if r0-2e-5<=r<=r1+2e-5 and r1-r0>1e-8),default=99)
        if nearest>.00015 or p.normal.z<0:return p.normal
        tr=sum(math.hypot(obj.data.vertices[i].co.x,obj.data.vertices[i].co.y) for i in p.vertices)/len(p.vertices)
        strip=next(((r0,z0,r1,z1) for (r0,z0),(r1,z1) in zip(front,front[1:]) if r0-1e-6<=tr<=r1+1e-6),None)
        if strip and strip[2]-strip[0]>.004:
            slope=(strip[3]-strip[1])/(strip[2]-strip[0])*c['WIDTH_FACTOR'];t=math.atan2(v.y,v.x)
            return Vector((-slope*math.cos(t),-slope*math.sin(t),1)).normalized()
        return _section_normal(front,r,math.atan2(v.y,v.x),c['WIDTH_FACTOR'])
    _normal_attribute(obj,normal)
    if name in ['KMC recessed dish and fine circular steps','KMC slot shoulder channel and broad matte flange']:
        obj.data.materials.append(c['materials']['edge_catch'])
        bands=[(.1115,.112),(.134,.1343),(.1397,.140),(.160,.1603),
               (.1875,.188),(.202,.2024),(.2105,.211),(.224,.2244),
               (.228,.2285),(.2305,.231)]
        for p in obj.data.polygons:
            rr=sum(math.hypot(obj.data.vertices[i].co.x,obj.data.vertices[i].co.y) for i in p.vertices)/len(p.vertices)
            zz=sum(obj.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)/c['WIDTH_FACTOR']
            if p.normal.z>0 and zz>.10 and any(a<rr<b for a,b in bands):p.material_index=len(obj.data.materials)-1
    return obj


def _capsule_ray(theta):
    # Capsule centred on r=174 mm, 65.5 mm long, 18.5 mm across. Return the
    # two intersections of a radial ray with its exact straight/round outline.
    cs,sn=math.cos(theta),math.sin(theta);hits=[]
    for x in [.16475,.18325]:
        rr=x/cs
        if abs(rr*sn)<=.0235+1e-8:hits.append(rr)
    for y in [-.0235,.0235]:
        dot=.174*cs+y*sn;disc=dot*dot-(.174**2+y*y-.00925**2)
        if disc>=-1e-10:
            for rr in [dot-math.sqrt(max(0,disc)),dot+math.sqrt(max(0,disc))]:
                yy=rr*sn
                if (y>0 and yy>=y-1e-8) or (y<0 and yy<=y+1e-8):hits.append(rr)
    return min(hits),max(hits)


def _aperture_band(c):
    limit=math.atan2(.0235,.174)+math.asin(.00925/math.hypot(.174,.0235))
    angles=[-math.pi/9,-.27,-.23,-.205]+[-limit+2*limit*i/20 for i in range(21)]+[.205,.23,.27,math.pi/9]
    # Lower and upper land independently meet the two capsule boundaries.
    vs=[];fs=[]
    for slot in range(9):
        a=math.pi/2+slot*2*math.pi/9;start=len(vs)
        def pos(r,t,z):return (r*math.cos(a+t),r*math.sin(a+t),z)
        for t in angles:
            ri,ro=_capsule_ray(t) if abs(t)<=limit+1e-8 else (.174,.174)
            vs.extend([pos(r,t,.094) for r in [.1615,ri,ro,.186]])
        for i in range(len(angles)-1):
            k=start+4*i;l=k+4
            fs.extend([(k,l,l+1,k+1),(k+2,l+2,l+3,k+3)])
            if abs((angles[i]+angles[i+1])/2)>limit:
                fs.append((k+1,l+1,l+2,k+2))
        ts=[-limit+2*limit*i/20 for i in range(21)]
        inner=[(_capsule_ray(t)[0]*math.cos(t),_capsule_ray(t)[0]*math.sin(t)) for t in ts]
        outer=[(_capsule_ray(t)[1]*math.cos(t),_capsule_ray(t)[1]*math.sin(t)) for t in ts]
        outline=inner+list(reversed(outer[1:-1]))
        if sum(outline[i][0]*outline[(i+1)%len(outline)][1]-outline[(i+1)%len(outline)][0]*outline[i][1] for i in range(len(outline)))<0:outline.reverse()
        rings=[]
        # The actual wall is 5 mm deep, with a small rounded mouth and a
        # straight dark return. Its clear aperture is not a painted inset.
        for frac,z in [(0,.094),(.12,.0935),(1,.089),(1,.086)]:
            ring=[]
            for x,y in outline:
                x=.174+(x-.174)*(1-frac*1.1/9.25);y=y*(1-frac*.8/32.75)
                ring.append((x*math.cos(a)-y*math.sin(a),x*math.sin(a)+y*math.cos(a),z))
            rings.append(ring)
        k=len(outline);wallvs=[p for ring in rings for p in ring];wallfs=[]
        for j in range(3):
            for i in range(k):wallfs.append((j*k+i,j*k+(i+1)%k,(j+1)*k+(i+1)%k,(j+1)*k+i))
        wall=c['mesh']('KMC identical chamfer and throat '+str(slot+1),wallvs,wallfs,'pocket_wall')
        # Smooth around the capsule, but keep the depth bands separate.
        normals={}
        for poly in wall.data.polygons:
            for vi in poly.vertices:normals[vi]=normals.get(vi,Vector())+poly.normal
        _normal_attribute(wall,lambda v,p: normals[min(p.vertices,key=lambda j:(wall.data.vertices[j].co-v).length)].normalized())
    fs=[tuple(reversed(f)) for f in fs]
    land=c['mesh']('KMC cast aperture land',vs,fs)
    _normal_attribute(land,lambda v,p:Vector((0,0,1)))
    # A rear skin has the same open cutouts. Reverse its triangles and normals.
    rear=c['mesh']('KMC aperture land rear',[(x,y,.086) for x,y,z in vs],[tuple(reversed(f)) for f in fs])
    _normal_attribute(rear,lambda v,p:Vector((0,0,-1)))


def build_face(c):
    # Barrel and bead seats retain the locked width/diameter. The exposed front
    # flange is constructed once, as part of OUTER, without overlapping shells.
    barrel=[(.2159,-.103),(.226,-.108),(.231,-.104),(.231,-.098),
            (.222,-.094),(.214,-.090),(.207,-.068),(.205,.065),
            (.207,.101),(.222,.105),(.231,.110),(.231,.114),
            (.228,.111),(.220,.104),(.213,.101),(.201,.063),
            (.203,-.068),(.213,-.101)]
    shell=c['lathe']('KMC hollow barrel and locked bead seats',barrel,'barrel',96,True)
    face=_lathe(c,'KMC recessed dish and fine circular steps',INNER,[(.1615,.086),(.125,.104),(.080,.068),(.060,.062),(.05505,.062),(.05505,.067),(.048,.0675)])
    # Five shallow cast seats, not oversized black craters. Nuts remain exactly
    # 75 mm from the wheel axis, whatever the hub/cap shape.
    pocket=[(.0095,.064),(.0105,.0685),(.012,.070),(.014,.072)]
    for i in range(5):
        a=LUG_PHASE+2*math.pi*i/5
        cutter=c['lathe']('KMC shallow nut seat cutter',[(0,.20),(.014,.20)]+list(reversed(pocket))+[(0,.064)],'nut_pocket',32,True)
        cutter.location.x=.075*math.cos(a);cutter.location.y=.075*math.sin(a);c['cut'](face,cutter)
        c['cut'](face,c['cyl']('KMC 5x150 through stud bore',.0095,.22,.075,'nut_pocket',16,.075*math.cos(a),.075*math.sin(a)))
    # Restore section normals after the Boolean changes its corner attributes.
    def normal(v,p):
        r=math.hypot(v.x,v.y);z=v.z/c['WIDTH_FACTOR'];theta=math.atan2(v.y,v.x)
        if face.data.materials[p.material_index].name=='nut_pocket':
            a=min((LUG_PHASE+2*math.pi*i/5 for i in range(5)),key=lambda a:math.hypot(v.x-.075*math.cos(a),v.y-.075*math.sin(a)))
            dx,dy=v.x-.075*math.cos(a),v.y-.075*math.sin(a);nr=math.hypot(dx,dy)
            return Vector((-dx,-dy,0)).normalized() if nr<.0106 else _section_normal(pocket,nr,math.atan2(dy,dx),c['WIDTH_FACTOR'])
        if p.normal.z<=.05:return p.normal
        nearest=min((abs(z-(z0+(z1-z0)*(r-r0)/(r1-r0))) for (r0,z0),(r1,z1) in zip(INNER,INNER[1:]) if r0-2e-5<=r<=r1+2e-5 and r1-r0>1e-8),default=99)
        if nearest>.00015:return p.normal
        tr=sum(math.hypot(face.data.vertices[i].co.x,face.data.vertices[i].co.y) for i in p.vertices)/len(p.vertices)
        strip=next(((r0,z0,r1,z1) for (r0,z0),(r1,z1) in zip(INNER,INNER[1:]) if r0-1e-6<=tr<=r1+1e-6),None)
        if strip and strip[2]-strip[0]>.004:
            slope=(strip[3]-strip[1])/(strip[2]-strip[0])*c['WIDTH_FACTOR']
            return Vector((-slope*math.cos(theta),-slope*math.sin(theta),1)).normalized()
        return _section_normal(INNER,r,theta,c['WIDTH_FACTOR'])
    _normal_attribute(face,normal)
    _lathe(c,'KMC slot shoulder channel and broad matte flange',OUTER,[(.231,.110),(.211,.104),(.186,.086)])
    _aperture_band(c)
    return INNER+[(.186,.094)]+OUTER[1:],face


def build_details(c):
    for i in range(5):
        a=LUG_PHASE+2*math.pi*i/5;x,y=.075*math.cos(a),.075*math.sin(a)
        # The photograph shows proud service nuts, not five dark holes.
        # Their washers sit inside the continuous circular lug basin.
        c['cyl']('KMC recessed dark nut seat',.0132,.003,.0715,'black',32,x,y)
        ring=_lathe(c,'KMC service nut seat rim',[(.010,.0725),(.0115,.0745),(.013,.0745),(.0138,.073)],[(.0138,.0705),(.010,.0705)],'nut_dark',32)
        ring.location.x=x;ring.location.y=y
        nut=c['cyl']('KMC five hexagonal service nut bases',.0112,.012,.080,'nut_dark',6,x,y)
        c['bevel'](nut,.0012,3,'nut_edge')
        crown=_lathe(c,'KMC rounded closed service nut crown',
                     [(0,.0932),(.0065,.0932),(.0075,.0930),
                      (.0085,.0925),(.0093,.0915),(.0097,.090),(.0097,.0852)],
                     [(0,.0852)],'nut_dark',32)
        crown.location.x=x;crown.location.y=y
    _lathe(c,'KMC cap skirt inside the recessed lug basin',[(.045,.0775),(.048,.0785),(.0495,.0815),(.0495,.0845),(.048,.0865)],[(.045,.0865)],n=96)
    cap=c['cyl']('KMC flat cast centre cap',.0468,.004,.0845,'rim',96)
    c['bevel'](cap,.0006,2)
    _lathe(c,'KMC fine cap perimeter relief',[(.0435,.0865),(.044,.0869),(.0446,.0869),(.0453,.0865)],[(.0453,.086),(.0435,.086)],n=96)
    c['kmc_mark'](0,.006,.0867,.060,.014)
    c['label']('WHEELS',0,-.011,.0867,.052,.0055)
    c['kmc_mark'](0,.195,.1128,.043,.009)


def shading(zone,r,z,ao,edge):
    # A coherent annular crevice field follows this rim's physical folds.
    # It avoids noisy AO interpolation across a Boolean's long diagonals;
    # the face pigment and actual light-facing normals remain unchanged.
    if zone=='rim':
        if .080<z<.1225 and .046<=r<=.2311:
            ao=.98-.25*math.exp(-((r-.0755)/.002)**2)-.30*math.exp(-((r-.137)/.002)**2)-.26*math.exp(-((r-.1615)/.0014)**2)
        edge=.5
    return ao,edge
