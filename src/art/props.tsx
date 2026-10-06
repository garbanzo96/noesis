import type { ReactNode } from 'react';
import { C } from '../engine/palette';
import { Group, Html } from '../engine/Stage';

// Concrete objects of the cases, drawn in the same flat-neon style as the backdrops.

/** A shipping container seen from the side, with an ID plate and an optional reading tag. */
export function ContainerBox({
  x,
  y,
  w = 170,
  h = 96,
  color = '#1e5a6e',
  id,
  tag,
  tagColor = C.text,
  state = 'idle',
  onClick,
  opacity = 1,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  color?: string;
  id: string;
  tag?: string;
  tagColor?: string;
  state?: 'idle' | 'flag' | 'ok' | 'pick' | 'dim';
  onClick?: () => void;
  opacity?: number;
}) {
  const ribs = [];
  for (let k = 14; k < w - 6; k += 14) ribs.push(<line key={k} x1={x - w / 2 + k} x2={x - w / 2 + k} y1={y - h / 2 + 6} y2={y + h / 2 - 6} stroke="#00000050" strokeWidth={4} />);
  const ring = state === 'flag' ? C.red : state === 'ok' ? C.green : state === 'pick' ? C.text : null;
  return (
    <Group opacity={opacity * (state === 'dim' ? 0.35 : 1)}>
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
        {ring && <rect x={x - w / 2 - 7} y={y - h / 2 - 7} width={w + 14} height={h + 14} rx={6} fill="none" stroke={ring} strokeWidth={4} />}
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={color} />
        {ribs}
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="none" stroke="#0008" strokeWidth={4} />
        <rect x={x - 46} y={y - h / 2 + 10} width={92} height={24} fill="#0b0918" opacity={0.85} />
        <Html x={x} y={y - h / 2 + 22} size={16} color="#d8d0ee">
          <span className="prop-id">{id}</span>
        </Html>
        {tag !== undefined && (
          <>
            <rect x={x - 52} y={y + 4} width={104} height={32} rx={4} fill="#05040c" stroke={tagColor} strokeWidth={2} />
            <Html x={x} y={y + 20} size={20} color={tagColor}>
              <span className="prop-tag">{tag}</span>
            </Html>
          </>
        )}
      </g>
    </Group>
  );
}

/** Vertical thermometer from tMin to tMax with an optional allowed band. */
export function Thermometer({
  x,
  top,
  bottom,
  tMin,
  tMax,
  value,
  band,
  bandOpen = [false, false],
  ticks = [],
  color = C.cyan,
}: {
  x: number;
  top: number;
  bottom: number;
  tMin: number;
  tMax: number;
  value: number;
  band?: [number, number];
  bandOpen?: [boolean, boolean];
  ticks?: number[];
  color?: string;
}) {
  const Y = (t: number) => bottom - ((t - tMin) / (tMax - tMin)) * (bottom - top);
  const inside = band ? (bandOpen[0] ? value > band[0] : value >= band[0]) && (bandOpen[1] ? value < band[1] : value <= band[1]) : true;
  const liquid = inside ? C.green : C.red;
  return (
    <g>
      <rect x={x - 22} y={top - 14} width={44} height={bottom - top + 28} rx={22} fill="#0a0818" stroke="#3d3160" strokeWidth={3} />
      {band && <rect x={x - 22} y={Y(band[1])} width={44} height={Y(band[0]) - Y(band[1])} fill={C.green} opacity={0.12} />}
      <rect x={x - 9} y={Y(value)} width={18} height={bottom + 20 - Y(value)} rx={9} fill={liquid} opacity={0.9} />
      <circle cx={x} cy={bottom + 34} r={30} fill={liquid} stroke="#3d3160" strokeWidth={3} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x + 26} x2={x + 42} y1={Y(t)} y2={Y(t)} stroke={C.muted} strokeWidth={2} />
          <Html x={x + 52} y={Y(t)} size={18} anchor="left" color={C.muted}>
            <span className="prop-tag">{t}°</span>
          </Html>
        </g>
      ))}
      {band && (
        <>
          <line x1={x - 40} x2={x + 22} y1={Y(band[0])} y2={Y(band[0])} stroke={color} strokeWidth={3} strokeDasharray={bandOpen[0] ? '6 6' : undefined} />
          <line x1={x - 40} x2={x + 22} y1={Y(band[1])} y2={Y(band[1])} stroke={color} strokeWidth={3} strokeDasharray={bandOpen[1] ? '6 6' : undefined} />
        </>
      )}
    </g>
  );
}

export function Ship({ x, y, s = 1, name, color = '#2a2148', lights = true }: { x: number; y: number; s?: number; name?: string; color?: string; lights?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-220 0 L220 0 L180 60 L-190 60 Z" fill={color} stroke="#3d3160" strokeWidth={3} />
      <rect x="40" y="-70" width="110" height="70" fill="#1d1733" stroke="#3d3160" strokeWidth={3} />
      <rect x="70" y="-110" width="50" height="40" fill="#1d1733" stroke="#3d3160" strokeWidth={3} />
      {[-180, -120, -60, 0].map((cx, i) => (
        <rect key={i} x={cx} y={-46} width={54} height={46} fill={['#7a2a4a', '#1e5a6e', '#6b5a24', '#3b2c6e'][i]} />
      ))}
      {lights && (
        <>
          <circle cx="60" cy="-50" r="5" fill={C.amber} />
          <circle cx="90" cy="-50" r="5" fill={C.amber} />
          <circle cx="120" cy="-50" r="5" fill={C.amber} className="blink" />
        </>
      )}
      {name && (
        <text x="-20" y="38" fill="#c9c2e6" fontFamily="IBM Plex Mono" fontSize="22" letterSpacing="4" textAnchor="middle">
          {name}
        </text>
      )}
    </g>
  );
}

export function Truck({ x, y, s = 1, color = C.cyan, label }: { x: number; y: number; s?: number; color?: string; label?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-70" y="-46" width="96" height="46" fill="#1d1733" stroke={color} strokeWidth={3} />
      <path d="M26 -34 L56 -34 L72 -14 L72 0 L26 0 Z" fill="#1d1733" stroke={color} strokeWidth={3} />
      <circle cx="-44" cy="4" r="11" fill="#0a0818" stroke={color} strokeWidth={3} />
      <circle cx="46" cy="4" r="11" fill="#0a0818" stroke={color} strokeWidth={3} />
      {label && (
        <text x="-22" y="-16" fill={color} fontFamily="IBM Plex Mono" fontSize="18" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
/** A die face. */
export function Die({ x, y, value, size = 70, color = '#f2ecdf', pip = '#1a1410', ring, onClick, opacity = 1 }: { x: number; y: number; value: number; size?: number; color?: string; pip?: string; ring?: string; onClick?: () => void; opacity?: number }) {
  const d = size * 0.27;
  return (
    <g opacity={opacity} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      {ring && <rect x={x - size / 2 - 6} y={y - size / 2 - 6} width={size + 12} height={size + 12} rx={size * 0.22} fill="none" stroke={ring} strokeWidth={4} />}
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={size * 0.18} fill={color} stroke="#00000040" strokeWidth={2} />
      {(PIPS[value] ?? []).map(([px, py], i) => (
        <circle key={i} cx={x + px * d} cy={y + py * d} r={size * 0.085} fill={pip} />
      ))}
    </g>
  );
}

const SUIT: Record<string, { s: string; c: string }> = { o: { s: '♦', c: '#c8283c' }, c: { s: '♥', c: '#c8283c' }, p: { s: '♠', c: '#14101e' }, t: { s: '♣', c: '#14101e' } };
/** A playing card: rank (A,2..10,J,Q,K) and suit (o ♦, c ♥, p ♠, t ♣). */
export function PlayingCard({ x, y, rank, suit, w = 90, faceDown = false, ring, onClick, opacity = 1 }: { x: number; y: number; rank: string; suit: keyof typeof SUIT; w?: number; faceDown?: boolean; ring?: string; onClick?: () => void; opacity?: number }) {
  const h = w * 1.4;
  const S = SUIT[suit];
  return (
    <Group opacity={opacity}>
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
        {ring && <rect x={x - w / 2 - 6} y={y - h / 2 - 6} width={w + 12} height={h + 12} rx={10} fill="none" stroke={ring} strokeWidth={4} />}
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={faceDown ? '#2a1640' : '#f4efe6'} stroke="#00000055" strokeWidth={2} />
        {faceDown ? (
          <rect x={x - w / 2 + 8} y={y - h / 2 + 8} width={w - 16} height={h - 16} rx={4} fill="none" stroke={C.magenta} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="4 4" />
        ) : (
          <>
            <Html x={x - w / 2 + 14} y={y - h / 2 + 18} size={w * 0.24} color={S.c}>
              <span className="card-rank">{rank}</span>
            </Html>
            <Html x={x} y={y + 4} size={w * 0.5} color={S.c}>
              <span>{S.s}</span>
            </Html>
          </>
        )}
      </g>
    </Group>
  );
}

export function CasinoChip({ x, y, r = 26, color = C.magenta, label }: { x: number; y: number; r?: number; color?: string; label?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke="#fff" strokeWidth={r * 0.12} strokeDasharray={`${r * 0.3} ${r * 0.25}`} />
      <circle cx={x} cy={y} r={r * 0.5} fill={color} stroke="#0003" />
      {label && (
        <Html x={x} y={y} size={r * 0.6} color="#fff">
          <span className="prop-tag">{label}</span>
        </Html>
      )}
    </g>
  );
}

/** Generic labeled panel (screens, documents) to frame data inside a scene. */
export function Panel({ x, y, w, h, title, color = C.line, children }: { x: number; y: number; w: number; h: number; title?: string; color?: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#0b0918" fillOpacity={0.88} stroke={color} strokeWidth={2} />
      {title && (
        <Html x={x + 16} y={y + 20} size={15} anchor="left" color={C.muted}>
          <span className="panel-title">{title}</span>
        </Html>
      )}
      {children}
    </g>
  );
}
