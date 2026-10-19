import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, hhmm, parseNum } from '../shared/ui';
import { AreaUnder, integrate } from './kit';

// ============================================================================
// CASO 3.4 · «El acumulador» — teorema fundamental del cálculo (parte 1)
// A(x)=∫_a^x f(t)dt es una función: el área acumulada hasta x. Agregar una franja de ancho dx
// suma f(x)·dx, así que A'(x)=f(x). A crece donde f>0 y tiene su máximo donde f pasa de + a −.
// ============================================================================

const f = (t: number) => 1.8 * Math.sin((t * Math.PI) / 4);
const TOP = plane([0, 8], [-2.2, 2.2], { x: 320, y: 70, w: 860, h: 330 });
const BOT = plane([0, 8], [-1, 5.5], { x: 320, y: 470, w: 860, h: 300 });

// ---------------------------------------------------------------- lesson
function AccLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(0.5);
  const [reach, setReach] = useState(0.5);
  const onX = useSvgDrag(svg, (px) => {
    const v = Math.round(clamp(TOP.inv(px, 0)[0], 0.05, 8) * 20) / 20;
    setX(v);
    setReach((r) => Math.max(r, v));
    if (v >= 7.9) unlock();
  });
  const A = (s: number) => integrate(f, 0, s, 80);

  if (beat === 0 || beat === 2) {
    const xx = beat === 0 ? x : 8;
    return (
      <Stage ref={svg}>
        <Axes P={TOP} xTicks={[0, 2, 4, 6, 8]} yTicks={[-2, 2]} xLabel="t" yLabel="f" grid />
        <AreaUnder P={TOP} f={f} a={0} b={xx} pos={C.green} neg={C.red} opacity={0.4} />
        <Curve P={TOP} f={f} a={0} b={8} color={C.cyan} width={3.5} />
        <Line a={TOP.pt(xx, -2.2)} b={TOP.pt(xx, 2.2)} color={C.text} dashed width={2} />
        <Axes P={BOT} xTicks={[0, 2, 4, 6, 8]} yTicks={[2, 4]} xLabel="x" yLabel="A" grid />
        <Curve P={BOT} f={A} a={0} b={beat === 0 ? Math.max(0.06, reach) : 8} color={C.amber} width={4} />
        <Dot x={BOT.x(xx)} y={BOT.y(A(xx))} r={9} color={C.amber} />
        {beat === 0 && <Knob x={TOP.x(x)} y={TOP.y(-2.2) + 22} onPointerDown={onX} cursor="ew-resize" label="x" />}
        {beat === 2 && answer !== null && (
          <>
            <Dot x={BOT.x(4)} y={BOT.y(A(4))} r={12} color={C.green} />
            <Cap x={BOT.x(4)} y={BOT.y(A(4)) - 30} size={18} color={C.green}>
              máximo: f pasa de + a −
            </Cap>
          </>
        )}
        <Cap x={1330} y={BOT.y(A(xx))} size={20} color={C.amber} anchor="left" tex={`A(${dec(xx, 2).replace(',', '{,}')})=${dec(A(xx), 2).replace(',', '{,}')}`} />
      </Stage>
    );
  }
  if (beat === 1) {
    const x0 = 1.6;
    const dx = 0.6 * (1 - at(1)) + 0.08;
    const Z = plane([0, 3], [0, 2.2], { x: 360, y: 120, w: 820, h: 520 });
    return (
      <Stage>
        <Axes P={Z} xTicks={[1, 2, 3]} yTicks={[1, 2]} xLabel="t" yLabel="f" grid />
        <AreaUnder P={Z} f={f} a={0} b={x0} pos={C.green} opacity={0.3} />
        <rect x={Z.x(x0)} y={Z.y(f(x0))} width={Z.x(x0 + dx) - Z.x(x0)} height={Z.y(0) - Z.y(f(x0))} fill={C.amber} opacity={0.7} />
        <Curve P={Z} f={f} a={0} b={3} color={C.cyan} width={3.5} />
        <Cap x={Z.x(x0 + dx / 2)} y={Z.y(0) + 30} size={20} color={C.amber} tex="dx" />
        <Cap x={Z.x(x0) - 14} y={Z.y(f(x0) / 2)} size={20} color={C.amber} anchor="right" tex="f(x)" />
        <Cap x={1330} y={240} size={26} color={C.text} tex="dA\approx f(x)\,dx" />
      </Stage>
    );
  }
  // beat 3: f(t)=2t → A(x)=x²
  const k = at(3);
  const X = 2.4 * k + 0.2;
  const L = plane([0, 3], [0, 6.5], { x: 360, y: 120, w: 760, h: 520 });
  return (
    <Stage>
      <Axes P={L} xTicks={[1, 2, 3]} yTicks={[2, 4, 6]} xLabel="t" yLabel="" grid />
      <AreaUnder P={L} f={(t) => 2 * t} a={0} b={X} pos={C.violet} opacity={0.4} />
      <Curve P={L} f={(t) => 2 * t} a={0} b={3} color={C.cyan} width={3.5} />
      <Curve P={L} f={(t) => t * t} a={0} b={2.55} color={C.amber} width={3.5} />
      <Cap x={L.x(2.9)} y={L.y(6.2)} size={20} color={C.cyan} tex="f=2t" />
      <Cap x={L.x(2.4)} y={L.y(6.4)} size={20} color={C.amber} tex="A=x^2" anchor="right" />
      <Cap x={1330} y={260} size={24} color={C.text} tex={`\\tfrac12\\cdot${dec(X, 1).replace(',', '{,}')}\\cdot${dec(2 * X, 1).replace(',', '{,}')}=${dec(X * X, 2).replace(',', '{,}')}`} />
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'El teorema fundamental (I)',
  Scene: AccLesson,
  beats: [
    {
      say: 'Fija el comienzo en 0 y deja libre el final $x$. El área acumulada hasta $x$ es una **función** de $x$: la función de acumulación $A(x)$. Abajo se dibuja mientras avanzas.',
      gate: 'Arrastra x hasta el final.',
      board: { label: 'Función de acumulación', tex: 'A(x)=\\int_{\\p{1}{0}}^{\\p{2}{\\cA{x}}}\\p{3}{f(t)}\\,dt', body: 'La variable de integración se llama $t$ para no confundirla con el límite $x$.', parts: ['inicio de la acumulación', 'final que se mueve', 'ritmo que se acumula'] },
    },
    {
      say: 'Si $x$ avanza un poquito $dx$, el área crece en una franja de alto $f(x)$ y ancho $dx$. Por eso el ritmo al que crece $A$ es exactamente $f(x)$.',
      dur: 3.6,
      board: [
        { tex: 'dA\\approx\\p{1}{f(x)}\\,\\p{2}{dx}', parts: ['altura de la franja', 'ancho de la franja'] },
        { label: 'Teorema fundamental (I)', tex: "\\p{1}{A'(x)}=\\p{2}{f(x)}", body: 'Derivar la acumulación devuelve el ritmo. Integrar y derivar son operaciones inversas.', parts: ['ritmo de la acumulación', 'ritmo de entrada'] },
      ],
    },
    {
      say: 'Consecuencia: $A$ crece donde $f$ es positiva y decrece donde es negativa. Su máximo está donde $f$ pasa de positiva a negativa.',
      ask: {
        prompt: 'En $[0,8]$, ¿dónde alcanza $A$ su valor máximo?',
        options: ['En x = 4, donde f cruza de + a −', 'En x = 2, donde f es máxima', 'En x = 8, al final'],
        answer: 0,
        explain: 'Mientras $f>0$ el área sigue sumando. En $x=4$, $f$ se vuelve negativa y el área empieza a restar: ahí $A$ es máxima. Como $A\'=f$, es un punto crítico.',
      },
      board: { label: 'Signo y crecimiento', tex: "f>0\\Rightarrow A\\uparrow,\\qquad f<0\\Rightarrow A\\downarrow" },
    },
    {
      say: 'Un ejemplo que se puede calcular a mano: si $f(t)=2t$, el área hasta $x$ es un triángulo de base $x$ y altura $2x$.',
      dur: 3.2,
      board: [
        { tex: 'A(x)=\\tfrac12\\cdot\\p{1}{x}\\cdot\\p{2}{2x}=\\p{3}{x^2}', parts: ['base del triángulo', 'altura del triángulo', 'área acumulada'] },
        { tex: "A'(x)=2x=f(x)\\ \\checkmark" },
      ],
    },
  ],
};

// ---------------------------------------------------------------- demo
const rnight = (t: number) => 2.2 * Math.cos(((t - 18) * Math.PI) / 12) - 0.4;
const PD = plane([12, 36], [-3, 3], { x: 320, y: 70, w: 860, h: 330 });
const PV = plane([12, 36], [-12, 22], { x: 320, y: 470, w: 860, h: 300 });

function LakeDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const V = (s: number) => integrate(rnight, 12, s, 60);
  const peak = 18 + 12 * (Math.acos(0.4 / 2.2) / Math.PI);
  return (
    <Stage>
      <Axes P={PD} xTicks={[12, 18, 24, 30, 36]} yTicks={[-2, 2]} xLabel="\text{hora}" yLabel="r" grid tickLabels={false} />
      {[12, 18, 24, 30, 36].map((h) => (
        <Cap key={h} x={PD.x(h)} y={PD.y(-3) + 22} size={14} color={C.dim}>
          {hhmm(h % 24)}
        </Cap>
      ))}
      <AreaUnder P={PD} f={rnight} a={12} b={36} pos={C.green} neg={C.red} opacity={0.35} />
      <Curve P={PD} f={rnight} a={12} b={36} color={C.cyan} width={3.5} />
      <Axes P={PV} xTicks={[12, 18, 24, 30, 36]} yTicks={[-10, 10, 20]} xLabel="" yLabel="V" grid tickLabels={false} />
      <Curve P={PV} f={V} a={12} b={36} color={C.amber} width={4} />
      {(beat >= 1 || answer !== null) && (
        <Group opacity={1}>
          <Dot x={PV.x(peak)} y={PV.y(V(peak))} r={11} color={C.green} />
          <Line a={PD.pt(peak, -3)} b={PV.pt(peak, V(peak))} color={C.green} dashed width={2} />
          <Cap x={PV.x(peak) + 16} y={PV.y(V(peak)) - 24} size={18} color={C.green} anchor="left">
            {hhmm(peak % 24)}
          </Cap>
        </Group>
      )}
      {beat === 1 && (
        <>
          <Dot x={PD.x(27)} y={PD.y(rnight(27))} r={9} color={C.amber} />
          <Cap x={PD.x(27) + 14} y={PD.y(rnight(27)) + 26} size={18} color={C.amber} anchor="left" tex={`r(03{:}00)=${dec(rnight(27), 2).replace(',', '{,}')}`} />
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Accumulator({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const z = pick(r, [2, 3, 4, 5]);
    const amp = pick(r, [1.5, 2]);
    const a = pick(r, [1, 2, 3]);
    const b = randInt(r, 0, 4);
    const x0 = randInt(r, 1, 4);
    const h = pick(r, [2, 3, 4]);
    const w = pick(r, [2, 4]);
    const x2 = w + pick(r, [1, 2]);
    return { z, amp, a, b, x0, h, w, x2 };
  }, [seed]);
  const d = data;
  const g = (t: number) => d.amp * Math.sin(((t - (d.z - 2)) * Math.PI) / 4);
  const [tm, setTm] = useState(1);
  const Q = plane([0, 8], [-2.5, 2.5], { x: 320, y: 120, w: 860, h: 520 });
  const onTm = useSvgDrag(svg, (x) => setTm(Math.round(clamp(Q.inv(x, 0)[0], 0, 8) * 4) / 4));
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt('Este es el ritmo neto $f$. Mueve el marcador al instante en que la acumulación $A(x)=\\int_0^x f$ es **máxima**.', "A'(x)=f(x)");
      api.hints(['$A$ crece mientras $f>0$.', 'El máximo está donde $f$ pasa de positiva a negativa.']);
    } else if (round === 1) {
      api.prompt(`Sin calcular ninguna integral: ¿cuánto vale $A'(${d.x0})$?`, `A(x)=\\int_1^{x}\\left(${d.a}t^2+${d.b}\\right)dt`);
      api.hints(['Teorema fundamental: la derivada de la acumulación es el integrando.', `Evalúa $${d.a}t^2+${d.b}$ en $t=${d.x0}$.`]);
    } else {
      api.prompt(`Ritmo: sube en línea recta de 0 a ${d.h} en ${d.w} h y después se queda en ${d.h}. ¿Cuánto vale $A(${d.x2})=\\int_0^{${d.x2}}f$?`, 'A(x)=\\int_0^x f(t)\\,dt');
      api.hints(['La primera parte es un triángulo; la segunda, un rectángulo.', `Triángulo: $\\tfrac12\\cdot${d.w}\\cdot${d.h}$. Rectángulo: ${d.h} de alto y ${d.x2 - d.w} de ancho.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      // A max where g crosses + to - inside [0,8]
      let best = 0;
      let bestV = -Infinity;
      for (let t = 0; t <= 8.0001; t += 0.05) {
        const v = integrate(g, 0, t, 60);
        if (v > bestV) {
          bestV = v;
          best = t;
        }
      }
      if (Math.abs(tm - best) <= 0.3) return api.result(true, `En $x\\approx${dec(best, 2).replace(',', '{,}')}$ el ritmo pasa de positivo a negativo: ahí la acumulación es máxima.`);
      return api.result(false, `En $x=${dec(tm, 2).replace(',', '{,}')}$, $f=${dec(g(tm), 2).replace(',', '{,}')}$: ${g(tm) > 0 ? 'todavía suma, la acumulación sigue creciendo' : 'ya resta: el máximo quedó antes'}.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 1) {
      const t = d.a * d.x0 * d.x0 + d.b;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$A'(${d.x0})=${d.a}\\cdot${d.x0}^2+${d.b}=${t}$. No hizo falta integrar.`);
      return api.result(false, `Por el teorema fundamental, $A'(x)$ es el integrando evaluado en $x$: $${d.a}\\cdot${d.x0}^2+${d.b}$.`);
    }
    const t = (d.w * d.h) / 2 + d.h * (d.x2 - d.w);
    if (Math.abs(v - t) < 0.01) return api.result(true, `$\\tfrac12\\cdot${d.w}\\cdot${d.h}+${d.h}\\cdot${d.x2 - d.w}=${dec(t)}$.`);
    return api.result(false, `Triángulo ${dec((d.w * d.h) / 2)} más rectángulo ${d.h * (d.x2 - d.w)}.`);
  };

  if (round === 0)
    return (
      <Stage ref={svg}>
        <Axes P={Q} xTicks={[0, 2, 4, 6, 8]} yTicks={[-2, 2]} xLabel="x" yLabel="f" grid />
        <AreaUnder P={Q} f={g} a={0} b={8} pos={C.green} neg={C.red} opacity={0.3} />
        <Curve P={Q} f={g} a={0} b={8} color={C.cyan} width={4} />
        <Line a={Q.pt(tm, -2.5)} b={Q.pt(tm, 2.5)} color={C.text} dashed />
        <rect x={Q.x(0) - 10} y={Q.y(-2.5)} width={Q.box.w + 20} height={60} fill="transparent" onPointerDown={onTm} />
        <Knob x={Q.x(tm)} y={Q.y(-2.5) + 30} onPointerDown={onTm} cursor="ew-resize" label={dec(tm, 2)} />
        <Confirm onClick={submit} />
      </Stage>
    );
  if (round === 2) {
    const fr = (t: number) => (t < d.w ? (d.h * t) / d.w : d.h);
    const R = plane([0, 7], [0, 5], { x: 320, y: 120, w: 860, h: 520 });
    return (
      <Stage>
        <Axes P={R} xTicks={[0, 1, 2, 3, 4, 5, 6, 7]} yTicks={[1, 2, 3, 4, 5]} xLabel="t" yLabel="f" grid />
        <AreaUnder P={R} f={fr} a={0} b={d.x2} pos={C.violet} opacity={0.4} />
        <Curve P={R} f={fr} a={0} b={7} color={C.cyan} width={4} />
        <Line a={R.pt(d.x2, 0)} b={R.pt(d.x2, 5)} color={C.text} dashed />
        <NumberField x={1250} y={420} value={val} onChange={setVal} onEnter={submit} label="A =" width={4} />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={300} size={40} color={C.text} tex={`A(x)=\\int_1^{x}\\left(${d.a}t^2+${d.b}\\right)dt`} />
      <NumberField x={560} y={500} value={val} onChange={setVal} onEnter={submit} label={`A'(${d.x0}) =`} width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c4',
  world: 'integral',
  code: '3.4',
  title: 'El acumulador',
  subtitle: 'Teorema fundamental (I)',
  glyph: "A'=f",
  kind: 'level',
  guide: 'teo',
  teaser: 'El balance del día no dice a qué hora el lago empezó a bajar. El volumen, hora por hora, sí.',
  learn: 'Función de acumulación $A(x)=\\int_a^x f$, por qué $A\'=f$ (teorema fundamental, parte 1), crecimiento y máximos de $A$ según el signo de $f$.',
  glyphs: ['accum', 'ftc1'],
  pitfalls: ['En $\\int_a^x f(t)\\,dt$ la variable de integración es $t$; $x$ es el límite.', 'El máximo de $A$ no está donde $f$ es máxima, sino donde $f$ cambia de signo.', "$A'(x)=f(x)$ evalúa el integrando en el límite superior."],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'nar', text: 'Caseta de Peñuelas, una de la tarde. La pantalla mostraba el plano del lago, y Marta tenía al lado un termo que no había abierto.' },
        { who: 'teo', text: 'Quiero reconstruir cuánta agua había a cada hora desde el mediodía. El balance total no dice cuándo empezó la pérdida.' },
        { who: 'marta', text: 'Tengo el ritmo neto de ese período. Mientras entra más de lo que sale, el volumen sigue subiendo.' },
        { who: 'iris', text: 'Busca el cambio. Esa hora puede decirnos cuándo empezaron a sacar ventaja.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El volumen hora a hora',
      Scene: LakeDemo,
      beats: [
        {
          say: 'Arriba, el ritmo neto desde el mediodía hasta el mediodía siguiente. Abajo, el volumen acumulado.',
          ask: {
            prompt: '¿A qué hora estuvo más lleno el lago?',
            options: ['Cuando el ritmo neto pasó de positivo a negativo', 'Cuando el ritmo neto fue máximo', 'A medianoche'],
            answer: 0,
            explain: 'Mientras entra más de lo que sale, el volumen sube. Cuando el balance se vuelve negativo, empieza a bajar: ahí está el máximo, poco después de las 23:00.',
          },
          note: { label: 'Máximo del volumen', body: 'En el instante en que el ritmo neto cruza de + a −.' },
        },
        {
          say: 'A las 03:00 la pendiente de la curva de volumen es el ritmo neto de ese instante.',
          dur: 1.8,
          note: { label: 'Pendiente del volumen', tex: "V'(t)=r(t)", body: 'Teorema fundamental: derivar lo acumulado devuelve el ritmo.' },
        },
      ],
    },
    { kind: 'challenge', title: 'El acumulador', Comp: Accumulator, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'teo', text: 'El lago está más lleno cerca de las 23:18, cuando empieza a salir más de lo que entra. A las 03:00 ya pierde unos 1,96 mil m³ por hora.' },
        { who: 'marta', text: 'Tengo el manual de la tubería 7. Describe el caudal con una fórmula, así que debería dar una cuenta completa de la noche.' },
        { who: 'iris', text: '¿Y coincide con el informe?' },
        { who: 'marta', text: 'Prefiero calcularlo antes de contestarte. El manual todavía tiene sus páginas originales; el informe tiene dos hojas corregidas a mano.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'accum', world: 'integral', tex: 'A(x)=\\int_a^x f(t)\\,dt', name: 'Función de acumulación', read: 'a de equis', meaning: 'El área acumulada desde $a$ hasta $x$, vista como función del límite $x$.' },
  { id: 'ftc1', world: 'integral', tex: "\\frac{d}{dx}\\int_a^x f(t)\\,dt=f(x)", name: 'Teorema fundamental (I)', read: 'teorema fundamental del cálculo', meaning: 'La derivada de la acumulación es el integrando: integrar y derivar se deshacen.' },
];
