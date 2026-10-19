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
import { fmt, kl2, tnum } from './kit';

// ============================================================================
// CASO 11.6 · «Por separado» — aproximación de campo medio
// p(x,y): (0,0) y (1,1) con 0,4; (0,1) y (1,0) con 0,1. P(x = y) = 0,8. La mejor q(x)q(y) con
// marginales 1/2 da 0,25 en cada celda: P(x = y) = 0,5 y KL(q‖p) ≈ 0,32 bits.
// ============================================================================

const P = [0.4, 0.1, 0.1, 0.4];
const Q = [0.25, 0.25, 0.25, 0.25];
const T = { x: 330, y: 220, s: 190 };
const MIX = { x0: 1110, x1: 1400, y: 660 };

/** 2×2 joint table drawn as squares whose area follows the probability */
function Joint({
  cells,
  labels = ['no', 'sí'],
  diag,
}: {
  cells: number[];
  labels?: string[];
  diag?: boolean;
}) {
  return (
    <g>
      {cells.map((v, i) => {
        const r = Math.floor(i / 2),
          c = i % 2;
        const cx = T.x + c * T.s + T.s / 2,
          cy = T.y + r * T.s + T.s / 2,
          side = Math.sqrt(v) * T.s * 1.4;
        const onDiag = r === c;
        return (
          <g key={i}>
            <rect
              x={T.x + c * T.s}
              y={T.y + r * T.s}
              width={T.s}
              height={T.s}
              fill="none"
              stroke={C.line}
              strokeWidth={2}
            />
            <rect
              x={cx - side / 2}
              y={cy - side / 2}
              width={side}
              height={side}
              rx={8}
              fill={diag && onDiag ? C.green : C.violet}
              fillOpacity={0.75}
            />
            <Cap x={cx} y={cy} size={24} color={C.text}>
              {fmt(v, 2)}
            </Cap>
          </g>
        );
      })}
      {labels.map((l, k) => (
        <g key={l}>
          <Cap x={T.x + k * T.s + T.s / 2} y={T.y - 30} size={20} color={C.muted}>
            {`tos: ${l}`}
          </Cap>
          <Cap x={T.x - 70} y={T.y + k * T.s + T.s / 2} size={20} color={C.muted}>
            {`fiebre: ${l}`}
          </Cap>
        </g>
      ))}
    </g>
  );
}

function MeanFieldLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const { beat } = beats;
  const mix = beat < 2 ? 0 : beat === 2 ? t : 1;
  const cells = P.map((p, i) => (1 - mix) * p + mix * Q[i]);
  const drag = useSvgDrag(svg, (px) => {
    const v = clamp((px - MIX.x0) / (MIX.x1 - MIX.x0), 0, 1);
    setT(v);
    if (v > 0.98) unlock();
  });
  const same = cells[0] + cells[3];
  return (
    <Stage ref={svg}>
      <Joint cells={cells} diag={beat === 0 || (beat === 3 && answer !== null)} />
      <Cap x={T.x + T.s} y={T.y + 2 * T.s + 50} size={20} color={C.muted}>
        {mix < 1
          ? 'Fiebre y tos van juntas: la diagonal pesa más.'
          : 'Por partes: cada celda es el producto de las marginales.'}
      </Cap>
      <Cap x={1270} y={200} tex={`P(x=y)=${tnum(same)}`} color={C.green} />
      {beat >= 1 && (
        <Cap x={1270} y={290} tex="P(\text{fiebre})=P(\text{tos})=0{,}5" color={C.text} />
      )}
      {beat >= 4 && (
        <Cap
          x={1270}
          y={380}
          tex={`KL(q\\Vert p)\\approx${tnum(kl2(Q, P))}\\ \\text{bits}`}
          color={C.amber}
        />
      )}
      {beat === 2 && (
        <>
          <line x1={MIX.x0} x2={MIX.x1} y1={MIX.y} y2={MIX.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={MIX.x0 + t * (MIX.x1 - MIX.x0)}
            y={MIX.y}
            onPointerDown={drag}
            axis="x"
            color={C.violet}
          />
          <Cap x={1110} y={MIX.y + 50} size={18} color={C.muted}>
            p
          </Cap>
          <Cap x={1400} y={MIX.y + 50} size={18} color={C.muted}>
            q(x)q(y)
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Aproximación por partes',
  Scene: MeanFieldLesson,
  beats: [
    {
      say: 'Fiebre y tos suelen venir juntas: las dos o ninguna pasa el 80 % de las veces. Esa relación está en la diagonal.',
      board: {
        label: 'La distribución real',
        tex: '\\p{1}{P(x=y)}=\\p{2}{0{,}4+0{,}4}=\\p{3}{0{,}8}',
      },
    },
    {
      say: 'Por separado, cada síntoma aparece la mitad de las veces. Esas son las marginales.',
      board: {
        label: 'Marginales',
        tex: '\\p{1}{p(x)=(0{,}5;0{,}5)},\\ \\p{2}{p(y)=(0{,}5;0{,}5)}',
      },
    },
    {
      say: 'La aproximación más simple trata cada síntoma por su cuenta y multiplica. Llévala de p a q.',
      gate: 'Arrastra la perilla hasta q(x)q(y).',
      board: { label: 'Campo medio', tex: '\\p{1}{q(x,y)}=\\p{2}{q(x)\\,q(y)}' },
    },
    {
      say: 'Ahora cada celda vale 0,25. Mira la diagonal.',
      ask: {
        prompt: 'Con la aproximación por partes, ¿cuánto vale P(x = y)?',
        options: ['0,5', '0,8', '0,25'],
        answer: 0,
        explain:
          '0,25 + 0,25 = 0,5. La aproximación conserva las marginales, pero borra que los síntomas van juntos.',
      },
      board: { label: 'Lo que se pierde', tex: '\\p{1}{0{,}8}\\p{2}{\\ \\to\\ 0{,}5}' },
    },
    {
      say: 'La KL mide el costo: unas 0,32 bits por caso. Es la mejor aproximación por partes, y aun así no ve la relación.',
      board: {
        label: 'Costo',
        tex: '\\p{1}{KL(q\\Vert p)}=\\p{2}{\\sum q\\log_2\\tfrac qp}\\p{3}{\\approx0{,}32}',
      },
    },
  ],
};

function SymptomsDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Joint cells={beat === 0 && answer === null ? P : Q} diag={answer !== null} />
      <Cap x={T.x + T.s} y={T.y + 2 * T.s + 50} size={20} color={C.muted}>
        {beat === 0 && answer === null
          ? 'Datos de la Clínica.'
          : 'Lo que usa el lector: síntomas por separado.'}
      </Cap>
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="q(1,1)=0{,}5\cdot0{,}5=0{,}25" color={C.amber} />
      )}
      {beat === 1 && answer !== null && (
        <Cap x={1270} y={260} size={21} color={C.green}>
          La relación entre síntomas.
        </Cap>
      )}
    </Stage>
  );
}

const TABLES = [
  [0.4, 0.1, 0.1, 0.4],
  [0.3, 0.2, 0.1, 0.4],
  [0.5, 0.1, 0.1, 0.3],
  [0.2, 0.2, 0.2, 0.4],
];

function MeanFieldPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 167 + round);
    const p = pick(r, TABLES);
    const px1 = p[2] + p[3],
      py1 = p[1] + p[3];
    const q11 = px1 * py1;
    const same = (1 - px1) * (1 - py1) + q11;
    return { p, px1, py1, q11, same };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        '¿Cuánto vale P(fiebre: sí)? Suma la fila. Dos decimales.',
        '¿Cuánto vale q(sí, sí) en la aproximación por partes? Dos decimales.',
        '¿Cuánto vale P(x = y) según la aproximación por partes? Dos decimales.',
      ][round],
      ['p(x=1)=\\sum_y p(1,y)', 'q(1,1)=p(x=1)\\,p(y=1)', 'q(0,0)+q(1,1)'][round],
    );
    api.hints(
      [
        ['La fila «fiebre: sí» tiene dos celdas.', 'Súmalas.'],
        ['Calcula las dos marginales de «sí».', 'Multiplícalas.'],
        ['q(0,0) = (1 − p(x=1))(1 − p(y=1)).', 'Suma q(0,0) y q(1,1).'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const target = [d.px1, d.q11, d.same][round];
    if (Math.abs(v - target) < 0.011) return api.result(true, `$${tnum(target)}$.`);
    if (round === 1 && Math.abs(v - d.p[3]) < 0.011)
      return api.result(false, 'Esa es la celda real. La aproximación multiplica las marginales.');
    if (round === 2 && Math.abs(v - (d.p[0] + d.p[3])) < 0.011)
      return api.result(false, 'Esa es la diagonal real. Calcula la diagonal de q(x)q(y).');
    return api.result(false, `Marginales: p(x=1) = ${fmt(d.px1, 2)}, p(y=1) = ${fmt(d.py1, 2)}.`);
  };
  return (
    <Stage>
      <Joint cells={d.p} />
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['p(x=1) =', 'q(1,1) =', 'P(x=y) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c6',
  world: 'variational',
  code: '11.6',
  title: 'Por separado',
  subtitle: 'Aproximación de campo medio',
  glyph: 'q(x)q(y)',
  kind: 'level',
  guide: 'simon',
  teaser:
    'El lector trata cada síntoma por su cuenta. Simón dice que ahí se pierde algo que los médicos saben de memoria.',
  learn:
    'Aproximar una distribución conjunta con el producto de sus marginales y ver qué relación se pierde.',
  glyphs: ['vi-meanfield'],
  pitfalls: [
    'La aproximación por partes conserva las marginales, no la relación entre variables.',
    'q(1,1) es el producto de las marginales, no la celda real.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Sala de servidores, diez y diez. Simón se sentó en una caja de papel y abrió la configuración del lector en su computador.',
        },
        {
          who: 'simon',
          text: 'Mira esta línea: «síntomas independientes». Es como cocinar cada ingrediente en una olla distinta y mezclarlos al final.',
        },
        { who: 'iris', text: '¿Y eso cambia el resultado?' },
        {
          who: 'simon',
          text: 'Bastante. La fiebre y la tos casi siempre vienen juntas, y si las mira por separado, el lector ve otra cosa.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Síntomas que van juntos',
      Scene: SymptomsDemo,
      beats: [
        {
          say: 'En la Clínica, fiebre y tos aparecen juntas en el 40 % de los casos. El lector usa las marginales por separado.',
          ask: {
            prompt: 'Para el lector, ¿qué probabilidad tiene «fiebre y tos»?',
            options: ['0,25', '0,40', '0,50'],
            answer: 0,
            explain: 'Por partes: 0,5 · 0,5 = 0,25. El dato real es 0,40.',
          },
          note: { label: 'Fiebre y tos', tex: 'q(1,1)=0{,}25\\neq p(1,1)=0{,}40' },
        },
        {
          say: 'El lector conserva cuánto aparece cada síntoma.',
          ask: {
            prompt: '¿Qué pierde la aproximación por partes?',
            options: ['La relación entre los síntomas', 'Cuánto aparece cada síntoma', 'Nada'],
            answer: 0,
            explain:
              'Las marginales quedan iguales; lo que desaparece es que los síntomas van juntos.',
          },
          note: {
            label: 'Lo que borra',
            tex: 'P(x=y):\\ 0{,}8\\to0{,}5',
            body: 'Un síntoma suelto pesa como si viniera con el otro.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Aproximar por partes', Comp: MeanFieldPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Teo copió la línea de configuración en su libreta. El rack cambió de lila a verde y volvió al lila.',
        },
        {
          who: 'simon',
          text: 'Esto todavía es pereza. El fraude está en cómo ajustaron la q.',
        },
        { who: 'iris', text: 'Muéstrame el ajuste.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-meanfield',
    world: 'variational',
    tex: 'q(x)q(y)',
    name: 'Campo medio',
    read: 'cu de equis por cu de ye',
    meaning: 'Aproximación que trata cada variable por separado y multiplica.',
    warn: 'Pierde la relación entre las variables.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Campo medio', tex: 'q(x,y)=q(x)\\,q(y)' },
    { label: 'Marginal', tex: 'p(x)=\\sum_y p(x,y)' },
  ],
  props: [
    {
      label: 'Conserva',
      tex: 'q(x)=p(x),\\ q(y)=p(y)',
      body: 'La mejor aproximación por partes iguala las marginales en este ejemplo.',
    },
    {
      label: 'Pierde',
      tex: 'P_q(x=y)\\neq P_p(x=y)',
      body: 'La relación entre variables desaparece.',
    },
  ],
};

export { lesson };
