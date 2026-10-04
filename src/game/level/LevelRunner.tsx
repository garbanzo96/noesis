import { useMemo, useRef, useState } from 'react';
import { useKey } from '../../engine/hooks';
import { sfx } from '../audio';
import { completeLevel, starsFor, store, useGame } from '../state';
import { BriefPlayer } from './BriefPlayer';
import { ChallengePlayer } from './ChallengePlayer';
import { CodexPlayer } from './CodexPlayer';
import { DemoPlayer } from './DemoPlayer';
import { ForgePlayer } from './ForgePlayer';
import { Results, type ResultsData } from './Results';
import { RunContext, type RunCtx } from './context';
import type { LevelDef, SectorDef, Step } from './types';

const STEP_LABEL: Record<Step['kind'], string> = {
  brief: 'Briefing',
  demo: 'Demostración',
  challenge: 'Retos',
  forge: 'Forja',
  codex: 'Códex',
};
const STEP_ICON: Record<Step['kind'], string> = {
  brief: '›_',
  demo: '▶',
  challenge: '◆',
  forge: '⚒',
  codex: '▣',
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
}: {
  level: LevelDef;
  sector: SectorDef;
  onExit: () => void;
  onNext?: () => void;
  nextLabel?: string;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
  overlayOpen: boolean;
}) {
  const game = useGame();
  const reduced = game.settings.reducedMotion || !!systemReduced;
  // ?step=N starts at a given step (QA / authoring aid)
  const [stepIndex, setStepIndex] = useState(() => {
    const n = Number(new URLSearchParams(window.location.search).get('step'));
    return Number.isInteger(n) && n > 0 && n < level.steps.length ? n : 0;
  });
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hints, setHints] = useState(0);
  const [pausedMenu, setPausedMenu] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [transition, setTransition] = useState(false);
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
      codex: level.codex,
      module: level.module,
    };
    const { state, gained, newStars } = completeLevel(store.get(), r);
    store.set(state);
    setResults({
      stars: starsFor(r),
      newStars,
      gained,
      errors: r.errors,
      hints: r.hintsUsed,
      seconds,
    });
  };

  const ctx: RunCtx = useMemo(
    () => ({
      level,
      stepIndex,
      reduced,
      textSpeed: game.settings.textSpeed,
      paused,
      modules: game.modules.length,
      complete: () => {
        if (stepIndex + 1 >= level.steps.length) {
          finish();
          return;
        }
        sfx.whoosh();
        setTransition(true);
        setTimeout(
          () => {
            setStepIndex((i) => i + 1);
            setTransition(false);
          },
          reduced ? 0 : 280,
        );
      },
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
    [level, stepIndex, reduced, game.settings.textSpeed, paused, game.modules.length],
  );

  const retry = () => {
    counters.current = { errors: 0, hints: 0 };
    setErrors(0);
    setHints(0);
    setResults(null);
    setStepIndex(0);
    setAttempt((a) => a + 1);
    setPausedMenu(false);
    t0.current = performance.now();
  };

  useKey('Escape', () => {
    if (results || overlayOpen) return;
    sfx.click();
    setPausedMenu((p) => !p);
  });
  useKey(['c', 'C'], () => !results && !pausedMenu && onOpenCodex(), !overlayOpen);

  const step = level.steps[stepIndex];
  const record = game.levels[level.id];
  const liveStars = [stepIndex >= level.steps.length - 1, hints === 0, errors <= 1];

  return (
    <RunContext.Provider value={ctx}>
      <div className={`level ${level.kind === 'boss' ? 'boss' : ''}`} style={{ ['--accent' as string]: sector.accent }}>
        <header className="level-hud">
          <button className="hud-back" onClick={onExit} title="Volver al mapa del sector">
            ◂ <span>SECTOR {String(sector.number).padStart(2, '0')}</span>
          </button>
          <div className="hud-title">
            <span className="hud-code">{level.code}</span>
            <span className="hud-name">{level.title}</span>
          </div>
          <ol className="step-track">
            {level.steps.map((s, i) => (
              <li key={i} className={i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''}>
                <span className="step-icon">{STEP_ICON[s.kind]}</span>
                <span className="step-label">{s.kind === 'demo' || s.kind === 'challenge' ? s.title : STEP_LABEL[s.kind]}</span>
              </li>
            ))}
          </ol>
          <div className="hud-stars" title="Estrellas en juego: completar · sin pistas · ≤ 1 error">
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
        <main className={`level-body ${transition ? 'leaving' : 'entering'}`} key={`${attempt}-${stepIndex}`}>
          {step.kind === 'brief' && <BriefPlayer step={step} />}
          {step.kind === 'demo' && <DemoPlayer step={step} />}
          {step.kind === 'challenge' && <ChallengePlayer step={step} />}
          {step.kind === 'forge' && <ForgePlayer step={step} />}
          {step.kind === 'codex' && <CodexPlayer step={step} />}
        </main>
        {pausedMenu && (
          <div className="pause" onClick={() => setPausedMenu(false)}>
            <div className="pause-card" onClick={(e) => e.stopPropagation()}>
              <span className="pause-kicker">PAUSA · {level.code}</span>
              <h2>{level.title}</h2>
              <button className="btn primary" onClick={() => setPausedMenu(false)}>
                Continuar
              </button>
              <button className="btn" onClick={retry}>
                Reiniciar protocolo
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPausedMenu(false);
                  onOpenCodex();
                }}
              >
                Códex (C)
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
                Salir al mapa
              </button>
            </div>
          </div>
        )}
        {results && (
          <Results
            level={level}
            data={results}
            onRetry={retry}
            onExit={onExit}
            onNext={onNext}
            nextLabel={nextLabel}
            reduced={reduced}
          />
        )}
      </div>
    </RunContext.Provider>
  );
}
