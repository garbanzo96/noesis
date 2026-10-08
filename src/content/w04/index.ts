import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-vectores';
import * as C2 from './c2-combinaciones';
import * as C3 from './c3-producto-punto';
import * as C4 from './c4-matrices';
import * as C5 from './c5-sistemas';
import * as C6 from './c6-producto';
import * as C7 from './c7-determinante';
import * as C8 from './c8-propios';
import * as FINAL from './final';
import { REF_W04 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, FINAL];

// Board layout (1600×900); `requires` is the story order (a recommendation, never a lock).
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w4-c1': { pos: [230, 220], requires: [] },
  'w4-c2': { pos: [560, 180], requires: ['w4-c1'] },
  'w4-c3': { pos: [890, 220], requires: ['w4-c2'] },
  'w4-c4': { pos: [1220, 190], requires: ['w4-c3'] },
  'w4-c5': { pos: [1300, 480], requires: ['w4-c4'] },
  'w4-c6': { pos: [980, 500], requires: ['w4-c5'] },
  'w4-c7': { pos: [650, 470], requires: ['w4-c6'] },
  'w4-c8': { pos: [300, 560], requires: ['w4-c7'] },
  'w4-final': { pos: [800, 770], requires: ['w4-c8'] },
};

const levels: LevelDef[] = MODULES.map((m) => withLesson({ ...m.level, ref: REF_W04[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }, m.lesson));

export const W04: SectorDef = {
  world: 'linear',
  number: 4,
  name: 'Álgebra lineal',
  tag: 'El Metro',
  accent: '#9cff6e',
  place: 'metro',
  description: 'En el centro de control del Metro de Valparaíso, un tren de mantención sale cada noche sin horario y las pantallas lo muestran donde no está.',
  module: {
    id: 'w4-closed',
    name: 'Discos del Archivo',
    description: 'El vagón sellado de las Cocheras guardaba copias del registro de vacunación del Archivo Regional.',
  },
  levels,
};

export const W04_GLYPHS = MODULES.flatMap((m) => m.glyphs);
