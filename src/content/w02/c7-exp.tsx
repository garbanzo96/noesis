import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { Tangent, nt } from './kit';

// ============================================================================
// CASO 2.7 · «Enfriamiento» — derivadas de exponenciales y logaritmos
// e^x: la pendiente es igual a la altura. (b^x)' = ln b · b^x. Ley de enfriamiento: el ritmo es
// proporcional a la diferencia de temperatura. (ln x)' = 1/x.
// ============================================================================

const PE = plane([-2, 2.5], [0, 13], { x: 300, y: 120, w: 960, h: 540 });

/** Slope triangle with run 1 at x: the rise is f'(x). */
function RunOne({ x, y, m, color = C.amber }: { x: number; y: number; m: number; color?: string }) {
  return (
    <g>
      <Line a={PE.pt(x, y)} b={PE.pt(x + 1, y)} color={C.text} dashed width={2} />
      <Line a={PE.pt(x + 1, y)} b={PE.pt(x + 1, y + m)} color={color} width={4} />
      <Html x={PE.x(x + 0.5)} y={PE.y(y) + 22} size={16} color={C.text}>
        <span className="prop-tag">1</span>
      </Html>
      <Html x={PE.x(x + 1) + 12} y={PE.y(y + m / 2)} size={18} anchor="left" color={color}>
        <Tex tex={`f'=${nt(m, 2)}`} />
      </Html>
    </g>
  );
}

// ---------------------------------------------------------------- lesson
function ExpLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(-1);
  const onX = useSvgDrag(svg, (px) => {
    if (beat !== 0) return;
    const next = Math.round(clamp(PE.inv(px, 0)[0], -2, 1.4) * 1000) / 1000;
    setX(next);
    if (next >= 1) unlock();
  });
  if (beat === 0 || beat === 1) {
    const at = beat === 0 ? x : 0;
    return (
      <Stage ref={svg}>
        <Axes P={PE} xTicks={[-2, -1, 0, 1, 2]} yTicks={[2, 4, 6, 8, 10, 12]} grid />
        <Curve P={PE} f={Math.exp} a={-2} b={2.5} color={C.cyan} width={4} />
        <Tangent P={PE} f={Math.exp} a={at} m={Math.exp(at)} half={1} onPointerDown={beat === 0 ? onX : undefined} />
        <Cap x={1340} y={190} tex="y=e^x" color={C.cyan} />
        <Cap x={1340} y={270} tex={`\\text{altura}\\approx${nt(Math.exp(at), 3)}`} color={C.cyan} />
        <Cap x={1340} y={340} tex={`\\text{pendiente}\\approx${nt(Math.exp(at), 3)}`} color={C.amber} />
        {beat === 0 && <>
          <rect x={PE.x(-2)} y={700} width={PE.x(1.4) - PE.x(-2)} height={60} fill="transparent" onPointerDown={onX} />
          <Knob x={PE.x(x)} y={730} onPointerDown={onX} cursor="ew-resize" label={`x=${dec(x, 3)}`} />
        </>}
        {beat === 1 && <>
          <Curve P={PE} f={(v) => 2 ** v} a={-2} b={2.5} color={C.violet} width={3} />
          <Tangent P={PE} f={(v) => 2 ** v} a={0} m={Math.log(2)} half={1} color={C.violet} />
          <Cap x={1340} y={440} tex={`(2^x)'_{x=0}=\\ln2\\approx${nt(Math.log(2), 3)}`} size={20} color={C.violet} />
          {answer !== null && <Cap x={1340} y={520} tex="(e^x)'_{x=0}=1" color={C.green} />}
        </>}
      </Stage>
    );
  }
  if (beat === 2) {
    const P = plane([0, 8], [0, 110], { x: 300, y: 120, w: 900, h: 540 });
    const Q = (t: number) => 100 * Math.exp(-0.5 * t);
    return <Stage>
      <Axes P={P} xTicks={[0, 2, 4, 6, 8]} yTicks={[20, 40, 60, 80, 100]} xLabel="t" yLabel="Q" grid />
      <Curve P={P} f={Q} a={0} b={8} color={C.cyan} width={4} />
      {[0, 2, 4].map((t) => <Tangent key={t} P={P} f={Q} a={t} m={-0.5 * Q(t)} half={0.8} />)}
      <Cap x={1380} y={220} tex="Q(t)=100e^{-0{,}5t}" size={22} />
      <Cap x={1380} y={320} tex="Q'(t)=-50e^{-0{,}5t}" size={22} color={C.amber} />
      <Cap x={1380} y={420} tex="Q'(0)=-50" color={C.amber} />
    </Stage>;
  }
  if (beat === 3) {
    const P = plane([0, 8], [-2, 3], { x: 300, y: 120, w: 900, h: 540 });
    return <Stage>
      <Axes P={P} xTicks={[1, 2, 4, 6, 8]} yTicks={[-1, 1, 2, 3]} grid />
      <Curve P={P} f={Math.log} a={0.14} b={8} color={C.cyan} width={4} />
      <Cap x={1360} y={220} tex="y=\ln x" />
      {answer !== null && <>
        <Tangent P={P} f={Math.log} a={4} m={0.25} half={3} />
        <Cap x={1360} y={330} tex="f'(4)=\frac14=0{,}25" size={24} color={C.amber} />
      </>}
    </Stage>;
  }
  return <Stage>
    <Cap x={800} y={270} tex="(e^x)'=e^x" size={34} color={C.cyan} />
    <Cap x={800} y={440} tex="(\ln x)'=\frac1x,\quad x>0" size={34} color={C.amber} />
  </Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Derivadas de exp y log',
  Scene: ExpLesson,
  beats: [
    {
      say: 'En $y=e^x$, la pendiente es igual a la altura en cada punto. En $x=1$, ambas valen aproximadamente $2{,}718$.',
      gate: 'Recorre la curva con el control hasta x = 1 o más.',
      board: { label: 'Exponencial', tex: "(e^x)'=\\p{1}{\\cA{e^x}}", body: 'En $x=1$: altura y pendiente $e\\approx2{,}718$.', parts: ['pendiente igual a altura'] },
    },
    {
      say: 'Para otras bases aparece el factor $\\ln a$. En $2^x$, la pendiente en cero es $\\ln2\\approx0{,}693$.',
      ask: { prompt: '¿Qué base tiene pendiente exactamente 1 en $x=0$?', options: ['$e\\approx2{,}718$', '2', '10'], answer: 0, explain: 'En cero, $a^0\\ln a=\\ln a$. Vale 1 cuando $a=e$.' },
      board: { label: 'Otras bases', tex: "(a^x)'=\\p{1}{a^x}\\,\\p{2}{\\ln a},\\qquad a>0", body: 'El logaritmo natural de $e$ vale 1.', parts: ['altura de la curva', 'ajuste según la base'] },
    },
    {
      say: 'La cadena agrega el factor $k$ al derivar $e^{kx}$. En $Q(t)=100e^{-0{,}5t}$, la cantidad baja cada vez más lento.',
      dur: 3,
      board: [
        { label: 'Cadena', tex: "(e^{kx})'=\\p{1}{k}\\,e^{kx}", parts: ['ritmo de la entrada'] },
        { tex: "Q(t)=100e^{-0{,}5t},\\quad Q'(t)=-50e^{-0{,}5t},\\quad Q'(0)=-50" },
      ],
    },
    {
      say: 'El logaritmo natural es la inversa de $e^x$. Su pendiente en $x>0$ es $1/x$.',
      ask: { prompt: '¿Cuánto vale la derivada de $\\ln x$ en $x=4$?', options: ['0,25', '4', '1'], answer: 0, explain: '$1/4=0{,}25$.' },
      board: { label: 'Logaritmo', tex: "(\\ln x)'=\\p{1}{\\cA{\\frac1x}},\\qquad x>0", parts: ['pendiente del logaritmo'] },
    },
    {
      say: 'La exponencial se deriva a sí misma. La derivada del logaritmo natural es el recíproco de su entrada.',
      dur: 2.6,
      board: { label: 'Exp y log', tex: "(e^x)'=\\p{1}{\\cC{e^x}},\\qquad(\\ln x)'=\\p{2}{\\cA{\\frac1x}}\\quad(x>0)", parts: ['pendiente de la exponencial', 'pendiente del logaritmo'] },
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function ExpDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(-1);
  const [t, setT] = useState(0);
  const onX = useSvgDrag(svg, (px) => {
    const v = clamp(PE.inv(px, 0)[0], -2, 1.4);
    setX(v);
    if (v > 1.3) unlock();
  });
  const PT = plane([0, 12], [20, 90], { x: 300, y: 120, w: 960, h: 540 });
  const T = (s: number) => 25 + 60 * Math.exp(-0.3 * s);
  const onT = useSvgDrag(svg, (px) => {
    const v = clamp(PT.inv(px, 0)[0], 0, 12);
    setT(v);
    if (v > 8) unlock();
  });

  if (beat === 0) {
    const y = Math.exp(x);
    return (
      <Stage ref={svg}>
        <Axes P={PE} xTicks={[-2, -1, 0, 1, 2]} yTicks={[2, 4, 6, 8, 10, 12]} xLabel="x" yLabel="y" grid />
        <Curve P={PE} f={Math.exp} a={-2} b={2.5} color={C.cyan} width={4} />
        <Line a={PE.pt(x, 0)} b={PE.pt(x, y)} color={C.cyan} width={4} />
        <Html x={PE.x(x) - 12} y={PE.y(y / 2)} size={18} anchor="right" color={C.cyan}>
          <Tex tex={`f=${nt(y, 2)}`} />
        </Html>
        <Tangent P={PE} f={Math.exp} a={x} m={y} half={1.2} color={C.amber} onPointerDown={onX} />
        <RunOne x={x} y={y} m={y} />
        <Formula x={1340} y={220} size={26} tex="y=e^x" />
      </Stage>
    );
  }
  if (beat === 1) {
    const bases = [
      { b: 2, c: C.violet },
      { b: Math.E, c: C.cyan },
      { b: 3, c: C.magenta },
    ];
    return (
      <Stage>
        <Axes P={PE} xTicks={[-2, -1, 0, 1, 2]} yTicks={[2, 4, 6, 8, 10, 12]} xLabel="x" yLabel="y" grid />
        {bases.map(({ b, c }) => (
          <g key={b}>
            <Curve P={PE} f={(s) => b ** s} a={-2} b={2.3} color={c} width={3.5} />
            <Html x={1290} y={PE.y(b ** 2.2)} size={20} anchor="left" color={c}>
              <Tex tex={`${b === Math.E ? 'e' : b}^x:\\ \\tfrac{\\text{pendiente}}{\\text{altura}}=${nt(Math.log(b), 3)}`} />
            </Html>
          </g>
        ))}
        {answer !== null && <Tangent P={PE} f={Math.exp} a={0} m={1} half={1.5} color={C.amber} />}
      </Stage>
    );
  }
  if (beat === 2) {
    const m = -0.3 * (T(t) - 25);
    return (
      <Stage ref={svg}>
        <Axes P={PT} xTicks={[0, 2, 4, 6, 8, 10, 12]} yTicks={[30, 40, 50, 60, 70, 80, 90]} xLabel="t\ (\text{min})" yLabel="T\ (^\circ\text{C})" grid />
        <Line a={PT.pt(0, 25)} b={PT.pt(12, 25)} color={C.green} dashed />
        <Html x={PT.x(12) + 12} y={PT.y(25)} size={18} anchor="left" color={C.green}>
          <span className="prop-tag">aire 25 °C</span>
        </Html>
        <Curve P={PT} f={T} a={0} b={12} color={C.cyan} width={4} />
        <Line a={PT.pt(t, 25)} b={PT.pt(t, T(t))} color={C.magenta} width={3} />
        <Html x={PT.x(t) + 12} y={PT.y((T(t) + 25) / 2)} size={18} anchor="left" color={C.magenta}>
          <Tex tex={`T-25=${nt(T(t) - 25, 1)}`} />
        </Html>
        <Tangent P={PT} f={T} a={t} m={m} half={2} color={C.amber} />
        <Html x={1290} y={200} size={22} anchor="left" color={C.amber}>
          <Tex tex={`T'=${nt(m, 2)}\\ \\tfrac{^\\circ\\text{C}}{\\text{min}}`} />
        </Html>
        <Html x={1290} y={250} size={18} anchor="left" color={C.muted}>
          <Tex tex={`=-0{,}3\\cdot${nt(T(t) - 25, 1)}`} />
        </Html>
        <rect x={PT.x(0) - 10} y={PT.y(20)} width={PT.box.w + 20} height={70} fill="transparent" onPointerDown={onT} />
        <Knob x={PT.x(t)} y={PT.y(20) + 32} onPointerDown={onT} cursor="ew-resize" label={dec(t, 1)} />
      </Stage>
    );
  }
  const PL = plane([0, 8], [-2, 3], { x: 300, y: 120, w: 960, h: 540 });
  return (
    <Stage>
      <Axes P={PL} xTicks={[1, 2, 3, 4, 5, 6, 7, 8]} yTicks={[-2, -1, 1, 2, 3]} xLabel="x" yLabel="y" grid />
      <Curve P={PL} f={Math.log} a={0.14} b={8} color={C.cyan} width={4} />
      {answer !== null && (
        <>
          <Tangent P={PL} f={Math.log} a={4} m={0.25} half={3} color={C.amber} />
          <Tangent P={PL} f={Math.log} a={1} m={1} half={1.5} color={C.green} />
          <Html x={PL.x(4)} y={PL.y(Math.log(4)) - 34} size={20} color={C.amber}>
            <Tex tex="\tfrac14" />
          </Html>
          <Html x={PL.x(1) + 20} y={PL.y(0) + 30} size={20} anchor="left" color={C.green}>
            <Tex tex="1" />
          </Html>
        </>
      )}
      <Formula x={1340} y={220} size={26} tex="y=\ln x" />
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Tower({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const A = pick(r, [10, 20, 50, 100]);
    const k = pick(r, [0.1, 0.2, -0.3, -0.5]);
    const t0 = pick(r, [0, 1, 2, 5]);
    const Tn = randInt(r, 50, 90);
    const Ta = pick(r, [15, 20, 25]);
    const kc = pick(r, [0.05, 0.1, 0.2]);
    const lnKind = r() < 0.5 ? 'a' : 'b';
    const a = pick(r, [2, 3, 5, 10]);
    const c = pick(r, [1, 4, 9]);
    const x0 = randInt(r, 1, 4);
    return { A, k, t0, Tn, Ta, kc, lnKind, a, c, x0 };
  }, [seed]);
  const g = data;
  const [val, setVal] = useState('');
  const expTex = `${g.A}\\,e^{${nt(g.k, 1)}t}`;
  const kM = g.k < 0 ? `(${nt(g.k, 1)})` : nt(g.k, 1);
  const lnTex = g.lnKind === 'a' ? `${g.a}\\ln x` : `\\ln\\left(x^2+${g.c}\\right)`;

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Caudal de vapor de la torre: $Q(t)=${expTex}$. ¿Cuánto vale $Q'(${g.t0})$? (Dos decimales.)`, `\\frac{d}{dt}e^{kt}=k\\,e^{kt}`);
      api.hints(['La exponencial se deriva a sí misma; la cadena agrega el factor $k$.', `$Q'(t)=${g.A}\\cdot${kM}\\,e^{${nt(g.k, 1)}t}$.`]);
    } else if (round === 1) {
      api.prompt(`El agua de la torre está a ${g.Tn} °C y el aire a ${g.Ta} °C. Con $k=${nt(g.kc, 2)}$ por minuto, ¿a qué ritmo cambia su temperatura, en °C/min?`, "T'=-k\\,(T-T_a)");
      api.hints(['El ritmo es proporcional a la diferencia con el aire.', 'Se está enfriando: el ritmo debe ser negativo.']);
    } else {
      api.prompt(`Sensor de presión logarítmico. ¿Cuánto vale $f'(${g.x0})$? (Dos decimales.)`, `f(x)=${lnTex}`);
      api.hints(['$(\\ln x)\'=\\tfrac1x$.', g.lnKind === 'a' ? 'La constante multiplica a la derivada.' : 'Cadena: $(\\ln u)\'=\\tfrac{u\'}{u}$ con $u=x^2+c$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = g.A * g.k * Math.exp(g.k * g.t0);
      if (Math.abs(v - t) < 0.01 + Math.abs(t) * 0.002) return api.result(true, `$Q'(${g.t0})=${g.A}\\cdot${kM}\\cdot e^{${nt(g.k * g.t0, 1)}}\\approx${nt(t, 2)}$.`);
      if (Math.abs(v - g.A * Math.exp(g.k * g.t0)) < 0.02) return api.result(false, 'Ese es $Q$, no $Q\'$. Falta el factor $k$ que sale de la regla de la cadena.');
      return api.result(false, `$Q'(t)=${g.A}\\cdot${kM}\\,e^{${nt(g.k, 1)}t}$; reemplaza $t=${g.t0}$.`);
    }
    if (round === 1) {
      const t = -g.kc * (g.Tn - g.Ta);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$-${nt(g.kc, 2)}\\cdot(${g.Tn}-${g.Ta})=${nt(t, 2)}$ °C/min.`);
      if (Math.abs(v + t) < 0.01) return api.result(false, 'El valor es correcto pero el signo no: el agua se enfría, la temperatura baja.');
      return api.result(false, `Diferencia con el aire: ${g.Tn - g.Ta} °C. Multiplica por $-k$.`);
    }
    const t = g.lnKind === 'a' ? g.a / g.x0 : (2 * g.x0) / (g.x0 * g.x0 + g.c);
    if (Math.abs(v - t) < 0.006) return api.result(true, `$f'(${g.x0})=${g.lnKind === 'a' ? `\\tfrac{${g.a}}{${g.x0}}` : `\\tfrac{2\\cdot${g.x0}}{${g.x0 * g.x0 + g.c}}`}\\approx${nt(t, 3)}$.`);
    if (g.lnKind === 'b' && Math.abs(v - 1 / (g.x0 * g.x0 + g.c)) < 0.006) return api.result(false, 'Falta multiplicar por la derivada de adentro, $2x$.');
    return api.result(false, g.lnKind === 'a' ? `$(${g.a}\\ln x)'=\\tfrac{${g.a}}{x}$.` : '$(\\ln u)\'=\\tfrac{u\'}{u}$ con $u=x^2+c$.');
  };

  return (
    <Stage>
      <Formula y={300} size={42} tex={round === 0 ? `Q(t)=${expTex}` : round === 1 ? `T=${g.Tn},\\quad T_a=${g.Ta},\\quad k=${nt(g.kc, 2)}` : `f(x)=${lnTex}`} />
      <NumberField x={560} y={520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? "Q'(t₀) =" : round === 1 ? "T' =" : "f'(x₀) ="} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c7',
  world: 'differential',
  code: '2.7',
  title: 'Enfriamiento',
  subtitle: 'Derivadas de exp y log',
  glyph: 'e^x',
  kind: 'level',
  guide: 'nadia',
  teaser: 'El agua de la torre de enfriamiento sale más caliente que de costumbre, y se enfría primero rápido y después despacio.',
  learn: "$e^x$ como la función cuya pendiente es su altura, derivada de $b^x$, ley de enfriamiento $T'=-k(T-T_a)$ y derivada del logaritmo.",
  glyphs: ['exp-der', 'ln-der'],
  pitfalls: ["$(e^{kt})'=k\\,e^{kt}$: no olvidar el factor $k$.", "$(2^x)'\\ne x\\,2^{x-1}$: la regla de la potencia no sirve si la variable está en el exponente.", "$(\\ln x)'=\\tfrac1x$ solo para $x>0$."],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nar', text: 'Torre de enfriamiento, mediodía. El vapor empañaba los lentes de Teo, que los limpiaba con la manga cada pocos minutos.' },
        { who: 'nadia', text: 'El agua sale más caliente que de costumbre. Quiero revisar cómo se enfría antes de culpar al circuito.' },
        { who: 'teo', text: 'Tengo las temperaturas desde que salió: baja rápido al principio y después más despacio.' },
        { who: 'iris', text: 'Y mientras tanto, algo en el subsuelo la sigue calentando.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La torre',
      Scene: ExpDemo,
      beats: [
        {
          say: 'La curva $y=e^x$. En cada punto, compara la altura (celeste) con la pendiente (avanzar 1 y ver cuánto sube).',
          gate: 'Recorre la curva hasta x = 1,3.',
          note: { label: 'Derivada de eˣ', tex: "\\left(e^x\\right)'=e^x", body: 'En cada punto, la pendiente es igual a la altura.' },
        },
        {
          say: 'Con otras bases, la pendiente también es proporcional a la altura, pero con otro factor.',
          ask: {
            prompt: '¿Para qué base la pendiente es exactamente igual a la altura?',
            options: ['e ≈ 2,718', '2', '3'],
            answer: 0,
            explain: 'Para $2^x$ el factor es $\\ln2\\approx0{,}69$; para $3^x$, $\\ln3\\approx1{,}10$. El único con factor 1 es $e$.',
          },
          note: { label: 'Otras bases', tex: "\\left(b^x\\right)'=\\ln b\\cdot b^x" },
        },
        {
          say: 'El agua de la torre se enfría hacia los 25 °C del aire. La pendiente siempre es proporcional a lo que le falta.',
          gate: 'Arrastra el tiempo hasta pasar los 8 minutos.',
          note: { label: 'Ley de enfriamiento', tex: "T'=-k\\,(T-T_a)", body: 'Su solución es $T=T_a+(T_0-T_a)\\,e^{-kt}$: la cadena da $(e^{-kt})\'=-k\\,e^{-kt}$.' },
        },
        {
          say: 'El logaritmo es la inversa de la exponencial: su gráfica es el reflejo de $e^x$.',
          ask: {
            prompt: '¿Cuál es la pendiente de $\\ln x$ en $x=4$?',
            options: ['1/4', '4', 'ln 4'],
            answer: 0,
            explain: 'Al reflejar, las pendientes se invierten: en $x$ la pendiente es $\\tfrac1x$. En $x=1$ vale 1; en $x=4$, $\\tfrac14$.',
          },
          note: { label: 'Derivada de ln x', tex: "\\left(\\ln x\\right)'=\\frac1x,\\qquad \\left(\\ln u\\right)'=\\frac{u'}{u}" },
        },
      ],
    },
    { kind: 'challenge', title: 'La torre', Comp: Tower, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'teo', text: 'El agua parte en 85 °C y se enfría hacia los 25 °C del aire. Al comienzo baja 18 °C por minuto, según el modelo.' },
        { who: 'nadia', text: 'Ese calor coincide con la carga oculta. Y el transformador está ajustado para entregar lo máximo.' },
        { who: 'iris', text: '¿Por descuido?' },
        { who: 'nadia', text: 'Quien eligió ese ajuste conocía el equipo, al menos hasta dónde se le puede exigir.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'exp-der', world: 'differential', tex: "(e^x)'=e^x", name: 'Derivada de la exponencial', read: 'derivada de e a la x', meaning: 'La función $e^x$ tiene pendiente igual a su altura en cada punto.' },
  { id: 'ln-der', world: 'differential', tex: "(\\ln x)'=\\frac1x", name: 'Derivada del logaritmo', read: 'derivada de ele ene', meaning: 'La pendiente de $\\ln x$ en $x$ es $1/x$.' },
];
