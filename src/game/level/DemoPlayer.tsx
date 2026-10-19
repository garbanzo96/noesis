import { useEffect, useMemo, useRef, useState } from 'react';
import { Backdrop } from '../../art/places';
import { CueCtx, useSingleGhost } from '../../engine/cue';
import { useStageBuild } from '../../engine/build';
import { useDrawOn } from '../../engine/draw';
import { useBeats, useKey } from '../../engine/hooks';
import { Rich } from '../../engine/Tex';
import { sfx } from '../audio';
import { recordPrediction } from '../state';
import { Board, linesOf } from './Board';
import { Console, KeyHint } from './Console';
import { FocusStrip } from './FocusStrip';
import { LessonIntro } from './LessonIntro';
import { Notebook } from './Notebook';
import { Rail, flyToRail } from './Rail';
import { hashSeed, useRun } from './context';
import { beatNotes } from './notes';
import type { BoardLine, DemoStep, LessonStep } from './types';

/**
 * Guided investigation (demo) and lesson. A beat is complete when its text has been read, its
 * question answered (ask) or its interaction done (gate). Completing a gate advances by itself;
 * completing any beat moves its note (and labelled blackboard lines) into the notebook.
 * A lesson shows the blackboard instead of the notebook and is narrated by NÓESIS.
 */
export function DemoPlayer({ step }: { step: DemoStep | LessonStep }) {
  const run = useRun();
  const lesson = step.kind === 'lesson';
  const n = step.beats.length;
  const beats = useBeats(n, (b) => step.beats[b]?.dur ?? (lesson ? 2.2 : 1.4), run.reduced);
  const [typedBeat, setTypedBeat] = useState(-1);
  // a lesson opens with its context card before the first beat
  const intro = lesson ? step.intro : undefined;
  const [inIntro, setInIntro] = useState(!!intro);
  // how far NÓESIS has spoken the current beat: the formula is written at that pace
  const [spoken, setSpoken] = useState({ beat: -1, f: 0 });
  const typed = typedBeat === beats.beat;
  const [skip, setSkip] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => step.beats.map(() => null));
  const [unlocked, setUnlocked] = useState<boolean[]>(() => step.beats.map((b) => !b.gate));
  const [touched, setTouched] = useState<boolean[]>(() => step.beats.map(() => false));
  const noted = useRef(new Set<number>());
  const stageArea = useRef<HTMLDivElement>(null);
  useSingleGhost(stageArea);
  useDrawOn(stageArea, inIntro ? -1 : beats.beat, run.reduced);
  // labels and formulas on the stage appear one by one while NÓESIS speaks the beat
  useStageBuild(
    stageArea,
    inIntro ? -1 : beats.beat,
    typed ? 1 : spoken.beat === beats.beat ? spoken.f : 0,
    run.reduced,
  );
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

  // notebook: a beat's note (and labelled board lines) is filed when the player leaves the beat
  const commit = (k: number) => {
    if (noted.current.has(k)) return;
    noted.current.add(k);
    for (const note of beatNotes(step.beats[k])) run.addNote(note);
  };
  const leave = () => {
    flyToRail(Array.from(document.querySelectorAll<HTMLElement>('[data-focus-line]')), run.reduced);
    commit(beats.beat);
  };

  // gates advance by themselves once satisfied
  useEffect(() => {
    if (!beat.gate || !unlocked[beats.beat] || !typed) return;
    if (beats.beat >= n - 1) return;
    const id = setTimeout(
      () => {
        sfx.advance();
        leave();
        beats.next();
      },
      run.reduced ? 300 : lesson ? 2800 : 1200,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked[beats.beat], typed, beats.beat]);

  const advance = () => {
    if (inIntro) {
      sfx.advance();
      setInIntro(false);
      beats.goto(0);
      return;
    }
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
      leave();
      beats.next();
    } else {
      sfx.select();
      commit(beats.beat);
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
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'qa') return;
    (window as unknown as { __demo: unknown }).__demo = {
      unlock,
      beat: beats.beat,
      locked: !unlocked[beats.beat],
      count: n,
      answer,
      rightKey: beat.ask ? orders[beats.beat].indexOf(beat.ask.answer) + 1 : 0,
    };
  });

  useKey(
    [' ', 'Enter', 'ArrowRight'],
    (e) => {
      e.preventDefault();
      advance();
    },
    !run.paused,
  );
  useKey('ArrowLeft', () => beats.prev(), !run.paused);
  useKey(
    ['1', '2', '3', '4'],
    (e) => {
      const i = orders[beats.beat][Number(e.key) - 1];
      if (i !== undefined) choose(i);
    },
    !run.paused && needsAnswer && typed,
  );

  const Scene = step.Scene;
  const tone =
    beat.ask && answer !== null
      ? answer === beat.ask.answer
        ? 'ok'
        : 'bad'
      : beat.gate && unlocked[beats.beat]
        ? 'ok'
        : undefined;
  // what the focus strip shows: the board lines of a lesson step; in an investigation, the
  // formula of the step and, once done, the note it leaves in the notebook
  // in a step that asks for a prediction, its formula (which usually holds the answer) waits for it
  // in a step with an action, the drawing is the focus: its formula is written once the action is done
  const focus: BoardLine[] = lesson
    ? (beat.ask && answer === null) || (beat.gate && !unlocked[beats.beat])
      ? []
      : linesOf(beat)
    : done && beat.note
      ? [{ label: beat.note.label, tex: beat.note.tex ?? '', body: beat.note.body }]
      : beat.tex
        ? [{ tex: beat.tex }]
        : [];
  const cueActive = typed && !!beat.gate && !unlocked[beats.beat] && !touched[beats.beat];
  const cue = useMemo(
    () => ({
      active: cueActive,
      touch: () =>
        setTouched((t) => (t[beats.beat] ? t : t.map((v, k) => (k === beats.beat ? true : v)))),
    }),
    [cueActive, beats.beat],
  );
  const waiting = typed && !done;
  // write the formula of an answered question part by part, like any other step
  const [revealed, setRevealed] = useState(1);
  useEffect(() => {
    if (beat.gate ? !unlocked[beats.beat] : !beat.ask || answer === null) return;
    if (run.reduced) return setRevealed(1);
    setRevealed(0);
    const t0 = performance.now();
    let id = 0;
    const tick = () => {
      const r = Math.min(1, (performance.now() - t0) / 1600);
      setRevealed(r);
      if (r < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, beats.beat, unlocked[beats.beat]]);
  return (
    <div className={`play with-notes ${lesson ? 'lesson' : 'demo'} ${inIntro ? 'intro' : ''}`}>
      <div className={`play-stage ${cueActive ? 'cue-on' : ''}`}>
        <div
          className="stage-area"
          ref={stageArea}
          onPointerDownCapture={() => cueActive && cue.touch()}
        >
          {lesson ? (
            <div className="lesson-bg" aria-hidden />
          ) : (
            <Backdrop place={run.place} dim={0.82} className="stage-backdrop" />
          )}
          {intro && inIntro ? (
            <LessonIntro
              question={intro.question}
              steps={[
                ...new Set(
                  step.beats.flatMap((b) => linesOf(b).map((l) => l.label ?? '')).filter(Boolean),
                ),
              ]}
              reduced={run.reduced}
            />
          ) : (
            <CueCtx.Provider value={cue}>
              <Scene beats={beats} reduced={run.reduced} unlock={unlock} answer={answer} />
            </CueCtx.Provider>
          )}
          <div className="stage-meta">
            <span className="stage-kicker">{lesson ? `Clase · ${step.title}` : step.title}</span>
            <div className="beat-dots" aria-label={`Paso ${beats.beat + 1} de ${n}`}>
              {step.beats.map((_, i) => (
                <i key={i} className={i < beats.beat ? 'past' : i === beats.beat ? 'now' : ''} />
              ))}
            </div>
            <button
              className="skip-demo"
              onClick={() => run.complete()}
              title={lesson ? 'Saltar la clase' : 'Saltar la investigación'}
            >
              {lesson ? 'Saltar clase' : 'Saltar'} ▸▸
            </button>
          </div>
        </div>
        <FocusStrip
          key={`${beats.beat}-${lesson ? '' : done ? 1 : 0}-${answer === null ? 0 : 1}-${unlocked[beats.beat] ? 1 : 0}`}
          lines={inIntro ? [] : focus}
          progress={
            !lesson
              ? 1
              : beat.ask || beat.gate
                ? revealed
                : run.textSpeed === 'instant'
                  ? beats.at(beats.beat)
                  : typed
                    ? 1
                    : spoken.beat === beats.beat
                      ? spoken.f
                      : 0
          }
          instant={run.reduced}
          tone={lesson ? undefined : 'note'}
        />
      </div>
      <Rail
        label={lesson ? 'Pizarra' : 'Cuaderno'}
        count={
          lesson
            ? step.beats.slice(0, beats.beat).reduce((m, b) => m + linesOf(b).length, 0)
            : run.notes.length
        }
      >
        {lesson ? (
          <Board title={run.level.subtitle} beats={step.beats} current={beats.beat} />
        ) : (
          <Notebook notes={run.notes} />
        )}
      </Rail>
      <Console
        who={lesson ? 'noesis' : undefined}
        text={intro && inIntro ? intro.text : beat.say}
        skip={skip}
        onTyped={() => !inIntro && setTypedBeat(beats.beat)}
        onProgress={(f) => !inIntro && setSpoken({ beat: beats.beat, f })}
        tone={tone}
        actions={
          inIntro ? (
            <button className="btn primary pulse" onClick={advance}>
              Empezar la clase ▸
            </button>
          ) : (
            <>
              {(!beat.gate || beats.beat === n - 1) && (
                <button
                  className={`btn ${done ? 'primary pulse' : ''}`}
                  onClick={advance}
                  disabled={waiting}
                >
                  {beats.beat < n - 1 ? 'Seguir' : lesson ? 'A la investigación' : 'A la práctica'}{' '}
                  ▸
                </button>
              )}
              {waiting && (
                <span className="wait-reason">
                  {needsAnswer ? 'Elige una respuesta' : 'Haz la acción indicada'}
                </span>
              )}
              <button
                className="btn ghost small"
                onClick={() => beats.prev()}
                disabled={beats.beat === 0}
              >
                ◂ Atrás
              </button>
            </>
          )
        }
      >
        {!inIntro && beat.ask && typed && (
          <div className="ask">
            <div className="ask-prompt">
              <span className={`ask-tag ${lesson ? 'check' : ''}`}>
                {lesson ? 'Comprueba' : 'Antes de mirar'}
              </span>{' '}
              <Rich text={beat.ask.prompt} />
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
        {!inIntro && beat.gate && typed && (
          <p className={`gate ${unlocked[beats.beat] ? 'done' : ''}`}>
            <span className="gate-icon" aria-hidden>
              {unlocked[beats.beat] ? '✓' : '☝'}
            </span>
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
