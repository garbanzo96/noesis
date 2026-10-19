"""Check that every lesson board with `parts: [...]` has one label per \\p{n} part, each short.
Usage: python3 qa/check_parts.py src/content/w02 [...]  -> exit 1 on problems; prints coverage."""
import re, sys, glob
bad, total, labelled = [], 0, 0
files = []
for a in sys.argv[1:]:
    files += sorted(glob.glob(a + '/*.tsx')) if not a.endswith('.tsx') else [a]
for f in files:
    s = open(f).read()
    m = re.search(r"const lesson: LessonStep = \{(.*?)\n\};", s, re.S)
    if not m:
        continue
    L = m.group(1)
    for b in re.finditer(r"tex:\s*'((?:[^'\\]|\\.)*)'(\s*,\s*(?:body:\s*'(?:[^'\\]|\\.)*'\s*,\s*)?parts:\s*\[(.*?)\])?", L, re.S):
        tex = b.group(1)
        idx = {int(x) for x in re.findall(r"\\\\p\{(\d+)\}", tex)}
        if not idx:
            continue
        total += 1
        if b.group(3) is None:
            continue
        labelled += 1
        labels = re.findall(r"'((?:[^'\\]|\\.)*)'", b.group(3))
        line = s[: s.index(b.group(0))].count('\n') + 1
        if len(labels) != max(idx):
            bad.append(f"{f}:{line} {len(labels)} etiquetas para {max(idx)} partes")
        for lab in labels:
            if len(lab) > 32:
                bad.append(f"{f}:{line} etiqueta larga ({len(lab)}): {lab}")
print(f"pizarras con partes: {total}, con etiquetas: {labelled}")
for x in bad:
    print('  ', x)
sys.exit(1 if bad else 0)
