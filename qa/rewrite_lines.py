"""Replace the scene lines of a case file in order: python3 qa/rewrite_lines.py file.json
JSON: {"<file>": {"lines": ["...", ...], "teaser": "..."}} — same number of lines as the file."""
import json, re, sys
spec = json.load(open(sys.argv[1]))
LINE = re.compile(r"(\{\s*who: '(\w+)',\s*text:\s*)(['`])(.*?)\3(,?\s*\})", re.S)
for f, d in spec.items():
    s = open(f).read()
    found = list(LINE.finditer(s))
    new = d['lines']
    assert len(found) == len(new), f"{f}: {len(found)} líneas en el archivo, {len(new)} nuevas"
    out, last = [], 0
    for m, t in zip(found, new):
        assert "'" not in t or '`' not in t
        q = "'" if "'" not in t else '`'
        out.append(s[last:m.start()] + m.group(1) + q + t + q + m.group(5))
        last = m.end()
    s = ''.join(out) + s[last:]
    if d.get('teaser'):
        s, n = re.subn(r"(teaser:\s*)'[^']*'", lambda m: m.group(1) + "'" + d['teaser'].replace("'", "’") + "'", s, count=1)
        assert n == 1, f
    open(f, 'w').write(s)
    print('ok', f, len(new))
