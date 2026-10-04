import type { LevelDef, LevelModule, SectorDef } from '../../game/level/types';
import * as L01 from './levels/L01-signos';
import * as L02 from './levels/L02-conjuntos';
import * as L03 from './levels/L03-indices';
import * as L04 from './levels/L04-funciones';
import * as L05 from './levels/L05-composicion';
import * as L06 from './levels/L06-sumas';
import * as L07 from './levels/L07-productos';
import * as L08 from './levels/L08-indicadoras';
import * as L09 from './levels/L09-normalizacion';
import * as L10 from './levels/L10-exponencial';
import * as L11 from './levels/L11-logaritmo';
import * as L12 from './levels/L12-softmax';
import * as BOSS from './levels/boss';

const MODULES: LevelModule[] = [L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, BOSS];

// Sector map: a circuit board read left → right. `requires` encodes the concept DAG
// (from the curriculum spec), not the numbering.
const LAYOUT: Record<string, { pos: [number, number]; requires: string[] }> = {
  'w01-l01': { pos: [150, 450], requires: [] },
  'w01-l02': { pos: [330, 290], requires: ['w01-l01'] },
  'w01-l03': { pos: [330, 610], requires: ['w01-l02'] },
  'w01-l04': { pos: [520, 290], requires: ['w01-l02'] },
  'w01-l05': { pos: [700, 180], requires: ['w01-l04'] },
  'w01-l06': { pos: [520, 610], requires: ['w01-l03'] },
  'w01-l07': { pos: [700, 720], requires: ['w01-l06'] },
  'w01-l08': { pos: [880, 760], requires: ['w01-l04', 'w01-l07'] },
  'w01-l09': { pos: [880, 520], requires: ['w01-l04', 'w01-l06'] },
  'w01-l10': { pos: [880, 280], requires: ['w01-l04', 'w01-l07'] },
  'w01-l11': { pos: [1060, 280], requires: ['w01-l05', 'w01-l10'] },
  'w01-l12': { pos: [1240, 450], requires: ['w01-l03', 'w01-l09', 'w01-l11'] },
  'w01-boss': { pos: [1440, 450], requires: ['w01-l08', 'w01-l12'] },
};

const levels: LevelDef[] = MODULES.map((m) => ({
  ...m.level,
  ...(LAYOUT[m.level.id] ?? { pos: [800, 450] as [number, number], requires: [] }),
}));

export const W01: SectorDef = {
  world: 'foundations',
  number: 1,
  name: 'Precálculo',
  tag: 'El lenguaje',
  emblem: 'f',
  accent: '#28e7fa',
  description: 'La sintaxis del modelo: signos, conjuntos, funciones, Σ y Π, normalización, exp, ln y softmax.',
  intro: [
    'Sector 01 en línea. Aquí vive mi **lenguaje**: sin él no puedo nombrar estados, transformar señales ni pesar hipótesis.',
    'Cada protocolo restaura una pieza de sintaxis. El núcleo del sector convierte puntuaciones en creencias: $\\sigma(\\mathbf z)$.',
    'Puedes seguir la ruta o saltar a lo que no domines. Los retos no perdonan, pero tampoco castigan: reintentar es gratis.',
  ],
  module: {
    id: 'w01-softmax',
    name: 'Normalizador softmax',
    description: 'Convierte puntuaciones logarítmicas en una distribución de creencias.',
  },
  levels,
  zones: [
    { label: 'SINTAXIS', x: 240, y: 150 },
    { label: 'MÁQUINAS', x: 610, y: 95 },
    { label: 'ACUMULADORES', x: 700, y: 855 },
    { label: 'ESCALAS', x: 1060, y: 150 },
  ],
};

export const W01_CODEX = MODULES.flatMap((m) => m.codex);
export const W01_GLYPHS = MODULES.flatMap((m) => m.glyphs);
