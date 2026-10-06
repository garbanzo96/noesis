import type { LevelModule, WorldId } from '../game/level/types';

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
