"""Builds the four POMDP cases and the review of World 13 with Codex, two at a time.
Usage: python3 qa/codex_pomdp.py c9 c10 ...  Each task only writes its own file."""
import subprocess, sys, threading

TASKS = {
    "c9": ("13.9", "src/content/w13/c9-mesa.tsx"),
    "c10": ("13.10", "src/content/w13/c10-oculto.tsx"),
    "c11": ("13.11", "src/content/w13/c11-creencia.tsx"),
    "c12": ("13.12", "src/content/w13/c12-mirar.tsx"),
    "final": ("13.★", "src/content/w13/final.tsx"),
}
CONTRACT = open("docs/CONTRATO-LIBRO.md", encoding="utf8").read()
SPEC = open("docs/MUNDO-13-POMDP.md", encoding="utf8").read()
HEAD = """Eres parte de un equipo que pule NÓESIS, un juego en español de Chile para aprender matemáticas con
una investigación policial. Vas a construir UN caso nuevo completo del Mundo 13, siguiendo el guion de
abajo al pie de la letra en contenido y números.

Lee primero, enteros: `src/content/w13/c5-bellman.tsx` (forma del caso), `src/content/w13/kit.tsx` (modelo
y funciones que debes usar), `src/content/shared/ui.tsx` y `src/content/shared/lesson.tsx` (componentes),
`src/game/level/types.ts` y `docs/NARRATIVA.md` (voz de las escenas).

Reglas de código: solo escribes el archivo de tu caso (salvo que el guion diga otra cosa). No tocas
`index.ts`, `kit.tsx`, `tests/`, ni otros casos. Atributos JSX `tex="..."` llevan una barra (`\\frac`);
strings JS llevan dos (`\\\\frac`). Etiquetas de escenario con `Cap` o `Html`; lo que vaya dentro de un
círculo debe caber dentro. `Knob` para perillas. Cada `gate` tiene `unlock()` en el código y su `after`.
El caso exporta `level`, `lesson`, `glyphs` y `ref`. Pasos: scene, demo, challenge (3 rondas), scene; la
clase se inserta sola. `say` de clase entre 3 y 6 frases y como máximo 520 caracteres.

Verifica: `npx tsc --noEmit -p tsconfig.json` y `npx vitest run tests/content.test.ts tests/pomdp.test.ts`
deben pasar. No corras git. Termina listando lo hecho y lo que falte.

"""
lock = threading.Lock()
queue = sys.argv[1:]

def work():
    while True:
        with lock:
            if not queue:
                return
            key = queue.pop(0)
        code, path = TASKS[key]
        prompt = HEAD + f"## Tu tarea\n\nCaso {code}, archivo `{path}`.\n\n# Guion\n\n{SPEC}\n\n# Reglas de texto\n\n{CONTRACT}\n"
        pf = f"work/codex/out/pomdp-{key}.prompt.md"
        open(pf, "w", encoding="utf8").write(prompt)
        with open(pf, encoding="utf8") as stdin, open(f"work/codex/out/pomdp-{key}.log", "w", encoding="utf8") as log:
            subprocess.run(["codex", "exec", "--skip-git-repo-check", "-s", "workspace-write", "-c", 'model_reasoning_effort="high"',
                            "-o", f"work/codex/out/pomdp-{key}.md", "-"], stdin=stdin, stdout=log, stderr=subprocess.STDOUT)
        print(key, "terminado", flush=True)

ts = [threading.Thread(target=work) for _ in range(2)]
[t.start() for t in ts]
[t.join() for t in ts]
print("pomdp listo", flush=True)
