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
import { randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseProb } from '../shared/ui';
import { fmt, frac, normalize, tnum } from './kit';

// Una muestra de cada valor: p=(1/2,1/3,1/6), q=(1/3,1/3,1/3).
// Pesos=(3/2,1,1/2); suma de productos=2; suma de pesos=3.
const P = [1 / 2, 1 / 3, 1 / 6];
const Q = [1 / 3, 1 / 3, 1 / 3];
const WEIGHTS = [1.5, 1, 0.5];
const CENTERS = [280, 550, 820];
const ORDER = [1, 2, 0];
const HOME: [number, number] = [550, 735];

function BorrowedBars({ weights }: { weights?: (number | null)[] }) {
  return (
    <g>
      <Cap x={550} y={100} size={22} color={C.amber}>
        p: objetivo (ámbar) · q: generador (celeste)
      </Cap>
      <line x1={160} x2={940} y1={470} y2={470} stroke={C.line} strokeWidth={2} />
      {CENTERS.map((x, i) => (
        <g key={i}>
          <Cap x={x} y={165} tex={`f(x_${i})=${i}`} size={24} />
          <rect
            x={x - 80}
            y={470 - P[i] * 440}
            width={65}
            height={P[i] * 440}
            rx={8}
            fill={C.amber}
          />
          <rect
            x={x + 15}
            y={470 - Q[i] * 440}
            width={65}
            height={Q[i] * 440}
            rx={8}
            fill={C.cyan}
          />
          <Cap x={x - 48} y={520} tex={frac([3, 2, 1][i], 6)} size={23} color={C.amber} />
          <Cap x={x + 48} y={520} tex="\tfrac13" size={23} color={C.cyan} />
          {weights && (
            <>
              <rect
                x={x - 65}
                y={580}
                width={130}
                height={60}
                rx={12}
                fill={C.panel}
                stroke={weights[i] === null ? C.line : C.green}
                strokeWidth={2}
                strokeDasharray={weights[i] === null ? '6 6' : undefined}
              />
              <Cap x={x} y={610} size={23} color={C.green}>
                {weights[i] === null ? 'peso' : `w = ${fmt(weights[i]!, 1)}`}
              </Cap>
            </>
          )}
        </g>
      ))}
    </g>
  );
}

function ImportanceLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [placed, setPlaced] = useState<boolean[]>([false, false, false]);
  const [position, setPosition] = useState<[number, number]>(HOME);
  const [miss, setMiss] = useState(false);
  const { beat } = beats;
  const active = ORDER.find((i) => !placed[i]);
  const dragging = useRef<number | null>(null);
  const drag = useSvgDrag(svg, (px, py, phase) => {
    if (phase === 'start') dragging.current = active ?? null;
    const i = dragging.current;
    if (i === null || beat !== 1) return;
    setPosition([clamp(px, 180, 920), clamp(py, 565, 770)]);
    if (phase !== 'end') return;
    dragging.current = null;
    const fits = Math.abs(px - CENTERS[i]) <= 65 && Math.abs(py - 610) <= 40;
    setMiss(!fits);
    setPosition(HOME);
    if (fits) {
      const next = placed.map((v, j) => v || j === i);
      setPlaced(next);
      if (next.every(Boolean)) unlock();
    }
  });
  useEffect(() => {
    if (beat === 1 && placed.every(Boolean)) unlock();
  }, [beat, placed, unlock]);
  const shownWeights =
    beat === 1 ? WEIGHTS.map((w, i) => (placed[i] ? w : null)) : beat >= 2 ? WEIGHTS : undefined;
  return (
    <Stage ref={svg}>
      <BorrowedBars weights={shownWeights} />
      <Cap x={1250} y={200} tex="f=(0;1;2)" />
      <Cap x={1250} y={290} tex="q(x)=\tfrac13" color={C.cyan} />
      {beat === 0 && (
        <Cap x={1250} y={380} size={21}>
          Queremos el promedio según p.
        </Cap>
      )}
      {beat === 1 && (
        <>
          <Cap x={1250} y={380} tex="w(x)=\frac{p(x)}{q(x)}" color={C.amber} />
          <Cap x={1250} y={470} size={20}>
            {placed.filter(Boolean).length} de 3 pesos ubicados
          </Cap>
          {miss && (
            <Cap x={1250} y={560} size={19} color={C.amber}>
              Revisa p/q para esa barra.
            </Cap>
          )}
          {active !== undefined && (
            <Knob
              x={position[0]}
              y={position[1]}
              axis="xy"
              label={`peso ${fmt(WEIGHTS[active], 1)}`}
              color={C.amber}
              onPointerDown={drag}
            />
          )}
        </>
      )}
      {beat >= 2 && <Cap x={1250} y={380} tex="\sum_i w_i=3" color={C.amber} />}
      {beat === 2 && <Cap x={1250} y={470} tex="\sum_i w_i f(x_i)=2" />}
      {((beat === 3 && answer !== null) || beat === 4) && (
        <Cap x={1250} y={470} tex="\widehat E_p[f]=\tfrac23" color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={1250} y={560} size={20}>
          Aquí coincide con el valor exacto.
        </Cap>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Muestras prestadas',
  Scene: ImportanceLesson,
  beats: [
    {
      say: 'Quieres el promedio de f según p, pero tu generador solo entrega muestras de q. Aquí q reparte por igual los tres valores; p les da probabilidades distintas.',
      board: {
        label: 'Objetivo y generador',
        tex: 'p=(\\tfrac12;\\tfrac13;\\tfrac16),\\quad q=(\\tfrac13;\\tfrac13;\\tfrac13)',
      },
    },
    {
      say: 'El **peso de importancia** es p dividido por q: aumenta el aporte de lo que q entrega de menos. Ubica cada peso bajo su par de barras.',
      gate: 'Arrastra cada peso al recuadro de la barra que le corresponde.',
      board: {
        label: 'Pesos de importancia',
        tex: '\\p{1}{w(x)=\\frac{p(x)}{q(x)}},\\quad \\p{2}{w=(\\tfrac32;1;\\tfrac12)}',
      },
    },
    {
      say: 'Toma una muestra de cada valor para ver la cuenta: multiplica cada f por su peso. Los productos suman 2 y los pesos suman 3.',
      board: {
        label: 'Dos sumas',
        tex: '\\sum_i w_i f(x_i)=0\\cdot1{,}5+1\\cdot1+2\\cdot0{,}5=2,\\quad\\sum_i w_i=3',
      },
    },
    {
      say: 'El **promedio ponderado** divide la suma de los productos por la suma de los pesos.',
      ask: {
        prompt: '¿Qué promedio queda con estas tres muestras?',
        options: ['2/3', '1', '2'],
        answer: 0,
        explain:
          '2 dividido por 3 da 2/3. El promedio sin pesos sería 1; dejar solo la suma de productos da 2.',
      },
      board: {
        label: 'Promedio ponderado',
        tex: '\\p{1}{\\widehat E_p[f]}=\\p{2}{\\frac{\\sum_i w_i f(x_i)}{\\sum_i w_i}}=\\p{3}{\\tfrac23}',
      },
    },
    {
      say: 'En este ejemplo equilibrado obtienes exactamente E_p[f] = 2/3. Con muestras aleatorias de q, esta razón es una estimación: mejora al reunir más muestras, si q cubre todo lo que p permite.',
      board: {
        label: 'Muestreo por importancia',
        tex: 'E_p[f]\\approx\\frac{\\sum_{i=1}^n w_i f(x_i)}{\\sum_{i=1}^n w_i},\\quad x_i\\sim q,\\quad w_i=\\frac{p(x_i)}{q(x_i)}',
        body: 'q debe ser positiva donde p es positiva; los pesos pueden variar mucho y volver inestable la estimación.',
      },
    },
  ],
};

function LabSamples({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <BorrowedBars weights={beat === 1 && answer !== null ? WEIGHTS : undefined} />
      <Cap x={1250} y={200} size={21}>
        Control: una muestra de cada valor.
      </Cap>
      <Cap x={1250} y={290} size={21}>
        El informe les da el mismo peso.
      </Cap>
      {beat === 0 && answer !== null && (
        <Cap x={1250} y={380} tex="\overline f_q=\tfrac{0+1+2}{3}=1" color={C.amber} />
      )}
      {beat === 1 && answer !== null && (
        <>
          <Cap
            x={1250}
            y={380}
            tex="\widehat E_p[f]=\tfrac{0+1+1}{3}=\tfrac23"
            color={C.green}
            size={24}
          />
          <Cap x={1250} y={470} size={20}>
            La cuenta sin pesos queda más alta.
          </Cap>
        </>
      )}
    </Stage>
  );
}

function ImportancePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 173 + round);
    // p es no uniforme; todas las probabilidades son positivas.
    const rawP = [randInt(r, 5, 8), randInt(r, 2, 4), 1];
    const rawQ = round === 2 ? [1, randInt(r, 2, 3), randInt(r, 4, 5)] : [1, 1, 1];
    const p = normalize(rawP),
      q = normalize(rawQ);
    const ps = rawP.reduce((a, b) => a + b, 0),
      qs = rawQ.reduce((a, b) => a + b, 0);
    const weights = p.map((v, i) => v / q[i]);
    const k = randInt(r, 1, 3);
    const f = [0, k, 2 * k];
    const counts = round === 2 ? [randInt(r, 1, 3), randInt(r, 2, 4), randInt(r, 4, 6)] : [1, 1, 1];
    const i = randInt(r, 0, 2);
    const products = weights.reduce((s, w, j) => s + counts[j] * w * f[j], 0);
    const mass = weights.reduce((s, w, j) => s + counts[j] * w, 0);
    const n = counts.reduce((a, b) => a + b, 0);
    const plain = counts.reduce((s, c, j) => s + c * f[j], 0) / n;
    return {
      rawP,
      rawQ,
      ps,
      qs,
      weights,
      f,
      counts,
      i,
      products,
      mass,
      plain,
      n,
      target: round === 0 ? weights[i] : products / mass,
    };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Calcula el peso de importancia para x${d.i}. Puedes escribir una fracción o dos decimales.`,
        'La muestra contiene una vez cada valor. Calcula su promedio ponderado; escribe dos decimales.',
        'La tabla agrupa muestras de q por valor. Calcula el promedio ponderado usando las repeticiones; escribe dos decimales.',
      ][round],
      round === 0
        ? 'w(x)=\\frac{p(x)}{q(x)}'
        : '\\widehat E_p[f]=\\frac{\\sum_i w_i f(x_i)}{\\sum_i w_i}',
    );
    api.hints(
      [
        ['Lee p y q en la fila pedida.', 'Divide p por q, en ese orden.'],
        ['Calcula un peso p/q para cada fila.', 'Suma w·f y divide por la suma de w.'],
        [
          'Cada peso aparece tantas veces como dice la columna n.',
          'Suma n·w·f y divide por la suma de n·w.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseProb(val);
    if (v === null || !Number.isFinite(v)) return;
    const near = (x: number) => Math.abs(v - x) < 0.006;
    if (near(d.target))
      return api.result(
        true,
        round === 0
          ? `El peso es p/q ≈ $${tnum(d.target)}$. Un peso puede ser mayor que 1.`
          : `La suma de productos es $${tnum(d.products)}$ y la de pesos, $${tnum(d.mass)}$: el promedio es $${tnum(d.target)}$.`,
      );
    if (round === 0) {
      if (near(1 / d.weights[d.i]))
        return api.result(
          false,
          'Invertiste la razón: el peso es p/q, con el objetivo arriba y el generador abajo.',
        );
      if (near(d.rawP[d.i] / d.ps))
        return api.result(
          false,
          'Escribiste p. Falta dividir por la probabilidad q de esa misma fila.',
        );
      return api.result(
        false,
        `Usa la fila x${d.i}: divide su p por su q. El peso puede superar 1.`,
      );
    }
    if (near(d.plain))
      return api.result(
        false,
        'Promediaste sin pesos. Cada muestra debe aportar w·f y contar w en el denominador.',
      );
    if (near(d.products))
      return api.result(false, 'Esa es la suma de productos. Falta dividir por la suma de pesos.');
    if (near(d.products / d.n))
      return api.result(
        false,
        'Dividiste por el número de muestras. Aquí el denominador es la suma de sus pesos.',
      );
    const once =
      d.weights.reduce((s, w, j) => s + w * d.f[j], 0) / d.weights.reduce((s, w) => s + w, 0);
    if (round === 2 && near(once))
      return api.result(
        false,
        'Contaste cada fila una sola vez. Multiplica tanto w·f como w por la cantidad n de esa fila.',
      );
    return api.result(
      false,
      round === 2
        ? 'Revisa las repeticiones: suma n·w·f y divide por la suma de n·w.'
        : 'Calcula los tres pesos p/q; suma w·f y divide por la suma de w.',
    );
  };
  return (
    <Stage>
      <Cap x={550} y={170} size={24}>
        Tabla de muestras del control
      </Cap>
      {['x', 'f(x)', 'p(x)', 'q(x)', round === 2 ? 'n' : ''].map((label, j) => (
        <Cap key={j} x={200 + j * 175} y={260} size={23} color={C.muted}>
          {label}
        </Cap>
      ))}
      {d.f.map((f, i) => (
        <g key={i}>
          <line x1={160} x2={950} y1={310 + i * 120} y2={310 + i * 120} stroke={C.line} />
          <Cap
            x={200}
            y={355 + i * 120}
            tex={`x_${i}`}
            color={round === 0 && i === d.i ? C.amber : C.text}
          />
          <Cap x={375} y={355 + i * 120}>
            {f}
          </Cap>
          <Cap x={550} y={355 + i * 120} tex={frac(d.rawP[i], d.ps)} color={C.amber} />
          <Cap x={725} y={355 + i * 120} tex={frac(d.rawQ[i], d.qs)} color={C.cyan} />
          {round === 2 && (
            <Cap x={900} y={355 + i * 120}>
              {d.counts[i]}
            </Cap>
          )}
        </g>
      ))}
      <Cap x={550} y={695} size={20} color={C.muted}>
        {round === 2
          ? 'n cuenta las repeticiones de cada valor.'
          : 'q reparte los tres valores por igual.'}
      </Cap>
      <NumberField
        x={1080}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 0 ? 'w =' : 'promedio ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c3',
  world: 'variational',
  code: '11.3',
  title: 'Muestras prestadas',
  subtitle: 'Muestreo por importancia',
  glyph: '\\frac pq',
  kind: 'level',
  guide: 'simon',
  teaser:
    'El control usa muestras de otro generador. El informe las cuenta como si vinieran del modelo original.',
  learn: 'Calcular pesos p/q y estimar un promedio con muestras de q, incluyendo sus repeticiones.',
  glyphs: ['vi-importance-weight', 'vi-weighted-estimate'],
  pitfalls: [
    'El peso es p/q; invertirlo corrige en la dirección equivocada.',
    'El promedio se divide por la suma de pesos, incluyendo todas las repeticiones.',
    'q debe cubrir todos los valores a los que p da probabilidad positiva.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio de Los Placeres, 23:15. Simón se frota las manos bajo el mesón; el ventilador del servidor tapa el ruido del pasillo.',
        },
        {
          who: 'simon',
          text: 'El horno grande no responde, así que usamos el chico, otro generador. La receta trae una corrección para cada muestra; debería traerla.',
        },
        { who: 'iris', text: '¿Debería?' },
        {
          who: 'simon',
          text: 'El informe cuenta todo igual y sale más alto. Bonito dorado para la foto de Halcón.',
        },
        { who: 'tu', text: 'Guarda el control original; voy a comparar las dos cuentas.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El control sin corrección',
      Scene: LabSamples,
      beats: [
        {
          say: 'El control guarda una muestra de cada valor de f: 0, 1 y 2. El informe las promedia sin corregir el generador.',
          ask: {
            prompt: '¿Qué número escribió el informe?',
            options: ['1', '2/3', '2'],
            answer: 0,
            explain: '(0 + 1 + 2)/3 = 1. Esa cuenta deja a las tres muestras con el mismo peso.',
          },
          note: {
            label: 'Cuenta del informe',
            tex: '\\overline f=\\frac{0+1+2}{3}=1',
            body: 'El control se generó con q uniforme; el informe omitió los pesos.',
          },
        },
        {
          say: 'El objetivo del control es p = (1/2, 1/3, 1/6), con el mismo generador uniforme q. Aplica los pesos p/q.',
          ask: {
            prompt: '¿Qué promedio obtienes al corregir las muestras?',
            options: ['2/3', '1', '3/2'],
            answer: 0,
            explain:
              'Los pesos son 1,5; 1 y 0,5. La suma ponderada da 2 y la suma de pesos da 3: 2/3, por debajo del 1 del informe.',
          },
          note: {
            label: 'Control corregido',
            tex: '\\widehat E_p[f]=\\frac{0\\cdot1{,}5+1\\cdot1+2\\cdot0{,}5}{1{,}5+1+0{,}5}=\\frac23',
            body: 'En este control equilibrado, omitir los pesos sube el promedio de 2/3 a 1.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Corregir los controles', Comp: ImportancePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Simón deja de frotarse las manos al ver las dos cifras. En el vidrio, el logo de Halcón corta el reflejo de la pantalla.',
        },
        {
          who: 'simon',
          text: 'La corrección estaba en la receta; alguien la sacó antes de servir. Yo firmé los controles, los informes salían de otra oficina.',
        },
        { who: 'iris', text: 'La oficina tiene nombre.' },
        {
          who: 'simon',
          text: 'También eligieron la forma del modelo que cabe en el horno chico. Esa carpeta todavía tiene mi firma.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-importance-weight',
    world: 'variational',
    tex: 'w(x)=\\frac{p(x)}{q(x)}',
    name: 'Peso de importancia',
    read: 'doble ve de equis, pe sobre cu',
    meaning: 'Corrige cuánto aporta una muestra de q al estimar un promedio según p.',
    warn: 'Puede superar 1; q debe ser positiva donde p es positiva.',
  },
  {
    id: 'vi-weighted-estimate',
    world: 'variational',
    tex: '\\widehat E_p[f]=\\frac{\\sum_i w_i f(x_i)}{\\sum_i w_i}',
    name: 'Estimación ponderada',
    read: 'suma de peso por valor sobre suma de pesos',
    meaning: 'Promedio estimado con muestras de q, ponderadas para el objetivo p.',
    warn: 'Cuenta cada repetición en las dos sumas.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Promedio objetivo', tex: 'E_p[f]=\\sum_x p(x)f(x)' },
    {
      label: 'Peso de importancia',
      tex: 'w(x)=\\frac{p(x)}{q(x)}',
      body: 'p es la distribución objetivo; q es la que genera las muestras.',
    },
  ],
  props: [
    {
      label: 'Cambio de distribución',
      tex: 'E_p[f]=E_q[wf]',
      body: 'Válido si q es positiva en todo el soporte de p.',
    },
    {
      label: 'Estimador con pesos normalizados',
      tex: 'E_p[f]\\approx\\frac{\\sum_{i=1}^n w_i f(x_i)}{\\sum_{i=1}^n w_i},\\quad x_i\\sim q',
      body: 'La razón es una estimación; con una muestra finita no garantiza el promedio exacto.',
    },
    {
      label: 'Muestras agrupadas',
      tex: '\\widehat E_p[f]=\\frac{\\sum_x n_x w(x) f(x)}{\\sum_x n_x w(x)}',
      body: 'nₓ cuenta cuántas veces apareció x. Pesos muy desiguales pueden volver inestable la estimación.',
    },
  ],
};

export { lesson };
