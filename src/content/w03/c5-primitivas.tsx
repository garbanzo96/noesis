import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder } from './kit';

// ============================================================================
// CASO 3.5 · «Primitivas» — antiderivadas y teorema fundamental (II)
// Leer la tabla de derivadas al revés: F' = f. La familia F + C. Potencia al revés, e^x, 1/x.
// ∫_a^b f = F(b) − F(a): los pequeños cambios de F se suman hasta el cambio total.
// ============================================================================

const sgnTex = (v: number) => (v < 0 ? `-${Math.abs(v)}` : `+${v}`);
/** TeX of a polynomial in t from coefficients [c0, c1, c2, ...]. */
function poly(cs: number[], v = 't') {
  const terms = cs
    .map((c, k) => ({ c, k }))
    .filter(({ c }) => c !== 0)
    .reverse()
    .map(({ c, k }, i) => {
      const a = Math.abs(c);
      const coef = a === 1 && k > 0 ? '' : String(a).replace('.', '{,}');
      const body = k === 0 ? coef : k === 1 ? `${coef}${v}` : `${coef}${v}^{${k}}`;
      return (i === 0 ? (c < 0 ? '-' : '') : c < 0 ? '-' : '+') + body;
    });
  return terms.join('') || '0';
}
const evalPoly = (cs: number[], x: number) => cs.reduce((acc, c, k) => acc + c * x ** k, 0);
/** Antiderivative coefficients with F(0)=0. */
const antider = (cs: number[]) => [0, ...cs.map((c, k) => c / (k + 1))];

// ---------------------------------------------------------------- lesson
function PrimitivesLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [c, setC] = useState(0);
  const P1 = plane([-2.5, 2.5], [-2, 6], { x: 360, y: 110, w: 760, h: 560 });
  const onC = useSvgDrag(svg, (_x, y) => {
    const v = Math.round(clamp(P1.inv(0, y)[1], -2, 4) * 2) / 2;
    setC(v);
    if (v >= 3) unlock();
  });

  if (beat === 0) {
    const rows = [
      ['x^2', '2x'],
      ['x^3', '3x^2'],
      ['e^x', 'e^x'],
      ['\\ln x', '\\tfrac1x'],
    ];
    const k = at(0);
    return (
      <Stage>
        <Cap x={560} y={150} size={26} color={C.amber} tex="F" />
        <Cap x={1040} y={150} size={26} color={C.cyan} tex="f=F'" />
        {rows.map(([F, f], i) => (
          <g key={i}>
            <Cap x={560} y={250 + i * 120} size={34} color={C.amber} tex={F} />
            <Cap x={1040} y={250 + i * 120} size={34} color={C.cyan} tex={f} />
            <Arrow from={[640, 240 + i * 120]} to={[960, 240 + i * 120]} color={C.dim} width={2} />
            <Arrow from={[960, 262 + i * 120]} to={[640, 262 + i * 120]} color={C.green} width={3} progress={clamp(k * 1.6 - i * 0.15, 0, 1)} />
          </g>
        ))}
        <Cap x={800} y={210} size={18} color={C.muted}>
          derivar →
        </Cap>
        <Cap x={800} y={760} size={18} color={C.green} opacity={k}>
          ← buscar una primitiva
        </Cap>
      </Stage>
    );
  }
  if (beat === 1) {
    const F = (x: number) => x * x;
    return (
      <Stage ref={svg}>
        <Axes P={P1} xTicks={[-2, -1, 1, 2]} yTicks={[2, 4, 6]} xLabel="x" yLabel="y" grid />
        {[-1, 0, 1, 2].map((k) => (
          <Curve key={k} P={P1} f={(x) => F(x) + k} a={-2.5} b={2.5} color={C.dim} width={1.5} />
        ))}
        <Curve P={P1} f={(x) => F(x) + c} a={-2.5} b={2.5} color={C.amber} width={4} />
        {[-1, 1].map((x0) => (
          <Line key={x0} a={P1.pt(x0 - 0.5, F(x0) + c - 2 * x0 * 0.5)} b={P1.pt(x0 + 0.5, F(x0) + c + 2 * x0 * 0.5)} color={C.cyan} width={3} />
        ))}
        <Knob x={P1.x(0)} y={P1.y(c)} color={C.amber} onPointerDown={onC} cursor="ns-resize" label="C" />
        <Cap x={1300} y={240} size={30} color={C.amber} tex={`F=x^2${c === 0 ? '' : sgnTex(c).replace('.', '{,}')}`} />
        <Cap x={1300} y={300} size={24} color={C.cyan} tex="F'=2x" />
      </Stage>
    );
  }
  if (beat === 2 || beat === 3) {
    const k = at(beat);
    return (
      <Stage>
        {beat === 2 ? (
          <>
            <Cap x={800} y={220} size={40} color={C.text} tex="\int x^n\,dx=\ ?" />
            <Cap x={800} y={360} size={34} color={C.amber} tex="\frac{d}{dx}\left(\frac{x^{n+1}}{n+1}\right)=\frac{(n+1)\,x^{n}}{n+1}=x^n" opacity={clamp(k * 2, 0, 1)} />
            <Cap x={800} y={520} size={30} color={C.green} tex="\int x^3\,dx=\frac{x^4}{4}+C" opacity={clamp(k * 2 - 1, 0, 1)} />
          </>
        ) : (
          <>
            <Cap x={800} y={240} size={36} color={C.text} tex="\int e^x\,dx=e^x+C" />
            <Cap x={800} y={380} size={36} color={C.text} tex="\int \tfrac1x\,dx=\ln|x|+C" opacity={clamp(k * 2, 0, 1)} />
            <Cap x={800} y={520} size={30} color={C.muted} tex="\int(3x^2+2)\,dx=x^3+2x+C" opacity={clamp(k * 2 - 1, 0, 1)} />
          </>
        )}
      </Stage>
    );
  }
  // beats 4-5: total change = sum of small changes
  const F = (x: number) => x + (x * x * x) / 12;
  const f = (x: number) => 1 + (x * x) / 4;
  const P4 = plane([0, 4.4], [0, 10], { x: 360, y: 110, w: 760, h: 560 });
  const n = 8;
  const steps = Math.round(n * (beat === 4 ? at(4) : 1));
  return (
    <Stage>
      <Axes P={P4} xTicks={[0, 1, 2, 3, 4]} yTicks={[2, 4, 6, 8, 10]} xLabel="x" yLabel="F" grid />
      <Curve P={P4} f={F} a={0} b={4.4} color={C.amber} width={4} />
      {Array.from({ length: steps }, (_, i) => {
        const x0 = (4 * i) / n;
        const x1 = (4 * (i + 1)) / n;
        const y0 = F(x0);
        const y1 = y0 + f(x0) * (x1 - x0);
        return (
          <g key={i}>
            <Line a={P4.pt(x0, y0)} b={P4.pt(x1, y0)} color={C.dim} width={2} />
            <Line a={P4.pt(x1, y0)} b={P4.pt(x1, y1)} color={C.green} width={3} />
          </g>
        );
      })}
      <Dot x={P4.x(0)} y={P4.y(F(0))} r={8} color={C.amber} />
      <Dot x={P4.x(4)} y={P4.y(F(4))} r={8} color={C.amber} />
      <Line a={P4.pt(4.2, 0)} b={P4.pt(4.2, F(4))} color={C.magenta} width={4} />
      <Cap x={P4.x(4.2) + 16} y={P4.y(F(4) / 2)} size={20} color={C.magenta} anchor="left" tex={`F(4)-F(0)=${dec(F(4), 3).replace(',', '{,}')}`} />
      <Cap x={1340} y={200} size={20} color={C.green} tex="\text{cada escalón}\approx f(x)\,\Delta x" />
      {answer !== null && <Cap x={1340} y={300} size={22} color={C.green} tex="=\int_0^4 f(x)\,dx" />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Primitivas y teorema fundamental (II)',
  Scene: PrimitivesLesson,
  beats: [
    {
      say: 'Derivar va de $F$ a $f$. La pregunta inversa: dada $f$, ¿qué función $F$ tiene a $f$ como derivada? Esa $F$ se llama **primitiva** o antiderivada.',
      dur: 3,
      board: { label: 'Primitiva', tex: "\\p{1}{F'(x)}=\\p{2}{f(x)}", body: '$x^2$ es una primitiva de $2x$; $e^x$, de $e^x$; $\\ln x$, de $\\tfrac1x$.' },
    },
    {
      say: 'Subir o bajar una curva no cambia sus pendientes. Por eso, si $F$ es primitiva, también lo es $F+C$ para cualquier constante $C$: son infinitas.',
      gate: 'Sube la curva hasta C = 3: las tangentes no cambian.',
      board: { label: 'Integral indefinida', tex: '\\int f(x)\\,dx=\\p{1}{F(x)}+\\p{2}{\\cA{C}}' },
    },
    {
      say: 'La regla de la potencia, al revés: se suma 1 al exponente y se divide por el nuevo exponente. Se comprueba derivando.',
      dur: 3.2,
      board: { label: 'Potencia', tex: '\\int x^n\\,dx=\\frac{x^{\\p{1}{n+1}}}{\\p{2}{n+1}}+C\\qquad(n\\ne-1)' },
    },
    {
      say: 'Otras primitivas básicas salen de leer al revés la tabla de derivadas. Y como derivar respeta sumas y constantes, integrar también.',
      dur: 3,
      board: [
        { label: 'Exponencial y logaritmo', tex: '\\int e^x\\,dx=e^x+C,\\qquad \\int\\tfrac1x\\,dx=\\ln|x|+C' },
        { label: 'Término a término', tex: '\\int(3x^2+2)\\,dx=\\p{1}{x^3}+\\p{2}{2x}+C' },
      ],
    },
    {
      say: 'Ahora el puente. El cambio total de $F$ entre $a$ y $b$ es la suma de muchos cambios pequeños, y cada uno vale pendiente por ancho: $f(x)\\,\\Delta x$. Esa suma es la integral.',
      dur: 4,
      board: [
        { tex: 'F(b)-F(a)=\\sum \\Delta F\\approx\\sum f(x_i)\\,\\Delta x' },
        { label: 'Teorema fundamental (II)', tex: '\\int_a^b f(x)\\,dx=\\p{1}{F(b)}-\\p{2}{F(a)}=\\p{3}{\\big[F(x)\\big]_a^b}' },
      ],
    },
    {
      say: 'Con eso se calcula exacto lo que antes se aproximaba con rectángulos.',
      ask: {
        prompt: '¿Cuánto vale $\\int_0^4\\left(1+\\tfrac{x^2}{4}\\right)dx$?',
        options: ['28/3 ≈ 9,33', '5', '4'],
        answer: 0,
        explain: 'Primitiva: $x+\\tfrac{x^3}{12}$. En 4: $4+\\tfrac{64}{12}=\\tfrac{28}{3}$; en 0: 0. Es el mismo 9,33 al que se acercaban las sumas de Riemann.',
      },
      board: { tex: '\\Big[x+\\tfrac{x^3}{12}\\Big]_0^4=\\p{1}{4+\\tfrac{64}{12}}-\\p{2}{0}=\\p{3}{\\tfrac{28}{3}}' },
    },
  ],
};

// ---------------------------------------------------------------- demo
const Qcs = [2, 1.5, -0.25];
const PD = plane([0, 6.4], [0, 5], { x: 300, y: 120, w: 820, h: 520 });

function FormulaDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  const Q = (t: number) => evalPoly(Qcs, t);
  return (
    <Stage>
      <Axes P={PD} xTicks={[0, 1, 2, 3, 4, 5, 6]} yTicks={[1, 2, 3, 4, 5]} xLabel="\text{hora}" yLabel="Q" grid />
      {(beat >= 1 || answer !== null) && <AreaUnder P={PD} f={Q} a={0} b={6} pos="#5fd3ff" opacity={0.35} />}
      <Curve P={PD} f={Q} a={0} b={6} color={C.cyan} width={4} />
      <Cap x={1330} y={200} size={24} color={C.cyan} tex="Q(t)=2+1{,}5t-0{,}25t^2" />
      <Group opacity={answer !== null || beat >= 1 ? 1 : 0}>
        <Cap x={1330} y={270} size={22} color={C.amber} tex="F(t)=2t+0{,}75t^2-\tfrac{t^3}{12}" />
      </Group>
      {beat >= 1 && <Cap x={1330} y={340} size={24} color={C.green} tex="F(6)-F(0)=21" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Primitives({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const cs = [randInt(r, 1, 4), randInt(r, -2, 4), pick(r, [-0.5, 0, 0.5, 1]) * (round === 0 ? 1 : 1), pick(r, [0, 0.25])];
    const a = randInt(r, 0, 1);
    const b = a + randInt(r, 1, 3);
    const V0 = randInt(r, 50, 120);
    const t1 = randInt(r, 2, 4);
    const k = pick(r, [2, 3, 5]);
    const kind = pick(r, ['ln', 'exp'] as const);
    const c = pick(r, [1, 2]);
    return { cs, a, b, V0, t1, k, kind, c };
  }, [seed, round]);
  const d = data;
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Calcula la integral exacta con una primitiva.`, `\\int_{${d.a}}^{${d.b}}\\left(${poly(d.cs)}\\right)dt`);
      api.hints(['Primitiva término a término: $t^n\\to\\tfrac{t^{n+1}}{n+1}$.', 'Evalúa en el límite de arriba y resta el de abajo.']);
    } else if (round === 1) {
      api.prompt(`El lago tenía ${d.V0} mil m³ a las $t=0$. Su ritmo neto es la fórmula de abajo. ¿Cuánto volumen tendrá en $t=${d.t1}$?`, `V(t)=V(0)+\\int_0^{t}r(s)\\,ds,\\quad r(t)=${poly(d.cs.map((x) => -x))}`);
      api.hints(['El cambio neto es la integral del ritmo entre 0 y $t_1$.', 'Súmale el volumen inicial.']);
    } else {
      api.prompt('Una más, con las primitivas de $e^x$ y $\\tfrac1x$. (Dos decimales.)', d.kind === 'ln' ? `\\int_1^{${d.c === 1 ? 'e' : 'e^2'}}\\frac{${d.k}}{x}\\,dx` : `\\int_0^{${d.c}}${d.k}\\,e^{x}\\,dx`);
      api.hints([d.kind === 'ln' ? 'Primitiva de $\\tfrac{k}{x}$: $k\\ln x$.' : 'Primitiva de $k\\,e^x$: $k\\,e^x$.', d.kind === 'ln' ? '$\\ln1=0$ y $\\ln e^c=c$.' : '$e^0=1$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const F = antider(d.cs);
      const t = evalPoly(F, d.b) - evalPoly(F, d.a);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$F(t)=${poly(F.map((x) => Math.round(x * 1000) / 1000))}$. $F(${d.b})-F(${d.a})=${dec(t, 3).replace(',', '{,}')}$.`);
      if (Math.abs(v - (evalPoly(d.cs, d.b) - evalPoly(d.cs, d.a))) < 0.01) return api.result(false, 'Evaluaste el integrando, no una primitiva. Primero integra término a término.');
      return api.result(false, `Primitiva: $${poly(F.map((x) => Math.round(x * 1000) / 1000))}$. Evalúa en ${d.b} y en ${d.a} y resta.`);
    }
    if (round === 1) {
      const F = antider(d.cs.map((x) => -x));
      const t = d.V0 + evalPoly(F, d.t1);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$${d.V0}+\\big[${poly(F.map((x) => Math.round(x * 1000) / 1000))}\\big]_0^{${d.t1}}=${dec(t, 2).replace(',', '{,}')}$ mil m³.`);
      if (Math.abs(v - evalPoly(F, d.t1)) < 0.01) return api.result(false, `Ese es el cambio neto. Falta sumar el volumen inicial, ${d.V0}.`);
      return api.result(false, 'Integra el ritmo de 0 a $t_1$ (es negativo: el lago baja) y súmale el volumen inicial.');
    }
    const t = d.kind === 'ln' ? d.k * d.c : d.k * (Math.exp(d.c) - 1);
    if (Math.abs(v - t) < 0.011) return api.result(true, d.kind === 'ln' ? `$${d.k}\\ln e^{${d.c}}-${d.k}\\ln1=${t}$.` : `$${d.k}(e^{${d.c}}-1)\\approx${dec(t, 2).replace(',', '{,}')}$.`);
    if (d.kind === 'exp' && Math.abs(v - d.k * Math.exp(d.c)) < 0.011) return api.result(false, 'Falta restar el valor en 0: $k\\,e^0=k$.');
    return api.result(false, d.kind === 'ln' ? 'Primitiva $k\\ln x$; evalúa y resta.' : 'Primitiva $k\\,e^x$; evalúa en el límite de arriba y resta el de abajo.');
  };

  return (
    <Stage>
      <Cap
        x={800}
        y={300}
        size={42}
        color={C.text}
        tex={round === 0 ? `\\int_{${d.a}}^{${d.b}}\\left(${poly(d.cs)}\\right)dt` : round === 1 ? `r(t)=${poly(d.cs.map((x) => -x))}` : d.kind === 'ln' ? `\\int_1^{${d.c === 1 ? 'e' : 'e^2'}}\\frac{${d.k}}{x}\\,dx` : `\\int_0^{${d.c}}${d.k}\\,e^{x}\\,dx`}
      />
      <NumberField x={560} y={500} value={val} onChange={setVal} onEnter={submit} label="=" width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c5',
  world: 'integral',
  code: '3.5',
  title: 'Primitivas',
  subtitle: 'Teorema fundamental (II)',
  glyph: 'F(b)-F(a)',
  kind: 'level',
  guide: 'marta',
  teaser: 'Los ingenieros describen el caudal de la tubería 7 con una fórmula. Con una primitiva, el volumen de la noche sale exacto, sin rectángulos.',
  learn: 'Primitivas como derivadas al revés, la constante $C$, primitivas básicas (potencias, $e^x$, $1/x$) y el teorema fundamental: $\\int_a^b f=F(b)-F(a)$.',
  glyphs: ['antider', 'ftc2'],
  pitfalls: ['$\\int x^n\\,dx=\\tfrac{x^{n+1}}{n+1}$ no vale para $n=-1$: ahí aparece $\\ln|x|$.', 'En una integral definida la $C$ se cancela; en una indefinida no se olvida.', 'Siempre se resta: primero el límite de arriba, después el de abajo.'],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'nar', text: 'Sala de control de Peñuelas, 16:00; huele a tinta del manual.' },
        { who: 'marta', text: 'Aquí está la fórmula de la tubería 7. Es más fácil copiar el informe que comprobar cuánto da entre las 00:00 y las 06:00.' },
        { who: 'iris', text: 'Y más cómodo. Haz la cuenta con lo que dice el propio manual.' },
        { who: 'marta', text: 'La puedo comprobar término por término. Esta vez el total tendrá de dónde salir.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La fórmula del manual',
      Scene: FormulaDemo,
      beats: [
        {
          say: 'El caudal de la tubería 7 según el manual, en miles de m³ por hora.',
          ask: {
            prompt: '¿Cuál es una primitiva de $Q(t)=2+1{,}5t-0{,}25t^2$?',
            options: ['$2t+0{,}75t^2-\\tfrac{t^3}{12}$', '$1{,}5-0{,}5t$', '$2t+1{,}5t^2-0{,}25t^3$'],
            answer: 0,
            explain: 'Término a término: $2\\to2t$, $1{,}5t\\to0{,}75t^2$, $-0{,}25t^2\\to-\\tfrac{t^3}{12}$. La segunda opción es la derivada, no la primitiva.',
          },
          note: { label: 'Primitiva del caudal', tex: 'F(t)=2t+0{,}75t^2-\\tfrac{t^3}{12}' },
        },
        {
          say: 'El volumen de la noche es la integral de 0 a 6: la primitiva evaluada en 6 menos en 0.',
          dur: 1.8,
          note: { label: 'Volumen exacto', tex: 'F(6)-F(0)=12+27-18=21', body: 'Mil m³, sin rectángulos.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Cuentas exactas', Comp: Primitives, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'marta', text: 'Según el manual, 21 mil m³ exactos entre las 00:00 y las 06:00. Es la cuenta de su fórmula, distinta de la del registro medido.' },
        { who: 'iris', text: 'El informe de 8 mil tampoco se sostiene con el manual.' },
        { who: 'teo', text: 'Queda la válvula vieja: ayer la cerraron a medias y desde entonces pierde cada vez menos.' },
        { who: 'marta', text: 'Menos por hora. Cuando miras debajo, todavía está pasando agua.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'antider', world: 'integral', tex: '\\int f(x)\\,dx=F(x)+C', name: 'Integral indefinida', read: 'integral de efe de equis de equis', meaning: 'La familia de todas las primitivas de $f$: funciones cuya derivada es $f$.' },
  { id: 'ftc2', world: 'integral', tex: '\\int_a^b f=F(b)-F(a)', name: 'Teorema fundamental (II)', read: 'regla de barrow', meaning: 'Una integral definida se calcula con cualquier primitiva: valor en $b$ menos valor en $a$.' },
];
