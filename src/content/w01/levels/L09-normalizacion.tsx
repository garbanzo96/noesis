import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Brace, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { pick, rng, shuffle } from '../shared/rng';

// ============================================================================
// 1.9 · NORMALIZACIÓN — proporciones, ∝ y promedio ponderado
// demo: weights → strip of length Z → unit strip → scale invariance → ∝ → "which factor
//       can I strike?" gate → weighted average as balance point → bounds
// challenges: partition the unit strip; strike factors constant in the declared variable
// forge: normalized weights sum to 1; scale invariance; linearity of the weighted average
// ============================================================================

const HUE = [C.cyan, C.amber, C.blue, C.violet];
const NAMES = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------- demo scene
const CHIPS = [
  { tex: 'p(o\\mid s)', dep: true },
  { tex: 'p(s)', dep: true },
  { tex: '\\frac{1}{p(o)}', dep: false },
];

function NormDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const w = [2, 3, 5];
  const scale10 = useTween(beat > 3 || (beat === 3 && answer !== null) ? 1 : 0, 1.4);
  const wNow = w.map((x) => x * lerp(1, 10, scale10));
  const Z = wNow.reduce((a, b) => a + b, 0);
  const revBounds = useTween(beat > 7 || (beat === 7 && answer !== null) ? 1 : 0, 1);
  const [struck, setStruck] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);

  // layout
  const barsView = 1 - at(6);
  const avgView = at(6);
  const base = 430;
  const unitPx = 800 / 10; // a weight unit before normalization (Z=10 → 800px)
  const stripX = 400;
  const stripY = 560;
  const laid = at(1); // bars → strip
  const norm = at(2); // strip → unit strip
  // pre-normalization strip length shrinks visually when weights scale ×10 (compressed view)
  let acc = 0;
  const segs = w.map((wi, i) => {
    const x0 = acc;
    acc += wi / 10;
    return { i, x0, x1: acc };
  });
  // the strip has length Z (60 px per weight unit) and stretches to the unit length when normalized
  const unitW = lerp(60 * 10, 800, norm);

  return (
    <Stage>
      <Group opacity={barsView}>
        {/* bars standing */}
        {w.map((wi, i) => {
          const bx = 520 + i * 220;
          const h = wi * 50 * (1 + 0.0 * scale10);
          const o = (1 - laid) * lagged(at(0), i, 3, 0.4);
          return (
            <Group key={i} opacity={o}>
              <rect x={bx - 45} y={base - h} width={90} height={h} fill={HUE[i]} opacity={0.8} rx={3} />
              <Html x={bx} y={base + 26} size={24} color={HUE[i]}>
                <Tex tex={`w_${NAMES[i]}=${fmt(wNow[i], 0)}`} />
              </Html>
            </Group>
          );
        })}
        {/* strip of length Z, then unit strip */}
        <Group opacity={laid * (1 - at(5))}>
          {segs.map(({ i, x0, x1 }) => {
            const xa = stripX + x0 * unitW;
            const xb = stripX + x1 * unitW;
            return (
              <g key={i}>
                <rect x={xa + 1} y={stripY - 28} width={xb - xa - 2} height={56} fill={HUE[i]} opacity={0.8} />
                <Html x={(xa + xb) / 2} y={stripY} size={24} color={C.bg}>
                  <Tex tex={norm > 0.5 ? fmt(w[i] / 10, 2) : fmt(wNow[i], 0)} />
                </Html>
              </g>
            );
          })}
          <Brace x1={stripX} x2={stripX + unitW} y={stripY + 40} opacity={1} />
          <Html x={stripX + unitW / 2} y={stripY + 100} size={28} color={norm > 0.5 ? C.violet : C.text}>
            <Tex tex={norm > 0.5 ? '\\textstyle\\sum_j p_j=1' : `Z=\\sum_k w_k=${fmt(Z, 0)}`} />
          </Html>
          <Group opacity={norm}>
            <Line a={[stripX, stripY - 60]} b={[stripX, stripY + 34]} color={C.violet} width={2} />
            <Line a={[stripX + unitW, stripY - 60]} b={[stripX + unitW, stripY + 34]} color={C.violet} width={2} />
            <Html x={stripX} y={stripY - 80} size={22} color={C.violet}>
              <Tex tex="0" />
            </Html>
            <Html x={stripX + unitW} y={stripY - 80} size={22} color={C.violet}>
              <Tex tex="1" />
            </Html>
          </Group>
          {beat >= 3 && beat < 5 && (
            <Html x={stripX + unitW / 2} y={200} size={30} color={scale10 > 0.5 ? C.green : C.text}>
              <Tex
                tex={
                  scale10 > 0.5
                    ? '\\mathbf w=(20,30,50)\\ \\Rightarrow\\ \\mathbf p=(0.2,\\,0.3,\\,0.5)\\ \\text{igual}'
                    : '\\mathbf w=(2,3,5)\\ \\Rightarrow\\ \\mathbf p=(0.2,\\,0.3,\\,0.5)'
                }
              />
            </Html>
          )}
        </Group>
        {/* beat 5: which factor can I strike? */}
        <Group opacity={beat === 5 ? at(5) : 0}>
          <Html x={480} y={320} size={36} color={C.text}>
            <Tex tex="p(s\mid o)=" />
          </Html>
          {CHIPS.map((ch, i) => {
            const x = 700 + i * 220;
            const isStruck = struck === i;
            const isWrong = wrong === i;
            return (
              <g
                key={i}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (struck !== null) return;
                  if (ch.dep) setWrong(i);
                  else {
                    setStruck(i);
                    setWrong(null);
                    unlock();
                  }
                }}
              >
                <rect
                  x={x - 90}
                  y={270}
                  width={180}
                  height={100}
                  rx={10}
                  fill={C.panel}
                  stroke={isStruck ? C.green : isWrong ? C.red : C.line}
                  strokeWidth={2.5}
                />
                <Html x={x} y={320} size={32} color={isStruck ? C.dim : C.text}>
                  <Tex tex={ch.tex} />
                </Html>
                {isStruck && <Line a={[x - 80, 350]} b={[x + 80, 290]} color={C.green} width={4} />}
                {isWrong && (
                  <Html x={x} y={400} size={20} color={C.red}>
                    <Tex tex="\text{depende de } s" />
                  </Html>
                )}
              </g>
            );
          })}
          {struck !== null && (
            <Html x={800} y={460} size={34} color={C.violet}>
              <Tex tex="p(s\mid o)\ \propto\ p(o\mid s)\,p(s)" />
            </Html>
          )}
        </Group>
      </Group>

      {/* weighted average as a balance */}
      <Group opacity={avgView}>
        {(() => {
          const f = [1, 4, 6];
          const p = [0.2, 0.3, 0.5];
          const X = (v: number) => 300 + v * 160;
          const E = p.reduce((s, pi, i) => s + pi * f[i], 0);
          const fulcrum = lerp(3.5, E, at(6));
          const tilt = (E - fulcrum) * 6;
          return (
            <>
              <g transform={`rotate(${tilt} ${X(fulcrum)} 520)`}>
                <line x1={X(0)} x2={X(7)} y1={520} y2={520} stroke={C.muted} strokeWidth={4} />
                {f.map((fi, i) => (
                  <g key={i}>
                    <circle cx={X(fi)} cy={520 - 18 - p[i] * 80} r={18 + p[i] * 80} fill={HUE[i]} opacity={0.8} />
                  </g>
                ))}
              </g>
              <path d={`M${X(fulcrum)} 524l-30 60h60z`} fill={C.violet} />
              {f.map((fi, i) => (
                <Html key={i} x={X(fi)} y={640} size={24} color={HUE[i]}>
                  <Tex tex={`f_${i + 1}=${fi}\\ (p=${p[i]})`} />
                </Html>
              ))}
              <Html x={X(fulcrum)} y={700} size={28} color={C.violet}>
                <Tex tex={`\\textstyle\\sum_i p_i f_i=${fmt(fulcrum, 2)}`} />
              </Html>
              <Group opacity={revBounds}>
                <rect x={X(1)} y={760} width={X(6) - X(1)} height={10} fill={C.green} opacity={0.6} />
                <Html x={X(1)} y={800} size={22} color={C.green}>
                  <Tex tex="\min_i f_i" />
                </Html>
                <Html x={X(6)} y={800} size={22} color={C.green}>
                  <Tex tex="\max_i f_i" />
                </Html>
              </Group>
            </>
          );
        })()}
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: unit strip
const STRIP_CASES: number[][][] = [
  [
    [1, 3],
    [2, 3],
    [3, 1],
    [1, 4],
  ],
  [
    [2, 3, 5],
    [1, 1, 2],
    [3, 5, 12],
    [2, 6, 2],
  ],
  [
    [40, 60],
    [30, 90, 80],
    [15, 45, 40],
  ],
  [
    [2, 0, 6],
    [0, 3, 1],
    [5, 0, 15],
  ],
  [
    [1, 2, 3, 4],
    [3, 3, 6, 8],
    [2, 4, 4, 10],
  ],
];

function UnitStrip({ seed, round, api }: ChallengeProps) {
  const w = useMemo(() => pick(rng(seed), STRIP_CASES[Math.min(round, STRIP_CASES.length - 1)]), [seed, round]);
  const n = w.length;
  const Z = w.reduce((a, b) => a + b, 0);
  const target = w.map((x) => x / Z);
  const svg = useRef<SVGSVGElement>(null);
  // n−1 dividers, start evenly spaced
  const [cuts, setCuts] = useState<number[]>(() => Array.from({ length: n - 1 }, (_, i) => Math.round(((i + 1) / n) * 20) / 20));
  const active = useRef<number>(-1);
  const X0 = 300;
  const WID = 1000;
  const Y = 600;
  const toU = (x: number) => clamp((x - X0) / WID, 0, 1);
  const onDrag = useSvgDrag(svg, (x, _y, phase) => {
    const u = toU(x);
    if (phase === 'start') {
      let best = -1;
      let bd = 1e9;
      cuts.forEach((c, i) => {
        const d = Math.abs(c - u);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      active.current = bd < 0.06 ? best : -1;
      return;
    }
    const i = active.current;
    if (i < 0) return;
    const lo = i === 0 ? 0 : cuts[i - 1];
    const hi = i === n - 2 ? 1 : cuts[i + 1];
    const v = Math.round(clamp(u, lo, hi) * 20) / 20;
    if (v !== cuts[i]) {
      api.sfx.tick();
      setCuts(cuts.map((c, k) => (k === i ? v : c)));
    }
    if (phase === 'end') active.current = -1;
  });
  const edges = [0, ...cuts, 1];
  const segs = w.map((_, i) => edges[i + 1] - edges[i]);
  const scaled = Z > 20;
  const hasZero = w.includes(0);

  useEffect(() => {
    api.prompt(
      `Reparte la banda unidad según los pesos $\\mathbf w=(${w.join(',')})$: cada segmento debe medir $p_j=w_j/Z$. Arrastra los divisores (pasos de 0.05).`,
      `Z=\\sum_k w_k=\\;?\\qquad p_j=\\frac{w_j}{Z}`,
    );
    api.hints([
      `$Z=${w.join('+')}=${Z}$.`,
      `Segmentos: ${w.map((x, i) => `$p_${NAMES[i]}=${x}/${Z}=${fmt(x / Z, 2)}$`).join(', ')}.${scaled ? ' La escala de los pesos no importa.' : ''}`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

  const submit = () => {
    const bad = segs.findIndex((s, i) => Math.abs(s - target[i]) > 1e-6);
    if (bad < 0)
      return api.result(
        true,
        `$\\mathbf p=(${target.map((t) => fmt(t, 2)).join(',\\,')})$, $\\sum_j p_j=1$.${scaled ? ' Pesos grandes, mismas proporciones.' : ''}${hasZero ? ' Un peso nulo da probabilidad nula.' : ''}`,
      );
    api.result(
      false,
      `El segmento ${NAMES[bad]} mide $${fmt(segs[bad], 2)}$; debe medir $w_${NAMES[bad]}/Z=${w[bad]}/${Z}=${fmt(target[bad], 2)}$.`,
    );
  };

  const maxW = Math.max(...w);
  return (
    <Stage ref={svg}>
      {/* weight bars */}
      {w.map((wi, i) => {
        const bx = 800 + (i - (n - 1) / 2) * 200;
        const h = (wi / maxW) * 250;
        return (
          <g key={i}>
            <rect x={bx - 50} y={430 - h} width={100} height={Math.max(h, 1)} fill={HUE[i]} opacity={0.8} rx={3} />
            <Html x={bx} y={455} size={24} color={HUE[i]}>
              <Tex tex={`w_${NAMES[i]}=${wi}`} />
            </Html>
          </g>
        );
      })}
      {/* unit strip */}
      {segs.map((s, i) => {
        const xa = X0 + edges[i] * WID;
        const xb = X0 + edges[i + 1] * WID;
        return (
          <g key={i}>
            {s > 0 && <rect x={xa + 1} y={Y - 34} width={Math.max(0, xb - xa - 2)} height={68} fill={HUE[i]} opacity={0.75} />}
            {s > 0.04 && (
              <Html x={(xa + xb) / 2} y={Y} size={22} color={C.bg}>
                <Tex tex={`${NAMES[i]}\\!:\\,${fmt(s, 2)}`} />
              </Html>
            )}
          </g>
        );
      })}
      <rect x={X0} y={Y - 34} width={WID} height={68} fill="none" stroke={C.violet} strokeWidth={2} />
      {Array.from({ length: 21 }, (_, k) => (
        <line key={k} x1={X0 + (k / 20) * WID} x2={X0 + (k / 20) * WID} y1={Y + 36} y2={Y + (k % 2 ? 44 : 52)} stroke={C.dim} strokeWidth={1.5} />
      ))}
      <Html x={X0} y={Y + 76} size={20} color={C.violet}>
        <Tex tex="0" />
      </Html>
      <Html x={X0 + WID} y={Y + 76} size={20} color={C.violet}>
        <Tex tex="1" />
      </Html>
      {/* dividers */}
      {cuts.map((c, i) => (
        <g key={i} style={{ cursor: 'ew-resize' }} onPointerDown={onDrag}>
          <rect x={X0 + c * WID - 16} y={Y - 70} width={32} height={140} fill="transparent" />
          <line x1={X0 + c * WID} x2={X0 + c * WID} y1={Y - 60} y2={Y + 60} stroke={C.text} strokeWidth={4} />
          <Dot x={X0 + c * WID} y={Y - 62} r={10} color={C.text} glow={false} />
        </g>
      ))}
      <Html x={1450} y={Y} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: strike constants
interface Factor {
  tex: string;
  deps: string[];
}
interface StrikeCase {
  lhs: string;
  v: string;
  factors: Factor[];
  note: string;
}
function strikeCase(seed: number, round: number): StrikeCase {
  const r = rng(seed);
  const bayes: Factor[] = [
    { tex: 'p(o\\mid s)', deps: ['s', 'o'] },
    { tex: 'p(s)', deps: ['s'] },
    { tex: '\\frac{1}{p(o)}', deps: ['o'] },
  ];
  switch (round) {
    case 0:
      return { lhs: 'p(s\\mid o)', v: 's', factors: bayes, note: 'Como función de $s$ (con $o$ observado), $p(o)$ es una constante.' };
    case 1:
      return {
        lhs: 'p(s\\mid o)',
        v: 'o',
        factors: bayes,
        note: 'Ahora la variable es $o$ (con $s$ fijo): la constante es $p(s)$, no $p(o)$.',
      };
    case 2:
      return {
        lhs: 'p(k\\mid\\theta)',
        v: '\\theta',
        factors: shuffle(r, [
          { tex: '\\binom{n}{k}', deps: ['n', 'k'] },
          { tex: '\\theta^{k}', deps: ['\\theta', 'k'] },
          { tex: '(1-\\theta)^{n-k}', deps: ['\\theta', 'n', 'k'] },
        ]),
        note: 'Como función de $\\theta$, el coeficiente binomial es constante: la verosimilitud es $\\propto\\theta^{k}(1-\\theta)^{n-k}$.',
      };
    case 3: {
      const v = pick(r, ['\\mu', '\\sigma']);
      return {
        lhs: '\\mathcal N(x;\\mu,\\sigma^2)',
        v,
        factors: [
          { tex: '\\frac{1}{\\sqrt{2\\pi\\sigma^{2}}}', deps: ['\\sigma'] },
          { tex: 'e^{-\\frac{(x-\\mu)^{2}}{2\\sigma^{2}}}', deps: ['x', '\\mu', '\\sigma'] },
        ],
        note:
          v === '\\mu'
            ? 'Respecto de $\\mu$, el prefactor solo depende de $\\sigma$: se puede tachar.'
            : 'Respecto de $\\sigma$, **ningún** factor es constante: no se puede tachar nada.',
      };
    }
    default:
      return {
        lhs: 'q(\\pi)',
        v: '\\pi',
        factors: shuffle(r, [
          { tex: 'E(\\pi)', deps: ['\\pi'] },
          { tex: 'e^{-\\gamma G(\\pi)}', deps: ['\\pi', '\\gamma'] },
          { tex: 'e^{\\gamma c}', deps: ['\\gamma', 'c'] },
          { tex: '\\frac{1}{Z}', deps: [] },
        ]),
        note: 'Todo lo que no depende de $\\pi$ (incluida la constante $c$ sumada a todas las puntuaciones) se absorbe en la normalización.',
      };
  }
}

function StrikeFactors({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => strikeCase(seed, round), [seed, round]);
  const [crossed, setCrossed] = useState<boolean[]>(() => cs.factors.map(() => false));
  const constant = cs.factors.map((f) => !f.deps.includes(cs.v));
  useEffect(() => {
    api.prompt(
      `Tacha los factores que **no dependen** de $${cs.v}$ (la variable de interés). Si ninguno es constante, fija sin tachar.`,
      `${cs.lhs}=${cs.factors.map((f) => f.tex).join('\\cdot ')}`,
    );
    api.hints([
      `Pregunta factor por factor: si cambio $${cs.v}$ y dejo todo lo demás fijo, ¿cambia este factor?`,
      cs.note,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const submit = () => {
    const wrongCross = cs.factors.findIndex((f, i) => crossed[i] && !constant[i]);
    if (wrongCross >= 0)
      return api.result(false, `Tachaste $${cs.factors[wrongCross].tex}$, pero depende de $${cs.v}$: cambiar $${cs.v}$ lo cambia.`);
    const missed = cs.factors.findIndex((f, i) => !crossed[i] && constant[i]);
    if (missed >= 0)
      return api.result(false, `Queda $${cs.factors[missed].tex}$ sin tachar: no depende de $${cs.v}$, es parte de la constante.`);
    const kept = cs.factors.filter((_, i) => !constant[i]).map((f) => f.tex);
    api.result(true, `$${cs.lhs}\\ \\propto\\ ${kept.join('\\,')}$ respecto de $${cs.v}$. ${cs.note}`);
  };
  const n = cs.factors.length;
  return (
    <Stage>
      <Html x={800} y={200} size={34} color={C.text}>
        <Tex tex={`\\text{variable de interés: } ${cs.v}`} />
      </Html>
      <Html x={260} y={430} size={40} color={C.text}>
        <Tex tex={`${cs.lhs}=`} />
      </Html>
      {cs.factors.map((f, i) => {
        const x = 800 + (i - (n - 1) / 2) * 260 + 80;
        return (
          <g
            key={i}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              api.sfx.click();
              setCrossed(crossed.map((c, k) => (k === i ? !c : c)));
            }}
          >
            <rect x={x - 115} y={360} width={230} height={140} rx={12} fill={C.panel} stroke={crossed[i] ? C.magenta : C.line} strokeWidth={2.5} />
            <Html x={x} y={430} size={36} color={crossed[i] ? C.dim : C.text}>
              <Tex tex={f.tex} />
            </Html>
            {crossed[i] && <Line a={[x - 100, 480]} b={[x + 100, 380]} color={C.magenta} width={5} />}
          </g>
        );
      })}
      <Html x={800} y={620} size={20} color={C.muted}>
        <span className="panel-note">clic en un factor para tacharlo / destacharlo</span>
      </Html>
      <Html x={800} y={720} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l09',
  world: 'foundations',
  code: '1.9',
  title: 'Normalización',
  subtitle: 'proporciones y ∝',
  glyph: '\\propto',
  kind: 'level',
  objective:
    'Convertir pesos en probabilidades dividiendo por el total, leer $\\propto$ **respecto de una variable** y calcular promedios ponderados.',
  glyphs: ['propto', 'normalizer', 'simplex', 'wavg'],
  codex: ['w01-normalizacion'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Tres hipótesis sobre la causa de una señal, con **apoyos** $2$, $3$ y $5$. Esos números comparan, pero no son probabilidades: no suman 1.',
        'Normalizar es dividir por el total. La escala desaparece y solo sobreviven las **proporciones**.',
        'La regla de Bayes funciona así: se calcula algo **proporcional** al posterior y al final se normaliza.',
      ],
    },
    {
      kind: 'demo',
      title: 'Banda unidad',
      Scene: NormDemo,
      beats: [
        { say: 'Tres pesos no negativos, uno por hipótesis.', tex: '\\mathbf w=(\\Cin{2},\\Cout{3},\\Cop{5}),\\quad w_j\\ge0', dur: 1.8 },
        {
          say: 'Puestos uno tras otro forman una banda de longitud $Z$, el **total**.',
          tex: '\\g{normalizer}{Z}:=\\sum_k w_k=10',
          dur: 2,
        },
        {
          say: 'Normalizar es reescalar la banda a longitud 1: cada segmento pasa a medir $w_j/Z$.',
          tex: 'p_j:=\\frac{w_j}{\\g{normalizer}{Z}},\\qquad \\sum_j p_j=1',
          dur: 2,
        },
        {
          say: 'Ahora multiplica todos los pesos por 10.',
          tex: '\\mathbf w\\mapsto 10\\,\\mathbf w',
          ask: {
            prompt: 'Si multiplico **todos** los pesos por 10, ¿qué pasa con las probabilidades?',
            options: ['No cambian', 'Se multiplican por 10', 'Dejan de sumar 1'],
            answer: 0,
            explain: 'El factor común aparece arriba y abajo y se cancela: $\\frac{c\\,w_j}{\\sum_k c\\,w_k}=\\frac{w_j}{\\sum_k w_k}$ para todo $c>0$.',
          },
          dur: 1.4,
        },
        {
          say: 'Por eso se escribe $p_j\\propto w_j$: «proporcional a», igual **salvo un factor que no depende de** $j$. Ese factor es $1/Z$.',
          tex: 'p_j\\g{propto}{\\propto} w_j\\iff p_j=\\frac{w_j}{Z},\\quad Z\\text{ no depende de }j',
          dur: 2,
        },
        {
          say: 'En Bayes, el denominador $p(o)$ no depende de la hipótesis $s$. Es el factor que $\\propto$ permite omitir.',
          tex: 'p(s\\mid o)=\\frac{p(o\\mid s)\\,p(s)}{p(o)}',
          gate: 'Haz clic en el factor que **no depende** de $s$ para tacharlo.',
          dur: 1.6,
        },
        {
          say: 'Con probabilidades se calcula el **promedio ponderado**: cada valor $f_i$ pesa $p_i$. Es el punto de equilibrio de la balanza.',
          tex: '\\g{wavg}{\\textstyle\\sum_i p_i f_i}=0.2\\cdot1+0.3\\cdot4+0.5\\cdot6=4.4',
          dur: 2.4,
        },
        {
          say: '¿Dónde puede caer ese punto de equilibrio?',
          tex: '\\textstyle\\sum_i p_i f_i\\in\\;?',
          ask: {
            prompt: 'Para cualquier distribución $\\mathbf p$, ¿dónde queda $\\sum_i p_i f_i$?',
            options: ['Entre el mínimo y el máximo de los $f_i$', 'En cualquier parte de la recta', 'Siempre en el centro'],
            answer: 0,
            explain: 'Como $p_i\\ge0$ y $\\sum_i p_i=1$: $\\min_i f_i\\le\\sum_i p_i f_i\\le\\max_i f_i$. Un promedio nunca sale del rango de lo promediado.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Banda unidad', Comp: UnitStrip, rounds: 5 },
    { kind: 'challenge', title: '¿Qué se puede tachar?', Comp: StrikeFactors, rounds: 5 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l09-f1',
          title: 'Las probabilidades suman uno',
          brief: 'Demuestra que los pesos normalizados suman 1. Todos los $w_k>0$. (El índice mudo $j$ o $k$ es irrelevante.)',
          symbols: { w: { tex: 'w', pos: true } },
          start: 'sum(j, 1, n, w_j / sum(k, 1, n, w_k))',
          goal: '1',
          rules: ['big-factor', 'cancel', 'big-split', 'distribute', 'calc'],
          par: 2,
          hints: ['El denominador no depende de $j$: sácalo del $\\sum_j$.', 'Queda $\\frac{\\sum_j w_j}{\\sum_k w_k}$: es la misma suma.'],
          bridge: 'Toda normalización produce una distribución: es lo que garantiza $p(o)$ en Bayes.',
        },
        {
          id: 'l09-f2',
          title: 'Invariancia de escala',
          brief: 'Un factor $c>0$ multiplica todos los pesos. Muestra que la probabilidad normalizada no cambia.',
          symbols: { w: { tex: 'w', pos: true }, c: { tex: 'c', pos: true } },
          start: '(c*w_j) / sum(k, 1, n, c*w_k)',
          goal: 'w_j / sum(k, 1, n, w_k)',
          rules: ['big-factor', 'cancel', 'div-split', 'distribute'],
          par: 2,
          hints: ['$c$ no depende de $k$: sale del $\\sum_k$.', 'Cancela $c$ arriba y abajo ($c>0$).'],
          bridge: 'Por eso se puede trabajar con $\\propto$ y normalizar al final.',
        },
        {
          id: 'l09-f3',
          title: 'Linealidad del promedio',
          brief: 'Promedio ponderado de $a f_i+b$. Llévalo a la forma $a\\sum_i p_i f_i+b\\sum_i p_i$ (y como $\\sum_i p_i=1$, el último término es $b$).',
          start: 'sum(i, 1, n, p_i * (a*f_i + b))',
          goal: 'a*sum(i, 1, n, p_i*f_i) + b*sum(i, 1, n, p_i)',
          rules: ['distribute', 'big-split', 'big-factor', 'big-const', 'collapse'],
          par: 4,
          hints: ['Distribuye $p_i$ dentro del paréntesis y separa la suma.', 'Saca $a$ y $b$ de sus sumas: no dependen de $i$.'],
          bridge: '$\\mathbb E_q[af+b]=a\\,\\mathbb E_q[f]+b$: la esperanza es lineal (sector 05).',
        },
      ],
    },
    { kind: 'codex', entry: 'w01-normalizacion' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-normalizacion',
    world: 'foundations',
    level: 'w01-l09',
    title: 'Normalización y proporcionalidad',
    summary: 'Normalizar divide por el total para que solo cuenten las proporciones. $\\propto$ omite un factor que no depende de la variable declarada.',
    blocks: [
      { label: 'Normalizar', tex: 'Z:=\\sum_k w_k,\\qquad p_j:=\\frac{w_j}{Z}\\qquad (w_j\\ge0,\\ Z>0)' },
      { label: 'Invariancia de escala', tex: '\\frac{c\\,w_j}{\\sum_k c\\,w_k}=\\frac{w_j}{\\sum_k w_k}\\qquad (c>0)' },
      {
        label: 'Proporcionalidad',
        tex: 'p_j\\propto w_j\\iff p_j=\\frac{w_j}{Z},\\ Z\\text{ independiente de }j',
        body: '$\\propto$ siempre se lee **respecto de una variable**. En escala logarítmica (1.11): $\\ln p_j=\\ln w_j-\\ln Z$, es decir «$+$ constante».',
      },
      { label: 'Símplex', tex: '\\Delta^{n-1}:=\\{\\mathbf p\\in\\mathbb R^n:\\ p_i\\ge0,\\ \\textstyle\\sum_i p_i=1\\}', body: 'El conjunto de todas las distribuciones sobre $n$ casos.' },
      {
        label: 'Promedio ponderado',
        tex: '\\textstyle\\sum_i p_i f_i,\\qquad \\min_i f_i\\le\\sum_i p_i f_i\\le\\max_i f_i',
        body: 'Lineal: $\\sum_i p_i(af_i+b)=a\\sum_i p_if_i+b$.',
      },
      {
        label: 'Bayes',
        tex: 'p(s\\mid o)=\\frac{p(o\\mid s)\\,p(s)}{p(o)}\\propto p(o\\mid s)\\,p(s),\\quad p(o)=\\sum_s p(o\\mid s)\\,p(s)',
      },
    ],
    pitfalls: [
      '$\\propto$ no es $=$: falta el factor de normalización.',
      'Omitir un factor que **sí** depende de la variable (p. ej. tachar $p(s)$ cuando la variable es $s$).',
      'Normalizar en el eje equivocado: en una matriz de verosimilitud $\\mathbf A$ suman 1 las **columnas** (cada estado reparte su masa entre observaciones).',
      'Pesos negativos no se normalizan: primero hay que hacerlos positivos (por ejemplo con $e^{z}$, 1.10).',
    ],
    aif: [
      { tex: 'p(\\theta\\mid x)\\propto p(x\\mid\\theta)\\,p(\\theta)', text: 'La constante omitida normaliza el posterior (guía G06).' },
      { tex: '\\mathbf q_\\tau\\propto(\\mathbf A^{\\mathsf T}\\mathbf o_\\tau)\\odot\\bar{\\mathbf q}_\\tau', text: 'Actualización de creencias sobre estados en tiempo discreto (guía G10).' },
      { tex: '\\mathbb E_q[f]=\\sum_s q(s)\\,f(s)', text: 'Toda esperanza bajo una creencia discreta es un promedio ponderado.' },
    ],
  },
];

export const glyphs: Glyph[] = [
  {
    id: 'propto',
    world: 'foundations',
    tex: '\\propto',
    name: 'Proporcional a',
    read: 'es proporcional a',
    meaning: '$y\\propto x$: $y=c\\,x$ con $c$ independiente de la variable de interés. Hay que saber **respecto de qué** variable.',
    warn: 'No es igualdad: falta normalizar.',
    aif: '$p(s\\mid o)\\propto p(o\\mid s)p(s)$; $q(\\pi)\\propto\\exp(\\ldots)$.',
  },
  {
    id: 'normalizer',
    world: 'foundations',
    tex: 'Z',
    name: 'Constante de normalización',
    read: 'zeta',
    meaning: '$Z=\\sum_k w_k$: el total por el que se divide para que las probabilidades sumen 1.',
    warn: 'En Bayes $Z$ es la evidencia $p(o)$; no confundir con $\\mathbb Z$ (enteros).',
  },
  {
    id: 'simplex',
    world: 'foundations',
    tex: '\\Delta^{n-1}',
    name: 'Símplex de probabilidad',
    read: 'símplex',
    meaning: 'Conjunto de vectores con componentes no negativas que suman 1: todas las distribuciones sobre $n$ casos.',
  },
  {
    id: 'wavg',
    world: 'foundations',
    tex: '\\textstyle\\sum_i p_i f_i',
    name: 'Promedio ponderado',
    read: 'suma de pe i por efe i',
    meaning: 'Cada valor $f_i$ pesa $p_i$. Queda entre $\\min f$ y $\\max f$. Es la esperanza $\\mathbb E_p[f]$.',
    aif: 'Toda esperanza discreta: $\\mathbb E_q[\\ln q-\\ln p]$ en $F$.',
  },
];
