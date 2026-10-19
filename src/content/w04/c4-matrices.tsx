import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import { Dot } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap, mix } from '../shared/lesson';
import { randInt, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, Knob, parseNum } from '../shared/ui';
import {
  Grid,
  I2,
  MatInput,
  Shape,
  Vec,
  cols,
  det,
  eqV,
  fromCols,
  lattice,
  lerpM,
  mv,
  n,
  sc,
  snap,
  texM,
  texV,
  txtV,
  type M2,
  type V2,
} from './kit';

// ============================================================================
// CASO 4.4 · «La tabla» — matrices como transformaciones lineales
// Una transformación lineal queda fija por dónde caen î y ĵ (las columnas); A·v es
// x·(columna 1) + y·(columna 2), o fila por vector; ejemplos: giro, cizalle, reflejo, escala.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);
const M0: M2 = [
  [2, -1],
  [1, 1],
];

// ---------------------------------------------------------------- lesson
const MINI: { M: M2; name: string; at: [number, number] }[] = [
  {
    M: [
      [0, -1],
      [1, 0],
    ],
    name: 'giro de 90°',
    at: [430, 290],
  },
  {
    M: [
      [1, 1],
      [0, 1],
    ],
    name: 'cizalle',
    at: [930, 290],
  },
  {
    M: [
      [1, 0],
      [0, -1],
    ],
    name: 'reflejo',
    at: [430, 640],
  },
  {
    M: [
      [2, 0],
      [0, 0.5],
    ],
    name: 'escala',
    at: [930, 640],
  },
];

function MatrixLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [ci, setCi] = useState<V2>([1, 0]);
  const [cj, setCj] = useState<V2>([0, 1]);
  const check = (a: V2, b: V2) => {
    if (eqV(a, [0, 1]) && eqV(b, [-1, 0])) unlock();
  };
  const onI = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    setCi(t);
    check(t, cj);
  });
  const onJ = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    setCj(t);
    check(ci, t);
  });
  if (beat === 4) {
    return (
      <Stage ref={svg}>
        {MINI.map((m, k) => {
          const Q = lattice(m.at[0], m.at[1], 30, 5, 4.2);
          const M = lerpM(I2, m.M, clamp(at(4) * 1.6 - k * 0.2, 0, 1));
          return (
            <g key={k}>
              <Grid P={Q} M={M} color={C.violet} opacity={0.5} R={10} />
              <Shape P={Q} M={M} />
              <Cap x={m.at[0]} y={m.at[1] + 152} size={18} color={C.muted}>
                {m.name}
              </Cap>
              <Cap x={m.at[0] + 230} y={m.at[1]} size={20} color={C.text} tex={texM(m.M)} />
            </g>
          );
        })}
      </Stage>
    );
  }
  const M =
    beat === 0
      ? lerpM(I2, M0, at(0))
      : beat === 1
        ? fromCols(ci, cj)
        : beat === 2
          ? lerpM(I2, M0, at(2))
          : M0;
  const [c1, c2] = cols(M);
  const v: V2 = beat === 3 ? [1, 3] : [2, 1];
  const Av = mv(M, v);
  return (
    <Stage ref={svg}>
      <Grid P={P} M={M} color={C.violet} opacity={0.55} />
      <Shape P={P} M={M} opacity={0.3} />
      <Vec
        P={P}
        v={c1}
        color={C.cyan}
        width={6}
        label={beat === 1 ? undefined : 'A\\hat\\imath'}
        off={[18, 22]}
      />
      <Vec
        P={P}
        v={c2}
        color={C.amber}
        width={6}
        label={beat === 1 ? undefined : 'A\\hat\\jmath'}
        off={[-28, -14]}
      />
      {beat === 1 && (
        <>
          <Knob x={P.x(ci[0])} y={P.y(ci[1])} color={C.cyan} onPointerDown={onI} r={14} label="î" />
          <Knob
            x={P.x(cj[0])}
            y={P.y(cj[1])}
            color={C.amber}
            onPointerDown={onJ}
            r={14}
            label="ĵ"
          />
          <Dot x={P.x(0)} y={P.y(1)} r={6} color={C.cyan} ring opacity={0.6} />
          <Dot x={P.x(-1)} y={P.y(0)} r={6} color={C.amber} ring opacity={0.6} />
          <Cap x={1370} y={260} size={26} color={C.text} tex={`A=${texM(M)}`} />
        </>
      )}
      {(beat === 2 || (beat === 3 && answer !== null)) && (
        <>
          <Vec
            P={P}
            v={v}
            color={C.dim}
            width={3}
            dashed
            opacity={beat === 2 ? 1 - at(2) * 0.6 : 0.4}
          />
          <Vec P={P} v={sc(v[0], c1)} color={C.cyan} width={3} opacity={0.5} />
          <Vec P={P} v={sc(v[1], c2)} from={sc(v[0], c1)} color={C.amber} width={3} opacity={0.5} />
          <Vec P={P} v={Av} color={C.green} label="A\vec v" off={[24, -16]} />
        </>
      )}
      {beat === 0 && (
        <Cap x={1370} y={260} size={22} color={C.muted}>
          rectas siguen rectas
        </Cap>
      )}
      {beat === 2 && (
        <Cap
          x={1370}
          y={260}
          size={24}
          color={C.text}
          tex={`${texM(M0)}${texV(v)}=2${texV([2, 1])}+1${texV([-1, 1])}`}
          opacity={at(2)}
        />
      )}
      {beat === 2 && (
        <Cap x={1370} y={340} size={24} color={C.green} tex={`=${texV([3, 3])}`} opacity={at(2)} />
      )}
      {beat === 3 && (
        <Cap
          x={1370}
          y={260}
          size={24}
          color={C.text}
          tex={`${texM(M0)}${texV(v)}=${answer !== null ? texV(mv(M0, v)) : '\\ ?'}`}
        />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Matrices como transformaciones',
  intro: {
    question: '¿Cómo se escribe con cuatro números una manera de deformar el plano?',
    text: 'Una transformación lineal mueve el plano entero sin curvar sus líneas, y queda determinada por adónde manda los dos vectores base. Esos dos destinos, escritos como columnas, forman su matriz. Las pantallas del Metro pasan el GPS de los trenes por una tabla así antes de dibujarlo.',
  },
  Scene: MatrixLesson,
  beats: [
    {
      say: 'Una **transformación lineal** mueve el plano entero de una manera ordenada: las rectas siguen rectas, el origen no se mueve y la cuadrícula sigue pareja.',
      dur: 3,
      board: {
        label: 'Transformación lineal',
        tex: '\\begin{aligned}T(\\p{1}{\\vec u+\\vec v})&=T(\\vec u)+T(\\vec v)\\\\T(\\p{2}{k\\vec v})&=k\\,T(\\vec v)\\end{aligned}',
        body: 'Respeta sumas y múltiplos: por eso la cuadrícula se deforma sin doblarse.',
        parts: ['suma que se conserva', 'escala que se conserva'],
      },
    },
    {
      say: 'Basta seguir dos flechas: $\\hat\\imath=(1,0)$ y $\\hat\\jmath=(0,1)$. Donde caen, arrastran consigo toda la cuadrícula. Sus nuevas posiciones se escriben como columnas: eso es una **matriz**.',
      gate: 'Gira el plano un cuarto de vuelta: lleva $\\hat\\imath$ a $(0,1)$ y $\\hat\\jmath$ a $(-1,0)$.',
      board: {
        label: 'Matriz',
        tex: 'A=\\begin{pmatrix}\\p{1}{\\cC{a}}&\\p{2}{\\cA{b}}\\\\\\p{1}{\\cC{c}}&\\p{2}{\\cA{d}}\\end{pmatrix}',
        body: 'Primera columna: dónde cae $\\hat\\imath$. Segunda columna: dónde cae $\\hat\\jmath$.',
        parts: ['destino del eje horizontal', 'destino del eje vertical'],
      },
    },
    {
      say: 'Un vector $\\vec v=(x,y)$ es $x\\hat\\imath+y\\hat\\jmath$. Como la transformación respeta sumas y múltiplos, su imagen es $x$ veces la primera columna más $y$ veces la segunda.',
      dur: 3.2,
      board: {
        label: 'Matriz por vector',
        tex: 'A\\vec v=\\p{1}{x}\\begin{pmatrix}\\cC{a}\\\\\\cC{c}\\end{pmatrix}+\\p{2}{y}\\begin{pmatrix}\\cA{b}\\\\\\cA{d}\\end{pmatrix}=\\p{3}{\\begin{pmatrix}ax+by\\\\cx+dy\\end{pmatrix}}',
        parts: ['peso del destino horizontal', 'peso del destino vertical', 'vector transformado'],
      },
    },
    {
      say: 'En la práctica se calcula por **filas**: cada componente del resultado es una fila de la matriz por el vector, como un producto punto.',
      ask: {
        prompt:
          '¿Cuánto es $\\begin{pmatrix}2&-1\\\\1&1\\end{pmatrix}\\begin{pmatrix}1\\\\3\\end{pmatrix}$?',
        options: ['(−1, 4)', '(5, 2)', '(2, 3)'],
        answer: 0,
        explain: 'Primera fila: $2\\cdot1+(-1)\\cdot3=-1$. Segunda: $1\\cdot1+1\\cdot3=4$.',
      },
      board: {
        label: 'Fila por vector',
        tex: '\\begin{pmatrix}\\cC{2}&\\cC{-1}\\\\\\cA{1}&\\cA{1}\\end{pmatrix}\\begin{pmatrix}1\\\\3\\end{pmatrix}=\\begin{pmatrix}\\p{1}{\\cC{2-3}}\\\\\\p{2}{\\cA{1+3}}\\end{pmatrix}=\\p{3}{\\begin{pmatrix}-1\\\\4\\end{pmatrix}}',
        parts: ['nueva componente horizontal', 'nueva componente vertical', 'vector transformado'],
      },
    },
    {
      say: 'Cada matriz es un movimiento del plano. Algunas que conviene reconocer a simple vista: un giro, un cizalle, un reflejo y un cambio de escala.',
      dur: 3.4,
      board: {
        label: 'Ejemplos',
        tex: '\\underbrace{\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}}_{\\text{giro}}\\ \\underbrace{\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}}_{\\text{cizalle}}\\ \\underbrace{\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}}_{\\text{reflejo}}',
        body: 'Escala: $\\begin{pmatrix}2&0\\\\0&\\frac12\\end{pmatrix}$. La **identidad** $I$ no mueve nada: $I\\vec v=\\vec v$.',
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const A: M2 = [
  [2, 0],
  [-4, 3],
];

function TableDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const M = beat === 0 ? lerpM(I2, A, at(0)) : A;
  const real: V2 = [3, 4];
  const moved = beat >= 2 || (beat === 1 && answer !== null);
  const pos =
    beat === 1 && answer !== null ? mix(real, [6, 0], beats.p) : moved ? ([6, 0] as V2) : real;
  const st: { at: V2; name: string; color: string }[] = [
    { at: [0, 0], name: 'Puerto', color: '#cfe' },
    { at: [6, 0], name: 'Taller El Salto', color: C.amber },
    { at: [3, 4], name: 'Cocheras Barón', color: C.red },
  ];
  return (
    <Stage>
      <Grid P={P} M={M} color={C.violet} opacity={0.45} />
      {st.map((s) => (
        <g key={s.name}>
          <circle
            cx={P.x(s.at[0])}
            cy={P.y(s.at[1])}
            r={11}
            fill={C.bg}
            stroke={s.color}
            strokeWidth={3}
          />
          <Cap x={P.x(s.at[0])} y={P.y(s.at[1]) + 30} size={15} color={s.color}>
            {s.name}
          </Cap>
        </g>
      ))}
      <Vec P={P} v={cols(M)[0]} color={C.cyan} width={5} label="A\hat\imath" off={[26, 10]} />
      <Vec P={P} v={cols(M)[1]} color={C.amber} width={5} label="A\hat\jmath" off={[-30, -10]} />
      {beat >= 1 && (
        <rect
          x={P.x(pos[0]) - 22}
          y={P.y(pos[1]) - 11}
          width={44}
          height={22}
          rx={5}
          fill={C.magenta}
        />
      )}
      {beat >= 1 && (
        <Cap x={P.x(pos[0])} y={P.y(pos[1]) - 30} size={15} color={C.magenta}>
          M-7
        </Cap>
      )}
      <Cap x={1370} y={240} size={26} color={C.text} tex={`A=${texM(A)}`} />
      {moved && (
        <Cap x={1370} y={330} size={24} color={C.green} tex={`A${texV(real)}=${texV([6, 0])}`} />
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1370} y={420} size={24} color={C.green} tex="A\vec 0=\vec 0" />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const KNOWN: { M: M2; name: string }[] = [
  {
    M: [
      [0, -1],
      [1, 0],
    ],
    name: 'giro de 90° a la izquierda',
  },
  {
    M: [
      [0, 1],
      [-1, 0],
    ],
    name: 'giro de 90° a la derecha',
  },
  {
    M: [
      [1, 1],
      [0, 1],
    ],
    name: 'cizalle horizontal',
  },
  {
    M: [
      [1, 0],
      [1, 1],
    ],
    name: 'cizalle vertical',
  },
  {
    M: [
      [1, 0],
      [0, -1],
    ],
    name: 'reflejo en el eje x',
  },
  {
    M: [
      [-1, 0],
      [0, 1],
    ],
    name: 'reflejo en el eje y',
  },
  {
    M: [
      [2, 0],
      [0, 1],
    ],
    name: 'estiramiento horizontal',
  },
  {
    M: [
      [-1, 0],
      [0, -1],
    ],
    name: 'media vuelta',
  },
];

function Decode({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 19 + round);
    let M: M2 = [
      [1, 2],
      [-1, 1],
    ];
    for (let t = 0; t < 80; t++) {
      M = [
        [randInt(r, -2, 3), randInt(r, -2, 2)],
        [randInt(r, -2, 2), randInt(r, -1, 3)],
      ];
      if (
        det(M) !== 0 &&
        !eqV(cols(M)[0], cols(M)[1]) &&
        Math.abs(M[0][1]) + Math.abs(M[1][0]) > 0 &&
        Math.max(...M.flat().map(Math.abs)) <= 3
      )
        break;
    }
    const v: V2 = [randInt(r, -3, 3) || 2, randInt(r, -3, 3) || -1];
    const opts = shuffle(r, KNOWN).slice(0, 3);
    const right = randInt(r, 0, 2);
    return { M, v, opts, right };
  }, [seed, round]);
  const [vals, setVals] = useState<string[]>(['', '', '', '']);
  const [ch, setCh] = useState<string | null>(null);
  const { M, v, opts, right } = data;
  const set = (i: number, s: string) => setVals((o) => o.map((x, k) => (k === i ? s : x)));

  useEffect(() => {
    setVals(['', '', '', '']);
    setCh(null);
    if (round === 0) {
      api.prompt(
        'La tabla deforma la cuadrícula así. Escribe su matriz.',
        'A=\\big(\\,A\\hat\\imath\\ \\ A\\hat\\jmath\\,\\big)',
      );
      api.hints([
        'Lee dónde terminan las flechas $A\\hat\\imath$ (celeste) y $A\\hat\\jmath$ (ámbar).',
        'Cada una va en una **columna**, no en una fila.',
      ]);
    } else if (round === 1) {
      api.prompt(
        'El servidor recibe la posición $\\vec v$ del tren. ¿Qué posición dibuja la pantalla?',
        'A\\vec v',
      );
      api.hints([
        'Primera componente: primera fila por $\\vec v$.',
        'Segunda componente: segunda fila por $\\vec v$.',
      ]);
    } else {
      api.prompt(
        'Otra tabla convierte la F gris en la F ámbar. ¿Cuál es su matriz?',
        'A\\hat\\imath,\\ A\\hat\\jmath',
      );
      api.hints([
        'Mira hacia dónde quedó el palo largo de la F (la dirección de $\\hat\\jmath$).',
        'Las columnas de la matriz son las imágenes de $\\hat\\imath$ y $\\hat\\jmath$.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (ch === null) return;
      const k = ['A', 'B', 'C'].indexOf(ch);
      if (k === right) return api.result(true, `Es un ${opts[right].name}.`);
      return api.result(
        false,
        `Esa matriz hace un ${opts[k].name}. Aplícala a $\\hat\\jmath=(0,1)$ y compara con el palo largo de la F.`,
      );
    }
    const x = vals.map(parseNum);
    if (round === 0) {
      if (x.some((t) => t === null)) return;
      const got: M2 = [
        [x[0]!, x[1]!],
        [x[2]!, x[3]!],
      ];
      if (got.flat().every((t, i) => Math.abs(t - M.flat()[i]) < 0.01))
        return api.result(
          true,
          `$A=${texM(M)}$: columnas $A\\hat\\imath=${txtV(cols(M)[0])}$ y $A\\hat\\jmath=${txtV(cols(M)[1])}$.`,
        );
      const T = [M[0][0], M[1][0], M[0][1], M[1][1]];
      if (x.every((t, i) => Math.abs(t! - T[i]) < 0.01))
        return api.result(false, 'Escribiste las imágenes como filas. Van como columnas.');
      return api.result(
        false,
        `Tu matriz manda $\\hat\\imath$ a $${txtV(cols(got)[0])}$ y $\\hat\\jmath$ a $${txtV(cols(got)[1])}$. Compara con las flechas.`,
      );
    }
    if (x[0] === null || x[1] === null) return;
    const t = mv(M, v);
    if (Math.abs(x[0] - t[0]) < 0.01 && Math.abs(x[1] - t[1]) < 0.01)
      return api.result(true, `$${texM(M)}${texV(v)}=${texV(t)}$.`);
    const tr = mv(
      [
        [M[0][0], M[1][0]],
        [M[0][1], M[1][1]],
      ],
      v,
    );
    if (Math.abs(x[0] - tr[0]) < 0.01 && Math.abs(x[1] - tr[1]) < 0.01)
      return api.result(false, 'Multiplicaste columnas por el vector. Se usan las filas.');
    const bad = Math.abs(x[0] - t[0]) >= 0.01 ? 0 : 1;
    return api.result(
      false,
      `Revisa la ${bad === 0 ? 'primera' : 'segunda'} componente: $${n(M[bad][0])}\\cdot${n(v[0])}+${n(M[bad][1])}\\cdot${n(v[1])}$.`.replace(
        /\\cdot(-\d+)/g,
        '\\cdot($1)',
      ),
    );
  };

  return (
    <Stage>
      {round === 0 && (
        <>
          <Grid P={P} M={M} color={C.violet} opacity={0.5} />
          <Vec P={P} v={cols(M)[0]} color={C.cyan} label="A\hat\imath" off={[26, 12]} />
          <Vec P={P} v={cols(M)[1]} color={C.amber} label="A\hat\jmath" off={[-30, -12]} />
          <MatInput x={1230} y={330} vals={vals} onChange={set} onEnter={submit} label="A =" />
        </>
      )}
      {round === 1 && (
        <>
          <Grid P={P} M={M} color={C.violet} opacity={0.3} />
          <Vec P={P} v={v} color={C.dim} width={3} dashed label="\vec v" />
          <Cap
            x={1380}
            y={230}
            size={26}
            color={C.text}
            tex={`A=${texM(M)},\\quad \\vec v=${texV(v)}`}
          />
          <MatInput
            x={1250}
            y={380}
            vals={vals}
            onChange={set}
            onEnter={submit}
            rows={2}
            cols={1}
            label="Av ="
          />
        </>
      )}
      {round === 2 && (
        <>
          <Grid P={P} M={opts[right].M} color={C.violet} opacity={0.35} />
          <Shape P={P} color={C.dim} opacity={0.25} />
          <Shape P={P} M={opts[right].M} />
          {opts.map((o, k) => (
            <Cap
              key={k}
              x={1380}
              y={210 + k * 110}
              size={24}
              color={C.text}
              tex={`\\text{${'ABC'[k]}}:\\ ${texM(o.M)}`}
            />
          ))}
          <Choices x={1380} y={560} options={['A', 'B', 'C']} value={ch} onPick={setCh} />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c4',
  world: 'linear',
  code: '4.4',
  title: 'La tabla',
  subtitle: 'Matrices y transformaciones',
  glyph: 'A\\vec v',
  kind: 'level',
  guide: 'teo',
  teaser:
    'Las pantallas del Metro no dibujan el GPS de los trenes tal como llega: lo pasan por una tabla de cuatro números guardada en el servidor.',
  learn:
    'Transformaciones lineales del plano, matrices $2\\times2$ como imágenes de $\\hat\\imath$ y $\\hat\\jmath$, producto matriz por vector y transformaciones típicas.',
  glyphs: ['matrix', 'matvec'],
  pitfalls: [
    'Las imágenes de $\\hat\\imath$ y $\\hat\\jmath$ van en las **columnas**.',
    '$A\\vec v$ se calcula fila por vector, no columna por vector.',
    'Una matriz siempre deja fijo el origen: no puede trasladar el plano.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'nar',
          text: 'Centro de control del Metro, tres y diez. En el monitor de Teo había cuatro números, y Lucía miraba la puerta cada vez que sonaba el ascensor.',
        },
        {
          who: 'teo',
          text: 'Aquí está la tabla. El servidor cambia la posición antes de dibujarla, y solo lo hace con el M-7, así que podemos ver qué le hace.',
        },
        { who: 'lucia', text: 'Habla más bajo. Mañana todavía tengo que trabajar acá.' },
        {
          who: 'iris',
          text: 'Veamos dónde pone a un tren que está en Cocheras Barón. Después averiguamos quién firmó ese cambio.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La tabla del M-7',
      Scene: TableDemo,
      beats: [
        {
          say: 'La tabla es una matriz $A$. Sus columnas dicen dónde caen $\\hat\\imath$ y $\\hat\\jmath$: la cuadrícula de la pantalla queda así de deformada para el M-7.',
          dur: 2.2,
          note: { label: 'La tabla del M-7', tex: 'A=\\begin{pmatrix}2&0\\\\-4&3\\end{pmatrix}' },
        },
        {
          say: 'Anoche el M-7 estaba en Cocheras Barón, en $(3,4)$.',
          ask: {
            prompt: '¿Dónde lo dibujó la pantalla?',
            options: ['(6, 0): en el Taller El Salto', '(3, 4): donde estaba', '(2, −1)'],
            answer: 0,
            explain:
              'Fila por vector: $2\\cdot3+0\\cdot4=6$ y $-4\\cdot3+3\\cdot4=0$. En pantalla parecía estacionado en el taller.',
          },
          note: {
            label: 'Lo que mostró la pantalla',
            tex: 'A\\begin{pmatrix}3\\\\4\\end{pmatrix}=\\begin{pmatrix}6\\\\0\\end{pmatrix}',
          },
        },
        {
          say: 'Lucía pregunta si la tabla también movería al M-7 cuando está en la estación Puerto, el origen.',
          ask: {
            prompt: '¿Dónde dibuja la tabla el punto $(0,0)$?',
            options: ['En el origen: $A\\vec 0=\\vec 0$', 'En $(2,-4)$', 'Depende de la tabla'],
            answer: 0,
            explain:
              '$A\\vec 0=0\\cdot A\\hat\\imath+0\\cdot A\\hat\\jmath=\\vec 0$ para cualquier matriz. Por eso en la estación nadie notó nada.',
          },
          note: { label: 'El origen no se mueve', tex: 'A\\vec 0=\\vec 0' },
        },
      ],
    },
    { kind: 'challenge', title: 'Decodificar tablas', Comp: Decode, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'teo',
          text: 'El (3, 4) de Cocheras Barón sale como (6, 0), el Taller El Salto. En Puerto, (0, 0), la posición queda igual.',
        },
        {
          who: 'lucia',
          text: 'Por eso a la salida nadie nota nada raro. Yo misma daba por bueno el regreso al taller.',
        },
        {
          who: 'iris',
          text: 'Eso explica un tren. ¿Hay algo en la ciudad que cuente los demás sin pasar por esta sala?',
        },
        {
          who: 'lucia',
          text: 'El sensor de ejes del puente Barón cuenta trenes y vagones, y su registro nunca pasa por esta pantalla.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'matrix',
    world: 'linear',
    tex: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
    name: 'Matriz 2×2',
    read: 'matriz a be ce de',
    meaning:
      'Tabla que describe una transformación lineal: sus columnas son las imágenes de $\\hat\\imath$ y $\\hat\\jmath$.',
  },
  {
    id: 'matvec',
    world: 'linear',
    tex: 'A\\vec v',
    name: 'Matriz por vector',
    read: 'a por ve',
    meaning:
      'Imagen de $\\vec v$: $x$ veces la primera columna más $y$ veces la segunda; se calcula fila por vector.',
  },
];
