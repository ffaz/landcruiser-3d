# Offline only. Usage: python SCRIPT WORKDIR
import sys
import numpy as np,json
from pathlib import Path
from PIL import Image,ImageDraw
w=Path(sys.argv[1]);p=json.load(open(Path(sys.argv[1])/'source-glyphs.json'));out={};step=.00001
for name,key in [('R','source_4_74'),('X','source_4_79'),('G',None)]:
 if key:P=np.array(p[key]['position']).reshape(-1,3);I=np.array(p[key]['indices']).reshape(-1,3)
 else:
  g=json.load(open(w/'g-data.json'));uv=np.array(g['uv']);P=np.c_[np.array(g['frontHeight']),uv[:,1]+g['baseline'],g['maxZ']-uv[:,0]];I=np.array(g['indices']).reshape(-1,3)
 lo=P.min(0);hi=P.max(0);xy=np.c_[(hi[2]-P[:,2])/step+3,(hi[1]-P[:,1])/step+3];T=P[I];C=np.cross(T[:,1]-T[:,0],T[:,2]-T[:,0]);N=C/np.maximum(np.linalg.norm(C,axis=1)[:,None],1e-20)
 if key:plane=np.linalg.lstsq(np.c_[P[:,1],P[:,2],np.ones(len(P))],P[:,0],rcond=None)[0];mount=np.array([1,-plane[0],-plane[1]]);mount/=np.linalg.norm(mount)
 else:mount=np.array([1,0,0])
 masks={}
 for label,sel in [('full',np.ones(len(I),bool)),('cap',N@mount>.995)]:
  im=Image.new('1',(int((hi[2]-lo[2])/step)+8,int((hi[1]-lo[1])/step)+8));d=ImageDraw.Draw(im)
  for tri in I[sel]:d.polygon([tuple(xy[t])for t in tri],fill=1)
  masks[label]=np.array(im);im.save(w/('measured-'+name+'-'+label+'.png'))
 H=(hi[1]-lo[1])*1000;measures={};raw={}
 for label,a in masks.items():
  traces=[]
  regions=[np.linspace(.12,.24,18),np.linspace(.77,.89,18)]if name=='X'else[np.linspace(.60,.72,18)]
  for region in regions:
   arms=[[],[]]if name=='X'else[[]]
   for t in region:
    line=a[int((1-t)*H/.01)+3];ii=np.flatnonzero(line);runs=[r for r in np.split(ii,np.where(np.diff(ii)>1)[0]+1)if len(r)]
    if(name=='X' and len(runs)!=2)or not runs:continue
    for k in range(len(arms)):
     run=runs[k];arms[k].append([t*H,run.mean()*.01,len(run)*.01])
   for arm in arms:
    if len(arm)<3:continue
    v=np.array(arm);slope=np.polyfit(v[:,0],v[:,1],1)[0];traces.append(float(np.median(v[:,2])/np.sqrt(1+slope*slope)))
  measures[label]=float(np.median(traces));raw[label]=traces
 relief=g['relief']*1000 if not key else np.ptp(P[:,0]-np.c_[P[:,1],P[:,2],np.ones(len(P))]@plane)*1000
 out[name]={'fullStemMedianMm':measures['full'],'frontFaceStemMedianMm':measures['cap'],'bevelInsetMeanMm':(measures['full']-measures['cap'])/2,'capHeightMm':H,'baselineMm':lo[1]*1000,'reliefMm':float(relief),'individualArms':raw}
out['method']='10 micrometre silhouette raster. X: median of four arm widths normal to fitted centreline at 12–24% and 77–89% cap height. R/G: left stem at 60–72%. Front cap: triangles within arccos(.995) of the mounting normal. Bevel inset = (full-stem width minus flat-cap width)/2; source facets vary by arm.'
out['GvsRStemPercent']=(out['G']['fullStemMedianMm']/out['R']['fullStemMedianMm']-1)*100;out['GvsXStemPercent']=(out['G']['fullStemMedianMm']/out['X']['fullStemMedianMm']-1)*100
(w/'glyph-numbers.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
