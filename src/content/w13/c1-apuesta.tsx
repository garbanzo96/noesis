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
import { ev, fmt, tnum } from './kit';

// ============================================================================
// CASO 13.1 · «La apuesta» — valor esperado de una decisión
// Contrato: +100 si hay brote (p), −20 si no. E[comprar] = 100p − 20(1 − p); con p = 0,2 vale 4,
// con p = 0,1 vale −8. Cruza 0 en p = 1/6 ≈ 0,167.
// ============================================================================

const WIN = 100,
  LOSS = -20;
const PLOT = { x0: 200, x1: 880, y0: 600, y1: 220 }; // p ∈ [0, 0.5], E ∈ [−20, 40]
const px = (p: number) => PLOT.x0 + (p / 0.5) * (PLOT.x1 - PLOT.x0);
const py = (e: number) => PLOT.y0 + ((e + 20) / 60) * (PLOT.y1 - PLOT.y0);
const buy = (p: number) => ev([p, 1 - p], [WIN, LOSS]);

/** E[buy] as a line over p, the zero line, and the current p */
function EvPlot({ p, showCross }: { p: number; showCross?: boolean }) {
  return (
    <g>
      <line x1={PLOT.x0} x2={PLOT.x1} y1={py(0)} y2={py(0)} stroke={C.line} strokeWidth={2} />
      <line x1={PLOT.x0} x2={PLOT.x0} y1={PLOT.y0} y2={PLOT.y1} stroke={C.line} strokeWidth={2} />
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
        <Cap key={v} x={px(v)} y={PLOT.y0 + 28} size={17} color={C.muted}>
          {fmt(v, 1)}
        </Cap>
      ))}
      {[-20, 0, 20, 40].map((v) => (
        <Cap key={v} x={PLOT.x0 - 30} y={py(v)} size={17} color={C.muted}>
          {v}
        </Cap>
      ))}
      <line
        x1={px(0)}
        x2={px(0.5)}
        y1={py(buy(0))}
        y2={py(buy(0.5))}
        stroke={C.amber}
        strokeWidth={4}
      />
      <Cap x={px(0.42)} y={py(buy(0.42)) - 28} size={19} color={C.amber}>
        comprar
      </Cap>
      <Cap x={px(0.42)} y={py(0) + 26} size={19} color={C.cyan}>
        no comprar (0)
      </Cap>
      {showCross && (
        <g>
          <circle cx={px(1 / 6)} cy={py(0)} r={9} fill={C.green} />
          <Cap x={px(1 / 6)} y={py(0) - 30} size={19} color={C.green} tex="p=\tfrac16" />
        </g>
      )}
      <circle cx={px(p)} cy={py(buy(p))} r={10} fill={buy(p) > 0 ? C.green : C.magenta} />
      <Cap x={PLOT.x0 + 340} y={PLOT.y0 + 64} size={19} color={C.muted}>
        probabilidad de brote p
      </Cap>
    </g>
  );
}

function BetLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [p, setP] = useState(0.3);
  const { beat } = beats;
  const pp = beat <= 1 ? 0.2 : beat === 2 ? p : beat === 3 ? 0.1 : 0.2;
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * 0.5, 0, 0.5) * 100) / 100;
    setP(v);
    if (Math.abs(v - 1 / 6) < 0.012) {
      setP(1 / 6);
      unlock();
    }
  });
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <g>
          <rect
            x={220}
            y={240}
            width={640}
            height={300}
            rx={14}
            fill={C.panel}
            stroke={C.line}
            strokeWidth={2}
          />
          <Cap x={540} y={290} size={24} color={C.text}>
            Contrato de seguro sanitario
          </Cap>
          <Cap x={380} y={380} size={22} color={C.green}>
            Brote (0,2): +100
          </Cap>
          <Cap x={700} y={380} size={22} color={C.magenta}>
            Sin brote (0,8): −20
          </Cap>
          <Cap x={540} y={470} size={20} color={C.muted}>
            No comprar: 0 en cualquier caso
          </Cap>
        </g>
      ) : (
        <EvPlot p={pp} showCross={beat >= 2 && (beat > 2 || Math.abs(p - 1 / 6) < 0.01)} />
      )}
      {beat === 2 && (
        <Knob x={px(p)} y={py(buy(p))} onPointerDown={drag} axis="x" color={C.amber} />
      )}
      <Cap x={1270} y={200} tex="E=100p-20(1-p)" color={C.amber} />
      {beat >= 1 && (
        <Cap
          x={1270}
          y={290}
          tex={`p=${tnum(pp, 2)}:\\ E=${tnum(buy(pp), 2)}`}
          color={buy(pp) > 0 ? C.green : C.magenta}
        />
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={380} size={20} color={C.cyan}>
          Con p = 0,1, no comprar.
        </Cap>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Valor esperado de una decisión',
  Scene: BetLesson,
  beats: [
    {
      say: 'Una decisión con incertidumbre tiene una tabla de pagos: qué ganas con cada acción según lo que pase.',
      board: {
        label: 'Tabla de pagos',
        tex: '\\p{1}{u(\\text{comprar},\\text{brote})=100},\\ \\p{2}{u(\\text{comprar},\\text{no})=-20}',
      },
    },
    {
      say: 'Pondera cada pago por su probabilidad y suma: ese es el **valor esperado** de la acción. Con p = 0,2, comprar vale 4.',
      board: {
        label: 'Valor esperado',
        tex: '\\p{1}{E[a]}=\\p{2}{\\sum_s P(s)\\,u(a,s)}=\\p{3}{0{,}2\\cdot100-0{,}8\\cdot20=4}',
      },
    },
    {
      say: 'Mueve la probabilidad de brote. Busca el punto donde comprar y no comprar valen lo mismo.',
      gate: 'Arrastra el punto hasta donde la recta cruza el 0.',
      board: {
        label: 'Punto de equilibrio',
        tex: '\\p{1}{100p=20(1-p)}\\p{2}{\\ \\Rightarrow\\ p=\\tfrac16}',
      },
    },
    {
      say: 'Ahora el pronóstico baja a p = 0,1.',
      ask: {
        prompt: '¿Conviene comprar el contrato con p = 0,1?',
        options: ['No: vale −8', 'Sí: vale 10', 'Da lo mismo'],
        answer: 0,
        explain: '0,1·100 − 0,9·20 = −8: menos que no comprar, que vale 0.',
      },
      board: { label: 'Con p = 0,1', tex: '\\p{1}{E}=\\p{2}{10-18=-8}' },
    },
    {
      say: 'La regla: calcula el valor esperado de cada acción y elige la mayor. Quien conoce p antes que el mercado sabe de qué lado está.',
      board: { label: 'Regla', tex: '\\p{1}{a^*}=\\p{2}{\\arg\\max_a E[a]}' },
    },
  ],
};

function TapeDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <EvPlot p={beat === 0 ? 0.25 : 0.05} showCross />
      {answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex={beat === 0 ? 'E=25-15=10' : 'E=5-19=-14'}
          color={beat === 0 ? C.green : C.magenta}
        />
      )}
    </Stage>
  );
}

function BetPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 191 + round);
    const win = pick(r, [60, 80, 100, 120]);
    const loss = pick(r, [10, 20, 30]);
    const p = pick(r, [0.1, 0.2, 0.25, 0.3]);
    return { win, loss, p, e: win * p - loss * (1 - p), cross: loss / (win + loss) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setVal('');
    setChoice(null);
    const base = `Un contrato paga +${d.win} si hay brote y cuesta −${d.loss} si no.`;
    api.prompt(
      [
        `${base} Con p = ${fmt(d.p, 2)}, ¿cuánto vale su valor esperado?`,
        `${base} ¿Con qué probabilidad de brote da lo mismo comprar o no? Tres decimales.`,
        `${base} Con p = ${fmt(d.p, 2)}, ¿conviene comprar?`,
      ][round],
      ['E=p\\cdot G-(1-p)\\cdot P', 'p^*=\\frac{P}{G+P}', 'E>0\\Rightarrow\\text{comprar}'][round],
    );
    api.hints(
      [
        ['Multiplica la ganancia por p y la pérdida por 1 − p.', 'Resta.'],
        ['Iguala p·G con (1 − p)·P.', 'Despeja p.'],
        ['Calcula el valor esperado.', 'Compáralo con 0, el valor de no comprar.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      const right = d.e > 0 ? 'Comprar' : 'No comprar';
      if (choice === right) return api.result(true, `$E=${tnum(d.e, 1)}$.`);
      return api.result(false, `E = ${fmt(d.e, 1)}: compáralo con 0.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.e) < 0.051)
        return api.result(
          true,
          `$${tnum(d.p)}\\cdot${d.win}-${tnum(1 - d.p)}\\cdot${d.loss}=${tnum(d.e, 1)}$.`,
        );
      if (Math.abs(v - d.win * d.p) < 0.051)
        return api.result(false, 'Falta restar la pérdida ponderada por 1 − p.');
      return api.result(false, `E = ${fmt(d.p, 2)}·${d.win} − ${fmt(1 - d.p, 2)}·${d.loss}.`);
    }
    if (Math.abs(v - d.cross) < 0.0011)
      return api.result(
        true,
        `$p^*=\\tfrac{${d.loss}}{${d.win + d.loss}}\\approx${tnum(d.cross, 3)}$.`,
      );
    if (Math.abs(v - d.loss / d.win) < 0.0011)
      return api.result(
        false,
        'Dividiste por la ganancia sola. El denominador es ganancia más pérdida.',
      );
    return api.result(false, `p* = ${d.loss}/(${d.win} + ${d.loss}).`);
  };
  return (
    <Stage>
      <Cap x={540} y={360} size={24} color={C.text}>
        {`Brote: +${d.win} · Sin brote: −${d.loss}`}
      </Cap>
      <Cap x={540} y={420} size={20} color={C.muted}>
        No comprar vale 0.
      </Cap>
      {round === 2 ? (
        <Choices
          x={1230}
          y={420}
          options={['Comprar', 'No comprar']}
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
          label={round === 0 ? 'E =' : 'p* ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c1',
  world: 'decision',
  code: '13.1',
  title: 'La apuesta',
  subtitle: 'Valor esperado de una decisión',
  glyph: 'E[a]',
  kind: 'level',
  guide: 'valentina',
  teaser:
    'Los contratos de seguro sanitario se compran antes de cada anuncio. Valentina vio siempre la misma cuenta del lado ganador.',
  learn:
    'Elegir entre acciones con incertidumbre calculando el valor esperado de cada una y encontrar el punto de equilibrio.',
  glyphs: ['dec-ev'],
  pitfalls: [
    'El valor esperado pondera también la pérdida, por 1 − p.',
    'El punto de equilibrio divide la pérdida por la suma de ganancia y pérdida.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Bolsa de Valparaíso, 16:55. Cinco minutos para el cierre; las pantallas de cotizaciones tiñen de verde la sala vacía.',
        },
        {
          who: 'valentina',
          text: 'Contratos de seguro sanitario. Pagan si hay brote. Una cuenta los compra justo antes de cada anuncio.',
        },
        { who: 'iris', text: '¿Siempre gana?' },
        {
          who: 'valentina',
          text: 'Siempre. Nadie gana siempre en este piso. Ni con suerte, ni con buen olfato.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La cinta de órdenes',
      Scene: TapeDemo,
      beats: [
        {
          say: 'El lunes, el boletín sanitario daba p = 0,25 de brote. La cuenta compró.',
          ask: {
            prompt: '¿Cuánto valía comprar con p = 0,25?',
            options: ['10', '25', '−5'],
            answer: 0,
            explain: '0,25·100 − 0,75·20 = 25 − 15 = 10. Comprar era razonable.',
          },
          note: { label: 'Lunes', tex: 'E=10>0' },
        },
        {
          say: 'El jueves, el boletín público daba p = 0,05. La cuenta compró igual, y al día siguiente se anunció un brote.',
          ask: {
            prompt: 'Con la información pública (p = 0,05), ¿qué valor esperado tenía comprar?',
            options: ['−14', '5', '0'],
            answer: 0,
            explain:
              '0,05·100 − 0,95·20 = 5 − 19 = −14. Nadie compra eso, salvo que sepa algo que el mercado no sabe.',
          },
          note: {
            label: 'Jueves',
            tex: 'E=-14<0',
            body: 'La cuenta compró contra el valor esperado público: sabía el resultado antes.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Pesar contratos', Comp: BetPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Suena la campana de cierre. Valentina marca la orden del jueves con un círculo rojo.',
        },
        {
          who: 'valentina',
          text: 'Compró con valor esperado −14. Nadie compra así. Salvo que sepa.',
        },
        {
          who: 'teo',
          text: 'Entonces decidía con otro árbol, uno con una rama que nadie más veía.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-ev',
    world: 'decision',
    tex: 'E[a]=\\sum_s P(s)\\,u(a,s)',
    name: 'Valor esperado de una acción',
    read: 'e de a',
    meaning: 'Promedio de los pagos de una acción, ponderados por la probabilidad de cada estado.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Valor esperado', tex: 'E[a]=\\sum_s P(s)\\,u(a,s)' },
    { label: 'Mejor acción', tex: 'a^*=\\arg\\max_a E[a]' },
  ],
  props: [
    {
      label: 'Equilibrio',
      tex: 'p^*=\\frac{P}{G+P}',
      body: 'Para ganar G con probabilidad p o perder P.',
    },
    { label: 'Ejemplo', tex: '0{,}2\\cdot100-0{,}8\\cdot20=4' },
  ],
};

export { lesson };
