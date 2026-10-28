# Specification verification — 27 October 2026

Retain **1,930 mm**, with no height rescale. The official Toyota UAE May 2021 5.7L GXR specification sheet explicitly states `L 5,095 x W 1,980 x H 1,930` and factory tyres `285/60R18`. The sheet was downloaded and its text extracted again in this session.

[Official GCC source](https://dam.alfuttaim.com/dx/api/dam/v1/collections/24e5d2dd-5aa6-4fd2-ad4d-83ba5a1d1be4/items/1d6c9972-e9fd-49a5-aec3-faa9aaa1713c/renditions/2b4bd368-b103-4b18-a18e-d1c1609420d1?binary=true).

Toyota Jordan's [regional LC200 catalogue](https://www.toyota.com.jo/sites/default/files/2020-07/Land%20Cruiser%20Catalog_0.pdf) separately lists `1890 (+40 with roof rails)` in its height table. That corroborates the rail allowance for this vehicle family; it is not a 2021 UAE grade certificate. The direct UAE GXR sheet is the primary evidence for this viewer. No staging-domain value is treated as the public GCC specification.

The owner's engine variant and exact wheel colour/style remain unconfirmed. The owner previously supplied GXR and 265/70R17; this pass retains wheel geometry and tyre text while making the existing satin gunmetal rim material brighter. The no-JavaScript fallback now agrees with that rendered finish. Clearance is not independently verified; the UI marks it unverified instead of presenting an unsupported 230 mm specification.

Update 28 October 2026: the sheet was re-read and its figures confirmed: 5,095 mm long, 285/60R18 tyres, 18" alloys. The owner chose to label the car's own **265/70R17** tyres anyway, as text only. The spec panel reads "Toyota GXR 5,095 mm · model body 5,000 mm" ([rear overhang correction](../rear-overhang/README.md)).
