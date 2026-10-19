import { Readout } from './kit';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
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
import { pick, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { EulerWalk, SolutionTrace, euler, near, num, polynomial } from './kit';

const P = plane([0, 1.1], [0, 3.2], { x: 180, y: 190, w: 720, h: 480 });
const STEPS = [1, 1 / 2, 1 / 4];
const stepTex = (h: number) => (h === 1 ? '1' : `\\frac1{${Math.round(1 / h)}}`);
const f = (_t: number, y: number) => y;
const final = (y0: number, h: number) => euler(f, 0, y0, h, Math.round(1 / h)).at(-1)![1];
function EulerLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState(0),
    [cursor, setCursor] = useState(0);
  const { beat, at } = beats;
  const check = (i: number, t: number) => {
    if (beat === 1 && i === 2 && near(t, 1, 0.01)) unlock();
  };
  const onStep = useSvgDrag(svg, (px) => {
    const i = Math.round(clamp((px - 1070) / 180, 0, 2));
    setIndex(i);
    check(i, cursor);
  });
  const onCursor = useSvgDrag(svg, (px) => {
    const t = Math.round(clamp((px - P.x(0)) / P.sx, 0, 1) * 100) / 100;
    setCursor(t);
    check(index, t);
  });
  const h = beat === 1 ? STEPS[index] : beat === 0 ? 1 : 1 / 2;
  const progress = beat === 1 ? 1 : reduced ? 1 : at(beat);
  const nodes = euler(f, 0, 1, h, Math.round(1 / h)),
    node = nodes[Math.min(nodes.length - 1, Math.round(cursor / h))];
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[0, 1]} yTicks={[1, 2, 3]} xLabel="t" yLabel="y" grid />
      {beat === 4 ? (
        <>
          <SolutionTrace P={P} solution={Math.exp} t0={0} t1={1} />
          {STEPS.map((step, i) => (
            <EulerWalk
              key={step}
              P={P}
              f={f}
              initial={[0, 1]}
              h={step}
              end={1}
              color={[C.amber, C.magenta, C.green][i]}
            />
          ))}
        </>
      ) : (
        <EulerWalk
          P={P}
          f={f}
          initial={[0, 1]}
          h={h}
          end={1}
          exact={Math.exp}
          progress={progress}
        />
      )}
      {beat === 1 && (
        <>
          <Dot x={P.x(node[0])} y={P.y(node[1])} color={C.green} ring />
          <Line a={[P.x(0), 760]} b={[P.x(1), 760]} width={4} />
          <Knob x={P.x(cursor)} y={760} onPointerDown={onCursor} axis="x" color={C.green} />
          <Cap x={P.x(0)} y={810}>
            0
          </Cap>
          <Cap x={P.x(1)} y={810}>
            1
          </Cap>
          <Line a={[1070, 470]} b={[1430, 470]} width={4} />
          <Knob x={1070 + 180 * index} y={470} onPointerDown={onStep} axis="x" color={C.amber} />
          {STEPS.map((step, i) => (
            <Cap key={step} x={1070 + 180 * i} y={530} tex={stepTex(step)} size={20} />
          ))}
          <Readout x={1250} y={625} size={19}>
            Elige 1/4 y lleva el cursor al final.
          </Readout>
        </>
      )}
      <Cap x={1250} y={200} tex={`h=${stepTex(h)}\\;\\mathrm h`} color={C.amber} />
      <Cap x={1250} y={285} tex="t_{\mathrm{final}}=1\;\mathrm h" color={C.cyan} />
      {beat === 1 && (
        <Cap
          x={1250}
          y={370}
          tex={`t=${num(cursor)};\\quad y^E\\approx${num(node[1], 6)}`}
          size={21}
          color={C.green}
        />
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={390} tex="\Delta t=h" color={C.magenta} />
          <Cap x={1250} y={480} tex="\Delta y=h f(t_n,y_n)" color={C.green} />
          <Readout x={1250} y={585} size={19}>
            Recalcula la pendiente en cada nodo.
          </Readout>
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={385} tex="y_0=1;\quad h=\tfrac12" />
          {answer !== null && (
            <>
              <Cap x={1250} y={480} tex="\Delta y=\tfrac12\cdot1=\tfrac12" color={C.green} />
              <Cap x={1250} y={575} tex="y_1=1+\tfrac12=\tfrac32" color={C.amber} />
            </>
          )}
        </>
      )}
      {beat === 4 && (
        <>
          {STEPS.map((step, i) => (
            <Cap
              key={step}
              x={1250}
              y={390 + i * 90}
              tex={`E_{${stepTex(step)}}\\approx${num(Math.abs(Math.E - final(1, step)), 6)}`}
              color={[C.amber, C.magenta, C.green][i]}
              size={21}
            />
          ))}
          <Cap x={1250} y={685} tex={`e\\approx${num(Math.E, 6)}`} color={C.cyan} />
        </>
      )}
      {beat === 5 && (
        <>
          <Readout x={1250} y={390} size={21}>
            Ámbar: aproximación de Euler
          </Readout>
          <Readout x={1250} y={480} size={21}>
            Cian: referencia exacta
          </Readout>
          <Readout x={1250} y={585} size={19}>
            El paso debe ser adecuado para la regla.
          </Readout>
        </>
      )}
      {beat !== 1 && (
        <Cap x={540} y={755} size={19}>
          Depósito normalizado · horizonte fijo de una hora
        </Cap>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Método de Euler',
  Scene: EulerLesson,
  beats: [
    {
      say: 'Podemos avanzar un trecho con la pendiente que conocemos. La regla recta se aparta de la curva cuando esta se dobla.',
      dur: 4,
      board: { label: 'Un paso', tex: '\\p{1}{\\text{paso horizontal}}\\ \\p{2}{\\cA{h}}', parts: ['avance del reloj', 'duración del paso'] },
    },
    {
      say: 'Acorta el paso y mira cuánto se acerca el final. Cada cambio rehace la poligonal hasta la misma hora.',
      gate: 'Arrastra la perilla de h hasta 1/4; lleva el cursor inferior al último nodo, t = 1.',
      board: { label: 'Paso corto', tex: '\\p{1}{\\cA{h}}=\\p{2}{\\tfrac14}', parts: ['duración del paso', 'un cuarto de tiempo'] },
    },
    {
      say: '**Euler** recalcula la pendiente en cada nodo. La usa durante el próximo paso: primero avanza el reloj y después suma pendiente por paso.',
      dur: 4,
      board: [
        { label: 'Actualizar tiempo', tex: '\\p{1}{t_{n+1}}=\\p{2}{t_n+\\cA{h}}', parts: ['tiempo del próximo nodo', 'tiempo más un paso'] },
        {
          label: 'Actualizar estado',
          tex: '\\begin{aligned}\\p{1}{y_{n+1}}&=\\p{2}{y_n}\\\\&\\quad+\\p{3}{\\cA{h}\\cM{f(t_n,y_n)}}\\end{aligned}', parts: ['nivel del próximo nodo', 'nivel del nodo actual', 'cambio durante el paso'],
        },
      ],
    },
    {
      say: 'Desde el inicio, separa el cambio vertical del nuevo nivel.',
      ask: {
        prompt: 'Con $h=1/2$, ¿cuál es el primer cambio vertical desde $y_0=1$?',
        options: ['1', '$1/2$', '$3/2$'],
        answer: 1,
        explain: '$hf=(1/2)\\cdot1=1/2$. La pendiente inicial es 1; el nuevo nivel es 3/2.',
      },
      board: { label: 'Cambio vertical', tex: '\\p{1}{\\Delta y}=\\p{2}{\\cA{h}\\cM{f(t_0,y_0)}}', parts: ['cambio de nivel', 'pendiente por paso'] },
    },
    {
      say: 'A t = 1, los tres pasos dan 2, 9/4 y 625/256. En este ejemplo, el error final aumenta al agrandar el paso.',
      dur: 4,
      board: {
        label: 'Error al mismo tiempo',
        tex: '\\p{1}{E_h}=\\p{2}{|\\cC{e}-(1+\\cA{h})^{1/h}|}',
        body: 'La referencia exacta es e; el final de Euler es (1 + h) elevado al número de pasos.', parts: ['error al terminar', 'distancia al valor exacto'],
      },
    },
    {
      say: 'Comparaste en el mismo tiempo final. Un paso chico suele ayudar con una regla suave y dentro de un rango estable; otras ecuaciones pueden exigir otros pasos.',
      dur: 3,
      board: [
        { label: 'Aproximación', tex: '\\p{1}{\\text{Euler aproxima}}', parts: ['solución por pasos'] },
        {
          label: 'Referencia',
          tex: '\\p{1}{\\text{referencia exacta}}\\Rightarrow\\p{2}{\\text{medir el error}}', parts: ['valor para comparar', 'error de la aproximación'],
        },
      ],
    },
  ],
};
function ExportDemo({ beats, answer }: DemoProps) {
  const Q = plane([0, 1.1], [0, 12], { x: 180, y: 190, w: 720, h: 480 });
  const reveal = answer !== null;
  return (
    <Stage>
      <Axes P={Q} xTicks={[0, 1]} yTicks={[4, 8, 10]} xLabel="t" yLabel="Q" grid />
      <Line a={Q.pt(0, 10)} b={Q.pt(1.1, 10)} color={C.magenta} dashed width={3} />
      <EulerWalk P={Q} f={f} initial={[0, 4]} h={1} end={1} />
      {beats.beat === 1 && (
        <EulerWalk P={Q} f={f} initial={[0, 4]} h={1 / 8} end={1} color={C.green} />
      )}
      {reveal && <SolutionTrace P={Q} solution={(t) => 4 * Math.exp(t)} t0={0} t1={1} />}
      <Cap x={1250} y={200} tex="Q'=Q;\quad Q(0)=4" />
      <Cap x={1250} y={285} tex="t_{\mathrm{final}}=1\;\mathrm h" />
      <Cap x={1250} y={375} tex="h_{\mathrm{público}}=1\;\mathrm h" color={C.amber} />
      {beats.beat === 1 && (
        <Cap x={1250} y={465} tex="h_{\mathrm{privado}}=\tfrac18\;\mathrm h" color={C.green} />
      )}
      {reveal && (
        <Cap
          x={1250}
          y={beats.beat === 0 ? 480 : 565}
          tex={beats.beat === 0 ? 'Q^E_1=4+4=8<10' : `Q^E_8\\approx${num(final(4, 1 / 8), 6)}>10`}
          color={beats.beat === 0 ? C.amber : C.green}
          size={21}
        />
      )}
      {beats.beat === 1 && reveal && (
        <Cap
          x={1250}
          y={665}
          tex={`Q(1)=4e\\approx${num(4 * Math.E, 6)}`}
          color={C.cyan}
          size={21}
        />
      )}
      <Cap x={540} y={755} size={19}>
        Banco de validación · Q es un índice de alerta
      </Cap>
    </Stage>
  );
}
function EulerPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 127 + round),
      y0 = pick(r, round === 2 ? [1, 2, 4] : round === 1 ? [4, 8] : [2, 4, 8]),
      k = round === 0 ? pick(r, [-1, 1]) : 1,
      h = round === 0 ? pick(r, [1 / 4, 1 / 2]) : 1 / 2;
    return { y0, k, h, target: round === 0 ? y0 * (1 + h * k) : (9 * y0) / 4 };
  }, [seed, round]);
  const [value, setValue] = useState(''),
    [choice, setChoice] = useState<number | null>(null);
  useEffect(() => {
    setValue('');
    setChoice(null);
    api.prompt(
      round === 0
        ? `Para $y'=${polynomial([[d.k, 'y']])}$, $y_n=${d.y0}$ y $h=${stepTex(d.h)}$ h, calcula un paso de Euler.`
        : round === 1
          ? `Para $y'=y$, $y_0=${d.y0}$ y $h=1/2$ h, calcula el valor tras dos pasos.`
          : `Para $y'=y$ e inicio ${d.y0}, compara h = 1 y h = 1/2 en t = 1 h, con referencia $${d.y0}e$. Elige el paso de menor error y escribe su aproximación.`,
    );
    api.hints([
      'El cambio vertical es paso por pendiente; súmalo al nivel del nodo.',
      round === 0
        ? 'Evalúa ky en el nodo actual y conserva el signo de k.'
        : 'Recalcula la pendiente después del primer paso; compara siempre en t = 1.',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || (round === 2 && choice === null)) return;
    if (round === 2 && choice !== 1 / 2)
      return api.result(
        false,
        'El paso 1/2 da dos avances hasta t = 1. Su final está más cerca de la referencia; comparar un paso de cada tamaño usa horizontes distintos.',
      );
    if (near(v, d.target))
      return api.result(
        true,
        round === 0
          ? `$y_{n+1}=${d.y0}[1+(${num(d.h)})(${d.k})]=${num(d.target)}$.`
          : `$y_1=${num((d.y0 * 3) / 2)}$, $y_2=${num(d.target)}$ en t = 1 h.`,
      );
    if (round === 0 && near(v, d.y0 * (1 + d.k)))
      return api.result(
        false,
        'Omitiste h. La pendiente se multiplica por la duración del paso antes de sumarla al nivel.',
      );
    if (round === 1 && near(v, 2 * d.y0))
      return api.result(
        false,
        'Usaste la pendiente inicial en ambos pasos. La segunda pendiente se evalúa en el nivel del primer nodo.',
      );
    if (round === 2 && near(v, (3 * d.y0) / 2))
      return api.result(
        false,
        'Ese valor termina en t = 1/2. Falta el segundo paso para llegar al horizonte de una hora.',
      );
    if (round === 2 && near(v, d.y0 * Math.E))
      return api.result(
        false,
        'Respondiste la referencia exacta. El campo pide la aproximación de Euler con el paso elegido.',
      );
    api.result(
      false,
      'Multiplica la pendiente del nodo por h y súmala al nivel actual; repite con el nuevo nodo si hay dos pasos.',
    );
  };
  const Q = plane([0, 1.1], [0, d.y0 * 3.2], { x: 180, y: 190, w: 720, h: 480 });
  return (
    <Stage>
      <Axes P={Q} xTicks={[0, 1]} yTicks={[d.y0, 2 * d.y0, 3 * d.y0]} xLabel="t" yLabel="y" grid />
      {round === 2 ? (
        <>
          <SolutionTrace P={Q} solution={(t) => d.y0 * Math.exp(t)} t0={0} t1={1} />
          <EulerWalk P={Q} f={f} initial={[0, d.y0]} h={1} end={1} />
          <EulerWalk P={Q} f={f} initial={[0, d.y0]} h={1 / 2} end={1} color={C.magenta} />
        </>
      ) : (
        <>
          <Dot x={Q.x(0)} y={Q.y(d.y0)} color={C.amber} />
          <Line a={Q.pt(0, d.y0)} b={Q.pt(d.h, d.y0)} color={C.magenta} dashed />
          <Cap x={540} y={460} size={22}>
            Completa el próximo nivel.
          </Cap>
        </>
      )}
      <Cap x={1250} y={205} tex={`y'=${polynomial([[d.k, 'y']])};\\quad y_0=${d.y0}`} />
      {round !== 2 && (
        <Cap x={1250} y={295} tex={`h=${stepTex(d.h)}\\;\\mathrm h`} color={C.amber} />
      )}
      {round === 2 && (
        <Choices
          x={1250}
          y={340}
          options={[1, 1 / 2]}
          value={choice}
          onPick={setChoice}
          render={(h) => <Tex tex={`h=${stepTex(h)}`} />}
        />
      )}
      <NumberField
        x={1060}
        y={470}
        label={round === 0 ? 'y siguiente =' : 'aproximación ='}
        value={value}
        onChange={setValue}
        onEnter={submit}
      />
      <Readout x={1250} y={580} size={18}>
        Si hay fracción, escribe su decimal con coma.
      </Readout>
      <Cap x={540} y={755} size={19}>
        {round === 0 ? 'Un paso desde el nodo actual' : 'Dos pasos de media hora hasta t = 1 h'}
      </Cap>
      <Confirm
        onClick={submit}
        disabled={parseNum(value) === null || (round === 2 && choice === null)}
      />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w9-c3',
  world: 'dynamics',
  code: '9.3',
  title: 'El paso largo',
  subtitle: 'Método de Euler',
  glyph: 'y_{n+1}=y_n+hf(t_n,y_n)',
  kind: 'level',
  guide: 'elena',
  teaser:
    'El exportador público saltó entre muestras. El paso corto seguía guardado en la consola que Elena calibró.',
  learn:
    'Calcular pasos de Euler, actualizar la pendiente en cada nodo y comparar errores en un horizonte común.',
  glyphs: ['dy-euler', 'dy-error'],
  pitfalls: [
    'El incremento es h por pendiente; omitir h cambia el método.',
    'Cada paso recalcula la pendiente en el nuevo nodo.',
    'Las comparaciones deben terminar en el mismo tiempo.',
    'Euler aproxima: la poligonal no es la solución exacta.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: '18 de agosto, 02:40. El ventilador roza la carcasa de la consola; Teo guarda el archivo original en su memoria portátil.',
        },
        { who: 'elena', text: 'La máquina aguanta pasos más cortos. Los dejé guardados.' },
        { who: 'iris', text: '¿Y van a culpar al ventilador?' },
        { who: 'tu', text: 'Comparemos las dos salidas en la misma hora.' },
        { who: 'nar', text: 'En la copia pública, una casilla sigue marcada: usar para boletín.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El índice que no cruzó',
      Scene: ExportDemo,
      beats: [
        {
          say: 'El banco de validación usa Q′ = Q e inicio 4, con horizonte de una hora y umbral 10. Es una prueba del cálculo, distinta del canal de lluvia R. La pública usa h = 1 h.',
          ask: {
            prompt: '¿Qué publicó Euler con un solo paso?',
            options: ['$4e$', '12', '8'],
            answer: 2,
            explain:
              '$4+1\\cdot4=8$. El cambio vale 4 y el nuevo nivel vale 8; 4e es la referencia exacta.',
          },
          note: {
            label: 'Salida pública del banco',
            tex: 'Q^E_1=4+4=8<10',
            body: 'La casilla «usar para boletín» está junto al paso público de una hora.',
          },
        },
        {
          say: 'La privada conserva h = 1/8 h. Ambas salidas terminan en t = 1; revisa el efecto de recalcular más veces.',
          ask: {
            prompt: '¿Qué salida del banco supera el umbral?',
            options: [
              'La de $h=1/8$, con $4(9/8)^8$',
              'La de $h=1$, con 8',
              'Ambas dan lo mismo porque usan la misma regla',
            ],
            answer: 0,
            explain: `La privada da aproximadamente ${num(final(4, 1 / 8), 6).replace('{,}', ',')}; la referencia 4e da aproximadamente ${num(4 * Math.E, 6).replace('{,}', ',')}. Compartir la ecuación no iguala los errores numéricos.`,
          },
          note: {
            label: 'Privada y referencia',
            tex: `\\begin{aligned}Q^E_8&=4(9/8)^8\\approx${num(final(4, 1 / 8), 6)}>10\\\\Q(1)&=4e\\approx${num(4 * Math.E, 6)}\\end{aligned}`,
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Acortar el paso', Comp: EulerPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Elena encuentra su ajuste debajo de una versión posterior. El ventilador golpea la carcasa otra vez.',
        },
        { who: 'elena', text: 'El paso corto seguía disponible.' },
        {
          who: 'teo',
          text: 'La pantalla dice que la cola de datos estaba quieta. Pero el contador de paquetes seguía corriendo.',
        },
        {
          who: 'nar',
          text: 'El total ocupado queda fijo mientras cambia el nombre de la primera casilla.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-euler',
    world: 'dynamics',
    tex: 'y_{n+1}=y_n+hf(t_n,y_n)',
    name: 'Paso de Euler',
    read: 'i ene más uno igual a i ene más hache por efe',
    meaning: 'Aproxima el siguiente nivel usando la pendiente del nodo actual durante un paso h.',
    warn: 'Recalcula la pendiente después de cada paso.',
  },
  {
    id: 'dy-error',
    world: 'dynamics',
    tex: 'E_h=|y(t_f)-y^E(t_f)|',
    name: 'Error final',
    read: 'error igual a diferencia absoluta entre referencia y aproximación',
    meaning: 'Distancia entre solución exacta y aproximación, evaluadas en el mismo tiempo final.',
    warn: 'Un paso corto ayuda dentro de un rango adecuado para la ecuación; no garantiza estabilidad en cualquier sistema.',
  },
];
