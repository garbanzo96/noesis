import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
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
import { pick, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { BufferStrip, PhaseLine, Readout, SolutionTrace, fmt, near, num, polynomial } from './kit';

const P = plane([0, 12], [-7, 3], { x: 180, y: 180, w: 720, h: 440 });
const PHASE = plane([0, 12], [-1, 1], { x: 180, y: 665, w: 720, h: 110 });
const TIME = plane([0, 5], [0, 9], { x: 180, y: 190, w: 720, h: 480 });
const rate = (B: number) => B * (1 - B / 8);
const solution = (t: number) => 8 / (1 + Math.exp(-t));

function BufferLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [state, setState] = useState(2);
  const visitedFour = useRef(false);
  const [firstDone, setFirstDone] = useState(false);
  const { beat, at } = beats;
  const onState = useSvgDrag(svg, (px) => {
    const raw = clamp(P.inv(px, 0)[0], 0, 12);
    // in the gated beat the token snaps to half units so B = 4 can be hit by hand
    const next = beat === 1 ? Math.round(raw * 2) / 2 : Math.round(raw * 100) / 100;
    setState(next);
    if (beat !== 1) return;
    if (near(next, 4, 0.25)) {
      visitedFour.current = true;
      setFirstDone(true);
    }
    if (visitedFour.current && near(next, 12, 0.05)) unlock();
  });
  const t = 5 * (reduced ? 1 : at(beat));
  if (beat === 0) {
    const B = solution(t);
    return (
      <Stage>
        <BufferStrip
          occupancy={B}
          incoming={0}
          outgoing={0}
          y={230}
          height={400}
          readouts={false}
        />
        <Readout x={1250} y={220}>
          Banco de llenado regulado
        </Readout>
        <Cap x={1250} y={310} tex={`B\\approx${num(B)}`} color={C.amber} />
        <Cap x={1250} y={400} tex={`t_1\\approx${num(t)}\\;\\mathrm{min}`} />
        <Cap x={1250} y={490} tex={`t_2\\approx${num(t + 3)}\\;\\mathrm{min}`} />
        <Readout x={1250} y={600} size={19}>
          Dos relojes, la misma ocupación: la rapidez coincide.
        </Readout>
        <Cap x={540} y={740} size={19}>
          Casillas: representación redondeada del nivel continuo
        </Cap>
      </Stage>
    );
  }
  if (beat === 5)
    return (
      <Stage>
        <Axes P={TIME} xTicks={[0, 5]} yTicks={[4, 6, 8]} xLabel="t" yLabel="B" />
        <Line a={TIME.pt(0, 8)} b={TIME.pt(5, 8)} color={C.green} dashed />
        <SolutionTrace P={TIME} solution={solution} cursor={t} slope={(s) => rate(solution(s))} />
        <Cap x={1250} y={210} tex="B(t)=\frac8{1+e^{-t}}" color={C.cyan} />
        <Cap x={1250} y={300} tex="B(0)=4;\quad B(\ln3)=6" />
        <Readout x={1250} y={390} size={19}>
          Se acerca a 8; desde 4 no lo alcanza en tiempo finito.
        </Readout>
        <BufferStrip
          occupancy={8}
          incoming={6 * (reduced ? 1 : at(5))}
          outgoing={6 * (reduced ? 1 : at(5))}
          y={715}
          height={90}
          readouts={false}
        />
        <Cap x={1250} y={505} tex="\text{entrada}=\text{salida}=2" color={C.amber} size={20} />
        <Readout x={1250} y={595} size={19}>
          Búfer real: lleno, con reemplazos. Tasas en paquetes/min.
        </Readout>
        <Cap x={1250} y={705} tex="B'=2-2=0" color={C.green} />
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[4, 12]} yTicks={[-6, 2]} xLabel="B" yLabel="f" />
      <SolutionTrace P={P} solution={rate} color={C.cyan} />
      <PhaseLine P={PHASE} f={rate} roots={[0, 8]} domain={[0, 12]} />
      {beat === 1 && (
        <>
          <Dot x={P.x(state)} y={P.y(rate(state))} color={C.amber} />
          <Knob
            x={PHASE.x(state)}
            y={PHASE.y(0) - 60}
            onPointerDown={onState}
            axis="x"
            color={C.amber}
          />
          <Arrow
            from={[PHASE.x(state), PHASE.y(0) - 60]}
            to={[PHASE.x(state) + Math.sign(rate(state)) * 55, PHASE.y(0) - 60]}
            color={C.amber}
          />
          <Cap x={1250} y={220} tex={`B=${num(state)}`} color={C.amber} />
          <Cap x={1250} y={310} tex={`B'\\approx${num(rate(state))}`} color={C.cyan} />
          <Readout x={1250} y={415} size={19}>
            {firstDone
              ? 'Primera prueba lista. Lleva la ficha a 12.'
              : 'Lleva la ficha primero a 4; después a 12.'}
          </Readout>
          <Readout x={1250} y={535} size={19}>
            El banco de clase admite 12. El búfer físico llega solo a 8.
          </Readout>
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={230} tex="y'=f(y)" color={C.cyan} />
          <Cap x={1250} y={320} tex="f(y_*)=0" color={C.green} />
          <Readout x={1250} y={430}>
            Un equilibrio mantiene el estado.
          </Readout>
          <Readout x={1250} y={540} size={19}>
            Círculo lleno: atrae. Círculo hueco: una perturbación positiva se aleja.
          </Readout>
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={230} tex="B'=B(1-B/8)" />
          <Readout x={1250} y={340}>
            Prueba un inicio apenas mayor que cero.
          </Readout>
          {answer !== null && (
            <Readout x={1250} y={470} color={C.green}>
              Entre 0 y 8 crece hacia 8. El cero es inestable por el lado positivo.
            </Readout>
          )}
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={220} tex="y'=ry(1-y/K)" color={C.cyan} />
          <Cap x={1250} y={310} tex="r>0;\quad K>0" />
          <Readout x={1250} y={410}>
            r: tasa por minuto
          </Readout>
          <Readout x={1250} y={500}>
            K: capacidad de referencia
          </Readout>
          <Cap x={1250} y={600} tex="y_*=0,\ K" color={C.green} />
        </>
      )}
      <Cap x={540} y={830} size={19}>
        Arriba: cambio según el estado · abajo: línea de fase
      </Cap>
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Ecuaciones autónomas, equilibrios y logística',
  Scene: BufferLesson,
  beats: [
    {
      say: 'La regla usa el estado actual. Para la misma ocupación, ambos relojes muestran la misma rapidez; no necesita leer la hora.',
      dur: 4,
      board: {
        label: 'Estado y rapidez',
        tex: '\\p{1}{\\text{misma ocupación}}\\Rightarrow\\p{2}{\\cC{\\text{misma pendiente}}}',
        parts: ['igual estado actual', 'igual rapidez de cambio'],
      },
    },
    {
      say: 'Prueba a ambos lados de la marca. El banco de clase permite exceder la capacidad de referencia.',
      gate: 'Arrastra la ficha ámbar primero a B = 4 y después a B = 12.',
      board: {
        label: 'Dos pruebas',
        tex: "\\begin{aligned}\\p{1}{B'(4)}&=\\p{2}{\\cC{2}}\\\\\\p{3}{B'(12)}&=\\p{4}{\\cM{-6}}\\end{aligned}",
        parts: [
          'cambio con cuatro casillas',
          'aumento por minuto',
          'cambio con doce casillas',
          'disminución por minuto',
        ],
      },
    },
    {
      say: 'Una **ecuación autónoma** depende del estado. Un **equilibrio** mantiene ese estado porque su cambio es cero.',
      dur: 3,
      board: [
        {
          label: 'Autónoma',
          tex: "\\p{1}{y'}=\\p{2}{\\cC{f(y)}}",
          parts: ['rapidez de cambio', 'regla según el estado'],
        },
        {
          label: 'Equilibrio',
          tex: '\\p{1}{f(\\cA{y_*})}=\\p{2}{0}',
          parts: ['cambio en el equilibrio', 'ausencia de cambio'],
        },
      ],
    },
    {
      say: 'Un equilibrio estable retiene estados cercanos. Si además se acercan con el tiempo, es **asintóticamente estable**.',
      ask: {
        prompt: '¿Qué ocurre con un inicio apenas mayor que 0?',
        options: ['Vuelve a 0', 'Crece hacia 8', 'Permanece exactamente donde empezó'],
        answer: 1,
        explain:
          "En $0<B<8$, $B'>0$. El cero es inestable por el lado positivo; 8 atrae los estados cercanos.",
      },
      board: {
        label: 'Comprobar el signo',
        tex: "\\p{1}{B'}=\\p{2}{\\cA{B}}\\p{3}{(1-\\cC{B}/8)}",
        parts: ['cambio de ocupación', 'ocupación actual', 'freno por capacidad'],
      },
    },
    {
      say: 'La **logística** junta crecimiento proporcional y freno. r fija la tasa por minuto; K marca la capacidad.',
      dur: 4,
      board: [
        {
          label: 'Logística continua',
          tex: "\\p{1}{y'}=\\p{2}{\\cA{ry}}\\p{3}{(1-y/\\cC{K})}",
          body: 'r > 0 y K > 0; los equilibrios son 0 y K.',
          parts: ['rapidez de cambio', 'crecimiento proporcional', 'freno por capacidad'],
        },
        {
          label: 'Estados de reposo',
          tex: '\\p{1}{y_*}=\\p{2}{0},\\ \\p{3}{\\cC{K}}',
          parts: ['estados de equilibrio', 'ocupación vacía', 'capacidad de referencia'],
        },
      ],
    },
    {
      say: 'La curva empieza en 4 y se acerca a 8. En el búfer real lleno, entran y salen paquetes: para conocer el tráfico necesitas otro contador.',
      dur: 5,
      board: [
        {
          label: 'Curva de ejemplo',
          tex: '\\p{1}{B(t)}=\\p{2}{\\frac8{1+e^{-t}}}',
          body: 'B(0) = 4; B(ln 3) = 6. Al derivar cumple B′ = B(1 − B/8).',
          parts: ['ocupación con el tiempo', 'curva desde cuatro casillas'],
        },
        {
          label: 'Ocupación y tráfico',
          tex: "\\p{1}{B'=0}\\ \\not\\Rightarrow\\ \\p{2}{\\cM{\\text{entrada}=0}}",
          parts: ['ocupación sin cambio', 'ausencia de entradas'],
        },
      ],
    },
  ],
};

function QuietDemo({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { beat } = beats;
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState(2);
  const [visitedFour, setVisitedFour] = useState(false);
  useEffect(() => {
    if (beat === 0) setElapsed(0);
    if (beat === 2) {
      setState(2);
      setVisitedFour(false);
    }
  }, [beat]);
  const drag = useSvgDrag(svg, (x) => {
    if (beat === 0) {
      const next = Math.round(clamp(TIME.inv(x, 0)[0], 0, 3) * 100) / 100;
      setElapsed(next);
      if (near(next, 3, 0.05)) {
        setElapsed(3);
        unlock();
      }
    }
    if (beat === 2) {
      // the token snaps to half units so B = 4 and B = 8 can be hit by hand
      const next = Math.round(clamp(P.inv(x, 0)[0], 0, 12) * 2) / 2;
      setState(next);
      if (near(next, 4, 0.25)) setVisitedFour(true);
      if (visitedFour && near(next, 8, 0.25)) {
        setState(8);
        unlock();
      }
    }
  });
  const reveal = answer !== null;
  const t = beat === 0 ? elapsed : 3;
  const B = beat === 2 ? state : 8;
  if (beat >= 2)
    return (
      <Stage ref={svg}>
        <Axes P={P} xTicks={[4, 8, 12]} yTicks={[-6, 2]} xLabel="B" yLabel="f" />
        <SolutionTrace P={P} solution={rate} color={C.cyan} />
        <PhaseLine P={PHASE} f={rate} roots={[0, 8]} domain={[0, 12]} />
        <Dot x={P.x(B)} y={P.y(rate(B))} color={C.amber} />
        {beat === 2 && (
          <Knob x={PHASE.x(B)} y={PHASE.y(0) - 60} onPointerDown={drag} axis="x" color={C.amber} />
        )}
        <Cap x={1250} y={210} tex={`B=${num(B)}`} color={C.amber} />
        <Cap x={1250} y={300} tex={`B'=${num(rate(B))}`} color={C.cyan} />
        <Readout x={1250} y={410} size={19}>
          {beat === 2
            ? visitedFour
              ? 'En 4, la pendiente es 2. Lleva la ficha a 8.'
              : 'Lleva la ficha primero a 4; después a 8.'
            : 'En 8, la pendiente es cero. Revisa las flechas cercanas.'}
        </Readout>
        {beat === 3 && reveal && (
          <Readout x={1250} y={540} size={19}>
            En el modelo de llenado, 8 atrae; 4 todavía crece.
          </Readout>
        )}
        <Cap x={540} y={830} size={19}>
          Arriba: cambio según el estado · abajo: línea de fase
        </Cap>
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <BufferStrip
        occupancy={8}
        incoming={2 * t}
        outgoing={2 * t}
        y={220}
        height={400}
        readouts={false}
      />
      <Cap x={1250} y={210} tex="B=8\;\text{paquetes}" color={C.cyan} />
      <Readout x={1250} y={300}>
        Entrada: 2 paquetes/min
      </Readout>
      <Readout x={1250} y={390}>
        Salida: 2 paquetes/min
      </Readout>
      <Cap x={1250} y={480} tex={`T=${num(t)}\\;\\mathrm{min}`} />
      <Cap x={1250} y={580} tex={`\\text{entradas}=\\text{salidas}=${num(2 * t)}`} />
      <Line a={[TIME.x(0), 710]} b={[TIME.x(3), 710]} color={C.muted} />
      {[0, 1, 2, 3].map((minute) => (
        <Cap key={minute} x={TIME.x(minute)} y={765} size={19}>
          {`${minute} min`}
        </Cap>
      ))}
      {beat === 0 && <Knob x={TIME.x(t)} y={710} onPointerDown={drag} axis="x" color={C.amber} />}
      {reveal && <Cap x={1250} y={690} tex="\text{entradas}=2\cdot3=6" color={C.green} />}
      <Cap x={540} y={830} size={19}>
        Búfer físico: reemplazo de paquetes, ocupación constante
      </Cap>
    </Stage>
  );
}

function LogisticPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 131 + round);
    const K = pick(random, round === 0 ? [8, 16] : [4, 8, 12]);
    const r = pick(random, [1, 2]);
    const y = round === 0 ? K * pick(random, [1 / 4, 1 / 2, 3 / 4]) : (3 * K) / 2;
    return { K, r, y, slope: r * y * (1 - y / K) };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const equation = `y'=${polynomial([[d.r, 'y']])}(1-y/${d.K})`;
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    api.prompt(
      round === 0
        ? `Para $${equation}$, calcula la pendiente en $y=${num(d.y)}$.`
        : round === 1
          ? `Para $${equation}$, escribe los dos equilibrios de menor a mayor y elige cuál atrae estados positivos cercanos.`
          : `Para $${equation}$, prueba $y=3K/2=${num(d.y)}$ en el banco matemático y elige la dirección. Un búfer físico puede excluir ese inicio.`,
    );
    api.hints(
      round === 0
        ? [
            'Multiplica el crecimiento proporcional por el freno.',
            'Calcula primero 1 − y/K; conserva ambos factores.',
          ]
        : round === 1
          ? [
              'Un equilibrio tiene pendiente cero.',
              'Anula cada factor; K/2 tiene el mayor crecimiento, pero su pendiente no es cero.',
            ]
          : [
              'Compara el estado con la capacidad K.',
              'r e y son positivos; 1 − y/K determina el signo.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      return api.result(
        choice === 'Disminuye',
        choice === 'Disminuye'
          ? `$y'=-3rK/4=${num(d.slope)}$: vuelve hacia K.`
          : choice === 'Crece'
            ? 'r es positiva, pero el freno 1 − y/K es negativo sobre K. La pendiente apunta hacia estados menores.'
            : 'Superar K no es equilibrio: el factor 1 − y/K vale −1/2.',
      );
    }
    const a = parseNum(first);
    if (a === null) return;
    if (round === 0) {
      if (near(a, d.slope))
        return api.result(true, `$y'=${d.r}(${num(d.y)})(1-${num(d.y)}/${d.K})=${num(d.slope)}$.`);
      return api.result(
        false,
        near(a, d.r * d.y)
          ? 'Usaste solo ry. Falta multiplicar por el freno 1 − y/K.'
          : 'Reemplaza y en ambos lugares y multiplica los tres factores; no sumes el freno.',
      );
    }
    const b = parseNum(second);
    if (b === null || choice === null) return;
    if (near(a, 0) && near(b, d.K) && choice === 'K')
      return api.result(
        true,
        `Equilibrios: 0 y ${d.K}. Las flechas cercanas apuntan hacia K = ${d.K}.`,
      );
    if (near(a, d.K / 2) || near(b, d.K / 2))
      return api.result(
        false,
        `K/2 maximiza el crecimiento, con pendiente ${fmt((d.r * d.K) / 4)}. Un equilibrio exige pendiente cero.`,
      );
    if (near(a, d.K) && near(b, 0))
      return api.result(
        false,
        'Son los equilibrios, pero los campos van de menor a mayor: primero 0, después K.',
      );
    if (near(a, 0) && near(b, d.K))
      return api.result(
        false,
        'Una perturbación positiva se aleja de 0. El equilibrio K atrae los estados cercanos.',
      );
    api.result(false, 'Anula y y después 1 − y/K. Los dos ceros son 0 y K.');
  };
  const Q = plane([0, 2 * d.K], [-d.r * d.K * 2.2, (d.r * d.K) / 2], {
    x: 180,
    y: 190,
    w: 720,
    h: 480,
  });
  return (
    <Stage>
      <Axes P={Q} xTicks={[d.K, 2 * d.K]} xLabel="y" yLabel="f" />
      <SolutionTrace P={Q} solution={(y) => d.r * y * (1 - y / d.K)} />
      {round !== 1 && <Dot x={Q.x(d.y)} y={Q.y(d.slope)} color={C.amber} />}
      <Cap x={1250} y={205} tex={equation} />
      <Cap x={1250} y={295} tex={`r=${d.r};\\quad K=${d.K}`} />
      {round !== 2 && (
        <NumberField
          x={1060}
          y={405}
          label={round === 0 ? 'pendiente =' : 'menor ='}
          value={first}
          onChange={setFirst}
          onEnter={submit}
        />
      )}
      {round === 1 && (
        <>
          <NumberField
            x={1060}
            y={500}
            label="mayor ="
            value={second}
            onChange={setSecond}
            onEnter={submit}
          />
          <Choices
            x={1250}
            y={600}
            label="Atrae:"
            options={['0', 'K']}
            value={choice}
            onPick={setChoice}
          />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={1250} y={400} tex={`y=${num(d.y)}`} color={C.amber} />
          {['Disminuye', 'Crece', 'Queda igual'].map((option, i) => (
            <Choices
              key={option}
              x={1250}
              y={495 + i * 90}
              options={[option]}
              value={choice}
              onPick={setChoice}
            />
          ))}
        </>
      )}
      <Cap x={540} y={760} size={19}>
        Banco matemático · estado continuo · tiempo en minutos
      </Cap>
      <Confirm
        onClick={submit}
        disabled={
          round === 2
            ? choice === null
            : parseNum(first) === null ||
              (round === 1 && (parseNum(second) === null || choice === null))
        }
      />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-c4',
  world: 'dynamics',
  code: '9.4',
  title: 'Ocho casillas',
  subtitle: 'Ecuaciones autónomas, equilibrios y logística',
  glyph: "B'=B(1-B/8)",
  kind: 'level',
  guide: 'elena',
  teaser:
    'La ocupación queda fija, pero siguen llegando paquetes. Elena necesita recuperar uno antes de que lo reemplacen.',
  learn:
    'Reconocer equilibrios, leer signos en una línea de fase y distinguir ocupación de tráfico.',
  glyphs: ['dy-autonomous', 'dy-equilibrium', 'dy-logistic'],
  pitfalls: [
    'Una pendiente cero no implica que hayan dejado de entrar paquetes.',
    'K/2 da máximo crecimiento; los equilibrios logísticos son 0 y K.',
    'Sobre K, la pendiente es negativa aunque r sea positiva.',
    'El banco continuo puede admitir estados que el búfer físico excluye.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Diez para las tres. Una gota cayó sobre el cajón de repuestos, y las casillas del monitor seguían llenas.',
        },
        { who: 'teo', text: 'El total no cambia. Quizás se cortó la entrada.' },
        { who: 'elena', text: 'Escucha el motor. Cada golpe trae otra línea.' },
        { who: 'tu', text: 'Guarda el paquete antes del próximo golpe.' },
        {
          who: 'nar',
          text: 'El nombre de la primera casilla cambió mientras Teo buscaba cómo detener la copia.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La lectura quieta',
      Scene: QuietDemo,
      beats: [
        {
          say: 'El búfer real admite 8 paquetes. Empieza lleno: entran 2 paquetes/min y salen 2 por reemplazo durante 3 min. Esta regla de intercambio es distinta del llenado continuo.',
          gate: 'Arrastra el contador de tiempo hasta 3 min, con margen de 0,05 min.',
        },
        {
          say: 'El contador llegó a 3 min. Revisa las entradas acumuladas y la ocupación del búfer.',
          ask: {
            prompt: '¿Cuántos paquetes nuevos entraron durante esa prueba?',
            options: ['0', '8', '6'],
            answer: 2,
            explain:
              '$2\\cdot3=6$. El 8 cuenta la ocupación; el 0 cuenta el cambio neto, no las entradas.',
          },
          note: {
            label: 'Tráfico con ocupación constante',
            tex: "\\begin{aligned}B'&=2-2=0,\\quad B=8\\\\\\text{entradas}&=2\\cdot3=6\\end{aligned}",
          },
        },
        {
          say: 'Vuelve al modelo logístico de clase. El paquete recuperado conserva la matriz original del canal de presión; la pantalla pública solo retuvo el total ocupado.',
          gate: 'Arrastra la ficha primero a B = 4 y después a B = 8.',
        },
        {
          say: 'En B = 4 la pendiente es 2; en B = 8 es cero. Revisa hacia dónde apuntan las flechas a ambos lados de 8.',
          ask: {
            prompt: 'En el modelo logístico de clase, ¿qué estado positivo atrae las trayectorias?',
            options: ['8', '0', '4'],
            answer: 0,
            explain:
              'Las flechas a ambos lados de 8 apuntan hacia él. En 4 la pendiente es 2; 0 es inestable por el lado positivo.',
          },
          note: { label: 'Llenado regulado', tex: 'B_*=8;\\quad B(\\ln3)=\\frac8{1+1/3}=6' },
        },
      ],
    },
    { kind: 'challenge', title: 'Leer el estado y su cambio', Comp: LogisticPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'El motor golpeó otra vez. Teo dejó una copia inmóvil mientras las casillas seguían cambiando de nombre.',
        },
        {
          who: 'teo',
          text: 'Aquí hay dos componentes, y la pantalla las mezcló en un solo indicador.',
        },
        { who: 'elena', text: 'En el original, una flecha se aleja. En el boletín vuelve.' },
        {
          who: 'nar',
          text: 'En la copia aparecieron dos agujas, y solo una había cambiado de dirección.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-autonomous',
    world: 'dynamics',
    tex: "y'=f(y)",
    name: 'Ecuación autónoma',
    read: 'i prima igual a efe de i',
    meaning: 'Su pendiente depende del estado actual, sin dependencia explícita del reloj.',
  },
  {
    id: 'dy-equilibrium',
    world: 'dynamics',
    tex: 'f(y_*)=0',
    name: 'Equilibrio',
    read: 'efe de i estrella igual a cero',
    meaning:
      'Estado cuya pendiente es cero. Es estable si retiene estados cercanos y asintóticamente estable si además los atrae.',
  },
  {
    id: 'dy-logistic',
    world: 'dynamics',
    tex: "y'=ry(1-y/K)",
    name: 'Logística continua',
    read: 'i prima igual a erre por i por uno menos i sobre ka',
    meaning: 'Combina crecimiento proporcional y freno con tasa r positiva y capacidad K positiva.',
    warn: 'Ocupación y tráfico se miden con contadores distintos.',
  },
];
