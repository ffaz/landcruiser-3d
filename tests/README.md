# Visual checks

The app remains a single `index.html` with its pinned CDN importmap. This script creates an instrumented **test copy**, packs `three@0.166.1` with npm, extracts it, and serves that package locally. Playwright and npm's cache live in a dependency directory outside the repository. Production URLs and source files are unchanged.

Use Node.js 20+, npm, `tar`, and Chromium. On systems without `/usr/bin/chromium`, pass `--chromium /path/to/chromium` or install Playwright's Chromium into the dependency directory first.

```sh
# Save and capture a baseline before editing index.html.
git show HEAD:index.html > /tmp/lc200-before.html
node tests/visual.mjs --source /tmp/lc200-before.html --mode before --output /tmp/lc200-evidence

# Capture all five presets in Cream and Slate, plus eight rotation angles.
node tests/visual.mjs --both-studios --output /tmp/lc200-evidence

# Exercise controls and camera fitting without saving screenshots.
node tests/visual.mjs --checks-only --both-studios --output /tmp/lc200-checks
```

The script installs Playwright into `/tmp/lc200-visual-deps` on first use. Choose another directory with `--deps /path/to/deps`. To reuse an already extracted Three.js 0.166.1 package, add `--three-dir /path/to/package`.

Each run clicks the real five `[data-view=...]` buttons, waits 2.5 seconds for each camera tween, and saves `front.png`, `side.png`, `rear.png`, `quarter.png`, and `top.png`. `--both-studios` writes them into `cream/` and `slate/` subdirectories. The full run also saves eight azimuths at 45° intervals with auto-rotation enabled. It preserves the current fitted long-lens camera radius and elevation rather than using a fixed orbit distance. Use `--views-only` for the presets alone; `--checks-only` saves no images and skips orbit captures.

Functional checks cover active presets, the safe Side polar limit (or the earlier level profile when no camera guard exists), 75–85% hero framing, auto-rotation movement, every displayed paint swatch, custom paint, background destination labels, Clean view hiding/restoration with native pointer input, and Reset restoring camera position, target and distance. The report records the source SHA-256, actual perspective FOV, antialias setting, pixel-ratio cap, dimensions, bounds and browser errors. Any failed check or browser error exits nonzero. Reset is tested after changing camera distance, pan target and zoom.

For software-rendering speed, the temporary test page suppresses redundant intermediate GPU draws while real UI handlers, controls and camera tweens run. It pauses the animation loop after the tween and invokes the app's actual final render before each screenshot. This validates final appearance and control behavior; it does not measure native frame rate or certify animation smoothness. Chromium uses `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

If a capture times out, rerun with `--resume`. Screenshots are reused only when the previous instrumented `test.html` exactly matches the newly generated page. All camera actions and functional checks still run. Changed source or instrumentation forces a fresh capture. `results.json` lists reused images. The local server returns 204 for favicon requests.

Inspect all screenshots for detached or intersecting parts, glass/body alignment, tyre contact, rail and spoiler mounting, lamp shading and the LC200 side silhouette. A screenshot or bounds check cannot prove geometric correctness. Test native touch gestures in WebKit separately. The recorded WebKit iPad emulation checks rotate, pinch, two-finger pan, Reset and Clean view; a physical iPad Safari performance check remains a separate hardware test.

## WebKit frame-time measurement

`webkit-benchmark.mjs` measures the real renderer at a 1366 × 1024 CSS-pixel iPad viewport, DPR 1. Install Playwright's WebKit browser and its system libraries first; use the same dependency directory and local Three.js package as `visual.mjs`.

```sh
node tests/webkit-benchmark.mjs --source /tmp/lc200-before.html --output /tmp/lc200-webkit-before
node tests/webkit-benchmark.mjs --output /tmp/lc200-webkit-after
```

For a shared dependency directory, pass `--deps /path/to/deps --three-dir /path/to/three/package`. A user-local Linux shared-library tree can be supplied with `--library-path /path/to/lib`; this option is unnecessary on a machine with WebKit's dependencies installed normally.

The benchmark runs Cream, selects 3/4, starts Auto, warms four frames and records 24 animation-frame intervals plus the CPU time spent inside actual `renderer.render` calls. `--frames 24` may be changed from 12 to 120. It saves the source SHA-256, raw samples, p50/p95/mean times, render count, settings, errors and a screenshot in `performance.json`. It does not suppress draws. Run before and after with the same settings and avoid other heavy CPU/GPU work during either measurement. These are software-rendered WebKit emulation timings, not physical iPad Safari FPS or a smoothness guarantee.

When the baked toy asset is present, the report checks that every opaque mesh has matching baked shading attributes (the simple satin arch liners are excluded), records the shared AO/ridge/valley strengths and verifies satin paint plus neutral glass. When the optional base is available, it checks the toggle, all five preset fits and restoration after hiding it; a full capture also saves `base-quarter.png`.
