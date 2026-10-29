# Land Cruiser 200 parts foundation

[Open the viewer](https://ffaz.github.io/landcruiser-3d/). The app remains one `index.html` using pinned **Three.js 0.166.1** modules; the vehicle now loads from external, losslessly Meshopt-compressed GLBs in [`model/`](model/), described by [`manifest.json`](model/manifest.json). [`build.json`](build.json) holds selected slots, material-zone colours, lift and hidden parts. There is no workshop UI yet.

The physical car root uses uniform **scale 1.0**. Source vertex positions, normals, baked `COLOR_0` AO/curvature and encoded node transforms are retained, except for one approved offline correction: the rear overhang was un-stretched to **1.200 m** on 28 October 2026, giving a **5.000 m** model body ([record](docs/rear-overhang/README.md)). Runtime length, height, tyre and spoiler reshaping has been removed. Blender **4.3.2** identifies loose pieces; export selects original triangles and copies original attribute values. The lossless Meshopt roundtrip is verified with the decoder shipped in Three.js 0.166.1.

Front, Side, Rear, 3/4, Top, Auto, Reset, the existing **four paint swatches plus custom picker**, Cream/Slate/Clay, Clean view, Base and touch controls remain. Presets restore the distances and directions from commit `1169290`: Side is level at y=0.40 m. A camera y≥0.15 m rule replaces the old 85° limit; sphere-distance, cabin-collision and pan-target guards remain. One finger rotates; pinch zooms; two fingers pan. Clean view restores with a stationary canvas tap, H or Escape.

The satin collectible materials and baked crevice/edge shading remain. No screen-space AO or live cavity pass is added. The blurred contact map updates when build state changes; rendering stops when controls are idle.

## Clean base finish preview

[Round 3: source/round-2/round-3 lamps, GXR/VXR comparison, chrome measurements and asset audit](docs/base-finish/round3/README.md). The reference is the original 979,826-triangle ZIRODESIGN model with its native materials (zero textures). The new GXR grade is the default; source X/R/punctuation, LAND CRUISER and V8 remain unchanged. VXR remains an optional part. Clay and clean bonnet shading are preserved; no owner photographs are needed.

Cream and Slate use the satin painted-metal base finish, soft reflection highlights, neutral dark trim, blue-grey tinted glass and satin exterior metal. Clay retains its separate warm matte paint, unlit plum glass, pink-grey trim, lighting, wheel/tyre and plinth presentation. No tyre geometry, mud, wear, decals, numbers, props or workshop UI is added.

Toyota emblems are separate default-visible body slots. Replacement rear-lamp variants preserve the original lamp positions, triangle topology and COLOR_0, with repaired lens/reflector normals only on the new copies. Original GLBs remain byte-identical and selectable. The existing body scale, pivots, controls and camera presets are preserved.

[Earlier Cream detail](docs/cream-detail/README.md), [contact refinement](docs/cream-edges/README.md) and [Clay calibration](docs/clay-brightness/README.md) remain historical evidence.

## Foundation data

The original vehicle contains **24 named parts and 10 unsorted pieces**, now supplemented by the source badge/lettering slots, a separate GXR/VXR grade slot and selectable rear-lamp finish variants, each with material-zone metadata and a review thumbnail. Integrated flare surfaces cannot be detached by loose-piece separation; a standalone frame/axle assembly could not be identified confidently. `arch_flares` and `chassis` therefore remain empty manifest slots. Other pivots are part-bbox centres, **not verified door hinges or mounting points**; wheel pivots use the authored hub coordinates.

Use the browser console or a URL hash to exercise the data foundation:

```js
await lcBuild.setState({ lift_mm: 50 }); // rigid body/parts lift; wheels stay fixed
await lcBuild.setState({ paint: { 'door_FL:paint': '#cc3333' } });
await lcBuild.setState({ hidden: ['roof_rails'] });
await lcBuild.setState({ slots: { spoiler: null } });
const state = lcBuild.getState();
```

Open [the 50 mm lift override](https://ffaz.github.io/landcruiser-3d/#lift_mm=50); clearing the hash restores `build.json`. `#build=` accepts URL-encoded JSON. `paint` accepts a global zone (`paint`) or `partId:zone`; a `null` value removes a colour override. `lcBuild.getManifest()` exposes slot/pivot/zone metadata. State changes use rigid group transforms and material properties, never vertex edits.

## Scale, provenance and evidence

[Foundation report](docs/foundation/README.md) records measured dimensions, byte counts, emulated WebKit timing and validation. [Part table and thumbnails](docs/foundation/parts-review.md) list every part and triangle count. [Overhang/source investigation](docs/foundation/overhang-notes.md) explains the inherited 1.370 m rear overhang: the original 5,170 mm (GXR GT) anchor fit stretched the body about 15% behind the rear axle. It was undone with the owner's approval: rear overhang 1.200 m, model body 5,000 mm, front overhang/wheelbase/wheels unchanged. [Correction record, baselines and photo overlay](docs/rear-overhang/README.md).

The retained vehicle is adapted from [Land cruise 2016 by ZIRODESIGN](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), selected by the owner; model authorship remains with ZIRODESIGN. An extraction tool's licence does not license the model. The stored asset is an earlier artist adaptation, not OEM CAD. Toyota emblems and original lettering are separate recovered parts at the owner’s request; only the G in the default GXR grade is newly modelled. The original VXR alternative remains selectable.

The owner's car is a GCC **GXR** (Toyota UAE May 2021 5.7L GXR sheet: 5,095 × 1,980 × 1,930 mm). The spec panel reads "Toyota GXR 5,095 mm · model body 5,000 mm". It shows the owner-confirmed **265/70R17** tyres as text only: the stored wheel geometry is still Ø 793 mm until the tyre-swap work.

See [tests](tests/README.md), [parts pipeline](tools/foundation/README.md) and [original bake pipeline](tools/bake/README.md). Tests use an npm-packed local Three.js copy only in temporary pages, including its matching Meshopt decoder. Production CDN URLs stay pinned. WebKit results use a software-rendered 1366×1024 iPad viewport, **not physical iPad Safari**; hardware smoothness is unverified. [Earlier collectible iteration](docs/toy/README.md) remains as history.
