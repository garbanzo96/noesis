"""Score how busy the drawing is under every stage label (from qa/legibility.mjs output).
Usage: python3 qa/legibility.py qa/out/leg-a.json [qa/out/leg-b.json ...] [--sheets]
Prints flagged labels (text over lines/curves/bars) and overflows; --sheets writes
qa/out/leg-sheet-<world>.jpg with the flagged boxes outlined on the label-less stage."""
import json, sys
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
sheets = '--sheets' in sys.argv
TH = 0.16
recs = []
for a in args:
    try:
        recs += json.load(open(a))
    except Exception as e:
        print('skip', a, e, file=sys.stderr)

def score(im, b):
    x0, y0, x1, y1 = [round(v) for v in (b['x0'] - 1, b['y0'] - 1, b['x1'] + 1, b['y1'] + 1)]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(im.width, x1), min(im.height, y1)
    if x1 - x0 < 4 or y1 - y0 < 4:
        return 0, 0
    crop = im.crop((x0, y0, x1, y1)).convert('L')
    edges = crop.filter(ImageFilter.FIND_EDGES)
    px = list(edges.getdata())
    ef = sum(1 for p in px if p > 60) / len(px)
    lum = list(crop.getdata())
    bf = sum(1 for p in lum if p > 105) / len(lum)
    return ef, bf

flagged = defaultdict(list)
over = defaultdict(list)
seen = set()
for r in recs:
    world = r['id'].split('-')[0]
    for t, o in r.get('overflow', []):
        key = (r['id'], t)
        if key in seen: continue
        seen.add(key)
        over[world].append((r['id'], r['step'], r['at'], t, o))
    f = ROOT / 'out/leg' / r['shot']
    if not f.exists(): continue
    im = Image.open(f)
    for b in r['boxes']:
        ef, bf = score(im, b)
        s = max(ef * 2.2, bf)
        if s > TH:
            key = (r['id'], b['t'])
            if key in seen: continue
            seen.add(key)
            flagged[world].append((round(s, 2), r['id'], r['step'], r['at'], b['t'], r['shot'], b))

for w in sorted(set(flagged) | set(over), key=lambda w: int(w[1:])):
    print(f'== {w}: {len(flagged[w])} sobre dibujo, {len(over[w])} fuera de recuadro')
    for o in over[w]:
        print('  FUERA', o[0], o[1], 'beat', o[2], repr(o[3]), f'+{o[4]}px')
    for s, i, st, at, t, shot, b in sorted(flagged[w], reverse=True):
        print('  SOBRE', s, i, st, 'beat', at, repr(t))
    if sheets and flagged[w]:
        items = sorted(flagged[w], reverse=True)[:40]
        tiles = []
        for s, i, st, at, t, shot, b in items:
            im = Image.open(ROOT / 'out/leg' / shot).convert('RGB')
            cx, cy = (b['x0'] + b['x1']) / 2, (b['y0'] + b['y1']) / 2
            box = (max(0, cx - 160), max(0, cy - 90), min(im.width, cx + 160), min(im.height, cy + 90))
            tile = im.crop(box).resize((320, 180))
            d = ImageDraw.Draw(tile)
            d.rectangle((b['x0'] - box[0], b['y0'] - box[1], b['x1'] - box[0], b['y1'] - box[1]), outline=(255, 40, 40), width=2)
            d.text((4, 4), f'{i} {st[0]}{at} {t[:28]}', fill=(255, 255, 0))
            tiles.append(tile)
        cols = 4
        sheet = Image.new('RGB', (cols * 320, ((len(tiles) + cols - 1) // cols) * 180))
        for k, t in enumerate(tiles):
            sheet.paste(t, ((k % cols) * 320, (k // cols) * 180))
        sheet.save(ROOT / f'out/leg-sheet-{w}.jpg', quality=80)
