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
import { Confirm, Knob, NumberField, parseNum, thousands } from '../shared/ui';
import { fmt, tnum } from './kit';

// CASO 11.2 · Monte Carlo. Seed 21: exactamente 79 de los primeros 100 puntos dentro.
// Todos los tamaños usan prefijos de la misma muestra uniforme e independiente.
const SIZES = [10, 100, 1000, 10000];
const BOX = { x: 250, y: 160, side: 490 };
const SLIDER = { x0: 300, x1: 810, y: 770 };
const POINTS = (() => {
  const r = rng(21);
  return Array.from({ length: 10000 }, () => {
    const x = r(),
      y = r();
    return { x, y, inside: x * x + y * y <= 1 };
  });
})();

/** Two paths keep the 10 000-point view light; every point is still represented. */
function Quarter({ n = 0 }: { n?: number }) {
  const paths = useMemo(() => {
    const inside: string[] = [],
      outside: string[] = [];
    for (const p of POINTS.slice(0, n)) {
      const x = BOX.x + p.x * BOX.side;
      const y = BOX.y + (1 - p.y) * BOX.side;
      (p.inside ? inside : outside).push(`M${x.toFixed(2)} ${y.toFixed(2)}h0.01`);
    }
    return [inside.join(' '), outside.join(' ')];
  }, [n]);
  const bottom = BOX.y + BOX.side;
  return (
    <g>
      <rect
        x={BOX.x}
        y={BOX.y}
        width={BOX.side}
        height={BOX.side}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <path
        d={`M${BOX.x} ${bottom}L${BOX.x + BOX.side} ${bottom}A${BOX.side} ${BOX.side} 0 0 0 ${BOX.x} ${BOX.y}Z`}
        fill={C.violet}
        fillOpacity={0.14}
        stroke={C.violet}
        strokeWidth={2}
      />
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={i === 0 ? C.violet : C.amber}
          strokeWidth={n >= 1000 ? 2 : 5}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <Cap x={BOX.x - 25} y={bottom + 25} size={20}>
        0
      </Cap>
      <Cap x={BOX.x + BOX.side} y={bottom + 30} size={20}>
        1
      </Cap>
      <Cap x={BOX.x - 30} y={BOX.y} size={20}>
        1
      </Cap>
      <Cap x={495} y={100} size={23} tex="x^2+y^2\le1" color={C.violet} />
      <Cap x={495} y={738} size={19} color={C.muted}>
        Lila: dentro del cuarto de círculo. Ámbar: fuera.
      </Cap>
    </g>
  );
}

function MonteCarloLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState(0);
  const { beat } = beats;
  const n = beat === 0 ? 0 : beat === 1 ? SIZES[index] : 100;
  const inside = POINTS.slice(0, n).filter((p) => p.inside).length;
  const drag = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0), 0, 1) * 3);
    setIndex(next);
    if (next === 3) unlock();
  });
  return (
    <Stage ref={svg}>
      <Quarter n={n} />
      {beat === 0 && (
        <>
          <Cap x={1250} y={230} tex="A_{\square}=1" />
          <Cap x={1250} y={330} tex="A_{\text{cuarto}}=\pi/4" color={C.violet} />
          <Cap x={1250} y={430} tex="\pi/4\approx0{,}785" color={C.muted} />
        </>
      )}
      {(beat === 1 || beat === 2) && (
        <>
          <Cap x={1250} y={230} size={24}>{`${thousands(n)} puntos en total`}</Cap>
          <Cap x={1250} y={330} size={24} color={C.violet}>{`${thousands(inside)} dentro`}</Cap>
        </>
      )}
      {beat === 1 && (
        <>
          <Cap x={1250} y={430} tex={`k/n=${tnum(inside / n, 3)}`} color={C.violet} />
          <line
            x1={SLIDER.x0}
            x2={SLIDER.x1}
            y1={SLIDER.y}
            y2={SLIDER.y}
            stroke={C.line}
            strokeWidth={4}
          />
          {SIZES.map((size, i) => (
            <g key={size}>
              <line
                x1={SLIDER.x0 + i * 170}
                x2={SLIDER.x0 + i * 170}
                y1={760}
                y2={780}
                stroke={C.line}
              />
              <Cap x={SLIDER.x0 + i * 170} y={825} size={19}>
                {thousands(size)}
              </Cap>
            </g>
          ))}
          <Knob
            x={SLIDER.x0 + index * 170}
            y={SLIDER.y}
            axis="x"
            label="n"
            color={C.violet}
            onPointerDown={drag}
          />
        </>
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1250} y={430} tex="\widehat\pi=4\cdot0{,}79=3{,}16" color={C.green} />
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={230} tex="\text{escala}=1/\sqrt n" />
          <Cap x={1250} y={330} tex="n=100:\quad0{,}1" color={C.amber} />
          <Cap x={1250} y={430} tex="n=10\,000:\quad0{,}01" color={C.green} />
          <Cap x={1250} y={530} size={19} color={C.muted}>
            100 veces más puntos: escala ÷10.
          </Cap>
        </>
      )}
      {beat === 4 && (
        <>
          <Cap
            x={1250}
            y={230}
            tex="f(x_i)=\begin{cases}1&\text{dentro}\\0&\text{fuera}\end{cases}"
            size={23}
          />
          <Cap x={1250} y={350} tex="\overline f=k/n" color={C.violet} />
          <Cap x={1250} y={450} tex="E[f]\approx\frac1n\sum_{i=1}^n f(x_i)" size={23} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Tiradas al azar',
  Scene: MonteCarloLesson,
  beats: [
    {
      say: 'El cuadrado tiene área 1 y el cuarto de círculo, π/4. Si tiras puntos uniformemente en el cuadrado, cerca del 78,5 % cae dentro.',
      board: {
        label: 'Una proporción de áreas',
        tex: '\\p{1}{P(\\text{dentro})}=\\p{2}{\\pi/4}\\p{3}{\\approx0{,}785}',
      },
    },
    {
      say: 'El **método Monte Carlo** estima usando muestras al azar. Aumenta la cantidad de puntos: se conservan los anteriores y se agregan nuevos.',
      gate: 'Arrastra la perilla n hasta 10 000 puntos.',
      board: {
        label: 'Estimar desde conteos',
        tex: '\\p{1}{\\widehat P(\\text{dentro})}=\\p{2}{k/n}',
      },
    },
    {
      say: 'Volvamos a los primeros 100 puntos: 79 quedaron dentro. Usa esa fracción para estimar π.',
      ask: {
        prompt: '¿Qué estimación de π dan 79 puntos dentro de 100?',
        options: ['3,16', '0,79', '1,27'],
        answer: 0,
        explain:
          '79/100 estima π/4. Multiplica por 4: 4 · 0,79 = 3,16; invertir la fracción tampoco recupera π.',
      },
      board: { label: 'Estimar π', tex: '\\p{1}{\\widehat\\pi}=\\p{2}{4\\,k/n}' },
    },
    {
      say: 'Con muestras independientes, el error típico baja como **1/√n**: de 0,1 con 100 a 0,01 con 10 000. Es una escala; una tirada particular puede acercarse o alejarse.',
      board: {
        label: 'Escala del error',
        tex: '\\p{1}{\\text{error típico}}\\p{2}{\\propto1/\\sqrt n}',
      },
    },
    {
      say: 'Cuenta 1 cuando el punto cae dentro y 0 cuando cae fuera: su promedio estima la probabilidad. Para otra función f, promedia sus valores sobre muestras de la distribución que quieres estudiar.',
      board: {
        label: 'Promedio Monte Carlo',
        tex: '\\p{1}{E[f]}\\p{2}{\\approx\\frac1n\\sum_{i=1}^n f(x_i)}',
      },
    },
  ],
};

function SimulatorDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Quarter n={beat === 0 ? 100 : 0} />
      {beat === 0 ? (
        <>
          <Cap x={1250} y={230} size={23}>
            Control geométrico del simulador
          </Cap>
          <Cap x={1250} y={330} size={23} color={C.violet}>
            79 dentro de 100
          </Cap>
          {answer !== null && (
            <Cap
              x={1250}
              y={430}
              tex="\widehat\pi=4\cdot\tfrac{79}{100}=3{,}16"
              size={23}
              color={C.green}
            />
          )}
        </>
      ) : (
        <>
          <Cap x={1250} y={230} tex="n_1=100" />
          <Cap x={1250} y={330} tex="n_2=10\,000" />
          {answer !== null && (
            <>
              <Cap
                x={1250}
                y={430}
                tex="\tfrac{1/\sqrt{10\,000}}{1/\sqrt{100}}=\tfrac1{10}"
                size={23}
                color={C.green}
              />
              <Cap x={1250} y={530} size={19} color={C.muted}>
                La escala del error queda en un décimo.
              </Cap>
            </>
          )}
        </>
      )}
    </Stage>
  );
}

function MonteCarloPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 157 + round);
    const n = pick(r, [100, 200, 500]);
    const k = randInt(r, Math.ceil(n * 0.72), Math.floor(n * 0.84));
    const root = pick(r, [10, 20, 50, 100]);
    const inverse = pick(r, [10, 20, 25, 50, 100]);
    return { n, k, root, inverse, error: 1 / inverse };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `${d.k} de ${d.n} puntos uniformes caen dentro del cuarto de círculo. ¿Qué estimación de π obtienes? Escribe dos decimales.`,
        `Usa la escala 1/√n con n = ${thousands(d.root ** 2)}. ¿Cuánto vale? Escribe tres decimales.`,
        `Usa la escala 1/√n. ¿Cuántas muestras necesitas como mínimo para que sea ≤ ${fmt(d.error, 3)}?`,
      ][round],
      ['\\widehat\\pi=4k/n', '1/\\sqrt n', '1/\\sqrt n\\le\\varepsilon'][round],
    );
    api.hints(
      [
        ['Divide el conteo dentro por el total.', 'Esa fracción estima π/4; multiplícala por 4.'],
        ['Calcula la raíz cuadrada del número de muestras.', 'Divide 1 por esa raíz, no por n.'],
        ['Despeja: √n debe ser al menos 1/error.', 'Eleva al cuadrado el inverso del error.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null || !Number.isFinite(v)) return;
    const target = [(4 * d.k) / d.n, 1 / d.root, d.inverse ** 2][round];
    const tol = round === 0 ? 0.0051 : round === 1 ? 0.00051 : 0;
    if (Math.abs(v - target) <= tol)
      return api.result(
        true,
        [
          `$4\\cdot\\tfrac{${d.k}}{${d.n}}=${tnum(target, 2)}$.`,
          `$1/\\sqrt{${d.root ** 2}}=1/${d.root}=${tnum(target, 3)}$.`,
          `$n\\ge(1/${tnum(d.error, 3)})^2=${target}$. Ese mínimo corresponde a la escala indicada.`,
        ][round],
      );
    if (round === 0 && Math.abs(v - d.k / d.n) < 0.0051)
      return api.result(false, 'Esa fracción estima π/4. Falta multiplicarla por 4.');
    if (round === 0 && Math.abs(v - (4 * (d.n - d.k)) / d.n) < 0.0051)
      return api.result(
        false,
        'Usaste los puntos de afuera. El cuarto de círculo corresponde a los de adentro.',
      );
    if (round === 1 && Math.abs(v - 1 / d.root ** 2) < 0.00051)
      return api.result(false, 'Dividiste por n. El denominador es √n: el error baja más lento.');
    if (round === 1 && v === d.root)
      return api.result(false, 'Calculaste √n. Falta tomar su inverso.');
    if (round === 2 && v === d.inverse)
      return api.result(false, 'Ese es 1/error. Falta elevarlo al cuadrado para obtener n.');
    if (round === 2 && v > target)
      return api.result(false, 'Esa cantidad alcanza, pero se pide el mínimo según 1/√n.');
    return api.result(
      false,
      [
        'Divide los puntos dentro por el total y multiplica por 4.',
        'Usa 1 dividido por la raíz cuadrada de n.',
        'El mínimo es el cuadrado del inverso del error solicitado.',
      ][round],
    );
  };
  return (
    <Stage>
      {/* Geometría y datos de entrada solamente: ninguna lectura calcula la respuesta. */}
      <Quarter />
      <Cap x={1250} y={220} size={23} color={C.violet}>
        {round === 0
          ? `${d.k} puntos dentro`
          : round === 1
            ? `n = ${thousands(d.root ** 2)}`
            : `Escala objetivo: ${fmt(d.error, 3)}`}
      </Cap>
      <Cap x={1250} y={310} size={21} color={C.muted}>
        {round === 0 ? `${d.n} puntos en total` : 'Muestras independientes'}
      </Cap>
      <NumberField
        x={1090}
        y={430}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['π ≈', 'escala =', 'n mínimo ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c2',
  world: 'variational',
  code: '11.2',
  title: 'Tiradas al azar',
  subtitle: 'Monte Carlo',
  glyph: '\\frac1n\\sum f(x_i)',
  kind: 'level',
  guide: 'simon',
  teaser:
    'El simulador del Laboratorio guarda sus tiradas. Simón quiere mostrar que una aproximación puede rendir cuentas.',
  learn: 'Estimar con muestras al azar y relacionar la escala del error con el número de muestras.',
  glyphs: ['vi-mc-average', 'vi-mc-error-scale'],
  pitfalls: [
    'El conteo dentro sobre el total estima π/4; para π falta multiplicar por 4.',
    'La escala baja como 1/√n: reducirla diez veces exige cien veces más muestras.',
    'La escala del error no garantiza el error de una tirada particular.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Los Placeres, nueve de la noche. Simón sostenía un vaso de café frío frente al rack, y las luces lila se le reflejaban en los lentes.',
        },
        {
          who: 'simon',
          text: 'El cálculo completo no cabe en ninguna máquina. Se pueden sacar muestras al azar y guardar cada una; eso hacíamos antes de julio.',
        },
        { who: 'iris', text: '¿Y después de julio?' },
        {
          who: 'simon',
          text: 'Cambiaron el programa. Este control viejo todavía guarda las tiradas; ábranlo antes de que aparezca mi nombre en el acceso.',
        },
        { who: 'tu', text: 'Si quedan las tiradas, podemos repetir la cuenta.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El simulador del Laboratorio',
      Scene: SimulatorDemo,
      beats: [
        {
          say: 'El control guardado tira puntos uniformes en un cuadrado: 79 de 100 quedaron dentro del cuarto de círculo.',
          ask: {
            prompt: '¿Qué valor debería informar como estimación de π?',
            options: ['3,16', '0,79', '3,14 exacto'],
            answer: 0,
            explain:
              'El registro da 4 · 79/100 = 3,16. Informar 3,14 como exacto oculta que el resultado viene de una muestra.',
          },
          note: {
            label: 'Control del simulador',
            tex: '\\widehat\\pi=4\\cdot\\tfrac{79}{100}=3{,}16',
            body: 'El conteo permite reconstruir la estimación del registro.',
          },
        },
        {
          say: 'Simón propone repetir el control con 10 000 puntos, conservando el método de muestreo independiente.',
          ask: {
            prompt: 'Al pasar de 100 a 10 000 muestras, ¿qué pasa con la escala del error?',
            options: ['Se divide por 10', 'Se divide por 100', 'Queda en cero'],
            answer: 0,
            explain:
              '1/√100 = 0,1 y 1/√10 000 = 0,01. La escala se divide por 10; sigue habiendo incertidumbre.',
          },
          note: {
            label: 'Costo de reducir el error',
            tex: '\\tfrac{1/\\sqrt{10\\,000}}{1/\\sqrt{100}}=\\tfrac1{10}',
            body: 'Cien veces más muestras reducen diez veces la escala del error; no garantizan una cifra exacta.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Auditar las tiradas', Comp: MonteCarloPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Teo abrió la carpeta siguiente, y el ventilador del servidor subió de golpe. Simón dejó el vaso sobre el mesón sin soltarlo.',
        },
        {
          who: 'teo',
          text: 'El programa nuevo también tiene muestras, pero vienen de otra distribución, y traen una columna de pesos.',
        },
        {
          who: 'simon',
          text: 'Son muestras prestadas de otro lado. Por eso la receta tiene que decir cuánto pesa cada una.',
        },
        { who: 'iris', text: 'Esa columna tiene tu firma.' },
        {
          who: 'nar',
          text: 'Simón bajó la vista. El vaso había dejado un anillo oscuro en el mesón.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-mc-average',
    world: 'variational',
    tex: '\\frac1n\\sum_{i=1}^n f(x_i)',
    name: 'Promedio Monte Carlo',
    read: 'uno sobre ene por la suma de efe de equis sub i',
    meaning:
      'Promedio de una función sobre muestras de la distribución estudiada; estima su esperanza.',
  },
  {
    id: 'vi-mc-error-scale',
    world: 'variational',
    tex: '1/\\sqrt n',
    name: 'Escala del error Monte Carlo',
    read: 'uno sobre raíz de ene',
    meaning:
      'Con muestras independientes y varianza finita, el error típico decrece proporcionalmente al inverso de la raíz del tamaño de muestra.',
    warn: 'Es una escala, no una garantía sobre cada muestra.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Estimador Monte Carlo',
      tex: '\\widehat\\mu_n=\\frac1n\\sum_{i=1}^n f(x_i)',
      body: 'Las muestras xᵢ se obtienen de la distribución cuya esperanza se quiere estimar.',
    },
    { label: 'Indicadora', tex: 'f(x)=\\mathbf1_A(x),\\quad E[f]=P(A)' },
  ],
  props: [
    {
      label: 'Cuarto de círculo',
      tex: '\\widehat\\pi=4k/n',
      body: 'k puntos dentro, n puntos uniformes en el cuadrado unitario.',
    },
    {
      label: 'Error estándar',
      tex: '\\operatorname{SE}(\\widehat\\mu_n)=\\sigma_f/\\sqrt n',
      body: 'Para muestras independientes de la misma distribución y varianza finita σ²_f. El factor depende de la función y la distribución.',
    },
    {
      label: 'Tamaño para una escala dada',
      tex: '1/\\sqrt n\\le\\varepsilon\\iff n\\ge1/\\varepsilon^2',
      body: 'Esta regla usa la escala 1/√n; no es una cota garantizada del error observado.',
    },
  ],
};

export { lesson };
