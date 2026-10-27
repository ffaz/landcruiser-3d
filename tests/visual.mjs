#!/usr/bin/env node
// Test dependencies, local Three.js and the instrumented page stay outside the app.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {serveAsset,snapshotAssets,routeTestPath,testBasePath} from './serve-assets.mjs';

const run = promisify(execFile);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = {source: path.join(repo, 'index.html'), output: path.join(os.tmpdir(), 'lc200-visual'),
  assetRoot: repo, mode: 'after', deps: path.join(os.tmpdir(), 'lc200-visual-deps'), viewsOnly: false,
  checksOnly: false, bothStudios: false, resume: false};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (key === '--views-only') options.viewsOnly = true;
  else if (key === '--checks-only') options.checksOnly = true;
  else if (key === '--both-studios') options.bothStudios = true;
  else if (key === '--resume') options.resume = true;
  else if (['--source', '--output', '--mode', '--deps', '--three-dir', '--chromium', '--asset-root'].includes(key)) {
    if (!process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${key}`);
    options[key.slice(2)] = process.argv[++i];
  } else throw new Error(`Unknown option: ${key}`);
}
if (!['before', 'after'].includes(options.mode)) throw new Error('--mode must be before or after');
if (options.viewsOnly && options.checksOnly) throw new Error('--views-only and --checks-only are mutually exclusive');
for (const key of ['source', 'output', 'deps']) options[key] = path.resolve(options[key]);
const output = path.join(options.output, options.mode);
await fs.mkdir(output, {recursive: true});
await fs.mkdir(options.deps, {recursive: true});
const exists = async p => !!(await fs.stat(p).catch(() => null));
const npm = async args => run('npm', [...args, '--cache', path.join(options.deps, 'npm-cache')], {maxBuffer: 4 * 1024 * 1024});
const require = createRequire(path.join(options.deps, 'package.json'));
let playwright;
try { playwright = require('playwright'); }
catch {
  console.log('Installing Playwright into', options.deps);
  await npm(['install', '--prefix', options.deps, '--no-audit', '--no-fund', 'playwright']);
  playwright = require('playwright');
}
const three = path.resolve(options['three-dir'] || path.join(options.deps, 'three', 'package'));
if (!await exists(path.join(three, 'build', 'three.module.js'))) {
  if (options['three-dir']) throw new Error(`No extracted Three.js package at ${three}`);
  const destination = path.dirname(three);
  await fs.mkdir(destination, {recursive: true});
  console.log('Packing pinned three@0.166.1 for local testing');
  const {stdout} = await npm(['pack', 'three@0.166.1', '--pack-destination', destination, '--json', '--silent']);
  const [{filename}] = JSON.parse(stdout);
  await run('tar', ['-xzf', path.join(destination, filename), '-C', destination]);
}
const packageInfo = JSON.parse(await fs.readFile(path.join(three, 'package.json'), 'utf8'));
if (packageInfo.version !== '0.166.1') throw new Error(`Expected Three.js 0.166.1, found ${packageInfo.version}`);

let html = await fs.readFile(options.source, 'utf8');
const sourceSha256 = createHash('sha256').update(html).digest('hex');
const initialAssets=await snapshotAssets(options['asset-root']||options.assetRoot);
const assetSha256=createHash('sha256').update(JSON.stringify(initialAssets)).digest('hex');
const cdn = 'https://cdn.jsdelivr.net/npm/three@0.166.1/';
if (!html.includes(cdn)) throw new Error('Expected the pinned CDN importmap in the source file');
html = html.replaceAll(cdn, '/three/');
// Run the real UI and camera tween without filling SwiftShader's GPU queue with
// redundant intermediate frames. Each saved screenshot renders the product's
// final frame; these wrappers exist only in this temporary test page.
html = html.replace('requestAnimationFrame(animate);',
  'if(window.__visualPaused)return; window.__visualRaf=requestAnimationFrame(animate);');
const end = html.lastIndexOf('</script>');
if (end < 0) throw new Error('No module script found for test-only instrumentation');
html = html.slice(0, end) + `
window.__visualPaused=false;
window.__visualSuppressRender=true;
const __visualOriginalRender=renderer.render.bind(renderer);
renderer.render=(...args)=>{if(!window.__visualSuppressRender)return __visualOriginalRender(...args)};
window.__visualTest={camera,controls,car,paint,DIM,scene,renderer,THREE,target,
 plinth:typeof plinth==='undefined'?null:plinth,
 getBAKEDLOOK:()=>typeof BAKED_LOOK==='undefined'?null:BAKED_LOOK,
 toyMaterials:()=>typeof BAKED_LOOK==='undefined'?null:({paint:{roughness:paint.roughness,clearcoat:paint.clearcoat,clearcoatRoughness:paint.clearcoatRoughness},glass:windowGlass.color.getHexString(),chromeRoughness:chrome.roughness,rimColor:rimMat.color.getHexString()}),
 cameraSafety:typeof cameraSafety==='undefined'?null:cameraSafety,
 enforceCameraSafety:typeof enforceCameraSafety==='function'?enforceCameraSafety:()=>{},
 get fittedDistance(){return typeof fittedDistance==='undefined'?controls.getDistance():fittedDistance},
 updateClipping:typeof updateClipping==='function'?updateClipping:()=>{},
 centreProjection:typeof centreProjection==='function'?centreProjection:()=>{},
 renderFrame:typeof renderFrame==='function'?renderFrame:()=>renderer.render(scene,camera),
 projectedBounds:typeof projectedBounds==='function'?projectedBounds:null,
 isTweening:()=>typeof tween!=='undefined'&&!!tween,
 pause:()=>{window.__visualPaused=true;cancelAnimationFrame(window.__visualRaf)},
 resume:()=>{if(window.__visualPaused){window.__visualPaused=false;animate()}},
 draw:()=>{window.__visualSuppressRender=false;try{
  if(typeof renderFrame==='function')renderFrame();else renderer.render(scene,camera);
 }finally{window.__visualSuppressRender=true}}
};
` + html.slice(end);
html+='\n<!-- Test asset snapshot '+assetSha256+' -->\n';
const testPage = path.join(output, 'test.html');
const previousPage = await fs.readFile(testPage, 'utf8').catch(() => null);
const resume = options.resume && previousPage === html;
if (options.resume && !resume) console.log('Resume disabled: no matching previous test.html; capturing every view');
await fs.writeFile(testPage, html);

const server = createServer(async (request, response) => {
  try {
    const pathname = routeTestPath(decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if(pathname===null){response.writeHead(404);response.end('Use the project subpath');return;}
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (pathname === '/' || pathname === '/test.html') {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); response.end(html); return;
    }
    await serveAsset(response,pathname,{assetRoot:options['asset-root']||options.assetRoot,threeRoot:three});
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${testBasePath}test.html`;
const errors = [], checks = {}, snapshots = [], reusedSnapshots = [];
let browser;
try {
  const executablePath = options.chromium || process.env.CHROMIUM_PATH ||
    (await exists('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await playwright.chromium.launch({executablePath, args: [
    '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'
  ]});
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
  page.on('pageerror', e => errors.push({type: 'pageerror', message: e.message}));
  page.on('console', m => { if (m.type() === 'error') errors.push({type: 'console', message: m.text()}); });
  page.on('requestfailed', r => errors.push({type: 'request', url: r.url(), message: r.failure()?.errorText}));
  await page.goto(url, {timeout: 120000});
  await page.waitForFunction(()=>document.querySelector('#loader.hidden')||document.querySelector('#loaderror')?.style.display==='block',null,{timeout:120000});
  if(!await page.locator('#loader.hidden').count())throw Error('Viewer startup failed; see the recorded browser errors');
  await page.waitForFunction(() => !!window.__visualTest, null, {timeout: 120000});
  const capture = async name => {
    if (options.checksOnly) return;
    const filename = `${name}.png`, destination = path.join(output, filename);
    if (resume && (await fs.stat(destination).catch(() => null))?.size > 0) {
      snapshots.push(filename); reusedSnapshots.push(filename);
      console.log('Reused matching-page capture', options.mode, name); return;
    }
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await page.evaluate(() => window.__visualTest.draw());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({path: destination, timeout: 120000, animations: 'disabled'});
    snapshots.push(filename); console.log('Captured', options.mode, name);
  };
  const settleView = async view => {
    await page.evaluate(v => {
      window.__visualTest.resume(); document.querySelector(`[data-view=${v}]`).click();
    }, view);
    await page.waitForTimeout(2500);
    await page.waitForFunction(() => !window.__visualTest.isTweening(), null, {timeout: 60000});
    await page.evaluate(() => window.__visualTest.pause());
  };
  const initialStudio = await page.evaluate(() => document.body.classList.contains('cream') ? 'cream' : 'slate');
  checks.defaultCream = options.mode === 'before' || initialStudio === 'cream';
  const setStudio = async studio => {
    if (await page.evaluate(s => document.body.classList.contains('cream') !== (s === 'cream'), studio)) {
      await page.evaluate(() => document.querySelector('#bgToggle').click());
    }
  };
  let initialSide;
  const presetObservations = [];
  // The real preset buttons, tween and projection fitting still run normally.
  // Only intermediate GPU draws are suppressed in the temporary page.
  for (const studio of options.bothStudios ? ['cream', 'slate'] : [initialStudio]) {
    await setStudio(studio);
    for (const view of ['front', 'side', 'rear', 'quarter', 'top']) {
      await settleView(view);
      const observation = await page.evaluate(v => {
        const t = window.__visualTest;
        const b = t.projectedBounds?.(t.camera);
        return {view: v, active: document.querySelector(`[data-view=${v}]`).classList.contains('active'),
          position: t.camera.position.toArray(), target: t.controls.target.toArray(),
          distance: t.controls.getDistance(), zoom: t.camera.zoom,
          level: Math.abs(t.camera.position.y - t.controls.target.y) < 0.00001,
          safePolar:!t.cameraSafety || !Number.isFinite(t.cameraSafety.maxPolarAngle) || t.controls.getPolarAngle()<=t.cameraSafety.maxPolarAngle+1e-6,
          minCameraY:t.cameraSafety?.minCameraY??null,
          aboveMinimum:!Number.isFinite(t.cameraSafety?.minCameraY)||t.camera.position.y>=t.cameraSafety.minCameraY-1e-6,
          widthFraction: b ? (b.maxX - b.minX) / 2 : null};
      }, view);
      presetObservations.push({studio, ...observation});
      if (view === 'side' && !initialSide) initialSide = observation;
      await capture(options.bothStudios ? `${studio}/${view}` : view);
    }
  }
  checks.presetButtons = presetObservations.every(o => o.active);
  const hasCameraSafety=await page.evaluate(()=>!!window.__visualTest.cameraSafety);
  if(presetObservations.some(o=>o.minCameraY!==null)){
    checks.sideLevel=presetObservations.filter(o=>o.view==='side').every(o=>o.level&&Math.abs(o.position[1]-.40)<.002);
    checks.cameraMinHeight=presetObservations.every(o=>o.aboveMinimum);
    checks.frontRearElevation=presetObservations.filter(o=>['front','rear'].includes(o.view)).every(o=>Math.abs(Math.atan2(o.position[1]-o.target[1],Math.hypot(o.position[0]-o.target[0],o.position[2]-o.target[2]))*180/Math.PI-1.432096184)<.01);
    // Measured from commit1169290 at this harness's1440x1000 viewport.
    const legacyDistances={front:8.546460333579578,side:12.924356919649727,rear:9.012538234850643,quarter:11.451917407298048,top:12.365216278656563};
    checks.legacyPresetDistances=presetObservations.every(o=>Math.abs(o.distance-legacyDistances[o.view])<1e-6);
  }
  else if(hasCameraSafety)checks.sideSafePolar=presetObservations.filter(o=>o.view==='side').every(o=>o.safePolar);
  else checks.sideLevel=options.mode==='before'||presetObservations.filter(o=>o.view==='side').every(o=>o.level);
  checks.heroFraming = options.mode === 'before' || presetObservations
    .filter(o => o.view === 'side' || o.view === 'quarter')
    .every(o => o.widthFraction !== null && o.widthFraction >= .75 && o.widthFraction <= .85);
  checks.presetObservations = presetObservations;
  await setStudio(initialStudio);
  if (!options.viewsOnly) {
    await settleView('quarter');
    // Preserve the real fitted long-lens radius/elevation. The old fixed 9 m
    // orbit would crop a PerspectiveCamera with a 20 degree field of view.
    const orbitPose = await page.evaluate(() => {
      const t = window.__visualTest, d = t.camera.position.clone().sub(t.controls.target);
      return {distance: t.controls.getDistance(), fittedDistance: t.fittedDistance,
        horizontal: Math.hypot(d.x, d.z), height: d.y};
    });
    await page.evaluate(() => {
      window.__visualTest.resume(); document.querySelector('#rotate').click();
    });
    const start = await page.evaluate(() => window.__visualTest.controls.getAzimuthalAngle());
    await page.waitForFunction(start =>
      Math.abs(window.__visualTest.controls.getAzimuthalAngle() - start) > 0.00001,
    start, {timeout: 60000});
    checks.autoRotate = await page.evaluate(start => {
      const {controls} = window.__visualTest;
      return {enabled: controls.autoRotate, moved: Math.abs(controls.getAzimuthalAngle() - start) > 0.00001};
    }, start);
    await page.evaluate(() => window.__visualTest.pause());
    if (!options.checksOnly) {
      for (let i = 0; i < 8; i++) {
        await page.evaluate(({i, pose}) => {
          const t = window.__visualTest, a = i * Math.PI / 4;
          t.camera.position.copy(t.controls.target).add(new t.THREE.Vector3(
            Math.sin(a) * pose.horizontal, pose.height, Math.cos(a) * pose.horizontal));
          const damping = t.controls.enableDamping;
          t.controls.enableDamping = false; t.controls.update(0); t.controls.enableDamping = damping;
          t.updateClipping(); t.centreProjection();
        }, {i, pose: orbitPose});
        await capture(`orbit-${String(i * 45).padStart(3, '0')}`);
      }
    }
    checks.orbitPose = orbitPose;
    await page.evaluate(() => document.querySelector('#rotate').click());
    const paintChecks = [];
    const paintColors=await page.locator('[data-paint]').evaluateAll(nodes=>nodes.map(el=>el.dataset.paint));
    checks.paintColors=paintColors;
    for (const color of paintColors) {
      await page.evaluate(c => document.querySelector(`[data-paint="${c}"]`).click(), color);
      paintChecks.push(await page.evaluate(c => {
        const t = window.__visualTest;
        return t.paint.color.getHexString() === c.slice(1) && document.querySelector('#customPaint').value === c;
      }, color));
    }
    checks.paintSwatches = paintChecks.every(Boolean);
    await page.evaluate(() => {
      const input = document.querySelector('#customPaint'); input.value = '#aabbcc';
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    checks.customPaint = await page.evaluate(() => window.__visualTest.paint.color.getHexString() === 'aabbcc');
    await page.evaluate(() => document.querySelector('#bgToggle').click());
    const alternate = await page.evaluate(() => ({cream: document.body.classList.contains('cream'),
      label: document.querySelector('#bgLabel').textContent,
      pressed: document.querySelector('#bgToggle').getAttribute('aria-pressed')}));
    const expectedLabel = alternate.cream ? 'Slate studio' : 'Cream studio';
    checks.background = alternate.cream !== (initialStudio === 'cream') &&
      alternate.pressed === String(alternate.cream) &&
      (alternate.label === expectedLabel || (options.mode === 'before' && alternate.cream && alternate.label === 'Blue studio'));
    await page.evaluate(() => document.querySelector('#bgToggle').click());
    checks.backgroundRestores = await page.evaluate(studio => document.body.classList.contains('cream') === (studio === 'cream'), initialStudio);
    const hasCleanView = !!await page.locator('#cleanToggle').count();
    if (hasCleanView) {
      await page.locator('#cleanToggle').click();
      await page.waitForFunction(() => [...document.querySelectorAll('.topbar,.bottom')]
        .every(el => getComputedStyle(el).visibility === 'hidden'), null, {timeout: 5000});
      checks.cleanViewHides = await page.evaluate(() => document.body.classList.contains('clean-view') &&
        document.querySelector('#cleanToggle').getAttribute('aria-pressed') === 'true' &&
        [...document.querySelectorAll('.topbar,.bottom')].every(el => el.inert &&
          el.getAttribute('aria-hidden') === 'true' && getComputedStyle(el).visibility === 'hidden'));
      // Use native pointer input so the actual tap detector, not a synthetic
      // DOM click, restores the controls from the canvas.
      await page.locator('#viewer canvas').click({position: {x: 24, y: 24}});
      await page.waitForFunction(() => !document.body.classList.contains('clean-view'), null, {timeout: 5000});
      checks.cleanViewRestores = await page.evaluate(() =>
        document.querySelector('#cleanToggle').getAttribute('aria-pressed') === 'false' &&
        [...document.querySelectorAll('.topbar,.bottom')].every(el => !el.inert && el.getAttribute('aria-hidden') === 'false'));
    } else if (options.mode !== 'before') {
      checks.cleanViewHides = checks.cleanViewRestores = false;
    }
    await page.evaluate(initial => {
      document.querySelector('[data-paint="#f4f4ef"]').click();
      const t = window.__visualTest;
      const centre = new t.THREE.Vector3(...initial.target);
      const offset = new t.THREE.Vector3(...initial.position).sub(centre).multiplyScalar(.72);
      t.controls.target.copy(centre).add(new t.THREE.Vector3(.35, .15, 0));
      t.camera.position.copy(t.controls.target).add(offset); t.camera.zoom = 1.25; t.camera.updateProjectionMatrix();
      t.resume(); document.querySelector('#reset').click();
    }, initialSide);
    await page.waitForTimeout(2500);
    await page.waitForFunction(initial => {
      const t = window.__visualTest;
      return !t.isTweening() && Math.abs(t.camera.zoom - 1) < .00001 &&
        Math.abs(t.controls.getDistance() - initial.distance) < .0001 &&
        t.controls.target.distanceTo(new t.THREE.Vector3(...initial.target)) < .0001 &&
        t.camera.position.distanceTo(new t.THREE.Vector3(...initial.position)) < .001;
    }, initialSide, {timeout: 60000});
    checks.reset = true;
    await page.evaluate(() => window.__visualTest.pause());
  }
  // Asset data coverage is checked independently of a particular paint colour.
  const bakedData=await page.evaluate(()=>{
    const t=window.__visualTest;if(!t.getBAKEDLOOK())return null;
    const summary={opaqueMeshes:0,coveredOpaqueMeshes:0,vertices:0,missing:[],strengths:t.getBAKEDLOOK()};
    for(const root of [t.car,t.plinth].filter(Boolean))root.traverse(part=>{
      if(!part.isMesh||/satin[ _]arch[ _]liner/i.test(part.name))return;
      const materials=Array.isArray(part.material)?part.material:[part.material];
      if(materials.every(m=>m.transparent))return;
      summary.opaqueMeshes++;const a=part.geometry.getAttribute('bakedShading'),p=part.geometry.getAttribute('position');
      if(a&&a.count===p.count&&a.itemSize>=2){summary.coveredOpaqueMeshes++;summary.vertices+=a.count}
      else summary.missing.push(part.name);
    });return summary;
  });
  if(bakedData){
    checks.bakedCoverage=bakedData.opaqueMeshes>0&&bakedData.missing.length===0;
    checks.bakedData=bakedData;
    const materials=await page.evaluate(()=>window.__visualTest.toyMaterials());
    checks.toyMaterials=Math.abs(materials.paint.roughness-.38)<.015&&Math.abs(materials.paint.clearcoat-.55)<.03&&
      Math.abs(materials.paint.clearcoatRoughness-.20)<.02&&materials.glass==='20282c'&&Math.abs(materials.chromeRoughness-.24)<.03;
    checks.materialObservations=materials;
  }
  if(!options.viewsOnly&&await page.locator('#baseToggle').count()){
    await settleView('quarter');
    const before=await page.evaluate(()=>{const t=window.__visualTest;return{position:t.camera.position.toArray(),target:t.controls.target.toArray(),distance:t.controls.getDistance()}});
    await page.evaluate(()=>document.querySelector('#baseToggle').click());
    checks.baseToggle=await page.evaluate(()=>document.querySelector('#baseToggle').getAttribute('aria-pressed')==='true'&&window.__visualTest.plinth?.visible===true);
    const observations=[];
    for(const view of ['front','side','rear','quarter','top']){
      await settleView(view);
      observations.push(await page.evaluate(view=>{const t=window.__visualTest,b=t.projectedBounds(t.camera);return{view,widthFraction:(b.maxX-b.minX)/2,bounds:b,visible:t.plinth.visible}},view));
    }
    checks.baseFraming=observations.every(o=>o.visible&&(!['side','quarter','top'].includes(o.view)||o.widthFraction>=.75)&&o.widthFraction<=.85&&
      o.bounds.minX>=-1.01&&o.bounds.maxX<=1.01&&o.bounds.minY>=-1.01&&o.bounds.maxY<=1.01);
    checks.baseObservations=observations;
    await settleView('quarter');await capture('base-quarter');
    await page.evaluate(()=>document.querySelector('#baseToggle').click());
    checks.baseRestores=await page.evaluate(before=>{const t=window.__visualTest;return document.querySelector('#baseToggle').getAttribute('aria-pressed')==='false'&&t.plinth.visible===false&&
      Math.abs(t.controls.getDistance()-before.distance)<.001&&t.camera.position.distanceTo(new t.THREE.Vector3(...before.position))<.001&&t.controls.target.distanceTo(new t.THREE.Vector3(...before.target))<.001},before);
  }
  if(!options.viewsOnly && await page.evaluate(()=>!!window.lcBuild)){
    const foundation=await page.evaluate(async()=>{
      const api=window.lcBuild,t=window.__visualTest,initial=api.getState();
      const snapshot=()=>{
        t.car.updateMatrixWorld(true);const result=[];
        for(const [kind,root] of Object.entries(api.groups))root.traverse(m=>{if(m.isMesh){const a=m.geometry.getAttribute('position').array;result.push({kind,id:m.uuid,position:m.getWorldPosition(new t.THREE.Vector3()).toArray(),array:a,copy:a.slice()});}});
        return result;
      };
      const baseline=snapshot();
      await api.setState({lift_mm:50});
      const raised=snapshot(),raisedById=new Map(raised.map(x=>[x.id,x]));
      let maxBodyDeltaError=0,maxWheelMovement=0,positionArraysUnchanged=true,bodyMeshes=0,wheelMeshes=0;
      for(const old of baseline){const now=raisedById.get(old.id);if(!now){positionArraysUnchanged=false;continue;}
        for(let i=0;i<old.copy.length;i++)if(now.array[i]!==old.copy[i]){positionArraysUnchanged=false;break;}
        const delta=now.position.map((v,i)=>v-old.position[i]);
        if(old.kind==='body'){bodyMeshes++;maxBodyDeltaError=Math.max(maxBodyDeltaError,Math.hypot(delta[0],delta[1]-.05,delta[2]));}
        if(old.kind==='wheels'){wheelMeshes++;maxWheelMovement=Math.max(maxWheelMovement,Math.hypot(...delta));}
      }
      await api.setState({lift_mm:initial.lift_mm});
      const paintedEntry=[...api.parts].find(([,group])=>group.userData.zones?.includes('paint'));
      let globalPaint=false,partPaint=null,partPaintIsolated=null,paintOverrideKey=null;
      await api.setState({paint:{paint:'#345678'}});
      globalPaint=t.paint.color.getHexString()==='345678';
      if(paintedEntry){const [id,group]=paintedEntry;paintOverrideKey=id+':paint';
        await api.setState({paint:{[paintOverrideKey]:'#8a6543'}});
        let paintedMeshes=0;group.traverse(m=>{if(m.isMesh)for(const material of(Array.isArray(m.material)?m.material:[m.material]))if(material.color?.getHexString()==='8a6543')paintedMeshes++;});
        partPaint=paintedMeshes>0;
        let leakedMeshes=0;for(const [otherId,other] of api.parts)if(otherId!==id)other.traverse(m=>{if(m.isMesh)for(const material of(Array.isArray(m.material)?m.material:[m.material]))if(material.color?.getHexString()==='8a6543')leakedMeshes++;});
        partPaintIsolated=paintedMeshes>0&&leakedMeshes===0;
      }
      const selected=Object.entries(initial.slots).find(([,id])=>id&&api.parts.has(id));
      let hidden=false,slotEmpty=false,slotRestored=false;
      if(selected){const [slot,id]=selected;
        await api.setState({hidden:[...initial.hidden,id]});hidden=api.parts.get(id).visible===false;
        await api.setState({hidden:initial.hidden,slots:{[slot]:null}});slotEmpty=api.getState().slots[slot]===null && (!api.parts.has(id)||api.parts.get(id).visible===false);
        await api.setState({slots:{[slot]:id}});slotRestored=api.getState().slots[slot]===id&&api.parts.get(id)?.visible===true;
      }
      if(paintOverrideKey)await api.setState({paint:{[paintOverrideKey]:null}});
      await api.setState(initial);
      // Restore UI colour controls too; state and uniforms already match.
      document.querySelector('[data-paint="#f4f4ef"]')?.click();
      return{defaultLift:initial.lift_mm,rootScale:t.car.scale.toArray(),bodyMeshes,wheelMeshes,maxBodyDeltaError,maxWheelMovement,positionArraysUnchanged,
        globalPaint,partPaint,partPaintIsolated,hidden,slotEmpty,slotRestored,restoredLift:api.getState().lift_mm};
    });
    checks.buildState=foundation.defaultLift===0&&foundation.bodyMeshes>0&&foundation.wheelMeshes>0&&foundation.maxBodyDeltaError<1e-9&&foundation.maxWheelMovement<1e-9&&foundation.positionArraysUnchanged&&foundation.globalPaint&&foundation.partPaint!==false&&foundation.partPaintIsolated!==false&&foundation.hidden&&foundation.slotEmpty&&foundation.slotRestored&&foundation.restoredLift===0&&foundation.rootScale.every(v=>v===1);
    checks.buildStateObservations=foundation;
    await page.evaluate(()=>{location.hash='lift_mm=50'});
    await page.waitForFunction(()=>window.lcBuild.getState().lift_mm===50,null,{timeout:30000});
    checks.hashLift=await page.evaluate(()=>Math.abs(window.lcBuild.groups.body.position.y-.05)<1e-9&&window.lcBuild.groups.wheels.position.y===0);
    await page.evaluate(()=>{location.hash=''});
    await page.waitForFunction(()=>window.lcBuild.getState().lift_mm===0,null,{timeout:30000});
    checks.hashRestoresDefault=await page.evaluate(()=>Math.abs(window.lcBuild.groups.body.position.y)<1e-9&&window.lcBuild.groups.wheels.position.y===0);
  }
  const rendererObservations = await page.evaluate(() => {
    const t = window.__visualTest;
    return {cameraType: t.camera.type, fov: t.camera.fov ?? null,
      nativeAntialias: t.renderer.getContext().getContextAttributes().antialias,
      devicePixelRatio: window.devicePixelRatio, rendererPixelRatio: t.renderer.getPixelRatio()};
  });
  checks.nativeAntialias = rendererObservations.nativeAntialias;
  checks.pixelRatioCap = rendererObservations.rendererPixelRatio <= Math.min(rendererObservations.devicePixelRatio, 2);
  checks.longLens = options.mode === 'before' || (rendererObservations.cameraType === 'PerspectiveCamera' &&
    rendererObservations.fov >= 18 && rendererObservations.fov <= 22);
  checks.renderer = rendererObservations;
  checks.model = await page.evaluate(() => {
    const t = window.__visualTest, box = new t.THREE.Box3().setFromObject(t.car);
    return {dimensions: t.DIM, bounds: {min: box.min, max: box.max}, triangles: t.renderer.info.render.triangles, drawCalls: t.renderer.info.render.calls};
  });
  if(await page.evaluate(()=>!!window.lcBuild)){
    const b=checks.model.bounds;
    const actual=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];
    checks.trueScaleBounds=Math.abs(actual[0]-5.170)<.0001&&Math.abs(actual[1]-1.930)<.0001&&Math.abs(actual[2]-2.297)<.001;
    checks.trueScaleBoundsMetres={length:actual[0],height:actual[1],widthIncludingMirrors:actual[2]};
  }
  if(options.mode !== 'before'){
    const noJs=await browser.newPage({viewport:{width:1000,height:800},javaScriptEnabled:false});
    await noJs.goto(url,{timeout:120000});
    const fallback=await noJs.locator('.nojs').textContent();
    checks.noJsFallback=await noJs.locator('.nojs').isVisible()&&/gunmetal/i.test(fallback)&&/JavaScript/i.test(fallback);
    if(!options.checksOnly){await noJs.screenshot({path:path.join(output,'no-js.png'),timeout:120000});snapshots.push('no-js.png');}
    await noJs.close();
  }
  const failed = errors.length || Object.values(checks).some(v => v === false) ||
    (checks.autoRotate && (!checks.autoRotate.enabled || !checks.autoRotate.moved));
  if (failed) process.exitCode = 1;
} catch (error) {
  errors.push({type: 'test', message: error.stack}); process.exitCode = 1;
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  const finalAssets=await snapshotAssets(options['asset-root']||options.assetRoot);
  checks.assetsStable=JSON.stringify(initialAssets)===JSON.stringify(finalAssets);if(!checks.assetsStable)process.exitCode=1;
  const report = {mode: options.mode, source: options.source, sourceSha256, threeVersion: packageInfo.version,
    checksOnly: options.checksOnly, bothStudios: options.bothStudios, viewport: {width: 1440, height: 1000},
    method: 'Real UI and camera updates; test-only intermediate GPU draw suppression; product final frame rendered for every screenshot.',
    snapshots, reusedSnapshots, errors, checks, assets:initialAssets,assetSha256,visualInspectionRequired: true};
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
