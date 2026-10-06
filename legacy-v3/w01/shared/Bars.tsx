import { fmt } from '../../../engine/anim';
import { C } from '../../../engine/palette';
import { Group, Html } from '../../../engine/Stage';
import { Tex } from '../../../engine/Tex';

/**
 * Signed bars around a zero line (log-scores, energies). Optional per-bar drag handles.
 * `scale` = pixels per unit. Values beyond ±clip units are drawn clipped with a chevron.
 */
export function ScoreBars({
  x,
  y0,
  values,
  scale = 70,
  gap = 150,
  barW = 80,
  color = C.magenta,
  labels,
  showValues = true,
  clip = 3.6,
  onGrab,
  opacity = 1,
  sub = 'z',
}: {
  x: number;
  y0: number;
  values: number[];
  scale?: number;
  gap?: number;
  barW?: number;
  color?: string | string[];
  labels?: string[];
  showValues?: boolean;
  clip?: number;
  onGrab?: (i: number) => React.PointerEventHandler;
  opacity?: number;
  sub?: string;
}) {
  const n = values.length;
  const cx = (i: number) => x + (i - (n - 1) / 2) * gap;
  return (
    <Group opacity={opacity}>
      <line x1={cx(0) - gap / 2} x2={cx(n - 1) + gap / 2} y1={y0} y2={y0} stroke={C.dim} strokeWidth={2} />
      {values.map((v, i) => {
        const col = Array.isArray(color) ? color[i % color.length] : color;
        const vc = Math.max(-clip, Math.min(clip, v));
        const h = vc * scale;
        const top = h >= 0 ? y0 - h : y0;
        return (
          <g key={i}>
            <rect x={cx(i) - barW / 2} y={top} width={barW} height={Math.max(1, Math.abs(h))} fill={col} opacity={0.75} rx={3} />
            {onGrab && (
              <g style={{ cursor: 'ns-resize' }} onPointerDown={onGrab(i)}>
                <rect x={cx(i) - barW / 2 - 10} y={y0 - h - 18} width={barW + 20} height={36} fill="transparent" />
                <line x1={cx(i) - barW / 2} x2={cx(i) + barW / 2} y1={y0 - h} y2={y0 - h} stroke={C.text} strokeWidth={4} />
              </g>
            )}
            {showValues && (
              <Html x={cx(i)} y={h >= 0 ? y0 - h - 26 : y0 - h + 26} size={20} color={col}>
                <Tex tex={fmt(v, 2)} />
              </Html>
            )}
            {labels && (
              <Html x={cx(i)} y={y0 + (h >= 0 ? 30 : -30) + (h < 0 ? -0 : 0)} size={20} color={C.muted}>
                <Tex tex={labels[i] ?? `${sub}_{${i + 1}}`} />
              </Html>
            )}
          </g>
        );
      })}
    </Group>
  );
}

/** Probability bars on a baseline (heights in [0,1]); optional ghost targets. */
export function BeliefBars({
  x,
  y0,
  values,
  height = 300,
  gap = 150,
  barW = 80,
  color = C.violet,
  labels,
  target,
  opacity = 1,
  digits = 2,
}: {
  x: number;
  y0: number;
  values: number[];
  height?: number;
  gap?: number;
  barW?: number;
  color?: string | string[];
  labels?: string[];
  target?: number[];
  opacity?: number;
  digits?: number;
}) {
  const n = values.length;
  const cx = (i: number) => x + (i - (n - 1) / 2) * gap;
  return (
    <Group opacity={opacity}>
      <line x1={cx(0) - gap / 2} x2={cx(n - 1) + gap / 2} y1={y0} y2={y0} stroke={C.dim} strokeWidth={2} />
      <line x1={cx(0) - gap / 2} x2={cx(n - 1) + gap / 2} y1={y0 - height} y2={y0 - height} stroke={C.line} strokeWidth={1} strokeDasharray="4 6" />
      {values.map((v, i) => {
        const col = Array.isArray(color) ? color[i % color.length] : color;
        const h = Math.max(0, Math.min(1, v)) * height;
        return (
          <g key={i}>
            <rect x={cx(i) - barW / 2} y={y0 - h} width={barW} height={Math.max(1, h)} fill={col} opacity={0.8} rx={3} />
            {target && (
              <rect
                x={cx(i) - barW / 2 - 6}
                y={y0 - target[i] * height}
                width={barW + 12}
                height={target[i] * height}
                fill="none"
                stroke={C.text}
                strokeWidth={2}
                strokeDasharray="6 5"
              />
            )}
            <Html x={cx(i)} y={y0 - h - 24} size={20} color={col}>
              <Tex tex={fmt(v, digits)} />
            </Html>
            {labels && (
              <Html x={cx(i)} y={y0 + 28} size={20} color={C.muted}>
                <Tex tex={labels[i]} />
              </Html>
            )}
          </g>
        );
      })}
    </Group>
  );
}

export const softmax = (z: number[], gamma = 1): number[] => {
  const m = Math.max(...z.map((v) => gamma * v));
  const e = z.map((v) => Math.exp(gamma * v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};
export const logSumExp = (z: number[]) => {
  const m = Math.max(...z);
  return m + Math.log(z.reduce((s, v) => s + Math.exp(v - m), 0));
};
