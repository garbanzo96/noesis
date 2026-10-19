import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-registro';
import * as C2 from './c2-centro';
import * as C3 from './c3-dispersion';
import * as C4 from './c4-normal';
import * as C5 from './c5-muestra';
import * as C6 from './c6-intervalos';
import * as C7 from './c7-prueba';
import * as C8 from './c8-regresion';
import * as FINAL from './final';
import { REF_W06 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, FINAL];

// Board layout (1600×900); `requires` is the story order (a recommendation, never a lock).
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w6-c1': { pos: [230, 220], requires: [] },
  'w6-c2': { pos: [560, 180], requires: ['w6-c1'] },
  'w6-c3': { pos: [890, 220], requires: ['w6-c2'] },
  'w6-c4': { pos: [1220, 190], requires: ['w6-c3'] },
  'w6-c5': { pos: [1300, 480], requires: ['w6-c4'] },
  'w6-c6': { pos: [980, 500], requires: ['w6-c5'] },
  'w6-c7': { pos: [650, 470], requires: ['w6-c6'] },
  'w6-c8': { pos: [300, 560], requires: ['w6-c7'] },
  'w6-final': { pos: [800, 770], requires: ['w6-c8'] },
};

const levels: LevelDef[] = MODULES.map((m) => withLesson({ ...m.level, ref: REF_W06[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }, m.lesson));

export const W06: SectorDef = {
  world: 'statistics',
  number: 6,
  name: 'Estadística',
  tag: 'El Archivo',
  accent: '#ff9f6e',
  place: 'archivo',
  description: 'En el Archivo Regional hay dos copias del registro de vacunación de la Clínica del Cerro. La que viajó en el Metro no dice lo mismo que la oficial.',
  module: {
    id: 'w6-closed',
    name: 'Bitácora de drones',
    description: 'El registro oficial se alteró desde la base de Halcón Drones en Los Cerros; un dron con vacunas se perdió en una quebrada.',
  },
  levels,
};

export const W06_GLYPHS = MODULES.flatMap((m) => m.glyphs);
