"""Build src/art/valpo.ts from OpenStreetMap data (art-src/osm/valpo.json). © OpenStreetMap contributors (ODbL)."""
import json, math, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
d = json.load(open(ROOT / 'art-src/osm/valpo.json'))
W, H = 1600, 900
MARGIN_L, MARGIN_R = 150, 130
WEST, EAST = float(sys.argv[1]) if len(sys.argv) > 1 else -71.655, float(sys.argv[2]) if len(sys.argv) > 2 else -71.51
LATC = float(sys.argv[3]) if len(sys.argv) > 3 else -33.035
k = W / ((EAST - WEST) * math.cos(math.radians(LATC)))  # px per degree of latitude
NORTH = LATC + (H / 2) / k
def P(lon, lat):
    return ((lon - WEST) * math.cos(math.radians(LATC)) * k, (NORTH - lat) * k)

def dp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1e-9
    i, dm = 0, -1
    for j in range(1, len(pts) - 1):
        x, y = pts[j]
        dd = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if dd > dm: i, dm = j, dd
    if dm > eps: return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [pts[0], pts[-1]]

def path(lines, eps=1.0, close=False):
    out = []
    for pts in lines:
        pts = dp(pts, eps)
        if len(pts) < 2: continue
        out.append('M' + ' '.join(f'{x:.0f} {y:.0f}' for x, y in pts) + (' Z' if close else ''))
    return ''.join(out)

def inside(pts, m=60):
    return any(-m <= x <= W + m and -m <= y <= H + m for x, y in pts)

coast, major, minor, rail = [], [], [], []
for e in d['elements']:
    t = e.get('tags', {}); g = e.get('geometry')
    if not g: continue
    pts = [P(p['lon'], p['lat']) for p in g]
    if not inside(pts): continue
    if t.get('natural') == 'coastline': coast.append((e['id'], g[0], g[-1], pts))
    elif t.get('railway') == 'rail' and t.get('usage') == 'main': rail.append(pts)
    elif t.get('highway') in ('motorway', 'trunk', 'primary'): major.append(pts)
    elif t.get('highway') in ('secondary', 'tertiary'): minor.append(pts)

# join coastline ways end to start (OSM: land on the left of the way)
segs = {(round(a['lon'], 7), round(a['lat'], 7)): (b, pts) for _, a, b, pts in coast}
starts = set(segs); ends = {(round(b['lon'], 7), round(b['lat'], 7)) for b, _ in segs.values()}
chains = []
for s0 in [s for s in starts if s not in ends] or list(starts)[:1]:
    chain, cur = [], s0
    while cur in segs:
        b, pts = segs.pop(cur)
        chain += pts if not chain else pts[1:]
        cur = (round(b['lon'], 7), round(b['lat'], 7))
    chains.append(chain)
chains.sort(key=len, reverse=True)
main = chains[0]
print('coast chains', [len(c) for c in chains], 'main from', [round(v) for v in main[0]], 'to', [round(v) for v in main[-1]], file=sys.stderr)
# sea: the coastline goes with land on its left; close the polygon around the right side (north-west)
x0, y0 = main[0]; x1, y1 = main[-1]
# sea: land lies on the left of the coastline, so close the polygon around its right (north-west)
sea = main + [(x1 - 600, y1), (-600, -600), (x0, -600)]
# route: rail pieces chained west→east, resampled and smoothed
pieces = sorted(rail, key=lambda r: min(p[0] for p in r))
line = []
for r in pieces:
    r = r if r[0][0] <= r[-1][0] else r[::-1]
    line += [p for p in r if not line or p[0] > line[-1][0] - 2]
res = [line[0]]
for p in line[1:]:
    while math.dist(res[-1], p) >= 4:
        a = res[-1]; t = 4 / math.dist(a, p)
        res.append((a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t))
K = 18
smooth = [(sum(q[0] for q in res[max(0, i-K):i+K+1]) / len(res[max(0, i-K):i+K+1]),
           sum(q[1] for q in res[max(0, i-K):i+K+1]) / len(res[max(0, i-K):i+K+1])) for i in range(len(res))]
smooth = [p for p in smooth if -40 <= p[0] <= W + 40]
cum = [0]
for a, b in zip(smooth, smooth[1:]): cum.append(cum[-1] + math.dist(a, b))
def at(s):
    for i in range(1, len(cum)):
        if cum[i] >= s:
            t = (s - cum[i-1]) / (cum[i] - cum[i-1] or 1)
            a, b = smooth[i-1], smooth[i]
            return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    return smooth[-1]
s0 = next(c for c, p in zip(cum, smooth) if p[0] >= MARGIN_L)
s1 = next(c for c, p in zip(cum, smooth) if p[0] >= W - MARGIN_R)
stations = [at(s0 + (s1 - s0) * i / 13) for i in range(14)]
json.dump({'coast': chains, 'rail': rail, 'smooth': smooth, 'stations': stations, 'sea': sea}, open(ROOT / 'art-src/osm/proj.json', 'w'))
# neighbourhood names
names = []
try:
    pl = json.load(open(ROOT / 'art-src/osm/places.json'))
    for e in pl['elements']:
        t = e.get('tags', {}); n = t.get('name')
        if not n: continue
        x, y = P(e['lon'], e['lat'])
        kind = t.get('place')
        if not (kind in ('city', 'suburb') or n.startswith('Cerro ') or n in ('Barrio Puerto', 'Playa Ancha', 'Almendral', 'Recreo', 'Miramar', 'Chorrillos', 'Forestal')):
            continue
        if 40 <= x <= W - 40 and 40 <= y <= H - 40:
            names.append([n, round(x), round(y), kind])
except FileNotFoundError:
    pass
names.sort(key=lambda r: (r[3] != 'city', r[3] != 'suburb'))
kept = []
for r in names:
    if all(math.dist(r[1:3], k[1:3]) > 95 for k in kept):
        kept.append(r)
names = kept
out = ROOT / 'src/art/valpo.ts'
out.write_text(
    '// Valparaíso and Viña del Mar from OpenStreetMap (© OpenStreetMap contributors, ODbL).\n'
    '// Generated by art-src/tools/valpo_map.py — do not edit by hand.\n'
    f'export const COAST = {json.dumps(path(chains, 1.2))};\n'
    f'export const ROADS_MAJOR = {json.dumps(path(major, 1.4))};\n'
    f'export const ROADS_MINOR = {json.dumps(path(minor, 1.6))};\n'
    f'export const RAIL = {json.dumps(path(rail, 1.0))};\n'
    f'export const SEA = {json.dumps(path([sea], 1.2, close=True))};\n'
    f'export const ROUTE = {json.dumps(path([smooth], 0.8))};\n'
    '/** the fourteen stations of the story line, west → east */\n'
    '/** neighbourhood and town names: [name, x, y, kind] */\n'
    f'export const NAMES: [string, number, number, string][] = {json.dumps(names, ensure_ascii=False)};\n'
    f'export const ROUTE_LEN = {round(cum[-1])};\n'
    '/** arc length along ROUTE of each station */\n'
    f'export const STATION_S = {json.dumps([round(s0 + (s1 - s0) * i / 13) for i in range(14)])};\n'
    f'export const STATIONS: [number, number][] = {json.dumps([[round(x), round(y)] for x, y in stations])};\n'
)
print('bytes', out.stat().st_size, 'major', len(major), 'minor', len(minor), 'rail', len(rail), file=sys.stderr)
