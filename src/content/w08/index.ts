import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import { withLesson } from '../stub';
import * as C1 from './c1-pulso';
import * as C2 from './c2-trafico';
import * as C3 from './c3-ramas';
import { REF_W08 } from './ref';

const MODULES: LevelModule[] = [C1, C2, C3];
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w8-c1': { pos: [220, 210], requires: [] },
  'w8-c2': { pos: [550, 180], requires: ['w8-c1'] },
  'w8-c3': { pos: [900, 220], requires: ['w8-c2'] },
  'w8-c4': { pos: [1240, 190], requires: ['w8-c3'] },
  'w8-c5': { pos: [1310, 490], requires: ['w8-c4'] },
  'w8-c6': { pos: [970, 510], requires: ['w8-c5'] },
  'w8-c7': { pos: [630, 470], requires: ['w8-c6'] },
  'w8-c8': { pos: [280, 570], requires: ['w8-c7'] },
  'w8-final': { pos: [800, 770], requires: ['w8-c8'] },
};
const levels: LevelDef[] = MODULES.map((m) =>
  withLesson({ ...m.level, ref: REF_W08[m.level.id], ...LAYOUT[m.level.id] }, m.lesson),
);
export const W08: SectorDef = {
  world: 'information',
  number: 8,
  name: 'Teoría de la información',
  tag: 'Las Antenas',
  accent: '#38d9c5',
  place: 'antenas',
  description:
    'El chip del dron conserva rutas y mensajes cifrados. Inés abre el terminal de Las Antenas; sus copias permiten seguir una reserva de entrega omitida de la bitácora visible.',
  module: {
    id: 'w8-closed',
    name: 'La ventana',
    description:
      'El paquete recuperado y validado fija una entrega de vacunas en El Observatorio, durante una ventana de tormenta que el pronóstico público muestra despejada.',
  },
  levels,
};
export const W08_GLYPHS = MODULES.flatMap((m) => m.glyphs);
