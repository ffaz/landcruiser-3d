"""KM720 construction from its radial section, independent of the other rims.

The broad lands are dishes, separated by small cast steps; they are not tori
laid onto a disc. Apertures have explicit, identical mouth/wall/throat loops.
Dimensions are metres in the existing wheel's local mounting coordinates.
"""
import math
import bpy
from mathutils import Vector

R=.231
# Cap seat, low nut cone, deep inner dish, two fine concentric steps.
INNER=[(.0462,.099),(.050,.0985),(.085,.087),(.088,.087),
       (.091,.088),(.094,.091),(.100,.098),(.106,.105),
       (.110,.1085),(.113,.1095),(.115,.1097),(.132,.1128),
       (.134,.1129),(.1347,.1125),(.1352,.1105),(.1362,.1105),
       (.1368,.1112),(.1376,.1117),(.139,.1118),(.158,.1150),
       (.1598,.1150),(.1606,.1144),(.1613,.1098),(.162,.106)]
# Slot band, its shoulder, narrow outer channel, broad cast flange.
OUTER=[(.187,.106),(.188,.107),(.189,.110),(.190,.113),
       (.191,.114),(.193,.1144),(.199,.115),(.2005,.1151),
       (.2013,.1146),(.202,.1122),(.203,.1115),(.2045,.1115),
       (.2055,.1122),(.207,.1155),(.208,.1185),(.209,.119),
       (.211,.1192),(.224,.1200),(.2265,.1201),(.228,.1200),
       (.2295,.1192),(.2305,.1178),(.231,.115)]
N=144


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
        bands=[(.134,.1347),(.1362,.1376),(.1598,.1606),(.189,.191),(.2005,.2013),(.2055,.207),(.228,.2305)]
        for p in obj.data.polygons:
            rr=sum(math.hypot(obj.data.vertices[i].co.x,obj.data.vertices[i].co.y) for i in p.vertices)/len(p.vertices)
            zz=sum(obj.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)/c['WIDTH_FACTOR']
            if p.normal.z>0 and zz>.10 and any(a<rr<b for a,b in bands):p.material_index=len(obj.data.materials)-1
    return obj


def _capsule_ray(theta):
    # Capsule centred on r=173 mm, 64 mm long, 18 mm across. Return the
    # two intersections of a radial ray with its exact straight/round outline.
    cs,sn=math.cos(theta),math.sin(theta);hits=[]
    for x in [.164,.182]:
        rr=x/cs
        if abs(rr*sn)<=.023+1e-8:hits.append(rr)
    for y in [-.023,.023]:
        dot=.173*cs+y*sn;disc=dot*dot-(.173**2+y*y-.009**2)
        if disc>=-1e-10:
            for rr in [dot-math.sqrt(max(0,disc)),dot+math.sqrt(max(0,disc))]:
                yy=rr*sn
                if (y>0 and yy>=y-1e-8) or (y<0 and yy<=y+1e-8):hits.append(rr)
    return min(hits),max(hits)


def _aperture_band(c):
    limit=math.atan2(.023,.173)+math.asin(.009/math.hypot(.173,.023))
    angles=[-math.pi/9,-.27,-.23,-.205]+[-limit+2*limit*i/20 for i in range(21)]+[.205,.23,.27,math.pi/9]
    # Lower and upper land independently meet the two capsule boundaries.
    vs=[];fs=[]
    for slot in range(9):
        a=math.pi/2+slot*2*math.pi/9;start=len(vs)
        def pos(r,t,z):return (r*math.cos(a+t),r*math.sin(a+t),z)
        for t in angles:
            ri,ro=_capsule_ray(t) if abs(t)<=limit+1e-8 else (.173,.173)
            vs.extend([pos(r,t,.106) for r in [.162,ri,ro,.187]])
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
        for frac,z in [(0,.106),(.12,.1055),(1,.101),(1,.098)]:
            ring=[]
            for x,y in outline:
                x=.173+(x-.173)*(1-frac*2.3/9);y=y*(1-frac*2.3/32)
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
    rear=c['mesh']('KMC aperture land rear',[(x,y,.098) for x,y,z in vs],[tuple(reversed(f)) for f in fs])
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
    face=_lathe(c,'KMC recessed dish and fine circular steps',INNER,[(.162,.098),(.110,.092),(.088,.080),(.05505,.080),(.05505,.084),(.0462,.085)])
    # Five shallow cast seats, not oversized black craters. Nuts remain exactly
    # 75 mm from the wheel axis, whatever the hub/cap shape.
    pocket=[(.0105,.0835),(.0115,.084),(.0125,.085),(.0145,.100)]
    for i in range(5):
        a=math.pi/2+2*math.pi*i/5
        cutter=c['lathe']('KMC shallow nut seat cutter',[(0,.20),(.0145,.20)]+list(reversed(pocket))+[(0,.0835)],'nut_pocket',32,True)
        cutter.location.x=.075*math.cos(a);cutter.location.y=.075*math.sin(a);c['cut'](face,cutter)
        c['cut'](face,c['cyl']('KMC 5x150 through stud bore',.0095,.22,.075,'nut_pocket',16,.075*math.cos(a),.075*math.sin(a)))
    # Restore section normals after the Boolean changes its corner attributes.
    def normal(v,p):
        r=math.hypot(v.x,v.y);z=v.z/c['WIDTH_FACTOR'];theta=math.atan2(v.y,v.x)
        if face.data.materials[p.material_index].name=='nut_pocket':
            a=min((math.pi/2+2*math.pi*i/5 for i in range(5)),key=lambda a:math.hypot(v.x-.075*math.cos(a),v.y-.075*math.sin(a)))
            dx,dy=v.x-.075*math.cos(a),v.y-.075*math.sin(a);nr=math.hypot(dx,dy)
            return Vector((-dx,-dy,0)).normalized() if nr<.0106 else _section_normal(pocket,nr,math.atan2(dy,dx),c['WIDTH_FACTOR'])
        if p.normal.z<0:return p.normal
        return _section_normal(INNER,r,theta,c['WIDTH_FACTOR'])
    _normal_attribute(face,normal)
    _lathe(c,'KMC slot shoulder channel and broad matte flange',OUTER,[(.231,.110),(.211,.104),(.187,.098)])
    _aperture_band(c)
    return INNER+[(.187,.106)]+OUTER[1:],face


def build_details(c):
    for i in range(5):
        a=math.pi/2+2*math.pi*i/5;x,y=.075*math.cos(a),.075*math.sin(a)
        c['cyl']('KMC recessed dark nut seat',.0115,.002,.0845,'black',24,x,y)
        ring=_lathe(c,'KMC service nut seat rim',[(.0101,.0888),(.0107,.0895),(.0115,.0895),(.012,.0888)],[(.012,.0875),(.0101,.0875)],'nut_edge',32)
        ring.location.x=x;ring.location.y=y
        nut=c['cyl']('KMC five hexagonal service nuts',.010,.011,.0828,'nut_dark',6,x,y)
        c['bevel'](nut,.001,2,'nut_edge')
    _lathe(c,'KMC low cap shoulder',[(.043,.096),(.0462,.097),(.047,.099),(.0462,.101)],[(.043,.101)],n=96)
    cap=c['cyl']('KMC flat cast centre cap',.0445,.004,.0995,'rim',96)
    c['bevel'](cap,.0006,2)
    _lathe(c,'KMC fine cap perimeter relief',[(.041,.1015),(.0415,.1021),(.0422,.1022),(.043,.1015)],[(.043,.101),(.041,.101)],n=96)
    c['kmc_mark'](0,.006,.102,.058,.014)
    c['label']('WHEELS',0,-.010,.102,.050,.005)
    c['kmc_mark'](0,.219,.122,.043,.009)


def shading(zone,r,z,ao,edge):
    # A coherent annular crevice field follows this rim's physical folds.
    # It avoids noisy AO interpolation across a Boolean's long diagonals;
    # the face pigment and actual light-facing normals remain unchanged.
    if zone=='rim':
        if .080<z<.1225 and .046<=r<=.2311:
            ao=.98-.25*math.exp(-((r-.088)/.006)**2)-.48*math.exp(-((r-.1357)/.0010)**2)-.28*math.exp(-((r-.162)/.0018)**2)-.40*math.exp(-((r-.2037)/.0015)**2)
        edge=.5
    return ao,edge
