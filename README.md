# Land Cruiser 200 studio

[Open the viewer](https://ffaz.github.io/landcruiser-3d/). The application stays in `index.html`: embedded model and interior, studio lighting, materials, UI and camera controls. Only pinned Three.js 0.166.1 modules load from the CDN. No model, texture or HDR files are fetched separately.

The studio uses a reflection-only PMREM environment with feathered softboxes, AgX tone mapping, clearcoated paint, tinted reflective glass and a faint interior. Orthographic depth contact shadows and a soft directional shadow plant the tyres on the floor. Cream is the default background; the same button switches to Slate and labels the destination. All five camera presets, automatic rotation, swatches, custom paint and touch controls remain available. A 20° perspective lens fits the car between the header and specs; Side is level at wheel-centre height. Native MSAA and a pixel-ratio cap of 2 preserve edges without postprocessing fringes. Rendering stops while the car is idle.

Tap **Clean view** to hide all UI. A stationary tap on the canvas, H or Escape restores it; drag and pinch still operate the camera while controls are hidden. On touch screens, use one finger to rotate, pinch to zoom and two fingers to pan. Reset restores the Side camera, target and zoom, including after panning.

## Model and references

The vehicle remains adapted from [Land cruise 2016 by ZIRODESIGN](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), selected by the repository owner. The original import preserved source transforms, materials and normals. Cleanup removed logos, lettering, wheel emblems, the tailgate emblem recess and tow hardware, while preserving the integrated exterior trim. This refinement restores the same source's interior, corrects lens normals, refits the existing wheels and shortens/crowns the rear spoiler with its upper supports and brake lens attached. Roof-rail feet and mirror shapes were compared with photos and retained.

This is an adapted 2016 final-facelift mesh representing a 2021 LC200, not Toyota OEM CAD. Grade-specific bumper curves and ancillary widths remain approximate. Model authorship remains with ZIRODESIGN; the extraction tool's license does not license the model.

## Verified specification

The owner confirmed **GXR with 265/70R17 tyres**. Toyota UAE's official [2021 5.7L GXR specification sheet, May 2021](https://dam.alfuttaim.com/dx/api/dam/v1/collections/24e5d2dd-5aa6-4fd2-ad4d-83ba5a1d1be4/items/1d6c9972-e9fd-49a5-aec3-faa9aaa1713c/renditions/2b4bd368-b103-4b18-a18e-d1c1609420d1?binary=true) gives **5,095 × 1,980 × 1,930 mm** and factory **285/60R18**. The viewer uses the verified GXR body dimensions and the owner's confirmed 17-inch wheel/tyre setup; it does not present that setup as the factory UAE fitment. The owner's engine variant was not supplied.

| Datum | Viewer value | Evidence |
| --- | --- | --- |
| Bumper length | 5,095 mm | Toyota UAE 2021 5.7L GXR sheet |
| Body width, excluding mirrors | 1,980 mm | Same sheet; curved trim and ancillary widths approximate |
| Overall height | 1,930 mm | Same sheet |
| Wheel / tyre | 17-inch / 265/70R17 | Owner confirmation; nominal tyre radius 401.4 mm |
| Wheelbase | 2,850 mm | [Toyota 2021 LC200 owner manual, p572](https://assets.sia.toyota.com/publications/en/om-s/OM60T03U/pdf/OM60T03U.pdf) |
| Front / rear track | 1,650 / 1,645 mm | Same manual; US axle evidence, not independently verified GCC figures |
| Nominal clearance | 230 mm | Inherited studio target; not independently verified in the UAE sheet or an exact mesh measurement |

The previous GXR GT dimensions and 20-inch wheels were a different grade. Toyota's [2021 UAE 4.6L sheet](https://nd-mediagallery2-public-production.s3.amazonaws.com/dbfbe079ddec83c595dd0ec9c4c6a5fa/2021_lc_sw_4.6l.pdf) lists GXR GT at 5,170 mm with 285/50R20. Those numbers are not used for this owner's GXR.

The side silhouette was compared with a [real final-facelift LC200 profile](https://commons.wikimedia.org/wiki/File:2018_Toyota_Land_Cruiser_200_Executive_Lounge_white_side.jpg). The spoiler was compared with [Toyota dealer 2021 exterior photos](https://www.rustywallacetoyota.com/2021-toyota-land-cruiser-research-morristown-tn/) and [GCC GXR GT rear-quarter photos](https://qatar.yallamotor.com/new-cars/toyota/land-cruiser/2021/4-6l-gxr-gt). Its 25% depth reduction and shallow crown are photo-guided approximations; accessories differ across grades.

## Visual validation

- [Before/after: all five presets](docs/before-after.jpg)
- [Before/after each refinement step](docs/refinement/README.md)
- Final five presets: [Cream](docs/refinement/final-cream.jpg) · [Slate](docs/refinement/final-slate.jpg)
- [Clean view on iPad-sized WebKit](docs/refinement/clean-view.jpg)
- [Eight rotation angles](docs/rotation.jpg) · [Side-profile comparison](docs/side-reference.jpg)
- [Machine-readable validation](docs/validation.json) · [Repeatable test instructions](tests/README.md)

The Chromium test packs `three@0.166.1`, serves it locally, changes only a temporary test copy's importmap and uses SwiftShader. Production CDN URLs stay unchanged. Each preset is triggered through its real button and allowed at least 2.5 seconds for the camera tween; every saved frame uses the product renderer. Screenshots are reviewed separately for materials, tyre contact, attachments and silhouette. Native MSAA was retained after an FXAA experiment produced worse transparent-edge fringes.

WebKit testing uses native trusted touch events at an iPad viewport and DPR 2: rotation, pinch, two-finger pan, Reset, paint, themes and Clean view. This validates engine behaviour, not physical iPad Safari frame rate; no physical iPad was available. Safari 16.4+ is required for the existing importmap setup.
