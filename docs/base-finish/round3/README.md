# LC200 base finish — round 3

The GXR grade is now the default, the red lenses reveal the original LED guides and clear reverse band, and the recovered emblems/lettering have stronger chrome highlights. Work stays on `base-finish-reference-review`, against `1cdbaa4`; main/Pages is unchanged.

The reference is **ZIRODESIGN's original source and native materials**, as requested. No owner photographs are required. [Original source](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), [native material API data](source/native-materials.json), [source provenance and SHA-256](source/reference.json). The original extracted source has **979,826 triangles and zero textures/images**; its native API factors agree with the extracted PBR factors.

## Screenshots

Individual images are **1440 × 1000**. Comparison sheets retain native image pixels (no resizing or retouching).

- [Tail lamp: original native source | round 2 | round 3](tail-lamp-comparison.png)
- [Original VXR | new GXR, same camera and finish](grade-comparison.png)
- [Cream Rear, round 3](after/cream-rear.png)
- [Cream Front close-up, round 3](after/emblem-front.png)

| View | Before: `1cdbaa4` | After: round 3 |
|---|---|---|
| Cream Front | [PNG](before/cream-front.png) | [PNG](after/cream-front.png) |
| Cream Rear | [PNG](before/cream-rear.png) | [PNG](after/cream-rear.png) |
| Cream 3/4 | [PNG](before/cream-quarter.png) | [PNG](after/cream-quarter.png) |
| Front emblem close-up | [PNG](before/emblem-front.png) | [PNG](after/emblem-front.png) |
| Rear emblem close-up | [PNG](before/emblem-rear.png) | [PNG](after/emblem-rear.png) |

Also: [Cream Side](after/cream-side.png), [Slate 3/4](after/slate-quarter.png), [Clay 3/4](after/clay-quarter.png). Every lamp comparison includes the native original source in the triptych; standalone app lamp images are its constituent panels, not substitute references.

The native Sketchfab image uses the **source's original lighting and renderer**, so its framing and colour pipeline differ from the app. It is the visual/material reference, not a pixel-aligned photometric test. Round-2 and round-3 lamp close-ups use the same app camera. An additional [original GLB under Cream lighting](source/tail-lamp-cream-lighting.png) shows the original source PBR without app finish shaders; this is a technical supplement to the native reference.

## Measurements

[**pixels.json**](pixels.json) contains every coordinate, RGB hex, CIELAB value, image hash and method. Patches use component medians of 7 × 7 sRGB pixels, then CIELAB D65 conversion. Full emblem masks separate the chrome from nearby paint and bars.

| Lamp metric | Round 2 | Round 3 |
|---|---:|---:|
| Cream Rear red-patch aggregate L* | 34.66 | **35.86** |
| Cream Rear red-patch aggregate a* | 49.41 | **54.70** |
| Cream 3/4 red-patch aggregate L* | 34.96 | **33.65** |
| Cream 3/4 red-patch aggregate a* | 46.91 | **47.84** |
| Minimum signed guide-minus-lens contrast, six fixed pairs | −2.95 L* | **14.65 L*** |
| Minimum a* of six surrounding red-lens patches | 46.86 | **45.14** |

The six round-3 guide contrasts are **22.94, 22.83, 14.65, 23.24, 23.19 and 22.37 L***. These are fixed visible dot/bar pairs, not a claim that every red shadow or edge pixel has a* ≥ 45. The former sawtooth region at **(500,635)** is now **#8f9090**, L*59.71, a*−0.37, b*−0.13; (420,593) is also neutral grey. The source's amber bulb is retained, not treated as red bleed. At the 3/4 reverse-strip boundary (1273,390), the finish is **#686969**.

| Chrome region | Emblem median L*: before → after | Emblem p95 L*: before → after | Adjacent metal median / p95, unchanged |
|---|---:|---:|---:|
| Cream Front | 66.99 → **84.15** | 77.31 → **95.49** | grille **67.72 / 78.77** |
| Cream 3/4 | 64.49 → **76.03** | 78.86 → **94.88** | grille **68.39 / 84.84** |
| Cream Rear | 74.73 → **76.56** | 82.69 → **91.22** | garnish **69.08 / 77.99** |
| Cream Front close-up | 64.25 → **71.04** | 79.88 → **96.81** | grille **66.97 / 80.89** |

## Implementation and preserved data

**Grade:** `badge_grade_GXR` is the new default in the separate `badge_grade` slot. X, R and punctuation are copied from the source with identical positions, normals, COLOR_0, triangle indices and world transforms. LAND CRUISER and V8 are split into `lettering_rear_base` without altering their source data. The original `badge_grade_VXR` alternative and original whole `lettering_rear.glb` remain. Selecting the legacy whole lettering hides the separate grade automatically, preventing duplicate letters.

Only G is newly modelled. Its footprint matches the measured V: **44.7843 mm wide × 29.4771 mm high**; relief **5.6994 mm**, measured from the source V's sloping backing plane. Its authored bevel is **0.55 mm with three segments**, nominal stroke **5.3059 mm**, fitted visually to the squared italic source glyphs. The new G has 364 triangles; the GXR assembly has 3,404, versus VXR's 3,844. Its only mounting adjustment is a rigid **+0.51976 mm x translation**. Across 1,456 vertex/triangle-centre rays to the immutable tailgate, the new G's sampled back clearance is **0.100–0.958 mm** ([mount audit](g-mount.json)). Original glyph spacing and mounting are unchanged.

**Lamps:** two additive `*_finish3.glb` variants preserve the round-2 lamp POSITION, NORMAL and COLOR_0 bytes and the exact union of triangles. Only material index grouping is split: the lower bumper reflectors remain on the round-2 finish while the upper lamp uses a coloured filter. Six offline-derived planes follow the convex hull of the **22 original LED-cap centres**; the filter exposes the existing guides rather than inventing new lamp geometry. A position mask makes the lower reverse-strip area optically clear, including stored red-assigned triangles. The original `clearglass_27` zone is assigned clear finish. No source vertex or lens triangle is moved, removed or added.

**Emblems and lettering:** only their chrome-zone finish changes: lighter metal, roughness .22, metalness .85, clearcoat .20, coat roughness .12; front environment intensity 8.0 and rear/lettering intensity 3.0. Grille bars, body paint, bonnet AO, wheels, tyres, cameras and lighting are unchanged. Clay continues using its original matte material clones and original lamp parts.

[All changed values and new files](changed-values.json). [Independent asset audit](asset-audit.json): **all 44 pre-existing GLBs are byte-identical**, including the original 35. Source glyph transforms/attributes and new lamp triangle unions are independently checked. The five new GLBs are:

| File | Purpose |
|---|---|
| `model/parts/badge_grade_GXR.glb` | New G plus untouched original X/punctuation/R |
| `model/parts/badge_grade_VXR.glb` | Original grade retained as an alternative |
| `model/parts/lettering_rear_base.glb` | Original LAND CRUISER and V8, grade separated |
| `model/parts/lamp_rear_L_finish3.glb` | Existing left lamp triangles, material-zone split + metadata |
| `model/parts/lamp_rear_R_finish3.glb` | Existing right lamp triangles, material-zone split + metadata |

## Verification

- [`node tests/visual.mjs`](validation/visual.json): **31/31 true checks, zero console errors**, including overhangLock. Body bounds remain x **−2.58503557…+2.41498915 m**, height **1.93005345 m**, width including mirrors **2.29663327 m**; root scale 1.0. Production Three stays **0.166.1**. Test copies alone use the npm-packed local library and matching decoder with SwiftShader Chromium.
- [Clay white/orange pixel comparison](clay-regression.json): **zero differing pixels**, maximum channel difference 0, with only the intentionally replaced name/grade assembly hidden. Original front/rear emblems, paint, glass, wheels and original Clay lamps remain visible. Round 2's earlier main-Clay restoration therefore remains intact.
- [Build-state checks](state-checks.json): GXR/VXR mutual exclusion, legacy-lettering bundle and hidden selected lamp/fallback all pass.
- [Emulated WebKit](validation/webkit.json): 1366 × 1024, DPR1, auto-rotation changed the camera, zero console errors. Twelve software-rendered intervals: mean **493.67 ms**, p95 **523 ms**; this is **not physical iPad performance**. Measured **192 draw calls / 865,204 triangles**. The material-zone split adds two draw calls; the G replaces V with 440 fewer triangles. No new maps, shadow maps, postprocessing or screen-space passes are added.

The native-source capture's about:blank parent emitted one localStorage warning; the reference screenshot and material retrieval succeeded. This is distinct from the tested viewer's zero console errors. No owner-photo work is pending. No main merge or Pages deployment is part of this branch review.

## Reproduction

The additive-asset scripts accept `REPO DEPS REPORT`; `DEPS` contains glTF Transform, meshoptimizer, Three/MeshBVH and the exact npm-packed Three 0.166.1 in `DEPS/package`:

```sh
node tools/base-finish/create-gxr-badge.mjs "$PWD" /path/to/deps /tmp/gxr-generation.json
node tools/base-finish/fit-gxr-mount.mjs "$PWD" /path/to/deps /tmp/g-mount.json
node tools/base-finish/split-lamp-material-zones.mjs "$PWD" /path/to/deps /tmp/lamp-zone-audit.json
node tools/base-finish/derive-lens-windows.mjs "$PWD" /path/to/deps /tmp/lens-windows.json
node tools/base-finish/verify-finish-round3.mjs "$PWD" /path/to/deps /tmp/asset-audit.json
python tools/base-finish/verify-round3-pixels.py
node tests/visual.mjs
```

Asset generation writes only the five new GLBs and the default manifest/build selections; source and earlier GLBs are read-only. Native source rendering uses the public Sketchfab viewer with its own materials, not a procedural substitute. The source licence/authorship statement in the root README still applies.
