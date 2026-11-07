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

## Task 5 fix-up 3

Started from `f05fe23`; read TARGET's rim rows and section 2 Variants table plus VERIFIED's photo tags. **No disagreement with TARGET; TARGET.md is unchanged.** Method/KMC front catalogue references judge face design/colour/layout only, never their six-lug mounts or hub pads. The KMC five-lug quarter reference alone judges nut seating. Shanaber's face-on tile judges the pressing, not the vehicle hub. Our three mounts remain five nuts on 5×150; Method's raised titanium ring ends at .34R.

Inspected the owner's attached photos and montage against one final face and 3/4 on-car capture of each rim. Normalized face capture lip radii were approximately 306 px (KMC, matching the 620 px front reference), 472 px (Method, matching the 1000 px front reference), and 147 px (Shanaber, matching the face tile in the review montage). KMC's quarter was inspected against its five-lug quarter photograph. Reference images stayed in the conversation; no other photos were downloaded, and neither references nor screenshots/copies enter Git. Superseded working captures were replaced after correcting geometry conflicts they exposed. No test suites or independent scoring were run.

### Method MR705

1. **Openings:** single planar chamfer → two-stage curved pocket shoulder, retaining the .02R band; wall environment `2.2 → 3.4` with a broader frontward normal lobe. Dark iron now has radial baked shading and a darker caliper, retaining the original rotor/caliper/barrel geometry.
   Rejected a uniform painted aperture fill, white empty cutouts that discard the locked brakes, and extra live lights/passes. Face shows a lit perimeter and machining/radial variation behind it; 3/4 shows the wall followed by darker hardware at a separate depth, including visible barrel gaps.
2. **Corners:** short clamped 3.5 mm corner rounding → true 8 mm edge-length fillets with five quadratic subdivisions and separate circular inner/outer arcs.
   Rejected hard trapezoids and increasing angular widths/radii to fake roundness. Against the attached front photo, all ten mouths have softer corner turns while retaining the accepted radial reaches, short/long alternation and exact 36° pitch.
3. **Raised hub:** titanium top `z .113 → .123 m` over the `.106 m` flat face, with a light upper catch and a shaded descending edge ending at **.34R**. Five black nuts retain their 75 mm circle; the small cap remains .13R.
   Rejected copying the six-lug dark well or pad, and a zero-width step that caused a self-intersecting generated shell. Final face/3/4 show a raised titanium platform with an outer shadow edge, without restoring the old oversized black recess or hub moiré.
4. **Lip:** narrow, angular front roll → broad convex front profile within the unchanged 231 mm outer radius. Same #8a8f94 pigment, with roughness `.80`, metalness `.08`, environment `2.4` and restrained specular response rather than the face's `.62/.10/3.0` response.
   Rejected a machined bright border and lowering the whole passing face tone. The final pair shows a thicker rounded matte rim with a broad light-to-shade falloff instead of a hard bright flange; groove and face-band locations remain unchanged.
5. **METHOD relief:** glyph width/height `10/9 → 11.5/10.5 mm`, extrusion/bevel `.65/.20 → 1.20/.35 mm`; retains the face pigment and the accepted .41R position above/below the hub.
   Rejected black printed lettering, moving it back to the outer band and making the face darker for contrast. Front reads the bolder words against the face; 3/4 reveals lit bevel tops and shaded lower edges. The lower word remains upside-down.

### Shanaber Gulf steel

1. **Open centre:** broad smooth dome → narrower stepped spindle nose with a flat top, softened shoulders and a small centre drilling, inside the original nose envelope. Bare metal becomes dull/darker `#626a70/.82/.15/.45`; nuts use separate restrained metal. Removed the redundant ring that was coplanar with the painted pressing.
   Rejected a domed cover, a shiny collar and copying the photographed vehicle hub. Both views show the open bore around a smaller raised matte metal nose, with five metal nuts on the painted metal ring; the bright collar is gone.
2. **Pressed holes:** diameter `29 → 26 mm`; circle sides `16 → 24`, softened two-segment 1.5 mm pressed-edge bevel and rougher hole-wall paint.
   Rejected raised flanges, hard reflective inner rings and changes to the accepted sixteen-hole count/half-pitch phase. The face comparison shows slightly smaller plain openings; 3/4 keeps the wall depth without sharp interior glare, with the valve between the lower pair.
3. **Lip and steps:** thin front flange → broader convex rolled lip, plus shallow continuous rolled contours on the inner and outer face. The accepted satin silver-grey paint is retained.
   Rejected chrome, painted concentric lines and narrow flat ridge tops that looked like stripes. Face/3/4 show a wider rounded outer rim and soft raised concentric transitions through the pressing, consistent with the permitted Shanaber face-on reference.

### KMC KM720 Roswell

1. **Small cap:** cap radius `55 → 38 mm` (diameter `110 → 76 mm`), with a narrow raised bezel; KMC/WHEELS relief scales to fit inside the five-lug circle. The smaller cosmetic opening retains the actual rear mounting bore.
   Rejected a large logo disc and a bright separate cap colour. The quarter photograph supports the smaller cap and bezel catch; both final views read KMC/WHEELS in the dark family. Moving only the new face plane to .088 m clears the previously hidden .085 m hub-nose front; boundary normals/shading were corrected to remove the exposed triangular streaks.
2. **Wide pocket slots:** mouth `60×14 → 68×22 mm`, with a 4 mm wide, 6 mm deep chamfer; centre radius `169 → 174 mm`. The complete mouth and its darker throat were judged at the same lip diameter against the attached front photograph.
   Rejected literally doubling/tripling the full mouth, which overshot the supplied photograph's complete slot outlines; instead widened the actual throat and visible chamfer. Final images show nine broad outlined pockets with lit walls and dark hardware, rather than thin black slits. Count, 40° spacing, top phase and bottom valve are unchanged.
3. **Five nuts:** all-black heads → restrained dark metal heads with a 1 mm two-segment bevel, retaining black seats and five 20 mm service nuts on the locked 5×150 circle.
   Rejected six nuts from the front catalogue shot, altered bolt circles and uniformly bright chrome heads. The final pair shows all five nuts with distinct rim catches and darker seats; this was checked against the five-lug quarter reference only.
4. **Steps/lip catches:** .6 mm single finish bevel → 1.2 mm two-segment edge catches on the authored face, with dedicated same-pigment edge shading. Lip and face remain matte dark **#55595d**.
   Rejected a lightened lip, emissive highlights and broad mirror reflection strips. Front/3/4 show crisp concentric-step catches and a restrained lip edge, while the broad face/lip stay dark as required by the owner rather than matching the brighter catalogue lighting.

Build output values (triangles per rim; bytes across all four mounted GLBs):

| Rim | Triangles, before → after | Four GLBs bytes, before → after | Final per left / right GLB bytes |
|---|---:|---:|---:|
| Method | 23,010 → 29,759 | 1,990,072 → 2,406,320 | 598,948 / 604,212 |
| Shanaber | 14,212 → 21,660 | 1,298,864 → 1,768,760 | 439,272 / 445,108 |
| KMC | 21,056 → 27,469 | 1,828,568 → 1,810,472 | 453,788 / 451,448 |

Left/right values apply at front and rear. Rounded walls, rolled profiles, higher-sided steel holes and two-segment bevels add triangles; file compression also reflects the simpler corrected planar shading. Changed only the authored aftermarket rim generator/registration, twelve rim GLBs, their manifest entries and this log. TARGET.md, VERIFIED.md, index.html, source car/stock rim assets and their NORMAL/COLOR_0, offsets, mounting circles, adapters, brake geometry, body/wheelbase/overhang locks, Three.js version and render-pass count are unchanged.

## Task 3 — source lamp optics and front satin silver (2026-11-05)

Started from `3d1cad1` on full-car-pass, after reading TARGET, the latest decision section and the lamp/front-silver entries. No disagreement with TARGET; TARGET.md is unchanged. The pasted request wins over the older attached prompt: the front photo judges only grille/headlamps; the lower grille follows the source. Ignored the aftermarket headlamp tile and non-OEM tail-lamp tiles. Third-party references remain only in the conversation.

- **R3 — normal OEM lower lamps:** pale layered covers and grey reverse bulb → shared faint-cool crystal material on rear clear meshes AND `unsorted_05/clearglass_27`, brighter source chrome reflectors, and a white dielectric reverse-bulb mask. Restricted dark backing to the bulb sockets within the lower-lamp band; the source amber hexagon gets translucent glass with restrained inner colour support.
  Rejected smoked defaults, recolouring the reverse bulb amber, changing the hexagon, and thinning only the outer cover. Rear/3× show distinct amber outer and white inner bulbs over crisp grid reflectors, with lighter silver backing rather than the old dark-grey surround.
- **R2 — LED dots and red lens:** metallic maroon caps → non-metallic clean-red caps with small soft dielectric catches and a low rest emission; deep-red lens gets a restrained pale reflection. Local optical colour support prevents AgX turning the small saturated caps peach; the rest of the car retains its tone mapping.
  Rejected pink metal highlights, extra lights, bloom and new lamp geometry. Rear/3× show red dots brighter than their recessed red surroundings; the continuous lens face and source dot pattern remain.
- **F1 — projector and outer glass:** nearly invisible uniform cover → faint clear outer reflection plus domed optical shading on that existing cover over the two source projector bowls, with separate treatment for `clearglass_33`. The material changes lighting normals only, never the stored NORMAL attribute or vertex positions; masks follow body lift and mirrored source lamps.
  Rejected adding lens meshes, altering reflector bowls, or transmission's extra scene render. Front 3/4 and 3× show two dark-interior glass domes with soft upper highlights and readable chrome rims rather than exposed bare bulbs.
- **F2 — front amber:** dull faceted copper-like finish → the same translucent non-metallic amber glass used at the rear, preserving the source hexagon and reflector grid. Optical surfaces no longer receive opaque trim's baked-cavity darkening.
  Rejected metallic amber and accepting a hue number as proof. Front 3/4/3× show a saturated amber glass corner bulb with a soft catch instead of brown metallic edges.
- **F3 — lower grille:** uniformly dark band → source black bar/mesh with a small normal-dependent diffuse fill and fine, derivative-filtered roughness grain. Separate source-node material cache entries keep this treatment off neighbouring bumper trim.
  Rejected copying the attached Grand Touring lower bumper, drawing replacement bars, and changing geometry. Front 3/4/3× retain the source opening and horizontal bar with a restrained plastic sheen; the material stays black.
- **T2-C — front silver:** pale uniform silver → darker satin housing pigment, broader dielectric/metal balance on the grille, and restrained pale catches on existing bar bevels, surround returns and lamp rims. Kept the shared source-edge/cavity shading and all bar geometry.
  Rejected mirror cards, global lighting changes and replacing the chrome housing with a dark aftermarket design. Front 3/4/3× show silver housings separated from white paint and brighter top-edge/rim catches with shaded returns.

Inspected final 1600×1000 Side, front 3/4 and Rear plus camera-zoom-3 rear-lamp/headlamp captures against the permitted reference tiles at similar display sizes. Captures and helper scripts stay outside Git; no comparison images, reports, reference collections or test suites were produced. Stored car GLBs, NORMAL/COLOR_0 buffers, body/wheelbase/overhang locks, Three.js 0.166.1, scene lights and per-frame render-pass count remain unchanged. Independent measurement/acceptance belongs to the separate reviewer.

## Task 3 fix-up 1 — clear source optics and full lower-lamp silver (2026-11-05)

Pulled/rebased to `1843f3e` before editing and reread TARGET's Lamps, Glass, Chrome/metal and tail-lamp decisions. No disagreement with TARGET; TARGET.md is unchanged. The review supersedes the earlier task's optimistic visual claims. Accepted LED-dot shading, amber hue, lower-grille texture and source chrome-grid geometry are retained; no reviewer suites were run.

1. **F1 projectors:** dark, world-projected dome masks → actual source `clearglass_27` dome components, identified from welded source topology at load and tagged with a transient material-only `lampOptic` attribute. White/faint-cool glass uses low opacity, a small upper catch and the source normals; its interiors, reflector/shield and chrome rim remain readable.
   Rejected moving another guessed world-space ellipse or adding replacement lenses. Both left/right 3× views show clear light interiors and source-centred highlights without the offset smoky ghost; single-pass two-sided glass reveals the existing domes without adding a scene render.
2. **R3c lower lenses:** flat grey surround → bright, softly varying prismatic silver on the lower band of the existing `chrome_2` reflector backing, under both clear-cover objects. Surface inspection located `chrome_2` behind the grey field; the accepted chrome grids are separate `chrome_1` components and remain unchanged.
   Rejected simply thinning glass again, enlarging/rebuilding the grids, or painting the whole lamp white. Rear/3× show the full lower band bright with fine prism catches and clear grid detail instead of a grey slab around a small inset.
3. **R3a/F2 amber glass:** flat orange support → source-island UVs with a lighter luminous core, deeper amber edge, lower varying opacity and a small soft catch. The source hexagon and accepted orange pigment/hue remain; front `black_12` receives a soft recessed seat treatment only around the actual bulb.
   Rejected a metallic edge, uniformly opaque orange and masking the source hexagon into a sphere. Front/rear 3× show core-to-edge amber shading with the reflector visible through the edge; the front's exposed black block is softened into the inner socket.
4. **R3b reverse glass:** offset white world-mask and black wedge → the actual small reverse-glass component, with its own centred source UVs, low opacity and a pale soft catch. Corrected the backing seat to the source bulb centre (abs(z) .6368 m, y 1.0765 m); exposed lower backing stays silver outside a tiny deep seat.
   Rejected a white disc on the broad cover and preserving a broad black exclusion beside the bulb. Rear/3× show a translucent white/clear bulb over the reflector without the adjacent hard black wedge.
5. **T2-C satin front silver:** shared front fill → a separate darker housing role (`#8f9da8 → #74838f`, roughness .30, environment 1.05), with less diffuse support and stronger confined source-edge catches. Grille/surround catches become .85 rather than .62; source bars, returns and lamp rims supply the edges.
   Rejected mirror cards, global light changes and redesigning the housing. Front 3/4 and both 3× views show silver housings distinct from white paint, shaded returns and brighter narrow bar/rim catches.
6. **R2 red-lens depth:** broad bright-red face → slightly deeper pigment (`#be0615 → #ad0615`), diffuse gain 1.25 → 1.12 and a gentle source-window-distance absorption transition toward inner guide regions. Existing soft pale outer-face reflection and accepted LED cap shader/constants remain.
   Rejected hard horizontal splits, darkening the dots or adding bloom. Rear/3× show a deeper red face/inner guides beneath the pale upper reflection while the source red dots remain separately readable.

Inspected final desktop 1600×1000 Side, front 3/4 and Rear, plus 3× rear-lamp and left/right headlamp views beside the permitted OEM reference tiles from the conversation; no comparison images saved. Screenshots/helpers stay outside Git. No reports, reference collections or test runs were produced. Stored GLBs, POSITION/NORMAL/COLOR_0, source shapes, size/wheelbase/overhang locks, Three.js version, scene lighting and per-frame scene-render count remain unchanged. Independent visual acceptance remains with the reviewer.

## Task 5 fix-up 4

Pulled/rebased from `0cd45da` to `1843f3e` before editing; re-read TARGET's rim rows/Variants and VERIFIED's reference tags. **No disagreement with TARGET; TARGET.md is unchanged.** The new owner decisions supersede the earlier flat KMC hub and circular Shanaber pad. The machined KMC 5×150 photo judges cone/pocket/cap layout only, never our dark finish; the Toyota-pattern steel replica judges bore/pad/holes/rolls, never its diameter, paint or off-car bore contents. The two six-lug on-car Method references judge window darkness/wall lighting, never our five-lug hub ring.

Inspected one final face and one 3/4 on-car capture of each rim against the attached photos at comparable rim sizes, directly in the image views; no comparison was saved. Captures came from the 1600×1000 desktop viewport, with close framing for the rim details. References remain in the conversation, screenshots/build work remain outside Git, and no other references were downloaded. Working captures were replaced after fixing the KMC pocket cutter winding/shading and softening the steel pressing. No test suites or independent acceptance scores were run.

0. **Shanaber stud pad and holes:** circular pressing/26 mm round vents → integrated, softly rounded pentagonal raised stud pad around a **.27R front bore**, plus **28×23 mm radial ovals**. Five 17 mm nuts remain on the 75 mm radius; sixteen vent centres remain at 169 mm with the accepted half-pitch phase.
   Chose a continuous pressed shell with softened shoulders; rejected an overlaid pentagonal plate, raised hole flanges, copying the replica's 16-inch fit and changing the real rear mounting bore. Face/3/4 show the five-sided pressing carrying the nuts, the larger bore edge, sixteen radial ovals and the valve between the lower pair, as in the permitted reference layout.
1. **Shanaber centre:** small dark rounded spindle with a broad black void → wider matte mid-grey hub face behind the open bore, a narrow ~2.4 mm bore-edge gap, and a raised **flat-topped** stepped nose with a small drilling. Dull metal `#626a70/.82/.15/.45 → #92989d/.86/.08/1.0` (colour/roughness/metalness/environment).
   Rejected a cover, dome, chrome collar and a painted or near-black bore fill; planar end normals prevent the nose inheriting dome-like boundary shading. The final pair shows the mid-grey metal annulus behind the pressing, the raised flat end and shaded shoulders; the former large black pit is gone and five metal nuts remain visible on the pad.
2. **Shanaber hole glare:** reflective silver-painted hole walls/bright barrel return → dark matte walls `#41484d`, roughness `.96`, metalness `0`, and a restrained dark-grey barrel return `#495156/.88/.04/.50`.
   Chose the actual return/wall materials rather than covering the openings with discs or removing brake hardware. In the final face/3/4, lower-left holes retain visible depth and dark hardware variation without the former pale diagonal sheen or hard interior glare; the holes remain open.
3. **Shanaber rolled ridges:** shallow blended outer contours → two distinct rounded rolls centred near **192 and 203 mm**, followed by a broader convex outer lip. The satin silver-grey paint, 231 mm maximum lip radius and rear bead-seat coordinates are retained.
   Rejected painted highlight rings, sharp square steps and chrome. Face/3/4 show a light crest and shaded flank on both rolls, with a separate broad rounded lip, instead of one soft undifferentiated face gradient.
4. **Method bead-grip groove:** `.102 m` groove floor → `.1005 m` floor, with eased entry/exit shoulders; finish `#43484d/.72/.12/.65 → #3b4045/.78/.10/.50`. The narrow groove remains at **.86–.88R**.
   Chose a small geometric/material deepening rather than widening the band or restoring a broad black inset. Final face/3/4 show a more definite narrow shaded step against the titanium neighbours; the independent reviewer retains responsibility for the ≥8 L acceptance measurement.
5. **Method inner bright ring:** abrupt inner shoulder → eased `.845–.86R` transition and a dedicated same-titanium matte shoulder (`roughness .85`, metalness `.02`, restrained specular). The passing lip material and broad roll are unchanged.
   Rejected a machined bright edge and darkening the whole lip/face. The final pair loses the thin white-looking inner ring and retains one broad matte rounded titanium lip with a softer transition into the narrow groove.
6. **Method window wall:** wall environment `3.4 → 3.8`, roughness `.58 → .53`, and frontward normal lobe `.22 → .27`; window mouths, rounded corners, radii/alternation and all dark brake/barrel materials stay unchanged.
   Chose a small wall-lighting adjustment against the tagged on-car photographs, rejecting brighter window fills, empty white apertures and a six-lug recessed hub. Face/3/4 show a clearer lit pocket shoulder on one side with the same dark hardware at the second depth; the raised titanium .34R hub ring remains intact.
7. **KMC steps/lip/slot catches:** 1.2 → 1.4 mm face finish bevel, plus a small two-segment flange-edge bevel; same-pigment edge response `.42/.35/1.35 → .30/.45/1.8`, and slot-wall environment `1.35 → 1.65`.
   Rejected a lighter pigment, broad polished bands, extra lights and live passes. Face/3/4 show stronger thin concentric-step/lip catches and clearer slot walls while the broad face AND lip remain matte dark **#55595d**; nine slots, 40° pitch and top phase are unchanged.
8. **KMC 5×150 hub:** flat centre/small `.165R` cap → raised tapered centre cone carrying a **.20R cap**, with five real blind counterbore pockets cut into the cone and the dark-seated metal nuts recessed inside them. The actual through-bores and nut centres remain **5×150**; KMC/WHEELS relief and bezel scale with the cap.
   Rejected the six-lug catalogue hub bowl, a machined finish, exposed nuts sitting directly on the cone and a cosmetic black pocket decal. The final pair shows five distinct dark recesses with metal rim catches, a raised cone and a readable tone-on-tone cap inside the lug circle; the 5×150 quarter photograph judges this layout only. Correct cutter winding and local pocket/cone normals remove the working capture's triangular shading artefacts.

Build output (triangles per rim; bytes across four mounted GLBs):

| Rim | Triangles, before → after | Four GLBs bytes, before → after | Final per left / right GLB bytes |
|---|---:|---:|---:|
| Method | 29,759 → 29,759 | 2,406,320 → 2,395,904 | 596,940 / 601,012 |
| Shanaber | 21,660 → 29,621 | 1,768,760 → 2,404,000 | 599,416 / 602,584 |
| KMC | 27,469 → 31,942 | 1,810,472 → 2,145,864 | 537,384 / 535,548 |

Left/right values apply at front and rear. Added geometry is the steel pentagonal pressing/rolled contours and the five real KMC counterbores/cone; no textures or extra render passes were added. Rebuilt only the twelve authored aftermarket rim GLBs and their manifest entries. The generator/registration and this log are the only other changed files. `index.html`, TARGET, VERIFIED, stock rims/source car GLBs and their NORMAL/COLOR_0, mounting pivots/offsets, 462 mm lip, bead seats/widths, 5×150, rear mounting bores, adapters, brake package dimensions, body/wheelbase/overhang locks, lights and Three.js version remain unchanged. The exposed steel hub nose/front pressing are the requested centre changes, not changes to the brake or mounting fit.

## Rims self-check loop

Started from `61e813e` after pulling full-car-pass and reading TARGET first (sections 1/2/3, revised centre decisions and Rims acceptance), then VERIFIED's variant tags. **No disagreement with TARGET; TARGET.md is unchanged.** This task explicitly supersedes the earlier build-only/separate-checker workflow: I built and checked four full loops, then stopped at the owner's four-loop limit. **The ≥8/10 goal was not reached.** Scores below are my overall on-car resemblance judgements, not independent acceptance results; the owner's eye remains final.

Each loop captured all three rims in the native hero 3/4 and side views, then at 3× wheel framing face-on and 3/4, all at 1600×1000/DPR1. I inspected the normal-view sheets and same-lip-diameter real/ours comparisons. All 48 native captures, comparison images, reference crops, helpers and build work stay outside Git (`/workspace/rims-self-check/`). References were the owner's attachments, not downloads. Six-lug catalogue photos judge face design only; the on-car Method photographs judge dark pockets/lit walls, not colour or the hub. KMC's five-lug quarter judges layout, not its brighter studio finish; the 5×150 machined photo judges the low cone/seat layout only. Steel replica/genuine tiles judge the permitted pressing/holes/rolls; their off-car voids/vehicle hubs are not copied.

### Loop 1 — replace the dominant centres with depth in the face

- **Method — 6.5/10.** Three differences: window corners still look hard at car scale; the sloping webs form narrow facet stripes; the lip has a bright, hard border. Rebuilt the window band as a radial dish (.49R at z .096 → .74R at z .132), a 12 mm casting section and deeper mouths; retained all ten measured mouths, alternation, .13R cap and raised titanium .34R ring. The pair shows depth behind the openings, but not the real wheel's soft, chunky cast character yet.
- **KMC — 6.5/10.** Three differences: the centre still shades like a dome; ring shoulders look laminated rather than cast; cap/slot relief remains weak at native car size. Lowered the centre (z .133 → .103 at the cap boundary), strengthened actual concentric step heights and kept #55595d with a less metallic studio response. The rings start to lead again, but the broad interpolated hub shading remains unacceptable.
- **Shanaber — 7.0/10.** Three differences: the stud pressing is still too prominent; the hub end reads too much like a flat button; the outer rolls are thin bright stripes. Reduced the pad to a few millimetres of fivefold pressing, placed it within a continuous circular dish and retained sixteen plain radial ovals. Both views improve on the bright pentagon, but still need subtler transitions.

### Loop 2 — improve the silhouettes; reject the KMC regression

- **Method — 7.0/10.** Three differences: the broad face still reads too uniformly; the lip remains harder than the rounded reference; cap/face lettering is less characteristic. Increased window corner fillets from 8 → 14 mm, reduced the excessive outer web height to z .125, lowered nut presentation, and added a restrained cast mountain/cap mark with stronger tone-on-tone text. Face/quarter show rounder mouths and better seating; the whole wheel still falls short of 8.
- **KMC — 5.5/10, rejected.** Three differences: five triangular shading fans appear around the pockets; the hub dominates despite its lower geometry; the ring shoulders remain too abrupt. Replaced the curved centre profile with a straight low cone and stopped bending flat-band normals. That removed part of the dome response but exposed an AO regression; this version is not a release candidate and scores below loop 1.
- **Shanaber — 7.3/10.** Three differences: the exposed hub is still button-like; the plain hole band is too uniformly flat; rolled flanks remain more graphic than the genuine pressing. Reduced the pad rise to about 3 mm, changed ovals to 27×24 mm and broadened the outer rolls. The subtle pad is retained as the best pressing/dish construction so far.

### Loop 3 — diagnose, rather than accept, new artefacts

- **Method — 7.0/10.** Three differences: the inner face remains broad and flat-looking; the lip/step separation is still too hard; small cast lettering does not have the real mark's character. Reworked the full mouth chamfer into a wider lit 5.5 mm-deep shoulder over the thick casting, with dark hardware at the next depth; softened the face response and made the cap mark legible. The windows read as pockets, but overall resemblance remains about 7.
- **KMC — 5.5/10, rejected.** Three differences: the same five AO fans persist; highlights across the low cone remain discontinuous; those defects distract from the stepped rings. Applied radial-strip normals instead of Boolean-ngon normals, then probed the actual visible surface: normals were coherent, but neighbouring exported AO values were .12 and .97. The float32 inner-edge radius fell just below `face_depth`'s first interval and incorrectly used its outer-edge fallback; this identifies the cause for the final fix.
- **Shanaber — 6.8/10, rejected.** Three differences: the vent trough becomes too deep; its broad light/dark band dominates the pressing; holes disappear into an exaggerated dish at 3/4. Curved the previously flat vent band down to z .099 to try to show pressed depth. The comparisons show an overall regression, so loop 4 restores loop 2's shallower vent band rather than keeping this change.

### Loop 4 — final retained result

- **Method — 7.0/10.** Three remaining differences: webs/window mouths still have a more regular, less cast silhouette; the outer lip/shoulder still reads too planar; lettering/cap relief is simplified. Broadened the raised titanium ring's sloping edge within the same .34R endpoint and applied the matte lip finish across its visible outer face, with a slightly clearer lit mouth wall. Hero/side and both close-ups retain the best overall Method result, including real depth and the locked five-lug hub; it is **not claimed to meet 8/10**.
- **KMC — 7.5/10.** Three remaining differences: ring shoulders are more abrupt than the reference; slot-wall illumination is still uneven; the cap mark is weak at normal viewing distance. Clamped the inner profile boundary before depth interpolation, removing the .12/.97 AO discontinuity; the low straight cone, shallow nut pockets and crisp steps now shade coherently. The final pair has no triangular fan or large dark dome, and the rings/slots lead again; #55595d face/lip are retained. This is better than loops 1–3 and the starting dome.
- **Shanaber — 7.5/10.** Three remaining differences: dish transitions are simplified; outer rolls still look thinner/more regular than the genuine wheel; the exposed hub nose remains somewhat button-like. Restored the best loop-2 vent band/pad, lowered the service-nut presentation and recessed the dull metal annulus behind the bore with a smaller raised flat-ended nose. Both views show the subtle pressing without the former flat bright pentagon or loop-3 trough; this is the best retained steel result, but below 8.

No fifth loop was run. No rejected KMC AO-fan build or exaggerated steel trough is shipped. Normal car views were used to judge readability, not only enlarged isolated faces. The final six side-by-side images are delivered for the owner's direct judgement; they and the native captures are excluded from the commit.

### Budget and locked-fit checks

| Rim | Triangles per rim, before → final | Four mounted GLBs bytes, before → final | Final left / right bytes |
|---|---:|---:|---:|
| Method | 29,759 → 33,878 | 2,395,904 → 1,599,816 | 398,576 / 401,332 |
| KMC | 31,942 → 32,022 | 2,145,864 → 1,218,696 | 305,152 / 304,196 |
| Shanaber | 29,621 → 30,261 | 2,404,000 → 1,353,512 | 337,520 / 339,236 |

Left/right applies at front and rear. Quantized only these authored rim assets (14-bit positions, roughly .03 mm precision; 12-bit normals; 8-bit baked shading) before Meshopt compression, retaining real relief comfortably below 40k triangles/700 KB each. Decoded all twelve GLBs: finite unit normals, matching triangle counts, preserved mount/catalogue fields and decoded bounds within 0.1 mm of the authored bounds; maximum 33,878 triangles and 401,332 bytes. The actual viewer loaded and captured each compressed rim in every loop-3/4 pose. Compared raw generated positions against the starting rim build: rotor, hat, caliper, backing, brake-detail and rubber-adapter geometry are identical for each style. Brakes' material defaults are unchanged.

Changed only the aftermarket generator/registration, twelve authored rim GLBs, their manifest entries and this log. `index.html` and its car materials, TARGET, VERIFIED, wheels.json sizes/widths/offsets, 5×150/75 mm nut radius, stock rim, stored tyre/car GLBs, source NORMAL/COLOR_0, adapters, brake package, body/wheelbase/overhang locks, Three.js 0.166.1, scene lights and per-frame render-pass count remain unchanged. Compression changes the new rim buffers only. The requested raised ring/low cone/subtle pressing are kept; no six-lug recessed pad or hub bowl was copied.

## Rims step-by-step construction review — Method and KMC

Started from `262d4e3`; pulled/rebased full-car-pass and read TARGET first, then VERIFIED's variant tags and the latest rim decisions. The owner rejected the previous overall resemblance and accepted Shanaber: **no Shanaber work is included**. Its four GLBs and four manifest entries are byte/value identical to the starting checkpoint. This is a local construction checkpoint, not a claim of finished resemblance; the Method centre decision below is pending, so no push has been made.

Research used the supplied front/quarter/on-car attachments. Google search was attempted through the configured proxy and returned a tunnel HTTP 403 under the enforced network policy; no bypass or unrelated download was attempted. Traced radial contours on the actual KMC front photo, then compared each change at the same lip diameter. All traces, comparisons, raw builds and 1600×1000 hero/side/3× face/3× quarter captures are outside Git under `/workspace/rims-stepwise/`; no reference image or copy is committed. Six-lug hub layouts were excluded, the five-lug KMC quarter judged seating/layout, and Method on-car references judged dark openings and wall depth.

1. **Method, first step — aperture construction.** Previous measured outlines were treated as the mouth, then shrunk inward for the chamfer, making the clear openings too small/narrow. The specified short/long outlines now define the clear apertures and a constant-width .02R outward offset surrounds them with the cast mouth; count, pitch and alternation remain unchanged.
   Rejected widening arbitrary angles or painting brighter holes. The first face/quarter comparison shows broader openings and more visible webs between them. This explicitly changes the outer mouth bounds: the chamfer now surrounds the clear opening rather than consuming it; it is not a claim that the old mouth-measuring harness would report identical radii.
2. **Method, second step — actual lip/web section.** Removed the face plate's outer .89–.97R overlay that covered the rounded barrel, joined the face to its inner shoulder and made the web section grow from 12 to 18 mm outside the hub. Kept the flat inner/outer lands, dark bead-grip step and all locked fit/brake coordinates.
   Rejected another painted highlight or global light adjustment. This comparison exposed a more basic problem: the rounded front roll itself was being culled, so increasing its relief could not make it appear. No finish/material-lighting retune was used to disguise that construction error.
3. **KMC, first step — measured concentric construction.** Replaced the misplaced oversized stairs with the traced circular breaks around .59R, .70R and .88R, plus a continuous shallow dish into the main land; finish bevel 1.4 → .4 mm. Kept the subtle low centre, five recessed nuts, .20R cap and the existing nine slot mouths/40° pitch/phase.
   Rejected another dome, lightened anthracite and treating broad coloured stripes as depth. The quarter/face pair shows the two main fine circular breaks in the reference positions, with a curved dish rather than the previous abrupt inner stair. Face/lip remain #55595d with their existing material response.
4. **Shared Method/KMC root cause — front surfaces wound backwards.** The open-profile lathe used opposite winding from the closed face shell. The Method roll filter contained 832 triangles with zero positive-Z-facing triangles; after reversal, 768 face forward and 64 are vertical flange-edge triangles. Reversed only the two unaccepted rims' barrel surfaces and KMC's cap relief, not the accepted steel.
   Rejected DoubleSide materials, new render passes, and substituting brighter shading for invisible surfaces. The paired captures now show the real rounded front rolls. The correction also exposed the inner barrel as pale: assigned its existing inner wall/shoulder to the already-authored dark `barrel` finish, retaining the front roll's face finish and the dark openings.
5. **KMC, final construction step — one outer collar.** Removed the separate overlapping bead-ring shell and extended the face into one collar meeting the barrel at r224 mm/z118.875 mm. The small top KMC relief remains on the collar's actual land.
   Rejected leaving intersecting surfaces and compensating for their broken edge highlights. Final close-ups have a continuous collar instead of the competing ring surfaces; the dish, fine steps, slot walls and rounded flange are now genuine visible geometry. This is a checked construction improvement, not an assertion that the owner's resemblance goal is already met.

### Method centre: TARGET dimension conflict requiring owner decision

**I think TARGET's .13R cap and .34R ring dimensions are wrong for the requested reference resemblance and should have flagged this earlier.** The cap in the supplied catalogue image is near .23R, whereas .13R forces a 60.1 mm cap at R231 mm. The .34R ring is diameter 157.1 mm around the locked 150 mm nut circle: it leaves only 3.5 mm beyond each nut centre, so the current 20 mm heads extend beyond it. A ring containing those heads would need at least diameter 170 mm. This is a geometric clearance observation, not permission to copy the six-lug lug well.

Prepared a dimension comparison outside Git: red is the current .13R cap; blue is a proposed .235R cap (diameter 108.6 mm). A proposed titanium ring to .38R (diameter 175.6 mm) would retain the five nuts on 5×150 and give them surrounding land. The proposal keeps a raised titanium ring rather than the excluded six-lug dark well. Its exact centre proportions remain an owner decision; no larger-centre geometry is included in this checkpoint. The asynchronous owner question is pending. **TARGET.md has not been edited and the committed Method centre dimensions remain .13R/.34R.** TARGET line 3 requires asking the owner before departing from its dimensions; line 107 reserves TARGET edits to the owner.

### Verification and budget

| Rim | Triangles per mounted rim, before → checkpoint | Four GLBs bytes, before → checkpoint | Checkpoint FL/RL and FR/RR bytes |
|---|---:|---:|---:|
| Method | 33,878 → 31,456 | 1,599,816 → 1,474,496 | 367,660 / 369,588 |
| KMC | 32,022 → 37,398 | 1,218,696 → 1,531,648 | 383,016 / 382,808 |

Decoded all 12 mounted rim GLBs: finite unit normals, manifest triangle counts, <40k triangles/<700 KB, locked mount/catalogue fields and decoded bounds within 0.1 mm. Verified no backwards-facing triangles remain on the exposed Method front roll. Compared raw generated positions: rotor/hat/caliper/backing/brake-detail and tyre-adapter geometry remain identical to the starting build for both changed styles. Verified hashes of Shanaber's four GLBs, index.html and wheels.json and exact equality of Shanaber's four manifest entries. Only model.py, eight Method/KMC GLBs, their manifest entries and this log change. No shader, Three.js, scene light, render-pass, car/stock-rim/tyre GLB, TARGET, VERIFIED, size/width/offset/PCD or source NORMAL/COLOR_0 changes.

## Reference rebuild — owner-unrestricted Method and KMC

Owner's subsequent instruction: **“there is no limit... you can do whatever you want for this task.”** This resolves the preceding centre-dimension question and removes the four-loop stop. I treated it as permission to correct the Method centre proportions and construction beyond the earlier numeric/raised-pad interpretation. **The old .13R/.34R Method centre was wrong for the intended likeness. TARGET.md is not edited; this direct owner instruction supersedes those model dimensions for this revision.** Five nuts, 5×150, catalogue sizes/widths/offsets, tyres, brakes, the car and the accepted Shanaber remain protected.

The preceding 7/7.5 scores were too generous and did not establish resemblance. This revision used the attached wheels as the shape reference, rebuilding and checking each main feature before moving on. Only the supplied references were used; the prior Google request was blocked by the environment policy. Six-lug nut count was never copied. All build/capture/measurement/finish trials are outside Git under `/workspace/rims-reference-rebuild/`; no third-party image or copy is committed.

### Method MR705

1. **Centre and cap:** 60.1 mm cap/raised small platform → **108.6 mm cap (.235R)**, attached deep shoulder, lower titanium lug land and a cupped shoulder ending at **.40R**. Kept five nuts on the 75 mm circle; added real shallow cast nut seats and a restrained black-steel head finish. The initial larger-cap/raised-platform trial still read as a puck, so it was replaced by the lower land/inner shoulder construction.
   Rejected the old small-centre constraints as a substitute for reference resemblance, a floating cap, and copying six studs. Same-size face/quarter comparisons now show a cap, lug land and shoulder at distinct depths. The main face stands at z .115 m above the land's .101 m; the larger cap's lower shoulder attaches inside the bore.
2. **Windows and web silhouette:** measured the actual white apertures in the attached front photo. Short apertures average about 1,790 mm²; the generator gives 1,799 mm². Long apertures average about 3,990 mm²; the final generator gives 3,896 mm². A .505R long-window trial was rejected after the area/letter-fit check; clear long/short inner radii return to **.49R/.59R**, outer .74R, at ten alternating positions.
   Retained the prior corrected outward cast chamfer and 18 mm web section. Rejected thin dark notches and a steep conical whole-face dish. Final face and quarter views show rounded clear openings with cast walls, dark hardware behind and broad webs; the inner cup supplies the major depth instead of a raised centre disc.
3. **Branding and casting:** enlarged the cap mark, mountain and cartouche to fit the real cap proportions; mountain/cartouche are extruded geometry. Face METHOD is positioned at .434R with 14 mm glyph height, clear of the .40R well and .47R mouth edge. Actual glyph radial bounds are approximately .405–.467R.
   Found a construction error in the old FONT pipeline: bevel was applied before glyphs were normalized, shrinking its XY width to microns while leaving tall Z walls. Rebuilt the face glyphs flat at final physical size, then extruded 1.4 mm and beveled up to .65 mm. Same-pigment satin response retains readable grey faces and real cast edge shading. Rejected invisible paint-on-paint tops, printed black lettering and repeated bevel changes that still used the scaled FONT construction.

### KMC KM720 Roswell

1. **Dish and rings:** retained the traced breaks around .59R/.70R/.88R from the local checkpoint, then gave the broad lands a shallow outward rise and a continuous inner dish. The low .20R-cap centre remains a minor feature; the nine slots and concentric stepped face lead the design.
   A smoothed-normal trial made these lands look like inflated tori. Rejected that result: wide lands now use their own physical strip slope, while the narrow groove profiles retain their local rounding. Final quarter/face views show dished lands and thin circular breaks instead of a dome, broad painted stripes or rolled steel-like bubbles.
2. **Finish and hardware:** kept **#55595d** on the face and lip, with a satin response that allows soft light to describe the dish. Compared two live surface responses on identical geometry; the more metallic trial added no useful resemblance, so retained roughness .48, metalness .12, environment 2.8. Added restrained catches on the actual nut bevels while retaining dark seats and five service heads.
   Rejected brightening the pigment or polishing the whole rim. The selected finish stays clearly darker than Method, while rings and nut edges read at normal car size. No shader, light or extra pass was added.
3. **Opening depth check:** ray checks at all nine front-view slot centres reach actual dark hardware, not a face panel: backing about 183 mm behind the mouth or caliper about 21 mm behind. At the 3/4 view, seven centres reach brake/barrel hardware and two far-side centres see a real pocket wall about 7 mm behind the mouth.
   Retained the existing physical slots and dark hardware, rejecting pale fills or empty white catalogue-style holes. The final captures show the chamfer followed by a second depth, with normal far-side wall occlusion.

### Final visual check and limits

Inspected final native 1600×1000 hero and side views and 3× face/quarter close-ups for both rims, plus equal-lip-diameter real/ours pairs. My current subjective assessment is **Method 8/10, KMC 8/10 for die-cast design resemblance**, rather than photographic finish matching; this is not independent owner acceptance. Remaining differences are: Method's simplified glyph/logo outlines, simplified pocket fillets and clean studio finish versus photographic fine texture; KMC's photo-estimated groove cross-sections, hand-built cap/lip marks and intentionally darker anthracite presentation. The reference's six-lug count is an intentional 5×150 adaptation, not a model defect.

The final images show the Method's cupped centre/large cap and alternating cast windows, and KMC's shallow dish/fine concentric steps, at normal car scale as well as close-up. Shanaber remains exactly the owner's accepted version; no additional steel build or asset registration was run.

| Rim | Triangles per rim, local checkpoint → final | Four GLBs bytes, checkpoint → final | Final left / right bytes |
|---|---:|---:|---:|
| Method | 31,456 → 38,702 | 1,474,496 → 1,696,528 | 423,316 / 424,948 |
| KMC | 37,398 → 38,572 | 1,531,648 → 1,581,640 | 395,476 / 395,344 |

Decoded all twelve mounted rim GLBs: finite unit normals, matching triangle counts, unchanged mount/catalogue fields and bounds within .1 mm of the authored bounds. Maximum is 38,702 triangles / 424,948 bytes, below the earlier iPad budget even with the unrestricted modelling permission. Verified five physical nut clusters on the unchanged 150 mm PCD; cap radius matches .235R; front-roll winding is correct. Raw rotor/hat/caliper/backing/brake-detail and tyre-adapter positions remain identical to the starting builds. Shanaber's four GLB hashes and manifest entries, index.html and wheels.json remain unchanged. Restored the steel generator's original nut-bevel branch to avoid any future spillover.

Changed only the rim generator and registration, eight Method/KMC GLBs, their manifest entries and this log. No stored car/stock rim/tyre GLB or source NORMAL/COLOR_0, TARGET/VERIFIED, wheel mounting/size/offset, Three.js 0.166.1, studio light, body lock or per-frame render-pass changes. The previous local checkpoint and this completed revision are pushed together once to full-car-pass after pull --rebase; main is untouched.


## Rims self-check loop — KMC scratch reconstruction (2026-11-05)

Scope: the owner's latest instruction rejects KMC outright and accepts Method and Shanaber. Rebuilt KMC independently in `tools/rims/kmc.py`; the other two rims' eight GLBs and manifest entries remain identical to 02c3810. Read TARGET sections 1–3 and VERIFIED's variant tags first. No TARGET disagreement or edit. My earlier 8/10 KMC assessment did not predict the owner's verdict and is not evidence of acceptance.

Used the attached catalogue front for ring/slot proportions, the five-lug quarter for depth and nut-edge character, and the tagged 5×150 machined quarter for the low cone and recessed seats. The latter judges geometry only: the model retains #55595d. Did not copy six-lug hub geometry or the reference's bright finish. Photos, captures, material trials and equal-diameter pairs stay outside Git.

### Loop 1 — new construction, 6.5/10

Three visible differences: the new flange was too round; service heads looked like grey buttons; the fine circular steps lacked definition. Replaced the previous face rather than editing it: a recessed centre/dish, separate inner and outer section surfaces, and nine explicit mouth/chamfer/throat lofts. These openings are geometry, without a Boolean through the slot band.

The face/quarter comparison showed real dish depth, but the rolled flange still suggested a steel wheel. Rejected that lip and retained the scratch topology. The new section has 144 angular samples, coherent section normals, and a single front flange surface rather than stacked rings.

### Loop 2 — flange and seats, 7.0/10

Three differences: the nut cone still read nearly flat; nuts sat too high; the raised lands remained too weak at normal car scale. Changed the rolled front into a broad, nearly flat KMC flange with a small outer edge roll, added narrow service-seat rims and retained the physical 5×150 through bores.

The screenshots showed a more appropriate flange and clearer service hardware. Rejected a whole-face metallic trial: it made the wheel darker without clarifying its shape. Retained face/lip pigment #55595d and the existing satin base response; added coherent crevice shade at the actual circular folds rather than dark painted bands.

### Loop 3 — stronger section, 7.0/10

Three differences: the outer face crest became too high, partly hiding far-side apertures in quarter view; the broad lands rose too steeply; their catches were still uneven. Tested stronger true risers and a straight-sided low cone, with the cap below the main face and black service heads.

Rejected the excessive 118 mm outer-land crest: it added depth but reduced resemblance. The useful centre correction was retained; the exaggerated land section was reduced in the next loop. This is a partial reversion of the worse result, not a new accepted baseline.

### Loop 4 — selected section and finish, provisional 8.0/10

Three remaining differences: fine groove/chamfer cross-sections are photo estimates; the mesh KMC/WHEELS marks simplify the exact source glyphs; the clean studio response has less fine highlight variation than the photographed finish. These are my visual observations, not independent owner acceptance.

Reduced the crest to 115 mm in section coordinates, retained a recessed 87 mm dish floor and straight low cone, and lowered the black nut heads fully into their pockets on the unchanged 75 mm radius. The cap face is at 101.5 mm, below the broad lands and 119–120 mm lip land; section Z coordinates receive the existing catalogue-width scale. Rejected a large domed centre, protruding grey buttons, a steel-like rolled lip and the over-deep loop-3 step.

Compared same-diameter real/ours pairs, inspected each native 1600×1000 hero/side capture and both 3× wheel close-ups, and also checked an additional quarter capture nearer the reference's camera angle. Final native views show the inner dish, separate circular step edges, black-seated nuts and dark open slots. The selected narrow edge finish keeps the same pigment with roughness .32, metalness .12 and environment 4; pocket walls use the same pigment with environment 3.5. No light, shader or render-pass change.

| KMC state | Triangles per mounted rim | FL / RL bytes each | FR / RR bytes each |
|---|---:|---:|---:|
| 02c3810 rejected starting model | 38,572 | 395,476 | 395,344 |
| Scratch loop 1 | 36,106 | 387,160 | 378,648 |
| Loop 2 | 38,455 | 397,360 | 393,004 |
| Loop 3 | 38,429 | 397,168 | 392,552 |
| Selected loop 4 including final finish | 38,429 | 422,736 | 416,812 |

Validation: all twelve mounted rims decode with finite unit normals and declared triangle counts; no rim exceeds 40k triangles or 700 KB. Decoded bounds match the manifest within .1 mm. All non-KMC manifest entries and the accepted Method/Shanaber asset hashes are unchanged, as are index.html, wheels.json and TARGET. Raw rotor, hat, caliper, backing, brake-detail and rubber-adapter position arrays exactly match the rejected starting build: only the new KMC face, barrel/front-flange construction, seats/cap/nuts and KMC finish changed. Sizes, width/offset catalogue, 462 mm lip, 5×150, stock wheel/tyres, car GLBs and their NORMAL/COLOR_0, Three.js 0.166.1 and body locks remain unchanged.

The final native-rim integration check passed **23/23**: lazy loading, four mounts, source tyre/brake buffer hashes, configured rigid offsets, catalogue fit, repainting, stock restoration, share/reset and no console errors. Python/JavaScript syntax checks and git whitespace checks also pass.

## Task 4 self-check loop — arches and source tyres (2026-11-06)

Read TARGET sections 1–3 and VERIFIED's variant tags. No disagreement with TARGET and no edit to it. The owner's Task 4 instruction authorizes this builder's own captures, measurements and scoring, superseding the older separate-reviewer workflow for this task. Started from `cfb1b93` on `full-car-pass`; main/Pages are outside this task.

Scope: `index.html` arch-liner shading and the four source tyre materials only. Replaced the `.65 × diffuseColor` liner clamp with additive bounced fill varying with existing body-space depth, source normals, baked cavity and distance into the arch. Fine liner grain fades with screen footprint. Tyres change from #383a3c/.88 roughness to #3d3f41/.78, with restrained cavity-dependent diffuse fill and a small catch on existing raised curvature. No invented tread or lettering. The tyre shader explicitly matches only `wheel_FL/FR/RL/RR`: aftermarket rim bead adapters keep their authored defaults and original shader. No shared light, environment, rim material, rim generator, geometry, NORMAL/COLOR_0, camera rule, size, wheelbase, overhang, or render-pass change.

Third-party references were supplied as downloadable files in `task4-references.zip`, extracted to `/workspace/task4-evidence/references`, outside the checkout. Actual real/ours sheets were produced, not judged only by eye in chat. The stock-tyre collage judges tyre appearance and arch depth; its studded flares and rim colour are excluded. The white-car photo judges arch interior only; its aftermarket wheels/tyres, ride height, rack and snorkel are excluded. Style images judge only the finish/detail principles allowed by TARGET. Photos, copies, sheets and captures are not committed.

Each loop captured 1600×1000 hero, side, rear and front/rear wheel close-ups at face-on and quarter angles, plus a 390×844 phone quarter. Captures use the repository's test-only browser server with pinned local Three.js 0.166.1. Corrected viewport/canvas sizing in the external harness and regenerated the phone evidence for every loop; no production camera or layout correction was needed. Final renders were inspected, including equal-scale enlarged reference crops (the source photos are low resolution). Scores below are my honest visual assessment, not owner acceptance.

### Loop 1 — arches 2/10; tyres 6/10 (rejected)

Three largest visible differences: the liner became nearly black; the tyre became too grey and lost its charcoal character; suspension/sidewall relief still did not appear. Removing the flat clamp was necessary, but relying too heavily on the existing deep AO and lateral depth produced an underfilled liner. The .42 tyre fill was excessive. Rejected these light levels rather than presenting the brighter tyre as success.

### Loop 2 — arches 5.5/10; tyres 7/10

Three differences: the front of the liner remained too dark; the inner panel still read as a smooth simple surface rather than a shaped liner with suspension; the tyre's sidewall still lacked the real photo's lettering and fine relief. Reduced tyre fill to .14, retained a soft rubber sheen, and introduced a broad radial recess-to-edge light gradient plus fine liner grain. Shoulder tread became clearer without changing any source triangle. Both liners passed the local contrast gates, but that did not establish the requested structural detail.

### Loop 3 — arches 6.5/10; tyres 7.5/10

Three differences: the stored liner still had little physical structure; its edge catch was subdued; the source sidewall remained smooth despite clearer charcoal shading. Softened the radial falloff so the front recess no longer collapsed to black, filtered grain by screen footprint, and adjusted tyre roughness from .80 to .78. Rejected adding suspension silhouettes or raised sidewall text that are not present in the supplied mesh. The liner retained darkness deeper inside instead of becoming the earlier uniform grey slab.

### Loop 4 — arches 6.5/10; tyres 7.5/10 (selected)

Added a small catch to existing tyre curvature and the liner edge; retained the loop-3 depth gradient. The result improves on the starting flat liner and black lower tyre, but remains below 8/10. Stopped at the authorized four-loop cap, without declaring the full visual goal met.

Three remaining arch differences: (1) no identifiable suspension assembly is visible in the stored source liner; (2) the simple liner surface lacks the reference's moulded internal structure; (3) its edge and grain give less convincing physical relief than the reference. Ray inspection identifies the upper front arch as `unsorted_03:black_12`, a simple backing surface, not a detailed suspension mesh. No fake structure was painted onto it.

Three remaining tyre differences: (1) no sidewall lettering is visible in the stored tyre, and no UV/texture supplies it; (2) the source shoulder has simpler fine relief than the photographed stock tyre; (3) the lower sidewall remains darker than the top, though all measured sector means now pass 42/255. Source size and tread pattern stay unchanged. No claim of source lettering restored.

Local image measurements use display-referred weighted sRGB luma, not CIELAB L*. Fixed close-up semantic masks exclude rim pixels; the tyre mask allows a small RGB tolerance for the unchanged contact overlay. These samples differ from the prompt's earlier harness and must not be treated as identical regions. Final front/rear arch std = 9.08/9.67, p5–p95 span = 25.86/25.86 (gates ≥8 and ≥20). Front tyre sector means top/bottom/left/right = 68.07/53.23/59.32/57.19; rear = 68.13/53.08/59.31/57.24. Darkest 5% of the bottom sector is about 29.93: means pass; a universal per-pixel 42 floor is not claimed.

Final evidence is retained outside Git at `/workspace/task4-evidence/loop4`: `front-real-ours.png`, `rear-real-ours.png` (arch-only real reference), `rear-stock-tyre-real-ours.png`, `hero.png`, `side.png`, `rear.png`, four wheel close-ups, `phone.png`, metrics and rim-pixel comparisons. All stored asset and TARGET hashes match the starting revision. Eroded rim regions in all four close-ups are pixel-identical to baseline (90,986 / 96,914 / 89,903 / 93,597 pixels, zero channel delta). No extra per-frame pass or geometry is introduced. Software Chromium captures do not certify physical iPad performance.

Validation: the required `tests/visual.mjs --checks-only` run completes all functional checks with zero browser errors; camera fitting/safety, paint controls, Clean view, Reset, baked coverage, build-state transforms, hashes, scale/overhang and fallback checks pass. The suite exits 1 solely on `toyMaterials`, which still asserts historical paint .30/.65/.18, dark glass #46545f/.80 opacity and chrome .18 roughness. Repeating the same suite against the untouched `cfb1b93` index produces exactly the same single failure and exactly the same paint/glass/chrome observations as the final index. Those locked Task 1–3 materials and the test are not changed to make the assertion pass. Native rim integration passes 23/23, including all three aftermarket sets, source tyre/brake buffer preservation, configured offsets, stock restoration, sharing and Reset. JavaScript syntax and Git whitespace checks pass.

## Task 4 round 2: new detail (2026-11-07)

Started from a09467e on full-car-pass, after reading TARGET first (including the 2026-11-06 exception) and VERIFIED's variant tags. No disagreement with TARGET; it is unchanged. The owner's self-check instruction governs this task. No change to main/Pages. Scores below are the builder's judgement, not owner acceptance.

New code in wheels/arch-detail.js builds simplified double wishbones, coil-over/damper, steering link and CV bellows at the front; a rear axle tube/differential, coils, separate dampers and four trailing links at the rear. Shallow moulded ribs supplement the source liner. Body-side endpoints and ribs follow body lift; hub/axle endpoints follow wheel rise; connecting rods and coils are reconstructed only when build dimensions/visibility change. Three merged material meshes, dark matte metal/rubber, no new per-frame pass. Hidden interior detail is deliberately not brought out in front of the tyre or brake to make it more conspicuous.

The stock tyre material alone samples a new unbranded relief map: 265/70R17, illustrative 112S / M+S, TUBELESS RADIAL, STEEL BELTED and three fine bead-side rings. This is visual model detail, not a certification of a particular manufacturer's tyre. Mapping uses existing world-space positions; fragment normal perturbation simulates raised rubber without modifying stored NORMAL, COLOR_0, POSITION or UV buffers. Charcoal pigment and the Task 4 round-1 rubber response remain. Opposite side text faces outward. No tyre size, tread or shoulder change.

References and all render evidence are outside Git at /workspace/task4-references and /workspace/task4-r2. The stock-wheel collage judges tyre sidewall and arch depth, excluding aftermarket flares and rim colour. The white-car photo judges arch interior only, excluding its aftermarket wheels/tyres, ride height, rack and snorkel. Style references judge only TARGET's finish/detail principles. Same-size comparison sheets enlarge the low-resolution references; their pixels cannot establish the real suspension's precise dimensions.

Each of four loops captured 1600×1000 hero, side, rear, top, front/rear 3× wheels face-on and quarter, stock and maximum-lift (76 mm) hero, plus a 390×844 phone quarter. Earlier phone evidence exposed a harness aspect/framing error; the final phone was recaptured with explicit portrait aspect and framing, without modifying production cameras. A frozen 286e3dc baseline has the same views. All captures use pinned Three.js 0.166.1 and software Chromium, not physical iPad performance.

### Loop 1 — arches 6.5/10, tyres 7.8/10

Added the first complete suspension geometry, cross-depth ribs, a circular liner return and the relief texture. Three arch differences: the source backing hid most of each spring; the circular return read like a hose rather than moulded plastic; the cross-depth ribs read as dark sticks. Three tyre differences: thin glyphs had speckled edges; fine bead rings were grainy at 3×; source shoulder microdetail remained simpler than the reference. Rejected the hose-like return and hidden spring placement.

### Loop 2 — arches 7.6/10, tyres 7.8/10

Removed the circular return, replaced cylindrical ribs with shallow rectangular moulded sections, and moved the springs ahead of the source backing while staying inboard of the source tyre. Three arch differences: rib ends looked like small dots face-on; source liner remained a very simple continuous shell; spring/frame attachment needed clearer seating. Three tyre differences: size was readable but still thin; small markings were grainy; inherited shoulder relief remained simplified. The springs now read at 3× while staying quiet at normal car scale.

### Loop 3 — arches 7.7/10, tyres 8.0/10

Broadened rib ends radially; regenerated heavier glyphs with a small filtered edge, reducing relief from .8 to .65 mm. Three arch differences: rib ends caught too much light; the spring seats/frame connections were under-specified; the inherited backing was still smoother than the photographed liner. Three tyre differences: no manufacturer's characteristic sidewall wordmark (intentionally unbranded); fewer tiny mould/tool marks; source shoulder's finer relief remains simpler. Rejected the over-bright rib tabs. Kept the filtered relief, rather than brightening the rubber or printing contrasting letters.

### Loop 4 — arches 7.5/10, tyres 8.0/10 (selected)

Darkened and narrowed the rib ends, added explicit upper frame connections and rear spring pedestals, and connected the front damper foot to the lower arm. Retained all tyre settings from loop 3. Three remaining arch differences: the new ribs are blockier and more regular than the real moulded liner; the original backing still reads as a simple continuous shell; suspension castings and mounts are simplified, with most arms/axle/CV detail hidden behind the unchanged wheel/brake at stock height. Three remaining tyre differences: deliberately no brand wordmark; fewer very small manufacturing marks; source shoulder microdetail is simpler. The tyres meet my 8/10 threshold; arches remain below it. Stopped at the four-loop cap without claiming the full visual goal met. Compared against 286e3dc: additional close-up structure/relief, without a brighter tyre, altered rim or distracting hero-scale hardware.

Final added geometry: **6,888 triangles total**, three merged draws; no new render pass or animation-loop work. New map: **1024×1024 grayscale PNG, 22,320 bytes**, generated by tools/full-car-pass/make-sidewall.py (Pillow / DejaVu Sans Condensed Bold). No other texture added.

Clearance check: all 20 combinations of 0/25/50/63/76 mm lift with stock/steel/KMC/Method rim offsets have finite new vertices and zero vertices inside the conservative stored-stock-tyre annulus. This is a vertex/envelope check, not a full collision solver; the physical endpoint construction and inspected stock/maximum-lift renders complement it. Stock is the only built tyre option; unavailable catalogue tyres remain unavailable. All car/rim GLBs, source NORMAL/COLOR_0, rim materials/generators/catalogue, TARGET and earlier finish code remain unchanged. The new detail does not add a workshop-selectable exterior part.

Validation: Final-code tools/workshop/smoke.mjs passes **65/65**, desktop and phone, with no page errors. Final-code tools/rims/check-workshop.mjs passes **23/23**, including source tyre/brake buffer hashes, all rim offsets, paint survival, stock restoration, share and Reset, with zero console errors. All final capture metadata has zero browser errors. New module JavaScript syntax, generator Python compilation and git diff --check pass. Existing car/rim asset paths and TARGET have no diff against a09467e. No physical iPad performance claim; the historical full visual-material suite was not used as acceptance for this task. Final evidence: /workspace/task4-r2/work/loop4 (all views, front-real-ours.png, rear-real-ours.png, rear-arch-only-real-ours.png); final4-smoke.log, final4-rims.json and clearance.json remain outside Git.
