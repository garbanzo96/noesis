import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 14.1 · «El vestíbulo» — repaso de exponenciales y logaritmos (Mundo 1)
// Credencial: C(t) = 100·2^(−t/8). En 24 h queda 12,5 %; t = 8·log₂(100/12,5) = 24.
// La puerta del piso 40 deja de abrir bajo 6,25 %: a las 32 h. Quedan 8 h.
// ============================================================================

const HALF = 8;
const charge = (t: number, half = HALF) => 100 * 2 ** (-t / half);
const PLOT = { x0: 200, x1: 960, y0: 640, y1: 220 }; // t ∈ [0, 32], C ∈ [0, 100]
const px = (t: number) => PLOT.x0 + (t / 32) * (PLOT.x1 - PLOT.x0);
const py = (c: number) => PLOT.y0 + (c / 100) * (PLOT.y1 - PLOT.y0);

/** the charge curve, halving steps and a marker at t */
function ChargePlot({ t, steps = 0, floor }: { t: number; steps?: number; floor?: number }) {
  const path = Array.from({ length: 65 }, (_, i) => {
    const s = (i / 64) * 32;
    return `${i ? 'L' : 'M'}${px(s).toFixed(1)},${py(charge(s)).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y0} y2={PLOT.y0} stroke={C.line} strokeWidth={2} />
      <line x1={PLOT.x0} x2={PLOT.x0} y1={PLOT.y0} y2={PLOT.y1} stroke={C.line} strokeWidth={2} />
      {[0, 8, 16, 24, 32].map((v) => (
        <Cap key={v} x={px(v)} y={PLOT.y0 + 28} size={17} color={C.muted}>
          {`${v} h`}
        </Cap>
      ))}
      {[0, 50, 100].map((v) => (
        <Cap key={v} x={PLOT.x0 - 36} y={py(v)} size={17} color={C.muted}>
          {`${v} %`}
        </Cap>
      ))}
      {Array.from({ length: steps }, (_, k) => {
        const s = (k + 1) * HALF;
        return (
          <g key={s}>
            <line
              x1={px(s)}
              x2={px(s)}
              y1={PLOT.y0}
              y2={py(charge(s))}
              stroke={C.cyan}
              strokeWidth={2}
              strokeDasharray="6 6"
            />
            <circle cx={px(s)} cy={py(charge(s))} r={7} fill={C.cyan} />
            <Cap x={px(s) + 34} y={py(charge(s)) - 24} size={17} color={C.cyan}>
              {`${fmt(charge(s), charge(s) % 1 ? 2 : 0)} %`}
            </Cap>
          </g>
        );
      })}
      {floor !== undefined && (
        <g>
          <line
            x1={PLOT.x0}
            x2={PLOT.x1}
            y1={py(floor)}
            y2={py(floor)}
            stroke={C.magenta}
            strokeWidth={2}
            strokeDasharray="10 6"
          />
          <Cap x={PLOT.x0 + 120} y={py(floor) - 22} size={17} color={C.magenta}>
            {`puerta: ${fmt(floor, 2)} %`}
          </Cap>
        </g>
      )}
      <path d={path} fill="none" stroke={C.amber} strokeWidth={4} />
      <circle cx={px(t)} cy={py(charge(t))} r={10} fill={C.amber} />
      <Cap x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y0 + 66} size={19} color={C.muted}>
        horas desde la carga
      </Cap>
    </g>
  );
}

function BadgeLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(6);
  const { beat } = beats;
  const tt = beat === 0 ? 0 : beat === 1 ? t : beat === 3 ? 16 : 24;
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * 32, 0, 32) * 2) / 2;
    setT(v);
    if (v === 24) unlock();
  });
  return (
    <Stage ref={svg}>
      <ChargePlot t={tt} steps={beat === 0 ? 3 : beat === 1 ? 0 : 3} />
      {beat === 1 && (
        <Knob x={px(t)} y={py(charge(t))} onPointerDown={drag} axis="x" color={C.amber} />
      )}
      <Cap size={26} x={1280} y={210} tex="C(t)=100\cdot2^{-t/8}" color={C.amber} />
      {beat >= 1 && (
        <Cap
          size={26}
          x={1280}
          y={300}
          tex={`C(${tnum(tt, 1).replace('{,}0', '')})=${tnum(charge(tt), 2)}\\,\\%`}
          color={C.text}
        />
      )}
      {beat === 2 && (
        <Cap
          size={26}
          x={1280}
          y={400}
          tex="t=8\log_2\tfrac{100}{12{,}5}=8\cdot3=24"
          color={C.green}
        />
      )}
      {beat === 3 && answer !== null && (
        <Cap size={26} x={1280} y={400} tex="t=8\log_2 4=16" color={C.green} />
      )}
      {beat === 4 && (
        <Cap size={26} x={1280} y={400} tex="t=T\log_2\tfrac{C_0}{C}" color={C.cyan} />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: la mitad cada tanto',
  Scene: BadgeLesson,
  beats: [
    {
      say: 'La credencial del Contador pierde la mitad de su carga cada 8 horas: 100, 50, 25, 12,5. Cada tramo igual de tiempo divide por 2.',
      board: { label: 'Descarga', tex: '\\p{1}{C(t)}=\\p{2}{C_0\\,2^{-t/8}}' },
    },
    {
      say: 'El lector de la puerta marcó 12,5 %. Busca en la curva cuántas horas pasaron.',
      gate: 'Arrastra el punto hasta que la carga marque 12,5 %.',
      board: {
        label: 'Leer la curva',
        tex: '\\p{1}{2^{-t/8}}=\\p{2}{\\tfrac{12{,}5}{100}=\\tfrac18}',
      },
    },
    {
      say: 'El logaritmo en base 2 cuenta cuántas mitades caben: de 100 a 12,5 hay tres. Tres mitades de 8 horas son 24 horas.',
      board: {
        label: 'Despejar el tiempo',
        tex: '\\p{1}{t}=\\p{2}{8\\log_2\\tfrac{100}{12{,}5}}=\\p{3}{8\\cdot3=24}',
      },
    },
    {
      say: 'Otra lectura: la credencial del guardia de turno marca 25 %.',
      ask: {
        prompt: '¿Hace cuántas horas se cargó?',
        options: ['16 horas', '8 horas', '25 horas'],
        answer: 0,
        explain: '100 → 50 → 25: dos mitades, 2·8 = 16 horas.',
      },
      board: { label: 'Con 25 %', tex: '\\p{1}{t}=\\p{2}{8\\log_2 4=16}' },
    },
    {
      say: 'La regla sirve para cualquier semivida T: el exponente dice cuántas mitades pasaron y el logaritmo lo recupera.',
      board: {
        label: 'Regla',
        tex: '\\p{1}{C=C_0\\,2^{-t/T}}\\p{2}{\\ \\Leftrightarrow\\ t=T\\log_2\\tfrac{C_0}{C}}',
      },
    },
  ],
};

function DoorDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <ChargePlot
        t={beat === 0 ? 24 : 32}
        steps={beat === 0 ? 3 : 4}
        floor={beat === 1 ? 6.25 : undefined}
      />
      {answer !== null && (
        <Cap
          size={26}
          x={1280}
          y={260}
          tex={beat === 0 ? 't=8\\log_2 8=24' : 't=8\\log_2 16=32'}
          color={beat === 0 ? C.amber : C.magenta}
        />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1280} y={350} size={22} color={C.green}>
          32 − 24 = 8 horas de margen
        </Cap>
      )}
    </Stage>
  );
}

function BadgePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 211 + round);
    const half = pick(r, [4, 6, 8, 12]);
    const k = pick(r, [1, 2, 3, 4]);
    const c = pick(r, [20, 30, 40, 60, 70]);
    return { half, k, c, left: 100 / 2 ** k, hours: k * half, t: half * Math.log2(100 / c) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `Una credencial cargada al 100 % pierde la mitad cada ${d.half} horas.`;
    api.prompt(
      [
        `${base} ¿Qué carga tiene después de ${d.hours} horas? En %.`,
        `${base} El lector marca ${fmt(d.left, 2)} %. ¿Cuántas horas pasaron?`,
        `${base} ¿Cuántas horas tarda en bajar a ${d.c} %? Un decimal.`,
      ][round],
      ['C=100\\cdot2^{-t/T}', 't=T\\log_2\\tfrac{100}{C}', 't=T\\log_2\\tfrac{100}{C}'][round],
    );
    api.hints(
      [
        ['Cuenta cuántas semividas caben en el tiempo.', 'Divide 100 por 2 esa cantidad de veces.'],
        ['¿Cuántas veces dividiste 100 por 2 para llegar ahí?', 'Multiplica por la semivida.'],
        ['Calcula 100 dividido por la carga final.', 'Su logaritmo en base 2 por la semivida.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.left) < 0.01)
        return api.result(true, `$100\\cdot2^{-${d.k}}=${tnum(d.left, 2)}$.`);
      if (
        Math.abs(v - (100 - (100 * d.k) / 2 ** d.k)) < 0.01 ||
        Math.abs(v - 100 / (2 * d.k)) < 0.01
      )
        return api.result(
          false,
          'Cada semivida divide por 2 lo que queda, no lo que había al inicio.',
        );
      return api.result(false, `Pasaron ${d.k} semividas: divide 100 por 2 esa cantidad de veces.`);
    }
    if (round === 1) {
      if (Math.abs(v - d.hours) < 0.01)
        return api.result(true, `$${d.half}\\log_2 ${2 ** d.k}=${d.hours}$ horas.`);
      if (Math.abs(v - d.k) < 0.01)
        return api.result(false, 'Eso son semividas. Multiplica por las horas de cada una.');
      return api.result(
        false,
        `De 100 a ${fmt(d.left, 2)} hay ${d.k === 1 ? 'una mitad' : `${d.k} mitades`}.`,
      );
    }
    if (Math.abs(v - d.t) < 0.06)
      return api.result(
        true,
        `$${d.half}\\log_2\\tfrac{100}{${d.c}}\\approx${tnum(d.t, 1)}$ horas.`,
      );
    if (Math.abs(v - Math.log2(100 / d.c)) < 0.06)
      return api.result(false, 'Ese es el número de mitades. Falta multiplicar por la semivida.');
    return api.result(false, `t = ${d.half}·log₂(100/${d.c}).`);
  };
  return (
    <Stage>
      <Cap x={540} y={340} size={24} color={C.text}>
        {`Semivida: ${d.half} h`}
      </Cap>
      <Cap x={540} y={400} tex={`C(t)=100\\cdot2^{-t/${d.half}}`} color={C.amber} />
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 0 ? 'C =' : 't ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c1',
  world: 'active',
  code: '14.1',
  title: 'El vestíbulo',
  subtitle: 'Repaso: exponenciales y logaritmos',
  glyph: '2^{-t/T}',
  kind: 'level',
  guide: 'iris',
  teaser:
    'La credencial robada del Contador abre el piso 40, pero se descarga a la mitad cada 8 horas. La agencia necesita saber cuánto margen le queda.',
  learn:
    'Leer una descarga exponencial con semivida y despejar el tiempo con un logaritmo en base 2.',
  glyphs: ['tor-half'],
  pitfalls: [
    'Cada semivida divide por 2 lo que queda, no resta una cantidad fija.',
    'El logaritmo da el número de mitades; las horas se obtienen multiplicando por la semivida.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Torre Halcón, una y diez de la madrugada. El vestíbulo estaba a oscuras; solo brillaba el lector de credenciales junto a los ascensores.',
        },
        {
          who: 'iris',
          text: 'La cuenta que apostaba con ventaja está registrada en el piso 40. Subimos esta noche.',
        },
        {
          who: 'teo',
          text: 'El guardia nos pasó la credencial que el Contador olvidó en el casino. Abre todas las puertas, pero la batería se está agotando.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El registro de la puerta',
      Scene: DoorDemo,
      beats: [
        {
          say: 'El lector del vestíbulo marca 12,5 % de carga. La credencial pierde la mitad cada 8 horas.',
          ask: {
            prompt: '¿Hace cuántas horas se cargó por última vez?',
            options: ['24 horas', '12,5 horas', '8 horas'],
            answer: 0,
            explain:
              '100 → 50 → 25 → 12,5: tres mitades de 8 horas, 24 horas. Se cargó anoche a la misma hora.',
          },
          note: { label: 'Última carga', tex: 't=8\\log_2 8=24' },
        },
        {
          say: 'La puerta del piso 40 rechaza credenciales bajo 6,25 %.',
          ask: {
            prompt: '¿Cuántas horas de margen le quedan a la agencia?',
            options: ['8 horas', '6,25 horas', '32 horas'],
            answer: 0,
            explain:
              '6,25 es 100 dividido 4 veces por 2: a las 32 horas deja de abrir. Ya pasaron 24, quedan 8.',
          },
          note: {
            label: 'Margen',
            tex: '32-24=8',
            body: 'La credencial deja de abrir el piso 40 a las 09:10.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Leer credenciales', Comp: BadgePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'El lector se puso verde, y las puertas del ascensor de vidrio se abrieron solas.',
        },
        { who: 'iris', text: 'Ocho horas. Antes del amanecer tenemos que estar arriba.' },
        {
          who: 'teo',
          text: 'El ascensor tiene su propia bitácora. Si la leemos bien, sabremos a qué hora subió él.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-half',
    world: 'active',
    tex: 't=T\\log_2\\frac{C_0}{C}',
    name: 'Tiempo desde la semivida',
    read: 't igual a T por logaritmo en base 2 de C cero sobre C',
    meaning:
      'Cuántas horas pasaron para que una cantidad que se reduce a la mitad cada T llegue de C₀ a C.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Descarga con semivida', tex: 'C(t)=C_0\\,2^{-t/T}' },
    { label: 'Tiempo', tex: 't=T\\log_2\\frac{C_0}{C}' },
  ],
  props: [
    {
      label: 'Mitades',
      tex: '\\log_2\\frac{C_0}{C}',
      body: 'Cuenta cuántas veces se dividió por 2.',
    },
    { label: 'Ejemplo', tex: '8\\log_2\\tfrac{100}{12{,}5}=24' },
  ],
};

export { lesson };
