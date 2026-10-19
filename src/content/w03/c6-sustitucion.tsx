import { useEffect, useMemo, useState } from 'react';
import { clamp } from '../../engine/anim';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Curve } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder, integrate } from './kit';

// ============================================================================
// CASO 3.6 · «Cambio de variable» — sustitución
// La regla de la cadena al revés: si el integrando es f(g(x))·g'(x), con u = g(x) y du = g'(x)dx
// la integral se vuelve ∫ f(u) du. Visual: una franja dx en x se estira a du = g'(x) dx en u.
// Exponenciales que decaen: ∫ e^{-kt} dt = −e^{-kt}/k.
// ============================================================================

// ---------------------------------------------------------------- lesson
function SubstLesson({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  if (beat <= 1) {
    const k = at(beat);
    return (
      <Stage>
        {beat === 0 ? (
          <>
            <Cap
              x={800}
              y={220}
              size={36}
              color={C.text}
              tex="\frac{d}{dx}\big(\cC{x^2+1}\big)^3=3\big(\cC{x^2+1}\big)^2\cdot\cA{2x}"
            />
            <Cap
              x={800}
              y={380}
              size={34}
              color={C.text}
              tex="\int 3\big(\cC{x^2+1}\big)^2\cdot\cA{2x}\,dx=\big(\cC{x^2+1}\big)^3+C"
              opacity={clamp(k * 2 - 0.4, 0, 1)}
            />
            <Cap x={800} y={520} size={22} color={C.muted} opacity={clamp(k * 2 - 1, 0, 1)}>
              una función de adentro (celeste) y su derivada multiplicando (naranja)
            </Cap>
          </>
        ) : (
          <>
            <Cap
              x={800}
              y={180}
              size={32}
              color={C.text}
              tex="\int \cA{2x}\,\big(\cC{x^2+1}\big)^3\,dx"
            />
            <Cap
              x={800}
              y={300}
              size={28}
              color={C.cyan}
              tex="u=x^2+1,\qquad du=\cA{2x}\,dx"
              opacity={clamp(k * 3, 0, 1)}
            />
            <Cap
              x={800}
              y={420}
              size={32}
              color={C.text}
              tex="=\int u^3\,du=\frac{u^4}{4}+C"
              opacity={clamp(k * 3 - 1, 0, 1)}
            />
            <Cap
              x={800}
              y={540}
              size={32}
              color={C.green}
              tex="=\frac{(x^2+1)^4}{4}+C"
              opacity={clamp(k * 3 - 2, 0, 1)}
            />
          </>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    // strip dx at x maps to du = 2x dx in u = x²
    const PX = plane([0, 2.2], [0, 9], { x: 180, y: 140, w: 560, h: 480 });
    const PU = plane([0, 4.6], [0, 4.5], { x: 860, y: 140, w: 560, h: 480 });
    const fx = (x: number) => 2 * x * Math.exp(-(x * x) / 4) * 1.6;
    const fu = (u: number) => Math.exp(-u / 4) * 1.6;
    const x0 = 0.4 + 1.4 * at(2);
    const dx = 0.15;
    return (
      <Stage>
        <Axes P={PX} xTicks={[1, 2]} yTicks={[]} xLabel="x" yLabel="" grid={false} />
        <Curve P={PX} f={fx} a={0} b={2.2} color={C.cyan} width={3} />
        <AreaUnder P={PX} f={fx} a={x0} b={x0 + dx} pos={C.amber} opacity={0.8} />
        <Cap x={PX.x(1.1)} y={110} size={20} color={C.cyan} tex="f(x^2)\cdot2x" />
        <Axes P={PU} xTicks={[1, 2, 3, 4]} yTicks={[]} xLabel="u" yLabel="" grid={false} />
        <Curve P={PU} f={fu} a={0} b={4.6} color={C.violet} width={3} />
        <AreaUnder P={PU} f={fu} a={x0 * x0} b={(x0 + dx) ** 2} pos={C.amber} opacity={0.8} />
        <Cap x={PU.x(2.3)} y={110} size={20} color={C.violet} tex="f(u)" />
        <Arrow
          from={[PX.x(x0 + dx / 2), PX.y(0) + 40]}
          to={[PU.x(x0 * x0 + x0 * dx), PU.y(0) + 40]}
          color={C.amber}
          width={2.5}
          curve={-0.25}
        />
        <Cap
          x={800}
          y={720}
          size={22}
          color={C.amber}
          tex={`dx=0{,}15\\ \\to\\ du=2x\\,dx=${dec(2 * x0 * dx, 2).replace(',', '{,}')}`}
        />
      </Stage>
    );
  }
  if (beat === 3) {
    const P3 = plane([0, 6], [0, 1.1], { x: 300, y: 140, w: 820, h: 480 });
    const k = at(3);
    return (
      <Stage>
        <Axes P={P3} xTicks={[1, 2, 3, 4, 5, 6]} yTicks={[0.5, 1]} xLabel="t" yLabel="" grid />
        <AreaUnder
          P={P3}
          f={(t) => Math.exp(-0.5 * t)}
          a={0}
          b={6 * k + 0.01}
          pos={C.violet}
          opacity={0.4}
        />
        <Curve P={P3} f={(t) => Math.exp(-0.5 * t)} a={0} b={6} color={C.cyan} width={4} />
        <Cap x={1330} y={220} size={24} color={C.cyan} tex="e^{-0{,}5t}" />
        <Cap
          x={1330}
          y={290}
          size={22}
          color={C.violet}
          tex={`\\text{área}=${dec(
            integrate((t) => Math.exp(-0.5 * t), 0, 6 * k + 0.01),
            3,
          ).replace(',', '{,}')}`}
        />
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={240} size={38} color={C.text} tex="\int_0^1 2x\,e^{x^2}\,dx" />
      {answer !== null && (
        <>
          <Cap
            x={800}
            y={380}
            size={28}
            color={C.cyan}
            tex="u=x^2:\quad x=0\to u=0,\quad x=1\to u=1"
          />
          <Cap
            x={800}
            y={490}
            size={30}
            color={C.green}
            tex="\int_0^1 e^{u}\,du=e-1\approx1{,}718"
          />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sustitución',
  Scene: SubstLesson,
  beats: [
    {
      say: 'La regla de la cadena deja una huella: una función **de adentro** y su derivada multiplicando. Si reconocemos esa huella en un integrando, sabemos integrarlo.',
      dur: 3.4,
      board: {
        label: 'La cadena al revés',
        tex: "\\int f'\\big(\\p{1}{\\cC{g(x)}}\\big)\\,\\p{2}{\\cA{g'(x)}}\\,dx=\\p{3}{f\\big(g(x)\\big)}+C",
        parts: ['función de adentro', 'derivada de adentro', 'primitiva de la composición'],
      },
    },
    {
      say: 'El procedimiento: se llama $u$ a la función de adentro, se calcula $du$, se reemplaza todo y se integra en $u$. Al final se vuelve a $x$.',
      dur: 4,
      board: [
        {
          label: 'Sustitución',
          tex: "\\p{1}{u=g(x)},\\qquad \\p{2}{du=g'(x)\\,dx}",
          parts: ['nueva variable', 'cambio de ancho'],
        },
        {
          tex: "\\int f\\big(g(x)\\big)\\,g'(x)\\,dx=\\p{1}{\\int f(u)\\,du}",
          parts: ['integral en nueva variable'],
        },
      ],
    },
    {
      say: "Por qué funciona: una franja de ancho $dx$ en el eje $x$ corresponde a una franja de ancho $du=g'(x)\\,dx$ en el eje $u$. El factor $g'(x)$ corrige el estiramiento, así que las áreas coinciden.",
      dur: 4,
      board: {
        label: 'Con límites',
        tex: "\\int_a^b f(g(x))\\,g'(x)\\,dx=\\int_{\\p{1}{g(a)}}^{\\p{2}{g(b)}}f(u)\\,du",
        body: 'En una integral definida, los límites también se transforman.',
        parts: ['inicio en nueva variable', 'final en nueva variable'],
      },
    },
    {
      say: 'Un caso que aparece en todas partes: la exponencial que decae. Con $u=-kt$ se obtiene su primitiva.',
      dur: 3.4,
      board: [
        { tex: 'u=-kt,\\qquad du=-k\\,dt' },
        {
          label: 'Exponencial que decae',
          tex: '\\int e^{-kt}\\,dt=\\p{1}{-\\frac{1}{k}}\\,e^{-kt}+C',
          parts: ['factor que compensa'],
        },
        {
          tex: '\\int_0^T e^{-kt}\\,dt=\\p{1}{\\frac{1-e^{-kT}}{k}}',
          parts: ['acumulación hasta el final'],
        },
      ],
    },
    {
      say: 'Pruébalo con una integral definida.',
      ask: {
        prompt: '¿Cuánto vale $\\int_0^1 2x\\,e^{x^2}\\,dx$?',
        options: ['e − 1 ≈ 1,72', 'e ≈ 2,72', '2'],
        answer: 0,
        explain: 'Con $u=x^2$, $du=2x\\,dx$ y los límites pasan a 0 y 1: $\\int_0^1e^u\\,du=e-1$.',
      },
      board: {
        tex: '\\int_0^1 2x\\,e^{x^2}dx=\\int_0^1 e^u\\,du=\\p{1}{e-1}',
        parts: ['área bajo la curva'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const leak = (t: number) => 6 * Math.exp(-0.5 * t);
const PD = plane([0, 8], [0, 7], { x: 300, y: 120, w: 820, h: 520 });

function LeakDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[0, 2, 4, 6, 8]}
        yTicks={[2, 4, 6]}
        xLabel="t\ (\text{h})"
        yLabel="q"
        grid
      />
      <AreaUnder P={PD} f={leak} a={0} b={4} pos={C.violet} opacity={0.4} />
      <Curve P={PD} f={leak} a={0} b={8} color={C.cyan} width={4} />
      <Cap x={1330} y={200} size={24} color={C.cyan} tex="q(t)=6\,e^{-0{,}5t}" />
      <Group opacity={beat >= 1 || answer !== null ? 1 : 0}>
        <Cap
          x={1330}
          y={280}
          size={22}
          color={C.green}
          tex="\int_0^4 q=12\,(1-e^{-2})\approx10{,}4"
        />
      </Group>
      <Html x={PD.x(2)} y={PD.y(0.6)} size={18} color={C.text}>
        <span>primeras 4 horas</span>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const U_CASES = [
  { tex: '\\int 3x^2\\cos(x^3)\\,dx', right: 'x^3', wrong: ['3x^2', '\\cos x'] },
  { tex: '\\int \\frac{2x}{x^2+5}\\,dx', right: 'x^2+5', wrong: ['2x', '\\frac1x'] },
  { tex: '\\int e^{4t}\\,dt', right: '4t', wrong: ['e^{4t}', 't^4'] },
  { tex: '\\int (5x+1)^7\\,dx', right: '5x+1', wrong: ['(5x+1)^7', 'x^7'] },
  { tex: '\\int x\\,e^{-x^2}\\,dx', right: '-x^2', wrong: ['x', 'e^{x}'] },
];

function Substitution({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const A = pick(r, [4, 6, 8, 10]);
    const k = pick(r, [0.25, 0.5, 1]);
    const T = pick(r, [2, 4]);
    const n = pick(r, [2, 3]);
    const cse = pick(r, U_CASES);
    const opts = shuffle(r, [cse.right, ...cse.wrong]);
    const a = randInt(r, 1, 3);
    return { A, k, T, n, cse, opts, a };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        `La fuga de la válvula vieja sigue $q(t)=${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}$ miles de m³/h. ¿Cuánta agua se pierde en las primeras ${d.T} horas? (Dos decimales.)`,
        `\\int_0^{${d.T}}${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}\\,dt`,
      );
      api.hints([
        '$\\int e^{-kt}dt=-\\tfrac1k e^{-kt}$.',
        `Resultado: $${d.A}\\cdot\\tfrac{1-e^{-kT}}{k}$.`,
      ]);
    } else if (round === 1) {
      api.prompt(
        'Calcula con sustitución. (Dos decimales.)',
        `\\int_0^1 ${2 * d.a}x\\,\\big(${d.a}x^2+1\\big)^{${d.n}}\\,dx`,
      );
      api.hints([
        `$u=${d.a}x^2+1$, $du=${2 * d.a}x\\,dx$.`,
        `Límites: $u(0)=1$, $u(1)=${d.a + 1}$. Integra $u^{${d.n}}$.`,
      ]);
    } else {
      api.prompt('¿Qué conviene llamar $u$ para resolver esta integral?', d.cse.tex);
      api.hints([
        'Busca una función de adentro cuya derivada aparezca (casi) multiplicando.',
        'Las constantes que faltan se ajustan después.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === d.cse.right)
        return api.result(
          true,
          `Con $u=${d.cse.right}$, su derivada aparece en el integrando y todo queda en función de $u$.`,
        );
      return api.result(
        false,
        `Con $u=${choice}$ no aparece su derivada multiplicando. Prueba con la expresión que está «adentro».`,
      );
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = (d.A * (1 - Math.exp(-d.k * d.T))) / d.k;
      if (Math.abs(v - t) < 0.011)
        return api.result(
          true,
          `$${d.A}\\cdot\\tfrac{1-e^{-${dec(d.k * d.T, 2).replace(',', '{,}')}}}{${dec(d.k, 2).replace(',', '{,}')}}\\approx${dec(t, 2).replace(',', '{,}')}$ mil m³.`,
        );
      if (Math.abs(v - d.A * (1 - Math.exp(-d.k * d.T))) < 0.011)
        return api.result(false, 'Falta dividir por $k$: viene de $du=-k\\,dt$.');
      return api.result(
        false,
        `Primitiva: $-\\tfrac{${d.A}}{k}e^{-kt}$. Evalúa en ${d.T} y en 0 y resta.`,
      );
    }
    const t = ((d.a + 1) ** (d.n + 1) - 1) / (d.n + 1);
    if (Math.abs(v - t) < 0.011)
      return api.result(
        true,
        `$\\int_1^{${d.a + 1}}u^{${d.n}}\\,du=\\tfrac{${d.a + 1}^{${d.n + 1}}-1}{${d.n + 1}}=${dec(t, 2).replace(',', '{,}')}$.`,
      );
    if (Math.abs(v - (d.a + 1) ** (d.n + 1) / (d.n + 1)) < 0.011)
      return api.result(false, 'Los límites cambian: en $u$ van de 1 (no de 0) a $a+1$.');
    return api.result(
      false,
      `Con $u=${d.a}x^2+1$, la integral es $\\int_1^{${d.a + 1}}u^{${d.n}}\\,du$.`,
    );
  };

  if (round === 2)
    return (
      <Stage>
        <Cap x={800} y={260} size={44} color={C.text} tex={d.cse.tex} />
        <Html x={800} y={460} size={28} interactive>
          <div className="stage-choices">
            {d.opts.map((o) => (
              <button
                key={o}
                className={`stage-btn ${choice === o ? 'on' : ''}`}
                onClick={() => setChoice(o)}
              >
                <Tex tex={`u=${o}`} />
              </button>
            ))}
          </div>
        </Html>
        <Confirm onClick={submit} disabled={choice === null} />
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
            ? `\\int_0^{${d.T}}${d.A}\\,e^{-${dec(d.k, 2).replace(',', '{,}')}t}\\,dt`
            : `\\int_0^1 ${2 * d.a}x\\,\\big(${d.a}x^2+1\\big)^{${d.n}}\\,dx`
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
  id: 'w3-c6',
  world: 'integral',
  code: '3.6',
  title: 'Cambio de variable',
  subtitle: 'Sustitución',
  glyph: 'u=g(x)',
  kind: 'level',
  guide: 'teo',
  teaser:
    'La válvula vieja quedó cerrada a medias, y cada hora pierde la misma fracción de lo que perdía antes.',
  learn:
    "Sustitución $u=g(x)$, $du=g'(x)\\,dx$, cambio de límites, por qué funciona (la franja se estira) e integrales de exponenciales que decaen.",
  glyphs: ['subst'],
  pitfalls: [
    'Al cambiar de variable en una integral definida, cambian también los límites.',
    'Todo el integrando debe quedar en $u$: no puede sobrar ninguna $x$.',
    '$\\int e^{-kt}dt$ lleva el factor $-\\tfrac1k$.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'nar',
          text: 'Válvula vieja de Peñuelas, cuatro y media. El conducto goteaba sobre un balde que alguien había puesto ahí hace tiempo.',
        },
        {
          who: 'marta',
          text: 'Quedó cerrada a medias. Cada hora pierde la misma fracción de lo que perdía la hora anterior.',
        },
        {
          who: 'teo',
          text: 'Necesito saber cuánto se perdió en las primeras cuatro horas. Que ahora parezca poco no borra lo que salió antes.',
        },
        { who: 'iris', text: 'En el parte ya la anotaron como goteo, sin cantidad.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La válvula vieja',
      Scene: LeakDemo,
      beats: [
        {
          say: 'La fuga empieza en 6 mil m³/h y se reduce a la mitad aproximadamente cada 1,4 horas.',
          ask: {
            prompt: 'Para integrar $6\\,e^{-0{,}5t}$, ¿qué sustitución conviene?',
            options: ['$u=-0{,}5t$', '$u=e^{t}$', '$u=6t$'],
            answer: 0,
            explain:
              'La función de adentro de la exponencial es $-0{,}5t$, y su derivada es una constante: se ajusta dividiendo por $-0{,}5$.',
          },
          note: { label: 'Primitiva de la fuga', tex: '\\int6e^{-0{,}5t}dt=-12\\,e^{-0{,}5t}+C' },
        },
        {
          say: 'En las primeras cuatro horas se pierden más de diez mil metros cúbicos.',
          dur: 1.8,
          note: { label: 'Pérdida en 4 h', tex: '12\\,(1-e^{-2})\\approx10{,}4', body: 'Mil m³.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Cambio de variable', Comp: Substitution, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'teo',
          text: 'Unos 10,4 mil m³ en las primeras cuatro horas. La fuga empezó en 6 mil m³ por hora.',
        },
        {
          who: 'marta',
          text: 'Y queda la bomba del canal 7. Arranca a medianoche, sube el caudal y después se va apagando.',
        },
        { who: 'iris', text: '¿Ese bombeo aparece en el informe?' },
        {
          who: 'marta',
          text: 'La cuenta todavía no la tengo. El arranque automático sí quedó en el registro.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'subst',
    world: 'integral',
    tex: "\\int f(g(x))g'(x)\\,dx=\\int f(u)\\,du",
    name: 'Sustitución',
    read: 'cambio de variable',
    meaning:
      "Con $u=g(x)$ y $du=g'(x)dx$, la integral se reescribe en $u$. Es la regla de la cadena al revés.",
  },
];
