import { useState } from 'react';
import { Play, Pause, RotateCcw, Target, CheckCircle2 } from '../ui/icons';
import type { WorldId, Params } from '../../domain/types';
import { format } from '../../domain/math';
import { models, initialParams } from './models';
import { Geometry } from './Geometry';
import { useTimeline } from '../../hooks/useTimeline';
import { Math } from '../ui/Math';
export function Laboratory({
  world,
  reducedMotion,
  accredited,
  locked,
  onComplete,
}: {
  world: WorldId;
  reducedMotion: boolean;
  accredited: boolean;
  locked: boolean;
  onComplete: () => void;
}) {
  const model = models[world];
  const [p, setP] = useState<Params>(() => initialParams(world));
  const [feedback, setFeedback] = useState('');
  const { time, playing, setPlaying, setTime } = useTimeline(8, reducedMotion);
  const reset = () => {
    setP(initialParams(world));
    setTime(0);
    setFeedback('');
  };
  return (
    <div className="scene-shell">
      <div className="scene-eyebrow">
        LABORATORIO / {model.title}
        <span>NUEVO CASO / PARÁMETROS DEL LABORATORIO</span>
      </div>
      <Geometry world={world} p={p} t={time} />
      <div className="instrument-readouts">
        {model.readout(p).map((r) => (
          <div key={r.label}>
            <span>{r.label}</span>
            <strong>
              {format(r.value)} <small>{r.unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className="scene-controls">
        <button
          aria-label={playing ? 'Pausar simulación' : 'Animar simulación'}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button aria-label="Restaurar laboratorio" onClick={reset}>
          <RotateCcw size={16} />
        </button>
        <span className="muted">El movimiento ilustra; los valores los controlas tú.</span>
      </div>
      <div className="parameter-grid">
        {model.controls.map((c) => (
          <label key={c.key}>
            <span>
              {c.label}
              <output>
                {format(p[c.key], c.step >= 1 ? 0 : 2)} {c.unit}
              </output>
            </span>
            <input
              type="range"
              aria-label={c.label}
              min={c.min}
              max={c.max}
              step={c.step}
              value={p[c.key]}
              onChange={(e) => {
                setP({ ...p, [c.key]: +e.target.value });
                setFeedback('');
              }}
            />
          </label>
        ))}
      </div>
      <div className="scene-equation">
        <Math tex={model.formula(p)} block />
      </div>
      <div className="field-challenge">
        <div>
          <span className="eyebrow">
            <Target size={13} /> OBJETIVO DE CAMPO · 80 XP
          </span>
          <p>{model.target}</p>
        </div>
        <button
          className={accredited ? 'success' : 'primary'}
          disabled={locked}
          onClick={() => {
            if (model.check(p)) {
              onComplete();
              setFeedback('Configuración verificada. El modelo cumple el objetivo.');
            } else
              setFeedback(
                'Todavía no cumple el objetivo. Compara los valores del panel con la condición pedida.',
              );
          }}
        >
          {accredited ? (
            <>
              <CheckCircle2 size={16} /> Verificado
            </>
          ) : (
            'Verificar sistema'
          )}
        </button>
      </div>
      {locked && (
        <p className="inline-note">
          Puedes explorar este laboratorio. Su acreditación requiere los mundos previos.
        </p>
      )}
      <p className="field-feedback" role="status">
        {feedback}
      </p>
      <div className="principle">
        <span>QUÉ ESTÁ MOSTRANDO</span>
        <p>{model.principle}</p>
      </div>
    </div>
  );
}
