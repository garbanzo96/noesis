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

// 14.2 · h(t) = 120t² − 40t³, 0 ≤ t ≤ 2 minutos.
// h′(1) = 120 m/min; h″ cambia de positivo a negativo en 1; h(2) = 160 m.
const height = (t: number, a = 120, b = 40) => a * t ** 2 - b * t ** 3;
const speed = (t: number, a = 120, b = 40) => 2 * a * t - 3 * b * t ** 2;
const X = (t: number) => 220 + 350 * t;
const Y = (h: number) => 650 - (h / 180) * 420;

/** Curva de altura. La tangente es local y nunca lleva una etiqueta encima. */
function LiftPlot({ t, tangent = false }: { t?: number; tangent?: boolean }) {
  const path = Array.from({ length: 81 }, (_, i) => {
    const u = i / 40;
    return `${i ? 'L' : 'M'}${X(u)},${Y(height(u))}`;
  }).join(' ');
  const left = t === undefined ? 0 : Math.max(0, t - 0.3);
  const right = t === undefined ? 0 : Math.min(2, t + 0.3);
  return (
    <g>
      <Cap x={570} y={160} size={24}>
        Ascensor de vidrio · altura
      </Cap>
      <line x1={220} x2={950} y1={650} y2={650} stroke={C.line} strokeWidth={2} />
      <line x1={220} x2={220} y1={650} y2={210} stroke={C.line} strokeWidth={2} />
      {[0, 60, 120, 180].map((h) => (
        <g key={h}>
          <line x1={220} x2={920} y1={Y(h)} y2={Y(h)} stroke={C.line} strokeDasharray="4 8" />
          <Cap x={175} y={Y(h)} size={17} color={C.muted}>
            {h}
          </Cap>
        </g>
      ))}
      {[0, 0.5, 1, 1.5, 2].map((u) => (
        <Cap key={u} x={X(u)} y={695} size={18} color={C.muted}>
          {fmt(u, 1)}
        </Cap>
      ))}
      <Cap x={175} y={190} size={18} color={C.muted}>
        m
      </Cap>
      <Cap x={570} y={755} size={19} color={C.muted}>
        Tiempo desde la partida · minutos
      </Cap>
      <path d={path} fill="none" stroke={C.amber} strokeWidth={4} />
      {t !== undefined && (
        <>
          {tangent && (
            <line
              x1={X(left)}
              x2={X(right)}
              y1={Y(height(t) + speed(t) * (left - t))}
              y2={Y(height(t) + speed(t) * (right - t))}
              stroke={C.cyan}
              strokeWidth={5}
            />
          )}
          <circle cx={X(t)} cy={Y(height(t))} r={9} fill={C.cyan} />
        </>
      )}
    </g>
  );
}

function LiftLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0.25);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 1) return;
    const next = Math.round(clamp((x - 220) / 350, 0, 2) * 20) / 20;
    setT(next);
    if (next === 1) unlock();
  });
  const shown = beat === 1 ? t : beat === 0 ? 0.5 : beat === 2 ? 1 : 2;
  return (
    <Stage ref={svg}>
      <LiftPlot t={beat === 3 && answer === null ? undefined : shown} tangent />
      <Cap x={1250} y={190} tex="h(t)=120t^2-40t^3" color={C.amber} />
      <Cap x={1250} y={280} tex="h'(t)=240t-120t^2" color={C.cyan} />
      {beat === 1 && (
        <>
          <Cap x={1250} y={370}>
            t = {fmt(t, 2)} min
          </Cap>
          <Cap x={1250} y={460} color={C.cyan}>
            Velocidad: {fmt(speed(t), 2)} m/min
          </Cap>
          <line x1={220} x2={920} y1={815} y2={815} stroke={C.line} strokeWidth={3} />
          <Knob x={X(t)} y={815} axis="x" onPointerDown={drag} color={C.cyan} />
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={370} tex="h''(t)=240-240t" />
          <Cap x={1250} y={460} tex="h''(t)=0\Rightarrow t=1" color={C.green} />
          <Cap x={1250} y={550} size={20}>
            La velocidad aumenta y luego baja.
          </Cap>
        </>
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1250} y={370} tex="h'(2)=480-480=0" color={C.green} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={370} tex="h'(0)=h'(2)=0" />
          <Cap x={1250} y={460} tex="h'(1)=120\ \mathrm{m/min}" color={C.green} />
          <Cap x={1250} y={550} size={20}>
            Compara el punto crítico y los extremos.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: la pendiente de la subida',
  Scene: LiftLesson,
  beats: [
    {
      say: 'La curva muestra la altura del ascensor. La pendiente de su tangente es la **derivada**: aquí mide la velocidad en metros por minuto.',
      board: { label: 'Altura y velocidad', tex: "h(t)=120t^2-40t^3,\\quad h'(t)=240t-120t^2" },
    },
    {
      say: 'Mueve el tiempo y mira cómo cambia la inclinación de la tangente. Busca el punto donde la velocidad llega a 120 m/min.',
      gate: 'Arrastra la perilla de tiempo hasta llegar a 120 m/min.',
      board: { label: 'Tangente móvil', tex: "v(t)=h'(t)" },
    },
    {
      say: 'Para maximizar la velocidad, deriva la velocidad: eso da h″. Se anula en t = 1; antes es positiva y después negativa, así que la velocidad alcanza un máximo.',
      board: { label: 'Máximo de velocidad', tex: "h''(t)=240-240t=0\\Rightarrow t=1" },
    },
    {
      say: 'El recorrido termina al minuto 2. Calcula la velocidad con la derivada de la altura.',
      ask: {
        prompt: '¿Qué velocidad tiene al minuto 2?',
        options: ['160 m/min', '0 m/min', '120 m/min'],
        answer: 1,
        explain:
          'h′(2) = 240·2 − 120·4 = 0 m/min. Los 160 m son la altura alcanzada, no una velocidad.',
      },
      board: { label: 'Velocidad al llegar', tex: "v(2)=h'(2)" },
    },
    {
      say: 'En un intervalo cerrado, compara el punto crítico con los extremos. La velocidad vale 0 al partir y al llegar, y 120 m/min al minuto 1.',
      board: {
        label: 'Comparación completa',
        tex: '\\p{1}{v(0)}=\\p{2}{0},\\quad\\p{3}{ v(1)}=\\p{4}{120},\\quad\\p{5}{ v(2)}=\\p{6}{0}',
      },
    },
  ],
};

function LiftDemo({ beats, answer }: DemoProps) {
  const first = beats.beat === 0;
  return (
    <Stage>
      <LiftPlot
        t={answer !== null ? (first ? 1 : 2) : undefined}
        tangent={first && answer !== null}
      />
      <Cap x={1250} y={190} tex="h(t)=120t^2-40t^3" color={C.amber} />
      <Cap x={1250} y={280} tex="0\le t\le2\ \mathrm{min}" />
      {answer !== null &&
        (first ? (
          <>
            <Cap x={1250} y={370} tex="h''(t)=0\Rightarrow t=1" color={C.cyan} />
            <Cap x={1250} y={460} tex="h'(1)=120\ \mathrm{m/min}" color={C.green} />
          </>
        ) : (
          <>
            <Cap x={1250} y={370} tex="h(2)=480-320=160\ \mathrm{m}" color={C.green} />
            <Cap x={1250} y={460} tex="h'(2)=0\ \mathrm{m/min}" color={C.cyan} />
          </>
        ))}
    </Stage>
  );
}

/** Esquema del sistema: en práctica muestra solo datos, nunca una altura o velocidad calculada. */
function LiftSchematic() {
  return (
    <g>
      <rect
        x={330}
        y={190}
        width={430}
        height={490}
        rx={16}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      {[380, 710].map((x) => (
        <line key={x} x1={x} x2={x} y1={210} y2={660} stroke={C.muted} strokeWidth={2} />
      ))}
      <rect
        x={430}
        y={355}
        width={230}
        height={180}
        rx={8}
        fill={C.bg}
        stroke={C.cyan}
        strokeWidth={4}
      />
      <line x1={545} x2={545} y1={355} y2={535} stroke={C.cyan} strokeWidth={2} />
      <line x1={545} x2={545} y1={235} y2={305} stroke={C.amber} strokeWidth={4} />
      <path d="M530 250 L545 235 L560 250" fill="none" stroke={C.amber} strokeWidth={4} />
      <Cap x={545} y={740} size={21}>
        Bitácora de prueba · altura en metros
      </Cap>
    </g>
  );
}

function LiftPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 223 + round);
    const peak = pick(r, [0.5, 1, 1.5, 2]);
    const b = pick(r, [10, 20, 30, 40]);
    const a = 3 * b * peak;
    const t = peak * pick(r, [0.5, 1.5]);
    return { a, b, peak, t, end: 2 * peak };
  }, [seed, round]);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    const base = `Un recorrido de prueba sigue h(t) = ${d.a}t² − ${d.b}t³ metros, entre 0 y ${fmt(d.end, 1)} minutos.`;
    api.prompt(
      [
        `${base} ¿Qué velocidad tiene en t = ${fmt(d.t, 2)} min? En m/min; hasta dos decimales.`,
        `${base} ¿En qué minuto alcanza su velocidad máxima? Hasta dos decimales.`,
        `${base} ¿Cuál es la velocidad máxima? En m/min; hasta dos decimales.`,
      ][round],
      round === 0 ? "v(t)=h'(t)" : "v'(t)=h''(t)",
    );
    api.hints(
      round === 0
        ? [
            'Deriva cada término: el exponente baja a multiplicar y luego disminuye en uno.',
            'Evalúa 2a·t − 3b·t² en el tiempo indicado; la altura h(t) no es la velocidad.',
          ]
        : [
            'La velocidad es 2a·t − 3b·t². Su derivada es 2a − 6b·t.',
            round === 1
              ? 'Iguala 2a − 6b·t a cero y verifica que la velocidad aumenta antes y baja después.'
              : 'Resuelve el tiempo crítico y evalúa la velocidad allí; compárala con los extremos.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const target =
      round === 0 ? speed(d.t, d.a, d.b) : round === 1 ? d.peak : speed(d.peak, d.a, d.b);
    const near = (v: number) => Math.abs(n - v) <= 0.0051;
    if (near(target))
      return api.result(
        true,
        round === 0
          ? `$v(${tnum(d.t, 2)})=${2 * d.a}\\cdot${tnum(d.t, 2)}-${3 * d.b}\\cdot${tnum(d.t, 2)}^2=${tnum(target, 2)}$ m/min.`
          : round === 1
            ? `$h''(t)=${2 * d.a}-${6 * d.b}t=0\\Rightarrow t=${tnum(d.peak, 2)}$ min. La velocidad aumenta antes y baja después.`
            : `$t_*=${tnum(d.peak, 2)}$ min; $v(t_*)=${tnum(target, 2)}$ m/min. En ambos extremos vale 0.`,
      );
    if (round === 0) {
      if (near(height(d.t, d.a, d.b)))
        return api.result(
          false,
          'Calculaste altura en metros. Deriva primero para obtener velocidad en m/min.',
        );
      if (near(2 * d.a * d.t - 3 * d.b * d.t))
        return api.result(
          false,
          'Al derivar t³ queda 3t². Revisa el cuadrado del segundo término.',
        );
      if (near(d.a * d.t - d.b * d.t ** 2))
        return api.result(
          false,
          'Faltan los factores 2 y 3 que bajan de los exponentes al derivar.',
        );
    } else {
      if (round === 1 && near(d.end))
        return api.result(
          false,
          'Ese es el final del recorrido: ahí la velocidad es cero. Busca dónde se anula la derivada de la velocidad.',
        );
      if (round === 1 && near(speed(d.peak, d.a, d.b)))
        return api.result(
          false,
          'Diste una velocidad en m/min. Esta ronda pide el tiempo del máximo en minutos.',
        );
      if (round === 2 && near(d.peak))
        return api.result(
          false,
          'Encontraste el tiempo del máximo. Ahora reemplázalo en h′ para obtener la velocidad.',
        );
      if (round === 2 && near(height(d.peak, d.a, d.b)))
        return api.result(
          false,
          'Evaluaste h y obtuviste altura. Para la velocidad máxima evalúa h′ en el tiempo crítico.',
        );
      if (near(0))
        return api.result(
          false,
          'h″ = 0 identifica el tiempo crítico; no dice que la velocidad máxima sea cero.',
        );
    }
    return api.result(
      false,
      round === 0
        ? 'Usa h′(t) = 2a·t − 3b·t² y reemplaza el tiempo indicado.'
        : 'Deriva h′, resuelve h″ = 0 y verifica el máximo. Si se pide velocidad, evalúa h′ en ese tiempo.',
    );
  };
  return (
    <Stage>
      <LiftSchematic />
      <Cap x={1250} y={190} tex={`h(t)=${d.a}t^2-${d.b}t^3`} color={C.amber} />
      <Cap x={1250} y={280} tex={`0\\le t\\le ${tnum(d.end, 1)}\\ \\mathrm{min}`} />
      <Cap x={1250} y={370} size={20}>
        {round === 0 ? `Lectura: t = ${fmt(d.t, 2)} min` : 'Busca el máximo de velocidad.'}
      </Cap>
      <NumberField
        x={1060}
        y={490}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label={round === 1 ? 't =' : 'v ='}
        unit={round === 1 ? 'min' : 'm/min'}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c2',
  world: 'active',
  code: '14.2',
  title: 'El ascensor',
  subtitle: 'Repaso: derivada y optimización',
  glyph: "h'(t)",
  kind: 'level',
  guide: 'iris',
  teaser:
    'El ascensor de vidrio guarda una curva de subida. Iris necesita comprobar cómo llega al piso alto.',
  learn: 'Leer la velocidad como derivada de la altura y encontrar su máximo en un intervalo.',
  glyphs: ['tor-lift-derivative', 'tor-lift-maximum'],
  pitfalls: [
    'h mide altura en metros; h′ mide velocidad en metros por minuto.',
    'Para maximizar h′, resuelve h″ = 0 y verifica el cambio de signo.',
    'El tiempo del máximo y la velocidad máxima tienen unidades distintas; compara también los extremos.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La cabina de vidrio vibró al cerrar las puertas. Abajo, el marco metálico partía en dos las luces de la bahía.',
        },
        {
          who: 'teo',
          text: 'El controlador guarda la altura minuto a minuto, y el recorrido dura dos minutos. Puedo revisar la subida antes de que nos encierre arriba.',
        },
        { who: 'iris', text: 'Revisa el frenado, por favor.' },
        { who: 'tu', text: 'La curva se aplana al final. Voy a comprobar la velocidad.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La bitácora del ascensor',
      Scene: LiftDemo,
      beats: [
        {
          say: 'El registro de la torre sigue h(t) = 120t² − 40t³ durante dos minutos. Comprueba la mayor velocidad de la subida.',
          ask: {
            prompt: '¿Cuál es la velocidad máxima?',
            options: ['160 m/min', '120 m/min', '1 m/min'],
            answer: 1,
            explain:
              'h″ = 240 − 240t se anula en t = 1 y cambia de positivo a negativo. h′(1) = 120 m/min; en los extremos vale 0.',
          },
          note: {
            label: 'Velocidad máxima',
            tex: "h'(t)=240t-120t^2,\\quad h'(1)=120",
            body: 'Máximo al minuto 1: 120 m/min.',
          },
        },
        {
          say: 'El controlador corta la subida al minuto 2. Calcula a qué altura queda la cabina.',
          ask: {
            prompt: '¿Qué altura alcanza al terminar?',
            options: ['120 m', '0 m', '160 m'],
            answer: 2,
            explain:
              'h(2) = 120·4 − 40·8 = 160 m. La velocidad final es cero, pero la cabina queda arriba.',
          },
          note: {
            label: 'Llegada',
            tex: "h(2)=160\\ \\mathrm{m},\\quad h'(2)=0",
            body: 'A los dos minutos, la cabina se detiene a 160 m de altura.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Comprobar recorridos de prueba', Comp: LiftPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La cabina se detuvo sin un golpe, a 160 metros. Iris soltó el pasamanos cuando las puertas empezaron a abrirse.',
        },
        {
          who: 'teo',
          text: 'El frenado calza con el registro. Pero la ventilación sigue al máximo, aunque este piso figura vacío.',
        },
        { who: 'iris', text: 'Un piso vacío no necesita tanto aire. ¿Qué hay al fondo?' },
        {
          who: 'nar',
          text: 'Por la abertura entraba aire caliente. Al fondo del pasillo, una hilera de servidores teñía el vidrio de rojo.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-lift-derivative',
    world: 'active',
    tex: "v(t)=h'(t)",
    name: 'Velocidad como derivada',
    read: 've de te igual a hache prima de te',
    meaning: 'La pendiente de la tangente a la altura da la velocidad instantánea.',
    warn: 'Altura y velocidad tienen unidades distintas: metros y metros por minuto.',
  },
  {
    id: 'tor-lift-maximum',
    world: 'active',
    tex: "h''(t_*)=0",
    name: 'Máximo de velocidad',
    read: 'hache segunda de te estrella igual a cero',
    meaning: 'Un punto crítico de la velocidad se busca derivando h′.',
    warn: 'Verifica que h″ cambie de positivo a negativo y compara con los extremos del intervalo.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Velocidad instantánea',
      tex: "v(t)=h'(t)",
      body: 'Si h está en metros y t en minutos, h′ está en m/min.',
    },
    {
      label: 'Cambio de velocidad',
      tex: "v'(t)=h''(t)",
      body: 'h″ positiva indica velocidad creciente; negativa indica velocidad decreciente.',
    },
  ],
  props: [
    { label: 'Derivar potencias', tex: '\\frac{d}{dt}t^n=nt^{n-1}' },
    {
      label: 'Máximo en un intervalo',
      tex: "h''(t_*)=0",
      body: 'Compara la velocidad en los puntos críticos interiores y en los extremos. El cambio de h″ de positivo a negativo confirma un máximo local.',
    },
    { label: 'Ascensor de la torre', tex: "h'(t)=240t-120t^2,\\quad h''(t)=240-240t" },
    { label: 'Lecturas del recorrido', tex: "h'(1)=120,\\quad h(2)=160,\\quad h'(2)=0" },
  ],
};

export { lesson };
