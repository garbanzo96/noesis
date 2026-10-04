import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { Group, Html, Stage, plane } from '../../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { BeliefBars, ScoreBars, softmax } from '../shared/Bars';
import { pick, rng } from '../shared/rng';

// ============================================================================
// 1.12 · SOFTMAX — puntuaciones → creencias
// demo: z → e^z → ÷Σ; shift invariance (prediction); σ depends on ALL scores (drag gate);
//       precision γ: flat ↔ winner-take-all (prediction); two options = logistic;
//       q(π)=σ(ln E − γG)
// challenges: precision thermostat (set γ to hit a target); sculpt beliefs (set scores)
// forge: shift invariance, log-softmax, σ(ln w)=w/Σw, logistic form
// ============================================================================

const LN2 = Math.log(2);
const LN3 = Math.log(3);
const OPT = [C.cyan, C.amber, C.blue, C.violet];

// ---------------------------------------------------------------- demo scene
function SoftmaxDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const base = [1, 0, -1];
  const shift = useTween(beat === 3 && answer !== null ? 5 : 0, 1.4);
  const [z3, setZ3] = useState(-1);
  const z3now = useTween(beat === 4 ? z3 : -1, 0.25);
  const gT = useTween(beat === 5 && answer !== null ? 1 : 0, 4.5);
  const gamma = beat === 5 ? (gT < 0.4 ? lerp(1, 0, gT / 0.4) : lerp(0, 6, (gT - 0.4) / 0.6)) : 1;
  const z = [base[0] + shift, base[1] + shift, z3now + shift];
  const w = z.map((v) => Math.exp(gamma * v));
  const wmax = Math.max(...w);
  const p = softmax(z, gamma);

  const SCALE = 60;
  const y0 = 470;
  const onDrag = useSvgDrag(svg, (_x, y) => {
    if (beat !== 4) return;
    const v = clamp((y0 - y) / SCALE, -2.5, 3);
    setZ3(v);
    if (v > base[0] + 0.05) unlock();
  });

  const mainView = 1 - at(6);
  const logView = at(6) * (1 - at(7));
  const polView = at(7);
  const P = plane([-6, 6], [-0.1, 1.15], { x: 300, y: 120, w: 1000, h: 520 });
  const qPol = softmax([0, -LN3]);

  return (
    <Stage ref={svg}>
      <Group opacity={mainView}>
        <Html x={330} y={110} size={20} color={C.magenta}>
          <span className="panel-note">PUNTUACIONES z</span>
        </Html>
        <Html x={800} y={110} size={20} color={C.amber}>
          <span className="panel-note">PESOS e^(γz) · relativos</span>
        </Html>
        <Html x={1270} y={110} size={20} color={C.violet}>
          <span className="panel-note">CREENCIA σ(γz)</span>
        </Html>
        <ScoreBars x={330} y0={y0} values={z} scale={SCALE} gap={110} barW={70} color={OPT} labels={['z_1', 'z_2', 'z_3']} opacity={at(0)} />
        {beat === 4 && (
          <g style={{ cursor: 'ns-resize' }} onPointerDown={onDrag}>
            <rect x={330 + 110 - 50} y={y0 - z3now * SCALE - 30} width={100} height={60} fill="transparent" />
            <Dot x={330 + 110} y={y0 - z3now * SCALE} r={12} color={C.text} ring />
          </g>
        )}
        <Arrow from={[520, 400]} to={[620, 400]} color={C.text} width={3} progress={at(1)} />
        <Html x={570} y={370} size={22} color={C.text} opacity={at(1)}>
          <Tex tex="\exp" />
        </Html>
        <BeliefBars
          x={800}
          y0={650}
          values={w.map((v) => v / wmax)}
          height={380}
          gap={110}
          barW={70}
          color={OPT.map(() => C.amber)}
          opacity={at(1)}
          labels={['e^{z_1}', 'e^{z_2}', 'e^{z_3}']}
        />
        <Arrow from={[980, 400]} to={[1080, 400]} color={C.text} width={3} progress={at(2)} />
        <Html x={1030} y={370} size={22} color={C.text} opacity={at(2)}>
          <Tex tex="\div\textstyle\sum" />
        </Html>
        <BeliefBars x={1270} y0={650} values={p} height={380} gap={110} barW={70} color={OPT} opacity={at(2)} labels={['p_1', 'p_2', 'p_3']} />
        {beat === 3 && answer !== null && (
          <Html x={800} y={760} size={26} color={C.green} opacity={shift / 5}>
            <Tex tex="\mathbf z+5\cdot\mathbf 1:\ \text{pesos}\times e^{5},\ \text{creencia idéntica}" />
          </Html>
        )}
        {beat === 4 && (
          <Html x={800} y={760} size={26} color={C.text}>
            <Tex tex={`z_3=${fmt(z3now, 2)}\\ \\Rightarrow\\ p_1=${fmt(p[0], 2)},\\ p_2=${fmt(p[1], 2)},\\ p_3=${fmt(p[2], 2)}`} />
          </Html>
        )}
        {beat === 5 && (
          <Html x={800} y={760} size={30} color={C.magenta}>
            <Tex tex={`\\gamma=${fmt(gamma, 2)}`} />
          </Html>
        )}
      </Group>

      {/* two options: the logistic curve */}
      <Group opacity={logView}>
        <Axes P={P} xTicks={[-6, -4, -2, 2, 4, 6]} yTicks={[0.5, 1]} xLabel="z_1-z_2" />
        <Curve P={P} f={(d) => 1 / (1 + Math.exp(-d))} color={C.violet} width={4.5} progress={at(6)} />
        <Line a={P.pt(-6, 1)} b={P.pt(6, 1)} color={C.dim} dashed width={1.5} />
        <Dot x={P.x(0)} y={P.y(0.5)} r={8} color={C.violet} />
        <Html x={P.x(3.2)} y={P.y(0.62)} size={28} color={C.violet}>
          <Tex tex="\sigma(\mathbf z)_1=\dfrac{1}{1+e^{-(z_1-z_2)}}" />
        </Html>
        <Html x={P.x(-3.5)} y={P.y(0.85)} size={20} color={C.amber}>
          <span className="panel-note">la «sigmoide»: softmax con dos opciones</span>
        </Html>
      </Group>

      {/* policies */}
      <Group opacity={polView}>
        <Html x={420} y={170} size={22} color={C.muted}>
          <span className="panel-note">ENERGÍA LIBRE ESPERADA G(π)</span>
        </Html>
        <ScoreBars x={420} y0={520} values={[0, LN3]} scale={140} gap={180} barW={90} color={C.magenta} labels={['\\pi_1', '\\pi_2']} />
        <Arrow from={[640, 420]} to={[860, 420]} color={C.text} width={3} />
        <Html x={750} y={385} size={24} color={C.text}>
          <Tex tex="\sigma(-\gamma\mathbf G)" />
        </Html>
        <BeliefBars x={1150} y0={600} values={qPol} height={360} gap={180} barW={90} color={[C.cyan, C.amber]} labels={['q(\\pi_1)', 'q(\\pi_2)']} />
        <Html x={800} y={760} size={26} color={C.text}>
          <Tex tex="\mathbf G=(0,\ln 3),\ E\ \text{uniforme},\ \gamma=1\ \Rightarrow\ q(\pi)=(0.75,\ 0.25)" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: precision thermostat
interface ThermoCase {
  z: number[];
  zTex: string[];
  target: number;
  targetTex: string;
  note: string;
}
function thermoCase(seed: number, round: number): ThermoCase {
  const r = rng(seed);
  const two = { z: [0, -LN3], zTex: ['0', '-\\ln 3'] };
  switch (round) {
    case 0:
      return { ...two, target: 0.75, targetTex: '0.75', note: 'Con $\\gamma=1$: $q_1=\\frac{1}{1+3^{-1}}=0.75$.' };
    case 1:
      return { ...two, target: 0.9, targetTex: '0.9', note: '$q_1=\\frac{1}{1+3^{-\\gamma}}=0.9\\iff 3^{-\\gamma}=\\tfrac19\\iff\\gamma=2$.' };
    case 2:
      return pick(r, [
        { z: [LN2, 0], zTex: ['\\ln 2', '0'], target: 0.8, targetTex: '0.8', note: '$\\frac{2^{\\gamma}}{2^{\\gamma}+1}=0.8\\iff 2^{\\gamma}=4\\iff\\gamma=2$.' },
        { z: [0, -LN2], zTex: ['0', '-\\ln 2'], target: 8 / 9, targetTex: '\\tfrac89', note: '$\\frac{1}{1+2^{-\\gamma}}=\\tfrac89\\iff 2^{-\\gamma}=\\tfrac18\\iff\\gamma=3$.' },
      ]);
    case 3:
      return pick(r, [
        { z: [0, -LN2, -LN2], zTex: ['0', '-\\ln2', '-\\ln2'], target: 2 / 3, targetTex: '\\tfrac23', note: '$\\frac{1}{1+2\\cdot2^{-\\gamma}}=\\tfrac23\\iff\\gamma=2$.' },
        { z: [0, -LN2, -LN2], zTex: ['0', '-\\ln2', '-\\ln2'], target: 0.8, targetTex: '0.8', note: '$\\frac{1}{1+2\\cdot2^{-\\gamma}}=0.8\\iff 2^{-\\gamma}=\\tfrac18\\iff\\gamma=3$.' },
      ]);
    default:
      return pick(r, [
        {
          z: [0, 0, -LN2],
          zTex: ['0', '0', '-\\ln2'],
          target: 0.4,
          targetTex: '0.4',
          note: 'Hay un **empate** en el máximo: $q_1\\le0.5$ para todo $\\gamma$. Aquí $q_1=\\frac{1}{2+2^{-\\gamma}}=0.4\\iff\\gamma=1$.',
        },
        {
          z: [0, 0, -LN2],
          zTex: ['0', '0', '-\\ln2'],
          target: 4 / 9,
          targetTex: '\\tfrac49',
          note: 'Empate en el máximo: $q_1<0.5$ siempre. $\\frac{1}{2+2^{-\\gamma}}=\\tfrac49\\iff\\gamma=2$.',
        },
      ]);
  }
}

function Thermostat({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => thermoCase(seed, round), [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  const [gamma, setGamma] = useState(0.5);
  const q = softmax(cs.z, gamma);
  const T0 = 520;
  const T1 = 1080;
  const GX = (g: number) => T0 + (g / 6) * (T1 - T0);
  const onDrag = useSvgDrag(svg, (x) => {
    const g = Math.round(clamp(((x - T0) / (T1 - T0)) * 6, 0, 6) * 4) / 4;
    if (g !== gamma) api.sfx.tick();
    setGamma(g);
  });
  useEffect(() => {
    api.prompt(
      `Ajusta la **precisión** $\\gamma$ hasta que la creencia en la primera opción sea $q_1=${cs.targetTex}$.`,
      `\\mathbf q=\\sigma(\\gamma\\,\\mathbf z),\\quad \\mathbf z=(${cs.zTex.join(',\\,')})`,
    );
    api.hints(['$\\gamma$ multiplica todas las puntuaciones: $\\gamma\\to0$ aplana, $\\gamma$ grande concentra en el máximo.', cs.note]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const submit = () => {
    if (Math.abs(q[0] - cs.target) < 0.004) return api.result(true, `$\\gamma=${fmt(gamma, 2)}$: $q_1=${fmt(q[0], 3)}$. ${cs.note}`);
    api.result(
      false,
      `Con $\\gamma=${fmt(gamma, 2)}$, $q_1=${fmt(q[0], 3)}$; se pide $${cs.targetTex}\\approx${fmt(cs.target, 3)}$. ${q[0] < cs.target ? 'Hace falta **más** precisión.' : 'Hace falta **menos** precisión.'}`,
    );
  };
  const n = cs.z.length;
  return (
    <Stage ref={svg}>
      <Html x={400} y={140} size={20} color={C.magenta}>
        <span className="panel-note">PUNTUACIONES z</span>
      </Html>
      <ScoreBars x={400} y0={420} values={cs.z} scale={120} gap={140} barW={80} color={OPT} labels={cs.zTex.map((t, i) => `z_${i + 1}=${t}`)} />
      <Html x={1200} y={140} size={20} color={C.violet}>
        <span className="panel-note">CREENCIA q = σ(γz)</span>
      </Html>
      <BeliefBars x={1200} y0={560} values={q} height={360} gap={140} barW={80} color={OPT.slice(0, n)} labels={q.map((_, i) => `q_${i + 1}`)} digits={3} />
      <line x1={1200 - 140 * ((n - 1) / 2) - 70} x2={1200 - 140 * ((n - 1) / 2) + 70} y1={560 - cs.target * 360} y2={560 - cs.target * 360} stroke={C.text} strokeWidth={3} strokeDasharray="8 6" />
      <Html x={1200 - 140 * ((n - 1) / 2) - 90} y={560 - cs.target * 360} size={20} anchor="right" color={C.text}>
        <Tex tex={`\\text{objetivo } ${cs.targetTex}`} />
      </Html>
      {/* γ slider */}
      <line x1={T0} x2={T1} y1={760} y2={760} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((g) => (
        <g key={g}>
          <line x1={GX(g)} x2={GX(g)} y1={772} y2={784} stroke={C.dim} strokeWidth={2} />
          <Html x={GX(g)} y={804} size={18} color={C.muted}>
            <Tex tex={String(g)} />
          </Html>
        </g>
      ))}
      <Dot x={GX(gamma)} y={760} r={15} color={C.magenta} ring onPointerDown={onDrag} cursor="ew-resize" />
      <Html x={GX(gamma)} y={718} size={24} color={C.magenta}>
        <Tex tex={`\\gamma=${fmt(gamma, 2)}`} />
      </Html>
      <Html x={1300} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: sculpt beliefs
const SCULPT: number[][][] = [
  [[0.75, 0.25], [0.2, 0.8]],
  [[0.5, 0.25, 0.25], [0.25, 0.5, 0.25]],
  [[0.6, 0.3, 0.1], [0.1, 0.3, 0.6]],
  [[0.1, 0.2, 0.7], [0.7, 0.2, 0.1]],
];

function Sculpt({ seed, round, api }: ChallengeProps) {
  const target = useMemo(() => pick(rng(seed), SCULPT[Math.min(round, SCULPT.length - 1)]), [seed, round]);
  const n = target.length;
  const svg = useRef<SVGSVGElement>(null);
  const [z, setZ] = useState<number[]>(() => Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0)));
  const grabbed = useRef(-1);
  const p = softmax(z);
  const y0 = 460;
  const SCALE = 75;
  const cx = (i: number) => 400 + (i - (n - 1) / 2) * 150;
  const onDrag = useSvgDrag(svg, (x, y, phase) => {
    if (phase === 'start') {
      let best = -1;
      let bd = 1e9;
      z.forEach((_, i) => {
        const d = Math.abs(cx(i) - x);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      grabbed.current = bd < 75 ? best : -1;
    }
    const i = grabbed.current;
    if (i < 0) return;
    const v = Math.round(clamp((y0 - y) / SCALE, -3, 3) * 20) / 20;
    if (v !== z[i]) setZ(z.map((zz, k) => (k === i ? v : zz)));
    if (phase === 'end') grabbed.current = -1;
  });
  useEffect(() => {
    api.prompt(
      `Esculpe las puntuaciones (arrastra la parte superior de cada barra) para que $\\sigma(\\mathbf z)=(${target.join(',\\,')})$.`,
      `\\sigma(\\mathbf z)_i=\\frac{e^{z_i}}{\\sum_j e^{z_j}}`,
    );
    const k = target.indexOf(Math.min(...target));
    api.hints([
      `Solo importan las **diferencias**: fija $z_${k + 1}=0$ y usa $z_i=\\ln(p_i/p_${k + 1})$.`,
      `Por ejemplo: $\\mathbf z\\approx(${target.map((t) => fmt(Math.log(t / target[k]), 2)).join(',\\,')})$, o esa lista más cualquier constante.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  const submit = () => {
    let worst = 0;
    target.forEach((t, i) => {
      if (Math.abs(p[i] - t) > Math.abs(p[worst] - target[worst])) worst = i;
    });
    if (Math.abs(p[worst] - target[worst]) <= 0.012)
      return api.result(true, `$\\sigma(\\mathbf z)\\approx(${p.map((v) => fmt(v, 2)).join(',\\,')})$. Cualquier $\\mathbf z+c\\,\\mathbf 1$ daría lo mismo.`);
    api.result(
      false,
      `$p_${worst + 1}=${fmt(p[worst], 2)}$, objetivo $${target[worst]}$: ${p[worst] < target[worst] ? 'sube' : 'baja'} $z_${worst + 1}$ **respecto de las demás**.`,
    );
  };
  return (
    <Stage ref={svg}>
      <Html x={400} y={110} size={20} color={C.magenta}>
        <span className="panel-note">PUNTUACIONES z · arrastra</span>
      </Html>
      <g onPointerDown={onDrag} style={{ cursor: 'ns-resize' }}>
        <rect x={cx(0) - 80} y={150} width={150 * (n - 1) + 160} height={560} fill="transparent" />
        <ScoreBars x={400} y0={y0} values={z} scale={SCALE} gap={150} barW={86} color={OPT} labels={z.map((_, i) => `z_${i + 1}`)} />
        {z.map((v, i) => (
          <line key={i} x1={cx(i) - 43} x2={cx(i) + 43} y1={y0 - v * SCALE} y2={y0 - v * SCALE} stroke={C.text} strokeWidth={4} />
        ))}
      </g>
      <Html x={1200} y={110} size={20} color={C.violet}>
        <span className="panel-note">CREENCIA σ(z) · objetivo punteado</span>
      </Html>
      <BeliefBars x={1200} y0={640} values={p} target={target} height={420} gap={150} barW={86} color={OPT.slice(0, n)} labels={p.map((_, i) => `p_${i + 1}`)} />
      <Html x={400} y={790} size={22} interactive>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <button className="stage-btn" onClick={() => setZ(z.map((v) => Math.round((v + 0.5) * 20) / 20))}>
            subir todo +0.5
          </button>
          <button className="stage-btn" onClick={() => setZ(z.map((v) => Math.round((v - 0.5) * 20) / 20))}>
            bajar todo −0.5
          </button>
        </div>
      </Html>
      <Html x={1200} y={790} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l12',
  world: 'foundations',
  code: '1.12',
  title: 'Softmax',
  subtitle: 'puntuaciones → creencias',
  glyph: '\\sigma',
  kind: 'level',
  objective:
    'Convertir puntuaciones en una distribución con $\\sigma(\\mathbf z)$, sabiendo que solo importan las diferencias, que cada salida depende de **todas** las entradas y que la precisión $\\gamma$ regula la certeza.',
  glyphs: ['softmax', 'precision', 'lse', 'argmax'],
  codex: ['w01-softmax'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Ya tengo las dos piezas: $e^{z}$ vuelve positiva cualquier puntuación y dividir por el total vuelve los pesos probabilidades.',
        'Compuestas forman **softmax**. Con ella convierto log-evidencias, preferencias y valores de políticas en creencias.',
        'Tiene una perilla: la **precisión** $\\gamma$. Decide si dudo entre opciones o me comprometo con una.',
      ],
    },
    {
      kind: 'demo',
      title: 'Exponenciar y normalizar',
      Scene: SoftmaxDemo,
      beats: [
        { say: 'Tres puntuaciones reales, una de ellas negativa.', tex: '\\mathbf z=(\\Cin{1},\\Cout{0},\\Cop{-1})', dur: 1.6 },
        { say: 'Primero, $\\exp$: cada puntuación se vuelve un peso positivo. Aquí se muestran relativos al mayor.', tex: 'z_i\\ \\mapsto\\ e^{z_i}>0', dur: 1.8 },
        {
          say: 'Después, normalizar: dividir por la suma. Eso es **softmax**, normalizar $\\circ$ exponenciar.',
          tex: '\\g{softmax}{\\sigma}(\\mathbf z)_i:=\\frac{e^{z_i}}{\\sum_j e^{z_j}}\\approx(0.67,\\,0.24,\\,0.09)',
          dur: 2,
        },
        {
          say: 'Sumemos la misma constante a todas las puntuaciones.',
          tex: '\\mathbf z\\mapsto\\mathbf z+5\\cdot\\mathbf 1',
          ask: {
            prompt: 'Si sumo 5 a **todas** las puntuaciones, ¿qué pasa con $\\sigma(\\mathbf z)$?',
            options: ['Nada', 'Se vuelve más uniforme', 'La mayor gana todavía más'],
            answer: 0,
            explain: 'Cada peso se multiplica por $e^{5}$, factor común arriba y abajo: $\\sigma(\\mathbf z+c\\mathbf 1)=\\sigma(\\mathbf z)$. Solo cuentan las **diferencias**. (Por eso en código se resta $\\max_j z_j$ antes de exponenciar.)',
          },
          dur: 1.6,
        },
        {
          say: '$\\sigma(\\mathbf z)_1$ no depende solo de $z_1$: el denominador contiene a todas. Subir una puntuación baja todas las demás creencias.',
          tex: '\\sigma(\\mathbf z)_1=\\frac{e^{z_1}}{e^{z_1}+e^{z_2}+e^{z_3}}',
          gate: 'Arrastra $z_3$ hacia arriba hasta que $p_3$ supere a $p_1$.',
        },
        {
          say: 'Ahora multiplicamos todas las puntuaciones por una precisión $\\gamma$.',
          tex: '\\sigma(\\g{precision}{\\gamma}\\,\\mathbf z)',
          ask: {
            prompt: '¿Qué le pasa a $\\sigma(\\gamma\\mathbf z)$ cuando $\\gamma\\to0$?',
            options: ['Se vuelve uniforme', 'Se concentra en el máximo', 'No cambia'],
            answer: 0,
            explain: 'Con $\\gamma\\to0$ todas las puntuaciones efectivas tienden a 0: creencia **uniforme**. Con $\\gamma\\to\\infty$ se concentra en el $\\arg\\max$ (si es único). Mira cómo $\\gamma$ baja a 0 y luego sube a 6.',
          },
          dur: 1.4,
        },
        {
          say: 'Con dos opciones, softmax solo depende de la diferencia $z_1-z_2$ y traza la curva **logística** («sigmoide»).',
          tex: '\\sigma(\\mathbf z)_1=\\frac{1}{1+e^{-(z_1-z_2)}}',
          dur: 2.4,
        },
        {
          say: 'En el libro: las políticas $\\pi$ reciben una energía libre esperada $G(\\pi)$ y la creencia sobre ellas es softmax de $-\\gamma G$ (más el prior $\\ln E$).',
          tex: 'q(\\pi)=\\g{softmax}{\\sigma}\\big(\\ln E(\\pi)-\\g{precision}{\\gamma}\\,G(\\pi)\\big)',
          dur: 2.2,
        },
      ],
    },
    { kind: 'challenge', title: 'Termostato de precisión', Comp: Thermostat, rounds: 5 },
    { kind: 'challenge', title: 'Esculpir creencias', Comp: Sculpt, rounds: 4 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l12-f1',
          title: 'Restar una constante no cambia nada',
          brief: 'La forma numéricamente estable resta una constante $c$ (normalmente $\\max_j z_j$) a todas las puntuaciones. Demuestra que el resultado es el mismo.',
          start: 'e^(z_i - c) / sum(j, 1, n, e^(z_j - c))',
          goal: 'e^(z_i) / sum(j, 1, n, e^(z_j))',
          rules: ['exp-add', 'big-factor', 'cancel', 'exp-div', 'distribute'],
          par: 4,
          hints: ['Separa $e^{z-c}=e^{z}e^{-c}$ arriba y dentro de la suma.', 'Saca $e^{-c}$ de la suma y cancélalo ($e^{-c}>0$).'],
          bridge: '$\\sigma(\\mathbf z-c\\mathbf 1)=\\sigma(\\mathbf z)$: la implementación estable de la guía G12.',
        },
        {
          id: 'l12-f2',
          title: 'Log-softmax',
          brief: 'El logaritmo de una creencia softmax: aparece en toda log-verosimilitud de elecciones.',
          start: 'ln(e^(z_i) / sum(j, 1, n, e^(z_j)))',
          goal: 'z_i - ln(sum(j, 1, n, e^(z_j)))',
          rules: ['ln-div', 'ln-exp', 'ln-mul', 'exp-ln'],
          par: 2,
          hints: ['Cociente dentro de un $\\ln$: diferencia de logaritmos (ambos positivos).'],
          bridge: '$\\ln\\sigma(\\mathbf z)_i=z_i-\\ln\\sum_j e^{z_j}$: puntuación menos log-sum-exp.',
        },
        {
          id: 'l12-f3',
          title: 'Softmax de logaritmos',
          brief: 'Si las puntuaciones son logaritmos de pesos positivos, $z_j=\\ln w_j$, softmax es simplemente normalizar.',
          symbols: { w: { tex: 'w', pos: true } },
          start: 'e^(ln(w_i)) / sum(j, 1, n, e^(ln(w_j)))',
          goal: 'w_i / sum(j, 1, n, w_j)',
          rules: ['exp-ln', 'ln-exp', 'big-factor', 'cancel'],
          par: 2,
          hints: ['$e^{\\ln w}=w$ para $w>0$, arriba y dentro de la suma.'],
          bridge: 'Por eso Bayes en escala log termina con un softmax: $\\sigma(\\ln\\text{prior}+\\ln\\text{verosimilitud})$ es el posterior.',
        },
        {
          id: 'l12-f4',
          title: 'Dos opciones: la logística',
          brief: 'Con dos opciones, softmax depende solo de la diferencia. Lleva la expresión a la forma logística.',
          start: 'e^(z_1) / (e^(z_1) + e^(z_2))',
          goal: '1 / (1 + e^(z_2 - z_1))',
          rules: ['frac-norm', 'exp-div', 'exp-neg', 'cancel'],
          par: 2,
          hints: ['Divide numerador y denominador por $e^{z_1}$.', 'Luego $e^{z_2}/e^{z_1}=e^{z_2-z_1}$.'],
          bridge: 'La «sigmoide» es softmax con dos opciones. En el libro, $\\sigma$ siempre es softmax.',
        },
      ],
    },
    { kind: 'codex', entry: 'w01-softmax' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-softmax',
    world: 'foundations',
    level: 'w01-l12',
    title: 'Softmax y precisión',
    summary: 'Softmax exponencia (vuelve positivo) y normaliza (suma 1) un vector de puntuaciones. Solo importan sus diferencias.',
    blocks: [
      { label: 'Definición', tex: '\\sigma(\\mathbf z)_i:=\\frac{e^{z_i}}{\\sum_{j=1}^{n}e^{z_j}},\\qquad \\sigma:\\mathbb R^{n}\\to\\Delta^{n-1}' },
      { label: 'Propiedades', tex: '\\sigma(\\mathbf z)_i>0,\\quad \\sum_i\\sigma(\\mathbf z)_i=1,\\quad \\sigma(\\mathbf z+c\\mathbf 1)=\\sigma(\\mathbf z)' },
      { label: 'Desde pesos', tex: '\\sigma(\\ln\\mathbf w)=\\frac{\\mathbf w}{\\sum_k w_k}\\qquad(w_k>0)' },
      {
        label: 'Escala log',
        tex: '\\ln\\sigma(\\mathbf z)_i=z_i-\\ln\\sum_j e^{z_j},\\qquad \\max_j z_j\\le\\ln\\sum_j e^{z_j}\\le\\max_j z_j+\\ln n',
        body: '$\\ln\\sum_j e^{z_j}$ es el **log-sum-exp**: un máximo suavizado.',
      },
      {
        label: 'Precisión',
        tex: '\\sigma(\\gamma\\mathbf z)\\xrightarrow{\\gamma\\to0}\\text{uniforme},\\qquad \\sigma(\\gamma\\mathbf z)\\xrightarrow{\\gamma\\to\\infty}\\mathbf e_{\\arg\\max_j z_j}',
        body: 'El segundo límite exige un máximo único; con empates la masa se reparte entre los empatados.',
      },
      { label: 'Dos opciones', tex: '\\sigma(\\mathbf z)_1=\\frac{1}{1+e^{-(z_1-z_2)}}', body: 'La función logística («sigmoide») es el caso $n=2$.' },
      { label: 'Implementación estable', tex: '\\sigma(\\mathbf z)=\\sigma(\\mathbf z-\\max_j z_j\\,\\mathbf 1)', body: 'Evita desbordes al exponenciar puntuaciones grandes.' },
    ],
    pitfalls: [
      'Creer que $\\sigma(\\mathbf z)_i$ depende solo de $z_i$: depende de **todas** las puntuaciones.',
      'Aplicar softmax a probabilidades en vez de a log-probabilidades: $\\sigma(\\mathbf p)\\neq\\mathbf p$ (en cambio $\\sigma(\\ln\\mathbf p)=\\mathbf p$).',
      'Leer $\\sigma$ como sigmoide o como desviación estándar: en el libro es softmax.',
    ],
    aif: [
      { tex: 'P_C(o_\\tau=i):=\\sigma(\\mathbf C_\\tau)_i', text: 'Preferencias sobre observaciones como softmax de los logits $\\mathbf C$ (guía G10).' },
      { tex: 'q(\\pi)=\\sigma\\big(\\ln E(\\pi)-\\gamma\\,G(\\pi)\\big)', text: 'Creencia sobre políticas con precisión $\\gamma$ (guía G10). La forma completa incluye la energía libre de cada política: $\\sigma(\\ln E-F-G)$.' },
    ],
  },
];

export const glyphs: Glyph[] = [
  {
    id: 'softmax',
    world: 'foundations',
    tex: '\\sigma(\\mathbf z)',
    name: 'Softmax',
    read: 'sigma de zeta',
    meaning: '$\\sigma(\\mathbf z)_i=e^{z_i}/\\sum_j e^{z_j}$: convierte un vector de puntuaciones en una distribución.',
    warn: 'En otros textos $\\sigma$ es la sigmoide logística o una desviación estándar. En el libro, softmax.',
    aif: '$q(\\pi)=\\sigma(\\ln E-\\gamma G)$, $P_C=\\sigma(\\mathbf C)$.',
  },
  {
    id: 'precision',
    world: 'foundations',
    tex: '\\gamma',
    name: 'Precisión',
    read: 'gamma',
    meaning: 'Factor que multiplica las puntuaciones dentro de softmax: $\\gamma\\to0$ aplana la creencia, $\\gamma$ grande la concentra.',
    warn: 'No confundir con $\\Gamma$. En modelos gaussianos, «precisión» es la inversa de la varianza (sector 06).',
    aif: 'Precisión de las políticas en $\\sigma(\\ln E-\\gamma G)$.',
  },
  {
    id: 'lse',
    world: 'foundations',
    tex: '\\ln\\textstyle\\sum_j e^{z_j}',
    name: 'Log-sum-exp',
    read: 'logaritmo de la suma de exponenciales',
    meaning: 'Máximo suavizado: entre $\\max_j z_j$ y $\\max_j z_j+\\ln n$. Es el normalizador de softmax en escala log.',
    aif: 'Con $z_s=\\ln p(o,s)$, $\\ln\\sum_s e^{z_s}=\\ln p(o)$: la log-evidencia.',
  },
  {
    id: 'argmax',
    world: 'foundations',
    tex: '\\arg\\max',
    name: 'Argumento del máximo',
    read: 'arg max',
    meaning: '$\\arg\\max_j z_j$ es el **lugar** (índice) donde se alcanza el máximo; $\\max_j z_j$ es el **valor**.',
    aif: 'Estimadores MAP; límite de $\\sigma(\\gamma\\mathbf z)$ cuando $\\gamma\\to\\infty$.',
  },
];
