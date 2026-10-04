import { useState } from 'react';
import { useKey } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Rich, Tex } from '../../engine/Tex';
import { GLYPHS, levelState, nextLevel, sectorStars } from '../../content/registry';
import type { LevelDef, SectorDef } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

function circuit(a: [number, number], b: [number, number]) {
  // orthogonal trace with a rounded elbow, like a PCB route
  const [x1, y1] = a;
  const [x2, y2] = b;
  const mx = x1 + (x2 - x1) * 0.5;
  const r = Math.min(24, Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2);
  if (Math.abs(y2 - y1) < 2) return `M${x1} ${y1}L${x2} ${y2}`;
  const sy = Math.sign(y2 - y1);
  const sx = Math.sign(x2 - x1) || 1;
  return `M${x1} ${y1}L${mx - r * sx} ${y1}Q${mx} ${y1} ${mx} ${y1 + r * sy}L${mx} ${y2 - r * sy}Q${mx} ${y2} ${mx + r * sx} ${y2}L${x2} ${y2}`;
}

export function SectorMap({
  sector,
  onPlay,
  reduced,
}: {
  sector: SectorDef;
  onPlay: (l: LevelDef) => void;
  reduced: boolean;
}) {
  const game = useGame();
  const [hover, setHover] = useState<string | null>(null);
  const recommended = nextLevel(game, sector.world);
  const focusId = hover ?? recommended?.id ?? sector.levels[0].id;
  const focus = sector.levels.find((l) => l.id === focusId)!;
  const fstate = levelState(game, focus);
  const rec = game.levels[focus.id];
  const stars = sectorStars(game, sector.world);
  const byId = Object.fromEntries(sector.levels.map((l) => [l.id, l]));

  const play = (l: LevelDef) => {
    const st = levelState(game, l);
    if (st === 'locked' || st === 'wip') {
      sfx.bad();
      setHover(l.id);
      return;
    }
    sfx.select();
    onPlay(l);
  };

  useKey('Enter', () => recommended && play(recommended));

  return (
    <div className="sector" style={{ ['--accent' as string]: sector.accent }}>
      <div className="sector-stage">
        <Stage>
          {sector.zones.map((z) => (
            <Html key={z.label} x={z.x} y={z.y} size={16} color={C.dim}>
              <span className="zone-label">{z.label}</span>
            </Html>
          ))}
          {sector.levels.flatMap((l) =>
            l.requires.map((r) => {
              const from = byId[r];
              if (!from) return null;
              const d = circuit(from.pos, l.pos);
              const live = game.levels[r]?.done;
              return (
                <g key={r + l.id}>
                  <path d={d} fill="none" stroke={live ? sector.accent : C.line} strokeWidth={live ? 2.5 : 2} opacity={live ? 0.55 : 0.8} />
                  {live && !reduced && (
                    <path
                      d={d}
                      fill="none"
                      stroke={sector.accent}
                      strokeWidth={3.5}
                      strokeDasharray="4 46"
                      className="flow flow-50"
                    />
                  )}
                </g>
              );
            }),
          )}
          {sector.levels.map((l) => {
            const st = levelState(game, l);
            const boss = l.kind === 'boss';
            const r = boss ? 62 : 44;
            const [x, y] = l.pos;
            const col = boss ? C.magenta : sector.accent;
            const isRec = recommended?.id === l.id;
            const got = game.levels[l.id]?.stars ?? [false, false, false];
            return (
              <g
                key={l.id}
                onMouseEnter={() => {
                  setHover(l.id);
                  sfx.hover();
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => play(l)}
                style={{ cursor: st === 'locked' || st === 'wip' ? 'not-allowed' : 'pointer' }}
              >
                {isRec && !reduced && (
                  <circle cx={x} cy={y} r={r + 12} fill="none" stroke={col} strokeWidth={2} className="pulse-ring" />
                )}
                {boss && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 10}
                    fill="none"
                    stroke={col}
                    strokeWidth={2}
                    strokeDasharray="14 10"
                    opacity={0.6}
                    className={reduced ? undefined : 'spin-slow'}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={st === 'done' ? col : C.panel}
                  fillOpacity={st === 'done' ? 0.16 : 1}
                  stroke={col}
                  strokeWidth={hover === l.id ? 4 : 2.5}
                  opacity={st === 'locked' || st === 'wip' ? 0.4 : 1}
                  strokeDasharray={st === 'wip' ? '6 7' : undefined}
                  filter={st === 'open' || st === 'done' ? 'url(#glow)' : undefined}
                />
                <Html x={x} y={y} size={boss ? 34 : 28} color={st === 'locked' || st === 'wip' ? C.dim : C.text}>
                  <Tex tex={l.glyph} />
                </Html>
                <Html x={x} y={y + r + 10} size={15} anchor="top" color={st === 'locked' || st === 'wip' ? C.dim : C.muted}>
                  <span className="node-label">
                    {l.code} · {l.title}
                  </span>
                </Html>
                {st === 'done' && (
                  <Html x={x} y={y - r - 14} size={15}>
                    <span className="node-stars">
                      {got.map((g, i) => (
                        <b key={i} className={g ? 'on' : ''}>
                          ★
                        </b>
                      ))}
                    </span>
                  </Html>
                )}
              </g>
            );
          })}
        </Stage>
      </div>
      <aside className="sector-panel">
        <span className="eyebrow">
          SECTOR {String(sector.number).padStart(2, '0')} · {sector.tag.toUpperCase()}
        </span>
        <h2>{sector.name}</h2>
        {stars.done === 0 && (
          <div className="sector-intro">
            {sector.intro.map((l, i) => (
              <p key={i}>
                <span>›</span> <Rich text={l} />
              </p>
            ))}
          </div>
        )}
        <div className="sector-progress">
          <span>
            {stars.done}/{stars.total} protocolos
          </span>
          <span>
            ★ {stars.got}/{stars.max}
          </span>
        </div>
        <div className="level-card">
          <span className="level-card-code">
            {focus.kind === 'boss' ? 'NÚCLEO' : 'PROTOCOLO'} {focus.code}
          </span>
          <h3>{focus.title}</h3>
          <p className="level-card-sub">{focus.subtitle}</p>
          <p className="level-card-obj">
            <Rich text={focus.objective} />
          </p>
          {focus.glyphs.length > 0 && (
            <div className="level-card-glyphs">
              {focus.glyphs.map((g) => (
                <span key={g} className={`glyph-chip ${game.glyphs.includes(g) ? 'known' : ''}`}>
                  <Tex tex={GLYPHS[g]?.tex ?? g} />
                </span>
              ))}
            </div>
          )}
          {fstate === 'wip' ? (
            <p className="level-card-lock">◇ En construcción</p>
          ) : fstate === 'locked' ? (
            <p className="level-card-lock">
              ⌁ Requiere {focus.requires.map((r) => byId[r]?.code).join(', ')}
            </p>
          ) : (
            <button className="btn primary" onClick={() => play(focus)}>
              {rec?.done ? 'Repetir' : 'Iniciar'} {focus.code} ▸ {focus.id === recommended?.id && <kbd>Enter</kbd>}
            </button>
          )}
          {rec?.done && (
            <p className="level-card-best">
              Mejor: {rec.stars.filter(Boolean).length}/3 ★ · {rec.attempts} intento{rec.attempts === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className="sector-module">
          <span>MÓDULO DEL NÚCLEO</span>
          <b>{sector.module.name}</b>
          <p>{sector.module.description}</p>
        </div>
      </aside>
    </div>
  );
}
