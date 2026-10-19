"""Check that rewritten scenes keep the same speakers, in the same order, as in git HEAD.
Usage: python3 qa/check_scene_shape.py src/content/w02  -> exit 1 on a mismatch."""
import re, sys, glob, subprocess
bad = []
for f in sorted(glob.glob(sys.argv[1] + '/c*.tsx') + glob.glob(sys.argv[1] + '/final.tsx')):
    now = re.findall(r"who: '(\w+)',\s*text:", open(f).read())
    try:
        old = re.findall(r"who: '(\w+)',\s*text:", subprocess.run(['git', 'show', f'HEAD:{f}'], capture_output=True, text=True, check=True).stdout)
    except subprocess.CalledProcessError:
        continue
    if now != old:
        bad.append(f"{f}: hablantes {old} -> {now}")
for b in bad:
    print(b)
print('ok' if not bad else f'{len(bad)} archivos con escenas distintas')
sys.exit(1 if bad else 0)
