# Round-4b offline asset tools

These scripts generate only the five additive GLBs and their manifest/build selections. They never overwrite the pre-existing 49 GLBs. Runtime geometry, normals and colour attributes are not altered.

Node scripts take **absolute REPO, DEPS and WORKDIR paths**. DEPS contains glTF Transform core/extensions/functions, meshoptimizer, Three, and three-mesh-bvh. Python scripts take WORKDIR and require NumPy, SciPy, Pillow, Shapely and triangle. Three.js 0.166.1 remains the viewer dependency; these are offline tools.

Use an isolated checkout when regenerating assets:

```sh
node tools/base-finish/round4b/export-source-glyphs.mjs "$PWD" /path/to/deps /path/to/work
python tools/base-finish/round4b/measure-glyphs.py /path/to/work
python tools/base-finish/round4b/make-g-data.py /path/to/work
node tools/base-finish/round4b/build-g.mjs "$PWD" /path/to/deps /path/to/work
node tools/base-finish/round4b/fit-g-mount.mjs "$PWD" /path/to/deps /path/to/work/g-mount.json

node tools/base-finish/round4b/sample-gap.mjs "$PWD" /path/to/deps /path/to/work
python tools/base-finish/round4b/make-seal-data.py /path/to/work
cp /path/to/work/seal-data.json /path/to/work/seal-outline-initial.json
node tools/base-finish/round4b/sample-gap-min.mjs "$PWD" /path/to/deps /path/to/work
python tools/base-finish/round4b/refit-seal-data.py /path/to/work
node tools/base-finish/round4b/build-additions.mjs "$PWD" /path/to/deps /path/to/work

node tools/base-finish/round4b/split-caps.mjs "$PWD" /path/to/deps /path/to/work
node tools/base-finish/round4b/audit-assets.mjs "$PWD" /path/to/deps /path/to/work
python tools/base-finish/round4b/glyph-final-measure.py /path/to/work
python tools/base-finish/round4b/verify-pixels.py
node tests/visual.mjs
```

The G outline retains the source V footprint and uses the R cap height, baseline and relief. Its left stem is calibrated against the normal widths of the source X/R stems. Explicit inner bevel contours constrain the triangulation; analytic normals keep the cap planar.

The seal outline is the union of sampled rear openings, buffered nominally 10 mm. Its fitted overlap sits behind the sampled existing surfaces, with a small return at the clear-film corner. Both skins have 0.8 mm x separation. The right part mirrors the left; both have independent slots and body pivots.

The cap splitter finds the original 22 disconnected 256-triangle cap components per lamp using welded positions only for classification. It partitions the original index triples into a new material zone, retaining their attributes and transforms. It does not weld or move exported vertices.

The independent audit compares every pre-existing GLB against commit 0e2beba, verifies the original source glyph attributes/transforms/triangles, and compares each new lamp’s full triangle union and POSITION/NORMAL/COLOR_0 bytes with its round-3 input.

The report’s semantic mask renders are test-only: far surfaces select candidate gap pixels; ray classification distinguishes cabin, tyres, trim and underbody. Visible-seal rays are checked against the old opaque surfaces and their orientation/depth. The viewer contains no such mask pass. Native reference images come from the original public Sketchfab viewer with its own lighting, not a recreated source shader.

See [the report](../../../docs/base-finish/round4b/README.md), which records the exact images, source/asset hashes, measurements, pixel-isolation tests and limitations.


## Re-rendering the comparisons and regressions

Prepare a baseline fixture and start the test-only server. DEPS also needs Playwright, sharp and the npm-packed Three 0.166.1 folder at DEPS/package. Chromium uses SwiftShader; production CDN URLs are replaced only in the temporary served page.

```sh
mkdir -p /path/to/work/baseline
git archive 0e2beba index.html build.json model | tar -x -C /path/to/work/baseline
node tools/base-finish/round4b/review-server.mjs "$PWD" /path/to/deps /path/to/work
```

In a separate terminal, run each driver to completion before starting the next:

```sh
python tools/base-finish/round4b/capture-comparisons.py /path/to/work
python tools/base-finish/round4b/capture-orbit-masks.py /path/to/work
python tools/base-finish/round4b/classify-gap-cabin.py /path/to/work
python tools/base-finish/round4b/check-seal-visibility.py /path/to/work
python tools/base-finish/round4b/check-state-regressions.py /path/to/work
python tools/base-finish/round4b/check-closeup-tan.py /path/to/work
```

The server pauses idle animation and suppresses intermediate presentation draws; every exported final frame uses the product renderer. Contact-map updates still run. This server is for visual/regression capture, not frame-time measurement. Use tests/webkit-benchmark.mjs for an unmodified runtime benchmark.

The low-close-up tan test uses R in (40,170), R−G≥6 and G−B≥6 within x=430…869, y=300…374, then records ray hits for detected connected regions. Both final sides have zero such pixels. Chrome masks select the emblem in pure red and grille chrome in pure green with a test-only Basic material. Far-depth masks select candidate internal surfaces; they are followed by material/ray classification, so neighbouring tyres and underside surfaces are not mislabelled as cabin.
