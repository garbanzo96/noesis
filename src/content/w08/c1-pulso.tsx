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
import { rng, randInt } from '../shared/rng';
import { Confirm, NumberField, parseProb } from '../shared/ui';
import { ACCENT, COUNTS, DiscreteDial, SplitTree, SymbolTray, info, num } from './kit';

function InformationLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [depth, setDepth] = useState(0),
    [settled, setSettled] = useState(false);
  const [selected, setSelected] = useState(3);
  const b = beats.beat;
  return (
    <Stage>
      {b < 2 ? (
        <SplitTree depth={b === 0 ? 1 : depth} progress={b === 0 && !reduced ? beats.at(0) : 1} />
      ) : (
        <SymbolTray
          counts={b === 5 ? [8, 0, 0, 0] : [4, 2, 1, 1]}
          selected={selected}
          onPick={setSelected}
          showInfo={b !== 3 || answer !== null}
        />
      )}
      {b === 0 && (
        <>
          <Cap x={1250} y={260}>
            Mitad iluminada
          </Cap>
          <Cap x={1250} y={350} tex="2\longrightarrow1\ \text{bit}" color={ACCENT} />
        </>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={250}>
            Quedan {8 / 2 ** depth} casilleros
          </Cap>
          <DiscreteDial
            value={depth}
            max={3}
            onChange={(n) => {
              setDepth(n);
              setSettled(false);
            }}
            onSettle={(n) => {
              setSettled(n === 3);
              if (n === 3 && 8 / 2 ** n === 1) unlock();
            }}
          />
          <Cap x={1250} y={590} color={settled ? C.green : C.muted} size={20}>
            {settled ? 'Tres respuestas; un casillero.' : 'Suelta la perilla en la marca 3.'}
          </Cap>
        </>
      )}
      {b >= 2 && (
        <>
          <Cap
            x={1250}
            y={220}
            tex={
              b === 5
                ? 'p(A)=1'
                : `p(${['A', 'B', 'C', 'D'][selected]})=\\frac{${[4, 2, 1, 1][selected]}}8`
            }
            color={ACCENT}
          />
          <Cap x={1250} y={320} tex="I(x)=-\log_2p(x)" />
          {(b !== 3 || answer !== null) && (
            <Cap
              x={1250}
              y={420}
              tex={`I=${b === 5 ? 0 : info([1 / 2, 1 / 4, 1 / 8, 1 / 8][selected])}\\ \\mathrm{bits}`}
              color={C.amber}
            />
          )}
          {b === 4 && (
            <>
              <Cap x={1250} y={530} size={20}>
                D es menos frecuente que A.
              </Cap>
              <Cap x={1250} y={620} size={19}>
                Los bits miden posibilidades descartadas.
              </Cap>
            </>
          )}
          {b === 5 && (
            <Cap x={1250} y={540} size={19}>
              p = 0 queda fuera del cálculo finito.
            </Cap>
          )}
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Información de un evento en bits',
  Scene: InformationLesson,
  beats: [
    {
      say: 'Una pregunta separa las posibilidades en dos mitades. Un **bit** alcanza para elegir entre dos posibilidades iguales.',
      dur: 3,
      board: {
        label: 'Una decisión binaria',
        tex: '\\p{1}{2\\ \\text{posibilidades}}\\longrightarrow\\p{2}{\\cC{1\\ \\text{bit}}}',
      },
    },
    {
      say: 'Parte con ocho casilleros. Cada respuesta conserva la mitad donde está la luz.',
      gate: 'Gira la perilla y suéltala en 3 hasta dejar un solo casillero.',
      board: {
        label: 'Partir en mitades',
        tex: '\\p{1}{8}\\to\\p{2}{4}\\to\\p{3}{2}\\to\\p{4}{\\cC{1}}',
      },
    },
    {
      say: 'A ocupa cuatro casilleros; B, dos; C y D, uno cada uno. La probabilidad es la fracción ocupada: el logaritmo cuenta cuántas mitades separan esa fracción del total.',
      dur: 3,
      board: {
        label: 'Información individual',
        tex: '\\p{1}{\\cA{I(x)}}=\\p{2}{-\\log_2\\cC{p(x)}}',
      },
    },
    {
      say: 'La misma partición permite medir cada grupo. Cuenta las mitades necesarias para llegar a D.',
      ask: {
        prompt: '¿Cuánta información trae D, con probabilidad 1/8?',
        options: ['1/8 bit', '3 bits', '8 bits'],
        answer: 1,
        explain: '$1/8=2^{-3}$: son tres mitades. 1/8 es la probabilidad; 8 cuenta casilleros.',
      },
      board: {
        label: 'Leer D',
        tex: '\\p{1}{I(D)}=\\p{2}{-\\log_2\\left(\\cC{\\tfrac18}\\right)}',
      },
    },
    {
      say: 'Un evento menos probable descarta más posibilidades. Eso no mide cuánto vale su contenido para la investigación.',
      dur: 3,
      board: {
        label: 'Rareza y bits',
        tex: '\\p{1}{\\cC{p_1}<p_2}\\Rightarrow\\p{2}{\\cA{I_1}>I_2}',
      },
    },
    {
      say: 'Si el evento estaba asegurado, observarlo agrega cero bits. Un evento de probabilidad cero tiene información infinita y queda fuera de este cálculo finito.',
      dur: 3,
      board: [
        { label: 'Evento seguro', tex: '\\p{1}{I(p=1)}=\\p{2}{\\cA{0}}' },
        { label: 'Dominio finito', tex: '\\p{1}{0}<\\p{2}{\\cC{p}}\\le\\p{3}{1}' },
      ],
    },
  ],
};
function MissingLine({ beats, answer }: DemoProps) {
  const reveal = answer !== null;
  return (
    <Stage>
      <SymbolTray counts={COUNTS} selected={3} />
      <Cap x={530} y={220}>
        Chip: {COUNTS.reduce((a, b) => a + b)} cabeceras íntegras
      </Cap>
      <Cap x={1250} y={230} color={ACCENT}>
        D: reserva de entrega
      </Cap>
      <Cap x={1250} y={320} tex="p(D)=\frac8{64}=\frac18" />
      <Cap x={1250} y={410} tex="p(A)=\frac{32}{64}=\frac12" />
      {reveal && (
        <Cap
          x={1250}
          y={510}
          color={C.amber}
          tex={beats.beat === 0 ? 'I(D)=3\\ \\mathrm{bits}' : 'I(D)-I(A)=3-1=2\\ \\mathrm{bits}'}
        />
      )}
      <Cap x={530} y={690} color={C.magenta}>
        Bitácora visible: las líneas D están vacías.
      </Cap>
    </Stage>
  );
}
function InformationPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 109 + round);
    return {
      k: randInt(r, round === 2 ? 0 : 1, round === 2 ? 3 : 4),
      a: randInt(r, 1, 2),
      d: randInt(r, 1, 2),
    };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const { k, a, d } = data;
  useEffect(() => {
    setValue('');
    api.prompt(
      round === 0
        ? `Un evento tiene $p=1/${2 ** k}$. ¿Cuánta información entrega, en bits?`
        : round === 1
          ? `Un evento tiene $p_1=1/${2 ** a}$ y otro $p_2=1/${2 ** (a + d)}$. ¿Cuántos bits más informa el segundo?`
          : `Un evento informa ${k} bits. Escribe su probabilidad exacta (puedes usar una fracción).`,
    );
    api.hints(
      round === 0
        ? ['Cuenta cuántas mitades llevan de uno a esa probabilidad.', 'Usa $I=-\\log_2p$.']
        : round === 1
          ? [
              'Calcula los bits de cada evento por separado.',
              'Resta los bits del primero a los del segundo.',
            ]
          : [
              'Despeja la probabilidad de $I=-\\log_2p$.',
              'Usa $p=2^{-I}$; un evento seguro tiene probabilidad uno.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseProb(value);
    if (v === null || !Number.isFinite(v)) return;
    const target = round === 0 ? k : round === 1 ? d : 2 ** -k;
    if (v === target)
      return api.result(
        true,
        round === 0
          ? `$-\\log_2(1/${2 ** k})=${k}$ bits.`
          : round === 1
            ? `$${a + d}-${a}=${d}$ bits más.`
            : `$p=2^{-${k}}=${k === 0 ? '1' : `1/${2 ** k}`}$.`,
      );
    if (round === 0 && (v === 2 ** -k || v === 2 ** k))
      return api.result(
        false,
        v === 2 ** -k
          ? 'Escribiste la probabilidad. Los bits cuentan las particiones, no la fracción ocupada.'
          : 'Contaste posibilidades. Cada bit divide por dos; busca el exponente.',
      );
    if (round === 1 && v === 2 ** d)
      return api.result(
        false,
        'Esa es la razón de probabilidades. La diferencia de bits es la resta de sus exponentes.',
      );
    if (round === 2 && k === 0 && v === 0)
      return api.result(
        false,
        'Cero bits significa que el evento estaba asegurado: su probabilidad es uno.',
      );
    if (round === 2 && k > 0 && v === 2 ** k)
      return api.result(
        false,
        'Perdiste el signo negativo: la probabilidad es 2 elevado al opuesto de los bits.',
      );
    api.result(
      false,
      round === 2
        ? 'Revisa el signo al despejar: $p=2^{-I}$.'
        : 'Cuenta las mitades; si comparas eventos, resta sus informaciones.',
    );
  };
  return (
    <Stage>
      <SplitTree
        depth={round === 0 ? Math.min(k, 3) : round === 1 ? Math.min(a + d, 3) : Math.min(k, 3)}
      />
      <Cap
        x={1250}
        y={250}
        tex={
          round === 0
            ? `p=\\frac1{${2 ** k}}`
            : round === 1
              ? `p_1=\\frac1{${2 ** a}},\\ p_2=\\frac1{${2 ** (a + d)}}`
              : `I=${k}\\ \\mathrm{bits}`
        }
        color={ACCENT}
      />
      <NumberField
        x={1060}
        y={410}
        label={round === 2 ? 'p =' : 'bits ='}
        value={value}
        onChange={setValue}
        onEnter={submit}
      />
      <Cap x={1250} y={530} size={18}>
        Ejercicio del terminal
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c1',
  world: 'information',
  code: '8.1',
  title: 'El pulso que falta',
  subtitle: 'Información de un evento en bits',
  glyph: 'I(x)',
  kind: 'level',
  guide: 'ines',
  teaser: 'El chip conserva una reserva de entrega que alguien omitió de la bitácora visible.',
  learn: 'Medir la información de un evento, comparar sus bits y recuperar su probabilidad.',
  glyphs: ['it-bit', 'it-information'],
  pitfalls: [
    'Probabilidad, conteo e información tienen unidades distintas.',
    'Una razón de probabilidades se convierte en una diferencia de bits.',
    'Cero bits corresponde a un evento seguro; p = 0 tiene información infinita.',
  ],
  notes: [
    {
      label: 'Distribución del lote',
      tex: 'p=(\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18)',
      body: 'Estas frecuencias describen las 64 cabeceras del chip, no toda la red.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Las Antenas, 03:40. El auricular de Inés cruje con la humedad; ella sostiene el cable junto al terminal.',
        },
        { who: 'ines', text: 'No desconectes ese cable. Ahí quedó la copia de mi turno.' },
        {
          who: 'teo',
          text: 'Hay pulsos, rutas y acuses… Espera, este símbolo tiene otra etiqueta.',
        },
        { who: 'iris', text: 'La etiqueta está. La línea del registro, vacía.' },
        { who: 'tu', text: 'Comparemos esa línea con lo que guardó el chip.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La línea borrada',
      Scene: MissingLine,
      beats: [
        {
          say: 'El chip conserva 64 cabeceras: 32 A, 16 B, 8 C y 8 D. La etiqueta pública de D es «reserva de entrega».',
          ask: {
            prompt: '¿Cuántos bits informa una cabecera D bajo esta distribución?',
            options: ['3', '8', '1'],
            answer: 0,
            explain: '$8/64=1/8$ y $-\\log_2(1/8)=3$. El 8 es el conteo y 1 corresponde a A.',
          },
          note: {
            label: 'Información de las cabeceras',
            tex: 'I(A)=1,\\quadI(B)=2,\\quadI(C)=I(D)=3',
          },
        },
        {
          say: 'D aparece menos que A. Compara los bits que entrega cada evento.',
          ask: {
            prompt: '¿Cuánto más informa D que A?',
            options: ['Cuatro veces en bits', '2 bits', '1/8 bit'],
            answer: 1,
            explain: '$3-1=2$ bits. La razón de probabilidades es cuatro; los bits se restan.',
          },
          note: { label: 'Reserva frente a pulso', tex: 'I(D)-I(A)=2\\ \\mathrm{bits}' },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir eventos', Comp: InformationPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Inés tapa con el pulgar el nombre del puerto de salida. El plástico mojado chirría bajo su mano.',
        },
        {
          who: 'ines',
          text: 'Esa reserva entró durante mi turno. Eso no quiere decir que la haya enviado yo.',
        },
        { who: 'teo', text: 'Guardo ambas copias. Las líneas vacías también.' },
        {
          who: 'nar',
          text: 'El contador de bits sigue subiendo, aunque la bitácora tenga huecos.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-bit',
    world: 'information',
    tex: '\\log_2 2=1',
    name: 'Bit',
    read: 'bit',
    meaning: 'Unidad de información: una decisión entre dos posibilidades igualmente probables.',
  },
  {
    id: 'it-information',
    world: 'information',
    tex: 'I(x)=-\\log_2p(x)',
    name: 'Información de un evento',
    read: 'información de equis',
    meaning: 'Cantidad de bits asociada a observar un evento de probabilidad p.',
    warn: 'La información es finita para 0 < p ≤ 1; p = 0 da infinito.',
  },
];
