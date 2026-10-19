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
import { Confirm, Knob, NumberField, parseProb } from '../shared/ui';
import { fmt, tnum } from './kit';

// a = P(S → N), b = P(N → S). Cada fila suma uno.
// Desde S: P(S,S,N) = 0,9 · 0,1 = 0,09; equilibrio (5/6, 1/6).
function Transitions({ a = 0.1, b = 0.5 }: { a?: number; b?: number }) {
  return (
    <g>
      <Cap x={550} y={100} size={24}>
        Estado de hoy → estado de mañana
      </Cap>
      <path d="M 390 260 Q 550 160 710 260" fill="none" stroke={C.magenta} strokeWidth={3} />
      <path d="M 710 340 Q 550 440 390 340" fill="none" stroke={C.cyan} strokeWidth={3} />
      <path d="M 700 247 L 715 261 L 694 263" fill="none" stroke={C.magenta} strokeWidth={3} />
      <path d="M 406 336 L 385 339 L 398 354" fill="none" stroke={C.cyan} strokeWidth={3} />
      <path d="M 265 255 C 150 120 150 460 265 345" fill="none" stroke={C.cyan} strokeWidth={3} />
      <path d="M 249 346 L 267 341 L 262 360" fill="none" stroke={C.cyan} strokeWidth={3} />
      <path
        d="M 835 255 C 950 120 950 460 835 345"
        fill="none"
        stroke={C.magenta}
        strokeWidth={3}
      />
      <path d="M 838 360 L 833 341 L 851 346" fill="none" stroke={C.magenta} strokeWidth={3} />
      <circle cx={320} cy={300} r={78} fill={C.panel} stroke={C.cyan} strokeWidth={4} />
      <circle cx={780} cy={300} r={78} fill={C.panel} stroke={C.magenta} strokeWidth={4} />
      <Cap x={320} y={300} size={27} color={C.cyan}>
        S · sano
      </Cap>
      <Cap x={780} y={300} size={27} color={C.magenta}>
        N · enfermo
      </Cap>
      <Cap x={550} y={185} tex={`P(S\\to N)=${tnum(a)}`} color={C.magenta} />
      <Cap x={550} y={425} tex={`P(N\\to S)=${tnum(b)}`} color={C.cyan} />
      <Cap x={320} y={170} tex={`P(S\\to S)=${tnum(1 - a)}`} color={C.cyan} />
      <Cap x={780} y={170} tex={`P(N\\to N)=${tnum(1 - b)}`} color={C.magenta} />
    </g>
  );
}

function Tape({ states }: { states: string[] }) {
  return (
    <g>
      <rect
        x={180}
        y={560}
        width={740}
        height={105}
        rx={15}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      {states.map((state, i) => (
        <g key={i}>
          <Cap x={300 + i * 250} y={525} size={19} color={C.muted}>
            Día {i}
          </Cap>
          <Cap x={300 + i * 250} y={612} size={30} color={state === 'S' ? C.cyan : C.magenta}>
            {state}
          </Cap>
          {i < states.length - 1 && (
            <Cap x={425 + i * 250} y={612} size={30} color={C.muted}>
              →
            </Cap>
          )}
        </g>
      ))}
      <Cap x={550} y={710} size={20} color={C.muted}>
        El estado inicial está fijado: S.
      </Cap>
    </g>
  );
}

const fractionS = (day: number) => 5 / 6 + (1 / 6) * 0.4 ** day;

function MarkovLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [day, setDay] = useState(0);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    if (beat === 3) setDay(Math.round(clamp((px - 210) / 680, 0, 1) * 12));
  });
  useEffect(() => {
    if (beat === 3 && day >= 8) unlock();
  }, [beat, day, unlock]);
  return (
    <Stage ref={svg}>
      <Transitions />
      {beat === 1 && <Tape states={['S', 'S', 'N']} />}
      <Cap x={1250} y={200} tex="P(X_{t+1}\mid X_t)" />
      <Cap x={1250} y={290} size={20} color={C.muted}>
        Solo cuenta el estado de hoy.
      </Cap>
      {beat === 1 && answer !== null && (
        <Cap x={1250} y={380} tex="0{,}9\cdot0{,}1=0{,}09" color={C.green} />
      )}
      {beat === 2 && (
        <>
          <Cap x={550} y={580} size={23}>
            En un lote, una parte sigue sana y otra se recupera.
          </Cap>
          <Cap x={1250} y={380} tex="q_{t+1}=0{,}9q_t+0{,}5(1-q_t)" size={20} />
          <Cap x={1250} y={470} tex="q_0=1" color={C.cyan} />
        </>
      )}
      {beat === 3 && (
        <>
          <line x1={210} x2={890} y1={650} y2={650} stroke={C.line} strokeWidth={2} />
          <line
            x1={210}
            x2={890}
            y1={525}
            y2={525}
            stroke={C.green}
            strokeDasharray="6 6"
            strokeWidth={2}
          />
          <polyline
            points={Array.from(
              { length: day + 1 },
              (_, i) => `${210 + (i / 12) * 680},${650 - fractionS(i) * 150}`,
            ).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth={4}
          />
          <circle cx={210 + (day / 12) * 680} cy={650 - fractionS(day) * 150} r={8} fill={C.cyan} />
          <Cap x={550} y={470} size={20}>
            Fracción esperada de sanos en el lote
          </Cap>
          <Cap x={550} y={685} size={19} color={C.green}>
            Referencia: 5/6 ≈ 0,833
          </Cap>
          <line x1={210} x2={890} y1={760} y2={760} stroke={C.line} strokeWidth={5} />
          <Knob
            x={210 + (day / 12) * 680}
            y={760}
            axis="x"
            label="t"
            color={C.cyan}
            onPointerDown={drag}
          />
          <Cap x={210} y={810} size={19}>
            Día 0
          </Cap>
          <Cap x={890} y={810} size={19}>
            Día 12
          </Cap>
          <Cap x={1250} y={380} tex={`t=${day}`} />
          <Cap x={1250} y={470} tex={`q_t=${tnum(fractionS(day), 4)}`} color={C.cyan} />
          <Cap x={1250} y={560} tex="\pi_S=\frac56\approx0{,}833" color={C.green} />
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={550} y={580} tex="\pi_S\cdot0{,}1=\pi_N\cdot0{,}5" color={C.amber} />
          <Cap x={550} y={680} size={21}>
            En equilibrio, salen tantos sanos como entran.
          </Cap>
          <Cap x={1250} y={380} tex="\pi_S=\frac{0{,}5}{0{,}1+0{,}5}=\frac56" color={C.green} />
          <Cap x={1250} y={470} tex="\pi_N=1-\pi_S=\frac16" color={C.magenta} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Generar días con una cadena de Markov',
  Scene: MarkovLesson,
  beats: [
    {
      say: 'La máquina genera un estado por día: sano (S) o enfermo (N). En una **cadena de Markov**, la probabilidad de mañana depende solo del estado de hoy.',
      board: {
        label: 'Propiedad de Markov',
        tex: '\\p{1}{P(X_{t+1}\\mid X_t,\\ldots,X_0)}=\\p{2}{P(X_{t+1}\\mid X_t)}',
        parts: ['mañana con toda la historia', 'mañana según hoy'],
      },
    },
    {
      say: 'Fija el primer día en S. Para generar S, S, N, la máquina debe seguir sana un día y pasar a enferma al siguiente.',
      ask: {
        prompt: 'Desde S, ¿qué probabilidad tiene la secuencia S, S, N?',
        options: ['0,09', '1', '0,81'],
        answer: 0,
        explain:
          'Multiplica las dos transiciones: 0,9 · 0,1 = 0,09. El inicio en S ya está fijado; 0,81 correspondería a S, S, S.',
      },
      board: {
        label: 'Probabilidad de una secuencia',
        tex: '\\p{1}{P(X_1}=\\p{2}{S,X_2}=\\p{3}{N\\mid X_0}=\\p{4}{S)}=\\p{5}{P(S\\to S)\\,P(S\\to N)}',
        parts: [
          'estado de mañana',
          'sano al día siguiente',
          'enfermo al segundo día',
          'inicio fijado en sano',
          'producto de transiciones',
        ],
      },
    },
    {
      say: 'Llama qₜ a la fracción esperada de sanos en el lote. Mañana siguen sanos el 90 % de los sanos y se recupera el 50 % de los enfermos.',
      board: {
        label: 'Avanzar un día',
        tex: '\\p{1}{q_{t+1}}=\\p{2}{0{,}9q_t+0{,}5(1-q_t)}',
        parts: ['sanos esperados mañana', 'sanos que siguen o vuelven'],
      },
    },
    {
      say: 'Parte con un lote completamente sano. Avanza los días: la fracción esperada se acerca a 5/6; un lote sorteado puede fluctuar alrededor de ese valor.',
      gate: 'Arrastra la perilla de días hasta el día 8 o más.',
      board: {
        label: 'Acercarse al equilibrio',
        tex: '\\p{1}{q_0}=\\p{2}{1},\\quad\\p{3}{ q_t}=\\p{4}{\\frac56+\\frac16(0{,}4)^t}',
        parts: [
          'fracción sana inicial',
          'todo el lote sano',
          'sanos tras varios días',
          'equilibrio más transitorio',
        ],
      },
    },
    {
      say: 'La **distribución estacionaria** se mantiene al avanzar un día. Iguala el flujo de S a N con el de N a S: quedan 5/6 sanos y 1/6 enfermos.',
      board: {
        label: 'Distribución estacionaria',
        tex: '\\p{1}{\\pi_S}=\\p{2}{\\frac{P(N\\to S)}{P(S\\to N)+P(N\\to S)}}=\\p{3}{\\frac56},\\quad\\p{4}{\\pi_N}=\\p{5}{\\frac16}',
        parts: [
          'sanos en equilibrio',
          'balance entre transiciones',
          'fracción sana estable',
          'enfermos en equilibrio',
          'fracción enferma estable',
        ],
      },
    },
  ],
};

function NightTape({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Transitions />
      {beat === 0 ? (
        <Tape states={['S', 'N', 'N']} />
      ) : (
        <Cap x={550} y={610} size={23}>
          La cinta sigue imprimiendo durante muchos días.
        </Cap>
      )}
      <Cap x={1250} y={200} size={23}>
        Regla del turno de noche
      </Cap>
      <Cap x={1250} y={290} tex={beat === 0 ? 'X_0=S' : '\\pi_S+\\pi_N=1'} />
      {answer !== null &&
        (beat === 0 ? (
          <Cap x={1250} y={380} tex="0{,}1\cdot0{,}5=0{,}05" color={C.green} />
        ) : (
          <>
            <Cap x={1250} y={380} tex="\pi_S=\frac56" color={C.cyan} />
            <Cap x={1250} y={470} tex="\pi_N=\frac16" color={C.magenta} />
          </>
        ))}
    </Stage>
  );
}

function MarkovPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 211 + round);
    const a = pick(r, [0.1, 0.2, 0.3, 0.4]);
    const b = pick(r, [0.5, 0.6, 0.7, 0.8]);
    const repeatS = pick(r, [true, false]);
    const sequence = repeatS ? ['S', 'S', 'N'] : ['S', 'N', 'N'];
    const path = repeatS ? (1 - a) * a : a * (1 - b);
    const q = pick(r, [0.25, 0.5, 0.75]);
    return {
      a,
      b,
      repeatS,
      sequence,
      path,
      q,
      next: q * (1 - a) + (1 - q) * b,
      stationary: b / (a + b),
    };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Desde S, ¿qué probabilidad tiene la secuencia ${d.sequence.join(', ')}? Escribe tres decimales.`,
        `Hoy la fracción esperada de sanos es ${fmt(d.q)}. ¿Cuánto vale mañana? Escribe tres decimales.`,
        'Con las transiciones del dibujo, ¿cuál es la proporción estacionaria de sanos? Escribe tres decimales o una fracción.',
      ][round],
      [
        'P(X_1,X_2\\mid X_0)=P(X_1\\mid X_0)\\,P(X_2\\mid X_1)',
        'q_{t+1}=q_t P(S\\to S)+(1-q_t)P(N\\to S)',
        '\\pi_S=\\frac{P(N\\to S)}{P(S\\to N)+P(N\\to S)}',
      ][round],
    );
    api.hints(
      [
        [
          'Lee las dos flechas de la secuencia en orden.',
          'Multiplica sus probabilidades; el estado inicial ya está fijado.',
        ],
        [
          'Cuenta los sanos que siguen sanos y los enfermos que se recuperan.',
          'Suma qₜ·(1 − a) y (1 − qₜ)·b.',
        ],
        ['En equilibrio, πS·a = (1 − πS)·b.', 'Despeja πS: la recuperación b dividida por a + b.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseProb(val);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.00051;
    const target = [d.path, d.next, d.stationary][round];
    if (near(target))
      return api.result(
        true,
        [
          `Las dos transiciones dan $${tnum(d.repeatS ? 1 - d.a : d.a)}\\cdot${tnum(d.repeatS ? d.a : 1 - d.b)}=${tnum(d.path, 3)}$.`,
          `Sanos que permanecen más recuperados: $${tnum(d.q)}\\cdot${tnum(1 - d.a)}+${tnum(1 - d.q)}\\cdot${tnum(d.b)}=${tnum(d.next, 3)}$.`,
          `En equilibrio: $\\pi_S=\\frac{${tnum(d.b)}}{${tnum(d.a)}+${tnum(d.b)}}\\approx${tnum(d.stationary, 3)}$.`,
        ][round],
      );
    if (round === 0) {
      const first = d.repeatS ? 1 - d.a : d.a;
      const second = d.repeatS ? d.a : 1 - d.b;
      if (near(first + second))
        return api.result(
          false,
          'Sumaste las flechas. La secuencia requiere ambas transiciones: multiplícalas.',
        );
      if (near(first) || near(second))
        return api.result(
          false,
          'Contaste una sola transición. La cinta tiene dos pasos después del estado inicial.',
        );
      return api.result(
        false,
        'Revisa el estado de salida de cada flecha. Para el segundo paso, usa el estado del día 1.',
      );
    }
    if (round === 1) {
      if (near(d.q * (1 - d.a)))
        return api.result(false, 'Faltan los enfermos que se recuperan: suma (1 − qₜ)·b.');
      if (near((1 - d.a + d.b) / 2))
        return api.result(
          false,
          'Promediaste las filas por igual. Pondera cada fila por la fracción de hoy.',
        );
      if (near(d.q))
        return api.result(
          false,
          'Esa es la fracción de hoy. Avanza un día con las dos transiciones que llegan a S.',
        );
      return api.result(false, 'Suma dos aportes: qₜ·P(S → S) y (1 − qₜ)·P(N → S).');
    }
    if (near(1 - d.stationary))
      return api.result(
        false,
        'Calculaste la proporción de enfermos. Para sanos, el numerador es P(N → S).',
      );
    if (near(1 - d.a))
      return api.result(
        false,
        'Esa es la probabilidad de seguir sano un día. El equilibrio también incluye las recuperaciones.',
      );
    if (near(d.b))
      return api.result(
        false,
        'Esa es la recuperación. Divídela por la suma de las dos probabilidades de cambiar de estado.',
      );
    return api.result(false, 'Usa b/(a + b), con a = P(S → N) y b = P(N → S).');
  };
  return (
    <Stage>
      <Transitions a={d.a} b={d.b} />
      {round === 0 && <Tape states={d.sequence} />}
      {round === 1 && (
        <Cap x={550} y={610} size={23}>
          Hoy: {fmt(d.q * 100, 0)} % sanos; {fmt((1 - d.q) * 100, 0)} % enfermos.
        </Cap>
      )}
      {round === 2 && (
        <Cap x={550} y={610} size={23}>
          Busca la proporción que se mantiene de un día al siguiente.
        </Cap>
      )}
      <Cap x={1250} y={200} size={23}>
        Otro lote, otras transiciones
      </Cap>
      <Cap
        x={1250}
        y={290}
        tex={round === 0 ? 'X_0=S' : round === 1 ? `q_t=${tnum(d.q)}` : '\\pi_S+\\pi_N=1'}
      />
      <NumberField
        x={1080}
        y={470}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P =', 'qₜ₊₁ =', 'πS ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c4',
  world: 'generative',
  code: '12.4',
  title: 'Lo que se repite',
  subtitle: 'Cadenas de Markov',
  glyph: 'P(X_{t+1}\\mid X_t)',
  kind: 'level',
  guide: 'joaquin',
  teaser: 'La cinta imprime historias clínicas día por día. Joaquín reconoce el ritmo del turno.',
  learn:
    'Multiplicar transiciones para calcular secuencias, avanzar una distribución y hallar su equilibrio.',
  glyphs: ['gen-markov-transition', 'gen-markov-stationary'],
  pitfalls: [
    'Una secuencia requiere multiplicar las transiciones en orden, con el inicio fijado.',
    'La proporción estacionaria usa ambos cambios de estado; no es la probabilidad de seguir sano.',
    'El equilibrio describe proporciones: los registros individuales siguen cambiando de estado.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Una impresora golpeaba el papel continuo. Joaquín frenó la cinta con el antebrazo antes de que las carpetas cayeran al suelo.',
        },
        {
          who: 'joaquin',
          text: 'Quiero cerrar el lote. La cinta sigue agregando días a gente que nunca entró aquí.',
        },
        {
          who: 'teo',
          text: 'Guarda el historial completo. Hay sanos que enferman y enfermos que vuelven a estar sanos.',
        },
        { who: 'iris', text: 'Y se recuperan sin haber pisado nunca la clínica.' },
        { who: 'joaquin', text: 'La máquina no se detiene entre turnos.' },
        {
          who: 'tu',
          text: 'Deja tres días a la vista. Podemos revisar cómo pasa de uno al siguiente.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Tres días en la cinta',
      Scene: NightTape,
      beats: [
        {
          say: 'El lote usa las transiciones 0,9; 0,1; 0,5; 0,5 del turno. La primera carpeta está fijada en S.',
          ask: {
            prompt: '¿Qué probabilidad tiene S, N, N desde S?',
            options: ['0,05', '0,6', '0,25'],
            answer: 0,
            explain:
              'Primero S → N con 0,1; luego N → N con 0,5. El producto es 0,05; sumar 0,6 no calcula una secuencia.',
          },
          note: {
            label: 'Secuencia del lote',
            tex: 'P(X_1=N,X_2=N\\mid X_0=S)=0{,}1\\cdot0{,}5=0{,}05',
          },
        },
        {
          say: 'Joaquín deja correr la cinta durante muchos días con la misma regla.',
          ask: {
            prompt: '¿A qué proporción de sanos se acerca el lote?',
            options: ['5/6', '0,9', '1/2'],
            answer: 0,
            explain:
              'La proporción estable es 0,5/(0,1 + 0,5) = 5/6. El 0,9 solo indica cuánto permanece sano alguien que hoy está sano.',
          },
          note: {
            label: 'Equilibrio del turno',
            tex: '(\\pi_S,\\pi_N)=(\\tfrac56,\\tfrac16)',
            body: 'Una regla fija puede generar historias variadas. Compartir estas proporciones no basta para probar que un registro fue fabricado.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar otro turno', Comp: MarkovPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín cortó el papel por la línea perforada. Bajo la tapa había otra cinta, ya cargada.',
        },
        {
          who: 'joaquin',
          text: 'A largo plazo, cinco de cada seis sanos. Esa regla ya estaba puesta cuando recibí el turno.',
        },
        { who: 'iris', text: '¿Y quién la puso?' },
        { who: 'joaquin', text: 'Mi firma va en la caja. La regla no tiene firma.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-markov-transition',
    world: 'generative',
    tex: 'P(X_{t+1}\\mid X_t)',
    name: 'Probabilidad de transición',
    read: 'pe del estado siguiente dado el actual',
    meaning: 'Probabilidad de pasar de un estado al siguiente en un paso.',
    warn: 'Cada fila de salida suma uno; una secuencia multiplica sus transiciones.',
  },
  {
    id: 'gen-markov-stationary',
    world: 'generative',
    tex: '\\pi=\\pi T',
    name: 'Distribución estacionaria',
    read: 'pi igual a pi por te',
    meaning: 'Distribución de estados que se mantiene al aplicar la matriz de transición.',
    warn: 'Los estados individuales pueden cambiar aunque sus proporciones estén en equilibrio.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Cadena de Markov',
      tex: 'P(X_{t+1}\\mid X_t,\\ldots,X_0)=P(X_{t+1}\\mid X_t)',
      body: 'Dado el estado actual, el pasado no cambia la distribución del siguiente estado.',
    },
    {
      label: 'Matriz de transición',
      tex: 'T=\\begin{pmatrix}1-a&a\\\\b&1-b\\end{pmatrix}',
      body: 'Filas y columnas en orden S, N. a = P(S → N), b = P(N → S); 0 ≤ a,b ≤ 1.',
    },
    { label: 'Distribución estacionaria', tex: '\\pi=\\pi T,\\quad\\pi_S+\\pi_N=1' },
  ],
  props: [
    {
      label: 'Secuencia con inicio fijado',
      tex: 'P(X_1=x_1,\\ldots,X_k=x_k\\mid X_0=x_0)=\\prod_{t=0}^{k-1}T_{x_t,x_{t+1}}',
    },
    { label: 'Avanzar el lote', tex: 'q_{t+1}=q_t(1-a)+(1-q_t)b' },
    {
      label: 'Equilibrio de dos estados',
      tex: '\\pi_S=\\frac{b}{a+b},\\quad\\pi_N=\\frac{a}{a+b}',
      body: 'Para a + b > 0. Con 0 < a,b < 1, las proporciones convergen a este equilibrio desde cualquier distribución inicial.',
    },
  ],
};

export { lesson };
