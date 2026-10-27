#!/usr/bin/env python3
"""Render review thumbnails from untouched uncompressed foundation GLBs.

Run with Blender 4.3+:
 blender -b -t 2 --python tools/foundation/render_parts.py -- \
   --manifest model/manifest.json --uncompressed /tmp/lc200/uncompressed \
   --output docs/foundation/parts

This changes only materials/camera/lighting in a temporary Blender scene. It does
not write or transform source meshes. Workbench cavity is review lighting only;
the delivered GLBs retain their baked COLOR_0 data unchanged.
"""
import argparse, hashlib, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Vector

parser=argparse.ArgumentParser()
parser.add_argument('--manifest',type=Path,required=True)
parser.add_argument('--uncompressed',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--width',type=int,default=384)
parser.add_argument('--height',type=int,default=320)
parser.add_argument('--only',nargs='*')
parser.add_argument('--resume',action='store_true')
a=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
a.output.mkdir(parents=True,exist_ok=True)
manifest=json.loads(a.manifest.read_text())

# Names reflect material zones in the source, not guessed part classification.
def preview_color(name):
 n=name.lower()
 if any(s in n for s in ['redglass','tailred','red_lamp']):return (.62,.025,.04,1)
 if any(s in n for s in ['orangeglass','amber']):return (.75,.28,.025,1)
 if any(s in n for s in ['window','darkglass','glass_dark']):return (.10,.13,.15,1)
 if any(s in n for s in ['clearglass','lamp','headlight']):return (.53,.61,.66,1)
 if any(s in n for s in ['tire','tyre']):return (.045,.05,.055,1)
 if any(s in n for s in ['black','plastic','rubber']):return (.075,.085,.095,1)
 if any(s in n for s in ['chrome','metal','rim','brake','mirror']):return (.48,.53,.57,1)
 if any(s in n for s in ['interior','seat','cloth']):return (.42,.36,.28,1)
 if any(s in n for s in ['paint','body']):return (.84,.84,.80,1)
 return (.54,.57,.58,1)


def entries_from_manifest(m):
 entries=[]
 base=m.get('base')
 if isinstance(base,str):entries.append({'id':'base','url':base})
 elif isinstance(base,dict):entries.append(dict({'id':'base'},**base))
 parts=m.get('parts',[])
 if isinstance(parts,dict):parts=[dict({'id':k},**v) for k,v in parts.items()]
 entries.extend(parts)
 # A display plinth is not a swappable vehicle part, but show it if requested.
 return entries


def render_part(entry):
 ident=entry['id'];url=entry.get('url') or entry.get('file')
 if not url:raise RuntimeError('Missing review source URL for '+ident)
 source=a.uncompressed/url
 if not source.is_file():raise RuntimeError('Missing uncompressed review asset '+str(source))
 digest=hashlib.sha256(source.read_bytes()).hexdigest()
 dest=a.output/(ident+'.png');prior=previous.get(ident)
 if a.resume and dest.exists() and prior and prior.get('sourceSha256')==digest:
  return dict(prior,reused=True)
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(source),merge_vertices=False)
 scene=bpy.context.scene
 scene.render.engine='BLENDER_WORKBENCH'
 scene.render.resolution_x=a.width;scene.render.resolution_y=a.height;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
 scene.render.film_transparent=False
 scene.display.shading.light='STUDIO';scene.display.shading.studio_light='paint.sl'
 scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True
 scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH'
 scene.display.shading.curvature_ridge_factor=1.15;scene.display.shading.curvature_valley_factor=1.25
 scene.display.shading.cavity_ridge_factor=1.10;scene.display.shading.cavity_valley_factor=1.25
 scene.display.shading.show_specular_highlight=True
 scene.display.shading.background_type='VIEWPORT';scene.display.shading.background_color=(.84,.81,.76)
 scene.view_settings.view_transform='Standard'
 scene.view_settings.exposure=0;scene.view_settings.gamma=1
 meshes=[o for o in scene.objects if o.type=='MESH']
 if not meshes:raise RuntimeError('No geometry in '+str(source))
 for material in bpy.data.materials:material.diffuse_color=preview_color(material.name)
 bpy.context.view_layer.update()
 corners=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 low=Vector(tuple(min(p[i] for p in corners) for i in range(3)))
 high=Vector(tuple(max(p[i] for p in corners) for i in range(3)))
 centre=(low+high)*.5;extent=high-low
 n=ident.lower()
 # Blender axes are X length, Y width, Z up after glTF import.
 xsign=1 if any(token in n for token in ['rear','tailgate','spoiler']) else -1
 if n in ['wheel_rl','wheel_rr']:xsign=1
 side_part=any(token in n for token in ['wheel_','door_','mirror_','side_step','lamp_'])
 ysign=(1 if centre.y>0 else -1) if side_part else -1
 direction=Vector((xsign*.80,ysign*1.15,.70)).normalized()
 if n in ['roof_rails','bonnet','arch_flares']:direction=Vector((-.7,-1,1.0)).normalized()
 max_extent=max(extent);distance=max(2,max_extent*3)
 bpy.ops.object.camera_add(location=centre+direction*distance)
 camera=bpy.context.object;scene.camera=camera
 camera.rotation_euler=(centre-camera.location).to_track_quat('-Z','Y').to_euler()
 camera.data.type='ORTHO';camera.data.clip_start=.001;camera.data.clip_end=max(100,distance*10)
 rotation=camera.rotation_euler.to_quaternion().inverted()
 projected=[rotation@(p-centre) for p in corners]
 span_x=max(p.x for p in projected)-min(p.x for p in projected)
 span_y=max(p.y for p in projected)-min(p.y for p in projected)
 camera.data.ortho_scale=1
 frame=camera.data.view_frame(scene=scene)
 frame_width=max(p.x for p in frame)-min(p.x for p in frame)
 frame_height=max(p.y for p in frame)-min(p.y for p in frame)
 camera.data.ortho_scale=max(span_y/frame_height,span_x/frame_width,.000001)*1.16
 scene.render.filepath=str(dest.resolve())
 start=time.monotonic();bpy.ops.render.render(write_still=True)
 triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
 return {'id':ident,'thumbnail':dest.name,'source':str(source),'sourceSha256':digest,
  'triangles':triangles,'manifestTriangles':entry.get('triangles'),
  'meshCount':len(meshes),'reviewBoundsBlender':{'min':list(low),'max':list(high)},
  'renderSeconds':round(time.monotonic()-start,3),'renderEngine':scene.render.engine,'reused':False}

report_path=a.output/'thumbnails.json'
previous={}
if report_path.exists():previous={r['id']:r for r in json.loads(report_path.read_text()).get('parts',[])}
all_entries=entries_from_manifest(manifest)
entries=[entry for entry in all_entries if not a.only or entry['id'] in a.only]
rows_by_id={entry['id']:previous[entry['id']] for entry in all_entries if entry['id'] in previous}
for entry in entries:
 row=render_part(entry);rows_by_id[entry['id']]=row
 rows=[rows_by_id[entry['id']] for entry in all_entries if entry['id'] in rows_by_id]
 report={'blenderVersion':bpy.app.version_string,'engine':'Blender Workbench / studio material-zone review lighting',
  'resolution':[a.width,a.height],'geometryModified':False,
  'note':'Review thumbnails use temporary material-zone colours and Workbench cavity. They do not alter delivered geometry, normals or baked AO/curvature.',
  'parts':rows}
 report_path.write_text(json.dumps(report,indent=2)+'\n')
 print('PART_THUMBNAIL',entry['id'],row['triangles'],row['renderSeconds'],flush=True)
print('THUMBNAILS_COMPLETE',len(rows_by_id),flush=True)
