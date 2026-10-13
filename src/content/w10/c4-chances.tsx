import { useEffect, useMemo, useRef, useState } from 'react';
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
import { pick, rng } from '../shared/rng';
import { Confirm, DragCue, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 10.4 · «Chances» — odds y razón de verosimilitud
// 2 % = chances 1:49. LR+ = 0,9/0,05 = 18 → 18:49 → 18/67; otra vez → 324:49 → 324/373.
// LR− = 0,1/0,95 = 2/19 → 2:931 → 2/933 ≈ 0,002.
// ============================================================================

const BAR = { x: 170, y: 300, w: 780, h: 90 };
const CHIP = { x: 560, y: 600 };

/** horizontal bar split a : b (sick : healthy) */
function OddsBar({ a, b, y = BAR.y, label }: { a: number; b: number; y?: number; label: string }) {
  const wa = Math.max(3, (a / (a + b)) * BAR.w);
  return (
    <g>
      <rect x={BAR.x} y={y} width={wa} height={BAR.h} rx={8} fill={C.magenta} fillOpacity={0.9} />
      <rect
        x={BAR.x + wa}
        y={y}
        width={BAR.w - wa}
        height={BAR.h}
        rx={8}
        fill={C.cyan}
        fillOpacity={0.5}
      />
      <Cap x={BAR.x + BAR.w / 2} y={y - 30} size={24} tex={label} color={C.text} />
    </g>
  );
}

function OddsLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [applied, setApplied] = useState(0);
  const [chip, setChip] = useState<[number, number]>([CHIP.x, CHIP.y]);
  const { beat } = beats;
  const k = beat < 2 ? 0 : beat === 2 ? applied : 2;
  const a = beat === 4 ? 2 : 18 ** k,
    b = beat === 4 ? 931 : 49;
  const drag = useSvgDrag(svg, (px, py, phase) => {
    setChip([px, py]);
    if (phase === 'end') {
      setChip([CHIP.x, CHIP.y]);
      if (py > BAR.y - 40 && py < BAR.y + BAR.h + 40) {
        const next = Math.min(2, applied + 1);
        setApplied(next);
        if (next === 2) unlock();
      }
    }
  });
  const label = beat === 4 ? '2:931' : `${a}:${b}`;
  return (
    <Stage ref={svg}>
      <OddsBar a={a} b={b} label={`\\text{chances}=${label}`} />
      <Cap x={BAR.x + BAR.w / 2} y={BAR.y + BAR.h + 40} size={20} color={C.muted}>
        Magenta: enfermos. Celeste: sanos. El largo de cada parte es proporcional.
      </Cap>
      {beat === 2 && applied < 2 && (
        <g onPointerDown={drag} style={{ cursor: 'grab' }}>
          <rect
            x={chip[0] - 60}
            y={chip[1] - 34}
            width={120}
            height={68}
            rx={34}
            fill={C.panel}
            stroke={C.amber}
            strokeWidth={3}
          />
          <Cap x={chip[0]} y={chip[1]} size={26} color={C.amber}>
            ×18
          </Cap>
        </g>
      )}
      {beat === 2 && applied < 2 && (
        <DragCue x={chip[0]} y={chip[1]} axis="y" color={C.amber} r={36} />
      )}
      {beat === 2 && (
        <Cap x={CHIP.x} y={CHIP.y + 70} size={19} color={C.muted}>
          {`positivos aplicados: ${applied}`}
        </Cap>
      )}
      <Cap x={1270} y={220} tex="0{,}02\ \to\ 1:49" color={C.text} />
      {beat >= 1 && <Cap x={1270} y={310} tex="LR^+=\tfrac{0{,}9}{0{,}05}=18" color={C.amber} />}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={400} tex="\tfrac{324}{324+49}\approx0{,}87" color={C.green} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1270} y={400} tex="LR^-=\tfrac{0{,}1}{0{,}95}=\tfrac2{19}" color={C.cyan} />
          <Cap x={1270} y={490} tex="\tfrac{2}{933}\approx0{,}002" color={C.green} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Chances y razón de verosimilitud',
  Scene: OddsLesson,
  beats: [
    {
      say: 'Las **chances** comparan dos grupos en vez de dividir por el total: 2 % de enfermos es 1 enfermo por cada 49 sanos.',
      board: {
        label: 'Chances',
        tex: '\\p{1}{\\text{chances}}=\\p{2}{\\frac{p}{1-p}}=\\p{3}{\\tfrac{0{,}02}{0{,}98}=\\tfrac1{49}}',
      },
    },
    {
      say: 'Un positivo es 18 veces más probable en un enfermo que en un sano. Esa es la **razón de verosimilitud**.',
      board: {
        label: 'Razón de verosimilitud',
        tex: '\\p{1}{LR^+}=\\p{2}{\\frac{P(+\\mid E)}{P(+\\mid E^c)}}=\\p{3}{18}',
      },
    },
    {
      say: 'Con chances, actualizar es multiplicar. Aplica dos positivos sobre la barra.',
      gate: 'Arrastra la ficha ×18 sobre la barra, dos veces.',
      board: {
        label: 'Actualizar',
        tex: '\\p{1}{\\text{chances después}}=\\p{2}{\\text{chances antes}\\cdot LR}',
      },
    },
    {
      say: 'Después de dos positivos, las chances son 324 a 49.',
      ask: {
        prompt: '¿Qué probabilidad corresponde a chances 324 : 49?',
        options: ['≈ 0,87', '≈ 6,6', '≈ 0,13'],
        answer: 0,
        explain:
          'De 324 + 49 = 373 casos, 324 son enfermos: 324/373 ≈ 0,87. 6,6 son las chances, no una probabilidad.',
      },
      board: {
        label: 'De chances a probabilidad',
        tex: '\\p{1}{p}=\\p{2}{\\frac{\\text{chances}}{1+\\text{chances}}}',
      },
    },
    {
      say: 'Un negativo multiplica por 2/19: las chances caen a 2 contra 931. Por eso un negativo tranquiliza tanto.',
      board: {
        label: 'Un negativo',
        tex: '\\p{1}{\\tfrac1{49}\\cdot\\tfrac2{19}}=\\p{2}{\\tfrac2{931}}\\p{3}{\\Rightarrow p\\approx0{,}002}',
      },
    },
  ],
};

function NegativeDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <OddsBar a={1} b={49} label="\text{antes}=1:49" y={230} />
      {answer !== null && beat === 1 && (
        <OddsBar a={2} b={931} label="\text{después de un negativo}=2:931" y={470} />
      )}
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="LR^-=\tfrac{1-s}{e}=\tfrac2{19}\approx0{,}105" color={C.cyan} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="\tfrac{2}{933}\approx0{,}002" color={C.green} />
      )}
    </Stage>
  );
}

function OddsPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 137 + round);
    const p = pick(r, [0.2, 0.5, 0.75, 0.8]);
    const [s, e] = pick(r, [
      [0.9, 0.95],
      [0.8, 0.9],
      [0.95, 0.95],
      [0.8, 0.95],
    ] as [number, number][]);
    const k = pick(r, [9, 19, 49, 99]);
    const lr = pick(r, [9, 18, 19]);
    return { p, odds: p / (1 - p), s, e, lrPlus: s / (1 - e), k, lr, post: lr / (lr + k) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Una probabilidad vale ${fmt(d.p, 2)}. ¿Cuáles son sus chances? (Dos decimales.)`,
        `Un test tiene sensibilidad ${fmt(d.s * 100, 0)} % y especificidad ${fmt(d.e * 100, 0)} %. ¿Cuánto vale LR⁺? (Un decimal.)`,
        `Las chances antes del test son 1 : ${d.k} y el test positivo tiene LR⁺ = ${d.lr}. ¿Probabilidad después del positivo? (Dos decimales.)`,
      ][round],
      ['\\frac{p}{1-p}', 'LR^+=\\frac{s}{1-e}', 'p=\\frac{\\text{chances}}{1+\\text{chances}}'][
        round
      ],
    );
    api.hints(
      [
        [
          'Divide la probabilidad por la probabilidad de lo contrario.',
          'Para 0,5 da 1: uno a uno.',
        ],
        [
          'Positivo en enfermos sobre positivo en sanos.',
          'Positivo en sanos es 1 − especificidad.',
        ],
        ['Multiplica las chances por LR.', 'Convierte a probabilidad: chances / (1 + chances).'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const target = [d.odds, d.lrPlus, d.post][round];
    const tol = round === 1 ? 0.051 : 0.011;
    if (Math.abs(v - target) < tol)
      return api.result(true, `$${tnum(target, round === 1 ? 1 : 2)}$.`);
    if (round === 0 && Math.abs(v - d.p) < 0.011)
      return api.result(
        false,
        'Esa es la probabilidad. Las chances dividen por la probabilidad de lo contrario.',
      );
    if (round === 1 && Math.abs(v - d.s / d.e) < 0.051)
      return api.result(false, 'El denominador es positivo en sanos: 1 − especificidad.');
    if (round === 2 && Math.abs(v - d.lr / d.k) < 0.011)
      return api.result(
        false,
        'Esas son las chances después del test. Falta pasarlas a probabilidad.',
      );
    return api.result(
      false,
      [
        'Chances = p / (1 − p).',
        'LR⁺ = s / (1 − e).',
        `Chances después: ${d.lr}/${d.k}. Probabilidad: ${d.lr}/(${d.lr} + ${d.k}).`,
      ][round],
    );
  };
  return (
    <Stage>
      <OddsBar
        a={round === 2 ? d.lr : round === 0 ? d.p : d.s}
        b={round === 2 ? d.k : round === 0 ? 1 - d.p : 1 - d.e}
        label={
          round === 2
            ? `${d.lr}:${d.k}`
            : round === 0
              ? `${tnum(d.p)}:${tnum(1 - d.p)}`
              : '\\text{positivo: enfermo vs. sano}'
        }
      />
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['chances =', 'LR⁺ =', 'p ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c4',
  world: 'bayesian',
  code: '10.4',
  title: 'Chances',
  subtitle: 'Odds y razón de verosimilitud',
  glyph: 'LR',
  kind: 'level',
  guide: 'rocio',
  teaser:
    'Un negativo deja tranquilo a casi cualquiera. Iris quiere saber cuánto, en un solo número.',
  learn:
    'Pasar de probabilidad a chances, calcular la razón de verosimilitud y actualizar multiplicando.',
  glyphs: ['by-odds', 'by-lr'],
  pitfalls: [
    'Las chances no son una probabilidad: 324 : 49 es 0,87, no 6,6.',
    'LR⁺ divide por 1 − especificidad, no por la especificidad.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Pasillo de la Clínica, 09:00. Una enfermera empuja un carro de bandejas; las ruedas chirrían en cada junta del piso.',
        },
        {
          who: 'rocio',
          text: 'Los pacientes con negativo se van tranquilos. Con positivo se quedan, y piden dosis.',
        },
        {
          who: 'iris',
          text: 'Quiero un número que diga cuánto pesa cada resultado, sin rehacer las tablas.',
        },
        { who: 'teo', text: 'Chances. Se multiplican, no se recalculan.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El negativo que tranquiliza',
      Scene: NegativeDemo,
      beats: [
        {
          say: 'El test de la campaña: sensibilidad 90 %, especificidad 95 %.',
          ask: {
            prompt: '¿Cuánto vale la razón de verosimilitud de un negativo, LR⁻?',
            options: ['≈ 0,105', '≈ 18', '≈ 0,95'],
            answer: 0,
            explain: 'LR⁻ = P(− | E) / P(− | E^c) = 0,1 / 0,95 = 2/19 ≈ 0,105.',
          },
          note: { label: 'Razón de un negativo', tex: 'LR^-=\\tfrac{0{,}1}{0{,}95}=\\tfrac2{19}' },
        },
        {
          say: 'Antes del test, las chances son 1 : 49. Sale negativo.',
          ask: {
            prompt: '¿Qué probabilidad queda de estar enfermo?',
            options: ['≈ 0,002', '≈ 0,02', '≈ 0,10'],
            answer: 0,
            explain:
              '1/49 · 2/19 = 2/931; en probabilidad, 2/933 ≈ 0,002. Diez veces menos que antes del test.',
          },
          note: {
            label: 'Después de un negativo',
            tex: 'p=\\tfrac2{933}\\approx0{,}002',
            body: 'Un negativo baja las chances casi diez veces.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Multiplicar chances', Comp: OddsPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        { who: 'nar', text: 'Teo anota 18 y 2/19 en la pizarra. Rocío los mira un rato largo.' },
        {
          who: 'rocio',
          text: 'Con esos dos números habría repetido la mitad de los tests del mes.',
        },
        {
          who: 'iris',
          text: 'Ahora quiero el lote completo: cuántos positivos de verdad tiene cada partida de tests.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-odds',
    world: 'bayesian',
    tex: '\\frac{p}{1-p}',
    name: 'Chances',
    read: 'pe sobre uno menos pe',
    meaning: 'Cuántas veces es más probable un evento que su contrario.',
    warn: 'No confundir con la probabilidad.',
  },
  {
    id: 'by-lr',
    world: 'bayesian',
    tex: 'LR',
    name: 'Razón de verosimilitud',
    read: 'ele erre',
    meaning: 'Cuántas veces es más probable un resultado en un enfermo que en un sano.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Chances', tex: '\\text{chances}=\\frac{p}{1-p}' },
    { label: 'Razón de verosimilitud', tex: 'LR^+=\\frac{s}{1-e},\\quad LR^-=\\frac{1-s}{e}' },
  ],
  props: [
    {
      label: 'Bayes con chances',
      tex: '\\text{chances}_{\\text{después}}=\\text{chances}_{\\text{antes}}\\cdot LR',
    },
    { label: 'Volver a probabilidad', tex: 'p=\\frac{\\text{chances}}{1+\\text{chances}}' },
  ],
};

export { lesson };
