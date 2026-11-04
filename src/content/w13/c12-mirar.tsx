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
import { OBS_REPORT, REPORT_COST, correct, fmt, signalProb, tnum, v1, voi } from './kit';

const P = plane([0, 1], [-5, 0.4], { x: 170, y: 100, w: 1000, h: 300 });
const G = plane([0, 1], [0, 2.2], { x: 170, y: 470, w: 1000, h: 280 });
const bAt = (px: number) => clamp(P.inv(px, 0)[0], 0, 1);
const after = (b: number) => {
  const pos = signalProb(b, OBS_REPORT);
  const up = correct(b, true, OBS_REPORT);
  const down = correct(b, false, OBS_REPORT);
  return { pos, up, down, mean: pos * v1(up) + (1 - pos) * v1(down) };
};
/** beliefs where the report is worth more than it costs */
const band = (c: number): [number, number] | null => {
  const inside = Array.from({ length: 1001 }, (_, k) => k / 1000).filter((b) => voi(b) > c);
  return inside.length ? [inside[0], inside[inside.length - 1]] : null;
};

function Value({ b }: { b: number }) {
  const a = after(b);
  return (
    <g>
      <Axes P={P} xTicks={[]} yTicks={[-4, -2]} />
      <Cap x={P.x(0.95)} y={P.y(0) + 34} size={26} color={C.green} tex="V_1(b)" />
      <Curve P={P} f={v1} a={0} b={1} color={C.green} width={5} />
      <Line
        a={P.pt(a.down, v1(a.down))}
        b={P.pt(a.up, v1(a.up))}
        color={C.magenta}
        width={3}
        dashed
      />
      <Dot x={P.x(a.down)} y={P.y(v1(a.down))} r={9} color={C.magenta} />
      <Dot x={P.x(a.up)} y={P.y(v1(a.up))} r={9} color={C.magenta} />
      <Line a={P.pt(b, v1(b))} b={P.pt(b, a.mean)} color={C.amber} width={5} />
      <Dot x={P.x(b)} y={P.y(v1(b))} r={10} color={C.text} />
      <Dot x={P.x(b)} y={P.y(a.mean)} r={10} color={C.amber} />
    </g>
  );
}

function Gain({ b, cost }: { b?: number; cost?: number }) {
  const zone = cost === undefined ? null : band(cost);
  return (
    <g>
      <Axes
        P={G}
        xTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        yTicks={[1, 2]}
        xLabel="b"
        yLabel="\text{VI}"
      />
      {zone && (
        <rect
          x={G.x(zone[0])}
          y={G.y(2.2)}
          width={G.x(zone[1]) - G.x(zone[0])}
          height={G.box.h}
          fill={C.green}
          opacity={0.14}
        />
      )}
      <Curve P={G} f={(x) => voi(x)} a={0} b={1} color={C.amber} width={4} samples={400} />
      {b !== undefined && <Dot x={G.x(b)} y={G.y(voi(b))} r={10} color={C.amber} />}
      {cost !== undefined && (
        <Line a={G.pt(0, cost)} b={G.pt(1, cost)} color={C.red} width={3} dashed />
      )}
    </g>
  );
}

function Readout({ b }: { b: number }) {
  const a = after(b);
  return (
    <g>
      <Cap x={1385} y={150} size={25} tex={`b=${tnum(b, 2)}`} />
      <Cap x={1385} y={205} size={25} tex={`P(+)=${tnum(a.pos, 2)}`} />
      <Cap x={1385} y={260} size={25} color={C.magenta} tex={`b_+=${tnum(a.up, 3)}`} />
      <Cap x={1385} y={315} size={25} color={C.magenta} tex={`b_-=${tnum(a.down, 3)}`} />
      <Cap x={1385} y={400} size={27} color={C.amber} tex={`\\text{VI}=${tnum(voi(b), 2)}`} />
    </g>
  );
}

function LessonScene({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [b, setB] = useState(0.15);
  const [cost, setCost] = useState(REPORT_COST);
  const onB = useSvgDrag(svg, (x) => {
    const v = Math.round(bAt(x) * 100) / 100;
    setB(v);
    if (beat === 3 && Math.abs(v - 0.4) <= 0.02) unlock();
  });
  const onCost = useSvgDrag(svg, (_x, y) => {
    const v = Math.round(clamp(G.inv(0, y)[1], 0, 2.2) * 20) / 20;
    setCost(v);
    if (beat === 6 && v >= 1.95) unlock();
  });
  const fixed = beat === 4 ? 0.9 : beat === 5 ? 0.05 : 0.4;
  const shown = beat === 3 ? b : fixed;
  if (beat === 0)
    return (
      <Stage>
        <circle cx={420} cy={420} r={130} fill={C.panel} stroke={C.cyan} strokeWidth={4} />
        <Cap x={420} y={395} size={30} color={C.cyan}>
          el mundo
        </Cap>
        <Cap x={420} y={445} size={24} color={C.muted}>
          sigue igual
        </Cap>
        <circle cx={1020} cy={420} r={130} fill={C.panel} stroke={C.amber} strokeWidth={4} />
        <Cap x={1020} y={395} size={30} color={C.amber}>
          la creencia
        </Cap>
        <Cap x={1020} y={445} size={24} color={C.muted}>
          cambia
        </Cap>
        <Line a={[570, 420]} b={[870, 420]} color={C.line} width={3} />
        <Cap x={720} y={380} size={28}>
          informe
        </Cap>
        <Cap x={720} y={470} size={24} color={C.muted}>
          cuesta 1 · acierta 9 de cada 10
        </Cap>
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <Value b={shown} />
      <Gain b={beat === 1 ? undefined : shown} cost={beat >= 5 ? cost : undefined} />
      <Readout b={shown} />
      {beat === 3 && (
        <Knob x={G.x(b)} y={G.y(0) + 62} onPointerDown={onB} cursor="ew-resize" label="b" />
      )}
      {beat === 6 && (
        <>
          <Knob
            x={G.x(1) + 44}
            y={G.y(cost)}
            color={C.red}
            onPointerDown={onCost}
            cursor="ns-resize"
            label="c"
          />
          <Cap x={1385} y={560} size={24} color={C.green}>
            {band(cost)
              ? `mirar entre ${fmt(band(cost)![0])} y ${fmt(band(cost)![1])}`
              : 'nunca conviene mirar'}
          </Cap>
        </>
      )}
      {beat === 4 && answer !== null && (
        <Cap x={1385} y={480} size={24} color={C.text}>
          ambos llevan a calmar
        </Cap>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Valor de la información en un POMDP',
  intro: {
    question: '¿Cuándo conviene pagar por saber más antes de decidir?',
    text: 'Hay acciones que no cambian el mercado y solo cambian lo que crees. En un POMDP compiten con las demás en la misma cuenta. Esta clase mide cuánto vale una señal antes de tenerla, y con eso vamos a leer las facturas de la cuenta.',
  },
  Scene: LessonScene,
  beats: [
    {
      say: 'Una **acción de información** entrega una observación que puede cambiar la creencia sin cambiar el estado del mercado. Pedir un informe es una de esas acciones.\n\nEl informe cuesta 1 y acierta con probabilidad 0,9, tanto si hay rumor como si hay calma. Para decidir si conviene, hay que medir cuánto mejora la decisión antes de conocer el resultado.',
    },
    {
      say: 'La creencia $b$ es la probabilidad de rumor; aquí parte en $0{,}4$. Un positivo tiene probabilidad $0{,}9\\cdot0{,}4+0{,}1\\cdot0{,}6=0{,}42$.\n\nCon Bayes se obtiene $b_+=0{,}857$ tras un positivo y $b_-=0{,}069$ tras un negativo, leídos «be más» y «be menos». Los puntos rosados muestran esas creencias sobre $V_1$, leído «ve uno», el valor de decidir con una acción disponible.',
      board: {
        label: 'Creencias tras el informe',
        tex: '\\p{1}{b_+=\\frac{0{,}36}{0{,}42}=0{,}857}\\qquad\\p{2}{b_-=\\frac{0{,}04}{0{,}58}=0{,}069}',
        parts: ['tras un positivo', 'tras un negativo'],
      },
    },
    {
      say: 'El **valor de la información** es la mejora esperada al decidir después de observar una señal, respecto de decidir ahora, antes de descontar su costo. $\\text{VI}(b)$ se lee «ve i de be»: se promedian los valores $V_1$ de las creencias posibles según sus probabilidades y se resta $V_1(b)$.\n\nPara $b=0{,}4$, el promedio es $0{,}42\\cdot(-4)+0{,}58\\cdot(-0{,}69)=-2{,}08$, frente a $-4$ ahora. La diferencia es $1{,}92$, el trazo naranjo entre la cuerda y la curva.',
      board: {
        label: 'Valor de la información',
        tex: '\\p{1}{\\text{VI}(b)}=\\p{2}{\\sum_o P(o\\mid b)\\,V_1(b_o)}-\\p{3}{V_1(b)}',
        parts: ['ganancia por mirar', 'decidir tras la señal', 'decidir ahora'],
      },
    },
    {
      say: 'La curva naranja de abajo muestra el valor de la información para cada creencia $b$: cuanto más alta, mayor es la mejora esperada antes de pagar el informe.\n\nAntes de mover el control, piensa dónde debería ser mayor: ¿cuándo te sirve más una señal, con una decisión clara o con una dudosa?',
      gate: 'Mueve $b$ y busca dónde el informe tiene mayor valor. Mira la altura de la curva naranja.',
      after:
        'El máximo está en $b=0{,}4$ y vale 1,92. En ese umbral, los resultados de la señal inclinan la decisión hacia acciones distintas.',
    },
    {
      say: 'Ahora la creencia es $b=0{,}9$. Un positivo la sube aproximadamente a 0,988 y un negativo la baja a 0,5, todavía sobre el umbral de 0,4. Compara la acción que elegirías en cada caso con la que elegirías sin informe.',
      ask: {
        prompt: 'Con $b=0{,}9$, ¿cuánto vale el informe?',
        options: [
          '0: ningún resultado cambia la decisión',
          '1,92: siempre vale lo mismo',
          '0,9: su precisión',
        ],
        answer: 0,
        explain:
          'Con cualquiera de los dos resultados vas a calmar, igual que sin informe. El promedio de $V_1$ queda en $-4$ y la ganancia es 0.',
      },
      board: {
        label: 'Regla de la información',
        tex: '\\p{1}{\\text{VI}(b)=0}\\quad\\p{2}{\\text{si ninguna señal cambia la acción}}',
        parts: ['no vale nada', 'cuando no cambia la decisión'],
      },
    },
    {
      say: 'Con $b=0{,}05$, el informe vale 0: incluso un positivo deja la creencia bajo el umbral. Con $b=0{,}1$, vale 0,18.\n\nEn este problema, la información tiene valor positivo solo si algún resultado puede cambiar la acción óptima. Que cambie la creencia no basta para justificar el costo del informe.',
      board: {
        label: 'Ejemplos',
        tex: '\\p{1}{\\text{VI}(0{,}05)=0}\\quad\\p{2}{\\text{VI}(0{,}1)=0{,}18}\\quad\\p{3}{\\text{VI}(0{,}4)=1{,}92}',
        parts: ['positivo no alcanza', 'señal poco útil', 'decisión más dudosa'],
      },
    },
    {
      say: 'Mirar conviene cuando $\\text{VI}(b)$ supera el costo $c$, leído «ce». La línea roja muestra el costo y la franja verde reúne las creencias donde la curva lo supera.\n\nCon $c=1$, esa franja va aproximadamente de $b=0{,}24$ a $b=0{,}62$. En igualdad de valor y costo, mirar y decidir ahora dan el mismo resultado esperado.',
      gate: 'Sube el costo hasta que ya no convenga mirar con ninguna creencia. Observa la línea roja y la franja verde.',
      after:
        'La franja desaparece cuando el costo supera 1,92, el máximo de la curva. Por encima de ese precio, ninguna creencia justifica comprar el informe.',
      board: {
        label: 'Cuándo mirar',
        tex: '\\p{1}{\\text{VI}(b)}>\\p{2}{c}',
        parts: ['lo que gana mirar', 'lo que cuesta mirar'],
      },
    },
    {
      say: 'El **valor de mirar** $Q(b,\\text{mirar})$, leído «cu de be y mirar», suma el costo negativo del informe y el valor esperado de decidir después de observarlo. La suma recorre cada resultado posible $o$, ponderado por su probabilidad $P(o\\mid b)$, leída «probabilidad de o dado be».\n\nMirar compite con esperar y calmar en el mismo $\\max$, que elige el mayor valor. La creencia y el filtro permiten calcular esa continuación y elegir una política.',
      board: {
        label: 'Mirar como acción',
        tex: '\\p{1}{Q(b,\\text{mirar})}=\\p{2}{-c}+\\p{3}{\\sum_o P(o\\mid b)\\,V(b_o)}',
        parts: ['valor de mirar', 'costo del informe', 'decidir con lo visto'],
      },
    },
  ],
};

const DAYS = [0.05, 0.14, 0.22, 0.3, 0.38, 0.47, 0.56, 0.68, 0.81, 0.93];
const zoneOf = band(REPORT_COST)!;

function Investigation({ beats, unlock }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [marked, setMarked] = useState<number[]>([]);
  const [price, setPrice] = useState(0.4);
  const X = G.x;
  const onPrice = useSvgDrag(svg, (x) => {
    if (beat !== 2) return;
    const v = Math.round(clamp((x - 180) / 1140, 0, 2.2 / 2.2) * 2.2 * 20) / 20;
    setPrice(v);
    if (Math.abs(v - voi(0.38)) <= 0.1) unlock();
  });
  const right = DAYS.filter((b) => voi(b) > REPORT_COST);
  useEffect(() => {
    if (beat === 0 && marked.length === right.length && right.every((b) => marked.includes(b)))
      unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marked, beat]);
  return (
    <Stage ref={svg}>
      {beat <= 1 && (
        <>
          <Gain cost={REPORT_COST} />
          <Cap x={750} y={140} size={27}>
            Días con su creencia · el informe costó 1
          </Cap>
          <line x1={X(0)} x2={X(1)} y1={300} y2={300} stroke={C.dim} strokeWidth={4} />
          {zoneOf.map((b) => (
            <Line key={b} a={[X(b), 300]} b={[X(b), G.y(0)]} color={C.green} width={1.5} dashed />
          ))}
          {DAYS.map((b) => (
            <g
              key={b}
              style={{ cursor: beat === 0 ? 'pointer' : undefined }}
              onClick={() =>
                beat === 0 &&
                setMarked((m) => (m.includes(b) ? m.filter((x) => x !== b) : [...m, b]))
              }
            >
              <circle cx={X(b)} cy={300} r={34} fill="transparent" />
              <circle
                cx={X(b)}
                cy={300}
                r={16}
                fill={marked.includes(b) ? C.green : C.panel}
                stroke={C.green}
                strokeWidth={3}
              />
              <Cap x={X(b)} y={250} size={22} color={C.muted}>
                {fmt(b)}
              </Cap>
            </g>
          ))}
        </>
      )}
      {beat === 1 && (
        <Cap x={750} y={370} size={25} color={C.amber}>
          facturas de la cuenta:{' '}
          {zoneOf &&
            DAYS.filter((b) => b > zoneOf[0] && b < zoneOf[1])
              .map((b) => fmt(b))
              .join(' · ')}
        </Cap>
      )}
      {beat >= 2 && (
        <>
          <Cap x={750} y={200} size={28}>
            ¿Cuánto habría pagado la cuenta, como máximo, con b = 0,38?
          </Cap>
          <line x1={180} x2={1320} y1={420} y2={420} stroke={C.dim} strokeWidth={4} />
          {[0, 0.5, 1, 1.5, 2].map((t) => (
            <Cap key={t} x={180 + (t / 2.2) * 1140} y={462} size={24} color={C.muted}>
              {fmt(t, 1)}
            </Cap>
          ))}
          <Knob
            x={180 + (price / 2.2) * 1140}
            y={420}
            color={C.amber}
            onPointerDown={onPrice}
            cursor="ew-resize"
            label={fmt(price)}
          />
          <Cap x={750} y={560} size={26} tex="\text{VI}(b)=5{,}8\,b-0{,}4\quad(0{,}07<b<0{,}4)" />
        </>
      )}
      {beat === 3 && (
        <Cap x={750} y={680} size={27} color={C.magenta}>
          Empresa de las facturas: Torre Halcón, piso 40
        </Cap>
      )}
    </Stage>
  );
}

function Practice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 467 + round);
    return {
      b: pick(r, [0.2, 0.25, 0.3, 0.35, 0.45, 0.5, 0.55]),
      cost: pick(r, [0.5, 1, 1.5, 2]),
      wide: pick(r, [0.1, 0.2, 0.3, 0.5, 0.65, 0.8]),
    };
  }, [seed, round]);
  const b = round === 2 ? d.wide : d.b;
  const a = after(b);
  const gain = voi(b);
  const [up, setUp] = useState('');
  const [down, setDown] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const options = { mirar: -d.cost + a.mean, esperar: -10 * b, calmar: -4 };
  const best = (Object.keys(options) as (keyof typeof options)[]).reduce((x, y) =>
    options[y] > options[x] ? y : x,
  );

  useEffect(() => {
    setUp('');
    setDown('');
    setChoice(null);
    if (round === 0) {
      api.prompt(
        `El informe acierta con 0,9 y la creencia es $b=${tnum(b, 2)}$. Calcula las dos creencias posibles.`,
        'b_+=\\frac{0{,}9\\,b}{0{,}9\\,b+0{,}1\\,(1-b)}',
      );
      api.hints([
        '$b_-$ usa las probabilidades de un negativo: 0,1 si hay rumor y 0,9 si hay calma.',
        `$P(+)=${tnum(a.pos, 3)}$, $b_+=${tnum(a.up, 3)}$, $b_-=${tnum(a.down, 3)}$.`,
      ]);
    } else if (round === 1) {
      api.prompt(
        `Con $b=${tnum(b, 2)}$, $P(+)=${tnum(a.pos, 3)}$, $b_+=${tnum(a.up, 3)}$ y $b_-=${tnum(a.down, 3)}$, calcula el valor de la información. Recuerda que $V_1(b)=\\max(-10b,\\,-4)$.`,
        '\\text{VI}(b)=\\sum_o P(o)\\,V_1(b_o)-V_1(b)',
      );
      api.hints([
        `$V_1(b_+)=${tnum(v1(a.up), 2)}$, $V_1(b_-)=${tnum(v1(a.down), 2)}$, $V_1(b)=${tnum(v1(b), 2)}$.`,
        `El promedio es $${tnum(a.mean, 2)}$ y la ganancia, $${tnum(gain, 2)}$.`,
      ]);
    } else {
      api.prompt(
        `Creencia $b=${tnum(b, 2)}$ e informe a costo ${fmt(d.cost, 1)}. ¿Qué conviene hacer hoy?`,
        'Q(b,\\text{mirar})=-c+\\sum_o P(o)\\,V_1(b_o)',
      );
      api.hints([
        `Mirar vale $-${tnum(d.cost, 1)}+(${tnum(a.mean, 2)})=${tnum(options.mirar, 2)}$.`,
        `Esperar vale $${tnum(options.esperar, 2)}$ y calmar $-4$.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, d]);

  const submit = () => {
    const near = (t: string, x: number, tol = 0.02) => {
      const n = parseNum(t);
      return n !== null && Math.abs(n - x) <= tol;
    };
    if (round === 0) {
      if (near(up, a.up) && near(down, a.down))
        return api.result(
          true,
          `$b_+=${tnum(a.up, 3)}$ y $b_-=${tnum(a.down, 3)}$. Ya sabes adónde puede llevarte el informe.`,
        );
      if (near(up, 0.9 * b))
        return api.result(
          false,
          'Falta dividir por $P(+)$: sin normalizar no es una probabilidad.',
        );
      if (near(up, a.down) && near(down, a.up))
        return api.result(false, 'Están al revés: un positivo sube la creencia en rumor.');
      return api.result(
        false,
        near(up, a.up)
          ? 'Revisa $b_-$: un negativo ocurre con 0,1 si hay rumor y 0,9 si hay calma.'
          : 'Revisa $b_+$: numerador $0{,}9\\,b$, denominador $P(+)$.',
      );
    }
    if (round === 1) {
      if (near(up, gain))
        return api.result(
          true,
          `$\\text{VI}=${tnum(gain, 2)}$: eso vale la señal antes de conocerla.`,
        );
      if (near(up, a.mean))
        return api.result(
          false,
          'Ese es el promedio de $V_1$. Falta restar el valor de decidir ahora.',
        );
      if (near(up, a.pos * v1(a.up) + (1 - a.pos) * v1(a.down) + v1(b)))
        return api.result(false, 'Se resta $V_1(b)$; lo sumaste.');
      return api.result(
        false,
        'Calcula $V_1$ en cada creencia, promedia con $P(+)$ y resta $V_1(b)$.',
      );
    }
    if (!choice) return api.result(false, 'Elige una opción.');
    const line = `Mirar $${tnum(options.mirar, 2)}$, esperar $${tnum(options.esperar, 2)}$, calmar $-4$.`;
    if (choice === best)
      return api.result(
        true,
        `${line} ${best === 'mirar' ? 'La señal vale más de lo que cuesta.' : 'El informe no paga: la decisión ya está clara o sale muy caro.'}`,
      );
    return api.result(false, `${line} Se elige la acción de mayor valor.`);
  };

  return (
    <Stage>
      <Value b={b} />
      <Cap x={1385} y={150} size={28} tex={`b=${tnum(b, 2)}`} />
      {round === 0 && (
        <>
          <NumberField x={420} y={540} value={up} onChange={setUp} label="b₊ =" />
          <NumberField
            x={420}
            y={640}
            value={down}
            onChange={setDown}
            onEnter={submit}
            label="b₋ ="
          />
        </>
      )}
      {round === 1 && (
        <NumberField x={480} y={560} value={up} onChange={setUp} onEnter={submit} label="VI =" />
      )}
      {round === 2 && (
        <Choices
          x={700}
          y={560}
          options={['mirar', 'esperar', 'calmar']}
          value={choice}
          onPick={setChoice}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c12',
  world: 'decision',
  code: '13.12',
  title: 'Mirar antes de actuar',
  subtitle: 'Valor de la información en un POMDP',
  glyph: '\\text{VI}(b)',
  kind: 'level',
  guide: 'valentina',
  teaser:
    'La cuenta pagó informes algunos días y otros no. Las facturas dicen más que las compras.',
  learn:
    'Cuánto vale una señal antes de conocerla, por qué depende de la creencia y cuándo conviene pagarla.',
  glyphs: ['dec-voi', 'dec-look'],
  pitfalls: [
    'La información vale solo si puede cambiar la acción.',
    'El valor se calcula antes de ver la señal: se promedia sobre sus resultados.',
    'El mayor valor está en el umbral, donde la decisión es más dudosa.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Teo dejó sobre el escritorio una carpeta delgada. Eran facturas, y todas tenían el mismo membrete, sin nombre, con una dirección en letra muy pequeña.',
        },
        { who: 'teo', text: 'Una por día, por un informe de mercado. Pero no todos los días.' },
        {
          who: 'iris',
          text: 'Es curioso. Alguien que paga por información y a veces decide no pagar.',
        },
        {
          who: 'valentina',
          text: 'Si sabe lo que cuesta equivocarse, también sabe cuándo le sobra saber más.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Las facturas',
      Scene: Investigation,
      beats: [
        {
          say: 'Aquí están los diez días y sus creencias. Valentina quiere identificar cuándo el informe valía más que su costo de 1, antes de cruzar esos días con las facturas.',
          gate: 'Marca todos los días en que el informe vale más de lo que cuesta. Compara la curva de abajo con la línea roja.',
          after:
            'Son los días con $b=0{,}3$, $0{,}38$, $0{,}47$ y $0{,}56$: ahí el valor supera el costo de 1. Fuera de esa franja, la mejora esperada no alcanza a cubrirlo.',
          note: {
            label: 'Cuándo comprar el informe',
            tex: '\\text{VI}(b)>c',
            body: 'Con $c=1$: $b$ entre 0,24 y 0,62.',
          },
        },
        {
          say: 'Teo cruza tus marcas con las facturas, una por una. Quiere saber qué revela la coincidencia sobre la cuenta.',
          ask: {
            prompt: '¿Qué significa que las facturas calcen con esos días?',
            options: [
              'La cuenta paga por información solo cuando puede cambiar su decisión',
              'La cuenta compra informes al azar',
              'La cuenta paga informes todos los días',
            ],
            answer: 0,
            explain:
              'Paga exactamente donde la señal puede cambiar la acción. Eso exige conocer los costos, la precisión del informe y la propia creencia.',
          },
        },
        {
          say: 'La última factura es del día con $b=0{,}38$. Valentina quiere calcular cuánto habría aceptado pagar la cuenta como máximo por ese informe.',
          gate: 'Calcula con la fórmula el valor del informe para ese día y ubica en la regla el precio máximo que justificaría pagarlo.',
          after:
            'Con $b=0{,}38$: $5{,}8\\cdot0{,}38-0{,}4=1{,}804$, aproximadamente 1,80. La factura dice 1,80: el vendedor conocía la cuenta tanto como ella misma.',
          note: { label: 'Precio máximo', tex: '\\text{VI}(0{,}38)\\approx1{,}80' },
        },
        {
          say: 'Valentina da vuelta la última factura y acerca la letra pequeña a la luz. La dirección permite identificar a la empresa que vendió los informes.',
          note: {
            label: 'Las facturas',
            body: 'Todas salen de Torre Halcón, piso 40: quien vendía los informes era la misma cuenta que los compraba.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Mirar o actuar', Comp: Practice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina ordenó las facturas por fecha y las dejó bajo la lámpara. Eran pocas. Había mucho dinero en cada una.',
        },
        {
          who: 'valentina',
          text: 'La misma dirección de la cuenta. Se vendía los informes a sí misma.',
        },
        {
          who: 'iris',
          text: 'Entonces nunca necesitó comprarlos. Solo necesitaba que el pago quedara registrado.',
        },
        { who: 'tu', text: 'Y que cada pago cayera el día correcto.' },
        {
          who: 'valentina',
          text: 'Con esto la comisión me escucha. Antes del cierre quiero el registro completo.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-voi',
    world: 'decision',
    tex: '\\text{VI}(b)',
    name: 'Valor de la información',
    read: 've i de be',
    meaning: 'Mejora esperada de decidir tras ver una señal, respecto de decidir ahora.',
  },
  {
    id: 'dec-look',
    world: 'decision',
    tex: 'Q(b,\\text{mirar})',
    name: 'Valor de mirar',
    read: 'cu de be y mirar',
    meaning: 'Valor de pedir una señal: su costo más lo que se espera decidir con ella.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Acción de información',
      body: 'Acción que no cambia el estado y cambia la creencia.',
    },
    {
      label: 'Valor de la información',
      tex: '\\text{VI}(b)=\\sum_o P(o\\mid b)\\,V_1(b_o)-V_1(b)',
    },
  ],
  props: [
    {
      label: 'No negativo',
      tex: '\\text{VI}(b)\\ge0',
      body: 'Por la convexidad de $V_1$: saber más no empeora una decisión óptima.',
    },
    {
      label: 'Regla',
      body: 'Vale 0 si ningún resultado cambia la acción. Es mayor cerca del umbral.',
    },
    { label: 'Cuándo mirar', tex: '\\text{VI}(b)>c' },
    {
      label: 'Relación con EVPI',
      body: 'El EVPI de 13.3 es el caso de una señal perfecta: la cota superior de VI.',
    },
  ],
};
