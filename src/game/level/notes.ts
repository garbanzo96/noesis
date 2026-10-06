import type { CodexEntry, LevelDef, Note } from './types';

/** All notebook entries a level can produce (demo beats in order + extra notes). */
export function levelNotes(level: LevelDef): Note[] {
  const out: Note[] = [];
  for (const s of level.steps) if (s.kind === 'demo') for (const b of s.beats) if (b.note) out.push(b.note);
  return [...out, ...(level.notes ?? [])];
}

/** The notebook card of a case, as shown in the codex. */
export function codexFor(level: LevelDef): CodexEntry {
  return {
    id: level.id,
    world: level.world,
    title: level.subtitle,
    summary: level.learn,
    blocks: levelNotes(level),
    pitfalls: level.pitfalls,
    level: level.id,
  };
}
