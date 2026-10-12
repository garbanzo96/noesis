import { useMemo } from 'react';
import { C } from '../../engine/palette';
import { Group, type Plane } from '../../engine/Stage';
import { Arrow } from '../../engine/shapes';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

export type V2 = [number, number];
export type Field = (x: number, y: number) => number;
export type Projection = ((x: number, y: number, z: number) => V2) & { xr: V2; yr: V2 };
export const fmt = (v: number, digits = 2) => dec(v, digits);
export const num = (v: number, digits = 2) => fmt(v, digits).replace('−', '-').replace(',', '{,}');
export const pair = (v: V2) => `(${num(v[0])};\\,${num(v[1])})`;
export const F: Field = (x, y) => x * x + 3 * x * y - y * y;
export const H: Field = (x, y) => 200 - 2 * x * x - y * y;
export const hill: Field = (x, y) => 9 - x * x - y * y;
export const terrain: Field = (x, y) => 160 - 4 * x * x - 3 * y * y;
export const partial = (f: Field, x: number, y: number, axis: 'x' | 'y') => {
  const h = 1e-4 * Math.max(1, Math.abs(axis === 'x' ? x : y));
  return axis === 'x'
    ? (f(x + h, y) - f(x - h, y)) / (2 * h)
    : (f(x, y + h) - f(x, y - h)) / (2 * h);
};
export const grad = (f: Field, x: number, y: number): V2 => [
  partial(f, x, y, 'x'),
  partial(f, x, y, 'y'),
];
/** u must be a unit vector, as in the definition of a directional derivative. */
export const dirDeriv = (f: Field, x: number, y: number, u: V2) => {
  const g = grad(f, x, y);
  return g[0] * u[0] + g[1] * u[1];
};
export const hessD = (f: Field, x: number, y: number) => {
  const h = 1e-3;
  const xx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / h ** 2;
  const yy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / h ** 2;
  const xy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h ** 2);
  return xx * yy - xy ** 2;
};
export function dbl(f: Field, a: number, b: number, c: number, d: number, n = 80) {
  const count = Math.max(1, Math.floor(n));
  const dx = (b - a) / count;
  const dy = (d - c) / count;
  let sum = 0;
  for (let i = 0; i < count; i++)
    for (let j = 0; j < count; j++) sum += f(a + (i + 0.5) * dx, c + (j + 0.5) * dy);
  return sum * dx * dy;
}

/** Orthographic camera. Angles in radians; zScale converts heights to horizontal units. */
export function ortho({
  cx = 690,
  cy = 440,
  scale = 62,
  zScale = 0.35,
  azimuth = -0.7,
  elevation = 0.55,
  xr = [-3, 3],
  yr = [-3, 3],
}: {
  cx?: number;
  cy?: number;
  scale?: number;
  zScale?: number;
  azimuth?: number;
  elevation?: number;
  xr?: V2;
  yr?: V2;
} = {}): Projection {
  const ca = Math.cos(azimuth),
    sa = Math.sin(azimuth),
    ce = Math.cos(elevation),
    se = Math.sin(elevation);
  const project = (x: number, y: number, z: number): V2 => [
    cx + scale * (ca * x - sa * y),
    cy - scale * (se * (sa * x + ca * y) + ce * z * zScale),
  ];
  return Object.assign(project, { xr, yr });
}

export function Surface({
  f,
  P3,
  n = 24,
  color = C.cyan,
  opacity = 0.65,
}: {
  f: Field;
  P3: Projection;
  n?: number;
  color?: string;
  opacity?: number;
}) {
  const count = Math.max(2, Math.floor(n));
  const paths: string[] = [];
  for (let axis = 0; axis < 2; axis++)
    for (let i = 0; i <= count; i++) {
      const points: string[] = [];
      for (let j = 0; j <= count; j++) {
        const x = P3.xr[0] + ((P3.xr[1] - P3.xr[0]) * (axis ? j : i)) / count;
        const y = P3.yr[0] + ((P3.yr[1] - P3.yr[0]) * (axis ? i : j)) / count;
        const p = P3(x, y, f(x, y));
        if (p.every(Number.isFinite)) points.push(`${points.length ? 'L' : 'M'}${p[0]} ${p[1]}`);
      }
      paths.push(points.join(' '));
    }
  return (
    <g opacity={opacity} fill="none" stroke={color} strokeWidth={1.5}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** 80 × 80 marching squares. Ambiguous saddle cells use the centre value. */
export function ContourMap({
  P,
  f,
  levels,
  colors = [C.cyan, C.amber, C.magenta, C.green, C.violet],
}: {
  P: Plane;
  f: Field;
  levels: number[];
  colors?: string[];
}) {
  const contours = useMemo(() => {
    const n = 80,
      dx = (P.xr[1] - P.xr[0]) / n,
      dy = (P.yr[1] - P.yr[0]) / n;
    const values = Array.from({ length: n + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => f(P.xr[0] + i * dx, P.yr[0] + j * dy)),
    );
    return levels.map((level) => {
      const segments: [V2, V2][] = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const x = P.xr[0] + i * dx,
            y = P.yr[0] + j * dy;
          const corners: V2[] = [
            [x, y],
            [x + dx, y],
            [x + dx, y + dy],
            [x, y + dy],
          ];
          const vs = [values[i][j], values[i + 1][j], values[i + 1][j + 1], values[i][j + 1]];
          const hits: { edge: number; p: V2 }[] = [];
          for (let k = 0; k < 4; k++) {
            const l = (k + 1) % 4;
            if (
              !Number.isFinite(vs[k]) ||
              !Number.isFinite(vs[l]) ||
              vs[k] >= level === vs[l] >= level
            )
              continue;
            const t = (level - vs[k]) / (vs[l] - vs[k]);
            hits.push({
              edge: k,
              p: P.pt(
                corners[k][0] + t * (corners[l][0] - corners[k][0]),
                corners[k][1] + t * (corners[l][1] - corners[k][1]),
              ),
            });
          }
          if (hits.length === 2) segments.push([hits[0].p, hits[1].p]);
          if (hits.length === 4) {
            const centerHigh = f(x + dx / 2, y + dy / 2) >= level;
            if (centerHigh === vs[0] >= level)
              segments.push([hits[0].p, hits[1].p], [hits[2].p, hits[3].p]);
            else segments.push([hits[0].p, hits[3].p], [hits[1].p, hits[2].p]);
          }
        }
      // One label on each visible level, near the upper-right part of its geometry.
      const label = segments.length
        ? segments.reduce(
            (best, s) => (s[0][0] - s[0][1] > best[0] - best[1] ? s[0] : best),
            segments[0][0],
          )
        : null;
      return {
        level,
        label,
        d: segments.map(([a, b]) => `M${a.join(' ')}L${b.join(' ')}`).join(' '),
      };
    });
  }, [P, f, levels]);
  return (
    <>
      {contours.map(({ level, label, d }, i) => (
        <Group key={level}>
          <path d={d} fill="none" stroke={colors[i % colors.length]} strokeWidth={2.5} />
          {label && (
            <Cap
              x={label[0] + 10}
              y={label[1] - 10}
              size={17}
              color={colors[i % colors.length]}
              tex={num(level)}
            />
          )}
        </Group>
      ))}
    </>
  );
}

export function GradField({
  P,
  grad: gradient,
  step = 1,
  color = C.amber,
}: {
  P: Plane;
  grad: (x: number, y: number) => V2;
  step?: number;
  color?: string;
}) {
  const arrows = [];
  const spacing = Math.max(0.1, step);
  for (let x = P.xr[0] + spacing / 2; x < P.xr[1]; x += spacing)
    for (let y = P.yr[0] + spacing / 2; y < P.yr[1]; y += spacing) {
      const [gx, gy] = gradient(x, y),
        length = Math.hypot(gx, gy);
      if (!Number.isFinite(length) || length < 1e-8) continue;
      const k = (spacing * Math.min(0.7, 0.18 + length / 60)) / length;
      const tip: V2 = [x + k * gx, y + k * gy];
      if (tip[0] < P.xr[0] || tip[0] > P.xr[1] || tip[1] < P.yr[0] || tip[1] > P.yr[1]) continue;
      arrows.push(
        <Arrow
          key={`${x}-${y}`}
          from={P.pt(x, y)}
          to={P.pt(...tip)}
          color={color}
          width={2}
          opacity={0.65}
        />,
      );
    }
  return <>{arrows}</>;
}

/** Quadratic used by the generated practice: exact analytic partials. */
export function polynomial(a: number, b: number, c: number, d = 0) {
  const term = (k: number, s: string, first = false) =>
    `${k < 0 ? '-' : first ? '' : '+'}${Math.abs(k) === 1 && s ? '' : Math.abs(k)}${s}`;
  return {
    f: (x: number, y: number) => a * x * x + b * x * y + c * y * y + d,
    gradient: (x: number, y: number): V2 => [2 * a * x + b * y, b * x + 2 * c * y],
    tex: `${term(a, 'x^2', true)}${term(b, 'xy')}${term(c, 'y^2')}${d ? term(d, '') : ''}`,
  };
}
