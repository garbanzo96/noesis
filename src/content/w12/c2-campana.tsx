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
import { Cap, NumberLine, lineMap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, mean, normalPdf, tnum, varMle } from './kit';

// Caso 12.2 · Ajuste normal por máxima verosimilitud: el divisor es n.
const DATA = [4, 6, 5, 7, 8];
const MU = mean(DATA);
const VAR = varMle(DATA);
const SD = Math.sqrt(VAR);
const X = lineMap(0, 12, 170, 950);
const SLIDER = { x0: 1080, x1: 1420, y: 640 };

/** Curva de densidad, con altura en una escala fija; los puntos son datos, no áreas. */
function Bell({ mu, sd, generated }: { mu: number; sd: number; generated?: number }) {
  const path = Array.from({ length: 241 }, (_, i) => {
    const x = i / 20;
    return `${i === 0 ? 'M' : 'L'}${X(x)},${560 - 550 * normalPdf(x, mu, sd)}`;
  }).join(' ');
  return (
    <g>
      <path d={path} fill="none" stroke={C.amber} strokeWidth={4} />
      <NumberLine X={X} y={560} lo={0} hi={12} step={2} />
      {DATA.map((x, i) => (
        <g key={i}>
          <circle cx={X(x)} cy={630} r={10} fill={C.cyan} />
          <Cap x={X(x)} y={668} size={20} color={C.cyan}>
            {x}
          </Cap>
        </g>
      ))}
      {generated !== undefined && (
        <>
          <line
            x1={X(generated)}
            x2={X(generated)}
            y1={260}
            y2={560}
            stroke={C.green}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <circle cx={X(generated)} cy={560} r={9} fill={C.green} />
          <Cap x={X(generated)} y={225} size={22} color={C.green}>
            Nuevo: {fmt(generated)}
          </Cap>
        </>
      )}
      <Cap x={560} y={740} size={19} color={C.muted}>
        Celeste: lote observado. Ámbar: densidad normal.
      </Cap>
    </g>
  );
}

function BellLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [mu, setMu] = useState(3);
  const [sd, setSd] = useState(2.8);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    const t = clamp((px - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0), 0, 1);
    if (beat === 1) {
      const v = Math.round((2 + 8 * t) * 10) / 10;
      setMu(v);
      if (v === MU) unlock();
    } else if (beat === 2) {
      const v = Math.round((0.5 + 2.5 * t) * 100) / 100;
      setSd(v);
      if (Math.abs(v - SD) <= 0.025) unlock();
    }
  });
  const shownMu = beat === 1 ? mu : beat === 0 ? 3 : MU;
  const shownSd = beat === 2 ? sd : beat < 2 ? 2.8 : SD;
  const reveal = beat === 3 && answer !== null;
  const value = beat === 1 ? mu : sd;
  const fraction = beat === 1 ? (mu - 2) / 8 : (sd - 0.5) / 2.5;
  return (
    <Stage ref={svg}>
      <Bell mu={shownMu} sd={shownSd} generated={reveal ? MU + SD : undefined} />
      <Cap x={1250} y={210} tex="\bar x=\tfrac{4+6+5+7+8}{5}=6" size={23} />
      {beat >= 1 && <Cap x={1250} y={300} tex={`\\mu=${tnum(shownMu)}`} color={C.amber} />}
      {beat >= 2 && <Cap x={1250} y={390} tex="\hat\sigma^2=\tfrac{4+0+1+1+4}{5}=2" size={22} />}
      {beat === 2 && (
        <Cap
          x={1250}
          y={480}
          tex={`\\sigma=${tnum(sd)}\\quad(\\text{meta }\\sqrt2)`}
          size={22}
          color={C.amber}
        />
      )}
      {beat >= 3 && <Cap x={1250} y={480} tex="\sigma=\sqrt2\approx1{,}41" color={C.amber} />}
      {reveal && (
        <Cap x={1250} y={570} tex="x=6+\sqrt2\cdot1\approx7{,}41" size={23} color={C.green} />
      )}
      {beat === 4 && <Cap x={1250} y={570} tex="z\sim\mathcal N(0,1)" color={C.green} />}
      {(beat === 1 || beat === 2) && (
        <>
          <line
            x1={SLIDER.x0}
            x2={SLIDER.x1}
            y1={SLIDER.y}
            y2={SLIDER.y}
            stroke={C.line}
            strokeWidth={4}
          />
          <Knob
            x={SLIDER.x0 + fraction * (SLIDER.x1 - SLIDER.x0)}
            y={SLIDER.y}
            axis="x"
            onPointerDown={drag}
            color={C.amber}
            label={beat === 1 ? 'μ' : 'σ'}
          />
          <Cap x={1250} y={720} size={20} color={C.muted}>
            {beat === 1 ? 'Centro' : 'Ancho'}: {fmt(value)}
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Ajustar una campana',
  Scene: BellLesson,
  beats: [
    {
      say: 'El lote trae 4, 6, 5, 7 y 8. Su **media** es 6: sumas los cinco registros y divides por cinco.',
      board: { label: 'Centro del lote', tex: '\\hat\\mu=\\bar x=\\tfrac{4+6+5+7+8}{5}=6' },
    },
    {
      say: 'La **normal** tiene un centro μ y un ancho σ. Mueve el centro al promedio del lote; después ajustaremos el ancho.',
      gate: 'Arrastra μ hasta 6.',
      board: { label: 'Centro de la normal', tex: '\\hat\\mu=\\bar x' },
    },
    {
      say: 'Las distancias al centro, al cuadrado, suman 10. La **varianza del ajuste** divide por n: 10/5 = 2; ajusta σ a √2 ≈ 1,41.',
      gate: 'Arrastra σ hasta aproximadamente 1,41.',
      board: {
        label: 'Ancho del ajuste',
        tex: '\\hat\\sigma^2=\\frac1n\\sum_{i=1}^n(x_i-\\bar x)^2=2,\\quad\\hat\\sigma=\\sqrt2',
      },
    },
    {
      say: 'La máquina toma un sorteo z de una normal estándar y lo transforma con x = μ + σz. Este sorteo dio z = 1.',
      ask: {
        prompt: 'Con μ = 6 y σ = √2, ¿qué valor genera z = 1?',
        options: ['≈ 7,41', '8', '≈ 1,41'],
        answer: 0,
        explain: '6 + √2 · 1 ≈ 7,41. El ancho es √2; usar 2 confunde varianza con desviación.',
      },
      board: { label: 'Transformar el sorteo', tex: 'x=\\mu+\\sigma z' },
    },
    {
      say: 'La **normal estándar** tiene centro 0 y desviación 1. Al escalarla y desplazarla, la máquina genera nuevos registros; un lote corto puede tener otro promedio.',
      board: {
        label: 'Receta normal',
        tex: 'z\\sim\\mathcal N(0,1)\\quad\\Rightarrow\\quad x=\\mu+\\sigma z\\sim\\mathcal N(\\mu,\\sigma^2)',
      },
    },
  ],
};

function ShiftDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Bell mu={MU} sd={SD} generated={beat === 1 && answer !== null ? MU - SD : undefined} />
      <Cap x={1250} y={220} size={23}>
        μ = 6
      </Cap>
      <Cap x={1250} y={310} size={23}>
        {beat === 0 ? 'Suma de cuadrados: 10' : 'σ = √2'}
      </Cap>
      <Cap x={1250} y={400} size={23}>
        {beat === 0 ? '5 registros en el lote' : 'Sorteo guardado: z = −1'}
      </Cap>
      {answer !== null && (
        <Cap
          x={1250}
          y={510}
          size={23}
          color={C.green}
          tex={beat === 0 ? '\\hat\\sigma^2=10/5=2' : 'x=6-\\sqrt2\\approx4{,}59'}
        />
      )}
    </Stage>
  );
}

/** Carpetas de entrada: sin centro, curva ajustada ni resultados calculados. */
function Lot({ xs }: { xs: number[] }) {
  return (
    <g>
      <rect
        x={170}
        y={380}
        width={780}
        height={170}
        rx={18}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      {xs.map((x, i) => (
        <g key={i}>
          <rect
            x={205 + 145 * i}
            y={310}
            width={110}
            height={160}
            rx={8}
            fill={C.bg}
            stroke={C.cyan}
            strokeWidth={2}
          />
          <Cap x={260 + 145 * i} y={390} size={32} color={C.cyan}>
            {fmt(x)}
          </Cap>
        </g>
      ))}
      <Cap x={560} y={625} size={22} color={C.muted}>
        Lote de entrada · {xs.length} registros
      </Cap>
    </g>
  );
}

function BellPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 173 + round);
    const center = randInt(r, 4, 9);
    const spread = pick(r, [1, 2, 3]);
    const xs = shuffle(
      r,
      [-2, -1, 0, 1, 2].map((x) => center + spread * x),
    );
    const mu = mean(xs);
    const variance = varMle(xs);
    const sigma = pick(r, [0.5, 1.5, 2, 2.5]);
    const z = pick(r, [-2, -1, -0.5, 0.5, 1, 2]);
    return { xs, mu, variance, sigma, z, generated: mu + sigma * z };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const list = d.xs.map((x) => fmt(x)).join('; ');
    api.prompt(
      [
        `Lote: ${list}. ¿Cuál es su media?`,
        `Lote: ${list}. Su media es ${fmt(d.mu)}. ¿Cuál es la varianza del ajuste normal? Divide por n.`,
        `La máquina tiene μ = ${fmt(d.mu)}, σ = ${fmt(d.sigma)} y el sorteo z = ${fmt(d.z)}. ¿Qué valor genera?`,
      ][round],
      [
        '\\hat\\mu=\\frac1n\\sum x_i',
        '\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2',
        'x=\\mu+\\sigma z',
      ][round],
    );
    api.hints(
      [
        ['Suma los cinco registros.', 'Divide la suma por el número de registros.'],
        [
          'Resta la media a cada registro y eleva cada distancia al cuadrado.',
          'Suma esos cuadrados y divide por cinco. Aquí el divisor es n.',
        ],
        ['Multiplica σ por z, conservando el signo de z.', 'Suma μ al desplazamiento σz.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null || !Number.isFinite(v)) return;
    const target = [d.mu, d.variance, d.generated][round];
    const near = (x: number) => Math.abs(v - x) <= 0.0051;
    if (near(target))
      return api.result(
        true,
        [
          `La suma es ${d.mu * d.xs.length}; $\\hat\\mu=${d.mu * d.xs.length}/5=${tnum(d.mu)}$.`,
          `Los cuadrados suman ${d.variance * 5}; $\\hat\\sigma^2=${d.variance * 5}/5=${tnum(d.variance)}$.`,
          `$x=${tnum(d.mu)}+${tnum(d.sigma)}\\cdot(${tnum(d.z)})=${tnum(d.generated)}$.`,
        ][round],
      );
    if (round === 0 && near(d.mu * 5))
      return api.result(false, 'Esa es la suma del lote. Falta dividir por sus cinco registros.');
    if (round === 1 && near((d.variance * 5) / 4))
      return api.result(
        false,
        'Dividiste por n − 1. Ese divisor se usa en la varianza muestral corregida; este ajuste usa n = 5.',
      );
    if (round === 1 && near(Math.sqrt(d.variance)))
      return api.result(
        false,
        'Calculaste la desviación σ. Se pide la varianza σ²: deja la suma de cuadrados dividida por n, sin sacar raíz.',
      );
    if (round === 1 && near(d.variance * 5))
      return api.result(false, 'Esa es la suma de cuadrados. Falta dividir por cinco.');
    if (round === 1 && near(0))
      return api.result(
        false,
        'Las distancias con signo se cancelan. Eleva cada distancia al cuadrado antes de sumarlas.',
      );
    if (round === 2 && near(d.sigma * d.z))
      return api.result(false, 'Ese es el desplazamiento σz. Falta sumar el centro μ.');
    if (round === 2 && d.z < 0 && near(d.mu + d.sigma * Math.abs(d.z)))
      return api.result(
        false,
        'El sorteo es negativo: el registro debe quedar a la izquierda de μ. Conserva el signo de z.',
      );
    if (round === 2 && near(d.mu + d.sigma ** 2 * d.z))
      return api.result(
        false,
        'Usaste σ² para escalar. La receta multiplica z por la desviación σ.',
      );
    return api.result(
      false,
      [
        'Suma todos los registros y divide por cinco.',
        `Usa distancias a ${fmt(d.mu)}, al cuadrado. Suma y divide por cinco.`,
        `Calcula ${fmt(d.sigma)} por (${fmt(d.z)}) y luego suma ${fmt(d.mu)}.`,
      ][round],
    );
  };
  return (
    <Stage>
      {round < 2 ? (
        <Lot xs={d.xs} />
      ) : (
        <>
          <rect
            x={200}
            y={300}
            width={720}
            height={250}
            rx={20}
            fill={C.panel}
            stroke={C.amber}
            strokeWidth={3}
          />
          <Cap x={560} y={375} tex="x=\mu+\sigma z" size={40} color={C.amber} />
          <Cap x={560} y={465} size={24}>
            Receta del turno · salida pendiente
          </Cap>
        </>
      )}
      <Cap x={1250} y={210} size={23}>
        {round === 2 ? `μ = ${fmt(d.mu)}` : 'n = 5'}
      </Cap>
      {round >= 1 && (
        <Cap x={1250} y={300} size={23}>
          {round === 1 ? `Media dada: ${fmt(d.mu)}` : `σ = ${fmt(d.sigma)}`}
        </Cap>
      )}
      {round === 2 && (
        <Cap x={1250} y={390} size={23}>
          z = {fmt(d.z)}
        </Cap>
      )}
      <NumberField
        x={1080}
        y={490}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['media =', 'varianza =', 'x ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c2',
  world: 'generative',
  code: '12.2',
  title: 'La campana',
  subtitle: 'Ajustar una normal y generar',
  glyph: '\\mathcal N(\\mu,\\sigma^2)',
  kind: 'level',
  guide: 'joaquin',
  teaser:
    'Cinco registros entran al tablero de La Fábrica. La cinta devuelve carpetas que nadie llenó.',
  learn: 'Ajustar media y varianza de una normal a un lote y generar valores con x = μ + σz.',
  glyphs: ['gen-bell-fit', 'gen-bell-sample'],
  pitfalls: [
    'El ajuste por máxima verosimilitud divide la suma de cuadrados por n, no por n − 1.',
    'σ es la raíz de la varianza; la receta usa σ, no σ².',
    'Un registro generado puede ser nuevo y un lote pequeño puede tener otro promedio.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Barón, 00:35. Una impresora golpea cada dos segundos; Joaquín sostiene cinco carpetas fuera de la cinta.',
        },
        {
          who: 'joaquin',
          text: 'Este es el lote de entrada. El tablero lo lee y sigue imprimiendo hasta el cambio de turno.',
        },
        {
          who: 'teo',
          text: 'Cuatro, seis, cinco, siete, ocho… ¡Y la salida trae decimales nuevos! Puedo guardar el sorteo de cada carpeta.',
        },
        { who: 'iris', text: 'Guárdalo antes de que alguien cierre el tablero.' },
        { who: 'joaquin', text: 'Quedan dos minutos. La cinta descansa más que yo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El tablero del turno',
      Scene: ShiftDemo,
      beats: [
        {
          say: 'Joaquín conserva el lote 4, 6, 5, 7, 8: media 6 y suma de cuadrados 10. El tablero dice «ajuste normal por máxima verosimilitud».',
          ask: {
            prompt: '¿Qué varianza debe guardar ese ajuste?',
            options: ['2', '2,5', '≈ 1,41'],
            answer: 0,
            explain:
              'Divide por n = 5: 10/5 = 2. Dividir por n − 1 da 2,5; sacar raíz da la desviación, no la varianza.',
          },
          note: {
            label: 'Parámetros del lote',
            tex: '\\hat\\mu=6,\\quad\\hat\\sigma^2=2',
            body: 'El ajuste normal usa n en el denominador. La desviación es √2.',
          },
        },
        {
          say: 'El registro de la impresora guarda z = −1. El centro sigue en 6 y la desviación en √2.',
          ask: {
            prompt: '¿Qué valor debería traer la carpeta de salida?',
            options: ['≈ 4,59', '≈ 7,41', '4'],
            answer: 0,
            explain:
              '6 + √2 · (−1) ≈ 4,59. Un z negativo desplaza a la izquierda; usar la varianza 2 produciría 4.',
          },
          note: {
            label: 'Carpeta generada',
            tex: 'x=6+\\sqrt2\\cdot(-1)\\approx4{,}59',
            body: 'La receta genera un valor nuevo a partir del sorteo guardado; no copia una fila del lote.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar el ajuste del turno', Comp: BellPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Teo guarda el registro del sorteo. Joaquín vuelve a poner las cinco carpetas en la cinta y se limpia el tóner del pulgar.',
        },
        {
          who: 'tu',
          text: 'La carpeta de 4,59 salió de esta receta. Eso no prueba que alguien la haya medido.',
        },
        {
          who: 'joaquin',
          text: 'Para despachar piden que se vea bien. El nombre lo pone otra oficina.',
        },
        { who: 'iris', text: 'Qué oficina tan descansada.' },
        {
          who: 'nar',
          text: 'Se enciende una segunda luz ámbar. Bajo el mismo timbre, otra impresora empieza a alimentar la cinta.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-bell-fit',
    world: 'generative',
    tex: '\\hat\\mu,\\hat\\sigma^2',
    name: 'Ajuste de una normal',
    read: 'mu estimada y sigma al cuadrado estimada',
    meaning:
      'Centro y varianza que ajustan una normal al lote por máxima verosimilitud: media y promedio de distancias al cuadrado.',
    warn: 'La varianza del ajuste divide por n; la varianza muestral corregida divide por n − 1.',
  },
  {
    id: 'gen-bell-sample',
    world: 'generative',
    tex: 'x=\\mu+\\sigma z',
    name: 'Generar desde una normal',
    read: 'equis igual mu más sigma por zeta',
    meaning: 'Transforma un sorteo normal estándar en un registro con centro μ y desviación σ.',
    warn: 'Multiplica por σ, no por la varianza σ². z debe provenir de una normal estándar.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Distribución normal',
      tex: 'p(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)',
      body: 'μ es el centro; σ > 0 es la desviación estándar. La curva es una densidad, no la probabilidad de un valor puntual.',
    },
    {
      label: 'Normal estándar',
      tex: 'z\\sim\\mathcal N(0,1)',
      body: 'Tiene media cero y varianza uno.',
    },
  ],
  props: [
    { label: 'Media ajustada', tex: '\\hat\\mu=\\bar x=\\frac1n\\sum_{i=1}^n x_i' },
    {
      label: 'Varianza ajustada',
      tex: '\\hat\\sigma^2=\\frac1n\\sum_{i=1}^n(x_i-\\bar x)^2',
      body: 'Máxima verosimilitud para observaciones independientes de una misma normal, con dispersión positiva; el divisor es n.',
    },
    { label: 'Desviación ajustada', tex: '\\hat\\sigma=\\sqrt{\\hat\\sigma^2}' },
    {
      label: 'Generar un registro',
      tex: 'x=\\mu+\\sigma z\\sim\\mathcal N(\\mu,\\sigma^2)',
      body: 'Un nuevo sorteo estándar por registro. Los parámetros describen la distribución; cada lote puede fluctuar.',
    },
  ],
};

export { lesson };
