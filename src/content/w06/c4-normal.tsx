import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap, NumberLine, lineMap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Phi, Shade, num, pdf } from './kit';

// ============================================================================
// CASO 6.4 · «Fuera de lo normal» — puntaje z y distribución normal
// z = (x − μ)/σ; la campana N(μ, σ²) y sus parámetros; regla 68–95–99,7;
// normal estándar y Φ(z).
// ============================================================================

const PN = plane([-4, 4], [0, 0.46], { x: 300, y: 160, w: 840, h: 420 });

// ---------------------------------------------------------------- lesson
function NormalLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [mu, setMu] = useState(0);
  const [s, setS] = useState(1);
  const moved = useRef({ m: false, s: false });
  const onMu = useSvgDrag(svg, (x) => {
    setMu(Math.round(clamp(-3 + ((x - 1230) / 260) * 6, -3, 3) * 2) / 2);
    moved.current.m = true;
    if (moved.current.m && moved.current.s) unlock();
  });
  const onS = useSvgDrag(svg, (x) => {
    setS(Math.round(clamp(0.5 + ((x - 1230) / 260) * 1.5, 0.5, 2) * 10) / 10);
    moved.current.s = true;
    if (moved.current.m && moved.current.s) unlock();
  });
  if (beat <= 1) {
    const X = lineMap(20, 100, 300, 1140);
    const mu0 = 60;
    const sg = 10;
    const x = 85;
    return (
      <Stage>
        <NumberLine X={X} y={420} lo={20} hi={100} step={10} />
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
          <g key={k}>
            <line x1={X(mu0 + k * sg)} x2={X(mu0 + k * sg)} y1={330} y2={410} stroke={k === 0 ? C.green : C.violet} strokeWidth={k === 0 ? 3 : 1.5} strokeDasharray={k === 0 ? undefined : '6 6'} />
            <Cap x={X(mu0 + k * sg)} y={310} size={16} color={k === 0 ? C.green : C.violet} tex={k === 0 ? '\\mu' : `${k > 0 ? '+' : ''}${k}\\sigma`} />
          </g>
        ))}
        <circle cx={X(x)} cy={400} r={12} fill={C.amber} />
        <Cap x={X(x)} y={460 + 20} size={18} color={C.amber} tex="x=85" />
        <Arrow from={[X(mu0), 370]} to={[X(mu0 + (x - mu0) * at(0)), 370]} color={C.amber} width={4} />
        {at(0) > 0.95 && <Cap x={X((mu0 + x) / 2)} y={345} size={20} color={C.amber} tex="2{,}5\,\sigma" />}
        <Cap x={1370} y={250} size={22} color={C.text} tex="\mu=60,\ \sigma=10" />
        <Cap x={1370} y={310} size={22} color={C.amber} tex="z=\tfrac{85-60}{10}=2{,}5" opacity={at(0)} />
        {beat === 1 && answer !== null && <Cap x={1370} y={380} size={22} color={C.green} tex="z=\tfrac{6{,}2-5{,}0}{0{,}6}=2" />}
      </Stage>
    );
  }
  const m = beat === 2 ? mu : 0;
  const sg = beat === 2 ? s : 1;
  const f = (x: number) => pdf(x, m, sg);
  const k = beat === 3 ? Math.min(3, 1 + Math.floor(at(3) * 3)) : 0;
  return (
    <Stage ref={svg}>
      <Axes P={PN} xTicks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]} xLabel={beat === 2 ? 'x' : 'z'} />
      {beat === 3 && [3, 2, 1].filter((j) => j <= k).map((j) => <Shade key={j} P={PN} f={f} a={-j} b={j} color={[C.green, C.cyan, C.violet][j - 1]} opacity={0.28} />)}
      {beat === 4 && <Shade P={PN} f={f} a={-4} b={1} color={C.cyan} opacity={0.35} />}
      {beat === 4 && answer !== null && <Shade P={PN} f={f} a={1} b={4} color={C.magenta} opacity={0.5} />}
      <Curve P={PN} f={f} a={-4} b={4} color={C.amber} width={4} />
      {beat === 2 && (
        <>
          <line x1={PN.x(m)} x2={PN.x(m)} y1={PN.y(0)} y2={PN.y(f(m))} stroke={C.green} strokeWidth={2} strokeDasharray="6 6" />
          {[0, 1].map((i) => (
            <g key={i}>
              <line x1={1230} x2={1490} y1={300 + i * 110} y2={300 + i * 110} stroke={C.line} strokeWidth={3} />
              <Cap x={1360} y={265 + i * 110} size={18} color={C.muted} tex={i ? `\\sigma=${num(sg, 1)}` : `\\mu=${num(m, 1)}`} />
            </g>
          ))}
          <Knob x={1230 + ((mu + 3) / 6) * 260} y={300} color={C.green} onPointerDown={onMu} cursor="ew-resize" />
          <Knob x={1230 + ((s - 0.5) / 1.5) * 260} y={410} color={C.violet} onPointerDown={onS} cursor="ew-resize" />
        </>
      )}
      {beat === 3 &&
        [1, 2, 3].map((j) => (
          <Cap key={j} x={1370} y={220 + j * 60} size={22} color={[C.green, C.cyan, C.violet][j - 1]} tex={`\\pm${j}\\sigma:\\ ${['68', '95', '99{,}7'][j - 1]}\\,\\%`} opacity={j <= k ? 1 : 0.2} />
        ))}
      {beat === 4 && <Cap x={1370} y={260} size={22} color={C.cyan} tex="\Phi(1)\approx0{,}84" />}
      {beat === 4 && answer !== null && <Cap x={1370} y={320} size={22} color={C.magenta} tex="1-\Phi(1)\approx0{,}16" />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Puntaje z y distribución normal',
  Scene: NormalLesson,
  beats: [
    {
      say: 'Para decir si un dato es raro hay que medir su distancia a la media **en desviaciones estándar**. Ese número es el **puntaje z**: positivo sobre la media, negativo bajo ella.',
      dur: 3,
      board: { label: 'Puntaje z', tex: 'z=\\frac{\\p{1}{x-\\mu}}{\\p{2}{\\sigma}}', body: 'Un 85 en una prueba con media 60 y $\\sigma=10$ está 2,5 desviaciones sobre la media.', parts: ['distancia a la media', 'unidad de comparación'] },
    },
    {
      say: 'El puntaje z permite comparar datos medidos en escalas distintas.',
      ask: { prompt: 'Una nota 6,2 en un curso con media 5,0 y $\\sigma=0{,}6$. ¿Cuál es su z?', options: ['2', '1,2', '0,6'], answer: 0, explain: '$\\tfrac{6{,}2-5{,}0}{0{,}6}=\\tfrac{1{,}2}{0{,}6}=2$: dos desviaciones sobre la media.' },
    },
    {
      say: 'Muchas mediciones repetidas (estaturas, errores de medición, sumas de muchos efectos pequeños) forman una campana: la **distribución normal**. Su media $\\mu$ la desplaza y su desviación $\\sigma$ la ensancha. El área total bajo la curva es 1.',
      gate: 'Mueve $\\mu$ y $\\sigma$ y mira cómo cambia la campana.',
      board: { label: 'Distribución normal', tex: 'X\\sim N(\\p{1}{\\mu},\\,\\p{2}{\\sigma^2})', body: 'Simétrica alrededor de $\\mu$. El área bajo la curva entre $a$ y $b$ es la probabilidad de caer ahí.', parts: ['centro de la campana', 'dispersión de la campana'] },
    },
    {
      say: 'En cualquier normal, cerca del 68 % de los datos queda a menos de una desviación de la media, el 95 % a menos de dos y el 99,7 % a menos de tres.',
      dur: 3.6,
      board: { label: 'Regla 68–95–99,7', tex: '\\begin{aligned}P(|z|<1)&\\approx\\p{1}{0{,}68}\\\\P(|z|<2)&\\approx\\p{2}{0{,}95}\\\\P(|z|<3)&\\approx\\p{3}{0{,}997}\\end{aligned}', parts: ['proporción dentro de una', 'proporción dentro de dos', 'proporción dentro de tres'] },
    },
    {
      say: 'Estandarizar convierte cualquier normal en la **normal estándar** $Z\\sim N(0,1)$. Sus áreas acumuladas están en tablas: $\\Phi(z)=P(Z\\le z)$.',
      ask: { prompt: 'Si $\\Phi(1)\\approx0{,}84$, ¿qué fracción de los datos supera $z=1$?', options: ['0,16', '0,84', '0,34'], answer: 0, explain: 'El área total es 1: $1-0{,}84=0{,}16$. Coincide con la regla: fuera de $\\pm1\\sigma$ queda el 32 %, la mitad a cada lado.' },
      board: { label: 'Normal estándar', tex: '\\begin{gathered}\\p{1}{Z=\\frac{X-\\mu}{\\sigma}\\sim N(0,1)}\\\\\\p{2}{\\Phi(z)=P(Z\\le z)}\\end{gathered}', parts: ['dato en escala estándar', 'área acumulada a izquierda'] },
    },
  ],
};

// ---------------------------------------------------------------- demo
const PW = plane([60, 180], [0, 0.03], { x: 300, y: 160, w: 840, h: 420 });

function WeekDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const f = (x: number) => pdf(x, 120, 15);
  const shown = beat >= 1 && (beat > 1 || answer !== null);
  return (
    <Stage>
      <Axes P={PW} xTicks={[75, 90, 105, 120, 135, 150, 165, 180]} xLabel="\text{dosis}" />
      <Shade P={PW} f={f} a={75} b={165} color={C.violet} opacity={0.18 * (beat === 0 ? at(0) : 1)} />
      <Curve P={PW} f={f} a={60} b={180} color={C.amber} width={4} progress={beat === 0 ? at(0) : 1} />
      <line x1={PW.x(171)} x2={PW.x(171)} y1={PW.box.y + 40} y2={PW.y(0)} stroke={C.magenta} strokeWidth={4} />
      <Cap x={PW.x(171)} y={PW.box.y + 20} size={18} color={C.magenta}>Cerro: 171</Cap>
      <Cap x={1370} y={230} size={22} color={C.text} tex="\mu=120,\ \sigma=15" />
      <Cap x={1370} y={280} size={18} color={C.violet} tex="\mu\pm3\sigma=[75,\,165]" />
      {shown && <Cap x={1370} y={340} size={24} color={C.magenta} tex="z=\tfrac{171-120}{15}=3{,}4" />}
      {beat === 2 && answer !== null && <Cap x={1370} y={400} size={22} color={C.green} tex={`P(Z>3{,}4)\\approx${num(1 - Phi(3.4), 4)}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Q = { text: string; ans: number; a: number; b: number };

function Scores({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 53 + round);
    const mu = pick(r, [50, 60, 100, 120, 170]);
    const s = pick(r, [4, 5, 8, 10, 12, 15]);
    const x = mu + randInt(r, -30, 30) / 10 * s;
    const k = pick(r, [0, 1, 2, 3, 4, 5]);
    const qs: Q[] = [
      { text: `entre ${mu - s} y ${mu + s}`, ans: 68, a: -1, b: 1 },
      { text: `entre ${mu - 2 * s} y ${mu + 2 * s}`, ans: 95, a: -2, b: 2 },
      { text: `sobre ${mu + s}`, ans: 16, a: 1, b: 4 },
      { text: `sobre ${mu + 2 * s}`, ans: 2.5, a: 2, b: 4 },
      { text: `bajo ${mu - s}`, ans: 16, a: -4, b: -1 },
      { text: `entre ${mu} y ${mu + s}`, ans: 34, a: 0, b: 1 },
    ];
    const z = pick(r, [-2, -1.5, -1, 1.5, 2, 2.5]);
    return { mu, s, x: Math.round(x), q: qs[k], z };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { mu, s, x, q, z } = data;

  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt(`Una clínica aplicó ${num(x, 1).replace('{,}', ',')} dosis en una semana; la región tiene $\\mu=${mu}$ y $\\sigma=${s}$. ¿Cuál es su puntaje z? (Dos decimales.)`, 'z=\\frac{x-\\mu}{\\sigma}');
      api.hints(['Resta la media.', 'Divide por la desviación estándar.']);
    } else if (round === 1) {
      api.prompt(`Las dosis semanales siguen una normal con $\\mu=${mu}$ y $\\sigma=${s}$. ¿Qué porcentaje de las semanas queda ${q.text}?`, '68\\text{–}95\\text{–}99{,}7');
      api.hints(['Escribe los extremos como $\\mu\\pm k\\sigma$.', 'Usa la regla y la simetría de la campana: cada mitad tiene el 50 %.']);
    } else {
      api.prompt(`Con $\\mu=${mu}$ y $\\sigma=${s}$, ¿qué valor tiene un puntaje $z=${num(z, 1)}$?`, 'x=\\mu+z\\,\\sigma');
      api.hints(['Despeja $x$ de $z=(x-\\mu)/\\sigma$.', `$x=${mu}+(${num(z, 1)})\\cdot${s}$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = (x - mu) / s;
      if (Math.abs(v - t) < 0.011) return api.result(true, `$z=\\tfrac{${num(x, 1)}-${mu}}{${s}}=${num(t)}$.`);
      if (Math.abs(v - (x - mu)) < 0.01) return api.result(false, 'Esa es la diferencia con la media. Divídela por $\\sigma$.');
      if (Math.abs(v + t) < 0.011) return api.result(false, 'El signo está al revés: es $x-\\mu$, no $\\mu-x$.');
      return api.result(false, `$x-\\mu=${num(x - mu, 1)}$; divide por ${s}.`);
    }
    if (round === 1) {
      if (Math.abs(v - q.ans) < 0.6) return api.result(true, `${num(q.ans, 1).replace('{,}', ',')} % de las semanas.`);
      if (q.ans === 16 && Math.abs(v - 32) < 0.6) return api.result(false, 'Fuera de $\\pm1\\sigma$ queda el 32 %, pero repartido en dos colas: aquí se pide una sola.');
      if (q.ans === 2.5 && Math.abs(v - 5) < 0.6) return api.result(false, 'Fuera de $\\pm2\\sigma$ queda el 5 % en dos colas; una sola tiene la mitad.');
      if (q.ans === 34 && Math.abs(v - 68) < 0.6) return api.result(false, 'Eso es entre $-1\\sigma$ y $+1\\sigma$. Aquí es solo la mitad derecha.');
      return api.result(false, 'Escribe los extremos como $\\mu\\pm k\\sigma$ y usa la regla 68–95–99,7.');
    }
    const t = mu + z * s;
    if (Math.abs(v - t) < 0.01) return api.result(true, `$x=${mu}+(${num(z, 1)})\\cdot${s}=${num(t, 1)}$.`);
    return api.result(false, `Despeja: $x=\\mu+z\\sigma=${mu}+(${num(z, 1)})\\cdot${s}$.`);
  };

  const P = plane([mu - 4 * s, mu + 4 * s], [0, 0.42 / s], { x: 300, y: 200, w: 760, h: 360 });
  const f = (t: number) => pdf(t, mu, s);
  return (
    <Stage>
      <Axes P={P} xTicks={[-3, -2, -1, 0, 1, 2, 3].map((k) => mu + k * s)} />
      {round === 1 && <Shade P={P} f={f} a={mu + q.a * s} b={mu + q.b * s} color={C.violet} opacity={0.35} />}
      <Curve P={P} f={f} a={mu - 4 * s} b={mu + 4 * s} color={C.amber} width={4} />
      {round === 0 && <line x1={P.x(x)} x2={P.x(x)} y1={P.box.y + 30} y2={P.y(0)} stroke={C.magenta} strokeWidth={4} />}
      <NumberField x={1150} y={360} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'z =' : round === 1 ? '% =' : 'x ='} width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c4',
  world: 'statistics',
  code: '6.4',
  title: 'Fuera de lo normal',
  subtitle: 'Puntaje z y distribución normal',
  glyph: 'z',
  kind: 'level',
  guide: 'ana',
  teaser: 'Las treinta clínicas de la región aplican, semana a semana, cantidades parecidas de dosis. La del Cerro reporta una semana que se sale de la campana.',
  learn: 'Puntaje z, distribución normal y sus parámetros, regla 68–95–99,7, normal estándar y la función $\\Phi$.',
  glyphs: ['st-z', 'st-normal'],
  pitfalls: ['$z$ se mide en desviaciones estándar, no en las unidades de los datos.', 'La regla 68–95–99,7 habla de intervalos centrados; para una cola se usa la mitad de lo que queda fuera.', 'Solo vale para distribuciones aproximadamente normales.'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'nar', text: 'Archivo Regional, 12:00. Una hoja sale tibia de la impresora.' },
        { who: 'ana', text: 'Treinta clínicas: en promedio, 120 dosis por semana, con una variación típica de 15. En la semana 31, el Cerro reportó 171.' },
        { who: 'iris', text: '¿Cuánto se sale de lo habitual?' },
        { who: 'ana', text: 'Eso necesito establecer; con «parece mucho» van a devolvernos la carpeta.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La semana 31',
      Scene: WeekDemo,
      beats: [
        {
          say: 'Las dosis semanales de las clínicas de la región forman una campana con $\\mu=120$ y $\\sigma=15$.',
          dur: 2,
          note: { label: 'Dosis semanales', tex: '\\mu=120,\\ \\sigma=15' },
        },
        {
          say: 'La clínica del Cerro reporta 171 dosis en la semana 31.',
          ask: { prompt: '¿Cuál es su puntaje z?', options: ['3,4', '51', '0,34'], answer: 0, explain: '$\\tfrac{171-120}{15}=\\tfrac{51}{15}=3{,}4$: más de tres desviaciones sobre la media.' },
          note: { label: 'Semana 31 del Cerro', tex: 'z=\\tfrac{171-120}{15}=3{,}4' },
        },
        {
          say: 'Fuera de $\\pm3\\sigma$ queda solo el 0,3 % de las semanas, repartido en las dos colas.',
          ask: { prompt: '¿Qué tan raro es $z=3{,}4$?', options: ['Menos de 1 en 1 000 semanas', 'Le pasa a cualquier clínica', 'La mitad de las semanas'], answer: 0, explain: 'La cola sobre $z=3{,}4$ tiene un área de aproximadamente $0{,}0003$: unas 3 semanas en 10 000.' },
          note: { label: 'Muy improbable', tex: 'P(Z>3{,}4)\\approx0{,}0003' },
        },
      ],
    },
    { kind: 'challenge', title: 'Puntajes z', Comp: Scores, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'teo', text: 'Las 171 dosis quedan a 3,4 desviaciones sobre 120. Superar esa distancia ocurre unas tres veces en 10 000 semanas con este modelo.' },
        { who: 'iris', text: 'La semana 31 merece una explicación propia. Las 400 del 12 de agosto tampoco desaparecen por eso.' },
        { who: 'ana', text: 'Tampoco prueban quién recibió cada dosis; para eso hay 48 000 fichas.' },
        { who: 'iris', text: 'Y alguien cuenta con que nos aburramos antes de llegar a la última.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'st-z', world: 'statistics', tex: 'z=\\tfrac{x-\\mu}{\\sigma}', name: 'Puntaje z', read: 'zeta', meaning: 'Cuántas desviaciones estándar está un dato sobre (o bajo) la media.' },
  { id: 'st-normal', world: 'statistics', tex: 'N(\\mu,\\sigma^2)', name: 'Distribución normal', read: 'normal de mu y sigma cuadrado', meaning: 'Campana simétrica de media $\\mu$ y desviación $\\sigma$; el área bajo ella es probabilidad.' },
];
