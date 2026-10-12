import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Grid, MatInput, Vec, lattice, mm, mv, n, norm, sc, snap, texM, texV, txtV, type M2, type V2 } from './kit';

// ============================================================================
// CASO 4.8 · «El ciclo» — valores y vectores propios
// Direcciones que la matriz no gira: Av = λv; ecuación característica det(A − λI) = 0;
// traza y determinante; iterar alinea con el vector propio dominante; reparto estable (λ = 1).
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);
const A: M2 = [
  [3, 1],
  [0, 2],
];
const cross = (a: V2, b: V2) => a[0] * b[1] - a[1] * b[0];
const unit = (v: V2): V2 => sc(1 / norm(v), v);

// ---------------------------------------------------------------- lesson
function EigenLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [v, setV] = useState<V2>([1, 1]);
  const onV = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    if (t[0] === 0 && t[1] === 0) return;
    setV(t);
    if (cross(t, mv(A, t)) === 0) unlock();
  });
  if (beat === 3) {
    const PL = plane([0, 4.5], [-1, 3], { x: 300, y: 160, w: 760, h: 460 });
    const ch = (l: number) => (3 - l) * (2 - l);
    return (
      <Stage>
        <Axes P={PL} xTicks={[0, 1, 2, 3, 4]} yTicks={[-1, 0, 1, 2, 3]} xLabel="\lambda" yLabel="\det(A-\lambda I)" grid />
        <Curve P={PL} f={ch} a={0.72} b={0.72 + 3.56 * at(3)} color={C.violet} width={4} />
        <Dot x={PL.x(2)} y={PL.y(0)} r={9} color={C.green} opacity={at(3) > 0.6 ? 1 : 0} />
        <Dot x={PL.x(3)} y={PL.y(0)} r={9} color={C.green} opacity={at(3) > 0.8 ? 1 : 0} />
        <Cap x={1340} y={240} size={24} color={C.text} tex={`A-\\lambda I=\\begin{pmatrix}3-\\lambda&1\\\\0&2-\\lambda\\end{pmatrix}`} />
        <Cap x={1340} y={330} size={24} color={C.violet} tex="\det=(3-\lambda)(2-\lambda)" />
        <Cap x={1340} y={400} size={24} color={C.green} tex="\lambda=3,\ \lambda=2" opacity={at(3)} />
      </Stage>
    );
  }
  if (beat === 4) {
    return (
      <Stage>
        <Cap x={800} y={300} size={40} color={C.text} tex="\det\begin{pmatrix}4-\lambda&1\\2&3-\lambda\end{pmatrix}=\ ?" />
        {answer !== null && <Cap x={800} y={420} size={30} color={C.green} tex="(4-\lambda)(3-\lambda)-2=\lambda^2-7\lambda+10=(\lambda-5)(\lambda-2)" />}
      </Stage>
    );
  }
  if (beat === 5) {
    let w: V2 = [-1, 2];
    const its: V2[] = [];
    for (let k = 0; k < 7; k++) {
      its.push(unit(w));
      w = mv(A, w);
    }
    const shown = Math.floor(clamp(at(5) * 7.99, 0, 7));
    return (
      <Stage>
        <Grid P={P} opacity={0} />
        {its.slice(0, shown + 1).map((u, k) => (
          <Vec key={k} P={P} v={sc(4, u)} color={k === shown ? C.amber : C.dim} width={k === shown ? 6 : 3} opacity={k === shown ? 1 : 0.5} label={k === shown ? `A^{${k}}\\vec v` : undefined} />
        ))}
        <Vec P={P} v={[5, 0]} color={C.green} width={2} dashed />
        <Cap x={1370} y={260} size={22} color={C.muted}>dirección (normalizada)</Cap>
        <Cap x={1370} y={320} size={22} color={C.green} tex="\to(1,0),\ \lambda=3" opacity={at(5)} />
      </Stage>
    );
  }
  // beats 0–2: a fan of vectors and their images
  const fan: V2[] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [1, -1],
    [2, 1],
    [1, 2],
    [-1, 2],
  ];
  const t = beat === 0 ? at(0) : 1;
  return (
    <Stage ref={svg}>
      <Grid P={P} M={A} color={C.violet} opacity={0.25} />
      {beat === 0 &&
        fan.map((u, k) => {
          const img = mv(A, u);
          const keep = cross(u, img) === 0;
          const cur: V2 = [u[0] + (img[0] - u[0]) * t, u[1] + (img[1] - u[1]) * t];
          return <Vec key={k} P={P} v={cur} color={keep ? C.green : C.dim} width={keep ? 6 : 3} />;
        })}
      {beat === 1 && (
        <>
          <Vec P={P} v={mv(A, v)} color={cross(v, mv(A, v)) === 0 ? C.green : C.magenta} label="A\vec v" off={[24, -20]} />
          <Vec P={P} v={v} color={C.amber} label="\vec v" off={[-24, -20]} />
          <Knob x={P.x(v[0])} y={P.y(v[1])} color={C.amber} onPointerDown={onV} r={14} />
          <Cap x={1370} y={260} size={24} color={C.text} tex={`A${texV(v)}=${texV(mv(A, v))}`} />
          {cross(v, mv(A, v)) === 0 && <Cap x={1370} y={350} size={24} color={C.green} tex={`=${n(mv(A, v)[0] !== 0 ? mv(A, v)[0] / v[0] : mv(A, v)[1] / v[1])}\\,${texV(v)}`} />}
        </>
      )}
      {beat === 2 && (
        <>
          <Vec P={P} v={[3, 0]} color={C.green} label="3\hat\imath" off={[10, 26]} />
          <Vec P={P} v={[1, 0]} color={C.amber} width={8} />
          <Vec P={P} v={[2, -2]} color={C.green} label="A\vec w=2\vec w" off={[40, 20]} />
          <Vec P={P} v={[1, -1]} color={C.amber} width={8} label="\vec w" off={[-30, 10]} />
          <Cap x={1370} y={260} size={22} color={C.text} tex={`A=${texM(A)}`} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Valores y vectores propios',
  Scene: EigenLesson,
  beats: [
    {
      say: 'Al aplicar una matriz, casi todos los vectores cambian de dirección. Pero algunos solo se estiran o se encogen y siguen sobre su misma recta. Son los **vectores propios**.',
      dur: 3.2,
      board: { label: 'Vector propio', tex: 'A\\vec v=\\p{1}{\\lambda}\\,\\p{2}{\\vec v},\\qquad \\vec v\\neq\\vec 0', body: 'La matriz no gira a $\\vec v$: solo lo multiplica por el número $\\lambda$, su **valor propio**.' },
    },
    {
      say: 'Busca uno con tus manos: mueve $\\vec v$ y mira hacia dónde lo lleva $A$.',
      gate: 'Arrastra $\\vec v$ hasta una dirección en la que $A\\vec v$ quede sobre la misma recta.',
    },
    {
      say: 'Esta matriz tiene dos direcciones propias: la de $(1,0)$, que se triplica, y la de $(1,-1)$, que se duplica. El valor propio dice cuánto: $\\lambda>1$ estira, $0<\\lambda<1$ encoge, $\\lambda<0$ además da vuelta.',
      dur: 3,
      board: { label: 'Ejemplo', tex: 'A\\begin{pmatrix}1\\\\0\\end{pmatrix}=\\p{1}{3}\\begin{pmatrix}1\\\\0\\end{pmatrix},\\quad A\\begin{pmatrix}1\\\\-1\\end{pmatrix}=\\p{2}{2}\\begin{pmatrix}1\\\\-1\\end{pmatrix}' },
    },
    {
      say: 'Para hallarlos sin buscar a ciegas: $A\\vec v=\\lambda\\vec v$ equivale a $(A-\\lambda I)\\vec v=\\vec 0$. Para que exista un $\\vec v$ no nulo, $A-\\lambda I$ tiene que aplastar el plano: su determinante debe ser cero.',
      dur: 3.6,
      board: { label: 'Ecuación característica', tex: '\\det(\\p{1}{A-\\lambda I})=\\p{2}{0}', body: 'En $2\\times2$: $\\lambda^2-(a+d)\\lambda+(ad-bc)=0$. La suma de los valores propios es la **traza** $a+d$ y su producto, $\\det A$.' },
    },
    {
      say: 'Prueba con otra matriz.',
      ask: { prompt: '¿Cuáles son los valores propios de $\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$?', options: ['5 y 2', '4 y 3', '7 y 10'], answer: 0, explain: 'Traza 7 y determinante $12-2=10$: $\\lambda^2-7\\lambda+10=(\\lambda-5)(\\lambda-2)$. Los de la diagonal (4 y 3) solo sirven si la matriz es triangular.' },
      board: { tex: '\\lambda^2-\\p{1}{7}\\lambda+\\p{2}{10}=\\p{3}{(\\lambda-5)(\\lambda-2)}' },
    },
    {
      say: 'Si se aplica la misma matriz una y otra vez, la dirección del valor propio más grande se amplifica más que las otras: cualquier vector termina apuntando hacia ella.',
      dur: 4,
      board: { label: 'Iterar', tex: 'A^k\\vec v\\ \\xrightarrow[k\\to\\infty]{}\\ \\text{dirección del mayor }|\\lambda|' },
    },
  ],
};

// ---------------------------------------------------------------- demo
const MK: M2 = [
  [0.7, 0.1],
  [0.3, 0.9],
];
const PD = plane([0, 12], [0, 100], { x: 300, y: 140, w: 820, h: 480 });

function CycleDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const series: V2[] = [[100, 0]];
  for (let k = 0; k < 12; k++) series.push(mv(MK, series[k]));
  const upto = beat === 0 ? 1 : beat === 1 && answer === null ? 4 : 12;
  const pts = (i: 0 | 1) => series.slice(0, upto + 1).map((v, k) => `${PD.x(k)},${PD.y(v[i])}`).join(' ');
  return (
    <Stage>
      <Axes P={PD} xTicks={[0, 2, 4, 6, 8, 10, 12]} yTicks={[0, 25, 50, 75, 100]} xLabel="\text{noche}" yLabel="\text{vagones}" grid />
      <polyline points={pts(0)} fill="none" stroke={C.cyan} strokeWidth={4} opacity={beat === 0 ? at(0) : 1} />
      <polyline points={pts(1)} fill="none" stroke={C.amber} strokeWidth={4} opacity={beat === 0 ? at(0) : 1} />
      {series.slice(0, upto + 1).map((v, k) => (
        <g key={k}>
          <Dot x={PD.x(k)} y={PD.y(v[0])} r={5} color={C.cyan} />
          <Dot x={PD.x(k)} y={PD.y(v[1])} r={5} color={C.amber} />
        </g>
      ))}
      {upto === 12 && (
        <>
          <line x1={PD.x(0)} x2={PD.x(12)} y1={PD.y(25)} y2={PD.y(25)} stroke={C.cyan} strokeDasharray="8 8" opacity={0.6} />
          <line x1={PD.x(0)} x2={PD.x(12)} y1={PD.y(75)} y2={PD.y(75)} stroke={C.amber} strokeDasharray="8 8" opacity={0.6} />
        </>
      )}
      <Cap x={1370} y={220} size={24} color={C.text} tex={`M=${texM(MK, 1)}`} />
      <Cap x={1370} y={310} size={20} color={C.cyan}>Taller</Cap>
      <Cap x={1370} y={340} size={20} color={C.amber}>Cocheras</Cap>
      <Cap x={1370} y={400} size={22} color={C.text} tex={`\\text{noche }${upto}:\\ ${txtV([Math.round(series[upto][0]), Math.round(series[upto][1])])}`} />
      {beat === 2 && answer !== null && <Cap x={1370} y={470} size={22} color={C.green} tex="\lambda_1=1,\ \ \lambda_2=0{,}6" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const MARKOV: [number, number][] = [
  [0.3, 0.1],
  [0.2, 0.2],
  [0.1, 0.4],
  [0.4, 0.1],
  [0.2, 0.3],
  [0.3, 0.2],
  [0.1, 0.3],
];

function FixedDirections({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 37 + round);
    // round 0: a known eigenvector
    const l = pick(r, [-2, -1, 2, 3]);
    const m = pick(r, [1, 2, -1, 4].filter((x) => x !== l));
    const Pm = pick(r, [
      [[1, 1], [0, 1]],
      [[1, 0], [1, 1]],
      [[2, 1], [1, 1]],
      [[1, 1], [1, 2]],
      [[1, -1], [0, 1]],
    ] as M2[]);
    const Pinv: M2 = [
      [Pm[1][1], -Pm[0][1]],
      [-Pm[1][0], Pm[0][0]],
    ]; // det Pm = 1
    const Am = mm(mm(Pm, [[l, 0], [0, m]]), Pinv);
    const which = pick(r, [0, 1]);
    const ev: V2 = sc(pick(r, [1, -1]), which === 0 ? [Pm[0][0], Pm[1][0]] : [Pm[0][1], Pm[1][1]]);
    const [p, q] = pick(r, MARKOV);
    return { Am, ev, lam: which === 0 ? l : m, l, m, p, q };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [vals, setVals] = useState<string[]>(['', '']);
  const set = (i: number, s: string) => setVals((o) => o.map((t, k) => (k === i ? s : t)));
  const { Am, ev, lam, l, m, p, q } = data;
  const steady = Math.round((100 * q) / (p + q));

  useEffect(() => {
    setVal('');
    setVals(['', '']);
    if (round === 0) {
      api.prompt('Esta dirección no gira con la tabla. ¿Por qué número la multiplica?', 'A\\vec v=\\lambda\\vec v');
      api.hints(['Calcula $A\\vec v$.', 'Compara con $\\vec v$: cada componente quedó multiplicada por el mismo número.']);
    } else if (round === 1) {
      api.prompt('Encuentra los dos valores propios de la tabla.', '\\lambda^2-(a+d)\\lambda+(ad-bc)=0');
      api.hints([`Traza $a+d=${n(Am[0][0] + Am[1][1])}$ y determinante $${n(Am[0][0] * Am[1][1] - Am[0][1] * Am[1][0])}$.`, 'Busca dos números que sumen la traza y multipliquen el determinante.']);
    } else {
      api.prompt(`Cada noche, del Taller sale el ${Math.round(p * 100)} % de los vagones hacia las Cocheras, y de las Cocheras vuelve el ${Math.round(q * 100)} % al Taller. Con 100 vagones, ¿cuántos quedan en el Taller a la larga?`, 'M\\vec v=\\vec v');
      api.hints(['En el reparto estable, lo que sale del Taller es igual a lo que entra.', `$${dec(p).replace(',', '{,}')}\\,T=${dec(q).replace(',', '{,}')}\\,K$ y $T+K=100$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      const v = vals.map(parseNum);
      if (v[0] === null || v[1] === null) return;
      const ok = (Math.abs(v[0] - l) < 0.01 && Math.abs(v[1] - m) < 0.01) || (Math.abs(v[0] - m) < 0.01 && Math.abs(v[1] - l) < 0.01);
      if (ok) return api.result(true, `$\\lambda^2-${par(l + m)}\\lambda+${par(l * m)}=(\\lambda-${par(l)})(\\lambda-${par(m)})$.`);
      if ((Math.abs(v[0] - Am[0][0]) < 0.01 && Math.abs(v[1] - Am[1][1]) < 0.01) || (Math.abs(v[1] - Am[0][0]) < 0.01 && Math.abs(v[0] - Am[1][1]) < 0.01)) return api.result(false, 'Los números de la diagonal solo son los valores propios si la matriz es triangular.');
      return api.result(false, `Deben sumar $${n(l + m)}$ (la traza) y multiplicar $${n(l * m)}$ (el determinante).`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - lam) < 0.01) return api.result(true, `$A\\vec v=${texV(mv(Am, ev))}=${n(lam)}\\,${texV(ev)}$.`);
      return api.result(false, `$A\\vec v=${texV(mv(Am, ev))}$. ¿Por cuánto hay que multiplicar $${texV(ev)}$ para obtenerlo?`);
    }
    if (Math.abs(v - steady) < 0.6) return api.result(true, `$${dec(p).replace(',', '{,}')}\\,T=${dec(q).replace(',', '{,}')}\\,(100-T)$ da $T=${steady}$.`);
    if (Math.abs(v - (100 - steady)) < 0.6) return api.result(false, 'Ese es el número de las Cocheras. Pregunté por el Taller.');
    return api.result(false, 'En equilibrio, los que salen del Taller ($pT$) igualan a los que llegan ($qK$).');
  };

  return (
    <Stage>
      {round === 0 && (
        <>
          <Grid P={PR} M={Am} color={C.violet} opacity={0.3} R={20} />
          <Vec P={PR} v={mv(Am, ev)} color={C.green} width={4} dashed />
          <Vec P={PR} v={ev} color={C.amber} label="\vec v" />
          <Cap x={1380} y={240} size={26} color={C.text} tex={`A=${texM(Am)},\\ \\ \\vec v=${texV(ev)}`} />
          <NumberField x={1250} y={400} value={val} onChange={setVal} onEnter={submit} label="λ =" width={3} />
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={600} y={330} size={40} color={C.text} tex={`A=${texM(Am)}`} />
          <MatInput x={1100} y={340} vals={vals} onChange={set} onEnter={submit} rows={1} cols={2} label="λ₁, λ₂ =" />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={600} y={300} size={36} color={C.text} tex={`M=${texM([[1 - p, q], [p, 1 - q]], 1)}`} />
          <Cap x={600} y={420} size={20} color={C.muted}>columna 1: Taller · columna 2: Cocheras</Cap>
          <NumberField x={1100} y={340} value={val} onChange={setVal} onEnter={submit} label="Taller →" width={3} unit="vagones" />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
const par = (t: number) => (t < 0 ? `(${t})` : `${t}`);
const PR = lattice(700, 450, 38, 10, 7.5);

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c8',
  world: 'linear',
  code: '4.8',
  title: 'El ciclo',
  subtitle: 'Valores y vectores propios',
  glyph: 'A\\vec v=\\lambda\\vec v',
  kind: 'level',
  guide: 'lucia',
  teaser: 'Cada noche la tabla de carga reparte los vagones entre el Taller y las Cocheras. Aplicada noche tras noche, empuja todo hacia un reparto que ya no cambia.',
  learn: 'Vectores y valores propios, ecuación característica, traza y determinante, iteración de una matriz y estados estables ($\\lambda=1$).',
  glyphs: ['eigen', 'charpoly'],
  pitfalls: ['Un vector propio no puede ser $\\vec 0$.', 'Los valores propios no son los números de la diagonal (salvo en matrices triangulares).', 'Cualquier múltiplo no nulo de un vector propio también es vector propio.'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Centro de control del Metro, 04:20. La impresora arrastra una hoja.' },
        { who: 'teo', text: 'Encontré los despachos: cada noche sale una parte del Taller hacia las Cocheras y otra vuelve. La pantalla ocultaba posiciones, pero aquí deciden destinos.' },
        { who: 'lucia', text: 'Llevan semanas así y las Cocheras siguen figurando cerradas. Necesito saber cuánto están acumulando ahí.' },
        { who: 'tu', text: 'Sigamos el reparto varias noches; una sola puede engañarnos.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El reparto nocturno',
      Scene: CycleDemo,
      beats: [
        {
          say: 'La matriz $M$ reparte cada noche: del Taller, el 70 % se queda y el 30 % se va a las Cocheras; de las Cocheras, el 10 % vuelve y el 90 % se queda. Empezamos con 100 vagones en el Taller.',
          dur: 2,
          note: { label: 'Reparto nocturno', tex: 'M=\\begin{pmatrix}0{,}7&0{,}1\\\\0{,}3&0{,}9\\end{pmatrix}', body: 'Columna 1: destino de los vagones del Taller. Columna 2: de los de las Cocheras.' },
        },
        {
          say: 'Noche a noche el reparto cambia cada vez menos.',
          ask: { prompt: '¿Hacia qué reparto se acerca?', options: ['25 en el Taller y 75 en las Cocheras', '50 y 50', '0 y 100'], answer: 0, explain: 'Un reparto que ya no cambia cumple $M\\vec v=\\vec v$: es un vector propio con $\\lambda=1$. Lo que sale del Taller iguala lo que entra: $0{,}3\\,T=0{,}1\\,K$, así que $K=3T$: 25 y 75.' },
          note: { label: 'Reparto estable', tex: 'M\\vec v=\\vec v,\\quad \\vec v=(25,75)' },
        },
        {
          say: 'La traza de $M$ es $0{,}7+0{,}9=1{,}6$ y uno de sus valores propios es 1.',
          ask: { prompt: '¿Cuánto vale el otro valor propio?', options: ['0,6', '1,6', '−0,6'], answer: 0, explain: 'Los valores propios suman la traza: $1+\\lambda_2=1{,}6$. Como $0{,}6^k\\to0$, esa parte se apaga noche a noche: por eso el reparto se estabiliza.' },
          note: { label: 'Segundo valor propio', tex: '\\lambda_2=0{,}6', body: 'Se apaga: $0{,}6^k\\to0$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Direcciones fijas', Comp: FixedDirections, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'teo', text: 'Con 100 vagones, el reparto se acerca a 25 en el Taller y 75 en las Cocheras. La parte que cambia se reduce por 0,6 cada noche.' },
        { who: 'lucia', text: 'El 75 % en un recinto cerrado. No voy a firmar otro turno fingiendo que no lo vi.' },
        { who: 'iris', text: 'El M-7 sale otra vez esta noche. Esta vez tendremos su recorrido mientras ocurre.' },
        { who: 'lucia', text: 'A las 02:00 abro el registro; si mi jefe entra, ustedes siguen contando.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'eigen', world: 'linear', tex: 'A\\vec v=\\lambda\\vec v', name: 'Vector y valor propio', read: 'a ve igual lambda ve', meaning: '$\\vec v\\neq\\vec 0$ que $A$ no gira, solo multiplica por $\\lambda$.' },
  { id: 'charpoly', world: 'linear', tex: '\\det(A-\\lambda I)=0', name: 'Ecuación característica', read: 'determinante de a menos lambda i igual cero', meaning: 'Sus raíces son los valores propios. En $2\\times2$: $\\lambda^2-(a+d)\\lambda+\\det A=0$.' },
];
