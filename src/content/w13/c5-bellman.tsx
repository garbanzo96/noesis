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
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { discount, fmt, tnum } from './kit';

type Operation = {
  terminal: number;
  close2: number;
  close1: number;
  gamma: number;
  reward1: number;
};
const EXAMPLE: Operation = { terminal: 10, close2: 5, close1: 3, gamma: 0.9, reward1: 0 };
const DESK: Operation = { ...EXAMPLE, gamma: 0.8, close1: 7 };
function values(d: Operation) {
  const next2 = discount(d.terminal, d.gamma, 1);
  const v2 = Math.max(d.close2, next2);
  const next1 = d.reward1 + discount(v2, d.gamma, 1);
  return { next2, v2, next1, v1: Math.max(d.close1, next1) };
}

/** Solo condiciones de la operación: no resuelve ni destaca la mejor rama. */
function OperationDrawing({ d }: { d: Operation }) {
  return (
    <g>
      <Cap x={550} y={100} size={23}>
        Tres etapas · un intervalo entre cada par
      </Cap>
      {[230, 550].map((x, i) => (
        <g key={x}>
          <line x1={x + 25} x2={x + 295} y1={320} y2={320} stroke={C.line} strokeWidth={3} />
          <path d={`M${x + 280} 312 l15 8 l-15 8`} fill="none" stroke={C.line} strokeWidth={3} />
          <Cap x={x + 160} y={245} size={20}>
            Seguir
          </Cap>
          <line x1={x} x2={x} y1={345} y2={560} stroke={C.line} strokeWidth={3} />
          <rect
            x={x - 25}
            y={295}
            width={50}
            height={50}
            fill={C.panel}
            stroke={C.amber}
            strokeWidth={3}
          />
          <Cap x={x} y={320} size={20}>
            {i + 1}
          </Cap>
          <Cap x={x + 70} y={450} size={19}>
            Cerrar
          </Cap>
          <circle cx={x} cy={yEnd} r={6} fill={C.text} />
          <Cap x={x} y={610} size={22}>
            Cobras {i === 0 ? d.close1 : d.close2}
          </Cap>
          <Cap x={x} y={675} size={18} color={C.muted}>
            Fin de la posición
          </Cap>
        </g>
      ))}
      <circle cx={870} cy={320} r={25} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
      <Cap x={870} y={320} size={20}>
        3
      </Cap>
      <Cap x={870} y={400} size={22}>
        Cobras {d.terminal}
      </Cap>
      <Cap x={870} y={470} size={18} color={C.muted}>
        Fin de la posición
      </Cap>
      <Cap x={390} y={175} size={19} color={C.cyan}>
        Pago al seguir ahora: {d.reward1}
      </Cap>
      <Cap x={710} y={175} size={19} color={C.cyan}>
        Pago al seguir ahora: 0
      </Cap>
    </g>
  );
}
const yEnd = 560;

function BellmanLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [guess, setGuess] = useState(0);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 1) return;
    const n = Math.round(clamp((x - 1100) / 300, 0, 1) * 10);
    setGuess(n);
    if (n === 9) unlock();
  });
  const reveal1 = (beat === 2 && answer !== null) || beat > 2;
  return (
    <Stage ref={svg}>
      <OperationDrawing d={EXAMPLE} />
      <Cap x={1250} y={160} tex="\gamma=0{,}9" />
      <Cap x={1250} y={250} tex="V(s_3)=10" color={C.cyan} />
      {beat >= 1 && <Cap x={1250} y={340} tex="V(s_2)=\max(5;0{,}9\cdot10)" size={21} />}
      {beat === 1 && (
        <Cap x={1250} y={430} tex={`V(s_2)=${guess}`} color={guess === 9 ? C.green : C.amber} />
      )}
      {beat >= 2 && <Cap x={1250} y={430} tex="V(s_2)=9" color={C.green} />}
      {reveal1 && (
        <Cap x={1250} y={520} tex="V(s_1)=\max(3;0{,}9\cdot9)=8{,}1" size={20} color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={1250} y={610} size={20}>
          Seguir en 1 y 2; cobrar en 3.
        </Cap>
      )}
      {beat === 1 && (
        <>
          <line x1={1100} x2={1400} y1={650} y2={650} stroke={C.line} strokeWidth={4} />
          <Knob x={1100 + guess * 30} y={650} axis="x" onPointerDown={drag} color={C.amber} />
          <Cap x={1100} y={710} size={18}>
            0
          </Cap>
          <Cap x={1400} y={710} size={18}>
            10
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Resolver una etapa a la vez',
  Scene: BellmanLesson,
  beats: [
    {
      say: 'La posición tiene tres etapas y un descuento de 0,9 por intervalo. Empieza en la última: cobras 10 y la operación termina, así que V(s₃) = 10.',
      board: { label: 'Condición final', tex: '\\p{1}{V(s_3)}=\\p{2}{10}' },
    },
    {
      say: 'Retrocede a la etapa 2: cerrar paga 5 ahora; seguir no paga ahora y lleva al cobro de 10 un intervalo después. Descuenta ese cobro y elige el mayor valor.',
      gate: 'Arrastra la perilla al valor de la etapa 2, partiendo del cobro final.',
      board: { label: 'Segunda etapa', tex: '\\p{1}{V(s_2)}=\\p{2}{\\max(5;0{,}9\\cdot10)}' },
    },
    {
      say: 'La etapa 2 vale 9. Ahora retrocede a la etapa 1: puedes cerrar por 3 o seguir hasta una posición que vale 9 en el próximo intervalo.',
      ask: {
        prompt: '¿Cuánto vale la posición en la etapa 1?',
        options: ['8,1', '9', '12'],
        answer: 0,
        explain:
          'V(s₁) = max(3; 0,9 · 9) = 8,1. El 9 omite un intervalo de descuento; sumar 3 y 9 mezcla acciones excluyentes.',
      },
      board: { label: 'Primera etapa', tex: '\\p{1}{V(s_1)}=\\p{2}{\\max(3;0{,}9\\,V(s_2))}' },
    },
    {
      say: 'La **ecuación de Bellman** repite esta comparación en cada estado: pago inmediato más valor futuro descontado, y luego el máximo entre acciones. Aquí cada acción lleva a un estado siguiente conocido.',
      board: {
        label: 'Bellman · transición determinista',
        tex: "V(s)=\\max_a\\{r(s,a)+\\gamma V(s')\\}",
        body: 'Al cerrar, r es el pago de cierre y el valor de continuación es 0. Al seguir en este ejemplo, r = 0.',
      },
    },
    {
      say: 'La **política** indica qué eliges en cada etapa: seguir en 1 y 2, y cobrar en 3. El valor inicial es 8,1; los pagos de cierre descartados no se suman a esa ruta.',
      board: {
        label: 'Valores y decisiones',
        tex: '\\p{1}{V(s_3)}=\\p{2}{10},\\quad\\p{3}{ V(s_2)}=\\p{4}{9},\\quad\\p{5}{ V(s_1)}=\\p{6}{8{,}1}',
      },
    },
  ],
};

function ClosingDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <OperationDrawing d={DESK} />
      <Cap x={1250} y={160} tex="\gamma=0{,}8" />
      <Cap x={1250} y={250} size={20}>
        Mismo cobro final: 10
      </Cap>
      {beats.beat === 1 && <Cap x={1250} y={340} tex="V(s_2)=8" color={C.cyan} />}
      {answer !== null &&
        (beats.beat === 0 ? (
          <Cap x={1250} y={430} tex="V(s_2)=\max(5;8)=8" color={C.green} size={21} />
        ) : (
          <>
            <Cap x={1250} y={430} tex="V(s_1)=\max(7;6{,}4)=7" color={C.green} size={21} />
            <Cap x={1250} y={520} size={20} color={C.green}>
              Cerrar en la etapa 1.
            </Cap>
          </>
        ))}
    </Stage>
  );
}

function BellmanPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 419 + round);
    return {
      terminal: randInt(r, 8, 20),
      close2: randInt(r, 4, 16),
      close1: randInt(r, 3, 14),
      gamma: pick(r, [0.5, 0.7, 0.8, 0.9]),
      reward1: round === 2 ? randInt(r, 2, 5) : 0,
    };
  }, [seed, round]);
  const v = values(d);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    api.prompt(
      [
        `Con descuento ${fmt(d.gamma, 1)}, calcula V(s₂): cerrar paga ${d.close2}; seguir paga 0 ahora y permite cobrar ${d.terminal} en la etapa 3. Escribe hasta dos decimales.`,
        `Calcula V(s₁) desde el final, con descuento ${fmt(d.gamma, 1)} por intervalo. Cerrar paga ${d.close1} en 1 o ${d.close2} en 2; en 3 cobras ${d.terminal}. Seguir paga 0 ahora. Escribe hasta dos decimales.`,
        `Calcula V(s₁). Seguir desde 1 paga ${d.reward1} ahora, además de la continuación descontada; cerrar paga ${d.close1}. En 2, cerrar paga ${d.close2} o seguir sin pago inmediato hasta cobrar ${d.terminal} en 3. Descuento: ${fmt(d.gamma, 1)}. Escribe hasta dos decimales.`,
      ][round],
      round === 0 ? 'V(s_2)=\\max(c_2;\\gamma V(s_3))' : 'V(s_1)=\\max(c_1;r_1+\\gamma V(s_2))',
    );
    api.hints(
      round === 0
        ? [
            'Parte del cobro final y descuéntalo un intervalo.',
            'Compara ese valor con cerrar en 2. Elige el mayor; no sumes las opciones.',
          ]
        : [
            'Resuelve primero V(s₂) con el máximo entre cerrar y seguir.',
            'Multiplica V(s₂) por el descuento, suma el pago inmediato si existe y compara con cerrar en 1.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const near = (x: number) => Math.abs(n - x) <= 0.0051;
    const target = round === 0 ? v.v2 : v.v1;
    if (near(target))
      return api.result(
        true,
        round === 0
          ? `$V(s_2)=\\max(${d.close2};${tnum(v.next2)})=${tnum(v.v2)}$.`
          : `$V(s_2)=${tnum(v.v2)}$, luego $V(s_1)=\\max(${d.close1};${d.reward1}+${tnum(d.gamma, 1)}\\cdot${tnum(v.v2)})=${tnum(v.v1)}$.`,
      );
    if (round === 0) {
      if (near(Math.max(d.close2, d.terminal)))
        return api.result(
          false,
          'Falta descontar el cobro futuro un intervalo antes de compararlo con el cierre de hoy.',
        );
      if (near(d.close2 + v.next2))
        return api.result(
          false,
          'Sumaste cerrar y seguir. Son acciones excluyentes: elige el máximo.',
        );
      if (near(v.next2))
        return api.result(
          false,
          'Calculaste seguir, pero cerrar ofrece más. Compara ambas acciones antes de dar el valor del estado.',
        );
    } else {
      if (near(Math.max(d.close1, d.reward1 + v.v2)))
        return api.result(
          false,
          'Usaste V(s₂) sin descontarlo al volver a la etapa 1. Hay un intervalo entre ambas.',
        );
      if (near(Math.max(d.close1, d.reward1 + d.gamma ** 2 * d.terminal)))
        return api.result(
          false,
          'Saltaste la decisión de la etapa 2. Allí puede convenir cerrar: calcula su máximo antes de retroceder.',
        );
      if (near(d.close1 + v.next1))
        return api.result(
          false,
          'Sumaste el cierre y la continuación. En la etapa 1 puedes elegir solo una de esas acciones.',
        );
      if (round === 2 && near(Math.max(d.close1, d.gamma * (d.reward1 + v.v2))))
        return api.result(
          false,
          'Descontaste también el pago inmediato. Ese pago ocurre ahora: descuenta solo V(s₂).',
        );
      if (round === 2 && near(Math.max(d.close1, d.gamma * v.v2)))
        return api.result(
          false,
          'Falta sumar el pago inmediato de seguir en 1 antes de comparar con cerrar.',
        );
      if (near(v.next1))
        return api.result(
          false,
          'Ese es el valor de seguir, pero cerrar ofrece más. El estado toma el máximo de ambas acciones.',
        );
    }
    return api.result(
      false,
      round === 0
        ? 'Descuenta el cobro final y compara con cerrar en 2; toma el mayor valor.'
        : 'Parte del cobro en 3, resuelve el máximo en 2 y después el máximo en 1. Cada paso descuenta solo su continuación.',
    );
  };
  return (
    <Stage>
      <OperationDrawing d={d} />
      <Cap x={1250} y={160} tex={`\\gamma=${tnum(d.gamma, 1)}`} />
      <Cap x={1250} y={250} size={21}>
        Calcula desde la etapa 3.
      </Cap>
      <Cap x={1250} y={340} size={20}>
        {round === 0 ? 'Resuelve la etapa 2.' : 'Resuelve 2 y después 1.'}
      </Cap>
      <NumberField
        x={1080}
        y={470}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label={round === 0 ? 'V(s₂) =' : 'V(s₁) ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c5',
  world: 'decision',
  code: '13.5',
  title: 'Paso a paso',
  subtitle: 'Ecuación de Bellman',
  glyph: 'V(s)',
  kind: 'level',
  guide: 'valentina',
  teaser: 'Tres horarios de cierre y una orden que Valentina no quiere firmar a ciegas.',
  learn:
    'Resolver una operación hacia atrás con pagos inmediatos, descuento y el máximo entre acciones.',
  glyphs: ['dec-bellman', 'dec-bellman-value'],
  pitfalls: [
    'Resuelve el estado siguiente antes de usar su valor.',
    'Descuenta la continuación un intervalo; el pago inmediato queda sin descuento.',
    'Cerrar y seguir son opciones excluyentes: toma el máximo, no la suma.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'La Bolsa, dos para las diez. El audífono de Valentina chasqueaba, y en la pantalla seguían abiertos tres horarios de cierre.',
        },
        {
          who: 'valentina',
          text: 'Tres ahora, cinco en el próximo corte, diez al final. Mi jefe quiere la firma antes de que cierre la mesa.',
        },
        {
          who: 'tu',
          text: 'Partamos por el último cobro y volvamos hacia atrás hasta esta orden.',
        },
        {
          who: 'valentina',
          text: 'Bien. Cada intervalo conserva nueve décimos del valor, y el margen hay que traerlo hasta acá.',
        },
        { who: 'iris', text: 'La firma puede esperar un cálculo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El cierre cambió',
      Scene: ClosingDemo,
      beats: [
        {
          say: 'La mesa cambia las condiciones: cada intervalo conserva 0,8 del valor. En la etapa 2 puedes cerrar por 5 o seguir hasta cobrar 10 en 3.',
          ask: {
            prompt: '¿Cuánto vale la etapa 2 con estas condiciones?',
            options: ['8', '10', '13'],
            answer: 0,
            explain:
              'max(5; 0,8 · 10) = 8. Seguir conserva más valor que cerrar; los pagos no se suman.',
          },
          note: { label: 'Nuevo valor en 2', tex: 'V(s_2)=\\max(5;0{,}8\\cdot10)=8' },
        },
        {
          say: 'Valentina recibe una oferta de cierre por 7 en la etapa 1. Seguir no paga nada ahora y lleva a la etapa 2, que vale 8.',
          ask: {
            prompt: '¿Qué conviene hacer en la etapa 1?',
            options: ['Cerrar por 7', 'Seguir hasta la etapa 2', 'Empatan'],
            answer: 0,
            explain:
              'Seguir vale 0,8 · 8 = 6,4 hoy. Cerrar paga 7: la política cambia aunque el cobro final siga siendo 10.',
          },
          note: {
            label: 'La orden de cierre',
            tex: 'V(s_1)=\\max(7;0{,}8\\cdot8)=7',
            body: 'Conviene cerrar en 1. Si se llegara a 2, allí convendría seguir.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Resolver antes de firmar', Comp: BellmanPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina firmó el cierre por siete. Al retirar la orden quedó a la vista otra posición con la misma secuencia de horarios.',
        },
        {
          who: 'valentina',
          text: 'Esta siguió hasta el final. Entró antes de que cambiaran las condiciones de la mesa.',
        },
        { who: 'iris', text: '¿Quién recibió el cambio antes que tú?' },
        {
          who: 'valentina',
          text: 'En mi pantalla llegó a las diez. Esa cuenta había movido su posición a las nueve cincuenta y nueve.',
        },
        {
          who: 'nar',
          text: 'El reloj marcó el cierre. Valentina tapó con la mano el nombre de quien había autorizado la orden.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-bellman',
    world: 'decision',
    tex: "V(s)=\\max_a\\{r(s,a)+\\gamma V(s')\\}",
    name: 'Ecuación de Bellman',
    read: 've de ese, máximo sobre a del pago inmediato más gamma por ve del estado siguiente',
    meaning:
      'En una transición determinista, compara el pago inmediato más la continuación descontada para cada acción.',
    warn: 'Si el estado siguiente es aleatorio, la continuación usa su valor esperado.',
  },
  {
    id: 'dec-bellman-value',
    world: 'decision',
    tex: 'V(s)',
    name: 'Función de valor',
    read: 've de ese',
    meaning:
      'Mejor valor alcanzable desde un estado, tomando las mejores decisiones posteriores y descontando los pagos futuros.',
    warn: 'El valor se expresa en el momento de ese estado; no sumes pagos de ramas descartadas.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Bellman · transición determinista',
      tex: "V(s)=\\max_a\\{r(s,a)+\\gamma V(s')\\}",
      body: 'r(s,a) es el pago inmediato, γ el descuento por intervalo y s′ el estado siguiente de esa acción.',
    },
    {
      label: 'Valor de acción',
      tex: "Q(s,a)=r(s,a)+\\gamma V(s')",
      body: 'Cada acción tiene un valor; V(s) toma el mayor. El pago inmediato no se descuenta.',
    },
    {
      label: 'Política óptima',
      tex: 'a^*(s)\\in\\operatorname{argmax}_a Q(s,a)',
      body: 'Una acción que alcanza el máximo en cada estado. Puede haber empate.',
    },
  ],
  props: [
    {
      label: 'Condición de término',
      tex: 'V(\\text{fin})=0',
      body: 'Tras cobrar el pago de cierre no quedan pagos futuros. En la etapa final del ejemplo, el cobro disponible vale 10.',
    },
    {
      label: 'Resolver hacia atrás',
      tex: 'V(s_3)=10,\\quad V(s_2)=9,\\quad V(s_1)=8{,}1',
      body: 'Con γ = 0,9, cierres de 5 y 3 y sin pago inmediato al seguir, resuelve 3, luego 2 y después 1.',
    },
    {
      label: 'Si hay azar',
      tex: "V(s)=\\max_a\\{r(s,a)+\\gamma\\sum_{s'}P(s'\\mid s,a)V(s')\\}",
      body: 'Promedia los valores de continuación con las probabilidades de transición antes de comparar las acciones.',
    },
  ],
};

export { lesson };
