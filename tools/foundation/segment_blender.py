"""Inventory source loose pieces in Blender; original arrays remain untouched.
Usage blender -b -t 4 --python tools/foundation/segment_blender.py -- SOURCE OUTPUT
"""
import bpy,bmesh,sys,json,time
from pathlib import Path
import numpy as np
from mathutils.kdtree import KDTree
sys.path.insert(0,str(Path(__file__).resolve().parent))
from gltf_binary import read_glb,accessor,world_positions
src=Path(sys.argv[sys.argv.index('--')+1]);out=Path(sys.argv[sys.argv.index('--')+2]);out.mkdir(parents=True,exist_ok=True)
start=time.time();records=[];mappings=[]
for label in ['vehicle','interior','garnish']:
 j,b=read_glb(src/(label+'.glb'))
 for ni,node in enumerate(j['nodes']):
  if 'mesh' not in node:continue
  for pi,prim in enumerate(j['meshes'][node['mesh']]['primitives']):
   points=world_positions(j,b,ni,prim);ind=accessor(j,b,prim['indices']).reshape(-1,3) if 'indices'in prim else np.arange(len(points)).reshape(-1,3)
   # Temporary Blender topology is welded only to identify loose pieces.
   # Export later selects ORIGINAL triangle indices/accessor bytes, never these vertices.
   me=bpy.data.meshes.new('Inventory');me.from_pydata(points.tolist(),[],ind.tolist());me.update()
   bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bm.verts.ensure_lookup_table()
   comp=np.full(len(bm.verts),-1,dtype=np.int32);components=[]
   for seed in bm.verts:
    if comp[seed.index]>=0:continue
    cid=len(components);stack=[seed];comp[seed.index]=cid;verts=[]
    while stack:
     v=stack.pop();verts.append(v.index)
     for e in v.link_edges:
      z=e.other_vert(v)
      if comp[z.index]<0:comp[z.index]=cid;stack.append(z)
    components.append(verts)
   tree=KDTree(len(bm.verts))
   for v in bm.verts:tree.insert(v.co,v.index)
   tree.balance();mapped=np.array([comp[tree.find(p)[1]] for p in points],dtype=np.int32)
   facecomps=mapped[ind[:,0]]
   if np.any(mapped[ind]!=facecomps[:,None]):raise RuntimeError('Triangle crosses loose components')
   material=j['materials'][prim.get('material',0)].get('name','unknown');ids=np.empty(len(ind),np.int32)
   for cid in np.unique(facecomps):
    faces=np.flatnonzero(facecomps==cid);vi=np.unique(ind[faces]);p=points[vi];mn=p.min(0);mx=p.max(0);rid=len(records);ids[faces]=rid
    records.append({'component':rid,'source':label,'node':ni,'primitive':pi,'mesh':node['mesh'],'name':node.get('name'),'material':material,'triangles':len(faces),'vertices':len(vi),'bounds':{'min':mn.tolist(),'max':mx.tolist()},'centre':((mn+mx)/2).tolist(),'size':(mx-mn).tolist()})
   fn=f'{label}-n{ni}-p{pi}.npy';np.save(out/fn,ids);mappings.append({'source':label,'node':ni,'primitive':pi,'file':fn})
   print('INVENTORY',label,node.get('name'),pi,len(np.unique(facecomps)),'pieces',flush=True)
   bm.free();bpy.data.meshes.remove(me)
(out/'components.json').write_text(json.dumps(records,indent=2)+'\n');(out/'mapping.json').write_text(json.dumps(mappings,indent=2)+'\n')
print('DONE',len(records),'pieces',sum(r['triangles'] for r in records),'triangles',round(time.time()-start,2),'seconds')
