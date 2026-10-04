import { useState } from 'react';
import { useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { NoesisEye } from '../ui/NoesisEye';
import { Typewriter } from '../ui/Typewriter';
import { useRun } from './context';
import type { BriefStep } from './types';

export function BriefPlayer({ step }: { step: BriefStep }) {
  const run = useRun();
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState(false);
  const [skip, setSkip] = useState(0);
  const last = line >= step.lines.length - 1;
  const advance = () => {
    if (!typed) {
      setSkip((s) => s + 1);
      return;
    }
    if (!last) {
      sfx.advance();
      setTyped(false);
      setLine(line + 1);
    } else {
      sfx.select();
      run.complete();
    }
  };
  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    e.preventDefault();
    advance();
  }, !run.paused);
  return (
    <div className="brief" onClick={advance}>
      <div className="brief-eye">
        <NoesisEye size={220} mood="talk" modules={run.modules} reduced={run.reduced} />
        <span className="brief-id">NOESIS · núcleo de inferencia</span>
      </div>
      <div className="brief-log">
        <div className="brief-head">
          <span>PROTOCOLO {run.level.code}</span>
          <h2>{run.level.title}</h2>
          <p>{run.level.subtitle}</p>
        </div>
        <div className="brief-lines">
          {step.lines.slice(0, line).map((l, i) => (
            <p key={i} className="brief-line past">
              <span className="prompt">›</span> <Rich text={l} />
            </p>
          ))}
          <p className="brief-line">
            <span className="prompt">›</span>{' '}
            <Typewriter key={line} text={step.lines[line]} speed={run.textSpeed} skip={skip} onDone={() => setTyped(true)} />
          </p>
        </div>
        {last && typed && (
          <div className="brief-objective">
            <span>OBJETIVO</span>
            <Rich text={run.level.objective} />
          </div>
        )}
        <div className="brief-foot">
          <kbd>ESPACIO</kbd> {last && typed ? 'iniciar protocolo' : 'continuar'}
        </div>
      </div>
    </div>
  );
}
