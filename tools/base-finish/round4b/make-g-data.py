# Offline only. Usage: python SCRIPT WORKDIR
import sys
import json,numpy as np
from pathlib import Path
from scipy.spatial import Delaunay
from shapely.geometry import LineString,Point,Polygon
from shapely.affinity import scale,translate
p=json.load(open(str(Path(sys.argv[1])/'glyph-measurements-initial.json')));w=Path(sys.argv[1]);width=p['V']['bounds']['max'][2]-p['V']['bounds']['min'][2];height=p['R']['heightMm']/1000;stroke=.0102
outline=[(.96,.78),(.86,.94),(.73,1),(.23,1),(.05,.82),(0,.20),(.13,.04),(.27,0),(.78,0),(.96,.18),(1,.56),(.53,.56),(.51,.40),(.79,.40),(.77,.24),(.69,.18),(.30,.18),(.233716,.26),(.273216,.75),(.37,.82),(.68,.82),(.73,.76),(.75,.70)]
poly=Polygon([(u*width,v*height) for u,v in outline])
lo=poly.bounds;poly=translate(poly,-lo[0],-lo[1]);poly=scale(poly,xfact=width/(lo[2]-lo[0]),yfact=height/(lo[3]-lo[1]),origin=(0,0))
import triangle
bevel=.00196;depth=p['R']['reliefMm']/1000
inner=poly.buffer(-bevel,join_style='mitre');rings=[list(poly.exterior.coords)[:-1]]
for q in ([inner] if inner.geom_type=='Polygon' else inner.geoms):
 rings.append(list(q.exterior.coords)[:-1])
boundary=[];segments=[]
for ring in rings:
 start=len(boundary);boundary.extend(ring);segments.extend([[start+i,start+(i+1)%len(ring)] for i in range(len(ring))])
result=triangle.triangulate({'vertices':np.array(boundary),'segments':np.array(segments)},'pq20a0.0000004');pts=result['vertices'];tri=result['triangles'];dist=np.array([poly.boundary.distance(Point(x,y)) for x,y in pts]);h=depth*np.minimum(dist/bevel,1)
# Analytic bevel normals keep the flat cap planar under long chrome highlights.
eps=.000001;grad=[]
def signed_distance(x,y):
 q=Point(x,y);d=poly.boundary.distance(q);return d if poly.covers(q) else -d
for (x,y),d in zip(pts,dist):
 if d>=bevel-1e-9:grad.append([0.,0.]);continue
 du=(signed_distance(x+eps,y)-signed_distance(x-eps,y))/(2*eps)
 dv=(signed_distance(x,y+eps)-signed_distance(x,y-eps))/(2*eps)
 grad.append([depth/bevel*du,depth/bevel*dv])
(w/'g-data.json').write_text(json.dumps({'uv':pts.tolist(),'indices':tri.reshape(-1).tolist(),'frontHeight':h.tolist(),'frontGradientUV':grad,'width':width,'height':height,'baseline':p['R']['bounds']['min'][1],'maxZ':p['V']['bounds']['max'][2],'relief':depth,'bevel':bevel,'nominalStroke':stroke}))
print('new G',len(pts),len(tri),'front triangles')
