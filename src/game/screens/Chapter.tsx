import { PLACE_ART } from '../../art/assets';
import { CAST, Portrait, type CastId } from '../../art/cast';
import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { PLAYABLE, SECTOR_BY_ID } from '../../content/registry';
import type { LevelDef, WorldId } from '../level/types';
import { sfx } from '../audio';
import { Sym } from './CityMap';

/**
 * Chapter card shown before the first case of a world when the player follows the story:
 * where we are, why we came, who is waiting, what this district teaches.
 */
export function Chapter({
  world,
  first,
  onStart,
  onBoard,
  onMap,
  reduced,
}: {
  world: WorldId;
  first: LevelDef;
  onStart: () => void;
  onBoard: () => void;
  onMap: () => void;
  reduced: boolean;
}) {
  const def = PLAYABLE[world]!;
  const meta = SECTOR_BY_ID[world];
  const TEAM = ['iris', 'teo', 'noesis', 'contador', 'nar', 'tu'];
  const contact = (def.levels.map((l) => l.guide).find((g) => g && !TEAM.includes(g)) ??
    def.levels
      .flatMap((l) => l.steps)
      .flatMap((st) => (st.kind === 'scene' ? st.lines.map((ln) => ln.who) : []))
      .find((w) => !TEAM.includes(w))) as CastId | undefined;
  const topics = def.levels.filter((l) => l.kind !== 'boss').map((l) => l.subtitle);
  useKey([' ', 'Enter'], (e) => {
    if ((e.target as HTMLElement)?.closest('button')) return;
    e.preventDefault();
    sfx.select();
    onStart();
  });
  return (
    <div
      className={`chapter ${reduced ? '' : 'animate'}`}
      style={{ ['--accent' as string]: meta.accent }}
    >
      <div className="chapter-bg">
        {PLACE_ART.has(def.place) ? (
          <img src={`${import.meta.env.BASE_URL}art/places/${def.place}.webp`} alt="" />
        ) : (
          <Backdrop place={def.place} dim={0.2} />
        )}
      </div>
      <div className="chapter-shade" />
      <div className="scene-rain" aria-hidden />
      <section className="chapter-copy">
        <span className="chapter-kicker">
          CAPÍTULO {String(meta.number).padStart(2, '0')} · VALPARAÍSO 2089
        </span>
        <h1 className="chapter-title">
          <span className="chapter-sym">
            <Sym s={meta} />
          </span>
          {meta.name}
        </h1>
        <p className="chapter-area">{meta.area}</p>
        <p className="chapter-hook">{def.description}</p>
        <div className="chapter-topics">
          <span>LO QUE VAS A APRENDER AQUÍ</span>
          <ol>
            {topics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>
        <div className="chapter-actions">
          <button className="btn primary big" onClick={onStart}>
            Empezar caso {first.code} · {first.title} ▸
          </button>
          <button className="btn" onClick={onBoard}>
            Ver el tablero del mundo
          </button>
          <button className="btn ghost" onClick={onMap}>
            Mapa
          </button>
        </div>
      </section>
      {contact && (
        <aside className="chapter-contact">
          <Portrait id={contact} size={340} />
          <p>
            <b>{CAST[contact].name}</b>
            <span>{CAST[contact].role}</span>
          </p>
        </aside>
      )}
    </div>
  );
}
