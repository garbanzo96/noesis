import { useEffect, useMemo, useRef, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { Console, KeyHint } from './Console';
import { hashSeed, useRun } from './context';
import type { ChallengeApi, ChallengeStep } from './types';

export const INTEGRITY = 4;

export function Integrity({ value, max = INTEGRITY }: { value: number; max?: number }) {
  return (
    <div className="integrity" title="Integridad: cada error cuesta una celda">
      <span>INTEGRIDAD</span>
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
  const [shake, setShake] = useState(0);
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shake) return;
    setShaking(true);
    const id = setTimeout(() => setShaking(false), 420);
    return () => clearTimeout(id);
  }, [shake]);
  const seed = hashSeed(run.level.id, run.stepIndex, round, cycle, salt.current);

  // Per-round UI state is reset where the round changes (not in an effect: child effects
  // run first and would have their hints wiped).
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
          setTimeout(
            () => {
              if (L.round + 1 >= step.rounds) run.complete();
              else {
                resetRoundUi();
                setRound((r) => r + 1);
                setPhase('play');
              }
            },
            run.reduced ? 500 : 1150,
          );
        } else {
          sfx.bad();
          run.error();
          setStreak(0);
          setShake((s) => s + 1);
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
            }, 2200);
          }
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step.rounds],
  );

  const revealHint = () => {
    if (shownHints >= hints.length) return;
    sfx.hint();
    run.hint();
    setShownHints((h) => h + 1);
  };
  useKey(['h', 'H'], revealHint, !run.paused && phase === 'play');

  const Comp = step.Comp;
  const consoleText = feedback ? feedback.msg : prompt.text;
  return (
    <div className="play">
      <div className={`play-stage ${phase === 'solved' ? 'solved' : ''} ${shaking ? 'shake' : ''}`}>
        <div className="challenge-head">
          <span className="challenge-title">{step.title}</span>
          <div className="round-pips">
            {Array.from({ length: step.rounds }, (_, i) => (
              <i key={i} className={i < round ? 'done' : i === round ? 'now' : ''} />
            ))}
          </div>
          <span className="round-label">
            CASO {round + 1}/{step.rounds}
          </span>
          {streak >= 2 && <span className="streak">RACHA ×{streak}</span>}
        </div>
        <Comp key={`${round}-${cycle}`} seed={seed} round={round} rounds={step.rounds} reduced={run.reduced} api={api} />
        {phase === 'solved' && (
          <div className="solved-flash">
            <span>✓ CASO RESUELTO</span>
          </div>
        )}
        {phase === 'desync' && (
          <div className="desync">
            <span>DESINCRONIZACIÓN</span>
            <p>Integridad agotada. El protocolo se reinicia con casos nuevos.</p>
          </div>
        )}
      </div>
      <Console
        text={consoleText}
        tex={feedback ? undefined : prompt.tex}
        mood={feedback ? (feedback.ok ? 'ok' : 'bad') : 'talk'}
        tone={feedback ? (feedback.ok ? 'ok' : 'bad') : undefined}
        actions={
          <>
            <Integrity value={integrity} />
            <button className="btn hint" onClick={revealHint} disabled={shownHints >= hints.length || phase !== 'play'}>
              Pista {hints.length ? `${shownHints}/${hints.length}` : ''}
            </button>
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
          <KeyHint k="H">pista (cuesta la estrella ★2)</KeyHint>
        </div>
      </Console>
    </div>
  );
}
