# Approved tyres and rims

The owner approved all five tyre options, Method MR705 and Shanaber steel.
KMC KM720 remains unapproved and disabled in the catalogue.

Tyres and rims are selected independently. Five new tyre casings contribute only
their `tyre` material meshes; their original bundled review rims/brakes are not
installed. Stock alloys remain available with every approved tyre. The two
approved aftermarket rims retain their authored hardware and bead adapters.
All options use existing fit rules, rigid hub offsets and tyre-radius ride rise.

Sources:

- Tyres: `tyres-26570-review` at `c480d159c35b6a57f7adbcfea1f2849c0cc11a21`:
  expedition AT 285/70R17, 265/75R17, 285/65R17 and 265/70R17; ribbed highway 265/70R17.
- Rims: `full-car-pass` at `7d8b8ee3ba2cb6193f1a943f823c92c5429086ee`:
  Method MR705 17×8.5 ET0 and Shanaber steel 17×8 ET+25, both 5×150.

Only the left-front authored asset of each design is needed. The wheel kit clones
it rigidly to four hub positions, rotating right-hand copies rather than mirroring.
Existing vehicle GLBs, body finishes and cameras are unchanged.

Run `node tools/workshop/approved-wheels.mjs DEPS CHROMIUM OUTPUT.json` for the
independent combination, stock restoration, visibility, sharing and UI checks.
