import type { WorldId } from '../game/level/types';

// The fourteen districts of Valparaíso 2089. Each one is a mathematical world and a chapter
// of the investigation. Access follows mathematical prerequisites.
export interface SectorMeta {
  world: WorldId;
  number: number;
  /** plain-text symbol (fallback, aria) */
  symbol: string;
  /** symbol typeset with KaTeX on the map, when it is a formula */
  tex?: string;
  /** size of the typeset symbol, in em of the map symbol size */
  texSize?: number;
  /** district */
  name: string;
  /** mathematics */
  area: string;
  accent: string;
  /** one line of story */
  hook: string;
  prerequisites: WorldId[];
  /** position on the city map (1600×900) */
  at: [number, number];
}

export const SECTORS: SectorMeta[] = [
  { world: 'foundations', number: 1, symbol: 'Σ', tex: '\\Sigma', texSize: 1.05, name: 'El Puerto', area: 'Precálculo', accent: '#28e7fa', hook: 'Vacunas desviadas, un barco sin bandera y un virus en las grúas.', prerequisites: [], at: [300, 720] },
  { world: 'probability', number: 5, symbol: '⚄', name: 'Casino Aurora', area: 'Probabilidad', accent: '#ffbc5e', hook: 'El dinero del contrabando pasa por mesas de juego que nunca pierden.', prerequisites: ['foundations'], at: [640, 760] },
  { world: 'differential', number: 2, symbol: '∂', name: 'La Planta', area: 'Cálculo diferencial', accent: '#6f9cff', hook: 'Cada noche, a las 03:12, la central de Ventanas sufre un pico que nadie explica.', prerequisites: ['foundations'], at: [430, 520] },
  { world: 'integral', number: 3, symbol: '∫', name: 'La Represa', area: 'Cálculo integral', accent: '#a88aff', hook: 'Falta agua y alguien manipula los caudalímetros.', prerequisites: ['differential'], at: [250, 330] },
  { world: 'linear', number: 4, symbol: '⊞', name: 'El Metro', area: 'Álgebra lineal', accent: '#9cff6e', hook: 'Los trenes se desvían según una tabla que nadie escribió.', prerequisites: ['foundations'], at: [760, 560] },
  { world: 'statistics', number: 6, symbol: 'x̄', tex: '\\bar{x}', texSize: 1.1, name: 'El Archivo', area: 'Estadística', accent: '#ff9f6e', hook: 'Miles de registros y una muestra que no cuadra.', prerequisites: ['probability'], at: [960, 700] },
  { world: 'multivariate', number: 7, symbol: '∇', name: 'Los Cerros', area: 'Varias variables', accent: '#ff6b4a', hook: 'Un dron perdido entre quebradas y pendientes.', prerequisites: ['differential', 'linear'], at: [620, 360] },
  { world: 'information', number: 8, symbol: 'H', tex: 'H', texSize: 1.05, name: 'Las Antenas', area: 'Teoría de la información', accent: '#38d9c5', hook: 'Mensajes cifrados viajan por una red que pierde bits.', prerequisites: ['probability'], at: [1120, 520] },
  { world: 'dynamics', number: 9, symbol: '∿', name: 'El Observatorio', area: 'Sistemas dinámicos', accent: '#e7df5a', hook: 'Una tormenta que los modelos no predijeron.', prerequisites: ['integral', 'multivariate'], at: [420, 160] },
  { world: 'bayesian', number: 10, symbol: '∝', tex: '\\propto', texSize: 1.1, name: 'La Clínica', area: 'Inferencia bayesiana', accent: '#ff8fa3', hook: 'Un test que da positivo demasiadas veces.', prerequisites: ['probability'], at: [1270, 720] },
  { world: 'variational', number: 11, symbol: '≈', name: 'El Laboratorio', area: 'Inferencia variacional', accent: '#d68cff', hook: 'Un modelo imposible de calcular y una aproximación que sí.', prerequisites: ['bayesian', 'information', 'differential'], at: [1000, 330] },
  { world: 'generative', number: 12, symbol: '⚙', name: 'La Fábrica', area: 'Modelos generativos', accent: '#c9b37e', hook: 'Las máquinas producen datos falsos que parecen reales.', prerequisites: ['bayesian', 'linear'], at: [1330, 420] },
  { world: 'decision', number: 13, symbol: '♞', name: 'La Bolsa', area: 'Decisión secuencial', accent: '#e6e9f2', hook: 'Alguien siempre elige un paso antes que el mercado.', prerequisites: ['generative', 'information'], at: [1200, 200] },
  { world: 'active', number: 14, symbol: '◉', name: 'Torre Halcón', area: 'Síntesis final', accent: '#e8364f', hook: 'Todas las pistas llevan al último piso.', prerequisites: ['decision', 'variational', 'dynamics'], at: [820, 110] },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.world, s])) as Record<WorldId, SectorMeta>;
