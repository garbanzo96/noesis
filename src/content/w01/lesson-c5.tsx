import { useRef, useState } from 'react';
import { clamp, lerp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { DemoProps, LessonStep } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { Knob } from '../shared/ui';

// Clase 1.5 · Sumatorias: de la suma larga al símbolo Σ, el índice que recorre, expandir,
// sacar constantes, la suma de Gauss con una escalera, doble índice y productoria.

const XV = [3, 5, 2, 6, 4, 7, 1];

function Bars({
  values,
  hi,
  x0 = 300,
  w = 110,
  base = 640,
  scale = 40,
  color = C.cyan,
  labels = true,
}: {
  values: number[];
  hi: (i: number) => boolean;
  x0?: number;
  w?: number;
  base?: number;
  scale?: number;
  color?: string;
  labels?: boolean;
}) {
  return (
    <g>
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={x0 + i * w}
            y={base - v * scale}
            width={w * 0.7}
            height={v * scale}
            fill={hi(i) ? color : C.dim}
            opacity={hi(i) ? 0.8 : 0.35}
          />
          {labels && (
            <>
              <Html
                x={x0 + i * w + w * 0.35}
                y={base + 26}
                size={20}
                color={hi(i) ? color : C.muted}
              >
                <Tex tex={`x_{${i + 1}}`} />
              </Html>
              <Html x={x0 + i * w + w * 0.35} y={base - v * scale - 18} size={18} color={C.text}>
                <span className="prop-tag">{v}</span>
              </Html>
            </>
          )}
        </g>
      ))}
    </g>
  );
}

function SumsLesson({ beats, unlock }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [n, setN] = useState(1);
  const onN = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 335) / 110 + 1, 1, 7));
    setN(v);
    if (v === 7) unlock();
  });

  if (beat <= 1) {
    const partial = XV.slice(0, beat === 0 ? 7 : n).reduce((a, b) => a + b, 0);
    return (
      <Stage ref={svg}>
        <Bars values={XV} hi={(i) => (beat === 0 ? at(0) * 8 > i : i < n)} />
        {beat === 1 && (
          <>
            <rect
              x={1170}
              y={640 - partial * 13}
              width={80}
              height={partial * 13}
              fill={C.amber}
              opacity={0.8}
            />
            <Cap x={1210} y={670} size={24} color={C.amber}>
              {partial}
            </Cap>
            <Cap x={1210} y={700} size={16} color={C.muted}>
              suma parcial
            </Cap>
            <line x1={335} x2={1035} y1={740} y2={740} stroke={C.line} strokeWidth={3} />
            <rect
              x={320}
              y={710}
              width={730}
              height={60}
              fill="transparent"
              onPointerDown={onN}
              style={{ cursor: 'ew-resize' }}
            />
            <Knob
              x={335 + (n - 1) * 110}
              y={740}
              color={C.amber}
              onPointerDown={onN}
              cursor="ew-resize"
              label={`i=${n}`}
            />
          </>
        )}
        {beat === 0 && (
          <Cap
            x={800}
            y={170}
            size={30}
            color={C.text}
            tex="x_1+x_2+x_3+x_4+x_5+x_6+x_7"
            opacity={at(0)}
          />
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    const t = at(2);
    return (
      <Stage>
        {[1, 2, 3, 4].map((i, k) => {
          const show = clamp(t * 5 - k, 0, 1);
          const s = 28;
          const x0 = 260 + [0, 70, 180, 340][k];
          return (
            <g key={i} opacity={show}>
              {Array.from({ length: i * i }, (_, j) => (
                <rect
                  key={j}
                  x={x0 + (j % i) * s}
                  y={560 - (Math.floor(j / i) + 1) * s}
                  width={s - 4}
                  height={s - 4}
                  rx={4}
                  fill={C.cyan}
                  opacity={0.75}
                />
              ))}
              <Cap x={x0 + (i * s) / 2} y={600} size={24} color={C.cyan} tex={`${i}^2=${i * i}`} />
            </g>
          );
        })}
        <Cap
          x={1150}
          y={420}
          size={44}
          color={C.amber}
          tex="=30"
          opacity={clamp(t * 5 - 4, 0, 1)}
        />
      </Stage>
    );
  }
  if (beat === 3) {
    const t = at(3);
    const k = lerp(1, 2, t);
    return (
      <Stage>
        <Bars values={XV.map((v) => v * k)} hi={() => true} scale={28} labels={false} />
        {XV.map((v, i) => (
          <Cap
            key={i}
            x={300 + i * 110 + 38}
            y={666}
            size={18}
            color={C.cyan}
            tex={`2x_{${i + 1}}`}
            opacity={t}
          />
        ))}
        <Cap
          x={1240}
          y={300}
          size={26}
          color={C.amber}
          tex={`\\times${(Math.round(k * 10) / 10).toString().replace('.', '{,}')}`}
        />
        <Cap x={1240} y={360} size={18} color={C.muted}>
          cada barra se duplica: el total también
        </Cap>
      </Stage>
    );
  }
  if (beat === 4) {
    const nn = 5;
    const s = 64;
    const x0 = 420;
    const y0 = 650;
    const t = at(4);
    return (
      <Stage>
        {Array.from({ length: nn }, (_, i) =>
          Array.from({ length: i + 1 }, (_, j) => (
            <rect
              key={`a${i}${j}`}
              x={x0 + i * s}
              y={y0 - (j + 1) * s}
              width={s - 6}
              height={s - 6}
              rx={6}
              fill={C.cyan}
              opacity={0.75}
            />
          )),
        )}
        <Group opacity={t}>
          {Array.from({ length: nn }, (_, i) =>
            Array.from({ length: nn - i }, (_, j) => (
              <rect
                key={`b${i}${j}`}
                x={x0 + i * s}
                y={y0 - (nn + 1 - j) * s}
                width={s - 6}
                height={s - 6}
                rx={6}
                fill={C.amber}
                opacity={0.6}
              />
            )),
          )}
        </Group>
        <Cap x={x0 + (nn * s) / 2} y={y0 + 34} size={22} color={C.text} tex={`n=${nn}`} />
        <Cap
          x={x0 - 30}
          y={y0 - ((nn + 1) * s) / 2}
          size={22}
          color={C.text}
          tex={`n+1=${nn + 1}`}
          anchor="right"
        />
        <Cap x={1150} y={300} size={26} color={C.cyan} tex="1+2+3+4+5" />
        <Cap x={1150} y={360} size={24} color={C.amber} tex="\tfrac{5\cdot6}{2}=15" opacity={t} />
      </Stage>
    );
  }
  if (beat === 5) {
    const T = [
      [4, 6, 5, 3],
      [2, 3, 6, 4],
      [7, 1, 2, 5],
    ];
    const t = at(5);
    return (
      <Stage>
        {T.map((row, i) =>
          row.map((v, j) => (
            <g key={`${i}${j}`}>
              <rect
                x={460 + j * 140}
                y={220 + i * 110}
                width={124}
                height={94}
                rx={8}
                fill="#0d1820"
                stroke={C.line}
              />
              <Cap x={522 + j * 140} y={267 + i * 110} size={30} color={C.text}>
                {v}
              </Cap>
              {i === 0 && (
                <Cap x={522 + j * 140} y={190} size={18} color={C.muted} tex={`j=${j + 1}`} />
              )}
              {j === 0 && (
                <Cap
                  x={430}
                  y={267 + i * 110}
                  size={18}
                  color={C.muted}
                  tex={`i=${i + 1}`}
                  anchor="right"
                />
              )}
            </g>
          )),
        )}
        <Group opacity={clamp(t * 2, 0, 1)}>
          {T.map((row, i) => (
            <Cap key={i} x={1060} y={267 + i * 110} size={28} color={C.cyan}>
              {row.reduce((a, b) => a + b, 0)}
            </Cap>
          ))}
        </Group>
        <Group opacity={clamp(t * 2 - 1, 0, 1)}>
          {T[0].map((_, j) => (
            <Cap key={j} x={522 + j * 140} y={580} size={28} color={C.amber}>
              {T.reduce((a, r) => a + r[j], 0)}
            </Cap>
          ))}
          <Cap x={1060} y={580} size={28} color={C.green}>
            48
          </Cap>
        </Group>
      </Stage>
    );
  }
  const vals = [100, 200, 300, 150];
  const t = at(6);
  return (
    <Stage>
      {vals.map((v, i) => (
        <g key={i} opacity={clamp(t * 4 - i, 0, 1)}>
          <rect
            x={380 + i * 260}
            y={640 - v * 1.4}
            width={110}
            height={v * 1.4}
            fill={C.cyan}
            opacity={0.7}
          />
          <Cap x={435 + i * 260} y={670} size={24} color={C.text}>
            {v}
          </Cap>
          {i > 0 && (
            <Cap
              x={435 + i * 260 - 130}
              y={340}
              size={26}
              color={C.amber}
              tex={['\\times2', '\\times1{,}5', '\\times0{,}5'][i - 1]}
            />
          )}
        </g>
      ))}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sumatorias e índices',
  Scene: SumsLesson,
  beats: [
    {
      say: 'Sumar muchos números escritos uno a uno es largo. La letra griega $\\Sigma$ (sigma) resume una suma: dice qué se suma y entre qué índices.',
      dur: 3,
      board: [
        { tex: 'x_1+x_2+\\cdots+x_7' },
        {
          label: 'Sumatoria',
          tex: '\\p{1}{\\sum}_{\\p{2}{\\cC{i=1}}}^{\\p{3}{\\cA{7}}}\\p{4}{\\cG{x_i}}',
          body: '$\\cC{i=1}$: el índice empieza en 1. $\\cA{7}$: termina en 7 (incluido). $\\cG{x_i}$: el término que se suma en cada paso.',
        },
      ],
    },
    {
      say: 'El **índice** $i$ es un contador: toma los valores 1, 2, 3… y en cada uno agrega un término. Lo acumulado hasta $n$ es la suma parcial.',
      gate: 'Arrastra el índice desde 1 hasta 7.',
      board: {
        label: 'Suma parcial',
        tex: '\\p{1}{S_n}=\\p{2}{\\sum_{i=1}^{n}x_i}',
        body: '$S_7=3+5+2+6+4+7+1=28$.',
      },
    },
    {
      say: 'El término puede ser una fórmula en $i$. Para calcular, se expande: se reemplaza $i$ por cada valor y se suma.',
      dur: 3,
      board: {
        label: 'Expandir',
        tex: '\\sum_{i=1}^{4}i^2=\\p{1}{1}+\\p{2}{4}+\\p{3}{9}+\\p{4}{16}=\\p{5}{30}',
      },
    },
    {
      say: 'Si todos los términos llevan el mismo factor, se puede sacar fuera de la suma. Y sumar una constante $n$ veces da $n$ por la constante.',
      dur: 2.6,
      board: [
        {
          label: 'Sacar constantes',
          tex: '\\sum_i \\p{1}{\\cA{c}}\\,x_i=\\p{2}{\\cA{c}}\\sum_i x_i',
        },
        { label: 'Separar', tex: '\\sum_i(x_i+y_i)=\\p{1}{\\sum_i x_i}+\\p{2}{\\sum_i y_i}' },
        { label: 'Constante', tex: '\\sum_{i=1}^{n}c=\\p{1}{n\\,c}' },
      ],
    },
    {
      say: 'Un truco famoso: la escalera $1+2+\\dots+n$ y una copia dada vuelta forman un rectángulo de $n$ por $n+1$.',
      ask: {
        prompt: 'Con ese truco, ¿cuánto vale $1+2+\\dots+100$?',
        options: ['5 050', '10 100', '5 000'],
        answer: 0,
        explain: 'Dos escaleras forman $100\\cdot101=10\\,100$; una sola es la mitad: 5 050.',
      },
      board: {
        label: 'Suma de Gauss',
        tex: '\\sum_{i=1}^{n}i=\\frac{\\p{1}{n}\\,\\p{2}{(n+1)}}{\\p{3}{2}}',
      },
    },
    {
      say: 'Con dos índices se recorre una tabla: $a_{ij}$ es la celda de la fila $i$ y la columna $j$. Sumar por filas o por columnas da el mismo total.',
      dur: 3,
      board: {
        label: 'Doble índice',
        tex: '\\p{1}{\\sum_i\\sum_j a_{ij}}=\\p{2}{\\sum_j\\sum_i a_{ij}}',
      },
    },
    {
      say: 'La letra $\\Pi$ (pi mayúscula) hace lo mismo que $\\Sigma$, pero **multiplicando**. Sirve para factores que se encadenan.',
      dur: 2.6,
      board: {
        label: 'Productoria',
        tex: '\\prod_{k=1}^{3}r_k=\\p{1}{2}\\cdot\\p{2}{1{,}5}\\cdot\\p{3}{0{,}5}=\\p{4}{1{,}5}',
      },
    },
  ],
};
