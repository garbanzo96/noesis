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
  'w10-c1': { pos: [240, 230], requires: [] },
  'w10-c2': { pos: [560, 190], requires: ['w10-c1'] },
  'w10-c3': { pos: [880, 230], requires: ['w10-c2'] },
  'w10-c4': { pos: [1200, 200], requires: ['w10-c3'] },
  'w10-c5': { pos: [1290, 490], requires: ['w10-c4'] },
  'w10-c6': { pos: [970, 510], requires: ['w10-c5'] },
  'w10-c7': { pos: [650, 480], requires: ['w10-c6'] },
  'w10-c8': { pos: [320, 560], requires: ['w10-c7'] },
  'w10-final': { pos: [800, 770], requires: ['w10-c8'] },
};

const levels: LevelDef[] = MODULES.map((m) =>
  withLesson(
    { ...m.level, ref: m.ref, ...(LAYOUT[m.level.id] ?? { pos: [800, 450], requires: [] }) },
    m.lesson,
  ),
);

export const W10: SectorDef = {
  world: 'bayesian',
  number: 10,
  name: 'Inferencia bayesiana',
  tag: 'La Clínica',
  accent: '#ff8fa3',
  place: 'clinica',
  description:
    'Las vacunas desviadas llegaron a la Clínica del Cerro. Su test rápido da positivo demasiadas veces, y cada positivo autoriza a pedir más dosis.',
  module: {
    id: 'w10-closed',
    name: 'El lector de tests',
    description:
      'Un lector calibrado por el Laboratorio de Halcón, con un modelo que nadie puede calcular exacto.',
  },
  levels,
};

export const W10_GLYPHS = MODULES.flatMap((m) => m.glyphs);
