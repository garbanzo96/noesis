import { Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Backdrop } from '../../art/places';
import { LEVELS } from '../../content/registry';
import { sfx } from '../audio';
import {
  createSession,
  currentSession,
  deleteSession,
  enterSession,
  importSession,
  sessionSummary,
  sessions,
  type GameMode,
} from '../state';

export const MODE_NAME: Record<GameMode, string> = { adventure: 'Aventura', complete: 'Completo' };
const MODES: { id: GameMode; text: string }[] = [
  {
    id: 'adventure',
    text: 'Sigues la historia en orden. Cada caso que cierras abre el siguiente.',
  },
  { id: 'complete', text: 'Todo abierto desde el inicio, para estudiar o repasar cualquier tema.' },
];
const TOTAL = Object.values(LEVELS).filter((l) => !l.wip).length;

/** Who is playing on this device: pick a session, open a new one or bring one from a backup. */
export function Sessions({ onReady }: { onReady: () => void }) {
  const [, redraw] = useState(0);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<GameMode>('adventure');
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const list = sessions();
  const showForm = adding || list.length === 0;

  const ready = () => {
    sfx.boot();
    onReady();
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (createSession(name, mode)) ready();
    else setError('Escribe un nombre para abrir el expediente.');
  };
  const remove = (id: string, who: string) => {
    if (!window.confirm(`¿Borrar la sesión de ${who}? Su progreso se pierde en este equipo.`))
      return;
    deleteSession(id);
    redraw((n) => n + 1);
  };
  const load = async (f: File | undefined) => {
    if (!f) return;
    // a real backup is a few KB: never read more than the importer accepts
    const text = await f.slice(0, 2_000_001).text();
    if (importSession(text)) ready();
    else setError('Ese archivo no es una copia de NÓESIS.');
  };

  return (
    <div className="title-screen">
      <Backdrop place="puerto" className="title-bg" />
      <div className="scene-rain" aria-hidden />
      <div className="sessions">
        <h1>{list.length ? '¿Quién sigue la investigación?' : 'Abre tu expediente'}</h1>
        {list.length > 0 && (
          <ul className="session-list">
            {list.map((s) => {
              const m = sessionSummary(s.id);
              return (
                <li key={s.id}>
                  <button
                    className="session-open"
                    onClick={() => {
                      enterSession(s.id);
                      ready();
                    }}
                  >
                    <b>{s.name}</b>
                    <span>
                      {MODE_NAME[m.mode]} · {m.done} de {TOTAL} casos ·{' '}
                      {m.xp.toLocaleString('es-CL')} XP
                    </span>
                  </button>
                  <button
                    className="session-del"
                    aria-label={`Borrar la sesión de ${s.name}`}
                    title="Borrar sesión"
                    onClick={() => remove(s.id, s.name)}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {showForm && (
          <form className="session-form" onSubmit={submit}>
            <label className="session-field">
              <span>Tu nombre</span>
              <input
                type="text"
                value={name}
                maxLength={24}
                autoFocus
                autoComplete="off"
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
              />
            </label>
            <fieldset className="session-modes">
              <legend>Cómo quieres jugar</legend>
              {MODES.map((m) => (
                <label className="session-mode" key={m.id}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === m.id}
                    onChange={() => setMode(m.id)}
                  />
                  <b>{MODE_NAME[m.id]}</b>
                  <span>{m.text}</span>
                </label>
              ))}
            </fieldset>
            <button className="btn primary big" type="submit">
              Abrir expediente ▸
            </button>
          </form>
        )}
        {error && (
          <p className="session-error" role="alert">
            {error}
          </p>
        )}
        <div className="session-actions">
          {!showForm && (
            <button className="btn" onClick={() => setAdding(true)}>
              Nueva sesión
            </button>
          )}
          <button className="btn" onClick={() => file.current?.click()}>
            Cargar una copia
          </button>
          {currentSession() && (
            <button className="btn ghost" onClick={onReady}>
              Volver
            </button>
          )}
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void load(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        <p className="session-note">
          Tu nombre y tu progreso quedan en este equipo y no se envían a ningún lado. Para seguir en
          otro computador, guarda una copia desde Ajustes. El modo se puede cambiar cuando quieras,
          sin perder lo avanzado.
        </p>
      </div>
    </div>
  );
}
