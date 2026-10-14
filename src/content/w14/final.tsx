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

const TITLES = ['Carga', 'Ascensor', 'Energía', 'Firma', 'Modelo de la ciudad'];
const FORMULAS = [
  't=\\tau\\log_2\\frac{C_0}{C}',
  "h'(t)=2At-3Bt^2,\\quad t_*=\\frac{A}{3B}",
  'E=\\int_0^T(a+bt)\\,dt=aT+\\frac{bT^2}{2}',
  'O=O_0\\prod_i L_i,\\quad P=\\frac{O}{1+O}',
  'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}',
];
const IDS = [
  'tor-final-charge',
  'tor-final-speed',
  'tor-final-energy',
  'tor-final-posterior',
  'tor-final-kl',
];
const P = [0.25, 0.25, 0.25, 0.25];
const Q = [0.4, 0.1, 0.1, 0.4];

/** Panel del expediente: esquemas y datos de entrada, sin resultados calculados. */
function EvidenceDrawing({ tool, rows, q = Q }: { tool: number; rows: string[]; q?: number[] }) {
  return (
    <g>
      <rect
        x={150}
        y={130}
        width={800}
        height={600}
        rx={20}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={550} y={180} size={26} color={C.amber}>
        {TITLES[tool]}
      </Cap>
      {tool === 0 &&
        [1, 0.5, 0.25, 0.125].map((c, i) => (
          <g key={i}>
            <rect
              x={235 + i * 170}
              y={400 - c * 140}
              width={90}
              height={c * 140}
              rx={5}
              fill={C.cyan}
            />
            <Cap x={280 + i * 170} y={440} size={20}>
              {i} mitades
            </Cap>
          </g>
        ))}
      {tool === 1 && (
        <g>
          <path d="M230 420 Q550 100 870 420" stroke={C.cyan} strokeWidth={5} fill="none" />
          <line x1={230} x2={870} y1={420} y2={420} stroke={C.line} strokeWidth={2} />
          <Cap x={550} y={460} size={20}>
            Velocidad · esquema de la parábola
          </Cap>
        </g>
      )}
      {tool === 2 && (
        <g>
          <path d="M230 420 L230 360 L870 250 L870 420 Z" fill={C.amber} fillOpacity={0.25} />
          <path d="M230 360 L870 250" stroke={C.amber} strokeWidth={5} />
          <path d="M230 240 L230 420 L870 420" stroke={C.line} strokeWidth={2} fill="none" />
          <Cap x={550} y={460} size={20}>
            Potencia × tiempo · área del trapecio
          </Cap>
        </g>
      )}
      {tool === 3 && (
        <g>
          <line x1={260} x2={840} y1={340} y2={340} stroke={C.line} strokeWidth={4} />
          {['Prior', 'Horario', 'Firma', 'Ficha'].map((label, i) => (
            <g key={label}>
              <circle cx={280 + i * 180} cy={340} r={25} fill={i === 0 ? C.cyan : C.violet} />
              <Cap x={280 + i * 180} y={410} size={20}>
                {label}
              </Cap>
            </g>
          ))}
        </g>
      )}
      {tool === 4 && (
        <g>
          {q.map((v, i) => (
            <g key={i}>
              <rect
                x={250 + i * 160}
                y={430 - 350 * P[i]}
                width={45}
                height={350 * P[i]}
                fill={C.cyan}
              />
              <rect
                x={305 + i * 160}
                y={430 - 350 * v}
                width={45}
                height={350 * v}
                fill={C.amber}
              />
              <Cap x={300 + i * 160} y={470} size={20}>
                Sector {i + 1}
              </Cap>
            </g>
          ))}
        </g>
      )}
      {rows.map((row, i) => (
        <Cap key={i} x={550} y={540 + i * 70} size={21}>
          {row}
        </Cap>
      ))}
    </g>
  );
}

const REVIEW_ROWS = [
  ['Carga inicial: 100 %; objetivo: 25 %', 'Una mitad cada 6 horas'],
  ['h(t) = 90t² − 30t³ m; 0 ≤ t ≤ 2 min', 'Busca el máximo de la velocidad, no de la altura'],
  ['P(t) = 1 + t kW; 0 ≤ t ≤ 3 h', 'La energía acumula todo el intervalo'],
  ['Prior: 1 : 4; pruebas independientes', 'LR: 8 por horario; 3 por firma'],
  ['p: 0,25 en cada sector · barras celestes', 'q: (0,3; 0,2; 0,2; 0,3) · barras ámbar'],
];
function FinalLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [halves, setHalves] = useState(0);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 0) return;
    const n = Math.round(clamp((x - 250) / 200, 0, 3));
    setHalves(n);
    if (n === 2) unlock();
  });
  return (
    <Stage ref={svg}>
      <EvidenceDrawing tool={beat} rows={REVIEW_ROWS[beat]} q={[0.3, 0.2, 0.2, 0.3]} />
      <Cap x={1250} y={190} size={23}>
        Repaso · lectura {beat + 1} de 5
      </Cap>
      {beat === 0 && (
        <>
          <line x1={250} x2={850} y1={780} y2={780} stroke={C.line} strokeWidth={4} />
          <Knob x={250 + halves * 200} y={780} axis="x" onPointerDown={drag} />
          <Cap x={1250} y={290} size={22}>
            {halves} mitades · {fmt(100 * 2 ** -halves)} %
          </Cap>
          <Cap x={1250} y={390} tex={`t=6\\cdot${halves}=${halves * 6}\\ \\text{h}`} />
          <Cap x={1250} y={490} tex="\log_2(100/25)=2" />
        </>
      )}
      {beat === 1 && (
        <>
          <Cap x={1250} y={290} tex="h'(t)=180t-90t^2" size={22} />
          <Cap x={1250} y={390} tex="h''(t)=180-180t" size={22} />
          {answer !== null && (
            <Cap x={1250} y={490} tex="t_*=1,\quad v_{\max}=90" color={C.green} />
          )}
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={290} tex="E=1\cdot3+\frac{3^2}{2}" />
          <Cap x={1250} y={390} tex="E=7{,}5\ \text{kWh}" color={C.green} />
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={290} tex="O=\frac14\cdot8\cdot3=6" />
          {answer !== null && (
            <>
              <Cap x={1250} y={390} tex="P=\frac{6}{7}\approx0{,}857" color={C.green} />
              <Cap x={1250} y={490} size={21}>
                6 : 1 son chances.
              </Cap>
            </>
          )}
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={290} tex="\sum_i p_i\log_2(p_i/q_i)" size={22} />
          <Cap
            x={1250}
            y={390}
            tex={`KL(p\\Vert q)\\approx${tnum(kl2(P, [0.3, 0.2, 0.2, 0.3]), 3)}`}
            color={C.green}
          />
          <Cap x={1250} y={490} size={21}>
            Bits · p describe los registros.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Cinco herramientas en el expediente',
  Scene: FinalLesson,
  beats: [
    {
      say: 'Las barras cuentan mitades de la carga inicial. El **logaritmo** recupera cuántas mitades necesitas; mueve la perilla hasta llegar al 25 %.',
      gate: 'Arrastra la perilla hasta 2 mitades.',
      board: { label: TITLES[0], tex: FORMULAS[0], body: 'Dos mitades de 6 horas: 12 horas.' },
    },
    {
      say: 'La curva representa la velocidad del ascensor de prueba. La **derivada** de la altura da velocidad; su máximo está donde h″ cambia de positivo a negativo.',
      ask: {
        prompt: '¿Cuál es la velocidad máxima, en m/min?',
        options: ['90', '120', '180'],
        answer: 0,
        explain: 'h″ = 180 − 180t se anula en t = 1. Allí h′ = 90; en ambos extremos vale 0.',
      },
      board: { label: TITLES[1], tex: FORMULAS[1] },
    },
    {
      say: 'El área del trapecio acumula potencia durante tres horas. La **integral** suma 3 del rectángulo y 4,5 del triángulo: 7,5 kWh.',
      board: {
        label: TITLES[2],
        tex: FORMULAS[2],
        body: 'Potencia en kW; tiempo en horas; energía en kWh.',
      },
    },
    {
      say: 'Cada prueba independiente multiplica las **chances** anteriores por su razón de verosimilitud. Aquí quedan 6 : 1; conviértelas a probabilidad.',
      ask: {
        prompt: '¿Qué probabilidad corresponde a 6 : 1?',
        options: ['0,6', '0,857', '6'],
        answer: 1,
        explain: 'Son seis partes a favor y una en contra: 6/(6 + 1) = 6/7 ≈ 0,857.',
      },
      board: { label: TITLES[3], tex: FORMULAS[3] },
    },
    {
      say: 'Las barras celestes son los registros y las ámbar son el modelo. **KL** pondera con p cuánto cambia log₂(p/q); aquí la diferencia es pequeña, cerca de 0,029 bits.',
      board: {
        label: TITLES[4],
        tex: FORMULAS[4],
        body: 'Con logaritmo base 2, la divergencia se expresa en bits; importa el orden p y q.',
      },
    },
  ],
};

function FinalDemo({ beats, answer }: DemoProps) {
  const signature = beats.beat === 1;
  return (
    <Stage>
      <EvidenceDrawing
        tool={signature ? 4 : 0}
        rows={
          signature
            ? [
                'p: (0,25; 0,25; 0,25; 0,25)',
                'q: (0,4; 0,1; 0,1; 0,4)',
                'Prior 1 : 9 · LR independientes: 18, 4 y 5',
              ]
            : [
                'Carga 100 → 12,5 %; mitad cada 8 h',
                'h(t) = 120t² − 40t³ m; 0 ≤ t ≤ 2 min',
                'P(t) = 2 + t kW; 0 ≤ t ≤ 4 h',
              ]
        }
      />
      <Cap x={1250} y={190} size={23}>
        {signature ? 'Firma y reparto' : 'Acceso y consumo'}
      </Cap>
      <Cap x={1250} y={290} size={20}>
        Expediente · piso 40
      </Cap>
      {answer !== null &&
        (signature ? (
          <>
            <Cap x={1250} y={390} tex="O=\frac19\cdot18\cdot4\cdot5=40" size={20} />
            <Cap x={1250} y={490} tex="P=\frac{40}{41}\approx0{,}976" color={C.green} />
            <Cap
              x={1250}
              y={590}
              tex={`KL(p\\Vert q)\\approx${tnum(kl2(P, Q), 3)}\\ \\text{bits}`}
              color={C.green}
            />
          </>
        ) : (
          <>
            <Cap x={1250} y={390} tex="t=8\log_2 8=24\ \text{h}" color={C.green} />
            <Cap x={1250} y={490} tex="v_{\max}=120\ \text{m/min}" color={C.green} />
            <Cap x={1250} y={590} tex="E=8+8=16\ \text{kWh}" color={C.green} />
          </>
        ))}
    </Stage>
  );
}

function FinalPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 503 + round);
    const tau = pick(r, [4, 6, 8, 10]);
    const halves = pick(r, [2, 3, 4]);
    const B = pick(r, [20, 30, 40, 50]);
    const A = 3 * B; // t* = 1; intervalo [0, 2], velocidad cero en sus extremos.
    const a = pick(r, [1, 2, 3]);
    const b = pick(r, [1, 2, 3]);
    const T = pick(r, [2, 3, 4]);
    const against = pick(r, [4, 6, 9]);
    const lr = [pick(r, [6, 12, 18]), pick(r, [2, 4]), pick(r, [3, 5])];
    const odds = lr.reduce((v, n) => v * n, 1) / against;
    const outer = pick(r, [0.3, 0.35, 0.4, 0.45]);
    const q = [outer, 0.5 - outer, 0.5 - outer, outer];
    return { tau, halves, charge: 100 * 2 ** -halves, A, B, a, b, T, against, lr, odds, q };
  }, [seed, round]);
  const targets =
    round === 0
      ? [d.tau * d.halves, d.A ** 2 / (3 * d.B)]
      : round === 1
        ? [d.a * d.T + (d.b * d.T ** 2) / 2, d.odds / (1 + d.odds)]
        : [kl2(P, d.q)];
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      [
        'Calcula las horas para llegar a la carga objetivo y la velocidad máxima del ascensor. Dos decimales; conserva las unidades de los datos.',
        'Calcula la energía acumulada y la probabilidad posterior de la firma. Energía con dos decimales; probabilidad entre 0 y 1 con tres decimales.',
        'Calcula KL(p ‖ q) en bits, usando p para ponderar y logaritmo base 2. Tres decimales.',
      ][round],
      [FORMULAS[0] + ',\\quad ' + FORMULAS[1], FORMULAS[2] + ',\\quad ' + FORMULAS[3], FORMULAS[4]][
        round
      ],
    );
    api.hints(
      [
        [
          'Cuenta las mitades con log₂(100/C); multiplica por las horas de cada mitad.',
          'Deriva h, resuelve h″ = 0 y evalúa h′; compara con los extremos.',
        ],
        [
          'Integra el término constante y el término lineal por separado.',
          'Multiplica las chances 1/n por las tres LR; después usa O/(1 + O).',
        ],
        [
          'En cada sector calcula 0,25·log₂(0,25/qᵢ).',
          'Suma los cuatro términos, incluidos los negativos. Redondea al final.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const values = [parseNum(first), parseNum(second)];
    if (
      values[0] === null ||
      !Number.isFinite(values[0]) ||
      (round < 2 && (values[1] === null || !Number.isFinite(values[1])))
    )
      return;
    const near = (v: number, n: number, tolerance = 0.0051) => Math.abs(v - n) <= tolerance;
    for (let i = 0; i < targets.length; i++) {
      const v = values[i]!;
      if (near(v, targets[i], round === 2 || (round === 1 && i === 1) ? 0.00051 : 0.0051)) continue;
      if (round === 0 && i === 0)
        return api.result(
          false,
          near(v, d.halves)
            ? 'Contaste las mitades. Falta multiplicar por las horas que dura cada una.'
            : 'Usa log₂(100/C), en ese orden, y multiplícalo por el tiempo de una mitad.',
        );
      if (round === 0)
        return api.result(
          false,
          near(v, 1)
            ? 'Ese es el minuto de velocidad máxima. El campo pide h′ evaluada en ese minuto.'
            : near(v, d.A - d.B)
              ? 'Evaluaste la altura. La velocidad sale de h′(t) = 2At − 3Bt².'
              : 'Resuelve 2A − 6Bt = 0 y evalúa la velocidad 2At − 3Bt²; revisa también los extremos.',
        );
      if (round === 1 && i === 0)
        return api.result(
          false,
          near(v, d.a + d.b * d.T)
            ? 'Eso es potencia al final, en kW. La energía es el área durante todo el intervalo, en kWh.'
            : near(v, d.a * d.T + d.b * d.T ** 2)
              ? 'El término lineal integra a bT²/2. Falta dividir por dos el área triangular.'
              : 'Integra de 0 a T: aT + bT²/2. No omitas el consumo constante.',
        );
      if (round === 1)
        return api.result(
          false,
          near(v, d.odds)
            ? 'Esas son chances, no probabilidad. Divide O por 1 + O.'
            : near(v, targets[1] * 100)
              ? 'Escribiste un porcentaje. El campo pide probabilidad entre 0 y 1.'
              : 'Parte con chances 1/n, multiplica las tres LR independientes y convierte con O/(1 + O).',
        );
      const reverse = kl2(d.q, P);
      return api.result(
        false,
        near(v, reverse, 0.00051)
          ? 'Invertiste el orden: calculaste KL(q ‖ p). Pondera con los registros p y usa log₂(p/q).'
          : near(v, targets[0] * Math.LN2, 0.00051)
            ? 'Usaste logaritmo natural. Para obtener bits, usa logaritmo base 2.'
            : 'Incluye los cuatro términos pᵢ·log₂(pᵢ/qᵢ), también los negativos. Suma antes de redondear.',
      );
    }
    api.result(
      true,
      round === 0
        ? `Carga: ${fmt(targets[0])} h; velocidad máxima: ${fmt(targets[1])} m/min en t = 1 min.`
        : round === 1
          ? `Energía: ${fmt(targets[0])} kWh; chances ${fmt(d.odds)} : 1; posterior ${fmt(targets[1], 3)}.`
          : `KL(p ‖ q) = ${fmt(targets[0], 3)} bits. Los registros ponderan cada diferencia.`,
    );
  };
  const rows =
    round === 0
      ? [
          `Carga: 100 → ${fmt(d.charge)} %; mitad cada ${d.tau} h`,
          `h(t) = ${d.A}t² − ${d.B}t³ m; 0 ≤ t ≤ 2 min`,
        ]
      : round === 1
        ? [
            `P(t) = ${d.a} + ${d.b}t kW; 0 ≤ t ≤ ${d.T} h`,
            `Prior 1 : ${d.against}; pruebas independientes`,
            `LR: ${d.lr.join(' · ')}`,
          ]
        : ['p: (0,25; 0,25; 0,25; 0,25)', `q: (${d.q.map((v) => fmt(v)).join('; ')})`];
  return (
    <Stage>
      <EvidenceDrawing tool={[1, 2, 4][round]} rows={rows} q={d.q} />
      <Cap x={1250} y={190} size={23}>
        Control {round + 1} de 3
      </Cap>
      <Cap x={1250} y={290} size={20}>
        {round === 2 ? 'KL en bits · tres decimales' : 'Completa ambas lecturas'}
      </Cap>
      <NumberField
        x={1080}
        y={420}
        value={first}
        onChange={setFirst}
        onEnter={submit}
        label={['t (h) =', 'E (kWh) =', 'KL ='][round]}
      />
      {round < 2 && (
        <NumberField
          x={1080}
          y={540}
          value={second}
          onChange={setSecond}
          onEnter={submit}
          label={round === 0 ? 'v (m/min) =' : 'P ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-final',
  world: 'active',
  code: '14.★',
  title: 'El último piso',
  subtitle: 'Cinco lecturas · Síntesis final',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w14-closed',
  guide: 'iris',
  teaser: 'El Contador espera junto a la ventana del piso 40. Iris abre el expediente completo.',
  learn:
    'Reunir logaritmos, derivadas, integrales, chances bayesianas y KL para leer las pruebas de la torre.',
  glyphs: IDS,
  pitfalls: [
    'El logaritmo cuenta mitades; falta convertirlas a horas.',
    'La velocidad es la derivada de la altura.',
    'Energía y potencia tienen unidades distintas.',
    'Las chances se convierten con O/(1 + O).',
    'KL usa el orden p ‖ q y logaritmo base 2 para bits.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Piso 40. La bahía se refleja en el vidrio; el Contador espera junto a la ventana, con una ficha del Casino Aurora entre los dedos.',
        },
        {
          who: 'contador',
          text: 'Si hubieran esperado otra ronda, habría terminado mi trabajo. Todavía podrían ahorrarse el suyo.',
        },
        { who: 'iris', text: 'Subimos ahora. Deja la ficha en el escritorio.' },
        {
          who: 'teo',
          text: 'Los servidores siguen escribiendo. Puedo copiar la cuenta, los horarios y el modelo con sus versiones.',
        },
        { who: 'tu', text: 'Conserva los originales. Voy a revisar las cinco lecturas juntas.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Las cifras frente a la ventana',
      Scene: FinalDemo,
      beats: [
        {
          say: 'Iris reúne el acceso y el consumo: la credencial cae de 100 % a 12,5 % con mitades de 8 horas; el ascensor sigue h(t) = 120t² − 40t³ en [0, 2]; los servidores consumen P(t) = 2 + t durante 4 horas.',
          ask: {
            prompt: '¿Qué lectura completa coincide con los registros?',
            options: [
              '24 h; 120 m/min; 16 kWh',
              '3 h; 120 m/min; 6 kWh',
              '24 h; 160 m/min; 24 kWh',
            ],
            answer: 0,
            explain:
              'Tres mitades duran 24 h. La velocidad máxima es h′(1) = 120; h(2) = 160 es altura. La integral de 2 + t da 16 kWh.',
          },
          note: {
            label: 'Acceso y consumo de la torre',
            tex: 't=24\\ \\text{h},\\quad v_{\\max}=120\\ \\text{m/min},\\quad E=16\\ \\text{kWh}',
            body: 'Las tres cifras provienen de carga, altura y potencia; conserva sus unidades.',
          },
        },
        {
          say: 'La firma parte con chances 1 : 9 y tres LR independientes: 18, 4 y 5. Los registros reparten p = 0,25 en cada sector; el modelo usa q = (0,4; 0,1; 0,1; 0,4).',
          ask: {
            prompt: '¿Qué pareja da el posterior y KL(p ‖ q)?',
            options: ['40; 0,322 bits', '0,976; 0,322 bits', '0,976; 0 bits'],
            answer: 1,
            explain:
              'Las chances quedan 40 : 1, así que P = 40/41 ≈ 0,976. KL = 0,5·log₂(0,625) + 0,5·log₂(2,5) ≈ 0,322 bits.',
          },
          note: {
            label: 'Firma y modelo',
            tex: 'P=\\frac{40}{41}\\approx0{,}976,\\quad KL(p\\Vert q)\\approx0{,}322\\ \\text{bits}',
            body: 'El posterior depende del prior y la independencia de las pruebas. KL mide el desajuste del modelo; por sí solo no prueba intención.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Revisar las copias del expediente',
      Comp: FinalPractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La copia termina con un clic. Iris gira la pantalla hacia la ventana para que el Contador vea las cifras.',
        },
        {
          who: 'iris',
          text: 'Tu credencial, cargada hace veinticuatro horas. El ascensor, ciento veinte metros por minuto en su tramo más rápido. La sala, dieciséis kilovatios-hora antes de cada anuncio. La firma, cuarenta contra uno. Y un modelo que manda recursos a los barrios donde tienes contratos.',
        },
        {
          who: 'contador',
          text: 'Números. En el casino aprendí que la casa siempre gana porque nadie revisa la cuenta.',
        },
        {
          who: 'teo',
          text: 'Esta cuenta ya está copiada, con cada versión y su hora. También los cambios que intentaron borrar.',
        },
        {
          who: 'iris',
          text: 'Esta vez la revisamos.',
        },
        {
          who: 'nar',
          text: 'El Contador deja la ficha sobre el escritorio vacío. Iris la guarda en una bolsa de evidencia; por primera vez, él mira hacia la puerta.',
        },
        {
          who: 'noesis',
          text: 'Empezaste en el muelle contando cajas. Cada piso de esta torre fue una herramienta que aprendiste desde cero, y cada cifra del expediente es un cálculo que cualquiera puede repetir.',
        },
      ],
    },
    {
      kind: 'scene',
      place: 'puerto',
      lines: [
        {
          who: 'nar',
          text: 'Puerto, al amanecer. El motor del camión refrigerado sigue encendido mientras Rosa comprueba el sello del cargamento recuperado.',
        },
        {
          who: 'rosa',
          text: 'Las vacunas vuelven a la Clínica. Esta vez la guía y las cajas dicen lo mismo.',
        },
        { who: 'iris', text: 'Me quedo hasta que firmen la recepción.' },
        {
          who: 'nar',
          text: 'Rosa baja la cortina del camión. Sobre el muelle, la ciudad amanece con las cuentas a la vista.',
        },
        {
          who: 'noesis',
          text: 'Caso cerrado. Las herramientas quedan en tu cuaderno; los recursos de estudio siguen abiertos para repasar cualquier mundo.',
        },
      ],
    },
  ],
};

const MEANINGS = [
  'Recupera el tiempo de descarga a partir de la cantidad de mitades y su duración.',
  'Deriva la altura y encuentra el máximo interior de la velocidad para A y B positivos.',
  'Acumula potencia lineal durante T horas para obtener energía.',
  'Actualiza chances con pruebas independientes y las convierte en probabilidad.',
  'Mide en bits la divergencia del modelo q respecto de los registros p.',
];
const WARNINGS = [
  'Usa C₀/C y la misma unidad de tiempo que τ.',
  'Comprueba que t* pertenece al intervalo y compara la velocidad en sus extremos.',
  'Si P está en kW y t en horas, E queda en kWh.',
  'No multipliques LR como independientes si las pruebas dependen entre sí.',
  'El orden importa: pondera con p; q debe ser positiva donde p lo es.',
];
export const glyphs: Glyph[] = TITLES.map((name, i) => ({
  id: IDS[i],
  world: 'active',
  tex: FORMULAS[i],
  name,
  read: [
    'te igual a tau por logaritmo base dos de carga inicial sobre carga',
    'velocidad igual a dos A te menos tres B te al cuadrado',
    'energía igual a la integral de potencia',
    'chances igual a chances previas por las razones de verosimilitud; probabilidad igual a O sobre uno más O',
    'KL de pe respecto de cu igual a la suma de pe por logaritmo base dos de pe sobre cu',
  ][i],
  meaning: MEANINGS[i],
  warn: WARNINGS[i],
}));
export const ref: TopicRef = {
  defs: TITLES.map((label, i) => ({
    label,
    tex: FORMULAS[i],
    body: `${MEANINGS[i]} ${WARNINGS[i]}`,
  })),
  props: [
    { label: 'Carga de la credencial', tex: '8\\log_2(100/12{,}5)=24\\ \\text{h}' },
    { label: 'Velocidad y altura', tex: "h'(1)=120\\ \\text{m/min},\\quad h(2)=160\\ \\text{m}" },
    { label: 'Consumo de los servidores', tex: '\\int_0^4(2+t)\\,dt=16\\ \\text{kWh}' },
    { label: 'Firma del Contador', tex: 'O=40,\\quad P=40/41\\approx0{,}976' },
    {
      label: 'Modelo de Halcón',
      tex: 'KL(p\\Vert q)=\\frac12\\log_2(0{,}625)+\\frac12\\log_2(2{,}5)\\approx0{,}322',
    },
  ],
};
export { lesson };
