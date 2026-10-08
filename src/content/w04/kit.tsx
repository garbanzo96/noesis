import { useId } from 'react';
import { C } from '../../engine/palette';
import { Html, plane, type Plane } from '../../engine/Stage';
import { Cap } from '../shared/lesson';
import { dec } from '../shared/ui';

// Shared pieces of Álgebra lineal: 2D vectors and 2×2 matrices, an equal-scale lattice,
// arrows that land exactly on their tip and a grid that can be deformed by a matrix.

export type V2 = [number, number];
/** 2×2 matrix stored by rows. */
export type M2 = [V2, V2];

export const I2: M2 = [
  [1, 0],
  [0, 1],
];
export const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
export const sc = (k: number, v: V2): V2 => [k * v[0], k * v[1]];
export const dot = (a: V2, b: V2) => a[0] * b[0] + a[1] * b[1];
export const norm = (v: V2) => Math.hypot(v[0], v[1]);
export const mv = (M: M2, v: V2): V2 => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
export const mm = (A: M2, B: M2): M2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
export const det = (M: M2) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
export const inv = (M: M2): M2 => {
  const d = det(M);
  return [
    [M[1][1] / d, -M[0][1] / d],
    [-M[1][0] / d, M[0][0] / d],
  ];
};
/** Columns: where (1,0) and (0,1) land. */
export const cols = (M: M2): [V2, V2] => [
  [M[0][0], M[1][0]],
  [M[0][1], M[1][1]],
];
export const fromCols = (a: V2, b: V2): M2 => [
  [a[0], b[0]],
  [a[1], b[1]],
];
/** Straight-line interpolation between two matrices (to animate a transformation from I). */
export const lerpM = (A: M2, B: M2, t: number): M2 => [
  [A[0][0] + (B[0][0] - A[0][0]) * t, A[0][1] + (B[0][1] - A[0][1]) * t],
  [A[1][0] + (B[1][0] - A[1][0]) * t, A[1][1] + (B[1][1] - A[1][1]) * t],
];
export const eqV = (a: V2, b: V2, tol = 0.01) => Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;

/** A number for TeX: integers plain, otherwise decimal comma. */
export const n = (x: number, d = 2) => {
  const r = Math.round(x);
  if (Math.abs(x - r) < 1e-9) return String(r);
  return dec(x, d).replace('−', '-').replace(',', '{,}');
};
export const texV = (v: V2, d = 2) => `\\begin{pmatrix}${n(v[0], d)}\\\\${n(v[1], d)}\\end{pmatrix}`;
export const texM = (M: M2, d = 2) => `\\begin{pmatrix}${n(M[0][0], d)}&${n(M[0][1], d)}\\\\${n(M[1][0], d)}&${n(M[1][1], d)}\\end{pmatrix}`;
/** Plain-text vector for messages: (3, −2). */
export const txtV = (v: V2) => `(${n(v[0])}, ${n(v[1])})`.replace(/\{,\}/g, ',');

/** Equal-scale plane centred at (cx, cy): one unit = `unit` px on both axes. */
export function lattice(cx = 720, cy = 450, unit = 60, hx = 7, hy = 5.5): Plane {
  return plane([-hx, hx], [-hy, hy], { x: cx - hx * unit, y: cy - hy * unit, w: 2 * hx * unit, h: 2 * hy * unit });
}

/** Arrow from `from` to `from + v` (math coordinates) with a crisp head and an optional TeX label at the tip. */
export function Vec({ P, v, from = [0, 0], color = C.cyan, width = 5, label, progress = 1, opacity = 1, off = [22, -22], dashed = false, size = 24 }: { P: Plane; v: V2; from?: V2; color?: string; width?: number; label?: string; progress?: number; opacity?: number; off?: V2; dashed?: boolean; size?: number }) {
  if (opacity <= 0 || progress <= 0) return null;
  const [x1, y1] = P.pt(from[0], from[1]);
  const [X, Y] = P.pt(from[0] + v[0] * progress, from[1] + v[1] * progress);
  const len = Math.hypot(X - x1, Y - y1);
  const head = Math.min(18 + width, len * 0.6);
  const ux = len > 0 ? (X - x1) / len : 0;
  const uy = len > 0 ? (Y - y1) / len : 0;
  const bx = X - ux * head;
  const by = Y - uy * head;
  const w = head * 0.5;
  return (
    <g opacity={opacity}>
      {len > 1 && (
        <>
          <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '10 8' : undefined} />
          <polygon points={`${X},${Y} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`} fill={color} />
        </>
      )}
      {label && progress > 0.9 && <Cap x={X + off[0]} y={Y + off[1]} tex={label} color={color} size={size} />}
    </g>
  );
}

/** The plane's grid deformed by M (identity = plain grid). Lines stay straight, parallel and evenly spaced. */
export function Grid({ P, M = I2, color = C.blue, opacity = 0.55, base = true, axes = true, R = 14 }: { P: Plane; M?: M2; color?: string; opacity?: number; base?: boolean; axes?: boolean; R?: number }) {
  const id = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const seg = (a: V2, b: V2) => {
    const p = mv(M, a);
    const q = mv(M, b);
    return { x1: P.x(p[0]), y1: P.y(p[1]), x2: P.x(q[0]), y2: P.y(q[1]) };
  };
  const ks = Array.from({ length: 2 * R + 1 }, (_, i) => i - R);
  const box = P.box;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {base &&
          ks.map((k) => (
            <g key={'b' + k}>
              <line x1={P.x(k)} x2={P.x(k)} y1={box.y} y2={box.y + box.h} stroke={C.grid} strokeWidth={1.5} />
              <line y1={P.y(k)} y2={P.y(k)} x1={box.x} x2={box.x + box.w} stroke={C.grid} strokeWidth={1.5} />
            </g>
          ))}
        {ks.map((k) =>
          k === 0 && axes ? null : (
            <g key={'t' + k} opacity={opacity}>
              <line {...seg([k, -R], [k, R])} stroke={color} strokeWidth={1.6} />
              <line {...seg([-R, k], [R, k])} stroke={color} strokeWidth={1.6} />
            </g>
          ),
        )}
        {axes && (
          <g>
            <line {...seg([0, -R], [0, R])} stroke={C.muted} strokeWidth={2.5} />
            <line {...seg([-R, 0], [R, 0])} stroke={C.muted} strokeWidth={2.5} />
          </g>
        )}
      </g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke={C.line} strokeWidth={2} />
    </g>
  );
}

/** Snap a drag position to the nearest lattice point inside the plane. */
export const snap = (P: Plane, px: number, py: number, step = 1): V2 => {
  const [x, y] = P.inv(px, py);
  const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v / step) * step));
  return [c(x, Math.ceil(P.xr[0]), Math.floor(P.xr[1])), c(y, Math.ceil(P.yr[0]), Math.floor(P.yr[1]))];
};

/** Filled parallelogram spanned by a and b (from the origin). */
export function Para({ P, a, b, color = C.amber, opacity = 0.25, stroke = true }: { P: Plane; a: V2; b: V2; color?: string; opacity?: number; stroke?: boolean }) {
  const pts = [[0, 0], a, add(a, b), b].map(([x, y]) => P.pt(x, y).join(',')).join(' ');
  return <polygon points={pts} fill={color} fillOpacity={opacity} stroke={stroke ? color : 'none'} strokeWidth={2} strokeOpacity={0.8} />;
}

/** Answer box shaped like a matrix (or a column vector with cols=1). Values are row-major strings. */
export function MatInput({ x, y, vals, onChange, onEnter, rows = 2, cols = 2, label, size = 26 }: { x: number; y: number; vals: string[]; onChange: (i: number, v: string) => void; onEnter?: () => void; rows?: number; cols?: number; label?: string; size?: number }) {
  return (
    <Html x={x} y={y} size={size} interactive anchor="left">
      <div className="mat-input">
        {label && <span className="mat-label">{label}</span>}
        <span className="mat-paren">(</span>
        <div className="mat-grid" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {Array.from({ length: rows * cols }, (_, i) => (
            <input
              key={i}
              className="stage-input"
              inputMode="decimal"
              value={vals[i] ?? ''}
              onChange={(e) => onChange(i, e.target.value.replace(/[^0-9,.\-−/ ]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEnter?.();
              }}
            />
          ))}
        </div>
        <span className="mat-paren">)</span>
      </div>
    </Html>
  );
}

/** Letter F (to see orientation and distortion), in math coordinates. */
export const F_SHAPE: V2[] = [
  [0, 0],
  [0, 3],
  [2, 3],
  [2, 2.4],
  [0.6, 2.4],
  [0.6, 1.8],
  [1.6, 1.8],
  [1.6, 1.2],
  [0.6, 1.2],
  [0.6, 0],
];
export function Shape({ P, M = I2, pts = F_SHAPE, color = C.amber, opacity = 0.5, at = [0, 0] }: { P: Plane; M?: M2; pts?: V2[]; color?: string; opacity?: number; at?: V2 }) {
  const id = 's' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const q = pts.map((p) => mv(M, add(p, at))).map(([a, b]) => P.pt(a, b).join(',')).join(' ');
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} />
        </clipPath>
      </defs>
      <polygon points={q} fill={color} fillOpacity={opacity} stroke={color} strokeWidth={2.5} strokeLinejoin="round" clipPath={`url(#${id})`} />
    </g>
  );
}

/** The line a·x + b·y = c across the plane, clipped to its box, with an optional TeX label. */
export function EqLine({ P, a, b, c, color = C.cyan, width = 4, opacity = 1, label, labelAt = 0.85 }: { P: Plane; a: number; b: number; c: number; color?: string; width?: number; opacity?: number; label?: string; labelAt?: number }) {
  const id = 'e' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (opacity <= 0 || (a === 0 && b === 0)) return null;
  const [x0, x1] = P.xr;
  const [y0, y1] = P.yr;
  const p = Math.abs(b) >= Math.abs(a) ? [P.pt(x0, (c - a * x0) / b), P.pt(x1, (c - a * x1) / b)] : [P.pt((c - b * y0) / a, y0), P.pt((c - b * y1) / a, y1)];
  // the visible part of the segment (clip to the box) to place the label on it
  const bx = P.box;
  let t0 = 0;
  let t1 = 1;
  const dx = p[1][0] - p[0][0];
  const dy = p[1][1] - p[0][1];
  for (const [q, r] of [
    [-dx, p[0][0] - bx.x],
    [dx, bx.x + bx.w - p[0][0]],
    [-dy, p[0][1] - bx.y],
    [dy, bx.y + bx.h - p[0][1]],
  ]) {
    if (q === 0) continue;
    const t = r / q;
    if (q < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
  }
  const tl = t0 + (t1 - t0) * labelAt;
  const lx = p[0][0] + dx * tl;
  const ly = p[0][1] + dy * tl;
  const inBox = t1 > t0;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} />
        </clipPath>
      </defs>
      <line x1={p[0][0]} y1={p[0][1]} x2={p[1][0]} y2={p[1][1]} stroke={color} strokeWidth={width} strokeLinecap="round" clipPath={`url(#${id})`} />
      {label && inBox && <Cap x={lx + 14} y={ly - 22} tex={label} color={color} size={20} anchor="left" />}
    </g>
  );
}

/** "3x − 2y = 5" in TeX from coefficients. */
export const texEq = (a: number, b: number, c: number, xs = 'x', ys = 'y') => {
  const t = (k: number, s: string, first: boolean) => (k === 0 ? '' : `${k < 0 ? '-' : first ? '' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}${s}`);
  return `${t(a, xs, true)}${t(b, ys, a === 0)}=${c}`;
};
