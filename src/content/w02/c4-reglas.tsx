import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { Tangent, nt } from './kit';

// ============================================================================
// CASO 2.4 · «Cuadrados que crecen» — reglas de derivación
// Placa cuadrada que se dilata: ΔA = 2x·dx + dx² → (x²)' = 2x. Cubo: tres caras → 3x².
// Regla de la potencia (también exponentes negativos y fraccionarios), constantes y sumas.
// ============================================================================

const sign = (v: number) => (v < 0 ? '-' : '+');
/** TeX of a polynomial with integer coefficients, highest degree first. */
function polyTex(cs: number[], v = 'x') {
  const n = cs.length - 1;
  const parts: string[] = [];
  cs.forEach((c, i) => {
    const p = n - i;
    if (c === 0) return;
    const a = Math.abs(c);
    const coef = a === 1 && p > 0 ? '' : String(a);
    const term = p === 0 ? coef : p === 1 ? `${coef}${v}` : `${coef}${v}^{${p}}`;
    parts.push(parts.length === 0 ? (c < 0 ? `-${term}` : term) : `${sign(c)}${term}`);
  });
  return parts.join('') || '0';
}
const polyEval = (cs: number[], x: number) => cs.reduce((acc, c) => acc * x + c, 0);
const polyDer = (cs: number[]) => cs.slice(0, -1).map((c, i) => c * (cs.length - 1 - i));

// ---------------------------------------------------------------- lesson
function RulesLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [h, setH] = useState(0.6);
  const onH = useSvgDrag(svg, (px) => {
    if (beat !== 0) return;
    const next = Math.round(clamp((px - 400) / 800, 0.02, 1) * 100) / 100;
    setH(next);
    if (next < 0.1) unlock();
  });
  if (beat === 0) {
    const side = 2;
    const scale = 170;
    return (
      <Stage ref={svg}>
        <rect x={380} y={170} width={side * scale} height={side * scale} fill={C.cyan} fillOpacity={0.3} stroke={C.cyan} strokeWidth={3} />
        <rect x={720} y={170} width={h * scale} height={side * scale} fill={C.amber} fillOpacity={0.55} />
        <rect x={380} y={510} width={side * scale} height={h * scale} fill={C.magenta} fillOpacity={0.55} />
        <rect x={720} y={510} width={h * scale} height={h * scale} fill={C.red} fillOpacity={0.8} />
        <Cap x={550} y={340} size={32} tex="x^2" color={C.cyan} />
        <Cap x={550} y={140} tex="x=2" />
        <Cap x={720 + h * scale / 2} y={140} tex="h" color={C.amber} />
        <Cap x={1150} y={220} tex="\Delta A=xh+xh+h^2" />
        <Cap x={1150} y={310} tex={`\\frac{\\Delta A}{h}=4+${nt(h)}=${nt(4 + h)}`} color={C.amber} />
        <Cap x={1150} y={400} tex={`h^2=${nt(h * h, 4)}`} color={C.red} />
        <Cap x={1150} y={490} size={18}>Las dos franjas quedan; la esquina se reduce.</Cap>
        <line x1={400} x2={1200} y1={740} y2={740} stroke={C.line} strokeWidth={3} />
        <rect x={380} y={710} width={840} height={60} fill="transparent" onPointerDown={onH} style={{ cursor: 'ew-resize' }} />
        <Knob x={400 + h * 800} y={740} onPointerDown={onH} cursor="ew-resize" label={`h=${dec(h, 2)}`} />
      </Stage>
    );
  }
  if (beat === 1) {
    const iso = (x: number, y: number, z: number) => [690 + (x - y) * 100, 500 + (x + y) * 50 - z * 115];
    const face = (points: number[][], color: string) => <polygon points={points.map(([x, y, z]) => iso(x, y, z).join(',')).join(' ')} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={2} />;
    return (
      <Stage>
        {face([[0, 0, 2], [2, 0, 2], [2, 2, 2], [0, 2, 2]], C.cyan)}
        {face([[2, 0, 0], [2, 2, 0], [2, 2, 2], [2, 0, 2]], C.cyan)}
        {face([[0, 2, 0], [2, 2, 0], [2, 2, 2], [0, 2, 2]], C.cyan)}
        {face([[0, 0, 2.2], [2, 0, 2.2], [2, 2, 2.2], [0, 2, 2.2]], C.amber)}
        {face([[2.2, 0, 0], [2.2, 2, 0], [2.2, 2, 2], [2.2, 0, 2]], C.amber)}
        {face([[0, 2.2, 0], [2, 2.2, 0], [2, 2.2, 2], [0, 2.2, 2]], C.amber)}
        <Cap x={1200} y={250} tex="\frac{\Delta V}{h}=3x^2+3xh+h^2" size={22} />
        <Cap x={1200} y={350} tex="h\to0:\quad3x^2" color={C.amber} />
        {answer !== null && <Cap x={1200} y={450} tex="3\cdot2^2=12" color={C.green} />}
      </Stage>
    );
  }
  const rows = beat === 2 ? [
    "\\frac{d}{dx}x^n=n\\,x^{n-1}",
    "\\frac{d}{dx}x^{-1}=-x^{-2}",
    "\\frac{d}{dx}\\sqrt{x}=\\frac{1}{2\\sqrt{x}}",
  ] : beat === 3 ? [
    "(c\\,f)'=c\\,f',\\quad(f+g)'=f'+g',\\quad c'=0",
    "\\frac{d}{dx}(4x^3-2x+7)=12x^2-2",
    ...(answer !== null ? ["12\\cdot1^2-2=10"] : []),
  ] : ["\\frac{d}{dx}x^n=n\\,x^{n-1}", "(c\\,f)'=c\\,f',\\quad(f+g)'=f'+g',\\quad c'=0"];
  return <Stage>{rows.map((tex, i) => <Cap key={tex} x={800} y={220 + i * 150} tex={tex} size={28} color={i === 0 ? C.cyan : C.amber} />)}</Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Reglas de derivación',
  Scene: RulesLesson,
  beats: [
    {
      say: 'Al aumentar el lado de un cuadrado en $h$, aparecen dos franjas $xh$ y una esquina $h^2$. Reduce $h$ y mira qué pasa con la esquina.',
      gate: 'Arrastra el control para cambiar h y dejarlo bajo 0,1.',
      board: [
        { label: 'Cuadrado', tex: '(x+h)^2=x^2+\\p{1}{2xh}+\\p{2}{h^2}', parts: ['área de las franjas', 'área de la esquina'] },
        { tex: '\\frac{(x+h)^2-x^2}{h}=2x+h\\to2x,\\qquad\\frac{d}{dx}x^2=\\p{1}{\\cA{2x}}', parts: ['cambio del área por lado'] },
      ],
    },
    {
      say: 'En un cubo crecen tres caras de área $x^2$. Al dividir el aumento por $h$ y hacer $h$ pequeño, queda $3x^2$.',
      ask: { prompt: '¿Cuánto vale la derivada de $x^3$ en $x=2$?', options: ['12', '8', '6'], answer: 0, explain: '$3\\cdot2^2=12$. El volumen es 8; su derivada es 12.' },
      board: [
        { label: 'Cubo', tex: '(x+h)^3=x^3+3x^2h+3xh^2+h^3' },
        { tex: '\\frac{d}{dx}x^3=\\p{1}{\\cA{3x^2}}', parts: ['cambio del volumen por lado'] },
      ],
    },
    {
      say: 'Para una potencia, el exponente baja como factor y luego se resta uno al exponente. También funciona con exponentes negativos y fraccionarios, donde la función es derivable.',
      dur: 3,
      board: [
        { label: 'Potencia', tex: '\\frac{d}{dx}x^n=\\p{1}{n}\\,x^{\\p{2}{n-1}}', parts: ['factor que baja', 'exponente que disminuye'] },
        { tex: "(x^{-1})'=-x^{-2},\\qquad(\\sqrt{x})'=\\frac{1}{2\\sqrt{x}}", body: 'Para $x^{-1}$, $x\\ne0$. Para la derivada de $\\sqrt{x}$, $x>0$.' },
      ],
    },
    {
      say: 'Los factores constantes se mantienen y las sumas se derivan término a término. Una constante tiene derivada cero.',
      ask: { prompt: 'Para $4x^3-2x+7$, ¿cuánto vale esa derivada en $x=1$?', options: ['10', '9', '12'], answer: 0, explain: 'La derivada es $12x^2-2$. En $x=1$: $12-2=10$.' },
      board: [
        { label: 'Constantes y sumas', tex: "(c\\,f)'=c\\,f',\\quad(f+g)'=f'+g',\\quad c'=0" },
        { tex: '\\frac{d}{dx}(4x^3-2x+7)=12x^2-2', body: 'En $x=1$, la derivada vale 10.' },
      ],
    },
    {
      say: 'La regla de la potencia y la linealidad permiten derivar cada término de un polinomio. Aplica ambas reglas y reúne el resultado.',
      dur: 2.6,
      board: [
        { label: 'Regla de la potencia', tex: '\\frac{d}{dx}x^n=\\p{1}{\\cA{n\\,x^{n-1}}}', parts: ['derivada de la potencia'] },
        { label: 'Linealidad', tex: "(a\\,f+b\\,g)'=\\p{1}{\\cC{a\\,f'}}+\\p{2}{\\cA{b\\,g'}},\\qquad c'=0", parts: ['aporte del primer término', 'aporte del segundo término'] },
      ],
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function RulesDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [dx, setDx] = useState(1);
  const onDx = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 400) / 800, 0.02, 1) * 100) / 100;
    setDx(v);
    if (v <= 0.05) unlock();
  });

  if (beat === 0) {
    const s = 110; // px per unit
    const X0 = 380;
    const Y0 = 160;
    const x = 3;
    return (
      <Stage ref={svg}>
        <rect x={X0} y={Y0} width={x * s} height={x * s} fill={C.cyan} opacity={0.3} stroke={C.cyan} strokeWidth={3} />
        <rect x={X0 + x * s} y={Y0} width={dx * s} height={x * s} fill={C.amber} opacity={0.55} />
        <rect x={X0} y={Y0 + x * s} width={x * s} height={dx * s} fill={C.amber} opacity={0.55} />
        <rect x={X0 + x * s} y={Y0 + x * s} width={dx * s} height={dx * s} fill={C.red} opacity={0.75} />
        <Html x={X0 + (x * s) / 2} y={Y0 + (x * s) / 2} size={34} color={C.text}>
          <Tex tex="x^2" />
        </Html>
        <Html x={X0 + (x * s) / 2} y={Y0 - 24} size={22} color={C.cyan}>
          <Tex tex="x=3" />
        </Html>
        <Html x={X0 + x * s + (dx * s) / 2} y={Y0 - 24} size={20} color={C.amber}>
          <Tex tex={`dx=${nt(dx, 2)}`} />
        </Html>
        <Formula x={1220} y={250} size={26} tex={`\\Delta A=2\\cdot3\\cdot dx+dx^2`} />
        <Formula x={1220} y={340} size={26} color={C.amber} tex={`\\dfrac{\\Delta A}{dx}=6+${nt(dx, 2)}=${nt(6 + dx, 2)}`} />
        <Html x={1220} y={430} size={18} color={C.red}>
          <span>rojo: {dec(((dx * dx) / (6 * dx + dx * dx)) * 100, 1)} % del aumento</span>
        </Html>
        <line x1={400} x2={1200} y1={800} y2={800} stroke={C.line} strokeWidth={3} />
        <rect x={380} y={770} width={840} height={60} fill="transparent" onPointerDown={onDx} style={{ cursor: 'ew-resize' }} />
        <Knob x={400 + dx * 800} y={800} onPointerDown={onDx} cursor="ew-resize" label="dx" />
      </Stage>
    );
  }
  if (beat === 1) {
    // isometric cube with three slabs
    const iso = (x: number, y: number, z: number): [number, number] => [800 + (x - y) * 95, 520 + (x + y) * 50 - z * 110];
    const face = (pts: [number, number, number][], fill: string, op = 0.6) => <polygon points={pts.map((p) => iso(...p).join(',')).join(' ')} fill={fill} opacity={op} stroke="#000" strokeOpacity={0.3} />;
    const x = 2;
    const d = 0.35;
    return (
      <Stage>
        {face([[0, 0, x], [x, 0, x], [x, x, x], [0, x, x]], C.cyan, 0.45)}
        {face([[x, 0, 0], [x, x, 0], [x, x, x], [x, 0, x]], C.cyan, 0.3)}
        {face([[0, x, 0], [x, x, 0], [x, x, x], [0, x, x]], C.cyan, 0.2)}
        {/* three slabs */}
        {face([[0, 0, x + d], [x, 0, x + d], [x, x, x + d], [0, x, x + d]], C.amber, 0.65)}
        {face([[x + d, 0, 0], [x + d, x, 0], [x + d, x, x], [x + d, 0, x]], C.amber, 0.45)}
        {face([[0, x + d, 0], [x, x + d, 0], [x, x + d, x], [0, x + d, x]], C.amber, 0.35)}
        <Formula x={1250} y={250} size={26} tex="V=x^3" />
        <Formula x={1250} y={340} size={24} color={C.amber} tex="\Delta V\approx3\,x^2\,dx" />
        {answer !== null && <Formula x={1250} y={440} size={26} color={C.green} tex="3\cdot2^2=12" />}
      </Stage>
    );
  }
  if (beat === 2) {
    const rows = [
      ['x', '1'],
      ['x^2', '2x'],
      ['x^3', '3x^2'],
      ['x^{n}', 'n\\,x^{n-1}'],
      ['x^{-1}=\\tfrac1x', '-x^{-2}=-\\tfrac1{x^2}'],
      ['x^{1/2}=\\sqrt x', '\\tfrac12x^{-1/2}=\\tfrac{1}{2\\sqrt x}'],
    ];
    return (
      <Stage>
        {rows.map(([f, d], i) => (
          <g key={i} opacity={i < 4 || answer !== null || i === 4 ? 1 : 0.3}>
            <Html x={640} y={170 + i * 100} size={30} anchor="right" color={i === 3 ? C.amber : C.cyan}>
              <Tex tex={f} />
            </Html>
            <Html x={760} y={170 + i * 100} size={26} color={C.dim}>
              <span>→</span>
            </Html>
            <Html x={880} y={170 + i * 100} size={30} anchor="left" color={i === 3 ? C.amber : C.text}>
              <Tex tex={d} />
            </Html>
          </g>
        ))}
      </Stage>
    );
  }
  const f = (t: number) => 2 * t ** 3 - 3 * t * t + 5 * t + 1;
  const g = (t: number) => f(t) + 4;
  const Q = plane([0, 2], [0, 18], { x: 320, y: 130, w: 900, h: 520 });
  return (
    <Stage>
      <Axes P={Q} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[3, 6, 9, 12, 15, 18]} xLabel="t" yLabel="E" grid />
      <Curve P={Q} f={f} a={0} b={2} color={C.cyan} width={4} />
      <Curve P={Q} f={g} a={0} b={2} color={C.violet} width={3} />
      <Tangent P={Q} f={f} a={1} m={5} half={0.5} color={C.amber} />
      <Tangent P={Q} f={g} a={1} m={5} half={0.5} color={C.amber} />
      <Html x={1250} y={220} size={22} anchor="left" color={C.cyan}>
        <Tex tex="E=2t^3-3t^2+5t+1" />
      </Html>
      <Html x={1250} y={270} size={22} anchor="left" color={C.violet}>
        <Tex tex="E+4" />
      </Html>
      <Group opacity={answer !== null ? 1 : 0}>
        <Html x={1250} y={360} size={22} anchor="left" color={C.amber}>
          <Tex tex="E'=6t^2-6t+5" />
        </Html>
        <Html x={1250} y={410} size={22} anchor="left" color={C.amber}>
          <Tex tex="E'(1)=5" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const POWERS: { tex: (k: number) => string; f: (k: number, x: number) => number; d: (k: number, x: number) => number; xs: number[] }[] = [
  { tex: (k) => `\\dfrac{${k}}{x}`, f: (k, x) => k / x, d: (k, x) => -k / (x * x), xs: [1, 2, 4] },
  { tex: (k) => `${k}\\sqrt{x}`, f: (k, x) => k * Math.sqrt(x), d: (k, x) => k / (2 * Math.sqrt(x)), xs: [1, 4, 9, 16] },
  { tex: (k) => `\\dfrac{${k}}{x^2}`, f: (k, x) => k / (x * x), d: (k, x) => (-2 * k) / x ** 3, xs: [1, 2] },
  { tex: (k) => `${k}\\,x^{3/2}`, f: (k, x) => k * x ** 1.5, d: (k, x) => 1.5 * k * Math.sqrt(x), xs: [1, 4, 9] },
];

function Models({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const cs = [randInt(r, 1, 3) * pick(r, [1, -1]), randInt(r, -4, 4), randInt(r, -6, 6), randInt(r, -5, 5)];
    const t0 = randInt(r, 1, 3);
    const pw = pick(r, POWERS);
    const k = pick(r, [2, 4, 6, 8]);
    const x0 = pick(r, pw.xs);
    const a2 = pick(r, [1, 2, 3]) * pick(r, [1, -1]);
    const c2 = randInt(r, -4, 6);
    const x2 = pick(r, [-2, -1, 1, 2, 3]);
    return { cs, t0, pw, k, x0, a2, c2, x2 };
  }, [seed]);
  const [val, setVal] = useState('');
  const [val2, setVal2] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Modelo de energía de la caldera 2. ¿Cuál es su potencia en $t=${data.t0}$?`, `E(t)=${polyTex(data.cs, 't')}`);
      api.hints(['Deriva término a término: $t^n\\to n\\,t^{n-1}$, y la constante desaparece.', `Luego reemplaza $t=${data.t0}$ en $E'(t)$.`]);
    } else if (round === 1) {
      api.prompt(`Un sensor sigue esta ley. ¿Cuánto vale su derivada en $x=${data.x0}$?`, `f(x)=${data.pw.tex(data.k)}`);
      api.hints(['Escribe la función como potencia: $\\tfrac1x=x^{-1}$, $\\sqrt x=x^{1/2}$.', 'Aplica $x^n\\to n\\,x^{n-1}$ y reemplaza.']);
    } else {
      api.prompt(`Recta tangente a la curva en $x=${data.x2}$: escribe su pendiente $m$ y su ordenada en el origen $b$.`, `f(x)=${polyTex([data.a2, 0, data.c2])},\\qquad y=mx+b`);
      api.hints(["$m=f'(x_0)$.", '$b=f(x_0)-m\\,x_0$: la tangente pasa por $(x_0,f(x_0))$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const dcs = polyDer(data.cs);
      const t = polyEval(dcs, data.t0);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$E'(t)=${polyTex(dcs, 't')}$, y en $t=${data.t0}$ vale ${t}.`);
      if (Math.abs(v - polyEval(data.cs, data.t0)) < 0.01) return api.result(false, `${polyEval(data.cs, data.t0)} es $E(${data.t0})$, la energía. Primero deriva.`);
      return api.result(false, `Derivando término a término: $E'(t)=${polyTex(dcs, 't')}$. Reemplaza $t=${data.t0}$.`);
    }
    if (round === 1) {
      const t = data.pw.d(data.k, data.x0);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$f'(${data.x0})=${nt(t, 3)}$.`);
      return api.result(false, `Como potencia, el exponente baja multiplicando y se le resta 1. Con eso, $f'(${data.x0})=${nt(t, 3)}$ — revisa signos y raíces.`);
    }
    const v2 = parseNum(val2);
    if (v2 === null) return;
    const m = 2 * data.a2 * data.x2;
    const fx = data.a2 * data.x2 * data.x2 + data.c2;
    const b = fx - m * data.x2;
    if (Math.abs(v - m) < 0.01 && Math.abs(v2 - b) < 0.01) return api.result(true, `$y=${m}x${b >= 0 ? '+' : ''}${b}$ pasa por $(${data.x2},${fx})$ con pendiente ${m}.`);
    if (Math.abs(v - m) >= 0.01) return api.result(false, `La pendiente es $f'(${data.x2})=2\\cdot${data.a2}\\cdot${data.x2}=${m}$.`);
    return api.result(false, `Con $m=${m}$, la recta debe pasar por $(${data.x2},${fx})$: $b=${fx}-${m}\\cdot${data.x2}$.`);
  };

  return (
    <Stage>
      {round < 2 ? (
        <Formula y={300} size={44} tex={round === 0 ? `E(t)=${polyTex(data.cs, 't')}` : `f(x)=${data.pw.tex(data.k)}`} />
      ) : (
        (() => {
          const f = (x: number) => data.a2 * x * x + data.c2;
          const ys = [-4, -2, 2, 4].map((x) => f(x));
          const lo = Math.min(...ys, f(0)) - 2;
          const hi = Math.max(...ys, f(0)) + 2;
          const Q = plane([-4, 4], [lo, hi], { x: 300, y: 120, w: 900, h: 480 });
          return (
            <>
              <Axes P={Q} xTicks={[-4, -2, 0, 2, 4]} yTicks={[]} xLabel="x" yLabel="y" grid />
              <Curve P={Q} f={f} a={-4} b={4} color={C.cyan} width={4} />
              <Tangent P={Q} f={f} a={data.x2} m={2 * data.a2 * data.x2} half={1.6} color={C.amber} />
            </>
          );
        })()
      )}
      <NumberField x={round === 2 ? 1250 : 560} y={round === 2 ? 300 : 520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? "E'(t₀) =" : round === 1 ? "f'(x₀) =" : 'm ='} width={5} />
      {round === 2 && <NumberField x={1250} y={380} value={val2} onChange={setVal2} onEnter={submit} label="b =" width={5} />}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c4',
  world: 'differential',
  code: '2.4',
  title: 'Cuadrados que crecen',
  subtitle: 'Reglas de derivación',
  glyph: 'x^n',
  kind: 'level',
  guide: 'teo',
  teaser: 'Los modelos de la sala de máquinas son polinomios y potencias. Para derivarlos rápido hay reglas, y cada una se puede ver.',
  learn: 'Derivada de $x^2$ y $x^3$ como franjas que se agregan, regla de la potencia (también con exponentes negativos y fraccionarios), constantes y sumas, recta tangente.',
  glyphs: ['dx', 'power-rule'],
  pitfalls: ['La derivada de una constante es 0: subir una curva no cambia sus pendientes.', '$\\left(\\tfrac1x\\right)\'=-\\tfrac1{x^2}$, no $\\tfrac{1}{x}$ ni $\\ln x$.', 'Al derivar $x^n$ el exponente baja y luego se le resta 1.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nar', text: 'Sala de máquinas, 10:00; vibra una placa metálica.' },
        { who: 'teo', text: 'Cada equipo tiene un modelo de energía según el tiempo. Con eso podemos revisar cuánto debería consumir.' },
        { who: 'nadia', text: 'Y comprobar cuánto cambia al calentarse. La placa cuadrada se dilata; la caldera también tiene su cuenta.' },
        { who: 'iris', text: 'Quiero comparar esa lista con el pico de 12 MW. Alguien está cobrando espacio aquí sin aparecer en ella.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Las reglas',
      Scene: RulesDemo,
      beats: [
        {
          say: 'Una placa cuadrada de lado $x=3$ se dilata con el calor: el lado crece en $dx$. ¿Cuánta área se agrega?',
          gate: 'Achica dx hasta 0,05.',
          note: { label: 'Derivada de x²', tex: '\\frac{d}{dx}x^2=2x', body: 'Se agregan dos franjas de $x\\cdot dx$ y una esquina $dx^2$ que se vuelve despreciable.' },
        },
        {
          say: 'Un cubo de lado $x$ que crece en $dx$ se agrega tres láminas, una por cada cara visible.',
          ask: {
            prompt: 'Con $x=2$, ¿cuánto crece el volumen por cada unidad de lado?',
            options: ['12', '8', '6'],
            answer: 0,
            explain: 'Tres láminas de área $x^2=4$: $3\\cdot4=12$. Las aristas y la esquina son despreciables.',
          },
          note: { label: 'Derivada de x³', tex: '\\frac{d}{dx}x^3=3x^2' },
        },
        {
          say: 'El patrón sigue: el exponente baja como factor y se le resta 1. Vale también para exponentes negativos y fracciones.',
          ask: {
            prompt: '¿Cuál es la derivada de $\\sqrt x$ en $x=4$?',
            options: ['1/4', '2', '1/2'],
            answer: 0,
            explain: '$\\sqrt x=x^{1/2}$, así que su derivada es $\\tfrac12x^{-1/2}=\\tfrac{1}{2\\sqrt x}$. En $x=4$: $\\tfrac1{2\\cdot2}=\\tfrac14$.',
          },
          note: { label: 'Regla de la potencia', tex: '\\frac{d}{dx}x^n=n\\,x^{n-1}', body: 'Para cualquier exponente real $n$ (con $x>0$ si hace falta).' },
        },
        {
          say: 'La caldera: $E(t)=2t^3-3t^2+5t+1$. La curva violeta es la misma subida 4 unidades: sus tangentes son paralelas.',
          ask: {
            prompt: '¿Cuánto vale $E\'(1)$?',
            options: ['5', '6', '4'],
            answer: 0,
            explain: 'Término a término: $E\'=6t^2-6t+5$, y la constante 1 no aporta. En $t=1$: $6-6+5=5$.',
          },
          note: { label: 'Constantes y sumas', tex: "(a\\,f+b\\,g)'=a\\,f'+b\\,g',\\qquad c'=0" },
        },
      ],
    },
    { kind: 'challenge', title: 'Los modelos', Comp: Models, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'teo', text: 'La caldera da 5 en su modelo de potencia al cabo de una hora. Los equipos de la lista cuadran con sus modelos.' },
        { who: 'nadia', text: 'Ninguno explica los 12 MW. Pero el alimentador 4 tiene un transformador nuevo fuera de la lista.' },
        { who: 'iris', text: 'Nuevo y sin registro. ¿Quién lo recibió?' },
        { who: 'nadia', text: 'Mide voltaje y corriente. La placa del fabricante está; la firma de recepción, no.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'dx', world: 'differential', tex: '\\frac{df}{dx}', name: 'Notación de Leibniz', read: 'de efe de equis', meaning: "Otra forma de escribir $f'(x)$: el cambio de $f$ por cada pequeño cambio $dx$." },
  { id: 'power-rule', world: 'differential', tex: '(x^n)\'=n\\,x^{n-1}', name: 'Regla de la potencia', read: 'regla de la potencia', meaning: 'El exponente baja multiplicando y se le resta 1. Vale para todo exponente real.' },
];
