import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Arrow, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { nt } from './kit';

// ============================================================================
// CASO 2.6 · «Engranajes» — regla de la cadena
// Turbina → engranaje intermedio → generador: las razones se multiplican. Composición con
// empujones dx → du → dy. (f∘g)' = f'(g)·g'. Razones relacionadas.
// ============================================================================

/** A spur gear: `teeth` rectangles around a disc, rotated by `angle` degrees. */
function Gear({ cx, cy, r, teeth, angle, color, label, opacity = 1 }: { cx: number; cy: number; r: number; teeth: number; angle: number; color: string; label?: string; opacity?: number }) {
  const tw = ((2 * Math.PI * r) / teeth) * 0.5;
  return (
    <g opacity={opacity}>
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        {Array.from({ length: teeth }, (_, k) => (
          <rect key={k} x={cx - tw / 2} y={cy - r - 12} width={tw} height={16} fill={color} opacity={0.85} transform={`rotate(${(360 / teeth) * k} ${cx} ${cy})`} />
        ))}
        <circle cx={cx} cy={cy} r={r} fill="#141126" stroke={color} strokeWidth={4} />
        <line x1={cx} y1={cy} x2={cx} y2={cy - r + 8} stroke={color} strokeWidth={6} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={9} fill={color} />
      </g>
      {label && (
        <Html x={cx} y={cy + r + 40} size={18} color={color}>
          <span>{label}</span>
        </Html>
      )}
    </g>
  );
}

// ---------------------------------------------------------------- lesson
function ChainLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(1);
  const onX = useSvgDrag(svg, (px) => {
    if (beat !== 0) return;
    const next = Math.round(clamp(1 + (px - 400) / 800, 1, 1.3) * 1000) / 1000;
    setX(next);
    if (next >= 1.1) unlock();
  });
  const showX = beat === 0 ? x : 1;
  const u = 3 * showX + 1;
  const y = u * u;
  if (beat <= 1) {
    // Angles follow the actual composition. Their local speed ratios are 3 and 2u.
    const angle = (showX - 1) * 120;
    return (
      <Stage ref={svg}>
        <Gear cx={420} cy={370} r={100} teeth={24} angle={angle} color={C.cyan} label="x" />
        <Gear cx={740} cy={370} r={100} teeth={24} angle={3 * angle} color={C.violet} label="u = 3x + 1" />
        <Gear cx={1060} cy={370} r={100} teeth={24} angle={(y - 16) * 120} color={C.amber} label="y = u²" />
        <Arrow from={[550, 370]} to={[610, 370]} color={C.violet} />
        <Arrow from={[870, 370]} to={[930, 370]} color={C.amber} />
        <Cap x={580} y={250} tex="\times3" color={C.violet} />
        <Cap x={900} y={250} tex={`\\times2u=\\times${nt(2 * u, 3)}`} color={C.amber} size={20} />
        <Cap x={740} y={150} tex={`x=${nt(showX, 3)},\\quad u=${nt(u, 3)},\\quad y=${nt(y, 3)}`} />
        <Cap x={800} y={540} tex="x=1:\quad u=4,\quad\frac{dy}{du}=8" />
        <Cap x={800} y={620} size={18}>Las flechas muestran una composición; las razones son locales.</Cap>
        {beat === 0 && <>
          <line x1={400} x2={640} y1={740} y2={740} stroke={C.line} strokeWidth={3} />
          <rect x={380} y={710} width={280} height={60} fill="transparent" onPointerDown={onX} style={{ cursor: 'ew-resize' }} />
          <Knob x={400 + (x - 1) * 800} y={740} onPointerDown={onX} cursor="ew-resize" label={`x=${dec(x, 3)}`} />
        </>}
        {beat === 1 && answer !== null && <Cap x={800} y={710} tex="\frac{dy}{dx}=8\cdot3=24\quad(x=1)" color={C.green} />}
      </Stage>
    );
  }
  if (beat === 3) return (
    <Stage>
      <circle cx={620} cy={370} r={210} fill={C.violet} fillOpacity={0.25} stroke={C.violet} strokeWidth={3} />
      <circle cx={620} cy={370} r={230} fill="none" stroke={C.amber} strokeWidth={20} strokeOpacity={0.4} />
      <Line a={[620, 370]} b={[830, 370]} color={C.text} />
      <Cap x={725} y={340} tex="r=3\ \text{cm}" />
      <Cap x={1150} y={240} tex="\frac{dr}{dt}=2\ \frac{\text{cm}}{\text{s}}" />
      <Cap x={1150} y={350} tex="\frac{dA}{dt}=2\pi r\,\frac{dr}{dt}" color={C.amber} />
      <Cap x={1150} y={460} size={22} tex={`12\\pi\\approx${nt(12 * Math.PI, 1)}\\ \\frac{\\text{cm}^2}{\\text{s}}`} />
    </Stage>
  );
  const rows = beat === 2 ? [
    "(f\\circ g)'(x)=f'(g(x))\\,g'(x)",
    "\\frac{d}{dx}(x^2+1)^5=5(x^2+1)^4\\cdot2x",
    "x=1:\\quad5\\cdot2^4\\cdot2=160",
  ] : ["\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx}", "(f\\circ g)'(x)=f'(g(x))\\,g'(x)"];
  return <Stage>{rows.map((tex, i) => <Cap key={tex} x={800} y={220 + i * 160} tex={tex} size={28} color={i === 0 ? C.cyan : C.amber} />)}</Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Regla de la cadena',
  Scene: ChainLesson,
  beats: [
    {
      say: 'La entrada pasa por dos etapas: $x\\to u=3x+1\\to y=u^2$. $u$ cambia tres veces más rápido que $x$; en $x=1$, $u=4$ e $y$ cambia ocho veces más rápido que $u$.',
      gate: 'Arrastra el control para girar el primer engranaje hasta x = 1,1 o más.',
      board: { label: 'Dos etapas', tex: '\\frac{du}{dx}=\\p{1}{\\cC{3}},\\qquad\\frac{dy}{du}=\\p{2}{\\cA{2u}}', body: 'En $x=1$: $u=4$ y $dy/du=8$. La segunda razón cambia con $u$.', parts: ['ritmo de la primera etapa', 'ritmo de la segunda etapa'] },
    },
    {
      say: 'Para obtener la razón total, multiplica las razones de las dos etapas. Evalúa cada una en el valor que le corresponde.',
      ask: { prompt: 'Si $u$ va 3 veces más rápido que $x$ e $y$ va 8 veces más rápido que $u$, ¿cuántas veces más rápido que $x$ va $y$?', options: ['24', '11', '8/3'], answer: 0, explain: 'Las razones se multiplican: $8\\cdot3=24$.' },
      board: { label: 'Regla de la cadena', tex: '\\frac{dy}{dx}=\\p{1}{\\cA{\\frac{dy}{du}}}\\cdot\\p{2}{\\cC{\\frac{du}{dx}}}', body: 'En $x=1$, $dy/dx=8\\cdot3=24$.', parts: ['ritmo de la etapa exterior', 'ritmo de la etapa interior'] },
    },
    {
      say: 'Deriva la función exterior en el valor de la interior y multiplica por la derivada interior. Para $(x^2+1)^5$, esos factores son $5(x^2+1)^4$ y $2x$.',
      dur: 3,
      board: [
        { label: 'Composición', tex: "(f\\circ g)'(x)=\\p{1}{f'(g(x))}\\,\\p{2}{g'(x)}", parts: ['derivada exterior evaluada', 'derivada de la interior'] },
        { tex: '\\frac{d}{dx}(x^2+1)^5=5(x^2+1)^4\\cdot2x', body: 'En $x=1$: $5\\cdot2^4\\cdot2=160$.' },
      ],
    },
    {
      say: 'El radio de un círculo crece a 2 cm/s. El área depende del radio y el radio depende del tiempo: usa la cadena para hallar el cambio del área.',
      dur: 3,
      board: [
        { label: 'Razones relacionadas', tex: 'A=\\pi r^2,\\qquad\\frac{dA}{dt}=2\\pi r\\,\\frac{dr}{dt}' },
        { tex: '\\left.\\frac{dA}{dt}\\right|_{r=3}=2\\pi\\cdot3\\cdot2=12\\pi\\approx37{,}7\\ \\frac{\\text{cm}^2}{\\text{s}}' },
      ],
    },
    {
      say: 'Las dos notaciones expresan la misma regla. La derivada de la composición multiplica las derivadas de sus etapas.',
      dur: 2.6,
      board: [
        { label: 'Por etapas', tex: '\\frac{dy}{dx}=\\p{1}{\\cA{\\frac{dy}{du}}}\\cdot\\p{2}{\\cC{\\frac{du}{dx}}}', parts: ['ritmo de la etapa exterior', 'ritmo de la etapa interior'] },
        { label: 'Composición', tex: "(f\\circ g)'(x)=\\p{1}{\\cA{f'(g(x))}}\\,\\p{2}{\\cC{g'(x)}}", parts: ['derivada exterior evaluada', 'derivada de la interior'] },
      ],
    },
  ],
};

export { lesson };

// ---------------------------------------------------------------- demo
function GearsDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [turn, setTurn] = useState(0); // turbine turns
  const [dx, setDx] = useState(0.3);
  const onTurn = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 300) / 900, 0, 1) * 100) / 100;
    setTurn(v);
    if (v >= 1) unlock();
  });
  const onDx = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 400) / 800, 0.01, 0.3) * 1000) / 1000;
    setDx(v);
    if (v <= 0.02) unlock();
  });

  if (beat === 0) {
    const aT = turn * 360;
    return (
      <Stage ref={svg}>
        <Gear cx={420} cy={420} r={150} teeth={36} angle={aT} color={C.cyan} label="Turbina" />
        <Gear cx={670} cy={420} r={110} teeth={28} angle={-3 * aT} color={C.violet} opacity={0.45} />
        <Gear cx={670} cy={420} r={50} teeth={12} angle={-3 * aT} color={C.violet} label="Intermedio" />
        <Gear cx={670} cy={232} r={27} teeth={7} angle={12 * aT} color={C.amber} label="" />
        <Html x={760} y={232} size={18} anchor="left" color={C.amber}>
          <span>Generador</span>
        </Html>
        <Html x={1250} y={250} size={22} anchor="left" color={C.cyan}>
          <span>turbina: {dec(turn, 2)} vueltas</span>
        </Html>
        <Html x={1250} y={300} size={22} anchor="left" color={C.violet}>
          <span>intermedio: {dec(3 * turn, 2)} vueltas</span>
        </Html>
        <Html x={1250} y={350} size={22} anchor="left" color={C.amber}>
          <span>generador: {dec(12 * turn, 2)} vueltas</span>
        </Html>
        <Formula x={1340} y={460} size={24} tex="\tfrac{dG}{dT}=\tfrac{dG}{dM}\cdot\tfrac{dM}{dT}=4\cdot3" />
        <line x1={300} x2={1200} y1={780} y2={780} stroke={C.line} strokeWidth={3} />
        <rect x={280} y={750} width={940} height={60} fill="transparent" onPointerDown={onTurn} style={{ cursor: 'ew-resize' }} />
        <Knob x={300 + turn * 900} y={780} onPointerDown={onTurn} cursor="ew-resize" label="T" />
      </Stage>
    );
  }
  if (beat === 1) {
    // three number lines: x → u = 3x+1 → y = u²
    const x0 = 1;
    const u0 = 4;
    const y0 = 16;
    const du = 3 * dx;
    const dy = (u0 + du) ** 2 - y0;
    const lines = [
      { y: 260, label: 'x', lo: 0, hi: 2, v: x0, d: dx, color: C.cyan },
      { y: 450, label: 'u=3x+1', lo: 3, hi: 5, v: u0, d: du, color: C.violet },
      { y: 640, label: 'y=u^2', lo: 12, hi: 20, v: y0, d: dy, color: C.amber },
    ];
    const X = (l: (typeof lines)[number], v: number) => 360 + ((v - l.lo) / (l.hi - l.lo)) * 760;
    return (
      <Stage ref={svg}>
        {lines.map((l, i) => (
          <g key={i}>
            <line x1={360} x2={1120} y1={l.y} y2={l.y} stroke={C.line} strokeWidth={3} />
            <rect x={X(l, l.v)} y={l.y - 14} width={Math.max(2, X(l, l.v + l.d) - X(l, l.v))} height={28} fill={l.color} opacity={0.6} />
            <Html x={330} y={l.y} size={24} anchor="right" color={l.color}>
              <Tex tex={l.label} />
            </Html>
            <Html x={X(l, l.v)} y={l.y + 34} size={16} color={C.muted}>
              <span className="prop-tag">{l.v}</span>
            </Html>
            {i < 2 && <Arrow from={[X(l, l.v), l.y + 20]} to={[X(lines[i + 1], lines[i + 1].v), lines[i + 1].y - 20]} color={C.dim} width={2} />}
          </g>
        ))}
        <Html x={1170} y={260} size={20} anchor="left" color={C.cyan}>
          <Tex tex={`dx=${nt(dx, 3)}`} />
        </Html>
        <Html x={1170} y={450} size={20} anchor="left" color={C.violet}>
          <Tex tex={`du=${nt(du, 3)}\\ \\ (\\times3)`} />
        </Html>
        <Html x={1170} y={640} size={20} anchor="left" color={C.amber}>
          <Tex tex={`dy=${nt(dy, 3)}\\ \\ (\\approx\\times8)`} />
        </Html>
        <Formula x={760} y={140} size={26} tex={`\\tfrac{dy}{dx}=\\tfrac{${nt(dy, 3)}}{${nt(dx, 3)}}=${nt(dy / dx, 2)}\\ \\to\\ 3\\cdot8=24`} />
        <line x1={400} x2={1200} y1={800} y2={800} stroke={C.line} strokeWidth={3} />
        <rect x={380} y={770} width={840} height={60} fill="transparent" onPointerDown={onDx} style={{ cursor: 'ew-resize' }} />
        <Knob x={400 + (dx / 0.3) * 800} y={800} onPointerDown={onDx} cursor="ew-resize" label="dx" />
      </Stage>
    );
  }
  if (beat === 2)
    return (
      <Stage>
        <Formula y={240} size={38} tex="y=(2x-1)^3" />
        {answer !== null && (
          <>
            <Formula y={360} size={28} tex="u=2x-1,\quad y=u^3" />
            <Formula y={450} size={28} color={C.amber} tex="\tfrac{dy}{dx}=3u^2\cdot2=3\cdot3^2\cdot2=54" />
          </>
        )}
      </Stage>
    );
  // beat 3: oil stain
  const r = 3;
  return (
    <Stage>
      <ellipse cx={700} cy={460} rx={r * 70} ry={r * 70} fill="#1a1426" stroke={C.violet} strokeWidth={3} />
      <ellipse cx={700} cy={460} rx={r * 70 + 25} ry={r * 70 + 25} fill="none" stroke={C.amber} strokeWidth={22} opacity={0.4} />
      <Line a={[700, 460]} b={[700 + r * 70, 460]} color={C.text} width={3} />
      <Html x={700 + (r * 70) / 2} y={440} size={22} color={C.text}>
        <Tex tex="r=3\ \text{m}" />
      </Html>
      <Formula x={1290} y={300} size={24} tex="A=\pi r^2" />
      <Formula x={1290} y={370} size={22} color={C.amber} tex="\tfrac{dr}{dt}=0{,}5\ \tfrac{\text{m}}{\text{min}}" />
      {answer !== null && <Formula x={1290} y={470} size={24} color={C.green} tex="\tfrac{dA}{dt}=2\pi r\cdot\tfrac{dr}{dt}=3\pi" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const SHAPES = [
  { name: 'círculo', tex: 'A=\\pi r^2', what: 'el área', d: (r: number, rp: number) => 2 * Math.PI * r * rp, unit: 'm²/min', var: 'r', hint: '$\\tfrac{dA}{dt}=2\\pi r\\,\\tfrac{dr}{dt}$.' },
  { name: 'esfera', tex: 'V=\\tfrac43\\pi r^3', what: 'el volumen', d: (r: number, rp: number) => 4 * Math.PI * r * r * rp, unit: 'm³/min', var: 'r', hint: '$\\tfrac{dV}{dt}=4\\pi r^2\\,\\tfrac{dr}{dt}$.' },
  { name: 'cuadrado', tex: 'A=s^2', what: 'el área', d: (s: number, sp: number) => 2 * s * sp, unit: 'cm²/s', var: 's', hint: '$\\tfrac{dA}{dt}=2s\\,\\tfrac{ds}{dt}$.' },
];

function Gearbox({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const nT = pick(r, [60, 72, 90]);
    const nM1 = pick(r, [15, 18, 20]);
    const nM2 = pick(r, [40, 48]);
    const nG = pick(r, [10, 12, 16]);
    const rpm = pick(r, [300, 600, 900]);
    const a = randInt(r, 2, 4);
    const n = pick(r, [2, 3, 4]);
    const sqrt = r() < 0.35;
    const x0 = randInt(r, 1, 2);
    // with a square root, aim at a perfect square inside so the numbers stay clean
    const b = sqrt ? pick(r, [4, 9, 16]) - a * x0 : randInt(r, -3, 3);
    const sh = pick(r, SHAPES);
    const v = pick(r, [2, 3, 4, 5]);
    const vp = pick(r, [0.1, 0.2, 0.5]);
    return { nT, nM1, nM2, nG, rpm, a, b, n, sqrt, x0, sh, v, vp };
  }, [seed]);
  const g = data;
  const [val, setVal] = useState('');
  const inner = `${g.a}x${g.b < 0 ? g.b : `+${g.b}`}`;
  const fTex = g.sqrt ? `\\sqrt{${inner}}` : `(${inner})^{${g.n}}`;

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Caja de cambios de la turbina 3. La turbina (${g.nT} dientes) mueve un piñón de ${g.nM1} dientes; en su eje, una rueda de ${g.nM2} dientes mueve el generador (${g.nG} dientes). Si la turbina gira a ${g.rpm} rpm, ¿a cuántas rpm gira el generador?`, '\\tfrac{dG}{dT}=\\tfrac{dG}{dM}\\cdot\\tfrac{dM}{dT}');
      api.hints(['Una rueda grande que mueve una chica la hace girar más rápido: la razón es dientes de la grande sobre dientes de la chica.', `Primera etapa: ${g.nT}/${g.nM1}. Segunda: ${g.nM2}/${g.nG}. Multiplica.`]);
    } else if (round === 1) {
      api.prompt(`Modelo de vibración de la turbina. ¿Cuánto vale $f'(${g.x0})$?${g.sqrt ? ' (Dos decimales.)' : ''}`, `f(x)=${fTex}`);
      api.hints([`Llama $u=${inner}$. Entonces $f=${g.sqrt ? '\\sqrt u' : `u^{${g.n}}`}$.`, `$f'=${g.sqrt ? '\\tfrac{1}{2\\sqrt u}' : `${g.n}u^{${g.n - 1}}`}\\cdot u'$, con $u'=${g.a}$.`]);
    } else {
      api.prompt(`Una fuga se expande como un ${g.sh.name}: ${g.sh.var} crece a ${dec(g.vp)} por unidad de tiempo. Cuando ${g.sh.var} = ${g.v}, ¿a qué ritmo crece ${g.sh.what}? (Dos decimales.)`, g.sh.tex);
      api.hints(['Deriva la fórmula respecto del tiempo: el radio (o lado) depende del tiempo.', g.sh.hint]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const r1 = g.nT / g.nM1;
      const r2 = g.nM2 / g.nG;
      const t = g.rpm * r1 * r2;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$${g.rpm}\\cdot\\tfrac{${g.nT}}{${g.nM1}}\\cdot\\tfrac{${g.nM2}}{${g.nG}}=${dec(t, 1)}$ rpm. Las razones se multiplican.`);
      if (Math.abs(v - g.rpm * (r1 + r2)) < 0.5) return api.result(false, 'Sumaste las razones. Cada etapa multiplica la velocidad que recibe.');
      return api.result(false, `Primera etapa: ×${dec(r1, 2)}. Segunda: ×${dec(r2, 2)}. Aplica las dos a ${g.rpm} rpm.`);
    }
    if (round === 1) {
      const u = g.a * g.x0 + g.b;
      const t = g.sqrt ? g.a / (2 * Math.sqrt(u)) : g.n * u ** (g.n - 1) * g.a;
      if (Math.abs(v - t) < 0.006) return api.result(true, `$u=${u}$, $f'=${g.sqrt ? `\\tfrac{1}{2\\sqrt{${u}}}\\cdot${g.a}` : `${g.n}\\cdot${u}^{${g.n - 1}}\\cdot${g.a}`}=${nt(t, 3)}$.`);
      const noInner = g.sqrt ? 1 / (2 * Math.sqrt(u)) : g.n * u ** (g.n - 1);
      if (Math.abs(v - noInner) < 0.006) return api.result(false, `Falta multiplicar por la derivada de adentro, $u'=${g.a}$: es el segundo engranaje.`);
      return api.result(false, `Con $u=${u}$: derivada de afuera evaluada en $u$, por $u'=${g.a}$.`);
    }
    const t = g.sh.d(g.v, g.vp);
    if (Math.abs(v - t) < 0.02) return api.result(true, `${nt(t, 2)} ${g.sh.unit}. ${g.sh.hint}`);
    return api.result(false, `${g.sh.hint} Con ${g.sh.var} = ${g.v} y ritmo ${dec(g.vp)}.`);
  };

  return (
    <Stage>
      {round === 0 ? (
        <>
          <Gear cx={420} cy={430} r={150} teeth={36} angle={0} color={C.cyan} label={`${g.nT} dientes`} />
          <Gear cx={670} cy={430} r={110} teeth={28} angle={0} color={C.violet} opacity={0.45} />
          <Gear cx={670} cy={430} r={50} teeth={12} angle={0} color={C.violet} label={`${g.nM1} y ${g.nM2} dientes`} />
          <Gear cx={670} cy={242} r={27} teeth={7} angle={0} color={C.amber} />
          <Html x={760} y={242} size={18} anchor="left" color={C.amber}>
            <span>{g.nG} dientes</span>
          </Html>
        </>
      ) : (
        <Formula y={300} size={42} tex={round === 1 ? `f(x)=${fTex}` : g.sh.tex} />
      )}
      <NumberField x={round === 0 ? 1050 : 560} y={round === 0 ? 430 : 520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'rpm:' : round === 1 ? "f'(x₀) =" : 'Ritmo:'} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c6',
  world: 'differential',
  code: '2.6',
  title: 'Engranajes',
  subtitle: 'Regla de la cadena',
  glyph: '\\frac{dy}{dx}',
  kind: 'level',
  guide: 'nadia',
  teaser: 'La turbina 3 gira más rápido de lo que debería. Entre la turbina y el generador hay engranajes, y las razones de cambio se encadenan.',
  learn: 'Regla de la cadena como engranajes y como empujones $dx\\to du\\to dy$, derivada de una composición y razones relacionadas.',
  glyphs: ['chain-rule'],
  pitfalls: ['No olvidar la derivada de adentro.', 'La derivada de afuera se evalúa en $u=g(x)$, no en $x$.', 'Las razones de etapas encadenadas se multiplican, no se suman.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nar', text: 'Turbina 3, 11:20; la caja de cambios traquetea.' },
        { who: 'nadia', text: 'La turbina gira normal y el generador se acelera. Quiero saber cuánto le agregaron las ruedas.' },
        { who: 'teo', text: 'El movimiento pasa por el eje intermedio antes de llegar al generador. Tengo que seguir las dos etapas.' },
        { who: 'iris', text: 'Con cuidado. Esa mancha de aceite también está ganando terreno.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La caja de cambios',
      Scene: GearsDemo,
      beats: [
        {
          say: 'Por cada vuelta de la turbina, el intermedio da 3. Por cada vuelta del intermedio, el generador da 4.',
          gate: 'Haz girar la turbina una vuelta completa.',
          note: { label: 'Razones encadenadas', tex: '\\frac{dG}{dT}=\\frac{dG}{dM}\\cdot\\frac{dM}{dT}=4\\cdot3=12', body: 'Cada etapa multiplica lo que recibe.' },
        },
        {
          say: 'Lo mismo con fórmulas: $u=3x+1$ y luego $y=u^2$. Un empujoncito en $x$ se agranda dos veces.',
          gate: 'Achica dx hasta 0,02.',
          note: { label: 'Regla de la cadena', tex: '\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx}', body: 'En $x=1$: $u=4$, $\\tfrac{dy}{du}=2u=8$, $\\tfrac{du}{dx}=3$. Total: 24.' },
        },
        {
          say: 'Otra composición: primero $2x-1$, después al cubo.',
          ask: {
            prompt: '¿Cuánto vale la derivada de $(2x-1)^3$ en $x=2$?',
            options: ['54', '27', '18'],
            answer: 0,
            explain: 'Afuera: $3u^2$ con $u=3$ da 27. Adentro: 2. Producto: 54. Olvidar el 2 de adentro da 27.',
          },
          note: { label: 'Composición', tex: "(f\\circ g)'(x)=f'\\big(g(x)\\big)\\cdot g'(x)" },
        },
        {
          say: 'Bajo la turbina hay una mancha de aceite circular. Su radio crece a 0,5 m por minuto.',
          ask: {
            prompt: 'Cuando el radio mide 3 m, ¿a qué ritmo crece el área?',
            options: ['3π ≈ 9,4 m²/min', '0,5π m²/min', '9π m²/min'],
            answer: 0,
            explain: '$A=\\pi r^2$ y $r$ depende de $t$: $\\tfrac{dA}{dt}=2\\pi r\\,\\tfrac{dr}{dt}=2\\pi\\cdot3\\cdot0{,}5=3\\pi$. Es el anillo naranja.',
          },
          note: { label: 'Razones relacionadas', tex: '\\frac{dA}{dt}=\\frac{dA}{dr}\\cdot\\frac{dr}{dt}' },
        },
      ],
    },
    { kind: 'challenge', title: 'La caja de cambios', Comp: Gearbox, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'teo', text: 'Por cada vuelta de turbina, el intermedio da 3 y el generador da 12. Las dos etapas explican la aceleración.' },
        { who: 'nadia', text: 'Ese generador extra alimenta el subsuelo. Yo no autoricé el cambio de ruedas.' },
        { who: 'iris', text: '¿Y dónde termina el calor que produce?' },
        { who: 'nadia', text: 'En la torre de enfriamiento. Está trabajando por encima de lo que declara el turno.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'chain-rule', world: 'differential', tex: '\\frac{dy}{dx}=\\frac{dy}{du}\\frac{du}{dx}', name: 'Regla de la cadena', read: 'regla de la cadena', meaning: 'La derivada de una composición es el producto de las derivadas de cada etapa, cada una evaluada donde corresponde.' },
];
