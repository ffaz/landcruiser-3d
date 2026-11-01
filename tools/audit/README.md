# Close-up audit

Renders three checkouts of the viewer from the same 76 fixed camera poses and builds a review sheet per pose.
It exists because a thick brown band on the bonnet edge survived four finish rounds: every round was compared
with the previous one at full-car size, never with the original model up close or on a phone.

- `shots.mjs` — the poses: 12-step orbit, 4 high views, top, ~40 close-ups (lamps, edges, handles, gaps, roof,
  sills), black-paint close-ups, Slate and Clay orbits, phone portrait (390×844 at 3×). Cameras use a fixed box from
  the original build, so every version is framed identically even if parts are added or removed.
- `capture.mjs` — serves one checkout with three.js 0.166.1 from DEPS, hides the UI, sets each camera exactly and
  saves `<shot>.png` plus `capture.json` (console errors included). Never edits the checkout.
- `sheet.mjs` — per shot: row 1 ORIGINAL | LIVE | CANDIDATE; row 2 the same with outlined blocks where fine detail
  changed (red original→live, blue live→candidate, green original→candidate). Detail is luminance minus its local
  mean, so lighting changes cancel and new lines, bands and edges stand out. Writes `changes.json`.

## Run

```
git worktree add --detach /tmp/lc-orig f553e19      # original, before the finish rounds
git worktree add --detach /tmp/lc-live origin/main  # what the public site shows
node tools/audit/capture.mjs DEPS CHROME /tmp/lc-orig  AUDIT/orig
node tools/audit/capture.mjs DEPS CHROME /tmp/lc-live  AUDIT/live
node tools/audit/capture.mjs DEPS CHROME .             AUDIT/candidate
node tools/audit/sheet.mjs DEPS AUDIT
```

The three captures can run in parallel (separate servers on random ports). Each takes a few minutes on SwiftShader.
Optional 5th argument to `capture.mjs` filters shots by name (e.g. `bonnet`).

## Reading the sheets

Boxes say only that something changed. Intended changes (chrome, lamps, badges) box too; judge by eye. A defect of
the bonnet kind shows as a new trail of red/green boxes along an edge that was a hairline in the original.
