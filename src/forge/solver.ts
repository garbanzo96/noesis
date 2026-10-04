import { children, key, tidy, type Expr, type Path } from './expr';
import { applyAt, loadPuzzle, type ForgePuzzle } from './index';

function allPaths(e: Expr, p: Path = [], out: Path[] = []): Path[] {
  out.push(p);
  children(e).forEach((c, i) => allPaths(c, [...p, i], out));
  return out;
}

/**
 * Breadth-first search over legal moves. Returns the shortest derivation (rule ids) that
 * reaches the goal within maxDepth, or null. Used by tests to guarantee every authored
 * puzzle is solvable within its par.
 */
export function solveForge(p: ForgePuzzle, maxDepth = p.par + 1): string[] | null {
  const { start, goal } = loadPuzzle(p);
  const target = key(tidy(goal));
  if (key(start) === target) return [];
  let frontier: { e: Expr; moves: string[] }[] = [{ e: start, moves: [] }];
  const seen = new Set([key(start)]);
  for (let d = 0; d < maxDepth; d++) {
    const next: typeof frontier = [];
    for (const { e, moves } of frontier) {
      for (const path of allPaths(e)) {
        for (const r of p.rules) {
          const m = applyAt(e, path, r);
          if (!m || !m.ok) continue;
          const k = key(m.expr);
          if (k === target) return [...moves, r];
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ e: m.expr, moves: [...moves, r] });
        }
      }
    }
    if (next.length > 20000) break;
    frontier = next;
  }
  return null;
}
