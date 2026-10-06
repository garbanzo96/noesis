import { C } from '../../../engine/palette';
import { Group, Html } from '../../../engine/Stage';
import { Tex } from '../../../engine/Tex';

/**
 * A row of addressed boxes (a list / vector): address under each box (cyan = index),
 * content inside (amber = value). The basic "casillero" used across World 1.
 */
export function BoxRow({
  x,
  y,
  values,
  w = 120,
  h = 90,
  gap = 20,
  start = 1,
  highlight = [],
  dim = [],
  selected = [],
  valueColor = C.amber,
  addrColor = C.cyan,
  showAddr = true,
  addrPrefix = '',
  fmtValue = (v: number) => String(v),
  onBox,
  opacity = 1,
  valueSize = 30,
}: {
  x: number;
  y: number;
  values: number[];
  w?: number;
  h?: number;
  gap?: number;
  start?: number;
  highlight?: number[];
  dim?: number[];
  selected?: number[];
  valueColor?: string;
  addrColor?: string;
  showAddr?: boolean;
  addrPrefix?: string;
  fmtValue?: (v: number) => string;
  onBox?: (i: number) => void;
  opacity?: number;
  valueSize?: number;
}) {
  const n = values.length;
  const total = n * w + (n - 1) * gap;
  const bx = (i: number) => x - total / 2 + i * (w + gap);
  return (
    <Group opacity={opacity}>
      {values.map((v, i) => {
        const hl = highlight.includes(i);
        const sel = selected.includes(i);
        const dm = dim.includes(i);
        return (
          <g key={i} onClick={onBox ? () => onBox(i) : undefined} style={{ cursor: onBox ? 'pointer' : undefined }} opacity={dm ? 0.35 : 1}>
            <rect
              x={bx(i)}
              y={y - h / 2}
              width={w}
              height={h}
              rx={10}
              fill={sel ? C.violet : C.panel}
              fillOpacity={sel ? 0.25 : 1}
              stroke={hl ? C.text : sel ? C.violet : C.line}
              strokeWidth={hl || sel ? 3.5 : 2}
            />
            <Html x={bx(i) + w / 2} y={y} size={valueSize} color={valueColor}>
              <Tex tex={fmtValue(v)} />
            </Html>
            {showAddr && (
              <Html x={bx(i) + w / 2} y={y + h / 2 + 26} size={20} color={addrColor}>
                <Tex tex={`${addrPrefix}${i + start}`} />
              </Html>
            )}
          </g>
        );
      })}
    </Group>
  );
}

/** Center x of box i in a BoxRow with the same geometry. */
export const boxCenter = (x: number, n: number, i: number, w = 120, gap = 20) => {
  const total = n * w + (n - 1) * gap;
  return x - total / 2 + i * (w + gap) + w / 2;
};
