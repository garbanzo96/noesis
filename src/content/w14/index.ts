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
  'w14-c1': { pos: [240, 230], requires: [] },
  'w14-c2': { pos: [560, 190], requires: ['w14-c1'] },
  'w14-c3': { pos: [880, 230], requires: ['w14-c2'] },
  'w14-c4': { pos: [1200, 200], requires: ['w14-c3'] },
  'w14-c5': { pos: [1290, 490], requires: ['w14-c4'] },
  'w14-c6': { pos: [970, 510], requires: ['w14-c5'] },
  'w14-c7': { pos: [650, 480], requires: ['w14-c6'] },
  'w14-c8': { pos: [320, 560], requires: ['w14-c7'] },
  'w14-final': { pos: [800, 770], requires: ['w14-c8'] },
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

export const W14: SectorDef = {
  world: 'active',
  number: 14,
  name: 'Síntesis final',
  tag: 'Torre Halcón',
  accent: '#e8364f',
  place: 'torre',
  description:
    'Todas las pistas llevan al piso 40 de la Torre Halcón. La agencia sube de noche, piso por piso, con todo lo que aprendió en la ciudad.',
  module: {
    id: 'w14-closed',
    name: 'El último piso',
    description:
      'El expediente completo del Contador, de la bodega 9 al piso 40.',
  },
  levels,
};

export const W14_GLYPHS = MODULES.flatMap((m) => m.glyphs);
