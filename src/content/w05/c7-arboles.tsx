import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { PlayingCard } from '../../art/props';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Line } from '../../engine/shapes';
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
import { Confirm, DragCue, NumberField, dec, parseProb } from '../shared/ui';
import { Formula, fracTex } from './kit';

// ============================================================================
// CASO 5.7 · «Sin reposición» — árboles, regla de la cadena y probabilidad total
// Un zapato con cartas rojas y negras; sacar dos sin devolver. Cada rama del árbol es una
// probabilidad condicional; un camino se multiplica; los caminos que llevan al mismo
// resultado se suman.
// ============================================================================

export interface TreeSpec {
  a: [string, string];
  b: [string, string];
  p1: [string, string];
  p2: [[string, string], [string, string]];
  leaf?: (i: number, j: number) => string;
}

/** Two-level probability tree laid out left to right. */
export function Tree({
  spec,
  hiPath,
  onPath,
  pathTone,
}: {
  spec: TreeSpec;
  hiPath?: (i: number, j: number) => boolean;
  onPath?: (i: number, j: number) => void;
  pathTone?: (i: number, j: number) => string | null;
}) {
  const root: [number, number] = [260, 470];
  const l1: [number, number][] = [
    [640, 300],
    [640, 640],
  ];
  const l2 = (i: number, j: number): [number, number] => [
    1060,
    (i === 0 ? 300 : 640) + (j === 0 ? -95 : 95),
  ];
  return (
    <g>
      <circle cx={root[0]} cy={root[1]} r={14} fill={C.text} />
      {[0, 1].map((i) => {
        const on1 = [0, 1].some((j) => hiPath?.(i, j));
        return (
          <g key={i}>
            <Line a={root} b={l1[i]} color={on1 ? C.amber : C.dim} width={on1 ? 5 : 3} />
            <Html
              x={(root[0] + l1[i][0]) / 2 - 20}
              y={(root[1] + l1[i][1]) / 2 + (i === 0 ? -26 : 26)}
              size={26}
              color={on1 ? C.amber : C.text}
            >
              <Tex tex={`\\displaystyle ${spec.p1[i]}`} />
            </Html>
            <circle
              cx={l1[i][0]}
              cy={l1[i][1]}
              r={30}
              fill={C.panel}
              stroke={C.line}
              strokeWidth={2}
            />
            <Html x={l1[i][0]} y={l1[i][1]} size={22} color={C.text}>
              <span className="prop-tag">{spec.a[i]}</span>
            </Html>
            {[0, 1].map((j) => {
              const p = l2(i, j);
              const on = hiPath?.(i, j) ?? false;
              const tone = pathTone?.(i, j) ?? null;
              return (
                <g
                  key={j}
                  onClick={onPath ? () => onPath(i, j) : undefined}
                  style={{ cursor: onPath ? 'pointer' : undefined }}
                >
                  {onPath && (
                    <rect
                      x={l1[i][0] + 30}
                      y={p[1] - 50}
                      width={p[0] - l1[i][0] + 330}
                      height={100}
                      fill="transparent"
                    />
                  )}
                  <Line
                    a={[l1[i][0] + 30, l1[i][1]]}
                    b={p}
                    color={tone ?? (on ? C.amber : C.dim)}
                    width={on || tone ? 5 : 3}
                  />
                  <Html
                    x={(l1[i][0] + p[0]) / 2 + 10}
                    y={(l1[i][1] + p[1]) / 2 + (j === 0 ? -24 : 24)}
                    size={24}
                    color={on ? C.amber : C.text}
                  >
                    <Tex tex={`\\displaystyle ${spec.p2[i][j]}`} />
                  </Html>
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={26}
                    fill={C.panel}
                    stroke={tone ?? (on ? C.amber : C.line)}
                    strokeWidth={2}
                  />
                  <Html x={p[0]} y={p[1]} size={20} color={C.text}>
                    <span className="prop-tag">{spec.b[j]}</span>
                  </Html>
                  {spec.leaf && (
                    <Html
                      x={p[0] + 50}
                      y={p[1]}
                      size={22}
                      anchor="left"
                      color={tone ?? (on ? C.amber : C.muted)}
                    >
                      <Tex tex={`\\displaystyle ${spec.leaf(i, j)}`} />
                    </Html>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------- demo
const SHOE = { r: 5, n: 3 };
const SPEC: TreeSpec = {
  a: ['R', 'N'],
  b: ['R', 'N'],
  p1: ['\\frac58', '\\frac38'],
  p2: [
    ['\\frac47', '\\frac37'],
    ['\\frac57', '\\frac27'],
  ],
};

function ShoeDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [deck, setDeck] = useState<('R' | 'N')[]>(() =>
    shuffle(Math.random, [...'RRRRRNNN'] as ('R' | 'N')[]),
  );
  const [drawn, setDrawn] = useState<('R' | 'N')[]>([]);
  const [path, setPath] = useState<[number, number] | null>(null);
  const draw = () => {
    if (drawn.length >= 2) {
      setDeck(shuffle(Math.random, [...'RRRRRNNN'] as ('R' | 'N')[]));
      setDrawn([]);
      return;
    }
    setDrawn([...drawn, deck[drawn.length]]);
    if (drawn.length + 1 >= 2) unlock();
  };
  if (beat === 0) {
    const left = deck.slice(drawn.length);
    const r = left.filter((c) => c === 'R').length;
    return (
      <Stage>
        <Html x={800} y={130} size={22} color={C.muted}>
          <span>
            El zapato de la mesa 7 · {SHOE.r} rojas y {SHOE.n} negras
          </span>
        </Html>
        {left.map((_, i) => (
          <PlayingCard key={i} x={420 + i * 26} y={330} w={90} rank="" suit="c" faceDown />
        ))}
        {drawn.map((c, i) => (
          <PlayingCard
            key={i}
            x={900 + i * 140}
            y={330}
            w={110}
            rank={c === 'R' ? '7' : 'Q'}
            suit={c === 'R' ? 'c' : 'p'}
          />
        ))}
        <Html x={560} y={470} size={22} color={C.text}>
          <span>
            quedan {left.length}: {r} rojas, {left.length - r} negras
          </span>
        </Html>
        <Html x={560} y={540} size={24} interactive>
          <button className="stage-btn on" onClick={draw}>
            {drawn.length >= 2 ? 'Volver a mezclar' : 'Sacar una carta'}
          </button>
        </Html>
        {drawn.length >= 1 && (
          <Formula
            x={1000}
            y={540}
            size={26}
            tex={
              drawn[0] === 'R'
                ? 'P(\\text{2.ª roja}\\mid\\text{1.ª roja})=\\tfrac47'
                : 'P(\\text{2.ª roja}\\mid\\text{1.ª negra})=\\tfrac57'
            }
          />
        )}
      </Stage>
    );
  }
  if (beat <= 3)
    return (
      <Stage>
        <Tree
          spec={{
            ...SPEC,
            leaf:
              beat >= 2
                ? (i, j) =>
                    fracTex(
                      [
                        [20, 15],
                        [15, 6],
                      ][i][j],
                      56,
                      false,
                    )
                : undefined,
          }}
          hiPath={(i, j) =>
            beat === 1
              ? answer !== null && i === 0 && j === 0
              : beat === 2
                ? path !== null && path[0] === i && path[1] === j
                : false
          }
          pathTone={
            beat === 3 && answer !== null ? (_i, j) => (j === 0 ? C.green : null) : undefined
          }
          onPath={
            beat === 2
              ? (i, j) => {
                  setPath([i, j]);
                  if (i === 0 && j === 0) unlock();
                }
              : undefined
          }
        />
        <Html x={260} y={180} size={18} color={C.muted}>
          <span>1.ª carta</span>
        </Html>
        <Html x={1060} y={130} size={18} color={C.muted}>
          <span>2.ª carta</span>
        </Html>
        {beat === 2 && path && path[0] === 0 && path[1] === 0 && (
          <Formula
            y={820}
            size={28}
            color={C.amber}
            tex="P(R_1\cap R_2)=\tfrac58\cdot\tfrac47=\tfrac{20}{56}"
          />
        )}
        {beat === 3 && answer !== null && (
          <Formula
            y={820}
            size={28}
            color={C.green}
            tex="P(R_2)=\tfrac{20}{56}+\tfrac{15}{56}=\tfrac{35}{56}=\tfrac58"
          />
        )}
      </Stage>
    );
  return (
    <Stage>
      <Tree
        spec={{
          a: ['VIP', 'Reg.'],
          b: ['M7', 'otra'],
          p1: ['0{,}2', '0{,}8'],
          p2: [
            ['0{,}7', '0{,}3'],
            ['0{,}1', '0{,}9'],
          ],
          leaf: (i, j) => ['0{,}14', '0{,}06', '0{,}08', '0{,}72'][i * 2 + j],
        }}
        pathTone={answer !== null ? (_i, j) => (j === 0 ? C.green : null) : undefined}
      />
      <Group opacity={answer !== null ? 1 : 0}>
        <Formula y={820} size={28} color={C.green} tex="P(\text{mesa 7})=0{,}14+0{,}08=0{,}22" />
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Shoe({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const red = randInt(r, 3, 7);
    const black = randInt(r, 2, 5);
    const want = pick(r, ['RR', 'NN'] as const);
    const mixed = r() < 0.5;
    const share = pick(r, [0.2, 0.25, 0.4]);
    const p7 = pick(r, [0.6, 0.7, 0.8]);
    const pOther = pick(r, [0.4, 0.45, 0.5]);
    return { red, black, want, mixed, share, p7, pOther };
  }, [seed]);
  const [val, setVal] = useState('');
  const N = data.red + data.black;

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        `El zapato tiene ${data.red} rojas y ${data.black} negras. Vera saca dos cartas sin devolverlas. ¿Probabilidad de que ambas sean ${data.want === 'RR' ? 'rojas' : 'negras'}?`,
        'P(A_1\\cap A_2)=P(A_1)\\,P(A_2\\mid A_1)',
      );
      api.hints([
        'Sigue un solo camino del árbol y multiplica sus ramas.',
        'En la segunda rama queda una carta menos de ese color y una menos en total.',
      ]);
    } else if (round === 1) {
      api.prompt(
        data.mixed
          ? `Mismo zapato. ¿Probabilidad de sacar una de cada color (en cualquier orden)?`
          : `Mismo zapato. ¿Probabilidad de que la **segunda** carta sea roja, sin saber la primera?`,
        'P(B)=\\sum_i P(A_i)\\,P(B\\mid A_i)',
      );
      api.hints([
        'Hay dos caminos que llevan al resultado pedido.',
        'Calcula cada camino multiplicando y después suma los dos.',
      ]);
    } else {
      api.prompt(
        `El ${dec(data.share * 100)} % de las manos se juega en la mesa 7. Ahí gana el jugador con probabilidad ${dec(data.p7)}; en las demás mesas, con ${dec(data.pOther)}. ¿Qué fracción de todas las manos gana el jugador?`,
        'P(G)=P(M_7)P(G\\mid M_7)+P(M_7^c)P(G\\mid M_7^c)',
      );
      api.hints([
        'Dibuja el árbol: primero la mesa, después el resultado.',
        'Suma los dos caminos que terminan en «gana el jugador».',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    const { red, black } = data;
    if (round === 0) {
      const k = data.want === 'RR' ? red : black;
      const t = (k / N) * ((k - 1) / (N - 1));
      if (Math.abs(v - t) < 1e-3)
        return api.result(
          true,
          `$\\frac{${k}}{${N}}\\cdot\\frac{${k - 1}}{${N - 1}}=${fracTex(k * (k - 1), N * (N - 1))}$.`,
        );
      if (Math.abs(v - (k / N) ** 2) < 1e-3)
        return api.result(
          false,
          `Eso sería devolviendo la carta. Sin reposición, en la segunda quedan ${k - 1} de ${N - 1}.`,
        );
      return api.result(
        false,
        `Primera: $\\frac{${k}}{${N}}$. Segunda, sabiendo la primera: $\\frac{${k - 1}}{${N - 1}}$. Multiplica.`,
      );
    }
    if (round === 1) {
      const t = data.mixed ? (2 * red * black) / (N * (N - 1)) : red / N;
      if (Math.abs(v - t) < 1e-3)
        return api.result(
          true,
          data.mixed
            ? `$\\frac{${red}}{${N}}\\cdot\\frac{${black}}{${N - 1}}+\\frac{${black}}{${N}}\\cdot\\frac{${red}}{${N - 1}}=${fracTex(2 * red * black, N * (N - 1))}$.`
            : `$\\frac{${red}}{${N}}\\cdot\\frac{${red - 1}}{${N - 1}}+\\frac{${black}}{${N}}\\cdot\\frac{${red}}{${N - 1}}=\\frac{${red}}{${N}}$: lo mismo que la primera.`,
        );
      if (data.mixed && Math.abs(v - (red * black) / (N * (N - 1))) < 1e-3)
        return api.result(
          false,
          'Ese es un solo orden (roja y luego negra). Falta el camino negra y luego roja.',
        );
      return api.result(
        false,
        data.mixed
          ? 'Suma los dos caminos: roja-negra y negra-roja.'
          : 'Suma los dos caminos que terminan en roja: roja-roja y negra-roja.',
      );
    }
    const t = data.share * data.p7 + (1 - data.share) * data.pOther;
    if (Math.abs(v - t) < 0.002)
      return api.result(
        true,
        `$${dec(data.share)}\\cdot${dec(data.p7)}+${dec(1 - data.share)}\\cdot${dec(data.pOther)}=${dec(t, 3)}$`.replace(
          /(\d),(\d)/g,
          '$1{,}$2',
        ),
      );
    if (Math.abs(v - (data.p7 + data.pOther) / 2) < 0.002)
      return api.result(
        false,
        'Promediaste las dos mesas por igual, pero la mesa 7 tiene menos manos. Pondera por la fracción de manos.',
      );
    return api.result(
      false,
      `Camino mesa 7: $${dec(data.share)}\\cdot${dec(data.p7)}$. Camino otras: $${dec(1 - data.share)}\\cdot${dec(data.pOther)}$. Súmalos.`.replace(
        /(\d),(\d)/g,
        '$1{,}$2',
      ),
    );
  };

  const spec: TreeSpec =
    round < 2
      ? {
          a: ['R', 'N'],
          b: ['R', 'N'],
          p1: [`\\frac{${data.red}}{${N}}`, `\\frac{${data.black}}{${N}}`],
          p2: [
            ['?', '?'],
            ['?', '?'],
          ],
        }
      : {
          a: ['M7', 'otra'],
          b: ['G', 'P'],
          p1: ['?', '?'],
          p2: [
            ['?', '?'],
            ['?', '?'],
          ],
        };
  return (
    <Stage>
      <Tree spec={spec} />
      <NumberField
        x={260}
        y={820}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="P ="
        width={5}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
// ---------------------------------------------------------------------------
// Clase · urna con 3 rojas y 2 azules; dos extracciones sin devolver, en un árbol.
// ---------------------------------------------------------------------------
const URN = { x: 150, y: 250, w: 230, h: 300 };
const BALLS: [string, number, number][] = [
  [C.magenta, 210, 330],
  [C.magenta, 290, 330],
  [C.magenta, 250, 410],
  [C.cyan, 210, 490],
  [C.cyan, 290, 490],
];
const OUT = { x: 265, y: 680 };
type Node = { x: number; y: number };
const ROOT: Node = { x: 470, y: 450 };
const L1 = { R: { x: 700, y: 300 }, A: { x: 700, y: 600 } };
const L2 = {
  RR: { x: 960, y: 220 },
  RA: { x: 960, y: 380 },
  AR: { x: 960, y: 520 },
  AA: { x: 960, y: 680 },
};

function Branch({
  a,
  b,
  label,
  color,
  on,
}: {
  a: Node;
  b: Node;
  label: string;
  color: string;
  on?: boolean;
}) {
  return (
    <>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={on ? C.green : color}
        strokeWidth={on ? 6 : 3}
        strokeOpacity={on ? 1 : 0.8}
      />
      <Cap
        x={(a.x + b.x) / 2}
        y={(a.y + b.y) / 2 - 34}
        size={28}
        tex={label}
        color={on ? C.green : color}
      />
    </>
  );
}

function TreeLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [pos, setPos] = useState<[number, number]>([BALLS[2][1], BALLS[2][2]]);
  const [drawn, setDrawn] = useState(false);
  const { beat } = beats;
  const out = drawn || beat >= 2;
  const drag = useSvgDrag(svg, (px, py, phase) => {
    setPos([px, py]);
    if (phase === 'end') {
      if (py > URN.y + URN.h + 40) {
        setPos([OUT.x, OUT.y]);
        setDrawn(true);
        unlock();
      } else setPos([BALLS[2][1], BALLS[2][2]]);
    }
  });
  const ball = out ? [OUT.x, OUT.y] : pos;
  const path = (p: string) =>
    (beat === 2 && p === 'RR') ||
    (beat === 3 && answer !== null && (p === 'RA' || p === 'AR')) ||
    (beat === 4 && (p === 'RR' || p === 'AR'));
  const showL2R = out || beat >= 2;
  const showL2A = beat >= 3;
  return (
    <Stage ref={svg}>
      <rect
        x={URN.x}
        y={URN.y}
        width={URN.w}
        height={URN.h}
        rx={30}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      <Cap x={URN.x + URN.w / 2} y={URN.y - 30} size={21} color={C.muted}>
        Urna
      </Cap>
      {BALLS.map(([col, x, y], i) =>
        i === 2 ? null : <circle key={i} cx={x} cy={y} r={30} fill={col} fillOpacity={0.85} />,
      )}
      <g
        onPointerDown={beat === 1 && !out ? drag : undefined}
        style={{ cursor: beat === 1 && !out ? 'grab' : undefined }}
      >
        <circle
          cx={ball[0]}
          cy={ball[1]}
          r={30}
          fill={C.magenta}
          fillOpacity={0.95}
          stroke={C.text}
          strokeWidth={out ? 0 : 2}
        />
      </g>
      {beat === 1 && !out && <DragCue x={ball[0]} y={ball[1]} axis="y" color={C.magenta} r={30} />}
      {out && (
        <Cap x={OUT.x} y={OUT.y + 55} size={19} color={C.muted}>
          primera: roja
        </Cap>
      )}
      <circle cx={ROOT.x} cy={ROOT.y} r={10} fill={C.text} />
      <Branch a={ROOT} b={L1.R} label="\tfrac35" color={C.magenta} on={path('RR') || path('RA')} />
      <Branch a={ROOT} b={L1.A} label="\tfrac25" color={C.cyan} on={path('AR') || path('AA')} />
      <Cap x={L1.R.x + 28} y={L1.R.y} size={24} color={C.magenta}>
        R
      </Cap>
      <Cap x={L1.A.x + 28} y={L1.A.y} size={24} color={C.cyan}>
        A
      </Cap>
      {showL2R && (
        <>
          <Branch a={L1.R} b={L2.RR} label="\tfrac24" color={C.magenta} on={path('RR')} />
          <Branch a={L1.R} b={L2.RA} label="\tfrac24" color={C.cyan} on={path('RA')} />
          <Cap x={L2.RR.x + 40} y={L2.RR.y} size={22} color={C.magenta}>
            RR
          </Cap>
          <Cap x={L2.RA.x + 40} y={L2.RA.y} size={22} color={C.cyan}>
            RA
          </Cap>
        </>
      )}
      {showL2A && (
        <>
          <Branch a={L1.A} b={L2.AR} label="\tfrac34" color={C.magenta} on={path('AR')} />
          <Branch a={L1.A} b={L2.AA} label="\tfrac14" color={C.cyan} on={path('AA')} />
          <Cap x={L2.AR.x + 40} y={L2.AR.y} size={22} color={C.magenta}>
            AR
          </Cap>
          <Cap x={L2.AA.x + 40} y={L2.AA.y} size={22} color={C.cyan}>
            AA
          </Cap>
        </>
      )}
      {beat === 0 && <Cap x={1290} y={300} tex="\tfrac35+\tfrac25=1" color={C.text} />}
      {beat === 1 && out && (
        <Cap x={1290} y={300} tex="\text{quedan 2 rojas y 2 azules}" color={C.magenta} />
      )}
      {beat === 2 && (
        <Cap
          x={1290}
          y={300}
          tex="\tfrac35\cdot\tfrac24=\tfrac{6}{20}=\tfrac{3}{10}"
          color={C.green}
        />
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1290} y={300} tex="\tfrac{6}{20}+\tfrac{6}{20}=\tfrac35" color={C.green} />
      )}
      {beat === 4 && (
        <>
          <Cap x={1290} y={300} tex="P(R_2)=\tfrac{6}{20}+\tfrac{6}{20}=\tfrac35" color={C.green} />
          <Cap
            x={1290}
            y={400}
            tex="\text{con reposición: }\tfrac35\cdot\tfrac35=\tfrac{9}{25}"
            color={C.muted}
          />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Árboles y probabilidad total',
  Scene: TreeLesson,
  beats: [
    {
      say: 'En la urna hay 3 rojas y 2 azules. La primera extracción abre dos ramas, con sus probabilidades.',
      board: {
        label: 'Primer nivel',
        tex: '\\p{1}{P(R_1)=\\tfrac35},\\quad\\p{2}{P(A_1)=\\tfrac25}',
        parts: ['roja en primera extracción', 'azul en primera extracción'],
      },
    },
    {
      say: 'Sin devolver, lo que sale cambia la urna. Saca una roja y mira cómo cambian las ramas siguientes.',
      gate: 'Arrastra la bola roja del centro fuera de la urna.',
      board: {
        label: 'Segundo nivel',
        tex: '\\p{1}{P(R_2\\mid R_1)}=\\p{2}{\\tfrac24}',
        parts: ['otra roja tras roja', 'rojas entre las restantes'],
      },
    },
    {
      say: 'Para un camino completo se multiplican las probabilidades de sus ramas.',
      board: {
        label: 'Un camino',
        tex: '\\p{1}{P(R_1\\cap R_2)}=\\p{2}{\\tfrac35\\cdot\\tfrac24}=\\p{3}{\\tfrac{3}{10}}',
        parts: ['dos rojas seguidas', 'producto de las ramas', 'probabilidad de dos rojas'],
      },
    },
    {
      say: 'Ahora completa el árbol. Dos caminos terminan con colores distintos.',
      ask: {
        prompt: '¿Probabilidad de sacar dos colores distintos?',
        options: ['3/5', '3/10', '2/5'],
        answer: 0,
        explain: 'RA vale 3/5·2/4 = 6/20 y AR vale 2/5·3/4 = 6/20. Juntos, 12/20 = 3/5.',
      },
      board: {
        label: 'Varios caminos',
        tex: '\\p{1}{P(RA)+P(AR)}=\\p{2}{\\tfrac{12}{20}}',
        parts: ['caminos de distinto color', 'probabilidad de dos colores'],
      },
    },
    {
      say: 'Para la segunda roja se suman los caminos que terminan en roja. Es la **probabilidad total**.',
      board: {
        label: 'Probabilidad total',
        tex: '\\p{1}{P(B)}=\\p{2}{\\sum_i P(A_i)\\,P(B\\mid A_i)}',
        parts: ['probabilidad del destino', 'suma de todos los caminos'],
      },
    },
  ],
};

export const level: LevelSpec = {
  id: 'w5-c7',
  world: 'probability',
  code: '5.7',
  title: 'Sin reposición',
  subtitle: 'Árboles y probabilidad total',
  glyph: '\\textstyle\\prod',
  kind: 'level',
  guide: 'iris',
  teaser:
    'En la mesa 7 las cartas salen de un zapato y no vuelven. Cada carta que sale cambia lo que queda, y eso se piensa mejor con un árbol.',
  learn:
    'Extracciones sin reposición, árboles de probabilidad con ramas condicionales, regla de la cadena (multiplicar por un camino) y probabilidad total (sumar caminos).',
  glyphs: ['chain', 'total'],
  pitfalls: [
    'Sin reposición, la segunda rama tiene una carta menos.',
    'Un camino se multiplica; caminos distintos al mismo resultado se suman.',
    '«Una de cada color» tiene dos órdenes.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'nar',
          text: 'Casino Aurora, veinte para las diez. El zapato raspó el paño al deslizarse, y el Barón lo siguió con los ojos hasta que se detuvo.',
        },
        {
          who: 'vera',
          text: 'El Barón sabe cuántas rojas quedan. Son pocas cartas y ninguna vuelve al zapato, y yo tengo que repartir sin que note que estoy contando.',
        },
        { who: 'iris', text: 'Deja que contemos nosotros. ¿Qué queda ahora?' },
        {
          who: 'vera',
          text: 'Cinco rojas y tres negras. Puedo mostrarles dos cartas; después él vuelve a mirar mis manos.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El zapato',
      Scene: ShoeDemo,
      beats: [
        {
          say: 'Un zapato con 5 cartas rojas y 3 negras. Las cartas que salen no vuelven.',
          gate: 'Saca dos cartas.',
          note: {
            label: 'Sin reposición',
            body: 'Después de una roja quedan 4 rojas de 7. Lo que sale cambia lo que queda.',
          },
        },
        {
          say: 'El árbol ordena todas las posibilidades: primera carta, después segunda.',
          ask: {
            prompt:
              'Si la primera fue roja, ¿qué probabilidad hay de que la segunda también lo sea?',
            options: ['4/7', '5/8', '4/8'],
            answer: 0,
            explain:
              'Quedan 7 cartas y 4 son rojas. Las ramas del segundo nivel son probabilidades condicionales.',
          },
          note: {
            label: 'Árbol',
            body: 'Cada rama lleva la probabilidad de ese paso **sabiendo** los anteriores.',
          },
        },
        {
          say: 'Para que salgan dos rojas hay que recorrer un camino completo.',
          gate: 'Toca el camino roja–roja.',
          note: {
            label: 'Regla de la cadena',
            tex: 'P(R_1\\cap R_2)=P(R_1)\\,P(R_2\\mid R_1)',
            body: '$\\tfrac58\\cdot\\tfrac47=\\tfrac{20}{56}$. Se multiplica a lo largo del camino.',
          },
        },
        {
          say: 'Ahora una pregunta sin mirar la primera carta.',
          ask: {
            prompt: '¿Qué probabilidad hay de que la segunda carta sea roja?',
            options: ['5/8', '4/7', '1/2'],
            answer: 0,
            explain:
              'Dos caminos terminan en roja: $\\tfrac{20}{56}+\\tfrac{15}{56}=\\tfrac{35}{56}=\\tfrac58$. Sin información, la segunda carta es como la primera.',
          },
          note: {
            label: 'Probabilidad total',
            tex: 'P(B)=\\sum_i P(A_i)\\,P(B\\mid A_i)',
            body: 'Se suman todos los caminos que llevan a $B$.',
          },
        },
        {
          say: 'Los árboles sirven para cualquier cosa por etapas. El 20 % de los jugadores es VIP; el 70 % de ellos pide la mesa 7, y solo el 10 % de los regulares.',
          ask: {
            prompt: '¿Qué fracción de todos los jugadores juega en la mesa 7?',
            options: ['0,22', '0,80', '0,14'],
            answer: 0,
            explain:
              'VIP y mesa 7: $0{,}2\\cdot0{,}7=0{,}14$. Regular y mesa 7: $0{,}8\\cdot0{,}1=0{,}08$. Total: 0,22.',
          },
          note: { label: 'Árbol de clientes', tex: '0{,}2\\cdot0{,}7+0{,}8\\cdot0{,}1=0{,}22' },
        },
      ],
    },
    { kind: 'challenge', title: 'El zapato', Comp: Shoe, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'teo',
          text: 'Dos rojas seguidas tienen 20 posibilidades de 56, y que la segunda sea roja, sin mirar la primera, sigue en 5/8. El registro de clientes pone al 22 % en la mesa 7.',
        },
        { who: 'iris', text: 'Con eso sabemos qué esperar. ¿Qué más viste en las cámaras?' },
        {
          who: 'teo',
          text: 'El Barón cambia el dado de la mesa 7 cuando se sienta un VIP, y tapa el cambio con la mano.',
        },
        { who: 'vera', text: 'Mientras está pendiente del dado, deja de mirarme a mí.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'chain',
    world: 'probability',
    tex: 'P(A\\cap B)=P(A)\\,P(B\\mid A)',
    name: 'Regla de la cadena',
    read: 'regla de la cadena',
    meaning: 'La probabilidad de un camino del árbol es el producto de sus ramas.',
  },
  {
    id: 'total',
    world: 'probability',
    tex: 'P(B)=\\sum_i P(A_i)P(B\\mid A_i)',
    name: 'Probabilidad total',
    read: 'probabilidad total',
    meaning:
      'Si los $A_i$ cubren todos los casos sin solaparse, $P(B)$ es la suma de los caminos que llegan a $B$.',
  },
];

export { lesson };
