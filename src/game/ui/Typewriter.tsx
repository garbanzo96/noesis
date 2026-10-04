import { useEffect, useMemo, useRef, useState } from 'react';
import { renderTex, useGlyphHover } from '../../engine/Tex';
import { sfx } from '../audio';

// Types rich text ($math$ and **bold**) progressively. Math segments appear whole.
// `instant` (or a click / Space handled by the parent via `skipKey`) completes it.
type Part = { kind: 'text'; s: string; bold: boolean } | { kind: 'math'; s: string };

function split(text: string): Part[] {
  const out: Part[] = [];
  const re = /\$([^$]+)\$|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: 'text', s: text.slice(last, m.index), bold: false });
    if (m[1] !== undefined) out.push({ kind: 'math', s: m[1] });
    else out.push({ kind: 'text', s: m[2], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', s: text.slice(last), bold: false });
  return out;
}

const SPEED = { slow: 28, normal: 55, instant: 1e9 } as const;

export function Typewriter({
  text,
  speed = 'normal',
  skip = 0,
  onDone,
  sound = true,
  className,
}: {
  text: string;
  speed?: keyof typeof SPEED;
  /** increment to force completion */
  skip?: number;
  onDone?: () => void;
  sound?: boolean;
  className?: string;
}) {
  const parts = useMemo(() => split(text), [text]);
  const total = useMemo(() => parts.reduce((n, p) => n + (p.kind === 'math' ? 1 : p.s.length), 0), [parts]);
  const [shown, setShown] = useState(speed === 'instant' ? total : 0);
  const done = useRef(false);
  const doneCb = useRef(onDone);
  doneCb.current = onDone;
  useEffect(() => {
    done.current = false;
    if (speed === 'instant') {
      setShown(total);
      return;
    }
    setShown(0);
    let raf = 0;
    const start = performance.now();
    const cps = SPEED[speed];
    const loop = (now: number) => {
      const n = Math.min(total, Math.floor(((now - start) / 1000) * cps));
      setShown((prev) => {
        if (n > prev && sound) sfx.tick();
        return Math.max(prev, n);
      });
      if (n < total) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [text, speed, total, sound]);
  useEffect(() => {
    if (skip > 0) setShown(total);
  }, [skip, total]);
  useEffect(() => {
    if (shown >= total && !done.current) {
      done.current = true;
      doneCb.current?.();
    }
  }, [shown, total]);
  const hover = useGlyphHover();
  let budget = shown;
  return (
    <span className={`typewriter ${className ?? ''}`} {...hover}>
      {parts.map((p, i) => {
        if (budget <= 0) return null;
        if (p.kind === 'math') {
          budget -= 1;
          return <span key={i} className="tex" dangerouslySetInnerHTML={{ __html: renderTex(p.s) }} />;
        }
        const s = p.s.slice(0, budget);
        budget -= p.s.length;
        return p.bold ? <strong key={i}>{s}</strong> : <span key={i}>{s}</span>;
      })}
      {shown < total && <span className="caret">▍</span>}
    </span>
  );
}
