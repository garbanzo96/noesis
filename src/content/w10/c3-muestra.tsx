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
import { fmt, tnum } from './kit';

// ============================================================================
// CASO 10.3 · «La segunda muestra» — actualización secuencial
// 100 000 personas, 2 %: 2000 enfermos. Un positivo deja 1800 de 6700 (≈ 0,27); un segundo
// positivo deja 1620 de 1865 (= 324/373 ≈ 0,87). El resultado de un test es el punto de
// partida del siguiente.
// ============================================================================

/** sick and healthy counts after k positives, starting from 2000 / 98000 with s = 0,9, e = 0,95 */
const STAGES = [
  { sick: 2000, healthy: 98000, label: 'antes' },
  { sick: 1800, healthy: 4900, label: '1 positivo' },
  { sick: 1620, healthy: 245, label: '2 positivos' },
];
const COL = { x0: 230, w: 160, gap: 120, y: 200, h: 440 };
const STEP = { x0: 1110, x1: 1400, y: 640 };

function Column({ k, show }: { k: number; show: boolean }) {
  const { sick, healthy, label } = STAGES[k];
  const f = sick / (sick + healthy);
  const x = COL.x0 + k * (COL.w + COL.gap);
  const hs = Math.max(4, f * COL.h);
  return (
    <g opacity={show ? 1 : 0.15}>
      <rect
        x={x}
        y={COL.y}
        width={COL.w}
        height={COL.h - hs}
        rx={8}
        fill={C.cyan}
        fillOpacity={0.55}
      />
      <rect
        x={x}
        y={COL.y + COL.h - hs}
        width={COL.w}
        height={hs}
        rx={8}
        fill={C.magenta}
        fillOpacity={0.9}
      />
      <Cap x={x + COL.w / 2} y={COL.y + COL.h + 34} size={21} color={C.text}>
        {label}
      </Cap>
      {show && (
        <Cap x={x + COL.w / 2} y={COL.y - 30} size={22} tex={`${tnum(f, 2)}`} color={C.magenta} />
      )}
    </g>
  );
}

function SequenceLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(1);
  const { beat } = beats;
  const shown =
    beat === 0 ? 0 : beat === 1 ? 1 : beat === 2 ? k : beat === 3 ? (answer !== null ? 2 : 1) : 2;
  const drag = useSvgDrag(svg, (px) => {
    const t = clamp((px - STEP.x0) / (STEP.x1 - STEP.x0), 0, 1);
    const next = Math.round(t * 2);
    setK(next);
    if (next === 2) unlock();
  });
  return (
    <Stage ref={svg}>
      {[0, 1, 2].map((i) => (
        <Column key={i} k={i} show={i <= shown} />
      ))}
      {[0, 1].map((i) => (
        <path
          key={i}
          d={`M${COL.x0 + (i + 1) * COL.w + i * COL.gap + 18} ${COL.y + COL.h / 2} h${COL.gap - 36} l-14 -10 m14 10 l-14 10`}
          fill="none"
          stroke={i < shown ? C.amber : C.line}
          strokeWidth={4}
        />
      ))}
      <Cap x={545} y={720} size={20} color={C.muted}>
        Magenta: enfermos. Celeste: sanos. Cada columna son las personas que siguen en juego.
      </Cap>
      <Cap x={1270} y={200} tex="P(E)=0{,}02" color={C.text} />
      {shown >= 1 && (
        <Cap x={1270} y={290} tex="P(E\mid+)=\tfrac{1800}{6700}\approx0{,}27" color={C.magenta} />
      )}
      {shown >= 2 && (
        <Cap x={1270} y={380} tex="P(E\mid++)=\tfrac{1620}{1865}\approx0{,}87" color={C.green} />
      )}
      {beat === 2 && (
        <>
          <line x1={STEP.x0} x2={STEP.x1} y1={STEP.y} y2={STEP.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={STEP.x0 + (k / 2) * (STEP.x1 - STEP.x0)}
            y={STEP.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${k}`}
          />
          <Cap x={1255} y={STEP.y + 60} size={19} color={C.muted}>
            tests positivos seguidos
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Actualización secuencial',
  intro: {
    question: '¿Qué cambia cuando se repite un test a quien dio positivo?',
    text: 'Con Bayes, el resultado de un test se convierte en el punto de partida para el siguiente. Cada evidencia nueva actualiza la probabilidad anterior, una después de otra. Rocío guardó la segunda muestra de cada positivo, y repetirlas cambia la cuenta.',
  },
  Scene: SequenceLesson,
  beats: [
    {
      say: 'Antes de cualquier test, el 2 % de las personas está enfermo. Esa es la probabilidad de partida.',
      board: {
        label: 'Antes',
        tex: '\\p{1}{P(E)}=\\p{2}{0{,}02}',
        parts: ['probabilidad de partida', 'prevalencia inicial'],
      },
    },
    {
      say: 'Un positivo deja en juego a 1800 enfermos y 4900 sanos: la fracción de enfermos sube a 0,27.',
      board: {
        label: 'Después de un positivo',
        tex: '\\p{1}{P(E\\mid+)}=\\p{2}{\\tfrac{1800}{1800+4900}}\\p{3}{\\approx0{,}27}',
        parts: [
          'probabilidad tras positivo',
          'enfermos entre positivos',
          'probabilidad actualizada',
        ],
      },
    },
    {
      say: 'Ahora repite el test solo a quienes dieron positivo. El 0,27 pasa a ser el nuevo punto de partida.',
      gate: 'Arrastra la perilla hasta 2 tests positivos.',
      board: {
        label: 'El resultado se vuelve el punto de partida',
        tex: '\\p{1}{P_{\\text{nuevo}}(E)}=\\p{2}{P(E\\mid+)}',
        parts: ['nuevo punto de partida', 'resultado del primer test'],
      },
    },
    {
      say: 'En el segundo test, los enfermos vuelven a dar positivo el 90 % de las veces y los sanos solo el 5 %.',
      ask: {
        prompt: '¿Cuánto vale P(E | dos positivos)?',
        options: ['≈ 0,87', '≈ 0,27', '0,90'],
        answer: 0,
        explain:
          '1800·0,9 = 1620 enfermos y 4900·0,05 = 245 sanos siguen positivos: 1620/1865 ≈ 0,87.',
      },
      board: {
        label: 'Dos positivos',
        tex: '\\p{1}{\\tfrac{1620}{1620+245}}=\\p{2}{\\tfrac{324}{373}}\\p{3}{\\approx0{,}87}',
        parts: [
          'enfermos entre positivos',
          'misma proporción reducida',
          'probabilidad actualizada',
        ],
      },
    },
    {
      say: 'Cada test aplica Bayes al resultado del anterior. Con tests independientes, el orden no importa.',
      board: {
        label: 'Regla',
        tex: '\\p{1}{P_{n+1}(E)}=\\p{2}{\\frac{s\\,P_n}{s\\,P_n+(1-e)(1-P_n)}}',
        parts: ['probabilidad del nuevo paso', 'actualización con otro test'],
      },
    },
  ],
};

function RepeatDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Column k={0} show />
      <Column k={1} show />
      <Column k={2} show={beat === 0 && answer !== null} />
      <Cap x={545} y={720} size={20} color={C.muted}>
        La Clínica nunca repitió el test a los positivos.
      </Cap>
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="16{,}2+2{,}45\approx19" color={C.green} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="\tfrac{1{,}8}{1{,}8+46{,}55}\approx0{,}04" color={C.green} />
      )}
    </Stage>
  );
}

function update(p: number, s: number, e: number, positive: boolean) {
  const a = positive ? s * p : (1 - s) * p;
  const b = positive ? (1 - e) * (1 - p) : e * (1 - p);
  return a / (a + b);
}

function SequencePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 131 + round);
    const prev = pick(r, [0.01, 0.02, 0.05]);
    const sens = pick(r, [0.8, 0.9]);
    const spec = pick(r, [0.9, 0.95]);
    const one = update(prev, sens, spec, true);
    const target =
      round === 0
        ? one
        : round === 1
          ? update(one, sens, spec, true)
          : update(one, sens, spec, false);
    return { prev, sens, spec, one, target };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `Prevalencia ${fmt(d.prev * 100, 0)} %, sensibilidad ${fmt(d.sens * 100, 0)} %, especificidad ${fmt(d.spec * 100, 0)} %. `;
    api.prompt(
      base +
        [
          'Una persona da positivo. ¿P(E | +)? Dos decimales.',
          'Da positivo dos veces en tests independientes. ¿P(E | dos positivos)? Dos decimales.',
          'Da positivo y luego negativo. ¿P(E | + y −)? Dos decimales.',
        ][round],
      'P_{n+1}=\\frac{P(\\text{resultado}\\mid E)P_n}{P(\\text{resultado})}',
    );
    api.hints(
      round === 0
        ? ['Usa 100 000 personas y cuenta.', 'Positivos verdaderos sobre todos los positivos.']
        : [
            'Primero calcula P(E | +): es el nuevo punto de partida.',
            round === 1
              ? 'Aplica de nuevo un positivo.'
              : 'Para un negativo usa 1 − s en enfermos y e en sanos.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (Math.abs(v - d.target) < 0.011) return api.result(true, `$P\\approx${tnum(d.target)}$.`);
    if (round > 0 && Math.abs(v - d.one) < 0.011)
      return api.result(
        false,
        'Ese es el resultado después del primer test. Falta actualizar con el segundo.',
      );
    if (Math.abs(v - d.sens) < 0.011 || Math.abs(v - d.sens * d.sens) < 0.011)
      return api.result(
        false,
        'Multiplicar sensibilidades no basta: hay que comparar con los sanos que también dan positivo.',
      );
    return api.result(
      false,
      `Después del primer positivo, $P\\approx${tnum(d.one)}$. Úsalo como punto de partida.`,
    );
  };
  return (
    <Stage>
      <Column k={0} show />
      <Column k={1} show />
      <Column k={2} show />
      <Cap x={545} y={720} size={19} color={C.muted}>
        Columnas de la clase: 2 % → 0,27 → 0,87.
      </Cap>
      <NumberField x={1120} y={420} value={val} onChange={setVal} onEnter={submit} label="P =" />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c3',
  world: 'bayesian',
  code: '10.3',
  title: 'La segunda muestra',
  subtitle: 'Actualización secuencial',
  glyph: 'P(E\\mid++)',
  kind: 'level',
  guide: 'rocio',
  teaser:
    'Con la cifra inflada, nadie repetía el test. Rocío guardó la segunda muestra de cada positivo.',
  learn:
    'Actualizar una probabilidad con varios resultados: el resultado de un test es el punto de partida del siguiente.',
  glyphs: ['by-update'],
  pitfalls: [
    'No basta multiplicar sensibilidades: los sanos también pueden repetir el positivo.',
    'Un negativo después de un positivo baja mucho la probabilidad.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio, ocho y cuarto. Rocío abrió una gaveta del refrigerador, y los tubos de la segunda muestra tintinearon contra el metal.',
        },
        {
          who: 'rocio',
          text: 'Guardé la segunda muestra de cada positivo. Lo hice por costumbre; nadie me la pidió.',
        },
        {
          who: 'teo',
          text: 'Si los repetimos, el primer resultado deja de ser la última palabra.',
        },
        {
          who: 'iris',
          text: 'Repítelos. Quiero saber cuántos de esos pedidos resisten una segunda mirada.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Las muestras repetidas',
      Scene: RepeatDemo,
      beats: [
        {
          say: 'De cada 1000 tests salen 67 positivos: 18 enfermos y 49 sanos. Rocío repite el test a los 67.',
          ask: {
            prompt: '¿Cuántos se esperan positivos de nuevo?',
            options: ['≈ 19', '67', '18'],
            answer: 0,
            explain: '18·0,9 = 16,2 enfermos y 49·0,05 = 2,45 sanos: unos 19 de 67.',
          },
          note: { label: 'Segundo test', tex: '16{,}2+2{,}45\\approx19' },
        },
        {
          say: 'Una persona dio positivo y en la segunda muestra, negativo.',
          ask: {
            prompt: '¿Qué probabilidad tiene de estar enferma?',
            options: ['≈ 0,04', '≈ 0,27', '0'],
            answer: 0,
            explain:
              'Enfermos que dan negativo: 18·0,1 = 1,8. Sanos que dan negativo: 49·0,95 = 46,55. 1,8/48,35 ≈ 0,04.',
          },
          note: {
            label: 'Positivo y luego negativo',
            tex: 'P(E\\mid+,-)\\approx0{,}04',
            body: 'Con una segunda muestra, casi todos los pedidos se caen.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Actualizar dos veces', Comp: SequencePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'El lector terminó la segunda tanda. Hubo diecinueve pitos donde antes había habido sesenta y siete.',
        },
        {
          who: 'rocio',
          text: 'Diecinueve. Y la central nos pedía confirmar los sesenta y siete sin repetir nada.',
        },
        {
          who: 'iris',
          text: 'Quiero entender por qué un negativo pesa tanto. Muéstramelo con chances.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-update',
    world: 'bayesian',
    tex: 'P_{n+1}(E)',
    name: 'Probabilidad actualizada',
    read: 'pe ene más uno de E',
    meaning:
      'Probabilidad después de incorporar un resultado más; sirve de punto de partida para el siguiente.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Punto de partida',
      tex: 'P_0(E)=\\pi',
      body: 'La probabilidad antes del primer test.',
    },
    {
      label: 'Actualización',
      tex: 'P_{n+1}(E)=P(E\\mid\\text{resultados}_1,\\dots,\\text{resultados}_{n+1})',
    },
  ],
  props: [
    { label: 'Positivo', tex: 'P_{n+1}=\\frac{s\\,P_n}{s\\,P_n+(1-e)(1-P_n)}' },
    {
      label: 'Negativo',
      tex: 'P_{n+1}=\\frac{(1-s)P_n}{(1-s)P_n+e(1-P_n)}',
      body: 'Válido para tests independientes dado el estado de salud.',
    },
  ],
};

export { lesson };
