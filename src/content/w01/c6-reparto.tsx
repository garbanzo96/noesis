import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng, shuffle } from '../shared/rng';
import { DragCue, Confirm, Knob, NumberField, dec, parseNum, thousands } from '../shared/ui';

// ============================================================================
// CASO 1.6 · «El reparto» — proporciones
// Repartir dosis según pacientes (misma cantidad por paciente), normalizar a fracciones que
// suman 1, porcentajes, y el promedio ponderado como punto de equilibrio de una balanza.
// ============================================================================

const SEDE = ['Puerto', 'Cerro', 'Norte'];
const TINT = [C.cyan, C.amber, C.magenta];
const SX0 = 260;
const SX1 = 1340;

function Person({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} opacity={0.85}>
      <circle cx={0} cy={-22} r={7} />
      <path d="M-10 0 Q-10 -13 0 -13 Q10 -13 10 0 Z" />
    </g>
  );
}

/** The dose strip divided at two cut points (in doses), with patients drawn above each part. */
function Strip({ total, cuts, patients, onCut, y = 520, showPer = true, fractions = false }: { total: number; cuts: [number, number]; patients: number[]; onCut?: (k: 0 | 1) => (e: PointerEvent) => void; y?: number; showPer?: boolean; fractions?: boolean }) {
  const X = (d: number) => SX0 + (d / total) * (SX1 - SX0);
  const parts = [cuts[0], cuts[1] - cuts[0], total - cuts[1]];
  const starts = [0, cuts[0], cuts[1]];
  const sumP = patients.reduce((a, b) => a + b, 0);
  return (
    <g>
      {parts.map((d, i) => {
        const x0 = X(starts[i]);
        const x1 = X(starts[i] + d);
        const per = patients[i] ? d / patients[i] : 0;
        const icons = Math.round(patients[i] / 50);
        return (
          <g key={i}>
            <rect x={x0} y={y} width={Math.max(0, x1 - x0)} height={80} fill={TINT[i]} opacity={0.28} stroke={TINT[i]} strokeWidth={2} />
            <Html x={(x0 + x1) / 2} y={y + 40} size={26} color={C.text}>
              <span className="prop-tag">{fractions ? dec(d / total, 2) : thousands(d)}</span>
            </Html>
            {showPer && (
              <Html x={(x0 + x1) / 2} y={y + 112} size={18} color={TINT[i]}>
                <span className="prop-tag">{dec(per, 2)} por paciente</span>
              </Html>
            )}
            {/* patients above */}
            <Html x={X(i === 0 ? 0 : i === 1 ? (patients[0] / sumP) * total : ((patients[0] + patients[1]) / sumP) * total) + 8} y={y - 140 - (i % 2) * 36} size={18} anchor="left" color={TINT[i]}>
              <span className="prop-tag">
                Sede {SEDE[i]} · {patients[i]} pacientes
              </span>
            </Html>
            {Array.from({ length: icons }, (_, k) => {
              const base = i === 0 ? 0 : i === 1 ? patients[0] : patients[0] + patients[1];
              const px = SX0 + ((base + 25 + k * 50) / sumP) * (SX1 - SX0);
              return <Person key={k} x={px} y={y - 40 - (k % 2) * 40} color={TINT[i]} s={1.3} />;
            })}
          </g>
        );
      })}
      {onCut &&
        ([0, 1] as const).map((k) => (
          <g key={k}>
            <line x1={X(cuts[k])} x2={X(cuts[k])} y1={y - 10} y2={y + 90} stroke={C.text} strokeWidth={3} />
            <Knob x={X(cuts[k])} y={y + 150} color={C.text} onPointerDown={onCut(k)} cursor="ew-resize" />
          </g>
        ))}
      <Html x={SX0} y={y + 210} size={18} anchor="left" color={C.muted}>
        <span className="prop-tag">0</span>
      </Html>
      <Html x={SX1} y={y + 210} size={18} anchor="right" color={C.muted}>
        <span className="prop-tag">{thousands(total)} dosis</span>
      </Html>
    </g>
  );
}

/** A beam with crates at price positions; the fulcrum is draggable and the beam tilts by torque. */
function Balance({ lots, fulcrum, onFulcrum, lo = 8, hi = 22, y = 470 }: { lots: { q: number; p: number }[]; fulcrum: number; onFulcrum?: (e: PointerEvent) => void; lo?: number; hi?: number; y?: number }) {
  const X = (p: number) => 280 + ((p - lo) / (hi - lo)) * 1040;
  const torque = lots.reduce((a, l) => a + l.q * (l.p - fulcrum), 0);
  const total = lots.reduce((a, l) => a + l.q, 0);
  const angle = useTween(clamp((torque / total) * 2.2, -9, 9), 0.5);
  const fx = X(fulcrum);
  return (
    <g>
      <g transform={`rotate(${angle} ${fx} ${y})`}>
        <rect x={X(lo)} y={y - 8} width={X(hi) - X(lo)} height={16} rx={4} fill="#2a2148" stroke={C.line} />
        {Array.from({ length: hi - lo + 1 }, (_, k) => (
          <line key={k} x1={X(lo + k)} x2={X(lo + k)} y1={y - 8} y2={y + 8} stroke={C.dim} />
        ))}
        {lots.map((l, i) => {
          const n = Math.round(l.q / 100);
          return (
            <g key={i}>
              {Array.from({ length: n }, (_, k) => (
                <rect key={k} x={X(l.p) - 26} y={y - 10 - (k + 1) * 24} width={52} height={22} rx={3} fill={TINT[i % 3]} opacity={0.8} stroke="#0006" />
              ))}
            </g>
          );
        })}
      </g>
      {/* HTML labels do not follow SVG rotation: place them at the rotated positions */}
      {lots.map((l, i) => {
        const n = Math.round(l.q / 100);
        const a = (angle * Math.PI) / 180;
        const dx = X(l.p) - fx;
        const dy = -44 - n * 24;
        return (
          <Html key={i} x={fx + dx * Math.cos(a) - dy * Math.sin(a)} y={y + dx * Math.sin(a) + dy * Math.cos(a)} size={17} color={TINT[i % 3]}>
            <span className="prop-tag">
              {l.q} a ${l.p}
            </span>
          </Html>
        );
      })}
      <path d={`M${fx} ${y + 10} L${fx - 34} ${y + 70} L${fx + 34} ${y + 70} Z`} fill={C.panel} stroke={Math.abs(torque) < total * 0.02 ? C.green : C.text} strokeWidth={3} onPointerDown={onFulcrum} style={{ cursor: onFulcrum ? 'ew-resize' : undefined }} />
      {onFulcrum && (
        <>
          <rect x={X(lo) - 20} y={y + 10} width={X(hi) - X(lo) + 40} height={80} fill="transparent" onPointerDown={onFulcrum} style={{ cursor: 'ew-resize' }} />
          <DragCue x={fx} y={y + 10} axis="x" color={Math.abs(torque) < total * 0.02 ? C.green : C.text} />
        </>
      )}
      <Html x={fx} y={y + 100} size={22} color={Math.abs(torque) < total * 0.02 ? C.green : C.text}>
        <span className="prop-tag">${dec(fulcrum, 2)}</span>
      </Html>
      {[lo, (lo + hi) / 2, hi].map((p) => (
        <Html key={p} x={X(p)} y={y + 30} size={15} color={C.dim}>
          <span className="prop-tag">${p}</span>
        </Html>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- demo
const PAT = [200, 300, 500];
const LOTS = [
  { q: 600, p: 10 },
  { q: 400, p: 12 },
  { q: 200, p: 20 },
];

function SplitDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [cuts, setCuts] = useState<[number, number]>([400, 800]);
  const [ful, setFul] = useState(15);
  const drag0 = useSvgDrag(svg, (x) => moveCut(0, x));
  const drag1 = useSvgDrag(svg, (x) => moveCut(1, x));
  function moveCut(k: 0 | 1, x: number) {
    const d = Math.round((((x - SX0) / (SX1 - SX0)) * 1200) / 60) * 60;
    setCuts((c) => {
      const n: [number, number] = [c[0], c[1]];
      n[k] = k === 0 ? clamp(d, 0, c[1]) : clamp(d, c[0], 1200);
      return n;
    });
  }
  useEffect(() => {
    if (beat === 0 && cuts[0] === 240 && cuts[1] === 600) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuts, beat]);
  const onFul = useSvgDrag(svg, (x) => {
    const p = Math.round((8 + ((x - 280) / 1040) * 14) * 20) / 20;
    const v = clamp(p, 8, 22);
    setFul(v);
    if (Math.abs(v - 37 / 3) < 0.06) unlock();
  });

  if (beat <= 2)
    return (
      <Stage ref={svg}>
        {beat === 0 && <Strip total={1200} cuts={cuts} patients={PAT} onCut={(k) => (k === 0 ? drag0 : drag1)} y={420} />}
        {beat === 1 && (
          <g>
            <Strip total={1200} cuts={[240, 600]} patients={PAT} y={420} showPer={false} fractions={answer !== null} />
            {answer !== null && (
              <Html x={800} y={680} size={30} color={C.text}>
                <Tex tex="\dfrac{200}{1000}+\dfrac{300}{1000}+\dfrac{500}{1000}=0{,}2+0{,}3+0{,}5=1" />
              </Html>
            )}
          </g>
        )}
        {beat === 2 && (
          <g>
            <Html x={800} y={150} size={24} color={C.muted}>
              <span>Sede Norte · dosis que debían llegar y dosis que llegaron</span>
            </Html>
            {Array.from({ length: 20 }, (_, k) => (
              <rect key={k} x={300 + (k % 10) * 100} y={250 + Math.floor(k / 10) * 130} width={86} height={110} rx={6} fill={k < 15 ? C.magenta : 'none'} opacity={k < 15 ? 0.6 : 1} stroke={k < 15 ? 'none' : C.red} strokeDasharray="6 6" strokeWidth={2} />
            ))}
            <Html x={800} y={560} size={22} color={C.muted}>
              <span>cada caja: 30 dosis</span>
            </Html>
            <Group opacity={answer !== null ? 1 : 0}>
              <Html x={800} y={660} size={32} color={C.text}>
                <Tex tex="\dfrac{450}{600}=\dfrac{75}{100}=75\,\%" />
              </Html>
              <Html x={800} y={760} size={24} color={C.red}>
                <span>Faltan 150 dosis</span>
              </Html>
            </Group>
          </g>
        )}
      </Stage>
    );
  return (
    <Stage ref={svg}>
      <Html x={800} y={130} size={22} color={C.muted}>
        <span>Facturas de la clínica · tres lotes de dosis a distinto precio (miles por dosis)</span>
      </Html>
      <Balance lots={LOTS} fulcrum={beat === 3 ? 15 : ful} onFulcrum={beat === 4 ? onFul : undefined} />
      {beat === 3 && answer !== null && (
        <Html x={800} y={720} size={26} color={C.text}>
          <Tex tex="\text{promedio simple: }\dfrac{10+12+20}{3}=14" />
        </Html>
      )}
      {beat === 4 && (
        <Html x={800} y={720} size={28} color={C.text}>
          <Tex tex="\bar p=\tfrac{600}{1200}\cdot10+\tfrac{400}{1200}\cdot12+\tfrac{200}{1200}\cdot20\approx12{,}33" />
        </Html>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Shortfall({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0: patients in hundreds, total chosen so each share is a multiple of the snap step
    const pats = shuffle(r, pick(r, [[100, 300, 600], [200, 200, 600], [100, 400, 500], [300, 300, 400], [200, 300, 500]]));
    const per = pick(r, [1.2, 1.5, 2]);
    const total = 1000 * per;
    const step = total / 20;
    // round 1
    const paid = pick(r, [1500, 2000, 2400, 2500]);
    const pct = pick(r, [60, 75, 80, 90]);
    // round 2
    const prices = shuffle(r, [9, 11, 14, 18, 20]).slice(0, 3).sort((a, b) => a - b);
    const qs = prices.map(() => pick(r, [100, 200, 300, 400, 500]));
    const lots = prices.map((p, i) => ({ p, q: qs[i] }));
    const avg = lots.reduce((a, l) => a + l.q * l.p, 0) / lots.reduce((a, l) => a + l.q, 0);
    return { pats, per, total, step, paid, pct, lots, avg };
  }, [seed]);
  const [cuts, setCuts] = useState<[number, number]>([data.total / 2, data.total / 2]);
  const moveCut = (k: 0 | 1, x: number) => {
    const d = Math.round((((x - SX0) / (SX1 - SX0)) * data.total) / data.step) * data.step;
    setCuts((c) => {
      const n: [number, number] = [c[0], c[1]];
      n[k] = k === 0 ? clamp(d, 0, c[1]) : clamp(d, c[0], data.total);
      return n;
    });
  };
  const drag0 = useSvgDrag(svg, (x) => moveCut(0, x));
  const drag1 = useSvgDrag(svg, (x) => moveCut(1, x));
  const [val, setVal] = useState('');
  const [ful, setFul] = useState(15);
  const onFul = useSvgDrag(svg, (x) => setFul(clamp(Math.round((8 + ((x - 280) / 1040) * 14) * 20) / 20, 8, 22)));

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Llegaron ${thousands(data.total)} dosis. Repártelas entre las tres sedes para que a cada paciente le toque lo mismo.`, 'd_i=\\frac{n_i}{\\sum_j n_j}\\cdot D');
      api.hints(['Mira las dosis por paciente bajo cada tramo: deben quedar iguales.', `Hay ${data.pats.reduce((a, b) => a + b, 0)} pacientes en total: a cada uno le tocan ${dec(data.per, 2)} dosis.`]);
    } else if (round === 1) {
      api.prompt(`La clínica pagó ${thousands(data.paid)} dosis y el inventario registra ${thousands((data.paid * data.pct) / 100)}. ¿Qué porcentaje de lo pagado llegó?`, '\\%=\\frac{\\text{parte}}{\\text{total}}\\cdot100');
      api.hints(['Divide lo que llegó por lo que se pagó.', 'Multiplica esa fracción por 100.']);
    } else {
      api.prompt('Otra factura, otros lotes. Mueve el apoyo hasta que la balanza quede en equilibrio: ese es el precio medio por dosis.', '\\bar p=\\frac{\\sum_i q_i\\,p_i}{\\sum_i q_i}');
      api.hints(['La balanza se inclina hacia el lado con más peso: mueve el apoyo hacia allá.', `Calcula $\\sum q_ip_i$ y divide por las ${data.lots.reduce((a, l) => a + l.q, 0)} dosis.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      const parts = [cuts[0], cuts[1] - cuts[0], data.total - cuts[1]];
      const pers = parts.map((d, i) => d / data.pats[i]);
      if (pers.every((p) => Math.abs(p - data.per) < 1e-9)) return api.result(true, `${parts.map(thousands).join(' + ')} = ${thousands(data.total)}: ${dec(data.per, 2)} dosis por paciente en las tres sedes.`);
      const hiI = pers.indexOf(Math.max(...pers));
      const loI = pers.indexOf(Math.min(...pers));
      return api.result(false, `Con tu reparto, en ${SEDE[hiI]} tocan ${dec(pers[hiI], 2)} dosis por paciente y en ${SEDE[loI]} solo ${dec(pers[loI], 2)}.`);
    }
    if (round === 1) {
      const v = parseNum(val);
      if (v === null) return;
      if (Math.abs(v - data.pct) < 0.5) return api.result(true, `${thousands((data.paid * data.pct) / 100)} / ${thousands(data.paid)} = ${dec(data.pct / 100, 2)} = ${data.pct} %. Faltan ${thousands((data.paid * (100 - data.pct)) / 100)} dosis.`);
      if (Math.abs(v - data.pct / 100) < 0.005) return api.result(false, `${dec(v, 2)} es la fracción. En porcentaje, multiplícala por 100.`);
      return api.result(false, `El ${dec(v)} % de ${thousands(data.paid)} son ${thousands((data.paid * v) / 100)} dosis, no ${thousands((data.paid * data.pct) / 100)}.`);
    }
    const tq = data.lots.reduce((a, l) => a + l.q, 0);
    if (Math.abs(ful - data.avg) <= 0.1) return api.result(true, `$\\bar p=${dec(data.avg, 2)}$. Más dosis en un precio tiran el promedio hacia ese precio.`);
    const torque = data.lots.reduce((a, l) => a + l.q * (l.p - ful), 0);
    return api.result(false, `Con el apoyo en ${dec(ful, 2)} la balanza cae hacia ${torque > 0 ? 'los precios altos' : 'los precios bajos'}: el promedio está ${torque > 0 ? 'más arriba' : 'más abajo'}. (${tq} dosis en total.)`);
  };

  if (round === 0)
    return (
      <Stage ref={svg}>
        <Strip total={data.total} cuts={cuts} patients={data.pats} onCut={(k) => (k === 0 ? drag0 : drag1)} y={380} />
        <Confirm onClick={submit} />
      </Stage>
    );
  if (round === 1) {
    const got = (data.paid * data.pct) / 100;
    return (
      <Stage ref={svg}>
        <Html x={800} y={170} size={24} color={C.muted}>
          <span>Pagado contra recibido (cada bloque: {thousands(data.paid / 20)} dosis)</span>
        </Html>
        {Array.from({ length: 20 }, (_, k) => {
          const on = k < Math.round((got / data.paid) * 20);
          return <rect key={k} x={300 + (k % 10) * 100} y={250 + Math.floor(k / 10) * 130} width={86} height={110} rx={6} fill={on ? C.cyan : 'none'} opacity={on ? 0.55 : 1} stroke={on ? 'none' : C.red} strokeDasharray="6 6" strokeWidth={2} />;
        })}
        <NumberField x={520} y={640} value={val} onChange={setVal} onEnter={submit} label="Llegó el" unit="% de lo pagado" width={4} />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  return (
    <Stage ref={svg}>
      <Balance lots={data.lots} fulcrum={ful} onFulcrum={onFul} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c6',
  world: 'foundations',
  code: '1.6',
  title: 'El reparto',
  subtitle: 'Proporciones',
  glyph: '\\%',
  kind: 'level',
  guide: 'iris',
  teaser: 'La clínica pagó 1 200 dosis para tres sedes. Cada sede atiende a distinta cantidad de pacientes, y una recibió menos de lo que le tocaba.',
  learn: 'Reparto proporcional, normalizar cantidades a fracciones que suman 1, porcentajes, y promedio ponderado como punto de equilibrio.',
  glyphs: ['ratio', 'percent', 'wavg'],
  pitfalls: ['El promedio de precios no es el precio medio si las cantidades son distintas.', 'Una fracción de 0,75 es un 75 %, no un 0,75 %.', 'Normalizar no cambia las proporciones: solo las expresa como partes de 1.'],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'nar', text: 'Oficina NÓESIS, diez de la noche. Nadie se había tomado el café, y ya estaba frío.' },
        { who: 'iris', text: 'La Clínica del Cerro pagó 1 200 dosis para tres sedes: Puerto, Cerro y Norte. Cada una atiende a una cantidad distinta de pacientes.' },
        { who: 'teo', text: 'Tengo los tres inventarios. Si solo miramos el total de la factura, un faltante en una sede no se ve.' },
        { who: 'tu', text: 'Calcularía cuánto le toca a cada sede antes de aceptar el total.' },
        { who: 'iris', text: 'Bien. Una factura ordenada no le sirve de nada a quien se quedó sin su dosis.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Reparto',
      Scene: SplitDemo,
      beats: [
        {
          say: 'La barra son las 1 200 dosis. Arriba, los pacientes de cada sede. Justo es que a cada paciente le toque lo mismo.',
          gate: 'Mueve los dos cortes hasta que las tres sedes reciban lo mismo por paciente.',
          note: { label: 'Reparto proporcional', tex: 'd_i=\\frac{n_i}{\\sum_j n_j}\\cdot1200', body: 'Puerto 240, Cerro 360, Norte 600: **1,2 dosis por paciente** en todas.' },
        },
        {
          say: 'Dividir por el total de pacientes convierte cada sede en una fracción del reparto.',
          ask: {
            prompt: 'Si la próxima vez llegan 2 000 dosis, ¿qué fracción le toca a Norte?',
            options: ['La misma: 0,5', 'Más de 0,5', 'Depende de cuántas dosis lleguen'],
            answer: 0,
            explain: 'La fracción depende solo de los pacientes: $500/1000=0{,}5$. Con 2 000 dosis, Norte recibe 1 000.',
          },
          note: { label: 'Normalizar', tex: 'w_i=\\frac{n_i}{\\sum_j n_j},\\qquad \\sum_i w_i=1', body: 'Las fracciones suman 1 y no cambian si cambia el total a repartir.' },
        },
        {
          say: 'El inventario de la sede Norte registra 450 dosis. Le correspondían 600.',
          ask: {
            prompt: '¿Qué porcentaje de sus dosis llegó a Norte?',
            options: ['75 %', '45 %', '150 %'],
            answer: 0,
            explain: '$450/600=0{,}75$, y 0,75 de 100 es 75. Faltan 150 dosis: la cuarta parte.',
          },
          note: { label: 'Porcentaje', tex: '\\frac{450}{600}=0{,}75=75\\,\\%', body: '«Por ciento»: cuántos de cada 100.' },
        },
        {
          say: 'La clínica compró en tres lotes: 600 dosis a 10, 400 a 12 y 200 a 20 (miles por dosis).',
          ask: {
            prompt: '¿Cuánto costó, en promedio, cada dosis?',
            options: ['Menos de 14: hay más dosis baratas', 'Exactamente 14', 'Más de 14'],
            answer: 0,
            explain: '14 es el promedio de los tres precios, pero las dosis baratas son muchas más. Con el apoyo en 14, la balanza cae hacia la izquierda.',
          },
          note: { label: 'Promedio de precios ≠ precio medio', body: 'Promediar los precios ignora cuántas dosis se compraron a cada uno.' },
        },
        {
          say: 'El precio medio es el punto donde la balanza queda en equilibrio.',
          gate: 'Arrastra el apoyo hasta equilibrar la balanza.',
          note: { label: 'Promedio ponderado', tex: '\\bar p=\\sum_i w_i\\,p_i\\approx12{,}33', body: 'Cada precio pesa según su fracción de las dosis: $w=\\tfrac{600}{1200},\\tfrac{400}{1200},\\tfrac{200}{1200}$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'El faltante', Comp: Shortfall, rounds: 3 },
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        { who: 'nar', text: 'Sala de servidores del puerto, once de la noche. Una luz roja parpadeaba en el rack del fondo, donde nadie había entrado en meses.' },
        { who: 'teo', text: 'A Norte le correspondían 600 dosis y llegaron 450: faltan 150. Salieron en un camión refrigerado que no figura en ninguna guía.' },
        { who: 'iris', text: '¿Quedó registrada la salida?' },
        { who: 'teo', text: 'Sí, pero el sistema de las grúas tiene un virus. Hace una hora eran 3 equipos infectados; ahora son 6.' },
        { who: 'iris', text: 'Entonces la prueba está en esa red, y alguien empezó a borrarla esta noche.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'ratio', world: 'foundations', tex: '\\frac{a}{b}', name: 'Razón', read: 'a sobre be', meaning: 'Cuánto hay de $a$ por cada unidad de $b$: dosis por paciente, km por hora.' },
  { id: 'percent', world: 'foundations', tex: 'p\\,\\%', name: 'Porcentaje', read: 'pe por ciento', meaning: 'La fracción $p/100$. 75 % es 0,75.' },
  { id: 'wavg', world: 'foundations', tex: '\\bar x=\\sum_i w_i x_i', name: 'Promedio ponderado', read: 'equis barra', meaning: 'Promedio en que cada valor pesa según su fracción $w_i$, con $\\sum_i w_i=1$.', warn: 'Si todos los pesos son iguales, es el promedio simple.' },
];
