import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
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
import { correct, fmt, GAMMA, predict, q2, qBelief, signalProb, tnum, v1 } from './kit';

const P = plane([0, 1], [-11, 0.6], { x: 170, y: 100, w: 1000, h: 620 });
const bAt = (px: number) => clamp(P.inv(px, 0)[0], 0, 1);

/** The two lines of the decision as functions of the belief. */
function Lines({ L = 10, c = 4, env = false }: { L?: number; c?: number; env?: boolean }) {
  const cross = c / L;
  return (
    <g>
      <Axes
        P={P}
        xTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        yTicks={[-10, -8, -6, -4, -2]}
        xLabel="b"
        yLabel="\text{valor}"
        grid
      />
      <Curve P={P} f={(b) => -L * b} a={0} b={1} color={C.cyan} width={env ? 2 : 4} glow={!env} />
      <Curve P={P} f={() => -c} a={0} b={1} color={C.amber} width={env ? 2 : 4} glow={!env} />
      {env && (
        <>
          <Curve P={P} f={(b) => -L * b} a={0} b={cross} color={C.green} width={7} />
          <Curve P={P} f={() => -c} a={cross} b={1} color={C.green} width={7} />
        </>
      )}
      <Cap x={P.x(0.13)} y={P.y(-L * 0.13) + 44} size={25} color={C.cyan} anchor="right">
        esperar
      </Cap>
      <Cap x={P.x(0.86)} y={P.y(-c) - 28} size={25} color={C.amber}>
        calmar
      </Cap>
    </g>
  );
}

/** Tree of one day under a belief: predict, then the two signals. */
function Branches({ b, showValues }: { b: number; showValues: boolean }) {
  const p = predict(b, 'esperar');
  const pos = signalProb(p);
  const up = correct(p, true);
  const down = correct(p, false);
  const node = (x: number, y: number, top: string, low: string, color: string) => (
    <g>
      <circle cx={x} cy={y} r={92} fill={C.panel} stroke={color} strokeWidth={3} />
      <Cap x={x} y={y - 20} size={26} color={color}>
        {top}
      </Cap>
      <Cap x={x} y={y + 24} size={25} tex={low} />
    </g>
  );
  return (
    <g>
      <Line a={[290, 420]} b={[670, 240]} color={C.muted} width={3} />
      <Line a={[290, 420]} b={[670, 600]} color={C.muted} width={3} />
      {node(200, 420, 'hoy', `b=${tnum(b, 1)}`, C.cyan)}
      {node(760, 220, 'alto', `b'=${tnum(up, 3)}`, C.amber)}
      {node(760, 620, 'bajo', `b'=${tnum(down, 3)}`, C.green)}
      <Cap x={430} y={270} size={25} tex={`P(\\text{alto})=${tnum(pos, 3)}`} />
      <Cap x={430} y={580} size={25} tex={`P(\\text{bajo})=${tnum(1 - pos, 3)}`} />
      {showValues && (
        <>
          <Cap x={1000} y={220} size={25} tex={`V_1=${tnum(v1(up), 2)}`} color={C.amber} />
          <Cap x={1000} y={620} size={25} tex={`V_1=${tnum(v1(down), 2)}`} color={C.green} />
          <Cap
            x={1240}
            y={380}
            size={25}
            tex={`Q(b,\\text{esperar})=${tnum(q2(b, 'esperar'), 2)}`}
            color={C.cyan}
          />
          <Cap
            x={1240}
            y={450}
            size={25}
            tex={`Q(b,\\text{calmar})=${tnum(q2(b, 'calmar'), 2)}`}
            color={C.amber}
          />
        </>
      )}
    </g>
  );
}

function LessonScene({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [b, setB] = useState(0.15);
  const [cost, setCost] = useState(4);
  const onB = useSvgDrag(svg, (x) => {
    const v = Math.round(bAt(x) * 100) / 100;
    setB(v);
    if (beat === 1 && Math.abs(v - 0.4) <= 0.02) unlock();
  });
  const onCost = useSvgDrag(svg, (_x, y) =>
    setCost(Math.round(clamp(-P.inv(0, y)[1], 1, 9) * 2) / 2),
  );

  if (beat === 0) {
    const f = 0.25;
    return (
      <Stage>
        <Lines />
        <Line a={P.pt(f, -11)} b={P.pt(f, 0)} color={C.text} dashed width={2} />
        <Dot x={P.x(f)} y={P.y(qBelief(f, 'esperar'))} r={11} color={C.cyan} />
        <Dot x={P.x(f)} y={P.y(-4)} r={11} color={C.amber} />
        <Cap
          x={P.x(f) + 22}
          y={P.y(-2.5) - 26}
          size={26}
          color={C.cyan}
          anchor="left"
          tex="-10\cdot0{,}25=-2{,}5"
        />
        <Cap x={P.x(f) + 22} y={P.y(-4) + 30} size={26} color={C.amber} anchor="left" tex="-4" />
      </Stage>
    );
  }
  if (beat === 1)
    return (
      <Stage ref={svg}>
        <Lines />
        <Line a={P.pt(b, -11)} b={P.pt(b, 0)} color={C.text} dashed width={2} />
        <Dot x={P.x(b)} y={P.y(-10 * b)} r={11} color={C.cyan} />
        <Dot x={P.x(b)} y={P.y(-4)} r={11} color={C.amber} />
        <Cap
          x={1370}
          y={250}
          size={28}
          color={C.cyan}
          tex={`r(b,\\text{esperar})=${tnum(-10 * b, 1)}`}
        />
        <Cap x={1370} y={320} size={28} color={C.amber} tex="r(b,\text{calmar})=-4" />
        <Cap x={1370} y={410} size={26} color={C.text}>
          {-10 * b > -4
            ? 'cuesta menos esperar'
            : -10 * b < -4
              ? 'cuesta menos calmar'
              : 'cuestan lo mismo'}
        </Cap>
        <Knob x={P.x(b)} y={P.y(-11) + 62} onPointerDown={onB} cursor="ew-resize" label="b" />
      </Stage>
    );
  if (beat === 2)
    return (
      <Stage ref={svg}>
        <Lines c={cost} />
        <Dot x={P.x(cost / 10)} y={P.y(-cost)} r={12} color={C.green} />
        <Cap
          x={1370}
          y={250}
          size={30}
          color={C.green}
          tex={`b^*=\\frac{${tnum(cost, 1)}}{10}=${tnum(cost / 10, 2)}`}
        />
        <Cap x={1420} y={350} size={22} color={C.muted}>
          mueve el costo de calmar
        </Cap>
        <Knob
          x={P.x(1) + 44}
          y={P.y(-cost)}
          color={C.amber}
          onPointerDown={onCost}
          cursor="ns-resize"
          label="c"
        />
      </Stage>
    );
  if (beat === 3 || beat === 4)
    return (
      <Stage>
        <Lines env />
        <Cap x={1370} y={230} size={27} color={C.green} tex="V_1(b)=\max_a r(b,a)" />
        <Cap x={1370} y={320} size={26} color={C.cyan} tex="\alpha_{\text{esperar}}=(0,\,-10)" />
        <Cap x={1370} y={380} size={26} color={C.amber} tex="\alpha_{\text{calmar}}=(-4,\,-4)" />
        {beat === 4 && answer !== null && (
          <>
            <Dot x={P.x(0.3)} y={P.y(-3)} r={11} color={C.green} />
            <Dot x={P.x(0.7)} y={P.y(-4)} r={11} color={C.green} />
          </>
        )}
      </Stage>
    );
  if (beat === 5 || beat === 6)
    return (
      <Stage>
        <Branches b={0.2} showValues={beat === 6} />
      </Stage>
    );
  const p = predict(0.2, 'esperar');
  const pos = signalProb(p);
  const a = correct(p, false);
  const c = correct(p, true);
  const avg = pos * v1(c) + (1 - pos) * v1(a);
  return (
    <Stage>
      <Lines env />
      <Line a={P.pt(a, v1(a))} b={P.pt(c, v1(c))} color={C.magenta} width={3} dashed />
      <Dot x={P.x(a)} y={P.y(v1(a))} r={10} color={C.magenta} />
      <Dot x={P.x(c)} y={P.y(v1(c))} r={10} color={C.magenta} />
      <Dot x={P.x(p)} y={P.y(avg)} r={12} color={C.magenta} />
      <Dot x={P.x(p)} y={P.y(v1(p))} r={12} color={C.green} />
      <Cap
        x={1370}
        y={250}
        size={26}
        color={C.magenta}
        tex={`\\text{promedio de }V_1=${tnum(avg, 2)}`}
      />
      <Cap x={1370} y={320} size={26} color={C.green} tex={`V_1(0{,}34)=${tnum(v1(p), 2)}`} />
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Política sobre creencias',
  intro: {
    question: '¿Cuál es la mejor acción si no sabes en qué estado estás?',
    text: 'En un POMDP nadie ve el estado, pero la creencia sí se conoce. Esta clase muestra cómo se elige una acción con ella: se promedian las recompensas según la creencia y se elige la mejor. Con eso vamos a comprobar si las compras de la cuenta siguen una regla.',
  },
  Scene: LessonScene,
  beats: [
    {
      say: 'La **recompensa esperada** $r(b,a)$, que se lee «erre de be y a», promedia la recompensa de la acción $a$ en cada estado, ponderada por su probabilidad en la creencia $b$. Sirve para comparar acciones cuando no se conoce el estado.\n\nAquí $b$ es la probabilidad del rumor: esperar vale $-10b$ y calmar vale $-4$ en ambos estados. Con $b=0{,}25$, esperar vale $-2{,}5$, un valor mayor que $-4$ y por tanto un costo menor.',
      board: {
        label: 'Recompensa esperada',
        tex: '\\p{1}{r(b,a)}=\\p{2}{\\sum_s}\\p{3}{b(s)}\\,\\p{4}{r(s,a)}',
        parts: [
          'valor de la acción',
          'suma sobre estados',
          'creencia en el estado',
          'recompensa en él',
        ],
      },
    },
    {
      say: 'Cada acción tiene una recta de recompensa esperada según la creencia $b$, que va de 0 a 1. Esperar parte en 0 y llega a $-10$ cuando el rumor es seguro; calmar mantiene el valor $-4$. Para elegir, compara las alturas: conviene la recta de mayor valor, aunque ambos valores sean negativos.',
      gate: 'Mueve $b$ hasta encontrar dónde esperar y calmar valen lo mismo. Compara los valores y mira dónde se cruzan las rectas.',
      after:
        'El cruce exacto es $b=0{,}4$, aunque se acepta una posición cercana. Bajo ese valor conviene esperar y sobre él conviene calmar; esa cifra aparecía en las órdenes de la cuenta.',
      board: {
        label: 'Punto de indiferencia',
        tex: '\\p{1}{-10\\,b}=\\p{2}{-4}\\ \\Rightarrow\\ \\p{3}{b=0{,}4}',
        parts: ['valor de esperar', 'valor de calmar', 'creencia de indiferencia'],
      },
    },
    {
      say: 'El **umbral** $b^*$, leído «be estrella», es la creencia donde las dos acciones tienen igual valor. Si esperar cuesta $L$ cuando hay rumor y calmar cuesta $c$ en cualquier estado, se igualan $-Lb$ y $-c$: para $L>0$, resulta $b^*=c/L$.\n\nCon $0\\le c\\le L$ el cruce está entre 0 y 1. Al subir el costo de calmar, el umbral sube: hace falta una creencia mayor para que convenga calmar.',
      board: {
        label: 'Umbral',
        tex: '\\p{1}{b^*}=\\frac{\\p{2}{c}}{\\p{3}{L}}',
        parts: ['creencia umbral', 'costo de actuar', 'pérdida si no actúas'],
      },
    },
    {
      say: 'El **valor de una creencia** $V_1(b)$, leído «ve sub uno de be», es la mayor recompensa esperada disponible para una etapa. El **vector alfa** $\\alpha_a$, leído «alfa sub a», reúne las recompensas de la acción $a$ en cada estado; su producto punto con las probabilidades de la creencia da su recompensa esperada.\n\nEl máximo de estas rectas forma el borde verde: es lineal por tramos y **convexo**, pues la cuerda entre dos puntos queda sobre o en la curva. Esta forma se mantiene en un POMDP de horizonte finito.',
      board: {
        label: 'Valor con vectores',
        tex: '\\p{1}{V_1(b)}=\\p{2}{\\max_a}\\ \\p{3}{\\alpha_a\\cdot b}',
        parts: ['valor de la creencia', 'mejor acción', 'promedio de recompensas'],
      },
    },
    {
      say: 'Una **política sobre creencias** $\\pi(b)$, leída «pi de be», asigna una acción a cada creencia disponible. Aquí indica esperar bajo el umbral 0,4 y calmar desde ese valor; en el umbral ambas acciones empatan. Para hallar $V_1$, compara las recompensas de las dos acciones y elige la mayor.',
      ask: {
        prompt: '¿Cuánto valen $V_1(0{,}3)$ y $V_1(0{,}7)$?',
        options: ['$-3$ y $-4$', '$-3$ y $-7$', '$-4$ y $-4$'],
        answer: 0,
        explain:
          'En 0,3 conviene esperar: $-10\\cdot0{,}3=-3$. En 0,7 conviene calmar: $-4$, que es mejor que $-7$.',
      },
      board: {
        label: 'Política por umbral',
        tex: '\\p{1}{\\pi(b)}=\\begin{cases}\\p{2}{\\text{esperar}}&b<0{,}4\\\\\\p{3}{\\text{calmar}}&b\\ge0{,}4\\end{cases}',
        parts: ['acción según creencia', 'bajo el umbral', 'desde el umbral'],
      },
    },
    {
      say: 'Un POMDP puede tratarse como un **MDP de creencias**: la creencia conocida cumple el papel de estado para decidir en varias etapas. Tras la acción $a$, la señal $o$ aparece con probabilidad $P(o\\mid b,a)$, leída «probabilidad de o dado be y a», y el filtro entrega la nueva creencia $b\'_{a,o}$.\n\nDesde $b=0{,}2$, esperar lleva a 0,673 con volumen alto o a 0,114 con volumen bajo. En la ecuación, $\\gamma$ («gamma») descuenta el valor futuro y el máximo elige la mejor acción.',
      board: {
        label: 'Bellman en creencias',
        tex: "\\p{1}{V(b)}=\\p{2}{\\max_a}\\Big[\\p{3}{r(b,a)}+\\p{4}{\\gamma\\sum_o P(o\\mid b,a)\\,V(b'_{a,o})}\\Big]",
        parts: [
          'valor de la creencia',
          'mejor acción',
          'recompensa esperada',
          'futuro según la señal',
        ],
      },
    },
    {
      say: 'El **valor de acción** $Q(b,a)$, leído «cu de be y a», suma la recompensa esperada de hoy y el valor futuro descontado si se toma $a$ y luego se decide otra vez. Con dos etapas y $\\gamma=0{,}9$, esperar vale $-2+0{,}9[0{,}404(-4)+0{,}596(-1{,}14)]=-4{,}07$.\n\nCalmar vale $-4$ hoy y deja $b=0{,}1$: su valor es $-4+0{,}9(-1)=-4{,}90$. Conviene esperar; parte de la ventaja viene de decidir mañana con una señal adicional.',
      board: {
        label: 'Dos etapas',
        tex: '\\p{1}{Q(0{,}2,\\text{esperar})=-4{,}07}\\quad\\p{2}{Q(0{,}2,\\text{calmar})=-4{,}90}',
        parts: ['esperar y decidir mañana', 'calmar hoy'],
      },
    },
    {
      say: 'Una función **convexa** tiene la propiedad de que el promedio ponderado de sus valores es al menos su valor en el promedio ponderado de las entradas. Aquí las creencias 0,114 y 0,673 promedian 0,34 según las probabilidades de sus señales.\n\nEl promedio de sus valores $V_1$ es $-2{,}30$, frente a $V_1(0{,}34)=-3{,}40$. La distancia entre la cuerda y la curva muestra la ganancia de decidir después de ver la señal; puede ser cero cuando no cambia la acción óptima.',
      board: {
        label: 'Convexidad',
        tex: '\\p{1}{\\sum_o P(o)\\,V(b_o)}\\ \\ge\\ \\p{2}{V\\big(\\sum_o P(o)\\,b_o\\big)}',
        parts: ['decidir tras la señal', 'decidir sin señal'],
      },
    },
  ],
};

const DAYS: { b: number; buy: boolean }[] = [
  { b: 0.08, buy: false },
  { b: 0.17, buy: false },
  { b: 0.26, buy: false },
  { b: 0.33, buy: false },
  { b: 0.46, buy: true },
  { b: 0.58, buy: true },
  { b: 0.71, buy: true },
  { b: 0.86, buy: true },
];
const TEST = [
  { day: 'martes', b: 0.37, buy: false },
  { day: 'jueves', b: 0.44, buy: true },
];

function Investigation({ beats, unlock }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const X = (b: number) => 180 + b * 1100;
  const [rule, setRule] = useState(0.8);
  const [guess, setGuess] = useState<(string | null)[]>([null, null]);
  const onRule = useSvgDrag(svg, (x) => {
    if (beat !== 0) return;
    const v = Math.round(clamp((x - 180) / 1100, 0, 1) * 100) / 100;
    setRule(v);
    if (Math.abs(v - 0.4) <= 0.03) unlock();
  });
  const shown = beat >= 1 ? 0.4 : rule;
  return (
    <Stage ref={svg}>
      <Cap x={730} y={140} size={27}>
        Costo de calmar 4 · pérdida por rumor 10
      </Cap>
      <line x1={X(0)} x2={X(1)} y1={420} y2={420} stroke={C.dim} strokeWidth={4} />
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
        <Cap key={t} x={X(t)} y={462} size={24} color={C.muted}>
          {fmt(t, 1)}
        </Cap>
      ))}
      <Line a={[X(shown), 250]} b={[X(shown), 420]} color={C.green} width={4} />
      <Cap x={X(shown)} y={226} size={25} color={C.green} tex={`b=${tnum(shown, 2)}`} />
      {beat === 0 && (
        <Knob
          x={X(shown)}
          y={570}
          color={C.green}
          onPointerDown={onRule}
          cursor="ew-resize"
          label="regla"
        />
      )}
      {beat >= 1 &&
        DAYS.map((d) => (
          <g key={d.b}>
            <circle
              cx={X(d.b)}
              cy={420}
              r={15}
              fill={d.buy ? C.amber : C.panel}
              stroke={d.buy ? C.amber : C.muted}
              strokeWidth={3}
            />
          </g>
        ))}
      {beat >= 1 && (
        <Cap x={730} y={560} size={25} color={C.amber}>
          naranjo: la cuenta compró · vacío: no compró
        </Cap>
      )}
      {beat === 2 &&
        TEST.map((t, i) => (
          <Choices
            key={t.day}
            x={730}
            y={640 + i * 80}
            label={`${t.day}, b = ${fmt(t.b, 2)}`}
            options={['compra', 'no compra']}
            value={guess[i]}
            onPick={(v) => {
              const next = guess.map((g, k) => (k === i ? v : g));
              setGuess(next);
              if (TEST.every((q, k) => next[k] === (q.buy ? 'compra' : 'no compra'))) unlock();
            }}
          />
        ))}
    </Stage>
  );
}

function Practice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 131 + round);
    const [c, L] = pick(r, [
      [2, 10],
      [3, 12],
      [3, 15],
      [5, 20],
      [6, 15],
      [8, 16],
      [6, 24],
    ]);
    const b = pick(r, [0.1, 0.15, 0.25, 0.3, 0.45, 0.55, 0.6, 0.7, 0.8]);
    const b0 = pick(r, [0.1, 0.2, 0.3]);
    return { c, L, b, b0 };
  }, [seed, round]);
  const [text, setText] = useState('');
  const [pickAct, setPick] = useState<string | null>(null);
  const star = d.c / d.L;
  const value = Math.max(-d.L * d.b, -d.c);
  const best = -d.L * d.b >= -d.c ? 'esperar' : 'calmar';
  const p = predict(d.b0, 'esperar');
  const pos = signalProb(p);
  const up = correct(p, true);
  const down = correct(p, false);
  const q = q2(d.b0, 'esperar');

  useEffect(() => {
    setText('');
    setPick(null);
    if (round === 0) {
      api.prompt(
        `Calmar cuesta ${d.c} y un rumor sin calmar cuesta ${d.L}. ¿Desde qué creencia conviene calmar?`,
        'b^*=\\frac{c}{L}',
      );
      api.hints([
        'Iguala el valor de esperar, $-Lb$, con el de calmar, $-c$.',
        `$b^*=${d.c}/${d.L}=${tnum(star, 2)}$.`,
      ]);
    } else if (round === 1) {
      api.prompt(
        `Con pérdida ${d.L}, costo ${d.c} y creencia $b=${tnum(d.b, 2)}$, calcula $V_1(b)$ y elige la acción.`,
        'V_1(b)=\\max(-Lb,\\,-c)',
      );
      api.hints([
        `Esperar vale $-${d.L}\\cdot${tnum(d.b, 2)}=${tnum(-d.L * d.b, 2)}$. Compara con calmar.`,
        `$V_1=${tnum(value, 2)}$: conviene ${best}.`,
      ]);
    } else {
      api.prompt(
        `Desde $b=${tnum(d.b0, 1)}$, calcula el valor de esperar hoy y decidir mañana con la señal. Usa $\\gamma=0{,}9$.`,
        "Q(b,\\text{esperar})=r(b,\\text{esperar})+\\gamma\\sum_o P(o)\\,V_1(b'_o)",
      );
      api.hints([
        `Hoy: $r=-10\\cdot${tnum(d.b0, 1)}=${tnum(-10 * d.b0, 1)}$. Mañana: $${tnum(pos, 3)}\\cdot(${tnum(v1(up), 2)})+${tnum(1 - pos, 3)}\\cdot(${tnum(v1(down), 2)})$.`,
        `El resultado es $${tnum(q, 2)}$.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, d]);

  const submit = () => {
    const n = parseNum(text);
    if (n === null) return api.result(false, 'Escribe un número.');
    const near = (x: number, tol = 0.02) => Math.abs(n - x) <= tol;
    if (round === 0) {
      if (near(star, 0.011))
        return api.result(
          true,
          `Bajo ${fmt(star)} cuesta menos esperar; desde ahí conviene calmar.`,
        );
      if (near(d.L / d.c))
        return api.result(false, 'Invertiste la fracción. Una creencia está entre 0 y 1.');
      return api.result(
        false,
        `Con $b=${tnum(n, 2)}$ esperar vale $${tnum(-d.L * n, 2)}$ y calmar $-${d.c}$. En el umbral valen lo mismo.`,
      );
    }
    if (round === 1) {
      if (!pickAct) return api.result(false, 'Elige también la acción.');
      if (pickAct !== best)
        return api.result(
          false,
          `Esperar vale $${tnum(-d.L * d.b, 2)}$ y calmar $-${d.c}$. Se elige el mayor, el menos negativo.`,
        );
      if (near(value))
        return api.result(
          true,
          `$V_1=${tnum(value, 2)}$: ${best} es la mejor acción con esa creencia.`,
        );
      if (near(Math.min(-d.L * d.b, -d.c)))
        return api.result(false, 'Ese es el valor de la peor acción. $V_1$ toma el máximo.');
      return api.result(
        false,
        'La acción está bien, pero el valor no: $V_1$ es el valor de esa acción.',
      );
    }
    if (near(q))
      return api.result(
        true,
        `$Q=${tnum(q, 2)}$. Esperar incluye lo que mañana se decide con la señal.`,
      );
    const future = pos * v1(up) + (1 - pos) * v1(down);
    if (near(-10 * d.b0 + future))
      return api.result(false, 'Falta descontar lo de mañana con $\\gamma=0{,}9$.');
    if (near(GAMMA * future)) return api.result(false, 'Falta la recompensa de hoy, $-10b$.');
    return api.result(
      false,
      'Pondera cada $V_1$ por la probabilidad de su señal, descuenta y suma lo de hoy.',
    );
  };

  return (
    <Stage>
      {round === 2 ? (
        <>
          <Branches b={d.b0} showValues={false} />
          <Cap
            x={1240}
            y={220}
            size={25}
            tex={`V_1(${tnum(up, 3)})=${tnum(v1(up), 2)}`}
            color={C.amber}
          />
          <Cap
            x={1240}
            y={620}
            size={25}
            tex={`V_1(${tnum(down, 3)})=${tnum(v1(down), 2)}`}
            color={C.green}
          />
          <NumberField
            x={1040}
            y={420}
            value={text}
            onChange={setText}
            onEnter={submit}
            label="Q ="
          />
        </>
      ) : (
        <>
          <Cap x={800} y={220} size={34} color={C.cyan} tex={`r(b,\\text{esperar})=-${d.L}\\,b`} />
          <Cap x={800} y={300} size={34} color={C.amber} tex={`r(b,\\text{calmar})=-${d.c}`} />
          {round === 1 && <Cap x={800} y={380} size={34} tex={`b=${tnum(d.b, 2)}`} />}
          <NumberField
            x={600}
            y={500}
            value={text}
            onChange={setText}
            onEnter={submit}
            label={round === 0 ? 'b* =' : 'V₁ ='}
          />
          {round === 1 && (
            <Choices
              x={800}
              y={610}
              options={['esperar', 'calmar']}
              value={pickAct}
              onPick={setPick}
            />
          )}
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c11',
  world: 'decision',
  code: '13.11',
  title: 'Decidir sin ver',
  subtitle: 'Política sobre creencias',
  glyph: '\\pi(b)',
  kind: 'level',
  guide: 'valentina',
  teaser:
    'Las compras de la cuenta caen siempre sobre la misma cifra. Valentina sospecha que no es suerte.',
  learn:
    'Recompensa esperada bajo una creencia, umbral de decisión, vectores α y POMDP como MDP de creencias.',
  glyphs: ['dec-qbelief', 'dec-alpha', 'dec-beliefmdp'],
  pitfalls: [
    'La política depende de la creencia, porque el estado no se conoce.',
    'Con recompensas negativas, el máximo es el valor menos negativo.',
    'El umbral es $c/L$, no $L/c$.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina marcó con lápiz cada compra sobre la curva de Teo. Después afiló el lápiz, aunque no le hacía falta.',
        },
        {
          who: 'valentina',
          text: 'Ninguna compra bajo 0,4. Ninguna ausencia sobre 0,4. En veinte años no he visto a un operador tan ordenado.',
        },
        { who: 'iris', text: '¿Esa cifra significa algo, o solo es donde dejó de comprar?' },
        { who: 'teo', text: 'Calmar cuesta 4 y el rumor cuesta 10. Podría salir de ahí.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La regla de la cuenta',
      Scene: Investigation,
      beats: [
        {
          say: 'Antes de mirar las órdenes, Valentina quiere una predicción escrita. Con esos dos costos, ¿dónde debería estar la regla de alguien que decide bien?',
          gate: 'Ubica la regla donde esperar y calmar tienen el mismo costo esperado. Usa los costos mostrados para calcularla y mueve la marca.',
          after:
            'Con $c=4$ y $L=10$, el umbral exacto es $b^*=0{,}4$, aunque se acepta una posición cercana. La predicción sale de los costos, antes de ver las órdenes.',
          note: { label: 'Umbral predicho', tex: 'b^*=\\frac{c}{L}=\\frac{4}{10}=0{,}4' },
        },
        {
          say: 'Valentina pone las órdenes sobre la recta. Cada punto es un día, según la creencia que se podía tener con las señales.',
          ask: {
            prompt: '¿Qué muestra la separación de los puntos?',
            options: [
              'La cuenta sigue un umbral sobre su creencia',
              'La cuenta compra al azar',
              'La cuenta veía el estado real',
            ],
            answer: 0,
            explain:
              'Todas las compras quedan sobre 0,4 y ninguna ausencia. Quien viera el estado real no se ordenaría por esta creencia.',
          },
          note: {
            label: 'Política de la cuenta',
            body: 'Compra si $b\\ge0{,}4$. La regla usa lo que se podía saber, no el estado.',
          },
        },
        {
          say: 'Dos días quedaron fuera de la tabla. Teo tiene la creencia de cada uno, pero Valentina tapó las órdenes con la mano.',
          gate: 'Predice si la cuenta compró el martes y el jueves. Compara la creencia de cada día con la regla.',
          after:
            'Martes, $b=0{,}37$: no compró. Jueves, $b=0{,}44$: compró. La regla también acierta en estos días, que no se usaron para construirla.',
          note: {
            label: 'Prueba de la regla',
            body: 'La regla acierta en días que no se usaron para construirla.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Decidir con lo que se sabe', Comp: Practice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina levantó la mano. Las dos órdenes estaban donde había dicho la regla.',
        },
        {
          who: 'valentina',
          text: 'Sabe lo que cuesta equivocarse. Eso no es intuición: es contabilidad.',
        },
        {
          who: 'iris',
          text: 'Hay días en que su creencia estaba muy cerca de 0,4. ¿Qué hacía entonces?',
        },
        { who: 'teo', text: 'Esos días hay una factura. Una por día, siempre a la misma empresa.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-qbelief',
    world: 'decision',
    tex: 'r(b,a)',
    name: 'Recompensa esperada bajo una creencia',
    read: 'erre de be y a',
    meaning: 'Promedio de las recompensas de la acción, ponderado por la creencia en cada estado.',
  },
  {
    id: 'dec-alpha',
    world: 'decision',
    tex: '\\alpha_a',
    name: 'Vector alfa',
    read: 'alfa sub a',
    meaning:
      'Recompensas de una acción por estado. Su producto punto con la creencia da el valor de la acción.',
  },
  {
    id: 'dec-beliefmdp',
    world: 'decision',
    tex: 'V(b)',
    name: 'Valor de una creencia',
    read: 've de be',
    meaning:
      'Mejor valor esperado desde una creencia. Un POMDP se resuelve como un MDP cuyo estado es la creencia.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Recompensa esperada', tex: 'r(b,a)=\\sum_s b(s)\\,r(s,a)' },
    {
      label: 'Política sobre creencias',
      tex: '\\pi:b\\mapsto a',
      body: 'Asigna una acción a cada creencia.',
    },
    {
      label: 'Vector alfa',
      tex: '\\alpha_a=(r(s_1,a),\\dots,r(s_n,a))',
      body: 'Con él, $r(b,a)=\\alpha_a\\cdot b$.',
    },
  ],
  props: [
    { label: 'Umbral con dos acciones', tex: 'b^*=\\frac{c}{L}' },
    {
      label: 'Forma del valor',
      tex: 'V(b)=\\max_\\alpha\\ \\alpha\\cdot b',
      body: 'Con horizonte finito es lineal por tramos y convexa.',
    },
    {
      label: 'Bellman en creencias',
      tex: "V(b)=\\max_a\\Big[r(b,a)+\\gamma\\sum_o P(o\\mid b,a)\\,V(b'_{a,o})\\Big]",
    },
  ],
};
