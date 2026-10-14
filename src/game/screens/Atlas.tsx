import { useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import { SECTORS, SECTOR_BY_ID, sectorStars, sectorState } from '../../content/registry';
import type { WorldId } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

/** every world that `w` builds on, directly or through others */
function ancestors(w: WorldId, acc = new Set<WorldId>()): Set<WorldId> {
  for (const p of SECTOR_BY_ID[w].prerequisites) {
    if (!acc.has(p)) {
      acc.add(p);
      ancestors(p, acc);
    }
  }
  return acc;
}
/** worlds that list `w` as a direct prerequisite */
const nextOf = (w: WorldId) =>
  SECTORS.filter((s) => s.prerequisites.includes(w)).sort((a, b) => a.number - b.number);
const byNumber = (ws: Iterable<WorldId>) =>
  [...ws].map((w) => SECTOR_BY_ID[w]).sort((a, b) => a.number - b.number);

function Sym({ s, scale = 1 }: { s: (typeof SECTORS)[number]; scale?: number }) {
  if (!s.tex) return <>{s.symbol}</>;
  return (
    <Tex tex={`\\boldsymbol{${s.tex}}`} style={{ fontSize: `${(s.texSize ?? 1) * scale}em` }} />
  );
}

/** Links bow sideways when a straight line would cross another district or its label. */
const LINK_PATHS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  const quad = (a: number[], c: number[], b: number[], t: number) => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  for (const s of SECTORS)
    for (const p of s.prerequisites) {
      const a = SECTOR_BY_ID[p].at;
      const b = s.at;
      const obstacles = SECTORS.filter((o) => o.world !== p && o.world !== s.world).flatMap(
        ({ at: [x, y] }) => [
          [x, y],
          [x, y + 62],
          [x - 52, y + 66],
          [x + 52, y + 66],
        ],
      );
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let best = { bend: 0, clear: -1, c: m };
      for (const bend of [0, 0.12, -0.12, 0.2, -0.2, 0.3, -0.3]) {
        const c = [m[0] - dy * bend, m[1] + dx * bend];
        let clear = Infinity;
        for (let i = 2; i <= 18; i++) {
          const q = quad(a, c, b, i / 20);
          for (const o of obstacles) clear = Math.min(clear, Math.hypot(q[0] - o[0], q[1] - o[1]));
        }
        // a straighter line wins unless the bend buys real clearance
        const score = Math.min(clear, 80) - Math.abs(bend) * 90;
        if (score > best.clear) best = { bend, clear: score, c };
      }
      out[p + s.world] =
        `M${a[0]} ${a[1]} Q${best.c[0].toFixed(1)} ${best.c[1].toFixed(1)} ${b[0]} ${b[1]}`;
    }
  return out;
})();

/** City map of Valparaíso 2089: districts on the hills and the bay, linked by prerequisites. */
export function Atlas({ onOpen, reduced }: { onOpen: (w: WorldId) => void; reduced: boolean }) {
  const game = useGame();
  const [hover, setHover] = useState<WorldId | null>(null);
  const [selected, setSelected] = useState<WorldId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const firstOpen =
    SECTORS.find((s) => sectorState(game, s.world) === 'open')?.world ?? 'foundations';
  const focus = hover ?? selected ?? firstOpen;
  const meta = SECTOR_BY_ID[focus];
  const st = sectorState(game, focus);
  const stars = sectorStars(game, focus);
  // the highlighted world: its whole chain of prerequisites lights up, and its next worlds too
  const hl = hover ?? selected;
  const chain = hl ? ancestors(hl) : null;
  const next = hl ? new Set(nextOf(hl).map((s) => s.world)) : null;
  const before = byNumber(ancestors(focus));
  const after = nextOf(focus);

  const click = (w: WorldId) => {
    const s = sectorState(game, w);
    if (s === 'sealed') {
      sfx.glitch();
      setToast(
        `${SECTOR_BY_ID[w].name}: este distrito todavía no está abierto a la investigación.`,
      );
      setTimeout(() => setToast(null), 2600);
      return;
    }
    if (s === 'locked') {
      sfx.bad();
      setToast(
        `Primero hay que cerrar: ${SECTOR_BY_ID[w].prerequisites.map((p) => SECTOR_BY_ID[p].name).join(', ')}.`,
      );
      setTimeout(() => setToast(null), 2600);
      return;
    }
    sfx.select();
    onOpen(w);
  };

  return (
    <div className="atlas">
      <div className="atlas-mobile menu-list" aria-label="Mundos">
        {[...SECTORS]
          .sort((a, b) => a.number - b.number)
          .map((sector) => {
            const state = sectorState(game, sector.world);
            const ss = sectorStars(game, sector.world);
            const open = state === 'open' || state === 'done';
            const status =
              state === 'done'
                ? 'Completado'
                : state === 'open'
                  ? 'Disponible'
                  : state === 'sealed'
                    ? 'En preparación'
                    : `Requiere cerrar: ${sector.prerequisites.map((p) => SECTOR_BY_ID[p].name).join(' · ')}`;
            const expanded = selected === sector.world;
            return (
              <section
                key={sector.world}
                className={`menu-list-item ${expanded ? 'selected' : ''}`}
                style={{ ['--accent' as string]: sector.accent }}
              >
                <button
                  className="menu-list-row"
                  aria-expanded={expanded}
                  aria-controls={`world-detail-${sector.world}`}
                  onClick={() => setSelected(sector.world)}
                >
                  <span className="menu-list-symbol" aria-hidden>
                    <Sym s={sector} scale={0.8} />
                  </span>
                  <span className="menu-list-copy">
                    <strong>
                      {sector.number}. {sector.area}
                    </strong>
                    <span>{sector.name}</span>
                    <span className="menu-list-meta">
                      {ss.total > 0 && (
                        <>
                          ★ {ss.got}/{ss.max} ·{' '}
                        </>
                      )}
                      {status}
                    </span>
                  </span>
                </button>
                {expanded && (
                  <div className="menu-list-detail" id={`world-detail-${sector.world}`}>
                    <p>{sector.hook}</p>
                    <p className="menu-list-meta">{status}</p>
                    {open && (
                      <button className="btn primary" onClick={() => click(sector.world)}>
                        Entrar al mundo ▸
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
      </div>
      <div className="atlas-stage">
        <Stage grid={false}>
          {/* sea and coastline */}
          <path
            d="M0 640 C 220 600 420 690 620 680 C 860 670 1040 610 1260 640 C 1420 660 1520 620 1600 600 L1600 900 L0 900 Z"
            fill="#071a2a"
          />
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
          <text
            x="1440"
            y="860"
            fill="#1f5470"
            fontFamily="IBM Plex Mono"
            fontSize="22"
            letterSpacing="8"
          >
            BAHÍA
          </text>
          {/* links: with a world highlighted, its chain of prerequisites flows towards it */}
          {SECTORS.flatMap((s) =>
            s.prerequisites.map((p) => {
              const live = sectorState(game, p) === 'done';
              const inChain = !!hl && chain!.has(p) && (s.world === hl || chain!.has(s.world));
              const outgoing = !!hl && p === hl;
              const dim = !!hl && !inChain && !outgoing;
              const color = inChain
                ? SECTOR_BY_ID[hl!].accent
                : outgoing
                  ? s.accent
                  : live
                    ? C.cyan
                    : '#3a2f60';
              return (
                <path
                  key={p + s.world}
                  d={LINK_PATHS[p + s.world]}
                  fill="none"
                  stroke={color}
                  strokeWidth={inChain ? 4 : outgoing ? 3 : live ? 2.5 : 1.5}
                  strokeDasharray={
                    inChain ? '14 10' : outgoing ? '4 8' : live ? undefined : '6 8'
                  }
                  strokeLinecap="round"
                  className={(inChain || outgoing) && !reduced ? 'atlas-flow' : undefined}
                  opacity={dim ? 0.18 : inChain ? 0.95 : outgoing ? 0.8 : 0.7}
                  style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                />
              );
            }),
          )}
          {SECTORS.map((s) => {
            const state = sectorState(game, s.world);
            const [x, y] = s.at;
            const open = state === 'open' || state === 'done';
            const col = open ? s.accent : '#5d5478';
            const ss = sectorStars(game, s.world);
            const faded =
              !!hl && s.world !== hl && !chain!.has(s.world) && !next!.has(s.world);
            return (
              <g
                key={s.world}
                className="atlas-node"
                opacity={faded ? 0.35 : 1}
                onMouseEnter={() => {
                  if (window.matchMedia('(hover: none)').matches) return;
                  setHover(s.world);
                  sfx.hover();
                }}
                onMouseLeave={() => {
                  if (!window.matchMedia('(hover: none)').matches) setHover(null);
                }}
                onClick={() => {
                  if (window.matchMedia('(hover: none)').matches) {
                    setHover(null);
                    setSelected(s.world);
                  } else click(s.world);
                }}
                style={{ cursor: 'pointer' }}
              >
                {state === 'open' && !reduced && (
                  <circle
                    cx={x}
                    cy={y}
                    r={46}
                    fill="none"
                    stroke={col}
                    strokeWidth={2}
                    className="pulse-ring"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={34}
                  fill={state === 'done' ? col : '#0c0a1c'}
                  fillOpacity={state === 'done' ? 0.22 : 1}
                  stroke={col}
                  strokeWidth={hl === s.world ? 4 : chain?.has(s.world) ? 3.5 : 2.5}
                  strokeDasharray={state === 'sealed' ? '4 6' : undefined}
                />
                <Html x={x} y={y} size={30} color={open ? '#fff' : '#5d5478'}>
                  <span className="atlas-sym">
                    <Sym s={s} />
                  </span>
                </Html>
                <Html x={x} y={y + 48} size={17} anchor="top" color={open ? C.text : '#6d6488'}>
                  <span className="atlas-label">
                    {s.number}. {s.area}
                    <small>{s.name}</small>
                  </span>
                </Html>
                {ss.total > 0 && (
                  <Html x={x} y={y - 54} size={14} color={C.amber}>
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
          MUNDO {meta.number} · DISTRITO {meta.name.toUpperCase()}
        </span>
        <h2>{meta.area}</h2>
        <p className="atlas-hook">{meta.hook}</p>
        <div className="atlas-route">
          <p>
            <span>SE APOYA EN</span>
            {before.length
              ? before.map((b) => (
                  <em key={b.world} style={{ ['--accent' as string]: b.accent }}>
                    {b.number}. {b.area}
                  </em>
                ))
              : ' Nada: es el punto de partida.'}
          </p>
          {after.length > 0 && (
            <p>
              <span>LLEVA A</span>
              {after.map((b) => (
                <em key={b.world} style={{ ['--accent' as string]: b.accent }}>
                  {b.number}. {b.area}
                </em>
              ))}
            </p>
          )}
        </div>
        {st === 'sealed' ? (
          <p className="atlas-state sealed">
            En preparación: los temas de este mundo aún no están escritos.
          </p>
        ) : st === 'locked' ? (
          <p className="atlas-state locked">
            Requiere cerrar: {meta.prerequisites.map((p) => SECTOR_BY_ID[p].name).join(' · ')}
          </p>
        ) : (
          <>
            <p className="atlas-state open">
              {st === 'done' ? 'Mundo completado' : 'Disponible'} · {stars.done}/{stars.total} casos
              · ★ {stars.got}/{stars.max}
            </p>
            <button className="btn primary" onClick={() => click(focus)}>
              Entrar al mundo ▸
            </button>
          </>
        )}
      </aside>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
