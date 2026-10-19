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
  'w11-c1': { pos: [240, 230], requires: [] },
  'w11-c2': { pos: [560, 190], requires: ['w11-c1'] },
  'w11-c3': { pos: [880, 230], requires: ['w11-c2'] },
  'w11-c4': { pos: [1200, 200], requires: ['w11-c3'] },
  'w11-c5': { pos: [1290, 490], requires: ['w11-c4'] },
  'w11-c6': { pos: [970, 510], requires: ['w11-c5'] },
  'w11-c7': { pos: [650, 480], requires: ['w11-c6'] },
  'w11-c8': { pos: [320, 560], requires: ['w11-c7'] },
  'w11-final': { pos: [800, 770], requires: ['w11-c8'] },
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

export const W11: SectorDef = {
  world: 'variational',
  number: 11,
  name: 'Inferencia variacional',
  tag: 'El Laboratorio',
  accent: '#d68cff',
  place: 'laboratorio',
  description:
    'El lector de la Clínica usa un modelo del Laboratorio de Halcón. Dicen que el modelo exacto no se puede calcular y que lo aproximan; falta ver cómo eligieron la aproximación.',
  module: {
    id: 'w11-closed',
    name: 'La receta',
    description:
      'La aproximación que el Laboratorio eligió para que los sanos desaparecieran de los datos.',
  },
  levels,
};

export const W11_GLYPHS = MODULES.flatMap((m) => m.glyphs);
