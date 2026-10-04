import type { ReactNode } from 'react';
import { MorphTex } from '../../engine/Tex';
import { NoesisEye, type Mood } from '../ui/NoesisEye';
import { Typewriter } from '../ui/Typewriter';
import { useRun } from './context';

/** The bottom console: NOESIS speaks, the current formula lives here, actions on the right. */
export function Console({
  text,
  tex,
  mood = 'talk',
  skip = 0,
  onTyped,
  children,
  actions,
  label = 'NOESIS',
  tone,
}: {
  text: string;
  tex?: string;
  mood?: Mood;
  skip?: number;
  onTyped?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
  label?: string;
  tone?: 'ok' | 'bad' | 'hint' | 'info';
}) {
  const run = useRun();
  return (
    <section className={`console ${tone ? 'tone-' + tone : ''}`} aria-live="polite">
      <div className="console-speaker">
        <NoesisEye size={54} mood={mood} modules={run.modules} reduced={run.reduced} />
        <span>{label}</span>
      </div>
      <div className="console-body">
        <div className="console-text">
          <Typewriter key={text} text={text} speed={run.textSpeed} skip={skip} onDone={onTyped} />
        </div>
        {tex && (
          <div className="console-tex">
            <MorphTex tex={tex} display={false} />
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
