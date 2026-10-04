// The Forge's expression model. Small on purpose: enough to state and rewrite the identities
// that matter for Active Inference (logs, exponentials, sums, products, normalization),
// with exact structural equality and a conservative positivity checker for side conditions.

export type Expr =
  | { k: 'num'; v: number; tex?: string }
  | { k: 'sym'; id: string; tex: string; pos?: boolean; val?: number }
  | { k: 'idx'; base: string; tex: string; i: Expr; pos?: boolean; tpl?: string }
  | { k: 'add'; xs: Expr[] }
  | { k: 'mul'; xs: Expr[] }
  | { k: 'neg'; x: Expr }
  | { k: 'div'; n: Expr; d: Expr }
  | { k: 'pow'; b: Expr; e: Expr }
  | { k: 'ln'; x: Expr }
  | { k: 'exp'; x: Expr }
  | { k: 'big'; op: 'sum' | 'prod'; i: string; lo: Expr; hi: Expr; body: Expr }
  | { k: 'fn'; f: string; tex: string; args: Expr[]; pos?: boolean };

export type Path = number[];

// ---------- constructors ----------
export const num = (v: number, tex?: string): Expr => ({ k: 'num', v, tex });
export const sym = (id: string, tex = id, pos = false): Expr => ({ k: 'sym', id, tex, pos });
export const E_CONST: Expr = { k: 'sym', id: 'e', tex: 'e', pos: true, val: Math.E };
export const add = (...xs: Expr[]): Expr => ({ k: 'add', xs });
export const mul = (...xs: Expr[]): Expr => ({ k: 'mul', xs });
export const neg = (x: Expr): Expr => ({ k: 'neg', x });
export const div = (n: Expr, d: Expr): Expr => ({ k: 'div', n, d });
export const pow = (b: Expr, e: Expr): Expr => ({ k: 'pow', b, e });
export const ln = (x: Expr): Expr => ({ k: 'ln', x });
export const exp = (x: Expr): Expr => ({ k: 'exp', x });

// ---------- traversal ----------
export function children(e: Expr): Expr[] {
  switch (e.k) {
    case 'add':
    case 'mul':
      return e.xs;
    case 'neg':
    case 'ln':
    case 'exp':
      return [e.x];
    case 'div':
      return [e.n, e.d];
    case 'pow':
      return [e.b, e.e];
    case 'big':
      return [e.lo, e.hi, e.body];
    case 'fn':
      return e.args;
    case 'idx':
      return [e.i];
    default:
      return [];
  }
}

export function withChildren(e: Expr, cs: Expr[]): Expr {
  switch (e.k) {
    case 'add':
      return { ...e, xs: cs };
    case 'mul':
      return { ...e, xs: cs };
    case 'neg':
      return { ...e, x: cs[0] };
    case 'ln':
      return { ...e, x: cs[0] };
    case 'exp':
      return { ...e, x: cs[0] };
    case 'div':
      return { ...e, n: cs[0], d: cs[1] };
    case 'pow':
      return { ...e, b: cs[0], e: cs[1] };
    case 'big':
      return { ...e, lo: cs[0], hi: cs[1], body: cs[2] };
    case 'fn':
      return { ...e, args: cs };
    case 'idx':
      return { ...e, i: cs[0] };
    default:
      return e;
  }
}

export function getAt(e: Expr, path: Path): Expr | undefined {
  let cur: Expr | undefined = e;
  for (const i of path) {
    if (!cur) return undefined;
    cur = children(cur)[i];
  }
  return cur;
}

export function setAt(e: Expr, path: Path, node: Expr): Expr {
  if (path.length === 0) return node;
  const [h, ...rest] = path;
  const cs = children(e).slice();
  cs[h] = setAt(cs[h], rest, node);
  return withChildren(e, cs);
}

export const pathKey = (p: Path) => 'p' + p.join('-');
export const parsePathKey = (s: string): Path => (s === 'p' ? [] : s.slice(1).split('-').map(Number));

// ---------- canonical key (commutative-aware structural equality) ----------
function numKey(v: number) {
  const r = Math.round(v * 1e9) / 1e9;
  return String(Object.is(r, -0) ? 0 : r);
}
export function key(e: Expr, env: Record<string, string> = {}, depth = 0): string {
  const k = (x: Expr) => key(x, env, depth);
  switch (e.k) {
    case 'num':
      return 'n' + numKey(e.v);
    case 'sym':
      return env[e.id] ?? 's:' + e.id;
    case 'idx':
      return `i:${e.base}[${k(e.i)}]`;
    case 'add':
      return 'add(' + e.xs.map(k).sort().join(',') + ')';
    case 'mul':
      return 'mul(' + e.xs.map(k).sort().join(',') + ')';
    case 'neg':
      return 'neg(' + k(e.x) + ')';
    case 'div':
      return 'div(' + k(e.n) + ',' + k(e.d) + ')';
    case 'pow':
      return 'pow(' + k(e.b) + ',' + k(e.e) + ')';
    case 'ln':
      return 'ln(' + k(e.x) + ')';
    case 'exp':
      return 'exp(' + k(e.x) + ')';
    case 'big': {
      // bound index names are irrelevant: Σ_j w_j ≡ Σ_k w_k (alpha-equivalence)
      const inner = { ...env, [e.i]: '#' + depth };
      return `${e.op}[${k(e.lo)}..${k(e.hi)}](${key(e.body, inner, depth + 1)})`;
    }
    case 'fn':
      return `fn:${e.f}(${e.args.map(k).join(',')})`;
  }
}
export const same = (a: Expr, b: Expr) => key(tidy(a)) === key(tidy(b));

/** Free symbol ids (index variables of big operators are bound). */
export function freeSyms(e: Expr, bound: Set<string> = new Set()): Set<string> {
  const out = new Set<string>();
  const walk = (x: Expr, b: Set<string>) => {
    if (x.k === 'sym') {
      if (x.val === undefined && !b.has(x.id)) out.add(x.id);
      return;
    }
    if (x.k === 'idx') {
      out.add(x.base + '_');
      walk(x.i, b);
      return;
    }
    if (x.k === 'fn') out.add('fn:' + x.f);
    if (x.k === 'big') {
      walk(x.lo, b);
      walk(x.hi, b);
      walk(x.body, new Set([...b, x.i]));
      return;
    }
    children(x).forEach((c) => walk(c, b));
  };
  walk(e, bound);
  return out;
}

/** Does expression mention the variable `v` (as a symbol or as an index)? */
export function mentions(e: Expr, v: string): boolean {
  if (e.k === 'sym') return e.id === v;
  if (e.k === 'big' && e.i === v) return mentions(e.lo, v) || mentions(e.hi, v);
  return children(e).some((c) => mentions(c, v));
}

/** Replace symbol `v` by `by` everywhere it is free. */
export function substitute(e: Expr, v: string, by: Expr): Expr {
  if (e.k === 'sym') return e.id === v ? by : e;
  if (e.k === 'big' && e.i === v) return { ...e, lo: substitute(e.lo, v, by), hi: substitute(e.hi, v, by) };
  const cs = children(e);
  if (!cs.length) return e;
  return withChildren(
    e,
    cs.map((c) => substitute(c, v, by)),
  );
}

// ---------- numeric evaluation ----------
export function evaluate(e: Expr, env: Record<string, number> = {}): number {
  switch (e.k) {
    case 'num':
      return e.v;
    case 'sym':
      return e.val ?? env[e.id] ?? NaN;
    case 'idx': {
      const i = evaluate(e.i, env);
      return env[`${e.base}_${i}`] ?? NaN;
    }
    case 'add':
      return e.xs.reduce((s, x) => s + evaluate(x, env), 0);
    case 'mul':
      return e.xs.reduce((s, x) => s * evaluate(x, env), 1);
    case 'neg':
      return -evaluate(e.x, env);
    case 'div':
      return evaluate(e.n, env) / evaluate(e.d, env);
    case 'pow':
      return Math.pow(evaluate(e.b, env), evaluate(e.e, env));
    case 'ln': {
      const v = evaluate(e.x, env);
      return v > 0 ? Math.log(v) : v === 0 ? -Infinity : NaN;
    }
    case 'exp':
      return Math.exp(evaluate(e.x, env));
    case 'big': {
      const lo = evaluate(e.lo, env);
      const hi = evaluate(e.hi, env);
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || hi - lo > 1000) return NaN;
      let acc = e.op === 'sum' ? 0 : 1;
      for (let i = lo; i <= hi; i++) {
        const v = evaluate(e.body, { ...env, [e.i]: i });
        acc = e.op === 'sum' ? acc + v : acc * v;
      }
      return acc;
    }
    case 'fn':
      return NaN;
  }
}

// ---------- sign analysis for side conditions ----------
export type Sign = 'pos' | 'zero' | 'neg' | 'nonneg' | 'unknown';
export function sign(e: Expr): Sign {
  switch (e.k) {
    case 'num':
      return e.v > 0 ? 'pos' : e.v < 0 ? 'neg' : 'zero';
    case 'sym':
      if (e.val !== undefined) return e.val > 0 ? 'pos' : e.val < 0 ? 'neg' : 'zero';
      return e.pos ? 'pos' : 'unknown';
    case 'idx':
      return e.pos ? 'pos' : 'unknown';
    case 'fn':
      return e.pos ? 'pos' : 'unknown';
    case 'exp':
      return 'pos';
    case 'neg': {
      const s = sign(e.x);
      return s === 'pos' ? 'neg' : s === 'neg' ? 'pos' : s === 'zero' ? 'zero' : 'unknown';
    }
    case 'mul':
    case 'div': {
      const ss = e.k === 'mul' ? e.xs.map(sign) : [sign(e.n), sign(e.d)];
      if (ss.some((s) => s === 'unknown' || s === 'nonneg')) return 'unknown';
      if (ss.includes('zero')) return e.k === 'div' && ss[1] === 'zero' ? 'unknown' : 'zero';
      const negs = ss.filter((s) => s === 'neg').length;
      return negs % 2 ? 'neg' : 'pos';
    }
    case 'add': {
      const ss = e.xs.map(sign);
      if (ss.every((s) => s === 'pos' || s === 'zero' || s === 'nonneg'))
        return ss.some((s) => s === 'pos') ? 'pos' : 'nonneg';
      if (ss.every((s) => s === 'neg' || s === 'zero')) return 'neg';
      const v = evaluate(e);
      return Number.isFinite(v) ? (v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero') : 'unknown';
    }
    case 'pow': {
      const sb = sign(e.b);
      if (sb === 'pos') return 'pos';
      if (e.e.k === 'num' && Number.isInteger(e.e.v) && e.e.v % 2 === 0) return 'nonneg';
      return 'unknown';
    }
    case 'ln': {
      const v = evaluate(e.x);
      if (Number.isFinite(v)) return v > 1 ? 'pos' : v < 1 && v > 0 ? 'neg' : v === 1 ? 'zero' : 'unknown';
      return 'unknown';
    }
    case 'big': {
      const sb = sign(e.body);
      if (sb === 'pos') return 'pos';
      if (e.op === 'sum' && (sb === 'nonneg' || sb === 'zero')) return 'nonneg';
      return 'unknown';
    }
  }
}
export const isPositive = (e: Expr) => sign(e) === 'pos';
export const isNonzero = (e: Expr) => {
  const s = sign(e);
  return s === 'pos' || s === 'neg';
};

// ---------- tidy: structural normalization applied after every move ----------
export function tidy(e: Expr): Expr {
  const cs = children(e).map(tidy);
  let x = cs.length ? withChildren(e, cs) : e;
  if (x.k === 'add') {
    const xs: Expr[] = [];
    for (const c of x.xs) {
      if (c.k === 'add') xs.push(...c.xs);
      else if (!(c.k === 'num' && c.v === 0)) xs.push(c);
    }
    if (xs.length === 0) return num(0);
    if (xs.length === 1) return xs[0];
    x = { k: 'add', xs };
  }
  if (x.k === 'mul') {
    const xs: Expr[] = [];
    for (const c of x.xs) {
      if (c.k === 'mul') xs.push(...c.xs);
      else if (!(c.k === 'num' && c.v === 1 && !c.tex)) xs.push(c);
    }
    if (xs.length === 0) return num(1);
    if (xs.length === 1) return xs[0];
    x = { k: 'mul', xs };
  }
  if (x.k === 'neg') {
    if (x.x.k === 'neg') return x.x.x;
    if (x.x.k === 'num' && !x.x.tex) return num(-x.x.v);
  }
  if (x.k === 'pow' && x.e.k === 'num' && x.e.v === 1) return x.b;
  if (x.k === 'div' && x.d.k === 'num' && x.d.v === 1) return x.n;
  return x;
}

// ---------- TeX printing with clickable node paths ----------
const PREC: Record<Expr['k'], number> = {
  add: 1,
  neg: 2,
  mul: 3,
  big: 3,
  div: 5,
  ln: 4,
  pow: 6,
  exp: 6,
  num: 7,
  sym: 7,
  idx: 7,
  fn: 7,
};

function numTex(v: number, tex?: string) {
  if (tex) return tex;
  if (Number.isInteger(v)) return String(v);
  const s = (Math.round(v * 1e4) / 1e4).toString();
  return s;
}

export interface PrintOpts {
  /** wrap nodes with \htmlData so the UI can select them */
  interactive?: boolean;
  selected?: string | null;
  fresh?: string[];
  hover?: string | null;
  /** candidate targets while the player chooses where to apply a rule */
  cands?: string[];
}

export function toTex(root: Expr, opts: PrintOpts = {}): string {
  const fresh = new Set(opts.fresh ?? []);
  const cands = new Set(opts.cands ?? []);
  const wrap = (p: Path, s: string) => {
    if (!opts.interactive) return s;
    const k = pathKey(p);
    let out = `\\htmlData{n=${k}}{${s}}`;
    if (opts.selected === k) out = `\\htmlClass{fx-sel}{${out}}`;
    else if (cands.has(k)) out = `\\htmlClass{fx-cand}{${out}}`;
    else if (opts.hover === k) out = `\\htmlClass{fx-hov}{${out}}`;
    else if (fresh.has(k)) out = `\\htmlClass{fx-new}{${out}}`;
    return out;
  };
  const go = (e: Expr, p: Path): string => wrap(p, raw(e, p));
  const paren = (e: Expr, p: Path, min: number) =>
    PREC[e.k] < min ? `\\left(${go(e, p)}\\right)` : go(e, p);
  const raw = (e: Expr, p: Path): string => {
    switch (e.k) {
      case 'num':
        return numTex(e.v, e.tex);
      case 'sym':
        return e.tex;
      case 'idx':
        return e.tpl
          ? e.tpl.replace('#', go(e.i, [...p, 0]))
          : `${e.tex}_{${go(e.i, [...p, 0])}}`;
      case 'add':
        return e.xs
          .map((c, i) => {
            const cp = [...p, i];
            if (i === 0) return paren(c, cp, 2);
            if (c.k === 'neg') return ' - ' + wrap(cp, paren(c.x, [...cp, 0], 2));
            if (c.k === 'num' && c.v < 0 && !c.tex) return ' - ' + wrap(cp, numTex(-c.v));
            return ' + ' + paren(c, cp, 2);
          })
          .join('');
      case 'neg':
        return '-' + paren(e.x, [...p, 0], 3);
      case 'mul': {
        let s = '';
        e.xs.forEach((c, i) => {
          const cp = [...p, i];
          const piece = paren(c, cp, 3);
          if (i > 0) {
            const prev = e.xs[i - 1];
            const simple = (x: Expr) => x.k === 'sym' || x.k === 'idx' || x.k === 'pow' || x.k === 'exp';
            const juxt = (prev.k === 'num' && simple(c)) || (simple(prev) && simple(c));
            s += juxt ? '\\,' : ' \\cdot ';
          }
          s += piece;
        });
        return s;
      }
      case 'div':
        return `\\frac{${go(e.n, [...p, 0])}}{${go(e.d, [...p, 1])}}`;
      case 'pow': {
        const b = e.b;
        const needs = PREC[b.k] < 7 || b.k === 'pow';
        const bt = needs ? `\\left(${go(b, [...p, 0])}\\right)` : go(b, [...p, 0]);
        return `{${bt}}^{${go(e.e, [...p, 1])}}`;
      }
      case 'ln': {
        const a = e.x;
        const atomic = a.k === 'sym' || a.k === 'idx' || a.k === 'num' || a.k === 'fn' || a.k === 'exp';
        return atomic ? `\\ln ${go(a, [...p, 0])}` : `\\ln\\left(${go(a, [...p, 0])}\\right)`;
      }
      case 'exp':
        return `e^{${go(e.x, [...p, 0])}}`;
      case 'big': {
        const op = e.op === 'sum' ? '\\sum' : '\\prod';
        const body = e.body;
        const bt = PREC[body.k] < 3 ? `\\left(${go(body, [...p, 2])}\\right)` : go(body, [...p, 2]);
        const hiT = e.hi.k === 'sym' && e.hi.id === '_' ? '' : `^{${go(e.hi, [...p, 1])}}`;
        return `${op}_{${e.i}=${go(e.lo, [...p, 0])}}${hiT} ${bt}`;
      }
      case 'fn':
        return `${e.tex}\\left(${e.args.map((a, i) => go(a, [...p, i])).join(', ')}\\right)`;
    }
  };
  return go(root, []);
}
