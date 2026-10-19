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
import { pick, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, stopSuccess, tnum } from './kit';

// ============================================================================
// CASO 13.6 · «Cuándo parar» — parada óptima
// n = 10 ofertas en orden al azar; regla: dejar pasar r − 1 y aceptar la primera mejor que todas
// las anteriores. Con n = 10 lo mejor es dejar pasar 3: P ≈ 0,399. Para n grande, dejar pasar n/e
// y P → 1/e ≈ 0,368. Doce meses seguidos con la mejor oferta: 0,399¹² ≈ 0,000016.
// ============================================================================

const N = 10;
const OFFERS = [62, 71, 48, 55, 93, 67, 80, 50, 79, 85];
const BARS = { x0: 200, y0: 600, w: 700, h: 360 };
const RS = { x0: 1110, x1: 1400, y: 660 };

/** the stream of offers; the first r − 1 are only observed, the accepted one is highlighted */
function Offers({ r, values = OFFERS }: { r: number; values?: number[] }) {
  const bar = values.slice(0, r - 1).reduce((a, b) => Math.max(a, b), -Infinity);
  const accepted = values.findIndex((v, i) => i >= r - 1 && v > bar);
  const best = values.indexOf(Math.max(...values));
  return (
    <g>
      {values.map((v, i) => {
        const x = 200 + i * 70,
          h = (v / 100) * 260,
          skipped = i < r - 1;
        const col =
          i === accepted ? (accepted === best ? C.green : C.magenta) : skipped ? C.muted : C.cyan;
        return (
          <g key={i} opacity={accepted >= 0 && i > accepted ? 0.3 : 1}>
            <rect
              x={x}
              y={560 - h}
              width={52}
              height={h}
              rx={5}
              fill={col}
              fillOpacity={skipped ? 0.35 : 0.8}
            />
            <Cap x={x + 26} y={560 - h - 22} size={17} color={C.text}>
              {v}
            </Cap>
            <Cap x={x + 26} y={588} size={16} color={C.muted}>
              {i + 1}
            </Cap>
          </g>
        );
      })}
      {r > 1 && (
        <line
          x1={200}
          x2={200 + values.length * 70}
          y1={560 - (bar / 100) * 260}
          y2={560 - (bar / 100) * 260}
          stroke={C.amber}
          strokeDasharray="8 6"
          strokeWidth={2}
        />
      )}
      <Cap x={550} y={630} size={19} color={C.muted}>
        {r > 1
          ? `Se observan las primeras ${r - 1}; después, la primera que supere la línea.`
          : 'Sin observar: se acepta la primera.'}
      </Cap>
    </g>
  );
}

/** success probability for each r with n = 10 */
function SuccessBars({ r }: { r: number }) {
  return (
    <g>
      <line
        x1={BARS.x0}
        x2={BARS.x0 + BARS.w}
        y1={BARS.y0}
        y2={BARS.y0}
        stroke={C.line}
        strokeWidth={2}
      />
      {Array.from({ length: N }, (_, i) => {
        const p = stopSuccess(N, i + 1),
          h = (p / 0.45) * BARS.h,
          x = BARS.x0 + (i * BARS.w) / N;
        return (
          <g key={i}>
            <rect
              x={x + 8}
              y={BARS.y0 - h}
              width={BARS.w / N - 16}
              height={h}
              rx={5}
              fill={i + 1 === r ? C.amber : C.violet}
              fillOpacity={i + 1 === r ? 0.9 : 0.5}
            />
            <Cap
              x={x + BARS.w / N / 2}
              y={BARS.y0 - h - 20}
              size={15}
              color={i + 1 === r ? C.amber : C.muted}
            >
              {fmt(p, 2)}
            </Cap>
            <Cap x={x + BARS.w / N / 2} y={BARS.y0 + 26} size={16} color={C.muted}>
              {i}
            </Cap>
          </g>
        );
      })}
      <Cap x={BARS.x0 + BARS.w / 2} y={BARS.y0 + 62} size={19} color={C.muted}>
        ofertas que se dejan pasar (r − 1)
      </Cap>
    </g>
  );
}

function StopLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [r, setR] = useState(2);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (x) => {
    const next = 1 + Math.round(clamp((x - RS.x0) / (RS.x1 - RS.x0), 0, 1) * (N - 1));
    setR(next);
    if (next === 4) unlock();
  });
  return (
    <Stage ref={svg}>
      {beat <= 1 && <Offers r={beat === 0 ? 1 : 4} />}
      {beat >= 2 && <SuccessBars r={beat === 2 ? r : 4} />}
      <Cap x={1270} y={200} tex="n=10" color={C.text} />
      {beat >= 2 && (
        <Cap
          x={1270}
          y={290}
          tex={`P=${tnum(stopSuccess(N, beat === 2 ? r : 4), 3)}`}
          color={C.amber}
        />
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={380} tex="\tfrac1e\approx0{,}368" color={C.green} />
      )}
      {beat === 2 && (
        <>
          <line x1={RS.x0} x2={RS.x1} y1={RS.y} y2={RS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={RS.x0 + ((r - 1) / (N - 1)) * (RS.x1 - RS.x0)}
            y={RS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${r - 1}`}
          />
          <Cap x={1255} y={RS.y + 60} size={19} color={C.muted}>
            ofertas que se dejan pasar
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Parada óptima',
  Scene: StopLesson,
  beats: [
    {
      say: 'Llegan diez ofertas, una por una y en orden al azar. Cada una se acepta o se rechaza en el momento, sin volver atrás. Quieres quedarte con la mejor.',
      board: { label: 'El problema', tex: '\\p{1}{n=10}\\ \\p{2}{\\text{sin volver atrás}}' },
    },
    {
      say: 'Una regla: deja pasar algunas solo para mirar y después acepta la primera que supere a todas las anteriores. Aquí funcionó con 3 de muestra.',
      board: {
        label: 'La regla',
        tex: '\\p{1}{\\text{observar }r-1}\\ \\p{2}{\\to\\ \\text{aceptar la primera mejor}}',
      },
    },
    {
      say: 'Si miras muy pocas, aceptas algo mediocre; si miras demasiadas, la mejor ya pasó. Busca el equilibrio.',
      gate: 'Arrastra la perilla hasta la barra más alta.',
      board: {
        label: 'Probabilidad de éxito',
        tex: '\\p{1}{P(r)}=\\p{2}{\\frac{r-1}{n}\\sum_{i=r}^{n}\\frac{1}{i-1}}',
      },
    },
    {
      say: 'Con 10 ofertas conviene mirar 3. Con muchas más, la fracción óptima se estabiliza.',
      ask: {
        prompt: 'Con muchísimas ofertas, ¿qué fracción conviene dejar pasar?',
        options: ['≈ 37 % (1/e)', '50 %', '10 %'],
        answer: 0,
        explain:
          'La fracción óptima tiende a 1/e ≈ 0,368, y la probabilidad de quedarse con la mejor también tiende a 1/e.',
      },
      board: {
        label: 'Regla del 37 %',
        tex: '\\p{1}{\\tfrac{r-1}{n}\\to\\tfrac1e}\\p{2}{\\approx0{,}368}',
      },
    },
    {
      say: 'Incluso con la mejor regla, se acierta menos de la mitad de las veces. Quien acierta siempre no está usando una regla: sabe qué viene.',
      board: { label: 'Límite honesto', tex: '\\p{1}{P_{\\max}}\\p{2}{\\approx0{,}4}' },
    },
  ],
};

function MonthsDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <SuccessBars r={4} />
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="P\approx0{,}40" color={C.amber} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="0{,}4^{12}\approx0{,}000016" color={C.magenta} />
      )}
    </Stage>
  );
}

function StopPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 197 + round);
    const n = pick(r, [5, 6, 8]);
    const rr = pick(r, [2, 3]);
    const big = pick(r, [20, 50, 100]);
    const values = shuffle(r, [12, 25, 31, 44, 58, 63, 77, 82, 90, 96]).slice(0, 8);
    const skip = pick(r, [2, 3]);
    const bar = Math.max(...values.slice(0, skip));
    const acc = values.find((v, i) => i >= skip && v > bar) ?? values[values.length - 1];
    return { n, rr, p: stopSuccess(n, rr), big, values, skip, acc };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Con ${d.n} ofertas, se dejan pasar ${d.rr - 1} y se acepta la primera mejor que todas las anteriores. ¿Probabilidad de quedarse con la mejor? Tres decimales.`,
        `Con ${d.big} ofertas, ¿cuántas conviene dejar pasar según la regla del 37 %? Redondea al entero.`,
        `Ofertas en orden: ${d.values.join(', ')}. Se dejan pasar las primeras ${d.skip}. ¿Cuál se acepta? (Si ninguna supera, se acepta la última.)`,
      ][round],
      [
        'P(r)=\\frac{r-1}{n}\\sum_{i=r}^{n}\\frac1{i-1}',
        'r-1\\approx\\frac ne',
        '\\text{primera}>\\max(\\text{observadas})',
      ][round],
    );
    api.hints(
      [
        [
          'Aquí r − 1 son las que pasan; la suma va de i = r a n.',
          'Multiplica la suma por (r − 1)/n.',
        ],
        ['Divide el total por e ≈ 2,718.', 'Redondea al entero más cercano.'],
        ['Anota el máximo de las observadas.', 'Busca la primera que lo supere.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.p) < 0.0011) return api.result(true, `$P\\approx${tnum(d.p, 3)}$.`);
      return api.result(
        false,
        `Con r = ${d.rr}: P = ${d.rr - 1}/${d.n} · (suma de 1/(i − 1) desde i = ${d.rr}).`,
      );
    }
    if (round === 1) {
      const t = Math.round(d.big / Math.E);
      if (v === t)
        return api.result(true, `$\\tfrac{${d.big}}{e}\\approx${fmt(d.big / Math.E, 1)}\\to${t}$.`);
      if (Math.abs(v - d.big / 2) < 1)
        return api.result(
          false,
          'Dejar pasar la mitad es demasiado: la mejor suele haber pasado ya.',
        );
      return api.result(false, `${d.big}/e ≈ ${fmt(d.big / Math.E, 1)}.`);
    }
    if (v === d.acc) return api.result(true, `Se acepta ${d.acc}.`);
    if (v === Math.max(...d.values))
      return api.result(
        false,
        'Esa es la mejor, pero la regla acepta la primera que supera a las observadas.',
      );
    return api.result(
      false,
      `El máximo de las observadas es ${Math.max(...d.values.slice(0, d.skip))}.`,
    );
  };
  return (
    <Stage>
      {round === 2 ? (
        <Offers r={d.skip + 1} values={d.values} />
      ) : (
        <Cap x={540} y={380} size={24} color={C.muted}>
          {round === 0 ? `n = ${d.n}` : `n = ${d.big}`}
        </Cap>
      )}
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P =', 'dejar pasar =', 'aceptada ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c6',
  world: 'decision',
  code: '13.6',
  title: 'Cuándo parar',
  subtitle: 'Parada óptima',
  glyph: '\\tfrac1e',
  kind: 'level',
  guide: 'valentina',
  teaser:
    'Cada mes la cuenta cerró su posición en el mejor momento. Valentina sabe cuánto falla la mejor regla honesta.',
  learn:
    'Decidir cuándo aceptar una oferta sin volver atrás con la regla de observar primero, y su probabilidad de éxito.',
  glyphs: ['dec-stop'],
  pitfalls: [
    'Observar demasiadas ofertas también falla: la mejor puede haber pasado.',
    'La regla acepta la primera que supera a las observadas, no necesariamente la mejor de todas.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Sala de operaciones, ocho y diez de la noche. Valentina desplegó doce meses de cierres en el muro de pantallas.',
        },
        {
          who: 'valentina',
          text: 'Cerrar una posición se parece a recibir ofertas: si esperas, puede mejorar, y si te pasas, se fue.',
        },
        { who: 'iris', text: '¿Y la cuenta?' },
        {
          who: 'valentina',
          text: 'Cerró en el mejor momento los doce meses. Yo llevo quince años en esto y nunca lo he logrado.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Doce cierres',
      Scene: MonthsDemo,
      beats: [
        {
          say: 'Cada mes hubo unas diez oportunidades de cierre, una tras otra.',
          ask: {
            prompt:
              'Con la mejor regla honesta, ¿qué probabilidad hay de cerrar en el mejor momento un mes?',
            options: ['≈ 0,40', '≈ 0,90', '0,10'],
            answer: 0,
            explain: 'Con 10 oportunidades y 3 de observación, P ≈ 0,399.',
          },
          note: { label: 'Un mes', tex: 'P\\approx0{,}40' },
        },
        {
          say: 'La cuenta lo logró doce meses seguidos.',
          ask: {
            prompt: '¿Qué probabilidad tiene eso con la mejor regla honesta?',
            options: ['≈ 0,000016', '≈ 0,40', '≈ 0,05'],
            answer: 0,
            explain:
              '0,4 elevado a 12 ≈ 0,000016: una en sesenta mil. No es habilidad; es saber qué viene.',
          },
          note: {
            label: 'Doce meses',
            tex: '0{,}4^{12}\\approx1{,}6\\cdot10^{-5}',
            body: 'Nadie acierta así con una regla. La cuenta conocía los cierres.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Decidir cuándo parar', Comp: StopPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        { who: 'nar', text: 'Teo marcó los doce cierres en verde, y ninguno fallaba.' },
        {
          who: 'teo',
          text: 'Aunque supiera lo que venía, igual tuvo que decidir cuánto apostar cada vez.',
        },
        {
          who: 'valentina',
          text: 'Y nunca apostó todo, lo que es raro en alguien que no puede perder.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-stop',
    world: 'decision',
    tex: '\\tfrac1e\\approx0{,}368',
    name: 'Regla del 37 %',
    read: 'uno sobre e',
    meaning:
      'Fracción de ofertas que conviene observar sin aceptar cuando son muchas; también la probabilidad de quedarse con la mejor.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Regla de umbral', tex: '\\text{observar }r-1,\\ \\text{aceptar la primera mejor}' },
    { label: 'Éxito', tex: 'P(r)=\\frac{r-1}{n}\\sum_{i=r}^{n}\\frac{1}{i-1}' },
  ],
  props: [
    { label: 'Óptimo con n = 10', tex: 'r-1=3,\\ P\\approx0{,}399' },
    { label: 'Límite', tex: '\\frac{r-1}{n}\\to\\frac1e,\\ P\\to\\frac1e' },
  ],
};

export { lesson };
