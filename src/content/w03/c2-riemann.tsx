import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder, RiemannBars, type Rule, integrate, riemann } from './kit';

// ============================================================================
// CASO 3.2 · «Rectángulos» — sumas de Riemann y la integral definida
// Partir [a,b] en n franjas; rectángulos con el extremo izquierdo o derecho; al aumentar n
// las sumas se juntan; ese límite es la integral ∫_a^b f(x) dx. Trapecios como promedio.
// ============================================================================

const f = (x: number) => 1 + 0.25 * x * x;
const EXACT = integrate(f, 0, 4);
const PL = plane([0, 4.4], [0, 6], { x: 300, y: 120, w: 820, h: 520 });

// ---------------------------------------------------------------- lesson
function RiemannLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const NS = [1, 2, 4, 8, 16, 32, 64];
  const [ni, setNi] = useState(2);
  const [rule, setRule] = useState<Rule>('left');
  const n = NS[ni];
  const onN = useSvgDrag(svg, (x) => {
    const i = Math.round(clamp(((x - 1200) / 260) * (NS.length - 1), 0, NS.length - 1));
    setNi(i);
    if (NS[i] >= 32) unlock();
  });

  const showN = beat <= 2 ? 4 : beat === 3 ? n : 64;
  const showRule: Rule = beat === 1 ? 'left' : beat === 2 ? 'right' : beat === 3 ? rule : 'left';
  const sum = riemann(f, 0, 4, showN, showRule);
  return (
    <Stage ref={svg}>
      <Axes P={PL} xTicks={[0, 1, 2, 3, 4]} yTicks={[1, 2, 3, 4, 5]} xLabel="x" yLabel="y" grid />
      {beat === 0 && (
        <>
          <AreaUnder P={PL} f={f} a={0} b={4} pos={C.violet} opacity={0.35} />
          {[1, 2, 3].map((k) => (
            <Line key={k} a={PL.pt(k, 0)} b={PL.pt(k, f(k))} color={C.amber} dashed width={2} />
          ))}
          <Group opacity={at(0)}>
            {[0, 1, 2, 3].map((k) => (
              <Cap key={k} x={PL.x(k + 0.5)} y={PL.y(0) + 50} size={18} color={C.amber} tex="\Delta x=1" />
            ))}
          </Group>
        </>
      )}
      {beat >= 1 && beat <= 4 && <RiemannBars P={PL} f={f} a={0} b={4} n={showN} rule={showRule} color={showRule === 'right' ? C.magenta : C.amber} opacity={0.45} />}
      {beat >= 5 && <AreaUnder P={PL} f={f} a={0} b={4} pos={C.violet} opacity={0.45} />}
      <Curve P={PL} f={f} a={0} b={4.4} color={C.cyan} width={4} />
      {beat >= 1 && beat <= 4 && (
        <Cap x={1330} y={180} size={24} color={C.text} tex={`\\text{suma}=${dec(sum, 3).replace(',', '{,}')}`} />
      )}
      {beat >= 3 && <Cap x={1330} y={230} size={20} color={C.violet} tex={`\\text{área}=${dec(EXACT, 3).replace(',', '{,}')}`} />}
      {beat === 3 && (
        <>
          <line x1={1200} x2={1460} y1={360} y2={360} stroke={C.line} strokeWidth={3} />
          <Knob x={1200 + (ni / (NS.length - 1)) * 260} y={360} color={C.amber} onPointerDown={onN} cursor="ew-resize" label={`n=${n}`} />
          <Choices x={1330} y={450} options={['left', 'right'] as Rule[]} value={rule} onPick={setRule} render={(r) => (r === 'left' ? 'izquierda' : 'derecha')} />
        </>
      )}
      {beat === 4 && answer !== null && <Cap x={1330} y={330} size={20} color={C.green}>(L + R)/2 = trapecios</Cap>}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sumas de Riemann',
  Scene: RiemannLesson,
  beats: [
    {
      say: 'Para medir el área bajo una curva, se parte el intervalo $[a,b]$ en $n$ franjas del mismo ancho $\\Delta x$. Cada franja es casi un rectángulo.',
      dur: 2.6,
      board: { label: 'Partición', tex: '\\Delta x=\\frac{\\p{1}{b-a}}{\\p{2}{n}},\\qquad \\p{3}{x_i=a+i\\,\\Delta x}' },
    },
    {
      say: 'Se elige la altura de cada rectángulo con el valor de la función en el **extremo izquierdo** de su franja. Como esta curva sube, los rectángulos quedan un poco por debajo.',
      dur: 2.6,
      board: { label: 'Suma izquierda', tex: 'L_n=\\sum_{i=0}^{n-1}\\p{1}{\\cA{f(x_i)}}\\,\\p{2}{\\Delta x}', body: 'Altura por ancho, franja por franja. Aquí $L_4=7{,}5$: se queda corta.' },
    },
    {
      say: 'Con el **extremo derecho**, los rectángulos sobresalen. El área verdadera queda atrapada entre las dos sumas.',
      dur: 2.6,
      board: { label: 'Suma derecha', tex: 'R_n=\\sum_{i=1}^{n}\\p{1}{\\cM{f(x_i)}}\\,\\Delta x', body: '$R_4=11{,}5$. Para una función que sube: $L_n\\le\\text{área}\\le R_n$.' },
    },
    {
      say: 'Mientras más franjas, más finos los rectángulos y menor el error. Las dos sumas se acercan al mismo número.',
      gate: 'Sube n hasta 32 o más (prueba con izquierda y derecha).',
      board: { label: 'Más franjas', tex: 'L_n,\\ R_n\\ \\xrightarrow[n\\to\\infty]{}\\ \\p{1}{9{,}333\\ldots}' },
    },
    {
      say: 'Un atajo práctico: promediar la suma izquierda y la derecha equivale a usar **trapecios** en vez de rectángulos.',
      ask: {
        prompt: 'Con $L_4=7{,}5$ y $R_4=11{,}5$, ¿qué estima la regla del trapecio?',
        options: ['9,5', '7,5', '19'],
        answer: 0,
        explain: '$(7{,}5+11{,}5)/2=9{,}5$, muy cerca del área real $9{,}33$.',
      },
      board: { label: 'Trapecios', tex: 'T_n=\\frac{\\p{1}{L_n}+\\p{2}{R_n}}{2}' },
    },
    {
      say: 'Ese número al que se acercan las sumas es la **integral definida**. El símbolo $\\int$ es una S alargada: la suma se vuelve continua y $\\Delta x$ se vuelve $dx$.',
      dur: 3.4,
      board: [
        { label: 'Integral definida', tex: '\\int_{\\p{2}{\\cC{a}}}^{\\p{2}{\\cC{b}}}\\p{3}{\\cA{f(x)}}\\,\\p{4}{\\cG{dx}}=\\p{1}{\\lim_{n\\to\\infty}\\sum f(x_i)\\,\\Delta x}' },
        { tex: '\\int_0^4\\left(1+\\tfrac{x^2}{4}\\right)dx=\\p{1}{9{,}\\overline{3}}', body: '$\\cC{a,b}$: límites de integración. $\\cA{f(x)}$: el integrando (la altura). $\\cG{dx}$: el ancho infinitesimal de cada franja.' },
      ],
    },
  ],
};

// ---------------------------------------------------------------- demo
const Q = (t: number) => 1.5 + 4 * Math.exp(-((t - 2.3) ** 2) / 2.2) + 0.35 * t;
const PD = plane([0, 6.4], [0, 7.5], { x: 300, y: 120, w: 820, h: 520 });

function HourlyDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const n = beat === 2 ? 60 : 6;
  return (
    <Stage>
      <Axes P={PD} xTicks={[0, 1, 2, 3, 4, 5, 6]} yTicks={[2, 4, 6]} xLabel="\text{hora}" yLabel="Q" grid />
      {beat <= 1 && <RiemannBars P={PD} f={Q} a={0} b={6} n={6} rule={beat === 0 ? 'left' : 'right'} color={beat === 0 ? C.amber : C.magenta} />}
      {beat === 2 && <RiemannBars P={PD} f={Q} a={0} b={6} n={n} rule="left" color={C.green} marks={false} />}
      {Array.from({ length: 7 }, (_, k) => (
        <Dot key={k} x={PD.x(k)} y={PD.y(Q(k))} r={7} color={C.text} />
      ))}
      {(beat === 2 || answer !== null) && <Curve P={PD} f={Q} a={0} b={6} color={C.cyan} width={3} />}
      <Cap x={1330} y={200} size={22} color={beat === 0 ? C.amber : beat === 1 ? C.magenta : C.green} tex={`${beat === 0 ? 'L_6' : beat === 1 ? 'R_6' : 'L_{60}'}=${dec(riemann(Q, 0, 6, n, beat === 1 ? 'right' : 'left'), 2).replace(',', '{,}')}`} />
      {beat === 1 && answer !== null && <Cap x={1330} y={260} size={20} color={C.green} tex={`T_6=${dec((riemann(Q, 0, 6, 6, 'left') + riemann(Q, 0, 6, 6, 'right')) / 2, 2).replace(',', '{,}')}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Samples({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const vals = Array.from({ length: 5 }, () => randInt(r, 2, 9));
    const dx = round === 1 ? pick(r, [0.5, 2]) : 1;
    return { vals, dx };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { vals, dx } = data;
  const L = vals.slice(0, 4).reduce((a, b) => a + b, 0) * dx;
  const R = vals.slice(1).reduce((a, b) => a + b, 0) * dx;

  useEffect(() => {
    if (round === 0) {
      api.prompt('Lecturas del caudalímetro cada 1 hora. Estima el volumen con la **suma izquierda** $L_4$.', 'L_4=\\sum_{i=0}^{3}f(x_i)\\,\\Delta x');
      api.hints(['Usa las cuatro primeras lecturas: cada una vale para la hora que empieza.', 'Con $\\Delta x=1$, basta sumar esas cuatro alturas.']);
    } else if (round === 1) {
      api.prompt(`Ahora las lecturas son cada ${dec(dx)} h. Estima el volumen con la **suma derecha** $R_4$.`, 'R_4=\\sum_{i=1}^{4}f(x_i)\\,\\Delta x');
      api.hints(['Usa las cuatro últimas lecturas.', `Multiplica su suma por el ancho $\\Delta x=${dec(dx)}$.`]);
    } else {
      api.prompt('Mismas lecturas cada 1 hora. Estima el volumen con la **regla del trapecio**.', 'T_4=\\frac{L_4+R_4}{2}');
      api.hints(['Calcula $L_4$ y $R_4$.', 'Promédialos.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const t = round === 0 ? L : round === 1 ? R : (L + R) / 2;
    if (Math.abs(v - t) < 0.01) return api.result(true, round === 0 ? `$L_4=${vals.slice(0, 4).join('+')}=${dec(L)}$.` : round === 1 ? `$R_4=(${vals.slice(1).join('+')})\\cdot${dec(dx)}=${dec(R)}$.` : `$T_4=\\frac{${dec(L)}+${dec(R)}}{2}=${dec(t, 2)}$.`);
    if (round === 0 && Math.abs(v - R) < 0.01) return api.result(false, 'Esa es la suma derecha: usaste las cuatro últimas lecturas. La izquierda usa las cuatro primeras.');
    if (round === 1 && Math.abs(v - R / dx) < 0.01) return api.result(false, `Falta multiplicar por el ancho de cada franja, $\\Delta x=${dec(dx)}$.`);
    if (round === 1 && Math.abs(v - L) < 0.01) return api.result(false, 'Usaste el extremo izquierdo. La suma derecha empieza en la segunda lectura.');
    return api.result(false, round === 2 ? `$L_4=${dec(L)}$ y $R_4=${dec(R)}$: promédialos.` : 'Altura (lectura) por ancho, sumado sobre las cuatro franjas.');
  };

  const PR = plane([0, 4 * dx + 0.4 * dx], [0, 10], { x: 300, y: 120, w: 820, h: 480 });
  return (
    <Stage>
      <Axes P={PR} xTicks={[0, 1, 2, 3, 4].map((k) => k * dx)} yTicks={[2, 4, 6, 8, 10]} xLabel="\text{h}" yLabel="Q" grid />
      {vals.map((v, k) => (
        <g key={k}>
          <Dot x={PR.x(k * dx)} y={PR.y(v)} r={8} color={C.text} />
          <Html x={PR.x(k * dx)} y={PR.y(v) - 24} size={18} color={C.text}>
            <span className="prop-tag">{v}</span>
          </Html>
        </g>
      ))}
      <Html x={1250} y={200} size={20} color={C.muted} anchor="left">
        <span>
          {vals.length} lecturas · Δx = {dec(dx)} h
        </span>
      </Html>
      <NumberField x={1250} y={420} value={val} onChange={setVal} onEnter={submit} label="V ≈" width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c2',
  world: 'integral',
  code: '3.2',
  title: 'Rectángulos',
  subtitle: 'Sumas de Riemann',
  glyph: '\\int',
  kind: 'level',
  guide: 'teo',
  teaser: 'El caudalímetro guarda un dato por hora. Entre lecturas el caudal cambia: hay que estimar el área con rectángulos y saber qué tan buena es la estimación.',
  learn: 'Partición en franjas, sumas izquierda y derecha, convergencia al aumentar $n$, regla del trapecio y la definición de la integral definida $\\int_a^b f(x)\\,dx$.',
  glyphs: ['integral', 'riemann'],
  pitfalls: ['La suma izquierda usa $f(x_0),\\dots,f(x_{n-1})$; la derecha, $f(x_1),\\dots,f(x_n)$.', 'No olvidar multiplicar por $\\Delta x$ cuando no vale 1.', '$dx$ no es un número: indica la variable y el ancho infinitesimal de las franjas.'],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'teo', text: 'Seis lecturas en la noche, una por hora. El caudal real no se queda quieto entre lecturas.' },
        { who: 'marta', text: 'Si usamos esas seis, ¿cuánto nos podemos equivocar?' },
      ],
    },
    {
      kind: 'demo',
      title: 'Lecturas por hora',
      Scene: HourlyDemo,
      beats: [
        {
          say: 'Con las lecturas de cada hora como alturas de rectángulos (extremo izquierdo) se obtiene una primera estimación.',
          dur: 1.8,
          note: { label: 'Estimación izquierda', tex: 'L_6=\\sum_{i=0}^{5}Q(i)\\cdot1' },
        },
        {
          say: 'Con el extremo derecho sale otra estimación.',
          ask: {
            prompt: '¿Qué conviene usar si las dos estimaciones difieren?',
            options: ['Su promedio: la regla del trapecio', 'Siempre la izquierda', 'Siempre la mayor'],
            answer: 0,
            explain: 'Los errores de la izquierda y la derecha tienden a compensarse: el promedio suele estar mucho más cerca.',
          },
          note: { label: 'Trapecio', tex: 'T_6=\\tfrac{L_6+R_6}{2}' },
        },
        {
          say: 'Teo recupera el registro minuto a minuto: 60 franjas por noche… o más. La suma ya casi no cambia: es la integral.',
          dur: 1.8,
          note: { label: 'La integral de la noche', tex: '\\int_0^6 Q(t)\\,dt\\approx25{,}7', body: 'Mil m³. Con franjas cada vez más finas, la suma se acerca a este valor.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Las lecturas', Comp: Samples, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'marta', text: 'Casi veintiséis mil metros cúbicos con el registro fino. El informe sigue diciendo ocho.' },
        { who: 'iris', text: 'Pero al lago también le entra agua. Quiero el balance completo: lo que entra menos lo que sale.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'integral', world: 'integral', tex: '\\int_a^b f(x)\\,dx', name: 'Integral definida', read: 'integral de a a be de efe de equis de equis', meaning: 'Límite de las sumas $\\sum f(x_i)\\Delta x$ cuando las franjas se hacen infinitamente finas: el área (con signo) bajo $f$ entre $a$ y $b$.' },
  { id: 'riemann', world: 'integral', tex: '\\sum f(x_i)\\,\\Delta x', name: 'Suma de Riemann', read: 'suma de riemann', meaning: 'Suma de rectángulos de ancho $\\Delta x$ y alto $f(x_i)$ que aproxima el área.' },
];
