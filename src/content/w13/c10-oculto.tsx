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
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { beliefUpdate, correct, fmt, predict, signalProb, tnum, type Act } from './kit';

function BeliefBar({ b }: { b: number }) {
  return (
    <g>
      <Cap x={800} y={100} size={30}>
        Creencia en rumor
      </Cap>
      <rect
        x={200}
        y={150}
        width={1200}
        height={52}
        rx={8}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      <rect x={200} y={150} width={1200 * b} height={52} rx={8} fill={C.cyan} />
      <Cap x={200} y={245} size={26}>
        0
      </Cap>
      <Cap x={800} y={245} size={30} color={C.cyan}>
        {fmt(b, 3)}
      </Cap>
      <Cap x={1400} y={245} size={26}>
        1
      </Cap>
    </g>
  );
}

function HiddenLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [signals, setSignals] = useState<boolean[]>([]);
  const [days, setDays] = useState(0);
  const bSignals = signals.reduce((b, s) => correct(b, s), 0.2);
  let projected = 0.2;
  for (let i = 0; i < days; i++) projected = predict(projected, 'esperar');
  const drag = useSvgDrag(svg, (x) => {
    if (beats.beat !== 5) return;
    const n = Math.round(clamp((x - 250) / 1100, 0, 1) * 30);
    setDays(n);
    if (n === 30) unlock();
  });
  const addSignal = (s: boolean) => {
    const next = [...signals, s];
    setSignals(next);
    if (
      next.length >= 2 &&
      next[next.length - 2] &&
      next[next.length - 1] &&
      Math.abs(next.reduce((b, v) => correct(b, v), 0.2) - 0.8) < 1e-8
    )
      unlock();
  };
  const b =
    beats.beat === 3
      ? bSignals
      : beats.beat === 5
        ? projected
        : beats.beat === 4
          ? answer !== null
            ? 0.2
            : 0.5
          : 0.2;
  return (
    <Stage ref={svg}>
      <BeliefBar b={b} />
      <Cap x={800} y={320} size={27}>
        Volumen alto según el estado
      </Cap>
      <Cap x={530} y={380} size={27}>
        Calma: 0,2
      </Cap>
      <Cap x={1070} y={380} size={27}>
        Rumor: 0,8
      </Cap>
      {beats.beat === 3 && (
        <>
          <Cap x={800} y={470} size={25}>
            Estado quieto · señales:{' '}
            {signals.map((s) => (s ? 'alto' : 'bajo')).join(' · ') || 'ninguna'}
          </Cap>
          <Choices
            x={800}
            y={555}
            options={['Alto', 'Bajo', 'Reiniciar']}
            value={null}
            onPick={(v) => (v === 'Reiniciar' ? setSignals([]) : addSignal(v === 'Alto'))}
          />
        </>
      )}
      {beats.beat === 5 && (
        <>
          <Cap x={800} y={470} size={28}>
            Días sin mirar: {days}
          </Cap>
          <line x1={250} x2={1350} y1={550} y2={550} stroke={C.line} strokeWidth={5} />
          <Knob x={250 + (1100 * days) / 30} y={550} axis="x" onPointerDown={drag} />
          <Cap x={250} y={610} size={25}>
            0 días
          </Cap>
          <Cap x={1350} y={610} size={25}>
            30 días
          </Cap>
        </>
      )}
      {beats.beat === 6 && (
        <>
          <Cap x={800} y={475} size={27}>
            Esperar: predicción 0,34 · P(alto) = 0,404
          </Cap>
          <Cap x={510} y={550} size={27} color={C.cyan}>
            Alto → 0,673
          </Cap>
          <Cap x={1090} y={550} size={27} color={C.amber}>
            Bajo → 0,114
          </Cap>
        </>
      )}
      {beats.beat === 7 && (
        <Cap x={800} y={480} size={27}>
          Creencia actual → acción → señal → nueva creencia
        </Cap>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Estado oculto y creencia',
  intro: {
    question: '¿Qué se sabe del estado cuando solo se ven señales?',
    text: 'El mercado cambia aunque nadie publique su estado. El volumen entrega una señal imperfecta; la creencia permite juntar esa señal con lo que ya se sabía.',
  },
  Scene: HiddenLesson,
  beats: [
    {
      say: 'Un **POMDP** es un proceso de decisión con estados que existen, pero no se observan directamente. A los estados, acciones, transición, recompensa y descuento se agregan las observaciones y su modelo. La creencia inicial $b_0$ describe lo que se sabe antes de mirar.',
      board: {
        label: 'Proceso parcialmente observable',
        tex: '\\p{1}{(S,A,T,r,\\Omega,O,\\gamma)},\\quad \\p{2}{b_0}',
        parts: ['modelo de decisión y observación', 'creencia inicial'],
      },
    },
    {
      say: 'El **modelo de observación** $O(o\\mid s)$ da la probabilidad de una señal si el estado es $s$. Se lee «probabilidad de o dado s». El volumen alto aparece con probabilidad 0,2 en calma y 0,8 en rumor; una señal inclina la creencia, pero no prueba el estado.',
      board: {
        label: 'Volumen alto',
        tex: '\\p{1}{O(\\text{alto}\\mid\\text{calma})}=0{,}2,\\quad \\p{2}{O(\\text{alto}\\mid\\text{rumor})}=0{,}8',
        parts: ['alto en calma', 'alto en rumor'],
      },
    },
    {
      say: 'La **creencia** $b(s)$ es la probabilidad del estado $s$ condicionada a la historia de acciones y señales. Se lee «be de ese». Resume lo visto y hecho: con el modelo y esa distribución basta para continuar, sin guardar toda la historia. Aquí $b$ indica la probabilidad de rumor.',
      board: {
        label: 'Creencia',
        tex: '\\p{1}{b(s)}=\\p{2}{P(s\\mid\\text{historia})}',
        parts: ['creencia en el estado', 'probabilidad dada la historia'],
      },
    },
    {
      say: 'Con el estado quieto, la **corrección** aplica Bayes a cada señal. Multiplica la creencia de cada estado por la probabilidad de observarla y normaliza para que las probabilidades sumen uno. La constante $\\eta$ se lee «eta» y hace esa normalización.',
      gate: 'Desde 0,2, aplica dos señales altas seguidas y observa cuánto cambia la barra.',
      after:
        'Dos señales altas seguidas llevan la creencia de 0,2 a 0,5 y luego a 0,8. Cada corrección incorpora la señal a lo que ya se sabía.',
      board: {
        label: 'Corrección',
        tex: "\\p{1}{b'(s)}=\\p{2}{\\eta}\\,\\p{3}{O(o\\mid s)}\\,\\p{4}{b(s)}",
        parts: [
          'creencia corregida',
          'normalización',
          'probabilidad de la señal',
          'creencia previa',
        ],
      },
    },
    {
      say: 'Una señal baja también modifica la creencia. Su probabilidad es el complemento de la de volumen alto en cada estado. Aplica Bayes a una creencia previa de 0,5 y compara ambos estados.',
      ask: {
        prompt: 'Con b = 0,5 y volumen bajo, ¿cuánto queda para rumor?',
        options: ['0,2', '0,5', '0,8'],
        answer: 0,
        explain:
          'La señal baja tiene probabilidad 0,2 en rumor y 0,8 en calma. Al normalizar, la creencia en rumor queda en 0,2.',
      },
      board: { label: 'Señal baja', tex: 'O(\\text{bajo}\\mid s)=1-O(\\text{alto}\\mid s)' },
    },
    {
      say: 'La **predicción** lleva la creencia al día siguiente usando la transición de la acción elegida. La barra parte en 0,2 y la acción es esperar. Sin señales nuevas, el paso del tiempo mezcla las posibilidades de ambos estados.',
      gate: 'Mueve la perilla hasta el extremo de días sin mirar y observa a qué valor se acerca la creencia.',
      after:
        'Después de 30 días sin señales, la creencia se aproxima a 0,67, la distribución estacionaria. La predicción va olvidando el punto de partida.',
      board: {
        label: 'Predicción',
        tex: "\\p{1}{\\bar b(s')}=\\sum_s \\p{2}{T(s'\\mid s,a)}\\,\\p{3}{b(s)}",
        parts: ['creencia predicha', 'transición según la acción', 'creencia actual'],
      },
    },
    {
      say: 'El **filtro** combina predicción y corrección en ese orden. Desde 0,2, esperar predice 0,34; la probabilidad de volumen alto es 0,404. Al observar alto queda 0,673 y al observar bajo queda 0,114. Corregir antes de predecir respondería otra pregunta.',
      board: {
        label: 'Filtro completo',
        tex: "\\p{1}{b'(s')}=\\p{2}{\\eta O(o\\mid s')}\\sum_s \\p{3}{T(s'\\mid s,a)b(s)}",
        parts: ['creencia posterior', 'corrección normalizada', 'predicción'],
      },
    },
    {
      say: 'La creencia funciona como el nuevo estado para decidir cuando el estado del mercado está oculto. Se conoce porque se calcula a partir de la historia disponible. Cada acción y señal llevan a una nueva creencia mediante el filtro.',
      board: { label: 'Estado de creencia', tex: "b\\xrightarrow{a,o}b'" },
    },
  ],
};

const SIGNALS = [true, false, true, true, false, true, true];
const HOURS = ['09:10', '09:35', '10:05', '10:30', '11:15', '11:40', '12:05'];
const BUYS = [true, false, true, true, true, true, true];
function Investigation({ beats, unlock }: DemoProps) {
  const [values, setValues] = useState<number[]>([0.2]);
  const [prediction, setPrediction] = useState<number | null>(null);
  const day = values.length - 1;
  const step = () => {
    if (day >= 7 || (beats.beat === 0 && day >= 3) || beats.beat > 1) return;
    if (prediction === null) setPrediction(predict(values[day], 'esperar'));
    else {
      const next = [...values, correct(prediction, SIGNALS[day])];
      setValues(next);
      setPrediction(null);
      if ((beats.beat === 0 && next.length === 4) || (beats.beat === 1 && next.length === 8))
        unlock();
    }
  };
  return (
    <Stage>
      <BeliefBar b={prediction ?? values[day]} />
      <Cap x={800} y={310} size={27}>
        {prediction === null ? 'Creencia corregida' : 'Predicción antes de mirar'}
      </Cap>
      {HOURS.map((h, i) => (
        <g key={h}>
          <Cap x={185 + i * 205} y={365} size={24}>
            Día {i + 1} · {h}
          </Cap>
          <Cap x={185 + i * 205} y={420} size={25} color={SIGNALS[i] ? C.cyan : C.amber}>
            {SIGNALS[i] ? 'alto' : 'bajo'}
          </Cap>
          <Cap x={185 + i * 205} y={465} size={24}>
            {i < day ? fmt(values[i + 1], 3) : '·'}
          </Cap>
          {beats.beat >= 2 && BUYS[i] && (
            <Cap x={185 + i * 205} y={510} size={24} color={C.green}>
              compra
            </Cap>
          )}
        </g>
      ))}
      <polyline
        points={values
          .slice(1)
          .map((v, i) => `${185 + i * 205},${740 - v * 170}`)
          .join(' ')}
        fill="none"
        stroke={C.cyan}
        strokeWidth={4}
      />
      {values.slice(1).map((v, i) => (
        <circle key={i} cx={185 + i * 205} cy={740 - v * 170} r={6} fill={C.cyan} />
      ))}
      {beats.beat < 2 && day < 7 && (
        <Choices
          x={800}
          y={800}
          options={[prediction === null ? 'Predecir' : 'Corregir']}
          value={null}
          onPick={step}
        />
      )}
      {beats.beat >= 2 && (
        <Cap x={800} y={810} size={26}>
          Las compras aparecen junto a la creencia de cada día.
        </Cap>
      )}
    </Stage>
  );
}

function Practice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 619 + round);
    return {
      b: pick(r, [0.2, 0.3, 0.4, 0.5, 0.6]),
      action: pick(r, ['esperar', 'calmar'] as Act[]),
      high: pick(r, [true, false]),
    };
  }, [seed, round]);
  const [input, setInput] = useState('');
  const predicted = predict(d.b, d.action);
  const target =
    round === 0
      ? correct(d.b, d.high)
      : round === 1
        ? predicted
        : beliefUpdate(d.b, d.action, d.high);
  useEffect(() => {
    setInput('');
    api.prompt(
      round === 0
        ? `Estado quieto: parte de b = ${fmt(d.b)} y observa volumen ${d.high ? 'alto' : 'bajo'}. Calcula la creencia en rumor.`
        : round === 1
          ? `Con b = ${fmt(d.b)}, la mesa decide ${d.action}. Calcula la creencia predicha en rumor antes de mirar.`
          : `Con b = ${fmt(d.b)}, la mesa decide ${d.action} y observa volumen ${d.high ? 'alto' : 'bajo'}. Calcula la creencia final en rumor.`,
      'P(\\text{alto}\\mid\\text{calma})=0{,}2,\\quad P(\\text{alto}\\mid\\text{rumor})=0{,}8',
    );
    api.hints(
      round === 0
        ? [
            'Multiplica cada creencia por la probabilidad de la señal en ese estado.',
            'Divide el peso de rumor por la suma de ambos pesos.',
          ]
        : round === 1
          ? [
              'Pondera la probabilidad de rumor mañana desde cada estado.',
              'Usa la fila de transición de la acción elegida.',
            ]
          : [
              'Primero predice con la acción; después corrige con la señal.',
              'Normaliza los pesos de calma y rumor después de observar.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const near = (x: number) => Math.abs(n - x) <= 0.01;
    if (near(target))
      return api.result(
        true,
        `La creencia es ${fmt(target, 3)}${round === 2 ? `, tras predecir ${fmt(predicted, 3)} y corregir con la señal` : ''}.`,
      );
    const likelihood = d.high ? 0.8 : 0.2;
    if (round !== 1 && near((round === 0 ? d.b : predicted) * likelihood))
      return api.result(
        false,
        'Falta normalizar: divide el peso de rumor por la suma de los pesos de ambos estados.',
      );
    if (round === 2 && near(predict(correct(d.b, d.high), d.action)))
      return api.result(
        false,
        'Corregiste antes de predecir. La señal corresponde al estado posterior a la acción.',
      );
    if (
      round !== 0 &&
      near(
        round === 1
          ? predict(d.b, d.action === 'esperar' ? 'calmar' : 'esperar')
          : beliefUpdate(d.b, d.action === 'esperar' ? 'calmar' : 'esperar', d.high),
      )
    )
      return api.result(
        false,
        'Usaste la transición de la otra acción. Revisa la fila de la acción elegida.',
      );
    return api.result(
      false,
      'Revisa los pesos de ambos estados y el orden de predicción y corrección.',
    );
  };
  return (
    <Stage>
      <BeliefBar b={d.b} />
      <Cap x={800} y={330} size={27}>
        Transición a rumor mañana
      </Cap>
      <Cap x={800} y={390} size={25}>
        Esperar: 0,2 desde calma · 0,9 desde rumor
      </Cap>
      <Cap x={800} y={445} size={25}>
        Calmar: 0,1 desde cualquiera de los estados
      </Cap>
      <Cap x={800} y={510} size={25}>
        Volumen alto: 0,2 en calma · 0,8 en rumor
      </Cap>
      <NumberField x={610} y={630} value={input} onChange={setInput} onEnter={submit} label="b =" />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c10',
  world: 'decision',
  code: '13.10',
  title: 'Lo que no se publica',
  subtitle: 'Estado oculto y creencia',
  glyph: 'b(s)',
  kind: 'level',
  guide: 'valentina',
  teaser: 'La cuenta veía el volumen, pero el estado del mercado no se publicaba.',
  learn: 'Predecir y corregir una creencia a partir de acciones y señales.',
  glyphs: ['dec-pomdp', 'dec-belief', 'dec-filter'],
  pitfalls: [
    'Normaliza los pesos de ambos estados al corregir.',
    'Predice antes de corregir con la señal del día siguiente.',
    'Usa la transición correspondiente a la acción elegida.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Teo imprimió la columna de volumen y la dejó junto a las órdenes. La hoja todavía estaba tibia.',
        },
        {
          who: 'teo',
          text: 'El registro publica el volumen, pero no dice si el mercado estaba en calma o bajo rumor. Tengo las señales por hora.',
        },
        {
          who: 'valentina',
          text: 'Nadie publica eso. Quien operaba solo podía deducirlo, señal por señal.',
        },
        { who: 'iris', text: 'Entonces revisemos qué podía saber cada día.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Las señales de la mesa',
      Scene: Investigation,
      beats: [
        {
          say: 'Valentina separó siete señales de volumen y dejó las órdenes a un lado. Para cada día, la mesa esperó: reconstruyamos primero los tres primeros.',
          gate: 'Para cada una de las tres primeras señales, pulsa Predecir y luego Corregir. Observa la creencia tras cada paso.',
          after:
            'Las tres primeras señales llevan la creencia de 0,2 a 0,673, luego a 0,338 y a 0,756 aproximadamente.',
        },
        {
          say: 'Quedan cuatro señales en la misma tira. Sigue desde la última creencia corregida para completar el registro.',
          gate: 'Completa los cuatro días restantes con Predecir y Corregir en ese orden.',
          after:
            'La curva ya incorpora las siete señales y las transiciones de esperar. Cada valor usa el resultado del día anterior.',
        },
        {
          say: 'Valentina vuelve a poner las órdenes junto a las señales. Las compras quedan registradas en los días indicados bajo la curva.',
          ask: {
            prompt: '¿Las compras coinciden con creencias superiores a 0,4?',
            options: ['Sí, todas', 'No, ninguna', 'Solo la primera'],
            answer: 0,
            explain:
              'Las seis compras aparecen con creencias superiores a 0,4. Esa coincidencia todavía necesita una explicación.',
          },
        },
        {
          say: 'La comisión podrá revisar cada cálculo con el registro a la vista. Valentina conserva las horas de compra junto a la curva.',
          note: {
            label: 'Reconstrucción de la cuenta',
            body: 'La creencia se predice con la acción y se corrige con la señal de cada día; las compras registradas coinciden con creencias sobre 0,4.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Actualizar la creencia', Comp: Practice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Teo alineó las órdenes con las cifras que Valentina acababa de anotar. La impresora dejó una franja blanca al borde de la última página.',
        },
        {
          who: 'valentina',
          text: 'Las compras caen sobre 0,4. El día sin compra queda bajo esa cifra.',
        },
        { who: 'tu', text: 'Podría ser una regla de la cuenta.' },
        { who: 'iris', text: 'Conserva también los días en que no compró.' },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [
  {
    id: 'dec-pomdp',
    world: 'decision',
    tex: '(S,A,T,r,\\Omega,O,\\gamma)',
    name: 'POMDP',
    read: 'proceso de decisión de Markov parcialmente observable',
    meaning: 'Modelo de decisión con estados ocultos y señales distribuidas según el estado.',
  },
  {
    id: 'dec-belief',
    world: 'decision',
    tex: 'b(s)=P(s\\mid\\text{historia})',
    name: 'Creencia',
    read: 'be de ese, probabilidad del estado dada la historia',
    meaning:
      'Distribución de probabilidad sobre estados dada la historia de acciones y observaciones.',
  },
  {
    id: 'dec-filter',
    world: 'decision',
    tex: "b'(s')=\\eta O(o\\mid s')\\sum_s T(s'\\mid s,a)b(s)",
    name: 'Filtro de creencia',
    read: 'be prima de ese prima, eta por observación y suma de transición por creencia',
    meaning: 'Predice con la acción y corrige con la observación, normalizando el resultado.',
  },
];
export const ref: TopicRef = {
  defs: [
    {
      label: 'POMDP',
      tex: '(S,A,T,r,\\Omega,O,\\gamma)',
      body: 'Estados, acciones, transición, recompensa, observaciones, modelo de observación y descuento, junto a una creencia inicial.',
    },
    {
      label: 'Creencia',
      tex: 'b(s)=P(s\\mid\\text{historia})',
      body: 'Distribución sobre los estados dada la historia de acciones y observaciones.',
    },
    {
      label: 'Predicción',
      tex: "\\bar b(s')=\\sum_s T(s'\\mid s,a)b(s)",
      body: 'Distribución del estado siguiente antes de observar, usando la acción elegida.',
    },
    {
      label: 'Corrección',
      tex: "b'(s)=\\eta O(o\\mid s)b(s)",
      body: 'Actualización bayesiana con el estado quieto; η normaliza las probabilidades.',
    },
  ],
  props: [
    {
      label: 'Filtro completo',
      tex: "b'(s')=\\eta O(o\\mid s')\\sum_s T(s'\\mid s,a)b(s)",
      body: 'Primero predice con la transición y luego corrige con la señal; η = 1/P(o | b, a).',
    },
    {
      label: 'Ejemplo',
      tex: 'b=0{,}2,\\ a=\\text{esperar}:\\quad \\bar b=0{,}34,\\quad P(\\text{alto})=0{,}404',
      body: 'Tras observar alto la creencia es 0,673; tras bajo es 0,114, aproximadamente.',
    },
  ],
};
