import { useEffect, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { DragCue, Knob, dec } from '../shared/ui';
import { SlopeLine } from '../w02/kit';

// Clase 1.3 · Rectas y pendiente: cambio constante, pendiente como cociente, y=mx+b con
// controles, signo de la pendiente, recta por dos puntos e intersección de dos rectas.

const P = plane([-1, 6], [-2, 12], { x: 360, y: 100, w: 880, h: 620 });
const XT = [0, 1, 2, 3, 4, 5];
const YT = [2, 4, 6, 8, 10];

function LinesLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x2, setX2] = useState(3);
  const [m, setM] = useState(1);
  const [b, setB] = useState(0);
  const onX2 = useSvgDrag(svg, (px) => {
    const v = Math.round(clamp(P.inv(px, 0)[0], 1.5, 5.5) * 2) / 2;
    setX2(v);
    if (v >= 5) unlock();
  });
  const onM = useSvgDrag(svg, (px) => setM(Math.round(clamp((px - 1300) / 50, -2, 2) * 4) / 4 + 0));
  const onB = useSvgDrag(svg, (px) => setB(Math.round(clamp((px - 1300) / 25, -4, 4) * 2) / 2));
  useEffect(() => {
    if (beat === 2 && m === -0.5 && b === 3) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, b, beat]);

  if (beat <= 1) {
    const f = (x: number) => 2 * x + 1;
    const t = at(0);
    return (
      <Stage ref={svg}>
        <Axes P={P} xTicks={XT} yTicks={YT} xLabel="x" yLabel="y" grid />
        {[0, 1, 2, 3, 4].map((x, i) => (
          <g key={x} opacity={beat === 0 ? clamp(t * 6 - i, 0, 1) : 1}>
            <Dot x={P.x(x)} y={P.y(f(x))} r={9} color={C.cyan} />
            {beat === 0 && i < 4 && (
              <>
                <Line a={P.pt(x, f(x))} b={P.pt(x + 1, f(x))} color={C.amber} width={3} />
                <Line a={P.pt(x + 1, f(x))} b={P.pt(x + 1, f(x + 1))} color={C.magenta} width={3} />
                <Cap x={P.x(x + 0.5)} y={P.y(f(x)) + 22} size={16} color={C.amber}>
                  +1
                </Cap>
                <Cap x={P.x(x + 1) + 18} y={P.y(f(x) + 1)} size={16} color={C.magenta} anchor="left">
                  +2
                </Cap>
              </>
            )}
          </g>
        ))}
        <Group opacity={beat === 0 ? clamp(t * 2 - 1, 0, 1) : 1}>
          <SlopeLine P={P} a={0} ya={1} m={2} x0={-1} x1={6} color={C.cyan} width={2.5} />
        </Group>
        {beat === 1 && (
          <g>
            <Line a={P.pt(1, 3)} b={P.pt(x2, 3)} color={C.amber} width={4} />
            <Line a={P.pt(x2, 3)} b={P.pt(x2, f(x2))} color={C.magenta} width={4} />
            <Cap x={P.x((1 + x2) / 2)} y={P.y(3) + 26} size={20} color={C.amber} tex={`\\Delta x=${dec(x2 - 1, 1)}`} />
            <Cap x={P.x(x2) + 16} y={P.y((3 + f(x2)) / 2)} size={20} color={C.magenta} anchor="left" tex={`\\Delta y=${dec(f(x2) - 3, 1)}`} />
            <Dot x={P.x(1)} y={P.y(3)} r={9} color={C.amber} />
            <Dot x={P.x(x2)} y={P.y(f(x2))} r={13} color={C.magenta} ring onPointerDown={onX2} cursor="ew-resize" />
            <DragCue x={P.x(x2)} y={P.y(f(x2))} axis="x" color={C.magenta} />
            <Cap x={1300} y={200} size={28} color={C.text} tex={`\\dfrac{\\Delta y}{\\Delta x}=\\dfrac{${dec(f(x2) - 3, 1)}}{${dec(x2 - 1, 1)}}=2`} />
          </g>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    return (
      <Stage ref={svg}>
        <Axes P={P} xTicks={XT} yTicks={YT} xLabel="x" yLabel="y" grid />
        <SlopeLine P={P} a={0} ya={b} m={m} x0={-1} x1={6} color={C.cyan} width={4} />
        <Dot x={P.x(0)} y={P.y(b)} r={10} color={C.green} />
        <Cap x={1300} y={170} size={30} color={C.text} tex={`y=\\cA{${dec(m, 2).replace(',', '{,}')}}\\,x\\cG{${b < 0 ? '' : '+'}${dec(b, 1).replace(',', '{,}')}}`} />
        <line x1={1200} x2={1400} y1={300} y2={300} stroke={C.line} strokeWidth={3} />
        <Knob x={1300 + m * 50} y={300} color={C.amber} onPointerDown={onM} cursor="ew-resize" label="m" />
        <Cap x={1300} y={340} size={18} color={C.amber}>
          pendiente
        </Cap>
        <line x1={1200} x2={1400} y1={430} y2={430} stroke={C.line} strokeWidth={3} />
        <Knob x={1300 + b * 25} y={430} color={C.green} onPointerDown={onB} cursor="ew-resize" label="b" />
        <Cap x={1300} y={470} size={18} color={C.green}>
          ordenada
        </Cap>
      </Stage>
    );
  }
  if (beat === 3) {
    const cases = [
      { m: 1.2, c: C.green, t: 'm > 0: sube' },
      { m: 0, c: C.amber, t: 'm = 0: horizontal' },
      { m: -1.2, c: C.red, t: 'm < 0: baja' },
    ];
    return (
      <Stage>
        {cases.map((k, i) => {
          const Q = plane([-2, 2], [-2.5, 2.5], { x: 160 + i * 460, y: 220, w: 380, h: 380 });
          return (
            <g key={i} opacity={clamp(at(3) * 3 - i, 0, 1)}>
              <Axes P={Q} xTicks={[]} yTicks={[]} />
              <SlopeLine P={Q} a={0} ya={0} m={k.m} x0={-2} x1={2} color={k.c} width={4} />
              <Cap x={Q.x(0)} y={650} size={22} color={k.c}>
                {k.t}
              </Cap>
            </g>
          );
        })}
      </Stage>
    );
  }
  if (beat === 4) {
    const t = at(4);
    return (
      <Stage>
        <Axes P={P} xTicks={XT} yTicks={YT} xLabel="x" yLabel="y" grid />
        <Dot x={P.x(1)} y={P.y(2)} r={10} color={C.amber} />
        <Dot x={P.x(3)} y={P.y(6)} r={10} color={C.amber} />
        <Cap x={P.x(1) + 16} y={P.y(2) + 24} size={20} color={C.amber} anchor="left" tex="(1,2)" />
        <Cap x={P.x(3) + 16} y={P.y(6) + 24} size={20} color={C.amber} anchor="left" tex="(3,6)" />
        <Group opacity={clamp(t * 2 - 0.6, 0, 1)}>
          <SlopeLine P={P} a={1} ya={2} m={2} x0={-1} x1={6} color={C.cyan} width={3} />
        </Group>
      </Stage>
    );
  }
  const t = at(5);
  return (
    <Stage>
      <Axes P={P} xTicks={XT} yTicks={YT} xLabel="x" yLabel="y" grid />
      <SlopeLine P={P} a={0} ya={0} m={2} x0={-1} x1={6} color={C.cyan} width={3} />
      <SlopeLine P={P} a={0} ya={6} m={-1} x0={-1} x1={6} color={C.amber} width={3} />
      <Cap x={P.x(4.6)} y={P.y(9.6)} size={22} color={C.cyan} tex="y=2x" />
      <Cap x={P.x(5.1)} y={P.y(1.8)} size={22} color={C.amber} tex="y=-x+6" />
      <Group opacity={t}>
        <Dot x={P.x(2)} y={P.y(4)} r={12} color={C.green} />
        <Cap x={P.x(2) + 20} y={P.y(4) - 26} size={22} color={C.green} anchor="left" tex="(2,4)" />
      </Group>
      {answer !== null && (
        <>
          <SlopeLine P={P} a={0} ya={1} m={1} x0={-1} x1={6} color={C.violet} width={2} dashed />
          <SlopeLine P={P} a={0} ya={-3} m={3} x0={-1} x1={6} color={C.magenta} width={2} dashed />
          <Dot x={P.x(2)} y={P.y(3)} r={10} color={C.magenta} />
        </>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Rectas y pendiente',
  Scene: LinesLesson,
  beats: [
    {
      say: 'Cuando una cantidad cambia **siempre lo mismo** por cada paso, sus puntos quedan alineados. Aquí, cada vez que $x$ avanza 1, $y$ sube 2.',
      dur: 3,
      board: { label: 'Cambio constante', tex: '\\p{1}{\\cA{\\Delta x=1}}\\ \\Rightarrow\\ \\p{2}{\\cM{\\Delta y=2}}', parts: ['avanza 1 en x', 'sube 2 en y'], body: '$\\Delta$ (delta) significa «cambio»: valor final menos valor inicial.' },
    },
    {
      say: 'La **pendiente** mide cuánto sube $y$ por cada unidad que avanza $x$. En una recta da lo mismo qué dos puntos uses.',
      gate: 'Arrastra el punto rosado lejos: el cociente no cambia.',
      board: { label: 'Pendiente', tex: 'm=\\frac{\\p{1}{\\cM{\\Delta y}}}{\\p{2}{\\cA{\\Delta x}}}=\\p{3}{\\frac{y_2-y_1}{x_2-x_1}}', parts: ['cuánto sube', 'cuánto avanza', 'lo mismo, con dos puntos'] },
    },
    {
      say: 'Toda recta no vertical se escribe $y=mx+b$: $m$ es la pendiente y $b$, la **ordenada en el origen**, la altura donde corta el eje $y$.',
      gate: 'Con los controles, arma la recta y = −0,5x + 3.',
      board: { label: 'Ecuación de la recta', tex: 'y=\\p{1}{\\cA{m}}\\,x+\\p{2}{\\cG{b}}', parts: ['pendiente: cuánto se inclina', 'altura donde corta el eje y'], body: 'Cambiar $m$ gira la recta; cambiar $b$ la sube o baja sin girarla.' },
    },
    {
      say: 'El signo de la pendiente dice hacia dónde va la recta.',
      dur: 2.6,
      board: { label: 'Signo de m', tex: '\\begin{aligned}\\p{1}{\\cG{m>0}}&\\p{1}{:\\ \\text{sube}}\\\\ \\p{2}{\\cA{m=0}}&\\p{2}{:\\ \\text{horizontal}}\\\\ \\p{3}{\\cR{m<0}}&\\p{3}{:\\ \\text{baja}}\\end{aligned}' },
    },
    {
      say: 'Con dos puntos se determina la recta: primero la pendiente, después se usa uno de los puntos.',
      dur: 3.2,
      board: [
        { label: 'Recta por dos puntos', tex: 'm=\\frac{6-2}{3-1}=\\p{1}{2}' },
        { tex: 'y-\\p{1}{2}=\\p{2}{2}\\,(x-\\p{3}{1})' , body: 'Forma punto–pendiente: $y-y_1=m(x-x_1)$.' },
        { tex: 'y=\\p{1}{2x}' },
      ],
    },
    {
      say: 'Dos rectas se cortan donde tienen la misma $y$ para la misma $x$: se igualan y se despeja.',
      ask: {
        prompt: '¿Dónde se cortan $y=x+1$ e $y=3x-3$?',
        options: ['En (2, 3)', 'En (1, 2)', 'No se cortan'],
        answer: 0,
        explain: '$x+1=3x-3\\Rightarrow 4=2x\\Rightarrow x=2$, y entonces $y=3$. Tienen distinta pendiente, así que se cortan una vez.',
      },
      board: [
        { label: 'Intersección', tex: '2x=-x+6' },
        { tex: '\\p{1}{3x=6}\\ \\Rightarrow\\ \\p{2}{x=2},\\ \\p{3}{y=4}' },
      ],
    },
  ],
};
