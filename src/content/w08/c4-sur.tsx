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
import { randInt, rng } from '../shared/rng';
import { Choices, Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  parseExact,
  JointGrid,
  ROUTE_COUNTS,
  ROUTE_TABLE,
  conditionalEntropy,
  jointEntropy,
  sum,
} from './kit';

const ROWS = ['Norte', 'Sur'];
const COLS = ['a', 'b', 'c', 'd'];
const CLASS_COUNTS = ROUTE_COUNTS.map((row) => row.map((n) => n / 2));
const HYX = conditionalEntropy(ROUTE_TABLE);

function JointLesson({ beats, unlock, reduced }: DemoProps) {
  const [filter, setFilter] = useState<number | undefined>();
  const [tower, setTower] = useState('Norte');
  const b = beats.beat;
  const row = b === 1 ? filter : b === 3 ? ROWS.indexOf(tower) : b === 4 ? 1 : undefined;
  return (
    <Stage>
      <JointGrid
        counts={CLASS_COUNTS}
        rows={ROWS}
        columns={COLS}
        filter={row}
        columnFilter={b === 5 ? 3 : undefined}
        showInfo={b === 2}
        progress={b === 0 && !reduced ? beats.at(0) : 1}
        onFilter={
          b === 1
            ? (i) => {
                setFilter(i);
                const ps = CLASS_COUNTS[i].map((n) => n / sum(CLASS_COUNTS[i]));
                if (i === 1 && ps[2] === 1 / 2 && ps[3] === 1 / 2) unlock();
              }
            : undefined
        }
      />
      <Cap x={1250} y={230} color={ACCENT}>
        X = torre
      </Cap>
      <Cap x={1250} y={320} color={C.amber}>
        Y = ruta
      </Cap>
      {b === 0 && (
        <Cap x={1250} y={430}>
          Ocho fichas; cuatro pares posibles.
        </Cap>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={430} tex="p(y\mid x)=\frac{p(x,y)}{p(x)}" />
          <Cap x={1250} y={540} size={20} color={filter === 1 ? C.green : C.amber}>
            {filter === 1 ? 'Sur confirmado: c y d pesan 1/2.' : 'Suelta Sur en el círculo Filtro.'}
          </Cap>
        </>
      )}
      {b === 2 && (
        <>
          <Cap x={1250} y={430} tex="p(x,y)=\frac14" />
          <Cap x={1250} y={540} tex={`H(X,Y)=${jointEntropy(ROUTE_TABLE)}`} color={C.magenta} />
        </>
      )}
      {b === 3 && (
        <>
          <Choices x={1250} y={420} options={ROWS} value={tower} onPick={setTower} />
          <Cap x={1250} y={530} tex={`H(Y\\mid X=x)=${HYX}`} />
          <Cap x={1250} y={640} tex="H(Y\mid X)=\frac12\cdot1+\frac12\cdot1" size={21} />
        </>
      )}
      {b === 4 && <Cap x={1250} y={450} tex="H(X,Y)=H(X)+H(Y\mid X)" size={21} />}
      {b === 5 && (
        <>
          <Cap x={1250} y={430} tex="p(S\mid d)=1" color={ACCENT} />
          <Cap x={1250} y={540} tex="H(X\mid Y)=0" />
          <Cap x={1250} y={650} tex="H(X,Y)=2+0=2" />
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Entropía conjunta y condicional',
  Scene: JointLesson,
  beats: [
    {
      say: 'Un resultado completo dice torre y ruta juntas. Cuenta las celdas posibles; las rayadas nunca reciben fichas en esta tabla.',
      dur: 3,
      board: {
        label: 'Probabilidad conjunta',
        tex: '\\p{1}{\\cC{p(x,y)}}=\\p{2}{\\frac{\\text{fichas de la celda}}{\\text{total de fichas}}}',
        parts: ['probabilidad del par', 'proporción de la celda'],
      },
    },
    {
      say: 'Filtrar cambia el grupo que usas como total. Dentro de Sur, c y d ocupan cada una la mitad: esa es su probabilidad **condicional**.',
      gate: 'Arrastra la ficha Sur al círculo Filtro y suéltala para mostrar las dos probabilidades 1/2.',
      board: {
        label: 'Renormalizar una fila',
        tex: '\\p{1}{\\cA{p(y\\mid x)}}=\\p{2}{\\frac{\\cC{p(x,y)}}{\\cM{p(x)}}}',
        body: 'Requiere p(x) > 0.',
        parts: ['probabilidad tras filtrar', 'proporción dentro de torre'],
      },
    },
    {
      say: 'Quita el filtro. La **entropía conjunta** promedia la información de los cuatro pares posibles; cada par pesa un cuarto.',
      dur: 3,
      board: [
        {
          label: 'Entropía conjunta',
          tex: '\\p{1}{H(X,Y)}=\\p{2}{-\\sum_{x,y}p(x,y)\\log_2p(x,y)}',
          parts: ['información media del par', 'rareza media de pares'],
        },
        {
          label: 'Cuatro pares equiprobables',
          tex: '\\p{1}{H(X,Y)}=\\p{2}{4\\cdot\\tfrac14\\cdot2}=\\p{3}{\\cM{2}}',
          parts: ['información media del par', 'con los cuatro pares', 'bits por par'],
        },
      ],
    },
    {
      say: 'Alterna las torres. Cada fila deja una decisión binaria sobre la ruta; la **entropía condicional** promedia esas decisiones con el peso de cada torre.',
      dur: 3,
      board: [
        {
          label: 'Entropía condicional',
          tex: '\\p{1}{H(Y\\mid X)}=\\p{2}{\\sum_x\\cC{p(x)}H(Y\\mid X=x)}',
          parts: ['incertidumbre restante', 'promedio entre torres'],
        },
        {
          label: 'Promedio entre filas',
          tex: '\\p{1}{\\tfrac12\\cdot1}+\\p{2}{\\tfrac12\\cdot1}=\\p{3}{\\cA{1}}',
          parts: ['aporte de norte', 'aporte de sur', 'bits restantes de ruta'],
        },
      ],
    },
    {
      say: 'Ordena primero por torre y después por ruta. La **regla de la cadena** reparte la información del par en lo que sabes primero y lo que queda pendiente.',
      ask: {
        prompt: 'Si ya sabes que salió de Sur, ¿cuánto queda por saber de la ruta?',
        options: ['2 bits', '1 bit', '0 bits'],
        answer: 1,
        explain:
          'Quedan c y d equiprobables. El 2 ignora el filtro; el 0 confunde conocer la torre con conocer la ruta.',
      },
      board: {
        label: 'Regla de la cadena',
        tex: '\\p{1}{\\cM{H(X,Y)}}=\\p{2}{\\cC{H(X)}}+\\p{3}{\\cA{H(Y\\mid X)}}',
        parts: ['información total del par', 'incertidumbre de torre', 'ruta pendiente dada torre'],
      },
    },
    {
      say: 'Selecciona la columna d: solo Sur permanece. En esta tabla, conocer cualquier ruta determina su torre; el orden inverso reparte los mismos dos bits de otra manera.',
      dur: 3,
      board: {
        label: 'Cadena en sentido inverso',
        tex: '\\begin{aligned}\\p{1}{H(X,Y)}&=\\p{2}{H(Y)+H(X\\mid Y)}\\\\&=\\p{3}{\\cA{2}+\\cC{0}=2}\\end{aligned}',
        parts: ['información total del par', 'ruta y torre pendiente', 'bits por par'],
      },
    },
  ],
};
function CrossingsDemo({ beats, answer }: DemoProps) {
  const b = beats.beat;
  return (
    <Stage>
      <JointGrid
        counts={ROUTE_COUNTS}
        rows={ROWS}
        columns={COLS}
        columnFilter={b === 0 && answer !== null ? 3 : undefined}
        filter={b === 1 ? 1 : undefined}
      />
      <Cap x={1250} y={230}>
        Bitácora íntegra: {sum(ROUTE_COUNTS.flat())} registros
      </Cap>
      <Cap x={1250} y={320} color={C.amber}>
        {b === 0 ? 'Reserva recuperada: ruta d' : 'Solo conservamos la etiqueta Sur'}
      </Cap>
      <Cap x={1250} y={430} tex={b === 0 ? 'H(X\\mid Y=d)' : 'H(Y\\mid X=S)'} />
      {answer !== null && (
        <Cap
          x={1250}
          y={540}
          color={C.green}
          tex={b === 0 ? 'p(S\\mid d)=1,\\quad H(X\\mid d)=0' : 'H(Y\\mid S)=1'}
          size={21}
        />
      )}
      <Cap x={530} y={740} size={20}>
        Los cruces vacíos siguen siendo imposibles.
      </Cap>
    </Stage>
  );
}
function JointPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 131 + round),
      k = randInt(r, 1, 2),
      a = randInt(r, 1, 3),
      b = randInt(r, 1, 3);
    const n = 2 ** k,
      chosen = randInt(r, 0, n - 1);
    const counts =
      round === 2
        ? Array.from({ length: 2 ** a }, () => Array(2 ** b).fill(1) as number[])
        : Array.from({ length: n }, (_, i) =>
            Array.from({ length: 2 * n }, (_, j) => (Math.floor(j / 2) === i ? 1 : 0)),
          );
    const table = counts.map((row) => row.map((v) => v / sum(counts.flat())));
    return {
      k,
      a,
      b,
      chosen,
      counts,
      table,
      rows: counts.map((_, i) => `T${i + 1}`),
      columns: counts[0].map((_, j) => `r${j + 1}`),
    };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [third, setThird] = useState('');
  const [rule, setRule] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setThird('');
    setRule(null);
    api.prompt(
      round === 0
        ? `Hay ${2 ** data.k} torres equiprobables, cada una con dos rutas exclusivas. Calcula H(X,Y) en bits.`
        : round === 1
          ? `Filtramos ${data.rows[data.chosen]}. Escribe las probabilidades de sus dos rutas y H(Y dado X), como decimal o fracción exacta.`
          : `Tabla producto uniforme: H(X) = ${data.a} y H(Y dado X) = ${data.b}. Calcula H(X,Y) y elige la operación de la regla de la cadena.`,
    );
    api.hints(
      round < 2
        ? [
            'Cuenta solo las celdas que pueden recibir fichas.',
            round === 0
              ? 'Todos los pares activos tienen el mismo peso; usa el logaritmo base dos de su cantidad.'
              : 'Al filtrar divide por el total de la fila; luego promedia la información de sus dos rutas.',
          ]
        : [
            'La cadena suma lo primero que debes saber y lo que falta después.',
            'H(X,Y) = H(X) + H(Y dado X). Usa las flechas bajo la tabla para ver todas las filas.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseExact(first);
    if (v === null || !Number.isFinite(v)) return;
    if (round === 1) {
      const w = parseExact(second),
        h = parseExact(third);
      if (w === null || h === null) return;
      if (v === 1 / 2 && w === 1 / 2 && h === conditionalEntropy(data.table))
        return api.result(
          true,
          'Cada ruta pesa 1/2 dentro de su fila; falta 1 bit en cualquiera de las torres.',
        );
      if (v === 1 / 2 ** (data.k + 1) || w === 1 / 2 ** (data.k + 1))
        return api.result(
          false,
          'Conservaste una probabilidad conjunta. El nuevo total es la fila seleccionada: renormaliza sus dos celdas para que sumen uno.',
        );
      if (v !== 1 / 2 || w !== 1 / 2)
        return api.result(
          false,
          'Las dos rutas de esta torre son equiprobables y sus probabilidades deben sumar uno.',
        );
      return api.result(
        false,
        h === 0
          ? 'Conocer la torre deja dos rutas. Cero corresponde a conocer la torre después de conocer una ruta exclusiva.'
          : 'Promedia los bits de las dos rutas dentro de la fila; no uses la entropía de todas las rutas.',
      );
    }
    if (round === 2 && rule === null) return;
    const target = jointEntropy(data.table);
    if (v === target && (round !== 2 || rule === 'Sumar'))
      return api.result(
        true,
        round === 0
          ? `${2 ** (data.k + 1)} pares posibles: ${target} bits.`
          : `$H(X,Y)=${data.a}+${data.b}=${target}$.`,
      );
    if (round === 0 && v === 2 * data.k + 1)
      return api.result(
        false,
        'Contaste también los cruces imposibles. Cada torre tiene solo dos rutas activas.',
      );
    if (round === 2 && rule === 'Multiplicar')
      return api.result(
        false,
        'La regla de la cadena suma entropías. Un producto puede coincidir numéricamente en alguna tabla, pero no expresa esa regla.',
      );
    if (round === 2 && v === data.b)
      return api.result(
        false,
        'Entregaste solo lo pendiente después de conocer X. Agrega la información necesaria para conocer X.',
      );
    api.result(
      false,
      round === 0
        ? 'Cuenta los pares activos y calcula su logaritmo base dos.'
        : 'Suma H(X) y H(Y dado X); conserva el término de la torre.',
    );
  };
  return (
    <Stage>
      <JointGrid
        counts={data.counts}
        rows={data.rows}
        columns={data.columns}
        filter={round === 1 ? data.chosen : undefined}
      />
      <Cap x={1250} y={230} size={20}>
        {round === 2 ? `H(X) = ${data.a} · H(Y dado X) = ${data.b}` : 'Ejercicio del terminal'}
      </Cap>
      <NumberField
        x={1050}
        y={350}
        label={round === 1 ? `p(r${2 * data.chosen + 1}) =` : 'H(X,Y) ='}
        width={4}
        value={first}
        onChange={setFirst}
        onEnter={submit}
      />
      {round === 1 && (
        <>
          <NumberField
            x={1050}
            y={460}
            label={`p(r${2 * data.chosen + 2}) =`}
            width={4}
            value={second}
            onChange={setSecond}
            onEnter={submit}
          />
          <NumberField
            x={1050}
            y={570}
            label="H(Y|X) ="
            width={4}
            value={third}
            onChange={setThird}
            onEnter={submit}
          />
        </>
      )}
      {round === 2 && (
        <Choices
          x={1250}
          y={480}
          options={['Sumar', 'Multiplicar']}
          value={rule}
          onPick={setRule}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c4',
  world: 'information',
  code: '8.4',
  title: 'La fila Sur',
  subtitle: 'Entropía conjunta y condicional',
  glyph: 'H(Y\\mid X)',
  kind: 'level',
  guide: 'ines',
  teaser: 'La reserva nombra la ruta d; falta recuperar la torre que el informe dejó fuera.',
  learn:
    'Leer probabilidades conjuntas y condicionales, calcular sus entropías y usar la regla de la cadena.',
  glyphs: ['it-joint', 'it-conditional', 'it-chain'],
  pitfalls: [
    'Las celdas imposibles no cuentan como resultados posibles.',
    'Una fila filtrada debe renormalizarse para sumar uno.',
    'H(Y dado X) y H(X dado Y) pueden ser distintas.',
  ],
  notes: [
    { label: 'Marginales y pares', tex: 'H(X)=1,\\quad H(Y)=2,\\quad H(X,Y)=2' },
    { label: 'Condicionar en ambos sentidos', tex: 'H(Y\\mid X)=1,\\quad H(X\\mid Y)=0' },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Caseta, cuatro y veinticinco. La puerta golpeaba con el viento, y Teo intentaba sujetarla con el pie sin soltar el lector.',
        },
        { who: 'teo', text: 'Dos torres y cuatro rutas. Puedo guardar las listas por separado.' },
        { who: 'ines', text: 'Y mandar una ruta por una torre que nunca la tuvo.' },
        { who: 'iris', text: 'Abre los cruces. El informe dejó fuera justo esa columna.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Los cruces reales',
      Scene: CrossingsDemo,
      beats: [
        {
          say: 'La bitácora de rutas tiene 16 registros: cuatro Norte–a, cuatro Norte–b, cuatro Sur–c y cuatro Sur–d. Es un lote distinto de las cabeceras A–D; la reserva recuperada nombra d.',
          ask: {
            prompt: 'Con ruta d, ¿qué torre corresponde y cuánto queda por saber de ella?',
            options: ['Sur; 0 bits', 'Cualquiera; 1 bit', 'Norte; 0 bits'],
            answer: 0,
            explain:
              'Toda la columna d pertenece a Sur. Cualquiera ignora los cruces; Norte cambia la fila.',
          },
          note: {
            label: 'Torre de la reserva',
            tex: 'p(S\\mid d)=1',
            body: 'Cada celda activa pesa 4/16 = 1/4; d identifica Sur sin incertidumbre pendiente.',
          },
        },
        {
          say: 'Ahora conserva solo Sur y descarta el nombre de la ruta. Revisa qué alternativas quedan dentro de esa fila.',
          ask: {
            prompt: 'Si solo conservaras la etiqueta Sur, ¿cuánto quedaría por saber de la ruta?',
            options: ['0 bits', '2 bits', '1 bit'],
            answer: 2,
            explain:
              'Sur conserva c y d, ambas con probabilidad 1/2. El 2 ignora el filtro; el 0 elimina una decisión que sigue pendiente.',
          },
          note: {
            label: 'Ruta pendiente',
            tex: 'p(c\\mid S)=p(d\\mid S)=\\tfrac12',
            body: 'Queda 1 bit sobre la ruta al conocer Sur.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Filtrar y contar pares', Comp: JointPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'El filtro Sur dejó encendidas c y d. Por debajo de la puerta entraba olor a cable húmedo.',
        },
        { who: 'ines', text: 'Ese tramo lo mantuvimos andando cuando Halcón dejó de pagar.' },
        { who: 'iris', text: '¿Quién más sabía que seguía andando?' },
        {
          who: 'nar',
          text: 'La ruta d terminaba en el repetidor de reserva. En el plano oficial, ese lugar era una mancha gris.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-joint',
    world: 'information',
    tex: 'H(X,Y)',
    name: 'Entropía conjunta',
    read: 'hache de equis e i',
    meaning:
      'Información media de observar el par completo; promedia las probabilidades conjuntas.',
  },
  {
    id: 'it-conditional',
    world: 'information',
    tex: 'H(Y\\mid X)',
    name: 'Entropía condicional',
    read: 'hache de i dado equis',
    meaning: 'Información media pendiente sobre Y cuando ya conoces X.',
    warn: 'Renormaliza cada fila y pondera su entropía por la probabilidad de esa fila.',
  },
  {
    id: 'it-chain',
    world: 'information',
    tex: 'H(X,Y)=H(X)+H(Y\\mid X)',
    name: 'Regla de la cadena',
    read: 'entropía del par igual a entropía de equis más entropía de i dado equis',
    meaning: 'Descompone la información del par en una variable y lo pendiente sobre la otra.',
  },
];
