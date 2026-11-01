from pathlib import Path
import urllib.request,json,sys
url=(Path(sys.argv[1])/'diagnostic-url.txt').read_text().strip()
def api(p,d={}):
 req=urllib.request.Request(url+'/diag/'+p,json.dumps(d).encode(),{'Content-Type':'application/json'})
 return json.loads(urllib.request.urlopen(req,timeout=240).read())
if __name__=='__main__':print(json.dumps(api(sys.argv[2],json.loads(sys.argv[3]) if len(sys.argv)>3 else {}),indent=2))
