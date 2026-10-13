# Detecta comandos TeX con una sola barra dentro de strings JS ('...' o `...`), donde
# se pierden: `\mathrm` -> "mathrm", `\,` -> ",". Uso: python3 qa/texcheck.py [--fix] archivos...
import re, sys
fix = '--fix' in sys.argv
files = [f for f in sys.argv[1:] if f != '--fix']
pat = re.compile(r"(?<!\\)\\([a-zA-Z]{2,}|[ ,;:!])")
total = 0
for p in files:
    s = open(p).read()
    out = []; i = 0; n = len(s); changed = False
    while i < n:
        c = s[i]
        if c in "'`" :
            j = i + 1
            while j < n and s[j] != c:
                if s[j] == '\\': j += 2; continue
                if c == '`' and s[j] == '$' and j + 1 < n and s[j+1] == '{':
                    depth = 1; j += 2
                    while j < n and depth: depth += {'{':1,'}':-1}.get(s[j],0); j += 1
                    continue
                if c == "'" and s[j] == '\n': break
                j += 1
            seg = s[i:j+1]
            hits = pat.findall(seg)
            if hits:
                total += len(hits)
                line = s.count('\n', 0, i) + 1
                print(f"{p}:{line}: {hits[:6]}")
                if fix: seg = pat.sub(lambda m: '\\\\' + m.group(1), seg); changed = True
            out.append(seg); i = j + 1
        elif c == '"':
            j = i + 1
            while j < n and s[j] != '"' and s[j] != '\n':
                j += 2 if s[j] == '\\' else 1
            out.append(s[i:j+1]); i = j + 1
        elif s.startswith('//', i):
            j = s.find('\n', i); j = n if j < 0 else j
            out.append(s[i:j]); i = j
        else:
            out.append(c); i += 1
    if fix and changed: open(p, 'w').write(''.join(out))
print('total', total)
