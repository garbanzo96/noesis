import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Dist, fmt, tnum } from './kit';

// ============================================================================
// CASO 11.1 · «El denominador» — por qué el posterior exacto cuesta
// Normalizar exige sumar sobre todos los valores; con una grilla de 10 valores por parámetro,
// d parámetros son 10^d cuentas: 10^6 con 6, 10^20 con 20, 10^24 con los 24 del lector.
// ============================================================================

const PRIOR = [1 / 3, 1 / 3, 1 / 3];
const LIKE = [0.2, 0.5, 0.3];
const DS = { x0: 1110, x1: 1400, y: 660 };

/** a grid of 10^d points: drawn for d ≤ 3, written as a number after that */
function GridCount({ d }: { d: number }) {
  if (d >= 4)
    return (
      <g>
        <Cap x={540} y={380} size={72} tex={`10^{${d}}`} color={C.magenta} />
        <Cap x={540} y={470} size={22} color={C.muted}>
          {d === 6 ? 'un millón de cuentas' : 'demasiados puntos para dibujarlos'}
        </Cap>
      </g>
    );
  const blocks = d === 3 ? 10 : 1,
    side = d === 1 ? 1 : 10;
  return (
    <g>
      {Array.from({ length: blocks }, (_, b) =>
        Array.from({ length: side * 10 }, (_, i) => {
          const bx = d === 3 ? 180 + (b % 5) * 150 : 290,
            by = d === 3 ? 220 + Math.floor(b / 5) * 170 : d === 1 ? 380 : 200,
            gap = d === 3 ? 13 : 46;
          const x = bx + (i % 10) * gap,
            y = by + Math.floor(i / 10) * gap;
          return (
            <circle
              key={`${b}-${i}`}
              cx={x}
              cy={y}
              r={d === 3 ? 4 : 9}
              fill={C.cyan}
              fillOpacity={0.85}
            />
          );
        }),
      )}
    </g>
  );
}

function DenominatorLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [d, setD] = useState(1);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    const next = 1 + Math.round(clamp((px - DS.x0) / (DS.x1 - DS.x0), 0, 1) * 5);
    setD(next);
    if (next === 6) unlock();
  });
  const products = PRIOR.map((p, i) => p * LIKE[i]);
  return (
    <Stage ref={svg}>
      {beat === 0 && (
        <>
          <Dist
            labels={['θ₁', 'θ₂', 'θ₃']}
            probs={products}
            color={C.amber}
            max={0.3}
            x={200}
            w={340}
          />
          <Dist
            labels={['θ₁', 'θ₂', 'θ₃']}
            probs={LIKE}
            color={C.green}
            max={0.6}
            x={600}
            w={340}
          />
          <Cap x={370} y={690} size={19} color={C.muted}>
            prior × verosimilitud
          </Cap>
          <Cap x={770} y={690} size={19} color={C.muted}>
            dividido por la suma: posterior
          </Cap>
        </>
      )}
      {beat >= 1 && beat <= 2 && <GridCount d={beat === 1 ? d : 6} />}
      {beat >= 3 && (
        <g>
          <Cap x={540} y={330} size={60} tex="10^{20}" color={C.magenta} />
          <Cap
            x={540}
            y={430}
            size={24}
            color={C.text}
            tex="\tfrac{10^{20}}{10^{9}\ \text{por segundo}}=10^{11}\ \text{s}"
          />
          <Cap x={540} y={510} size={22} color={C.muted}>
            unos 3 mil años de cálculo
          </Cap>
        </g>
      )}
      <Cap x={1270} y={200} tex="P(D)=\sum_\theta P(D\mid\theta)P(\theta)" color={C.text} />
      {beat === 0 && (
        <Cap x={1270} y={290} tex="\tfrac1{15}+\tfrac16+\tfrac1{10}=\tfrac13" color={C.amber} />
      )}
      {beat >= 1 && beat <= 2 && (
        <Cap
          x={1270}
          y={290}
          tex={`10^{${beat === 1 ? d : 6}}=${(10 ** (beat === 1 ? d : 6)).toLocaleString('es-CL').replace(/\./g, '\\,')}`}
          color={C.cyan}
        />
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={380} tex="20\ \text{parámetros}:\ 10^{20}" color={C.magenta} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1270} y={380} size={21} color={C.green}>
            Salida 1: muestrear.
          </Cap>
          <Cap x={1270} y={460} size={21} color={C.green}>
            Salida 2: elegir una q fácil.
          </Cap>
        </>
      )}
      {beat === 1 && (
        <>
          <line x1={DS.x0} x2={DS.x1} y1={DS.y} y2={DS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={DS.x0 + ((d - 1) / 5) * (DS.x1 - DS.x0)}
            y={DS.y}
            onPointerDown={drag}
            axis="x"
            color={C.cyan}
            label={`${d}`}
          />
          <Cap x={1255} y={DS.y + 60} size={19} color={C.muted}>
            parámetros del modelo
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'El denominador',
  Scene: DenominatorLesson,
  beats: [
    {
      say: 'El posterior es prior por verosimilitud, dividido por la suma de todo. Con tres valores, la suma es fácil: un tercio.',
      board: {
        label: 'Normalizar',
        tex: '\\p{1}{P(\\theta\\mid D)}=\\p{2}{\\frac{P(D\\mid\\theta)P(\\theta)}{\\sum_{\\theta}P(D\\mid\\theta)P(\\theta)}}',
      },
    },
    {
      say: 'Un modelo real tiene muchos parámetros. Si cada uno se prueba en 10 valores, la grilla crece como 10 elevado al número de parámetros.',
      gate: 'Arrastra la perilla hasta 6 parámetros.',
      board: { label: 'Tamaño de la grilla', tex: '\\p{1}{\\#\\text{puntos}}=\\p{2}{10^{d}}' },
    },
    {
      say: 'Con seis parámetros ya es un millón de cuentas, y apenas para el denominador.',
      ask: {
        prompt: 'Con 20 parámetros y 10 valores cada uno, ¿cuántas cuentas hacen falta?',
        options: ['10²⁰', '200', '20¹⁰'],
        answer: 0,
        explain:
          'Cada parámetro multiplica por 10 las combinaciones: 10·10·…·10, veinte veces. 200 sería sumar, no combinar.',
      },
      board: { label: 'Veinte parámetros', tex: '\\p{1}{10^{20}}\\p{2}{\\ \\text{combinaciones}}' },
    },
    {
      say: 'Un computador que haga mil millones de cuentas por segundo tardaría unos 3 mil años en sumar esa grilla.',
      board: {
        label: 'Imposible a mano y a máquina',
        tex: '\\p{1}{\\tfrac{10^{20}}{10^{9}}}=\\p{2}{10^{11}\\ \\text{s}}\\p{3}{\\approx3\\,000\\ \\text{años}}',
      },
    },
    {
      say: 'Quedan dos salidas: sacar muestras en vez de recorrer todo, o elegir una distribución fácil q que se parezca al posterior.',
      board: {
        label: 'Dos salidas',
        tex: '\\p{1}{\\text{muestrear}}\\quad\\p{2}{\\text{o}}\\quad\\p{3}{q(\\theta)\\approx P(\\theta\\mid D)}',
      },
    },
  ],
};

function RecipeDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <rect
        x={200}
        y={200}
        width={680}
        height={420}
        rx={14}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={540} y={245} size={24} color={C.text}>
        Modelo del lector · Laboratorio Halcón
      </Cap>
      {Array.from({ length: 24 }, (_, i) => (
        <g key={i}>
          <rect
            x={250 + (i % 8) * 75}
            y={300 + Math.floor(i / 8) * 90}
            width={56}
            height={56}
            rx={8}
            fill={C.violet}
            fillOpacity={0.35}
            stroke={C.violet}
          />
          <Cap
            x={278 + (i % 8) * 75}
            y={328 + Math.floor(i / 8) * 90}
            size={16}
            color={C.text}
            tex={`\\theta_{${i + 1}}`}
          />
        </g>
      ))}
      {beat === 0 && answer !== null && <Cap x={1270} y={260} tex="10^{24}" color={C.magenta} />}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="q(\theta)\approx P(\theta\mid D)" color={C.green} />
      )}
    </Stage>
  );
}

function GridPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 163 + round);
    const k = pick(r, [5, 10]),
      dim = pick(r, [2, 3, 4]);
    const like = pick(r, [
      [0.2, 0.5, 0.3],
      [0.1, 0.6, 0.3],
      [0.4, 0.4, 0.2],
      [0.3, 0.6, 0.6],
    ]);
    const products = like.map((l) => l / 3);
    const ev = products.reduce((a, b) => a + b, 0);
    return { k, dim, like, ev, post2: products[1] / ev };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Un modelo tiene ${d.dim} parámetros y cada uno se prueba en ${d.k} valores. ¿Cuántos puntos tiene la grilla?`,
        `Prior uniforme en tres valores y verosimilitudes ${d.like.map((l) => fmt(l, 1)).join(', ')}. ¿Cuánto vale P(D)? Dos decimales.`,
        `Con los mismos datos (verosimilitudes ${d.like.map((l) => fmt(l, 1)).join(', ')} y prior uniforme), ¿cuánto vale el posterior del segundo valor? Dos decimales.`,
      ][round],
      [
        'k^{d}',
        'P(D)=\\sum P(D\\mid\\theta)P(\\theta)',
        'P(\\theta_2\\mid D)=\\frac{P(D\\mid\\theta_2)P(\\theta_2)}{P(D)}',
      ][round],
    );
    api.hints(
      [
        [
          'Cada parámetro multiplica las combinaciones.',
          'Eleva la cantidad de valores al número de parámetros.',
        ],
        ['Cada producto es verosimilitud por 1/3.', 'Suma los tres productos.'],
        ['Primero calcula P(D).', 'Divide el producto del segundo valor por P(D).'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = d.k ** d.dim;
      if (v === t) return api.result(true, `$${d.k}^{${d.dim}}=${t}$ puntos.`);
      if (v === d.k * d.dim)
        return api.result(
          false,
          'Multiplicaste en vez de elevar: cada parámetro multiplica todas las combinaciones anteriores.',
        );
      return api.result(
        false,
        `Son ${d.k} valores por parámetro, ${d.dim} veces: ${d.k}^${d.dim}.`,
      );
    }
    const t = round === 1 ? d.ev : d.post2;
    if (Math.abs(v - t) < 0.011) return api.result(true, `$${tnum(t)}$.`);
    if (round === 1 && Math.abs(v - d.like.reduce((a, b) => a + b, 0)) < 0.011)
      return api.result(false, 'Sumaste las verosimilitudes sin multiplicarlas por el prior 1/3.');
    if (round === 2 && Math.abs(v - d.like[1] / 3) < 0.011)
      return api.result(false, 'Falta dividir por P(D) para que el posterior sume 1.');
    return api.result(
      false,
      round === 1
        ? 'P(D) = (suma de verosimilitudes) / 3.'
        : `P(D) ≈ ${fmt(d.ev, 3)}; divide ${fmt(d.like[1] / 3, 3)} por eso.`,
    );
  };
  return (
    <Stage>
      {round === 0 ? (
        <Cap x={540} y={380} size={26} color={C.muted}>
          Cada parámetro multiplica las combinaciones.
        </Cap>
      ) : (
        <Dist labels={['θ₁', 'θ₂', 'θ₃']} probs={d.like} color={C.green} max={0.7} />
      )}
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['puntos =', 'P(D) =', 'P(θ₂ | D) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c1',
  world: 'variational',
  code: '11.1',
  title: 'El denominador',
  subtitle: 'Por qué el posterior exacto cuesta',
  glyph: 'P(D)',
  kind: 'level',
  guide: 'simon',
  teaser:
    'El Laboratorio dice que su modelo no se puede calcular exacto. Simón sabe por qué, y qué hicieron en cambio.',
  learn:
    'Ver por qué normalizar un posterior exige sumar sobre todas las combinaciones de parámetros y por qué eso crece como 10^d.',
  glyphs: ['vi-evidence', 'vi-grid'],
  pitfalls: [
    'Las combinaciones se multiplican: k valores y d parámetros dan k^d, no k·d.',
    'El posterior necesita dividir por P(D) para sumar 1.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio Los Placeres, 20:30. El pasillo huele a desinfectante y a café quemado; detrás del vidrio, un rack de servidores parpadea en lila.',
        },
        {
          who: 'simon',
          text: 'Renuncié en julio. Les dije que la receta no cuadraba y me ofrecieron un bono para que lo olvidara.',
        },
        { who: 'iris', text: '¿Qué receta?' },
        {
          who: 'simon',
          text: 'El modelo del lector. Exacto no se puede calcular, eso es verdad. Lo que hicieron en vez de calcularlo, eso es otra cosa.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La receta del lector',
      Scene: RecipeDemo,
      beats: [
        {
          say: 'El modelo del lector tiene 24 parámetros. Cada uno se podría probar en 10 valores.',
          ask: {
            prompt: '¿Cuántas combinaciones tendría que sumar el denominador?',
            options: ['10²⁴', '240', '24¹⁰'],
            answer: 0,
            explain:
              'Diez valores por parámetro, veinticuatro veces: 10²⁴. Ni en miles de años alcanza.',
          },
          note: { label: 'Grilla del lector', tex: '10^{24}\\ \\text{combinaciones}' },
        },
        {
          say: 'Simón abre la carpeta de configuración del modelo.',
          ask: {
            prompt: '¿Qué hace entonces el Laboratorio?',
            options: [
              'Aproxima el posterior con una q más simple',
              'Calcula todo igual',
              'Ignora los datos',
            ],
            answer: 0,
            explain:
              'La carpeta se llama «aproximación q». Cuál q eligieron decide qué ve el lector.',
          },
          note: {
            label: 'La salida del Laboratorio',
            tex: 'q(\\theta)\\approx P(\\theta\\mid D)',
            body: 'La aproximación es legítima. Hay que revisar cuál eligieron.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Contar y normalizar', Comp: GridPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Simón cierra la carpeta. El ventilador del rack sube de tono y vuelve a bajar.',
        },
        {
          who: 'simon',
          text: 'Hay maneras honestas de aproximar. La primera es la más vieja: tirar dados.',
        },
        { who: 'teo', text: 'Muéstrame cuántos dados hacen falta.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-evidence',
    world: 'variational',
    tex: 'P(D)',
    name: 'Evidencia',
    read: 'pe de de',
    meaning:
      'Suma de prior por verosimilitud sobre todos los valores: el denominador del posterior.',
  },
  {
    id: 'vi-grid',
    world: 'variational',
    tex: 'k^{d}',
    name: 'Tamaño de la grilla',
    read: 'ka elevado a de',
    meaning: 'Combinaciones al probar k valores en cada uno de d parámetros.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Evidencia', tex: 'P(D)=\\sum_\\theta P(D\\mid\\theta)P(\\theta)' },
    { label: 'Posterior', tex: 'P(\\theta\\mid D)=\\frac{P(D\\mid\\theta)P(\\theta)}{P(D)}' },
  ],
  props: [
    {
      label: 'Crecimiento',
      tex: '\\#\\text{puntos}=k^{d}',
      body: 'Crece exponencialmente con el número de parámetros.',
    },
    { label: 'Dos salidas', tex: '\\text{muestrear}\\ \\text{o}\\ q\\approx P(\\theta\\mid D)' },
  ],
};

export { lesson };
