# LC200 base finish — round 2

Branch `base-finish-reference-review`, based on `8c62010`. **Implementation tested; owner-photo comparisons remain pending because no owner image attachment was accessible.** Main/Pages are not changed by this review branch.

## Full-size screenshots

Every full view and close-up is 1440 × 1000. Bonnet crops preserve native screenshot pixels. Click any link for the complete image.

| View | Main reference | Before: round 1 | After: round 2 |
|---|---|---|---|
| cream-front | [PNG](main/cream-front.png) | [PNG](before/cream-front.png) | [PNG](after/cream-front.png) |
| cream-side | [PNG](main/cream-side.png) | [PNG](before/cream-side.png) | [PNG](after/cream-side.png) |
| cream-rear | [PNG](main/cream-rear.png) | [PNG](before/cream-rear.png) | [PNG](after/cream-rear.png) |
| cream-quarter | [PNG](main/cream-quarter.png) | [PNG](before/cream-quarter.png) | [PNG](after/cream-quarter.png) |
| slate-quarter | [PNG](main/slate-quarter.png) | [PNG](before/slate-quarter.png) | [PNG](after/slate-quarter.png) |
| clay-quarter | [PNG](main/clay-quarter.png) | [PNG](before/clay-quarter.png) | [PNG](after/clay-quarter.png) |
| Close-up: emblem-front | — | [PNG](before/emblem-front.png) | [PNG](after/emblem-front.png) |
| Close-up: emblem-rear | — | [PNG](before/emblem-rear.png) | [PNG](after/emblem-rear.png) |
| Close-up: tail-lamp | — | [PNG](before/tail-lamp.png) | [PNG](after/tail-lamp.png) |
| Bonnet crop | [PNG](main/bonnet-crop.png) | [PNG](before/bonnet-crop.png) | [PNG](after/bonnet-crop.png) |

The requested lamp/emblem close-ups beside the owner's photographs cannot be supplied without the attachments. No unrelated reference photo is represented as the owner's vehicle.

## Clay restoration

All original Clay material/shading/lighting settings are restored from `f553e19`: warm matte paint, unlit plum glass, pink-grey matte metal, warm key/fill, original AO/curvature and lower-body modulation. Clay displays the unchanged original lamp GLBs; the build state still selects the finish variants for the painted-metal studios. Every recovered emblem/letter uses the Clay chrome material in Clay.

The same single PMREM environment is re-baked with the original main softboxes on entering Clay and the round-one softboxes on leaving it. The prior output is disposed before replacement; no extra resident environment, map or per-frame pass is added. Existing contact shadows are unchanged.

**White Clay 3/4 versus main: zero differing pixels, maximum RGB channel difference 0, with the seven added badge/lettering parts hidden.** [Exact comparison frame](after/clay-without-badges.png). Orange (#e87524) is also pixel-identical with badges hidden: zero differing pixels / maximum channel difference 0 ([main](main/clay-orange-without-badges.png), [round 2](after/clay-orange-without-badges.png)). With the new parts visible, the only changes are those additions. Camera positions, targets, lighting, exposure and Clay uniforms match main exactly. Hiding a selected finish lamp also hides its Clay display counterpart; [regression results](core-regression.json). Full foreground and background were compared, not a cropped mask.

## Paint and lamps

| Bonnet, 30,126 interior paint pixels, shut line excluded | Main | Round 1 | Round 2 |
|---|---:|---:|---:|
| 5th-percentile L* | 94.60 | 91.29 | 94.85 |
| Median L* | 95.57 | 92.70 | 95.14 |
| 95th-percentile L* | 96.19 | 96.61 | 95.24 |
| 5th–95th L* spread | 1.59 | 5.32 | 0.40 |

Bonnet and body-shell/fender AO is applied to existing baked creases rather than broad flat regions, using a curvature gate 0.18–0.40. Door/bonnet shut-line terms and the existing bonnet hem remain. The bonnet key is 6.0 and indirect specular/coat contribution 0.20, leaving a clean satin response. Paint roughness 0.42 and clearcoat 0.35 remain. Central front-door L* remains 78.46.

The latest total-spread cap takes priority over round one's 4–6 L* p95-minus-median target: both cannot hold on the same pixel set when main's entire 5th–95th spread is 1.59.

Rear lenses use deeper red #97000e, opacity 0.94 and a saturated red emissive contribution. Existing LED/reflector structure remains visible through the lens. The former lower red/clear face-classification cut is softened with a material-only tint/alpha transition across |z| 0.805–0.850 m; the source surface is not moved or cut.

| Red lens measurement | L* | a* |
|---|---:|---:|
| cream-rear: median of four fixed 7×7 patch Lab values | 34.66 | 49.41 |
| cream-quarter: median of four fixed 7×7 patch Lab values | 32.39 | 46.47 |
| 3/4 visible lens: median per-pixel Lab | 32.63 | 45.87 |

The gloss highlight patch at [1273,380] is less saturated (a*43.00); all individual patch values, including that patch, are retained in [pixels.json](pixels.json). The target is met by the lens medians; it is not claimed for every specular pixel. Patch coordinates, source surfaces, RGB/Lab and semantic coverage are included. Cream/Slate glass, wheels, tyres, trim and satin finish are retained from round 1.

## Recovered ZIRODESIGN parts

The original extracted source file remained available: **979,826 triangles**, SHA-256 `45cae7b0f6cd85db51f401a24fc19dd7e1ba9b17d1af624a9583ffe3f766b3e0`. No download or replacement procedural geometry was needed. The procedural emblem generator has been deleted and both emblem GLBs replaced by the recovered source.

| Slot / default part | Triangles | Rigid class |
|---|---:|---|
| emblem_rear | 19,328 | body |
| emblem_front | 5,168 | body |
| lettering_rear | 9,300 | body |
| wheel_emblem_FL | 1,208 | wheel; attached to wheel_FL |
| wheel_emblem_FR | 1,208 | wheel; attached to wheel_FR |
| wheel_emblem_RL | 1,208 | wheel; attached to wheel_RL |
| wheel_emblem_RR | 1,208 | wheel; attached to wheel_RR |

`lettering_rear` retains the source LAND CRUISER plus **VXR / V8** pieces, visible by default as requested for source recovery. The owner's car is GXR; this mismatch is explicitly unverified pending the photographs. No GXR lettering has been invented.

Recovery applies the exact historical `build_model.py` axes/height/piecewise-x mapping, whose SHA matches `docs/foundation/source-preparation.json`, followed by the approved rear un-stretch `1.200/1.370 = 0.875912408759124` behind x=1.215. Normals use the inverse transpose. Subsequent mounting uses rigid translations only, per original source component. No tailgate recess or original wheel cap is restored/edited.

**All recovered mapped POSITION and NORMAL bytes, neutral new COLOR_0 bytes, and source triangle topology survive the lossless Meshopt export.** [Attribute/topology audit](source-attribute-audit.json) · [Recovery details](source-recovery.json).

### Mount clearance

All seven parts have a minimum sampled exposed-shell clearance of **0.010 mm** along the mounting direction, without sampled vertex penetration. Each glyph has its own rigid mounting offset in the lettering GLB. The [mounting report](mounting-report.json) includes every component, offset, sample count, unprojected count and clearance distribution.

The source badge/letter meshes are open-backed relief shells; no literal closed back face exists. Therefore the requested full back-face gap of 0–1 mm cannot be certified. Higher shell-to-panel distances include the original raised relief and grille openings and must not be mistaken for a measured mounting gap. No geometry was flattened or rebuilt to manufacture that result. Between-sample triangle/panel intersections and exact owner-photo placement are not certified by this vertex-ray audit.

## Validation and limits

- `node tests/visual.mjs`: **31/31 boolean checks pass; zero console errors**. `overhangLock` and all original tolerances remain unchanged. [Results](visual-checks.json).
- All **35 original GLBs are byte-identical to main**, including stored POSITION, NORMAL and COLOR_0. [Original-asset hashes](original-assets.json). Vehicle root scale remains 1.0; original pivots and camera presets are unchanged.
- Measured assembled bounds: L 5.000024725 m × H 1.930053447 m × W 2.296633269 m; x -2.585035570 … 2.414989155 m. The recovered front badge extends 0.035 mm beyond nominal x=−2.585, within the unchanged 0.1 mm test tolerance; original body bounds are unchanged.
- WebKit, 1366×1024, DPR1: passed, zero errors, auto-rotation observed; **190 draw calls / 865,644 submitted triangles**. This is emulated Linux software GL, not a physical iPad. [After](webkit.json) · [Before](webkit-before.json). Mean frame intervals 476.50 → 489.25 ms; host/software timing is not a hardware performance claim.
- No new per-frame effect, pass, shadow map or post-processing. No mud, dirt, wear, decals, tyre modification, lift or props. Production imports remain pinned to Three.js 0.166.1.

## Changed values and reproduction

[Named old → new values, file and line](changed-values.json) · [New/changed/deleted files](files.json) · [Pixel data](pixels.json).

1. `python tools/base-finish/recover-source-badges.py ORIGINAL_SOURCE.glb RECOVERY_DIR` (NumPy/SciPy). The source SHA and triangle count are checked first.
2. `node tools/base-finish/mount-source-badges.mjs RECOVERY_DIR REPO DEPS` mounts only the new source parts and registers defaults. Requires glTF Transform, Meshopt, Three.js and three-mesh-bvh in the tool dependency directory. Original car GLBs are read-only.
3. `node tools/base-finish/verify-source-badges.mjs RECOVERY_DIR REPO DEPS REPORT.json` independently verifies source groups against the delivered compressed assets.
4. `python tools/base-finish/measure_pixels.py docs/base-finish/round2` recomputes the named 7×7 view samples; all raw PNGs and masks are included for percentile/patch review.

The owner photographs and physical iPad testing remain unavailable. Exact owner lamp agreement, correct GXR grade lettering and a literal back-face gap certification remain outstanding; no claim of completion is made for those items.
