import type { LessonStep, LevelModule, Step, WorldId } from '../game/level/types';

/** Placeholder for a case still being written: listed on the board, not playable. */
export function stub(world: WorldId, id: string, code: string, title: string, subtitle: string, glyph: string): LevelModule {
  return {
    level: {
      id,
      world,
      code,
      title,
      subtitle,
      glyph,
      kind: 'level',
      wip: true,
      teaser: 'En preparación.',
      learn: subtitle,
      glyphs: [],
      steps: [{ kind: 'scene', place: 'oficina', lines: [{ who: 'iris', text: 'Este caso todavía no está listo.' }] }],
    },
    glyphs: [],
  };
}

/** Insert a lesson right after the opening scene of a case. */
export function withLesson<T extends { steps: Step[] }>(level: T, lesson?: LessonStep): T {
  if (!lesson || level.steps.some((s) => s.kind === 'lesson')) return level;
  const k = level.steps.findIndex((s) => s.kind !== 'scene');
  const at = k < 0 ? level.steps.length : k;
  return { ...level, steps: [...level.steps.slice(0, at), lesson, ...level.steps.slice(at)] };
}
