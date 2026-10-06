import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import * as C1 from './c1-casa';
import * as C2 from './c2-tiradas';
import * as C3 from './c3-reglas';
import * as C4 from './c4-tabla';
import * as C5 from './c5-condicional';
import * as C6 from './c6-independencia';
import * as C7 from './c7-arboles';
import * as C8 from './c8-bayes';
import * as C9 from './c9-esperanza';
import * as FINAL from './final';
import { REF_W05 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, C9, FINAL];

const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w5-c1': { pos: [230, 220], requires: [] },
  'w5-c2': { pos: [560, 180], requires: ['w5-c1'] },
  'w5-c3': { pos: [890, 220], requires: ['w5-c2'] },
  'w5-c4': { pos: [1220, 190], requires: ['w5-c3'] },
  'w5-c5': { pos: [1300, 480], requires: ['w5-c4'] },
  'w5-c6': { pos: [980, 500], requires: ['w5-c5'] },
  'w5-c7': { pos: [650, 470], requires: ['w5-c6'] },
  'w5-c8': { pos: [300, 520], requires: ['w5-c7'] },
  'w5-c9': { pos: [520, 770], requires: ['w5-c8'] },
  'w5-final': { pos: [1050, 770], requires: ['w5-c9'] },
};

const levels: LevelDef[] = MODULES.map((m) => ({ ...m.level, ref: REF_W05[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }));

export const W05: SectorDef = {
  world: 'probability',
  number: 5,
  name: 'Probabilidad',
  tag: 'Casino Aurora',
  accent: '#ffbc5e',
  place: 'casino',
  description: 'El dinero del contrabando entra por las mesas del Barón Ferrer. Algunos juegos están amañados y en la mesa 7 alguien gana demasiado.',
  module: {
    id: 'w5-closed',
    name: 'Libreta del Barón',
    description: 'Entre las fichas incautadas hay una libreta con nombres de pacientes de la Clínica del Cerro.',
  },
  levels,
};

export const W05_GLYPHS = MODULES.flatMap((m) => m.glyphs);
