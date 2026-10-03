export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
export const entropy = (p: number) =>
  p <= 0 || p >= 1 ? 0 : -p * Math.log(p) - (1 - p) * Math.log(1 - p);
export const kl = (p: number, q: number) =>
  (p === 0 ? 0 : p * Math.log(p / q)) + (p === 1 ? 0 : (1 - p) * Math.log((1 - p) / (1 - q)));
export const gaussian = (x: number, m: number, s: number) =>
  Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
export const gaussianKL = (m: number, s: number, targetM = 0.6, targetS = 0.7) =>
  Math.max(0, Math.log(targetS / s) + (s * s + (m - targetM) ** 2) / (2 * targetS ** 2) - 0.5);
export const bayes = (prior: number, sensitivity: number, falsePositive: number) =>
  (prior * sensitivity) / (prior * sensitivity + (1 - prior) * falsePositive);
export const softmax = (logits: number[]) => {
  const max = Math.max(...logits),
    exps = logits.map((x) => Math.exp(x - max)),
    sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
};
export function parseNumber(s: string) {
  const x = s.trim().replaceAll(',', '.').replaceAll('−', '-').replaceAll(' ', '');
  if (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(x)) return Number(x);
  const m = x.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+))\/([-+]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  return m && +m[2] !== 0 ? +m[1] / +m[2] : NaN;
}
export const format = (n: number, d = 3) => (Math.abs(n) < 1e-10 ? 0 : n).toFixed(d);
export function seedRandom(seed: number) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
}
export const joint = [0.1, 0.4, 0.2, 0.3];
