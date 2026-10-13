import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane, type Plane } from '../../engine/Stage';
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
import { betaMean, betaPdf, fmt, tnum } from './kit';

// ============================================================================
// CASO 10.5 · «El lote» — prior y posterior para una proporción
// θ = fracción de positivos de un lote. Beta(1,1) + 7 de 10 → Beta(8,4), media 2/3.
// Con lo sabido de otras clínicas, Beta(2,8) + 7 de 10 → Beta(9,11), media 0,45.
// ============================================================================

const P: Plane = plane([0, 1], [0, 7], { x: 190, y: 170, w: 720, h: 470 });
const KS = { x0: 1090, x1: 1420, y: 640 };

/** Beta(a, b) density as a path on the plane */
function BetaCurve({
  a,
  b,
  color,
  dashed,
  fill,
}: {
  a: number;
  b: number;
  color: string;
  dashed?: boolean;
  fill?: boolean;
}) {
  const pts = Array.from({ length: 121 }, (_, i) => {
    const x = 0.001 + (0.998 * i) / 120;
    return [P.x(x), P.y(Math.min(7, betaPdf(x, a, b)))] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <g>
      {fill && (
        <path
          d={`${d} L${P.x(1)} ${P.y(0)} L${P.x(0)} ${P.y(0)} Z`}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={dashed ? '10 8' : undefined}
      />
    </g>
  );
}

function Frame() {
  return (
    <g>
      <line x1={P.x(0)} x2={P.x(1)} y1={P.y(0)} y2={P.y(0)} stroke={C.line} strokeWidth={2} />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <Cap key={v} x={P.x(v)} y={P.y(0) + 30} size={18} color={C.muted}>
          {fmt(v, 2)}
        </Cap>
      ))}
      <Cap
        x={P.x(0.5)}
        y={P.y(0) + 70}
        size={20}
        color={C.muted}
        tex="\theta=\text{fracción de positivos del lote}"
      />
    </g>
  );
}

function MeanMark({ a, b, color }: { a: number; b: number; color: string }) {
  const m = betaMean(a, b);
  return (
    <g>
      <line
        x1={P.x(m)}
        x2={P.x(m)}
        y1={P.y(0)}
        y2={P.y(6.8)}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="5 6"
      />
      <Cap x={P.x(m)} y={P.y(6.8) - 18} size={19} color={color} tex={`\\bar\\theta=${tnum(m)}`} />
    </g>
  );
}

function LotLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(3);
  const { beat } = beats;
  const kk = beat === 0 ? -1 : beat === 1 ? k : 7;
  const drag = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - KS.x0) / (KS.x1 - KS.x0), 0, 1) * 10);
    setK(next);
    if (next === 7) unlock();
  });
  const informed = beat >= 3;
  return (
    <Stage ref={svg}>
      <Frame />
      {!informed && <BetaCurve a={1} b={1} color={C.muted} dashed />}
      {!informed && kk >= 0 && <BetaCurve a={1 + kk} b={11 - kk} color={C.amber} fill />}
      {beat === 2 && answer !== null && <MeanMark a={8} b={4} color={C.green} />}
      {informed && (
        <>
          <BetaCurve a={2} b={8} color={C.cyan} dashed />
          <BetaCurve a={9} b={11} color={C.amber} fill />
          <MeanMark a={9} b={11} color={C.green} />
        </>
      )}
      <Cap
        x={1270}
        y={200}
        tex={informed ? '\\text{antes}:\\ \\text{Beta}(2,8)' : '\\text{antes}:\\ \\text{Beta}(1,1)'}
        color={informed ? C.cyan : C.muted}
      />
      {kk >= 0 && (
        <Cap x={1270} y={290} tex={`${kk}\\ \\text{de}\\ 10\\ \\text{positivos}`} color={C.text} />
      )}
      {kk >= 0 && (
        <Cap
          x={1270}
          y={380}
          tex={
            informed
              ? '\\text{después}:\\ \\text{Beta}(9,11)'
              : `\\text{después}:\\ \\text{Beta}(${1 + kk},${11 - kk})`
          }
          color={C.amber}
        />
      )}
      {beat === 1 && (
        <>
          <line x1={KS.x0} x2={KS.x1} y1={KS.y} y2={KS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={KS.x0 + (k / 10) * (KS.x1 - KS.x0)}
            y={KS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${k}`}
          />
          <Cap x={1255} y={KS.y + 60} size={19} color={C.muted}>
            positivos en 10 tests
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Prior y posterior para una proporción',
  Scene: LotLesson,
  beats: [
    {
      say: 'Ahora lo desconocido es la fracción θ de positivos de un lote. Antes de ver datos, cualquier valor entre 0 y 1 parece igual de posible: una curva plana.',
      board: { label: 'Antes de los datos', tex: '\\p{1}{\\theta\\sim}\\p{2}{\\text{Beta}(1,1)}' },
    },
    {
      say: 'Cada positivo empuja la curva hacia la derecha y cada negativo hacia la izquierda. Marca 7 positivos de 10.',
      gate: 'Arrastra la perilla hasta 7 positivos.',
      board: {
        label: 'Actualizar con conteos',
        tex: '\\p{1}{\\text{Beta}(a,b)}\\p{2}{+\\,k\\text{ de }n}\\p{3}{\\Rightarrow\\text{Beta}(a+k,\\ b+n-k)}',
      },
    },
    {
      say: 'La curva después de los datos es Beta(8, 4). Su media resume dónde está θ.',
      ask: {
        prompt: '¿Cuánto vale la media de Beta(8, 4)?',
        options: ['2/3', '0,7', '0,5'],
        answer: 0,
        explain:
          'La media es a/(a+b) = 8/12 = 2/3. El 0,7 es la proporción observada; el prior plano la acerca un poco al centro.',
      },
      board: {
        label: 'Media',
        tex: '\\p{1}{E[\\theta]}=\\p{2}{\\frac{a}{a+b}}=\\p{3}{\\tfrac{8}{12}}',
      },
    },
    {
      say: 'Otras clínicas del cerro tienen cerca de 20 % de positivos: ese saber previo es Beta(2, 8). Con los mismos 7 de 10, la media queda en 0,45.',
      board: {
        label: 'Con saber previo',
        tex: '\\p{1}{\\text{Beta}(2,8)}\\p{2}{+\\,7\\text{ de }10}\\p{3}{\\Rightarrow\\text{Beta}(9,11)}',
      },
    },
    {
      say: 'Los parámetros del prior actúan como conteos ya vistos. Con muchos datos, pesan cada vez menos.',
      board: {
        label: 'Pseudoconteos',
        tex: '\\p{1}{a-1,\\ b-1}\\p{2}{\\ \\approx\\ \\text{positivos y negativos previos}}',
      },
    },
  ],
};

function AugustDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Frame />
      <BetaCurve a={2} b={8} color={C.cyan} dashed />
      {(beat > 0 || answer !== null) && <BetaCurve a={14} b={36} color={C.amber} fill />}
      {beat === 1 && answer !== null && <MeanMark a={14} b={36} color={C.green} />}
      <Cap x={1270} y={220} tex="\text{lote de agosto}:\ 12\ \text{de}\ 40" color={C.text} />
    </Stage>
  );
}

function LotPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 139 + round);
    const a = pick(r, [1, 2, 3]),
      b = pick(r, [1, 4, 8]),
      n = pick(r, [10, 20]),
      k = randInt(r, 1, n - 1);
    return { a, b, n, k, a2: a + k, b2: b + n - k, mean: (a + k) / (a + b + n) };
  }, [seed, round]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      `Prior Beta(${d.a}, ${d.b}). En un lote salen ${d.k} positivos de ${d.n}. ` +
        (round === 0
          ? 'Escribe los dos parámetros del posterior.'
          : '¿Cuánto vale la media del posterior? Dos decimales.'),
      round === 0 ? '\\text{Beta}(a+k,\\ b+n-k)' : 'E[\\theta]=\\frac{a+k}{a+b+n}',
    );
    api.hints(
      round === 0
        ? [
            'Los positivos se suman al primer parámetro.',
            'Los negativos, n − k, se suman al segundo.',
          ]
        : [
            'Primero arma el posterior Beta(a + k, b + n − k).',
            'La media es el primer parámetro sobre la suma de ambos.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(first);
    if (v === null) return;
    if (round === 0) {
      const w = parseNum(second);
      if (w === null) return;
      if (v === d.a2 && w === d.b2) return api.result(true, `$\\text{Beta}(${d.a2},${d.b2})$.`);
      if (v === d.a + d.k && w === d.b + d.n)
        return api.result(
          false,
          'Al segundo parámetro se suman los negativos, n − k, no todos los tests.',
        );
      if (v === d.a + d.n || w === d.b + d.n)
        return api.result(
          false,
          'Sumaste n a un parámetro. Los positivos van al primero y los negativos al segundo.',
        );
      return api.result(false, `Positivos: ${d.k}; negativos: ${d.n - d.k}.`);
    }
    if (Math.abs(v - d.mean) < 0.011)
      return api.result(true, `$\\tfrac{${d.a2}}{${d.a2 + d.b2}}\\approx${tnum(d.mean)}$.`);
    if (Math.abs(v - d.k / d.n) < 0.011)
      return api.result(
        false,
        'Esa es la proporción observada. El posterior también cuenta el prior.',
      );
    return api.result(false, `Posterior Beta(${d.a2}, ${d.b2}); media ${d.a2}/${d.a2 + d.b2}.`);
  };
  return (
    <Stage>
      <Frame />
      <BetaCurve a={d.a} b={d.b} color={C.cyan} dashed />
      {round > 0 && <BetaCurve a={d.a2} b={d.b2} color={C.amber} fill />}
      <NumberField
        x={1100}
        y={round === 0 ? 380 : 420}
        value={first}
        onChange={setFirst}
        onEnter={submit}
        label={round === 0 ? 'a′ =' : 'E[θ] ='}
      />
      {round === 0 && (
        <NumberField
          x={1100}
          y={480}
          value={second}
          onChange={setSecond}
          onEnter={submit}
          label="b′ ="
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c5',
  world: 'bayesian',
  code: '10.5',
  title: 'El lote',
  subtitle: 'Prior y posterior para una proporción',
  glyph: '\\text{Beta}(a,b)',
  kind: 'level',
  guide: 'rocio',
  teaser:
    'Cada partida de tests trae su propia tasa de positivos. Rocío quiere saber cuál, sin olvidar lo que ya se sabe.',
  learn:
    'Representar lo que se sabe de una proporción con una Beta y actualizarla sumando positivos y negativos.',
  glyphs: ['by-beta', 'by-posterior-mean'],
  pitfalls: [
    'Al segundo parámetro se suman los negativos, no el total de tests.',
    'La media posterior no es la proporción observada: el prior también cuenta.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Bodega del laboratorio, 10:30. Cajas de tests apiladas hasta el techo, cada una con su número de lote escrito a plumón.',
        },
        {
          who: 'rocio',
          text: 'No todos los lotes salen iguales. Algunos dan positivos de más desde la caja.',
        },
        {
          who: 'teo',
          text: 'Si cada lote tiene su tasa, podemos estimarla con los tests de control.',
        },
        {
          who: 'iris',
          text: 'Y sin olvidar lo que dicen las otras clínicas. Empecemos por el de agosto.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Los lotes de agosto',
      Scene: AugustDemo,
      beats: [
        {
          say: 'Antes de los controles, las otras clínicas sugieren Beta(2, 8). El lote de agosto dio 12 positivos en 40 controles.',
          ask: {
            prompt: '¿Cuál es el posterior del lote de agosto?',
            options: ['Beta(14, 36)', 'Beta(12, 28)', 'Beta(14, 48)'],
            answer: 0,
            explain: '2 + 12 = 14 y 8 + 28 = 36: los 28 negativos van al segundo parámetro.',
          },
          note: {
            label: 'Lote de agosto',
            tex: '\\text{Beta}(2,8)+12\\text{ de }40=\\text{Beta}(14,36)',
          },
        },
        {
          say: 'Resume ese posterior con su media.',
          ask: {
            prompt: '¿Cuánto vale la media del posterior?',
            options: ['0,28', '0,30', '0,20'],
            answer: 0,
            explain:
              '14/(14 + 36) = 14/50 = 0,28. El 0,30 es la proporción cruda de los controles.',
          },
          note: {
            label: 'Tasa estimada',
            tex: 'E[\\theta]=\\tfrac{14}{50}=0{,}28',
            body: 'Más alta que el 0,2 de las otras clínicas: el lote de agosto merece revisión.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Actualizar una Beta', Comp: LotPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        { who: 'nar', text: 'Rocío separa la caja de agosto y la marca con cinta roja.' },
        {
          who: 'rocio',
          text: 'Este lote vino directo del Laboratorio. No pasó por la bodega regional.',
        },
        {
          who: 'iris',
          text: 'Un número no alcanza. Quiero ver la curva entera y cuánto podemos asegurar.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-beta',
    world: 'bayesian',
    tex: '\\text{Beta}(a,b)',
    name: 'Distribución Beta',
    read: 'beta de a, be',
    meaning: 'Describe lo que se sabe de una proporción entre 0 y 1.',
  },
  {
    id: 'by-posterior-mean',
    world: 'bayesian',
    tex: 'E[\\theta]',
    name: 'Media posterior',
    read: 'esperanza de theta',
    meaning: 'Promedio de la proporción según el posterior: a/(a+b) para una Beta.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Prior Beta',
      tex: '\\theta\\sim\\text{Beta}(a,b)',
      body: 'Lo que se sabe de una proporción antes de los datos.',
    },
    { label: 'Posterior', tex: '\\theta\\mid k\\text{ de }n\\sim\\text{Beta}(a+k,\\,b+n-k)' },
  ],
  props: [
    { label: 'Media', tex: 'E[\\theta]=\\frac{a}{a+b}' },
    {
      label: 'Pseudoconteos',
      tex: 'a-1,\\ b-1',
      body: 'El prior actúa como positivos y negativos ya vistos.',
    },
  ],
};

export { lesson };
