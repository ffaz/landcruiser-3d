# Offline only. Usage: python SCRIPT WORKDIR
import sys
import json,numpy as np
from pathlib import Path
from scipy.ndimage import distance_transform_edt,label
from shapely.geometry import box,Polygon,Point
from shapely.ops import unary_union,triangulate
w=Path(sys.argv[1]);d=json.load(open(w/'gap-grid.json'));s=d['step'];a=np.array([[bool(c and c['x']<2 and c['part']=='body_shell' and 'cabin' in c['node'].lower())for c in row] for row in d['rows']]);labs,n=label(a)
polys=[]
for k in range(1,n+1):
 j,i=np.where(labs==k)
 print(k,len(i),'bounds',d['y0']+j.min()*s,d['y0']+j.max()*s,d['z0']+i.min()*s,d['z0']+i.max()*s)
 if len(i)>30:polys.extend(box(d['z0']+ii*s-s/2,d['y0']+jj*s-s/2,d['z0']+ii*s+s/2,d['y0']+jj*s+s/2)for jj,ii in zip(j,i))
p=unary_union(polys).buffer(.010,join_style='round').simplify(.0004,preserve_topology=True)
# The lowest sampled run continues below .995; restrict to the seam band above the bumper/tailgate edge.
p=p.intersection(box(.49,.985,.78,1.079))
polygons=[p] if p.geom_type=='Polygon' else list(p.geoms)
x=np.array([[c['x'] if c and c['x']>2 else np.nan for c in row]for row in d['rows']]);missing=np.isnan(x);nearest=distance_transform_edt(missing,return_distances=False,return_indices=True);filled=x[tuple(nearest)]
coords=[];indices=[];lookup={}
def vertex(z,y):
 key=(round(z,7),round(y,7))
 if key in lookup:return lookup[key]
 j=int(np.clip(round((y-d['y0'])/s),0,d['ny']-1));i=int(np.clip(round((z-d['z0'])/s),0,d['nz']-1));xx=min(2.270,float(filled[j,i])-.003)
 lookup[key]=len(coords);coords.append([xx,y,z]);return len(coords)-1
for poly in polygons:
 for tri in triangulate(poly):
  if not poly.covers(tri.representative_point()):continue
  vv=list(tri.exterior.coords)[:3];indices.extend(vertex(z,y)for z,y in vv)
# Thin closed 0.8 mm panel. Its exposed front follows the local exterior envelope, set back at least 12 mm.
front=len(coords);coords+= [[x-.0008,y,z]for x,y,z in coords]
back=[i+front for i in indices];indices+=sum(([back[i+2],back[i+1],back[i]]for i in range(0,len(back),3)),[])
for poly in polygons:
 ring=[vertex(z,y)for z,y in list(poly.exterior.coords)[:-1]]
 for i,b in enumerate(ring):
  c=ring[(i+1)%len(ring)];indices.extend([b,c,c+front,b,c+front,b+front])
(w/'seal-data.json').write_text(json.dumps({'positions':coords,'indices':indices,'overlapMetres':.010,'thicknessMetres':.0008,'setbackMetres':.003,'outlinesZY':[list(poly.exterior.coords) for poly in polygons],'bounds':p.bounds},indent=2))
print('seal',len(coords),'vertices',len(indices)//3,'triangles',p.bounds)
