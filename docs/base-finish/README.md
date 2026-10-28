# LC200 clean base finish — reference review

**Status: implementation preview; owner photo matching is pending.** The requested owner photos were not included in the accessible message/workspace. Emblem placement/size and lamp agreement are provisional. LAND CRUISER / grade lettering is not added without photo confirmation.

Baseline `f553e19acf9e0227c0df1656ef4ce4169d3a46b8`. Tested index.html SHA-256 `c0ece8bdc3706c15b93ab71e6f5a326610ca59038d37d0498a1b1068caeb5c38`.

## Full-size before / after

All PNGs are 1440 × 1000. Click a link for the full file.

| Studio / view | Before | After |
|---|---|---|
| cream-front | [PNG](before/cream-front.png) | [PNG](after/cream-front.png) |
| cream-side | [PNG](before/cream-side.png) | [PNG](after/cream-side.png) |
| cream-rear | [PNG](before/cream-rear.png) | [PNG](after/cream-rear.png) |
| cream-quarter | [PNG](before/cream-quarter.png) | [PNG](after/cream-quarter.png) |
| slate-quarter | [PNG](before/slate-quarter.png) | [PNG](after/slate-quarter.png) |
| clay-quarter | [PNG](before/clay-quarter.png) | [PNG](after/clay-quarter.png) |
| Close-up: emblem-front | [PNG](before/emblem-front.png) | [PNG](after/emblem-front.png) |
| Close-up: emblem-rear | [PNG](before/emblem-rear.png) | [PNG](after/emblem-rear.png) |
| Close-up: tail-lamp | [PNG](before/tail-lamp.png) | [PNG](after/tail-lamp.png) |

An owner-photo comparison cannot be provided until that file arrives; no substitute image is represented as the owner’s vehicle.

## Measured finish

| Cream 3/4 metric | Before | After |
|---|---|---|
| bonnet: p95 L* minus median | 0.35 | 4.14 |
| roof: p95 L* minus median | 1.37 | 5.18 |
| frontDoor: L*, pixel [862, 505] | 79.47 | 78.46 |
| sideGlass: L*, pixel [835, 332] | 19.70 | 34.32 |
| blackPillar: L*, pixel [922, 330] | 1.86 | 15.00 |
| grilleMetal: median L* | 49.50 | 65.38 |
| doorHandleMetal: median L* | 53.43 | 66.75 |

Glass C* 4.09, hue 236.9°. Side glass L* 37.26. Surface pixels and hue/chroma are fully recorded in [pixels.json](pixels.json).

7x7 per-channel median display-sRGB, then standard CIELAB D65. Panel p95 uses pixel Lab over semantic masks eroded three pixels. Gap values use the darkest centreline pixel within a five-pixel window around the authored part boundary; adjacent paint is a 7x7 median. No extra pass or map is added to the product: semantic masks are test-only.

| Visible gap / sample | Before ΔL* | After ΔL* |
|---|---|---|
| cream-side-door, minimum of 5 sampled points | 24.20 | 36.09 |
| cream-quarter-door, minimum of 5 sampled points | 5.40 | 31.08 |
| cream-quarter-bonnet, minimum of 1 sampled points | 95.92 | 89.74 |
| cream-side-bonnet, minimum of 1 sampled points | 6.98 | 36.48 |
| cream-rear-tailgate, minimum of 1 sampled points | 20.82 | 40.54 |

Tailgate face is measured in Rear because it is occluded in the front 3/4 and level Side presets.

## Parts and geometry lock

| New part | Slot | Triangles | GLB |
|---|---|---:|---|
| emblem_front | emblem_front | 4,608 | [parts/emblem_front.glb](../../model/parts/emblem_front.glb) |
| emblem_rear | emblem_rear | 4,608 | [parts/emblem_rear.glb](../../model/parts/emblem_rear.glb) |
| lamp_rear_L_finish | lamp_rear_L | 64,045 | [parts/lamp_rear_L_finish.glb](../../model/parts/lamp_rear_L_finish.glb) |
| lamp_rear_R_finish | lamp_rear_R | 64,460 | [parts/lamp_rear_R_finish.glb](../../model/parts/lamp_rear_R_finish.glb) |

The emblem footprints are authored dimensions, not verified OEM badge measurements. Each has 2.5 mm relief and is registered as rigidClass body. Both are visible by default. Mount envelopes use the supplied model-face coordinates; exact photo heights are pending.

The original lamp geometry contains light-guide/LED and reflector structures. Material-only tests exposed them but retained invalid/faceted lens shading. New lamp variants therefore keep the original POSITION, COLOR_0 and triangle topology, while repairing lens/reflector normals on the new copies with angle-weighted geometric normals, 1 µm position bins and a 65° crease limit. The old lamp GLBs remain registered and can be restored through the same slots. [Variant audit](lamp-variants.json).

**All 35 pre-session GLBs remain byte-identical.** This protects stored geometry, NORMAL and COLOR_0; the vehicle root stays scale 1.0. Existing part pivots and camera presets remain unchanged. [Asset audit](asset-audit.json) · [Camera audit](camera-audit.json).

## Verification

- `node tests/visual.mjs`: 31 boolean checks pass, zero errors, including overhangLock. [Results](visual-checks.json).
- Static no-JS fallback is checked/captured in an isolated Chromium process, avoiding its software-WebGL compositor capture failure. No assertions or bounds tolerances were weakened.
- Bounds: {'length': 4.99998990836446, 'height': 1.930053446795627, 'widthIncludingMirrors': 2.296633268547192, 'minX': -2.58500075340271, 'maxX': 2.4149891549617504}.
- Emulated WebKit: passed, zero errors, native render 167 draws / 836,232 submitted triangles. [Report](webkit.json). This is Linux software GL with an iPad viewport, not a physical iPad.
- The side bonnet edge has unoccluded/flat baked values at its exact boundary (R=1/G≈0.51). A material-only hem mask derives a 24-point profile once from the immutable stored bonnet triangles. It reads position for colour only, follows the local rigid frame, and changes no vertex, NORMAL or COLOR_0. Other panel definition uses the existing baked R/G. No derivative cavity or screen buffer is used.
- No new render target, texture map, post-processing pass or shadow map. Existing PMREM emitters were resized/repositioned; map count stays the same. Glass transmission remains 0. The existing contact shadow and controls remain.
- No mud, wear, dirt, decals, numbers, livery, props, or tyre changes are added.

## Every changed value

[Machine-readable value/file/line list](changed-values.json). All reported positions/dimensions refer to authored or measured model geometry; owner-photo placement is not yet verified.

| Name | Old | New | File:line |
|---|---|---|---|
| Paint roughness | `0.38` | `0.42` | index.html:262 |
| Paint clearcoat | `0.55` | `0.35` | index.html:262 |
| Paint clearcoat roughness | `0.2` | `0.3` | index.html:262 |
| Paint environment intensity | `0.9` | `0.7` | index.html:262 |
| Chrome roughness | `0.24` | `0.52` | index.html:263 |
| Chrome metalness | `1` | `0.45` | index.html:263 |
| Chrome environment intensity | `0.95` | `0.85` | index.html:263 |
| Chrome clearcoat | `0.15` | `0.08` | index.html:270 |
| Chrome clearcoat roughness | `0.23` | `0.3` | index.html:270 |
| Glass colour | `"#20282c"` | `"#46545f"` | index.html:264 |
| Glass roughness | `0.13` | `0.28` | index.html:264 |
| Glass opacity | `0.88` | `0.8` | index.html:264 |
| Glass environment intensity | `1.05` | `0.4` | index.html:264 |
| Glass clearcoat | `0.2` | `0.1` | index.html:273 |
| Glass specular intensity | `0.25` | `0.45` | index.html:274 |
| Glass clearcoat roughness | `0.045` | `0.22` | index.html:275 |
| Cream black trim colour | `"#050607"` | `"#282a2c"` | index.html:265 |
| Slate black trim colour | `"#0d1115"` | `"#282a2c"` | index.html:265 |
| Cream black trim roughness | `0.72` | `0.65` | index.html:265 |
| Slate black trim roughness | `0.56` | `0.65` | index.html:265 |
| Cream black trim environment intensity | `0.2` | `0.3` | index.html:265 |
| Slate black trim environment intensity | `1` | `0.3` | index.html:265 |
| Slate black trim specular multiplier | `1` | `0.25` | index.html:265 |
| Paint direct diffuse gain | `9` | `2.2` | index.html:296 |
| Paint indirect fill gain | `2.5` | `3.4` | index.html:296 |
| Rear-facing indirect multiplier | `3.8` | `0.5` | index.html:297 |
| Paint baked AO strength | `1.12` | `1.2` | index.html:297 |
| Paint concave curvature strength | `1.35` | `1.65` | index.html:297 |
| Paint cavity floor | `0.1` | `0.06` | index.html:333 |
| Paint diffuse cavity weight | `0.9` | `1.0` | index.html:353 |
| Paint indirect specular cavity weight | `0.85` | `1.0` | index.html:355 |
| Paint direct specular cavity weight | `0.5` | `1.0` | index.html:355 |
| Paint indirect clearcoat cavity weight | `0.85` | `1.0` | index.html:358 |
| Paint direct clearcoat cavity weight | `0` | `1.0` | index.html:359 |
| Occluded ridge lift multiplier | `1` | `"bakedCavity × bakedAO³"` | index.html:361 |
| Concave seam attenuation strength | `0` | `0.7` | index.html:266 |
| Concave seam curvature gate | `null` | `[0.04, 0.18]` | index.html:266 |
| Concave seam occlusion gate | `null` | `[0.12, 0.5]` | index.html:266 |
| Bonnet reflection emitter size | `[6, 0.9]` | `[1.4, 0.6]` | index.html:240 |
| Bonnet reflection emitter position | `[0.8, 2.8, -5]` | `[3.7, 1.9, -5]` | index.html:240 |
| Bonnet reflection emitter radiance | `2.8` | `215` | index.html:240 |
| Side reflection emitter radiance | `6.5` | `2.5` | index.html:242 |
| Roof reflection emitter size | `[7, 0.55]` | `[1.8, 0.6]` | index.html:243 |
| Roof reflection emitter position | `[0.5, 2.4, -6]` | `[5, 0.9, -5]` | index.html:243 |
| Roof reflection emitter radiance | `4` | `200` | index.html:243 |
| Rear red lens colour | `"#ab0616"` | `"#9e0818"` | index.html:655 |
| Rear red lens clearcoat roughness | `0.05` | `0.06` | index.html:656 |
| Rear red lens environment intensity | `1` | `1.1` | index.html:656 |
| Rear red lens emissive colour | `"#6a0410"` | `"#430007"` | index.html:657 |
| Rear red lens emissive intensity | `0.12` | `0.035` | index.html:657 |
| Rear red lens transparent | `false` | `true` | index.html:658 |
| Rear red lens opacity | `1` | `0.55` | index.html:658 |
| Rear red lens depth write | `true` | `false` | index.html:658 |
| Rear red lens side | `"DoubleSide"` | `"FrontSide"` | index.html:659 |
| Rear lenses flat shading | `true` | `false` | index.html:659 |
| Rear lenses force single pass | `false` | `true` | index.html:659 |
| Rear clear lens colour | `"#dce8f2"` | `"#f2f5f4"` | index.html:662 |
| Rear clear lens roughness | `0.055` | `0.1` | index.html:662 |
| Rear clear lens clearcoat | `0.9` | `0.75` | index.html:662 |
| Rear clear lens clearcoat roughness | `0.23` | `0.08` | index.html:663 |
| Rear clear lens environment intensity | `1` | `1.1` | index.html:663 |
| Rear clear lens opacity | `0.16` | `0.35` | index.html:664 |
| Rear clear lens emissive colour | `"#bfd4ef"` | `"#bfc6c4"` | index.html:664 |
| Rear clear lens emissive intensity | `0.025` | `0.12` | index.html:664 |
| Rear reflector chrome roughness | `0.24` | `0.22` | index.html:668 |
| Rear reflector chrome metalness | `1` | `0.95` | index.html:668 |
| Rear reflector chrome environment intensity | `0.95` | `1.1` | index.html:669 |
| Rear reflector chrome clearcoat roughness | `0.23` | `0.3` | index.html:270 |
| Tailgate garnish roughness | `0.24` | `0.45` | index.html:672 |
| Tailgate garnish metalness | `1` | `0.45` | index.html:672 |
| Tailgate garnish environment intensity | `0.95` | `0.85` | index.html:672 |
| Slate paint variant | `"original studio paint"` | `"same satin paint variant as Cream"` | index.html:583 |
| Clay paint variant | `"matte warm-white height-shaded clay"` | `"common satin painted metal"` | index.html:583 |
| Clay white display colour | `"#efe6da"` | `"#f4f4ef"` | index.html:537 |
| Clay paint roughness | `0.85` | `0.42` | index.html:262 |
| Clay paint clearcoat | `0` | `0.35` | index.html:262 |
| Clay paint clearcoat roughness | `1` | `0.3` | index.html:262 |
| Clay paint specular intensity | `0.1` | `1` | index.html:268 |
| Clay paint environment intensity | `0.035` | `0.7` | index.html:262 |
| Clay glass variant | `"unlit plum gradient"` | `"physical blue-grey tinted glass"` | index.html:597 |
| Clay exterior chrome variant | `"matte pink-grey"` | `"common satin metal"` | index.html:597 |
| Clay exterior black variant | `"matte plum-grey"` | `"common neutral dark grey"` | index.html:597 |
| Clay rear lamp variant | `"matte dusty red"` | `"common optical lens/reflector materials"` | index.html:597 |
| Clay exposure | `2.4` | `1.2` | index.html:968 |
| Clay environment intensity | `0.1` | `0.65` | index.html:968 |
| Clay key colour | `"#ffe0b0"` | `"#fffbf5"` | index.html:968 |
| Clay key intensity | `5.8` | `1.65` | index.html:968 |
| Clay key position | `[-3.8, 10, 1.2]` | `[-1.5, 8, 2]` | index.html:968 |
| Clay fill sky | `"#fff0df"` | `"#f7f5f0"` | index.html:968 |
| Clay fill ground | `"#c2a688"` | `"#52565c"` | index.html:968 |
| Clay fill intensity | `0.45` | `0.6` | index.html:968 |
| Sharp occluded-convex gap strength | `0` | `0.45` | index.html:266 |
| Sharp gap ridge gate | `null` | `[0.5, 0.75]` | index.html:337 |
| Sharp gap occlusion gate | `null` | `[0.02, 0.2]` | index.html:337 |
| Slate paint direct diffuse gain | `1` | `2.2` | index.html:296 |
| Slate paint indirect diffuse gain | `1` | `3.4` | index.html:296 |
| Clay painted-surface AO/ridge/valley | `[0.65, 0.52, 0.72]` | `[1.2, 1.0, 1.65]` | index.html:297 |
| Clay painted-surface height modulation | `{"lowerKey": 0.09, "start": 0.65, "end": 1.14}` | `"not applied to common satin paint"` | index.html:583 |
| Bonnet missing-shutline boundary strength | `0` | `0.98` | index.html:508 |
| Bonnet boundary radius (metres) | `null` | `0.006` | index.html:508 |
| Bonnet boundary profile samples | `null` | `24` | index.html:494 |
| Bonnet boundary derivation | `null` | `"read-only stored triangle cross-sections; colour varying only"` | index.html:487 |
| Paint shader program | `"lc200-cream-paint-lighting-v4"` | `"lc200-base-paint-lighting-v9"` | index.html:383 |
| Baked shader program | `"lc200-baked-ao-curvature-v1"` | `"lc200-baked-ao-curvature-v4 + zone suffix"` | index.html:365 |
| Cream detail shader program | `"lc200-cream-baked-detail-v1"` | `"lc200-cream-baked-detail-v4 + zone suffix"` | index.html:365 |
| Default left lamp part | `"lamp_rear_L"` | `"lamp_rear_L_finish"` | build.json:14 |
| Default right lamp part | `"lamp_rear_R"` | `"lamp_rear_R_finish"` | build.json:15 |
| Front emblem slot | `null` | `"emblem_front"` | build.json:39 |
| Rear emblem slot | `null` | `"emblem_rear"` | build.json:40 |

## Reproduction

`tools/base-finish/create-emblems.mjs OUTPUT DEPS` generates new emblem GLBs only. `repair-lamp-normals.mjs DEPS` creates new lamp variants without rewriting originals. DEPS contains the test packages and locally npm-packed Three.js 0.166.1. `python tools/base-finish/measure_pixels.py docs/base-finish` rechecks all 7×7 samples (Pillow + NumPy). Production CDN imports remain pinned.

[Every new repository file](new-files.json).
