import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage, plane } from '../../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type {
  ChallengeProps,
  CodexEntry,
  DemoProps,
  Glyph,
  LevelSpec,
} from '../../../game/level/types';
import { pick, rng } from '../shared/rng';

// ============================================================================
// 1.10 · EXPONENCIAL — "de sumas a productos"
// demo: doubling tower → negative exponents never reach 0 → adding exponents multiplies
//       → the base whose slope equals its height (e) → range (0,∞) → score ratios → precision
// challenge: set scores so weight ratios/products hit a target (only differences matter)
// forge: exponential identities
// ============================================================================

const slopeAt0 = (b: number) => Math.log(b); // numerical meaning: lim (b^h − 1)/h

// ---------------------------------------------------------------- demo scene
function ExpDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const towerView = 1 - at(3);
  const graphView = at(3);

  // tower geometry
  const X = (k: number) => 800 + 150 * k;
  const floor = 640;
  const H = (v: number) => 62 * v;
  const revNeg = useTween(beat > 1 || (beat === 1 && answer !== null) ? 1 : 0, 1.3);
  const revRange = useTween(beat > 5 || (beat === 5 && answer !== null) ? 1 : 0, 1.0);

  // beat 3 gate: base slider
  const [base, setBase] = useState(2);
  const dragging = useRef(false);
  const trackX = (b: number) => 460 + ((b - 1.5) / 2.5) * 680;
  const fromTrack = (x: number) => clamp(1.5 + ((x - 460) / 680) * 2.5, 1.5, 4);
  const onDrag = useSvgDrag(svg, (x, _y, phase) => {
    if (beat !== 3) return;
    if (phase === 'start') dragging.current = true;
    if (phase === 'end') dragging.current = false;
    let b = fromTrack(x);
    if (Math.abs(b - Math.E) < 0.05) {
      b = Math.E;
      unlock();
    }
    setBase(b);
  });
  const shownBase = beat === 3 ? base : beat > 3 ? Math.E : 2;
  const k = slopeAt0(shownBase);
  const isE = Math.abs(shownBase - Math.E) < 1e-9;

  // graph geometry
  const P = plane([-3, 3], [-0.6, 8.6], { x: 330, y: 70, w: 940, h: 620 });
  const gamma = beat >= 7 ? lerp(1, 2, at(7)) : 1;
  const z1 = 1;
  const z2 = -0.5;
  const w1 = Math.exp(gamma * z1);
  const w2 = Math.exp(gamma * z2);

  return (
    <Stage ref={svg}>
      {/* ---------------- tower view ---------------- */}
      <Group opacity={towerView}>
        <Line
          a={[X(-3.6), floor]}
          b={[X(3.6), floor]}
          color={C.magenta}
          width={2}
          progress={at(0)}
        />
        <Html x={180} y={floor + 100} size={20} color={C.magenta} anchor="left">
          <span className="panel-note">EXPONENTE x · se suma</span>
        </Html>
        <Html x={180} y={170} size={20} color={C.amber} anchor="left">
          <span className="panel-note">ALTURA 2ˣ · se multiplica</span>
        </Html>
        {/* floor at height 0 */}
        <Line
          a={[X(-3.6), floor]}
          b={[X(3.6), floor]}
          color={C.green}
          width={3}
          opacity={revNeg * 0.8}
          glow
        />
        {revNeg > 0.5 && (
          <Html x={X(-3)} y={floor + 62} size={17} color={C.green} anchor="left">
            <span className="panel-note">altura 0: nunca se alcanza</span>
          </Html>
        )}
        {[-3, -2, -1, 0, 1, 2, 3].map((kk, i) => {
          const pos = kk >= 0;
          const appear = pos
            ? lagged(at(0), kk, 4, 0.35)
            : revNeg * lagged(revNeg, -kk - 1, 3, 0.35);
          const v = 2 ** kk;
          const hl = beat === 2 && (kk === 1 || kk === 2 || kk === 3);
          return (
            <Group key={kk} opacity={appear}>
              <rect
                x={X(kk) - 34}
                y={floor - H(v) * appear}
                width={68}
                height={Math.max(0.5, H(v) * appear)}
                fill={hl && kk === 3 ? C.green : C.amber}
                opacity={hl ? 0.95 : 0.75}
                rx={3}
              />
              <Html x={X(kk)} y={floor + 30} size={22} color={C.magenta}>
                <Tex tex={String(kk)} />
              </Html>
              <Html x={X(kk)} y={floor - H(v) - 28} size={22} color={C.amber}>
                <Tex tex={kk >= 0 ? String(v) : `\\tfrac{1}{${2 ** -kk}}`} />
              </Html>
            </Group>
          );
        })}
        {[0, 1, 2].map((kk) => (
          <Group key={'x2' + kk} opacity={lagged(at(0), kk + 1, 4, 0.35) * (beat === 2 ? 0.25 : 1)}>
            <Arrow
              from={[X(kk) + 10, floor - H(2 ** kk) - 50]}
              to={[X(kk + 1) - 10, floor - H(2 ** (kk + 1)) - 50]}
              curve={-0.25}
              color={C.text}
              width={2}
            />
            <Html
              x={(X(kk) + X(kk + 1)) / 2}
              y={floor - H(2 ** kk) - 95 - kk * 28}
              size={20}
              color={C.text}
            >
              <Tex tex="\times 2" />
            </Html>
          </Group>
        ))}
        {[-1, -2].map((kk) => (
          <Group key={'d2' + kk} opacity={revNeg}>
            <Html x={(X(kk) + X(kk + 1)) / 2} y={floor - 110} size={20} color={C.text}>
              <Tex tex="\div 2" />
            </Html>
          </Group>
        ))}
        {/* beat 2: 2^1 · 2^2 = 2^3 */}
        <Group opacity={beat === 2 ? at(2) : 0}>
          <Arrow from={[X(0), floor + 64]} to={[X(1), floor + 64]} color={C.cyan} width={5} />
          <Arrow from={[X(1), floor + 64]} to={[X(3), floor + 64]} color={C.violet} width={5} />
          <Html x={X(0.5)} y={floor + 92} size={20} color={C.cyan}>
            <Tex tex="a=1" />
          </Html>
          <Html x={X(2)} y={floor + 92} size={20} color={C.violet}>
            <Tex tex="b=2" />
          </Html>
          <Html x={X(-2)} y={300} size={34} color={C.text}>
            <Tex tex="2^{1}\cdot 2^{2}=2\cdot4=8=2^{1+2}" />
          </Html>
        </Group>
      </Group>

      {/* ---------------- graph view ---------------- */}
      <Group opacity={graphView}>
        <Axes P={P} xTicks={[-3, -2, -1, 1, 2, 3]} yTicks={[1, 2, 4, 6, 8]} xLabel="x" />
        {/* beat 3: base slider and tangent at 0 */}
        <Group opacity={beat === 3 ? 1 : beat > 3 ? 1 - at(4) : 0}>
          <Curve
            P={P}
            f={(x) => shownBase ** x}
            a={-3}
            b={3}
            color={isE ? C.green : C.amber}
            width={4}
          />
          <Line a={P.pt(-2, 1 - 2 * k)} b={P.pt(2, 1 + 2 * k)} color={C.text} width={2} dashed />
          <Dot x={P.x(0)} y={P.y(1)} r={8} color={C.text} />
          <Html x={P.x(-2.7)} y={P.y(7.6)} size={24} anchor="left" color={C.text}>
            <Tex
              tex={`b=${fmt(shownBase, 3)}\\quad\\text{altura en }0=1\\quad\\text{pendiente en }0=${fmt(k, 3)}`}
            />
          </Html>
          {/* slider track */}
          <line
            x1={trackX(1.5)}
            x2={trackX(4)}
            y1={820}
            y2={820}
            stroke={C.line}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={trackX(Math.E)}
            x2={trackX(Math.E)}
            y1={800}
            y2={840}
            stroke={C.green}
            strokeWidth={2}
            opacity={0.35}
          />
          {[1.5, 2, 3, 4].map((b) => (
            <Html key={b} x={trackX(b)} y={852} size={18} color={C.muted}>
              <Tex tex={String(b)} />
            </Html>
          ))}
          <Dot
            x={trackX(shownBase)}
            y={820}
            r={14}
            color={isE ? C.green : C.amber}
            onPointerDown={beat === 3 ? onDrag : undefined}
            cursor="ew-resize"
            ring
          />
          <Html x={trackX(4) + 40} y={820} size={20} anchor="left" color={C.muted}>
            <span className="panel-note">base b</span>
          </Html>
        </Group>
        {/* beat 4+: e^x with tangents where slope = height */}
        <Group opacity={at(4)}>
          <Curve P={P} f={Math.exp} a={-3} b={2.15} color={C.amber} width={4.5} progress={at(4)} />
          {beat >= 4 &&
            beat < 6 &&
            [-1, 0, 1, 1.6].map((x0, i) => {
              const y0 = Math.exp(x0);
              const dx = 0.45;
              return (
                <Group key={x0} opacity={lagged(at(4), i, 4, 0.4)}>
                  <Line
                    a={P.pt(x0 - dx, y0 - dx * y0)}
                    b={P.pt(x0 + dx, y0 + dx * y0)}
                    color={C.green}
                    width={3}
                  />
                  <Dot x={P.x(x0)} y={P.y(y0)} r={6} color={C.green} />
                </Group>
              );
            })}
          {beat >= 4 && beat < 6 && (
            <Html x={P.x(-2.6)} y={P.y(6.8)} size={24} anchor="left" color={C.green}>
              <span>pendiente = altura, en cada punto</span>
            </Html>
          )}
          <Html x={P.x(1.55)} y={P.y(7.4)} size={28} color={C.amber}>
            <Tex tex="y=e^{x}" />
          </Html>
        </Group>
        {/* beat 5: range (0, ∞) */}
        <Group opacity={revRange * (beat <= 5 ? 1 : 1 - at(6) * 0.7)}>
          <Line a={P.pt(-3, 0)} b={P.pt(3, 0)} color={C.green} width={4} glow />
          <rect
            x={P.x(-3)}
            y={P.y(8.6)}
            width={P.box.w}
            height={P.y(0) - P.y(8.6)}
            fill={C.amber}
            opacity={0.05}
          />
          <Html x={P.x(-2.2)} y={P.y(0) - 26} size={22} color={C.green}>
            <Tex tex="e^{x}>0\ \text{siempre}" />
          </Html>
        </Group>
        {/* beat 6–7: scores → weights */}
        <Group opacity={at(6)}>
          {[
            { z: z1, w: w1, c: C.cyan, n: '1' },
            { z: z2, w: w2, c: C.violet, n: '2' },
          ].map(({ z, w, c, n }) => (
            <g key={n}>
              <Line a={P.pt(z, 0)} b={P.pt(z, Math.min(w, 8.5))} color={c} width={5} glow />
              <Dot x={P.x(z)} y={P.y(0)} r={9} color={c} />
              <Dot x={P.x(z)} y={P.y(Math.min(w, 8.5))} r={8} color={c} />
              <Html x={P.x(z)} y={P.y(0) + 34} size={22} color={c}>
                <Tex tex={`z_{${n}}=${fmt(z, 1)}`} />
              </Html>
              <Html x={P.x(z) + 18} y={P.y(Math.min(w, 8.5))} size={22} anchor="left" color={c}>
                <Tex tex={`e^{${beat >= 7 ? '\\gamma ' : ''}z_{${n}}}=${fmt(w, 2)}`} />
              </Html>
            </g>
          ))}
          <Html x={P.x(-2.8)} y={P.y(6.6)} size={28} anchor="left" color={C.text}>
            <Tex tex={`\\frac{w_1}{w_2}=${fmt(w1 / w2, 2)}=e^{${fmt(gamma * (z1 - z2), 2)}}`} />
          </Html>
          {beat >= 7 && (
            <Html x={P.x(-2.8)} y={P.y(5.2)} size={26} anchor="left" color={C.magenta}>
              <Tex tex={`\\gamma=${fmt(gamma, 2)}`} />
            </Html>
          )}
        </Group>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Mode = 'ratio' | 'product';
interface Case {
  mode: Mode;
  gamma: number;
  fixed: 'A' | 'B';
  fixedZ: number;
  target: number; // exponent of the target ratio/product
}
function genCase(seed: number, round: number): Case {
  const r = rng(seed);
  switch (round) {
    case 0:
      return { mode: 'ratio', gamma: 1, fixed: 'B', fixedZ: 0, target: pick(r, [1.5, 2, 2.5]) };
    case 1: {
      const fixedZ = pick(r, [-1, 0.5, 1, 1.5]);
      const target = pick(
        r,
        [-1.5, -1, 1, 1.5].filter((t) => Math.abs(fixedZ + t) <= 2.75),
      );
      return { mode: 'ratio', gamma: 1, fixed: 'B', fixedZ, target };
    }
    case 2: {
      const fixedZ = pick(r, [2, 2.5, -1]);
      const target = pick(
        r,
        [0.5, 1, -0.5].filter((t) => Math.abs(t - fixedZ) <= 2.75),
      );
      return { mode: 'product', gamma: 1, fixed: 'A', fixedZ, target };
    }
    case 3: {
      const fixedZ = pick(r, [-1, 0, 0.5]);
      return { mode: 'ratio', gamma: 2, fixed: 'B', fixedZ, target: pick(r, [3, 4]) };
    }
    default: {
      const fixedZ = pick(r, [-1.5, -1, 0]);
      return { mode: 'ratio', gamma: 0.5, fixed: 'B', fixedZ, target: pick(r, [1, 1.25]) };
    }
  }
}

function ScoreBalance({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => genCase(seed, round), [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  // the movable score starts away from the fixed one so both markers are visible and grabbable
  const [free, setFree] = useState(() => (cs.fixedZ === 0 ? -1 : 0));
  const zA = cs.fixed === 'A' ? cs.fixedZ : free;
  const zB = cs.fixed === 'B' ? cs.fixedZ : free;
  const g = cs.gamma;
  const wA = Math.exp(g * zA);
  const wB = Math.exp(g * zB);
  const expo = cs.mode === 'ratio' ? g * (zA - zB) : zA + zB;
  const value = Math.exp(expo);
  const shownA = useTween(Math.min(wA, 40), 0.35);
  const shownB = useTween(Math.min(wB, 40), 0.35);

  const gTex = g === 1 ? '' : `${fmt(g, 2)}\\,`;
  const targetTex = `e^{${fmt(cs.target, 2)}}\\approx${fmt(Math.exp(cs.target), 2)}`;
  const movable = cs.fixed === 'A' ? 'B' : 'A';
  useEffect(() => {
    if (cs.mode === 'ratio') {
      api.prompt(
        `Arrastra la puntuación $z_${movable}$ hasta que el **cociente** de pesos sea $${targetTex}$.${g !== 1 ? ` Precisión $\\gamma=${fmt(g, 2)}$: los pesos son $e^{\\gamma z}$.` : ''}`,
        `\\frac{w_A}{w_B}=\\frac{e^{${gTex}z_A}}{e^{${gTex}z_B}}=${targetTex}`,
      );
      api.hints([
        g === 1
          ? 'El cociente solo depende de la **diferencia**: $e^{z_A}/e^{z_B}=e^{z_A-z_B}$.'
          : `Con precisión: $e^{\\gamma z_A}/e^{\\gamma z_B}=e^{\\gamma(z_A-z_B)}$.`,
        `Necesitas $${g === 1 ? '' : `${fmt(g, 2)}\\cdot`}(z_A-z_B)=${fmt(cs.target, 2)}$, es decir $z_A-z_B=${fmt(cs.target / g, 2)}$.`,
      ]);
    } else {
      api.prompt(
        `Ahora los pesos se **multiplican** (evidencias independientes). Arrastra $z_B$ hasta que el producto sea $${targetTex}$.`,
        `w_A\\,w_B=e^{z_A}\\,e^{z_B}=${targetTex}`,
      );
      api.hints([
        'Multiplicar exponenciales suma exponentes: $e^{z_A}e^{z_B}=e^{z_A+z_B}$.',
        `Necesitas $z_A+z_B=${fmt(cs.target, 2)}$.`,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);

  const ZX = (z: number) => 800 + 200 * z;
  const axisY = 760;
  const onDrag = useSvgDrag(svg, (x) => {
    const z = Math.round(clamp((x - 800) / 200, -3, 3) * 4) / 4;
    if (z !== free) api.sfx.tick();
    setFree(z);
  });
  const submit = () => {
    if (Math.abs(expo - cs.target) < 1e-9)
      return api.result(
        true,
        cs.mode === 'ratio'
          ? `$\\gamma(z_A-z_B)=${fmt(cs.target, 2)}$: el cociente es $${targetTex}$. Solo importa la diferencia.`
          : `$z_A+z_B=${fmt(cs.target, 2)}$: el producto es $${targetTex}$. Sumar puntuaciones multiplica pesos.`,
      );
    if (cs.mode === 'ratio')
      return api.result(
        false,
        `Tu cociente es $e^{${fmt(expo, 2)}}\\approx${fmt(value, 2)}$ (diferencia $z_A-z_B=${fmt(zA - zB, 2)}$${g !== 1 ? `, por $\\gamma=${fmt(g, 2)}$` : ''}); se pide $${targetTex}$.`,
      );
    return api.result(
      false,
      `Tu producto es $e^{z_A+z_B}=e^{${fmt(expo, 2)}}$; se pide $${targetTex}$. Lo que cuenta es la **suma** $z_A+z_B$.`,
    );
  };

  const barH = (w: number) => Math.min(520, 52 * w);
  return (
    <Stage ref={svg}>
      {/* weights */}
      {[
        { n: 'A', w: shownA, z: zA, c: C.cyan, x: 560 },
        { n: 'B', w: shownB, z: zB, c: C.amber, x: 1040 },
      ].map(({ n, w, z, c, x }) => (
        <g key={n}>
          <rect
            x={x - 60}
            y={640 - barH(w)}
            width={120}
            height={barH(w)}
            fill={c}
            opacity={0.75}
            rx={4}
          />
          {w * 52 > 520 && (
            <path d={`M${x - 60} ${120}l60 -30l60 30`} fill="none" stroke={c} strokeWidth={3} />
          )}
          <Html x={x} y={640 - barH(w) - 30} size={24} color={c}>
            <Tex
              tex={`w_${n}=e^{${g === 1 ? '' : fmt(g, 2) + '\\cdot'}${fmt(z, 2)}}=${fmt(Math.exp(g * z), 2)}`}
            />
          </Html>
        </g>
      ))}
      <line x1={420} x2={1180} y1={640} y2={640} stroke={C.dim} strokeWidth={2} />
      {/* readout */}
      <Html x={800} y={110} size={30} color={Math.abs(expo - cs.target) < 1e-9 ? C.green : C.text}>
        <Tex
          tex={`${cs.mode === 'ratio' ? '\\frac{w_A}{w_B}' : 'w_A\\,w_B'}=e^{${fmt(expo, 2)}}\\approx${fmt(value, 2)}\\qquad\\text{objetivo } ${targetTex}`}
        />
      </Html>
      {/* score axis */}
      <line x1={ZX(-3.2)} x2={ZX(3.2)} y1={axisY} y2={axisY} stroke={C.magenta} strokeWidth={2} />
      {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
        <g key={t}>
          <line
            x1={ZX(t)}
            x2={ZX(t)}
            y1={axisY - 8}
            y2={axisY + 8}
            stroke={C.magenta}
            strokeWidth={2}
          />
          <Html x={ZX(t)} y={axisY + 28} size={18} color={C.magenta}>
            <Tex tex={String(t)} />
          </Html>
        </g>
      ))}
      <Html x={ZX(-3.2)} y={axisY - 34} size={18} anchor="left" color={C.magenta}>
        <span className="panel-note">PUNTUACIONES z</span>
      </Html>
      {[
        { n: 'A', z: zA, c: C.cyan },
        { n: 'B', z: zB, c: C.amber },
      ]
        // draw the movable marker last so it is always on top
        .sort((p, q) => Number(p.n === movable) - Number(q.n === movable))
        .map(({ n, z, c }) => {
          const mov = n === movable;
          return (
            <g key={n}>
              <Dot
                x={ZX(z)}
                y={axisY}
                r={mov ? 15 : 10}
                color={c}
                ring={mov}
                onPointerDown={mov ? onDrag : undefined}
                cursor={mov ? 'ew-resize' : undefined}
              />
              <Html x={ZX(z)} y={axisY - (n === 'A' ? 40 : 66)} size={20} color={c}>
                <Tex tex={`z_${n}=${fmt(z, 2)}${mov ? '' : '\\ (\\text{fija})'}`} />
              </Html>
            </g>
          );
        })}
      <Html x={1480} y={axisY - 90} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l10',
  world: 'foundations',
  code: '1.10',
  title: 'Exponencial',
  subtitle: 'exp: de sumas a productos',
  glyph: 'e^{x}',
  kind: 'level',
  objective:
    'Usar $e^x$ para convertir puntuaciones reales en pesos **positivos**, sabiendo que sumar exponentes multiplica pesos y que solo importan las **diferencias** de puntuación.',
  glyphs: ['econst', 'exp'],
  codex: ['w01-exp'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Mis hipótesis reciben **puntuaciones**: evidencia, preferencias, energías. Son números reales cualesquiera, también negativos.',
        'Pero una creencia es un **peso**, y un peso no puede ser negativo. Necesito una máquina que convierta cualquier real en algo positivo.',
        'La exponencial hace eso y algo más: convierte **sumar** puntuaciones en **multiplicar** pesos. Es la mitad de softmax.',
      ],
    },
    {
      kind: 'demo',
      title: 'Torre exponencial',
      Scene: ExpDemo,
      beats: [
        {
          say: 'Abajo, el exponente $x$ avanza de a un paso (se **suma** 1). Arriba, la altura $2^x$ se **duplica** en cada paso.',
          tex: '2^{\\Clog{x+1}}=2\\cdot 2^{\\Clog{x}}',
          dur: 2.6,
        },
        {
          say: 'Si un paso a la derecha duplica, un paso a la izquierda...',
          tex: '2^{\\Clog{-x}}=\\;?',
          ask: {
            prompt: 'Al bajar $x$ a $-1,-2,-3,\\dots$, ¿qué pasa con la altura $2^x$?',
            options: [
              'Se reduce a la mitad cada vez y nunca llega a 0',
              'Se vuelve negativa',
              'Llega a 0 en $x=-1$',
            ],
            answer: 0,
            explain:
              '$2^{-x}=1/2^{x}$: cada paso a la izquierda divide por 2. La torre se acerca al suelo sin tocarlo: $2^x>0$ para todo $x$.',
          },
          dur: 1.6,
        },
        {
          say: 'Sumar exponentes es **multiplicar** alturas: un paso de 1 seguido de uno de 2 llega a la misma torre que $2\\cdot4$.',
          tex: 'b^{\\Clog{a}+\\Clog{c}}=b^{\\Clog{a}}\\,b^{\\Clog{c}}',
          dur: 2,
        },
        {
          say: 'Cambiemos la base. En $x=0$ toda curva $b^x$ vale 1; lo que cambia es su **pendiente** allí. Busca la base cuya pendiente en 0 sea exactamente su altura: 1.',
          tex: 'b^{0}=1,\\qquad \\text{pendiente en }0=\\;?',
          gate: 'Arrastra la base $b$ hasta que la tangente en $0$ tenga pendiente $1$.',
          dur: 2,
        },
        {
          say: 'Esa base es $e\\approx2.71828$. La función $\\exp(x):=e^x$ crece, en cada punto, a una tasa igual a su valor. Por eso aparece en todas partes (lo usarás en el sector 02).',
          tex: '\\g{exp}{\\exp}(x):=\\g{econst}{e}^{x},\\qquad \\g{econst}{e}\\approx2.71828',
          dur: 2.4,
        },
        {
          say: 'Ahora el recorrido de $e^x$ cuando $x$ barre todos los reales.',
          tex: '\\g{exp}{\\exp}:\\mathbb R\\to\\;?',
          ask: {
            prompt: '¿Qué valores toma $e^x$ cuando $x$ recorre todo $\\mathbb R$?',
            options: ['$(0,\\infty)$', '$\\mathbb R$', '$[0,\\infty)$'],
            answer: 0,
            explain:
              'Siempre positiva y nunca cero: $\\exp:\\mathbb R\\to(0,\\infty)$. Cualquier puntuación real se vuelve un peso **estrictamente** positivo.',
          },
        },
        {
          say: 'Dos puntuaciones $z_1=1$ y $z_2=-0.5$ se vuelven pesos $e^{z_1}$ y $e^{z_2}$. Su **cociente** depende solo de la diferencia $z_1-z_2$.',
          tex: '\\frac{e^{\\Cin{z_1}}}{e^{\\Cbel{z_2}}}=e^{\\Cin{z_1}-\\Cbel{z_2}}=e^{1.5}\\approx4.48',
          dur: 2.2,
        },
        {
          say: 'Multiplicar todas las puntuaciones por una **precisión** $\\gamma$ eleva los pesos a la $\\gamma$: con $\\gamma=2$ el cociente pasa de $e^{1.5}$ a $e^{3}$. Más precisión, diferencias más marcadas.',
          tex: '(e^{z})^{\\gamma}=e^{\\gamma z}',
          dur: 2.6,
        },
      ],
    },
    { kind: 'challenge', title: 'Balanza de puntuaciones', Comp: ScoreBalance, rounds: 5 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l10-f1',
          title: 'Un factor que se cancela',
          brief: 'Junta las exponenciales en una sola y simplifica el exponente.',
          start: 'e^(a+b) * e^(-b)',
          goal: 'e^(a)',
          rules: ['exp-add', 'exp-merge', 'exp-neg', 'add-cancel', 'distribute'],
          par: 2,
          hints: [
            'Un producto de exponenciales es la exponencial de la suma de exponentes.',
            'Luego $b$ y $-b$ se cancelan.',
          ],
          bridge:
            'Sumar y restar la misma puntuación no cambia nada: es la idea detrás de la invariancia de softmax.',
        },
        {
          id: 'l10-f2',
          title: 'Solo importan las diferencias',
          brief:
            'Dos pesos con la misma constante $c$ sumada a ambas puntuaciones. Muestra que su cociente no depende de $c$.',
          start: 'e^(z_1 + c) / e^(z_2 + c)',
          goal: 'e^(z_1 - z_2)',
          rules: ['exp-div', 'exp-add', 'neg-add', 'add-cancel', 'cancel'],
          par: 3,
          hints: [
            'Un cociente de exponenciales es $e^{a-b}$.',
            'Reparte el signo y cancela $c$ con $-c$.',
          ],
          bridge:
            'Por eso en softmax se puede restar el máximo a todas las puntuaciones sin cambiar el resultado.',
        },
        {
          id: 'l10-f3',
          title: 'Tres pasos iguales',
          brief: 'Tres factores idénticos: escríbelos como una sola exponencial.',
          start: 'e^(x) * e^(x) * e^(x)',
          goal: 'e^(3*x)',
          rules: ['exp-merge', 'add-collect', 'exp-add', 'pow-merge'],
          par: 2,
          hints: ['Junta los tres factores: el exponente queda $x+x+x$.'],
          bridge: '$e^{3x}=(e^{x})^{3}$: multiplicar la puntuación por 3 eleva el peso al cubo.',
        },
        {
          id: 'l10-f4',
          title: 'La precisión se deshace',
          brief:
            'Un peso elevado a una precisión $\\gamma$ y multiplicado por $e^{-\\gamma z}$. ¿Qué queda?',
          start: '(e^(z))^(gamma) * e^(-(gamma*z))',
          goal: '1',
          rules: ['exp-pow', 'exp-merge', 'add-cancel', 'ln-consts', 'exp-neg'],
          par: 4,
          hints: [
            'Primero $(e^{z})^{\\gamma}=e^{\\gamma z}$.',
            'Junta, cancela el exponente y usa $e^0=1$.',
          ],
          bridge:
            'Las precisiones actúan como exponentes sobre los pesos: $q(\\pi)\\propto\\exp(\\ln E(\\pi)-\\gamma G(\\pi))$.',
        },
      ],
    },
    { kind: 'codex', entry: 'w01-exp' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-exp',
    world: 'foundations',
    level: 'w01-l10',
    title: 'Exponencial',
    summary:
      '$e^x$ convierte cualquier real en un peso positivo y convierte sumas de puntuaciones en productos de pesos.',
    blocks: [
      {
        label: 'Definición',
        tex: '\\exp(x):=e^{x},\\qquad e:=\\lim_{n\\to\\infty}\\Big(1+\\tfrac1n\\Big)^{n}\\approx2.71828',
      },
      {
        label: 'Dominio y recorrido',
        tex: '\\exp:\\mathbb R\\to(0,\\infty),\\qquad e^{x}>0\\ \\ \\forall x',
      },
      {
        label: 'Leyes',
        tex: 'e^{a+b}=e^{a}e^{b},\\quad e^{a-b}=\\frac{e^{a}}{e^{b}},\\quad e^{-a}=\\frac{1}{e^{a}},\\quad (e^{a})^{\\gamma}=e^{\\gamma a},\\quad e^{0}=1',
      },
      {
        label: 'Monotonía',
        tex: 'a<b\\ \\Rightarrow\\ e^{a}<e^{b}',
        body: 'Estrictamente creciente: ordenar puntuaciones es ordenar pesos.',
      },
      {
        label: 'La propiedad de e',
        tex: '\\frac{d}{dx}e^{x}=e^{x}',
        body: 'Tasa de crecimiento igual al valor. Para otra base: $\\frac{d}{dx}b^{x}=(\\ln b)\\,b^{x}$ (sector 02).',
      },
      {
        label: 'Cocientes de pesos',
        tex: '\\frac{e^{z_1}}{e^{z_2}}=e^{z_1-z_2}',
        body: 'Los pesos exponenciales solo ven **diferencias** de puntuación.',
      },
    ],
    pitfalls: [
      '$e^{a+b}\\neq e^{a}+e^{b}$: la exponencial convierte sumas en **productos**.',
      '$e^{x}$ nunca es negativa ni cero, aunque $x<0$.',
      '$2^{x}$ (exponente variable) no es $x^{2}$ (base variable).',
    ],
    aif: [
      {
        tex: '\\sigma(\\mathbf z)_i=\\frac{e^{z_i}}{\\sum_j e^{z_j}}',
        text: 'El numerador de softmax: puntuaciones convertidas en pesos positivos (1.12).',
      },
      {
        tex: 'q(\\pi)\\propto\\exp\\big(\\ln E(\\pi)-\\gamma\\,G(\\pi)\\big)',
        text: 'Creencia sobre políticas: la precisión $\\gamma$ actúa como exponente que agudiza (guía G10).',
      },
    ],
  },
];

export const glyphs: Glyph[] = [
  {
    id: 'econst',
    world: 'foundations',
    tex: 'e',
    name: 'Número e',
    read: 'e',
    meaning:
      'Constante $e\\approx2.71828$: la base cuya exponencial crece a una tasa igual a su valor.',
    warn: 'No confundir con $\\mathbf e_j$ (vector one-hot), con $\\mathbf E$ (prior de políticas) ni con $\\mathbb E$ (esperanza).',
  },
  {
    id: 'exp',
    world: 'foundations',
    tex: '\\exp',
    name: 'Exponencial',
    read: 'exponencial de',
    meaning: '$\\exp(x)=e^x$: convierte cualquier real en un número positivo y sumas en productos.',
    aif: 'Pesos $e^{z_i}$ de softmax; $q(\\pi)\\propto\\exp(\\ln E-\\gamma G)$.',
  },
];
