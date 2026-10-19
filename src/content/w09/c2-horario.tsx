import { Readout } from './kit';
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
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { DirectionField, SignalPlot, SolutionTrace, fmt, near, num, polynomial } from './kit';

const P = plane([0, 1.5], [0, 9], { x: 180, y: 190, w: 720, h: 480 });
const R = (t: number) => 4 * 2 ** t;
function ExponentialLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [time, setTime] = useState(0),
    [marker, setMarker] = useState(8);
  const { beat, at } = beats;
  const check = (t: number, mark: number) => {
    if (
      beat === 1 &&
      near(t, Math.log(2), 0.01) &&
      near(8 * Math.exp(-t), 4, 0.05) &&
      near(mark, 4, 0.05)
    )
      unlock();
  };
  const onTime = useSvgDrag(svg, (px) => {
    const t = Math.round(clamp((px - 1070) / 360, 0, 1) * 1000) / 1000;
    setTime(t);
    check(t, marker);
  });
  const onMarker = useSvgDrag(svg, (_px, py) => {
    const mark = Math.round(clamp((670 - py) / 60, 0, 8) * 20) / 20;
    setMarker(mark);
    check(time, mark);
  });
  const t =
    beat === 1
      ? time
      : beat === 4
        ? (reduced ? 2 : 2 * at(4)) * Math.log(2)
        : reduced
          ? 1
          : at(beat);
  const y = 2 * Math.exp(t),
    z = 8 * Math.exp(-t);
  return (
    <Stage ref={svg}>
      {beat < 2 ? (
        <>
          {[
            { x: 210, value: y, color: C.cyan, label: 'Recibe por proporción' },
            { x: 640, value: z, color: C.magenta, label: 'Pierde por proporción' },
          ].map((bar) => (
            <g key={bar.x}>
              <rect
                x={bar.x}
                y={190}
                width={220}
                height={480}
                rx={8}
                fill={C.panel}
                stroke={C.dim}
                strokeWidth={4}
              />
              <rect
                x={bar.x + 7}
                y={670 - 60 * bar.value}
                width={206}
                height={60 * bar.value - 7}
                fill={bar.color}
                fillOpacity={0.3}
              />
              <Line
                a={[bar.x + 7, 670 - 60 * bar.value]}
                b={[bar.x + 213, 670 - 60 * bar.value]}
                color={bar.color}
                width={4}
              />
              <Cap x={bar.x + 110} y={735} size={20}>
                {bar.label}
              </Cap>
              {beat === 0 && (
                <Arrow
                  from={[bar.x + 110, 600]}
                  to={[bar.x + 110, 600 - 20 * bar.value * (bar.x === 210 ? 1 : -1)]}
                  color={bar.color}
                  width={5}
                />
              )}
            </g>
          ))}
          {beat === 1 && (
            <>
              <Line a={[620, 430]} b={[880, 430]} color={C.green} dashed />
              <Knob
                x={885}
                y={670 - 60 * marker}
                onPointerDown={onMarker}
                axis="y"
                color={C.amber}
              />
              <Readout x={1250} y={380}>
                Marcador: {fmt(marker)} unidades
              </Readout>
              <Line a={[1070, 500]} b={[1430, 500]} width={4} />
              <Knob x={1070 + time * 360} y={500} onPointerDown={onTime} axis="x" color={C.amber} />
              {[0, 1].map((u) => (
                <Cap key={u} x={1070 + u * 360} y={550} tex={`${u}\\,\\mathrm h`} />
              ))}
              <Readout x={1250} y={635} size={19}>
                Lleva el marcador a 4.
              </Readout>
              <Readout x={1250} y={715} size={19}>
                Detén el reloj en esa altura.
              </Readout>
            </>
          )}
        </>
      ) : (
        <>
          <Axes P={P} xTicks={[0, 1]} yTicks={[2, 4, 6, 8]} xLabel="t" yLabel="y,z" grid />
          {beat === 2 && (
            <DirectionField
              P={P}
              f={(_t, level) => level}
              times={[0.2, 0.5, 0.8, 1.1]}
              levels={[1, 3, 5, 7]}
            />
          )}
          {beat === 5 ? (
            <SolutionTrace
              P={P}
              solution={R}
              t0={0}
              t1={1}
              cursor={t}
              slope={(u) => Math.log(2) * R(u)}
            />
          ) : (
            <>
              <SolutionTrace
                P={P}
                solution={(u) => 2 * Math.exp(u)}
                t0={0}
                t1={1}
                progress={beat === 3 && !reduced ? at(3) : 1}
              />
              <SolutionTrace
                P={P}
                solution={(u) => 8 * Math.exp(-u)}
                t0={0}
                t1={2 * Math.log(2)}
                cursor={beat === 4 ? t : undefined}
                slope={(u) => -8 * Math.exp(-u)}
                color={C.magenta}
              />
            </>
          )}
          {beat === 4 &&
            [0, 1, 2].map((n) => (
              <Dot key={n} x={P.x(n * Math.log(2))} y={P.y(8 / 2 ** n)} color={C.green} />
            ))}
          <Cap x={540} y={755} size={19}>
            Señal normalizada · t en horas desde el inicio
          </Cap>
        </>
      )}
      <Cap x={1250} y={200} tex={`t\\approx${num(t, 3)}\\,\\mathrm h`} color={C.amber} />
      {beat < 2 ? (
        <>
          <Cap x={1250} y={280} tex={`y\\approx${num(y)};\\quad z\\approx${num(z)}`} />
        </>
      ) : beat === 2 ? (
        <>
          <Cap x={1250} y={290} tex="y(0)=2;\quad z(0)=8" />
          <Cap x={1250} y={385} tex="y_0e^{k\cdot0}=y_0" color={C.cyan} />
          <Cap x={1250} y={480} tex="\frac{d}{dt}(y_0e^{kt})=ky_0e^{kt}" size={20} />
        </>
      ) : beat === 3 ? (
        <>
          <Cap x={1250} y={290} tex="y'=y,\quad y(0)=2" />
          <Cap x={1250} y={380} tex="z'=-z,\quad z(0)=8" color={C.magenta} />
          {answer !== null && (
            <>
              <Cap x={1250} y={480} tex="y(t)=2e^t" color={C.cyan} />
              <Cap x={1250} y={575} tex="z(t)=8e^{-t}" color={C.magenta} />
            </>
          )}
        </>
      ) : beat === 4 ? (
        <>
          <Cap x={1250} y={290} tex={`z(t)\\approx${num(z)}`} color={C.magenta} />
          <Cap x={1250} y={380} tex="8\longrightarrow4\longrightarrow2" color={C.green} />
          <Cap x={1250} y={480} tex="T_{1/2}=\ln2\;\mathrm h" />
        </>
      ) : (
        <>
          <Cap x={1250} y={290} tex="k=\ln2\;\mathrm{h}^{-1}" />
          <Cap x={1250} y={380} tex={`y(t)\\approx${num(R(t))}`} color={C.cyan} />
          <Cap x={1250} y={480} tex="y(0)=4;\quad y(1)=8" color={C.green} />
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Crecimiento y decaimiento exponencial',
  Scene: ExponentialLesson,
  beats: [
    {
      say: 'Una barra recibe un aporte proporcional a lo que ya tiene; la otra pierde una parte de su nivel. Con el mismo factor, una barra grande cambia más por hora.',
      dur: 4,
      board: {
        label: 'Cambio proporcional',
        tex: '\\p{1}{\\text{cambio}}\\propto\\p{2}{\\cC{\\text{nivel}}}',
        parts: ['rapidez de cambio', 'nivel que cambia'],
      },
    },
    {
      say: 'Detén el reloj cuando quede la mitad. Primero lleva el marcador a 4 y luego alinea la barra con esa altura.',
      gate: 'Arrastra el marcador amarillo a 4; mueve el reloj hasta que la barra decreciente llegue a 4.',
      board: {
        label: 'Mitad del inicio',
        tex: '\\p{1}{\\cM{z(t)}}=\\p{2}{4}',
        parts: ['nivel que queda', 'mitad del nivel inicial'],
      },
    },
    {
      say: 'La **tasa** k mide el cambio proporcional por unidad de tiempo. Su signo decide crecimiento o decaimiento; comprueba el inicio y deriva la solución.',
      dur: 4,
      board: [
        {
          label: 'Regla exponencial',
          tex: "\\p{1}{y'=\\cA{k}y}",
          parts: ['cambio proporcional al nivel'],
        },
        {
          label: 'Solución con inicio',
          tex: '\\p{1}{\\cC{y(t)}}=\\p{2}{y_0e^{\\cA{k}t}}',
          parts: ['nivel con el tiempo', 'evolución desde el inicio'],
        },
      ],
    },
    {
      say: 'Revisa qué curva conserva el inicio y la regla de crecimiento.',
      ask: {
        prompt: "Para $y'=y$ y $y(0)=2$, ¿cuál es la solución?",
        options: ['$e^t$', '$2+t$', '$2e^t$'],
        answer: 2,
        explain:
          '2eᵗ parte en 2 y su derivada es su propio nivel. eᵗ empieza en 1; 2 + t tiene pendiente constante.',
      },
      board: {
        label: 'Datos del banco',
        tex: "\\p{1}{y'=y},\\quad\\p{2}{y(0)=\\cC{2}}",
        body: 'Comprueba ambos datos antes de elegir.',
        parts: ['regla de crecimiento', 'nivel al inicio'],
      },
    },
    {
      say: 'Cada intervalo de **vida media** reduce el nivel a la mitad otra vez. Ese tiempo no depende del nivel inicial.',
      dur: 4,
      board: {
        label: 'Vida media',
        tex: '\\p{1}{T_{1/2}}=\\p{2}{\\frac{\\ln2}{|\\cA{k}|}},\\quad\\p{3}{k<0}',
        body: 'Con k = −1 por hora, la vida media es ln 2 horas.',
        parts: ['tiempo hasta la mitad', 'cálculo con la tasa', 'condición de decaimiento'],
      },
    },
    {
      say: 'Con tasa ln 2 por hora, un inicio de 4 pasa a 8 en una hora. El reloj empieza donde se tomó el dato inicial.',
      dur: 4,
      board: {
        label: 'Duplicación por hora',
        tex: '\\p{1}{4e^{(\\ln2)t}}=\\p{2}{\\cC{4\\cdot2^t}}',
        parts: ['nivel según la tasa', 'duplicación por hora'],
      },
    },
  ],
};
function ScheduleDemo({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const Q = plane([0, 2], [0, 18], { x: 180, y: 190, w: 720, h: 480 });
  const { beat } = beats;
  const growing = beat < 2;
  const acting = beat === 0 || beat === 2;
  const target = growing ? 1 : Math.log(2);
  const plot = growing ? Q : P;
  const [time, setTime] = useState(0);
  useEffect(() => setTime(beat === 0 || beat === 2 ? 0 : target), [beat, target]);
  const drag = useSvgDrag(svg, (px) => {
    if (!acting) return;
    const t = Math.round(clamp((px - plot.box.x) / plot.box.w, 0, 1) * plot.xr[1] * 1000) / 1000;
    setTime(t);
    if (near(t, target, 0.02)) {
      setTime(target);
      unlock();
    }
  });
  const t = acting ? time : target;
  const value = growing ? R(t) : 8 * Math.exp(-t);
  return (
    <Stage ref={svg}>
      {growing ? (
        <>
          <SignalPlot
            P={Q}
            curves={[{ solution: R, color: C.cyan }]}
            threshold={8}
            clock="t = 0: 01:00 del 18 de agosto · t en horas"
          />
          <Cap x={1250} y={200} tex="R'= (\ln2)R;\quad R(0)=4" size={21} />
          <Cap x={1250} y={290} tex="R(t)=4\cdot2^t\;\mathrm{mm/h}" />
          <Readout x={1250} y={380} size={20}>
            Umbral visual: 8 mm/h
          </Readout>
          <Readout x={1250} y={470} size={18}>
            Privada: 00:00 del 17 de agosto
          </Readout>
          <Readout x={1250} y={560} size={18}>
            Acuse: 00:10 del 17 · ventana 02:00–02:30 del 18
          </Readout>
          {answer !== null && (
            <>
              <Dot x={Q.x(1)} y={Q.y(8)} color={C.green} />
              <Cap x={1250} y={660} tex="t=1\,\mathrm h\Rightarrow02{:}00" color={C.green} />
            </>
          )}
        </>
      ) : (
        <>
          <SignalPlot
            P={P}
            curves={[{ solution: (t) => 8 * Math.exp(-t), color: C.magenta }]}
            threshold={4}
            clock="Banco de batería · tiempo en horas desde su inicio"
          />
          <Cap x={1250} y={210} tex="z'=-z;\quad z(0)=8" color={C.magenta} />
          <Cap x={1250} y={300} tex="T_{1/2}=\ln2\;\mathrm h" />
          {answer !== null && (
            <>
              <Dot x={P.x(Math.log(2))} y={P.y(4)} color={C.green} />
              <Cap x={1250} y={405} tex="8e^{-\ln2}=4" color={C.green} />
            </>
          )}
          <Readout x={1250} y={535} size={19}>
            El inicio previsto fue confirmado por la medición.
          </Readout>
          <Readout x={1250} y={635} size={19}>
            A las 02:00 del 18, el registro marca 8 mm/h.
          </Readout>
        </>
      )}
      {acting ? (
        <Knob x={plot.x(t)} y={plot.y(value)} onPointerDown={drag} axis="x" color={C.amber} />
      ) : (
        <Dot x={plot.x(t)} y={plot.y(value)} color={C.amber} />
      )}
      <Cap
        x={1250}
        y={735}
        size={20}
        tex={`t=${num(t, 3)}\\,\\mathrm h;\\quad ${growing ? 'R' : 'z'}=${num(value)}`}
        color={C.amber}
      />
    </Stage>
  );
}
/** Six allowed triples, uniformly chosen after excluding level/time numerical coincidences. */
const TIME_DATA = [1, 2].flatMap((a) =>
  [4, 8].flatMap((y0) => [1, 2].filter((n) => n * a !== y0 / 2 ** n).map((n) => ({ a, y0, n }))),
);
function ExponentialPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 113 + round),
      chosen = pick(r, TIME_DATA);
    const y0 = round === 2 ? chosen.y0 : pick(r, [2, 4, 8]),
      s = pick(r, [-1, 1]),
      n = round === 2 ? chosen.n : pick(r, [1, 2]),
      a = round === 2 ? chosen.a : pick(r, [1, 2, 4]);
    return {
      y0,
      s,
      n,
      a,
      k: round === 0 ? s * Math.log(2) : -Math.log(2) / a,
      target: round === 0 ? y0 * 2 ** (s * n) : round === 1 ? a : n * a,
    };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const rate =
    round === 0 ? polynomial([[d.s, '\\ln2']]) : d.a === 1 ? '-\\ln2' : `-\\frac{\\ln2}{${d.a}}`;
  useEffect(() => {
    setValue('');
    api.prompt(
      round === 0
        ? `Para $y'=ky$, $k=${rate}$ por hora e inicio ${d.y0}, calcula $y(${d.n})$.`
        : round === 1
          ? `Con tasa $k=${rate}$ por hora, calcula la vida media en horas.`
          : `Con inicio ${d.y0} y tasa $k=${rate}$ por hora, ¿cuántas horas pasan hasta llegar a ${fmt(d.y0 / 2 ** d.n)}?`,
    );
    api.hints(
      round === 0
        ? [
            'Usa el factor exponencial, multiplicado por el inicio.',
            'Cada hora duplica o divide por dos, según el signo de k.',
          ]
        : [
            'Una vida media reduce el nivel a la mitad.',
            round === 1
              ? 'Divide ln 2 por el valor absoluto de la tasa.'
              : 'Cuenta cuántas mitades separan el inicio del objetivo y multiplica por la vida media.',
          ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null) return;
    if (near(v, d.target))
      return api.result(
        true,
        round === 0
          ? `$y(${d.n})=${d.y0}\\cdot2^{${d.s * d.n}}=${num(d.target)}$.`
          : round === 1
            ? `$T_{1/2}=\\ln2/|k|=${d.a}$ h.`
            : `${d.n} ${d.n === 1 ? 'mitad' : 'mitades'}, cada una de ${d.a} h: tiempo ${d.target} h.`,
      );
    if (round === 0 && near(v, d.y0 + d.k * d.n))
      return api.result(
        false,
        'Sumaste tasa por tiempo al inicio. El crecimiento proporcional multiplica por un factor exponencial.',
      );
    if (round === 1 && near(v, -d.a))
      return api.result(
        false,
        'La vida media es un tiempo positivo. Usa el valor absoluto de k en el denominador.',
      );
    if (round === 2 && near(v, d.y0 / 2 ** d.n))
      return api.result(
        false,
        'Respondiste el nivel restante. Esta ronda pide cuánto tiempo tarda en llegar ahí.',
      );
    if (round === 2 && d.n > 1 && near(v, d.a))
      return api.result(
        false,
        'Ese tiempo cuenta una sola mitad. El objetivo requiere dos reducciones sucesivas.',
      );
    api.result(
      false,
      round === 0
        ? 'Aplica el factor 2 elevado al tiempo con su signo, y multiplica por el inicio.'
        : round === 1
          ? 'La tasa es negativa, pero el tiempo de reducción se calcula con su módulo.'
          : 'Primero compara objetivo e inicio; después cuenta los intervalos de vida media.',
    );
  };
  return (
    <Stage>
      <rect
        x={190}
        y={250}
        width={700}
        height={330}
        rx={20}
        fill={C.panel}
        stroke={C.dim}
        strokeWidth={4}
      />
      <Arrow from={[300, 415]} to={[770, 415]} color={d.k > 0 ? C.cyan : C.magenta} width={6} />
      <Cap x={300} y={340} size={27}>
        {d.y0}
      </Cap>
      <Cap x={770} y={340} size={27}>
        {round === 2 ? fmt(d.y0 / 2 ** d.n) : '?'}
      </Cap>
      <Cap x={540} y={520} size={21}>
        {round === 0 ? `${d.n} h` : round === 1 ? 'Una mitad' : `${d.n} mitades`}
      </Cap>
      <Cap x={1250} y={220} tex={`k=${rate}\\;\\mathrm{h}^{-1}`} />
      <Cap x={1250} y={310} tex={`y(0)=${d.y0}`} color={C.cyan} />
      <NumberField
        x={1060}
        y={455}
        label={round === 0 ? `y(${d.n}) =` : 'tiempo ='}
        unit={round === 0 ? undefined : 'h'}
        value={value}
        onChange={setValue}
        onEnter={submit}
      />
      <Cap x={540} y={735} size={19}>
        Banco de práctica · reloj desde el dato inicial
      </Cap>
      <Confirm onClick={submit} disabled={parseNum(value) === null} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w9-c2',
  world: 'dynamics',
  code: '9.2',
  title: 'El horario reservado',
  subtitle: 'Crecimiento y decaimiento exponencial',
  glyph: 'y_0e^{kt}',
  kind: 'level',
  guide: 'elena',
  teaser:
    'La salida privada anticipaba la ventana de tormenta. Elena exige contrastar el reloj antes de aceptar la hora de la entrega.',
  learn:
    'Resolver crecimiento proporcional, calcular vida media y traducir el tiempo del modelo a una hora del registro.',
  glyphs: ['dy-exponential', 'dy-half-life'],
  pitfalls: [
    'Una tasa proporcional se aplica multiplicando por un factor exponencial.',
    'La vida media usa el valor absoluto de la tasa negativa.',
    'Dos mitades requieren dos intervalos de vida media.',
    'El pronóstico del 17 y la medición del 18 son registros distintos.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Dos y media. Una luz de respaldo zumbaba sobre la mesa, y Elena sujetaba la cabecera junto al reloj de radio.',
        },
        {
          who: 'teo',
          text: 'La cabecera guarda el valor inicial y la tasa. Con eso puedo dibujar la curva completa.',
        },
        { who: 'iris', text: 'Primero la hora.' },
        { who: 'elena', text: 'El reloj lo comparé con la radio del puerto.' },
        {
          who: 'nar',
          text: 'Teo dio vuelta la copia. La firma estaba en el reverso, con fecha del día anterior.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La ventana del chip',
      Scene: ScheduleDemo,
      beats: [
        {
          say: 'El canal reducido R parte en 4 mm/h a la 01:00 del 18 y duplica por hora. La privada del 17 anticipaba ese inicio; el acuse de las 00:10 reservó la entrega para 02:00–02:30 del 18.',
          gate: 'Arrastra el punto por la curva hasta que R llegue al umbral de 8 mm/h.',
        },
        {
          say: 'El punto marca cuánto tiempo pasó desde la 01:00 del 18 hasta alcanzar el umbral de 8 mm/h.',
          ask: {
            prompt: '¿Cuándo alcanza 8 según esta salida?',
            options: ['A las 01:30', 'A las 02:00', 'A la 03:00'],
            answer: 1,
            explain: '$4\\cdot2^t=8$ da t = 1 h desde la 01:00: las 02:00 del 18 de agosto.',
          },
          note: {
            label: 'Inicio de la ventana',
            tex: '4e^{(\\ln2)t}=8\\Rightarrow t=1\\;\\mathrm h',
            body: 'Privada firmada a las 00:00 del 17; acuse a las 00:10 del 17. Inicio previsto a la 01:00 del 18, confirmado por medición.',
          },
        },
        {
          say: 'Contrasta el crecimiento con el banco de batería, que pierde carga según su nivel. El reloj de este banco mide desde su propio inicio.',
          gate: 'Arrastra el punto por la curva hasta que la carga baje de 8 a 4.',
        },
        {
          say: 'El punto marca la carga que queda al cabo de ln 2 horas desde el inicio del banco.',
          ask: {
            prompt: "En el banco, $z'=-z$ y $z(0)=8$. ¿Cuánto queda tras una vida media?",
            options: ['4', '$8e^{-1}$', '0'],
            answer: 0,
            explain:
              'Una vida media dura ln 2 horas aquí, y deja $8e^{-\\ln2}=4$. Una hora deja $8e^{-1}$, otro valor.',
          },
          note: {
            label: 'Vida media del banco',
            tex: '8e^{-\\ln2}=4',
            body: 'El registro observado a las 02:00 del 18 marca 8 mm/h. El acuse enlaza el pronóstico con el mensaje del chip.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar el reloj', Comp: ExponentialPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Teo puso la firma privada junto al mensaje del chip. La luz de respaldo vibraba sobre las dos fechas.',
        },
        {
          who: 'teo',
          text: 'Salida a las 00:00 del 17 y acuse diez minutos después. La medición del 18 confirmó el inicio que habían previsto.',
        },
        {
          who: 'iris',
          text: 'Confirmaron la entrega antes de que el turno recibiera el primer dato.',
        },
        {
          who: 'elena',
          text: 'También cambiaron cuánto avanzaba el reloj entre un cálculo y el siguiente.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-exponential',
    world: 'dynamics',
    tex: "y'=ky,\\quad y=y_0e^{kt}",
    name: 'Cambio exponencial',
    read: 'i cero por e elevado a ka te',
    meaning:
      'Con tasa constante k, el cambio es proporcional al nivel actual. k positivo da crecimiento; k negativo, decaimiento.',
  },
  {
    id: 'dy-half-life',
    world: 'dynamics',
    tex: 'T_{1/2}=\\frac{\\ln2}{|k|}',
    name: 'Vida media',
    read: 'te un medio igual a logaritmo natural de dos dividido por módulo de ka',
    meaning: 'Tiempo para reducir a la mitad un nivel que decae exponencialmente, con k negativo.',
    warn: 'El nivel restante y el tiempo transcurrido tienen unidades distintas.',
  },
];
