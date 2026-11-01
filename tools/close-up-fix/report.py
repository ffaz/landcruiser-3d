"""Generate review artifacts without changing renders or audit thresholds.
Usage: python tools/close-up-fix/report.py AUDIT_DIR OUTPUT_DIR
Requires Pillow and numpy. All crop coordinates are full-resolution PNG pixels.
"""
import sys,json,shutil,hashlib,importlib.util
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
spec=importlib.util.spec_from_file_location('metrics',Path(__file__).with_name('detail-metrics.py'));metrics=importlib.util.module_from_spec(spec);spec.loader.exec_module(metrics)
audit,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
for sub in ['crops','gates','captures']: (out/sub).mkdir(exist_ok=True)
shutil.copytree(audit/'sheets',out/'sheets',dirs_exist_ok=True);shutil.copyfile(audit/'changes.json',out/'changes.json')
versions=['orig','live','candidate'];labels=['ORIGINAL f553e19','LIVE acd7c4e','CANDIDATE car-polish']
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
except OSError:font=ImageFont.load_default()
# Rectangles enclose each reported feature, preserving native resolution.
crops=[
 (1,'bonnet-edge-pz',(240,700,1400,1275)),(1,'bonnet-edge-nz',(350,650,1580,1275)),
 (1,'black-bonnet-edge',(240,700,1400,1275)),(1,'phone-bonnet-edge-pz',None),
 (2,'roof-top',None),(2,'roof-rear',(0,180,1800,850)),
 (3,'front-door-pz',(250,450,1650,1275)),(3,'front-door-nz',(150,450,1550,1275)),
 (3,'rear-door-pz',(150,430,1650,1275)),(3,'rear-door-nz',(150,430,1650,1275)),
 (3,'rear-quarter-pz',None),(3,'tailgate',None),
 (4,'tail-lamp-pz',(400,350,1600,1150)),(4,'tail-lamp-nz',(200,350,1400,1150)),(4,'phone-tail-pz',None),
 (5,'door-handles-pz',(570,620,1120,880)),
 (6,'front-plate',(450,700,1350,1175)),(6,'black-front-corner',(0,650,1300,1275)),
 (7,'roof-rear',None),(7,'black-orbit-210',None),(7,'clay-orbit-210',None),
 (8,'front-door-pz',(1380,420,1600,1275)),(8,'rear-door-pz',(430,420,650,1275)),
 (9,'windscreen-base',None),
 (10,'front-arch-pz',None),(10,'front-arch-nz',None),
 (11,'rear-badges',None),(11,'rear-bumper',None),
 (12,'fog-bumper-pz',None),(12,'fog-bumper-nz',None),
]
index=[]
for item,shot,roi in crops:
 imgs=[Image.open(audit/v/(shot+'.png')).convert('RGB') for v in versions];roi=roi or (0,0,*imgs[0].size);imgs=[a.crop(roi) for a in imgs];w,h=imgs[0].size;sheet=Image.new('RGB',(w*3+24,h+40),'white');d=ImageDraw.Draw(sheet)
 for i,(a,l) in enumerate(zip(imgs,labels)):sheet.paste(a,(i*(w+12),40));d.text((i*(w+12)+6,7),l,fill='black',font=font)
 name=f'{item:02d}-{shot}.png';sheet.save(out/'crops'/name);index.append({'item':item,'shot':shot,'rectangle':roi,'file':'crops/'+name,'resampled':False})
# Preserve unedited capture logs plus image hashes, so every sheet is traceable.
for v in versions:
 shutil.copyfile(audit/v/'capture.json',out/'captures'/(v+'.json'))
 hashes={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((audit/v).glob('*.png'))}
 (out/'captures'/(v+'-sha256.json')).write_text(json.dumps(hashes,indent=2)+'\n')
(out/'crop-index.json').write_text(json.dumps(index,indent=2)+'\n')
# Gate masks are explicit; whole-shot totals remain in unmodified changes.json.
# The long seam and its junctions are measured separately, never silently excluded.
gates={
 'bonnet-edge-pz':{'polyline':[(310,1235),(425,1150),(1210,880),(1255,850),(1300,750)],'radius':20},
 'bonnet-edge-nz':{'polyline':[(560,755),(590,850),(625,880),(1455,1180),(1530,1240)],'radius':20},
 'black-bonnet-edge':{'polyline':[(310,1235),(425,1150),(1210,880),(1255,850),(1300,750)],'radius':20},
 'phone-bonnet-edge-pz':{'polyline':[(0,1772),(1070,1390),(1130,1340),(1170,1210)],'radius':24},
 'front-door-pz':{'polyline':[(1508,440),(1495,650),(1500,1000),(1540,1270)],'radius':20},
 'front-door-nz':{'polyline':[(344,440),(357,650),(352,1000),(312,1270)],'radius':20},
 'rear-door-pz':{'polyline':[(526,450),(487,565),(480,820),(500,1040),(550,1240)],'radius':20},
 'rear-door-nz':{'polyline':[(1326,450),(1365,565),(1372,820),(1352,1040),(1302,1240)],'radius':20},
 'door-handles-pz':{'rectangle':[(625,670),(1060,835)]},
}
auditCounts={s['shot']:s for s in json.loads((audit/'changes.json').read_text())}
results={}
for shot,roi in gates.items():
 a=audit/'orig'/(shot+'.png');b=audit/'candidate'/(shot+'.png');im=Image.open(b);mask=metrics.roi_mask(im.size,roi.get('polyline',roi.get('rectangle')),roi.get('radius',20),'rectangle' in roi)
 pairs={}
 for va,vb in [('orig','live'),('live','candidate'),('orig','candidate')]:
  full=metrics.blocks(audit/va/(shot+'.png'),audit/vb/(shot+'.png'))
  if va=='orig' and vb=='candidate':assert len(full)==auditCounts[shot]['origToCandidate']['blocks'], 'Gate algorithm differs from audit: '+shot
  bs=metrics.roi_blocks(full,mask)
  pairs[va+'To'+vb]={'markedBlocks':len(bs),'blocks':[{'x':x,'y':y,'meanAbsDetailDelta':round(m,3)} for x,y,m in bs]}
 metrics.annotate(a,b,out/'gates'/(shot+'.png'),roi.get('polyline',roi.get('rectangle')),roi.get('radius',20),'rectangle' in roi)
 results[shot]={'roi':roi,**pairs,'strictZeroGreen':pairs['origTocandidate']['markedBlocks']==0}
(out/'gates.json').write_text(json.dumps({'algorithm':{'block':16,'radius':8,'threshold':5,'sameAs':'tools/audit/sheet.mjs'},'shots':results,'allStrictZeroGreen':all(x['strictZeroGreen'] for x in results.values())},indent=2)+'\n')
def lab(a):
 s=np.asarray(a,dtype=float)/255;l=np.where(s<=.04045,s/12.92,((s+.055)/1.055)**2.4);xyz=l@np.array([[.4124564,.3575761,.1804375],[.2126729,.7151522,.0721750],[.0193339,.1191920,.9503041]]).T;xyz/=np.array([.95047,1,1.08883]);f=np.where(xyz>(6/29)**3,np.cbrt(xyz),xyz/(3*(6/29)**2)+4/29);return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],-1)
pixelCache={}
def measure(shot,roi):
 r={}
 for v in versions:
  key=(shot,v)
  if key not in pixelCache:pixelCache[key]=np.array(Image.open(audit/v/(shot+'.png')).convert('RGB'))
  im=pixelCache[key];x0,y0,x1,y1=roi;a=im[y0:y1,x0:x1];L=lab(a)[...,0];med=np.median(a.reshape(-1,3),0);r[v]={'meanL':round(float(L.mean()),3),'medianRGB':med.tolist(),'medianHex':'#'+''.join(f'{int(v):02x}' for v in med),'medianLab':np.round(lab(med),3).tolist(),'L05':round(float(np.percentile(L,5)),3),'L95':round(float(np.percentile(L,95)),3),'pixels':int(L.size)}
 return {'shot':shot,'rectangle':roi,'values':r}
pixels={
 'plateFace':measure('front-plate',(665,845,1180,1000)),
 'adjacentBumperLeft':measure('front-plate',(390,780,600,840)),
 'adjacentBumperRight':measure('front-plate',(1240,780,1450,840)),
 'blackPaintPlate':measure('black-front-corner',(150,910,280,970)),
 'handleCup':measure('door-handles-pz',(787,701,794,708)),
 'bonnet':measure('bonnet-edge-pz',(800,850,807,857)),
}
face=pixels['plateFace']['values']['candidate']['meanL'];bumper=np.mean([pixels[n]['values']['candidate']['meanL'] for n in ['adjacentBumperLeft','adjacentBumperRight']]);pixels['whitePlateGate']={'faceMeanL':face,'bumperMeanL':round(float(bumper),3),'pass':bool(face<=bumper)}
# Actual measured centres in each image; the retained view offset prevents
# mirroring x about the viewport centre. Each cap sample is a 7x7 median.
podsPZ=[(194,127),(242,127),(288,127),(199,168),(246,168),(291,168),(200,211),(248,211),(292,211),(366,125),(410,125),(457,125),(503,125),(551,124),(368,166),(412,165),(460,165),(523,162),(370,208),(414,208),(461,205),(502,194)]
podsNZ=[(586,128),(540,127),(493,127),(583,169),(537,169),(491,168),(582,214),(535,212),(490,212),(416,127),(371,126),(324,125),(280,124),(230,123),(413,168),(369,166),(322,165),(258,162),(413,211),(368,208),(321,207),(280,194)]
pixels['LEDs']={}
yy,xx=np.mgrid[-20:21,-20:21];annulus=(xx*xx+yy*yy>=14*14)&(xx*xx+yy*yy<=20*20)
for side,centres,xOffset in [('pz',podsPZ,650),('nz',podsNZ,420)]:
 shot='tail-lamp-'+side;points=[]
 for i,(x,y) in enumerate(centres):
  x+=xOffset;y+=540;cap=measure(shot,(x-3,y-3,x+4,y+4));lens={}
  for v in versions:
   a=pixelCache[(shot,v)];ring=a[y-20:y+21,x-20:x+21][annulus];rgb=np.median(ring,axis=0)
   lens[v]={'medianRGB':rgb.tolist(),'medianLab':np.round(lab(rgb),3).tolist(),'pixels':int(len(ring))}
  points.append({'pod':i+1,'half':'body' if i<9 else 'tailgate','centre':[x,y],'cap':cap,'surroundingLens':{'annulusRadii':[14,20],'values':lens},'candidateDeltaL':round(float(cap['values']['candidate']['medianLab'][0]-lens['candidate']['medianLab'][0]),3)})
 pixels['LEDs'][side]=points
(out/'pixels.json').write_text(json.dumps(pixels,indent=2)+'\n')
print('Exported',len(index),'native-resolution comparisons and',len(list((out/'sheets').glob('*.png'))),'audit sheets')
print('Strict zero-green gates:',sum(x['strictZeroGreen'] for x in results.values()),'/',len(results));print('White plate gate:',pixels['whitePlateGate'])
