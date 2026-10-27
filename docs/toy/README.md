# Collectible studio refinement

## 1. Camera limits

The camera's minimum distance is derived from the fitted car's measured bounding sphere, the permitted target offset and a 0.35 m margin. Pan is clamped to a small box around that sphere's centre. A second guard rejects camera positions inside the car's bounding box expanded by 0.30 m. Orbit elevation is limited to 85° from vertical, including preset tweens, so the camera stays above the floor. This intentionally replaces the previous exactly level Side elevation with the requested above-ground limit.

[Camera test report](camera-limits.json): 75 safe observations across all five presets using trusted WebKit touch pinch, pan and rotation plus Chromium scroll input. A deliberately invalid scripted pose also recovered outside the expanded bounds. Zero console errors. This was browser emulation, not physical iPad hardware.

## 2. Baked shading

Blender **4.3.2** performed a real Cycles CPU AO vertex-colour bake: 32 samples, local 0.35 m distance, cabin and ground occluders. Signed edge curvature comes from welded manifold edge angles. Linear COLOR_0 stores AO in R and signed curvature in G; the shader reads those channels without tinting paint. All three artistic strengths live in `BAKED_LOOK`. There is no screen-space AO, cavity render target or per-frame curvature computation.

The first 10 m AO-distance experiment was rejected because it shaded broad outer panels. The accepted 0.35 m bake preserves open white panels and concentrates shading at crevices. Attribute coverage checks also caught additional glass primitives and shared hub geometry during integration; the accepted asset covers every primitive, with neutral data on glazing.

[Reproducible offline pipeline](../../tools/bake/README.md), [Cycles report](bake.json), [packing/storage report](bake-packing.json), and [renderer smoke check](baked-smoke.json). Original geometry, normals, indices and transforms are preserved byte-for-byte; the new attribute uses normalized 8-bit values while existing position/normal quantisation stays intact. Its compressed Base64 increment is **1,417,080 bytes** under the same gzip settings. Front and 3/4 renders were inspected with zero console errors.

## 3. Satin toy materials

Paint uses roughness 0.38, clearcoat 0.55 and clearcoat roughness 0.20. Glazing is neutral #20282c; rims retain the existing shape with brighter satin gunmetal; chrome roughness is 0.24. A single overhead directional key plus hemisphere and the existing environment replaces the previous multi-light reflection rig. Four simple satin arch liners close the openings behind the tyres without adding suspension or underbody details. Front/quarter inspection found no detached or intersecting liners. [Material-stage render check](materials-smoke.json): zero console errors.
