import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  BinaryChannel,
  DiscreteDial,
  binaryEntropy,
  bscCapacity,
  fraction,
  num,
  parseExact,
} from './kit';

const PS = [0, 1 / 8, 1 / 4, 1 / 2];
const CAPACITY = bscCapacity(1 / 4);
export const entropyTex = (p: number) =>
  p === 1 / 8
    ? '3-\\tfrac78\\log_2 7'
    : p === 1 / 4
      ? '2-\\tfrac34\\log_2 3'
      : fraction(binaryEntropy(p));
export const capacityTex = (p: number) =>
  p === 1 / 8
    ? '-2+\\tfrac78\\log_2 7'
    : p === 1 / 4
      ? '-1+\\tfrac34\\log_2 3'
      : fraction(bscCapacity(p));

function CapacityBar({ p, rate }: { p: number; rate: number }) {
  const capacity = bscCapacity(p);
  return (
    <>
      <Cap x={530} y={650} size={19}>
        Capacidad y tasa · bits útiles por uso
      </Cap>
      <rect
        x={170}
        y={690}
        width={730}
        height={50}
        fill={C.panel}
        stroke={C.muted}
        strokeWidth={2}
      />
      <rect x={170} y={690} width={730 * capacity} height={50} fill={ACCENT} fillOpacity={0.7} />
      <line
        x1={170 + 730 * rate}
        x2={170 + 730 * rate}
        y1={680}
        y2={750}
        stroke={C.magenta}
        strokeWidth={4}
      />
      <Cap x={530} y={795} size={19} color={rate < capacity ? C.green : C.red}>
        {rate < capacity ? 'R bajo C' : 'R sobre C'} · el bloque requiere validación
      </Cap>
    </>
  );
}
function ChannelLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [index, setIndex] = useState(2),
    [rateIndex, setRateIndex] = useState(1);
  const [visited, setVisited] = useState(() => new Set<number>());
  const b = beats.beat,
    p = b === 1 ? PS[index] : 1 / 4,
    rate = rateIndex === 0 ? 1 / 8 : 1 / 4;
  return (
    <Stage>
      <BinaryChannel
        p={p}
        inputBalance={1 / 2}
        rate={rate}
        showReadings={false}
        showTraceNotes={b !== 5}
        progress={b === 0 && !reduced ? beats.at(0) : 1}
      />
      <Cap x={1250} y={190} tex={`p=${fraction(p)}`} color={ACCENT} />
      {b <= 1 && (
        <>
          <Cap x={1250} y={280} tex={`P(Y=X)=${fraction(1 - p)}`} size={21} />
          <Cap x={1250} y={370} tex={`P(Y\\ne X)=${fraction(p)}`} size={21} color={C.red} />
        </>
      )}
      {b === 1 && (
        <>
          <DiscreteDial
            value={index}
            max={3}
            y={470}
            labels={['0', '1/8', '1/4', '1/2']}
            onChange={setIndex}
            onSettle={(i) => {
              const next = new Set(visited);
              if (i === 0 || (i === 3 && next.has(0))) next.add(i);
              setVisited(next);
              if (i === 3 && next.has(0) && next.has(3)) unlock();
            }}
          />
          <Cap x={1250} y={610} size={18} color={visited.has(3) && index === 3 ? C.green : C.amber}>
            {visited.has(0) ? '0 visitado ✓ · ahora suelta en 1/2' : 'Primero suelta en 0'}
          </Cap>
          {index === 3 && (
            <Cap
              x={1250}
              y={700}
              tex={'P_{Y\\mid X}=\\begin{pmatrix}1/2&1/2\\\\1/2&1/2\\end{pmatrix}'}
              size={21}
            />
          )}
        </>
      )}
      {b === 2 && (
        <>
          <Cap x={1250} y={300}>
            Invertir: 1/4 · conservar: 3/4
          </Cap>
          <Cap x={1250} y={410} tex={`h_2(1/4)=${entropyTex(p)}`} size={21} />
          <Cap x={1250} y={520} tex={`h_2(1/4)\\approx${num(binaryEntropy(p))}`} color={C.amber} />
        </>
      )}
      {b === 3 && (
        <>
          <Cap x={1250} y={300} tex="H(Y)=1" />
          <Cap x={1250} y={400} tex="H(Y\mid X)=h_2(p)" size={21} />
          <Cap x={1250} y={510} tex="C=\max_{P_X}I(X;Y)" color={C.amber} />
          <Cap x={1250} y={610} size={18}>
            Entrada equilibrada: P(X = 1) = 1/2
          </Cap>
        </>
      )}
      {b === 4 && (
        <>
          <Cap x={1250} y={300} tex="C=1-h_2(1/4)" color={C.amber} />
          {answer !== null && (
            <>
              <Cap x={1250} y={410} tex={`C=${capacityTex(p)}`} size={21} />
              <Cap x={1250} y={520} tex={`C\\approx${num(CAPACITY)}`} color={C.green} />
            </>
          )}
        </>
      )}
      {b === 5 && (
        <>
          <CapacityBar p={p} rate={rate} />
          <Cap x={1250} y={280} tex={`C=${capacityTex(p)}`} size={21} />
          <Cap x={1250} y={380} tex={`R=${fraction(rate)}`} color={C.magenta} />
          <DiscreteDial
            value={rateIndex}
            max={1}
            y={480}
            labels={['1/8', '1/4']}
            onChange={setRateIndex}
          />
          <Cap x={1250} y={630} tex="C(0)=1,\ C(1/2)=0" size={21} />
          <Cap x={1250} y={730} tex="C(1)=1" color={C.green} />
        </>
      )}
    </Stage>
  );
}
export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Canal binario simétrico y capacidad',
  Scene: ChannelLesson,
  beats: [
    {
      say: 'Sigue cada luz entre los carriles. El **canal binario simétrico** invierte cada bit con probabilidad p; asumimos inversiones independientes entre usos, sin borrar ni insertar posiciones.',
      dur: 3,
      board: [
        { label: 'Inversión', tex: '\\p{1}{P(Y\\ne X)}=\\p{2}{\\cM{p}}', parts: ['probabilidad de inversión', 'ruido del canal'] },
        { label: 'Conservación', tex: '\\p{1}{P(Y=X)}=\\p{2}{1-\\cM{p}}', parts: ['probabilidad de conservar', 'complemento del ruido'] },
      ],
    },
    {
      say: 'Compara un canal que conserva todo con uno donde las dos salidas son igualmente probables para cualquier entrada.',
      gate: 'Suelta la perilla primero en 0 y después en 1/2. Las dos filas deben quedar iguales.',
      board: {
        label: 'Salida independiente',
        tex: '\\p{1}{p=\\tfrac12}\\Rightarrow\\p{2}{Y\\perp X}', parts: ['inversión equiprobable', 'salida independiente'],
      },
    },
    {
      say: 'Vuelve a p igual a un cuarto. La **entropía binaria** promedia la información de las dos decisiones: invertir y conservar.',
      dur: 3,
      board: {
        label: 'Entropía binaria',
        tex: '\\begin{aligned}\\p{1}{\\cA{h_2(p)}}&=\\p{2}{-p\\log_2p}\\\\&\\quad\\p{3}{-(1-p)\\log_2(1-p)}\\end{aligned}', parts: ['incertidumbre del ruido', 'aporte de invertir', 'aporte de conservar'],
      },
    },
    {
      say: 'Con entradas equiprobables, la salida tiene un bit de entropía. Resta lo pendiente dado X: la **capacidad** es la mayor información mutua por uso, alcanzada con entrada equilibrada.',
      dur: 3,
      board: {
        label: 'Capacidad del BSC',
        tex: '\\begin{aligned}\\p{1}{\\cC{C}}&=\\p{2}{\\max_{P_X}I(X;Y)}\\\\&=\\p{3}{1-\\cA{h_2(p)}}\\end{aligned}', parts: ['información máxima por uso', 'mejor reparto de entrada', 'bit menos ruido'],
      },
    },
    {
      say: 'Una de cuatro fichas representa inversión. Calcula la entropía de esa decisión y réstala de un bit.',
      ask: {
        prompt: 'Con p = 1/4, ¿cuál es la capacidad?',
        options: [
          '3/4 bit/uso',
          'Aproximadamente 0,1887 bits/uso',
          'Aproximadamente 0,8113 bits/uso',
        ],
        answer: 1,
        explain:
          '$h_2(1/4)=2-\\tfrac34\\log_2 3$. Al restar de uno queda aproximadamente 0,1887 bits/uso. El 3/4 mide acierto; 0,8113 es la entropía binaria.',
      },
      board: { label: 'Calcular antes de redondear', tex: '\\p{1}{C(1/4)}=\\p{2}{1-h_2(1/4)}', parts: ['capacidad que buscamos', 'con el ruido del caso'] },
    },
    {
      say: 'Compara las tasas. Bajo C existen códigos largos adecuados que hacen el error arbitrariamente pequeño; un bloque corto todavía puede fallar. Una inversión segura se deshace invirtiendo otra vez.',
      dur: 3,
      board: [
        {
          label: 'Tasa bajo capacidad',
          tex: '\\p{1}{\\cC{R<C}}:\\ \\p{2}{\\text{códigos adecuados}}', parts: ['tasa bajo el límite', 'error reducible con bloques'],
        },
        {
          label: 'Tasa sobre capacidad',
          tex: '\\p{1}{\\cM{R>C}}:\\ \\p{2}{\\text{error no arbitrariamente pequeño}}', parts: ['tasa sobre el límite', 'error que no desaparece'],
        },
      ],
    },
  ],
};
function ReserveDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <BinaryChannel
        p={1 / 4}
        inputBalance={1 / 2}
        rate={beats.beat === 0 ? 1 / 4 : 1 / 8}
        showReadings={false}
      />
      <Cap x={1250} y={190}>
        32 usos · 8 inversiones
      </Cap>
      <Cap x={1250} y={280} tex="\hat p=8/32=1/4" />
      <Cap x={1250} y={370}>
        100 usos/s · modelo sin memoria
      </Cap>
      <Cap x={1250} y={460} tex={beats.beat === 0 ? 'R=1/4' : 'R=1/8'} color={C.magenta} />
      {answer !== null && (
        <Cap
          x={1250}
          y={560}
          tex={`100C\\approx${num(100 * CAPACITY)}\\ \\mathrm{bits/s}`}
          color={C.green}
          size={21}
        />
      )}
      <Cap x={530} y={795} size={19}>
        Huecos «?» → copia local por cable · fuera del BSC
      </Cap>
      <Cap x={1250} y={660} size={18}>
        Antes: 1/16 · ahora: cuatro veces más
      </Cap>
    </Stage>
  );
}
function ChannelPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 149 + round);
    return {
      p: round === 1 ? pick(r, [1 / 8, 1 / 4]) : pick(r, PS),
      rate: pick(r, [1 / 8, 1 / 4, 1 / 2]),
      frequency: 16 * randInt(r, 1, 4),
    };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    api.prompt(
      round === 0
        ? `Con $p=${fraction(d.p)}$, calcula h₂(p) y C a cuatro decimales (o fracción exacta en los bordes).`
        : round === 1
          ? `Con $p=${fraction(d.p)}$ y $R=${fraction(d.rate)}$, compara R con C usando el valor exacto.`
          : `El terminal hace ${d.frequency} usos/s. Calcula la capacidad en bits/s con p = 0 y después con p = 1/2.`,
    );
    api.hints(
      round === 0
        ? [
            'Incluye p y su complemento en la entropía.',
            'La capacidad es uno menos la entropía binaria; redondea al final.',
          ]
        : round === 1
          ? [
              'Compara cantidades en bits útiles por uso.',
              'Evalúa el logaritmo antes de comparar; no redondees a cero o uno.',
            ]
          : [
              'Multiplica usos por segundo por bits útiles por uso.',
              'Con p = 1/2, la salida es independiente de la entrada.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 1) {
      if (choice === null) return;
      const target = d.rate < bscCapacity(d.p) ? 'Bajo C' : 'Sobre C';
      return api.result(
        choice === target,
        choice === target
          ? `$R=${fraction(d.rate)}$, $C=${capacityTex(d.p)}\\approx${num(bscCapacity(d.p))}$: ${target.toLowerCase()}.`
          : 'Compara con C antes de redondear: la probabilidad de acierto 1 − p tampoco es capacidad.',
      );
    }
    const a = parseExact(first),
      b = parseExact(second);
    if (a === null || b === null) return;
    const h = binaryEntropy(d.p),
      c = bscCapacity(d.p);
    if (round === 0) {
      if (Math.abs(a - h) <= 0.0001 && Math.abs(b - c) <= 0.0001)
        return api.result(
          true,
          `$h_2(p)=${entropyTex(d.p)}\\approx${num(h)}$; $C=${capacityTex(d.p)}\\approx${num(c)}$.`,
        );
      if (Math.abs(b - (1 - d.p)) <= 0.0001 && b !== c)
        return api.result(
          false,
          'Usaste la probabilidad de acierto como capacidad. Resta de uno la entropía binaria, no p.',
        );
      if (Math.abs(a - (d.p === 0 ? 0 : -d.p * Math.log2(d.p))) <= 0.0001 && a !== h)
        return api.result(
          false,
          'Falta el término del complemento: conservar también aporta incertidumbre.',
        );
      return api.result(
        false,
        'Revisa ambos términos de h₂; después calcula C = 1 − h₂. Usa cuatro decimales.',
      );
    }
    return api.result(
      a === d.frequency && b === 0,
      a === d.frequency && b === 0
        ? `${d.frequency} × 1 = ${d.frequency} bits/s; ${d.frequency} × 0 = 0 bits/s.`
        : b === d.frequency
          ? 'Con p = 1/2 hay usos del canal, pero cada salida deja de informar sobre la entrada: la capacidad útil vale cero.'
          : 'La frecuencia mide usos/s. Multiplica por C(0) = 1 y por C(1/2) = 0, respectivamente.',
    );
  };
  return (
    <Stage>
      <BinaryChannel
        p={round === 2 ? 0 : d.p}
        inputBalance={1 / 2}
        rate={d.rate}
        showReadings={false}
      />
      <Cap
        x={1250}
        y={200}
        tex={round === 2 ? `f=${d.frequency}\\ \\mathrm{usos/s}` : `p=${fraction(d.p)}`}
        color={ACCENT}
      />
      {round === 1 ? (
        <>
          <Cap x={1250} y={300} tex={`R=${fraction(d.rate)}`} color={C.magenta} />
          <Cap x={1250} y={400} tex={`C=${capacityTex(d.p)}`} size={21} />
          <Choices
            x={1250}
            y={520}
            options={['Bajo C', 'Sobre C']}
            value={choice}
            onPick={setChoice}
          />
        </>
      ) : (
        <>
          {round === 0 && (
            <Cap x={1250} y={300} size={19}>
              Ambos términos: p y 1 − p
            </Cap>
          )}
          <NumberField
            x={1050}
            y={430}
            label={round === 0 ? 'h₂ =' : 'C(0) ='}
            value={first}
            onChange={setFirst}
            onEnter={submit}
            width={4}
          />
          <NumberField
            x={1050}
            y={540}
            label={round === 0 ? 'C =' : 'C(1/2) ='}
            value={second}
            onChange={setSecond}
            onEnter={submit}
            width={4}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c7',
  world: 'information',
  code: '8.7',
  title: 'La tasa imposible',
  subtitle: 'Canal binario simétrico y capacidad',
  glyph: 'C=1-h_2(p)',
  kind: 'level',
  guide: 'ines',
  teaser:
    'El enlace conserva el largo de los paquetes, pero sus comprobaciones fallan. La nueva tasa quedó guardada.',
  learn: 'Calcular entropía binaria y capacidad, comparar tasas y separar inversiones de huecos.',
  glyphs: ['it-binary-entropy', 'it-capacity'],
  pitfalls: [
    'La probabilidad de acierto no es capacidad.',
    'El BSC cambia bits; los huecos marcados requieren otro procedimiento.',
    'Estar bajo C permite fiabilidad con códigos adecuados, sin garantizar cada bloque corto.',
    'La calibración estima p; la independencia es una hipótesis del modelo.',
  ],
  notes: [
    {
      label: 'Capacidad exacta',
      tex: 'C=-1+\\tfrac34\\log_2 3\\approx0{,}1887',
      body: 'Bits útiles por uso del canal de inversiones modelado.',
    },
    {
      label: 'Tasas del terminal',
      tex: '\\begin{aligned}100/16&=6{,}25\\\\100/4&=25\\\\100/8&=12{,}5\\end{aligned}',
      body: 'Bits útiles por segundo. Se multiplica la capacidad exacta antes de redondear.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Acceso al mástil de reserva, 05:50. El viento silba por un pasacables; Inés mantiene la mano lejos del reinicio.',
        },
        { who: 'ines', text: 'Está pidiendo más de lo que este enlace puede cargar.' },
        { who: 'teo', text: 'Tengo huecos y tengo bits cambiados. Los voy a separar.' },
        { who: 'iris', text: 'Copia la configuración. Después haces la prueba en el terminal.' },
        {
          who: 'nar',
          text: 'La configuración nueva conserva la misma cuenta que cambió el perfil.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El enlace de reserva',
      Scene: ReserveDemo,
      beats: [
        {
          say: 'La calibración envió 16 ceros y 16 unos; se invirtieron cuatro de cada tipo. Adoptamos p = 1/4 y un BSC sin memoria: independencia asumida. Los huecos se solicitan aparte a la copia local.',
          ask: {
            prompt: 'La configuración pide 25 bits útiles por segundo. ¿Qué dice el modelo?',
            options: [
              'Es fiable porque acierta tres de cada cuatro bits',
              'Supera el máximo de aproximadamente 18,8722 bits/s',
              'La capacidad es 81,1278 bits/s',
            ],
            answer: 1,
            explain:
              '100 usos/s por la capacidad exacta da aproximadamente 18,8722 bits/s. El 25 sale de 100/4; 81,1278 usa la entropía binaria en vez de C.',
          },
          note: {
            label: 'Calibración y límite',
            tex: '\\hat p=8/32=1/4,\\quad100C\\approx18{,}8722\\ \\mathrm{bits/s}',
          },
        },
        {
          say: 'La tasa anterior era 1/16 bit útil por uso. La nueva, 1/4, es cuatro veces mayor; prueba ahora 1/8 en la copia de configuración.',
          ask: {
            prompt: '¿Qué afirmación sobre bajar a R = 1/8 es correcta?',
            options: [
              'Queda bajo C; faltan un código adecuado y validación',
              'Garantiza cero errores en cada bloque',
              'Sigue sobre C porque 1/8 supera 0,1887',
            ],
            answer: 0,
            explain:
              '1/8 = 0,125 queda bajo la capacidad exacta. Eso permite códigos adecuados para fiabilidad, sin garantizar este paquete corto.',
          },
          note: {
            label: 'Tasa de prueba',
            tex: 'R=1/8<C(1/4)',
            body: 'La comparación corresponde al canal de inversiones; el servicio completo también tuvo huecos.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir el enlace', Comp: ChannelPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Teo conecta el cable de servicio. La carcasa mojada deja un círculo oscuro sobre la mesa.',
        },
        {
          who: 'teo',
          text: 'Los huecos se pueden pedir de nuevo. Estos otros bloques ya están acá, con sus comprobaciones.',
        },
        { who: 'ines', text: 'Guarda también los que fallen. Mi turno quedó entre esos archivos.' },
        {
          who: 'nar',
          text: 'La carpeta conserva el cuerpo cifrado de una reserva de entrega; dos bloques cortos siguen rojos.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [
  {
    id: 'it-binary-entropy',
    world: 'information',
    tex: 'h_2(p)=-p\\log_2p-(1-p)\\log_2(1-p)',
    name: 'Entropía binaria',
    read: 'hache sub dos de pe',
    meaning:
      'Información media de una decisión binaria con probabilidades p y 1 − p; los aportes de probabilidad cero valen cero.',
  },
  {
    id: 'it-capacity',
    world: 'information',
    tex: 'C=\\max_{P_X}I(X;Y)=1-h_2(p)',
    name: 'Capacidad del BSC',
    read: 'ce igual a uno menos hache sub dos de pe',
    meaning:
      'Mayor información mutua por uso del canal binario simétrico sin memoria; se alcanza con entrada equilibrada.',
    warn: 'Bajo C hacen falta códigos adecuados. Los huecos y la autenticidad requieren comprobaciones aparte.',
  },
];
