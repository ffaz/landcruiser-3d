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
 check(`${tag}: ten categories listed`,(await page.locator('#workshop .ws-row').count())===10);
 await shot('home');
 await page.click('#workshop [data-cat=stance]');
 await page.click('#workshop [data-opt=lift63]');
 const lifted=await page.evaluate(()=>({lift:window.lcBuild.getState().lift_mm,y:window.lcBuild.groups.body.position.y,wheels:window.lcBuild.groups.wheels.position.y}));
 check(`${tag}: 2.5" lift applies`,lifted.lift===63&&Math.abs(lifted.y-.063)<1e-9&&lifted.wheels===0,JSON.stringify(lifted));
 await shot('stance');
 await page.click('#workshop [data-home]');
 await page.click('#workshop [data-cat=wheels]');
 const missingTyres=await page.evaluate(()=>{const ids=new Set(lcBuild.getManifest().parts.map(p=>p.id));return lcWorkshop.data.categories.find(c=>c.id==='wheels').options.filter(o=>(o.requires||[]).some(id=>!ids.has(id))).length});
 check(`${tag}: unbuilt tyres disabled`,(await page.locator('#workshop .ws-opt[disabled]').count())===missingTyres);
 await shot('wheels');
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
 await page.keyboard.press('Escape');
 check(`${tag}: Escape closes`,!(await page.evaluate(()=>document.body.classList.contains('workshop-open'))));
 check(`${tag}: no page errors`,viewer.errors.length===0,viewer.errors.join(' | '));
 await viewer.close();
}
const failed=results.filter(r=>!r.ok);
console.log(`${results.length-failed.length}/${results.length} workshop checks pass`);
process.exit(failed.length?1:0);
