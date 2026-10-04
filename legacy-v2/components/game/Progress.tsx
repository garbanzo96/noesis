import { CheckCircle2, Lock, ArrowRight } from '../ui/icons';
import type { GameState, WorldId } from '../../domain/types';
import { worlds } from '../../content';
import { worldStatus, getProgress } from '../../engine/progress';
import { tools } from './WorldMap';
export function Progress({ state, onOpen }: { state: GameState; onOpen: (w: WorldId) => void }) {
  const complete = worlds.filter((w) => worldStatus(state, w.id) === 'complete').length;
  return (
    <main className="panel-page">
      <span className="eyebrow">INVENTARIO / TU INSTRUMENTAL</span>
      <h1>{complete} herramientas activas.</h1>
      <p>
        Cada herramienta exige tres misiones resueltas sin ayuda y un laboratorio verificado. Las
        escenas vistas se guardan por separado.
      </p>
      <div className="progress-stats">
        <div>
          <strong>{state.xp}</strong>
          <span>XP DE EVIDENCIA</span>
        </div>
        <div>
          <strong>
            {state.evidence.filter((e) => e.kind === 'puzzle' && e.correct && e.independent).length}
            /42
          </strong>
          <span>MISIONES RESUELTAS</span>
        </div>
        <div>
          <strong>{state.evidence.filter((e) => e.correct && !e.independent).length}</strong>
          <span>PRÁCTICAS ASISTIDAS</span>
        </div>
      </div>
      <div className="tool-grid">
        {worlds.map((w) => {
          const p = getProgress(state, w.id),
            done = worldStatus(state, w.id) === 'complete';
          return (
            <article key={w.id} className={`tool-card ${done ? 'unlocked' : ''}`}>
              <div className="tool-icon" style={{ color: w.accent }}>
                {done ? <CheckCircle2 size={27} /> : <Lock size={24} />}
              </div>
              <span className="eyebrow">
                {String(w.number).padStart(2, '0')} / {w.name}
              </span>
              <h3>{tools[w.number - 1]}</h3>
              <p>
                {p.puzzles.length}/3 misiones · {p.field ? 'campo verificado' : 'campo pendiente'} ·{' '}
                {p.stages.length}/5 conceptos vistos
              </p>
              <button onClick={() => onOpen(w.id)}>
                {done ? 'Revisitar' : 'Continuar'} <ArrowRight size={14} />
              </button>
            </article>
          );
        })}
      </div>
      {state.legacyXp > 0 && (
        <p className="inline-note">
          Progreso anterior conservado: {state.legacyXp} XP históricos. La campaña nueva registra
          sus propias evidencias.
        </p>
      )}
    </main>
  );
}
