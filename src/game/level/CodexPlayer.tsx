import { useKey } from '../../engine/hooks';
import { CODEX } from '../../content/registry';
import { sfx } from '../audio';
import { CodexCard } from '../ui/CodexCard';
import { Console, KeyHint } from './Console';
import { useRun } from './context';
import type { CodexStep } from './types';

export function CodexPlayer({ step }: { step: CodexStep }) {
  const run = useRun();
  const entry = CODEX[step.entry];
  const finish = () => {
    sfx.unlock();
    run.complete();
  };
  useKey([' ', 'Enter'], (e) => {
    e.preventDefault();
    finish();
  }, !run.paused);
  return (
    <div className="play">
      <div className="play-stage codex-stage">
        <div className="shard-in">{entry ? <CodexCard entry={entry} /> : <p>Entrada {step.entry} no encontrada.</p>}</div>
      </div>
      <Console
        text="Formalización. Esta ficha queda archivada en el **Códex** (tecla C en cualquier momento). Pasa el cursor sobre cualquier símbolo para leer su significado."
        mood="ok"
        actions={
          <button className="btn primary pulse" onClick={finish}>
            Archivar y cerrar protocolo ▸
          </button>
        }
      >
        <div className="console-keys">
          <KeyHint k="ESPACIO">archivar</KeyHint>
        </div>
      </Console>
    </div>
  );
}
