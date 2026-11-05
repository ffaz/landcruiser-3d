# Decisions in 2cd7237 — unfinished work

Compared with parent `67bcf67`. This records the committed choices and the experiments already performed; it is not an acceptance report. No new captures, measurements or tests were run to write it. Earlier `WORK-IN-PROGRESS.md` and acceptance/asset snapshots were not all refreshed before the requested stop; they do not certify the final commit.

Rim dimensions below are generator inputs in mm; axial coordinates precede the existing `WIDTH_FACTOR`. They are not new physical measurements. Rim changes are in `tools/rims/model.py`, material defaults in `tools/rims/register.mjs`, and generated results in the twelve rim GLBs, three rim Blend files and `model/manifest.json`.

## Car items

### G1 — privacy glass

`index.html`, new `useFactoryGlass`: rear-door/quarter/tailgate linear diffuse multiplier `(1,1,1) → (.26,.29,.32)`; alpha `.80 → at least .975`. Tailgate environment intensity `.40 → .20`, specular intensity `.45 → .18`, clearcoat `.10 → .02`. I used regional masks to retain front-window transparency without splitting stored meshes. Initial tailgate reflections defeated the darkness target, so I suppressed them; that over-prioritized the luminance limit and left the nearly black result unresolved. Workshop tint visibility was not finally established; see answer 2.

### G2 — glass reflections

`BASE_FINISH`: glass roughness `.28 → .18`, environment `.40 → .75`; colour `#46545f` and base opacity `.80` retained. `useFactoryGlass` adds rear-glass height-dependent diffuse factors `.65–1.10` and indirect-specular factors `.60–1.40`, previously both 1, across y `1.20–1.72`; body lift is subtracted. Environment adjustment alone gave too little gradient, so I added these shader multipliers. A brightness gradient is not proof of a convincing reflected environment; that appearance remains unfinished.

### G3 — sunroof

`useFactoryGlass`: sunroof diffuse multiplier `(1,1,1) → (.14,.16,.18)`, opacity `.80 → 1`, environment `.40 → .015`, specular intensity `.45 → .05`, clearcoat `.10 → 0`. Earlier trial multiplier `(.16,.18,.20)` was darker than side glass only narrowly. I deliberately hid the interior and suppressed reflections to satisfy the brightness ceiling. The resulting opaque black appearance is an overcorrection, not a completed glass finish.

### P1 — satin paint

`BASE_FINISH`: roughness `.42 → .30`, clearcoat `.35 → .65`, coat roughness `.30 → .18`, environment `.70 → 1.00`. Environment trials `1.20` and `1.40` filled the darker paint and reduced the measured shoulder step, so I backed down. This attempted a stronger broad reflection without another pass. Existing diffuse gains and the bonnet's `indirectSpecular × .20` suppression remain; a sampled brightness step did not establish the requested visible specular band. P1 is not fully demonstrated.

### S1 — neutral, continuous shut lines

New `recordDoorEdges` reads 128 cross-sections of stored door geometry, y `.42–1.24`, without modifying attributes. `useOriginalPanelShading` adds a neutral post-tone-map hem shade capped at `.18`, with widths `0 → .0030/.0007 m` on door boundaries and `.0018 m` on adjacent body paint. `useCabinBackingFinish` adds a lower inner-cabin colour clamp `.035–.045` in linear outgoing light. I rejected curvature-only darkening because it made black slivers on shoulders and trim. Boundary masks improved some rows but still failed continuity/colour checks; they can also shade beyond the true gap and need review against the source.

### S2 — aliasing and stray ticks

Same functions as S1: added derivative filtering `max(fwidth(distance) × .30, .00012)` and slope rejection fading from `1.5 → 2.5`; none existed before. I filtered outward-facing triangles and rejected steep profile segments after an earlier mask drew dashes below the windows. No geometry smoothing or post-processing was added. This was an attempted mitigation, not proof that ticks, stair-stepping or orbit shimmer were eliminated.

### F1 — clear headlamps

`finishPartMaterial`, front `lamp_clear`: colour `#f4f5f5 → #ffffff`, opacity `.10 → .035`, roughness `.04 → .035`. I reduced the outer cover's contribution so the existing chrome and projectors could show through; their geometry and explicit chrome settings were retained. I did not build replacement optics. The final clear-glass/projector appearance was not fully accepted merely because a chrome luminance-range sample passed.

### F2 — amber indicators

`finishPartMaterial`, all `lamp_orange`: colour `#d66b18 → #ff8200`, roughness `.13 → .28`, environment `1 → .30`, clearcoat `.80 → .10`, specular intensity `1 → .15`, initial emissive intensity `.06 → 0`; metalness stays 0. An earlier `.20` roughness/`.45` environment trial remained too reflective. I pursued amber colour without changing source geometry. The source's faceted bulb still reads as a copper hexagon; hue/saturation alone did not fix that.

### R1 — recovered chrome below the tail lamps

`recover-strip.py` extracts original source mesh 4 components 73/L and 46/R, 664 triangles each. `register-strips.mjs` appends `Recovered_source_chrome_strip` to each active `lamp_rear_[LR]_finish4b.glb`, using the documented import mapping plus rear un-stretch, transformed source normals and new neutral `COLOR_0 = (1,.5,0)`. I chose source recovery over a procedural bridge. No existing mesh was deliberately removed; whole-file re-encoding explains the smaller files, with limits described in answer 5. Final junction appearance was not fully gated.

### R2 — unlit LED dots

`finishPartMaterial`, `redglass_caps`: colour `#b55d66 → #a30917`, roughness `.15 → .26`, metalness `.55 → 1`, environment `1.70 → .45`, clearcoat `.80 → 0`, coat roughness `.10 → .14`. Intermediate lower-metalness/clearcoat trials retained pink highlights, so I removed the white coat and used red metallic reflections. Existing `lamps_on:false` still sets rear-lamp emission to zero. This can leave dark, bead-like centres; the per-dot final highlight gate was not completed.

### R3 — standard clear lower tail lamps

`finishPartMaterial`, rear `lamp_clear`: `#f2f5f4 → #ffffff`, roughness `.10 → .045`, clearcoat `.75 → .40`, opacity `.35 → .08`, emissive colour `#bfc6c4 → black` and initial intensity `.12 → 0`. Rear chrome roughness `.22 → .12`, metalness `.95 → 1`, environment `1.10 → 3`. A local reverse-bulb mask raises only its opacity to `.60`, centred at `(2.250,1.078,abs(z)=.650)`. Upper red becomes `#d0000c → #e4000c` with diffuse-light gain `1 → 1.25`; a `#f21620`/`1.8` trial looked washed out and was rejected. The lower assembly still reads grey and the bulb fix is incomplete; see answer 4. No calibrated same-exposure OEM-photo match was established.

### R4 — artificial red-lens split

`useRearRedFilter`: spatial RGB attenuation `mix(.60,1,guideWindow) → 1`. I tried a uniform `.85` before removing that attenuation altogether, to stop imposing a shader boundary over the source's own moulded shapes. The existing clear reverse-strip mask remains. The now-unused guide-window calculation was not cleaned up; final source-aligned proof of every remaining horizontal boundary is unfinished.

### T1 — chrome variation

`BASE_FINISH`: general chrome roughness `.52 → .18`, metalness `.45 → 1`, environment `.85 → 3`; tailgate garnish `.45/.45/.85 → .18/1/3` respectively. I increased reflection contrast while explicitly preserving the old door-strip values and existing handle overrides; accepted front grille/headlamp chrome overrides were unchanged. There was no environment redesign. Some pieces still read flat or too bright; a range sample on one rail does not certify all chrome.

### T2 — roof ribs

`useCreamPaintShading`, body-shell roof mask: direct/indirect diffuse multipliers `1/1 → .68/.60`; shader world-normal horizontal components `×1 → ×2.5`, then renormalized. Stored `NORMAL` remains untouched. Reduced diffuse fill alone and an 85% face-normal blend did not restore the broad bead appearance; I replaced the latter with normal exaggeration. That is a shading approximation, not recovered source normals, and source-equivalent width/continuity was not proved.

### W1 — arch liners

New `useArchLinerFill` applies to black zones in `body_shell` and `unsorted_03`, around the existing axle centres. It replaces unrestricted dark output with a floor of `diffuseColor × .65` inside the spatial mask. The initial body-shell-only mask missed the actual liner, so I included `unsorted_03`. This intentionally lifted black pixels but flattened them into a slab; it added no liner detail or suspension. I avoided inventing source geometry, but did not complete a convincing shading treatment.

### W2 — rubber

`tireMat`: `#202123 → #383a3c`, roughness `.93 → .88`. `useBakedShading` tyre-only AO/ridge/valley strengths `.90/.70/.90 → .35/.35/.35`; intermediate `#303234` was still too dark. I lightened existing rubber instead of adding tread or lettering. The same zone override also affects aftermarket rubber adapters. No readable lettering was identified in the existing native-source wheel capture; the complete final-view/phone check remains unfinished.

## Aftermarket rim items

### K1 — KMC steps

`model.py`, disc face profile: inner plateau depth `112 → 85`; successive raised levels now `105/109/115/117`, rather than the previous shallow `112/115/117/114` arrangement; outer radius remains 212. I reshaped the new aftermarket face from the KM720 reference, without changing fit dimensions. No alternative profile was accepted as final; the stepped form still needs likeness review.

### K2 — KMC anthracite finish

`register.mjs`, disc `rim`: colour stays `#7b7f83`; roughness `.58 → .42`, metalness `.65 → .70`, environment `1.8 → 2.5`. I sought gradients without lightening the base colour. This was not a validated finish match; broad flat regions and overly bright internal hardware remain.

### K3 — KMC cap and nuts

`model.py`: cap diameter `132 → 110`, cap depth input `119 → 92`; nut diameter `17 → 20`, lug depth input `110 → 85`, seats/nuts `rim → black`. Cap mark shrinks `89×20 → 69×16`; WHEELS `79×6.5 → 62×5.5`. Moving the cap inward exposed an error: the old hub nose/studs covered it. I subsequently moved the non-steel nose `90 → 75` and studs centre/length `88/60 → 69/36`. Final cap/logo visibility was not recaptured after that correction.

### K4 — KMC slots

`model.py`: requested count `8 → 9`, pitch `45° → 40°`; capsule centre radius `195 → 169`, end radius `10 → 7`, overall length stays 60, arc samples `7 → 13` per end. An intermediate radius 170/length 56 was revised toward the reference. Only the face is Boolean-cut; the bright rotor remains behind it. The raised-pill result is not accepted; see answer 6.

### K5 — KMC lip and lettering

`register.mjs`, lettering changes from `#363a3e/.62/.35/1` to the rim's `#7b7f83/.42/.70/2.5` (colour/roughness/metalness/environment). The existing lip step and small top KMC mark were retained, not newly added. I used a shared finish to avoid black print or a separate machined colour. Visible lip/face colour agreement and cast-letter appearance remain unverified.

### K6 — KMC valve

`model.py`, shared valve angle `−π/2−.08 → −π/2`, retaining radius 219 and existing stem geometry. This moves the existing valve to six o'clock; I did not add another valve. Final on-car visibility was not independently accepted.

### M1 — Method recessed hub

`model.py`: hub plateau depth `111 → 83`, spoke plane about `116 → 115`, cap depth `119 → 90`; cap diameter stays 112. Added `hubcap` zone (`#303438`, roughness .36, metalness .45, environment 1.3); nuts/seats become black and nuts `17 → 20`. The same nose/stud interference and correction as K3 occurred. The final dark-cap/recess appearance remains unverified.

### M2 — Method pocket depth

Window cuts remain true Booleans through the face; rotor, caliper, barrel and opaque backing were retained with their existing material defaults. I relied on the M1/M3 face changes to reveal them rather than revising their separation and shading. That left pale plate-like openings. No dedicated successful M2 fix was delivered; the distorted window and noisy recess were not diagnosed to a specific final triangle. See answer 7.

### M3 — Method window proportions

`model.py`, ten alternating windows retained. `(inner radius, outer radius, inner half-width, outer half-width)` changes `139/183/26/34 → 131/163/25/31.5` and `119/183/34/44 → 105.5/165/30/38.3`; corner rounding stays 7. Intermediate larger openings were reduced using the official front-photo silhouettes. I did not complete the final calibrated window-to-spoke comparison or resolve the reported distorted opening.

### M4 — Method lettering

`register.mjs`: lettering `#363a3e/.62/.35/1 → #8a8f94/.50/.62/1.5`, matching the face material. Face-glyph geometry stays; cap-label depth `124.7 → 95.7` follows the recessed cap. I retained shallow mesh lettering instead of a texture. Same material does not guarantee a cast appearance: dark-looking glyphs and aliasing remain unverified.

### M6 — Method valve

Same shared angle change as K6: `−π/2−.08 → −π/2`; existing valve retained. No separate redesign or final visibility proof.

### H1 — Shanaber openings and hub

`model.py`: requested vents `18 → 16`, phase from half-spacing to a top-centred hole; diameter stays 29 and radius 169. Hub nose changes `black → brake`, keeping its steel position and the open bore. I used a Gulf supplier photo, replacing the earlier capped-replica reference; see answer 1 for its limitation. I did not verify why only 15 openings appear to you, or finish the hub's visual acceptance.

### H2 — Shanaber silver finish

`register.mjs`, steel `rim`: `#c4c9cc` retained; roughness `.36 → .28`, metalness `.65 → .70`, environment stays 2.8. I increased satin reflection instead of changing the accepted pressing. No final source-photo band/finish match was established; it can still look pale and flat.

### H5 — Shanaber valve/barrel

Shared valve angle `−π/2−.08 → −π/2`; existing barrel and valve geometry retained. This was positioning work, not a new barrel or proof that it reads correctly through every opening. Final visual acceptance remains unfinished.

## Direct answers

1. **18 to 15 holes?** The committed generator and manifest request **16**, not 15. I counted 16 vent centres in Allazer's supplier image [8623-1600x1024.jpeg](https://www.allazer.com/image/cache/catalog/clasic/8623-1600x1024.jpeg), advertised for 2017+ Shas/Rub' vehicles. The saved count/annotation stayed outside git. This was not a verified Toyota LC200 17-inch drawing; it may be the wrong variant. I did not establish whether one final opening is obscured or malformed, so I cannot certify 16 visible holes.

2. **Nearly black rear glass and darker workshop tints?** Dark privacy glass was intended; losing its glass/reflection character was not. I deliberately suppressed tailgate/sunroof reflections to pass darkness limits. Unchanged `tint_35/15/5` multiply diffuse colour by `.70/.42/.20` and request opacity `.88/.94/.985`. The shader already floors rear opacity at `.975` and roof opacity at 1, so the first two add no rear opacity, and none adds roof opacity. Reflections are not reduced by those colour multipliers. I did not prove visibly distinct darker tints over this near-black base.

3. **Flat arch slab?** The `.65 × diffuseColor` outgoing-light floor lifts every sufficiently dark liner pixel to the same value. That explains the flattening. I added no detail because new car geometry was prohibited except source recovery; I also did not finish recovering detail through better shading of the existing liner. This was a numerical floor, not a satisfactory W1 finish.

4. **Smoked lower lens/copper bulb?** Rear `lamp_clear` controls the outer cover, rear `chrome` controls the reflector, `lamp_orange`/`orangeglass_21` controls the amber faceted bulb, and `black_12` supplies the dark socket. A second clear object in `unsorted_05` still uses the old `lampLens` (`#dce8f2`, opacity .16). Lowering the outer cover to .08 exposes the dark backing; it does not make the whole assembly clear chrome. The hexagonal source bulb shape and inherited flat shading were retained. The reverse-bulb opacity mask was only an attempt. Nothing external blocked me: I stopped with an incomplete material treatment when you requested the WIP commit.

5. **Smaller lamp files/removal?** The existing audit records L `1,682,760 → 1,614,644` bytes and triangles `64,045 → 64,709`; R `1,697,612 → 1,627,904` bytes and `64,460 → 65,124` triangles. The script appends one source component per lamp, then rewrites the entire GLB through glTF-Transform/`EXT_meshopt_compression` using `QUANTIZE`. It calls no removal, simplification or pruning operation. The recorded audit found original node POSITION/NORMAL/COLOR_0 arrays unchanged. I did not establish a byte-by-byte compression/layout breakdown or audit every other semantic field; the smaller size is not evidence of removed triangles.

6. **KMC raised pale pills?** I moved the slots inward so their radial extent overlaps the existing 354 mm rotor. The Boolean cuts only the rim face, leaving a bright, opaque rotor surface directly behind every slot; shallow wall shading makes that surface look like a plug. That is the known construction choice and likely reason for the pale-pill appearance, not an intentional raised pill. I did not finish verifying every final Boolean opening or correcting the depth/lighting read.

7. **Method plates/distortion/noise?** Hardware exists: rotor, hat, caliper, barrel and backing. Their broad opaque surfaces can fill a window in projection and appear as flat grey plates. I left their existing bright materials and sparse geometry while changing the face around them. The Boolean triangulation, analytic-normal substitution and newly baked rim AO are plausible contributors to the distorted window/recess streaks, but I did not isolate the cause; claiming a specific triangle or solved defect would be unsupported. The cap-covering hub error was corrected late, without final visual verification.

8. **P1 and T4 attempted?** P1 was attempted through the constants above, but existing diffuse-heavy lighting and bonnet specular suppression remain; the earlier pixel step was not adequate evidence of a softbox band. **T4 received no dedicated fix.** The pre-existing handle-cup mask, cavity treatment and handle hardware override stayed. Global paint changes affect its appearance incidentally; I cannot claim that the smudge was removed.

9. **Changes beyond the named items?** The shared nut-radius edit also enlarged steel nuts `17 → 20 mm`, although only KMC/Method explicitly requested that size; this was an unnecessary shared-generator spillover. Shared tyre AO and chrome/glass defaults affect additional meshes in those zones; door chrome/handle exceptions were preserved, but all collateral appearance was not audited. I updated `tests/visual.mjs` material-constant expectations to the new paint/chrome settings, and added capture/audit helpers plus interim docs; those support the requested proof, but changing expected constants is not visual proof. No background, camera preset, root scale, catalogue offset, fit-rule or build-state schema change was made. Existing car mesh changes were confined to the two R1 lamp files; roof shader normals and runtime hem masks are nevertheless substantive rendering changes and should not be mistaken for untouched shading.

## Task 1 — eae39c3 (missing retrospective entries)

No screenshots were taken in that build-only commit; only page loading and console errors were checked. The observations below are the subsequent reviewer's findings, not observations I made at the time.

1. **White paint:** `useCreamPaintShading` panel key/fill gains `2.2/3.4 → 1.65/1.75` (bonnet key `6 → 1.65`), retaining the warm key tint; roof multipliers remained `.68/.60`.
   I tried reducing diffuse fill to expose reflections; the reviewer found door mean `202 → 182` and beige-grey roof. That reduction, plus the stronger coat's energy compensation, removed too much white diffuse response; rejected for this fix-up.
2. **Rear bar:** `finishPartMaterial` garnish roughness/environment `.18/3 → .085/1.35`, metalness stayed `1`; tint colour became `#d5d9dc` on lettering; `reflectiveAccent` removed synthetic diffuse ridge light.
   I tried sharper, less saturated reflections; the reviewer found mean `174 → 111`. Pure metal lost diffuse support and the lower environment gain exposed dark studio regions; this route is rejected as insufficiently bright.
3. **Badges:** grade badges `#eef0f2/.22/.85/8 → #d5d9dc/.085/1/1.35` (colour/roughness/metalness/environment), coat `.20 → 0`; geometry/text unchanged.
   This shared accent treatment was intended to restore reflection contrast, but removed diffuse support and much of the reflected illumination; reviewer saw black/gunmetal. Rejected rather than treating material metalness as proof of chrome.
4. **Paint bands:** `BASE_FINISH` roughness/coat/coat roughness/environment `.30/.65/.18/1 → .24/1/.075/1.1`; bonnet indirect specular and coat suppression `.20 → 1`.
   I tried surface constants and reduced diffuse fill without adding a suitably placed reflected light source. Reviewer still saw smooth falloff; that constants-only route is rejected.
5. **Privacy glass:** `useFactoryGlass` rear diffuse `(.26,.29,.32) → (.24,.27,.30)`, opacity floor `.975 → .80`; roof diffuse `(.14,.16,.18) → (.16,.18,.20)`, opacity `1 → .80`.
   I tried restoring transparency/reflections together; reviewer found quarter glass at 37% of body with an inset pane. The shared low-opacity baseline is rejected for rear privacy glazing; roof darkness passed.
6. **Glass gradient/front brightness:** roughness `.18 → .12`, specular `.45 → .70`; height diffuse `.72–1.18` and reflection `.45–1.65` applied to all windows; rear/roof environment `.65`.
   This extended the gradient to front doors; reviewer found its gradient good (20%) but brightness 64.5%, and quarter gradient only 1.9%. Unbounded reflection/transmitted interior fill is rejected.
7. **Tints:** removed the rear/roof high-opacity floors but retained existing `withFinish` diffuse shades `.70/.42/.20` and requested opacities `.88/.94/.985`.
   I tried diffuse/opacity changes alone; reviewer found only 5–7% total door response and none on the roof. Reflected light was unaffected, so that approach is rejected.
8. **Sill chrome:** side-step chrome received the same `.085/1/1.35` roughness/metalness/environment accent treatment; protected lower-door strip and handles stayed unchanged.
   I tried sharper PMREM reflections without supplying an effective strip light; reviewer still found it flat. This isolated constants-only change is rejected.

## Task 1 fix-up

Exactly one screenshot each of Side, 3/4 front and Rear was captured at 1600×1000 and inspected locally; screenshots remain outside git. Observations below are visual, not numerical acceptance measurements. No test suites or reference captures were run. P2/P3 are unchanged, as requested.

1. **White paint:** `useCreamPaintShading` panel key/fill `1.65/1.75 → 2.2/3.0`, key tint `#fff0d6 → #ffffff`; roof diffuse factors `.68/.60 → .90/.85`.
   Restore neutral diffuse support while retaining the stronger coat; rejected eae39c3's aggressive fill reduction because it caused grey paint. Side and 3/4 captures show white doors, bonnet and roof, with darker reflected regions rather than a beige body.
2. **Rear LAND CRUISER bar:** `finishPartMaterial` garnish/lettering colour `#d5d9dc` (garnish `#e1e4e5`) `→ #f2f4f5`, roughness `.085 → .13`, metalness `1 → .82`, environment `1.35 → 4.5`, coat `0 → .15`.
   `useBakedShading` adds a reflected silver surround/cards, radiance `.12–1.80`, rather than relying on dark PMREM directions. Rejected eae39c3's pure-metal/low-gain approach; rear capture shows a bright silver bar, lighter lettering and darker edges, with LAND CRUISER readable at the captured scale; phone legibility remains the reviewer's check.
3. **GXR/V8 badges:** same targeted silver/card response as item 2, retaining all lettering geometry and baked cavity detail; no changes to Toyota emblems or protected trim.
   Diffuse support plus directional reflections avoids black metal between highlights; rejected eae39c3's `metalness 1/env 1.35`. Rear capture shows silver GXR and V8 lettering with shaded bevels; their small size limits visual assessment of reflection range.
4. **Paint band:** `useOriginalPanelShading` adds finite side softboxes (world wall `abs(z)=6`, y `2.4±.40` and `.25±.20`, feather `.10/.065`), coat radiance `0 → 18 × Fresnel × reflected box coverage`.
   A reflected ray intersects each box using source shading normals, giving a view-dependent specular band without painting stripes or adding a render pass. Rejected eae39c3's constants-only approach; Side shows distinct shoulder and sill transitions, and 3/4 shows highlights following bonnet/door surfaces. Numeric step/width remains for review.
5. **Quarter/rear privacy:** `useFactoryGlass` diffuse `(.24,.27,.30) → (.15,.17,.19)`, privacy reflection multiplier `1 → .36`; rear opacity floor `.80 → .97 → 1` (roof retains `.80`).
   Higher opacity blocks the cabin's bright inset while diffuse absorption keeps a reflecting dark surface. Side/3/4 captures show much darker quarter glass but a faint inner rectangle persisted at `.97`; I rejected `.97` after inspection and set rear privacy opacity to `1`, with no additional screenshot. Tint darkness now uses item 7 rather than opacity headroom.
6. **Glass gradients/front brightness:** non-roof environment `.75` (rear `.65`) `→ .50`, front diffuse multiplier `1 → .82`; retain height diffuse `.72–1.18` and specular `.45–1.65` on every vertical pane.
   Reduce front brightness while retaining its successful gradient; blocking interior light also prevents it flattening quarter shading. Rejected the prior stronger environment and low rear opacity; Side shows a lighter upper/darker lower front pane and a faint gradient on dark rear/quarter glazing. No numerical ratios are claimed.
7. **All glass tints:** `withFinish` no longer multiplies glass diffuse alone; per-variant `uGlassFinishScale` scales complete outgoing light `1 → .55/.25/.08` for 35/15/5, and tinted opacity becomes `1`.
   This absorbs environment and coat reflections as well as diffuse, including sunroof; rejected the previous diffuse-only `.70/.42/.20` treatment because reflections swamped it. All three variants rendered without console errors; the three required screenshots show the base finish, so per-step percentages were not visually certified from those screenshots.
8. **Sill chrome:** side-step chrome uses item 2's `.13/.82/4.5` roughness/metalness/environment and reflected finite side cards, instead of `.085/1/1.35` with no additional reflected light.
   Use the actual reflected ray to light existing bevels; rejected the flat constants-only treatment. Side/3/4 captures show bright outer chrome edges against dark reflected sections and the black tread. Protected chrome lower-door strips, handles and roof rails retain their finishes; numerical range remains for review.

## Task 1 fix-up 2 (die-cast style)

Followed `docs/TARGET.md` section 1; the previous appearance thresholds were not used. Inspected final Side, 3/4 front and Rear images at 1600×1000, plus a wide rear close-up using the 3× zoom input; images stay outside git. Misframed viewport/cropped captures were discarded. Page and manual tint/swatch rendering checks produced no console errors; no test suites ran. Geometry, stored GLBs, NORMAL, COLOR_0, dimensions, framing presets and render-pass count are unchanged.

1. **Glass:** `BASE_FINISH` colour/roughness/opacity/environment `#46545f/.12/.80/.75 → #aab7bf/.24/.18/.22`; `useFactoryGlass` rear opacity `1 → .48`, roof `.80 → .50`, privacy diffuse `(.15,.17,.19) → (.45,.49,.52)`, with a single broad pale-sky field replacing the forced height/specular gains.
   `withFinish` replaces opacity-1 tints with surface scales `.75/.45/.12` and absorption `.20/.45/.85`, retaining transmission at 35/15. Rejected the opaque privacy floor and diffuse-only tinting: Side/hero show seats, steering wheel and rear headrests through glazing; Rear shows the cabin through the tailgate. Opposite-side source window framing is visible through the cabin, rather than a projected rectangular reflection.
2. **Paint:** `BASE_FINISH` roughness/coat/coat roughness/environment `.24/1/.075/1.10 → .42/.35/.32/.70`; removed the `18 × Fresnel` strip reflection and its helper from `useOriginalPanelShading`, and removed the roof normal exaggeration `×2.5 → authored shader normal`.
   Kept the neutral white key and panel key/fill `2.2/3.0` to retain white while roughening the sheen. Rejected the reflected strips that created wavy/blobby bands. Side and hero show a bright bonnet/roof/shoulder, broad smooth highlights, and a shaded lower side without the added streaks; paint swatches still render with their original colours.
3. **Chrome/metal:** shared roughness/metalness/environment `.18/1/3 → .38/.60/1`; front grille/bumper/lamp overrides `.14/1/16 → .32/.60/1.10`, emblems environment `22/8 → 1.10`, rear chrome `.12/1/3 → .34/.60/1`, garnish `.13/.82/4.5 → .46/.50/.65`.
   Removed the reflected cards and `.12–1.80` mirror surround; `useBakedShading` instead supplies gentle orientation-dependent silver fill `.12–.22`, preserving source cavities. Rejected mirror streaks and a common bar/text tone; the selected `lettering_rear_base` now takes the lighter lettering finish. Hero/rear show satin grille/rails/metal; rear detail shows readable LAND CRUISER on the darker silver bar without a crossing streak.
4. **GXR/V8:** `finishPartMaterial` badge colour/roughness/metalness/environment `#f2f4f5/.13/.82/4.5 → #e9eef1/.30/.65/1.10`, coat `.15 → .08`, retaining baked edge/cavity shading and every source letter surface.
   Chose slightly firmer silver edges within the satin family to separate raised text from white paint; rejected dark mirror patches, painted outlines and altered lettering. Rear and the rear detail show raised silver faces, shaded bevels and crisp GXR/V8 shapes.
5. **Side-step:** chrome rail roughness/metalness/environment `.13/.82/4.5 → .38/.60/1.0`, coat `.15 → .08`, with the same soft silver fill as item 3; the black tread's material is unchanged.
   Rejected the rail's reflected strip cards and mirror response rather than changing its source construction. Side/hero show a softly shaded light-silver rim around a black tread pad, with the existing edge detail retained.


## Task 5 — aftermarket rim pockets, cast marks and steel pressing (2026-11-05)

Followed `docs/TARGET.md` sections 1 and 3; no conflicting owner decision. Built with Blender 4.3.2 and the existing `model.py → register.mjs` pipeline, using external work/dependency directories. Inspected Side, front 3/4 and Rear at 1600×1000, plus one final front and 3/4 on-car view for each rim; screenshots are outside Git. The first Method view exposed a depth conflict; its two review images were replaced after correction. No comparison sheets, new reference collections, test suites or reviewer measurements were made.

- **Shared hardware / K4–M2:** bright rotor `#c1c7ca/.37/.62 → #4c4f52/.50/.25` (colour/roughness/metalness); separate darker `hat`, dark inner barrel and near-black backing, with restrained caliper/fastener reflections.
  Rejected bright opaque window fills and deleting/shrinking the locked 354 mm rotor. On-car views show darker hardware behind actual cut walls, including the caliper in the left openings; rotor, backing, barrel, adapters, offsets and brakes retain their geometry.
- **K4:** retained nine identical 40° capsule cuts and their 12-o'clock phase; pocket chamfer `1.2 → 1.8 mm`. Face/lip now share matte anthracite `#55595d/.58/.45`, with environment `2.5 → 1`.
  Rejected raised pill meshes, painted dark slot decals and a bright machined lip. Front/3/4 show nine recessed openings with narrow lit walls and darker interiors; the formerly harsh edge is subdued without flattening all wall light.
- **K5:** top lip mark `39×8 → 43×9 mm`, raised relief `.24 → .65 mm`; centred on the solid lip land. KMC retains the face colour rather than a contrasting print material.
  Rejected white/black printed lettering and a larger badge outside the flange. Both on-car views show the small KMC mark at 12 o'clock with readable cast edges.
- **M2:** retained the through-cuts and bevel walls; dark shared hardware separates the left caliper from the face. The long-window tangential stretch is reduced by the M3 angular correction below.
  Rejected filling windows with dark polygons or altering the locked brake package. Front shows ten cut boundaries; 3/4 shows their wall depth and the hardware at a second depth, including the upper-left opening.
- **M3 — partial; exact official-photo match skipped:** different short/long tangential slopes → common ±12° window half-angle; retained alternating inner/outer radii and rounded corners, so the bottom long window no longer gets an extra width multiplier.
  Rejected an invented new spoke layout. Front shows consistent angular widths, but the repository-linked official front image returned HTTP 403; exact photo-shape acceptance remains for the reviewer, and is not claimed here.
- **M4:** face glyph radius `111.5 → 190 mm`, on the solid outer land beyond all window edges; smaller arc pitch keeps the full words on that land. Added raised tone-on-tone cap lettering with the black cap's roughness/metalness.
  Rejected glyphs crossing window edges/recesses and bright printed cap text. Front/3/4 show both METHOD words fully supported by the solid face and restrained relief on the cap.
- **Method hub moiré:** the hat front is `.060 + .046/2 = .083 m`, exactly coincident with the previous `.083 m` recessed face. Face plateau `.083 → .0845 m`; all hardware positions stay fixed.
  Rejected blaming/removing Boolean triangulation, analytic normals or baked AO: the speculative AO substitution was removed. Retaining those systems with 1.5 mm face clearance removes the visible streaks in the final 3/4 view; this was depth fighting, not a reason to replace the shading pipeline.
- **H1:** steel phase `top-centred → half-pitch (11.25° offset at 22.5° pitch)`; retained plain 29 mm holes, no raised flanges, and the existing valve at 6 o'clock.
  Rejected a seventeenth hole, moving the valve and hiding a hole behind it. Both on-car views show all sixteen openings, with neither a top nor bottom central hole and the valve between the lower pair.
- **H2:** steel `#c4c9cc/.28/.70/2.8 → #a8afb4/.44/.42/1.35` (colour/roughness/metalness/environment); hub nose/studs retain a separate metal finish, with an open centre and no cap.
  Rejected chrome-like mirror glare and a uniform diffuse grey. Front/3/4 show silver-grey paint with a broad curved sheen through the dish and a distinct rolled lip.
- **H5:** retained the hollow barrel geometry; inner return gets a separate dark silver `#50585f/.62/.25/.65`, separated from the near-black backing and painted face.
  Rejected adding a fake inner disc or moving the accepted barrel/brakes. Oblique on-car openings show dark inner depth and the barrel return behind the silver pressing.
- **Nut-size spillover (prior answer 9):** steel nut diameter `20 → 17 mm`; KMC/Method remain 20 mm, five nuts and the 5×150 mount unchanged.
  Rejected changing the shared radius for every style. Steel views show the smaller five metal nuts and visible open-centre hub.

Build output counts (triangles per rim; bytes summed across its four mounted GLBs): KMC **19,018 → 19,018**, **1,710,568 → 1,722,192 B**; Method **17,774 → 17,770**, **1,602,352 → 1,626,912 B**; Shanaber **13,521 → 13,792**, **1,268,992 → 1,296,920 B**. These are generator/file-size values, not a test report. Regenerated only the twelve authored aftermarket rim GLBs and their material/catalogue metadata; source car GLBs, their NORMAL/COLOR_0, source design, body/overhang/wheelbase locks, three.js version and render-pass count are unchanged. Generated `.blend` working files remain outside the checkout; `model.py` is the reproducible source of these builds.


## Task 5 fix-up 1

Re-read TARGET sections 1 and 3 at `1aeef0a`, including the explicit dark-KMC decision. Used the reviewer's supplied Method angles/radial proportions. Built with Blender 4.3.2; inspected one final front and 3/4 on-car image of each rim at 1600×1000. Images and build working files stay outside Git; the steel pair was replaced after separating its existing centre-ring finish. No test runs or comparison reports were made; numerical image acceptance remains with the independent reviewer.

1. **Dark KMC / light-defined detail:** face and lip retain exactly `#55595d`, roughness `.58`, metalness `.45`, environment `1`; explicit pocket walls and bevelled cast relief now carry the highlights.
   Rejected lighter face/lip pigments, emissive edges and a bright machined lip. Both views retain the dark anthracite family, with step edges, pocket outlines and relief readable through illumination; the face and lip still share one finish.
2. **KMC pocket interiors and 9-o'clock sliver:** mixed grey brake/caliper finishes → KMC-only near-black `#101418/.78/.10/.20` (colour/roughness/metalness/environment). Replaced the clamped automatic pocket bevel with a 2.2 mm inset, 4.5 mm deep tapered mouth and independent wall normals, plus a .6 mm finishing bevel.
   Rejected painted slot decals, moving/removing the locked brake package and a brighter wall pigment. Face-on shows nine dark interiors with lit perimeter walls; 3/4 shows actual depth. The separate dark vertical sliver is no longer visible in the left slot. Count, 40° pitch and top-slot phase are retained.
3. **KMC cap and lip marks:** unbevelled KMC relief → .28 mm cast-edge bevel; WHEELS font extrusion/bevel `.35/.10 → .65/.20 mm`. The raised lettering gets an AO floor `.92` and roughness/environment `.34/1.35`, while keeping the rim's pigment.
   Rejected printed contrasting text and lightening the cap. The front view now clearly reads `kmc / WHEELS`; the oblique view catches the cast edges. The small 12-o'clock lip mark is also more legible with bevels and controlled relief occlusion.
4. **Method alternating windows:** common 24° mouths → alternating **21° short / 28° long** mouths, with short at 12 o'clock. Alternating centres at 33°/39° spacing give nominal 8.5°/14.5° spoke gaps; retained short radii `.131–.163 m` and long `.1055–.165 m`.
   Rejected equal widths and changing the already accepted radial reaches. Front shows five short and five long openings with the narrower/wider alternating spoke rhythm; 3/4 retains the layout. This uses the reviewer's official-photo measurements rather than an inaccessible photograph or a new invented reference.
5. **Method front-visible pocket walls:** automatic 1.2 mm bevel → explicit 2.5 mm inset, 4.5 mm deep sloped pocket wall and .6 mm finish bevel. Wall colour stays the titanium face colour, with its own roughness/metalness and non-smoothed wall normals.
   Rejected flat dark aperture polygons, a larger brake gap and contrasting painted borders. Each face-on opening now has a visible illuminated wall against the deeper hardware; 3/4 shows the wall and rear hardware at distinct depths. METHOD remains wholly on the solid land and the 1.5 mm hub-face clearance/moiré fix stays intact.
6. **Shanaber light satin silver:** rim `#a8afb4/.44/.42/1.35 → #d5dade/.44/.25/1.20`, keeping the pressing, hole phase and broad rolled lip unchanged.
   Rejected chrome metalness, mirror-like roughness and flattening the curved dish. Both views show lighter silver paint and a broad soft dish sheen, rather than the earlier mid-grey finish; this targets the requested 150–170 luminance range without claiming a new reviewer measurement.
7. **Shanaber open centre / barrel:** hub nose, studs, nuts and existing centre-ring surfaces → separate satin metal `#bdc5cb/.40/.35/1.10` with restrained occlusion; inner barrel `#50585f → #939da5` retains its rough metal finish.
   Rejected adding a cap, moving the hub/brakes and filling the bore. Front shows the metal hub nose inside the dark open-bore gap, surrounded by its metal ring and five 17 mm nuts; 3/4 shows the ring depth and a lighter barrel return through the holes. All sixteen half-pitch openings and the valve between the lower pair remain visible.

Generator triangles and GLB file sizes (not a test report):

| Rim | Triangles per rim, before → after | Four GLBs total bytes, before → after | Final bytes per left / right GLB |
|---|---:|---:|---:|
| KMC | 19,018 → 21,056 | 1,722,192 → 1,828,896 | 457,264 / 457,184 |
| Method | 17,770 → 18,736 | 1,626,912 → 1,598,664 | 396,976 / 402,356 |
| Shanaber | 13,792 → 13,792 | 1,296,920 → 1,265,984 | 313,560 / 319,432 |

Left/right sizes apply to front and rear on the corresponding side. Added pocket-wall and letter bevel triangles account for the alloy-rim increase; no simplification was applied to source car assets. Changes are limited to the rim generator/registration code, twelve generated aftermarket rim GLBs, their manifest/catalogue metadata and this log. `index.html`, stock rim/source car GLBs, their NORMAL/COLOR_0, all fit dimensions, offsets, adapters, brake geometry, body locks, Three.js version and render-pass count are unchanged.

## Task 1 fix-up 3

Re-read `docs/TARGET.md` section 1 after pulling through `1aeef0a`. Inspected the final Side, 3/4 front and Rear views at 1600×1000, plus a wide rear detail with camera projection zoom set to 3; screenshots remain outside git. No appearance measurements or test suites were run. Rim files and source geometry/attributes are untouched.

1. **Privacy glass:** `useFactoryGlass` rear opacity `.48 → .70`, diffuse `(.45,.49,.52) → (.28,.31,.34)`; opposite rear panes use `.86` opacity and an extra `.65` diffuse factor. Clear-front and sunroof optical constants and tint steps stay unchanged.
   Rejected opacity-only darkening after the first side inspection still showed the bright far-window rectangle. Rear inside faces now absorb in a forced single pass, with depth writes disabled on rear/shared-shell glazing and back faces discarded outside a soft far-privacy mask. Final Side shows that rectangle darkened, with rear headrests still visible; hero/rear retain readable seats through darker glazing.
2. **White paint:** `useCreamPaintShading` adds a neutral-white-only modifier: upper-side indirect gain `1 → up to 1.30`, lower-body gain stays `1`; top direct gain `1 → .50–.66`, top indirect modifier `.80–.90`, across a broad finite-key falloff centred at source `(x,z)=(-.75,.40)` with radii `(2.0,1.05)`.
   Rejected global exposure/lighting changes that would disturb the passing swatches, and uniform top attenuation that still looked flat in the initial hero. Final hero shows a white lit door/shoulder, gently shaded bonnet/roof and a darker lower side, without returning to box streaks; the coloured swatches' response is unchanged by this white-only mask.
3. **LAND CRUISER bar/text:** garnish colour/roughness/metalness/environment `#b9c3cb/.46/.50/.65 → #cbd3d9/.40/.40/.85`; its diffuse fill now varies `.14 → .32` over the source bar's y `1.020–1.110`, with a small `.06` edge response. Raised bar letters get an additional `.38` diffuse fill and `.16` edge response, masked away from the lower V8 components.
   Rejected equal lifting of bar and letters, and high mirror gains: a separate relief response preserves contrast over the lighter satin gradient. Final rear/detail show a lighter bar, brighter readable letters and shaded relief/edge accents, without a crossing streak. GXR/V8 material constants remain as in the passing state.
4. **Front chrome:** grille/headlamp housing colour/roughness/metalness/environment `#dce3e8/.32/.60/1.10 → #e6ecef/.28/.55/1.40`; `useBakedShading` gives only this role diffuse silver fill `.22–.38` (previously `.12–.22`) and `.12` source-edge/grazing catch-light strength.
   Chose diffuse support and small bevel catches to recover light silver without mirror regions; rejected restoring the old environment gain of 16. Final hero shows brighter grille-surround and headlamp-housing edges with readable inner detail and soft satin faces; no geometry, lens or grille-bar layout changed.
5. **Side-step:** `loadPart` renders the source rail's paint zone as chrome, rather than letting the body swatch repaint it white; `finishPartMaterial` uses `#b7c0c7/.40/.50/.85` (colour/roughness/metalness/environment), with soft orientation/height shading. The native black tread zone is unchanged.
   Rejected changing only the tiny existing chrome lamp frame: source-node inspection showed the main rail was `carpaint_6`. Final Side/hero show a distinct silver rail surrounding the black pad. The passing pale-silver chrome lower-door strip is unchanged, as requested.

## Task 2 — panel lines, handle cups and silver separation (2026-11-05)

Read `docs/TARGET.md` first; based on `120702e`. Inspected exactly one Side, front 3/4 and Rear capture at 1600×1000, outside git. Only sampled those final images for the requested remeasurement; no test suites, comparison images or reports. Stored GLBs, NORMAL/COLOR_0, source design, locks and render-pass count are untouched.

### S1 — door shut lines
Asymmetric `.0030/.0007 m` door and `.0018 m` body shading → `.0014/.0008 m` caps with a derivative-based 1.1-pixel core; 128 → 192 source sections and perpendicular-distance correction replace slope-based dropout.
Chose source-following sampling and neutral output rather than smoothing/redrawing the curve or moving panel edges. Side samples at y 440/460/480/500 show two dark pixels with neutral RGB (e.g. 62/62/62, 68/68/68); hero no longer has the added broad hem band. Source bends remain, rather than inventing a straight B-pillar transition.

### S3/B3 — bonnet, lamp and roof-adjacent strokes (incomplete)
Broad curvature/AO shoulders and derivative-triggered bonnet darkening → deep-source-occlusion core (`.55–.88`) and narrower valley response (`.12–.38`), with deep crevices neutralised after colour conversion. This also reduces paint-side cavity darkening beside the glazing; source window trim stays intact.
Rejected moving source edges, hiding grille/lamp surfaces or painting a replacement border. Hero still shows 3–4 dark pixels at the bonnet-to-grille opening (e.g. x 450, y 506–509); the ≤2-pixel requirement is not achieved. No claim of a completed fix for the source opening or front-view roofline; only the three requested views were captured.

### T4 — handle-cup halos
Forced `.165×.055 m` oval restoring full AO → `.125×.038 m` inner-cup region with `.32` source-occlusion weight and reduced valley weight; surrounding broad AO is no longer forced back on.
Kept source handles/cups and hardware materials, rejecting flat painted patches or replacement geometry. Side and hero show clean paint around the cups with a small concave shade beneath the original silver handles rather than a wide dark halo.

### C1 — LAND CRUISER relief
Letter-only diffuse support `.38 → .80` and edge response `.16 → .22`; bar finish and lower V8 components stay unchanged. Chose relief-specific fill rather than brightening the whole garnish or restoring mirror cards.
Rear shows crisp light letters and small bright edges on the satin bar; sampled letter faces are roughly 209–211 against adjacent bar 178–184, with brighter edge pixels around 223–225. These are final-image samples, not an independent acceptance score.

### C2 — front satin silver
Grille/headlamp chrome `#e6ecef/.28/.55/1.40 → #bdc5cc/.38/.60/1.0` (colour/roughness/metalness/environment); diffuse silver support `.22–.38 → .14–.26`, edge response `.12 → .18`.
Chose a darker satin face with small bevel catches, rejecting mirror reflections or any grille/housing redesign. Hero shows silver housing/surround distinct from white paint, with readable projector detail and bright narrow edge accents; protected source parts and the rear chrome strip remain intact.

## Task 5 fix-up 2

Pulled through Task 1 `120702e`, re-read TARGET sections 1 and 3, and recorded the owner's corrected Method layout/lettering placement in TARGET. The new inward lettering and titanium hub ring supersede the earlier outward-lettering/dark-recess directions. Built with Blender 4.3.2 and inspected one front and one 3/4 on-car capture of each rim at 1600×1000; images remain outside Git. Compared the Method front capture to the supplied normalized radii/angles and sampled its face tone as requested. No test suites or comparison-image reports were produced.

1. **Method light matte titanium:** kept pigment `#8a8f94`; roughness/metalness/environment `.50/.62/1.5 → .62/.10/3.0`, clearcoat `0`, restrained physical specular intensity `.35`.
   Rejected a lighter pigment, emissive fill, global studio changes and mirror-like metal. Unobstructed front flat-face samples are approximately **147/255** (sRGB luma), within the requested 145–155 range; 3/4 remains satin with broad lip shading rather than dark gunmetal.
2. **Method radial casting:** cap radius `56 → 30.03 mm (.13R)`; a raised titanium hub replaces the broad dark recess, with its shaded edge near `.34R`, flat bands `.34–.49R` and `.74–.85R`, dark bead-grip step `.86–.88R` and titanium lip `.89–1R`. Cosmetic cap reduction preserves the actual rear 110.3 mm mounting bore.
   **The approximate `.20R` nut-circle request was not applied:** locked 5×150 requires a 75 mm radius, **.325R** at the locked 231 mm lip radius. Rejected breaking that mount to match the approximation; retained five black nuts and seated their front presentation on the raised ring. Front/3/4 show the small cap, titanium ring, flatter bands and relocated groove, with the existing hardware clear behind the face.
3. **Method windows:** prior unequal 33°/39° centre spacing → exact **36° clockwise pitch**, short at 0/72/144/216/288° and long at 36/108/180/252/324°. Short mouth radii **136.29–170.94 mm (.59–.74R)** with 19°/22° inner/outer widths; long **113.19–170.94 mm (.49–.74R)** with 30°/27° widths; sampled circular edges retain radius through the middle instead of cutting straight inward chords.
   Rejected the previous smaller normalization radius, equal angular slopes and shifted long-window centres. Rounded mouths have a **4.62 mm (.02R)** chamfer band. Front comparison shows short at 12 and long at 6; representative raster widths near their rounded inner/outer edges are **18.8°/21.6°** at the top and **29.8°/26.8°** at the bottom. Dark-hardware-only masks omit lit walls and therefore give smaller radial reaches; the stated recipe dimensions describe the complete mouth outline.
4. **METHOD inner-band casting:** glyph radius **190 → 94.71 mm (.41R)** in the flat band; the upper word reads normally and the lower word is rotated upside-down. Cap text scales with the 60.06 mm cap diameter.
   Rejected the now-corrected outward-placement instruction and crossing either windows or hub hardware. Both captures show raised face-coloured words wholly in the solid inner band above/below the hub, clear of the openings and groove.
5. **Method opening depth:** retained dark rotor/hat/barrel/caliper/backing and their geometry; new mouth walls use the titanium pigment with roughness `.66` and environment `2.2`, below the face's response. The new face clears the unchanged `.083 m` hat-front plane by more than the previous 1.5 mm minimum.
   Rejected flat painted aperture plates, moving the brakes and restoring coplanar surfaces. Front shows the slightly darker chamfer band; 3/4 shows its illuminated thickness followed by the darker hardware at a second depth, without hub moiré.
6. **Shanaber exposed nose:** flat-ended cylinder → a smoothly rounded forged nose, still within the existing **106 mm diameter and z .080–.100 m envelope**, behind the unchanged open bore and metal nut ring.
   Rejected adding a cover/cap, filling the bore and moving the brakes or fit surfaces. Front shows a clear light-to-dark gradient instead of a zero-spread disc; 3/4 shows the raised nose, bore-edge separation and five metal nuts. The sixteen half-pitch holes and lower valve position remain intact.
7. **KMC lower-left wall light:** kept all geometry/counts, dark hardware and `#55595d` face/lip. Pocket-wall environment `1.1 → 1.35`, metalness `.30 → .20`, with a modest frontward broadening of positive-z chamfer normals only.
   Rejected lighter pigment, emissive borders and a local painted highlight. Front/3/4 keep nine dark slots with more readable 7–9-o'clock wall edges, while the cast cap mark and dark face/lip remain consistent.

Generator counts and file sizes:

| Rim | Triangles per rim, before → after | Four GLBs total bytes, before → after | Final bytes per left / right GLB |
|---|---:|---:|---:|
| KMC | 21,056 → 21,056 | 1,828,896 → 1,828,568 | 457,188 / 457,096 |
| Method | 18,736 → 23,010 | 1,598,664 → 1,990,072 | 495,268 / 499,768 |
| Shanaber | 13,792 → 14,212 | 1,265,984 → 1,298,864 | 322,052 / 327,380 |

Left/right sizes apply to front and rear. Method's added radial bands, rear-bore transition and rounded polar pockets account for the increase; Shanaber adds 420 nose triangles. Rebuilt only authored aftermarket rim GLBs. `index.html`, source car GLBs and their attributes, stock rim, 462 mm outer lip diameter, wheel offsets, 5×150 centres, adapters, rotor/caliper/shield geometry, body locks, Three.js version and render-pass count are untouched. The requested steel nose shaping is confined to its original outer envelope. All seven items have implementation work; item 2's incompatible approximate nut-circle radius remains explicitly excepted above.

## Task 2 fix-up 1 — source-edge artefacts and material relief (2026-11-05)

Pulled/rebased to `f05fe23` before editing and re-read TARGET, its Variants table, VERIFIED and the relevant decision entries. TARGET is unchanged; there is no proposed correction to it. Inspected final 1600×1000 Side, front 3/4 and Rear captures plus a camera-zoom-3 door-gap crop, all outside Git. No test suites, comparison images or reports were produced. Source GLBs, POSITION/NORMAL/COLOR_0, transforms, design locks, lighting, Three.js version and render-pass count are unchanged. The only new vertex input is a transient material mask identifying existing lettering islands.

1. **Stray dashes — partial; source A-pillar detail retained.** Added material depth offsets for the existing door/bonnet paint and separated the overlapping body paint-node material cache; removed the synthetic hem-darkening stroke entirely. Chose depth ordering rather than painting replacement lines or deleting source faces.
   Side/hero show the beltline, sill and rear-quarter shading without the previous broken secondary strokes. A source-surface ray inspection identifies the remaining small A-pillar projection as `body_shell/black_12`; that stored trim detail remains visible in Side. Rejected erasing/repainting the source trim to claim a complete fix: TARGET's source-design rule wins, so item 1 is not claimed complete.

2. **Door shuts and brown fringe.** Hem overlay → source crevice only, with colour correction covering the source fold and its neighbouring antialiased pixels; source sampling now reaches y 1.30. Neutralised hidden cabin surfaces below the beltline, including cabin-centre upholstery actually visible through the gap, rather than only the side backing.
   Rejected another width-clamped drawn line and a darkest-pixel-only judgement. The final 3× crop shows a single thin grey stroke through the top, middle and bottom, without the former brown lower section or paired dashed hairlines; Side/hero retain the source curve. No independent acceptance score or claimed test result.

3. **Bonnet/grille crevice.** Pure-black upper backing → neutral dark-grey material fill with a vertical depth gradient on the existing grille/upper-front backing faces (`unsorted_07/08`). The stored upper strip spans y 1.0759–1.1142; the visible opening remains geometrically wide.
   Chose the requested shaded-crevice route rather than moving the bonnet/grille, hiding faces or drawing a narrower border. Hero shows a grey return above the darker recessed opening instead of one uniformly black band; this is a shading fix, not a claim that the source opening was narrowed to two pixels.

4. **Front satin silver.** Grille colour/roughness/metalness/environment `#bdc5cc/.38/.60/1.0 → #cbd2d8/.30/.78/1.8`; lamp chrome uses `#aeb8c0` and environment `1.4`. Normal-dependent diffuse support and source-edge catches replace the more uniform grey support.
   Rejected mirror cards, global lighting changes and housing/grille redesign. Hero shows brighter upper bar edges, mid-grey lower faces, shaped surround returns and silver lamp rims against the white paint. Lens, indicator and reflector materials are untouched.

5. **LAND CRUISER relief, side and rear.** Lower-door source letter islands now receive their own `.95` diffuse support and `.36` edge response via a read-only connectivity-derived `reliefLetter` rendering attribute; the surrounding strip and handle keep their materials. Rear letter flanks receive less fill and stronger `.34` catches; garnish edge response `.06 → .10`.
   Rejected recolouring the whole lower-door strip, moving/rebuilding letters or adding text decals. Side/hero show light, legible door-strip lettering rather than dark faint marks; Rear keeps the readable lettering with more distinct relief edges on the satin bar.

6. **Handle cups.** Full-cup AO/valley treatment → weak source occlusion below the handle only, no upper-cup valley/ridge enhancement, and a local upper-cup material fill floor calibrated for the existing AgX exposure. Stored and shader normals are unchanged.
   Rejected smoothing the cup, replacing geometry and additive fill that left a grey/bright blob. The final 3× crop shows clean paint above and beside the handle, with the source cup and contact definition beneath it; Side/hero no longer show the surrounding grey smudge.
