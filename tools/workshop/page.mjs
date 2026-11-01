// Shared headless harness for workshop tools: serves the repository with the
// pinned Three.js 0.166.1 unpacked locally, opens index.html in Chromium and
// waits for the viewer to finish loading. Nothing here edits repository files.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

export const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.css':'text/css'};

export async function openViewer({deps,chromium,viewport={width:1440,height:1000},hash=''}){
 const require=createRequire(path.join(deps,'package.json'));
 const playwright=require('playwright');
 const three=path.join(deps,'three','package');
 const cdn='https://cdn.jsdelivr.net/npm/three@0.166.1/';
 const html=(await fs.readFile(path.join(repo,'index.html'),'utf8')).replaceAll(cdn,'/three/');
 const server=createServer(async(request,response)=>{
  try{
   const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   if(pathname==='/'||pathname==='/index.html'){response.writeHead(200,{'Content-Type':types['.html']});response.end(html);return;}
   const file=pathname.startsWith('/three/')?path.join(three,pathname.slice(7)):path.join(repo,pathname);
   const root=pathname.startsWith('/three/')?three:repo;
   if(!path.resolve(file).startsWith(path.resolve(root)))throw Error('outside root');
   const body=await fs.readFile(file);
   response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});response.end(body);
  }catch{response.writeHead(404);response.end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await playwright.chromium.launch({executablePath:chromium,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/index.html${hash}`,{timeout:120000});
 await page.waitForFunction(()=>document.querySelector('#loader.hidden')||document.querySelector('#loaderror')?.style.display==='block',null,{timeout:120000});
 if(!await page.locator('#loader.hidden').count())throw Error('Viewer failed to load: '+errors.join('; '));
 const close=async()=>{await browser.close();server.close();};
 return {page,errors,close,url:`http://127.0.0.1:${server.address().port}/index.html`};
}
