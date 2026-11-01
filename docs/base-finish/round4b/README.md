# LC200 base finish — round 4b

Implemented on **base-finish-reference-review**, against **0e2beba** (the rendered baseline is identical to **2a325c3**). Front chrome is reflective, the rear LEDs are unlit by default, the new G matches the source stem weight and profile, and separate rubber backing parts close the rear openings. **Main and Pages remain unchanged.**

The reference is [ZIRODESIGN’s original source](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), with its native materials and lighting. [Source provenance](source/reference.json), [native material data](source/materials.json). No owner photographs are required.

## Screenshots

Every individual frame is **1440 × 1000**. Comparison sheets preserve the original pixels, with captions added above them.

| Item | Original source, native lighting → 2a325c3 → round 4b |
|---|---|
| Front chrome, reflectors and bumper | [Comparison](chrome-comparison.png) |
| Grille detail used for measurements | [Comparison](grille-detail-comparison.png) |
| Unlit tail-lamp dots and guides | [Comparison](led-comparison.png) |
| GXR weight against the original VXR source | [Comparison](grade-comparison.png) |

The source contains VXR lettering; G is newly modelled. The source’s own camera limits, environment and renderer differ from the app, so native-reference pixels are not used as camera-aligned Lab tests. The app’s before/after close-up cameras match.

- Rear gap, [left before/after](gap-L-comparison.png) and [right before/after](gap-R-comparison.png).
- Cream [Front](after/cream-front.png), [Rear](after/cream-rear.png), [3/4](after/cream-quarter.png).
- [Clay 3/4](after/clay-quarter.png).
- Eight full orbit frames: [0°](orbits/000.png), [45°](orbits/045.png), [90°](orbits/090.png), [135°](orbits/135.png), [180°](orbits/180.png), [225°](orbits/225.png), [270°](orbits/270.png), [315°](orbits/315.png).

## Measured finish

[**pixels.json**](pixels.json) contains all coordinates, 7×7 RGB medians, CIELAB D65 values, semantic chrome statistics and image hashes. [Every changed value, with file and line](changed-values.json).

| Cream Front close-up | Before | Round 4b | Target |
|---|---:|---:|---:|
| Grille bars, median L* | 66.97 | **74.73** | 72–82 |
| Grille bars, p95 L* | 80.89 | **99.65** | ≥92 |
| Front emblem, median L* | 71.04 | **84.15** | ≥84 |

The chrome measurements cover the whole visible semantic mesh mask, not selected highlight patches. Front grille, headlamp internals and front-bumper chrome use metallic material with roughness .14. The clear headlamp covers are less opaque and have no emissive component. Body paint, side-trim satin values, glass, tyres, wheels, lighting and cameras retain their accepted settings.

Rear red lamps use **zero emissive intensity by default**, including the separate source LED-cap zones. Five dot/lens pairs have **13.82–35.45 L*** absolute contrast; two guide/lens pairs have **12.30 and 21.70 L*** contrast. The dots are darker than the surrounding lens; the guides catch reflected highlights. The sampled red-lens aggregates are:

| View | L* | a* |
|---|---:|---:|
| Cream Rear | **31.43** | **45.52** |
| Cream 3/4 | **34.02** | **47.77** |

Individual shadow and highlight patches vary; all samples are exposed in the JSON. These aggregates use the same fixed lens coordinates as the earlier report. No emission, bloom, refraction or transmission pass supplies the contrast.

The two additive lamp variants partition the existing indices into separate lens and **22 source LED-cap** material zones per side. POSITION, NORMAL, COLOR_0, transforms and the union of triangles are unchanged. The dark cap primitives draw after the tinted cover, with depth testing enabled, so the cover does not paint over their unlit centres. This is material compositing within the normal scene render.

Data-only activation is available for future workshop work:

```js
await lcBuild.setState({ lamps_on: true });
await lcBuild.setState({ lamps_on: false }); // default
```

There is no new workshop UI. [On/off proof](state-proof.json) records zero default emission and a visible change when enabled; [off](proofs/lamps-off.png), [on](proofs/lamps-on.png).

## G against source X and R

| Measured geometry | New G | Source X | Source R |
|---|---:|---:|---:|
| Full stem width, mm | **10.190** | **9.797** | **10.610** |
| Effective bevel inset, mm | **1.963** | **2.012** | **1.960** |
| Relief along x after mounting-plane slope removal, mm | **5.393** | **5.404** | **5.393** |
| Cap height, mm | **29.516** | **29.503** | **29.516** |
| Baseline y, mm | **946.398** | **946.357** | **946.398** |

G is **+4.00% versus X** and **−3.96% versus R**, within the requested ±5%. Its cap height and baseline equal R. The source X arms have varying widths; the table uses the median of four arm widths perpendicular to their fitted centrelines. R/G use the left stem. Bevel inset is measured from full stroke to flat cap; the source facets vary by arm. [Full method and individual arm measurements](glyph-numbers.json).

Only G is new geometry. Source X, punctuation and R retain their exact attributes, triangles and transforms. The original GXR and VXR GLBs remain. The new variant keeps the original assembly pivot and source glyph spacing. Its sampled back clearance is **0.100–0.688 mm** across the recorded vertex/triangle-centre rays ([mount audit](g-mount.json)). Its bevel ridge is constrained explicitly, with analytic cap/bevel normals for clean highlights.

## Rear seals

`gap_seal_rear_L` and `gap_seal_rear_R` are new GLBs and default-visible slots with **rigidClass body**. Their material is BASE_FINISH neutral black **#282a2c**; Clay uses its matching trim palette. Both move rigidly with the body under lift.

The projected outline follows the existing opening with nominal **10 mm overlap**. The skins use a **0.8 mm x offset** for thickness, with the overlap recessed behind the sampled lamp/garnish/tailgate surfaces. A small inner return, inside the same projected footprint, backs the clear-film corner exposed by low-angle close-ups. Existing meshes are unchanged.

Both low-angle seam regions contain **zero tan pixels** under the documented RGB test, confirmed by the [close-up probe](close-gap-tan-probe.json). The eight orbit views have **zero cabin-material hits in the checked gap regions** ([classification](gap-cabin-proof.json)). Depth-mask candidates that resolve to neighbouring tyres, trim or underbody are identified separately rather than counted as cabin.

[Seal visibility rays](seal-visibility-ray-proof-final.json) test the visible backing pixels in the rear-facing orbit angles. They resolve to existing recesses/back surfaces or already-occluded edge samples, with **zero conflicts over front-facing exterior surfaces**. Front/side angles show no exposed seal pixels. The test masks and orbit frames are included for review.

## Pixel-identical regressions

The literal final-polish render with seals hidden must differ from 0e2beba because items 1–3 deliberately change its materials and G. The actual combined-state difference is recorded, not labelled identical.

The seal-only regression restores the baseline finish and old grade/lamp selections **in the test page**, then hides the seals in the actual new build system:

| Comparison to 0e2beba | Differing pixels |
|---|---:|
| Baseline-finish Cream 3/4, seals hidden | **0** |
| Baseline-finish Cream gap close-up, seals hidden | **0** |
| Clay 3/4, seals hidden | **0** |

[State proof and actual combined comparison](state-proof.json). This isolates the additive parts while retaining the other requested finish changes in the default build. Clay keeps its accepted old G variant, original lamp presentation and materials; the new G is used in Cream/Slate. That preserves the requested Clay identity except for the lamps/seals.

## Validation and delivery

- [Full visual suite](validation/visual.json): **31/31 checks pass**, including overhangLock; **zero viewer console errors**.
- [Independent asset audit](asset-audit.json): all **49 pre-existing GLBs are byte-identical**, including the original 35. The five new files are the two seals, two material-zone lamp variants and GXR grade variant.
- Root scale remains 1.0; existing positions, normals, COLOR_0, pivots, wheels and body bounds are retained. Camera presets and controls are unchanged. Production Three stays **0.166.1**; test pages alone use the npm-packed local copy.
- [Emulated WebKit](validation/webkit.json): auto-rotation passes at **1366×1024**, zero errors. This is Linux software WebKit with an iPad touch profile, **not a physical iPad**. Its timing and measured draw/triangle counts are recorded without a hardware-performance claim.
- There are no new postprocessing, shadow-map or screen-space passes. Added geometry/material zones add scene draws. [Exact encoded byte counts and new-file hashes](sizes.json).
- The native-source capture succeeded; its about:blank parent reported a localStorage-access error. This is separate from the tested viewer’s zero console errors.
- Main remains `f553e19acf9e0227c0df1656ef4ce4169d3a46b8`. No Pages deployment is performed; the live file is checked before and after the review-branch push.

[Offline generators and verification instructions](../../../tools/base-finish/round4b/README.md). No owner-photo work or implementation item is pending.
