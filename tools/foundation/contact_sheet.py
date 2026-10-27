#!/usr/bin/env python3
"""Assemble labelled review sheets from real Blender part renders."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import argparse, json, math
p=argparse.ArgumentParser();p.add_argument('--manifest',type=Path,required=True);p.add_argument('--thumbnails',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
a.output.mkdir(parents=True,exist_ok=True)
m=json.loads(a.manifest.read_text());r=json.loads((a.thumbnails/'thumbnails.json').read_text());rows=r['parts']
parts=m.get('parts',[])
if isinstance(parts,dict):parts=[dict({'id':k},**v) for k,v in parts.items()]
base=m.get('base')
entries=([dict({'id':'base'},**base)] if isinstance(base,dict) else [])+parts
lookup={e['id']:e for e in entries}
# Blender outputs RGBA. Flatten alpha onto the same Cream studio colour so
# individual review thumbnails display consistently in browsers and documents.
for row in rows:
 image_path=a.thumbnails/row['thumbnail']
 image=Image.open(image_path).convert('RGBA')
 background=Image.new('RGBA',image.size,(239,234,227,255))
 background.alpha_composite(image)
 background.convert('RGB').save(image_path)

font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(font_path,16);small=ImageFont.truetype(font_path,13)
known=[row for row in rows if not row['id'].startswith('unsorted_')]
unsorted=[row for row in rows if row['id'].startswith('unsorted_')]
sheets=[]
for label,group in [('parts',known),('unsorted',unsorted)]:
 for page in range(math.ceil(len(group)/32)):
  batch=group[page*32:(page+1)*32];h=math.ceil(len(batch)/4)*368
  out=Image.new('RGB',(1536,h),(32,37,41));d=ImageDraw.Draw(out)
  for i,row in enumerate(batch):
   x,y=(i%4)*384,(i//4)*368
   im=Image.open(a.thumbnails/row['thumbnail']).convert('RGB');out.paste(ImageOps.contain(im,(384,320)),(x,y))
   entry=lookup.get(row['id'],{})
   count=entry.get('triangles',row.get('manifestTriangles') or row['triangles'])
   d.text((x+10,y+326),row['id'],font=font,fill=(245,245,240))
   zones=entry.get('zones',[]);zones=', '.join(zones.keys()) if isinstance(zones,dict) else ', '.join(zones)
   text=f'{count:,} triangles'+(f' · {zones}' if zones else '')
   if len(text)>52:text=text[:49]+'…'
   d.text((x+10,y+349),text,font=small,fill=(186,196,202))
  filename=f'{label}-sheet-{page+1:02d}.jpg';out.save(a.output/filename,quality=91);sheets.append((label,filename))
lines=['# Part review thumbnails','',
 'Actual Blender Workbench renders of each uncompressed delivery part. Review lighting uses temporary material-zone colours and cavity shading; no geometry, normals or exported baked data are changed.','',
 'Review sheets: '+ ' · '.join(f'[{label.title()} {i+1}]({filename})' for i,(label,filename) in enumerate(sheets)), '',
 '| Part | Triangles | Material zones | Classification | Thumbnail |','| --- | ---: | --- | --- | --- |']
for row in rows:
 entry=lookup.get(row['id'],{});count=entry.get('triangles',row.get('manifestTriangles') or row['triangles'])
 zones=entry.get('zones',[]);zones=', '.join(zones.keys()) if isinstance(zones,dict) else ', '.join(zones)
 classification=entry.get('classification','')
 if isinstance(classification,dict):classification=classification.get('reason') or json.dumps(classification,separators=(',',':'))
 classification=str(classification).replace('|','/').replace('\n',' ')
 if len(classification)>180:classification=classification[:177]+'…'
 thumb='parts/'+row['thumbnail']
 lines.append(f"| {row['id']} | {count:,} | {zones} | {classification} | [View]({thumb}) |")
(a.output/'parts-review.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'thumbnails':len(rows),'knownParts':len(known),'unsortedParts':len(unsorted),'sheets':[f for _,f in sheets]},indent=2))
