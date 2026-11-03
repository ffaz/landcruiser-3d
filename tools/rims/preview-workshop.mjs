import{openViewer}from'../workshop/page.mjs';
const[deps,chromium,output]=process.argv.slice(2),v=await openViewer({deps,chromium});
try{
 await v.page.waitForFunction(()=>!!window.lcWorkshop);
 await v.page.click('#workshopToggle');await v.page.click('#workshop [data-cat=wheels]');await v.page.click('#workshop [data-opt=ht26570]');
 await v.page.click('#workshop [data-home]');await v.page.click('#workshop [data-cat=rims]');await v.page.click('#workshop [data-opt=rim_steel]');
 await v.page.waitForTimeout(3500);await v.page.screenshot({path:output,timeout:120000,animations:'disabled'});
 if(v.errors.length)throw Error(v.errors.join('; '));console.log('Workshop UI captured; zero console errors');
}finally{await v.close();}
