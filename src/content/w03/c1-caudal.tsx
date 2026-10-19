import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, hhmm, parseNum } from '../shared/ui';
import { AreaUnder, Tank, integrate } from './kit';

// ============================================================================
// CASO 3.1 · «El caudal» — acumulación
// Un ritmo (caudal) se acumula en una cantidad (volumen). Caudal constante: volumen = caudal ×
// tiempo = área de un rectángulo. Por tramos: suma de rectángulos. Caudal variable: el volumen
// sigue siendo el área bajo la curva. Unidades del área.
// ============================================================================

/** Piecewise-constant function from [start, end, value] segments. */
const steps = (segs: [number, number, number][]) => (t: number) => {
  for (const [a, b, v] of segs) if (t >= a && t < b) return v;
  return 0;
};
const areaSteps = (segs: [number, number, number][], upTo: number) =>
  segs.reduce((acc, [a, b, v]) => acc + v * Math.max(0, Math.min(b, upTo) - a), 0);

// ---------------------------------------------------------------- lesson
const PL = plane([0, 10], [0, 6], { x: 300, y: 130, w: 760, h: 480 });

function AccumLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const onT = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PL.inv(x, 0)[0], 0, 10) * 4) / 4;
    setT(v);
    if (v >= 10) unlock();
  });
  const SEG: [number, number, number][] = [
    [0, 3, 2],
    [3, 5, 5],
    [5, 9, 1],
  ];
  const wave = (s: number) => 2.5 + 1.6 * Math.sin(s * 0.8) + 0.15 * s;

  if (beat === 0) {
    const tt = 5 * at(0);
    return (
      <Stage>
        <path d="M520 160 L520 230 L600 230" fill="none" stroke="#5fd3ff" strokeWidth={14} />
        <rect x={596} y={234} width={10} height={230} fill="#5fd3ff" opacity={0.5} />
        <Tank
          x={520}
          y={340}
          w={180}
          h={340}
          level={2 * tt}
          max={12}
          label={`${dec(2 * tt, 1)} m³`}
        />
        <Cap x={900} y={300} size={30} color={C.cyan} tex="Q=2\ \tfrac{\text{m}^3}{\text{s}}" />
        <Cap x={900} y={380} size={28} color={C.text} tex={`t=${dec(tt, 1)}\\ \\text{s}`} />
        <Cap
          x={900}
          y={460}
          size={30}
          color={C.amber}
          tex={`V=2\\cdot${dec(tt, 1)}=${dec(2 * tt, 1)}\\ \\text{m}^3`}
        />
      </Stage>
    );
  }
  if (beat === 1 || beat === 2) {
    const f = beat === 1 ? () => 2 : steps(SEG);
    const end = beat === 1 ? t : 9;
    const vol = beat === 1 ? 2 * t : areaSteps(SEG, 9 * at(2));
    return (
      <Stage ref={svg}>
        <Axes
          P={PL}
          xTicks={[0, 2, 4, 6, 8, 10]}
          yTicks={[1, 2, 3, 4, 5]}
          xLabel="t\ (\text{s})"
          yLabel="Q\ (\text{m}^3/\text{s})"
          grid
        />
        {beat === 1 && (
          <AreaUnder P={PL} f={f} a={0} b={Math.max(0.001, end)} pos={C.amber} opacity={0.4} />
        )}
        {beat === 2 &&
          SEG.map(([a, b, v], i) => (
            <g key={i} opacity={clamp(at(2) * 3.3 - i, 0, 1)}>
              <rect
                x={PL.x(a)}
                y={PL.y(v)}
                width={PL.x(b) - PL.x(a)}
                height={PL.y(0) - PL.y(v)}
                fill={[C.amber, C.magenta, C.green][i]}
                opacity={0.4}
                stroke={[C.amber, C.magenta, C.green][i]}
              />
              <Cap
                x={(PL.x(a) + PL.x(b)) / 2}
                y={(PL.y(v) + PL.y(0)) / 2}
                size={20}
                color={C.text}
                tex={`${v}\\cdot${b - a}=${v * (b - a)}`}
              />
            </g>
          ))}
        <Curve P={PL} f={f} a={0} b={10} color={C.cyan} width={4} />
        <Tank
          x={1150}
          y={180}
          w={160}
          h={420}
          level={vol}
          max={beat === 1 ? 20 : 20}
          label={`${dec(vol, 1)} m³`}
        />
        {beat === 1 && (
          <>
            <rect
              x={PL.x(0) - 10}
              y={PL.y(0)}
              width={PL.box.w + 20}
              height={60}
              fill="transparent"
              onPointerDown={onT}
            />
            <Knob
              x={PL.x(t)}
              y={PL.y(0) + 30}
              onPointerDown={onT}
              cursor="ew-resize"
              label={dec(t, 1)}
            />
          </>
        )}
      </Stage>
    );
  }
  if (beat === 3) {
    const rows = [
      ['\\tfrac{\\text{m}^3}{\\text{s}}\\times\\text{s}', '\\text{m}^3', 'caudal → volumen'],
      ['\\tfrac{\\text{km}}{\\text{h}}\\times\\text{h}', '\\text{km}', 'velocidad → distancia'],
      ['\\text{MW}\\times\\text{h}', '\\text{MWh}', 'potencia → energía'],
    ];
    return (
      <Stage>
        {rows.map(([a, b, c], i) => (
          <g key={i} opacity={clamp(at(3) * 3.4 - i, 0, 1)}>
            <Cap x={560} y={240 + i * 150} size={34} color={C.cyan} tex={a} anchor="right" />
            <Cap x={640} y={240 + i * 150} size={34} color={C.amber} tex={`=${b}`} anchor="left" />
            <Cap x={900} y={240 + i * 150} size={22} color={C.muted} anchor="left">
              {c}
            </Cap>
          </g>
        ))}
      </Stage>
    );
  }
  // beats 4-5: varying flow; counting squares
  const total = integrate(wave, 0, 10);
  const k = beat === 4 ? at(4) : 1;
  return (
    <Stage>
      <Axes
        P={PL}
        xTicks={[0, 2, 4, 6, 8, 10]}
        yTicks={[1, 2, 3, 4, 5]}
        xLabel="t\ (\text{s})"
        yLabel="Q"
        grid
      />
      <AreaUnder P={PL} f={wave} a={0} b={Math.max(0.01, 10 * k)} pos={C.violet} opacity={0.45} />
      <Curve P={PL} f={wave} a={0} b={10} color={C.cyan} width={4} />
      {beat === 5 &&
        Array.from({ length: 10 }, (_, i) =>
          Array.from({ length: 6 }, (_, j) => {
            const inside = j + 1 <= wave(i + 0.5);
            return inside ? (
              <rect
                key={`${i}${j}`}
                x={PL.x(i) + 3}
                y={PL.y(j + 1) + 3}
                width={PL.sx - 6}
                height={PL.sy - 6}
                fill="none"
                stroke={C.green}
                strokeWidth={2}
                opacity={at(5)}
              />
            ) : null;
          }),
        )}
      <Tank
        x={1150}
        y={180}
        w={160}
        h={420}
        level={integrate(wave, 0, 10 * k)}
        max={45}
        label={`${dec(integrate(wave, 0, 10 * k), 1)} m³`}
      />
      {answer !== null && beat === 4 && (
        <Cap x={680} y={680} size={22} color={C.green} tex="2Q\ \Rightarrow\ 2V" />
      )}
      {beat === 5 && (
        <Cap
          x={680}
          y={680}
          size={22}
          color={C.green}
          tex={`\\text{área}\\approx${dec(total, 1)}\\ \\text{m}^3`}
        />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Acumulación',
  intro: {
    question: '¿Cuánto se junta cuando algo fluye a un ritmo que cambia?',
    text: 'Empieza el cálculo integral, que hace el camino inverso de la derivada: de la rapidez de un cambio al total acumulado. Si el caudal fuera constante bastaría multiplicar; cuando cambia, el total es el área bajo la curva del caudal. Así vamos a contar cuánta agua salió de la represa anoche.',
  },
  Scene: AccumLesson,
  beats: [
    {
      say: 'Un **caudal** es un ritmo: cuántos metros cúbicos pasan por segundo. Si es constante, el **volumen** acumulado es caudal por tiempo.',
      dur: 3,
      board: [
        {
          label: 'Caudal',
          tex: 'Q\\ \\left[\\tfrac{\\text{m}^3}{\\text{s}}\\right]',
          body: 'Un ritmo de cambio: volumen por unidad de tiempo.',
        },
        {
          label: 'Caudal constante',
          tex: 'V=\\p{1}{\\cC{Q}}\\cdot\\p{2}{\\cA{t}}',
          parts: ['ritmo de entrada', 'tiempo transcurrido'],
        },
      ],
    },
    {
      say: 'En la gráfica del caudal, un caudal constante es una recta horizontal. El volumen hasta $t$ es el **área del rectángulo** de alto $Q$ y ancho $t$.',
      gate: 'Arrastra el tiempo hasta 10 s y mira cómo crecen el área y el estanque.',
      board: {
        label: 'Volumen = área',
        tex: 'V=\\p{1}{\\underbrace{Q}_{\\text{alto}}}\\cdot\\p{2}{\\underbrace{t}_{\\text{ancho}}}',
        parts: ['altura del rectángulo', 'ancho del rectángulo'],
      },
    },
    {
      say: 'Si el caudal cambia por tramos, cada tramo aporta su propio rectángulo, y el total es la **suma** de las áreas.',
      dur: 3.2,
      board: [
        { label: 'Por tramos', tex: 'V=\\sum_i Q_i\\,\\Delta t_i' },
        {
          tex: '\\p{1}{\\cA{2\\cdot3}}+\\p{2}{\\cM{5\\cdot2}}+\\p{3}{\\cG{1\\cdot4}}=\\p{4}{20\\ \\text{m}^3}',
          parts: [
            'volumen del primer tramo',
            'volumen del segundo tramo',
            'volumen del tercer tramo',
            'volumen total',
          ],
        },
      ],
    },
    {
      say: 'El área bajo una gráfica de ritmo tiene las unidades de lo acumulado: altura por ancho. Lo mismo sirve para velocidad y distancia, o potencia y energía.',
      dur: 3,
      board: {
        label: 'Unidades del área',
        tex: '\\p{1}{\\tfrac{\\text{m}^3}{\\text{s}}}\\times\\p{2}{\\text{s}}=\\p{3}{\\text{m}^3}',
        parts: ['unidad del caudal', 'unidad de tiempo', 'unidad de volumen'],
      },
    },
    {
      say: 'Si el caudal varía de forma continua, el volumen sigue siendo el **área bajo la curva** del caudal: cada instante aporta una franja delgadísima.',
      ask: {
        prompt: 'Si el caudal fuera el doble en cada instante, ¿qué le pasa al volumen acumulado?',
        options: ['Se duplica', 'Se cuadruplica', 'No cambia'],
        answer: 0,
        explain: 'Cada franja duplica su altura sin cambiar su ancho: el área completa se duplica.',
      },
      board: {
        label: 'Caudal variable',
        tex: '\\p{1}{V}=\\p{2}{\\text{área bajo }Q(t)\\ \\text{entre }0\\text{ y }t}',
        parts: ['volumen acumulado', 'área bajo el caudal'],
      },
    },
    {
      say: 'Una forma simple de estimar esa área: contar cuadrados de la cuadrícula. Cada cuadrado vale $1\\ \\tfrac{\\text{m}^3}{\\text{s}}\\times1\\ \\text{s}=1\\ \\text{m}^3$.',
      dur: 2.6,
      board: {
        label: 'Estimar contando',
        body: 'Se cuentan los cuadrados completos bajo la curva y se agregan los pedazos. En la próxima clase lo haremos exacto con rectángulos cada vez más finos.',
        tex: '\\p{1}{\\text{área}}\\approx\\p{2}{\\#\\text{cuadrados}\\times\\text{área de uno}}',
        parts: ['área que buscamos', 'estimación con cuadrados'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo (investigation)
const NIGHT: [number, number, number][] = [
  [0, 2, 2],
  [2, 5, 6],
  [5, 6, 1],
];
const PD = plane([0, 6], [0, 8], { x: 300, y: 130, w: 800, h: 480 });

function FlowDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const onT = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PD.inv(x, 0)[0], 0, 6) * 4) / 4;
    setT(v);
    if (v >= 6) unlock();
  });
  const f = steps(NIGHT);
  const tt = beat === 0 ? t : 6;
  const vol = areaSteps(NIGHT, tt);
  return (
    <Stage ref={svg}>
      <Axes
        P={PD}
        xTicks={[0, 1, 2, 3, 4, 5, 6]}
        yTicks={[2, 4, 6, 8]}
        xLabel="\text{hora}"
        yLabel="Q\ (\text{mil m}^3/\text{h})"
        grid
      />
      <AreaUnder P={PD} f={f} a={0} b={Math.max(0.001, tt)} pos="#5fd3ff" opacity={0.35} />
      {beat === 1 && answer !== null && (
        <AreaUnder P={PD} f={f} a={2} b={5} pos={C.amber} opacity={0.6} />
      )}
      <Curve P={PD} f={f} a={0} b={5.999} color={C.cyan} width={4} />
      <Tank x={1180} y={170} w={160} h={420} level={vol} max={26} label={`${dec(vol, 1)} mil m³`} />
      {beat === 2 && (
        <>
          <line
            x1={1170}
            x2={1350}
            y1={590 - (8 / 26) * 420}
            y2={590 - (8 / 26) * 420}
            stroke={C.red}
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          <Cap x={1360} y={590 - (8 / 26) * 420} size={18} color={C.red} anchor="left">
            informe: 8
          </Cap>
        </>
      )}
      {beat === 0 && (
        <>
          <rect
            x={PD.x(0) - 10}
            y={PD.y(0)}
            width={PD.box.w + 20}
            height={60}
            fill="transparent"
            onPointerDown={onT}
          />
          <Knob
            x={PD.x(t)}
            y={PD.y(0) + 30}
            onPointerDown={onT}
            cursor="ew-resize"
            label={hhmm(t)}
          />
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Log({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0: four constant stretches
    const durs = [randInt(r, 1, 3), randInt(r, 1, 2), randInt(r, 1, 3), randInt(r, 1, 2)];
    const vals = [randInt(r, 1, 7), randInt(r, 1, 7), randInt(r, 1, 7), randInt(r, 1, 7)];
    let acc = 0;
    const segs: [number, number, number][] = durs.map((d, i) => {
      const s: [number, number, number] = [acc, acc + d, vals[i]];
      acc += d;
      return s;
    });
    // round 1: ramp up, plateau, ramp down (exact trapezoid)
    const up = pick(r, [1, 2]);
    const flat = pick(r, [2, 3]);
    const down = pick(r, [1, 2]);
    const peak = pick(r, [4, 6, 8]);
    // round 2: three graphs, one has the largest area
    const hp = pick(r, [9, 12]);
    const hm = pick(r, [2.6, 3.2]);
    const sr = pick(r, [0.8, 1]);
    const cands = shuffle(r, [
      {
        name: 'compuerta del pico alto y corto',
        f: (t: number) => Math.max(0, hp - hp * Math.abs(t - 3)),
      },
      {
        name: 'compuerta de la meseta baja y larga',
        f: (t: number) => (t >= 0.5 && t <= 5.5 ? hm : 0),
      },
      { name: 'compuerta de la rampa', f: (t: number) => (t <= 6 ? t * sr : 0) },
    ]);
    return { segs, total: acc, up, flat, down, peak, cands };
  }, [seed]);
  const [val, setVal] = useState('');
  const [pickI, setPickI] = useState<number | null>(null);

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        'Caudalímetro de la tubería 7: caudal constante por tramos. ¿Cuánta agua pasó en total, en miles de m³?',
        'V=\\sum_i Q_i\\,\\Delta t_i',
      );
      api.hints([
        'Cada tramo es un rectángulo: alto (caudal) por ancho (horas).',
        'Suma las cuatro áreas.',
      ]);
    } else if (round === 1) {
      api.prompt(
        'La compuerta se abre de a poco, se mantiene y se cierra de a poco. ¿Cuánta agua pasó, en miles de m³?',
        'V=\\text{área bajo }Q(t)',
      );
      api.hints([
        'La región es un trapecio: dos triángulos y un rectángulo.',
        'Área de un triángulo: base por altura dividido por 2.',
      ]);
    } else {
      api.prompt(
        'Tres compuertas distintas, el mismo rato. Elige la que dejó pasar **más** agua.',
        '\\text{más área}\\ \\Rightarrow\\ \\text{más volumen}',
      );
      api.hints([
        'No mires solo la altura máxima: el volumen es el área.',
        'Estima cada área contando cuadrados.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (pickI === null) return;
      const areas = data.cands.map((c) => integrate(c.f, 0, 6));
      const best = areas.indexOf(Math.max(...areas));
      if (pickI === best)
        return api.result(
          true,
          `Áreas: ${areas.map((a) => dec(a, 1)).join(' · ')} mil m³. Gana la ${data.cands[best].name}.`,
        );
      return api.result(
        false,
        `La ${data.cands[pickI].name} deja ${dec(areas[pickI], 1)} mil m³; la ${data.cands[best].name}, ${dec(areas[best], 1)}. La altura no basta: importa el área.`,
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = areaSteps(data.segs, 99);
      if (Math.abs(v - t) < 0.01)
        return api.result(
          true,
          `${data.segs.map(([a, b, q]) => `${q}·${b - a}`).join(' + ')} = ${t} mil m³.`,
        );
      const sumQ = data.segs.reduce((a, s) => a + s[2], 0);
      if (v === sumQ)
        return api.result(
          false,
          'Sumaste los caudales, pero cada uno dura distinto tiempo: multiplica cada caudal por su duración.',
        );
      return api.result(
        false,
        `Revisa los tramos: ${data.segs.map(([a, b, q]) => `${q} durante ${b - a} h`).join(', ')}.`,
      );
    }
    const t = (data.peak * data.up) / 2 + data.peak * data.flat + (data.peak * data.down) / 2;
    if (Math.abs(v - t) < 0.01)
      return api.result(
        true,
        `$\\tfrac{${data.peak}\\cdot${data.up}}{2}+${data.peak}\\cdot${data.flat}+\\tfrac{${data.peak}\\cdot${data.down}}{2}=${dec(t, 1)}$ mil m³.`,
      );
    if (Math.abs(v - data.peak * (data.up + data.flat + data.down)) < 0.01)
      return api.result(
        false,
        'Eso sería si el caudal estuviera al máximo todo el rato. En las rampas, el área es un triángulo: la mitad.',
      );
    return api.result(
      false,
      `Rampa de subida: triángulo. Meseta: rectángulo de ${data.peak} por ${data.flat}. Rampa de bajada: triángulo.`,
    );
  };

  if (round === 2) {
    return (
      <Stage>
        {data.cands.map((c, i) => {
          const Q = plane([0, 6], [0, 10], { x: 140 + i * 470, y: 200, w: 400, h: 400 });
          return (
            <g key={i} onClick={() => setPickI(i)} style={{ cursor: 'pointer' }}>
              <rect
                x={Q.box.x - 10}
                y={Q.box.y - 10}
                width={Q.box.w + 20}
                height={Q.box.h + 20}
                fill="transparent"
                stroke={pickI === i ? C.amber : C.line}
                strokeWidth={pickI === i ? 3 : 1}
              />
              <Axes P={Q} xTicks={[0, 2, 4, 6]} yTicks={[2, 4, 6, 8]} grid />
              <AreaUnder P={Q} f={c.f} a={0} b={6} pos="#5fd3ff" opacity={0.35} />
              <Curve P={Q} f={c.f} a={0} b={6} color={pickI === i ? C.amber : C.cyan} width={3.5} />
              <Html
                x={Q.x(3)}
                y={Q.box.y + Q.box.h + 40}
                size={20}
                color={pickI === i ? C.amber : C.muted}
              >
                <span>{['A', 'B', 'C'][i]}</span>
              </Html>
            </g>
          );
        })}
        <Confirm onClick={submit} disabled={pickI === null} />
      </Stage>
    );
  }
  const total = round === 0 ? data.total : data.up + data.flat + data.down;
  const Q = plane([0, Math.max(6, total)], [0, 8], { x: 300, y: 130, w: 900, h: 480 });
  const f =
    round === 0
      ? steps(data.segs)
      : (t: number) =>
          t < data.up
            ? (data.peak * t) / data.up
            : t < data.up + data.flat
              ? data.peak
              : t < total
                ? data.peak * (1 - (t - data.up - data.flat) / data.down)
                : 0;
  return (
    <Stage>
      <Axes
        P={Q}
        xTicks={Array.from({ length: Math.max(6, total) + 1 }, (_, i) => i)}
        yTicks={[2, 4, 6, 8]}
        xLabel="\text{h}"
        yLabel="Q"
        grid
      />
      <AreaUnder P={Q} f={f} a={0} b={total} pos="#5fd3ff" opacity={0.35} />
      <Curve P={Q} f={f} a={0} b={total - 0.001} color={C.cyan} width={4} />
      <Html x={1240} y={180} size={18} color={C.muted} anchor="left">
        <Tex tex="Q\ \text{en mil m}^3/\text{h}" />
      </Html>
      <NumberField
        x={1240}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="V ="
        width={4}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c1',
  world: 'integral',
  code: '3.1',
  title: 'El caudal',
  subtitle: 'Acumulación',
  glyph: 'Q\\,\\Delta t',
  kind: 'level',
  guide: 'teo',
  teaser:
    'El informe de la represa declara 8 mil m³ para anoche, y el lago bajó bastante más que eso.',
  learn:
    'Caudal como ritmo, volumen como acumulación, área bajo la gráfica del ritmo, tramos constantes como suma de rectángulos y unidades del área.',
  glyphs: ['rate-acc'],
  pitfalls: [
    'Sumar caudales no da volumen: cada caudal se multiplica por su duración.',
    'Un pico alto pero corto puede acumular menos que un caudal bajo y largo.',
    'El área bajo un ritmo tiene unidades de cantidad: m³/s × s = m³.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'nar',
          text: 'Represa Peñuelas, siete de la mañana. El viento golpeaba la baranda, y en el muro se veía una franja oscura donde el agua había estado la semana pasada.',
        },
        {
          who: 'marta',
          text: 'El informe declara 8 mil m³ para anoche. La marca del lago bajó bastante más de lo que esa cifra permite.',
        },
        {
          who: 'teo',
          text: 'Tengo el caudalímetro de la tubería 7, la que va a la central. Guarda cuánto pasa por hora; falta juntar la noche completa.',
        },
        { who: 'iris', text: '¿Podemos copiar el registro antes de que alguien lo corrija?' },
        {
          who: 'marta',
          text: 'Copia todo. Aquí las correcciones suelen llegar antes que las preguntas.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Tubería 7',
      Scene: FlowDemo,
      beats: [
        {
          say: 'El caudal de la tubería 7 durante la noche, en miles de m³ por hora. El estanque muestra lo acumulado.',
          gate: 'Arrastra la hora hasta las 06:00.',
          note: {
            label: 'Volumen de la noche',
            tex: '2\\cdot2+6\\cdot3+1\\cdot1=23',
            body: 'Mil m³: la suma de las áreas de los tres tramos.',
          },
        },
        {
          say: 'Marta quiere saber cuánta agua salió en el tramo fuerte.',
          ask: {
            prompt: '¿Cuánta agua salió entre las 02:00 y las 05:00?',
            options: ['18 mil m³', '6 mil m³', '9 mil m³'],
            answer: 0,
            explain: 'Caudal 6 durante 3 horas: el rectángulo naranja mide $6\\cdot3=18$.',
          },
        },
        {
          say: 'El informe oficial declara 8 mil m³ para toda la noche.',
          dur: 1.6,
          note: {
            label: 'La diferencia',
            tex: '23-8=15\\ \\text{mil m}^3',
            body: 'Cada noche faltan 15 mil m³ en el informe.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'El registro', Comp: Log, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'marta',
          text: 'En los tramos registrados pasaron 23 mil m³, y el informe declara 8 mil. Quedaron 15 mil fuera del papel.',
        },
        { who: 'iris', text: 'Quince mil metros cúbicos no se van por un descuido.' },
        {
          who: 'teo',
          text: 'Hay que afinar la cuenta: dentro de cada hora el caudal también cambia, y la cuenta por tramos supone que se mantiene fijo.',
        },
        {
          who: 'marta',
          text: 'Entonces anota esa condición. No quiero darles una excusa para descartar el registro.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'rate-acc',
    world: 'integral',
    tex: 'V=Q\\cdot t',
    name: 'Acumulación',
    read: 've igual cu por te',
    meaning:
      'Con un ritmo constante, lo acumulado es ritmo por tiempo: el área de un rectángulo bajo la gráfica del ritmo.',
  },
];
