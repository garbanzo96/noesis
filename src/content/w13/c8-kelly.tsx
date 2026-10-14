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
import { fmt, growth, kellyFrac, tnum } from './kit';

// ============================================================================
// CASO 13.8 · «Un paso antes» — tamaño de apuesta (Kelly)
// Ventaja: gana con p = 0,6 una apuesta a la par (b = 1). f* = p − (1 − p)/b = 0,2.
// Crecimiento por apuesta g(f) = p ln(1 + f) + (1 − p) ln(1 − f): g(0,2) ≈ 0,0201;
// g(0,5) ≈ −0,034 (se pierde con ventaja). 100 apuestas a f* multiplican el capital por ≈ 7,5.
// ============================================================================

const P0 = 0.6;
const G = { x0: 200, x1: 880, y0: 420, scale: 4200 }; // f ∈ [0, 0.6]
const fx = (f: number) => G.x0 + (f / 0.6) * (G.x1 - G.x0);
const gy = (g: number) => G.y0 - g * G.scale;

/** growth per bet as a function of the staked fraction */
function GrowthCurve({ f, p = P0, showBest }: { f?: number; p?: number; showBest?: boolean }) {
  const pts = Array.from({ length: 61 }, (_, i) => {
    const ff = (i / 60) * 0.6;
    return `${i ? 'L' : 'M'}${fx(ff)} ${Math.min(700, gy(growth(p, 1, ff)))}`;
  }).join(' ');
  const best = kellyFrac(p, 1);
  return (
    <g>
      <line x1={G.x0} x2={G.x1} y1={G.y0} y2={G.y0} stroke={C.line} strokeWidth={2} />
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => (
        <Cap key={v} x={fx(v)} y={G.y0 + 26} size={16} color={C.muted}>
          {fmt(v, 1)}
        </Cap>
      ))}
      <Cap x={(G.x0 + G.x1) / 2} y={730} size={19} color={C.muted}>
        fracción del capital apostada f · sobre la línea, el capital crece; bajo ella, se encoge
      </Cap>
      <path d={pts} fill="none" stroke={C.amber} strokeWidth={4} />
      {showBest && (
        <g>
          <circle cx={fx(best)} cy={gy(growth(p, 1, best))} r={9} fill={C.green} />
          <Cap
            x={fx(best)}
            y={gy(growth(p, 1, best)) - 30}
            size={19}
            color={C.green}
            tex={`f^*=${tnum(best, 1)}`}
          />
        </g>
      )}
      {f !== undefined && (
        <circle
          cx={fx(f)}
          cy={Math.min(700, gy(growth(p, 1, f)))}
          r={10}
          fill={growth(p, 1, f) >= 0 ? C.cyan : C.magenta}
        />
      )}
    </g>
  );
}

function KellyLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [f, setF] = useState(0.45);
  const { beat } = beats;
  const ff = beat === 1 ? f : beat === 2 ? 0.5 : 0.2;
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - G.x0) / (G.x1 - G.x0)) * 0.6, 0.01, 0.59) * 100) / 100;
    setF(v);
    if (Math.abs(v - 0.2) < 0.011) unlock();
  });
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <g>
          <rect
            x={220}
            y={240}
            width={640}
            height={280}
            rx={14}
            fill={C.panel}
            stroke={C.line}
            strokeWidth={2}
          />
          <Cap x={540} y={290} size={23} color={C.text}>
            Apuesta a la par con ventaja
          </Cap>
          <Cap x={540} y={370} size={22} color={C.green}>
            Gana el monto apostado con p = 0,6
          </Cap>
          <Cap x={540} y={430} size={22} color={C.magenta}>
            Pierde el monto apostado con 0,4
          </Cap>
        </g>
      ) : (
        <GrowthCurve f={ff} showBest={beat >= 3 || (beat === 1 && Math.abs(f - 0.2) < 0.011)} />
      )}
      {beat === 1 && (
        <Knob
          x={fx(f)}
          y={Math.min(700, gy(growth(P0, 1, f)))}
          onPointerDown={drag}
          axis="x"
          color={C.cyan}
        />
      )}
      <Cap x={1270} y={200} tex="g(f)=p\ln(1+f)+(1-p)\ln(1-f)" color={C.amber} />
      {beat >= 1 && (
        <Cap
          x={1270}
          y={290}
          tex={`g(${tnum(ff, 2)})\\approx${tnum(growth(P0, 1, ff), 4)}`}
          color={growth(P0, 1, ff) >= 0 ? C.cyan : C.magenta}
        />
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={380} tex="f^*=0{,}6-0{,}4=0{,}2" color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={1270} y={380} tex="e^{100\cdot0{,}0201}\approx7{,}5" color={C.green} />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Tamaño de apuesta con ventaja',
  Scene: KellyLesson,
  beats: [
    {
      say: 'Quien conoce el anuncio gana el 60 % de sus apuestas a la par. Tener ventaja no basta: falta decidir cuánto del capital poner cada vez.',
      board: { label: 'La ventaja', tex: '\\p{1}{p=0{,}6},\\ \\p{2}{b=1}' },
    },
    {
      say: 'Lo que importa a la larga es cuánto crece el capital por apuesta, en promedio logarítmico. Busca la fracción que lo hace crecer más rápido.',
      gate: 'Arrastra el punto hasta lo más alto de la curva.',
      board: {
        label: 'Crecimiento por apuesta',
        tex: '\\p{1}{g(f)}=\\p{2}{p\\ln(1+bf)}\\p{3}{+(1-p)\\ln(1-f)}',
      },
    },
    {
      say: 'Apostar la mitad del capital, aun con ventaja, hace que el capital se encoja: g(0,5) ≈ −0,034.',
      board: { label: 'Demasiado', tex: '\\p{1}{g(0{,}5)}\\p{2}{\\approx-0{,}034<0}' },
    },
    {
      say: 'La cima de la curva tiene una fórmula corta.',
      ask: {
        prompt: 'Con p = 0,6 y b = 1, ¿qué fracción maximiza el crecimiento?',
        options: ['0,2', '0,6', '1'],
        answer: 0,
        explain:
          'Fracción de Kelly: f* = p − (1 − p)/b = 0,6 − 0,4 = 0,2. Apostar 0,6 o todo arruina con el tiempo.',
      },
      board: { label: 'Fracción de Kelly', tex: '\\p{1}{f^*}=\\p{2}{p-\\frac{1-p}{b}}' },
    },
    {
      say: 'Con f* = 0,2, cada apuesta crece 0,0201 en promedio logarítmico: en 100 apuestas el capital se multiplica por unas 7,5.',
      board: { label: 'Cien apuestas', tex: '\\p{1}{e^{100\\,g(f^*)}}\\p{2}{\\approx7{,}5}' },
    },
  ],
};

function AccountDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <GrowthCurve f={0.2} showBest={answer !== null || beat === 1} />
      {beat === 0 && answer !== null && (
        <Cap x={1270} y={260} tex="f^*=0{,}6-0{,}4=0{,}2" color={C.green} />
      )}
      {beat === 1 && answer !== null && (
        <Cap
          x={1270}
          y={260}
          tex="P(\text{20 \% justo})\ \text{al azar}\approx0"
          color={C.magenta}
        />
      )}
    </Stage>
  );
}

function KellyPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 199 + round);
    const p = pick(r, [0.55, 0.6, 0.65, 0.7]);
    const b = pick(r, [1, 2]);
    const f = pick(r, [0.1, 0.2, 0.3]);
    return { p, b, f, kelly: kellyFrac(p, b), g: growth(p, b, f) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `Ganas con probabilidad ${fmt(d.p, 2)} y la apuesta paga ${d.b} por cada 1 apostado.`;
    api.prompt(
      [
        `${base} ¿Qué fracción del capital apuesta Kelly? Tres decimales.`,
        `Con apuestas a la par y probabilidad ${fmt(d.p, 2)}, ¿cuánto vale f*? Dos decimales.`,
        `${base} Si apuestas f = ${fmt(d.f, 1)}, ¿cuánto vale g(f)? Cuatro decimales.`,
      ][round],
      ['f^*=p-\\frac{1-p}{b}', 'f^*=2p-1', 'g=p\\ln(1+bf)+(1-p)\\ln(1-f)'][round],
    );
    api.hints(
      [
        [
          'Resta a p la probabilidad de perder dividida por b.',
          'Con b = 2, la pérdida pesa la mitad.',
        ],
        ['A la par, b = 1.', 'f* = p − (1 − p) = 2p − 1.'],
        [
          'Gana: el capital queda por 1 + b·f. Pierde: por 1 − f.',
          'Pondera los logaritmos con p y 1 − p.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.kelly) < 0.0011)
        return api.result(
          true,
          `$f^*=${tnum(d.p)}-\\tfrac{${tnum(1 - d.p)}}{${d.b}}\\approx${tnum(d.kelly, 3)}$.`,
        );
      if (Math.abs(v - d.p) < 0.0011)
        return api.result(
          false,
          'Esa es la probabilidad de ganar. Kelly le resta la de perder sobre b.',
        );
      return api.result(false, `f* = ${fmt(d.p, 2)} − ${fmt(1 - d.p, 2)}/${d.b}.`);
    }
    if (round === 1) {
      const t = 2 * d.p - 1;
      if (Math.abs(v - t) < 0.011)
        return api.result(true, `$f^*=2\\cdot${tnum(d.p)}-1=${tnum(t)}$.`);
      return api.result(false, 'A la par: f* = p − (1 − p).');
    }
    if (Math.abs(v - d.g) < 0.00011) return api.result(true, `$g\\approx${tnum(d.g, 4)}$.`);
    return api.result(
      false,
      `g = ${fmt(d.p, 2)}·ln(1 + ${d.b}·${fmt(d.f, 1)}) + ${fmt(1 - d.p, 2)}·ln(1 − ${fmt(d.f, 1)}).`,
    );
  };
  return (
    <Stage>
      {round === 2 ? (
        <Cap x={540} y={380} size={24} color={C.muted}>
          {`p = ${fmt(d.p, 2)} · b = ${d.b} · f = ${fmt(d.f, 1)}`}
        </Cap>
      ) : (
        <Cap x={540} y={380} size={24} color={C.muted}>
          {round === 0 ? `p = ${fmt(d.p, 2)} · b = ${d.b}` : `p = ${fmt(d.p, 2)} · a la par`}
        </Cap>
      )}
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['f* =', 'f* =', 'g(f) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c8',
  world: 'decision',
  code: '13.8',
  title: 'Un paso antes',
  subtitle: 'Tamaño de apuesta (Kelly)',
  glyph: 'f^*',
  kind: 'level',
  guide: 'valentina',
  teaser:
    'La cuenta nunca apostó todo. Apostó siempre la misma fracción, una que solo tiene sentido si se gana el 60 % de las veces.',
  learn:
    'Elegir qué fracción del capital apostar con ventaja maximizando el crecimiento a largo plazo (criterio de Kelly).',
  glyphs: ['dec-kelly'],
  pitfalls: [
    'Con ventaja, apostar demasiado igual hace perder a la larga.',
    'La fracción de Kelly resta la probabilidad de perder dividida por lo que paga la apuesta.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Sala de operaciones, 22:30. Valentina abre el historial completo de la cuenta; las órdenes forman una columna perfectamente pareja.',
        },
        {
          who: 'valentina',
          text: 'Veinte por ciento del capital, cada vez. Nunca más, nunca menos.',
        },
        { who: 'iris', text: 'Un número muy prudente para alguien que siempre gana.' },
        {
          who: 'valentina',
          text: 'Prudente no. Exacto. Es la fracción justa si ganas seis de cada diez.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La fracción de la cuenta',
      Scene: AccountDemo,
      beats: [
        {
          say: 'Si la cuenta ganaba el 60 % de sus apuestas a la par, ¿qué fracción le convenía?',
          ask: {
            prompt: '¿Qué fracción de Kelly corresponde a p = 0,6 a la par?',
            options: ['0,2', '0,4', '0,6'],
            answer: 0,
            explain: 'f* = 0,6 − 0,4 = 0,2: exactamente lo que apostaba la cuenta.',
          },
          note: { label: 'La fracción', tex: 'f^*=0{,}2' },
        },
        {
          say: 'La cuenta apostó 0,2 desde el primer día, antes de tener historial para estimar su tasa de acierto.',
          ask: {
            prompt: '¿Qué indica que eligiera 0,2 desde el principio?',
            options: ['Que conocía su ventaja antes de apostar', 'Que tuvo suerte', 'Nada'],
            answer: 0,
            explain:
              'Sin historial, nadie sabe que gana el 60 %. Elegir justo 0,2 desde el principio es saber de antemano.',
          },
          note: {
            label: 'Saber de antemano',
            tex: 'f=0{,}2\\ \\text{desde el día 1}',
            body: 'La fracción delata la ventaja: la cuenta conocía los anuncios.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Cuánto apostar', Comp: KellyPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Teo cruza el número de la cuenta con el registro de titulares. La pantalla tarda en responder.',
        },
        { who: 'teo', text: 'Titular: una sociedad sin nombre. Domicilio: Torre Halcón, piso 40.' },
        {
          who: 'valentina',
          text: 'El último piso. Desde ahí se ve toda la bahía, y todos los anuncios antes que nadie.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-kelly',
    world: 'decision',
    tex: 'f^*=p-\\frac{1-p}{b}',
    name: 'Fracción de Kelly',
    read: 'efe estrella',
    meaning:
      'Fracción del capital que maximiza el crecimiento a largo plazo cuando se tiene ventaja.',
    warn: 'Apostar más que f* reduce el crecimiento; el doble lo vuelve cero o negativo.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Crecimiento', tex: 'g(f)=p\\ln(1+bf)+(1-p)\\ln(1-f)' },
    { label: 'Kelly', tex: 'f^*=p-\\frac{1-p}{b}' },
  ],
  props: [
    { label: 'A la par', tex: 'b=1\\Rightarrow f^*=2p-1' },
    { label: 'Ejemplo', tex: 'p=0{,}6:\\ f^*=0{,}2,\\ g\\approx0{,}0201' },
  ],
};

export { lesson };
