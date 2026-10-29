"""Recompute the committed round-3 7x7 Lab/guide and semantic-chrome measurements.
Usage: python tools/base-finish/verify-round3-pixels.py [report directory]
Requires Pillow and NumPy. Reads images only; does not render or change assets.
"""
from pathlib import Path
import json,sys,hashlib
import numpy as np
from PIL import Image
from measure_pixels import lab,sample
root=Path(sys.argv[1] if len(sys.argv)>1 else 'docs/base-finish/round3')
p=json.loads((root/'pixels.json').read_text())
def load(name):return np.array(Image.open(root/name).convert('RGB'))
def same(a,b):assert np.allclose(a,b,rtol=0,atol=1e-9),(a,b)
for rel,expected in p['imageHashes'].items():
 assert hashlib.sha256((root/rel).read_bytes()).hexdigest()==expected,rel
for mode,views in p['views'].items():
 for view,row in views.items():
  im=load(row['image'])
  for s in row['samples'].values():same(sample(im,s['pixel'])['Lab'],s['Lab'])
for mode,row in p['lamps'].items():
 im=load(row['image'])
 for pair in row['pairs']:
  a=sample(im,pair['feature']['pixel']);b=sample(im,pair['surroundingLens']['pixel'])
  same(a['Lab'],pair['feature']['Lab']);same(b['Lab'],pair['surroundingLens']['Lab'])
  same(a['Lab'][0]-b['Lab'][0],pair['contrastL'])
 for s in row['reverseStrip']:same(sample(im,s['pixel'])['Lab'],s['Lab'])
for key,row in p['chrome'].items():
 mode,_,view=key.split('-');name='emblem-front' if view=='close' else 'cream-'+view
 im=load(f'{mode}/{name}.png');mask=load(f'masks/{mode}-{name}.png')
 for part,selection in [('emblem',(mask[:,:,0]>250)&(mask[:,:,1]<5)&(mask[:,:,2]<5)),('comparisonMetal',(mask[:,:,1]>250)&(mask[:,:,0]<5)&(mask[:,:,2]<5))]:
  L=lab(im[selection])[:,0];expected=row[part]
  assert len(L)==expected['pixels'];same(np.median(L),expected['medianL']);same(np.percentile(L,95),expected['p95L']);same(np.percentile(L,99),expected['p99L'])
assert all(p['checks'].values())
print('Round-3 image hashes, 7x7 Lab patches, six guide contrasts and eight semantic chrome masks verified.')
