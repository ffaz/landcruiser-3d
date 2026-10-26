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

const run = promisify(execFile);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = {source: path.join(repo, 'index.html'), output: path.join(os.tmpdir(), 'lc200-visual'),
  mode: 'after', deps: path.join(os.tmpdir(), 'lc200-visual-deps'), viewsOnly: false, resume: false};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (key === '--views-only') options.viewsOnly = true;
  else if (key === '--resume') options.resume = true;
  else if (['--source', '--output', '--mode', '--deps', '--three-dir', '--chromium'].includes(key)) {
    if (!process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${key}`);
    options[key.slice(2)] = process.argv[++i];
  } else throw new Error(`Unknown option: ${key}`);
}
if (!['before', 'after'].includes(options.mode)) throw new Error('--mode must be before or after');
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
const cdn = 'https://cdn.jsdelivr.net/npm/three@0.166.1/';
if (!html.includes(cdn)) throw new Error('Expected the pinned CDN importmap in the source file');
html = html.replaceAll(cdn, '/three/');
const end = html.lastIndexOf('</script>');
if (end < 0) throw new Error('No module script found for test-only instrumentation');
html = html.slice(0, end) + '\nwindow.__visualTest = {camera, controls, car, paint, DIM, scene, renderer, THREE, target};\n' + html.slice(end);
const testPage = path.join(output, 'test.html');
const previousPage = await fs.readFile(testPage, 'utf8').catch(() => null);
const resume = options.resume && previousPage === html;
if (options.resume && !resume) console.log('Resume disabled: no matching previous test.html; capturing every view');
await fs.writeFile(testPage, html);

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (pathname === '/' || pathname === '/test.html') {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); response.end(html); return;
    }
    const root = pathname.startsWith('/three/') ? three : path.dirname(options.source);
    const relative = pathname.startsWith('/three/') ? pathname.slice(7) : pathname.slice(1);
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) throw new Error('Path outside served directory');
    const data = await fs.readFile(filename);
    const type = {'.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png'}[path.extname(filename)] || 'application/octet-stream';
    response.writeHead(200, {'Content-Type': type}); response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/test.html`;
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
  await page.goto(url);
  await page.waitForSelector('#loader.hidden', {state: 'attached', timeout: 60000});
  await page.waitForFunction(() => !!window.__visualTest);
  const capture = async name => {
    const filename = `${name}.png`, destination = path.join(output, filename);
    if (resume && (await fs.stat(destination).catch(() => null))?.size > 0) {
      snapshots.push(filename); reusedSnapshots.push(filename);
      console.log('Reused matching-page capture', options.mode, name); return;
    }
    await page.screenshot({path: destination, timeout: 120000});
    snapshots.push(`${name}.png`); console.log('Captured', options.mode, name);
  };
  // Preserve the requested UI-driven preset transitions and settling time.
  for (const view of ['front', 'side', 'rear', 'quarter', 'top']) {
    await page.evaluate(v => document.querySelector(`[data-view=${v}]`).click(), view);
    await page.waitForTimeout(2500);
    await capture(view);
  }
  if (!options.viewsOnly) {
    await page.evaluate(() => document.querySelector('[data-view=quarter]').click());
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelector('#rotate').click());
    const start = await page.evaluate(() => window.__visualTest.controls.getAzimuthalAngle());
    await page.waitForFunction(start =>
      Math.abs(window.__visualTest.controls.getAzimuthalAngle() - start) > 0.00001,
    start, {timeout: 60000});
    checks.autoRotate = await page.evaluate(start => {
      const {controls} = window.__visualTest;
      return {enabled: controls.autoRotate, moved: Math.abs(controls.getAzimuthalAngle() - start) > 0.00001};
    }, start);
    for (let i = 0; i < 8; i++) {
      // Sample all eight sides while the real auto-rotation control stays active.
      await page.evaluate(i => {
        const t = window.__visualTest, a = i * Math.PI / 4;
        t.camera.position.copy(t.controls.target).add(new t.THREE.Vector3(Math.sin(a) * 9, 3, Math.cos(a) * 9));
        t.controls.update(); t.renderer.render(t.scene, t.camera);
      }, i);
      await capture(`orbit-${String(i * 45).padStart(3, '0')}`);
    }
    await page.evaluate(() => document.querySelector('#rotate').click());
    await page.evaluate(() => document.querySelector('[data-paint="#575c60"]').click());
    checks.paintSwatch = await page.evaluate(() => window.__visualTest.paint.color.getHexString() === '575c60');
    await page.evaluate(() => {
      const input = document.querySelector('#customPaint'); input.value = '#aabbcc'; input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    checks.customPaint = await page.evaluate(() => window.__visualTest.paint.color.getHexString() === 'aabbcc');
    await page.evaluate(() => document.querySelector('#bgToggle').click());
    checks.background = await page.evaluate(() => document.body.classList.contains('cream') && document.querySelector('#bgToggle').getAttribute('aria-pressed') === 'true');
    await page.evaluate(() => {
      document.querySelector('#bgToggle').click(); document.querySelector('[data-paint="#f4f4ef"]').click();
      const t = window.__visualTest; t.camera.zoom = 1.5; t.controls.target.x += 0.5; t.camera.updateProjectionMatrix();
      document.querySelector('#reset').click();
    });
    await page.waitForTimeout(2500);
    // Software rendering can delay the final tween frame past the nominal wait.
    await page.waitForFunction(() => {
      const t = window.__visualTest;
      return Math.abs(t.camera.zoom - 1) < 0.00001 && t.controls.target.distanceTo(t.target) < 0.00001;
    }, null, {timeout: 15000});
    checks.reset = await page.evaluate(() => {
      const t = window.__visualTest; return Math.abs(t.camera.zoom - 1) < 0.00001 && t.controls.target.distanceTo(t.target) < 0.00001;
    });
  }
  checks.model = await page.evaluate(() => {
    const t = window.__visualTest, box = new t.THREE.Box3().setFromObject(t.car);
    return {dimensions: t.DIM, bounds: {min: box.min, max: box.max}, triangles: t.renderer.info.render.triangles, drawCalls: t.renderer.info.render.calls};
  });
  const failed = errors.length || Object.values(checks).some(v => v === false) ||
    (checks.autoRotate && (!checks.autoRotate.enabled || !checks.autoRotate.moved));
  if (failed) process.exitCode = 1;
} catch (error) {
  errors.push({type: 'test', message: error.stack}); process.exitCode = 1;
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  const report = {mode: options.mode, source: options.source, threeVersion: packageInfo.version,
    snapshots, reusedSnapshots, errors, checks, visualInspectionRequired: true};
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
