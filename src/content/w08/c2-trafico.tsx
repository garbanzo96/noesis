import { useEffect, useMemo, useState } from 'react';
import { Stage } from '../../engine/Stage';
import { C } from '../../engine/palette';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { rng, randInt, pick, shuffle } from '../shared/rng';
import { Choices, Confirm, NumberField, parseProb } from '../shared/ui';
import {
  ACCENT,
  COUNTS,
  P,
  SourceBars,
  SymbolTray,
  entropy,
  fmtComma,
  info,
  num,
  sum,
} from './kit';

function EntropyLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [counts, setCounts] = useState([4, 2, 1, 1]);
  const [mode, setMode] = useState<'Original' | 'Uniforme'>('Original');
  const b = beats.beat,
    ps =
      b === 1
        ? counts.map((n) => n / 8)
        : b === 5
          ? [1, 0, 0, 0]
          : b === 4 && mode === 'Uniforme'
            ? [1 / 4, 1 / 4, 1 / 4, 1 / 4]
            : P;
  return (
    <Stage>
      {b === 0 ? (
        <>
          <SymbolTray counts={[4, 2, 1, 1]} y={230} showInfo />
          {[4, 2, 1, 1].map((n, i) => (
            <g key={i}>
              {Array.from({ length: n }, (_, j) => (
                <rect
                  key={j}
                  x={180 + i * 185 + j * 35}
                  y={560}
                  width={[1, 2, 3, 3][i] * 10}
                  height={80}
                  fill={ACCENT}
                  fillOpacity={0.2}
                  stroke={ACCENT}
                />
              ))}
              <Cap x={250 + i * 185} y={710} size={18}>
                {n} × {[1, 2, 3, 3][i]} bits
              </Cap>
            </g>
          ))}
        </>
      ) : (
        <SourceBars
          probabilities={ps}
          reveal={b !== 3 || answer !== null}
          progress={b === 2 && !reduced ? beats.at(2) : 1}
          onTransfer={
            b === 1
              ? (from, to) => {
                  const next = [...counts];
                  if (next[from] === 0) return;
                  next[from]--;
                  next[to]++;
                  setCounts(next);
                  if (sum(next) === 8 && next.every((n) => n === 2)) unlock();
                }
              : undefined
          }
        />
      )}
      {b === 0 && (
        <>
          <Cap x={1250} y={240}>
            Cada aparición aporta sus bits.
          </Cap>
          <Cap x={1250} y={330} tex="\text{media}=\frac{\text{total}}{\text{cantidad}}" />
        </>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={450} size={21}>
            Conteos: ({counts.join(', ')})
          </Cap>
          <Cap x={1250} y={540} size={19} color={counts.every((n) => n === 2) ? C.green : C.muted}>
            {counts.every((n) => n === 2)
              ? 'Reparto uniforme confirmado.'
              : 'Total conservado: ocho fichas.'}
          </Cap>
          <Cap x={1250} y={630} size={18}>
            Cada ficha transfiere 1/8.
          </Cap>
        </>
      )}
      {b === 2 && <Cap x={1250} y={350} tex="\sum_x p(x)I(x)" color={C.amber} />}
      {b === 3 && (
        <>
          <Cap x={1250} y={350}>
            Total: {sum([4, 2, 1, 1].map((n, i) => n * info(P[i])))} bits
          </Cap>
          <Cap x={1250} y={450}>
            Cantidad: {sum([4, 2, 1, 1])} símbolos
          </Cap>
          <Cap x={1250} y={550} tex="H=\frac{\text{total}}{\text{cantidad}}" />
        </>
      )}
      {b === 4 && (
        <>
          <Choices
            x={1250}
            y={430}
            options={['Original', 'Uniforme']}
            value={mode}
            onPick={(v) => setMode(v as typeof mode)}
          />
          <Cap x={1250} y={550} tex="H\le\log_2 4=2" color={C.amber} />
        </>
      )}
      {b === 5 && (
        <Cap x={1250} y={400} size={20}>
          Una sola etiqueta; nada pendiente.
        </Cap>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Entropía de una fuente',
  Scene: EntropyLesson,
  beats: [
    {
      say: 'Cada aparición aporta su cantidad de bits. Para hallar la media cuenta también cuántas veces aparece.',
      dur: 3,
      board: {
        label: 'Media por símbolo',
        tex: '\\p{1}{\\text{media}}=\\p{2}{\\frac{\\cA{\\text{total}}}{\\cC{\\text{cantidad}}}}',
        parts: ['información por símbolo', 'bits entre símbolos'],
      },
    },
    {
      say: 'Mueve fichas entre bandejas sin cambiar el total. Al soltar se recalculan las probabilidades y los bits de cada evento.',
      gate: 'Arrastra una ficha de A a C y otra de A a D; suéltalas en los círculos destino hasta obtener (2,2,2,2).',
      board: {
        label: 'Fuente uniforme',
        tex: '\\p{1}{p_A=p_B}=\\p{2}{p_C=p_D}=\\p{3}{\\cC{\\tfrac14}}',
        parts: ['probabilidades de a y b', 'probabilidades de c y d', 'probabilidad por símbolo'],
      },
    },
    {
      say: 'Vuelve el reparto original. La **entropía** es la información media por símbolo: suma los aportes de todas las etiquetas.',
      dur: 3,
      board: [
        {
          label: 'Entropía como media',
          tex: '\\p{1}{\\cA{H(X)}}=\\p{2}{\\sum_x\\cC{p(x)}I(x)}',
          parts: ['información media', 'aportes según frecuencia'],
        },
        {
          label: 'Definición en base dos',
          tex: '\\p{1}{H(X)}=\\p{2}{-\\sum_xp(x)\\log_2p(x)}',
          parts: ['información media', 'promedio de rarezas'],
        },
      ],
    },
    {
      say: 'Las ocho fichas aportan catorce bits. Divide el total por la cantidad de símbolos.',
      ask: {
        prompt: '¿Cuál es la entropía del reparto original?',
        options: ['9 bits/símbolo', '3 bits/símbolo', '1,75 bits/símbolo'],
        answer: 2,
        explain:
          '$14/8=7/4=1{,}75$. El 9 suma los bits de las etiquetas sin ponderar; el 3 es solo el máximo individual.',
      },
      board: {
        label: 'Ponderar antes de sumar',
        tex: '\\begin{aligned}\\p{1}{H}&=\\p{2}{\\tfrac12\\cdot1+\\tfrac14\\cdot2}\\\\&\\quad+\\p{3}{\\tfrac18\\cdot3+\\tfrac18\\cdot3}\\end{aligned}',
        parts: ['entropía de la fuente', 'aportes de a y b', 'aportes de c y d'],
      },
    },
    {
      say: 'Alterna los repartos. Con cuatro símbolos, el uniforme alcanza el máximo de dos bits por símbolo; si uno domina, quedan menos decisiones pendientes en promedio.',
      dur: 3,
      board: {
        label: 'Cota uniforme',
        tex: '\\p{1}{\\cA{H(X)}}\\le\\p{2}{\\log_2\\cC{m}},\\quad\\p{3}{H_{\\max}(4)=2}',
        parts: [
          'entropía de la fuente',
          'máximo con símbolos iguales',
          'máximo para cuatro símbolos',
        ],
      },
    },
    {
      say: 'Todas las fichas pasan a A. Una fuente que siempre emite lo mismo tiene entropía cero; las bandejas vacías aportan cero.',
      dur: 3,
      board: [
        {
          label: 'Fuente constante',
          tex: '\\p{1}{H(1,0,0,0)}=\\p{2}{\\cA{0}}',
          parts: ['entropía sin variación', 'información que agrega'],
        },
        {
          label: 'Convención en cero',
          tex: '\\p{1}{0\\log_2 0}:=\\p{2}{0}',
          parts: ['aporte de bandejas vacías', 'aporte nulo'],
        },
      ],
    },
  ],
};
function CounterDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <SymbolTray counts={COUNTS} />
      <Cap x={530} y={230}>
        Distribución del lote íntegro del chip
      </Cap>
      <Cap x={1250} y={230} tex="H(P)=\frac74\ \mathrm{bits/símbolo}" color={ACCENT} />
      <Cap x={1250} y={330}>
        Contador fijo: {sum(COUNTS) * 2} bits
      </Cap>
      <Cap x={1250} y={430}>
        Cantidad: {sum(COUNTS)} cabeceras
      </Cap>
      {answer !== null && (
        <Cap
          x={1250}
          y={540}
          tex={
            beats.beat === 0
              ? `64H(P)=${sum(COUNTS) * entropy(P)}\\ \\mathrm{bits}`
              : 'H_{\\max}=\\log_2 4=2'
          }
          color={C.amber}
        />
      )}
      <Cap x={530} y={690} size={20}>
        Falta comprobar un código de prefijo que alcance H.
      </Cap>
    </Stage>
  );
}
function EntropyPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 113 + round),
      k = randInt(r, 1, 3),
      t = randInt(r, 1, 4);
    const ps = pick(r, [[1 / 2, 1 / 2], [1 / 2, 1 / 4, 1 / 4], P]);
    const labels = shuffle(
      r,
      ps.map((_, i) => String.fromCharCode(65 + i)),
    );
    return { k, t, ps, labels };
  }, [seed, round]);
  const { k, t, ps, labels } = data;
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    api.prompt(
      round === 0
        ? `Una fuente tiene ${2 ** k} símbolos equiprobables. ¿Cuál es su entropía en bits por símbolo?`
        : round === 1
          ? 'Promedia los bits individuales del reparto mostrado. Escribe la media exacta como decimal o fracción.'
          : `Un lote tiene ${8 * t} símbolos, con conteos (${[4 * t, 2 * t, t, t].join(', ')}). ¿Cuántos bits ahorra frente a palabras fijas de dos bits si el código alcanza H?`,
    );
    api.hints(
      round === 0
        ? [
            'En un reparto uniforme, todos los eventos informan lo mismo.',
            'Calcula el logaritmo base dos del número de símbolos.',
          ]
        : round === 1
          ? [
              'Multiplica los bits de cada etiqueta por su probabilidad.',
              'Suma esos aportes; las etiquetas cambiadas no alteran sus frecuencias.',
            ]
          : [
              'Calcula primero la longitud del código que alcanza la entropía.',
              'Resta ese tamaño al tamaño fijo del lote.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const target = round === 0 ? k : round === 1 ? entropy(ps) : 8 * t * (2 - entropy(P));
  const submit = () => {
    const v = parseProb(value);
    if (v === null || !Number.isFinite(v)) return;
    if (v === target)
      return api.result(
        true,
        round === 2
          ? `$${8 * t}\\cdot2-${8 * t}\\cdot\\tfrac74=${target}$ bits ahorrados.`
          : `$H=${num(target)}$ bits/símbolo.`,
      );
    if (round === 0 && v === 2 ** k)
      return api.result(
        false,
        'Ese es el número de símbolos. La entropía cuenta las decisiones binarias para distinguirlos.',
      );
    if (round === 1 && v === sum(ps.map(info)))
      return api.result(
        false,
        'Sumaste los bits sin ponderar. Multiplica cada información por la probabilidad de su etiqueta.',
      );
    if (round === 2 && v === 14 * t)
      return api.result(
        false,
        'Ese es el tamaño comprimido. El ahorro es el tamaño fijo menos el comprimido.',
      );
    if (round === 2 && v === 8 * t)
      return api.result(
        false,
        'Aplicaste el ahorro de la rama más corta a todo el lote. Promedia las longitudes con sus frecuencias.',
      );
    api.result(
      false,
      round === 0
        ? 'Busca el exponente de dos que da el número de símbolos.'
        : round === 1
          ? 'Usa la media ponderada, no el máximo individual ni la media entre etiquetas.'
          : 'Compara los dos tamaños del mismo lote: fijo y comprimido.',
    );
  };
  return (
    <Stage>
      <SourceBars
        probabilities={round === 0 ? Array(2 ** k).fill(1 / 2 ** k) : round === 1 ? ps : P}
        labels={round === 1 ? labels : undefined}
        reveal={false}
      />
      {round === 2 && (
        <Cap x={530} y={200}>
          Conteos: ({[4 * t, 2 * t, t, t].join(', ')})
        </Cap>
      )}
      <Cap x={1250} y={240} size={21}>
        {round === 0
          ? 'Fuente uniforme'
          : round === 1
            ? 'Cada aporte pesa su probabilidad'
            : 'Fijo: dos bits por símbolo'}
      </Cap>
      <NumberField
        x={1060}
        y={410}
        label={round === 2 ? 'ahorro =' : 'H ='}
        unit={round === 2 ? 'bits' : undefined}
        value={value}
        onChange={setValue}
        onEnter={submit}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c2',
  world: 'information',
  code: '8.2',
  title: 'El tamaño del tráfico',
  subtitle: 'Entropía de una fuente',
  glyph: 'H(X)',
  kind: 'level',
  guide: 'ines',
  teaser:
    'El terminal exige calcular el espacio para copiar el tráfico sin cortar el servicio del barrio.',
  learn:
    'Calcular la entropía como media ponderada, reconocer su máximo y estimar el tamaño de un lote.',
  glyphs: ['it-entropy', 'it-uniform'],
  pitfalls: [
    'La entropía pondera los bits por la frecuencia de cada símbolo.',
    'El máximo depende del número de símbolos y exige un reparto uniforme.',
    'El tamaño comprimido y el ahorro son cantidades distintas.',
  ],
  notes: [
    {
      label: 'Exceso del contador fijo',
      tex: '64\\cdot2-112=16\\ \\mathrm{bits}',
      body: 'La entropía da una cota inferior de longitud media para un código de prefijo; hay que construirlo.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Caseta de Las Antenas, cinco para las cuatro. Un ventilador rozaba su rejilla, y Teo tenía el dedo suspendido sobre el botón de copia.',
        },
        { who: 'teo', text: 'Cabe, si ese contador mide lo que dice medir.' },
        {
          who: 'ines',
          text: 'Si lo llenas, se cae el repetidor, y la gente de abajo usa esta red.',
        },
        { who: 'iris', text: 'Entonces revisa la unidad antes de apretar nada.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El contador de la caseta',
      Scene: CounterDemo,
      beats: [
        {
          say: 'El contador reserva 128 bits para palabras fijas de dos bits. El lote conserva el reparto (32,16,8,8).',
          ask: {
            prompt: '¿Cuánta información suma el lote bajo ese reparto?',
            options: ['128 bits', '112 bits', '64 bits'],
            answer: 1,
            explain: '$64\\cdot7/4=112$. El 128 usa longitud fija y el 64 asigna un bit a todos.',
          },
          note: {
            label: 'Información del lote',
            tex: '64H(P)=64\\cdot\\tfrac74=112\\ \\mathrm{bits}',
          },
        },
        {
          say: 'Compara la fuente observada con un reparto equiprobable de las cuatro etiquetas.',
          ask: {
            prompt: '¿Cuál sería la entropía máxima con estas cuatro etiquetas?',
            options: ['2 bits/símbolo', '4 bits/símbolo', '1,75 bits/símbolo'],
            answer: 0,
            explain: '$\\log_2 4=2$; exige probabilidades iguales. El lote actual tiene $H=7/4$.',
          },
          note: {
            label: 'Máximo con cuatro etiquetas',
            tex: 'H_{\\max}=\\log_2 4=2\\ \\mathrm{bits/símbolo}',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Dimensionar la copia', Comp: EntropyPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'El ventilador dejó de rozar por un segundo. En el terminal apareció un perfil instalado de palabras de largo variable.',
        },
        { who: 'teo', text: 'El código cambió, y el contador sigue contando con el anterior.' },
        { who: 'ines', text: 'Abre el árbol. Ahí se ve quién tiene la rama corta.' },
        {
          who: 'nar',
          text: 'La reserva de espacio seguía fija. Debajo, el perfil llevaba la hora de un turno.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-entropy',
    world: 'information',
    tex: 'H(X)=-\\sum_xp(x)\\log_2p(x)',
    name: 'Entropía',
    read: 'hache de equis',
    meaning:
      'Información media por símbolo de una fuente, en bits cuando el logaritmo es base dos.',
    warn: 'Adopta 0 log₂ 0 = 0; pondera por las probabilidades.',
  },
  {
    id: 'it-uniform',
    world: 'information',
    tex: 'H(X)\\le\\log_2m',
    name: 'Máximo uniforme',
    read: 'hache de equis menor o igual al logaritmo de eme',
    meaning: 'Para m símbolos, el reparto equiprobable alcanza la entropía máxima.',
  },
];
