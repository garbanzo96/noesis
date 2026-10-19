import { useEffect, useMemo, useState } from 'react';
import { Die } from '../../art/props';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import { useCue } from '../../engine/cue';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { rng, shuffle } from '../shared/rng';
import { Confirm } from '../shared/ui';
import { ALL, type Cell, DiceGrid, keyOf } from './kit';

// ============================================================================
// CASO 5.1 · «La casa» — espacio muestral y eventos
// Dos dados (rojo y blanco) → 36 pares ordenados; un evento es un conjunto de casillas;
// eventos disjuntos; complemento.
// ============================================================================

export interface DiceEvent {
  text: string;
  tex: string;
  f: (c: Cell) => boolean;
  why: (c: Cell) => string;
}
const sumOf = (c: Cell) => c[0] + c[1];
export const EVENTS_SIMPLE: DiceEvent[] = [
  {
    text: 'la suma es mayor que 8',
    tex: 'a+b>8',
    f: (c) => sumOf(c) > 8,
    why: (c) => `suma ${sumOf(c)}`,
  },
  {
    text: 'el dado rojo es mayor que el blanco',
    tex: 'a>b',
    f: (c) => c[0] > c[1],
    why: (c) => `rojo ${c[0]}, blanco ${c[1]}`,
  },
  {
    text: 'la suma es par',
    tex: 'a+b\\ \\text{par}',
    f: (c) => sumOf(c) % 2 === 0,
    why: (c) => `suma ${sumOf(c)}`,
  },
  {
    text: 'los dos dados son mayores que 4',
    tex: 'a>4\\ \\text{y}\\ b>4',
    f: (c) => c[0] > 4 && c[1] > 4,
    why: (c) => `rojo ${c[0]}, blanco ${c[1]}`,
  },
  {
    text: 'los dados se diferencian en 2',
    tex: '|a-b|=2',
    f: (c) => Math.abs(c[0] - c[1]) === 2,
    why: (c) => `diferencia ${Math.abs(c[0] - c[1])}`,
  },
  { text: 'la suma es 5', tex: 'a+b=5', f: (c) => sumOf(c) === 5, why: (c) => `suma ${sumOf(c)}` },
];
export const EVENTS_NOT: DiceEvent[] = [
  {
    text: 'no sale ningún 6',
    tex: 'a\\ne6\\ \\text{y}\\ b\\ne6',
    f: (c) => c[0] !== 6 && c[1] !== 6,
    why: (c) => `(${c[0]},${c[1]})`,
  },
  {
    text: 'no salen dobles',
    tex: 'a\\ne b',
    f: (c) => c[0] !== c[1],
    why: (c) => `(${c[0]},${c[1]})`,
  },
  {
    text: 'la suma no es 7',
    tex: 'a+b\\ne7',
    f: (c) => sumOf(c) !== 7,
    why: (c) => `suma ${sumOf(c)}`,
  },
  {
    text: 'al menos un dado muestra 1',
    tex: 'a=1\\ \\text{o}\\ b=1',
    f: (c) => c[0] === 1 || c[1] === 1,
    why: (c) => `(${c[0]},${c[1]})`,
  },
];
export const EVENTS_MIX: DiceEvent[] = [
  {
    text: 'suma 7 **o** dobles',
    tex: '\\{a+b=7\\}\\cup\\{a=b\\}',
    f: (c) => sumOf(c) === 7 || c[0] === c[1],
    why: (c) => `suma ${sumOf(c)}${c[0] === c[1] ? ', dobles' : ''}`,
  },
  {
    text: 'dobles **y** suma mayor que 6',
    tex: '\\{a=b\\}\\cap\\{a+b>6\\}',
    f: (c) => c[0] === c[1] && sumOf(c) > 6,
    why: (c) => `(${c[0]},${c[1]}), suma ${sumOf(c)}`,
  },
  {
    text: 'algún 6 **pero no** dobles',
    tex: '\\{\\text{algún }6\\}\\setminus\\{a=b\\}',
    f: (c) => (c[0] === 6 || c[1] === 6) && c[0] !== c[1],
    why: (c) => `(${c[0]},${c[1]})`,
  },
  {
    text: 'suma 11 **o** el rojo es 1',
    tex: '\\{a+b=11\\}\\cup\\{a=1\\}',
    f: (c) => sumOf(c) === 11 || c[0] === 1,
    why: (c) => `(${c[0]},${c[1]})`,
  },
];

// ---------------------------------------------------------------- demo
function HouseDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [rolls, setRolls] = useState<Cell[]>([]);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const seven = (c: Cell) => sumOf(c) === 7;
  const roll = () => {
    const c: Cell = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    const next = [...rolls, c];
    setRolls(next);
    if (next.length >= 5) unlock();
  };
  useEffect(() => {
    if (beat !== 2) return;
    const want = ALL.filter(seven).map(keyOf);
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
  const last = rolls[rolls.length - 1];
  const seen = new Set(rolls.map(keyOf));

  const tone = (c: Cell): string | null => {
    if (beat === 0)
      return seen.has(keyOf(c)) ? (last && keyOf(last) === keyOf(c) ? C.amber : C.cyan) : null;
    if (beat === 1)
      return keyOf(c) === 34 ? C.amber : keyOf(c) === 43 && answer !== null ? C.magenta : null;
    if (beat === 2) return sel.has(keyOf(c)) ? C.amber : null;
    if (beat === 3) return seven(c) ? C.amber : c[0] === c[1] && answer !== null ? C.cyan : null;
    if (beat === 4) return c[0] === 6 || c[1] === 6 ? (answer !== null ? C.red : null) : C.dim;
    return null;
  };
  return (
    <Stage>
      <DiceGrid x={420} y={150} cell={110} tone={tone} onPaint={beat === 2 ? paint : undefined} />
      {beat === 0 && (
        <g>
          {last && (
            <>
              <Die x={180} y={330} value={last[0]} size={90} color="#c8283c" pip="#fff" />
              <Die x={290} y={330} value={last[1]} size={90} />
            </>
          )}
          <Html x={235} y={460} size={24} interactive>
            <button className="stage-btn on" onClick={roll}>
              Lanzar
            </button>
          </Html>
          <Html x={235} y={520} size={18} color={C.muted}>
            <span>{rolls.length} tiradas</span>
          </Html>
        </g>
      )}
      <Html x={1250} y={300} size={30} anchor="left" color={C.text}>
        {beat === 0 ? (
          <Tex tex="|\Omega|=6\cdot6=36" />
        ) : beat === 2 ? (
          <Tex tex={`|A|=${sel.size}`} />
        ) : beat === 4 && answer !== null ? (
          <Tex tex="|A^c|=36-25=11" />
        ) : (
          <span />
        )}
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Bets({ seed, round, api }: ChallengeProps) {
  const ev = useMemo(() => {
    const r = rng(seed);
    return shuffle(r, round === 0 ? EVENTS_SIMPLE : round === 1 ? EVENTS_NOT : EVENTS_MIX)[0];
  }, [seed, round]);
  const [sel, setSel] = useState<Set<number>>(new Set());
  useEffect(() => {
    api.prompt(
      `Vera reparte las apuestas de la noche. Marca todas las casillas donde **${ev.text}**. Puedes arrastrar para marcar varias.`,
      ev.tex,
    );
    api.hints(
      round === 1
        ? [
            'A veces es más rápido marcar lo contrario y quedarse con el resto.',
            'Recorre fila por fila: el rojo fijo, el blanco de 1 a 6.',
          ]
        : round === 2
          ? [
              '«o» es unión: basta una de las dos condiciones. «y» es intersección: deben cumplirse ambas.',
              'Marca primero un evento y luego ajusta con el otro.',
            ]
          : [
              'Recorre fila por fila: el rojo fijo, el blanco de 1 a 6.',
              'Revisa los bordes: los casos justo en el límite.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev]);
  const paint = (k: number, on: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      if (on) n.add(k);
      else n.delete(k);
      return n;
    });
  const submit = () => {
    const extra = ALL.find((c) => sel.has(keyOf(c)) && !ev.f(c));
    const miss = ALL.find((c) => !sel.has(keyOf(c)) && ev.f(c));
    const n = ALL.filter(ev.f).length;
    if (!extra && !miss)
      return api.result(true, `${n} de 36 resultados cumplen «${ev.text.replace(/\*\*/g, '')}».`);
    if (extra) return api.result(false, `(${extra[0]},${extra[1]}) no sirve: ${ev.why(extra)}.`);
    return api.result(false, `Falta (${miss![0]},${miss![1]}): ${ev.why(miss!)}, también cumple.`);
  };
  return (
    <Stage>
      <DiceGrid x={420} y={150} cell={110} sel={sel} onPaint={paint} />
      <Html x={1250} y={300} size={30} anchor="left" color={C.amber}>
        <Tex tex={`|A|=${sel.size}`} />
      </Html>
      <Confirm onClick={submit} disabled={sel.size === 0} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
// ---------------------------------------------------------------------------
// Clase · espacio muestral y eventos con una moneda y un dado (12 resultados).
// ---------------------------------------------------------------------------
const COIN = ['C', 'S'] as const;
const OUTCOMES = COIN.flatMap((m) => [1, 2, 3, 4, 5, 6].map((d) => `${m}${d}`));
const EVENT_A = new Set(['C2', 'C4', 'C6']);
const EVENT_B = new Set(['C5', 'C6', 'S5', 'S6']);
const GRID = { x: 200, y: 290, cell: 125 };

function OutcomeGrid({
  fill,
  onTap,
  hint,
}: {
  fill: (o: string) => string | null;
  onTap?: (o: string) => void;
  hint?: boolean;
}) {
  return (
    <>
      {COIN.map((m, r) => (
        <Cap
          key={m}
          x={GRID.x - 60}
          y={GRID.y + r * GRID.cell + GRID.cell / 2}
          size={22}
          color={C.muted}
        >
          {m === 'C' ? 'Cara' : 'Sello'}
        </Cap>
      ))}
      {[1, 2, 3, 4, 5, 6].map((d) => (
        <Cap key={d} x={GRID.x + (d - 0.5) * GRID.cell} y={GRID.y - 34} size={22} color={C.muted}>
          {d}
        </Cap>
      ))}
      {OUTCOMES.map((o, i) => {
        const r = Math.floor(i / 6),
          c = i % 6,
          x = GRID.x + c * GRID.cell,
          y = GRID.y + r * GRID.cell,
          col = fill(o);
        return (
          <g
            key={o}
            onPointerDown={onTap ? () => onTap(o) : undefined}
            style={{ cursor: onTap ? 'pointer' : undefined }}
          >
            <rect
              x={x + 5}
              y={y + 5}
              width={GRID.cell - 10}
              height={GRID.cell - 10}
              rx={10}
              fill={col ?? C.panel}
              fillOpacity={col ? 0.75 : 1}
              stroke={hint && !col ? C.amber : C.line}
              strokeWidth={hint && !col ? 2.5 : 2}
              strokeDasharray={hint && !col ? '7 6' : undefined}
            />
            <Cap x={x + GRID.cell / 2} y={y + GRID.cell / 2} size={24} color={col ? C.bg : C.text}>
              {o}
            </Cap>
          </g>
        );
      })}
    </>
  );
}

function SampleLesson({ beats, unlock, answer }: DemoProps) {
  const cue = useCue();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const { beat } = beats;
  const tap = (o: string) => {
    const next = new Set(picked);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    setPicked(next);
    cue.touch();
    if (next.size === 3 && [...EVENT_A].every((k) => next.has(k))) unlock();
  };
  const fill = (o: string): string | null => {
    if (beat === 1) return picked.has(o) ? C.amber : null;
    if (beat === 2) return answer !== null && EVENT_B.has(o) ? C.magenta : null;
    if (beat === 3) return EVENT_A.has(o) ? C.amber : C.cyan;
    if (beat >= 4) {
      if (answer !== null && EVENT_A.has(o) && EVENT_B.has(o)) return C.green;
      if (EVENT_A.has(o)) return C.amber;
      if (EVENT_B.has(o)) return C.magenta;
    }
    return null;
  };
  return (
    <Stage>
      <OutcomeGrid
        fill={fill}
        onTap={beat === 1 ? tap : undefined}
        hint={beat === 1 && cue.active}
      />
      <Cap x={GRID.x + 3 * GRID.cell} y={GRID.y + 2 * GRID.cell + 70} size={22} color={C.muted}>
        Moneda y dado: cada casilla es un resultado posible.
      </Cap>
      <Cap x={1250} y={240} tex="|\Omega|=2\cdot6=12" />
      {beat === 1 && (
        <Cap x={1250} y={340} color={C.amber}>
          Marcadas: {picked.size}
        </Cap>
      )}
      {beat >= 2 && <Cap x={1250} y={340} tex="A=\{C2,C4,C6\}" color={C.amber} />}
      {beat >= 2 && answer !== null && (
        <Cap x={1250} y={430} tex="B=\{C5,C6,S5,S6\}" color={C.magenta} />
      )}
      {beat === 3 && <Cap x={1250} y={520} tex="|A^c|=12-3=9" color={C.cyan} />}
      {beat >= 4 && answer !== null && (
        <Cap x={1250} y={520} tex="A\cap B=\{C6\}" color={C.green} />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Espacio muestral y eventos',
  Scene: SampleLesson,
  beats: [
    {
      say: 'Lanzas una moneda y un dado. Antes de mirar, haz la lista de todo lo que puede salir: ese es el **espacio muestral**.',
      board: {
        label: 'Espacio muestral',
        tex: '\\p{1}{\\Omega=\\{(m,d)\\}},\\quad \\p{2}{|\\Omega|=2\\cdot6=12}', parts: ['resultados posibles', 'cantidad de resultados'],
      },
    },
    {
      say: 'Un **evento** es un grupo de resultados. Marca los que cumplen «cara y número par».',
      gate: 'Toca las tres casillas de cara con número par.',
      board: { label: 'Un evento', tex: '\\p{1}{A=\\{C2,C4,C6\\}}\\p{2}{\\subseteq\\Omega}', parts: ['cara y número par', 'dentro de lo posible'] },
    },
    {
      say: 'Otro evento: «número mayor que 4», salga cara o sello.',
      ask: {
        prompt: '¿Cuántos resultados tiene «número mayor que 4»?',
        options: ['4', '2', '8'],
        answer: 0,
        explain: 'C5, C6, S5 y S6: el número puede ser 5 o 6 y la moneda, cara o sello. 2·2 = 4.',
      },
      board: { label: 'Otro evento', tex: '\\p{1}{B=\\{C5,C6,S5,S6\\}},\\ \\p{2}{|B|=4}', parts: ['números mayores que cuatro', 'casos del evento'] },
    },
    {
      say: 'El **complemento** de A reúne todo lo que no está en A: las 9 casillas celestes.',
      board: { label: 'Complemento', tex: '\\p{1}{|A^c|}=\\p{2}{|\\Omega|-|A|}=\\p{3}{9}', parts: ['casos fuera del evento', 'total menos los del evento', 'casos del complemento'] },
    },
    {
      say: 'Dos eventos son **disjuntos** si no comparten resultados. Mira A en ámbar y B en magenta.',
      ask: {
        prompt: '¿Son disjuntos A y B?',
        options: ['No: comparten C6', 'Sí', 'Solo si sale sello'],
        answer: 0,
        explain: 'C6 es cara, es par y es mayor que 4: está en los dos eventos.',
      },
      board: { label: 'Intersección', tex: '\\p{1}{A\\cap B}=\\p{2}{\\{C6\\}}', parts: ['resultados compartidos', 'único caso compartido'] },
    },
  ],
};

export const level: LevelSpec = {
  id: 'w5-c1',
  world: 'probability',
  code: '5.1',
  title: 'La casa',
  subtitle: 'Espacio muestral y eventos',
  glyph: '\\Omega',
  kind: 'level',
  guide: 'iris',
  teaser:
    'Primera noche en el Casino Aurora. Antes de sospechar de un juego, hay que saber todo lo que puede pasar en él.',
  learn:
    'Resultados y espacio muestral $\\Omega$, pares ordenados, eventos como subconjuntos, eventos disjuntos y complemento.',
  glyphs: ['omega', 'event', 'complement'],
  pitfalls: [
    '(3,4) y (4,3) son resultados distintos: los dados se distinguen.',
    'Un evento no es un número: es un conjunto de resultados.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'nar', text: 'Casino Aurora, 21:00. Las fichas golpean el paño de la mesa 7.' },
        {
          who: 'iris',
          text: 'La ficha del Contador salió de acá. Esta noche somos clientes; trata de perder poco.',
        },
        {
          who: 'vera',
          text: '«Doble Aurora»: un dado rojo y uno blanco. Elijan la apuesta antes de que cierre la mesa.',
        },
        { who: 'tu', text: 'Primero quiero mirar qué resultados paga cada apuesta.' },
        {
          who: 'vera',
          text: 'Pueden mirar el tablero; las reglas de pago se quedan aquí. No me hagan sacarlas frente a las cámaras.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Doble Aurora',
      Scene: HouseDemo,
      beats: [
        {
          say: 'Cada tirada da un par: lo que muestra el dado rojo y lo que muestra el blanco. Cada par tiene su casilla.',
          gate: 'Lanza los dados cinco veces.',
          note: {
            label: 'Espacio muestral',
            tex: '\\Omega=\\{(a,b):\\ a,b\\in\\{1,\\dots,6\\}\\}',
            body: 'Todos los resultados posibles: 6 del rojo por 6 del blanco, **36 casillas**.',
          },
        },
        {
          say: 'La casilla marcada es rojo 3, blanco 4.',
          ask: {
            prompt: '¿Rojo 3 y blanco 4 es el mismo resultado que rojo 4 y blanco 3?',
            options: [
              'No: son dos casillas distintas',
              'Sí: suman lo mismo',
              'Solo si los dados son iguales',
            ],
            answer: 0,
            explain:
              'Los dados se distinguen por el color, así que $(3,4)$ y $(4,3)$ son resultados distintos. Por eso hay 36 y no 21.',
          },
          note: {
            label: 'Pares ordenados',
            body: '$(a,b)$: primero el rojo, después el blanco. El orden importa.',
          },
        },
        {
          say: 'Vera paga doble si la suma es 7. Esa apuesta gana en varias casillas, no en una.',
          gate: 'Marca todas las casillas donde la suma es 7 (puedes arrastrar).',
          note: {
            label: 'Evento',
            tex: 'A=\\{(a,b)\\in\\Omega:\\ a+b=7\\}',
            body: 'Un evento es un **conjunto** de resultados. «Sumar 7» tiene 6 casillas.',
          },
        },
        {
          say: 'Otra apuesta paga por dobles: los dos dados iguales.',
          ask: {
            prompt: '¿Puede una tirada ganar «suma 7» y «dobles» a la vez?',
            options: ['No: un doble siempre suma par', 'Sí, con (3,4)', 'Sí, con (7,7)'],
            answer: 0,
            explain:
              'Un doble es $(a,a)$ y suma $2a$, que es par. Las dos apuestas no comparten ninguna casilla.',
          },
          note: {
            label: 'Eventos disjuntos',
            tex: 'A\\cap B=\\varnothing',
            body: 'No tienen resultados en común: no pueden ocurrir a la vez.',
          },
        },
        {
          say: 'Las casillas oscuras no tienen ningún 6. Son 25.',
          ask: {
            prompt: '¿En cuántas casillas sale al menos un 6?',
            options: ['11', '12', '6'],
            answer: 0,
            explain:
              'Todo lo que no está en «ningún 6» está en «al menos un 6»: $36-25=11$. Contar 6 + 6 = 12 cuenta dos veces el (6,6).',
          },
          note: {
            label: 'Complemento',
            tex: 'A^c=\\Omega\\setminus A,\\qquad |A^c|=36-|A|',
            body: '«Al menos un 6» es el complemento de «ningún 6».',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Las apuestas', Comp: Bets, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'vera',
          text: 'Hay 36 combinaciones. La suma 7 sale en seis; «al menos un 6», en once. Esa última casilla siempre trae discusiones.',
        },
        {
          who: 'baron',
          text: '¡Clientes que leen el tablero! Bienvenidos a mi casa; mis dados merecen tanta atención como mis invitados.',
        },
        { who: 'iris', text: 'Teo, necesitamos las grabaciones.' },
        {
          who: 'teo',
          text: 'Por el auricular: las tengo, incluida la mesa 3. Podemos contar cada cara sin que el Barón nos preste sus dados.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'omega',
    world: 'probability',
    tex: '\\Omega',
    name: 'Espacio muestral',
    read: 'omega',
    meaning: 'Conjunto de todos los resultados posibles de un experimento.',
  },
  {
    id: 'event',
    world: 'probability',
    tex: 'A\\subseteq\\Omega',
    name: 'Evento',
    read: 'a contenido en omega',
    meaning:
      'Un conjunto de resultados. «Ocurre $A$» significa que el resultado cayó dentro de $A$.',
  },
  {
    id: 'complement',
    world: 'probability',
    tex: 'A^c',
    name: 'Complemento',
    read: 'a complemento',
    meaning: 'Los resultados que no están en $A$: $\\Omega\\setminus A$.',
  },
];

export { lesson };
