import { useRef, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { exportState, importState, resetState, setSettings, useGame } from '../state';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const game = useGame();
  const s = game.settings;
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useKey('Escape', onClose);
  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `noesis-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <h2>Ajustes</h2>
        <label className="row">
          <span>Efectos de sonido</span>
          <input type="checkbox" checked={s.sfx} onChange={(e) => setSettings({ sfx: e.target.checked })} />
        </label>
        <label className="row">
          <span>Ambiente sonoro</span>
          <input type="checkbox" checked={s.music} onChange={(e) => setSettings({ music: e.target.checked })} />
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
          <select value={s.textSpeed} onChange={(e) => setSettings({ textSpeed: e.target.value as typeof s.textSpeed })}>
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
            Modo libre <small>(abre todos los protocolos y fichas; para revisar o enseñar)</small>
          </span>
          <input type="checkbox" checked={s.freeMode} onChange={(e) => setSettings({ freeMode: e.target.checked })} />
        </label>
        <div className="settings-data">
          <span>PROGRESO (local a este navegador)</span>
          <div>
            <button className="btn small" onClick={download}>
              Exportar
            </button>
            <button className="btn small" onClick={() => file.current?.click()}>
              Importar
            </button>
            <button
              className="btn small danger"
              onClick={() => {
                if (window.confirm('¿Borrar todo el progreso de este navegador?')) {
                  resetState();
                  setMsg('Progreso reiniciado.');
                }
              }}
            >
              Reiniciar
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setMsg(importState(await f.text()) ? 'Progreso importado.' : 'Archivo no válido.');
              }}
            />
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
