import { useEffect, useRef } from 'react';
import { AnimTex, Rich } from '../../engine/Tex';
import { useFitTex } from './fitTex';
import type { Beat, BoardLine } from './types';

export const linesOf = (b: Beat): BoardLine[] =>
  b.board ? (Array.isArray(b.board) ? b.board : [b.board]) : [];

/**
 * The lesson blackboard as a record. Each formula is first written large under the drawing
 * (FocusStrip); when the player moves on it is filed here. The newest entry stands out; older
 * ones stay compact so the column never competes with the stage.
 */
export function Board({
  title,
  beats,
  current,
}: {
  title: string;
  beats: Beat[];
  current: number;
}) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);
  const rows: { line: BoardLine; beat: number }[] = [];
  beats.forEach((b, i) => {
    if (i < current) for (const line of linesOf(b)) rows.push({ line, beat: i });
  });
  const lastBeat = rows.length ? rows[rows.length - 1].beat : -1;
  const box = useRef<HTMLElement>(null);
  useFitTex(box, [current, rows.length]);
  return (
    <aside className="board" aria-label="Pizarra" ref={box}>
      <header>
        <span>PIZARRA</span>
        <b>{title}</b>
      </header>
      {rows.length === 0 && (
        <p className="notebook-empty">Lo formal de cada paso se guarda aquí cuando sigues.</p>
      )}
      <ol>
        {rows.map(({ line, beat }, i) => {
          const newest = beat === lastBeat;
          return (
            <li
              key={`${beat}-${i}`}
              className={newest ? 'newest' : 'past'}
              ref={i === rows.length - 1 ? end : undefined}
            >
              {line.label && <span className="note-label">{line.label}</span>}
              <div className="board-tex">
                <AnimTex tex={line.tex} progress={1} />
              </div>
              {line.body && newest && (
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
