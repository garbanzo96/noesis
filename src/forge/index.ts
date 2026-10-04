import { getAt, pathKey, same, setAt, tidy, type Expr, type Path } from './expr';
import { RULE_BY_ID, type Rule } from './rules';
import { parse, type SymTable } from './parse';

export * from './expr';
export * from './rules';
export * from './parse';

export interface ForgePuzzle {
  id: string;
  title: string;
  /** rich text ($...$ math) explaining what to derive and why */
  brief: string;
  symbols?: SymTable;
  start: string;
  goal: string;
  /** rule ids available in the toolbox for this puzzle */
  rules: string[];
  /** number of moves of the reference derivation */
  par: number;
  hints?: string[];
  /** one line connecting the result with Active Inference */
  bridge?: string;
}

export type Move =
  | { ok: true; expr: Expr; fresh: string[]; rule: Rule }
  | { ok: false; reason: string; rule: Rule }
  | null;

/** Apply rule `ruleId` at `path`. null = pattern does not match there. */
export function applyAt(root: Expr, path: Path, ruleId: string): Move {
  const rule = RULE_BY_ID[ruleId];
  const node = getAt(root, path);
  if (!rule || !node) return null;
  const r = rule.apply(node);
  if (!r) return null;
  if (!r.ok) return { ok: false, reason: r.reason, rule };
  const next = tidy(setAt(root, path, r.out));
  // Mark the rewritten region as fresh (same path, if it still exists after tidy).
  return { ok: true, expr: next, fresh: getAt(next, path) ? [pathKey(path)] : [pathKey([])], rule };
}

/** Which rules match a node (for lighting up the toolbox). */
export function applicability(root: Expr, path: Path, ruleIds: string[]) {
  const out: Record<string, 'ok' | 'blocked' | 'no'> = {};
  for (const id of ruleIds) {
    const m = applyAt(root, path, id);
    out[id] = m === null ? 'no' : m.ok ? 'ok' : 'blocked';
  }
  return out;
}

export function loadPuzzle(p: ForgePuzzle) {
  return { start: tidy(parse(p.start, p.symbols)), goal: tidy(parse(p.goal, p.symbols)) };
}

export const reached = (cur: Expr, goal: Expr) => same(cur, goal);
