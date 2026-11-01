# Offline only. Usage: python SCRIPT WORKDIR
import sys
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
p=json.load(open(Path(sys.argv[1])/'source-glyphs.json'));step=.00001;out={}
for name,key in [('R','source_4_74'),('X','source_4_79'),('V','source_4_84')]:
 v=p[key];P=np.array(v['position']).reshape(-1,3);I=np.array(v['indices']).reshape(-1,3);lo=P.min(0);hi=P.max(0)
 im=Image.new('1',(int((hi[2]-lo[2])/step)+8,int((hi[1]-lo[1])/step)+8));d=ImageDraw.Draw(im)
 xy=np.c_[(hi[2]-P[:,2])/step+3,(hi[1]-P[:,1])/step+3]
 for tri in I:d.polygon([tuple(xy[t]) for t in tri],fill=1)
 im.save(str(Path(sys.argv[1])/('glyph-'+name+'.png')));a=np.array(im);rows={}
 for t in [.15,.25,.35,.5,.65,.75,.85]:
  line=a[int((1-t)*(hi[1]-lo[1])/step)+3];ii=np.flatnonzero(line);runs=np.split(ii,np.where(np.diff(ii)>1)[0]+1);rows[t]=[(round(r[0]*step*1000,3),round((r[-1]+1)*step*1000,3)) for r in runs if len(r)]
 # least-squares mounting-plane residual is source local relief, not total x bbox on curved panel.
 A=np.c_[P[:,1],P[:,2],np.ones(len(P))];abc=np.linalg.lstsq(A,P[:,0],rcond=None)[0];depth=P[:,0]-A@abc
 out[name]={'node':key,'bounds':{'min':lo.tolist(),'max':hi.tolist()},'heightMm':(hi[1]-lo[1])*1000,'reliefMm':np.ptp(depth)*1000,'plane':abc.tolist(),'slicesMm':rows}
print(json.dumps(out,indent=2));Path(str(Path(sys.argv[1])/'glyph-measurements-initial.json')).write_text(json.dumps(out,indent=2)+'\n')
