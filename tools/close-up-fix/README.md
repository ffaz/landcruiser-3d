# Close-up finish tools

These scripts do not modify any original GLB. Run from the repository root.
`DEPS` contains `@gltf-transform/core`, `@gltf-transform/extensions` and `meshoptimizer`.

- `node tools/close-up-fix/hide-source-plate.mjs REPO DEPS` creates a new bumper variant. The 79 triangles of the loose source plate get an invisible material. Every attribute and the triangle union are preserved.
- `node tools/close-up-fix/create-plate.mjs REPO DEPS` creates the separate rounded blank plate and frame, and registers it in the manifest/build.
- `node tools/close-up-fix/verify-assets.mjs REPO DEPS OUTPUT.json` checks all 54 pre-existing GLBs against `f22ca37`, and compares every attribute, world transform and triangle of the bumper variant to its source.
- Run the unmodified `tools/audit` tools as documented in their README.
- `python tools/close-up-fix/report.py AUDIT_DIR OUTPUT_DIR` copies all 76 sheets and exports full-resolution comparisons, image hashes, capture logs, explicit gate masks and pixel measurements. Requires `numpy` and `Pillow`.

The report does not lower the audit's threshold. A strict zero-green result is reported separately from visual judgement. `changes.json` always contains the unmodified tool's whole-shot totals. Crops retain native pixel resolution; no registration, rescaling or retouching is applied.
