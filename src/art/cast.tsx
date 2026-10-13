import type { ReactElement } from 'react';
import { C } from '../engine/palette';

// Illustrated busts. Every character is built from the same parts (head, eyes, brows, nose,
// mouth, hair, outfit, one signature accessory) with flat colors, soft shading and a rim light
// in the character's color, so the cast reads as one hand. Eyes blink and the mouth moves while
// the character talks (CSS in game.css / v5.css).
export type CastId =
  | 'iris'
  | 'teo'
  | 'rosa'
  | 'contador'
  | 'baron'
  | 'vera'
  | 'nadia'
  | 'noesis'
  | 'marta'
  | 'lucia'
  | 'ana'
  | 'tomas'
  | 'ines'
  | 'elena'
  | 'rocio'
  | 'simon'
  | 'joaquin'
  | 'valentina';

export interface Character {
  id: CastId;
  name: string;
  role: string;
  color: string;
}

export const CAST: Record<CastId, Character> = {
  elena: {
    id: 'elena',
    name: 'Elena Saavedra',
    role: 'Técnica de calibración · El Observatorio',
    color: '#e7df5a',
  },
  ines: {
    id: 'ines',
    name: 'Inés Araya',
    role: 'Técnica de enlaces · Las Antenas',
    color: '#38d9c5',
  },
  iris: { id: 'iris', name: 'Iris Montt', role: 'Inspectora jefa · NÓESIS', color: C.cyan },
  teo: { id: 'teo', name: 'Teo Rivas', role: 'Técnico · NÓESIS', color: C.magenta },
  rosa: { id: 'rosa', name: 'Rosa Lagos', role: 'Jefa de bodega · Puerto', color: C.amber },
  contador: { id: 'contador', name: 'El Contador', role: 'Contrabandista', color: C.violet },
  baron: { id: 'baron', name: 'Barón Ferrer', role: 'Dueño · Casino Aurora', color: '#ffd36e' },
  vera: { id: 'vera', name: 'Vera Soto', role: 'Crupier · mesa 7', color: C.green },
  nadia: { id: 'nadia', name: 'Nadia Paz', role: 'Ingeniera de turno · La Planta', color: C.blue },
  noesis: { id: 'noesis', name: 'NÓESIS', role: 'Tutora de la agencia', color: C.teal },
  marta: {
    id: 'marta',
    name: 'Marta Quiroz',
    role: 'Hidróloga · Represa Peñuelas',
    color: '#5fd3ff',
  },
  lucia: {
    id: 'lucia',
    name: 'Lucía Ferrada',
    role: 'Controladora de tráfico · Metro',
    color: '#9cff6e',
  },
  tomas: { id: 'tomas', name: 'Tomás Leiva', role: 'Bombero · piloto de drones', color: '#ff6b4a' },
  ana: { id: 'ana', name: 'Ana Rojas', role: 'Archivera · Archivo Regional', color: '#ff9f6e' },
  rocio: {
    id: 'rocio',
    name: 'Rocío Pizarro',
    role: 'Tecnóloga médica · Clínica del Cerro',
    color: '#ff8fa3',
  },
  simon: {
    id: 'simon',
    name: 'Simón Valdés',
    role: 'Bioestadístico · ex Laboratorio Halcón',
    color: '#d68cff',
  },
  joaquin: {
    id: 'joaquin',
    name: 'Joaquín Tapia',
    role: 'Operador nocturno · La Fábrica',
    color: '#c9b37e',
  },
  valentina: {
    id: 'valentina',
    name: 'Valentina Ruiz',
    role: 'Operadora de mesa · La Bolsa',
    color: '#e6e9f2',
  },
};

type Hair =
  | 'bob'
  | 'messy'
  | 'bun'
  | 'slick'
  | 'ponytail'
  | 'highpony'
  | 'braid'
  | 'short'
  | 'none';
type Outfit =
  | 'coat'
  | 'hoodie'
  | 'workjacket'
  | 'suit'
  | 'vest'
  | 'overalls'
  | 'field'
  | 'uniform'
  | 'cardigan';
type Brows = 'flat' | 'raised' | 'stern' | 'soft';
type Mouth = 'neutral' | 'smile' | 'smirk' | 'firm';

type Jaw = 'oval' | 'round' | 'square' | 'narrow';

interface Look {
  jaw?: Jaw;
  skin: string;
  shade: string;
  hair: string;
  hairStyle: Hair;
  iris: string;
  brows: Brows;
  mouth: Mouth;
  outfit: Outfit;
  cloth: string;
  cloth2: string;
  age?: boolean;
  extra?: (col: string, k: string) => ReactElement;
}

const LOOKS: Record<Exclude<CastId, 'noesis'>, Look> = {
  elena: {
    jaw: 'oval',
    skin: '#c48f6a',
    shade: '#9e6b4b',
    hair: '#d7d2c7',
    hairStyle: 'short',
    iris: '#394e49',
    brows: 'flat',
    mouth: 'firm',
    outfit: 'field',
    cloth: '#243437',
    cloth2: '#e7df5a',
    age: true,
    extra: (col) => <CalibrationBadge col={col} />,
  },
  ines: {
    jaw: 'oval',
    skin: '#b9825a',
    shade: '#93613f',
    hair: '#181c22',
    hairStyle: 'short',
    iris: '#355c58',
    brows: 'flat',
    mouth: 'firm',
    outfit: 'workjacket',
    cloth: '#142b2b',
    cloth2: '#38d9c5',
    age: false,
    extra: (col) => <Headset col={col} />,
  },
  iris: {
    jaw: 'narrow',
    skin: '#d9a982',
    shade: '#b07e5c',
    hair: '#1a1424',
    hairStyle: 'bob',
    iris: '#3a2a20',
    brows: 'stern',
    mouth: 'firm',
    outfit: 'coat',
    cloth: '#1c2233',
    cloth2: '#2c3550',
    extra: (c) => <Visor col={c} />,
  },
  teo: {
    jaw: 'round',
    skin: '#b9825a',
    shade: '#93613f',
    hair: '#20160f',
    hairStyle: 'messy',
    iris: '#2c1c12',
    brows: 'raised',
    mouth: 'smile',
    outfit: 'hoodie',
    cloth: '#2a1630',
    cloth2: '#3b1f45',
    extra: (c) => <Headphones col={c} />,
  },
  rosa: {
    jaw: 'square',
    skin: '#c99a76',
    shade: '#a27453',
    hair: '#b9b4bd',
    hairStyle: 'bun',
    iris: '#4a3324',
    brows: 'flat',
    mouth: 'firm',
    outfit: 'workjacket',
    cloth: '#2d2a22',
    cloth2: '#ffbc5e',
    age: true,
  },
  contador: {
    jaw: 'narrow',
    skin: '#e3bf9f',
    shade: '#bf977a',
    hair: '#141019',
    hairStyle: 'slick',
    iris: '#56606b',
    brows: 'stern',
    mouth: 'smirk',
    outfit: 'suit',
    cloth: '#16131f',
    cloth2: '#a88aff',
    age: true,
    extra: (c) => <RectGlasses col={c} />,
  },
  baron: {
    jaw: 'round',
    skin: '#e0b48e',
    shade: '#ba8b68',
    hair: '#2a1c14',
    hairStyle: 'short',
    iris: '#3d2a1b',
    brows: 'raised',
    mouth: 'smile',
    outfit: 'suit',
    cloth: '#2a0f1c',
    cloth2: '#ffd36e',
    age: true,
    extra: (c) => <Baron col={c} />,
  },
  vera: {
    jaw: 'oval',
    skin: '#a8714c',
    shade: '#865636',
    hair: '#1a110c',
    hairStyle: 'ponytail',
    iris: '#2c1c12',
    brows: 'soft',
    mouth: 'neutral',
    outfit: 'vest',
    cloth: '#0f2a1f',
    cloth2: '#4dffa6',
  },
  nadia: {
    jaw: 'square',
    skin: '#8d5a3b',
    shade: '#6f432a',
    hair: '#120c09',
    hairStyle: 'short',
    iris: '#2a1a10',
    brows: 'flat',
    mouth: 'firm',
    outfit: 'overalls',
    cloth: '#1b2440',
    cloth2: '#6f9cff',
    extra: (c) => <HardHat col={c} />,
  },
  marta: {
    jaw: 'round',
    skin: '#c48f6a',
    shade: '#9e6b4b',
    hair: '#3a2416',
    hairStyle: 'braid',
    iris: '#3d5a40',
    brows: 'soft',
    mouth: 'smile',
    outfit: 'field',
    cloth: '#1f2c24',
    cloth2: '#5fd3ff',
    extra: (c) => <DropPin col={c} />,
  },
  lucia: {
    jaw: 'oval',
    skin: '#d4a07a',
    shade: '#ad7a57',
    hair: '#2b1810',
    hairStyle: 'highpony',
    iris: '#2f2219',
    brows: 'raised',
    mouth: 'neutral',
    outfit: 'uniform',
    cloth: '#16242a',
    cloth2: '#9cff6e',
    extra: (c) => <Headset col={c} />,
  },
  tomas: {
    jaw: 'square',
    skin: '#b9825a',
    shade: '#93613f',
    hair: '#1b1512',
    hairStyle: 'short',
    iris: '#37251a',
    brows: 'flat',
    mouth: 'neutral',
    outfit: 'uniform',
    cloth: '#681e24',
    cloth2: '#e6edb5',
    extra: (c) => <ShoulderRadio col={c} />,
  },
  ana: {
    jaw: 'narrow',
    skin: '#e6c2a4',
    shade: '#c19a7c',
    hair: '#3b2a22',
    hairStyle: 'bun',
    iris: '#4b5d3a',
    brows: 'soft',
    mouth: 'neutral',
    outfit: 'cardigan',
    cloth: '#2a1d1d',
    cloth2: '#ff9f6e',
    extra: (c) => <RoundGlasses col={c} />,
  },
  rocio: {
    jaw: 'oval',
    skin: '#d4a07a',
    shade: '#ad7b58',
    hair: '#4a2f22',
    hairStyle: 'bun',
    iris: '#3d2b20',
    brows: 'flat',
    mouth: 'neutral',
    outfit: 'cardigan',
    cloth: '#e8eef2',
    cloth2: '#ff8fa3',
    extra: (c) => <RoundGlasses col={c} />,
  },
  simon: {
    jaw: 'narrow',
    skin: '#e8c4a6',
    shade: '#c49e80',
    hair: '#8a6a4a',
    hairStyle: 'messy',
    iris: '#4a5a3a',
    brows: 'raised',
    mouth: 'smirk',
    outfit: 'hoodie',
    cloth: '#2a2532',
    cloth2: '#d68cff',
    extra: (c) => <RectGlasses col={c} />,
  },
  joaquin: {
    jaw: 'square',
    skin: '#a87452',
    shade: '#875a3c',
    hair: '#b9b4ad',
    hairStyle: 'short',
    iris: '#3a2a1f',
    brows: 'stern',
    mouth: 'neutral',
    outfit: 'overalls',
    cloth: '#3a3226',
    cloth2: '#c9b37e',
    age: true,
    extra: (c) => <Headphones col={c} />,
  },
  valentina: {
    jaw: 'narrow',
    skin: '#ecc9ae',
    shade: '#c9a385',
    hair: '#141217',
    hairStyle: 'ponytail',
    iris: '#3b2b22',
    brows: 'stern',
    mouth: 'smirk',
    outfit: 'suit',
    cloth: '#1d2230',
    cloth2: '#e6e9f2',
    extra: (c) => <Headset col={c} />,
  },
};

/** Bust portrait in a 300×360 box. `talking` moves the mouth and adds a slight bob. */
export function Portrait({
  id,
  size = 300,
  talking = false,
  dim = false,
  flip = false,
}: {
  id: CastId;
  size?: number;
  talking?: boolean;
  dim?: boolean;
  flip?: boolean;
}) {
  const col = CAST[id].color;
  const k = `p-${id}`;
  return (
    <svg
      width={size}
      height={(size * 360) / 300}
      viewBox="0 0 300 360"
      className={`portrait ${talking ? 'talking' : ''} ${dim ? 'dim' : ''}`}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${k}-bg`} cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor={col} stopOpacity="0.26" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </radialGradient>
        <filter id={`${k}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="150" cy="168" r="148" fill={`url(#${k}-bg)`} />
      <g className="portrait-body">
        {id === 'noesis' ? <Noesis col={col} k={k} /> : <Bust look={LOOKS[id]} col={col} k={k} />}
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ the shared bust
const HEADS: Record<Jaw, string> = {
  oval: 'M100 138 C 100 96 122 72 150 72 C 178 72 200 96 200 138 C 200 172 188 200 168 214 C 160 219 140 219 132 214 C 112 200 100 172 100 138 Z',
  round:
    'M98 140 C 98 96 122 72 150 72 C 178 72 202 96 202 140 C 202 178 186 206 164 214 C 156 217 144 217 136 214 C 114 206 98 178 98 140 Z',
  square:
    'M100 136 C 100 94 122 72 150 72 C 178 72 200 94 200 136 C 200 168 198 190 182 206 C 172 216 162 219 150 219 C 138 219 128 216 118 206 C 102 190 100 168 100 136 Z',
  narrow:
    'M103 138 C 103 96 124 72 150 72 C 176 72 197 96 197 138 C 197 170 186 198 166 214 C 158 220 142 220 134 214 C 114 198 103 170 103 138 Z',
};
const TORSO = 'M30 360 C 38 290 86 252 128 242 L172 242 C 214 252 262 290 270 360 Z';

function Bust({ look, col, k }: { look: Look; col: string; k: string }) {
  const L = look;
  return (
    <>
      <defs>
        <linearGradient id={`${k}-skin`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor={L.skin} />
          <stop offset="0.62" stopColor={L.skin} />
          <stop offset="1" stopColor={L.shade} />
        </linearGradient>
        <linearGradient id={`${k}-cloth`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={L.cloth} />
          <stop offset="1" stopColor="#07060d" />
        </linearGradient>
        <linearGradient id={`${k}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lift(L.hair, 0.18)} />
          <stop offset="1" stopColor={L.hair} />
        </linearGradient>
      </defs>
      <HairBack style={L.hairStyle} k={k} />
      {/* outfit */}
      <path d={TORSO} fill={`url(#${k}-cloth)`} />
      {/* neck */}
      <path d="M133 198 L167 198 L171 246 L129 246 Z" fill={L.shade} />
      <path
        d="M132 204 C 140 216 160 216 168 204 L170 226 C 158 234 142 234 130 226 Z"
        fill="#000"
        opacity={0.18}
      />
      <Outfit look={L} col={col} />
      {/* ears */}
      <ellipse cx="100" cy="152" rx="9" ry="14" fill={L.skin} />
      <ellipse cx="200" cy="152" rx="9" ry="14" fill={L.shade} />
      {/* head */}
      <path d={HEADS[L.jaw ?? 'oval']} fill={`url(#${k}-skin)`} />
      <ellipse cx="128" cy="174" rx="12" ry="7" fill="#e0607a" opacity={0.12} />
      <ellipse cx="172" cy="174" rx="12" ry="7" fill="#e0607a" opacity={0.1} />
      {L.age && (
        <g stroke={L.shade} strokeWidth={1.6} fill="none" opacity={0.8} strokeLinecap="round">
          <path d="M134 184 Q 131 176 135 168" />
          <path d="M166 184 Q 169 176 165 168" />
          <path d="M136 118 Q 150 114 164 118" />
        </g>
      )}
      <Brows kind={L.brows} color={darken(L.hair)} />
      <g className="eyes">
        <Eye cx={130} cy={150} iris={L.iris} k={`${k}-l`} />
        <Eye cx={170} cy={150} iris={L.iris} k={`${k}-r`} />
      </g>
      {/* nose */}
      <path
        d="M151 154 C 152 164 156 171 151 175 C 148 177 145 176 143 174"
        fill="none"
        stroke={L.shade}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <MouthShape kind={L.mouth} />
      <HairFront style={L.hairStyle} k={k} />
      {L.extra?.(col, k)}
      {/* rim light on the shadow side */}
      <path
        d="M197 108 C 205 126 205 162 193 190"
        fill="none"
        stroke={col}
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={0.7}
        filter={`url(#${k}-glow)`}
      />
      <path
        d="M206 256 C 236 270 256 300 264 340"
        fill="none"
        stroke={col}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.3}
      />
    </>
  );
}

function Eye({ cx, cy, iris, k }: { cx: number; cy: number; iris: string; k: string }) {
  const almond = `M${cx - 11.5} ${cy} Q ${cx} ${cy - 8.5} ${cx + 11.5} ${cy} Q ${cx} ${cy + 6.5} ${cx - 11.5} ${cy} Z`;
  return (
    <g>
      <clipPath id={`${k}-clip`}>
        <path d={almond} />
      </clipPath>
      <path d={almond} fill="#f4efe9" />
      <g clipPath={`url(#${k}-clip)`}>
        <circle cx={cx} cy={cy - 0.4} r={5} fill={iris} />
        <circle cx={cx} cy={cy - 0.4} r={2.3} fill="#0b0708" />
        <circle cx={cx + 1.8} cy={cy - 2.3} r={1.3} fill="#fff" />
      </g>
      <path
        d={`M${cx - 12.5} ${cy + 0.6} Q ${cx} ${cy - 10} ${cx + 12.5} ${cy + 0.6}`}
        fill="none"
        stroke="#1a1012"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </g>
  );
}

function Brows({ kind, color }: { kind: Brows; color: string }) {
  const p =
    kind === 'stern'
      ? ['M117 131 Q 129 129 141 136', 'M159 136 Q 171 129 183 131']
      : kind === 'raised'
        ? ['M117 132 Q 129 124 141 130', 'M159 130 Q 171 124 183 132']
        : kind === 'soft'
          ? ['M118 134 Q 130 128 141 132', 'M159 132 Q 170 128 182 134']
          : ['M118 133 Q 130 130 141 133', 'M159 133 Q 170 130 182 133'];
  return (
    <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
      {p.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

function MouthShape({ kind }: { kind: Mouth }) {
  const d =
    kind === 'smile'
      ? 'M137 190 Q 150 200 163 190'
      : kind === 'smirk'
        ? 'M139 193 Q 152 196 163 188'
        : kind === 'firm'
          ? 'M139 193 Q 150 195 161 193'
          : 'M138 192 Q 150 197 162 192';
  return (
    <g>
      <path
        className="mouth-closed"
        d={d}
        fill="none"
        stroke="#7a3a3c"
        strokeWidth={2.8}
        strokeLinecap="round"
      />
      <ellipse className="mouth-open" cx="150" cy="194" rx="8" ry="4.5" fill="#3a1416" />
    </g>
  );
}

function HairBack({ style, k }: { style: Hair; k: string }) {
  const f = `url(#${k}-hair)`;
  switch (style) {
    case 'bob':
      return (
        <path
          d="M90 180 C 80 100 114 60 152 60 C 192 60 222 100 210 180 L 206 210 L 188 210 L 192 150 C 192 120 176 100 150 100 C 124 100 108 120 108 150 L 112 210 L 94 210 Z"
          fill={f}
        />
      );
    case 'ponytail':
      return (
        <g fill={f}>
          <path d="M96 150 C 90 100 118 68 152 68 C 186 68 212 100 204 150 Z" />
          <path d="M188 104 C 232 124 232 214 210 262 C 202 244 208 196 186 142 Z" />
        </g>
      );
    case 'highpony':
      return (
        <g fill={f}>
          <path d="M96 150 C 90 100 118 68 152 68 C 186 68 212 100 204 150 Z" />
          <path d="M176 76 C 228 62 248 120 236 176 C 228 160 226 118 192 96 Z" />
        </g>
      );
    case 'braid':
      return (
        <g fill={f}>
          <path d="M96 150 C 90 100 118 68 152 68 C 186 68 212 100 204 150 Z" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx={206 + Math.sin(i) * 3}
              cy={168 + i * 20}
              rx={11 - i * 0.6}
              ry={12}
            />
          ))}
        </g>
      );
    case 'bun':
      return (
        <g fill={f}>
          <circle cx="150" cy="62" r="25" />
          <path d="M98 150 C 92 102 120 74 150 74 C 182 74 208 102 202 150 Z" />
        </g>
      );
    case 'messy':
      return <path d="M94 150 C 86 96 118 62 152 62 C 188 62 216 94 206 150 Z" fill={f} />;
    case 'slick':
    case 'short':
      return <path d="M98 140 C 96 96 122 70 152 70 C 184 70 206 96 202 140 Z" fill={f} />;
    default:
      return null;
  }
}

/** Hair over the forehead: a crown that covers the top of the head down to a real hairline. */
const CROWN =
  'M95 150 C 90 92 118 60 152 60 C 188 60 212 92 205 150 L 199 150 C 199 128 192 112 181 104 C 166 111 138 112 121 106 C 109 114 102 130 101 150 Z';

function HairFront({ style, k }: { style: Hair; k: string }) {
  const f = `url(#${k}-hair)`;
  const shine = (
    <path
      d="M118 84 C 136 72 168 72 186 86"
      fill="none"
      stroke="#fff"
      strokeOpacity={0.14}
      strokeWidth={4}
      strokeLinecap="round"
    />
  );
  switch (style) {
    case 'bob':
      return (
        <g fill={f}>
          <path d={CROWN} />
          <path d="M95 150 L 91 206 C 99 213 109 209 111 198 L 104 150 Z" />
          <path d="M205 150 L 209 206 C 201 213 191 209 189 198 L 196 150 Z" />
          <path d="M121 104 C 144 100 174 104 190 122 C 178 114 152 116 130 128 C 118 134 108 142 102 152 C 104 130 110 114 121 104 Z" />
          {shine}
        </g>
      );
    case 'messy':
      return (
        <g fill={f}>
          <path d={CROWN} />
          <path d="M100 118 L 104 90 L 116 102 L 120 76 L 136 94 L 146 68 L 158 92 L 172 70 L 180 96 L 194 82 L 196 108 L 206 104 C 204 84 186 60 152 60 C 118 60 98 84 100 118 Z" />
          <path d="M124 106 L 132 118 L 138 106 L 148 120 L 152 106 L 162 118 L 168 104 Z" />
        </g>
      );
    case 'bun':
      return (
        <g fill={f}>
          <path d={CROWN} />
          <path
            d="M150 62 L 150 104"
            fill="none"
            stroke="#000"
            strokeOpacity={0.25}
            strokeWidth={2}
          />
          {shine}
        </g>
      );
    case 'slick':
      return (
        <g fill={f}>
          <path d={CROWN} />
          <path
            d="M128 64 C 124 80 122 94 121 106"
            fill="none"
            stroke="#000"
            strokeOpacity={0.35}
            strokeWidth={2}
          />
          <path
            d="M132 76 C 152 66 178 70 196 92"
            fill="none"
            stroke="#fff"
            strokeOpacity={0.2}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      );
    case 'short':
      return (
        <g fill={f}>
          <path d="M97 140 C 92 90 120 62 152 62 C 186 62 210 90 203 140 L 198 138 C 197 120 190 108 180 102 C 164 108 138 108 122 102 C 110 110 104 124 102 140 Z" />
        </g>
      );
    case 'ponytail':
    case 'highpony':
    case 'braid':
      return (
        <g fill={f}>
          <path d={CROWN} />
          <path
            d="M150 62 C 146 80 144 96 146 108"
            fill="none"
            stroke="#000"
            strokeOpacity={0.25}
            strokeWidth={2}
          />
          {shine}
        </g>
      );
    default:
      return null;
  }
}

function Outfit({ look, col }: { look: Look; col: string }) {
  const L = look;
  switch (L.outfit) {
    case 'coat':
      return (
        <g>
          <path d="M128 248 L150 300 L172 248 Z" fill="#c9cfdc" opacity={0.85} />
          <path
            d="M92 360 L104 252 L130 230 L136 270 L120 360 Z M208 360 L196 252 L170 230 L164 270 L180 360 Z"
            fill={L.cloth2}
            stroke={col}
            strokeOpacity={0.4}
            strokeWidth={2}
          />
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path
            d="M86 280 C 90 250 120 236 150 236 C 180 236 210 250 214 280 C 196 262 176 256 150 256 C 124 256 104 262 86 280 Z"
            fill={L.cloth2}
          />
          <path
            d="M138 258 L134 310 M162 258 L166 310"
            stroke="#d8d0e8"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    case 'workjacket':
      return (
        <g>
          <path d="M150 250 L150 360" stroke="#000" strokeOpacity={0.4} strokeWidth={3} />
          <path d="M40 330 L260 330" stroke={L.cloth2} strokeWidth={10} opacity={0.8} />
          <path d="M120 246 L150 268 L180 246" fill="none" stroke="#3a362c" strokeWidth={8} />
        </g>
      );
    case 'suit':
      return (
        <g>
          <path d="M128 248 L150 330 L172 248 Z" fill="#e8e4ee" />
          <path d="M146 258 L154 258 L158 330 L150 344 L142 330 Z" fill={L.cloth2} />
          <path
            d="M104 360 L112 256 L130 244 L150 330 L124 360 Z M196 360 L188 256 L170 244 L150 330 L176 360 Z"
            fill="#0b0912"
            opacity={0.9}
          />
        </g>
      );
    case 'vest':
      return (
        <g>
          <path d="M120 246 L150 300 L180 246 L200 360 L100 360 Z" fill="#eae6ef" />
          <path
            d="M110 360 L118 270 L150 330 L182 270 L190 360 Z"
            fill="#132a20"
            stroke={col}
            strokeOpacity={0.4}
            strokeWidth={2}
          />
          <path d="M136 252 L150 260 L164 252 L164 268 L150 260 L136 268 Z" fill={L.cloth2} />
        </g>
      );
    case 'overalls':
      return (
        <g>
          <path
            d="M116 250 L124 360 M184 250 L176 360"
            stroke={L.cloth2}
            strokeOpacity={0.6}
            strokeWidth={14}
          />
          <circle cx="122" cy="300" r="5" fill="#d6d6e0" />
          <circle cx="178" cy="300" r="5" fill="#d6d6e0" />
        </g>
      );
    case 'field':
      return (
        <g>
          <path d="M120 246 L150 290 L180 246" fill="none" stroke="#2f4236" strokeWidth={10} />
          <rect x="84" y="300" width="36" height="28" rx="3" fill="#000" opacity={0.25} />
          <rect x="180" y="300" width="36" height="28" rx="3" fill="#000" opacity={0.25} />
        </g>
      );
    case 'uniform':
      return (
        <g>
          <path d="M126 248 L150 272 L174 248" fill="none" stroke="#2a3f48" strokeWidth={8} />
          <path d="M44 318 L256 318" stroke={L.cloth2} strokeWidth={6} opacity={0.7} />
          <path d="M40 334 L260 334" stroke="#d8e4e8" strokeWidth={3} opacity={0.5} />
        </g>
      );
    case 'cardigan':
      return (
        <g>
          <path d="M128 244 L150 256 L172 244 L174 262 L150 270 L126 262 Z" fill="#e8dfd6" />
          <path
            d="M100 360 L118 262 L150 300 L182 262 L200 360"
            fill="none"
            stroke="#5a3c34"
            strokeWidth={10}
          />
        </g>
      );
    default:
      return null;
  }
}

// ------------------------------------------------------------------ signature accessories
function CalibrationBadge({ col }: { col: string }) {
  return (
    <g>
      <path d="M99 148 L91 107" stroke="#d9b365" strokeWidth={5} strokeLinecap="round" />
      <path d="M91 107 L90 99 L94 105" fill="#ddd6c4" />
      <path d="M122 248 L151 305 L178 248" fill="none" stroke="#87908c" strokeWidth={3} />
      <rect
        x="133"
        y="302"
        width="36"
        height="43"
        rx="3"
        fill="#18292c"
        stroke={col}
        strokeWidth={2}
      />
      <rect x="139" y="309" width="10" height="12" fill="#d7d2c7" opacity={0.7} />
      <path
        d="M154 312 L163 312 M154 317 L163 317 M140 329 L162 329 M140 335 L155 335"
        stroke={col}
        strokeWidth={2}
      />
      <path d="M67 289 L77 283 M215 329 L225 322" stroke="#7f9088" strokeWidth={2} opacity={0.6} />
    </g>
  );
}
function ShoulderRadio({ col }: { col: string }) {
  return (
    <g>
      <path d="M90 275 L86 239" stroke="#151a20" strokeWidth={5} strokeLinecap="round" />
      <rect
        x="77"
        y="270"
        width="28"
        height="43"
        rx="5"
        fill="#182128"
        stroke="#b9c4c3"
        strokeWidth={2}
      />
      <rect x="82" y="276" width="18" height="9" rx="2" fill={col} />
      {[293, 298, 303].map((y) => (
        <path key={y} d={`M83 ${y} L99 ${y}`} stroke="#aebdbe" strokeWidth={2} />
      ))}
      <path d="M102 312 Q117 324 118 345" fill="none" stroke="#131b20" strokeWidth={3} />
    </g>
  );
}
function Visor({ col }: { col: string }) {
  return (
    <g>
      <rect x="110" y="139" width="80" height="20" rx="10" fill="#0c1a22" opacity={0.55} />
      <rect x="110" y="139" width="80" height="20" rx="10" fill={col} opacity={0.32} />
      <rect x="112" y="141" width="76" height="4" rx="2" fill="#fff" opacity={0.35} />
      <path d="M104 148 L110 148 M190 148 L198 148" stroke="#2a3440" strokeWidth={4} />
    </g>
  );
}
function Headphones({ col }: { col: string }) {
  return (
    <g>
      <path d="M96 146 C 92 70 208 70 204 146" fill="none" stroke="#2a2440" strokeWidth={9} />
      <rect
        x="84"
        y="130"
        width="22"
        height="38"
        rx="9"
        fill="#2a2440"
        stroke={col}
        strokeWidth={2.5}
      />
      <rect
        x="194"
        y="130"
        width="22"
        height="38"
        rx="9"
        fill="#2a2440"
        stroke={col}
        strokeWidth={2.5}
      />
      <circle cx="95" cy="149" r="4" fill={col} />
      <circle cx="205" cy="149" r="4" fill={col} />
    </g>
  );
}
function RectGlasses({ col }: { col: string }) {
  return (
    <g fill={col} fillOpacity={0.12} stroke="#d6d2e0" strokeWidth={2.2}>
      <rect x="115" y="141" width="30" height="17" rx="3" />
      <rect x="155" y="141" width="30" height="17" rx="3" />
      <path d="M145 148 L155 148" fill="none" />
    </g>
  );
}
function RoundGlasses({ col }: { col: string }) {
  return (
    <g>
      <g fill="none" stroke={col} strokeWidth={2.6}>
        <circle cx="130" cy="150" r="14" />
        <circle cx="170" cy="150" r="14" />
        <path d="M144 149 Q 150 145 156 149" />
      </g>
      <path
        d="M116 154 C 108 196 116 232 128 248 M184 154 C 192 196 184 232 172 248"
        fill="none"
        stroke={col}
        strokeOpacity={0.45}
        strokeWidth={1.4}
      />
    </g>
  );
}
function HardHat({ col }: { col: string }) {
  return (
    <g>
      <path d="M90 118 C 92 64 122 48 150 48 C 180 48 208 64 210 118 Z" fill="#e8b923" />
      <path d="M150 50 L150 116" stroke="#c99a12" strokeWidth={6} />
      <rect x="82" y="112" width="136" height="12" rx="6" fill="#d4a614" />
      <circle cx="150" cy="86" r="10" fill={col} />
      <circle cx="150" cy="86" r="16" fill={col} opacity={0.25} />
    </g>
  );
}
function Headset({ col }: { col: string }) {
  return (
    <g>
      <path d="M98 150 C 96 92 204 92 202 150" fill="none" stroke="#24333a" strokeWidth={7} />
      <rect x="88" y="136" width="18" height="30" rx="8" fill="#24333a" />
      <path d="M97 166 C 102 192 120 200 136 198" fill="none" stroke={col} strokeWidth={3} />
      <circle cx="138" cy="198" r="5" fill={col} />
    </g>
  );
}
function DropPin({ col }: { col: string }) {
  return (
    <path
      d="M198 268 C 198 268 188 282 188 289 A 10 10 0 0 0 208 289 C 208 282 198 268 198 268 Z"
      fill={col}
    />
  );
}
function Baron({ col }: { col: string }) {
  return (
    <g>
      {/* mustache */}
      <path
        d="M136 184 C 142 178 148 180 150 184 C 152 180 158 178 164 184 C 160 190 154 188 150 186 C 146 188 140 190 136 184 Z"
        fill="#2a1c14"
      />
      {/* monocle */}
      <circle cx="170" cy="150" r="14" fill="none" stroke={col} strokeWidth={2.6} />
      <path
        d="M182 158 C 196 190 190 230 180 250"
        fill="none"
        stroke={col}
        strokeOpacity={0.6}
        strokeWidth={1.4}
      />
      {/* top hat */}
      <rect x="108" y="18" width="84" height="74" rx="4" fill="#120d16" />
      <rect x="108" y="74" width="84" height="12" fill={col} opacity={0.85} />
      <ellipse cx="150" cy="94" rx="72" ry="10" fill="#1a1320" />
    </g>
  );
}

function Noesis({ col, k }: { col: string; k: string }) {
  return (
    <>
      <polygon
        points="150,38 248,94 248,226 150,282 52,226 52,94"
        fill="#0b0a1c"
        stroke={col}
        strokeOpacity={0.7}
        strokeWidth={4}
      />
      <polygon
        points="150,68 222,110 222,210 150,252 78,210 78,110"
        fill="none"
        stroke={col}
        strokeOpacity={0.25}
        strokeWidth={2}
      />
      <circle cx="150" cy="160" r="62" fill="#07141a" stroke={col} strokeWidth={3} />
      <g className="eyes" filter={`url(#${k}-glow)`}>
        <circle cx="150" cy="160" r="30" fill={col} opacity={0.88} />
        <circle cx="150" cy="160" r="12" fill="#04080a" />
        <circle cx="160" cy="150" r="5" fill="#fff" opacity={0.85} />
      </g>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line
          key={a}
          x1={150 + 70 * Math.cos((a * Math.PI) / 180)}
          y1={160 + 70 * Math.sin((a * Math.PI) / 180)}
          x2={150 + 84 * Math.cos((a * Math.PI) / 180)}
          y2={160 + 84 * Math.sin((a * Math.PI) / 180)}
          stroke={col}
          strokeWidth={3}
          opacity={0.7}
        />
      ))}
      <g className="mouth-open">
        <path d="M118 228 L182 228" stroke={col} strokeWidth={3} opacity={0.8} />
      </g>
      <path d="M90 330 L210 330" stroke={col} strokeOpacity={0.4} strokeWidth={3} />
    </>
  );
}

// ------------------------------------------------------------------ color helpers
function hexToRgb(h: string) {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const toHex = (r: number, g: number, b: number) =>
  '#' +
  [r, g, b]
    .map((x) =>
      Math.max(0, Math.min(255, Math.round(x)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
function lift(h: string, t: number) {
  const [r, g, b] = hexToRgb(h);
  return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}
function darken(h: string) {
  const [r, g, b] = hexToRgb(h);
  const l = (r + g + b) / 3;
  return l > 140 ? toHex(r * 0.7, g * 0.7, b * 0.7) : h;
}
