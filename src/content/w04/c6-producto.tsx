import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, parseNum } from '../shared/ui';
import { Grid, I2, MatInput, Shape, Vec, cols, eqV, lattice, lerpM, mm, mv, texM, texV, type M2, type V2 } from './kit';

// ============================================================================
// CASO 4.6 · «Dos pasos» — producto de matrices
// Hacer B y después A es la transformación AB; sus columnas son A·(columnas de B);
// entrada (i,j) = fila i de A por columna j de B; AB ≠ BA; asociatividad e identidad.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);
const LA: M2 = [
  [0, -1],
  [1, 0],
];
const LB: M2 = [
  [1, 1],
  [0, 1],
];

/** Grid that goes I → first → second·first across the progress t ∈ [0,1]. */
const twoStep = (first: M2, second: M2, t: number): M2 => (t < 0.5 ? lerpM(I2, first, t * 2) : lerpM(first, mm(second, first), t * 2 - 1));

// ---------------------------------------------------------------- lesson
function ProductLesson({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  if (beat === 3) {
    const panels: { M: M2; name: string; c: [number, number] }[] = [
      { M: mm(LA, LB), name: 'primero cizalle, después giro: AB', c: [470, 400] },
      { M: mm(LB, LA), name: 'primero giro, después cizalle: BA', c: [1130, 400] },
    ];
    return (
      <Stage>
        {panels.map((p, i) => {
          const Q = lattice(p.c[0], p.c[1], 44, 6, 5);
          const M = i === 0 ? twoStep(LB, LA, at(3)) : twoStep(LA, LB, at(3));
          return (
            <g key={i}>
              <Grid P={Q} M={M} color={C.violet} opacity={0.45} R={10} />
              <Shape P={Q} M={M} />
              <Cap x={p.c[0]} y={p.c[1] + 250} size={18} color={C.muted}>
                {p.name}
              </Cap>
              <Cap x={p.c[0]} y={p.c[1] - 260} size={22} color={C.text} tex={texM(p.M)} opacity={at(3)} />
            </g>
          );
        })}
        {answer !== null && <Cap x={800} y={800} size={22} color={C.green} tex="AB\neq BA" />}
      </Stage>
    );
  }
  if (beat === 2) {
    const k = answer === null ? 0 : 4;
    const R = [
      [5, 4],
      [1, 2],
    ];
    const cell = (i: number, j: number) => (k > i * 2 + j ? String(R[i][j]) : '\\square');
    const ri = 0;
    const cj = 0;
    const a = (i: number, s: string) => (i === ri ? `\\cC{${s}}` : s);
    const b = (j: number, s: string) => (j === cj ? `\\cA{${s}}` : s);
    return (
      <Stage>
        <Cap x={800} y={330} size={40} color={C.text} tex={`\\begin{pmatrix}${a(0, '1')}&${a(0, '2')}\\\\${a(1, '0')}&${a(1, '1')}\\end{pmatrix}\\begin{pmatrix}${b(0, '3')}&${b(1, '0')}\\\\${b(0, '1')}&${b(1, '2')}\\end{pmatrix}=\\begin{pmatrix}${cell(0, 0)}&${cell(0, 1)}\\\\${cell(1, 0)}&${cell(1, 1)}\\end{pmatrix}`} />
        {answer !== null && <Cap x={800} y={480} size={22} color={C.muted} tex="\begin{aligned}1\cdot3+2\cdot1&=5 & 1\cdot0+2\cdot2&=4\\0\cdot3+1\cdot1&=1 & 0\cdot0+1\cdot2&=2\end{aligned}" />}
        <Cap x={800} y={600} size={20} color={C.muted}>fila 1 de A (celeste) por columna 1 de B (ámbar)</Cap>
      </Stage>
    );
  }
  const M = beat === 0 ? twoStep(LB, LA, at(0)) : mm(LA, LB);
  const [c1, c2] = cols(M);
  const stage = beat === 0 ? (at(0) < 0.5 ? 'primero B: cizalle' : 'después A: giro de 90°') : '';
  return (
    <Stage>
      <Grid P={P} M={M} color={C.violet} opacity={0.5} />
      <Shape P={P} M={M} />
      <Vec P={P} v={c1} color={C.cyan} width={6} label={beat === 1 ? 'AB\\hat\\imath=A\\vec b_1' : undefined} off={[60, 20]} />
      <Vec P={P} v={c2} color={C.amber} width={6} label={beat === 1 ? 'AB\\hat\\jmath=A\\vec b_2' : undefined} off={[-80, -16]} />
      {beat === 0 && <Cap x={1370} y={260} size={22} color={C.text}>{stage}</Cap>}
      {beat === 0 && <Cap x={1370} y={330} size={22} color={C.text} tex={`B=${texM(LB)}`} opacity={at(0) < 0.5 ? 1 : 0.4} />}
      {beat === 0 && <Cap x={1370} y={420} size={22} color={C.text} tex={`A=${texM(LA)}`} opacity={at(0) >= 0.5 ? 1 : 0.4} />}
      {beat === 1 && (
        <>
          <Cap x={1370} y={240} size={22} color={C.cyan} tex={`A${texV([1, 0])}=${texV(c1)}`} />
          <Cap x={1370} y={330} size={22} color={C.amber} tex={`A${texV([1, 1])}=${texV(c2)}`} />
          <Cap x={1370} y={430} size={24} color={C.green} tex={`AB=${texM(M)}`} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Producto de matrices',
  Scene: ProductLesson,
  beats: [
    {
      say: 'Hacer una transformación y después otra es una nueva transformación. Primero $B$ y después $A$ se escribe $AB$: se lee de derecha a izquierda, como $f(g(x))$.',
      dur: 4,
      board: { label: 'Composición', tex: '\\p{1}{A}\\,(\\p{2}{B}\\,\\vec v)=(\\p{3}{AB})\\,\\vec v', body: 'Primero actúa la matriz de la derecha.' },
    },
    {
      say: 'Para encontrar $AB$ basta seguir a $\\hat\\imath$ y $\\hat\\jmath$. $B$ los lleva a sus columnas $\\vec b_1$ y $\\vec b_2$; luego $A$ actúa sobre ellas. Así salen las columnas de $AB$.',
      dur: 3,
      board: { label: 'Columnas del producto', tex: 'AB=\\big(\\,\\p{1}{A\\,\\vec b_1}\\ \\ \\p{2}{A\\,\\vec b_2}\\,\\big)' },
    },
    {
      say: 'Entrada por entrada: la que está en la fila $i$ y columna $j$ de $AB$ es la fila $i$ de $A$ por la columna $j$ de $B$, como un producto punto.',
      ask: { prompt: '¿Cuánto vale la entrada de arriba a la izquierda de $\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}\\begin{pmatrix}3&0\\\\1&2\\end{pmatrix}$?', options: ['5', '3', '7'], answer: 0, explain: 'Fila 1 de $A$ por columna 1 de $B$: $1\\cdot3+2\\cdot1=5$.' },
      board: [
        { label: 'Fila por columna', tex: '(AB)_{ij}=\\p{1}{\\text{fila}_i(A)}\\cdot\\p{2}{\\text{col}_j(B)}' },
        { tex: '\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}\\begin{pmatrix}3&0\\\\1&2\\end{pmatrix}=\\begin{pmatrix}\\p{1}{5}&\\p{2}{4}\\\\\\p{3}{1}&\\p{4}{2}\\end{pmatrix}' },
      ],
    },
    {
      say: 'El orden importa: cizallar y después girar no deja el plano igual que girar y después cizallar.',
      ask: { prompt: '¿Es $AB=BA$ en general?', options: ['No: el orden importa', 'Sí, como con los números', 'Solo si las dos son giros'], answer: 0, explain: 'Las dos F terminan distintas. Con matrices, $AB$ y $BA$ suelen ser diferentes.' },
      board: { label: 'Propiedades', tex: '\\begin{gathered}\\p{1}{AB\\neq BA}\\\\ \\p{2}{(AB)C=A(BC)},\\quad \\p{3}{AI=IA=A}\\end{gathered}', body: 'No conmutativo, pero sí asociativo; la identidad $I$ es el neutro.' },
    },
  ],
};

// ---------------------------------------------------------------- demo
const PD = lattice(720, 450, 50, 8, 6.5);
const DA: M2 = [
  [1, 0],
  [-2, 1],
];
const DB: M2 = [
  [2, 0],
  [0, 3],
];

function StepsDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const rev = beat === 2 && answer !== null;
  const M = beat === 0 ? twoStep(DB, DA, at(0)) : rev ? mm(DB, DA) : mm(DA, DB);
  const real: V2 = [3, 4];
  const shown = mv(M, real);
  return (
    <Stage>
      <Grid P={PD} M={M} color={rev ? C.red : C.violet} opacity={0.45} R={16} />
      <Vec P={PD} v={real} color={C.dim} width={3} dashed />
      {beat >= 1 && (
        <>
          <rect x={PD.x(shown[0]) - 22} y={PD.y(shown[1]) - 11} width={44} height={22} rx={5} fill={C.magenta} />
          <Cap x={PD.x(shown[0])} y={PD.y(shown[1]) - 30} size={15} color={C.magenta}>
            M-7
          </Cap>
        </>
      )}
      <Cap x={1380} y={220} size={22} color={C.text} tex={`B=${texM(DB)}`} />
      <Cap x={1380} y={310} size={22} color={C.text} tex={`A=${texM(DA)}`} />
      {beat >= 1 && (beat > 1 || answer !== null) && <Cap x={1380} y={410} size={22} color={C.green} tex={`AB=${texM(mm(DA, DB))}`} />}
      {rev && <Cap x={1380} y={500} size={22} color={C.red} tex={`BA${texV(real)}=${texV(mv(mm(DB, DA), real))}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const SIMPLE: { M: M2; name: string }[] = [
  { M: [[0, -1], [1, 0]], name: 'girar 90°' },
  { M: [[1, 1], [0, 1]], name: 'cizallar' },
  { M: [[1, 0], [0, -1]], name: 'reflejar en el eje x' },
  { M: [[2, 0], [0, 1]], name: 'estirar en x' },
  { M: [[1, 0], [1, 1]], name: 'cizallar en vertical' },
];

function Compose({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 29 + round);
    const rnd = (): M2 => [
      [randInt(r, -2, 3), randInt(r, -2, 2)],
      [randInt(r, -2, 2), randInt(r, -1, 3)],
    ];
    const A = rnd();
    const B = rnd();
    const v: V2 = [randInt(r, -2, 3) || 1, randInt(r, -2, 2) || 2];
    let pair = shuffle(r, SIMPLE).slice(0, 2);
    for (let t = 0; t < 20 && eqV(cols(mm(pair[0].M, pair[1].M))[0], cols(mm(pair[1].M, pair[0].M))[0]) && eqV(cols(mm(pair[0].M, pair[1].M))[1], cols(mm(pair[1].M, pair[0].M))[1]); t++) pair = shuffle(r, SIMPLE).slice(0, 2);
    const order = pick(r, [0, 1]);
    return { A, B, v, pair, order };
  }, [seed, round]);
  const [vals, setVals] = useState<string[]>(['', '', '', '']);
  const [ch, setCh] = useState<string | null>(null);
  const set = (i: number, s: string) => setVals((o) => o.map((t, k) => (k === i ? s : t)));
  const { A, B, v, pair, order } = data;
  const [F, S] = pair; // first F, then S → matrix S·F
  const right = mm(S.M, F.M);
  const wrong = mm(F.M, S.M);
  const opts = order === 0 ? [right, wrong] : [wrong, right];

  useEffect(() => {
    setVals(['', '', '', '']);
    setCh(null);
    if (round === 0) {
      api.prompt('Calcula el producto $AB$.', '(AB)_{ij}=\\text{fila } i\\text{ de }A\\cdot\\text{columna } j\\text{ de }B');
      api.hints(['Entrada de arriba a la izquierda: fila 1 de $A$ por columna 1 de $B$.', 'Cuatro productos punto, uno por entrada.']);
    } else if (round === 1) {
      api.prompt('La pantalla aplica primero $B$ y después $A$ a la posición $\\vec v$. ¿Dónde dibuja el tren?', 'A(B\\vec v)');
      api.hints(['Calcula primero $B\\vec v$.', 'Después multiplica $A$ por ese resultado (o calcula $AB$ y aplícala a $\\vec v$).']);
    } else {
      api.prompt(`Primero se aplica «${F.name}» y después «${S.name}». ¿Qué matriz hace las dos cosas?`, 'S\\,F');
      api.hints(['La matriz de la transformación que actúa primero va a la derecha.', 'Comprueba aplicando el candidato a $\\hat\\jmath=(0,1)$ y mira el palo largo de la F.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (ch === null) return;
      const k = ['A', 'B'].indexOf(ch);
      if (k === order) return api.result(true, `La que actúa primero va a la derecha: $S\\,F=${texM(right)}$.`);
      return api.result(false, 'Esa es la composición en el orden inverso: aplica primero la de la izquierda. La que actúa primero va a la derecha.');
    }
    const x = vals.map(parseNum);
    if (round === 0) {
      if (x.some((t) => t === null)) return;
      const AB = mm(A, B);
      const BA = mm(B, A);
      const flat = AB.flat();
      if (x.every((t, i) => Math.abs(t! - flat[i]) < 0.01)) return api.result(true, `$AB=${texM(AB)}$.`);
      if (x.every((t, i) => Math.abs(t! - BA.flat()[i]) < 0.01)) return api.result(false, 'Ese es $BA$: multiplicaste en el orden inverso. Usa filas de $A$ y columnas de $B$.');
      if (x.every((t, i) => Math.abs(t! - A.flat()[i] * B.flat()[i]) < 0.01)) return api.result(false, 'Multiplicaste entrada por entrada. El producto de matrices es fila por columna.');
      const bad = x.findIndex((t, i) => Math.abs(t! - flat[i]) >= 0.01);
      return api.result(false, `Revisa la entrada de la fila ${Math.floor(bad / 2) + 1}, columna ${(bad % 2) + 1}.`);
    }
    if (x[0] === null || x[1] === null) return;
    const t = mv(A, mv(B, v));
    if (Math.abs(x[0] - t[0]) < 0.01 && Math.abs(x[1] - t[1]) < 0.01) return api.result(true, `$B\\vec v=${texV(mv(B, v))}$ y $A(B\\vec v)=${texV(t)}$.`);
    const w = mv(B, mv(A, v));
    if (Math.abs(x[0] - w[0]) < 0.01 && Math.abs(x[1] - w[1]) < 0.01) return api.result(false, 'Aplicaste $A$ primero. El orden es: primero $B$, después $A$.');
    return api.result(false, `Primero $B\\vec v=${texV(mv(B, v))}$; después aplica $A$ a ese vector.`);
  };

  return (
    <Stage>
      {round === 0 && (
        <>
          <Cap x={560} y={340} size={38} color={C.text} tex={`A=${texM(A)}\\qquad B=${texM(B)}`} />
          <MatInput x={1100} y={340} vals={vals} onChange={set} onEnter={submit} label="AB =" />
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={560} y={340} size={36} color={C.text} tex={`A=${texM(A)},\\ \\ B=${texM(B)},\\ \\ \\vec v=${texV(v)}`} />
          <MatInput x={1150} y={340} vals={vals} onChange={set} onEnter={submit} rows={2} cols={1} label="A(Bv) =" />
        </>
      )}
      {round === 2 && (
        <>
          <Grid P={lattice(560, 450, 50, 6, 5)} M={right} color={C.violet} opacity={0.35} R={10} />
          <Shape P={lattice(560, 450, 50, 6, 5)} color={C.dim} opacity={0.25} />
          <Shape P={lattice(560, 450, 50, 6, 5)} M={right} />
          <Cap x={1300} y={200} size={22} color={C.muted} tex={`F=${texM(F.M)},\\ \\ S=${texM(S.M)}`} />
          {opts.map((o, k) => (
            <Cap key={k} x={1300} y={320 + k * 110} size={24} color={C.text} tex={`\\text{${'AB'[k]}}:\\ ${texM(o)}`} />
          ))}
          <Choices x={1300} y={560} options={['A', 'B']} value={ch} onPick={setCh} />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c6',
  world: 'linear',
  code: '4.6',
  title: 'Dos pasos',
  subtitle: 'Producto de matrices',
  glyph: 'AB',
  kind: 'level',
  guide: 'teo',
  teaser: 'En el código del servidor la tabla del M-7 no aparece escrita: se arma con dos transformaciones aplicadas una tras otra.',
  learn: 'Composición de transformaciones, producto de matrices por columnas y por fila-columna, no conmutatividad, asociatividad e identidad.',
  glyphs: ['matmul', 'ident'],
  pitfalls: ['En $AB$ actúa primero $B$ (la de la derecha).', 'El producto no es entrada por entrada: es fila de $A$ por columna de $B$.', 'En general $AB\\neq BA$.'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Centro de control del Metro, 03:40. El ventilador del servidor traquetea.' },
        { who: 'teo', text: 'La tabla completa no está escrita: el programa primero estira el mapa con B y después lo inclina con A. Necesito reconstruir lo que llega a la pantalla.' },
        { who: 'lucia', text: 'Con el orden correcto, por favor; tengo un tren real fuera del horario.' },
        { who: 'iris', text: 'Y un programador que sabía dónde quería hacerlo aparecer.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Dos pasos',
      Scene: StepsDemo,
      beats: [
        {
          say: 'Primero $B$ estira el plano: el doble en horizontal y el triple en vertical. Después $A$ lo inclina hacia abajo.',
          dur: 3.4,
          note: { label: 'Los dos pasos', tex: 'B=\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix},\\ A=\\begin{pmatrix}1&0\\\\-2&1\\end{pmatrix}' },
        },
        {
          say: 'El M-7 recorre los dos pasos y termina dibujado en el taller.',
          ask: { prompt: '¿Qué matriz aplica la pantalla en total?', options: ['$AB=\\begin{pmatrix}2&0\\\\-4&3\\end{pmatrix}$', '$BA=\\begin{pmatrix}2&0\\\\-6&3\\end{pmatrix}$', '$A+B=\\begin{pmatrix}3&0\\\\-2&4\\end{pmatrix}$'], answer: 0, explain: 'Primero $B$, después $A$: la matriz total es $AB$. Fila 2 de $A$ por columnas de $B$: $(-2)\\cdot2+1\\cdot0=-4$ y $(-2)\\cdot0+1\\cdot3=3$. Es la tabla del M-7.' },
          note: { label: 'La tabla completa', tex: 'AB=\\begin{pmatrix}2&0\\\\-4&3\\end{pmatrix}' },
        },
        {
          say: 'Lucía pregunta qué habría pasado si el programador aplicaba los pasos al revés.',
          ask: { prompt: '¿Dónde habría aparecido el M-7, que estaba en $(3,4)$?', options: ['En $(6,-6)$, fuera de toda vía', 'En $(6,0)$, igual que antes', 'En $(3,4)$'], answer: 0, explain: '$BA=\\begin{pmatrix}2&0\\\\-6&3\\end{pmatrix}$ y $BA(3,4)=(6,-18+12)=(6,-6)$. Con el orden inverso el truco no funciona.' },
          note: { label: 'El orden importa', tex: 'BA\\begin{pmatrix}3\\\\4\\end{pmatrix}=\\begin{pmatrix}6\\\\-6\\end{pmatrix}' },
        },
      ],
    },
    { kind: 'challenge', title: 'Componer tablas', Comp: Compose, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'teo', text: 'Primero B y después A: el (3, 4) queda en (6, 0), el taller. Al revés da (6, −6), fuera de toda vía.' },
        { who: 'iris', text: 'Eligieron el orden con cuidado. Ahora necesito recuperar el recorrido desde las grabaciones.' },
        { who: 'teo', text: 'La tabla del M-7 parece tener vuelta; la de carga aplasta la cuadrícula.' },
        { who: 'lucia', text: 'Entonces esos seis trenes pueden estar encima de cualquier tren normal en mi pantalla.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'matmul', world: 'linear', tex: 'AB', name: 'Producto de matrices', read: 'a be', meaning: 'Aplicar $B$ y después $A$. Entrada $(i,j)$: fila $i$ de $A$ por columna $j$ de $B$.' },
  { id: 'ident', world: 'linear', tex: 'I', name: 'Matriz identidad', read: 'identidad', meaning: '$\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$: no mueve nada; $AI=IA=A$.' },
];
