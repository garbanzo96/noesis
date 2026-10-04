// Rate functions ported from ManimGL (manimlib/utils/rate_functions.py, MIT).
// They map normalized time t∈[0,1] to animation progress. Same names, same curves,
// so scenes can be described with Manim's vocabulary.

export type Rate = (t: number) => number;

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const linear: Rate = (t) => clamp01(t);

/** Zero first and second derivatives at both ends (bezier [0,0,0,1,1,1] = smootherstep). */
export const smooth: Rate = (t) => {
  t = clamp01(t);
  const s = 1 - t;
  return t * t * t * (10 * s * s + 5 * s * t + t * t);
};

export const rushInto: Rate = (t) => 2 * smooth(0.5 * clamp01(t));
export const rushFrom: Rate = (t) => 2 * smooth(0.5 * (clamp01(t) + 1)) - 1;
export const slowInto: Rate = (t) => Math.sqrt(1 - (1 - clamp01(t)) ** 2);
export const doubleSmooth: Rate = (t) =>
  t < 0.5 ? 0.5 * smooth(2 * t) : 0.5 * (1 + smooth(2 * t - 1));

export const thereAndBack: Rate = (t) => {
  t = clamp01(t);
  return smooth(t < 0.5 ? 2 * t : 2 * (1 - t));
};

export const thereAndBackWithPause =
  (pause = 1 / 3): Rate =>
  (t) => {
    t = clamp01(t);
    const a = 1 - pause;
    if (t < 0.5 * a) return smooth(t / (0.5 * a));
    if (t < 0.5 * (1 + pause)) return 1;
    return smooth((1 - t) / (0.5 * a));
  };

/** Evaluate a 1-D Bézier curve with the given control values at t. */
export function bezier(points: number[]): Rate {
  const n = points.length - 1;
  const binom: number[] = [];
  for (let k = 0, c = 1; k <= n; k++) {
    binom.push(c);
    c = (c * (n - k)) / (k + 1);
  }
  return (t) => {
    t = clamp01(t);
    let sum = 0;
    for (let k = 0; k <= n; k++) sum += binom[k] * (1 - t) ** (n - k) * t ** k * points[k];
    return sum;
  };
}

export const runningStart = (pull = -0.5): Rate => bezier([0, 0, pull, pull, 1, 1, 1]);
export const overshoot = (pull = 1.5): Rate => bezier([0, 0, pull, pull, 1, 1]);

export const wiggle =
  (wiggles = 2): Rate =>
  (t) =>
    thereAndBack(t) * Math.sin(wiggles * Math.PI * clamp01(t));

/** Restrict a rate function to the window [a,b] of the outer time. */
export const squish =
  (rate: Rate, a: number, b: number): Rate =>
  (t) => {
    if (a === b) return t < a ? rate(0) : rate(1);
    return rate(clamp01((t - a) / (b - a)));
  };

export const lingering: Rate = squish(linear, 0, 0.8);
export const exponentialDecay =
  (halfLife = 0.1): Rate =>
  (t) =>
    1 - Math.exp(-clamp01(t) / halfLife);

/** Stagger helper (LaggedStart): progress of item i of n under total progress t. */
export function lagged(t: number, i: number, n: number, lag = 0.3, rate: Rate = smooth): number {
  if (n <= 1) return rate(t);
  const span = 1 / (1 + lag * (n - 1));
  const start = i * lag * span;
  return rate(clamp01((t - start) / span));
}
