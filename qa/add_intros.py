"""Insert the context card of each lesson: python3 qa/add_intros.py intros.json
JSON: {"<file>": {"<lesson title>": {"question": "...", "text": "..."}}}. Replaces an existing intro."""
import json, re, sys
spec = json.load(open(sys.argv[1]))
q = lambda t: "'" + t.replace('\\', '\\\\').replace("'", "\\'") + "'"
for f, lessons in spec.items():
    s = open(f).read()
    for title, it in lessons.items():
        m = re.search(r"(\n(\s*)kind: 'lesson',\n\s*title: " + re.escape(q(title)) + r",\n)(\s*intro: \{.*?\n\s*\},\n)?", s, re.S)
        assert m, f"{f}: no encuentro la clase «{title}»"
        ind = m.group(2)
        block = f"{ind}intro: {{\n{ind}  question: {q(it['question'])},\n{ind}  text: {q(it['text'])},\n{ind}}},\n"
        s = s[:m.end(1)] + block + s[m.end():]
        print('ok', f, title)
    open(f, 'w').write(s)
