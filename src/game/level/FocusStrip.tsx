import { useEffect, useRef, useState } from 'react';
import { AnimTex, Rich } from '../../engine/Tex';
import type { BoardLine } from './types';

const SECONDS_PER_PART = 0.9;

/**
 * Follows `target` (how far the narration has been typed) but never faster than
 * SECONDS_PER_PART for each part of the formula, so every term can be read as it is written.
 */
function usePaced(target: number, parts: number, instant: boolean) {
  const [p, setP] = useState(instant ? target : 0);
  const now = useRef(p);
  useEffect(() => {
    if (instant) {
      now.current = target;
      setP(target);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      const next = Math.min(target, now.current + dt / (Math.max(1, parts) * SECONDS_PER_PART));
      now.current = next;
      setP(next);
      if (next < target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, parts, instant]);
  return p;
}

/**
 * The formal side of the current step, written large right under the drawing that explains it.
 * Parts marked \p{n}{…} are written one after another at the pace of the narration; when the
 * line says what each part means (`parts`), each one takes a colour and a brace with its label.
 * The explanation fades in once the formula is complete. When the player moves on, it flies to
 * the rail.
 */
export function FocusStrip({
  lines,
  progress,
  tone,
  instant = false,
}: {
  lines: BoardLine[];
  progress: number;
  tone?: 'note';
  instant?: boolean;
}) {
  // one line after another: each line owns a share of the progress proportional to its parts
  const sizes = lines.map((l) => Math.max(1, (l.tex.match(/\\p\{/g) ?? []).length));
  const parts = sizes.reduce((a, b) => a + b, 0);
  const p = usePaced(progress, parts, instant);
  let before = 0;
  const local = sizes.map((n) => {
    const v = Math.min(1, Math.max(0, (p * parts - before) / n));
    before += n;
    return v;
  });
  return (
    <div className={`focus-strip ${lines.length ? 'on' : ''} ${tone ?? ''}`} aria-live="polite">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`focus-line ${line.parts?.length ? 'with-parts' : ''} ${i > 0 && local[i] <= 0 ? 'waiting' : ''}`}
          data-focus-line
        >
          {line.label && <span className="focus-label">{line.label}</span>}
          {line.tex && (
            <div className="focus-tex">
              <AnimTex tex={line.tex} progress={local[i]} display labels={line.parts} />
            </div>
          )}
          {line.body && (
            <p className="focus-body" style={{ opacity: local[i] > 0.6 ? 1 : 0 }}>
              <Rich text={line.body} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
