import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Dot } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, parseNum } from '../shared/ui';
import {
  EqLine,
  Grid,
  MatInput,
  Vec,
  fromCols,
  lattice,
  lerpM,
  I2,
  snap,
  texEq,
  type V2,
} from './kit';

// ============================================================================
// CASO 4.5 · «Trenes fantasma» — sistemas de ecuaciones lineales
// Una ecuación lineal = una recta de soluciones; un sistema = intersección; eliminación;
// una, ninguna o infinitas soluciones; forma matricial Ax = b; escalonamiento de Gauss.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);

// ---------------------------------------------------------------- lesson
function SystemLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState<V2>([0, 0]);
  const onPt = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    setPt(t);
    if (t[0] + t[1] === 5 && t[0] - t[1] === 1) unlock();
  });
  if (beat === 3) {
    const cases: { l: [number, number, number][]; name: string; c: [number, number] }[] = [
      {
        l: [
          [1, 1, 5],
          [1, -1, 1],
        ],
        name: 'una solución',
        c: [330, 330],
      },
      {
        l: [
          [1, 1, 5],
          [1, 1, 2],
        ],
        name: 'ninguna',
        c: [800, 330],
      },
      {
        l: [
          [1, 1, 5],
          [2, 2, 10],
        ],
        name: 'infinitas',
        c: [1270, 330],
      },
    ];
    return (
      <Stage ref={svg}>
        {cases.map((k, i) => {
          const Q = lattice(k.c[0], k.c[1], 30, 6.5, 6);
          return (
            <g key={i} opacity={clamp(at(3) * 3 - i, 0, 1)}>
              <Grid P={Q} opacity={0} R={8} />
              <EqLine
                P={Q}
                a={k.l[0][0]}
                b={k.l[0][1]}
                c={k.l[0][2]}
                color={C.cyan}
                width={i === 2 ? 9 : 4}
              />
              <EqLine P={Q} a={k.l[1][0]} b={k.l[1][1]} c={k.l[1][2]} color={C.amber} />
              {i === 0 && <Dot x={Q.x(3)} y={Q.y(2)} r={8} color={C.green} />}
              <Cap x={k.c[0]} y={k.c[1] + 220} size={20} color={C.text}>
                {k.name}
              </Cap>
              <Cap
                x={k.c[0]}
                y={k.c[1] + 262}
                size={18}
                color={C.muted}
                tex={`${texEq(k.l[0][0], k.l[0][1], k.l[0][2])},\\ ${texEq(k.l[1][0], k.l[1][1], k.l[1][2])}`}
              />
            </g>
          );
        })}
        {answer !== null && (
          <Cap x={800} y={680} size={20} color={C.green} tex="2x+2y=4\iff x+y=2" />
        )}
      </Stage>
    );
  }
  if (beat === 5) {
    const st = [
      '\\left(\\begin{array}{ccc|c}1&1&1&6\\\\2&1&-1&1\\\\1&-1&2&5\\end{array}\\right)',
      '\\left(\\begin{array}{ccc|c}1&1&1&6\\\\0&-1&-3&-11\\\\0&-2&1&-1\\end{array}\\right)',
      '\\left(\\begin{array}{ccc|c}1&1&1&6\\\\0&-1&-3&-11\\\\0&0&7&21\\end{array}\\right)',
    ];
    const ops = ['', 'F_2-2F_1,\\ \\ F_3-F_1', 'F_3-2F_2'];
    return (
      <Stage ref={svg}>
        {st.map((t, i) => (
          <g key={i} opacity={clamp(at(5) * 3 - i, 0, 1)}>
            <Cap x={420 + i * 440} y={330} size={26} color={i === 2 ? C.green : C.text} tex={t} />
            {i > 0 && (
              <Cap
                x={200 + i * 440}
                y={250}
                size={18}
                color={C.amber}
                tex={`\\xrightarrow{${ops[i]}}`}
              />
            )}
          </g>
        ))}
        <Cap x={800} y={500} size={24} color={C.text} tex="7z=21\Rightarrow z=3" opacity={at(5)} />
        {answer !== null && (
          <Cap
            x={800}
            y={560}
            size={24}
            color={C.green}
            tex="-y-9=-11\Rightarrow y=2,\qquad x=6-2-3=1"
          />
        )}
      </Stage>
    );
  }
  const along = beat === 0 ? -2 + 7 * at(0) : 0;
  return (
    <Stage ref={svg}>
      <Grid
        P={P}
        M={beat === 4 ? lerpM(I2, fromCols([1, 1], [1, -1]), at(4)) : I2}
        color={C.violet}
        opacity={beat === 4 ? 0.45 : 0}
      />
      {beat <= 2 && <EqLine P={P} a={1} b={1} c={5} color={C.cyan} label="x+y=5" labelAt={0.2} />}
      {(beat === 1 || beat === 2) && (
        <EqLine P={P} a={1} b={-1} c={1} color={C.amber} label="x-y=1" labelAt={0.85} />
      )}
      {beat === 0 && (
        <>
          <Dot x={P.x(along)} y={P.y(5 - along)} r={9} color={C.cyan} />
          <Cap
            x={1370}
            y={260}
            size={24}
            color={C.text}
            tex={`(x,y)=(${along.toFixed(1).replace('.', '{,}')},\\ ${(5 - along).toFixed(1).replace('.', '{,}')})`}
          />
          <Cap x={1370} y={320} size={20} color={C.muted}>
            todos suman 5
          </Cap>
        </>
      )}
      {beat === 1 && (
        <>
          <Knob x={P.x(pt[0])} y={P.y(pt[1])} color={C.green} onPointerDown={onPt} r={14} />
          <Cap
            x={1370}
            y={250}
            size={24}
            color={pt[0] + pt[1] === 5 ? C.green : C.text}
            tex={`x+y=${pt[0] + pt[1]}`}
          />
          <Cap
            x={1370}
            y={310}
            size={24}
            color={pt[0] - pt[1] === 1 ? C.green : C.text}
            tex={`x-y=${pt[0] - pt[1]}`}
          />
        </>
      )}
      {beat === 2 && (
        <>
          <Dot x={P.x(3)} y={P.y(2)} r={10} color={C.green} />
          <Cap x={1370} y={220} size={24} color={C.cyan} tex="x+y=5" />
          <Cap x={1370} y={270} size={24} color={C.amber} tex="x-y=1" />
          <line
            x1={1250}
            x2={1490}
            y1={300}
            y2={300}
            stroke={C.muted}
            strokeWidth={2}
            opacity={at(2)}
          />
          <Cap x={1370} y={335} size={24} color={C.text} tex="2x\phantom{+y}=6" opacity={at(2)} />
          <Cap
            x={1370}
            y={395}
            size={24}
            color={C.green}
            tex="x=3,\ \ y=2"
            opacity={clamp(at(2) * 2 - 1, 0, 1)}
          />
        </>
      )}
      {beat === 4 && (
        <>
          <Vec
            P={P}
            v={[3, 2]}
            color={C.dim}
            dashed
            width={3}
            label="\vec x"
            opacity={1 - at(4) * 0.5}
          />
          <Vec P={P} v={[5, 1]} color={C.green} label="\vec b" progress={at(4)} />
          <Cap x={1370} y={260} size={22} color={C.text} tex="A\vec x=\vec b" />
          <Cap x={1370} y={320} size={20} color={C.muted}>
            ¿qué vector cae en b?
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sistemas de ecuaciones lineales',
  intro: {
    question: '¿Cómo se despejan varias incógnitas con varias ecuaciones a la vez?',
    text: 'Cada ecuación lineal es una recta, y resolver el sistema es buscar dónde se cruzan. La eliminación va combinando ecuaciones hasta despejar una incógnita por vez. Con los trenes y los vagones que contó el sensor del puente Barón vamos a deducir cuántos trenes de cada tipo pasaron.',
  },
  Scene: SystemLesson,
  beats: [
    {
      say: 'Una ecuación **lineal** con dos incógnitas, como $x+y=5$, tiene infinitas soluciones: todos los pares que suman 5. Dibujados, forman una recta.',
      dur: 3,
      board: {
        label: 'Ecuación lineal',
        tex: '\\p{1}{a}x+\\p{2}{b}y=\\p{3}{c}',
        body: 'Sus soluciones forman una recta del plano.',
        parts: [
          'peso de la primera incógnita',
          'peso de la segunda incógnita',
          'valor que deben alcanzar',
        ],
      },
    },
    {
      say: 'Dos ecuaciones a la vez forman un **sistema**. Una solución tiene que cumplir ambas: está en las dos rectas, en el punto donde se cortan.',
      gate: 'Arrastra el punto verde hasta que cumpla las dos ecuaciones.',
      board: {
        label: 'Sistema',
        tex: '\\begin{cases}\\p{1}{x+y=5}\\\\\\p{2}{x-y=1}\\end{cases}',
        parts: ['condición de la suma', 'condición de la diferencia'],
      },
    },
    {
      say: 'Para resolverlo sin dibujar se **elimina** una incógnita sumando o restando ecuaciones (o múltiplos de ellas). Aquí, sumarlas hace desaparecer $y$.',
      dur: 3,
      board: {
        label: 'Eliminación',
        tex: '\\begin{aligned}(x+y)+(x-y)&=5+1\\\\ \\p{1}{2x}&\\p{1}{=6}\\\\ \\p{2}{x=3},\\ &\\p{3}{y=2}\\end{aligned}',
        parts: [
          'ecuación con una incógnita',
          'primera incógnita resuelta',
          'segunda incógnita resuelta',
        ],
      },
    },
    {
      say: 'No siempre hay una única solución. Si las rectas son paralelas no hay ninguna; si son la misma recta, hay infinitas.',
      ask: {
        prompt: '¿Cuántas soluciones tiene el sistema $x+y=5$, $2x+2y=4$?',
        options: ['Ninguna: son rectas paralelas', 'Una', 'Infinitas'],
        answer: 0,
        explain:
          'La segunda ecuación es $x+y=2$: misma inclinación y otra altura. Ningún par suma 5 y 2 a la vez.',
      },
      board: {
        label: 'Tres casos',
        tex: '\\#\\,\\text{soluciones}\\in\\{\\p{1}{1},\\ \\p{2}{0},\\ \\p{3}{\\infty}\\}',
        body: 'Una si las rectas se cortan, ninguna si son paralelas distintas, infinitas si coinciden.',
        parts: ['rectas que se cortan', 'rectas paralelas distintas', 'rectas que coinciden'],
      },
    },
    {
      say: 'Un sistema se escribe con una matriz: coeficientes en $A$, incógnitas en $\\vec x$, términos libres en $\\vec b$. Resolverlo es encontrar el vector que la transformación $A$ lleva a $\\vec b$.',
      dur: 3.2,
      board: {
        label: 'Forma matricial',
        tex: '\\underbrace{\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}}_{\\p{1}{A}}\\underbrace{\\begin{pmatrix}x\\\\y\\end{pmatrix}}_{\\p{2}{\\vec x}}=\\underbrace{\\begin{pmatrix}5\\\\1\\end{pmatrix}}_{\\p{3}{\\vec b}}',
        parts: [
          'coeficientes del sistema',
          'incógnitas que buscamos',
          'valores que deben alcanzar',
        ],
      },
    },
    {
      say: 'Con más incógnitas se hace lo mismo, en orden: se anota la **matriz ampliada** y se elimina $x$ de las filas de abajo, después $y$. Queda una escalera que se resuelve de abajo hacia arriba.',
      ask: {
        prompt:
          'La última fila dice $7z=21$, así que $z=3$. La segunda dice $-y-3z=-11$. ¿Cuánto vale $y$?',
        options: ['2', '−2', '20'],
        answer: 0,
        explain: '$-y-9=-11\\Rightarrow y=2$. Y la primera fila: $x=6-2-3=1$.',
      },
      board: [
        {
          label: 'Método de Gauss',
          tex: '\\p{1}{\\left(\\begin{array}{ccc|c}1&1&1&6\\\\0&-1&-3&-11\\\\0&0&7&21\\end{array}\\right)}',
          body: 'Operaciones permitidas: intercambiar filas, multiplicar una fila por un número $\\neq0$ y sumarle a una fila un múltiplo de otra.',
          parts: ['sistema en escalera'],
        },
        { tex: '\\p{2}{(x,y,z)=(1,2,3)}', parts: ['sistema en escalera', 'solución del sistema'] },
      ],
    },
  ],
};

// ---------------------------------------------------------------- demo
const PD = plane([0, 10], [0, 9], { x: 330, y: 120, w: 780, h: 600 });

function GhostDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const solved = beat >= 2 || (beat === 1 && answer !== null);
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        yTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
        xLabel="x"
        yLabel="y"
        grid
      />
      <EqLine
        P={PD}
        a={1}
        b={1}
        c={9}
        color={C.cyan}
        label="x+y=9"
        labelAt={0.1}
        opacity={beat === 0 ? at(0) : 1}
      />
      <EqLine
        P={PD}
        a={2}
        b={4}
        c={30}
        color={C.amber}
        label="2x+4y=30"
        labelAt={0.75}
        opacity={beat === 0 ? clamp(at(0) * 2 - 1, 0, 1) : 1}
      />
      {solved && <Dot x={PD.x(3)} y={PD.y(6)} r={11} color={C.green} />}
      <Cap x={1380} y={220} size={22} color={C.muted}>
        x: mantención (2 vagones)
      </Cap>
      <Cap x={1380} y={260} size={22} color={C.muted}>
        y: carga (4 vagones)
      </Cap>
      {solved && <Cap x={1380} y={340} size={26} color={C.green} tex="(x,y)=(3,6)" />}
      {beat === 2 && answer !== null && (
        <Cap x={1380} y={410} size={22} color={C.red} tex="\text{horario: }(3,0)" />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Kind = 'una' | 'ninguna' | 'infinitas';

function AxleCounter({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 23 + round);
    // round 0: integer solution of a 2×2 system
    let e: number[][] = [];
    let sol: V2 = [3, 2];
    for (let t = 0; t < 100; t++) {
      sol = [randInt(r, -3, 6), randInt(r, -3, 6)];
      const a1 = randInt(r, 1, 4);
      const b1 = pick(r, [-3, -2, -1, 1, 2, 3]);
      const a2 = pick(r, [-2, -1, 1, 2, 3]);
      const b2 = pick(r, [-3, -2, -1, 1, 2, 4]);
      if (a1 * b2 - a2 * b1 === 0) continue;
      e = [
        [a1, b1, a1 * sol[0] + b1 * sol[1]],
        [a2, b2, a2 * sol[0] + b2 * sol[1]],
      ];
      break;
    }
    // round 1: classify
    const kind = pick(r, ['una', 'ninguna', 'infinitas'] as Kind[]);
    const a = randInt(r, 1, 4);
    const b = pick(r, [-3, -2, -1, 1, 2, 3]);
    const c = randInt(r, -6, 9);
    const k = pick(r, [2, 3, -2]);
    const second: number[] =
      kind === 'una'
        ? [a + 1, b, c + 2]
        : kind === 'ninguna'
          ? [k * a, k * b, k * c + pick(r, [1, 2, -3])]
          : [k * a, k * b, k * c];
    // round 2: back substitution on a staircase
    const z = randInt(r, -3, 4);
    const y = randInt(r, -3, 4);
    const x = randInt(r, -3, 5);
    const p = pick(r, [1, 2, -1]);
    const q = pick(r, [1, -1, 2, -2]);
    const d = pick(r, [1, 2, -1, 3]);
    const f = pick(r, [2, 3, -2, 4]);
    return { e, sol, kind, first: [a, b, c], second, st: { p, q, d, f, x, y, z } };
  }, [seed, round]);
  const [vals, setVals] = useState<string[]>(['', '', '']);
  const [ch, setCh] = useState<Kind | null>(null);
  const set = (i: number, s: string) => setVals((o) => o.map((t, k) => (k === i ? s : t)));
  const { e, sol, kind, first, second, st } = data;

  useEffect(() => {
    setVals(['', '', '']);
    setCh(null);
    if (round === 0) {
      api.prompt(
        'El sensor de otro puente da estas dos ecuaciones. Resuelve el sistema.',
        'A\\vec x=\\vec b',
      );
      api.hints([
        'Multiplica una ecuación para que una incógnita tenga el mismo coeficiente (o el opuesto) en ambas.',
        'Resta (o suma) para eliminarla, despeja, y reemplaza en una de las ecuaciones.',
      ]);
    } else if (round === 1) {
      api.prompt('Antes de resolver: ¿cuántas soluciones tiene este sistema?', '');
      api.hints([
        '¿Es una ecuación un múltiplo de la otra en el lado izquierdo?',
        'Si los lados izquierdos son proporcionales, mira si los derechos también lo son.',
      ]);
    } else {
      api.prompt(
        'El sistema ya está escalonado. Resuélvelo de abajo hacia arriba.',
        'z\\to y\\to x',
      );
      api.hints([
        'La última ecuación da $z$ directamente.',
        'Reemplaza $z$ en la segunda para obtener $y$; después $y$ y $z$ en la primera.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (!ch) return;
      const why =
        kind === 'una'
          ? 'Los lados izquierdos no son proporcionales: las rectas se cortan.'
          : kind === 'ninguna'
            ? `La segunda es ${second[0] / first[0]} veces la primera a la izquierda, pero no a la derecha: rectas paralelas.`
            : `La segunda es exactamente ${second[0] / first[0]} veces la primera: es la misma recta.`;
      return api.result(
        ch === kind,
        ch === kind ? why : `No: ${why.charAt(0).toLowerCase()}${why.slice(1)}`,
      );
    }
    const v = vals.map(parseNum);
    if (round === 0) {
      if (v[0] === null || v[1] === null) return;
      if (Math.abs(v[0] - sol[0]) < 0.01 && Math.abs(v[1] - sol[1]) < 0.01)
        return api.result(
          true,
          `$(x,y)=(${sol[0]},${sol[1]})$. Comprobación: $${e[0][0]}\\cdot${par(sol[0])}${sgn(e[0][1])}\\cdot${par(sol[1])}=${e[0][2]}$.`,
        );
      const ok1 = Math.abs(e[0][0] * v[0] + e[0][1] * v[1] - e[0][2]) < 0.01;
      const ok2 = Math.abs(e[1][0] * v[0] + e[1][1] * v[1] - e[1][2]) < 0.01;
      return api.result(
        false,
        ok1 || ok2
          ? `Ese par cumple la ${ok1 ? 'primera' : 'segunda'} ecuación pero no la ${ok1 ? 'segunda' : 'primera'}: está en una sola recta.`
          : 'Ese par no cumple ninguna de las dos. Reemplázalo para comprobar.',
      );
    }
    if (v.some((t) => t === null)) return;
    const { x, y, z } = st;
    const got = { x: v[0]!, y: v[1]!, z: v[2]! };
    if (Math.abs(got.x - x) < 0.01 && Math.abs(got.y - y) < 0.01 && Math.abs(got.z - z) < 0.01)
      return api.result(true, `$z=${z}$, $y=${y}$, $x=${x}$.`);
    if (Math.abs(got.z - z) >= 0.01)
      return api.result(false, `Empieza por abajo: $${st.f}z=${st.f * z}$.`);
    if (Math.abs(got.y - y) >= 0.01)
      return api.result(
        false,
        `Con $z=${z}$ la segunda queda $y${sgn(st.d)}\\cdot${par(z)}=${y + st.d * z}$.`,
      );
    return api.result(false, 'Revisa la primera ecuación con los valores de $y$ y $z$.');
  };

  const { p, q, d, f, x, y, z } = st;
  return (
    <Stage>
      {round === 0 && (
        <>
          <Cap
            x={640}
            y={330}
            size={40}
            color={C.text}
            tex={`\\begin{cases}${texEq(e[0][0], e[0][1], e[0][2])}\\\\${texEq(e[1][0], e[1][1], e[1][2])}\\end{cases}`}
          />
          <MatInput
            x={1150}
            y={340}
            vals={vals}
            onChange={set}
            onEnter={submit}
            rows={2}
            cols={1}
            label="(x, y) ="
          />
        </>
      )}
      {round === 1 && (
        <>
          <Cap
            x={700}
            y={330}
            size={40}
            color={C.text}
            tex={`\\begin{cases}${texEq(first[0], first[1], first[2])}\\\\${texEq(second[0], second[1], second[2])}\\end{cases}`}
          />
          <Choices
            x={700}
            y={520}
            options={['una', 'ninguna', 'infinitas'] as Kind[]}
            value={ch}
            onPick={setCh}
          />
        </>
      )}
      {round === 2 && (
        <>
          <Cap
            x={600}
            y={340}
            size={36}
            color={C.text}
            tex={`\\begin{cases}x${sgn(p)}y${sgn(q)}z=${x + p * y + q * z}\\\\\\phantom{x+{}}y${sgn(d)}z=${y + d * z}\\\\\\phantom{x+y+{}}${f}z=${f * z}\\end{cases}`.replace(
              /([+-])1([yz])/g,
              '$1$2',
            )}
          />
          <MatInput
            x={1150}
            y={340}
            vals={vals}
            onChange={set}
            onEnter={submit}
            rows={3}
            cols={1}
            label="(x, y, z) ="
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
const par = (t: number) => (t < 0 ? `(${t})` : `${t}`);
const sgn = (t: number) => (t < 0 ? `-${Math.abs(t)}` : `+${t}`);

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c5',
  world: 'linear',
  code: '4.5',
  title: 'Trenes fantasma',
  subtitle: 'Sistemas de ecuaciones lineales',
  glyph: 'A\\vec x=\\vec b',
  kind: 'level',
  guide: 'iris',
  teaser:
    'De noche los torniquetes no cuentan nada, pero un sensor de ejes en el puente Barón registra trenes y vagones. Con esos dos números hay que deducir cuántos trenes de cada tipo pasaron.',
  learn:
    'Ecuaciones lineales como rectas, sistemas y su interpretación gráfica, eliminación, número de soluciones, forma matricial $A\\vec x=\\vec b$ y método de Gauss.',
  glyphs: ['system', 'augmented'],
  pitfalls: [
    'Una solución del sistema debe cumplir **todas** las ecuaciones, no solo una.',
    'Al multiplicar una ecuación, se multiplican ambos lados, incluido el término libre.',
    'Lados izquierdos proporcionales: ninguna o infinitas soluciones, según el lado derecho.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'nar',
          text: 'Centro de control del Metro, tres y veinticinco. Lucía tenía las dos manos alrededor de un vaso de café que se había enfriado hacía rato.',
        },
        {
          who: 'lucia',
          text: 'De noche los torniquetes se apagan, pero el sensor del puente Barón contó 9 trenes y 30 vagones. El horario solo reconoce trenes de mantención.',
        },
        { who: 'iris', text: '¿Cuántos vagones lleva cada tipo de tren?' },
        {
          who: 'lucia',
          text: 'Dos los de mantención y cuatro los de carga. Si pasaron trenes de carga, alguien autorizó el cruce sin ponerlo en mi horario.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El sensor del puente',
      Scene: GhostDemo,
      beats: [
        {
          say: 'Anoche pasaron 9 trenes con 30 vagones en total. Los de mantención llevan 2 vagones y los de carga, 4. Cada dato es una ecuación, y cada ecuación, una recta.',
          dur: 2.4,
          note: {
            label: 'Sensor del puente',
            tex: 'x+y=9,\\quad 2x+4y=30',
            body: '$x$: trenes de mantención; $y$: trenes de carga.',
          },
        },
        {
          say: 'La respuesta está donde se cortan las dos rectas.',
          ask: {
            prompt: '¿Cuántos trenes de cada tipo pasaron?',
            options: [
              '3 de mantención y 6 de carga',
              '6 de mantención y 3 de carga',
              '4,5 de cada tipo',
            ],
            answer: 0,
            explain: 'A la segunda se le resta 2 veces la primera: $2y=12$, así que $y=6$ y $x=3$.',
          },
          note: { label: 'Solución', tex: '(x,y)=(3,6)' },
        },
        {
          say: 'El horario oficial de esa noche solo tiene trenes de mantención: tres.',
          ask: {
            prompt: '¿Cuántos trenes de carga pasaron sin registro?',
            options: ['6', '3', '0'],
            answer: 0,
            explain:
              'El sensor exige $y=6$. Seis trenes de carga que no existen en ningún horario.',
          },
          note: {
            label: 'Trenes fantasma',
            tex: 'y=6',
            body: 'Seis trenes de carga sin horario, cada noche.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Sensores de ejes', Comp: AxleCounter, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'lucia',
          text: 'Tres de mantención y seis de carga. Los tres primeros están en el horario; los otros seis no aparecen en ninguna parte.',
        },
        {
          who: 'iris',
          text: 'Seis cruces y ningún permiso firmado. Alguien en este edificio tuvo que dar la orden de palabra.',
        },
        {
          who: 'teo',
          text: 'Ya sé cómo se arma la tabla del M-7: primero estira el mapa y después lo inclina hacia abajo. Son dos tablas aplicadas una después de la otra.',
        },
        {
          who: 'tu',
          text: 'Fíjate en cuál se aplica primero. Con otro orden, el resultado podría ser distinto.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'system',
    world: 'linear',
    tex: 'A\\vec x=\\vec b',
    name: 'Sistema lineal',
    read: 'a por equis igual a be',
    meaning:
      'Varias ecuaciones lineales a la vez; la solución cumple todas. Puede haber una, ninguna o infinitas.',
  },
  {
    id: 'augmented',
    world: 'linear',
    tex: '(A\\,|\\,\\vec b)',
    name: 'Matriz ampliada',
    read: 'matriz ampliada',
    meaning:
      'Coeficientes y términos libres juntos; se escalona con operaciones de fila (método de Gauss).',
  },
];
