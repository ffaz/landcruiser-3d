# TARGET: the one source of truth for the LC200 look

Read this before any change, prompt or review. If a target or fix can't be traced to a line here, it doesn't happen; ask the owner, then add the answer here first.
**Precedence:** owner decisions (section 3) win over everything. For design facts, the verified reference notes win over any style image.
Owner: ZIRODESIGN (author of the source model). Last updated 2026-11-05.

## 1. The look: a die-cast collectible model

Very detailed, and clearly a 3D model. NOT a photo of a real car. The look must hold for the base car AND every paint swatch. Judge every change by these:

- **Light:** one dominant large soft key from the upper front-side, plus gentle fill (Cream studio). The car shows clear light-to-shade modelling: top surfaces bright, the shaded side and lower body visibly darker. Not flat; no harsh hot spots; no dark mirror regions.
- **Paint:** satin, with broad, gentle highlights on top surfaces (bonnet, roof, shoulder) and a smooth falloff to the lower body. No sharp streaks, ripples or blobby bands. Rich, clean colour. White must read white, not cream or grey, and the shaded side is visibly darker than the lit side.
- **Glass:** model glass, neutral clear with a faint cool tint and a soft pale-sky reflection.
  - Windscreen and front doors are clear, with the seats and steering wheel plainly readable.
  - Rear doors, quarters and tailgate are factory privacy glass: visibly darker, but the rear seats and headrests are still discernible.
  - Never black, never an opaque slab, no dominant reflection.
  - Workshop tints darken it step by step, each step visibly darker.
- **Chrome and metal:** satin silver, not mirror. Soft light-to-dark shading shows the shape, with small bright accents on edges and lamp rims. Mid-to-light silver, never flat grey.
- **Panel lines:** neutral dark (never brown), continuous and even, 1–2 px at the 1600 px side view, following the source curve. Not outlines; not thicker; not wobbly.
- **Badges and lettering:** raised, crisp and legible chrome or silver, with enough edge definition and contrast to read on white paint.
- **Lamps:** clear lenses with readable inner detail: reflectors, projectors, and amber bulbs that read as amber lamps (not metal nuts).
- **Tyres:** dark charcoal rubber, never pure black. Tread blocks and sidewall detail are clearly readable at the 3× close-up. Tyre size and pattern stay as the source; no invented off-road lugs.
- **Wheel arches:** a dark textured liner, with the suspension and inner structure visible and shaded. Never a flat slab or an empty void.
- **Ground:** a soft-edged but clearly directional cast shadow, plus a darker, tight contact shadow under each tyre, so the car sits down. Never a diffuse blob or floating halo.
- **Depth and edges:** visible occlusion darkening in crevices (grille, arches, under the bumper, door shuts), and thin soft highlights catching panel edges, creases and the tops of the roof, bonnet and wings. This is what makes it read as a 3D model.
- **Colour:** clean, slightly rich colour, with clear contrast between materials (paint, chrome, black trim, glass, rubber). No grey or washed-out cast over the whole car.
- **Wear:** none. The base car is a clean showroom model, with no dirt, chips, stickers, rust or dust.
- **Background:** the Cream studio seamless backdrop: no horizon line, no props.
- **Detail:** every small part crisp and legible at the 3× close-up and on phone.

The style references are third-party images held on the owner's PC, never committed: an orange stylized overland truck and a beige Land Rover Series die-cast render.
- **Take from them ONLY:** the finish simplification, see-through glass, satin paint and metal, edge highlights, crisp small details, a grounded shadow.
- **Do NOT take:** their hard sun, dirt ground, weathering, stickers, exaggerated proportions or chunky tyres.
If the owner supplies renders of the source model in this look, they go in `docs/target/` and become the visual master.

## 2. Design truth

- **The ZIRODESIGN source model is perfect.** Its shapes and design are final: body, panel lines, headlamps (chrome housings), grille, tail-lamp LED dots, roof ribs and rails (as in the source; never invent ribs a view of the source doesn't show), mirrors (body-colour cap, black base, clear repeater), handles, chrome lower-door strip, headlamp-washer covers, and the 10-spoke stock rim. The one exception is the tail-lamp lower lens: see section 3.
- We fix how the web viewer RENDERS the source. We never redesign it.
- Real-car photos (2016–21 GCC LC200 GXR) are used only for design facts: which parts exist, their shapes and colours. They are never a finish target.
- **Locked:**
  - body 5,000 L × 2,297 W (incl. mirrors) × 1,930 H mm;
  - wheelbase 2.850 m (wheel centres x −1.635 / +1.215);
  - front overhang 0.95 m;
  - the approved un-stretched rear overhang.
  Stored car GLBs, NORMAL and COLOR_0 are not edited, except to restore a part the export lost.

## 3. Owner decisions (add new ones here)

| Date | Decision |
|---|---|
| 2026-11-03 | The base car is a white 2016–21 GCC GXR. Badge text and colour follow the real GXR, not the source's bronze VX.R render. |
| 2026-11-03 | Tail lamp: the NORMAL OEM lamp, with a clear lower lens over a chrome reflector, amber indicator bulbs and a clear reverse lamp. Not the source's smoked version; this is the one exception to source-is-truth. |
| 2026-11-03 | Tail-lamp LED dots are kept (source), rendered as red LEDs behind red glass. |
| 2026-11-03 | The stock rim keeps its dark-grey colour (the real GXR rim is silver; owner's call). |
| 2026-11-03 | The rear plate recess stays empty for now. |
| 2026-11-03 | Cream is the only studio. |
| 2026-11-03 | Logos and wording are allowed. |
| 2026-11-03 | All rims are 5-stud (5×150), always 5 nuts. |
| 2026-11-03 | KMC KM720 Roswell: 9 chamfered-pocket slots (real openings), 40° apart, one at 12 o'clock, valve at 6 between two slots. Raised concentric steps (lip, slot band, mid ring, hub). Small tone-on-tone KMC WHEELS cap inside the lug circle, with 5 dark-seated nuts. Matte anthracite face AND lip (lip not bright), small KMC lettering at 12 o'clock on the lip. |
| 2026-11-03 | Method MR705: 10 real openings (a shaded pocket wall, then the brake or barrel visible behind) matching the official photo's shapes and proportions (top and bottom windows are not wider than the rest). Dark recessed lug area with 5 black nuts and a black cap, cap text cast or tone-on-tone. METHOD cast in the face colour, fully on the solid face. Thick rounded matte titanium lip. |
| 2026-11-03 | Shanaber (Gulf Toyota steel wheel): open centre, no cap, hub and 5 nuts visible as metal. 16 evenly spaced PLAIN pressed holes (no raised flanges), symmetric about the vertical axis, with the valve between two holes at 6. Satin silver-grey paint with a soft broad sheen. Broad rolled lip. |
| 2026-11-05 | The overall look is a die-cast collectible model (section 1), not photoreal. |
| 2026-11-05 | Workshop tint_5 (limo tint) may go very dark: the interior does NOT need to show through it. |
| 2026-11-05 | KMC stays DARK anthracite (#55595d face and lip). Its slots, steps and cast lettering must read through light (lit walls, edge highlights, relief), not by lightening the colour. |

Out of scope for the base car: mud, decals and accessories. Those are workshop mods. The overland build (muddy white, #92) belongs to the workshop.

## 4. How work is done

- Every push appends a short entry to `docs/full-car-pass/DECISIONS.md`. Per item: what changed (before → after), why that route, what was rejected, what the artist's own screenshots showed.
- The artist looks at a few screenshots of their own work before pushing. A separate independent reviewer does the measuring, testing and scoring against this file.
- **Reviewer views:** hero 3/4, side, rear, top, the 3× close-ups and phone. A change is accepted only if it holds at all of them.
- three.js 0.166.1, no post-processing, no new per-frame render passes. It must stay fast on iPad.
- Push to working branches only. main/Pages only when the owner says so.
