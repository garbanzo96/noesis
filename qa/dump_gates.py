"""Gates without `after`, with what is needed to write it: step text, formal note and unlock conditions.
Usage: python3 qa/dump_gates.py w04"""
import glob, re, sys
STR = r"""(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)"""
for w in sys.argv[1:]:
    for f in sorted(glob.glob(f"src/content/{w}/*.tsx")):
        t = open(f, encoding="utf8").read()
        items = [m for m in re.finditer(r"\bgate:\s*(" + STR + r")", t) if "after:" not in t[m.end():m.end() + 30]]
        if not items:
            continue
        print(f"## {f.split('/')[-1]}")
        for u in sorted({re.sub(r"\s+", " ", l).strip()[:110] for l in t.split("\n") if "unlock()" in l and "=>" not in l.split("unlock()")[1]}):
            if u not in ("unlock();", "unlock(),"):
                print("  ·", u)
        for m in items:
            before = t[max(0, m.start() - 900):m.start()]
            say = re.findall(r"\bsay:\s*(" + STR + r")", before)
            rest = t[m.end():m.end() + 500]
            info = re.findall(r"\b(?:tex|body):\s*(" + STR + r")", rest)
            print("  S", (say[-1][1:-1] if say else "")[:170])
            print("  G", m.group(1)[1:-1])
            if info:
                print("  N", " | ".join(i[1:-1][:90] for i in info[:2]))
