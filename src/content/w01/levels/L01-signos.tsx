import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Dot, Line } from '../../../engine/shapes';
import { Rich, Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { rng, shuffle } from '../shared/rng';

// ============================================================================
// 1.1 · SIGNOS Y AFIRMACIONES — qué afirma cada línea
// demo: := names, = identity (area proof of (a+b)²), ≥ bound (floor), ≈ approximation (zoom),
//       ⇒ as inclusion of solution sets, converse fails (counterexample)
// challenges: classify statements; validate implications or find counterexamples
// ============================================================================

type Kind = 'def' | 'id' | 'bound' | 'approx' | 'impl';
const KIND: Record<Kind, { label: string; color: string; sign: string }> = {
  def: { label: 'DEFINICIÓN', color: C.violet, sign: ':=' },
  id: { label: 'IDENTIDAD', color: C.cyan, sign: '=' },
  bound: { label: 'COTA', color: C.amber, sign: '\\le' },
  approx: { label: 'APROXIMACIÓN', color: C.magenta, sign: '\\approx' },
  impl: { label: 'IMPLICACIÓN', color: C.green, sign: '\\Rightarrow' },
};
const KINDS = Object.keys(KIND) as Kind[];

// ---------------------------------------------------------------- demo scene
function SignsDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const rev4 = useTween(beat > 4 || (beat === 4 && answer !== null) ? 1 : 0, 1);
  const rev7 = useTween(beat > 7 || (beat === 7 && answer !== null) ? 1 : 0, 1);
  const cards = at(0) * (1 - at(1));
  const defV = at(1) * (1 - at(2));
  const idV = at(2) * (1 - at(3));
  const boundV = at(3) * (1 - at(5));
  const approxV = at(5) * (1 - at(6));
  const implV = at(6);

  // (a+b)^2 square
  const a = 220;
  const b = 130;
  const sx = 620;
  const sy = 170;
  const split = at(2);

  // bound: F oscillates above a floor
  const X = (v: number) => 300 + v * 200; // number line for bound/implication
  const fVal = beat >= 3 && beat <= 4 ? 2.3 + 0.6 * Math.sin(at(3) * Math.PI * 2) * (1 - rev4) : 2.3;

  return (
    <Stage>
      {/* the four signs */}
      <Group opacity={cards}>
        {(['def', 'id', 'bound', 'approx'] as Kind[]).map((k, i) => (
          <Group key={k} opacity={lagged(at(0), i, 4, 0.4)}>
            <rect x={200 + i * 310} y={300} width={270} height={240} rx={14} fill={C.panel} stroke={KIND[k].color} strokeWidth={2.5} />
            <Html x={335 + i * 310} y={390} size={64} color={KIND[k].color}>
              <Tex tex={KIND[k].sign} />
            </Html>
            <Html x={335 + i * 310} y={490} size={20} color={KIND[k].color}>
              <span className="panel-note">{KIND[k].label}</span>
            </Html>
          </Group>
        ))}
      </Group>
      {/* := names something */}
      <Group opacity={defV}>
        <rect x={560} y={330} width={640} height={130} rx={12} fill={C.panel} stroke={C.line} strokeWidth={2} />
        <Html x={880} y={395} size={36} color={C.text}>
          <Tex tex="\mathbb E_q[\ln q(s)-\ln p(o,s)]" />
        </Html>
        <rect x={250} y={350} width={160} height={90} rx={12} fill={C.violet} opacity={0.18 + 0.6 * at(1)} />
        <Html x={330} y={395} size={44} color={C.violet}>
          <Tex tex="F" />
        </Html>
        <Html x={480} y={395} size={44} color={C.violet} opacity={at(1)}>
          <Tex tex=":=" />
        </Html>
        <Html x={800} y={560} size={24} color={C.muted}>
          <span>el nombre de la izquierda no existía: se crea aquí, no hay nada que demostrar</span>
        </Html>
      </Group>
      {/* = identity: area proof */}
      <Group opacity={idV}>
        <rect x={sx} y={sy} width={a + b} height={a + b} fill="none" stroke={C.text} strokeWidth={3} />
        <Group opacity={split}>
          <rect x={sx} y={sy} width={a} height={a} fill={C.cyan} opacity={0.35} />
          <rect x={sx + a} y={sy} width={b} height={a} fill={C.amber} opacity={0.35} />
          <rect x={sx} y={sy + a} width={a} height={b} fill={C.amber} opacity={0.35} />
          <rect x={sx + a} y={sy + a} width={b} height={b} fill={C.violet} opacity={0.4} />
          <Html x={sx + a / 2} y={sy + a / 2} size={32} color={C.text}>
            <Tex tex="a^2" />
          </Html>
          <Html x={sx + a + b / 2} y={sy + a / 2} size={28} color={C.text}>
            <Tex tex="ab" />
          </Html>
          <Html x={sx + a / 2} y={sy + a + b / 2} size={28} color={C.text}>
            <Tex tex="ab" />
          </Html>
          <Html x={sx + a + b / 2} y={sy + a + b / 2} size={28} color={C.text}>
            <Tex tex="b^2" />
          </Html>
        </Group>
        <Html x={sx + a / 2} y={sy - 26} size={26} color={C.cyan}>
          <Tex tex="a" />
        </Html>
        <Html x={sx + a + b / 2} y={sy - 26} size={26} color={C.amber}>
          <Tex tex="b" />
        </Html>
        <Html x={1250} y={sy + (a + b) / 2} size={34} color={C.text}>
          <Tex tex="(a+b)^2=a^2+2ab+b^2" />
        </Html>
      </Group>
      {/* ≥ bound */}
      <Group opacity={boundV}>
        <line x1={X(-0.5)} x2={X(5)} y1={520} y2={520} stroke={C.dim} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((t) => (
          <Html key={t} x={X(t)} y={550} size={20} color={C.muted}>
            <Tex tex={String(t)} />
          </Html>
        ))}
        <rect x={X(-0.5)} y={300} width={X(1.4) - X(-0.5)} height={220} fill={C.amber} opacity={0.07 + 0.08 * rev4} />
        <Line a={[X(1.4), 280]} b={[X(1.4), 520]} color={C.amber} width={4} glow />
        <Html x={X(1.4)} y={255} size={24} color={C.amber}>
          <Tex tex="-\ln p(o)" />
        </Html>
        <Dot x={X(fVal)} y={420} r={14} color={C.cyan} />
        <Html x={X(fVal)} y={385} size={26} color={C.cyan}>
          <Tex tex={`F=${fmt(fVal, 2)}`} />
        </Html>
        {rev4 > 0 && (
          <Group opacity={rev4}>
            <rect x={X(-0.5)} y={600} width={X(2.3) - X(-0.5)} height={14} fill={C.green} opacity={0.6} />
            <Html x={X(1.1)} y={640} size={22} color={C.green}>
              <Tex tex="-\ln p(o)\le 2.3" />
            </Html>
          </Group>
        )}
      </Group>
      {/* ≈ approximation */}
      <Group opacity={approxV}>
        {(() => {
          const zoom = at(5);
          const L = (v: number) => 800 + (v - 2.7183) * lerp(600, 600000, zoom * zoom);
          return (
            <>
              <line x1={200} x2={1400} y1={450} y2={450} stroke={C.dim} strokeWidth={2} />
              <Dot x={clamp(L(Math.E), 150, 1450)} y={450} r={11} color={C.amber} />
              <Dot x={clamp(L(2.718), 150, 1450)} y={450} r={11} color={C.magenta} />
              <Html x={clamp(L(Math.E), 150, 1450)} y={405} size={24} color={C.amber}>
                <Tex tex="e=2.71828\ldots" />
              </Html>
              <Html x={clamp(L(2.718), 150, 1450)} y={500} size={24} color={C.magenta}>
                <Tex tex="2.718" />
              </Html>
              <Html x={800} y={620} size={28} color={C.text} opacity={zoom}>
                <Tex tex="|e-2.718|<3\times10^{-4}\quad(\text{el error es parte de la afirmación})" />
              </Html>
            </>
          );
        })()}
      </Group>
      {/* ⇒ as inclusion */}
      <Group opacity={implV}>
        <line x1={X(-1)} x2={X(5)} y1={520} y2={520} stroke={C.dim} strokeWidth={2} />
        {[-1, 0, 1, 2, 3, 4].map((t) => (
          <Html key={t} x={X(t)} y={550} size={20} color={C.muted}>
            <Tex tex={String(t)} />
          </Html>
        ))}
        <rect x={X(0)} y={420} width={X(5) - X(0)} height={30} fill={C.cyan} opacity={0.3} />
        <rect x={X(2)} y={460} width={X(5) - X(2)} height={30} fill={C.green} opacity={0.5} />
        <circle cx={X(0)} cy={435} r={9} fill={C.bg} stroke={C.cyan} strokeWidth={3} />
        <circle cx={X(2)} cy={475} r={9} fill={C.bg} stroke={C.green} strokeWidth={3} />
        <Html x={X(3.6)} y={400} size={22} color={C.cyan}>
          <Tex tex="\{x:x>0\}" />
        </Html>
        <Html x={X(3.6)} y={505} size={22} color={C.green}>
          <Tex tex="\{x:x>2\}" />
        </Html>
        <Html x={800} y={250} size={34} color={C.text}>
          <Tex tex="x>2\ \Rightarrow\ x>0\qquad\Longleftrightarrow\qquad\{x>2\}\subseteq\{x>0\}" />
        </Html>
        {rev7 > 0 && (
          <Group opacity={rev7}>
            <Dot x={X(1)} y={435} r={12} color={C.red} />
            <Line a={[X(1), 400]} b={[X(1), 520]} color={C.red} width={3} />
            <Html x={X(1)} y={360} size={24} color={C.red}>
              <Tex tex="x=1:\ x>0\ \text{pero}\ x\not>2" />
            </Html>
          </Group>
        )}
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: classify
const POOL: { tex: string; k: Kind; why: string }[] = [
  { tex: '\\mathcal I(o):=-\\ln p(o)', k: 'def', why: 'introduce el nombre $\\mathcal I$' },
  { tex: 'Z:=\\textstyle\\sum_k w_k', k: 'def', why: 'introduce el nombre $Z$' },
  { tex: 'x_{1:N}:=(x_1,\\dots,x_N)', k: 'def', why: 'fija una notación' },
  { tex: '\\sigma(\\mathbf z)_i:=\\frac{e^{z_i}}{\\sum_j e^{z_j}}', k: 'def', why: 'define softmax' },
  { tex: '\\ln(ab)=\\ln a+\\ln b', k: 'id', why: 'afirma que dos expresiones valen lo mismo' },
  { tex: 'e^{a+b}=e^{a}e^{b}', k: 'id', why: 'afirma una igualdad que se puede demostrar' },
  { tex: '(a+b)^2=a^2+2ab+b^2', k: 'id', why: 'es una igualdad verificable' },
  { tex: '\\textstyle\\sum_i(x_i+y_i)=\\sum_i x_i+\\sum_i y_i', k: 'id', why: 'es una igualdad verificable' },
  { tex: 'F[q]\\ge-\\ln p(o)', k: 'bound', why: 'acota sin dar el valor' },
  { tex: '\\max_j z_j\\le\\ln\\textstyle\\sum_j e^{z_j}', k: 'bound', why: 'acota sin dar el valor' },
  { tex: '0\\le p(s)\\le 1', k: 'bound', why: 'restringe el rango' },
  { tex: '\\min_i f_i\\le\\textstyle\\sum_i p_if_i', k: 'bound', why: 'acota el promedio' },
  { tex: 'e\\approx2.718', k: 'approx', why: 'admite un error' },
  { tex: '\\ln 2\\approx0.693', k: 'approx', why: 'admite un error' },
  { tex: '\\sqrt2\\approx1.414', k: 'approx', why: 'admite un error' },
  { tex: 'x>2\\Rightarrow x>0', k: 'impl', why: 'encadena una condición con otra' },
  { tex: 'a,b>0\\ \\Rightarrow\\ \\ln(ab)=\\ln a+\\ln b', k: 'impl', why: 'su conectiva principal es $\\Rightarrow$: la identidad vale **bajo** la condición' },
  { tex: '0<x<1\\Rightarrow\\ln x<0', k: 'impl', why: 'encadena una condición con otra' },
];

function Classify({ seed, round, api }: ChallengeProps) {
  const items = useMemo(() => {
    const r = rng(seed);
    // three statements of three different kinds per round
    const kinds = shuffle(r, KINDS).slice(0, 3);
    return kinds.map((k) => shuffle(r, POOL.filter((p) => p.k === k))[0]);
  }, [seed]);
  void round;
  const [assigned, setAssigned] = useState<(Kind | null)[]>([null, null, null]);
  const [sel, setSel] = useState(0);
  useEffect(() => {
    api.prompt('Clasifica cada afirmación por lo que **afirma**: elige una tarjeta y luego su tipo. Mira la conectiva **principal**.');
    api.hints([
      '$:=$ crea un nombre; $=$ afirma igualdad; $\\le,\\ge$ acotan; $\\approx$ admite error; $\\Rightarrow$ encadena condiciones.',
      `Una pista concreta: ${items.map((it) => `$${it.tex}$ ${it.why}`)[0]}.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  const submit = () => {
    const i = items.findIndex((it, k) => assigned[k] !== it.k);
    if (i < 0) return api.result(true, items.map((it) => `$${it.tex}$: ${KIND[it.k].label.toLowerCase()}`).join(' · '));
    if (assigned[i] === null) return api.result(false, `Falta clasificar $${items[i].tex}$.`);
    api.result(false, `$${items[i].tex}$ no es ${KIND[assigned[i]!].label.toLowerCase()}: es **${KIND[items[i].k].label.toLowerCase()}**, ${items[i].why}.`);
  };
  return (
    <Stage>
      {items.map((it, i) => {
        const x = 350 + i * 450;
        const k = assigned[i];
        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={() => setSel(i)}>
            <rect x={x - 200} y={180} width={400} height={170} rx={14} fill={C.panel} stroke={sel === i ? C.text : k ? KIND[k].color : C.line} strokeWidth={sel === i ? 3.5 : 2} />
            <Html x={x} y={250} size={30} color={C.text}>
              <Tex tex={it.tex} />
            </Html>
            <Html x={x} y={320} size={18} color={k ? KIND[k].color : C.dim}>
              <span className="panel-note">{k ? KIND[k].label : '— sin clasificar —'}</span>
            </Html>
          </g>
        );
      })}
      {KINDS.map((k, j) => {
        const x = 240 + j * 280;
        return (
          <g
            key={k}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              api.sfx.click();
              const next = assigned.slice();
              next[sel] = k;
              setAssigned(next);
              const free = next.findIndex((v) => v === null);
              if (free >= 0) setSel(free);
            }}
          >
            <rect x={x - 120} y={520} width={240} height={130} rx={12} fill={C.panel} stroke={KIND[k].color} strokeWidth={2.5} />
            <Html x={x} y={565} size={36} color={KIND[k].color}>
              <Tex tex={KIND[k].sign} />
            </Html>
            <Html x={x} y={620} size={17} color={KIND[k].color}>
              <span className="panel-note">{KIND[k].label}</span>
            </Html>
          </g>
        );
      })}
      <Html x={800} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: counterexamples
interface Claim {
  tex: string;
  H: (x: number) => boolean;
  K: (x: number) => boolean;
  valid: boolean;
  witness?: string;
}
const CLAIMS: Claim[] = [
  { tex: 'x>2\\ \\Rightarrow\\ x>0', H: (x) => x > 2, K: (x) => x > 0, valid: true },
  { tex: 'x>0\\ \\Rightarrow\\ x>2', H: (x) => x > 0, K: (x) => x > 2, valid: false, witness: 'cualquier $x\\in(0,2]$' },
  { tex: 'x^2>4\\ \\Rightarrow\\ x>2', H: (x) => x * x > 4, K: (x) => x > 2, valid: false, witness: 'cualquier $x<-2$' },
  { tex: 'x>2\\ \\Rightarrow\\ x^2>4', H: (x) => x > 2, K: (x) => x * x > 4, valid: true },
  { tex: '|x|<1\\ \\Rightarrow\\ x<1', H: (x) => Math.abs(x) < 1, K: (x) => x < 1, valid: true },
  { tex: 'x<1\\ \\Rightarrow\\ |x|<1', H: (x) => x < 1, K: (x) => Math.abs(x) < 1, valid: false, witness: 'cualquier $x\\le-1$' },
  { tex: 'x\\neq0\\ \\Rightarrow\\ x^2>0', H: (x) => x !== 0, K: (x) => x * x > 0, valid: true },
  { tex: 'x^2=x\\ \\Rightarrow\\ x=1', H: (x) => x * x === x, K: (x) => x === 1, valid: false, witness: '$x=0$' },
];

function Counterexample({ seed, round, api }: ChallengeProps) {
  const claim = useMemo(() => {
    const r = rng(seed);
    // alternate valid / invalid so guessing does not pay
    const wantValid = round % 2 === 1;
    const pool = CLAIMS.filter((c) => c.valid === wantValid);
    return pool[Math.floor(r() * pool.length)];
  }, [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(0.5);
  const X = (v: number) => 800 + v * 160;
  const onDrag = useSvgDrag(svg, (px) => {
    const v = Math.round(clamp((px - 800) / 160, -4, 4) * 2) / 2;
    if (v !== x) api.sfx.tick();
    setX(v);
  });
  useEffect(() => {
    api.prompt(
      `¿Es válida $${claim.tex}$? Mueve $x$: si encuentras un punto donde la hipótesis se cumple y la conclusión **no**, es un contraejemplo.`,
      claim.tex,
    );
    api.hints([
      'Una implicación $H\\Rightarrow K$ solo falla cuando $H$ es verdadera y $K$ falsa.',
      claim.valid ? 'Esta es válida: el conjunto donde vale $H$ está contenido en el de $K$.' : `Busca en ${claim.witness}.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);
  const h = claim.H(x);
  const k = claim.K(x);
  const sayValid = () => {
    if (claim.valid) return api.result(true, `Válida: no existe $x$ con la hipótesis verdadera y la conclusión falsa.`);
    api.result(false, `No es válida: prueba ${claim.witness}. Ahí la hipótesis se cumple y la conclusión no.`);
  };
  const sayCounter = () => {
    if (!h) return api.result(false, `En $x=${fmt(x, 1)}$ la hipótesis es **falsa**: un punto así nunca refuta una implicación.`);
    if (k) return api.result(false, `En $x=${fmt(x, 1)}$ la hipótesis y la conclusión son verdaderas: eso **apoya** la implicación, no la refuta.`);
    api.result(true, `Contraejemplo: en $x=${fmt(x, 1)}$ vale la hipótesis y falla la conclusión. La implicación es falsa.`);
  };
  const lamp = (on: boolean, label: string, y: number) => (
    <g>
      <circle cx={1180} cy={y} r={22} fill={on ? C.green : C.panel} stroke={on ? C.green : C.red} strokeWidth={3} />
      <Html x={1220} y={y} size={22} anchor="left" color={on ? C.green : C.red}>
        <Tex tex={`${label}:\\ ${on ? '\\text{verdadera}' : '\\text{falsa}'}`} />
      </Html>
    </g>
  );
  return (
    <Stage ref={svg}>
      <Html x={800} y={150} size={44} color={C.text}>
        <Tex tex={claim.tex} />
      </Html>
      {lamp(h, 'H', 300)}
      {lamp(k, 'K', 370)}
      <line x1={X(-4.3)} x2={X(4.3)} y1={560} y2={560} stroke={C.dim} strokeWidth={2} />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={550} y2={570} stroke={C.dim} strokeWidth={2} />
          <Html x={X(t)} y={596} size={20} color={C.muted}>
            <Tex tex={String(t)} />
          </Html>
        </g>
      ))}
      {/* shade where H holds */}
      {Array.from({ length: 81 }, (_, i) => -4 + i * 0.1).map((v) => (
        <rect key={v} x={X(v) - 8} y={520} width={16} height={12} fill={C.cyan} opacity={claim.H(Math.round(v * 10) / 10) ? 0.35 : 0} />
      ))}
      <Html x={X(-4.3)} y={505} size={18} anchor="left" color={C.cyan}>
        <span className="panel-note">donde vale H</span>
      </Html>
      <Dot x={X(x)} y={560} r={16} color={h && !k ? C.red : C.text} ring onPointerDown={onDrag} cursor="ew-resize" />
      <Html x={X(x)} y={630} size={26} color={C.text}>
        <Tex tex={`x=${fmt(x, 1)}`} />
      </Html>
      <Html x={800} y={760} size={22} interactive>
        <div style={{ display: 'flex', gap: '0.6em' }}>
          <button className="stage-btn" onClick={sayValid}>
            Es válida
          </button>
          <button className="stage-btn on" onClick={sayCounter}>
            Fijar contraejemplo en x ▸
          </button>
        </div>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l01',
  world: 'foundations',
  code: '1.1',
  title: 'Signos y afirmaciones',
  subtitle: 'qué afirma cada línea',
  glyph: ':=',
  kind: 'level',
  objective: 'Distinguir definición ($:=$), identidad ($=$), cota ($\\le$), aproximación ($\\approx$) e implicación ($\\Rightarrow$), y refutar implicaciones con contraejemplos.',
  glyphs: ['def', 'approx', 'bound', 'implies', 'iff', 'equiv', 'neq'],
  codex: ['w01-signos'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Mis ecuaciones mezclan cosas muy distintas: definiciones, identidades, cotas y aproximaciones. Se escriben parecido; **afirman** cosas diferentes.',
        'Tomar una cota por una igualdad, o intentar demostrar una definición, es el error más caro al leer el libro.',
        'Este protocolo calibra tu lectura: qué afirma cada signo y cómo se refuta una implicación.',
      ],
    },
    {
      kind: 'demo',
      title: 'Cuatro signos',
      Scene: SignsDemo,
      beats: [
        { say: 'Cuatro signos, cuatro tipos de afirmación.', tex: '\\g{def}{:=}\\qquad=\\qquad\\g{bound}{\\le}\\qquad\\g{approx}{\\approx}', dur: 2 },
        {
          say: '$:=$ **define**: el nombre de la izquierda se crea en ese momento. No se demuestra; se acepta y se usa.',
          tex: 'F\\g{def}{:=}\\mathbb E_q[\\ln q(s)-\\ln p(o,s)]',
          dur: 1.8,
        },
        {
          say: '$=$ afirma una **identidad**: dos expresiones valen lo mismo, y eso se demuestra. Aquí, con áreas.',
          tex: '(a+b)^2=a^2+2ab+b^2',
          dur: 2.2,
        },
        {
          say: '$\\ge$ es una **cota**: $F$ puede valer muchas cosas, pero nunca baja de $-\\ln p(o)$. No dice cuánto vale $F$.',
          tex: 'F[q]\\g{bound}{\\ge}-\\ln p(o)',
          dur: 2.6,
        },
        {
          say: 'Una cota también informa en la otra dirección.',
          tex: 'F[q]\\ge-\\ln p(o),\\quad F=2.3',
          ask: {
            prompt: 'Si $F\\ge-\\ln p(o)$ y medimos $F=2.3$, ¿qué sabemos de $-\\ln p(o)$?',
            options: ['Que es $\\le 2.3$', 'Que vale $2.3$', 'Que es $\\ge 2.3$'],
            answer: 0,
            explain: 'La cota dice que $-\\ln p(o)$ está **por debajo** de $F$. Sin igualdad no sabemos su valor: solo un techo.',
          },
        },
        {
          say: '$\\approx$ es una **aproximación**: admite un error que forma parte de la afirmación. Al acercarnos, $2.718$ y $e$ se separan.',
          tex: 'e\\g{approx}{\\approx}2.718',
          dur: 2.8,
        },
        {
          say: '$\\Rightarrow$ encadena: si vale la hipótesis, vale la conclusión. Equivale a una **inclusión** de conjuntos de soluciones.',
          tex: 'x>2\\g{implies}{\\Rightarrow}x>0',
          dur: 2,
        },
        {
          say: '¿Y al revés?',
          tex: 'x>0\\ \\overset{?}{\\Rightarrow}\\ x>2',
          ask: {
            prompt: '¿Vale la recíproca $x>0\\Rightarrow x>2$?',
            options: ['No: $x=1$ es un contraejemplo', 'Sí', 'Solo para enteros'],
            answer: 0,
            explain: 'Basta **un** punto con la hipótesis verdadera y la conclusión falsa. $x=1$: es positivo y no supera 2. Cuando valen ambas direcciones se escribe $\\Leftrightarrow$.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Clasificador', Comp: Classify, rounds: 4 },
    { kind: 'challenge', title: 'Contraejemplos', Comp: Counterexample, rounds: 4 },
    { kind: 'codex', entry: 'w01-signos' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-signos',
    world: 'foundations',
    level: 'w01-l01',
    title: 'Signos y afirmaciones',
    summary: 'Cada signo relacional afirma algo distinto: crear un nombre, una identidad, una cota, una aproximación o una implicación.',
    blocks: [
      { label: 'Definición', tex: 'a:=b', body: 'Crea el nombre $a$ para $b$. No se demuestra. A veces se escribe $\\equiv$ o $\\stackrel{\\text{def}}{=}$.' },
      { label: 'Identidad', tex: 'a=b', body: 'Afirma que valen lo mismo; requiere demostración (o es un hecho conocido).' },
      { label: 'Cota', tex: 'a\\le b,\\quad a\\ge b', body: 'Restringe sin dar el valor. $F\\ge-\\ln p(o)$ no dice cuánto vale ninguno de los dos.' },
      { label: 'Aproximación', tex: 'a\\approx b', body: 'Admite un error; conviene saber de qué tamaño y por qué.' },
      { label: 'Implicación', tex: 'A\\Rightarrow B\\iff\\{A\\}\\subseteq\\{B\\}', body: 'Si vale $A$, vale $B$. Falla solo cuando $A$ es verdadera y $B$ falsa (contraejemplo).' },
      { label: 'Equivalencia', tex: 'A\\Leftrightarrow B\\iff(A\\Rightarrow B)\\wedge(B\\Rightarrow A)' },
      { label: 'Distinto', tex: 'a\\neq b' },
    ],
    pitfalls: [
      'Leer $:=$ como algo que hay que demostrar.',
      'Tratar $\\ge$ o $\\approx$ como $=$: una cota no es una aproximación.',
      'Confundir una implicación con su recíproca.',
    ],
    aif: [
      { tex: 'F[q]:=\\mathbb E_q[\\ln q(z)-\\ln p(x,z)]', text: 'Definición de la energía libre variacional (guía G08).' },
      { tex: 'F[q]\\ge-\\ln p(x)', text: 'Cota: $F$ nunca está por debajo de la sorpresa. Igualdad solo si $q$ es el posterior exacto.' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'def', world: 'foundations', tex: ':=', name: 'Definición', read: 'se define como', meaning: 'El lado izquierdo es un nombre nuevo para el derecho. No hay nada que demostrar.', warn: 'Algunos textos usan $\\equiv$ o $\\triangleq$ con el mismo sentido.' },
  { id: 'approx', world: 'foundations', tex: '\\approx', name: 'Aproximadamente igual', read: 'aproximadamente', meaning: 'Igualdad con un error tolerado; la afirmación incluye ese error.' },
  { id: 'bound', world: 'foundations', tex: '\\le', name: 'Cota', read: 'menor o igual que', meaning: 'Restringe un valor por arriba o por abajo sin fijarlo.', aif: '$F[q]\\ge-\\ln p(o)$: la energía libre acota la sorpresa.' },
  { id: 'implies', world: 'foundations', tex: '\\Rightarrow', name: 'Implica', read: 'implica', meaning: '$A\\Rightarrow B$: siempre que vale $A$ vale $B$. Equivale a $\\{A\\}\\subseteq\\{B\\}$.', warn: 'No es reversible: $A\\Rightarrow B$ no da $B\\Rightarrow A$.' },
  { id: 'iff', world: 'foundations', tex: '\\Leftrightarrow', name: 'Si y solo si', read: 'si y solo si', meaning: 'Implicación en ambos sentidos: mismas soluciones.' },
  { id: 'equiv', world: 'foundations', tex: '\\equiv', name: 'Equivalencia de notación', read: 'equivale a', meaning: 'Dos maneras de escribir lo mismo, p. ej. $\\langle f\\rangle_I\\equiv\\mathbb E[f\\mid I]$ en los apuntes.', warn: 'También se usa para «idénticamente igual» o congruencia.' },
  { id: 'neq', world: 'foundations', tex: '\\neq', name: 'Distinto', read: 'distinto de', meaning: 'Niega la igualdad.' },
];
