import { useEffect, useState } from 'react';
import { useKey } from '../engine/hooks';
import {
  LEVELS,
  PLAYABLE,
  SECTOR_BY_ID,
  nextLevel,
  storyNext,
  worldStarted,
} from '../content/registry';
import { LevelRunner } from './level/LevelRunner';
import type { WorldId } from './level/types';
import { music, sfx } from './audio';
import { store, useGame } from './state';
import { Atlas } from './screens/Atlas';
import { Chapter } from './screens/Chapter';
import { Prologue } from './screens/Prologue';
import { ResourcesScreen } from './screens/ResourcesScreen';
import { SectorMap } from './screens/SectorMap';
import { SettingsScreen } from './screens/SettingsScreen';
import { Title } from './screens/Title';
import { Backdrop } from './ui/Backdrop';
import { GlyphProvider } from './ui/GlyphTip';
import { TopBar } from './ui/TopBar';

type Route =
  | { name: 'title' }
  | { name: 'prologue' }
  | { name: 'atlas' }
  | { name: 'chapter'; world: WorldId }
  | { name: 'sector'; world: WorldId }
  | { name: 'level'; id: string; step?: number };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [a, b, c] = h.split('/');
  if (a === 'atlas') return { name: 'atlas' };
  if (a === 'prologo') return { name: 'prologue' };
  if (a === 'capitulo' && b && PLAYABLE[b as WorldId])
    return { name: 'chapter', world: b as WorldId };
  if (a === 'sector' && b && PLAYABLE[b as WorldId]) return { name: 'sector', world: b as WorldId };
  if (a === 'level' && b && LEVELS[b]) {
    const k = Number(c);
    return {
      name: 'level',
      id: b,
      step: Number.isInteger(k) && k > 0 && k < LEVELS[b].steps.length ? k : undefined,
    };
  }
  return { name: 'title' };
}
const toHash = (r: Route) =>
  r.name === 'title'
    ? '#/'
    : r.name === 'prologue'
      ? '#/prologo'
      : r.name === 'atlas'
        ? '#/atlas'
        : r.name === 'chapter'
          ? `#/capitulo/${r.world}`
          : r.name === 'sector'
            ? `#/sector/${r.world}`
            : `#/level/${r.id}${r.step ? `/${r.step}` : ''}`;
const sameRoute = (a: Route, b: Route) => toHash(a) === toHash(b);

const systemReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function GameRoot() {
  const game = useGame();
  const reduced = game.settings.reducedMotion || !!systemReduced;
  const [route, setRoute] = useState<Route>(parseHash);
  const [shown, setShown] = useState<Route>(route);
  const [wipe, setWipe] = useState(false);
  const [overlay, setOverlay] = useState<'codex' | 'settings' | null>(null);
  const [resFocus, setResFocus] = useState<string | undefined>(undefined);
  const [levelKey, setLevelKey] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // screen transition: wipe out → swap → wipe in
  useEffect(() => {
    if (sameRoute(route, shown)) return;
    if (reduced) {
      setShown(route);
      return;
    }
    setWipe(true);
    sfx.whoosh();
    const a = setTimeout(() => setShown(route), 260);
    const b = setTimeout(() => setWipe(false), 560);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // score outside a case (LevelRunner sets its own per step)
  useEffect(() => {
    if (shown.name === 'level') return;
    music.world(
      shown.name === 'chapter' || shown.name === 'sector' ? SECTOR_BY_ID[shown.world].number : 0,
    );
    music.mood(shown.name === 'title' ? 'title' : shown.name === 'prologue' ? 'scene' : 'map');
  }, [shown]);

  const go = (r: Route) => {
    window.location.hash = toHash(r);
  };
  const openResources = (focus?: string) => {
    setResFocus(focus);
    setOverlay('codex');
  };
  useKey(
    ['r', 'R', 'c', 'C'],
    () => openResources(shown.name === 'level' ? shown.id : undefined),
    !overlay,
  );
  /** jump from Resources (or a board) straight into a step of a case */
  const goStep = (id: string, step: number) => {
    setOverlay(null);
    setLevelKey((k) => k + 1);
    go({ name: 'level', id, step: step > 0 ? step : undefined });
  };

  const openSector = (w: WorldId) => go({ name: 'sector', world: w });
  /** follow the story: the next open case, announced by a chapter card when a world begins */
  const story = storyNext(game);
  const continueStory = () => {
    if (!story) return go({ name: 'atlas' });
    if (!worldStarted(game, story.world)) return go({ name: 'chapter', world: story.world });
    setLevelKey((k) => k + 1);
    go({ name: 'level', id: story.id });
  };
  const storyLabel = story ? `Caso ${story.code} · ${story.title}` : undefined;
  const accent =
    shown.name === 'sector'
      ? SECTOR_BY_ID[shown.world].accent
      : shown.name === 'level'
        ? SECTOR_BY_ID[LEVELS[shown.id].world].accent
        : '#28e7fa';

  let screen: React.ReactNode = null;
  if (shown.name === 'title')
    screen = (
      <Title
        onContinue={continueStory}
        nextLabel={storyLabel}
        onMap={() => go({ name: 'atlas' })}
        onPrologue={() => go({ name: 'prologue' })}
        onCodex={() => openResources()}
        onSettings={() => setOverlay('settings')}
      />
    );
  else if (shown.name === 'prologue') screen = <Prologue onDone={continueStory} />;
  else if (shown.name === 'chapter') {
    const def = PLAYABLE[shown.world]!;
    const first = def.levels.find((l) => !game.levels[l.id]?.done && !l.wip) ?? def.levels[0];
    screen = (
      <Chapter
        world={shown.world}
        first={first}
        reduced={reduced}
        onStart={() => {
          setLevelKey((k) => k + 1);
          go({ name: 'level', id: first.id });
        }}
        onBoard={() => openSector(shown.world)}
        onMap={() => go({ name: 'atlas' })}
      />
    );
  } else if (shown.name === 'atlas')
    screen = (
      <>
        <TopBar
          title="MAPA DE MUNDOS · VALPARAÍSO 2089"
          onBack={() => go({ name: 'title' })}
          backLabel="INICIO"
          onCodex={() => openResources()}
          onSettings={() => setOverlay('settings')}
          reduced={reduced}
        />
        <Atlas
          onOpen={openSector}
          reduced={reduced}
          onContinue={story ? continueStory : undefined}
          continueLabel={storyLabel}
        />
      </>
    );
  else if (shown.name === 'sector') {
    const sector = PLAYABLE[shown.world]!;
    screen = (
      <>
        <TopBar
          title={`MUNDO ${sector.number} · ${sector.name.toUpperCase()} · ${sector.tag.toUpperCase()}`}
          onBack={() => go({ name: 'atlas' })}
          backLabel="MAPA"
          onCodex={() => openResources()}
          onSettings={() => setOverlay('settings')}
          reduced={reduced}
        />
        <SectorMap
          sector={sector}
          reduced={reduced}
          onPlay={(l, step) => goStep(l.id, step ?? 0)}
          onResources={(id) => openResources(id)}
        />
      </>
    );
  } else if (shown.name === 'level') {
    const level = LEVELS[shown.id];
    const sector = PLAYABLE[level.world]!;
    const nxt = nextLevel(game, level.world, level.id);
    screen = (
      <LevelRunner
        key={`${level.id}-${levelKey}`}
        level={level}
        startStep={shown.step}
        sector={sector}
        overlayOpen={!!overlay}
        onExit={() => go({ name: 'sector', world: level.world })}
        onNext={
          nxt && nxt.id !== level.id
            ? () => {
                setLevelKey((k) => k + 1);
                go({ name: 'level', id: nxt.id });
              }
            : story && story.world !== level.world
              ? () => go({ name: 'chapter', world: story.world })
              : undefined
        }
        nextLabel={
          nxt && nxt.id !== level.id
            ? `${nxt.code} ${nxt.title}`
            : story && story.world !== level.world
              ? `Capítulo ${PLAYABLE[story.world]!.number} · ${PLAYABLE[story.world]!.name}`
              : undefined
        }
        onOpenCodex={() => openResources(level.id)}
        onOpenSettings={() => setOverlay('settings')}
      />
    );
  }

  return (
    <GlyphProvider>
      <div
        className={`game-root ${reduced ? 'reduced' : ''}`}
        style={{ ['--accent' as string]: accent }}
      >
        <Backdrop reduced={reduced} accent={accent} />
        <div className="screen" key={toHash(shown)}>
          {screen}
        </div>
        {wipe && (
          <div className="wipe shutter" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
        )}
        {overlay === 'codex' && (
          <ResourcesScreen focus={resFocus} onClose={() => setOverlay(null)} onGo={goStep} />
        )}
        {overlay === 'settings' && <SettingsScreen onClose={() => setOverlay(null)} />}
        <div className="scanlines" aria-hidden />
      </div>
    </GlyphProvider>
  );
}
