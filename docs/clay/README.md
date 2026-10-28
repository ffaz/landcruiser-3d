# Clay studio — initial release

This records commit `833b3b3`. See [the later Clay tuning](../clay-tune/README.md) for the current lighting, white finish and lamp treatment.

The existing studio button now cycles **Cream → Slate → Clay → Cream**, showing the destination mode. Clay changes materials, colours and lighting only. The build file, model files, geometry buffers, original normals, baked COLOR_0, root scale, pivots and camera presets are preserved.

Clay uses matte paint (roughness 0.85, metalness 0, clearcoat 0, environment intensity 0.035), muted plum trim/tyres and glass, soft cream lenses and matte light-grey chrome. A warm high front-left key and gentle hemisphere fill replace the original lighting only while Clay is selected. Baked AO/curvature remains active with softer strengths: AO 0.65, ridge 0.22, valley 0.35. AO and the existing blurred contact map are tinted plum. There are no added lights, render targets or per-frame effects. Studio changes rebake the existing contact map; no additional per-frame passes are introduced.

All four paint swatches and the custom picker work. The background follows the selected paint hue; neutral finishes use a warm porcelain background. Authored build-state material-zone overrides take priority over Clay's default palette. Switching studios keeps selected colours and restores the original Cream/Slate materials and lighting.

## Screenshots

The three requested views use custom orange **#cf855f** to show the matching peach background. The default build remains white; switching to Clay does not change paint selection.

- [Front](front.jpg)
- [Side](side.jpg)
- [3/4](quarter.jpg)
- [Stock white 3/4](stock-white-quarter.jpg)

## Verification

Targeted checks verify byte-identical POSITION/NORMAL/COLOR buffers, unchanged local/world model transforms and root scale 1, unchanged presets, all swatches, custom hue backgrounds, build overrides and exact material/light restoration. Cream and Slate match the pre-change Front, Side and 3/4 screenshot crops exactly: **zero differing pixels** in each 1360×780 car/background region. The crop excludes UI, including the studio button whose destination label necessarily changes.

Screenshots use Chromium/SwiftShader with a locally served npm-packed Three.js 0.166.1 test copy. Static render-target passes remain enabled in the test harness; only redundant screen draws are suppressed. Production CDN URLs remain pinned.

The separate WebKit benchmark uses the actual renderer at 1366×1024, DPR 1, four warm-up frames and 24 measured auto-rotation frame intervals. It is Linux software-rendered iPad emulation, **not physical iPad Safari**. Frame times and draw counts are recorded with the completed release evidence.


| WebKit emulation, 1366×1024 DPR 1 | Cream | Clay |
| --- | ---: | ---: |
| Median frame interval | 478 ms | 399 ms |
| p95 frame interval | 488 ms | 425 ms |
| Mean frame interval | 472.08 ms | 404.29 ms |
| Draw calls per measured frame | 167 | 154 |

Clay's opaque matte lenses remove extra transparent passes; these renderer statistics are **not** a change in model geometry. Both benchmarks report zero errors. Physical iPad performance remains unmeasured.

Evidence: [targeted checks](checks.json), [six exact baseline comparisons](comparisons.json), [Cream timing](performance-cream.json), [Clay timing](performance-clay.json), [three-view sheet](clay-views.jpg).

Final checks pass: **22 Clay checks and 30 core-control checks**, zero errors. Clay Base fits and restores correctly. All **38 model/build files** match their pre-change SHA-256 values. [Core controls](core-controls.json), [current release validation](../validation.json).
