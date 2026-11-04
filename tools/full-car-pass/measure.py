"""Reproducible image measurements; unmeasured criteria remain pending, never auto-pass."""
import json,sys,pathlib,numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion
w=pathlib.Path('/workspace/full-car-pass/work');tag=sys.argv[1];out=[]
def image(view):
 a=np.asarray(Image.open(w/tag/('stock-'+view+'.png')).convert('RGB'))/255
 m=np.asarray(Image.open(w/tag/('stock-'+view+'-mask.png')).convert('RGB')).astype(int)
 ids=(m[:,:,0]<<16)+(m[:,:,1]<<8)+m[:,:,2];lookup=json.loads((w/tag/('stock-'+view+'-mask.json')).read_text());return a,ids,lookup
for view in ['side','fq','rq','rear','top']:
 try:a,ids,lookup=image(view)
 except FileNotFoundError:continue
 luma=a@np.array([.2126,.7152,.0722]);stats={}
 for label,prefix,node in [('body','door_FL:','Front_Doors'),('front_glass','door_FL:','windowglass'),('rear_glass','door_RL:','windowglass'),('quarter_glass','body_shell:','windowglass'),('tailgate_glass','tailgate:','windowglass'),('sunroof','body_shell:','darkglass'),('tyre','wheel_FL:','tire'),('rim','wheel_FL:','rim')]:
  ks=[int(k) for k,v in lookup.items() if v.startswith(prefix) and node in v];mask=binary_erosion(np.isin(ids,ks),iterations=2)
  if label=='quarter_glass':
   # Body shell includes windscreen: select the rear quarter only in side/fq views.
   yy,xx=np.indices(ids.shape);mask &= xx>ids.shape[1]*.64
  yy,xx=np.where(mask)
  if len(xx)<20:continue
  vals=luma[mask];ymid=np.quantile(yy,[.20,.80]);top=mask&(np.indices(ids.shape)[0]<ymid[0]);bot=mask&(np.indices(ids.shape)[0]>ymid[1]);stats[label]={'n':len(xx),'mean':float(vals.mean()),'p05':float(np.quantile(vals,.05)),'p95':float(np.quantile(vals,.95)),'range':float(vals.max()-vals.min()),'top_mean':float(luma[top].mean()) if top.any() else None,'bottom_mean':float(luma[bot].mean()) if bot.any() else None,'bbox':[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())]}
 body=stats.get('body',{}).get('mean')
 if body:
  for k in stats:stats[k]['body_ratio']=stats[k]['mean']/body
 out.append({'view':view,'statistics':stats})
p=(w/tag/'measurements.json');p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
