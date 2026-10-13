import { useRef } from 'react';
import { Rich, Tex } from '../../engine/Tex';
import { useFitTex } from './fitTex';
import type { Note } from './types';
import { useRun } from './context';

/** The case notebook: the formal side of what the player does, filled as the case advances. */
export function Notebook({ notes }: { notes: Note[] }) {
  const run = useRun();
  const box = useRef<HTMLElement>(null);
  useFitTex(box, [notes.length]);
  return (
    <aside className="notebook" aria-label="Cuaderno del caso" ref={box}>
      <header>
        <span>CUADERNO</span>
        <b>{run.level.subtitle}</b>
      </header>
      {notes.length === 0 && (
        <p className="notebook-empty">Las notas aparecen a medida que investigas.</p>
      )}
      <ol>
        {notes.map((n, i) => (
          <li key={i}>
            <span className="note-label">{n.label}</span>
            {n.tex && (
              <div className="note-tex">
                <Tex tex={n.tex} display />
              </div>
            )}
            {n.body && (
              <p>
                <Rich text={n.body} />
              </p>
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}
