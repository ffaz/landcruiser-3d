// Lossless EXT_meshopt_compression only. Deliberately do not call meshopt(),
// quantize(), dequantize(), flatten() or any geometric transform.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const [input,output,reportPath,deps='/workspace/lc-visual']=process.argv.slice(2);
if(!input||!output||!reportPath)throw Error('Usage:node compress_meshopt.mjs INPUT OUTPUT REPORT [DEPS]');
const require=createRequire(path.join(path.resolve(deps),'package.json'));
const {NodeIO}=await import(require.resolve('@gltf-transform/core'));
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await import(require.resolve('@gltf-transform/extensions'));
const {MeshoptEncoder,MeshoptDecoder}=await import(require.resolve('meshoptimizer'));
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const manifest=JSON.parse(await fs.readFile(path.join(input,'manifest.json'),'utf8'));
const entries=[manifest.base,...manifest.parts,manifest.displayBase];const reports=[];
const arrays=doc=>doc.getRoot().listMeshes().flatMap(mesh=>mesh.listPrimitives().flatMap(p=>p.listSemantics().map(s=>({name:mesh.getName(),semantic:s,type:p.getAttribute(s).getComponentType(),normalized:p.getAttribute(s).getNormalized(),bytes:Buffer.from(p.getAttribute(s).getArray().buffer,p.getAttribute(s).getArray().byteOffset,p.getAttribute(s).getArray().byteLength)}))));
const triangleArrays=doc=>doc.getRoot().listMeshes().flatMap(mesh=>mesh.listPrimitives().map(p=>Array.from(p.getIndices().getArray())));
const sameTriangles=(a,b)=>a.length===b.length&&a.every((v,i)=>{const k=Math.floor(i/3)*3;return [0,1,2].some(r=>a[k]===b[k+r]&&a[k+1]===b[k+(r+1)%3]&&a[k+2]===b[k+(r+2)%3]);});
const transforms=doc=>doc.getRoot().listNodes().map(n=>({name:n.getName(),translation:n.getTranslation(),rotation:n.getRotation(),scale:n.getScale()}));
for(const entry of entries){
 const src=path.join(input,entry.url),dst=path.join(output,entry.url);await fs.mkdir(path.dirname(dst),{recursive:true});
 const doc=await io.read(src);const a=arrays(doc),ta=transforms(doc),ia=triangleArrays(doc);
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 // QUANTIZE is the extension's lossless NONE-filter writer mode. It performs no
 // quantisation itself; the omitted transform would have performed that step.
 await io.write(dst,doc);
 const decoded=await io.read(dst),b=arrays(decoded),tb=transforms(decoded),ib=triangleArrays(decoded);
 if(ia.length!==ib.length||!ia.every((v,i)=>sameTriangles(v,ib[i])))throw Error('Triangle topology changed '+entry.url);
 if(a.length!==b.length)throw Error('Primitive attributes changed '+entry.url);
 for(let i=0;i<a.length;i++)if(a[i].semantic!==b[i].semantic||a[i].type!==b[i].type||a[i].normalized!==b[i].normalized||!a[i].bytes.equals(b[i].bytes))throw Error('Non-lossless attribute '+entry.url+' '+a[i].name+' '+a[i].semantic);
 if(JSON.stringify(ta)!==JSON.stringify(tb))throw Error('Stored node transforms changed '+entry.url);
 const bin=await fs.readFile(dst);const j=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString());
 const {MeshoptDecoder:PinnedDecoder}=await import(path.join(path.resolve(deps),'package/examples/jsm/libs/meshopt_decoder.module.js'));await PinnedDecoder.ready;
 const header=20+bin.readUInt32LE(12)+8;let compressedViews=0;
 for(const view of j.bufferViews){const e=view.extensions?.EXT_meshopt_compression;if(!e)continue;const target=new Uint8Array(e.count*e.byteStride);PinnedDecoder.decodeGltfBuffer(target,e.count,e.byteStride,bin.subarray(header+(e.byteOffset||0),header+(e.byteOffset||0)+e.byteLength),e.mode,e.filter);const modern=new Uint8Array(e.count*e.byteStride);MeshoptDecoder.decodeGltfBuffer(modern,e.count,e.byteStride,bin.subarray(header+(e.byteOffset||0),header+(e.byteOffset||0)+e.byteLength),e.mode,e.filter);if(!Buffer.from(target).equals(Buffer.from(modern)))throw Error('Pinned decoder differs '+entry.url);compressedViews++;}
 const result={id:entry.id||'display_base',url:entry.url,uncompressedBytes:(await fs.stat(src)).size,compressedBytes:bin.length,attributesByteExact:true,triangleTopologyExact:true,nodeTransformsExact:true,pinnedThree166Decoder:true,compressedViews};reports.push(result);console.log('MESHOPT',result.id,bin.length,'bytes',compressedViews,'views');
}
await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const report={compression:'gltf-transform EXT_meshopt_compression writer, NONE filters; no quantize/reorder/geometry transforms',encoderVersion:JSON.parse(await fs.readFile(path.join(path.resolve(deps),'node_modules/meshoptimizer/package.json'),'utf8')).version,pinnedDecoder:'Three.js0.166.1 addons/libs/meshopt_decoder.module.js',pinnedDecoderSha256:createHash('sha256').update(await fs.readFile(path.join(path.resolve(deps),'package/examples/jsm/libs/meshopt_decoder.module.js'))).digest('hex'),encoderFormatVersion:0,allTriangleTopologyExact:true,allAttributesByteExact:true,allStoredNodeTransformsExact:true,models:reports,totalUncompressedBytes:reports.reduce((n,r)=>n+r.uncompressedBytes,0),totalCompressedBytes:reports.reduce((n,r)=>n+r.compressedBytes,0)};
await fs.mkdir(path.dirname(reportPath),{recursive:true});await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
