"""Flag clichés and automatic-writing tics in scene lines and teasers (docs/NARRATIVA.md).
Usage: python3 qa/check_voice.py src/content/w02 [...]   -> exit 1 when something is flagged."""
import re, sys, glob
BLACK = [r'la ciudad nunca duerme', r'los n[úu]meros no mienten', r'nada es lo que parece', r'algo no cuadraba',
         r'escalofr[íi]o', r'el reloj corre', r'jugar con fuego', r'punta del iceberg', r'rompecabezas',
         r'sale a la luz|sali[óo] a la luz', r'en las sombras', r'mirada de acero', r'ne[óo]n sangr', r'la lluvia lavaba',
         r'\bqu[ée] conveniente\b', r'^interesante\b', r'qu[ée] coordinaci[óo]n', r'explicaci[óo]n preciosa', r'\bme gusta cuando\b',
         r'\bno (?:es|son|era|fue)\b[^.]*,\s*sino\b', r'\bno solo\b[^.]*\bsino\b', r'—|–', r'\bel agua no miente\b']
issues, n = [], 0
files = []
for a in sys.argv[1:]:
    files += sorted(glob.glob(a + '/c*.tsx') + glob.glob(a + '/final.tsx')) if not a.endswith('.tsx') else [a]
for f in files:
    s = open(f).read()
    texts = [m.group(3) for m in re.finditer(r"who: '(\w+)',\s*text:\s*(['`])(.*?)\2,?\s*\}", s, re.S)]
    texts += re.findall(r"teaser:\s*'([^']*)'", s)
    for t in texts:
        n += 1
        low = t.lower()
        for b in BLACK:
            if re.search(b, low):
                issues.append(f"{f.split('src/content/')[-1]}: «{t[:90]}» → {b}")
        # quoted documents («…») do not count as narration
        if len(re.findall(r'[.!?…](?:\s|$)', re.sub(r'«[^»]*»', '«»', t))) > 3:
            issues.append(f"{f.split('src/content/')[-1]}: más de tres frases: «{t[:90]}»")
print(f'líneas revisadas: {n}, alertas: {len(issues)}')
for i in issues:
    print('  ', i)
sys.exit(1 if issues else 0)
