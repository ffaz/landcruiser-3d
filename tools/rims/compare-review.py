"""Register reference/render pixels using independently measured outer circles.

Usage: python compare-review.py ORIGINAL RENDER OUTPUT
       --reference-circle CX CY R --render-circle CX CY R
Only uniform scale and translation are applied; no radial or perspective warp.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('original', type=Path)
parser.add_argument('render', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--reference-circle', nargs=3, type=float, required=True)
parser.add_argument('--render-circle', nargs=3, type=float, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
W, C, R, HEAD, FOOT = 680, 340, 310, 64, 76


def font(size):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', size)


def align(path, circle):
    x, y, radius = circle
    scale = R / radius
    return Image.open(path).convert('RGB').transform(
        (W, W), Image.Transform.AFFINE,
        (1 / scale, 0, x - C / scale, 0, 1 / scale, y - C / scale),
        Image.Resampling.BICUBIC, fillcolor='white')


original = align(args.original, args.reference_circle)
render = align(args.render, args.render_circle)
original.save(args.output / 'aligned-original.png')
render.save(args.output / 'aligned-render.png')
sheet = Image.new('RGB', (W * 2, W + HEAD + FOOT), 'white')
sheet.paste(original, (0, HEAD))
sheet.paste(render, (W, HEAD))
draw = ImageDraw.Draw(sheet)
for x, title in [(W // 2, 'ORIGINAL'), (W + W // 2, 'REVISED BUILD')]:
    draw.text((x, 18), title, font=font(26), fill='#172838', anchor='mt')
draw.text((W, W + HEAD + 10), 'Same metal rim diameter and centre; source images scaled uniformly',
          font=font(19), fill='#263c4b', anchor='mt')
draw.text((W, W + HEAD + 38), 'Reference has 6 bolts; model retains the 5 x 150 layout',
          font=font(17), fill='#556471', anchor='mt')
sheet.save(args.output / 'comparison.png')

overlay = Image.blend(original, render, .5)
stack = Image.new('RGB', (W, W + HEAD + FOOT), 'white')
stack.paste(overlay, (0, HEAD))
draw = ImageDraw.Draw(stack)
draw.text((W // 2, 18), 'REGISTERED 50 / 50 STACK-UP', font=font(23), fill='#172838', anchor='mt')
draw.ellipse((C - R, C + HEAD - R, C + R, C + HEAD + R), outline='#00889d', width=2)
draw.text((W // 2, W + HEAD + 10), 'Original + revised build; no radial warping',
          font=font(18), fill='#263c4b', anchor='mt')
draw.text((W // 2, W + HEAD + 37), 'Bolts are intentionally not used for alignment',
          font=font(16), fill='#556471', anchor='mt')
stack.save(args.output / 'overlay.png')
split = original.copy()
split.paste(render.crop((C, 0, W, W)), (C, 0))
split.save(args.output / 'half-split.png')


def provenance(path, circle):
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'center_px': circle[:2], 'radius_px': circle[2]}


metadata = {
    'method': 'Uniform scaling and translation from measured outer metal circles; no shape warping.',
    'normalization': {'commonDiameter_px': 2 * R, 'commonCenter_px': [C, C]},
    'original': provenance(args.original, args.reference_circle),
    'render': provenance(args.render, args.render_circle),
    'limitations': ['Six-bolt reference compared to intentional five-bolt model.',
                    'Lighting and finish differ.',
                    'Image-derived radial proportions do not establish axial depth or manufacturer dimensions.']}
(args.output / 'registration.json').write_text(json.dumps(metadata, indent=2) + '\n')
print('Saved equal-diameter comparison, pixel overlay, split and registration metadata.')
