import type { ReactElement } from 'react';
import { C } from '../engine/palette';

// Noir portraits: dark silhouettes with a rim light in the character's color and one luminous
// signature feature (visor, headphones, monocle...). Stylized on purpose: no realistic faces.
export type CastId = 'iris' | 'teo' | 'rosa' | 'contador' | 'baron' | 'vera' | 'nadia' | 'noesis' | 'marta';

export interface Character {
  id: CastId;
  name: string;
  role: string;
  color: string;
}

export const CAST: Record<CastId, Character> = {
  iris: { id: 'iris', name: 'Iris Montt', role: 'Inspectora jefa · NÓESIS', color: C.cyan },
  teo: { id: 'teo', name: 'Teo Rivas', role: 'Técnico · NÓESIS', color: C.magenta },
  rosa: { id: 'rosa', name: 'Rosa Lagos', role: 'Jefa de bodega · Puerto', color: C.amber },
  contador: { id: 'contador', name: 'El Contador', role: 'Contrabandista', color: C.violet },
  baron: { id: 'baron', name: 'Barón Ferrer', role: 'Dueño · Casino Aurora', color: '#ffd36e' },
  vera: { id: 'vera', name: 'Vera Soto', role: 'Crupier · mesa 7', color: C.green },
  nadia: { id: 'nadia', name: 'Nadia Paz', role: 'Ingeniera de turno · La Planta', color: C.blue },
  noesis: { id: 'noesis', name: 'NÓESIS', role: 'Tutora de la agencia', color: C.teal },
  marta: { id: 'marta', name: 'Marta Quiroz', role: 'Hidróloga · Represa Peñuelas', color: '#5fd3ff' },
};

const SKIN = '#151226';
const CLOTH = '#0c0a1a';

/** Bust portrait in a 300×360 box. `talking` adds a subtle bob; eyes blink via CSS. */
export function Portrait({ id, size = 300, talking = false, dim = false, flip = false }: { id: CastId; size?: number; talking?: boolean; dim?: boolean; flip?: boolean }) {
  const col = CAST[id].color;
  const gid = `rim-${id}`;
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
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={col} stopOpacity="0.9" />
          <stop offset="0.45" stopColor={col} stopOpacity="0.05" />
          <stop offset="1" stopColor={col} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${gid}-bg`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor={col} stopOpacity="0.22" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </radialGradient>
        <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="150" cy="160" r="150" fill={`url(#${gid}-bg)`} />
      <g className="portrait-body">
        {BODY[id](col, gid)}
      </g>
    </svg>
  );
}

const shoulders = (fill = CLOTH) => (
  <path d="M20 360 C 30 280 80 252 120 244 L 180 244 C 220 252 270 280 280 360 Z" fill={fill} />
);
const neck = <path d="M128 214 L172 214 L176 252 L124 252 Z" fill={SKIN} />;
const head = (rx = 52, ry = 64) => <ellipse cx="150" cy="150" rx={rx} ry={ry} fill={SKIN} />;
const rim = (gid: string) => (
  <path
    d="M98 150 C 98 100 120 84 150 84 C 182 84 202 104 202 150 C 202 190 186 214 150 216 C 116 214 98 190 98 150 Z M20 360 C 30 280 80 252 120 244 L180 244 C 220 252 270 280 280 360"
    fill="none"
    stroke={`url(#${gid})`}
    strokeWidth="3"
  />
);
const eyes = (col: string, gid: string, y = 148) => (
  <g className="eyes" filter={`url(#${gid}-glow)`}>
    <line x1="126" y1={y} x2="140" y2={y} stroke={col} strokeWidth="3" strokeLinecap="round" />
    <line x1="160" y1={y} x2="174" y2={y} stroke={col} strokeWidth="3" strokeLinecap="round" />
  </g>
);

const BODY: Record<CastId, (col: string, gid: string) => ReactElement> = {
  marta: (col, gid) => (
    <>
      {/* field jacket with a raised hood behind */}
      <path d="M78 360 C 66 262 92 206 150 202 C 208 206 234 262 222 360 Z" fill="#0f1424" />
      {shoulders('#0d1222')}
      <path d="M120 246 L150 290 L180 246" fill="none" stroke={col} strokeOpacity="0.45" strokeWidth="3" />
      {neck}
      {head(48, 62)}
      {/* braid */}
      <path d="M102 150 C 96 100 124 82 152 82 C 184 82 206 102 200 150 C 196 120 182 104 150 104 C 122 104 106 120 102 150 Z" fill="#07060f" />
      <path d="M196 150 C 214 190 210 230 196 262" stroke="#07060f" strokeWidth="14" fill="none" strokeLinecap="round" />
      {rim(gid)}
      {eyes(col, gid)}
      {/* water-drop pin on the collar */}
      <g filter={`url(#${gid}-glow)`}>
        <path d="M200 262 C 200 262 188 280 188 288 A 12 12 0 0 0 212 288 C 212 280 200 262 200 262 Z" fill={col} />
      </g>
    </>
  ),
  noesis: (col, gid) => (
    <>
      {/* the agency's tutor: a lens in a hexagonal frame */}
      <polygon points="150,40 245,95 245,225 150,280 55,225 55,95" fill="#0b0a1c" stroke={col} strokeOpacity="0.6" strokeWidth="4" />
      <polygon points="150,70 220,110 220,210 150,250 80,210 80,110" fill="none" stroke={col} strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="150" cy="160" r="62" fill="#07141a" stroke={col} strokeWidth="3" />
      <g className="eyes" filter={`url(#${gid}-glow)`}>
        <circle cx="150" cy="160" r="30" fill={col} opacity="0.85" />
        <circle cx="150" cy="160" r="12" fill="#04080a" />
        <circle cx="160" cy="150" r="5" fill="#fff" opacity="0.8" />
      </g>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1={150 + 70 * Math.cos((a * Math.PI) / 180)} y1={160 + 70 * Math.sin((a * Math.PI) / 180)} x2={150 + 84 * Math.cos((a * Math.PI) / 180)} y2={160 + 84 * Math.sin((a * Math.PI) / 180)} stroke={col} strokeWidth="3" opacity="0.7" />
      ))}
      <path d="M90 330 L210 330" stroke={col} strokeOpacity="0.4" strokeWidth="3" />
    </>
  ),
  nadia: (col, gid) => (
    <>
      {shoulders('#0d0c1e')}
      {/* overalls straps */}
      <path d="M116 252 L124 360 M184 252 L176 360" stroke="#1d1a36" strokeWidth="14" />
      {neck}
      {head(50, 62)}
      {/* short hair under the helmet */}
      <path d="M100 160 C 98 128 104 112 112 104 L188 104 C 196 112 202 128 200 160 C 196 136 190 122 150 120 C 112 122 104 136 100 160 Z" fill="#07060f" />
      {/* hard hat */}
      <path d="M88 112 C 90 62 120 46 150 46 C 182 46 210 62 212 112 Z" fill="#141230" stroke={col} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="80" y="108" width="140" height="12" rx="6" fill="#141230" stroke={col} strokeOpacity="0.4" strokeWidth="2" />
      <path d="M150 48 L150 108" stroke={col} strokeOpacity="0.35" strokeWidth="4" />
      {rim(gid)}
      {eyes(col, gid)}
      {/* headlamp */}
      <g filter={`url(#${gid}-glow)`}>
        <circle cx="150" cy="86" r="11" fill={col} />
        <path d="M150 86 L 70 30 L 40 70 Z" fill={col} opacity="0.12" />
      </g>
    </>
  ),
  iris: (col, gid) => (
    <>
      {shoulders()}
      {/* raised coat collar */}
      <path d="M92 360 L104 250 L128 226 L132 262 L118 360 Z M208 360 L196 250 L172 226 L168 262 L182 360 Z" fill="#100e22" stroke={col} strokeOpacity="0.35" strokeWidth="2" />
      {neck}
      {head(50, 62)}
      {/* bob haircut */}
      <path d="M96 168 C 88 96 128 74 154 76 C 196 78 214 112 206 172 L196 176 C 198 130 184 104 150 102 C 118 102 106 128 106 172 Z" fill="#07060f" />
      {rim(gid)}
      {/* visor */}
      <g filter={`url(#${gid}-glow)`} className="eyes">
        <rect x="112" y="138" width="78" height="16" rx="8" fill={col} opacity="0.85" />
      </g>
    </>
  ),
  teo: (col, gid) => (
    <>
      {/* hood behind */}
      <path d="M70 360 C 60 250 84 200 150 196 C 216 200 240 250 230 360 Z" fill="#110d22" />
      {shoulders('#0f0c20')}
      {neck}
      {head(50, 62)}
      {/* messy hair */}
      <path d="M100 140 C 92 92 124 72 152 74 C 186 74 210 96 204 142 L196 128 L190 140 L182 118 L172 132 L162 112 L150 128 L140 110 L130 130 L118 114 L112 138 Z" fill="#07060f" />
      {rim(gid)}
      {eyes(col, gid)}
      {/* headphones */}
      <g filter={`url(#${gid}-glow)`}>
        <path d="M96 156 C 92 92 208 92 204 156" fill="none" stroke={col} strokeWidth="6" />
        <rect x="84" y="140" width="22" height="44" rx="9" fill={col} />
        <rect x="194" y="140" width="22" height="44" rx="9" fill={col} />
      </g>
    </>
  ),
  rosa: (col, gid) => (
    <>
      {shoulders()}
      {/* work jacket with reflective trim */}
      <path d="M118 250 L104 360 M182 250 L196 360" stroke={col} strokeWidth="7" opacity="0.75" filter={`url(#${gid}-glow)`} />
      <path d="M70 318 L230 318" stroke={col} strokeWidth="6" opacity="0.6" />
      {neck}
      {head(48, 62)}
      {/* bun */}
      <circle cx="150" cy="80" r="24" fill="#07060f" />
      <path d="M100 156 C 94 104 122 88 150 88 C 180 88 206 104 200 156 C 196 118 180 106 150 106 C 122 106 106 118 100 156 Z" fill="#07060f" />
      {rim(gid)}
      {eyes(col, gid, 150)}
    </>
  ),
  contador: (col, gid) => (
    <>
      {shoulders('#0a0918')}
      {/* lapels and tie */}
      <path d="M120 246 L150 300 L180 246 L196 252 L150 360 L104 252 Z" fill="#14112a" stroke={col} strokeOpacity="0.4" strokeWidth="2" />
      <path d="M144 252 L156 252 L160 330 L150 344 L140 330 Z" fill={col} opacity="0.75" />
      {neck}
      {head(48, 64)}
      {/* slicked hair */}
      <path d="M100 136 C 100 96 126 80 152 80 C 184 80 204 98 202 136 C 188 112 168 104 150 104 C 130 104 112 114 100 136 Z" fill="#07060f" />
      {rim(gid)}
      {/* round glasses */}
      <g filter={`url(#${gid}-glow)`} className="eyes">
        <circle cx="132" cy="148" r="14" fill="none" stroke={col} strokeWidth="3.5" />
        <circle cx="168" cy="148" r="14" fill="none" stroke={col} strokeWidth="3.5" />
        <line x1="146" y1="148" x2="154" y2="148" stroke={col} strokeWidth="3" />
      </g>
    </>
  ),
  baron: (col, gid) => (
    <>
      {shoulders('#0b0a16')}
      <path d="M120 246 L150 290 L180 246 L200 254 L150 360 L100 254 Z" fill="#191530" />
      {/* bow tie */}
      <path d="M130 252 L150 262 L170 252 L170 274 L150 264 L130 274 Z" fill={col} opacity="0.85" />
      {neck}
      {head(52, 62)}
      {/* top hat with neon band */}
      <path d="M86 108 L214 108 L206 96 L194 96 L188 20 L112 20 L106 96 L94 96 Z" fill="#07060f" />
      <rect x="108" y="78" width="84" height="12" fill={col} filter={`url(#${gid}-glow)`} />
      {rim(gid)}
      {/* monocle + one eye */}
      <g filter={`url(#${gid}-glow)`} className="eyes">
        <circle cx="168" cy="148" r="15" fill="none" stroke={col} strokeWidth="3.5" />
        <line x1="126" y1="148" x2="140" y2="148" stroke={col} strokeWidth="3" strokeLinecap="round" />
        <path d="M183 152 C 196 180 200 210 196 240" fill="none" stroke={col} strokeWidth="1.5" />
      </g>
      {/* moustache */}
      <path d="M128 182 C 140 174 148 178 150 182 C 152 178 160 174 172 182 C 160 186 154 186 150 184 C 146 186 140 186 128 182 Z" fill="#07060f" />
    </>
  ),
  vera: (col, gid) => (
    <>
      {/* long hair behind */}
      <path d="M92 150 C 84 96 120 76 150 76 C 182 76 216 96 208 150 L 222 290 L 78 290 Z" fill="#07060f" />
      {shoulders('#0d0b1c')}
      {/* dealer vest */}
      <path d="M112 250 L150 330 L188 250 L204 256 L176 360 L124 360 L96 256 Z" fill="#12102a" stroke={col} strokeOpacity="0.45" strokeWidth="2" />
      <path d="M136 252 L150 260 L164 252 L164 266 L150 262 L136 266 Z" fill={col} opacity="0.8" />
      {neck}
      {head(46, 60)}
      <path d="M104 150 C 100 108 124 92 150 92 C 178 92 200 108 196 150 C 188 120 172 108 150 108 C 128 108 112 120 104 150 Z" fill="#07060f" />
      {rim(gid)}
      {eyes(col, gid, 150)}
      {/* earrings */}
      <g filter={`url(#${gid}-glow)`}>
        <circle cx="100" cy="182" r="5" fill={col} />
        <circle cx="200" cy="182" r="5" fill={col} />
      </g>
    </>
  ),
};
