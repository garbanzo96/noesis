import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import { Dot, Line } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Surface, num, ortho, pair, polynomial, saddle, type Field, type V2 } from './kit';

const cubic: Field = (x, y) => x ** 3 - 3 * x + y * y;
const pass: Field = (x, y) => saddle(x, y) + 50;
const TYPES = ['Mínimo', 'Máximo', 'Silla'];
const EXAMPLES = [
  {
    label: 'Máximo · cumbre',
    f: (x: number, y: number) => -x * x - y * y,
    tex: '-x^2-y^2',
    color: C.cyan,
  },
  {
    label: 'Mínimo · hoyo',
    f: (x: number, y: number) => x * x + y * y,
    tex: 'x^2+y^2',
    color: C.amber,
  },
  { label: 'Silla · portezuelo', f: saddle, tex: 'x^2-y^2', color: C.magenta },
];

/** beat 2: the student turns a vertical cut through the three shapes (angle in degrees) */
const DIAL = { x0: 620, x1: 1020, y: 815 };

function ThreeTypes({ theta }: { theta?: number }) {
  const c = Math.cos(((theta ?? 0) * Math.PI) / 180);
  const s = Math.sin(((theta ?? 0) * Math.PI) / 180);
  return (
    <>
      {EXAMPLES.map(({ label, f, tex, color }, i) => {
        const cx = 430 + i * 410;
        const P3 = ortho({ cx, cy: 420, scale: 70, zScale: 0.5, xr: [-1.5, 1.5], yr: [-1.5, 1.5] });
        const section = (axis: 'x' | 'y') =>
          Array.from({ length: 61 }, (_, j) => {
            const t = -1.5 + j / 20;
            return axis === 'x' ? P3(t, 0, f(t, 0)).join(',') : P3(0, t, f(0, t)).join(',');
          }).join(' ');
        return (
          <g key={label}>
            <Surface f={f} P3={P3} color={color} n={18} opacity={0.4} />
            <polyline
              points={section('x')}
              fill="none"
              stroke={C.amber}
              strokeWidth={4}
              opacity={theta === undefined ? 1 : 0.35}
            />
            <polyline
              points={section('y')}
              fill="none"
              stroke={C.magenta}
              strokeWidth={4}
              opacity={theta === undefined ? 1 : 0.35}
            />
            {theta !== undefined && (
              <polyline
                points={Array.from({ length: 61 }, (_, j) => {
                  const t = -1.5 + j / 20;
                  return P3(t * c, t * s, f(t * c, t * s)).join(',');
                }).join(' ')}
                fill="none"
                stroke={C.green}
                strokeWidth={5}
              />
            )}
            <Dot x={P3(0, 0, 0)[0]} y={P3(0, 0, 0)[1]} color={C.green} r={7} />
            <Cap x={cx} y={190} color={color}>
              {label}
            </Cap>
            <Cap x={cx} y={640} tex={`z=${tex}`} color={color} />
          </g>
        );
      })}
    </>
  );
}

function CriticalLesson({ beats, answer, unlock }: DemoProps) {
  const { beat, at } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [th, setTh] = useState(0);
  const onTh = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - DIAL.x0) / (DIAL.x1 - DIAL.x0), 0, 1) * 90);
    setTh(v);
    if (v >= 60) unlock();
  });
  const P3 = ortho({ cx: 650, cy: 420, scale: 95, zScale: 0.3, xr: [-1.8, 1.8], yr: [-1.6, 1.6] });
  const horizontalPatch = (x: number) =>
    [
      P3(x - 0.35, -0.35, cubic(x, 0)),
      P3(x + 0.35, -0.35, cubic(x, 0)),
      P3(x + 0.35, 0.35, cubic(x, 0)),
      P3(x - 0.35, 0.35, cubic(x, 0)),
    ]
      .map((p) => p.join(','))
      .join(' ');
  return (
    <Stage ref={svg}>
      {beat === 2 || beat === 5 ? (
        <>
          <ThreeTypes theta={beat === 2 ? th : undefined} />
          <Cap x={820} y={745} size={20}>
            {beat === 2
              ? `Corte verde a ${th}° del eje x: en la silla ${Math.cos((2 * th * Math.PI) / 180) > 0.02 ? 'sube' : Math.cos((2 * th * Math.PI) / 180) < -0.02 ? 'baja' : 'queda plano'} desde el centro.`
              : 'Corte ámbar: eje x. Corte magenta: eje y.'}
          </Cap>
          {beat === 2 && (
            <>
              <line
                x1={DIAL.x0}
                x2={DIAL.x1}
                y1={DIAL.y}
                y2={DIAL.y}
                stroke={C.dim}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <Cap x={DIAL.x0 - 62} y={DIAL.y + 6} size={18} color={C.muted}>
                0°
              </Cap>
              <Cap x={DIAL.x1 + 62} y={DIAL.y + 6} size={18} color={C.muted}>
                90°
              </Cap>
              <Knob
                x={DIAL.x0 + ((DIAL.x1 - DIAL.x0) * th) / 90}
                y={DIAL.y}
                color={C.green}
                onPointerDown={onTh}
                cursor="ew-resize"
              />
            </>
          )}
        </>
      ) : (
        <>
          <Surface f={cubic} P3={P3} />
          {[1, -1]
            .filter((x) => beat > 0 || x === 1)
            .map((x) => {
              const q = P3(x, 0, cubic(x, 0));
              return (
                <g key={x}>
                  <polygon
                    points={horizontalPatch(x)}
                    fill={C.amber}
                    fillOpacity={0.15}
                    stroke={C.amber}
                  />
                  <Dot x={q[0]} y={q[1]} color={C.green} />
                  <Cap x={q[0] + 15} y={q[1] - 35} tex={`(${x},0)`} size={19} />
                </g>
              );
            })}
          <Cap x={650} y={155} tex="f=x^3-3x+y^2" />
          <Cap x={650} y={695} size={19}>
            Los planos marcados son horizontales.
          </Cap>
          <Cap x={1220} y={220} tex="f_x=3x^2-3,\quad f_y=2y" size={21} />
          {beat >= 1 && <Cap x={1220} y={300} tex="(1,0),\quad(-1,0)" color={C.green} />}
          {beat >= 3 && (
            <>
              <Cap x={1220} y={390} tex="f_{xx}=6x,\quad f_{yy}=2" color={C.amber} />
              <Cap x={1220} y={455} tex="f_{xy}=0,\quad D=12x" color={C.magenta} />
            </>
          )}
          {beat === 4 && answer !== null && (
            <>
              <Cap x={1220} y={560} tex="D(-1,0)=-12<0" color={C.magenta} />
              <Cap x={1220} y={625} tex="D(1,0)=12,\quad f_{xx}=6" color={C.amber} size={21} />
              <Cap x={1220} y={700} size={20}>
                Silla a la izquierda; mínimo a la derecha.
              </Cap>
            </>
          )}
          {beat === 0 && (
            <Line
              a={P3(0.6, 0, -2)}
              b={P3(1.4, 0, -2)}
              color={C.amber}
              width={4}
              progress={at(0)}
            />
          )}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Puntos críticos y segunda derivada',
  Scene: CriticalLesson,
  beats: [
    {
      say: 'Mira el plano horizontal: las dos pendientes valen cero. En una superficie suave, eso marca un **punto crítico**, donde el gradiente se anula.',
      dur: 3,
      board: {
        label: 'Punto crítico',
        tex: '\\p{1}{\\cC{\\nabla f}}=\\p{2}{\\vec0}',
        body: 'Para una función diferenciable: $f_x=0$ y $f_y=0$.',
        parts: ['pendientes del terreno', 'ambas pendientes nulas'],
      },
    },
    {
      say: 'Deriva el ejemplo y anula ambas parciales. La primera ecuación da dos valores de x; la segunda fija y en cero.',
      dur: 3,
      board: [
        {
          label: 'Buscar puntos críticos',
          tex: '\\begin{aligned}\\p{1}{\\cA{f_x}=3x^2-3=0}&\\Rightarrow\\p{2}{x=\\pm1}\\\\\\p{3}{\\cM{f_y}=2y=0}&\\Rightarrow\\p{4}{y=0}\\end{aligned}',
          parts: [
            'anular pendiente al este',
            'posiciones al este posibles',
            'anular pendiente al norte',
            'posición al norte posible',
          ],
        },
        {
          label: 'Candidatos',
          tex: '\\p{1}{(1,0)},\\quad\\p{2}{(-1,0)}',
          parts: ['primer punto crítico', 'segundo punto crítico'],
        },
      ],
    },
    {
      say: 'Una cumbre baja hacia todos lados; un hoyo sube hacia todos lados. En una **silla**, como un portezuelo, un corte sube y otro baja.',
      gate: 'Gira el corte verde de 0° a 90°: en la silla pasa de subir a bajar.',
      board: {
        label: 'Tres formas',
        tex: '\\p{1}{\\cC{\\text{máximo}}},\\quad\\p{2}{\\cA{\\text{mínimo}}},\\quad\\p{3}{\\cM{\\text{silla}}}',
        parts: ['cumbre del terreno', 'hoyo del terreno', 'paso entre cerros'],
      },
    },
    {
      say: 'Las segundas parciales forman la matriz hessiana. Su determinante permite distinguir las formas; en este ejemplo vale 12x.',
      dur: 3,
      board: [
        {
          label: 'Determinante del hessiano',
          tex: '\\p{1}{D}=\\p{2}{\\cA{f_{xx}f_{yy}}}-\\p{3}{\\cM{f_{xy}^2}}',
          body: 'Aplica el criterio en un punto crítico con segundas parciales continuas cerca de él.',
          parts: ['criterio de curvatura', 'producto de curvaturas', 'efecto del cambio cruzado'],
        },
        {
          label: 'Hessiano del ejemplo',
          tex: '\\p{1}{D}=(\\p{2}{6x})(\\p{3}{2})-0=\\p{4}{12x}',
          parts: [
            'criterio de curvatura',
            'curvatura hacia el este',
            'curvatura hacia el norte',
            'criterio según la posición',
          ],
        },
      ],
    },
    {
      say: 'Evalúa el determinante en cada candidato. Un valor negativo indica que hay direcciones de subida y de bajada.',
      ask: {
        prompt: '¿Qué es $(-1,0)$?',
        options: ['Una silla: $D=-12<0$', 'Un mínimo', 'Un máximo'],
        answer: 0,
        explain:
          'En $(-1,0)$, $D=-12<0$: silla. En $(1,0)$, $D=12>0$ y $f_{xx}=6>0$: mínimo local.',
      },
      board: {
        label: 'Clasificar los candidatos',
        tex: '\\p{1}{D(-1,0)=-12},\\quad\\p{2}{D(1,0)=12}',
        parts: ['silla en el primer punto', 'mínimo en el segundo punto'],
      },
    },
    {
      say: 'Con determinante positivo, el signo de la curvatura en x decide entre mínimo y máximo. Con determinante cero, este criterio no alcanza para decidir.',
      dur: 3,
      board: {
        label: 'Criterio de la segunda derivada',
        tex: '\\begin{aligned}\\p{1}{D>0,\\ f_{xx}>0}&:\\cA{\\text{mínimo}}\\\\\\p{2}{D>0,\\ f_{xx}<0}&:\\cC{\\text{máximo}}\\\\\\p{3}{D<0}&:\\cM{\\text{silla}}\\\\\\p{4}{D=0}&:\\text{sin conclusión}\\end{aligned}',
        parts: [
          'curvatura hacia arriba',
          'curvatura hacia abajo',
          'sube y baja según dirección',
          'criterio que no decide',
        ],
      },
    },
  ],
};

function PassDemo({ beats, answer }: DemoProps) {
  const show = beats.beat > 0 || answer !== null;
  const base = ortho({ cx: 650, cy: 440, scale: 100, zScale: 0.4, xr: [-2, 2], yr: [-2, 2] });
  const P3 = Object.assign((x: number, y: number, z: number): V2 => base(x, y, z - 50), {
    xr: base.xr,
    yr: base.yr,
  });
  const cut = (axis: 'x' | 'y') =>
    Array.from({ length: 81 }, (_, i) => {
      const t = -2 + i / 20;
      return (axis === 'x' ? P3(t, 0, pass(t, 0)) : P3(0, t, pass(0, t))).join(',');
    }).join(' ');
  return (
    <Stage>
      <Surface f={pass} P3={P3} color={C.cyan} />
      <Dot x={P3(0, 0, 50)[0]} y={P3(0, 0, 50)[1]} color={C.green} />
      <Cap x={650} y={160}>
        Paso entre Barón y Los Placeres
      </Cap>
      <Cap x={650} y={720} tex="(0,0):\quad S=50\,\mathrm m" color={C.green} />
      <Cap x={1230} y={220} tex="S=x^2-y^2+50" />
      <Cap x={1230} y={305} tex="\nabla S=(2x,-2y)" color={C.cyan} />
      <Cap x={1230} y={385} tex="\nabla S(0,0)=(0,0)" />
      {show && (
        <>
          <polyline points={cut('x')} fill="none" stroke={C.amber} strokeWidth={4} />
          <polyline points={cut('y')} fill="none" stroke={C.magenta} strokeWidth={4} />
          <Cap x={1230} y={485} tex="D=2(-2)-0^2=-4" color={C.magenta} />
          <Cap x={1230} y={565} tex="S(x,0)=50+x^2" color={C.amber} />
          <Cap x={1230} y={635} tex="S(0,y)=50-y^2" color={C.magenta} />
        </>
      )}
    </Stage>
  );
}

function CriticalPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 89 + round);
    // Each Hessian is nonsingular. Choose the critical point first, then the linear terms.
    const [a, b, c] = pick(r, [
      [1, 1, 2],
      [2, -2, 3],
      [3, 2, 1],
      [-1, 1, -2],
      [-2, -2, -3],
      [-3, 2, -1],
      [1, 1, -2],
      [2, 3, 1],
      [-1, 2, 2],
    ]);
    const x = randInt(r, -2, 2),
      y = randInt(r, -2, 2);
    const d = -2 * a * x - b * y,
      e = -b * x - 2 * c * y;
    const poly = polynomial(a, b, c);
    const f: Field = (u, v) => poly.f(u, v) + d * u + e * v;
    const term = (k: number, variable: string) =>
      k ? `${k < 0 ? '-' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}${variable}` : '';
    const D = 4 * a * c - b * b;
    return {
      a,
      b,
      c,
      d,
      e,
      x,
      y,
      D,
      f,
      tex: poly.tex + term(d, 'x') + term(e, 'y'),
      type: D < 0 ? 'Silla' : a > 0 ? 'Mínimo' : 'Máximo',
    };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const { a, b, c, d, e, x, y, D, tex, type } = data;
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    api.prompt(
      `Para $f=${tex}$, ` +
        (round === 0
          ? 'halla su punto crítico: escribe x e y.'
          : round === 1
            ? 'calcula el determinante D del hessiano.'
            : `clasifica el punto crítico $${pair([x, y])}$.`),
    );
    api.hints(
      round === 0
        ? [
            'Deriva ambos cuadrados y el término xy; cada término lineal deja su coeficiente.',
            'Resuelve el sistema fₓ = 0, fᵧ = 0; aquí tiene una solución entera.',
          ]
        : [
            'Las segundas parciales son fₓₓ = 2a, fᵧᵧ = 2c y fₓᵧ = b.',
            round === 1
              ? 'Multiplica 2a por 2c y resta el cuadrado de b.'
              : 'D < 0: silla. D > 0: usa el signo de fₓₓ para decidir mínimo o máximo.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === type)
        return api.result(true, `$D=${D}$ y $f_{xx}=${2 * a}$: ${type.toLowerCase()}.`);
      return api.result(
        false,
        D < 0
          ? `Con $D=${D}<0$ hay subida y bajada: es una silla, aunque una parcial segunda sea positiva.`
          : `Con $D=${D}>0$, mira $f_{xx}=${2 * a}$: positivo da mínimo y negativo da máximo.`,
      );
    }
    const v = parseNum(first);
    if (v === null) return;
    if (round === 0) {
      const w = parseNum(second);
      if (w === null) return;
      if (Math.abs(v - x) < 0.011 && Math.abs(w - y) < 0.011)
        return api.result(
          true,
          `$\\nabla f${pair([x, y])}=(0,0)$. Punto crítico: $${pair([x, y])}$.`,
        );
      const fx = 2 * a * v + b * w + d,
        fy = b * v + 2 * c * w + e;
      return api.result(
        false,
        Math.abs(fx) >= 0.011
          ? `En tu punto, $f_x=${num(fx)}$, y debe valer cero. Revisa $f_x=${2 * a}x+(${b})y+(${d})$.`
          : `La ecuación en x se cumple, pero $f_y=${num(fy)}$. Revisa $f_y=(${b})x+(${2 * c})y+(${e})$.`,
      );
    }
    if (Math.abs(v - D) < 0.011) return api.result(true, `$D=(${2 * a})(${2 * c})-(${b})^2=${D}$.`);
    if (v === a * c - b * b)
      return api.result(
        false,
        'Usaste a y c en lugar de las segundas parciales. Los cuadrados dejan 2a y 2c al derivar dos veces.',
      );
    if (v === 4 * a * c - b)
      return api.result(false, 'La parcial mixta se eleva al cuadrado antes de restar.');
    if (v === 4 * a * c + b * b)
      return api.result(false, 'El cuadrado de la parcial mixta se resta, aunque b sea negativo.');
    return api.result(
      false,
      `Usa $f_{xx}=${2 * a}$, $f_{yy}=${2 * c}$ y $f_{xy}=${b}$. Los términos lineales desaparecen al derivar dos veces.`,
    );
  };
  const camera = ortho({ cx: 650, cy: 450, scale: 65, zScale: 0.12 });
  const contactHeight = data.f(x, y);
  const P3 = Object.assign(
    (u: number, v: number, z: number): V2 => camera(u - x, v - y, z - contactHeight),
    { xr: [x - 2, x + 2] as V2, yr: [y - 2, y + 2] as V2 },
  );
  return (
    <Stage>
      <Surface f={data.f} P3={P3} n={20} />
      <Cap x={860} y={155} tex={`f=${tex}`} />
      {round === 0 ? (
        <>
          <NumberField
            x={1080}
            y={365}
            label="x ="
            value={first}
            onChange={setFirst}
            onEnter={submit}
          />
          <NumberField
            x={1080}
            y={475}
            label="y ="
            value={second}
            onChange={setSecond}
            onEnter={submit}
          />
        </>
      ) : round === 1 ? (
        <NumberField
          x={1080}
          y={410}
          label="D ="
          value={first}
          onChange={setFirst}
          onEnter={submit}
        />
      ) : (
        <>
          <Cap x={1230} y={330} tex={`P=${pair([x, y])}`} color={C.green} />
          <Choices x={1230} y={450} options={TYPES} value={choice} onPick={setChoice} />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-c5',
  world: 'multivariate',
  code: '7.5',
  title: 'El portezuelo',
  subtitle: 'Puntos críticos y criterio de la segunda derivada',
  glyph: 'D',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'Un paso entre Barón y Los Placeres permite cruzar bajo el radar. Hay que reconocer su forma en el terreno.',
  learn:
    'Hallar puntos críticos y clasificarlos con el determinante del hessiano y el signo de fₓₓ.',
  glyphs: ['mv-critical', 'mv-hessian'],
  pitfalls: [
    'Gradiente cero no basta para asegurar un máximo o mínimo.',
    'El determinante usa segundas parciales: D = fₓₓfᵧᵧ − fₓᵧ².',
    'Con D > 0 hay que mirar también el signo de fₓₓ.',
    'D = 0 deja el criterio sin conclusión.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'La niebla abrió un hueco entre las casas. Tomás apuntó la linterna hacia el paso y la bajó apenas oyó un motor.',
        },
        {
          who: 'tomas',
          text: 'Entre Barón y Los Placeres hay un portezuelo. Los drones cruzan por ahí bajo el radar; desde la calle parecen las luces de una casa.',
        },
        {
          who: 'teo',
          text: 'Lo tengo en el mapa, pero hacia un lado sube y hacia el otro baja. Si lo marco como cumbre, la ruta queda mal.',
        },
        { who: 'iris', text: 'A ellos les sirve esa ruta. Quiero saber por qué.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La ruta del contrabando',
      Scene: PassDemo,
      beats: [
        {
          say: 'Cerca del paso, el terreno se modela con $S=x^2-y^2+50$. En (0, 0), las dos pendientes son cero.',
          ask: {
            prompt: '¿Qué tipo de punto es (0, 0)?',
            options: [
              'Silla: un corte sube y el otro baja',
              'Mínimo: todos los cortes suben',
              'Máximo: todos los cortes bajan',
            ],
            answer: 0,
            explain:
              '$S_{xx}=2$, $S_{yy}=-2$, $S_{xy}=0$, así que $D=-4<0$. En x sube desde 50; en y baja desde 50.',
          },
          note: {
            label: 'Portezuelo',
            tex: 'D=2(-2)-0^2=-4<0',
            body: 'El punto (0,0) es una silla a 50 m de altura en este modelo local.',
          },
        },
        {
          say: 'Los cortes muestran por qué el paso permite cruzar entre los cerros sin subir a una cumbre. El modelo describe el entorno del portezuelo.',
          dur: 3,
          note: {
            label: 'Dos cortes del paso',
            tex: '\\begin{aligned}S(x,0)&=50+x^2\\\\S(0,y)&=50-y^2\\end{aligned}',
            body: 'La ruta del contrabando aprovecha el paso bajo el radar entre Barón y Los Placeres.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Reconocer el paso', Comp: CriticalPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'El motor se apagó detrás de las casas. La luz del paso siguió encendida, quieta sobre un techo.',
        },
        { who: 'tu', text: 'Es una silla. Por ahí se puede cruzar sin subir a la cumbre.' },
        {
          who: 'tomas',
          text: 'Yo la usaba para rescates cuando se cortaba el camino. Ahora prefiero no levantar la radio.',
        },
        {
          who: 'teo',
          text: 'Para escuchar el chip desde ahí necesito subir una antena. La batería del dron de búsqueda no alcanza para recorrer todo el cerro.',
        },
        { who: 'iris', text: '¿Desde cuándo hay una luz encendida en ese techo?' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-critical',
    world: 'multivariate',
    tex: '\\nabla f(a,b)=\\vec0',
    name: 'Punto crítico',
    read: 'gradiente de efe igual a cero',
    meaning:
      'En una función diferenciable, punto donde las dos parciales se anulan y el plano tangente es horizontal.',
    warn: 'Puede ser máximo, mínimo, silla u otro caso que requiera más estudio.',
  },
  {
    id: 'mv-hessian',
    world: 'multivariate',
    tex: 'D=f_{xx}f_{yy}-f_{xy}^2',
    name: 'Determinante del hessiano',
    read: 'de igual a efe equis equis por efe i i menos efe equis i al cuadrado',
    meaning:
      'En un punto crítico con segundas parciales continuas: D negativo indica silla; D positivo permite distinguir mínimo y máximo con el signo de fₓₓ.',
    warn: 'Si D vale cero, el criterio no concluye.',
  },
];
