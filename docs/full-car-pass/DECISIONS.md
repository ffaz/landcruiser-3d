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
