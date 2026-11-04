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
  intro: {
    question: '¿Cuándo conviene dejar de esperar una oferta mejor?',
    text: 'En un problema de parada óptima las ofertas llegan una por una y no se puede volver atrás. La mejor regla honesta observa primero cerca de un 37 % de las ofertas y después toma la primera que supere a todas. Aun así falla seguido, y la cuenta de la Bolsa acertó los doce meses.',
  },
  Scene: StopLesson,
  beats: [
    {
      say: 'La **parada óptima** estudia cuándo aceptar una opción entre varias que llegan en secuencia. Aquí llegan diez ofertas en orden al azar, se comparan por su valor y se busca elegir la mejor. Cada decisión es inmediata: una oferta rechazada no se puede recuperar.',
      board: {
        label: 'El problema',
        tex: '\\p{1}{n=10}\\ \\p{2}{\\text{sin volver atrás}}',
        parts: ['total de ofertas', 'decisión sin retorno'],
      },
    },
    {
      say: 'Una **regla de umbral** deja pasar $r-1$ ofertas para usar su máximo como referencia. Se lee «er menos uno»; luego se acepta la primera oferta que supera ese máximo. Aquí se observan tres: el máximo es 71 y la oferta 93 lo supera. En esta secuencia, además, 93 es la mejor de las diez.',
      board: {
        label: 'La regla',
        tex: '\\p{1}{\\text{observar }r-1}\\ \\p{2}{\\to\\ \\text{aceptar la primera mejor}}',
        parts: ['muestra para comparar', 'cuándo aceptar oferta'],
      },
    },
    {
      say: 'La **probabilidad de éxito** $P(r)$ se lee «pe de er» y mide la posibilidad de elegir la mejor oferta con esta regla, entre todos los órdenes posibles. En la fórmula, $n$ es el total, $r-1$ es la cantidad observada y la suma recorre las posiciones desde $r$ hasta $n$. La expresión mostrada vale para $r \\ge 2$; si $r=1$, se acepta la primera y la probabilidad es $1/n$.\n\nObservar poco puede llevar a aceptar pronto; observar demasiado puede dejar pasar la mejor.',
      gate: 'Mueve la perilla para buscar cuántas ofertas conviene dejar pasar. Compara las alturas de las barras y mira la probabilidad seleccionada.',
      after:
        'La barra más alta está en $r=4$: dejar pasar 3 de 10 da una probabilidad aproximada de 0,399. Con menos o más observaciones, la probabilidad baja.',
      board: {
        label: 'Probabilidad de éxito',
        tex: '\\p{1}{P(r)}=\\p{2}{\\frac{r-1}{n}\\sum_{i=r}^{n}\\frac{1}{i-1}}',
        parts: ['probabilidad de acertar', 'éxito según la muestra'],
      },
    },
    {
      say: 'Con diez ofertas, dejar pasar tres maximiza la probabilidad de elegir la mejor. La fracción observada es $(r-1)/n$, que se lee «er menos uno, dividido por ene». Cuando aumenta el número de ofertas, esa fracción óptima se acerca a un límite; el símbolo $e$ representa una constante matemática cercana a 2,718.',
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
        parts: ['fracción óptima de muestra', 'proporción que dejamos pasar'],
      },
    },
    {
      say: 'La **probabilidad máxima de éxito** $P_{\\max}$ se lee «pe máximo». Con diez ofertas es aproximadamente 0,4: incluso con la mejor regla de umbral se falla más de la mitad de las veces. Una serie de aciertos merece investigarse, pero por sí sola no demuestra que alguien conozca el futuro.',
      board: {
        label: 'Límite honesto',
        tex: '\\p{1}{P_{\\max}}\\p{2}{\\approx0{,}4}',
        parts: ['mejor probabilidad de éxito', 'éxito con diez ofertas'],
      },
    },
  ],
};

function MonthsDemo({ beats, unlock }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { beat } = beats;
  const [observed, setObserved] = useState(0);
  const [exponent, setExponent] = useState(-3);
  const drag = useSvgDrag(svg, (x) => {
    if (beat === 0) {
      const next = Math.round(clamp((x - 235) / 70, 0, 9));
      setObserved(next);
      if (next === 3) unlock();
    } else if (beat === 1) {
      const next = -3 - clamp((x - 200) / 700, 0, 1) * 3;
      setExponent(next);
      if (Math.abs(next - Math.log10(0.4 ** 12)) <= 0.15) unlock();
    }
  });
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <>
          {Array.from({ length: N }, (_, i) => {
            const h = (stopSuccess(N, i + 1) / 0.45) * 360;
            const x = 200 + i * 70;
            return (
              <g key={i}>
                <rect x={x + 8} y={600 - h} width={54} height={h} rx={5}
                  fill={i === observed ? C.amber : C.violet} fillOpacity={0.8} />
                <Cap x={x + 35} y={630} size={24} color={C.text}>{i}</Cap>
              </g>
            );
          })}
          <Knob x={235 + observed * 70} y={660} onPointerDown={drag} axis="x" color={C.amber} label={`${observed}`} />
          <Cap x={550} y={720} size={24} color={C.text}>Ofertas que se dejan pasar</Cap>
        </>
      ) : (
        <>
          <Cap x={550} y={250} size={28} color={C.text}>Probabilidad de doce aciertos independientes</Cap>
          <Cap x={550} y={330} tex="0{,}4^{12}" color={C.amber} />
          <line x1={200} x2={900} y1={500} y2={500} stroke={C.line} strokeWidth={4} />
          {[-3, -4, -5, -6].map((power, i) => (
            <g key={power}>
              <line x1={200 + i * 700 / 3} x2={200 + i * 700 / 3} y1={485} y2={515} stroke={C.text} strokeWidth={2} />
              <Cap x={200 + i * 700 / 3} y={550} size={24} tex={`10^{${power}}`} />
            </g>
          ))}
          {beat === 1 && <Knob x={200 + (-3 - exponent) * 700 / 3} y={500} onPointerDown={drag} axis="x" color={C.amber} />}
          {beat === 2 && <Cap x={550} y={640} tex="0{,}4^{12}\approx0{,}000016" color={C.magenta} />}
        </>
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
          say: 'Cada mes hubo unas diez oportunidades de cierre, una tras otra. Con la mejor regla honesta, ¿qué probabilidad hay de cerrar en el mejor momento un mes?',
          gate: 'Compara las barras y mueve el marcador a la cantidad de oportunidades que conviene dejar pasar.',
          after: 'Al dejar pasar 3 de 10 oportunidades, la probabilidad de elegir el mejor cierre es aproximadamente 0,399, o 0,40.',
          note: { label: 'Un mes', tex: 'P\\approx0{,}40' },
        },
        {
          say: 'La cuenta acertó el mejor cierre doce meses seguidos. Si los resultados de cada mes son independientes, podemos multiplicar sus probabilidades. ¿Qué probabilidad tiene esa racha con la mejor regla honesta?',
          gate: 'Calcula $0{,}4^{12}$ y ubica el resultado en la escala. Cada marca representa una potencia de 10.',
          after: 'La probabilidad es $0{,}4^{12}\\approx0{,}000016$, cerca de 1,6 por cada 100 000.',
          note: {
            label: 'Doce meses',
            tex: '0{,}4^{12}\\approx1{,}6\\cdot10^{-5}',
            body: 'Nadie acierta así con una regla. La cuenta conocía los cierres.',
          },
        },
        {
          say: 'Con independencia entre meses, la racha observada es muy poco probable bajo la mejor regla honesta. La cuenta cerró en el mejor momento durante los doce meses.',
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
