#!/bin/zsh
# Retoma las colas de Codex cuando vuelve su cuota. Uso: qa/codex_manana.sh [HHMM], por defecto 0702.
cd "$(dirname "$0")/.."
desde=${1:-0702}
until [ "$(date +%H%M)" -ge $desde ] && [ "$(date +%H%M)" -lt 2300 ]; do sleep 60; done
python3 qa/codex_accion.py w11 w12 w13 w03 w04 w06 w07 w14 w02 w05 --workers=2 >> work/codex/accion.log 2>&1
python3 qa/codex_queue.py w13 w05 w08 w04 w06 w07 w09 w14 --workers=2 >> work/codex/queue.log 2>&1
python3 qa/codex_queue.py w01 w02 w03 --gates --workers=2 >> work/codex/queue.log 2>&1
# dist se compila del árbol de trabajo: con src a medio editar publicaría cambios sin terminar
if [ -n "$(git status --short -- src)" ]; then
  echo "NO PUBLICADO: src con cambios sin commitear $(date)" >> work/codex/queue.log
elif npx tsc --noEmit -p tsconfig.json && npx vitest run && npx vite build; then
  git add dist
  git diff --cached --quiet || git commit -q -m "Compilación con las colas de Codex

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  # GitHub puede estar degradado: reintenta dos horas y solo entonces deja constancia del resultado real
  for i in {1..24}; do
    if git push -q origin main; then echo "publicado $(date)" >> work/codex/queue.log; exit 0; fi
    sleep 300
  done
  echo "PUSH FALLIDO $(date)" >> work/codex/queue.log
fi
