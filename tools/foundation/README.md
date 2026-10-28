# Stored-geometry parts pipeline

This pipeline never exports Blender's temporary vertex coordinates. Blender **4.3.2** identifies welded loose-piece topology for classification only; export selects original triangle index lists and copies original POSITION, NORMAL and COLOR_0 values. Source encoding transforms are preserved. Compacting removes only unreferenced vertices in each selected subset; retained coordinate values are unchanged.

## Reproduce

Use Python 3 + NumPy, Blender 4.3+, Node.js20+, glTF-Transform core/extensions4.5.1, meshoptimizer1.3.0, and the exact locally extracted Three.js0.166.1 package. Work files stay outside the repository.

```sh
git show 828dd87:index.html > /tmp/lc200-stored.html
python tools/foundation/extract_assets.py /tmp/lc200-stored.html --output /tmp/lc200-foundation/source
blender -b -t 4 --python tools/foundation/segment_blender.py -- /tmp/lc200-foundation/source /tmp/lc200-foundation/inventory
python tools/foundation/classify_parts.py /tmp/lc200-foundation/inventory
python tools/foundation/export_parts.py /tmp/lc200-foundation/source /tmp/lc200-foundation/inventory /tmp/lc200-foundation/uncompressed docs/foundation
cp /tmp/lc200-foundation/source/display-base.glb /tmp/lc200-foundation/uncompressed/display-base.glb
node tools/foundation/compress_meshopt.mjs /tmp/lc200-foundation/uncompressed model docs/foundation/compression.json /tmp/lc200-deps
blender -b -t 4 --python tools/foundation/render_parts.py -- --manifest model/manifest.json --uncompressed /tmp/lc200-foundation/uncompressed --output docs/foundation/parts
python tools/foundation/contact_sheet.py --manifest model/manifest.json --thumbnails docs/foundation/parts --output docs/foundation
python tools/foundation/audit_scale.py --source /tmp/lc200-foundation/source --output docs/foundation/scale-audit.json --segmentation docs/foundation/segmentation.json --compression docs/foundation/compression.json
```

The dependency directory passed to `compress_meshopt.mjs` contains npm dependencies in `node_modules/` and the npm-packed Three.js0.166.1 in `package/`. See the existing visual harness for local npm-pack setup. The Meshopt writer uses encoding format0 and NONE filters; it intentionally does **not** call the glTF-Transform `meshopt()` convenience transform, because that transform also requantizes geometry. The `EXTMeshoptCompression` writer alone provides lossless compression of the existing codes. Output is decoded with both the installed decoder and the **pinned Three.js0.166.1 decoder**, comparing decoded bytes. POSITION/NORMAL/COLOR_0 values, triangle topology (allowing cyclic index rotation) and node TRS values must match exactly.

## Rear overhang correction (28 October 2026)

This is the one approved geometry edit after delivery. It un-stretches the body behind the rear axle to a 1.200 m rear overhang, then re-encodes only the changed files with the same lossless writer. Wheel parts and every vertex at or ahead of x = 1.215 keep their original codes; COLOR_0 is not touched. [Record](../../docs/rear-overhang/README.md).

```sh
node tools/foundation/unstretch_rear.mjs model /tmp/lc200-rear/raw docs/foundation/rear-unstretch.json /tmp/lc200-deps 1.200
node tools/foundation/compress_meshopt.mjs /tmp/lc200-rear/raw /tmp/lc200-rear/model /tmp/lc200-rear/compression.json /tmp/lc200-deps
# copy back only the 14 GLBs the report lists with reencodedVertices > 0, plus manifest.json
```

## Coordinates, pivots and classification

Metres: front negative X, up positive Y, left positive Z. Each GLB has one root whose name equals its part ID. A root translation sets the pivot; its `stored_frame` child counter-translates by the same amount before the original nodes. This cancels to identity at the default pose while preserving authored node transforms. Wheels use the specified hub pivots: front X−1.635/rear X+1.215, Y0.3965, left/right Z±0.825(front)/±0.8225(rear). Other pivots use group-bbox centres (body shell uses origin); those centres are **not verified hinge or mounting locations**.

Material names are retained, with canonical `material.extras.zone` metadata. Fixed cabin, windshield, quarter glazing, roof/shell pieces, weatherstrips and mud flaps live in `base.glb` under `body_shell`. Bonnet, doors, tailgate, bumpers, grille, lamp assemblies, exterior mirrors, roof rails, spoiler, side steps and wheels are separate swappable files. The existing stored garnish is retained unchanged with the tailgate. Display base is separate from the vehicle and is not part of its bbox.

Ten ambiguous loose pieces are delivered as `unsorted_01`…`unsorted_10`, each with its own thumbnail, source component IDs and explanation. Review moved four whole connected pieces out of the initial broad grille/spoiler/rail envelopes: two black front backing/upper strips and two red roof-level pieces with unverified attachment roles. The initial six unsorted IDs remain stable. No arbitrary triangle cuts were used to invent detachable arch flares or a chassis: flare surfaces are integrated into larger body panels; connected black underside geometry cannot be reliably isolated as frame/axles. Those two manifest slots have `default:null` and reasons.

`docs/foundation/segmentation.json` records exact once-only source-triangle coverage, copied-code verification and world-coordinate deviation; `compression.json` records lossless roundtrip checks, pinned decoder identity and byte counts. Review thumbnails use neutral material-zone colours rather than treating baked AO/curvature as RGB paint. They are actual Blender renders for part identification, not additional asset shading or geometry changes.
