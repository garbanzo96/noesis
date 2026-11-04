"""Runs the textbook pass case by case with Codex, two at a time at most, and commits each case that
passes qa/check_text_only.py. Stops when Codex reports its usage limit. Restartable: cases already
in work/codex/done.txt are skipped. Usage: python3 qa/codex_queue.py [w01 w02 ...] [--workers=2]"""
import glob, os, re, subprocess, sys, threading, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = "work/codex/out"
os.makedirs(OUT, exist_ok=True)
GATES = "--gates" in sys.argv
DONE = "work/codex/gates-done.txt" if GATES else "work/codex/done.txt"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
workers = int(next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--workers=")), 2))

def cases(world):
    d = f"src/content/{world}"
    out = []
    for f in sorted(glob.glob(d + "/c*.tsx")) + [d + "/final.tsx"]:
        s = open(f, encoding="utf8").read()
        group = [f]
        n = re.match(r"c(\d+)", os.path.basename(f))
        if world == "w01" and n:
            group.append(d + ("/lessons.tsx" if n.group(1) == "1" else f"/lesson-c{n.group(1)}.tsx"))
        if any("kind: 'lesson'" in open(g, encoding="utf8").read() or "kind: 'demo'" in open(g, encoding="utf8").read() for g in group):
            out.append(group)
    return out

done = set(open(DONE).read().split()) if os.path.exists(DONE) else set()
queue = [g for w in (args or sorted(os.listdir("src/content"))) if re.fullmatch(r"w\d\d", w) for g in cases(w) if g[0] not in done]
lock = threading.Lock()
stop = threading.Event()
contract = open("docs/CONTRATO-LIBRO.md", encoding="utf8").read()
if GATES:
    contract += "\n\n## Esta pasada\n\nSolo `gate` y `after`. No toques `say`.\n"

def git(*a):
    for _ in range(6):
        r = subprocess.run(["git", *a], capture_output=True, text=True)
        if r.returncode == 0 or "index.lock" not in r.stderr:
            return r
        time.sleep(5)
    return r

def work():
    while not stop.is_set():
        with lock:
            if not queue:
                return
            group = queue.pop(0)
        name = os.path.basename(group[0])[:-4]
        tag = group[0].split("/")[2] + "-" + name
        prompt = contract + "\n\n## Tu caso\n\nArchivos: " + ", ".join(group) + "\n"
        pf = f"{OUT}/{tag}.prompt.md"
        open(pf, "w", encoding="utf8").write(prompt)
        t0 = time.time()
        with open(pf, encoding="utf8") as stdin, open(f"{OUT}/{tag}.log", "w", encoding="utf8") as log:
            subprocess.run(
                ["codex", "exec", "--skip-git-repo-check", "-s", "workspace-write", "-c", 'model_reasoning_effort="medium"',
                 "-o", f"{OUT}/{tag}.md", "-"],
                stdin=stdin, stdout=log, stderr=subprocess.STDOUT,
            )
        text = open(f"{OUT}/{tag}.log", encoding="utf8", errors="ignore").read()
        mins = (time.time() - t0) / 60
        if re.search(r"usage limit|rate limit|hit your", text, re.I) and not git("status", "--short", *group).stdout:
            print(f"{tag}: LÍMITE DE CODEX · {text[-300:]}", flush=True)
            stop.set()
            return
        chk = subprocess.run(["python3", "qa/check_text_only.py", *group], capture_output=True, text=True)
        changed = git("status", "--short", *group).stdout.strip()
        if chk.returncode or not changed:
            print(f"{tag}: REVISAR ({mins:.0f} min) {chk.stdout[:400] or 'sin cambios'}", flush=True)
            with lock:
                open("work/codex/review.txt", "a").write(f"{tag}\n{chk.stdout}\n")
            continue
        with lock:
            git("add", "--", *group)
            r = git("commit", "-q", "-m", f"Clase con texto de libro y acciones explicadas: {tag} (Codex)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>", "--", *group)
            if r.returncode == 0:
                open(DONE, "a").write(group[0] + "\n")
        print(f"{tag}: ok ({mins:.0f} min) {'' if r.returncode == 0 else r.stderr[:200]}", flush=True)

ts = [threading.Thread(target=work) for _ in range(workers)]
for t in ts:
    t.start()
for t in ts:
    t.join()
print("cola terminada" if not stop.is_set() else "cola detenida por límite", len(queue), "pendientes", flush=True)
