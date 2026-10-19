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
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

type Pair = [number, number];
const MU: Pair = [5, 5];
const W: Pair = [0.6, 0.8];
const OBS: Pair = [5.6, 6.2];
const Z = 1.32;
const RECON: Pair = [5.792, 6.056];
const GENERATE = 'x=\\mu+z\\,w';
const PROJECT = '\\hat z=w^\\top(x-\\mu)';
const X = (offset: number) => 550 + 125 * offset;
const Y = (offset: number) => 430 - 125 * offset;
const pairTex = (p: Pair, digits = 2) => `(${tnum(p[0], digits)};${tnum(p[1], digits)})`;

/** Ejes centrados en mu; las etiquetas de los puntos quedan en la columna de lecturas. */
function LatentPlane({
  w = W,
  mu = MU,
  observed,
  generated,
}: {
  w?: Pair;
  mu?: Pair;
  observed?: Pair;
  generated?: Pair;
}) {
  return (
    <g>
      <Cap x={550} y={95} size={23}>
        Ámbar: recta del modelo · celeste: medición
      </Cap>
      <rect x={200} y={140} width={700} height={580} rx={14} fill={C.panel} stroke={C.line} />
      <line x1={220} x2={880} y1={430} y2={430} stroke={C.line} strokeWidth={2} />
      <line x1={550} x2={550} y1={160} y2={700} stroke={C.line} strokeWidth={2} />
      {[-2, -1, 1, 2].map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={423} y2={437} stroke={C.muted} />
          <Cap x={X(t)} y={460} size={17}>
            {t}
          </Cap>
          <line x1={543} x2={557} y1={Y(t)} y2={Y(t)} stroke={C.muted} />
          <Cap x={515} y={Y(t)} size={17}>
            {t}
          </Cap>
        </g>
      ))}
      <Cap x={870} y={390} tex="x_1-\mu_1" size={19} />
      <Cap x={620} y={175} tex="x_2-\mu_2" size={19} />
      <line
        x1={X(-2.5 * w[0])}
        x2={X(2.5 * w[0])}
        y1={Y(-2.5 * w[1])}
        y2={Y(2.5 * w[1])}
        stroke={C.amber}
        strokeWidth={4}
      />
      <circle cx={550} cy={430} r={7} fill={C.text} />
      {observed && generated && (
        <line
          x1={X(observed[0] - mu[0])}
          x2={X(generated[0] - mu[0])}
          y1={Y(observed[1] - mu[1])}
          y2={Y(generated[1] - mu[1])}
          stroke={C.green}
          strokeWidth={3}
          strokeDasharray="6 6"
        />
      )}
      {observed && (
        <circle cx={X(observed[0] - mu[0])} cy={Y(observed[1] - mu[1])} r={9} fill={C.cyan} />
      )}
      {generated && (
        <circle
          cx={X(generated[0] - mu[0])}
          cy={Y(generated[1] - mu[1])}
          r={12}
          fill="none"
          stroke={C.green}
          strokeWidth={4}
        />
      )}
    </g>
  );
}

function LatentLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [z, setZ] = useState(0);
  const [visited, setVisited] = useState({ low: false, high: false });
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 1) return;
    const next = Math.round(clamp((px - 550) / 160, -2, 2) * 100) / 100;
    setZ(next);
    setVisited((v) => ({ low: v.low || next <= -1, high: v.high || next >= 1 }));
  });
  useEffect(() => {
    if (beat === 1 && visited.low && visited.high) unlock();
  }, [beat, visited, unlock]);
  const generated: Pair | undefined =
    beat === 1 ? [5 + z * W[0], 5 + z * W[1]] : beat === 4 ? RECON : undefined;
  return (
    <Stage ref={svg}>
      <LatentPlane observed={beat >= 2 ? OBS : undefined} generated={generated} />
      <Cap x={1250} y={170} tex="\mu=(5;5)" />
      <Cap x={1250} y={260} tex="w=(0{,}6;0{,}8)" color={C.amber} />
      {beat === 0 && <Cap x={1250} y={350} tex="\|w\|^2=0{,}36+0{,}64=1" size={22} />}
      {beat === 1 && (
        <>
          <Cap x={1250} y={350} tex={`z=${tnum(z)}`} />
          <Cap x={1250} y={440} tex={`x=${pairTex(generated!)}`} color={C.green} />
          <line x1={230} x2={870} y1={785} y2={785} stroke={C.line} strokeWidth={4} />
          <Knob x={550 + 160 * z} y={785} axis="x" label="z" color={C.amber} onPointerDown={drag} />
          <Cap x={230} y={845}>
            −2
          </Cap>
          <Cap x={550} y={845}>
            0
          </Cap>
          <Cap x={870} y={845}>
            2
          </Cap>
        </>
      )}
      {beat >= 2 && <Cap x={1250} y={350} tex="x=(5{,}6;6{,}2)" color={C.cyan} />}
      {beat >= 2 && <Cap x={1250} y={440} tex="x-\mu=(0{,}6;1{,}2)" />}
      {((beat === 3 && answer !== null) || beat === 4) && (
        <Cap x={1250} y={530} tex="\hat z=0{,}36+0{,}96=1{,}32" size={22} color={C.green} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={620} tex="\hat x=(5{,}792;6{,}056)" size={23} color={C.green} />
          <Cap x={550} y={785} size={22}>
            El tramo punteado es lo que la recta no reproduce.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Un rasgo mueve dos columnas',
  intro: {
    question: '¿Qué explica que dos mediciones cambien siempre juntas?',
    text: 'Una variable latente es un rasgo que no se mide pero mueve varias mediciones a la vez. Estimarla a partir de las mediciones permite reconstruir lo que el modelo supone. En cada carpeta dos columnas cambian juntas, y el tablero tiene una sola perilla.',
  },
  Scene: LatentLesson,
  beats: [
    {
      say: 'Un **rasgo latente** es un valor que no aparece como columna, pero mueve varias mediciones. Aquí z desplaza ambas desde μ = (5; 5), en la dirección w = (0,6; 0,8).',
      board: {
        label: 'Generar desde un rasgo',
        tex: GENERATE,
        body: 'w tiene longitud uno; z mide el desplazamiento sobre la recta.',
      },
    },
    {
      say: 'Arrastra z primero bajo −1 y luego sobre 1, o al revés. Mira cómo cambian juntas las dos columnas mientras el punto recorre la recta.',
      gate: 'Visita z ≤ −1 y z ≥ 1 con la perilla.',
      board: {
        label: 'Dos columnas, una perilla',
        tex: '\\p{1}{x_1}=\\p{2}{5+0{,}6z},\\quad\\p{3}{ x_2}=\\p{4}{5+0{,}8z}',
        parts: [
          'primera medición',
          'efecto en primera columna',
          'segunda medición',
          'efecto en segunda columna',
        ],
      },
    },
    {
      say: 'La medición (5,6; 6,2) queda fuera de la recta. Resta el centro antes de buscar el rasgo: el desplazamiento observado es (0,6; 1,2).',
      board: {
        label: 'Centrar la medición',
        tex: '\\p{1}{x-\\mu}=\\p{2}{(0{,}6;1{,}2)}',
        parts: ['desplazamiento observado', 'medición sin el centro'],
      },
    },
    {
      say: 'Para una dirección de longitud uno, proyecta el desplazamiento sobre w. Multiplica las coordenadas correspondientes y suma.',
      ask: {
        prompt: '¿Qué rasgo estimas para x = (5,6; 6,2)?',
        options: ['1,32', '8,32', '0,36'],
        answer: 0,
        explain:
          '0,6 · 0,6 + 0,8 · 1,2 = 0,36 + 0,96 = 1,32. Usar x sin restar μ daría 8,32; usar solo la primera columna daría 0,36.',
      },
      board: { label: 'Estimar el rasgo', tex: PROJECT },
    },
    {
      say: 'Vuelve a generar con z = 1,32: obtienes (5,792; 6,056). Esta **reconstrucción** es el punto más cercano en la recta; pierde la parte de la medición que queda fuera de ella.',
      board: {
        label: 'Reconstruir',
        tex: '\\p{1}{\\hat x}=\\p{2}{\\mu+\\hat z\\,w}=\\p{3}{(5{,}792;6{,}056)}',
        body: 'Un solo rasgo resume dos mediciones, pero no reproduce cualquier par exacto.',
        parts: ['medición reconstruida', 'centro más rasgo estimado', 'punto más cercano'],
      },
    },
  ],
};

function LatentDemo({ beats, answer }: DemoProps) {
  const reconstruction = beats.beat === 1 && answer !== null;
  return (
    <Stage>
      <LatentPlane observed={OBS} generated={reconstruction ? RECON : undefined} />
      <Cap x={1250} y={170} tex="\mu=(5;5)" />
      <Cap x={1250} y={260} tex="w=(0{,}6;0{,}8)" color={C.amber} />
      <Cap x={1250} y={350} tex="x=(5{,}6;6{,}2)" color={C.cyan} />
      {((beats.beat === 0 && answer !== null) || beats.beat === 1) && (
        <Cap x={1250} y={440} tex="\hat z=1{,}32" color={C.green} />
      )}
      {reconstruction && (
        <Cap x={1250} y={530} tex="\hat x=(5{,}792;6{,}056)" size={23} color={C.green} />
      )}
      <Cap x={550} y={785} size={22}>
        Carpeta retenida · dos columnas del mismo registro
      </Cap>
    </Stage>
  );
}

function LatentPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 211 + round);
    const mu: Pair = [randInt(r, 3, 7), randInt(r, 3, 7)];
    const w: Pair = pick(r, [
      [0.6, 0.8],
      [0.8, 0.6],
    ] as Pair[]);
    // Desplazamientos independientes: la medición no tiene que estar sobre la recta.
    const delta: Pair = [pick(r, [-1.2, -0.6, 0.6, 1.2]), pick(r, [-1.2, -0.6, 0.6, 1.2])];
    const observed: Pair = [mu[0] + delta[0], mu[1] + delta[1]];
    const estimate = w[0] * delta[0] + w[1] * delta[1];
    const z = pick(r, [-1.5, -0.5, 0.5, 1.5]);
    const component = round === 1 ? 0 : 1;
    const latent = round === 1 ? z : estimate;
    const target = round === 0 ? estimate : mu[component] + latent * w[component];
    return { mu, w, delta, observed, estimate, z, component, latent, target };
  }, [seed, round]);
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    api.prompt(
      [
        'Estima z para la medición celeste. Escribe tres decimales.',
        'Genera la primera columna x₁ con el z indicado. Escribe tres decimales.',
        'Reconstruye la segunda columna usando el rasgo estimado de la medición. Escribe tres decimales.',
      ][round],
      round === 0 ? PROJECT : round === 1 ? GENERATE : '\\hat x_2=\\mu_2+\\hat z\\,w_2',
    );
    api.hints(
      [
        [
          'Resta μ a cada coordenada de x.',
          'Multiplica cada desplazamiento por su componente de w y suma.',
        ],
        ['Usa la primera componente de μ y de w.', 'Multiplica z por w₁ y luego suma μ₁.'],
        [
          'Calcula primero z con las dos columnas centradas.',
          'Usa ese z en μ₂ + z·w₂; la reconstrucción puede diferir de la medición.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.00051;
    if (near(d.target))
      return api.result(
        true,
        round === 0
          ? `$\\hat z=${tnum(d.w[0])}\\cdot(${tnum(d.delta[0])})+${tnum(d.w[1])}\\cdot(${tnum(d.delta[1])})=${tnum(d.target, 3)}$. Usaste ambas columnas centradas.`
          : `$${round === 1 ? 'x_1' : '\\hat x_2'}=${tnum(d.mu[d.component])}+(${tnum(d.latent, 3)})\\cdot${tnum(d.w[d.component])}=${tnum(d.target, 3)}$. ${round === 1 ? 'El rasgo mueve la primera columna desde su centro.' : 'La reconstrucción usa el rasgo calculado desde ambas columnas.'}`,
      );
    if (round === 0) {
      if (near(d.w[0] * d.observed[0] + d.w[1] * d.observed[1]))
        return api.result(false, 'Proyectaste x sin centrar. Resta μ antes de multiplicar por w.');
      if (near(d.w[0] * d.delta[0]) || near(d.w[1] * d.delta[1]))
        return api.result(false, 'Usaste solo una columna. El rasgo suma los dos aportes.');
      if (near(d.delta[0] + d.delta[1]))
        return api.result(
          false,
          'Sumaste los desplazamientos sin sus pesos. Multiplica cada uno por su componente de w.',
        );
    } else {
      if (near(d.latent * d.w[d.component]))
        return api.result(
          false,
          'Calculaste el desplazamiento. Falta sumar el centro μ de la columna pedida.',
        );
      if (near(d.mu[d.component] + d.latent * d.w[1 - d.component]))
        return api.result(false, 'Usaste el peso de la otra columna. Revisa el subíndice de w.');
      if (round === 2 && near(d.observed[1]))
        return api.result(
          false,
          'Copiaste la medición. Reconstruye con el rasgo proyectado; el punto puede quedar fuera de la recta.',
        );
      if (round === 2 && near(d.estimate))
        return api.result(
          false,
          'Ese es el rasgo z. Falta convertirlo en la segunda medición: μ₂ + z·w₂.',
        );
    }
    return api.result(
      false,
      round === 0
        ? 'Revisa el centrado y el producto: w₁·(x₁ − μ₁) + w₂·(x₂ − μ₂).'
        : round === 1
          ? 'Revisa x₁ = μ₁ + z·w₁, con el signo de z.'
          : 'Estima z con ambas columnas y luego calcula μ₂ + z·w₂.',
    );
  };
  return (
    <Stage>
      <LatentPlane mu={d.mu} w={d.w} observed={round === 1 ? undefined : d.observed} />
      <Cap x={1250} y={170} tex={`\\mu=${pairTex(d.mu)}`} />
      <Cap x={1250} y={260} tex={`w=${pairTex(d.w)}`} color={C.amber} />
      <Cap
        x={1250}
        y={350}
        tex={round === 1 ? `z=${tnum(d.z)}` : `x=${pairTex(d.observed)}`}
        color={C.cyan}
      />
      <Cap x={1250} y={440} tex="\|w\|=1" size={22} />
      <NumberField
        x={1080}
        y={550}
        value={value}
        onChange={setValue}
        onEnter={submit}
        label={['z =', 'x₁ =', 'x̂₂ ='][round]}
        width={5}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c5',
  world: 'generative',
  code: '12.5',
  title: 'Rasgos ocultos',
  subtitle: 'Variables latentes',
  glyph: 'z',
  kind: 'level',
  guide: 'joaquin',
  teaser: 'Dos columnas cambian juntas en cada carpeta; el tablero tiene una sola perilla.',
  learn:
    'Generar dos mediciones desde un rasgo latente, estimarlo por proyección y reconstruir el registro.',
  glyphs: ['gen-latent-line', 'gen-latent-projection'],
  pitfalls: [
    'Resta μ antes de proyectar la medición.',
    'El producto usa las dos columnas con sus respectivos pesos.',
    'La fórmula z = wᵀ(x − μ) requiere que w tenga longitud uno.',
    'La reconstrucción puede diferir de la medición observada.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'La caldera soltó vapor junto al tablero. Joaquín apoyó una carpeta sobre el botón de parada, y la cinta siguió avanzando.',
        },
        {
          who: 'joaquin',
          text: 'Dos columnas por carpeta. El jefe dice que cada una se ajusta sola.',
        },
        { who: 'iris', text: 'Pero hay una sola perilla.' },
        {
          who: 'joaquin',
          text: 'Y mueve las dos. No tengo el turno entero para discutirle al jefe.',
        },
        { who: 'tu', text: 'Retén esa carpeta; comparemos sus columnas con la receta.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La perilla sin etiqueta',
      Scene: LatentDemo,
      beats: [
        {
          say: 'Joaquín retuvo la carpeta (5,6; 6,2). La receta usa μ = (5; 5) y w = (0,6; 0,8), de longitud uno.',
          ask: {
            prompt: '¿Qué z estimas desde las dos columnas?',
            options: ['0,36', '1,32', '8,32'],
            answer: 1,
            explain: 'Centra el registro y suma los productos: 0,6 · 0,6 + 0,8 · 1,2 = 1,32.',
          },
          note: {
            label: 'Rasgo de la carpeta',
            tex: '\\hat z=0{,}6\\cdot0{,}6+0{,}8\\cdot1{,}2=1{,}32',
            body: 'Las dos columnas aportan al mismo rasgo oculto.',
          },
        },
        {
          say: 'Carga z = 1,32 en la receta. Joaquín quiere saber qué par debería imprimir la máquina con ese ajuste.',
          ask: {
            prompt: '¿Qué reconstrucción entrega μ + 1,32w?',
            options: ['(5,6; 6,2)', '(0,792; 1,056)', '(5,792; 6,056)'],
            answer: 2,
            explain:
              '5 + 1,32 · 0,6 = 5,792 y 5 + 1,32 · 0,8 = 6,056. El par original queda fuera de la recta.',
          },
          note: {
            label: 'Salida reconstruida',
            tex: '\\hat x=(5+0{,}792;5+1{,}056)=(5{,}792;6{,}056)',
            body: 'La receta liga las columnas; con un solo rasgo no puede reproducir cualquier par.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Revisar la perilla de cada lote',
      Comp: LatentPractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín levantó la tapa del tablero. Bajo la perilla había una etiqueta vieja, pegada sobre los nombres de las dos columnas.',
        },
        {
          who: 'joaquin',
          text: 'Un ajuste para las dos. Los lotes salen así desde antes de mi turno.',
        },
        { who: 'iris', text: 'En el informe las contaron como dos controles independientes.' },
        { who: 'joaquin', text: 'Yo nunca vi ese informe.' },
        {
          who: 'nar',
          text: 'La etiqueta se despegó con el calor. Debajo estaba el sello de Halcón.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-latent-line',
    world: 'generative',
    tex: GENERATE,
    name: 'Modelo con un rasgo latente',
    read: 'equis igual a mu más zeta por doble ve',
    meaning: 'Un valor oculto z mueve varias mediciones desde el centro μ en la dirección w.',
    warn: 'Con un solo rasgo, las salidas quedan en una recta.',
  },
  {
    id: 'gen-latent-projection',
    world: 'generative',
    tex: PROJECT,
    name: 'Proyección al rasgo',
    read: 'zeta estimado igual a doble ve transpuesta por equis menos mu',
    meaning: 'Producto de la dirección con las mediciones centradas para estimar el rasgo.',
    warn: 'Esta forma requiere longitud uno; para otra longitud divide por wᵀw.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Modelo lineal de un rasgo',
      tex: GENERATE,
      body: 'μ y w son vectores de mediciones; z es un escalar latente. Sortear z y aplicar la receta permite generar registros nuevos.',
    },
    {
      label: 'Reconstrucción',
      tex: '\\hat x=\\mu+\\hat z\\,w',
      body: 'Salida del modelo con el rasgo estimado desde una medición.',
    },
  ],
  props: [
    {
      label: 'Dirección unitaria',
      tex: 'w^\\top w=1\\quad\\Rightarrow\\quad\\hat z=w^\\top(x-\\mu)',
      body: 'El rasgo minimiza la distancia cuadrática entre x y μ + zw.',
    },
    {
      label: 'Dirección de cualquier longitud',
      tex: '\\hat z=\\frac{w^\\top(x-\\mu)}{w^\\top w},\\quad w\\ne0',
      body: 'Si w no tiene longitud uno, la proyección requiere este denominador.',
    },
    {
      label: 'Parte no reconstruida',
      tex: 'w^\\top(x-\\hat x)=0',
      body: 'El residuo es perpendicular a la recta. Reconstruir no garantiza recuperar la medición exacta.',
    },
  ],
};

export { lesson };
