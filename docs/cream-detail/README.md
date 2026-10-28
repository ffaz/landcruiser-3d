# Cream baked-detail refinement

Baseline: `6a0294b`. Tested source SHA-256: `8c519e561fdb0890140f273da327146141fdf8970a2a0c4c9452f760ca8116da`.

[Open the before/after gallery](https://ffaz.github.io/landcruiser-3d/docs/cream-detail/). Full-size PNGs are 1440 × 1000 pixels.

| View | Before | After |
|---|---|---|
| Front | [PNG](before/front.png) | [PNG](after/front.png) |
| Side | [PNG](before/side.png) | [PNG](after/side.png) |
| 3/4 | [PNG](before/quarter.png) | [PNG](after/quarter.png) |
| Rear | [PNG](before/rear.png) | [PNG](after/rear.png) |

Cream reads the existing COLOR_0 data more strongly through separate shader uniforms. R still means baked AO; G=0.5 is flat signed curvature. AO contrast ramps with curvature, so broad flat panels retain their brightness while handles, recesses and creases get stronger occlusion. Convex highlights stay subtle. Rear-facing paint receives extra indirect fill before that cavity attenuation; it is not emissive and follows the authored paint colour. The rear mask uses the existing world normal: +X is rear. No vertex, NORMAL or COLOR_0 data is written.

The black material variant covers window surrounds/pillars, grille gaps, lamp housings, bumper/lower trim and steps. Wheel assemblies are excluded. Chrome slats and metal handles keep their original material. Explicit global or per-part black colour overrides still take precedence.

## Every changed value

| Value | Before | After |
|---|---|---|
| Background centre / 0% | `#EFEAE3` | `#ECECEA` |
| Background middle / 50% | `#EDE7DF` | `#EBEBE9` |
| Background edge / 100% | `#E4DED5` | `#E1E1DF` |
| Cream theme colour (initial + switch) | `#EFEAE3` | `#EBEBE9` |
| Baked AO strength | `0.90` | `1.12` |
| Convex ridge strength | `0.70` | `1.00` |
| Concave valley strength | `0.90` | `1.35` |
| AO exponent | `1.0` | `1.0–2.5, curvature-weighted` |
| AO exponent curvature gate | `none` | `smoothstep(0.02, 0.10, abs(G−0.5)×2)` |
| Cavity minimum | `0.18` | `0.10` |
| Direct diffuse cavity weight | `0.65` | `0.90` |
| Indirect specular cavity weight | `0.72` | `0.85` |
| Indirect clearcoat cavity weight | `0.72` | `0.85` |
| Direct specular cavity weight | `0.25` | `0.50` |
| Rear-facing indirect fill multiplier | `1.0` | `1.0–3.8` |
| Rear fill normal gate | `none` | `smoothstep(0.15, 0.80, worldNormal.x)` |
| Default black trim colour | `#0d1115` | `#050607` |
| Black trim roughness | `0.56` | `0.72` |
| Black trim environment intensity | `1.00` | `0.20` |
| Black trim final specular multiplier, direct + indirect | `1.00` | `0.25` |
| Cream paint shader cache key | `lc200-cream-paint-lighting-v3` | `lc200-cream-paint-lighting-v4` |
| Cream trim shader cache key | `lc200-baked-ao-curvature-v1` | `lc200-cream-baked-detail-v1` |

Original key gain **9.0**, fill gain **2.5**, paint key direction/tint, grazing falloff, exposure, environment, satin roughness/clearcoat and all contact-shadow settings remain unchanged. Rear fill and the AO/curvature additions apply only in Cream. Clay and Slate retain their original shader expansions and materials.

## 7×7 sampled values

Per-channel median of the same 7x7 display-sRGB PNG patch at integer x/y. 1440x1000 viewport, DPR1, Chromium SwiftShader. Geometry-ray validation recorded per patch; mixed patches are explicitly labelled and a 7x7 median can miss a 1px seam.

Each patch below uses per-channel medians, not a single bright or dark pixel. Thin gaps occupy less than half a patch, so their median can describe surrounding paint; the full ledger records material counts for mixed patches.

| View / sample | Pixel x,y | Before | After |
|---|---|---|---|
| front / frontBonnet | [720, 375] | `#f3f1ed` | `#f3f1ed` |
| front / frontBonnetEdge | [366, 377] | `#f1efea` | `#f1efea` |
| front / frontBonnetBackground | [340, 360] | `#eee8e0` | `#ebebe9` |
| front / frontBumper | [445, 551] | `#e0dcd5` | `#e0dcd5` |
| front / background | [720, 100] | `#eee8e0` | `#ebebe9` |
| front / grilleRecess (mixed) | [650, 507] | `#020202` | `#000000` |
| front / bonnetGap (mixed) | [720, 399] | `#262728` | `#020202` |
| front / lampRecess | [447, 487] | `#1b1e20` | `#1b1e20` |
| front / lowerTrim (mixed) | [600, 624] | `#0b0b0c` | `#010101` |
| side / bonnet | [341, 422] | `#f4f2ef` | `#f4f2ee` |
| side / roof | [859, 288] | `#f1efec` | `#f1efec` |
| side / frontDoor | [634, 468] | `#dad8d4` | `#dad8d4` |
| side / lowerDoor | [635, 551] | `#e0deda` | `#dbd8d4` |
| side / background | [720, 140] | `#eee8e0` | `#ebebe9` |
| side / tyreRubber | [330, 539] | `#262727` | `#262727` |
| side / wheelFace | [353, 599] | `#3b3f42` | `#3b3f42` |
| side / sideGlass | [624, 357] | `#67696b` | `#67696b` |
| side / groundFrontLeft | [330, 718] | `#dcd8d0` | `#dbdbda` |
| side / groundRearLeft | [1005, 718] | `#ddd8d1` | `#dcdcda` |
| side / rearQuarter | [1170, 440] | `#e2e0dd` | `#e2e0dd` |
| side / rearQuarterBackground | [1325, 440] | `#e9e3db` | `#e7e7e5` |
| side / sill | [700, 633] | `#bebebc` | `#bdbdbb` |
| side / frontWing | [267, 472] | `#e9e7e3` | `#e9e7e3` |
| side / frontWingBackground | [267, 411] | `#ede7df` | `#ebebe9` |
| side / spoilerTip | [1234, 291] | `#edebe7` | `#edebe7` |
| side / spoilerBackground | [1234, 275] | `#eae4dc` | `#e8e8e6` |
| side / bonnetBackground | [341, 405] | `#ede8e0` | `#ebebe9` |
| side / roofBackground | [859, 250] | `#eee9e1` | `#ececea` |
| side / pillar | [734, 350] | `#4a4a4a` | `#101111` |
| side / handleRecess | [670, 446] | `#d9d8d4` | `#d5d3cf` |
| side / doorGap (mixed) | [715, 468] | `#d8d6d3` | `#d8d6d2` |
| side / archLip | [405, 500] | `#c4c3c2` | `#c4c3c2` |
| side / lowerTrim | [700, 624] | `#000000` | `#000000` |
| quarter / bonnet | [472, 420] | `#f3f1ee` | `#f3f1ee` |
| quarter / roof | [861, 206] | `#efece7` | `#eeebe7` |
| quarter / frontDoor | [871, 467] | `#d8d6d2` | `#d8d6d2` |
| quarter / lowerDoor | [867, 559] | `#dfddd8` | `#dad8d3` |
| quarter / background | [720, 140] | `#eee8e0` | `#ebebe9` |
| quarter / tyreRubber | [608, 599] | `#252526` | `#252526` |
| quarter / wheelFace | [632, 664] | `#35393c` | `#35393c` |
| quarter / sideGlass | [824, 332] | `#293134` | `#293134` |
| quarter / groundFrontLeft | [570, 806] | `#1e1d1c` | `#1d1d1d` |
| quarter / groundRearLeft | [1090, 673] | `#4e4c49` | `#4d4d4d` |
| quarter / pillar | [920, 330] | `#1c1e20` | `#060607` |
| quarter / handleRecess | [898, 438] | `#6d6d6c` | `#515251` |
| quarter / doorGap (mixed) | [933, 490] | `#c5c4c3` | `#c4c3c2` |
| quarter / archLip | [665, 541] | `#c2c2c0` | `#c2c2c0` |
| quarter / lampRecess (mixed) | [516, 534] | `#eae8e4` | `#eae8e4` |
| rear / tailgate | [720, 418] | `#a9a8a6` | `#dadad8` |
| rear / tailgateLower | [720, 565] | `#a09f9d` | `#d4d4d2` |
| rear / rearBumper | [720, 694] | `#a09f9d` | `#d4d4d2` |
| rear / background | [720, 100] | `#eee8e0` | `#ebebe9` |
| rear / tailgateOuter | [1000, 581] | `#9e9e9b` | `#d2d2d0` |
| rear / plateRecess (mixed) | [579, 567] | `#17191b` | `#17191b` |
| rear / lampRecess (mixed) | [518, 488] | `#3b3d3e` | `#3b3d3e` |
| rear / lowerTrim | [700, 714] | `#161616` | `#010101` |
| rear / rearPanelEdge | [403, 600] | `#adadab` | `#acaba9` |

[Full sample ledger and ray validation](pixels.json). [Regression details](checks.json).

## Verification

- **35 checks pass; zero console, page or request errors.**
- All **12 Clay/Slate before/after PNG pairs are pixel-identical**: five white presets and orange 3/4 in each studio.
- Geometry buffers POSITION/NORMAL/COLOR_0, root scale, all node matrices, camera presets, 38 model/build files and default build state are unchanged.
- Charcoal glass, tyre and wheel assembly materials, lamps and chrome are unchanged. Swatches, custom/per-part colours, rigid lift, hide/slot state, mode restoration and Base clipping pass.
- Renderer remains **167 draw calls**, **841,958 submitted triangles**. No additional screen or offscreen pass, map, shadow map or geometry. Existing shadow material, contact bake and blur settings remain unchanged; compositing its alpha over the new grey background naturally changes ground RGB.
- The higher AO exponent is gated by existing curvature, and introduces only scalar shader arithmetic. No new textures or screen-space effects.
- WebKit results are emulated software GL, not a physical iPad; hardware performance is unmeasured.

[WebKit validation](webkit.json).
