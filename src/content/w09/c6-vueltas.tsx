import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { CueCtx, useCue } from '../../engine/cue';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
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
import {
  LinearPhase,
  Readout,
  TraceDetBoard,
  det2,
  matrixTex,
  near,
  nearComponents,
  num,
  trace2,
  type M2,
  type V2,
} from './kit';

const MATRICES: M2[] = [
  [
    [-1, 0],
    [0, -2],
  ],
  [
    [1, 0],
    [0, -1],
  ],
  [
    [-1, -2],
    [2, -1],
  ],
  [
    [0, -2],
    [2, 0],
  ],
];
const SYMBOLS = ['N', 'S', 'F', 'C'];
const PLUS: M2 = [
  [1, -2],
  [2, 1],
];
const MINUS = MATRICES[2];
const P = plane([-4, 4], [-3, 3], { x: 180, y: 170, w: 720, h: 540 });

function PortraitLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const cue = useCue();
  const [selected, setSelected] = useState(0);
  const [initial, setInitial] = useState<V2>([-1, 1]);
  const visits = useRef(new Set<number>());
  const [saddleDone, setSaddleDone] = useState(false);
  const { beat, at } = beats;
  const onSelect = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - 1070) / 120, 0, 3));
    if (next !== selected) setInitial([-1, 1]);
    setSelected(next);
  });
  const onInitial = useSvgDrag(svg, (px, py) => {
    const [u, v] = P.inv(px, py);
    const next: V2 = [
      Math.round(clamp(u, -2.5, 2.5) * 100) / 100,
      Math.round(clamp(v, -2.5, 2.5) * 100) / 100,
    ];
    setInitial(next);
    if (beat !== 1 || !nearComponents(next, [1, 0], 0.05)) return;
    if (selected === 1) {
      visits.current.add(1);
      setSaddleDone(true);
    }
    if (selected === 2 && visits.current.has(1)) visits.current.add(2);
    if (selected === 2 && visits.current.size === 2) unlock();
  });
  const t = (reduced ? 1 : at(beat)) * 2;
  if (beat === 0)
    return (
      <Stage>
        {MATRICES.map((A, i) => {
          const x = 180 + (i % 2) * 400,
            y = 200 + Math.floor(i / 2) * 280;
          const Q = plane([-3.2, 3.2], [-2.2, 2.2], { x, y, w: 320, h: 220 });
          return (
            <g key={i}>
              <LinearPhase
                P={Q}
                A={A}
                initial={[1, 0.5]}
                elapsed={t}
                end={2}
                clock={false}
                color={[C.cyan, C.amber, C.magenta, C.green][i]}
              />
              <Cap
                x={x + 160}
                y={y - 35}
                tex={SYMBOLS[i]}
                color={[C.cyan, C.amber, C.magenta, C.green][i]}
              />
            </g>
          );
        })}
        <Readout x={1250} y={220}>
          Todos comparten el origen.
        </Readout>
        <Readout x={1250} y={325}>
          Los recorridos cercanos cambian.
        </Readout>
        <Cap x={1250} y={430} tex="A\mathbf0=\mathbf0" />
        <Cap x={1250} y={535} tex={`t\\approx${num(t)}`} color={C.amber} />
        <Readout x={1250} y={640} size={19}>
          Reloj adimensional del banco de calibración
        </Readout>
      </Stage>
    );
  if (beat === 1)
    return (
      <Stage ref={svg}>
        <LinearPhase
          P={P}
          A={MATRICES[selected]}
          initial={initial}
          elapsed={t}
          end={2}
          clock={false}
        />
        <circle cx={P.x(1)} cy={P.y(0)} r={16} fill="none" stroke={C.green} strokeWidth={3} />
        <CueCtx.Provider value={{ ...cue, active: false }}>
          <Knob x={P.x(initial[0])} y={P.y(initial[1])} onPointerDown={onInitial} color={C.amber} />
        </CueCtx.Provider>
        <Cap x={1250} y={200} tex={`${SYMBOLS[selected]}=${matrixTex(MATRICES[selected])}`} />
        <Cap
          x={1250}
          y={310}
          tex={`\\mathbf x_0\\approx(${num(initial[0])};${num(initial[1])})`}
          color={C.amber}
        />
        <Line a={[1070, 410]} b={[1430, 410]} width={4} />
        <Knob x={1070 + selected * 120} y={410} onPointerDown={onSelect} axis="x" color={C.cyan} />
        {SYMBOLS.map((s, i) => (
          <Cap key={s} x={1070 + i * 120} y={475} tex={s} />
        ))}
        <Readout x={1250} y={580} size={19}>
          {saddleDone
            ? 'S lista. Elige F y lleva el inicio a (1, 0).'
            : 'Elige S y lleva el inicio a (1, 0).'}
        </Readout>
        <Readout x={1250} y={690} size={19}>
          Selector a la derecha; inicio ámbar en el plano.
        </Readout>
        <Cap x={540} y={790} size={19}>
          Salida recta en S · entrada giratoria en F
        </Cap>
      </Stage>
    );
  if (beat === 2 || beat === 3) {
    const index = beat === 2 ? 2 : Math.min(3, Math.floor((reduced ? 1 : at(3)) * 4));
    return (
      <Stage>
        <TraceDetBoard A={MATRICES[index]} elapsed={t} />
      </Stage>
    );
  }
  const A = beat === 4 ? MATRICES[3] : MATRICES[0];
  return (
    <Stage>
      <LinearPhase
        P={P}
        A={A}
        initial={[2, 0]}
        elapsed={t}
        end={Math.PI}
        clock={false}
        color={C.green}
      />
      {beat === 4 &&
        [0.75, 1.25].map((radius) => (
          <LinearPhase
            key={radius}
            P={P}
            A={A}
            initial={[radius, 0]}
            elapsed={t}
            end={Math.PI}
            clock={false}
            color={C.cyan}
            axes={false}
            field={false}
          />
        ))}
      <Cap x={1250} y={200} tex={`A=${matrixTex(A)}`} />
      {beat === 4 ? (
        <>
          <Cap x={1250} y={315} tex="\tau=0;\quad D=4" />
          <Cap x={1250} y={410} tex="i^2=-1;\quad\lambda=\pm2i" color={C.magenta} />
          {answer !== null && (
            <>
              <Readout x={1250} y={520} color={C.green}>
                Permanece cerca, girando. Es estable; no atrae al origen.
              </Readout>
              <Cap x={1250} y={635} tex="u^2+v^2=\text{constante}" />
            </>
          )}
        </>
      ) : (
        <>
          <Cap x={1250} y={315} tex="D>0,\ \Delta=0:\ \lambda=\tau/2" size={21} />
          <Readout x={1250} y={425} size={19}>
            Raíz repetida: nodo estrellado o impropio según sus vectores propios.
          </Readout>
          <Readout x={1250} y={545} size={19}>
            D = 0: revisa el sistema; puede haber otros equilibrios.
          </Readout>
          <Readout x={1250} y={665} size={19}>
            Un centro de la parte lineal no decide por sí solo la estabilidad no lineal.
          </Readout>
        </>
      )}
      <Cap x={540} y={790} size={19}>
        Estado real (u, v) · tiempo de calibración aparte
      </Cap>
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Traza, determinante y tipos de equilibrio',
  Scene: PortraitLesson,
  beats: [
    {
      say: 'El origen es equilibrio en todos. Mira los recorridos: entrada recta, salida por una dirección, giro que entra y giro de radio constante.',
      dur: 4,
      board: {
        label: 'Origen en reposo',
        tex: '\\p{1}{\\cC{A}\\mathbf0}=\\p{2}{\\mathbf0}',
        parts: ['cambio desde el origen', 'estado sin movimiento'],
      },
    },
    {
      say: 'Compara la dirección que se aleja con la trayectoria que gira. Usa el mismo inicio para las dos pruebas.',
      gate: 'Elige S con la perilla; arrastra el inicio ámbar a (1, 0). Después elige F y repite, con margen de 0,05 por componente.',
      board: {
        label: 'Dos recorridos',
        tex: '\\p{1}{\\cA{\\text{silla}}};\\quad\\p{2}{\\cM{\\text{espiral entrante}}}',
        parts: ['equilibrio con salida', 'giro hacia el origen'],
      },
    },
    {
      say: 'La **traza** suma los valores propios y el **determinante** los multiplica. El discriminante Δ pertenece al polinomio; es distinto de D.',
      dur: 4,
      board: [
        {
          label: 'Traza y determinante',
          tex: '\\p{1}{\\cA{\\tau}=\\operatorname{tr}A};\\quad\\p{2}{\\cC{D}=\\det A}',
          parts: ['suma de valores propios', 'producto de valores propios'],
        },
        {
          label: 'Polinomio característico',
          tex: '\\p{1}{\\lambda^2}-\\p{2}{\\tau\\lambda}+\\p{3}{D}=0',
          body: 'Δ = τ² − 4D es el discriminante.',
          parts: ['término de segundo grado', 'aporte de la traza', 'aporte del determinante'],
        },
      ],
    },
    {
      say: 'D negativo da una silla. Con D positivo, Δ separa valores reales de complejos: la traza negativa da entrada, la positiva da salida y la nula da centro cuando Δ es negativo.',
      dur: 6,
      board: [
        {
          label: 'Valores reales',
          tex: '\\begin{aligned}\\p{1}{D<0}&:\\ \\p{2}{\\cA{\\text{silla}}}\\\\\\p{3}{D>0,\\Delta>0}&:\\ \\p{4}{\\text{nodo}}\\end{aligned}',
          parts: [
            'producto propio negativo',
            'entrada y salida',
            'raíces de igual signo',
            'recorridos sin giro',
          ],
        },
        {
          label: 'Valores complejos',
          tex: '\\begin{aligned}\\p{1}{D>0,\\Delta<0,\\tau\\ne0}&:\\ \\p{2}{\\cM{\\text{espiral}}}\\\\\\p{3}{D>0,\\Delta<0,\\tau=0}&:\\ \\p{4}{\\cC{\\text{centro}}}\\end{aligned}',
          parts: [
            'raíces complejas con cambio',
            'giro con amplitud variable',
            'raíces imaginarias puras',
            'giro de radio constante',
          ],
        },
      ],
    },
    {
      say: 'En C el estado sigue siendo real. Escribimos las raíces como ±2i, con i² = −1; mira qué ocurre con el radio de cada recorrido.',
      ask: {
        prompt: 'El centro lineal, con τ = 0 y D = 4, ¿cómo responde a un inicio cercano?',
        options: [
          'Se acerca al origen',
          'Se aleja sin límite',
          'Permanece cerca, girando sin acercarse',
        ],
        answer: 2,
        explain:
          'Las raíces son ±2i y el radio permanece constante. El centro es estable y no asintóticamente estable: estar cerca no exige converger.',
      },
      board: {
        label: 'Raíces del giro',
        tex: '\\p{1}{\\lambda^2+4}=0;\\quad\\p{2}{\\cM{i^2=-1}}',
        parts: ['ecuación de las raíces', 'regla de unidad imaginaria'],
      },
    },
    {
      say: 'Con D positivo y Δ = 0 hay una raíz real repetida: el nodo puede ser estrellado o impropio. D = 0 requiere revisar el sistema; esta tabla clasifica sistemas lineales.',
      dur: 5,
      board: [
        {
          label: 'Raíz repetida',
          tex: '\\p{1}{D>0,\\Delta=0}\\Rightarrow\\p{2}{\\lambda=\\tau/2}',
          parts: ['condición de raíz repetida', 'valor propio repetido'],
        },
        {
          label: 'Borde singular',
          tex: '\\p{1}{D=0}\\Rightarrow\\p{2}{\\cA{\\text{revisar el sistema}}}',
          body: 'La parte lineal con centro no resuelve por sí sola la estabilidad no lineal.',
          parts: ['producto propio nulo', 'análisis que falta'],
        },
      ],
    },
  ],
};

function SpiralDemo({ beats, answer, reduced }: DemoProps) {
  const reveal = answer !== null;
  const t = (reduced ? 1 : beats.at(beats.beat)) * 1.2;
  return (
    <Stage>
      {[PLUS, MINUS].map((A, i) => {
        const Q = plane([-3, 3], [-4.125, 4.125], { x: 180 + i * 400, y: 220, w: 320, h: 440 });
        return (
          <g key={i}>
            <LinearPhase
              P={Q}
              A={A}
              initial={[0.75, 0]}
              elapsed={t}
              end={1.2}
              clock={false}
              color={i ? C.cyan : C.amber}
            />
            <Cap x={340 + i * 400} y={175} size={20}>
              {i ? 'Público' : 'Original'}
            </Cap>
          </g>
        );
      })}
      <Cap x={1250} y={200} tex={`F_+=${matrixTex(PLUS)}`} color={C.amber} />
      <Cap x={1250} y={310} tex={`F_-=${matrixTex(MINUS)}`} color={C.cyan} />
      <Cap x={1250} y={420} tex="\tau_+=2;\quad\tau_-=-2" />
      <Cap x={1250} y={510} tex="D=5;\quad\Delta=-16" color={C.magenta} />
      {reveal && (
        <Readout x={1250} y={615} size={19} color={C.green}>
          {beats.beat === 0
            ? 'Ambas giran. El signo de la parte real decide entrada o salida.'
            : 'El original gira alejándose: raíces 1 ± 2i.'}
        </Readout>
      )}
      <Readout x={1250} y={735} size={18}>
        Historial: Halcón / enlace externo
      </Readout>
      <Cap x={540} y={760} size={19}>
        Mismo inicio · mismo giro · cambia la parte real
      </Cap>
    </Stage>
  );
}

function PortraitPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 139 + round);
    const a = round === 0 ? randInt(random, 1, 3) : round === 1 ? pick(random, [-2, -1, 1, 2]) : 0;
    const b = round === 1 ? pick(random, [1, 2]) : randInt(random, 1, 3);
    const A: M2 =
      round === 0
        ? [
            [a, 0],
            [0, -b],
          ]
        : [
            [a, -b],
            [b, a],
          ];
    const tau = trace2(A),
      D = det2(A);
    const type =
      round === 0
        ? 'Silla'
        : round === 1
          ? a < 0
            ? 'Espiral entrante'
            : 'Espiral saliente'
          : 'Centro estable';
    return { A, tau, D, type, delta: tau * tau - 4 * D };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [choice, setChoice] = useState<string | null>(null);
  const options =
    round === 0
      ? ['Silla', 'Nodo entrante', 'Centro']
      : round === 1
        ? ['Espiral entrante', 'Espiral saliente', 'Nodo']
        : ['Centro estable', 'Centro asintóticamente estable', 'Silla'];
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    api.prompt(
      `Para $A=${matrixTex(d.A)}$, ${round === 2 ? 'elige la clasificación del origen.' : 'calcula la traza, el determinante y elige el tipo de equilibrio.'}`,
    );
    api.hints(
      round === 0
        ? [
            'El determinante es el producto de la diagonal en esta matriz.',
            'Un determinante negativo da una silla, aunque la traza sea negativa.',
          ]
        : round === 1
          ? [
              'Suma la diagonal y calcula ad − bc.',
              'Calcula Δ = τ² − 4D; su signo distingue nodo de espiral.',
            ]
          : [
              'La traza es cero y el discriminante es negativo.',
              'El radio permanece constante: estabilidad no implica convergencia al origen.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (choice === null) return;
    if (round < 2) {
      const tau = parseNum(first),
        D = parseNum(second);
      if (tau === null || D === null) return;
      if (!near(tau, d.tau))
        return api.result(
          false,
          `La traza suma solo las entradas diagonales: ${d.A[0][0]} y ${d.A[1][1]}.`,
        );
      if (!near(D, d.D))
        return api.result(
          false,
          round === 1
            ? 'El determinante es ad − bc. El producto bc es negativo: restarlo suma b².'
            : 'La diagonal tiene signos opuestos: su producto es negativo.',
        );
    }
    if (choice === d.type)
      return api.result(
        true,
        `$\\tau=${num(d.tau)}$, $D=${num(d.D)}$, $\\Delta=${num(d.delta)}$: ${d.type.toLowerCase()}${round === 2 ? ', sin convergencia al origen' : ''}.`,
      );
    if (round === 0)
      return api.result(
        false,
        'La traza sola no decide. D < 0 implica valores propios de signos opuestos y una silla.',
      );
    if (round === 1)
      return api.result(
        false,
        choice === 'Nodo'
          ? 'D positivo no basta para un nodo. Aquí Δ es negativo: hay raíces complejas y una espiral.'
          : 'El signo de τ decide: negativo entra; positivo sale.',
      );
    api.result(
      false,
      choice === 'Centro asintóticamente estable'
        ? 'El estado permanece cerca, pero su radio no disminuye. Es estable, sin atracción al origen.'
        : 'Una silla necesita D negativo. Aquí hay giro de radio constante y D positivo.',
    );
  };
  return (
    <Stage>
      <LinearPhase P={P} A={d.A} initial={[1, 0.5]} elapsed={0.75} end={1.2} clock={false} />
      <Cap x={1250} y={200} tex={`A=${matrixTex(d.A)}`} color={C.cyan} />
      {round < 2 && (
        <>
          <NumberField
            x={1060}
            y={330}
            label="τ ="
            value={first}
            onChange={setFirst}
            onEnter={submit}
          />
          <NumberField
            x={1060}
            y={425}
            label="D ="
            value={second}
            onChange={setSecond}
            onEnter={submit}
          />
        </>
      )}
      {options.map((option, i) => (
        <Choices
          key={option}
          x={1250}
          y={(round === 2 ? 350 : 540) + i * 90}
          options={[option]}
          value={choice}
          onPick={setChoice}
          render={(value) => <span style={{ fontSize: 'calc(var(--su) * 19)' }}>{value}</span>}
        />
      ))}
      {round === 2 && (
        <Readout x={1250} y={650} size={19}>
          ¿Permanecer cerca o converger al origen?
        </Readout>
      )}
      <Cap x={540} y={790} size={19}>
        Retrato de fase · los ejes son componentes del estado
      </Cap>
      <Confirm
        onClick={submit}
        disabled={
          choice === null || (round < 2 && (parseNum(first) === null || parseNum(second) === null))
        }
      />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-c6',
  world: 'dynamics',
  code: '9.6',
  title: 'Las vueltas de la pantalla',
  subtitle: 'Traza, determinante y tipos de equilibrio',
  glyph: '\\tau^2-4D',
  kind: 'level',
  guide: 'elena',
  teaser:
    'Otro canal gira entrando en la copia pública y saliendo en el original. El historial conserva la credencial que hizo ambos cambios.',
  learn:
    'Clasificar sistemas lineales con traza, determinante y discriminante; distinguir estabilidad de atracción.',
  glyphs: ['dy-trace-det', 'dy-discriminant', 'dy-center'],
  pitfalls: [
    'Una traza negativa no vuelve estable a una silla.',
    'D positivo no distingue por sí solo nodo, espiral y centro.',
    'Un centro lineal es estable, sin ser asintóticamente estable.',
    'D = 0 y los sistemas no lineales requieren un examen aparte.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Tres y diez. La impresora soltó una hoja todavía caliente, con cuatro retratos bajo la misma etiqueta.',
        },
        {
          who: 'elena',
          text: 'Ponerles el mismo nombre fue flojera. Cambiar las vueltas requirió otra copia.',
        },
        { who: 'iris', text: 'Veamos cuál de las dos copias hicieron primero.' },
        {
          who: 'nar',
          text: 'Elena apartó la etiqueta. Debajo había quedado el historial de edición.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El archivo entrante',
      Scene: SpiralDemo,
      beats: [
        {
          say: 'El original F₊ tiene traza 2, determinante 5 y discriminante −16. La pública F₋ tiene traza −2 y conserva D y Δ. El historial atribuye este cambio y el anterior a «Halcón / enlace externo».',
          ask: {
            prompt: '¿Qué propiedad se conserva entre esas dos matrices?',
            options: [
              'La estabilidad asintótica',
              'El giro, porque ambas tienen valores propios complejos',
              'El signo de la traza',
            ],
            answer: 1,
            explain:
              'Ambas tienen $\\Delta=-16$. Cambia la parte real $\\tau/2$, de 1 a −1, y con ella la entrada o salida.',
          },
          note: {
            label: 'Mismo giro, distinta parte real',
            tex: '\\begin{aligned}\\tau_+&=2,\\quad\\tau_-=-2\\\\D&=1+4=5\\\\\\Delta&=4-20=-16\\end{aligned}',
            body: 'El historial registra la misma credencial en los dos cambios públicos.',
          },
        },
        {
          say: 'Elena reconoce el puerto de acceso: debía consultar, no editar. Clasifica ahora el original antes de describir su recorrido.',
          ask: {
            prompt: '¿Qué decía el original sobre el origen?',
            options: [
              'Que las trayectorias cercanas giraban alejándose',
              'Que todas volvían al origen',
              'Que era una silla',
            ],
            answer: 0,
            explain:
              'D > 0, Δ < 0 y τ > 0: espiral saliente, con raíces $1\\pm2i$. La copia pública tiene raíces $-1\\pm2i$ y es entrante.',
          },
          note: {
            label: 'Raíces de las dos copias',
            tex: '\\begin{aligned}\\lambda_+&=1\\pm2i\\\\\\lambda_-&=-1\\pm2i\\end{aligned}',
            body: 'La matemática identifica el efecto del ajuste. El historial documenta el acceso.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Clasificar los recorridos', Comp: PortraitPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'La hoja caliente se curvó sobre la mesa. El historial marcaba una exportación privada anterior a los cambios públicos.',
        },
        { who: 'teo', text: 'La credencial sacó una copia y después editó la otra.' },
        {
          who: 'elena',
          text: 'Ese puerto era de consulta. Mi compañera no veía quién entraba por ahí.',
        },
        {
          who: 'nar',
          text: 'Elena desenrolló el tramo de papel que había dejado debajo de la mesa.',
        },
        {
          who: 'elena',
          text: 'La aguja guardó el golpe de la descarga, y esa hora también la podemos revisar.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-trace-det',
    world: 'dynamics',
    tex: '\\tau=\\operatorname{tr}A,\\quad D=\\det A',
    name: 'Traza y determinante',
    read: 'tau igual a traza de a; de igual a determinante de a',
    meaning:
      'Para una matriz de dos componentes, son la suma y el producto de sus valores propios.',
  },
  {
    id: 'dy-discriminant',
    world: 'dynamics',
    tex: '\\Delta=\\tau^2-4D',
    name: 'Discriminante característico',
    read: 'delta igual a tau al cuadrado menos cuatro de',
    meaning: 'Distingue raíces reales y complejas del polinomio λ² − τλ + D.',
    warn: 'Δ es distinto del determinante D. Con Δ = 0 hay raíz repetida.',
  },
  {
    id: 'dy-center',
    world: 'dynamics',
    tex: '\\tau=0,\\quad D>0',
    name: 'Centro lineal',
    read: 'tau igual a cero; de mayor que cero',
    meaning:
      'En un sistema lineal real de dos componentes, tiene valores propios imaginarios puros y trayectorias cercanas cerradas.',
    warn: 'Es estable y no asintóticamente estable; la parte lineal con centro no decide la estabilidad no lineal.',
  },
];
