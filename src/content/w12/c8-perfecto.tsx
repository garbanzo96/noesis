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
import { Bars, benford, chi2, fmt, tnum } from './kit';

// ============================================================================
// CASO 12.8 · «Demasiado perfecto» — prueba χ² de ajuste
// χ² = Σ(O − E)²/E. Con E = (50, 30, 20) y O = (60, 20, 20): χ² ≈ 5,33 < 5,99 (corte del 5 %, 2 g.l.).
// Lote uniforme frente a Benford (1000 montos): χ² ≈ 402. Lote nuevo de la Fábrica: χ² ≈ 0,002,
// muy por debajo de 2,73 (5 % inferior con 8 g.l.): demasiado perfecto.
// ============================================================================

const E3 = [50, 30, 20];
const CATS = ['A', 'B', 'C'];
const K = { x0: 1110, x1: 1400, y: 660, lo: 40, hi: 70 };
const BEN = Array.from({ length: 9 }, (_, i) => 1000 * benford(i + 1));
const NEW_LOT = [301, 176, 125, 97, 79, 67, 58, 51, 46];

function TwoBars({ obs, exp, labels }: { obs: number[]; exp: number[]; labels: string[] }) {
  const max = Math.max(...obs, ...exp) * 1.15;
  const bw = 640 / labels.length;
  return (
    <g>
      <line x1={190} x2={850} y1={600} y2={600} stroke={C.line} strokeWidth={2} />
      {labels.map((l, i) => {
        const he = (exp[i] / max) * 380,
          ho = (obs[i] / max) * 380,
          x = 200 + i * bw;
        return (
          <g key={l}>
            <rect
              x={x + bw * 0.12}
              y={600 - he}
              width={bw * 0.36}
              height={he}
              rx={5}
              fill={C.cyan}
              fillOpacity={0.45}
            />
            <rect
              x={x + bw * 0.52}
              y={600 - ho}
              width={bw * 0.36}
              height={ho}
              rx={5}
              fill={C.amber}
              fillOpacity={0.85}
            />
            <Cap
              x={x + bw * 0.7}
              y={600 - ho - 22}
              size={labels.length > 5 ? 15 : 19}
              color={C.amber}
            >
              {Math.round(obs[i])}
            </Cap>
            <Cap x={x + bw / 2} y={628} size={19} color={C.muted}>
              {l}
            </Cap>
          </g>
        );
      })}
      <Cap x={520} y={672} size={19} color={C.muted}>
        Celeste: esperado. Ámbar: observado.
      </Cap>
    </g>
  );
}

function Chi2Lesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(55);
  const { beat } = beats;
  const kk = beat === 0 ? 55 : beat === 1 ? k : 60;
  const obs = [kk, 80 - kk, 20];
  const x2 = chi2(obs, E3);
  const drag = useSvgDrag(svg, (px) => {
    const next = Math.round(K.lo + clamp((px - K.x0) / (K.x1 - K.x0), 0, 1) * (K.hi - K.lo));
    setK(next);
    if (next === 60) unlock();
  });
  const benfordView = beat >= 3;
  return (
    <Stage ref={svg}>
      {!benfordView && <TwoBars obs={obs} exp={E3} labels={CATS} />}
      {benfordView && (
        <TwoBars obs={NEW_LOT} exp={BEN} labels={['1', '2', '3', '4', '5', '6', '7', '8', '9']} />
      )}
      {!benfordView && <Cap x={1270} y={200} tex={`\\chi^2=${tnum(x2)}`} color={C.amber} />}
      {beat >= 2 && !benfordView && (
        <Cap x={1270} y={290} tex="\text{corte }5\,\%\ (2\ \text{g.l.})=5{,}99" color={C.text} />
      )}
      {benfordView && (
        <Cap
          x={1270}
          y={200}
          tex={`\\chi^2\\approx${tnum(chi2(NEW_LOT, BEN), 3)}`}
          color={C.magenta}
        />
      )}
      {benfordView && (answer !== null || beat === 4) && (
        <Cap
          x={1270}
          y={290}
          tex="E[\chi^2]\approx8,\ \ 5\,\%\ \text{inferior}=2{,}73"
          color={C.text}
        />
      )}
      {beat === 1 && (
        <>
          <line x1={K.x0} x2={K.x1} y1={K.y} y2={K.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={K.x0 + ((k - K.lo) / (K.hi - K.lo)) * (K.x1 - K.x0)}
            y={K.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${k}`}
          />
          <Cap x={1255} y={K.y + 60} size={19} color={C.muted}>
            conteo observado de A
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Prueba χ² de ajuste',
  Scene: Chi2Lesson,
  beats: [
    {
      say: 'Para medir cuánto se aleja lo observado de lo esperado, se suma cada diferencia al cuadrado dividida por lo esperado.',
      board: { label: 'Estadístico χ²', tex: '\\p{1}{\\chi^2}=\\p{2}{\\sum\\frac{(O-E)^2}{E}}' },
    },
    {
      say: 'Mueve el conteo de A: cuanto más se aleja de 50, más crece χ². B compensa para que el total siga en 100.',
      gate: 'Arrastra la perilla hasta que A valga 60.',
      board: {
        label: 'Con A = 60',
        tex: '\\p{1}{\\tfrac{10^2}{50}+\\tfrac{10^2}{30}}=\\p{2}{5{,}33}',
      },
    },
    {
      say: 'Con 3 categorías hay 2 grados de libertad. Si los datos siguen el modelo, χ² supera 5,99 solo el 5 % de las veces.',
      board: {
        label: 'Decidir',
        tex: '\\p{1}{5{,}33<5{,}99}\\p{2}{\\ \\Rightarrow\\ \\text{compatible}}',
      },
    },
    {
      say: 'Ahora el lote nuevo de la Fábrica contra Benford, con 1000 montos y 8 grados de libertad: χ² ≈ 0,002.',
      ask: {
        prompt: 'Con datos reales, χ² suele rondar 8. ¿Qué indica un χ² de 0,002?',
        options: [
          'Demasiado perfecto: los datos reales varían más',
          'Ajuste normal de datos reales',
          'Que los datos no siguen Benford',
        ],
        answer: 0,
        explain:
          'Un χ² tan chico pasa menos del 5 % de las veces (corte inferior 2,73). El lote copia las proporciones con una precisión que el azar no da.',
      },
      board: { label: 'Cola inferior', tex: '\\p{1}{0{,}002}\\p{2}{\\ll2{,}73}' },
    },
    {
      say: 'χ² sirve en las dos direcciones: muy grande, los datos no siguen el modelo; muy chico, alguien los ajustó a mano.',
      board: {
        label: 'Dos colas',
        tex: '\\p{1}{\\chi^2\\ \\text{grande}:\\ \\text{no calza}},\\ \\p{2}{\\chi^2\\ \\text{chico}:\\ \\text{demasiado perfecto}}',
      },
    },
  ],
};

function NewLotDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const uniform = Array.from({ length: 9 }, () => 1000 / 9);
  return (
    <Stage>
      <TwoBars
        obs={beat === 0 ? uniform : NEW_LOT}
        exp={BEN}
        labels={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
      />
      {beat === 0 && answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex={`\\chi^2\\approx${Math.round(chi2(uniform, BEN))}\\gg15{,}51`}
          color={C.magenta}
        />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} tex="\chi^2\approx0{,}002\ll2{,}73" color={C.magenta} />
      )}
    </Stage>
  );
}

function Chi2Practice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 181 + round);
    const exp = pick(r, [
      [50, 30, 20],
      [40, 40, 20],
      [25, 25, 50],
    ]);
    const shift = pick(r, [-10, -5, 5, 10]);
    const obs = [exp[0] + shift, exp[1] - shift, exp[2]];
    const cats = pick(r, [3, 4, 6, 9]);
    const x = pick(r, [0.4, 1.1, 8.2, 12.6, 18.4, 30.2]);
    return {
      exp,
      obs,
      value: chi2(obs, exp),
      cats,
      x,
      verdict: x < 2.73 ? 'Demasiado perfecto' : x > 15.51 ? 'No calza' : 'Compatible',
    };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setVal('');
    setChoice(null);
    api.prompt(
      [
        `Esperado (${d.exp.join(', ')}) y observado (${d.obs.join(', ')}). ¿Cuánto vale χ²? Dos decimales.`,
        `Una prueba compara ${d.cats} categorías con un modelo ya fijado. ¿Cuántos grados de libertad tiene?`,
        `Con 8 grados de libertad, un lote da χ² = ${fmt(d.x, 1)}. Cortes del 5 %: 2,73 abajo y 15,51 arriba. ¿Qué concluyes?`,
      ][round],
      ['\\chi^2=\\sum\\frac{(O-E)^2}{E}', '\\text{g.l.}=k-1', '2{,}73<\\chi^2<15{,}51'][round],
    );
    api.hints(
      [
        ['Calcula (O − E)² / E en cada categoría.', 'Suma las tres.'],
        [
          'Las proporciones deben sumar 1: una categoría queda determinada.',
          'Resta 1 al número de categorías.',
        ],
        [
          'Bajo 2,73: demasiado parecido. Sobre 15,51: demasiado distinto.',
          'Entre ambos: compatible.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === d.verdict)
        return api.result(true, `$\\chi^2=${tnum(d.x, 1)}$: ${d.verdict.toLowerCase()}.`);
      return api.result(
        false,
        d.x < 2.73
          ? 'Está bajo el corte inferior: demasiado parecido al modelo.'
          : d.x > 15.51
            ? 'Supera el corte superior: no calza con el modelo.'
            : 'Está entre los dos cortes: compatible.',
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.value) < 0.011)
        return api.result(true, `$\\chi^2\\approx${tnum(d.value)}$.`);
      const noSquare = d.obs.reduce((a, o, i) => a + Math.abs(o - d.exp[i]) / d.exp[i], 0);
      if (Math.abs(v - noSquare) < 0.011)
        return api.result(false, 'Falta elevar al cuadrado cada diferencia.');
      return api.result(false, 'Suma (O − E)²/E en las tres categorías.');
    }
    if (v === d.cats - 1)
      return api.result(true, `${d.cats} − 1 = ${d.cats - 1} grados de libertad.`);
    if (v === d.cats)
      return api.result(false, 'Una categoría queda determinada por las demás: resta 1.');
    return api.result(false, 'Grados de libertad = categorías − 1.');
  };
  return (
    <Stage>
      {round === 0 ? (
        <TwoBars obs={d.obs} exp={d.exp} labels={CATS} />
      ) : (
        <Bars
          labels={['5 % inferior', 'promedio', '5 % superior']}
          values={[2.73, 8, 15.51]}
          max={18}
          digits={2}
          color={C.violet}
        />
      )}
      {round === 2 ? (
        <Choices
          x={1230}
          y={420}
          options={['Demasiado perfecto', 'Compatible', 'No calza']}
          value={choice}
          onPick={setChoice}
        />
      ) : (
        <NumberField
          x={1120}
          y={420}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label={round === 0 ? 'χ² =' : 'g.l. ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c8',
  world: 'generative',
  code: '12.8',
  title: 'Demasiado perfecto',
  subtitle: 'Prueba χ² de ajuste',
  glyph: '\\chi^2',
  kind: 'level',
  guide: 'joaquin',
  teaser:
    'La central corrigió la máquina: el lote nuevo sigue a Benford casi al decimal. Justo eso lo delata.',
  learn:
    'Calcular el estadístico χ² de ajuste y decidir en las dos colas: datos que no calzan y datos demasiado perfectos.',
  glyphs: ['gen-chi2'],
  pitfalls: [
    'Grados de libertad: categorías menos 1 cuando el modelo ya está fijado.',
    'Un χ² muy chico también es sospechoso: los datos reales varían.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Nave principal, 03:00. La caldera suelta vapor; en la pantalla de control, el lote nuevo aparece con un sello verde: «calibrado».',
        },
        {
          who: 'joaquin',
          text: 'La central lo arregló. Ahora los montos siguen a Benford como si los hubiera dibujado un profesor.',
        },
        { who: 'iris', text: '¿Y eso los hace pasar?' },
        { who: 'teo', text: 'Pasan una prueba. La otra los condena.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El lote nuevo',
      Scene: NewLotDemo,
      beats: [
        {
          say: 'Primero, el lote viejo: mil montos con primeros dígitos parejos contra Benford.',
          ask: {
            prompt: '¿Qué pasa con χ² en el lote viejo?',
            options: ['Es enorme: los datos no siguen Benford', 'Es normal', 'Es demasiado chico'],
            answer: 0,
            explain: 'χ² ≈ 402, muy por sobre 15,51: el lote viejo no calza con montos reales.',
          },
          note: { label: 'Lote viejo', tex: '\\chi^2\\approx402' },
        },
        {
          say: 'Ahora el lote nuevo, «calibrado».',
          ask: {
            prompt: 'El lote nuevo da χ² ≈ 0,002 con 8 grados de libertad. ¿Qué concluyes?',
            options: ['Demasiado perfecto: fabricado', 'Montos reales', 'No sigue Benford'],
            answer: 0,
            explain:
              'Mil montos reales casi nunca bajan de 2,73. 0,002 es copiar la tabla de Benford.',
          },
          note: {
            label: 'Lote nuevo',
            tex: '\\chi^2\\approx0{,}002\\ll2{,}73',
            body: 'Demasiado parecido al modelo: los datos reales varían más.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Las dos colas', Comp: Chi2Practice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín apaga la pantalla de control. El sello verde queda impreso un segundo en la oscuridad.',
        },
        { who: 'joaquin', text: 'Ni la máquina nueva sabe equivocarse como una persona.' },
        { who: 'iris', text: 'Junta todo. Mañana lo leemos en voz alta.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-chi2',
    world: 'generative',
    tex: '\\chi^2=\\sum\\frac{(O-E)^2}{E}',
    name: 'Estadístico χ²',
    read: 'ji cuadrado',
    meaning: 'Mide cuánto se alejan los conteos observados de los esperados por un modelo.',
    warn: 'Muy chico también es sospechoso.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Ji cuadrado', tex: '\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i}' },
    {
      label: 'Grados de libertad',
      tex: '\\text{g.l.}=k-1',
      body: 'Con k categorías y un modelo fijado de antemano.',
    },
  ],
  props: [
    { label: 'Cortes con 8 g.l.', tex: '\\chi^2_{0{,}05}=2{,}73,\\ \\chi^2_{0{,}95}=15{,}51' },
    {
      label: 'Dos colas',
      tex: '\\text{grande}\\Rightarrow\\text{no calza};\\ \\text{chico}\\Rightarrow\\text{demasiado perfecto}',
    },
  ],
};

export { lesson };
