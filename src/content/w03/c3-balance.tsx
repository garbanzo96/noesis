import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, lerp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Line } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, hhmm, parseNum } from '../shared/ui';
import { AreaUnder, Tank, integrate } from './kit';

// ============================================================================
// CASO 3.3 · «El balance» — integral definida: área con signo y propiedades
// Un ritmo neto puede ser negativo: el área bajo el eje resta. La integral da el cambio neto.
// Propiedades: aditividad en intervalos, linealidad, límites iguales o invertidos, valor medio.
// ============================================================================

const net = (t: number) => 1.6 * Math.sin((t * Math.PI) / 4) + 0.3;
const PL = plane([0, 8], [-2.5, 2.5], { x: 300, y: 120, w: 820, h: 520 });

// ---------------------------------------------------------------- lesson
function BalanceLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [mid, setMid] = useState(3);
  const onMid = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PL.inv(x, 0)[0], 0.5, 7.5) * 4) / 4;
    setMid(v);
    if (v >= 6) unlock();
  });
  const total = integrate(net, 0, 8);

  if (beat <= 1) {
    const upTo = beat === 1 ? 8 * at(1) : 8;
    const level = 3 + integrate(net, 0, upTo);
    return (
      <Stage>
        <Axes
          P={PL}
          xTicks={[0, 2, 4, 6, 8]}
          yTicks={[-2, -1, 1, 2]}
          xLabel="t"
          yLabel="r(t)"
          grid
        />
        <AreaUnder
          P={PL}
          f={net}
          a={0}
          b={Math.max(0.01, upTo)}
          pos={C.green}
          neg={C.red}
          opacity={0.4}
        />
        <Curve P={PL} f={net} a={0} b={8} color={C.cyan} width={4} />
        <Cap x={PL.x(2)} y={PL.y(0.8)} size={26} color={C.green} tex="+" />
        <Cap x={PL.x(6)} y={PL.y(-0.6)} size={26} color={C.red} tex="-" />
        {beat === 1 && (
          <Tank
            x={1180}
            y={170}
            w={160}
            h={460}
            level={level}
            max={8}
            label={`nivel ${dec(level, 2)}`}
          />
        )}
        <Cap x={760} y={720} size={20} color={C.muted}>
          sobre el eje entra agua; bajo el eje, sale
        </Cap>
      </Stage>
    );
  }
  if (beat === 2) {
    const A1 = integrate(net, 0, mid);
    const A2 = integrate(net, mid, 8);
    return (
      <Stage ref={svg}>
        <Axes
          P={PL}
          xTicks={[0, 2, 4, 6, 8]}
          yTicks={[-2, -1, 1, 2]}
          xLabel="t"
          yLabel="r(t)"
          grid
        />
        <AreaUnder P={PL} f={net} a={0} b={mid} pos={C.cyan} neg={C.cyan} opacity={0.35} />
        <AreaUnder P={PL} f={net} a={mid} b={8} pos={C.amber} neg={C.amber} opacity={0.35} />
        <Curve P={PL} f={net} a={0} b={8} color={C.text} width={3} />
        <Line a={PL.pt(mid, -2.5)} b={PL.pt(mid, 2.5)} color={C.text} width={2} dashed />
        <Knob
          x={PL.x(mid)}
          y={PL.y(-2.5) + 30}
          onPointerDown={onMid}
          cursor="ew-resize"
          label="b"
        />
        <Cap
          x={1330}
          y={200}
          size={22}
          color={C.cyan}
          tex={`\\int_0^{b}=${dec(A1, 2).replace(',', '{,}')}`}
        />
        <Cap
          x={1330}
          y={250}
          size={22}
          color={C.amber}
          tex={`\\int_b^{8}=${dec(A2, 2).replace(',', '{,}')}`}
        />
        <Cap
          x={1330}
          y={310}
          size={24}
          color={C.text}
          tex={`\\text{suma}=${dec(A1 + A2, 2).replace(',', '{,}')}`}
        />
      </Stage>
    );
  }
  if (beat === 3) {
    const g = (t: number) => 0.8 + 0.1 * t;
    const h = (t: number) => net(t) + g(t);
    const k = at(3);
    return (
      <Stage>
        <Axes P={PL} xTicks={[0, 2, 4, 6, 8]} yTicks={[-2, -1, 1, 2]} xLabel="t" yLabel="" grid />
        <AreaUnder P={PL} f={g} a={0} b={8} pos={C.amber} opacity={0.3} />
        <Curve P={PL} f={g} a={0} b={8} color={C.amber} width={3} />
        <Curve P={PL} f={net} a={0} b={8} color={C.cyan} width={3} />
        <Group opacity={k}>
          <Curve P={PL} f={h} a={0} b={8} color={C.green} width={4} />
        </Group>
        <Cap x={1330} y={200} size={22} color={C.cyan} tex="f" />
        <Cap x={1330} y={240} size={22} color={C.amber} tex="g" />
        <Cap x={1330} y={280} size={22} color={C.green} tex="f+g" opacity={k} />
      </Stage>
    );
  }
  if (beat === 4) {
    return (
      <Stage>
        <Cap x={800} y={240} size={40} color={C.text} tex="\int_a^a f(x)\,dx=0" />
        <Cap
          x={800}
          y={420}
          size={40}
          color={C.text}
          tex="\int_b^a f(x)\,dx=-\int_a^b f(x)\,dx"
          opacity={at(4)}
        />
        <Cap x={800} y={560} size={20} color={C.muted} opacity={at(4)}>
          recorrer el intervalo al revés cambia el signo de cada Δx
        </Cap>
      </Stage>
    );
  }
  // beat 5: average value as levelling water
  const flow = (t: number) => 2 + 1.6 * Math.sin((t * Math.PI) / 3) * Math.exp(-0.05 * t);
  const P5 = plane([0, 6], [0, 4.5], { x: 300, y: 120, w: 820, h: 520 });
  const avg = integrate(flow, 0, 6) / 6;
  const k = at(5);
  const lev = (t: number) => lerp(flow(t), avg, k);
  return (
    <Stage>
      <Axes P={P5} xTicks={[0, 2, 4, 6]} yTicks={[1, 2, 3, 4]} xLabel="t" yLabel="Q" grid />
      <AreaUnder P={P5} f={lev} a={0} b={6} pos="#5fd3ff" opacity={0.4} />
      <Curve P={P5} f={flow} a={0} b={6} color={C.cyan} width={3} />
      <Line a={P5.pt(0, avg)} b={P5.pt(6, avg)} color={C.amber} width={3} dashed />
      <Cap
        x={P5.x(6) + 14}
        y={P5.y(avg)}
        size={22}
        color={C.amber}
        anchor="left"
        tex={`\\bar Q=${dec(avg, 2).replace(',', '{,}')}`}
      />
      {answer !== null && <Cap x={1330} y={500} size={24} color={C.green} tex="\tfrac{24}{6}=4" />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Área con signo y propiedades',
  intro: {
    question: '¿Qué pasa con la cuenta cuando unas veces entra y otras veces sale?',
    text: 'La integral cuenta con signo: lo que queda bajo el eje resta. Por eso mide un cambio neto, y sus propiedades permiten partirla en tramos y sumar los pedazos. De día los ríos reponen el lago y de noche la tubería 7 lo vacía, y falta el balance de las 24 horas.',
  },
  Scene: BalanceLesson,
  beats: [
    {
      say: 'Un ritmo **neto** puede ser negativo: si sale más agua de la que entra, la curva baja del eje. Las franjas bajo el eje tienen altura negativa, así que **restan**.',
      dur: 2.8,
      board: {
        label: 'Área con signo',
        tex: '\\int_a^b r(t)\\,dt=\\p{1}{\\cG{A_{\\text{arriba}}}}-\\p{2}{\\cR{A_{\\text{abajo}}}}',
        parts: ['aporte que suma', 'aporte que resta'],
      },
    },
    {
      say: 'Por eso la integral de un ritmo da el **cambio neto**: cuánto subió o bajó la cantidad entre el comienzo y el final.',
      dur: 4,
      board: {
        label: 'Cambio neto',
        tex: '\\int_a^b r(t)\\,dt=\\p{1}{V(b)}-\\p{2}{V(a)}',
        body: 'El nivel del estanque sube con el área verde y baja con la roja.',
        parts: ['volumen al final', 'volumen al inicio'],
      },
    },
    {
      say: 'Si se corta el intervalo en un punto $b$, la integral total es la suma de las dos partes, sin importar dónde se corte.',
      gate: 'Mueve el corte b por el intervalo.',
      board: {
        label: 'Aditividad',
        tex: '\\int_a^c f=\\p{1}{\\cC{\\int_a^b f}}+\\p{2}{\\cA{\\int_b^c f}}',
        parts: ['área antes del corte', 'área después del corte'],
      },
    },
    {
      say: 'Integrar respeta sumas y constantes: el área de $f+g$ es el área de $f$ más la de $g$, y duplicar la altura duplica el área.',
      dur: 2.6,
      board: {
        label: 'Linealidad',
        tex: '\\int(\\p{1}{\\alpha f}+\\p{2}{\\beta g})=\\p{1}{\\alpha\\int f}+\\p{2}{\\beta\\int g}',
        parts: ['primer aporte escalado', 'segundo aporte escalado'],
      },
    },
    {
      say: 'Un intervalo sin ancho no acumula nada. Y recorrer el intervalo al revés cambia el signo.',
      dur: 2.6,
      board: [
        { label: 'Límites iguales', tex: '\\int_a^a f=0' },
        { label: 'Límites invertidos', tex: '\\int_b^a f=-\\int_a^b f' },
      ],
    },
    {
      say: 'El **valor medio** es la altura constante que acumularía lo mismo en el mismo tiempo: como si el agua bajo la curva se nivelara.',
      ask: {
        prompt: 'Si en 6 horas pasaron 24 mil m³, ¿cuál fue el caudal medio?',
        options: ['4 mil m³/h', '24 mil m³/h', '144 mil m³/h'],
        answer: 0,
        explain: 'Área dividida por el ancho: $24/6=4$.',
      },
      board: {
        label: 'Valor medio',
        tex: '\\bar f=\\frac{\\p{2}{1}}{\\p{2}{b-a}}\\p{1}{\\int_a^b f(x)\\,dx}',
        parts: ['área total acumulada', 'por unidad de intervalo'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const inflow = (t: number) => 3 + Math.sin(((t - 8) * Math.PI) / 12);
const outflow = (t: number) => 2.5 + (t >= 0 && t < 6 ? 4.5 : 0.6 * Math.sin((t * Math.PI) / 12));
const PD = plane([0, 24], [-5, 5], { x: 300, y: 120, w: 820, h: 520 });

function BudgetDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const r = (t: number) => inflow(t) - outflow(t);
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[0, 6, 12, 18, 24]}
        yTicks={[-4, -2, 2, 4]}
        xLabel="\text{hora}"
        yLabel="r"
        grid
      />
      {beat === 0 && (
        <>
          <Curve P={PD} f={inflow} a={0} b={24} color={C.green} width={3} />
          <Curve P={PD} f={(t) => -outflow(t)} a={0} b={24} color={C.red} width={3} />
          <Cap x={1330} y={200} size={20} color={C.green} anchor="left">
            entra (ríos)
          </Cap>
          <Cap x={1330} y={240} size={20} color={C.red} anchor="left">
            sale (ciudad + tubería 7)
          </Cap>
        </>
      )}
      {beat >= 1 && (
        <>
          <AreaUnder P={PD} f={r} a={0} b={24} pos={C.green} neg={C.red} opacity={0.4} />
          <Curve P={PD} f={r} a={0} b={24} color={C.cyan} width={4} />
          <Cap
            x={1330}
            y={200}
            size={22}
            color={C.cyan}
            anchor="left"
            tex="r=\text{entra}-\text{sale}"
          />
        </>
      )}
      {beat >= 1 && answer !== null && (
        <Cap
          x={1330}
          y={260}
          size={22}
          color={C.amber}
          anchor="left"
          tex={`\\int_0^{24}r\\,dt\\approx${dec(integrate(r, 0, 24), 1).replace(',', '{,}')}`}
        />
      )}
      {beat === 2 && (
        <Line
          a={PD.pt(0, integrate(r, 0, 6) / 6)}
          b={PD.pt(6, integrate(r, 0, 6) / 6)}
          color={C.amber}
          width={3}
          dashed
        />
      )}
      <Html x={PD.x(3)} y={PD.y(4.4)} size={16} color={C.muted}>
        <span>
          {hhmm(0)}–{hhmm(6)}
        </span>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Budget({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0: piecewise linear net rate: up-triangle then rectangle below axis
    const h1 = pick(r, [2, 3, 4]);
    const w1 = pick(r, [2, 4]);
    const h2 = pick(r, [1, 2]);
    const w2 = pick(r, [2, 3]);
    // round 1: property templates
    const A = randInt(r, 10, 30);
    const B = randInt(r, 2, A - 2);
    const c = pick(r, [2, 3, 5]);
    const kind = pick(r, ['split', 'scale', 'reverse'] as const);
    // round 2: average
    const T = pick(r, [4, 5, 8]);
    const V = T * randInt(r, 2, 9);
    return { h1, w1, h2, w2, A, B, c, kind, T, V };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');
  const net0 = (t: number) =>
    t < d.w1 ? d.h1 * (1 - Math.abs(2 * t - d.w1) / d.w1) : t < d.w1 + d.w2 ? -d.h2 : 0;

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        'Ritmo neto del lago (entra menos sale), en miles de m³/h. ¿Cuánto cambió el volumen del lago en total?',
        '\\int r(t)\\,dt=A_{\\text{arriba}}-A_{\\text{abajo}}',
      );
      api.hints([
        'El triángulo de arriba suma; el rectángulo de abajo resta.',
        'Triángulo: base por altura dividido por 2.',
      ]);
    } else if (round === 1) {
      const tex =
        d.kind === 'split'
          ? `\\int_0^{10}f=${d.A},\\quad \\int_0^{4}f=${d.B}.\\quad \\int_4^{10}f=\\ ?`
          : d.kind === 'scale'
            ? `\\int_0^{10}f=${d.A}.\\quad \\int_0^{10}${d.c}f=\\ ?`
            : `\\int_0^{10}f=${d.A}.\\quad \\int_{10}^{0}f=\\ ?`;
      api.prompt('Usa las propiedades de la integral.', tex);
      api.hints([
        d.kind === 'split'
          ? 'Aditividad: el total es la suma de las dos partes.'
          : d.kind === 'scale'
            ? 'Una constante sale de la integral.'
            : 'Invertir los límites cambia el signo.',
        'No hace falta conocer $f$.',
      ]);
    } else {
      api.prompt(
        `En ${d.T} horas la tubería 7 sacó ${d.V} mil m³. ¿Cuál fue su caudal medio, en miles de m³/h?`,
        '\\bar Q=\\frac{1}{b-a}\\int_a^b Q(t)\\,dt',
      );
      api.hints([
        'El valor medio es el área dividida por el ancho del intervalo.',
        `$${d.V}/${d.T}$.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const up = (d.h1 * d.w1) / 2;
      const dn = d.h2 * d.w2;
      const t = up - dn;
      if (Math.abs(v - t) < 0.01)
        return api.result(
          true,
          `$${dec(up)}-${dn}=${dec(t)}$ mil m³. ${t < 0 ? 'El lago bajó.' : 'El lago subió.'}`,
        );
      if (Math.abs(v - (up + dn)) < 0.01)
        return api.result(false, 'Sumaste las dos áreas, pero la de abajo es salida: resta.');
      return api.result(
        false,
        `Arriba: triángulo de base ${d.w1} y altura ${d.h1}. Abajo: rectángulo de ${d.w2} por ${d.h2}.`,
      );
    }
    if (round === 1) {
      const t = d.kind === 'split' ? d.A - d.B : d.kind === 'scale' ? d.c * d.A : -d.A;
      if (Math.abs(v - t) < 0.01)
        return api.result(
          true,
          d.kind === 'split'
            ? `$${d.A}-${d.B}=${t}$ por aditividad.`
            : d.kind === 'scale'
              ? `$${d.c}\\cdot${d.A}=${t}$ por linealidad.`
              : `Invertir los límites cambia el signo: ${t}.`,
        );
      return api.result(
        false,
        d.kind === 'split'
          ? '$\\int_0^{10}=\\int_0^4+\\int_4^{10}$: despeja la segunda.'
          : d.kind === 'scale'
            ? 'La constante multiplica a toda la integral.'
            : 'Mismo valor, signo contrario.',
      );
    }
    const t = d.V / d.T;
    if (Math.abs(v - t) < 0.01)
      return api.result(
        true,
        `$${d.V}/${d.T}=${dec(t, 2)}$ mil m³/h: la altura del rectángulo con la misma área.`,
      );
    return api.result(false, `Valor medio = área / ancho = ${d.V} / ${d.T}.`);
  };

  if (round === 0) {
    const w = d.w1 + d.w2;
    const Q = plane([0, w + 1], [-3, 5], { x: 300, y: 120, w: 820, h: 520 });
    return (
      <Stage>
        <Axes
          P={Q}
          xTicks={Array.from({ length: w + 2 }, (_, i) => i)}
          yTicks={[-2, 2, 4]}
          xLabel="\text{h}"
          yLabel="r"
          grid
        />
        <AreaUnder P={Q} f={net0} a={0} b={w} pos={C.green} neg={C.red} opacity={0.4} />
        <Curve P={Q} f={net0} a={0} b={w - 0.001} color={C.cyan} width={4} />
        <NumberField
          x={1250}
          y={420}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label="ΔV ="
          width={4}
        />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  const fr = (t: number) => 2 + Math.sin(t * 0.7) + 0.1 * t;
  const Q2 = plane([0, 10.5], [-1, 8], { x: 300, y: 140, w: 820, h: 460 });
  if (round === 1)
    return (
      <Stage>
        <Axes P={Q2} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[2, 4, 6]} xLabel="x" yLabel="" grid />
        {d.kind === 'split' && (
          <>
            <AreaUnder P={Q2} f={fr} a={0} b={4} pos={C.cyan} opacity={0.35} />
            <AreaUnder P={Q2} f={fr} a={4} b={10} pos={C.amber} opacity={0.35} />
            <Cap x={Q2.x(2)} y={Q2.y(1)} size={26} color={C.cyan} tex={String(d.B)} />
            <Cap x={Q2.x(7)} y={Q2.y(1)} size={26} color={C.amber} tex="?" />
          </>
        )}
        {d.kind === 'scale' && (
          <>
            <AreaUnder P={Q2} f={fr} a={0} b={10} pos={C.cyan} opacity={0.3} />
            <Curve
              P={Q2}
              f={(t) => Math.min(8, d.c * fr(t))}
              a={0}
              b={10}
              color={C.amber}
              width={3}
            />
            <Cap x={Q2.x(5)} y={Q2.y(1)} size={26} color={C.cyan} tex={String(d.A)} />
          </>
        )}
        {d.kind === 'reverse' && (
          <>
            <AreaUnder P={Q2} f={fr} a={0} b={10} pos={C.cyan} opacity={0.3} />
            <Cap x={Q2.x(5)} y={Q2.y(1)} size={26} color={C.cyan} tex={String(d.A)} />
            <line
              x1={Q2.x(10)}
              x2={Q2.x(0)}
              y1={Q2.y(-0.6)}
              y2={Q2.y(-0.6)}
              stroke={C.red}
              strokeWidth={3}
              markerEnd="url(#arrowhead)"
            />
          </>
        )}
        <Curve P={Q2} f={fr} a={0} b={10} color={C.text} width={3} />
        <NumberField
          x={1250}
          y={420}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label="="
          width={4}
        />
        <Confirm onClick={submit} />
      </Stage>
    );
  return (
    <Stage>
      <rect
        x={400}
        y={260}
        width={d.T * 80}
        height={300}
        fill="#5fd3ff"
        opacity={0.25}
        stroke="#5fd3ff"
        strokeWidth={3}
        strokeDasharray="8 6"
      />
      <Cap x={400 + d.T * 40} y={410} size={28} color={C.text} tex={`\\text{área}=${d.V}`} />
      <Cap
        x={400 + d.T * 40}
        y={600}
        size={22}
        color={C.muted}
        tex={`\\text{ancho}=${d.T}\\ \\text{h}`}
      />
      <Cap x={370} y={410} size={26} color={C.amber} tex="\bar Q=\ ?" anchor="right" />
      <NumberField
        x={1100}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="Q̄ ="
        width={4}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c3',
  world: 'integral',
  code: '3.3',
  title: 'El balance',
  subtitle: 'Área con signo y propiedades',
  glyph: '\\pm\\int',
  kind: 'level',
  guide: 'iris',
  teaser:
    'De día los ríos reponen el lago y de noche la tubería 7 lo vacía. Falta la cuenta de las 24 horas.',
  learn:
    'Área con signo, la integral como cambio neto, aditividad, linealidad, límites iguales o invertidos y valor medio de una función.',
  glyphs: ['netchange', 'avgval'],
  pitfalls: [
    'El área bajo el eje resta: la integral puede ser negativa.',
    'El valor medio divide por el ancho del intervalo, no por el número de datos.',
    '$\\int (fg)\\ne\\int f\\cdot\\int g$: la linealidad vale para sumas y constantes, no para productos.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'nar',
          text: 'Orilla de Peñuelas, mediodía. La línea del agua había dejado en las piedras una franja oscura, más ancha que la del año pasado.',
        },
        {
          who: 'marta',
          text: 'De día los ríos reponen agua, y de madrugada la tubería 7 saca mucho más. Necesito la cuenta de las 24 horas.',
        },
        {
          who: 'iris',
          text: 'Alguien me va a mostrar solo la subida de la tarde. Quiero también lo que perdió de noche.',
        },
        {
          who: 'tu',
          text: 'Restaría todas las salidas, también las de la ciudad, antes de dar por recuperado el lago.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El balance del lago',
      Scene: BudgetDemo,
      beats: [
        {
          say: 'En verde, lo que entra por los ríos. En rojo, lo que sale hacia la ciudad y la tubería 7.',
          dur: 1.8,
          note: { label: 'Ritmo neto', tex: 'r(t)=\\text{entra}(t)-\\text{sale}(t)' },
        },
        {
          say: 'El ritmo neto es la diferencia: positivo de día, muy negativo de madrugada.',
          ask: {
            prompt: 'Si la integral de las 24 horas es negativa, ¿qué pasó con el lago?',
            options: ['Terminó el día con menos agua', 'Terminó igual', 'No se puede saber'],
            answer: 0,
            explain:
              'La integral del ritmo neto es el cambio neto de volumen: negativa significa que el lago perdió agua.',
          },
          note: {
            label: 'Balance del día',
            tex: '\\int_0^{24}r(t)\\,dt<0',
            body: 'El área roja de la madrugada pesa más que la verde del día.',
          },
        },
        {
          say: 'Entre las 00:00 y las 06:00 la salida neta media es la línea naranja: el nivel equivalente.',
          dur: 1.8,
          note: { label: 'Salida media nocturna', tex: '\\bar r=\\tfrac16\\int_0^6 r(t)\\,dt' },
        },
      ],
    },
    { kind: 'challenge', title: 'El balance', Comp: Budget, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'teo',
          text: 'El balance de las 24 horas da una pérdida de unos 12,7 mil m³. Lo que entra de día no compensa la madrugada.',
        },
        {
          who: 'marta',
          text: 'A ese ritmo no llegamos con reserva al verano, diga lo que diga el informe.',
        },
        { who: 'iris', text: 'Necesito saber a qué hora empieza a bajar.' },
        {
          who: 'teo',
          text: 'Podemos reconstruir el volumen hora por hora. El total del día tapaba el momento del cambio.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'netchange',
    world: 'integral',
    tex: '\\int_a^b r\\,dt=V(b)-V(a)',
    name: 'Cambio neto',
    read: 'cambio neto',
    meaning: 'Integrar un ritmo da cuánto cambió la cantidad: lo que entró menos lo que salió.',
  },
  {
    id: 'avgval',
    world: 'integral',
    tex: '\\bar f=\\frac{1}{b-a}\\int_a^b f',
    name: 'Valor medio',
    read: 'efe barra',
    meaning: 'Altura constante que acumularía lo mismo en el mismo intervalo.',
  },
];
