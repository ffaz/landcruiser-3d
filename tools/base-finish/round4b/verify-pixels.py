"""Recompute committed round-4b RGB/Lab, chrome and guide measurements.
Usage: python tools/base-finish/round4b/verify-pixels.py [report directory]
Requires Pillow and NumPy. Does not edit images or models.
"""
from pathlib import Path
import sys,json,hashlib
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from measure_pixels import sample,lab
root=Path(sys.argv[1]if len(sys.argv)>1 else 'docs/base-finish/round4b');p=json.loads((root/'pixels.json').read_text())
def read(f):return np.array(Image.open(root/f).convert('RGB'))
def eq(a,b):assert np.allclose(a,b,rtol=0,atol=1e-9),(a,b)
for f,h in p['imageHashes'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
for mode,views in p['views'].items():
 for row in views.values():
  im=read(row['image'])
  for s in row['samples'].values():eq(sample(im,s['pixel'])['Lab'],s['Lab'])
for mode,row in p['led'].items():
 im=read(row['image'])
 for q in row['pairs']:
  A=sample(im,q['feature']['pixel']);B=sample(im,q['surroundingLens']['pixel']);eq(A['Lab'],q['feature']['Lab']);eq(B['Lab'],q['surroundingLens']['Lab']);eq(abs(A['Lab'][0]-B['Lab'][0]),q['absoluteContrastL'])
for mode,row in p['chrome'].items():
 im=read(row['image']);m=read(row['mask'])
 for name,sel in [('emblem',(m[:,:,0]>250)&(m[:,:,1]<5)),('grilleBars',(m[:,:,1]>250)&(m[:,:,0]<5))]:
  L=lab(im[sel])[:,0];s=row['stats'][name];assert len(L)==s['pixels'];eq(np.median(L),s['medianL']);eq(np.percentile(L,95),s['p95L'])
assert all(p['checks'].values())
print('Image hashes, 7x7 Lab, chrome percentiles and seven LED/guide contrasts verified.')
