import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Line } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
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
        <Cap
          x={1330}
          y={220}
          size={26}
          color={C.violet}
          tex={`\\int_0^{b}e^{-x}dx=${dec(area, 4).replace(',', '{,}')}`}
        />
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
        <Cap
          x={1330}
          y={220}
          size={24}
          color={C.green}
          tex={`\\int_1^{b}\\tfrac{1}{x^2}=${dec(a2, 3).replace(',', '{,}')}\\to1`}
        />
        <Cap
          x={1330}
          y={290}
          size={24}
          color={C.red}
          tex={`\\int_1^{b}\\tfrac{1}{x}=${dec(a1, 3).replace(',', '{,}')}\\to\\infty`}
        />
        {beat === 2 && answer !== null && (
          <Cap x={1330} y={380} size={22} color={C.amber} tex="p>1:\ \text{converge}" />
        )}
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
        <AreaUnder
          P={P}
          f={(x) => 1 / Math.sqrt(x)}
          a={Math.max(0.028, eps)}
          b={1}
          pos={C.violet}
          opacity={0.4}
        />
        <Curve
          P={P}
          f={(x) => Math.min(6, 1 / Math.sqrt(x))}
          a={0.028}
          b={1.05}
          color={C.cyan}
          width={4}
        />
        <Cap
          x={1330}
          y={220}
          size={24}
          color={C.violet}
          tex={`\\int_{${dec(eps, 3).replace(',', '{,}')}}^1\\tfrac{dx}{\\sqrt x}=${dec(2 - 2 * Math.sqrt(eps), 3).replace(',', '{,}')}`}
        />
        <Cap x={1330} y={290} size={20} color={C.green} tex="\to2" />
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={260} size={40} color={C.text} tex="\int_0^\infty 6\,e^{-0{,}5t}\,dt" />
      <Group opacity={answer !== null ? 1 : 0}>
        <Cap
          x={800}
          y={420}
          size={30}
          color={C.green}
          tex="=\lim_{b\to\infty}12\,(1-e^{-0{,}5b})=12"
        />
      </Group>
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Integrales impropias',
  intro: {
    question: '¿Puede sumar un total finito algo que nunca se detiene?',
    text: 'Una integral impropia tiene un extremo infinito o una función que se dispara. Se calcula como límite, y a veces da un número finito aunque el intervalo no termine. La válvula vieja gotea cada vez menos sin llegar a cero, y hay que saber cuánto suma la fuga completa.',
  },
  Scene: ImproperLesson,
  beats: [
    {
      say: '¿Tiene sentido hablar del área bajo $e^{-x}$ desde 0 hasta el infinito? Una **integral impropia** puede tener un extremo infinito. Se define mediante el límite de integrales en intervalos finitos, siempre que esas integrales existan. La notación $b\\to\\infty$ se lee «b tiende a infinito»: el corte crece sin límite.\n\nPara $e^{-x}$, el área hasta $b$ es $1-e^{-b}$; la integral sirve para calcular el área total sin sustituir infinito como si fuera un número.',
      gate: 'Arrastra $b$ hacia la derecha hasta el extremo y observa cómo cambia el área acumulada.',
      after:
        'Al llegar a $b\\ge 11{,}5$, el área mostrada se redondea a 1. El límite es 1: extender el intervalo añade cada vez menos área.',
      board: [
        {
          label: 'Integral impropia',
          tex: '\\int_a^{\\infty}f(x)\\,dx=\\p{1}{\\lim_{b\\to\\infty}}\\p{2}{\\int_a^b f(x)\\,dx}',
          parts: ['extendemos el intervalo', 'área hasta el corte'],
        },
        {
          tex: '\\int_0^\\infty e^{-x}dx=\\lim_{b\\to\\infty}(1-e^{-b})=\\p{1}{1}',
          parts: ['área total finita'],
        },
      ],
    },
    {
      say: 'Una integral impropia **converge** si el límite que la define es finito; **diverge** si ese límite no es finito o no existe. Para $1/x^2$ desde 1, el área se acerca a 1; para $1/x$, crece sin límite, aunque lentamente.\n\nAmbas funciones tienden a cero, pero eso por sí solo no garantiza un área finita. Aquí $\\ln b$ se lee «logaritmo natural de b».',
      dur: 4,
      board: [
        {
          label: 'Converge',
          tex: '\\int_1^\\infty\\frac{dx}{x^2}=\\lim_{b\\to\\infty}\\Big(1-\\frac1b\\Big)=\\p{1}{1}',
          parts: ['área total finita'],
        },
        {
          label: 'Diverge',
          tex: '\\int_1^\\infty\\frac{dx}{x}=\\lim_{b\\to\\infty}\\ln b=\\p{1}{\\infty}',
          parts: ['área sin límite'],
        },
      ],
    },
    {
      say: 'El **criterio p** permite decidir si el área bajo $1/x^p$ desde 1 hasta infinito es finita, comparando el exponente $p$ con 1. Se lee «uno sobre x elevado a p». La frontera es $p=1$: revisa la condición de la pizarra antes de responder. Que la función tienda a cero no basta para concluir que el área sea finita.',
      ask: {
        prompt: '¿Converge $\\int_1^\\infty\\frac{dx}{x^{1{,}5}}$?',
        options: ['Sí: p = 1,5 > 1', 'No: nunca llega a 0', 'Solo si se corta en 1000'],
        answer: 0,
        explain:
          'Con $p>1$ la primitiva $\\tfrac{x^{1-p}}{1-p}$ tiende a 0 cuando $x\\to\\infty$: el área total es $\\tfrac{1}{p-1}=2$.',
      },
      board: {
        label: 'Criterio p',
        tex: '\\int_1^\\infty\\frac{dx}{x^p}=\\begin{cases}\\frac{1}{p-1}&p>1\\\\ \\infty&p\\le1\\end{cases}',
      },
    },
    {
      say: 'Una integral también es impropia cuando la función crece sin límite en un extremo del intervalo. En $1/\\sqrt x$, leído «uno sobre raíz de x», eso ocurre al acercarse a 0 por la derecha. Se integra desde $\\varepsilon>0$ hasta 1 y luego se toma el límite cuando $\\varepsilon$ tiende a 0 por valores positivos. El área resulta finita: vale 2.',
      dur: 3.4,
      board: {
        label: 'Altura infinita',
        tex: '\\int_0^1\\frac{dx}{\\sqrt x}=\\lim_{\\varepsilon\\to0^+}\\big[2\\sqrt x\\big]_\\varepsilon^1=\\p{1}{2}',
        parts: ['área total finita'],
      },
    },
    {
      say: 'Volvamos a la fuga de la válvula vieja: su caudal disminuye con el tiempo y sigue siendo positivo. Integrar el caudal desde $t=0$ hasta infinito permite calcular el volumen perdido. Para un modelo $Ae^{-kt}$ con $k>0$, se integra hasta un tiempo finito y se toma el límite; usa la regla de la pizarra para responder.',
      ask: {
        prompt: '¿Cuánta agua perderá en total, si nadie la cierra?',
        options: ['12 mil m³', 'Infinita', '6 mil m³'],
        answer: 0,
        explain:
          '$\\int_0^\\infty 6e^{-0{,}5t}dt=\\tfrac{6}{0{,}5}=12$. La fuga nunca se detiene, pero el total es finito.',
      },
      board: {
        label: 'Exponencial',
        tex: '\\int_0^\\infty A\\,e^{-kt}dt=\\p{1}{\\frac{A}{k}}',
        parts: ['volumen total perdido'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
function TotalDemo({ beats, unlock }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const unlocked = useRef(false);
  const [cut, setCut] = useState(1);
  const [marks, setMarks] = useState<(boolean | null)[]>([null, null]);
  const P = plane([0, 20], [0, 7], { x: 300, y: 120, w: 820, h: 520 });
  useEffect(() => { unlocked.current = false; }, [beat]);
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 0) return;
    const t = clamp(P.inv(x, 0)[0], 0, 20);
    setCut(t);
    if (Math.abs(t - 6) <= 0.4 && !unlocked.current) {
      unlocked.current = true;
      unlock();
    }
  });
  const mark = (index: number, finite: boolean) => {
    const next = marks.map((value, i) => i === index ? finite : value);
    setMarks(next);
    if (beat === 1 && next[0] === true && next[1] === false && !unlocked.current) {
      unlocked.current = true;
      unlock();
    }
  };
  const B = beat === 0 ? cut : 20;
  const vol = 12 * (1 - Math.exp(-0.5 * B));
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[0, 5, 10, 15, 20]} yTicks={[2, 4, 6]} xLabel="t" yLabel="q" grid />
      <AreaUnder P={P} f={(t) => 6 * Math.exp(-0.5 * t)} a={0} b={B} pos={C.violet} opacity={0.45} />
      <Curve P={P} f={(t) => 6 * Math.exp(-0.5 * t)} a={0} b={20} color={C.cyan} width={4} />
      {beat === 0 && (
        <>
          <Line a={P.pt(cut, 0)} b={P.pt(cut, 7)} color={C.text} dashed />
          <Knob x={P.x(cut)} y={P.y(0) + 30} onPointerDown={drag} axis="x" label="t" />
          <Cap x={1330} y={220} size={26} tex={`t=${dec(cut, 1).replace(',', '{,}')}\\;\\mathrm{h}`} />
          <Cap x={1330} y={300} size={26} color={C.violet} tex={`V=${dec(vol, 2).replace(',', '{,}')}\\;\\text{mil m}^3`} />
        </>
      )}
      {beat === 1 && (
        <>
          <Curve P={P} f={(t) => 3 / (t + 0.5)} a={0} b={20} color={C.red} width={3} />
          <Cap x={1330} y={155} size={25} color={C.cyan} tex="6e^{-0{,}5t}" />
          <Cap x={1330} y={370} size={25} color={C.red} tex="\frac{3}{t+0{,}5}" />
          {[0, 1].map((i) => (
            <Html key={i} x={1330} y={i === 0 ? 245 : 460} size={24} interactive>
              <div className="stage-choices">
                {(i === 0 ? [false, true] : [true, false]).map((finite) => (
                  <button key={String(finite)} className={`stage-btn ${marks[i] === finite ? 'on' : ''}`} onClick={() => mark(i, finite)}>
                    {finite ? 'Finita' : 'Sin límite'}
                  </button>
                ))}
              </div>
            </Html>
          ))}
        </>
      )}
      {beat === 2 && <Cap x={1330} y={250} size={26} color={C.violet} tex="V_{\infty}=12\;\text{mil m}^3" />}
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
      api.prompt(
        `Una fuga sigue $q(t)=${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}$ miles de m³/h. ¿Cuánto se pierde en total, para siempre?`,
        '\\int_0^\\infty A\\,e^{-kt}\\,dt',
      );
      api.hints(['Integra hasta $b$ y deja $b\\to\\infty$.', '$e^{-kb}\\to0$: queda $A/k$.']);
    } else if (round === 1) {
      api.prompt(
        'Decide para cada integral si converge (área finita) o diverge.',
        '\\int_1^\\infty\\frac{dx}{x^p}:\\ p>1',
      );
      api.hints([
        'Hacia infinito: converge si baja más rápido que $1/x$.',
        'Cerca de 0: $1/x^p$ tiene área finita si $p<1$.',
      ]);
    } else {
      api.prompt('Calcula la integral impropia.', `\\int_1^\\infty\\frac{${d.c}}{x^{${d.p}}}\\,dx`);
      api.hints([
        `Primitiva: $${d.c}\\cdot\\tfrac{x^{1-${d.p}}}{1-${d.p}}$.`,
        `Resultado: $\\tfrac{${d.c}}{${d.p}-1}$.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (marks.some((m) => m === null)) return;
      const bad = d.cases.findIndex((c, i) => c.conv !== marks[i]);
      if (bad < 0)
        return api.result(true, d.cases.map((c) => (c.conv ? 'converge' : 'diverge')).join(' · '));
      return api.result(
        false,
        `$${d.cases[bad].tex}$ ${d.cases[bad].conv ? 'converge: su área es finita' : 'diverge: su área crece sin límite'}.`,
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = d.A / d.k;
      if (Math.abs(v - t) < 0.01)
        return api.result(
          true,
          `$\\tfrac{${d.A}}{${dec(d.k, 2).replace(',', '{,}')}}=${dec(t, 2).replace(',', '{,}')}$ mil m³. Nunca se detiene, pero el total es finito.`,
        );
      if (Math.abs(v - d.A * d.k) < 0.01)
        return api.result(
          false,
          'Se divide por $k$, no se multiplica: viene de $\\int e^{-kt}dt=-\\tfrac1k e^{-kt}$.',
        );
      return api.result(false, `Total: $\\tfrac{A}{k}$ con $A=${d.A}$ y $k=${dec(d.k, 2)}$.`);
    }
    const t = d.c / (d.p - 1);
    if (Math.abs(v - t) < 0.01)
      return api.result(true, `$\\tfrac{${d.c}}{${d.p}-1}=${dec(t, 2).replace(',', '{,}')}$.`);
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
                <button
                  className={`stage-btn ${marks[i] === true ? 'on' : ''}`}
                  onClick={() => setMarks(marks.map((m, k) => (k === i ? true : m)))}
                >
                  converge
                </button>
                <button
                  className={`stage-btn ${marks[i] === false ? 'on' : ''}`}
                  onClick={() => setMarks(marks.map((m, k) => (k === i ? false : m)))}
                >
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
      <Cap
        x={800}
        y={300}
        size={42}
        color={C.text}
        tex={
          round === 0
            ? `\\int_0^\\infty ${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}\\,dt`
            : `\\int_1^\\infty\\frac{${d.c}}{x^{${d.p}}}\\,dx`
        }
      />
      <NumberField
        x={560}
        y={500}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="="
        width={6}
      />
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
  teaser:
    'La válvula vieja gotea cada vez menos, sin llegar nunca a cero. Falta saber cuánto suma la fuga entera.',
  learn:
    'Integrales sobre intervalos infinitos como límites, convergencia y divergencia, el criterio $1/x^p$ e integrales con altura infinita.',
  glyphs: ['improper'],
  pitfalls: [
    'Que $f\\to0$ no garantiza área finita: $1/x$ tiende a 0 y su área diverge.',
    'Hacia infinito converge $1/x^p$ con $p>1$; cerca de 0, con $p<1$.',
    'Una integral impropia se define como límite: no se reemplaza $\\infty$ directamente.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'nar',
          text: 'Válvula vieja de Peñuelas, cinco y media. El goteo caía en el balde a intervalos cada vez más largos.',
        },
        {
          who: 'iris',
          text: 'Necesito la pérdida completa si nadie la cierra. Un caudal pequeño también puede vaciar una reserva.',
        },
        {
          who: 'marta',
          text: 'La fuga se hace cada vez menor. Hay que ver si lo que añade después sigue pesando en el total.',
        },
        { who: 'tu', text: 'No daría el daño por resuelto solo porque ahora cuesta verlo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Para siempre',
      Scene: TotalDemo,
      beats: [
        {
          say: 'El área bajo el caudal representa el volumen perdido. El modelo de la válvula suma 12 mil m³ en total. ¿Después de cuántas horas se habrá perdido aproximadamente el 95 %?',
          gate: 'Calcula el 95 % de 12 y arrastra el corte hasta el tiempo correspondiente.',
          after: 'Cerca de las 6 horas se han perdido 11,4 mil m³, aproximadamente el 95 % de los 12 mil m³ totales.',
        },
        {
          say: 'Teo propone otro modelo para el sensor que deriva: $\\tfrac{3}{t+0{,}5}$, que también tiende a 0. ¿Daría una pérdida total finita?',
          gate: 'Clasifica la pérdida total de cada modelo como finita o sin límite. Puedes cambiar tus marcas.',
          after: 'El modelo $6e^{-0{,}5t}$ suma 12 mil m³. El modelo $\\tfrac{3}{t+0{,}5}$ crece como $3\\ln t$ y su pérdida no tiene límite.',
          note: {
            label: 'Tender a cero no basta',
            body: 'Importa qué tan rápido: más rápido que $1/t$.',
          },
        },
        {
          say: 'El modelo de la válvula permite calcular la pérdida completa aunque el caudal siga siendo positivo.',
          note: {
            label: 'Pérdida total',
            tex: '\\int_0^\\infty6e^{-0{,}5t}dt=12',
            body: 'Mil m³: después de unas 10 horas ya se perdió casi todo.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Para siempre', Comp: Infinite, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'marta',
          text: 'Con este modelo, la pérdida completa suma 12 mil m³. Es un total limitado, pero dejarla abierta cuesta eso.',
        },
        {
          who: 'teo',
          text: 'Encontré comandos que alteran los caudalímetros cada noche. Vienen de un servidor externo.',
        },
        {
          who: 'iris',
          text: 'Si cerramos la válvula desde la sala de control, alguien va a tener que dar explicaciones.',
        },
        {
          who: 'marta',
          text: 'Guarda también esas explicaciones. Las del agua ya las corrigieron dos veces este mes.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'improper',
    world: 'integral',
    tex: '\\int_a^\\infty f=\\lim_{b\\to\\infty}\\int_a^b f',
    name: 'Integral impropia',
    read: 'integral impropia',
    meaning:
      'Integral con un límite infinito o con integrando no acotado, definida como límite. Converge si ese límite es un número.',
  },
];
