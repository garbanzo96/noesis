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
import { People, fmt, ppv, tnum } from './kit';

// ============================================================================
// CASO 10.2 · «La cifra base» — tasa base y valor predictivo positivo
// El mismo test (s = 0,9; e = 0,95) da VPP ≈ 0,27 con prevalencia 2 % y ≈ 0,82 con 20 %.
// ============================================================================

const LIGHT_AMBER = '#ffe2a8';
const PREV = { x0: 1090, x1: 1420, y: 640, lo: 1, hi: 20 };

/** 1000 people split for a prevalence (in %), sensitivity 0,9 and specificity 0,95 */
function split(prevPct: number) {
  const sick = Math.round(10 * prevPct);
  const tp = Math.round(sick * 0.9);
  const fp = Math.round((1000 - sick) * 0.05);
  return { sick, tp, fp };
}

function BaseRateLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [pct, setPct] = useState(2);
  const { beat } = beats;
  const p = beat === 0 ? 2 : beat === 1 ? pct : 20;
  const { sick, tp, fp } = split(p);
  const value = ppv(p / 100, 0.9, 0.95);
  const drag = useSvgDrag(svg, (px) => {
    const t = clamp((px - PREV.x0) / (PREV.x1 - PREV.x0), 0, 1);
    const next = Math.round(PREV.lo + t * (PREV.hi - PREV.lo));
    setPct(next);
    if (next === 20) unlock();
  });
  return (
    <Stage ref={svg}>
      <People
        groups={[
          { n: tp, color: C.amber },
          { n: sick - tp, color: C.magenta, dim: true },
          { n: fp, color: LIGHT_AMBER },
          { n: 1000 - sick - fp, color: C.cyan, dim: true },
        ]}
      />
      <Cap x={570} y={705} size={20} color={C.muted}>
        Mismo test, s = 0,9 y e = 0,95. Ámbar: positivos.
      </Cap>
      <Cap x={1270} y={200} tex={`\\pi=${p}\\ \\%`} color={C.magenta} />
      <Cap x={1270} y={290} tex={`VP=${tp},\\quad FP=${fp}`} color={C.amber} />
      <Cap
        x={1270}
        y={380}
        tex={`\\text{VPP}\\approx${tnum(value)}`}
        color={value > 0.5 ? C.green : C.text}
      />
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={470} size={20} color={C.green}>
          Los falsos positivos casi no cambiaron.
        </Cap>
      )}
      {beat === 1 && (
        <>
          <line x1={PREV.x0} x2={PREV.x1} y1={PREV.y} y2={PREV.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={PREV.x0 + ((pct - PREV.lo) / (PREV.hi - PREV.lo)) * (PREV.x1 - PREV.x0)}
            y={PREV.y}
            onPointerDown={drag}
            axis="x"
            color={C.magenta}
            label={`${pct} %`}
          />
          <Cap x={1255} y={PREV.y + 60} size={19} color={C.muted}>
            prevalencia
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Tasa base y valor predictivo',
  intro: {
    question: '¿Por qué el mismo test vale distinto en dos poblaciones?',
    text: 'El valor predictivo positivo es la probabilidad de estar enfermo después de un positivo, y depende mucho de qué tan común es la enfermedad, la tasa base. Con una tasa base inflada, cualquier positivo parece confirmado. El sistema de la Clínica usa una prevalencia que nadie del laboratorio eligió.',
  },
  Scene: BaseRateLesson,
  beats: [
    {
      say: 'El **valor predictivo positivo** (VPP) es la probabilidad de tener la enfermedad dado que el test salió positivo. Se lee «probabilidad de E dado positivo» en $P(E\\mid+)$, donde E representa la enfermedad.\n\nCon 2 % de prevalencia, hay 18 positivos verdaderos y 49 falsos entre 1000 personas: aproximadamente 27 de cada 100 positivos corresponden a enfermos. El VPP sirve para interpretar un resultado positivo.',
      board: {
        label: 'Valor predictivo positivo',
        tex: '\\p{1}{\\text{VPP}}=\\p{2}{P(E\\mid+)}',
        parts: ['acierto del positivo', 'enfermedad tras positivo'],
      },
    },
    {
      say: 'La **prevalencia** o tasa base es la proporción de personas que tienen la enfermedad en una población antes de conocer el resultado del test. Se representa con $\\pi$, que se lee «pi». Aquí el test mantiene sensibilidad 0,9 y especificidad 0,95 mientras cambia la prevalencia.',
      gate: 'Sube la prevalencia hasta el máximo que permite la barra. ¿Cómo cambia la fracción de positivos que está enferma?',
      after:
        'Con 20 % de prevalencia, $\\tfrac{180}{180+40}\\approx0{,}82$ de los positivos está enfermo. El test es el mismo: cambió la tasa base.',
      board: {
        label: 'Con 20 % de enfermos',
        tex: '\\p{1}{\\tfrac{180}{180+40}}\\p{2}{\\approx0{,}82}',
        parts: ['enfermos entre positivos', 'acierto del positivo'],
      },
    },
    {
      say: 'El test es el mismo, pero el VPP pasó de 0,27 a 0,82. Compara los conteos de positivos verdaderos y falsos con los que viste al comienzo. ¿Cómo ayuda esa comparación a explicar el cambio?',
      ask: {
        prompt: '¿Por qué cambió tanto el VPP si el test es el mismo?',
        options: [
          'Hay más enfermos para detectar y los sanos aportan casi los mismos falsos',
          'El test mejoró',
          'Bajaron los falsos negativos',
        ],
        answer: 0,
        explain:
          'Los positivos verdaderos crecen de 18 a 180; los falsos apenas bajan, de 49 a 40.',
      },
      board: {
        label: 'La tasa base manda',
        tex: '\\p{1}{\\pi\\uparrow}\\p{2}{\\ \\Rightarrow\\ \\text{VPP}\\uparrow}',
        parts: ['más enfermedad de base', 'mayor acierto del positivo'],
      },
    },
    {
      say: 'La fórmula calcula el VPP como la proporción de positivos que corresponden a personas enfermas. La **sensibilidad** $s$ es la probabilidad de un positivo entre los enfermos; la **especificidad** $e$ es la probabilidad de un negativo entre los sanos.\n\nEl numerador $s\\pi$ representa los positivos verdaderos y el denominador suma también los falsos positivos, $(1-e)(1-\\pi)$. La división requiere que exista una probabilidad positiva de obtener un resultado positivo.',
      board: {
        label: 'Fórmula',
        tex: '\\p{1}{\\text{VPP}}=\\p{2}{\\frac{s\\,\\pi}{s\\,\\pi+(1-e)(1-\\pi)}}',
        parts: ['acierto del positivo', 'enfermos entre positivos'],
      },
    },
    {
      say: 'Para calcular el VPP necesitas la sensibilidad $s$, la especificidad $e$ y la prevalencia $\\pi$ de la población pertinente. La sensibilidad describe resultados entre enfermos; el VPP describe enfermos entre quienes dieron positivo. Confundir ambas probabilidades lleva a interpretar mal el resultado, aunque el test sea el mismo.',
      board: {
        label: 'Tres ingredientes',
        tex: '\\p{1}{s},\\ \\p{2}{e},\\ \\p{3}{\\pi}',
        parts: ['detección de enfermos', 'descarte de sanos', 'enfermedad de base'],
      },
    },
  ],
};

function ReportDemo({ beats, unlock }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { beat } = beats;
  const target = beat <= 1 ? 20 : 2;
  const acting = beat === 0 || beat === 2;
  const [pct, setPct] = useState(2);
  useEffect(() => setPct(beat <= 1 ? 2 : 20), [beat]);
  const drag = useSvgDrag(svg, (px) => {
    if (!acting) return;
    const t = clamp((px - PREV.x0) / (PREV.x1 - PREV.x0), 0, 1);
    const next = Math.round(PREV.lo + t * (PREV.hi - PREV.lo));
    setPct(next);
    if (next === target) unlock();
  });
  const p = acting ? pct : target;
  const { sick, tp, fp } = split(p);
  return (
    <Stage ref={svg}>
      <People
        groups={[
          { n: tp, color: C.amber },
          { n: sick - tp, color: C.magenta, dim: true },
          { n: fp, color: LIGHT_AMBER },
          { n: 1000 - sick - fp, color: C.cyan, dim: true },
        ]}
      />
      <Cap x={570} y={705} size={20} color={C.muted}>
        {beat <= 1 ? 'Cifra cargada en la central: 20 %.' : 'Censo regional: 2 %.'}
      </Cap>
      <Cap x={1270} y={220} tex={`\\pi=${p}\\ \\%`} color={C.magenta} />
      <Cap x={1270} y={310} tex={`VP=${tp},\\quad FP=${fp}`} color={C.amber} />
      <Cap
        x={1270}
        y={400}
        tex={`\\text{VPP}=\\tfrac{${tp}}{${tp + fp}}\\approx${tnum(ppv(p / 100, 0.9, 0.95))}`}
        color={C.green}
      />
      {acting && (
        <>
          <line x1={PREV.x0} x2={PREV.x1} y1={PREV.y} y2={PREV.y} stroke={C.line} strokeWidth={4} />
          <rect
            x={PREV.x0 - 24}
            y={PREV.y - 24}
            width={PREV.x1 - PREV.x0 + 48}
            height={48}
            fill="transparent"
            onPointerDown={drag}
            style={{ cursor: 'pointer', touchAction: 'none' }}
          />
          <Knob
            x={PREV.x0 + ((pct - PREV.lo) / (PREV.hi - PREV.lo)) * (PREV.x1 - PREV.x0)}
            y={PREV.y}
            onPointerDown={drag}
            axis="x"
            color={C.magenta}
            label={`${pct} %`}
          />
          <Cap
            x={PREV.x0 + (PREV.x1 - PREV.x0) / (PREV.hi - PREV.lo)}
            y={PREV.y + 45}
            size={19}
            color={C.muted}
          >
            2 %
          </Cap>
          <Cap x={PREV.x1} y={PREV.y + 45} size={19} color={C.muted}>
            20 %
          </Cap>
        </>
      )}
    </Stage>
  );
}

function PpvPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 127 + round);
    const prev = round === 1 ? pick(r, [0.01, 0.02, 0.05]) : pick(r, [0.1, 0.2, 0.25]);
    const sens = pick(r, [0.8, 0.9]);
    const spec = pick(r, [0.9, 0.95]);
    const N = 2000;
    const sick = Math.round(N * prev);
    const tp = Math.round(sick * sens);
    const fp = Math.round((N - sick) * (1 - spec));
    return { prev, sens, spec, N, sick, tp, fp, value: ppv(prev, sens, spec) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `${d.N} personas, prevalencia ${fmt(d.prev * 100, 0)} %, sensibilidad ${fmt(d.sens * 100, 0)} %, especificidad ${fmt(d.spec * 100, 0)} %.`;
    api.prompt(
      base +
        (round === 0
          ? ' ¿Cuántos positivos hay en total?'
          : ' ¿Cuánto vale el VPP? Escribe dos decimales.'),
      round === 0 ? 'VP+FP' : '\\text{VPP}=\\frac{VP}{VP+FP}',
    );
    api.hints(
      round === 0
        ? [
            'Positivos verdaderos: enfermos por la sensibilidad.',
            'Falsos positivos: sanos por 1 − especificidad.',
          ]
        : ['Cuenta positivos verdaderos y falsos.', 'Divide los verdaderos por la suma.'],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (v === d.tp + d.fp) return api.result(true, `$${d.tp}+${d.fp}=${d.tp + d.fp}$ positivos.`);
      if (v === d.tp)
        return api.result(
          false,
          'Contaste solo los positivos verdaderos. Los sanos también aportan positivos.',
        );
      return api.result(
        false,
        `Verdaderos: $${d.sick}\\cdot${tnum(d.sens)}=${d.tp}$. Falsos: $${d.N - d.sick}\\cdot${tnum(1 - d.spec)}=${d.fp}$.`,
      );
    }
    if (Math.abs(v - d.value) < 0.011)
      return api.result(true, `$\\tfrac{${d.tp}}{${d.tp + d.fp}}\\approx${tnum(d.value)}$.`);
    if (Math.abs(v - d.sens) < 0.011)
      return api.result(false, 'Esa es la sensibilidad. El VPP divide por todos los positivos.');
    if (Math.abs(v - d.prev) < 0.011)
      return api.result(false, 'Esa es la prevalencia, antes de ver el resultado.');
    return api.result(
      false,
      `Positivos: ${d.tp} verdaderos y ${d.fp} falsos; VPP = ${d.tp}/${d.tp + d.fp}.`,
    );
  };
  return (
    <Stage>
      <People
        x={170}
        y={200}
        cols={50}
        gap={15}
        groups={[
          { n: Math.round(d.tp / 2), color: C.amber },
          { n: Math.round((d.sick - d.tp) / 2), color: C.magenta, dim: true },
          { n: Math.round(d.fp / 2), color: LIGHT_AMBER },
          {
            n: Math.round((d.N - d.sick - d.fp) / 2),
            color: C.cyan,
            dim: true,
          },
        ]}
      />
      <Cap x={545} y={700} size={19} color={C.muted}>
        Cada ícono representa a 2 personas.
      </Cap>
      <NumberField
        x={1100}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 0 ? 'positivos =' : 'VPP ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c2',
  world: 'bayesian',
  code: '10.2',
  title: 'La cifra base',
  subtitle: 'Tasa base y valor predictivo',
  glyph: '\\text{VPP}',
  kind: 'level',
  guide: 'rocio',
  teaser: 'El sistema de la Clínica usa una prevalencia que nadie del laboratorio eligió.',
  learn:
    'Ver cómo la prevalencia cambia el valor predictivo positivo de un mismo test y calcularlo con conteos o con la fórmula.',
  glyphs: ['by-ppv', 'by-prevalence'],
  pitfalls: [
    'Un test con buena sensibilidad puede tener VPP bajo si la enfermedad es rara.',
    'La prevalencia usada en el cálculo debe venir de la población real.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Sala de servidores de la Clínica, siete de la mañana. Un ventilador zumbaba detrás de la rejilla, y Teo abrió la configuración del sistema de pedidos.',
        },
        {
          who: 'teo',
          text: 'Aquí está la cifra base: «prevalencia esperada, 20 %». La cargaron desde la central en julio.',
        },
        {
          who: 'rocio',
          text: 'El censo del cerro dice 2 %. Lo sé porque lo cargué yo el año pasado.',
        },
        {
          who: 'iris',
          text: 'Entonces veamos cuánto cambia el pedido con esa diferencia.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La prevalencia del informe',
      Scene: ReportDemo,
      beats: [
        {
          say: 'La central cargó una prevalencia de 20 % para el cálculo del sistema. Veamos qué VPP entrega esa cifra y cómo se reparten los positivos verdaderos y falsos.',
          gate: 'Ajusta la prevalencia a la cifra cargada en la central. Mira los positivos verdaderos y falsos y el VPP que obtiene el sistema.',
          after:
            'Con la cifra de la central, 20 %, el VPP queda cerca de 0,82. Esa prevalencia hace parecer muy confiable cada positivo.',
        },
        {
          say: 'Con 20 % de prevalencia, compara los positivos verdaderos con el total de positivos.',
          ask: {
            prompt: '¿Qué VPP le muestra el sistema a la Clínica?',
            options: ['≈ 0,82', '≈ 0,27', '0,90'],
            answer: 0,
            explain:
              'Con 20 %: 180 verdaderos y 40 falsos; 180/220 ≈ 0,82. Así cada positivo parece casi seguro.',
          },
          note: {
            label: 'VPP con la cifra cargada',
            tex: '\\tfrac{180}{220}\\approx0{,}82',
          },
        },
        {
          say: 'El censo regional indica 2 %. Ajusta la prevalencia sin cambiar el test y observa el VPP.',
          gate: 'Ajusta la prevalencia a la cifra del censo regional. Mira cómo cambia el VPP con el mismo test.',
          after:
            'Con 2 % el VPP cae a $\\tfrac{18}{67}\\approx0{,}27$. El mismo test, en otra población, acierta uno de cada cuatro positivos.',
        },
        {
          say: 'Con 2 % de prevalencia, compara los positivos verdaderos con el total de positivos.',
          ask: {
            prompt: '¿Cuál es el VPP real del test en el cerro?',
            options: ['≈ 0,27', '≈ 0,82', '0,02'],
            answer: 0,
            explain:
              'Con 2 %: 18 verdaderos y 49 falsos; 18/67 ≈ 0,27. Tres de cada cuatro positivos están sanos.',
          },
          note: {
            label: 'VPP real',
            tex: '\\tfrac{18}{67}\\approx0{,}27',
            body: 'La cifra base inflada hace que cada positivo parezca un enfermo seguro.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Valor predictivo',
      Comp: PpvPractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Rocío imprimió la configuración y la dobló en cuatro. El papel salió tibio.',
        },
        {
          who: 'rocio',
          text: 'Con esa cifra nadie repite el test. ¿Para qué, si el sistema dice 82 %?',
        },
        {
          who: 'iris',
          text: 'Repitámoslo nosotros. Quiero ver qué pasa con una segunda muestra.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-ppv',
    world: 'bayesian',
    tex: '\\text{VPP}',
    name: 'Valor predictivo positivo',
    read: 've pe pe',
    meaning: 'Probabilidad de tener la enfermedad dado un resultado positivo.',
    warn: 'Depende de la prevalencia, no solo del test.',
  },
  {
    id: 'by-prevalence',
    world: 'bayesian',
    tex: '\\pi',
    name: 'Prevalencia',
    read: 'pi',
    meaning: 'Fracción de la población que tiene la enfermedad; es la probabilidad antes del test.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'VPP',
      tex: '\\text{VPP}=P(E\\mid+)',
      body: 'Fracción de positivos que tienen la enfermedad.',
    },
    {
      label: 'Tasa base',
      tex: '\\pi=P(E)',
      body: 'Probabilidad antes de ver el resultado.',
    },
  ],
  props: [
    {
      label: 'Fórmula del VPP',
      tex: '\\text{VPP}=\\frac{s\\,\\pi}{s\\,\\pi+(1-e)(1-\\pi)}',
    },
    {
      label: 'Efecto de la tasa base',
      tex: '\\pi\\uparrow\\Rightarrow\\text{VPP}\\uparrow',
      body: 'Con el mismo test, más enfermos dan positivos más confiables.',
    },
  ],
};

export { lesson };
