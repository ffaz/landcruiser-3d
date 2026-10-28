# Land Cruiser 200 parts foundation

[Open the viewer](https://ffaz.github.io/landcruiser-3d/). The app remains one `index.html` using pinned **Three.js 0.166.1** modules; the vehicle now loads from external, losslessly Meshopt-compressed GLBs in [`model/`](model/), described by [`manifest.json`](model/manifest.json). [`build.json`](build.json) holds selected slots, material-zone colours, lift and hidden parts. There is no workshop UI yet.

The physical car root uses uniform **scale 1.0**. Source vertex positions, normals, baked `COLOR_0` AO/curvature and encoded node transforms are retained, except for one approved offline correction: the rear overhang was un-stretched to **1.200 m** on 28 October 2026, giving a **5.000 m** model body ([record](docs/rear-overhang/README.md)). Runtime length, height, tyre and spoiler reshaping has been removed. Blender **4.3.2** identifies loose pieces; export selects original triangles and copies original attribute values. The lossless Meshopt roundtrip is verified with the decoder shipped in Three.js 0.166.1.

Front, Side, Rear, 3/4, Top, Auto, Reset, the existing **four paint swatches plus custom picker**, Cream/Slate/Clay, Clean view, Base and touch controls remain. Presets restore the distances and directions from commit `1169290`: Side is level at y=0.40 m. A camera y≥0.15 m rule replaces the old 85° limit; sphere-distance, cabin-collision and pan-target guards remain. One finger rotates; pinch zooms; two fingers pan. Clean view restores with a stationary canvas tap, H or Escape.

The satin collectible materials and baked crevice/edge shading remain. No screen-space AO or live cavity pass is added. The blurred contact map updates when build state changes; rendering stops when controls are idle.

## Cream studio

[Latest Cream detail refinement: full-size before/after screenshots, 7×7 samples and every changed value](docs/cream-detail/README.md). [Open the comparison gallery](https://ffaz.github.io/landcruiser-3d/docs/cream-detail/).

Cream is the main studio for the stock base and future workshop. Its pale neutral grey background, satin white paint and near-black trim use a separate material variant. Stronger reads of the unchanged baked AO/curvature bring out recesses and panel seams; rear-facing indirect fill lifts the tailgate and painted bumper into the white range. Glass, tyres, wheel assemblies, chrome, existing contact shadow, geometry, cameras and build data retain their settings. Clay and Slate remain pixel-identical to the preceding release.

[Previous contact-band and silhouette refinement](docs/cream-edges/README.md) and [earlier lighting refinement](docs/cream-refinement/README.md) remain as history.

## Clay studio

The studio button cycles **Cream → Slate → Clay → Cream** and shows the current studio, e.g. "Studio: Cream ▸". Clay uses matte paint (roughness 0.85, no clearcoat), muted plum trim and gradient glass, pale cream headlamps revealing their existing plum housings and projectors, dusty red tail lamps and matte light-grey chrome. A stronger high front-left key, gentle warm sand fill and deeper contact shadow separate top surfaces from sides and lower faces. White paint displays as warm cream without changing its authored build colour. Its background follows the selected paint hue; white uses a darker warm stone background. All four swatches and the custom picker work. Explicit build-state zone colours remain valid.

Clay retains the original geometry, pivots, wheel assemblies, normals and baked COLOR_0 data. It uses a softer AO/curvature material variant, with no additional per-frame pass or real-time effect. Slate retains its original materials and lighting; Cream has the separate paint-lighting refinement described above. [Latest pixel-calibrated screenshots and verification](docs/clay-brightness/README.md).

## Foundation data

The vehicle contains **24 named parts and 10 unsorted pieces**, each with material-zone metadata and a review thumbnail. Integrated flare surfaces cannot be detached by loose-piece separation; a standalone frame/axle assembly could not be identified confidently. `arch_flares` and `chassis` therefore remain empty manifest slots. Other pivots are part-bbox centres, **not verified door hinges or mounting points**; wheel pivots use the authored hub coordinates.

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

The retained vehicle is adapted from [Land cruise 2016 by ZIRODESIGN](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), selected by the owner; model authorship remains with ZIRODESIGN. An extraction tool's licence does not license the model. The stored asset is an earlier artist adaptation, not OEM CAD. No reference logos or wording are added.

The owner's car is a GCC **GXR** (Toyota UAE May 2021 5.7L GXR sheet: 5,095 × 1,980 × 1,930 mm). The spec panel reads "Toyota GXR 5,095 mm · model body 5,000 mm". It shows the owner-confirmed **265/70R17** tyres as text only: the stored wheel geometry is still Ø 793 mm until the tyre-swap work.

See [tests](tests/README.md), [parts pipeline](tools/foundation/README.md) and [original bake pipeline](tools/bake/README.md). Tests use an npm-packed local Three.js copy only in temporary pages, including its matching Meshopt decoder. Production CDN URLs stay pinned. WebKit results use a software-rendered 1366×1024 iPad viewport, **not physical iPad Safari**; hardware smoothness is unverified. [Earlier collectible iteration](docs/toy/README.md) remains as history.
