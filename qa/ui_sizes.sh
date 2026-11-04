#!/bin/zsh
# full layout sweep of the frozen build at each size; one report per size in qa/out
cd "${0:a:h}/.."
for v in "$@"; do SNAP=${SNAP:-snap} node qa/sweep.mjs all $v 2>/dev/null | tail -1; done
