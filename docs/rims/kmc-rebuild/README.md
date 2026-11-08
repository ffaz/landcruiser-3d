# KMC reference comparison revision — pending owner review

This candidate corrects the radial layout using the owner's original photograph
from `IMG_4789.zip`. The [equal-diameter comparison](reference-comparison.png)
and [50/50 overlay](reference-overlay.png) register the original and actual GLB
render by their outer metal circles. Only uniform scale and translation are
applied; bolt positions and internal rings are not used to force alignment.

The previous broad vent recess mainly came from a narrow ring 3 and misplaced
ring 2. Ring 4 and the taper also sat too far outward. The new layout is:

| Feature | Previous authored radii, mm | Revised authored radii, mm |
| --- | --- | --- |
| Ring 1 | 215–225 | 211–224 |
| Ring 2, carrying the upper KMC mark | 198–211 | 188–202 |
| Ring 3 | 146.5–157 | 140–160 |
| Ring 4 | 120–142.5 | 112–134 |
| Groove mouth between rings 3 and 4 | 142.5–146.5 | 134–140 |
| Straight inward taper | 88–118 | 80–110 |
| Whole vent recess, including shoulders | 157–198 | 160–188 |

Ring 4 is **22 mm wide**, exactly **10% wider** than ring 3's 20 mm. Ring 1
remains slightly slimmer than ring 2, as requested. The taper retains its 30 mm
width and shifts inward by 8 mm; the registered comparison did not support
another arbitrary 10% width reduction. The lug-floor transition moves with it.
Its rear skin stays behind the front surface, keeping the Boolean nut seats intact.

The nine vent openings move inward by 3 mm. Their larger clear throats give an
approximately 82×21 px top opening at the comparison scale, versus 83×21 px in
the original. Nut crowns have flatter closed ends. The upper KMC mark remains
entirely on ring 2 at radius 195 mm.

Image-derived visible boundaries now closely track the photograph: ring 2 is
approximately 186.6–201.0 versus the reference's 186.7–200.9; ring 3's outer edge
is about 159.1 versus 159.9; ring 4's inner edge is about 111.4 versus 110.6.
These are equivalent radial millimetres after normalizing the photo to the
model's 462 mm outer diameter, not manufacturer measurements. Ring 1's inner
edge remains about 3 mm farther outward to retain the requested slimmer face.

The complete depth map remains unchanged:

| Depth | Surface |
| --- | --- |
| Level 0 | Thin outer lip |
| Level 1 | Red outer ring 1 |
| Level 2 | Pink ring 2, purple ring 3, green ring 4 — coplanar |
| Level 3 | Recessed vent channel |
| Level 4 | Centre cap |
| Level 5 | Deeper lug floor |

The accepted blue centre geometry, all barrel positions, five-stud 150 mm circle,
bottom-nut orientation, top vent, bottom valve and 17×8.5 ET+18 fit are preserved.
The current candidate has **36,778 triangles**. Dimensions are authored from
photographs; the front image cannot establish the original's axial depths or
justify a numerical percentage of likeness. The reference's six bolts are
intentionally replaced by the requested five-bolt layout.

Current artifacts: `model/review/kmc-reference.glb`, `kmc-reference.blend`,
`reference-entry.json`, `reference-geometry-checks.json`,
`reference-preservation-checks.json` and `reference-provenance.json`.
KMC stays `built:false` in the actual Workshop pending visual acceptance.

Current neutral renders: [front](reference-front.png), [quarter](reference-quarter.png),
[opposite quarter](reference-opposite-quarter.png), [steep quarter](reference-steep-quarter.png),
[complete wheel](reference-wheel.png), [on car](reference-on-car.png). They load
the actual exported GLB in the current viewer through a transient test catalogue.
Exact asset SHA, camera vectors and material override are in `reference-captures.json`.

**70/70 geometry checks pass**, including actual ring faces, the 1.10 width ratio,
all depth levels, tapered surface, five nut-head clearances, aperture dimensions,
vent lands, open throats, closed centre, normals and upper-logo placement.
Six browser captures finish with zero errors. Separate preservation checks prove
that all 2,934 unique centre positions, 31,104 barrel-position values and the six
depth levels are unchanged. These checks do not replace visual acceptance.

Reproduce without enabling KMC:

```sh
blender -b -t 4 --python tools/rims/model.py -- WORK disc
node tools/rims/export-review.mjs REPO DEPS WORK
node tools/rims/verify-review.mjs DEPS WORK
node tools/rims/capture-review.mjs DEPS WORK OUTPUT --neutral
python tools/rims/compare-review.py ORIGINAL_PNG OUTPUT/front.png COMPARISON \
  --reference-circle 309.5192277462 310.3605948429 308.0692690554 \
  --render-circle 719.54197701 525.82667217 429.6144289681
```

DEPS contains glTF Transform core/extensions/functions, Meshoptimizer, Playwright,
Sharp and Three.js 0.166.1. The comparison tool uses Pillow. The supplied circle
fits apply to this original and these 1440×1000 captures; refit after changing
camera/framing. Earlier candidates are historical. Approved Method/Shanaber and
stored vehicle assets remain unchanged.
