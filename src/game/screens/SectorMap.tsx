import { useState } from 'react';
import { useKey } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Rich, Tex } from '../../engine/Tex';
import { GLYPHS, levelState, nextLevel, sectorStars } from '../../content/registry';
import type { LevelDef, SectorDef } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

const CARD_W = 210;
const CARD_H = 130;

function CaseDetail({
  level: focus,
  play,
  onResources,
}: {
  level: LevelDef;
  play: (level: LevelDef, step?: number) => void;
  onResources: (id: string) => void;
}) {
  const game = useGame();
  const fstate = levelState(game, focus);
  const rec = game.levels[focus.id];
  const lessonAt = focus.steps.findIndex((st) => st.kind === 'lesson');
  const demoStep = lessonAt >= 0 ? lessonAt : focus.steps.findIndex((st) => st.kind === 'demo');
  const practiceStep = focus.steps.findIndex((st) => st.kind === 'challenge');
  return (
    <div className="level-card">
      <span className="level-card-code">
        {focus.kind === 'boss' ? 'CASO PRINCIPAL' : 'CASO'} {focus.code}
      </span>
      <h3>{focus.title}</h3>
      <p className="level-card-sub">{focus.subtitle}</p>
      <p className="level-card-obj">
        <Rich text={focus.teaser} />
      </p>
      <p className="level-card-learn">
        <span>APRENDES</span> <Rich className="case-learn-text" text={focus.learn} />
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
        <p className="level-card-lock">En preparación.</p>
      ) : (
        <>
          <button className="btn primary" onClick={() => play(focus)}>
            {rec?.done ? 'Repetir caso' : 'Abrir caso'} {focus.code} ▸
          </button>
          <div className="level-card-alt">
            {demoStep > 0 && (
              <button className="btn small" onClick={() => play(focus, demoStep)}>
                Solo la clase
              </button>
            )}
            {practiceStep > 0 && (
              <button className="btn small" onClick={() => play(focus, practiceStep)}>
                Solo la práctica
              </button>
            )}
            {focus.ref && (
              <button className="btn small ghost" onClick={() => onResources(focus.id)}>
                Recursos del tema
              </button>
            )}
          </div>
        </>
      )}
      {rec?.done && (
        <p className="level-card-best">
          Mejor resultado: {rec.stars.filter(Boolean).length}/3 ★ · {rec.attempts} intento
          {rec.attempts === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}

/** The district board: case files pinned on cork, red string between dependent cases. */
export function SectorMap({
  sector,
  onPlay,
  onResources,
  reduced,
}: {
  sector: SectorDef;
  onPlay: (l: LevelDef, step?: number) => void;
  onResources: (id: string) => void;
  reduced: boolean;
}) {
  const game = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const touch = () => window.matchMedia('(hover: none)').matches;
  const [hover, setHover] = useState<string | null>(null);
  const recommended = nextLevel(game, sector.world);
  const focusId = hover ?? selected ?? recommended?.id ?? sector.levels[0].id;
  const focus = sector.levels.find((l) => l.id === focusId)!;
  const stars = sectorStars(game, sector.world);
  const byId = Object.fromEntries(sector.levels.map((l) => [l.id, l]));

  const play = (l: LevelDef, step?: number) => {
    if (levelState(game, l) === 'wip') {
      sfx.bad();
      setHover(l.id);
      return;
    }
    sfx.select();
    onPlay(l, step);
  };
  useKey('Enter', (e) => {
    if ((e.target as HTMLElement)?.closest('button, select')) return;
    if (recommended) play(recommended);
  });

  return (
    <div className="sector" style={{ ['--accent' as string]: sector.accent }}>
      <div className="sector-mobile menu-list">
        <header className="sector-mobile-head">
          <span className="eyebrow">
            MUNDO {sector.number} · DISTRITO {sector.tag.toUpperCase()}
          </span>
          <h2>{sector.name}</h2>
          <p className="sector-desc">{sector.description}</p>
          <div className="sector-progress">
            <span>
              {stars.done}/{stars.total} casos cerrados
            </span>
            <span>
              ★ {stars.got}/{stars.max}
            </span>
          </div>
        </header>
        {sector.levels.map((level) => {
          const state = levelState(game, level);
          const got = game.levels[level.id]?.stars.filter(Boolean).length ?? 0;
          const expanded = selected === level.id;
          return (
            <section key={level.id} className={`menu-list-item ${expanded ? 'selected' : ''}`}>
              <button
                className="menu-list-row"
                aria-expanded={expanded}
                aria-controls={`case-detail-${level.id}`}
                onClick={() => setSelected(level.id)}
              >
                <span className="menu-list-copy">
                  <span className="menu-list-code">CASO {level.code}</span>
                  <strong>{level.title}</strong>
                  <span>{level.subtitle}</span>
                  <span className="menu-list-meta">
                    ★ {got}/3 ·{' '}
                    {state === 'done'
                      ? 'Cerrado'
                      : state === 'wip'
                        ? 'En preparación'
                        : 'Disponible'}
                  </span>
                </span>
              </button>
              {expanded && (
                <div id={`case-detail-${level.id}`}>
                  <CaseDetail level={level} play={play} onResources={onResources} />
                </div>
              )}
            </section>
          );
        })}
      </div>
      <div className="sector-stage">
        <Stage grid={false}>
          <defs>
            <pattern id="cork" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#1a1322" />
              <circle cx="2" cy="3" r="0.9" fill="#261b31" />
              <circle cx="6" cy="6" r="0.7" fill="#120d19" />
            </pattern>
          </defs>
          <rect
            x="20"
            y="20"
            width="1560"
            height="860"
            rx="10"
            fill="url(#cork)"
            stroke="#2c2140"
            strokeWidth={8}
          />
          {/* red strings */}
          {sector.levels.flatMap((l) =>
            l.requires.map((r) => {
              const a = byId[r];
              if (!a) return null;
              const [x1, y1] = a.pos;
              const [x2, y2] = l.pos;
              const sag = 40 + Math.abs(x2 - x1) * 0.08;
              const live = game.levels[r]?.done;
              return (
                <path
                  key={r + l.id}
                  d={`M${x1} ${y1 - CARD_H / 2 + 8} Q${(x1 + x2) / 2} ${Math.max(y1, y2) - CARD_H / 2 + 8 + sag} ${x2} ${y2 - CARD_H / 2 + 8}`}
                  fill="none"
                  stroke={live ? '#ff4d6d' : '#7a2a3a'}
                  strokeWidth={live ? 3 : 2}
                  opacity={live ? 0.95 : 0.55}
                />
              );
            }),
          )}
          {sector.levels.map((l, i) => {
            const st = levelState(game, l);
            const boss = l.kind === 'boss';
            const [x, y] = l.pos;
            const w = boss ? CARD_W + 40 : CARD_W;
            const h = boss ? CARD_H + 20 : CARD_H;
            const tilt = ((i * 37) % 7) - 3;
            const isRec = recommended?.id === l.id;
            const got = game.levels[l.id]?.stars ?? [false, false, false];
            const locked = st === 'wip';
            return (
              <g
                key={l.id}
                transform={`rotate(${tilt} ${x} ${y})`}
                onMouseEnter={() => {
                  if (touch()) return;
                  setHover(l.id);
                  sfx.hover();
                }}
                onMouseLeave={() => {
                  if (!touch()) setHover(null);
                }}
                onClick={() => {
                  if (touch()) {
                    setHover(null);
                    setSelected(l.id);
                  } else play(l);
                }}
                style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
                className={`case-card ${isRec && !reduced ? 'rec' : ''}`}
              >
                <rect
                  x={x - w / 2 + 6}
                  y={y - h / 2 + 8}
                  width={w}
                  height={h}
                  fill="#000"
                  opacity={0.45}
                />
                <rect
                  x={x - w / 2}
                  y={y - h / 2}
                  width={w}
                  height={h}
                  fill={locked ? '#2a2433' : boss ? '#efe2c2' : '#e8e0cf'}
                  stroke={hover === l.id ? sector.accent : isRec ? sector.accent : 'none'}
                  strokeWidth={4}
                />
                {/* folder tab */}
                <rect
                  x={x - w / 2}
                  y={y - h / 2}
                  width={w}
                  height={28}
                  fill={locked ? '#332b40' : boss ? '#b8343f' : '#c9b98f'}
                />
                <circle cx={x} cy={y - h / 2 + 8} r={8} fill="#d23" stroke="#600" strokeWidth={2} />
                <Html
                  x={x - w / 2 + 12}
                  y={y - h / 2 + 14}
                  size={15}
                  anchor="left"
                  color={locked ? '#6d6488' : boss ? '#fff' : '#3a2f22'}
                  style={{ rotate: `${tilt}deg` }}
                >
                  <span className="card-code">CASO {l.code}</span>
                </Html>
                <Html
                  x={x}
                  y={y + 12}
                  size={21}
                  color={locked ? '#6d6488' : '#1a1410'}
                  style={{ rotate: `${tilt}deg` }}
                >
                  <span className="card-title">{l.title}</span>
                  <span className="card-sub" style={{ color: locked ? '#5d5478' : '#5a4a36' }}>
                    {l.subtitle}
                  </span>
                </Html>
                {st === 'done' && (
                  <>
                    <Html
                      x={x + w / 2 - 12}
                      y={y + h / 2 - 16}
                      size={16}
                      anchor="right"
                      color="#b8343f"
                    >
                      <span className="card-stars">
                        {got.map((g, k) => (
                          <b key={k} style={{ opacity: g ? 1 : 0.25 }}>
                            ★
                          </b>
                        ))}
                      </span>
                    </Html>
                    <g transform={`rotate(-14 ${x - 30} ${y + 40})`} opacity={0.75}>
                      <rect
                        x={x - 90}
                        y={y + 26}
                        width={120}
                        height={30}
                        fill="none"
                        stroke="#b8343f"
                        strokeWidth={3}
                      />
                      <Html
                        x={x - 30}
                        y={y + 41}
                        size={14}
                        color="#b8343f"
                        style={{ rotate: `${tilt - 14}deg` }}
                      >
                        <span className="card-stamp">CERRADO</span>
                      </Html>
                    </g>
                  </>
                )}
              </g>
            );
          })}
          <Html x={60} y={60} size={18} anchor="top-left" color={C.muted}>
            <span className="board-title">
              MUNDO {sector.number} · {sector.name.toUpperCase()} · TABLERO DE{' '}
              {sector.tag.toUpperCase()}
            </span>
          </Html>
        </Stage>
      </div>
      <aside className="sector-panel">
        <span className="eyebrow">
          MUNDO {sector.number} · DISTRITO {sector.tag.toUpperCase()}
        </span>
        <h2>{sector.name}</h2>
        <p className="sector-desc">{sector.description}</p>
        <div className="sector-progress">
          <span>
            {stars.done}/{stars.total} casos cerrados
          </span>
          <span>
            ★ {stars.got}/{stars.max}
          </span>
        </div>
        <CaseDetail level={focus} play={play} onResources={onResources} />
      </aside>
    </div>
  );
}
