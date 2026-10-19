import type { PointerEventHandler } from 'react';
import { C } from '../../engine/palette';
import { Html, type Plane } from '../../engine/Stage';
import { Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import { DragCue, dec } from '../shared/ui';

// Shared pieces of La Planta: numeric derivative, secant and tangent lines, slope triangles.

/** Central difference. */
export const deriv = (f: (x: number) => number, x: number, h = 1e-4) =>
  (f(x + h) - f(x - h)) / (2 * h);

/** TeX number with decimal comma. */
export const nt = (v: number, d = 2) => dec(v, d).replace(',', '{,}');

/** A straight line through (a, f(a)) with slope m, drawn over [x0, x1] and clipped to the plane's y range. */
export function SlopeLine({
  P,
  a,
  ya,
  m,
  x0,
  x1,
  color = C.amber,
  width = 3,
  dashed = false,
}: {
  P: Plane;
  a: number;
  ya: number;
  m: number;
  x0: number;
  x1: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}) {
  const [ylo, yhi] = P.yr;
  // clip in x so the line stays inside the y range
  let lo = x0;
  let hi = x1;
  if (Math.abs(m) > 1e-9) {
    const xa = a + (ylo - ya) / m;
    const xb = a + (yhi - ya) / m;
    lo = Math.max(lo, Math.min(xa, xb));
    hi = Math.min(hi, Math.max(xa, xb));
  }
  if (hi <= lo) return null;
  return (
    <Line
      a={P.pt(lo, ya + m * (lo - a))}
      b={P.pt(hi, ya + m * (hi - a))}
      color={color}
      width={width}
      dashed={dashed}
    />
  );
}

/** Secant through (a, f(a)) and (b, f(b)) with its rise/run triangle. */
export function Secant({
  P,
  f,
  a,
  b,
  color = C.magenta,
  labels = true,
  unitY = '',
  unitX = '',
}: {
  P: Plane;
  f: (x: number) => number;
  a: number;
  b: number;
  color?: string;
  labels?: boolean;
  unitY?: string;
  unitX?: string;
}) {
  const fa = f(a);
  const fb = f(b);
  const m = (fb - fa) / (b - a);
  return (
    <g>
      <SlopeLine P={P} a={a} ya={fa} m={m} x0={P.xr[0]} x1={P.xr[1]} color={color} width={2.5} />
      <Line a={P.pt(a, fa)} b={P.pt(b, fa)} color={C.text} width={2} dashed />
      <Line a={P.pt(b, fa)} b={P.pt(b, fb)} color={C.text} width={2} dashed />
      {labels && Math.abs(P.x(b) - P.x(a)) > 50 && (
        <>
          <Html
            x={(P.x(a) + P.x(b)) / 2}
            y={P.y(fa) + (fb >= fa ? 24 : -24)}
            size={18}
            color={C.text}
          >
            <Tex tex={`\\Delta t=${nt(b - a, 2)}${unitX}`} />
          </Html>
          <Html x={P.x(b) + 12} y={(P.y(fa) + P.y(fb)) / 2} size={18} anchor="left" color={C.text}>
            <Tex tex={`\\Delta=${nt(fb - fa, 2)}${unitY}`} />
          </Html>
        </>
      )}
      <Dot x={P.x(a)} y={P.y(fa)} r={8} color={color} />
      <Dot x={P.x(b)} y={P.y(fb)} r={8} color={color} />
    </g>
  );
}

/** Tangent at a, using the numeric derivative unless `m` is given. */
export function Tangent({
  P,
  f,
  a,
  m,
  half = 2,
  color = C.amber,
  onPointerDown,
}: {
  P: Plane;
  f: (x: number) => number;
  a: number;
  m?: number;
  half?: number;
  color?: string;
  onPointerDown?: PointerEventHandler;
}) {
  const slope = m ?? deriv(f, a);
  return (
    <g>
      <SlopeLine
        P={P}
        a={a}
        ya={f(a)}
        m={slope}
        x0={a - half}
        x1={a + half}
        color={color}
        width={3}
      />
      <Dot
        x={P.x(a)}
        y={P.y(f(a))}
        r={10}
        color={color}
        onPointerDown={onPointerDown}
        cursor={onPointerDown ? 'ew-resize' : undefined}
        ring={!!onPointerDown}
      />
      {onPointerDown && <DragCue x={P.x(a)} y={P.y(f(a))} axis="x" color={color} />}
    </g>
  );
}
