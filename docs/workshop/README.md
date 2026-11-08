# Workshop

The Workshop button opens a panel for building a modified version of the car. The base car is never edited. A build is data: which part sits in which slot, plus tyre, rim, lift, lamps and paint. It can be shared as a `#build=` link.

## What works now

- **Panel:** a left side panel on wide screens and a bottom sheet on phones. It has a Parts list, eleven categories, a Base car / My build switch, a build sheet, a share link and Reset to base. The camera refits the car into the space left beside the panel. Clean view and Escape hide the panel.
- **Stance:** stock, 1", 2", 2.5" and 3" lifts. Each is a rigid body lift; wheels and every stored mesh stay unchanged.
- **Tyres and rims:** two separate sections; any tyre goes with any rim, as long as it really fits an LC200.
  - The catalogue is `model/wheels.json`: seven 17″ tyre sizes (stock 265/70R17 up to 37×12.50R17) and four rims (stock GXR 17×7.5 ET+60, black steel 17×8 ET+25, KMC KM720 Roswell 17×8.5 ET+18, Method MR705 17×8.5 ET0), each with its real specs.
  - Hard rules, from `wheels/fit.js`: the rim must be 5×150 with at least a 110.1 mm centre bore, 17″ or larger to clear the brakes, the tyre's rim diameter, and inside the tyre's approved rim-width range. Anything that breaks one is greyed out with the reason ("Needs an 8.5–11″ wide rim; Stock GXR alloy is 7.5″"). Change the rim to unlock bigger tyres, or the tyre to unlock other rims.
  - Fit-check notes on top of arch clearance: how far the tyre sticks out past the arch lip (from the rim offset, measured lip position front 166 mm / rear 161 mm outboard of the stock tyre centre), and how far its inner edge sits in from the hub face (over 206 mm may touch the upper control arm, over 214 mm hits it).
  - Five approved tyre options and three approved rims are available independently: expedition AT in 285/70R17, 265/75R17, 285/65R17 and 265/70R17; ribbed highway in 265/70R17; Method MR705, Shanaber steel and KMC KM720 rims. Stock tyres and alloys remain selectable. KMC is approved and available; other future tyre sizes remain **soon**. [Asset provenance and integration](approved-wheels.md).
- **Lighting:** tail lamps on or off, using the lit state reserved in round 4b.
- **Parts (tap the car):** with the workshop open, tap any outside part of the car to open its page; the part lights up blue, and on desktop the part under the mouse lights up faintly. Tapping empty space goes back to the Parts list. The cabin interior is never offered (glass in front of it opens Windows).
  - The parts are listed in `pieces` in `tools/workshop/workshop-base.json`: body paint, windows, body trim, bonnet, front bumper, grille, badges, headlamps, mirrors, each door, window chrome, roof rails, side steps, tailgate, rear bumper, tail lamps, tyres and rims. Every outside surface of the stored car belongs to one (the smoke test checks this).
  - Finishes per surface: painted panels gloss or matte black; chrome trim gloss black, matte black or body colour; black trim gloss black or body colour; window tint 35 / 15 / 5 %; smoked lenses. Badges, roof rails and side steps can be taken off. Parts with an upgrade category (front bumper, roof, sides, rear, lighting, tyres, rims) show those options on their page too.
  - State: `finish` maps `"slot:zone"` to a finish id (validated in the viewer); removed parts go in `hidden`. Both are in the share link and the build sheet. Finishes are material variants: stored meshes, normals and baked COLOR_0 are untouched, and highlights are see-through overlays sharing each mesh's geometry.
- **Studio:** Cream is the only studio. Slate and Clay were removed on 3 November 2026; Cream renders are pixel-identical to before on desktop.
- **Tyre logic:**
  - The chosen tyre's diameter comes from `model/wheels.json`; a wheel part may also declare `tyre_mm` in the manifest.
  - The hubs then rise by half the difference from the stock 793 mm, and the body rides on top: hub rise plus lift.
  - The tyre therefore always meets the ground, and nothing is scaled.
- **Fit check:** live in the panel. It covers:
  - Tyre-to-arch clearance for the current tyre and lift.
  - For every installed part, whether it sits on its mount and inside that mount's envelope.

  Arch clearance status:

  | Status | Clearance |
  | --- | --- |
  | Green | ≥ 25 mm |
  | Amber, liner trim likely | 10–25 mm |
  | Red, the tyre hits the arch | < 10 mm |

- **Build sheet:**
  - Live dimensions measured from the displayed parts: length, height, width, lowest body point and tyre size.
  - The base numbers are computed from the stored bounds: 5,000 × 1,930 × 2,297 mm, lowest point 236 mm.

Options whose 3D parts do not exist yet are listed and marked **soon**. Each option switches on automatically once its part ids appear in `model/manifest.json`; no code change is needed. The waiting options are:
- bull bar and winch;
- snorkel;
- rock sliders;
- roof rack with load-out;
- rear carrier;
- weathering;
- the 92 livery.

## Data: `model/workshop.json`

Generated by `tools/workshop/build_workshop_json.mjs` from `tools/workshop/workshop-base.json` plus the measured arches.

- **`categories`:** each option has one of:
  - a state `patch`, for example `{"lift_mm": 63}`;
  - a list of required part ids (`requires`). Choosing the option puts each part in its own slot. Choosing the category's stock option returns those slots to their manifest defaults.
- **`mounts`:** eleven attachment points with a position, a parent slot, an allowed envelope and a `basis` line saying how each was derived:
  - `front_bar`, `winch`, `snorkel_R`, `roof`, `light_bar`;
  - `slider_L/R`, `rear_carrier`;
  - `decal_door_L/R`, `decal_bonnet`.

  They come from the stored part bounds and are estimates until the first real part is fitted to each one.
- **`arches`:** hub-relative profiles of the front and rear wheel arches. `tools/workshop/measure_arches.mjs` measures them by casting rays from each hub over 10°–170° across the tyre width against every non-wheel part.

  | Arch | Stock 793 mm tyre | 35″ (889 mm), no lift | 35″ (889 mm), 3″ lift |
  | --- | --- | --- | --- |
  | Front | 60 mm | 12 mm, amber | 32 mm, green |
  | Rear | 94 mm | 46 mm | |

  This matches real LC200 practice: a 35″ tyre needs a lift and usually liner trimming. The check is static (ride height, straight ahead). It does not model suspension travel or steering lock.

## Adding a part (for GPT / Codex)

1. Model the part as one GLB with a single root node named after the part id.
   - Metres, same frame as the car.
   - Root translation exactly at the mount's `pos`.
   - Materials named after existing zones: `black`, `chrome`, `paint`, `rim`, `tyre`, `glass`, `lamp_red`, `lamp_clear`, `lamp_orange`, `mirror`, `interior`, `brake`.
   - NORMAL and COLOR_0 (R = baked AO, G = curvature) on every primitive.
   - At most 15k triangles.
2. Run the checker:
   `node tools/workshop/validate_part.mjs model/parts/<id>.glb --mount <mount> --deps <deps>`.
   It prints a report and the manifest entry to add. Exit code 0 means pass.
3. Add the entry to `model/manifest.json` with `"mount": "<mount>"`, plus a slot with `default: null`.
   - Parts that replace a stock part also list `bundlesSlots`. For example, sliders hide `side_step_L`.
   - Wheel variants use the wheel slots and declare `tyre_mm`.
4. The option appears in the workshop automatically. The live fit check confirms the part is on its mount.

## Tests

- `node tools/workshop/smoke.mjs <deps> <chrome> [shots]`: 31 checks on desktop and phone sizes.
  - Logic: clearance, lift, dimensions.
  - Panel: open, categories, lift, disabled options, compare, build sheet, share, reset, Escape.
  - Parts: a real tap on the car opens the right part and highlights it; a finish applies; badges come off; every outside surface belongs to a part; interior never; share and reset carry finishes and removed parts.
  - No page errors.
- `node tools/workshop/validate_selftest.mjs <deps> <tmp>`: the checker must pass a correctly mounted test box and fail one that is 5 cm off its mount with an unknown material.
- `node tests/visual.mjs`: unchanged. The panel is closed by default, so the studio views only gain the Workshop button in the top bar.
