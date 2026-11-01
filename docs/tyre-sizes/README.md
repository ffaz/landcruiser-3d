# Approved A tyre — two requested sizes

**265/75R17** and **285/65R17**, using the approved A tread, clean matte rubber and dark satin 17-inch wheel. These are two new tyre sizes; B–F tread designs are not added. The original A assets and all other stored GLBs remain untouched.

[Tyres together](compare-tyre-quarter.png) · [Tread comparison](compare-tyre-tread.png) · [On-car Side](compare-car-side.png) · [On-car 3/4](compare-car-quarter.png).

Each full-resolution capture is 1440×1000. [265/75 tyre](at26575-tyre-quarter.png) · [265/75 car](at26575-car-quarter.png) · [285/65 tyre](at28565-tyre-quarter.png) · [285/65 car](at28565-car-quarter.png). Comparison sheets use the same camera for each standalone angle and labels above the resized images.

| Size | Calculated diameter | Exported maximum radial diameter | Exported section width | Static front/rear arch clearance |
|---|---:|---:|---:|---:|
| 265/75R17 | 829.3 mm | 829.290 mm | 265.000 mm | 42 / 76 mm |
| 285/65R17 | 802.3 mm | 802.290 mm | 285.000 mm | 56 / 90 mm |

Calculated diameter = 431.8 mm bead seat + twice section width × aspect ratio. Exported values are measured from the new geometry. Static fit is at zero suspension lift and straight ahead; it does not establish physical steering-lock or suspension-travel fitment.

Both sizes are separately authored GLBs at root scale 1.0 and the existing hub pivots. The casing is parameterised around the unchanged 17-inch bead seat; the rim stays the approved size. They use freshly baked Cycles vertex AO plus signed dihedral curvature, made in **Blender 4.3.2**. Every wheel has **14,900 triangles** and Meshopt compression. Nothing is resized in the runtime. The existing tyre-radius logic supplies hub rises of 18.15 mm and 4.65 mm respectively.

Each design has four mounted copies for FL/FR/RL/RR; only the requested size variants were added. Choose the size under Workshop → Wheels & tyres. The default stock build and build.json are unchanged. No new effects, maps or render passes.

[Asset verification](verification.json) confirms all **58 pre-existing GLBs are byte-identical**. [Viewer checks](visual-checks.json): **31/31**, zero console errors, overhangLock retained. [Workshop smoke test](workshop.log): **31/31**. Preview metadata and fit state are included beside every full-size PNG. Physical iPad behaviour is not measured here.

Generators: `tools/tyre-sizes/model.py`, `register.mjs`, `verify.mjs`, `preview.py`. Editable Blender sources: `model/source/tyre-at26575.blend` and `model/source/tyre-at28565.blend`. New dimensions are authored offline; existing GLBs, NORMAL and COLOR_0 are not edited.

## Separate car close-up request

The user requires merging **audit-rig** into **car-polish @ f22ca37 first**, then using its exact 76-shot README workflow. At the time of this tyre delivery, `audit-rig` is absent locally, on origin and from the repository's pull-request refs after fetching. The required `tools/audit` files are also absent from the workspace/history. The missing branch/repository/SHA has been requested. No substitute acceptance rig was invented, no car close-up fixes or gate results are claimed, and car-polish remains at f22ca37.

Main/Pages remain unchanged. The close-up round is pending the required rig; these tyre assets are isolated on tyre-a-review.
