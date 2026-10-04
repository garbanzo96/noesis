import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { pick, rng, shuffle } from '../shared/rng';

// ============================================================================
// 1.2 · CONJUNTOS — espacios de posibilidades
// demo: ∈ / ∉, ⊆ vs ∈ (prediction), intervals open/closed, set-builder as a filter,
//       Cartesian product unfolded by the player (gate), |X×Y| (prediction), AIF state spaces
// challenges: membership on a line; build intervals with brackets (∞ refuses to close)
// ============================================================================

// ---------------------------------------------------------------- demo scene
function SetsDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1);
  const rev6 = useTween(beat > 6 || (beat === 6 && answer !== null) ? 1 : 0, 1.2);
  const [unfold, setUnfold] = useState(0);
  const onDrag = useSvgDrag(svg, (x) => {
    if (beat !== 5) return;
    const u = clamp((x - 600) / 600, 0, 1);
    setUnfold(u);
    if (u > 0.95) unlock();
  });
  const unf = beat > 5 ? 1 : beat === 5 ? unfold : 0;

  const setsV = 1 - at(3);
  const lineV = at(3) * (1 - at(5));
  const gridV = at(5) * (1 - at(7));
  const aifV = at(7);
  const X = (v: number) => 800 + v * 260;

  return (
    <Stage ref={svg}>
      {/* containers */}
      <Group opacity={setsV}>
        <rect x={420} y={220} width={560} height={360} rx={40} fill={C.cyan} fillOpacity={0.05} stroke={C.cyan} strokeWidth={3} />
        <Html x={460} y={250} size={32} color={C.cyan} anchor="top-left">
          <Tex tex="A" />
        </Html>
        <Group opacity={at(1)}>
          <rect x={470} y={300} width={300} height={240} rx={30} fill={C.amber} fillOpacity={0.06} stroke={C.amber} strokeWidth={2.5} strokeDasharray="8 6" />
          <Html x={500} y={320} size={28} color={C.amber} anchor="top-left">
            <Tex tex="B" />
          </Html>
        </Group>
        {[
          { v: '1', x: 560, y: 430 },
          { v: '2', x: 680, y: 430 },
          { v: '3', x: 870, y: 400 },
        ].map((t, i) => (
          <Group key={t.v} opacity={lagged(at(0), i, 3, 0.4)}>
            <circle cx={t.x} cy={t.y} r={32} fill={C.panel} stroke={C.text} strokeWidth={2} />
            <Html x={t.x} y={t.y} size={30} color={C.text}>
              <Tex tex={t.v} />
            </Html>
          </Group>
        ))}
        <Group opacity={at(0)}>
          <circle cx={1150} cy={400} r={32} fill={C.panel} stroke={C.red} strokeWidth={2} />
          <Html x={1150} y={400} size={30} color={C.red}>
            <Tex tex="4" />
          </Html>
          <Html x={1150} y={470} size={24} color={C.red}>
            <Tex tex="4\notin A" />
          </Html>
          <Html x={700} y={630} size={28} color={C.text}>
            <Tex tex={beat >= 1 ? 'A=\\{1,2,3\\},\\quad B=\\{1,2\\}\\subseteq A' : 'A=\\{1,2,3\\},\\quad 1\\in A'} />
          </Html>
        </Group>
        {/* {1} as a box */}
        <Group opacity={rev2}>
          <rect x={1080} y={180} width={140} height={100} rx={18} fill="none" stroke={C.violet} strokeWidth={2.5} />
          <Html x={1150} y={230} size={28} color={C.violet}>
            <Tex tex="\{1\}" />
          </Html>
          <Html x={1150} y={300} size={22} color={C.violet}>
            <Tex tex="\{1\}\subseteq A,\ \ \{1\}\notin A" />
          </Html>
        </Group>
      </Group>

      {/* intervals and set-builder */}
      <Group opacity={lineV}>
        <line x1={X(-1.6)} x2={X(2.6)} y1={420} y2={420} stroke={C.dim} strokeWidth={2} />
        {[-1, 0, 1, 2].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={410} y2={430} stroke={C.dim} strokeWidth={2} />
            <Html x={X(t)} y={456} size={22} color={C.muted}>
              <Tex tex={String(t)} />
            </Html>
          </g>
        ))}
        <Group opacity={beat === 3 ? 1 : 0.35}>
          <rect x={X(0)} y={360} width={X(1) - X(0)} height={16} fill={C.violet} opacity={0.6} />
          <circle cx={X(0)} cy={368} r={11} fill={C.violet} />
          <circle cx={X(1)} cy={368} r={11} fill={C.violet} />
          <Html x={X(0.5)} y={330} size={26} color={C.violet}>
            <Tex tex="[0,1]" />
          </Html>
          <rect x={X(0)} y={300} width={X(2.6) - X(0)} height={16} fill={C.cyan} opacity={0.45} />
          <circle cx={X(0)} cy={308} r={11} fill={C.bg} stroke={C.cyan} strokeWidth={3} />
          <path d={`M${X(2.6)} 296l22 12l-22 12z`} fill={C.cyan} />
          <Html x={X(1.6)} y={270} size={26} color={C.cyan}>
            <Tex tex="(0,\infty)" />
          </Html>
        </Group>
        {/* filter */}
        {beat >= 4 &&
          [-1.4, -0.5, 0, 0.3, 1, 2.2].map((v, i) => {
            const t = lagged(at(4), i, 6, 0.3);
            const pass = v >= 0;
            const y = 180 + t * 190;
            return (
              <Group key={v} opacity={Math.min(1, t * 3)}>
                <circle cx={X(v)} cy={pass ? y : Math.min(y, 330)} r={20} fill={pass ? C.green : C.red} opacity={0.85} />
                <Html x={X(v)} y={pass ? y : Math.min(y, 330)} size={18} color={C.bg}>
                  <Tex tex={fmt(v, 1)} />
                </Html>
              </Group>
            );
          })}
        {beat >= 4 && (
          <>
            <rect x={X(-1.6)} y={344} width={X(0) - X(-1.6) - 6} height={8} fill={C.red} opacity={0.7 * at(4)} />
            <Html x={X(-0.8)} y={600} size={28} color={C.text} opacity={at(4)}>
              <Tex tex="\{x\in\mathbb R:\ x\ge0\}=[0,\infty)" />
            </Html>
          </>
        )}
      </Group>

      {/* Cartesian product */}
      <Group opacity={gridV}>
        {(() => {
          const rows = rev6 > 0.5 ? 4 : 2;
          const cols = 3;
          const cell = 110;
          const gx = 620;
          const gy = 240;
          return (
            <>
              {Array.from({ length: rows }, (_, r) => (
                <Html key={'r' + r} x={gx - 60} y={gy + r * cell + cell / 2} size={24} color={C.cyan}>
                  <Tex tex={`x_${r + 1}`} />
                </Html>
              ))}
              {Array.from({ length: cols }, (_, c) => (
                <Html key={'c' + c} x={gx + c * cell * unf + cell / 2} y={gy - 34} size={24} color={C.amber} opacity={Math.min(1, unf * 3)}>
                  <Tex tex={`y_${c + 1}`} />
                </Html>
              ))}
              {Array.from({ length: rows * cols }, (_, k) => {
                const r = Math.floor(k / cols);
                const c = k % cols;
                const show = clamp(unf * cols - c, 0, 1);
                return (
                  <Group key={k} opacity={show}>
                    <rect x={gx + c * cell + 6} y={gy + r * cell + 6} width={cell - 12} height={cell - 12} rx={10} fill={C.violet} fillOpacity={0.15} stroke={C.violet} strokeWidth={1.5} />
                    <Html x={gx + c * cell + cell / 2} y={gy + r * cell + cell / 2} size={18} color={C.text}>
                      <Tex tex={`(x_${r + 1},y_${c + 1})`} />
                    </Html>
                  </Group>
                );
              })}
              {beat === 5 && (
                <g style={{ cursor: 'ew-resize' }} onPointerDown={onDrag}>
                  <rect x={600} y={gy + rows * cell + 30} width={640} height={60} fill="transparent" />
                  <line x1={600} x2={1200} y1={gy + rows * cell + 60} y2={gy + rows * cell + 60} stroke={C.line} strokeWidth={5} />
                  <Dot x={600 + unfold * 600} y={gy + rows * cell + 60} r={14} color={C.amber} ring />
                </g>
              )}
              <Html x={1330} y={gy + 110} size={30} color={C.text}>
                <Tex tex={`|X\\times Y|=${rows}\\cdot${cols}=${rows * cols}`} />
              </Html>
            </>
          );
        })()}
      </Group>

      {/* AIF state spaces */}
      <Group opacity={aifV}>
        <Html x={800} y={260} size={34} color={C.text}>
          <Tex tex="s_\tau\in\{1,\dots,N_s\},\qquad o_\tau\in\{1,\dots,N_o\}" />
        </Html>
        <Html x={800} y={380} size={30} color={C.text}>
          <Tex tex="\mathbf s=(s^{(1)},s^{(2)})\in S^{(1)}\times S^{(2)},\quad |S^{(1)}\times S^{(2)}|=|S^{(1)}|\,|S^{(2)}|" />
        </Html>
        <Html x={800} y={500} size={30} color={C.text}>
          <Tex tex="p(s)\in[0,1],\qquad \ln:(0,\infty)\to\mathbb R" />
        </Html>
        <Html x={800} y={620} size={24} color={C.amber}>
          <Tex tex="|A|=\text{cardinal (cuántos elementos)}\quad\neq\quad|x|=\text{valor absoluto}" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: membership
interface MemberSet {
  tex: string;
  has: (v: number) => boolean;
  cands: number[];
  why: (v: number) => string;
}
const INF = Infinity;
const vt = (v: number) => (v === INF ? '\\infty' : fmt(v, 2).replace('−', '-'));
function memberSet(seed: number, round: number): MemberSet {
  const r = rng(seed);
  switch (round) {
    case 0:
      return {
        tex: '[0,1]',
        has: (v) => v >= 0 && v <= 1,
        cands: shuffle(r, [-0.5, 0, 0.5, 1, 1.5]),
        why: (v) => (v === 0 || v === 1 ? `$${vt(v)}\\in[0,1]$: el corchete **incluye** el extremo.` : `$${vt(v)}$ está fuera de $[0,1]$.`),
      };
    case 1:
      return {
        tex: '(0,\\infty)',
        has: (v) => v > 0 && v !== INF,
        cands: shuffle(r, [-1, 0, 0.25, 3, INF]),
        why: (v) => (v === 0 ? '$0\\notin(0,\\infty)$: el paréntesis **excluye** el extremo.' : v === INF ? '$\\infty$ no es un número real: $(0,\\infty)$ no lo contiene.' : `$${vt(v)}$ ${v > 0 ? 'sí' : 'no'} es positivo.`),
      };
    case 2: {
      const closedRight = r() < 0.5;
      return {
        tex: closedRight ? '(0,1]' : '[0,1)',
        has: (v) => (closedRight ? v > 0 && v <= 1 : v >= 0 && v < 1),
        cands: shuffle(r, [0, 0.5, 1, 1.25, -0.25]),
        why: (v) => (v === 0 || v === 1 ? `Revisa el extremo $${vt(v)}$: ${closedRight ? '$(0,1]$ excluye 0 e incluye 1' : '$[0,1)$ incluye 0 y excluye 1'}.` : `$${vt(v)}$ ${v > 0 && v < 1 ? 'está dentro' : 'está fuera'}.`),
      };
    }
    case 3:
      return {
        tex: '\\{1,\\dots,4\\}',
        has: (v) => Number.isInteger(v) && v >= 1 && v <= 4,
        cands: shuffle(r, [0, 1, 2.5, 3, 4, 5]),
        why: (v) => (!Number.isInteger(v) ? `$${vt(v)}\\notin\\{1,\\dots,4\\}$: solo contiene enteros.` : `$${vt(v)}$ ${v >= 1 && v <= 4 ? 'está' : 'no está'} entre 1 y 4.`),
      };
    default:
      return {
        tex: '\\{x\\in\\mathbb R:\\ x^2<1\\}',
        has: (v) => v * v < 1,
        cands: shuffle(r, [-1.5, -1, -0.5, 0, 0.9, 1]),
        why: (v) => `$${vt(v)}^2=${fmt(v * v, 2)}$ ${v * v < 1 ? '<' : '\\ge'} 1.`,
      };
  }
}

function Membership({ seed, round, api }: ChallengeProps) {
  const set = useMemo(() => memberSet(seed, round), [seed, round]);
  const [picked, setPicked] = useState<boolean[]>(() => set.cands.map(() => false));
  useEffect(() => {
    api.prompt(`Marca los números que **pertenecen** a $${set.tex}$.`, `x\\in${set.tex}\\ ?`);
    api.hints(['Fíjate en los extremos: corchete $[\\,]$ incluye, paréntesis $(\\,)$ excluye. $\\infty$ no es un número.', `Revisa uno por uno con la condición que define $${set.tex}$.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);
  const submit = () => {
    const i = set.cands.findIndex((v, k) => picked[k] !== set.has(v));
    if (i < 0) return api.result(true, `Exacto: $${set.cands.filter((v) => set.has(v)).map(vt).join(',\\ ')}\\in${set.tex}$.`);
    const v = set.cands[i];
    api.result(false, `${picked[i] ? 'Marcaste' : 'Falta'} $${vt(v)}$. ${set.why(v)}`);
  };
  const n = set.cands.length;
  return (
    <Stage>
      <Html x={800} y={170} size={48} color={C.violet}>
        <Tex tex={set.tex} />
      </Html>
      {set.cands.map((v, i) => {
        const x = 800 + (i - (n - 1) / 2) * 200;
        return (
          <g
            key={i}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              api.sfx.click();
              setPicked(picked.map((p, k) => (k === i ? !p : p)));
            }}
          >
            <circle cx={x} cy={430} r={62} fill={picked[i] ? C.violet : C.panel} fillOpacity={picked[i] ? 0.3 : 1} stroke={picked[i] ? C.violet : C.line} strokeWidth={3} />
            <Html x={x} y={430} size={34} color={C.text}>
              <Tex tex={vt(v)} />
            </Html>
          </g>
        );
      })}
      <Html x={800} y={580} size={20} color={C.muted}>
        <span className="panel-note">clic para marcar / desmarcar</span>
      </Html>
      <Html x={800} y={720} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: build intervals
interface IntervalCase {
  desc: string;
  lo: number;
  loClosed: boolean;
  hi: number;
  hiClosed: boolean;
  tex: string;
}
function intervalCase(seed: number, round: number): IntervalCase {
  const r = rng(seed);
  switch (round) {
    case 0:
      return { desc: 'Valores admisibles de una **probabilidad**', lo: 0, loClosed: true, hi: 1, hiClosed: true, tex: '[0,1]' };
    case 1:
      return { desc: '**Dominio** del logaritmo natural', lo: 0, loClosed: false, hi: INF, hiClosed: false, tex: '(0,\\infty)' };
    case 2:
      return { desc: 'Valores de $\\ln p$ cuando $p\\in(0,1]$', lo: -INF, loClosed: false, hi: 0, hiClosed: true, tex: '(-\\infty,0]' };
    default:
      return pick(r, [
        { desc: '$\\{x:\\ -1<x\\le2\\}$', lo: -1, loClosed: false, hi: 2, hiClosed: true, tex: '(-1,2]' },
        { desc: '$\\{x:\\ |x|\\le1\\}$', lo: -1, loClosed: true, hi: 1, hiClosed: true, tex: '[-1,1]' },
        { desc: '$\\{x:\\ x<3\\}$', lo: -INF, loClosed: false, hi: 3, hiClosed: false, tex: '(-\\infty,3)' },
      ]);
  }
}

function IntervalBuilder({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => intervalCase(seed, round), [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  const [lo, setLo] = useState(-2);
  const [hi, setHi] = useState(2.5);
  const [loC, setLoC] = useState(true);
  const [hiC, setHiC] = useState(true);
  const which = useRef<'lo' | 'hi' | null>(null);
  const press = useRef({ x: 0, near: false, moved: false });
  const X = (v: number) => (v === INF ? 1450 : v === -INF ? 150 : 800 + v * 140);
  const fromX = (x: number) => {
    if (x > 1400) return INF;
    if (x < 200) return -INF;
    return Math.round(clamp((x - 800) / 140, -4, 4) * 2) / 2;
  };
  // one gesture: drag moves the nearest endpoint; a click on an endpoint toggles its bracket
  const onDrag = useSvgDrag(svg, (x, _y, phase) => {
    if (phase === 'start') {
      which.current = Math.abs(x - X(lo)) <= Math.abs(x - X(hi)) ? 'lo' : 'hi';
      const ex = which.current === 'lo' ? X(lo) : X(hi);
      press.current = { x, near: Math.abs(x - ex) < 34, moved: false };
      return;
    }
    if (Math.abs(x - press.current.x) > 6) press.current.moved = true;
    if (phase === 'end') {
      if (!press.current.moved && press.current.near && which.current) toggle(which.current);
      which.current = null;
      return;
    }
    if (!press.current.moved) return;
    const v = fromX(x);
    if (which.current === 'lo' && v < hi && v !== INF) {
      setLo(v);
      if (v === -INF) setLoC(false);
    }
    if (which.current === 'hi' && v > lo && v !== -INF) {
      setHi(v);
      if (v === INF) setHiC(false);
    }
  });
  const toggle = (side: 'lo' | 'hi') => {
    const v = side === 'lo' ? lo : hi;
    if (Math.abs(v) === INF) {
      api.sfx.bad();
      api.prompt(`$\\infty$ no es un número: un extremo en $${side === 'lo' ? '-\\infty' : '\\infty'}$ es **siempre abierto**. Construye: ${cs.desc}.`);
      return;
    }
    api.sfx.click();
    if (side === 'lo') setLoC(!loC);
    else setHiC(!hiC);
  };
  useEffect(() => {
    api.prompt(`Construye el intervalo: ${cs.desc}. Arrastra los extremos; clic en un extremo cambia corchete/paréntesis.`);
    api.hints(['Pregúntate si cada extremo pertenece al conjunto.', `La respuesta es $${cs.tex}$.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const shownTex = `${loC ? '[' : '('}${vt(lo)},${vt(hi)}${hiC ? ']' : ')'}`;
  const submit = () => {
    if (lo === cs.lo && hi === cs.hi && loC === cs.loClosed && hiC === cs.hiClosed) return api.result(true, `$${cs.tex}$.`);
    if (lo !== cs.lo || hi !== cs.hi) return api.result(false, `Tus extremos son $${vt(lo)}$ y $${vt(hi)}$; el conjunto pedido va de $${vt(cs.lo)}$ a $${vt(cs.hi)}$.`);
    const side = loC !== cs.loClosed ? 'izquierdo' : 'derecho';
    const v = loC !== cs.loClosed ? cs.lo : cs.hi;
    const shouldClose = loC !== cs.loClosed ? cs.loClosed : cs.hiClosed;
    api.result(false, `Extremos correctos, pero el ${side} ($${vt(v)}$) ${shouldClose ? '**pertenece** al conjunto: corchete' : '**no pertenece**: paréntesis'}.`);
  };
  const bracket = (x: number, closed: boolean, left: boolean) => {
    const d = left ? 1 : -1;
    return closed ? (
      <path d={`M${x + 16 * d} 410 L${x} 410 L${x} 490 L${x + 16 * d} 490`} fill="none" stroke={C.violet} strokeWidth={5} />
    ) : (
      <path d={`M${x + 16 * d} 410 Q${x - 6 * d} 450 ${x + 16 * d} 490`} fill="none" stroke={C.violet} strokeWidth={5} />
    );
  };
  return (
    <Stage ref={svg}>
      <Html x={800} y={170} size={30} color={C.text}>
        <Tex tex={`\\text{tu intervalo: }${shownTex}`} />
      </Html>
      <line x1={150} x2={1450} y1={450} y2={450} stroke={C.dim} strokeWidth={2} />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={440} y2={460} stroke={C.dim} strokeWidth={2} />
          <Html x={X(t)} y={520} size={20} color={C.muted}>
            <Tex tex={String(t)} />
          </Html>
        </g>
      ))}
      <Html x={150} y={520} size={22} color={C.muted}>
        <Tex tex="-\infty" />
      </Html>
      <Html x={1450} y={520} size={22} color={C.muted}>
        <Tex tex="\infty" />
      </Html>
      <rect x={X(lo)} y={440} width={X(hi) - X(lo)} height={20} fill={C.violet} opacity={0.35} />
      <g onPointerDown={onDrag} style={{ cursor: 'ew-resize' }}>
        <rect x={130} y={390} width={1340} height={120} fill="transparent" />
      </g>
      <g pointerEvents="none">
        {bracket(X(lo), loC, true)}
        {bracket(X(hi), hiC, false)}
      </g>
      <Html x={800} y={600} size={20} color={C.muted}>
        <span className="panel-note">arrastra cerca de un extremo para moverlo · clic en el extremo para abrir/cerrar</span>
      </Html>
      <Html x={800} y={720} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l02',
  world: 'foundations',
  code: '1.2',
  title: 'Conjuntos',
  subtitle: 'espacios de posibilidades',
  glyph: '\\in',
  kind: 'level',
  objective: 'Declarar qué valores puede tomar una variable: pertenencia, inclusión, intervalos abiertos y cerrados, conjuntos por comprensión y productos cartesianos.',
  glyphs: ['in', 'subseteq', 'setbuilder', 'interval', 'reals', 'range', 'cartesian', 'card'],
  codex: ['w01-conjuntos'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Antes de tener una creencia sobre algo, tengo que declarar **qué valores puede tomar**. Un conjunto es esa declaración.',
        'Mis estados ocultos viven en $\\{1,\\dots,N_s\\}$; mis probabilidades en $[0,1]$; el logaritmo solo acepta $(0,\\infty)$.',
        'Si el espacio de posibilidades está mal declarado, todo lo que se calcula sobre él hereda el error.',
      ],
    },
    {
      kind: 'demo',
      title: 'Espacios',
      Scene: SetsDemo,
      beats: [
        { say: 'Un conjunto agrupa elementos. $\\in$ dice que un elemento está dentro; $\\notin$, que no.', tex: '1\\g{in}{\\in}A,\\qquad 4\\notin A', dur: 1.8 },
        { say: '$\\subseteq$ relaciona **conjuntos**: todo elemento de $B$ está en $A$.', tex: 'B\\g{subseteq}{\\subseteq}A', dur: 1.6 },
        {
          say: '$\\in$ y $\\subseteq$ no son intercambiables.',
          tex: '\\{1\\}\\ ?\\ A',
          ask: {
            prompt: 'Con $A=\\{1,2,3\\}$, ¿es correcto escribir $\\{1\\}\\in A$?',
            options: ['No: $\\{1\\}\\subseteq A$, pero $\\{1\\}$ no es un elemento de $A$', 'Sí', 'Es lo mismo que $1\\in A$'],
            answer: 0,
            explain: '$\\{1\\}$ es un **conjunto** que contiene al 1. Sus elementos están en $A$, así que $\\{1\\}\\subseteq A$; pero los elementos de $A$ son 1, 2, 3, no $\\{1\\}$.',
          },
        },
        {
          say: 'En la recta: el corchete **incluye** el extremo, el paréntesis lo **excluye**. $\\infty$ no es un número: siempre va con paréntesis.',
          tex: '\\g{interval}{[0,1]}:=\\{x\\in\\g{reals}{\\mathbb R}:0\\le x\\le1\\},\\qquad(0,\\infty)',
          dur: 2,
        },
        {
          say: 'Un conjunto **por comprensión** es un filtro: pasan los números que cumplen la condición.',
          tex: '\\g{setbuilder}{\\{x\\in\\mathbb R:\\ x\\ge0\\}}=[0,\\infty)',
          dur: 2.6,
        },
        {
          say: 'El **producto cartesiano** combina dos espacios: cada par $(x,y)$ es un estado conjunto.',
          tex: 'X\\g{cartesian}{\\times}Y:=\\{(x,y):x\\in X,\\ y\\in Y\\}',
          gate: 'Arrastra el control para desplegar $Y$ y generar la rejilla $X\\times Y$.',
        },
        {
          say: 'Cuenta los estados conjuntos.',
          tex: '|X\\times Y|=\\;?',
          ask: {
            prompt: 'Con 4 posiciones y 3 contextos, ¿cuántos estados conjuntos hay?',
            options: ['12', '7', '64'],
            answer: 0,
            explain: '$|X\\times Y|=|X|\\cdot|Y|=4\\cdot3=12$. Los factores de estado de un modelo **multiplican** su tamaño: por eso los modelos crecen rápido.',
          },
        },
        {
          say: 'En el libro: estados y observaciones en conjuntos finitos indexados; varios factores forman un espacio producto. Ojo: $|A|$ es un **cardinal**, no un valor absoluto.',
          tex: 's_\\tau\\in\\g{range}{\\{1,\\dots,N_s\\}},\\qquad \\g{card}{|A|}=\\text{número de elementos}',
          dur: 2,
        },
      ],
    },
    { kind: 'challenge', title: 'Pertenencia', Comp: Membership, rounds: 5 },
    { kind: 'challenge', title: 'Constructor de intervalos', Comp: IntervalBuilder, rounds: 4 },
    { kind: 'codex', entry: 'w01-conjuntos' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-conjuntos',
    world: 'foundations',
    level: 'w01-l02',
    title: 'Conjuntos',
    summary: 'Un conjunto declara de antemano qué valores puede tomar una variable.',
    blocks: [
      { label: 'Pertenencia', tex: 'x\\in A,\\qquad x\\notin A' },
      { label: 'Inclusión', tex: 'B\\subseteq A\\iff(x\\in B\\Rightarrow x\\in A)', body: '$\\in$ relaciona elemento y conjunto; $\\subseteq$, conjunto y conjunto.' },
      { label: 'Por comprensión', tex: '\\{x\\in A:\\ \\text{condición}(x)\\}' },
      {
        label: 'Intervalos',
        tex: '[a,b]=\\{x:a\\le x\\le b\\},\\quad (a,b)=\\{x:a<x<b\\},\\quad (0,\\infty)=\\{x:x>0\\}',
        body: '$\\infty\\notin\\mathbb R$: un extremo infinito siempre es abierto.',
      },
      { label: 'Rangos de índices', tex: '\\{1,\\dots,n\\}' },
      { label: 'Producto cartesiano', tex: 'A\\times B=\\{(a,b):a\\in A,\\ b\\in B\\},\\qquad |A\\times B|=|A|\\,|B|' },
    ],
    pitfalls: [
      'Confundir $\\in$ con $\\subseteq$: $\\{1\\}\\subseteq A$ pero $\\{1\\}\\notin A$ si $A=\\{1,2,3\\}$.',
      'Confundir $|A|$ (cardinal) con $|x|$ (valor absoluto).',
      'Olvidar que $(0,\\infty)$ excluye el 0: $\\ln 0$ no está definido.',
    ],
    aif: [
      { tex: 's_\\tau\\in\\{1,\\dots,N_s\\}', text: 'Estados ocultos discretos; observaciones análogas.' },
      { tex: 'S^{(1)}\\times S^{(2)}', text: 'Varios factores de estado: el tensor $\\mathbf A$ se indexa por resultado y por cada factor (atlas de notación).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'in', world: 'foundations', tex: '\\in', name: 'Pertenece', read: 'pertenece a', meaning: '$x\\in A$: el elemento $x$ está en el conjunto $A$.' },
  { id: 'subseteq', world: 'foundations', tex: '\\subseteq', name: 'Subconjunto', read: 'está contenido en', meaning: '$B\\subseteq A$: todo elemento de $B$ está en $A$.', warn: 'No confundir con $\\in$.' },
  { id: 'setbuilder', world: 'foundations', tex: '\\{x:\\ldots\\}', name: 'Conjunto por comprensión', read: 'el conjunto de los x tales que', meaning: 'Los elementos que cumplen la condición escrita tras los dos puntos (o la barra vertical).' },
  { id: 'interval', world: 'foundations', tex: '[a,b),\\,(a,b]', name: 'Intervalo', read: 'intervalo', meaning: 'Corchete incluye el extremo; paréntesis lo excluye. $\\infty$ siempre con paréntesis.' },
  { id: 'reals', world: 'foundations', tex: '\\mathbb R', name: 'Números reales', read: 'erre', meaning: 'La recta numérica completa. $\\infty\\notin\\mathbb R$.' },
  { id: 'range', world: 'foundations', tex: '\\{1,\\dots,n\\}', name: 'Rango de índices', read: 'de uno a ene', meaning: 'Los enteros de 1 a $n$: los valores posibles de un índice o de un estado discreto.' },
  { id: 'cartesian', world: 'foundations', tex: '\\times', name: 'Producto cartesiano', read: 'por', meaning: '$A\\times B$: todos los pares $(a,b)$. $|A\\times B|=|A||B|$.', warn: 'Entre conjuntos, $\\times$ no es una multiplicación de números.' },
  { id: 'card', world: 'foundations', tex: '|A|', name: 'Cardinal', read: 'cardinal de A', meaning: 'Número de elementos de un conjunto finito.', warn: 'Para números, $|x|$ es el valor absoluto.' },
];
