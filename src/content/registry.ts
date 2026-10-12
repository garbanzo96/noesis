import type { CodexEntry, Glyph, LevelDef, SectorDef, WorldId } from '../game/level/types';
import { codexFor } from '../game/level/notes';
import type { GameState } from '../game/state';
import { W01, W01_GLYPHS } from './w01';
import { W02, W02_GLYPHS } from './w02';
import { W03, W03_GLYPHS } from './w03';
import { W04, W04_GLYPHS } from './w04';
import { W05, W05_GLYPHS } from './w05';
import { W06, W06_GLYPHS } from './w06';
import { W07, W07_GLYPHS } from './w07';
import { SECTORS, SECTOR_BY_ID } from './sectors';

export { SECTORS, SECTOR_BY_ID };

/** Districts with playable cases. Others appear on the city map as closed. */
export const PLAYABLE: Partial<Record<WorldId, SectorDef>> = { foundations: W01, differential: W02, integral: W03, linear: W04, probability: W05, statistics: W06, multivariate: W07 };

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(
  Object.values(PLAYABLE).flatMap((s) => s!.levels.map((l) => [l.id, l])),
);
export const CODEX_LIST: CodexEntry[] = Object.values(PLAYABLE).flatMap((s) => s!.levels.filter((l) => !l.wip).map(codexFor));
export const CODEX: Record<string, CodexEntry> = Object.fromEntries(CODEX_LIST.map((c) => [c.id, c]));
export const GLYPH_LIST: Glyph[] = [...W01_GLYPHS, ...W02_GLYPHS, ...W03_GLYPHS, ...W04_GLYPHS, ...W05_GLYPHS, ...W06_GLYPHS, ...W07_GLYPHS];
export const GLYPHS: Record<string, Glyph> = Object.fromEntries(GLYPH_LIST.map((g) => [g.id, g]));

// ---------- access ----------
// Everything playable is always open: this is a study resource and any topic can be reviewed on
// its own. The story order only decides which case is recommended next.
export function levelState(s: GameState, l: LevelDef): 'done' | 'open' | 'locked' | 'wip' {
  if (l.wip) return 'wip';
  if (s.levels[l.id]?.done) return 'done';
  return 'open';
}

export function sectorState(s: GameState, w: WorldId): 'done' | 'open' | 'locked' | 'sealed' {
  const def = PLAYABLE[w];
  if (!def) return 'sealed';
  const boss = def.levels.find((l) => l.kind === 'boss');
  if (boss && s.levels[boss.id]?.done) return 'done';
  return 'open';
}

export function sectorStars(s: GameState, w: WorldId) {
  const def = PLAYABLE[w];
  if (!def) return { got: 0, max: 0, done: 0, total: 0 };
  let got = 0;
  let done = 0;
  for (const l of def.levels) {
    const r = s.levels[l.id];
    if (r?.done) done += 1;
    got += r ? r.stars.filter(Boolean).length : 0;
  }
  return { got, max: def.levels.length * 3, done, total: def.levels.length };
}

/** The recommended case in a district: the first not-done case in story order after `after`. */
export function nextLevel(s: GameState, w: WorldId, after?: string): LevelDef | undefined {
  const def = PLAYABLE[w];
  if (!def) return undefined;
  const order = def.levels;
  const start = after ? order.findIndex((l) => l.id === after) + 1 : 0;
  const rest = [...order.slice(start), ...order.slice(0, start)];
  return rest.find((l) => levelState(s, l) === 'open');
}

/** Topics with a reference sheet, in story order, per playable district. */
export const TOPICS: { world: WorldId; levels: LevelDef[] }[] = Object.values(PLAYABLE).map((s) => ({
  world: s!.world,
  levels: s!.levels.filter((l) => !l.wip && l.kind !== 'boss'),
}));
