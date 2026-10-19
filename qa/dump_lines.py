"""Print scene lines and teaser of each case in a world: python3 qa/dump_lines.py src/content/w05"""
import re, sys, glob
for a in sys.argv[1:]:
    for f in sorted(glob.glob(a + '/c*.tsx')) + sorted(glob.glob(a + '/final.tsx')):
        s = open(f).read()
        t = re.search(r"teaser:\s*'([^']*)'", s)
        print('##', f, '\nTEASER:', t.group(1) if t else None)
        for m in re.finditer(r"who: '(\w+)',\s*text:\s*(['`])(.*?)\2,?\s*\}", s, re.S):
            print(f"  {m.group(1)}: {m.group(3)}")
