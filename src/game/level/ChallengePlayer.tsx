import { useEffect, useMemo, useRef, useState } from 'react';
import { Backdrop } from '../../art/places';
import { useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { Console, KeyHint } from './Console';
import { Notebook } from './Notebook';
import { hashSeed, useRun } from './context';
import type { ChallengeApi, ChallengeStep } from './types';

export const INTEGRITY = 3;

/** Credibility: each wrong conclusion costs one cell; at zero the case reopens with new data. */
export function Integrity({ value, max = INTEGRITY }: { value: number; max?: number }) {
  return (
    <div className="integrity" title="Credibilidad: cada conclusión errónea cuesta una celda">
      <span>CREDIBILIDAD</span>
      <div>
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < value ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}

export function ChallengePlayer({ step }: { step: ChallengeStep }) {
  const run = useRun();
  const salt = useRef(Math.floor(Math.random() * 1e9));
  const [round, setRound] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [integrity, setIntegrity] = useState(INTEGRITY);
  const [streak, setStreak] = useState(0);
  const [prompt, setPrompt] = useState<{ text: string; tex?: string }>({ text: '…' });
  const [hints, setHints] = useState<string[]>([]);
  const [shownHints, setShownHints] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [phase, setPhase] = useState<'play' | 'solved' | 'desync'>('play');
  const [shaking, setShaking] = useState(false);
  const seed = hashSeed(run.level.id, run.stepIndex, round, cycle, salt.current);

  const resetRoundUi = () => {
    setFeedback(null);
    setShownHints(0);
    setHints([]);
  };
  const live = useRef({ phase, integrity, round, streak });
  live.current = { phase, integrity, round, streak };

  const api: ChallengeApi = useMemo(
    () => ({
      prompt: (text, tex) => setPrompt({ text, tex }),
      hints: (list) => setHints(list),
      sfx,
      result: (ok, msg) => {
        const L = live.current;
        if (L.phase !== 'play') return;
        if (ok) {
          sfx.ok(L.streak);
          setStreak((s) => s + 1);
          setFeedback({ ok: true, msg: msg ?? 'Correcto.' });
          setPhase('solved');
        } else {
          sfx.bad();
          run.error();
          setStreak(0);
          setShaking(true);
          setTimeout(() => setShaking(false), 420);
          setFeedback({ ok: false, msg: msg ?? 'No es correcto.' });
          const left = L.integrity - 1;
          setIntegrity(left);
          if (left <= 0) {
            setPhase('desync');
            sfx.glitch();
            setTimeout(() => {
              resetRoundUi();
              setIntegrity(INTEGRITY);
              setRound(0);
              setCycle((c) => c + 1);
              setPhase('play');
            }, 2400);
          }
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __round: unknown }).__round = { pass: () => api.result(true, 'QA'), round, phase };
  });

  const nextRound = () => {
    if (phase !== 'solved') return;
    if (round + 1 >= step.rounds) run.complete();
    else {
      sfx.advance();
      resetRoundUi();
      setRound(round + 1);
      setPhase('play');
    }
  };
  const revealHint = () => {
    if (shownHints >= hints.length) return;
    sfx.hint();
    run.hint();
    setShownHints((h) => h + 1);
  };
  useKey(['h', 'H'], revealHint, !run.paused && phase === 'play');
  useKey([' ', 'Enter'], (e) => {
    if (phase !== 'solved') return;
    e.preventDefault();
    nextRound();
  }, !run.paused);
  useEffect(() => {
    // solved rounds move on after a beat, so the player can read the explanation
    if (phase !== 'solved') return;
    const id = setTimeout(nextRound, run.reduced ? 1600 : 3200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const Comp = step.Comp;
  return (
    <div className="play with-notes">
      <div className={`play-stage ${phase === 'solved' ? 'solved' : ''} ${shaking ? 'shake' : ''}`}>
        <Backdrop place={run.place} dim={0.9} className="stage-backdrop" />
        <div className="challenge-head">
          <span className="challenge-title">{step.title}</span>
          <div className="round-pips">
            {Array.from({ length: step.rounds }, (_, i) => (
              <i key={i} className={i < round || (i === round && phase === 'solved') ? 'done' : i === round ? 'now' : ''} />
            ))}
          </div>
          <span className="round-label">
            {round + 1} / {step.rounds}
          </span>
        </div>
        <Comp key={`${round}-${cycle}`} seed={seed} round={round} rounds={step.rounds} reduced={run.reduced} api={api} />
        {phase === 'solved' && (
          <div className="solved-flash">
            <span>✓</span>
          </div>
        )}
        {phase === 'desync' && (
          <div className="desync">
            <span>SIN CREDIBILIDAD</span>
            <p>Iris revisa tus notas. El caso se reabre con datos nuevos.</p>
          </div>
        )}
      </div>
      <Notebook notes={run.notes} />
      <Console
        text={feedback ? feedback.msg : prompt.text}
        tex={feedback ? undefined : prompt.tex}
        tone={feedback ? (feedback.ok ? 'ok' : 'bad') : undefined}
        actions={
          <>
            <Integrity value={integrity} />
            {phase === 'solved' ? (
              <button className="btn primary" onClick={nextRound}>
                {round + 1 >= step.rounds ? 'Cerrar' : 'Siguiente'} ▸
              </button>
            ) : (
              <button className="btn hint" onClick={revealHint} disabled={shownHints >= hints.length || phase !== 'play'}>
                Pista {hints.length ? `${shownHints}/${hints.length}` : ''}
              </button>
            )}
          </>
        }
      >
        {feedback && !feedback.ok && (
          <p className="console-sub">
            <Rich text={prompt.text} />
          </p>
        )}
        {shownHints > 0 && (
          <ol className="hints">
            {hints.slice(0, shownHints).map((h, i) => (
              <li key={i}>
                <Rich text={h} />
              </li>
            ))}
          </ol>
        )}
        <div className="console-keys">
          <KeyHint k="H">pista</KeyHint>
        </div>
      </Console>
    </div>
  );
}
