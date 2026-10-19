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
import { discount, fmt, tnum } from './kit';

// Caso 13.4 · Paciencia. Un día es un período; la renta perpetua comienza en t = 0.
const SLIDER = { x0: 1090, x1: 1410, y: 700 };
type Payment = { day: number; amount: number };

/** Calendario de cobros: muestra datos, nunca calcula la respuesta de una práctica. */
function PaymentLine({ payments, forever = false }: { payments: Payment[]; forever?: boolean }) {
  return (
    <g>
      <Cap x={550} y={190} size={25}>
        {forever ? 'Cobros diarios · el primero es hoy' : 'Calendario de la posición'}
      </Cap>
      <line x1={170} x2={930} y1={450} y2={450} stroke={C.line} strokeWidth={4} />
      {Array.from({ length: 6 }, (_, day) => {
        const x = 190 + day * 140;
        const payment = payments.find((p) => p.day === day);
        return (
          <g key={day}>
            <line x1={x} x2={x} y1={440} y2={460} stroke={C.muted} strokeWidth={2} />
            <Cap x={x} y={510} size={19} color={C.muted}>
              {day === 0 ? 'Hoy · 0' : `Día ${day}`}
            </Cap>
            {payment && (
              <>
                <rect
                  x={x - 52}
                  y={310}
                  width={104}
                  height={90}
                  rx={12}
                  fill={C.panel}
                  stroke={C.amber}
                  strokeWidth={2}
                />
                <Cap x={x} y={355} size={25} color={C.amber}>
                  {payment.amount}
                </Cap>
                <line x1={x} x2={x} y1={400} y2={440} stroke={C.amber} strokeWidth={2} />
              </>
            )}
          </g>
        );
      })}
      {forever && (
        <>
          <path d="M930 440 L950 450 L930 460" fill="none" stroke={C.amber} strokeWidth={3} />
          <Cap x={550} y={600} size={21} color={C.muted}>
            El mismo cobro sigue cada día, sin fecha de término.
          </Cap>
        </>
      )}
    </g>
  );
}

function PatienceLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [days, setDays] = useState(0);
  const [gamma, setGamma] = useState(0.5);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    const fraction = clamp((x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0), 0, 1);
    if (beat === 1) {
      const next = Math.round(fraction * 5);
      setDays(next);
      if (next === 3) unlock();
    }
    if (beat === 2) {
      const next = (5 + Math.round(fraction * 4)) / 10;
      setGamma(next);
      if (next === 0.9) unlock();
    }
  });
  const day = beat === 1 ? days : beat === 3 ? 2 : 3;
  const g = beat === 2 ? gamma : 0.9;
  const amount = beat === 3 ? 100 : 10;
  const forever = beat === 4;
  const payments = forever
    ? Array.from({ length: 6 }, (_, i) => ({ day: i, amount: 10 }))
    : [{ day, amount }];
  return (
    <Stage ref={svg}>
      <PaymentLine payments={payments} forever={forever} />
      <Cap x={1250} y={180} tex={`\\gamma=${tnum(g, 1)}\\ \\text{por día}`} />
      <Cap x={1250} y={270} tex={forever ? 't=0,1,2,\\ldots' : `t=${day}\\ \\text{días}`} />
      <Cap x={1250} y={360} tex="\text{VP}=\gamma^t r" color={C.cyan} />
      {!forever && (beat !== 3 || answer !== null) && (
        <>
          <Cap x={1250} y={450} tex={`${amount}\\cdot${tnum(g, 1)}^{${day}}`} color={C.amber} />
          <Cap
            x={1250}
            y={540}
            tex={`\\text{VP}=${tnum(discount(amount, g, day))}`}
            color={C.green}
          />
          <Cap x={550} y={650} size={25} color={C.green}>
            {`Equivalente hoy: ${fmt(discount(amount, g, day))}`}
          </Cap>
        </>
      )}
      {forever && (
        <>
          <Cap x={1250} y={450} tex="\frac{10}{1-0{,}9}=100" color={C.green} />
          <Cap x={1250} y={540} size={20} color={C.muted}>
            Primer cobro hoy, en t = 0.
          </Cap>
        </>
      )}
      {(beat === 1 || beat === 2) && (
        <>
          <line
            x1={SLIDER.x0}
            x2={SLIDER.x1}
            y1={SLIDER.y}
            y2={SLIDER.y}
            stroke={C.line}
            strokeWidth={4}
          />
          <Knob
            x={SLIDER.x0 + (beat === 1 ? days / 5 : (gamma - 0.5) / 0.4) * (SLIDER.x1 - SLIDER.x0)}
            y={SLIDER.y}
            axis="x"
            onPointerDown={drag}
            color={C.cyan}
          />
          <Cap x={1250} y={780} size={19} color={C.muted}>
            {beat === 1 ? 'Plazo: de 0 a 5 días' : 'Descuento diario: de 0,5 a 0,9'}
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Traer un cobro al presente',
  Scene: PatienceLesson,
  beats: [
    {
      say: 'Diez dentro de tres días valen hoy 7,29 si conservas el 90 % del valor por cada día de espera. Ese equivalente hoy se llama **valor presente**; el factor diario es γ = 0,9.',
      board: {
        label: 'Valor presente',
        tex: '\\p{1}{\\text{VP}}=\\p{2}{\\gamma^t r}',
        body: 'r es el cobro y t el número de días hasta recibirlo. γ es un factor de valoración, no una probabilidad de cobrar.',
        parts: ['valor de hoy', 'cobro ajustado por espera'],
      },
    },
    {
      say: 'Mueve el cobro por el calendario: hoy conserva todo su valor; cada día adicional aplica otra vez el factor 0,9.',
      gate: 'Arrastra la perilla de plazo hasta t = 3 días.',
      board: {
        label: 'Tres días',
        tex: '\\p{1}{10\\cdot0{,}9^3}=\\p{2}{7{,}29}',
        parts: ['cobro tras descontar', 'valor de hoy'],
      },
    },
    {
      say: 'Mantén el plazo en tres días y sube **γ**: cuanto más cerca de 1, más valor conservan los cobros futuros. Con γ entre 0 y 1, un plazo mayor reduce el valor presente de un cobro positivo.',
      gate: 'Arrastra la perilla de descuento diario hasta γ = 0,9.',
      board: {
        label: 'Factor de descuento',
        tex: '\\p{1}{0<\\gamma<1},\\quad\\p{2}{ \\gamma^0}=\\p{3}{1}',
        body: 'El plazo y el factor deben usar la misma unidad: aquí, días.',
        parts: ['factor que reduce valor', 'factor sin espera', 'valor completo hoy'],
      },
    },
    {
      say: 'Ahora la posición paga 100 dentro de dos días. Aplica el factor diario una vez por cada día de espera.',
      ask: {
        prompt: 'Con γ = 0,9 por día, ¿cuánto valen hoy esos 100?',
        options: ['90', '81', '100'],
        answer: 1,
        explain: '100 · 0,9² = 81. El 90 descuenta solo un día; el 100 deja fuera la espera.',
      },
      board: {
        label: 'Dos días de espera',
        tex: '\\p{1}{\\text{VP}}=\\p{2}{\\gamma^t r}',
        parts: ['valor de hoy', 'cobro ajustado por espera'],
      },
    },
    {
      say: 'Si cobras 10 cada día para siempre, empezando hoy, sumas 10 + 9 + 8,1 + …: el valor presente total es 100. La **serie geométrica** converge porque γ es menor que 1.',
      board: {
        label: 'Renta desde hoy',
        tex: '\\p{1}{\\sum_{t\\ge0}\\gamma^t r}=\\p{2}{\\frac{r}{1-\\gamma}}=\\p{3}{\\frac{10}{1-0{,}9}}=\\p{4}{100}',
        body: 'Si el primer cobro fuera mañana, multiplicarías este total por γ: valdría 90.',
        parts: [
          'cobros futuros descontados',
          'valor de la renta',
          'con los datos del caso',
          'valor presente total',
        ],
      },
    },
  ],
};

function ClosingDemo({ beats, answer }: DemoProps) {
  const forever = beats.beat === 1;
  return (
    <Stage>
      <PaymentLine
        payments={
          forever
            ? Array.from({ length: 6 }, (_, day) => ({ day, amount: 10 }))
            : [{ day: 3, amount: 10 }]
        }
        forever={forever}
      />
      <Cap x={1250} y={180} tex="\gamma=0{,}9\ \text{por día}" />
      <Cap x={1250} y={270} size={22}>
        {forever ? 'Primer cobro: hoy' : 'Alternativa: 8 hoy'}
      </Cap>
      {answer !== null && (
        <>
          <Cap
            x={1250}
            y={390}
            tex={forever ? '\\frac{10}{1-0{,}9}=100' : '10\\cdot0{,}9^3=7{,}29'}
            color={C.green}
          />
          <Cap x={1250} y={480} size={22} color={C.green}>
            {forever ? 'Valor total hoy: 100' : '8 hoy supera 7,29 hoy'}
          </Cap>
        </>
      )}
    </Stage>
  );
}

function DiscountPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 347 + round);
    const amount = pick(random, [10, 20, 40, 80, 100]);
    const gamma = pick(random, [0.6, 0.7, 0.8, 0.9]);
    const day = pick(random, [2, 3, 4, 5]);
    const second = pick(random, [10, 30, 50]);
    return { amount, gamma, day, second };
  }, [seed, round]);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    const base = `γ = ${fmt(d.gamma, 1)} por día. `;
    api.prompt(
      base +
        [
          `Cobras ${d.amount} dentro de ${d.day} días. ¿Cuál es su valor presente? Redondea a dos decimales.`,
          `Cobras ${d.amount} mañana y ${d.second} dentro de tres días. ¿Cuál es el valor presente total? Redondea a dos decimales.`,
          `Cobras ${d.amount} cada día para siempre, empezando hoy (t = 0). ¿Cuál es el valor presente total? Redondea a dos decimales.`,
        ][round],
      [
        '\\text{VP}=\\gamma^t r',
        '\\text{VP}=\\gamma r_1+\\gamma^3 r_3',
        '\\text{VP}=\\sum_{t\\ge0}\\gamma^t r',
      ][round],
    );
    api.hints(
      [
        [
          'El exponente cuenta los días completos hasta el cobro.',
          'Eleva γ al plazo y multiplica por el cobro.',
        ],
        [
          'Cada cobro tiene su propio plazo.',
          'Descuenta el primero un día y el segundo tres días; después suma.',
        ],
        [
          'El primer cobro no se descuenta: ocurre hoy.',
          'Usa la suma geométrica r / (1 − γ), con γ menor que 1.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const value = parseNum(input);
    if (value === null || !Number.isFinite(value)) return;
    const target = [
      discount(d.amount, d.gamma, d.day),
      discount(d.amount, d.gamma, 1) + discount(d.second, d.gamma, 3),
      d.amount / (1 - d.gamma),
    ][round];
    const near = (n: number) => Math.abs(value - n) <= 0.0051;
    if (near(target))
      return api.result(
        true,
        [
          `$${d.amount}\\cdot${tnum(d.gamma, 1)}^{${d.day}}=${tnum(target)}$. Aplicaste un factor por día.`,
          `$${d.amount}\\cdot${tnum(d.gamma, 1)}+${d.second}\\cdot${tnum(d.gamma, 1)}^3=${tnum(target)}$. Sumaste los cobros después de descontarlos.`,
          `$\\frac{${d.amount}}{1-${tnum(d.gamma, 1)}}=${tnum(target)}$. El primer cobro es hoy, en $t=0$.`,
        ][round],
      );
    if (round === 0 && near(d.amount))
      return api.result(
        false,
        'Usaste el cobro nominal: falta aplicar el descuento por los días de espera.',
      );
    if (round === 0 && near(d.amount * d.gamma))
      return api.result(
        false,
        `Descontaste solo un día. El cobro llega dentro de ${d.day} días: usa ese exponente.`,
      );
    if (round === 0 && near(d.amount / d.gamma ** d.day))
      return api.result(
        false,
        'Dividiste por el factor y aumentaste el cobro. Para traerlo a hoy, multiplica por γ elevado al plazo.',
      );
    if (round === 1 && near(d.amount + d.second))
      return api.result(false, 'Sumaste los cobros nominales. Trae cada uno a hoy antes de sumar.');
    if (round === 1 && near((d.amount + d.second) * d.gamma))
      return api.result(
        false,
        'Descontaste ambos cobros un solo día. El segundo llega en tres días y necesita γ³.',
      );
    if (round === 1 && near(discount(d.amount + d.second, d.gamma, 3)))
      return api.result(
        false,
        'Descontaste ambos cobros tres días. El primero llega mañana y necesita solo γ.',
      );
    if (round === 2 && near((d.amount * d.gamma) / (1 - d.gamma)))
      return api.result(
        false,
        'Ese total corresponde a empezar mañana. Aquí el primer cobro es hoy, así que la suma parte en t = 0.',
      );
    if (round === 2 && near(d.amount / d.gamma))
      return api.result(
        false,
        'El denominador de la serie es 1 − γ. Dividir por γ no suma los cobros futuros.',
      );
    return api.result(
      false,
      [
        'Cuenta los días en el exponente: VP = cobro · γ elevado al plazo. Redondea solo al final.',
        'Usa γ para el cobro de mañana y γ³ para el de tres días. Suma y redondea al final.',
        'La renta parte hoy: divide el cobro diario por 1 − γ. No multipliques el total por γ.',
      ][round],
    );
  };
  const forever = round === 2;
  const payments = forever
    ? Array.from({ length: 6 }, (_, day) => ({ day, amount: d.amount }))
    : round === 0
      ? [{ day: d.day, amount: d.amount }]
      : [
          { day: 1, amount: d.amount },
          { day: 3, amount: d.second },
        ];
  return (
    <Stage>
      <PaymentLine payments={payments} forever={forever} />
      <Cap x={1250} y={190} tex={`\\gamma=${tnum(d.gamma, 1)}\\ \\text{por día}`} />
      <Cap x={1250} y={280} size={20} color={C.muted}>
        Respuesta con dos decimales.
      </Cap>
      <NumberField
        x={1080}
        y={440}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label="VP ="
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c4',
  world: 'decision',
  code: '13.4',
  title: 'Paciencia',
  subtitle: 'Descuento y valor presente',
  glyph: '\\gamma^t r',
  kind: 'level',
  guide: 'valentina',
  teaser: 'La mesa cierra pronto. Valentina compara posiciones con distintos días de cobro.',
  learn: 'Calcular el valor presente de cobros futuros y de una renta perpetua que comienza hoy.',
  glyphs: ['dec-discount', 'dec-perpetuity'],
  pitfalls: [
    'El descuento se aplica una vez por período: γ elevado al plazo, no γ multiplicado por el plazo.',
    'Cada cobro se descuenta según su fecha; después se suman sus valores presentes.',
    'r / (1 − γ) supone un primer cobro hoy. Si parte mañana, el total se multiplica por γ.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'La Bolsa, tres para las diez. El reloj de cierre se reflejaba en el café frío de Valentina, y dos órdenes esperaban su firma.',
        },
        {
          who: 'valentina',
          text: 'Ocho hoy o diez en tres días. El jefe mira el diez; a mí me toca sostener el margen hasta que paguen.',
        },
        { who: 'tu', text: 'Pondría las dos órdenes en la misma fecha antes de firmar.' },
        {
          who: 'valentina',
          text: 'Mi mesa conserva el noventa por ciento del valor por cada día de espera. Te quedan tres minutos para revisar la posición.',
        },
        { who: 'iris', text: 'Tres minutos alcanzan para una cuenta.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Dos órdenes antes del cierre',
      Scene: ClosingDemo,
      beats: [
        {
          say: 'La mesa usa γ = 0,9 por día. Puedes cobrar 8 hoy o 10 dentro de tres días; ambos cobros están asegurados.',
          ask: {
            prompt: '¿Qué orden tiene mayor valor presente?',
            options: ['10 en tres días', 'Valen lo mismo', '8 hoy'],
            answer: 2,
            explain:
              'Los 10 futuros valen hoy 7,29. La orden de 8 hoy deja un margen de 0,71 en valor presente.',
          },
          note: {
            label: 'Comparar en la misma fecha',
            tex: '8>10\\cdot0{,}9^3=7{,}29',
            body: 'El descuento representa cuánto valora la mesa esperar; aquí no hay riesgo de impago.',
          },
        },
        {
          say: 'Otra posición entrega 10 cada día para siempre, con el primer pago hoy. La mesa mantiene γ = 0,9.',
          ask: {
            prompt: '¿Cuánto vale hoy toda esa posición?',
            options: ['90', '100', 'No tiene un valor finito'],
            answer: 1,
            explain:
              '10 / (1 − 0,9) = 100. El 90 correspondería a empezar mañana; con γ menor que 1 la suma infinita converge.',
          },
          note: {
            label: 'Renta perpetua desde hoy',
            tex: '\\sum_{t\\ge0}10\\cdot0{,}9^t=100',
            body: 'Los cobros se prolongan sin límite, pero sus valores presentes disminuyen geométricamente.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Valorar posiciones por fecha de cobro',
      Comp: DiscountPractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina firmó la orden de ocho. El reloj pasó a las 22:00, y las cotizaciones quedaron inmóviles.',
        },
        {
          who: 'valentina',
          text: 'Cero coma setenta y uno de margen. Mi jefe va a reclamar por los dos que dejó de ver en la pantalla.',
        },
        { who: 'iris', text: 'Si reclama, muéstrale el cálculo.' },
        {
          who: 'valentina',
          text: 'Esta otra cuenta dejó su posición abierta. Tenía tres oportunidades de cerrar antes del anuncio.',
        },
        {
          who: 'nar',
          text: 'Valentina apoyó la punta del lápiz bajo el último horario de cierre, sin marcar el papel.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-discount',
    world: 'decision',
    tex: '\\gamma^t r',
    name: 'Valor presente',
    read: 'gamma elevado a te por erre',
    meaning:
      'Valor hoy de un cobro r que llega dentro de t períodos, usando un factor γ por período.',
    warn: 'El plazo y el factor deben usar la misma unidad. γ no es una probabilidad de cobro.',
  },
  {
    id: 'dec-perpetuity',
    world: 'decision',
    tex: '\\frac{r}{1-\\gamma}',
    name: 'Renta perpetua desde hoy',
    read: 'erre dividido por uno menos gamma',
    meaning:
      'Valor presente de cobrar r cada período para siempre, comenzando en t = 0, con 0 < γ < 1.',
    warn: 'Si comienza en t = 1, su valor es γr / (1 − γ). Con γ = 1 y r positivo, la suma diverge.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Valor presente',
      tex: '\\text{VP}=\\gamma^t r',
      body: 'r es el cobro, t los períodos hasta recibirlo y γ el factor de descuento por período; hoy corresponde a t = 0.',
    },
    {
      label: 'Varios cobros',
      tex: '\\text{VP}=\\sum_t\\gamma^t r_t',
      body: 'Descuenta cada cobro con su propio plazo y suma los valores presentes.',
    },
  ],
  props: [
    { label: 'Cobros del caso', tex: '10\\cdot0{,}9^3=7{,}29,\\quad100\\cdot0{,}9^2=81' },
    {
      label: 'Renta desde hoy',
      tex: '\\sum_{t\\ge0}\\gamma^t r=\\frac{r}{1-\\gamma},\\quad0<\\gamma<1',
      body: 'El primer pago es hoy: 10 cada día con γ = 0,9 vale 100.',
    },
    {
      label: 'Renta desde mañana',
      tex: '\\sum_{t\\ge1}\\gamma^t r=\\frac{\\gamma r}{1-\\gamma}',
      body: 'Todos los cobros se desplazan un período: con r = 10 y γ = 0,9 vale 90.',
    },
  ],
};

export { lesson };
