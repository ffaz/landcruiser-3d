# Reference rim collection — 17-inch

Three unbranded interpretations of the supplied photographs, in the car's clean die-cast finish. They are independently selectable under **Workshop → Rims**, with four hub-pivoted copies per design. The selected tyre package and its brake geometry remain in place.

[![Three rims](images/comparison.png)](images/comparison.png)

[![With unchanged 265/70R17 expedition tyres](images/comparison-with-tyres.png)](images/comparison-with-tyres.png)

[![On the car](images/comparison-on-car.png)](images/comparison-on-car.png)

## Full-size renders

Actual Three.js viewer captures, 1440 × 1000. The comparison sheets above are resized layouts of these captures.

| View | Dished disc / satin black | Round-hole steel / silver | Eight-window / satin black |
|---|---|---|---|
| Bare rim 3/4 | [Open](images/disc-rim-quarter.png) | [Open](images/steel-rim-quarter.png) | [Open](images/window-rim-quarter.png) |
| Bare rim front | [Open](images/disc-rim-front.png) | [Open](images/steel-rim-front.png) | [Open](images/window-rim-front.png) |
| Bare rim back | [Open](images/disc-rim-back.png) | [Open](images/steel-rim-back.png) | [Open](images/window-rim-back.png) |
| Mounted close-up | [Open](images/disc-wheel-quarter.png) | [Open](images/steel-wheel-quarter.png) | [Open](images/window-wheel-quarter.png) |
| Car 3/4 | [Open](images/disc-car-quarter.png) | [Open](images/steel-car-quarter.png) | [Open](images/window-car-quarter.png) |
| Car side | [Open](images/disc-car-side.png) | [Open](images/steel-car-side.png) | [Open](images/window-car-side.png) |

[Workshop selection](images/workshop-rims.png) · [Eight-window with stock tyre](images/window-stock-tyre.png) · [Slate](images/window-car-slate.png) · [Clay](images/window-car-clay.png)

## Shapes and finish

- **Dished disc:** eight narrow slots around a nearly solid face, shallow circular pressing, raised hub shoulder, blank cap and six service nuts.
- **Silver pressed steel:** eighteen round vents, bowl-shaped pressing, open centre with rolled edge, six nuts and a silver metallic finish.
- **Eight-window:** eight large bevelled openings, broad spokes, blank centre cap and six nuts. The manufacturer's [Method 701 description](https://www.methodracewheels.com/products/701-matte-black) confirms the eight-window layout used as supplementary reference; these assets remain generic interpretations of the user's images.

Each has a hollow barrel, rolled lip and seated valve. Bead-seat diameter is **431.8 mm**, authored for the existing 17-inch tyre assets. The largest flange diameter measures **462.0 mm**; a flange extending past the nominal bead seat is intentional. Width, dish, six-lug layout and mounting depth are visual design choices from the supplied references and existing model, not certified manufacturer fitment dimensions. No brand lettering, simulated wear, dirt or other workshop accessories were added.

The black designs use satin coated-metal finishes; silver is brighter with a broad highlight. Rim finishes use the existing studio shading. Clay uses the existing clay rim/trim palette.

## Assets and integration

| Design | Triangles per rim | Four GLBs, bytes |
|---|---:|---:|
| Dished disc | 9,784 | 891,136 |
| Silver pressed steel | 11,464 | 1,120,368 |
| Eight-window | 9,016 | 872,640 |
| Total | 12 standalone parts | 2,884,144 |

Blender **4.3.2**, Cycles AO bake at 32 samples. COLOR_0 R = AO, G = signed curvature (.5 flat), B reserved. Meshopt compression; root scale [1,1,1], hub pivots copied from the existing wheel slots. Source files are in `model/source/rim-{disc,steel,window}.blend`.

New slots default to null, so the original rim supplied with the chosen tyre remains the default. Selecting a replacement hides only the old wheel's hardware meshes; tyre/brake meshes and their buffers are retained. “Original rim” restores the supplied hardware. Tyre package selection retains an independently chosen rim. Existing rigid tyre-height adjustments and suspension lift continue to move the complete wheel group.

No stored GLB, geometry buffer, NORMAL or COLOR_0 was edited. No new realtime effects, maps or render passes. Rims add geometry; physical iPad performance and real vehicle fitment have not been measured or validated.

## Verification

- [Asset verification](reports/verification.json): **12 valid new rim GLBs; all 76 pre-existing GLBs byte-identical** to `c480d15`.
- [Viewer](reports/viewer.json): **31/31**, including overhangLock, Cream + Slate, zero console errors. [Final asset check run](reports/viewer-final.json) records the finalized material assets.
- [Workshop smoke](reports/workshop-smoke.log): **31/31**, desktop and emulated phone UI.
- [Independent-rim integration](reports/workshop-integration.json): **21/21**, selecting each rim through the real UI; all six built tyre packages; unchanged tyre attribute hashes; tyre/brake visibility; original-rim restoration; all three studios; stock reset; zero console errors.
- [Default parity](reports/default-parity.json): clean-view 3/4 at 1440 × 1000, **0 changed pixels** in Cream, Slate and Clay compared with `c480d15` when new rims are unselected.
- [Changed values](reports/changed-values.json) and [capture provenance](reports/captures.json).

Tests use Playwright Chromium with SwiftShader and a local unpacked copy of Three.js 0.166.1. The production importmap remains pinned to CDN 0.166.1. Phone UI is emulated; no physical-device claims.

Delivered only on **rims-review**, based on the tyre review branch. Main and GitHub Pages are unchanged.

## Rebuild

```sh
blender -b -t 4 --python tools/rims/model.py -- WORK/disc disc
blender -b -t 4 --python tools/rims/model.py -- WORK/steel steel
blender -b -t 4 --python tools/rims/model.py -- WORK/window window
node tools/rims/register.mjs REPO DEPS WORK/disc
node tools/rims/register.mjs REPO DEPS WORK/steel
node tools/rims/register.mjs REPO DEPS WORK/window
node tools/rims/verify.mjs REPO DEPS WORK
node tools/rims/check-workshop.mjs DEPS CHROMIUM WORK/workshop-integration.json
```

`tools/rims/preview.py` drives the existing test-only review server for standalone/fitted renders and default parity; `tools/rims/preview-workshop.mjs` captures the real workshop panel after its camera tween settles.
