import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Dot, Line } from '../../engine/shapes';
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
import {
  LinearPhase,
  Readout,
  linearExact,
  matrixTex,
  mul2,
  near,
  nearComponents,
  num,
  pair,
  type M2,
  type V2,
} from './kit';

const A: M2 = [
  [-2, 1],
  [1, -2],
];
const M: M2 = [
  [1, 0],
  [0, -2],
];
const MP: M2 = [
  [-1, 0],
  [0, -2],
];
const P = plane([-3.5, 3.5], [-3.5, 3.5], { x: 180, y: 170, w: 720, h: 540 });
const LOG2 = Math.log(2);
const directions: V2[] = [
  [1, 1],
  [1, -1],
];

/** The two scales show signed deviations, not geographic positions. */
function Needles({ state }: { state: V2 }) {
  return (
    <>
      {state.map((value, i) => {
        const x = 365 + i * 350,
          y = 440,
          angle = (value * Math.PI) / 8;
        return (
          <g key={i}>
            <rect
              x={x - 175}
              y={210}
              width={330}
              height={420}
              rx={28}
              fill={C.panel}
              stroke={C.muted}
              strokeWidth={3}
            />
            <path
              d={`M${x - 140} ${y}A140 140 0 0 1 ${x + 140} ${y}`}
              fill="none"
              stroke={C.muted}
              strokeWidth={8}
            />
            {[-2, 0, 2].map((tick) => {
              const theta = (tick * Math.PI) / 8;
              return (
                <Line
                  key={tick}
                  a={[x + 125 * Math.sin(theta), y - 125 * Math.cos(theta)]}
                  b={[x + 145 * Math.sin(theta), y - 145 * Math.cos(theta)]}
                  color={C.text}
                  width={3}
                />
              );
            })}
            <Arrow
              from={[x, y]}
              to={[x + 128 * Math.sin(angle), y - 128 * Math.cos(angle)]}
              color={i ? C.magenta : C.amber}
              width={6}
            />
            <Dot x={x} y={y} color={C.text} />
            <Cap
              x={x}
              y={560}
              tex={`${i ? 'v' : 'u'}=${num(value)}`}
              color={i ? C.magenta : C.amber}
            />
          </g>
        );
      })}
      <Cap x={540} y={740} size={19}>
        Desviaciones normalizadas · cero: marca de reposo
      </Cap>
    </>
  );
}

function LinearLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [initial, setInitial] = useState<V2>([-1, 1]);
  const { beat, at } = beats;
  const onInitial = useSvgDrag(svg, (px, py) => {
    const [u, v] = P.inv(px, py);
    const next: V2 = [
      Math.round(clamp(u, -3, 3) * 100) / 100,
      Math.round(clamp(v, -3, 3) * 100) / 100,
    ];
    setInitial(next);
    if (beat === 1 && nearComponents(next, [2, 2], 0.05)) unlock();
  });
  const progress = reduced ? 1 : at(beat);
  const start: V2 = beat === 1 ? initial : beat === 5 ? [2 - progress, -2 + progress] : [2, 0];
  const t = beat === 4 ? LOG2 * progress : progress * 2;
  const change = mul2(A, start);
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <Needles state={linearExact(A, [2, -1], progress)} />
      ) : (
        <>
          <LinearPhase
            P={P}
            A={A}
            initial={start}
            elapsed={t}
            end={3}
            eigenDirections={beat >= 3 ? directions : []}
            clock={false}
          />
          {beat === 1 && (
            <>
              <circle cx={P.x(2)} cy={P.y(2)} r={16} fill="none" stroke={C.green} strokeWidth={3} />
              <Arrow
                from={P.pt(...initial)}
                to={P.pt(initial[0] + change[0] / 2, initial[1] + change[1] / 2)}
                color={C.amber}
                width={5}
              />
              <Knob
                x={P.x(initial[0])}
                y={P.y(initial[1])}
                color={C.amber}
                onPointerDown={onInitial}
              />
            </>
          )}
          {beat === 4 && (
            <>
              {directions.map((v, i) => {
                const amplitude = Math.exp((i ? -3 : -1) * t);
                return (
                  <Arrow
                    key={i}
                    from={P.pt(0, 0)}
                    to={P.pt(v[0] * amplitude, v[1] * amplitude)}
                    color={i ? C.magenta : C.green}
                    width={5}
                  />
                );
              })}
            </>
          )}
          <Cap x={540} y={790} size={19}>
            Plano de calibración · estado (u, v)
          </Cap>
        </>
      )}
      {beat === 0 ? (
        <>
          <Readout x={1250} y={220}>
            Cada aguja depende de ambas lecturas.
          </Readout>
          <Cap x={1250} y={325} tex="\mathbf x=(u,v)^{\mathsf T}" />
          <Readout x={1250} y={435}>
            Un punto reúne las dos desviaciones.
          </Readout>
          <Readout x={1250} y={545} size={19}>
            El reloj de calibración es adimensional.
          </Readout>
        </>
      ) : (
        <>
          <Cap x={1250} y={200} tex={`A=${matrixTex(A)}`} color={C.cyan} />
          {beat === 1 && (
            <>
              <Cap x={1250} y={310} tex={`\\mathbf x_0=${pair(initial)}`} color={C.amber} />
              <Cap x={1250} y={400} tex={`A\\mathbf x_0=${pair(change)}`} />
              <Readout x={1250} y={500} size={19}>
                Pon las dos lecturas en 2: lleva el inicio a la marca verde.
              </Readout>
            </>
          )}
          {beat === 2 && (
            <>
              <Cap x={1250} y={320} tex="u'=-2u+v" color={C.amber} />
              <Cap x={1250} y={410} tex="v'=u-2v" color={C.magenta} />
              <Cap x={1250} y={510} tex="\mathbf x'=A\mathbf x" color={C.cyan} />
            </>
          )}
          {beat === 3 && (
            <>
              <Cap
                x={1250}
                y={320}
                tex="\mathbf v_1=(1,1);\ \lambda_1=-1"
                color={C.green}
                size={21}
              />
              <Cap
                x={1250}
                y={410}
                tex="\mathbf v_2=(1,-1);\ \lambda_2=-3"
                color={C.magenta}
                size={21}
              />
              <Readout x={1250} y={520} size={19}>
                La flecha de cambio conserva cada dirección propia.
              </Readout>
            </>
          )}
          {beat === 4 && (
            <>
              <Cap x={1250} y={315} tex="\mathbf x(0)=(2,0)" />
              <Cap x={1250} y={405} tex="c_1=c_2=1" />
              <Readout x={1250} y={500} size={19}>
                Suma los dos vectores de modo para reconstruir el estado.
              </Readout>
              {answer !== null && (
                <Cap x={1250} y={615} tex="\mathbf x(\ln2)=(\tfrac58;\tfrac38)" color={C.green} />
              )}
            </>
          )}
          {beat === 5 && (
            <>
              <Cap x={1250} y={320} tex={`\\mathbf x_0\\approx${pair(start)}`} />
              <Readout x={1250} y={425}>
                Ambos modos decaen.
              </Readout>
              <Readout x={1250} y={530} size={19}>
                El retrato de fase reúne trayectorias de distintos inicios.
              </Readout>
            </>
          )}
          <Cap x={1250} y={725} tex={`t\\approx${num(t)}`} color={C.amber} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sistemas lineales y direcciones propias',
  Scene: LinearLesson,
  beats: [
    {
      say: 'Necesitamos dos pendientes para seguir dos lecturas. Un punto representa ambas agujas al mismo tiempo; los ejes son desviaciones del banco, no posiciones en Valparaíso.',
      dur: 3,
      board: {
        label: 'Estado conjunto',
        tex: '\\p{1}{\\mathbf x}=\\p{2}{(\\cA{u},\\cM{v})^{\\mathsf T}}',
        parts: ['estado de ambas agujas', 'lecturas de las agujas'],
      },
    },
    {
      say: 'Pon ambas agujas en la misma marca. La flecha de cambio en (2, 2) sigue la diagonal hacia el origen.',
      gate: 'Arrastra el inicio ámbar hasta (2, 2), con margen de 0,05 por componente.',
      board: {
        label: 'Cambio conjunto',
        tex: '\\p{1}{A(2,2)^{\\mathsf T}}=\\p{2}{\\cC{(-2,-2)^{\\mathsf T}}}',
        parts: ['cambio desde ambas marcas', 'velocidades de las agujas'],
      },
    },
    {
      say: 'La matriz transforma el estado en su velocidad de cambio. Cada fila produce una de las dos pendientes.',
      dur: 4,
      board: [
        {
          label: 'Sistema lineal',
          tex: "\\p{1}{\\mathbf x'}=\\p{2}{\\cC{A}}\\p{3}{\\mathbf x}",
          parts: ['velocidad del estado', 'regla de transformación', 'estado de ambas agujas'],
        },
        {
          label: 'Dos ecuaciones',
          tex: "\\begin{aligned}\\p{1}{u'}&=\\p{2}{\\cA{-2u}+v}\\\\\\p{3}{v'}&=\\p{4}{u\\cM{-2v}}\\end{aligned}",
          parts: [
            'cambio de primera aguja',
            'regla de primera aguja',
            'cambio de segunda aguja',
            'regla de segunda aguja',
          ],
        },
      ],
    },
    {
      say: 'Un **vector propio** marca una dirección que la matriz conserva. Su **valor propio** dice cuánto multiplica la matriz en esa dirección.',
      dur: 4,
      board: [
        {
          label: 'Dirección propia',
          tex: '\\p{1}{A\\mathbf v}=\\p{2}{\\cC{\\lambda}}\\p{3}{\\mathbf v}',
          body: 'El vector propio debe ser distinto de cero.',
          parts: ['dirección transformada', 'factor de la dirección', 'dirección que se conserva'],
        },
        {
          label: 'Modos de este banco',
          tex: '\\begin{aligned}\\p{1}{\\mathbf v_1=(1,1)}&;\\ \\p{2}{\\cA{\\lambda_1=-1}}\\\\\\p{3}{\\mathbf v_2=(1,-1)}&;\\ \\p{4}{\\cM{\\lambda_2=-3}}\\end{aligned}',
          parts: [
            'agujas en igual sentido',
            'decaimiento más lento',
            'agujas en sentido opuesto',
            'decaimiento más rápido',
          ],
        },
      ],
    },
    {
      say: 'Cada modo sigue una exponencial. Para partir en (2, 0), los dos coeficientes valen 1; suma los vectores para reconstruir las componentes.',
      ask: {
        prompt: '¿Dónde queda ese estado en $t=\\ln2$?',
        options: ['$(1;0)$', '$(5/8;3/8)$', '$(1/2;1/8)$'],
        answer: 1,
        explain:
          'Los modos valen 1/2 y 1/8. Las componentes son su suma y su diferencia: $(5/8;3/8)$. $(1;0)$ aplica un solo factor al inicio; $(1/2;1/8)$ entrega amplitudes, no componentes.',
      },
      board: {
        label: 'Sumar los modos',
        tex: '\\begin{aligned}\\p{1}{\\mathbf x(t)}&=\\p{2}{\\cA{c_1e^{-t}}(1,1)}\\\\&\\quad+\\p{3}{\\cM{c_2e^{-3t}}(1,-1)}\\end{aligned}',
        parts: ['estado con el tiempo', 'aporte del modo lento', 'aporte del modo rápido'],
      },
    },
    {
      say: 'El tiempo recorre cada trayectoria. Aquí los dos modos se apagan y el estado vuelve al origen; una dirección con valor propio positivo crecería.',
      dur: 4,
      board: [
        {
          label: 'Modo que decae',
          tex: '\\p{1}{\\lambda<0}\\Rightarrow\\p{2}{\\cC{e^{\\lambda t}\\to0}}',
          parts: ['factor propio negativo', 'amplitud que se apaga'],
        },
        {
          label: 'Modo que crece',
          tex: '\\p{1}{\\lambda>0}\\Rightarrow\\p{2}{\\cM{e^{\\lambda t}\\text{ crece}}}',
          parts: ['factor propio positivo', 'amplitud que aumenta'],
        },
      ],
    },
  ],
};

function ChangedSignDemo({ beats, answer }: DemoProps) {
  const Q = plane([-1, 5], [-1, 5], { x: 180, y: 170, w: 720, h: 540 });
  const reveal = answer !== null;
  return (
    <Stage>
      <LinearPhase
        P={Q}
        A={M}
        initial={[2, 4]}
        elapsed={reveal ? LOG2 : 0}
        end={LOG2}
        clock={false}
        color={C.amber}
        eigenDirections={[
          [1, 0],
          [0, 1],
        ]}
      />
      {beats.beat === 1 && (
        <LinearPhase
          P={Q}
          A={MP}
          initial={[2, 4]}
          elapsed={reveal ? LOG2 : 0}
          end={LOG2}
          clock={false}
          color={C.cyan}
          axes={false}
          field={false}
        />
      )}
      <Cap x={1250} y={200} tex={`M=${matrixTex(M)}`} color={C.amber} />
      <Cap x={1250} y={310} tex={`M_p=${matrixTex(MP)}`} color={C.cyan} />
      <Cap x={1250} y={420} tex="\mathbf x_0=(2,4);\quad t=\ln2" size={21} />
      {reveal && (
        <>
          <Cap x={1250} y={530} tex="\mathbf x(\ln2)=(4;1)" color={C.amber} />
          {beats.beat === 1 && (
            <Cap x={1250} y={620} tex="\mathbf x_p(\ln2)=(1;1)" color={C.cyan} />
          )}
        </>
      )}
      <Cap x={540} y={790} size={19}>
        Mismo archivo de inicio · ámbar: original · cian: público
      </Cap>
    </Stage>
  );
}

function LinearPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 137 + round);
    const a = round === 1 ? pick(random, [1, 2]) : randInt(random, 1, 3);
    const b = round === 1 ? pick(random, [3, 4]) : randInt(random, 1, 3);
    const c1 = pick(random, [1, 2]),
      c2 = pick(random, [1, 2]);
    const initial: V2 =
      round === 2 ? [c1 + c2, c1 - c2] : [randInt(random, 1, 2), randInt(random, 1, 2)];
    const matrix: M2 =
      round === 0
        ? [
            [-a, 0],
            [0, -b],
          ]
        : round === 1
          ? [
              [-(a + b) / 2, (b - a) / 2],
              [(b - a) / 2, -(a + b) / 2],
            ]
          : A;
    const target: V2 =
      round === 0
        ? mul2(matrix, initial)
        : round === 1
          ? [-a, -b]
          : [c1 / 2 + c2 / 8, c1 / 2 - c2 / 8];
    return { a, b, c1, c2, initial, matrix, target };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      round === 0
        ? `Para $A=${matrixTex(d.matrix)}$ y estado $${pair(d.initial)}$, escribe las dos componentes del vector de cambio.`
        : round === 1
          ? `Para $A=${matrixTex(d.matrix)}$, escribe los valores propios de $(1,1)$ y $(1,-1)$, en ese orden.`
          : `Con la matriz de clase y el inicio $${pair(d.initial)}$, escribe las dos componentes del estado en $t=\\ln2$.`,
    );
    api.hints(
      round === 0
        ? [
            'Multiplica cada fila por el vector de estado.',
            'Cada fila diagonal multiplica su propia componente; conserva el signo negativo.',
          ]
        : round === 1
          ? [
              'Calcula A por cada vector propio.',
              'Compara el resultado con el vector original: el factor común es el valor propio.',
            ]
          : [
              'Descompón el inicio como c₁(1,1) + c₂(1,−1).',
              'En ln 2, los factores son 1/2 y 1/8. Suma para u y resta para v.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const a = parseNum(first),
      b = parseNum(second);
    if (a === null || b === null) return;
    const response: V2 = [a, b];
    if (nearComponents(response, d.target))
      return api.result(
        true,
        round === 0
          ? `$A\\mathbf x=${pair(d.target)}$.`
          : round === 1
            ? `$\\lambda_1=-${d.a}$ y $\\lambda_2=-${d.b}$: cada producto conserva su dirección.`
            : `$c_1=${d.c1}$, $c_2=${d.c2}$; $\\mathbf x(\\ln2)=${pair(d.target, 3)}$.`,
      );
    if (round === 0 && nearComponents(response, d.initial))
      return api.result(
        false,
        'Respondiste el estado. El cambio es A por ese estado; multiplica cada fila.',
      );
    if (round === 0 && nearComponents(response, [-d.a, -d.b]))
      return api.result(
        false,
        'Copiaste las sumas de las filas sin usar el estado. Multiplica cada entrada diagonal por su componente.',
      );
    if (round === 1 && (near(a, d.matrix[0][0]) || near(b, d.matrix[1][1])))
      return api.result(
        false,
        'Las entradas diagonales no son los valores propios de esta matriz acoplada. Calcula A(1,1) y A(1,−1).',
      );
    if (round === 1 && nearComponents(response, [-d.b, -d.a]))
      return api.result(
        false,
        'Intercambiaste los modos. Primero va el factor de (1,1); después el de (1,−1).',
      );
    if (round === 2 && nearComponents(response, [d.c1 / 2, d.c2 / 8]))
      return api.result(
        false,
        'Esas son las amplitudes de los modos. Las componentes finales son su suma y su diferencia.',
      );
    if (round === 2 && nearComponents(response, [d.initial[0] / 2, d.initial[1] / 2]))
      return api.result(
        false,
        'Aplicaste el mismo factor a todo el inicio. El segundo modo decae con e elevado a −3t, no a −t.',
      );
    api.result(
      false,
      round === 0
        ? 'Revisa cada producto con su signo; la matriz transforma el estado en dos pendientes.'
        : round === 1
          ? 'Busca el factor que multiplica cada vector completo, incluyendo el signo.'
          : 'Conserva los coeficientes del inicio y reconstruye u = modo 1 + modo 2, v = modo 1 − modo 2.',
    );
  };
  return (
    <Stage>
      <LinearPhase
        P={plane([-5, 5], [-5, 5], { x: 180, y: 170, w: 720, h: 540 })}
        A={d.matrix}
        initial={d.initial}
        elapsed={0}
        end={2}
        clock={false}
        eigenDirections={
          round === 0
            ? [
                [1, 0],
                [0, 1],
              ]
            : directions
        }
      />
      <Cap x={1250} y={200} tex={`A=${matrixTex(d.matrix)}`} color={C.cyan} />
      <Cap
        x={1250}
        y={310}
        tex={round === 1 ? '\\mathbf v_1=(1,1)' : `\\mathbf x_0=${pair(d.initial)}`}
      />
      {round === 1 && <Cap x={1250} y={400} tex="\mathbf v_2=(1,-1)" />}
      {round === 2 && <Cap x={1250} y={400} tex="t=\ln2" color={C.amber} />}
      <NumberField
        x={1060}
        y={510}
        label={round === 0 ? 'u′ =' : round === 1 ? 'λ₁ =' : 'u ='}
        value={first}
        onChange={setFirst}
        onEnter={submit}
      />
      <NumberField
        x={1060}
        y={610}
        label={round === 0 ? 'v′ =' : round === 1 ? 'λ₂ =' : 'v ='}
        value={second}
        onChange={setSecond}
        onEnter={submit}
      />
      <Readout x={1250} y={720} size={18}>
        Escribe fracciones como decimales con coma; margen de 0,005 por componente.
      </Readout>
      <Cap x={540} y={790} size={19}>
        Retrato del estado · inicio ámbar · reloj adimensional
      </Cap>
      <Confirm onClick={submit} disabled={parseNum(first) === null || parseNum(second) === null} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-c5',
  world: 'dynamics',
  code: '9.5',
  title: 'Dos agujas',
  subtitle: 'Sistemas lineales y direcciones propias',
  glyph: "\\mathbf x'=A\\mathbf x",
  kind: 'level',
  guide: 'elena',
  teaser:
    'El paquete conserva dos lecturas de presión y viento. El inicio coincide; una entrada de la matriz cambió de signo.',
  learn:
    'Calcular el cambio matricial, reconocer direcciones propias y reconstruir una solución desde sus modos.',
  glyphs: ['dy-linear', 'dy-eigen', 'dy-phase'],
  pitfalls: [
    'El vector de estado y el vector de cambio son distintos.',
    'En una matriz acoplada, la diagonal no entrega por sí sola los valores propios.',
    'Las amplitudes de los modos deben sumarse como vectores.',
    'El estado inicial debe conservarse en la solución.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Tres de la mañana. Elena frotó el vidrio empañado de los dos indicadores; el paquete recuperado seguía abierto sobre la mesa.',
        },
        { who: 'iris', text: 'Los mismos datos de entrada y salidas distintas.' },
        { who: 'elena', text: 'Las agujas estaban bien. Revisa la tabla que las juntaba.' },
        { who: 'tu', text: 'Dejemos fijo el inicio al comparar.' },
        {
          who: 'nar',
          text: 'Teo superpuso los archivos de entrada, y coincidían hasta la última marca.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El signo cambiado',
      Scene: ChangedSignDemo,
      beats: [
        {
          say: 'El original usa M = diag(1, −2); la pública, Mₚ = diag(−1, −2). Ambas parten en (2, 4); comparamos en t = ln 2, tiempo adimensional de calibración.',
          ask: {
            prompt: '¿Qué dirección crece en el original?',
            options: [
              'La segunda, con valor propio −2',
              'Ninguna',
              'La primera, con valor propio 1',
            ],
            answer: 2,
            explain:
              'La primera componente multiplica su inicio por $e^t$. La segunda decae con $e^{-2t}$.',
          },
          note: {
            label: 'Canal original',
            tex: '\\mathbf x(t)=(2e^t;4e^{-2t})',
            body: 'En t = ln 2, el estado original es (4; 1).',
          },
        },
        {
          say: 'El archivo de medición inicial es idéntico. Solo la primera entrada de la matriz cambia de signo entre ambas copias.',
          ask: {
            prompt:
              '¿Qué cambio explica que el primer componente pase de 4 a 1 en la salida pública?',
            options: [
              'Cambiar el valor propio de 1 a −1',
              'Cambiar solo el segundo componente inicial',
              'Sumar las componentes sin cambiar la regla',
            ],
            answer: 0,
            explain:
              '$2e^{\\ln2}=4$ y $2e^{-\\ln2}=1$. El segundo componente queda en 1 en ambas copias.',
          },
          note: {
            label: 'Copia pública',
            tex: '\\begin{aligned}\\mathbf x_p(t)&=(2e^{-t};4e^{-2t})\\\\\\mathbf x_p(\\ln2)&=(1;1)\\end{aligned}',
            body: 'El cambio está en la regla; el inicio no fue alterado.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Reconstruir los modos', Comp: LinearPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Iris dejó las matrices abiertas junto al vidrio frío. Elena mantenía un dedo sobre el archivo de inicio.',
        },
        { who: 'iris', text: 'Le cambiaron el signo a una dirección que crecía.' },
        { who: 'elena', text: 'Hay otro canal. Ese daba vueltas antes de salirse de la escala.' },
        { who: 'nar', text: 'En la segunda copia, las vueltas se apretaban hacia el centro.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-linear',
    world: 'dynamics',
    tex: "\\mathbf x'=A\\mathbf x",
    name: 'Sistema lineal autónomo',
    read: 'equis vector prima igual a a por equis vector',
    meaning: 'Una matriz constante transforma el estado en su vector de cambio.',
  },
  {
    id: 'dy-eigen',
    world: 'dynamics',
    tex: 'A\\mathbf v=\\lambda\\mathbf v',
    name: 'Vector y valor propios',
    read: 'a por ve vector igual a lambda por ve vector',
    meaning:
      'Un vector no nulo conserva su dirección bajo la matriz. El factor λ es su valor propio.',
    warn: 'Los coeficientes modales y las componentes del estado son distintos.',
  },
  {
    id: 'dy-phase',
    world: 'dynamics',
    tex: '(u(t),v(t))',
    name: 'Retrato de fase',
    read: 'u de te, ve de te',
    meaning:
      'Conjunto de trayectorias del estado. El tiempo recorre las curvas y se lee en un reloj aparte.',
  },
];
