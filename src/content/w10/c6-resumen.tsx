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
import { randInt, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 10.6 · «El resumen» — moda, media y conjunto creíble
// Grilla θ ∈ {0,1; 0,3; 0,5; 0,7; 0,9}, prior uniforme, 7 positivos de 10:
// posterior ≈ 0,0000; 0,0200; 0,2602; 0,5924; 0,1274. Moda 0,7; media ≈ 0,665;
// {0,5; 0,7} acumula ≈ 0,853.
// ============================================================================

const GRID = [0.1, 0.3, 0.5, 0.7, 0.9];
const BARS = { x0: 220, w: 110, gap: 40, base: 620, h: 420 };

function posterior(k: number, n: number) {
  const like = GRID.map((t) => t ** k * (1 - t) ** (n - k));
  const s = like.reduce((a, b) => a + b, 0);
  return like.map((l) => l / s);
}
const POST = posterior(7, 10);
const MEAN = GRID.reduce((a, t, i) => a + t * POST[i], 0);

function Bars({
  probs,
  color = C.amber,
  picked,
  onTap,
  hint,
  highlight,
}: {
  probs: number[];
  color?: string;
  picked?: Set<number>;
  onTap?: (i: number) => void;
  hint?: boolean;
  highlight?: number;
}) {
  return (
    <g>
      <line
        x1={BARS.x0 - 30}
        x2={BARS.x0 + 5 * (BARS.w + BARS.gap)}
        y1={BARS.base}
        y2={BARS.base}
        stroke={C.line}
        strokeWidth={2}
      />
      {probs.map((p, i) => {
        const x = BARS.x0 + i * (BARS.w + BARS.gap),
          h = (p * BARS.h) / 0.65,
          on = picked?.has(i) || highlight === i;
        return (
          <g
            key={i}
            onPointerDown={onTap ? () => onTap(i) : undefined}
            style={{ cursor: onTap ? 'pointer' : undefined }}
          >
            <rect
              x={x}
              y={BARS.base - Math.max(h, 2)}
              width={BARS.w}
              height={Math.max(h, 2)}
              rx={8}
              fill={on ? C.green : color}
              fillOpacity={on ? 0.9 : 0.7}
            />
            {onTap && (
              <rect
                x={x - 6}
                y={BARS.base - BARS.h - 10}
                width={BARS.w + 12}
                height={BARS.h + 16}
                rx={10}
                fill="transparent"
                stroke={hint && !on ? C.amber : 'none'}
                strokeDasharray="8 8"
                strokeWidth={2}
              />
            )}
            <Cap
              x={x + BARS.w / 2}
              y={BARS.base - Math.max(h, 2) - 26}
              size={20}
              color={on ? C.green : C.text}
            >
              {fmt(p, 2)}
            </Cap>
            <Cap x={x + BARS.w / 2} y={BARS.base + 32} size={21} color={C.muted}>
              {fmt(GRID[i], 1)}
            </Cap>
          </g>
        );
      })}
      <Cap
        x={BARS.x0 + 2.5 * (BARS.w + BARS.gap) - BARS.gap / 2}
        y={BARS.base + 72}
        size={20}
        color={C.muted}
        tex="\theta"
      />
    </g>
  );
}

function SummaryLesson({ beats, unlock, answer }: DemoProps) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const { beat } = beats;
  const probs = beat === 0 ? GRID.map(() => 0.2) : POST;
  const mass = [...picked].reduce((a, i) => a + POST[i], 0);
  const tap = (i: number) => {
    const next = new Set(picked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setPicked(next);
    const m = [...next].reduce((a, j) => a + POST[j], 0);
    if (m >= 0.8 && next.size === 2) unlock();
  };
  return (
    <Stage>
      <Bars
        probs={probs}
        color={beat === 0 ? C.cyan : C.amber}
        picked={beat === 3 ? picked : beat === 4 ? new Set([2, 3]) : undefined}
        onTap={beat === 3 ? tap : undefined}
        hint={beat === 3 && picked.size === 0}
        highlight={beat === 2 && answer !== null ? 3 : undefined}
      />
      <Cap
        x={1270}
        y={200}
        tex={
          beat === 0
            ? '\\text{antes: }0{,}2\\ \\text{cada uno}'
            : '7\\ \\text{de}\\ 10\\ \\text{positivos}'
        }
        color={C.text}
      />
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={290} tex="\text{moda}=0{,}7" color={C.green} />
      )}
      {beat === 3 && (
        <Cap
          x={1270}
          y={290}
          tex={`\\text{acumulado}=${tnum(mass, 3)}`}
          color={mass >= 0.8 ? C.green : C.amber}
        />
      )}
      {beat === 4 && (
        <>
          <Cap x={1270} y={290} tex="\{0{,}5;\ 0{,}7\}:\ 0{,}853" color={C.green} />
          <Cap x={1270} y={380} tex={`E[\\theta]\\approx${tnum(MEAN, 3)}`} color={C.amber} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Resumir un posterior',
  Scene: SummaryLesson,
  beats: [
    {
      say: 'Para ver el posterior completo, limita θ a cinco valores. Antes de los datos, cada uno tiene 0,2.',
      board: {
        label: 'Prior en una grilla',
        tex: '\\p{1}{\\theta\\in\\{0{,}1;0{,}3;0{,}5;0{,}7;0{,}9\\}},\\ \\p{2}{0{,}2\\ \\text{cada uno}}',
      },
    },
    {
      say: 'Con 7 positivos de 10, cada valor se multiplica por qué tan bien explica los datos, y todo se vuelve a sumar 1.',
      board: {
        label: 'Posterior',
        tex: '\\p{1}{P(\\theta\\mid\\text{datos})}\\p{2}{\\propto\\theta^7(1-\\theta)^3\\cdot P(\\theta)}',
      },
    },
    {
      say: 'El valor más probable del posterior es su **moda**.',
      ask: {
        prompt: '¿Cuál es la moda del posterior?',
        options: ['0,7', '0,5', '0,9'],
        answer: 0,
        explain:
          '0,7 tiene la barra más alta, 0,59. Coincide con la proporción observada, 7 de 10.',
      },
      board: { label: 'Moda', tex: '\\p{1}{\\hat\\theta}=\\p{2}{0{,}7}' },
    },
    {
      say: 'Un **conjunto creíble** junta los valores más probables hasta acumular, por ejemplo, el 80 %. Arma el más chico posible.',
      gate: 'Toca barras hasta acumular al menos 0,8 con solo dos valores.',
      board: {
        label: 'Conjunto creíble',
        tex: '\\p{1}{P(\\theta\\in\\{0{,}5;0{,}7\\})}\\p{2}{\\approx0{,}853\\ge0{,}8}',
      },
    },
    {
      say: 'La **media** pondera cada valor por su probabilidad: queda en 0,665, un poco más cerca del centro que la moda.',
      board: {
        label: 'Media',
        tex: '\\p{1}{E[\\theta]}=\\p{2}{\\sum\\theta\\,P(\\theta\\mid\\text{datos})}\\p{3}{\\approx0{,}665}',
      },
    },
  ],
};

function AugustSummary({ beats, answer }: DemoProps) {
  const { beat } = beats;
  // Beta(14, 36) drawn on a coarse grid of 9 values for reading.
  const g = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
  const raw = g.map((t) => t ** 13 * (1 - t) ** 35);
  const s = raw.reduce((a, b) => a + b, 0);
  return (
    <Stage>
      {g.map((t, i) => {
        const p = raw[i] / s,
          x = 200 + i * 80,
          h = p * 1400;
        const over = t > 0.2;
        return (
          <g key={t}>
            <rect
              x={x}
              y={620 - h}
              width={60}
              height={Math.max(h, 2)}
              rx={6}
              fill={beat === 1 && answer !== null && over ? C.green : C.amber}
              fillOpacity={0.8}
            />
            <Cap x={x + 30} y={652} size={18} color={C.muted}>
              {fmt(t, 2)}
            </Cap>
          </g>
        );
      })}
      <line
        x1={200 + 2 * 80 + 70}
        x2={200 + 2 * 80 + 70}
        y1={200}
        y2={620}
        stroke={C.cyan}
        strokeWidth={2}
        strokeDasharray="6 6"
      />
      <Cap x={200 + 2 * 80 + 70} y={180} size={19} color={C.cyan}>
        0,2: otras clínicas
      </Cap>
      <Cap x={1270} y={220} tex="\text{Beta}(14,36)" color={C.amber} />
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={310} tex="\text{moda}=\tfrac{13}{48}\approx0{,}27" color={C.green} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={310} tex="P(\theta>0{,}2)\approx0{,}90" color={C.green} />
      )}
    </Stage>
  );
}

function SummaryPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 149 + round);
    const k = randInt(r, 2, 8);
    const probs = posterior(k, 10);
    const mode = GRID[probs.indexOf(Math.max(...probs))];
    const mean = GRID.reduce((a, t, i) => a + t * probs[i], 0);
    const upper = probs[2] + probs[3] + probs[4];
    return { k, probs, mode, mean, upper };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      `Prior uniforme en la grilla y ${d.k} positivos de 10. ` +
        [
          '¿Cuál es la moda del posterior?',
          '¿Cuánto vale la media del posterior? Dos decimales.',
          '¿Qué probabilidad tiene θ ≥ 0,5? Dos decimales.',
        ][round],
      ['\\hat\\theta', 'E[\\theta]=\\sum\\theta P(\\theta)', 'P(\\theta\\ge0{,}5)'][round],
    );
    api.hints(
      [
        ['Busca la barra más alta.', 'La moda es un valor de θ, no una probabilidad.'],
        ['Multiplica cada θ por su barra.', 'Suma los cinco productos.'],
        ['Suma las barras de 0,5; 0,7 y 0,9.', 'Usa los valores escritos sobre las barras.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const target = [d.mode, d.mean, d.upper][round];
    if (Math.abs(v - target) < (round === 0 ? 0.001 : 0.021))
      return api.result(true, `$${tnum(target, round === 0 ? 1 : 2)}$.`);
    if (round === 0 && Math.abs(v - Math.max(...d.probs)) < 0.011)
      return api.result(
        false,
        'Esa es la altura de la barra. La moda es el valor de θ donde está.',
      );
    if (round === 1 && Math.abs(v - d.mode) < 0.001)
      return api.result(false, 'Esa es la moda. La media pondera todos los valores.');
    return api.result(
      false,
      [
        'La moda está bajo la barra más alta.',
        'Suma θ·P(θ) para los cinco valores.',
        'Suma las tres barras de la derecha.',
      ][round],
    );
  };
  return (
    <Stage>
      <Bars probs={d.probs} />
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['moda =', 'E[θ] =', 'P ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c6',
  world: 'bayesian',
  code: '10.6',
  title: 'El resumen',
  subtitle: 'Moda, media y conjunto creíble',
  glyph: '\\hat\\theta',
  kind: 'level',
  guide: 'rocio',
  teaser: 'Un posterior es una curva entera. La fiscalía va a pedir una frase.',
  learn:
    'Resumir un posterior con su moda, su media y un conjunto creíble que acumule una probabilidad dada.',
  glyphs: ['by-mode', 'by-credible'],
  pitfalls: [
    'La moda es un valor de θ, no la altura de la barra.',
    'Un conjunto creíble del 80 % toma primero los valores más probables.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Sala de reuniones de la Clínica, 11:30. El proyector calienta la sala; la curva del lote de agosto ocupa toda la pared.',
        },
        {
          who: 'iris',
          text: 'La fiscalía no va a leer una curva. Necesito una frase que se pueda defender.',
        },
        {
          who: 'rocio',
          text: 'Una frase con su margen. Sin margen, cualquier número suena a acusación.',
        },
        { who: 'teo', text: 'Moda, media y un intervalo. Las tres cosas salen de la misma curva.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El resumen del lote',
      Scene: AugustSummary,
      beats: [
        {
          say: 'El posterior del lote de agosto es Beta(14, 36).',
          ask: {
            prompt: '¿Cuál es su moda?',
            options: ['≈ 0,27', '0,28', '0,30'],
            answer: 0,
            explain: 'La moda de una Beta es (a − 1)/(a + b − 2) = 13/48 ≈ 0,27. La media es 0,28.',
          },
          note: { label: 'Moda del lote', tex: '\\tfrac{13}{48}\\approx0{,}27' },
        },
        {
          say: 'Las otras clínicas rondan 0,2. ¿Cuánta probabilidad deja el posterior por encima de esa cifra?',
          ask: {
            prompt: '¿P(θ > 0,2) para el lote de agosto?',
            options: ['≈ 0,90', '≈ 0,28', '≈ 0,50'],
            answer: 0,
            explain: 'Casi toda la curva está a la derecha de 0,2: P(θ ≤ 0,2) ≈ 0,10.',
          },
          note: {
            label: 'Frase para la fiscalía',
            tex: 'P(\\theta>0{,}2)\\approx0{,}90',
            body: 'Con 90 % de probabilidad, el lote de agosto da más positivos que las otras clínicas.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Resumir posteriores', Comp: SummaryPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        { who: 'nar', text: 'Rocío copia la frase en el informe con letra pequeña y firme.' },
        {
          who: 'rocio',
          text: 'El lote da más positivos. Falta saber si es el lote o la máquina que los lee.',
        },
        { who: 'teo', text: 'El lector guarda sus controles. Puedo comparar dos explicaciones.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-mode',
    world: 'bayesian',
    tex: '\\hat\\theta',
    name: 'Moda del posterior',
    read: 'theta gorro',
    meaning: 'Valor más probable según el posterior.',
  },
  {
    id: 'by-credible',
    world: 'bayesian',
    tex: 'P(\\theta\\in I)\\ge0{,}8',
    name: 'Conjunto creíble',
    read: 'pe de theta en I',
    meaning: 'Conjunto de valores que acumula una probabilidad dada según el posterior.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Moda', tex: '\\hat\\theta=\\arg\\max_\\theta P(\\theta\\mid\\text{datos})' },
    { label: 'Conjunto creíble', tex: 'P(\\theta\\in I\\mid\\text{datos})\\ge1-\\alpha' },
  ],
  props: [
    {
      label: 'Media posterior',
      tex: 'E[\\theta]=\\sum_\\theta\\theta\\,P(\\theta\\mid\\text{datos})',
    },
    { label: 'Beta', tex: '\\text{moda}=\\frac{a-1}{a+b-2},\\quad\\text{media}=\\frac{a}{a+b}' },
  ],
};

export { lesson };
