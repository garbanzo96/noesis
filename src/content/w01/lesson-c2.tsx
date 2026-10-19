import { useRef, useState } from 'react';
import { clamp, lerp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, Token, mix } from '../shared/lesson';
import { Knob, dec } from '../shared/ui';

// Clase 1.2 · Funciones y gráficas: la máquina, la tabla, el diagrama de flechas, la gráfica,
// la prueba de la recta vertical, dominio e imagen, crecimiento y desigualdades leídas en el gráfico.

const sq = (x: number) => x * x;
const P = plane([-3.5, 3.5], [-1, 10], { x: 380, y: 110, w: 840, h: 600 });
const XS = [-2, -1, 0, 1, 2, 3];

function Machine({
  x,
  y,
  label = 'f',
  glow = 0,
}: {
  x: number;
  y: number;
  label?: string;
  glow?: number;
}) {
  return (
    <g>
      <rect
        x={x - 130}
        y={y - 90}
        width={260}
        height={180}
        rx={16}
        fill="#0f1c22"
        stroke={C.cyan}
        strokeWidth={4}
      />
      <rect
        x={x - 130}
        y={y - 90}
        width={260}
        height={180}
        rx={16}
        fill={C.cyan}
        opacity={0.15 * glow}
      />
      <path
        d={`M${x - 130} ${y - 30} L${x - 160} ${y - 30} L${x - 160} ${y + 30} L${x - 130} ${y + 30}`}
        fill="none"
        stroke={C.cyan}
        strokeWidth={3}
      />
      <path
        d={`M${x + 130} ${y - 30} L${x + 160} ${y - 30} L${x + 160} ${y + 30} L${x + 130} ${y + 30}`}
        fill="none"
        stroke={C.cyan}
        strokeWidth={3}
      />
      <Cap x={x} y={y - 10} size={52} color={C.cyan} tex={label} />
      <Cap x={x} y={y + 50} size={20} color={C.muted} tex="x\mapsto x^2" />
    </g>
  );
}

function FunctionsLesson({ beats, unlock }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(-3);
  const [reach, setReach] = useState(-3);
  const onX = useSvgDrag(svg, (px) => {
    const v = Math.round(clamp(P.inv(px, 0)[0], -3, 3) * 10) / 10;
    setX(v);
    setReach((r) => Math.max(r, v));
    if (v >= 2.95) unlock();
  });

  if (beat <= 1) {
    const t = beat === 0 ? at(0) : 1;
    const inP = mix([260, 420], [640, 420], clamp(t / 0.4, 0, 1));
    const outP = mix([960, 420], [1340, 420], clamp((t - 0.6) / 0.4, 0, 1));
    return (
      <Stage>
        <Machine x={800} y={420} glow={t > 0.4 && t < 0.7 ? 1 : 0} />
        {beat === 0 && t < 0.45 && <Token x={inP[0]} y={inP[1]} label={3} color={C.amber} />}
        {beat === 0 && t > 0.6 && <Token x={outP[0]} y={outP[1]} label={9} color={C.green} />}
        <Cap x={260} y={330} size={22} color={C.amber}>
          entrada
        </Cap>
        <Cap x={1340} y={330} size={22} color={C.green}>
          salida
        </Cap>
        <Group opacity={at(1)}>
          {XS.map((v, i) => {
            const show = clamp(at(1) * 7 - i, 0, 1);
            return (
              <g key={v} opacity={show}>
                <Cap x={560 + i * 100} y={640} size={26} color={C.amber} tex={String(v)} />
                <Cap x={560 + i * 100} y={700} size={26} color={C.green} tex={String(sq(v))} />
              </g>
            );
          })}
          <Cap x={470} y={640} size={24} color={C.amber} tex="x" anchor="right" />
          <Cap x={470} y={700} size={24} color={C.green} tex="f(x)" anchor="right" />
        </Group>
      </Stage>
    );
  }
  if (beat === 2) {
    const A: [number, number][] = XS.map((_, i) => [460, 200 + i * 95]);
    const outs = [0, 1, 4, 9, 7];
    const B: Record<number, [number, number]> = Object.fromEntries(
      outs.map((v, i) => [v, [1140, 250 + i * 110] as [number, number]]),
    );
    const t = at(2);
    return (
      <Stage>
        <ellipse cx={460} cy={440} rx={120} ry={320} fill="none" stroke={C.amber} strokeWidth={3} />
        <ellipse
          cx={1140}
          cy={470}
          rx={120}
          ry={300}
          fill="none"
          stroke={C.green}
          strokeWidth={3}
        />
        <Cap x={460} y={95} size={26} color={C.amber} tex="A" />
        <Cap x={1140} y={140} size={26} color={C.green} tex="B" />
        {XS.map((v, i) => (
          <g key={v}>
            <Token x={A[i][0]} y={A[i][1]} label={v} r={26} color={C.amber} />
            <Arrow
              from={[A[i][0] + 30, A[i][1]]}
              to={[B[sq(v)][0] - 32, B[sq(v)][1]]}
              color={C.cyan}
              width={2.5}
              progress={clamp(t * 1.5 - i * 0.1, 0, 1)}
            />
          </g>
        ))}
        {outs.map((v) => (
          <Token key={v} x={B[v][0]} y={B[v][1]} label={v} r={26} color={C.green} />
        ))}
        <Cap x={800} y={800} size={20} color={C.muted}>
          −2 y 2 van al mismo 4: eso está permitido. Una entrada con dos salidas, no.
        </Cap>
      </Stage>
    );
  }
  if (beat === 3) {
    const pts = XS.filter((v) => v <= 3);
    return (
      <Stage ref={svg}>
        <Axes
          P={P}
          xTicks={[-3, -2, -1, 1, 2, 3]}
          yTicks={[2, 4, 6, 8, 10]}
          xLabel="x"
          yLabel="y"
          grid
        />
        {pts.map((v, i) => {
          const p = mix([1400, 160 + i * 60], P.pt(v, sq(v)), clamp(at(3) * 1.6 - i * 0.12, 0, 1));
          return <Dot key={v} x={p[0]} y={p[1]} r={8} color={C.amber} />;
        })}
        <Curve P={P} f={sq} a={-3} b={Math.max(-2.99, reach)} color={C.cyan} width={4} />
        <Line a={P.pt(x, 0)} b={P.pt(x, sq(x))} color={C.text} dashed />
        <Dot x={P.x(x)} y={P.y(sq(x))} r={10} color={C.text} />
        <Cap
          x={P.x(x) + 16}
          y={P.y(sq(x)) - 24}
          size={20}
          color={C.text}
          anchor="left"
          tex={`(${dec(x, 1)},\\ ${dec(sq(x), 2)})`}
        />
        <rect
          x={P.x(-3.5)}
          y={P.y(0) - 10}
          width={P.box.w}
          height={60}
          fill="transparent"
          onPointerDown={onX}
        />
        <Knob x={P.x(x)} y={P.y(0) + 30} onPointerDown={onX} cursor="ew-resize" label="x" />
      </Stage>
    );
  }
  if (beat === 4) {
    const sx = lerp(-3, 3, at(4));
    const Q = plane([-3.5, 3.5], [-3.5, 3.5], { x: 860, y: 140, w: 520, h: 520 });
    const L = plane([-3.5, 3.5], [-1, 10], { x: 200, y: 140, w: 520, h: 520 });
    const circ = Math.abs(sx) <= 2.5 ? Math.sqrt(6.25 - sx * sx) : null;
    return (
      <Stage>
        <Axes P={L} xTicks={[]} yTicks={[]} />
        <Curve P={L} f={sq} a={-3.1} b={3.1} color={C.cyan} width={4} />
        <Line a={L.pt(sx, -1)} b={L.pt(sx, 10)} color={C.amber} width={2.5} />
        <Dot x={L.x(sx)} y={L.y(sq(sx))} r={9} color={C.green} />
        <Cap x={460} y={700} size={22} color={C.green}>
          función: un corte
        </Cap>
        <Axes P={Q} xTicks={[]} yTicks={[]} />
        <circle
          cx={Q.x(0)}
          cy={Q.y(0)}
          r={(2.5 * 520) / 7}
          fill="none"
          stroke={C.violet}
          strokeWidth={4}
        />
        <Line a={Q.pt(sx, -3.5)} b={Q.pt(sx, 3.5)} color={C.amber} width={2.5} />
        {circ !== null && (
          <>
            <Dot x={Q.x(sx)} y={Q.y(circ)} r={9} color={C.red} />
            <Dot x={Q.x(sx)} y={Q.y(-circ)} r={9} color={C.red} />
          </>
        )}
        <Cap x={1120} y={700} size={22} color={C.red}>
          no es función: dos cortes
        </Cap>
      </Stage>
    );
  }
  if (beat === 5) {
    const R = plane([-1, 10], [-1, 4], { x: 340, y: 120, w: 900, h: 560 });
    const t = at(5);
    return (
      <Stage>
        <Axes P={R} xTicks={[0, 1, 4, 9]} yTicks={[1, 2, 3]} xLabel="x" yLabel="y" grid />
        <Curve P={R} f={Math.sqrt} a={0} b={9} color={C.cyan} width={4} />
        <Dot x={R.x(0)} y={R.y(0)} r={7} color={C.cyan} />
        <Dot x={R.x(9)} y={R.y(3)} r={7} color={C.cyan} />
        <rect x={R.x(0)} y={R.y(0) + 14} width={(R.x(9) - R.x(0)) * t} height={10} fill={C.amber} />
        <rect
          x={R.x(0) - 26}
          y={R.y(3 * t)}
          width={10}
          height={R.y(0) - R.y(3 * t)}
          fill={C.green}
        />
        <Cap
          x={R.x(4.5)}
          y={R.y(0) + 50}
          size={22}
          color={C.amber}
          tex="\mathrm{Dom}=[0,9]"
          opacity={t}
        />
        <Cap
          x={R.x(0) - 40}
          y={R.y(1.5)}
          size={22}
          color={C.green}
          tex="\mathrm{Im}=[0,3]"
          anchor="right"
          opacity={t}
        />
        <Cap x={R.x(7)} y={R.y(3.4)} size={26} color={C.cyan} tex="f(x)=\sqrt x" />
      </Stage>
    );
  }
  if (beat === 6) {
    const g = (s: number) => 2 + 1.5 * Math.sin(s * 1.1) + 0.2 * s;
    const R = plane([0, 9], [0, 5], { x: 340, y: 120, w: 900, h: 560 });
    const peaks = [1.538, 4.174, 7.25];
    return (
      <Stage>
        <Axes P={R} xTicks={[0, 3, 6, 9]} yTicks={[1, 2, 3, 4]} xLabel="x" yLabel="y" grid />
        {[0, ...peaks, 9].slice(0, -1).map((a0, i) => {
          const b0 = [...peaks, 9][i];
          return (
            <Curve
              key={i}
              P={R}
              f={g}
              a={a0}
              b={b0}
              color={i % 2 === 0 ? C.green : C.red}
              width={5}
            />
          );
        })}
        <Group opacity={at(6)}>
          <Dot x={R.x(peaks[0])} y={R.y(g(peaks[0]))} r={10} color={C.amber} />
          <Cap x={R.x(peaks[0])} y={R.y(g(peaks[0])) - 30} size={18} color={C.amber}>
            máximo local
          </Cap>
          <Dot x={R.x(peaks[1])} y={R.y(g(peaks[1]))} r={10} color={C.violet} />
          <Cap x={R.x(peaks[1])} y={R.y(g(peaks[1])) + 34} size={18} color={C.violet}>
            mínimo local
          </Cap>
        </Group>
        <Cap x={1300} y={200} size={20} color={C.green} anchor="left">
          sube: crece
        </Cap>
        <Cap x={1300} y={240} size={20} color={C.red} anchor="left">
          baja: decrece
        </Cap>
      </Stage>
    );
  }
  const t = at(7);
  return (
    <Stage>
      <Axes
        P={P}
        xTicks={[-3, -2, -1, 1, 2, 3]}
        yTicks={[2, 4, 6, 8, 10]}
        xLabel="x"
        yLabel="y"
        grid
      />
      <Curve P={P} f={sq} a={-3.15} b={3.15} color={C.cyan} width={4} />
      <Line a={P.pt(-3.5, 4)} b={P.pt(3.5, 4)} color={C.amber} width={3} />
      <Cap x={P.x(3.5) + 14} y={P.y(4)} size={22} color={C.amber} tex="y=4" anchor="left" />
      <Group opacity={t}>
        <Curve P={P} f={sq} a={-3.15} b={-2} color={C.green} width={7} />
        <Curve P={P} f={sq} a={2} b={3.15} color={C.green} width={7} />
        <rect x={P.x(-3.5)} y={P.y(0) - 6} width={P.x(-2) - P.x(-3.5)} height={12} fill={C.green} />
        <rect x={P.x(2)} y={P.y(0) - 6} width={P.x(3.5) - P.x(2)} height={12} fill={C.green} />
        <Dot x={P.x(-2)} y={P.y(0)} r={9} color={C.green} />
        <Dot x={P.x(2)} y={P.y(0)} r={9} color={C.green} />
      </Group>
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Funciones y gráficas',
  intro: {
    question: '¿Cómo se describe una cantidad que depende de otra?',
    text: 'Seguimos en precálculo. Una función asigna a cada entrada exactamente una salida, y su gráfica permite ver de un vistazo cómo cambia. El mareógrafo del muelle 3 es una función: a cada minuto del día le corresponde una altura del mar.',
  },
  Scene: FunctionsLesson,
  beats: [
    {
      say: 'Una **función** es como una máquina: recibe una entrada $x$ y entrega una salida $f(x)$. Esta máquina eleva al cuadrado.',
      dur: 2.6,
      board: {
        label: 'Función',
        tex: 'f:\\p{1}{\\cA{A}}\\to\\p{2}{\\cG{B}},\\qquad \\p{3}{x\\mapsto f(x)}',
        body: '$A$: entradas posibles. $B$: donde caen las salidas.',
        parts: ['entradas permitidas', 'conjunto de llegada', 'regla de asignación'],
      },
    },
    {
      say: 'Una función se puede describir con una **regla** o con una **tabla** de valores. Evaluar es reemplazar $x$ por un número.',
      dur: 2.6,
      board: [
        { label: 'Regla', tex: 'f(x)=x^2' },
        {
          label: 'Evaluar',
          tex: 'f(\\p{1}{\\cA{-2}})=(\\p{1}{\\cA{-2}})^2=\\p{2}{\\cG{4}}',
          parts: ['entrada elegida', 'salida calculada'],
        },
      ],
    },
    {
      say: 'Lo esencial: a cada entrada le corresponde **exactamente una** salida. Dos entradas pueden compartir salida; una entrada no puede tener dos.',
      ask: {
        prompt: '¿Cuál de estas reglas **no** define una función de los números en los números?',
        options: [
          'A cada x le asigna un y con $y^2=x$',
          'A cada x le asigna $x^2$',
          'A cada x le asigna 5',
        ],
        answer: 0,
        explain:
          'Para $x=4$ habría dos salidas, 2 y −2. Las otras dos dan una sola salida por entrada (aunque la constante 5 repite salidas).',
      },
      board: {
        label: 'Definición',
        tex: '\\p{1}{\\forall x\\in A}\\ \\p{2}{\\exists!\\ y\\in B}:\\ \\p{3}{y=f(x)}',
        body: 'Se lee: para cada $x$ en $A$ existe un único $y$ en $B$ con $y=f(x)$.',
        parts: ['cada entrada posible', 'una única salida', 'salida de la función'],
      },
    },
    {
      say: 'La **gráfica** pone cada par $(x,f(x))$ como un punto del plano. Con todos los puntos aparece una curva.',
      gate: 'Recorre la curva arrastrando x desde −3 hasta 3.',
      board: {
        label: 'Gráfica',
        tex: '\\mathrm{graf}(f)=\\{\\p{1}{(x,\\ f(x))}:\\ \\p{2}{x\\in A}\\}',
        parts: ['punto de la gráfica', 'entrada del dominio'],
      },
    },
    {
      say: 'Una curva es la gráfica de una función si **toda recta vertical** la corta a lo más una vez. La circunferencia falla: un $x$, dos alturas.',
      dur: 3,
      board: {
        label: 'Recta vertical',
        body: 'Cada recta vertical corta la gráfica de una función en a lo más un punto.',
        tex: '\\p{1}{x}=\\p{2}{c\\ }\\Rightarrow\\p{3}{\\ \\text{un solo }y}',
        parts: ['posición horizontal', 'valor fijo', 'una única altura'],
      },
    },
    {
      say: 'El **dominio** son las entradas permitidas: la sombra de la gráfica sobre el eje $x$. La **imagen**, las salidas que ocurren: la sombra sobre el eje $y$.',
      dur: 2.6,
      board: [
        {
          label: 'Dominio',
          tex: '\\mathrm{Dom}(f)=\\p{1}{\\cA{[0,9]}}',
          parts: ['entradas permitidas'],
        },
        {
          label: 'Imagen',
          tex: '\\mathrm{Im}(f)=\\{f(x):x\\in\\mathrm{Dom}\\}=\\p{1}{\\cG{[0,3]}}',
          parts: ['salidas que ocurren'],
        },
      ],
    },
    {
      say: 'Donde la gráfica sube, la función **crece**; donde baja, **decrece**. Los picos son **máximos** y los valles, **mínimos**.',
      board: [
        {
          label: 'Creciente',
          tex: '\\p{1}{x_1<x_2}\\ \\Rightarrow\\ \\p{2}{f(x_1)<f(x_2)}',
          parts: ['avanzamos a la derecha', 'la altura aumenta'],
        },
        {
          label: 'Máximo',
          tex: '\\p{1}{f(x^*)\\ge f(x)}\\ \\p{2}{\\text{cerca de }x^*}',
          body: 'El valor máximo es $f(x^*)$; el lugar donde ocurre es $x^*$.',
          parts: ['altura más alta', 'entorno del máximo'],
        },
      ],
    },
    {
      say: 'La gráfica resuelve desigualdades: ¿para qué $x$ es $x^2\\ge4$? Para los $x$ donde la curva queda sobre la recta $y=4$.',
      dur: 2.6,
      board: {
        label: 'Leer desigualdades',
        tex: '\\{x:\\ x^2\\ge4\\}=\\p{1}{\\cG{(-\\infty,-2]}}\\p{2}{\\cup}\\p{3}{\\cG{[2,\\infty)}}',
        parts: [
          'soluciones a la izquierda',
          'cualquiera de ambos tramos',
          'soluciones a la derecha',
        ],
      },
    },
  ],
};
