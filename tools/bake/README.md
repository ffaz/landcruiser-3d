# Offline LC200 vertex shading

The accepted bake uses **Blender 4.3.2**, Cycles CPU, **32 samples**, a **0.35 m AO distance**, seed 20261027 and vertex-colour bake target `VERTEX_COLORS`. The source cabin and a ground plane occlude opaque parts. Glass/lenses/mirrors are excluded as occluders and receive neutral data. This is actual Cycles AO; no screen-space AO or runtime curvature pass is involved.

Use Blender 4.3+, Python 3 with NumPy, and the source commit **before** baked data was embedded. The scripts do not edit `index.html`.

```sh
# a8788fb is the camera-limits commit, before the first baked asset.
git show a8788fb:index.html > /tmp/lc200-source.html
python tools/bake/extract.py /tmp/lc200-source.html --output /tmp/lc200-bake
blender -b -t 4 --python tools/bake/bake_vertex.py -- /tmp/lc200-bake --samples 32 --distance .35
python tools/bake/pack_colors.py /tmp/lc200-bake
python tools/bake/verify_assets.py /tmp/lc200-bake
```

`bake_vertex.py` imports both embedded GLBs with Blender's glTF importer. It validates original vertex ordering/position correspondence, performs a real scene-wide Cycles `AO` bake into a POINT `FLOAT_COLOR` attribute, and saves inspectable `baked-vertex.blend` plus per-node NumPy arrays and `bake-report.json`.

The second channel is signed edge curvature. A temporary copy of each opaque mesh is welded by position at 1e-5 local units; signed manifold edge dihedral angles are weighted by edge length at each vertex, then compressed with `tanh(weightedAngle * 2.5)`. Positive means convex, negative concave. The welded graph never replaces the render mesh or authored normals. Shared hub instances use their mean AO.

`pack_colors.py` exports the attribute into the **original** GLBs rather than re-exporting geometry through Blender. This preserves every original POSITION, NORMAL, index byte, quantisation transform, node/material name and mesh primitive. The original 16-bit position and 12-bit normal quantisation stay intact. Only the new shading attribute is quantised to 8-bit normalized `COLOR_0`, VEC3, four-byte-aligned stride:

| Channel | Linear value |
| --- | --- |
| R | Cycles ambient visibility, 0 occluded to 1 open |
| G | `0.5 + 0.5 * signedCurvature`; 0.5 neutral |
| B | 1, reserved/neutral |

These are **linear data**, not sRGB colours. The viewer reads R/G in a small material shader patch without Three's usual vertex-colour tint multiplication. U8 neutral G is 128/255, so the shader applies a one-quantisation-step dead band around 0.5. All transparent primitives, including the second clear-glass primitive, receive neutral R=255, G=128, B=255.

Outputs are `vehicle-baked.glb`, `interior-baked.glb`, deterministic gzip files (`mtime=0`), and `*.base64` strings for the two embedded script elements. `packing-report.json` measures exact GLB/gzip/Base64 sizes and their increment; `verify_assets.py` checks that original binary data and node/accessor/view prefixes are unchanged and every primitive has the right colour count. `.blend`, GLBs and NumPy intermediates stay outside the single-file application.

## Tailgate backfill and optional base

The rear garnish closes a measured opening in the imported exterior that otherwise exposes the tan cabin between the lamps. It is a separate fitted part loaded after the existing GXR deformation. Its geometry is an artist fit to that opening, not an OEM measurement. Generate its real AO/curvature bake against the GXR-fitted source-body occluder:

```sh
blender -b -t 4 --python tools/bake/create_garnish.py -- /tmp/lc200-garnish --occluder /tmp/lc200-bake/vehicle.glb
```
