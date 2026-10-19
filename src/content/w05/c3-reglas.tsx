import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { PlayingCard } from '../../art/props';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseProb } from '../shared/ui';
import {
  ALL,
  type Card,
  type Cell,
  DECK,
  DiceGrid,
  Formula,
  RANKS,
  fracTex,
  isFace,
  isRed,
  keyOf,
} from './kit';

// ============================================================================
// CASO 5.3 · «Reglas de la casa» — reglas de la probabilidad
// Probabilidad como área (0 ≤ P ≤ 1, P(Ω)=1); complemento; suma para eventos disjuntos;
// inclusión–exclusión cuando se solapan; lo mismo con una baraja.
// ============================================================================

const sumOf = (c: Cell) => c[0] + c[1];
const six = (c: Cell) => c[0] === 6 || c[1] === 6;
const dbl = (c: Cell) => c[0] === c[1];

/** The 52 cards laid out by suit (rows) and rank (columns). */
function DeckGrid({
  x = 250,
  y = 170,
  tone,
}: {
  x?: number;
  y?: number;
  tone: (c: Card) => string | null;
}) {
  return (
    <g>
      {DECK.map((c) => {
        const i = ['c', 'o', 'p', 't'].indexOf(c.s);
        const t = tone(c);
        return (
          <PlayingCard
            key={`${c.s}${c.r}`}
            x={x + c.r * 84}
            y={y + i * 118}
            w={66}
            rank={RANKS[c.r]}
            suit={c.s}
            ring={t ?? undefined}
            opacity={t ? 1 : 0.7}
          />
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------- demo
function RulesDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [twice, setTwice] = useState(false);
  const union711 = (c: Cell) => sumOf(c) === 7 || sumOf(c) === 11;
  useEffect(() => {
    if (beat !== 2) return;
    const want = ALL.filter(union711).map(keyOf);
    if (want.every((k) => sel.has(k)) && sel.size === want.length) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, beat]);
  const paint = (k: number, on: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      if (on) n.add(k);
      else n.delete(k);
      return n;
    });

  if (beat === 0)
    return (
      <Stage>
        <DiceGrid x={420} y={150} cell={110} labels="sum" />
        <rect
          x={420}
          y={150}
          width={660}
          height={660}
          fill="none"
          stroke={C.amber}
          strokeWidth={4}
          opacity={at(0)}
        />
        <Group opacity={at(0)}>
          <Formula x={1290} y={300} size={26} color={C.amber} tex="\text{área total}=1" />
          <Formula x={1290} y={400} size={26} tex="\text{cada casilla}=\tfrac{1}{36}" />
        </Group>
      </Stage>
    );
  if (beat === 1)
    return (
      <Stage>
        <DiceGrid
          x={420}
          y={150}
          cell={110}
          labels="sum"
          tone={(c) => (sumOf(c) === 7 ? C.red : answer !== null ? C.green : null)}
        />
        {answer !== null && (
          <Formula x={1290} y={360} size={26} tex={`1-\\tfrac{6}{36}=\\tfrac{30}{36}`} />
        )}
      </Stage>
    );
  if (beat === 2)
    return (
      <Stage>
        <DiceGrid x={420} y={150} cell={110} labels="sum" sel={sel} onPaint={paint} />
        <Formula x={1290} y={360} size={26} color={C.amber} tex={`|A|=${sel.size}`} />
      </Stage>
    );
  if (beat === 3)
    return (
      <Stage>
        <DiceGrid
          x={420}
          y={150}
          cell={110}
          labels="pair"
          tone={(c) =>
            six(c) && dbl(c)
              ? twice
                ? C.magenta
                : C.violet
              : six(c)
                ? C.amber
                : dbl(c)
                  ? C.cyan
                  : null
          }
          onPaint={(k) => {
            if (k === 66) {
              setTwice(true);
              unlock();
            }
          }}
        />
        <Formula x={1290} y={260} size={24} color={C.amber} tex="|\text{algún }6|=11" />
        <Formula x={1290} y={330} size={24} color={C.cyan} tex="|\text{dobles}|=6" />
        {twice && <Formula x={1290} y={440} size={26} color={C.magenta} tex="11+6-1=16" />}
      </Stage>
    );
  return (
    <Stage>
      <DeckGrid
        tone={(c) =>
          answer === null
            ? c.s === 'c'
              ? C.red
              : isFace(c)
                ? C.amber
                : null
            : c.s === 'c' && isFace(c)
              ? C.magenta
              : c.s === 'c'
                ? C.red
                : isFace(c)
                  ? C.amber
                  : null
        }
      />
      {answer !== null && (
        <Formula
          y={720}
          size={28}
          tex="\tfrac{13}{52}+\tfrac{12}{52}-\tfrac{3}{52}=\tfrac{22}{52}"
        />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
interface Pair<T> {
  a: string;
  b: string;
  fa: (x: T) => boolean;
  fb: (x: T) => boolean;
}
const DICE_PAIRS: Pair<Cell>[] = [
  { a: 'suma mayor que 8', b: 'dobles', fa: (c) => sumOf(c) > 8, fb: dbl },
  { a: 'algún 1', b: 'suma 6', fa: (c) => c[0] === 1 || c[1] === 1, fb: (c) => sumOf(c) === 6 },
  { a: 'rojo mayor que 4', b: 'blanco mayor que 4', fa: (c) => c[0] > 4, fb: (c) => c[1] > 4 },
  { a: 'suma par', b: 'algún 6', fa: (c) => sumOf(c) % 2 === 0, fb: six },
  { a: 'suma 7', b: 'algún 5', fa: (c) => sumOf(c) === 7, fb: (c) => c[0] === 5 || c[1] === 5 },
];
const CARD_PAIRS: Pair<Card>[] = [
  { a: 'roja', b: 'as', fa: isRed, fb: (c) => c.r === 0 },
  {
    a: 'trébol',
    b: 'número par',
    fa: (c) => c.s === 't',
    fb: (c) => c.r >= 1 && c.r <= 9 && (c.r + 1) % 2 === 0,
  },
  { a: 'negra', b: 'rey', fa: (c) => !isRed(c), fb: (c) => c.r === 12 },
  { a: 'figura', b: 'as', fa: isFace, fb: (c) => c.r === 0 },
  { a: 'diamante', b: 'figura', fa: (c) => c.s === 'o', fb: isFace },
];

function Payouts({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const dp = pick(r, DICE_PAIRS);
    const cp = pick(r, CARD_PAIRS);
    const pa = pick(r, [0.3, 0.4, 0.5, 0.6]);
    const pb = pick(r, [0.2, 0.3, 0.4]);
    const pab = pick(
      r,
      [0.1, 0.15, 0.2].filter((v) => v <= Math.min(pa, pb)),
    );
    const neither = r() < 0.5;
    return { dp, cp, pa, pb, pab, neither };
  }, [seed]);
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        `La casa paga si sale **${data.dp.a}** o **${data.dp.b}**. ¿Cuál es la probabilidad de cobrar? Escríbela como fracción.`,
        'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)',
      );
      api.hints([
        'Cuenta las casillas de cada color. Las moradas están en los dos eventos.',
        'Si sumas los dos eventos, las casillas moradas quedan contadas dos veces.',
      ]);
    } else if (round === 1) {
      api.prompt(
        `En la mesa de cartas pagan si sacas una carta **${data.cp.a}** o **${data.cp.b}**. ¿Probabilidad de cobrar?`,
        'P(A\\cup B)',
      );
      api.hints([
        'Cuenta las cartas marcadas: las que tienen borde en cualquiera de los dos colores.',
        'Revisa si hay cartas que cumplen las dos condiciones.',
      ]);
    } else {
      api.prompt(
        `Los registros dicen: el ${dec(data.pa * 100)} % de los jugadores apuesta al rojo, el ${dec(data.pb * 100)} % apuesta a pares y el ${dec(data.pab * 100)} % hace ambas cosas. ¿Qué fracción ${data.neither ? 'no hace ninguna de las dos' : 'hace al menos una de las dos'}?`,
        data.neither ? 'P(A^c\\cap B^c)=1-P(A\\cup B)' : 'P(A\\cup B)',
      );
      api.hints([
        'Suma las dos y resta lo que contaste dos veces.',
        data.neither
          ? 'Lo que no está en la unión es su complemento: $1-P(A\\cup B)$.'
          : 'Puedes responder en decimales, por ejemplo 0,55.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    if (round === 0) {
      const { fa, fb } = data.dp;
      const nA = ALL.filter(fa).length;
      const nB = ALL.filter(fb).length;
      const nAB = ALL.filter((c) => fa(c) && fb(c)).length;
      const t = (nA + nB - nAB) / 36;
      if (Math.abs(v - t) < 1e-4)
        return api.result(
          true,
          `$\\frac{${nA}}{36}+\\frac{${nB}}{36}-\\frac{${nAB}}{36}=${fracTex(nA + nB - nAB, 36)}$.`,
        );
      if (nAB > 0 && Math.abs(v - (nA + nB) / 36) < 1e-4)
        return api.result(
          false,
          `Sumaste ${nA} + ${nB}, pero ${nAB} casilla${nAB > 1 ? 's están' : ' está'} en los dos eventos y quedó contada dos veces.`,
        );
      return api.result(
        false,
        `«${data.dp.a}» tiene ${nA} casillas y «${data.dp.b}», ${nB}. Revisa cuántas comparten.`,
      );
    }
    if (round === 1) {
      const { fa, fb } = data.cp;
      const nA = DECK.filter(fa).length;
      const nB = DECK.filter(fb).length;
      const nAB = DECK.filter((c) => fa(c) && fb(c)).length;
      const t = (nA + nB - nAB) / 52;
      if (Math.abs(v - t) < 1e-4)
        return api.result(
          true,
          `$\\frac{${nA}}{52}+\\frac{${nB}}{52}-\\frac{${nAB}}{52}=${fracTex(nA + nB - nAB, 52)}$.`,
        );
      if (nAB > 0 && Math.abs(v - (nA + nB) / 52) < 1e-4)
        return api.result(
          false,
          `${nAB} carta${nAB > 1 ? 's son' : ' es'} «${data.cp.a}» y «${data.cp.b}» a la vez: las contaste dos veces.`,
        );
      return api.result(
        false,
        `Hay ${nA} cartas «${data.cp.a}» y ${nB} «${data.cp.b}»; ${nAB} cumplen ambas.`,
      );
    }
    const u = data.pa + data.pb - data.pab;
    const t = data.neither ? 1 - u : u;
    if (Math.abs(v - t) < 0.005)
      return api.result(
        true,
        `$P(A\\cup B)=${dec(data.pa, 2)}+${dec(data.pb, 2)}-${dec(data.pab, 2)}=${dec(u, 2)}$${data.neither ? `; ninguna: $1-${dec(u, 2)}=${dec(1 - u, 2)}$` : ''}.`,
      );
    if (Math.abs(v - (data.neither ? 1 - data.pa - data.pb : data.pa + data.pb)) < 0.005)
      return api.result(
        false,
        `Los que hacen ambas cosas (${dec(data.pab * 100)} %) quedaron contados dos veces.`,
      );
    if (data.neither && Math.abs(v - u) < 0.005)
      return api.result(
        false,
        `${dec(u, 2)} es la fracción que hace al menos una. Se pide lo contrario.`,
      );
    return api.result(
      false,
      `Al menos una: $${dec(data.pa, 2)}+${dec(data.pb, 2)}-${dec(data.pab, 2)}$.${data.neither ? ' Y ninguna es el complemento.' : ''}`,
    );
  };

  if (round === 0) {
    const { fa, fb } = data.dp;
    return (
      <Stage>
        <DiceGrid
          x={380}
          y={150}
          cell={100}
          labels="pair"
          tone={(c) => (fa(c) && fb(c) ? C.violet : fa(c) ? C.amber : fb(c) ? C.cyan : null)}
        />
        <Html x={1060} y={240} size={22} anchor="left" color={C.amber}>
          <span>■ {data.dp.a}</span>
        </Html>
        <Html x={1060} y={280} size={22} anchor="left" color={C.cyan}>
          <span>■ {data.dp.b}</span>
        </Html>
        <Html x={1060} y={320} size={22} anchor="left" color={C.violet}>
          <span>■ las dos</span>
        </Html>
        <NumberField
          x={1060}
          y={480}
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
  if (round === 1) {
    const { fa, fb } = data.cp;
    return (
      <Stage>
        <DeckGrid
          tone={(c) => (fa(c) && fb(c) ? C.violet : fa(c) ? C.amber : fb(c) ? C.cyan : null)}
        />
        <Html x={260} y={680} size={22} anchor="left" color={C.amber}>
          <span>■ {data.cp.a}</span>
        </Html>
        <Html x={520} y={680} size={22} anchor="left" color={C.cyan}>
          <span>■ {data.cp.b}</span>
        </Html>
        <Html x={780} y={680} size={22} anchor="left" color={C.violet}>
          <span>■ las dos</span>
        </Html>
        <NumberField
          x={260}
          y={770}
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
  // round 2: Venn with areas
  return (
    <Stage>
      <rect x={300} y={150} width={1000} height={520} rx={10} fill="#120f22" stroke={C.line} />
      <Html x={320} y={180} size={20} anchor="left" color={C.muted}>
        <Tex tex="\Omega" />
      </Html>
      <circle
        cx={680}
        cy={410}
        r={200}
        fill={C.red}
        fillOpacity={0.18}
        stroke={C.red}
        strokeWidth={3}
      />
      <circle
        cx={920}
        cy={410}
        r={200}
        fill={C.cyan}
        fillOpacity={0.18}
        stroke={C.cyan}
        strokeWidth={3}
      />
      <Html x={600} y={410} size={24} color={C.red}>
        <span>rojo</span>
      </Html>
      <Html x={1000} y={410} size={24} color={C.cyan}>
        <span>pares</span>
      </Html>
      <Html x={800} y={410} size={20} color={C.text}>
        <span className="prop-tag">ambas</span>
      </Html>
      <NumberField
        x={500}
        y={760}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="Fracción:"
        width={5}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
// ---------------------------------------------------------------------------
// Clase · complemento y unión con un dado: A = par, B = mayor que 3.
// El círculo B se arrastra sobre A; el 4 y el 6 dejan de contarse dos veces.
// ---------------------------------------------------------------------------
const VENN = { ax: 430, y: 410, r: 175, target: 640, start: 830 };
/** where each face sits relative to its circle, so the copies of 4 and 6 meet when B lands */
const A_FACES: [number, number, number][] = [
  [2, 330, 410],
  [4, 530, 355],
  [6, 530, 465],
];
const B_FACES: [number, number, number][] = [
  [4, -110, 355],
  [6, -110, 465],
  [5, 50, 410],
];
const OUTSIDE: [number, number, number][] = [
  [1, 250, 650],
  [3, 360, 650],
];

function Face({
  n,
  x,
  y,
  color,
  opacity = 1,
}: {
  n: number;
  x: number;
  y: number;
  color: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect
        x={x - 30}
        y={y - 30}
        width={60}
        height={60}
        rx={10}
        fill={C.panel}
        stroke={color}
        strokeWidth={3}
      />
      <Cap x={x} y={y} size={26} color={color}>
        {n}
      </Cap>
    </g>
  );
}

function RulesLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [bx, setBx] = useState(VENN.start);
  const { beat } = beats;
  const landed = beat >= 2 || Math.abs(bx - VENN.target) < 1;
  const cx = beat >= 2 ? VENN.target : bx;
  const drag = useSvgDrag(svg, (px) => {
    const x = Math.max(VENN.target - 40, Math.min(VENN.start + 60, px));
    if (Math.abs(x - VENN.target) < 22) {
      setBx(VENN.target);
      unlock();
    } else setBx(x);
  });
  const hot = (n: number) => {
    if (beat === 0) return n === 6 ? C.magenta : C.text;
    if (beat === 3) return n === 1 || n === 6 ? C.green : C.muted;
    if (beat === 4 && answer !== null) return n % 2 === 0 || n === 1 ? C.green : C.muted;
    if (beat === 2 && answer !== null) return [2, 4, 5, 6].includes(n) ? C.green : C.muted;
    return C.text;
  };
  const showSets = beat >= 1;
  return (
    <Stage ref={svg}>
      <rect
        x={150}
        y={170}
        width={860}
        height={560}
        rx={18}
        fill="none"
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={190} y={200} size={22} color={C.muted} tex="\Omega" />
      {showSets && (
        <>
          <circle
            cx={VENN.ax}
            cy={VENN.y}
            r={VENN.r}
            fill={C.amber}
            fillOpacity={0.12}
            stroke={C.amber}
            strokeWidth={3}
          />
          <circle
            cx={cx}
            cy={VENN.y}
            r={VENN.r}
            fill={C.magenta}
            fillOpacity={0.12}
            stroke={C.magenta}
            strokeWidth={3}
          />
          <Cap x={VENN.ax - 70} y={VENN.y - VENN.r - 32} size={26} color={C.amber}>
            A: par
          </Cap>
          <Cap x={cx + 70} y={VENN.y - VENN.r - 32} size={26} color={C.magenta}>
            B: mayor que 3
          </Cap>
        </>
      )}
      {A_FACES.map(([n, x, y]) => (
        <Face key={`a${n}`} n={n} x={x} y={y} color={hot(n)} />
      ))}
      {showSets &&
        B_FACES.map(([n, dx, y]) => {
          const shared = n !== 5;
          // the copies of 4 and 6 fade into A's once B lands: they were being counted twice
          if (shared && landed) return null;
          return (
            <Face key={`b${n}`} n={n} x={cx + dx} y={y} color={hot(n)} opacity={shared ? 0.8 : 1} />
          );
        })}
      {!showSets && <Face n={5} x={VENN.target + 50} y={VENN.y} color={hot(5)} />}
      {OUTSIDE.map(([n, x, y]) => (
        <Face key={n} n={n} x={x} y={y} color={hot(n)} />
      ))}
      {beat === 1 && (
        <Knob
          x={cx}
          y={VENN.y + VENN.r}
          onPointerDown={drag}
          axis="x"
          color={C.magenta}
          label="B"
        />
      )}
      {beat === 0 && (
        <Cap x={1250} y={300} tex="P(\text{no }6)=1-\tfrac16=\tfrac56" color={C.magenta} />
      )}
      {beat === 1 && (
        <>
          <Cap x={1250} y={280} tex="|A|+|B|=3+3=6" color={C.text} />
          {landed && <Cap x={1250} y={370} tex="|A\cup B|=4" color={C.green} />}
          {landed && <Cap x={1250} y={460} tex="|A\cap B|=2" color={C.green} />}
        </>
      )}
      {beat === 2 && answer !== null && (
        <Cap x={1250} y={300} tex="\tfrac36+\tfrac36-\tfrac26=\tfrac46" color={C.green} />
      )}
      {beat === 3 && <Cap x={1250} y={300} tex="\tfrac16+\tfrac16=\tfrac13" color={C.green} />}
      {beat === 4 && answer !== null && (
        <Cap x={1250} y={300} tex="\tfrac36+\tfrac16=\tfrac23" color={C.green} />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Reglas de la probabilidad',
  intro: {
    question: '¿Cómo se combinan probabilidades con «o» y con «no» sin contar dos veces?',
    text: 'La probabilidad de que algo no ocurra es uno menos la de que ocurra. Para un «o» se suman las probabilidades y se resta lo que está en ambos eventos, porque si no se cuenta dos veces. La tabla de pagos del casino usa esas apuestas, y hay que ver si cobra lo justo.',
  },
  Scene: RulesLesson,
  beats: [
    {
      say: 'Con un dado honesto, «no sale 6» ocupa todo lo que deja libre el 6. Por eso basta restar.',
      board: {
        label: 'Complemento',
        tex: '\\p{1}{P(A^c)}=\\p{2}{1-P(A)}',
        parts: ['probabilidad de no ocurrir', 'lo que falta para uno'],
      },
    },
    {
      say: 'A es «par» y B es «mayor que 3». Si sumas sus casos, el 4 y el 6 aparecen dos veces. Junta los círculos.',
      gate: 'Arrastra el círculo B sobre A hasta que el 4 y el 6 coincidan.',
      board: {
        label: 'Contar sin repetir',
        tex: '\\p{1}{|A\\cup B|}=\\p{2}{|A|+|B|}\\p{3}{-|A\\cap B|}',
        parts: ['casos en algún evento', 'suma de ambos conteos', 'descuento de repetidos'],
      },
    },
    {
      say: 'La misma corrección vale para probabilidades: se resta lo que se contó dos veces.',
      ask: {
        prompt: '¿Cuánto vale P(A ∪ B)?',
        options: ['2/3', '1', '1/3'],
        answer: 0,
        explain: '3/6 + 3/6 − 2/6 = 4/6. Los casos son 2, 4, 5 y 6.',
      },
      board: {
        label: 'Unión',
        tex: '\\p{1}{P(A\\cup B)}=\\p{2}{P(A)+P(B)}\\p{3}{-P(A\\cap B)}',
        parts: ['probabilidad de alguno', 'suma de probabilidades', 'descuento del cruce'],
      },
    },
    {
      say: 'Si dos eventos no comparten casos, no hay nada que restar: «sale 1» y «sale 6» suman directo.',
      board: {
        label: 'Disjuntos',
        tex: '\\p{1}{A\\cap B=\\varnothing}\\p{2}{\\Rightarrow P(A\\cup B)=P(A)+P(B)}',
        parts: ['sin casos compartidos', 'suma sin descuento'],
      },
    },
    {
      say: 'Último caso: «par o sale 1». ¿Comparten algún resultado?',
      ask: {
        prompt: '¿Cuánto vale P(par o 1)?',
        options: ['2/3', '1/2', '5/6'],
        answer: 0,
        explain: 'El 1 no es par: son disjuntos. 3/6 + 1/6 = 4/6 = 2/3.',
      },
      board: {
        label: 'Suma directa',
        tex: '\\p{1}{\\tfrac36+\\tfrac16}=\\p{2}{\\tfrac23}',
        parts: ['probabilidades sin cruce', 'probabilidad de par o uno'],
      },
    },
  ],
};

export const level: LevelSpec = {
  id: 'w5-c3',
  world: 'probability',
  code: '5.3',
  title: 'Reglas de la casa',
  subtitle: 'Reglas de la probabilidad',
  glyph: '\\cup',
  kind: 'level',
  guide: 'iris',
  teaser:
    'La tabla de pagos del casino combina apuestas con «o» y con «no». Para ver si es justa hay que sumar probabilidades sin contar nada dos veces.',
  learn:
    'Probabilidad como área entre 0 y 1, complemento $1-P(A)$, regla de la suma para eventos disjuntos e inclusión–exclusión para eventos que se solapan.',
  glyphs: ['axioms', 'inclexcl'],
  pitfalls: [
    '$P(A\\cup B)=P(A)+P(B)$ solo si $A$ y $B$ no comparten resultados.',
    '«Al menos uno» suele ser más fácil por el complemento.',
    'Ninguna probabilidad pasa de 1: si una suma da más, algo se contó dos veces.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'nar',
          text: 'Casino Aurora, nueve y media. Vera alisó la tabla de pagos con la palma, dos veces, aunque no tenía arrugas.',
        },
        {
          who: 'vera',
          text: 'Aquí pagan por «suma 7 o 11» y por «algún 6 o dobles». Si un cliente discute el pago, a mí me toca defender esta hoja.',
        },
        {
          who: 'tu',
          text: 'El doble 6 cumple las dos condiciones de la segunda apuesta. Yo lo contaría una sola vez.',
        },
        { who: 'iris', text: 'Veamos cuánto cobra la casa por contarlo dos veces.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La tabla de pagos',
      Scene: RulesDemo,
      beats: [
        {
          say: 'Piensa la probabilidad como área: el tablero completo mide 1 y cada casilla, $\\tfrac{1}{36}$.',
          ask: {
            prompt: '¿Puede una apuesta tener probabilidad 1,2?',
            options: [
              'No: ningún evento ocupa más que el tablero',
              'Sí, si es muy probable',
              'Sí, si se juega dos veces',
            ],
            answer: 0,
            explain:
              'Un evento es una parte del tablero. Su área va de 0 (ninguna casilla) a 1 (todas).',
          },
          note: { label: 'Reglas básicas', tex: '0\\le P(A)\\le1,\\qquad P(\\Omega)=1' },
        },
        {
          say: 'La apuesta «suma distinta de 7» gana en todas las casillas que no son rojas.',
          ask: {
            prompt: '¿Cuál es la probabilidad de «suma distinta de 7»?',
            options: ['30/36', '6/36', '35/36'],
            answer: 0,
            explain:
              'Lo que no es 7 es todo lo demás: $1-\\tfrac{6}{36}=\\tfrac{30}{36}$. Más fácil que contar 30 casillas.',
          },
          note: { label: 'Complemento', tex: 'P(A^c)=1-P(A)' },
        },
        {
          say: '«Suma 7 o suma 11»: las dos apuestas no comparten casillas.',
          gate: 'Marca todas las casillas que ganan con «suma 7 o suma 11».',
          note: {
            label: 'Eventos disjuntos',
            tex: '\\begin{aligned}&A\\cap B=\\varnothing\\ \\Rightarrow\\\\ &P(A\\cup B)=P(A)+P(B)\\end{aligned}',
            body: '$\\tfrac{6}{36}+\\tfrac{2}{36}=\\tfrac{8}{36}$.',
          },
        },
        {
          say: '«Algún 6 o dobles»: 11 casillas tienen algún 6 y 6 son dobles. Pero no son 17.',
          gate: 'Toca la casilla que se cuenta dos veces.',
          note: {
            label: 'Inclusión–exclusión',
            tex: '\\begin{aligned}P(A\\cup B)=\\;&P(A)+P(B)\\\\ &-P(A\\cap B)\\end{aligned}',
            body: '$\\tfrac{11}{36}+\\tfrac{6}{36}-\\tfrac{1}{36}=\\tfrac{16}{36}$: el (6,6) se resta una vez.',
          },
        },
        {
          say: 'Las mismas reglas valen con cartas. La mesa 5 paga si sale un corazón o una figura (J, Q, K).',
          ask: {
            prompt: '¿Probabilidad de sacar corazón o figura de una baraja de 52?',
            options: ['22/52', '25/52', '12/52'],
            answer: 0,
            explain:
              '13 corazones y 12 figuras, pero J, Q y K de corazones están en ambos grupos: $13+12-3=22$.',
          },
          note: {
            label: 'Con cartas',
            body: 'Corazón o figura: $\\tfrac{13}{52}+\\tfrac{12}{52}-\\tfrac{3}{52}=\\tfrac{22}{52}$.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Tabla de pagos', Comp: Payouts, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'iris',
          text: '«Algún 6 o dobles» tiene 16 resultados de 36, y la tabla usa 17. Esa diferencia se queda en la casa.',
        },
        {
          who: 'vera',
          text: 'Yo leo el pago que me mandan. La firma al pie de la hoja es del Barón.',
        },
        {
          who: 'teo',
          text: 'Conseguí el registro de octubre: quién terminó ganando y quién era VIP. Quiero que veas cómo se cruzan los dos datos.',
        },
        {
          who: 'iris',
          text: 'Guarda también la hoja con la firma. Mañana podría no estar sobre la mesa.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'axioms',
    world: 'probability',
    tex: 'P(A^c)=1-P(A)',
    name: 'Complemento',
    read: 'pe de a complemento',
    meaning:
      'La probabilidad de que no ocurra $A$. Junto con $0\\le P\\le1$ y $P(\\Omega)=1$, son las reglas básicas.',
  },
  {
    id: 'inclexcl',
    world: 'probability',
    tex: 'P(A\\cup B)',
    name: 'Probabilidad de la unión',
    read: 'pe de a unión be',
    meaning: '$P(A)+P(B)-P(A\\cap B)$: se resta lo que se contó dos veces.',
  },
];

export { lesson };
