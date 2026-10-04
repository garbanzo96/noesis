import { useEffect, useState } from 'react';
import { useBeats, useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { recordPrediction } from '../state';
import { Console, KeyHint } from './Console';
import { useRun } from './context';
import type { DemoStep } from './types';

export function DemoPlayer({ step }: { step: DemoStep }) {
  const run = useRun();
  const n = step.beats.length;
  const beats = useBeats(n, (b) => step.beats[b]?.dur ?? 1.4, run.reduced);
  // index of the beat whose caption finished typing (no reset effect → no race with the typewriter)
  const [typedBeat, setTypedBeat] = useState(-1);
  const typed = typedBeat === beats.beat;
  const [skip, setSkip] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => step.beats.map(() => null));
  const [unlocked, setUnlocked] = useState<boolean[]>(() => step.beats.map((b) => !b.gate));
  const beat = step.beats[beats.beat];
  const answer = answers[beats.beat];
  const needsAnswer = !!beat.ask && answer === null;
  const needsGate = !unlocked[beats.beat];
  const canAdvance = typed && !needsAnswer && !needsGate;

  useEffect(() => {
    beats.goto(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = () => {
    if (!typed) {
      setSkip((s) => s + 1);
      return;
    }
    if (!canAdvance) {
      sfx.glitch();
      return;
    }
    if (beats.beat < n - 1) {
      sfx.advance();
      beats.next();
    } else {
      sfx.select();
      run.complete();
    }
  };
  const choose = (i: number) => {
    if (!beat.ask || answer !== null) return;
    const right = i === beat.ask.answer;
    right ? sfx.ok() : sfx.bad();
    recordPrediction(right);
    setAnswers((a) => a.map((v, k) => (k === beats.beat ? i : v)));
  };
  const unlock = () => {
    if (unlocked[beats.beat]) return;
    sfx.snap();
    setUnlocked((u) => u.map((v, k) => (k === beats.beat ? true : v)));
  };

  // dev-only hook for automated walkthroughs (QA screenshots)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __demo: unknown }).__demo = { unlock, beat: beats.beat, count: n, answer };
  });

  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    e.preventDefault();
    advance();
  }, !run.paused);
  useKey('ArrowLeft', () => beats.prev(), !run.paused);
  useKey(['1', '2', '3', '4'], (e) => choose(Number(e.key) - 1), !run.paused && needsAnswer && typed);

  const Scene = step.Scene;
  const tone = beat.ask && answer !== null ? (answer === beat.ask.answer ? 'ok' : 'bad') : undefined;
  return (
    <div className="play">
      <div className="play-stage">
        <Scene beats={beats} reduced={run.reduced} unlock={unlock} answer={answer} />
        <div className="beat-dots" aria-label={`Paso ${beats.beat + 1} de ${n}`}>
          {step.beats.map((_, i) => (
            <i key={i} className={i < beats.beat ? 'past' : i === beats.beat ? 'now' : ''} />
          ))}
        </div>
        <button className="skip-demo" onClick={() => run.complete()} title="Saltar la demostración">
          Ya lo sé · ir a los retos ▸▸
        </button>
      </div>
      <Console
        text={beat.say}
        tex={beat.tex}
        skip={skip}
        onTyped={() => setTypedBeat(beats.beat)}
        mood={tone === 'ok' ? 'ok' : tone === 'bad' ? 'bad' : 'talk'}
        tone={tone}
        actions={
          <>
            <button className="btn ghost small" onClick={() => beats.prev()} disabled={beats.beat === 0}>
              ◂ Atrás
            </button>
            <button className={`btn ${canAdvance ? 'primary pulse' : ''}`} onClick={advance}>
              {beats.beat < n - 1 ? 'Continuar' : 'A los retos'} ▸
            </button>
          </>
        }
      >
        {beat.ask && typed && (
          <div className="ask">
            <div className="ask-prompt">
              <span className="ask-tag">PREDICE</span> <Rich text={beat.ask.prompt} />
            </div>
            <div className="ask-options">
              {beat.ask.options.map((o, i) => (
                <button
                  key={i}
                  className={`opt ${answer === null ? '' : i === beat.ask!.answer ? 'right' : i === answer ? 'wrong' : 'off'}`}
                  onClick={() => choose(i)}
                  disabled={answer !== null}
                >
                  <kbd>{i + 1}</kbd> <Rich text={o} />
                </button>
              ))}
            </div>
            {answer !== null && (
              <p className="ask-explain">
                <Rich text={beat.ask.explain} />
              </p>
            )}
          </div>
        )}
        {beat.gate && typed && (
          <p className={`gate ${unlocked[beats.beat] ? 'done' : ''}`}>
            {unlocked[beats.beat] ? '✓ ' : '◇ '}
            <Rich text={beat.gate} />
          </p>
        )}
        <div className="console-keys">
          <KeyHint k="ESPACIO">avanzar</KeyHint>
          <KeyHint k="←">retroceder</KeyHint>
          {beat.ask && <KeyHint k="1-4">elegir</KeyHint>}
        </div>
      </Console>
    </div>
  );
}
