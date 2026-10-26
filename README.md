# Land Cruiser 200 studio

[Open the viewer](https://ffaz.github.io/landcruiser-3d/). The application stays in `index.html`: UI, camera presets, paint controls, materials and an embedded gzip GLB. Only pinned Three.js 0.166.1 modules load from the CDN. No model or texture files are fetched separately.

The vehicle is adapted from [Land cruise 2016 by ZIRODESIGN](https://sketchfab.com/3d-models/land-cruise-2016-6bd227c034894019907f7eaf4fe23ded), selected by the repository owner. The second supplied [Sketchfab Ripper](https://github.com/anotherRandomPersonlol/Sketchfab-Ripper) preserved the source transforms, materials and normals. Cleanup removes logos, lettering, wheel emblems, the tailgate emblem recess and tow hardware; restores outward glass normals; preserves exterior tessellation; mounts the original integrated trim; and fits the bumper/axle envelope. The imported 2016 final-facelift body represents the LC200 shape; individual 2021 GCC bumper and trim curves remain an approximation. Model authorship remains with ZIRODESIGN; the extraction tool's license does not license the model.

## Dimension references

The original page called 5,095 mm the GXR length. Toyota's [2021 UAE 4.6L specification sheet, dated August 2020](https://nd-mediagallery2-public-production.s3.amazonaws.com/dbfbe079ddec83c595dd0ec9c4c6a5fa/2021_lc_sw_4.6l.pdf) assigns that figure to EXR; **GXR GT is 5,170 × 1,980 × 1,930 mm**, with **285/50R20** tyres. The viewer now uses that grade.

| Datum | Metres | Evidence |
| --- | ---: | --- |
| Bumper length | 5.170 | Toyota UAE 2021 GXR GT sheet |
| Nominal body width, excluding mirrors | 1.980 | Same sheet; imported curved trim/ancillary widths approximate |
| Overall height | 1.930 | Same sheet |
| Tyre width / rim diameter | .285 / .508 | Same sheet, 285/50R20; radius .3965 m |
| Wheelbase | 2.850 | [Toyota 2021 LC200 owner manual, p572](https://assets.sia.toyota.com/publications/en/om-s/OM60T03U/pdf/OM60T03U.pdf) |
| Front / rear track | 1.650 / 1.645 | Same manual; US axle evidence, not independently verified GCC figures |
| Clearance target | .230 | Inherited nominal studio target; not stated in the UAE sheet or claimed as an exact mesh measurement |

The source model's maximum rear extent included its tow hitch. Normalisation uses the rear bumper after removing that hardware, with a .950 m front overhang and a 2.850 m axle separation. Wheels use the specified track and tyre dimensions. Body width excludes mirrors; imported running boards and small trim remain approximate.

The silhouette was compared with this [real final-facelift LC200 side profile](https://commons.wikimedia.org/wiki/File:2018_Toyota_Land_Cruiser_200_Executive_Lounge_white_side.jpg). Wheels and grade accessories differ from that reference photo.

## Validation

See [all five before/after views](docs/before-after.jpg), [eight rotation angles](docs/rotation.jpg), the [side-profile comparison](docs/side-reference.jpg), and [the visual test instructions](tests/README.md). The test packs the exact Three.js release and rewrites the importmap only in a temporary test page, then captures all five presets and eight rotating angles using Chromium/SwiftShader. It also checks paint, background, automatic rotation, Reset and browser errors. Production CDN URLs remain unchanged.

WebKit with iPad emulation additionally exercises trusted one-finger rotation and two-finger pinch. Emulation does not substitute for a physical iPad Safari check. Safari 16.4+ is required for the existing importmap setup.
