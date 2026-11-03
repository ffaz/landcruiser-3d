// Integration check: click the real workshop choices, exercise studios, reset to stock.
import fs from 'node:fs/promises';
import {openViewer} from '../workshop/page.mjs';
const [deps,chromium,output]=process.argv.slice(2),results=[];
const viewer=await openViewer({deps,chromium});
const check=(name,ok,detail)=>{results.push({name,pass:!!ok,detail});if(!ok)throw Error(name+': '+JSON.stringify(detail));};
try {
 const {page}=viewer;
 await page.waitForFunction(()=>!!window.lcWorkshop);
 const base=await page.evaluate(()=>lcBuild.getState());
 await page.click('#workshopToggle');await page.click('#workshop [data-cat=wheels]');
 for(const id of ['at26570','ht26570']) {
  check(id+' available',await page.locator('#workshop [data-opt='+id+']').isEnabled());
  await page.click('#workshop [data-opt='+id+']');
  const state=await page.evaluate(()=>({state:lcBuild.getState(),fit:lcWorkshop.fitCheck(),body:lcBuild.groups.body.position.y,wheels:lcBuild.groups.wheels.position.y}));
  check(id+' installs four wheels',['FL','FR','RL','RR'].every(c=>state.state.slots['wheel_'+c]==='wheel_'+c+'_'+id),state.state.slots);
  check(id+' static fit',state.fit.level==='ok'&&state.fit.tyre_mm===802.8,state.fit);
  check(id+' rigid ride adjustment',Math.abs(state.wheels-.0049)<1e-6&&Math.abs(state.body-.0049)<1e-6,state);
  for(let i=0;i<3;i++)await page.click('#bgToggle');
 }
 await page.click('#workshop [data-home]');
 await page.click('#workshop [data-sheet]');
 await page.click('#workshop [data-reset]');
 const reset=await page.evaluate(()=>lcBuild.getState());
 check('stock reset',JSON.stringify(reset)===JSON.stringify(base),reset);
 check('no console errors',viewer.errors.length===0,viewer.errors);
} finally {await viewer.close();await fs.writeFile(output,JSON.stringify({results,consoleErrors:viewer.errors},null,2)+'\n');}
console.log(results.length+'/'+results.length+' tyre workshop checks passed');
