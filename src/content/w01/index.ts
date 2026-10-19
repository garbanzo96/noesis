import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import * as C1 from './c1-cadena';
import * as C2 from './c2-marea';
import * as C3 from './c3-camion';
import * as C4 from './c4-cifrado';
import * as C5 from './c5-cuentas';
import * as C6 from './c6-reparto';
import * as C7 from './c7-virus';
import * as C8 from './c8-cuenta';
import * as FINAL from './final';
import { REF_W01 } from './ref';
import { LESSONS_W01 } from './lessons';
import { withLesson } from '../stub';

const MODULES: LevelModule[] = [C1, C2, C3, C4, C5, C6, C7, C8, FINAL];

// Board layout (1600×900) and mathematical dependencies between cases.
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w1-c1': { pos: [230, 250], requires: [] },
  'w1-c2': { pos: [560, 190], requires: ['w1-c1'] },
  'w1-c3': { pos: [900, 200], requires: ['w1-c2'] },
  'w1-c4': { pos: [700, 460], requires: ['w1-c3'] },
  'w1-c5': { pos: [270, 560], requires: ['w1-c4'] },
  'w1-c6': { pos: [460, 760], requires: ['w1-c5'] },
  'w1-c7': { pos: [940, 680], requires: ['w1-c6'] },
  'w1-c8': { pos: [1230, 560], requires: ['w1-c7'] },
  'w1-final': { pos: [1300, 250], requires: ['w1-c8'] },
};

const levels: LevelDef[] = MODULES.map((m) => withLesson({ ...m.level, ref: REF_W01[m.level.id], ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }) }, LESSONS_W01[m.level.id]));

export const W01: SectorDef = {
  world: 'foundations',
  number: 1,
  name: 'Precálculo',
  tag: 'El Puerto',
  accent: '#28e7fa',
  place: 'puerto',
  description: 'Anoche salieron de la bodega 9 cuarenta cajas de vacunas que nadie despachó. El Altamar, un carguero sin bandera, vuelve esta noche, y alguien lleva la cuenta de cada caja.',
  module: {
    id: 'w1-closed',
    name: 'Ficha de casino «Aurora»',
    description: 'En el abrigo del Contador apareció una ficha del Casino Aurora. El dinero va hacia allá.',
  },
  levels,
};

export const W01_GLYPHS = MODULES.flatMap((m) => m.glyphs);
