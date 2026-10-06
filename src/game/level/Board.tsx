import { useEffect, useRef } from 'react';
import { AnimTex, Rich } from '../../engine/Tex';
import type { Beat, BoardLine } from './types';

const linesOf = (b: Beat): BoardLine[] => (b.board ? (Array.isArray(b.board) ? b.board : [b.board]) : []);

/**
 * The lesson blackboard: formulas written so far. Lines of the current beat build up part by
 * part with the beat's animation progress; earlier lines stay, slightly dimmed.
 */
export function Board({ title, beats, current, progress }: { title: string; beats: Beat[]; current: number; progress: number }) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);
  const rows: { line: BoardLine; beat: number }[] = [];
  beats.forEach((b, i) => {
    if (i <= current) for (const line of linesOf(b)) rows.push({ line, beat: i });
  });
  return (
    <aside className="board" aria-label="Pizarra">
      <header>
        <span>PIZARRA</span>
        <b>{title}</b>
      </header>
      {rows.length === 0 && <p className="notebook-empty">Aquí se escribe lo formal, paso a paso.</p>}
      <ol>
        {rows.map(({ line, beat }, i) => {
          const now = beat === current;
          return (
            <li key={i} className={now ? 'now' : 'past'} ref={i === rows.length - 1 ? end : undefined}>
              {line.label && <span className="note-label">{line.label}</span>}
              <div className="board-tex">
                <AnimTex tex={line.tex} progress={now ? progress : 1} />
              </div>
              {line.body && (now ? progress > 0.6 : true) && (
                <p>
                  <Rich text={line.body} />
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
