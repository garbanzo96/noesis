import { useEffect, useMemo, useRef, useState } from 'react';
import { lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { Group, Html, Stage, plane } from '../../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { rng } from '../shared/rng';
import { LogRuler, fracTex } from '../shared/LogRuler';

// ============================================================================
// 1.11 · LOGARITMO — "contar factores"
// Reference level for the World 1 pattern:
//   demo (two rulers → slide rule → graph → surprise) with two predictions and a gate,
//   challenge (build ln of a number from ±ln p blocks), Forge (log identities), codex.
// ============================================================================

const LN2 = Math.log(2);

// ---------------------------------------------------------------- demo scene
function LogDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const X = (u: number) => 800 + 200 * u;
  const yTop = 360;
  const yBot = 650;
  const rulerView = 1 - at(5);
  const graphView = at(5);

  // beat 2 prediction reveal (stays revealed afterwards)
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1.1);
  const rev6 = useTween(beat > 6 || (beat === 6 && answer !== null) ? 1 : 0, 1.0);

  // beat 4: slide rule
  const [off, setOff] = useState(0);
  const dragState = useRef({ x0: 0, off0: 0 });
  const aligned = Math.abs(off - LN2) < 1e-9;
  const onDrag = useSvgDrag(svg, (x, _y, phase) => {
    if (beat !== 4) return;
    if (phase === 'start') dragState.current = { x0: x, off0: off };
    else {
      let o = dragState.current.off0 + (x - dragState.current.x0) / 200;
      o = Math.max(-0.6, Math.min(2.4, o));
      if (Math.abs(o - LN2) < 0.05) {
        o = LN2;
        unlock();
      }
      setOff(o);
    }
  });
  const slide = beat >= 4 ? (beat === 4 ? off : LN2) : 0;

  // token along the e-ruler
  const tokenU = beat < 2 ? lerp(0, 2, at(1)) : lerp(2, -1, rev2);

  const ePowers = [-3, -2, -1, 0, 1, 2, 3];
  const eLabel = (k: number) =>
    k === 0 ? '1' : k === 1 ? 'e' : k > 1 ? `e^{${k}}` : k === -1 ? '\\tfrac{1}{e}' : `\\tfrac{1}{e^{${-k}}}`;
  const shown = (k: number) => (k >= 0 ? 1 : rev2);
  const eRuler = rulerView * (1 - at(3));
  const intRuler = rulerView * at(3);

  // graph view
  const P = plane([-3.2, 6.2], [-3.2, 3.2], { x: 306, y: 70, w: 987, h: 672 });
  return (
    <Stage ref={svg}>
      {/* ---------------- ruler view ---------------- */}
      <Group opacity={rulerView}>
        <Html x={150} y={yTop - 70} size={20} color={C.amber} anchor="left">
          <span className="panel-note">REGLA MULTIPLICATIVA · valores x</span>
        </Html>
        <Html x={150} y={yBot + 70} size={20} color={C.magenta} anchor="left">
          <span className="panel-note">RECTA ADITIVA · posiciones ln x</span>
        </Html>
        {/* additive line */}
        <Line a={[X(-3.4), yBot]} b={[X(3.4), yBot]} color={C.magenta} width={2} progress={at(0)} />
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
          const o = k >= 0 ? at(0) : rev2;
          return (
            <g key={k} opacity={o}>
              <line x1={X(k)} x2={X(k)} y1={yBot - 10} y2={yBot + 10} stroke={C.magenta} strokeWidth={2} />
              <Html x={X(k)} y={yBot + 34} size={24} color={C.magenta} opacity={o}>
                <Tex tex={String(k)} />
              </Html>
            </g>
          );
        })}
        {/* e-ruler */}
        <Group opacity={eRuler}>
          <line x1={X(-3.4)} x2={X(3.4)} y1={yTop} y2={yTop} stroke={C.amber} strokeWidth={2} opacity={0.7 * at(0)} />
          {ePowers.map((k) => (
            <Group key={k} opacity={shown(k) * at(0)}>
              <line x1={X(k)} x2={X(k)} y1={yTop} y2={yTop - 16} stroke={C.amber} strokeWidth={2.5} />
              <Html x={X(k)} y={yTop - 40} size={26} color={C.amber}>
                <Tex tex={eLabel(k)} />
              </Html>
              <Line a={[X(k), yTop + 6]} b={[X(k), yBot - 14]} color={C.line} dashed width={1.5} />
            </Group>
          ))}
          {beat >= 1 && beat <= 2 && (
            <>
              <Dot x={X(tokenU)} y={yTop} r={11} color={C.amber} />
              <Dot x={X(tokenU)} y={yBot} r={9} color={C.magenta} />
              <Line a={[X(tokenU), yTop + 12]} b={[X(tokenU), yBot - 12]} color={C.text} dashed width={2} />
              <Html x={X(tokenU) + 18} y={(yTop + yBot) / 2} size={26} anchor="left" color={C.text}>
                <Tex
                  tex={
                    beat === 2 && rev2 > 0.5
                      ? '\\ln\\tfrac{1}{e}=-1'
                      : `\\ln ${eLabel(Math.round(tokenU))} = ${Math.round(tokenU)}`
                  }
                />
              </Html>
            </>
          )}
          {beat === 2 && answer === null && (
            <Html x={X(-1)} y={yTop - 40} size={34} color={C.amber}>
              <span>?</span>
            </Html>
          )}
        </Group>
        {/* integer ruler (beats 3–4) */}
        <LogRuler
          X={X}
          y={yTop}
          values={[1, 2, 3, 4, 6, 8, 10, 16]}
          minor={[5, 7, 9, 12, 14, 20, 24]}
          opacity={intRuler}
          width={[X(-0.4), X(3.4)]}
        />
        {/* beat 3: segments ln2 + ln3 = ln6 */}
        {beat === 3 && (
          <g>
            <Arrow from={[X(0), yBot - 40]} to={[X(LN2), yBot - 40]} color={C.cyan} width={5} progress={Math.min(1, at(3) * 2)} />
            <Arrow
              from={[X(LN2), yBot - 40]}
              to={[X(Math.log(6)), yBot - 40]}
              color={C.amber}
              width={5}
              progress={Math.max(0, at(3) * 2 - 1)}
            />
            <Html x={X(LN2 / 2)} y={yBot - 70} size={22} color={C.cyan} opacity={at(3)}>
              <Tex tex="\ln 2" />
            </Html>
            <Html x={X((LN2 + Math.log(6)) / 2)} y={yBot - 70} size={22} color={C.amber} opacity={Math.max(0, at(3) * 2 - 1)}>
              <Tex tex="\ln 3" />
            </Html>
            <Line a={[X(Math.log(6)), yBot - 40]} b={[X(Math.log(6)), yTop + 6]} color={C.green} dashed width={2} opacity={Math.max(0, at(3) * 2 - 1)} />
            <Dot x={X(Math.log(6))} y={yTop} r={11} color={C.green} opacity={Math.max(0, at(3) * 2 - 1)} />
          </g>
        )}
        {/* beat 4: sliding ruler */}
        {beat >= 4 && (
          <Group opacity={at(4)}>
            <LogRuler
              X={X}
              y={yTop + 70}
              values={[1, 2, 3, 4, 5, 6, 8, 10]}
              minor={[7, 9]}
              color={C.cyan}
              below
              offset={slide}
              width={[X(slide) - 30, X(slide + Math.log(10)) + 30]}
            />
            <rect
              x={X(slide) - 40}
              y={yTop + 50}
              width={X(slide + Math.log(10)) - X(slide) + 80}
              height={90}
              fill="#28e7fa"
              fillOpacity={beat === 4 && !aligned ? 0.06 : 0}
              stroke={beat === 4 && !aligned ? C.cyan : 'none'}
              strokeDasharray="6 6"
              style={{ cursor: beat === 4 ? 'ew-resize' : undefined }}
              onPointerDown={beat === 4 ? onDrag : undefined}
            />
            <Line a={[X(0), yBot - 40]} b={[X(slide), yBot - 40]} color={C.cyan} width={5} />
            <Html x={X(slide / 2)} y={yBot - 70} size={22} color={C.cyan}>
              <Tex tex={`\\text{desplazamiento}=${slide.toFixed(2)}`} />
            </Html>
            {(aligned || beat > 4) &&
              [1, 2, 3, 4, 5].map((v) => (
                <Line
                  key={v}
                  a={[X(Math.log(v) + LN2), yTop + 70]}
                  b={[X(Math.log(v) + LN2), yTop]}
                  color={C.green}
                  width={3}
                  glow
                />
              ))}
            {(aligned || beat > 4) && (
              <Html x={X(1.6)} y={yBot - 130} size={26} color={C.green}>
                <Tex tex="\ln 2 + \ln v = \ln(2v)\quad\Rightarrow\quad 4\mapsto 8,\ 5\mapsto 10" />
              </Html>
            )}
            {beat === 4 && !aligned && (
              <Html x={X(slide + 1.1)} y={yTop + 170} size={22} color={C.cyan}>
                <span className="panel-note">⟷ arrastra la regla inferior</span>
              </Html>
            )}
          </Group>
        )}
      </Group>

      {/* ---------------- graph view ---------------- */}
      <Group opacity={graphView}>
        <Axes P={P} xTicks={[1, 2, 3, 4, 5, 6]} yTicks={[-3, -2, -1, 1, 2, 3]} opacity={graphView} />
        <Line a={P.pt(-3.2, -3.2)} b={P.pt(3.2, 3.2)} color={C.dim} dashed width={1.5} opacity={at(5) * (1 - at(7) * 0.8)} />
        <Curve P={P} f={Math.exp} a={-3.2} b={1.16} color={C.violet} width={3} progress={at(5)} opacity={0.55 * (1 - at(7))} />
        <Curve P={P} f={Math.log} a={0.04} b={6.2} color={C.magenta} width={4.5} progress={at(5)} opacity={1 - at(7) * 0.7} />
        <Html x={P.x(0.9)} y={P.y(2.7)} size={28} color={C.violet} opacity={at(5) * (1 - at(7))}>
          <Tex tex="y=e^{x}" />
        </Html>
        <Html x={P.x(5.2)} y={P.y(2.2)} size={28} color={C.magenta} opacity={at(5)}>
          <Tex tex="y=\ln x" />
        </Html>
        <Html x={P.x(2.6)} y={P.y(3.0)} size={20} color={C.dim} opacity={at(5) * (1 - at(7))}>
          <Tex tex="y=x" />
        </Html>
        {/* (0,1]: ln p ≤ 0 */}
        <Curve P={P} f={Math.log} a={0.04} b={1} color={C.amber} width={8} progress={rev6} opacity={rev6 * (1 - at(7) * 0.6)} />
        {rev6 > 0 && (
          <Html x={P.x(0.5)} y={P.y(-2.6)} size={24} color={C.amber} opacity={rev6}>
            <Tex tex="0<p\le 1\ \Rightarrow\ \ln p\le 0" />
          </Html>
        )}
        {/* surprise */}
        <Curve P={P} f={(x) => -Math.log(x)} a={0.045} b={1} color={C.green} width={5} progress={at(7)} />
        {[
          { p: 0.5, t: '\\tfrac12' },
          { p: 0.25, t: '\\tfrac14' },
          { p: 0.125, t: '\\tfrac18' },
        ].map(({ p, t }, i) => (
          <Group key={p} opacity={at(7)}>
            <Dot x={P.x(p)} y={P.y(-Math.log(p))} r={8} color={C.green} />
            <Html x={P.x(p) + 16} y={P.y(-Math.log(p))} size={21} anchor="left" color={C.green}>
              <Tex tex={`-\\ln ${t}=${(-Math.log(p)).toFixed(2)}`} />
            </Html>
            {i === 0 && null}
          </Group>
        ))}
        {/* stacked surprise bars */}
        <Group opacity={at(7)}>
          {(() => {
            const s1 = -Math.log(0.5);
            const s2 = -Math.log(0.25);
            const base = P.y(0);
            const h = (v: number) => P.y(0) - P.y(v);
            return (
              <>
                <rect x={1360} y={base - h(s1)} width={50} height={h(s1)} fill={C.cyan} opacity={0.8} />
                <rect x={1360} y={base - h(s1) - h(s2)} width={50} height={h(s2)} fill={C.amber} opacity={0.8} />
                <rect x={1440} y={base - h(s1 + s2)} width={50} height={h(s1 + s2)} fill={C.green} opacity={0.8} />
                <Html x={1385} y={base + 26} size={18} color={C.muted}>
                  <Tex tex="p\cdot q" />
                </Html>
                <Html x={1465} y={base + 26} size={18} color={C.muted}>
                  <Tex tex="\tfrac18" />
                </Html>
                <Html x={1425} y={base - h(s1 + s2) - 30} size={20} color={C.green}>
                  <Tex tex="0.69+1.39=2.08" />
                </Html>
              </>
            );
          })()}
        </Group>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Block = { p: 2 | 3 | 5; s: 1 | -1 };
const BLOCK_COLOR = { 2: C.cyan, 3: C.amber, 5: C.violet } as const;
const POOLS: [number, number, number][][] = [
  [
    [2, 0, 0],
    [3, 0, 0],
    [1, 1, 0],
    [2, 1, 0],
    [1, 2, 0],
    [3, 1, 0],
  ],
  [
    [-1, 1, 0],
    [2, -1, 0],
    [-2, 2, 0],
    [3, -1, 0],
    [-1, 2, 0],
  ],
  [
    [-1, -1, 0],
    [-2, 0, 0],
    [1, -2, 0],
    [-3, 1, 0],
    [-2, -1, 0],
  ],
  [
    [1, 0, 1],
    [-1, 0, 1],
    [0, -1, 1],
    [2, 0, -1],
    [1, 1, -1],
    [0, 1, 1],
  ],
];

function factorTex(a: number, b: number, c: number) {
  const parts: string[] = [];
  const push = (n: number, p: number) => {
    for (let i = 0; i < Math.abs(n); i++) parts.push(n > 0 ? `+\\ln ${p}` : `-\\ln ${p}`);
  };
  push(a, 2);
  push(b, 3);
  push(c, 5);
  const s = parts.join('');
  return s.startsWith('+') ? s.slice(1) : s;
}

function FactorBuilder({ seed, round, api }: ChallengeProps) {
  const target = useMemo(() => {
    const r = rng(seed);
    const pool = POOLS[Math.min(round, POOLS.length - 1)];
    return pool[Math.floor(r() * pool.length)];
  }, [seed, round]);
  const [ta, tb, tc] = target;
  const T = fracTex(ta, tb, tc);
  const withFive = tc !== 0 || round >= 3;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const a = blocks.reduce((n, b) => n + (b.p === 2 ? b.s : 0), 0);
  const b3 = blocks.reduce((n, b) => n + (b.p === 3 ? b.s : 0), 0);
  const c5 = blocks.reduce((n, b) => n + (b.p === 5 ? b.s : 0), 0);
  const u = a * Math.log(2) + b3 * Math.log(3) + c5 * Math.log(5);
  const tu = ta * Math.log(2) + tb * Math.log(3) + tc * Math.log(5);
  const shownU = useTween(u, 0.45);

  useEffect(() => {
    api.prompt(
      `Construye $\\ln ${T}$ apilando bloques $\\pm\\ln 2$, $\\pm\\ln 3$${withFive ? ', $\\pm\\ln 5$' : ''}. Abajo sumas longitudes; arriba el cursor muestra el número que vas **multiplicando**.`,
      `\\ln ${T} = \\;?`,
    );
    const num = 2 ** Math.max(ta, 0) * 3 ** Math.max(tb, 0) * 5 ** Math.max(tc, 0);
    const den = 2 ** Math.max(-ta, 0) * 3 ** Math.max(-tb, 0) * 5 ** Math.max(-tc, 0);
    const factors = (n: number) => {
      const f: number[] = [];
      for (const p of [2, 3, 5]) while (n % p === 0) (f.push(p), (n /= p));
      return f.length ? f.join('\\cdot ') : '1';
    };
    api.hints([
      den === 1
        ? `Factoriza en primos: $${num} = ${factors(num)}$.`
        : `Factoriza numerador y denominador: $\\tfrac{${num}}{${den}} = \\tfrac{${factors(num)}}{${factors(den)}}$.`,
      'Cada primo del numerador es un bloque $+\\ln p$; cada primo del denominador, un bloque $-\\ln p$ (porque $\\ln\\tfrac ab=\\ln a-\\ln b$).',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [T]);

  const add = (p: 2 | 3 | 5, s: 1 | -1) => {
    if (blocks.length >= 9) return;
    api.sfx.click();
    setBlocks([...blocks, { p, s }]);
  };
  const submit = () => {
    if (!blocks.length) return api.result(false, 'Aún no has apilado ningún bloque.');
    if (a === ta && b3 === tb && c5 === tc)
      return api.result(true, `$\\ln ${T} = ${factorTex(ta, tb, tc)}$. Multiplicar arriba es sumar abajo.`);
    api.result(
      false,
      `Tu cursor marca $${fracTex(a, b3, c5)}$, no $${T}$. Para llegar falta multiplicar por $${fracTex(ta - a, tb - b3, tc - c5)}$.`,
    );
  };

  const X = (v: number) => 800 + 190 * v;
  const yTop = 250;
  const yBot = 700;
  const powers = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  let acc = 0;
  return (
    <Stage>
      <LogRuler
        X={X}
        y={yTop}
        values={powers.map((k) => 2 ** k).filter((v) => Math.abs(Math.log(v)) < 3.75)}
        labels={(v) => (v >= 1 ? String(v) : `\\tfrac1{${1 / v}}`)}
        minor={[3, 5, 6, 10, 12, 15, 20, 24, 1 / 3, 1 / 5, 1 / 6, 1 / 10, 1 / 12, 1 / 9, 9, 18, 2 / 3, 3 / 2]}
        width={[X(-3.75), X(3.75)]}
      />
      {/* target */}
      <g>
        <path
          d={`M${X(tu)} ${yTop - 64}l14 -14l14 14l-14 14z`}
          transform={`translate(-14 0)`}
          fill={C.amber}
          filter="url(#glow)"
        />
        <Html x={X(tu)} y={yTop - 108} size={30} color={C.amber}>
          <Tex tex={`\\text{objetivo } ${T}`} />
        </Html>
      </g>
      {/* additive axis */}
      <line x1={X(-3.75)} x2={X(3.75)} y1={yBot} y2={yBot} stroke={C.magenta} strokeWidth={2} />
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
        <g key={k}>
          <line x1={X(k)} x2={X(k)} y1={yBot - 8} y2={yBot + 8} stroke={C.magenta} strokeWidth={2} />
          <Html x={X(k)} y={yBot + 28} size={20} color={C.magenta}>
            <Tex tex={String(k)} />
          </Html>
        </g>
      ))}
      {/* stacked blocks, waterfall style */}
      {blocks.map((bk, i) => {
        const from = acc;
        acc += bk.s * Math.log(bk.p);
        const y = yBot - 36 - 30 * i;
        return (
          <g key={i}>
            <Arrow from={[X(from), y]} to={[X(acc), y]} color={BLOCK_COLOR[bk.p]} width={6} />
            <Html x={X((from + acc) / 2)} y={y - 16} size={17} color={BLOCK_COLOR[bk.p]}>
              <Tex tex={`${bk.s < 0 ? '-' : '+'}\\ln ${bk.p}`} />
            </Html>
          </g>
        );
      })}
      {/* cursor */}
      <Line a={[X(shownU), yBot]} b={[X(shownU), yTop + 4]} color={C.text} dashed width={2} />
      <Dot x={X(shownU)} y={yTop} r={10} color={C.text} />
      <Dot x={X(shownU)} y={yBot} r={8} color={C.magenta} />
      <Html x={X(shownU)} y={yTop + 36} size={24} color={C.text}>
        <Tex tex={blocks.length ? fracTex(a, b3, c5) : '1'} />
      </Html>
      <Html x={150} y={yBot - 330} size={24} anchor="left" color={C.muted}>
        <Tex tex={blocks.length ? `${factorTex(a, b3, c5) || '0'} = \\ln ${fracTex(a, b3, c5)}` : '\\ln 1 = 0'} />
      </Html>
      {/* controls */}
      <Html x={800} y={820} size={22} interactive>
        <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
          {([2, 3, 5] as const)
            .filter((p) => p !== 5 || withFive)
            .map((p) => (
              <span key={p} style={{ display: 'flex', gap: '0.25em' }}>
                <button className="stage-btn" style={{ borderColor: BLOCK_COLOR[p] }} onClick={() => add(p, 1)}>
                  <Tex tex={`+\\ln ${p}`} />
                </button>
                <button className="stage-btn" style={{ borderColor: BLOCK_COLOR[p] }} onClick={() => add(p, -1)}>
                  <Tex tex={`-\\ln ${p}`} />
                </button>
              </span>
            ))}
          <button className="stage-btn" onClick={() => setBlocks(blocks.slice(0, -1))} disabled={!blocks.length}>
            ↶ quitar
          </button>
          <button className="stage-btn on" onClick={submit}>
            Fijar ▸
          </button>
        </div>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l11',
  world: 'foundations',
  code: '1.11',
  title: 'Logaritmo',
  subtitle: 'ln: contar factores',
  glyph: '\\ln',
  kind: 'level',
  objective:
    'Leer $\\ln x$ como posición en una regla multiplicativa, convertir productos en sumas con sus condiciones ($x>0$) y usar la sorpresa $-\\ln p$.',
  glyphs: ['ln', 'logb', 'surprisal'],
  codex: ['w01-ln'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Multiplica $0.9$ por sí mismo 200 veces: obtienes $7\\times10^{-10}$. Así se ven las probabilidades conjuntas de muchos datos: números que se desvanecen.',
        'Necesito otra escala. El **logaritmo** cuenta cuántas veces hay que multiplicar por $e$ para llegar a un número: convierte productos en sumas.',
        'Con él, la **sorpresa** $-\\ln p$ se vuelve un instrumento. La energía libre que minimizarás en el sector 11 es una cota de esa sorpresa.',
      ],
    },
    {
      kind: 'demo',
      title: 'Dos reglas',
      Scene: LogDemo,
      beats: [
        {
          say: 'Dos reglas alineadas. Abajo, la recta de siempre: **sumar** es desplazarse. Arriba, una regla **multiplicativa**: cada paso a la derecha multiplica por $e\\approx2.718$.',
          tex: 'e^{\\Clog{y}}=\\Cout{x}',
          dur: 2.2,
        },
        {
          say: 'El logaritmo natural lee la regla de arriba en la de abajo: $\\ln x$ es la **posición** de $x$. Cuenta cuántos factores $e$ hacen falta para llegar a $x$.',
          tex: '\\g{ln}{\\ln}\\,\\Cout{x}=\\Clog{y}\\iff e^{\\Clog{y}}=\\Cout{x}',
          dur: 2,
        },
        {
          say: 'Si un paso a la derecha multiplica por $e$, un paso a la izquierda divide por $e$.',
          tex: '\\g{ln}{\\ln}\\tfrac{1}{e}=\\;?',
          ask: {
            prompt: '¿En qué posición de la recta queda $1/e$?',
            options: ['$-1$', '$0.37$', 'No tiene posición'],
            answer: 0,
            explain:
              'Dividir por $e$ es un paso a la izquierda: $\\ln(1/e)=-1$. Todo número entre 0 y 1 tiene logaritmo **negativo**. ($0.37\\approx 1/e$ es el valor, no la posición.)',
          },
        },
        {
          say: 'Multiplicar arriba es **sumar longitudes** abajo: el segmento de $2$ seguido del segmento de $3$ llega exactamente a $6$.',
          tex: '\\g{ln}{\\ln}(\\Cin{2}\\cdot\\Cout{3})=\\g{ln}{\\ln}\\Cin{2}+\\g{ln}{\\ln}\\Cout{3}',
          dur: 2.4,
        },
        {
          say: 'Eso es una **regla de cálculo**, la calculadora de los ingenieros durante tres siglos. Desplazar una regla logarítmica suma un logaritmo a todos sus puntos.',
          tex: '\\ln 2+\\ln v=\\ln(2v)',
          gate: 'Arrastra la regla inferior hasta que su $1$ quede bajo el $2$.',
        },
        {
          say: 'La curva $y=\\ln x$ es $y=e^x$ reflejada en la diagonal: son funciones **inversas**. Su dominio es $(0,\\infty)$: cuando $x\\to0^+$ la curva cae sin fondo.',
          tex: '\\g{ln}{\\ln}:(0,\\infty)\\to\\mathbb R,\\qquad \\ln e^{x}=x,\\quad e^{\\ln x}=x\\ (x>0)',
          dur: 2.4,
        },
        {
          say: 'Las probabilidades viven en $(0,1]$.',
          tex: '0<p\\le1',
          ask: {
            prompt: 'Si $0<p\\le1$, ¿qué signo tiene $\\ln p$?',
            options: ['$\\ln p\\le 0$', '$\\ln p\\ge 0$', 'Depende de $p$'],
            answer: 0,
            explain:
              'En $(0,1]$ la curva está bajo el eje: $\\ln p\\le 0$, con igualdad solo en $p=1$. Por eso se trabaja con $-\\ln p\\ge0$.',
          },
        },
        {
          say: 'La **sorpresa** $\\mathcal I(x)=-\\ln p(x)$ voltea esa parte de la curva: lo seguro no sorprende, lo improbable sorprende mucho. Para eventos independientes, las sorpresas **se suman**.',
          tex: '\\g{surprisal}{-\\ln}(pq)=(-\\ln p)+(-\\ln q)',
          dur: 2.2,
        },
      ],
    },
    { kind: 'challenge', title: 'Constructor de factores', Comp: FactorBuilder, rounds: 5 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l11-f1',
          title: 'Desarmar un producto',
          brief:
            'Tres probabilidades positivas. Separa el logaritmo en contribuciones individuales: una línea, una identidad.',
          symbols: { p: { tex: 'p', pos: true } },
          start: 'ln(p_1^2 * p_2 / p_3)',
          goal: '2*ln(p_1) + ln(p_2) - ln(p_3)',
          rules: ['ln-mul', 'ln-div', 'ln-pow', 'ln-exp'],
          par: 3,
          hints: ['Empieza por la operación más externa dentro del $\\ln$: el cociente.', 'Después separa el producto y baja el exponente.'],
          bridge: 'Así se separan log-verosimilitudes de datos condicionalmente independientes.',
        },
        {
          id: 'l11-f2',
          title: 'ln deshace exp',
          brief: 'Aquí $b>0$. Una exponencial dentro de un logaritmo se cancela.',
          symbols: { b: { tex: 'b', pos: true } },
          start: 'ln(e^(a) * b)',
          goal: 'a + ln(b)',
          rules: ['ln-mul', 'ln-exp', 'exp-ln', 'ln-div'],
          par: 2,
          hints: ['$e^a>0$ siempre, y $b>0$: puedes separar el producto.'],
          bridge: 'Este paso aparece cada vez que un término $e^{(\\cdot)}$ entra en un $\\ln$, por ejemplo en softmax.',
        },
        {
          id: 'l11-f3',
          title: 'Bayes en escala logarítmica',
          brief:
            'Regla de Bayes: $p(s\\mid o)=\\dfrac{p(o\\mid s)\\,p(s)}{p(o)}$. Escríbela como suma de logaritmos. Todas las probabilidades son positivas.',
          symbols: {
            Lk: { tex: 'p(o\\mid s)', pos: true },
            Pr: { tex: 'p(s)', pos: true },
            Ev: { tex: 'p(o)', pos: true },
          },
          start: 'ln(Lk * Pr / Ev)',
          goal: 'ln(Lk) + ln(Pr) - ln(Ev)',
          rules: ['ln-mul', 'ln-div', 'ln-pow', 'neg-add'],
          par: 2,
          hints: ['Primero el cociente, luego el producto.'],
          bridge: 'En la energía libre $F$ aparece exactamente $\\ln p(o,s)=\\ln p(o\\mid s)+\\ln p(s)$.',
        },
        {
          id: 'l11-f4',
          title: 'N datos y un prior',
          brief:
            'Posterior no normalizado de $N$ datos independientes: $p(\\theta)\\prod_{i=1}^N p(x_i\\mid\\theta)$. Llévalo a escala logarítmica.',
          symbols: {
            L: { tex: 'L', tpl: 'p(x_{#}\\mid\\theta)', pos: true },
            P: { tex: 'p(\\theta)', pos: true },
          },
          start: 'ln(prod(i, 1, N, L_i) * P)',
          goal: 'sum(i, 1, N, ln(L_i)) + ln(P)',
          rules: ['ln-mul', 'ln-prod', 'expand', 'ln-pow'],
          par: 2,
          hints: ['Un $\\prod$ de positivos es positivo: puedes separar el producto exterior.', 'Luego, el logaritmo de un $\\prod$ es un $\\sum$ de logaritmos.'],
          bridge: '$\\ln p(\\theta)+\\sum_i\\ln p(x_i\\mid\\theta)$: la log-posterior que maximiza un estimador MAP (sector 06).',
        },
      ],
    },
    { kind: 'codex', entry: 'w01-ln' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-ln',
    world: 'foundations',
    level: 'w01-l11',
    title: 'Logaritmo natural',
    summary:
      '$\\ln x$ es la posición de $x$ en la regla multiplicativa: cuántos factores $e$ hacen falta para llegar a $x$. Convierte productos en sumas.',
    blocks: [
      {
        label: 'Definición',
        tex: '\\ln x := y \\iff e^{y}=x,\\qquad \\ln:(0,\\infty)\\to\\mathbb R',
      },
      {
        label: 'Inversas',
        tex: '\\ln(e^{x})=x\\ \\ (x\\in\\mathbb R),\\qquad e^{\\ln x}=x\\ \\ (x>0)',
      },
      {
        label: 'Reglas (a, b > 0, r real)',
        tex: '\\ln(ab)=\\ln a+\\ln b,\\quad \\ln\\tfrac ab=\\ln a-\\ln b,\\quad \\ln a^{r}=r\\ln a',
      },
      {
        label: 'Productos indexados',
        tex: '\\ln\\prod_{i=1}^{N}x_i=\\sum_{i=1}^{N}\\ln x_i\\qquad (x_i>0)',
      },
      {
        label: 'Signo y valores notables',
        tex: '0<p\\le1\\Rightarrow \\ln p\\le 0,\\qquad \\ln1=0,\\quad \\ln e=1',
      },
      {
        label: 'Otras bases',
        tex: '\\log_b x=\\frac{\\ln x}{\\ln b}',
        body: '$\\log_2$ mide en **bits**; $\\ln$ en **nats**. Cambiar de base multiplica por una constante.',
      },
      {
        label: 'Monotonía',
        tex: 'f>0:\\quad \\arg\\max_\\theta f(\\theta)=\\arg\\max_\\theta \\ln f(\\theta)',
        body: '$\\ln$ es estrictamente creciente: no cambia **dónde** está el máximo. Por eso se maximiza la log-verosimilitud.',
      },
    ],
    pitfalls: [
      '$\\ln(a+b)\\neq\\ln a+\\ln b$: el logaritmo separa **productos**, no sumas.',
      '$\\ln 0$ no es un número: $\\ln p\\to-\\infty$ cuando $p\\to0^+$. En código se usa un mínimo $\\varepsilon$ (`safe_log`).',
      'En muchos artículos «log» sin base significa $\\ln$; en NumPy, `np.log` es $\\ln$.',
    ],
    aif: [
      { tex: '\\ln p(o,s)=\\ln p(o\\mid s)+\\ln p(s)', text: 'Descompone la conjunta dentro de la energía libre $F$.' },
      { tex: '\\mathcal I(o)=-\\ln p(o)', text: 'Sorpresa: la cantidad que $F$ acota por arriba.' },
      { tex: '\\ln p(x_{1:N}\\mid\\theta)=\\sum_{i}\\ln p(x_i\\mid\\theta)', text: 'Log-verosimilitud de datos i.i.d. (guía G06).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  {
    id: 'ln',
    world: 'foundations',
    tex: '\\ln',
    name: 'Logaritmo natural',
    read: 'logaritmo natural de',
    meaning: 'Inversa de la exponencial: $\\ln x$ es el exponente $y$ tal que $e^y=x$. Solo está definido para $x>0$.',
    warn: 'En muchos textos «log» sin base significa $\\ln$.',
    aif: '$\\ln p(o,s)$ en $F$, sorpresa $-\\ln p(o)$, log-verosimilitudes.',
  },
  {
    id: 'logb',
    world: 'foundations',
    tex: '\\log_b',
    name: 'Logaritmo en base b',
    read: 'logaritmo en base be de',
    meaning: '$\\log_b x=\\ln x/\\ln b$. Base 2: bits; base $e$: nats.',
  },
  {
    id: 'surprisal',
    world: 'foundations',
    tex: '-\\ln p',
    name: 'Sorpresa (autoinformación)',
    read: 'menos logaritmo de pe',
    meaning: '$\\mathcal I(x)=-\\ln p(x)\\ge0$: grande cuando $x$ es improbable; se suma para eventos independientes.',
    aif: 'La energía libre $F$ es una cota superior de la sorpresa $-\\ln p(o)$.',
  },
];
