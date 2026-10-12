import { useEffect, useMemo, useState } from 'react';
import { clamp } from '../../engine/anim';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap, NumberLine, lineMap } from '../shared/lesson';
import { pick, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, NumberField, parseNum } from '../shared/ui';
import { MatInput } from '../w04/kit';
import { Shade, gauss, num, pdf } from './kit';

// ============================================================================
// CASO 6.6 · «El margen» — intervalos de confianza
// x̄ ± margen; el 95 % de los intervalos x̄ ± 1,96 σ/√n atrapa a μ; nivel de confianza
// y tamaño de muestra; σ desconocida (s y t).
// ============================================================================

const MU = 50;
const SE = 2;

// ---------------------------------------------------------------- lesson
function CILesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const [batch, setBatch] = useState(0);
  const [lvl, setLvl] = useState<90 | 95 | 99>(95);
  const zs = { 90: 1.645, 95: 1.96, 99: 2.576 };
  if (beat === 2 || beat === 3) {
    const PI = plane([40, 60], [0, 21], { x: 300, y: 130, w: 840, h: 520 });
    const zz = beat === 3 ? zs[lvl] : 1.96;
    const r = rng(900 + batch);
    const xs = Array.from({ length: 20 }, () => gauss(r, MU, SE));
    const shown = beat === 2 ? (batch > 0 ? 20 : 0) : 20;
    const miss = xs.filter((x) => Math.abs(x - MU) > zz * SE).length;
    return (
      <Stage>
        <Axes P={PI} xTicks={[40, 44, 48, 52, 56, 60]} xLabel="\bar x" />
        <line x1={PI.x(MU)} x2={PI.x(MU)} y1={PI.box.y} y2={PI.y(0)} stroke={C.green} strokeWidth={3} />
        <Cap x={PI.x(MU)} y={PI.box.y - 16} size={18} color={C.green} tex="\mu=50" />
        {xs.slice(0, shown).map((x, k) => {
          const ok = Math.abs(x - MU) <= zz * SE;
          return (
            <g key={k}>
              <line x1={PI.x(x - zz * SE)} x2={PI.x(x + zz * SE)} y1={PI.y(k + 1)} y2={PI.y(k + 1)} stroke={ok ? C.cyan : C.red} strokeWidth={4} />
              <circle cx={PI.x(x)} cy={PI.y(k + 1)} r={5} fill={ok ? C.cyan : C.red} />
            </g>
          );
        })}
        {beat === 2 && (
          <Html x={1370} y={300} size={20} interactive>
            <button
              className="stage-btn on"
              onClick={() => {
                setBatch((b) => b + 1);
                unlock();
              }}
            >
              Tomar 20 muestras ▸
            </button>
          </Html>
        )}
        {shown > 0 && <Cap x={1370} y={380} size={22} color={miss ? C.red : C.cyan} tex={`${20 - miss}\\ \\text{de}\\ 20\\ \\text{atrapan a }\\mu`} />}
        {beat === 3 && <Choices x={1370} y={470} options={[90, 95, 99] as (90 | 95 | 99)[]} value={lvl} onPick={setLvl} render={(v) => `${v} %`} />}
        {beat === 3 && <Cap x={1370} y={540} size={20} color={C.text} tex={`z^*=${num(zz, 3)}`} />}
        {beat === 3 && answer !== null && <Cap x={1370} y={600} size={20} color={C.green} tex="E\propto\tfrac{1}{\sqrt n}" />}
      </Stage>
    );
  }
  const PL = plane([40, 60], [0, 0.22], { x: 300, y: 160, w: 840, h: 360 });
  const X = lineMap(40, 60, 300, 1140);
  const xb = 52.3;
  const f = (x: number) => pdf(x, MU, SE);
  return (
    <Stage>
      {beat === 1 && (
        <>
          <Axes P={PL} xTicks={[40, 44, 46, 48, 50, 52, 54, 56, 60]} xLabel="\bar x" />
          <Shade P={PL} f={f} a={MU - 1.96 * SE} b={MU + 1.96 * SE} color={C.violet} opacity={0.3 * at(1)} />
          <Curve P={PL} f={f} a={40} b={60} color={C.amber} width={4} />
          <Cap x={PL.x(MU)} y={PL.y(0.06)} size={20} color={C.violet} tex="95\,\%" opacity={at(1)} />
          <Cap x={PL.x(MU)} y={PL.y(0) + 50} size={18} color={C.green} tex="\mu" />
          <line x1={X(xb - 1.96 * SE)} x2={X(xb + 1.96 * SE)} y1={600} y2={600} stroke={C.cyan} strokeWidth={5} opacity={clamp(at(1) * 2 - 1, 0, 1)} />
          <circle cx={X(xb)} cy={600} r={7} fill={C.cyan} opacity={clamp(at(1) * 2 - 1, 0, 1)} />
          <Cap x={X(xb)} y={630} size={18} color={C.cyan} tex="\bar x\pm1{,}96\,\text{EE}" opacity={clamp(at(1) * 2 - 1, 0, 1)} />
        </>
      )}
      {beat === 0 && (
        <>
          <NumberLine X={X} y={480} lo={40} hi={60} step={2} />
          <circle cx={X(xb)} cy={470} r={10} fill={C.cyan} />
          <Cap x={X(xb)} y={430} size={22} color={C.cyan} tex="\bar x" />
          <line x1={X(xb - 3.92 * at(0))} x2={X(xb + 3.92 * at(0))} y1={400} y2={400} stroke={C.cyan} strokeWidth={5} />
          <Cap x={X(xb)} y={360} size={22} color={C.cyan} tex="\bar x\pm E" opacity={at(0)} />
          <Cap x={X(47)} y={540} size={20} color={C.green}>¿μ?</Cap>
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={720} y={300} size={30} color={C.text} tex="\bar x\pm z^*\frac{\sigma}{\sqrt n}\quad\longrightarrow\quad\bar x\pm t^*\frac{s}{\sqrt n}" opacity={at(4)} />
          <Cap x={720} y={400} size={20} color={C.muted}>σ conocida → σ desconocida (se estima con s)</Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Intervalos de confianza',
  Scene: CILesson,
  beats: [
    {
      say: 'Una media muestral casi nunca coincide con $\\mu$. En vez de un solo número se da un **intervalo**: $\\bar x$ más o menos un **margen de error** $E$.',
      dur: 2.6,
      board: { label: 'Intervalo', tex: '\\bigl[\\,\\p{1}{\\bar x-E},\\ \\p{2}{\\bar x+E}\\,\\bigr]' },
    },
    {
      say: 'El 95 % de las medias cae a menos de $1{,}96$ errores estándar de $\\mu$. Dándolo vuelta: en el 95 % de las muestras, $\\mu$ queda a menos de $1{,}96$ errores estándar de $\\bar x$.',
      dur: 3.6,
      board: { label: 'Intervalo de confianza 95 %', tex: '\\bar x\\pm\\p{1}{1{,}96}\\,\\p{2}{\\frac{\\sigma}{\\sqrt n}}' },
    },
    {
      say: 'El 95 % no habla de un intervalo en particular: habla del **método**. Pruébalo: cada muestra da su propio intervalo; casi todos atrapan a $\\mu$, pero no todos.',
      gate: 'Toma 20 muestras y cuenta cuántos intervalos atrapan a $\\mu$.',
      board: { label: 'Interpretación', tex: '\\approx19\\ \\text{de cada}\\ 20', body: 'El 95 % es la tasa de acierto del procedimiento. Un intervalo ya calculado contiene a $\\mu$ o no la contiene.' },
    },
    {
      say: 'Más confianza exige intervalos más anchos: el 90 % usa $1{,}645$; el 95 %, $1{,}96$; el 99 %, $2{,}576$. Y más datos los angostan.',
      ask: { prompt: 'Para reducir el margen de error a la mitad, ¿cuánto hay que aumentar $n$?', options: ['Cuatro veces', 'El doble', 'No se puede'], answer: 0, explain: 'El margen es $z^*\\sigma/\\sqrt n$: para dividirlo por 2, $\\sqrt n$ se multiplica por 2, o sea $n$ por 4.' },
      board: { label: 'Margen y tamaño', tex: '\\begin{gathered}E=z^*\\frac{\\sigma}{\\sqrt n}\\\\ \\p{1}{n=\\left(\\frac{z^*\\sigma}{E}\\right)^2}\\end{gathered}', body: '$n$ se redondea hacia arriba.' },
    },
    {
      say: 'Si no se conoce $\\sigma$, se usa la desviación de la muestra $s$. Con muestras chicas eso agrega incertidumbre y $z^*$ se cambia por un valor algo mayor, $t^*$, de la distribución $t$ de Student.',
      dur: 3.4,
      board: { label: 'σ desconocida', tex: '\\bar x\\pm t^*\\frac{s}{\\sqrt n}', body: 'Con $n$ grande, $t^*\\approx z^*$.' },
    },
  ],
};

// ---------------------------------------------------------------- demo
function RealAgeDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const X = lineMap(60, 76, 300, 1140);
  const ci = beat >= 1 && (beat > 1 || answer !== null);
  return (
    <Stage>
      <NumberLine X={X} y={480} lo={60} hi={76} step={1} labelEvery={2} />
      <circle cx={X(66)} cy={470} r={10} fill={C.cyan} opacity={beat === 0 ? at(0) : 1} />
      <Cap x={X(66)} y={430} size={22} color={C.cyan} tex="\bar x=66" />
      {ci && (
        <>
          <line x1={X(64.04)} x2={X(67.96)} y1={390} y2={390} stroke={C.cyan} strokeWidth={6} />
          <Cap x={X(64.04)} y={360} size={18} color={C.cyan} tex="64{,}04" />
          <Cap x={X(67.96)} y={360} size={18} color={C.cyan} tex="67{,}96" />
        </>
      )}
      <line x1={X(72)} x2={X(72)} y1={380} y2={480} stroke={C.magenta} strokeWidth={4} opacity={beat === 2 ? 1 : 0.4} />
      <Cap x={X(72)} y={350} size={18} color={C.magenta}>informe: 72</Cap>
      <Cap x={1370} y={230} size={22} color={C.text} tex="n=64,\ \sigma=8,\ \text{EE}=1" />
      {ci && <Cap x={1370} y={290} size={22} color={C.cyan} tex="66\pm1{,}96" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const STATEMENTS = (a: string, b: string) => [
  `Si se repitiera el muestreo muchas veces, el 95 % de los intervalos construidos así contendría la media real.`,
  `El 95 % de las fichas de la población tiene un valor entre ${a} y ${b}.`,
  `La media de la muestra está entre ${a} y ${b} con un 95 % de probabilidad.`,
];

function Intervals({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 61 + round);
    const n = pick(r, [25, 36, 49, 64, 100]);
    const s = pick(r, [5, 6, 8, 10, 12]);
    const xb = pick(r, [48.5, 62, 66.4, 70, 120.5]);
    const [sg, E] = pick(r, [
      [10, 2],
      [15, 3],
      [12, 2],
      [20, 5],
      [8, 1],
    ] as [number, number][]);
    const order = shuffle(r, [0, 1, 2]);
    return { n, s, xb, sg, E, order };
  }, [seed, round]);
  const [vals, setVals] = useState<string[]>(['', '']);
  const [val, setVal] = useState('');
  const [ch, setCh] = useState<string | null>(null);
  const set = (i: number, v: string) => setVals((o) => o.map((t, k) => (k === i ? v : t)));
  const { n, s, xb, sg, E, order } = data;
  const se = s / Math.sqrt(n);
  const lo = xb - 1.96 * se;
  const hi = xb + 1.96 * se;
  const st = STATEMENTS(num(lo).replace('{,}', ','), num(hi).replace('{,}', ','));

  useEffect(() => {
    setVals(['', '']);
    setVal('');
    setCh(null);
    if (round === 0) {
      api.prompt(`Una muestra de $n=${n}$ fichas da $\\bar x=${num(xb, 1)}$, con $\\sigma=${s}$ conocida. Calcula el intervalo de confianza del 95 %. (Dos decimales.)`, '\\bar x\\pm1{,}96\\,\\frac{\\sigma}{\\sqrt n}');
      api.hints([`$\\text{EE}=${s}/${Math.sqrt(n)}=${num(se, 3)}$.`, `Margen: $1{,}96\\cdot${num(se, 3)}=${num(1.96 * se, 3)}$.`]);
    } else if (round === 1) {
      api.prompt(`Con $\\sigma=${sg}$, ¿cuántas fichas hay que revisar para un margen de error de ${E} al 95 %?`, 'n=\\left(\\frac{1{,}96\\,\\sigma}{E}\\right)^2');
      api.hints([`$\\tfrac{1{,}96\\cdot${sg}}{${E}}=${num((1.96 * sg) / E, 2)}$.`, 'Eleva al cuadrado y redondea hacia arriba.']);
    } else {
      api.prompt(`El informe del Archivo dirá: «IC 95 %: [${num(lo).replace('{,}', ',')}; ${num(hi).replace('{,}', ',')}]». ¿Qué significa?`, '');
      api.hints(['El 95 % describe al método, no a los datos individuales.', 'Tampoco habla de $\\bar x$: el intervalo se construye alrededor de $\\bar x$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (ch === null) return;
      const k = order[['A', 'B', 'C'].indexOf(ch)];
      if (k === 0) return api.result(true, 'El 95 % es la tasa de acierto del procedimiento.');
      return api.result(false, k === 1 ? 'El intervalo es para la media, no para cada ficha: los datos individuales varían mucho más.' : 'La media de la muestra está, por construcción, en el centro del intervalo. El 95 % es sobre la media real $\\mu$.');
    }
    if (round === 1) {
      const v = parseNum(val);
      if (v === null) return;
      const raw = ((1.96 * sg) / E) ** 2;
      const t = Math.ceil(raw);
      if (Math.abs(v - t) < 0.5) return api.result(true, `$(${num((1.96 * sg) / E, 2)})^2\\approx${num(raw, 2)}$: hacen falta ${t} fichas.`);
      if (Math.abs(v - Math.floor(raw)) < 0.5) return api.result(false, `Con ${Math.floor(raw)} fichas el margen quedaría un poco mayor que ${E}. Redondea hacia arriba.`);
      if (Math.abs(v - (1.96 * sg) / E) < 0.5) return api.result(false, 'Falta elevar al cuadrado.');
      return api.result(false, `$\\tfrac{1{,}96\\cdot${sg}}{${E}}=${num((1.96 * sg) / E, 2)}$; elévalo al cuadrado.`);
    }
    const v = vals.map(parseNum);
    if (v[0] === null || v[1] === null) return;
    if (Math.abs(v[0] - lo) < 0.02 && Math.abs(v[1] - hi) < 0.02) return api.result(true, `$${num(xb, 1)}\\pm${num(1.96 * se)}=[${num(lo)};\\ ${num(hi)}]$.`);
    if (Math.abs(v[0] - (xb - 1.96 * s)) < 0.05) return api.result(false, 'Usaste $\\sigma$ en vez del error estándar $\\sigma/\\sqrt n$.');
    if (Math.abs(v[0] - (xb - se)) < 0.02) return api.result(false, 'Falta multiplicar el error estándar por 1,96.');
    return api.result(false, `Margen: $1{,}96\\cdot\\tfrac{${s}}{${Math.sqrt(n)}}=${num(1.96 * se)}$.`);
  };

  return (
    <Stage>
      {round === 0 && (
        <>
          <Cap x={600} y={320} size={30} color={C.text} tex={`n=${n},\\quad \\bar x=${num(xb, 1)},\\quad \\sigma=${s}`} />
          <MatInput x={1060} y={340} vals={vals} onChange={set} onEnter={submit} rows={1} cols={2} label="[ , ] =" />
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={600} y={320} size={30} color={C.text} tex={`\\sigma=${sg},\\quad E=${E},\\quad z^*=1{,}96`} />
          <NumberField x={1100} y={340} value={val} onChange={setVal} onEnter={submit} label="n =" width={4} />
        </>
      )}
      {round === 2 && (
        <>
          {order.map((k, i) => (
            <Html key={i} x={300} y={240 + i * 110} size={20} color={C.text} anchor="left">
              <span style={{ display: 'block', maxWidth: '38em' }}>
                <b>{'ABC'[i]}.</b> {st[k]}
              </span>
            </Html>
          ))}
          <Choices x={700} y={600} options={['A', 'B', 'C']} value={ch} onPick={setCh} />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c6',
  world: 'statistics',
  code: '6.6',
  title: 'El margen',
  subtitle: 'Intervalos de confianza',
  glyph: '\\bar x\\pm E',
  kind: 'level',
  guide: 'teo',
  teaser: 'Con una muestra no se sabe la edad media real de los vacunados, pero sí se puede acotar. Hay que dar un rango que se pueda firmar.',
  learn: 'Margen de error, intervalo de confianza para la media, interpretación del nivel de confianza, tamaño de muestra y el caso de σ desconocida.',
  glyphs: ['st-ci', 'st-margin'],
  pitfalls: ['El margen usa el error estándar $\\sigma/\\sqrt n$, no $\\sigma$.', 'El 95 % se refiere al método; no es la proporción de datos dentro del intervalo.', 'El tamaño de muestra se redondea hacia arriba.'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'nar', text: 'Archivo Regional, 15:00. Iris apoya el lápiz sobre la casilla vacía.' },
        { who: 'iris', text: 'Sesenta y seis años en la muestra. Necesito un rango para la edad promedio real antes de firmar esto.' },
        { who: 'teo', text: 'Uso las mismas 64 fichas y los ocho años de variación del informe. Puedo calcular cuánto margen dejan.' },
        { who: 'ana', text: 'Anoten de dónde sale cada dato; si la clínica objeta uno, quiero saber qué parte hay que revisar.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La edad real',
      Scene: RealAgeDemo,
      beats: [
        {
          say: 'La muestra de 64 fichas dio $\\bar x=66$. Con $\\sigma=8$, el error estándar es 1.',
          dur: 1.8,
          note: { label: 'La muestra', tex: 'n=64,\\ \\bar x=66,\\ \\text{EE}=1' },
        },
        {
          say: 'Teo calcula el intervalo del 95 %.',
          ask: { prompt: '¿Cuál es el intervalo de confianza del 95 %?', options: ['[64,04 ; 67,96]', '[58 ; 74]', '[65 ; 67]'], answer: 0, explain: '$66\\pm1{,}96\\cdot1$. El intervalo $[58;74]$ usa $\\sigma$ en vez del error estándar.' },
          note: { label: 'IC 95 % de la edad media', tex: '66\\pm1{,}96=[64{,}04;\\ 67{,}96]' },
        },
        {
          say: 'El informe oficial afirma 72 años.',
          ask: { prompt: '¿Es compatible con la muestra?', options: ['No: 72 queda muy fuera del intervalo', 'Sí: está cerca', 'No se puede saber sin más datos'], answer: 0, explain: 'Un procedimiento que acierta el 95 % de las veces deja a 72 a más de 4 unidades del borde. El informe no describe a los vacunados reales.' },
          note: { label: 'El informe no cuadra', tex: '72\\notin[64{,}04;\\ 67{,}96]' },
        },
      ],
    },
    { kind: 'challenge', title: 'Intervalos', Comp: Intervals, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'teo', text: 'El intervalo del 95 % queda de 64,04 a 67,96 años. Los 72 del informe están fuera.' },
        { who: 'ana', text: 'La copia conserva las fichas jóvenes que el original omitió. El rango respalda la diferencia; todavía hay que documentar el borrado.' },
        { who: 'iris', text: 'Anótalo así. Falta su cifra favorita: «95 % de los inscritos se vacunó».' },
        { who: 'ana', text: 'La imprimieron en la portada; ni siquiera hay que abrir la carpeta para repetirla.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'st-ci', world: 'statistics', tex: '\\bar x\\pm z^*\\tfrac{\\sigma}{\\sqrt n}', name: 'Intervalo de confianza', read: 'equis barra más menos zeta estrella sigma sobre raíz de ene', meaning: 'Rango que, con el nivel de confianza indicado, atrapa a la media real; $z^*=1{,}96$ para el 95 %.' },
  { id: 'st-margin', world: 'statistics', tex: 'E', name: 'Margen de error', read: 'e', meaning: 'Mitad del ancho del intervalo: $z^*\\sigma/\\sqrt n$.' },
];
