import { useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { SECTORS, SECTOR_BY_ID, sectorStars, sectorState } from '../../content/registry';
import type { WorldId } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

/** The atlas of NOESIS's mind: 14 sectors wired by mathematical dependency. */
export function Atlas({ onOpen, reduced }: { onOpen: (w: WorldId) => void; reduced: boolean }) {
  const game = useGame();
  const [hover, setHover] = useState<WorldId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const focus = hover ?? 'foundations';
  const meta = SECTOR_BY_ID[focus];
  const st = sectorState(game, focus);
  const stars = sectorStars(game, focus);

  const edges = SECTORS.flatMap((s) => s.prerequisites.map((p) => ({ from: SECTOR_BY_ID[p], to: s })));
  const click = (w: WorldId) => {
    const s = sectorState(game, w);
    if (s === 'sealed') {
      sfx.glitch();
      setToast(`Sector ${String(SECTOR_BY_ID[w].number).padStart(2, '0')} sellado: su protocolo jugable aún no está construido.`);
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (s === 'locked') {
      sfx.bad();
      setToast(`Requiere restaurar: ${SECTOR_BY_ID[w].prerequisites.map((p) => SECTOR_BY_ID[p].name).join(', ')}.`);
      setTimeout(() => setToast(null), 2600);
      return;
    }
    sfx.select();
    onOpen(w);
  };

  return (
    <div className="atlas">
      <div className="atlas-stage">
        <Stage grid={false}>
          {edges.map(({ from, to }, i) => {
            const [x1, y1] = from.at;
            const [x2, y2] = to.at;
            const mx = (x1 + x2) / 2;
            const d = `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
            const live = sectorState(game, from.world) === 'done';
            const lit = hover === to.world || hover === from.world;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={lit ? C.violet : C.line} strokeWidth={lit ? 2.5 : 1.5} opacity={lit ? 0.9 : 0.6} />
                {live && !reduced && (
                  <path
                    d={d}
                    fill="none"
                    stroke={from.accent}
                    strokeWidth={3}
                    strokeDasharray="6 60"
                    className="flow flow-66"
                  />
                )}
              </g>
            );
          })}
          {SECTORS.map((s) => {
            const state = sectorState(game, s.world);
            const [x, y] = s.at;
            const r = 46;
            const hex = Array.from({ length: 6 }, (_, k) => {
              const a = (Math.PI / 3) * k + Math.PI / 6;
              return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
            }).join(' ');
            const col = state === 'sealed' ? C.dim : s.accent;
            const ss = sectorStars(game, s.world);
            return (
              <g
                key={s.world}
                className="atlas-node"
                onMouseEnter={() => {
                  setHover(s.world);
                  sfx.hover();
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => click(s.world)}
                style={{ cursor: 'pointer' }}
              >
                {state === 'open' && !reduced && (
                  <circle cx={x} cy={y} r={r + 14} fill="none" stroke={col} strokeWidth={2} className="pulse-ring" />
                )}
                <polygon
                  points={hex}
                  fill={state === 'done' ? col : C.panel}
                  fillOpacity={state === 'done' ? 0.18 : 1}
                  stroke={col}
                  strokeWidth={hover === s.world ? 3.5 : 2}
                  strokeDasharray={state === 'sealed' ? '5 6' : undefined}
                  opacity={state === 'locked' ? 0.5 : state === 'sealed' ? 0.55 : 1}
                  filter={state === 'open' || hover === s.world ? 'url(#glow)' : undefined}
                />
                <Html x={x} y={y - 2} size={36} color={state === 'sealed' ? C.dim : C.text}>
                  <span className="atlas-sym">{s.symbol}</span>
                </Html>
                <Html x={x} y={y + r + 12} size={16} anchor="top" color={state === 'sealed' ? C.dim : C.muted}>
                  <span className="atlas-label">
                    {String(s.number).padStart(2, '0')} · {s.name}
                  </span>
                </Html>
                {ss.total > 0 && (
                  <Html x={x} y={y - r - 16} size={14} color={C.amber}>
                    <span>
                      ★ {ss.got}/{ss.max}
                    </span>
                  </Html>
                )}
              </g>
            );
          })}
        </Stage>
      </div>
      <aside className="atlas-panel" style={{ ['--accent' as string]: meta.accent }}>
        <span className="eyebrow">
          SECTOR {String(meta.number).padStart(2, '0')} · {meta.tag.toUpperCase()}
        </span>
        <h2>{meta.name}</h2>
        <p>{meta.description}</p>
        <div className="atlas-cap">
          <span>CAPACIDAD QUE RESTAURA</span>
          <p>{meta.capability}</p>
        </div>
        {st === 'sealed' ? (
          <p className="atlas-state sealed">◇ Sellado · protocolo en construcción</p>
        ) : st === 'locked' ? (
          <p className="atlas-state locked">
            ⌁ Requiere: {meta.prerequisites.map((p) => SECTOR_BY_ID[p].name).join(' · ')}
          </p>
        ) : (
          <>
            <p className="atlas-state open">
              {st === 'done' ? '✓ Módulo restaurado' : '● Disponible'} · {stars.done}/{stars.total} protocolos · ★{' '}
              {stars.got}/{stars.max}
            </p>
            <button className="btn primary" onClick={() => click(focus)}>
              Entrar al sector ▸
            </button>
          </>
        )}
        <p className="atlas-route">
          Ruta mínima al agente discreto: 01 → 05 → 10 → 08 → 04 → 02 → 11 → 12 → 13 → 14
        </p>
      </aside>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
