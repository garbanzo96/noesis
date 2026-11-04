import { useEffect, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage } from '../../engine/Stage';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, IntervalBar, NumberLine, Token, Venn2, lineMap, mix } from '../shared/lesson';
import { Knob } from '../shared/ui';
import { lesson as L2 } from './lesson-c2';
import { lesson as L3 } from './lesson-c3';
import { lesson as L4 } from './lesson-c4';
import { lesson as L5 } from './lesson-c5';
import { lesson as L6 } from './lesson-c6';
import { lesson as L7 } from './lesson-c7';
import { lesson as L8 } from './lesson-c8';

// ============================================================================
// Clases de Precálculo. Cada una desarrolla el tema desde cero, con animación y una
// herramienta interactiva, mientras la pizarra escribe la parte formal término a término.
// ============================================================================

// ---------------------------------------------------------------- 1.1 conjuntos e intervalos
const A_ELEMS = [2, 5, 7, 11];
const U12 = Array.from({ length: 12 }, (_, i) => i + 1);
const isA = (v: number) => v % 2 === 0;
const isB = (v: number) => v % 3 === 0;
const CA: [number, number] = [640, 430];
const CB: [number, number] = [900, 430];

/** Where each element of 1..12 sits in the two-circle diagram. */
function vennSpot(v: number): [number, number] {
  const a = isA(v);
  const b = isB(v);
  const groups = { ab: [6, 12], a: [2, 4, 8, 10], b: [3, 9], none: [1, 5, 7, 11] };
  if (a && b) return [770, 360 + groups.ab.indexOf(v) * 120];
  if (a) {
    const k = groups.a.indexOf(v);
    return [560 + (k % 2) * 80, 350 + Math.floor(k / 2) * 150];
  }
  if (b) return [980, 360 + groups.b.indexOf(v) * 130];
  const k = groups.none.indexOf(v);
  return [[300, 1260, 300, 1260][k], [250, 250, 640, 640][k]];
}

function SetsLesson({ beats, unlock }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const X = lineMap(-2, 12, 260, 1340);
  const [a, setA] = useState(2);
  const [b, setB] = useState(8);
  const [open, setOpen] = useState<[boolean, boolean]>([false, false]);
  useEffect(() => {
    if (beat === 4 && open[0] && !open[1]) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, beat]);
  const toV = (x: number) => Math.round(clamp((x - 260) / (1080 / 14) - 2, -2, 12) * 2) / 2;
  const dragA = useSvgDrag(svg, (x) => setA(Math.min(toV(x), b - 0.5)));
  const dragB = useSvgDrag(svg, (x) => setB(Math.max(toV(x), a + 0.5)));

  // beats 0-1: a set as a bag of tokens
  if (beat <= 1) {
    const t = at(0);
    return (
      <Stage>
        <circle
          cx={800}
          cy={420}
          r={230}
          fill={C.cyan}
          fillOpacity={0.06 * t}
          stroke={C.cyan}
          strokeWidth={3}
          opacity={t}
        />
        <Cap x={580} y={210} size={36} color={C.cyan} tex="A" opacity={t} />
        {A_ELEMS.map((v, i) => {
          const from: [number, number] = [200 + i * 60, 760];
          const to: [number, number] = [720 + (i % 2) * 160, 340 + Math.floor(i / 2) * 160];
          const p = mix(from, to, clamp(t * 1.6 - i * 0.15, 0, 1));
          return (
            <Token
              key={v}
              x={p[0]}
              y={p[1]}
              label={v}
              ring={beat === 1 && v === 5 ? C.green : undefined}
            />
          );
        })}
        <Group opacity={at(1)}>
          <Token x={1250} y={420} label={4} color={C.red} ring={C.red} />
          <Cap x={1250} y={510} size={28} color={C.red} tex="4\notin A" />
          <Cap x={880} y={262} size={28} color={C.green} tex="5\in A" />
        </Group>
      </Stage>
    );
  }
  // beats 2-5: the real line and intervals
  if (beat <= 5) {
    const dense = at(2);
    return (
      <Stage ref={svg}>
        <NumberLine X={X} y={480} lo={-2} hi={12} />
        {/* the line fills with numbers: halves and quarters appear */}
        {beat === 2 &&
          Array.from({ length: 56 }, (_, k) => -2 + k * 0.25)
            .filter((v) => v % 1 !== 0)
            .map((v, k) => (
              <line
                key={k}
                x1={X(v)}
                x2={X(v)}
                y1={474}
                y2={486}
                stroke={C.cyan}
                strokeWidth={2}
                opacity={clamp(dense * 2 - (k % 7) * 0.1, 0, 1)}
              />
            ))}
        {beat === 2 && (
          <>
            <Cap x={X(Math.PI)} y={430} size={22} color={C.amber} tex="\pi" opacity={dense} />
            <Cap x={X(Math.SQRT2)} y={430} size={22} color={C.amber} tex="\sqrt2" opacity={dense} />
            <Cap x={X(-1.5)} y={430} size={22} color={C.amber} tex="-\tfrac32" opacity={dense} />
          </>
        )}
        {beat === 3 && <IntervalBar X={X} y={480} a={2} b={8} progress={at(3)} />}
        {beat === 3 && (
          <>
            <Cap x={X(5)} y={420} size={20} color={C.green}>
              todos los x entre 2 y 8
            </Cap>
          </>
        )}
        {beat === 4 && (
          <g>
            <IntervalBar
              X={X}
              y={480}
              a={a}
              b={b}
              openA={open[0]}
              openB={open[1]}
              onEnd={(w) => setOpen(w === 'a' ? [!open[0], open[1]] : [open[0], !open[1]])}
            />
            <Knob
              x={X(a)}
              y={560}
              color={C.green}
              onPointerDown={dragA}
              cursor="ew-resize"
              label="a"
            />
            <Knob
              x={X(b)}
              y={560}
              color={C.green}
              onPointerDown={dragB}
              cursor="ew-resize"
              label="b"
            />
            <Cap
              x={800}
              y={360}
              size={40}
              color={C.text}
              tex={`${open[0] ? '(' : '['}${String(a).replace('.', '{,}')},\\ ${String(b).replace('.', '{,}')}${open[1] ? ')' : ']'}`}
            />
            <Cap x={800} y={660} size={18} color={C.muted}>
              toca un extremo para incluirlo o excluirlo · arrastra los círculos para moverlos
            </Cap>
          </g>
        )}
        {beat === 5 && (
          <IntervalBar X={X} y={480} a={3} b={Infinity} xmax={X(12)} progress={at(5)} />
        )}
        {beat === 5 && <Cap x={X(8)} y={420} size={20} color={C.green} tex="x\ge3" />}
      </Stage>
    );
  }
  // beats 6-9: description by a property, operations, counting
  const t6 = at(6);
  const lit =
    beat === 7
      ? { ab: true }
      : beat === 8
        ? { a: true, b: true, ab: true }
        : beat >= 9
          ? { a: true, b: true, ab: true }
          : {};
  return (
    <Stage>
      <rect
        x={180}
        y={150}
        width={1240}
        height={600}
        rx={14}
        fill="none"
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={210} y={180} size={24} color={C.muted} tex="U=\{1,\dots,12\}" anchor="left" />
      <Cap
        x={210}
        y={725}
        size={20}
        color={C.cyan}
        tex="A=\{x\in U: x\ \text{par}\}"
        anchor="left"
        opacity={t6}
      />
      {beat >= 7 && (
        <Cap
          x={1390}
          y={725}
          size={20}
          color={C.amber}
          tex="B=\{x\in U: x\ \text{múltiplo de }3\}"
          anchor="right"
        />
      )}
      <Group opacity={beat >= 7 ? 1 : t6}>
        <Venn2 ca={CA} cb={CB} r={220} lit={lit} labels={['A', 'B']} />
      </Group>
      {U12.map((v) => {
        const grid: [number, number] = [
          260 + ((v - 1) % 6) * 200,
          300 + Math.floor((v - 1) / 6) * 260,
        ];
        const p = beat === 6 ? mix(grid, vennSpot(v), clamp(t6 * 1.4 - 0.4, 0, 1)) : vennSpot(v);
        const inA = isA(v);
        const inB = isB(v);
        const hl =
          beat === 6 ? inA && t6 > 0.3 : beat === 7 ? inA && inB : beat >= 8 ? inA || inB : false;
        return (
          <Token
            key={v}
            x={p[0]}
            y={p[1]}
            label={v}
            r={24}
            color={hl ? (inA && inB ? C.magenta : inA ? C.cyan : C.amber) : C.dim}
            ring={hl ? C.text : undefined}
          />
        );
      })}
    </Stage>
  );
}

const L_SETS: LessonStep = {
  kind: 'lesson',
  title: 'Conjuntos e intervalos',
  intro: {
    question: '¿Cómo se describe con precisión un grupo de cosas o de valores?',
    text: 'Esto es precálculo, el lenguaje que usan todos los mundos que vienen. Un conjunto reúne objetos bien definidos y un intervalo reúne todos los números entre dos extremos. Con eso vamos a separar las cajas que pasaron la noche entre 2 y 8 °C de las que no.',
  },
  Scene: SetsLesson,
  beats: [
    {
      say: 'Un **conjunto** es una colección bien definida: debe poder decidirse si cada objeto pertenece a ella. Sus objetos se llaman **elementos** y se pueden enumerar entre llaves. Aquí $A$ contiene 2, 5, 7 y 11. El orden y las repeticiones no cambian el conjunto.',
      board: {
        label: 'Conjunto',
        tex: 'A=\\{\\p{1}{2},\\ \\p{2}{5},\\ \\p{3}{7},\\ \\p{4}{11}\\}',
        body: 'El orden y las repeticiones no importan: $\\{2,5\\}=\\{5,2\\}$.',
        parts: [
          'elemento del conjunto',
          'elemento del conjunto',
          'elemento del conjunto',
          'elemento del conjunto',
        ],
      },
    },
    {
      say: 'La **pertenencia** indica si un objeto es elemento de un conjunto. $5\\in A$ se lee «5 pertenece a A» y $4\\notin A$, «4 no pertenece a A». Sirve para distinguir los elementos del conjunto de los que quedan fuera. El símbolo relaciona un elemento con un conjunto.',
      board: {
        label: 'Pertenencia',
        tex: '\\p{1}{5\\cC{\\in} A}\\qquad \\p{2}{4\\cR{\\notin} A}',
        parts: ['elemento del conjunto', 'elemento que queda fuera'],
      },
    },
    {
      say: 'Los **números reales** corresponden a todos los puntos de la recta real. Incluyen enteros, fracciones y números irracionales como $\\sqrt2$, que se lee «raíz cuadrada de 2», y $\\pi$, que se lee «pi». El símbolo $\\mathbb R$ se lee «los reales». Entre dos reales distintos siempre hay otros, y la recta no tiene huecos.',
      dur: 2.6,
      board: {
        label: 'Números reales',
        tex: '\\mathbb R',
        body: 'La recta real: no tiene huecos.',
      },
    },
    {
      say: 'Un **intervalo** es un conjunto de números reales que contiene todos los valores entre cualesquiera dos de sus elementos. Sirve para describir rangos sin enumerar cada valor.\n\n$[2,8]$ se lee «de 2 a 8, incluidos ambos extremos»: reúne los reales $x$ que cumplen $2\\le x$ y $x\\le 8$. Los corchetes indican que 2 y 8 también pertenecen al intervalo.',
      dur: 2.8,
      board: {
        label: 'Intervalo cerrado',
        tex: '[2,8]=\\{\\p{1}{x\\in\\mathbb R}:\\ \\p{2}{\\cC{2\\le x}}\\ \\p{3}{\\text{y}}\\ \\p{4}{\\cA{x\\le8}}\\}',
        body: 'Se lee: los $x$ reales tales que $2\\le x$ y $x\\le 8$.',
        parts: [
          'valores de la recta',
          'límite inferior incluido',
          'ambas condiciones juntas',
          'límite superior incluido',
        ],
      },
    },
    {
      say: 'Un extremo incluido se marca con **corchete** y un punto lleno; uno excluido, con **paréntesis** y un círculo hueco. Por ejemplo, $[2,8)$ se lee «de 2 incluido a 8 excluido»: contiene 2 y todos los reales hasta 8, sin incluir 8. Cada extremo se decide por separado. Esto permite precisar si un valor límite cumple una condición.',
      gate: 'Toca el extremo izquierdo para excluirlo y deja incluido el derecho. Observa cómo cambian el punto y la notación.',
      after:
        'El intervalo quedó semiabierto: el extremo izquierdo está excluido y el derecho incluido. Si mantuviste los valores iniciales, obtuviste $(2,8]$: 2 queda fuera y 8 dentro.',
      board: [
        {
          label: 'Abierto y cerrado',
          tex: '\\begin{aligned}\\p{1}{(a,b)}&\\p{1}{=\\{x:\\ a<x<b\\}}\\\\ \\p{2}{[a,b)}&\\p{2}{=\\{x:\\ a\\le x<b\\}}\\\\ \\p{3}{(a,b]}&\\p{3}{=\\{x:\\ a<x\\le b\\}}\\end{aligned}',
          body: 'Corchete: el extremo se incluye ($\\le$). Paréntesis: no se incluye ($<$).',
          parts: ['ambos extremos fuera', 'incluye extremo izquierdo', 'incluye extremo derecho'],
        },
      ],
    },
    {
      say: 'Un intervalo puede extenderse sin límite en una dirección. El símbolo $\\infty$ se lee «infinito» e indica que no hay límite superior; no es un número real y siempre lleva paréntesis. $[3,\\infty)$ se lee «desde 3 incluido hasta infinito» y contiene todos los reales $x\\ge 3$. El 3 sí pertenece, porque lleva corchete.',
      board: {
        label: 'Intervalos infinitos',
        tex: '[3,\\p{1}{\\infty})=\\{x:\\ \\p{2}{x\\ge3}\\}',
        parts: ['sin límite superior', 'valores desde tres'],
      },
    },
    {
      say: 'La **descripción por comprensión** define un conjunto mediante una condición que cumplen sus elementos. El **universo** $U$ reúne los elementos entre los que se selecciona; aquí son los enteros del 1 al 12.\n\n$A=\\{x\\in U: x\\text{ es par}\\}$ se lee «los $x$ de $U$ tales que $x$ es par». Así se obtienen 2, 4, 6, 8, 10 y 12.',
      dur: 2.8,
      board: {
        label: 'Por comprensión',
        tex: 'A=\\{\\p{1}{x\\in U}:\\ \\p{2}{x\\ \\text{es par}}\\}=\\p{3}{\\{2,4,6,8,10,12\\}}',
        parts: ['elementos del universo', 'condición de selección', 'elementos que cumplen'],
      },
    },
    {
      say: 'La **intersección** de dos conjuntos contiene los elementos que pertenecen a ambos. $A\\cap B$ se lee «A intersección B» y permite encontrar lo que comparten. Aquí $A$ reúne los pares de $U$ y $B$ los múltiplos de 3. Su intersección es $\\{6,12\\}$: cada uno cumple las dos condiciones.',
      board: {
        label: 'Intersección',
        tex: 'A\\p{1}{\\cM{\\cap}}B=\\{x:\\ x\\in A\\ \\p{2}{\\text{y}}\\ x\\in B\\}=\\p{3}{\\{6,12\\}}',
        parts: ['elementos en común', 'ambas condiciones juntas', 'elementos que comparten'],
      },
    },
    {
      say: 'La **unión** $A\\cup B$, «A unión B», contiene los elementos de al menos uno de los conjuntos, incluidos los comunes. La **diferencia** $A\\setminus B$, «A menos B», contiene los de $A$ que no están en $B$.\n\nEl **complemento** $A^c$, «complemento de A», contiene los elementos del universo $U$ que no están en $A$. La unión incluye la intersección; no se debe omitir esa zona.',
      dur: 3,
      board: [
        {
          label: 'Unión',
          tex: 'A\\cup B=\\{x:\\ x\\in A\\ \\p{1}{\\text{o}}\\ x\\in B\\}',
          parts: ['al menos una condición'],
        },
        {
          label: 'Diferencia',
          tex: 'A\\setminus B=\\p{1}{\\{2,4,8,10\\}}',
          parts: ['elementos solo del primero'],
        },
        {
          label: 'Complemento',
          tex: 'A^c=\\p{1}{U\\setminus A}=\\p{2}{\\{1,3,5,7,9,11\\}}',
          parts: ['elementos fuera del conjunto', 'elementos del complemento'],
        },
      ],
    },
    {
      say: 'El **cardinal** de un conjunto finito es su cantidad de elementos; $|A|$ se lee «cardinal de A». Para contar una unión, se suman los cardinales de ambos conjuntos y se resta el de su intersección. Los elementos comunes aparecen en las dos sumas y deben contarse una sola vez. La fórmula permite evitar ese doble conteo.',
      ask: {
        prompt: 'Con $|A|=6$, $|B|=4$ y $|A\\cap B|=2$, ¿cuántos elementos tiene $A\\cup B$?',
        options: ['8', '10', '12'],
        answer: 0,
        explain:
          '6 + 4 cuenta dos veces el 6 y el 12. Se resta una vez la intersección: $6+4-2=8$.',
      },
      board: {
        label: 'Inclusión–exclusión',
        tex: '|A\\cup B|=\\p{1}{\\cC{|A|}}+\\p{2}{\\cA{|B|}}-\\p{3}{\\cM{|A\\cap B|}}',
        parts: [
          'total del primer conjunto',
          'total del segundo conjunto',
          'elementos contados dos veces',
        ],
      },
    },
  ],
};

export const LESSONS_W01: Record<string, LessonStep> = {
  'w1-c1': L_SETS,
  'w1-c2': L2,
  'w1-c3': L3,
  'w1-c4': L4,
  'w1-c5': L5,
  'w1-c6': L6,
  'w1-c7': L7,
  'w1-c8': L8,
};
