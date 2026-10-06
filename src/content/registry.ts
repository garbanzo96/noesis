import type { CodexEntry, Glyph, LevelDef, SectorDef, WorldId } from '../game/level/types';
import { codexFor } from '../game/level/notes';
import type { GameState } from '../game/state';
import { W01, W01_GLYPHS } from './w01';
import { W05, W05_GLYPHS } from './w05';
import { SECTORS, SECTOR_BY_ID } from './sectors';

export { SECTORS, SECTOR_BY_ID };

/** Districts with playable cases. Others appear on the city map as closed. */
export const PLAYABLE: Partial<Record<WorldId, SectorDef>> = { foundations: W01, probability: W05 };

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(
  Object.values(PLAYABLE).flatMap((s) => s!.levels.map((l) => [l.id, l])),
);
export const CODEX_LIST: CodexEntry[] = Object.values(PLAYABLE).flatMap((s) => s!.levels.filter((l) => !l.wip).map(codexFor));
export const CODEX: Record<string, CodexEntry> = Object.fromEntries(CODEX_LIST.map((c) => [c.id, c]));
export const GLYPH_LIST: Glyph[] = [...W01_GLYPHS, ...W05_GLYPHS];
export const GLYPHS: Record<string, Glyph> = Object.fromEntries(GLYPH_LIST.map((g) => [g.id, g]));

// ---------- gating ----------
export function levelState(s: GameState, l: LevelDef): 'done' | 'open' | 'locked' | 'wip' {
  if (l.wip) return 'wip';
  if (s.levels[l.id]?.done) return 'done';
  if (s.settings.freeMode) return 'open';
  // a dependency still under construction does not block its dependents
  return l.requires.every((r) => s.levels[r]?.done || LEVELS[r]?.wip) ? 'open' : 'locked';
}

export function sectorState(s: GameState, w: WorldId): 'done' | 'open' | 'locked' | 'sealed' {
  const def = PLAYABLE[w];
  if (!def) return 'sealed';
  const boss = def.levels.find((l) => l.kind === 'boss');
  if (boss && s.levels[boss.id]?.done) return 'done';
  if (s.settings.freeMode) return 'open';
  const prereq = SECTOR_BY_ID[w].prerequisites;
  return prereq.every((p) => !PLAYABLE[p] || sectorState(s, p) === 'done') ? 'open' : 'locked';
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

/** The next case to play in a district: first open, not-done case in board order. */
export function nextLevel(s: GameState, w: WorldId, after?: string): LevelDef | undefined {
  const def = PLAYABLE[w];
  if (!def) return undefined;
  const order = def.levels;
  const start = after ? order.findIndex((l) => l.id === after) + 1 : 0;
  const rest = [...order.slice(start), ...order.slice(0, start)];
  return rest.find((l) => levelState(s, l) === 'open');
}
