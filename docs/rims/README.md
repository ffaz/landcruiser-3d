# LC200 rims — current review

The latest revision fixes tyre fit, adds complete brake/backing assemblies, and follows model-specific wheel references. [Detailed review and evidence](review2/README.md).

[![Current rim faces](images/comparison.png)](images/comparison.png)

Face-styling renders above hide the rubber adapter and brake package for comparison with bare product photographs. Normal fitted renders include every component:

[![Complete wheels with the stored tyre](images/comparison-with-tyres.png)](images/comparison-with-tyres.png)

| Option | Width / offset | Face openings | Complete part triangles |
|---|---|---:|---:|
| KMC KM720 Roswell · matte anthracite | 17×8.5 ET+18 | 8 rounded capsules | 14,894 |
| Method MR705 · titanium | 17×8.5 ET0 | 10 rounded trapezoids | 13,278 |
| Shanaber steel · silver | 17×8 ET+25 | 18 round holes | 13,943 |

All retain the configured 5×150 pattern, centre bores, hub pivots and root scale 1. The metal flange remains 462 mm. Added rubber overlaps the stored tyre's oversized opening; new parts include a 354 mm vented rotor, closed hub/hat, five studs, caliper and opaque backing. Existing stock car GLBs are unchanged.

Choose **Workshop → Rims**. Each design loads lazily, sharing its geometry across four rigid hub copies. The existing fit rules and offsets remain active. Blank caps are retained; the source photographs guide the face styling with the requested LC200 mounting adaptation.

## On-car proof: stock | KM720 | MR705 | Shanaber

Each sheet contains 3× enlarged 320×300 crops from real 1440×1000 source frames. The source frames and crop coordinates are included in the detailed evidence.

| Studio | Front-left | Rear-right |
|---|---|---|
| Cream | [Open comparison](review2/images/comparison-cream-FL.png) | [Open comparison](review2/images/comparison-cream-RR.png) |
| Slate | [Open comparison](review2/images/comparison-slate-FL.png) | [Open comparison](review2/images/comparison-slate-RR.png) |
| Clay | [Open comparison](review2/images/comparison-clay-FL.png) | [Open comparison](review2/images/comparison-clay-RR.png) |

## Individual renders

| View | KM720 | MR705 | Shanaber |
|---|---|---|---|
| Product-style face | [3/4](images/disc-rim-quarter.png) | [3/4](images/window-rim-quarter.png) | [3/4](images/steel-rim-quarter.png) |
| Product-style face | [Front](images/disc-rim-front.png) | [Front](images/window-rim-front.png) | [Front](images/steel-rim-front.png) |
| With stored tyre | [Open](images/disc-wheel-quarter.png) | [Open](images/window-wheel-quarter.png) | [Open](images/steel-wheel-quarter.png) |
| On car | [3/4](images/disc-car-quarter.png) | [3/4](images/window-car-quarter.png) | [3/4](images/steel-car-quarter.png) |
| On car | [Side](images/disc-car-side.png) | [Side](images/window-car-side.png) | [Side](images/steel-car-side.png) |

[Workshop panel](images/workshop-rims.png).

Blender 4.3.2; Cycles vertex AO, 32 samples; signed curvature in COLOR_0 G. New GLBs are Meshopt compressed. No new realtime maps, effects, render passes or shadow maps. The car's stored geometry, NORMAL and COLOR_0 stay untouched. Existing touch controls, presets and studios are preserved.

Validation: **20/20 rims, 45/45 workshop, 31/31 viewer**, zero console errors. All **56 stored car GLBs** are byte-identical. Sampled wheel coverage: **6,282 rays, zero misses**. Physical iPad performance and real vehicle fitment were not tested.

The 20 unselectable tyre GLBs (7,444,320 bytes) and their branch-only source/tool/review payload were removed. Their work remains on `tyres-26570-review`; it is not required for this rim review.

This work is on **rims-review only**. Main and Pages are not changed by it. Reference photos are not committed; the chat report shows those comparisons.
