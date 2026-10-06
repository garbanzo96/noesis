import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { store, useGame } from '../state';

export function Title({ onContinue, onPrologue, onCodex, onSettings }: { onContinue: () => void; onPrologue: () => void; onCodex: () => void; onSettings: () => void }) {
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
        <p className="title-sub">Valparaíso, 2089. La ciudad miente con números. Tú no.</p>
        <nav className="title-menu">
          <button className="btn primary big" onClick={start}>
            {done ? 'Continuar la investigación' : 'Empezar'} ▸
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
        <p className="title-meta">{done ? `${done} casos cerrados · ${game.xp} XP` : 'Pulsa Enter para empezar'}</p>
      </div>
    </div>
  );
}
