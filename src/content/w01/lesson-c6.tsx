import { useRef, useState, type PointerEvent, type RefObject } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, Token } from '../shared/lesson';
import { Knob, dec } from '../shared/ui';

// Clase 1.6 · Proporciones: razón como «por cada uno», proporcionalidad directa, normalizar a
// fracciones que suman 1, porcentajes en una grilla de 100, promedio ponderado como equilibrio
// y variación porcentual.

const TINT = [C.cyan, C.amber, C.magenta];

function ProportionsLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [counts, setCounts] = useState([200, 300, 500]);
  const [ful, setFul] = useState(5);
  const onC = useSvgDrag(svg, (_x, y) => {
    const v = Math.round(clamp((700 - y) / 0.8, 50, 600) / 50) * 50;
    const next = [counts[0], counts[1], v];
    setCounts(next);
    if (v === next[0] + next[1]) unlock();
  });
  const onF = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 300) / 100, 0, 10) * 10) / 10;
    setFul(v);
    if (Math.abs(v - 2.9) < 0.05) unlock();
  });

  if (beat === 0) {
    const t = at(0);
    return (
      <Stage>
        {Array.from({ length: 12 }, (_, k) => {
          const g = Math.floor(k / 3);
          const x = 420 + g * 250 + (k % 3) * 60;
          const y = 300 + (1 - clamp(t * 2 - k * 0.05, 0, 1)) * -120;
          return <rect key={k} x={x} y={y} width={44} height={60} rx={6} fill={C.cyan} opacity={0.8} />;
        })}
        {[0, 1, 2, 3].map((g) => (
          <Token key={g} x={480 + g * 250} y={480} label="P" color={C.amber} />
        ))}
        <Cap x={800} y={620} size={28} color={C.text} tex="\tfrac{12\ \text{dosis}}{4\ \text{pacientes}}=3\ \text{dosis por paciente}" opacity={t} />
      </Stage>
    );
  }
  if (beat === 1) {
    const Q = plane([0, 6], [0, 18], { x: 380, y: 120, w: 820, h: 560 });
    const t = at(1);
    return (
      <Stage>
        <Axes P={Q} xTicks={[1, 2, 3, 4, 5, 6]} yTicks={[3, 6, 9, 12, 15, 18]} xLabel="\text{pacientes}" yLabel="\text{dosis}" grid />
        {[1, 2, 3, 4, 5].map((x, i) => (
          <Dot key={x} x={Q.x(x)} y={Q.y(3 * x)} r={9} color={C.cyan} opacity={clamp(t * 6 - i, 0, 1)} />
        ))}
        <Group opacity={clamp(t * 2 - 1, 0, 1)}>
          <Line a={Q.pt(0, 0)} b={Q.pt(6, 18)} color={C.cyan} width={3} />
          <Dot x={Q.x(0)} y={Q.y(0)} r={9} color={C.green} />
          <Cap x={Q.x(0) + 20} y={Q.y(0) - 26} size={18} color={C.green} anchor="left">
            pasa por el origen
          </Cap>
        </Group>
      </Stage>
    );
  }
  if (beat === 2) {
    const tot = counts.reduce((a, b) => a + b, 0);
    let acc = 0;
    return (
      <Stage ref={svg}>
        {counts.map((c, i) => (
          <g key={i}>
            <rect x={340 + i * 170} y={700 - c * 0.8} width={110} height={c * 0.8} fill={TINT[i]} opacity={0.7} />
            <Cap x={395 + i * 170} y={730} size={22} color={TINT[i]}>
              {c}
            </Cap>
            {i === 2 && <Knob x={395 + i * 170} y={700 - c * 0.8} color={TINT[i]} onPointerDown={onC} cursor="ns-resize" />}
          </g>
        ))}
        <Cap x={565} y={150} size={20} color={C.muted}>
          cantidades
        </Cap>
        {counts.map((c, i) => {
          const h = (c / tot) * 520;
          const y = 180 + acc;
          acc += h;
          return (
            <g key={'s' + i}>
              <rect x={1060} y={y} width={180} height={h} fill={TINT[i]} opacity={0.7} stroke="#000" strokeOpacity={0.4} />
              <Cap x={1150} y={y + h / 2} size={22} color={C.text}>
                {dec(c / tot, 2)}
              </Cap>
            </g>
          );
        })}
        <Cap x={1150} y={150} size={20} color={C.muted}>
          fracciones del total
        </Cap>
        <Cap x={1150} y={730} size={22} color={C.green} tex="\text{suman }1" />
      </Stage>
    );
  }
  if (beat === 3) {
    const t = at(3);
    const fill = Math.round(75 * t);
    return (
      <Stage>
        {Array.from({ length: 100 }, (_, k) => (
          <rect key={k} x={560 + (k % 10) * 50} y={170 + Math.floor(k / 10) * 50} width={44} height={44} rx={4} fill={k < fill ? C.amber : '#1a2328'} opacity={k < fill ? 0.85 : 1} />
        ))}
        <Cap x={810} y={720} size={30} color={C.amber} tex={`${fill}\\ \\text{de cada}\\ 100`} />
      </Stage>
    );
  }
  if (beat === 4) {
    const lots = [
      { x: 2, w: 0.5 },
      { x: 3, w: 0.3 },
      { x: 5, w: 0.2 },
    ];
    const torque = lots.reduce((a, l) => a + l.w * (l.x - ful), 0);
    return <Balance svg={svg} lots={lots} ful={ful} torque={torque} onF={onF} />;
  }
  const t = at(5);
  return (
    <Stage>
      <rect x={420} y={680 - 400} width={160} height={400} fill={C.cyan} opacity={0.7} />
      <rect x={720} y={680 - 500} width={160} height={500} fill={C.amber} opacity={0.7} />
      <Cap x={500} y={710} size={24} color={C.text}>
        400
      </Cap>
      <Cap x={800} y={710} size={24} color={C.text}>
        500
      </Cap>
      <Cap x={650} y={230} size={26} color={C.green} tex="+100=+25\%\ \text{de }400" opacity={t} />
      {answer !== null && <Cap x={1150} y={400} size={24} color={C.red} tex="500\to400:\ -100=-20\%\ \text{de }500" />}
    </Stage>
  );
}

function Balance({ svg, lots, ful, torque, onF }: { svg: RefObject<SVGSVGElement | null>; lots: { x: number; w: number }[]; ful: number; torque: number; onF: (e: PointerEvent) => void }) {
  const X = (v: number) => 300 + v * 100;
  const ang = useTween(clamp(torque * 8, -10, 10), 0.4);
  const y = 470;
  const fx = X(ful);
  const ok = Math.abs(torque) < 0.02;
  return (
    <Stage ref={svg}>
      <g transform={`rotate(${ang} ${fx} ${y})`}>
        <rect x={X(0)} y={y - 8} width={1000} height={16} rx={4} fill="#2a2148" />
        {lots.map((l, i) => (
          <rect key={i} x={X(l.x) - 34} y={y - 10 - l.w * 400} width={68} height={l.w * 400} fill={TINT[i]} opacity={0.8} />
        ))}
      </g>
      <path d={`M${fx} ${y + 10} L${fx - 34} ${y + 66} L${fx + 34} ${y + 66} Z`} fill={C.panel} stroke={ok ? C.green : C.text} strokeWidth={3} />
      <rect x={X(0) - 20} y={y + 10} width={1040} height={80} fill="transparent" onPointerDown={onF} style={{ cursor: 'ew-resize' }} />
      <Knob x={fx} y={y + 110} color={ok ? C.green : C.text} onPointerDown={onF} cursor="ew-resize" label={dec(ful, 1)} />
      {Array.from({ length: 11 }, (_, k) => (
        <Cap key={k} x={X(k)} y={y + 30} size={14} color={C.dim}>
          {k}
        </Cap>
      ))}
      {lots.map((l, i) => (
        <Cap key={'c' + i} x={1380} y={200 + i * 40} size={20} color={TINT[i]} anchor="left" tex={`x=${l.x},\\ w=${dec(l.w, 1).replace(',', '{,}')}`} />
      ))}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Proporciones',
  Scene: ProportionsLesson,
  beats: [
    {
      say: 'Una **razón** compara dos cantidades dividiendo: cuánto hay de una **por cada** unidad de la otra.',
      board: { label: 'Razón', tex: '\\frac{a}{b}:\\ \\text{cuánto de }a\\text{ por cada }b' },
    },
    {
      say: 'Dos cantidades son **directamente proporcionales** si su razón es siempre la misma: duplicar una duplica la otra. Su gráfica es una recta que pasa por el origen.',
      dur: 2.8,
      board: { label: 'Proporcionalidad', tex: 'y=\\p{1}{\\cC{k}}\\,x', body: '$k=\\tfrac{y}{x}$ es la constante de proporcionalidad.' },
    },
    {
      say: '**Normalizar** es dividir cada cantidad por el total. Se obtienen fracciones que siempre suman 1, sean cuales sean las cantidades.',
      gate: 'Arrastra la barra rosada hasta que valga la mitad del total.',
      board: [
        { label: 'Normalizar', tex: 'w_i=\\frac{\\p{1}{n_i}}{\\p{2}{\\sum_j n_j}}' },
        { tex: '\\sum_i w_i=\\p{1}{1}' },
      ],
    },
    {
      say: 'Un **porcentaje** es una fracción con denominador 100: «por ciento» significa «de cada cien».',
      dur: 2.8,
      board: [
        { label: 'Porcentaje', tex: 'p\\,\\%=\\frac{p}{100}' },
        { tex: '75\\,\\%\\ \\text{de}\\ 600=\\p{1}{0{,}75\\cdot600}=\\p{2}{450}' },
      ],
    },
    {
      say: 'El **promedio ponderado** pesa cada valor según su fracción $w_i$. Es el punto donde la balanza queda en equilibrio.',
      gate: 'Mueve el apoyo hasta equilibrar la balanza.',
      board: [
        { label: 'Promedio ponderado', tex: '\\bar x=\\sum_i w_i\\,x_i' },
        { tex: '\\p{1}{0{,}5\\cdot2}+\\p{2}{0{,}3\\cdot3}+\\p{3}{0{,}2\\cdot5}=\\p{4}{2{,}9}', body: 'El promedio simple $(2+3+5)/3\\approx3{,}3$ ignora los pesos.' },
      ],
    },
    {
      say: 'La **variación porcentual** compara el cambio con el valor inicial. Ojo: subir y bajar la misma cantidad no da el mismo porcentaje.',
      ask: {
        prompt: 'Si algo pasa de 500 a 400, ¿cuánto bajó en porcentaje?',
        options: ['20 %', '25 %', '100 %'],
        answer: 0,
        explain: 'El cambio es 100, pero se compara con el valor inicial, 500: $100/500=20\\,\\%$. Subir de 400 a 500 era 25 % porque se comparaba con 400.',
      },
      board: { label: 'Variación porcentual', tex: '\\frac{\\p{1}{\\text{final}-\\text{inicial}}}{\\p{2}{\\text{inicial}}}\\cdot100\\,\\%' },
    },
  ],
};
