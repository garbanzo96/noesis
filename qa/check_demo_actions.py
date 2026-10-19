"""Count gates (hands-on actions) in the investigation of a case file. Exit 1 if fewer than 2.
Usage: python3 qa/check_demo_actions.py src/content/w08/c1-pulso.tsx"""
import re, sys
s = open(sys.argv[1]).read()
demos = re.findall(r"kind: 'demo',(.*?)\n    \},\n", s, re.S)
gates = sum(len(re.findall(r"\n\s+gate:", d)) for d in demos)
beats = sum(len(re.findall(r"\n\s+say:", d)) for d in demos)
print(f"{sys.argv[1]}: {beats} pasos, {gates} acciones")
sys.exit(0 if gates >= 2 else 1)
