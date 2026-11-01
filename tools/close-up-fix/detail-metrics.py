import numpy as np
from PIL import Image, ImageDraw
from pathlib import Path
from functools import lru_cache

@lru_cache(maxsize=4)
def detail(file):
 a=np.array(Image.open(file).convert('RGB'),dtype=np.float64);L=a@[.2126,.7152,.0722];h,w=L.shape;I=np.pad(L,((1,0),(1,0))).cumsum(0).cumsum(1);x=np.arange(w);y=np.arange(h);x0=np.maximum(x-8,0);x1=np.minimum(x+9,w);y0=np.maximum(y-8,0);y1=np.minimum(y+9,h);M=(I[y1[:,None],x1]-I[y0[:,None],x1]-I[y1[:,None],x0]+I[y0[:,None],x0])/((y1-y0)[:,None]*(x1-x0));return (L-M).astype(np.float32)
def blocks(a,b):
 d=detail(b).astype(np.float64)-detail(a).astype(np.float64);h,w=d.shape;hh=h//16*16;ww=w//16*16;m=np.abs(d[:hh,:ww]).reshape(hh//16,16,ww//16,16).mean((1,3));yy,xx=np.nonzero(m>5);return [(int(x*16),int(y*16),float(m[y,x])) for y,x in zip(yy,xx)]
def roi_mask(size,poly,radius=20,rectangle=False):
 m=Image.new('1',size);d=ImageDraw.Draw(m)
 if rectangle:d.rectangle(poly,fill=1)
 else:d.line(poly,fill=1,width=radius*2,joint='curve')
 return np.array(m)
def roi_blocks(bs,mask):return [(x,y,m) for x,y,m in bs if mask[y:y+16,x:x+16].any()]
def annotate(a,b,out,poly,radius=20,rectangle=False):
 im=Image.open(b).convert('RGB');mask=roi_mask(im.size,poly,radius,rectangle);bs=roi_blocks(blocks(a,b),mask);d=ImageDraw.Draw(im)
 if rectangle:d.rectangle(poly,outline='cyan',width=2)
 else:d.line(poly,fill='cyan',width=2)
 for x,y,m in bs:d.rectangle((x,y,x+16,y+16),outline='#14a03c',width=2)
 im.save(out);return bs
if __name__=='__main__':
 import sys,json
 if len(sys.argv)!=3:raise SystemExit('Usage: python detail-metrics.py ORIGINAL.png CANDIDATE.png')
 print(json.dumps(blocks(sys.argv[1],sys.argv[2]),indent=2))
