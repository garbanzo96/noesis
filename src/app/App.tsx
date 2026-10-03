import { useEffect, useRef, useState } from 'react';
import {
  Map,
  BookOpen,
  Settings2,
  Radio,
  Package,
  ChevronRight,
  ArrowLeft,
  Eye,
  SlidersHorizontal,
  Target,
  Check,
  Lock,
  Volume2,
  VolumeX,
} from '../components/ui/icons';
import { chapters, getWorld, getLesson, worlds } from '../content';
import type { WorldId, Mode } from '../domain/types';
import { useGame, type GameAction } from '../engine/useGame';
import { worldStatus, getProgress, campaignPrerequisites } from '../engine/progress';
import { useRoute } from '../hooks/useRoute';
import { rewardSound } from '../engine/audio';
import { WorldMap } from '../components/game/WorldMap';
import { Progress } from '../components/game/Progress';
import { Settings } from '../components/game/Settings';
import { Arena } from '../components/game/Arena';
import { AgentLoop } from '../components/game/AgentLoop';
import { Cinema } from '../components/scene/Cinema';
import { Laboratory } from '../components/scene/Laboratory';
import { ConceptPanel } from '../components/learning/ConceptPanel';
import { Library } from '../components/learning/Library';
import { PuzzlePanel } from '../components/learning/PuzzlePanel';
const ranks = [
  'Observador',
  'Cartógrafo',
  'Modelador',
  'Analista',
  'Inferente',
  'Navegante',
  'Investigador',
  'Arquitecto',
  'Estratega',
  'Constructor',
  'Sintetizador',
  'Agente',
];
export default function App() {
  const { state, dispatch: dispatchGame } = useGame();
  const silentImport = useRef(false);
  const dispatch = (action: GameAction) => {
    if (action.type === 'import') silentImport.current = true;
    dispatchGame(action);
  };
  const route = useRoute();
  const [mode, setMode] = useState<Mode>('observe'),
    [toast, setToast] = useState('');
  const oldXp = useRef(state.xp);
  const systemMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced = state.settings.reducedMotion || systemMotion.current;
  const onOpen = (w: WorldId) => {
    setMode('observe');
    window.location.hash = `world/${w}`;
  };
  useEffect(() => {
    if (state.xp > oldXp.current && !silentImport.current) {
      setToast(`+${state.xp - oldXp.current} XP · Evidencia registrada`);
      if (state.settings.sound) rewardSound();
    }
    oldXp.current = state.xp;
    silentImport.current = false;
  }, [state.xp, state.settings.sound]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  const completed = worlds.filter((w) => worldStatus(state, w.id) === 'complete').length;
  const world = route.page === 'world' ? getWorld(route.world) : null;
  const chapter = world ? chapters[world.id]! : null;
  const progress = world ? getProgress(state, world.id) : null;
  const locked = world ? worldStatus(state, world.id) === 'locked' : false;
  const nav = [
    { id: 'map', label: 'Campaña', icon: Map },
    { id: 'arena', label: 'Arena', icon: Radio },
    { id: 'library', label: 'Cuaderno', icon: BookOpen },
    { id: 'progress', label: 'Herramientas', icon: Package },
    { id: 'settings', label: 'Ajustes', icon: Settings2 },
  ];
  return (
    <div className={`game ${state.settings.density === 'compact' ? 'compact' : ''}`}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>('#main-content')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <header className="hud">
        <a className="brand" href="#map">
          NÓESIS<span>ENIGMA / MATHEMATICS PROTOCOL</span>
        </a>
        <div className="hud-progress">
          <div className="rank-badge">{String(state.rank).padStart(2, '0')}</div>
          <div>
            <span>{ranks[Math.min(ranks.length - 1, state.rank - 1)]}</span>
            <div className="xp-track">
              <i style={{ width: `${(state.xp % 400) / 4}%` }} />
            </div>
            <small>
              {state.xp} XP ·{' '}
              {completed === 14
                ? 'campaña completa'
                : `${400 - (state.xp % 400)} para el siguiente rango`}
            </small>
          </div>
        </div>
        <div className="hud-tools">
          <span className="status-dot" />
          <span>
            {String(completed).padStart(2, '0')} / 14
            <br />
            <small>HERRAMIENTAS</small>
          </span>
          <button
            aria-label={state.settings.sound ? 'Desactivar sonido' : 'Activar sonido'}
            onClick={() =>
              dispatch({ type: 'settings', settings: { sound: !state.settings.sound } })
            }
          >
            {state.settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        {route.page === 'map' && <WorldMap state={state} onOpen={onOpen} />}
        {world && chapter && progress && (
          <main className="mission" key={world.id}>
            <div className="mission-breadcrumb">
              <a href="#map">
                <ArrowLeft size={14} /> Atlas
              </a>
              <span>/</span>
              <span>MUNDO {String(world.number).padStart(2, '0')}</span>
              <span className="world-state">
                {worldStatus(state, world.id) === 'complete' ? (
                  <>
                    <Check size={13} /> HERRAMIENTA ACTIVA
                  </>
                ) : locked ? (
                  <>
                    <Lock size={13} /> VISTA PREVIA
                  </>
                ) : (
                  'PROTOCOLO DISPONIBLE'
                )}
              </span>
            </div>
            <div className="mission-heading">
              <div>
                <span className="eyebrow" style={{ color: world.accent }}>
                  {world.tag} · MATEMÁTICA DEL MODELO
                </span>
                <h1>{world.name}</h1>
                <p>{chapter.objective}</p>
              </div>
              <div
                className="world-emblem"
                style={{ color: world.accent, borderColor: world.accent }}
              >
                {world.symbol}
              </div>
            </div>
            <div className="mode-bar">
              <div className="mode-tabs">
                {[
                  { id: 'observe', label: '01 Observar', icon: Eye },
                  { id: 'operate', label: '02 Manipular', icon: SlidersHorizontal },
                  { id: 'transfer', label: '03 Resolver', icon: Target },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={mode === id ? 'active' : ''}
                    aria-pressed={mode === id}
                    onClick={() => setMode(id as Mode)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="mission-evidence">
                <span>{progress.puzzles.length} / 3 MISIONES</span>
                <span>{progress.field ? <Check size={14} /> : <Target size={14} />} CAMPO</span>
              </div>
            </div>
            {locked && (
              <div className="locked-note">
                <Lock size={16} />
                <span>
                  Explora libremente. Para acreditar este mundo:{' '}
                  {campaignPrerequisites[world.id].map((id) => (
                    <button key={id} onClick={() => onOpen(id)}>
                      {getWorld(id).name} <ChevronRight size={11} />
                    </button>
                  ))}
                </span>
              </div>
            )}
            {mode !== 'transfer' ? (
              <div className="play-grid">
                {mode === 'observe' ? (
                  <Cinema key={world.id} world={world.id} reducedMotion={reduced} />
                ) : (
                  <Laboratory
                    key={world.id}
                    world={world.id}
                    reducedMotion={reduced}
                    accredited={progress.field}
                    locked={locked}
                    onComplete={() => dispatch({ type: 'field', world: world.id })}
                  />
                )}
                <ConceptPanel
                  key={world.id}
                  world={world.id}
                  chapter={chapter}
                  onStage={(index) => dispatch({ type: 'stage', world: world.id, index })}
                  onLibrary={() => {
                    window.location.hash = `library/${world.id}`;
                  }}
                />
              </div>
            ) : (
              <>
                <div className={locked ? 'preview-puzzles' : ''}>
                  <PuzzlePanel
                    world={world.id}
                    chapter={chapter}
                    state={state}
                    onAnswer={(id, correct, assisted) => {
                      if (!locked)
                        dispatch({ type: 'puzzle', world: world.id, id, correct, assisted });
                    }}
                  />
                </div>
                {locked && (
                  <p className="inline-note">
                    Las respuestas de esta vista previa permiten practicar. Resuelve los casos de
                    nuevo cuando completes los prerrequisitos para registrar evidencia.
                  </p>
                )}
              </>
            )}
            {world.id === 'active' && mode === 'operate' && <AgentLoop />}
            <div className="mission-footer">
              <p>
                {mode === 'observe'
                  ? 'Mira cómo cambia la geometría. Después, controla tú el modelo.'
                  : mode === 'operate'
                    ? 'Verifica el objetivo de campo y aplica la idea en tres problemas.'
                    : 'Tres soluciones sin ayuda y el campo verificado activan la herramienta.'}
              </p>
              <button
                className="primary"
                onClick={() =>
                  setMode(
                    mode === 'observe' ? 'operate' : mode === 'operate' ? 'transfer' : 'observe',
                  )
                }
              >
                {mode === 'observe'
                  ? 'Abrir laboratorio'
                  : mode === 'operate'
                    ? 'Ir a las misiones'
                    : 'Volver a la escena'}{' '}
                <ChevronRight size={16} />
              </button>
            </div>
            <details className="model-notebook">
              <summary>Contexto, fuentes y alcance de este mundo</summary>
              <p>{chapter.briefing}</p>
              <p>{chapter.scope}</p>
              <p>
                Desarrollo completo:{' '}
                {chapter.relatedLessonIds
                  .map((id) => getLesson(id)?.title)
                  .filter(Boolean)
                  .join(' · ')}
                .
              </p>
              <p className="source-names">
                {chapter.sources.map((s) => s.split('/').pop()).join(' · ')}
              </p>
            </details>
          </main>
        )}
        {route.page === 'library' && <Library state={state} onNavigateWorld={onOpen} />}
        {route.page === 'progress' && <Progress state={state} onOpen={onOpen} />}
        {route.page === 'arena' && (
          <main className="panel-page">
            <Arena />
          </main>
        )}
        {route.page === 'settings' && <Settings state={state} dispatch={dispatch} />}
      </div>
      <nav className="game-dock" aria-label="Navegación del juego">
        {nav.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className={
              route.page === id || (id === 'map' && route.page === 'world') ? 'selected' : ''
            }
            aria-current={route.page === id ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      {toast && (
        <div className="reward-toast" role="status">
          <span>✦</span>
          <div>
            {toast}
            <small>Tu instrumental sigue creciendo.</small>
          </div>
        </div>
      )}
      <footer className="game-footer">ENIGMA · INVESTIGACIÓN, INTUICIÓN Y MODELOS / V2.0</footer>
    </div>
  );
}
