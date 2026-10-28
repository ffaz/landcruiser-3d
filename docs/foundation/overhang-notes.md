# Stored scale and the extra rear overhang

> **Corrected 28 October 2026.** The owner's car is a GCC GXR. Measurements showed the 1.370 m rear overhang came from stretching the body about 15% along x behind the rear axle:
>
> - The rear arch opening was 0.503 m ahead of the hub and 0.567 m behind it; the front arch is symmetric.
> - The tail lamp sat 14% further back than in the real side photo.
>
> With owner approval, that stretch was undone once to a **1.200 m** rear overhang. The model body is now **5,000 mm**; Toyota's GXR figure (5,095 mm) is shown as text. Front overhang, wheelbase, wheels and height are unchanged. See the [correction record](../rear-overhang/README.md).
>
> The section below is the original foundation-session analysis, kept as history.

No vertex was corrected to match a catalogue number in this foundation session.

| Quantity | Stored model / arithmetic |
| --- | ---: |
| Overall length | 5.170001 m decoded; 5.170 m authored |
| Wheelbase | 2.850000 m decoded; 2.850 m authored |
| Front overhang | 0.950001 m decoded; 0.950 m authored |
| Rear overhang | 1.370000 m decoded; 1.370 m authored |
| Rear remainder for 5.095 m length, **if** the same 2.850 m wheelbase and 0.950 m front overhang are retained | 1.295 m |
| Difference under that assumption | 0.075 m |

The 1.295 m figure is a conditional subtraction, not a published Toyota rear-overhang measurement.

## What is verified

Toyota UAE's [2021 4.6L EXR / GXR GT sheet, created August 2020](https://nd-mediagallery2-public-production.s3.amazonaws.com/dbfbe079ddec83c595dd0ec9c4c6a5fa/2021_lc_sw_4.6l.pdf) lists 5,095 mm for EXR and 5,170 mm for GXR GT, both 1,980 mm wide and 1,930 mm high. The same sheet identifies a new GT-design front grille and front/rear bumper spoilers for the GT grade. Thus a 75 mm difference in the catalogue's overall envelopes is real, and grade-specific bumper equipment is a supported explanation for an overall-length difference. The sheet does not split that 75 mm between front and rear overhangs.

Toyota UAE's [May 2021 5.7L GXR sheet](https://dam.alfuttaim.com/dx/api/dam/v1/collections/24e5d2dd-5aa6-4fd2-ad4d-83ba5a1d1be4/items/1d6c9972-e9fd-49a5-aec3-faa9aaa1713c/renditions/2b4bd368-b103-4b18-a18e-d1c1609420d1?binary=true) independently confirms the 5,095 mm GXR overall length. It does not publish individual overhangs.

The [Toyota-hosted regional LC200 catalogue](https://www.toyota.com.jo/sites/default/files/2020-07/Land%20Cruiser%20Catalog_0.pdf), specification table on PDF page 29, demonstrates that LC200 overall length varies with accessories including bumper protection, winch and spare-wheel mounting. It is an older regional catalogue, not a 2021 UAE GXR/GT drawing; its accessory allowances must not be applied as measured dimensions for this car.

For qualitative GCC photo comparison, [Al-Futtaim Toyota's supplied 2020 LC200 exterior photographs, published by The National](https://www.thenationalnews.com/lifestyle/motoring/toyota-s-2020-land-cruiser-tears-into-the-uae-here-s-a-look-at-the-brand-new-model-1.949419), show the related final-facelift vehicle's front/rear trim and bumper surfaces. They are perspective photographs, not calibrated side drawings; they cannot locate a 75 mm difference. No publicly available, dimensioned **2021 GCC side drawing giving both front and rear overhangs** was verified in the reviewed Toyota material. No pixel-derived overhang figure is claimed.

## Likely cause in this repository

The immediate cause is the earlier stored-asset preparation, not a new physical measurement. The archived preparation script `build_model.py` ([recorded constants and SHA-256](source-preparation.json)) selected `L = 5.170`, `WB = 2.850`, and `front_axle = -L/2 + .950`. It then set the rear axle from the wheelbase. That construction necessarily leaves `5.170 - .950 - 2.850 = 1.370 m` behind the rear axle. Later historical scripts fitted the imported 2016 final-facelift mesh to those chosen anchors. This audit reads the resulting stored asset; it does not repeat or alter that preparation.

The probable interpretation is a GT/accessory-length target inherited by an artist-adapted 2016 mesh, combined with an assumed 0.950 m front overhang. It is **not verified** that Toyota's real GXR GT puts the entire additional 75 mm at the rear, nor that the imported body accurately represents either grade's exact bumper envelope. The proper foundation action is to preserve the stored geometry and make that uncertainty explicit. A later replacement part or corrected source asset can address it after measured reference drawings are available.

[Read-only stored geometry audit](scale-audit.json) records decoded bounds, authored hub pivots, measured tyre bounds and quantisation residuals. Original encoded node transforms are retained as glTF coordinate decoding, while the physical car root uses one uniform scale of 1.0.
