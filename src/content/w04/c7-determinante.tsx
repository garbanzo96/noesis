import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Grid, I2, MatInput, Para, Shape, Vec, cols, det, fromCols, inv, lattice, lerpM, mv, n, snap, texM, texV, type M2, type V2 } from './kit';

// ============================================================================
// CASO 4.7 · «Deshacer la pantalla» — determinante e inversa
// det = factor de áreas (ad − bc); signo = orientación; det = 0 aplasta el plano;
// inversa 2×2 y resolución de Ax = b con la inversa.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);
const MG: M2 = [
  [3, 1],
  [1, 2],
];

// ---------------------------------------------------------------- lesson
function DetLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [cj, setCj] = useState<V2>([1, 2]);
  const ci: V2 = [3, 1];
  const onJ = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    setCj(t);
    if (det(fromCols(ci, t)) < 0) unlock();
  });
  const target: M2 =
    beat === 0
      ? [
          [3, 0],
          [0, 2],
        ]
      : beat === 1
        ? [
            [1, 2],
            [0, 1],
          ]
        : beat === 3
          ? fromCols(ci, cj)
          : beat === 4
            ? lerpM(MG, [
                [2, 4],
                [1, 2],
              ], at(4))
            : MG;
  const M = beat <= 2 ? lerpM(I2, target, at(beat)) : beat === 5 ? (at(5) < 0.5 ? lerpM(I2, MG, at(5) * 2) : lerpM(MG, I2, at(5) * 2 - 1)) : target;
  const [a, b] = cols(M);
  const D = det(M);
  const col = D > 0.001 ? C.green : D < -0.001 ? C.red : C.amber;
  return (
    <Stage ref={svg}>
      <Grid P={P} M={M} color={C.violet} opacity={0.45} />
      <Para P={P} a={a} b={b} color={col} opacity={0.3} />
      {beat === 3 && <Shape P={P} M={M} color={C.amber} opacity={0.35} />}
      <Vec P={P} v={a} color={C.cyan} width={5} label="A\hat\imath" off={[26, 16]} />
      <Vec P={P} v={b} color={C.amber} width={5} label={beat === 3 ? undefined : 'A\\hat\\jmath'} off={[-30, -14]} />
      {beat === 3 && <Knob x={P.x(cj[0])} y={P.y(cj[1])} color={C.amber} onPointerDown={onJ} r={14} label="ĵ" />}
      {beat !== 6 && <Cap x={1370} y={240} size={24} color={C.text} tex={`A=${texM(beat <= 2 ? target : beat === 5 ? MG : M, 1)}`} />}
      {beat !== 6 && beat !== 5 && <Cap x={1370} y={340} size={26} color={col} tex={`\\det A=${n(det(beat <= 2 ? target : M), 1)}`} opacity={beat <= 2 ? at(beat) : 1} />}
      {beat === 0 && <Cap x={1370} y={410} size={20} color={C.muted}>3 × 2 = 6 cuadritos</Cap>}
      {beat === 1 && <Cap x={1370} y={410} size={20} color={C.muted}>se desliza: el área no cambia</Cap>}
      {beat === 4 && answer !== null && <Cap x={1370} y={410} size={20} color={C.amber}>el plano quedó en una recta</Cap>}
      {beat === 5 && <Cap x={1370} y={340} size={24} color={C.text} tex={`A^{-1}=\\tfrac15${texM([[2, -1], [-1, 3]])}`} opacity={at(5) > 0.5 ? 1 : 0.3} />}
      {beat === 6 && (
        <>
          <Cap x={1370} y={240} size={22} color={C.text} tex={`A=${texM(MG)},\\ \\vec b=${texV([7, 4])}`} />
          {answer !== null && <Cap x={1370} y={320} size={22} color={C.green} tex={`\\tfrac15${texM([[2, -1], [-1, 3]])}${texV([7, 4])}=${texV([2, 1])}`} />}
          {answer !== null && <Vec P={P} v={[2, 1]} color={C.green} label="\vec x" />}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Determinante e inversa',
  Scene: DetLesson,
  beats: [
    {
      say: 'Una matriz también cambia las **áreas**. El cuadrado formado por $\\hat\\imath$ y $\\hat\\jmath$ (área 1) se convierte en el paralelogramo formado por las columnas. Si la matriz estira 3 veces en horizontal y 2 en vertical, el área se multiplica por 6.',
      dur: 3,
      board: { label: 'Factor de áreas', tex: '\\begin{pmatrix}a&0\\\\0&d\\end{pmatrix}:\\quad \\text{área}\\times\\p{1}{a\\,d}' },
    },
    {
      say: 'Un cizalle, en cambio, desliza las filas de cuadritos sin cambiar su altura ni su base: el área no cambia.',
      dur: 2.6,
      board: { tex: '\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}:\\quad \\text{área}\\times\\p{1}{1}' },
    },
    {
      say: 'En general el factor es $ad-bc$, el **determinante**. Para esta matriz: $3\\cdot2-1\\cdot1=5$. El paralelogramo ocupa cinco cuadritos.',
      dur: 2.6,
      board: { label: 'Determinante', tex: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=\\p{1}{ad}-\\p{2}{bc}', body: 'Factor por el que la matriz multiplica todas las áreas.' },
    },
    {
      say: 'El determinante también puede ser **negativo**: significa que la matriz da vuelta el plano, como un espejo. Mira la F.',
      gate: 'Arrastra $A\\hat\\jmath$ hasta que el determinante sea negativo.',
      board: { label: 'Signo', tex: '\\det A<0\\ \\Rightarrow\\ \\text{invierte la orientación}', body: 'Las áreas se multiplican por $|\\det A|$.' },
    },
    {
      say: 'Si el determinante es **cero**, las columnas quedan paralelas y el plano se aplasta en una recta. Puntos distintos caen en el mismo lugar.',
      ask: { prompt: '¿Se puede deshacer una transformación con determinante 0?', options: ['No: se perdió información', 'Sí, siempre', 'Solo si la matriz es simétrica'], answer: 0, explain: 'Si dos puntos distintos caen en el mismo lugar, desde el resultado no se puede saber de cuál venía.' },
      board: { label: 'Determinante cero', tex: '\\det A=0\\iff\\text{columnas paralelas}', body: 'El plano se aplasta y la transformación no se puede deshacer.' },
    },
    {
      say: 'Si $\\det A\\neq0$, existe la **inversa** $A^{-1}$: la transformación que devuelve todo a su lugar. En $2\\times2$: se intercambian $a$ y $d$, se cambia el signo de $b$ y $c$, y se divide por el determinante.',
      dur: 3.6,
      board: { label: 'Inversa', tex: 'A^{-1}=\\frac{\\p{1}{1}}{\\p{1}{ad-bc}}\\begin{pmatrix}\\p{2}{d}&\\p{3}{-b}\\\\\\p{3}{-c}&\\p{2}{a}\\end{pmatrix}', body: 'Cumple $A^{-1}A=AA^{-1}=I$.' },
    },
    {
      say: 'La inversa resuelve sistemas: si $A\\vec x=\\vec b$, aplicando $A^{-1}$ a ambos lados queda $\\vec x=A^{-1}\\vec b$.',
      ask: { prompt: 'Con $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$, ¿qué $\\vec x$ cumple $A\\vec x=(7,4)$?', options: ['(2, 1)', '(7, 4)', '(1, 2)'], answer: 0, explain: '$A^{-1}=\\tfrac15\\begin{pmatrix}2&-1\\\\-1&3\\end{pmatrix}$, así que $\\vec x=\\tfrac15(14-4,\\,-7+12)=(2,1)$. Comprobación: $A(2,1)=(7,4)$.' },
      board: { label: 'Resolver con la inversa', tex: 'A\\vec x=\\vec b\\ \\Rightarrow\\ \\vec x=\\p{1}{A^{-1}}\\vec b' },
    },
  ],
};

// ---------------------------------------------------------------- demo
const T: M2 = [
  [2, 0],
  [-4, 3],
];
const K: M2 = [
  [1, 2],
  [0, 0],
];

function UndoDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const M = beat === 0 ? lerpM(I2, T, at(0)) : beat === 1 ? (answer !== null ? lerpM(T, I2, beats.p) : T) : lerpM(I2, K, at(2));
  const [a, b] = cols(M);
  const screen: V2 = [4, -2];
  const realPos = mv(inv(T), screen);
  return (
    <Stage>
      <Grid P={P} M={M} color={beat === 2 ? C.red : C.violet} opacity={0.45} />
      <Para P={P} a={a} b={b} color={beat === 2 ? C.amber : C.green} opacity={0.3} />
      {beat === 1 && (
        <>
          <rect x={P.x(answer !== null ? realPos[0] : screen[0]) - 22} y={P.y(answer !== null ? realPos[1] : screen[1]) - 11} width={44} height={22} rx={5} fill={C.magenta} />
          <Cap x={P.x(answer !== null ? realPos[0] : screen[0])} y={P.y(answer !== null ? realPos[1] : screen[1]) - 30} size={15} color={C.magenta}>
            M-7
          </Cap>
        </>
      )}
      <Cap x={1380} y={230} size={24} color={C.text} tex={beat === 2 ? `K=${texM(K)}` : `T=${texM(T)}`} />
      <Cap x={1380} y={320} size={24} color={beat === 2 ? C.amber : C.green} tex={beat === 2 ? '\\det K=0' : '\\det T=6'} opacity={beat === 2 ? at(2) : 1} />
      {beat === 1 && answer !== null && <Cap x={1380} y={400} size={22} color={C.green} tex={`T^{-1}=\\tfrac16${texM([[3, 0], [4, 2]])}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Undo({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 31 + round);
    const M: M2 = [
      [randInt(r, -3, 4), randInt(r, -3, 3)],
      [randInt(r, -3, 3), randInt(r, -2, 4)],
    ];
    const S = pick(r, [12, 20, 30, 45]);
    let A2: M2 = [
      [2, 1],
      [1, 1],
    ];
    for (let t = 0; t < 60; t++) {
      A2 = [
        [randInt(r, -2, 3), randInt(r, -2, 3)],
        [randInt(r, -2, 3), randInt(r, -2, 3)],
      ];
      if (det(A2) !== 0) break;
    }
    const x: V2 = [randInt(r, -3, 4), randInt(r, -3, 4)];
    return { M, S, A2, x, b: mv(A2, x) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [vals, setVals] = useState<string[]>(['', '']);
  const set = (i: number, s: string) => setVals((o) => o.map((t, k) => (k === i ? s : t)));
  const { M, S, A2, x, b } = data;

  useEffect(() => {
    setVal('');
    setVals(['', '']);
    if (round === 0) {
      api.prompt('Calcula el determinante de la tabla. ¿Se puede deshacer?', '\\det A=ad-bc');
      api.hints(['Diagonal principal menos diagonal secundaria.', `$${n(M[0][0])}\\cdot${par(M[1][1])}-${par(M[0][1])}\\cdot${par(M[1][0])}$`]);
    } else if (round === 1) {
      api.prompt(`Una bodega rectangular de ${S} m² pasa por la tabla. ¿Qué área ocupa en la pantalla?`, '\\text{área nueva}=|\\det A|\\cdot\\text{área}');
      api.hints(['Calcula el determinante.', 'Las áreas se multiplican por su valor absoluto.']);
    } else {
      api.prompt('La pantalla muestra al tren en $\\vec b$. Usa la inversa para encontrar su posición real $\\vec x$.', '\\vec x=A^{-1}\\vec b');
      api.hints([`$\\det A=${n(det(A2))}$, así que $A^{-1}=\\tfrac{1}{${n(det(A2))}}\\begin{pmatrix}${n(A2[1][1])}&${n(-A2[0][1])}\\\\${n(-A2[1][0])}&${n(A2[0][0])}\\end{pmatrix}$.`, 'Multiplica esa matriz por $\\vec b$. Comprueba que $A\\vec x=\\vec b$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      const v = vals.map(parseNum);
      if (v[0] === null || v[1] === null) return;
      if (Math.abs(v[0] - x[0]) < 0.01 && Math.abs(v[1] - x[1]) < 0.01) return api.result(true, `$\\vec x=${texV(x)}$. Comprobación: $A\\vec x=${texV(b)}$.`);
      const got = mv(A2, [v[0], v[1]]);
      return api.result(false, `Con ese $\\vec x$, la pantalla mostraría $${texV(got)}$, no $${texV(b)}$. Revisa los signos de la inversa.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    const d = det(M);
    if (round === 0) {
      if (Math.abs(v - d) < 0.01) return api.result(true, `$\\det A=${n(d)}$. ${d === 0 ? 'Aplasta el plano: no se puede deshacer.' : 'Distinto de cero: tiene inversa.'}`);
      if (Math.abs(v - (M[0][0] * M[1][1] + M[0][1] * M[1][0])) < 0.01) return api.result(false, 'Es una resta: $ad-bc$, no $ad+bc$.');
      if (Math.abs(v - (M[0][1] * M[1][0] - M[0][0] * M[1][1])) < 0.01) return api.result(false, 'Al revés: diagonal principal ($ad$) menos la otra ($bc$).');
      return api.result(false, `$ad=${n(M[0][0] * M[1][1])}$ y $bc=${n(M[0][1] * M[1][0])}$: réstalos.`);
    }
    const t = Math.abs(det(A2)) * S;
    if (Math.abs(v - t) < 0.01) return api.result(true, `$|\\det A|=${n(Math.abs(det(A2)))}$, así que ${S}·${n(Math.abs(det(A2)))} = ${t} m².`);
    if (Math.abs(v + t) < 0.01 || Math.abs(v - det(A2) * S) < 0.01) return api.result(false, 'Un área no puede ser negativa: usa el valor absoluto del determinante.');
    return api.result(false, `$\\det A=${n(det(A2))}$; el área se multiplica por $${n(Math.abs(det(A2)))}$.`);
  };

  const [a, bb] = cols(round === 1 ? A2 : M);
  return (
    <Stage>
      {round < 2 && (
        <>
          <Grid P={P} M={round === 1 ? A2 : M} color={C.violet} opacity={0.4} />
          <Para P={P} a={a} b={bb} color={C.green} opacity={0.25} />
          <Vec P={P} v={a} color={C.cyan} width={5} />
          <Vec P={P} v={bb} color={C.amber} width={5} />
          <Cap x={1380} y={240} size={26} color={C.text} tex={`A=${texM(round === 1 ? A2 : M)}`} />
          <NumberField x={1240} y={400} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'det A =' : 'área ='} width={4} unit={round === 1 ? 'm²' : undefined} />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={560} y={330} size={38} color={C.text} tex={`A=${texM(A2)},\\qquad \\vec b=${texV(b)}`} />
          <MatInput x={1150} y={340} vals={vals} onChange={set} onEnter={submit} rows={2} cols={1} label="x =" />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
const par = (t: number) => (t < 0 ? `(${t})` : `${t}`);

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c7',
  world: 'linear',
  code: '4.7',
  title: 'Deshacer la pantalla',
  subtitle: 'Determinante e inversa',
  glyph: '\\det A',
  kind: 'level',
  guide: 'iris',
  teaser: 'Las grabaciones de la pantalla muestran dónde se dibujó el M-7 cada noche. Para saber dónde estaba de verdad hay que deshacer la tabla, si es que se puede.',
  learn: 'Determinante como factor de áreas, su signo y el caso cero; matriz inversa $2\\times2$ y resolución de $A\\vec x=\\vec b$ con ella.',
  glyphs: ['det', 'matinv'],
  pitfalls: ['$\\det A=ad-bc$: diagonal principal menos la otra.', 'Las áreas se multiplican por $|\\det A|$ (el signo indica orientación).', 'Si $\\det A=0$ no existe inversa: no se puede dividir por cero.'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Centro de control del Metro, 04:00. La grabación tiñe la sala de azul.' },
        { who: 'lucia', text: 'Guardamos las pantallas de todo el mes. Necesito sacar de ahí la posición real del M-7, aunque mi jefe pregunte quién abrió las copias.' },
        { who: 'teo', text: 'Depende de lo que la tabla haya conservado; la de carga manda lugares distintos al mismo punto.' },
        { who: 'iris', text: 'Empecemos por el M-7. Cada noche recuperada te da algo que mostrarle.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Deshacer la pantalla',
      Scene: UndoDemo,
      beats: [
        {
          say: 'La tabla del M-7, $T$, convierte el cuadrado unitario en un paralelogramo de área 6. Su determinante no es cero: se puede deshacer.',
          dur: 2,
          note: { label: 'Determinante de la tabla', tex: '\\det T=2\\cdot3-0\\cdot(-4)=6' },
        },
        {
          say: 'A las 03:00 la grabación muestra al M-7 en $(4,-2)$.',
          ask: { prompt: '¿Dónde estaba de verdad?', options: ['(2, 2)', '(8, −10)', '(4, −2)'], answer: 0, explain: '$T^{-1}=\\tfrac16\\begin{pmatrix}3&0\\\\4&2\\end{pmatrix}$ y $T^{-1}(4,-2)=\\tfrac16(12,\\,16-4)=(2,2)$. Comprobación: $T(2,2)=(4,-2)$.' },
          note: { label: 'Posición real a las 03:00', tex: 'T^{-1}\\begin{pmatrix}4\\\\-2\\end{pmatrix}=\\begin{pmatrix}2\\\\2\\end{pmatrix}' },
        },
        {
          say: 'La tabla de los trenes de carga es otra: $K=\\begin{pmatrix}1&2\\\\0&0\\end{pmatrix}$. Mira lo que le hace al plano.',
          ask: { prompt: '¿Se puede recuperar la posición real de los trenes de carga?', options: ['No: $\\det K=0$ y todo cae sobre la línea principal', 'Sí, con $K^{-1}$', 'Sí, porque sus entradas son enteras'], answer: 0, explain: '$\\det K=1\\cdot0-2\\cdot0=0$. Todo el plano cae sobre el eje horizontal, la línea principal: los trenes de carga se dibujan encima de los trenes normales y su posición real se pierde.' },
          note: { label: 'Tabla de carga', tex: '\\det K=0', body: 'Aplasta el plano sobre la línea principal: no hay inversa.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Deshacer tablas', Comp: Undo, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'teo', text: 'A las 03:00 aparecía en (4, −2), pero estaba en (2, 2). Su tabla tiene factor de área 6 y se puede deshacer; la de carga da 0.' },
        { who: 'lucia', text: 'Las grabaciones del M-7 vuelven a señalar la vía vieja hacia las cocheras. De la carga, la pantalla borró la posición real.' },
        { who: 'iris', text: 'Quedan los despachos. ¿Quién decide dónde duermen los vagones?' },
        { who: 'teo', text: 'El mismo servidor guarda un reparto nocturno; lleva semanas repitiéndolo.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'det', world: 'linear', tex: '\\det A', name: 'Determinante', read: 'determinante de a', meaning: '$ad-bc$: factor por el que $A$ multiplica las áreas; negativo si invierte la orientación; cero si aplasta el plano.' },
  { id: 'matinv', world: 'linear', tex: 'A^{-1}', name: 'Matriz inversa', read: 'a a la menos uno', meaning: 'La transformación que deshace $A$: $A^{-1}A=I$. Existe solo si $\\det A\\neq0$.' },
];
