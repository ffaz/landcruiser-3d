from PIL import Image
import numpy as np,json
from scipy.ndimage import label
from pathlib import Path
out={}
for name,cx,cy,r in [('kmc-front-retailer',400,400,389),('method-front',500,478,473)]:
 a=np.asarray(Image.open('/workspace/full-car-pass/refs/'+name+'.png').convert('RGB'));y,x=np.indices(a.shape[:2]);radius=np.hypot(x-cx,y-cy);m=(a.min(2)>225)&(radius<r*.88)&(radius>r*.4);labels,n=label(m);rows=[]
 for i in range(1,n+1):
  yy,xx=np.where(labels==i)
  if len(xx)<1000:continue
  ang=np.arctan2(yy.mean()-cy,xx.mean()-cx);rad=(xx-cx)*np.cos(ang)+(yy-cy)*np.sin(ang);t=-(xx-cx)*np.sin(ang)+(yy-cy)*np.cos(ang)
  rows.append(dict(pixels=len(xx),angle_deg=float(np.degrees(ang)),radius_min=float(rad.min()/r),radius_max=float(rad.max()/r),tangent_width=float((t.max()-t.min())/r),centre=[float(xx.mean()),float(yy.mean())]))
 out[name]=dict(imageCentre=[cx,cy],imageRadius=r,holes=rows,count=len(rows))
Path('/workspace/full-car-pass/reference-measurements.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
