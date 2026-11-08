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
 check(`${tag}: tyres: stock plus five approved, three future sizes won't fit the stock rim`,(await page.locator('#workshop .ws-opt:not([disabled])').count())===6&&(await page.locator('#workshop .ws-opt.nofit').count())===3);
 check(`${tag}: 35" says why it won't fit`,(await page.locator('#workshop [data-opt=mt35] .ws-v').innerText()).startsWith('Needs an 8.5–11″ wide rim'));
 await shot('tyres');
 await page.click('#workshop [data-home]');
 await page.click('#workshop [data-cat=rims]');
 check(`${tag}: rims: stock, Method and Shanaber live; KMC disabled`,(await page.locator('#workshop .ws-opt:not([disabled])').count())===3&&(await page.locator('#workshop [data-opt=kmc]').isDisabled())&&(await page.locator('#workshop .ws-opt.nofit').count())===0);
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
  for(let y=80;y<free.y1;y+=6)for(let x=free.x0;x<innerWidth;x+=6){const piece=w.pieceFor(window.lcView.pick(x,y));if(piece?.id==='door_panel_RL')return {x,y};}
  return null;});
 check(`${tag}: parts: rear left door found on screen`,!!target,JSON.stringify(target));
 if(target)await page.mouse.click(target.x,target.y);
 check(`${tag}: parts: tapping the car opens that part`,(await page.locator('#workshop .ws-title').innerText())==='Rear left door');
 check(`${tag}: parts: tapped part is highlighted`,await page.evaluate(()=>{let n=0;window.lcBuild.parts.get('door_RL').traverse(o=>{if(o.userData.pickOverlay)n++;});return n>0;}));
 const meshesOf=`(id)=>{const out=[];for(const root of window.lcBuild.parts.values())root.traverse(o=>{if(o.isMesh&&!o.userData.pickOverlay&&o.userData.piece===id)out.push(o);});return out;}`;
 const colours=id=>page.evaluate(([src,id])=>{const meshesOf=eval(src);return [...new Set(meshesOf(id).flatMap(o=>[].concat(o.material).filter(m=>!['glass','mirror','lamp_clear','lamp_red','lamp_orange'].includes(m.userData.zone)).map(m=>m.color.getHexString())))];},[meshesOf,id]);
 const handlesBefore=await colours('door_handles');
 await page.click('#workshop [data-lookmat=gloss]');
 await page.click('#workshop [data-lookcolor="#15191d"]');
 const door={look:await page.evaluate(()=>window.lcBuild.getState().look),colors:await colours('door_panel_RL'),handles:await colours('door_handles')};
 check(`${tag}: parts: gloss + black swatch on the tapped door`,door.look.door_panel_RL?.material==='gloss'&&door.look.door_panel_RL?.color==='#15191d'&&door.colors.length&&door.colors.every(c=>c==='15191d'),JSON.stringify(door));
 check(`${tag}: parts: the door's handle keeps its own colour`,JSON.stringify(door.handles)===JSON.stringify(handlesBefore),JSON.stringify(door.handles));
 const split=await page.evaluate(src=>{const meshesOf=eval(src),w=window.lcWorkshop,missing=[],orphans=[];
  const state=window.lcBuild.getState();
  for(const piece of w.data.pieces)if(piece.match.some(rule=>state.slots[rule.slot])&&!window.lcView.pieceZones(piece.id).length)missing.push(piece.id);
  for(const [id,root] of window.lcBuild.parts){if(!root.visible)continue;root.traverseVisible(o=>{if(!o.isMesh||o.userData.pickOverlay)return;const zone=[].concat(o.material)[0].userData.zone;
   if(zone!=='interior'&&!(id==='body_shell'&&zone==='mirror')&&!o.userData.piece)orphans.push(id+'/'+o.name);});}
  const one=id=>meshesOf(id).map(o=>o.parent.name||o.name);
  return {missing,orphans,interior:w.pieceFor({slot:'body_shell',zone:'interior'}),glass:meshesOf('windows').some(o=>o.parent?.name==='door_FL'||o.name==='windowglass_39'),
   lip:meshesOf('front_lip').length,fog:meshesOf('fog_lamps').length,chrome:meshesOf('headlamp_chrome').length,heads:meshesOf('headlamps').length,
   rearLip:meshesOf('rear_lip').length,rearLamps:meshesOf('rear_bumper_lamps').length,v8:meshesOf('badge_v8').map(o=>o.name),gxr:meshesOf('badge_gxr').length,garnish:meshesOf('rear_garnish').map(o=>o.name)};},meshesOf);
 check(`${tag}: parts: every piece with a fitted slot has surfaces on the car`,split.missing.length===0,split.missing.join(' '));
 check(`${tag}: parts: every outside surface belongs to a piece`,split.orphans.length===0,split.orphans.slice(0,8).join(' '));
 check(`${tag}: parts: interior is never offered`,split.interior===null);
 check(`${tag}: parts: lips, fog lamps, headlamp chrome and bumper lamps are their own parts`,split.lip&&split.fog&&split.chrome&&split.heads&&split.rearLip&&split.rearLamps,JSON.stringify(split));
 check(`${tag}: parts: badges are separate (V8, GX.R, garnish)`,new Set(split.v8).size===2&&split.gxr>0&&split.garnish.join()==='Garnish',JSON.stringify({v8:split.v8,gxr:split.gxr,garnish:split.garnish}));
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-piece=mirror_caps]');
 await page.click('#workshop [data-lookmat=carbon]');
 const carbon=await page.evaluate(src=>{const meshesOf=eval(src);const m=meshesOf('mirror_caps').flatMap(o=>[].concat(o.material));return m.length&&m.every(x=>x.userData.look==='carbon'&&x.customProgramCacheKey().includes('carbon'));},meshesOf);
 check(`${tag}: parts: carbon fibre on the mirror caps`,carbon);
 await page.evaluate(()=>{const input=document.querySelector('#workshop [data-lookpick]');input.value='#2a6f4e';input.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>window.lcBuild.getState().look.mirror_caps?.color==='#2a6f4e',null,{timeout:5000}).catch(()=>{});
 check(`${tag}: parts: free colour picker recolours the part`,await page.evaluate(()=>JSON.stringify(window.lcBuild.getState().look.mirror_caps))==='{"material":"carbon","color":"#2a6f4e"}');
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-piece=toyota_front]');
 await page.click('#workshop [data-remove=remove]');
 const removed=await page.evaluate(src=>{const meshesOf=eval(src);return {hidden:window.lcBuild.getState().hidden,off:meshesOf('toyota_front').every(o=>!o.visible),grille:meshesOf('front_grille').every(o=>o.visible)};},meshesOf);
 check(`${tag}: parts: front Toyota emblem comes off on its own`,removed.hidden.includes('toyota_front')&&removed.off&&removed.grille,JSON.stringify(removed));
 await page.click('#workshop [data-remove=refit]');
 check(`${tag}: parts: and refits`,await page.evaluate(src=>{const meshesOf=eval(src);return !window.lcBuild.getState().hidden.includes('toyota_front')&&meshesOf('toyota_front').every(o=>o.visible);},meshesOf));
 await page.click('#workshop [data-remove=remove]');
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-piece=windows]');
 await page.click('#workshop [data-finish="glass:tint_15"]');
 await page.click('#workshop [data-parts]');await page.click('#workshop [data-home]');await page.click('#workshop [data-share]');
 const partsHash=JSON.parse(decodeURIComponent(await page.evaluate(()=>location.hash)).replace(/^#build=/,'')||'{}');
 check(`${tag}: parts: share link carries looks, tints and removed parts`,partsHash.look?.door_panel_RL?.material==='gloss'&&partsHash.look?.mirror_caps?.material==='carbon'&&partsHash.finish?.['windows:glass']==='tint_15'&&partsHash.hidden?.includes('toyota_front'),JSON.stringify(partsHash));
 const reloaded=await page.evaluate(async hash=>{const s=await window.lcBuild.replaceState(hash);return s.look.mirror_caps?.color==='#2a6f4e'&&s.hidden.includes('toyota_front');},partsHash);
 check(`${tag}: parts: a shared build loads back`,reloaded);
 check(`${tag}: parts: a bad look is refused`,await page.evaluate(()=>window.lcBuild.setState({look:{mirror_caps:{material:'gold'}}}).then(()=>false,()=>true)));
 await page.click('#workshop [data-sheet]');await page.click('#workshop [data-reset]');
 check(`${tag}: parts: reset clears looks and finishes and refits parts`,await page.evaluate(src=>{const meshesOf=eval(src),s=window.lcBuild.getState();return !Object.keys(s.finish).length&&!Object.keys(s.look).length&&!s.hidden.length&&meshesOf('toyota_front').every(o=>o.visible);},meshesOf));
 await page.keyboard.press('Escape');
 check(`${tag}: Escape closes`,!(await page.evaluate(()=>document.body.classList.contains('workshop-open'))));
 check(`${tag}: no page errors`,viewer.errors.length===0,viewer.errors.join(' | '));
 await viewer.close();
}
const failed=results.filter(r=>!r.ok);
console.log(`${results.length-failed.length}/${results.length} workshop checks pass`);
process.exit(failed.length?1:0);
