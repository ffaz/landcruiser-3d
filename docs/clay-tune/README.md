# Clay lighting and form tuning

Clay alone now has a stronger high front-left key and less fill, making the roof/bonnet brighter than side, rear-facing and lower surfaces. The existing contact map is darker warm plum (#604450, opacity 0.94), retaining its soft fade from the tyres and underside. Cream and Slate keep their original materials, lighting, exposure, backgrounds and contact-shadow settings.

Clay's matte paint remains at roughness 0.85 with no clearcoat. White/near-white neutral paint displays as warm cream **#efe6da**, while the authored paint value and build file remain unchanged. Other selected hues are retained. The background derives from this display colour, with a lighter, slightly desaturated gradient of the same hue; neutral greys use a warm fallback.

Baked AO stays at 0.65. Ridge highlight rises from 0.22 to **0.52**, and valley darkening from 0.35 to **0.72**. No baked attribute data is changed. Tail lamps use dusty red **#a16f73**. Front lenses remain opaque matte warm cream, with a subtle 12% linear diffuse lift at the centre. That material gradient reads the existing position/bounds in a per-mesh cached shader; it adds no geometry, attributes, texture or render pass, and remains attached during rigid body lift.

Geometry, normals, COLOR_0, root scale, pivots, wheel assemblies, cameras, manifest and build data are unchanged. No SSAO, bloom or other screen-space effects are added.

## Requested screenshots

Orange uses custom **#cf855f**. White uses the unchanged default build selection **#f4f4ef**, displayed as warm cream in Clay.

| Paint | Front | Side | 3/4 |
| --- | --- | --- | --- |
| Orange | [View](orange-front.jpg) | [View](orange-side.jpg) | [View](orange-quarter.jpg) |
| White | [View](white-front.jpg) | [View](white-side.jpg) | [View](white-quarter.jpg) |

[Six-view sheet](clay-views.jpg).

## Validation

The repeatable harness uses local npm-packed Three.js 0.166.1 in a temporary test page. Screenshot tests suppress redundant screen draws but allow the existing static depth/blur passes. The separate WebKit benchmark measures the actual renderer without suppression. It uses 1366×1024, DPR 1, four warm-up frames and 24 auto-rotation samples with other browser work stopped. These are software-rendered Linux WebKit/iPad emulation measurements, **not physical iPad Safari performance**.


All **26 targeted checks pass**, with zero errors. Six complete Cream/Slate screenshots (Front, Side and 3/4 in each) are pixel-identical to the pre-tuning release. Runtime POSITION/NORMAL/COLOR buffers and local/world transforms remain unchanged, and all **38 model/build files** match their pre-change SHA-256 values. Tests also verify warm white without an authored colour change, custom pastel-blue preservation, studio restoration and per-part colour overrides.

| WebKit emulation, Clay before → after | Before | After |
| --- | ---: | ---: |
| Median frame interval | 397 ms | 399 ms |
| p95 frame interval | 407 ms | 424 ms |
| Mean frame interval | 397.21 ms | 399.42 ms |
| Median render CPU time | 90 ms | 89 ms |
| Draw calls | 154 | 154 |

The measured median differs by 2 ms (about 0.5%) in this software run; there is no additional render pass. These samples do not establish physical iPad timing.

Evidence: [checks](checks.json), [exact screenshot comparisons](comparisons.json), [before timing](performance-before.json), [after timing](performance-after.json), [current release validation](../validation.json).
