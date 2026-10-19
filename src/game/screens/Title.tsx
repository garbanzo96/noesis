import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { store, useGame } from '../state';

export function Title({
  onContinue,
  nextLabel,
  onMap,
  onPrologue,
  onCodex,
  onSettings,
}: {
  onContinue: () => void;
  nextLabel?: string;
  onMap: () => void;
  onPrologue: () => void;
  onCodex: () => void;
  onSettings: () => void;
}) {
  const game = useGame();
  const done = Object.values(game.levels).filter((l) => l.done).length;
  const start = () => {
    sfx.boot();
    const first = !store.get().booted;
    store.update((s) => ({ ...s, booted: true }));
    if (first) onPrologue();
    else onContinue();
  };
  useKey([' ', 'Enter'], (e) => {
    if ((e.target as HTMLElement)?.closest('button, select')) return;
    e.preventDefault();
    start();
  });
  return (
    <div className="title-screen">
      <Backdrop place="puerto" className="title-bg" />
      <div className="scene-rain" aria-hidden />
      <div className="title-block">
        <span className="title-kicker">UN CURSO DE MATEMÁTICAS EN FORMA DE INVESTIGACIÓN</span>
        <h1 className="logo" data-text="NÓESIS">
          NÓESIS
        </h1>
        <p className="title-sub">Valparaíso, 2089. Alguien firma todas las cifras falsas de la ciudad con la misma letra.</p>
        <nav className="title-menu">
          <button className="btn primary big title-go" onClick={start}>
            <span>
              {done || store.get().booted
                ? 'Continuar la investigación'
                : 'Comenzar la investigación'}{' '}
              ▸
            </span>
            {nextLabel && (done || store.get().booted) && <small>{nextLabel}</small>}
          </button>
          <button className="btn" onClick={onMap}>
            Mapa de la ciudad
          </button>
          <button className="btn" onClick={onPrologue}>
            Prólogo y cómo se estudia
          </button>
          <button className="btn" onClick={onCodex}>
            Recursos de estudio
          </button>
          <button className="btn" onClick={onSettings}>
            Ajustes
          </button>
        </nav>
        <p className="title-meta">
          {done ? `${done} casos cerrados · ${game.xp} XP` : 'Pulsa Enter para empezar'}
        </p>
      </div>
    </div>
  );
}
