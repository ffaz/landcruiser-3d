# Visual checks

The app remains a single `index.html` with its pinned CDN importmap. This script creates an instrumented **test copy**, packs `three@0.166.1` with npm, extracts it, and serves that package locally. Playwright and npm's cache live in a temporary dependency directory, outside the repository.

Use Node.js 20+, npm, `tar`, and Chromium. On systems without `/usr/bin/chromium`, pass `--chromium /path/to/chromium` or install Playwright's Chromium into the dependency directory first.

```sh
# Capture a saved baseline before editing index.html.
git show HEAD:index.html > /tmp/lc200-before.html
node tests/visual.mjs --source /tmp/lc200-before.html --mode before --output /tmp/lc200-evidence

# Capture and check the working version.
node tests/visual.mjs --mode after --output /tmp/lc200-evidence
```

The script installs Playwright into `/tmp/lc200-visual-deps` on first use. Choose another directory with `--deps /path/to/deps`. To reuse an already extracted Three.js 0.166.1 package, add `--three-dir /path/to/package`. No CDN URLs in the source file are changed.

Each run clicks all five `[data-view=...]` buttons, waits 2.5 seconds for each camera tween, and saves `front.png`, `side.png`, `rear.png`, `quarter.png`, and `top.png`. The full run also captures eight azimuths at 45° intervals while auto-rotation is enabled and checks rotation movement, paint swatches, custom paint, background switching, reset, and browser errors. Use `--views-only` for just the five views.

If software rendering times out during a capture, rerun the same command with `--resume`. Existing screenshots are reused only when the previous `test.html` exactly matches the newly generated test page. All camera actions and functional checks still run. `results.json` lists reused images; changed source content forces every screenshot to be captured again. Individual screenshot calls allow up to two minutes for slow software rendering.

Chromium runs with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. `results.json` records errors, control checks, dimensions, bounds, triangle count, and draw calls; browser errors or failed control checks produce a nonzero exit status. The local server answers favicon requests with 204.

Inspect every screenshot for detached or intersecting parts, glass/body alignment, roof-rail mounting, wheel/arch alignment, lamp recesses, and the LC200 side silhouette. The report does not claim that a screenshot or bounds check can prove geometric correctness. Test touch gestures in WebKit and on a physical iPad separately.
