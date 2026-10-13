import { C } from '../../engine/palette';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

// ============================================================================
// Mundo 11 · El Laboratorio · kit de inferencia variacional (logaritmos en base 2).
// ============================================================================

/** decimal with comma for text («0,32») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}32») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
/** TeX fraction */
export const frac = (n: number, d: number) => `\\tfrac{${n}}{${d}}`;

/** KL(q ‖ p) in bits; 0·log 0 = 0 and +∞ when q > 0 where p = 0 */
export function kl2(q: number[], p: number[]) {
  let s = 0;
  for (let i = 0; i < q.length; i++) {
    if (q[i] === 0) continue;
    if (p[i] === 0) return Infinity;
    s += q[i] * Math.log2(q[i] / p[i]);
  }
  return s;
}
export const normalize = (ws: number[]) => {
  const t = ws.reduce((a, b) => a + b, 0);
  return ws.map((w) => w / t);
};

/** bars of a discrete distribution with value labels under each bar */
export function Dist({
  labels,
  probs,
  color = C.amber,
  x = 200,
  base = 600,
  w = 620,
  h = 360,
  max = 1,
}: {
  labels: string[];
  probs: number[];
  color?: string;
  x?: number;
  base?: number;
  w?: number;
  h?: number;
  max?: number;
}) {
  const bw = w / probs.length;
  return (
    <g>
      <line x1={x - 10} x2={x + w + 10} y1={base} y2={base} stroke={C.line} strokeWidth={2} />
      {probs.map((p, i) => {
        const hh = (p / max) * h;
        return (
          <g key={i}>
            <rect
              x={x + i * bw + 12}
              y={base - Math.max(hh, 2)}
              width={bw - 24}
              height={Math.max(hh, 2)}
              rx={8}
              fill={color}
              fillOpacity={0.75}
            />
            <Cap x={x + i * bw + bw / 2} y={base - Math.max(hh, 2) - 26} size={20} color={C.text}>
              {fmt(p, 2)}
            </Cap>
            <Cap x={x + i * bw + bw / 2} y={base + 30} size={20} color={C.muted}>
              {labels[i]}
            </Cap>
          </g>
        );
      })}
    </g>
  );
}
