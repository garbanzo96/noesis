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
import { rng, randInt, pick } from '../shared/rng';
import { Choices, Confirm, NumberField, parseProb } from '../shared/ui';
import {
  ACCENT,
  BitTape,
  CODES,
  COUNTS,
  P,
  PrefixTree,
  SYMBOLS,
  TREE,
  decodePrefix,
  meanLength,
  num,
  sum,
  type PrefixNode,
} from './kit';

const initial = () => SYMBOLS.map((id, i) => ({ id, symbol: id, weight: P[i], x: 0, y: 0 }));
function HuffmanLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [cursor, setCursor] = useState(0),
    [pool, setPool] = useState<PrefixNode[]>(initial),
    [joins, setJoins] = useState(0);
  const b = beats.beat;
  const decoded = decodePrefix('010110111', CODES);
  if (b === 0)
    return (
      <Stage>
        <BitTape
          bits="01"
          cursor={cursor}
          onCursor={(n) => {
            setCursor(n);
            if (n === 1) unlock();
          }}
        />
        <Cap x={530} y={220} tex="A=0,\quad B=01" color={C.amber} />
        <Cap x={1250} y={250}>
          0 termina A…
        </Cap>
        <Cap x={1250} y={350}>
          …y también empieza B.
        </Cap>
        <Cap x={1250} y={470} size={20} color={cursor === 1 ? C.green : C.muted}>
          {cursor === 1 ? 'Conflicto de prefijo visible.' : 'Detén el cursor tras el primer bit.'}
        </Cap>
      </Stage>
    );
  if (b === 1)
    return (
      <Stage>
        {joins < 3 ? (
          <PrefixTree
            nodes={pool}
            edges={[]}
            onJoin={(a, c) => {
              const expected = [
                ['C', 'D', 1 / 4],
                ['B', 'CD', 1 / 2],
                ['A', 'BCD', 1],
              ] as const;
              const [left, right, weight] = expected[joins];
              if (a.id !== left || c.id !== right || a.weight + c.weight !== weight) return;
              const next = joins + 1;
              setPool([
                ...pool.filter((n) => n.id !== a.id && n.id !== c.id),
                { id: a.id + c.id, weight, x: 0, y: 0 },
              ]);
              setJoins(next);
              if (next === 3) unlock();
            }}
          />
        ) : (
          <PrefixTree nodes={TREE.nodes} edges={TREE.edges} />
        )}
        <Cap x={1250} y={250}>
          Uniones: {joins}/3
        </Cap>
        <Cap
          x={1250}
          y={350}
          tex={
            joins === 0
              ? '\\tfrac18+\\tfrac18'
              : joins === 1
                ? '\\tfrac14+\\tfrac14'
                : joins === 2
                  ? '\\tfrac12+\\tfrac12'
                  : '1'
          }
          color={C.amber}
        />
        <Cap x={1250} y={450} size={19}>
          {joins === 3 ? 'Árbol completo confirmado.' : 'Suelta cada peso en su círculo.'}
        </Cap>
      </Stage>
    );
  const progress = b === 2 && !reduced ? beats.at(2) : 1;
  const index = Math.floor(progress * 9),
    prefix = '010110111'.slice(0, index);
  const partial = decodePrefix(prefix, CODES);
  return (
    <Stage>
      <PrefixTree nodes={TREE.nodes} edges={TREE.edges} active={partial.pending} />
      <BitTape
        bits="010110111"
        groups={b === 2 ? partial.groups : decoded.groups}
        cursor={b === 2 ? index : undefined}
        y={745}
      />
      <Cap x={1250} y={230} tex="\ell=(1,2,3,3)" color={ACCENT} />
      {b === 2 && (
        <>
          <Cap x={1250} y={340}>
            Leído: {partial.symbols.join('') || '—'}
          </Cap>
          <Cap x={1250} y={440} size={19}>
            Cada hoja devuelve el lector a la raíz.
          </Cap>
        </>
      )}
      {b === 3 && (
        <>
          <Cap x={1250} y={340} tex="\bar L=\sum_i p_i\ell_i" />
          <Cap x={1250} y={450} tex="p=(\frac12,\frac14,\frac18,\frac18)" size={20} />
          {answer !== null && <Cap x={1250} y={550} tex="\bar L=\frac74" color={C.amber} />}
        </>
      )}
      {b === 4 && (
        <>
          <Cap x={1250} y={340}>
            Fijo: dos bits por símbolo
          </Cap>
          <Cap x={1250} y={450}>
            Huffman: {num(meanLength(P, TREE.lengths)).replace('{,}', ',')} bits/símbolo
          </Cap>
          <Cap x={1250} y={560} tex="H\le\bar L_{\mathrm{Huff}}<H+1" size={22} />
        </>
      )}
      {b === 5 && (
        <>
          <Cap x={1250} y={340} tex="\ell_i=-\log_2p_i" color={C.amber} />
          <Cap x={1250} y={450} tex="\bar L=H=\frac74" />
          <Cap x={1250} y={560} size={20}>
            Largos ideales enteros.
          </Cap>
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Códigos de prefijo y Huffman',
  Scene: HuffmanLesson,
  beats: [
    {
      say: 'En A = 0 y B = 01, una palabra completa también empieza otra. En un **código de prefijo**, los símbolos terminan solo en hojas.',
      gate: 'Arrastra el cursor por la cinta 01 y suéltalo tras el primer bit para ver el conflicto.',
      board: {
        label: 'Sin prefijos entre palabras',
        tex: '\\p{1}{\\cC{c(x)}}\\not\\prec\\p{2}{\\cA{c(y)}},\\quad\\p{3}{x\\ne y}',
        body: 'El símbolo ≺ se lee «es prefijo de».',
      },
    },
    {
      say: '**Huffman** une los dos pesos menores y repite con el peso nuevo. Resuelve los empates por etiqueta para reproducir este árbol.',
      gate: 'Une C con D, luego B con CD y finalmente A con BCD; arrastra cada nodo a su círculo de unión.',
      board: {
        label: 'Sumar los pesos menores',
        tex: '\\p{1}{\\cC{\\tfrac18}}+\\p{2}{\\cM{\\tfrac18}}=\\p{3}{\\cA{\\tfrac14}}',
      },
    },
    {
      say: 'La izquierda vale cero y la derecha uno. Al llegar a una hoja lees su símbolo y vuelves a la raíz; el árbol separa las palabras sin marcas externas.',
      dur: 4,
      board: {
        label: 'Leer desde la raíz',
        tex: '\\p{1}{0|10|110|111}\\longrightarrow\\p{2}{\\cC{ABCD}}',
      },
    },
    {
      say: 'Mide cada palabra y promedia con las probabilidades de la fuente. Las etiquetas aparecen con frecuencias distintas.',
      ask: {
        prompt: '¿Cuánto vale la longitud media con el reparto de la fuente?',
        options: ['2,25 bits/símbolo', '1,75 bits/símbolo', '9 bits/símbolo'],
        answer: 1,
        explain:
          '$\\sum p_i\\ell_i=7/4$. El 2,25 promedia las etiquetas como equiprobables; el 9 suma sus longitudes.',
      },
      board: {
        label: 'Longitud media',
        tex: '\\p{1}{\\cA{\\bar L}}=\\p{2}{\\sum_i\\cC{p_i}\\cM{\\ell_i}}',
      },
    },
    {
      say: 'La longitud media de un código binario de prefijo no baja de la entropía. Huffman minimiza esa media entre los códigos de prefijo por símbolo.',
      dur: 3,
      board: {
        label: 'Cota de Huffman',
        tex: '\\p{1}{\\cC{H(X)}}\\le\\p{2}{\\cA{\\bar L_{\\mathrm{Huff}}}}<\\p{3}{H(X)+1}',
      },
    },
    {
      say: 'Aquí las probabilidades son potencias de un medio. Sus largos ideales son enteros: este árbol alcanza la cota inferior.',
      dur: 3,
      board: [
        { label: 'Largos ideales', tex: '\\p{1}{\\ell_i}=\\p{2}{-\\log_2p_i}' },
        {
          label: 'Igualdad en esta fuente',
          tex: '\\p{1}{\\ell=(1,2,3,3)},\\quad\\p{2}{\\bar L=H}=\\p{3}{\\cA{\\tfrac74}}',
        },
      ],
    },
  ],
};
function HeaderDemo({ beats, answer }: DemoProps) {
  const b = beats.beat,
    show = answer !== null;
  return (
    <Stage>
      <PrefixTree nodes={TREE.nodes} edges={TREE.edges} />
      <BitTape bits="010110111" groups={b > 0 || show ? [1, 3, 6, 9] : []} y={745} />
      <Cap x={1250} y={230}>
        Cabecera pública de control
      </Cap>
      <Cap x={1250} y={330}>
        Lote: {sum(COUNTS)} símbolos
      </Cap>
      {b === 0 && show && (
        <>
          <Cap x={1250} y={430} color={ACCENT}>
            ABCD
          </Cap>
          <Cap x={1250} y={530} size={20}>
            D conduce a la ruta de reserva.
          </Cap>
        </>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={430}>
            Conteos: ({COUNTS.join(', ')})
          </Cap>
          {show && <Cap x={1250} y={530} tex="32+32+24+24=112" color={C.amber} />}
        </>
      )}
      <Cap x={1250} y={640} size={18}>
        El cuerpo sigue cifrado.
      </Cap>
    </Stage>
  );
}
function HuffmanPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 127 + round),
      a = pick(r, SYMBOLS),
      b = pick(
        r,
        SYMBOLS.filter((v) => v !== a),
      ),
      t = randInt(r, 1, 4),
      valid = pick(r, [true, false]);
    return {
      a,
      b,
      t,
      valid,
      bits: CODES[a] + CODES[b],
      codes: valid ? CODES : { A: '0', B: '01', C: '10', D: '11' },
    };
  }, [seed, round]);
  const [first, setFirst] = useState<string | null>(null),
    [second, setSecond] = useState<string | null>(null),
    [total, setTotal] = useState(''),
    [mean, setMean] = useState('');
  useEffect(() => {
    setFirst(null);
    setSecond(null);
    setTotal('');
    setMean('');
    api.prompt(
      round === 0
        ? `Decodifica ${data.bits} con el árbol de clase. Elige los dos símbolos en orden.`
        : round === 1
          ? `El lote tiene conteos (${[4 * data.t, 2 * data.t, data.t, data.t].join(', ')}). Escribe tamaño total en bits y longitud media exacta (decimal o fracción).`
          : 'Revisa las palabras mostradas. Decide si el código es de prefijo y señala el conflicto si existe.',
    );
    api.hints(
      round === 0
        ? [
            'Avanza por el árbol hasta una hoja, luego vuelve a la raíz.',
            'Las palabras completas son 0, 10, 110 y 111.',
          ]
        : round === 1
          ? [
              'Multiplica el conteo de cada etiqueta por su longitud.',
              'Divide el tamaño total por la cantidad de símbolos.',
            ]
          : [
              'Las palabras distintas también pueden ser prefijos entre sí.',
              'Comprueba si una palabra completa aparece al comienzo de otra.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    if (round === 0) {
      if (first === null || second === null) return;
      const ok = first === data.a && second === data.b;
      return api.result(
        ok,
        ok
          ? `${CODES[data.a]} | ${CODES[data.b]} se lee ${data.a}${data.b}.`
          : first === 'A' && data.bits.startsWith('1')
            ? 'El primer bit 1 es una rama interna. Sigue hasta una hoja antes de elegir el símbolo.'
            : 'Cortaste antes de una hoja o usaste bloques fijos. Cada hoja termina una palabra; después vuelve a la raíz.',
      );
    }
    if (round === 1) {
      const v = parseProb(total),
        w = parseProb(mean);
      if (v === null || w === null) return;
      if (v === 14 * data.t && w === 7 / 4)
        return api.result(
          true,
          `$L=${14 * data.t}$ bits; $\\bar L=${14 * data.t}/${8 * data.t}=7/4$.`,
        );
      if (w === 9 / 4)
        return api.result(
          false,
          'Promediaste las cuatro etiquetas como equiprobables. Usa los conteos del lote como pesos.',
        );
      if (v === 9)
        return api.result(
          false,
          'Sumaste una aparición de cada etiqueta. Este lote tiene más apariciones: multiplica por los conteos.',
        );
      if (v === 16 * data.t)
        return api.result(
          false,
          'Usaste palabras fijas de dos bits. En este árbol las longitudes son 1, 2, 3 y 3.',
        );
      return api.result(
        false,
        v !== 14 * data.t
          ? 'Revisa conteo por largo para cada símbolo y suma los cuatro aportes.'
          : 'La media es el tamaño total dividido por el número de símbolos, no por cuatro etiquetas.',
      );
    }
    if (first === null || second === null) return;
    const yes = data.valid ? 'Sí' : 'No',
      conflict = data.valid ? 'Ninguna' : 'A y B';
    const ok = first === yes && second === conflict;
    api.result(
      ok,
      ok
        ? data.valid
          ? 'Ninguna palabra es prefijo de otra.'
          : 'A = 0 es prefijo de B = 01.'
        : data.valid
          ? 'Las hojas 0, 10, 110 y 111 terminan sin continuar hacia otro símbolo.'
          : 'Ser distintas no basta: 0 termina A y también inicia 01. El conflicto está entre A y B.',
    );
  };
  return (
    <Stage>
      {round < 2 ? (
        <PrefixTree nodes={TREE.nodes} edges={TREE.edges} />
      ) : (
        <>
          {Object.entries(data.codes).map(([s, c], i) => (
            <g key={s}>
              <rect
                x={230}
                y={210 + i * 125}
                width={600}
                height={85}
                rx={10}
                stroke={ACCENT}
                fill={ACCENT}
                fillOpacity={0.1}
              />
              <Cap x={530} y={252 + i * 125} tex={`${s}=${c}`} color={ACCENT} />
            </g>
          ))}
        </>
      )}
      {round === 0 && (
        <>
          <BitTape bits={data.bits} y={745} />
          <Cap x={1250} y={210}>
            Primero
          </Cap>
          <Choices x={1250} y={300} options={SYMBOLS} value={first} onPick={setFirst} />
          <Cap x={1250} y={430}>
            Segundo
          </Cap>
          <Choices x={1250} y={520} options={SYMBOLS} value={second} onPick={setSecond} />
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={1250} y={220}>
            Conteos: ({[4 * data.t, 2 * data.t, data.t, data.t].join(', ')})
          </Cap>
          <NumberField
            x={1060}
            y={390}
            label="total ="
            unit="bits"
            value={total}
            onChange={setTotal}
            onEnter={submit}
          />
          <NumberField
            x={1060}
            y={520}
            label="media ="
            value={mean}
            onChange={setMean}
            onEnter={submit}
          />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={1250} y={230}>
            ¿Es de prefijo?
          </Cap>
          <Choices x={1250} y={320} options={['Sí', 'No']} value={first} onPick={setFirst} />
          <Cap x={1250} y={450}>
            Palabras en conflicto
          </Cap>
          <Choices
            x={1250}
            y={550}
            options={['Ninguna', 'A y B', 'C y D']}
            value={second}
            onPick={setSecond}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c3',
  world: 'information',
  code: '8.3',
  title: 'Las ramas cortas',
  subtitle: 'Códigos de prefijo y Huffman',
  glyph: '\\bar L',
  kind: 'level',
  guide: 'ines',
  teaser:
    'Una cabecera continua permite seguir la reserva si el lector corta solo en las hojas del árbol.',
  learn:
    'Construir un árbol de Huffman, decodificar palabras de prefijo y calcular la longitud media.',
  glyphs: ['it-prefix', 'it-huffman', 'it-length'],
  pitfalls: [
    'Una palabra termina en una hoja; vuelve a la raíz después de leerla.',
    'Palabras distintas pueden seguir teniendo un conflicto de prefijo.',
    'La media pondera las longitudes con las probabilidades de la fuente.',
    'Decodificar la cabecera no descifra el cuerpo del mensaje.',
  ],
  notes: [
    { label: 'Código de la fuente', tex: 'c=(0,10,110,111)' },
    {
      label: 'Fragmento aislado',
      tex: '\\ell(ABCD)=1+2+3+3=9',
      body: 'Sus frecuencias no reemplazan las del lote de 64 cabeceras.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'Terminal de servicio, 04:10. El teclado deja gotas sobre la mesa; Iris aparta la copia original del lector.',
        },
        { who: 'iris', text: 'Si marcas mal el corte, cambias lo que dice.' },
        { who: 'ines', text: 'Ese lector vuelve a la raíz cada vez que llega a una hoja.' },
        { who: 'tu', text: 'Probemos los cortes en la copia.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La cabecera continua',
      Scene: HeaderDemo,
      beats: [
        {
          say: 'El chip guarda el árbol de la fuente. El fragmento público 010110111 no tiene separadores externos.',
          ask: {
            prompt: '¿Cómo lees el fragmento con este árbol?',
            options: ['ABABBABBB', 'ABCD', 'Un único símbolo de nueve bits'],
            answer: 1,
            explain:
              'Las hojas separan $0|10|110|111$: ABCD. Leer cada bit como un símbolo da el primer distractor.',
          },
          note: {
            label: 'Decodificar el fragmento',
            tex: '0|10|110|111\\longrightarrow ABCD',
            body: 'D lleva al puerto etiquetado «ruta de reserva»; el cuerpo conserva su cifrado.',
          },
        },
        {
          say: 'El lote íntegro contiene 32 A, 16 B, 8 C y 8 D. La compresión conserva todos los símbolos.',
          ask: {
            prompt: '¿Por qué 112 bits alcanzan para las 64 cabeceras de este lote?',
            options: [
              'El cifrado eliminó símbolos',
              'Cada cabecera usa siempre 2 bits',
              'Las longitudes ponderadas suman 112',
            ],
            answer: 2,
            explain:
              '$32\\cdot1+16\\cdot2+8\\cdot3+8\\cdot3=112$. Comprimir cambia las longitudes; cifrar es otra operación.',
          },
          note: {
            label: 'Longitudes ponderadas del lote',
            tex: '32+32+24+24=112\\ \mathrm{bits}',
            body: 'En esta fuente, $\\bar L=H(P)=7/4$ bits/símbolo.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Leer y revisar códigos', Comp: HuffmanPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'antenas',
      lines: [
        {
          who: 'nar',
          text: 'El fragmento D abre una tabla. La lluvia repica en la puerta de la caseta; Inés deja el pulgar inmóvil junto a la fila Sur.',
        },
        { who: 'teo', text: 'Ruta de reserva. Y al lado aparece Sur.' },
        { who: 'iris', text: 'Cerrado para quién.' },
        { who: 'nar', text: 'Inés retira el pulgar de la pantalla. La fila sigue ahí.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-prefix',
    world: 'information',
    tex: 'c(x)\\not\\prec c(y)\\quad(x\\ne y)',
    name: 'Código de prefijo',
    read: 'ninguna palabra es prefijo de otra',
    meaning: 'Cada símbolo está en una hoja: una palabra completa nunca es el comienzo de otra.',
  },
  {
    id: 'it-huffman',
    world: 'information',
    tex: 'H(X)\\le\\bar L_{\\mathrm{Huff}}<H(X)+1',
    name: 'Huffman',
    read: 'cota de longitud media de Huffman',
    meaning:
      'Construye un código binario óptimo por símbolo uniendo repetidamente los dos pesos menores.',
  },
  {
    id: 'it-length',
    world: 'information',
    tex: '\\bar L=\\sum_i p_i\\ell_i',
    name: 'Longitud media',
    read: 'ele media',
    meaning: 'Número promedio de bits por símbolo, ponderado con la distribución de la fuente.',
  },
];
