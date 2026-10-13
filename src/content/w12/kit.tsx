import { C } from '../../engine/palette';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

// ============================================================================
// Mundo 12 · La Fábrica · kit de modelos generativos.
// ============================================================================

/** decimal with comma for text («0,30») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}30») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
/** variance dividing by n (maximum likelihood) */
export const varMle = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
};
export const normalPdf = (x: number, mu = 0, sd = 1) =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
/** Benford probability of a first digit d = 1…9 */
export const benford = (d: number) => Math.log10(1 + 1 / d);
export const chi2 = (obs: number[], exp: number[]) =>
  obs.reduce((a, o, i) => a + (o - exp[i]) ** 2 / exp[i], 0);

/** bars with a value above and a label below each one */
export function Bars({
  labels,
  values,
  color = C.amber,
  x = 200,
  base = 600,
  w = 640,
  h = 360,
  max = 1,
  digits = 2,
}: {
  labels: string[];
  values: number[];
  color?: string;
  x?: number;
  base?: number;
  w?: number;
  h?: number;
  max?: number;
  digits?: number;
}) {
  const bw = w / values.length;
  return (
    <g>
      <line x1={x - 10} x2={x + w + 10} y1={base} y2={base} stroke={C.line} strokeWidth={2} />
      {values.map((v, i) => {
        const hh = (v / max) * h;
        return (
          <g key={i}>
            <rect
              x={x + i * bw + bw * 0.15}
              y={base - Math.max(hh, 2)}
              width={bw * 0.7}
              height={Math.max(hh, 2)}
              rx={6}
              fill={color}
              fillOpacity={0.75}
            />
            <Cap x={x + i * bw + bw / 2} y={base - Math.max(hh, 2) - 24} size={18} color={C.text}>
              {fmt(v, digits)}
            </Cap>
            <Cap x={x + i * bw + bw / 2} y={base + 28} size={19} color={C.muted}>
              {labels[i]}
            </Cap>
          </g>
        );
      })}
    </g>
  );
}
