import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Truck } from '../../art/props';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng } from '../shared/rng';
import { Choices, Confirm, Knob, dec, hhmm } from '../shared/ui';

// ============================================================================
// CASO 1.3 · «El camión que mintió» — rectas y pendiente
// GPS (tiempo, distancia) → velocidad constante = recta; pendiente Δd/Δt; ordenada b;
// ajustar d = mt + b; tramo horizontal = detenido; intersección de dos rectas = encuentro.
// ============================================================================

export const P = plane([0, 4], [0, 160], { x: 280, y: 250, w: 1080, h: 500 });
export const ROAD = { x0: 280, x1: 1360, y: 140, km: 160 };
export const roadX = (km: number) => ROAD.x0 + (km / ROAD.km) * (ROAD.x1 - ROAD.x0);
export const X_TICKS = [0, 1, 2, 3, 4];
export const Y_TICKS = [20, 40, 60, 80, 100, 120, 140, 160];
/** Taller plane for the logbook rounds (longer trips). */
const PC = plane([0, 4], [0, 200], { x: 280, y: 150, w: 1080, h: 600 });
const YC_TICKS = [40, 80, 120, 160, 200];

/** The road seen from above: port on the left, km marks, vehicles placed by distance. */
export function Road({ children }: { children?: ReactNode }) {
  return (
    <g>
      <rect x={ROAD.x0 - 40} y={ROAD.y - 34} width={ROAD.x1 - ROAD.x0 + 80} height={68} fill="#120f22" stroke="#2b2340" />
      <line x1={ROAD.x0 - 40} x2={ROAD.x1 + 40} y1={ROAD.y} y2={ROAD.y} stroke={C.amber} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="18 14" />
      {[0, 40, 80, 120, 160].map((k) => (
        <g key={k}>
          <line x1={roadX(k)} x2={roadX(k)} y1={ROAD.y + 34} y2={ROAD.y + 44} stroke={C.muted} strokeWidth={2} />
          <Html x={roadX(k)} y={ROAD.y + 58} size={15} color={C.muted}>
            <span className="prop-tag">km {k}</span>
          </Html>
        </g>
      ))}
      <Html x={ROAD.x0 - 60} y={ROAD.y} size={16} anchor="right" color={C.cyan}>
        <span className="prop-tag">PUERTO</span>
      </Html>
      {children}
    </g>
  );
}


// ---------------------------------------------------------------- demo
function TruckDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const [t2, setT2] = useState(1.5);
  const [mC, setMC] = useState(30);
  const onTime = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(P.inv(x, 0)[0], 0, 4) * 20) / 20;
    setT(v);
    if (beat === 0 && v >= 4) unlock();
    if (beat === 5 && Math.abs(v - 2) < 0.03) unlock();
  });
  const onT2 = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(P.inv(x, 0)[0], 1.5, 4) * 4) / 4;
    setT2(v);
    if (v === 3) unlock();
  });
  const onSlope = useSvgDrag(svg, (_x, y) => {
    const d = clamp(P.inv(0, y)[1], 0, 160);
    const m = clamp(Math.round(d / 2.5 / 5) * 5, 10, 60);
    setMC(m);
    if (m === 50) unlock();
  });
  useEffect(() => {
    if (beat === 5) setT(0.5);
  }, [beat]);

  const dA = (s: number) => 30 * s;
  const dD = (s: number) => (s < 1 ? 60 * s : s < 1.5 ? 60 : 60 + 60 * (s - 1.5));
  const dPol = (s: number) => Math.max(0, 60 * (s - 1));
  const gpsA = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  const gpsC = [0.5, 1, 1.5, 2, 2.5, 3];

  return (
    <Stage ref={svg}>
      <Road>
        {beat <= 1 && <Truck x={roadX(dA(beat === 0 ? t : 4))} y={ROAD.y - 4} s={0.7} label="A" />}
        {beat === 2 && answer !== null && (
          <>
            <Truck x={roadX(0)} y={ROAD.y - 4} s={0.7} label="A" />
            <Truck x={roadX(20)} y={ROAD.y - 4} s={0.7} color={C.amber} label="B" />
          </>
        )}
        {beat === 3 && <Truck x={roadX(150)} y={ROAD.y - 4} s={0.7} color={C.magenta} label="C" />}
        {beat === 4 && <Truck x={roadX(60)} y={ROAD.y - 4} s={0.7} color={C.violet} label="D" />}
        {beat === 5 && (
          <>
            <Truck x={roadX(dA(t))} y={ROAD.y - 4} s={0.7} label="A" />
            <Truck x={roadX(dPol(t))} y={ROAD.y + 22} s={0.55} color={C.red} label="P" />
          </>
        )}
      </Road>
      <Axes P={P} xTicks={X_TICKS} yTicks={Y_TICKS} xLabel="t\ (\text{h})" yLabel="d\ (\text{km})" grid />

      {/* beat 0-2: truck A */}
      <Group opacity={beat <= 2 ? 1 : 0.18}>
        {gpsA.filter((s) => beat > 0 || s <= t + 1e-9).map((s) => (
          <Dot key={s} x={P.x(s)} y={P.y(dA(s))} r={7} color={C.cyan} />
        ))}
        {(beat > 0 || t > 0) && <Line a={P.pt(0, 0)} b={P.pt(beat === 0 ? t : 4, dA(beat === 0 ? t : 4))} color={C.cyan} width={3} />}
      </Group>
      {beat === 0 && (
        <g>
          <Line a={P.pt(t, 0)} b={P.pt(t, dA(t))} color={C.text} dashed />
          <Html x={P.x(t) + 14} y={P.y(dA(t)) - 26} size={20} anchor="left" color={C.text}>
            <Tex tex={`d=${dec(dA(t))}\\ \\text{km}`} />
          </Html>
        </g>
      )}
      {/* beat 1: slope triangle */}
      <Group opacity={beat === 1 ? at(1) : 0}>
        <Line a={P.pt(1, 30)} b={P.pt(t2, 30)} color={C.amber} width={3} />
        <Line a={P.pt(t2, 30)} b={P.pt(t2, dA(t2))} color={C.magenta} width={3} />
        <Html x={(P.x(1) + P.x(t2)) / 2} y={P.y(30) + 26} size={20} color={C.amber}>
          <Tex tex={`\\Delta t=${dec(t2 - 1, 2)}\\ \\text{h}`} />
        </Html>
        <Html x={P.x(t2) + 16} y={(P.y(30) + P.y(dA(t2))) / 2} size={20} anchor="left" color={C.magenta}>
          <Tex tex={`\\Delta d=${dec(dA(t2) - 30)}\\ \\text{km}`} />
        </Html>
        <Html x={P.x(0.4)} y={P.y(130)} size={26} anchor="left" color={C.text}>
          <Tex tex={`\\dfrac{\\Delta d}{\\Delta t}=\\dfrac{${dec(dA(t2) - 30)}\\ \\text{km}}{${dec(t2 - 1, 2)}\\ \\text{h}}=30\\ \\tfrac{\\text{km}}{\\text{h}}`} />
        </Html>
        <Dot x={P.x(1)} y={P.y(30)} r={9} color={C.amber} />
        <Dot x={P.x(t2)} y={P.y(dA(t2))} r={11} color={C.magenta} ring onPointerDown={beat === 1 ? onT2 : undefined} cursor="grab" />
      </Group>
      {/* beat 2: truck B, same slope, 20 km ahead */}
      <Group opacity={beat === 2 && answer !== null ? 1 : 0}>
        <Line a={P.pt(0, 20)} b={P.pt(4, 140)} color={C.amber} width={3} glow />
        <Html x={P.x(4) + 12} y={P.y(140)} size={20} anchor="left" color={C.amber}>
          <Tex tex="d=30t+20" />
        </Html>
        <Html x={P.x(4) + 12} y={P.y(120)} size={20} anchor="left" color={C.cyan}>
          <Tex tex="d=30t" />
        </Html>
        <Dot x={P.x(0)} y={P.y(20)} r={9} color={C.amber} />
        <Html x={P.x(0) + 16} y={P.y(20) - 22} size={18} anchor="left" color={C.amber}>
          <Tex tex="b=20" />
        </Html>
      </Group>
      {/* beat 3: fit truck C */}
      {beat === 3 && (
        <g>
          {gpsC.map((s) => (
            <Dot key={s} x={P.x(s)} y={P.y(50 * s)} r={8} color={C.magenta} />
          ))}
          <Line a={P.pt(0, 0)} b={P.pt(2.5, 2.5 * mC)} color={C.text} width={3} />
          <Knob x={P.x(2.5)} y={P.y(2.5 * mC)} color={C.text} onPointerDown={onSlope} cursor="ns-resize" />
          <Html x={P.x(2.5) + 40} y={P.y(2.5 * mC)} size={22} anchor="left" color={C.text}>
            <Tex tex={`m=${mC}\\ \\tfrac{\\text{km}}{\\text{h}}`} />
          </Html>
          <Html x={P.x(0.5)} y={P.y(155)} size={20} anchor="left" color={C.magenta}>
            <span>Declaración de C: «nunca pasé de 40 km/h»</span>
          </Html>
        </g>
      )}
      {/* beat 4: truck D stops */}
      {beat === 4 && (
        <g>
          {[0, 0.5, 1, 1.25, 1.5, 2, 2.5].map((s) => (
            <Dot key={s} x={P.x(s)} y={P.y(dD(s))} r={7} color={C.violet} />
          ))}
          <Line a={P.pt(0, 0)} b={P.pt(1, 60)} color={C.violet} width={3} />
          <Line a={P.pt(1, 60)} b={P.pt(1.5, 60)} color={answer !== null ? C.red : C.violet} width={answer !== null ? 7 : 3} />
          <Line a={P.pt(1.5, 60)} b={P.pt(2.5, 120)} color={C.violet} width={3} />
          {answer !== null && (
            <Html x={P.x(1.25)} y={P.y(60) + 34} size={20} color={C.red}>
              <span>detenido 30 min en el km 60</span>
            </Html>
          )}
        </g>
      )}
      {/* beat 5: patrol catches truck A */}
      {beat === 5 && (
        <g>
          <Line a={P.pt(0, 0)} b={P.pt(4, 120)} color={C.cyan} width={3} opacity={0.35} />
          <Line a={P.pt(1, 0)} b={P.pt(3.6, 156)} color={C.red} width={3} opacity={0.35} />
          <Line a={P.pt(0, 0)} b={P.pt(t, dA(t))} color={C.cyan} width={4} />
          {t > 1 && <Line a={P.pt(1, 0)} b={P.pt(t, dPol(t))} color={C.red} width={4} />}
          <Dot x={P.x(t)} y={P.y(dA(t))} r={8} color={C.cyan} />
          <Dot x={P.x(t)} y={P.y(dPol(t))} r={8} color={C.red} />
          <Html x={P.x(3.2)} y={P.y(40)} size={20} anchor="left" color={C.text}>
            <Tex tex={`\\begin{aligned}\\color{${C.cyan}}d_A&=30t\\\\ \\color{${C.red}}d_P&=60(t-1)\\end{aligned}`} />
          </Html>
        </g>
      )}
      {/* time handle (beats 0 and 5) */}
      {(beat === 0 || beat === 5) && (
        <g>
          <rect x={P.x(0) - 20} y={P.y(0)} width={P.box.w + 40} height={70} fill="transparent" onPointerDown={onTime} />
          <Knob x={P.x(t)} y={P.y(0) + 32} onPointerDown={onTime} cursor="ew-resize" label={hhmm(t)} />
        </g>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const NAMES = ['Ortiz', 'Fuentes', 'Navarro', 'Pizarro', 'Carrasco', 'Araya'];

function Logs({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const name = pick(r, NAMES);
    if (round === 0) {
      const m = pick(r, [35, 40, 45, 50, 55]);
      const b = pick(r, [0, 10, 20, 30]);
      const claim = r() < 0.5 ? m : m - pick(r, [10, 15]);
      return { name, m, b, claim, ts: [0.5, 1.5, 2, 3] };
    }
    if (round === 1) {
      const v = 60;
      const times = pick(r, [
        [0, 0.5, 1.5, 2, 3],
        [0, 1, 1.5, 2.5, 3],
        [0, 0.5, 1, 2, 2.5],
      ]);
      const k = 1 + Math.floor(r() * (times.length - 1));
      const segK = clamp(k - 1, 0, times.length - 2);
      const len = times[segK + 1] - times[segK];
      const stop = pick(r, [0.25, 0.5, 0.75].filter((s) => s < len));
      const ds = [0];
      for (let i = 1; i < times.length; i++) ds.push(ds[i - 1] + v * (times[i] - times[i - 1] - (i - 1 === segK ? stop : 0)));
      return { name, v, times, ds, segK, stop };
    }
    const v1 = pick(r, [30, 40]);
    const opts = [
      [60, 1],
      [80, 1],
      [60, 0.5],
      [90, 1],
    ].filter(([v2, t0]) => (v2 * t0) / (v2 - v1) <= 3.6);
    const [v2, t0] = pick(r, opts);
    return { name, v1, v2, t0, tm: (v2 * t0) / (v2 - v1) };
  }, [seed, round]);

  // round 0 state
  const [m, setM] = useState(20);
  const [b, setB] = useState(0);
  const onB = useSvgDrag(svg, (_x, y) => setB(clamp(Math.round(PC.inv(0, y)[1] / 5) * 5, 0, 60)));
  const onM = useSvgDrag(svg, (_x, y) => setM(clamp(Math.round((PC.inv(0, y)[1] - b) / 2 / 5) * 5, 0, 70)));
  // round 1 state
  const [seg, setSeg] = useState<number | null>(null);
  const [stopPick, setStopPick] = useState<number | null>(null);
  // round 2 state
  const [t, setT] = useState(0.5);
  const onTime = useSvgDrag(svg, (x) => setT(Math.round(clamp(P.inv(x, 0)[0], 0, 4) * 20) / 20));

  useEffect(() => {
    if (round === 0) {
      const d = data as { name: string; claim: number };
      api.prompt(`El chofer ${d.name} declaró ir a ${d.claim} km/h. Arrastra los dos puntos blancos para que la recta $d=mt+b$ pase por todos los registros del GPS.`, 'd=m\\,t+b');
      api.hints(['$b$ es la distancia en $t=0$: dónde corta la recta al eje vertical.', '$m$ es cuánto sube la distancia por cada hora: compara dos registros.']);
    } else if (round === 1) {
      const d = data as { name: string; v: number };
      api.prompt(`El camión de ${d.name} va siempre a ${d.v} km/h cuando se mueve, pero una vez se detuvo. Elige el tramo de la parada y cuánto duró.`, '\\text{velocidad del tramo}=\\frac{\\Delta d}{\\Delta t}');
      api.hints(['Calcula la velocidad de cada tramo: el que dé menos de 60 km/h esconde la parada.', 'A 60 km/h se recorre 1 km por minuto: compara los minutos del tramo con los kilómetros avanzados.']);
    } else {
      const d = data as { name: string; v1: number; v2: number; t0: number };
      api.prompt(`El camión de ${d.name} sale del puerto a las 00:00 a ${d.v1} km/h. Una patrulla sale a las ${hhmm(d.t0)} a ${d.v2} km/h. Mueve el reloj hasta el instante en que la alcanza.`, `${d.v1}\\,t=${d.v2}\\,(t-${dec(d.t0)})`);
      api.hints(['Se encuentran cuando están en el mismo kilómetro a la misma hora.', `Resuelve: $${d.v1}t=${d.v2}(t-${dec(d.t0)})$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      const d = data as { m: number; b: number; claim: number; ts: number[] };
      const bad = d.ts.find((s) => m * s + b !== d.m * s + d.b);
      if (bad === undefined) {
        const verdict = d.claim === d.m ? `Declaró ${d.claim} km/h y es cierto.` : `Declaró ${d.claim} km/h, pero iba a ${d.m}: mintió.`;
        return api.result(true, `$d=${d.m}t+${d.b}$. ${verdict}`);
      }
      return api.result(false, `A las ${hhmm(bad)} tu recta marca ${dec(m * bad + b)} km, pero el GPS registró ${dec(d.m * bad + d.b)} km.`);
    }
    if (round === 1) {
      const d = data as { v: number; times: number[]; ds: number[]; segK: number; stop: number };
      if (seg === null || stopPick === null) return;
      const speed = (i: number) => (d.ds[i + 1] - d.ds[i]) / (d.times[i + 1] - d.times[i]);
      if (seg !== d.segK)
        return api.result(false, `De ${hhmm(d.times[seg])} a ${hhmm(d.times[seg + 1])} avanzó ${dec(d.ds[seg + 1] - d.ds[seg])} km en ${dec((d.times[seg + 1] - d.times[seg]) * 60, 0)} min: ${dec(speed(seg))} km/h, sin parar.`);
      const moving = (d.ds[seg + 1] - d.ds[seg]) / d.v;
      if (stopPick !== d.stop)
        return api.result(false, `Ese es el tramo, pero ${dec(d.ds[seg + 1] - d.ds[seg])} km a 60 km/h toman ${dec(moving * 60, 0)} min; el tramo dura ${dec((d.times[seg + 1] - d.times[seg]) * 60, 0)} min.`);
      return api.result(true, `Avanzó ${dec(d.ds[seg + 1] - d.ds[seg])} km en ${dec((d.times[seg + 1] - d.times[seg]) * 60, 0)} min: ${dec(moving * 60, 0)} min en movimiento y ${dec(d.stop * 60, 0)} min detenido.`);
    }
    const d = data as { v1: number; v2: number; t0: number; tm: number };
    const a = d.v1 * t;
    const p = Math.max(0, d.v2 * (t - d.t0));
    if (Math.abs(t - d.tm) < 0.03) return api.result(true, `A las ${hhmm(d.tm)} los dos están en el km ${dec(d.v1 * d.tm)}: $${d.v1}t=${d.v2}(t-${dec(d.t0)})\\Rightarrow t=${dec(d.tm, 2)}$.`);
    return api.result(false, `A las ${hhmm(t)} el camión va en el km ${dec(a)} y la patrulla en el km ${dec(p)}: ${p < a ? 'todavía no lo alcanza' : 'ya lo pasó'}.`);
  };

  if (round === 0) {
    const d = data as { m: number; b: number; ts: number[]; name: string };
    return (
      <Stage ref={svg}>
        <Axes P={PC} xTicks={X_TICKS} yTicks={YC_TICKS} xLabel="t\ (\text{h})" yLabel="d\ (\text{km})" grid />
        {d.ts.map((s) => (
          <g key={s}>
            <Dot x={PC.x(s)} y={PC.y(d.m * s + d.b)} r={8} color={C.magenta} />
            <Html x={PC.x(s) + 12} y={PC.y(d.m * s + d.b) + 22} size={16} anchor="left" color={C.magenta}>
              <span className="prop-tag">
                {hhmm(s)} · {d.m * s + d.b} km
              </span>
            </Html>
          </g>
        ))}
        <Line a={PC.pt(0, b)} b={PC.pt(Math.min(4, m > 0 ? (200 - b) / m : 4), Math.min(200, m * 4 + b))} color={C.text} width={3} />
        <Knob x={PC.x(0)} y={PC.y(b)} color={C.text} onPointerDown={onB} cursor="ns-resize" />
        <Knob x={PC.x(2)} y={PC.y(m * 2 + b)} color={C.text} onPointerDown={onM} cursor="ns-resize" />
        <Html x={PC.x(2.7)} y={PC.y(25)} size={30} anchor="left" color={C.text}>
          <Tex tex={b ? `d=${m}\\,t+${b}` : `d=${m}\\,t`} />
        </Html>
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  if (round === 1) {
    const d = data as { times: number[]; ds: number[]; v: number };
    return (
      <Stage ref={svg}>
        <Axes P={PC} xTicks={X_TICKS} yTicks={YC_TICKS} xLabel="t\ (\text{h})" yLabel="d\ (\text{km})" grid />
        {d.times.slice(0, -1).map((s, i) => {
          const on = seg === i;
          return (
            <g key={i} onClick={() => setSeg(i)} style={{ cursor: 'pointer' }}>
              <line x1={PC.x(s)} y1={PC.y(d.ds[i])} x2={PC.x(d.times[i + 1])} y2={PC.y(d.ds[i + 1])} stroke="transparent" strokeWidth={36} />
              <Line a={PC.pt(s, d.ds[i])} b={PC.pt(d.times[i + 1], d.ds[i + 1])} color={on ? C.amber : C.violet} width={on ? 6 : 3.5} />
            </g>
          );
        })}
        {d.times.map((s, i) => (
          <g key={s}>
            <Dot x={PC.x(s)} y={PC.y(d.ds[i])} r={8} color={C.violet} />
            {i > 0 && <Html x={PC.x(s) - 10} y={PC.y(d.ds[i]) - 24} size={16} anchor="right" color={C.text}>
              <span className="prop-tag">
                {hhmm(s)} · {dec(d.ds[i])} km
              </span>
            </Html>}
          </g>
        ))}
        <Choices x={PC.x(0)} y={840} anchor="left" label="Duración de la parada:" options={[15, 30, 45]} value={stopPick === null ? null : stopPick * 60} onPick={(v) => setStopPick(v / 60)} render={(v) => `${v} min`} />
        <Confirm onClick={submit} disabled={seg === null || stopPick === null} />
      </Stage>
    );
  }
  const d = data as { v1: number; v2: number; t0: number };
  const a = d.v1 * t;
  const p = Math.max(0, d.v2 * (t - d.t0));
  return (
    <Stage ref={svg}>
      <Road>
        <Truck x={roadX(a)} y={ROAD.y - 4} s={0.7} label="" />
        <Truck x={roadX(p)} y={ROAD.y + 22} s={0.55} color={C.red} label="P" />
      </Road>
      <Axes P={P} xTicks={X_TICKS} yTicks={Y_TICKS} xLabel="t\ (\text{h})" yLabel="d\ (\text{km})" grid />
      <Line a={P.pt(0, 0)} b={P.pt(t, a)} color={C.cyan} width={4} />
      {t > d.t0 && <Line a={P.pt(d.t0, 0)} b={P.pt(t, p)} color={C.red} width={4} />}
      <Dot x={P.x(t)} y={P.y(a)} r={8} color={C.cyan} />
      <Dot x={P.x(t)} y={P.y(p)} r={8} color={C.red} />
      <rect x={P.x(0) - 20} y={P.y(0)} width={P.box.w + 40} height={70} fill="transparent" onPointerDown={onTime} />
      <Knob x={P.x(t)} y={P.y(0) + 32} onPointerDown={onTime} cursor="ew-resize" label={hhmm(t)} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c3',
  world: 'foundations',
  code: '1.3',
  title: 'El camión que mintió',
  subtitle: 'Rectas y pendiente',
  glyph: 'm',
  kind: 'level',
  guide: 'teo',
  teaser: 'Cuatro camiones retiraron la última carga del Altamar. Sus GPS cuentan una historia distinta a la de los choferes.',
  learn: 'Velocidad constante como recta $d=mt+b$, pendiente como cociente $\\Delta d/\\Delta t$, ordenada en el origen, pendiente cero y negativa, intersección de dos rectas.',
  glyphs: ['delta', 'slope', 'linear'],
  pitfalls: ['La pendiente es $\\Delta d/\\Delta t$, no $\\Delta t/\\Delta d$.', 'Dos rectas paralelas tienen la misma pendiente aunque partan de lugares distintos.', 'Que la gráfica esté alta no significa que el camión vaya rápido: la velocidad es la inclinación.'],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'teo', text: 'Cuatro camiones retiraron la última carga del Altamar. Tengo sus GPS: la distancia al puerto cada media hora.' },
        { who: 'iris', text: 'Y tengo las declaraciones de los choferes. Todos dicen que fueron directo a la Clínica del Cerro.' },
        { who: 'iris', text: 'Uno de ellos se detuvo donde no debía. Encuéntralo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Registros GPS',
      Scene: TruckDemo,
      beats: [
        {
          say: 'Arriba, la ruta. Abajo, el registro del camión A: cada punto es una hora y una distancia.',
          gate: 'Arrastra el reloj hasta las 04:00.',
          note: { label: 'Velocidad constante', tex: 'd(t)=30\\,t', body: 'A ritmo fijo, cada hora suma lo mismo: los puntos quedan sobre una **recta**.' },
        },
        {
          say: 'La inclinación de la recta es la velocidad: cuántos kilómetros sube por cada hora que avanza.',
          gate: 'Arrastra el punto rosado hasta que el triángulo tenga Δt = 2 h.',
          note: { label: 'Pendiente', tex: 'm=\\frac{\\Delta d}{\\Delta t}=\\frac{60\\ \\text{km}}{2\\ \\text{h}}=30\\ \\tfrac{\\text{km}}{\\text{h}}', body: 'Sirven dos puntos cualesquiera de la recta: el cociente no cambia.' },
        },
        {
          say: 'El camión B salió de la bodega de Rosa, que está en el km 20, también a 30 km/h.',
          ask: {
            prompt: '¿Cómo se ve la recta de B comparada con la de A?',
            options: ['Paralela, 20 km más arriba', 'Más inclinada', 'La misma recta'],
            answer: 0,
            explain: 'Misma velocidad, misma inclinación. Lo único que cambia es dónde empieza: en $t=0$ ya está en el km 20.',
          },
          note: { label: 'Ordenada en el origen', tex: 'd(t)=m\\,t+b', body: '$m$: velocidad. $b$: distancia en $t=0$. Para B: $d=30t+20$.' },
        },
        {
          say: 'El chofer C declaró que nunca pasó de 40 km/h. Sus registros GPS dicen otra cosa.',
          gate: 'Sube o baja el punto blanco hasta que la recta pase por los registros de C.',
          note: { label: 'Ajustar la recta', tex: 'm_C=50\\ \\tfrac{\\text{km}}{\\text{h}}>40', body: 'C mintió sobre la velocidad. Una multa, no un crimen.' },
        },
        {
          say: 'El camión D también tiene algo raro: entre 01:00 y 01:30 su gráfica queda plana.',
          ask: {
            prompt: '¿Qué hacía D entre 01:00 y 01:30?',
            options: ['Estaba detenido en el km 60', 'Iba a su velocidad máxima', 'Volvía hacia el puerto'],
            answer: 0,
            explain: 'Pendiente cero: pasa el tiempo y la distancia no cambia. Si la recta bajara, D se estaría acercando al puerto.',
          },
          note: { label: 'Pendiente cero y negativa', body: 'Plana: detenido. Bajando: vuelve hacia el puerto. D paró 30 min en el km 60.' },
        },
        {
          say: 'Una patrulla sale del puerto a la 01:00 a 60 km/h detrás del camión A. ¿Cuándo lo alcanza?',
          gate: 'Mueve el reloj hasta que los dos vehículos coincidan.',
          note: { label: 'Intersección', tex: '30t=60(t-1)\\iff t=2', body: 'A las 02:00, en el km 60: el punto que comparten las dos rectas.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Las bitácoras', Comp: Logs, rounds: 3 },
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'iris', text: 'El km 60 de la ruta del camión D. Ahí no hay clínica: hay una bodega abandonada.' },
        { who: 'teo', text: 'Mandé un dron. En la puerta hay una nota con números. Parece un mensaje cifrado.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'delta', world: 'foundations', tex: '\\Delta', name: 'Delta (cambio)', read: 'delta', meaning: '$\\Delta d$ es cuánto cambió $d$: valor final menos valor inicial.' },
  { id: 'slope', world: 'foundations', tex: 'm=\\frac{\\Delta y}{\\Delta x}', name: 'Pendiente', read: 'eme', meaning: 'Cuánto sube $y$ por cada unidad que avanza $x$. En distancia contra tiempo, es la velocidad.' },
  { id: 'linear', world: 'foundations', tex: 'y=mx+b', name: 'Recta', read: 'y igual eme equis más be', meaning: '$m$ es la pendiente y $b$ el valor cuando $x=0$.', warn: 'Si $b\\ne0$, duplicar $x$ no duplica $y$.' },
];
