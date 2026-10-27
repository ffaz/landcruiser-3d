# Land Cruiser 200 collectible studio

[Open the viewer](https://ffaz.github.io/landcruiser-3d/). The app remains a single `index.html`, including the embedded model, interior, fitted garnish and optional display base. Only pinned Three.js **0.166.1** modules load from the CDN; models, shading data and textures are embedded or generated locally.

The finish follows a premium die-cast collectible: satin white paint, neutral tinted glass, readable gunmetal spokes, soft overhead light, dark crevices and thin convex-edge highlights. **Blender 4.3.2 / Cycles** bakes local ambient occlusion into vertex R; signed edge curvature occupies G. Three.js reads the linear data through a small `onBeforeCompile` material patch. `BAKED_LOOK` holds AO/ridge/valley strengths together. There is no screen-space AO or live cavity pass. The existing reflection environment and the single blurred ground contact map are generated once at load. Rendering stops when the scene is idle.

Front, Side, Rear, 3/4 and Top, Auto, Reset, the existing **four paint swatches plus custom picker**, Cream/Slate and Clean view remain. Touch uses one finger to rotate, pinch to zoom and two fingers to pan. Camera distance derives from the loaded car's bounding sphere; target clamping, an expanded-box collision guard and an 85° polar limit block cabin/underside entry. The requested above-ground limit replaces the previous perfectly level Side elevation. Reset clears pan/damping inertia.

**Base** adds an optional two-tone bevelled plinth with its own baked AO/curvature. It is off by default; fitting includes the full base when enabled. **Clean view** hides all UI; a stationary canvas tap, H or Escape restores it while rotation/pinch remain active. The no-JavaScript fallback describes the rendered satin gunmetal finish.

## Model and specification

The retained vehicle is adapted from [Land cruise 2016 by ZIRODESIGN](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), selected by the owner. Original transforms, normals and mesh tessellation are preserved; logos, lettering and wheel emblems were removed. This pass adds fitted arch liners, closes a tailgate opening that exposed the tan interior, and shortens/crowns the spoiler with its attachments moving together. Those shape adjustments are photo-guided artist fits, not OEM CAD. Grade-specific curves remain approximate. Model authorship remains with ZIRODESIGN; an extraction tool's license does not license the model.

The owner previously confirmed **GXR and 265/70R17**. Existing wheel geometry and tyre text remain unchanged; rim material brightness was adjusted as requested. The viewer's satin gunmetal finish is not a newly verified description of the owner's wheel colour/style. The owner's engine variant remains unconfirmed.

Toyota UAE's official [May 2021 5.7L GXR sheet](https://dam.alfuttaim.com/dx/api/dam/v1/collections/24e5d2dd-5aa6-4fd2-ad4d-83ba5a1d1be4/items/1d6c9972-e9fd-49a5-aec3-faa9aaa1713c/renditions/2b4bd368-b103-4b18-a18e-d1c1609420d1?binary=true) explicitly gives **5,095 × 1,980 × 1,930 mm** and factory **285/60R18**. Keep the verified 1,930 mm height and model scale. Toyota Jordan's [regional LC200 catalogue](https://www.toyota.com.jo/sites/default/files/2020-07/Land%20Cruiser%20Catalog_0.pdf) separately lists **1,890 mm +40 mm with roof rails**; it supports a rail allowance for the LC200 family, but is not a 2021 UAE grade certificate. The staging-domain figure does not override the public GCC sheet.

| Datum | Viewer value | Source or limitation |
| --- | --- | --- |
| Length / body width / overall height | 5,095 / 1,980 / 1,930 mm | Official 2021 UAE GXR sheet; width excludes mirrors |
| Wheel / tyre | 17-inch / 265/70R17 | Owner's earlier confirmation; retained |
| Wheelbase | 2,850 mm | [Toyota 2021 LC200 owner manual, p572](https://assets.sia.toyota.com/publications/en/om-s/OM60T03U/pdf/OM60T03U.pdf) |
| Front / rear track | 1,650 / 1,645 mm | Same US manual; not independently verified against a GCC axle sheet |
| Clearance | Unverified | Inherited 230 mm target is not a sourced GCC value or exact mesh measurement; UI now says unverified |

The side silhouette/spoiler were compared with the [real final-facelift profile](https://commons.wikimedia.org/wiki/File:2018_Toyota_Land_Cruiser_200_Executive_Lounge_white_side.jpg), [Toyota dealer 2021 exterior photos](https://www.rustywallacetoyota.com/2021-toyota-land-cruiser-research-morristown-tn/) and [GCC rear-quarter photos](https://qatar.yallamotor.com/new-cars/toyota/land-cruiser/2021/4-6l-gxr-gt). Accessories vary by grade. No reference branding was transferred into the model or base.

## Evidence and repeatable checks

- [Current before/after comparisons and report](docs/toy/README.md): every preset in Cream and Slate, front details, optional base, file sizes and WebKit timing.
- [Current validation JSON](docs/validation.json).
- [Visual/camera tests](tests/README.md), retaining `tests/visual.mjs` and adding a repeatable WebKit benchmark.
- [Offline Blender bake scripts and encoding](tools/bake/README.md).
- [Previous studio iteration evidence](docs/refinement/README.md), retained as history.

The visual harness npm-packs the exact Three.js release, rewrites only a temporary page's importmap, and runs Chromium with SwiftShader. Screenshots wait at least 2.5 seconds after actual preset clicks. Test-only frame suppression speeds final-image captures; the benchmark uses the untouched product renderer and measures actual auto-rotation frame intervals. Production CDN URLs remain unchanged.

WebKit uses trusted touch input and a 1366×1024 software-rendered iPad viewport. Timing is **emulated WebKit, not physical iPad Safari**; hardware smoothness cannot be certified here. Safari 16.4+ is required for the existing importmap setup.
