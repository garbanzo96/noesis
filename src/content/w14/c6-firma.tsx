import { useEffect, useMemo, useState } from 'react';
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
import { pick, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 14.6 · «La firma» — repaso de Bayes con chances (Mundo 10)
// Diez sospechosos: chances 1 : 9. Pruebas independientes con razones 18 (horario), 4 (firma)
// y 5 (ficha del casino): 1/9·18·4·5 = 40 : 1 → P = 40/41 ≈ 0,976.
// ============================================================================

const PRIOR = 1 / 9;
const EVIDENCE = [
  { name: 'Horario', lr: 18, note: 'conectado a las 03:12' },
  { name: 'Firma', lr: 4, note: 'trazo de la firma' },
  { name: 'Ficha', lr: 5, note: 'ficha del Casino Aurora' },
];
const BAR = { x0: 180, x1: 980, y: 560 }; // odds 1:100 … 100:1, log scale
const bx = (o: number) => BAR.x0 + ((Math.log10(o) + 2) / 4) * (BAR.x1 - BAR.x0);
const oddsTex = (o: number) =>
  o >= 1 ? `${tnum(o, o % 1 ? 1 : 0).replace('{,}0', '')}:1` : `1:${tnum(1 / o, 0)}`;

/** horizontal odds bar on a log scale, with the current odds */
function OddsBar({ odds, color = C.amber }: { odds: number; color?: string }) {
  const ticks: [number, string][] = [
    [0.01, '1:100'],
    [0.1, '1:10'],
    [1, '1:1'],
    [10, '10:1'],
    [100, '100:1'],
  ];
  return (
    <g>
      <rect
        x={BAR.x0}
        y={BAR.y - 10}
        width={bx(1) - BAR.x0}
        height={20}
        fill={C.cyan}
        opacity={0.18}
      />
      <rect
        x={bx(1)}
        y={BAR.y - 10}
        width={BAR.x1 - bx(1)}
        height={20}
        fill={C.magenta}
        opacity={0.18}
      />
      {ticks.map(([o, l]) => (
        <g key={l}>
          <line
            x1={bx(o)}
            x2={bx(o)}
            y1={BAR.y - 18}
            y2={BAR.y + 18}
            stroke={C.line}
            strokeWidth={2}
          />
          <Cap x={bx(o)} y={BAR.y + 42} size={17} color={C.muted}>
            {l}
          </Cap>
        </g>
      ))}
      <Cap x={BAR.x0 + 90} y={BAR.y - 44} size={18} color={C.cyan}>
        otro sospechoso
      </Cap>
      <Cap x={BAR.x1 - 90} y={BAR.y - 44} size={18} color={C.magenta}>
        el Contador
      </Cap>
      <g style={{ transition: 'transform 0.5s' }} transform={`translate(${bx(odds)},0)`}>
        <path d={`M0 ${BAR.y - 16} l-12 -22 h24 z`} fill={color} />
        <circle cx={0} cy={BAR.y} r={11} fill={color} />
      </g>
      <Cap x={(BAR.x0 + BAR.x1) / 2} y={BAR.y + 84} size={19} color={C.muted}>
        chances de que la cuenta sea del Contador
      </Cap>
    </g>
  );
}

/** evidence card; clickable when `onPick` is given */
function Card({ i, used, onPick }: { i: number; used: boolean; onPick?: () => void }) {
  const e = EVIDENCE[i];
  const x = 260 + i * 270;
  return (
    <g
      onClick={onPick}
      style={{ cursor: onPick && !used ? 'pointer' : 'default' }}
      opacity={used ? 0.45 : 1}
    >
      <rect
        x={x - 110}
        y={170}
        width={220}
        height={150}
        rx={12}
        fill={C.panel}
        stroke={used ? C.green : C.amber}
        strokeWidth={used ? 3 : 2}
      />
      <Cap x={x} y={208} size={22} color={C.text}>
        {e.name}
      </Cap>
      <Cap x={x} y={250} tex={`\\times${e.lr}`} color={used ? C.green : C.amber} />
      <Cap x={x} y={292} size={16} color={C.muted}>
        {e.note}
      </Cap>
    </g>
  );
}

function SignatureLesson({ beats, unlock, answer }: DemoProps) {
  const [used, setUsed] = useState<boolean[]>([false, false, false]);
  const { beat } = beats;
  const applied =
    beat < 1
      ? [false, false, false]
      : beat === 1
        ? [true, false, false]
        : beat === 2
          ? used
          : [true, true, true];
  const odds = EVIDENCE.reduce((o, e, i) => (applied[i] ? o * e.lr : o), PRIOR);
  const apply = (i: number) => {
    if (beat !== 2 || used[i]) return;
    const next = used.map((u, k) => u || k === i);
    setUsed(next);
    if (next.every(Boolean)) unlock();
  };
  return (
    <Stage>
      {EVIDENCE.map((_, i) => (
        <Card key={i} i={i} used={applied[i]} onPick={beat === 2 ? () => apply(i) : undefined} />
      ))}
      <OddsBar odds={odds} color={odds > 1 ? C.magenta : C.cyan} />
      <Cap size={26} x={1290} y={210} tex="O=\frac{P}{1-P}" color={C.text} />
      <Cap
        size={26}
        x={1290}
        y={300}
        tex={`O=${oddsTex(odds)}`}
        color={odds > 1 ? C.magenta : C.cyan}
      />
      {beat >= 3 && answer !== null && (
        <Cap size={26} x={1290} y={390} tex="P=\tfrac{40}{41}\approx0{,}976" color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={1290} y={480} size={20} color={C.cyan}>
          El orden no importa.
        </Cap>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: multiplicar chances',
  Scene: SignatureLesson,
  beats: [
    {
      say: 'Diez personas tenían acceso a la cuenta. Antes de mirar pruebas, el Contador es uno de diez: sus **chances** son 1 contra 9.',
      board: {
        label: 'Chances iniciales',
        tex: '\\p{1}{O_0}=\\p{2}{\\frac{P}{1-P}=\\frac{0{,}1}{0{,}9}=\\frac19}',
      },
    },
    {
      say: 'Cada prueba multiplica las chances por su razón de verosimilitud: cuántas veces más probable es verla si la cuenta es suya. El horario vale 18, y las chances pasan a 2 contra 1.',
      board: {
        label: 'Una prueba',
        tex: '\\p{1}{O_1}=\\p{2}{O_0\\cdot\\frac{P(E\\mid C)}{P(E\\mid\\neg C)}}=\\p{3}{\\tfrac19\\cdot18=2}',
      },
    },
    {
      say: 'Aplica las tres pruebas. Si son independientes, se multiplican una tras otra.',
      gate: 'Toca las tres tarjetas de prueba.',
      board: {
        label: 'Tres pruebas',
        tex: '\\p{1}{O}=\\p{2}{\\tfrac19\\cdot18\\cdot4\\cdot5}=\\p{3}{40}',
      },
    },
    {
      say: 'Las chances quedaron 40 contra 1. Falta volver a probabilidad.',
      ask: {
        prompt: '¿Qué probabilidad corresponde a chances de 40 : 1?',
        options: ['40/41 ≈ 0,976', '40/100 = 0,4', '1/40 = 0,025'],
        answer: 0,
        explain:
          'P = O/(1 + O) = 40/41: de cada 41 situaciones así, en 40 la cuenta es del Contador.',
      },
      board: {
        label: 'De vuelta a probabilidad',
        tex: '\\p{1}{P}=\\p{2}{\\frac{O}{1+O}=\\frac{40}{41}\\approx0{,}976}',
      },
    },
    {
      say: 'Multiplicar solo vale si cada prueba aporta algo nuevo. Si dos pruebas dependen de la misma fuente, contarlas dos veces infla la conclusión.',
      board: {
        label: 'Cuidado',
        tex: '\\p{1}{O=O_0\\prod_i \\mathrm{RV}_i}\\p{2}{\\ \\text{(pruebas independientes)}}',
      },
    },
  ],
};

function LedgerDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const odds = beat === 0 ? (1 / 99) * 360 : PRIOR * 18 * 4;
  return (
    <Stage>
      {EVIDENCE.map((_, i) => (
        <Card key={i} i={i} used={beat === 0 || i < 2} />
      ))}
      <OddsBar odds={answer !== null ? odds : beat === 0 ? 1 / 99 : PRIOR} />
      <Cap
        size={26}
        x={1290}
        y={220}
        tex={beat === 0 ? 'O_0=\\tfrac1{99}' : 'O_0=\\tfrac19'}
        color={C.text}
      />
      {answer !== null && (
        <Cap
          size={26}
          x={1290}
          y={310}
          tex={
            beat === 0
              ? '\\tfrac{360}{99}\\approx3{,}6\\Rightarrow P\\approx0{,}78'
              : '\\tfrac19\\cdot72=8\\Rightarrow P=\\tfrac89'
          }
          color={C.green}
        />
      )}
    </Stage>
  );
}

function OddsPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 223 + round);
    const n = pick(r, [4, 9, 19]);
    const a = pick(r, [2, 3, 4, 5, 6, 10]);
    const b = pick(r, [2, 3, 4, 5]);
    const k = pick(r, [3, 4, 9, 19, 40]);
    return { n, a, b, k, post: (a * b) / n, p: k / (k + 1), need: 9 * n };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Chances iniciales 1 : ${d.n}. Llegan dos pruebas independientes con razones ${d.a} y ${d.b}. ¿Cuánto valen las chances finales (el número O en O : 1)? Dos decimales si hace falta.`,
        `Las chances quedaron ${d.k} : 1. ¿Qué probabilidad es? Tres decimales.`,
        `Chances iniciales 1 : ${d.n}. ¿Qué razón de verosimilitud necesita una sola prueba para dejarlas en 9 : 1?`,
      ][round],
      [
        'O=O_0\\cdot\\mathrm{RV}_1\\cdot\\mathrm{RV}_2',
        'P=\\frac{O}{1+O}',
        '\\mathrm{RV}=\\frac{O}{O_0}',
      ][round],
    );
    api.hints(
      [
        [`Las chances iniciales son 1/${d.n}.`, 'Multiplica por las dos razones.'],
        ['Chances k : 1 significa k casos a favor por cada uno en contra.', 'Divide k por k + 1.'],
        [
          'La razón es el factor que lleva de las chances iniciales a las finales.',
          `Divide 9 por 1/${d.n}.`,
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.post) < 0.006)
        return api.result(true, `$\\tfrac1{${d.n}}\\cdot${d.a}\\cdot${d.b}=${tnum(d.post, 2)}$.`);
      if (Math.abs(v - d.a * d.b) < 0.006)
        return api.result(
          false,
          'Faltan las chances iniciales: multiplica también por 1/' + d.n + '.',
        );
      if (Math.abs(v - (d.a + d.b) / d.n) < 0.006)
        return api.result(false, 'Las razones se multiplican, no se suman.');
      return api.result(false, `O = (1/${d.n})·${d.a}·${d.b}.`);
    }
    if (round === 1) {
      if (Math.abs(v - d.p) < 0.0011)
        return api.result(true, `$\\frac{${d.k}}{${d.k + 1}}\\approx${tnum(d.p, 3)}$.`);
      if (Math.abs(v - 1 / d.k) < 0.0011 || Math.abs(v - 1 / (d.k + 1)) < 0.0011)
        return api.result(
          false,
          'Esa es la probabilidad del otro lado. Las chances favorecen al primero.',
        );
      return api.result(false, `P = ${d.k}/(${d.k} + 1).`);
    }
    if (Math.abs(v - d.need) < 0.01)
      return api.result(true, `$\\mathrm{RV}=9\\cdot${d.n}=${d.need}$.`);
    if (Math.abs(v - 9) < 0.01)
      return api.result(false, 'Eso serían las chances finales si se partiera de 1 : 1.');
    return api.result(false, `RV = 9 ÷ (1/${d.n}).`);
  };
  return (
    <Stage>
      <OddsBar odds={round === 1 ? d.k : 1 / d.n} />
      <Cap x={580} y={220} size={22} color={C.text}>
        {round === 1 ? `Chances ${d.k} : 1` : `Chances iniciales 1 : ${d.n}`}
      </Cap>
      {round === 0 && (
        <Cap x={580} y={290} tex={`\\times${d.a}\\quad\\times${d.b}`} color={C.amber} />
      )}
      <NumberField
        x={1240}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 0 ? 'O =' : round === 1 ? 'P =' : 'RV ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c6',
  world: 'active',
  code: '14.6',
  title: 'La firma',
  subtitle: 'Repaso: Bayes con chances',
  glyph: 'O·RV',
  kind: 'level',
  guide: 'iris',
  teaser:
    'Diez personas tenían acceso a la cuenta del piso 40. Tres pruebas independientes apuntan a una. ¿Cuánto pesan juntas?',
  learn: 'Multiplicar chances por razones de verosimilitud y volver a probabilidad.',
  glyphs: ['tor-odds'],
  pitfalls: [
    'Las razones de verosimilitud se multiplican, no se suman.',
    'Chances 40 : 1 equivalen a probabilidad 40/41, no a 40/100.',
    'Solo se multiplican pruebas independientes.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Piso 33, oficina de contabilidad. Diez escritorios, diez credenciales con acceso a la cuenta que apostaba con ventaja.',
        },
        {
          who: 'iris',
          text: 'Cualquiera de los diez pudo operar la cuenta. Necesito saber cuánto pesa lo que encontramos, no lo que sospecho.',
        },
        {
          who: 'teo',
          text: 'Tres cosas: el horario de conexión, una firma en la apertura y una ficha del casino en el cajón.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El libro de accesos',
      Scene: LedgerDemo,
      beats: [
        {
          say: 'El abogado de Halcón dice que no eran diez sino cien los que podían entrar a la cuenta. Partimos de 1 : 99 con las mismas tres pruebas.',
          ask: {
            prompt: '¿Cuánto quedan las chances?',
            options: ['≈ 3,6 : 1', '360 : 1', '40 : 1'],
            answer: 0,
            explain:
              '1/99 · 18 · 4 · 5 = 360/99 ≈ 3,6: probabilidad ≈ 0,78. Baja, pero el Contador sigue siendo el más probable.',
          },
          note: { label: 'Cien sospechosos', tex: '\\tfrac{360}{99}\\approx3{,}6' },
        },
        {
          say: 'El abogado insiste: la ficha del casino la pudo dejar cualquiera que visitara al Contador. Sacamos esa prueba y volvemos a diez sospechosos.',
          ask: {
            prompt: '¿Qué probabilidad queda sin la ficha?',
            options: ['8/9 ≈ 0,89', '8/100', '2/3'],
            answer: 0,
            explain: '1/9 · 18 · 4 = 8 : 1, P = 8/9. Sin la ficha, la conclusión sigue en pie.',
          },
          note: {
            label: 'Sin la ficha',
            tex: 'O=8,\\ P=\\tfrac89',
            body: 'Aun descartando la prueba discutida, la cuenta es del Contador con probabilidad 0,89.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Pesar pruebas', Comp: OddsPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Iris fotografía la firma y guarda la ficha en una bolsa de evidencia.',
        },
        { who: 'iris', text: 'Cuarenta contra uno. Con eso pido la orden.' },
        {
          who: 'teo',
          text: 'Arriba hay un guardia que decide cuándo hacer la ronda. Si sabemos cómo decide, sabemos cuándo subir.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-odds',
    world: 'active',
    tex: 'O=O_0\\prod_i\\mathrm{RV}_i',
    name: 'Chances por pruebas',
    read: 'o igual a o cero por el producto de las razones de verosimilitud',
    meaning:
      'Las chances finales son las iniciales multiplicadas por la razón de verosimilitud de cada prueba independiente.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Chances', tex: 'O=\\frac{P}{1-P}' },
    { label: 'Probabilidad', tex: 'P=\\frac{O}{1+O}' },
  ],
  props: [
    {
      label: 'Actualizar',
      tex: 'O=O_0\\prod_i\\mathrm{RV}_i',
      body: 'Solo con pruebas independientes.',
    },
    { label: 'Ejemplo', tex: '\\tfrac19\\cdot18\\cdot4\\cdot5=40' },
  ],
};

export { lesson };
