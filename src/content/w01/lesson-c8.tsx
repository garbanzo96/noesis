import { useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, Token } from '../shared/lesson';
import { DragCue, Knob, dec } from '../shared/ui';

// Clase 1.8 · Logaritmos: la pregunta inversa a la potencia, la definición y una tabla, la
// gráfica como reflejo de b^x, la escala logarítmica, las leyes deducidas de las de potencias
// y cómo despejar un exponente.

function LogLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const PI = plane([-2, 8], [-2, 8], { x: 500, y: 100, w: 620, h: 620 });
  const [px, setPx] = useState(0);
  const onP = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PI.inv(x, 0)[0], -1.5, 2.9) * 10) / 10;
    setPx(v);
    if (v >= 2.5) unlock();
  });

  if (beat === 0) {
    const p = at(0);
    const vals = [1, 2, 4, 8];
    return (
      <Stage>
        {vals.map((v, i) => (
          <g key={v} opacity={clamp(p * 4.5 - i, 0, 1)}>
            <Token x={380 + i * 280} y={400} label={v} color={i === 3 ? C.green : C.cyan} r={40} />
            {i > 0 && (
              <Arrow
                from={[380 + (i - 1) * 280 + 46, 400]}
                to={[380 + i * 280 - 46, 400]}
                color={C.amber}
                width={3}
              />
            )}
            {i > 0 && (
              <Cap x={380 + (i - 0.5) * 280} y={360} size={24} color={C.amber} tex="\times2" />
            )}
          </g>
        ))}
        <Cap x={800} y={200} size={34} color={C.text} tex="2^{\,?}=8" />
        <Cap
          x={800}
          y={560}
          size={30}
          color={C.amber}
          tex="\text{3 multiplicaciones}"
          opacity={clamp(p * 4.5 - 3.5, 0, 1)}
        />
      </Stage>
    );
  }
  if (beat === 1) {
    const rows = [
      ['0{,}1', '-1'],
      ['1', '0'],
      ['10', '1'],
      ['100', '2'],
      ['1000', '3'],
    ];
    const p = at(1);
    return (
      <Stage>
        <Cap x={620} y={160} size={26} color={C.cyan} tex="N" />
        <Cap x={980} y={160} size={26} color={C.amber} tex="\log_{10}N" />
        {rows.map(([n, l], i) => (
          <g key={i} opacity={clamp(p * 6 - i, 0, 1)}>
            <Cap x={620} y={240 + i * 100} size={34} color={C.cyan} tex={n} />
            <Cap x={980} y={240 + i * 100} size={34} color={C.amber} tex={l} />
            <Arrow from={[690, 240 + i * 100]} to={[900, 240 + i * 100]} color={C.dim} width={2} />
          </g>
        ))}
      </Stage>
    );
  }
  if (beat === 2) {
    const e2 = (x: number) => 2 ** x;
    const q: [number, number] = [px, e2(px)];
    return (
      <Stage ref={svg}>
        <Axes P={PI} xTicks={[2, 4, 6]} yTicks={[2, 4, 6]} xLabel="x" yLabel="y" grid />
        <Line a={PI.pt(-2, -2)} b={PI.pt(8, 8)} color={C.dim} dashed width={2} />
        <Curve P={PI} f={(x) => Math.min(8, e2(x))} a={-2} b={3} color={C.cyan} width={4} />
        <Curve P={PI} f={(x) => Math.log2(x)} a={0.26} b={8} color={C.amber} width={4} />
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
          x={PI.x(q[1]) + 14}
          y={PI.y(q[0]) + 24}
          size={18}
          color={C.amber}
          anchor="left"
          tex={`(${dec(q[1], 2)},\\ ${dec(q[0], 1)})`}
        />
        <Cap x={1300} y={240} size={26} color={C.cyan} tex="y=2^x" />
        <Cap x={1300} y={300} size={26} color={C.amber} tex="y=\log_2 x" />
      </Stage>
    );
  }
  if (beat === 3) {
    const p = at(3);
    return (
      <Stage>
        <Cap x={260} y={260} size={20} color={C.muted} anchor="left">
          escala lineal: 0 a 1000
        </Cap>
        <line x1={260} x2={1340} y1={320} y2={320} stroke={C.dim} strokeWidth={3} />
        {[1, 10, 100, 1000].map((v) => (
          <g key={v}>
            <line
              x1={260 + (v / 1000) * 1080}
              x2={260 + (v / 1000) * 1080}
              y1={308}
              y2={332}
              stroke={C.cyan}
              strokeWidth={3}
            />
            <Cap x={260 + (v / 1000) * 1080} y={360} size={18} color={C.cyan}>
              {v}
            </Cap>
          </g>
        ))}
        <Group opacity={p}>
          <Cap x={260} y={500} size={20} color={C.muted} anchor="left">
            escala logarítmica: cada paso multiplica por 10
          </Cap>
          <line x1={260} x2={1340} y1={560} y2={560} stroke={C.dim} strokeWidth={3} />
          {[1, 10, 100, 1000, 10000].map((v, i) => (
            <g key={v}>
              <line
                x1={260 + i * 270}
                x2={260 + i * 270}
                y1={548}
                y2={572}
                stroke={C.amber}
                strokeWidth={3}
              />
              <Cap x={260 + i * 270} y={600} size={18} color={C.amber}>
                {v}
              </Cap>
              {i < 4 && <Cap x={395 + i * 270} y={530} size={18} color={C.amber} tex="\times10" />}
            </g>
          ))}
        </Group>
      </Stage>
    );
  }
  if (beat === 4) {
    const p = at(4);
    return (
      <Stage>
        <Cap
          x={800}
          y={180}
          size={34}
          color={C.text}
          tex="2^{\cC{3}}\cdot2^{\cA{4}}=2^{\cC{3}+\cA{4}}"
        />
        <Cap
          x={800}
          y={320}
          size={30}
          color={C.muted}
          tex="\log_2(8\cdot16)=\log_2(2^7)=7"
          opacity={clamp(p * 2, 0, 1)}
        />
        <Cap
          x={800}
          y={440}
          size={34}
          color={C.text}
          tex="\log_2 8+\log_2 16=\cC{3}+\cA{4}=7"
          opacity={clamp(p * 2 - 0.7, 0, 1)}
        />
        <Cap x={800} y={600} size={22} color={C.amber} opacity={clamp(p * 2 - 1, 0, 1)}>
          los exponentes se suman al multiplicar; los logaritmos son exponentes
        </Cap>
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={200} size={40} color={C.text} tex="2^t=50" />
      {answer !== null && (
        <Cap
          x={800}
          y={600}
          size={30}
          color={C.green}
          tex="\log_2 32=5\ \ \text{porque}\ \ 2^5=32"
        />
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Logaritmos',
  Scene: LogLesson,
  beats: [
    {
      say: 'La potencia responde «¿cuánto da $2^3$?». El **logaritmo** responde la pregunta inversa: «¿a qué exponente hay que elevar 2 para obtener 8?».',
      dur: 3,
      board: {
        label: 'Logaritmo',
        tex: '\\log_{\\p{1}{\\cC{2}}}\\p{2}{8}=\\p{3}{\\cA{3}}\\iff \\p{1}{\\cC{2}}^{\\p{3}{\\cA{3}}}=\\p{2}{8}',
      },
    },
    {
      say: 'En general, $\\log_b N$ es el exponente que lleva la base $b$ hasta $N$. Con base 10, cuenta cuántos ceros hay.',
      dur: 3,
      board: {
        label: 'Definición',
        tex: '\\p{1}{\\log_b N}=\\p{2}{t\\iff b^t}=\\p{3}{N}',
        body: 'Con $b>0$, $b\\ne1$ y $N>0$. Valores especiales: $\\log_b1=0$, $\\log_bb=1$.',
      },
    },
    {
      say: 'Como deshace la potencia, la gráfica de $\\log_2 x$ es el reflejo de $2^x$ en la recta $y=x$.',
      gate: 'Arrastra el punto celeste y mira su reflejo.',
      board: {
        label: 'Inversas',
        tex: '\\p{1}{b^{\\log_b N}}=\\p{2}{N,\\qquad \\log_b\\left(b^t\\right)}=\\p{3}{t}',
      },
    },
    {
      say: 'En una **escala logarítmica**, distancias iguales significan factores iguales. Sirve para ver juntos números muy chicos y muy grandes.',
      dur: 2.8,
      board: {
        label: 'Escala logarítmica',
        tex: '\\log_{10}(10\\,N)=\\p{1}{\\log_{10}N+1}',
        body: 'Multiplicar por 10 es avanzar un paso.',
      },
    },
    {
      say: 'Las **leyes de los logaritmos** son las leyes de potencias vistas desde los exponentes: al multiplicar, los exponentes se suman.',
      dur: 3.2,
      board: [
        { label: 'Producto', tex: '\\log(ab)=\\p{1}{\\log a}+\\p{2}{\\log b}' },
        { label: 'Cociente', tex: '\\log\\frac{a}{b}=\\p{1}{\\log a-\\log b}' },
        { label: 'Potencia', tex: '\\log\\left(a^k\\right)=\\p{1}{k\\log a}' },
      ],
    },
    {
      say: 'Para despejar un exponente se toma logaritmo a ambos lados. Con $\\ln$, el logaritmo en base $e$, se calcula cualquier base.',
      ask: {
        prompt: '¿Cuánto vale $\\log_2 32$?',
        options: ['5', '16', '6'],
        answer: 0,
        explain: '$2^5=32$: hacen falta cinco duplicaciones.',
      },
      board: [
        { tex: '2^t=50' },
        { tex: '\\p{1}{\\ln(2^t)=\\ln 50}' },
        {
          tex: '\\p{1}{t\\ln2=\\ln50}\\ \\Rightarrow\\ \\p{2}{t=\\frac{\\ln50}{\\ln2}\\approx5{,}64}',
        },
        { label: 'Cambio de base', tex: '\\log_b N=\\frac{\\ln N}{\\ln b}' },
      ],
    },
  ],
};
