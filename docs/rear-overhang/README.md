# Rear overhang correction — 28 October 2026

The owner's car is a GCC **GXR**, not GXR GT. The stored body carried a rear overhang stretched to fit the GXR GT 5,170 mm envelope. That stretch is now undone once, as an owner-approved, documented exception to the geometry lock. The geometry is then re-locked with the numbers below.

## What was wrong

The earlier preparation script (`build_model.py`, [recorded constants](../foundation/source-preparation.json)) pinned four x anchors:

- front bumper −2.585 m
- front axle −1.635 m
- rear axle +1.215 m
- rear bumper +2.585 m

Only a piecewise scale can hit all four anchors exactly, so the source was scaled separately per segment. Between the axles the factor was only 1.003. Behind the rear axle the body was stretched about 15% along x.

Evidence in the stored mesh, measured in an orthographic side render:

- The front arch sat symmetric about its hub. The rear arch opening was 0.503 m ahead of the hub and 0.567 m behind it.
- The tail-lamp front edge sat 0.943 m behind the rear axle. In the real LC200 side photo, scaled by wheelbase, it is 0.824 m.
- Ahead of the rear axle, door edges and arch lips matched the photo within 1–6%.

The Phase 1 investigation also covered the cut-plane alternative. It was rejected: 330–380 of the roughly 650 triangles crossing any plane at x = 1.86–2.00 m are narrower than 75 mm, so moving the rear back would fold them.

## What changed

[`tools/foundation/unstretch_rear.mjs`](../../tools/foundation/unstretch_rear.mjs) applies one rule to every non-wheel vertex whose world x is greater than H = 1.215 m (the rear axle):

x′ = H + (x − H) · k, with k = 1.200 / 1.370 = 0.875912

- **Normals:** stored normals were consistent with the stretched shape (Phase 1 normal test). They therefore get the inverse-transpose of the same scale, n′ = normalize(n.x / k, n.y, n.z).
- **Re-encoding:** positions are re-encoded into each node's existing 16-bit quantisation box. No node needed a refit. The maximum requantisation error is 0.039 mm.
- **Compression:** [`compress_meshopt.mjs`](../../tools/foundation/compress_meshopt.mjs) re-applies the lossless Meshopt writer. Only its file-URL imports changed, so it runs on Windows.
- **Changed files (14 GLBs):** `base.glb`, `bumper_rear`, `tailgate` (with the garnish), `spoiler`, `lamp_rear_L/R`, `roof_rails`, `unsorted_01–05/09/10`.
- **Unchanged:** wheels, doors, bonnet, grille, front bumper, front lamps, mirrors, side steps, display base. All 21 other GLBs are byte-identical.
- **Manifest:** bounds and bounding-box-centre pivots of the 14 parts follow the new geometry. Root and `stored_frame` translations move with each pivot, so world positions are unaffected. Slot pivots are updated to match.
- **Run record:** [`rear-unstretch.json`](../foundation/rear-unstretch.json). [`compression.json`](../foundation/compression.json) is updated for the 14 files.

An independent old/new decode check compares all 34 parts:

- Indices, COLOR_0, node, mesh and material names are identical.
- Every vertex at or ahead of the rear axle is bit-identical, in positions, normals and node transforms.
- All 235,459 vertices behind the axle match the formula within 0.039 mm. Their normals match the inverse-transpose within 0.0015°.

**COLOR_0 (AO + curvature) kept, not re-baked.** The accepted bake used Blender 4.3.2; this machine has Blender 5.2.0. Re-baking the original pre-bake source with the repo's own `bake_vertex.py` and `pack_colors.py` (same settings: 32 samples, 0.35 m, seed 20261027) did not reproduce the stored data exactly:

- 824 of 813,493 vertices (0.10%) differ in AO, by up to 255.
- Curvature was identical.

The old per-vertex values therefore stay, as the owner required. They were baked on the 5.170 m shape, so occlusion behind the axle is about 12% "stretched" relative to the new shape.

## New locked geometry

| Quantity | Before | After |
| --- | ---: | ---: |
| World x range | −2.585 … +2.585 m | −2.585 … **+2.415** m |
| Model body length | 5.170 m | **5.000 m** |
| Front overhang / wheelbase / rear overhang | 0.950 / 2.850 / 1.370 m | 0.950 / 2.850 / **1.200** m |
| Height, width including mirrors | 1.930 / 2.297 m | unchanged |
| Rear arch opening ahead / behind hub, at hub height | 0.503 / 0.567 m | 0.503 / **0.497** m |
| Front arch opening ahead / behind hub | 0.460 / 0.458 m | unchanged |
| Tail-lamp front edge behind rear axle (photo 0.824 m) | 0.943 m | **0.825 m** |
| Hubs, tyres (stored Ø 793 mm) | −1.635 / +1.215 m | unchanged |

`tests/visual.mjs` locks the body: length 5.000 m, min x −2.585 m, max x 2.415 m, height 1.930 m, width 2.297 m. The check is called `trueScaleBounds` + `overhangLock`. With Chrome on this machine, 31/31 checks pass with zero browser errors.

**Labels.** Toyota UAE's May 2021 5.7L GXR sheet gives 5,095 × 1,980 × 1,930 mm and 285/60R18. The spec panel reads "Toyota GXR 5,095 mm · model body 5,000 mm". The tyre text is the owner's **265/70R17**. Only the text changed; the stored wheel geometry remains Ø 793 mm until the tyre-swap work.

## Baselines and overlay

All renders are 1440×1000, made in headless Chrome on the GPU. Repeat captures are byte-identical.

- [Before/after, all five views, Cream](before-after-cream.jpg). Before is `8130b22`, GPT's latest Cream lighting, so only the geometry differs.
- New Cream baselines: [Front](cream-front.jpg) · [Side](cream-side.jpg) · [Rear](cream-rear.jpg) · [3/4](cream-quarter.jpg) · [Top](cream-top.jpg). Also [Slate 3/4](slate-quarter.jpg) and [Clay 3/4](clay-quarter.jpg).
- [Side overlay against the real LC200 photo](side-overlay.png): orange is before, red is after. The model is orthographic and scaled so the wheelbase matches the photo, with hubs aligned. The photo has perspective error: bumper ends and roof are deeper than the side plane and read about 5% / 9% small.

Every view changed, as intended: framing follows the new bounds. Front changed least, 0.5% of pixels by at most 19 levels. Cream/Slate pixel identity is re-based on these captures.
