# Cream studio refinement

Cream is the default base studio for the stock car and the future workshop. This refinement keeps its satin physical paint, charcoal glass, near-black rubber, dark metal wheels, chrome/black trim and existing pale background. The supplied references inform soft overhead direction and material separation only; no geometry, accessories, weathering, decals or markings are copied.

The existing lighting was too dim on white paint: the original 3/4 bonnet/roof samples were **#cececc / #bfbebb**. Cream now weights the existing light contributions on painted surfaces, with a steeper key direction and enough ambient fill to keep the rear gentle. Original global lights, exposure, environment and every non-paint material are retained. Paint roughness **0.38**, clearcoat **0.55**, clearcoat roughness **0.20**, authored white **#f4f4ef**, and AO/ridge/valley strengths **0.90 / 0.70 / 0.90** are unchanged.

## Full-size white PNGs

Every image is a lossless **1440×1000** capture. All four before views were captured and inspected before editing. Tests use the actual preset buttons, wait for the camera tween, then render the final frame. Only the temporary test page uses the locally packed Three.js **0.166.1**; production CDN imports remain pinned and unchanged.

| View | Before | After |
| --- | --- | --- |
| Front | [PNG](before/front.png) | [PNG](after/front.png) |
| Side | [PNG](before/side.png) | [PNG](after/side.png) |
| 3/4 | [PNG](before/quarter.png) | [PNG](after/quarter.png) |
| Rear | [PNG](before/rear.png) | [PNG](after/rear.png) |

## Sampled pixels

Each value is the per-channel median of the same **7×7** pixel patch before and after. Raycasts validate **49/49** pixels against the intended material zone. Coordinates and source/PNG hashes are recorded in [pixels.json](pixels.json). The level Side camera hides the horizontal bonnet/roof tops, so its samples are labelled visible outer edges. Far-side tyre contacts are occluded; both visible left tyre contacts are measured. Side ground patches are outside its narrow contact stripe, and do not measure its densest contact shadow.

| Surface | 3/4 before | 3/4 after | Side before | Side after |
| --- | --- | --- | --- | --- |
| Bonnet / Side outer edge | #cececc | #f3f1ee | #d1d1ce | #f4f2ef |
| Roof / Side outer edge | #bfbebb | #efece7 | #d5d4d2 | #f1efec |
| Front door | #b6b5b3 | #d8d6d2 | #bbbab8 | #dad8d4 |
| Lower door | #b9b8b6 | #dfddd8 | #c0bfbd | #e0deda |
| Background | #eee8e0 | #eee8e0 | #eee8e0 | #eee8e0 |
| Tyre rubber | #252526 | #252526 | #262727 | #262727 |
| Wheel face | #35393c | #35393c | #3b3f42 | #3b3f42 |
| Side glass | #293134 | #293134 | #67696b | #67696b |
| Ground at front left tyre | #292826 | #1f1e1d | #ece6dd | #ece6dd |
| Ground at rear left tyre | #64625e | #53514e | #ede7df | #ede7df |

In 3/4, the bonnet is **12.6%** and roof **10.3% brighter** than the front door. The two visible tyre-contact samples average **19.4% darker** than before. These percentages use Rec.709 weights on displayed sRGB values; the ledger also records linear-light luminance so the two metrics are not confused. Tyre, wheel, glass and background samples are exactly unchanged in both measured views.

The contact adjustment is restricted to very low depth casters. The original broad term **0.34 × proximity^2.5**, near weight **0.66**, shadow tint, opacity, map sizes and blur kernels remain unchanged. All **eight farther-ground control patches are exactly unchanged**; [coordinates and exact deltas](pixels.json) record the spatial extent.

- [3/4 sampling map](sampling-quarter.png)
- [Side sampling map](sampling-side.png)

## Every changed look value

All of these apply in **Cream only**. The gains/tint multiply light energy, not the paint swatch. The direction vectors below are normalised for rendering; they describe the direction toward the light rather than a moved part or camera.

| Value | Old | New |
| --- | --- | --- |
| Paint direct diffuse key gain | 1 (implicit) | 9.0 |
| Paint indirect diffuse fill gain | 1 (implicit) | 2.5 |
| Paint key world direction | [-1.5, 8, 2] | [-3.8, 10, 0.1] |
| Paint key tint multiplier | #ffffff (identity) | #fff0d6 |
| Near-contact depth exponent | 24.0 | 16.5 |
| Added low-caster depth blend band | No blend band | smoothstep(0.88, 0.94, proximity) |

A cached Cream paint variant wraps the existing baked shader. It changes the first directional light’s direction locally within that material program, then weights direct/indirect diffuse before the unchanged baked AO/crease math. The original physical satin/specular material properties remain. Clay and Slate keep their original material programs. Their contact bake uses the original literal exponent path with the Cream override disabled.

## Verification

The application remains one HTML file with the existing external parts/build data. `index.html` is **64,685 → 67,388 bytes** (+2,703). All **9,884,184 GLB bytes** are unchanged. No new light, effect, pass, shadow map, texture or geometry attribute is added. Cream remains **167 draw calls**, matching its baseline; existing transparent physical lenses account for its higher count than Clay.

Final source SHA-256: `8a66d4b52c5d75b75713ba22f1cf5664c6957b6f01c9452c519240f51a00084d`. Baseline source: `a11ab741b5f39304c48c2e0de168ecd200bc6cf2f94366587a3c6ad985469071`.

The [regression](regression.json) passes **28 checks** with **zero errors**. All **12 Clay/Slate PNG comparisons have zero differing pixels** (five white presets and orange 3/4 in each studio). Cream’s first-load Side and its return after a studio cycle are also identical. [Comparison hashes](comparisons.json). All 38 model/build files, every POSITION/NORMAL/COLOR_0 buffer and node transform, root scale, cameras, satin properties, baked strengths, non-paint materials and shared global lighting are preserved. Swatches, custom/per-part colours, hidden/empty slots and rigid lift pass.

[Native WebKit rendering](webkit-after.json) passes with **zero errors** at 1366×1024 DPR 1 using the actual renderer. It measures 24 frame intervals: mean **488.1 ms**, p50 **489 ms**, p95 **499 ms**, **167 draw calls**. These are **software-emulated WebKit timings**, not physical iPad performance. No before frame-time comparison is claimed; hardware smoothness remains unverified.
