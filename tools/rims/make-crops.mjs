// Actual 3x enlargement of fixed on-car source-frame crops. No references enter git.
import fs from'node:fs/promises';import{createRequire}from'node:module';
const[deps,work,out]=process.argv.slice(2),sharp=createRequire(deps+'/package.json')('sharp'),rows=JSON.parse(await fs.readFile(work+'/gap-proof.json'));await fs.mkdir(out,{recursive:true});
const labels={stock:'Stock',kmc:'KM720 · anthracite',method:'MR705 · titanium',steel:'Shanaber · silver'};
for(const studio of ['cream'])for(const corner of ['FL','RR']){
 const panels=[];for(const[i,rim]of['stock','kmc','method','steel'].entries()){
  const row=rows.find(r=>r.studio===studio&&r.corner===corner&&r.rim===rim),left=Math.max(0,Math.min(1120,Math.round(row.pixel[0])-160)),top=Math.max(0,Math.min(700,Math.round(row.pixel[1])-150));
  row.crop={left,top,width:320,height:300,scale:3};const b=await sharp(work+'/'+row.name+'.png').extract({left,top,width:320,height:300}).resize(960,900).png().toBuffer();await fs.writeFile(out+'/'+row.name+'-3x.png',b);panels.push({input:b,left:i*960,top:0});
 }
 const text=Object.entries(labels).map(([k,l],i)=>`<text x="${i*960+480}" y="35">${l}</text>`).join('');
 panels.push({input:Buffer.from(`<svg width="3840" height="54"><rect width="3840" height="54" fill="#ebebe9"/><g fill="#34383c" font-family="sans-serif" text-anchor="middle" font-size="28">${text}</g></svg>`),left:0,top:900});
 await sharp({create:{width:3840,height:954,channels:3,background:'#ebebe9'}}).composite(panels).png().toFile(out+'/comparison-'+studio+'-'+corner+'.png');
}
await fs.writeFile(work+'/gap-proof.json',JSON.stringify(rows,null,2)+'\n');console.log('Six comparison sheets and 24 crops');
