import { C } from '../../engine/palette';
import { Html, type Plane } from '../../engine/Stage';

// Shared pieces of Cálculo integral: shaded areas (signed), Riemann rectangles and a tank.

/** Shade the region between y=f(x) and the x axis on [a,b]; above the axis and below get different colours. */
export function AreaUnder({ P, f, a, b, pos = C.violet, neg = C.red, opacity = 0.35, steps = 160 }: { P: Plane; f: (x: number) => number; a: number; b: number; pos?: string; neg?: string; opacity?: number; steps?: number }) {
  if (b <= a || opacity <= 0) return null;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    pts.push([x, f(x)]);
  }
  const y0 = Math.max(P.yr[0], Math.min(P.yr[1], 0));
  const clampY = (v: number) => Math.max(P.yr[0], Math.min(P.yr[1], v));
  const up = `M${P.x(a)} ${P.y(y0)} ` + pts.map(([x, y]) => `L${P.x(x)} ${P.y(clampY(Math.max(0, y)))}`).join(' ') + ` L${P.x(b)} ${P.y(y0)} Z`;
  const down = `M${P.x(a)} ${P.y(y0)} ` + pts.map(([x, y]) => `L${P.x(x)} ${P.y(clampY(Math.min(0, y)))}`).join(' ') + ` L${P.x(b)} ${P.y(y0)} Z`;
  return (
    <g>
      <path d={up} fill={pos} opacity={opacity} />
      <path d={down} fill={neg} opacity={opacity} />
    </g>
  );
}

export type Rule = 'left' | 'right' | 'mid';
export const sampleAt = (rule: Rule, x0: number, dx: number) => (rule === 'left' ? x0 : rule === 'right' ? x0 + dx : x0 + dx / 2);

/** Riemann sum value. */
export function riemann(f: (x: number) => number, a: number, b: number, n: number, rule: Rule) {
  const dx = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(sampleAt(rule, a + i * dx, dx)) * dx;
  return s;
}

/** Numeric integral (Simpson, enough for drawing and checking). */
export function integrate(f: (x: number) => number, a: number, b: number, n = 400) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Rectangles of a Riemann sum; the sample point of each is marked. */
export function RiemannBars({ P, f, a, b, n, rule = 'left', color = C.amber, opacity = 0.45, marks = true }: { P: Plane; f: (x: number) => number; a: number; b: number; n: number; rule?: Rule; color?: string; opacity?: number; marks?: boolean }) {
  const dx = (b - a) / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x0 = a + i * dx;
        const xs = sampleAt(rule, x0, dx);
        const h = f(xs);
        const top = P.y(Math.max(0, h));
        const bot = P.y(Math.min(0, h));
        return (
          <g key={i}>
            <rect x={P.x(x0)} y={top} width={P.x(x0 + dx) - P.x(x0)} height={Math.max(0, bot - top)} fill={h >= 0 ? color : C.red} opacity={opacity} stroke={h >= 0 ? color : C.red} strokeWidth={n > 40 ? 0 : 1.5} />
            {marks && n <= 24 && <circle cx={P.x(xs)} cy={P.y(h)} r={4} fill={C.text} />}
          </g>
        );
      })}
    </g>
  );
}

/** A tank seen from the side, filled to `level` of `max`. */
export function Tank({ x, y, w, h, level, max, label, color = '#5fd3ff' }: { x: number; y: number; w: number; h: number; level: number; max: number; label?: string; color?: string }) {
  const fill = Math.max(0, Math.min(1, level / max)) * h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#0b1220" stroke="#2f3f5a" strokeWidth={4} />
      <rect x={x + 4} y={y + h - fill} width={w - 8} height={Math.max(0, fill - 4)} rx={6} fill={color} opacity={0.45} />
      <line x1={x + 4} x2={x + w - 4} y1={y + h - fill} y2={y + h - fill} stroke={color} strokeWidth={3} />
      {label && (
        <Html x={x + w / 2} y={y + h + 26} size={18} color={color}>
          <span className="prop-tag">{label}</span>
        </Html>
      )}
    </g>
  );
}
