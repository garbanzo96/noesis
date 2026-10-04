// Interpolation helpers shared by every scene.
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const invLerp = (a: number, b: number, x: number) => (b === a ? 0 : (x - a) / (b - a));
export const remap = (x: number, a0: number, a1: number, b0: number, b1: number) =>
  lerp(b0, b1, invLerp(a0, a1, x));

export const lerpPt = (a: [number, number], b: [number, number], t: number): [number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Interpolate two hex colors in RGB space (sufficient for short transitions). */
export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  // Manim blends colors in squared space (gamma 2), which avoids muddy midpoints.
  const c = (x: number, y: number) => Math.round(Math.sqrt(lerp(x * x, y * y, clamp(t, 0, 1))));
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}

/** Number formatting without "-0" and with a fixed maximum of decimals. */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '−∞' : '—';
  const v = Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n;
  const s = v.toFixed(digits);
  const trimmed = digits > 0 ? s.replace(/\.?0+$/, '') : s;
  return trimmed.replace('-', '−');
}

/** Format for TeX: uses a proper minus sign and trims zeros. */
export const tfmt = (n: number, digits = 2) => fmt(n, digits).replace('−', '-');

/** Sample a function on [a,b] into an SVG path in pixel space via a mapping. */
export function samplePath(
  f: (x: number) => number,
  a: number,
  b: number,
  map: (x: number, y: number) => [number, number],
  n = 200,
  yClip: [number, number] = [-1e6, 1e6],
): string {
  let d = '';
  let pen = false;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const y = f(x);
    if (!Number.isFinite(y) || y < yClip[0] || y > yClip[1]) {
      pen = false;
      continue;
    }
    const [px, py] = map(x, y);
    d += `${pen ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`;
    pen = true;
  }
  return d;
}

/** Partial path reveal à la ShowCreation: returns dash props for an SVG path of known length. */
export const reveal = (length: number, t: number) => ({
  strokeDasharray: `${length} ${length}`,
  strokeDashoffset: length * (1 - clamp(t, 0, 1)),
});
