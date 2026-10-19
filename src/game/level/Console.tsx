import type { ReactNode } from 'react';
import { CAST, Portrait, type CastId } from '../../art/cast';
import { MorphTex } from '../../engine/Tex';
import { Typewriter } from '../ui/Typewriter';
import { useRun } from './context';

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
  return (
    <section className={`console ${tone ? 'tone-' + tone : ''}`} aria-live="polite">
      <div className="console-speaker" style={{ ['--who' as string]: CAST[speaker].color }}>
        <div className="console-face">
          <Portrait id={speaker} size={64} />
        </div>
        <span>{CAST[speaker].name.split(' ')[0]}</span>
      </div>
      <div className="console-body">
        <div className="console-text">
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
