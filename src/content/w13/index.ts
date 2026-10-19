import type { LevelDef, LevelModule, SectorDef, TopicRef } from '../../game/level/types';
import { withLesson } from '../stub';

/**
 * Each case file exports `level`, `glyphs`, `lesson` and its reference sheet `ref`. They are
 * picked up here by file name, so a new case joins the world without editing shared files.
 */
type CaseModule = LevelModule & { ref?: TopicRef };
const FOUND = import.meta.glob<CaseModule>(['./c*.tsx', './final.tsx'], { eager: true });
const MODULES: CaseModule[] = Object.keys(FOUND)
  .sort()
  .map((k) => FOUND[k]);

const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w13-c1': { pos: [240, 230], requires: [] },
  'w13-c2': { pos: [560, 190], requires: ['w13-c1'] },
  'w13-c3': { pos: [880, 230], requires: ['w13-c2'] },
  'w13-c4': { pos: [1200, 200], requires: ['w13-c3'] },
  'w13-c5': { pos: [1290, 490], requires: ['w13-c4'] },
  'w13-c6': { pos: [970, 510], requires: ['w13-c5'] },
  'w13-c7': { pos: [650, 480], requires: ['w13-c6'] },
  'w13-c8': { pos: [320, 560], requires: ['w13-c7'] },
  'w13-final': { pos: [800, 770], requires: ['w13-c8'] },
};

// A case only requires cases that already exist, so cases can arrive in any order.
const present = new Set(MODULES.map((m) => m.level.id));
const levels: LevelDef[] = MODULES.map((m) => {
  const place = LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] };
  return withLesson(
    {
      ...m.level,
      ref: m.ref,
      pos: place.pos,
      requires: place.requires.filter((r) => present.has(r)),
    },
    m.lesson,
  );
});

export const W13: SectorDef = {
  world: 'decision',
  number: 13,
  name: 'Decisión secuencial',
  tag: 'La Bolsa',
  accent: '#e6e9f2',
  place: 'bolsa',
  description:
    'Los registros fabricados movían anuncios sanitarios y contratos de seguros. En La Bolsa, una cuenta compraba siempre un poco antes que los demás.',
  module: {
    id: 'w13-closed',
    name: 'La cuenta del último piso',
    description:
      'La cuenta que compraba antes que el mercado está registrada en el piso 40 de la Torre Halcón.',
  },
  levels,
};

export const W13_GLYPHS = MODULES.flatMap((m) => m.glyphs);
