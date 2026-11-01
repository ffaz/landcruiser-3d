# Offline only. Usage: python SCRIPT WORKDIR
import sys
from pathlib import Path
import json,numpy as np,triangle
from scipy.ndimage import distance_transform_edt,map_coordinates
from shapely.geometry import Point
w=Path(sys.argv[1]);old=json.load(open(w/'gap-grid.json'));new=json.load(open(w/'gap-grid-min.json'));shape=json.load(open(w/'seal-outline-initial.json'))
hole=np.array([[bool(c and c['x']<2 and c['part']=='body_shell' and 'cabin' in c['node'].lower())for c in row]for row in old['rows']]);distance=distance_transform_edt(hole)*.001
field=np.array([[c['minX']if c and c['minX'] else np.nan for c in row]for row in new['rows']]);nearest=distance_transform_edt(np.isnan(field),return_distances=False,return_indices=True);field=field[tuple(nearest)]
positions=[];indices=[];boundaries=[]
for ring in shape['outlinesZY']:
 v=np.array(ring[:-1]);segments=np.array([[i,(i+1)%len(v)]for i in range(len(v))]);m=triangle.triangulate({'vertices':v,'segments':segments},'pq20a0.000002');offset=len(positions)
 for z,y in m['vertices']:
  j=(y-new['y0'])/.001;i=(z-new['z0'])/.001;back=float(map_coordinates(field,[[j],[i]],order=1,mode='nearest')[0])-.003
  d=float(map_coordinates(distance,[[(y-old['y0'])/.001],[(z-old['z0'])/.001]],order=1,mode='constant',cval=0)[0]);t=min(d/.002,1);t=t*t*(3-2*t)
  x=(1-t)*back+t*2.255-.007
  positions.append([x,y,z])
 for tri in m['triangles']:indices.extend((tri+offset).tolist())
 boundaries.append((m['segments']+offset).tolist())
front=len(positions);positions += [[x-.0008,y,z] for x,y,z in positions];back=[i+front for i in indices];indices+=sum(([back[i+2],back[i+1],back[i]]for i in range(0,len(back),3)),[])
for segments in boundaries:
 for a,b in segments:indices.extend([a,b,b+front,a,b+front,a+front])
# Small inner return, entirely inside the existing projected gasket footprint.
# It backs the clear-film corner where oblique close-up rays bypass the main skin.
o=len(positions)
for x in [2.2042,2.205]:
 for y in [1.007,1.050]:
  for z in [.519,.570]:positions.append([x,y,z])
for a,b,c,d in [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]:indices.extend([o+a,o+b,o+c,o+a,o+c,o+d])
shape.update({'positions':positions,'indices':indices,'setbackMetres':.010,'fitting':'All existing rear-surface hits, not only the nearest front face. The main overlap sits at least 10 mm behind the innermost sampled rear surface; the opening rises to x=2.248 m over a 2 mm interior ramp. A small inner return backs the clear-film corner.'})
(w/'seal-data.json').write_text(json.dumps(shape));print('seal',front*2,'vertices',len(indices)//3,'triangles',np.min(positions,axis=0),np.max(positions,axis=0))
