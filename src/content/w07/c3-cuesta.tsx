import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Dot, Line } from '../../engine/shapes';
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
import { ContourMap, F, GradField, H, niceLevels, num, pair, polynomial, type V2 } from './kit';

const MAP = plane([-2, 4], [-1, 5], { x: 300, y: 170, w: 560, h: 560 });
const PRACTICE = plane([-3, 4], [-3, 4], { x: 300, y: 170, w: 560, h: 560 });
const SEARCH = plane([0, 8], [0, 8], { x: 300, y: 170, w: 560, h: 560 });
const CONTOURS = [-6, 0, 3, 6, 12];
const HEIGHTS = [20, 40, 60, 80, 100, 120, 140, 166, 180];
const G: V2 = [8, -1];
const NORM = Math.sqrt(65);
const DIRECTION = Math.atan2(G[1], G[0]);
const FALL: V2 = [12, 8];
const downhill = (x: number, y: number): V2 => [4 * x, 2 * y];

function GradientLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [angle, setAngle] = useState(Math.PI / 2);
  const { beat, at } = beats;
  const onDirection = useSvgDrag(svg, (px, py) => {
    const [x, y] = MAP.inv(px, py);
    if (Math.hypot(x - 1, y - 2) < 0.1) return;
    const a = Math.atan2(y - 2, x - 1);
    setAngle(a);
    // The dot product of two unit vectors is cos of their angle, across the ±π seam too.
    if (Math.cos(a - DIRECTION) > Math.cos((8 * Math.PI) / 180)) unlock();
  });
  const u: V2 = beat === 1 ? [Math.cos(angle), Math.sin(angle)] : [3 / 5, 4 / 5];
  const rate = G[0] * u[0] + G[1] * u[1];
  const base = MAP.pt(1, 2);
  const tip = MAP.pt(1 + 1.7 * u[0], 2 + 1.7 * u[1]);
  const gradTip = MAP.pt(1 + 0.22 * G[0], 2 + 0.22 * G[1]);
  return (
    <Stage ref={svg}>
      <Axes P={MAP} xTicks={[-2, 0, 2, 4]} yTicks={[0, 2, 4]} xLabel="x" yLabel="y" />
      <ContourMap P={MAP} f={F} levels={CONTOURS} />
      {beat === 0 && (
        <>
          <Line a={base} b={MAP.pt(2.76, 2)} color={C.amber} dashed progress={at(0)} />
          <Line a={MAP.pt(2.76, 2)} b={gradTip} color={C.magenta} dashed progress={at(0)} />
        </>
      )}
      <Arrow from={base} to={gradTip} color={C.cyan} width={5} progress={beat === 0 ? at(0) : 1} />
      <Cap x={gradTip[0] + 18} y={gradTip[1] + 36} tex="\nabla f" color={C.cyan} />
      <Dot x={base[0]} y={base[1]} color={C.text} />
      <Cap x={base[0] - 20} y={base[1] - 28} tex="(1,2)" />
      <Cap x={1210} y={190} tex="f=x^2+3xy-y^2" />
      <Cap x={1210} y={265} tex="\nabla f(1,2)=(8,-1)" color={C.cyan} />
      {(beat === 1 || beat === 2) && (
        <>
          <Arrow from={base} to={tip} color={C.amber} width={4} />
          <Cap x={1210} y={345} tex={`\\vec u=${pair(u)}`} color={C.amber} />
          <Cap x={1210} y={425} tex={`D_{\\vec u}f=${num(rate)}`} color={C.green} />
        </>
      )}
      {beat === 1 && (
        <>
          <circle
            cx={base[0]}
            cy={base[1]}
            r={1.7 * MAP.sx}
            fill="none"
            stroke={C.line}
            strokeDasharray="6 8"
          />
          <Dot
            x={MAP.x(1 + (1.7 * G[0]) / NORM)}
            y={MAP.y(2 + (1.7 * G[1]) / NORM)}
            color={C.green}
            ring
          />
          <Knob
            x={tip[0]}
            y={tip[1]}
            r={13}
            color={C.amber}
            onPointerDown={onDirection}
            label="u"
          />
          <Cap x={1210} y={510} size={19}>
            Gira la flecha hasta la marca verde.
          </Cap>
        </>
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1210} y={535} tex="\|\nabla f\|=\sqrt{65}\approx8{,}06" color={C.cyan} />
      )}
      {beat === 3 && (
        <>
          <Line a={MAP.pt(0.8, 0.4)} b={MAP.pt(1.2, 3.6)} color={C.magenta} dashed width={3} />
          <polyline
            points={[
              [1 + (0.22 * G[0]) / NORM, 2 + (0.22 * G[1]) / NORM],
              [1 + (0.22 * (G[0] + 1)) / NORM, 2 + (0.22 * (G[1] + 8)) / NORM],
              [1 + 0.22 / NORM, 2 + (0.22 * 8) / NORM],
            ]
              .map(([x, y]) => MAP.pt(x, y).join(','))
              .join(' ')}
            fill="none"
            stroke={C.text}
            strokeWidth={2}
          />
          <Cap x={1210} y={365} tex="f(1,2)=3" color={C.magenta} />
          <Cap x={1210} y={445} size={20}>
            La flecha cruza el nivel en ángulo recto.
          </Cap>
        </>
      )}
      {beat === 4 && (
        <>
          <Arrow
            from={base}
            to={MAP.pt(1 - 0.22 * G[0], 2 - 0.22 * G[1])}
            color={C.red}
            width={5}
            progress={at(4)}
          />
          <Cap x={1210} y={370} color={C.red} tex="-\nabla f=(-8,1)" />
          <Cap
            x={1210}
            y={455}
            tex="D_{-\nabla f/\|\nabla f\|}f=-\sqrt{65}"
            size={21}
            color={C.red}
          />
          <Cap x={1210} y={540} size={20}>
            El mayor descenso va en sentido opuesto.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Gradiente y derivada direccional',
  Scene: GradientLesson,
  beats: [
    {
      say: 'Junta las pendientes hacia el este y el norte en una flecha. Ese vector es el **gradiente**; aquí sus componentes son 8 y −1.',
      dur: 3,
      board: {
        label: 'Gradiente',
        tex: '\\p{1}{\\cC{\\nabla f}}=(\\p{2}{\\cA{f_x}},\\p{3}{\\cM{f_y}})',
        body: 'En (1, 2), $\\nabla f=(8,-1)$.',
        parts: ['flecha de máxima subida', 'pendiente hacia el este', 'pendiente hacia el norte'],
      },
    },
    {
      say: 'Gira la flecha unitaria y mira la tasa de subida en esa dirección. La **derivada direccional** se obtiene con el producto punto.',
      gate: 'Arrastra la punta hasta alinearla con el gradiente, cerca de la marca verde.',
      board: {
        label: 'Derivada direccional',
        tex: '\\p{1}{D_{\\vec u}f}=\\p{2}{\\cC{\\nabla f}}\\cdot\\p{3}{\\cA{\\vec u}}',
        body: 'La dirección debe tener norma 1: $\\|\\vec u\\|=1$.',
        parts: ['subida en esa dirección', 'flecha de máxima subida', 'dirección de norma uno'],
      },
    },
    {
      say: 'En la dirección $\\vec u=(\\tfrac35,\\tfrac45)$, la subida vale 4. Al alinear la dirección con el gradiente alcanzas su norma.',
      ask: {
        prompt: '¿Cuál es la mayor tasa de subida posible en $(1,2)$?',
        options: ['$\\sqrt{65}\\approx8{,}06$', '8', '4'],
        answer: 0,
        explain:
          '$\\|\\nabla f\\|=\\sqrt{8^2+(-1)^2}=\\sqrt{65}\\approx8{,}06$. El 8 mide solo la subida en x; el 4 corresponde a la dirección dada.',
      },
      board: {
        label: 'Producto punto',
        tex: '\\begin{aligned}\\p{1}{D_{\\vec u}f}&=\\p{2}{8\\cdot0{,}6-1\\cdot0{,}8}\\\\&=\\p{3}{4}\\end{aligned}',
        parts: ['subida que buscamos', 'con los datos del caso', 'subida por unidad'],
      },
    },
    {
      say: 'Mira la curva que pasa por el punto: el gradiente es perpendicular a ella. Caminar por esa curva mantiene la altura, así que la pendiente en su tangente es cero.',
      dur: 3,
      board: {
        label: 'Gradiente y niveles',
        tex: '\\p{1}{\\cC{\\nabla f}}\\perp\\p{2}{\\text{curva de nivel}}',
        body: 'En un punto regular, donde $\\nabla f\\ne\\vec 0$.',
        parts: ['flecha de máxima subida', 'camino de igual altura'],
      },
    },
    {
      say: 'Da vuelta el gradiente y tienes el **máximo descenso**. En este modelo, el agua y un objeto que rueda bajan siguiendo esa dirección.',
      dur: 3,
      board: [
        {
          label: 'Máximo ascenso',
          tex: '\\begin{aligned}\\p{1}{\\text{dirección}}&:\\p{2}{\\cC{\\nabla f}}\\\\\\p{3}{\\text{tasa máxima}}&=\\p{4}{\\|\\nabla f\\|}\\end{aligned}',
          parts: [
            'hacia dónde subir',
            'flecha de máxima subida',
            'cuánto se puede subir',
            'mayor subida por unidad',
          ],
        },
        {
          label: 'Máximo descenso',
          tex: '\\begin{aligned}\\p{1}{\\text{dirección}}&:\\p{2}{-\\cC{\\nabla f}}\\\\\\p{3}{\\text{tasa mínima}}&=\\p{4}{-\\|\\nabla f\\|}\\end{aligned}',
          parts: [
            'hacia dónde bajar',
            'flecha de máxima bajada',
            'cuánto cambia la altura',
            'mayor bajada por unidad',
          ],
        },
      ],
    },
  ],
};

function FallDemo({ beats, answer, reduced }: DemoProps) {
  const revealed = beats.beat > 0 || answer !== null;
  const progress = beats.beat === 0 ? 0 : reduced ? 1 : beats.at(1);
  // Integral curve of -∇H=(4x,2y): x=3e^(4t), y=4e^(2t).
  // Eliminating t gives x=3y²/16. The drawn ravine begins at y=6.
  const path = Array.from({ length: 101 }, (_, i) => {
    const y = 4 + (2 * progress * i) / 100;
    return SEARCH.pt((3 * y * y) / 16, y).join(',');
  }).join(' ');
  return (
    <Stage>
      <rect
        x={SEARCH.box.x}
        y={SEARCH.y(6.35)}
        width={SEARCH.box.w}
        height={SEARCH.y(6) - SEARCH.y(6.35)}
        fill={C.bg}
        stroke={C.dim}
        strokeDasharray="6 8"
      />
      <Cap x={SEARCH.x(1.15)} y={SEARCH.y(6.65)} size={18} color={C.muted}>
        Quebrada Jaime
      </Cap>
      <Axes
        P={SEARCH}
        xTicks={[0, 2, 4, 6, 8]}
        yTicks={[2, 4, 6, 8]}
        xLabel="\text{este (km)}"
        yLabel="\text{norte (km)}"
      />
      <ContourMap P={SEARCH} f={H} levels={HEIGHTS} />
      <GradField P={SEARCH} grad={downhill} color={C.red} />
      <Dot x={SEARCH.x(3)} y={SEARCH.y(4)} color={C.green} />
      <Cap x={SEARCH.x(3) - 25} y={SEARCH.y(4) + 25} tex="(3,4)" />
      {revealed && (
        <Arrow from={SEARCH.pt(3, 4)} to={SEARCH.pt(4.5, 5)} color={C.amber} width={5} />
      )}
      {beats.beat === 1 && (
        <>
          <polyline points={path} fill="none" stroke={C.green} strokeWidth={5} />
          <Dot
            x={SEARCH.x((3 * (4 + 2 * progress) ** 2) / 16)}
            y={SEARCH.y(4 + 2 * progress)}
            color={C.green}
          />
        </>
      )}
      <Cap x={1230} y={210} tex="H=200-2x^2-y^2" />
      <Cap x={1230} y={285} tex="\nabla H=(-4x,-2y)" color={C.cyan} />
      {revealed && (
        <>
          <Cap x={1230} y={380} tex="-\nabla H(3,4)=(12,8)" color={C.amber} />
          <Cap x={1230} y={460} tex={`\\vec u=\\frac{(12,8)}{\\sqrt{208}}`} />
          <Cap
            x={1230}
            y={530}
            tex={`\\vec u\\approx${pair([FALL[0] / Math.hypot(...FALL), FALL[1] / Math.hypot(...FALL)])}`}
            color={C.green}
          />
        </>
      )}
      {beats.beat === 1 && (
        <Cap x={1230} y={635} size={19}>
          La dirección cambia a medida que baja.
        </Cap>
      )}
    </Stage>
  );
}

function GradientPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 79 + round);
    const poly = polynomial(
      pick(r, [-3, -2, 1, 2, 3]),
      pick(r, [-3, -1, 1, 2, 3]),
      pick(r, [-3, -2, 1, 2, 3]),
    );
    const p: V2 = [randInt(r, -2, 3), pick(r, [-2, -1, 1, 2, 3])];
    const u = pick(r, [
      [3 / 5, 4 / 5],
      [4 / 5, -3 / 5],
    ] as V2[]);
    const g = poly.gradient(...p);
    const levels = niceLevels(PRACTICE, poly.f);
    return { poly, p, u, g, levels, rate: g[0] * u[0] + g[1] * u[1], norm: Math.hypot(...g) };
  }, [seed, round]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const { poly, p, u, g, levels, rate, norm } = data;
  const uTex = u[0] === 3 / 5 ? '(\\tfrac35,\\tfrac45)' : '(\\tfrac45,-\\tfrac35)';
  useEffect(() => {
    setFirst('');
    setSecond('');
    const prefix = `Para $f(x,y)=${poly.tex}$ en $${pair(p)}$, `;
    api.prompt(
      prefix +
        (round === 0
          ? 'escribe las dos componentes del gradiente.'
          : round === 1
            ? `calcula la derivada en la dirección unitaria $\\vec u=${uTex}$.`
            : 'calcula la norma del gradiente con dos decimales.'),
    );
    api.hints(
      round === 0
        ? [
            'Deriva en x dejando y fija y después en y dejando x fija.',
            'Evalúa ambas parciales en el punto, en el orden x, y.',
          ]
        : round === 1
          ? [
              'Calcula primero las dos parciales en el punto.',
              'Multiplica cada componente del gradiente por la correspondiente de u y suma, con sus signos.',
            ]
          : [
              'Calcula primero el gradiente en el punto.',
              'Eleva al cuadrado sus dos componentes, suma y saca raíz.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const a = parseNum(first);
    if (a === null) return;
    if (round === 0) {
      const b = parseNum(second);
      if (b === null) return;
      if (Math.abs(a - g[0]) < 0.011 && Math.abs(b - g[1]) < 0.011)
        return api.result(true, `$\\nabla f${pair(p)}=${pair(g)}$.`);
      if (a === g[1] && b === g[0])
        return api.result(
          false,
          'Intercambiaste las parciales. La primera componente es fₓ; la segunda, fᵧ.',
        );
      if (a === -g[0] && b === -g[1])
        return api.result(
          false,
          'Ese es el máximo descenso. El gradiente lleva el signo de las parciales y apunta al ascenso.',
        );
      return api.result(
        false,
        `Revisa la parcial en ${Math.abs(a - g[0]) >= 0.011 ? 'x: deja y fija' : 'y: deja x fija'}. Deriva antes de reemplazar las coordenadas.`,
      );
    }
    if (round === 1) {
      if (Math.abs(a - rate) < 0.011)
        return api.result(
          true,
          `$D_{\\vec u}f=${num(g[0])}\\cdot(${num(u[0])})+(${num(g[1])})\\cdot(${num(u[1])})=${num(rate)}$.`,
        );
      if (Math.abs(a - norm) < 0.011)
        return api.result(
          false,
          'Esa es la máxima subida. Aquí la dirección ya está fijada: usa el producto punto con u.',
        );
      if (a === g[0] || a === g[1])
        return api.result(
          false,
          'Una parcial mide solo un eje. Esta dirección combina los dos: multiplica y suma ambas componentes.',
        );
      if (Math.abs(a + rate) < 0.011)
        return api.result(
          false,
          'El signo quedó invertido. Conserva el signo de cada componente, también el de u.',
        );
      return api.result(
        false,
        'El producto punto da un número: fₓu₁ + fᵧu₂. La dirección dada ya tiene norma 1.',
      );
    }
    if (Math.abs(a - norm) < 0.011)
      return api.result(
        true,
        `$\\|\\nabla f\\|=\\sqrt{${g[0] ** 2}+${g[1] ** 2}}\\approx${num(norm)}$.`,
      );
    if (a === g[0] ** 2 + g[1] ** 2)
      return api.result(false, 'Falta sacar la raíz: calculaste la norma al cuadrado.');
    if (a === Math.abs(g[0]) + Math.abs(g[1]))
      return api.result(
        false,
        'Sumaste los módulos. La norma es la hipotenusa: suma los cuadrados y saca raíz.',
      );
    if (a < 0)
      return api.result(
        false,
        'Una norma no puede ser negativa. Los cuadrados eliminan los signos de las componentes.',
      );
    return api.result(
      false,
      'Calcula ambas parciales, evalúalas y usa Pitágoras. Redondea a dos decimales al final.',
    );
  };
  return (
    <Stage>
      <ContourMap P={PRACTICE} f={poly.f} levels={levels} />
      <Dot x={PRACTICE.x(p[0])} y={PRACTICE.y(p[1])} color={C.amber} />
      <Cap x={PRACTICE.x(p[0]) + 30} y={PRACTICE.y(p[1]) - 25} tex={pair(p)} color={C.amber} />
      <Cap x={1210} y={220} tex={`f(x,y)=${poly.tex}`} />
      {round === 1 && <Cap x={1210} y={310} tex={`\\vec u=${uTex}`} color={C.cyan} />}
      <NumberField
        x={1040}
        y={420}
        label={round === 0 ? 'fₓ =' : round === 1 ? 'Dᵤf =' : '‖∇f‖ ='}
        value={first}
        onChange={setFirst}
        onEnter={submit}
      />
      {round === 0 && (
        <NumberField
          x={1040}
          y={520}
          label="fᵧ ="
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
  id: 'w7-c3',
  world: 'multivariate',
  code: '7.3',
  title: 'Cuesta abajo',
  subtitle: 'Gradiente y derivada direccional',
  glyph: '\\nabla f',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'La lluvia baja en diagonal. Hay que seguir la caída del dron hasta la quebrada antes de que el agua lo arrastre.',
  learn:
    'Calcular el gradiente y la derivada direccional, reconocer el máximo ascenso y seguir el máximo descenso.',
  glyphs: ['mv-gradient', 'mv-directional'],
  pitfalls: [
    'El gradiente apunta al máximo ascenso; para bajar se usa su opuesto.',
    'En la derivada direccional, la dirección debe ser unitaria.',
    'La norma usa la raíz de la suma de cuadrados, no la suma de las componentes.',
    'El gradiente es perpendicular a la curva de nivel en puntos donde no es cero.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Más abajo, en el sendero abierto, el agua golpeaba una lata escondida entre el pasto.',
        },
        {
          who: 'teo',
          text: 'La bajada al este es mayor, pero el agua también se va hacia el norte. Si sigo solo un eje, me paso de largo.',
        },
        { who: 'tu', text: 'Juntemos las dos pendientes. El dron pudo seguir esa misma diagonal.' },
        {
          who: 'tomas',
          text: 'Puedo bajar con cuerda cuando tengamos una ruta. A tientas solo sumamos otro rescate.',
        },
        { who: 'iris', text: 'Entonces nadie baja hasta que la ruta esté en el mapa.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Por dónde cayó',
      Scene: FallDemo,
      beats: [
        {
          say: 'En el terreno $H=200-2x^2-y^2$, las flechas rojas muestran el máximo descenso. El dron cayó desde $(3,4)$.',
          ask: {
            prompt: '¿Cuál es la dirección unitaria inicial de caída?',
            options: [
              '$(0{,}83;\\,0{,}55)$, aproximadamente',
              '$(-0{,}83;\\,-0{,}55)$, aproximadamente',
              '$(1,0)$, hacia el este',
            ],
            answer: 0,
            explain:
              '$-\\nabla H(3,4)=(12,8)$. Su norma es $\\sqrt{208}$; al dividir queda aproximadamente $(0{,}83;\\,0{,}55)$. El opuesto subiría y el este solo ignora la pendiente norte.',
          },
          note: {
            label: 'Caída inicial',
            tex: '-\\nabla H(3,4)=(12,8)',
            body: 'Dirección unitaria: aproximadamente $(0{,}83;\\,0{,}55)$. Las coordenadas del terreno están en km y la altura en m.',
          },
        },
        {
          say: 'Sigue el campo desde ese punto: la trayectoria se curva porque el gradiente cambia con la posición. La ruta termina en la quebrada Jaime.',
          dur: 4,
          note: {
            label: 'Trayectoria de descenso',
            tex: '\\vec u(x,y)=\\frac{-\\nabla H(x,y)}{\\|\\nabla H(x,y)\\|}',
            body: 'La dirección inicial sirve solo al partir; se vuelve a calcular a lo largo de la ruta.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Seguir la bajada', Comp: GradientPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Tomás limpió la pantalla con la manga. La radio que llevaba al hombro soltó un chasquido y quedó muda.',
        },
        {
          who: 'teo',
          text: 'La trayectoria llega a la quebrada Jaime, y en vez de seguir una recta se va doblando con la ladera.',
        },
        {
          who: 'tomas',
          text: 'Ahí mismo perdí la señal. Conozco el borde, pero nunca he bajado al fondo.',
        },
        { who: 'iris', text: 'El chip del dron debería seguir transmitiendo desde abajo.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'mv-gradient',
    world: 'multivariate',
    tex: '\\nabla f=(f_x,f_y)',
    name: 'Gradiente',
    read: 'nabla de efe',
    meaning:
      'Vector de derivadas parciales. Apunta al máximo ascenso y es perpendicular a la curva de nivel en un punto regular.',
  },
  {
    id: 'mv-directional',
    world: 'multivariate',
    tex: 'D_{\\vec u}f=\\nabla f\\cdot\\vec u',
    name: 'Derivada direccional',
    read: 'derivada de efe en la dirección u',
    meaning: 'Tasa de cambio por unidad de distancia en la dirección unitaria u.',
    warn: 'Si la dirección dada no tiene norma 1, normalízala antes de usar el producto punto.',
  },
];
