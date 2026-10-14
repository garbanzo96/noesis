import { C } from '../../engine/palette';
import { Html } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import {
  COAST,
  NAMES,
  RAIL,
  ROADS_MAJOR,
  ROADS_MINOR,
  ROUTE,
  ROUTE_LEN,
  SEA,
  STATIONS,
  STATION_S,
} from '../../art/valpo';
import { SECTORS, SECTOR_BY_ID, sectorStars, sectorState } from '../../content/registry';
import type { SectorMeta } from '../../content/sectors';
import type { WorldId } from '../level/types';
import type { GameState } from '../state';

// ============================================================================
// Valparaíso 2089 as a transit map. The real coast, streets and the Limache–Puerto
// railway (OpenStreetMap) carry the story line: fourteen stations, world 1 at the
// Puerto (west) to world 14 at the far east. Prerequisites stay hidden until a
// station is focused; then its chain arcs in from earlier stations.
// ============================================================================

export const stationOf = (w: WorldId) => STATIONS[SECTOR_BY_ID[w].number - 1];

/** every world that `w` builds on, directly or through others */
export function ancestors(w: WorldId, acc = new Set<WorldId>()): Set<WorldId> {
  for (const p of SECTOR_BY_ID[w].prerequisites) {
    if (!acc.has(p)) {
      acc.add(p);
      ancestors(p, acc);
    }
  }
  return acc;
}
/** worlds that list `w` as a direct prerequisite */
export const nextOf = (w: WorldId) =>
  SECTORS.filter((s) => s.prerequisites.includes(w)).sort((a, b) => a.number - b.number);

export function Sym({ s, scale = 1 }: { s: SectorMeta; scale?: number }) {
  if (!s.tex) return <>{s.symbol}</>;
  return (
    <Tex tex={`\\boldsymbol{${s.tex}}`} style={{ fontSize: `${(s.texSize ?? 1) * scale}em` }} />
  );
}

/** arc from an earlier station to a later one, rising over the line (the sea and Viña) */
function arc(from: WorldId, to: WorldId) {
  const [ax, ay] = stationOf(from);
  const [bx, by] = stationOf(to);
  const rise = 90 + 0.3 * Math.abs(bx - ax);
  const cy = Math.max(Math.min(ay, by) - rise, 2 * 40 - (ay + by) / 2);
  return `M${ax} ${ay} Q${(ax + bx) / 2} ${cy} ${bx} ${by}`;
}

const R = 30;

/** metro-map labels: diagonal and parallel, down towards the hills while the line climbs,
 *  up towards Viña where it descends, so neighbours never touch */
const ANGLE = STATIONS.map(([, y], i) => {
  const ny = STATIONS[i + 1]?.[1] ?? y + (y - STATIONS[i - 1][1]);
  return ny - y > 8 ? -38 : 38;
});
const LABELS = STATIONS.map(([x, y], i) => {
  const t = (ANGLE[i] * Math.PI) / 180;
  const L = 150;
  return { x: x + Math.cos(t) * (R + 10 + L / 2), y: y + Math.sin(t) * (R + 10 + L / 2) };
});
/** place names clear of the stations and their labels */
const QUIET_NAMES = NAMES.filter(([, x, y]) =>
  STATIONS.every(
    ([sx, sy], i) =>
      Math.hypot(x - sx, y - sy) > 110 && Math.hypot(x - LABELS[i].x, y - LABELS[i].y) > 110,
  ),
);

export function CityMap({
  game,
  hl,
  next,
  reduced,
  onHover,
  onPick,
}: {
  game: GameState;
  /** focused world: its chain of prerequisites is drawn */
  hl: WorldId | null;
  /** the station where the story continues */
  next: WorldId | null;
  reduced: boolean;
  onHover: (w: WorldId | null) => void;
  onPick: (w: WorldId) => void;
}) {
  const chain = hl ? ancestors(hl) : null;
  const ahead = hl ? new Set(nextOf(hl).map((s) => s.world)) : null;
  const lastDone = Math.max(
    -1,
    ...SECTORS.filter((s) => sectorState(game, s.world) === 'done').map((s) => s.number - 1),
  );
  type Edge = { p: WorldId; s: WorldId; kind: 'chain' | 'next' };
  const edges: Edge[] = hl
    ? SECTORS.flatMap((s): Edge[] =>
        s.prerequisites
          .filter((p) => chain!.has(p) && (s.world === hl || chain!.has(s.world)))
          .map((p): Edge => ({ p, s: s.world, kind: 'chain' })),
      ).concat(nextOf(hl).map((s): Edge => ({ p: hl, s: s.world, kind: 'next' })))
    : [];

  return (
    <g className={`citymap ${hl ? 'focused' : ''}`}>
      <defs>
        <linearGradient id="cm-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120e26" />
          <stop offset="1" stopColor="#0a0817" />
        </linearGradient>
        <linearGradient id="cm-sea" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#03111f" />
          <stop offset="1" stopColor="#072238" />
        </linearGradient>
        <pattern id="cm-scan" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 0.5 H8" stroke="#0e3a55" strokeWidth="1" opacity="0.55" />
        </pattern>
        <pattern id="cm-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M80 0 V80 M0 80 H80" stroke="#1d1838" strokeWidth="1" />
        </pattern>
        <filter id="cm-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <radialGradient id="cm-vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.65" />
        </radialGradient>
      </defs>

      {/* ground */}
      <rect x={-200} y={-200} width={2000} height={1300} fill="url(#cm-land)" />
      <rect x={-200} y={-200} width={2000} height={1300} fill="url(#cm-grid)" opacity={0.6} />
      <path d={ROADS_MINOR} fill="none" stroke="#2a2250" strokeWidth={1} opacity={0.8} />
      <path d={ROADS_MAJOR} fill="none" stroke="#3d3175" strokeWidth={1.7} opacity={0.9} />
      <path d={SEA} fill="url(#cm-sea)" />
      <path d={SEA} fill="url(#cm-scan)" />
      <path
        d={COAST}
        fill="none"
        stroke={C.cyan}
        strokeWidth={6}
        opacity={0.28}
        filter="url(#cm-glow)"
      />
      <path d={COAST} fill="none" stroke={C.cyan} strokeWidth={1.6} opacity={0.85} />
      <path d={RAIL} fill="none" stroke="#5b4b8a" strokeWidth={1.2} strokeDasharray="2 5" />

      {/* place names */}
      {QUIET_NAMES.map(([n, x, y, kind]) => (
        <text
          key={n}
          x={x}
          y={y}
          className={`cm-name ${kind === 'city' ? 'city' : ''}`}
          textAnchor="middle"
        >
          {n.toUpperCase()}
        </text>
      ))}
      <text x={820} y={235} className="cm-sea-name small" textAnchor="middle">
        BAHÍA DE VALPARAÍSO
      </text>
      <rect
        x={-200}
        y={-200}
        width={2000}
        height={1300}
        fill="url(#cm-vignette)"
        pointerEvents="none"
      />

      {/* the story line: dim ahead, lit up to the last closed world */}
      <path
        d={ROUTE}
        fill="none"
        stroke="#000"
        strokeWidth={14}
        opacity={0.55}
        strokeLinecap="round"
      />
      <path d={ROUTE} fill="none" stroke="#3a2f63" strokeWidth={7} strokeLinecap="round" />
      {lastDone >= 0 && (
        <path
          d={ROUTE}
          fill="none"
          stroke={C.cyan}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${STATION_S[lastDone]} ${ROUTE_LEN}`}
          opacity={0.9}
        />
      )}

      {/* prerequisite arcs of the focused station */}
      {edges.map(({ p, s, kind }) => (
        <path
          key={p + s}
          d={arc(p, s)}
          fill="none"
          stroke={kind === 'chain' ? SECTOR_BY_ID[hl!].accent : SECTOR_BY_ID[s].accent}
          strokeWidth={kind === 'chain' ? 3 : 2}
          strokeDasharray={kind === 'chain' ? '12 9' : '3 7'}
          strokeLinecap="round"
          opacity={kind === 'chain' ? 0.95 : 0.7}
          className={reduced ? undefined : 'atlas-flow'}
        />
      ))}

      {/* stations */}
      {SECTORS.map((s) => {
        const [x, y] = stationOf(s.world);
        const state = sectorState(game, s.world);
        const open = state === 'open' || state === 'done';
        const ss = sectorStars(game, s.world);
        const isHl = hl === s.world;
        const related = !hl || isHl || chain!.has(s.world) || ahead!.has(s.world);
        const isNext = next === s.world;
        const frac = ss.total ? ss.done / ss.total : 0;
        const circ = 2 * Math.PI * (R + 6);
        return (
          <g
            key={s.world}
            className={`cm-station ${isHl ? 'hl' : ''} ${related ? '' : 'faded'}`}
            style={{
              ['--accent' as string]: s.accent,
              ['--sx' as string]: `${x}px`,
              ['--sy' as string]: `${y}px`,
            }}
            onMouseEnter={() => onHover(s.world)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onPick(s.world)}
          >
            {isNext && !reduced && (
              <circle
                cx={x}
                cy={y}
                r={R + 14}
                fill="none"
                stroke={s.accent}
                strokeWidth={2}
                className="pulse-ring"
              />
            )}
            <circle cx={x} cy={y} r={R + 18} fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={R + 6}
              fill="none"
              stroke="#000"
              strokeWidth={5}
              opacity={0.5}
            />
            {frac > 0 && (
              <circle
                cx={x}
                cy={y}
                r={R + 6}
                fill="none"
                stroke={s.accent}
                strokeWidth={3}
                strokeDasharray={`${circ * frac} ${circ}`}
                transform={`rotate(-90 ${x} ${y})`}
                strokeLinecap="round"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={R}
              className="cm-disc"
              fill={state === 'done' ? s.accent : '#0c0a1c'}
              fillOpacity={state === 'done' ? 0.28 : 1}
              stroke={open ? s.accent : '#5d5478'}
              strokeWidth={isHl ? 4 : 2.5}
            />
            <Html x={x} y={y} size={26} color={open ? '#fff' : '#5d5478'}>
              <span className="atlas-sym">
                <Sym s={s} />
              </span>
            </Html>
            <g transform={`translate(${x} ${y}) rotate(${ANGLE[s.number - 1]})`} className="cm-tag">
              <text
                x={s.number === 14 ? -(R + 11) : R + 11}
                y={6}
                textAnchor={s.number === 14 ? 'end' : 'start'}
              >
                <tspan className="num" fill={s.accent}>
                  {String(s.number).padStart(2, '0')}
                </tspan>
                <tspan dx={7}>{s.area}</tspan>
              </text>
            </g>
            {isNext && (
              <text
                x={x}
                y={ANGLE[s.number - 1] < 0 ? y + R + 26 : y - R - 14}
                textAnchor="middle"
                className="cm-next"
                fill={s.accent}
              >
                SIGUIENTE
              </text>
            )}
          </g>
        );
      })}
      <text x={1590} y={892} className="cm-credit" textAnchor="end">
        Mapa base © OpenStreetMap
      </text>
    </g>
  );
}
