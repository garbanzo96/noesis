import { useEffect, useMemo, useRef, useState } from 'react';
import { Ship } from '../../art/props';
import { clamp, fmt } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane, type Plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { rng } from '../shared/rng';

// ============================================================================
// CASO 1.2 · «La marea» — funciones y gráficas
// Mareógrafo → función h(t); una altura por hora; evaluar en la gráfica; resolver h(t) ≥ 3
// con una línea horizontal; máximo; dominio e imagen; creciente/decreciente.
// ============================================================================

const dec = (v: number, d = 1) => fmt(v, d).replace('.', ',');
const hhmm = (t: number) => {
  const h = Math.floor(t + 1e-9);
  const m = Math.round((t - h) * 60);
  return `${String(h % 24).padStart(2, '0')}:${String(m === 60 ? 0 : m).padStart(2, '0')}`;
};
const PERIOD = 12.4;
interface Tide {
  m: number;
  a: number;
  phi: number;
}
const tideAt = (T: Tide) => (t: number) => T.m + T.a * Math.cos((2 * Math.PI * (t - T.phi)) / PERIOD);
const DEMO_TIDE: Tide = { m: 2.4, a: 1.6, phi: 3 };
const hD = tideAt(DEMO_TIDE);

/** Mark the set {t : h(t) ≥ c} on the time axis by sampling. */
function windows(h: (t: number) => number, c: number, step = 0.02): [number, number][] {
  const out: [number, number][] = [];
  let start: number | null = null;
  for (let t = 0; t <= 24 + 1e-9; t += step) {
    const ok = h(t) >= c;
    if (ok && start === null) start = t;
    if (!ok && start !== null) {
      out.push([start, t - step]);
      start = null;
    }
  }
  if (start !== null) out.push([start, 24]);
  return out;
}

function Gauge({ x, level, P }: { x: number; level: number; P: Plane }) {
  const y = (v: number) => P.y(v);
  return (
    <g>
      <rect x={x - 14} y={y(5.2)} width={28} height={y(0) - y(5.2) + 30} fill="#1d1733" stroke="#3d3160" strokeWidth={3} />
      {[0, 1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={x - 14} x2={x + 6} y1={y(v)} y2={y(v)} stroke={C.amber} strokeWidth={3} />
          <Html x={x - 30} y={y(v)} size={18} anchor="right" color={C.muted}>
            <span className="prop-tag">{v} m</span>
          </Html>
        </g>
      ))}
      <rect x={x - 150} y={y(level)} width={300} height={y(0) - y(level) + 40} fill="#0f3a52" opacity={0.85} />
      <line x1={x - 150} x2={x + 150} y1={y(level)} y2={y(level)} stroke={C.cyan} strokeWidth={3} />
      <Ship x={x + 20} y={y(level) - 26} s={0.32} lights />
    </g>
  );
}

// ---------------------------------------------------------------- demo
function TideDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const P = plane([0, 24], [0, 5], { x: 560, y: 100, w: 940, h: 600 });
  const [t, setT] = useState(0);
  const [reach, setReach] = useState(0);
  const [c, setC] = useState(1.5);
  const onTime = useSvgDrag(svg, (x) => {
    let v = clamp(P.inv(x, 0)[0], 0, 24);
    if (beat === 2) {
      v = Math.round(v * 4) / 4;
      if (Math.abs(v - 15) < 0.13) {
        v = 15;
        unlock();
      }
    }
    setT(v);
    if (beat === 0) {
      setReach((r) => Math.max(r, v));
      if (v > 23.5) unlock();
    }
  });
  const onLevel = useSvgDrag(svg, (_x, y) => {
    if (beat !== 3) return;
    let v = Math.round(clamp(P.inv(0, y)[1], 0, 5) * 10) / 10;
    if (Math.abs(v - 3) < 0.08) {
      v = 3;
      unlock();
    }
    setC(v);
  });
  const rev4 = useTween(beat > 4 || (beat === 4 && answer !== null) ? 1 : 0, 1);
  const tShown = beat === 0 ? t : beat === 2 ? t : beat === 1 ? 9.2 : t;
  const drawn = beat === 0 ? reach : 24;
  const cShown = beat >= 3 ? (beat === 3 ? c : 3) : null;
  const wins = cShown !== null ? windows(hD, cShown) : [];

  return (
    <Stage ref={svg}>
      <Gauge x={260} level={hD(tShown)} P={P} />
      <Axes P={P} xTicks={[0, 3, 6, 9, 12, 15, 18, 21, 24]} yTicks={[1, 2, 3, 4, 5]} xLabel="t\ (\text{h})" yLabel="h\ (\text{m})" grid />
      <Curve P={P} f={hD} a={0} b={Math.max(0.01, drawn)} color={C.cyan} width={4} />
      {/* beat 1: two hours with the same height */}
      <Group opacity={beat === 1 ? at(1) : 0}>
        {[3 - 2.34, 3 + 2.34].map((tt) => (
          <g key={tt}>
            <Line a={P.pt(tt, 0)} b={P.pt(tt, 3)} color={C.amber} dashed width={2} />
            <Dot x={P.x(tt)} y={P.y(3)} r={8} color={C.amber} />
          </g>
        ))}
        <Line a={P.pt(0, 3)} b={P.pt(24, 3)} color={C.amber} width={1.5} dashed />
        <Html x={P.x(3)} y={P.y(1.5)} size={20} color={C.amber}>
          <span>dos horas, la misma altura</span>
        </Html>
      </Group>
      {/* time cursor */}
      {(beat === 0 || beat === 2) && (
        <g>
          <Line a={P.pt(tShown, 0)} b={P.pt(tShown, hD(tShown))} color={C.text} dashed width={2} />
          <Line a={P.pt(0, hD(tShown))} b={P.pt(tShown, hD(tShown))} color={C.text} dashed width={1.5} />
          <Dot x={P.x(tShown)} y={P.y(hD(tShown))} r={10} color={C.text} />
          <Html x={P.x(tShown)} y={P.y(hD(tShown)) - 34} size={22} color={C.text}>
            <Tex tex={`h(${dec(tShown, 2)})=${dec(hD(tShown), 2)}`} />
          </Html>
          <g style={{ cursor: 'ew-resize' }} onPointerDown={onTime}>
            <rect x={P.x(0) - 20} y={P.y(0) - 10} width={P.box.w + 40} height={70} fill="transparent" />
            <circle cx={P.x(tShown)} cy={P.y(0) + 30} r={18} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
            <Html x={P.x(tShown)} y={P.y(0) + 30} size={14} color={C.cyan}>
              <span className="prop-tag">{hhmm(tShown)}</span>
            </Html>
          </g>
        </g>
      )}
      {/* threshold line and windows */}
      {cShown !== null && (
        <g>
          {wins.map(([a, b], i) => (
            <g key={i}>
              <rect x={P.x(a)} y={P.y(5)} width={P.x(b) - P.x(a)} height={P.box.h} fill={C.green} opacity={0.08} />
              <rect x={P.x(a)} y={P.y(0) + 6} width={P.x(b) - P.x(a)} height={12} fill={C.green} opacity={0.8} />
            </g>
          ))}
          <Line a={P.pt(0, cShown)} b={P.pt(24, cShown)} color={C.amber} width={3} />
          <g style={{ cursor: beat === 3 ? 'ns-resize' : undefined }} onPointerDown={beat === 3 ? onLevel : undefined}>
            <rect x={P.x(24) - 10} y={P.y(cShown) - 24} width={90} height={48} fill="transparent" />
            <circle cx={P.x(24) + 30} cy={P.y(cShown)} r={16} fill={C.panel} stroke={C.amber} strokeWidth={3} />
          </g>
          <Html x={P.x(24) + 60} y={P.y(cShown)} size={20} anchor="left" color={C.amber}>
            <Tex tex={`${dec(cShown)}\\ \\text{m}`} />
          </Html>
        </g>
      )}
      {/* max */}
      <Group opacity={rev4 * (beat <= 4 ? 1 : 0.5)}>
        {[3, 3 + PERIOD].map((tt) => (
          <g key={tt}>
            <Dot x={P.x(tt)} y={P.y(4)} r={10} color={C.magenta} />
            <Html x={P.x(tt)} y={P.y(4) - 30} size={20} color={C.magenta}>
              <span>{hhmm(tt)}</span>
            </Html>
          </g>
        ))}
      </Group>
      {/* domain and image */}
      <Group opacity={beat >= 5 ? at(5) : 0}>
        <rect x={P.x(0)} y={P.y(0) + 46} width={P.box.w} height={8} fill={C.cyan} opacity={0.8} />
        <Html x={P.x(12)} y={P.y(0) + 76} size={20} color={C.cyan}>
          <Tex tex="\mathrm{Dom}(h)=[0,24]" />
        </Html>
        <rect x={P.x(0) - 30} y={P.y(4)} width={8} height={P.y(0.8) - P.y(4)} fill={C.amber} opacity={0.8} />
        <Html x={P.x(0) - 44} y={P.y(2.4)} size={20} anchor="right" color={C.amber}>
          <Tex tex="\mathrm{Im}(h)" />
        </Html>
      </Group>
      {/* increasing / decreasing */}
      <Group opacity={beat >= 6 ? at(6) : 0}>
        <Curve P={P} f={hD} a={9.2} b={15.4} color={C.green} width={7} />
        <Curve P={P} f={hD} a={3} b={9.2} color={C.red} width={7} />
        <Html x={P.x(12.3)} y={P.y(1.2)} size={20} color={C.green}>
          <span>sube</span>
        </Html>
        <Html x={P.x(6)} y={P.y(1.2)} size={20} color={C.red}>
          <span>baja</span>
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function genTide(seed: number): { T: Tide; c: number } {
  const r = rng(seed);
  const T = { m: 2.2 + r() * 0.5, a: 1.2 + r() * 0.6, phi: 1 + r() * 5 };
  const c = [2.8, 3.0, 3.2][Math.floor(r() * 3)];
  return { T, c };
}

function Docking({ seed, round, api }: ChallengeProps) {
  const { T, c } = useMemo(() => genTide(seed), [seed]);
  const h = useMemo(() => tideAt(T), [T]);
  const svg = useRef<SVGSVGElement>(null);
  const P = plane([0, 24], [0, 5], { x: 260, y: 120, w: 1200, h: 520 });
  // round 0: paint half-hour cells; round 1: find the lowest tide; round 2: place a 2-hour unloading slot
  const [cells, setCells] = useState<boolean[]>(() => Array(48).fill(false));
  const [tLow, setTLow] = useState(12);
  const [slot, setSlot] = useState(4);
  const painting = useRef<boolean | null>(null);
  const cellAt = (x: number) => clamp(Math.floor(P.inv(x, 0)[0] * 2), 0, 47);
  const onPaint = useSvgDrag(svg, (x, _y, phase) => {
    const k = cellAt(x);
    if (phase === 'start') painting.current = !cells[k];
    if (painting.current === null) return;
    const val = painting.current;
    if (cells[k] !== val) setCells((cs) => cs.map((v, i) => (i === k ? val : v)));
    if (phase === 'end') painting.current = null;
  });
  const onLow = useSvgDrag(svg, (x) => setTLow(Math.round(clamp(P.inv(x, 0)[0], 0, 24) * 4) / 4));
  const onSlot = useSvgDrag(svg, (x) => setSlot(Math.round(clamp(P.inv(x, 0)[0] - 1, 0, 22) * 4) / 4));
  const truth = useMemo(() => Array.from({ length: 48 }, (_, k) => h(k / 2 + 0.25) >= c), [h, c]);
  // lowest tide in [0,24]
  const tMin = useMemo(() => {
    let best = 0;
    for (let tt = 0; tt <= 24; tt += 0.01) if (h(tt) < h(best)) best = tt;
    return best;
  }, [h]);

  useEffect(() => {
    if (round === 0) {
      api.prompt(`El buque necesita al menos $${dec(c)}$ m de marea. Pinta en el eje del tiempo las medias horas en que puede atracar.`, `\\{t:\\ h(t)\\ge ${dec(c)}\\}`);
      api.hints(['Imagina la recta horizontal a esa altura: sirven las horas en que la curva queda por encima.', `Hay ${windows(h, c).length} ventana(s) en el día.`]);
    } else if (round === 1) {
      api.prompt('Los buzos solo pueden revisar el casco con la marea **más baja** del día. Arrastra el marcador a esa hora.', '\\min_t h(t)');
      api.hints(['Busca el punto más bajo de la curva y baja hasta el eje del tiempo.', `Está cerca de las ${hhmm(tMin)}.`]);
    } else {
      api.prompt(`Descargar toma 2 horas y durante **todo** ese tiempo la marea debe estar sobre $${dec(c)}$ m. Arrastra la franja de descarga a una posición válida.`, `h(t)\\ge ${dec(c)}\\ \\ \\text{para todo}\\ t\\in[t_0,\\,t_0+2]`);
      api.hints(['La franja completa debe caber dentro de una ventana verde.', `Ventanas: ${windows(h, c).map(([a, b]) => `${hhmm(a)}–${hhmm(b)}`).join(', ')}.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, T]);

  const submit = () => {
    if (round === 0) {
      const k = truth.findIndex((v, i) => v !== cells[i]);
      if (k < 0) return api.result(true, `Ventanas: ${windows(h, c).map(([a, b]) => `${hhmm(a)}–${hhmm(b)}`).join(' y ')}.`);
      const tt = k / 2 + 0.25;
      const span = `${hhmm(k / 2)}–${hhmm(k / 2 + 0.5)}`;
      return api.result(false, truth[k] ? `Falta ${span}: a las ${hhmm(tt)} la marea marca ${dec(h(tt), 2)} m, sobre ${dec(c)} m.` : `Sobra ${span}: a las ${hhmm(tt)} la marea marca ${dec(h(tt), 2)} m, bajo ${dec(c)} m.`);
    }
    if (round === 1) {
      if (Math.abs(tLow - tMin) <= 0.3) return api.result(true, `Mínimo a las ${hhmm(tMin)}: $h=${dec(h(tMin), 2)}$ m.`);
      return api.result(false, `A las ${hhmm(tLow)} la marea está en ${dec(h(tLow), 2)} m, pero a las ${hhmm(tMin)} baja hasta ${dec(h(tMin), 2)} m.`);
    }
    let worst = slot;
    for (let tt = slot; tt <= slot + 2 + 1e-9; tt += 0.05) if (h(tt) < h(worst)) worst = tt;
    if (h(worst) >= c) return api.result(true, `De ${hhmm(slot)} a ${hhmm(slot + 2)} la marea nunca baja de ${dec(c)} m (mínimo ${dec(h(worst), 2)} m).`);
    return api.result(false, `A las ${hhmm(worst)} la marea cae a ${dec(h(worst), 2)} m, bajo ${dec(c)} m: el buque tocaría fondo.`);
  };

  const wins = windows(h, c);
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[0, 3, 6, 9, 12, 15, 18, 21, 24]} yTicks={[1, 2, 3, 4, 5]} xLabel="t\ (\text{h})" yLabel="h\ (\text{m})" grid />
      <Curve P={P} f={h} a={0} b={24} color={C.cyan} width={4} />
      {round !== 1 && <Line a={P.pt(0, c)} b={P.pt(24, c)} color={C.amber} width={2.5} dashed />}
      {round !== 1 && (
        <Html x={P.x(24) + 14} y={P.y(c)} size={20} anchor="left" color={C.amber}>
          <Tex tex={`${dec(c)}\\ \\text{m}`} />
        </Html>
      )}
      {round === 0 && (
        <g onPointerDown={onPaint} style={{ cursor: 'pointer' }}>
          {cells.map((on, k) => (
            <rect key={k} x={P.x(k / 2) + 1} y={P.y(0) + 10} width={P.sx / 2 - 2} height={36} fill={on ? C.green : '#ffffff10'} opacity={on ? 0.85 : 1} stroke="#ffffff30" />
          ))}
          <rect x={P.x(0)} y={P.y(0) + 6} width={P.box.w} height={46} fill="transparent" />
        </g>
      )}
      {round === 1 && (
        <g>
          <Line a={P.pt(tLow, 0)} b={P.pt(tLow, h(tLow))} color={C.text} dashed width={2} />
          <Dot x={P.x(tLow)} y={P.y(h(tLow))} r={10} color={C.text} />
          <Html x={P.x(tLow)} y={P.y(h(tLow)) + 34} size={20} color={C.text}>
            <Tex tex={`h=${dec(h(tLow), 2)}`} />
          </Html>
          <g onPointerDown={onLow} style={{ cursor: 'ew-resize' }}>
            <rect x={P.x(0) - 20} y={P.y(0)} width={P.box.w + 40} height={70} fill="transparent" />
            <circle cx={P.x(tLow)} cy={P.y(0) + 30} r={18} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
            <Html x={P.x(tLow)} y={P.y(0) + 30} size={14} color={C.cyan}>
              <span className="prop-tag">{hhmm(tLow)}</span>
            </Html>
          </g>
        </g>
      )}
      {round === 2 && (
        <g>
          {wins.map(([a, b], i) => (
            <rect key={i} x={P.x(a)} y={P.y(0) + 50} width={P.x(b) - P.x(a)} height={8} fill={C.green} opacity={0.5} />
          ))}
          <rect x={P.x(slot)} y={P.y(5)} width={P.x(slot + 2) - P.x(slot)} height={P.box.h} fill={C.violet} opacity={0.12} />
          <g onPointerDown={onSlot} style={{ cursor: 'ew-resize' }}>
            <rect x={P.x(0)} y={P.y(0) + 8} width={P.box.w} height={40} fill="transparent" />
            <rect x={P.x(slot)} y={P.y(0) + 10} width={P.x(slot + 2) - P.x(slot)} height={36} rx={6} fill={C.violet} opacity={0.85} />
            <Html x={P.x(slot + 1)} y={P.y(0) + 28} size={15} color={C.bg}>
              <span className="prop-tag">
                {hhmm(slot)}–{hhmm(slot + 2)}
              </span>
            </Html>
          </g>
        </g>
      )}
      <Html x={1500} y={800} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Confirmar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c2',
  world: 'foundations',
  code: '1.2',
  title: 'La marea',
  subtitle: 'Funciones y gráficas',
  glyph: 'h(t)',
  kind: 'level',
  guide: 'teo',
  teaser: 'El Altamar solo puede atracar con suficiente marea. Hay que leer la curva del mareógrafo para saber cuándo llegará.',
  learn: 'Función como regla entrada → salida, gráfica, evaluar, dominio e imagen, máximo y resolver desigualdades leyendo la curva.',
  glyphs: ['func', 'mapsto', 'dom', 'im'],
  pitfalls: ['Confundir el máximo (una altura) con el lugar donde ocurre (una hora).', 'Una función nunca da dos salidas para la misma entrada; dos entradas sí pueden compartir salida.'],
  steps: [
    {
      kind: 'scene',
      place: 'puerto',
      lines: [
        { who: 'teo', text: 'Conseguí el registro del mareógrafo del muelle 3. Una medición por minuto, todo el día.' },
        { who: 'iris', text: 'El Altamar carga mucho. Si la marea no le da, no entra.' },
        { who: 'teo', text: 'Necesita al menos 3 metros sobre el nivel base. Con la curva sabremos a qué hora puede llegar.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Mareógrafo',
      Scene: TideDemo,
      beats: [
        {
          say: 'A cada hora del día el mareógrafo le asigna una altura. Mueve la hora y mira cómo se dibuja la curva.',
          gate: 'Arrastra el reloj del eje horizontal desde las 00:00 hasta las 24:00.',
          note: { label: 'Función', tex: '\\begin{aligned}&h:[0,24]\\to\\mathbb R\\\\ &t\\mapsto h(t)\\end{aligned}', body: 'Entra una hora $t$; sale **una** altura $h(t)$, en metros.' },
        },
        {
          say: 'Fíjate en la línea de 3 m: la curva la cruza dos veces en la madrugada.',
          ask: {
            prompt: '¿Puede una misma hora tener dos alturas de marea?',
            options: ['No: en cada instante el agua está a una sola altura', 'Sí, cuando sube y baja', 'Depende del día'],
            answer: 0,
            explain: 'Una función asigna exactamente una salida a cada entrada. Lo contrario sí pasa: dos horas distintas con la misma altura, como las marcadas.',
          },
          note: { label: 'Una salida por entrada', body: 'Varias horas pueden compartir altura. Una hora no puede tener dos.' },
        },
        {
          say: 'Leer la gráfica es subir desde la hora hasta la curva y mirar el eje vertical.',
          gate: 'Arrastra el reloj hasta las 15:00.',
          note: { label: 'Evaluar', tex: 'h(15)\\approx 3{,}97\\ \\text{m}' },
        },
        {
          say: 'El Altamar necesita al menos 3 m. Las horas que sirven son las que dejan la curva por encima de esa línea.',
          gate: 'Arrastra la línea horizontal hasta 3 m.',
          note: { label: 'Resolver mirando la gráfica', tex: '\\{t:\\ h(t)\\ge 3\\}', body: 'Las horas de 00:40 a 05:20 y de 13:04 a 17:44. La solución es un conjunto de horas: aquí, la unión de dos intervalos.' },
        },
        {
          say: 'Iris quiere saber cuál es la marea más alta del día.',
          ask: {
            prompt: '¿Cuál es la marea máxima y cuándo ocurre?',
            options: ['4,0 m, a las 03:00 y a las 15:24', '5 m, a mediodía', '4,0 m, solo a las 03:00'],
            answer: 0,
            explain: 'El máximo es el punto más alto de la curva: 4,0 m. Ocurre dos veces porque la marea sube dos veces al día.',
          },
          note: { label: 'Máximo', tex: '\\max_t h(t)=4{,}0\\ \\text{m}', body: 'El valor máximo (4,0 m) y el lugar donde ocurre (las horas) son cosas distintas.' },
        },
        {
          say: 'El **dominio** son las horas registradas; la **imagen**, las alturas que efectivamente ocurren.',
          dur: 1.6,
          note: { label: 'Dominio e imagen', tex: '\\begin{aligned}\\mathrm{Dom}(h)&=[0,24]\\\\ \\mathrm{Im}(h)&=[0{,}8;\\,4{,}0]\\end{aligned}' },
        },
        {
          say: 'Donde la curva sube, la función es **creciente**; donde baja, **decreciente**.',
          dur: 1.6,
          note: { label: 'Crecer y decrecer', body: 'Creciente en un tramo: si $t_1<t_2$, entonces $h(t_1)<h(t_2)$. Decreciente: al revés.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Ventana de atraque', Comp: Docking, rounds: 3 },
    {
      kind: 'scene',
      place: 'puerto',
      lines: [
        { who: 'teo', text: 'Con la marea de hoy, la ventana se abre a las 00:40 y dura hasta las 05:20. El Altamar llegará de madrugada.' },
        { who: 'iris', text: 'Y alguien tiene que llevarse la carga en camión. Quiero los GPS de los camiones que retiraron su última carga.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'func', world: 'foundations', tex: 'f:A\\to B', name: 'Función', read: 'efe de A en B', meaning: 'Regla que asigna a cada elemento de $A$ (entradas) exactamente un elemento de $B$.' },
  { id: 'mapsto', world: 'foundations', tex: '\\mapsto', name: 'Se asigna a', read: 'va a', meaning: '$t\\mapsto h(t)$ dice a dónde va cada entrada.', warn: '$\\to$ va entre conjuntos; $\\mapsto$, entre elementos.' },
  { id: 'dom', world: 'foundations', tex: '\\mathrm{Dom}(f)', name: 'Dominio', read: 'dominio de efe', meaning: 'Conjunto de entradas permitidas.' },
  { id: 'im', world: 'foundations', tex: '\\mathrm{Im}(f)', name: 'Imagen', read: 'imagen de efe', meaning: 'Conjunto de salidas que la función alcanza de verdad.' },
];
