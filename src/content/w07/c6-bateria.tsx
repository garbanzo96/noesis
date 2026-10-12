import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line, PlaneClip } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { num, pair, type V2 } from './kit';

const MAP = plane([-1.4, 1.4], [-1.4, 1.4], { x: 340, y: 170, w: 500, h: 500 });
const ANTENNA = plane([-2.8, 2.8], [-2.8, 2.8], { x: 340, y: 170, w: 500, h: 500 });
const PRODUCT = plane([0, 10], [0, 27], { x: 340, y: 220, w: 550, h: 400 });

/** A level of 3x+4y is a line perpendicular to (3,4). */
function SignalLevel({ value, radius = 1 }: { value: number; radius?: number }) {
  const P = radius === 1 ? MAP : ANTENNA;
  const x = (3 * value) / 25,
    y = (4 * value) / 25;
  return (
    <g clipPath="url(#plane-clip)">
      <Line
        a={P.pt(x - (2 * radius * 4) / 5, y + (2 * radius * 3) / 5)}
        b={P.pt(x + (2 * radius * 4) / 5, y - (2 * radius * 3) / 5)}
        color={C.amber}
        width={4}
      />
    </g>
  );
}

function BatteryLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [angle, setAngle] = useState(Math.PI);
  const { beat, at } = beats;
  const onPoint = useSvgDrag(svg, (px, py) => {
    const [x, y] = MAP.inv(px, py);
    if (Math.hypot(x, y) < 0.1) return;
    const a = Math.atan2(y, x);
    setAngle(a);
    if (3 * Math.cos(a) + 4 * Math.sin(a) > 4.95) unlock();
  });
  const p: V2 = beat === 0 ? [Math.cos(angle), Math.sin(angle)] : [3 / 5, 4 / 5];
  const value = 3 * p[0] + 4 * p[1];
  if (beat === 3)
    return (
      <Stage>
        <Axes
          P={PRODUCT}
          xTicks={[0, 2, 4, 6, 8, 10]}
          yTicks={[5, 10, 15, 20, 25]}
          xLabel="x"
          yLabel="xy"
        />
        <Curve P={PRODUCT} f={(x) => x * (10 - x)} color={C.cyan} progress={at(3)} />
        <Dot x={PRODUCT.x(5)} y={PRODUCT.y(25)} color={C.green} />
        <Cap x={PRODUCT.x(5)} y={PRODUCT.y(25) - 35} tex="(5;25)" color={C.green} />
        <Cap x={1230} y={250} tex="f=xy,\quad x+y=10" />
        <Cap x={1230} y={340} tex="(y,x)=\lambda(1,1)" color={C.amber} />
        <Cap x={1230} y={430} tex="x=y=5" color={C.magenta} />
        <Cap x={1230} y={520} tex="f_{\max}=25" color={C.green} />
        <Cap x={1230} y={620} size={19}>
          Sobre la recta: xy = x(10 − x).
        </Cap>
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <PlaneClip P={MAP} />
      <Axes P={MAP} xTicks={[-1, 0, 1]} yTicks={[-1, 1]} xLabel="x" yLabel="y" />
      <circle
        cx={MAP.x(0)}
        cy={MAP.y(0)}
        r={MAP.sx}
        fill={C.cyan}
        fillOpacity={0.05}
        stroke={C.cyan}
        strokeWidth={3}
      />
      <SignalLevel value={value} />
      {beat === 0 ? (
        <>
          <Dot x={MAP.x(0.6)} y={MAP.y(0.8)} color={C.green} ring />
          <Knob x={MAP.x(p[0])} y={MAP.y(p[1])} onPointerDown={onPoint} color={C.magenta} r={13} />
        </>
      ) : (
        <Dot x={MAP.x(p[0])} y={MAP.y(p[1])} color={C.green} />
      )}
      <Cap x={610} y={740} tex="g(x,y)=x^2+y^2=1" color={C.cyan} />
      <Cap x={1230} y={210} tex="f(x,y)=3x+4y" color={C.amber} />
      <Cap x={1230} y={290} tex={`P${beat === 0 ? '\\approx' : '='}${pair(p)}`} color={C.magenta} />
      {(beat !== 2 || answer !== null) && (
        <Cap
          x={1230}
          y={370}
          tex={`f(P)${beat === 0 ? '\\approx' : '='}${num(value)}`}
          color={C.green}
        />
      )}
      {beat >= 1 && (
        <>
          <Arrow
            from={MAP.pt(...p)}
            to={MAP.pt(p[0] + 0.36, p[1] + 0.48)}
            color={C.amber}
            width={5}
          />
          <Arrow
            from={MAP.pt(...p)}
            to={MAP.pt(p[0] + 0.4 * p[0], p[1] + 0.4 * p[1])}
            color={C.cyan}
            width={3}
          />
          <Cap x={1230} y={470} tex="\nabla f=(3,4)" color={C.amber} />
          <Cap x={1230} y={540} tex="\nabla g=(2x,2y)" color={C.cyan} />
          <Cap x={1230} y={625} size={19}>
            Las flechas son paralelas en el contacto.
          </Cap>
        </>
      )}
      {beat === 0 && (
        <Cap x={1230} y={495} size={19}>
          Gira el punto hasta la marca verde.
        </Cap>
      )}
      {beat === 4 && <Cap x={1230} y={710} tex="\lambda=\tfrac52" color={C.magenta} />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Optimización con restricción',
  Scene: BatteryLesson,
  beats: [
    {
      say: 'Mueve el punto por el círculo y mira cuánto vale la señal. La **restricción** obliga a buscar el mejor valor sobre esa curva.',
      gate: 'Arrastra el punto por el círculo hasta que f supere 4,95, cerca de la marca verde.',
      board: {
        label: 'Objetivo y restricción',
        tex: '\\begin{aligned}\\p{1}{\\text{maximizar }}&\\p{2}{\\cA{3x+4y}}\\\\\\p{3}{\\text{con }}&\\p{4}{\\cC{x^2+y^2=1}}\\end{aligned}',
      },
    },
    {
      say: 'En el máximo, la recta de nivel toca el círculo sin cruzarlo. Las tangentes coinciden y los gradientes son paralelos: eso expresa el **método de Lagrange**.',
      dur: 3,
      board: {
        label: 'Gradientes paralelos',
        tex: '\\p{1}{\\cA{\\nabla f}}=\\p{2}{\\cM{\\lambda}}\\,\\p{3}{\\cC{\\nabla g}}',
        body: 'En un extremo sobre una restricción suave, con $\\nabla g\\ne\\vec0$. El multiplicador λ puede ser positivo o negativo.',
      },
    },
    {
      say: 'Resuelve las dos ecuaciones de las pendientes junto al círculo. El candidato del primer cuadrante es (0,6; 0,8); compara también el del lado opuesto.',
      ask: {
        prompt: '¿Cuánto vale el máximo?',
        options: ['5', '7', '1'],
        answer: 0,
        explain:
          '$3\\cdot0{,}6+4\\cdot0{,}8=5$. El candidato opuesto $(-0{,}6;-0{,}8)$ da −5, el mínimo. La suma 7 corresponde a (1,1), que está fuera del círculo.',
      },
      board: {
        label: 'Sistema del círculo',
        tex: '\\begin{cases}\\p{1}{3=2\\lambda x}\\\\\\p{2}{4=2\\lambda y}\\\\\\p{3}{x^2+y^2=1}\\end{cases}',
      },
    },
    {
      say: 'Prueba ahora con un producto y una suma fija. Lagrange exige x igual a y; sobre la recta, el producto forma una parábola con máximo en el centro.',
      dur: 3,
      board: [
        { label: 'Producto con suma fija', tex: '\\p{1}{f=\\cA{xy}},\\quad\\p{2}{g=\\cC{x+y}=10}' },
        {
          label: 'Reparto óptimo',
          tex: '\\begin{aligned}\\p{1}{(y,x)}&=\\p{2}{\\lambda(1,1)}\\\\\\p{3}{x=y=5}&\\Rightarrow\\p{4}{xy=25}\\end{aligned}',
        },
      ],
    },
    {
      say: 'Mantén juntas las ecuaciones de los gradientes y la restricción. Las soluciones son candidatos: evalúa el objetivo para decidir cuál es el máximo.',
      dur: 3,
      board: {
        label: 'Sistema de Lagrange',
        tex: '\\begin{cases}\\p{1}{\\cA{f_x}=\\cM{\\lambda}g_x}\\\\\\p{2}{\\cA{f_y}=\\cM{\\lambda}g_y}\\\\\\p{3}{\\cC{g(x,y)=c}}\\end{cases}',
        body: 'Revisa que cada candidato cumpla la restricción; considera también los puntos donde el gradiente de g sea cero, si existen.',
      },
    },
  ],
};

function AntennaDemo({ beats, answer }: DemoProps) {
  const show = beats.beat > 0 || answer !== null;
  return (
    <Stage>
      <PlaneClip P={ANTENNA} />
      <Axes
        P={ANTENNA}
        xTicks={[-2, 0, 2]}
        yTicks={[-2, 2]}
        xLabel="\text{este (km)}"
        yLabel="\text{norte (km)}"
      />
      <circle
        cx={ANTENNA.x(0)}
        cy={ANTENNA.y(0)}
        r={2 * ANTENNA.sx}
        fill={C.cyan}
        fillOpacity={0.08}
        stroke={C.cyan}
        strokeWidth={3}
      />
      <Dot x={ANTENNA.x(0)} y={ANTENNA.y(0)} color={C.text} />
      <Cap x={ANTENNA.x(0)} y={ANTENNA.y(0) + 40} size={18}>
        Cuartel
      </Cap>
      <Cap x={1230} y={220} tex="f=3x+4y" color={C.amber} />
      <Cap x={1230} y={300} tex="x^2+y^2\le4" color={C.cyan} />
      <Cap x={1230} y={385} size={20}>
        Radio disponible: 2 km.
      </Cap>
      {show && (
        <>
          <SignalLevel value={10} radius={2} />
          <Arrow from={ANTENNA.pt(0, 0)} to={ANTENNA.pt(1.2, 1.6)} color={C.green} width={4} />
          <Dot x={ANTENNA.x(1.2)} y={ANTENNA.y(1.6)} color={C.green} />
          <Cap x={1230} y={490} tex="P=(1{,}2;1{,}6)\,\mathrm{km}" color={C.green} />
        </>
      )}
      {beats.beat === 1 && answer !== null && (
        <>
          <Cap x={1230} y={575} tex="f(P)=3(1{,}2)+4(1{,}6)=10" color={C.amber} size={21} />
          <Cap x={1230} y={655} tex="1{,}2^2+1{,}6^2=4" color={C.cyan} />
        </>
      )}
    </Stage>
  );
}

function BatteryPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 97 + round);
    const k = pick(r, [1, 2, 3]),
      t = k === 2 ? pick(r, [2, 4, 6]) : randInt(r, 2, 6);
    const total = (k + 1) * t;
    // On x+y=total: xy-(k-1)x²/2 = total*x-(k+1)x²/2.
    // Its unique global maximum is at the integer pair (t,k*t).
    return { k, t, total, x: t, y: k * t, maximum: ((k + 1) * t * t) / 2 };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  const { k, total, x, y, maximum } = data;
  const objective = k === 1 ? 'xy' : `xy-${k === 2 ? '\\tfrac12' : ''}x^2`;
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      `Maximiza $f=${objective}$ con $x+y=${total}$, $x,y\\ge0$. ` +
        (round < 2 ? 'Escribe las coordenadas x e y del máximo.' : 'Escribe el valor máximo de f.'),
    );
    api.hints([
      'La restricción tiene gradiente (1,1): iguala fₓ y fᵧ.',
      `Obtienes $y=${k}x$. Combina esa relación con la suma fija${round === 2 ? ' y evalúa el objetivo completo' : ''}.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseNum(first);
    if (v === null) return;
    if (round < 2) {
      const w = parseNum(second);
      if (w === null) return;
      if (Math.abs(v - x) < 0.011 && Math.abs(w - y) < 0.011)
        return api.result(
          true,
          `$x=${x}$, $y=${y}$: suman ${total} y cumplen $y=${k}x$. La parábola sobre la restricción abre hacia abajo.`,
        );
      if (Math.abs(v + w - total) >= 0.011)
        return api.result(
          false,
          `Tu punto no cumple la batería disponible: $x+y=${num(v + w)}$, pero debe ser ${total}.`,
        );
      if (k > 1 && v === y && w === x)
        return api.result(
          false,
          `Intercambiaste las coordenadas. La condición es $y=${k}x$, con y como segunda coordenada.`,
        );
      if (k > 1 && Math.abs(v - w) < 0.011)
        return api.result(
          false,
          `El término en x² cambia el reparto: aquí $f_x=y-(${k - 1})x$ y $f_y=x$, así que $y=${k}x$.`,
        );
      return api.result(
        false,
        `Cumples la suma, pero $y-${k}x=${num(w - k * v)}$ debe ser cero para el máximo. Iguala las parciales del objetivo.`,
      );
    }
    if (Math.abs(v - maximum) < 0.011)
      return api.result(
        true,
        `$P=${pair([x, y])}$; $f(P)=${num(maximum)}$. Sobre la restricción, la segunda derivada es $-${k + 1}<0$.`,
      );
    if (v === x || v === y)
      return api.result(
        false,
        'Escribiste una coordenada. Esta ronda pide el valor del objetivo en el punto óptimo.',
      );
    if (k > 1 && v === x * y)
      return api.result(false, 'Calculaste solo xy. Falta restar el término en x² del objetivo.');
    if (v === total)
      return api.result(
        false,
        'Esa es la suma disponible de la restricción. Evalúa f en el punto que maximiza.',
      );
    return api.result(
      false,
      `Resuelve $y=${k}x$ y $x+y=${total}$; después reemplaza ambas coordenadas en $f=${objective}$.`,
    );
  };
  const P = plane([0, total], [Math.min(0, ((1 - k) * total * total) / 2), maximum * 1.2], {
    x: 340,
    y: 230,
    w: 550,
    h: 360,
  });
  return (
    <Stage>
      <Axes P={P} xTicks={[0, total]} xLabel="x" yLabel="f" />
      <Curve P={P} f={(u) => total * u - ((k + 1) * u * u) / 2} color={C.amber} />
      <Cap x={620} y={165} tex={`x+y=${total}`} color={C.cyan} />
      <Cap x={620} y={690} size={20}>
        Objetivo sobre la restricción: una parábola.
      </Cap>
      <Cap x={1230} y={230} tex={`f=${objective}`} color={C.amber} />
      <NumberField
        x={1070}
        y={380}
        label={round < 2 ? 'x =' : 'máximo ='}
        value={first}
        onChange={setFirst}
        onEnter={submit}
      />
      {round < 2 && (
        <NumberField
          x={1070}
          y={490}
          label="y ="
          value={second}
          onChange={setSecond}
          onEnter={submit}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-c6',
  world: 'multivariate',
  code: '7.6',
  title: 'La batería',
  subtitle: 'Optimización con restricción (Lagrange)',
  glyph: '\\nabla f=\\lambda\\nabla g',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'La batería limita dónde puede llegar el dron de búsqueda con la antena. Hay que escoger el punto que recibe mejor la señal.',
  learn:
    'Usar gradientes paralelos y la restricción para hallar candidatos de Lagrange y comparar el objetivo.',
  glyphs: ['mv-constraint', 'mv-lagrange'],
  pitfalls: [
    'El candidato debe cumplir la restricción además de las ecuaciones de las pendientes.',
    'Lagrange encuentra candidatos; compara sus valores para decidir máximo o mínimo.',
    'El método regular requiere que el gradiente de la restricción no sea cero.',
    'Una coordenada óptima y el valor del máximo son respuestas distintas.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Bajo el alero del cuartel, el cargador parpadea. Tomás sostiene el dron de búsqueda para que las patas no toquen el agua.',
        },
        {
          who: 'tomas',
          text: 'Con la antena a bordo, la batería alcanza para un radio de dos kilómetros desde el cuartel. Fuera de eso tendría que ir a buscar otro dron.',
        },
        {
          who: 'teo',
          text: 'La señal mejora hacia el este y el norte, pero no al mismo ritmo. Tengo las mediciones; me falta elegir dónde dejar la antena.',
        },
        { who: 'iris', text: 'Una batería, una ubicación. Haz que esa señal alcance.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La antena',
      Scene: AntennaDemo,
      beats: [
        {
          say: 'La señal crece como $3x+4y$. Dentro del disco no hay punto crítico porque el gradiente es (3, 4); el máximo está en el borde de radio 2 km.',
          ask: {
            prompt: '¿Dónde conviene llevar la antena?',
            options: ['(1,2; 1,6) km', '(0,6; 0,8) km', '(2; 2) km'],
            answer: 0,
            explain:
              'Escala por 2 la dirección óptima del círculo unitario: $2(0{,}6;0{,}8)=(1{,}2;1{,}6)$. El segundo punto llega solo a 1 km del cuartel; (2,2) queda a $\\sqrt8>2$ km.',
          },
          note: {
            label: 'Ubicación de la antena',
            tex: '(x;y)=2(0{,}6;0{,}8)=(1{,}2;1{,}6)\\,\\mathrm{km}',
          },
        },
        {
          say: 'Evalúa la señal en el punto elegido y revisa que use el radio disponible sin excederlo.',
          ask: {
            prompt: '¿Cuál es la intensidad máxima del modelo?',
            options: ['10', '5', '14'],
            answer: 0,
            explain:
              '$3(1{,}2)+4(1{,}6)=3{,}6+6{,}4=10$. Además, $1{,}2^2+1{,}6^2=4$. El 5 corresponde al radio 1; el 14 usaría (2,2), fuera de alcance.',
          },
          note: {
            label: 'Señal máxima',
            tex: 'f(1{,}2;1{,}6)=10',
            body: 'El punto cumple x² + y² = 4. La intensidad se expresa en las unidades del modelo de señal.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Repartir la batería', Comp: BatteryPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Las hélices levantan agua del alero. En la pantalla aparece una barra de señal y se mantiene.',
        },
        {
          who: 'teo',
          text: 'Antena en (1,2; 1,6), señal 10. Ahora sí puedo escuchar desde la quebrada.',
        },
        {
          who: 'tomas',
          text: 'Justo en los dos kilómetros. Si el viento cambia, la vuelta va a ser apretada.',
        },
        { who: 'iris', text: '¿Qué dice el chip?' },
        {
          who: 'teo',
          text: 'Todavía nada legible. El pronóstico acaba de cambiar; la franja de lluvia cubre toda la quebrada.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-constraint',
    world: 'multivariate',
    tex: 'g(x,y)=c',
    name: 'Restricción',
    read: 'ge de equis e i igual a ce',
    meaning: 'Condición que limita los puntos disponibles al optimizar una función.',
  },
  {
    id: 'mv-lagrange',
    world: 'multivariate',
    tex: '\\nabla f=\\lambda\\nabla g',
    name: 'Multiplicador de Lagrange',
    read: 'gradiente de efe igual a lambda por gradiente de ge',
    meaning:
      'En un extremo regular con restricción, los gradientes son paralelos. Resuelve esta ecuación junto con g(x,y)=c.',
    warn: 'Revisa los candidatos y los puntos donde el gradiente de g sea cero; las ecuaciones por sí solas no aseguran un máximo.',
  },
];
