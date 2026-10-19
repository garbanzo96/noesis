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

// Función didáctica para practicar el ajuste de una cota, no la ELBO del lector.
// g(m)=-(m-3)²; subir g equivale a bajar el costo -g.
// Desde 0: η=1/4 → 1,5; 2,25; 2,625. η=1/2 → 3. η=1 → 6; 0; 6.
const update = (m: number, eta: number, center = 3) => m - 2 * eta * (m - center);
function trajectory(eta: number, start = 0, center = 3) {
  const ms = [start];
  for (let i = 0; i < 3; i++) ms.push(update(ms[i], eta, center));
  return ms;
}

const X = (m: number) => 180 + 125 * m;
const Y = (g: number) => 220 - 40 * g;
const STEP = { x0: 1090, x1: 1410, y: 640 };
const ETAS = [0.25, 0.5, 1] as const;

/** Only supplied iterates are drawn: practices pass the starting point alone. */
function Hill({
  ms,
  center = 3,
  tangent = false,
}: {
  ms: number[];
  center?: number;
  tangent?: boolean;
}) {
  const g = (m: number) => -((m - center) ** 2);
  // Keep the same vertical scale even when a practice has a different center.
  const curve = Array.from({ length: 81 }, (_, i) => {
    const m = center - 3 + (6 * i) / 80;
    return `${i ? 'L' : 'M'}${X(m - center + 3)} ${Y(g(m))}`;
  }).join(' ');
  const px = (m: number) => X(m - center + 3);
  return (
    <g>
      <Cap x={555} y={160} tex={`g(m)=-(m-${center})^2`} size={27} />
      <line x1={165} x2={945} y1={610} y2={610} stroke={C.line} strokeWidth={2} />
      <path d={curve} fill="none" stroke={C.violet} strokeWidth={5} />
      {[center - 3, center, center + 3].map((m) => (
        <g key={m}>
          <line x1={px(m)} x2={px(m)} y1={603} y2={617} stroke={C.muted} strokeWidth={2} />
          <Cap x={px(m)} y={650} size={20} color={C.muted}>
            {fmt(m, 0)}
          </Cap>
        </g>
      ))}
      <Cap x={555} y={710} size={20} color={C.muted}>
        Eje horizontal: m. Más arriba, mayor g(m).
      </Cap>
      {tangent && (
        <line
          x1={px(ms[0])}
          y1={Y(g(ms[0]))}
          x2={px(ms[0] + 1.2)}
          y2={Y(g(ms[0]) - 2 * (ms[0] - center) * 1.2)}
          stroke={C.cyan}
          strokeWidth={3}
          strokeDasharray="8 6"
        />
      )}
      {ms.slice(1).map((m, i) => (
        <line
          key={`step-${i}`}
          x1={px(ms[i])}
          y1={Y(g(ms[i]))}
          x2={px(m)}
          y2={Y(g(m))}
          stroke={C.amber}
          strokeWidth={3}
          strokeOpacity={0.65}
        />
      ))}
      {ms.map((m, i) => (
        <circle
          key={`point-${i}`}
          cx={px(m)}
          cy={Y(g(m))}
          r={i === 0 ? 10 : 7}
          fill={i === 0 ? C.cyan : C.amber}
          stroke={C.bg}
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function SlopeLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [etaIndex, setEtaIndex] = useState(0);
  const { beat } = beats;
  const eta = beat === 2 ? ETAS[etaIndex] : beat >= 3 ? 0.5 : 0.25;
  const reveal = beat !== 3 || answer !== null;
  const ms = beat === 0 || !reveal ? [0] : trajectory(eta);
  const drag = useSvgDrag(svg, (px) => {
    const i = Math.round(clamp((px - STEP.x0) / (STEP.x1 - STEP.x0), 0, 1) * 2);
    setEtaIndex(i);
    if (beat === 2 && i === 2) unlock();
  });
  return (
    <Stage ref={svg}>
      <Hill ms={ms} tangent={beat === 1} />
      <Cap x={1250} y={200} tex="m_0=0" color={C.cyan} />
      {beat === 0 && <Cap x={1250} y={290} tex="g(3)=0\ge g(m)" color={C.green} />}
      {beat >= 1 && <Cap x={1250} y={290} tex={`\\eta=${tnum(eta)}`} color={C.amber} />}
      {beat >= 1 &&
        reveal &&
        ms
          .slice(1)
          .map((m, i) => (
            <Cap
              key={i}
              x={1250}
              y={380 + i * 80}
              tex={`m_${i + 1}=${tnum(m, 3)}`}
              color={eta === 1 ? C.magenta : C.green}
            />
          ))}
      {beat === 2 && (
        <>
          <line x1={STEP.x0} x2={STEP.x1} y1={STEP.y} y2={STEP.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={STEP.x0 + (etaIndex / 2) * (STEP.x1 - STEP.x0)}
            y={STEP.y}
            axis="x"
            onPointerDown={drag}
            color={C.amber}
          />
          <Cap x={1250} y={720} size={19} color={C.muted}>
            η: 0,25 · 0,5 · 1
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Ajustar el paso',
  Scene: SlopeLesson,
  beats: [
    {
      say: 'Para ajustar q queremos subir la ELBO. Practiquemos con una función sencilla: g(m) = −(m − 3)², cuyo máximo está en 3; bajar el costo −g equivale a subir g.',
      board: {
        label: 'Objetivo de práctica',
        tex: '\\p{1}{g(m)=-(m-3)^2}\\qquad\\p{2}{\\max_m g(m)=g(3)=0}',
        parts: ['objetivo de práctica', 'máximo del objetivo'],
      },
    },
    {
      say: 'La pendiente señala hacia dónde subir. Desde m = 0 vale 6; con un cuarto de esa pendiente avanzas a 1,5 y vuelves a calcularla en cada paso.',
      board: [
        {
          label: 'Pendiente',
          tex: "\\p{1}{g'(m)}=\\p{2}{-2(m-3)}",
          parts: ['pendiente para subir', 'cálculo de la pendiente'],
        },
        {
          label: 'Paso de gradiente',
          tex: "\\p{1}{m_{t+1}}=\\p{2}{m_t+\\eta\\,g'(m_t)}",
          parts: ['posición siguiente', 'avance según pendiente'],
        },
      ],
    },
    {
      say: 'El tamaño de paso η multiplica la pendiente. Mueve la perilla y compara las tres trayectorias; con η = 1 saltas al otro lado y vuelves al inicio.',
      gate: 'Arrastra la perilla de η hasta 1 para ver la oscilación.',
      board: {
        label: 'Paso demasiado grande',
        tex: '\\p{1}{\\eta=1}\\quad\\p{2}{0\\to6\\to0\\to6\\to\\cdots}',
        parts: ['tamaño del paso', 'oscilación sin avance'],
      },
    },
    {
      say: 'Reinicia en m = 0 y usa η = 0,5. La pendiente inicial sigue siendo 6.',
      ask: {
        prompt: '¿Dónde queda m después de un paso?',
        options: ['3', '6', '−3'],
        answer: 0,
        explain: 'm₁ = 0 + 0,5 · 6 = 3. Llegas al máximo y la pendiente queda en cero.',
      },
      board: {
        label: 'Llegar en un paso',
        tex: '\\p{1}{m_1=0+0{,}5\\cdot6}\\p{2}{=3}',
        parts: ['con los datos del caso', 'posición del máximo'],
      },
    },
    {
      say: 'Aquí η = 0,5 llega justo al máximo; η = 0,25 se acerca de a poco y η = 1 oscila. Para otra curva, el paso adecuado puede cambiar: revisa si el objetivo realmente sube.',
      board: {
        label: 'Distancia al máximo',
        tex: '\\p{1}{m_{t+1}-3}=\\p{2}{(1-2\\eta)(m_t-3)}',
        body: 'En esta parábola, 0 < η < 1 converge. η = 1 oscila si no partes en el máximo.',
        parts: ['distancia siguiente', 'distancia tras el ajuste'],
      },
    },
  ],
};

function ReaderDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const eta = beat === 0 ? 0.25 : 1;
  const ms = answer !== null ? trajectory(eta) : [0];
  return (
    <Stage>
      <Hill ms={ms} />
      <Cap x={1250} y={200} tex="m_0=0" color={C.cyan} />
      <Cap x={1250} y={290} tex={`\\eta=${tnum(eta)}`} color={C.amber} />
      {answer !== null &&
        ms
          .slice(1)
          .map((m, i) => (
            <Cap
              key={i}
              x={1250}
              y={380 + i * 80}
              tex={`m_${i + 1}=${tnum(m, 3)}`}
              color={beat === 0 ? C.green : C.magenta}
            />
          ))}
    </Stage>
  );
}

function SlopePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 179 + round);
    const center = pick(r, [2, 3, 4]);
    const start = center - pick(r, [1, 2, 3]);
    const eta = round === 2 ? 1 : pick(r, [0.125, 0.25, 0.5, 0.75]);
    const slope = -2 * (start - center);
    const next = update(start, eta, center);
    return { center, start, eta, slope, next, second: update(next, eta, center) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  useEffect(() => {
    setVal('');
    setChoice(null);
    const base = `g(m) = −(m − ${d.center})², m₀ = ${d.start}, η = ${fmt(d.eta, 3)}.`;
    api.prompt(
      base +
        [
          ' Calcula m₁. Escribe tres decimales.',
          ' Calcula m₂: vuelve a evaluar la pendiente en m₁. Escribe tres decimales.',
          ' ¿Qué ocurre al repetir el ajuste?',
        ][round],
      `m_{t+1}=m_t-2\\eta(m_t-${d.center})`,
    );
    api.hints(
      [
        [
          `La pendiente inicial es −2 · (${d.start} − ${d.center}).`,
          'Multiplica la pendiente por η y súmala a m₀.',
        ],
        [
          'Calcula m₁ antes de intentar el segundo paso.',
          'La segunda pendiente es −2 · (m₁ − el centro); no reutilices la primera.',
        ],
        [
          'Con η = 1, cada paso refleja m al otro lado del centro.',
          'Calcula dos pasos y compara m₂ con m₀.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === 1)
        return api.result(
          true,
          `Oscila: ${d.start} → ${d.next} → ${d.start}. El objetivo no mejora.`,
        );
      return api.result(
        false,
        choice === 0
          ? 'Cruzar el máximo no asegura acercarte: con η = 1 quedas a la misma distancia al otro lado.'
          : 'La distancia al centro se mantiene. Para esta parábola, η > 1 la haría crecer.',
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    const target = round === 0 ? d.next : d.second;
    if (Math.abs(v - target) < 0.00051)
      return api.result(
        true,
        `$m_${round + 1}=${tnum(target, 3)}$. La pendiente se evalúa en el punto actual.`,
      );
    const close = (wrong: number) => Math.abs(v - wrong) < 0.00051;
    if (round === 0 && close(d.start - d.eta * d.slope))
      return api.result(
        false,
        'Restaste la pendiente: eso baja g. Para maximizar g, suma η por la pendiente.',
      );
    if (round === 0 && close(d.eta * d.slope))
      return api.result(false, 'Ese es el desplazamiento. Falta sumarlo al punto de partida m₀.');
    if (round === 0 && close(d.start + d.slope))
      return api.result(
        false,
        'Usaste la pendiente completa. Multiplícala por el tamaño de paso η.',
      );
    if (round === 1 && close(d.start + 2 * d.eta * d.slope))
      return api.result(
        false,
        'Repetiste la pendiente inicial. En el segundo paso calcula g′ en m₁.',
      );
    if (round === 1 && close(d.next))
      return api.result(
        false,
        'Ese es m₁. Falta otro paso con la pendiente evaluada en ese punto.',
      );
    return api.result(
      false,
      round === 0
        ? `Parte en ${d.start} y suma ${fmt(d.eta, 3)} por la pendiente ${d.slope}.`
        : `Primero m₁ = ${fmt(d.next, 3)}. Luego calcula m₁ − 2η(m₁ − ${d.center}).`,
    );
  };
  const choices = ['Se acerca al máximo', 'Oscila entre dos puntos', 'Se aleja cada vez más'];
  return (
    <Stage>
      <Hill center={d.center} ms={[d.start]} />
      <Cap x={1250} y={200} tex={`m_0=${d.start}`} color={C.cyan} />
      <Cap x={1250} y={290} tex={`\\eta=${tnum(d.eta, 3)}`} color={C.amber} />
      {round < 2 ? (
        <NumberField
          x={1120}
          y={440}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label={round === 0 ? 'm₁ =' : 'm₂ ='}
        />
      ) : (
        choices.map((text, i) => (
          <g
            key={text}
            onClick={() => setChoice(i)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={text}
            aria-pressed={choice === i}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setChoice(i);
              }
            }}
          >
            <rect
              x={1050}
              y={365 + i * 90}
              width={400}
              height={62}
              rx={12}
              fill={C.panel}
              stroke={choice === i ? C.amber : C.line}
              strokeWidth={3}
            />
            <Cap x={1250} y={396 + i * 90} size={19} color={choice === i ? C.amber : C.text}>
              {text}
            </Cap>
          </g>
        ))
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c7',
  world: 'variational',
  code: '11.7',
  title: 'Bajar la cuesta',
  subtitle: 'Ajuste por gradiente y tamaño de paso',
  glyph: "\\eta\\,g'(m)",
  kind: 'level',
  guide: 'simon',
  teaser:
    'El ajuste salta de un extremo al otro. Simón reconoce una perilla que dejaron demasiado alta.',
  learn: 'Calcular pasos de gradiente y reconocer cuándo el tamaño de paso produce oscilación.',
  glyphs: ['vi-gradient-step', 'vi-step-size'],
  pitfalls: [
    'Para maximizar g se suma la pendiente; para minimizar un costo se resta su gradiente.',
    'La pendiente se vuelve a calcular después de cada paso.',
    'Un paso mayor puede hacer oscilar el ajuste; η = 0,5 funciona en un paso solo para esta parábola.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'El ventilador del servidor rozaba algo y repetía un golpecito seco. En la pantalla, el ajuste volvía una y otra vez al mismo punto.',
        },
        {
          who: 'teo',
          text: 'Todavía guarda el simulador de ajuste. Lo reinicié y lleva un minuto saltando entre dos valores.',
        },
        {
          who: 'simon',
          text: 'Le subieron el paso del ajuste para que terminara rápido. Así la mezcla salta de un borde al otro.',
        },
        { who: 'iris', text: '¿Quién movió la perilla?' },
        {
          who: 'simon',
          text: 'La cuenta de Halcón. Digo la cuenta, no la persona. Bájalo antes de que quede otra sesión con mi nombre.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El simulador del ajuste',
      Scene: ReaderDemo,
      beats: [
        {
          say: 'Prueba la curva didáctica g(m) = −(m − 3)² desde 0, con η = 0,25.',
          ask: {
            prompt: '¿Qué trayectoria dan los tres primeros pasos?',
            options: ['1,5 → 2,25 → 2,625', '1,5 → 3 → 4,5', '6 → 0 → 6'],
            answer: 0,
            explain:
              'En cada punto cambia la pendiente: 6, luego 3, luego 1,5. Los avances son 1,5; 0,75; 0,375.',
          },
          note: {
            label: 'Ajuste gradual',
            tex: '\\eta=0{,}25:\\quad0\\to1{,}5\\to2{,}25\\to2{,}625',
          },
        },
        {
          say: 'Reinicia el simulador en 0 y carga η = 1, el paso que estaba guardado.',
          ask: {
            prompt: '¿Qué muestra esta prueba sobre el ajuste?',
            options: ['Oscila entre 0 y 6', 'Converge a 3', 'Mejora con cada salto'],
            answer: 0,
            explain:
              'Desde 0, la pendiente 6 lleva a 6. Allí vale −6 y te devuelve a 0; g vale −9 en ambos extremos.',
          },
          note: {
            label: 'Oscilación del simulador',
            tex: '\\eta=1:\\quad0\\to6\\to0\\to6,\\qquad g(0)=g(6)=-9',
            body: 'Este ejemplo detecta un paso inadecuado. Por sí solo no demuestra cómo funciona el objetivo real del lector.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar el paso', Comp: SlopePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Teo guardó la prueba. Simón tapó con la manga el reflejo del logo de Halcón en el vidrio.',
        },
        {
          who: 'teo',
          text: 'Con medio paso, el simulador queda quieto. Puedo guardar las dos ejecuciones con su configuración.',
        },
        {
          who: 'tu',
          text: 'Eso explica los saltos. Falta revisar qué forma estaban intentando ajustar.',
        },
        {
          who: 'simon',
          text: 'La receta admite una sola montaña, aunque los datos tengan dos. Esa restricción ya venía firmada.',
        },
        { who: 'iris', text: 'Guarda también la firma.' },
        {
          who: 'nar',
          text: 'Bajo la configuración apareció una curva con dos jorobas, y la aproximación lila cubría apenas una.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-gradient-step',
    world: 'variational',
    tex: "m_{t+1}=m_t+\\eta\\,g'(m_t)",
    name: 'Paso de gradiente',
    read: 'eme siguiente igual eme actual más eta por ge prima en eme actual',
    meaning:
      'Actualiza el parámetro en la dirección de subida, usando la pendiente del punto actual.',
    warn: 'Para minimizar un costo, se resta su gradiente.',
  },
  {
    id: 'vi-step-size',
    world: 'variational',
    tex: '\\eta',
    name: 'Tamaño de paso',
    read: 'eta',
    meaning: 'Factor que multiplica el gradiente y regula cuánto avanza el ajuste.',
    warn: 'Un valor demasiado grande puede producir oscilación o divergencia.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Ascenso por gradiente', tex: "m_{t+1}=m_t+\\eta\\,g'(m_t),\\quad\\eta>0" },
    {
      label: 'Descenso de un costo',
      tex: "m_{t+1}=m_t-\\eta\\,c'(m_t)",
      body: 'Si c = −g, bajar c equivale a subir g.',
    },
  ],
  props: [
    { label: 'Parábola de práctica', tex: "g(m)=-(m-3)^2,\\quad g'(m)=-2(m-3)" },
    { label: 'Error después de un paso', tex: 'm_{t+1}-3=(1-2\\eta)(m_t-3)' },
    {
      label: 'Convergencia en esta parábola',
      tex: '|1-2\\eta|<1\\iff0<\\eta<1',
      body: 'η = 0,5 llega en un paso. Con η = 1 y un inicio distinto de 3, el ajuste oscila.',
    },
  ],
};

export { lesson };
