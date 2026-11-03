// Workshop smoke test: loads the real page headlessly, drives the panel and
// checks the logic. Exit code 1 on any failure.
// Usage: node tools/workshop/smoke.mjs DEPS CHROME [SCREENSHOT_DIR]
import fs from 'node:fs/promises';
import path from 'node:path';
import {openViewer} from './page.mjs';

const [deps,chromium,shots]=process.argv.slice(2);
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.log(ok?'PASS':'FAIL',name,detail);};
if(shots)await fs.mkdir(shots,{recursive:true});

for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const tag=viewport.width>650?'desktop':'phone';
 const viewer=await openViewer({deps,chromium,viewport});
 const {page}=viewer;
 await page.waitForFunction(()=>!!window.lcWorkshop,null,{timeout:30000});
 const shot=async name=>{if(!shots)return;await page.waitForTimeout(1200);await page.screenshot({path:path.join(shots,`${tag}-${name}.png`)});};
 check(`${tag}: closed by default`,!(await page.evaluate(()=>document.body.classList.contains('workshop-open'))));
 if(tag==='desktop'){
  const logic=await page.evaluate(()=>{const w=window.lcWorkshop;return {
   base:w.fitCheck(),stockFront:w.tyreClearance(793,0)[0],mt35:w.tyreClearance(889,0),mt35lift:w.tyreClearance(889,76),big:w.tyreClearance(940,0),
   dims:w.dimensions(),baseDims:w.baseDims};});
  check('base build fits',logic.base.level==='ok',JSON.stringify(logic.base.tyres));
  check('stock front clearance plausible (40–90 mm)',logic.stockFront.mm>=40&&logic.stockFront.mm<=90,logic.stockFront.mm+' mm');
  check('35" tyre at stock height is flagged',logic.mt35.some(t=>t.status!=='ok'),JSON.stringify(logic.mt35));
  check('lift increases clearance',logic.mt35lift[0].mm>logic.mt35[0].mm,`${logic.mt35[0].mm} → ${logic.mt35lift[0].mm}`);
  check('37" tyre clashes at stock height',logic.big.some(t=>t.status==='clash'),JSON.stringify(logic.big));
  check('live dimensions match base at stock',JSON.stringify(logic.dims)===JSON.stringify(logic.baseDims),JSON.stringify(logic.dims)+' vs '+JSON.stringify(logic.baseDims));
  check('base body 5,000 × 1,930 × 2,297',logic.baseDims.length===5000&&logic.baseDims.height===1930&&logic.baseDims.width===2297,JSON.stringify(logic.baseDims));
 }
 await page.click('#workshopToggle');
 check(`${tag}: opens`,await page.evaluate(()=>document.body.classList.contains('workshop-open')));
 check(`${tag}: Parts row plus eleven categories listed`,(await page.locator('#workshop .ws-row[data-cat]').count())===11&&(await page.locator('#workshop .ws-row[data-parts]').count())===1);
 await shot('home');
 await page.click('#workshop [data-cat=stance]');
 await page.click('#workshop [data-opt=lift63]');
 const lifted=await page.evaluate(()=>({lift:window.lcBuild.getState().lift_mm,y:window.lcBuild.groups.body.position.y,wheels:window.lcBuild.groups.wheels.position.y}));
 check(`${tag}: 2.5" lift applies`,lifted.lift===63&&Math.abs(lifted.y-.063)<1e-9&&lifted.wheels===0,JSON.stringify(lifted));
 await shot('stance');
 await page.click('#workshop [data-home]');
 // Tyres and rims: two sections. Real LC200 fit rules apply; sizes without 3D models are listed as "soon".
 await page.click('#workshop [data-cat=tyres]');
 check(`${tag}: tyres: stock live, 3 soon, 3 won't fit on the stock rim`,(await page.locator('#workshop .ws-opt:not([disabled])').count())===1&&(await page.locator('#workshop .ws-opt.nofit').count())===3&&(await page.locator('#workshop .ws-soon',{hasText:'soon'}).count())===3);
 check(`${tag}: 35" says why it won't fit`,(await page.locator('#workshop [data-opt=mt35] .ws-v').innerText()).startsWith('Needs an 8.5–11″ wide rim'));
 await shot('tyres');
 await page.click('#workshop [data-home]');
 await page.click('#workshop [data-cat=rims]');
 check(`${tag}: rims: stock live, 3 soon`,(await page.locator('#workshop .ws-opt:not([disabled])').count())===1&&(await page.locator('#workshop .ws-opt.nofit').count())===0);
 const rules=await page.evaluate(()=>{const w=window.lcWorkshop,c=s=>w.wheelChecks({tyre:'stock',rim:'stock',...s});
  return {stock:c({}).notes,kmc35:c({tyre:'mt35',rim:'kmc'}).notes,stock35:c({tyre:'mt35'}).notes,steel35:c({tyre:'mt35',rim:'steel'}).notes,m285:c({tyre:'at285',rim:'method'}).notes};});
 check(`${tag}: rules: stock wheel has no notes`,rules.stock.length===0,JSON.stringify(rules.stock));
 check(`${tag}: rules: 35" on KMC fits, sticks out 29/34 mm`,rules.kmc35.length===1&&rules.kmc35[0].level==='tight'&&/29 mm \(front\), 34 mm \(rear\)/.test(rules.kmc35[0].text),JSON.stringify(rules.kmc35));
 check(`${tag}: rules: 35" refused on 7.5" and 8" rims`,rules.stock35[0]?.level==='clash'&&rules.steel35[0]?.level==='clash',JSON.stringify([rules.stock35,rules.steel35]));
 check(`${tag}: rules: 285/70 on Method ET0 sticks out 31/36 mm`,rules.m285.length===1&&/31 mm \(front\), 36 mm \(rear\)/.test(rules.m285[0].text),JSON.stringify(rules.m285));
 const refused=await page.evaluate(async()=>{try{await window.lcBuild.setState({tyre:'mt35',rim:'kmc'});return false;}catch{return window.lcBuild.getState().tyre==='stock';}});
 check(`${tag}: unbuilt tyre/rim refused by the viewer`,refused);
 await page.click('#workshop [data-home]');
 await page.click('#workshop [data-compare=base]');
 check(`${tag}: compare shows base`,(await page.evaluate(()=>window.lcBuild.getState().lift_mm))===0);
 await shot('compare-base');
 await page.click('#workshop [data-compare=build]');
 check(`${tag}: compare returns to build`,(await page.evaluate(()=>window.lcBuild.getState().lift_mm))===63);
 await page.click('#workshop [data-sheet]');
 const sheet=await page.evaluate(()=>window.lcWorkshop.dimensions());
 check(`${tag}: sheet height includes lift`,sheet.height===1993,JSON.stringify(sheet));
 await shot('sheet');
 await page.click('#workshop [data-share]');
 const hash=await page.evaluate(()=>decodeURIComponent(location.hash));
 check(`${tag}: share link carries the build`,hash==='#build={"lift_mm":63}',hash);
 await page.click('#workshop [data-reset]');
 check(`${tag}: reset to base`,(await page.evaluate(()=>window.lcBuild.getState().lift_mm))===0);
 // Parts: a real tap on the car opens that part; finishes, removal and sharing follow.
 await page.click('#workshop [data-home]');
 const target=await page.evaluate(()=>{const rect=document.getElementById('workshop').getBoundingClientRect(),w=window.lcWorkshop;
  const free={x0:innerWidth>650?rect.right+10:0,y1:innerWidth>650?innerHeight:rect.top-10};
  for(let y=80;y<free.y1;y+=6)for(let x=free.x0;x<innerWidth;x+=6){const piece=w.pieceFor(window.lcView.pick(x,y));if(piece?.id==='door_RL')return {x,y};}
  return null;});
 check(`${tag}: parts: rear left door found on screen`,!!target,JSON.stringify(target));
 if(target)await page.mouse.click(target.x,target.y);
 check(`${tag}: parts: tapping the car opens that part`,(await page.locator('#workshop .ws-title').innerText())==='Rear left door');
 check(`${tag}: parts: tapped part is highlighted`,await page.evaluate(()=>{let n=0;window.lcBuild.parts.get('door_RL').traverse(o=>{if(o.userData.pickOverlay)n++;});return n>0;}));
 await page.click('#workshop [data-finish="paint:gloss_black"]');
 const door=await page.evaluate(()=>({finish:window.lcBuild.getState().finish,colors:(()=>{const out=new Set();window.lcBuild.parts.get('door_RL').traverse(o=>{if(o.isMesh&&!o.userData.pickOverlay)for(const m of [].concat(o.material))if(m.userData.zone==='paint')out.add(m.color.getHexString());});return [...out];})()}));
 check(`${tag}: parts: gloss black door paint applied`,door.finish['door_RL:paint']==='gloss_black'&&door.colors.length&&door.colors.every(c=>c==='0b0d0f'),JSON.stringify(door));
 const logicParts=await page.evaluate(()=>{const w=window.lcWorkshop;return {interior:w.pieceFor({slot:'body_shell',zone:'interior'}),glass:w.pieceFor({slot:'door_FL',zone:'glass'})?.id,tyre:w.pieceFor({slot:'wheel_FL',zone:'tyre'})?.id,rim:w.pieceFor({slot:'wheel_FL',zone:'rim'})?.id,
  every:(()=>{const m=window.lcBuild.getManifest(),state=window.lcBuild.getState(),missing=[];for(const [slot,id]of Object.entries(state.slots)){if(!id)continue;const e=[m.base,...m.parts].find(p=>p.id===id);for(const zone of e.zones)if(zone!=='interior'&&!(slot==='body_shell'&&zone==='mirror')&&!w.pieceFor({slot,zone}))missing.push(slot+':'+zone);}return missing;})()};});
 check(`${tag}: parts: interior is never offered`,logicParts.interior===null);
 check(`${tag}: parts: glass → Windows, tyre → Tyres, rim → Rims`,logicParts.glass==='windows'&&logicParts.tyre==='tyres'&&logicParts.rim==='rims',JSON.stringify(logicParts));
 check(`${tag}: parts: every outside surface belongs to a part`,logicParts.every.length===0,logicParts.every.join(' '));
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-piece=badges]');
 await page.click('#workshop [data-remove=remove]');
 check(`${tag}: parts: badges come off`,await page.evaluate(()=>!window.lcBuild.parts.get('emblem_front').visible&&window.lcBuild.getState().hidden.includes('emblem_front')));
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-piece=windows]');
 await page.click('#workshop [data-finish="glass:tint_15"]');
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-home]');await page.click('#workshop [data-share]');
 const partsHash=JSON.parse(decodeURIComponent(await page.evaluate(()=>location.hash)).replace(/^#build=/,'')||'{}');
 check(`${tag}: parts: share link carries finishes and removed parts`,partsHash.finish?.['door_RL:paint']==='gloss_black'&&partsHash.finish?.['door_FL:glass']==='tint_15'&&partsHash.hidden?.includes('emblem_front'),JSON.stringify(partsHash));
 await page.click('#workshop [data-sheet]');await page.click('#workshop [data-reset]');
 check(`${tag}: parts: reset clears finishes and refits parts`,await page.evaluate(()=>{const s=window.lcBuild.getState();return !Object.keys(s.finish).length&&!s.hidden.includes('emblem_front')&&window.lcBuild.parts.get('emblem_front').visible;}));
 await page.keyboard.press('Escape');
 check(`${tag}: Escape closes`,!(await page.evaluate(()=>document.body.classList.contains('workshop-open'))));
 check(`${tag}: no page errors`,viewer.errors.length===0,viewer.errors.join(' | '));
 await viewer.close();
}
const failed=results.filter(r=>!r.ok);
console.log(`${results.length-failed.length}/${results.length} workshop checks pass`);
process.exit(failed.length?1:0);
