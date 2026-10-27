# Collectible studio refinement

## 1. Camera limits

The camera's minimum distance is derived from the fitted car's measured bounding sphere, the permitted target offset and a 0.35 m margin. Pan is clamped to a small box around that sphere's centre. A second guard rejects camera positions inside the car's bounding box expanded by 0.30 m. Orbit elevation is limited to 85° from vertical, including preset tweens, so the camera stays above the floor. This intentionally replaces the previous exactly level Side elevation with the requested above-ground limit.

[Camera test report](camera-limits.json): 75 safe observations across all five presets using trusted WebKit touch pinch, pan and rotation plus Chromium scroll input. A deliberately invalid scripted pose also recovered outside the expanded bounds. Zero console errors. This was browser emulation, not physical iPad hardware.

## 2. Baked shading

Blender **4.3.2** performed a real Cycles CPU AO vertex-colour bake: 32 samples, local 0.35 m distance, cabin and ground occluders. Signed edge curvature comes from welded manifold edge angles. Linear COLOR_0 stores AO in R and signed curvature in G; the shader reads those channels without tinting paint. All three artistic strengths live in `BAKED_LOOK`. There is no screen-space AO, cavity render target or per-frame curvature computation.

The first 10 m AO-distance experiment was rejected because it shaded broad outer panels. The accepted 0.35 m bake preserves open white panels and concentrates shading at crevices. Attribute coverage checks also caught additional glass primitives and shared hub geometry during integration; the accepted asset covers every primitive, with neutral data on glazing.

[Reproducible offline pipeline](../../tools/bake/README.md), [Cycles report](bake.json), [packing/storage report](bake-packing.json), and [renderer smoke check](baked-smoke.json). Original geometry, normals, indices and transforms are preserved byte-for-byte; the new attribute uses normalized 8-bit values while existing position/normal quantisation stays intact. Its compressed Base64 increment is **1,417,080 bytes** under the same gzip settings. Front and 3/4 renders were inspected with zero console errors.

## 3. Satin toy materials

Paint uses roughness 0.38, clearcoat 0.55 and clearcoat roughness 0.20. Glazing is neutral #20282c; rims retain the existing shape with brighter satin gunmetal; chrome roughness is 0.24. A single overhead directional key plus hemisphere and the existing environment replaces the previous multi-light reflection rig. Four simple satin arch liners close the openings behind the tyres without adding suspension or underbody details. Front/quarter inspection found no detached or intersecting liners. [Material-stage render check](materials-smoke.json): zero console errors.

## 4. Model and render fixes

The apparent brown garnish was an opening through the imported exterior: rear-view raycasts hit the tan cabin, not a wood material. A fitted, crowned satin-metal backfill now closes it. The new part has real Cycles AO/curvature, is recessed behind the surrounding shell and is trimmed to the measured inner-lamp/black-trim boundary. Raycasts now hit the exterior garnish; clear lamp lenses remain exposed. [Garnish bake](garnish-bake.json) and [rear render/raycast verification](render-fixes.json).

The spoiler is reduced to half its source depth, with a shallow crown and slight trailing-tip drop; its lower feet remain attached and the upper supports/lens move together. These are photo-guided artist adjustments, not OEM dimensions. Side and Top were checked against the existing reference comparison. The second directional floor shadow is removed. One centred, depth-baked contact map is stronger and more softly blurred, eliminating the Rear steps and Quarter offset ghost. It is generated once at load, with no per-frame postprocessing. The initial meta theme colour is Cream and still follows the studio toggle.

## 5. Optional collectible base

The Base toggle adds an unbranded bevelled two-tone plinth, off by default. It has its own real Cycles AO/curvature bake, a visible graphite edge and an ivory deck. Camera fitting includes the whole base while it is visible; the car and tyre dimensions do not change. Its contact shadow is restricted to the deck. [Plinth bake](plinth-bake.json) and [five-preset fitting/toggle checks](base-checks.json). The asset adds 576 triangles and 9,328 embedded Base64 bytes; these are generated-asset measurements, not hardware performance figures. Front/Rear fitting is constrained by available height; Side/Quarter/Top occupy approximately 80% of viewport width, as recorded in the report.

## 6. Specifications and final acceptance

Height remains **1,930 mm**, verified against Toyota UAE's official May 2021 GXR sheet. Toyota Jordan's regional LC200 catalogue separately gives **1,890 mm +40 mm with roof rails**, which supports the rail allowance but is not a 2021 UAE grade certificate. [Sources and scope](specification.md). No model-height rescale or wheel/tyre-text change was made. The fallback now says satin gunmetal alloys, matching the render; unsupported ground clearance is marked unverified. The owner confirmed keeping the existing four swatches plus custom picker.

Final source SHA-256: `38bde8608d78ef799dd065460eeb772e077edb22a30dffbf978db30f325a4cc7`.

| Measured item | Before | After |
| --- | ---: | ---: |
| index.html, decimal MB | 11.465444 | 12.922088 |
| WebKit median frame interval | 622 ms | 506 ms |
| WebKit 95th-percentile interval | 960 ms | 580 ms |
| Measured rotating frame intervals | 24 | 24 |

The baked car/interior attribute adds **1,417,080 Base64 bytes (1.417080 MB)** after gzip; its uncompressed aligned attribute data is 3,253,972 bytes. The fitted garnish adds 20,312 embedded bytes and the optional base 9,328; the remaining file growth is code, markup and documentation. [Exact size report](size.json), [before timing](performance-before.json), [after timing](performance-after.json).

Timing used the actual renderer at **1366×1024, DPR 1**, four warmup frames and 24 auto-rotation frame intervals, with software WebKit/Linux WPE and no simultaneous baking/capturing. This is emulated WebKit, **not a physical iPad**; it does not certify hardware frame rate or attribute the complete timing difference solely to AO.

- Every preset, before/after: [Cream](before-after-cream.jpg) · [Slate](before-after-slate.jpg).
- Final five views: [Cream](final-cream.jpg) · [Slate](final-slate.jpg).
- [Front details, both studios](front-detail.jpg): bonnet, grille and mirror, native-pixel crops from matching Quarter screenshots.
- [Optional base](base-quarter.jpg) · [No-JavaScript fallback](no-js.jpg) · [Eight rotation angles](../rotation.jpg).
- [Final Chromium report](chromium.json): 20 screenshots (10 studio/preset combinations, 8 orbit angles, base and fallback), zero errors; all control, framing, baked-attribute and material checks pass.
- [Final native camera stress](camera-final.json): 75 safe observations across all presets; trusted WebKit pinch/pan/rotate, Chromium wheel and invalid-pose recovery pass with zero errors.
- [Consolidated validation](../validation.json).

Nothing from tasks 1–6 was omitted; the optional base was included. Physical iPad hardware testing was unavailable. Exact pixel matching to the live GTAO prototype was not verified because no prototype image or URL was supplied. The owner's new wheel colour/style confirmation is still absent, so the existing geometry and tyre text were retained. All generated car/base parts remain unbranded.
