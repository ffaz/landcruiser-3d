# Foundation session — 27 October 2026

Stored geometry is now delivered as named external parts with a data-only build state. Runtime geometry warps are removed; the physical car root remains at uniform scale **1.0**. [Geometry audit](scale-audit.json), [segmentation proof](segmentation.json), [lossless compression proof](compression.json), [part table and thumbnails](parts-review.md).

| Verification | Measured / authored value |
| --- | ---: |
| World length × height × width including mirrors | 5.170001 × 1.930053 × 2.296633 m |
| Wheelbase | 2.850000 m |
| Authored front / rear hub X | −1.635 / +1.215 m |
| Hub Y | 0.396500 m |
| Tyre vertical diameter, decoded | 0.793040–0.793042 m; nominal 0.793 m |
| Maximum delivery vertex deviation from stored source | 0.0 mm |
| Vehicle source triangles / delivered triangles | 741,521 / 741,521; each assigned once |
| Blender used for loose-component identification | 4.3.2 |

Original quantisation/decode node transforms remain; they are part of the stored encoding, not new physical resizing. The source's lowest vertex is approximately −0.000021 m: this tiny quantisation residual is preserved. `COLOR_0` remains the original linear AO/curvature data. Export copies POSITION/NORMAL/COLOR_0 values; Meshopt compresses the existing codes without requantisation or filters, using format 0 supported by the pinned Three.js decoder.

The pre-session camera presets come from `1169290`: Side 0° elevation at y=0.40 m; Front/Rear 1.432° elevation with their earlier distances. Camera composition reference points are only framing data; they are never applied to model vertices. Minimum camera y=0.15 m replaces the 85° polar limit, retaining cabin and pan guards.

## Parts and gaps

**24 named parts + 10 unsorted pieces**, plus the optional display-base GLB. [Every part's triangles, zones and thumbnail](parts-review.md); [named-part sheet](parts-sheet-01.jpg); [unsorted sheet](unsorted-sheet-01.jpg).

`arch_flares` is empty because the flare surfaces belong to larger connected body panels. `chassis` is empty because connected black underside geometry could not be confidently isolated as frame/axles. No new cuts or guessed geometry are introduced. Unsorted pieces remain visible by default:

- 01–02: connected belt strips spanning rear doors and fixed quarter panels.
- 03–04: connected underside/body and rear underside pieces with unverified mounting roles.
- 05–06: connected clear rear-lamp/running-board geometry and a central front clear piece of unverified identity.
- 07–08: connected black front backing/upper strips extending beyond the grille face.
- 09–10: red roof-level pieces whose rail/spoiler/lamp assignments could not be confirmed.

Wheel assemblies retain rim, tyre and brake zones, with pivots at the authored hubs. Other pivot locations are group-bbox centres, not verified hinges. [`manifest.json`](../../model/manifest.json) declares IDs, slots, pivots, zones and rigid groups; [`build.json`](../../build.json) defaults to no lift and no hidden parts. The console API and URL hash are described in the [project README](../../README.md).

The rear overhang is inherited from earlier preparation: 5.170 − 0.950 − 2.850 = **1.370 m**. Toyota UAE's 2021 sheet distinguishes 5,095 mm EXR and 5,170 mm GXR GT with grade-specific bumper equipment. It does not locate the full 75 mm difference at the rear; **1.295 m is conditional arithmetic, not a verified Toyota overhang**. [Sources and investigation](overhang-notes.md). This session left the geometry unchanged.

**Superseded 28 October 2026:** the rear stretch was undone. The rear overhang is now 1.200 m and the body 5.000 m; see the [rear overhang correction](../rear-overhang/README.md). The tables, [scale audit](scale-audit.json) and captures on this page describe the 5.170 m delivery.

## Delivery and browser validation

Decimal MB means 1,000,000 bytes.

| Delivery bytes | Before | After |
| --- | ---: | ---: |
| `index.html` | 12,922,088 (12.922 MB) | 51,780 (0.052 MB) |
| Compressed model bytes before Base64 | 9,647,754 gzip bytes | 9,884,184 Meshopt GLB bytes (35 files) |
| Embedded Base64 payload | 12,863,676 characters | 0 |
| External model directory including manifest/framing JSON | — | 9,988,729 |
| External build JSON | — | 1,195 |
| Raw split GLBs before Meshopt compression | — | 21,126,180 |

The before Base64 payload is already included in the before HTML size; do not add it again. Binary compression grows slightly compared with the old gzip payload; removing Base64 substantially shrinks HTML. These are file sizes, not a measured HTTP transfer total. [Exact size record](size.json). The Meshopt writer preserves the existing vertex codes instead of adding another lossy quantisation pass.

The software-rendered WebKit test uses 1366×1024, DPR 1, four warm-up frames and 24 measured Auto frames. These are emulated timings, not physical iPad Safari performance.

| WebKit frame interval | Before | After |
| --- | ---: | ---: |
| p50 | 485 ms | 477 ms |
| p95 | 585 ms | 489 ms |
| Mean | 496.21 ms | 471.21 ms |

Both benchmark runs recorded zero browser errors. Renderer CPU p50/p95 changed from 96/105 ms to 94/102 ms. The 24-frame software-rendered samples describe this test host; they do not certify hardware smoothness.

Visual evidence: [Cream presets](final-cream.jpg), [Slate presets](final-slate.jpg), [eight orbit angles](orbit.jpg), [front close-up](front-closeup.jpg) and [Base](base-quarter.jpg). [Browser validation](browser-validation.json) and [benchmark before](performance-before.json)/[after](performance-after.json) accompany the captures.

Validation covers five presets in both studios, eight orbit angles, Base, all existing colour controls, Clean view, Reset and native gesture camera limits. Build checks prove a 50 mm rigid lift, fixed wheels, byte-identical POSITION buffers, per-part paint, hidden parts, empty/restored slots and hash defaults. Hardware iPad smoothness and the ambiguous/missing part identities remain unverified.

Final release checks pass with **zero console errors**. Native gesture/scroll stress recorded **75 safe poses** and reached the y=0.15 m clamp. A 50 mm lift kept all wheels fixed and every POSITION buffer unchanged. [Browser validation](browser-validation.json), [current release validation](../validation.json), [front close-up](front-closeup.jpg).
