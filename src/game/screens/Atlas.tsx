import { useState } from 'react';
import { Stage } from '../../engine/Stage';
import { CityMap, Sym, ancestors, nextOf } from './CityMap';
import { SECTORS, SECTOR_BY_ID, sectorStars, sectorState } from '../../content/registry';
import type { WorldId } from '../level/types';
import { sfx } from '../audio';
import { useGame } from '../state';

const byNumber = (ws: Iterable<WorldId>) =>
  [...ws].map((w) => SECTOR_BY_ID[w]).sort((a, b) => a.number - b.number);

/** City map of Valparaíso 2089: districts on the hills and the bay, linked by prerequisites. */
export function Atlas({
  onOpen,
  reduced,
  onContinue,
  continueLabel,
}: {
  onOpen: (w: WorldId) => void;
  reduced: boolean;
  onContinue?: () => void;
  continueLabel?: string;
}) {
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
    <div className="atlas atlas-v2">
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
                    <p className="menu-list-meta">
                      Se apoya en:{' '}
                      {byNumber(ancestors(sector.world))
                        .map((b) => `${b.number}. ${b.area}`)
                        .join(' · ') || 'nada, es el punto de partida'}
                    </p>
                    {nextOf(sector.world).length > 0 && (
                      <p className="menu-list-meta">
                        Lleva a:{' '}
                        {nextOf(sector.world)
                          .map((b) => `${b.number}. ${b.area}`)
                          .join(' · ')}
                      </p>
                    )}
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
          <CityMap
            game={game}
            hl={hl}
            next={firstOpen}
            reduced={reduced}
            onHover={(w) => {
              if (window.matchMedia('(hover: none)').matches) return;
              setHover(w);
              if (w) sfx.hover();
            }}
            onPick={(w) => {
              if (window.matchMedia('(hover: none)').matches) {
                setHover(null);
                setSelected(w);
              } else click(w);
            }}
          />
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
      {onContinue && (
        <button className="btn primary atlas-continue" onClick={onContinue}>
          <span>Continuar la historia ▸</span>
          {continueLabel && <small>{continueLabel}</small>}
        </button>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
