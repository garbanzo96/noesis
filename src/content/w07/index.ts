import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-mapa';
import * as C2 from './c2-ladera';
import * as C3 from './c3-cuesta';
import * as C4 from './c4-lupa';
import * as C5 from './c5-portezuelo';
import * as C6 from './c6-bateria';
import * as C7 from './c7-lluvia';
import * as C8 from './c8-radio';
import * as FINAL from './final';
import { REF_W07 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, FINAL];

const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w7-c1': { pos: [230, 220], requires: [] },
  'w7-c2': { pos: [560, 180], requires: ['w7-c1'] },
  'w7-c3': { pos: [890, 220], requires: ['w7-c2'] },
  'w7-c4': { pos: [1220, 190], requires: ['w7-c3'] },
  'w7-c5': { pos: [1300, 480], requires: ['w7-c4'] },
  'w7-c6': { pos: [980, 500], requires: ['w7-c5'] },
  'w7-c7': { pos: [650, 470], requires: ['w7-c6'] },
  'w7-c8': { pos: [300, 560], requires: ['w7-c7'] },
  'w7-final': { pos: [800, 770], requires: ['w7-c8'] },
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
    id: 'w7-closed',
    name: 'Chip del dron',
    description:
      'El dron perdido guarda las rutas del contrabando y mensajes cifrados que viajan por una red de antenas.',
  },
  levels,
};

export const W07_GLYPHS = MODULES.flatMap((m) => m.glyphs);
