import { useState } from 'react';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import {
  currentSession,
  exportSession,
  gameMode,
  resetState,
  setGameMode,
  setSettings,
  useGame,
  type GameMode,
} from '../state';
import { MODE_NAME } from './Sessions';

export function SettingsScreen({
  onClose,
  onSessions,
}: {
  onClose: () => void;
  onSessions: () => void;
}) {
  const game = useGame();
  const s = game.settings;
  const who = currentSession()?.name ?? '';
  const [msg, setMsg] = useState('');
  useKey('Escape', onClose);
  const download = () => {
    const blob = new Blob([exportSession()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = who.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase();
    a.download = `noesis-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <h2>Ajustes</h2>
        <label className="row">
          <span>Efectos de sonido</span>
          <input
            type="checkbox"
            checked={s.sfx}
            onChange={(e) => setSettings({ sfx: e.target.checked })}
          />
        </label>
        <label className="row">
          <span>Ambiente sonoro</span>
          <input
            type="checkbox"
            checked={s.music}
            onChange={(e) => setSettings({ music: e.target.checked })}
          />
        </label>
        <label className="row">
          <span>Volumen</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(e) => setSettings({ volume: Number(e.target.value) })}
            onMouseUp={() => sfx.ok()}
          />
        </label>
        <label className="row">
          <span>Velocidad del texto</span>
          <select
            value={s.textSpeed}
            onChange={(e) => setSettings({ textSpeed: e.target.value as typeof s.textSpeed })}
          >
            <option value="slow">Lenta</option>
            <option value="normal">Normal</option>
            <option value="instant">Instantánea</option>
          </select>
        </label>
        <label className="row">
          <span>Movimiento reducido</span>
          <input
            type="checkbox"
            checked={s.reducedMotion}
            onChange={(e) => setSettings({ reducedMotion: e.target.checked })}
          />
        </label>
        <label className="row">
          <span>
            Modo de juego <small>Aventura sigue la historia en orden; Completo abre todo</small>
          </span>
          <select value={gameMode(game)} onChange={(e) => setGameMode(e.target.value as GameMode)}>
            {(['adventure', 'complete'] as const).map((m) => (
              <option key={m} value={m}>
                {MODE_NAME[m]}
              </option>
            ))}
          </select>
        </label>
        <div className="settings-data">
          <span>PROGRESO DE {who.toUpperCase()} (GUARDADO EN ESTE EQUIPO)</span>
          <div>
            <button className="btn small" onClick={download}>
              Guardar una copia
            </button>
            <button className="btn small" onClick={onSessions}>
              Cambiar sesión
            </button>
            <button
              className="btn small danger"
              onClick={() => {
                if (window.confirm(`¿Borrar todo el progreso de ${who}?`)) {
                  resetState();
                  setMsg('Progreso reiniciado.');
                }
              }}
            >
              Reiniciar
            </button>
          </div>
          {msg && <p>{msg}</p>}
        </div>
        <button className="btn primary" onClick={onClose}>
          Volver
        </button>
      </div>
    </div>
  );
}
