"""Applies hand-written gate rewrites. Input file: «## file» headers and blocks
«@ start of old gate» / «= new gate» (optional) / «+ after». Text is in source form (double backslashes).
Usage: python3 qa/apply_gates.py src/content/w04 work/gates/w04.txt"""
import re, sys
STR = r"""(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)"""
base, src = sys.argv[1], sys.argv[2]
quote = lambda s: "'" + s + "'" if "'" not in s else '"' + s + '"'
text = None; path = None; miss = 0; n = 0
blocks = []
for line in open(src, encoding="utf8").read().split("\n"):
    if line.startswith("## "):
        blocks.append([line[3:].strip(), None, None, None])
    elif line.startswith("@ "):
        blocks.append([blocks[-1][0], line[2:].strip(), None, None])
    elif line.startswith("= "):
        blocks[-1][2] = line[2:].strip()
    elif line.startswith("+ "):
        blocks[-1][3] = line[2:].strip()
files = {}
for f, old, new, after in blocks:
    if old is None:
        continue
    p = f"{base}/{f}"
    t = files.setdefault(p, open(p, encoding="utf8").read())
    found = None
    for m in re.finditer(r"\bgate:(\s*)(" + STR + r")(,?)", t):
        if m.group(2)[1:].startswith(old):
            found = m
            break
    if not found:
        print("NO ENCONTRADO", p, old[:60]); miss += 1
        continue
    g = quote(new) if new else found.group(2)
    files[p] = t[: found.start()] + f"gate: {g},\n after: {quote(after)}," + t[found.end():]
    n += 1
for p, t in files.items():
    open(p, "w", encoding="utf8").write(t)
print(n, "aplicados", miss, "faltan")
