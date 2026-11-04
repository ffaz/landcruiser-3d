# Full-car pass — NOT ACCEPTED / NOT PUSHED

Started from `67bcf67` on `full-car-pass`. Main and Pages have not been changed.

Current changes are candidates, not an acceptance claim. `acceptance.json` explicitly retains pending criteria.

## Verified so far

- The old badge-removal predicate deleted original chrome mesh 4 components 46 and 73. Restored 664 source triangles per lamp into the currently selected `lamp_rear_[LR]_finish4b` assets. No procedural bridge was added.
- `assets.json`: all prior POSITION, NORMAL and COLOR_0 arrays in those two files are identical. Every other stored car GLB is byte-identical. Aftermarket rims are separately changed.
- Candidate 1 front-quarter display-luma ratios: front glass 0.405, rear-door glass 0.176, quarter glass 0.172. Tailgate is not visible there and is not counted as a pass.
- Native rim checks: 23/23 passed (`/workspace/full-car-pass/rims23.log`).
- Initial viewer: 26/27, no console errors, overhangLock passes. The failing material-constants assertion still expected the old finish; expectations were updated to the new requested material constants, but the rerun remains outstanding.
- Workshop smoke was running; do not claim its total until its final log is checked.

## Current candidate changes

- Paint .30 roughness/.65 clearcoat/.18 coat roughness, env 1.2.
- General chrome .18 roughness/1 metalness/env 3; accepted door strips and handle hardware retain their explicit overrides.
- Regional privacy-glass shader; front tint preserved; sunroof reflection further reduced after candidate 1 failed its brightness test.
- Less opaque front/rear clear lenses, saturated red LED cap material, amber indicator material.
- Rubber base raised to #303234, and rubber-only baked AO strength reduced after candidate 1 was too dark.
- KMC nine slots, smaller 110 mm cap, stepped face and recessed lug ring; Method recessed hub, adjusted windows, tone-on-tone lettering; steel metal hub. All use five nuts and existing fit dimensions. Rim .blend sources regenerated.

## Unfinished / important caveats

- Most S1/S2 acceptance criteria remain unmeasured or unfixed. No overall likeness estimate is claimed.
- Native Sketchfab captures exist outside the repo, but direct iframe screenshots are grainy and some close-up camera poses appear clamped/stale (roof capture shows a side angle). Do NOT use these as proof of matched-angle source comparisons. Fix native camera capture, record getCameraLookAt results and wait for convergence.
- The source SDK log was overwritten by a killed earlier process. Re-capture/rebuild provenance; do not rely on its current capture.json.
- Google Images downloads returned an enable-JavaScript page. No usable OEM tail-lamp/Shanaber image obtained yet. Existing KMC/Method/TN01 references are outside git.
- Pixel/reference scripts are preliminary. KMC white-hole segmentation filters small specular components and counts nine. Method proportions require final alignment/normalization before claiming the 10% gate.
- Capture timeouts occurred while several software-renderer tests ran together. Run browser tasks sequentially. Candidate2 capture is in progress; inspect its log.
- No new production render pass, no rebake of any stored car COLOR_0, no source body geometry edits beyond the recovered R1 components.

## Workspace and commands

Repo `/workspace/lc-full-car-pass`; deps `/workspace/lc-visual`; work `/workspace/full-car-pass`.
Baseline snapshot `/workspace/full-car-pass/before` is from branch tip. All downloaded references stay in `/workspace/full-car-pass/refs`, never commit them.

Tools in `tools/full-car-pass`: poses, test-only server, capture driver, native-source capture, reference and pixel measurement, acceptance progress, asset audit, source strip extraction/registration. Do not rerun strip registration on the already amended GLBs (would duplicate restored strips).

Current test/capture logs: `/workspace/full-car-pass/{candidate2,workshop,rims23,viewer}.log`.
Capture outputs `/workspace/full-car-pass/work/{before,candidate1,candidate2}`.
`model/source/rim-*.blend` and twelve rim GLBs have been regenerated; widths/offsets/5x150 catalogue fit unchanged.

Required next: finish baseline captures, fix native source angles, tune/measure all remaining car and rim gates, render final complete desktop/phone matrices sequentially, benchmark same poses without concurrent GPU jobs, rerun all three test suites, regenerate asset/size reports and changed values, commit only when reviewable, push only full-car-pass.
