import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import * as C1 from './c1-senal';
import * as C2 from './c2-potencia';
import * as C3 from './c3-grafica';
import * as C4 from './c4-reglas';
import * as C5 from './c5-producto';
import * as C6 from './c6-cadena';
import * as C7 from './c7-exp';
import * as C8 from './c8-optimo';
import * as C9 from './c9-aprox';
import * as FINAL from './final';
import { REF_W02 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, C9, FINAL];

// Board layout (1600×900); `requires` is the story order (a recommendation, never a lock).
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w2-c1': { pos: [230, 220], requires: [] },
  'w2-c2': { pos: [560, 180], requires: ['w2-c1'] },
  'w2-c3': { pos: [890, 220], requires: ['w2-c2'] },
  'w2-c4': { pos: [1220, 190], requires: ['w2-c3'] },
  'w2-c5': { pos: [1300, 480], requires: ['w2-c4'] },
  'w2-c6': { pos: [980, 500], requires: ['w2-c5'] },
  'w2-c7': { pos: [650, 470], requires: ['w2-c6'] },
  'w2-c8': { pos: [300, 520], requires: ['w2-c7'] },
  'w2-c9': { pos: [520, 770], requires: ['w2-c8'] },
  'w2-final': { pos: [1050, 770], requires: ['w2-c9'] },
};

const levels: LevelDef[] = MODULES.map((m) => ({ ...m.level, ref: REF_W02[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }));

export const W02: SectorDef = {
  world: 'differential',
  number: 2,
  name: 'La Planta',
  tag: 'Cálculo diferencial',
  accent: '#6f9cff',
  place: 'planta',
  description: 'La central Halcón Energía de Ventanas sufre picos de consumo cada noche. Una carga oculta se conecta a las 03:12 y nadie sabe qué es.',
  module: {
    id: 'w2-closed',
    name: 'Plano de la represa',
    description: 'Los servidores ocultos se enfrían con agua de la represa. Alguien altera los caudalímetros.',
  },
  levels,
};

export const W02_GLYPHS = MODULES.flatMap((m) => m.glyphs);
