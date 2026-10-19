import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, NumberField, parseNum } from '../shared/ui';
import { Bars, Shade, counts, mean, num, pdf, sd } from './kit';

// ============================================================================
// CASO 6.5 · «La muestra» — distribución muestral de la media
// Población y muestra, parámetro y estadístico; la media muestral varía; teorema central
// del límite; error estándar σ/√n; puntaje z de una media.
// ============================================================================

// A skewed population: 600 waiting times (minutes), deterministic.
const POP = (() => {
  const r = rng(2089);
  return Array.from({ length: 600 }, () => Math.min(59, -10 * Math.log(1 - r())));
})();
const MU = mean(POP);
const SIG = sd(POP);
const MEANS: Record<number, number[]> = {};
function meansFor(n: number) {
  if (!MEANS[n]) {
    const r = rng(31 + n);
    MEANS[n] = Array.from({ length: 400 }, () => mean(Array.from({ length: n }, () => POP[Math.floor(r() * POP.length)])));
  }
  return MEANS[n];
}
const PP = plane([0, 40], [0, 140], { x: 300, y: 130, w: 840, h: 220 });
const PM = plane([0, 40], [0, 120], { x: 300, y: 430, w: 840, h: 220 });

// ---------------------------------------------------------------- lesson
function SampleLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const [draws, setDraws] = useState<number[][]>([]);
  const [nSel, setNSel] = useState(16);
  const take = () => {
    const r = rng(500 + draws.length);
    const s = Array.from({ length: 10 }, () => Math.floor(r() * POP.length));
    const next = [...draws, s];
    setDraws(next);
    if (next.length >= 5) unlock();
  };
  const popCounts = counts(POP, 0, 2, 20);
  if (beat === 4) {
    const P4 = plane([34, 46], [0, 0.22], { x: 300, y: 180, w: 840, h: 380 });
    const f = (x: number) => pdf(x, 40, 2);
    return (
      <Stage>
        <Axes P={P4} xTicks={[34, 36, 38, 40, 42, 44, 46]} xLabel="\bar x" />
        {answer !== null && <Shade P={P4} f={f} a={44} b={46} color={C.magenta} opacity={0.5} />}
        <Curve P={P4} f={f} a={34} b={46} color={C.amber} width={4} />
        <line x1={P4.x(44)} x2={P4.x(44)} y1={P4.box.y + 40} y2={P4.y(0)} stroke={C.magenta} strokeWidth={3} />
        <Cap x={1370} y={240} size={22} color={C.text} tex="\mu=40,\ \sigma=12,\ n=36" />
        <Cap x={1370} y={300} size={22} color={C.amber} tex="\text{EE}=\tfrac{12}{6}=2" />
        {answer !== null && <Cap x={1370} y={360} size={22} color={C.magenta} tex="z=\tfrac{44-40}{2}=2" />}
      </Stage>
    );
  }
  const n = beat === 3 ? nSel : 10;
  const ms = beat === 1 ? draws.map((s) => mean(s.map((i) => POP[i]))) : meansFor(n).slice(0, beat === 2 ? Math.round(400 * at(2)) : 400);
  const mc = counts(ms, 0, beat === 1 ? 2 : 1, beat === 1 ? 20 : 40);
  const scale = beat === 1 ? 1 : 120 / Math.max(1, ...counts(meansFor(n), 0, 1, 40));
  const last = draws[draws.length - 1] ?? [];
  const se = SIG / Math.sqrt(n);
  return (
    <Stage>
      <Axes P={PP} xTicks={[0, 10, 20, 30, 40]} xLabel="\text{min}" />
      <Bars P={PP} lo={0} w={2} cs={popCounts} color={C.cyan} opacity={0.4} />
      <Cap x={1300} y={170} size={18} color={C.cyan} anchor="left">población</Cap>
      <line x1={PP.x(MU)} x2={PP.x(MU)} y1={PP.box.y} y2={PP.y(0)} stroke={C.green} strokeWidth={2} strokeDasharray="6 6" />
      <Cap x={PP.x(MU) + 30} y={PP.box.y + 14} size={16} color={C.green} tex={`\\mu\\approx${num(MU, 1)}`} />
      {beat === 0 &&
        [3, 41, 77, 120, 199, 260, 333, 402, 480, 555].map((i, k) => (
          <circle key={k} cx={PP.x(POP[i])} cy={PP.y(0) + 16} r={7} fill={C.amber} opacity={at(0)} />
        ))}
      {beat === 1 &&
        last.map((i, k) => <circle key={k} cx={PP.x(POP[i])} cy={PP.y(0) + 16} r={7} fill={C.amber} />)}
      {beat >= 1 && (
        <>
          <Axes P={PM} xTicks={[0, 10, 20, 30, 40]} xLabel="\bar x" />
          <Bars P={PM} lo={0} w={beat === 1 ? 2 : 1} cs={mc.map((c) => c * (beat === 1 ? 10 : scale))} color={C.amber} opacity={0.6} />
          <Cap x={1300} y={470} size={18} color={C.amber} anchor="left">medias de muestras</Cap>
        </>
      )}
      {beat >= 2 && <Curve P={PM} f={(x) => (pdf(x, MU, se) * 120) / pdf(MU, MU, se)} a={0} b={40} color={C.green} width={3} opacity={beat === 2 ? at(2) : 1} />}
      {beat === 0 && <Cap x={1370} y={420} size={22} color={C.amber} tex="\bar x=\text{media de la muestra}" opacity={at(0)} />}
      {beat === 1 && (
        <>
          <Html x={1370} y={290} size={20} interactive>
            <button className="stage-btn on" onClick={take}>
              Tomar muestra ▸
            </button>
          </Html>
          <Cap x={1370} y={340} size={18} color={C.muted}>{`${draws.length} muestras de 10`}</Cap>
          {ms.length > 0 && <Cap x={1370} y={385} size={20} color={C.amber} tex={`\\bar x=${num(ms[ms.length - 1], 1)}`} />}
        </>
      )}
      {beat === 3 && (
        <>
          <Choices x={1370} y={560} options={[4, 16, 64]} value={nSel} onPick={setNSel} render={(v) => `n = ${v}`} />
          <Cap x={1370} y={620} size={20} color={C.green} tex={`\\text{EE}=\\tfrac{${num(SIG, 1)}}{\\sqrt{${n}}}\\approx${num(se, 1)}`} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Distribución muestral de la media',
  Scene: SampleLesson,
  beats: [
    {
      say: 'La **población** es el conjunto completo (aquí, 600 tiempos de espera, con una cola larga a la derecha). Una **muestra** es una parte elegida al azar. Lo que se calcula con la población es un **parámetro**, como $\\mu$; con la muestra, un **estadístico**, como $\\bar x$.',
      dur: 3.6,
      board: { label: 'Población y muestra', tex: '\\underbrace{\\mu,\\ \\sigma}_{\\p{1}{\\text{parámetros}}}\\qquad\\underbrace{\\bar x,\\ s}_{\\p{2}{\\text{estadísticos}}}', parts: ['describen toda la población', 'describen solo la muestra'] },
    },
    {
      say: 'Cada muestra da una media distinta: $\\bar x$ también es aleatoria. Saca varias y mira dónde caen.',
      gate: 'Toma al menos 5 muestras de 10 tiempos.',
      board: { label: 'Variabilidad muestral', tex: '\\bar x_1,\\ \\bar x_2,\\ \\bar x_3,\\ \\dots', body: 'Cada muestra entrega un valor distinto de $\\bar x$.' },
    },
    {
      say: 'Con cientos de muestras, las medias forman una **campana** centrada en $\\mu$, aunque la población esté torcida. Es el **teorema central del límite**.',
      dur: 4,
      board: { label: 'Teorema central del límite', tex: '\\bar X\\approx N\\!\\left(\\p{1}{\\mu},\\ \\p{2}{\\frac{\\sigma^2}{n}}\\right)', body: 'Para $n$ grande; en la práctica, desde $n\\approx30$ suele bastar.', parts: ['centro de las medias', 'varianza de las medias'] },
    },
    {
      say: 'El ancho de esa campana es el **error estándar**: la desviación típica de $\\bar x$. Disminuye con la raíz del tamaño de la muestra.',
      ask: { prompt: 'Si $n$ se multiplica por 4, ¿qué le pasa al error estándar?', options: ['Se reduce a la mitad', 'Se reduce a la cuarta parte', 'No cambia'], answer: 0, explain: '$\\sigma/\\sqrt{4n}=\\tfrac12\\,\\sigma/\\sqrt n$. Prueba con $n=4$, 16 y 64: cada salto parte el ancho a la mitad.' },
      board: { label: 'Error estándar', tex: '\\text{EE}=\\frac{\\p{1}{\\sigma}}{\\p{2}{\\sqrt n}}', parts: ['dispersión de la población', 'reducción por tamaño'] },
    },
    {
      say: 'Con el error estándar se puede medir qué tan lejos de $\\mu$ cae una media, igual que con un dato: en errores estándar.',
      ask: { prompt: 'Con $\\mu=40$, $\\sigma=12$ y $n=36$, ¿qué tan probable es obtener $\\bar x>44$?', options: ['≈ 2,5 %', '≈ 16 %', '≈ 50 %'], answer: 0, explain: '$\\text{EE}=12/6=2$, así que $z=(44-40)/2=2$. Sobre $z=2$ queda la mitad del 5 %: 2,5 %.' },
      board: { label: 'z de una media', tex: '\\p{1}{z}=\\p{2}{\\frac{\\bar x-\\mu}{\\sigma/\\sqrt n}}', parts: ['distancia estandarizada', 'diferencia sobre su error'] },
    },
  ],
};

// ---------------------------------------------------------------- demo
const PD = plane([62, 80], [0, 0.42], { x: 300, y: 170, w: 840, h: 400 });

function AgesDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const f = (x: number) => pdf(x, 72, 1);
  const se = beat >= 1 && (beat > 1 || answer !== null);
  return (
    <Stage>
      <Axes P={PD} xTicks={[62, 64, 66, 68, 70, 72, 74, 76, 78, 80]} xLabel="\bar x\ (\text{años})" />
      {se && <Shade P={PD} f={f} a={69} b={75} color={C.violet} opacity={0.25} />}
      {se && <Curve P={PD} f={f} a={62} b={80} color={C.amber} width={4} />}
      <line x1={PD.x(72)} x2={PD.x(72)} y1={PD.box.y} y2={PD.y(0)} stroke={C.green} strokeWidth={2} strokeDasharray="6 6" opacity={beat === 0 ? at(0) : 1} />
      <Cap x={PD.x(72)} y={PD.box.y - 18} size={18} color={C.green}>informe: 72</Cap>
      {beat === 2 && (
        <>
          <line x1={PD.x(66)} x2={PD.x(66)} y1={PD.box.y + 60} y2={PD.y(0)} stroke={C.magenta} strokeWidth={4} />
          <Cap x={PD.x(66)} y={PD.box.y + 40} size={18} color={C.magenta}>muestra: 66</Cap>
        </>
      )}
      <Cap x={1370} y={230} size={22} color={C.text} tex="\mu=72,\ \sigma=8,\ n=64" />
      {se && <Cap x={1370} y={290} size={22} color={C.amber} tex="\text{EE}=\tfrac{8}{\sqrt{64}}=1" />}
      {beat === 2 && answer !== null && <Cap x={1370} y={350} size={22} color={C.magenta} tex="z=\tfrac{66-72}{1}=-6" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Samples({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 59 + round);
    const n = pick(r, [16, 25, 36, 49, 64, 100, 144]);
    const s = pick(r, [6, 8, 10, 12, 15, 20]);
    const f = pick(r, [2, 3]);
    const mu = pick(r, [40, 50, 72, 120]);
    const xb = mu + pick(r, [-1, 1]) * randInt(r, 2, 12) / 4 * (s / Math.sqrt(n));
    return { n, s, f, mu, xb: Math.round(xb * 100) / 100 };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { n, s, f, mu, xb } = data;

  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt(`Una auditoría revisa $n=${n}$ fichas de una población con $\\sigma=${s}$. ¿Cuál es el error estándar de la media? (Dos decimales.)`, '\\text{EE}=\\frac{\\sigma}{\\sqrt n}');
      api.hints([`$\\sqrt{${n}}=${Math.sqrt(n)}$.`, 'Divide $\\sigma$ por esa raíz.']);
    } else if (round === 1) {
      api.prompt(`Con $n=${n}$ el error estándar es demasiado grande. ¿Cuántas fichas hay que revisar para que sea ${f === 2 ? 'la mitad' : 'un tercio'}?`, '\\text{EE}=\\frac{\\sigma}{\\sqrt n}');
      api.hints(['El error estándar depende de $\\sqrt n$, no de $n$.', `Para dividirlo por ${f}, $\\sqrt n$ debe multiplicarse por ${f}.`]);
    } else {
      api.prompt(`El informe dice $\\mu=${mu}$ con $\\sigma=${s}$. Una muestra de $n=${n}$ da $\\bar x=${num(xb)}$. ¿Cuál es su puntaje z? (Dos decimales.)`, 'z=\\frac{\\bar x-\\mu}{\\sigma/\\sqrt n}');
      api.hints([`$\\text{EE}=${s}/${Math.sqrt(n)}=${num(s / Math.sqrt(n))}$.`, 'Divide $\\bar x-\\mu$ por el error estándar, no por $\\sigma$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const se = s / Math.sqrt(n);
    if (round === 0) {
      if (Math.abs(v - se) < 0.006) return api.result(true, `$\\tfrac{${s}}{\\sqrt{${n}}}=\\tfrac{${s}}{${Math.sqrt(n)}}=${num(se)}$.`);
      if (Math.abs(v - s / n) < 0.006) return api.result(false, 'Dividiste por $n$. Es por $\\sqrt n$.');
      return api.result(false, `$\\sqrt{${n}}=${Math.sqrt(n)}$; divide ${s} por eso.`);
    }
    if (round === 1) {
      const t = n * f * f;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$\\sqrt{n}$ debe crecer ${f} veces, así que $n$ crece ${f * f} veces: ${t} fichas.`);
      if (Math.abs(v - n * f) < 0.5) return api.result(false, `Multiplicar $n$ por ${f} solo divide el error por $\\sqrt{${f}}$. Hace falta $${f}^2=${f * f}$ veces más.`);
      return api.result(false, `El error es $\\sigma/\\sqrt n$: para dividirlo por ${f}, $n$ se multiplica por ${f * f}.`);
    }
    const t = (xb - mu) / se;
    if (Math.abs(v - t) < 0.011) return api.result(true, `$z=\\tfrac{${num(xb)}-${mu}}{${num(se)}}=${num(t)}$.`);
    if (Math.abs(v - (xb - mu) / s) < 0.011) return api.result(false, 'Dividiste por $\\sigma$. Para una media se divide por el error estándar $\\sigma/\\sqrt n$.');
    return api.result(false, `$\\bar x-\\mu=${num(xb - mu)}$ y $\\text{EE}=${num(se)}$.`);
  };

  const se = s / Math.sqrt(n);
  const P = plane([mu - 4 * se, mu + 4 * se], [0, 0.45 / se], { x: 300, y: 220, w: 760, h: 340 });
  return (
    <Stage>
      <Axes P={P} xTicks={[-3, -2, -1, 0, 1, 2, 3].map((k) => Math.round((mu + k * se) * 100) / 100)} xLabel="\bar x" tickLabels={round !== 0} />
      <Curve P={P} f={(x) => pdf(x, mu, se)} a={mu - 4 * se} b={mu + 4 * se} color={C.amber} width={4} />
      {round === 2 && <line x1={P.x(xb)} x2={P.x(xb)} y1={P.box.y + 40} y2={P.y(0)} stroke={C.magenta} strokeWidth={4} />}
      <NumberField x={1150} y={360} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'EE =' : round === 1 ? 'n =' : 'z ='} width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c5',
  world: 'statistics',
  code: '6.5',
  title: 'La muestra',
  subtitle: 'Distribución muestral de la media',
  glyph: '\\frac{\\sigma}{\\sqrt n}',
  kind: 'level',
  guide: 'teo',
  teaser: 'El registro tiene 48 000 fichas y no hay tiempo de revisarlas todas. Una muestra al azar basta, si se sabe cuánto puede variar.',
  learn: 'Población y muestra, parámetros y estadísticos, distribución de la media muestral, teorema central del límite y error estándar.',
  glyphs: ['st-se', 'st-tcl'],
  pitfalls: ['El error estándar es $\\sigma/\\sqrt n$, no $\\sigma/n$.', 'Para reducir el error a la mitad hay que cuadruplicar la muestra.', 'El teorema central del límite habla de la media, no de los datos individuales.'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'nar', text: 'Archivo Regional, 14:00. El generador parpadea junto al listado de fichas.' },
        { who: 'ana', text: 'El informe da una edad promedio de 72 años; revisar las 48 000 fichas tomaría semanas. No voy a escogerles solo las que nos convienen.' },
        { who: 'teo', text: 'Que el generador elija 64 al azar y guarde cuáles tomó. Así podemos volver a cada ficha.' },
        { who: 'iris', text: 'Bien. Si el informe aguanta, también tiene que aguantar esa selección.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La edad de la muestra',
      Scene: AgesDemo,
      beats: [
        {
          say: 'Según el informe, las edades de los vacunados tienen $\\mu=72$ y $\\sigma=8$. Teo revisa una muestra de 64 fichas.',
          dur: 1.8,
          note: { label: 'Lo que dice el informe', tex: '\\mu=72,\\ \\sigma=8' },
        },
        {
          say: 'Si el informe fuera cierto, ¿cuánto variaría la media de 64 fichas?',
          ask: { prompt: '¿Cuál es el error estándar?', options: ['1 año', '8 años', '0,125 años'], answer: 0, explain: '$8/\\sqrt{64}=8/8=1$. La media de la muestra debería caer casi siempre entre 69 y 75.' },
          note: { label: 'Error estándar', tex: '\\tfrac{8}{\\sqrt{64}}=1' },
        },
        {
          say: 'La muestra da $\\bar x=66$ años.',
          ask: { prompt: '¿Qué tan lejos está de 72?', options: ['A 6 errores estándar: casi imposible si el informe fuera cierto', 'A 6 años: es normal', 'A menos de una desviación: nada raro'], answer: 0, explain: '$z=(66-72)/1=-6$. Con una muestra de 64 fichas, una diferencia así no se explica por azar.' },
          note: { label: 'Una muestra imposible', tex: 'z=\\tfrac{66-72}{1}=-6' },
        },
      ],
    },
    { kind: 'challenge', title: 'Muestras', Comp: Samples, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'teo', text: 'Las 64 fichas dan 66 años, seis por debajo de 72; con el informe, el margen típico entre muestras sería de un año. Quedamos a seis de esos márgenes.' },
        { who: 'ana', text: 'Guardé la selección; pueden repetir la revisión sin confiar en mi palabra.' },
        { who: 'tu', text: 'Conservemos también las edades individuales; un promedio solo no cuenta todo.' },
        { who: 'iris', text: 'Ahora falta ponerle un rango defendible a esos 66. No quiero que la discusión termine en un redondeo.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'st-se', world: 'statistics', tex: '\\frac{\\sigma}{\\sqrt n}', name: 'Error estándar', read: 'sigma sobre raíz de ene', meaning: 'Desviación estándar de la media muestral: cuánto varía $\\bar x$ de una muestra a otra.' },
  { id: 'st-tcl', world: 'statistics', tex: '\\bar X\\approx N(\\mu,\\sigma^2/n)', name: 'Teorema central del límite', read: 'teorema central del límite', meaning: 'Para $n$ grande, la media muestral se distribuye aproximadamente normal, aunque la población no lo sea.' },
];
