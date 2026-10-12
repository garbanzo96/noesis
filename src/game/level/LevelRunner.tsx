import { useMemo, useRef, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { completeLevel, starsFor, store, useGame } from '../state';
import { ChallengePlayer } from './ChallengePlayer';
import { DemoPlayer } from './DemoPlayer';
import { ForgePlayer } from './ForgePlayer';
import { Results, type ResultsData } from './Results';
import { ScenePlayer } from './ScenePlayer';
import { RunContext, type RunCtx } from './context';
import { beatNotes, levelNotes, mergeNotes } from './notes';
import type { LevelDef, Note, SectorDef, Step } from './types';

const STEP_LABEL: Record<Step['kind'], string> = {
  scene: 'Historia',
  lesson: 'Clase',
  demo: 'Investigación',
  challenge: 'Práctica',
  forge: 'Forja',
};

const systemReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function LevelRunner({
  level,
  sector,
  onExit,
  onNext,
  nextLabel,
  onOpenCodex,
  onOpenSettings,
  overlayOpen,
  startStep,
}: {
  level: LevelDef;
  sector: SectorDef;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
  overlayOpen: boolean;
  /** start at this step (from Resources or a board shortcut) */
  startStep?: number;
}) {
  const game = useGame();
  const reduced = game.settings.reducedMotion || !!systemReduced;
  // ?step=N starts at a given step (QA / authoring aid)
  const initialStep = (() => {
    const k = startStep ?? Number(new URLSearchParams(window.location.search).get('step'));
    return Number.isInteger(k) && k > 0 && k < level.steps.length ? k : 0;
  })();
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hints, setHints] = useState(0);
  const [pausedMenu, setPausedMenu] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [transition, setTransition] = useState(false);
  // skipping the investigation (or jumping in with ?step) still gives the full notebook
  const allNotes = useMemo(() => levelNotes(level), [level]);
  const [notes, setNotes] = useState<Note[]>(() => (initialStep > 0 ? allNotes : []));
  const t0 = useRef(performance.now());
  const counters = useRef({ errors: 0, hints: 0 });
  const paused = pausedMenu || overlayOpen || !!results;

  const finish = () => {
    const seconds = (performance.now() - t0.current) / 1000;
    const r = {
      levelId: level.id,
      world: level.world,
      boss: level.kind === 'boss',
      hintsUsed: counters.current.hints,
      errors: counters.current.errors,
      seconds,
      glyphs: level.glyphs,
      codex: [level.id],
      module: level.module,
    };
    const { state, gained, newStars } = completeLevel(store.get(), r);
    store.set(state);
    setResults({ stars: starsFor(r), newStars, gained, errors: r.errors, hints: r.hintsUsed, seconds });
  };

  const goNext = () => {
    if (stepIndex + 1 >= level.steps.length) {
      finish();
      return;
    }
    // leaving a demo (even skipped): the notebook gets every entry of that investigation
    const cur = level.steps[stepIndex];
    if (cur.kind === 'demo' || cur.kind === 'lesson') {
      const add = cur.beats.flatMap(beatNotes);
      setNotes((ns) => mergeNotes(ns, add));
    }
    sfx.whoosh();
    setTransition(true);
    setTimeout(
      () => {
        setStepIndex((i) => i + 1);
        setTransition(false);
      },
      reduced ? 0 : 260,
    );
  };

  const ctx: RunCtx = useMemo(
    () => ({
      level,
      stepIndex,
      reduced,
      textSpeed: game.settings.textSpeed,
      paused,
      guide: level.guide ?? 'iris',
      place: sector.place,
      notes,
      addNote: (n) => setNotes((ns) => mergeNotes(ns, [n])),
      complete: goNext,
      error: () => {
        counters.current.errors += 1;
        setErrors(counters.current.errors);
      },
      hint: () => {
        counters.current.hints += 1;
        setHints(counters.current.hints);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, sector, stepIndex, reduced, game.settings.textSpeed, paused, notes],
  );

  const retry = () => {
    counters.current = { errors: 0, hints: 0 };
    setErrors(0);
    setHints(0);
    setResults(null);
    setStepIndex(0);
    setNotes([]);
    setAttempt((a) => a + 1);
    setPausedMenu(false);
    t0.current = performance.now();
  };

  /** visit any step directly (review): later steps get the full notebook */
  const jumpTo = (i: number) => {
    if (i === stepIndex || results) return;
    sfx.click();
    setNotes(i > 0 ? allNotes : []);
    setStepIndex(i);
    setAttempt((a) => a + 1);
  };

  useKey('Escape', () => {
    if (results || overlayOpen) return;
    sfx.click();
    setPausedMenu((p) => !p);
  });
  useKey(['c', 'C'], () => !results && !pausedMenu && onOpenCodex(), !overlayOpen);

  const [rotateOk, setRotateOk] = useState(false);
  const step = level.steps[stepIndex];
  const record = game.levels[level.id];
  const liveStars = [stepIndex >= level.steps.length - 1, hints === 0, errors === 0];

  return (
    <RunContext.Provider value={ctx}>
      <div className={`level ${level.kind === 'boss' ? 'boss' : ''}`} style={{ ['--accent' as string]: sector.accent }}>
        <header className="level-hud">
          <button className="hud-back" onClick={onExit} title="Volver al tablero del distrito">
            ◂ <span>{sector.name.toUpperCase()}</span>
          </button>
          <div className="hud-title">
            <span className="hud-code">CASO {level.code}</span>
            <span className="hud-name">{level.title}</span>
          </div>
          <ol className="step-track">
            {level.steps.map((s, i) => (
              <li key={i} className={i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''}>
                <button onClick={() => jumpTo(i)} title="Ir a este paso">
                  <span className="step-label">{STEP_LABEL[s.kind]}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="hud-stars" title="Estrellas: resolver · sin pistas · sin errores">
            {liveStars.map((on, i) => (
              <span key={i} className={on ? 'on' : 'off'}>
                ★
              </span>
            ))}
            {record?.done && <small>mejor {record.stars.filter(Boolean).length}/3</small>}
          </div>
          <button className="hud-menu" onClick={() => setPausedMenu(true)} title="Menú (Esc)">
            ☰
          </button>
        </header>
        <div className="level-notice">
          {step.kind !== 'scene' && !rotateOk && (
            <div className="rotate-hint">
              <svg className="rot-icon" width="16" height="22" viewBox="0 0 16 22" aria-hidden>
                <rect x="1" y="1" width="14" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="8" cy="17" r="1.4" fill="currentColor" />
              </svg>
              <span>Gira el teléfono para ver el escenario más grande.</span>
              <button onClick={() => setRotateOk(true)}>Entendido</button>
            </div>
          )}
        </div>
        <main className={`level-body ${transition ? 'leaving' : 'entering'}`} key={`${attempt}-${stepIndex}`}>
          {step.kind === 'scene' && <ScenePlayer step={step} />}
          {(step.kind === 'demo' || step.kind === 'lesson') && <DemoPlayer key={stepIndex} step={step} />}
          {step.kind === 'challenge' && <ChallengePlayer step={step} />}
          {step.kind === 'forge' && <ForgePlayer step={step} />}
        </main>
        {pausedMenu && (
          <div className="pause" onClick={() => setPausedMenu(false)}>
            <div className="pause-card" onClick={(e) => e.stopPropagation()}>
              <span className="pause-kicker">PAUSA · CASO {level.code}</span>
              <h2>{level.title}</h2>
              <button className="btn primary" onClick={() => setPausedMenu(false)}>
                Continuar
              </button>
              <button className="btn" onClick={retry}>
                Reiniciar el caso
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPausedMenu(false);
                  onOpenCodex();
                }}
              >
                Recursos del tema (R)
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPausedMenu(false);
                  onOpenSettings();
                }}
              >
                Ajustes
              </button>
              <button className="btn ghost" onClick={onExit}>
                Volver al tablero
              </button>
            </div>
          </div>
        )}
        {results && (
          <Results
            level={level}
            data={results}
            notes={allNotes}
            onRetry={retry}
            onExit={onExit}
            onNext={onNext}
            nextLabel={nextLabel}
            reduced={reduced}
            module={level.kind === 'boss' ? sector.module : undefined}
          />
        )}
      </div>
    </RunContext.Provider>
  );
}
