import { dec } from '../shared/ui';

// ============================================================================
// Mundo 14 · Torre Halcón · kit de la síntesis final.
// ============================================================================

/** decimal with comma for text («0,98») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}98») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
/** KL(p ‖ q) in bits */
export const kl2 = (p: number[], q: number[]) =>
  p.reduce((a, pi, i) => (pi === 0 ? a : q[i] === 0 ? Infinity : a + pi * Math.log2(pi / q[i])), 0);
