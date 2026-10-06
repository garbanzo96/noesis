import { useEffect, useMemo, useState } from 'react';
import { Die } from '../../art/props';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
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
  { text: 'la suma es mayor que 8', tex: 'a+b>8', f: (c) => sumOf(c) > 8, why: (c) => `suma ${sumOf(c)}` },
  { text: 'el dado rojo es mayor que el blanco', tex: 'a>b', f: (c) => c[0] > c[1], why: (c) => `rojo ${c[0]}, blanco ${c[1]}` },
  { text: 'la suma es par', tex: 'a+b\\ \\text{par}', f: (c) => sumOf(c) % 2 === 0, why: (c) => `suma ${sumOf(c)}` },
  { text: 'los dos dados son mayores que 4', tex: 'a>4\\ \\text{y}\\ b>4', f: (c) => c[0] > 4 && c[1] > 4, why: (c) => `rojo ${c[0]}, blanco ${c[1]}` },
  { text: 'los dados se diferencian en 2', tex: '|a-b|=2', f: (c) => Math.abs(c[0] - c[1]) === 2, why: (c) => `diferencia ${Math.abs(c[0] - c[1])}` },
  { text: 'la suma es 5', tex: 'a+b=5', f: (c) => sumOf(c) === 5, why: (c) => `suma ${sumOf(c)}` },
];
export const EVENTS_NOT: DiceEvent[] = [
  { text: 'no sale ningún 6', tex: 'a\\ne6\\ \\text{y}\\ b\\ne6', f: (c) => c[0] !== 6 && c[1] !== 6, why: (c) => `(${c[0]},${c[1]})` },
  { text: 'no salen dobles', tex: 'a\\ne b', f: (c) => c[0] !== c[1], why: (c) => `(${c[0]},${c[1]})` },
  { text: 'la suma no es 7', tex: 'a+b\\ne7', f: (c) => sumOf(c) !== 7, why: (c) => `suma ${sumOf(c)}` },
  { text: 'al menos un dado muestra 1', tex: 'a=1\\ \\text{o}\\ b=1', f: (c) => c[0] === 1 || c[1] === 1, why: (c) => `(${c[0]},${c[1]})` },
];
export const EVENTS_MIX: DiceEvent[] = [
  { text: 'suma 7 **o** dobles', tex: '\\{a+b=7\\}\\cup\\{a=b\\}', f: (c) => sumOf(c) === 7 || c[0] === c[1], why: (c) => `suma ${sumOf(c)}${c[0] === c[1] ? ', dobles' : ''}` },
  { text: 'dobles **y** suma mayor que 6', tex: '\\{a=b\\}\\cap\\{a+b>6\\}', f: (c) => c[0] === c[1] && sumOf(c) > 6, why: (c) => `(${c[0]},${c[1]}), suma ${sumOf(c)}` },
  { text: 'algún 6 **pero no** dobles', tex: '\\{\\text{algún }6\\}\\setminus\\{a=b\\}', f: (c) => (c[0] === 6 || c[1] === 6) && c[0] !== c[1], why: (c) => `(${c[0]},${c[1]})` },
  { text: 'suma 11 **o** el rojo es 1', tex: '\\{a+b=11\\}\\cup\\{a=1\\}', f: (c) => sumOf(c) === 11 || c[0] === 1, why: (c) => `(${c[0]},${c[1]})` },
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
    if (beat === 0) return seen.has(keyOf(c)) ? (last && keyOf(last) === keyOf(c) ? C.amber : C.cyan) : null;
    if (beat === 1) return keyOf(c) === 34 ? C.amber : keyOf(c) === 43 && answer !== null ? C.magenta : null;
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
        {beat === 0 ? <Tex tex="|\Omega|=6\cdot6=36" /> : beat === 2 ? <Tex tex={`|A|=${sel.size}`} /> : beat === 4 && answer !== null ? <Tex tex="|A^c|=36-25=11" /> : <span />}
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
    api.prompt(`Vera reparte las apuestas de la noche. Marca todas las casillas donde **${ev.text}**. Puedes arrastrar para marcar varias.`, ev.tex);
    api.hints(
      round === 1
        ? ['A veces es más rápido marcar lo contrario y quedarse con el resto.', 'Recorre fila por fila: el rojo fijo, el blanco de 1 a 6.']
        : round === 2
          ? ['«o» es unión: basta una de las dos condiciones. «y» es intersección: deben cumplirse ambas.', 'Marca primero un evento y luego ajusta con el otro.']
          : ['Recorre fila por fila: el rojo fijo, el blanco de 1 a 6.', 'Revisa los bordes: los casos justo en el límite.'],
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
    if (!extra && !miss) return api.result(true, `${n} de 36 resultados cumplen «${ev.text.replace(/\*\*/g, '')}».`);
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
export const level: LevelSpec = {
  id: 'w5-c1',
  world: 'probability',
  code: '5.1',
  title: 'La casa',
  subtitle: 'Espacio muestral y eventos',
  glyph: '\\Omega',
  kind: 'level',
  guide: 'iris',
  teaser: 'Primera noche en el Casino Aurora. Antes de sospechar de un juego, hay que saber todo lo que puede pasar en él.',
  learn: 'Resultados y espacio muestral $\\Omega$, pares ordenados, eventos como subconjuntos, eventos disjuntos y complemento.',
  glyphs: ['omega', 'event', 'complement'],
  pitfalls: ['(3,4) y (4,3) son resultados distintos: los dados se distinguen.', 'Un evento no es un número: es un conjunto de resultados.'],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'iris', text: 'Casino Aurora. La ficha del Contador vino de aquí. Esta noche somos dos clientes más.' },
        { who: 'vera', text: 'Bienvenidos a la mesa 7. «Doble Aurora»: un dado rojo, uno blanco. Ustedes apuestan a lo que sale.' },
        { who: 'iris', text: 'Antes de apostar, quiero ver todo lo que puede salir.' },
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
          note: { label: 'Espacio muestral', tex: '\\Omega=\\{(a,b):\\ a,b\\in\\{1,\\dots,6\\}\\}', body: 'Todos los resultados posibles: 6 del rojo por 6 del blanco, **36 casillas**.' },
        },
        {
          say: 'La casilla marcada es rojo 3, blanco 4.',
          ask: {
            prompt: '¿Rojo 3 y blanco 4 es el mismo resultado que rojo 4 y blanco 3?',
            options: ['No: son dos casillas distintas', 'Sí: suman lo mismo', 'Solo si los dados son iguales'],
            answer: 0,
            explain: 'Los dados se distinguen por el color, así que $(3,4)$ y $(4,3)$ son resultados distintos. Por eso hay 36 y no 21.',
          },
          note: { label: 'Pares ordenados', body: '$(a,b)$: primero el rojo, después el blanco. El orden importa.' },
        },
        {
          say: 'Vera paga doble si la suma es 7. Esa apuesta gana en varias casillas, no en una.',
          gate: 'Marca todas las casillas donde la suma es 7 (puedes arrastrar).',
          note: { label: 'Evento', tex: 'A=\\{(a,b)\\in\\Omega:\\ a+b=7\\}', body: 'Un evento es un **conjunto** de resultados. «Sumar 7» tiene 6 casillas.' },
        },
        {
          say: 'Otra apuesta paga por dobles: los dos dados iguales.',
          ask: {
            prompt: '¿Puede una tirada ganar «suma 7» y «dobles» a la vez?',
            options: ['No: un doble siempre suma par', 'Sí, con (3,4)', 'Sí, con (7,7)'],
            answer: 0,
            explain: 'Un doble es $(a,a)$ y suma $2a$, que es par. Las dos apuestas no comparten ninguna casilla.',
          },
          note: { label: 'Eventos disjuntos', tex: 'A\\cap B=\\varnothing', body: 'No tienen resultados en común: no pueden ocurrir a la vez.' },
        },
        {
          say: 'Las casillas oscuras no tienen ningún 6. Son 25.',
          ask: {
            prompt: '¿En cuántas casillas sale al menos un 6?',
            options: ['11', '12', '6'],
            answer: 0,
            explain: 'Todo lo que no está en «ningún 6» está en «al menos un 6»: $36-25=11$. Contar 6 + 6 = 12 cuenta dos veces el (6,6).',
          },
          note: { label: 'Complemento', tex: 'A^c=\\Omega\\setminus A,\\qquad |A^c|=36-|A|', body: '«Al menos un 6» es el complemento de «ningún 6».' },
        },
      ],
    },
    { kind: 'challenge', title: 'Las apuestas', Comp: Bets, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'baron', text: 'Clientes nuevos. Bienvenidos a mi casa. Aquí todos los dados son honestos.' },
        { who: 'iris', text: '(En voz baja) Teo, ¿tienes las cámaras de las mesas?' },
        { who: 'teo', text: '(Por el auricular) Mil tiradas por mesa. Si un dado miente, los números lo van a decir.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'omega', world: 'probability', tex: '\\Omega', name: 'Espacio muestral', read: 'omega', meaning: 'Conjunto de todos los resultados posibles de un experimento.' },
  { id: 'event', world: 'probability', tex: 'A\\subseteq\\Omega', name: 'Evento', read: 'a contenido en omega', meaning: 'Un conjunto de resultados. «Ocurre $A$» significa que el resultado cayó dentro de $A$.' },
  { id: 'complement', world: 'probability', tex: 'A^c', name: 'Complemento', read: 'a complemento', meaning: 'Los resultados que no están en $A$: $\\Omega\\setminus A$.' },
];
