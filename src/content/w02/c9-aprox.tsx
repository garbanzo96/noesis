import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { SlopeLine, nt } from './kit';

// ============================================================================
// CASO 2.9 · «La estimación» — aproximación lineal, diferenciales y método de Newton
// f(a+h) ≈ f(a)+f'(a)h (el error crece como h²), propagación de errores dA = A'·dx, y Newton:
// seguir la tangente hasta el eje para encontrar cuándo el transformador llega a 110 °C.
// ============================================================================

const PS = plane([80, 130], [8.8, 11.6], { x: 300, y: 120, w: 960, h: 540 });

const g = (t: number) => 40 + 2 * t + 0.05 * t * t - 110;
const dg = (t: number) => 2 + 0.1 * t;
const PN = plane([0, 45], [-80, 110], { x: 300, y: 120, w: 960, h: 540 });

// ---------------------------------------------------------------- lesson
const PL = plane([2, 6], [1.3, 2.7], { x: 300, y: 140, w: 860, h: 500 });
const linear = (x: number) => 2 + 0.25 * (x - 4);
const newtonF = (x: number) => x * x - 2;
const PNL = plane([0.8, 1.8], [-1.2, 1.3], { x: 300, y: 140, w: 860, h: 500 });

function EstimateLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(5.5);
  const [steps, setSteps] = useState<number[]>([1]);
  const onX = useSvgDrag(svg, (px) => {
    if (beat !== 0) return;
    const next = Math.round(clamp(PL.inv(px, 0)[0], 2, 6) * 1000) / 1000;
    setX(next);
    if (Math.abs(next - 4) < 0.2) unlock();
  });
  if (beat <= 2) {
    const at = beat === 0 ? x : 4.4;
    const reveal = beat !== 1 || answer !== null;
    return <Stage ref={svg}>
      <Axes P={PL} xTicks={[2, 3, 4, 5, 6]} yTicks={[1.5, 2, 2.5]} grid />
      <Curve P={PL} f={Math.sqrt} a={2} b={6} color={C.cyan} width={4} />
      <SlopeLine P={PL} a={4} ya={2} m={0.25} x0={2} x1={6} />
      <Dot x={PL.x(4)} y={PL.y(2)} r={8} color={C.amber} />
      <Line a={PL.pt(at, Math.sqrt(at))} b={PL.pt(at, linear(at))} color={C.red} width={4} />
      <Dot x={PL.x(at)} y={PL.y(Math.sqrt(at))} r={8} color={C.cyan} onPointerDown={beat === 0 ? onX : undefined} />
      {reveal && <>
        <Dot x={PL.x(at)} y={PL.y(linear(at))} r={6} color={C.amber} />
        <Cap x={1370} y={210} tex={`\\sqrt{${nt(at, 3)}}\\approx${nt(Math.sqrt(at), 5)}`} size={22} color={C.cyan} />
        <Cap x={1370} y={290} tex={`L(${nt(at, 3)})=${nt(linear(at), 5)}`} size={22} color={C.amber} />
        <Cap x={1370} y={370} tex={`\\text{distancia}\\approx${nt(Math.abs(linear(at) - Math.sqrt(at)), 5)}`} size={20} color={C.red} />
      </>}
      <Cap x={1370} y={490} tex="L(x)=2+0{,}25(x-4)" size={22} />
      {beat === 0 && <>
        <rect x={PL.x(2)} y={690} width={PL.box.w} height={60} fill="transparent" onPointerDown={onX} />
        <Knob x={PL.x(x)} y={720} onPointerDown={onX} cursor="ew-resize" label={`x=${dec(x, 3)}`} />
      </>}
      {beat === 2 && <>
        <Line a={PL.pt(4, 2)} b={PL.pt(at, 2)} color={C.green} dashed />
        <Line a={PL.pt(at, 2)} b={PL.pt(at, linear(at))} color={C.amber} width={3} />
        <Cap x={800} y={730} tex="dx=0{,}4,\quad dy=0{,}25\cdot0{,}4=0{,}1" color={C.amber} />
      </>}
    </Stage>;
  }
  if (beat === 3) {
    const last = steps[steps.length - 1];
    const step = () => setSteps((prev) => {
      if (prev.length >= 4) return prev;
      const at = prev[prev.length - 1];
      return [...prev, at - newtonF(at) / (2 * at)];
    });
    return <Stage>
      <Axes P={PNL} xTicks={[1, 1.2, 1.4, 1.6, 1.8]} yTicks={[-1, 0, 1]} grid />
      <Curve P={PNL} f={newtonF} a={0.8} b={1.8} color={C.cyan} width={4} />
      {steps.slice(0, -1).map((at, i) => <g key={i} opacity={i === steps.length - 2 ? 1 : 0.4}>
        <Line a={PNL.pt(at, 0)} b={PNL.pt(at, newtonF(at))} color={C.dim} dashed />
        <SlopeLine P={PNL} a={at} ya={newtonF(at)} m={2 * at} x0={Math.min(at, steps[i + 1]) - 0.03} x1={Math.max(at, steps[i + 1]) + 0.03} />
        <Dot x={PNL.x(at)} y={PNL.y(newtonF(at))} r={7} color={C.amber} />
        <Dot x={PNL.x(steps[i + 1])} y={PNL.y(0)} r={7} color={C.green} />
      </g>)}
      <Dot x={PNL.x(last)} y={PNL.y(newtonF(last))} r={8} color={C.cyan} />
      <Cap x={1370} y={170} tex="f(x)=x^2-2" />
      {steps.map((at, i) => <Cap key={i} x={1370} y={260 + i * 65} tex={`x_${i}${i < 2 ? '=' : '\\approx'}${nt(at, i === 2 ? 5 : 6)}`} color={i === steps.length - 1 ? C.green : C.muted} />)}
      <Cap x={1370} y={570} tex={`\\sqrt2\\approx${nt(Math.sqrt(2), 6)}`} size={22} />
      <Html x={800} y={750} size={24} interactive>
        <button className="stage-btn on" onClick={step} disabled={steps.length >= 4}>Paso de Newton</button>
      </Html>
    </Stage>;
  }
  return <Stage>
    <Cap x={800} y={270} tex="L(x)=f(a)+f'(a)(x-a)" size={32} color={C.cyan} />
    <Cap x={800} y={460} tex="x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}" size={32} color={C.amber} />
  </Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Aproximación lineal y Newton',
  Scene: EstimateLesson,
  beats: [
    {
      say: 'Cerca de $a$, la tangente aproxima la curva. Para $\\sqrt x$ en $a=4$, la altura es 2 y la pendiente es $0{,}25$.',
      gate: 'Mueve x cerca de 4, hasta que |x − 4| sea menor que 0,2.',
      board: [
        { label: 'Aproximación lineal', tex: "L(x)=\\p{1}{f(a)}+\\p{2}{f'(a)}\\,(x-a)" },
        { tex: 'L(x)=2+0{,}25(x-4)', body: '$\\sqrt{4{,}1}\\approx L(4{,}1)=2{,}025$; el valor real es aproximadamente $2{,}02485$.' },
      ],
    },
    {
      say: 'Usa la recta para estimar otra raíz cercana. El cambio en $x$ se multiplica por la pendiente.',
      ask: { prompt: 'Con esa recta, ¿cuánto estima $\\sqrt{4{,}4}$?', options: ['2,1', '2,4', '2,04'], answer: 0, explain: '$2+0{,}25\\cdot0{,}4=2{,}1$. El valor real es aproximadamente $2{,}0976$.' },
      board: { label: 'Estimación', tex: 'L(4{,}4)=2+0{,}25\\cdot0{,}4=\\p{1}{2{,}1}' },
    },
    {
      say: 'El diferencial $dy$ es el cambio estimado por la tangente. Se obtiene multiplicando el cambio $dx$ por la derivada.',
      dur: 3,
      board: { label: 'Diferenciales', tex: "dy=\\p{1}{f'(x)}\\,\\p{2}{dx}", body: 'En $x=4$, con $dx=0{,}4$: $dy=0{,}25\\cdot0{,}4=0{,}1$.' },
    },
    {
      say: 'Newton usa el corte de la tangente con el eje para acercarse a un cero. Para $x^2-2=0$, parte de $x_0=1$ y avanza con el botón.',
      dur: 3,
      board: [
        { label: 'Newton', tex: "x_{n+1}=x_n-\\frac{\\p{1}{f(x_n)}}{\\p{2}{f'(x_n)}}", body: 'Se necesita $f\'(x_n)\\ne0$.' },
        { tex: 'x_0=1,\\quad x_1=1{,}5,\\quad x_2\\approx1{,}41667,\\quad x_3\\approx1{,}414216', body: '$\\sqrt2\\approx1{,}414214$. Cada tangente da la siguiente aproximación.' },
      ],
    },
    {
      say: 'La tangente sirve para estimar valores cercanos y para buscar ceros. Estas son las dos fórmulas que usamos.',
      dur: 2.6,
      board: [
        { label: 'Aproximación lineal', tex: "L(x)=\\p{1}{f(a)}+\\p{2}{f'(a)}(x-a)" },
        { label: 'Newton', tex: "x_{n+1}=x_n-\\p{1}{\\frac{f(x_n)}{f'(x_n)}}" },
      ],
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function EstimateDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [h, setH] = useState(10);
  const [steps, setSteps] = useState<number[]>([40]);
  const onH = useSvgDrag(svg, (x) => {
    let v = Math.round(clamp(PS.inv(x, 0)[0] - 100, -20, 30));
    if (Math.abs(v - 2) < 0.6) v = 2;
    setH(v);
    if (v === 2) unlock();
  });

  if (beat === 0) {
    const x = 100 + h;
    const approx = 10 + h / 20;
    const truth = Math.sqrt(x);
    return (
      <Stage ref={svg}>
        <Axes P={PS} xTicks={[80, 90, 100, 110, 120, 130]} yTicks={[9, 10, 11]} xLabel="x" yLabel="y" grid />
        <Curve P={PS} f={Math.sqrt} a={80} b={130} color={C.cyan} width={4} />
        <SlopeLine P={PS} a={100} ya={10} m={0.05} x0={80} x1={130} color={C.amber} width={2.5} />
        <Dot x={PS.x(100)} y={PS.y(10)} r={8} color={C.amber} />
        <Line a={PS.pt(x, truth)} b={PS.pt(x, approx)} color={C.red} width={4} />
        <Dot x={PS.x(x)} y={PS.y(truth)} r={7} color={C.cyan} />
        <Dot x={PS.x(x)} y={PS.y(approx)} r={7} color={C.amber} />
        <Html x={1290} y={200} size={22} anchor="left" color={C.cyan}>
          <Tex tex={`\\sqrt{${x}}=${nt(truth, 4)}`} />
        </Html>
        <Html x={1290} y={250} size={22} anchor="left" color={C.amber}>
          <Tex tex={`10+\\tfrac{${h}}{20}=${nt(approx, 4)}`} />
        </Html>
        <Html x={1290} y={300} size={20} anchor="left" color={C.red}>
          <Tex tex={`\\text{error}=${nt(Math.abs(approx - truth), 4)}`} />
        </Html>
        <rect x={PS.x(80) - 10} y={PS.y(8.8)} width={PS.box.w + 20} height={70} fill="transparent" onPointerDown={onH} />
        <Knob x={PS.x(x)} y={PS.y(8.8) + 32} onPointerDown={onH} cursor="ew-resize" label={`h=${h}`} />
      </Stage>
    );
  }
  if (beat === 1)
    return (
      <Stage>
        <Formula y={240} size={36} tex="(2{,}01)^3\approx\ ?" />
        {answer !== null && (
          <>
            <Formula y={360} size={28} tex="f(x)=x^3,\quad f(2)=8,\quad f'(2)=12" />
            <Formula y={450} size={28} color={C.amber} tex="8+12\cdot0{,}01=8{,}12" />
            <Formula y={540} size={22} color={C.muted} tex="\text{exacto: }8{,}120601" />
          </>
        )}
      </Stage>
    );
  if (beat === 2) {
    const s = 34;
    return (
      <Stage>
        <rect x={380} y={180} width={10 * s} height={10 * s} fill={C.cyan} opacity={0.25} stroke={C.cyan} strokeWidth={3} />
        <rect x={380 + 10 * s} y={180} width={14} height={10 * s} fill={C.amber} opacity={0.6} />
        <rect x={380} y={180 + 10 * s} width={10 * s} height={14} fill={C.amber} opacity={0.6} />
        <Html x={380 + 5 * s} y={160} size={22} color={C.cyan}>
          <Tex tex="10\pm0{,}1\ \text{cm}" />
        </Html>
        <Formula x={1100} y={260} size={26} tex="A=x^2" />
        {answer !== null && <Formula x={1100} y={360} size={26} color={C.amber} tex="dA=2x\,dx=2\cdot10\cdot0{,}1=2" />}
        {answer !== null && <Formula x={1100} y={450} size={20} color={C.muted} tex="\tfrac{dA}{A}=2\cdot\tfrac{dx}{x}:\ 1\,\%\to2\,\%" />}
      </Stage>
    );
  }
  // beat 3: Newton
  const last = steps[steps.length - 1];
  const step = () => {
    const t = last - g(last) / dg(last);
    const next = [...steps, t];
    setSteps(next);
    if (next.length >= 4) unlock();
  };
  return (
    <Stage>
      <Axes P={PN} xTicks={[0, 10, 20, 30, 40]} yTicks={[-50, 0, 50, 100]} xLabel="t\ (\text{min})" yLabel="T-110" grid />
      <Curve P={PN} f={g} a={0} b={45} color={C.cyan} width={4} />
      {steps.slice(0, -1).map((t, k) => (
        <g key={k} opacity={k === steps.length - 2 ? 1 : 0.45}>
          <Line a={PN.pt(t, 0)} b={PN.pt(t, g(t))} color={C.dim} dashed />
          <Line a={PN.pt(t, g(t))} b={PN.pt(steps[k + 1], 0)} color={C.amber} width={3} />
          <Dot x={PN.x(t)} y={PN.y(g(t))} r={7} color={C.amber} />
        </g>
      ))}
      <Dot x={PN.x(last)} y={PN.y(0)} r={9} color={C.green} />
      {steps.map((t, k) => (
        <Html key={k} x={1290} y={200 + k * 40} size={20} anchor="left" color={k === steps.length - 1 ? C.green : C.muted}>
          <Tex tex={`t_${k}=${nt(t, 4)}`} />
        </Html>
      ))}
      <Html x={800} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={step} disabled={steps.length >= 6}>
          Paso de Newton
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Estimates({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const a = pick(r, [5, 10, 20]);
    const h = randInt(r, 1, 4) * pick(r, [1, -1]);
    const shape = pick(r, ['círculo', 'cubo', 'esfera'] as const);
    const x = pick(r, [5, 10, 20]);
    const dx = pick(r, [0.1, 0.2, 0.5]);
    const N = pick(r, [2, 3, 5, 7, 10]);
    const x0 = pick(r, [1, 2, 3]);
    return { a, h, shape, x, dx, N, x0 };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(`El microcontrolador del sensor no tiene raíz cuadrada: usa la tangente en $${d.a * d.a}$. ¿Qué valor da para $\\sqrt{${d.a * d.a + d.h}}$? (Tres decimales.)`, `\\sqrt{a^2+h}\\approx a+\\frac{h}{2a}`);
      api.hints([`$f(x)=\\sqrt x$, $f(${d.a * d.a})=${d.a}$, $f'(x)=\\tfrac{1}{2\\sqrt x}$.`, `$${d.a}+\\tfrac{${d.h}}{${2 * d.a}}$.`]);
    } else if (round === 1) {
      const q = d.shape === 'círculo' ? 'el área del círculo de radio' : d.shape === 'cubo' ? 'el volumen del cubo de lado' : 'el volumen de la esfera de radio';
      api.prompt(`Se mide ${d.x} cm con un error de ±${dec(d.dx)} cm. ¿Cuál es el error aproximado en ${q} ${d.x} cm? (Dos decimales.)`, d.shape === 'círculo' ? 'A=\\pi r^2' : d.shape === 'cubo' ? 'V=s^3' : 'V=\\tfrac43\\pi r^3');
      api.hints(["Usa el diferencial: error ≈ derivada × error de la medida.", d.shape === 'círculo' ? '$dA=2\\pi r\\,dr$.' : d.shape === 'cubo' ? '$dV=3s^2\\,ds$.' : '$dV=4\\pi r^2\\,dr$.']);
    } else {
      api.prompt(`Newton para calcular $\\sqrt{${d.N}}$: se busca el cero de $g(x)=x^2-${d.N}$. Partiendo de $x_0=${d.x0}$, ¿cuánto vale $x_1$? (Tres decimales.)`, "x_1=x_0-\\frac{g(x_0)}{g'(x_0)}");
      api.hints([`$g(${d.x0})=${d.x0 * d.x0 - d.N}$ y $g'(x)=2x$, así que $g'(${d.x0})=${2 * d.x0}$.`, `$x_1=${d.x0}-\\tfrac{${d.x0 * d.x0 - d.N}}{${2 * d.x0}}$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = d.a + d.h / (2 * d.a);
      const truth = Math.sqrt(d.a * d.a + d.h);
      if (Math.abs(v - t) < 0.0015) return api.result(true, `$${d.a}+\\tfrac{${d.h}}{${2 * d.a}}=${nt(t, 3)}$. El valor exacto es ${nt(truth, 4)}: error de ${nt(Math.abs(t - truth), 4)}.`);
      if (Math.abs(v - truth) < 0.0015) return api.result(false, 'Ese es el valor exacto de la calculadora. Se pide lo que da la tangente.');
      return api.result(false, `La tangente en $${d.a * d.a}$ tiene pendiente $\\tfrac{1}{2\\cdot${d.a}}$. Súmale ${d.a} a esa pendiente por ${d.h}.`);
    }
    if (round === 1) {
      const t = d.shape === 'círculo' ? 2 * Math.PI * d.x * d.dx : d.shape === 'cubo' ? 3 * d.x * d.x * d.dx : 4 * Math.PI * d.x * d.x * d.dx;
      if (Math.abs(v - t) < Math.max(0.02, t * 0.002)) return api.result(true, `≈ ±${nt(t, 2)}. Pequeños errores en la medida se amplifican por la derivada.`);
      return api.result(false, `Derivada en ${d.x} por ${dec(d.dx)}: ${d.shape === 'círculo' ? `$2\\pi\\cdot${d.x}\\cdot${nt(d.dx, 1)}$` : d.shape === 'cubo' ? `$3\\cdot${d.x}^2\\cdot${nt(d.dx, 1)}$` : `$4\\pi\\cdot${d.x}^2\\cdot${nt(d.dx, 1)}$`}.`);
    }
    const t = d.x0 - (d.x0 * d.x0 - d.N) / (2 * d.x0);
    if (Math.abs(v - t) < 0.0015) return api.result(true, `$x_1=${nt(t, 4)}$. El valor exacto es ${nt(Math.sqrt(d.N), 4)}: un paso ya acerca mucho.`);
    return api.result(false, `$x_1=${d.x0}-\\tfrac{${d.x0 * d.x0 - d.N}}{${2 * d.x0}}$: cuidado con el signo de $g(x_0)$.`);
  };

  return (
    <Stage>
      <Formula y={300} size={40} tex={round === 0 ? `\\sqrt{${d.a * d.a + d.h}}\\approx\\ ?` : round === 1 ? `${d.x}\\pm${nt(d.dx, 1)}\\ \\text{cm}` : `g(x)=x^2-${d.N},\\quad x_0=${d.x0}`} />
      <NumberField x={560} y={520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'Estimación:' : round === 1 ? 'Error ±' : 'x₁ ='} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c9',
  world: 'differential',
  code: '2.9',
  title: 'La estimación',
  subtitle: 'Aproximación lineal',
  glyph: '\\approx',
  kind: 'level',
  guide: 'teo',
  teaser: 'El transformador se calienta cada noche. No hay tiempo para cálculos exactos: la tangente da estimaciones rápidas, y Newton dice cuándo llega al límite.',
  learn: "Aproximación lineal $f(a+h)\\approx f(a)+f'(a)h$, su error, diferenciales y propagación de errores, y el método de Newton para resolver ecuaciones.",
  glyphs: ['linapprox', 'newton'],
  pitfalls: ['La aproximación lineal es buena solo cerca de $a$: el error crece como $h^2$.', "En Newton, $x_1=x_0-\\tfrac{g(x_0)}{g'(x_0)}$: un error de signo aleja en vez de acercar.", 'El error relativo de un cuadrado es el doble del error relativo del lado.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'teo', text: 'El transformador del alimentador 4 sube de temperatura cada noche. A 110 °C se quema.' },
        { who: 'nadia', text: 'Necesito saber cuándo llega. Y los sensores son baratos: calculan con aproximaciones.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Estimar',
      Scene: EstimateDemo,
      beats: [
        {
          say: 'El sensor calcula raíces cuadradas con la tangente en 100: $\\sqrt{100+h}\\approx10+\\tfrac{h}{20}$. Mira cuánto se equivoca.',
          gate: 'Lleva h hasta 2.',
          note: { label: 'Aproximación lineal', tex: "f(a+h)\\approx f(a)+f'(a)\\,h", body: '$\\sqrt{102}\\approx10{,}1$; el valor exacto es $10{,}0995$. Cerca de $a$ el error es mínimo; lejos, crece como $h^2$.' },
        },
        {
          say: 'Lo mismo sirve con cualquier función derivable.',
          ask: {
            prompt: '¿Cuánto da $(2{,}01)^3$ con la aproximación lineal?',
            options: ['8,12', '8,01', '8,06'],
            answer: 0,
            explain: '$f(x)=x^3$: $f(2)=8$ y $f\'(2)=12$. $8+12\\cdot0{,}01=8{,}12$. El exacto es $8{,}120601$.',
          },
          note: { label: 'Con potencias', tex: '(2+h)^3\\approx8+12h' },
        },
        {
          say: 'Una placa cuadrada se mide en $10\\pm0{,}1$ cm.',
          ask: {
            prompt: '¿Cuánto es el error aproximado de su área?',
            options: ['±2 cm²', '±0,01 cm²', '±0,2 cm²'],
            answer: 0,
            explain: '$dA=2x\\,dx=2\\cdot10\\cdot0{,}1=2$. Son las dos franjas naranjas. Un 1 % de error en el lado da un 2 % en el área.',
          },
          note: { label: 'Diferenciales', tex: "dy=f'(x)\\,dx", body: 'Un error $dx$ en la medida produce un error $\\approx f\'(x)\\,dx$ en el resultado.' },
        },
        {
          say: 'La temperatura del transformador es $T(t)=40+2t+0{,}05t^2$. ¿Cuándo llega a 110 °C? Newton sigue la tangente hasta el eje, una y otra vez.',
          gate: 'Da tres pasos de Newton.',
          note: { label: 'Método de Newton', tex: "t_{n+1}=t_n-\\frac{g(t_n)}{g'(t_n)}", body: 'Con $g=T-110$ y $t_0=40$: 25, 22,5, 22,43… A los 22 min y medio llega al límite.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Estimaciones', Comp: Estimates, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'A las 04:35 el transformador llega a 110 °C. Si sigue así, esta noche se quema y apaga media ciudad.' },
        { who: 'iris', text: 'Entonces bajamos al subsuelo esta noche. Antes de las 04:35.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'linapprox', world: 'differential', tex: "f(a+h)\\approx f(a)+f'(a)h", name: 'Aproximación lineal', read: 'aproximación lineal', meaning: 'Cerca de $a$, la función se parece a su tangente.' },
  { id: 'newton', world: 'differential', tex: "x_{n+1}=x_n-\\frac{g(x_n)}{g'(x_n)}", name: 'Método de Newton', read: 'método de Newton', meaning: 'Para resolver $g(x)=0$: seguir la tangente hasta el eje y repetir.' },
];
