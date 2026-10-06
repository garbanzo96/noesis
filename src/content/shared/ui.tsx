import type { PointerEventHandler, ReactNode } from 'react';
import { fmt } from '../../engine/anim';
import { C } from '../../engine/palette';
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

/** A round drag handle with a small caption inside. */
export function Knob({ x, y, color = C.cyan, r = 18, label, onPointerDown, cursor = 'grab' }: { x: number; y: number; color?: string; r?: number; label?: ReactNode; onPointerDown?: PointerEventHandler; cursor?: string }) {
  return (
    <g onPointerDown={onPointerDown} style={{ cursor }}>
      <circle cx={x} cy={y} r={r + 16} fill="transparent" />
      <circle cx={x} cy={y} r={r} fill={C.panel} stroke={color} strokeWidth={3} />
      {label !== undefined && (
        <Html x={x} y={y} size={13} color={color}>
          <span className="prop-tag">{label}</span>
        </Html>
      )}
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
