import { describe, expect, it } from 'vitest';
import { applyAt, applicability, evaluate, key, parse, same, tidy, toTex, type Expr, type Path } from '../src/forge';

const pos = { a: { tex: 'a', pos: true }, b: { tex: 'b', pos: true } };

function find(root: Expr, pred: (e: Expr) => boolean, path: Path = []): Path | null {
  if (pred(root)) return path;
  const cs =
    root.k === 'add' || root.k === 'mul'
      ? root.xs
      : root.k === 'neg' || root.k === 'ln' || root.k === 'exp'
        ? [root.x]
        : root.k === 'div'
          ? [root.n, root.d]
          : root.k === 'pow'
            ? [root.b, root.e]
            : root.k === 'big'
              ? [root.lo, root.hi, root.body]
              : root.k === 'fn'
                ? root.args
                : root.k === 'idx'
                  ? [root.i]
                  : [];
  for (let i = 0; i < cs.length; i++) {
    const r = find(cs[i], pred, [...path, i]);
    if (r) return r;
  }
  return null;
}
function step(e: Expr, pred: (e: Expr) => boolean, rule: string): Expr {
  const p = find(e, pred);
  expect(p, `node for ${rule}`).not.toBeNull();
  const m = applyAt(e, p!, rule);
  expect(m && m.ok, `${rule} should apply`).toBe(true);
  return (m as { expr: Expr }).expr;
}

describe('parser and printer', () => {
  it('parses precedence and prints TeX', () => {
    const e = parse('ln(a*b) + e^(x) - c/d', pos);
    expect(e.k).toBe('add');
    const t = toTex(e);
    expect(t).toContain('\\ln\\left(');
    expect(t).toContain('e^{x}');
    expect(t).toContain('\\frac{c}{d}');
    expect(t).toContain(' - ');
  });
  it('division is left associative over products', () => {
    const e = parse('a*b/c');
    expect(e.k).toBe('div');
  });
  it('evaluates sums', () => {
    expect(evaluate(parse('sum(i, 1, 4, i)'))).toBe(10);
    expect(evaluate(parse('ln(e^(3))'))).toBeCloseTo(3);
  });
  it('commutative equality', () => {
    expect(same(parse('ln(a) + ln(b)'), parse('ln(b) + ln(a)'))).toBe(true);
    expect(same(parse('a - b'), parse('b - a'))).toBe(false);
  });
});

describe('rules and side conditions', () => {
  it('ln of product requires positivity', () => {
    const free = parse('ln(x*y)');
    const m = applyAt(free, [], 'ln-mul');
    expect(m && !m.ok).toBe(true);
    const good = parse('ln(a*b)', pos);
    const m2 = applyAt(good, [], 'ln-mul');
    expect(m2 && m2.ok && same(m2.expr, parse('ln(a)+ln(b)', pos))).toBe(true);
  });
  it('ln(a+b) does not split', () => {
    const m = applyAt(parse('ln(a+b)', pos), [], 'ln-mul');
    expect(m).toBeNull();
  });
  it('softmax shift invariance in four moves', () => {
    const sym = { z: { tex: 'z' }, c: { tex: 'c' } };
    let e = tidy(parse('e^(z_i - c) / sum(j, 1, n, e^(z_j - c))', sym));
    const goal = tidy(parse('e^(z_i) / sum(j, 1, n, e^(z_j))', sym));
    e = step(e, (x) => x.k === 'exp' && x.x.k === 'add', 'exp-add');
    e = step(e, (x) => x.k === 'exp' && x.x.k === 'add', 'exp-add');
    e = step(e, (x) => x.k === 'big', 'big-factor');
    e = step(e, (x) => x.k === 'div', 'cancel');
    expect(key(e)).toBe(key(goal));
  });
  it('collapse and expand are inverse', () => {
    const e = parse('x_1 + x_2 + x_3');
    const m = applyAt(e, [], 'collapse');
    expect(m && m.ok).toBe(true);
    const s = (m as { expr: Expr }).expr;
    expect(s.k).toBe('big');
    const back = applyAt(s, [], 'expand');
    expect(back && back.ok && same(back.expr, e)).toBe(true);
  });
  it('log of iid likelihood becomes a sum', () => {
    const L = { L: { tex: 'L', tpl: 'p(x_{#}\\mid\\theta)', pos: true } };
    const e = parse('ln(prod(i, 1, N, L_i))', L);
    const m = applyAt(e, [], 'ln-prod');
    expect(m && m.ok && toTex(m.expr)).toContain('\\sum_{i=1}^{N} \\ln p(x_{i}\\mid\\theta)');
  });
  it('applicability lights the right rules', () => {
    const e = parse('ln(a*b)', pos);
    const a = applicability(e, [], ['ln-mul', 'ln-div', 'exp-add']);
    expect(a).toEqual({ 'ln-mul': 'ok', 'ln-div': 'no', 'exp-add': 'no' });
  });
  it('cancel refuses a factor that may be zero', () => {
    const m = applyAt(parse('(x*a)/(x*b)', pos), [], 'cancel');
    expect(m && !m.ok).toBe(true);
  });
  it('calc evaluates constant subtrees only', () => {
    expect(applyAt(parse('ln(e)'), [], 'calc')).toMatchObject({ ok: true });
    expect(applyAt(parse('ln(x)'), [], 'calc')).toBeNull();
  });
});

describe('alpha-equivalence and new rules', () => {
  it('bound index names do not matter', () => {
    expect(same(parse('sum(j, 1, n, w_j)'), parse('sum(k, 1, n, w_k)'))).toBe(true);
    expect(same(parse('sum(j, 1, n, w_j)'), parse('sum(k, 1, n, v_k)'))).toBe(false);
  });
  it('normalized weights sum to one in two moves', () => {
    const w = { w: { tex: 'w', pos: true } };
    let e = tidy(parse('sum(j, 1, n, w_j / sum(k, 1, n, w_k))', w));
    e = step(e, (x) => x.k === 'big' && x.body.k === 'div', 'big-factor');
    e = step(e, (x) => x.k === 'div', 'cancel');
    expect(key(e)).toBe(key(parse('1')));
  });
  it('add-cancel, add-collect, exp-div', () => {
    expect(applyAt(parse('a + b - b'), [], 'add-cancel')).toMatchObject({ ok: true });
    const m = applyAt(parse('x + x + x'), [], 'add-collect');
    expect(m && m.ok && same(m.expr, parse('3*x'))).toBe(true);
    const d = applyAt(parse('e^(a) / e^(b)'), [], 'exp-div');
    expect(d && d.ok && same(d.expr, parse('e^(a - b)'))).toBe(true);
  });
});
