import { useRef, useState } from 'react';
import { Download, Upload, Volume2, Accessibility } from '../ui/icons';
import type { GameState } from '../../domain/types';
import type { GameAction } from '../../engine/useGame';
import { parseState, serializeState } from '../../engine/persistence';
export function Settings({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (a: GameAction) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const exportData = () => {
    const blob = new Blob([serializeState(state)], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'noesis-progreso.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Progreso exportado.');
  };
  return (
    <main className="panel-page settings-page">
      <span className="eyebrow">CONFIGURAR EL PROTOCOLO</span>
      <h1>Tu ritmo. Tu cuaderno.</h1>
      <div className="settings-grid">
        <section>
          <h2>
            <Accessibility size={21} /> Lectura y movimiento
          </h2>
          <label className="setting-switch">
            <span>
              Pausar animaciones automáticas
              <small>Avanza manualmente por etapas o fotogramas.</small>
            </span>
            <input
              type="checkbox"
              checked={state.settings.reducedMotion}
              onChange={(e) =>
                dispatch({ type: 'settings', settings: { reducedMotion: e.target.checked } })
              }
            />
          </label>
          <label className="setting-switch">
            <span>
              Información compacta<small>Reduce el espaciado, conserva el tamaño de lectura.</small>
            </span>
            <input
              type="checkbox"
              checked={state.settings.density === 'compact'}
              onChange={(e) =>
                dispatch({
                  type: 'settings',
                  settings: { density: e.target.checked ? 'compact' : 'comfortable' },
                })
              }
            />
          </label>
          <label className="setting-switch">
            <span>
              <Volume2 size={16} /> Sonido al resolver
              <small>Señales breves, sin música de fondo.</small>
            </span>
            <input
              type="checkbox"
              checked={state.settings.sound}
              onChange={(e) =>
                dispatch({ type: 'settings', settings: { sound: e.target.checked } })
              }
            />
          </label>
        </section>
        <section>
          <h2>Portabilidad del progreso</h2>
          <p>
            El progreso se guarda en este navegador. Exporta una copia para continuar en otro equipo
            o compartir tu registro.
          </p>
          <div className="settings-actions">
            <button onClick={exportData}>
              <Download size={16} /> Exportar
            </button>
            <button onClick={() => input.current?.click()}>
              <Upload size={16} /> Importar
            </button>
          </div>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const data = await file.text();
              if (parseState(data)) {
                dispatch({ type: 'import', data });
                setMessage('Copia importada y evidencias validadas.');
              } else
                setMessage(
                  'El archivo no es una copia válida de NÓESIS. Tu progreso actual sigue disponible.',
                );
              e.target.value = '';
            }}
          />
          <p role="status">{message}</p>
        </section>
        <section className="source-panel">
          <h2>ENIGMA · fuentes y alcance</h2>
          <p>
            Contenido elaborado a partir de las guías G00–G13, tus apuntes bayesianos y Active
            Inference (Parr, Pezzulo y Friston, 2022). La campaña introduce y aplica las
            operaciones; las cápsulas desarrollan definiciones, identidades, demostraciones breves y
            extensiones.
          </p>
          <p>
            15 animaciones originales renderizadas con{' '}
            <a href="https://github.com/3b1b/manim" target="_blank" rel="noreferrer">
              ManimGL de 3Blue1Brown
            </a>
            . Motor MIT; escenas propias. Los repositorios videos y 3Blue1Brown.com se revisaron
            como referencias de exposición.
          </p>
          <p>
            Las recompensas registran la resolución de problemas concretos. No certifican dominio
            duradero ni todas las extensiones del libro. F se refiere a inferencia sobre datos; G a
            políticas futuras bajo la convención de preferencias declarada.
          </p>
          <a href="/licenses/Manim-MIT.txt">Licencia Manim</a> ·{' '}
          <a href="/licenses/KATEX-LICENSE.txt">Licencia KaTeX</a>
        </section>
      </div>
    </main>
  );
}
