import type { ReactNode } from 'react';
import { lerp } from '../../engine/anim';
import { C } from '../../engine/palette';
import { Group, Html } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';

// Building blocks for lessons: tokens that move between layouts, number lines with intervals,
// captions. Everything is driven by the beat progress so the lesson plays like an animation.

/** Interpolate two points. */
export const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** A labelled token (an element of a set, a value, a sample). */
export function Token({ x, y, label, color = C.cyan, r = 32, opacity = 1, ring, onClick }: { x: number; y: number; label: ReactNode; color?: string; r?: number; opacity?: number; ring?: string; onClick?: () => void }) {
  return (
    <Group opacity={opacity}>
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
        {ring && <circle cx={x} cy={y} r={r + 7} fill="none" stroke={ring} strokeWidth={3} />}
        <circle cx={x} cy={y} r={r} fill="#0d0b1f" stroke={color} strokeWidth={3} />
        <Html x={x} y={y} size={r * 0.85} color={C.text}>
          <span className="prop-tag">{label}</span>
        </Html>
      </g>
    </Group>
  );
}

/** Caption text placed on the stage (rich TeX allowed through `tex`). */
export function Cap({ x, y, children, tex, size = 22, color = C.text, anchor = 'center', opacity = 1 }: { x: number; y: number; children?: ReactNode; tex?: string; size?: number; color?: string; anchor?: 'center' | 'left' | 'right'; opacity?: number }) {
  return (
    <Html x={x} y={y} size={size} color={color} anchor={anchor} opacity={opacity}>
      {tex ? <Tex tex={tex} /> : <span>{children}</span>}
    </Html>
  );
}

/** Linear map from values to pixels along a horizontal number line. */
export function lineMap(lo: number, hi: number, x0: number, x1: number) {
  return (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
}

/** A horizontal number line with integer ticks. */
export function NumberLine({ X, y, lo, hi, step = 1, labelEvery = 1, opacity = 1, color = C.muted }: { X: (v: number) => number; y: number; lo: number; hi: number; step?: number; labelEvery?: number; opacity?: number; color?: string }) {
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return (
    <Group opacity={opacity}>
      <line x1={X(lo) - 30} x2={X(hi) + 30} y1={y} y2={y} stroke={C.dim} strokeWidth={3} />
      <path d={`M${X(hi) + 30} ${y - 8} L${X(hi) + 44} ${y} L${X(hi) + 30} ${y + 8}`} fill={C.dim} />
      {ticks.map((v, i) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={y - 9} y2={y + 9} stroke={C.dim} strokeWidth={2} />
          {i % labelEvery === 0 && (
            <Html x={X(v)} y={y + 34} size={21} color={color}>
              <span className="prop-tag">{String(v).replace('.', ',')}</span>
            </Html>
          )}
        </g>
      ))}
    </Group>
  );
}

/** A highlighted interval on a number line; open ends are hollow; ±Infinity draws an arrow. */
export function IntervalBar({ X, y, a, b, openA = false, openB = false, color = C.green, progress = 1, xmin, xmax, onEnd }: { X: (v: number) => number; y: number; a: number; b: number; openA?: boolean; openB?: boolean; color?: string; progress?: number; xmin?: number; xmax?: number; onEnd?: (which: 'a' | 'b') => void }) {
  const xa = a === -Infinity ? (xmin ?? X(0)) - 20 : X(a);
  const xb = b === Infinity ? (xmax ?? X(0)) + 20 : X(b);
  const xe = lerp(xa, xb, progress);
  return (
    <g>
      <line x1={xa} x2={xe} y1={y} y2={y} stroke={color} strokeWidth={10} strokeLinecap="butt" opacity={0.85} />
      {b === Infinity && progress > 0.95 && <path d={`M${xb} ${y - 14} L${xb + 22} ${y} L${xb} ${y + 14}`} fill={color} />}
      {a === -Infinity && <path d={`M${xa} ${y - 14} L${xa - 22} ${y} L${xa} ${y + 14}`} fill={color} />}
      {a !== -Infinity && (
        <circle cx={xa} cy={y} r={13} fill={openA ? C.bg : color} stroke={color} strokeWidth={4} onClick={onEnd ? () => onEnd('a') : undefined} style={{ cursor: onEnd ? 'pointer' : undefined }} />
      )}
      {b !== Infinity && progress > 0.95 && (
        <circle cx={xb} cy={y} r={13} fill={openB ? C.bg : color} stroke={color} strokeWidth={4} onClick={onEnd ? () => onEnd('b') : undefined} style={{ cursor: onEnd ? 'pointer' : undefined }} />
      )}
    </g>
  );
}

/** Two overlapping circles; `fill` decides which regions are lit: 'a', 'b', 'ab' (both), 'out'. */
export function Venn2({ ca, cb, r, lit, colorA = C.cyan, colorB = C.amber, labels = ['A', 'B'], frame }: { ca: [number, number]; cb: [number, number]; r: number; lit: { a?: boolean; b?: boolean; ab?: boolean; out?: boolean }; colorA?: string; colorB?: string; labels?: [string, string]; frame?: { x: number; y: number; w: number; h: number } }) {
  const id = `v${Math.round(ca[0])}${Math.round(cb[0])}`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-a`}>
          <circle cx={ca[0]} cy={ca[1]} r={r} />
        </clipPath>
        <mask id={`${id}-noB`}>
          <rect x={0} y={0} width={1600} height={900} fill="#fff" />
          <circle cx={cb[0]} cy={cb[1]} r={r} fill="#000" />
        </mask>
        <mask id={`${id}-noA`}>
          <rect x={0} y={0} width={1600} height={900} fill="#fff" />
          <circle cx={ca[0]} cy={ca[1]} r={r} fill="#000" />
        </mask>
        <mask id={`${id}-out`}>
          <rect x={0} y={0} width={1600} height={900} fill="#fff" />
          <circle cx={ca[0]} cy={ca[1]} r={r} fill="#000" />
          <circle cx={cb[0]} cy={cb[1]} r={r} fill="#000" />
        </mask>
      </defs>
      {frame && <rect {...{ x: frame.x, y: frame.y, width: frame.w, height: frame.h }} rx={14} fill={lit.out ? C.violet : 'none'} fillOpacity={0.18} stroke={C.line} strokeWidth={2} mask={lit.out ? `url(#${id}-out)` : undefined} />}
      {frame && lit.out && <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx={14} fill="none" stroke={C.violet} strokeWidth={2} />}
      {lit.a && <circle cx={ca[0]} cy={ca[1]} r={r} fill={colorA} opacity={0.28} mask={`url(#${id}-noB)`} />}
      {lit.b && <circle cx={cb[0]} cy={cb[1]} r={r} fill={colorB} opacity={0.28} mask={`url(#${id}-noA)`} />}
      {lit.ab && <circle cx={cb[0]} cy={cb[1]} r={r} fill={C.magenta} opacity={0.4} clipPath={`url(#${id}-a)`} />}
      <circle cx={ca[0]} cy={ca[1]} r={r} fill="none" stroke={colorA} strokeWidth={3} />
      <circle cx={cb[0]} cy={cb[1]} r={r} fill="none" stroke={colorB} strokeWidth={3} />
      <Html x={ca[0] - r * 0.75} y={ca[1] - r * 0.85} size={30} color={colorA}>
        <Tex tex={labels[0]} />
      </Html>
      <Html x={cb[0] + r * 0.75} y={cb[1] - r * 0.85} size={30} color={colorB}>
        <Tex tex={labels[1]} />
      </Html>
    </g>
  );
}
