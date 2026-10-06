import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Arrow, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
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
        { who: 'nadia', text: 'La turbina 3 gira normal, pero el generador da más vueltas de las que debería.' },
        { who: 'teo', text: 'Entre medio hay una caja de cambios. Alguien cambió una rueda.' },
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
        { who: 'nadia', text: 'El generador extra alimenta el subsuelo. Y la torre de enfriamiento está trabajando de más.' },
        { who: 'iris', text: 'Algo allá abajo produce calor. Mucho calor.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'chain-rule', world: 'differential', tex: '\\frac{dy}{dx}=\\frac{dy}{du}\\frac{du}{dx}', name: 'Regla de la cadena', read: 'regla de la cadena', meaning: 'La derivada de una composición es el producto de las derivadas de cada etapa, cada una evaluada donde corresponde.' },
];
