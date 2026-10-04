import type { ReactNode } from 'react';
import { C } from './palette';
import { Group, Html, type Plane } from './Stage';
import { Tex } from './Tex';
import { clamp, samplePath } from './anim';

// Vector primitives in the 3Blue1Brown idiom: thin luminous strokes, few elements,
// everything parameterized by an animation progress so scenes can "write" themselves.

export function Axes({
  P,
  xTicks = [],
  yTicks = [],
  xLabel,
  yLabel,
  opacity = 1,
  color = C.dim,
  tickLabels = true,
  grid = false,
}: {
  P: Plane;
  xTicks?: number[];
  yTicks?: number[];
  xLabel?: string;
  yLabel?: string;
  opacity?: number;
  color?: string;
  tickLabels?: boolean;
  grid?: boolean;
}) {
  if (opacity <= 0) return null;
  const x0 = clamp(0, P.xr[0], P.xr[1]);
  const y0 = clamp(0, P.yr[0], P.yr[1]);
  return (
    <Group opacity={opacity}>
      {grid &&
        xTicks.map((t) => (
          <line
            key={'gx' + t}
            x1={P.x(t)}
            x2={P.x(t)}
            y1={P.y(P.yr[0])}
            y2={P.y(P.yr[1])}
            stroke={C.grid}
            strokeWidth={1.5}
          />
        ))}
      {grid &&
        yTicks.map((t) => (
          <line
            key={'gy' + t}
            y1={P.y(t)}
            y2={P.y(t)}
            x1={P.x(P.xr[0])}
            x2={P.x(P.xr[1])}
            stroke={C.grid}
            strokeWidth={1.5}
          />
        ))}
      <line
        x1={P.x(P.xr[0])}
        x2={P.x(P.xr[1])}
        y1={P.y(y0)}
        y2={P.y(y0)}
        stroke={color}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      <line
        x1={P.x(x0)}
        x2={P.x(x0)}
        y1={P.y(P.yr[0])}
        y2={P.y(P.yr[1])}
        stroke={color}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      {xTicks.map((t) => (
        <g key={'x' + t}>
          <line
            x1={P.x(t)}
            x2={P.x(t)}
            y1={P.y(y0) - 7}
            y2={P.y(y0) + 7}
            stroke={color}
            strokeWidth={2}
          />
          {tickLabels && (
            <Html x={P.x(t)} y={P.y(y0) + 26} size={20} color={C.muted}>
              <Tex tex={String(t).replace('-', '-')} />
            </Html>
          )}
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={'y' + t}>
          <line
            y1={P.y(t)}
            y2={P.y(t)}
            x1={P.x(x0) - 7}
            x2={P.x(x0) + 7}
            stroke={color}
            strokeWidth={2}
          />
          {tickLabels && (
            <Html x={P.x(x0) - 14} y={P.y(t)} size={20} anchor="right" color={C.muted}>
              <Tex tex={String(t)} />
            </Html>
          )}
        </g>
      ))}
      {xLabel && (
        <Html x={P.x(P.xr[1]) + 8} y={P.y(y0) - 26} size={26} anchor="right" color={C.muted}>
          <Tex tex={xLabel} />
        </Html>
      )}
      {yLabel && (
        <Html x={P.x(x0) + 16} y={P.y(P.yr[1]) + 6} size={26} anchor="top-left" color={C.muted}>
          <Tex tex={yLabel} />
        </Html>
      )}
    </Group>
  );
}

/** Graph of f over [a,b]; `progress` reveals it left→right like ShowCreation. */
export function Curve({
  P,
  f,
  a,
  b,
  color = C.cyan,
  width = 4,
  progress = 1,
  opacity = 1,
  dashed = false,
  glow = true,
  samples = 240,
  clip = false,
}: {
  P: Plane;
  f: (x: number) => number;
  a?: number;
  b?: number;
  color?: string;
  width?: number;
  progress?: number;
  opacity?: number;
  dashed?: boolean;
  glow?: boolean;
  samples?: number;
  clip?: boolean;
}) {
  const lo = a ?? P.xr[0];
  const hi = b ?? P.xr[1];
  const end = lo + (hi - lo) * clamp(progress, 0, 1);
  if (progress <= 0 || opacity <= 0) return null;
  const margin = (P.yr[1] - P.yr[0]) * 0.6;
  const d = samplePath(f, lo, end, P.pt, Math.max(8, Math.round(samples * progress)), [
    P.yr[0] - margin,
    P.yr[1] + margin,
  ]);
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      strokeDasharray={dashed ? '10 10' : undefined}
      filter={glow ? 'url(#glow)' : undefined}
      clipPath={clip ? 'url(#plane-clip)' : undefined}
    />
  );
}

export function Dot({
  x,
  y,
  r = 9,
  color = C.cyan,
  opacity = 1,
  glow = true,
  ring = false,
  onPointerDown,
  cursor,
}: {
  x: number;
  y: number;
  r?: number;
  color?: string;
  opacity?: number;
  glow?: boolean;
  ring?: boolean;
  onPointerDown?: React.PointerEventHandler;
  cursor?: string;
}) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity} onPointerDown={onPointerDown} style={{ cursor }}>
      {onPointerDown && <circle cx={x} cy={y} r={r + 18} fill="transparent" />}
      {ring && (
        <circle cx={x} cy={y} r={r + 9} fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
      )}
      <circle cx={x} cy={y} r={r} fill={color} filter={glow ? 'url(#glow)' : undefined} />
    </g>
  );
}

export function Arrow({
  from,
  to,
  color = C.text,
  width = 3,
  progress = 1,
  opacity = 1,
  curve = 0,
  dashed = false,
  head = true,
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
  width?: number;
  progress?: number;
  opacity?: number;
  curve?: number;
  dashed?: boolean;
  head?: boolean;
}) {
  if (progress <= 0 || opacity <= 0) return null;
  const t = clamp(progress, 0, 1);
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * curve;
  const my = (y1 + y2) / 2 + (x2 - x1) * curve;
  // De Casteljau split of the quadratic at t to draw a partial arrow.
  const qx = (a: number, b: number, c: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  const ex = qx(x1, mx, x2);
  const ey = qx(y1, my, y2);
  const cx = (1 - t) * x1 + t * mx;
  const cy = (1 - t) * y1 + t * my;
  return (
    <path
      d={`M${x1} ${y1}Q${cx} ${cy} ${ex} ${ey}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeLinecap="round"
      strokeDasharray={dashed ? '8 8' : undefined}
      markerEnd={head ? 'url(#arrowhead)' : undefined}
    />
  );
}

export function Line({
  a,
  b,
  color = C.dim,
  width = 2,
  opacity = 1,
  dashed = false,
  progress = 1,
  glow = false,
}: {
  a: [number, number];
  b: [number, number];
  color?: string;
  width?: number;
  opacity?: number;
  dashed?: boolean;
  progress?: number;
  glow?: boolean;
}) {
  if (opacity <= 0 || progress <= 0) return null;
  const t = clamp(progress, 0, 1);
  return (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={a[0] + (b[0] - a[0]) * t}
      y2={a[1] + (b[1] - a[1]) * t}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeDasharray={dashed ? '8 8' : undefined}
      strokeLinecap="round"
      filter={glow ? 'url(#glow)' : undefined}
    />
  );
}

/** Horizontal number line with ticks; returns nothing but geometry. */
export function NumberLine({
  P,
  y = 0,
  ticks,
  labels = true,
  color = C.dim,
  opacity = 1,
  labelFor,
}: {
  P: Plane;
  y?: number;
  ticks: number[];
  labels?: boolean;
  color?: string;
  opacity?: number;
  labelFor?: (t: number) => string;
}) {
  if (opacity <= 0) return null;
  return (
    <Group opacity={opacity}>
      <line
        x1={P.x(P.xr[0])}
        x2={P.x(P.xr[1])}
        y1={P.y(y)}
        y2={P.y(y)}
        stroke={color}
        strokeWidth={2}
      />
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={P.x(t)}
            x2={P.x(t)}
            y1={P.y(y) - 9}
            y2={P.y(y) + 9}
            stroke={color}
            strokeWidth={2}
          />
          {labels && (
            <Html x={P.x(t)} y={P.y(y) + 30} size={22} color={C.muted}>
              <Tex tex={labelFor ? labelFor(t) : String(t)} />
            </Html>
          )}
        </g>
      ))}
    </Group>
  );
}

/** A rounded "chip" holding a formula: the basic token players move around. */
export function Chip({
  x,
  y,
  w = 120,
  h = 64,
  tex,
  color = C.cyan,
  opacity = 1,
  selected = false,
  dim = false,
  onPointerDown,
  onClick,
  size = 28,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  tex?: string;
  color?: string;
  opacity?: number;
  selected?: boolean;
  dim?: boolean;
  onPointerDown?: React.PointerEventHandler;
  onClick?: () => void;
  size?: number;
  children?: ReactNode;
}) {
  if (opacity <= 0) return null;
  const interactive = !!(onPointerDown || onClick);
  return (
    <Group opacity={opacity * (dim ? 0.4 : 1)}>
      <g
        onPointerDown={onPointerDown}
        onClick={onClick}
        style={{ cursor: interactive ? 'pointer' : undefined }}
        className={interactive ? 'chip-hit' : undefined}
      >
        <rect
          x={x - w / 2}
          y={y - h / 2}
          width={w}
          height={h}
          rx={10}
          fill={C.panel}
          stroke={color}
          strokeWidth={selected ? 3.5 : 2}
          filter={selected ? 'url(#glow)' : undefined}
        />
        {tex !== undefined && (
          <Html x={x} y={y} size={size} color={C.text}>
            <Tex tex={tex} />
          </Html>
        )}
        {children}
      </g>
    </Group>
  );
}

/** Curly brace from a to b (horizontal), opening downward by default. */
export function Brace({
  x1,
  x2,
  y,
  up = false,
  color = C.muted,
  opacity = 1,
}: {
  x1: number;
  x2: number;
  y: number;
  up?: boolean;
  color?: string;
  opacity?: number;
}) {
  if (opacity <= 0) return null;
  const s = up ? -1 : 1;
  const m = (x1 + x2) / 2;
  const d = 18 * s;
  const path = `M${x1} ${y}Q${x1} ${y + d} ${x1 + 20} ${y + d}L${m - 18} ${y + d}Q${m} ${y + d} ${m} ${y + 2 * d}Q${m} ${y + d} ${m + 18} ${y + d}L${x2 - 20} ${y + d}Q${x2} ${y + d} ${x2} ${y}`;
  return <path d={path} fill="none" stroke={color} strokeWidth={2.5} opacity={opacity} />;
}

/** Clip region for curves so they never leak outside their plane. */
export function PlaneClip({ P, pad = 0 }: { P: Plane; pad?: number }) {
  return (
    <defs>
      <clipPath id="plane-clip">
        <rect
          x={P.box.x - pad}
          y={P.box.y - pad}
          width={P.box.w + 2 * pad}
          height={P.box.h + 2 * pad}
        />
      </clipPath>
    </defs>
  );
}
