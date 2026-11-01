# LC200 car polish

Work branch **car-polish**, from current Main **acd7c4e**. The requested visual reference is **4dc22e5**. Main already contained a newer workshop commit; it is preserved. Main/Pages are not deployed by this work.

The spoiler is removed from the default build, as requested during this pass. Its slot is empty; the stored GLB remains available in the workshop. The spoiler brake-light treatment is superseded by that removal.

## Images

Full-size 1440×1000 Cream after: [Front](after/cream-front.png), [Side](after/cream-side.png), [Rear](after/cream-rear.png), [3/4](after/cream-quarter.png), [Top](after/cream-top.png). [Clay 3/4](after/clay-quarter.png). Both Cream and Slate have all five before/after presets in the image folders. Matched comparison captures reuse the baseline camera position/target; Main's workshop/layout and the absent spoiler can affect the view offset/framing. These are not physical-device captures.

Before → after crops, at the requested screen regions (plate and spoiler crops include a little extra margin):

- [1 — blank plate and frame](crops/01-plate.png).
- 2 — [lower doors](crops/02-lower-doors.png), [rear panel](crops/02-rear-panel.png), [parking sensor streaks](crops/02-sensor-streaks.png).
- 3 — [front door gap](crops/03-front-gap.png), [middle gap](crops/03-middle-gap.png), [arch edge](crops/03-arch.png).
- 4 — [upper cap](crops/04-rail-cap-upper.png), [lower cap](crops/04-rail-cap-lower.png), [red hairline](crops/04-red-hairline.png).
- [5 — rear lettering](crops/05-lettering.png).
- 6 — [spoiler removed](crops/06-spoiler-removed.png), [roof ribs retained](crops/06-roof-ribs-kept.png).

[Eight final orbit views](orbits) · [Orbit overview](orbit-overview.png) · [45° red hairline crop](crops/04-orbit-045.png).

## Implementation and measurement

The plate is bumper_front / paint / carpaint_7, not an independent part. A body-coordinate finish mask replaces outgoing light on the plate face and draws a narrow dark edge, excluding the baked cross-shaped shading. It uses the existing renderer and mesh; there is no new pass or geometry.

The clean-panel treatment previously used on bonnet/body_shell now applies to all painted zones in Cream and Slate. Raw AO and the valley term are gated by existing curvature, using the existing smoothstep(.18,.40) crease selection. The authored AO/curvature buffers, seam multipliers, satin paint properties and light gains are unchanged. Clay retains its separate shader and finish settings.

[**pixels.json**](pixels.json) gives the paint-only 5th–95th L* spread for rectangle (480,520)–(980,600), complete gap profiles, 7×7 samples and screenshot hashes. The masked L* spread is **26.55 → 14.88**, a **43.94% reduction**. The ten gap profiles have median contrast **47.72 L***, minimum **25.82 L*** and median half-depth width **2px** (previously median 1px). The masks exclude chrome, black trim, rubber and ground; they are test-only renders. Thin gaps use one-pixel scanlines because a 7×7 median would erase the requested 2–3px feature.

Side-gap shading is a soft body-coordinate band with derivative-filtered boundaries. It does not replace or reshape the underlying mesh boundary. Existing mesh-edge facets remain visible at some locations: the measured scanline widths and contrast variation are reported in full rather than claiming every edge is uniformly 2–3px. Static orbit inspection and derivative filtering do not establish zero shimmer on a physical iPad; that remains unverified.

The two red rail caps are **unsorted_09 / unsorted_10**, source **redglass_25 / redglass**. Their material zone is corrected to neutral black trim. The diagonal needle is **triangle 1152 in unsorted_10 / redglass_25**, identified by 39 ray samples in the requested Top region ([raw audit](hairline-triangles.json)). A fragment mask hides the extension outside the cap bounds; indices and attributes are untouched. The mask is applied in Clay too, using Clay's matching trim palette.

The grey parallel roof lines are raised stored roof surfaces: the sampled base roof is y≈1.875m and the rib surface y≈1.889m. They are geometry, not an AO artefact, and remain. No claim is made that they are an aftermarket rack.

Rear emblem/lettering/grade metal receives environment intensity 8 instead of 3. Front emblem stays 22; accepted grille, headlamps, side trim, glass, tyres, wheels, seals and tail lamps are unchanged. Clay replaces the relevant metal with its existing Clay finish.

All new position masks subtract the existing body-lift uniform so they travel rigidly with the body. There are no new maps, shadow maps, postprocessing or passes.

## Verification

- [Visual checks](visual-checks.json): 31/31, zero console errors, overhangLock passes, Three 0.166.1. Final source SHA is recorded in both validation and pixels.json.
- [Workshop smoke test](workshop-smoke.log): 31/31 desktop/phone checks.
- [GLB audit](glb-audit.json): all **54 existing GLBs are byte-identical** against 4dc22e5. No new GLBs were required; geometry, NORMAL and COLOR_0 are unchanged.
- [Every changed artistic value and source line](changed-values.json). [Live-file baseline](pages-before.json); the live bytes and remote Main are checked again after pushing the branch.
- Physical iPad/Safari motion quality is not measured in this environment. No frame-rate claim is made.

Offline capture drivers are in [tools/car-polish](../../tools/car-polish). Set `LC_POLISH_WORKDIR` to a test work directory, archive 4dc22e5 index.html/build.json/model into its baseline subdirectory, and use the existing round4b review-server with npm-packed Three 0.166.1 and Chromium/SwiftShader. The production importmap is unchanged.
