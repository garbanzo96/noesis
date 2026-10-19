import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Surface, dbl, num, ortho, type Field } from './kit';

const sum: Field = (x, y) => x + y;
const rain: Field = (x) => 4 + x;
const COUNTS = [2, 4, 16, 64];
// Encuadre: el bloque [0,2]×[0,1]×[0,3] ocupa x≈280–850 e y≈210–685 del escenario.
const CAMERA = ortho({
  cx: 280,
  cy: 520,
  scale: 260,
  zScale: 0.55,
  azimuth: -0.65,
  xr: [0, 2],
  yr: [0, 1],
});
const BASIN = plane([0, 3], [0, 2], { x: 310, y: 260, w: 600, h: 400 });

/** Midpoint columns; each height is multiplied by its own rectangular base area. */
function Columns({ count }: { count: number }) {
  const nx = count === 2 ? 2 : Math.sqrt(count),
    ny = count / nx;
  const dx = 2 / nx,
    dy = 1 / ny;
  const cells = Array.from({ length: count }, (_, k) => {
    const i = Math.floor(k / ny),
      j = k % ny;
    const x = i * dx,
      y = j * dy,
      z = sum(x + dx / 2, y + dy / 2);
    const face = (points: [number, number, number][]) =>
      points.map((p) => CAMERA(...p).join(',')).join(' ');
    return {
      k,
      depth: Math.sin(-0.65) * x + Math.cos(-0.65) * y,
      top: face([
        [x, y, z],
        [x + dx, y, z],
        [x + dx, y + dy, z],
        [x, y + dy, z],
      ]),
      front: face([
        [x, y, 0],
        [x + dx, y, 0],
        [x + dx, y, z],
        [x, y, z],
      ]),
      side: face([
        [x + dx, y, 0],
        [x + dx, y + dy, 0],
        [x + dx, y + dy, z],
        [x + dx, y, z],
      ]),
    };
  }).sort((a, b) => b.depth - a.depth);
  return (
    <>
      {cells.map(({ k, top, front, side }) => (
        <g key={k} stroke={C.amber} strokeWidth={1.2}>
          <polygon points={front} fill={C.panel} />
          <polygon points={side} fill={C.amber} fillOpacity={0.15} />
          <polygon points={top} fill={C.amber} fillOpacity={0.35} />
        </g>
      ))}
    </>
  );
}

function RainLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState(0);
  const visited = useRef(new Set([0]));
  const onCount = useSvgDrag(svg, (x) => {
    const next = Math.round(clamp((x - 1070) / 120, 0, 3));
    // Record every subdivision crossed, including when a fast drag skips a tick.
    for (let k = Math.min(index, next); k <= Math.max(index, next); k++) visited.current.add(k);
    setIndex(next);
    if (next === 3 && visited.current.size === 4) unlock();
  });
  const { beat } = beats;
  const count = beat === 0 ? COUNTS[index] : 64;
  return (
    <Stage ref={svg}>
      <Columns count={count} />
      <Surface f={sum} P3={CAMERA} color={C.cyan} n={12} opacity={0.5} />
      <Cap x={650} y={165} tex="z=x+y" color={C.cyan} />
      <Cap x={650} y={730} tex="R=[0,2]\times[0,1]" />
      <Cap x={1240} y={225} color={C.amber}>
        {count} columnas
      </Cap>
      {beat === 0 && (
        <>
          <line x1={1070} x2={1430} y1={430} y2={430} stroke={C.line} strokeWidth={3} />
          {COUNTS.map((n, i) => (
            <Cap key={n} x={1070 + 120 * i} y={485} size={18}>
              {n}
            </Cap>
          ))}
          <Knob x={1070 + 120 * index} y={430} onPointerDown={onCount} axis="x" color={C.amber} />
          <Cap x={1240} y={580} size={19}>
            Arrastra hasta 64 columnas.
          </Cap>
        </>
      )}
      {beat === 1 && (
        <>
          <Cap x={1240} y={330} tex="\Delta A=\Delta x\,\Delta y" color={C.magenta} />
          <Cap x={1240} y={425} tex={`S=${num(dbl(sum, 0, 2, 0, 1, 8))}`} color={C.amber} />
          <Cap x={1240} y={535} size={19}>
            Altura por base; después suma.
          </Cap>
        </>
      )}
      {beat >= 2 && (
        <>
          <Cap x={1240} y={325} tex="\int_0^1(x+y)\,dy=x+\tfrac12" color={C.magenta} />
          {(beat > 2 || answer !== null) && (
            <Cap x={1240} y={435} tex="\int_0^2(x+\tfrac12)\,dx=3" color={C.amber} />
          )}
        </>
      )}
      {beat >= 3 && <Cap x={1240} y={555} tex="f_{\mathrm{med}}=\tfrac32=1{,}5" color={C.green} />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Integrales dobles',
  Scene: RainLesson,
  beats: [
    {
      say: 'Mira las columnas bajo la superficie: cada una aporta altura por área de su base. Aumenta la cantidad para que sus techos sigan mejor la superficie.',
      gate: 'Arrastra la perilla por 2, 4, 16 y 64 columnas.',
      board: {
        label: 'Una columna',
        tex: '\\p{1}{\\Delta V}=\\p{2}{\\cC{f(x_i,y_j)}}\\,\\p{3}{\\cA{\\Delta x}}\\,\\p{4}{\\cM{\\Delta y}}',
        parts: ['volumen de una columna', 'altura de la columna', 'ancho de la base', 'largo de la base'],
      },
    },
    {
      say: 'Al afinar ambas divisiones, la suma se convierte en una **integral doble**. Para una altura no negativa, mide el volumen bajo la superficie.',
      dur: 3,
      board: {
        label: 'Suma de Riemann doble',
        tex: '\\begin{aligned}\\p{1}{\\iint_R f\\,dA}&=\\p{2}{\\lim_{\\Delta x,\\Delta y\\to0}}\\\\&\\quad\\p{3}{\\sum_{i,j}f(x_i,y_j)\\,\\Delta x\\,\\Delta y}\\end{aligned}',
        body: 'En este ejemplo lineal, los puntos medios ya dan 3 con todas las divisiones; lo que mejora es la forma de las columnas.',
        parts: ['volumen bajo la superficie', 'columnas cada vez más finas', 'suma de volúmenes'],
      },
    },
    {
      say: 'Integra primero en y dejando x fija; queda x más un medio. El **teorema de Fubini** permite calcular la integral por estas integrales iteradas.',
      ask: {
        prompt: '¿Cuánto vale $\\int_0^2(x+\\tfrac12)\\,dx$?',
        options: ['3', '2', '4'],
        answer: 0,
        explain: '$[x^2/2+x/2]_0^2=2+1=3$. El 2 omite el aporte del término y.',
      },
      board: {
        label: 'Integrar por turnos',
        tex: '\\begin{aligned}\\p{1}{\\int_0^2\\!\\int_0^1(x+y)\\,dy\\,dx}\\\\=\\p{2}{\\int_0^2(x+\\tfrac12)\\,dx}\\end{aligned}',
        parts: ['volumen que buscamos', 'tras sumar franjas al norte'],
      },
    },
    {
      say: 'Divide el total por el área del rectángulo y obtienes el **valor medio**. Aquí el área es 2 y la altura media es 1,5.',
      dur: 3,
      board: {
        label: 'Valor medio',
        tex: '\\p{1}{f_{\\mathrm{med}}}=\\p{2}{\\frac{1}{\\operatorname{área}(R)}\\iint_R f\\,dA}=\\p{3}{\\cA{\\tfrac32}}',
        parts: ['altura media que buscamos', 'volumen dividido por área', 'altura media del terreno'],
      },
    },
    {
      say: 'En un rectángulo, suma por franjas en cualquiera de los dos órdenes. Si buscas un promedio, divide después por el área.',
      dur: 3,
      board: [
        {
          label: 'Fubini en un rectángulo',
          tex: '\\begin{aligned}\\p{1}{\\iint_R f\\,dA}&=\\p{2}{\\int_a^b\\!\\int_c^d f\\,dy\\,dx}\\\\&=\\p{3}{\\int_c^d\\!\\int_a^b f\\,dx\\,dy}\\end{aligned}',
          body: 'Para f continua sobre $R=[a,b]\\times[c,d]$.',
          parts: ['total sobre la región', 'sumar primero al norte', 'sumar primero al este'],
        },
        {
          label: 'Promedio sobre la región',
          tex: '\\p{1}{f_{\\mathrm{med}}}=\\p{2}{\\frac{\\iint_R f\\,dA}{(b-a)(d-c)}}',
          parts: ['altura media que buscamos', 'total dividido por área'],
        },
      ],
    },
  ],
};

function WaterDemo({ beats, answer }: DemoProps) {
  const show = answer !== null;
  return (
    <Stage>
      <Axes
        P={BASIN}
        xTicks={[0, 1, 2, 3]}
        yTicks={[1, 2]}
        xLabel="\text{este (km)}"
        yLabel="\text{norte (km)}"
      />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={BASIN.x(i)}
            y={BASIN.y(2)}
            width={BASIN.sx}
            height={2 * BASIN.sy}
            fill={C.cyan}
            fillOpacity={0.12 + i * 0.12}
            stroke={C.cyan}
          />
          <Cap
            x={BASIN.x(i + 0.5)}
            y={BASIN.y(1)}
            tex={`${num(rain(i + 0.5, 1))}\\,\\mathrm{mm/h}`}
            color={C.cyan}
          />
        </g>
      ))}
      <Cap x={610} y={175}>
        Cuenca de la quebrada Jaime
      </Cap>
      <Cap x={1230} y={230} tex="r(x,y)=4+x\;\mathrm{mm/h}" color={C.cyan} />
      <Cap x={1230} y={320} tex="R=[0,3]\times[0,2]\;\mathrm{km^2}" size={20} />
      {beats.beat === 0 && show && (
        <Cap x={1230} y={445} tex="I=24+9=33\;\mathrm{mm\,km^2/h}" color={C.amber} size={21} />
      )}
      {beats.beat >= 1 && (
        <>
          <Cap x={1230} y={410} tex="I=33\;\mathrm{mm\,km^2/h}" color={C.amber} />
          <Cap
            x={1230}
            y={510}
            tex="1\;\mathrm{mm\,km^2}=1\,000\;\mathrm{m^3}"
            size={20}
            color={C.magenta}
          />
          {show && (
            <Cap
              x={1230}
              y={610}
              tex="V=3\cdot33\cdot1\,000=99\,000\;\mathrm{m^3}"
              size={20}
              color={C.green}
            />
          )}
        </>
      )}
    </Stage>
  );
}

function RainPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 101 + round);
    const a = randInt(r, 1, 4),
      b = randInt(r, 1, 3),
      c = randInt(r, 1, 4);
    const X = randInt(r, 1, 4),
      Y = randInt(r, 1, 3);
    const power = round === 0 ? 1 : 2;
    const integral =
      (a * X ** (power + 1) * Y) / (power + 1) +
      (b * X * Y ** 2) / 2 +
      (round === 0 ? 0 : c * X * Y);
    return {
      a,
      b,
      c,
      X,
      Y,
      power,
      integral,
      area: X * Y,
      tex: `${a === 1 ? '' : a}x${power === 2 ? '^2' : ''}+${b === 1 ? '' : b}y${round === 0 ? '' : `+${c}`}`,
    };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      `Para $f=${d.tex}$ sobre $R=[0,${d.X}]\\times[0,${d.Y}]$, ` +
        (round === 2
          ? 'calcula el valor medio (dos decimales).'
          : 'calcula la integral doble (dos decimales si hace falta).'),
      `\\int_0^{${d.X}}\\!\\int_0^{${d.Y}}(${d.tex})\\,dy\\,dx`,
    );
    api.hints([
      'Integra en y: los términos que dependen solo de x son constantes.',
      round === 2
        ? `Integra después en x y divide por el área ${d.area}.`
        : 'En x, aumenta el exponente en uno y divide por el nuevo exponente.',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const target = round === 2 ? d.integral / d.area : d.integral;
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (Math.abs(v - target) < 0.011)
      return api.result(
        true,
        round === 2
          ? `$f_{\\mathrm{med}}=\\tfrac{${num(d.integral)}}{${d.area}}\\approx${num(target)}$.`
          : `$\\iint_R f\\,dA=${num(target)}$.`,
      );
    if (round === 2 && d.area !== 1 && Math.abs(v - d.integral) < 0.011)
      return api.result(
        false,
        'Ese es el total. Para el valor medio, divide por el área del rectángulo.',
      );
    return api.result(
      false,
      `La integral interior es $${d.a * d.Y}x${d.power === 2 ? '^2' : ''}+${num((d.b * d.Y ** 2) / 2 + (round === 0 ? 0 : d.c * d.Y))}$. Integra eso en x${round === 2 ? ' y divide por el área' : ''}.`,
    );
  };
  const maxHeight = d.a * d.X ** d.power + d.b * d.Y + (round === 0 ? 0 : d.c);
  const P3 = ortho({
    cx: 500,
    cy: 590,
    scale: 90,
    zScale: Math.min(0.2, 3 / maxHeight),
    xr: [0, d.X],
    yr: [0, d.Y],
  });
  return (
    <Stage>
      <Surface f={(x, y) => d.a * x ** d.power + d.b * y + (round === 0 ? 0 : d.c)} P3={P3} />
      <Cap x={650} y={170} tex={`f=${d.tex}`} />
      <Cap x={650} y={700} tex={`R=[0,${d.X}]\\times[0,${d.Y}]`} color={C.magenta} />
      <NumberField
        x={1040}
        y={400}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 2 ? 'valor medio =' : 'integral ='}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-c7',
  world: 'multivariate',
  code: '7.7',
  title: 'La lluvia',
  subtitle: 'Integrales dobles',
  glyph: '\\iint_R f\\,dA',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'La lluvia cubre toda la cuenca de la quebrada. Hay que calcular cuánta agua caerá antes de bajar por el dron.',
  learn:
    'Construir una integral doble con columnas, calcular integrales iteradas y hallar el valor medio sobre una región.',
  glyphs: ['mv-double', 'mv-average'],
  pitfalls: [
    'Cada altura se multiplica por el área de su base.',
    'En una integral iterada, la otra variable queda fija.',
    'El valor medio es la integral dividida por el área.',
    'La lluvia del modelo es agua caída en la cuenca; no todo ese volumen llega de inmediato a la quebrada.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'En el borde de la quebrada, el agua se junta en el pliegue del mapa. Tomás lo sacude lejos de la radio.',
        },
        {
          who: 'teo',
          text: 'El pronóstico trae una intensidad distinta para cada zona. Si uso una sola lectura, dejo media cuenca fuera.',
        },
        {
          who: 'tomas',
          text: 'Necesito el total de las próximas tres horas. Cuando el agua suba, la cuerda va a tener menos lugares donde apoyarse.',
        },
        { who: 'iris', text: 'Calcula cuánto cae. El chip sigue abajo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Agua en la quebrada',
      Scene: WaterDemo,
      beats: [
        {
          say: 'La intensidad $r=4+x$ mm/h se mantiene durante tres horas sobre la cuenca de 3 por 2 km. Suma la lluvia de todas sus franjas.',
          ask: {
            prompt: '¿Cuánto vale $\\iint_R(4+x)\\,dA$?',
            options: ['33 mm·km²/h', '24 mm·km²/h', '9 mm·km²/h'],
            answer: 0,
            explain:
              '$\\int_0^3\\!\\int_0^2(4+x)\\,dy\\,dx=\\int_0^3(8+2x)\\,dx=24+9=33$. Ambos términos aportan lluvia.',
          },
          note: {
            label: 'Lluvia por hora sobre la cuenca',
            tex: '\\iint_R(4+x)\\,dA=33\\;\\mathrm{mm\\,km^2/h}',
          },
        },
        {
          say: 'Un milímetro sobre un kilómetro cuadrado equivale a 1 000 m³. Multiplica por las tres horas y convierte el volumen a metros cúbicos.',
          ask: {
            prompt: '¿Cuánta agua caerá en tres horas?',
            options: ['99 000 m³', '33 000 m³', '99 m³'],
            answer: 0,
            explain:
              '$V=3\\cdot33\\cdot1\\,000=99\\,000$ m³. El 33 000 cuenta solo una hora; el 99 omite la conversión de unidades.',
          },
          note: {
            label: 'Volumen de lluvia',
            tex: 'V=3\\cdot33\\cdot1\\,000=99\\,000\\;\\mathrm{m^3}',
            body: 'Agua que cae sobre la cuenca; el caudal en la quebrada depende también de la infiltración y del tiempo de escurrimiento.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Sumar la lluvia', Comp: RainPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Una piedra suelta golpea el fondo. Tomás deja de enrollar la cuerda hasta que termina el ruido.',
        },
        {
          who: 'teo',
          text: '99 000 metros cúbicos sobre la cuenca en tres horas. No llegan todos de golpe, pero la lluvia ya cubre el acceso.',
        },
        {
          who: 'tomas',
          text: 'Entonces necesito achicar la búsqueda. La linterna no alcanza de un borde al otro.',
        },
        { who: 'tu', text: 'La señal tiene una zona más probable. Podemos ponerle un radio.' },
        { who: 'iris', text: 'La piedra sí llegó de golpe.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-double',
    world: 'multivariate',
    tex: '\\iint_R f\\,dA',
    name: 'Integral doble',
    read: 'integral doble de efe sobre erre',
    meaning:
      'Suma los aportes f por área sobre una región del plano; con f no negativa puede representar un volumen.',
  },
  {
    id: 'mv-average',
    world: 'multivariate',
    tex: 'f_{\\mathrm{med}}=\\frac{\\iint_R f\\,dA}{\\operatorname{área}(R)}',
    name: 'Valor medio sobre una región',
    read: 'efe medio',
    meaning: 'Total acumulado dividido por el área de la región, que debe ser positiva.',
  },
];
