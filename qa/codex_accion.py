"""Second pass with Codex: investigations with at least two actions, one case at a time, two workers.
A case is committed only if it compiles and qa/gate_sweep.mjs opens every gate; otherwise it is
restored and written to work/codex/accion-review.txt. Stops at the usage limit. Restartable.
Usage: python3 qa/codex_accion.py w03 w04 ... [--workers=2]"""
import glob, os, re, subprocess, sys, threading, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = "work/codex/out"
DONE = "work/codex/accion-done.txt"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
workers = int(next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--workers=")), 2))
done = set(open(DONE).read().split()) if os.path.exists(DONE) else set()

def gates(path):
    t = open(path, encoding="utf8").read()
    i = t.find("kind: 'demo'")
    if i < 0:
        return 9
    j = t.find("kind: 'challenge'", i)
    return len(re.findall(r"^\s*gate:", t[i : j if j > 0 else None], re.M))

queue = [
    f
    for w in args
    for f in sorted(glob.glob(f"src/content/{w}/c*.tsx") + glob.glob(f"src/content/{w}/final.tsx"))
    if f not in done and gates(f) < 2
]
print(len(queue), "casos", flush=True)
contract = open("docs/CONTRATO-ACCION.md", encoding="utf8").read()
lock = threading.Lock()
build = threading.Lock()
stop = threading.Event()

def sh(*a):
    return subprocess.run(a, capture_output=True, text=True)

def git(*a):
    for _ in range(6):
        r = sh("git", *a)
        if r.returncode == 0 or "index.lock" not in r.stderr:
            return r
        time.sleep(5)
    return r

def case_id(path):
    m = re.search(r"export const level[^=]*=\s*\{\s*id:\s*'([^']+)'", open(path, encoding="utf8").read())
    return m.group(1)

def codex(tag, prompt):
    pf = f"{OUT}/{tag}.prompt.md"
    open(pf, "w", encoding="utf8").write(prompt)
    with open(pf, encoding="utf8") as stdin, open(f"{OUT}/{tag}.log", "w", encoding="utf8") as log:
        subprocess.run(["codex", "exec", "--skip-git-repo-check", "-s", "workspace-write", "-c", 'model_reasoning_effort="medium"',
                        "-o", f"{OUT}/{tag}.md", "-"], stdin=stdin, stdout=log, stderr=subprocess.STDOUT)
    return open(f"{OUT}/{tag}.log", encoding="utf8", errors="ignore").read()

def verify(path):
    with build:
        r = sh("npx", "vite", "build", "--mode", "qa", "--outDir", "qa/snap")
        if r.returncode:
            return r.stdout[-600:] + r.stderr[-600:]
        g = sh("node", "qa/gate_sweep.mjs", case_id(path))
    out = g.stdout
    if "ATASCADO" in out or gates(path) < 2:
        return f"acciones: {gates(path)}\n" + out[-900:]
    return ""

def work():
    while not stop.is_set():
        with lock:
            if not queue:
                return
            path = queue.pop(0)
        tag = "accion-" + path.split("/")[2] + "-" + os.path.basename(path)[:-4]
        t0 = time.time()
        text = codex(tag, contract + f"\n\n## Tu caso\n\nArchivo: {path}\n")
        if re.search(r"usage limit|rate limit|hit your", text, re.I) and not git("status", "--short", path).stdout:
            print(f"{tag}: LÍMITE DE CODEX · {text[-300:]}", flush=True)
            stop.set()
            return
        problem = verify(path)
        if problem:
            codex(tag + "-2", contract + f"\n\n## Tu caso\n\nArchivo: {path}\n\nYa trabajaste este caso y la verificación falló:\n\n{problem}\n\nCorrígelo.\n")
            problem = verify(path)
        mins = (time.time() - t0) / 60
        if problem:
            print(f"{tag}: REVISAR ({mins:.0f} min)", flush=True)
            with lock:
                open("work/codex/accion-review.txt", "a").write(f"## {path}\n{problem}\n")
                git("checkout", "--", path)
            continue
        with lock:
            git("add", "--", path)
            r = git("commit", "-q", "-m", f"Investigación con acciones: {tag[7:]} (Codex), probada con qa/gate_sweep.mjs\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>", "--", path)
            if r.returncode == 0:
                open(DONE, "a").write(path + "\n")
        print(f"{tag}: ok ({mins:.0f} min)", flush=True)

ts = [threading.Thread(target=work) for _ in range(workers)]
[t.start() for t in ts]
[t.join() for t in ts]
print("cola terminada" if not stop.is_set() else "cola detenida por límite", len(queue), "pendientes", flush=True)
