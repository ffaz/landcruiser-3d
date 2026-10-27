#!/usr/bin/env python3
"""Extract the two embedded gzip GLBs without changing the single-file viewer."""
from pathlib import Path
import argparse,re,base64,gzip,json,hashlib
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
a.output.mkdir(parents=True,exist_ok=True);html=a.source.read_text();report={'sourceSha256':hashlib.sha256(a.source.read_bytes()).hexdigest(),'assets':{}}
for label in ['vehicle','interior']:
 m=re.search(r'<script\s+id="'+label+r'-data"[^>]*>(.*?)</script>',html,re.S)
 if not m:raise SystemExit(f'Missing {label}-data in {a.source}')
 encoded=m.group(1).strip();packed=base64.b64decode(encoded);data=gzip.decompress(packed);(a.output/(label+'.glb')).write_bytes(data)
 report['assets'][label]={'glbBytes':len(data),'gzipBytes':len(packed),'base64Bytes':len(encoded),'sha256':hashlib.sha256(data).hexdigest()}
(a.output/'extraction-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
