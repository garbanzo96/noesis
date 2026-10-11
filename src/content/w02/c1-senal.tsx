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
import { Confirm, Knob, NumberField, dec, hhmm, parseNum } from '../shared/ui';
import { nt } from './kit';

// ============================================================================
// CASO 2.1 · «La señal» — límites y continuidad
// Acercarse a un instante sin tocarlo (dato perdido), límites laterales en un salto,
// continuidad, simplificar un 0/0, y el valor al que tiende una carga a la larga.
// ============================================================================

const P = plane([2, 4], [48, 52], { x: 300, y: 130, w: 1000, h: 520 });
const freq = (t: number) => 50 + 0.6 * (t - 3) * Math.cos(2.2 * (t - 3)) + 0.25 * Math.sin(5 * (t - 3));

/** Hollow point: a value that is missing or excluded. */
function Hole({ x, y, color = C.cyan }: { x: number; y: number; color?: string }) {
  return <circle cx={x} cy={y} r={9} fill={C.bg} stroke={color} strokeWidth={3} />;
}

// ---------------------------------------------------------------- lesson
// g agrees with x + 2 only away from the excluded point x = 2.
const signalExample = (x: number) => x + 2;
const SIGNAL_PL = plane([0, 4], [0, 7], { x: 300, y: 130, w: 820, h: 520 });

function SignalLesson({ beats, unlock, answer }: DemoProps) {
  const { beat, at } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(1);
  const reached = useRef({ l: false, r: false });
  const [sides, setSides] = useState(reached.current);
  const onX = useSvgDrag(svg, (px) => {
    if (beat !== 1) return;
    const v = Math.round(clamp(SIGNAL_PL.inv(px, 0)[0], 0.1, 3.9) * 1000) / 1000;
    setX(v);
    if (v !== 2 && v > 1.95 && v < 2.05) {
      reached.current = { l: reached.current.l || v < 2, r: reached.current.r || v > 2 };
      setSides(reached.current);
      if (reached.current.l && reached.current.r) unlock();
    }
  });

  if (beat === 2) {
    const J = plane([0, 2], [0, 4], { x: 300, y: 130, w: 820, h: 520 });
    return (
      <Stage>
        <Axes P={J} xTicks={[0, 1, 2]} yTicks={[1, 2, 3]} xLabel="x" yLabel="h(x)" grid />
        <Curve P={J} f={() => 1} a={0} b={1} color={C.cyan} />
        <Curve P={J} f={() => 3} a={1} b={2} color={C.magenta} />
        <Hole x={J.x(1)} y={J.y(1)} />
        <Dot x={J.x(1)} y={J.y(3)} color={C.magenta} />
        <Cap x={1330} y={210} tex="h(x)=\begin{cases}1&x<1\\3&x\ge1\end{cases}" size={22} />
        {answer !== null && <Cap x={1330} y={330} tex="1\ne3" color={C.amber} />}
      </Stage>
    );
  }
  if (beat === 5) {
    const I = plane([1, 16], [-0.5, 6], { x: 300, y: 130, w: 820, h: 520 });
    return (
      <Stage>
        <Axes P={I} xTicks={[1, 4, 8, 12, 16]} yTicks={[0, 1, 3, 5]} xLabel="x" yLabel="y" grid />
        {[0, 5].map((y) => <Line key={y} a={I.pt(1, y)} b={I.pt(16, y)} color={C.green} dashed />)}
        <Curve P={I} f={(v) => 1 / v} a={1} b={16} color={C.cyan} progress={at(5)} />
        <Curve P={I} f={(v) => 5 - 3 / v} a={1} b={16} color={C.amber} progress={at(5)} />
        <Cap x={1330} y={220} tex="\frac1x\to0" color={C.cyan} />
        <Cap x={1330} y={290} tex="5-\frac3x\to5" color={C.amber} />
      </Stage>
    );
  }
  return (
    <Stage ref={svg}>
      <Axes P={SIGNAL_PL} xTicks={[0, 1, 2, 3, 4]} yTicks={[2, 4, 6]} xLabel="x" yLabel={beat === 3 ? 'f(x)' : 'g(x)'} grid />
      <Curve P={SIGNAL_PL} f={signalExample} a={0} b={2} color={C.cyan} />
      <Curve P={SIGNAL_PL} f={signalExample} a={2} b={4} color={C.cyan} />
      {beat === 3 ? <Dot x={SIGNAL_PL.x(2)} y={SIGNAL_PL.y(4)} color={C.green} /> : <Hole x={SIGNAL_PL.x(2)} y={SIGNAL_PL.y(4)} />}
      <Cap x={1330} y={180} size={22} tex={beat === 3 ? 'f(x)=x+2' : 'g(x)=\\frac{x^2-4}{x-2}'} />
      {beat === 1 && (
        <>
          {x !== 2 && <Dot x={SIGNAL_PL.x(x)} y={SIGNAL_PL.y(signalExample(x))} color={C.amber} onPointerDown={onX} cursor="ew-resize" />}
          <Cap x={1330} y={260} size={20} color={C.amber} tex={x === 2 ? 'g(2)\\text{ no está definido}' : `x=${nt(x, 3)},\\quad g(x)=${nt(signalExample(x), 3)}`} />
          <Cap x={1330} y={350} size={18} color={sides.l ? C.green : C.muted}>{sides.l ? '✓' : '·'} desde la izquierda</Cap>
          <Cap x={1330} y={390} size={18} color={sides.r ? C.green : C.muted}>{sides.r ? '✓' : '·'} desde la derecha</Cap>
          <Cap x={1330} y={490} size={18} tex="1{,}9\mapsto3{,}9\\1{,}99\mapsto3{,}99\\2{,}01\mapsto4{,}01" />
          <line x1={SIGNAL_PL.x(0)} x2={SIGNAL_PL.x(4)} y1={720} y2={720} stroke={C.line} strokeWidth={3} />
          <Knob x={SIGNAL_PL.x(x)} y={720} onPointerDown={onX} cursor="ew-resize" label={`x=${dec(x, 3)}`} />
        </>
      )}
      {beat === 3 && <Cap x={1330} y={290} tex="f(2)=4=\lim_{x\to2}f(x)" color={C.green} size={20} />}
      {beat === 4 && answer !== null && <Cap x={1330} y={290} tex="g(x)=x+2\quad(x\ne2)" color={C.amber} size={20} />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Límites y continuidad',
  Scene: SignalLesson,
  beats: [
    {
      say: 'La gráfica de $g(x)=\\frac{x^2-4}{x-2}$ tiene un hueco en $x=2$. El límite pregunta a qué valor se acerca $g(x)$ al acercarse a 2, sin usar $g(2)$.',
      dur: 2.6,
      board: { label: 'Límite', tex: '\\lim_{x\\to\\p{1}{\\cC{a}}}f(x)=\\p{2}{\\cA{L}}', body: 'Aquí el límite es 4, aunque $g(2)$ no esté definido.' },
    },
    {
      say: 'Acércate al hueco desde cada lado y mira los valores. Ambos lados se acercan a 4.',
      gate: 'Arrastra x hasta quedar a menos de 0,05 de 2 por la izquierda y por la derecha.',
      board: { label: 'Límites laterales', tex: '\\lim_{x\\to a^-}f(x)=\\p{1}{L}=\\lim_{x\\to a^+}f(x)', body: 'El límite existe si ambos laterales existen y coinciden. $g(1{,}9)=3{,}9$, $g(1{,}99)=3{,}99$ y $g(2{,}01)=4{,}01$.' },
    },
    {
      say: 'Esta función salta en $x=1$. Mira la altura a la que llega desde cada lado.',
      ask: { prompt: '¿Existe $\\lim_{x\\to1}h(x)$?', options: ['No: por la izquierda da 1 y por la derecha 3', 'Sí, vale 3', 'Sí, vale 2'], answer: 0, explain: 'Los límites laterales son 1 y 3. Como son distintos, el límite no existe.' },
      board: { label: 'Un salto', tex: '\\lim_{x\\to1^-}h(x)=\\p{1}{1}\\ne\\p{2}{3}=\\lim_{x\\to1^+}h(x)' },
    },
    {
      say: 'Para ser continua en $a$, la función debe tener valor, tener límite y ambos deben ser iguales. Al llenar el hueco con 4, $f(x)=x+2$ es continua en 2.',
      dur: 2.6,
      board: { label: 'Continuidad', tex: '\\lim_{x\\to a}f(x)=\\p{1}{\\cG{f(a)}}', body: 'Tres condiciones: existe $f(a)$, existe el límite y coinciden.' },
    },
    {
      say: 'Reemplazar $x=2$ en la fracción da $0/0$. Factoriza y simplifica para $x\\ne2$ antes de calcular el límite.',
      ask: { prompt: '¿Cuánto vale $\\lim_{x\\to2}\\frac{x^2-4}{x-2}$?', options: ['4', '0', 'No existe'], answer: 0, explain: 'Para $x\\ne2$, $(x^2-4)/(x-2)=x+2$. Cuando $x$ se acerca a 2, $x+2$ se acerca a 4.' },
      board: { label: 'Forma 0/0', tex: '\\frac{(x-2)(x+2)}{x-2}=\\p{1}{x+2}\\quad(x\\ne2)', body: '$\\lim_{x\\to2}g(x)=4$. La simplificación no define $g(2)$.' },
    },
    {
      say: 'Cuando $x$ crece, $1/x$ se acerca a 0 y $5-3/x$ se acerca a 5. Cada curva se acerca a una asíntota horizontal.',
      dur: 3,
      board: [
        { label: 'Ejemplos al infinito', tex: '\\lim_{x\\to\\infty}\\frac1x=\\p{1}{0},\\qquad\\lim_{x\\to\\infty}\\left(5-\\frac3x\\right)=\\p{2}{5}' },
        { label: 'Límite al infinito', tex: '\\lim_{x\\to\\infty}f(x)=\\p{1}{\\cG{L}}', body: 'La recta $y=L$ es una asíntota horizontal.' },
      ],
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function SignalDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(2.4);
  const [sides, setSides] = useState({ l: false, r: false });
  const [tl, setTl] = useState(1);
  const onT = useSvgDrag(svg, (x) => {
    const v = clamp(P.inv(x, 0)[0], 2.05, 3.95);
    setT(v);
    if (Math.abs(v - 3) < 0.03) setSides((s) => ({ l: s.l || v < 3, r: s.r || v > 3 }));
  });
  useEffect(() => {
    if (sides.l && sides.r) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sides]);
  const PL = plane([0, 8], [0, 14], { x: 300, y: 130, w: 1000, h: 520 });
  const onTl = useSvgDrag(svg, (x) => {
    const v = clamp(PL.inv(x, 0)[0], 0, 8);
    setTl(v);
    if (v > 7.5) unlock();
  });

  if (beat === 0) {
    const close = Math.abs(t - 3);
    return (
      <Stage ref={svg}>
        <Axes P={P} xTicks={[2, 2.5, 3, 3.5, 4]} yTicks={[48, 49, 50, 51, 52]} xLabel="t\ (\text{h})" yLabel="f\ (\text{Hz})" grid />
        <Curve P={P} f={freq} a={2} b={4} color={C.cyan} width={4} />
        <Hole x={P.x(3)} y={P.y(50)} />
        <Html x={P.x(3)} y={P.y(50) - 34} size={18} color={C.muted}>
          <span>dato perdido</span>
        </Html>
        <Line a={P.pt(t, 48)} b={P.pt(t, freq(t))} color={C.text} dashed />
        <Dot x={P.x(t)} y={P.y(freq(t))} r={9} color={C.amber} />
        <Html x={P.x(t) + (t < 3 ? -16 : 16)} y={P.y(freq(t)) + 40} size={20} anchor={t < 3 ? 'right' : 'left'} color={C.amber}>
          <Tex tex={`f(${nt(t, 3)})=${nt(freq(t), 3)}`} />
        </Html>
        <rect x={P.x(2) - 10} y={P.y(48)} width={P.box.w + 20} height={70} fill="transparent" onPointerDown={onT} />
        <Knob x={P.x(t)} y={P.y(48) + 32} onPointerDown={onT} cursor="ew-resize" label={hhmm(t)} />
        <Html x={1340} y={250} size={20} anchor="left" color={sides.l ? C.green : C.muted}>
          <span>{sides.l ? '✓' : '·'} desde antes</span>
        </Html>
        <Html x={1340} y={290} size={20} anchor="left" color={sides.r ? C.green : C.muted}>
          <span>{sides.r ? '✓' : '·'} desde después</span>
        </Html>
        <Html x={1340} y={360} size={18} anchor="left" color={C.muted}>
          <Tex tex={`|t-3|=${nt(close, 3)}`} />
        </Html>
      </Stage>
    );
  }
  if (beat === 1) {
    const V = (s: number) => (s < 3.2 ? 220 + 0.8 * Math.sin(4 * s) : 214 + 0.8 * Math.sin(4 * s));
    const PV = plane([2, 4], [208, 226], { x: 300, y: 130, w: 1000, h: 520 });
    return (
      <Stage>
        <Axes P={PV} xTicks={[2, 2.5, 3, 3.5, 4]} yTicks={[210, 214, 218, 222, 226]} xLabel="t\ (\text{h})" yLabel="V\ (\text{V})" grid />
        <Curve P={PV} f={V} a={2} b={3.199} color={C.cyan} width={4} />
        <Curve P={PV} f={V} a={3.201} b={4} color={C.cyan} width={4} />
        <Hole x={PV.x(3.2)} y={PV.y(220 + 0.8 * Math.sin(12.8))} />
        <Dot x={PV.x(3.2)} y={PV.y(214 + 0.8 * Math.sin(12.8))} r={8} color={C.cyan} />
        <Line a={PV.pt(3.2, 208)} b={PV.pt(3.2, 226)} color={C.red} dashed />
        <Html x={PV.x(3.2)} y={PV.y(226) - 16} size={18} color={C.red}>
          <span>03:12</span>
        </Html>
        {answer !== null && (
          <>
            <Html x={PV.x(2.6)} y={PV.y(224)} size={22} color={C.amber}>
              <Tex tex="\lim_{t\to3{,}2^-}V\approx220{,}2" />
            </Html>
            <Html x={PV.x(3.65)} y={PV.y(210)} size={22} color={C.amber}>
              <Tex tex="\lim_{t\to3{,}2^+}V\approx214{,}2" />
            </Html>
          </>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    const panels = [
      { title: 'Sensor A', f: (s: number) => 1 + 0.6 * (s - 1), hole: false, jump: false, pt: null as number | null },
      { title: 'Sensor B', f: (s: number) => 1 + 0.6 * (s - 1), hole: true, jump: false, pt: 2.2 },
      { title: 'Sensor C', f: (s: number) => (s < 1 ? 1 + 0.6 * (s - 1) : 1.8 + 0.6 * (s - 1)), hole: false, jump: true, pt: null },
    ];
    return (
      <Stage>
        {panels.map((pn, i) => {
          const Q = plane([0, 2], [0, 3], { x: 150 + i * 470, y: 220, w: 380, h: 340 });
          return (
            <g key={pn.title}>
              <Axes P={Q} xTicks={[1]} yTicks={[1, 2]} grid={false} />
              <Html x={Q.x(1)} y={190} size={22} color={answer !== null && i === 0 ? C.green : C.text}>
                <span>{pn.title}</span>
              </Html>
              {pn.jump ? (
                <>
                  <Curve P={Q} f={pn.f} a={0} b={0.995} color={C.cyan} width={4} />
                  <Curve P={Q} f={pn.f} a={1} b={2} color={C.cyan} width={4} />
                  <Hole x={Q.x(1)} y={Q.y(1)} />
                  <Dot x={Q.x(1)} y={Q.y(1.8)} r={7} color={C.cyan} />
                </>
              ) : (
                <Curve P={Q} f={pn.f} a={0} b={2} color={C.cyan} width={4} />
              )}
              {pn.hole && (
                <>
                  <Hole x={Q.x(1)} y={Q.y(1)} />
                  <Dot x={Q.x(1)} y={Q.y(pn.pt!)} r={7} color={C.cyan} />
                </>
              )}
            </g>
          );
        })}
      </Stage>
    );
  }
  if (beat === 3) {
    const PQ = plane([1, 5], [3, 9], { x: 300, y: 130, w: 1000, h: 520 });
    return (
      <Stage>
        <Axes P={PQ} xTicks={[1, 2, 3, 4, 5]} yTicks={[4, 5, 6, 7, 8, 9]} xLabel="t" yLabel="g" grid />
        <Curve P={PQ} f={(s) => s + 3} a={1} b={5} color={C.cyan} width={4} />
        <Hole x={PQ.x(3)} y={PQ.y(6)} />
        <Html x={PQ.x(1.3)} y={PQ.y(8.5)} size={30} anchor="left" color={C.text}>
          <Tex tex="g(t)=\dfrac{t^2-9}{t-3}" />
        </Html>
        {answer !== null && (
          <Html x={PQ.x(3.4)} y={PQ.y(4.4)} size={26} anchor="left" color={C.amber}>
            <Tex tex="\dfrac{(t-3)(t+3)}{t-3}=t+3\ \ (t\ne3)" />
          </Html>
        )}
      </Stage>
    );
  }
  const Vc = (s: number) => 12 * (1 - Math.exp(-0.7 * s));
  return (
    <Stage ref={svg}>
      <Axes P={PL} xTicks={[0, 2, 4, 6, 8]} yTicks={[2, 4, 6, 8, 10, 12, 14]} xLabel="t\ (\text{min})" yLabel="V" grid />
      <Line a={PL.pt(0, 12)} b={PL.pt(8, 12)} color={C.green} dashed />
      <Html x={PL.x(8) + 14} y={PL.y(12)} size={20} anchor="left" color={C.green}>
        <span className="prop-tag">12 V</span>
      </Html>
      <Curve P={PL} f={Vc} a={0} b={Math.max(0.05, tl)} color={C.cyan} width={4} />
      <Dot x={PL.x(tl)} y={PL.y(Vc(tl))} r={9} color={C.amber} />
      <Html x={PL.x(tl)} y={PL.y(Vc(tl)) + 36} size={20} color={C.amber}>
        <Tex tex={`V=${nt(Vc(tl), 3)}`} />
      </Html>
      <rect x={PL.x(0) - 10} y={PL.y(0)} width={PL.box.w + 20} height={70} fill="transparent" onPointerDown={onTl} />
      <Knob x={PL.x(tl)} y={PL.y(0) + 32} onPointerDown={onTl} cursor="ew-resize" label={`${dec(tl, 1)}`} />
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Readings({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const a = randInt(r, 2, 4);
    const left = randInt(r, 1, 4);
    const jump = pick(r, [-2, 2, 3, 0]);
    const right = left + jump >= 1 ? left + jump : left + 2;
    const side = r() < 0.5 ? 'izquierda' : 'derecha';
    const filled = randInt(r, 0, 5);
    // round 1: (t-a)(t+c)/(t-a)
    const a1 = randInt(r, 1, 5);
    let c1 = randInt(r, 1, 6) * (r() < 0.3 ? -1 : 1);
    if (a1 + c1 === 0) c1 += 2;
    // round 2
    const kind = r() < 0.5 ? 'rat' : 'exp';
    const p2 = randInt(r, 2, 9);
    const q2 = randInt(r, 1, 9);
    const r2 = pick(r, [1, 2, 4, 5]);
    const s2 = randInt(r, 1, 6);
    const L = pick(r, [5, 8, 12, 24]);
    const b0 = pick(r, [0, 2, 3]);
    return { a, left, right, side, filled, a1, c1, kind, p2, q2, r2, s2, L, b0 };
  }, [seed]);
  const [val, setVal] = useState('');
  const Q = plane([0, 6], [0, 8], { x: 300, y: 120, w: 1000, h: 520 });
  const fL = (t: number) => data.left + 0.4 * (t - data.a);
  const fR = (t: number) => data.right + 0.3 * (t - data.a);

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Lectura de un sensor de la planta. ¿A qué valor se acerca la señal cuando $t\\to${data.a}$ por la **${data.side}**?`, `\\lim_{t\\to${data.a}^{${data.side === 'izquierda' ? '-' : '+'}}}f(t)`);
      api.hints(['Sigue la curva desde ese lado hasta el borde, sin mirar el punto lleno.', 'El valor de $f$ en el punto no cuenta para el límite.']);
    } else if (round === 1) {
      const { a1, c1 } = data;
      const b = c1 - a1;
      const c = -a1 * c1;
      api.prompt(`El contador de energía usa esta fórmula, que da 0/0 en $t=${a1}$. ¿A qué valor tiende cuando $t\\to${a1}$?`, `\\lim_{t\\to${a1}}\\dfrac{t^2${b >= 0 ? '+' : ''}${b}t${c >= 0 ? '+' : ''}${c}}{t-${a1}}`);
      api.hints([`El numerador se anula en $t=${a1}$: tiene el factor $(t-${a1})$.`, 'Factoriza, cancela y recién entonces reemplaza.']);
    } else if (data.kind === 'rat') {
      api.prompt('Después de reconectar, la carga sigue esta fórmula. ¿A qué valor tiende cuando pasa mucho tiempo?', `\\lim_{t\\to\\infty}\\dfrac{${data.p2}t+${data.q2}}{${data.r2}t+${data.s2}}`);
      api.hints(['Para $t$ muy grande, las constantes casi no pesan.', 'Divide numerador y denominador por $t$.']);
    } else {
      api.prompt('Un condensador se carga según esta fórmula. ¿A qué voltaje tiende?', `\\lim_{t\\to\\infty}\\left(${data.b0 ? `${data.b0}+` : ''}${data.L}\\left(1-e^{-t}\\right)\\right)`);
      api.hints(['$e^{-t}$ se hace tan pequeño como se quiera cuando $t$ crece.', 'Reemplaza $e^{-t}$ por 0.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = data.side === 'izquierda' ? data.left : data.right;
      const other = data.side === 'izquierda' ? data.right : data.left;
      if (Math.abs(v - t) < 0.05) return api.result(true, `Por la ${data.side}, la señal se acerca a ${t}. ${data.left === data.right ? 'Por ambos lados da lo mismo: el límite existe.' : `Por el otro lado se acerca a ${other}: el límite (bilateral) no existe.`}`);
      if (Math.abs(v - data.filled) < 0.05 && data.filled !== t) return api.result(false, `${data.filled} es $f(${data.a})$, el punto lleno. El límite mira los valores cercanos, no el del punto.`);
      if (Math.abs(v - other) < 0.05) return api.result(false, `${other} es el límite por el otro lado.`);
      return api.result(false, `Sigue la curva de la ${data.side} hasta $t=${data.a}$: ¿a qué altura llega?`);
    }
    if (round === 1) {
      const t = data.a1 + data.c1;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$\\dfrac{(t-${data.a1})(t${data.c1 >= 0 ? '+' : ''}${data.c1})}{t-${data.a1}}=t${data.c1 >= 0 ? '+' : ''}${data.c1}\\to${t}$.`);
      if (v === 0) return api.result(false, '0/0 no es 0: es una forma indeterminada. Hay que simplificar antes de reemplazar.');
      return api.result(false, `Factoriza el numerador: uno de los factores es $(t-${data.a1})$.`);
    }
    const t = data.kind === 'rat' ? data.p2 / data.r2 : data.b0 + data.L;
    if (Math.abs(v - t) < 0.01) return api.result(true, data.kind === 'rat' ? `$\\dfrac{${data.p2}+${data.q2}/t}{${data.r2}+${data.s2}/t}\\to\\dfrac{${data.p2}}{${data.r2}}=${nt(t, 3)}$.` : `$e^{-t}\\to0$, así que tiende a ${t} V. Nunca lo alcanza: es una asíntota.`);
    if (data.kind === 'rat' && Math.abs(v - data.q2 / data.s2) < 0.01) return api.result(false, `Esa es la razón de las constantes, el valor en $t=0$. A la larga mandan los términos con $t$.`);
    return api.result(false, data.kind === 'rat' ? 'Divide todo por $t$ y deja que $1/t\\to0$.' : 'Reemplaza $e^{-t}$ por 0 y simplifica.');
  };

  if (round === 0) {
    const a = data.a;
    return (
      <Stage>
        <Axes P={Q} xTicks={[0, 1, 2, 3, 4, 5, 6]} yTicks={[1, 2, 3, 4, 5, 6, 7, 8]} xLabel="t" yLabel="f" grid />
        <Curve P={Q} f={fL} a={0} b={a - 0.01} color={C.cyan} width={4} />
        <Curve P={Q} f={fR} a={a + 0.01} b={6} color={C.cyan} width={4} />
        {data.left !== data.filled && <Hole x={Q.x(a)} y={Q.y(data.left)} />}
        {data.right !== data.filled && data.right !== data.left && <Hole x={Q.x(a)} y={Q.y(data.right)} />}
        <Dot x={Q.x(a)} y={Q.y(data.filled)} r={8} color={C.cyan} />
        <NumberField x={300} y={740} value={val} onChange={setVal} onEnter={submit} label="Límite:" width={4} />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  return (
    <Stage>
      <Html x={800} y={330} size={40} color={C.text}>
        <Tex
          tex={
            round === 1
              ? `\\dfrac{t^2${data.c1 - data.a1 >= 0 ? '+' : ''}${data.c1 - data.a1}t${-data.a1 * data.c1 >= 0 ? '+' : ''}${-data.a1 * data.c1}}{t-${data.a1}}`
              : data.kind === 'rat'
                ? `\\dfrac{${data.p2}t+${data.q2}}{${data.r2}t+${data.s2}}`
                : `${data.b0 ? `${data.b0}+` : ''}${data.L}\\left(1-e^{-t}\\right)`
          }
        />
      </Html>
      <NumberField x={560} y={560} value={val} onChange={setVal} onEnter={submit} label="Límite:" width={5} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c1',
  world: 'differential',
  code: '2.1',
  title: 'La señal',
  subtitle: 'Límites y continuidad',
  glyph: '\\lim',
  kind: 'level',
  guide: 'teo',
  teaser: 'Cada noche, a las 03:12, la red de la central da un salto. Para entender un salto hay que mirar qué pasa justo antes y justo después.',
  learn: 'Límite como valor al que se acerca una función, límites laterales, continuidad, formas $0/0$ que se simplifican y límites cuando $t\\to\\infty$.',
  glyphs: ['lim', 'lateral', 'cont'],
  pitfalls: ['El límite en $a$ no depende de $f(a)$: puede existir aunque $f(a)$ no exista o sea otro valor.', '$0/0$ no es 0 ni 1: es una señal de que hay que simplificar.', 'Si los límites laterales son distintos, el límite no existe.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'Central Halcón Energía, Ventanas. Cada noche, a las 03:12, la tensión de la red cae de golpe.' },
        { who: 'iris', text: 'Alguien conecta algo grande. Quiero ver qué pasa justo antes y justo después.' },
        { who: 'teo', text: 'Y hay datos que se pierden. Tendremos que deducirlos de los vecinos.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La señal',
      Scene: SignalDemo,
      beats: [
        {
          say: 'La frecuencia de la red, en hertz. A las 03:00 el sensor perdió el dato. Acércate a ese instante y mira a qué valor se aproxima la señal.',
          gate: 'Acerca el reloj a las 03:00 desde antes y desde después.',
          note: { label: 'Límite', tex: '\\lim_{t\\to a}f(t)=L', body: '$f(t)$ queda tan cerca de $L$ como se quiera tomando $t$ suficientemente cerca de $a$ (con $t\\ne a$). Aquí $L=50$ Hz, aunque falte $f(3)$.' },
        },
        {
          say: 'La tensión a las 03:12. Mira la curva antes del corte rojo y después.',
          ask: {
            prompt: '¿A qué valores se acerca la tensión justo antes y justo después de las 03:12?',
            options: ['Unos 220 V antes y unos 214 V después', 'A 217 V por ambos lados', 'No se acerca a nada'],
            answer: 0,
            explain: 'Cada lado tiene su propio valor límite. Como son distintos, el límite bilateral no existe: hay un salto.',
          },
          note: { label: 'Límites laterales', tex: '\\lim_{t\\to a^-}f(t),\\qquad \\lim_{t\\to a^+}f(t)', body: 'El límite existe solo si los dos laterales existen y coinciden.' },
        },
        {
          say: 'Tres sensores alrededor de $t=1$. El punto lleno es el valor registrado; el hueco, lo que falta.',
          ask: {
            prompt: '¿Cuál de los tres es continuo en $t=1$?',
            options: ['Sensor A', 'Sensor B', 'Sensor C'],
            answer: 0,
            explain: 'B tiene límite 1 pero registró otro valor; C salta. Solo en A el valor coincide con el límite.',
          },
          note: { label: 'Continuidad', tex: '\\lim_{t\\to a}f(t)=f(a)', body: 'La gráfica se puede trazar sin levantar el lápiz en $a$.' },
        },
        {
          say: 'Una fórmula del contador da $\\tfrac{0}{0}$ exactamente en $t=3$.',
          ask: {
            prompt: '¿A qué valor tiende $\\dfrac{t^2-9}{t-3}$ cuando $t\\to3$?',
            options: ['6', '0', 'No existe'],
            answer: 0,
            explain: '$t^2-9=(t-3)(t+3)$. Para $t\\ne3$ la fracción es $t+3$, que tiende a 6. La gráfica es una recta con un hueco.',
          },
          note: { label: 'Formas 0/0', tex: '\\frac{t^2-9}{t-3}=t+3\\quad(t\\ne3)', body: 'Se simplifica el factor que anula y recién entonces se reemplaza.' },
        },
        {
          say: 'Al reconectar, un condensador se carga. Mira qué pasa con el voltaje a la larga.',
          gate: 'Arrastra el tiempo hasta el final.',
          note: { label: 'Límite al infinito', tex: '\\lim_{t\\to\\infty}12\\left(1-e^{-0{,}7t}\\right)=12', body: 'Se acerca a 12 V sin alcanzarlos: la recta $V=12$ es una asíntota.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Lecturas', Comp: Readings, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'El salto no es una falla: es una carga de varios megawatts que se conecta a las 03:12 y se va a las 05:00.' },
        { who: 'iris', text: 'Entonces mediremos cuánta energía usa. Y a qué ritmo.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'lim', world: 'differential', tex: '\\lim_{t\\to a}f(t)', name: 'Límite', read: 'límite de efe cuando te tiende a a', meaning: 'Valor al que se acerca $f(t)$ cuando $t$ se acerca a $a$, sin importar $f(a)$.' },
  { id: 'lateral', world: 'differential', tex: 't\\to a^{-},\\ t\\to a^{+}', name: 'Límites laterales', read: 'por la izquierda, por la derecha', meaning: 'Acercarse a $a$ solo desde valores menores ($^-$) o solo desde mayores ($^+$).' },
  { id: 'cont', world: 'differential', tex: '\\lim_{t\\to a}f(t)=f(a)', name: 'Continuidad', read: 'efe es continua en a', meaning: 'El límite existe y coincide con el valor de la función.' },
];
