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
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Grid, Vec, add, eqV, fromCols, lattice, lerpM, n, sc, txtV, type V2 } from './kit';

// ============================================================================
// CASO 4.2 · «Dos rieles» — combinaciones lineales
// a·u + b·v; espacio generado; vectores paralelos (dependientes) generan solo una recta;
// dos independientes forman una base y dan coordenadas únicas; hallar a, b igualando componentes.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);

/** Two sliders for the coefficients a and b, on the right of the stage. */
function Coef({
  y,
  value,
  onDown,
  color,
  name,
}: {
  y: number;
  value: number;
  onDown: React.PointerEventHandler;
  color: string;
  name: string;
}) {
  const X = (v: number) => 1230 + ((v + 3) / 7) * 280;
  return (
    <g>
      <line x1={X(-3)} x2={X(4)} y1={y} y2={y} stroke={C.line} strokeWidth={3} />
      {[-3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
        <Cap key={t} x={X(t)} y={y + 30} size={14} color={C.dim} tex={String(t)} />
      ))}
      <Knob
        x={X(value)}
        y={y}
        color={color}
        onPointerDown={onDown}
        cursor="ew-resize"
        label={`${name}=${value}`}
      />
    </g>
  );
}
const slider = (x: number) => Math.round(clamp(-3 + ((x - 1230) / 280) * 7, -3, 4));

// ---------------------------------------------------------------- lesson
function ComboLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const target: V2 = [1, 5];
  const u: V2 = [2, 1];
  const v0: V2 = [-1, 1];
  const check = (na: number, nb: number) => {
    if (eqV(add(sc(na, u), sc(nb, v0)), target)) unlock();
  };
  const onA = useSvgDrag(svg, (x) => {
    const t = slider(x);
    setA(t);
    check(t, b);
  });
  const onB = useSvgDrag(svg, (x) => {
    const t = slider(x);
    setB(t);
    check(a, t);
  });
  // in beat 3 v turns until it is parallel to u
  const v: V2 = beat === 3 ? [v0[0] + (-4 - v0[0]) * at(3), v0[1] + (-2 - v0[1]) * at(3)] : v0;
  const showA = beat <= 1 ? a : beat === 4 ? 2 : beat === 5 ? 1 : 1;
  const showB = beat <= 1 ? b : beat === 4 ? 3 : beat === 5 ? -2 : 1;
  const au = sc(showA, u);
  const res = add(au, sc(showB, v));
  return (
    <Stage ref={svg}>
      <Grid P={P} opacity={0} />
      {beat >= 2 && (
        <Grid
          P={P}
          M={
            beat === 3
              ? fromCols(u, v)
              : lerpM(fromCols([1, 0], [0, 1]), fromCols(u, v0), beat === 2 ? at(2) : 1)
          }
          color={C.violet}
          opacity={0.5}
          base={false}
          axes={false}
        />
      )}
      {beat <= 1 && <Dot x={P.x(target[0])} y={P.y(target[1])} r={8} color={C.green} ring />}
      {beat !== 3 && !(beat === 5 && answer === null) && (
        <>
          <Vec P={P} v={au} color={C.cyan} width={3} opacity={0.6} />
          <Vec P={P} v={sc(showB, v)} from={au} color={C.amber} width={3} opacity={0.6} />
          <Vec
            P={P}
            v={res}
            color={C.green}
            label={beat <= 1 ? 'a\\vec u+b\\vec v' : undefined}
            off={[0, -30]}
          />
        </>
      )}
      <Vec P={P} v={u} color={C.cyan} width={6} label="\vec u" off={[16, 24]} />
      <Vec P={P} v={v} color={C.amber} width={6} label="\vec v" off={[-26, -12]} />
      {beat <= 1 && (
        <>
          <Coef y={360} value={a} onDown={onA} color={C.cyan} name="a" />
          <Coef y={470} value={b} onDown={onB} color={C.amber} name="b" />
          <Cap
            x={1370}
            y={250}
            size={24}
            color={C.green}
            tex={`${n(a)}\\vec u+${n(b)}\\vec v=${txtV(res).replace(/,/, ',\\,')}`}
          />
        </>
      )}
      {beat === 3 && answer !== null && <Dot x={P.x(1)} y={P.y(5)} r={8} color={C.red} ring />}
      {beat === 3 && (
        <Cap
          x={1370}
          y={250}
          size={24}
          color={C.text}
          tex={at(3) > 0.95 ? '\\vec v=-2\\,\\vec u' : '\\vec v\\ \\text{gira}'}
        />
      )}
      {beat === 4 && <Cap x={1370} y={250} size={24} color={C.green} tex="2\vec u+3\vec v=(1,5)" />}
      {beat === 5 && (
        <Cap
          x={1370}
          y={250}
          size={24}
          color={answer !== null ? C.green : C.text}
          tex={answer !== null ? '1\\,\\vec u-2\\,\\vec v=(4,-1)' : 'a\\vec u+b\\vec v=(4,-1)'}
        />
      )}
      {beat === 5 && <Dot x={P.x(4)} y={P.y(-1)} r={8} color={C.green} ring />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Combinaciones lineales',
  intro: {
    question: '¿A qué puntos se llega combinando dos direcciones fijas?',
    text: 'Una combinación lineal escala dos vectores y los suma. Con dos direcciones independientes se alcanza cualquier punto del plano, y los coeficientes son sus coordenadas en esa base. La grúa de las cocheras se mueve sobre dos rieles inclinados, y su contador guarda cuántos pasos dio en cada uno.',
  },
  Scene: ComboLesson,
  beats: [
    {
      say: 'Con dos vectores $\\vec u$ y $\\vec v$ se puede formar $a\\vec u+b\\vec v$: estirar cada uno por un número y sumar. Eso es una **combinación lineal**.',
      dur: 2.6,
      board: {
        label: 'Combinación lineal',
        tex: '\\p{1}{a}\\,\\cC{\\vec u}+\\p{2}{b}\\,\\cA{\\vec v}',
        body: '$a$ y $b$ son números cualesquiera: los **coeficientes**.',
        parts: ['peso del primer vector', 'peso del segundo vector'],
      },
    },
    {
      say: 'Cada elección de $a$ y $b$ lleva a un punto distinto.',
      gate: 'Mueve $a$ y $b$ hasta que la flecha verde llegue al punto $(1,5)$.',
    },
    {
      say: 'Si se dibujan todas las combinaciones con $a$ y $b$ enteros, aparece una cuadrícula inclinada. Con $a$ y $b$ reales se llena el plano entero.',
      dur: 2.6,
      board: {
        label: 'Espacio generado',
        tex: '\\operatorname{gen}\\{\\vec u,\\vec v\\}=\\{\\,\\p{1}{a\\vec u+b\\vec v}\\ :\\ \\p{2}{a,b\\in\\mathbb R}\\,\\}',
        body: 'Todos los puntos que se alcanzan combinando $\\vec u$ y $\\vec v$.',
        parts: ['puntos que se alcanzan', 'pesos sin restricción'],
      },
    },
    {
      say: 'Pero si $\\vec v$ apunta en la misma dirección que $\\vec u$, la cuadrícula se aplasta: todas las combinaciones quedan sobre una recta.',
      ask: {
        prompt: 'Con $\\vec u=(2,1)$ y $\\vec v=(-4,-2)$, ¿se puede llegar a $(1,5)$?',
        options: [
          'No: solo se alcanza la recta de $\\vec u$',
          'Sí, con $a$ y $b$ grandes',
          'Sí, con $a=b$',
        ],
        answer: 0,
        explain:
          '$\\vec v=-2\\vec u$, así que $a\\vec u+b\\vec v=(a-2b)\\vec u$: siempre un múltiplo de $(2,1)$. El punto $(1,5)$ no lo es.',
      },
      board: {
        label: 'Dependencia lineal',
        tex: '\\vec v=\\p{1}{k}\\,\\vec u',
        body: 'Si uno es múltiplo del otro, son **dependientes** y generan solo una recta. Si no, son **linealmente independientes**.',
        parts: ['factor entre los vectores'],
      },
    },
    {
      say: 'Dos vectores independientes del plano forman una **base**: cada punto se escribe de **una sola** manera como $a\\vec u+b\\vec v$. Los números $(a,b)$ son sus coordenadas en esa base.',
      dur: 3,
      board: {
        label: 'Base y coordenadas',
        tex: '\\vec w=\\p{1}{a}\\,\\vec u+\\p{2}{b}\\,\\vec v\\ \\Rightarrow\\ [\\vec w]=\\p{3}{\\begin{pmatrix}a\\\\b\\end{pmatrix}}',
        body: 'La base usual es $\\vec e_1=(1,0)$, $\\vec e_2=(0,1)$: ahí las coordenadas son las componentes.',
        parts: ['peso del primer vector', 'peso del segundo vector', 'coordenadas en esta base'],
      },
    },
    {
      say: 'Para hallar $a$ y $b$ sin tantear, se igualan las componentes. Con $\\vec u=(2,1)$, $\\vec v=(-1,1)$ y $\\vec w=(4,-1)$ quedan dos ecuaciones; sumándolas, $b$ desaparece.',
      ask: {
        prompt: '¿Qué coeficientes dan $(4,-1)$?',
        options: ['$a=1,\\ b=-2$', '$a=2,\\ b=0$', '$a=-1,\\ b=2$'],
        answer: 0,
        explain:
          '$2a-b=4$ y $a+b=-1$. Sumando: $3a=3$, $a=1$; luego $b=-2$. Comprobación: $(2,1)-2(-1,1)=(4,-1)$.',
      },
      board: {
        label: 'Igualar componentes',
        tex: '\\begin{cases}\\p{1}{2a-b=4}\\\\\\p{2}{a+b=-1}\\end{cases}\\ \\Rightarrow\\ \\p{3}{a=1,\\ b=-2}',
        parts: ['condición horizontal', 'condición vertical', 'pesos que buscamos'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const CU: V2 = [2, 1];
const CV: V2 = [-1, 2];

function CraneDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const broken = beat === 2;
  const v: V2 = broken ? [4, 2] : CV;
  const shown = beat >= 2 || (beat === 1 && answer !== null);
  return (
    <Stage>
      <Grid P={P} opacity={0} />
      <Grid
        P={P}
        M={fromCols(CU, v)}
        color={broken ? C.red : C.violet}
        opacity={0.45 * (beat === 0 ? at(0) : 1)}
        base={false}
        axes={false}
      />
      <rect
        x={P.x(3) - 26}
        y={P.y(4) - 16}
        width={52}
        height={32}
        rx={4}
        fill={C.panel}
        stroke={C.red}
        strokeWidth={3}
      />
      <Cap x={P.x(3)} y={P.y(4) - 38} size={16} color={C.red}>
        vagón sellado
      </Cap>
      <Vec P={P} v={CU} color={C.cyan} width={6} label="\vec u" off={[16, 24]} />
      <Vec P={P} v={v} color={C.amber} width={6} label="\vec v" off={[-22, -14]} />
      {beat >= 1 && !broken && shown && (
        <>
          <Vec P={P} v={sc(2, CU)} color={C.cyan} width={3} opacity={0.6} />
          <Vec P={P} v={CV} from={sc(2, CU)} color={C.amber} width={3} opacity={0.6} />
          <Vec P={P} v={[3, 4]} color={C.green} />
        </>
      )}
      <Cap x={1370} y={230} size={22} color={C.cyan} tex={`\\vec u=${txtV(CU)}`} />
      <Cap x={1370} y={280} size={22} color={broken ? C.red : C.amber} tex={`\\vec v=${txtV(v)}`} />
      {beat === 1 && <Cap x={1370} y={350} size={22} color={C.text} tex="a=2,\ b=1" />}
      {beat === 1 && shown && (
        <Cap x={1370} y={410} size={22} color={C.green} tex="2\vec u+\vec v=(3,4)" />
      )}
      {broken && answer !== null && (
        <Cap x={1370} y={350} size={22} color={C.red} tex="(4,2)=2\,(2,1)" />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Reach = 'Sí' | 'No';

function CraneRounds({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 13 + round);
    let u: V2 = [2, 1];
    let v: V2 = [-1, 2];
    let a = 1;
    let b = 1;
    for (let t = 0; t < 120; t++) {
      u = [randInt(r, -2, 3), randInt(r, -2, 3)];
      v = [randInt(r, -3, 2), randInt(r, -2, 3)];
      a = pick(r, [-2, -1, 1, 2, 3]);
      b = pick(r, [-2, -1, 1, 2]);
      const w = add(sc(a, u), sc(b, v));
      const det = u[0] * v[1] - u[1] * v[0];
      if (
        det !== 0 &&
        Math.abs(w[0]) <= 6 &&
        Math.abs(w[1]) <= 4 &&
        !(a === b) &&
        (u[0] !== 0 || u[1] !== 0)
      )
        break;
    }
    // round 1: parallel or not
    const kind = pick(r, ['par-off', 'par-on', 'indep'] as const);
    const u1: V2 = pick(r, [
      [1, 2],
      [2, -1],
      [1, 1],
      [3, 1],
    ] as V2[]);
    const k = pick(r, [-2, 2, 3]);
    const v1: V2 = kind === 'indep' ? [u1[1], -u1[0] + 1] : sc(k, u1);
    const w1: V2 =
      kind === 'par-on' ? sc(-1, u1) : kind === 'par-off' ? add(u1, [1, 0]) : add(u1, v1);
    return { u, v, a, b, w: add(sc(a, u), sc(b, v)), kind, u1, v1, w1 };
  }, [seed, round]);
  const [va, setVa] = useState('');
  const [vb, setVb] = useState('');
  const [pickR, setPickR] = useState<Reach | null>(null);
  const { u, v, a, b, w, kind, u1, v1, w1 } = data;

  useEffect(() => {
    setVa('');
    setVb('');
    setPickR(null);
    if (round === 0) {
      api.prompt(
        'La grúa corre sobre los rieles $\\vec u$ y $\\vec v$. ¿Cuántos pasos en cada riel llevan al punto verde? La cuadrícula violeta cuenta pasos.',
        '\\vec w=a\\vec u+b\\vec v',
      );
      api.hints([
        'Sigue las líneas violetas: unas son paralelas a $\\vec u$ y otras a $\\vec v$.',
        'O iguala componentes: dos ecuaciones con $a$ y $b$.',
      ]);
    } else if (round === 1) {
      api.prompt(
        'Otra grúa, otros rieles. ¿Puede llegar al punto rojo combinando $\\vec u$ y $\\vec v$?',
        'a\\vec u+b\\vec v=\\vec w',
      );
      api.hints([
        '¿Es $\\vec v$ un múltiplo de $\\vec u$?',
        'Si lo es, solo se alcanzan los puntos de la recta de $\\vec u$.',
      ]);
    } else {
      api.prompt(
        'Sin cuadrícula: halla las coordenadas de $\\vec w$ en la base $\\{\\vec u,\\vec v\\}$.',
        '\\vec w=a\\vec u+b\\vec v',
      );
      api.hints([
        'Escribe una ecuación por componente.',
        `Primera componente: $${n(u[0])}a+${n(v[0])}b=${n(w[0])}$.`.replace(/\+-/g, '-'),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (!pickR) return;
      const reach = kind !== 'par-off';
      if ((pickR === 'Sí') === reach)
        return api.result(
          true,
          kind === 'indep'
            ? 'Son independientes: generan todo el plano.'
            : kind === 'par-on'
              ? `$\\vec v=${k(v1, u1)}\\vec u$, pero el punto está en la recta de $\\vec u$: basta $a\\vec u$ con $a=-1$.`
              : `$\\vec v=${k(v1, u1)}\\vec u$: solo generan la recta de $\\vec u$, y el punto está fuera.`,
        );
      return api.result(
        false,
        kind === 'indep'
          ? 'Ningún vector es múltiplo del otro: son independientes y alcanzan cualquier punto.'
          : kind === 'par-on'
            ? 'Los rieles son paralelos, pero mira si el punto cae sobre su recta.'
            : `$\\vec v$ es múltiplo de $\\vec u$: todas las combinaciones quedan en una recta.`,
      );
    }
    const A = parseNum(va);
    const B = parseNum(vb);
    if (A === null || B === null) return;
    if (Math.abs(A - a) < 0.01 && Math.abs(B - b) < 0.01)
      return api.result(
        true,
        `$${n(a)}\\,${texV2(u)}+${n(b)}\\,${texV2(v)}=${texV2(w)}$.`.replace(/\+-/g, '-'),
      );
    if (Math.abs(A - b) < 0.01 && Math.abs(B - a) < 0.01)
      return api.result(false, 'Intercambiaste $a$ y $b$: $a$ multiplica a $\\vec u$.');
    return api.result(
      false,
      `Con esos valores la grúa llega a $${txtV(add(sc(A, u), sc(B, v)))}$, no a $${txtV(w)}$.`,
    );
  };

  return (
    <Stage>
      <Grid P={P} opacity={0} />
      {round === 0 && (
        <Grid P={P} M={fromCols(u, v)} color={C.violet} opacity={0.4} base={false} axes={false} />
      )}
      {round === 1 ? (
        <>
          <Vec P={P} v={u1} color={C.cyan} width={6} label="\vec u" off={[18, 22]} />
          <Vec P={P} v={v1} color={C.amber} width={4} label="\vec v" off={[-24, -16]} />
          <Dot x={P.x(w1[0])} y={P.y(w1[1])} r={9} color={C.red} ring />
          <Cap x={1370} y={230} size={24} color={C.cyan} tex={`\\vec u=${txtV(u1)}`} />
          <Cap x={1370} y={284} size={24} color={C.amber} tex={`\\vec v=${txtV(v1)}`} />
          <Cap x={1370} y={338} size={24} color={C.red} tex={`\\vec w=${txtV(w1)}`} />
          <Choices
            x={1370}
            y={440}
            options={['Sí', 'No'] as Reach[]}
            value={pickR}
            onPick={setPickR}
          />
        </>
      ) : (
        <>
          <Vec P={P} v={u} color={C.cyan} width={6} label="\vec u" off={[18, 22]} />
          <Vec P={P} v={v} color={C.amber} width={6} label="\vec v" off={[-24, -16]} />
          <Dot x={P.x(w[0])} y={P.y(w[1])} r={9} color={C.green} ring />
          <Cap x={1370} y={230} size={24} color={C.cyan} tex={`\\vec u=${txtV(u)}`} />
          <Cap x={1370} y={284} size={24} color={C.amber} tex={`\\vec v=${txtV(v)}`} />
          <Cap x={1370} y={338} size={24} color={C.green} tex={`\\vec w=${txtV(w)}`} />
          <NumberField x={1250} y={430} value={va} onChange={setVa} label="a =" width={3} />
          <NumberField
            x={1250}
            y={500}
            value={vb}
            onChange={setVb}
            onEnter={submit}
            label="b ="
            width={3}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
const texV2 = (v: V2) => `\\begin{pmatrix}${n(v[0])}\\\\${n(v[1])}\\end{pmatrix}`;
/** The factor k with v = k·u (both parallel, u ≠ 0). */
const k = (v: V2, u: V2) => n(u[0] !== 0 ? v[0] / u[0] : v[1] / u[1]);

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c2',
  world: 'linear',
  code: '4.2',
  title: 'Dos rieles',
  subtitle: 'Combinaciones lineales',
  glyph: 'a\\vec u+b\\vec v',
  kind: 'level',
  guide: 'teo',
  teaser:
    'En las cocheras cerradas, una grúa se mueve sobre dos rieles inclinados. Su contador dice cuántos pasos dio en cada uno, y con eso se sabe adónde llegó.',
  learn:
    'Combinaciones lineales $a\\vec u+b\\vec v$, espacio generado, dependencia e independencia lineal, bases y coordenadas en una base.',
  glyphs: ['lincomb', 'span'],
  pitfalls: [
    'Dos vectores paralelos (uno múltiplo del otro) no generan el plano, solo una recta.',
    'Las coordenadas en una base dependen del orden: $a$ acompaña a $\\vec u$ y $b$ a $\\vec v$.',
    'Igualar componentes da una ecuación por cada eje.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'nar',
          text: 'Cocheras Barón, dos y media. El candado de la reja era nuevo, y en la oscuridad zumbaba una grúa de pórtico.',
        },
        {
          who: 'teo',
          text: 'Todavía tiene corriente. Corre por dos rieles inclinados y guarda los pasos que dio en cada uno, pero nadie anotó qué movió.',
        },
        {
          who: 'lucia',
          text: 'No toques el mando. Si algo se cae, la mantención de estas cocheras me la van a cargar a mí.',
        },
        {
          who: 'iris',
          text: 'Entonces leamos el contador. El vagón sellado del fondo tuvo que llegar hasta ahí de algún modo.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La grúa de las cocheras',
      Scene: CraneDemo,
      beats: [
        {
          say: 'Un paso en el riel largo mueve la grúa $\\vec u=(2,1)$; uno en el riel corto, $\\vec v=(-1,2)$. La cuadrícula violeta marca todas las posiciones con pasos enteros.',
          dur: 2,
          note: { label: 'Rieles de la grúa', tex: '\\vec u=(2,1),\\quad \\vec v=(-1,2)' },
        },
        {
          say: 'Anoche el contador marcó $a=2$ pasos en el riel largo y $b=1$ en el corto.',
          ask: {
            prompt: '¿Dónde quedó la grúa?',
            options: ['(3, 4), sobre el vagón sellado', '(1, 5)', '(4, 2)'],
            answer: 0,
            explain: '$2(2,1)+(-1,2)=(4-1,\\,2+2)=(3,4)$.',
          },
          note: { label: 'Posición de la grúa', tex: '2\\vec u+\\vec v=(3,4)' },
        },
        {
          say: 'Teo encuentra una segunda grúa, averiada: sus rieles quedaron paralelos, $\\vec u=(2,1)$ y $\\vec v=(4,2)$.',
          ask: {
            prompt: '¿Pudo esa grúa llegar al vagón?',
            options: [
              'No: solo recorre la recta de $\\vec u$',
              'Sí, con $a=1$ y $b=\\tfrac12$',
              'Sí, con cualquier par $a$, $b$',
            ],
            answer: 0,
            explain:
              '$(4,2)=2(2,1)$: toda combinación es múltiplo de $(2,1)$ y $(3,4)$ no lo es. Solo la primera grúa movió el vagón.',
          },
          note: {
            label: 'Rieles paralelos',
            tex: '(4,2)=2\\,(2,1)',
            body: 'Dependientes: generan solo una recta.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Pasos de grúa', Comp: CraneRounds, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        {
          who: 'teo',
          text: 'Dos pasos en el riel largo y uno en el corto: (3, 4), justo sobre el vagón sellado. La grúa averiada no alcanzaba ese punto.',
        },
        {
          who: 'iris',
          text: 'Había dos grúas, y alguien usó la que servía. ¿Qué más dejaron conectado?',
        },
        {
          who: 'teo',
          text: 'Sale fibra óptica por el piso del vagón y va hacia la vía en desuso.',
        },
        {
          who: 'lucia',
          text: 'Los sensores de ese tramo todavía miden. Mi jefe nunca lo menciona en las reuniones.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'lincomb',
    world: 'linear',
    tex: 'a\\vec u+b\\vec v',
    name: 'Combinación lineal',
    read: 'a por u más be por ve',
    meaning: 'Suma de vectores multiplicados por números (coeficientes).',
  },
  {
    id: 'span',
    world: 'linear',
    tex: '\\operatorname{gen}\\{\\vec u,\\vec v\\}',
    name: 'Espacio generado',
    read: 'generado por u y ve',
    meaning:
      'Todas las combinaciones lineales de $\\vec u$ y $\\vec v$: una recta si son paralelos, el plano si son independientes.',
  },
];
