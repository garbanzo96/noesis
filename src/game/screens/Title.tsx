import { useEffect, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { store, useGame } from '../state';
import { NoesisEye } from '../ui/NoesisEye';
import { Typewriter } from '../ui/Typewriter';

const BOOT = [
  'NOESIS · arquitectura de inferencia activa · v3',
  'Diagnóstico: 14 sectores cognitivos fragmentados.',
  'Percepción: offline. Aprendizaje: offline. Acción: offline.',
  'Operador humano detectado. Restaurar requiere reconstruir mi matemática desde el primer símbolo.',
];

export function Title({
  onContinue,
  onCodex,
  onSettings,
  reduced,
}: {
  onContinue: () => void;
  onCodex: () => void;
  onSettings: () => void;
  reduced: boolean;
}) {
  const game = useGame();
  const [phase, setPhase] = useState<'press' | 'boot' | 'menu'>(game.booted ? 'menu' : 'press');
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState(false);
  const done = Object.values(game.levels).filter((l) => l.done).length;

  useEffect(() => setTyped(false), [line]);
  const advanceBoot = () => {
    if (!typed) return;
    if (line < BOOT.length - 1) setLine(line + 1);
    else {
      store.update((s) => ({ ...s, booted: true }));
      setPhase('menu');
    }
  };
  const start = () => {
    sfx.boot();
    setPhase('boot');
  };
  useKey([' ', 'Enter'], (e) => {
    e.preventDefault();
    if (phase === 'press') start();
    else if (phase === 'boot') advanceBoot();
    else onContinue();
  });
  // auto-advance the boot log after each line types out
  useEffect(() => {
    if (phase !== 'boot' || !typed) return;
    const id = setTimeout(advanceBoot, line === BOOT.length - 1 ? 1100 : 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, phase, line]);

  return (
    <div className="title-screen" onClick={() => phase === 'press' && start()}>
      <div className="title-eye">
        <NoesisEye size={340} mood={phase === 'boot' ? 'talk' : 'idle'} modules={game.modules.length} reduced={reduced} />
      </div>
      <div className="title-block">
        <h1 className="logo" data-text="NÓESIS">
          NÓESIS
        </h1>
        <p className="title-sub">ENIGMA · protocolo matemático hacia Active Inference</p>
        {phase === 'press' && (
          <button className="press" onClick={start}>
            ▸ PULSA ESPACIO PARA INICIAR
          </button>
        )}
        {phase === 'boot' && (
          <div className="boot-log" onClick={advanceBoot}>
            {BOOT.slice(0, line).map((l, i) => (
              <p key={i}>
                <span>›</span> {l}
              </p>
            ))}
            <p>
              <span>›</span> <Typewriter key={line} text={BOOT[line]} speed="normal" onDone={() => setTyped(true)} />
            </p>
          </div>
        )}
        {phase === 'menu' && (
          <nav className="title-menu">
            <button className="btn primary big" onClick={onContinue} autoFocus>
              {done ? 'Continuar restauración' : 'Comenzar restauración'} ▸
            </button>
            <button className="btn" onClick={onCodex}>
              Códex y léxico
            </button>
            <button className="btn" onClick={onSettings}>
              Ajustes
            </button>
            <p className="title-meta">
              {done} protocolos completados · {game.xp} XP · {game.modules.length}/14 módulos
            </p>
          </nav>
        )}
      </div>
      <footer className="title-foot">
        Animación inspirada en las convenciones de 3Blue1Brown · motor propio · contenido de las guías ENIGMA
      </footer>
    </div>
  );
}
