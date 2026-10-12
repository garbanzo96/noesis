import type { PointerEventHandler, ReactNode } from 'react';
import { fmt } from '../../engine/anim';
import { C } from '../../engine/palette';
import { useCue } from '../../engine/cue';
import { Html } from '../../engine/Stage';

// Small pieces shared by the cases: number formatting in Spanish and stage controls.

/** Decimal comma, `d` digits at most (trailing zeros dropped by fmt). */
export const dec = (v: number, d = 1) => fmt(v, d).replace('.', ',');

/** Hours as a 24 h clock: 1.5 → "01:30". */
export const hhmm = (t: number) => {
  const total = Math.round(t * 60);
  const h = Math.floor(total / 60);
  const m = total - h * 60;
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Thousands with a thin space: 12000 → "12 000". */
export const thousands = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** The round's confirm button, bottom right of the stage. */
export function Confirm({ onClick, label = 'Confirmar', x = 1490, y = 840, disabled = false }: { onClick: () => void; label?: string; x?: number; y?: number; disabled?: boolean }) {
  return (
    <Html x={x} y={y} size={24} interactive>
      <button className="stage-btn on" onClick={onClick} disabled={disabled}>
        {label} ▸
      </button>
    </Html>
  );
}

/** Pointing hand drawn with its fingertip at (0,0). */
function HandIcon() {
  return (
    <g transform="scale(1.45) translate(-14 -2)">
      <path
        d="M14 2 C 18 2 20 5 20 9 L 20 24 L 23 22 C 27 20 31 22 31 26 L 31 27 C 34 25 38 27 38 31 L 38 32 C 41 31 44 33 44 37 L 44 50 C 44 60 38 66 29 66 L 22 66 C 15 66 11 62 8 56 L 2 44 C 0 40 2 36 6 35 C 9 34 11 36 12 38 L 8 30 L 8 9 C 8 5 10 2 14 2 Z"
        fill="#fff"
        stroke="#0b0a18"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Ghost hand repeating the drag gesture along the handle's axis. */
function GhostHand({ x, y, axis }: { x: number; y: number; axis: 'x' | 'y' | 'xy' }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <g className={`ghost-hand ghost-${axis}`}>
        <circle r={14} fill="#fff" opacity={0.18} className="ghost-press" />
        <HandIcon />
      </g>
    </g>
  );
}

/** Drag direction chevrons around a handle. */
function Chevrons({ x, y, r, axis, color }: { x: number; y: number; r: number; axis: 'x' | 'y' | 'xy'; color: string }) {
  const d = r + 12;
  const tri = (dx: number, dy: number) => {
    const ang = Math.atan2(dy, dx);
    const px = x + Math.cos(ang) * d;
    const py = y + Math.sin(ang) * d;
    const s = 7;
    const a = (k: number) => [px + Math.cos(ang + k) * s, py + Math.sin(ang + k) * s];
    const tip = [px + Math.cos(ang) * s, py + Math.sin(ang) * s];
    const l = a(2.3);
    const rr = a(-2.3);
    return `${tip[0]},${tip[1]} ${l[0]},${l[1]} ${rr[0]},${rr[1]}`;
  };
  const dirs: [number, number][] = axis === 'x' ? [[1, 0], [-1, 0]] : axis === 'y' ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  return (
    <g className="knob-chevrons" pointerEvents="none">
      {dirs.map(([dx, dy], i) => (
        <polygon key={i} points={tri(dx, dy)} fill={color} />
      ))}
    </g>
  );
}

/**
 * A drag handle that looks grabbable: grip dot, direction chevrons, a generous touch area and,
 * while the step waits for this action, a pulsing halo and a ghost hand showing the gesture.
 * `axis` defaults from the cursor (ew-resize → x, ns-resize → y, otherwise free).
 */
export function Knob({ x, y, color = C.cyan, r = 18, label, onPointerDown, cursor = 'grab', axis }: { x: number; y: number; color?: string; r?: number; label?: ReactNode; onPointerDown?: PointerEventHandler; cursor?: string; axis?: 'x' | 'y' | 'xy' }) {
  const cue = useCue();
  const ax = axis ?? (cursor === 'ew-resize' ? 'x' : cursor === 'ns-resize' ? 'y' : 'xy');
  return (
    <g
      className={`knob ${cue.active ? 'cue' : ''}`}
      onPointerDown={(e) => {
        cue.touch();
        onPointerDown?.(e);
      }}
      style={{ cursor }}
    >
      <circle cx={x} cy={y} r={r + 26} fill="transparent" />
      {cue.active && <circle className="knob-halo" cx={x} cy={y} r={r + 8} fill="none" stroke={color} strokeWidth={3} />}
      <Chevrons x={x} y={y} r={r} axis={ax} color={color} />
      <circle className="knob-body" cx={x} cy={y} r={r} fill={C.panel} stroke={color} strokeWidth={3} />
      <circle cx={x} cy={y} r={Math.max(4, r * 0.32)} fill={color} pointerEvents="none" />
      {label !== undefined && (
        <Html x={x} y={y + r + 26} size={17} color={color}>
          <span className="knob-label">{label}</span>
        </Html>
      )}
      {cue.active && <GhostHand x={x} y={y} axis={ax} />}
    </g>
  );
}

/** Row of choice buttons placed on the stage (for small discrete answers). */
export function Choices<T extends string | number>({ x, y, options, value, onPick, render, label, anchor = 'center' }: { x: number; y: number; options: T[]; value: T | null; onPick: (v: T) => void; render?: (v: T) => ReactNode; label?: string; anchor?: 'center' | 'left' | 'right' }) {
  return (
    <Html x={x} y={y} size={22} interactive anchor={anchor}>
      <div className="stage-choices">
        {label && <span className="stage-choices-label">{label}</span>}
        {options.map((o) => (
          <button key={String(o)} className={`stage-btn ${value === o ? 'on' : ''}`} onClick={() => onPick(o)}>
            {render ? render(o) : o}
          </button>
        ))}
      </div>
    </Html>
  );
}

/** Numeric answer box on the stage; Enter submits. Accepts a decimal comma. */
export function NumberField({ x, y, value, onChange, onEnter, label, unit, width = 5 }: { x: number; y: number; value: string; onChange: (v: string) => void; onEnter?: () => void; label?: string; unit?: string; width?: number }) {
  return (
    <Html x={x} y={y} size={26} interactive anchor="left">
      <label className="stage-choices">
        {label && <span className="stage-choices-label">{label}</span>}
        <input
          className="stage-input"
          style={{ width: `${width}em` }}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9,.\-−/% ]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter?.();
          }}
        />
        {unit && <span className="stage-choices-label">{unit}</span>}
      </label>
    </Html>
  );
}

/** Parse what the player typed ("12,5", "−3") into a number, or null. */
export const parseNum = (s: string) => {
  const v = Number(s.replace(',', '.').replace('−', '-'));
  return s.trim() === '' || Number.isNaN(v) ? null : v;
};

/** Parse a probability typed as "3/8", "0,375" or "37,5 %". */
export const parseProb = (s: string) => {
  const t = s.replace(/\s/g, '');
  if (t.includes('/')) {
    const [a, b] = t.split('/').map((x) => parseNum(x));
    return a === null || b === null || b === 0 ? null : a / b;
  }
  if (t.endsWith('%')) {
    const v = parseNum(t.slice(0, -1));
    return v === null ? null : v / 100;
  }
  return parseNum(t);
};
