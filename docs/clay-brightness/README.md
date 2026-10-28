# Clay white-paint brightness calibration

The white Clay paint albedo was already **#efe6da**. The sampled flat bonnet and upper door both had baked AO **1.000**, so their grey/taupe result was primarily insufficient key-light energy under AgX, rather than a dark swatch or bad normals. The roof had AO about **0.649**, which also attenuated its direct key. The plum hemisphere ground and occlusion tint added an unwanted cast.

Clay now uses a stronger, steeper warm key and higher exposure, warm sand fill/occlusion colours, and indirect-only broad AO on flat painted panels. Crease cavity shading remains active. A lower-panel key-light falloff compensates for the source lower-door surface tilting upward more than the upper door; an infinite directional light otherwise makes that lower surface brighter. The falloff reads existing world positions and subtracts body lift. It changes lighting only, with no vertex/normal/baked-data edit.

The paint swatch, root scale, geometry, pivots, cameras, manifest and build data are unchanged. Ridge remains **0.52** and valley **0.72**. Cream and Slate retain their original materials, lighting and shadows.

White Clay's background is warm stone: **#d9cbb8** in the centre, fading toward **#cdbda7** at the edges. Plum glass has a subtle vertical material gradient. Pale cream **#f4ead6** front lenses reveal the existing projectors and plum housings; their centres are slightly lighter. These Clay-only glass/lens materials remain colour-stable under the stronger paint exposure. The existing blurred contact map gains density only in its near-ground term; its broad falloff and blur kernel are retained.

## Full-size screenshots and pixel samples

The three requested captures are lossless **1440×1000 PNGs**. Pixel reports use the same white build, canonical 3/4 camera and coordinates before/after. Each colour is the median RGB of a **7×7 pixel patch**. Raycasts confirm all 49 pixels on the intended painted part for bonnet, roof and doors; the sill patch has 47 side-step paint pixels and two adjacent door paint pixels. Background is sampled in the visible centre-colour area. Display brightness uses Rec.709-weighted sRGB values; linear luminance is recorded separately in the data.

- [3/4](quarter.png)
- [Side](side.png)
- [Front](front.png)

Source measurement points: bonnet **(472,420)**, roof **(861,206)**, front door **(871,467)**, lower door **(867,559)**, painted sill **(876,615)** and background **(720,140)**. The before capture is retained with the measurement evidence.

| Surface | Before | After |
| --- | --- | --- |
| Bonnet | #b9afa6 | **#f0e7db** |
| Roof | #b8aea5 | **#efe7da** |
| Front door | #a59a91 | **#c8b9a6** |
| Lower door | #a89d94 | **#a19282** |
| Painted sill | #968a82 | **#a2917f** |
| Background | #f7f5f3 | **#d9cbb8** |

Relative to the average of the bonnet/roof samples, the front door is **19.4% darker**, lower door **36.2% darker** and sill **36.5% darker** in displayed sRGB brightness. The front/rear tyre-contact samples average **31.6% darker** than before: front **#826b73 → #503c42**, rear **#a49499 → #84706e**. Those shadow samples are unoccluded ground immediately at the tread edges, not rubber pixels.

- [Annotated sampling map](sampling-map.png)
- [Before 3/4](before-quarter.png)
- [RGB, raycast and brightness data](pixels.json)

## Validation

The [targeted regression](regression-after.json) passes **28 checks** with **zero browser errors**, including paint swatches, custom/per-part colours, studio restoration, unchanged camera presets, attribute buffers and node matrices, root scale 1.0, and a 50 mm rigid body lift with fixed wheels. The Clay height-lighting uniform follows and resets with that lift. The [baseline report](regression-before.json) identifies the source used before the change.

All **six Cream/Slate Front/Side/3/4 comparisons have zero differing pixels**. All **38 model/build files** match the frozen pre-change hashes. [Comparison evidence](comparisons.json).

The production importmap retains its pinned CDN URLs. Tests use a temporary page and locally packed Three.js 0.166.1, including its matching Meshopt decoder. Chromium uses SwiftShader. Screenshots are final-render checks; native frame timing is measured separately below.

`index.html`: **60,135 → 64,685 bytes** (+4,550). Vehicle/base GLBs: **9,884,184 bytes**, unchanged. No additional frame pass, shadow map, texture or model attribute was added; Clay still renders **154 draw calls**.

WebKit software emulation at **1366×1024, DPR 1**, running the actual product renderer and auto-rotation, four warmup frames then 24 measured intervals. Before/after runs were sequential with other browser workloads stopped.

| Frame interval | Before | After |
| --- | ---: | ---: |
| Mean | 408.96 ms | 379.13 ms |
| p50 | 399 ms | 386 ms |
| p95 | 471 ms | 397 ms |
| Draw calls | 154 | 154 |

Both runs report zero errors. These are **emulated WebKit timings, not physical iPad performance**; host/software-renderer variation limits performance conclusions. Hardware smoothness remains unverified. [Before timing data](webkit-before.json), [after timing data](webkit-after.json).

Tested source SHA-256: `a11ab741b5f39304c48c2e0de168ecd200bc6cf2f94366587a3c6ad985469071`.
