import { dec } from '../shared/ui';

// ============================================================================
// Mundo 13 · La Bolsa · kit de decisión secuencial.
// ============================================================================

/** decimal with comma for text («0,20») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}20») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
/** expected value of an action: Σ P(s)·u(s) */
export const ev = (probs: number[], pays: number[]) =>
  probs.reduce((a, p, i) => a + p * pays[i], 0);
/** present value of a reward r received after t periods with discount γ */
export const discount = (r: number, g: number, t: number) => r * g ** t;
/** Kelly fraction for win probability p and net odds b */
export const kellyFrac = (p: number, b = 1) => p - (1 - p) / b;
/** expected log-growth per bet when staking a fraction f */
export const growth = (p: number, b: number, f: number) =>
  p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f);
/** success probability of the stopping rule that skips the first r − 1 of n */
export const stopSuccess = (n: number, r: number) => {
  if (r <= 1) return 1 / n;
  let s = 0;
  for (let i = r; i <= n; i++) s += 1 / (i - 1);
  return ((r - 1) / n) * s;
};
