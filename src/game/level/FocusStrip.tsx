import { AnimTex, Rich } from '../../engine/Tex';
import type { BoardLine } from './types';

/**
 * The formal side of the current step, written large right under the drawing that explains it.
 * Parts marked \p{n}{…} appear one after another with the step's animation; the explanation
 * fades in once the formula is complete. When the player moves on, it flies to the rail.
 */
export function FocusStrip({ lines, progress, tone }: { lines: BoardLine[]; progress: number; tone?: 'note' }) {
  return (
    <div className={`focus-strip ${lines.length ? 'on' : ''} ${tone ?? ''}`} aria-live="polite">
      {lines.map((line, i) => (
        <div key={i} className="focus-line" data-focus-line>
          {line.label && <span className="focus-label">{line.label}</span>}
          {line.tex && (
            <div className="focus-tex">
              <AnimTex tex={line.tex} progress={progress} display />
            </div>
          )}
          {line.body && (
            <p className="focus-body" style={{ opacity: progress > 0.6 ? 1 : 0 }}>
              <Rich text={line.body} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
