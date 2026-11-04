"""Image-space gates from the fixed side pose. RGB is display-referred sRGB.
Gap paths follow the visible paint-part boundary, never a forced straight line.
"""
import json,sys,pathlib,numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion,label
w=pathlib.Path('/workspace/full-car-pass/work')/sys.argv[1]
a=np.asarray(Image.open(w/'stock-side.png').convert('RGB'))/255
m=np.asarray(Image.open(w/'stock-side-mask.png').convert('RGB')).astype(int);ids=m[:,:,0]*65536+m[:,:,1]*256+m[:,:,2]
names=json.loads((w/'stock-side-mask.json').read_text());Y=a@np.array([.2126,.7152,.0722]);out=[]
def mask(part,node):
 m=np.isin(ids,[int(k) for k,n in names.items() if n.startswith(part+':') and node in n]);labs,n=label(m);counts=np.bincount(labs.ravel());counts[0]=0;return labs==counts.argmax()
p=mask('door_FL','Front_Doors')
for edge in ['front','rear']:
 rows=[]
 for y in range(450,597):
  xx=np.flatnonzero(p[y]);
  if not len(xx):continue
  boundary=int(xx.min() if edge=='front' else xx.max());lo=max(0,boundary-4);hi=min(1600,boundary+5);x=lo+int(Y[y,lo:hi].argmin());rgb=a[y,x];dark=Y[y,lo:hi]<=85/255
  rows.append({'xy':[x,y],'boundary':boundary,'luma':float(Y[y,x]),'rgb':np.rint(rgb*255).astype(int).tolist(),'darkWidth':int(dark.sum())})
 good=sum(42/255<=r['luma']<=85/255 for r in rows)
 out.append({'id':'S1-'+edge,'rows':rows,'rowsInTarget':good,'totalRows':len(rows),'widthMedian':float(np.median([r['darkWidth'] for r in rows])),'threshold':'1–2 pixels; neutral 42..85; uninterrupted','passed':all(1<=r['darkWidth']<=2 and 42/255<=r['luma']<=85/255 and max(r['rgb'])-min(r['rgb'])<=5 for r in rows)})
for wheel in ['wheel_FL','wheel_RL']:
 tyre=mask(wheel,'tire');yy,xx=np.where(tyre)
 if not len(xx):continue
 cx=(xx.min()+xx.max())/2;cy=(yy.min()+yy.max())/2;rx=(xx.max()-xx.min())/2;ry=(yy.max()-yy.min())/2
 gy,gx=np.indices(Y.shape);r=np.sqrt(((gx-cx)/rx)**2+((gy-cy)/ry)**2);sidewall=binary_erosion(tyre,iterations=2)&(r>.72)&(r<.91)
 out.append({'id':'W2','wheel':wheel,'view':'side','ellipse':[cx,cy,rx,ry],'annulus':[.72,.91],'pixels':int(sidewall.sum()),'mean':float(Y[sidewall].mean()),'threshold':42/255,'passed':bool(Y[sidewall].mean()>=42/255)})
 bottom=int(yy.max());x0=int(cx-rx*.2);x1=int(cx+rx*.2);row=Y[bottom+1,x0:x1];floor=Y[bottom+1,80:130].mean();value=1-row.mean()/floor
 out.append({'id':'B1','wheel':wheel,'view':'side','sample':[x0,bottom+1,x1,bottom+2],'floorSample':[80,bottom+1,130,bottom+2],'contactLuma':float(row.mean()),'floorLuma':float(floor),'darkening':float(value),'threshold':.40,'passed':bool(value>=.40)})
(w/'edge-contact-metrics.json').write_text(json.dumps(out,indent=2)+'\n')
for r in out:print({k:v for k,v in r.items() if k!='rows'})
