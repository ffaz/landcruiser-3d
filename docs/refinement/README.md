# Refinement evidence

Every comparison below contains Front, Side, Rear, 3/4 and Top, with before on the left and after on the right. The initial baseline was captured and inspected before the first edit. Each accepted after capture is reused as the next step's before capture because the source was unchanged between them; [stages.json](stages.json) records the exact hashes. Rejected experiments are excluded from these accepted comparisons.

| Step | Comparison | Result |
| --- | --- | --- |
| 1 | [Lighting and reflections](01-lighting.jpg) | Reflection-only PMREM softboxes, AgX, tuned exposure and key/fill/rim |
| 2 | [Materials](02-materials.jpg) | Physical paint, tinted glass, interior, satin rims, rubber and reflective lenses |
| 3 | [Grounding](03-shadows.jpg) | Depth-baked blurred contact shadow and directional PCFSoft shadows |
| 4 | [Background and framing](04-framing.jpg) | Cream default, Slate alternate, 20° lens and level wheel-centre Side |
| 5 | [Edge quality](05-edges.jpg) | Native MSAA retained; pixel-ratio cap 2; no idle draws |
| 6 | [Model detail and specification](06-model.jpg) | Shorter crowned spoiler, attached supports, GXR dimensions and owner 17-inch tyres |
| 7 | [Compact UI](07-ui.jpg) | Lighter specs, slimmer bars and Clean view |
| Final QA | [Tyre contact and Reset](08-qa.jpg) | Tighter near-tyre contact; Reset clears pending pan inertia |

Final source SHA-256: `95622fc8066ed4aac8f54f8c079920daaacc87f392612fd2ab8687f1b4ae44e6`.

All five final presets were captured in both [Cream](final-cream.jpg) and [Slate](final-slate.jpg), with no console errors. All four swatches retain the same physical reflection material: [White](paint-f4f4ef.jpg), [Silver](paint-a9b0b8.jpg), [Graphite](paint-575c60.jpg), [Black](paint-15191d.jpg). [Clean view](clean-view.jpg) shows all UI hidden in DPR-2 iPad-sized WebKit.

The edge experiment tested FXAA on an HDR composer. It introduced silhouette stippling and transparent-alpha fringes, so the accepted final version uses native antialiasing instead. WebKit reported four MSAA samples at DPR 2. Lens normal orientation and transparent glass depth writing were corrected during final inspection.

The software-rendered test copy suppresses redundant intermediate GPU frames while allowing real UI camera updates, then renders the actual product frame before taking each screenshot. It serves the npm-packed Three.js 0.166.1 locally; committed CDN URLs are unchanged. Independent visual inspection covered glass/body alignment, attached rails/trim/spoiler, tyres meeting the floor, reflective paint in every swatch, and the absence of car badges.

Native WebKit touch rotate, pinch, pan, Reset and Clean view pass. The focused Clean follow-up waits for the CSS visibility transition and sends a native short tap, correcting timing issues in the initial harness without changing the product. The consolidated [validation report](../validation.json) retains both test-run origins. Physical iPad Safari and hardware frame rate were not tested.
