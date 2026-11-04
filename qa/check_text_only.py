"""A text pass may change only the strings of say, gate and after. Compares a file with its version
in HEAD after blanking those strings and ignoring whitespace, then lints the new strings.
Usage: python3 qa/check_text_only.py src/content/w02/c1-senal.tsx [...]   (exit 1 if something fails)"""
import re, subprocess, sys

STR = r"""(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)"""
PROP = re.compile(r"\b(say|gate|after):\s*(" + STR + r")\s*,?")
BANNED = re.compile(
    r"—|active inference|inferencia activa|energía libre|free energy|\bAIF\b"
    r"|\bclave\b|(?<!teorema )fundamental|crucial|poderos[oa]|fascinante|imagina que|\bvos\b|tenéis|sabés|podés"
    r"|no (?:es|son|solo|sólo)\b[^.;:]{0,60}\bsino\b",
    re.I,
)

def blank(src: str) -> str:
    out = PROP.sub(lambda m: "" if m.group(1) == "after" else m.group(1) + ":X,", src)
    return re.sub(r"\s+", "", out)

bad = 0
for path in sys.argv[1:]:
    new = open(path, encoding="utf8").read()
    old = subprocess.run(["git", "show", f"HEAD:{path}"], capture_output=True, text=True).stdout
    if blank(new) != blank(old):
        print(f"{path}: cambió algo que no es say, gate o after")
        bad += 1
    olds = {m.group(2) for m in PROP.finditer(old)}
    for m in PROP.finditer(new):
        if m.group(2) in olds:
            continue
        s = m.group(2)
        hit = BANNED.search(s)
        if hit:
            print(f"{path}: «{hit.group(0)}» en {s[:90]}")
            bad += 1
        if m.group(1) == "say" and len(s) > 640:
            print(f"{path}: say de {len(s)} caracteres: {s[:70]}")
            bad += 1
sys.exit(1 if bad else 0)
