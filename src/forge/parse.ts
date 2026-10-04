import { E_CONST, type Expr } from './expr';

// Compact authoring syntax for Forge puzzles:
//   ln(a*b) + exp(x)      a/b      a^2      -x      x_i   x_(i+1)
//   sum(i, 1, n, x_i)     prod(j, 1, 3, p_j)    sum(s, _, _, q_s)  (unbounded display)
//   e^x  ≡ exp(x);  e is the constant;  other names → symbols from the table (or themselves)
//   name(args) for declared functions, e.g. sigma(z)
export interface SymSpec {
  tex: string;
  pos?: boolean;
  fn?: boolean;
  /** for indexed names: TeX template where # is the index, e.g. p(x_{#}\mid\theta) */
  tpl?: string;
}
export type SymTable = Record<string, SymSpec>;

type Tok = { t: 'num' | 'id' | 'op'; v: string };

function lex(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: 'num', v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9']/.test(s[j])) j++;
      out.push({ t: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }
    out.push({ t: 'op', v: c });
    i++;
  }
  return out;
}

export function parse(src: string, table: SymTable = {}): Expr {
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v !== undefined && t.v !== v)) throw new Error(`Parse error near "${t?.v ?? 'EOF'}" in ${src}`);
    p++;
    return t;
  };
  const symbol = (name: string): Expr => {
    if (name === 'e') return E_CONST;
    if (name === '_') return { k: 'sym', id: '_', tex: '' };
    const spec = table[name];
    return { k: 'sym', id: name, tex: spec?.tex ?? texName(name), pos: spec?.pos ?? false };
  };

  function expr(): Expr {
    const first = term();
    const xs: Expr[] = [first];
    while (peek() && (peek().v === '+' || peek().v === '-')) {
      const op = eat().v;
      const t = term();
      xs.push(op === '-' ? { k: 'neg', x: t } : t);
    }
    if (xs.length === 1) return first;
    return { k: 'add', xs };
  }
  function term(): Expr {
    let factors: Expr[] = [unary()];
    while (peek() && (peek().v === '*' || peek().v === '/')) {
      const op = eat().v;
      const r = unary();
      if (op === '*') factors.push(r);
      else {
        const n: Expr = factors.length === 1 ? factors[0] : { k: 'mul', xs: factors };
        factors = [{ k: 'div', n, d: r }];
      }
    }
    return factors.length === 1 ? factors[0] : { k: 'mul', xs: factors };
  }
  function unary(): Expr {
    if (peek()?.v === '-') {
      eat('-');
      return { k: 'neg', x: unary() };
    }
    return power();
  }
  function power(): Expr {
    const base = atom();
    if (peek()?.v === '^') {
      eat('^');
      const ex = unary();
      if (base.k === 'sym' && base.id === 'e') return { k: 'exp', x: ex };
      return { k: 'pow', b: base, e: ex };
    }
    return base;
  }
  function args(): Expr[] {
    eat('(');
    const out: Expr[] = [];
    if (peek()?.v !== ')') {
      out.push(expr());
      while (peek()?.v === ',') {
        eat(',');
        out.push(expr());
      }
    }
    eat(')');
    return out;
  }
  function atom(): Expr {
    const t = peek();
    if (!t) throw new Error('Unexpected end in ' + src);
    if (t.t === 'num') {
      eat();
      return { k: 'num', v: Number(t.v) };
    }
    if (t.v === '(') {
      eat('(');
      const e = expr();
      eat(')');
      return e;
    }
    if (t.t === 'id') {
      eat();
      const name = t.v;
      if (name === 'ln' || name === 'exp') {
        const a = args();
        return name === 'ln' ? { k: 'ln', x: a[0] } : { k: 'exp', x: a[0] };
      }
      if (name === 'sum' || name === 'prod') {
        const a = args();
        const iv = a[0];
        if (iv.k !== 'sym') throw new Error('index must be a name');
        return { k: 'big', op: name, i: iv.id, lo: a[1], hi: a[2], body: a[3] };
      }
      if (peek()?.v === '_') {
        eat('_');
        let idx: Expr;
        if (peek()?.v === '(') {
          eat('(');
          idx = expr();
          eat(')');
        } else {
          const it = eat();
          idx = it.t === 'num' ? { k: 'num', v: Number(it.v) } : symbol(it.v);
        }
        const spec = table[name];
        return {
          k: 'idx',
          base: name,
          tex: spec?.tex ?? texName(name),
          i: idx,
          pos: spec?.pos ?? false,
          tpl: spec?.tpl,
        };
      }
      if (peek()?.v === '(' && table[name]?.fn) {
        const a = args();
        const spec = table[name];
        return { k: 'fn', f: name, tex: spec.tex, args: a, pos: spec.pos };
      }
      return symbol(name);
    }
    throw new Error(`Unexpected "${t.v}" in ${src}`);
  }
  const out = expr();
  if (p < toks.length) throw new Error(`Trailing input "${toks[p].v}" in ${src}`);
  return out;
}

const GREEK: Record<string, string> = {
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  theta: '\\theta',
  lambda: '\\lambda',
  mu: '\\mu',
  pi: '\\pi',
  sigma: '\\sigma',
  tau: '\\tau',
  phi: '\\phi',
  omega: '\\omega',
};
function texName(name: string) {
  return GREEK[name] ?? (name.length > 1 ? `\\mathrm{${name}}` : name);
}
