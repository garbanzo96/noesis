import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane, type Plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, dec, hhmm } from '../shared/ui';
import { Tangent, deriv, nt } from './kit';

// ============================================================================
// CASO 2.3 · «La gráfica del pico» — la derivada como función
// Recorrer E(t) con la tangente y dibujar su pendiente: nace E'(t). Más alto no es más
// empinado. Signo de la derivada ↔ crece/decrece; f'=0 en picos y valles. Segunda derivada y
// concavidad; inflexión = pendiente máxima.
// ============================================================================

const E = (t: number) => 12 * t * t - 4 * t * t * t;
const Pw = (t: number) => 24 * t - 12 * t * t;
const TOP = plane([0, 2], [0, 18], { x: 300, y: 70, w: 960, h: 340 });
const BOT = plane([0, 2], [0, 14], { x: 300, y: 480, w: 960, h: 300 });

// ---------------------------------------------------------------- demo
function PeakDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0.2);
  const [reach, setReach] = useState(0.2);
  const onT = useSvgDrag(svg, (x) => {
    const v = clamp(TOP.inv(x, 0)[0], 0, 2);
    setT(v);
    setReach((r) => Math.max(r, v));
    if (v > 1.95) unlock();
  });
  const temp = (s: number) => 40 + 30 * Math.sin((Math.PI * s) / 2) ** 2 - 10 * Math.max(0, s - 1) ** 2;

  if (beat <= 1) {
    const tt = beat === 0 ? t : 1;
    return (
      <Stage ref={svg}>
        <Axes P={TOP} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[4, 8, 12, 16]} xLabel="t\ (\text{h})" yLabel="E\ (\text{MWh})" grid />
        <Curve P={TOP} f={E} a={0} b={2} color={C.cyan} width={4} />
        <Tangent P={TOP} f={E} a={tt} m={Pw(tt)} half={0.35} color={C.amber} onPointerDown={beat === 0 ? onT : undefined} />
        <Axes P={BOT} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[4, 8, 12]} xLabel="t\ (\text{h})" yLabel="E'\ (\text{MW})" grid />
        <Curve P={BOT} f={Pw} a={0} b={beat === 0 ? Math.max(0.01, reach) : 2} color={C.amber} width={4} />
        <Line a={TOP.pt(tt, E(tt))} b={BOT.pt(tt, Pw(tt))} color={C.dim} dashed />
        <Dot x={BOT.x(tt)} y={BOT.y(Pw(tt))} r={9} color={C.amber} />
        <Html x={1290} y={BOT.y(Pw(tt))} size={20} anchor="left" color={C.amber}>
          <Tex tex={`E'(${nt(tt, 2)})=${nt(Pw(tt), 1)}`} />
        </Html>
        {beat === 0 && (
          <>
            <rect x={TOP.x(0) - 10} y={TOP.y(0)} width={TOP.box.w + 20} height={60} fill="transparent" onPointerDown={onT} />
            <Knob x={TOP.x(t)} y={TOP.y(0) + 28} onPointerDown={onT} cursor="ew-resize" label={hhmm(3.2 + t)} />
          </>
        )}
        {beat === 1 && answer !== null && (
          <Html x={TOP.x(1) + 20} y={TOP.y(E(1)) + 40} size={20} anchor="left" color={C.green}>
            <span>aquí la curva es más empinada</span>
          </Html>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    const T = plane([0, 2], [30, 75], { x: 300, y: 110, w: 960, h: 520 });
    const ts = [0.3, 1, 1.6];
    return (
      <Stage>
        <Axes P={T} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[40, 50, 60, 70]} xLabel="t\ (\text{h})" yLabel="T\ (^\circ\text{C})" grid />
        <Curve P={T} f={temp} a={0} b={2} color={C.cyan} width={4} />
        <Group opacity={answer !== null ? 1 : 0}>
          {ts.map((s) => {
            const m = deriv(temp, s);
            return (
              <g key={s}>
                <Tangent P={T} f={temp} a={s} m={m} half={0.25} color={m > 0.5 ? C.green : m < -0.5 ? C.red : C.amber} />
                <Html x={T.x(s)} y={T.y(temp(s)) - 34} size={20} color={m > 0.5 ? C.green : m < -0.5 ? C.red : C.amber}>
                  <Tex tex={m > 0.5 ? "T'>0" : m < -0.5 ? "T'<0" : "T'=0"} />
                </Html>
              </g>
            );
          })}
        </Group>
        <Html x={800} y={700} size={20} color={C.muted}>
          <span>Temperatura del transformador de la carga oculta</span>
        </Html>
      </Stage>
    );
  }
  // beat 3: concavity
  const ts = [0.3, 0.7, 1.3, 1.7];
  return (
    <Stage>
      <Axes P={TOP} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[4, 8, 12, 16]} xLabel="t\ (\text{h})" yLabel="E" grid />
      <Curve P={TOP} f={E} a={0} b={1} color={C.green} width={5} />
      <Curve P={TOP} f={E} a={1} b={2} color={C.magenta} width={5} />
      {ts.map((s) => (
        <Tangent key={s} P={TOP} f={E} a={s} m={Pw(s)} half={0.2} color={C.amber} />
      ))}
      <Dot x={TOP.x(1)} y={TOP.y(E(1))} r={11} color={C.text} />
      <Axes P={BOT} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[4, 8, 12]} xLabel="t\ (\text{h})" yLabel="E'" grid />
      <Curve P={BOT} f={Pw} a={0} b={2} color={C.amber} width={4} />
      {answer !== null && (
        <>
          <Html x={TOP.x(0.45)} y={TOP.y(9)} size={20} color={C.green}>
            <Tex tex="E''>0" />
          </Html>
          <Html x={TOP.x(1.6)} y={TOP.y(7)} size={20} color={C.magenta}>
            <Tex tex="E''<0" />
          </Html>
          <Html x={TOP.x(1) + 18} y={TOP.y(E(1)) + 30} size={18} anchor="left" color={C.text}>
            <span>inflexión</span>
          </Html>
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
interface Shape {
  name: string;
  f: (x: number) => number;
  yr: [number, number];
}
const SHAPES: Shape[] = [
  { name: 'parábola', f: (x) => (x - 1) ** 2, yr: [-1, 2] },
  { name: 'joroba', f: (x) => Math.sin((Math.PI * x) / 2), yr: [-1.6, 1.6] },
  { name: 'S', f: (x) => 1 / (1 + Math.exp(-4 * (x - 1))), yr: [-0.2, 2.2] },
  { name: 'cúbica', f: (x) => (x - 1) ** 3 - (x - 1), yr: [-1, 2.2] },
  { name: 'valle', f: (x) => 1 - (x - 1) ** 2, yr: [-1, 2.2] },
  { name: 'recta', f: (x) => 0.8 * x - 0.4, yr: [-1, 1.4] },
];
function Mini({ P, f, color = C.cyan, yr }: { P: Plane; f: (x: number) => number; color?: string; yr: [number, number] }) {
  const g = (x: number) => clamp(f(x), yr[0], yr[1]);
  return (
    <g>
      <rect x={P.box.x} y={P.box.y} width={P.box.w} height={P.box.h} fill="#0a0818" stroke={C.line} />
      <Line a={P.pt(0, 0)} b={P.pt(2, 0)} color={C.dim} width={1.5} />
      <Curve P={P} f={g} a={0} b={2} color={color} width={4} />
    </g>
  );
}

function Pattern({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const pool = shuffle(r, SHAPES);
    const target = pool[0];
    const options = shuffle(r, [0, 1, 2]);
    // round 1: f'(t) with three sign changes
    const roots = [randInt(r, 1, 2) + 0.5, randInt(r, 3, 4), randInt(r, 5, 5) + 0.25 * randInt(r, 0, 2)];
    const sgn = r() < 0.5 ? 1 : -1;
    // round 2: logistic energy curve with the steepest point at c
    const c = pick(r, [0.8, 1, 1.2, 1.4]);
    const k = pick(r, [3, 4, 5]);
    return { pool, target, options, roots, sgn, c, k };
  }, [seed]);
  const [choice, setChoice] = useState<number | null>(null);
  const [cells, setCells] = useState<boolean[]>(() => Array(24).fill(false));
  const [tm, setTm] = useState(0.4);
  const Q = plane([0, 2], [0, 10], { x: 300, y: 130, w: 960, h: 520 });
  const onTm = useSvgDrag(svg, (x) => setTm(Math.round(clamp(Q.inv(x, 0)[0], 0, 2) * 50) / 50));
  const fp1 = (t: number) => (data.sgn * (t - data.roots[0]) * (t - data.roots[1]) * (t - data.roots[2])) / 6;
  const E2 = (t: number) => 10 / (1 + Math.exp(-data.k * (t - data.c)));

  useEffect(() => {
    if (round === 0) {
      api.prompt('Arriba, la gráfica de una medición $f$. Elige abajo cuál es la gráfica de su derivada $f\'$.', "f\\ \\to\\ f'");
      api.hints(['Donde $f$ tiene la tangente horizontal, $f\'$ vale 0 (cruza el eje).', 'Donde $f$ sube, $f\'$ está sobre el eje; donde baja, bajo el eje.']);
    } else if (round === 1) {
      api.prompt("Esta es la gráfica de la **derivada** $f'$ de una señal. Marca en el eje las horas en que la señal $f$ está creciendo.", "f'(t)>0\\iff f\\ \\text{crece}");
      api.hints(["No mires si $f'$ sube o baja: mira si está sobre o bajo el eje.", "$f$ crece donde $f'>0$."]);
    } else {
      api.prompt('Energía acumulada por otra carga. Mueve el marcador al instante de **máxima potencia**.', "\\max_t E'(t)");
      api.hints(['La potencia es la pendiente de $E$: busca donde la curva es más empinada.', 'Es el punto de inflexión: donde la curva deja de curvarse hacia arriba.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  // candidate derivative graphs for round 0: the right one and two impostors
  const cands = useMemo(() => {
    const right = (x: number) => deriv(data.target.f, x);
    const wrong1 = data.target.f;
    const wrong2 = (x: number) => -deriv(data.target.f, x);
    return [right, wrong1, wrong2];
  }, [data]);

  const submit = () => {
    if (round === 0) {
      if (choice === null) return;
      const which = data.options[choice];
      if (which === 0) return api.result(true, 'Donde $f$ tiene tangente horizontal, $f\'$ cruza el eje; donde $f$ sube, $f\'$ es positiva.');
      if (which === 1) return api.result(false, 'Esa es la misma $f$, no su pendiente. Mira dónde $f$ tiene tangente horizontal: ahí $f\'$ debe valer 0.');
      return api.result(false, 'Tiene el signo al revés: donde $f$ sube, esa gráfica queda bajo el eje.');
    }
    if (round === 1) {
      const truth = cells.map((_, k) => fp1(k * 0.25 + 0.125) > 0);
      const k = truth.findIndex((v, i) => v !== cells[i]);
      if (k < 0) return api.result(true, "Exacto: $f$ crece donde $f'$ está sobre el eje, aunque $f'$ esté bajando.");
      const tt = k * 0.25 + 0.125;
      return api.result(false, `Cerca de t = ${dec(tt, 2)}, $f'$ vale ${dec(fp1(tt), 2)}: ${truth[k] ? 'positiva, así que $f$ crece ahí' : 'negativa, así que $f$ decrece ahí'}.`);
    }
    const slope = (t: number) => deriv(E2, t);
    if (Math.abs(tm - data.c) <= 0.08) return api.result(true, `Máxima potencia en t = ${dec(data.c, 2)} h: $E'=${nt(slope(data.c), 2)}$ MW. Es la inflexión de $E$.`);
    return api.result(false, `En t = ${dec(tm, 2)} la pendiente es ${dec(slope(tm), 2)} MW; en t = ${dec(data.c, 2)} es ${dec(slope(data.c), 2)} MW.`);
  };

  if (round === 0) {
    const top = plane([0, 2], data.target.yr, { x: 500, y: 90, w: 600, h: 300 });
    return (
      <Stage>
        <Mini P={top} f={data.target.f} yr={data.target.yr} />
        <Html x={470} y={240} size={26} anchor="right" color={C.cyan}>
          <Tex tex="f" />
        </Html>
        {data.options.map((which, i) => {
          const P2 = plane([0, 2], [-3, 3], { x: 220 + i * 400, y: 470, w: 340, h: 260 });
          return (
            <g key={i} onClick={() => setChoice(i)} style={{ cursor: 'pointer' }}>
              <Mini P={P2} f={cands[which]} yr={[-3, 3]} color={choice === i ? C.amber : C.violet} />
              <rect x={P2.box.x - 6} y={P2.box.y - 6} width={P2.box.w + 12} height={P2.box.h + 12} fill="transparent" stroke={choice === i ? C.amber : 'transparent'} strokeWidth={3} />
              <Html x={P2.box.x + P2.box.w / 2} y={P2.box.y + P2.box.h + 26} size={20} color={choice === i ? C.amber : C.muted}>
                <span>{['A', 'B', 'C'][i]}</span>
              </Html>
            </g>
          );
        })}
        <Confirm onClick={submit} disabled={choice === null} />
      </Stage>
    );
  }
  if (round === 1) {
    const R = plane([0, 6], [-3, 3], { x: 300, y: 130, w: 960, h: 480 });
    return (
      <Stage>
        <Axes P={R} xTicks={[0, 1, 2, 3, 4, 5, 6]} yTicks={[-2, 0, 2]} xLabel="t" yLabel="f'" grid />
        <Curve P={R} f={(t) => clamp(fp1(t), -3, 3)} a={0} b={6} color={C.amber} width={4} />
        <g>
          {cells.map((on, k) => (
            <rect key={k} x={R.x(k * 0.25) + 1} y={R.y(-3) + 20} width={R.sx * 0.25 - 2} height={36} fill={on ? C.green : '#ffffff10'} stroke="#ffffff30" style={{ cursor: 'pointer' }} onClick={() => setCells(cells.map((v, i) => (i === k ? !v : v)))} />
          ))}
        </g>
        <Html x={R.x(0)} y={R.y(-3) + 82} size={18} anchor="left" color={C.muted}>
          <span>Marca las celdas donde f crece</span>
        </Html>
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  return (
    <Stage ref={svg}>
      <Axes P={Q} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={[2, 4, 6, 8, 10]} xLabel="t\ (\text{h})" yLabel="E\ (\text{MWh})" grid />
      <Curve P={Q} f={E2} a={0} b={2} color={C.cyan} width={4} />
      <Line a={Q.pt(tm, 0)} b={Q.pt(tm, E2(tm))} color={C.text} dashed />
      <Dot x={Q.x(tm)} y={Q.y(E2(tm))} r={9} color={C.amber} />
      <rect x={Q.x(0) - 10} y={Q.y(0)} width={Q.box.w + 20} height={70} fill="transparent" onPointerDown={onTm} />
      <Knob x={Q.x(tm)} y={Q.y(0) + 32} onPointerDown={onTm} cursor="ew-resize" label={dec(tm, 2)} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c3',
  world: 'differential',
  code: '2.3',
  title: 'La gráfica del pico',
  subtitle: 'La derivada como función',
  glyph: "f'",
  kind: 'level',
  guide: 'iris',
  teaser: 'La energía acumulada no muestra el pico; su pendiente sí. Hay que dibujar la derivada completa.',
  learn: "Función derivada, relación entre el signo de $f'$ y el crecimiento de $f$, puntos con tangente horizontal, segunda derivada, concavidad e inflexión.",
  glyphs: ['dfun', 'second'],
  pitfalls: ["Donde $f$ es más alta no es donde $f'$ es más grande.", "Para saber si $f$ crece, importa el signo de $f'$, no si $f'$ sube o baja.", "En la inflexión, $f'$ tiene un máximo o un mínimo."],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'iris', text: 'El medidor de toda la noche. La curva solo sube: no se ve ningún pico.' },
        { who: 'nadia', text: 'Porque es energía acumulada. El pico está en la pendiente. Hay que dibujarla.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El patrón',
      Scene: PeakDemo,
      beats: [
        {
          say: 'Arriba, la energía. Al moverte por la curva, la pendiente de la tangente se anota abajo: nace una nueva función.',
          gate: 'Recorre la curva hasta el final de la noche.',
          note: { label: 'Función derivada', tex: "t\\ \\mapsto\\ E'(t)", body: 'A cada instante le asigna la pendiente de $E$ en ese instante. Aquí $E\'(t)=24t-12t^2$ MW.' },
        },
        {
          say: 'Abajo apareció un pico de potencia.',
          ask: {
            prompt: '¿En qué instante la potencia fue máxima?',
            options: ['En t = 1 h, donde E es más empinada', 'En t = 2 h, donde E es más alta', 'En t = 0, cuando se conecta'],
            answer: 0,
            explain: 'La potencia es la pendiente, no la altura. A las 2 h la energía acumulada es máxima, pero la curva ya está plana: la carga se está apagando.',
          },
          note: { label: 'Altura y pendiente', body: 'Lo que más se acumuló no es lo que más rápido crece.' },
        },
        {
          say: 'La temperatura del transformador sube, llega a un máximo y baja.',
          ask: {
            prompt: '¿Cómo es el signo de $T\'$?',
            options: ['Positivo antes del máximo, cero en el máximo y negativo después', 'Siempre positivo', 'Negativo antes del máximo y positivo después'],
            answer: 0,
            explain: 'Mientras sube, las tangentes suben; en el máximo, la tangente es horizontal; después bajan.',
          },
          note: { label: 'Signo de la derivada', tex: "\\begin{aligned}f'>0&\\Rightarrow f\\ \\text{crece}\\\\ f'<0&\\Rightarrow f\\ \\text{decrece}\\\\ f'=0&:\\ \\text{tangente horizontal}\\end{aligned}" },
        },
        {
          say: 'Volvamos a la energía. Antes de $t=1$ las tangentes son cada vez más empinadas; después, cada vez menos.',
          ask: {
            prompt: 'Entre $t=0$ y $t=1$, ¿qué hace la pendiente de $E$?',
            options: ['Aumenta: la curva se dobla hacia arriba', 'Disminuye', 'Es constante'],
            answer: 0,
            explain: 'La pendiente de la pendiente es la segunda derivada. Si es positiva, la curva es cóncava hacia arriba; en $t=1$ cambia de signo: inflexión.',
          },
          note: { label: 'Segunda derivada', tex: "f''=(f')'", body: "$f''>0$: cóncava hacia arriba. $f''<0$: hacia abajo. En la inflexión cambia el signo y $f'$ es máxima o mínima." },
        },
      ],
    },
    { kind: 'challenge', title: 'El patrón', Comp: Pattern, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'El pico es a las 04:12, todas las noches. Doce megawatts. Ningún equipo de la planta consume eso.' },
        { who: 'teo', text: 'En la sala de máquinas hay modelos de cada equipo. Si los derivamos, sabremos cuál miente.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'dfun', world: 'differential', tex: "f'(x)", name: 'Función derivada', read: 'efe prima', meaning: 'Función que a cada $x$ le asigna la pendiente de $f$ en $x$.' },
  { id: 'second', world: 'differential', tex: "f''(x)", name: 'Segunda derivada', read: 'efe segunda', meaning: "Derivada de $f'$: mide cómo cambia la pendiente (concavidad)." },
];
