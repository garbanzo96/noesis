import { C } from '../../../engine/palette';
import { Group, Html } from '../../../engine/Stage';
import { Tex } from '../../../engine/Tex';

/**
 * A multiplicative ruler: value v sits at x = X(ln v). Major ticks are labeled,
 * minor ticks (2..9 within each decade-like span) are unlabeled.
 */
export function LogRuler({
  X,
  y,
  values,
  labels,
  minor = [],
  color = C.amber,
  opacity = 1,
  below = false,
  offset = 0,
  width,
  height = 16,
}: {
  /** additive coordinate (u = ln v) → pixel x */
  X: (u: number) => number;
  y: number;
  values: number[];
  labels?: (v: number) => string;
  minor?: number[];
  color?: string;
  opacity?: number;
  below?: boolean;
  /** shift of the whole ruler in additive units (for slide rules) */
  offset?: number;
  width?: [number, number];
  height?: number;
}) {
  if (opacity <= 0) return null;
  const s = below ? 1 : -1;
  const lo = width ? width[0] : X(Math.log(Math.min(...values)) + offset) - 30;
  const hi = width ? width[1] : X(Math.log(Math.max(...values)) + offset) + 30;
  return (
    <Group opacity={opacity}>
      <line x1={lo} x2={hi} y1={y} y2={y} stroke={color} strokeWidth={2} opacity={0.7} />
      {minor.map((v) => {
        const x = X(Math.log(v) + offset);
        return <line key={'m' + v} x1={x} x2={x} y1={y} y2={y + s * height * 0.55} stroke={color} strokeWidth={1.5} opacity={0.45} />;
      })}
      {values.map((v) => {
        const x = X(Math.log(v) + offset);
        return (
          <g key={v}>
            <line x1={x} x2={x} y1={y} y2={y + s * height} stroke={color} strokeWidth={2.5} />
            <Html x={x} y={y + s * (height + 20)} size={24} color={color}>
              <Tex tex={labels ? labels(v) : String(v)} />
            </Html>
          </g>
        );
      })}
    </Group>
  );
}

/** Pretty TeX for 2^a 3^b 5^c as an exact fraction. */
export function fracTex(a: number, b: number, c = 0): string {
  const num = 2 ** Math.max(a, 0) * 3 ** Math.max(b, 0) * 5 ** Math.max(c, 0);
  const den = 2 ** Math.max(-a, 0) * 3 ** Math.max(-b, 0) * 5 ** Math.max(-c, 0);
  return den === 1 ? String(num) : `\\tfrac{${num}}{${den}}`;
}
