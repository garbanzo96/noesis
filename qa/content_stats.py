"""Static didactic stats per case file (approximate, regex based)."""
import re, glob, json, sys
from collections import defaultdict
rows = []
for f in sorted(glob.glob('src/content/w*/c*.tsx') + glob.glob('src/content/w*/final.tsx')):
    s = open(f).read()
    w = f.split('/')[2]
    m = re.search(r"const lesson: LessonStep = \{(.*?)\n\};", s, re.S)
    L = m.group(1) if m else ''
    beats = len(re.findall(r"\n\s+say:", L))
    gates = len(re.findall(r"\n\s+gate:", L))
    asks = len(re.findall(r"\n\s+ask:", L))
    boards = re.findall(r"tex:\s*'([^']*)'", L)
    parted = sum(1 for b in boards if '\\\\p{' in b)
    maxparts = max([len(re.findall(r'\\\\p\{', b)) for b in boards] or [0])
    # demos (investigation)
    dm = re.findall(r"kind: 'demo',(.*?)\n    \},\n", s, re.S)
    dbeats = sum(len(re.findall(r"\n\s+say:", d)) for d in dm)
    dasks = sum(len(re.findall(r"\n\s+ask:", d)) for d in dm)
    rounds = sum(int(x) for x in re.findall(r"kind: 'challenge'[^}]*rounds: (\d+)", s))
    hints = len(re.findall(r"api\.hints\(", s))
    wrong = len(re.findall(r"api\.result\(\s*false", s))
    pitfalls = len(re.findall(r"pitfalls:", s))
    scenes = len(re.findall(r"kind: 'scene'", s))
    lines = len(re.findall(r"who: '", s))
    words_say = sum(len(x.split()) for x in re.findall(r"say:\s*'([^']*)'", L))
    rows.append(dict(f=f, w=w, beats=beats, gates=gates, asks=asks, boards=len(boards), parted=parted, maxparts=maxparts,
                     dbeats=dbeats, dasks=dasks, rounds=rounds, hints=hints, wrong=wrong, scenes=scenes, lines=lines,
                     say_words=round(words_say / max(1, beats))))
json.dump(rows, open('qa/out/content-stats.json', 'w'), indent=0)
by = defaultdict(list)
for r in rows: by[r['w']].append(r)
print('mundo casos clase(pasos/gates/asks) pizarras(con partes) inv(pasos/asks) práctica(rondas) pistas feedback_err palabras/paso')
for w in sorted(by, key=lambda k: int(k[1:])):
    R = by[w]
    S = lambda k: sum(r[k] for r in R)
    print(f"{w:4} {len(R):2}  {S('beats'):3}/{S('gates'):2}/{S('asks'):2}   {S('boards'):3}({S('parted'):3})   {S('dbeats'):3}/{S('dasks'):2}   {S('rounds'):3}   {S('hints'):2}  {S('wrong'):3}   {round(sum(r['say_words'] for r in R)/len(R))}")
issues = [r for r in rows if r['beats'] == 0 or r['gates'] == 0 or r['hints'] == 0 or r['wrong'] < 3 or r['parted'] < r['boards'] * 0.6]
print('\ncasos con alertas:')
for r in issues:
    flags = []
    if r['beats'] == 0: flags.append('sin clase')
    if r['gates'] == 0 and r['beats']: flags.append('clase sin acción')
    if r['hints'] == 0: flags.append('práctica sin pistas')
    if r['wrong'] < 3: flags.append(f"poca retro de error ({r['wrong']})")
    if r['boards'] and r['parted'] < r['boards'] * 0.6: flags.append(f"pizarras sin partes {r['boards']-r['parted']}/{r['boards']}")
    print(' ', r['f'].replace('src/content/', ''), '·', ', '.join(flags))
