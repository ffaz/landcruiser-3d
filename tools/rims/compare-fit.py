"""Compare accepted authored fit coordinates; old/new are roots of three bake folders.
Example: python compare-fit.py OLD_BAKES NEW_BAKES OUTPUT.json
Generate OLD_BAKES with the model.py stored at 7adae34; no car asset is read.
"""
import json, hashlib, sys
from pathlib import Path
before, after, output = map(Path, sys.argv[1:])
def signature(data, zones):
    positions = []
    for zone in zones:
        array = data['groups'][zone]['positions']
        positions.extend(tuple(round(v, 8) for v in array[i:i+3]) for i in range(0, len(array), 3))
    return hashlib.sha256(json.dumps(sorted(positions), separators=(',', ':')).encode()).hexdigest()
rows = []
for style in ['disc', 'window', 'steel']:
    old = json.loads((before/style/'rim-data.json').read_text())
    new = json.loads((after/style/'rim-data.json').read_text())
    pairs = [('rubber', ['tyre'], ['tyre']), ('rotor_hat_studs', ['brake'], ['brake']),
             ('barrel_valve_backing_caliper', ['black'], ['black', 'backing', 'caliper', 'barrel'])]
    if style == 'steel':
        pairs.append(('entire_accepted_steel_part', list(old['groups']), [z for z in new['groups'] if z!='brake_detail']))
    row = {'style': style, 'baseline': '7adae34',
           'method': 'sorted authored positions rounded to 1e-8 m; material splits combined', 'checks': {}}
    for name, old_zones, new_zones in pairs:
        a, b = signature(old, old_zones), signature(new, new_zones)
        row['checks'][name] = {'before': a, 'after': b, 'identical': a == b}
        if a != b:
            raise ValueError(f'{style}: {name} changed')
    rows.append(row)
output.write_text(json.dumps(rows, indent=2)+'\n')
print('Accepted fit coordinates identical; complete steel geometry identical')
