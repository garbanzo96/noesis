import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
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
import { fmt, num } from './kit';

const MAP = plane([-2.5, 2.5], [-2.5, 2.5], { x: 310, y: 190, w: 540, h: 540 });
const R95 = Math.sqrt(Math.log(20));
const probability = (R: number) => -Math.expm1(-R * R);

/** Annular sector, sampled on both arcs so its area visibly grows with radius. */
function sectorPath(inner: number, outer: number, theta: number) {
  const point = (r: number, t: number) => MAP.pt(r * Math.cos(t), r * Math.sin(t)).join(' ');
  const outerArc = Array.from({ length: 41 }, (_, i) => point(outer, (theta * i) / 40));
  const innerArc = Array.from({ length: 41 }, (_, i) => point(inner, (theta * (40 - i)) / 40));
  return `M${outerArc.join('L')}L${innerArc.join('L')}Z`;
}
function SearchDisk({
  R,
  density = false,
  label = true,
}: {
  R: number;
  density?: boolean;
  label?: boolean;
}) {
  return (
    <>
      {density &&
        Array.from({ length: 40 }, (_, i) => {
          const r = (40 - i) / 16;
          return (
            <circle
              key={i}
              cx={MAP.x(0)}
              cy={MAP.y(0)}
              r={r * MAP.sx}
              fill={C.cyan}
              fillOpacity={0.016 + 0.025 * Math.exp(-r * r)}
            />
          );
        })}
      <circle
        cx={MAP.x(0)}
        cy={MAP.y(0)}
        r={R * MAP.sx}
        fill={C.amber}
        fillOpacity={0.12}
        stroke={C.amber}
        strokeWidth={3}
      />
      <Line a={MAP.pt(0, 0)} b={MAP.pt(R, 0)} color={C.amber} width={4} />
      <Dot x={MAP.x(0)} y={MAP.y(0)} color={C.text} r={7} />
      {label && (
        <Cap
          x={Math.max(MAP.x(R / 2), MAP.x(0) + 60)}
          y={MAP.y(0) - 26}
          tex={`R=${num(R)}`}
          color={C.amber}
          size={18}
        />
      )}
    </>
  );
}

function PolarLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [radius, setRadius] = useState(0.5);
  const onRadius = useSvgDrag(svg, (x) => {
    const R = Math.round(clamp(((x - 1060) / 360) * 2.4, 0.2, 2.4) * 100) / 100;
    setRadius(R);
    if (probability(R) > 0.95) unlock();
  });
  const { beat, at } = beats;
  const r = beat === 0 ? 0.5 + at(0) : 1.5;
  const theta = Math.PI / 4;
  return (
    <Stage ref={svg}>
      <Axes P={MAP} xTicks={[-2, 0, 2]} yTicks={[-2, 2]} xLabel="x" yLabel="y" />
      {beat === 0 ? (
        <>
          <path
            d={sectorPath(r, r + 0.25, theta)}
            fill={C.magenta}
            fillOpacity={0.35}
            stroke={C.magenta}
            strokeWidth={2}
          />
          <Line
            a={MAP.pt(0, 0)}
            b={MAP.pt((r + 0.25) * Math.cos(theta), (r + 0.25) * Math.sin(theta))}
            color={C.dim}
            dashed
          />
          <Line a={MAP.pt(0, 0)} b={MAP.pt(r + 0.25, 0)} color={C.amber} />
          <Cap x={MAP.x(r / 2)} y={MAP.y(0) + 28} tex={`r=${num(r)}`} color={C.amber} />
          <Cap x={1240} y={240} tex="x=r\cos\theta" color={C.cyan} />
          <Cap x={1240} y={310} tex="y=r\sin\theta" color={C.magenta} />
          <Cap x={1240} y={415} tex="\text{arco}\approx r\,\Delta\theta" color={C.amber} />
          <Cap x={1240} y={510} tex="\Delta A\approx r\,\Delta r\,\Delta\theta" color={C.magenta} />
          <Cap x={1240} y={620} size={19}>
            El mismo ángulo ocupa más área lejos del centro.
          </Cap>
        </>
      ) : (
        <>
          <SearchDisk R={beat === 3 ? radius : beat === 4 ? R95 : 2} density={beat >= 3} />
          {beat === 1 && (
            <>
              <Cap x={1240} y={280} tex="\int_0^R r\,dr=\tfrac{R^2}{2}" color={C.magenta} />
              <Cap x={1240} y={410} tex="2\pi\cdot\tfrac{R^2}{2}=\pi R^2" color={C.cyan} />
            </>
          )}
          {beat === 2 && (
            <>
              <Cap x={1240} y={270} tex="x^2+y^2=r^2" color={C.cyan} />
              <Cap x={1240} y={360} tex="r^2\,dA=r^3\,dr\,d\theta" color={C.magenta} />
              {answer !== null && (
                <Cap x={1240} y={470} tex="2\pi\int_0^2r^3\,dr=8\pi" color={C.green} />
              )}
            </>
          )}
          {beat === 3 && (
            <>
              <Cap
                x={1240}
                y={225}
                tex={`P(r\\le R)\\approx${num(probability(radius), 3)}`}
                color={C.cyan}
              />
              <Cap x={1240} y={315} tex="\text{meta: }P>0{,}95" color={C.green} />
              <line x1={1060} x2={1420} y1={470} y2={470} stroke={C.line} strokeWidth={3} />
              <Dot x={1060 + (R95 / 2.4) * 360} y={470} color={C.green} ring />
              <Knob
                x={1060 + (radius / 2.4) * 360}
                y={470}
                axis="x"
                onPointerDown={onRadius}
                color={C.amber}
                label={`R = ${fmt(radius)} km`}
              />
              <Cap x={1240} y={590} size={19}>
                Aumenta el radio hasta superar el 95 %.
              </Cap>
            </>
          )}
          {beat === 4 && (
            <>
              <Cap x={1240} y={270} tex="P(r\le R)=1-e^{-R^2}" color={C.cyan} />
              <Cap x={1240} y={385} tex="e^{-R^2}=0{,}05=\tfrac1{20}" color={C.magenta} />
              <Cap
                x={1240}
                y={510}
                tex="R_{95}=\sqrt{\ln20}\approx1{,}73\;\mathrm{km}"
                color={C.green}
              />
            </>
          )}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Coordenadas polares',
  intro: {
    question: '¿Cómo se integra con comodidad sobre un círculo?',
    text: 'En coordenadas polares, un punto se describe por su distancia al centro y su ángulo. Para regiones redondas la integral doble se vuelve mucho más simple, con un factor r que corrige el área. La señal del dron deja una zona redonda de búsqueda, y hay que fijar el radio que la cubre casi por completo.',
  },
  Scene: PolarLesson,
  beats: [
    {
      say: 'Ubica un punto por su distancia al centro y su ángulo: esas son sus **coordenadas polares**. Mira el pequeño sector: al alejarse, su arco crece y también su área.',
      dur: 4,
      board: [
        {
          label: 'Coordenadas polares',
          tex: '\\begin{aligned}\\p{1}{x}&=\\p{2}{\\cA{r}\\cos\\cM{\\theta}}\\\\\\p{3}{y}&=\\p{4}{\\cA{r}\\sin\\cM{\\theta}}\\end{aligned}',
          body: 'r ≥ 0; θ se mide en radianes.',
          parts: [
            'posición hacia el este',
            'proyección hacia el este',
            'posición hacia el norte',
            'proyección hacia el norte',
          ],
        },
        {
          label: 'Elemento de área polar',
          tex: '\\p{1}{dA}=\\p{2}{\\cA{r}}\\,\\p{3}{dr}\\,\\p{4}{\\cM{d\\theta}}',
          parts: [
            'área del pequeño sector',
            'crecimiento del arco',
            'espesor del sector',
            'apertura del sector',
          ],
        },
      ],
    },
    {
      say: 'Para cubrir un disco, recorre los radios desde cero hasta R y da una vuelta completa. Integrar el elemento de área recupera el área del círculo.',
      dur: 3,
      board: {
        label: 'Área del disco',
        tex: '\\begin{aligned}\\p{1}{\\int_0^{2\\pi}\\!\\int_0^R r\\,dr\\,d\\theta}\\\\=\\p{2}{2\\pi\\,\\tfrac{R^2}{2}}=\\p{3}{\\cC{\\pi R^2}}\\end{aligned}',
        parts: ['área que buscamos', 'con los límites del disco', 'área total del disco'],
      },
    },
    {
      say: 'La distancia al cuadrado es x² más y², que en polares vale r². Multiplica también por el r del elemento de área.',
      ask: {
        prompt: '¿Cuánto vale $\\iint_{r\\le2}(x^2+y^2)\\,dA$?',
        options: ['$8\\pi$', '$4\\pi$', '$16\\pi$'],
        answer: 0,
        explain:
          '$\\int_0^{2\\pi}\\!\\int_0^2r^3\\,dr\\,d\\theta=2\\pi[ r^4/4 ]_0^2=2\\pi\\cdot4=8\\pi$.',
      },
      board: {
        label: 'Integrando y área',
        tex: '\\begin{aligned}\\p{1}{x^2+y^2}&=\\p{2}{\\cC{r^2}}\\\\\\p{3}{(x^2+y^2)\\,dA}&=\\p{4}{r^3\\,dr\\,d\\theta}\\end{aligned}',
        parts: [
          'distancia al centro cuadrada',
          'distancia polar al cuadrado',
          'aporte en cartesianas',
          'aporte en polares',
        ],
      },
    },
    {
      say: 'El modelo sitúa más probabilidad cerca del centro. Agranda el disco para acumular más posiciones posibles del dron.',
      gate: 'Arrastra la perilla del radio hasta que la probabilidad supere 0,95.',
      board: {
        label: 'Probabilidad dentro del disco',
        tex: '\\p{1}{P(r\\le R)}=\\p{2}{1-e^{-\\cA{R^2}}}',
        body: 'Para la densidad $p(x,y)=\\pi^{-1}e^{-(x^2+y^2)}$ sobre todo el plano, con distancias en km.',
        parts: ['probabilidad en el disco', 'probabilidad según el radio'],
      },
    },
    {
      say: 'Para el 95 %, fuera del disco queda el 5 %. Despeja el radio con logaritmo y raíz; el factor r en el área permite integrar la densidad.',
      dur: 3,
      board: [
        {
          label: 'Integrar la densidad',
          tex: '\\begin{aligned}\\p{1}{P(r\\le R)}&=\\p{2}{2\\int_0^R e^{-r^2}r\\,dr}\\\\&=\\p{3}{1-e^{-R^2}}\\end{aligned}',
          parts: [
            'probabilidad que buscamos',
            'sumar densidad por anillos',
            'probabilidad según el radio',
          ],
        },
        {
          label: 'Radio del 95 %',
          tex: '\\p{1}{R_{95}}=\\p{2}{\\sqrt{\\ln20}}\\approx\\p{3}{\\cA{1{,}73}\\;\\mathrm{km}}',
          parts: ['radio para el 95 %', 'radio exacto de búsqueda', 'radio aproximado de búsqueda'],
        },
      ],
    },
  ],
};

function SearchDemo({ beats, answer }: DemoProps) {
  const R = beats.beat === 0 ? 1 : answer !== null ? R95 : 1;
  return (
    <Stage>
      <Axes
        P={MAP}
        xTicks={[-2, 0, 2]}
        yTicks={[-2, 2]}
        xLabel="\text{este (km)}"
        yLabel="\text{norte (km)}"
      />
      <SearchDisk R={R} density />
      <Cap x={580} y={165}>
        Último punto recibido: centro de búsqueda
      </Cap>
      <Cap x={1240} y={235} tex="p(x,y)=\tfrac1\pi e^{-(x^2+y^2)}" color={C.cyan} />
      <Cap x={1240} y={330} tex="p(r)=\tfrac1\pi e^{-r^2}" color={C.cyan} />
      <Cap x={1240} y={425} size={19}>
        Densidad por km² alrededor del último punto.
      </Cap>
      {(beats.beat > 0 || answer !== null) && (
        <Cap x={1240} y={530} tex="P(r\le1)=1-e^{-1}\approx0{,}632" color={C.amber} />
      )}
      {beats.beat === 1 && answer !== null && (
        <Cap x={1240} y={640} tex="R_{95}\approx1{,}73\;\mathrm{km}" color={C.green} />
      )}
    </Stage>
  );
}

function PolarPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 103 + round);
    const R = randInt(r, 1, 3),
      denominator = pick(r, [2, 3, 4, 6]),
      exponent = randInt(r, 1, 4);
    const p = pick(r, [0.8, 0.9, 0.95, 0.99]);
    return {
      R,
      denominator,
      exponent,
      p,
      theta: Math.PI / denominator,
      sector: (R * R) / (2 * denominator),
      integral: (2 * R ** (exponent + 2)) / (exponent + 2),
      radius: Math.sqrt(-Math.log1p(-p)),
    };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const texts = [
      `Un sector tiene radio ${d.R} y ángulo $\\pi/${d.denominator}$ radianes. Escribe su área como múltiplo de π: solo el coeficiente (dos decimales).`,
      `Integra $r^{${d.exponent}}$ sobre el disco $r\\le${d.R}$. Escribe el resultado como múltiplo de π: solo el coeficiente (dos decimales).`,
      `Con $P(r\\le R)=1-e^{-R^2}$, halla el radio para una probabilidad de ${Math.round(d.p * 100)} % (dos decimales, en km).`,
    ];
    api.prompt(texts[round]);
    api.hints(
      round === 0
        ? [
            'El área de un sector es $R^2\\theta/2$, con θ en radianes.',
            `Usa $\\theta=\\pi/${d.denominator}$ y escribe solo el coeficiente de π.`,
          ]
        : round === 1
          ? [
              'Multiplica el integrando por r antes de integrar: el área aporta ese factor.',
              `Integra $r^{${d.exponent + 1}}$ de 0 a ${d.R} y luego θ de 0 a 2π.`,
            ]
          : ['Despeja $e^{-R^2}=1-p$.', 'Aplica logaritmo: $R=\\sqrt{-\\ln(1-p)}$.'],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const target = [d.sector, d.integral, d.radius][round];
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (Math.abs(v - target) < 0.011)
      return api.result(
        true,
        [
          `$A=\\tfrac{${d.R ** 2}}{${2 * d.denominator}}\\pi\\approx${num(target)}\\pi$.`,
          `$I=\\tfrac{2\\cdot${d.R}^{${d.exponent + 2}}}{${d.exponent + 2}}\\pi\\approx${num(target)}\\pi$.`,
          `$R=\\sqrt{-\\ln(${num(1 - d.p)})}\\approx${num(target)}$ km.`,
        ][round],
      );
    if (round < 2 && Math.abs(v - target * Math.PI) < 0.011)
      return api.result(
        false,
        'Incluiste el valor de π. El campo pide solo su coeficiente: divide tu resultado por π.',
      );
    if (round === 0 && Math.abs(v - 2 * target) < 0.011)
      return api.result(false, 'Falta dividir por 2 en el área del sector.');
    if (round === 1 && Math.abs(v - (2 * d.R ** (d.exponent + 1)) / (d.exponent + 1)) < 0.011)
      return api.result(
        false,
        'Olvidaste el factor r del elemento de área; el exponente aumenta antes de integrar.',
      );
    if (round === 2 && Math.abs(v - target ** 2) < 0.011)
      return api.result(false, 'Ese es el radio al cuadrado. Falta la raíz positiva.');
    return api.result(
      false,
      [
        `El ángulo ocupa $1/${2 * d.denominator}$ del círculo; multiplica esa fracción por $\\pi R^2$.`,
        'Usa $dA=r\\,dr\\,d\\theta$: integra primero en r y multiplica por 2π.',
        'Usa la probabilidad que queda fuera, 1 − p, dentro del logaritmo; después saca raíz.',
      ][round],
    );
  };
  return (
    <Stage>
      {round === 0 ? (
        <path
          d={sectorPath(0, d.R / 1.5, d.theta)}
          fill={C.magenta}
          fillOpacity={0.25}
          stroke={C.magenta}
          strokeWidth={3}
        />
      ) : (
        <SearchDisk R={round === 1 ? d.R / 1.5 : 1} density={round === 2} label={false} />
      )}
      <Cap
        x={580}
        y={165}
        tex={
          round === 0
            ? `R=${d.R},\\quad\\theta=\\pi/${d.denominator}`
            : round === 1
              ? `r\\le${d.R},\\quad f=r^{${d.exponent}}`
              : `p=${num(d.p)}`
        }
      />
      <Cap x={580} y={760} size={18}>
        Esquema de la región, sin escala.
      </Cap>
      <NumberField
        x={1040}
        y={400}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 2 ? 'R =' : 'coeficiente ='}
        unit={round === 2 ? 'km' : '× π'}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w7-c8',
  world: 'multivariate',
  code: '7.8',
  title: 'El radio de búsqueda',
  subtitle: 'Coordenadas polares',
  glyph: 'dA=r\\,dr\\,d\\theta',
  kind: 'level',
  guide: 'tomas',
  teaser:
    'La última señal deja una zona posible alrededor del dron. Hay que fijar el radio de búsqueda antes de bajar.',
  learn:
    'Usar coordenadas polares y su elemento de área para integrar sobre discos y sectores y calcular un radio de probabilidad.',
  glyphs: ['mv-polar', 'mv-polar-area'],
  pitfalls: [
    'El ángulo se mide en radianes.',
    'El área polar incluye un factor r además del integrando.',
    'La densidad se integra sobre el área; no es la probabilidad acumulada.',
    'El radio 1,73 km es un redondeo de √ln 20; el modelo no garantiza encontrar el dron.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Teo limpió la pantalla con la manga, y la mancha de la señal volvió a aparecer alrededor de la última marca.',
        },
        {
          who: 'teo',
          text: 'La antena recibe, pero no me da un punto exacto. La zona es más intensa cerca del centro y se debilita hacia afuera.',
        },
        {
          who: 'tomas',
          text: 'Dame un radio en kilómetros. Si busco demasiado cerca, puedo pasar sobre él sin verlo.',
        },
        { who: 'iris', text: 'Y si buscamos demasiado lejos, se nos va la noche.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Dónde buscar',
      Scene: SearchDemo,
      beats: [
        {
          say: 'La densidad $p=\\pi^{-1}e^{-r^2}$ describe la posición alrededor del último punto recibido, con r en km. Calcula la probabilidad dentro de un kilómetro.',
          ask: {
            prompt: '¿Cuánto vale $P(r\\le1)$?',
            options: ['Aproximadamente 0,632', '0,95', 'Aproximadamente 0,368'],
            answer: 0,
            explain:
              '$1-e^{-1}\\approx0{,}632$. El 0,368 es la probabilidad que queda fuera del disco.',
          },
          note: { label: 'Búsqueda a 1 km', tex: 'P(r\\le1)=1-e^{-1}\\approx0{,}632' },
        },
        {
          say: 'El primer disco cubre cerca del 63,2 % con este modelo. Amplía el radio para cubrir el 95 % de las posiciones posibles.',
          ask: {
            prompt: '¿Qué radio corresponde al 95 %?',
            options: ['√ln 20 ≈ 1,73 km', '1 km', 'ln 20 ≈ 3,00 km'],
            answer: 0,
            explain:
              '$1-e^{-R^2}=0{,}95$ da $R^2=\\ln20$, así que $R=\\sqrt{\\ln20}\\approx1{,}73$ km. Hay que sacar la raíz.',
          },
          note: {
            label: 'Radio de búsqueda',
            tex: 'R_{95}=\\sqrt{\\ln20}\\approx1{,}73\\;\\mathrm{km}',
            body: 'El 95 % corresponde al radio exacto; 1,73 km es el redondeo a dos decimales.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Delimitar la búsqueda', Comp: PolarPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Tomás ajustó el arnés. El círculo ámbar de la pantalla abarcaba el fondo que la linterna no alcanzaba.',
        },
        {
          who: 'tu',
          text: 'Con este modelo, un radio de aproximadamente 1,73 kilómetros cubre el 95 %.',
        },
        {
          who: 'tomas',
          text: 'Anotado. El cinco por ciento que falta igual pesa cuando uno va colgado.',
        },
        { who: 'teo', text: 'Hay un destello dentro del círculo. Espera… volvió.' },
        { who: 'iris', text: 'Es rojo, del mismo color que la luz del dron.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'mv-polar',
    world: 'multivariate',
    tex: '(r,\\theta)',
    name: 'Coordenadas polares',
    read: 'erre, theta',
    meaning: 'Distancia no negativa al origen y ángulo en radianes: x = r cos θ, y = r sin θ.',
  },
  {
    id: 'mv-polar-area',
    world: 'multivariate',
    tex: 'dA=r\\,dr\\,d\\theta',
    name: 'Elemento de área polar',
    read: 'de a igual a erre de erre de theta',
    meaning: 'El factor r mide cómo se ensancha un sector al alejarse del centro.',
    warn: 'Multiplica por r también cuando el integrando ya depende de r.',
  },
];
