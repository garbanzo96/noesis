import { useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { SECTORS, SECTOR_BY_ID, sectorStars, sectorState } from '../../content/registry';
import type { WorldId } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

/** City map of Valparaíso 2089: districts on the hills and the bay, linked by prerequisites. */
export function Atlas({ onOpen, reduced }: { onOpen: (w: WorldId) => void; reduced: boolean }) {
  const game = useGame();
  const [hover, setHover] = useState<WorldId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const firstOpen = SECTORS.find((s) => sectorState(game, s.world) === 'open')?.world ?? 'foundations';
  const focus = hover ?? firstOpen;
  const meta = SECTOR_BY_ID[focus];
  const st = sectorState(game, focus);
  const stars = sectorStars(game, focus);

  const click = (w: WorldId) => {
    const s = sectorState(game, w);
    if (s === 'sealed') {
      sfx.glitch();
      setToast(`${SECTOR_BY_ID[w].name}: este distrito todavía no está abierto a la investigación.`);
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (s === 'locked') {
      sfx.bad();
      setToast(`Primero hay que cerrar: ${SECTOR_BY_ID[w].prerequisites.map((p) => SECTOR_BY_ID[p].name).join(', ')}.`);
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
          {/* sea and coastline */}
          <path d="M0 640 C 220 600 420 690 620 680 C 860 670 1040 610 1260 640 C 1420 660 1520 620 1600 600 L1600 900 L0 900 Z" fill="#071a2a" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M0 ${660 + i * 26} C 300 ${640 + i * 26} 600 ${700 + i * 26} 900 ${690 + i * 26} C 1200 ${680 + i * 26} 1400 ${650 + i * 26} 1600 ${640 + i * 26}`}
              fill="none"
              stroke="#0f3a52"
              strokeWidth={1.5}
              opacity={0.6}
            />
          ))}
          {/* hills: topographic contours */}
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={'c' + i}
              d={`M0 ${560 - i * 52} C 260 ${470 - i * 52} 420 ${560 - i * 52} 640 ${500 - i * 52} C 900 ${430 - i * 52} 1100 ${540 - i * 52} 1600 ${440 - i * 52}`}
              fill="none"
              stroke="#2b2048"
              strokeWidth={1.5}
              opacity={0.8 - i * 0.05}
            />
          ))}
          <text x="1440" y="860" fill="#1f5470" fontFamily="IBM Plex Mono" fontSize="22" letterSpacing="8">
            BAHÍA
          </text>
          {/* links */}
          {SECTORS.flatMap((s) =>
            s.prerequisites.map((p) => {
              const a = SECTOR_BY_ID[p].at;
              const b = s.at;
              const live = sectorState(game, p) === 'done';
              return (
                <line key={p + s.world} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={live ? C.cyan : '#3a2f60'} strokeWidth={live ? 2.5 : 1.5} strokeDasharray={live ? undefined : '6 8'} opacity={0.7} />
              );
            }),
          )}
          {SECTORS.map((s) => {
            const state = sectorState(game, s.world);
            const [x, y] = s.at;
            const open = state === 'open' || state === 'done';
            const col = open ? s.accent : '#5d5478';
            const ss = sectorStars(game, s.world);
            return (
              <g
                key={s.world}
                onMouseEnter={() => {
                  setHover(s.world);
                  sfx.hover();
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => click(s.world)}
                style={{ cursor: 'pointer' }}
              >
                {state === 'open' && !reduced && <circle cx={x} cy={y} r={46} fill="none" stroke={col} strokeWidth={2} className="pulse-ring" />}
                <circle cx={x} cy={y} r={34} fill={state === 'done' ? col : '#0c0a1c'} fillOpacity={state === 'done' ? 0.22 : 1} stroke={col} strokeWidth={hover === s.world ? 4 : 2.5} strokeDasharray={state === 'sealed' ? '4 6' : undefined} />
                <Html x={x} y={y} size={30} color={open ? '#fff' : '#5d5478'}>
                  <span className="atlas-sym">{s.symbol}</span>
                </Html>
                <Html x={x} y={y + 50} size={17} anchor="top" color={open ? C.text : '#6d6488'}>
                  <span className="atlas-label">{s.name}</span>
                </Html>
                {ss.total > 0 && (
                  <Html x={x} y={y - 54} size={14} color={C.amber}>
                    <span>★ {ss.got}/{ss.max}</span>
                  </Html>
                )}
              </g>
            );
          })}
        </Stage>
      </div>
      <aside className="atlas-panel" style={{ ['--accent' as string]: meta.accent }}>
        <span className="eyebrow">DISTRITO · {meta.area.toUpperCase()}</span>
        <h2>{meta.name}</h2>
        <p className="atlas-hook">{meta.hook}</p>
        {st === 'sealed' ? (
          <p className="atlas-state sealed">Cerrado por ahora: el caso de este distrito aún no está escrito.</p>
        ) : st === 'locked' ? (
          <p className="atlas-state locked">Requiere cerrar: {meta.prerequisites.map((p) => SECTOR_BY_ID[p].name).join(' · ')}</p>
        ) : (
          <>
            <p className="atlas-state open">
              {st === 'done' ? 'Distrito resuelto' : 'Investigación abierta'} · {stars.done}/{stars.total} casos · ★ {stars.got}/{stars.max}
            </p>
            <button className="btn primary" onClick={() => click(focus)}>
              Ir al distrito ▸
            </button>
          </>
        )}
      </aside>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
