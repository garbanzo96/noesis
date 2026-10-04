import type { LevelModule } from '../../game/level/types';

/** Placeholder for a level under construction: playable briefing only, no stars inflation. */
export function stub(id: string, code: string, title: string, subtitle: string, glyph: string): LevelModule {
  return {
    level: {
      id,
      world: 'foundations',
      code,
      title,
      subtitle,
      glyph,
      kind: 'level',
      objective: 'Nivel en construcción.',
      glyphs: [],
      codex: [],
      steps: [{ kind: 'brief', lines: [`Protocolo ${code} en construcción. Vuelve pronto.`] }],
    },
    codex: [],
    glyphs: [],
  };
}
