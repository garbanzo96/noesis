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
// CASO 10.1 · «Mil personas» — Bayes con frecuencias naturales
// Prevalencia 2 %, sensibilidad 90 %, especificidad 95 %: de 1000 personas, 18 positivos
// verdaderos y 49 falsos; P(enfermo | +) = 18/67 ≈ 0,27.
// ============================================================================

const LIGHT_AMBER = '#ffe2a8';
const SENS = { x0: 1090, x1: 1420, y: 640 };

function CrowdLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [s, setS] = useState(0.5);
  const { beat } = beats;
  const sens = beat === 1 ? s : 0.9;
  const tp = beat === 0 ? 0 : Math.round(20 * sens);
  const fp = beat >= 2 ? 49 : 0;
  const onlyPositives = (beat === 3 && answer !== null) || beat >= 4;
  const drag = useSvgDrag(svg, (px) => {
    const v = Math.round(clamp((px - SENS.x0) / (SENS.x1 - SENS.x0), 0, 1) * 10) / 10;
    setS(v);
    if (v === 0.9) unlock();
  });
  return (
    <Stage ref={svg}>
      <People
        groups={[
          { n: tp, color: C.amber },
          { n: 20 - tp, color: C.magenta, dim: onlyPositives },
          { n: fp, color: LIGHT_AMBER },
          { n: 980 - fp, color: C.cyan, dim: beat >= 1 },
        ]}
      />
      <Cap x={570} y={705} size={20} color={C.muted}>
        1000 personas de la campaña. Cada ícono es una persona.
      </Cap>
      <Cap x={1270} y={200} tex="\text{enfermos}=1000\cdot0{,}02=20" color={C.magenta} />
      {beat >= 1 && (
        <Cap x={1270} y={290} tex={`\\text{positivos verdaderos}=${tp}`} color={C.amber} />
      )}
      {beat >= 2 && (
        <Cap x={1270} y={380} tex="\text{falsos positivos}=980\cdot0{,}05=49" color={C.text} />
      )}
      {onlyPositives && (
        <Cap x={1270} y={470} tex="P(E\mid+)=\tfrac{18}{67}\approx0{,}27" color={C.green} />
      )}
      {beat === 1 && (
        <>
          <line x1={SENS.x0} x2={SENS.x1} y1={SENS.y} y2={SENS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={SENS.x0 + s * (SENS.x1 - SENS.x0)}
            y={SENS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${Math.round(s * 100)} %`}
          />
          <Cap x={1255} y={SENS.y + 60} size={19} color={C.muted}>
            sensibilidad del test
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Bayes con frecuencias',
  intro: {
    question: '¿Cuántos de los positivos de un test están enfermos de verdad?',
    text: 'Empieza la inferencia bayesiana: cómo pasar de un dato a una conclusión sobre lo que no se ve. Contar con mil personas imaginarias es la manera más clara de hacerlo: cuántas están enfermas, cuántas dan positivo, cuántos positivos son falsos. El lector de la Clínica pitó 67 veces este turno.',
  },
  Scene: CrowdLesson,
  beats: [
    {
      say: 'La **prevalencia** es la proporción de una población que tiene una enfermedad en un momento determinado. Sirve para estimar cuántas personas están enfermas antes de conocer el resultado de un test.\n\nEn este grupo de 1000 personas, la prevalencia es 2 %: hay 20 enfermas y 980 sanas.',
      board: {
        label: 'Prevalencia',
        tex: '\\p{1}{1000\\cdot0{,}02}=\\p{2}{20}',
        parts: ['personas por prevalencia', 'personas enfermas'],
      },
    },
    {
      say: 'La **sensibilidad** es la proporción de personas enfermas que dan positivo en el test. Se calcula entre los enfermos, no entre todas las personas examinadas.\n\nLa pizarra indica cuántos de los 20 enfermos detecta el test de la Clínica; usa ese dato para encontrar su sensibilidad.',
      gate: 'Ajusta la sensibilidad hasta que el número de enfermos detectados coincida con la pizarra. Mira el porcentaje de la perilla.',
      after:
        'Con sensibilidad de 90 %, el test detecta 18 de los 20 enfermos. Los otros 2 dan negativo, aunque están enfermos.',
      board: {
        label: 'Positivos verdaderos',
        tex: '\\p{1}{20\\cdot0{,}9}=\\p{2}{18}',
        parts: ['enfermos por sensibilidad', 'enfermos detectados'],
      },
    },
    {
      say: 'La **especificidad** es la proporción de personas sanas que dan negativo en el test. Una especificidad de 95 % deja un 5 % de sanos con resultado positivo: son **falsos positivos**.\n\nEse 5 % se calcula sobre los 980 sanos, no sobre las 1000 personas; por eso hay 49 falsos positivos.',
      board: {
        label: 'Falsos positivos',
        tex: '\\p{1}{980\\cdot0{,}05}=\\p{2}{49}',
        parts: ['sanos por tasa de error', 'sanos con positivo'],
      },
    },
    {
      say: 'Alguien da positivo y queremos saber qué probabilidad tiene de estar enfermo. Para responder, contamos a los enfermos entre todas las personas con resultado positivo. La sensibilidad responde otra pregunta: qué proporción de los enfermos da positivo.',
      ask: {
        prompt: 'Si alguien da positivo, ¿qué probabilidad tiene de estar enfermo?',
        options: ['18/67 ≈ 0,27', '0,90', '0,95'],
        answer: 0,
        explain:
          'Hay 18 + 49 = 67 positivos y solo 18 están enfermos. El 0,90 es la sensibilidad: responde otra pregunta.',
      },
      board: {
        label: 'Después de un positivo',
        tex: '\\p{1}{P(E\\mid+)}=\\p{2}{\\tfrac{18}{18+49}}\\p{3}{\\approx0{,}27}',
        parts: [
          'probabilidad de enfermedad',
          'enfermos entre positivos',
          'probabilidad tras positivo',
        ],
      },
    },
    {
      say: 'El **teorema de Bayes** permite calcular una probabilidad condicionada al observar un resultado. Aquí, $P(E\\mid+)$ se lee «probabilidad de enfermedad dado un positivo» y $P(+\\mid E)$, «probabilidad de positivo dada la enfermedad».\n\nSe multiplica la sensibilidad $P(+\\mid E)$ por la prevalencia $P(E)$ y se divide por la probabilidad de positivo $P(+)$, que debe ser mayor que cero.',
      board: {
        label: 'Bayes',
        tex: '\\p{1}{P(E\\mid+)}=\\p{2}{\\frac{P(+\\mid E)\\,P(E)}{P(+)}}',
        parts: ['probabilidad tras positivo', 'enfermos entre positivos'],
      },
    },
  ],
};

function ShiftSheet({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { beat } = beats;
  const [s, setS] = useState(0.5);
  const [doses, setDoses] = useState(18);
  useEffect(() => {
    setS(0.5);
    setDoses(18);
  }, [beat]);
  const sens = beat === 0 ? s : 0.9;
  const tp = Math.round(20 * sens);
  const drag = useSvgDrag(svg, (x) => {
    const v = clamp((x - SENS.x0) / (SENS.x1 - SENS.x0), 0, 1);
    if (beat === 0) {
      const next = Math.round(v * 10) / 10;
      setS(next);
      if (next === 0.9) unlock();
    } else if (beat === 2) {
      const next = Math.round(v * 100);
      const reached = Math.abs(next - 67) <= 1;
      setDoses(reached ? 67 : next);
      if (reached) unlock();
    }
  });
  return (
    <Stage ref={svg}>
      <People
        groups={[
          { n: tp, color: C.amber },
          { n: 20 - tp, color: C.magenta, dim: true },
          { n: 49, color: LIGHT_AMBER },
          { n: 931, color: C.cyan, dim: true },
        ]}
      />
      <Cap x={570} y={705} size={20} color={C.muted}>
        Último lote: 1000 tests, 67 positivos.
      </Cap>
      <Cap x={1270} y={220} size={22} color={C.amber}>
        Planilla del turno: 67 positivos
      </Cap>
      <Cap x={1270} y={310} size={22} color={C.green}>
        {`Enfermos detectados: 20 · ${fmt(sens, 1)} = ${tp}`}
      </Cap>
      <Cap x={1270} y={380} size={20} color={C.muted}>
        Sanos con positivo: 980 · 0,05 = 49
      </Cap>
      {beat >= 2 && (
        <Cap x={1270} y={450} size={22} color={C.magenta}>
          La Clínica pidió dosis para 67.
        </Cap>
      )}
      {(beat === 0 || beat === 2) && (
        <>
          <line x1={SENS.x0} x2={SENS.x1} y1={SENS.y} y2={SENS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={SENS.x0 + (beat === 0 ? s : doses / 100) * (SENS.x1 - SENS.x0)}
            y={SENS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={beat === 0 ? `${Math.round(s * 100)} %` : `${doses} dosis`}
          />
          <Cap x={1255} y={SENS.y + 60} size={19} color={C.muted}>
            {beat === 0
              ? 'sensibilidad del test (0–100 %)'
              : `pedido (0–100 dosis): ${doses - 18} sobre los 18 esperados`}
          </Cap>
        </>
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={530} size={20} color={C.magenta}>
          67 − 18 = 49 dosis de más.
        </Cap>
      )}
    </Stage>
  );
}

function CountPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 113 + round);
    const prev = pick(r, [0.01, 0.02, 0.05, 0.1]);
    const sens = pick(r, [0.8, 0.9, 0.95]);
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
    const base = `En ${d.N} personas, prevalencia ${fmt(d.prev * 100, 0)} %, sensibilidad ${fmt(d.sens * 100, 0)} % y especificidad ${fmt(d.spec * 100, 0)} %.`;
    const ask = [
      ' ¿Cuántos positivos verdaderos esperas?',
      ' ¿Cuántos falsos positivos esperas?',
      ' Si alguien da positivo, ¿qué probabilidad tiene de estar enfermo? Escribe dos decimales.',
    ][round];
    api.prompt(base + ask, ['N\\cdot\\pi\\cdot s', 'N(1-\\pi)(1-e)', '\\frac{VP}{VP+FP}'][round]);
    api.hints(
      [
        [
          'Primero cuenta a los enfermos con la prevalencia.',
          'Multiplica los enfermos por la sensibilidad.',
        ],
        [
          'Primero cuenta a los sanos: el total menos los enfermos.',
          'Los sanos que dan positivo son 1 − especificidad.',
        ],
        [
          'Calcula positivos verdaderos y falsos.',
          'Divide los verdaderos por todos los positivos.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (v === d.tp)
        return api.result(true, `$${d.sick}\\cdot${tnum(d.sens)}=${d.tp}$ positivos verdaderos.`);
      if (Math.abs(v - d.N * d.sens) < 0.5)
        return api.result(
          false,
          'Multiplicaste a todos por la sensibilidad. Solo los enfermos pueden ser positivos verdaderos.',
        );
      return api.result(
        false,
        `Enfermos: $${d.N}\\cdot${tnum(d.prev)}=${d.sick}$. Luego, por la sensibilidad.`,
      );
    }
    if (round === 1) {
      if (v === d.fp)
        return api.result(
          true,
          `$${d.N - d.sick}\\cdot${tnum(1 - d.spec)}=${d.fp}$ falsos positivos.`,
        );
      if (Math.abs(v - d.N * (1 - d.spec)) < 0.5)
        return api.result(
          false,
          'Usaste a todas las personas. Los falsos positivos salen solo de los sanos.',
        );
      return api.result(
        false,
        `Sanos: ${d.N - d.sick}. El ${fmt((1 - d.spec) * 100, 0)} % de ellos da positivo.`,
      );
    }
    if (Math.abs(v - d.value) < 0.011)
      return api.result(true, `$\\tfrac{${d.tp}}{${d.tp}+${d.fp}}\\approx${tnum(d.value)}$.`);
    if (Math.abs(v - d.sens) < 0.011)
      return api.result(false, 'Esa es la sensibilidad: P(+ | E). Aquí se pide P(E | +).');
    return api.result(
      false,
      `Positivos: ${d.tp} verdaderos y ${d.fp} falsos. Divide ${d.tp} por ${d.tp + d.fp}.`,
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
          { n: Math.round((d.sick - d.tp) / 2), color: C.magenta },
          { n: Math.round(d.fp / 2), color: LIGHT_AMBER },
          { n: Math.round((d.N - d.sick - d.fp) / 2), color: C.cyan, dim: true },
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
        label={['VP =', 'FP =', 'P(E | +) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c1',
  world: 'bayesian',
  code: '10.1',
  title: 'Mil personas',
  subtitle: 'Bayes con frecuencias naturales',
  glyph: 'P(E\\mid+)',
  kind: 'level',
  guide: 'rocio',
  teaser: 'El lector de la Clínica pita con cada positivo. Este turno pitó 67 veces.',
  learn:
    'Calcular la probabilidad de estar enfermo después de un positivo contando personas: positivos verdaderos sobre todos los positivos.',
  glyphs: ['by-posterior', 'by-sensitivity'],
  pitfalls: [
    'P(E | +) no es la sensibilidad P(+ | E).',
    'Los falsos positivos salen de los sanos, que son casi todos cuando la enfermedad es rara.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Clínica del Cerro, seis y diez de la mañana. El lector de tests pitaba, se callaba y volvía a pitar, y en el refrigerador las vacunas tenían etiquetas nuevas.',
        },
        {
          who: 'rocio',
          text: 'Sesenta y siete positivos en el turno. Con cada uno, el sistema autoriza más dosis para el cerro.',
        },
        { who: 'iris', text: 'Entonces, sesenta y siete enfermos.' },
        {
          who: 'rocio',
          text: 'Sesenta y siete pitos, que no es lo mismo. Y nadie aquí tiene tiempo de explicarlo.',
        },
        { who: 'teo', text: 'La planilla trae el lote completo, mil tests. Puedo separarlos.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La planilla del turno',
      Scene: ShiftSheet,
      beats: [
        {
          say: 'El test de la campaña tiene especificidad 95 % y el censo regional da 2 % de prevalencia. Busquemos la sensibilidad que concuerda con los positivos de la planilla.',
          gate: 'Ajusta la sensibilidad hasta que los enfermos detectados y los 49 positivos de personas sanas sumen los positivos de la planilla. Mira el porcentaje de la perilla.',
          after:
            'Con sensibilidad de 90 %, son 18 positivos verdaderos y 49 falsos: 67 en total. La mayoría de los positivos está sana.',
        },
        {
          say: 'La planilla registra 67 positivos. De ellos, 49 vienen de personas sanas; calculemos cuántos enfermos detectó el test.',
          ask: {
            prompt: 'De los 67 positivos, ¿cuántos se esperan enfermos?',
            options: ['18', '67', '60'],
            answer: 0,
            explain: '1000 · 0,02 · 0,9 = 18. Los otros 49 son sanos que dieron positivo.',
          },
          note: { label: 'Positivos del turno', tex: '18+49=67' },
        },
        {
          say: 'La Clínica pidió dosis según la planilla del turno. Comparemos ese pedido con los enfermos esperados.',
          gate: 'Ajusta el pedido para que coincida con el de la Clínica. Mira cuántas dosis supera a los 18 enfermos esperados.',
          after:
            'La Clínica pidió 67 dosis para 18 enfermos esperados: son 49 dosis más. El pedido coincide con el total de positivos, que incluye a 49 personas sanas.',
        },
        {
          say: 'El pedido supera en 49 dosis a los 18 enfermos esperados. Revisemos qué cifra de la planilla usó la Clínica.',
          ask: {
            prompt: '¿Qué cifra usó la Clínica para pedir dosis?',
            options: [
              'Los 67 positivos como si fueran enfermos',
              'Los 18 esperados',
              'Los 49 falsos',
            ],
            answer: 0,
            explain:
              'El pedido cuenta pitos, no enfermos. Con 18 esperados, sobran casi cincuenta pedidos por turno.',
          },
          note: {
            label: 'El pedido',
            tex: 'P(E\\mid+)\\approx0{,}27',
            body: 'Solo uno de cada cuatro positivos está enfermo con estos números.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Contar positivos', Comp: CountPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Rocío escribió 18 en la pizarra y lo encerró en un círculo. El plumón chilló contra la superficie.',
        },
        { who: 'rocio', text: 'Dieciocho. Y aun así pedimos dosis para sesenta y siete.' },
        { who: 'iris', text: 'El 2 % sale del censo. ¿Qué cifra usa el sistema de la Clínica?' },
        { who: 'rocio', text: 'Esa no la elegí yo. Viene cargada desde la central.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-posterior',
    world: 'bayesian',
    tex: 'P(E\\mid+)',
    name: 'Probabilidad después de un positivo',
    read: 'pe de E dado positivo',
    meaning: 'Fracción de los positivos que de verdad tienen la enfermedad.',
    warn: 'No es la sensibilidad P(+ | E).',
  },
  {
    id: 'by-sensitivity',
    world: 'bayesian',
    tex: 'P(+\\mid E)',
    name: 'Sensibilidad',
    read: 'pe de positivo dado E',
    meaning: 'Fracción de los enfermos que el test detecta.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Sensibilidad',
      tex: 's=P(+\\mid E)',
      body: 'Fracción de enfermos con resultado positivo.',
    },
    {
      label: 'Especificidad',
      tex: 'e=P(-\\mid E^c)',
      body: 'Fracción de sanos con resultado negativo.',
    },
    {
      label: 'Prevalencia',
      tex: '\\pi=P(E)',
      body: 'Fracción de la población que tiene la enfermedad.',
    },
  ],
  props: [
    { label: 'Bayes', tex: 'P(E\\mid+)=\\frac{P(+\\mid E)P(E)}{P(+)}' },
    {
      label: 'Con conteos',
      tex: 'P(E\\mid+)=\\frac{VP}{VP+FP}',
      body: 'Positivos verdaderos sobre todos los positivos.',
    },
  ],
};

export { lesson };
