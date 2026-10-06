import type { ReactElement } from 'react';
import { C } from '../engine/palette';

// Location backdrops (1600×900, scaled with "slice"). Layered vector silhouettes, window lights,
// neon and fog. Deterministic pseudo-random so every render is identical.
export type PlaceId = 'puerto' | 'oficina' | 'bodega' | 'casino' | 'servidores' | 'planta';

function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Sky({ top = '#0a0718', mid = '#1a0f33', bottom = '#0c2230' }: { top?: string; mid?: string; bottom?: string }) {
  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a4c9c" stopOpacity="0" />
          <stop offset="1" stopColor="#6a4c9c" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
    </>
  );
}

/** Valparaíso hills: stacked houses climbing the cerros, with lit windows. */
function Cerros({ seed = 7, y0 = 520, color = '#130d26', lights = true }: { seed?: number; y0?: number; color?: string; lights?: boolean }) {
  const r = prng(seed);
  const ridge = `M0 ${y0} C 200 ${y0 - 160} 380 ${y0 - 60} 560 ${y0 - 170} C 760 ${y0 - 290} 960 ${y0 - 90} 1140 ${y0 - 200} C 1320 ${y0 - 300} 1480 ${y0 - 150} 1600 ${y0 - 210} L1600 900 L0 900 Z`;
  const houses: ReactElement[] = [];
  for (let i = 0; i < 160; i++) {
    const x = r() * 1600;
    const h = 14 + r() * 22;
    const w = 16 + r() * 26;
    const yy = y0 - 40 - r() * 220 + Math.abs(Math.sin(x / 260)) * 120;
    houses.push(<rect key={'h' + i} x={x} y={yy} width={w} height={h} fill="#1b1335" />);
    if (lights && r() < 0.55) {
      const c = r() < 0.15 ? C.magenta : r() < 0.3 ? C.cyan : '#ffcf7a';
      houses.push(<rect key={'l' + i} x={x + 4} y={yy + 4} width={3} height={4} fill={c} opacity={0.75} />);
    }
  }
  return (
    <g>
      <clipPath id={`ridge-${seed}`}>
        <path d={ridge} />
      </clipPath>
      <path d={ridge} fill={color} />
      <g clipPath={`url(#ridge-${seed})`}>{houses}</g>
    </g>
  );
}

function Crane({ x, y, s = 1, light = C.red }: { x: number; y: number; s?: number; light?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#2a2148" strokeWidth={6}>
      <path d="M0 0 L0 -300 M60 0 L60 -300 M0 -300 L60 -300 M0 -60 L60 -120 M0 -120 L60 -180 M0 -180 L60 -240 M0 -240 L60 -300" />
      <path d="M-160 -320 L300 -320 L300 -300 L-160 -300 Z M-160 -320 L30 -400 L60 -320" />
      <line x1="230" y1="-300" x2="230" y2="-160" strokeWidth={2} stroke="#3a2f60" />
      <rect x="215" y="-160" width="30" height="20" fill="#2a2148" />
      <circle cx="30" cy="-404" r="6" fill={light} stroke="none" className="blink" />
    </g>
  );
}

function Container({ x, y, w = 150, h = 62, color }: { x: number; y: number; w?: number; h?: number; color: string }) {
  const ribs = [];
  for (let k = 10; k < w; k += 12) ribs.push(<line key={k} x1={x + k} x2={x + k} y1={y + 4} y2={y + h - 4} stroke="#00000055" strokeWidth={3} />);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} />
      {ribs}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#00000066" strokeWidth={3} />
    </g>
  );
}

function Rain() {
  return <rect width="1600" height="900" fill="url(#rainpat)" className="rain" opacity={0.35} />;
}
function RainDefs() {
  return (
    <defs>
      <pattern id="rainpat" width="60" height="120" patternUnits="userSpaceOnUse">
        <line x1="10" y1="0" x2="2" y2="34" stroke="#9fb4ff" strokeWidth="1" opacity="0.5" />
        <line x1="40" y1="60" x2="32" y2="94" stroke="#9fb4ff" strokeWidth="1" opacity="0.35" />
      </pattern>
    </defs>
  );
}

function Neon({ x, y, text, color, size = 56 }: { x: number; y: number; text: string; color: string; size?: number }) {
  return (
    <g>
      <text x={x} y={y} fill="none" stroke={color} strokeWidth={8} opacity={0.25} fontFamily="Orbitron" fontSize={size} fontWeight={800} textAnchor="middle">
        {text}
      </text>
      <text x={x} y={y} fill={color} fontFamily="Orbitron" fontSize={size} fontWeight={800} textAnchor="middle" className="neon-flicker">
        {text}
      </text>
    </g>
  );
}

const PLACES: Record<PlaceId, () => ReactElement> = {
  puerto: () => (
    <>
      <Sky />
      <Cerros seed={11} y0={560} color="#120c25" />
      <Cerros seed={3} y0={650} color="#0e0a1e" lights={false} />
      {/* water */}
      <rect x="0" y="700" width="1600" height="200" fill="#071320" />
      {Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={(i * 97) % 1600} x2={((i * 97) % 1600) + 60 + (i % 5) * 20} y1={720 + (i % 9) * 18} y2={720 + (i % 9) * 18} stroke={i % 3 ? '#1d4a63' : C.magenta} strokeOpacity={i % 3 ? 0.5 : 0.35} strokeWidth={2} />
      ))}
      {/* dock */}
      <rect x="0" y="690" width="1600" height="16" fill="#1a1530" />
      <Crane x={180} y={690} s={1} />
      <Crane x={1180} y={690} s={0.85} light={C.amber} />
      {/* container stacks */}
      {[
        [520, 628, '#7a2a4a'],
        [672, 628, '#1e5a6e'],
        [824, 628, '#6b5a24'],
        [596, 566, '#3b2c6e'],
        [748, 566, '#7a2a4a'],
        [900, 628, '#2a4a7a'],
        [1380, 628, '#6b5a24'],
        [1420, 566, '#1e5a6e'],
      ].map(([x, y, c], i) => (
        <Container key={i} x={x as number} y={y as number} color={c as string} />
      ))}
      <Neon x={1250} y={250} text="HALCÓN" color={C.cyan} size={44} />
      <rect width="1600" height="900" fill="url(#fog)" />
      <RainDefs />
      <Rain />
    </>
  ),
  oficina: () => (
    <>
      <Sky top="#07060f" mid="#130b26" bottom="#0b1a26" />
      {/* window to the city */}
      <rect x="160" y="90" width="1280" height="520" fill="#0a0716" stroke="#241b40" strokeWidth={10} />
      <g clipPath="url(#win)">
        <clipPath id="win">
          <rect x="165" y="95" width="1270" height="510" />
        </clipPath>
        <Cerros seed={5} y0={560} color="#160f2c" />
        <Neon x={1050} y={250} text="NÓESIS" color={C.magenta} size={40} />
      </g>
      <line x1="800" y1="90" x2="800" y2="610" stroke="#241b40" strokeWidth={10} />
      <line x1="160" y1="350" x2="1440" y2="350" stroke="#241b40" strokeWidth={6} />
      {/* desk and monitors */}
      <rect x="0" y="660" width="1600" height="240" fill="#0b0918" />
      <rect x="0" y="650" width="1600" height="16" fill="#1d1733" />
      <rect x="980" y="470" width="300" height="180" rx="8" fill="#0d1a2a" stroke={C.cyan} strokeOpacity="0.5" strokeWidth={3} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={1000} y={490 + i * 20} width={120 + ((i * 53) % 140)} height={6} fill={C.cyan} opacity={0.35} />
      ))}
      <rect x="1120" y="650" width="20" height="20" fill="#1d1733" />
      <RainDefs />
      <Rain />
    </>
  ),
  bodega: () => (
    <>
      <rect width="1600" height="900" fill="#08070f" />
      {/* lamps */}
      {[300, 800, 1300].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="120" stroke="#2a2148" strokeWidth={4} />
          <path d={`M${x - 50} 150 L${x + 50} 150 L${x + 30} 120 L${x - 30} 120 Z`} fill="#2a2148" />
          <path d={`M${x - 50} 150 L${x + 50} 150 L${x + 260} 900 L${x - 260} 900 Z`} fill="#ffcf7a" opacity="0.05" />
          <ellipse cx={x} cy="152" rx="40" ry="6" fill="#ffcf7a" opacity="0.8" />
        </g>
      ))}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <Container key={`${row}-${k}`} x={k * 165 - 30 + row * 40} y={760 - row * 70} w={150} h={64} color={['#3b2c6e', '#7a2a4a', '#1e5a6e', '#6b5a24'][(k + row) % 4]} />
        )),
      )}
      <rect x="0" y="820" width="1600" height="80" fill="#0b0918" />
    </>
  ),
  casino: () => (
    <>
      <rect width="1600" height="900" fill="#0d0716" />
      <defs>
        <radialGradient id="casglow" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#ff3ba7" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ff3ba7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#casglow)" />
      {/* chandeliers */}
      {[400, 1200].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="70" stroke="#3a2f60" strokeWidth={3} />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={x - 80 + i * 20} cy={90 + Math.abs(i - 4) * 6} r={5} fill="#ffd36e" opacity={0.85} />
          ))}
          <ellipse cx={x} cy="96" rx="110" ry="14" fill="none" stroke="#ffd36e" strokeOpacity="0.4" strokeWidth={2} />
        </g>
      ))}
      <Neon x={800} y={210} text="AURORA" color={C.magenta} size={72} />
      {/* slot machines */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={60 + i * 190} y={330} width={130} height={240} rx={14} fill="#16102a" stroke="#3a2f60" strokeWidth={3} />
          <rect x={80 + i * 190} y={360} width={90} height={70} rx={6} fill={i % 2 ? '#2a1640' : '#13283a'} />
          <circle cx={125 + i * 190} cy={470} r={10} fill={i % 3 ? C.amber : C.cyan} opacity={0.7} className="blink" style={{ animationDelay: `${i * 0.37}s` }} />
        </g>
      ))}
      {/* tables */}
      {[300, 800, 1300].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={780} rx={230} ry={70} fill="#0c3a2c" stroke="#ffd36e" strokeOpacity="0.4" strokeWidth={4} />
          <ellipse cx={x} cy={772} rx={200} ry={56} fill="none" stroke="#1d5a45" strokeWidth={2} />
        </g>
      ))}
      <rect x="0" y="600" width="1600" height="300" fill="#000" opacity="0.25" />
    </>
  ),
  planta: () => (
    <>
      <Sky top="#06050f" mid="#140d2a" bottom="#1a1030" />
      <Cerros seed={21} y0={600} color="#100b22" />
      {/* transmission towers and lines */}
      {[120, 520, 980, 1440].map((x, i) => (
        <g key={x} opacity={0.8}>
          <path d={`M${x - 40} 640 L${x} 330 L${x + 40} 640 M${x - 26} 530 L${x + 26} 530 M${x - 50} 380 L${x + 50} 380 M${x - 36} 420 L${x + 36} 420`} stroke="#2a2148" strokeWidth={5} fill="none" />
          <circle cx={x} cy={326} r={5} fill={C.red} className="blink" style={{ animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      {[380, 420].map((y) => (
        <path key={y} d={`M70 ${y} Q320 ${y + 60} 570 ${y} Q750 ${y + 60} 1030 ${y} Q1235 ${y + 60} 1490 ${y}`} stroke={C.blue} strokeOpacity={0.35} strokeWidth={2} fill="none" />
      ))}
      {/* cooling tower */}
      <path d="M1020 700 C 1050 560 1050 470 1010 400 L1250 400 C 1210 470 1210 560 1240 700 Z" fill="#141126" stroke="#2a2148" strokeWidth={4} />
      <ellipse cx={1130} cy={392} rx={130} ry={26} fill="#1d1836" opacity={0.8} />
      <ellipse cx={1130} cy={340} rx={160} ry={70} fill="#2a2440" opacity={0.25} />
      {/* stacks */}
      {[300, 380].map((x, i) => (
        <g key={x}>
          <rect x={x} y={250 + i * 30} width={44} height={450 - i * 30} fill="#120f24" stroke="#2a2148" strokeWidth={3} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={x} y={300 + i * 30 + k * 110} width={44} height={14} fill={C.red} opacity={0.5} />
          ))}
          <circle cx={x + 22} cy={244 + i * 30} r={6} fill={C.red} className="blink" />
        </g>
      ))}
      {/* turbine hall */}
      <rect x="520" y="560" width="440" height="140" fill="#0f0d20" stroke="#2a2148" strokeWidth={4} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={540 + i * 52} y={590} width={36} height={60} fill={C.blue} opacity={0.18 + (i % 3) * 0.08} />
      ))}
      <Neon x={740} y={520} text="HALCÓN ENERGÍA" color={C.blue} size={34} />
      <rect x="0" y="700" width="1600" height="200" fill="#08070f" />
      <rect width="1600" height="900" fill="url(#fog)" />
      <RainDefs />
      <Rain />
    </>
  ),
  servidores: () => (
    <>
      <rect width="1600" height="900" fill="#05070d" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect x={40 + i * 175} y={140} width={140} height={620} fill="#0b1220" stroke="#16304a" strokeWidth={3} />
          {Array.from({ length: 24 }, (_, k) => (
            <g key={k}>
              <rect x={52 + i * 175} y={156 + k * 25} width={116} height={18} fill="#0e1828" />
              <circle cx={64 + i * 175} cy={165 + k * 25} r={3} fill={(i * 7 + k * 3) % 5 === 0 ? C.red : C.green} opacity={0.8} className={(i + k) % 4 === 0 ? 'blink' : undefined} style={{ animationDelay: `${((i * 13 + k * 7) % 10) / 5}s` }} />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
};

/** Full-bleed location backdrop. */
export function Backdrop({ place, className, dim = 0 }: { place: PlaceId; className?: string; dim?: number }) {
  const Place = PLACES[place];
  return (
    <svg className={`place ${className ?? ''}`} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <Place />
      {dim > 0 && <rect width="1600" height="900" fill="#05040c" opacity={dim} />}
    </svg>
  );
}
