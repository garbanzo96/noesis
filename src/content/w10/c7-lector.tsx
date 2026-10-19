import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 10.7 · «El lector» — factor de Bayes
// Controles ambiguos: un lector honesto marca positivo con 0,5; uno alterado, con 0,8.
// 4 positivos en 5 controles: P(D|H) = 1/32, P(D|A) = 0,08192, BF ≈ 2,62 → P(A|D) ≈ 0,72.
// ============================================================================

const SEQ = [1, 1, 0, 1, 1];
const PH = 0.5,
  PA = 0.8;
const NSL = { x0: 1110, x1: 1400, y: 660 };

function likelihood(seq: number[], p: number) {
  return seq.reduce((acc, s) => acc * (s ? p : 1 - p), 1);
}

/** a row of control results; filled discs are positives */
function Controls({ seq, y = 210 }: { seq: number[]; y?: number }) {
  return (
    <g>
      {SEQ.map((s, i) => {
        const shown = i < seq.length;
        return (
          <g key={i} opacity={shown ? 1 : 0.2}>
            <circle
              cx={260 + i * 120}
              cy={y}
              r={38}
              fill={shown && s ? C.amber : C.panel}
              stroke={C.amber}
              strokeWidth={3}
            />
            <Cap x={260 + i * 120} y={y} size={28} color={shown && s ? C.bg : C.amber}>
              {s ? '+' : '−'}
            </Cap>
          </g>
        );
      })}
      <Cap x={500} y={y + 70} size={20} color={C.muted}>
        Controles ambiguos leídos por la máquina
      </Cap>
    </g>
  );
}

/** two bars for P(D | honest) and P(D | altered) on a common scale */
function LikeBars({ seq }: { seq: number[] }) {
  const lh = likelihood(seq, PH),
    la = likelihood(seq, PA);
  const top = Math.max(lh, la);
  const bars: [string, number, string][] = [
    ['honesto (0,5)', lh, C.cyan],
    ['alterado (0,8)', la, C.magenta],
  ];
  return (
    <g>
      {bars.map(([label, v, col], i) => {
        const h = (v / top) * 230;
        const x = 330 + i * 260;
        return (
          <g key={label}>
            <rect x={x} y={630 - h} width={150} height={h} rx={8} fill={col} fillOpacity={0.75} />
            <Cap x={x + 75} y={630 - h - 26} size={20} color={col} tex={tnum(v, 4)} />
            <Cap x={x + 75} y={660} size={19} color={C.muted}>
              {label}
            </Cap>
          </g>
        );
      })}
    </g>
  );
}

function ReaderLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [n, setN] = useState(1);
  const { beat } = beats;
  const shown = beat === 0 ? 0 : beat === 1 ? n : 5;
  const seq = SEQ.slice(0, shown);
  const bf = likelihood(seq, PA) / likelihood(seq, PH);
  const drag = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - NSL.x0) / (NSL.x1 - NSL.x0), 0, 1) * 5);
    setN(next);
    if (next === 5) unlock();
  });
  return (
    <Stage ref={svg}>
      <Controls seq={seq} />
      {beat >= 1 && <LikeBars seq={seq} />}
      {beat === 0 && (
        <>
          <Cap x={1270} y={330} tex="\text{honesto}:\ P(+)=0{,}5" color={C.cyan} />
          <Cap x={1270} y={420} tex="\text{alterado}:\ P(+)=0{,}8" color={C.magenta} />
        </>
      )}
      {beat >= 1 && <Cap x={1270} y={330} tex={`BF=${tnum(bf, 2)}`} color={C.amber} />}
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={420} tex="\tfrac{0{,}08192}{0{,}03125}\approx2{,}62" color={C.green} />
      )}
      {beat >= 3 && (
        <Cap
          x={1270}
          y={420}
          tex="P(A\mid D)=\tfrac{2{,}62}{3{,}62}\approx0{,}72"
          color={C.green}
        />
      )}
      {beat === 1 && (
        <>
          <line x1={NSL.x0} x2={NSL.x1} y1={NSL.y} y2={NSL.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={NSL.x0 + (n / 5) * (NSL.x1 - NSL.x0)}
            y={NSL.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${n}`}
          />
          <Cap x={1255} y={NSL.y + 60} size={19} color={C.muted}>
            controles leídos
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Factor de Bayes',
  intro: {
    question: '¿Cómo se decide cuál de dos explicaciones apoya más la evidencia?',
    text: 'El factor de Bayes compara qué tan probables son los datos bajo dos modelos distintos. Multiplicado por las chances previas, da cuánto preferir uno sobre el otro. Los positivos de más pueden venir del lote o de la máquina que lo lee, y el lector guarda sus controles.',
  },
  Scene: ReaderLesson,
  beats: [
    {
      say: 'Hay dos explicaciones para el lector. Honesto: en un control ambiguo marca positivo la mitad de las veces. Alterado: lo marca el 80 %.',
      board: {
        label: 'Dos modelos',
        tex: '\\p{1}{M_0:\\ P(+)=0{,}5},\\quad\\p{2}{M_1:\\ P(+)=0{,}8}',
        parts: ['lector honesto', 'lector alterado'],
      },
    },
    {
      say: 'Cada control multiplica la probabilidad de los datos bajo cada modelo. Lee los cinco y mira cuál explica mejor lo que salió.',
      gate: 'Arrastra la perilla hasta leer los 5 controles.',
      board: {
        label: 'Probabilidad de los datos',
        tex: '\\p{1}{P(D\\mid M)}=\\p{2}{\\prod_i P(x_i\\mid M)}',
        parts: ['probabilidad de los datos', 'aporte de cada control'],
      },
    },
    {
      say: 'Con cuatro positivos en cinco: 0,5⁵ para el honesto y 0,8⁴·0,2 para el alterado.',
      ask: {
        prompt: '¿Cuánto vale el factor de Bayes del alterado contra el honesto?',
        options: ['≈ 2,62', '≈ 0,38', '0,8'],
        answer: 0,
        explain:
          '0,08192 / 0,03125 ≈ 2,62: los datos son 2,62 veces más probables si el lector está alterado. 0,38 es el cociente al revés.',
      },
      board: {
        label: 'Factor de Bayes',
        tex: '\\p{1}{BF}=\\p{2}{\\frac{P(D\\mid M_1)}{P(D\\mid M_0)}}\\p{3}{\\approx2{,}62}',
        parts: [
          'evidencia entre modelos',
          'alterado frente a honesto',
          'ventaja del modelo alterado',
        ],
      },
    },
    {
      say: 'Si antes de mirar ambas explicaciones valían lo mismo, el factor de Bayes son las chances después: 2,62 a 1.',
      board: {
        label: 'Chances de los modelos',
        tex: '\\p{1}{\\frac{P(M_1\\mid D)}{P(M_0\\mid D)}}=\\p{2}{\\frac{P(M_1)}{P(M_0)}\\cdot BF}',
        parts: ['chances tras los datos', 'chances por nueva evidencia'],
      },
    },
    {
      say: 'Cinco controles inclinan la balanza, pero poco. Para acusar a una máquina se necesitan más.',
      board: {
        label: 'Probabilidad del alterado',
        tex: '\\p{1}{P(M_1\\mid D)}=\\p{2}{\\tfrac{2{,}62}{1+2{,}62}}\\p{3}{\\approx0{,}72}',
        parts: [
          'probabilidad de alteración',
          'chances sobre el total',
          'probabilidad del alterado',
        ],
      },
    },
  ],
};

function MemoryDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      {Array.from({ length: 20 }, (_, i) => {
        const pos = i % 5 !== 2;
        return (
          <g key={i}>
            <circle
              cx={240 + (i % 10) * 70}
              cy={260 + Math.floor(i / 10) * 90}
              r={26}
              fill={pos ? C.amber : C.panel}
              stroke={C.amber}
              strokeWidth={3}
            />
            <Cap
              x={240 + (i % 10) * 70}
              y={260 + Math.floor(i / 10) * 90}
              size={22}
              color={pos ? C.bg : C.amber}
            >
              {pos ? '+' : '−'}
            </Cap>
          </g>
        );
      })}
      <Cap x={555} y={480} size={20} color={C.muted}>
        Memoria del lector: 16 positivos en 20 controles ambiguos.
      </Cap>
      {beat === 0 && answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex="BF=\frac{0{,}8^{16}\,0{,}2^4}{0{,}5^{20}}\approx47"
          color={C.green}
        />
      )}
      {beat === 1 && answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex="P(M_1\mid D)\approx\tfrac{47}{48}\approx0{,}98"
          color={C.green}
        />
      )}
    </Stage>
  );
}

function BayesFactorPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 151 + round);
    const n = pick(r, [3, 4, 5]);
    const k = randInt(r, 1, n);
    const la = PA ** k * (1 - PA) ** (n - k),
      lh = PH ** n;
    const bf = la / lh;
    return { n, k, la, lh, bf, post: bf / (1 + bf) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `El lector marcó ${d.k} positivos en ${d.n} controles ambiguos. Honesto: P(+) = 0,5. Alterado: P(+) = 0,8. `;
    api.prompt(
      base +
        [
          '¿Cuánto vale P(D | alterado)? Cuatro decimales.',
          '¿Cuánto vale el factor de Bayes del alterado contra el honesto? Dos decimales.',
          'Si antes ambos valían lo mismo, ¿qué probabilidad tiene el alterado? Dos decimales.',
        ][round],
      [
        '0{,}8^{k}\\,0{,}2^{\\,n-k}',
        'BF=\\frac{P(D\\mid M_1)}{P(D\\mid M_0)}',
        'P(M_1\\mid D)=\\frac{BF}{1+BF}',
      ][round],
    );
    api.hints(
      [
        ['Multiplica 0,8 por cada positivo.', 'Multiplica 0,2 por cada negativo.'],
        ['Honesto: 0,5 elevado al total de controles.', 'Divide alterado sobre honesto.'],
        ['Con chances 1 : 1, las chances después son el BF.', 'Pasa de chances a probabilidad.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const target = [d.la, d.bf, d.post][round];
    const tol = round === 0 ? 0.00011 : 0.011;
    if (Math.abs(v - target) < tol)
      return api.result(true, `$${tnum(target, round === 0 ? 4 : 2)}$.`);
    if (round === 1 && Math.abs(v - 1 / d.bf) < 0.011)
      return api.result(false, 'Lo calculaste al revés: va el alterado arriba.');
    if (round === 0 && Math.abs(v - PA ** d.k) < tol)
      return api.result(false, 'Faltan los negativos: cada uno multiplica por 0,2.');
    if (round === 2 && Math.abs(v - d.bf) < 0.011)
      return api.result(false, 'Esas son las chances. Pásalas a probabilidad: BF / (1 + BF).');
    return api.result(false, `P(D | A) = ${fmt(d.la, 4)} y P(D | H) = ${fmt(d.lh, 4)}.`);
  };
  return (
    <Stage>
      {Array.from({ length: d.n }, (_, i) => (
        <g key={i}>
          <circle
            cx={300 + i * 120}
            cy={330}
            r={40}
            fill={i < d.k ? C.amber : C.panel}
            stroke={C.amber}
            strokeWidth={3}
          />
          <Cap x={300 + i * 120} y={330} size={28} color={i < d.k ? C.bg : C.amber}>
            {i < d.k ? '+' : '−'}
          </Cap>
        </g>
      ))}
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P(D | A) =', 'BF =', 'P(A | D) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c7',
  world: 'bayesian',
  code: '10.7',
  title: 'El lector',
  subtitle: 'Factor de Bayes',
  glyph: 'BF',
  kind: 'level',
  guide: 'rocio',
  teaser: '¿El lote da más positivos, o la máquina que los lee? El lector guarda sus controles.',
  learn:
    'Comparar dos explicaciones con el factor de Bayes y convertirlo en probabilidad de cada modelo.',
  glyphs: ['by-bf'],
  pitfalls: [
    'El factor de Bayes compara modelos; no es la probabilidad de un modelo.',
    'Pocos datos dan factores cercanos a 1: inclinan la balanza, pero no deciden.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio, una de la tarde. El lector de tests estaba abierto sobre el mesón, y de su tapa colgaba una etiqueta de calibración.',
        },
        {
          who: 'rocio',
          text: 'Los controles ambiguos deberían salir mitad y mitad. Esta máquina los marca positivos casi siempre.',
        },
        {
          who: 'teo',
          text: 'Guarda en memoria cada control. Puedo comparar las dos explicaciones con los mismos datos.',
        },
        { who: 'iris', text: 'Compáralas. No quiero acusar a una máquina por un mal día.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Los controles del lector',
      Scene: MemoryDemo,
      beats: [
        {
          say: 'La memoria del lector tiene 20 controles ambiguos: 16 positivos y 4 negativos.',
          ask: {
            prompt: '¿Cuánto vale el factor de Bayes del alterado contra el honesto?',
            options: ['≈ 47', '≈ 2,6', '≈ 0,8'],
            answer: 0,
            explain: '0,8¹⁶·0,2⁴ / 0,5²⁰ ≈ 47. Con veinte controles la evidencia se acumula.',
          },
          note: { label: 'Veinte controles', tex: 'BF\\approx47' },
        },
        {
          say: 'Antes de mirar, ambas explicaciones valían lo mismo.',
          ask: {
            prompt: '¿Qué probabilidad tiene ahora el lector alterado?',
            options: ['≈ 0,98', '≈ 0,72', '≈ 0,80'],
            answer: 0,
            explain: 'Chances 47 : 1; probabilidad 47/48 ≈ 0,98.',
          },
          note: {
            label: 'El lector',
            tex: 'P(M_1\\mid D)\\approx0{,}98',
            body: 'La etiqueta de calibración es del Laboratorio de Halcón.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Comparar explicaciones', Comp: BayesFactorPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Teo despegó la etiqueta de calibración con la uña. Debajo había otra, más antigua.',
        },
        { who: 'teo', text: 'Recalibrado en julio. Laboratorio Halcón, sede Los Placeres.' },
        { who: 'rocio', text: 'En julio. El mes en que empezaron a sobrar positivos.' },
        {
          who: 'iris',
          text: 'Falta el número que lo junta todo: cuántos positivos debieron salir y cuántos salieron.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-bf',
    world: 'bayesian',
    tex: 'BF',
    name: 'Factor de Bayes',
    read: 'be efe',
    meaning: 'Cuántas veces más probables son los datos bajo un modelo que bajo otro.',
    warn: 'No es la probabilidad del modelo: hay que combinarlo con las chances previas.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Factor de Bayes', tex: 'BF=\\frac{P(D\\mid M_1)}{P(D\\mid M_0)}' },
    {
      label: 'Probabilidad de los datos',
      tex: 'P(D\\mid M)=\\prod_i P(x_i\\mid M)',
      body: 'Para observaciones independientes dado el modelo.',
    },
  ],
  props: [
    {
      label: 'Chances de modelos',
      tex: '\\frac{P(M_1\\mid D)}{P(M_0\\mid D)}=\\frac{P(M_1)}{P(M_0)}\\,BF',
    },
    { label: 'Con chances iguales', tex: 'P(M_1\\mid D)=\\frac{BF}{1+BF}' },
  ],
};

export { lesson };
