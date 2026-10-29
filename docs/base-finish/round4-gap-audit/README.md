# Round 4 — stopped at the rear-opening geometry gate

**No finish changes were applied.** Item 4's instruction was: “If it needs geometry, do NOT edit. Report the triangles and the parts they belong to, and stop.” The rear wedges expose the cabin through an actual exterior opening, so that condition applies. Items 1–3 are deferred, not reported as completed. GXR, chrome emblems, the clear reverse strip, clean paint and all round-3 gains are retained.

This is a diagnostic report on `base-finish-reference-review`, against `2a325c3`. **Every production byte is unchanged**: index.html, build.json, the manifest, all 49 existing GLBs and other model data ([SHA-256 audit](unchanged-assets.json)). Only report files are added. No owner photographs are needed; the reference remains the original ZIRODESIGN source and its native materials.

## Images

[**Original source, native lighting | 2a325c3 | round-4 inspection, unchanged**](gap-comparison.png). The complete source-native image is the same original-source capture used in round 3; its lighting and camera differ from the app. Both app panels are fresh 1440 × 1000 captures at the same close camera, with zero differing pixels on the left. This is an unchanged diagnostic comparison, not an after-polish result.

- [Annotated left gap: A/B exposed cabin, C lamp chrome, D garnish](annotated-left-gap.png)
- Left: [2a325c3](round3-gap-L.png) | [current unchanged](current-gap-L.png)
- Right: [2a325c3](round3-gap-R.png) | [current unchanged](current-gap-R.png)
- Fresh full-size Cream: [Front](unchanged-cream-front.png), [Rear](unchanged-cream-rear.png), [3/4](unchanged-cream-quarter.png)
- Clay: [2a325c3](round3-clay-quarter.png) | [current](current-clay-quarter.png), **0 differing pixels**

The right diagnostic capture has 484 differing pixels, maximum channel difference 78, despite identical production files; the cause was not established. It is recorded in [image-comparisons.json](image-comparisons.json), not treated as an implemented change or as evidence of a repaired opening. Clay and the principal left comparison are exactly equal.

## What shows through

At left-gap pixel **(720,343)** the first hit is `model/base.glb`, `body_shell`, mesh **`Original_seats_and_cabin`**, material zone **`interior`**. Material colour **#776753**, roughness **0.88**, metalness **0**, opacity **1**. The 7 × 7 rendered median is **#6d5f51**, L*41.26, a*3.20, b*10.09.

That hit is at **(0.838056, 0.929154, −0.146315) m**. Nearby lamp chrome is at x **2.283157 m**, so the visible brown surface is approximately **1.445 m farther forward in x** than the lamp housing. It is cabin geometry seen through the exterior, not a brown exterior material that can be reassigned to chrome.

Enabling `DoubleSide` on **every active car material**, including paint and chrome, leaves the principal gap rays hitting the same cabin faces ([left](gap-triangles-L.json), [right](gap-triangles-R.json)). The missing exterior is therefore not just back-face culling. This diagnostic mutation was made only in a temporary test page, then discarded by reloading; production files were never edited.

Changing the seat colour would recolour the view through the hole, while leaving its opening and faceted slivers. Closing it properly requires an exterior backing/bridge or a change to the lamp/garnish boundary. Those are geometry operations prohibited by this round's stop rule. No such fix, vertex move, shader displacement or replacement geometry was made.

## Triangles and parts

Numbers below are **zero-based Three.js `faceIndex` values in the named decoded mesh**. Each JSON record also includes the actual three POSITION indices, ray pixel and world hit, so the identification is independent of a vague global triangle count. The opening itself has **no exterior triangle to report**; these are the revealed cabin triangles and its bordering exterior triangles.

| Region | GLB / part | Mesh / zone | Face indices |
|---|---|---|---|
| Cabin visible through left opening | `model/base.glb` / `body_shell` | `Original_seats_and_cabin` / interior | **8831, 8880, 8879, 8832, 7725** |
| Cabin visible through right opening | `model/base.glb` / `body_shell` | `Original_seats_and_cabin` / interior | **9009, 9003, 8879, 8880, 9008, 6501, 6502** |
| Left upper/lower opening border | `model/parts/lamp_rear_L_finish3.glb` / `lamp_rear_L_finish3` | `chrome_4` / chrome | Examples **60, 59, 42, 15, 260** |
| Right lower border | `model/parts/lamp_rear_R_finish3.glb` / `lamp_rear_R_finish3` | `chrome_4` / chrome | Example **191** |
| Tailgate garnish border | `model/parts/tailgate.glb` / `tailgate` | `Garnish` / chrome | Example **1312** (and the complete scanned list in JSON) |
| Small clear component at left junction | `model/parts/unsorted_05.glb` / `unsorted_05` | `clearglass_27` / lamp_clear | **1696** |

Specific index triples:

| Face | POSITION indices |
|---|---|
| Cabin 8831 | **9656, 9654, 9658** |
| Cabin 8880 | **9710, 9707, 9709** |
| Cabin 9009 | **9825, 9827, 9828** |
| Cabin 9003 | **9819, 9820, 9816** |
| Left lamp chrome 60 | **84, 83, 86** |
| Left lamp chrome 59 | **82, 83, 84** |
| Left lamp chrome 42 | **62, 61, 28** |
| Tailgate garnish 1312 | **684, 685, 686** |

The complete ROI scan records **99 distinct visible triangles on the left** and **107 on the right**, including adjacent paint; these are sample coverage counts, not a count of missing triangles. The primary holes are independently tested with all materials double-sided. The left camera is position **[3.3,1.09,1.15]**, target **[2.293,.961,.620]**, FOV **20°**, near **.01 m**, with view offset cleared. The right camera mirrors z.

## Measurements and unchanged checks

[**pixels.json**](pixels.json) records the gap samples and the verified round-3 baseline values for items 1–2. There are **no new improved round-4 finish numbers**. In particular:

- Front-close grille median/p95 remain **66.97 / 80.89 L***, below the new target. Front-preset emblem median remains **84.15 L***.
- Existing rear-red material emissive intensity remains **.32**; the new unlit target is **not implemented**. Existing dot/bar contrast is still **14.65–23.24 L***. No `lamps_on` state was added.
- The G, X and R are untouched. No new stem-width/relief/bevel or R-baseline compliance measurement is claimed after the geometry stop. The prior authored G nominal stroke remains recorded as provenance, not as evidence of matching X/R.
- [Changed values](changed-values.json): **empty production-change list**. No material, shader, geometry, scale, NORMAL, COLOR_0, pivot, build-state or camera value changed.
- [Fresh visual checks](visual-checks.json): **31/31 pass**, zero console errors, overhangLock passes. Source SHA-256 remains `be6695c3cd18b927b427cfe1c174bc0dc8c7899365fa615777c4b510dda782ff`.
- [Clay comparison](image-comparisons.json): **0 differing pixels**, including lamps, since item 2 was not applied.
- Main remains **`f553e19acf9e0227c0df1656ef4ce4169d3a46b8`**; no main push or Pages deployment was performed.

No front-chrome, LED or G-weight side-by-side “after” is supplied: no such finish was implemented after the explicit geometry stop. This report provides the requested diagnosis and exact affected triangle identities instead of presenting an unchanged render as a fix.
