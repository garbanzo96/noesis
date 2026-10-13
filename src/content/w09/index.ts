import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-papel';
import * as C2 from './c2-horario';
import * as C3 from './c3-paso';
import { REF_W09 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3];
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w9-c1': { pos: [230, 220], requires: [] },
  'w9-c2': { pos: [560, 180], requires: ['w9-c1'] },
  'w9-c3': { pos: [890, 220], requires: ['w9-c2'] },
  'w9-c4': { pos: [1220, 190], requires: ['w9-c3'] },
  'w9-c5': { pos: [1300, 480], requires: ['w9-c4'] },
  'w9-c6': { pos: [980, 500], requires: ['w9-c5'] },
  'w9-c7': { pos: [650, 470], requires: ['w9-c6'] },
  'w9-c8': { pos: [300, 560], requires: ['w9-c7'] },
  'w9-final': { pos: [800, 770], requires: ['w9-c8'] },
};
const levels: LevelDef[] = MODULES.map((m) =>
  withLesson({ ...m.level, ref: REF_W09[m.level.id], ...LAYOUT[m.level.id] }, m.lesson),
);
export const W09: SectorDef = {
  world: 'dynamics',
  number: 9,
  name: 'Sistemas dinámicos',
  tag: 'El Observatorio',
  accent: '#e7df5a',
  place: 'observatorio',
  description:
    'El papel del registrador conserva la tormenta que el boletín borró. La agencia reconstruye la salida privada del pronóstico y los ajustes cambiados antes de la entrega de vacunas.',
  module: {
    id: 'w9-closed',
    name: 'La copia y el recibo',
    description:
      'El pronóstico privado, el recibo de Halcón y las copias públicas enlazan la entrega en el Observatorio con la recepción de vacunas en la Clínica del Cerro.',
  },
  levels,
};
export const W09_GLYPHS = MODULES.flatMap((m) => m.glyphs);
