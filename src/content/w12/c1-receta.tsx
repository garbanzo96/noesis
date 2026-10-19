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
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Bars, fmt, tnum } from './kit';

// ============================================================================
// CASO 12.1 · «La receta» — qué es un modelo generativo
// P = (0,2; 0,5; 0,3) en {bajo, medio, alto}. Se saca un valor con u uniforme y la acumulada:
// u < 0,2 → bajo; 0,2 ≤ u < 0,7 → medio; u ≥ 0,7 → alto.
// ============================================================================

const LEVELS = ['bajo', 'medio', 'alto'];
const PROBS = [0.2, 0.5, 0.3];
const STRIP = { x: 200, y: 600, w: 700, h: 56 };
const COLORS = [C.cyan, C.amber, C.magenta];

function pickLevel(u: number, probs: number[]) {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (u < acc) return i;
  }
  return probs.length - 1;
}

/** the unit strip split by the cumulative probabilities, with u marked on it */
function Strip({ probs, u, showU = true }: { probs: number[]; u?: number; showU?: boolean }) {
  let acc = 0;
  return (
    <g>
      {probs.map((p, i) => {
        const x0 = STRIP.x + acc * STRIP.w;
        acc += p;
        return (
          <g key={i}>
            <rect
              x={x0}
              y={STRIP.y}
              width={p * STRIP.w}
              height={STRIP.h}
              fill={COLORS[i]}
              fillOpacity={u !== undefined && pickLevel(u, probs) === i ? 0.85 : 0.3}
              stroke={C.bg}
              strokeWidth={2}
            />
            <Cap x={x0 + (p * STRIP.w) / 2} y={STRIP.y + STRIP.h / 2} size={20} color={C.text}>
              {LEVELS[i]}
            </Cap>
          </g>
        );
      })}
      {[0, ...probs.map((_, i) => probs.slice(0, i + 1).reduce((a, b) => a + b, 0))].map((v, i) => (
        <Cap key={i} x={STRIP.x + v * STRIP.w} y={STRIP.y + STRIP.h + 28} size={18} color={C.muted}>
          {fmt(v, 1)}
        </Cap>
      ))}
      {showU && u !== undefined && (
        <line
          x1={STRIP.x + u * STRIP.w}
          x2={STRIP.x + u * STRIP.w}
          y1={STRIP.y - 14}
          y2={STRIP.y + STRIP.h + 6}
          stroke={C.text}
          strokeWidth={3}
        />
      )}
    </g>
  );
}

const SAMPLE = (() => {
  const r = rng(1212);
  const c = [0, 0, 0];
  for (let i = 0; i < 1000; i++) c[pickLevel(r(), PROBS)] += 1;
  return c.map((v) => v / 1000);
})();

function RecipeLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [u, setU] = useState(0.1);
  const seen = useRef(new Set<number>([0]));
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    const v = clamp((px - STRIP.x) / STRIP.w, 0, 0.999);
    setU(v);
    seen.current.add(pickLevel(v, PROBS));
    if (seen.current.size === 3) unlock();
  });
  const uu = beat === 1 ? u : beat === 2 ? 0.65 : undefined;
  return (
    <Stage ref={svg}>
      <Bars
        labels={LEVELS}
        values={beat === 3 || beat === 4 ? SAMPLE : PROBS}
        color={beat === 3 || beat === 4 ? C.green : C.amber}
        x={200}
        base={460}
        w={700}
        h={260}
        max={0.6}
      />
      <Cap x={550} y={160} size={21} color={C.muted}>
        {beat >= 3
          ? 'Frecuencias en 1000 registros generados'
          : 'El modelo: probabilidad de cada nivel del test'}
      </Cap>
      {beat >= 1 && <Strip probs={PROBS} u={beat === 2 && answer === null ? undefined : uu} />}
      {beat === 1 && (
        <Knob
          x={STRIP.x + u * STRIP.w}
          y={STRIP.y - 34}
          onPointerDown={drag}
          axis="x"
          color={C.text}
          label={`u = ${fmt(u, 2)}`}
        />
      )}
      {beat >= 1 && beat <= 2 && uu !== undefined && (beat === 1 || answer !== null) && (
        <Cap
          x={1270}
          y={300}
          tex={`u=${tnum(uu)}\\ \\Rightarrow\\ \\text{${LEVELS[pickLevel(uu, PROBS)]}}`}
          color={COLORS[pickLevel(uu, PROBS)]}
        />
      )}
      <Cap x={1270} y={200} tex="P=(0{,}2;\ 0{,}5;\ 0{,}3)" color={C.amber} />
      {beat >= 3 && (
        <Cap
          x={1270}
          y={300}
          tex={`(${tnum(SAMPLE[0])};\\ ${tnum(SAMPLE[1])};\\ ${tnum(SAMPLE[2])})`}
          color={C.green}
        />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Modelos generativos',
  intro: {
    question: '¿Cómo se fabrican datos nuevos que se parezcan a los reales?',
    text: 'Empiezan los modelos generativos: distribuciones que no solo describen datos, sino que permiten sortear datos nuevos. El truco básico pasa un número al azar entre 0 y 1 por la función acumulada. En La Fábrica cada carpeta sale de un sorteo así.',
  },
  Scene: RecipeLesson,
  beats: [
    {
      say: 'Un **modelo generativo** es una receta: dice qué tan probable es cada resultado y permite producir datos nuevos que siguen esas proporciones.',
      board: {
        label: 'El modelo',
        tex: '\\p{1}{P(\\text{bajo},\\text{medio},\\text{alto})}=\\p{2}{(0{,}2;\\,0{,}5;\\,0{,}3)}',
        parts: ['probabilidad de cada nivel', 'proporciones del modelo'],
      },
    },
    {
      say: 'Para sacar un dato, sortea un número u entre 0 y 1 y mira en qué tramo cae. Los tramos miden lo mismo que las probabilidades.',
      gate: 'Arrastra u por la cinta hasta pasar por los tres niveles.',
      board: {
        label: 'La acumulada',
        tex: '\\p{1}{F(x)}=\\p{2}{P(X\\le x)}',
        parts: ['probabilidad acumulada', 'hasta este valor'],
      },
    },
    {
      say: 'El tramo de «medio» va de 0,2 a 0,7.',
      ask: {
        prompt: 'Si u = 0,65, ¿qué nivel sale?',
        options: ['medio', 'alto', 'bajo'],
        answer: 0,
        explain: '0,65 está entre 0,2 y 0,7: el tramo de «medio».',
      },
      board: {
        label: 'Sacar un dato',
        tex: '\\p{1}{x}=\\p{2}{F^{-1}(u)}',
        parts: ['dato generado', 'tramo del sorteo'],
      },
    },
    {
      say: 'Con mil sorteos, las frecuencias quedan cerca de las probabilidades del modelo. Así se fabrican datos que «se ven» como los reales.',
      board: {
        label: 'Muchos datos',
        tex: '\\p{1}{\\frac{\\#x}{n}}\\p{2}{\\approx P(x)}',
        parts: ['frecuencia del resultado', 'probabilidad del modelo'],
      },
    },
    {
      say: 'La Fábrica hace lo mismo con miles de columnas a la vez. Primero aprende el modelo de los datos reales; después sortea.',
      board: {
        label: 'Generar',
        tex: '\\p{1}{u\\sim U(0,1)}\\ \\p{2}{\\to\\ x=F^{-1}(u)}',
        parts: ['sorteo uniforme', 'dato según la receta'],
      },
    },
  ],
};

function BeltDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Bars labels={LEVELS} values={PROBS} x={200} base={460} w={700} h={260} max={0.6} />
      <Strip probs={PROBS} u={beat === 0 && answer !== null ? 0.15 : undefined} />
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="u=0{,}15\ \Rightarrow\ \text{bajo}" color={C.cyan} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="500\cdot0{,}3=150" color={C.magenta} />
      )}
    </Stage>
  );
}

const SETS = [
  [0.2, 0.5, 0.3],
  [0.1, 0.6, 0.3],
  [0.4, 0.4, 0.2],
  [0.3, 0.3, 0.4],
];

function RecipePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 173 + round);
    const probs = pick(r, SETS);
    const u = pick(r, [0.05, 0.25, 0.45, 0.65, 0.85, 0.95]);
    const n = pick(r, [200, 500, 1000]);
    const k = pick(r, [0, 1, 2]);
    return { probs, u, n, k, level: pickLevel(u, probs), F1: probs[0] + probs[1] };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setVal('');
    setChoice(null);
    const model = `El modelo da P = (${d.probs.map((p) => fmt(p, 1)).join('; ')}) para bajo, medio y alto.`;
    api.prompt(
      [
        `${model} Sale u = ${fmt(d.u, 2)}. ¿Qué nivel genera?`,
        `${model} ¿Cuánto vale la acumulada F(medio) = P(X ≤ medio)? Un decimal.`,
        `${model} Si la máquina genera ${d.n} registros, ¿cuántos «${LEVELS[d.k]}» esperas?`,
      ][round],
      ['x=F^{-1}(u)', 'F(\\text{medio})=P(\\text{bajo})+P(\\text{medio})', 'n\\cdot P(x)'][round],
    );
    api.hints(
      [
        [
          'Marca los tramos en la cinta: 0, P(bajo), P(bajo) + P(medio), 1.',
          'Mira en qué tramo cae u.',
        ],
        ['La acumulada suma desde el principio.', 'Suma bajo y medio.'],
        [
          'Multiplica el total por la probabilidad del nivel.',
          'Es lo esperado, no lo exacto de cada lote.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 0) {
      if (choice === null) return;
      if (choice === LEVELS[d.level])
        return api.result(true, `$u=${tnum(d.u)}$ cae en el tramo de «${LEVELS[d.level]}».`);
      return api.result(
        false,
        `Los tramos terminan en ${fmt(d.probs[0], 1)} y ${fmt(d.F1, 1)}. ¿Dónde cae ${fmt(d.u, 2)}?`,
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    const t = round === 1 ? d.F1 : d.n * d.probs[d.k];
    if (Math.abs(v - t) < (round === 1 ? 0.011 : 0.5))
      return api.result(
        true,
        round === 1 ? `$F=${tnum(t, 1)}$.` : `$${d.n}\\cdot${tnum(d.probs[d.k], 1)}=${t}$.`,
      );
    if (round === 1 && Math.abs(v - d.probs[1]) < 0.011)
      return api.result(false, 'Esa es solo P(medio). La acumulada suma también «bajo».');
    return api.result(
      false,
      round === 1 ? 'Suma P(bajo) y P(medio).' : `Multiplica ${d.n} por ${fmt(d.probs[d.k], 1)}.`,
    );
  };
  return (
    <Stage>
      <Bars labels={LEVELS} values={d.probs} x={200} base={460} w={700} h={260} max={0.7} />
      {round === 0 && <Strip probs={d.probs} />}
      {round === 0 ? (
        <Choices x={1230} y={420} options={LEVELS} value={choice} onPick={setChoice} />
      ) : (
        <NumberField
          x={1120}
          y={420}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label={round === 1 ? 'F(medio) =' : 'registros ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c1',
  world: 'generative',
  code: '12.1',
  title: 'La receta',
  subtitle: 'Qué es un modelo generativo',
  glyph: 'F^{-1}(u)',
  kind: 'level',
  guide: 'joaquin',
  teaser:
    'En La Fábrica todo se fabrica, empezando por los pacientes. Joaquín conoce la receta de memoria.',
  learn:
    'Entender un modelo generativo como una distribución desde la que se sacan datos nuevos con un número al azar y la acumulada.',
  glyphs: ['gen-model', 'gen-inverse'],
  pitfalls: [
    'La acumulada suma desde el primer nivel; no es la probabilidad de un solo nivel.',
    'Lo esperado en n registros es n·P; cada lote real varía un poco.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'La Fábrica, barrio Barón, once y diez de la noche. Las impresoras soltaban carpetas sin parar, y la cinta las llevaba hasta un camión con el motor encendido.',
        },
        {
          who: 'joaquin',
          text: 'Aquí todo se fabrica. Cada carpeta sale de un sorteo.',
        },
        { who: 'iris', text: '¿Un sorteo con qué reglas?' },
        {
          who: 'joaquin',
          text: 'Con las de los registros de verdad. La máquina las aprendió en abril, y desde entonces no ha parado.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La cinta de carpetas',
      Scene: BeltDemo,
      beats: [
        {
          say: 'Cada carpeta sortea su nivel de test con el modelo (0,2; 0,5; 0,3).',
          ask: {
            prompt: 'La siguiente carpeta sorteó u = 0,15. ¿Qué nivel le imprime la máquina?',
            options: ['bajo', 'medio', 'alto'],
            answer: 0,
            explain: '0,15 es menor que 0,2: tramo de «bajo».',
          },
          note: { label: 'Una carpeta', tex: 'u=0{,}15\\Rightarrow\\text{bajo}' },
        },
        {
          say: 'Esta noche salen 500 carpetas.',
          ask: {
            prompt: '¿Cuántas con nivel «alto» esperas?',
            options: ['150', '300', '50'],
            answer: 0,
            explain: '500 · 0,3 = 150. Para un revisor apurado, el lote se ve igual a uno real.',
          },
          note: {
            label: 'Un lote',
            tex: '500\\cdot0{,}3=150',
            body: 'Las proporciones calzan con las reales: eso hace pasar el lote.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Sortear registros', Comp: RecipePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín levantó una carpeta de la cinta y la hojeó sin mirarla.',
        },
        {
          who: 'joaquin',
          text: 'Las proporciones salen perfectas. Lo que no sé es cómo aprendió la forma de cada número.',
        },
        { who: 'teo', text: 'Empecemos por la más simple: una campana.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-model',
    world: 'generative',
    tex: 'P(x)',
    name: 'Modelo generativo',
    read: 'pe de equis',
    meaning: 'Distribución que describe los datos y desde la que se pueden sacar datos nuevos.',
  },
  {
    id: 'gen-inverse',
    world: 'generative',
    tex: 'x=F^{-1}(u)',
    name: 'Muestreo con la acumulada',
    read: 'equis igual efe inversa de u',
    meaning:
      'Un número u uniforme entre 0 y 1 se convierte en un dato según el tramo de la acumulada donde cae.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Acumulada', tex: 'F(x)=P(X\\le x)' },
    { label: 'Muestreo', tex: 'u\\sim U(0,1),\\ x=F^{-1}(u)' },
  ],
  props: [
    {
      label: 'Frecuencias',
      tex: '\\tfrac{\\#x}{n}\\approx P(x)',
      body: 'Con muchos sorteos, las frecuencias se acercan al modelo.',
    },
    { label: 'Esperado', tex: 'E[\\#x]=n\\,P(x)' },
  ],
};

export { lesson };
