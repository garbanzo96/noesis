import { useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot } from '../../engine/shapes';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap, Token, mix } from '../shared/lesson';
import { Knob, dec } from '../shared/ui';

// Clase 1.7 · Exponenciales: la potencia como multiplicación repetida, duplicar contra sumar,
// leyes de potencias vistas al agrupar, exponente 0 y negativos por el patrón ÷2, exponentes
// fraccionarios como «medio paso», gráficas de b^x y el número e.

function ExpLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const [b, setB] = useState(2);
  const [n, setN] = useState(1);
  const NS = [1, 2, 4, 12, 52, 365, 1000];
  const onT = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 360) / 130, 0, 6));
    setT(v);
    if (v === 6) unlock();
  });
  const onB = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(0.2 + ((x - 1200) / 200) * 2.8, 0.2, 3) * 10) / 10;
    setB(v);
    if (v < 1) unlock();
  });
  const onN = useSvgDrag(svg, (x) => {
    const i = Math.round(clamp(((x - 360) / 880) * (NS.length - 1), 0, NS.length - 1));
    setN(NS[i]);
    if (NS[i] >= 365) unlock();
  });

  if (beat === 0) {
    const p = at(0);
    return (
      <Stage>
        {[0, 1, 2, 3, 4].map((i) => {
          const from: [number, number] = [380 + i * 210, 340];
          const to: [number, number] = [800, 560];
          const q = mix(from, to, clamp(p * 1.4 - 0.4, 0, 1));
          return (
            <g key={i} opacity={1 - clamp(p * 1.4 - 0.5, 0, 1) * 0.9}>
              <Token x={q[0]} y={q[1]} label={2} color={C.cyan} />
              {i < 4 && p < 0.4 && (
                <Cap x={485 + i * 210} y={340} size={30} color={C.muted} tex="\cdot" />
              )}
            </g>
          );
        })}
        <Cap
          x={800}
          y={560}
          size={72}
          color={C.cyan}
          tex="2^{\cA{5}}"
          opacity={clamp(p * 2 - 1, 0, 1)}
        />
        <Cap x={800} y={680} size={22} color={C.amber} opacity={clamp(p * 2 - 1, 0, 1)}>
          el exponente cuenta cuántas veces se multiplica
        </Cap>
      </Stage>
    );
  }
  if (beat === 1) {
    return (
      <Stage ref={svg}>
        {Array.from({ length: 7 }, (_, k) => {
          const e = 2 ** k;
          const l = 1 + 2 * k;
          const on = k <= t;
          return (
            <g key={k} opacity={on ? 1 : 0.15}>
              <rect
                x={330 + k * 130}
                y={680 - e * 8}
                width={44}
                height={e * 8}
                fill={C.red}
                opacity={0.75}
              />
              <rect
                x={378 + k * 130}
                y={680 - l * 8}
                width={28}
                height={l * 8}
                fill={C.cyan}
                opacity={0.8}
              />
              <Cap x={360 + k * 130} y={672 - e * 8 - 16} size={16} color={C.red}>
                {e}
              </Cap>
            </g>
          );
        })}
        <Cap x={330} y={150} size={20} color={C.red} anchor="left">
          ■ se multiplica por 2 en cada paso
        </Cap>
        <Cap x={330} y={185} size={20} color={C.cyan} anchor="left">
          ■ se suma 2 en cada paso
        </Cap>
        <line x1={360} x2={1140} y1={760} y2={760} stroke={C.line} strokeWidth={3} />
        <rect
          x={340}
          y={730}
          width={820}
          height={60}
          fill="transparent"
          onPointerDown={onT}
          style={{ cursor: 'ew-resize' }}
        />
        <Knob x={360 + t * 130} y={760} onPointerDown={onT} cursor="ew-resize" label={`t=${t}`} />
      </Stage>
    );
  }
  if (beat === 2) {
    const p = at(2);
    return (
      <Stage>
        <Cap x={800} y={200} size={40} color={C.text} tex="2^{\cC{3}}\cdot2^{\cA{2}}" />
        <Cap
          x={800}
          y={350}
          size={40}
          color={C.text}
          tex="=(\cC{2\cdot2\cdot2})\cdot(\cA{2\cdot2})"
          opacity={clamp(p * 3, 0, 1)}
        />
        <Cap
          x={800}
          y={500}
          size={40}
          color={C.text}
          tex="=2^{\cC{3}+\cA{2}}=2^5"
          opacity={clamp(p * 3 - 1, 0, 1)}
        />
        <Cap
          x={800}
          y={650}
          size={30}
          color={C.muted}
          tex="(2^3)^2=2^3\cdot2^3=2^{6}"
          opacity={clamp(p * 3 - 2, 0, 1)}
        />
      </Stage>
    );
  }
  if (beat === 3) {
    const rows = [
      ['2^3', '8'],
      ['2^2', '4'],
      ['2^1', '2'],
      ['2^0', '1'],
      ['2^{-1}', '\\tfrac12'],
      ['2^{-2}', '\\tfrac14'],
    ];
    const p = at(3);
    return (
      <Stage>
        {rows.map(([a, v], i) => (
          <g key={i} opacity={clamp(p * 7 - i, 0, 1)}>
            <Cap
              x={640}
              y={150 + i * 105}
              size={36}
              color={i >= 3 ? C.amber : C.cyan}
              tex={a}
              anchor="right"
            />
            <Cap x={700} y={150 + i * 105} size={36} color={C.text} tex={`=${v}`} anchor="left" />
            {i < rows.length - 1 && (
              <Arrow
                from={[900, 160 + i * 105]}
                to={[900, 245 + i * 105]}
                color={C.dim}
                width={2}
              />
            )}
            {i < rows.length - 1 && (
              <Cap x={930} y={205 + i * 105} size={20} color={C.dim} tex="\div2" anchor="left" />
            )}
          </g>
        ))}
      </Stage>
    );
  }
  if (beat === 4) {
    const p = at(4);
    const r2 = Math.SQRT2;
    return (
      <Stage>
        {[1, r2, 2].map((v, i) => (
          <g key={i} opacity={clamp(p * 3 - i, 0, 1)}>
            <rect
              x={460 + i * 260}
              y={640 - v * 200}
              width={140}
              height={v * 200}
              fill={i === 1 ? C.amber : C.cyan}
              opacity={0.75}
            />
            <Cap x={530 + i * 260} y={670} size={24} color={C.text}>
              {dec(v, 3)}
            </Cap>
          </g>
        ))}
        <Cap
          x={660}
          y={300}
          size={26}
          color={C.amber}
          tex={`\\times\\sqrt2`}
          opacity={clamp(p * 3 - 1, 0, 1)}
        />
        <Cap
          x={920}
          y={240}
          size={26}
          color={C.amber}
          tex={`\\times\\sqrt2`}
          opacity={clamp(p * 3 - 2, 0, 1)}
        />
        <Cap x={800} y={150} size={22} color={C.muted} opacity={p}>
          dos medios pasos iguales hacen un paso completo (×2)
        </Cap>
        {answer !== null && (
          <Cap x={1250} y={400} size={30} color={C.green} tex="9^{1/2}=\sqrt9=3" />
        )}
      </Stage>
    );
  }
  if (beat === 5) {
    const Q = plane([-3, 3], [0, 9], { x: 300, y: 110, w: 820, h: 600 });
    return (
      <Stage ref={svg}>
        <Axes P={Q} xTicks={[-2, -1, 1, 2]} yTicks={[1, 2, 4, 6, 8]} xLabel="x" yLabel="y" grid />
        <Curve
          P={Q}
          f={(x) => Math.min(9, b ** x)}
          a={-3}
          b={3}
          color={b > 1 ? C.red : b < 1 ? C.green : C.amber}
          width={4}
        />
        <Dot x={Q.x(0)} y={Q.y(1)} r={9} color={C.text} />
        <Cap x={Q.x(0) + 16} y={Q.y(1) + 24} size={18} color={C.text} anchor="left" tex="(0,1)" />
        <Cap
          x={1300}
          y={200}
          size={34}
          color={C.text}
          tex={`y=${dec(b, 1).replace(',', '{,}')}^x`}
        />
        <line x1={1200} x2={1400} y1={320} y2={320} stroke={C.line} strokeWidth={3} />
        <Knob
          x={1200 + ((b - 0.2) / 2.8) * 200}
          y={320}
          color={C.amber}
          onPointerDown={onB}
          cursor="ew-resize"
          label="b"
        />
        <Cap x={1300} y={370} size={18} color={C.muted}>
          base
        </Cap>
      </Stage>
    );
  }
  const val = (1 + 1 / n) ** n;
  const i = NS.indexOf(n);
  return (
    <Stage ref={svg}>
      <Cap x={800} y={200} size={22} color={C.muted}>
        crecer 100 % repartido en n pasos iguales
      </Cap>
      <Cap
        x={800}
        y={330}
        size={46}
        color={C.text}
        tex={`\\left(1+\\tfrac{1}{${n}}\\right)^{${n}}=${dec(val, 4).replace(',', '{,}')}`}
      />
      <rect x={360} y={450} width={880} height={30} fill="#1d2b2a" />
      <rect
        x={360}
        y={450}
        width={((val - 2) / (Math.E - 2)) * 880}
        height={30}
        fill={C.amber}
        opacity={0.8}
      />
      <line x1={1240} x2={1240} y1={430} y2={500} stroke={C.green} strokeWidth={3} />
      <Cap x={1240} y={530} size={22} color={C.green} tex="e" />
      <line x1={360} x2={1240} y1={680} y2={680} stroke={C.line} strokeWidth={3} />
      {NS.map((v, k) => (
        <Cap key={v} x={360 + (k / (NS.length - 1)) * 880} y={716} size={16} color={C.dim}>
          {v}
        </Cap>
      ))}
      <rect
        x={340}
        y={650}
        width={920}
        height={60}
        fill="transparent"
        onPointerDown={onN}
        style={{ cursor: 'ew-resize' }}
      />
      <Knob
        x={360 + (i / (NS.length - 1)) * 880}
        y={680}
        onPointerDown={onN}
        cursor="ew-resize"
        label={`n=${n}`}
      />
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Exponenciales',
  intro: {
    question: '¿Qué pasa cuando algo se multiplica por lo mismo en cada paso?',
    text: 'Sumar lo mismo en cada paso da una recta; multiplicar por lo mismo da una exponencial, que al principio parece lenta y después no hay cómo alcanzarla. El virus de la red del puerto se duplica cada hora, y los registros de la salida muestran cuánto ha crecido.',
  },
  Scene: ExpLesson,
  beats: [
    {
      say: 'Una **potencia** abrevia una multiplicación repetida: la **base** se multiplica por sí misma tantas veces como indica el **exponente**.',
      dur: 3,
      board: {
        label: 'Potencia',
        tex: '\\p{1}{\\cC{b}}^{\\p{2}{\\cA{n}}}=\\p{3}{\\underbrace{b\\cdot b\\cdots b}_{n\\ \\text{veces}}}',
        parts: ['factor que se repite', 'cantidad de repeticiones', 'producto de los factores'],
      },
    },
    {
      say: 'Sumar lo mismo cada paso da crecimiento **lineal**. Multiplicar por lo mismo cada paso da crecimiento **exponencial**: al principio se parecen; después no hay comparación.',
      gate: 'Avanza t hasta 6.',
      board: {
        label: 'Crecimiento exponencial',
        tex: 'N(t)=\\p{1}{\\cC{N_0}}\\cdot\\p{2}{\\cA{b}}^{\\,t}',
        body: '$N_0$: valor inicial. $b$: factor por paso.',
        parts: ['cantidad al inicio', 'factor por paso'],
      },
    },
    {
      say: 'Las **leyes de potencias** salen de contar factores: al multiplicar se juntan los factores, así que los exponentes se suman.',
      dur: 3.2,
      board: [
        {
          label: 'Leyes de potencias',
          tex: 'a^m\\,a^n=\\p{1}{a^{m+n}}',
          parts: ['factores reunidos'],
        },
        {
          tex: '\\frac{a^m}{a^n}=\\p{1}{a^{m-n}},\\qquad (a^m)^n=\\p{2}{a^{mn}}',
          parts: ['factores que quedan', 'factores del producto'],
        },
      ],
    },
    {
      say: 'Bajar el exponente en 1 es dividir por la base. Siguiendo el patrón aparecen el exponente 0 y los negativos.',
      dur: 3.2,
      board: [
        {
          label: 'Exponente cero',
          tex: 'a^0=\\p{1}{1}\\qquad(a\\ne0)',
          parts: ['producto sin factores'],
        },
        {
          label: 'Exponente negativo',
          tex: 'a^{-n}=\\p{1}{\\frac{1}{a^n}}',
          parts: ['inverso de la potencia'],
        },
      ],
    },
    {
      say: 'Un exponente fraccionario es un «paso parcial»: $2^{1/2}$ es el número que, multiplicado dos veces, da 2. Es decir, $\\sqrt2$.',
      ask: {
        prompt: '¿Cuánto vale $9^{1/2}$?',
        options: ['3', '4,5', '81'],
        answer: 0,
        explain:
          '$9^{1/2}\\cdot9^{1/2}=9^1=9$, así que $9^{1/2}$ es el número que al cuadrado da 9: 3.',
      },
      board: {
        label: 'Exponente fraccionario',
        tex: 'a^{1/n}=\\p{1}{\\sqrt[n]{a}},\\qquad a^{m/n}=\\p{2}{\\sqrt[n]{a^m}}',
        parts: ['factor que recupera la base', 'raíz de la potencia'],
      },
    },
    {
      say: 'La función $y=b^x$: si la base es mayor que 1 crece; si está entre 0 y 1, decrece. Todas pasan por $(0,1)$.',
      gate: 'Baja la base a menos de 1.',
      board: {
        label: 'Función exponencial',
        tex: '\\p{1}{b>1}:\\ \\text{crece},\\qquad \\p{2}{0<b<1}:\\ \\text{decrece}',
        parts: ['factor de crecimiento', 'factor de disminución'],
      },
    },
    {
      say: 'Crecer un $r$ por uno en cada período es multiplicar por $1+r$. Si un 100 % se reparte en $n$ pasos iguales, el resultado se acerca a un número especial: $e$.',
      gate: 'Arrastra n hasta 365 o más.',
      board: [
        { label: 'Crecimiento porcentual', tex: 'N(t)=N_0\\,(1+r)^t' },
        {
          label: 'Número e',
          tex: 'e=\\lim_{n\\to\\infty}\\left(1+\\tfrac1n\\right)^n\\approx\\p{1}{2{,}71828}',
          body: '$\\lim_{n\\to\\infty}$ se lee «el valor al que se acerca cuando $n$ crece sin fin». Los límites se estudian a fondo en Cálculo diferencial.',
          parts: ['factor de crecimiento límite'],
        },
      ],
    },
  ],
};
