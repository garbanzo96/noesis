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

// Caso 14.3 · La sala caliente. P(t) = 2 + t kW, 0 ≤ t ≤ 4 h: E = 16 kWh.
const BOX = { left: 210, right: 930, top: 230, bottom: 640 };
const energy = (base: number, rise: number, a: number, b: number) =>
  base * (b - a) + (rise * (b * b - a * a)) / 2;

/** Registro de potencia: el área coloreada no lleva un valor calculado. */
function PowerPlot({
  base,
  rise,
  duration,
  from = 0,
  until = 0,
  split = false,
}: {
  base: number;
  rise: number;
  duration: number;
  from?: number;
  until?: number;
  split?: boolean;
}) {
  const max = Math.max(4, base + rise * duration + 1);
  const x = (t: number) => BOX.left + (t / duration) * (BOX.right - BOX.left);
  const y = (p: number) => BOX.bottom - (p / max) * (BOX.bottom - BOX.top);
  const a = clamp(from, 0, duration);
  const b = clamp(until, a, duration);
  return (
    <g>
      <Cap x={570} y={170} size={24}>
        Registro del servidor · potencia
      </Cap>
      {b > a &&
        (split ? (
          <>
            <path
              d={`M${x(a)} ${y(0)} L${x(b)} ${y(0)} L${x(b)} ${y(base)} L${x(a)} ${y(base)} Z`}
              fill={C.cyan}
              opacity={0.25}
            />
            <path
              d={`M${x(a)} ${y(base)} L${x(b)} ${y(base)} L${x(b)} ${y(base + rise * b)} L${x(a)} ${y(base + rise * a)} Z`}
              fill={C.amber}
              opacity={0.3}
            />
            <line
              x1={x(a)}
              x2={x(b)}
              y1={y(base)}
              y2={y(base)}
              stroke={C.cyan}
              strokeWidth={2}
              strokeDasharray="7 7"
            />
          </>
        ) : (
          <path
            d={`M${x(a)} ${y(0)} L${x(b)} ${y(0)} L${x(b)} ${y(base + rise * b)} L${x(a)} ${y(base + rise * a)} Z`}
            fill={C.amber}
            opacity={0.25}
          />
        ))}
      <line
        x1={BOX.left}
        x2={BOX.right + 20}
        y1={BOX.bottom}
        y2={BOX.bottom}
        stroke={C.line}
        strokeWidth={3}
      />
      <line
        x1={BOX.left}
        x2={BOX.left}
        y1={BOX.bottom}
        y2={BOX.top}
        stroke={C.line}
        strokeWidth={3}
      />
      {[0, duration / 2, duration].map((t) => (
        <g key={t}>
          <line
            x1={x(t)}
            x2={x(t)}
            y1={BOX.bottom}
            y2={BOX.bottom + 10}
            stroke={C.muted}
            strokeWidth={2}
          />
          <Cap x={x(t)} y={690} size={18} color={C.muted}>{`${fmt(t, t % 1 ? 1 : 0)} h`}</Cap>
        </g>
      ))}
      {[0, base, base + rise * duration]
        .filter((v, i, all) => all.indexOf(v) === i)
        .map((p) => (
          <Cap key={p} x={165} y={y(p)} size={18} color={C.muted}>
            {fmt(p, 0)}
          </Cap>
        ))}
      <Cap x={165} y={205} size={18} color={C.muted}>
        kW
      </Cap>
      <path
        d={`M${x(0)} ${y(base)} L${x(duration)} ${y(base + rise * duration)}`}
        stroke={C.amber}
        strokeWidth={4}
        fill="none"
      />
      {b > a && (
        <line
          x1={x(b)}
          x2={x(b)}
          y1={y(base + rise * b)}
          y2={BOX.bottom}
          stroke={C.amber}
          strokeWidth={2}
          strokeDasharray="7 7"
        />
      )}
    </g>
  );
}

function AreaLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [sweep, setSweep] = useState(0);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    const next = Math.round(clamp((x - BOX.left) / (BOX.right - BOX.left), 0, 1) * 40) / 10;
    setSweep(next);
    if (beat === 1 && next === 4) unlock();
  });
  const end = beat === 0 ? 1 : beat === 1 ? sweep : beat === 3 ? 2 : 4;
  return (
    <Stage ref={svg}>
      <PowerPlot base={1} rise={1} duration={4} until={end} split={beat === 2} />
      <Cap x={1250} y={230} tex="P(t)=1+t" color={C.amber} />
      <Cap x={1250} y={320} size={22}>{`Tramo: 0 a ${fmt(end, end % 1 ? 1 : 0)} h`}</Cap>
      {beat === 0 && (
        <Cap x={1250} y={410} tex="\text{kW}\cdot\text{h}=\text{kWh}" color={C.cyan} />
      )}
      {beat === 1 && (
        <>
          <Knob
            x={BOX.left + (sweep / 4) * (BOX.right - BOX.left)}
            y={BOX.bottom}
            axis="x"
            onPointerDown={drag}
            color={C.amber}
          />
          <Cap x={1250} y={410} tex={`E=\\int_0^{${tnum(sweep, 1)}}(1+t)\\,dt`} />
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={410} tex="E_{\text{base}}=1\cdot4=4" color={C.cyan} />
          <Cap x={1250} y={500} tex="E_{\text{subida}}=\tfrac{4\cdot4}{2}=8" color={C.amber} />
          <Cap x={1250} y={590} tex="E=4+8=12\ \text{kWh}" color={C.green} />
        </>
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1250} y={410} tex="E=1\cdot2+\tfrac{2^2}{2}=4\ \text{kWh}" color={C.green} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={410} tex="F(t)=t+\tfrac{t^2}{2}" color={C.cyan} />
          <Cap x={1250} y={500} tex="E=F(4)-F(0)=12" color={C.green} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: acumular bajo la curva',
  intro: {
    question: '¿Cuánta energía se juntó en unas horas si la potencia cambiaba?',
    text: 'Este piso repasa la integral de La Represa: la energía es el área bajo la curva de potencia, y una primitiva la da exacta. Los servidores del piso 40 suben su potencia antes de cada anuncio, y el registro guarda cuatro horas de consumo.',
  },
  Scene: AreaLesson,
  beats: [
    {
      say: 'La potencia indica el consumo por hora. La **integral** acumula ese consumo en un intervalo: cada tira tiene altura en kW y ancho en horas.',
      board: {
        label: 'Energía acumulada',
        tex: '\\p{1}{E}=\\p{2}{\\int_a^b P(t)\\,dt}',
        body: 'kW por horas da kWh.',
        parts: ['energía acumulada', 'consumo entre dos tiempos'],
      },
    },
    {
      say: 'En este registro de repaso, P(t) = 1 + t. Barre las cuatro horas para cubrir todo el consumo.',
      gate: 'Arrastra la perilla hasta t = 4 h.',
      board: {
        label: 'Barrer el intervalo',
        tex: '\\p{1}{E}=\\p{2}{\\int_0^4(1+t)\\,dt}',
        parts: ['energía acumulada', 'consumo de cuatro horas'],
      },
    },
    {
      say: 'El área tiene un rectángulo de base 4 y altura 1, más un triángulo de base 4 y altura 4. Sus áreas suman 12 kWh.',
      board: {
        label: 'Dos áreas',
        tex: '\\p{1}{E}=\\p{2}{1\\cdot4+\\frac{4\\cdot4}{2}}=\\p{3}{12}',
        parts: ['energía acumulada', 'suma de ambas áreas', 'energía total'],
      },
    },
    {
      say: 'Ahora recorta el mismo registro a sus primeras dos horas.',
      ask: {
        prompt: '¿Cuánta energía acumula de 0 a 2 h?',
        options: ['4 kWh', '3 kWh', '6 kWh'],
        answer: 0,
        explain:
          'Rectángulo: 1·2 = 2. Triángulo: 2·2/2 = 2. Total: 4 kWh; 3 kW es solo la potencia final.',
      },
      board: {
        label: 'Primeras dos horas',
        tex: '\\p{1}{E}=\\p{2}{2+2}=\\p{3}{4\\ \\text{kWh}}',
        parts: ['energía acumulada', 'suma de ambas áreas', 'energía de dos horas'],
      },
    },
    {
      say: 'También puedes usar una **primitiva** F, cuya derivada es P. Evalúa F al final y resta su valor al inicio.',
      board: {
        label: 'Evaluar los extremos',
        tex: "\\int_a^b P(t)\\,dt=F(b)-F(a),\\quad F'(t)=P(t)",
      },
    },
  ],
};

function ServerDemo({ beats, answer }: DemoProps) {
  const last = beats.beat === 1;
  return (
    <Stage>
      <PowerPlot base={2} rise={1} duration={4} from={last ? 2 : 0} until={4} />
      <Cap x={1250} y={230} tex="P(t)=2+t\ \text{kW}" color={C.amber} />
      <Cap x={1250} y={320} size={22}>
        {last ? 'Tramo: de 2 a 4 h' : 'Tramo: de 0 a 4 h'}
      </Cap>
      <Cap x={1250} y={410} tex="F(t)=2t+\tfrac{t^2}{2}" color={C.cyan} />
      {answer !== null && (
        <>
          <Cap x={1250} y={500} tex={last ? 'E=F(4)-F(2)=16-6' : 'E=2\\cdot4+\\tfrac{4^2}{2}'} />
          <Cap
            x={1250}
            y={590}
            tex={last ? 'E=10\\ \\text{kWh}' : 'E=16\\ \\text{kWh}'}
            color={C.green}
          />
        </>
      )}
    </Stage>
  );
}

function EnergyPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 227 + round);
    const base = pick(r, [2, 3, 4, 5]);
    const rise = round === 0 ? 0 : pick(r, [1, 2, 3]);
    const duration = pick(r, [2, 4, 6]);
    const a = round === 2 ? duration / 2 : 0;
    const total = energy(base, rise, a, duration);
    return { base, rise, duration, a, total };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      `Otro servidor registra ${round === 0 ? `P(t) = ${d.base}` : `P(t) = ${d.base} + ${d.rise}t`} kW. ¿Cuánta energía consume entre t = ${d.a} y t = ${d.duration} horas? En kWh.`,
      round === 0 ? 'E=P\\,\\Delta t' : 'E=\\int_a^b P(t)\\,dt',
    );
    api.hints(
      round === 0
        ? ['La potencia se mantiene constante.', 'Multiplica los kW por las horas del intervalo.']
        : [
            'Una primitiva es F(t) = base·t + subida·t²/2.',
            'Evalúa F en la hora final y resta F en la hora inicial.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.01;
    if (near(d.total))
      return api.result(
        true,
        `$E=${d.base}\\cdot(${d.duration}-${d.a})+\\tfrac{${d.rise}}{2}(${d.duration}^2-${d.a}^2)=${tnum(d.total, 0)}\\ \\text{kWh}$.`,
      );
    if (near(d.base + d.rise * d.duration))
      return api.result(
        false,
        'Esa es la potencia al final, en kW. La energía acumula el consumo de todo el intervalo, en kWh.',
      );
    if (round > 0 && near((d.base + d.rise * d.duration) * (d.duration - d.a)))
      return api.result(
        false,
        'Usaste la potencia final durante todo el tramo. El registro crece: las horas anteriores consumieron menos.',
      );
    if (round > 0 && near(d.base * (d.duration - d.a) + d.rise * (d.duration ** 2 - d.a ** 2)))
      return api.result(
        false,
        'Falta dividir el término cuadrático por 2: la primitiva de t es t²/2.',
      );
    if (round === 2 && near(energy(d.base, d.rise, 0, d.duration)))
      return api.result(
        false,
        `Incluiste el consumo desde t = 0. Resta F(${d.a}) para conservar solo el tramo pedido.`,
      );
    if (round > 0 && near(d.base * (d.duration - d.a)))
      return api.result(
        false,
        'Contaste solo la potencia base. Falta acumular el aumento de potencia.',
      );
    return api.result(
      false,
      round === 0
        ? 'Multiplica la potencia constante por la duración del tramo.'
        : `Calcula F(${d.duration}) − F(${d.a}), con F(t) = ${d.base}t + ${d.rise}t²/2.`,
    );
  };
  return (
    <Stage>
      <PowerPlot base={d.base} rise={d.rise} duration={d.duration} />
      <Cap
        x={1250}
        y={210}
        tex={d.rise === 0 ? `P(t)=${d.base}` : `P(t)=${d.base}+${d.rise}t`}
        color={C.amber}
      />
      <Cap x={1250} y={300} size={22}>{`Inicio: ${d.a} h`}</Cap>
      <Cap x={1250} y={390} size={22}>{`Final: ${d.duration} h`}</Cap>
      <NumberField
        x={1080}
        y={500}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="E ="
        unit="kWh"
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c3',
  world: 'active',
  code: '14.3',
  title: 'La sala caliente',
  subtitle: 'Repaso: integral y energía',
  glyph: '\\int P(t)\\,dt',
  kind: 'level',
  guide: 'iris',
  teaser:
    'Los servidores del piso 40 aumentan su potencia antes de cada anuncio. El registro conserva cuatro horas de consumo.',
  learn:
    'Acumular energía como área bajo una curva de potencia y evaluar una integral entre dos horas.',
  glyphs: ['tor-energy-area', 'tor-energy-bounds'],
  pitfalls: [
    'La potencia se mide en kW; la energía acumulada, en kWh.',
    'Usar la potencia final durante todo el tramo sobreestima un consumo creciente.',
    'Una integral entre a y b requiere restar F(a) a F(b).',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Piso 21, sala técnica. El aire de la rejilla quemaba los dedos; ahí descargaban su calor los servidores del piso 40.',
        },
        {
          who: 'teo',
          text: 'El sistema guarda la potencia por hora. Sube antes de cada anuncio, aunque el panel de tareas dice que está en reposo.',
        },
        { who: 'tu', text: 'Con la última lectura pueden esconder las horas anteriores.' },
        {
          who: 'iris',
          text: 'Entonces toma el tramo completo. Quiero el consumo de esas cuatro horas.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Cuatro horas antes del anuncio',
      Scene: ServerDemo,
      beats: [
        {
          say: 'El registro del piso 40 marca P(t) = 2 + t kW durante cuatro horas, con t en horas desde el inicio.',
          ask: {
            prompt: '¿Cuánta energía consumieron los servidores?',
            options: ['16 kWh', '6 kWh', '24 kWh'],
            answer: 0,
            explain:
              'El consumo base aporta 2·4 = 8 kWh; el aumento aporta 4²/2 = 8 kWh. Total: 16 kWh.',
          },
          note: {
            label: 'Consumo antes del anuncio',
            tex: 'E=\\int_0^4(2+t)\\,dt=8+8=16\\ \\text{kWh}',
            body: 'La lectura final es 6 kW. No representa la energía de las cuatro horas.',
          },
        },
        {
          say: 'Teo separa las últimas dos horas del registro: el tramo de t = 2 a t = 4.',
          ask: {
            prompt: '¿Cuánta energía corresponde solo a ese tramo?',
            options: ['10 kWh', '16 kWh', '6 kWh'],
            answer: 0,
            explain:
              'F(4) = 16 y F(2) = 6. Al restar queda 10 kWh; 16 incluye las primeras dos horas.',
          },
          note: {
            label: 'Últimas dos horas',
            tex: 'E=\\left[2t+\\frac{t^2}{2}\\right]_2^4=16-6=10\\ \\text{kWh}',
            body: 'El tramo final consume más energía que las primeras dos horas: la potencia va aumentando.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar otros registros', Comp: EnergyPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Teo guardó la curva completa. El ventilador aceleró y tapó por un momento un ruido de pasos al otro lado del pasillo.',
        },
        {
          who: 'teo',
          text: 'Dieciséis kWh antes del anuncio. El panel dice reposo, pero el sistema trabajó cada vez más.',
        },
        {
          who: 'iris',
          text: 'Guarda también ese panel. Alguien tendrá que explicar por qué dice reposo.',
        },
        {
          who: 'nar',
          text: 'En el reflejo del vidrio apareció una linterna. Se detuvo junto a la puerta y después siguió de largo.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-energy-area',
    world: 'active',
    tex: 'E=\\int_a^b P(t)\\,dt',
    name: 'Energía como área',
    read: 'E igual a integral de a a b de P de t, diferencial de t',
    meaning:
      'Acumula la potencia en el intervalo. Con potencia en kW y tiempo en horas, la energía queda en kWh.',
    warn: 'La potencia de un instante no es el consumo acumulado.',
  },
  {
    id: 'tor-energy-bounds',
    world: 'active',
    tex: '\\int_a^b P(t)\\,dt=F(b)-F(a)',
    name: 'Restar los extremos',
    read: 'Integral de a a b de P de t igual a F de b menos F de a',
    meaning:
      'Si F es una primitiva de P, la diferencia entre sus valores final e inicial da la energía del tramo.',
    warn: 'Si el intervalo comienza después de cero, también debes restar el valor inicial.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Energía acumulada',
      tex: 'E=\\int_a^b P(t)\\,dt',
      body: 'Área bajo la potencia no negativa entre las horas a y b; kW·h = kWh.',
    },
    { label: 'Primitiva', tex: "F'(t)=P(t)" },
  ],
  props: [
    { label: 'Evaluar el tramo', tex: '\\int_a^b P(t)\\,dt=F(b)-F(a)' },
    {
      label: 'Potencia lineal',
      tex: 'P(t)=p_0+mt\\quad\\Rightarrow\\quad F(t)=p_0t+\\frac{mt^2}{2}',
    },
    { label: 'Registro de la sala', tex: '\\int_0^4(2+t)\\,dt=16\\ \\text{kWh}' },
  ],
};

export { lesson };
