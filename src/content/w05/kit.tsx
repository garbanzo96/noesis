import { useRef, useState } from 'react';
import { Die } from '../../art/props';
import { C } from '../../engine/palette';
import { Group, Html } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import { DragCue, dec } from '../shared/ui';

// Shared pieces of the casino: the 6×6 board of two dice, fractions, bars and tables.

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
/** TeX fraction, with its reduced form when it simplifies: 6/36 → \frac{6}{36}=\frac{1}{6}. */
export function fracTex(n: number, d: number, reduce = true) {
  const g = gcd(n, d) || 1;
  const base = `\\frac{${n}}{${d}}`;
  if (!reduce || g === 1 || n === 0) return base;
  return d / g === 1 ? `${base}=${n / g}` : `${base}=\\frac{${n / g}}{${d / g}}`;
}
/** Two fixed decimals with a comma: 0.2 → "0,20". */
export const f2 = (v: number) => v.toFixed(2).replace('.', ',');
export const pct = (p: number, d = 1) => `${dec(p * 100, d)} %`;

export type Cell = [number, number];
export const ALL: Cell[] = Array.from({ length: 36 }, (_, k) => [
  Math.floor(k / 6) + 1,
  (k % 6) + 1,
]);
export const keyOf = (c: Cell) => c[0] * 10 + c[1];

/**
 * The 36 outcomes of a red and a white die: rows are the red die, columns the white one.
 * Cells can be painted by dragging when `onPaint` is given.
 */
export function DiceGrid({
  x = 420,
  y = 120,
  cell = 100,
  sel,
  tone,
  onPaint,
  labels = 'dice',
  dim,
}: {
  x?: number;
  y?: number;
  cell?: number;
  /** selected cells (keys a*10+b) */
  sel?: Set<number>;
  /** colour per cell, overrides selection colour */
  tone?: (c: Cell) => string | null;
  onPaint?: (key: number, on: boolean) => void;
  labels?: 'dice' | 'sum' | 'pair';
  dim?: (c: Cell) => boolean;
}) {
  const painting = useRef<boolean | null>(null);
  const [, force] = useState(0);
  const start = (k: number) => {
    painting.current = !sel?.has(k);
    onPaint?.(k, painting.current);
    const up = () => {
      painting.current = null;
      window.removeEventListener('pointerup', up);
      force((v) => v + 1);
    };
    window.addEventListener('pointerup', up);
  };
  return (
    <g>
      {[1, 2, 3, 4, 5, 6].map((v) => (
        <g key={'h' + v}>
          <Die x={x + (v - 0.5) * cell} y={y - 44} value={v} size={40} />
          <Die x={x - 44} y={y + (v - 0.5) * cell} value={v} size={40} color="#c8283c" pip="#fff" />
        </g>
      ))}
      {ALL.map((c) => {
        const k = keyOf(c);
        const cx = x + (c[1] - 1) * cell;
        const cy = y + (c[0] - 1) * cell;
        const t = tone?.(c) ?? (sel?.has(k) ? C.amber : null);
        const faded = dim?.(c) ?? false;
        return (
          <Group key={k} opacity={faded ? 0.22 : 1}>
            <g
              onPointerDown={onPaint ? (e) => (e.preventDefault(), start(k)) : undefined}
              onPointerEnter={
                onPaint
                  ? () => painting.current !== null && onPaint(k, painting.current)
                  : undefined
              }
              style={{ cursor: onPaint ? 'pointer' : undefined }}
            >
              <rect
                x={cx + 3}
                y={cy + 3}
                width={cell - 6}
                height={cell - 6}
                rx={8}
                fill={t ? t : '#120f22'}
                fillOpacity={t ? 0.32 : 1}
                stroke={t ?? C.line}
                strokeWidth={t ? 2.5 : 1.5}
              />
              {onPaint && k === keyOf(ALL[0]) && (
                <DragCue x={cx + cell / 2} y={cy + cell / 2} axis="xy" color={t ?? C.line} />
              )}
              {labels === 'dice' && (
                <>
                  <Die
                    x={cx + cell * 0.32}
                    y={cy + cell * 0.5}
                    value={c[0]}
                    size={cell * 0.34}
                    color="#c8283c"
                    pip="#fff"
                  />
                  <Die x={cx + cell * 0.68} y={cy + cell * 0.5} value={c[1]} size={cell * 0.34} />
                </>
              )}
              {labels === 'sum' && (
                <Html
                  x={cx + cell / 2}
                  y={cy + cell / 2}
                  size={cell * 0.3}
                  color={t ? C.text : C.muted}
                >
                  <span className="prop-tag">{c[0] + c[1]}</span>
                </Html>
              )}
              {labels === 'pair' && (
                <Html
                  x={cx + cell / 2}
                  y={cy + cell / 2}
                  size={cell * 0.22}
                  color={t ? C.text : C.muted}
                >
                  <span className="prop-tag">
                    ({c[0]},{c[1]})
                  </span>
                </Html>
              )}
            </g>
          </Group>
        );
      })}
    </g>
  );
}

/** Vertical bars with labels; `hi` marks bars, `onPick` makes them clickable. */
export function Bars({
  x,
  y,
  w,
  h,
  values,
  max,
  labels,
  color = C.cyan,
  hi,
  onPick,
  refV: refLine,
  fmtV,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  values: number[];
  max: number;
  labels: string[];
  color?: string;
  hi?: number | null;
  onPick?: (i: number) => void;
  refV?: number;
  fmtV?: (v: number) => string;
}) {
  const bw = w / values.length;
  return (
    <g>
      <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={C.line} strokeWidth={2} />
      {values.map((v, i) => {
        const bh = (Math.min(v, max) / max) * h;
        const on = hi === i;
        return (
          <g
            key={i}
            onClick={onPick ? () => onPick(i) : undefined}
            style={{ cursor: onPick ? 'pointer' : undefined }}
          >
            {onPick && <rect x={x + i * bw} y={y} width={bw} height={h + 40} fill="transparent" />}
            <rect
              x={x + i * bw + bw * 0.15}
              y={y + h - bh}
              width={bw * 0.7}
              height={bh}
              fill={on ? C.amber : color}
              opacity={on ? 0.9 : 0.65}
              stroke={on ? C.text : 'none'}
              strokeWidth={2}
            />
            <Html x={x + (i + 0.5) * bw} y={y + h + 22} size={18} color={C.muted}>
              <span className="prop-tag">{labels[i]}</span>
            </Html>
            <Html
              x={x + (i + 0.5) * bw}
              y={y + h - bh - 16}
              size={15}
              color={on ? C.amber : C.text}
            >
              <span className="prop-tag">{fmtV ? fmtV(v) : v}</span>
            </Html>
          </g>
        );
      })}
      {refLine !== undefined && (
        <line
          x1={x}
          x2={x + w}
          y1={y + h - (refLine / max) * h}
          y2={y + h - (refLine / max) * h}
          stroke={C.green}
          strokeWidth={2}
          strokeDasharray="8 6"
        />
      )}
    </g>
  );
}

/** A labelled 2D table of numbers; optional row/column totals and per-cell colour. */
export function Table({
  x,
  y,
  rows,
  cols,
  data,
  cw = 210,
  ch = 92,
  fmtV = (v: number) => String(v),
  rowSums,
  colSums,
  total,
  tone,
  onCell,
  onRow,
  dimRow,
  hidden,
}: {
  x: number;
  y: number;
  rows: string[];
  cols: string[];
  data: number[][];
  cw?: number;
  ch?: number;
  fmtV?: (v: number) => string;
  rowSums?: boolean;
  colSums?: boolean;
  total?: boolean;
  tone?: (i: number, j: number) => string | null;
  onCell?: (i: number, j: number) => void;
  onRow?: (i: number) => void;
  dimRow?: (i: number) => boolean;
  hidden?: (i: number, j: number) => boolean;
}) {
  const rs = data.map((r) => r.reduce((a, b) => a + b, 0));
  const cs = cols.map((_, j) => data.reduce((a, r) => a + r[j], 0));
  const tot = rs.reduce((a, b) => a + b, 0);
  const lx = x - 20;
  return (
    <g>
      {cols.map((c, j) => (
        <Html key={c} x={x + (j + 0.5) * cw} y={y - 28} size={23} color={C.muted}>
          <span>{c}</span>
        </Html>
      ))}
      {rowSums && (
        <Html x={x + (cols.length + 0.5) * cw} y={y - 26} size={20} color={C.cyan}>
          <span>total</span>
        </Html>
      )}
      {rows.map((r, i) => (
        <Group key={r} opacity={dimRow?.(i) ? 0.25 : 1}>
          <g
            onClick={onRow ? () => onRow(i) : undefined}
            style={{ cursor: onRow ? 'pointer' : undefined }}
          >
            {onRow && (
              <rect x={lx - 220} y={y + i * ch} width={220} height={ch} fill="transparent" />
            )}
            <Html x={lx} y={y + (i + 0.5) * ch} size={25} anchor="right" color={C.text}>
              <span>{r}</span>
            </Html>
          </g>
          {data[i].map((v, j) => {
            const t = tone?.(i, j) ?? null;
            return (
              <g
                key={j}
                onClick={onCell ? () => onCell(i, j) : undefined}
                style={{ cursor: onCell ? 'pointer' : undefined }}
              >
                <rect
                  x={x + j * cw + 3}
                  y={y + i * ch + 3}
                  width={cw - 6}
                  height={ch - 6}
                  rx={8}
                  fill={t ?? '#120f22'}
                  fillOpacity={t ? 0.3 : 1}
                  stroke={t ?? C.line}
                  strokeWidth={t ? 2.5 : 1.5}
                />
                <Html x={x + (j + 0.5) * cw} y={y + (i + 0.5) * ch} size={33} color={C.text}>
                  <span className="prop-tag">{hidden?.(i, j) ? '?' : fmtV(v)}</span>
                </Html>
              </g>
            );
          })}
          {rowSums && (
            <Html x={x + (cols.length + 0.5) * cw} y={y + (i + 0.5) * ch} size={28} color={C.cyan}>
              <span className="prop-tag">{fmtV(rs[i])}</span>
            </Html>
          )}
        </Group>
      ))}
      {colSums &&
        cs.map((s, j) => (
          <Html
            key={j}
            x={x + (j + 0.5) * cw}
            y={y + (rows.length + 0.5) * ch}
            size={28}
            color={C.magenta}
          >
            <span className="prop-tag">{fmtV(s)}</span>
          </Html>
        ))}
      {colSums && (
        <Html x={lx} y={y + (rows.length + 0.5) * ch} size={20} anchor="right" color={C.magenta}>
          <span>total</span>
        </Html>
      )}
      {total && (
        <Html
          x={x + (cols.length + 0.5) * cw}
          y={y + (rows.length + 0.5) * ch}
          size={28}
          color={C.text}
        >
          <span className="prop-tag">{fmtV(tot)}</span>
        </Html>
      )}
    </g>
  );
}

/** Big formula line centered on the stage. */
export function Formula({
  y,
  tex,
  size = 30,
  color = C.text,
  x = 800,
}: {
  y: number;
  tex: string;
  size?: number;
  color?: string;
  x?: number;
}) {
  return (
    <Html x={x} y={y} size={size} color={color}>
      <Tex tex={tex} />
    </Html>
  );
}

// ---------------------------------------------------------------- cards
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['c', 'o', 'p', 't'] as const;
export type Suit = (typeof SUITS)[number];
export const SUIT_NAME: Record<Suit, string> = {
  c: 'corazones',
  o: 'diamantes',
  p: 'picas',
  t: 'tréboles',
};
export interface Card {
  r: number; // 0..12 (A..K)
  s: Suit;
}
export const DECK: Card[] = SUITS.flatMap((s) => RANKS.map((_, r) => ({ r, s })));
export const isRed = (c: Card) => c.s === 'c' || c.s === 'o';
export const isFace = (c: Card) => c.r >= 10;
export const cardName = (c: Card) => `${RANKS[c.r]} de ${SUIT_NAME[c.s]}`;
