import type { Beat, CodexEntry, LevelDef, Note } from './types';

/** Notebook entries produced by one beat: its note and any labelled blackboard line. */
export function beatNotes(b: Beat): Note[] {
  const out: Note[] = [];
  const lines = b.board ? (Array.isArray(b.board) ? b.board : [b.board]) : [];
  for (const l of lines) if (l.label) out.push({ label: l.label, tex: l.tex.replace(/\\p\{\d+\}/g, ''), body: l.body });
  if (b.note) out.push(b.note);
  return out;
}

/** Add notes without repeating a label already present. */
export function mergeNotes(ns: Note[], add: Note[]): Note[] {
  const out = [...ns];
  for (const n of add) if (!out.some((x) => x.label === n.label)) out.push(n);
  return out;
}

/** All notebook entries a level can produce (lesson and demo beats in order + extra notes). */
export function levelNotes(level: LevelDef): Note[] {
  let out: Note[] = [];
  for (const s of level.steps) if (s.kind === 'demo' || s.kind === 'lesson') for (const b of s.beats) out = mergeNotes(out, beatNotes(b));
  return mergeNotes(out, level.notes ?? []);
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
