# Visual checks

The app uses `index.html` with its pinned CDN importmap plus external `model/` assets and `build.json`. This script creates an instrumented **test copy**, packs `three@0.166.1` with npm, extracts it, and serves that package locally. Playwright and npm's cache live in a dependency directory outside the repository. Production URLs and source files are unchanged.

Use Node.js 20+, npm, `tar`, and Chromium. On systems without `/usr/bin/chromium`, pass `--chromium /path/to/chromium` or install Playwright's Chromium into the dependency directory first.

```sh
# Freeze the page and its external assets together before editing.
mkdir -p /tmp/lc200-before
git archive HEAD | tar -x -C /tmp/lc200-before
node tests/visual.mjs --source /tmp/lc200-before/index.html --asset-root /tmp/lc200-before --mode before --output /tmp/lc200-evidence

# Capture all five presets in Cream and Slate, plus eight rotation angles.
node tests/visual.mjs --both-studios --output /tmp/lc200-evidence

# Exercise controls and camera fitting without saving screenshots.
node tests/visual.mjs --checks-only --both-studios --output /tmp/lc200-checks
```

The script installs Playwright into `/tmp/lc200-visual-deps` on first use. Choose another directory with `--deps /path/to/deps`. To reuse an already extracted Three.js 0.166.1 package, add `--three-dir /path/to/package`.

Each run clicks the real five `[data-view=...]` buttons, waits 2.5 seconds for each camera tween, and saves `front.png`, `side.png`, `rear.png`, `quarter.png`, and `top.png`. `--both-studios` writes them into `cream/` and `slate/` subdirectories. The full run also saves eight azimuths at 45° intervals with auto-rotation enabled. It preserves the current fitted long-lens camera radius and elevation rather than using a fixed orbit distance. Use `--views-only` for the presets alone; `--checks-only` saves no images and skips orbit captures.

Functional checks cover active presets, a level Side at y=0.40 m and the camera minimum height (or legacy polar limits when testing older sources), 75–85% hero framing, auto-rotation movement, every displayed paint swatch, custom paint, background destination labels, Clean view hiding/restoration with native pointer input, and Reset restoring camera position, target and distance. The report records the source SHA-256, actual perspective FOV, antialias setting, pixel-ratio cap, dimensions, bounds and browser errors. Any failed check or browser error exits nonzero. Reset is tested after changing camera distance, pan target and zoom.

For software-rendering speed, the temporary test page suppresses redundant intermediate GPU draws while real UI handlers, controls and camera tweens run. It pauses the animation loop after the tween and invokes the app's actual final render before each screenshot. This validates final appearance and control behavior; it does not measure native frame rate or certify animation smoothness. Chromium uses `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

If a capture times out, rerun with `--resume`. Screenshots are reused only when the previous instrumented `test.html` exactly matches the newly generated page. All camera actions and functional checks still run. Changed source, instrumentation, model files or build state forces a fresh capture. Asset SHA-256 records are embedded in the temporary test page, and the report rejects assets changed during the run. `results.json` lists reused images. The local server returns 204 for favicon requests.

Inspect all screenshots for detached or intersecting parts, glass/body alignment, tyre contact, rail and spoiler mounting, lamp shading and the LC200 side silhouette. A screenshot or bounds check cannot prove geometric correctness. Test native touch gestures in WebKit separately. The recorded WebKit iPad emulation checks rotate, pinch, two-finger pan, Reset and Clean view; a physical iPad Safari performance check remains a separate hardware test.

## WebKit frame-time measurement

`webkit-benchmark.mjs` measures the real renderer at a 1366 × 1024 CSS-pixel iPad viewport, DPR 1. Install Playwright's WebKit browser and its system libraries first; use the same dependency directory and local Three.js package as `visual.mjs`.

```sh
node tests/webkit-benchmark.mjs --source /tmp/lc200-before/index.html --asset-root /tmp/lc200-before --output /tmp/lc200-webkit-before
node tests/webkit-benchmark.mjs --output /tmp/lc200-webkit-after
```

For a shared dependency directory, pass `--deps /path/to/deps --three-dir /path/to/three/package`. A user-local Linux shared-library tree can be supplied with `--library-path /path/to/lib`; this option is unnecessary on a machine with WebKit's dependencies installed normally.

The benchmark runs Cream, selects 3/4, starts Auto, warms four frames and records 24 animation-frame intervals plus the CPU time spent inside actual `renderer.render` calls. `--frames 24` may be changed from 12 to 120. It saves the source SHA-256, raw samples, p50/p95/mean times, render count, settings, errors and a screenshot in `performance.json`. It does not suppress draws. Run before and after with the same settings and avoid other heavy CPU/GPU work during either measurement. These are software-rendered WebKit emulation timings, not physical iPad Safari FPS or a smoothness guarantee.

When the baked toy asset is present, the report checks that every opaque mesh has matching baked shading attributes (the simple satin arch liners are excluded), records the shared AO/ridge/valley strengths and verifies satin paint plus neutral glass. When the optional base is available, it checks the toggle, all five preset fits and restoration after hiding it; a full capture also saves `base-quarter.png`.

The current source also checks the no-JavaScript fallback for the rendered gunmetal finish and retained tyre text. The preset paint check reads every actual swatch button, rather than assuming a fixed colour count. Base framing checks full visibility in all five views; Front/Rear may be height-limited, while Side/Quarter/Top target 75–85% width.

For trusted native gesture stress at every preset (WebKit touch plus Chromium scroll):

```sh
node tests/camera-limits.mjs --output /tmp/lc200-camera-limits
```

It verifies every intermediate pose after extreme pinch, two-finger pan and downward rotation, plus a deliberately invalid pose and both scroll directions. It uses the same external Playwright dependency directory and locally served Three.js; override them with `--deps` and `--three-dir`. WebKit is installed with Playwright and requires its platform libraries. Use `--library-path` for an explicitly installed local library directory and `--chromium` for a different Chromium executable. Touch rendering is suppressed only in the temporary gesture-test page; this test checks camera safety, not frame rate.


## Parts foundation and project-path checks

All test servers serve external GLBs, JSON and the pinned Three.js Meshopt decoder. They use the `/landcruiser-3d/` project path and reject absolute host-root model/build requests, matching GitHub Pages project hosting. `--asset-root /path/to/frozen/repo` selects the model/build snapshot independently of `--source`; reports record every GLB/JSON asset hash.

When `window.lcBuild` is available, the full visual check additionally verifies a 50 mm rigid body lift with every wheel fixed, byte-identical POSITION buffers, uniform root scale 1, global/per-part paint, hidden parts, empty/restored slots, `#lift_mm=50`, and clearing the hash back to defaults. The viewer API is tested as data-only state; no workshop UI is introduced. Geometry provenance and lossless compression are checked separately by the offline asset audit.

## Clay material regression

`clay.mjs` captures Front, Side and 3/4 in Cream/Slate before the change, then those
same views and six Clay views (orange and white, each in Front/Side/3/4) after it. Its temporary page keeps
byte snapshots of POSITION/NORMAL/COLOR_0 and every vehicle node transform. It
checks those through studio changes, all four swatches, custom colours, per-part
paint overrides and restoration. It compares Cream/Slate material, lighting,
background and camera state against the baseline; actual images remain available
for visual/pixel comparison. Clay may reduce transparent-lens draw passes, and
must not add draws or rendered triangles relative to Cream.

```sh
node tests/clay.mjs --mode before --source /tmp/before/index.html --output /tmp/clay-evidence
node tests/clay.mjs --mode after --output /tmp/clay-evidence
node tests/clay.mjs --mode stock --output /tmp/clay-evidence
```

Pass `--deps` and `--three-dir` as with the other harnesses. Defaults expect their
already prepared local Playwright and Three.js dependencies. The warm orange
custom paint in Clay screenshots is a test-only choice; production paint defaults
and build.json are unchanged. `webkit-benchmark.mjs --studio clay` selects Clay
before measuring the actual renderer; compare with `--studio cream` on the same
idle host. This remains software-rendered emulation, not physical iPad timing.

The Clay tuning regression checks that authored white `#f4f4ef` stays unchanged in build state while its Clay material displays warm cream `#efe6da`. It also tests custom pure white and pastel blue (`#dde9f1`), so light coloured finishes are not mistaken for white. Clay keeps ridge **0.52** and valley **0.72** unchanged during the white-paint calibration. The regression also verifies a 50 mm body lift anchors the Clay height-lighting uniform at 0.05 m while wheel positions and POSITION/NORMAL/COLOR_0 buffers remain unchanged, then restores the default state. Pale headlamp lenses and vertically graded plum glass may use colour-stable MeshBasicMaterial in Clay; the original materials must restore exactly in Cream/Slate. Muted red tail-lamp materials are recorded and checked.

## Cream showroom regression

`cream.mjs` checks Cream refinements against frozen before fixtures while requiring
Slate and Clay to remain pixel-identical. Use the same Playwright/local Three.js
dependency directory as the other harnesses, with `sharp` installed there for
lossless PNG comparison. Production CDN imports remain unchanged.

```sh
# Before editing, freeze source and assets, then record the fixture images/state.
mkdir -p /tmp/cream-source-before
git archive HEAD | tar -x -C /tmp/cream-source-before
node tests/cream.mjs --mode before --source /tmp/cream-source-before/index.html --asset-root /tmp/cream-source-before --output /tmp/cream-before

# After editing, compare the live source to the frozen fixtures.
node tests/cream.mjs --mode after --baseline /tmp/cream-before --output /tmp/cream-after
```

Pass `--deps`, `--three-dir` or `--chromium` when using non-default dependency paths.
Before fixtures include all five white presets in each studio, plus orange 3/4
in Slate and Clay. The after run compares all **12 Slate/Clay PNGs pixel by
pixel**, captures Cream presets, and checks all five cameras against the baseline.
It also compares Cream's first-load Side render with the same view after a
studio cycle, which catches initial paint/contact settings that only apply after
clicking the studio button.

Checks preserve Cream's non-paint material properties, paint satin properties,
global lights/exposure, neutral background and baked AO/ridge/valley settings.
They exercise the actual four swatch buttons, custom white/orange/pastel paint,
per-part paint/trim overrides, hidden/empty slots, mode restoration and a rigid
50 mm lift with fixed wheels. POSITION/NORMAL/COLOR_0 buffers, node matrices,
root scale and all model/build hashes must stay intact. Each explicit final
render must use one screen render, no target render, and unchanged draw/triangle
counts and shadow-map settings. Temporary render suppression speeds capture;
it is not an iPad performance measurement.

Cream follow-up checks also verify unchanged original gain uniforms, reuse of the existing floor/contact texture, and Base clipping/restoration without buffer changes.
