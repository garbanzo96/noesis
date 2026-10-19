import { useId } from 'react';
import { C } from '../../engine/palette';
import { type Plane } from '../../engine/Stage';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

// Shared pieces of Estadística: summary statistics, the normal curve, histograms,
// dot plots and shaded tails. Everything deterministic so the lessons replay identically.

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => sum(xs) / xs.length;
export const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
export const median = (xs: number[]) => {
  const s = sorted(xs);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
export const variance = (xs: number[], sample = false) => {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - (sample ? 1 : 0));
};
export const sd = (xs: number[], sample = false) => Math.sqrt(variance(xs, sample));
export const pdf = (x: number, mu = 0, s = 1) =>
  Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
/** Standard normal CDF (Abramowitz–Stegun 7.1.26, error < 1.5e-7). */
export function Phi(z: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
/** Counts per bin [lo + k·w, lo + (k+1)·w), k = 0..bins−1. */
export const counts = (xs: number[], lo: number, w: number, bins: number) => {
  const c = Array.from({ length: bins }, () => 0);
  for (const x of xs) {
    const k = Math.floor((x - lo) / w);
    if (k >= 0 && k < bins) c[k] += 1;
  }
  return c;
};
/** Number for TeX with a decimal comma. */
export const num = (x: number, d = 2) => {
  const r = Math.round(x);
  if (Math.abs(x - r) < 1e-9) return String(r);
  return dec(x, d).replace('−', '-').replace(',', '{,}');
};
/** Normal sample by Box–Muller from a uniform generator. */
export const gauss = (r: () => number, mu = 0, s = 1) =>
  mu + s * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/** Histogram bars on a plane. */
export function Bars({
  P,
  lo,
  w,
  cs,
  color = C.amber,
  opacity = 0.55,
  labels = false,
  hi,
}: {
  P: Plane;
  lo: number;
  w: number;
  cs: number[];
  color?: string;
  opacity?: number;
  labels?: boolean;
  hi?: number;
}) {
  return (
    <g>
      {cs.map((c, k) => {
        const x0 = P.x(lo + k * w);
        const x1 = P.x(lo + (k + 1) * w);
        const top = P.y(c);
        const on = hi === k;
        return (
          <g key={k}>
            <rect
              x={x0}
              y={top}
              width={x1 - x0}
              height={P.y(0) - top}
              fill={on ? C.green : color}
              opacity={on ? 0.75 : opacity}
              stroke={on ? C.green : color}
              strokeWidth={1.5}
            />
            {labels && c > 0 && (
              <Cap
                x={(x0 + x1) / 2}
                y={top - 18}
                size={16}
                color={on ? C.green : C.text}
                tex={String(c)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Dot plot: each value a dot, equal values stacked upwards. `X` maps values to pixels. */
export function DotPlot({
  X,
  y,
  xs,
  r = 11,
  color = C.cyan,
  mark,
  round = 1,
}: {
  X: (v: number) => number;
  y: number;
  xs: number[];
  r?: number;
  color?: string;
  mark?: (v: number, i: number) => string | undefined;
  round?: number;
}) {
  const seen = new Map<number, number>();
  return (
    <g>
      {xs.map((v, i) => {
        const key = Math.round(v / round) * round;
        const k = seen.get(key) ?? 0;
        seen.set(key, k + 1);
        return (
          <circle
            key={i}
            cx={X(v)}
            cy={y - r - 2 - k * (2 * r + 3)}
            r={r}
            fill={mark?.(v, i) ?? color}
            opacity={0.9}
          />
        );
      })}
    </g>
  );
}

/** Shaded region under y = f(x) on [a, b], clipped to the plane. */
export function Shade({
  P,
  f,
  a,
  b,
  color = C.violet,
  opacity = 0.4,
}: {
  P: Plane;
  f: (x: number) => number;
  a: number;
  b: number;
  color?: string;
  opacity?: number;
}) {
  const id = 'h' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const lo = Math.max(a, P.xr[0]);
  const hi = Math.min(b, P.xr[1]);
  if (hi <= lo || opacity <= 0) return null;
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    pts.push(`${P.x(x)},${P.y(Math.min(f(x), P.yr[1]))}`);
  }
  const d = `M${P.x(lo)},${P.y(0)} L${pts.join(' L')} L${P.x(hi)},${P.y(0)} Z`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} />
        </clipPath>
      </defs>
      <path d={d} fill={color} opacity={opacity} clipPath={`url(#${id})`} />
    </g>
  );
}

/** Seesaw: a ruler from lo to hi with a fulcrum at `at` (math), drawn under a number line. */
export function Fulcrum({
  X,
  y,
  at,
  color = C.green,
}: {
  X: (v: number) => number;
  y: number;
  at: number;
  color?: string;
}) {
  const x = X(at);
  return (
    <polygon
      points={`${x},${y + 4} ${x - 18},${y + 34} ${x + 18},${y + 34}`}
      fill={color}
      opacity={0.9}
    />
  );
}
