import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { Tangent, nt } from './kit';

// ============================================================================
// CASO 2.8 · «Máxima eficiencia» — optimización
// La potencia entregada P(I)=12I−0,15I² tiene su máximo donde P'=0. No todo punto crítico es
// extremo (x³). Prueba de la segunda derivada. En un intervalo cerrado, revisar los bordes.
// Modelar: el corral del transformador con 40 m de reja.
// ============================================================================

const Pw = (i: number) => 12 * i - 0.15 * i * i;
const dPw = (i: number) => 12 - 0.3 * i;
const PP = plane([0, 80], [0, 260], { x: 300, y: 120, w: 960, h: 540 });

// ---------------------------------------------------------------- lesson
const area = (x: number) => x * (20 - x);
const PA = plane([0, 20], [0, 110], { x: 250, y: 140, w: 720, h: 480 });

function OptimumLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(4);
  const onX = useSvgDrag(svg, (px) => {
    if (beat !== 0) return;
    const next = Math.round(clamp(PA.inv(px, 0)[0], 0, 20) * 100) / 100;
    setX(next);
    if (next >= 9.5 && next <= 10.5) unlock();
  });
  if (beat === 5) {
    const rows = ['\\text{Variable: }x', 'A(x)=x(20-x)', 'x\\in[0,20]', "A'(x)=0\\Rightarrow x=10", 'A(0)=A(20)=0<100=A(10)'];
    return <Stage>{rows.map((tex, i) => <Cap key={tex} x={800} y={170 + i * 110} tex={tex} size={28} color={i === 4 ? C.green : C.text} />)}</Stage>;
  }
  const at = beat === 0 ? x : 10;
  return <Stage ref={svg}>
    <Axes P={PA} xTicks={[0, 5, 10, 15, 20]} yTicks={[25, 50, 75, 100]} xLabel="x" yLabel="A" grid />
    <Curve P={PA} f={area} a={0} b={20} color={C.cyan} width={4} />
    {(beat !== 1 || answer !== null) && <Tangent P={PA} f={area} a={at} m={20 - 2 * at} half={4} />}
    <rect x={1080} y={240} width={at * 18} height={(20 - at) * 18} fill={C.cyan} fillOpacity={0.25} stroke={C.cyan} strokeWidth={3} />
    <Cap x={1260} y={180} tex="2x+2(20-x)=40\ \text{m}" size={22} />
    <Cap x={1260} y={480} tex={`x=${nt(at)}\\ \\text{m},\\quad20-x=${nt(20 - at)}\\ \\text{m}`} size={20} />
    <Cap x={1260} y={550} tex={`A(${nt(at)})=${nt(area(at))}\\ \\text{m}^2`} color={C.cyan} />
    {beat === 0 && <>
      <rect x={PA.x(0)} y={690} width={PA.box.w} height={60} fill="transparent" onPointerDown={onX} />
      <Knob x={PA.x(x)} y={720} onPointerDown={onX} cursor="ew-resize" label={`x=${dec(x, 2)} m`} />
    </>}
    {beat === 2 && <Cap x={650} y={730} tex="A'(x)=20-2x=0\Rightarrow x=10" color={C.amber} />}
    {beat === 3 && <Cap x={650} y={730} tex="A''(x)=-2<0\Rightarrow\text{máximo}" color={C.amber} />}
    {beat === 4 && <>
      {[0, 20].map((v) => <Dot key={v} x={PA.x(v)} y={PA.y(0)} r={9} color={C.green} />)}
      <Cap x={650} y={730} tex="A(0)=A(20)=0<100=A(10)" color={C.green} />
    </>}
  </Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Optimización',
  Scene: OptimumLesson,
  beats: [
    {
      say: 'Con 40 m de reja, un rectángulo de ancho $x$ tiene largo $20-x$. Mueve el ancho y observa el área.',
      gate: 'Arrastra x hasta quedar entre 9,5 y 10,5 m.',
      board: { label: 'Modelo', tex: 'A(x)=x(20-x)=\\p{1}{20x-x^2}', body: '$2x+2(20-x)=40$ y $0\\le x\\le20$.' },
    },
    {
      say: 'Al aumentar el ancho, el largo disminuye. El área llega a un máximo y luego baja.',
      ask: { prompt: '¿Qué ancho da el área máxima?', options: ['10 m', '20 m', '5 m'], answer: 0, explain: 'Con $x=10$, el largo también es 10 y el área es $100$ m².' },
      board: { label: 'Área máxima', tex: 'A(10)=10(20-10)=\\p{1}{100}\\ \\text{m}^2' },
    },
    {
      say: 'En el máximo, la tangente es horizontal. Resuelve $A\'(x)=20-2x=0$ para obtener $x=10$.',
      dur: 3,
      board: [
        { label: 'Puntos críticos', tex: "f'(x)=0\\quad\\text{o}\\quad f'(x)\\text{ no existe}", body: 'Busca puntos del dominio de la función.' },
        { tex: "A'(x)=20-2x=0\\Rightarrow x=10,\\qquad A(10)=100\\ \\text{m}^2" },
      ],
    },
    {
      say: 'La segunda derivada es negativa: la curva es cóncava hacia abajo. El punto crítico es un máximo.',
      dur: 2.6,
      board: { label: 'Comprobar el máximo', tex: "A''(x)=-2<0\\Rightarrow\\text{máximo en }x=10" },
    },
    {
      say: 'En un intervalo cerrado, compara los puntos críticos con los extremos. Aquí el área en ambos extremos es cero.',
      dur: 3,
      board: { label: 'Extremos del intervalo', tex: '\\p{1}{x\\in[0,20]:}\\quad\\p{2}{ A(0)}=\\p{3}{A(20)}=\\p{4}{0<100}=\\p{5}{A(10)}' },
    },
    {
      say: 'Define la variable, la función y el dominio. Busca los puntos críticos y comprueba el resultado, incluyendo los extremos.',
      dur: 3,
      board: [
        { label: 'Modelar', tex: '\\text{Variable}\\to\\text{función}\\to\\text{dominio}' },
        { label: 'Optimizar', tex: "f'=0\\text{ o }f'\\text{ no existe}\\to\\text{comprobar y comparar extremos}" },
      ],
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function OptimumDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [i, setI] = useState(15);
  const [x, setX] = useState(4);
  const onI = useSvgDrag(svg, (px) => {
    let v = Math.round(clamp(PP.inv(px, 0)[0], 0, 80));
    if (Math.abs(v - 40) <= 1) v = 40;
    setI(v);
    if (v === 40) unlock();
  });
  const onX = useSvgDrag(svg, (px) => {
    let v = Math.round(clamp((px - 360) / 40, 1, 19) * 2) / 2;
    if (Math.abs(v - 10) < 0.3) v = 10;
    setX(v);
    if (v === 10) unlock();
  });

  if (beat === 0 || beat === 2) {
    const ii = beat === 0 ? i : 40;
    return (
      <Stage ref={svg}>
        <Axes P={PP} xTicks={[0, 20, 40, 60, 80]} yTicks={[50, 100, 150, 200, 250]} xLabel="I\ (\text{A})" yLabel="P\ (\text{kW})" grid />
        <Curve P={PP} f={Pw} a={0} b={80} color={C.cyan} width={4} />
        <Tangent P={PP} f={Pw} a={ii} m={dPw(ii)} half={14} color={Math.abs(dPw(ii)) < 0.01 ? C.green : C.amber} onPointerDown={beat === 0 ? onI : undefined} />
        <Html x={1290} y={200} size={22} anchor="left" color={C.amber}>
          <Tex tex={`P'(${ii})=${nt(dPw(ii), 2)}`} />
        </Html>
        <Html x={1290} y={250} size={22} anchor="left" color={C.cyan}>
          <Tex tex={`P(${ii})=${nt(Pw(ii), 1)}`} />
        </Html>
        {beat === 0 && (
          <>
            <rect x={PP.x(0) - 10} y={PP.y(0)} width={PP.box.w + 20} height={70} fill="transparent" onPointerDown={onI} />
            <Knob x={PP.x(i)} y={PP.y(0) + 32} onPointerDown={onI} cursor="ew-resize" label={`${i} A`} />
          </>
        )}
        {beat === 2 && answer !== null && (
          <>
            <Formula x={1340} y={360} size={22} tex="P''(I)=-0{,}3<0" />
            <Html x={1340} y={430} size={18} color={C.muted}>
              <span style={{ display: 'block', whiteSpace: 'normal', width: '12em', textAlign: 'center' }}>la pendiente siempre baja: cóncava hacia abajo</span>
            </Html>
          </>
        )}
      </Stage>
    );
  }
  if (beat === 1) {
    const fs = [
      { f: (s: number) => s * s, name: 'x^2', t: 'mínimo' },
      { f: (s: number) => -s * s, name: '-x^2', t: 'máximo' },
      { f: (s: number) => s * s * s, name: 'x^3', t: 'ninguno' },
    ];
    return (
      <Stage>
        {fs.map((g, k) => {
          const Q = plane([-1.3, 1.3], [-1.6, 1.6], { x: 150 + k * 470, y: 200, w: 400, h: 400 });
          return (
            <g key={g.name}>
              <Axes P={Q} xTicks={[]} yTicks={[]} />
              <Curve P={Q} f={(s) => clamp(g.f(s), -1.6, 1.6)} a={-1.3} b={1.3} color={C.cyan} width={4} />
              <Line a={Q.pt(-0.6, 0)} b={Q.pt(0.6, 0)} color={C.amber} width={3} />
              <Dot x={Q.x(0)} y={Q.y(0)} r={8} color={C.amber} />
              <Html x={Q.x(0)} y={170} size={26} color={C.text}>
                <Tex tex={g.name} />
              </Html>
              {answer !== null && (
                <Html x={Q.x(0)} y={640} size={22} color={k === 2 ? C.red : C.green}>
                  <span>{g.t}</span>
                </Html>
              )}
            </g>
          );
        })}
      </Stage>
    );
  }
  if (beat === 3) {
    return (
      <Stage>
        <Axes P={PP} xTicks={[0, 20, 40, 60, 80]} yTicks={[50, 100, 150, 200, 250]} xLabel="I\ (\text{A})" yLabel="P\ (\text{kW})" grid />
        <Curve P={PP} f={Pw} a={0} b={80} color={C.cyan} width={2} />
        <Curve P={PP} f={Pw} a={0} b={30} color={C.cyan} width={6} />
        <Line a={PP.pt(30, 0)} b={PP.pt(30, 260)} color={C.red} dashed />
        <Html x={PP.x(30)} y={PP.y(260) - 18} size={18} color={C.red}>
          <span>fusible: 30 A</span>
        </Html>
        {answer !== null && (
          <>
            <Dot x={PP.x(30)} y={PP.y(Pw(30))} r={11} color={C.green} />
            <Html x={PP.x(30) + 16} y={PP.y(Pw(30)) + 30} size={20} anchor="left" color={C.green}>
              <Tex tex="P(30)=225" />
            </Html>
          </>
        )}
      </Stage>
    );
  }
  // beat 4: fence against a wall
  const s = 40;
  const X0 = 360;
  const W0 = 160;
  const len = 40 - 2 * x;
  const A = x * len;
  return (
    <Stage ref={svg}>
      <rect x={X0 - 20} y={W0 - 24} width={800} height={24} fill="#2a2148" />
      <Html x={X0 + 380} y={W0 - 40} size={18} color={C.muted}>
        <span>muro de la sala de máquinas</span>
      </Html>
      <rect x={X0} y={W0} width={len * (800 / 40) * 0.95} height={x * s * 0.6} fill={C.cyan} opacity={0.18} stroke={C.amber} strokeWidth={4} />
      <Html x={X0 + (len * 20 * 0.95) / 2} y={W0 + x * s * 0.6 + 26} size={20} color={C.amber}>
        <Tex tex={`40-2x=${nt(len, 1)}`} />
      </Html>
      <Html x={X0 - 16} y={W0 + (x * s * 0.6) / 2} size={20} anchor="right" color={C.amber}>
        <Tex tex={`x=${nt(x, 1)}`} />
      </Html>
      <Formula x={1340} y={250} size={24} tex={`A(x)=x\\,(40-2x)`} />
      <Formula x={1340} y={320} size={26} color={A >= 200 ? C.green : C.text} tex={`A=${nt(A, 1)}\\ \\text{m}^2`} />
      <Formula x={1340} y={400} size={20} color={C.muted} tex={`A'(x)=40-4x=${nt(40 - 4 * x, 1)}`} />
      <line x1={400} x2={1120} y1={820} y2={820} stroke={C.line} strokeWidth={3} />
      <rect x={380} y={790} width={760} height={60} fill="transparent" onPointerDown={onX} style={{ cursor: 'ew-resize' }} />
      <Knob x={360 + x * 40} y={820} onPointerDown={onX} cursor="ew-resize" label="x" />
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Optimum({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const xs = pick(r, [20, 25, 30, 40, 50]);
    const b = pick(r, [0.1, 0.2, 0.25]);
    const a = 2 * b * xs;
    const L = pick(r, [24, 36, 48, 60]);
    const wall = r() < 0.6;
    const cA = pick(r, [2, 4, 8]);
    const qs = pick(r, [5, 10, 15, 20]);
    const cB = cA * qs * qs;
    return { a, b, xs, L, wall, cA, cB, qs };
  }, [seed]);
  const g = data;
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Otro transformador entrega $P(I)=${nt(g.a, 1)}I-${nt(g.b, 2)}I^2$ kW. ¿Con qué corriente entrega la potencia máxima?`, "P'(I)=0");
      api.hints(["Deriva: $P'(I)=" + nt(g.a, 1) + '-' + nt(2 * g.b, 2) + 'I$.', 'Iguala a 0 y despeja $I$.']);
    } else if (round === 1) {
      api.prompt(
        g.wall ? `Corral rectangular contra un muro con ${g.L} m de reja (tres lados). ¿Cuál es el área máxima, en m²?` : `Corral rectangular cerrado con ${g.L} m de reja (cuatro lados). ¿Cuál es el área máxima, en m²?`,
        g.wall ? `A(x)=x\\,(${g.L}-2x)` : `A(x)=x\\left(\\tfrac{${g.L}}{2}-x\\right)`,
      );
      api.hints(['Escribe el área en función de un solo lado, deriva e iguala a 0.', g.wall ? `$A'(x)=${g.L}-4x$.` : `$A'(x)=${g.L / 2}-2x$: sale un cuadrado.`]);
    } else {
      api.prompt(`Costo por lote de repuestos: $C(q)=${g.cA}q+\\dfrac{${g.cB}}{q}$ (en miles), con $q>0$. ¿Qué tamaño de lote $q$ minimiza el costo?`, "C'(q)=0");
      api.hints([`$C'(q)=${g.cA}-\\dfrac{${g.cB}}{q^2}$.`, `Iguala a 0: $q^2=${g.cB}/${g.cA}$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - g.xs) < 0.05) return api.result(true, `$P'=${nt(g.a, 1)}-${nt(2 * g.b, 2)}I=0\\Rightarrow I=${g.xs}$ A. $P''=-${nt(2 * g.b, 2)}<0$: máximo de ${nt(g.a * g.xs - g.b * g.xs * g.xs, 1)} kW.`);
      if (Math.abs(v - g.a / g.b) < 0.05) return api.result(false, 'Ahí la potencia vuelve a 0. El máximo está a medio camino: falta el 2 que baja al derivar $I^2$.');
      return api.result(false, `Con $I=${dec(v)}$, $P'=${nt(g.a - 2 * g.b * v, 2)}$: ${g.a - 2 * g.b * v > 0 ? 'todavía sube, aumenta la corriente' : 'ya baja, reduce la corriente'}.`);
    }
    if (round === 1) {
      const t = g.wall ? (g.L * g.L) / 8 : (g.L * g.L) / 16;
      const xs = g.wall ? g.L / 4 : g.L / 4;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$x=${nt(xs, 1)}$ m da el área máxima: ${nt(t, 1)} m². ${g.wall ? 'El lado paralelo al muro mide el doble.' : 'Es un cuadrado.'}`);
      if (Math.abs(v - xs) < 0.5) return api.result(false, `${nt(xs, 1)} es la medida del lado óptimo; se pide el área.`);
      return api.result(false, `Deriva el área, iguala a 0 para obtener $x=${nt(xs, 1)}$ y calcula $A(x)$.`);
    }
    if (Math.abs(v - g.qs) < 0.05) return api.result(true, `$q^2=${g.cB}/${g.cA}=${g.qs * g.qs}$, $q=${g.qs}$. $C''=${2 * g.cB}/q^3>0$: mínimo de ${2 * g.cA * g.qs} mil.`);
    return api.result(false, `Con $q=${dec(v)}$, $C'(q)=${nt(g.cA - g.cB / (v * v), 2)}$: ${g.cA - g.cB / (v * v) < 0 ? 'todavía baja, aumenta q' : 'ya sube, reduce q'}.`);
  };

  return (
    <Stage>
      <Formula
        y={300}
        size={40}
        tex={round === 0 ? `P(I)=${nt(g.a, 1)}I-${nt(g.b, 2)}I^2` : round === 1 ? (g.wall ? `\\text{reja}=${g.L}\\ \\text{m (3 lados)}` : `\\text{reja}=${g.L}\\ \\text{m (4 lados)}`) : `C(q)=${g.cA}q+\\dfrac{${g.cB}}{q}`}
      />
      <NumberField x={560} y={520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'I* =' : round === 1 ? 'Área máx.:' : 'q* ='} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c8',
  world: 'differential',
  code: '2.8',
  title: 'Máxima eficiencia',
  subtitle: 'Optimización',
  glyph: "f'=0",
  kind: 'level',
  guide: 'nadia',
  teaser: 'Quien instaló la carga oculta la ajustó para sacar la máxima potencia del transformador. Encontrar ese punto es saber cuánto se roba.',
  learn: "Máximos y mínimos donde $f'=0$, puntos críticos que no son extremos, prueba de la segunda derivada, bordes de un intervalo y modelar un problema de optimización.",
  glyphs: ['crit', 'second-test'],
  pitfalls: ["$f'=0$ no garantiza un extremo: $x^3$ en 0.", 'En un intervalo cerrado, el máximo puede estar en un borde.', 'Se pide el valor óptimo o el punto donde ocurre: hay que leer bien.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nar', text: 'Transformador del alimentador 4, 13:00; el fusible refleja la luz del tablero.' },
        { who: 'nadia', text: 'Con poca corriente entrega poco; al exigirle más, aumentan las pérdidas en calor. Necesito saber hasta dónde sirve subirla.' },
        { who: 'iris', text: 'El instalador eligió un ajuste. Veamos si tuvo la misma precaución con el fusible.' },
        { who: 'tu', text: 'Revisaría el tope permitido antes de aceptar el ajuste de la carga.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El punto justo',
      Scene: OptimumDemo,
      beats: [
        {
          say: 'Potencia entregada según la corriente: $P(I)=12I-0{,}15I^2$. Busca el punto más alto.',
          gate: 'Arrastra la corriente hasta la cima de la curva.',
          note: { label: 'Máximo y derivada', tex: "P'(I)=12-0{,}3I=0\\ \\Rightarrow\\ I=40", body: 'En la cima, la tangente es horizontal. $P(40)=240$ kW.' },
        },
        {
          say: 'Tres curvas con tangente horizontal en 0.',
          ask: {
            prompt: '¿Todo punto con $f\'=0$ es un máximo o un mínimo?',
            options: ['No: x³ se aplana en 0 y sigue subiendo', 'Sí, siempre', 'Solo si la función es un polinomio'],
            answer: 0,
            explain: '$x^3$ tiene tangente horizontal en 0, pero sube antes y después. Los puntos con $f\'=0$ son candidatos, no garantías.',
          },
          note: { label: 'Puntos críticos', tex: "f'(c)=0", body: 'Candidatos a extremo. Hay que comprobar qué son.' },
        },
        {
          say: 'Para saber si $I=40$ es un máximo, mira cómo cambia la pendiente.',
          ask: {
            prompt: 'Si $P\'\'(I)=-0{,}3$ en todas partes, ¿qué es $I=40$?',
            options: ['Un máximo', 'Un mínimo', 'No se puede saber'],
            answer: 0,
            explain: 'La pendiente siempre disminuye: positiva antes de 40, negativa después. La curva es cóncava hacia abajo y la cima es un máximo.',
          },
          note: { label: 'Segunda derivada', tex: "\\begin{aligned}f''(c)<0&\\Rightarrow\\text{máximo}\\\\ f''(c)>0&\\Rightarrow\\text{mínimo}\\end{aligned}", body: "En un punto crítico, con $f'(c)=0$." },
        },
        {
          say: 'El transformador tiene un fusible: la corriente no puede pasar de 30 A.',
          ask: {
            prompt: '¿Dónde está ahora la potencia máxima?',
            options: ['En 30 A, el borde permitido', 'En 40 A', 'En 15 A, a la mitad'],
            answer: 0,
            explain: 'El máximo de la curva, 40 A, quedó fuera. En $[0,30]$ la potencia siempre sube: el mejor punto es el borde.',
          },
          note: { label: 'Intervalos cerrados', body: 'Se comparan los puntos críticos de adentro y los dos bordes.' },
        },
        {
          say: 'Hay que cercar el transformador contra el muro con 40 m de reja: tres lados. ¿Qué medidas dan la mayor área?',
          gate: 'Ajusta x hasta el área máxima.',
          note: { label: 'Modelar', tex: "\\begin{aligned}A(x)&=x(40-2x)\\\\ A'(x)&=40-4x=0\\Rightarrow x=10\\end{aligned}", body: 'Variable, función, derivada igual a 0, comprobar. Área máxima: 200 m².' },
        },
      ],
    },
    { kind: 'challenge', title: 'El punto óptimo', Comp: Optimum, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'La curva alcanza 240 kW con 40 A, pero el fusible permite solo 30 A. Dentro de ese tope entrega como máximo 225 kW.' },
        { who: 'iris', text: 'El punto más alto de una curva no le da permiso para saltarse el fusible.' },
        { who: 'teo', text: 'Y queda la temperatura: sube cada noche. El sensor del alimentador 4 marca el daño a 110 °C.' },
        { who: 'nadia', text: 'El ajuste está calculado; el margen para calentarse se está acabando.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'crit', world: 'differential', tex: "f'(c)=0", name: 'Punto crítico', read: 'punto crítico', meaning: 'Donde la tangente es horizontal (o no hay derivada). Candidato a máximo o mínimo.' },
  { id: 'second-test', world: 'differential', tex: "f''(c)\\lessgtr0", name: 'Prueba de la segunda derivada', read: 'prueba de la segunda derivada', meaning: "En un punto crítico, $f''<0$ indica máximo y $f''>0$ mínimo." },
];
