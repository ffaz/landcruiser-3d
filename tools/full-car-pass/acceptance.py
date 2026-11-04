"""Progress and final acceptance use the same schema; pending is never counted as pass."""
import json,pathlib,sys
repo=pathlib.Path('/workspace/lc-full-car-pass');work=pathlib.Path('/workspace/full-car-pass/work');tag=sys.argv[1]
ids={'G1':'S1','G2':'S2','G3':'S2','P1':'S1','P2':'S2','P3':'S2','S1':'S1','S2':'S2','S3':'S2','F1':'S1','F2':'S2','F3':'S3','R1':'S1','R2':'S1','R3':'S1','R4':'S2','R6':'S3','T1':'S1','T2':'S2','T4':'S2','W1':'S1','W2':'S1','W3':'S2','W4':'S2','B1':'S2','B2':'S2','B3':'S2','K1':'S1','K2':'S1','K3':'S1','K4':'S1','K5':'S2','K6':'S3','M1':'S1','M2':'S1','M3':'S2','M4':'S2','M5':'S2','M6':'S3','H1':'S2','H2':'S2','H3':'S2','H4':'S2','H5':'S3'}
rows=[dict(id=k,severity=v,view=None,measured=None,threshold=None,status='pending',passed=None) for k,v in ids.items()]
p=work/tag/'measurements.json';measure=json.loads(p.read_text()) if p.exists() else []
for view in measure:
 s=view['statistics']
 if view['view']=='fq' and 'body' in s:
  tests={k:(s[k]['body_ratio'],.35<=s[k]['body_ratio']<=.55 if k=='front_glass' else s[k]['body_ratio']<=.25) for k in ['front_glass','rear_glass','quarter_glass'] if k in s}
  r=next(r for r in rows if r['id']=='G1');r.update(view='fq',measured=tests,threshold={'front_glass':[.35,.55],'rear_glass_max':.25,'quarter_glass_max':.25},status='partial',passed=None,note='Tailgate is not visible in fq; separate rear measurement still required. Ratios are display-referred Rec.709 luma, not linear radiance.')
 if view['view']=='side' and 'front_glass' in s:
  g=s['front_glass'];value=(g['top_mean']-g['bottom_mean'])/g['bottom_mean'];r=next(r for r in rows if r['id']=='G2');r.update(view='side / front glass',measured=value,threshold=.15,status='pass' if value>=.15 else 'fail',passed=value>=.15,note='Top/bottom 20% of eroded visible-window semantic mask.')
out={'status':'in_progress','capture':tag,'allS1S2Passed':False,'criteria':rows,'measurementFile':str(p),'notes':['No likeness percentage claimed before the full acceptance run.','No Main/Pages publication.']}
(repo/'docs/full-car-pass/acceptance.json').write_text(json.dumps(out,indent=2)+'\n')
