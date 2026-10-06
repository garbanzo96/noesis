import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum, thousands } from '../shared/ui';
import { Formula } from '../w05/kit';
import { nt } from './kit';

// ============================================================================
// CASO 2.5 · «Voltaje por corriente» — producto y cociente
// Potencia P = V·I como área de un rectángulo cuyos lados crecen: dP = V dI + I dV + dV dI.
// (fg)' = f'g + fg', no f'g'. Resistencia R = V/I: regla del cociente.
// ============================================================================

const V0 = 400;
const I0 = 30;
const dVdt = 100;
const dIdt = 10;

// ---------------------------------------------------------------- demo
function ProductDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [dt, setDt] = useState(1);
  const onDt = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 400) / 700, 0.02, 1) * 100) / 100;
    setDt(v);
    if (v <= 0.05) unlock();
  });

  if (beat <= 1) {
    const sx = 1.4; // px per volt
    const sy = 13; // px per ampere
    const X0 = 220;
    const Y0 = 140;
    const dV = dVdt * dt;
    const dI = dIdt * dt;
    const dP = V0 * dI + I0 * dV + dV * dI;
    return (
      <Stage ref={svg}>
        <rect x={X0} y={Y0} width={V0 * sx} height={I0 * sy} fill={C.cyan} opacity={0.28} stroke={C.cyan} strokeWidth={3} />
        <rect x={X0 + V0 * sx} y={Y0} width={dV * sx} height={I0 * sy} fill={C.amber} opacity={0.55} />
        <rect x={X0} y={Y0 + I0 * sy} width={V0 * sx} height={dI * sy} fill={C.magenta} opacity={0.55} />
        <rect x={X0 + V0 * sx} y={Y0 + I0 * sy} width={dV * sx} height={dI * sy} fill={C.red} opacity={0.8} />
        <Html x={X0 + (V0 * sx) / 2} y={Y0 + (I0 * sy) / 2} size={30} color={C.text}>
          <Tex tex="P=V\cdot I" />
        </Html>
        <Html x={X0 + (V0 * sx) / 2} y={Y0 - 24} size={20} color={C.cyan}>
          <Tex tex="V=400\ \text{V}" />
        </Html>
        <Html x={X0 - 16} y={Y0 + (I0 * sy) / 2} size={20} anchor="right" color={C.cyan}>
          <Tex tex="I=30\ \text{A}" />
        </Html>
        <Html x={X0 + V0 * sx + (dV * sx) / 2} y={Y0 - 24} size={18} color={C.amber}>
          <Tex tex={`dV=${nt(dV, 1)}`} />
        </Html>
        <Html x={X0 - 16} y={Y0 + I0 * sy + (dI * sy) / 2} size={18} anchor="right" color={C.magenta}>
          <Tex tex={`dI=${nt(dI, 2)}`} />
        </Html>
        <Formula x={1270} y={230} size={22} tex="dP=I\,dV+V\,dI+dV\,dI" />
        <Formula x={1270} y={310} size={22} color={C.amber} tex={`\\tfrac{dP}{dt}\\approx${thousands(Math.round(dP / dt))}\\ \\tfrac{\\text{W}}{\\text{s}}`} />
        <Html x={1270} y={380} size={17} color={C.red}>
          <span>esquina roja: {dec(((dV * dI) / dP) * 100, 1)} % del aumento</span>
        </Html>
        <Html x={1270} y={430} size={17} color={C.muted}>
          <span>
            V sube 100 V/s · I sube 10 A/s · Δt = {dec(dt, 2)} s
          </span>
        </Html>
        {beat === 0 && (
          <>
            <line x1={400} x2={1100} y1={820} y2={820} stroke={C.line} strokeWidth={3} />
            <rect x={380} y={790} width={740} height={60} fill="transparent" onPointerDown={onDt} style={{ cursor: 'ew-resize' }} />
            <Knob x={400 + dt * 700} y={820} onPointerDown={onDt} cursor="ew-resize" label="Δt" />
          </>
        )}
        {beat === 1 && answer !== null && <Formula x={1270} y={520} size={22} color={C.green} tex="30\cdot100+400\cdot10=7000" />}
      </Stage>
    );
  }
  if (beat === 2)
    return (
      <Stage>
        <Formula y={200} size={34} tex="R=\dfrac{V}{I}" />
        <Formula y={330} size={30} tex="R'=\dfrac{V'\,I-V\,I'}{I^2}" />
        {answer !== null && <Formula y={480} size={28} color={C.amber} tex="\dfrac{100\cdot30-400\cdot10}{30^2}=\dfrac{-1000}{900}\approx-1{,}11\ \tfrac{\Omega}{\text{s}}" />}
        {answer !== null && <Formula y={600} size={22} color={C.muted} tex="\tfrac{V'}{V}=0{,}25<\tfrac{I'}{I}\approx0{,}33" />}
      </Stage>
    );
  return (
    <Stage>
      <Formula y={220} size={36} tex="h(x)=(x^2+1)(3x-2)" />
      {answer !== null && (
        <>
          <Formula y={360} size={28} tex="h'(x)=2x\,(3x-2)+(x^2+1)\cdot3" />
          <Formula y={460} size={28} color={C.amber} tex="h'(1)=2\cdot1+2\cdot3=8" />
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Transformer({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const V = pick(r, [200, 220, 380, 400]);
    const I = pick(r, [10, 20, 25, 40]);
    const Vp = pick(r, [-20, 10, 20, 50]);
    const Ip = pick(r, [-2, 1, 2, 5]);
    const a = randInt(r, 1, 3);
    const m = pick(r, [2, 3]);
    const b = randInt(r, -3, 4);
    const c = randInt(r, 1, 4);
    const d = randInt(r, -5, 5);
    const x0 = randInt(r, 1, 2);
    const p = randInt(r, 1, 5);
    const q = randInt(r, -4, 6);
    const s = randInt(r, 1, 3);
    const u = randInt(r, 1, 5);
    const x1 = randInt(r, 0, 3);
    return { V, I, Vp, Ip, a, m, b, c, d, x0, p, q, s, u, x1 };
  }, [seed]);
  const [val, setVal] = useState('');
  const g = data;
  const sgn = (v: number) => (v < 0 ? `-${Math.abs(v)}` : `+${v}`);
  const prodTex = `(${g.a === 1 ? '' : g.a}x^{${g.m}}${g.b ? sgn(g.b) : ''})(${g.c === 1 ? '' : g.c}x${g.d ? sgn(g.d) : ''})`;
  const quotTex = `\\dfrac{${g.p}x${g.q ? sgn(g.q) : ''}}{${g.s}x+${g.u}}`;

  useEffect(() => {
    if (round === 0) {
      api.prompt(`En el transformador nuevo: $V=${g.V}$ V cambiando a ${g.Vp} V/s, $I=${g.I}$ A cambiando a ${g.Ip} A/s. ¿A qué ritmo cambia la potencia $P=VI$, en W/s?`, "P'=V'\\,I+V\\,I'");
      api.hints(['Dos franjas: una por el cambio de $V$ y otra por el de $I$.', `$${g.Vp}\\cdot${g.I}+${g.V}\\cdot(${g.Ip})$.`]);
    } else if (round === 1) {
      api.prompt(`Modelo de pérdidas del transformador. ¿Cuánto vale $h'(${g.x0})$?`, `h(x)=${prodTex}`);
      api.hints(['Regla del producto: derivada del primero por el segundo, más el primero por la derivada del segundo.', `Primer factor en $x=${g.x0}$: ${g.a * g.x0 ** g.m + g.b}; su derivada: ${g.a * g.m * g.x0 ** (g.m - 1)}.`]);
    } else {
      api.prompt(`La eficiencia sigue un cociente. ¿Cuánto vale $f'(${g.x1})$? (Dos decimales.)`, `f(x)=${quotTex}`);
      api.hints(["$\\left(\\tfrac{u}{v}\\right)'=\\tfrac{u'v-uv'}{v^2}$.", `En $x=${g.x1}$: $u=${g.p * g.x1 + g.q}$, $u'=${g.p}$, $v=${g.s * g.x1 + g.u}$, $v'=${g.s}$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = g.Vp * g.I + g.V * g.Ip;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$${g.Vp}\\cdot${g.I}+${g.V}\\cdot(${g.Ip})=${t}$ W/s.`);
      if (Math.abs(v - g.Vp * g.Ip) < 0.5) return api.result(false, `Eso es $V'\\cdot I'$: solo la esquina. Faltan las dos franjas, $V'I$ y $VI'$.`);
      return api.result(false, `Franja de $V$: $${g.Vp}\\cdot${g.I}$. Franja de $I$: $${g.V}\\cdot(${g.Ip})$. Súmalas.`);
    }
    if (round === 1) {
      const u = g.a * g.x0 ** g.m + g.b;
      const up = g.a * g.m * g.x0 ** (g.m - 1);
      const w = g.c * g.x0 + g.d;
      const t = up * w + u * g.c;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$${up}\\cdot${w}+${u}\\cdot${g.c}=${t}$.`);
      if (Math.abs(v - up * g.c) < 0.01) return api.result(false, `${up * g.c} es el producto de las derivadas. La regla es $u'v+uv'$.`);
      return api.result(false, `$u'v+uv'=${up}\\cdot${w}+${u}\\cdot${g.c}$.`);
    }
    const u = g.p * g.x1 + g.q;
    const w = g.s * g.x1 + g.u;
    const t = (g.p * w - u * g.s) / (w * w);
    if (Math.abs(v - t) < 0.006) return api.result(true, `$\\frac{${g.p}\\cdot${w}-${u}\\cdot${g.s}}{${w}^2}\\approx${nt(t, 3)}$.`);
    if (Math.abs(v - (u * g.s - g.p * w) / (w * w)) < 0.006) return api.result(false, 'El orden del numerador importa: $u\'v-uv\'$, no al revés.');
    return api.result(false, `Numerador $u'v-uv'=${g.p}\\cdot${w}-${u}\\cdot${g.s}$; denominador $v^2=${w * w}$.`);
  };

  return (
    <Stage>
      {round === 0 ? (
        <>
          <Formula y={240} size={30} tex={`V=${g.V}\\ \\text{V},\\quad V'=${g.Vp}\\ \\tfrac{\\text{V}}{\\text{s}}`} />
          <Formula y={320} size={30} tex={`I=${g.I}\\ \\text{A},\\quad I'=${g.Ip}\\ \\tfrac{\\text{A}}{\\text{s}}`} />
        </>
      ) : (
        <Formula y={280} size={40} tex={round === 1 ? `h(x)=${prodTex}` : `f(x)=${quotTex}`} />
      )}
      <NumberField x={560} y={520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? "P' =" : round === 1 ? "h'(x₀) =" : "f'(x₀) ="} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c5',
  world: 'differential',
  code: '2.5',
  title: 'Voltaje por corriente',
  subtitle: 'Producto y cociente',
  glyph: "(fg)'",
  kind: 'level',
  guide: 'nadia',
  teaser: 'El transformador nuevo sube voltaje y corriente a la vez. La potencia es su producto: ¿a qué ritmo crece?',
  learn: "Regla del producto como un rectángulo que crece por dos lados, por qué $(fg)'\\ne f'g'$, y regla del cociente.",
  glyphs: ['prod-rule', 'quot-rule'],
  pitfalls: ["$(fg)'\\ne f'g'$: faltan las dos franjas.", "En el cociente el orden importa: $u'v-uv'$.", 'No olvidar el cuadrado del denominador.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'Transformador sin registro, alimentador 4. Voltaje y corriente subiendo al mismo tiempo.' },
        { who: 'teo', text: 'La potencia es voltaje por corriente. Si los dos cambian, ¿cómo cambia el producto?' },
      ],
    },
    {
      kind: 'demo',
      title: 'El rectángulo',
      Scene: ProductDemo,
      beats: [
        {
          say: 'La potencia es el área de un rectángulo de lados $V$ e $I$. En un instante, los dos lados crecen un poco.',
          gate: 'Achica Δt hasta 0,05 s.',
          note: { label: 'Regla del producto', tex: "(f\\,g)'=f'\\,g+f\\,g'", body: 'Dos franjas: $I\\,dV$ y $V\\,dI$. La esquina $dV\\,dI$ se vuelve despreciable.' },
        },
        {
          say: '$V=400$ V sube a 100 V/s; $I=30$ A sube a 10 A/s.',
          ask: {
            prompt: '¿A qué ritmo crece la potencia?',
            options: ['7 000 W/s', '1 000 W/s', '12 000 W/s'],
            answer: 0,
            explain: '$I\\,V\'+V\\,I\'=30\\cdot100+400\\cdot10=7000$. Multiplicar las derivadas, $100\\cdot10$, es solo la esquina.',
          },
          note: { label: 'El error típico', tex: "(f\\,g)'\\ne f'\\,g'" },
        },
        {
          say: 'La resistencia aparente es $R=V/I$. Para un cociente hay otra regla.',
          ask: {
            prompt: 'Con los mismos datos, ¿la resistencia sube o baja?',
            options: ['Baja: la corriente crece proporcionalmente más rápido', 'Sube: el voltaje crece más en voltios', 'No cambia'],
            answer: 0,
            explain: 'El voltaje crece un 25 % por segundo y la corriente un 33 %: el cociente baja. La regla da $R\'\\approx-1{,}11$ Ω/s.',
          },
          note: { label: 'Regla del cociente', tex: "\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^2}" },
        },
        {
          say: 'La regla del producto también sirve para fórmulas.',
          ask: {
            prompt: '¿Cuánto vale $h\'(1)$ para $h(x)=(x^2+1)(3x-2)$?',
            options: ['8', '6', '2'],
            answer: 0,
            explain: '$h\'=2x(3x-2)+(x^2+1)\\cdot3$. En $x=1$: $2\\cdot1+2\\cdot3=8$. El producto de las derivadas daría $2\\cdot3=6$.',
          },
          note: { label: 'Con fórmulas', tex: "h'=2x(3x-2)+3(x^2+1)" },
        },
      ],
    },
    { kind: 'challenge', title: 'El transformador', Comp: Transformer, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'El transformador alimenta algo en el subsuelo, bajo la turbina 3. Esa turbina gira más rápido de lo normal.' },
        { who: 'iris', text: 'Alguien cambió los engranajes. Vamos a ver.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'prod-rule', world: 'differential', tex: "(fg)'=f'g+fg'", name: 'Regla del producto', read: 'derivada de un producto', meaning: 'Cada factor cambia mientras el otro queda fijo; se suman los dos aportes.' },
  { id: 'quot-rule', world: 'differential', tex: "\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^2}", name: 'Regla del cociente', read: 'derivada de un cociente', meaning: 'Numerador: derivada de arriba por abajo menos arriba por derivada de abajo.' },
];
