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
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseProb } from '../shared/ui';
import { fmt, tnum } from './kit';

// Dos fuentes sobre {0,1,2,3}. Con pi=1/2 y x=2: 0,075/0,225=1/3.
const A = [0.5, 0.3, 0.15, 0.05];
const B = [0.05, 0.15, 0.3, 0.5];
const CENTERS = [250, 450, 650, 850];

/** Solo muestra datos de las fuentes; no calcula la respuesta de las prácticas. */
function SourceBars({ a = A, b = B, selected }: { a?: number[]; b?: number[]; selected?: number }) {
  return (
    <g>
      <Cap x={550} y={100} size={23}>
        Máquina A: ámbar · Máquina B: celeste
      </Cap>
      <line x1={150} x2={950} y1={490} y2={490} stroke={C.line} strokeWidth={2} />
      {CENTERS.map((x, i) => (
        <g key={i}>
          {selected === i && (
            <rect
              x={x - 90}
              y={150}
              width={180}
              height={410}
              rx={12}
              fill={C.amber}
              fillOpacity={0.08}
              stroke={C.amber}
            />
          )}
          {[a[i], b[i]].map((p, j) => {
            const cx = x + (j === 0 ? -40 : 40);
            const height = p * 580;
            return (
              <g key={j}>
                <rect
                  x={cx - 26}
                  y={490 - height}
                  width={52}
                  height={height}
                  rx={6}
                  fill={j === 0 ? C.amber : C.cyan}
                />
                <Cap x={cx} y={490 - height - 25} size={19} color={j === 0 ? C.amber : C.cyan}>
                  {fmt(p)}
                </Cap>
              </g>
            );
          })}
          <Cap x={x} y={530} tex={`x=${i}`} />
        </g>
      ))}
    </g>
  );
}

function MixtureLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [weight, setWeight] = useState(0.2);
  const { beat } = beats;
  const pi = beat === 1 ? weight : 0.5;
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 1) return;
    const next = Math.round(clamp((px - 210) / 680, 0, 1) * 100) / 100;
    setWeight(next);
  });
  useEffect(() => {
    if (beat === 1 && weight === 0.5) unlock();
  }, [beat, weight, unlock]);
  return (
    <Stage ref={svg}>
      <SourceBars selected={beat >= 2 ? 2 : undefined} />
      <Cap x={1250} y={200} tex={`\\pi=${tnum(pi)}`} color={C.amber} />
      <Cap x={1250} y={290} tex={`1-\\pi=${tnum(1 - pi)}`} color={C.cyan} />
      {beat === 1 && (
        <>
          <Cap x={550} y={620} size={22}>
            Proporción del lote que sale de A
          </Cap>
          <line x1={210} x2={890} y1={700} y2={700} stroke={C.line} strokeWidth={5} />
          <line x1={550} x2={550} y1={680} y2={720} stroke={C.green} strokeWidth={3} />
          <Knob
            x={210 + weight * 680}
            y={700}
            axis="x"
            label="π"
            color={C.amber}
            onPointerDown={drag}
          />
          <Cap x={210} y={760} size={20}>
            Todo B
          </Cap>
          <Cap x={550} y={790} size={20} color={C.green}>
            Mitad y mitad
          </Cap>
          <Cap x={890} y={760} size={20}>
            Todo A
          </Cap>
          <Cap x={1250} y={380} tex={`P(2)=${tnum(pi * A[2] + (1 - pi) * B[2], 3)}`} />
        </>
      )}
      {beat >= 2 && (
        <>
          <Cap x={1250} y={380} tex="\pi P_A(2)=0{,}075" color={C.amber} />
          <Cap x={1250} y={470} tex="(1-\pi)P_B(2)=0{,}15" color={C.cyan} />
          <Cap x={1250} y={560} tex="P(2)=0{,}225" />
        </>
      )}
      {((beat === 3 && answer !== null) || beat === 4) && (
        <Cap x={1250} y={650} tex="r_A=\frac{0{,}075}{0{,}225}=\frac13" color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={550} y={660} size={22}>
          Un valor 2 puede salir de cualquiera de las dos máquinas.
        </Cap>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Dos grupos en una mezcla',
  Scene: MixtureLesson,
  beats: [
    {
      say: 'Las dos máquinas producen valores de 0 a 3. A entrega más valores bajos; B entrega más valores altos. Mira las barras de cada fuente.',
      board: {
        label: 'Las fuentes',
        tex: '\\p{1}{P_A}=\\p{2}{(0{,}5;0{,}3;0{,}15;0{,}05)},\\quad\\p{3}{ P_B}=\\p{4}{(0{,}05;0{,}15;0{,}3;0{,}5)}',
      },
    },
    {
      say: 'Una **mezcla** elige primero una máquina y luego genera el valor. Arrastra la proporción de A hasta 0,5 para dejar el lote mitad y mitad.',
      gate: 'Lleva la perilla π a la marca central: 0,5.',
      board: {
        label: 'Probabilidad de mezcla',
        tex: '\\p{1}{P(x)}=\\p{2}{\\pi P_A(x)}+\\p{3}{(1-\\pi)P_B(x)}',
      },
    },
    {
      say: 'Para x = 2, A aporta 0,5 · 0,15 = 0,075 y B aporta 0,5 · 0,3 = 0,15. Suma ambos aportes para obtener la probabilidad del valor en la cinta.',
      board: {
        label: 'Un valor en la cinta',
        tex: '\\p{1}{P(2)}=\\p{2}{0{,}5\\cdot0{,}15+0{,}5\\cdot0{,}3}=\\p{3}{0{,}225}',
      },
    },
    {
      say: 'La **responsabilidad** de A es la fracción del aporte total que viene de A, dado el valor observado.',
      ask: {
        prompt: 'Ves un registro con x = 2. ¿Qué probabilidad tiene de venir de A?',
        options: ['1/3', '1/2', '0,15'],
        answer: 0,
        explain:
          'Divide el aporte de A por el total: 0,075/(0,075 + 0,15) = 1/3. El reparto inicial era mitad y mitad; observar x = 2 favorece a B.',
      },
      board: {
        label: 'Responsabilidad de A',
        tex: '\\p{1}{r_A=P(A\\mid x)}=\\p{2}{\\frac{\\pi P_A(x)}{P(x)}}',
      },
    },
    {
      say: 'Una responsabilidad de 1/3 expresa incertidumbre sobre el origen de ese registro. B tiene responsabilidad 2/3; el valor por sí solo no identifica la máquina.',
      board: {
        label: 'Las responsabilidades suman uno',
        tex: '\\p{1}{r_A}=\\p{2}{\\tfrac13},\\quad\\p{3}{ r_B}=\\p{4}{1-r_A}=\\p{5}{\\tfrac23}',
      },
    },
  ],
};

function ConveyorDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <SourceBars selected={beat === 0 ? 0 : 2} />
      <Cap x={1250} y={200} tex="\pi=\frac12" color={C.amber} />
      <Cap x={1250} y={290} tex="1-\pi=\frac12" color={C.cyan} />
      <Cap x={1250} y={380} tex={beat === 0 ? 'x=0' : 'x=2'} />
      {answer !== null &&
        (beat === 0 ? (
          <Cap x={1250} y={470} tex="P(0)=0{,}275" color={C.green} />
        ) : (
          <>
            <Cap x={1250} y={470} tex="P(2)=0{,}225" />
            <Cap x={1250} y={560} tex="P(A\mid2)=\frac13" color={C.green} />
          </>
        ))}
      <Cap x={550} y={670} size={23}>
        Las carpetas salen sin la etiqueta de origen.
      </Cap>
    </Stage>
  );
}

function MixturePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 193 + round);
    const a = pick(r, [
      [10, 6, 3, 1],
      [8, 7, 4, 1],
      [9, 5, 4, 2],
    ]).map((v) => v / 20);
    const b = pick(r, [
      [1, 3, 6, 10],
      [1, 4, 7, 8],
      [2, 4, 5, 9],
    ]).map((v) => v / 20);
    const pi = pick(r, [0.25, 0.4, 0.6, 0.75]);
    const x = randInt(r, 0, 3);
    const jointA = pi * a[x];
    const jointB = (1 - pi) * b[x];
    const mixture = jointA + jointB;
    return { a, b, pi, x, jointA, jointB, mixture, responsibility: jointA / mixture };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `El lote usa A con probabilidad ${fmt(d.pi)}. ¿Cuánto vale P(x = ${d.x}) en la mezcla? Escribe tres decimales.`,
        `El lote usa A con probabilidad ${fmt(d.pi)}. ¿Qué probabilidad hay de elegir A y obtener x = ${d.x}? Escribe tres decimales.`,
        `Observas x = ${d.x}; la proporción inicial de A es ${fmt(d.pi)}. ¿Cuál es la responsabilidad de A? Escribe tres decimales o una fracción.`,
      ][round],
      [
        'P(x)=\\pi P_A(x)+(1-\\pi)P_B(x)',
        'P(A,x)=\\pi P_A(x)',
        'r_A=\\frac{\\pi P_A(x)}{\\pi P_A(x)+(1-\\pi)P_B(x)}',
      ][round],
    );
    api.hints(
      [
        [
          'Multiplica cada barra por la proporción de su máquina.',
          'Suma los dos aportes; la proporción de B es 1 − π.',
        ],
        [
          'Elegir A y sacar el valor requiere dos pasos.',
          'Multiplica π por la barra ámbar del valor pedido.',
        ],
        [
          'Calcula el aporte de A y el de B para el valor observado.',
          'Divide el aporte de A por la suma de ambos aportes.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseProb(val);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.00051;
    const target = [d.mixture, d.jointA, d.responsibility][round];
    if (near(target))
      return api.result(
        true,
        [
          `La mezcla suma los aportes: $${tnum(d.jointA, 4)}+${tnum(d.jointB, 4)}=${tnum(d.mixture, 4)}$.`,
          `Elegir A y sacar el valor tiene probabilidad $${tnum(d.pi)}\\cdot${tnum(d.a[d.x])}=${tnum(d.jointA, 4)}$.`,
          `La responsabilidad es $${tnum(d.jointA, 4)}/${tnum(d.mixture, 4)}\\approx${tnum(d.responsibility, 3)}$.`,
        ][round],
      );
    if (near(d.a[d.x]))
      return api.result(
        false,
        'Esa es la barra de A. Falta considerar la proporción de A en el lote.',
      );
    if (round === 0 && near((d.a[d.x] + d.b[d.x]) / 2))
      return api.result(
        false,
        'Promediaste mitad y mitad. Este lote tiene otra proporción: usa π y 1 − π.',
      );
    if (round === 0 && near(d.jointA))
      return api.result(false, 'Contaste solo el aporte de A. Suma también el de B.');
    if (round === 1 && near(d.responsibility))
      return api.result(
        false,
        'Calculaste la responsabilidad después de observar el valor. Aquí se pide la probabilidad conjunta: π por la barra de A.',
      );
    if (round === 2 && near(d.pi))
      return api.result(
        false,
        'Esa es la proporción inicial. Usa el valor observado para comparar los aportes de las dos fuentes.',
      );
    if (round === 2 && near(d.jointA))
      return api.result(
        false,
        'Ese es el aporte de A. Divídelo por el aporte total para obtener la responsabilidad.',
      );
    if (round === 2 && near(1 - d.responsibility))
      return api.result(
        false,
        'Calculaste la responsabilidad de B. El numerador pedido es el aporte de A.',
      );
    return api.result(
      false,
      [
        'Revisa los pesos: π por la barra de A, más (1 − π) por la barra de B.',
        'Multiplica la proporción de A por su probabilidad de producir el valor pedido.',
        'El denominador incluye ambas fuentes: divide π·P_A(x) por π·P_A(x) + (1 − π)·P_B(x).',
      ][round],
    );
  };
  return (
    <Stage>
      <SourceBars a={d.a} b={d.b} selected={d.x} />
      <Cap x={1250} y={200} tex={`\\pi=${tnum(d.pi)}`} color={C.amber} />
      <Cap x={1250} y={290} tex={`1-\\pi=${tnum(1 - d.pi)}`} color={C.cyan} />
      <Cap x={1250} y={380} tex={`x=${d.x}`} />
      <NumberField
        x={1080}
        y={500}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P(x) =', 'P(A, x) =', 'r_A ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c3',
  world: 'generative',
  code: '12.3',
  title: 'Dos grupos',
  subtitle: 'Mezclas y responsabilidades',
  glyph: '\\pi',
  kind: 'level',
  guide: 'joaquin',
  teaser: 'Dos máquinas alimentan la misma cinta. Las carpetas perdieron su etiqueta de origen.',
  learn: 'Calcular probabilidades de una mezcla y la responsabilidad de cada fuente dado un valor.',
  glyphs: ['gen-mixture', 'gen-responsibility'],
  pitfalls: [
    'Promediar mitad y mitad solo sirve cuando π = 0,5.',
    'P_A(x) describe una fuente; P(A | x) pregunta por el origen después de observar x.',
    'La responsabilidad divide el aporte de A por el total de las dos fuentes.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'La Fábrica, una y veinte. Una carpeta quedó atrapada entre dos rodillos, y Joaquín la soltó con el mango de una llave.',
        },
        {
          who: 'joaquin',
          text: 'Dos máquinas y una cinta. Este turno lleva la mitad de cada una.',
        },
        { who: 'iris', text: 'Y las carpetas no dicen de cuál salieron.' },
        {
          who: 'joaquin',
          text: 'Antes venían marcadas. A mí me pagan por sacar el lote a tiempo.',
        },
        { who: 'tu', text: 'Guarda las recetas de las dos; podemos comparar lo que producen.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La cinta sin etiquetas',
      Scene: ConveyorDemo,
      beats: [
        {
          say: 'Joaquín conserva las dos recetas. La cinta mezcla mitad de A y mitad de B; buscamos los registros con valor 0.',
          ask: {
            prompt: '¿Qué probabilidad tiene un registro de salir con x = 0?',
            options: ['0,275', '0,5', '0,55'],
            answer: 0,
            explain: '0,5 · 0,5 + 0,5 · 0,05 = 0,275. Sumar las barras sin sus pesos da 0,55.',
          },
          note: {
            label: 'Valor 0 en el lote',
            tex: 'P(0)=\\tfrac12\\cdot0{,}5+\\tfrac12\\cdot0{,}05=0{,}275',
            body: 'Cada fuente aporta según su proporción en el lote.',
          },
        },
        {
          say: 'Una carpeta atascada tiene valor 2. Halcón la contó como salida de A, sin guardar la etiqueta.',
          ask: {
            prompt: 'Dado x = 2, ¿qué probabilidad hay de que la carpeta venga de A?',
            options: ['1/3', '1/2', '2/3'],
            answer: 0,
            explain:
              'El aporte de A es 0,075 y el total es 0,225: 1/3. B tiene 2/3; la receta no permite asegurar el origen de una carpeta.',
          },
          note: {
            label: 'Origen incierto',
            tex: 'P(A\\mid x=2)=\\frac{0{,}5\\cdot0{,}15}{0{,}5\\cdot0{,}15+0{,}5\\cdot0{,}3}=\\tfrac13',
            body: 'Un valor compatible con ambas máquinas no demuestra de cuál salió.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar los lotes mezclados', Comp: MixturePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín abrió el cajón del tablero. Debajo de un rollo de etiquetas vacío había una hoja con el sello de Halcón.',
        },
        { who: 'joaquin', text: 'Aquí pidieron sacar las marcas. Mi firma está abajo.' },
        { who: 'iris', text: 'Y después el informe les puso un origen seguro.' },
        {
          who: 'joaquin',
          text: 'Además, cada carpeta trae registros de varios días. La máquina sigue escribiendo mientras uno duerme.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-mixture',
    world: 'generative',
    tex: 'P(x)=\\pi P_A(x)+(1-\\pi)P_B(x)',
    name: 'Mezcla de dos fuentes',
    read: 'pe de equis, pi por pe sub a más uno menos pi por pe sub be',
    meaning: 'Distribución que primero elige una fuente y luego genera un valor con su receta.',
    warn: 'π es la proporción de A; B tiene proporción 1 − π.',
  },
  {
    id: 'gen-responsibility',
    world: 'generative',
    tex: 'r_A=\\frac{\\pi P_A(x)}{P(x)}',
    name: 'Responsabilidad',
    read: 'erre sub a, aporte de a sobre pe de equis',
    meaning: 'Probabilidad de que un registro provenga de A, dado su valor observado.',
    warn: 'No identifica con certeza el origen del registro.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Mezcla',
      tex: 'P(x)=\\pi P_A(x)+(1-\\pi)P_B(x)',
      body: '0 ≤ π ≤ 1; ambas fuentes son distribuciones sobre los mismos valores.',
    },
    {
      label: 'Responsabilidad de A',
      tex: 'r_A=P(A\\mid x)=\\frac{\\pi P_A(x)}{P(x)}',
      body: 'Se define para un valor observado con P(x) > 0.',
    },
  ],
  props: [
    { label: 'Probabilidad conjunta', tex: 'P(A,x)=\\pi P_A(x),\\quad P(B,x)=(1-\\pi)P_B(x)' },
    {
      label: 'Responsabilidades complementarias',
      tex: 'r_B=\\frac{(1-\\pi)P_B(x)}{P(x)},\\quad r_A+r_B=1',
    },
    {
      label: 'Generar un registro',
      tex: 'G\\sim\\operatorname{Bernoulli}(\\pi),\\quad x\\sim P_A\\text{ si }G=1;\\quad x\\sim P_B\\text{ si }G=0',
      body: 'Primero se sortea la fuente; luego se sortea el valor usando su distribución.',
    },
  ],
};

export { lesson };
