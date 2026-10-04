import {
  E_CONST,
  add,
  children,
  div,
  evaluate,
  exp,
  freeSyms,
  isNonzero,
  isPositive,
  key,
  ln,
  mentions,
  mul,
  neg,
  num,
  substitute,
  toTex,
  withChildren,
  type Expr,
} from './expr';

// Every move in the Forge is an identity. A rule either does not match the selected node
// (null → dimmed), matches but its side condition cannot be guaranteed (blocked, with the
// exact reason), or rewrites the node. Side conditions are part of the mathematics taught.
export type RuleResult = { ok: true; out: Expr } | { ok: false; reason: string };
export interface Rule {
  id: string;
  name: string;
  schema: string;
  cond?: string;
  apply: (node: Expr) => RuleResult | null;
}

const T = (e: Expr) => toTex(e);
const ok = (out: Expr): RuleResult => ({ ok: true, out });
const blocked = (reason: string): RuleResult => ({ ok: false, reason });
const factorsOf = (e: Expr): Expr[] => (e.k === 'mul' ? e.xs : [e]);
const termsOf = (e: Expr): Expr[] => (e.k === 'add' ? e.xs : [e]);
const product = (xs: Expr[]): Expr => (xs.length === 0 ? num(1) : xs.length === 1 ? xs[0] : mul(...xs));
const sumOf = (xs: Expr[]): Expr => (xs.length === 0 ? num(0) : xs.length === 1 ? xs[0] : add(...xs));
const negate = (e: Expr): Expr => (e.k === 'neg' ? e.x : e.k === 'num' ? num(-e.v) : neg(e));

function needPositive(xs: Expr[]): RuleResult | null {
  const bad = xs.find((x) => !isPositive(x));
  return bad ? blocked(`Condición no garantizada: $${T(bad)}>0$. $\\ln$ solo está definido en $(0,\\infty)$.`) : null;
}

/** Replace numeric indices equal to k inside idx nodes by the symbol i (used to detect Σ patterns). */
function generalize(e: Expr, k: number, i: string): Expr {
  if (e.k === 'idx' && e.i.k === 'num' && e.i.v === k) return { ...e, i: { k: 'sym', id: i, tex: i } };
  const cs = children(e);
  return cs.length ? withChildren(e, cs.map((c) => generalize(c, k, i))) : e;
}
function firstNumericIndex(e: Expr): number | null {
  if (e.k === 'idx' && e.i.k === 'num') return e.i.v;
  for (const c of children(e)) {
    const r = firstNumericIndex(c);
    if (r !== null) return r;
  }
  return null;
}
const freshIndex = (e: Expr) => ['i', 'j', 'k', 'n', 'm'].find((v) => !mentions(e, v)) ?? 'i';

function collapse(op: 'sum' | 'prod', xs: Expr[]): RuleResult | null {
  if (xs.length < 2) return null;
  const k0 = firstNumericIndex(xs[0]);
  if (k0 === null) return null;
  const iv = freshIndex(op === 'sum' ? add(...xs) : mul(...xs));
  const body = generalize(xs[0], k0, iv);
  if (key(body) === key(xs[0])) return null;
  for (let t = 1; t < xs.length; t++) {
    if (key(generalize(xs[t], k0 + t, iv)) !== key(body)) return null;
  }
  return ok({ k: 'big', op, i: iv, lo: num(k0), hi: num(k0 + xs.length - 1), body });
}

function expand(e: Expr): RuleResult | null {
  if (e.k !== 'big') return null;
  if (e.lo.k !== 'num' || e.hi.k !== 'num')
    return blocked('Solo puedo desplegar un operador con límites numéricos explícitos.');
  const n = e.hi.v - e.lo.v + 1;
  if (n < 1) return ok(num(e.op === 'sum' ? 0 : 1));
  if (n > 8) return blocked('Demasiados términos para desplegarlos a mano (máx. 8).');
  const terms: Expr[] = [];
  for (let k = e.lo.v; k <= e.hi.v; k++) terms.push(substitute(e.body, e.i, num(k)));
  return ok(e.op === 'sum' ? add(...terms) : mul(...terms));
}

export const RULES: Rule[] = [
  {
    id: 'ln-mul',
    name: 'Log de un producto',
    schema: '\\ln(ab)=\\ln a+\\ln b',
    cond: 'a,b>0',
    apply: (e) => {
      if (e.k !== 'ln' || e.x.k !== 'mul') return null;
      return needPositive(e.x.xs) ?? ok(add(...e.x.xs.map((f) => ln(f))));
    },
  },
  {
    id: 'ln-div',
    name: 'Log de un cociente',
    schema: '\\ln\\tfrac{a}{b}=\\ln a-\\ln b',
    cond: 'a,b>0',
    apply: (e) => {
      if (e.k !== 'ln' || e.x.k !== 'div') return null;
      return needPositive([e.x.n, e.x.d]) ?? ok(add(ln(e.x.n), neg(ln(e.x.d))));
    },
  },
  {
    id: 'ln-pow',
    name: 'Log de una potencia',
    schema: '\\ln a^{r}=r\\ln a',
    cond: 'a>0',
    apply: (e) => {
      if (e.k !== 'ln' || e.x.k !== 'pow') return null;
      return needPositive([e.x.b]) ?? ok(mul(e.x.e, ln(e.x.b)));
    },
  },
  {
    id: 'ln-exp',
    name: 'ln deshace exp',
    schema: '\\ln e^{x}=x',
    apply: (e) => (e.k === 'ln' && e.x.k === 'exp' ? ok(e.x.x) : null),
  },
  {
    id: 'exp-ln',
    name: 'exp deshace ln',
    schema: 'e^{\\ln x}=x',
    cond: 'x>0',
    apply: (e) => {
      if (e.k !== 'exp' || e.x.k !== 'ln') return null;
      return isPositive(e.x.x)
        ? ok(e.x.x)
        : blocked(`$e^{\\ln x}=x$ exige $x>0$; no está garantizado para $${T(e.x.x)}$.`);
    },
  },
  {
    id: 'ln-consts',
    name: 'Valores notables',
    schema: '\\ln 1=0,\\;\\ln e=1,\\;e^{0}=1',
    apply: (e) => {
      if (e.k === 'ln' && e.x.k === 'num' && e.x.v === 1) return ok(num(0));
      if (e.k === 'ln' && e.x.k === 'sym' && e.x.id === 'e') return ok(num(1));
      if (e.k === 'exp' && e.x.k === 'num' && e.x.v === 0) return ok(num(1));
      return null;
    },
  },
  {
    id: 'exp-add',
    name: 'exp de una suma',
    schema: 'e^{a+b}=e^{a}e^{b}',
    apply: (e) => (e.k === 'exp' && e.x.k === 'add' ? ok(mul(...e.x.xs.map((t) => exp(t)))) : null),
  },
  {
    id: 'exp-merge',
    name: 'Juntar exponenciales',
    schema: 'e^{a}e^{b}=e^{a+b}',
    apply: (e) => {
      if (e.k !== 'mul') return null;
      const exps = e.xs.filter((x) => x.k === 'exp') as Extract<Expr, { k: 'exp' }>[];
      if (exps.length < 2) return null;
      const rest = e.xs.filter((x) => x.k !== 'exp');
      return ok(product([...rest, exp(add(...exps.map((x) => x.x)))]));
    },
  },
  {
    id: 'exp-neg',
    name: 'Exponente negativo',
    schema: 'e^{-a}=\\tfrac{1}{e^{a}}',
    apply: (e) => (e.k === 'exp' && e.x.k === 'neg' ? ok(div(num(1), exp(e.x.x))) : null),
  },
  {
    id: 'exp-pow',
    name: 'Potencia de exp',
    schema: '(e^{a})^{\\gamma}=e^{\\gamma a}',
    apply: (e) => (e.k === 'pow' && e.b.k === 'exp' ? ok(exp(mul(e.e, e.b.x))) : null),
  },
  {
    id: 'pow-merge',
    name: 'Sumar exponentes',
    schema: 'a^{m}a^{n}=a^{m+n}',
    apply: (e) => {
      if (e.k !== 'mul') return null;
      const base = (x: Expr) => (x.k === 'pow' ? x.b : x);
      const ex = (x: Expr) => (x.k === 'pow' ? x.e : num(1));
      for (let i = 0; i < e.xs.length; i++) {
        const b = key(base(e.xs[i]));
        const group = e.xs.filter((x) => key(base(x)) === b && x.k !== 'num');
        if (group.length >= 2) {
          const rest = e.xs.filter((x) => !group.includes(x));
          const merged: Expr = { k: 'pow', b: base(group[0]), e: add(...group.map(ex)) };
          return ok(product([...rest, merged]));
        }
      }
      return null;
    },
  },
  {
    id: 'ln-prod',
    name: 'Log de un ∏',
    schema: '\\ln\\prod_i x_i=\\sum_i\\ln x_i',
    cond: 'x_i>0',
    apply: (e) => {
      if (e.k !== 'ln' || e.x.k !== 'big' || e.x.op !== 'prod') return null;
      const b = e.x;
      return needPositive([b.body]) ?? ok({ ...b, op: 'sum', body: ln(b.body) });
    },
  },
  {
    id: 'exp-sum',
    name: 'exp de un Σ',
    schema: 'e^{\\sum_i a_i}=\\prod_i e^{a_i}',
    apply: (e) =>
      e.k === 'exp' && e.x.k === 'big' && e.x.op === 'sum'
        ? ok({ ...e.x, op: 'prod', body: exp(e.x.body) })
        : null,
  },
  {
    id: 'expand',
    name: 'Desplegar',
    schema: '\\sum_{i=1}^{3}x_i=x_1+x_2+x_3',
    apply: expand,
  },
  {
    id: 'collapse',
    name: 'Comprimir',
    schema: 'x_1+x_2+x_3=\\sum_{i=1}^{3}x_i',
    apply: (e) => (e.k === 'add' ? collapse('sum', e.xs) : e.k === 'mul' ? collapse('prod', e.xs) : null),
  },
  {
    id: 'big-factor',
    name: 'Sacar constante',
    schema: '\\sum_j c\\,a_j=c\\sum_j a_j',
    cond: 'c \\text{ no depende de } j',
    apply: (e) => {
      if (e.k !== 'big') return null;
      const { body, i } = e;
      if (body.k === 'div' && !mentions(body.d, i) && e.op === 'sum')
        return ok(div({ ...e, body: body.n }, body.d));
      const fs = factorsOf(body);
      const consts = fs.filter((f) => !mentions(f, i));
      const vars = fs.filter((f) => mentions(f, i));
      if (!consts.length || !vars.length) return null;
      if (e.op === 'sum') return ok(mul(...consts, { ...e, body: product(vars) }));
      // ∏_j c a_j = c^{n} ∏_j a_j only for explicit numeric bounds
      if (e.lo.k === 'num' && e.hi.k === 'num') {
        const n = num(e.hi.v - e.lo.v + 1);
        return ok(mul(...consts.map((c) => ({ k: 'pow', b: c, e: n }) as Expr), { ...e, body: product(vars) }));
      }
      return blocked('En un producto, cada factor constante se repite n veces: necesito límites numéricos.');
    },
  },
  {
    id: 'big-split',
    name: 'Separar Σ / ∏',
    schema: '\\sum_i(a_i+b_i)=\\sum_i a_i+\\sum_i b_i',
    apply: (e) => {
      if (e.k !== 'big') return null;
      if (e.op === 'sum' && e.body.k === 'add') return ok(add(...e.body.xs.map((t) => ({ ...e, body: t }) as Expr)));
      if (e.op === 'prod' && e.body.k === 'mul') return ok(mul(...e.body.xs.map((t) => ({ ...e, body: t }) as Expr)));
      return null;
    },
  },
  {
    id: 'big-const',
    name: 'Σ / ∏ de una constante',
    schema: '\\sum_{i=1}^{n}c=nc,\\;\\prod_{i=1}^{n}c=c^{n}',
    apply: (e) => {
      if (e.k !== 'big' || mentions(e.body, e.i)) return null;
      const count: Expr =
        e.lo.k === 'num' && e.lo.v === 1
          ? e.hi
          : e.lo.k === 'num' && e.hi.k === 'num'
            ? num(e.hi.v - e.lo.v + 1)
            : add(e.hi, negate(e.lo), num(1));
      return ok(e.op === 'sum' ? mul(count, e.body) : { k: 'pow', b: e.body, e: count });
    },
  },
  {
    id: 'cancel',
    name: 'Cancelar factor común',
    schema: '\\frac{c\\,a}{c\\,b}=\\frac{a}{b}',
    cond: 'c\\neq0',
    apply: (e) => {
      if (e.k !== 'div') return null;
      const nf = factorsOf(e.n);
      const df = factorsOf(e.d);
      for (const f of nf) {
        const j = df.findIndex((g) => key(g) === key(f));
        if (j >= 0) {
          if (!isNonzero(f)) return blocked(`No puedo garantizar que $${T(f)}\\neq0$: cancelar podría dividir por cero.`);
          const n2 = nf.filter((x) => x !== f);
          const d2 = df.filter((_, k) => k !== j);
          const nn = product(n2);
          return ok(d2.length ? div(nn, product(d2)) : nn);
        }
      }
      return null;
    },
  },
  {
    id: 'add-cancel',
    name: 'Cancelar opuestos',
    schema: 'a+b-b=a',
    apply: (e) => {
      if (e.k !== 'add') return null;
      const xs = e.xs.slice();
      for (let i = 0; i < xs.length; i++) {
        const opp = key(negate(xs[i]));
        const j = xs.findIndex((y, m) => m !== i && key(y) === opp);
        if (j >= 0) {
          const rest = xs.filter((_, m) => m !== i && m !== j);
          return ok(sumOf(rest));
        }
      }
      return null;
    },
  },
  {
    id: 'add-collect',
    name: 'Agrupar términos iguales',
    schema: 'a+a+a=3a',
    apply: (e) => {
      if (e.k !== 'add') return null;
      const coef = (x: Expr): [number, Expr] =>
        x.k === 'mul' && x.xs[0].k === 'num' ? [x.xs[0].v, product(x.xs.slice(1))] : x.k === 'neg' ? [-coef(x.x)[0], coef(x.x)[1]] : [1, x];
      for (let i = 0; i < e.xs.length; i++) {
        const [, base] = coef(e.xs[i]);
        const kb = key(base);
        const group = e.xs.filter((x) => key(coef(x)[1]) === kb);
        if (group.length >= 2) {
          const c = group.reduce((s, x) => s + coef(x)[0], 0);
          const rest = e.xs.filter((x) => !group.includes(x));
          const term = c === 0 ? num(0) : c === 1 ? base : mul(num(c), base);
          return ok(sumOf([...rest, term]));
        }
      }
      return null;
    },
  },
  {
    id: 'exp-div',
    name: 'Cociente de exponenciales',
    schema: '\\frac{e^{a}}{e^{b}}=e^{a-b}',
    apply: (e) =>
      e.k === 'div' && e.n.k === 'exp' && e.d.k === 'exp' ? ok(exp(add(e.n.x, negate(e.d.x)))) : null,
  },
  {
    id: 'neg-add',
    name: 'Repartir el signo',
    schema: '-(a+b)=-a-b',
    apply: (e) => (e.k === 'neg' && e.x.k === 'add' ? ok(add(...e.x.xs.map(negate))) : null),
  },
  {
    id: 'distribute',
    name: 'Distribuir',
    schema: 'a(b+c)=ab+ac',
    apply: (e) => {
      if (e.k !== 'mul') return null;
      const j = e.xs.findIndex((x) => x.k === 'add');
      if (j < 0) return null;
      const others = e.xs.filter((_, k) => k !== j);
      return ok(add(...termsOf(e.xs[j]).map((t) => product([...others, t]))));
    },
  },
  {
    id: 'div-split',
    name: 'Repartir el denominador',
    schema: '\\frac{a+b}{c}=\\frac{a}{c}+\\frac{b}{c}',
    apply: (e) => (e.k === 'div' && e.n.k === 'add' ? ok(add(...e.n.xs.map((t) => div(t, e.d)))) : null),
  },
  {
    id: 'calc',
    name: 'Calcular',
    schema: '2\\cdot3=6',
    apply: (e) => {
      if (e.k === 'num') return null;
      const free = freeSyms(e);
      if (free.size) return null;
      const v = evaluate(e);
      if (!Number.isFinite(v)) return blocked('El resultado no es un número finito.');
      const r = Math.round(v * 1e9) / 1e9;
      return ok(num(r));
    },
  },
];

export const RULE_BY_ID: Record<string, Rule> = Object.fromEntries(RULES.map((r) => [r.id, r]));

/**
 * Levels may define extra rules next to their content (pure functions, same contract).
 * Call at module top level: registerRules([...]). Ids must be unique and stable.
 */
export function registerRules(rules: Rule[]) {
  for (const r of rules) {
    if (RULE_BY_ID[r.id] && RULE_BY_ID[r.id] !== r) throw new Error(`Duplicate Forge rule id: ${r.id}`);
    RULE_BY_ID[r.id] = r;
  }
}
export { E_CONST };
