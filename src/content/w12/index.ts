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
  'w12-c1': { pos: [240, 230], requires: [] },
  'w12-c2': { pos: [560, 190], requires: ['w12-c1'] },
  'w12-c3': { pos: [880, 230], requires: ['w12-c2'] },
  'w12-c4': { pos: [1200, 200], requires: ['w12-c3'] },
  'w12-c5': { pos: [1290, 490], requires: ['w12-c4'] },
  'w12-c6': { pos: [970, 510], requires: ['w12-c5'] },
  'w12-c7': { pos: [650, 480], requires: ['w12-c6'] },
  'w12-c8': { pos: [320, 560], requires: ['w12-c7'] },
  'w12-final': { pos: [800, 770], requires: ['w12-c8'] },
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

export const W12: SectorDef = {
  world: 'generative',
  number: 12,
  name: 'Modelos generativos',
  tag: 'La Fábrica',
  accent: '#c9b37e',
  place: 'fabrica',
  description:
    'En el servidor del Laboratorio hay registros clínicos que nadie distingue de los reales. Vienen de La Fábrica, una planta de datos en el viejo barrio industrial.',
  module: {
    id: 'w12-closed',
    name: 'El lote perfecto',
    description:
      'Los registros falsos alimentaron apuestas de seguros sanitarios en La Bolsa.',
  },
  levels,
};

export const W12_GLYPHS = MODULES.flatMap((m) => m.glyphs);
