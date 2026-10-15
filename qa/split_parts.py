"""Wrap lesson-board formulas without \\p{n}{...} parts into parts, split at top-level
'=' / \\Rightarrow / \\quad separators, so the focus strip builds them term by term.
Works on the JS source (backslashes doubled inside single-quoted strings)."""
import re, sys, glob
SEPS = [',\\\\quad', '\\\\quad', '\\\;\\\\Rightarrow\\\;', '\\\\Rightarrow', '\\\\Leftrightarrow', '\\\\approx', '=']

def split_top(t):
    out, cur, depth, i = [], '', 0, 0
    while i < len(t):
        if t.startswith('\\\\left', i):
            depth += 1
        if t.startswith('\\\\right', i):
            depth -= 1
        c = t[i]
        if c == '{': depth += 1
        if c == '}': depth -= 1
        if depth == 0 and not (i >= 1 and t[i - 1] in '<>!'):
            hit = next((s for s in SEPS if t.startswith(s, i)), None)
            if hit and not (hit == '=' and t[i - 2:i] in ('\\\\',)):
                out.append(cur); out.append(('SEP', hit)); cur = ''; i += len(hit); continue
        cur += c; i += 1
    out.append(cur)
    return out, depth

def wrap(t):
    if '\\\\p{' in t or '\\\\begin' in t or '&' in t: return None
    parts, depth = split_top(t)
    if depth != 0: return None
    segs = [p for p in parts if not isinstance(p, tuple)]
    if sum(1 for s in segs if s.strip()) < 2: return None
    k, res = 0, ''
    for p in parts:
        if isinstance(p, tuple): res += p[1]; continue
        if not p.strip(): res += p; continue
        k += 1
        res += f'\\\\p{{{k}}}{{{p}}}'
    return res

changed = 0
for f in sys.argv[1:]:
    s = open(f).read()
    m = re.search(r"const lesson: LessonStep = \{(.*?)\n\};", s, re.S)
    if not m: continue
    L = m.group(1)
    def sub(mm):
        global changed
        new = wrap(mm.group(2))
        if new is None: return mm.group(0)
        changed += 1
        return mm.group(1) + new + mm.group(3)
    L2 = re.sub(r"(board:\s*\{[^}]*?tex:\s*')([^']*)(')", sub, L, flags=re.S)
    # multi-line boards: board: {\n label..., \n tex: '...'
    L2 = re.sub(r"(\n\s+tex:\s*')([^']*)(',?\n)", sub, L2)
    if L2 != L:
        open(f, 'w').write(s.replace(L, L2))
        print('ok', f)
print('formulas split:', changed)
