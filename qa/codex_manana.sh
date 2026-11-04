#!/bin/zsh
# Retoma las colas de Codex cuando vuelve su cuota. Prioriza los mundos del camino a POMDP.
cd "$(dirname "$0")/.."
until [ "$(date +%H%M)" -ge 0702 ] && [ "$(date +%H%M)" -lt 2300 ]; do sleep 60; done
python3 qa/codex_queue.py w10 w11 w12 w13 w05 w08 w04 w06 w07 w09 w14 --workers=2 >> work/codex/queue.log 2>&1
python3 qa/codex_accion.py w11 w12 w13 w03 w04 w06 w07 w14 w02 w05 --workers=2 >> work/codex/accion.log 2>&1
python3 qa/codex_queue.py w01 w02 w03 --gates --workers=2 >> work/codex/queue.log 2>&1
if npx tsc --noEmit -p tsconfig.json && npx vitest run && npx vite build; then
  git add dist && git commit -q -m "Compilación con las colas de Codex de la mañana

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  git push -q origin main
  echo publicado >> work/codex/queue.log
fi
