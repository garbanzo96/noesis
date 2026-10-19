import { useRef, useState } from 'react';
import { clamp, lerp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, Token, mix } from '../shared/lesson';
import { DragCue, Knob, dec } from '../shared/ui';

// Clase 1.4 · Composición e inversas: máquinas en cadena, el orden importa, deshacer en orden
// inverso, despejar paso a paso, la inversa como reflejo en y=x, y la prueba horizontal.

function Box({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g>
      <rect
        x={x - 90}
        y={y - 70}
        width={180}
        height={140}
        rx={14}
        fill="#0f1c22"
        stroke={color}
        strokeWidth={4}
      />
      <Cap x={x} y={y} size={36} color={color} tex={label} />
    </g>
  );
}

/** A token travelling through two boxes: positions at t in [0,1]. */
function Travel({
  t,
  values,
  xs,
  y,
  color,
}: {
  t: number;
  values: [number, number, number];
  xs: number[];
  y: number;
  color: string;
}) {
  // stages: 0-0.33 to box1, 0.33-0.66 to box2, 0.66-1 out
  const seg = Math.min(2, Math.floor(t * 3));
  const local = t * 3 - seg;
  const p = mix([xs[seg], y], [xs[seg + 1], y], clamp(local, 0, 1));
  const label = values[Math.min(2, seg + (local > 0.5 ? 1 : 0))];
  return <Token x={p[0]} y={p[1]} label={label} color={color} />;
}

const PI = plane([-1, 7], [-1, 7], { x: 520, y: 100, w: 620, h: 620 });

function CompositionLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [px, setPx] = useState(0.5);
  const onP = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PI.inv(x, 0)[0], -0.5, 3) * 10) / 10;
    setPx(v);
    if (v >= 2.5) unlock();
  });
  const XS = [220, 560, 1040, 1380];

  if (beat <= 2) {
    const rows = [
      {
        y: 260,
        boxes: [
          ['f', '+1', C.cyan],
          ['g', '\\times2', C.amber],
        ],
        vals: [3, 4, 8] as [number, number, number],
        show: true,
      },
      {
        y: 560,
        boxes: [
          ['g', '\\times2', C.amber],
          ['f', '+1', C.cyan],
        ],
        vals: [3, 6, 7] as [number, number, number],
        show: beat >= 1,
      },
    ];
    if (beat === 2) {
      const t = at(2);
      return (
        <Stage>
          <Box x={XS[1]} y={300} label="f^{-1}:\ -1" color={C.cyan} />
          <Box x={XS[2]} y={300} label="g^{-1}:\ \div2" color={C.amber} />
          <Travel
            t={t}
            values={[8, 4, 3]}
            xs={[XS[3], XS[2], XS[1], XS[0]]}
            y={300}
            color={C.green}
          />
          <Arrow from={[1300, 420]} to={[300, 420]} color={C.green} width={3} />
          <Cap x={800} y={470} size={22} color={C.green}>
            se deshace en orden inverso: primero lo último que se hizo
          </Cap>
          <Box x={XS[1]} y={640} label="f:\ +1" color={C.cyan} />
          <Box x={XS[2]} y={640} label="g:\ \times2" color={C.amber} />
          <Arrow from={[300, 760]} to={[1300, 760]} color={C.dim} width={2} />
        </Stage>
      );
    }
    return (
      <Stage>
        {rows.map((r, i) =>
          r.show ? (
            <g key={i}>
              {r.boxes.map(([n, op, c], k) => (
                <Box key={k} x={XS[k + 1]} y={r.y} label={`${n}:\\ ${op}`} color={c} />
              ))}
              <Travel
                t={i === 0 ? (beat === 0 ? at(0) : 1) : at(1)}
                values={r.vals}
                xs={XS}
                y={r.y}
                color={i === 0 ? C.green : C.magenta}
              />
              <Cap
                x={XS[0]}
                y={r.y - 70}
                size={20}
                color={C.muted}
                tex={i === 0 ? 'g(f(3))' : 'f(g(3))'}
              />
            </g>
          ) : null,
        )}
      </Stage>
    );
  }
  if (beat === 3) {
    const t = at(3);
    return (
      <Stage>
        {[0, 1, 2, 3, 4].map((x, i) => {
          const y = 3 * x + 7;
          return (
            <g key={x}>
              <Token x={440} y={200 + i * 120} label={x} color={C.amber} />
              <Token x={1160} y={200 + i * 120} label={y} color={C.green} />
              <Arrow
                from={[480, 190 + i * 120]}
                to={[1120, 190 + i * 120]}
                color={C.cyan}
                width={2.5}
                opacity={1 - t * 0.6}
              />
              <Arrow
                from={[1120, 214 + i * 120]}
                to={[480, 214 + i * 120]}
                color={C.green}
                width={2.5}
                progress={clamp(t * 1.6 - i * 0.1, 0, 1)}
              />
            </g>
          );
        })}
        <Cap x={800} y={150} size={24} color={C.cyan} tex="y=3x+7" />
        <Cap x={800} y={800} size={24} color={C.green} tex="x=\tfrac{y-7}{3}" opacity={t} />
      </Stage>
    );
  }
  if (beat === 4) {
    const f = (x: number) => 2 * x + 1;
    const q = [px, f(px)] as [number, number];
    return (
      <Stage ref={svg}>
        <Axes
          P={PI}
          xTicks={[1, 2, 3, 4, 5, 6]}
          yTicks={[1, 2, 3, 4, 5, 6]}
          xLabel="x"
          yLabel="y"
          grid
        />
        <Line a={PI.pt(-1, -1)} b={PI.pt(7, 7)} color={C.dim} dashed width={2} />
        <Cap x={PI.x(6.6)} y={PI.y(6.9)} size={20} color={C.muted} tex="y=x" />
        <Curve P={PI} f={f} a={-1} b={3} color={C.cyan} width={4} />
        <Curve P={PI} f={(x) => (x - 1) / 2} a={-1} b={7} color={C.amber} width={4} />
        <Line a={PI.pt(q[0], q[1])} b={PI.pt(q[1], q[0])} color={C.text} dashed width={2} />
        <Dot
          x={PI.x(q[0])}
          y={PI.y(q[1])}
          r={12}
          color={C.cyan}
          ring
          onPointerDown={onP}
          cursor="grab"
        />
        <DragCue x={PI.x(q[0])} y={PI.y(q[1])} axis="x" color={C.cyan} />
        <Dot x={PI.x(q[1])} y={PI.y(q[0])} r={10} color={C.amber} />
        <Cap
          x={PI.x(q[0]) - 14}
          y={PI.y(q[1]) - 22}
          size={18}
          color={C.cyan}
          anchor="right"
          tex={`(${dec(q[0], 1)},${dec(q[1], 1)})`}
        />
        <Cap
          x={PI.x(q[1]) + 14}
          y={PI.y(q[0]) + 24}
          size={18}
          color={C.amber}
          anchor="left"
          tex={`(${dec(q[1], 1)},${dec(q[0], 1)})`}
        />
        <Cap x={1300} y={240} size={24} color={C.cyan} tex="f(x)=2x+1" />
        <Cap x={1300} y={300} size={24} color={C.amber} tex="f^{-1}(x)=\tfrac{x-1}{2}" />
      </Stage>
    );
  }
  const Q = plane([-3, 3], [-1, 9], { x: 360, y: 110, w: 880, h: 600 });
  const sq = (x: number) => x * x;
  const t = at(5);
  return (
    <Stage>
      <Axes P={Q} xTicks={[-2, -1, 1, 2]} yTicks={[2, 4, 6, 8]} xLabel="x" yLabel="y" grid />
      <Curve P={Q} f={sq} a={-3} b={0} color={answer !== null ? C.dim : C.cyan} width={4} />
      <Curve P={Q} f={sq} a={0} b={3} color={C.cyan} width={4} />
      <Line a={Q.pt(-3, lerp(1, 4, t))} b={Q.pt(3, lerp(1, 4, t))} color={C.amber} width={3} />
      {answer === null && (
        <>
          <Dot x={Q.x(-Math.sqrt(lerp(1, 4, t)))} y={Q.y(lerp(1, 4, t))} r={10} color={C.red} />
          <Dot x={Q.x(Math.sqrt(lerp(1, 4, t)))} y={Q.y(lerp(1, 4, t))} r={10} color={C.red} />
        </>
      )}
      {answer !== null && <Dot x={Q.x(2)} y={Q.y(4)} r={10} color={C.green} />}
      <Group opacity={answer !== null ? 1 : 0}>
        <Cap x={Q.x(1.8)} y={Q.y(8)} size={22} color={C.green}>
          con x ≥ 0 sí es invertible: √
        </Cap>
      </Group>
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Composición e inversas',
  Scene: CompositionLesson,
  beats: [
    {
      say: '**Componer** es encadenar funciones: la salida de una es la entrada de la siguiente. Aquí $f$ suma 1 y después $g$ multiplica por 2.',
      dur: 3,
      board: {
        label: 'Composición',
        tex: '(g\\circ f)(x)=\\p{1}{g(}\\p{2}{\\cC{f(x)}}\\p{1}{)}',
        body: 'Se lee «$g$ compuesta con $f$»: primero $f$, después $g$.',
        parts: ['función aplicada después', 'salida del primer paso'],
      },
    },
    {
      say: 'Si se invierte el orden de las máquinas, el resultado cambia.',
      dur: 3,
      board: {
        label: 'El orden importa',
        tex: '\\p{1}{g(f(3))=8}\\ \\ne\\ \\p{2}{f(g(3))=7}',
        parts: ['sumar y luego duplicar', 'duplicar y luego sumar'],
      },
    },
    {
      say: 'La **inversa** deshace la función. Para deshacer una cadena se empieza por el último paso, como quitarse primero los zapatos y después los calcetines.',
      dur: 3,
      board: [
        {
          label: 'Función inversa',
          tex: 'f^{-1}(y)=x\\ \\iff\\ f(x)=y',
          body: '$f^{-1}$ no es $\\tfrac1f$: es la función que deshace a $f$.',
        },
        {
          label: 'Inversa de una cadena',
          tex: '(g\\circ f)^{-1}=\\p{1}{f^{-1}}\\circ\\p{2}{g^{-1}}',
          parts: ['deshacer el primer paso', 'deshacer el último paso'],
        },
      ],
    },
    {
      say: 'Para hallar la fórmula de la inversa se **despeja** $x$: se hace lo mismo a ambos lados hasta dejar $x$ sola.',
      dur: 3.4,
      board: [
        { tex: 'y=3x+7' },
        {
          tex: '\\p{1}{y-7}=3x\\qquad\\p{2}{\\text{(restar 7)}}',
          parts: ['salida sin el aumento', 'quitar el aumento'],
        },
        {
          tex: '\\p{1}{\\frac{y-7}{3}}=x\\qquad\\p{2}{\\text{(dividir por 3)}}',
          parts: ['entrada recuperada', 'deshacer el factor'],
        },
        { label: 'Despejar', tex: 'f^{-1}(y)=\\frac{y-7}{3}' },
      ],
    },
    {
      say: 'En la gráfica, invertir es intercambiar $x$ con $y$: la gráfica de $f^{-1}$ es el **reflejo** de la de $f$ en la recta $y=x$.',
      gate: 'Arrastra el punto celeste por la recta y mira su reflejo.',
      board: {
        label: 'Gráfica de la inversa',
        tex: '(a,b)\\in\\mathrm{graf}(f)\\iff \\p{1}{(b,a)}\\in\\mathrm{graf}(f^{-1})',
        parts: ['coordenadas intercambiadas'],
      },
    },
    {
      say: 'No toda función se puede invertir. Si dos entradas dan la misma salida, al volver no se sabe cuál era. En la gráfica: una recta **horizontal** la corta dos veces.',
      ask: {
        prompt: '¿Cómo se puede invertir $f(x)=x^2$?',
        options: [
          'Restringiendo el dominio a $x\\ge0$',
          'No se puede de ninguna forma',
          'Usando $\\tfrac{1}{x^2}$',
        ],
        answer: 0,
        explain:
          'En $x\\ge0$ cada altura se alcanza una sola vez, y la inversa es $\\sqrt{y}$. El recíproco $\\tfrac1{x^2}$ no deshace nada.',
      },
      board: {
        label: 'Inyectiva',
        tex: 'f(a)=f(b)\\ \\Rightarrow\\ \\p{1}{a=b}',
        body: 'Solo las funciones inyectivas tienen inversa. Prueba: toda recta horizontal la corta a lo más una vez.',
        parts: ['la misma entrada'],
      },
    },
  ],
};
