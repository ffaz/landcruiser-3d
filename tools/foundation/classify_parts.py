"""Conservative source-component classification; unknown groups retain component IDs."""
from pathlib import Path
import json,math,sys,collections
root=Path(sys.argv[1]);rs=json.loads((root/'components.json').read_text())
def classify(r):
 x,y,z=r['centre'];sx,sy,sz=r['size'];lo=r['bounds']['min'];hi=r['bounds']['max'];name=r['name'].lower();mat=r['material'].split('.')[0];side='L' if z>=0 else 'R'
 def result(slot,why):return slot,why
 # Thumbnail review: broad location tests must not guess the mounting role of
 # detached pieces. Stable IDs keep the original six unknown slots unchanged.
 reviewedUnknown={
  1457:('unsorted_07','Broad connected black front backing spans grille and adjacent front body; mounting role cannot be isolated confidently.'),
  1782:('unsorted_08','Wide black upper-front strip extends beyond the grille face; body/bumper/grille mounting role unverified.'),
  1915:('unsorted_09','Small detached red roof-level component overlaps the rail envelope; lamp/rail identity unverified.'),
  1916:('unsorted_10','Connected red roof-level piece spans spoiler and rear roof regions; detached projections prevent confident spoiler assignment.'),
 }
 if r['source']=='vehicle' and r['component'] in reviewedUnknown:return result(*reviewedUnknown[r['component']])
 if r['source']=='garnish':return result('tailgate','stored fitted garnish retained without modification')
 if r['source']=='interior':return result('body_shell','fixed original cabin, carried with body')
 axle=-1.635 if x<-.21 else 1.215
 if mat in ['rim','rim_second','tire','brakedisk'] or 'blank' in name:
  return result('wheel_'+('F' if x<-.21 else 'R')+side,'source wheel/rim/tyre/brake family at measured axle')
 if mat in ['chrome','black'] and abs(z)>.65 and y<.71 and sx<.58 and sy<.58 and math.hypot(x-axle,y-.3965)<.285:
  return result('wheel_'+('F' if x<-.21 else 'R')+side,'compact lug/caliper inside hub envelope')
 if -.995<x<-.70 and 1.20<y<1.43 and abs(z)>.88:
  return result('mirror_'+side,'mirror housing/stem/indicator bbox')
 if y>1.81 and .50<abs(z)<.69 and hi[0]<1.96 and lo[0]>-1.1:
  return result('roof_rails','roof rail/foot lateral roof envelope')
 if x>1.95 and y>1.75 and abs(z)<.66:
  if (name.startswith('black_12') or name.startswith('chrome_1')) and x<2.13 and sz<.27:
   return result('tailgate','rear glazing/wiper detail below spoiler attachment')
  return result('spoiler','rear spoiler/lamp/support roof envelope')
 if mat=='redglass' and y>1.81 and x>1.7:return result('spoiler','high central rear brake lens')
 if mat=='paint' and x< -1.5 and y>1.08 and sz>1.3 and sx>1:
  return result('bonnet','separate full-width bonnet panel')
 if abs(z)>.83 and lo[0]>-1.25 and hi[0]<.85 and hi[1]<.56:
  return result('side_step_'+side,'running-board/sill envelope')
 if name.startswith('rear_bumper') or (x>1.75 and hi[1]<1.025 and mat=='paint'):
  return result('bumper_rear','named rear bumper or lower rear bumper paint')
 if x>2.1 and .52<y<1.33 and abs(z)>.44 and mat in ['redglass','clearglass','orangeglass','chrome','black'] and sx<.50 and sy<.35:
  return result('lamp_rear_'+side,'rear lamp corner lens/reflector/trim envelope')
 if x< -1.94 and .34<y<1.12 and abs(z)>.43 and mat in ['chrome','black','clearglass','orangeglass'] and sx<.65 and sy<.4:
  return result('lamp_front_'+side,'front lamp/fog lens/reflector/trim envelope')
 if x<-2.22 and .72<y<1.14 and abs(z)<.50 and mat in ['chrome','black']:
  return result('grille','central front grille bar/frame envelope')
 if x<-1.95 and y<.97 and (mat in ['paint','black','chrome']):
  return result('bumper_front','front bumper skin/trim envelope')
 if x>2.30 and y<.80:return result('bumper_rear','lower rear bumper trim/sensor envelope')
 if x>2.00 and y>.66 and abs(z)<.76:
  return result('tailgate','tailgate central panel/glazing/trim envelope')
 if abs(z)>.62 and hi[1]<1.82 and lo[1]>.44:
  if lo[0]>-1.14 and hi[0]<.095:
   return result('door_F'+side,'separate front door panel/window/frame/handle envelope')
  if lo[0]>-.035 and hi[0]<1.08:
   return result('door_R'+side,'separate rear door panel/window/frame/handle envelope')
 if mat=='paint':return result('body_shell','fixed painted body panel outside separable panel envelopes')
 if mat=='windowglass' and (sz>1.3 or lo[0]>.90):return result('body_shell','fixed windshield or rear quarter glazing')
 # Fixed rear quarter trim is outside both door and lamp regions.
 if .90<x<1.92 and y>1.23 and abs(z)>.62 and hi[1]<1.84:
  return result('body_shell','fixed rear quarter window/trim envelope')
 if -.25<x<1.3 and y<.32 and sz<1.4:
  return result('chassis','frame/axle candidate entirely below sill')
 if mat in ['black','mirror'] and -.80<x<-.60 and y>1.58 and abs(z)<.15:
  return result('body_shell','fixed interior rear-view mirror and stem')
 if mat=='black' and sz>1.3 and -1.40<x<-.75 and y>1.20:
  return result('body_shell','fixed windshield perimeter gasket')
 if mat in ['darkglass','black'] and -.45<x<.2 and y>1.77 and sz>.8:
  return result('body_shell','fixed sunroof glazing/perimeter')
 if mat=='black' and y<.70 and sx<.20 and sy>.25 and sz>.25 and abs(z)>.70:
  return result('body_shell','fixed mud flap behind wheel, not wheel assembly')
 if mat=='black' and lo[0]<-1 and hi[0]>1.50 and y>1.20:
  return result('body_shell','continuous fixed side weatherstrip crosses door boundaries')
 if mat=='black' and -1.41<x<-1.19 and 1.23<y<1.37:
  return result('body_shell','fixed windscreen wiper/cowl detail')
 return None,'ambiguous connected piece: location does not identify a target part reliably'
counts=collections.defaultdict(lambda:[0,0]);unknown=[]
for r in rs:
 slot,why=classify(r);r['part']=slot;r['classification']=why
 if slot is None:unknown.append(r)
 else:counts[slot][0]+=r['triangles'];counts[slot][1]+=1
(root/'classified.json').write_text(json.dumps(rs,indent=2)+'\n')
print('KNOWN',dict(sorted(counts.items())))
print('UNCLASSIFIED',len(unknown),'pieces',sum(r['triangles']for r in unknown),'triangles')
for r in sorted(unknown,key=lambda r:-r['triangles'])[:45]:print(r['component'],r['name'],r['material'],r['triangles'],[round(v,3)for v in r['centre']],[round(v,3)for v in r['size']])
