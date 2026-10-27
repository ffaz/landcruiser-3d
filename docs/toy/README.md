# Collectible studio refinement

## 1. Camera limits

The camera's minimum distance is derived from the fitted car's measured bounding sphere, the permitted target offset and a 0.35 m margin. Pan is clamped to a small box around that sphere's centre. A second guard rejects camera positions inside the car's bounding box expanded by 0.30 m. Orbit elevation is limited to 85° from vertical, including preset tweens, so the camera stays above the floor. This intentionally replaces the previous exactly level Side elevation with the requested above-ground limit.

[Camera test report](camera-limits.json): 75 safe observations across all five presets using trusted WebKit touch pinch, pan and rotation plus Chromium scroll input. A deliberately invalid scripted pose also recovered outside the expanded bounds. Zero console errors. This was browser emulation, not physical iPad hardware.
