import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { DragCue, Choices, Confirm, NumberField, parseNum } from '../shared/ui';
import { Bars, counts, num } from './kit';

// ============================================================================
// CASO 6.1 · «El registro» — datos, frecuencias e histogramas
// Variables (cualitativas / cuantitativas discretas o continuas); frecuencia absoluta,
// relativa y acumulada; histogramas y el efecto del ancho de clase; formas de una distribución.
// ============================================================================

const AGES = [
  8, 12, 15, 19, 21, 22, 24, 25, 27, 28, 29, 31, 33, 34, 35, 36, 38, 41, 43, 45, 47, 52, 55, 58, 61,
  64, 67, 72, 78, 84,
];

const ROWS = [
  ['Edad', '67', '72', '29', 'cuantitativa discreta', C.amber],
  ['Comuna', 'Cerro Alegre', 'Playa Ancha', 'Placeres', 'cualitativa', C.magenta],
  ['Dosis', '2', '1', '2', 'cuantitativa discreta', C.amber],
  ['Temperatura (°C)', '36,4', '36,9', '37,2', 'cuantitativa continua', C.cyan],
];

// ---------------------------------------------------------------- lesson
function HistLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const [w, setW] = useState(10);
  if (beat === 0) {
    return (
      <Stage>
        {ROWS.map((r, i) => (
          <g key={i} opacity={clamp(at(0) * 4 - i * 0.6, 0, 1)}>
            <Cap x={330} y={220 + i * 90} size={24} color={C.text} anchor="left">
              {r[0]}
            </Cap>
            {[1, 2, 3].map((k) => (
              <Cap key={k} x={640 + (k - 1) * 170} y={220 + i * 90} size={22} color={C.muted}>
                {r[k]}
              </Cap>
            ))}
            <Cap x={1230} y={220 + i * 90} size={20} color={r[5]} anchor="left">
              {r[4]}
            </Cap>
          </g>
        ))}
        {[1, 2, 3].map((k) => (
          <Cap key={k} x={640 + (k - 1) * 170} y={150} size={18} color={C.dim}>
            {`paciente ${k}`}
          </Cap>
        ))}
      </Stage>
    );
  }
  if (beat === 3) {
    const shapes: { cs: number[]; name: string; c: number }[] = [
      { cs: [1, 3, 6, 9, 6, 3, 1], name: 'simétrica', c: 420 },
      { cs: [9, 8, 5, 3, 2, 1, 1], name: 'sesgada a la derecha', c: 800 },
      { cs: [2, 7, 5, 1, 4, 8, 3], name: 'bimodal', c: 1180 },
    ];
    return (
      <Stage>
        {shapes.map((s, i) => {
          const Q = plane([0, 7], [0, 10], { x: s.c - 160, y: 260, w: 320, h: 260 });
          return (
            <g key={i} opacity={clamp(at(3) * 3 - i, 0, 1)}>
              <Axes P={Q} />
              <Bars P={Q} lo={0} w={1} cs={s.cs} color={i === 2 ? C.magenta : C.amber} />
              <Cap x={s.c} y={560} size={20} color={C.text}>
                {s.name}
              </Cap>
            </g>
          );
        })}
        {answer !== null && (
          <Cap x={1180} y={620} size={18} color={C.green}>
            dos grupos mezclados
          </Cap>
        )}
      </Stage>
    );
  }
  const width = beat === 2 ? w : 10;
  const bins = Math.ceil(100 / width);
  const cs = counts(AGES, 0, width, bins);
  const P = plane([0, 100], [0, Math.max(...cs) + 2], { x: 300, y: 150, w: 840, h: 460 });
  const grow = beat === 1 ? at(1) : 1;
  const cum = cs.map((_, k) => cs.slice(0, k + 1).reduce((a, b) => a + b, 0));
  return (
    <Stage>
      <Axes
        P={P}
        xTicks={[0, 20, 40, 60, 80, 100]}
        yTicks={Array.from({ length: Math.max(...cs) + 2 }, (_, k) => k).filter((k) => k % 2 === 0)}
        xLabel="\text{edad}"
        yLabel="f"
        grid
      />
      <Bars
        P={P}
        lo={0}
        w={width}
        cs={cs.map((c) => c * grow)}
        labels={grow > 0.98 && width >= 10}
        hi={beat === 4 && answer !== null ? undefined : undefined}
      />
      {AGES.map((a, i) => (
        <circle
          key={i}
          cx={P.x(a)}
          cy={P.y(0) + 62}
          r={5}
          fill={C.cyan}
          opacity={beat === 1 ? 1 - at(1) * 0.5 : 0.5}
        />
      ))}
      {beat === 2 && (
        <Choices
          x={1340}
          y={300}
          options={[5, 10, 20, 40]}
          value={w}
          onPick={(v) => {
            setW(v);
            if (v !== 10) unlock();
          }}
          render={(v) => `${v}`}
          label="ancho (años)"
        />
      )}
      {beat <= 2 && (
        <Cap x={1370} y={230} size={22} color={C.text} tex={`n=30,\\ \\text{ancho }${width}`} />
      )}
      {beat === 4 && (
        <>
          {cs.slice(0, 5).map((c, k) => (
            <g key={k}>
              <Cap
                x={1270}
                y={200 + k * 46}
                size={18}
                color={C.muted}
                tex={`[${k * 10},${k * 10 + 10})`}
              />
              <Cap x={1380} y={200 + k * 46} size={18} color={C.amber} tex={String(c)} />
              <Cap
                x={1470}
                y={200 + k * 46}
                size={18}
                color={k === 3 && answer !== null ? C.green : C.cyan}
                tex={String(cum[k])}
              />
            </g>
          ))}
          <Cap x={1380} y={160} size={18} color={C.amber} tex="f_i" />
          <Cap x={1470} y={160} size={18} color={C.cyan} tex="F_i" />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Datos y distribuciones',
  intro: {
    question: '¿Cómo se ve de un vistazo la forma de un montón de datos?',
    text: 'Empieza la estadística, que saca conclusiones a partir de datos reales. El primer paso es ordenarlos: contar frecuencias y dibujar un histograma para ver dónde se concentran y qué forma tienen. La copia del registro de vacunación tiene sesenta pacientes, y su forma ya dice algo.',
  },
  Scene: HistLesson,
  beats: [
    {
      say: 'Cada ficha del registro es un **individuo** y cada columna, una **variable**: algo que se mide u observa en cada uno. Hay variables **cualitativas** (categorías) y **cuantitativas** (números); estas son **discretas** si se cuentan y **continuas** si se miden.',
      dur: 3.6,
      board: {
        label: 'Variables',
        tex: '\\begin{aligned}&\\p{1}{\\text{cualitativa}}\\\\&\\p{2}{\\text{cuantitativa: discreta o continua}}\\end{aligned}',
        parts: ['categorías del registro', 'cantidades del registro'],
      },
    },
    {
      say: 'Con muchos datos no sirve mirarlos uno por uno. Se agrupan en **clases** (intervalos del mismo ancho) y se cuenta cuántos caen en cada una: la **frecuencia absoluta** $f_i$. Dividida por el total $n$ es la **frecuencia relativa**.',
      dur: 3,
      board: {
        label: 'Frecuencias',
        tex: '\\p{1}{f_i},\\qquad \\p{2}{h_i=\\frac{f_i}{n}},\\qquad \\p{3}{\\sum_i h_i=1}',
        body: 'Aquí, 30 edades en clases de 10 años.',
        parts: ['casos en la clase', 'proporción del total', 'todas las proporciones'],
      },
    },
    {
      say: 'El **histograma** dibuja una barra por clase, con altura $f_i$. El ancho de clase importa: muy anchas esconden detalles; muy angostas, solo muestran ruido.',
      gate: 'Cambia el ancho de las clases y mira cómo cambia el histograma.',
      board: { label: 'Histograma', tex: '\\text{barras pegadas, altura}\\ \\propto f_i' },
    },
    {
      say: 'La **forma** de un histograma cuenta una historia: **simétrica**, **sesgada** (una cola larga hacia un lado) o **bimodal** (dos montañas).',
      ask: {
        prompt: 'Si un histograma de edades tiene dos montañas, ¿qué sugiere?',
        options: [
          'Que hay dos grupos distintos mezclados',
          'Que hay un error de cálculo',
          'Que la distribución es simétrica',
        ],
        answer: 0,
        explain:
          'Cada montaña es un grupo con su propia edad típica. Mezclados en un solo registro, producen dos modas.',
      },
      board: {
        label: 'Forma',
        tex: '\\text{simétrica}\\ \\cdot\\ \\text{sesgada}\\ \\cdot\\ \\text{bimodal}',
      },
    },
    {
      say: 'La **frecuencia acumulada** $F_i$ suma las frecuencias hasta la clase $i$: responde preguntas del tipo «¿cuántos tienen menos de tal edad?».',
      ask: {
        prompt: '¿Cuántas de estas 30 personas tienen menos de 40 años?',
        options: ['17', '6', '13'],
        answer: 0,
        explain: '$1+3+7+6=17$: es $F_4$, la acumulada hasta la clase $[30,40)$.',
      },
      board: {
        label: 'Frecuencia acumulada',
        tex: '\\p{1}{F_i}=\\p{2}{f_1+f_2+\\dots+f_i}',
        parts: ['casos hasta esta clase', 'suma hasta esta clase'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const CLINIC = [1, 9, 7, 1, 0, 0, 0, 1, 3, 8, 10, 9, 6, 4, 1]; // clases de 5 años desde 20
const PD = plane([20, 95], [0, 12], { x: 300, y: 140, w: 840, h: 470 });

function RegistryDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const young = beat >= 1 && (beat > 1 || answer !== null);
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[20, 30, 40, 50, 60, 70, 80, 90]}
        yTicks={[0, 2, 4, 6, 8, 10, 12]}
        xLabel="\text{edad}"
        yLabel="f"
        grid
      />
      <Bars
        P={PD}
        lo={20}
        w={5}
        cs={CLINIC.map((c) => c * (beat === 0 ? at(0) : 1))}
        labels={beat > 0 || at(0) > 0.98}
        color={C.amber}
      />
      {young && (
        <rect
          x={PD.x(20)}
          y={PD.box.y}
          width={PD.x(40) - PD.x(20)}
          height={PD.box.h}
          fill={C.magenta}
          opacity={0.12}
        />
      )}
      <line
        x1={PD.x(65)}
        x2={PD.x(65)}
        y1={PD.box.y}
        y2={PD.y(0)}
        stroke={C.green}
        strokeDasharray="8 8"
        opacity={beat >= 2 ? 1 : 0}
      />
      {beat >= 2 && (
        <Cap x={PD.x(65) + 80} y={PD.box.y + 20} size={16} color={C.green}>
          campaña: 65 o más
        </Cap>
      )}
      <Cap x={1370} y={230} size={22} color={C.text} tex="n=60" />
      {young && <Cap x={1370} y={290} size={22} color={C.magenta} tex="f_{[20,40)}=18" />}
      {beat === 2 && answer !== null && (
        <Cap x={1370} y={350} size={22} color={C.green} tex="h=\tfrac{18}{60}=0{,}30" />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const CLS = [20, 40, 60, 80, 100];

function Classify({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed * 41 + round);
    const ages = Array.from({ length: 16 }, () => randInt(r, 20, 99));
    const n = pick(r, [20, 25, 40, 50]);
    const f = [0, 0, 0, 0, 0];
    for (let k = 0; k < n; k++)
      f[Math.min(4, Math.floor(Math.abs(Math.sin(seed * 7 + k * 13 + round)) * 5))] += 1;
    const cls = randInt(r, 0, 4);
    const upto = randInt(r, 1, 4);
    return { ages, n, f, cls, upto };
  }, [seed, round]);
  const [h, setH] = useState([0, 0, 0, 0]);
  const [val, setVal] = useState('');
  const active = useRef(0);
  const P = plane([20, 100], [0, 10], { x: 300, y: 180, w: 760, h: 420 });
  const onDrag = useSvgDrag(svg, (x, y, phase) => {
    if (phase === 'start') active.current = clamp(Math.floor((P.inv(x, y)[0] - 20) / 20), 0, 3);
    const v = Math.round(clamp(P.inv(x, y)[1], 0, 10));
    setH((o) => o.map((t, k) => (k === active.current ? v : t)));
  });
  const { ages, n, f, cls, upto } = data;
  const truth = counts(ages, 20, 20, 4);
  const bounds = ['[0,10)', '[10,20)', '[20,30)', '[30,40)', '[40,50)'];

  useEffect(() => {
    setH([0, 0, 0, 0]);
    setVal('');
    if (round === 0) {
      api.prompt(
        'Arma el histograma de estas 16 edades: arrastra cada barra hasta su frecuencia.',
        'f_i=\\#\\{x\\in\\text{clase } i\\}',
      );
      api.hints([
        'Cada clase incluye su extremo izquierdo y excluye el derecho: 40 va en $[40,60)$.',
        'Las cuatro alturas deben sumar 16.',
      ]);
    } else if (round === 1) {
      api.prompt(
        `Tabla de minutos de espera de ${n} pacientes. ¿Qué porcentaje esperó entre ${bounds[cls].replace(/[[)]/g, '').replace(',', ' y ')} minutos?`,
        'h_i=\\frac{f_i}{n}',
      );
      api.hints([
        'Divide la frecuencia de esa clase por el total.',
        'Multiplica por 100 para expresarlo en porcentaje.',
      ]);
    } else {
      api.prompt(
        `Misma clase de tabla. ¿Cuántos pacientes esperaron menos de ${upto * 10} minutos?`,
        'F_i=f_1+\\dots+f_i',
      );
      api.hints([
        'Suma las frecuencias de todas las clases que quedan por debajo.',
        `Son las primeras ${upto} clases.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      if (h.every((t, k) => t === truth[k]))
        return api.result(true, `Frecuencias: ${truth.join(', ')}. Suman 16.`);
      const k = h.findIndex((t, i) => t !== truth[i]);
      return api.result(
        false,
        `La clase $[${CLS[k]},${CLS[k + 1]})$ no tiene ${h[k]} edades. Cuéntalas de nuevo.`,
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 1) {
      const t = (100 * f[cls]) / n;
      if (Math.abs(v - t) < 0.05)
        return api.result(
          true,
          `$\\tfrac{${f[cls]}}{${n}}=${num(f[cls] / n, 3)}$, es decir, ${num(t, 1).replace('{,}', ',')} %.`,
        );
      if (Math.abs(v - f[cls] / n) < 0.005)
        return api.result(false, 'Esa es la proporción. Pide el porcentaje: multiplica por 100.');
      if (Math.abs(v - f[cls]) < 0.01)
        return api.result(false, 'Esa es la frecuencia absoluta. Divídela por el total.');
      return api.result(false, `La clase tiene ${f[cls]} de ${n} pacientes.`);
    }
    const t = f.slice(0, upto).reduce((a, b) => a + b, 0);
    if (Math.abs(v - t) < 0.01)
      return api.result(true, `$F_${upto}=${f.slice(0, upto).join('+')}=${t}$.`);
    return api.result(false, `Suma las frecuencias de las ${upto} primeras clases.`);
  };

  return (
    <Stage ref={svg}>
      {round === 0 && (
        <>
          <Axes
            P={P}
            xTicks={CLS}
            yTicks={[0, 2, 4, 6, 8, 10]}
            xLabel="\text{edad}"
            yLabel="f"
            grid
          />
          <Bars P={P} lo={20} w={20} cs={h} labels color={C.amber} />
          {[0, 1, 2, 3].map((k) => (
            <rect
              key={k}
              x={P.x(20 + k * 20) + 6}
              y={P.box.y}
              width={P.x(40) - P.x(20) - 12}
              height={P.box.h}
              fill="transparent"
              onPointerDown={onDrag}
              style={{ cursor: 'ns-resize' }}
            />
          ))}
          <DragCue x={P.x(30)} y={P.y(h[0])} axis="y" color={C.amber} />
          <Html x={1340} y={330} size={20} color={C.text}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 3em)',
                gap: '0.4em',
                textAlign: 'center',
              }}
            >
              {ages.map((a, i) => (
                <span key={i} className="prop-tag">
                  {a}
                </span>
              ))}
            </div>
          </Html>
        </>
      )}
      {round > 0 && (
        <>
          <Cap x={560} y={200} size={22} color={C.muted}>
            minutos de espera
          </Cap>
          {f.map((c, k) => (
            <g key={k}>
              <Cap
                x={480}
                y={260 + k * 56}
                size={26}
                color={round === 1 && k === cls ? C.green : C.text}
                tex={bounds[k]}
              />
              <Cap x={680} y={260 + k * 56} size={26} color={C.amber} tex={String(c)} />
            </g>
          ))}
          <Cap x={480} y={260 + 5 * 56} size={26} color={C.muted} tex="\text{total}" />
          <Cap x={680} y={260 + 5 * 56} size={26} color={C.muted} tex={String(n)} />
          <NumberField
            x={1000}
            y={380}
            value={val}
            onChange={setVal}
            onEnter={submit}
            label={round === 1 ? 'porcentaje =' : 'pacientes ='}
            width={4}
            unit={round === 1 ? '%' : undefined}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c1',
  world: 'statistics',
  code: '6.1',
  title: 'El registro',
  subtitle: 'Datos y distribuciones',
  glyph: 'f_i',
  kind: 'level',
  guide: 'ana',
  teaser:
    'Los discos del Metro guardan una copia del registro de vacunación de la Clínica del Cerro. Antes de buscar diferencias hay que ver cómo se reparten los datos.',
  learn:
    'Tipos de variables, frecuencias absolutas, relativas y acumuladas, histogramas y formas de una distribución.',
  glyphs: ['st-freq', 'st-cum'],
  pitfalls: [
    'Una clase $[a,b)$ incluye $a$ y no incluye $b$.',
    'Las frecuencias relativas suman 1 (o 100 %).',
    'El histograma cambia con el ancho de clase: conviene probar más de uno.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'nar',
          text: 'Archivo Regional de Valparaíso, nueve de la mañana. Olía a cartón húmedo, y la archivera guardaba los discos del Metro en una caja de zapatos.',
        },
        {
          who: 'ana',
          text: 'Ana Rojas, archivera. Los discos del Metro contienen una copia del registro de la Clínica del Cerro; no coincide con el original, y no se la voy a entregar sin dejar constancia.',
        },
        {
          who: 'iris',
          text: 'Deja constancia, por supuesto. Mientras tanto, necesitamos ver quién aparece en la copia.',
        },
        {
          who: 'ana',
          text: 'Empiecen por las edades. La campaña era para personas de 65 años o más; después me dicen si siguen confiando en el original.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Las edades del registro',
      Scene: RegistryDemo,
      beats: [
        {
          say: 'Las edades de los 60 pacientes vacunados que figuran en la copia, en clases de 5 años.',
          dur: 2,
          note: { label: 'Registro de la clínica', tex: 'n=60,\\ \\text{clases de 5 años}' },
        },
        {
          say: 'Mira la forma del histograma.',
          ask: {
            prompt: '¿Qué llama la atención?',
            options: [
              'Dos grupos: uno de 25 a 35 años y otro de 65 a 90',
              'Que es simétrico',
              'Nada: es lo esperable',
            ],
            answer: 0,
            explain:
              'Es bimodal: un grupo de adultos mayores, como se esperaba, y otro de adultos jóvenes que no debería estar ahí.',
          },
          note: {
            label: 'Distribución bimodal',
            tex: '\\text{dos modas: }\\sim30\\ \\text{y}\\ \\sim72',
            body: 'Un grupo de 25 a 35 años mezclado con el de mayores.',
          },
        },
        {
          say: 'La campaña era solo para personas de 65 años o más.',
          ask: {
            prompt: '¿Qué fracción de los vacunados tiene menos de 40 años?',
            options: ['30 %', '18 %', '60 %'],
            answer: 0,
            explain: '$1+9+7+1=18$ de 60: $\\tfrac{18}{60}=0{,}30$.',
          },
          note: { label: 'Fuera de la campaña', tex: 'h=\\tfrac{18}{60}=0{,}30' },
        },
      ],
    },
    { kind: 'challenge', title: 'Clasificar y contar', Comp: Classify, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'ana',
          text: 'Dieciocho de los 60 pacientes tienen de 20 a menos de 40 años, el 30 %. El grupo joven se concentra entre 25 y 35, y los 18 dan la misma dirección: bodega 4 de Halcón Logística.',
        },
        {
          who: 'iris',
          text: 'Trabajadores de Halcón en una campaña para mayores. ¿El informe dice algo de eso?',
        },
        {
          who: 'ana',
          text: 'El informe habla de dosis diarias. Lo dejo junto a la copia; no mezclen los folios.',
        },
        {
          who: 'tu',
          text: 'Dieciocho personas con la misma dirección no salen por azar en una lista de sesenta.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'st-freq',
    world: 'statistics',
    tex: 'f_i,\\ h_i=\\tfrac{f_i}{n}',
    name: 'Frecuencia absoluta y relativa',
    read: 'efe i, hache i',
    meaning: 'Cuántos datos caen en la clase $i$, y qué fracción del total son.',
  },
  {
    id: 'st-cum',
    world: 'statistics',
    tex: 'F_i',
    name: 'Frecuencia acumulada',
    read: 'efe mayúscula i',
    meaning: 'Suma de las frecuencias hasta la clase $i$.',
  },
];
