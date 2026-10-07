import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder } from './kit';

// ============================================================================
// CASO 3.8 · «La fuga sin fin» — integrales impropias
// Un intervalo infinito: ∫_a^∞ f = lim_{b→∞} ∫_a^b f. Puede dar un número finito (1/x², e^{-x})
// o crecer sin límite (1/x). Criterio p. Altura infinita: ∫_0^1 1/√x = 2.
// ============================================================================

// ---------------------------------------------------------------- lesson
function ImproperLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const PL = plane([0, 12], [0, 1.15], { x: 300, y: 140, w: 840, h: 480 });
  const [b, setB] = useState(1);
  const onB = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PL.inv(x, 0)[0], 0.2, 12) * 4) / 4;
    setB(v);
    if (v >= 11.5) unlock();
  });

  if (beat === 0) {
    const area = 1 - Math.exp(-b);
    return (
      <Stage ref={svg}>
        <Axes P={PL} xTicks={[2, 4, 6, 8, 10, 12]} yTicks={[0.5, 1]} xLabel="x" yLabel="" grid />
        <AreaUnder P={PL} f={(x) => Math.exp(-x)} a={0} b={b} pos={C.violet} opacity={0.45} />
        <Curve P={PL} f={(x) => Math.exp(-x)} a={0} b={12} color={C.cyan} width={4} />
        <Line a={PL.pt(b, 0)} b={PL.pt(b, 1.15)} color={C.text} dashed />
        <Knob x={PL.x(b)} y={PL.y(0) + 30} onPointerDown={onB} cursor="ew-resize" label="b" />
        <Cap x={1330} y={220} size={26} color={C.violet} tex={`\\int_0^{b}e^{-x}dx=${dec(area, 4).replace(',', '{,}')}`} />
        <rect x={1240} y={300} width={180} height={24} fill="#1d2b2a" />
        <rect x={1240} y={300} width={180 * area} height={24} fill={C.violet} opacity={0.8} />
        <line x1={1420} x2={1420} y1={290} y2={334} stroke={C.green} strokeWidth={3} />
        <Cap x={1420} y={360} size={18} color={C.green}>
          1
        </Cap>
      </Stage>
    );
  }
  if (beat === 1 || beat === 2) {
    const P = plane([1, 12], [0, 1.1], { x: 300, y: 140, w: 840, h: 480 });
    const B = 1 + 11 * (beat === 1 ? at(1) : 1);
    const a2 = 1 - 1 / B;
    const a1 = Math.log(B);
    return (
      <Stage>
        <Axes P={P} xTicks={[1, 2, 4, 6, 8, 10, 12]} yTicks={[0.5, 1]} xLabel="x" yLabel="" grid />
        <AreaUnder P={P} f={(x) => 1 / x} a={1} b={B} pos={C.red} opacity={0.3} />
        <AreaUnder P={P} f={(x) => 1 / (x * x)} a={1} b={B} pos={C.green} opacity={0.45} />
        <Curve P={P} f={(x) => 1 / x} a={1} b={12} color={C.red} width={3.5} />
        <Curve P={P} f={(x) => 1 / (x * x)} a={1} b={12} color={C.green} width={3.5} />
        <Cap x={1330} y={220} size={24} color={C.green} tex={`\\int_1^{b}\\tfrac{1}{x^2}=${dec(a2, 3).replace(',', '{,}')}\\to1`} />
        <Cap x={1330} y={290} size={24} color={C.red} tex={`\\int_1^{b}\\tfrac{1}{x}=${dec(a1, 3).replace(',', '{,}')}\\to\\infty`} />
        {beat === 2 && answer !== null && <Cap x={1330} y={380} size={22} color={C.amber} tex="p>1:\ \text{converge}" />}
      </Stage>
    );
  }
  if (beat === 3) {
    const P = plane([0, 1.05], [0, 6], { x: 360, y: 120, w: 760, h: 520 });
    const k = at(3);
    const eps = 1 - 0.99 * k;
    return (
      <Stage>
        <Axes P={P} xTicks={[0.5, 1]} yTicks={[2, 4, 6]} xLabel="x" yLabel="" grid />
        <AreaUnder P={P} f={(x) => 1 / Math.sqrt(x)} a={Math.max(0.028, eps)} b={1} pos={C.violet} opacity={0.4} />
        <Curve P={P} f={(x) => Math.min(6, 1 / Math.sqrt(x))} a={0.028} b={1.05} color={C.cyan} width={4} />
        <Cap x={1330} y={220} size={24} color={C.violet} tex={`\\int_{${dec(eps, 3).replace(',', '{,}')}}^1\\tfrac{dx}{\\sqrt x}=${dec(2 - 2 * Math.sqrt(eps), 3).replace(',', '{,}')}`} />
        <Cap x={1330} y={290} size={20} color={C.green} tex="\to2" />
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={260} size={40} color={C.text} tex="\int_0^\infty 6\,e^{-0{,}5t}\,dt" />
      <Group opacity={answer !== null ? 1 : 0}>
        <Cap x={800} y={420} size={30} color={C.green} tex="=\lim_{b\to\infty}12\,(1-e^{-0{,}5b})=12" />
      </Group>
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Integrales impropias',
  Scene: ImproperLesson,
  beats: [
    {
      say: '¿Tiene sentido el área bajo $e^{-x}$ desde 0 hasta el infinito? Se calcula hasta un $b$ cualquiera y se mira qué pasa cuando $b$ crece sin fin.',
      gate: 'Arrastra b lo más lejos posible.',
      board: [
        { label: 'Integral impropia', tex: '\\int_a^{\\infty}f(x)\\,dx=\\p{1}{\\lim_{b\\to\\infty}}\\p{2}{\\int_a^b f(x)\\,dx}' },
        { tex: '\\int_0^\\infty e^{-x}dx=\\lim_{b\\to\\infty}(1-e^{-b})=\\p{1}{1}' },
      ],
    },
    {
      say: 'Dos curvas que se parecen pueden comportarse distinto: el área bajo $1/x^2$ se acerca a 1, pero la de $1/x$ crece sin límite, aunque muy lento.',
      dur: 4,
      board: [
        { label: 'Converge', tex: '\\int_1^\\infty\\frac{dx}{x^2}=\\lim_{b\\to\\infty}\\Big(1-\\frac1b\\Big)=\\p{1}{1}' },
        { label: 'Diverge', tex: '\\int_1^\\infty\\frac{dx}{x}=\\lim_{b\\to\\infty}\\ln b=\\p{1}{\\infty}' },
      ],
    },
    {
      say: 'La frontera está en la potencia: $1/x^p$ tiene área finita en $[1,\\infty)$ solo si baja más rápido que $1/x$.',
      ask: {
        prompt: '¿Converge $\\int_1^\\infty\\frac{dx}{x^{1{,}5}}$?',
        options: ['Sí: p = 1,5 > 1', 'No: nunca llega a 0', 'Solo si se corta en 1000'],
        answer: 0,
        explain: 'Con $p>1$ la primitiva $\\tfrac{x^{1-p}}{1-p}$ tiende a 0 cuando $x\\to\\infty$: el área total es $\\tfrac{1}{p-1}=2$.',
      },
      board: { label: 'Criterio p', tex: '\\int_1^\\infty\\frac{dx}{x^p}=\\begin{cases}\\frac{1}{p-1}&p>1\\\\ \\infty&p\\le1\\end{cases}' },
    },
    {
      say: 'También puede ser infinita la altura: $1/\\sqrt x$ se dispara en 0, y aun así el área entre 0 y 1 es finita.',
      dur: 3.4,
      board: { label: 'Altura infinita', tex: '\\int_0^1\\frac{dx}{\\sqrt x}=\\lim_{\\varepsilon\\to0^+}\\big[2\\sqrt x\\big]_\\varepsilon^1=\\p{1}{2}' },
    },
    {
      say: 'Volvamos a la fuga de la válvula vieja: gotea para siempre, pero cada vez menos.',
      ask: {
        prompt: '¿Cuánta agua perderá en total, si nadie la cierra?',
        options: ['12 mil m³', 'Infinita', '6 mil m³'],
        answer: 0,
        explain: '$\\int_0^\\infty 6e^{-0{,}5t}dt=\\tfrac{6}{0{,}5}=12$. La fuga nunca se detiene, pero el total es finito.',
      },
      board: { label: 'Exponencial', tex: '\\int_0^\\infty A\\,e^{-kt}dt=\\p{1}{\\frac{A}{k}}' },
    },
  ],
};

// ---------------------------------------------------------------- demo
function TotalDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const P = plane([0, 20], [0, 7], { x: 300, y: 120, w: 820, h: 520 });
  const B = beat === 0 ? 20 * at(0) + 0.1 : 20;
  const vol = 12 * (1 - Math.exp(-0.5 * B));
  return (
    <Stage>
      <Axes P={P} xTicks={[0, 5, 10, 15, 20]} yTicks={[2, 4, 6]} xLabel="t\ (\text{h})" yLabel="q" grid />
      <AreaUnder P={P} f={(t) => 6 * Math.exp(-0.5 * t)} a={0} b={B} pos={C.violet} opacity={0.45} />
      <Curve P={P} f={(t) => 6 * Math.exp(-0.5 * t)} a={0} b={20} color={C.cyan} width={4} />
      {beat === 1 && <Curve P={P} f={(t) => Math.min(7, 3 / (t + 0.5))} a={0} b={20} color={C.red} width={3} />}
      <Cap x={1330} y={220} size={24} color={C.violet} tex={`\\text{perdido}=${dec(vol, 2).replace(',', '{,}')}`} />
      {beat === 1 && answer !== null && <Cap x={1330} y={300} size={20} color={C.red} tex="\tfrac{3}{t+0{,}5}:\ \text{infinito}" />}
      <Html x={1330} y={380} size={16} color={C.muted}>
        <span>mil m³</span>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const CLASSIFY = [
  { tex: '\\int_1^\\infty\\frac{dx}{x^3}', conv: true },
  { tex: '\\int_1^\\infty\\frac{dx}{\\sqrt x}', conv: false },
  { tex: '\\int_0^\\infty e^{-2x}\\,dx', conv: true },
  { tex: '\\int_1^\\infty\\frac{5}{x}\\,dx', conv: false },
  { tex: '\\int_0^1\\frac{dx}{x^{0{,}5}}', conv: true },
  { tex: '\\int_0^1\\frac{dx}{x^2}', conv: false },
];

function Infinite({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const A = pick(r, [4, 6, 9, 10]);
    const k = pick(r, [0.2, 0.25, 0.5, 2]);
    const cases = shuffle(r, CLASSIFY).slice(0, 3);
    const c = pick(r, [2, 3, 6]);
    const p = pick(r, [2, 3, 4]);
    return { A, k, cases, c, p };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');
  const [marks, setMarks] = useState<(boolean | null)[]>([null, null, null]);

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Una fuga sigue $q(t)=${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}$ miles de m³/h. ¿Cuánto se pierde en total, para siempre?`, '\\int_0^\\infty A\\,e^{-kt}\\,dt');
      api.hints(['Integra hasta $b$ y deja $b\\to\\infty$.', '$e^{-kb}\\to0$: queda $A/k$.']);
    } else if (round === 1) {
      api.prompt('Decide para cada integral si converge (área finita) o diverge.', '\\int_1^\\infty\\frac{dx}{x^p}:\\ p>1');
      api.hints(['Hacia infinito: converge si baja más rápido que $1/x$.', 'Cerca de 0: $1/x^p$ tiene área finita si $p<1$.']);
    } else {
      api.prompt('Calcula la integral impropia.', `\\int_1^\\infty\\frac{${d.c}}{x^{${d.p}}}\\,dx`);
      api.hints([`Primitiva: $${d.c}\\cdot\\tfrac{x^{1-${d.p}}}{1-${d.p}}$.`, `Resultado: $\\tfrac{${d.c}}{${d.p}-1}$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (marks.some((m) => m === null)) return;
      const bad = d.cases.findIndex((c, i) => c.conv !== marks[i]);
      if (bad < 0) return api.result(true, d.cases.map((c) => (c.conv ? 'converge' : 'diverge')).join(' · '));
      return api.result(false, `$${d.cases[bad].tex}$ ${d.cases[bad].conv ? 'converge: su área es finita' : 'diverge: su área crece sin límite'}.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = d.A / d.k;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$\\tfrac{${d.A}}{${dec(d.k, 2).replace(',', '{,}')}}=${dec(t, 2).replace(',', '{,}')}$ mil m³. Nunca se detiene, pero el total es finito.`);
      if (Math.abs(v - d.A * d.k) < 0.01) return api.result(false, 'Se divide por $k$, no se multiplica: viene de $\\int e^{-kt}dt=-\\tfrac1k e^{-kt}$.');
      return api.result(false, `Total: $\\tfrac{A}{k}$ con $A=${d.A}$ y $k=${dec(d.k, 2)}$.`);
    }
    const t = d.c / (d.p - 1);
    if (Math.abs(v - t) < 0.01) return api.result(true, `$\\tfrac{${d.c}}{${d.p}-1}=${dec(t, 2).replace(',', '{,}')}$.`);
    return api.result(false, `Con $p=${d.p}>1$ converge a $\\tfrac{${d.c}}{p-1}$.`);
  };

  if (round === 1)
    return (
      <Stage>
        {d.cases.map((c, i) => (
          <g key={i}>
            <Cap x={480} y={260 + i * 160} size={34} color={C.text} tex={c.tex} />
            <Html x={1000} y={260 + i * 160} size={22} interactive>
              <div className="stage-choices">
                <button className={`stage-btn ${marks[i] === true ? 'on' : ''}`} onClick={() => setMarks(marks.map((m, k) => (k === i ? true : m)))}>
                  converge
                </button>
                <button className={`stage-btn ${marks[i] === false ? 'on' : ''}`} onClick={() => setMarks(marks.map((m, k) => (k === i ? false : m)))}>
                  diverge
                </button>
              </div>
            </Html>
          </g>
        ))}
        <Confirm onClick={submit} disabled={marks.some((m) => m === null)} />
      </Stage>
    );
  return (
    <Stage>
      <Cap x={800} y={300} size={42} color={C.text} tex={round === 0 ? `\\int_0^\\infty ${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}\\,dt` : `\\int_1^\\infty\\frac{${d.c}}{x^{${d.p}}}\\,dx`} />
      <NumberField x={560} y={500} value={val} onChange={setVal} onEnter={submit} label="=" width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c8',
  world: 'integral',
  code: '3.8',
  title: 'La fuga sin fin',
  subtitle: 'Integrales impropias',
  glyph: '\\int^\\infty',
  kind: 'level',
  guide: 'marta',
  teaser: 'La válvula vieja gotea para siempre. ¿La pérdida total es infinita? Depende de qué tan rápido se apague la fuga.',
  learn: 'Integrales sobre intervalos infinitos como límites, convergencia y divergencia, el criterio $1/x^p$ e integrales con altura infinita.',
  glyphs: ['improper'],
  pitfalls: ['Que $f\\to0$ no garantiza área finita: $1/x$ tiende a 0 y su área diverge.', 'Hacia infinito converge $1/x^p$ con $p>1$; cerca de 0, con $p<1$.', 'Una integral impropia se define como límite: no se reemplaza $\\infty$ directamente.'],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'iris', text: 'Si nadie cierra la válvula vieja, ¿cuánta agua se pierde en total?' },
        { who: 'marta', text: 'La fuga nunca llega a cero. Pero cada hora es más chica. Puede que el total sea un número.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Para siempre',
      Scene: TotalDemo,
      beats: [
        {
          say: 'El área perdida mientras pasan las horas.',
          dur: 3,
          note: { label: 'Pérdida total', tex: '\\int_0^\\infty6e^{-0{,}5t}dt=12', body: 'Mil m³: después de unas 10 horas ya se perdió casi todo.' },
        },
        {
          say: 'Teo propone otro modelo para el sensor que deriva: $\\tfrac{3}{t+0{,}5}$, que también tiende a 0.',
          ask: {
            prompt: '¿Daría una pérdida total finita?',
            options: ['No: baja como 1/t y su área crece sin límite', 'Sí: tiende a 0', 'Sí: 6 mil m³'],
            answer: 0,
            explain: 'Para $t$ grande se comporta como $\\tfrac3t$: el área crece como $3\\ln t$, sin límite.',
          },
          note: { label: 'Tender a cero no basta', body: 'Importa qué tan rápido: más rápido que $1/t$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Para siempre', Comp: Infinite, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'teo', text: 'Encontré quién cambia los caudalímetros: comandos remotos, todas las noches, desde un servidor externo.' },
        { who: 'iris', text: 'Esta noche vamos a la sala de control. Con todo lo que sabemos.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'improper', world: 'integral', tex: '\\int_a^\\infty f=\\lim_{b\\to\\infty}\\int_a^b f', name: 'Integral impropia', read: 'integral impropia', meaning: 'Integral con un límite infinito o con integrando no acotado, definida como límite. Converge si ese límite es un número.' },
];
