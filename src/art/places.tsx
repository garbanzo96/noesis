import type { ReactElement } from 'react';
import { C } from '../engine/palette';

// Location backdrops (1600×900, scaled with "slice"). Layered vector silhouettes, window lights,
// neon and fog. Deterministic pseudo-random so every render is identical.
export type PlaceId =
  | 'puerto'
  | 'oficina'
  | 'bodega'
  | 'casino'
  | 'servidores'
  | 'planta'
  | 'represa'
  | 'metro'
  | 'archivo'
  | 'cerros'
  | 'antenas'
  | 'observatorio';

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

function Sky({
  top = '#0a0718',
  mid = '#1a0f33',
  bottom = '#0c2230',
}: {
  top?: string;
  mid?: string;
  bottom?: string;
}) {
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
function Cerros({
  seed = 7,
  y0 = 520,
  color = '#130d26',
  lights = true,
}: {
  seed?: number;
  y0?: number;
  color?: string;
  lights?: boolean;
}) {
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
      houses.push(
        <rect key={'l' + i} x={x + 4} y={yy + 4} width={3} height={4} fill={c} opacity={0.75} />,
      );
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

function Crane({
  x,
  y,
  s = 1,
  light = C.red,
}: {
  x: number;
  y: number;
  s?: number;
  light?: string;
}) {
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

function Container({
  x,
  y,
  w = 150,
  h = 62,
  color,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  color: string;
}) {
  const ribs = [];
  for (let k = 10; k < w; k += 12)
    ribs.push(
      <line
        key={k}
        x1={x + k}
        x2={x + k}
        y1={y + 4}
        y2={y + h - 4}
        stroke="#00000055"
        strokeWidth={3}
      />,
    );
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

function Neon({
  x,
  y,
  text,
  color,
  size = 56,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  size?: number;
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        fill="none"
        stroke={color}
        strokeWidth={8}
        opacity={0.25}
        fontFamily="Orbitron"
        fontSize={size}
        fontWeight={800}
        textAnchor="middle"
      >
        {text}
      </text>
      <text
        x={x}
        y={y}
        fill={color}
        fontFamily="Orbitron"
        fontSize={size}
        fontWeight={800}
        textAnchor="middle"
        className="neon-flicker"
      >
        {text}
      </text>
    </g>
  );
}

const PLACES: Record<PlaceId, () => ReactElement> = {
  observatorio: () => (
    <>
      <Sky top="#070e15" mid="#142831" bottom="#1c3438" />
      <Cerros seed={91} y0={575} color="#10222b" />
      <Crane x={980} y={570} s={0.48} light="#e7df5a" />
      <RainDefs />
      <Rain />
      {/* Open dome and ribs frame the rain over the port. */}
      <path
        d="M0 900 L0 0 L1600 0 L1600 900 L1480 900 L1480 345 Q800 -160 120 345 L120 900 Z"
        fill="#091016"
      />
      <path
        d="M120 345 Q800 -160 1480 345 M360 280 Q800 -40 1240 280"
        fill="none"
        stroke="#34454b"
        strokeWidth={16}
      />
      <rect
        x="160"
        y="300"
        width="1280"
        height="300"
        fill="#405a60"
        fillOpacity={0.07}
        stroke="#40515a"
        strokeWidth={9}
      />
      {[440, 800, 1160].map((x) => (
        <path key={x} d={`M${x} 300 L${x} 600`} stroke="#34454b" strokeWidth={8} />
      ))}
      {/* Rain gauge and wind vane, in silhouette behind the window. */}
      <path
        d="M290 580 L290 410 M255 400 L325 400 L307 430 L273 430 Z M269 450 L311 450 L311 525 L269 525 Z"
        fill="#09131a"
        stroke="#18282f"
        strokeWidth={5}
      />
      <path
        d="M1260 585 L1260 365 M1180 390 L1340 390 L1320 373 M1340 390 L1320 407 M1220 366 L1260 345 L1300 366 Z"
        fill="#09131a"
        stroke="#09131a"
        strokeWidth={6}
      />
      <path d="M0 660 L1600 660 L1600 900 L0 900 Z" fill="#080e13" />
      <path
        d="M1010 575 L1440 575 L1510 675 L970 675 Z"
        fill="#17242c"
        stroke="#32424d"
        strokeWidth={4}
      />
      <rect
        x="1150"
        y="502"
        width="205"
        height="112"
        rx="8"
        fill="#101d2b"
        stroke="#34475c"
        strokeWidth={5}
      />
      <path
        d="M1175 548 L1220 548 L1250 548 L1330 548 M1175 575 L1310 575"
        stroke="#6f9cff"
        strokeWidth={3}
        opacity={0.35}
      />
      {/* Foreground recorder: sulphur screen light spills onto the paper. */}
      <path
        d="M155 660 L905 660 L1020 780 L75 780 Z"
        fill="#263338"
        stroke="#48544d"
        strokeWidth={5}
      />
      <path d="M205 780 L190 900 M855 780 L875 900" stroke="#1b282f" strokeWidth={24} />
      <path d="M595 495 L840 495 L935 760 L450 760 Z" fill="#e7df5a" opacity={0.06} />
      <rect
        x="635"
        y="455"
        width="205"
        height="137"
        rx="8"
        fill="#161f22"
        stroke="#48554b"
        strokeWidth={6}
      />
      <path
        d="M657 548 L691 540 L725 515 L757 483 L816 483"
        fill="none"
        stroke="#e7df5a"
        strokeWidth={4}
      />
      <rect x="292" y="608" width="280" height="110" rx="10" fill="#c9c4a2" />
      <ellipse cx="292" cy="663" rx="28" ry="55" fill="#56625a" stroke="#a1aa91" strokeWidth={4} />
      <ellipse cx="572" cy="663" rx="28" ry="55" fill="#ded8b2" stroke="#a1aa91" strokeWidth={4} />
      <path d="M326 667 Q400 663 436 645 T541 619" fill="none" stroke="#a78a52" strokeWidth={3} />
      <path d="M550 704 L720 748 L800 790 L555 759 Z" fill="#ded8b2" />
      <path d="M398 560 L421 638 L468 643" fill="none" stroke="#738781" strokeWidth={7} />
      <Neon x={800} y={205} text="OBSERVATORIO · TURNO NOCTURNO" color="#e7df5a" size={28} />
    </>
  ),
  antenas: () => (
    <>
      <Sky top="#050c12" mid="#10252b" bottom="#142b2b" />
      <Cerros seed={89} y0={570} color="#0b1821" />
      <Cerros seed={90} y0={710} color="#081016" lights={false} />
      {[250, 610, 940].map((x, i) => (
        <g key={x}>
          <path
            d={`M${x - 65} 740 L${x} ${180 + i * 55} L${x + 65} 740 M${x - 45} 610 L${x + 35} 430 M${x + 45} 610 L${x - 35} 430 M${x - 35} 430 L${x + 18} 300 M${x + 35} 430 L${x - 18} 300`}
            fill="none"
            stroke="#43545d"
            strokeWidth={7}
          />
          <g transform={`translate(${x + 12} ${290 + i * 65}) rotate(-25)`}>
            <path
              d="M-65 -55 Q40 0 -65 55 Q-100 0 -65 -55"
              fill="#183137"
              stroke="#739096"
              strokeWidth={4}
            />
            <path
              d="M-65 -55 L0 0 L-65 55 M0 0 L25 0"
              fill="none"
              stroke="#739096"
              strokeWidth={4}
            />
          </g>
          {i === 2 && <circle cx={x} cy={286} r={6} fill={C.red} className="blink" />}
        </g>
      ))}
      <path
        d="M0 740 L1600 700 L1600 900 L0 900 Z"
        fill="#0c1920"
        stroke="#2d464b"
        strokeWidth={4}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx={160 + i * 290}
          cy={790 + (i % 2) * 40}
          rx={110}
          ry={9}
          fill="#38d9c5"
          opacity={0.06}
        />
      ))}
      <rect
        x="1120"
        y="390"
        width="390"
        height="330"
        fill="#102b2c"
        stroke="#456066"
        strokeWidth={6}
      />
      <path d="M1090 390 L1525 390 L1480 345 L1130 345 Z" fill="#20383f" />
      <rect x="1160" y="425" width="300" height="280" fill="#070f15" />
      <path
        d="M1160 705 L1050 780 L1050 480 L1160 425"
        fill="#192f35"
        stroke="#456066"
        strokeWidth={4}
      />
      <path d="M1160 425 L900 900 L1600 900 L1460 425 Z" fill="#38d9c5" opacity={0.035} />
      <rect
        x="1240"
        y="465"
        width="175"
        height="110"
        rx="5"
        fill="#0d252a"
        stroke="#38d9c5"
        strokeWidth={3}
      />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path
            d={`M${1200 + i * 60} 600 Q${1180 + i * 50} 680 ${1100 + i * 70} 810`}
            fill="none"
            stroke={i % 2 ? '#38d9c5' : '#b7a47c'}
            strokeWidth={4}
          />
          <rect x={1187 + i * 60} y="604" width="26" height="22" fill="#c1c6ad" />
          <text x={1200 + i * 60} y="620" fill="#122126" textAnchor="middle" fontSize="16">
            {String.fromCharCode(65 + i)}
          </text>
          <line
            x1="1255"
            x2={1310 + i * 20}
            y1={485 + i * 23}
            y2={485 + i * 23}
            stroke="#38d9c5"
            strokeWidth={4}
            opacity={0.65}
          />
        </g>
      ))}
      <Neon x={1300} y={365} text="SERVICIO" color="#38d9c5" size={24} />
      <RainDefs />
      <Rain />
    </>
  ),
  puerto: () => (
    <>
      <Sky />
      <Cerros seed={11} y0={560} color="#120c25" />
      <Cerros seed={3} y0={650} color="#0e0a1e" lights={false} />
      {/* water */}
      <rect x="0" y="700" width="1600" height="200" fill="#071320" />
      {Array.from({ length: 26 }, (_, i) => (
        <line
          key={i}
          x1={(i * 97) % 1600}
          x2={((i * 97) % 1600) + 60 + (i % 5) * 20}
          y1={720 + (i % 9) * 18}
          y2={720 + (i % 9) * 18}
          stroke={i % 3 ? '#1d4a63' : C.magenta}
          strokeOpacity={i % 3 ? 0.5 : 0.35}
          strokeWidth={2}
        />
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
      <rect
        x="160"
        y="90"
        width="1280"
        height="520"
        fill="#0a0716"
        stroke="#241b40"
        strokeWidth={10}
      />
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
      <rect
        x="980"
        y="470"
        width="300"
        height="180"
        rx="8"
        fill="#0d1a2a"
        stroke={C.cyan}
        strokeOpacity="0.5"
        strokeWidth={3}
      />
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={1000}
          y={490 + i * 20}
          width={120 + ((i * 53) % 140)}
          height={6}
          fill={C.cyan}
          opacity={0.35}
        />
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
          <path
            d={`M${x - 50} 150 L${x + 50} 150 L${x + 30} 120 L${x - 30} 120 Z`}
            fill="#2a2148"
          />
          <path
            d={`M${x - 50} 150 L${x + 50} 150 L${x + 260} 900 L${x - 260} 900 Z`}
            fill="#ffcf7a"
            opacity="0.05"
          />
          <ellipse cx={x} cy="152" rx="40" ry="6" fill="#ffcf7a" opacity="0.8" />
        </g>
      ))}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <Container
            key={`${row}-${k}`}
            x={k * 165 - 30 + row * 40}
            y={760 - row * 70}
            w={150}
            h={64}
            color={['#3b2c6e', '#7a2a4a', '#1e5a6e', '#6b5a24'][(k + row) % 4]}
          />
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
            <circle
              key={i}
              cx={x - 80 + i * 20}
              cy={90 + Math.abs(i - 4) * 6}
              r={5}
              fill="#ffd36e"
              opacity={0.85}
            />
          ))}
          <ellipse
            cx={x}
            cy="96"
            rx="110"
            ry="14"
            fill="none"
            stroke="#ffd36e"
            strokeOpacity="0.4"
            strokeWidth={2}
          />
        </g>
      ))}
      <Neon x={800} y={210} text="AURORA" color={C.magenta} size={72} />
      {/* slot machines */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect
            x={60 + i * 190}
            y={330}
            width={130}
            height={240}
            rx={14}
            fill="#16102a"
            stroke="#3a2f60"
            strokeWidth={3}
          />
          <rect
            x={80 + i * 190}
            y={360}
            width={90}
            height={70}
            rx={6}
            fill={i % 2 ? '#2a1640' : '#13283a'}
          />
          <circle
            cx={125 + i * 190}
            cy={470}
            r={10}
            fill={i % 3 ? C.amber : C.cyan}
            opacity={0.7}
            className="blink"
            style={{ animationDelay: `${i * 0.37}s` }}
          />
        </g>
      ))}
      {/* tables */}
      {[300, 800, 1300].map((x) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy={780}
            rx={230}
            ry={70}
            fill="#0c3a2c"
            stroke="#ffd36e"
            strokeOpacity="0.4"
            strokeWidth={4}
          />
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
          <path
            d={`M${x - 40} 640 L${x} 330 L${x + 40} 640 M${x - 26} 530 L${x + 26} 530 M${x - 50} 380 L${x + 50} 380 M${x - 36} 420 L${x + 36} 420`}
            stroke="#2a2148"
            strokeWidth={5}
            fill="none"
          />
          <circle
            cx={x}
            cy={326}
            r={5}
            fill={C.red}
            className="blink"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        </g>
      ))}
      {[380, 420].map((y) => (
        <path
          key={y}
          d={`M70 ${y} Q320 ${y + 60} 570 ${y} Q750 ${y + 60} 1030 ${y} Q1235 ${y + 60} 1490 ${y}`}
          stroke={C.blue}
          strokeOpacity={0.35}
          strokeWidth={2}
          fill="none"
        />
      ))}
      {/* cooling tower */}
      <path
        d="M1020 700 C 1050 560 1050 470 1010 400 L1250 400 C 1210 470 1210 560 1240 700 Z"
        fill="#141126"
        stroke="#2a2148"
        strokeWidth={4}
      />
      <ellipse cx={1130} cy={392} rx={130} ry={26} fill="#1d1836" opacity={0.8} />
      <ellipse cx={1130} cy={340} rx={160} ry={70} fill="#2a2440" opacity={0.25} />
      {/* stacks */}
      {[300, 380].map((x, i) => (
        <g key={x}>
          <rect
            x={x}
            y={250 + i * 30}
            width={44}
            height={450 - i * 30}
            fill="#120f24"
            stroke="#2a2148"
            strokeWidth={3}
          />
          {[0, 1, 2].map((k) => (
            <rect
              key={k}
              x={x}
              y={300 + i * 30 + k * 110}
              width={44}
              height={14}
              fill={C.red}
              opacity={0.5}
            />
          ))}
          <circle cx={x + 22} cy={244 + i * 30} r={6} fill={C.red} className="blink" />
        </g>
      ))}
      {/* turbine hall */}
      <rect
        x="520"
        y="560"
        width="440"
        height="140"
        fill="#0f0d20"
        stroke="#2a2148"
        strokeWidth={4}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x={540 + i * 52}
          y={590}
          width={36}
          height={60}
          fill={C.blue}
          opacity={0.18 + (i % 3) * 0.08}
        />
      ))}
      <Neon x={740} y={520} text="HALCÓN ENERGÍA" color={C.blue} size={34} />
      <rect x="0" y="700" width="1600" height="200" fill="#08070f" />
      <rect width="1600" height="900" fill="url(#fog)" />
      <RainDefs />
      <Rain />
    </>
  ),
  represa: () => (
    <>
      <Sky top="#05060f" mid="#0f1430" bottom="#142238" />
      <Cerros seed={33} y0={470} color="#0f0d24" lights={false} />
      {/* reservoir */}
      <path d="M0 520 L1040 520 L1040 900 L0 900 Z" fill="#081a2a" />
      {Array.from({ length: 22 }, (_, i) => (
        <line
          key={i}
          x1={(i * 113) % 1000}
          x2={((i * 113) % 1000) + 50 + (i % 4) * 20}
          y1={540 + (i % 8) * 34}
          y2={540 + (i % 8) * 34}
          stroke={i % 3 ? '#1d4a63' : C.violet}
          strokeOpacity={i % 3 ? 0.5 : 0.4}
          strokeWidth={2}
        />
      ))}
      {/* curved dam wall */}
      <path
        d="M1000 470 Q1060 690 1000 900 L1140 900 Q1200 690 1140 470 Z"
        fill="#1a1630"
        stroke="#2f2754"
        strokeWidth={4}
      />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <line
          key={k}
          x1={1010 + k * 4}
          x2={1130 - k * 4}
          y1={520 + k * 64}
          y2={520 + k * 64}
          stroke="#2f2754"
          strokeWidth={2}
        />
      ))}
      {/* spillway water */}
      <path
        d="M1140 520 Q1260 620 1270 900 L1330 900 Q1300 600 1160 500 Z"
        fill="#5fd3ff"
        opacity={0.12}
      />
      {/* pipes to the plant */}
      {[0, 1].map((k) => (
        <path
          key={k}
          d={`M1140 ${640 + k * 60} L1600 ${600 + k * 70}`}
          stroke="#2a2148"
          strokeWidth={18}
        />
      ))}
      <circle cx={1360} cy={631} r={10} fill={C.red} className="blink" />
      {/* control house */}
      <rect
        x={1060}
        y={400}
        width={90}
        height={70}
        fill="#120f24"
        stroke="#2f2754"
        strokeWidth={3}
      />
      <rect x={1078} y={418} width={22} height={18} fill={C.amber} opacity={0.6} />
      <Neon x={330} y={300} text="PEÑUELAS" color="#5fd3ff" size={38} />
      <rect width="1600" height="900" fill="url(#fog)" />
      <RainDefs />
      <Rain />
    </>
  ),
  metro: () => (
    <>
      <rect width="1600" height="900" fill="#05070c" />
      {/* control room wall: network map */}
      <rect
        x="120"
        y="70"
        width="1360"
        height="420"
        fill="#08101a"
        stroke="#1b2c3a"
        strokeWidth={4}
      />
      {[
        { d: 'M180 380 L460 380 L620 260 L980 260 L1140 160 L1420 160', c: '#9cff6e' },
        { d: 'M180 220 L420 220 L620 260 L760 380 L1180 380 L1420 300', c: C.amber },
        { d: 'M300 460 L520 330 L760 380 L900 140', c: C.magenta },
      ].map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill="none"
          stroke={l.c}
          strokeOpacity={0.55}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      ))}
      {[
        [180, 380],
        [460, 380],
        [620, 260],
        [980, 260],
        [1140, 160],
        [1420, 160],
        [180, 220],
        [420, 220],
        [760, 380],
        [1180, 380],
        [1420, 300],
        [300, 460],
        [520, 330],
        [900, 140],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={9}
          fill="#08101a"
          stroke="#cfe"
          strokeOpacity={0.7}
          strokeWidth={3}
        />
      ))}
      {[
        [540, 320],
        [1060, 210],
        [880, 380],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x - 14}
          y={y - 7}
          width={28}
          height={14}
          rx={4}
          fill={i === 2 ? C.red : '#9cff6e'}
          className={i === 2 ? 'blink' : undefined}
        />
      ))}
      {/* consoles */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <path
            d={`M${120 + i * 230} 900 L${150 + i * 230} 640 L${320 + i * 230} 640 L${350 + i * 230} 900 Z`}
            fill="#0a0f18"
            stroke="#1b2c3a"
            strokeWidth={3}
          />
          <rect
            x={165 + i * 230}
            y={600}
            width={140}
            height={86}
            fill="#0b1824"
            stroke="#1f3446"
            strokeWidth={3}
          />
          {[0, 1, 2].map((k) => (
            <line
              key={k}
              x1={178 + i * 230}
              x2={178 + i * 230 + 40 + ((i * 3 + k * 5) % 7) * 12}
              y1={622 + k * 20}
              y2={622 + k * 20}
              stroke={k === 1 && i % 2 ? C.amber : '#9cff6e'}
              strokeOpacity={0.6}
              strokeWidth={4}
            />
          ))}
        </g>
      ))}
      <Neon x={800} y={560} text="METRO VALPARAÍSO · CONTROL" color="#9cff6e" size={30} />
    </>
  ),
  archivo: () => (
    <>
      <rect width="1600" height="900" fill="#090609" />
      {/* vaulted ceiling */}
      {[0, 1, 2, 3].map((k) => (
        <path
          key={k}
          d={`M${k * 420 - 40} 260 Q${k * 420 + 170} 40 ${k * 420 + 380} 260`}
          fill="none"
          stroke="#2a1d26"
          strokeWidth={10}
        />
      ))}
      {/* shelves of boxes, receding */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = 40 + i * 225;
        return (
          <g key={i}>
            <rect
              x={x}
              y={260}
              width={190}
              height={520}
              fill="#120c12"
              stroke="#2a1d26"
              strokeWidth={4}
            />
            {Array.from({ length: 6 }, (_, k) => (
              <g key={k}>
                <line
                  x1={x}
                  x2={x + 190}
                  y1={340 + k * 80}
                  y2={340 + k * 80}
                  stroke="#2a1d26"
                  strokeWidth={5}
                />
                {Array.from({ length: 5 }, (_, j) => (
                  <rect
                    key={j}
                    x={x + 8 + j * 36}
                    y={290 + k * 80}
                    width={30}
                    height={48}
                    fill={(i + j + k) % 9 === 0 ? '#ff9f6e' : '#3a2a26'}
                    opacity={(i + j + k) % 9 === 0 ? 0.55 : 0.8}
                  />
                ))}
              </g>
            ))}
          </g>
        );
      })}
      {/* reading lamps */}
      {[360, 1180].map((x) => (
        <g key={x}>
          <path d={`M${x} 0 L${x} 120`} stroke="#2a1d26" strokeWidth={3} />
          <path
            d={`M${x - 40} 150 L${x + 40} 150 L${x + 18} 120 L${x - 18} 120 Z`}
            fill="#2a1d26"
          />
          <path
            d={`M${x - 40} 150 L${x - 220} 900 L${x + 220} 900 L${x + 40} 150 Z`}
            fill="#ff9f6e"
            opacity={0.06}
          />
        </g>
      ))}
      <rect x="0" y="780" width="1600" height="120" fill="#070407" />
      <Neon x={800} y={210} text="ARCHIVO REGIONAL" color="#ff9f6e" size={34} />
    </>
  ),
  cerros: () => (
    <>
      <Sky top="#060912" mid="#15172d" bottom="#192b35" />
      <Cerros seed={71} y0={480} color="#14182c" />
      <Cerros seed={72} y0={630} color="#0c1220" />
      {/* Quebrada entre las casas; la escalera queda en la ladera izquierda. */}
      <path d="M740 490 Q850 620 1050 900 L620 900 Q820 680 740 490 Z" fill="#03070e" />
      <path d="M120 900 L455 480 L530 480 L280 900 Z" fill="#27323e" />
      {Array.from({ length: 20 }, (_, i) => {
        const t = i / 20;
        return (
          <line
            key={i}
            x1={120 + 335 * t}
            x2={280 + 250 * t}
            y1={900 - 420 * t}
            y2={900 - 420 * t}
            stroke="#65707b"
            strokeWidth={3}
          />
        );
      })}
      <path d="M100 870 L440 452 M300 870 L547 452" fill="none" stroke="#75828d" strokeWidth={5} />
      <Neon x={1230} y={320} text="BARÓN" color="#ff6b4a" size={30} />
      <rect width="1600" height="900" fill="url(#fog)" />
      <ellipse cx="780" cy="560" rx="730" ry="75" fill="#879caf" opacity={0.08} />
      <circle cx="985" cy="660" r="18" fill="#ff6b4a" opacity={0.12} />
      <circle cx="985" cy="660" r="4" fill="#ff5145" className="blink" />
      <RainDefs />
      <Rain />
    </>
  ),
  servidores: () => (
    <>
      <rect width="1600" height="900" fill="#05070d" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect
            x={40 + i * 175}
            y={140}
            width={140}
            height={620}
            fill="#0b1220"
            stroke="#16304a"
            strokeWidth={3}
          />
          {Array.from({ length: 24 }, (_, k) => (
            <g key={k}>
              <rect x={52 + i * 175} y={156 + k * 25} width={116} height={18} fill="#0e1828" />
              <circle
                cx={64 + i * 175}
                cy={165 + k * 25}
                r={3}
                fill={(i * 7 + k * 3) % 5 === 0 ? C.red : C.green}
                opacity={0.8}
                className={(i + k) % 4 === 0 ? 'blink' : undefined}
                style={{ animationDelay: `${((i * 13 + k * 7) % 10) / 5}s` }}
              />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
};

/** Full-bleed location backdrop. */
export function Backdrop({
  place,
  className,
  dim = 0,
}: {
  place: PlaceId;
  className?: string;
  dim?: number;
}) {
  const Place = PLACES[place];
  return (
    <svg
      className={`place ${className ?? ''}`}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <Place />
      {dim > 0 && <rect width="1600" height="900" fill="#05040c" opacity={dim} />}
    </svg>
  );
}
