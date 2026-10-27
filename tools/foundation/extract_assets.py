#!/usr/bin/env python3
"""Read a historical index once and extract stored GLBs without printing payloads."""
from pathlib import Path
import argparse,re,base64,gzip,hashlib,json
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
h=a.source.read_text();report={'sourceSha256':hashlib.sha256(h.encode()).hexdigest(),'htmlBytes':len(h.encode()),'assets':{}}
for name,file in [('vehicle','vehicle'),('interior','interior'),('garnish','garnish'),('base','display-base')]:
 m=re.search(r'<script id="'+name+r'-data"[^>]*>(.*?)</script>',h,re.S)
 if not m:raise RuntimeError('Missing stored '+name)
 packed=base64.b64decode(m.group(1).strip());data=gzip.decompress(packed);(a.output/(file+'.glb')).write_bytes(data);report['assets'][file]={'glbBytes':len(data),'embeddedBase64Bytes':len(m.group(1).strip()),'sha256':hashlib.sha256(data).hexdigest()}
(a.output/'extraction-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
