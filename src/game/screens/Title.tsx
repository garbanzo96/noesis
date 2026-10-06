import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { store, useGame } from '../state';

export function Title({ onContinue, onCodex, onSettings }: { onContinue: () => void; onCodex: () => void; onSettings: () => void }) {
  const game = useGame();
  const done = Object.values(game.levels).filter((l) => l.done).length;
  const start = () => {
    sfx.boot();
    store.update((s) => ({ ...s, booted: true }));
    onContinue();
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
        <span className="title-kicker">AGENCIA DE INVESTIGACIÓN</span>
        <h1 className="logo" data-text="NÓESIS">
          NÓESIS
        </h1>
        <p className="title-sub">Valparaíso, 2089. La ciudad miente con números. Tú no.</p>
        <nav className="title-menu">
          <button className="btn primary big" onClick={start}>
            {done ? 'Continuar la investigación' : 'Empezar'} ▸
          </button>
          <button className="btn" onClick={onCodex}>
            Cuaderno y léxico
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
