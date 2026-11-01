// Builds one review sheet per shot from three captures in AUDIT_DIR/{orig,live,candidate}.
// Row 1: ORIGINAL | LIVE | CANDIDATE, half scale. Row 2: LIVE with original→live detail changes (red) |
// CANDIDATE with live→candidate changes (blue) | CANDIDATE with original→candidate changes (green).
// "Detail" = luminance minus its local mean, so broad lighting changes cancel and new lines, bands and edges
// stand out. Also writes AUDIT_DIR/changes.json (changed-block counts per shot).
// Usage: node sheet.mjs DEPS AUDIT_DIR
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const [deps,dir]=process.argv.slice(2);
const {PNG}=createRequire(path.join(deps,'package.json'))('pngjs');
const versions=['orig','live','candidate'],out=path.join(dir,'sheets');
fs.mkdirSync(out,{recursive:true});
const shots=JSON.parse(fs.readFileSync(path.join(dir,'orig','capture.json'),'utf8')).shots;
const lum=(d,i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
const B=16,TH=5,R=8; // block size (full-res px), mean |Δdetail| threshold, blur radius
// Detail = luminance minus its local mean, so broad lighting changes cancel and new lines/bands/edges remain.
function detail(img){const W=img.width,H=img.height,L=new Float64Array(W*H),I=new Float64Array((W+1)*(H+1)),D=new Float32Array(W*H);
 for(let i=0;i<W*H;i++)L[i]=lum(img.data,i*4);
 for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=L[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+row;}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const x0=Math.max(0,x-R),x1=Math.min(W,x+R+1),y0=Math.max(0,y-R),y1=Math.min(H,y+R+1);
  const m=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/((x1-x0)*(y1-y0));D[y*W+x]=L[y*W+x]-m;}
 return D;}
const cache=new Map(),det=img=>{if(!cache.has(img))cache.set(img,detail(img));return cache.get(img);};
function blocks(a,b){const da=det(a),db=det(b),res=[];for(let by=0;by+B<=a.height;by+=B)for(let bx=0;bx+B<=a.width;bx+=B){let s=0,sd=0;
 for(let y=by;y<by+B;y++)for(let x=bx;x<bx+B;x++){const i=y*a.width+x,d=db[i]-da[i];s+=Math.abs(d);sd+=d;}
 const m=s/(B*B);if(m>TH)res.push({x:bx,y:by,m,signed:sd/(B*B)});}return res;}
const summary=[];
for(const shot of shots){
 const imgs=versions.map(v=>PNG.sync.read(fs.readFileSync(path.join(dir,v,shot.file+'.png'))));
 cache.clear();const [o,l,c]=imgs,W=o.width,H=o.height,w=W>>1,h=H>>1,gap=10,label=24;
 const ol=blocks(o,l),lc=blocks(l,c),oc=blocks(o,c);
 // Row 1 clean; row 2 outlined (see header).
 const rowH=h+label,sheet=new PNG({width:w*3+gap*2,height:rowH*2+gap});sheet.data.fill(255);
 const paste=(img,col,row)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const di=((y+label+row*(rowH+gap))*sheet.width+col*(w+gap)+x)*4;
  for(let k=0;k<3;k++){let s=0;for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])s+=img.data[(((2*y+dy)*W)+2*x+dx)*4+k];sheet.data[di+k]=s/4;}sheet.data[di+3]=255;}};
 imgs.forEach((img,n)=>paste(img,n,0));paste(l,0,1);paste(c,1,1);paste(c,2,1);
 const box=(col,row,b,rgb)=>{const x0=col*(w+gap)+(b.x>>1),y0=row*(rowH+gap)+label+(b.y>>1),s=B>>1;
  for(let t=0;t<=s;t++)for(const [x,y] of [[x0+t,y0],[x0+t,y0+s],[x0,y0+t],[x0+s,y0+t]]){if(x>=sheet.width||y>=sheet.height)continue;const i=(y*sheet.width+x)*4;sheet.data[i]=rgb[0];sheet.data[i+1]=rgb[1];sheet.data[i+2]=rgb[2];}};
 for(const b of ol)box(0,1,b,[230,20,20]);
 for(const b of lc)box(1,1,b,[20,90,240]);
 for(const b of oc)box(2,1,b,[20,160,60]);
 // Tiny label bars: grey / red / blue so panels are identifiable without text rendering.
 [[150,150,150],[230,20,20],[20,90,240]].forEach((rgb,n)=>{for(let y=4;y<label-6;y++)for(let x=n*(w+gap);x<n*(w+gap)+60;x++){const i=(y*sheet.width+x)*4;sheet.data[i]=rgb[0];sheet.data[i+1]=rgb[1];sheet.data[i+2]=rgb[2];}});
 fs.writeFileSync(path.join(out,shot.file+'.png'),PNG.sync.write(sheet));
 const score=a=>({blocks:a.length,darker:a.filter(b=>b.signed<0).length,brighter:a.filter(b=>b.signed>0).length,peak:+Math.max(0,...a.map(b=>b.m)).toFixed(1)});
 summary.push({shot:shot.file,origToLive:score(ol),liveToCandidate:score(lc),origToCandidate:score(oc)});
}
fs.writeFileSync(path.join(dir,'changes.json'),JSON.stringify(summary,null,1));
console.log(summary.map(s=>`${s.shot.padEnd(26)} o→l ${String(s.origToLive.blocks).padStart(5)}  l→c ${String(s.liveToCandidate.blocks).padStart(5)}  o→c ${String(s.origToCandidate.blocks).padStart(5)}`).join('\n'));
