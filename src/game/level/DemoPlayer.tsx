import { useEffect, useMemo, useRef, useState } from 'react';
import { Backdrop } from '../../art/places';
import { useBeats, useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { recordPrediction } from '../state';
import { Console, KeyHint } from './Console';
import { Notebook } from './Notebook';
import { hashSeed, useRun } from './context';
import type { DemoStep } from './types';

/**
 * Guided investigation. A beat is complete when its text has been read (plain beat), its
 * prediction answered (ask) or its interaction done (gate). Completing a gate advances by
 * itself; completing any beat moves its note into the notebook.
 */
export function DemoPlayer({ step }: { step: DemoStep }) {
  const run = useRun();
  const n = step.beats.length;
  const beats = useBeats(n, (b) => step.beats[b]?.dur ?? 1.4, run.reduced);
  const [typedBeat, setTypedBeat] = useState(-1);
  const typed = typedBeat === beats.beat;
  const [skip, setSkip] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => step.beats.map(() => null));
  const [unlocked, setUnlocked] = useState<boolean[]>(() => step.beats.map((b) => !b.gate));
  const noted = useRef(new Set<number>());
  // options are shown in a fixed shuffled order per case and beat, so the answer is never "always the first"
  const orders = useMemo(
    () =>
      step.beats.map((b, k) => {
        const idx = (b.ask?.options ?? []).map((_, i) => i);
        let s = hashSeed(run.level.id, k) >>> 0;
        for (let i = idx.length - 1; i > 0; i--) {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          const j = s % (i + 1);
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        return idx;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );
  const beat = step.beats[beats.beat];
  const answer = answers[beats.beat];
  const needsAnswer = !!beat.ask && answer === null;
  const needsGate = !unlocked[beats.beat];
  const done = typed && !needsAnswer && !needsGate;

  useEffect(() => {
    beats.goto(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // notebook: a beat's note is revealed once the beat is done
  useEffect(() => {
    if (!done || !beat.note || noted.current.has(beats.beat)) return;
    noted.current.add(beats.beat);
    run.addNote(beat.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, beats.beat]);

  // gates advance by themselves once satisfied
  useEffect(() => {
    if (!beat.gate || !unlocked[beats.beat] || !typed) return;
    if (beats.beat >= n - 1) return;
    const id = setTimeout(() => {
      sfx.advance();
      beats.next();
    }, run.reduced ? 300 : 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked[beats.beat], typed, beats.beat]);

  const advance = () => {
    if (!typed) {
      setSkip((s) => s + 1);
      return;
    }
    if (!done) {
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
    if (right) sfx.ok();
    else sfx.bad();
    recordPrediction(right);
    setAnswers((a) => a.map((v, k) => (k === beats.beat ? i : v)));
  };
  const unlock = () => {
    if (unlocked[beats.beat]) return;
    sfx.snap();
    setUnlocked((u) => u.map((v, k) => (k === beats.beat ? true : v)));
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __demo: unknown }).__demo = { unlock, beat: beats.beat, count: n, answer, rightKey: beat.ask ? orders[beats.beat].indexOf(beat.ask.answer) + 1 : 0 };
  });

  useKey([' ', 'Enter', 'ArrowRight'], (e) => {
    e.preventDefault();
    advance();
  }, !run.paused);
  useKey('ArrowLeft', () => beats.prev(), !run.paused);
  useKey(['1', '2', '3', '4'], (e) => {
    const i = orders[beats.beat][Number(e.key) - 1];
    if (i !== undefined) choose(i);
  }, !run.paused && needsAnswer && typed);

  const Scene = step.Scene;
  const tone = beat.ask && answer !== null ? (answer === beat.ask.answer ? 'ok' : 'bad') : beat.gate && unlocked[beats.beat] ? 'ok' : undefined;
  return (
    <div className="play with-notes">
      <div className="play-stage">
        <Backdrop place={run.place} dim={0.9} className="stage-backdrop" />
        <Scene beats={beats} reduced={run.reduced} unlock={unlock} answer={answer} />
        <div className="beat-dots" aria-label={`Paso ${beats.beat + 1} de ${n}`}>
          {step.beats.map((_, i) => (
            <i key={i} className={i < beats.beat ? 'past' : i === beats.beat ? 'now' : ''} />
          ))}
        </div>
        <button className="skip-demo" onClick={() => run.complete()} title="Saltar la investigación">
          Saltar al caso ▸▸
        </button>
      </div>
      <Notebook notes={run.notes} />
      <Console
        text={beat.say}
        tex={beat.tex}
        skip={skip}
        onTyped={() => setTypedBeat(beats.beat)}
        tone={tone}
        actions={
          <>
            <button className="btn ghost small" onClick={() => beats.prev()} disabled={beats.beat === 0}>
              ◂ Atrás
            </button>
            {(!beat.gate || beats.beat === n - 1) && (
              <button className={`btn ${done ? 'primary pulse' : ''}`} onClick={advance} disabled={typed && !done}>
                {beats.beat < n - 1 ? 'Seguir' : 'Al caso'} ▸
              </button>
            )}
          </>
        }
      >
        {beat.ask && typed && (
          <div className="ask">
            <div className="ask-prompt">
              <span className="ask-tag">ANTES DE MIRAR</span> <Rich text={beat.ask.prompt} />
            </div>
            <div className="ask-options">
              {orders[beats.beat].map((i, pos) => (
                <button
                  key={i}
                  className={`opt ${answer === null ? '' : i === beat.ask!.answer ? 'right' : i === answer ? 'wrong' : 'off'}`}
                  onClick={() => choose(i)}
                  disabled={answer !== null}
                >
                  <kbd>{pos + 1}</kbd> <Rich text={beat.ask!.options[i]} />
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
            {unlocked[beats.beat] ? '✓ ' : '▸ '}
            <Rich text={beat.gate} />
          </p>
        )}
        <div className="console-keys">
          <KeyHint k="ESPACIO">seguir</KeyHint>
          <KeyHint k="←">atrás</KeyHint>
          {beat.ask && <KeyHint k="1-3">responder</KeyHint>}
        </div>
      </Console>
    </div>
  );
}
