# Cream contact band and silhouette follow-up

Base gains **9.0 direct diffuse / 2.5 indirect diffuse**, key direction/tint, satin material properties and baked settings are unchanged. Cream reuses the existing large floor quad and the existing baked contact texture; the old small contact quad is hidden in Cream. Tight tyre contacts sample the same map; a low-opacity neutral analytic band fills the shallow Side view in the same ground render. No geometry buffer, transform, camera, texture allocation, shadow map or bake/frame pass was added. Clay and Slate keep their original quad/material.

The broad band fades out with increasing camera height angle. Grazing diffuse attenuation is restricted to low views, leaving specular/clearcoat active and the main 3/4 paint samples unchanged. Base clipping is shared by both ground materials.

## Full-size PNGs

| View | Before e1b81ea | After |
| --- | --- | --- |
| front | [PNG](before/front.png) | [PNG](after/front.png) |
| side | [PNG](before/side.png) | [PNG](after/side.png) |
| quarter | [PNG](before/quarter.png) | [PNG](after/quarter.png) |
| rear | [PNG](before/rear.png) | [PNG](after/rear.png) |

## Measurements

Shadow width at x=700 uses seven horizontal pixels per row and a 2% displayed-brightness reduction against a matching shadow-hidden reference. Same method before/after: **15 px → 36 px**, rows **698–712 → 691–726**. This measures the band itself rather than sampling outside it.

All colours below are per-channel **7×7 medians**. Boundary patches include adjacent background and curved paint; interior patches are ray-validated material zones. Co-ordinates and all other unchanged paint/glass/rubber/wheel/background samples are in [pixels.json](pixels.json).

| Sample | Before | After |
| --- | --- | --- |
| Side bonnetBoundary at [329, 429] | #f3f0ed | #f0eeea |
| Side roofBoundary at [710, 287] | #e6e5e2 | #e1dfdd |
| Side spoilerBoundary at [1244, 283] | #ece8e2 | #e7e4dc |
| Side wingBoundary at [272, 435] | #f3f1ed | #f2efec |
| side rearQuarter | #e2e0dd | #e2e0dd |
| side sill | #bebebc | #bebebc |
| side frontWing | #e9e7e3 | #e9e7e3 |
| side spoilerTip | #eeece8 | #edebe7 |
| side groundFrontLeft | #ece6dd | #dcd8d0 |
| side groundRearLeft | #ede7df | #ddd8d1 |
| front frontBonnet | #f3f1ed | #f3f1ed |
| front frontBonnetEdge | #f1efea | #f1efea |
| front frontBumper | #e0dcd5 | #e0dcd5 |
| rear tailgate | #a9a8a6 | #a9a8a6 |
| rear tailgateLower | #a09f9d | #a09f9d |
| rear rearBumper | #a09f9d | #a09f9d |

## Gain and direction explanation

The **9.0 gain does not scale specular**. It multiplies only `reflectedLight.directDiffuse`; 2.5 multiplies only `indirectDiffuse`. Direct/indirect specular and clearcoat terms retain their original strengths. The paint-specific direction override occurs before the BRDF, so it changes the direction of direct specular highlights too. The new grazing attenuation also affects diffuse only.

Model axes: **−X front, +Y up, +Z left**, confirmed by wheel_FL at positive Z. `[-3.8,10,0.1]` points toward the key, normalises to `[-0.355202,0.934743,0.009347]`, is **69.19° above horizontal** and only **1.51° left of straight front**. It is predominantly above/front with a slight left component. The direction is unchanged in this follow-up.

## New material controls

Grazing multiplier minimum **0.20**, N·V transition **0.03–0.30**, low-view fade **0.04–0.14**; original 9.0/2.5 gains retained. Spoiler paint alone uses a grazing minimum **0.02** and transition **0.03–0.85** to keep its thin tip separate. Ground band opacity **0.20**, neutral tint **#222426**, Gaussian footprint denominators **3.0 / 2.5**, coverage factors **1.12 / 3.2**, ground low-angle fade **0.04–0.12**. All settings apply only in Cream; the floor and car geometry/scale remain unchanged.

Final source SHA-256: `db753a45b4966e17837a745a034083dcf133f3a1ab6928e4d21ba4682fac55d3`.

## Validation

[32 checks pass](checks.json), zero browser errors. All **12 Clay/Slate comparisons are pixel-identical**, plus identical first-load/returned Cream. Gains/direction/tint, model buffers, root scale, transforms, camera presets, paint material properties, other material zones and all 38 model/build files are preserved. Base clipping/restoration and rigid lift pass. Draw calls remain **167**, with the same contact texture dimensions and existing bake passes.

[WebKit actual-renderer check](webkit.json) passes with zero errors at 1366×1024 DPR1. This is software emulation, not physical iPad testing.
