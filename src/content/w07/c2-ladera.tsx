import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
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
import { ContourMap, F, H, Surface, num, ortho, pair, polynomial, type V2 } from './kit';

const PROFILE = plane([-2, 3], [-15, 22], { x: 1090, y: 210, w: 380, h: 350 });
const SEARCH = plane([0, 8], [0, 8], { x: 300, y: 170, w: 560, h: 560 });
const LEVELS = [60, 80, 100, 120, 140, 166, 180];
function PartialLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [slice, setSlice] = useState(0);
  const { beat, at } = beats;
  const onSlice = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(-1 + ((x - 1090) / 380) * 4, -1, 3) * 20) / 20;
    setSlice(v);
    if (Math.abs(v - 2) < 0.06) unlock();
  });
  const y = beat === 1 ? slice : 2;
  const P3 = ortho({ cx: 650, cy: 430, scale: 65, zScale: 0.16, xr: [-2, 3], yr: [-1, 3] });
  const section = Array.from({ length: 101 }, (_, i) => {
    const x = -2 + i / 20;
    return P3(x, y, F(x, y)).join(',');
  });
  const fyMode = beat === 3 && answer !== null;
  return (
    <Stage ref={svg}>
      <Surface f={F} P3={P3} />
      <polygon
        points={[P3(-2, y, -15), P3(3, y, -15), P3(3, y, 22), P3(-2, y, 22)]
          .map((p) => p.join(','))
          .join(' ')}
        fill={C.amber}
        fillOpacity={0.08}
        stroke={C.amber}
        strokeOpacity={0.4}
      />
      <polyline points={section.join(' ')} fill="none" stroke={C.amber} strokeWidth={4} />
      <Line
        a={P3(0.3, y, F(1, y) - (2 + 3 * y) * 0.7)}
        b={P3(1.7, y, F(1, y) + (2 + 3 * y) * 0.7)}
        color={C.green}
        width={4}
        opacity={beat === 0 ? at(0) : 1}
      />
      <Dot x={P3(1, y, F(1, y))[0]} y={P3(1, y, F(1, y))[1]} color={C.green} />
      <Cap x={680} y={140} tex="f(x,y)=x^2+3xy-y^2" />
      <Cap
        x={680}
        y={650}
        tex={`y=${num(y)}:\\quad z=x^2+${num(3 * y)}x-(${num(y)})^2`}
        color={C.amber}
        size={21}
      />
      <Axes P={PROFILE} xLabel="x" yLabel="z" />
      <Curve P={PROFILE} f={(x) => F(x, y)} color={C.amber} clip />
      <Curve P={PROFILE} f={(x) => F(1, y) + (2 + 3 * y) * (x - 1)} color={C.green} dashed clip />
      <Dot x={PROFILE.x(1)} y={PROFILE.y(F(1, y))} color={C.green} />
      {beat === 1 && (
        <>
          <line x1={1090} x2={1470} y1={660} y2={660} stroke={C.line} strokeWidth={3} />
          <Dot x={1090 + (3 / 4) * 380} y={660} color={C.green} ring />
          <Knob
            x={1090 + ((slice + 1) / 4) * 380}
            y={660}
            onPointerDown={onSlice}
            color={C.amber}
            axis="x"
            label={`y = ${num(slice).replace('{,}', ',')}`}
          />
        </>
      )}
      {beat >= 2 && (
        <Cap
          x={1270}
          y={620}
          tex={fyMode ? 'f_y(1,2)=-1' : 'f_x(1,2)=8'}
          color={fyMode ? C.magenta : C.green}
        />
      )}
      {beat === 4 && (
        <>
          <Arrow from={[600, 710]} to={[770, 710]} color={C.amber} />
          <Cap x={685} y={748} size={19}>
            Este: sube 8 por unidad.
          </Cap>
          <Cap x={1270} y={710} size={19} color={C.magenta}>
            Norte: baja 1 por unidad.
          </Cap>
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Derivadas parciales',
  Scene: PartialLesson,
  beats: [
    {
      say: 'Corta la superficie dejando $y=2$ fija. Queda una curva de una variable; su pendiente es la **derivada parcial** respecto de x.',
      dur: 3,
      board: {
        label: 'Derivada parcial',
        tex: '\\p{1}{\\frac{\\partial f}{\\partial\\cA{x}}}',
        body: 'Deriva en x dejando y fija.',
      },
    },
    {
      say: 'Mueve el plano de corte y mira cómo cambian la curva y su tangente.',
      gate: 'Arrastra la perilla hasta y = 2, donde está la marca verde.',
      board: { label: 'Corte', tex: '\\p{1}{f(x,2)}=\\p{2}{x^2+6x-4}' },
    },
    {
      say: 'Al derivar en x, el término que depende solo de y queda constante. En el punto (1, 2), la pendiente hacia el este vale 8.',
      dur: 3,
      board: {
        label: 'Parcial en x',
        tex: '\\begin{aligned}\\p{1}{\\cA{f_x}}&=\\p{2}{2x+3y}\\\\\\p{3}{f_x(1,2)}&=\\p{4}{2+6=8}\\end{aligned}',
      },
    },
    {
      say: 'Para hallar la pendiente hacia el norte, deja x fija y deriva en y.',
      ask: {
        prompt: '¿Cuánto vale $f_y=\\partial f/\\partial y$?',
        options: ['$3x-2y$', '$2x+3y$', '$3y-2$'],
        answer: 0,
        explain:
          'El término $x^2$ queda constante; $3xy$ da $3x$ y $-y^2$ da $-2y$. En (1, 2), $3-4=-1$.',
      },
      board: {
        label: 'Parcial en y',
        tex: '\\begin{aligned}\\p{1}{\\cM{f_y}}&=\\p{2}{3x-2y}\\\\\\p{3}{f_y(1,2)}&=\\p{4}{-1}\\end{aligned}',
      },
    },
    {
      say: 'Desde el punto (1, 2), caminar hacia el este sube 8 por unidad y caminar hacia el norte baja 1. Las dos parciales describen pendientes locales en los ejes.',
      dur: 3,
      board: {
        label: 'Pendientes por eje',
        tex: '\\p{1}{\\cA{f_x}}:\\ \\text{este},\\quad\\p{2}{\\cM{f_y}}:\\ \\text{norte}',
        body: '$f(1,2)=3$. El signo dice si subes o bajas; el módulo, cuánto cambia la altura por unidad.',
      },
    },
  ],
};
function SlopeDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <Axes
        P={SEARCH}
        xTicks={[0, 2, 4, 6, 8]}
        yTicks={[2, 4, 6, 8]}
        xLabel="\\text{este (km)}"
        yLabel="\\text{norte (km)}"
      />
      <ContourMap P={SEARCH} f={H} levels={LEVELS} />
      <Dot x={SEARCH.x(3)} y={SEARCH.y(4)} color={C.green} />
      <Cap x={SEARCH.x(3) - 30} y={SEARCH.y(4) - 25} tex="(3,4)" />
      <Arrow from={SEARCH.pt(3, 4)} to={SEARCH.pt(4.8, 4)} color={C.amber} width={4} />
      <Arrow from={SEARCH.pt(3, 4)} to={SEARCH.pt(3, 5.2)} color={C.magenta} width={4} />
      <Cap x={1230} y={200} tex="H=200-2x^2-y^2" />
      <Cap x={1230} y={270} tex="H(3,4)=166\\,\\mathrm m" />
      <Cap x={1230} y={370} color={C.amber} tex="H_x(3,4)=-12\\,\\mathrm{m/km}" />
      <Cap x={1230} y={440} color={C.magenta} tex="H_y(3,4)=-8\\,\\mathrm{m/km}" />
      {beats.beat === 1 && answer !== null && (
        <Cap x={1230} y={540} color={C.green}>
          Este: baja más por kilómetro.
        </Cap>
      )}
    </Stage>
  );
}
function PartialPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 73 + round);
    const poly = polynomial(
      pick(r, [-3, -2, 1, 2, 3]),
      pick(r, [-3, -1, 1, 2, 3]),
      pick(r, [-3, -2, 1, 2, 3]),
    );
    const p: V2 = [randInt(r, -2, 3), randInt(r, -2, 3)];
    return { poly, p, g: poly.gradient(...p) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const { poly, p, g } = data;
  useEffect(() => {
    setVal('');
    setChoice(null);
    api.prompt(
      round < 2
        ? `Para $f(x,y)=${poly.tex}$, calcula $f_${round === 0 ? 'x' : 'y'}$ en $${pair(p)}$.`
        : `En $${pair(p)}$, las parciales son $f_x=${g[0]}$ y $f_y=${g[1]}$. ¿Qué dirección de los ejes es más empinada?`,
    );
    api.hints(
      round < 2
        ? [
            `Deja ${round === 0 ? 'y' : 'x'} fija al derivar.`,
            'Deriva primero, reemplaza las coordenadas después.',
          ]
        : [
            'Compara los módulos de las dos pendientes.',
            'El signo indica subida o bajada; el módulo indica cuán empinada es la dirección.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      const correct =
        Math.abs(g[0]) === Math.abs(g[1])
          ? 'Igual'
          : Math.abs(g[0]) > Math.abs(g[1])
            ? 'Eje x'
            : 'Eje y';
      return api.result(
        choice === correct,
        choice === correct
          ? `Módulos: $|f_x|=${Math.abs(g[0])}$, $|f_y|=${Math.abs(g[1])}$.`
          : 'Compara valores absolutos. Una pendiente negativa puede ser más empinada que una positiva.',
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (Math.abs(v - g[round]) < 0.011)
      return api.result(true, `$f_${round === 0 ? 'x' : 'y'}${pair(p)}=${g[round]}$.`);
    if (v === g[1 - round])
      return api.result(
        false,
        `Calculaste la parcial en ${round === 0 ? 'y' : 'x'}. Aquí se pide la otra: deja ${round === 0 ? 'y' : 'x'} fija.`,
      );
    if (v === poly.f(...p))
      return api.result(
        false,
        'Evaluaste la altura. Primero deriva el polinomio y después evalúa su pendiente.',
      );
    if (v === -g[round])
      return api.result(
        false,
        'El signo está invertido. Conserva el signo del coeficiente al derivar cada término.',
      );
    return api.result(
      false,
      'El término xy conserva la otra variable. El cuadrado de la variable que estás dejando fija tiene derivada cero.',
    );
  };
  return (
    <Stage>
      <Surface f={poly.f} P3={ortho({ scale: 48, zScale: 0.1 })} />
      <Cap x={690} y={160} tex={`f(x,y)=${poly.tex}`} />
      <Cap x={690} y={670} tex={`P=${pair(p)}`} />
      {round < 2 ? (
        <NumberField
          x={1100}
          y={410}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label={round === 0 ? 'fₓ =' : 'fᵧ ='}
        />
      ) : (
        <>
          <Cap x={1270} y={320} tex={`f_x=${g[0]},\\quad f_y=${g[1]}`} />
          <Choices
            x={1270}
            y={440}
            options={['Eje x', 'Eje y', 'Igual']}
            value={choice}
            onPick={setChoice}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w7-c2',
  world: 'multivariate',
  code: '7.2',
  title: 'La ladera',
  subtitle: 'Derivadas parciales',
  glyph: '\\partial f',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'La garúa moja el sendero donde cayó el dron. Hay que medir cuánto baja el terreno hacia el este y hacia el norte.',
  learn:
    'Derivar respecto de una variable dejando la otra fija e interpretar la pendiente local en cada eje.',
  glyphs: ['mv-partial'],
  pitfalls: [
    'Al derivar en x, y es constante; al derivar en y, x es constante.',
    'Una parcial es una pendiente, no la altura de la superficie.',
    'Para comparar cuán empinadas son dos direcciones, compara los módulos de las parciales.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Escalera Fischer. La garúa deja una película brillante en los peldaños.',
        },
        {
          who: 'tomas',
          text: 'Si cayó en ese sendero, resbaló. Las patas de un dron agarran menos que estas botas.',
        },
        { who: 'iris', text: 'Tus botas siguen aquí. Dame una dirección para el dron.' },
        {
          who: 'tomas',
          text: 'Primero midamos la bajada hacia el este y hacia el norte. En esta niebla prefiero una coordenada a una corazonada.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La pendiente del sendero',
      Scene: SlopeDemo,
      beats: [
        {
          say: 'El terreno es $H(x,y)=200-2x^2-y^2$ en metros, con coordenadas en kilómetros. En (3, 4), la altura es 166 m.',
          dur: 2.4,
          note: { label: 'Pendiente este', tex: 'H_x(3,4)=-12\\,\\mathrm{m/km}' },
        },
        {
          say: 'La parcial hacia el norte es $H_y(3,4)=-8$ m/km. Ambas son negativas: en ambos sentidos positivos bajas.',
          ask: {
            prompt: '¿En qué dirección de los ejes baja más rápido?',
            options: ['Hacia el este (x crece)', 'Hacia el norte', 'Igual'],
            answer: 0,
            explain:
              'Hacia el este baja 12 m por kilómetro; hacia el norte, 8. Entre esos dos ejes, el este tiene mayor descenso.',
          },
          note: { label: 'Pendiente norte', tex: 'H_y(3,4)=-8\\,\\mathrm{m/km}' },
        },
      ],
    },
    { kind: 'challenge', title: 'Pendientes por eje', Comp: PartialPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'El sendero se abre en abanico; un hilo de agua cruza entre las suelas de Teo.',
        },
        {
          who: 'tomas',
          text: 'En el punto medido, doce metros por kilómetro al este; ocho al norte. Hasta ahí llegan los ejes.',
        },
        {
          who: 'teo',
          text: 'Pero mira el agua: ya está bajando en diagonal. Puedo seguirla en el mapa si junto las dos pendientes.',
        },
        { who: 'iris', text: 'El agua encontró un atajo antes que nosotros.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-partial',
    world: 'multivariate',
    tex: '\\frac{\\partial f}{\\partial x}',
    name: 'Derivada parcial',
    read: 'parcial de efe respecto de equis',
    meaning: 'Tasa de cambio al variar una coordenada y dejar la otra fija.',
    warn: 'En el término xy, la otra variable se conserva como factor constante.',
  },
];
