import { useId, type ComponentProps } from 'react';
import { clamp } from '../../engine/anim';
import { C } from '../../engine/palette';
import { plane, type Plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

export type V2 = [number, number];
export type M2 = [V2, V2];
export type Rate = (t: number, y: number) => number;
export const ACCENT = '#e7df5a';
/** Keep prose inside the right column, with room for two lines between readings. */
export function Readout({ children, ...props }: Omit<ComponentProps<typeof Cap>, 'tex'>) {
  return (
    <Cap {...props}>
      <span
        style={{
          display: 'block',
          width: 'max(calc(var(--su) * 380), 16em)',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {children}
      </span>
    </Cap>
  );
}
export const fmt = (v: number, digits = 2) => dec(v, digits);
export const num = (v: number, digits = 2) => fmt(v, digits).replace('−', '-').replace(',', '{,}');
export const near = (a: number, b: number, tolerance = 0.005) =>
  Number.isFinite(a) && Math.abs(a - b) <= tolerance + 1e-12;
export const distance = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const nearComponents = (a: V2, b: V2, tolerance = 0.005) =>
  a.every((v, i) => near(v, b[i], tolerance));
export const pair = (v: V2, digits = 2) => `(${num(v[0], digits)};\\,${num(v[1], digits)})`;
/** Signed coefficients, with zero terms and unit coefficients omitted. */
export function polynomial(terms: [number, string][]) {
  return (
    terms
      .filter(([k]) => k !== 0)
      .map(
        ([k, symbol], i) =>
          `${k < 0 ? '-' : i ? '+' : ''}${Math.abs(k) === 1 && symbol ? '' : num(Math.abs(k), 6)}${symbol}`,
      )
      .join('') || '0'
  );
}
export function euler(f: Rate, t0: number, y0: number, h: number, n: number): V2[] {
  if (!(h > 0) || !Number.isInteger(n) || n < 0)
    throw new Error('Euler requiere paso positivo y cantidad entera de pasos.');
  const nodes: V2[] = [[t0, y0]];
  for (let i = 0; i < n; i++) {
    const [t, y] = nodes[i];
    nodes.push([t0 + (i + 1) * h, y + h * f(t, y)]);
  }
  return nodes;
}
export const logisticStep = (r: number, x: number) => r * x * (1 - x);
export const trace2 = (A: M2) => A[0][0] + A[1][1];
export const det2 = (A: M2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const mul2 = (A: M2, x: V2): V2 => [
  A[0][0] * x[0] + A[0][1] * x[1],
  A[1][0] * x[0] + A[1][1] * x[1],
];
/** Roots of λ² − tr(A)λ + det(A); complex roots retain their imaginary part. */
export function eigen2(A: M2): [{ re: number; im: number }, { re: number; im: number }] {
  const re = trace2(A) / 2,
    delta = trace2(A) ** 2 - 4 * det2(A);
  const d = Math.sqrt(Math.abs(delta)) / 2;
  return delta >= 0
    ? [
        { re: re + d, im: 0 },
        { re: re - d, im: 0 },
      ]
    : [
        { re, im: d },
        { re, im: -d },
      ];
}
/** Analytic matrix exponential: B=A−tr(A)I/2 satisfies B²=(Δ/4)I. Includes repeated roots. */
export function linearExact(A: M2, x0: V2, t: number): V2 {
  const a = trace2(A) / 2,
    d2 = a * a - det2(A),
    d = Math.sqrt(Math.abs(d2));
  const c = d2 > 0 ? Math.cosh(d * t) : d2 < 0 ? Math.cos(d * t) : 1;
  const s = d2 > 0 ? Math.sinh(d * t) / d : d2 < 0 ? Math.sin(d * t) / d : t;
  const ax = mul2(A, x0),
    factor = Math.exp(a * t);
  return [
    factor * (c * x0[0] + s * (ax[0] - a * x0[0])),
    factor * (c * x0[1] + s * (ax[1] - a * x0[1])),
  ];
}
/** Closed form for q''+cq'+25q=0, any initial position and velocity. */
export const oscillator = (c: number, q0: number, v0: number, t: number) =>
  linearExact(
    [
      [0, 1],
      [-25, -c],
    ],
    [q0, v0],
    t,
  );
export const q6 = (t: number) => Math.exp(-3 * t) * (Math.cos(4 * t) + (3 / 4) * Math.sin(4 * t));
export const q10 = (t: number) => (1 + 5 * t) * Math.exp(-5 * t);
export const q26 = (t: number) => (25 * Math.exp(-t) - Math.exp(-25 * t)) / 24;

/** Unit screen segments encode (1,f), so their tips always advance time. */
export function DirectionField({
  P,
  f,
  times,
  levels,
}: {
  P: Plane;
  f: Rate;
  times: number[];
  levels: number[];
}) {
  return (
    <>
      {times.flatMap((t) =>
        levels.map((y) => {
          const m = f(t, y),
            norm = Math.hypot(P.sx, P.sy * m),
            dx = (23 * P.sx) / norm,
            dy = (-23 * P.sy * m) / norm;
          return (
            <Arrow
              key={`${t}-${y}`}
              from={[P.x(t) - dx / 2, P.y(y) - dy / 2]}
              to={[P.x(t) + dx / 2, P.y(y) + dy / 2]}
              color={C.muted}
              width={2}
              opacity={0.65}
            />
          );
        }),
      )}
    </>
  );
}
export function SolutionTrace({
  P,
  solution,
  t0 = P.xr[0],
  t1 = P.xr[1],
  cursor,
  slope,
  color = C.cyan,
  progress = 1,
}: {
  P: Plane;
  solution: (t: number) => number;
  t0?: number;
  t1?: number;
  cursor?: number;
  slope?: (t: number) => number;
  color?: string;
  progress?: number;
}) {
  const id = useId();
  const t = clamp(cursor ?? t0, t0, t1),
    y = solution(t);
  const eps = 1e-5;
  const m = slope ? slope(t) : (solution(t + eps) - solution(t - eps)) / (2 * eps);
  const dt = 85 / Math.hypot(P.sx, P.sy * m);
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <Curve P={P} f={solution} a={t0} b={t1} color={color} progress={progress} />
        {cursor !== undefined && (
          <>
            <Arrow
              from={P.pt(t - dt / 2, y - (m * dt) / 2)}
              to={P.pt(t + dt / 2, y + (m * dt) / 2)}
              color={C.amber}
              width={4}
            />
            <Dot x={P.x(t)} y={P.y(y)} color={color} />
          </>
        )}
      </g>
    </>
  );
}
export function SignalPlot({
  P,
  curves,
  threshold,
  clock,
}: {
  P: Plane;
  curves: { solution: (t: number) => number; color: string; label?: string }[];
  threshold?: number;
  clock: string;
}) {
  return (
    <>
      <Axes
        P={P}
        xTicks={[P.xr[0], P.xr[1]]}
        yTicks={threshold === undefined ? [] : [threshold]}
        xLabel="t"
        yLabel="y"
      />
      {curves.map((c, i) => (
        <SolutionTrace key={i} P={P} solution={c.solution} color={c.color} />
      ))}
      {threshold !== undefined && (
        <Line a={P.pt(P.xr[0], threshold)} b={P.pt(P.xr[1], threshold)} color={C.magenta} dashed />
      )}
      <Cap x={P.box.x + P.box.w / 2} y={P.box.y + P.box.h + 85} size={19}>
        {clock}
      </Cap>
      {curves.map(
        (c, i) =>
          c.label && <Cap key={i} x={1250} y={195 + i * 80} tex={c.label} color={c.color} />,
      )}
    </>
  );
}
/** Progress reveals a horizontal guide, then its vertical increment, before the sloped step. */
export function EulerWalk({
  P,
  f,
  initial,
  h,
  end,
  exact,
  progress = 1,
  color = C.amber,
}: {
  P: Plane;
  f: Rate;
  initial: V2;
  h: number;
  end: number;
  exact?: (t: number) => number;
  progress?: number;
  color?: string;
}) {
  const count = Math.round((end - initial[0]) / h);
  if (!near(initial[0] + count * h, end, 1e-9))
    throw new Error('El paso debe dividir el horizonte de Euler.');
  const nodes = euler(f, ...initial, h, count),
    advances = clamp(progress, 0, 1) * count;
  return (
    <>
      {exact && <SolutionTrace P={P} solution={exact} t0={initial[0]} t1={end} color={C.cyan} />}
      {nodes.slice(0, -1).map(([t, y], i) => {
        const next = nodes[i + 1],
          local = clamp(advances - i, 0, 1);
        return (
          <g key={i}>
            <Line
              a={P.pt(t, y)}
              b={P.pt(next[0], y)}
              color={C.magenta}
              dashed
              progress={clamp(local * 2, 0, 1)}
            />
            <Line
              a={P.pt(next[0], y)}
              b={P.pt(...next)}
              color={C.green}
              dashed
              progress={clamp(local * 2 - 1, 0, 1)}
            />
            <Line a={P.pt(t, y)} b={P.pt(...next)} color={color} width={4} progress={local} />
            <Dot x={P.x(t)} y={P.y(y)} r={6} color={color} opacity={local > 0 ? 1 : 0} />
            {local === 1 && <Dot x={P.x(next[0])} y={P.y(next[1])} r={6} color={color} />}
          </g>
        );
      })}
    </>
  );
}
export function PhaseLine({
  P,
  f,
  roots,
  domain,
  probe,
}: {
  P: Plane;
  f: (y: number) => number;
  roots: number[];
  domain: V2;
  probe?: number;
}) {
  const base = P.y(0),
    bounds = [
      ...new Set([domain[0], ...roots.filter((r) => r > domain[0] && r < domain[1]), domain[1]]),
    ].sort((a, b) => a - b);
  return (
    <>
      <Line a={[P.x(domain[0]), base]} b={[P.x(domain[1]), base]} />
      {bounds.slice(0, -1).map((a, i) => {
        const b = bounds[i + 1],
          mid = (a + b) / 2,
          sign = Math.sign(f(mid));
        return (
          sign !== 0 && (
            <Arrow
              key={a}
              from={[P.x(mid) - sign * 35, base]}
              to={[P.x(mid) + sign * 35, base]}
              color={sign > 0 ? C.cyan : C.magenta}
            />
          )
        );
      })}
      {roots.map((r) => {
        const eps = (domain[1] - domain[0]) * 1e-4;
        const stable = (r <= domain[0] || f(r - eps) > 0) && (r >= domain[1] || f(r + eps) < 0);
        return (
          <g key={r}>
            <circle
              cx={P.x(r)}
              cy={base}
              r={11}
              fill={stable ? C.green : C.bg}
              stroke={C.green}
              strokeWidth={3}
            />
            <Cap x={P.x(r)} y={base + 45} tex={num(r)} />
          </g>
        );
      })}
      {probe !== undefined && (
        <>
          <Dot x={P.x(probe)} y={base - 65} color={C.amber} />
          <Cap x={1250} y={270} tex={`f(${num(probe)})=${num(f(probe))}`} />
        </>
      )}
    </>
  );
}
/** Counters are cumulative packet counts; color and slot identities change on replacement. */
export function BufferStrip({
  occupancy,
  incoming,
  outgoing,
  y = 360,
  height = 120,
  readouts = true,
  fillOpacity = 0.7,
}: {
  occupancy: number;
  incoming: number;
  outgoing: number;
  y?: number;
  height?: number;
  readouts?: boolean;
  fillOpacity?: number;
}) {
  const count = clamp(Math.round(occupancy), 0, 8),
    replaced = Math.min(Math.floor(incoming), Math.floor(outgoing));
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect
            x={175 + i * 88}
            y={y}
            width={72}
            height={height}
            rx={8}
            fill={i < count ? (i < replaced % 8 ? C.amber : C.cyan) : C.panel}
            fillOpacity={fillOpacity}
            stroke={C.muted}
            strokeWidth={2}
          />
          {i < count && (
            <Cap x={211 + i * 88} y={y + height / 2} size={19}>
              {Math.floor(replaced / 8) * 8 + i + 1 + (i < replaced % 8 ? 8 : 0)}
            </Cap>
          )}
        </g>
      ))}
      {readouts && (
        <>
          <Readout x={1250} y={240}>
            Ocupación: {count} de 8
          </Readout>
          <Readout x={1250} y={330}>
            Entradas: {fmt(incoming)}
          </Readout>
          <Readout x={1250} y={420}>
            Salidas: {fmt(outgoing)}
          </Readout>
        </>
      )}
    </>
  );
}
export function LinearPhase({
  P,
  A,
  initial,
  exact = (t: number) => linearExact(A, initial, t),
  eigenDirections = [],
  elapsed = 1,
  end = 2,
  xLabel = 'u',
  yLabel = 'v',
  color = C.cyan,
  clock = true,
  axes = true,
  field = true,
}: {
  P: Plane;
  A: M2;
  initial: V2;
  exact?: (t: number) => V2;
  eigenDirections?: V2[];
  elapsed?: number;
  end?: number;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  clock?: boolean;
  axes?: boolean;
  field?: boolean;
}) {
  const id = useId();
  const arrows = [];
  for (let i = 1; i < 9; i++)
    for (let j = 1; j < 9; j++) {
      const x = P.xr[0] + (i * (P.xr[1] - P.xr[0])) / 9,
        y = P.yr[0] + (j * (P.yr[1] - P.yr[0])) / 9;
      const [u, v] = mul2(A, [x, y]),
        norm = Math.hypot(u * P.sx, v * P.sy);
      if (norm > 1e-10)
        arrows.push(
          <Arrow
            key={`${i}-${j}`}
            from={P.pt(x, y)}
            to={[P.x(x) + (25 * u * P.sx) / norm, P.y(y) - (25 * v * P.sy) / norm]}
            color={C.muted}
            width={2}
          />,
        );
    }
  const point = exact(elapsed);
  return (
    <>
      {axes && <Axes P={P} xLabel={xLabel} yLabel={yLabel} />}
      <defs>
        <clipPath id={id}>
          <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {field && arrows}
        {eigenDirections.map((v, i) => (
          <Line
            key={i}
            a={P.pt(-10 * v[0], -10 * v[1])}
            b={P.pt(10 * v[0], 10 * v[1])}
            color={C.magenta}
            dashed
          />
        ))}
        <polyline
          points={Array.from({ length: 241 }, (_, i) =>
            P.pt(...exact((i * end) / 240)).join(','),
          ).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={4}
        />
        <Dot x={P.x(point[0])} y={P.y(point[1])} color={C.amber} />
      </g>
      {clock && (
        <Cap
          x={1250}
          y={520}
          tex={`t=${num(elapsed)};\\quad\\mathbf x\\approx${pair(point)}`}
          size={21}
        />
      )}
    </>
  );
}
export const matrixTex = (A: M2) =>
  `\\begin{pmatrix}${num(A[0][0])}&${num(A[0][1])}\\\\${num(A[1][0])}&${num(A[1][1])}\\end{pmatrix}`;
export function TraceDetBoard({
  A,
  tau = trace2(A),
  det = det2(A),
  discriminant = tau ** 2 - 4 * det,
  elapsed = 1,
  initial = [1, 0.5],
  color = C.cyan,
}: {
  A: M2;
  tau?: number;
  det?: number;
  discriminant?: number;
  elapsed?: number;
  initial?: V2;
  color?: string;
}) {
  const P = plane([-6, 6], [-4, 10], { x: 180, y: 210, w: 320, h: 440 });
  // Equal units on both axes preserve the circles of the calibration centre.
  const phase = plane([-3, 3], [-4.125, 4.125], { x: 580, y: 210, w: 320, h: 440 });
  return (
    <>
      <Axes P={P} xTicks={[-4, 0, 4]} yTicks={[-2, 4, 8]} xLabel="\tau" yLabel="D" />
      <SolutionTrace P={P} solution={(t) => (t * t) / 4} color={C.magenta} />
      <Dot x={P.x(tau)} y={P.y(det)} color={ACCENT} />
      <LinearPhase P={phase} A={A} initial={initial} elapsed={elapsed} color={color} />
      <Cap x={340} y={745} size={19}>
        Traza–determinante
      </Cap>
      <Cap x={740} y={745} size={19}>
        Retrato de fase
      </Cap>
      <Cap x={1250} y={200} tex={`A=${matrixTex(A)}`} />
      <Cap x={1250} y={300} tex={`\\tau=${num(tau)},\\quad D=${num(det)}`} />
      <Cap x={1250} y={400} tex={`\\Delta=\\tau^2-4D=${num(discriminant)}`} color={C.magenta} />
      <Readout x={1250} y={650} size={19}>
        {det < 0
          ? 'Silla'
          : discriminant < 0
            ? tau === 0
              ? 'Centro'
              : tau < 0
                ? 'Espiral entrante'
                : 'Espiral saliente'
            : det === 0
              ? 'Revisar el sistema: D = 0'
              : tau < 0
                ? 'Nodo entrante'
                : 'Nodo saliente'}
      </Readout>
    </>
  );
}
/** q and v are initial conditions; elapsed is the separate instrument clock. */
export function DampedInstrument({
  q,
  v,
  c,
  elapsed,
  readouts = true,
}: {
  q: number;
  v: number;
  c: number;
  elapsed: number;
  readouts?: boolean;
}) {
  const state = oscillator(c, q, v, elapsed),
    scale = Math.max(1, Math.abs(q), Math.abs(v) / 5);
  const time = plane([0, 2], [-scale, scale * 1.2], { x: 180, y: 420, w: 320, h: 270 });
  const phase = plane([-scale * 1.2, scale * 1.2], [-scale * 6, scale * 6], {
    x: 600,
    y: 420,
    w: 300,
    h: 270,
  });
  return (
    <>
      <path d="M210 320 A210 210 0 0 1 630 320" fill="none" stroke={C.dim} strokeWidth={14} />
      <Line
        a={[420, 320]}
        b={[
          420 + 195 * Math.sin((state[0] * 0.7) / scale),
          320 - 195 * Math.cos((state[0] * 0.7) / scale),
        ]}
        color={ACCENT}
        width={7}
      />
      <path
        d="M660 210 L660 310 M640 245 L680 245 L680 285 L640 285 Z"
        fill={C.panel}
        stroke={C.muted}
        strokeWidth={4}
      />
      <Cap x={420} y={365} size={18}>
        Cero: posición de reposo
      </Cap>
      <circle cx={800} cy={225} r={90} fill={C.panel} stroke={C.magenta} strokeWidth={4} />
      <Line
        a={[800, 225]}
        b={[
          800 + 75 * Math.sin(state[1] / (6 * scale)),
          225 - 75 * Math.cos(state[1] / (6 * scale)),
        ]}
        color={C.magenta}
        width={5}
      />
      <Cap x={800} y={365} size={18}>
        Velocidad v
      </Cap>
      <Axes P={time} xLabel="t" yLabel="q" />
      <SolutionTrace
        P={time}
        solution={(t) => oscillator(c, q, v, t)[0]}
        cursor={elapsed}
        slope={(t) => oscillator(c, q, v, t)[1]}
      />
      <LinearPhase
        P={phase}
        A={[
          [0, 1],
          [-25, -c],
        ]}
        initial={[q, v]}
        elapsed={elapsed}
        xLabel="q"
        yLabel="v"
        clock={false}
      />
      {readouts && (
        <>
          <Cap x={1250} y={210} tex={`c=${num(c)},\\quad t=${num(elapsed)}\\,\\mathrm s`} />
          <Cap x={1250} y={300} tex={`q=${num(state[0], 6)}`} color={ACCENT} />
          <Cap x={1250} y={390} tex={`v=${num(state[1], 6)}`} color={C.magenta} />
        </>
      )}
      <Cap x={750} y={760} size={18}>
        Retrato (q, v)
      </Cap>
    </>
  );
}
export function LogisticMap({
  r,
  seeds,
  n,
  P,
  seriesP,
  readouts = true,
  progress = 1,
}: {
  r: number;
  seeds: number[];
  n: number;
  P: Plane;
  seriesP?: Plane;
  readouts?: boolean;
  progress?: number;
}) {
  const colors = [C.cyan, C.amber, C.magenta];
  const series = seeds.map((seed) => {
    const values = [seed];
    for (let i = 0; i < n; i++) values.push(logisticStep(r, values[i]));
    return values;
  });
  const S = seriesP ?? plane([0, Math.max(1, n)], [0, 1], { x: 1050, y: 440, w: 380, h: 250 });
  return (
    <>
      <Axes P={P} xTicks={[0, 1]} yTicks={[1]} xLabel="x_n" yLabel="x_{n+1}" />
      <SolutionTrace P={P} solution={(x) => logisticStep(r, x)} />
      <Line a={P.pt(0, 0)} b={P.pt(1, 1)} color={C.dim} dashed />
      {series.map((values, j) => {
        const points: V2[] = [[values[0], 0]];
        for (let i = 0; i < n; i++)
          points.push([values[i], values[i + 1]], [values[i + 1], values[i + 1]]);
        const advance = clamp(progress, 0, 1) * (points.length - 1);
        const whole = Math.floor(advance);
        const visible = points.slice(0, whole + 1);
        if (whole < points.length - 1) {
          const from = points[whole],
            to = points[whole + 1],
            fraction = advance - whole;
          visible.push([
            from[0] + fraction * (to[0] - from[0]),
            from[1] + fraction * (to[1] - from[1]),
          ]);
        }
        return (
          <polyline
            key={j}
            points={visible.map((p) => P.pt(...p).join(',')).join(' ')}
            fill="none"
            stroke={colors[j % colors.length]}
            strokeWidth={2}
          />
        );
      })}
      {readouts && (
        <>
          <Cap x={1250} y={195} tex={`r=${num(r)},\\quad n=${n}`} />
          <Readout x={1250} y={285} size={18}>
            r: parámetro del mapa discreto
          </Readout>
        </>
      )}
      <Axes P={S} xLabel="n" yLabel="x" />
      {series.map((values, j) => (
        <polyline
          key={j}
          points={values.map((x, i) => S.pt(i, x).join(',')).join(' ')}
          fill="none"
          stroke={colors[j % colors.length]}
          strokeWidth={3}
        />
      ))}
    </>
  );
}
