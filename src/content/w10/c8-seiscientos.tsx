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
// CASO 10.8 · «Seiscientos» — predicción y decisión
// P(+) = 0,02·0,9 + 0,98·0,05 = 0,067 → en 3000 tests se esperan 201 positivos; la Clínica
// reportó 600. Con costos 1 (tratar a un sano) y 4 (no tratar a un enfermo), el umbral es 0,2.
// ============================================================================

const PPLUS = 0.02 * 0.9 + 0.98 * 0.05;
const NS = { x0: 1110, x1: 1400, y: 660, lo: 500, hi: 3000 };
const LINE = { x0: 200, x1: 900, y: 520 };
const lx = (p: number) => LINE.x0 + p * (LINE.x1 - LINE.x0);

function Counts({ n, reported }: { n: number; reported: boolean }) {
  const expected = Math.round(n * PPLUS);
  const scale = 380 / 600;
  return (
    <g>
      <rect
        x={300}
        y={620 - expected * scale}
        width={180}
        height={expected * scale}
        rx={8}
        fill={C.amber}
        fillOpacity={0.8}
      />
      <Cap x={390} y={620 - expected * scale - 28} size={24} color={C.amber}>
        {expected}
      </Cap>
      <Cap x={390} y={654} size={20} color={C.muted}>
        positivos esperados
      </Cap>
      {reported && (
        <>
          <rect
            x={580}
            y={620 - 600 * scale}
            width={180}
            height={600 * scale}
            rx={8}
            fill={C.magenta}
            fillOpacity={0.8}
          />
          <Cap x={670} y={620 - 600 * scale - 28} size={24} color={C.magenta}>
            600
          </Cap>
          <Cap x={670} y={654} size={20} color={C.muted}>
            positivos reportados
          </Cap>
        </>
      )}
      <line x1={250} x2={820} y1={620} y2={620} stroke={C.line} strokeWidth={2} />
    </g>
  );
}

function Threshold({ t, points }: { t: number; points: [string, number, string][] }) {
  return (
    <g>
      <line x1={LINE.x0} x2={LINE.x1} y1={LINE.y} y2={LINE.y} stroke={C.text} strokeWidth={3} />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <Cap key={v} x={lx(v)} y={LINE.y + 34} size={18} color={C.muted}>
          {fmt(v, 2)}
        </Cap>
      ))}
      <rect
        x={lx(t)}
        y={LINE.y - 60}
        width={lx(1) - lx(t)}
        height={60}
        fill={C.green}
        fillOpacity={0.12}
      />
      <line
        x1={lx(t)}
        x2={lx(t)}
        y1={LINE.y - 90}
        y2={LINE.y + 10}
        stroke={C.green}
        strokeWidth={3}
        strokeDasharray="8 6"
      />
      <Cap x={lx(t)} y={LINE.y - 112} size={20} color={C.green} tex={`\\text{umbral}=${tnum(t)}`} />
      <Cap x={(lx(t) + lx(1)) / 2} y={LINE.y - 30} size={19} color={C.green}>
        tratar
      </Cap>
      {points.map(([label, p, col]) => (
        <g key={label}>
          <circle cx={lx(p)} cy={LINE.y} r={12} fill={col} />
          <Cap x={lx(p)} y={LINE.y + 74} size={19} color={col}>
            {label}
          </Cap>
        </g>
      ))}
    </g>
  );
}

function PredictionLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [n, setN] = useState(1000);
  const { beat } = beats;
  const nn = beat === 1 ? n : 3000;
  const drag = useSvgDrag(svg, (px) => {
    const t = clamp((px - NS.x0) / (NS.x1 - NS.x0), 0, 1);
    const next = Math.round((NS.lo + t * (NS.hi - NS.lo)) / 500) * 500;
    setN(next);
    if (next === 3000) unlock();
  });
  const decision = beat >= 3;
  return (
    <Stage ref={svg}>
      {!decision && beat >= 1 && <Counts n={nn} reported={beat === 2 && answer !== null} />}
      {beat === 0 && (
        <g>
          <rect
            x={250}
            y={260}
            width={620}
            height={70}
            rx={10}
            fill={C.amber}
            fillOpacity={0.15}
            stroke={C.amber}
          />
          <rect
            x={250}
            y={260}
            width={(620 * 0.018) / PPLUS}
            height={70}
            rx={10}
            fill={C.amber}
            fillOpacity={0.85}
          />
          <Cap x={560} y={230} size={20} color={C.muted}>
            De cada 1000 tests, 67 positivos: 18 de enfermos y 49 de sanos.
          </Cap>
        </g>
      )}
      {decision && (
        <Threshold
          t={0.2}
          points={[
            ['un negativo: 0,002', 0.002, C.cyan],
            ['un positivo: 0,27', 18 / 67, C.amber],
            ['dos positivos: 0,87', 324 / 373, C.magenta],
          ]}
        />
      )}
      <Cap x={1270} y={200} tex="P(+)=0{,}018+0{,}049=0{,}067" color={C.amber} />
      {beat >= 1 && !decision && (
        <Cap
          x={1270}
          y={290}
          tex={`${nn}\\cdot0{,}067\\approx${Math.round(nn * PPLUS)}`}
          color={C.amber}
        />
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={380} tex="600\approx3\cdot201" color={C.magenta} />
      )}
      {decision && (
        <Cap
          x={1270}
          y={290}
          tex="\tfrac{c_{FP}}{c_{FP}+c_{FN}}=\tfrac{1}{1+4}=0{,}2"
          color={C.green}
        />
      )}
      {beat === 1 && (
        <>
          <line x1={NS.x0} x2={NS.x1} y1={NS.y} y2={NS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={NS.x0 + ((n - NS.lo) / (NS.hi - NS.lo)) * (NS.x1 - NS.x0)}
            y={NS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${n}`}
          />
          <Cap x={1255} y={NS.y + 60} size={19} color={C.muted}>
            tests realizados
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Predicción y decisión',
  Scene: PredictionLesson,
  beats: [
    {
      say: 'Antes de ver un resultado, la probabilidad de un positivo suma los dos caminos: enfermos detectados y sanos equivocados.',
      board: {
        label: 'Probabilidad de un positivo',
        tex: '\\p{1}{P(+)}=\\p{2}{s\\,\\pi+(1-e)(1-\\pi)}=\\p{3}{0{,}067}',
        parts: ['probabilidad de positivo', 'aporte de ambos grupos', 'probabilidad total'],
      },
    },
    {
      say: 'Con esa probabilidad se predice cuántos positivos deberían salir. Sube la cantidad de tests hasta el informe de agosto.',
      gate: 'Arrastra la perilla hasta 3000 tests.',
      board: {
        label: 'Positivos esperados',
        tex: '\\p{1}{E[\\#+]}=\\p{2}{n\\cdot P(+)}=\\p{3}{3000\\cdot0{,}067\\approx201}',
        parts: ['cantidad esperada', 'tests por probabilidad', 'positivos esperados'],
      },
    },
    {
      say: 'El informe de agosto de la Clínica dice 600 positivos en esos 3000 tests.',
      ask: {
        prompt: '¿Qué indican 600 positivos donde se esperaban unos 201?',
        options: [
          'Que el lector o la prevalencia fueron alterados',
          'Que la enfermedad se triplicó',
          'Nada: es azar',
        ],
        answer: 0,
        explain:
          'Con 3000 tests, el azar mueve el conteo en unas pocas decenas, no en 400. Algo cambió en el test o en las cifras.',
      },
      board: {
        label: 'Comparar con lo esperado',
        tex: '\\p{1}{600}\\p{2}{\\gg201}',
        parts: ['positivos observados', 'muy sobre lo esperado'],
      },
    },
    {
      say: 'Decidir también tiene costos: tratar a un sano cuesta 1; no tratar a un enfermo, 4. Conviene tratar cuando la probabilidad pasa el umbral.',
      board: {
        label: 'Umbral',
        tex: '\\p{1}{\\text{tratar si }P(E\\mid\\text{datos})}\\p{2}{>\\frac{c_{FP}}{c_{FP}+c_{FN}}=0{,}2}',
        parts: ['riesgo para decidir tratar', 'umbral según costos'],
      },
    },
    {
      say: 'Con un positivo, 0,27 pasa el umbral: se trata. Con un negativo, 0,002 no: se va a casa. La decisión usa todo lo aprendido.',
      board: {
        label: 'Decisión',
        tex: '\\p{1}{0{,}27>0{,}2}\\ \\p{2}{\\Rightarrow\\text{tratar}}',
        parts: ['riesgo supera el umbral', 'decisión de tratar'],
      },
    },
  ],
};

function AugustReport({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Counts n={3000} reported />
      {beat === 0 && answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex="0{,}018+0{,}98\,x=0{,}2\Rightarrow x\approx0{,}19"
          color={C.green}
        />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="P(E\mid+)=\tfrac{0{,}018}{0{,}2}=0{,}09<0{,}2" color={C.green} />
      )}
    </Stage>
  );
}

function DecisionPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 157 + round);
    const prev = pick(r, [0.01, 0.02, 0.05]);
    const sens = pick(r, [0.8, 0.9]);
    const spec = pick(r, [0.9, 0.95]);
    const n = pick(r, [1000, 2000, 4000]);
    const cfp = pick(r, [1, 2]);
    const cfn = pick(r, [3, 4, 9]);
    const pplus = sens * prev + (1 - spec) * (1 - prev);
    return { prev, sens, spec, n, cfp, cfn, pplus, expected: n * pplus, t: cfp / (cfp + cfn) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `Prevalencia ${fmt(d.prev * 100, 0)} %, sensibilidad ${fmt(d.sens * 100, 0)} %, especificidad ${fmt(d.spec * 100, 0)} %. `;
    api.prompt(
      [
        base + '¿Cuánto vale P(+)? Tres decimales.',
        base + `¿Cuántos positivos esperas en ${d.n} tests? Redondea al entero.`,
        `Tratar a un sano cuesta ${d.cfp} y no tratar a un enfermo cuesta ${d.cfn}. ¿Cuál es el umbral de probabilidad para tratar? Dos decimales.`,
      ][round],
      ['P(+)=s\\pi+(1-e)(1-\\pi)', 'n\\cdot P(+)', '\\frac{c_{FP}}{c_{FP}+c_{FN}}'][round],
    );
    api.hints(
      [
        ['Enfermos que dan positivo: s·π.', 'Sanos que dan positivo: (1 − e)(1 − π).'],
        ['Calcula primero P(+).', 'Multiplica por la cantidad de tests.'],
        [
          'El umbral pone en la balanza los dos costos.',
          'Costo de tratar de más sobre la suma de ambos costos.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.pplus) < 0.0011) return api.result(true, `$P(+)=${tnum(d.pplus, 3)}$.`);
      if (Math.abs(v - d.sens * d.prev) < 0.0011)
        return api.result(false, 'Faltan los sanos que dan positivo: (1 − e)(1 − π).');
      return api.result(
        false,
        `$${tnum(d.sens)}\\cdot${tnum(d.prev)}+${tnum(1 - d.spec)}\\cdot${tnum(1 - d.prev)}$.`,
      );
    }
    if (round === 1) {
      if (Math.abs(v - d.expected) <= 1)
        return api.result(
          true,
          `$${d.n}\\cdot${tnum(d.pplus, 3)}\\approx${Math.round(d.expected)}$.`,
        );
      if (Math.abs(v - d.n * d.prev) <= 1)
        return api.result(
          false,
          'Ese es el número de enfermos. Los positivos incluyen falsos positivos.',
        );
      return api.result(false, `P(+) = ${fmt(d.pplus, 3)}; multiplícalo por ${d.n}.`);
    }
    if (Math.abs(v - d.t) < 0.011)
      return api.result(true, `$\\tfrac{${d.cfp}}{${d.cfp}+${d.cfn}}\\approx${tnum(d.t)}$.`);
    if (Math.abs(v - d.cfn / (d.cfp + d.cfn)) < 0.011)
      return api.result(false, 'Invertiste los costos: arriba va el costo de tratar a un sano.');
    return api.result(false, `Umbral = ${d.cfp}/(${d.cfp} + ${d.cfn}).`);
  };
  return (
    <Stage>
      <Cap x={545} y={380} size={22} color={C.muted}>
        {round < 2 ? 'Predice antes de mirar el informe.' : 'Pon en la balanza los dos errores.'}
      </Cap>
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P(+) =', 'positivos =', 'umbral ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-c8',
  world: 'bayesian',
  code: '10.8',
  title: 'Seiscientos',
  subtitle: 'Predicción y decisión',
  glyph: 'E[\\#+]',
  kind: 'level',
  guide: 'rocio',
  teaser:
    'El informe de agosto pide dosis para 600 positivos. Con el test honesto se esperaban unos 200.',
  learn:
    'Predecir cuántos positivos deberían salir, compararlos con lo reportado y decidir con un umbral que pondera costos.',
  glyphs: ['by-predictive', 'by-threshold'],
  pitfalls: [
    'Los positivos esperados incluyen los falsos positivos.',
    'El umbral pone arriba el costo de tratar a un sano.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Oficina de la dirección, veinte para las cuatro. El informe de agosto estaba abierto en la pantalla, con el cursor parpadeando sobre «600».',
        },
        {
          who: 'rocio',
          text: 'Seiscientos positivos. Con eso la central mandó tres camiones de dosis.',
        },
        { who: 'iris', text: 'Con todo lo que sabemos del test, ¿cuántos debieron salir?' },
        {
          who: 'teo',
          text: 'Se puede predecir antes de mirar el informe, y después lo comparamos.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El informe de agosto',
      Scene: AugustReport,
      beats: [
        {
          say: 'Si el lector alterado marca positivos de más en sanos, ¿qué tasa de falsos positivos explicaría 600 de 3000?',
          ask: {
            prompt: '¿Qué tasa de falsos positivos x explica 600 positivos en 3000?',
            options: ['≈ 0,19', '0,05', '0,20'],
            answer: 0,
            explain:
              '600/3000 = 0,2 = 0,018 + 0,98·x, así que x ≈ 0,19. Casi cuatro veces el 5 % del test honesto.',
          },
          note: { label: 'Falsos positivos del lector', tex: 'x\\approx0{,}19' },
        },
        {
          say: 'Con ese lector, un positivo ya no significa lo mismo.',
          ask: {
            prompt: 'Con el lector alterado, P(E | +) ≈ 0,09. Con umbral 0,2, ¿qué conviene?',
            options: [
              'Repetir el test antes de tratar o pedir dosis',
              'Tratar a todos los positivos',
              'Pedir más dosis',
            ],
            answer: 0,
            explain:
              '0,09 está bajo el umbral 0,2: un positivo de ese lector no alcanza para tratar ni para pedir dosis.',
          },
          note: {
            label: 'Decisión',
            tex: '0{,}09<0{,}2',
            body: 'Los positivos del lector alterado no justifican los pedidos de dosis.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Predecir y decidir', Comp: DecisionPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Rocío imprimió el informe y escribió 201 al lado del 600, con su firma.',
        },
        { who: 'rocio', text: 'Esto lo firmo yo. Lo otro lo firmó la máquina del Laboratorio.' },
        { who: 'iris', text: 'Prepara el informe completo, con las cinco cifras.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'by-predictive',
    world: 'bayesian',
    tex: 'P(+)',
    name: 'Probabilidad de un positivo',
    read: 'pe de positivo',
    meaning:
      'Probabilidad de un resultado positivo antes de verlo, sumando enfermos detectados y sanos equivocados.',
  },
  {
    id: 'by-threshold',
    world: 'bayesian',
    tex: '\\frac{c_{FP}}{c_{FP}+c_{FN}}',
    name: 'Umbral de decisión',
    read: 'umbral de tratamiento',
    meaning: 'Probabilidad a partir de la cual conviene tratar, dados los costos de cada error.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Probabilidad de un positivo', tex: 'P(+)=s\\,\\pi+(1-e)(1-\\pi)' },
    {
      label: 'Umbral',
      tex: 'p^*=\\frac{c_{FP}}{c_{FP}+c_{FN}}',
      body: 'Costo de tratar a un sano sobre la suma de ambos costos.',
    },
  ],
  props: [
    { label: 'Positivos esperados', tex: 'E[\\#+]=n\\cdot P(+)' },
    { label: 'Decisión', tex: '\\text{tratar}\\iff P(E\\mid\\text{datos})>p^*' },
  ],
};

export { lesson };
