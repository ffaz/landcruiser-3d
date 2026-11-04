from PIL import Image
import numpy as np,json,pathlib,sys
from scipy.ndimage import binary_erosion
w=pathlib.Path('/workspace/full-car-pass/work')/sys.argv[1]
def read(v,interior=False):
 suffix='-interior-mask' if interior else '-mask'
 a=np.asarray(Image.open(w/('stock-'+v+'.png')).convert('RGB'))/255;rgb=np.asarray(Image.open(w/('stock-'+v+suffix+'.png')).convert('RGB')).astype(int);ids=rgb[:,:,0]*65536+rgb[:,:,1]*256+rgb[:,:,2];lookup=json.loads((w/('stock-'+v+suffix+'.json')).read_text());return a,ids,lookup
out=[]
def calc(id,v,pred):
 a,ids,names=read(v,id in ['F2','R2','R3-amber']);ks=[int(k) for k,n in names.items() if pred(n)];m=binary_erosion(np.isin(ids,ks),iterations=1);pixels=a[m]
 if not len(pixels):return
 lum=pixels@np.array([.2126,.7152,.0722]);mx=pixels.max(1);mn=pixels.min(1);d=mx-mn;h=np.zeros(len(pixels));r,g,b=pixels.T
 for channel,expr in [(0,(g-b)/np.maximum(d,1e-9)%6),(1,(b-r)/np.maximum(d,1e-9)+2),(2,(r-g)/np.maximum(d,1e-9)+4)]:
  q=(pixels.argmax(1)==channel)&(d>1e-5);h[q]=60*expr[q]
 sat=d/np.maximum(mx,1e-9);q=sat>.25
 row={'id':id,'view':v,'nodes':[names[str(k)] for k in ks],'pixels':len(pixels),'mean':float(lum.mean()),'range':float(lum.max()-lum.min()),'p05':float(np.quantile(lum,.05)),'p95':float(np.quantile(lum,.95)),'hueMedian':float(np.median(np.where(h[q]>180,h[q]-360,h[q]))) if q.any() else None,'satMedian':float(np.median(sat)),'highlightFraction':float(((sat<.25)&(lum>.5)).mean())};out.append(row)
for id,v,part,node in [('F1','headlamp','lamp_front_L:','chrome'),('F2','headlamp','lamp_front_L:','orangeglass'),('R2','tail-lamp','lamp_rear_L_finish4b:','redglass_25_3'),('R2-lens','tail-lamp','lamp_rear_L_finish4b:','redglass_25_1'),('R3-clear','tail-lamp','lamp_rear_L_finish4b:','clearglass'),('R3-reflector','tail-lamp','lamp_rear_L_finish4b:','chrome'),('R3-amber','tail-lamp','lamp_rear_L_finish4b:','orangeglass'),('T1-side','side','side_step_L:','chrome'),('T1-fq','fq','roof_rails:','chrome'),('R6','rear','badge_grade_GXR_finish4b:',''),('W3','side','wheel_FL:','rim')]:
 try:calc(id,v,lambda s:s.startswith(part) and node in s)
 except FileNotFoundError:pass
# Paint profile, sampled within the front door, excluding the handles, trim and boundary pixels.
a,ids,names=read('side');L=a@np.array([.2126,.7152,.0722]);x0,x1=640,735;profile=np.median(L[435:600,x0:x1],axis=1);steps=[]
for lo,hi in [(447,500),(530,600)]:
 yy=np.arange(lo,hi);best=max(((float(abs(profile[j-435]-profile[i-435])),int(i),int(j)) for i in yy for j in yy if 0<j-i<=40),default=(0,0,0));steps.append({'region':[x0,lo,x1,hi],'step':best[0],'rows':best[1:]})
out.append({'id':'P1','view':'side','steps':steps,'threshold':.08,'passed':all(v['step']>=.08 for v in steps)})
(w/'detail-metrics.json').write_text(json.dumps(out,indent=2)+'\n')
for r in out:print(r['id'], {k:round(v,3) if isinstance(v,float) else v for k,v in r.items() if k not in ['nodes','id','view','pixels']})
