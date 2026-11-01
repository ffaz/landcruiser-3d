# Design A — first tyre review

**One design only:** 285/70R17 all-round expedition tyre and dark steel-style wheel, based on option A in the user's board. B–F are not modelled. Four hub-position GLBs are mounted copies of this same design, necessary to preview it on the car; they are not four different tyre designs.

[Tyre 3/4](tyre-A-quarter.png) · [Wheel face](tyre-A-front.png) · [Tread](tyre-A-tread.png) · [On-car 3/4](car-A-quarter.png) · [On-car Side](car-A-side.png) · [On-car Front](car-A-front.png). All are actual 1440×1000 Three.js renders of the GLBs, not generated concept images.

Clean die-cast treatment: rounded casing, moulded sidewall rings and shoulder shields, four staggered tread rows with chamfered blocks, dark satin pressed-steel wheel, actual ventilation holes, six lug nuts, restrained perimeter fasteners and brake backing. No tyre branding, mud, wear, extra props or lift.

The 285/70R17 size computes to **830.8 mm / 32.71″**; “33″” is approximate. The exported geometry measures **830.790 mm maximum radial diameter**, **285.000 mm maximum section width**. The 17″ number is the bead-seat diameter; the visible rim flange is larger. This is a designed workshop asset, not a dimensionally certified commercial tyre replica.

Created in **Blender 4.3.2**, with a real **Cycles AO bake to vertex colour**, 24 samples. R stores AO, G stores signed edge-angle curvature (.5 flat), B is reserved. No runtime AO pass. The original car's stored geometry, normals and COLOR_0 are untouched.

Each wheel is **14,900 triangles**, within the 15k part budget, Meshopt compressed. Its root is at the existing hub pivot and scale is 1.0. The existing workshop tyre-radius logic raises the hubs/body by **18.9 mm**, keeping the unlifted tyre on the floor within the measured mesh sampling tolerance. The default build remains stock; choose **A · 33″ expedition AT** in Wheels & tyres to preview it.

The static straight-ahead workshop fit check gives **42 mm front / 75 mm rear** clearance at zero suspension lift. This does not establish steering-lock or suspension-travel clearance on a real car.

## Validation

[Asset verification](verification.json) · [Fit and state](fit.json) · [Encoded sizes](asset-report.json) · [Viewer suite](visual-checks.json) · [Workshop smoke](workshop.log).

- 31/31 visual checks, including overhangLock; zero console errors.
- 31/31 workshop checks. [Actual option-button proof](ui-proof.json) confirms A can be selected and the other unbuilt tyres remain disabled. The disabled-option test now derives missing parts from the catalogue: A is available, the other unbuilt tyres remain disabled.
- All 54 pre-existing GLBs are byte-identical. Four additive A wheel GLBs only.
- New part-scoped material defaults select the black wheel finish without changing the stock alloys or other accepted materials.
- Dimension/camera-bound calculations now ignore hidden catalogue variants. The old all-object bounds included the larger hidden tyres and incorrectly changed the stock measurements. The visual test measures visible meshes too, with its original dimension/overhang limits retained.
- Three remains pinned to 0.166.1. No new effects, maps, screen passes or shadow maps. No physical iPad performance claim.

The standalone tyre is posed on the same studio background/environment and existing contact shadow plane; its capture camera uses a close-up near plane. On-car previews use the real viewer and zero lift. The review branch is based on car-polish; Main/Pages are not updated.

## Reproduce

From the repository, with Blender 4.3.2 and the previous visual-test dependencies installed:

```sh
blender -b -t 4 --python tools/tyre-a/model.py -- /path/to/work
node tools/tyre-a/register.mjs "$PWD" /path/to/deps /path/to/work
node tools/tyre-a/verify.mjs "$PWD" /path/to/deps /path/to/work
```

The editable [Blender source](../../model/source/tyre-a.blend) is included. The generator also writes source and bake data into WORKDIR. The review driver reuses `tools/base-finish/round4b/review-server.mjs` with `LC_TYRE_WORKDIR` set to WORKDIR. No baseline GLB is rewritten. No other tyre design has been started.
