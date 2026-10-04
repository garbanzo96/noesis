import { useEffect, useMemo, useState } from 'react';
import { lerp } from '../../../engine/anim';
import { useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { Group, Html, Stage, plane } from '../../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { BoxRow, boxCenter } from '../shared/Boxes';
import { pick, randInt, rng, shuffle } from '../shared/rng';

// ============================================================================
// 1.8 · INDICADORAS — interruptores y selección
// demo: switches select a term (Σ δ a), Kronecker table, prediction, one-hot picks a column,
//       indicator of a set as a lamp, masks multiply (∩) and complement, union double-counts
//       (prediction), piecewise |x|, AIF uses
// challenges: set switch patterns for δ/indicator sums; paint indicator masks for set algebra
// ============================================================================

function Switches({ x, y, on, n, onToggle, w = 120, gap = 20 }: { x: number; y: number; on: number[]; n: number; onToggle?: (j: number) => void; w?: number; gap?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, j) => {
        const cx = boxCenter(x, n, j, w, gap);
        const v = on[j] ?? 0;
        return (
          <g key={j} onClick={onToggle ? () => onToggle(j) : undefined} style={{ cursor: onToggle ? 'pointer' : undefined }}>
            <rect x={cx - 34} y={y - 20} width={68} height={40} rx={20} fill={v ? C.green : C.panel} fillOpacity={v ? 0.35 : 1} stroke={v ? C.green : C.line} strokeWidth={2.5} />
            <circle cx={v ? cx + 14 : cx - 14} cy={y} r={14} fill={v ? C.green : C.dim} />
            <Html x={cx} y={y + 44} size={20} color={v ? C.green : C.muted}>
              <Tex tex={String(v)} />
            </Html>
          </g>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- demo scene
function IndicatorDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const a = [4, 7, 2, 9];
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1);
  const rev6 = useTween(beat > 6 || (beat === 6 && answer !== null) ? 1 : 0, 1);
  const sel = beat === 2 && rev2 > 0.5 ? 1 : 2;
  const on = a.map((_, j) => (j === sel && (beat > 0 || at(0) > 0.5) ? 1 : 0));
  const lampV = 1 - at(3);
  const colV = at(3) * (1 - at(4));
  const setV = at(4) * (1 - at(7));
  const absV = at(7);
  const L = (v: number) => 360 + v * 80; // number line 0..11
  const omega = lerp(0.2, 10.8, beat === 4 ? at(4) : 0.5);
  const inA = (v: number) => v >= 2 && v <= 7;
  const inB = (v: number) => v >= 5 && v <= 10;
  const P = plane([-3, 3], [-0.5, 3.2], { x: 480, y: 160, w: 640, h: 420 });

  return (
    <Stage>
      {/* lamps & switches */}
      <Group opacity={lampV}>
        <BoxRow x={800} y={300} values={a} highlight={on.map((v, j) => (v ? j : -1)).filter((j) => j >= 0)} />
        <Switches x={800} y={460} on={on} n={4} />
        <Html x={330} y={460} size={22} color={C.green} anchor="right">
          <Tex tex={`\\delta_{${sel + 1}j}`} />
        </Html>
        <Html x={800} y={600} size={32} color={C.text}>
          <Tex tex={`\\sum_j\\delta_{${sel + 1}j}\\,a_j=a_{${sel + 1}}=${a[sel]}`} />
        </Html>
        <Group opacity={beat === 1 ? at(1) : 0}>
          <Html x={1340} y={330} size={22} color={C.green}>
            <Tex tex="\delta=\begin{pmatrix}1&0&0&0\\0&1&0&0\\0&0&1&0\\0&0&0&1\end{pmatrix}" />
          </Html>
        </Group>
      </Group>
      {/* one-hot picks a column */}
      <Group opacity={colV}>
        {[0, 1, 2].map((i) =>
          [0, 1, 2, 3].map((j) => (
            <g key={`${i}${j}`}>
              <rect x={540 + j * 120} y={220 + i * 90} width={110} height={80} rx={8} fill={j === 2 ? C.violet : C.panel} fillOpacity={j === 2 ? 0.28 : 1} stroke={j === 2 ? C.violet : C.line} strokeWidth={2} />
              <Html x={595 + j * 120} y={260 + i * 90} size={22} color={C.text}>
                <Tex tex={`A_{${i + 1}${j + 1}}`} />
              </Html>
            </g>
          )),
        )}
        <Html x={1180} y={350} size={30} color={C.text}>
          <Tex tex="\mathbf e_3=\begin{pmatrix}0\\0\\1\\0\end{pmatrix}" />
        </Html>
        <Html x={800} y={560} size={30} color={C.violet}>
          <Tex tex="\mathbf A\,\mathbf e_3=\mathbf A_{:3}\quad(\text{la columna del estado }3)" />
        </Html>
      </Group>
      {/* sets on a line */}
      <Group opacity={setV}>
        <line x1={L(0)} x2={L(11)} y1={500} y2={500} stroke={C.dim} strokeWidth={2} />
        <rect x={L(2)} y={420} width={L(7) - L(2)} height={26} fill={C.cyan} opacity={0.4} />
        <Html x={L(4.5)} y={400} size={24} color={C.cyan}>
          <Tex tex="A" />
        </Html>
        <Group opacity={beat >= 5 ? 1 : 0}>
          <rect x={L(5)} y={454} width={L(10) - L(5)} height={26} fill={C.amber} opacity={0.4} />
          <Html x={L(9)} y={400} size={24} color={C.amber}>
            <Tex tex="B" />
          </Html>
        </Group>
        {beat === 4 && (
          <>
            <Dot x={L(omega)} y={500} r={13} color={C.text} />
            <circle cx={1300} cy={300} r={36} fill={inA(omega) ? C.green : C.panel} stroke={C.green} strokeWidth={3} />
            <Html x={1300} y={370} size={26} color={C.green}>
              <Tex tex={`\\mathbf 1_A(\\omega)=${inA(omega) ? 1 : 0}`} />
            </Html>
          </>
        )}
        {beat >= 5 &&
          Array.from({ length: 11 }, (_, k) => k + 0.5).map((v) => {
            const val = beat === 5 ? (inA(v) && inB(v) ? 1 : 0) : (inA(v) ? 1 : 0) + (inB(v) ? 1 : 0) * (beat === 6 ? 1 : 0) - (beat === 6 && rev6 < 0.5 ? 0 : 0);
            return (
              <g key={v}>
                <rect x={L(v) - 34} y={640 - val * 60} width={68} height={val * 60} fill={val === 2 ? C.red : C.green} opacity={0.7} />
                <Html x={L(v)} y={660} size={18} color={val === 2 ? C.red : C.muted}>
                  <Tex tex={String(val)} />
                </Html>
              </g>
            );
          })}
        <Html x={800} y={200} size={30} color={C.text}>
          <Tex
            tex={
              beat === 4
                ? '\\mathbf 1_A(\\omega)=\\begin{cases}1,&\\omega\\in A\\\\0,&\\omega\\notin A\\end{cases}'
                : beat === 5
                  ? '\\mathbf 1_{A\\cap B}=\\mathbf 1_A\\,\\mathbf 1_B,\\qquad \\mathbf 1_{A^{c}}=1-\\mathbf 1_A'
                  : rev6 > 0.5
                    ? '\\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B-\\mathbf 1_{A\\cap B}'
                    : '\\mathbf 1_A+\\mathbf 1_B'
            }
          />
        </Html>
      </Group>
      {/* |x| and AIF */}
      <Group opacity={absV}>
        <Axes P={P} xTicks={[-2, -1, 1, 2]} yTicks={[1, 2, 3]} />
        <Curve P={P} f={(x) => -x} a={-3} b={0} color={C.cyan} width={4} />
        <Curve P={P} f={(x) => x} a={0} b={3} color={C.amber} width={4} />
        <Html x={1300} y={250} size={28} color={C.text}>
          <Tex tex="|x|:=\begin{cases}x,&x\ge0\\-x,&x<0\end{cases}" />
        </Html>
        <Html x={800} y={680} size={26} color={C.text}>
          <Tex tex="P(A\mid I)=\langle\mathbf 1_A\rangle_I,\qquad q(u_t=u)=\sum_\pi\mathbf 1\{u_t(\pi)=u\}\,q(\pi)" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: switches
interface SwitchCase {
  tex: string;
  want: number[];
  note: string;
}
function switchCase(seed: number, round: number, a: number[]): SwitchCase {
  const r = rng(seed);
  const n = a.length;
  switch (round) {
    case 0: {
      const i = randInt(r, 1, n);
      return { tex: `\\sum_j\\delta_{${i}j}\\,a_j`, want: a.map((_, j) => (j + 1 === i ? 1 : 0)), note: `$\\delta_{${i}j}=1$ solo si $j=${i}$: la suma selecciona $a_{${i}}$.` };
    }
    case 1: {
      const i = randInt(r, 1, n - 1);
      return { tex: `\\sum_j\\delta_{i+1,\\,j}\\,a_j\\quad(i=${i})`, want: a.map((_, j) => (j + 1 === i + 1 ? 1 : 0)), note: `$i+1=${i + 1}$: se enciende el interruptor ${i + 1}.` };
    }
    case 2: {
      const t = pick(r, [4, 5, 6]);
      return { tex: `\\sum_j\\mathbf 1\\{a_j>${t}\\}`, want: a.map((v) => (v > t ? 1 : 0)), note: `Cuenta cuántos valores superan ${t}: la indicadora mira el **valor**, no la posición.` };
    }
    case 3: {
      const S = pick(r, [
        { tex: '\\{1,3,5\\}', has: (j: number) => j % 2 === 1 },
        { tex: '\\{j:\\ j\\ \\text{par}\\}', has: (j: number) => j % 2 === 0 },
        { tex: '\\{2,3\\}', has: (j: number) => j === 2 || j === 3 },
      ]);
      return { tex: `\\sum_j\\mathbf 1\\{j\\in${S.tex}\\}\\,a_j`, want: a.map((_, j) => (S.has(j + 1) ? 1 : 0)), note: `La indicadora del conjunto de índices $${S.tex}$.` };
    }
    default: {
      const i = randInt(r, 1, n);
      return { tex: `\\sum_j(1-\\delta_{${i}j})\\,a_j`, want: a.map((_, j) => (j + 1 === i ? 0 : 1)), note: `$1-\\delta_{${i}j}$ es el complemento: todos menos el ${i}.` };
    }
  }
}

function SwitchBoard({ seed, round, api }: ChallengeProps) {
  const a = useMemo(() => {
    const r = rng(seed ^ 0x27d4eb2d);
    return Array.from({ length: 5 }, () => randInt(r, 1, 9));
  }, [seed]);
  const cs = useMemo(() => switchCase(seed, round, a), [seed, round, a]);
  const [on, setOn] = useState<number[]>(() => a.map(() => 0));
  useEffect(() => {
    api.prompt(`Ajusta los interruptores $w_j\\in\\{0,1\\}$ para que $\\sum_j w_j a_j$ (o $\\sum_j w_j$) sea exactamente $${cs.tex}$.`, cs.tex);
    api.hints(['Cada interruptor es el valor de la indicadora (o de $\\delta$) para ese $j$.', cs.note]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const submit = () => {
    const j = cs.want.findIndex((w, k) => w !== on[k]);
    if (j < 0) {
      const counting = cs.tex.includes('\\mathbf 1\\{a_j');
      const val = counting ? on.reduce((s, w) => s + w, 0) : on.reduce((s, w, k) => s + w * a[k], 0);
      return api.result(true, `$${cs.tex}=${val}$. ${cs.note}`);
    }
    api.result(false, `El interruptor ${j + 1} debería estar ${cs.want[j] ? '**encendido**' : '**apagado**'}. ${cs.note}`);
  };
  return (
    <Stage>
      <Html x={800} y={150} size={40} color={C.text}>
        <Tex tex={cs.tex} />
      </Html>
      <BoxRow x={800} y={340} values={a} highlight={on.map((v, j) => (v ? j : -1)).filter((j) => j >= 0)} />
      <Html x={330} y={340} size={22} color={C.amber} anchor="right">
        <Tex tex="a_j" />
      </Html>
      <Switches
        x={800}
        y={500}
        on={on}
        n={5}
        onToggle={(j) => {
          api.sfx.click();
          setOn(on.map((v, k) => (k === j ? 1 - v : v)));
        }}
      />
      <Html x={330} y={500} size={22} color={C.green} anchor="right">
        <Tex tex="w_j" />
      </Html>
      <Html x={800} y={740} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: masks
interface MaskCase {
  tex: string;
  f: (inA: boolean, inB: boolean) => boolean;
  note: string;
}
const MASKS: MaskCase[] = [
  { tex: '\\mathbf 1_{A\\cap B}=\\mathbf 1_A\\mathbf 1_B', f: (a, b) => a && b, note: 'El producto vale 1 solo donde **ambas** valen 1.' },
  { tex: '\\mathbf 1_{A^{c}}=1-\\mathbf 1_A', f: (a) => !a, note: 'El complemento invierte la indicadora.' },
  { tex: '\\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B-\\mathbf 1_{A\\cap B}', f: (a, b) => a || b, note: 'Restar la intersección evita contarla dos veces.' },
  { tex: '\\mathbf 1_{A\\setminus B}=\\mathbf 1_A(1-\\mathbf 1_B)', f: (a, b) => a && !b, note: 'En $A$ y no en $B$.' },
];
function Masks({ seed, round, api }: ChallengeProps) {
  const { m, A, B } = useMemo(() => {
    const r = rng(seed);
    const order = shuffle(r, [0, 1, 2, 3]);
    const a0 = randInt(r, 1, 4);
    const a1 = randInt(r, a0 + 3, 8);
    const b0 = randInt(r, a0 + 1, a1);
    const b1 = randInt(r, Math.max(b0 + 2, a1), 11);
    return { m: MASKS[order[round % 4]], A: [a0, a1] as [number, number], B: [b0, b1] as [number, number] };
  }, [seed, round]);
  const N = 12;
  const inA = (k: number) => k >= A[0] && k <= A[1];
  const inB = (k: number) => k >= B[0] && k <= B[1];
  const [paint, setPaint] = useState<boolean[]>(() => Array(N).fill(false));
  const X = (k: number) => 260 + k * 92;
  useEffect(() => {
    api.prompt(`Pinta las celdas donde la indicadora vale 1: $${m.tex}$.`, m.tex);
    api.hints(['Evalúa celda por celda: ¿está en $A$? ¿está en $B$?', m.note]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m]);
  const submit = () => {
    const k = paint.findIndex((p, i) => p !== m.f(inA(i), inB(i)));
    if (k < 0) return api.result(true, `${m.note} Celdas: ${paint.filter(Boolean).length}.`);
    api.result(false, `Celda ${k}: ${inA(k) ? 'en $A$' : 'fuera de $A$'}, ${inB(k) ? 'en $B$' : 'fuera de $B$'}; ahí la indicadora vale ${m.f(inA(k), inB(k)) ? 1 : 0}.`);
  };
  return (
    <Stage>
      <Html x={800} y={140} size={36} color={C.text}>
        <Tex tex={m.tex} />
      </Html>
      <rect x={X(A[0]) - 40} y={260} width={X(A[1]) - X(A[0]) + 80} height={34} fill={C.cyan} opacity={0.4} rx={6} />
      <Html x={X(A[0]) - 60} y={277} size={26} color={C.cyan} anchor="right">
        <Tex tex="A" />
      </Html>
      <rect x={X(B[0]) - 40} y={310} width={X(B[1]) - X(B[0]) + 80} height={34} fill={C.amber} opacity={0.4} rx={6} />
      <Html x={X(B[1]) + 60} y={327} size={26} color={C.amber} anchor="left">
        <Tex tex="B" />
      </Html>
      {Array.from({ length: N }, (_, k) => (
        <g
          key={k}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            api.sfx.click();
            setPaint(paint.map((p, i) => (i === k ? !p : p)));
          }}
        >
          <rect x={X(k) - 40} y={420} width={80} height={110} rx={8} fill={paint[k] ? C.green : C.panel} fillOpacity={paint[k] ? 0.35 : 1} stroke={paint[k] ? C.green : C.line} strokeWidth={2} />
          <Html x={X(k)} y={475} size={26} color={paint[k] ? C.green : C.muted}>
            <Tex tex={paint[k] ? '1' : '0'} />
          </Html>
          <Html x={X(k)} y={560} size={18} color={C.dim}>
            <Tex tex={String(k)} />
          </Html>
        </g>
      ))}
      <Line a={[X(0) - 40, 600]} b={[X(N - 1) + 40, 600]} color={C.line} width={1} />
      <Html x={800} y={740} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l08',
  world: 'foundations',
  code: '1.8',
  title: 'Indicadoras',
  subtitle: 'interruptores y selección',
  glyph: '\\mathbf 1',
  kind: 'level',
  objective: 'Usar indicadoras, la delta de Kronecker y vectores one-hot como **interruptores** que seleccionan términos, y operar con ellas como con conjuntos.',
  glyphs: ['indicator', 'kronecker', 'onehot', 'abs', 'cases'],
  codex: ['w01-indicadoras'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Muchas fórmulas del libro **seleccionan**: la columna de un estado, la observación que ocurrió, las políticas que eligen cierta acción.',
        'La herramienta es un interruptor que vale 0 o 1. Multiplicar por él y sumar deja pasar exactamente lo que quieres.',
      ],
    },
    {
      kind: 'demo',
      title: 'Interruptores',
      Scene: IndicatorDemo,
      beats: [
        { say: 'Cuatro lámparas con valores y un interruptor por lámpara. Encender solo el 3 y sumar «valor × interruptor» deja pasar $a_3$.', tex: '\\sum_j\\g{kronecker}{\\delta_{3j}}\\,a_j=a_3', dur: 1.8 },
        { say: 'La **delta de Kronecker** es el patrón de interruptores: vale 1 cuando los dos índices coinciden. Como tabla, es la identidad.', tex: '\\delta_{ij}:=\\begin{cases}1,&i=j\\\\0,&i\\neq j\\end{cases}', dur: 1.8 },
        {
          say: 'Selección con otro índice.',
          tex: '\\sum_j\\delta_{2j}\\,a_j=\\;?',
          ask: { prompt: '¿Cuánto vale $\\sum_j\\delta_{2j}\\,a_j$?', options: ['$a_2=7$', '$\\sum_j a_j$', '$0$'], answer: 0, explain: 'Solo el término con $j=2$ sobrevive: $\\sum_j\\delta_{ij}a_j=a_i$.' },
        },
        { say: 'Un vector **one-hot** tiene un 1 y el resto ceros. Multiplicar una matriz por $\\mathbf e_j$ extrae su columna $j$: la distribución de observaciones del estado $j$.', tex: '\\g{onehot}{\\mathbf e_j},\\qquad \\mathbf A\\,\\mathbf e_j=\\mathbf A_{:j}', dur: 1.8 },
        { say: 'La **indicadora** de un conjunto es una lámpara: se enciende cuando $\\omega$ cae dentro.', tex: '\\g{indicator}{\\mathbf 1_A}(\\omega)', dur: 3 },
        { say: 'Las máscaras se combinan con aritmética: la intersección es un **producto**; el complemento, $1-$.', tex: '\\mathbf 1_{A\\cap B}=\\mathbf 1_A\\mathbf 1_B,\\qquad\\mathbf 1_{A^c}=1-\\mathbf 1_A', dur: 1.8 },
        {
          say: '¿Y la unión?',
          tex: '\\mathbf 1_{A\\cup B}\\ \\overset{?}{=}\\ \\mathbf 1_A+\\mathbf 1_B',
          ask: {
            prompt: '¿Vale $\\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B$?',
            options: ['No en general: en $A\\cap B$ la suma vale 2', 'Sí, siempre', 'Nunca'],
            answer: 0,
            explain: 'La suma cuenta dos veces la intersección. Corrección: $\\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B-\\mathbf 1_{A\\cap B}$ (vale sin corrección solo si $A$ y $B$ son disjuntos).',
          },
        },
        {
          say: 'Las definiciones **por casos** son interruptores sobre la regla. En los apuntes, la probabilidad es el promedio de una indicadora.',
          tex: '\\g{abs}{|x|}\\g{cases}{:=\\begin{cases}x,&x\\ge0\\\\-x,&x<0\\end{cases}}',
          dur: 2,
        },
      ],
    },
    { kind: 'challenge', title: 'Interruptores', Comp: SwitchBoard, rounds: 5 },
    { kind: 'challenge', title: 'Máscaras', Comp: Masks, rounds: 4 },
    { kind: 'codex', entry: 'w01-indicadoras' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-indicadoras',
    world: 'foundations',
    level: 'w01-l08',
    title: 'Indicadoras, Kronecker y one-hot',
    summary: 'Una indicadora es un interruptor 0/1; multiplicar por ella y sumar selecciona términos.',
    blocks: [
      { label: 'Indicadora', tex: '\\mathbf 1_A(\\omega):=\\begin{cases}1,&\\omega\\in A\\\\0,&\\omega\\notin A\\end{cases}' },
      { label: 'Kronecker', tex: '\\delta_{ij}:=\\begin{cases}1,&i=j\\\\0,&i\\neq j\\end{cases},\\qquad \\sum_j\\delta_{ij}a_j=a_i' },
      { label: 'One-hot', tex: '\\mathbf e_j=(0,\\dots,1,\\dots,0),\\qquad \\mathbf A\\mathbf e_j=\\mathbf A_{:j}' },
      { label: 'Álgebra de conjuntos', tex: '\\mathbf 1_{A\\cap B}=\\mathbf 1_A\\mathbf 1_B,\\quad \\mathbf 1_{A^c}=1-\\mathbf 1_A,\\quad \\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B-\\mathbf 1_{A\\cap B}' },
      { label: 'Selección de valores', tex: 'f(x)=\\sum_i\\mathbf 1_{\\{x=x_i\\}}f(x_i)', body: 'Para $x$ en un conjunto finito $\\{x_i\\}$ (apuntes, ec. 8).' },
      { label: 'Por casos', tex: '|x|:=\\begin{cases}x,&x\\ge0\\\\-x,&x<0\\end{cases}' },
    ],
    pitfalls: [
      '$\\mathbf 1_{A\\cup B}=\\mathbf 1_A+\\mathbf 1_B$ cuenta dos veces la intersección.',
      'Los apuntes escriben la indicadora como $Q(A)$; en el proyecto se usa $\\mathbf 1_A$ y $q$ se reserva para creencias variacionales.',
      'Confundir el vector one-hot $\\mathbf e_j$ con el número $e$.',
    ],
    aif: [
      { tex: 'P(A\\mid I):=\\langle\\mathbf 1_A\\rangle_I', text: 'La probabilidad como promedio de una indicadora (apuntes, ec. 1).' },
      { tex: 'q(u_t=u)=\\sum_\\pi\\mathbf 1\\{u_t(\\pi)=u\\}\\,q(\\pi)', text: 'Probabilidad de una acción: suma de las políticas que la eligen (guía G10).' },
      { tex: '\\mathbf A^{\\mathsf T}\\mathbf o_\\tau', text: 'Con $\\mathbf o_\\tau$ one-hot, selecciona la fila de la observación ocurrida (guía G10).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'indicator', world: 'foundations', tex: '\\mathbf 1_A', name: 'Indicadora', read: 'indicadora de A', meaning: 'Vale 1 dentro de $A$ y 0 fuera.', warn: 'En los apuntes: $Q(A)$.' },
  { id: 'kronecker', world: 'foundations', tex: '\\delta_{ij}', name: 'Delta de Kronecker', read: 'delta i jota', meaning: '1 si $i=j$, 0 si no. $\\sum_j\\delta_{ij}a_j=a_i$.', warn: 'No confundir con la delta de Dirac $\\delta(x)$ (sector 03).' },
  { id: 'onehot', world: 'foundations', tex: '\\mathbf e_j', name: 'Vector one-hot', read: 'e jota', meaning: 'Un 1 en la posición $j$ y ceros en el resto. Selecciona la columna $j$: $\\mathbf A\\mathbf e_j=\\mathbf A_{:j}$.', warn: 'No es el número $e$.', aif: 'Observaciones codificadas como $\\mathbf o_\\tau$ one-hot.' },
  { id: 'abs', world: 'foundations', tex: '|x|', name: 'Valor absoluto', read: 'valor absoluto de equis', meaning: '$x$ si $x\\ge0$, $-x$ si $x<0$: distancia al cero.', warn: 'Para conjuntos, $|A|$ es el cardinal.' },
  { id: 'cases', world: 'foundations', tex: '\\begin{cases}\\cdot\\\\\\cdot\\end{cases}', name: 'Definición por casos', read: 'si … si no …', meaning: 'La regla cambia según la condición escrita a la derecha.' },
];
