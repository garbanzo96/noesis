import { C } from '../../engine/palette';
import { dec } from '../shared/ui';

// ============================================================================
// Mundo 10 · La Clínica · kit de inferencia bayesiana.
// ============================================================================

/** decimal with comma for text («0,27») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}27») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
/** TeX fraction */
export const frac = (n: number, d: number) => `\\tfrac{${n}}{${d}}`;

/** positive predictive value: P(enfermo | +) */
export const ppv = (prev: number, sens: number, spec: number) =>
  (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
export const oddsOf = (p: number) => p / (1 - p);
export const probOf = (odds: number) => odds / (1 + odds);
export const betaMean = (a: number, b: number) => a / (a + b);
export const betaMode = (a: number, b: number) => (a - 1) / (a + b - 2);

/** ln Γ(z), Lanczos approximation (z > 0) */
function lgamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
/** density of Beta(a, b) at x ∈ (0, 1) */
export function betaPdf(x: number, a: number, b: number) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp(
    (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + lgamma(a + b) - lgamma(a) - lgamma(b),
  );
}

export interface PeopleGroup {
  n: number;
  color: string;
  /** faded group (still counted, out of focus) */
  dim?: boolean;
}
/**
 * A crowd of small person icons laid out row by row, group after group, so a proportion is
 * read as an area. 1000 people fit in 40 × 25.
 */
export function People({
  groups,
  x = 170,
  y = 170,
  cols = 40,
  gap = 20,
}: {
  groups: PeopleGroup[];
  x?: number;
  y?: number;
  cols?: number;
  gap?: number;
}) {
  const cells: { color: string; dim?: boolean }[] = groups.flatMap((g) =>
    Array.from({ length: g.n }, () => ({ color: g.color, dim: g.dim })),
  );
  return (
    <g>
      {cells.map((c, i) => {
        const cx = x + (i % cols) * gap + gap / 2,
          cy = y + Math.floor(i / cols) * gap + gap / 2;
        return (
          <g key={i} opacity={c.dim ? 0.18 : 0.95}>
            <circle cx={cx} cy={cy - 4.5} r={4.2} fill={c.color} />
            <rect x={cx - 5.5} y={cy} width={11} height={9} rx={3.5} fill={c.color} />
          </g>
        );
      })}
    </g>
  );
}

export const TONES = { sick: C.magenta, healthy: C.cyan, positive: C.amber };
