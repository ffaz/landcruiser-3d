// Shared test-only static asset serving. Production files are never rewritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const mime={'.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.bin':'application/octet-stream'};
export async function serveAsset(response,pathname,{assetRoot,threeRoot}){
 const localThree=pathname.startsWith('/three/');
 const root=path.resolve(localThree?threeRoot:assetRoot);
 const relative=localThree?pathname.slice(7):pathname.slice(1);
 const filename=path.resolve(root,relative);
 if(!filename.startsWith(root+path.sep))throw Error('Path outside served directory');
 const data=await fs.readFile(filename);
 response.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});
 response.end(data);
}
export async function snapshotAssets(assetRoot){
 const root=path.resolve(assetRoot),files=[];
 const walk=async directory=>{for(const entry of await fs.readdir(directory,{withFileTypes:true}).catch(()=>[])){
  const filename=path.join(directory,entry.name);
  if(entry.isDirectory())await walk(filename);
  else if(/\.(?:glb|json)$/.test(entry.name))files.push(filename);
 }};
 await walk(path.join(root,'model'));
 const build=path.join(root,'build.json');if(await fs.stat(build).catch(()=>null))files.push(build);
 return Promise.all(files.sort().map(async filename=>{const data=await fs.readFile(filename);return{path:path.relative(root,filename).split(path.sep).join('/'),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')}}));
}

export const testBasePath='/landcruiser-3d/';
export function routeTestPath(pathname){
 if(pathname==='/favicon.ico'||pathname.startsWith('/three/'))return pathname;
 if(!pathname.startsWith(testBasePath))return null;
 return '/'+pathname.slice(testBasePath.length);
}
