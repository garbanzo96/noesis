import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { CAST, Portrait, type CastId } from '../../art/cast';
import { MorphTex } from '../../engine/Tex';
import { Typewriter } from '../ui/Typewriter';
import { useRun } from './context';
import { useFitTex } from './fitTex';

/** Bottom prompt bar: the guiding character says what to do; formula below; actions right. */
export function Console({
  text,
  tex,
  skip = 0,
  onTyped,
  onProgress,
  children,
  actions,
  who,
  tone,
}: {
  text: string;
  tex?: string;
  skip?: number;
  onTyped?: () => void;
  onProgress?: (fraction: number) => void;
  children?: ReactNode;
  actions?: ReactNode;
  who?: CastId;
  tone?: 'ok' | 'bad' | 'hint' | 'info';
}) {
  const run = useRun();
  const speaker = who ?? run.guide;
  const body = useRef<HTMLDivElement>(null);
  useFitTex(body, [tex]);
  // keeps the end in view while the text is typed and what follows it appears (a question, the
  // instruction), until the player scrolls up to reread or jumps the typing to read from the top
  const follow = useRef(true);
  const lastTop = useRef(0);
  useLayoutEffect(() => {
    follow.current = run.textSpeed !== 'instant';
    lastTop.current = 0;
    if (body.current) body.current.scrollTop = 0;
  }, [text, run.textSpeed]);
  useEffect(() => {
    if (skip) follow.current = false;
  }, [skip]);
  useEffect(() => {
    const b = body.current;
    if (!b?.firstElementChild) return;
    const grew = new ResizeObserver(() => {
      if (follow.current) b.scrollTop = b.scrollHeight;
    });
    grew.observe(b.firstElementChild);
    return () => grew.disconnect();
  }, []);
  return (
    <section className={`console ${tone ? 'tone-' + tone : ''}`} aria-live="polite">
      <div className="console-speaker" style={{ ['--who' as string]: CAST[speaker].color }}>
        <div className="console-face">
          <Portrait id={speaker} size={64} />
        </div>
        <span>{CAST[speaker].name.split(' ')[0]}</span>
      </div>
      <div
        ref={body}
        className="console-body"
        onScroll={(e) => {
          const b = e.currentTarget;
          if (b.scrollTop < lastTop.current) follow.current = false;
          else if (b.scrollHeight - b.scrollTop - b.clientHeight < 4) follow.current = true;
          lastTop.current = b.scrollTop;
        }}
      >
        <div>
          <div className={`console-text ${text.length > 340 ? 'long' : ''}`}>
            <Typewriter
              key={text}
              text={text}
              speed={run.textSpeed}
              skip={skip}
              onDone={onTyped}
              onProgress={onProgress}
            />
          </div>
          {tex && (
            <div className="console-tex">
              <MorphTex tex={`\\displaystyle ${tex}`} display={false} />
            </div>
          )}
          {children}
        </div>
      </div>
      {actions && <div className="console-actions">{actions}</div>}
    </section>
  );
}

export function KeyHint({ k, children }: { k: string; children: ReactNode }) {
  return (
    <span className="keyhint">
      <kbd>{k}</kbd>
      {children}
    </span>
  );
}
