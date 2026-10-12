import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-mapa';
import * as C2 from './c2-ladera';
import * as C3 from './c3-cuesta';
import * as C4 from './c4-lupa';
import * as C5 from './c5-portezuelo';
import * as C6 from './c6-bateria';
import { REF_W07 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6];

const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w7-c1': { pos: [350, 530], requires: [] },
  'w7-c2': { pos: [800, 290], requires: ['w7-c1'] },
  'w7-c3': { pos: [1250, 520], requires: ['w7-c2'] },
  'w7-c4': { pos: [1250, 750], requires: ['w7-c3'] },
  'w7-c5': { pos: [800, 730], requires: ['w7-c4'] },
  'w7-c6': { pos: [350, 760], requires: ['w7-c5'] },
};

const levels: LevelDef[] = MODULES.map((m) =>
  withLesson(
    {
      ...m.level,
      ref: REF_W07[m.level.id],
      ...LAYOUT[m.level.id],
    },
    m.lesson,
  ),
);

export const W07: SectorDef = {
  world: 'multivariate',
  number: 7,
  name: 'Varias variables',
  tag: 'Los Cerros',
  accent: '#ff6b4a',
  place: 'cerros',
  description:
    'El informe del Archivo lleva a Halcón Drones en Los Cerros. Un dron del contrabando no volvió: hay que encontrarlo antes de que la lluvia lo arrastre quebrada abajo.',
  module: {
    id: 'w7-chip',
    name: 'Chip del dron',
    description:
      'El dron perdido guarda las rutas del contrabando y mensajes cifrados que viajan por una red de antenas.',
  },
  levels,
};

export const W07_GLYPHS = MODULES.flatMap((m) => m.glyphs);
