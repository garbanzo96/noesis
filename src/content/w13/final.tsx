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
import { discount, ev, fmt, kellyFrac, tnum } from './kit';

const EV = 'E[a]=\\sum_s P(s)\\,u(a,s)';
const EVPI = '\\text{EVPI}=E[\\text{con información}]-\\max_a E[a]';
const VP = '\\text{VP}=\\gamma^t r';
const BELLMAN = 'V(s_1)=\\max\\{c,\\gamma V(s_2)\\}';
const KELLY = 'f^*=p-\\frac{1-p}{b}';
const TITLES = [
  'Contrato',
  'Información previa',
  'Pago futuro',
  'Cerrar o seguir',
  'Tamaño de posición',
];
const FORMULAS = [EV, EVPI, VP, BELLMAN, KELLY];
const GLYPH_IDS = [
  'dec-final-contract',
  'dec-final-information',
  'dec-final-present',
  'dec-final-close',
  'dec-final-position',
];

/** Una ficha grande de mesa; las filas contienen solo datos, nunca resultados. */
function Ticket({ title, rows }: { title: string; rows: string[] }) {
  return (
    <g>
      <rect
        x={160}
        y={170}
        width={790}
        height={560}
        rx={18}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={555} y={230} size={27} color={C.amber}>
        {title}
      </Cap>
      {rows.map((row, i) => (
        <g key={`${i}-${row}`}>
          <line x1={205} x2={905} y1={330 + i * 100} y2={330 + i * 100} stroke={C.line} />
          <Cap x={555} y={305 + i * 100} size={24}>
            {row}
          </Cap>
        </g>
      ))}
    </g>
  );
}

function AccountLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [days, setDays] = useState(1);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    const t = Math.round(clamp((x - 250) / 140, 0, 4));
    setDays(t);
    if (t === 3) unlock();
  });
  const rows = [
    ['Brote: p = 0,2; pago +100', 'Sin brote: p = 0,8; pago −20', 'No comprar: pago 0'],
    [
      'Conocer el anuncio permite comprar solo con brote',
      'p = 0,2; ganancia 100; pérdida 20',
      'Sin el dato, puedes elegir no comprar',
    ],
    ['Cobro: 10 al final del plazo', 'Descuento por día: γ = 0,9'],
    [
      'Etapa 1: cerrar ahora paga 5',
      'Seguir: sin pago inmediato',
      'Etapa 2: cobro final 10; γ = 0,9',
    ],
    [
      'Apuesta a la par: b = 1',
      'Probabilidad de ganar: p = 0,6',
      'Fracción del capital disponible',
    ],
  ][beat];
  return (
    <Stage ref={svg}>
      <Ticket title={TITLES[beat]} rows={rows} />
      {beat === 2 && (
        <g>
          <line x1={250} x2={810} y1={580} y2={580} stroke={C.cyan} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((t) => (
            <Cap key={t} x={250 + t * 140} y={650} size={22}>
              {t} {t === 1 ? 'día' : 'días'}
            </Cap>
          ))}
          <Knob x={250 + days * 140} y={580} axis="x" onPointerDown={drag} color={C.cyan} />
        </g>
      )}
      <Cap x={1250} y={230} size={23}>
        Lectura {beat + 1} de 5
      </Cap>
      {beat === 0 && <Cap x={1250} y={330} tex="E=20-16=4" color={C.green} />}
      {beat === 1 && (
        <>
          <Cap x={1250} y={330} tex="E_{\text{con dato}}=20" />
          <Cap x={1250} y={430} tex="\text{EVPI}=20-4=16" color={C.green} />
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={330} size={23}>
            Plazo: {days} {days === 1 ? 'día' : 'días'}
          </Cap>
          <Cap x={1250} y={430} tex={`\\text{VP}=10\\cdot0{,}9^{${days}}`} />
          <Cap
            x={1250}
            y={530}
            tex={`\\text{VP}=${tnum(discount(10, 0.9, days))}`}
            color={C.green}
          />
        </>
      )}
      {beat === 3 && answer !== null && (
        <>
          <Cap x={1250} y={330} tex="Q(s_1,\text{seguir})=9" />
          <Cap x={1250} y={430} tex="V(s_1)=\max(5;9)=9" color={C.green} />
          <Cap x={1250} y={530} size={23}>
            Mantén la posición un día.
          </Cap>
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={330} tex="f^*=0{,}6-0{,}4=0{,}2" color={C.green} />
          <Cap x={1250} y={430} size={23}>
            20 % del capital
          </Cap>
          <Cap x={1250} y={530} size={20} color={C.muted}>
            Kelly supone pagos y p conocidos.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Cinco lecturas de una cuenta',
  Scene: AccountLesson,
  beats: [
    {
      say: 'El contrato paga 100 con brote y pierde 20 sin brote. Pondera ambos pagos: el **valor esperado** es 4; no comprar vale 0.',
      board: {
        label: 'Contrato',
        tex: EV,
        body: 'Con p = 0,2, comprar vale 4 y es la mejor acción pública.',
      },
    },
    {
      say: 'Con el anuncio conocido, compras solo cuando hay brote: el promedio sube a 20. El **valor de la información perfecta** es 20 − 4 = 16 por contrato.',
      board: {
        label: 'Información previa',
        tex: EVPI,
        body: 'Resta la mejor opción sin información, incluyendo no comprar.',
      },
    },
    {
      say: 'El cobro de 10 se reduce por cada día de espera. Mueve el plazo a tres días para leer su **valor presente** con γ = 0,9.',
      gate: 'Arrastra la perilla hasta 3 días.',
      board: {
        label: 'Pago futuro',
        tex: VP,
        body: '10·0,9³ = 7,29 hoy; el descuento se aplica una vez por día.',
      },
    },
    {
      say: 'Resuelve desde el cobro final: la etapa 2 vale 10. En la etapa 1 puedes cobrar 5 ahora o esperar un día con γ = 0,9.',
      ask: {
        prompt: '¿Cuál es el valor de la etapa 1?',
        options: ['9', '10', '14'],
        answer: 0,
        explain: 'Seguir vale 0,9·10 = 9; cerrar vale 5. Bellman elige el máximo: 9.',
      },
      board: { label: 'Cerrar o seguir', tex: BELLMAN },
    },
    {
      say: 'Con p = 0,6 y pago a la par, **Kelly** fija una fracción de 0,2 del capital. Tener ventaja no autoriza cualquier tamaño de posición.',
      board: {
        label: 'Tamaño de posición',
        tex: KELLY,
        body: 'f* = 0,2 equivale a 20 %; p y b deben corresponder a la apuesta real.',
      },
    },
  ],
};

function AccountDemo({ beats, answer }: DemoProps) {
  const information = beats.beat === 0;
  return (
    <Stage>
      <Ticket
        title={information ? 'Orden previa al anuncio' : 'Margen reservado'}
        rows={
          information
            ? [
                'Contrato: +100 con brote; −20 sin brote',
                'Pronóstico público: p = 0,2',
                'Con dato perfecto: compra solo con brote',
              ]
            : [
                'Apuesta a la par: b = 1',
                'Probabilidad de ganar: p = 0,6',
                'Capital disponible: 1 000',
              ]
        }
      />
      <Cap x={1250} y={230} size={23}>
        {information ? 'Precio máximo del dato' : 'Posición según Kelly'}
      </Cap>
      <Cap x={1250} y={330} size={20} color={C.muted}>
        Revisa antes de autorizar.
      </Cap>
      {answer !== null && (
        <>
          <Cap
            x={1250}
            y={430}
            tex={information ? '\\text{EVPI}=20-4=16' : 'f^*=0{,}2'}
            color={C.green}
          />
          <Cap x={1250} y={530} size={22}>
            {information ? '16 por contrato' : 'Reserva 200 de capital'}
          </Cap>
        </>
      )}
    </Stage>
  );
}

function AccountPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 211 + round);
    const p = pick(random, [0.1, 0.2, 0.25, 0.4]);
    const win = pick(random, [60, 80, 100, 120]);
    const loss = pick(random, [10, 20, 30]);
    const expected = ev([p, 1 - p], [win, -loss]);
    const perfect = p * win;
    const gamma = pick(random, [0.8, 0.9, 0.95]);
    const reward = pick(random, [40, 60, 80, 100]);
    const days = pick(random, [2, 3, 4]);
    const terminal = pick(random, [10, 20, 30]);
    const continuation = discount(terminal, gamma, 1);
    // Hay tanto posiciones que se cierran como posiciones que se mantienen.
    const close = continuation + pick(random, [-3, 2]);
    const kp = pick(random, [0.55, 0.6, 0.65, 0.7]);
    const b = pick(random, [1, 2]);
    return {
      p,
      win,
      loss,
      expected,
      perfect,
      information: perfect - Math.max(0, expected),
      gamma,
      reward,
      days,
      present: discount(reward, gamma, days),
      terminal,
      close,
      continuation,
      value: Math.max(close, continuation),
      kp,
      b,
      fraction: kellyFrac(kp, b),
    };
  }, [seed, round]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      [
        'Lecturas 1 y 2. Calcula E[comprar] y el EVPI por contrato. Sin el dato puedes comprar o no comprar; con el dato perfecto compras solo con brote. Dos decimales.',
        'Lecturas 3 y 4. Calcula el valor presente del cobro y V(s₁) de la operación de dos etapas. Seguir paga cero ahora y cobra en la etapa 2, un día después. Dos decimales.',
        'Lectura 5. Calcula la fracción de Kelly del capital. b es la ganancia neta por unidad apostada; si pierdes, pierdes esa unidad. Responde entre 0 y 1 con dos decimales.',
      ][round],
      [EVPI, BELLMAN, KELLY][round],
    );
    api.hints(
      [
        [
          'Pondera la ganancia con p y la pérdida con 1 − p.',
          'Con información el valor es p·ganancia. Resta el máximo entre E[comprar] y 0.',
        ],
        [
          'El cobro se multiplica por γ elevado al número de días.',
          'En Bellman compara cerrar ahora con γ·cobro final. Elige el mayor, sin sumar las ramas.',
        ],
        [
          'La probabilidad de perder es 1 − p.',
          'Resta (1 − p)/b a p. Escribe una fracción, no un porcentaje.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);

  const submit = () => {
    const a = parseNum(first);
    const b = parseNum(second);
    if (a === null || !Number.isFinite(a) || (round < 2 && (b === null || !Number.isFinite(b))))
      return;
    const near = (x: number, y: number) => Math.abs(x - y) <= 0.0051;
    if (round === 0) {
      if (!near(a, d.expected))
        return api.result(
          false,
          near(a, d.perfect)
            ? 'Ponderaste solo la ganancia. E[comprar] también resta la pérdida multiplicada por 1 − p.'
            : near(a, d.p * (d.win - d.loss))
              ? 'Usaste p en ambos pagos. La pérdida ocurre con probabilidad 1 − p.'
              : 'Revisa E[comprar]: p·ganancia − (1 − p)·pérdida; conserva el signo.',
        );
      if (!near(b!, d.information))
        return api.result(
          false,
          near(b!, d.perfect - d.expected) && d.expected < 0
            ? 'Sin información puedes no comprar y obtener 0. Resta la mejor acción pública, no un contrato con valor negativo.'
            : near(b!, d.perfect)
              ? 'Ese es el valor con información. Falta restar la mejor opción sin el dato.'
              : 'EVPI resta max(0, E[comprar]) al valor con información perfecta.',
        );
      return api.result(
        true,
        `$E[\\text{comprar}]=${tnum(d.expected)}$; $\\text{EVPI}=${tnum(d.perfect)}-${tnum(Math.max(0, d.expected))}=${tnum(d.information)}$ por contrato.`,
      );
    }
    if (round === 1) {
      if (!near(a, d.present))
        return api.result(
          false,
          near(a, d.reward * d.gamma)
            ? 'Aplicaste un solo día de descuento. El cobro espera varios días: eleva γ al plazo completo.'
            : near(a, d.reward / d.gamma ** d.days)
              ? 'Dividiste por el descuento. Para traer el cobro a hoy, multiplícalo por γ elevado al plazo.'
              : 'Multiplica el cobro por γ^t; redondea después de aplicar todos los días.',
        );
      if (!near(b!, d.value))
        return api.result(
          false,
          near(b!, d.close + d.continuation)
            ? 'Sumaste dos acciones excluyentes. Bellman toma el máximo entre cerrar y seguir.'
            : near(b!, Math.max(d.close, d.terminal))
              ? 'El cobro final llega un día después. Descuéntalo antes de compararlo con el cierre de hoy.'
              : near(b!, d.gamma * d.value)
                ? 'Descontaste también el valor de hoy. El cierre inmediato se compara sin descuento con γ·cobro final.'
                : 'Resuelve primero la etapa 2. En la etapa 1 toma max(cierre, γ·valor de la etapa 2).',
        );
      return api.result(
        true,
        `$\\text{VP}=${tnum(d.present)}$; $V(s_1)=\\max(${tnum(d.close)};${tnum(d.continuation)})=${tnum(d.value)}$. ${d.close > d.continuation ? 'Cierra hoy.' : 'Mantén la posición un día.'}`,
      );
    }
    if (near(a, d.fraction))
      return api.result(
        true,
        `$f^*=${tnum(d.kp)}-\\frac{${tnum(1 - d.kp)}}{${d.b}}=${tnum(d.fraction)}$: ${fmt(d.fraction * 100)} % del capital.`,
      );
    return api.result(
      false,
      near(a, d.fraction * 100)
        ? 'Ingresaste un porcentaje. El campo pide una fracción entre 0 y 1: divide ese porcentaje por 100.'
        : near(a, d.kp)
          ? 'La probabilidad de ganar no es el tamaño de posición. Resta el costo de perder: (1 − p)/b.'
          : d.b !== 1 && near(a, 2 * d.kp - 1)
            ? 'Usaste la regla de pago a la par. Aquí debes dividir la probabilidad de perder por b.'
            : 'Revisa p − (1 − p)/b. b es la ganancia neta, no el retorno total incluyendo tu apuesta.',
    );
  };

  const rows =
    round === 0
      ? [
          `Brote: p = ${fmt(d.p)}; pago +${d.win}`,
          `Sin brote: pago −${d.loss}`,
          'No comprar: pago 0',
          'Dato perfecto: anuncia si habrá brote',
        ]
      : round === 1
        ? [
            `Cobro separado: ${d.reward} dentro de ${d.days} días`,
            `Descuento por día: γ = ${fmt(d.gamma)}`,
            `Operación, etapa 1: cerrar paga ${fmt(d.close)}`,
            `Etapa 2: cobro ${d.terminal}, un día después`,
          ]
        : [
            `Probabilidad de ganar: p = ${fmt(d.kp)}`,
            `Ganancia neta por unidad: b = ${d.b}`,
            'Perder cuesta una unidad apostada',
          ];
  return (
    <Stage>
      <Ticket
        title={['Contrato e información', 'Descuento y cierre', 'Tamaño de posición'][round]}
        rows={rows}
      />
      <Cap x={1250} y={230} size={23}>
        Control {round + 1} de 3
      </Cap>
      <Cap x={1250} y={330} size={20} color={C.muted}>
        Dos decimales · redondea al final
      </Cap>
      <NumberField
        x={1060}
        y={440}
        value={first}
        onChange={setFirst}
        onEnter={submit}
        label={['E =', 'VP =', 'f* ='][round]}
      />
      {round < 2 && (
        <NumberField
          x={1060}
          y={550}
          value={second}
          onChange={setSecond}
          onEnter={submit}
          label={round === 0 ? 'EVPI =' : 'V(s₁) ='}
        />
      )}
      <Cap x={1250} y={660} size={20} color={C.muted}>
        {round === 2 ? 'Fracción entre 0 y 1' : 'Completa ambas lecturas'}
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-final',
  world: 'decision',
  code: '13.★',
  title: 'La cuenta del último piso',
  subtitle: 'Cinco lecturas de La Bolsa',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w13-closed',
  guide: 'valentina',
  teaser:
    'Valentina retiene la última orden mientras revisas la cuenta que compra antes de cada anuncio.',
  learn:
    'Leer una cuenta con valor esperado, EVPI, descuento, Bellman de dos etapas y fracción de Kelly.',
  glyphs: GLYPH_IDS,
  pitfalls: [
    'Pondera también la pérdida con 1 − p.',
    'EVPI resta la mejor acción sin información, que puede ser no comprar.',
    'Aplica el descuento una vez por período.',
    'Bellman compara acciones excluyentes mediante un máximo.',
    'Kelly expresa una fracción del capital y usa la ganancia neta b.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Bolsa de Valparaíso, 16:58. Valentina se saca el audífono; una orden pendiente parpadea junto al reloj de cierre.',
        },
        {
          who: 'valentina',
          text: 'Dos minutos. Tengo la posición retenida, pero el registro del titular se cierra con la mesa.',
        },
        { who: 'iris', text: 'La cuenta tiene mejor horario que los pacientes.' },
        {
          who: 'valentina',
          text: 'Cinco lecturas antes de abrir el titular. Si el margen no calza, la firma queda conmigo.',
        },
        {
          who: 'tu',
          text: 'Guarda también la orden pendiente. La hora tiene que quedar en la copia.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Autorizar el último control',
      Scene: AccountDemo,
      beats: [
        {
          say: 'La orden usa el contrato conocido: +100 con brote y −20 sin brote, con p público de 0,2. Valentina revisa cuánto podría pagar por conocer el anuncio con certeza.',
          ask: {
            prompt: '¿Cuál es el EVPI por contrato?',
            options: ['20', '16', '4'],
            answer: 1,
            explain:
              'Con información perfecta vale 20; la mejor acción pública vale 4. La diferencia es 16.',
          },
          note: {
            label: 'Precio máximo del dato',
            tex: '\\text{EVPI}=20-4=16',
            body: 'Es un techo para información perfecta; no garantiza ese valor para un dato parcial.',
          },
        },
        {
          say: 'La siguiente orden tiene p = 0,6, pago a la par y capital disponible de 1 000. Revisa el tamaño de la posición según Kelly.',
          ask: {
            prompt: '¿Cuánto capital corresponde apostar?',
            options: ['600', '500', '200'],
            answer: 2,
            explain: 'f* = 0,6 − 0,4 = 0,2; 0,2·1 000 = 200.',
          },
          note: {
            label: 'Margen reservado',
            tex: 'f^*=0{,}2,\\qquad1000f^*=200',
            body: 'Una ventaja de probabilidad requiere controlar cuánto capital se expone.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas de la cuenta', Comp: AccountPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'La campana de cierre corta el zumbido de la mesa. Valentina abre el titular y deja la mano inmóvil sobre el teclado.',
        },
        {
          who: 'valentina',
          text: 'Misma cuenta en todas las posiciones previas al anuncio. Titular registrado en Torre Halcón, piso 40.',
        },
        {
          who: 'teo',
          text: '¡Está la dirección completa! La copié con las horas y el número de cuenta.',
        },
        { who: 'iris', text: 'Cuarenta pisos para alejarse de una firma.' },
        {
          who: 'valentina',
          text: 'Mi firma queda en la retención. La de arriba acaba de aparecer en tu copia.',
        },
        {
          who: 'nar',
          text: 'Tras el vidrio, la bahía ya está oscura. Teo abre «Mundo 14 · Torre Halcón»; en la foto del edificio queda una sola ventana encendida, en el último piso.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = TITLES.map((name, i) => ({
  id: GLYPH_IDS[i],
  world: 'decision',
  tex: FORMULAS[i],
  name,
  read: [
    'e de a',
    'valor con información menos mejor valor sin información',
    'gamma elevado a te por erre',
    've de ese uno igual al máximo entre cierre y continuación descontada',
    'efe estrella igual a pe menos uno menos pe dividido por be',
  ][i],
  meaning: [
    'Promedio de los pagos de una acción según sus probabilidades.',
    'Mejora del valor al conocer el estado antes de elegir la acción.',
    'Valor hoy de un pago que llega tras t períodos.',
    'Mejor valor entre cerrar hoy y continuar hasta la etapa final.',
    'Fracción del capital que maximiza el crecimiento logarítmico esperado.',
  ][i],
  warn: [
    'El valor esperado incluye ganancias y pérdidas; no garantiza el resultado de una operación.',
    'La referencia sin información incluye todas las acciones disponibles.',
    'Usa γ y t en la misma unidad de tiempo.',
    'El cierre y la continuación son acciones excluyentes.',
    'Supone probabilidad y pagos conocidos; si f* es negativa y no puedes apostar en contra, no apuestas.',
  ][i],
}));

export const ref: TopicRef = {
  defs: TITLES.map((label, i) => ({
    label,
    tex: FORMULAS[i],
    body: [
      'Pondera cada pago por la probabilidad del estado y suma. Compara todas las acciones.',
      'La información es perfecta y llega antes de decidir; se resta la mejor acción sin ese dato.',
      'r es el cobro futuro, γ el factor por período y t el número de períodos.',
      'c es el cierre inmediato; seguir paga cero ahora y lleva a la etapa final s₂ un período después.',
      'p es la probabilidad de ganar y b la ganancia neta por unidad; perder cuesta la unidad apostada.',
    ][i],
  })),
  props: [
    {
      label: 'Contrato e información',
      tex: 'E=4,\\qquad\\text{EVPI}=20-4=16',
      body: 'Ganancia 100, pérdida 20 y probabilidad de brote 0,2; no comprar vale 0.',
    },
    { label: 'Descuento', tex: '10\\cdot0{,}9^3=7{,}29' },
    { label: 'Dos etapas', tex: 'V(s_2)=10,\\qquad V(s_1)=\\max(5;0{,}9\\cdot10)=9' },
    {
      label: 'Kelly a la par',
      tex: 'f^*=0{,}6-0{,}4=0{,}2',
      body: 'Para p = 0,6 y b = 1; la fracción es 20 % del capital.',
    },
  ],
};

export { lesson };
