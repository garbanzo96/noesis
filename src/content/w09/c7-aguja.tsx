import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { CueCtx, useCue } from '../../engine/cue';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
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
  DampedInstrument,
  LinearPhase,
  Readout,
  SolutionTrace,
  near,
  num,
  oscillator,
  polynomial,
  q6,
  q10,
  q26,
} from './kit';

const BRAKES = [6, 10, 26];
const REGIMES = ['Subamortiguado', 'Crítico', 'Sobreamortiguado'];
const P = plane([0, 2], [-0.15, 1.1], { x: 180, y: 200, w: 720, h: 460 });
const TARGET = Math.PI / 4;

function NeedleLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const cue = useCue();
  const [index, setIndex] = useState(2);
  const [time, setTime] = useState(0);
  const visited = useRef(false);
  const [firstDone, setFirstDone] = useState(false);
  const onBrake = useSvgDrag(svg, (x) => {
    const next = Math.round(clamp((x - 1070) / 180, 0, 2));
    if (next !== index) setTime(0);
    setIndex(next);
  });
  const onTime = useSvgDrag(svg, (x) => {
    const t = clamp((x - 1070) / 180, 0, 2);
    const next = near(t, TARGET, 0.025) ? TARGET : t;
    setTime(next);
    if (beats.beat !== 1 || !near(next, TARGET, 0.01)) return;
    if (index === 0) {
      visited.current = true;
      setFirstDone(true);
    }
    if (index === 1 && visited.current) unlock();
  });
  const beat = beats.beat;
  const t = beat === 1 ? time : (reduced ? 1 : beats.at(beat)) * 2;
  const c = beat === 1 ? BRAKES[index] : beat === 3 ? BRAKES[Math.min(2, Math.floor(t * 1.5))] : 6;
  const elapsed = beat === 3 ? (reduced ? 1 : (t * 1.5) % 1) * 2 : t;
  if (beat === 4 || beat === 5)
    return (
      <Stage>
        <Axes P={P} xTicks={[0, 1, 2]} xLabel="t" yLabel="q" />
        {[q6, q10, q26].map((f, i) => (
          <SolutionTrace key={i} P={P} solution={f} color={[C.cyan, C.amber, C.magenta][i]} />
        ))}
        <Cap x={540} y={145}>
          Mismo inicio: q = 1, v = 0
        </Cap>
        <Cap x={540} y={740} size={19}>
          Tiempo en segundos · posición desde el reposo
        </Cap>
        <Cap x={1250} y={210} tex="c=6:\ e^{-3t}(\cos4t+\frac34\sin4t)" size={20} color={C.cyan} />
        <Cap
          x={1250}
          y={305}
          tex={
            beat === 4 && answer === null ? 'c=10:\\quad q(0)=1,\\ v(0)=0' : 'c=10:\\ (1+5t)e^{-5t}'
          }
          size={21}
          color={C.amber}
        />
        <Cap x={1250} y={400} tex="c=26:\ \frac{25e^{-t}-e^{-25t}}{24}" color={C.magenta} />
        {beat === 5 && (
          <>
            <SolutionTrace
              P={P}
              solution={(s) => oscillator(10, 1, -10, s)[0]}
              color={C.green}
              progress={reduced ? 1 : beats.at(5)}
            />
            <Readout x={1250} y={510} size={19}>
              Otro inicio: c = 10, q = 1, v = −10. Puede cruzar una vez.
            </Readout>
            <Readout x={1250} y={640} size={19}>
              Con el inicio común, el crítico vuelve más rápido que el sobreamortiguado sin oscilar.
            </Readout>
          </>
        )}
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <DampedInstrument q={1} v={0} c={c} elapsed={elapsed} readouts={false} />
      <Cap x={1250} y={165} tex={'c=' + c + '\\;\\mathrm{s}^{-1}'} color={C.cyan} />
      <Cap x={1250} y={260} tex={'t\\approx' + num(elapsed, 3) + '\\;\\mathrm s'} color={C.amber} />
      <Cap x={1250} y={355} tex={'q\\approx' + num(oscillator(c, 1, 0, elapsed)[0], 6)} />
      {beat === 1 ? (
        <>
          <Line a={[1070, 450]} b={[1430, 450]} width={4} />
          <Knob x={1070 + index * 180} y={450} axis="x" onPointerDown={onBrake} color={C.cyan} />
          {BRAKES.map((b, i) => (
            <Cap key={b} x={1070 + i * 180} y={510}>
              {b}
            </Cap>
          ))}
          <Line a={[1070, 600]} b={[1430, 600]} width={4} />
          <CueCtx.Provider value={{ ...cue, active: false }}>
            <Knob x={1070 + time * 180} y={600} axis="x" onPointerDown={onTime} color={C.amber} />
          </CueCtx.Provider>
          <Cap x={1070 + TARGET * 180} y={655} tex="\pi/4" color={C.green} />
          <Readout x={1250} y={740} size={18}>
            {firstDone
              ? 'c = 6 listo. Elige 10 y vuelve a π/4.'
              : 'Elige 6 y arrastra el reloj a π/4.'}
          </Readout>
        </>
      ) : (
        <>
          <Cap
            x={1250}
            y={455}
            tex={'v\\approx' + num(oscillator(c, 1, 0, elapsed)[1], 6)}
            color={C.magenta}
          />
          <Readout x={1250} y={570} size={19}>
            {beat === 0
              ? 'Una q negativa indica el otro lado del reposo.'
              : beat === 2
                ? 'La velocidad agrega la segunda componente del estado.'
                : REGIMES[BRAKES.indexOf(c)]}
          </Readout>
          <Readout x={1250} y={695} size={18}>
            Masa normalizada · rigidez 25 s⁻²
          </Readout>
        </>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Oscilador amortiguado',
  Scene: NeedleLesson,
  beats: [
    {
      say: 'El resorte lleva la aguja al reposo y el freno limita su movimiento. Para seguirla necesitas posición y velocidad; una posición negativa queda al otro lado del cero.',
      dur: 4,
      board: {
        label: 'Dos lecturas',
        tex: '\\p{1}{\\cC{q}:\\text{ posición}};\\quad\\p{2}{\\cM{v}:\\text{ velocidad}}',
      },
    },
    {
      say: 'Compara el mismo instante con dos frenos. Mira si la aguja ya cruzó el reposo.',
      gate: 'Elige c = 6 y arrastra el reloj a π/4 s; después elige c = 10 y vuelve a π/4 s.',
      board: [
        { label: 'Cruce original', tex: '\\p{1}{q_6(\\pi/4)}=\\p{2}{\\cC{-e^{-3\\pi/4}}}<0' },
        { label: 'Copia frenada', tex: '\\p{1}{q_{10}(\\pi/4)}>\\p{2}{0}' },
      ],
    },
    {
      say: 'Llama v a la velocidad. Su cambio es la aceleración que queda después del resorte y el freno; así conviertes el segundo orden en dos ecuaciones de primer orden.',
      dur: 5,
      board: [
        { label: 'Sistema de la aguja', tex: "\\p{1}{\\cC{q'}=v};\\quad\\p{2}{\\cM{v'}=-25q-cv}" },
        {
          label: 'Matriz del instrumento',
          tex: '\\p{1}{\\frac{d}{dt}\\binom qv}=\\p{2}{\\begin{pmatrix}0&1\\\\-25&-c\\end{pmatrix}}\\p{3}{\\binom qv}',
        },
      ],
    },
    {
      say: 'Con poco freno, la aguja cruza el reposo mientras baja su amplitud. Las raíces separan los regímenes subamortiguado, crítico y sobreamortiguado.',
      dur: 6,
      board: [
        {
          label: 'Polinomio de segundo orden',
          tex: '\\p{1}{\\lambda^2}+\\p{2}{\\cA{c}\\lambda}+\\p{3}{25}=0',
        },
        {
          label: 'Raíces por freno',
          tex: '\\begin{aligned}\\p{1}{c=6}&:\\ \\p{2}{-3\\pm4i}\\\\\\p{3}{c=10}&:\\ \\p{4}{-5\\text{ doble}}\\\\\\p{5}{c=26}&:\\ \\p{6}{-1,-25}\\end{aligned}',
        },
      ],
    },
    {
      say: 'Con una raíz repetida también puede aparecer un término con t. Comprueba los dos datos iniciales antes de elegir la curva.',
      ask: {
        prompt: '¿Qué solución cumple q(0) = 1, q′(0) = 0 para c = 10?',
        options: ['$e^{-5t}$', '$(1+5t)e^{-5t}$', '$\\cos5t$'],
        answer: 1,
        explain:
          '$(1+5t)e^{-5t}$ tiene derivada $-25te^{-5t}$ y velocidad inicial cero. $e^{-5t}$ parte con velocidad −5; $\\cos5t$ no cumple la ecuación con freno.',
      },
      board: {
        label: 'Familia crítica',
        tex: '\\p{1}{q(t)}=\\p{2}{(A+Bt)}\\p{3}{\\cA{e^{-5t}}}',
        body: 'A y B se fijan con la posición y la velocidad iniciales.',
      },
    },
    {
      say: 'El régimen depende de las raíces y el inicio decide el recorrido. Con raíces reales puede haber un cruce según la velocidad inicial, pero no oscilaciones repetidas.',
      dur: 5,
      board: {
        label: 'Regímenes con c positivo',
        tex: '\\begin{aligned}\\p{1}{c^2<100}&:\\ \\p{2}{\\text{subamortiguado}}\\\\\\p{3}{c^2=100}&:\\ \\p{4}{\\text{crítico}}\\\\\\p{5}{c^2>100}&:\\ \\p{6}{\\text{sobreamortiguado}}\\end{aligned}',
      },
    },
  ],
};

function PulseDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <Axes P={P} xTicks={[0, 1, 2]} xLabel="t" yLabel="q" />
      <SolutionTrace P={P} solution={q6} color={C.cyan} />
      <SolutionTrace P={P} solution={q10} color={C.amber} />
      <Line a={P.pt(TARGET, P.yr[0])} b={P.pt(TARGET, P.yr[1])} color={C.green} dashed />
      <Dot x={P.x(TARGET)} y={P.y(q6(TARGET))} color={C.cyan} />
      <Cap x={P.x(TARGET)} y={745} tex="t=\pi/4\;\mathrm s" color={C.green} />
      <Cap x={1250} y={200} tex="q_6=e^{-3t}(\cos4t+\frac34\sin4t)" color={C.cyan} size={20} />
      <Cap x={1250} y={295} tex="q_{10}=(1+5t)e^{-5t}" color={C.amber} />
      <Readout x={1250} y={405} size={19}>
        Pulso: 00:00 del 17 de agosto. Reloj del papel contrastado con la radio del puerto.
      </Readout>
      <Readout x={1250} y={530} size={19}>
        Calibración firmada por Elena: c = 6, q(0) = 1, v(0) = 0.
      </Readout>
      {answer !== null && (
        <Readout x={1250} y={665} size={19} color={C.green}>
          {beats.beat === 0
            ? 'El signo negativo coincide con el cruce físico.'
            : 'La posición y la velocidad fijan la trayectoria; el reloj fija la hora.'}
        </Readout>
      )}
    </Stage>
  );
}

function NeedlePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 149 + round);
    const c = pick(random, BRAKES),
      q = randInt(random, 1, 2),
      v = pick(random, [0, 1]);
    const a = pick(random, [1, 2]),
      regime = randInt(random, 0, 2),
      Q = randInt(random, 1, 3);
    const roots = [
      String(-3 * a) + '\\pm' + 4 * a + 'i',
      String(-5 * a) + '\\text{ doble}',
      String(-a) + ',' + -25 * a,
    ];
    return { c, q, v, a, regime, Q, brake: BRAKES[regime] * a, stiffness: 25 * a * a, roots };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  const [choice, setChoice] = useState<number | null>(null),
    [root, setRoot] = useState<number | null>(null);
  const coeff = d.Q === 1 ? '' : String(d.Q);
  const solutions = [coeff + '(1+5t)e^{-5t}', coeff + 'e^{-5t}', coeff + '\\cos5t'];
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    setRoot(null);
    api.prompt(
      round === 0
        ? 'Con c = ' +
            d.c +
            ', q₀ = ' +
            d.q +
            ' y v₀ = ' +
            d.v +
            ', escribe el vector inicial de cambio (q′; v′).'
        : round === 1
          ? 'Con rigidez ' +
            d.stiffness +
            ' y freno ' +
            d.brake +
            ', elige el régimen y sus raíces.'
          : 'Con c = 10, q(0) = ' + d.Q + ' y v(0) = 0, elige la solución.',
      round === 1
        ? '\\lambda^2+' + d.brake + '\\lambda+' + d.stiffness + '=0'
        : "q'=v;\\quad v'=-25q-cv",
    );
    api.hints(
      round === 0
        ? [
            'La primera componente es la velocidad, no la posición.',
            'En la segunda componente resta resorte y freno.',
          ]
        : round === 1
          ? [
              'Compara c² con cuatro veces la rigidez.',
              'Raíces complejas: subamortiguado; raíz doble: crítico; reales distintas: sobreamortiguado.',
            ]
          : [
              'Evalúa posición y velocidad en t = 0.',
              'El término con t permite ajustar la velocidad inicial de la raíz repetida.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 0) {
      const a = parseNum(first),
        b = parseNum(second);
      if (a === null || b === null) return;
      if (!near(a, d.v))
        return api.result(
          false,
          'La primera componente es q′ = v₀. Escribiste otra lectura del estado.',
        );
      if (!near(b, -25 * d.q - d.c * d.v))
        return api.result(
          false,
          b > 0
            ? 'El resorte apunta al reposo: su término es −25q₀; el freno también se resta.'
            : 'Calcula −25q₀ − cv₀; la velocidad multiplica al freno.',
        );
      return api.result(true, 'Cambio inicial: $(' + d.v + ';' + (-25 * d.q - d.c * d.v) + ')$.');
    }
    if (round === 1) {
      if (choice === null || root === null) return;
      if (choice !== d.regime)
        return api.result(
          false,
          'Raíces negativas no bastan para llamar crítico al sistema. Crítico exige raíz repetida: c² = 4 veces la rigidez.',
        );
      if (root !== d.regime)
        return api.result(
          false,
          'Aplica la fórmula cuadrática con el freno y la rigidez dados; conserva el factor de escala en ambas partes de las raíces.',
        );
      return api.result(true, REGIMES[d.regime] + ': $\\lambda=' + d.roots[d.regime] + '$.');
    }
    if (choice === null) return;
    api.result(
      choice === 0,
      choice === 0
        ? '$q=' + solutions[0] + '$ conserva ambos datos iniciales.'
        : choice === 1
          ? 'Borraste el término con t: esa curva parte con velocidad ' + -5 * d.Q + ', no cero.'
          : 'El coseno conserva el inicio, pero no el decaimiento ni la ecuación con freno.',
    );
  };
  return (
    <Stage>
      {round === 1 ? (
        <LinearPhase
          P={plane([-1.2, 1.2], [-12, 12], { x: 180, y: 210, w: 720, h: 500 })}
          A={[
            [0, 1],
            [-d.stiffness, -d.brake],
          ]}
          initial={[1, 0]}
          elapsed={0.6}
          end={2}
          xLabel="q"
          yLabel="v"
          clock={false}
        />
      ) : (
        <DampedInstrument
          q={round === 2 ? d.Q : d.q}
          v={round === 0 ? d.v : 0}
          c={round === 0 ? d.c : 10}
          elapsed={0.6}
          readouts={false}
        />
      )}
      <Cap
        x={1250}
        y={170}
        tex={
          round === 1
            ? "q''+" +
              polynomial([
                [d.brake, "q'"],
                [d.stiffness, 'q'],
              ]) +
              '=0'
            : 'c=' + (round === 0 ? d.c : 10)
        }
      />
      {round === 0 ? (
        <>
          <Cap x={1250} y={265} tex={'q_0=' + d.q + ';\\quad v_0=' + d.v} />
          <NumberField
            x={1060}
            y={390}
            label="q′ ="
            value={first}
            onChange={setFirst}
            onEnter={submit}
          />
          <NumberField
            x={1060}
            y={495}
            label="v′ ="
            value={second}
            onChange={setSecond}
            onEnter={submit}
          />
        </>
      ) : (
        <>
          {(round === 1 ? REGIMES : solutions).map((s, i) => (
            <Choices
              key={s}
              x={1250}
              y={285 + i * 80}
              options={[i]}
              value={choice}
              onPick={setChoice}
              render={() =>
                round === 1 ? (
                  <span style={{ fontSize: 'calc(var(--su) * 19)' }}>{s}</span>
                ) : (
                  <Tex tex={s} />
                )
              }
            />
          ))}
          {round === 1 &&
            d.roots.map((s, i) => (
              <Choices
                key={s}
                x={1250}
                y={560 + i * 80}
                options={[i]}
                value={root}
                onPick={setRoot}
                render={() => <Tex tex={'\\lambda=' + s} />}
              />
            ))}
        </>
      )}
      <Confirm
        onClick={submit}
        disabled={
          round === 0
            ? parseNum(first) === null || parseNum(second) === null
            : choice === null || (round === 1 && root === null)
        }
      />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-c7',
  world: 'dynamics',
  code: '9.7',
  title: 'La aguja vuelve',
  subtitle: 'Oscilador amortiguado',
  glyph: "q''+cq'+25q=0",
  kind: 'level',
  guide: 'elena',
  teaser:
    'El papel conserva el pulso de la descarga. La copia pública dibuja una aguja que nunca llegó al otro lado del reposo.',
  learn:
    'Convertir segundo orden en un sistema, clasificar la amortiguación y comprobar posición y velocidad iniciales.',
  glyphs: ['dy-oscillator', 'dy-damping'],
  pitfalls: [
    'La posición negativa queda al otro lado del reposo; no mide lluvia negativa.',
    'Segundo orden necesita posición y velocidad iniciales.',
    'Una raíz negativa no basta para llamar crítico al sistema.',
    'Con raíces reales puede haber un cruce según el inicio, sin oscilación repetida.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: '18 de agosto, 03:20. El mecanismo abierto huele a aceite; Elena sostiene el rollo lejos de la consola.',
        },
        {
          who: 'elena',
          text: 'Se mueve después del golpe. Si la frenan en el archivo, parece otro mecanismo.',
        },
        { who: 'iris', text: '¿Puedes mostrar la diferencia sin abrir la consola?' },
        {
          who: 'elena',
          text: 'Todavía está en el papel. Mi compañera solo vio la copia de la pantalla.',
        },
        {
          who: 'nar',
          text: 'Elena apoya un dedo en el tambor: debajo quedó el pulso con la hora de descarga.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El pulso de exportación',
      Scene: PulseDemo,
      beats: [
        {
          say: 'La calibración firmada identifica c = 6. El archivo público conserva el inicio, pero usa c = 10. Compara el cruce del papel en t = π/4 s.',
          ask: {
            prompt: '¿Qué valor respalda el cruce que quedó en el papel?',
            options: ['$e^{-3\\pi/4}$', '0', '$-e^{-3\\pi/4}$'],
            answer: 2,
            explain:
              'En t = π/4, cos(4t) = −1 y sin(4t) = 0. Queda $-e^{-3\\pi/4}\\approx-0{,}094780$; la curva pública sigue positiva.',
          },
          note: {
            label: 'Pulso conservado',
            tex: 'q_6(\\pi/4)=-e^{-3\\pi/4}\\approx-0{,}094780',
            body: 'El cálculo valida el movimiento. El reloj independiente del papel marca 00:00 del 17 de agosto.',
          },
        },
        {
          say: 'El freno clasifica la regla, pero hay que conservar los dos datos iniciales para reconstruir la trayectoria.',
          ask: {
            prompt:
              '¿Qué dato alcanza para determinar una trayectoria con esta regla de segundo orden?',
            options: [
              'Posición y velocidad iniciales',
              'Solo la posición inicial',
              'Solo el freno',
            ],
            answer: 0,
            explain:
              'El sistema tiene dos componentes iniciales: q y v. El régimen por sí solo no fija un recorrido.',
          },
          note: {
            label: 'Segundo orden como sistema',
            tex: "q''+cq'+25q=0\\ \\Leftrightarrow\\ (q',v')=(v,-25q-cv)",
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Calibrar la aguja', Comp: NeedlePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Elena deja el pulso bajo una lámina seca; la aguja del tambor vuelve a golpear el borde.',
        },
        {
          who: 'elena',
          text: 'La descarga fue a medianoche del día anterior. Esa marca quedó aunque editaran la pantalla.',
        },
        { who: 'iris', text: 'La firma y el papel juntos.' },
        {
          who: 'teo',
          text: '¡Las condiciones de entrada también tienen dos versiones! En la pública faltan las últimas cifras.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [
  {
    id: 'dy-oscillator',
    world: 'dynamics',
    tex: "q''+cq'+25q=0",
    name: 'Oscilador amortiguado',
    read: 'segunda derivada de q más c por su derivada más veinticinco q igual a cero',
    meaning: 'Modelo de una aguja con resorte y freno; requiere posición y velocidad iniciales.',
  },
  {
    id: 'dy-damping',
    world: 'dynamics',
    tex: '\\Delta=c^2-100',
    name: 'Régimen de amortiguación',
    read: 'delta igual a c al cuadrado menos cien',
    meaning:
      'Con rigidez 25 y c positivo: Δ negativo da subamortiguado; cero, crítico; positivo, sobreamortiguado.',
    warn: 'Con raíces reales un inicio puede cruzar el reposo; no oscila repetidamente.',
  },
];
