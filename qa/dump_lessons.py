"""Per lesson: file, title, board labels and the first narration lines, to write context cards.
Usage: python3 qa/dump_lessons.py src/content/w03"""
import re, sys, glob
for d in sys.argv[1:]:
    for f in sorted(glob.glob(d + '/*.tsx')):
        s = open(f).read()
        for m in re.finditer(r"kind: 'lesson',", s):
            end = s.find('\n};', m.start())
            body = s[m.start(): end if end > 0 else len(s)]
            title = re.search(r"title: '([^']*)'", body)
            has = 'intro: {' in body
            labels = re.findall(r"label: '([^']*)'", body)
            says = [x[1] for x in re.findall(r"say:\s*(['\"`])(.*?)\1,?\s*\n", body, re.S)]
            sub = re.search(r"subtitle: '([^']*)'", s)
            print(f"## {f.split('content/')[1]} · {title.group(1) if title else '?'} · caso: {sub.group(1) if sub else ''}{' · YA TIENE' if has else ''}")
            print('   pasos:', ' | '.join(dict.fromkeys(labels)))
            for t in says[:3]:
                print('   -', t[:200])
