> Historical fit round at `7adae34`. [Current Cream likeness refinement](../refinement/README.md).

# Rim fit and reference correction

Baseline: `rims-review @ b0de49e`. Main/Pages were not modified.

## A — Fit

1. The metal lip stays **462.000 mm**. A black rubber adapter extends beneath that lip and across the stored tyre opening, reaching **534.000 mm** for overlap. Its shape reads as the lower sidewall. No stock tyre, vertex, NORMAL or COLOR_0 was changed.
2. Every new rim contains a **354.000 mm vented rotor**, two rotor faces with ventilation vanes, a closed hub/hat, five studs, caliper and dark backing. Inner barrel surfaces are dark coated metal, so softbox reflections do not resemble daylight behind a vent. These are simplified die-cast brake parts; the measured size is the authored model dimension.
3. The six sheets below compare **stock | KM720 | MR705 | Shanaber**, using the same front-left or rear-right pose across each row. Each 320×300 crop is enlarged exactly 3×, not a separate camera zoom. Full 1440×1000 source frames and crop positions are retained.

| Studio | Front-left | Rear-right |
|---|---|---|
| Cream | [3× sheet](images/comparison-cream-FL.png) | [3× sheet](images/comparison-cream-RR.png) |
| Slate | [3× sheet](images/comparison-slate-FL.png) | [3× sheet](images/comparison-slate-RR.png) |
| Clay | [3× sheet](images/comparison-clay-FL.png) | [3× sheet](images/comparison-clay-RR.png) |

Source filenames: `images/fit-{cream,slate,clay}-{FL,RR}-{stock,kmc,method,steel}.png`; corresponding individual enlarged crops end in `-3x.png`.

[Coverage samples and crop coordinates](reports/gap-proof.json): **6,282 sampled rays, zero misses** through the openings, bead band and centre at the recorded poses. The ray test intersects the selected wheel/tyre assembly, excluding the floor and car body as substitutes for wheel coverage. Manual review covers both corners and all studios. [Added brake package, rim face hidden](images/added-brake-package.png).

## B — Reference faces and finishes

- **KMC KM720 Roswell · matte anthracite:** shallow, almost flat face; flat lug ring; two concentric raised steps; eight evenly spaced capsule openings; larger flat centre cap; plain stepped metal lip. [Retailer reference](https://www.lmtire-wheel.com/kmc-km720-roswell-matte-anthracite).
- **Method MR705 · titanium:** ten rounded trapezoidal openings in a split-five-spoke layout, replacing the previous eight-window design; smaller cap; wide outer lip and raised ring. [Manufacturer reference](https://www.methodracewheels.com/products/705-matte-titanium).
- **Shanaber steel · silver:** flatter pressing, raised centre hub plate, eighteen round vents, and a dark closed hub visible through the bore. [Gulf retailer visual reference](https://wheel-tire.ae/product/fr-tn01-land-cruiser-steel-wheels/).

The references guide the visible designs. Catalogue dimensions stay exactly as requested: KMC 17×8.5 ET+18, Method 17×8.5 ET0, steel 17×8 ET+25, configured bores and 5×150. Manufacturer/retailer photographs may show other fitments. No claim is made that these are factory CAD or validated real-car fitments. Blank caps are retained; no manufacturer lettering was added.

Only rendered assets are committed. Real reference photos and their side-by-side comparisons are supplied in the chat report, not in this repository.

## C — Small fixes

- Mounted close-ups now contain the actual stored tyre. The old capture reset a car-frame source root as if its vertices were hub-local. The corrected rig uses an outer wrapper translation; stored vertex buffers remain unchanged.
- The Rims panel now states that all rim models are built. The generic “soon” note remains applicable to other unfinished workshop categories.
- Removed the 20 unavailable tyre GLBs and their manifest records: **7,444,320 bytes**. Associated tyre-only sources, tools and previous review media absent from Main were removed from this branch too. The separate `tyres-26570-review` branch preserves that work.
- No reference photos were committed.

## Validation

| Check | Result |
|---|---|
| Native rim workflow | [20/20](reports/workshop-integration.json) |
| Workshop, desktop and emulated phone | [45/45](reports/workshop-smoke.log) |
| Viewer, Cream + Slate, overhangLock | [31/31](reports/viewer.json) |
| Console errors | 0 |
| Stored car GLBs | [56 byte-identical](reports/verification.json) to `a52ad7b` |
| Sampled wheel coverage | 6,282 rays / 0 misses |
| New complete rim assemblies | 12 GLBs; all ≤15,000 triangles |

[Asset dimensions and hashes](reports/verification.json) · [removed tyre files](reports/removed-tyres.json) · [source/capture provenance](reports/provenance.json) · [changed values](reports/changed-values.json).

No existing car material, camera preset, build-state field, fit rule or studio setting was altered. The stock brake meshes stay in place; the added cover/brake geometry belongs to each new rim part. No extra runtime effects, maps or passes. Physical iPad and suspension/steering/road fitment remain untested.

## Reproduce

```sh
blender -b -t 4 --python tools/rims/model.py -- WORK/disc disc
blender -b -t 4 --python tools/rims/model.py -- WORK/steel steel
blender -b -t 4 --python tools/rims/model.py -- WORK/window window
node tools/rims/register.mjs REPO DEPS WORK/disc
node tools/rims/register.mjs REPO DEPS WORK/steel
node tools/rims/register.mjs REPO DEPS WORK/window
node tools/rims/verify.mjs REPO DEPS WORK
```

Start the existing `tools/base-finish/round4b/review-server.mjs REPO DEPS WORK/preview`, then run:

```sh
LC_RIM_WORKDIR=WORK/preview python tools/rims/review-capture.py
node tools/rims/make-crops.mjs DEPS WORK/preview OUTPUT_IMAGES
```

The capture rig uses local pinned Three.js 0.166.1, Playwright Chromium and SwiftShader. Production retains its CDN importmap. The normal viewer includes all fitted hardware; product-style face renders hide the adapter/brakes only to compare visible wheel design with bare product photos.
