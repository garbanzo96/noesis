import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line, PlaneClip } from '../../engine/shapes';
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
import { F, H, Surface, num, ortho, pair, type Projection, type V2 } from './kit';

const L = (x: number, y: number) => 3 + 8 * (x - 1) - (y - 2);
const MAP = plane([0, 2], [1, 3], { x: 1040, y: 230, w: 360, h: 360 });
const PROFILE = plane([2.8, 3.8], [154, 170], { x: 330, y: 210, w: 570, h: 440 });

function TangentLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [point, setPoint] = useState<V2>([1.7, 2.6]);
  const { beat, at } = beats;
  const onPoint = useSvgDrag(svg, (px, py) => {
    const [x, y] = MAP.inv(px, py);
    const p: V2 = [clamp(x, 0, 2), clamp(y, 1, 3)];
    setPoint(p);
    if (Math.hypot(p[0] - 1, p[1] - 2) < 0.15) unlock();
  });
  const zoom = beat === 0 ? (reduced ? 1 : at(0)) : 1;
  const span = 1.5 - 1.15 * zoom;
  const camera = ortho({ cx: 600, cy: 410, scale: 140 / span, zScale: 0.12 });
  // Centre the camera on the contact point while retaining the original x,y domains.
  const P3: Projection = Object.assign(
    (x: number, y: number, z: number): V2 => camera(x - 1, y - 2, z - 3),
    { xr: [1 - span, 1 + span] as V2, yr: [2 - span, 2 + span] as V2 },
  );
  const far = reduced ? 1 : at(4);
  const p: V2 = beat === 2 ? point : beat === 4 ? [1 + far, 2 - far] : [1.1, 1.9];
  const real = F(...p),
    estimate = L(...p);
  const showEstimate = beat !== 3 || answer !== null;
  const relation = beat === 2 || (beat === 4 && far < 1) ? '\\approx' : '=';
  return (
    <Stage ref={svg}>
      <Surface f={F} P3={P3} color={C.cyan} />
      <Surface f={L} P3={P3} color={C.amber} n={8} opacity={0.5} />
      <Dot x={P3(1, 2, 3)[0]} y={P3(1, 2, 3)[1]} color={C.green} />
      <Cap x={600} y={150} tex="f=x^2+3xy-y^2" color={C.cyan} />
      <Cap x={600} y={670} tex="L=3+8(x-1)-(y-2)" color={C.amber} />
      <Cap x={600} y={730} size={19}>
        La malla y el plano se tocan en (1, 2, 3).
      </Cap>
      <Axes P={MAP} xLabel="x" yLabel="y" />
      <circle
        cx={MAP.x(1)}
        cy={MAP.y(2)}
        r={0.15 * MAP.sx}
        fill={C.green}
        fillOpacity={0.12}
        stroke={C.green}
        strokeDasharray="5 5"
      />
      <Dot x={MAP.x(1)} y={MAP.y(2)} color={C.green} r={6} />
      <Cap x={MAP.x(1) - 20} y={MAP.y(2) + 32} tex="(1,2)" size={18} />
      {beat === 2 ? (
        <Knob x={MAP.x(p[0])} y={MAP.y(p[1])} onPointerDown={onPoint} color={C.magenta} r={13} />
      ) : (
        <Dot x={MAP.x(p[0])} y={MAP.y(p[1])} color={C.magenta} />
      )}
      <Cap x={1230} y={175} tex={`P${relation}${pair(p)}`} color={C.magenta} />
      <Cap x={1230} y={650} tex={`f(P)${relation}${num(real)}`} color={C.cyan} />
      {showEstimate && (
        <Cap x={1230} y={705} tex={`L(P)${relation}${num(estimate)}`} color={C.amber} />
      )}
      {showEstimate && (
        <Cap
          x={1230}
          y={760}
          tex={`|f(P)-L(P)|${relation}${num(Math.abs(real - estimate))}`}
          size={20}
        />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Plano tangente y aproximación lineal',
  Scene: TangentLesson,
  beats: [
    {
      say: 'Acércate al punto verde: la superficie suave se parece cada vez más a un plano. El **plano tangente** comparte su altura y sus pendientes en ese punto.',
      dur: 3.5,
      board: {
        label: 'Plano tangente',
        tex: '\\p{1}{\\cC{z}}=\\p{2}{\\cA{L(x,y)}}',
        body: 'En el punto de contacto, el plano y la superficie tienen el mismo valor y las mismas parciales.',
      },
    },
    {
      say: 'Parte de la altura conocida y suma el cambio de cada eje. La **aproximación lineal** usa las pendientes medidas en el punto de contacto.',
      dur: 3,
      board: {
        label: 'Aproximación lineal',
        tex: '\\begin{aligned}\\p{1}{L(x,y)}&=\\p{2}{\\cC{f(a,b)}}\\\\&\\quad+\\p{3}{\\cA{f_x(a,b)(x-a)}}\\\\&\\quad+\\p{4}{\\cM{f_y(a,b)(y-b)}}\\end{aligned}',
        body: 'Para el ejemplo: $f(1,2)=3$, $f_x(1,2)=8$ y $f_y(1,2)=-1$.',
      },
    },
    {
      say: 'Mueve el punto del mapa y compara la altura real con la del plano. Al acercarlo al centro, las dos lecturas se juntan.',
      gate: 'Arrastra el punto al interior del círculo verde: a menos de 0,15 de (1, 2).',
      board: {
        label: 'Plano del ejemplo',
        tex: '\\begin{aligned}\\p{1}{L(x,y)}&=\\p{2}{\\cC{3}}+\\p{3}{\\cA{8(x-1)}}\\\\&\\quad-\\p{4}{\\cM{(y-2)}}\\end{aligned}',
      },
    },
    {
      say: 'Desde (1, 2), el nuevo punto avanza 0,1 en x y retrocede 0,1 en y. Usa ambos cambios con su signo.',
      ask: {
        prompt: '¿Cuánto estima $L(1{,}1;\\,1{,}9)$?',
        options: ['3,9', '3,8', '4,1'],
        answer: 0,
        explain:
          '$3+8\\cdot0{,}1-(-0{,}1)=3{,}9$. La altura real es $3{,}87$: el error absoluto es $0{,}03$.',
      },
      board: {
        label: 'Cambios pequeños',
        tex: '\\p{1}{\\Delta x}=\\p{2}{\\cA{0{,}1}},\\quad\\p{3}{\\Delta y}=\\p{4}{\\cM{-0{,}1}}',
      },
    },
    {
      say: 'Al alejar el punto por esta diagonal, la diferencia crece. La aproximación sirve cerca del contacto; lejos debes revisar el error.',
      dur: 3,
      board: {
        label: 'Error local',
        tex: '\\p{1}{\\cC{f(x,y)}}\\approx\\p{2}{\\cA{L(x,y)}}',
        body: 'Si f es diferenciable, el error dividido por la distancia al contacto tiende a cero al acercarse.',
      },
    },
  ],
};

function BarometerDemo({ beats, answer }: DemoProps) {
  const estimated = beats.beat > 0 || answer !== null;
  const checked = beats.beat === 1 && answer !== null;
  return (
    <Stage>
      <PlaneClip P={PROFILE} />
      <Axes
        P={PROFILE}
        xTicks={[3]}
        yTicks={[155, 160, 165, 170]}
        xLabel="x\\ (\\mathrm{km})"
        yLabel="z\\ (\\mathrm m)"
      />
      <Curve P={PROFILE} f={(x) => H(x, 4)} color={C.cyan} clip />
      <Curve P={PROFILE} f={(x) => 166 - 12 * (x - 3)} color={C.amber} dashed clip />
      <Dot x={PROFILE.x(3)} y={PROFILE.y(166)} color={C.green} />
      <Cap x={PROFILE.x(3) + 55} y={PROFILE.y(166) - 30} tex="(3;166)" size={18} />
      <Line a={PROFILE.pt(3.5, 154)} b={PROFILE.pt(3.5, 168)} dashed />
      <Cap x={PROFILE.x(3.5)} y={690} tex="x=3{,}5,\\quad y=4" size={19} />
      <Cap x={1230} y={200} tex="H=200-2x^2-y^2" color={C.cyan} />
      <Cap x={1230} y={270} tex="H(3,4)=166\\,\\mathrm m" />
      <Cap x={1230} y={340} tex="H_x=-12,\\quad H_y=-8" />
      <Cap x={1230} y={410} tex="(\\Delta x;\\Delta y)=(0{,}5;0)\\,\\mathrm{km}" size={21} />
      {estimated && (
        <>
          <Dot x={PROFILE.x(3.5)} y={PROFILE.y(160)} color={C.amber} />
          <Cap x={1230} y={505} tex="L=166-12\\cdot0{,}5=160" color={C.amber} />
        </>
      )}
      {checked && (
        <>
          <Dot x={PROFILE.x(3.5)} y={PROFILE.y(159.5)} color={C.cyan} r={6} />
          <Cap x={1230} y={580} tex="H(3{,}5;4)=159{,}5" color={C.cyan} />
          <Cap x={1230} y={660} size={19}>
            Bajada real: 6,5 m. Barómetro: 7 m.
          </Cap>
        </>
      )}
    </Stage>
  );
}

function LinearPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 83 + round);
    const a = randInt(r, -3, 3),
      b = randInt(r, -3, 3);
    const value = randInt(r, 5, 30);
    const gx = pick(r, [-8, -5, -2, 3, 6, 9]),
      gy = pick(r, [-7, -4, -1, 2, 5, 8]);
    const dx = round === 1 ? 0 : pick(r, [-3, -2, -1, 1, 2, 3]) / 10;
    const dy = round === 0 ? 0 : pick(r, [-3, -2, -1, 1, 2, 3]) / 10;
    return { a, b, value, gx, gy, dx, dy, target: value + gx * dx + gy * dy };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { a, b, value, gx, gy, dx, dy, target } = data;
  const p: V2 = [a + dx, b + dy];
  useEffect(() => {
    setVal('');
    api.prompt(
      `En $${pair([a, b])}$ se conoce $f=${value}$, $f_x=${gx}$ y $f_y=${gy}$. Estima $f${pair(p)}$ con el plano tangente; escribe hasta dos decimales.`,
    );
    api.hints([
      'Resta las coordenadas del contacto a las del nuevo punto.',
      'Suma a la altura inicial cada parcial multiplicada por el cambio de su coordenada.',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const change = gx * dx + gy * dy;
    if (Math.abs(v - target) < 0.011)
      return api.result(
        true,
        `$L=${value}+(${gx})(${num(dx)})+(${gy})(${num(dy)})=${num(target)}$. Es una estimación.`,
      );
    if (Math.abs(v - change) < 0.011)
      return api.result(
        false,
        'Calculaste solo el cambio de altura. Falta sumar el valor inicial de f.',
      );
    if (Math.abs(v - (value + gx * p[0] + gy * p[1])) < 0.011)
      return api.result(
        false,
        'Usaste las coordenadas completas. El plano usa x − a e y − b: desplazamientos desde el contacto.',
      );
    if (
      dx !== 0 &&
      dy !== 0 &&
      (Math.abs(v - (value + gx * dx)) < 0.011 || Math.abs(v - (value + gy * dy)) < 0.011)
    )
      return api.result(false, 'Falta el aporte de un eje: aquí cambian tanto x como y.');
    if (Math.abs(v - (value - change)) < 0.011)
      return api.result(
        false,
        'Invertiste los desplazamientos. Resta punto nuevo menos punto de contacto.',
      );
    return api.result(
      false,
      `Los cambios son $\\Delta x=${num(dx)}$ y $\\Delta y=${num(dy)}$. Multiplica cada uno por su parcial, conserva los signos y suma ${value}.`,
    );
  };
  const P3 = ortho({ cx: 650, cy: 420, scale: 110, zScale: 0.12, xr: [-1, 1], yr: [-1, 1] });
  const local = (x: number, y: number) => gx * x + gy * y;
  const q = P3(dx, dy, local(dx, dy));
  return (
    <Stage>
      <Surface f={local} P3={P3} color={C.amber} n={12} />
      <Dot x={P3(0, 0, 0)[0]} y={P3(0, 0, 0)[1]} color={C.green} />
      <Dot x={q[0]} y={q[1]} color={C.magenta} />
      <Cap x={650} y={175} tex={`(a;b)=${pair([a, b])}`} color={C.green} />
      <Cap x={650} y={665} tex={`(x;y)=${pair(p)}`} color={C.magenta} />
      <Cap x={1220} y={240} tex={`f(a,b)=${value}`} color={C.cyan} />
      <Cap x={1220} y={315} tex={`f_x(a,b)=${gx}`} color={C.amber} />
      <Cap x={1220} y={390} tex={`f_y(a,b)=${gy}`} color={C.magenta} />
      <NumberField x={1090} y={520} value={val} onChange={setVal} onEnter={submit} label="L =" />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-c4',
  world: 'multivariate',
  code: '7.4',
  title: 'La lupa',
  subtitle: 'Plano tangente y aproximación lineal',
  glyph: 'L(x,y)',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'El barómetro del dron guarda una bajada; el desplazamiento estimado permite contrastarla con el terreno.',
  learn:
    'Construir el plano tangente y estimar valores cercanos usando la altura y las dos parciales.',
  glyphs: ['mv-tangent', 'mv-linearization'],
  pitfalls: [
    'Usa desplazamientos x − a e y − b, no coordenadas completas.',
    'La aproximación incluye la altura inicial f(a,b).',
    'El plano estima la superficie cerca del contacto; hay que distinguir estimación y valor real.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Borde de la quebrada Jaime. Teo acerca la pantalla a la linterna; una gota tapa la última lectura.',
        },
        {
          who: 'teo',
          text: 'Quedó un dato del barómetro: una bajada equivalente a siete metros. El desplazamiento al este sería medio kilómetro; ese dato está estimado.',
        },
        {
          who: 'tomas',
          text: 'En (3, 4), el terreno está a 166 metros. Antes de soltar cuerda necesito saber qué altura esperar más abajo.',
        },
        { who: 'tu', text: 'Podemos estimarla con la pendiente y después contrastar el registro.' },
        { who: 'iris', text: 'Anota también la diferencia. Esa pantalla ya nos debe bastante.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El barómetro',
      Scene: BarometerDemo,
      beats: [
        {
          say: 'En (3, 4), H vale 166 m y sus parciales son −12 y −8 m/km. El desplazamiento estimado es medio kilómetro al este, sin cambio en y.',
          ask: {
            prompt: '¿Qué altura estima el plano tangente?',
            options: ['160 m', '159 m', '166 m'],
            answer: 0,
            explain:
              '$L=166+(-12)\\cdot0{,}5+(-8)\\cdot0=160$ m. Restar los 7 m del barómetro daría 159 m, una lectura distinta.',
          },
          note: { label: 'Altura estimada', tex: 'L(3{,}5;4)=166-12\\cdot0{,}5=160\\,\\mathrm m' },
        },
        {
          say: 'Ahora evalúa el terreno original en (3,5; 4). Así puedes medir el error del plano y comparar la bajada con el barómetro.',
          ask: {
            prompt: '¿Cuál es la altura real del modelo H en ese punto?',
            options: ['159,5 m', '160 m', '159 m'],
            answer: 0,
            explain:
              '$200-2(3{,}5)^2-4^2=159{,}5$ m. El plano se pasa por 0,5 m; la bajada real del modelo es $166-159{,}5=6{,}5$ m, a 0,5 m del reporte de 7 m.',
          },
          note: {
            label: 'Altura real y diferencia',
            tex: 'H(3{,}5;4)=159{,}5\\,\\mathrm m',
            body: 'Estimación: 160 m. Error absoluto: 0,5 m. Bajada del modelo: 6,5 m; barómetro: 7 m. El desplazamiento también es estimado.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Estimar alturas cercanas', Comp: LinearPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Tomás hace una marca en la cuerda mojada; el extremo desaparece sobre el borde.',
        },
        {
          who: 'teo',
          text: 'El plano da 160 metros y el terreno, 159,5. La bajada del modelo queda medio metro corta respecto del barómetro.',
        },
        { who: 'iris', text: 'Medio metro pendiente. No lo borres para que cierre bonito.' },
        {
          who: 'tomas',
          text: 'Desde acá se ve el paso entre Barón y Los Placeres. Siempre me llamó la atención lo bajo que cruzaban esos drones.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-tangent',
    world: 'multivariate',
    tex: 'z=L(x,y)',
    name: 'Plano tangente',
    read: 'plano tangente',
    meaning:
      'Plano que coincide con la altura y las dos pendientes de una superficie diferenciable en el punto de contacto.',
  },
  {
    id: 'mv-linearization',
    world: 'multivariate',
    tex: 'f(x,y)\\approx L(x,y)',
    name: 'Aproximación lineal',
    read: 'efe aproximadamente ele',
    meaning: 'Estimación local que suma a f(a,b) los cambios fₓ(a,b)(x−a) y fᵧ(a,b)(y−b).',
    warn: 'Al alejarte del punto de contacto, el error puede crecer.',
  },
];
