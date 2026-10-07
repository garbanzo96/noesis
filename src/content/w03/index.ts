import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-caudal';
import { REF_W03 } from './ref';

const MODULES: LevelModule[] = [C1];

// Board layout (1600×900); `requires` is the story order (a recommendation, never a lock).
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w3-c1': { pos: [230, 220], requires: [] },
  'w3-c2': { pos: [560, 180], requires: ['w3-c1'] },
  'w3-c3': { pos: [890, 220], requires: ['w3-c2'] },
  'w3-c4': { pos: [1220, 190], requires: ['w3-c3'] },
  'w3-c5': { pos: [1300, 480], requires: ['w3-c4'] },
  'w3-c6': { pos: [980, 500], requires: ['w3-c5'] },
  'w3-c7': { pos: [650, 470], requires: ['w3-c6'] },
  'w3-c8': { pos: [300, 560], requires: ['w3-c7'] },
  'w3-final': { pos: [800, 770], requires: ['w3-c8'] },
};

const levels: LevelDef[] = MODULES.map((m) => withLesson({ ...m.level, ref: REF_W03[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }, m.lesson));

export const W03: SectorDef = {
  world: 'integral',
  number: 3,
  name: 'Cálculo integral',
  tag: 'La Represa',
  accent: '#a88aff',
  place: 'represa',
  description: 'En la represa Peñuelas, los informes de caudal no cuadran con el nivel del lago. Cada noche desaparecen miles de metros cúbicos rumbo a la central.',
  module: {
    id: 'w3-closed',
    name: 'Enlace del Metro',
    description: 'Los caudalímetros se controlaban desde un servidor del Metro de Valparaíso.',
  },
  levels,
};

export const W03_GLYPHS = MODULES.flatMap((m) => m.glyphs);
