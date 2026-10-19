import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { CueCtx, useCue } from '../../engine/cue';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
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
import {
  BufferStrip,
  EulerWalk,
  LinearPhase,
  LogisticMap,
  PhaseLine,
  q6,
  Readout,
  SolutionTrace,
  matrixTex,
  near,
  num,
  type M2,
} from './kit';
import { CopyTable, GAP10 } from './c8-cifras';

const TIME = plane([0, 1], [0, 12], { x: 180, y: 210, w: 720, h: 460 });
const PHASE = plane([-1, 6], [-1, 5], { x: 180, y: 190, w: 720, h: 500 });
const MAP = plane([0, 1], [0, 1.1], { x: 180, y: 180, w: 720, h: 400 });
const SERIES = plane([0, 12], [0, 1], { x: 180, y: 675, w: 720, h: 110 });
const ORIGINAL: M2 = [
  [1, 0],
  [0, -2],
];
const INCOMING: M2 = [
  [-1, -2],
  [2, -1],
];
const STEPS = [1, 1 / 2, 1 / 4, 1 / 8];

function ReviewLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const cue = useCue();
  const [index, setIndex] = useState(0),
    [cursor, setCursor] = useState(0);
  const onStep = useSvgDrag(svg, (x) => {
    const next = Math.round(clamp((x - 1070) / 120, 0, 3));
    if (next !== index) setCursor(0);
    setIndex(next);
  });
  const onTime = useSvgDrag(svg, (x) => {
    const next = clamp((x - 1070) / 360, 0, 1);
    setCursor(next);
    if (beats.beat === 1 && near(STEPS[index], 1 / 8, 0.001) && near(next, 1, 0.01)) unlock();
  });
  const beat = beats.beat,
    progress = reduced ? 1 : beats.at(beat);
  return (
    <Stage ref={svg}>
      {beat === 0 && (
        <>
          <Axes P={TIME} xLabel="t" yLabel="nivel" />
          <SolutionTrace P={TIME} solution={(t) => 3 + t * t} color={C.cyan} progress={progress} />
          <SolutionTrace
            P={TIME}
            solution={(t) => 4 * 2 ** t}
            color={C.amber}
            progress={progress}
          />
          <Cap x={1250} y={220} tex="H=3+t^2" color={C.cyan} />
          <Cap x={1250} y={320} tex="R=4\cdot2^t" color={C.amber} />
          <Readout x={1250} y={445} size={19}>
            H: cm, minutos · R: mm/h, horas. Comparten el origen local 01:00, con escalas temporales
            distintas.
          </Readout>
          <Readout x={1250} y={605} size={19}>
            El nivel y la pendiente responden preguntas distintas.
          </Readout>
        </>
      )}
      {beat === 1 && (
        <>
          <Axes P={TIME} xLabel="t" yLabel="Q" />
          <EulerWalk
            P={TIME}
            f={(_t, y) => y}
            initial={[0, 4]}
            h={STEPS[index]}
            end={1}
            exact={(t) => 4 * Math.exp(t)}
            progress={cursor}
          />
          <Line a={TIME.pt(0, 10)} b={TIME.pt(1, 10)} color={C.magenta} dashed />
          <Cap x={1250} y={190} tex="Q'=Q;\quad Q_0=4" />
          <Cap x={1250} y={290} tex={'h=' + num(STEPS[index], 3)} />
          <Line a={[1070, 390]} b={[1430, 390]} width={4} />
          <Knob x={1070 + index * 120} y={390} axis="x" color={C.amber} onPointerDown={onStep} />
          {['1', '1/2', '1/4', '1/8'].map((s, i) => (
            <Cap key={s} x={1070 + i * 120} y={455} tex={s} size={20} />
          ))}
          <Cap x={1250} y={550} tex={'t\\approx' + num(cursor)} />
          <Line a={[1070, 650]} b={[1430, 650]} width={4} />
          <CueCtx.Provider value={{ ...cue, active: false }}>
            <Knob x={1070 + cursor * 360} y={650} axis="x" color={C.cyan} onPointerDown={onTime} />
          </CueCtx.Provider>
          <Readout x={1250} y={745} size={18}>
            Elige 1/8; lleva el reloj al extremo derecho, t = 1 h.
          </Readout>
        </>
      )}
      {beat === 2 && (
        <>
          <rect
            x={175}
            y={210}
            width={730}
            height={490}
            rx={14}
            fill={C.panel}
            stroke={C.muted}
            strokeWidth={3}
          />
          <Cap x={540} y={270}>
            Búfer lleno · ocupación B = 8
          </Cap>
          <BufferStrip
            occupancy={8}
            incoming={Math.floor(progress * 6)}
            outgoing={Math.floor(progress * 6)}
            y={345}
            height={180}
            readouts={false}
          />
          <PhaseLine
            P={plane([0, 12], [-1, 1], { x: 180, y: 560, w: 720, h: 180 })}
            f={(b) => b * (1 - b / 8)}
            roots={[0, 8]}
            domain={[0, 12]}
          />
          <Readout x={1250} y={245}>
            Ocupación constante. Las casillas pueden reemplazarse.
          </Readout>
          {answer !== null && (
            <Readout x={1250} y={390} color={C.green}>
              El contador de entradas permite medir el tráfico.
            </Readout>
          )}
          <Readout x={1250} y={560} size={19}>
            El equilibrio del modelo de ocupación no implica ausencia de paquetes.
          </Readout>
        </>
      )}
      {beat === 3 && (
        <>
          {[ORIGINAL, INCOMING].map((A, i) => {
            const P = plane([-3, 3], [-4.125, 4.125], { x: 180 + i * 400, y: 190, w: 320, h: 440 });
            return (
              <g key={i}>
                <LinearPhase
                  P={P}
                  A={A}
                  initial={[1, 0.5]}
                  elapsed={progress}
                  end={1}
                  clock={false}
                  color={i ? C.magenta : C.cyan}
                />
                <Cap x={340 + i * 400} y={145} size={20}>
                  {i ? 'Espiral pública' : 'Silla original'}
                </Cap>
              </g>
            );
          })}
          <Axes
            P={plane([0, 2], [-0.3, 1.2], { x: 180, y: 660, w: 720, h: 130 })}
            xLabel="t"
            yLabel="q"
          />
          <SolutionTrace
            P={plane([0, 2], [-0.3, 1.2], { x: 180, y: 660, w: 720, h: 130 })}
            solution={q6}
            cursor={progress * 2}
            color={C.amber}
          />
          <Readout x={1250} y={220}>
            Clasifica la regla antes de describir el recorrido.
          </Readout>
          <Cap x={1250} y={360} tex="D<0:\ \text{silla}" color={C.cyan} />
          <Cap
            x={1250}
            y={470}
            tex="\Delta<0,\tau<0:\ \text{espiral entrante}"
            size={19}
            color={C.magenta}
          />
          <Readout x={1250} y={610} size={19}>
            La aguja amortiguada usa posición y velocidad; el tiempo recorre cada trayectoria.
          </Readout>
        </>
      )}
      {beat === 4 && (
        <>
          <LogisticMap
            P={MAP}
            seriesP={SERIES}
            r={4}
            seeds={[0.2, 0.2001]}
            n={10}
            readouts={false}
          />
          <Cap x={1250} y={210} tex="d_n=|z_n-x_n|" />
          <Readout x={1250} y={345}>
            La separación mide el efecto de recortar el inicio.
          </Readout>
          <Readout x={1250} y={490}>
            El recibo firmado documenta acceso al pronóstico privado.
          </Readout>
          <Readout x={1250} y={640} size={19}>
            Las iteraciones no fijan la hora de tormenta. Esa ventana viene del canal R y se
            contrasta con el parte.
          </Readout>
        </>
      )}
      <Cap x={540} y={840} size={18}>
        Bancos de diagnóstico · modelos reducidos
      </Cap>
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Revisar las lecturas del Observatorio',
  intro: {
    question:
      '¿Se sostiene cada lectura del Observatorio con lo aprendido sobre sistemas dinámicos?',
    text: 'Este es el repaso del mundo: pendientes, crecimiento exponencial, el paso de Euler, equilibrios, sillas, giros y sensibilidad inicial. Cada lectura respalda una pieza del expediente. Elena tiene que devolver la consola al turno cuando terminemos.',
  },
  Scene: ReviewLesson,
  beats: [
    {
      say: 'Primero distingue un nivel de su pendiente. Conserva el reloj y las unidades de cada canal al leer el papel y la señal de intensidad.',
      dur: 4,
      board: [
        {
          label: 'Pendiente del papel',
          tex: "\\p{1}{\\cC{H'}}=\\p{2}{2t}",
          parts: ['rapidez de subida', 'regla según el tiempo'],
        },
        {
          label: 'Tasa del canal',
          tex: "\\p{1}{\\cA{R'}}=\\p{2}{(\\ln2)R}",
          parts: ['cambio de intensidad', 'crecimiento proporcional'],
        },
      ],
    },
    {
      say: 'Vuelve a comparar Euler con la referencia en el mismo tiempo final.',
      gate: 'Arrastra el paso a h = 1/8; después lleva el cursor hasta t = 1 h.',
      board: {
        label: 'Paso privado',
        tex: '\\p{1}{Q^E_8}=\\p{2}{4(9/8)^8}>\\p{3}{\\cM{10}}',
        parts: ['nivel estimado por euler', 'con ocho pasos iguales', 'umbral de comparación'],
      },
    },
    {
      say: 'La ocupación está en equilibrio aunque cambien las casillas. Mira qué lectura necesitas para saber si entran datos.',
      ask: {
        prompt: 'La ocupación no cambia. ¿Qué dato falta para saber si entran paquetes?',
        options: [
          'El color de la pantalla',
          'El contador de entradas',
          'Otro valor inicial de la logística',
        ],
        answer: 1,
        explain:
          'El equilibrio de ocupación y la ausencia de tráfico son afirmaciones distintas. El contador registra los paquetes que entran aunque otros salgan.',
      },
      board: {
        label: 'Cambio neto',
        tex: "\\p{1}{B'}=\\p{2}{\\text{entrada}}-\\p{3}{\\text{salida}}",
        parts: ['cambio de ocupación', 'paquetes que entran', 'paquetes que salen'],
      },
    },
    {
      say: 'Clasifica la regla antes de describir un recorrido particular. La silla original y la espiral pública tienen comportamientos distintos; la aguja requiere dos datos iniciales.',
      dur: 4,
      board: [
        {
          label: 'Silla',
          tex: '\\p{1}{D<0}:\\ \\p{2}{\\cC{\\text{silla}}}',
          parts: ['producto propio negativo', 'entrada y salida'],
        },
        {
          label: 'Giro y aguja',
          tex: "\\begin{aligned}\\p{1}{\\Delta<0,\\tau<0}&:\\ \\p{2}{\\text{espiral entrante}}\\\\\\p{3}{q'}&=\\p{4}{\\cM{v}}\\end{aligned}",
          parts: [
            'condición de giro entrante',
            'giro hacia el origen',
            'cambio de posición',
            'velocidad de la aguja',
          ],
        },
      ],
    },
    {
      say: 'Una diferencia de cálculo y una prueba de acceso responden preguntas distintas. Mantén cada lectura junto a su documento.',
      dur: 4,
      board: [
        {
          label: 'Separación',
          tex: '\\p{1}{\\cM{d_n}}=\\p{2}{|z_n-x_n|}',
          parts: ['distancia entre las series', 'diferencia al mismo turno'],
        },
        {
          label: 'Acceso documentado',
          tex: '\\p{1}{\\text{recibo firmado}}\\longrightarrow\\p{2}{\\text{acceso documentado}}',
          parts: ['respaldo del acceso', 'acceso con evidencia'],
        },
      ],
    },
  ],
};

function ChainDemo({ answer, beats }: DemoProps) {
  const records = [
    ['17 de agosto · 00:00', 'Papel y salida privada firmada'],
    ['17 de agosto · 00:10', 'Recibo de Halcón enlazado al mensaje'],
    ['17 de agosto · 00:20', 'Modificaciones públicas'],
    ['18 de agosto · 02:10', 'Vacunas recibidas en el Observatorio'],
    ['18 de agosto · 02:40', 'Guía de recepción en la Clínica'],
  ];
  return (
    <Stage>
      {records.map(([time, title], i) => (
        <g key={time}>
          <rect
            x={180}
            y={165 + i * 120}
            width={720}
            height={95}
            rx={9}
            fill={C.panel}
            stroke={i < 3 ? C.cyan : C.amber}
            strokeWidth={3}
          />
          <Cap x={540} y={190 + i * 120} size={20} color={i < 3 ? C.cyan : C.amber}>
            {time}
          </Cap>
          <Cap x={540} y={230 + i * 120} size={20}>
            {title}
          </Cap>
        </g>
      ))}
      <Readout x={1250} y={240}>
        Ventana del mensaje: 02:00–02:30 del 18 de agosto.
      </Readout>
      <Readout x={1250} y={390} size={19}>
        Los identificadores completos permanecen en los documentos originales.
      </Readout>
      <Readout x={1250} y={540} size={19}>
        La matemática reconstruye lo que mostraban las copias. Parte y guía registran el recorrido
        efectivo.
      </Readout>
      {answer !== null && (
        <Readout x={1250} y={710} size={19} color={C.green}>
          {beats.beat === 0
            ? 'Copia y recibo preceden a la entrega del día siguiente.'
            : 'La guía de la Clínica acredita el destino después del Observatorio.'}
        </Readout>
      )}
    </Stage>
  );
}

const PROMPTS: [string, string, string[]][] = [
  [
    'Lectura 1. Para H = 3 + t², escribe H′(1) en cm/min. Para R = 4·2ᵗ, calcula el tiempo hasta 8 en horas desde la 01:00.',
    "H'=2t;\\quad4\\cdot2^t=8",
    [
      'Distingue pendiente y nivel.',
      'La señal duplica su inicio; suma el tiempo transcurrido a la 01:00.',
    ],
  ],
  [
    'Lectura 2. Euler usa Q′ = Q, Q₀ = 4 y h = 1 hasta t = 1. Escribe la salida, decide si supera 10 y elige la comparación exacta.',
    'Q^E_1=Q_0+hQ_0;\\quad Q(1)=4e',
    [
      'Suma al inicio la pendiente multiplicada por el paso.',
      'La referencia exacta es exponencial; Euler usa un segmento recto.',
    ],
  ],
  [
    'Lectura 3. Para B′ = B(1 − B/8), escribe el equilibrio positivo. En un búfer lleno entran 2 paquetes/min durante 3 min: calcula las entradas.',
    'B(1-B/8)=0;\\quad\\text{entradas}=\\text{tasa}\\cdot\\text{tiempo}',
    [
      'El equilibrio anula la pendiente; el máximo crecimiento no la anula.',
      'La ocupación constante no borra los paquetes que entran.',
    ],
  ],
  [
    'Lectura 4. M = diag(1, −2), inicio (2; 4), t = ln 2. Escribe el estado (u; v), la traza, el determinante y el tipo de equilibrio.',
    '\\mathbf x=(2e^t;4e^{-2t})',
    [
      'Conserva los dos factores iniciales al evaluar las exponenciales.',
      'La traza suma la diagonal y el determinante la multiplica; clasifica con ambos signos.',
    ],
  ],
  [
    'Lectura 5. El papel usa c = 6 y rigidez 25: elige su régimen. Con la tabla visible, calcula la separación en n = 10 a seis decimales y elige la prueba de acceso previo.',
    '\\lambda^2+6\\lambda+25=0;\\quad d_{10}=|z_{10}-x_{10}|',
    [
      'Compara c² con cuatro veces la rigidez.',
      'Resta los índices de la fila 10; identifica el documento que enlaza a Halcón con la copia.',
    ],
  ],
];

function Readings({ round, api }: ChallengeProps) {
  const [values, setValues] = useState(['', '', '', '']);
  const [choice, setChoice] = useState<number | null>(null),
    [proof, setProof] = useState<number | null>(null);
  useEffect(() => {
    setValues(['', '', '', '']);
    setChoice(null);
    setProof(null);
    const [text, tex, hints] = PROMPTS[round];
    api.prompt(text, tex);
    api.hints(hints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const submit = () => {
    const v = values.map(parseNum);
    if (round === 0) {
      if (v[0] === null || v[1] === null) return;
      if (!near(v[0], 2))
        return api.result(
          false,
          near(v[0], 4)
            ? '4 es el nivel H(1). La pendiente se obtiene derivando H.'
            : 'Deriva t² y evalúa en t = 1; la constante 3 no aporta pendiente.',
        );
      return api.result(
        near(v[1], 1),
        near(v[1], 1)
          ? 'H′(1) = 2 cm/min. La duplicación tarda 1 h: desde la 01:00 llega a las 02:00 del 18.'
          : 'El campo pide tiempo transcurrido, no la hora del reloj. Resuelve 2ᵗ = 2 y suma después a la 01:00.',
      );
    }
    if (round === 1) {
      if (v[0] === null || choice === null || proof === null) return;
      if (!near(v[0], 8))
        return api.result(
          false,
          near(v[0], 4)
            ? '4 es el incremento. Súmalo al inicio Q₀ = 4.'
            : 'Euler da Q₀ + hQ₀. 4e corresponde a la solución exacta, no al paso público.',
        );
      if (choice !== 1) return api.result(false, 'La salida 8 está bajo 10; no activa esa marca.');
      return api.result(
        proof === 0,
        proof === 0
          ? 'Euler da 8 < 10. La referencia exacta 4e ≈ 10,873127 sí supera el umbral.'
          : 'La aproximación de Euler y la solución exacta son distintas; el inicio 4 tampoco supera 10.',
      );
    }
    if (round === 2) {
      if (v[0] === null || v[1] === null) return;
      if (!near(v[0], 8))
        return api.result(
          false,
          near(v[0], 4)
            ? '4 da el máximo crecimiento, no equilibrio: allí B′ = 2.'
            : 'Anula B(1 − B/8). Elige la raíz positiva.',
        );
      return api.result(
        near(v[1], 6),
        near(v[1], 6)
          ? 'Equilibrio positivo 8; entradas 2 × 3 = 6 aunque la ocupación siga en 8.'
          : 'La ocupación mide lo que hay dentro. El tráfico cuenta entradas: multiplica 2 paquetes/min por 3 min.',
      );
    }
    if (round === 3) {
      if (v.some((x) => x === null) || choice === null) return;
      if (!near(v[0]!, 4) || !near(v[1]!, 1))
        return api.result(
          false,
          'Evalúa 2eᵗ y 4e⁻²ᵗ en ln 2. Conserva el inicio (2; 4) y el signo de ambos exponentes.',
        );
      if (!near(v[2]!, -1)) return api.result(false, 'La traza suma 1 y −2 con sus signos.');
      if (!near(v[3]!, -2))
        return api.result(false, 'El determinante multiplica 1 por −2: es negativo.');
      return api.result(
        choice === 1,
        choice === 1
          ? 'Estado (4; 1), traza −1, determinante −2: silla.'
          : 'Una traza negativa no vuelve estable al original. D < 0 da una silla.',
      );
    }
    if (v[0] === null || choice === null || proof === null) return;
    if (choice !== 2)
      return api.result(
        false,
        '6² − 4·25 = −64: las raíces son complejas, −3 ± 4i; régimen subamortiguado.',
      );
    if (!near(v[0], GAP10, 0.000005))
      return api.result(
        false,
        'Resta z₁₀ − x₁₀, no sus inicios. Usa seis decimales: la distancia es el módulo de la diferencia.',
      );
    api.result(
      proof === 0,
      proof === 0
        ? 'Subamortiguado; d₁₀ ≈ 0,101341. El recibo de las 00:10 documenta acceso antes de la entrega.'
        : 'El movimiento y la sensibilidad verifican cálculos. El recibo firmado de las 00:10 prueba el acceso previo.',
    );
  };
  const field = (i: number, label: string, y: number, unit?: string) => (
    <NumberField
      key={i}
      x={1060}
      y={y}
      label={label}
      unit={unit}
      value={values[i]}
      onChange={(s) => setValues((vs) => vs.map((v, j) => (j === i ? s : v)))}
      onEnter={submit}
    />
  );
  const choices = (
    options: string[],
    start: number,
    selected: number | null,
    set: (v: number) => void,
  ) =>
    options.map((s, i) => (
      <Choices
        key={s}
        x={1250}
        y={start + i * 80}
        options={[i]}
        value={selected}
        onPick={set}
        render={() => <span style={{ fontSize: 'calc(var(--su) * 18)' }}>{s}</span>}
      />
    ));
  return (
    <Stage>
      {round === 0 && (
        <>
          <Axes P={TIME} xLabel="t" yLabel="nivel" />
          <SolutionTrace P={TIME} solution={(t) => 3 + t * t} color={C.cyan} />
          <SolutionTrace P={TIME} solution={(t) => 4 * 2 ** t} color={C.amber} />
          <Cap x={1250} y={200} tex="H=3+t^2" color={C.cyan} />
          <Cap x={1250} y={300} tex="R=4\cdot2^t" color={C.amber} />
          {field(0, 'H′(1) =', 440, 'cm/min')}
          {field(1, 'tiempo =', 550, 'h')}
          <Readout x={1250} y={690} size={18}>
            Origen local de R: 01:00 del 18 de agosto.
          </Readout>
        </>
      )}
      {round === 1 && (
        <>
          <Axes P={TIME} xLabel="t" yLabel="Q" />
          <EulerWalk
            P={TIME}
            f={(_t, y) => y}
            initial={[0, 4]}
            h={1}
            end={1}
            exact={(t) => 4 * Math.exp(t)}
          />
          <Line a={TIME.pt(0, 10)} b={TIME.pt(1, 10)} color={C.magenta} dashed />
          <Cap x={1250} y={180} tex="Q_0=4;\quad h=1" />
          {field(0, 'salida =', 290)}
          <Choices
            x={1250}
            y={400}
            label="¿Supera 10?"
            options={[0, 1]}
            value={choice}
            onPick={setChoice}
            render={(i) => (i === 0 ? 'Sí' : 'No')}
          />
          {choices(
            ['4e sí supera 10', 'La exacta también vale 8', 'El inicio ya superaba 10'],
            535,
            proof,
            setProof,
          )}
        </>
      )}
      {round === 2 && (
        <>
          <rect
            x={175}
            y={190}
            width={730}
            height={510}
            rx={12}
            fill={C.panel}
            stroke={C.muted}
            strokeWidth={3}
          />
          <BufferStrip
            occupancy={8}
            incoming={0}
            outgoing={0}
            y={350}
            height={180}
            readouts={false}
          />
          <Cap x={540} y={260}>
            Búfer lleno · entradas y salidas pueden compensarse
          </Cap>
          <Cap x={540} y={620} tex="B'=B(1-B/8)" />
          <Cap x={1250} y={210} tex="r=1;\quad K=8" />
          {field(0, 'equilibrio =', 350)}
          {field(1, 'entradas =', 460)}
          <Readout x={1250} y={610}>
            2 paquetes/min durante 3 min
          </Readout>
        </>
      )}
      {round === 3 && (
        <>
          <LinearPhase
            P={PHASE}
            A={ORIGINAL}
            initial={[2, 4]}
            elapsed={Math.log(2)}
            end={Math.log(2)}
            clock={false}
          />
          <Cap x={540} y={140} tex="M=\operatorname{diag}(1,-2)" />
          <Cap x={540} y={760} tex="\mathbf x_0=(2;4);\quad t=\ln2" />
          {field(0, 'u =', 190)}
          {field(1, 'v =', 280)}
          {field(2, 'τ =', 370)}
          {field(3, 'D =', 460)}
          {choices(['Nodo entrante', 'Silla', 'Centro'], 570, choice, setChoice)}
        </>
      )}
      {round === 4 && (
        <>
          <CopyTable />
          {choices(['Crítico', 'Sobreamortiguado', 'Subamortiguado'], 200, choice, setChoice)}
          {field(0, 'd₁₀ =', 475)}
          {choices(
            ['Recibo de las 00:10', 'Separación por sí sola', 'Signo de la aguja por sí solo'],
            595,
            proof,
            setProof,
          )}
        </>
      )}
      <Cap x={540} y={850} size={18}>
        Lectura {round + 1} de 5 · evidencia fija del expediente
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-final',
  world: 'dynamics',
  code: '9.★',
  title: 'La copia y el recibo',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w9-closed',
  guide: 'elena',
  teaser:
    'Cinco lecturas cierran la cadena de copias y recibos. La guía de las vacunas llega a la Clínica del Cerro.',
  learn:
    'Revisar pendientes, Euler, equilibrios, sistemas lineales y sensibilidad; enlazar los resultados con la evidencia documental.',
  glyphs: [
    'dy-equation',
    'dy-euler',
    'dy-equilibrium',
    'dy-trace-det',
    'dy-damping',
    'dy-sensitivity',
  ],
  notes: [
    {
      label: 'Traslado acreditado',
      body: '17 de agosto: salida privada 00:00, recibo 00:10, modificaciones públicas 00:20. El 18: recepción en Observatorio 02:10 y en Clínica 02:40.',
    },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Cuarto para las cuatro. El tambor se detuvo y la sala quedó en un silencio áspero; Elena tenía que devolverle la consola al turno.',
        },
        {
          who: 'elena',
          text: 'Puedes llevarte el duplicado. El original queda acá, con mi firma.',
        },
        { who: 'iris', text: 'Antes de separarlos, cinco lecturas.' },
        { who: 'tu', text: 'Deja cada cálculo junto al archivo del que salió.' },
        {
          who: 'teo',
          text: 'La guía tiene otra recepción. La misma caja llegó a la Clínica del Cerro.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La cadena de copias',
      Scene: ChainDemo,
      beats: [
        {
          say: 'Las horas de la mesa pertenecen a dos días. Conserva copia, recibo y modificación del 17 junto al parte de recepción del 18.',
          ask: {
            prompt: '¿Qué secuencia conserva la cadena documentada?',
            options: [
              'Publicación, entrega y después copia privada',
              'Entrega y después recibo del pronóstico',
              'Copia privada, recibo y después entrega',
            ],
            answer: 2,
            explain:
              'La copia y el recibo preceden a la entrega del día siguiente. Las modificaciones públicas ocurrieron después del recibo y antes de esa entrega.',
          },
          note: {
            label: 'Cronología del acceso',
            tex: '00{:}00<00{:}10<00{:}20',
            body: '17 de agosto: papel, copia firmada, recibo y modificaciones. Recepción del día siguiente a las 02:10, dentro de 02:00–02:30.',
          },
        },
        {
          say: 'El parte registra la recepción en el Observatorio y la salida inmediata. La guía adjunta continúa el recorrido.',
          ask: {
            prompt: '¿Qué documento fija el destino después del Observatorio?',
            options: [
              'La guía de recepción de la Clínica',
              'La curva de Euler por sí sola',
              'La ocupación del búfer',
            ],
            answer: 0,
            explain:
              'Los cálculos reconstruyen lo que mostraban las copias. La guía acredita recepción de las vacunas en la Clínica del Cerro a las 02:40 del 18.',
          },
          note: {
            label: 'Destino de la carga',
            tex: '02{:}10<02{:}40',
            body: 'La guía de recepción enlaza el traslado de vacunas con la Clínica del Cerro.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas del expediente', Comp: Readings, rounds: 5 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Cuatro de la mañana. Elena alisó el duplicado con el dorso de la mano, y las cinco lecturas quedaron junto a sus documentos.',
        },
        {
          who: 'elena',
          text: 'Ahora sí puedo mostrarle esto al turno. La firma de mi compañera queda con la pantalla que le dieron.',
        },
        { who: 'iris', text: 'Y la credencial de Halcón, con los archivos que cambió.' },
        {
          who: 'teo',
          text: 'La entrega de acá quedó dentro de la ventana. La guía sigue hasta la Clínica del Cerro.',
        },
        {
          who: 'nar',
          text: 'Elena se quedó con el original. En el duplicado, la firma de recepción reaparecía sobre una ficha alterada del Archivo.',
        },
      ],
    },
    {
      kind: 'scene',
      place: 'cerros',
      lines: [
        {
          who: 'nar',
          text: 'Cuatro y veinte, entrada de la Clínica del Cerro. Por la puerta entreabierta salía olor a cloro, y una técnica apretaba una carpeta contra el pecho.',
        },
        {
          who: 'nar',
          text: 'La técnica miró el parte de vacunas que traía Iris: «Las vacunas entraron por atrás. Esto salió del laboratorio después».',
        },
        { who: 'iris', text: '¿Por qué lo guardaste?' },
        {
          who: 'nar',
          text: '«Un test que da positivo demasiadas veces, incluso en las muestras que mandaron como control», dijo la técnica antes de que empezara el turno siguiente.',
        },
        { who: 'tu', text: 'Deja juntas las etiquetas y los resultados.' },
        {
          who: 'nar',
          text: 'En la carpeta, una etiqueta de la caja térmica tapaba parte de la hoja del test.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [];
