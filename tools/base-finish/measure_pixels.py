"""Recompute 7x7 Lab samples from docs/base-finish/pixels.json and its full PNGs.
Requires Pillow and NumPy; does not edit any image or asset.
Usage: python tools/base-finish/measure_pixels.py [docs/base-finish]
"""
from pathlib import Path
import json,sys
import numpy as np
from PIL import Image

def lab(rgb):
 a=np.asarray(rgb,dtype=float)/255;c=np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
 xyz=c@np.array([[.4124564,.3575761,.1804375],[.2126729,.7151522,.0721750],[.0193339,.1191920,.9503041]]).T/np.array([.95047,1,1.08883]);f=np.where(xyz>(6/29)**3,np.cbrt(xyz),xyz/(3*(6/29)**2)+4/29)
 return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],axis=-1)

def sample(image,xy):
 x,y=xy;rgb=np.median(image[y-3:y+4,x-3:x+4],axis=(0,1)).astype(int);v=lab(rgb)
 return {'rgb':rgb.tolist(),'hex':'#'+''.join(f'{i:02x}' for i in rgb),'Lab':v.tolist(),'C':float(np.hypot(v[1],v[2])),'h':float(np.degrees(np.arctan2(v[2],v[1]))%360)}

if __name__=='__main__':
 root=Path(sys.argv[1] if len(sys.argv)>1 else 'docs/base-finish');data=json.loads((root/'pixels.json').read_text());out={}
 for mode,views in data['views'].items():
  out[mode]={}
  for name,row in views.items():
   im=np.array(Image.open(root/row['image']).convert('RGB'));out[mode][name]={key:{'pixel':r['pixel'],**sample(im,r['pixel'])} for key,r in row['samples'].items()}
 print(json.dumps(out,indent=2))
