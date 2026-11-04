import type { LevelDef, LevelModule, SectorDef, TopicRef } from '../../game/level/types';
import { withLesson } from '../stub';

/**
 * Each case file exports `level`, `glyphs`, `lesson` and its reference sheet `ref`. They are
 * picked up here by file name, so a new case joins the world without editing shared files.
 */
type CaseModule = LevelModule & { ref?: TopicRef };
const FOUND = import.meta.glob<CaseModule>(['./c*.tsx', './final.tsx'], { eager: true });
const MODULES: CaseModule[] = Object.keys(FOUND)
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  .map((k) => FOUND[k]);

const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w13-c1': { pos: [190, 170], requires: [] },
  'w13-c2': { pos: [490, 170], requires: ['w13-c1'] },
  'w13-c3': { pos: [790, 170], requires: ['w13-c2'] },
  'w13-c4': { pos: [1090, 170], requires: ['w13-c3'] },
  'w13-c5': { pos: [1390, 170], requires: ['w13-c4'] },
  'w13-c6': { pos: [1390, 450], requires: ['w13-c5'] },
  'w13-c7': { pos: [1090, 450], requires: ['w13-c6'] },
  'w13-c8': { pos: [790, 450], requires: ['w13-c7'] },
  'w13-c9': { pos: [490, 450], requires: ['w13-c8'] },
  'w13-c10': { pos: [190, 450], requires: ['w13-c9'] },
  'w13-c11': { pos: [340, 730], requires: ['w13-c10'] },
  'w13-c12': { pos: [790, 730], requires: ['w13-c11'] },
  'w13-final': { pos: [1240, 730], requires: ['w13-c12', 'w13-c8'] },
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
