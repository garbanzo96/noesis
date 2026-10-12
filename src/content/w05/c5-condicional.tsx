import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, parseProb } from '../shared/ui';
import { ALL, type Cell, DiceGrid, Formula, Table, f2, fracTex } from './kit';

// ============================================================================
// CASO 5.5 · «Dado que…» — probabilidad condicional
// Saber algo achica el universo: P(A|B) = |A∩B|/|B| en los dados y celda/fila en la tabla;
// P(A|B) ≠ P(B|A); regla del producto.
// ============================================================================

const sumOf = (c: Cell) => c[0] + c[1];
const OCT = [
  [60, 20],
  [80, 240],
];

// ---------------------------------------------------------------- demo
function GivenDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [row, setRow] = useState<number | null>(null);
  const [vip, setVip] = useState(false);

  if (beat <= 1) {
    const B = (c: Cell) => (beat === 0 ? row !== null && c[0] === row : sumOf(c) === 10);
    const A = (c: Cell) => (beat === 0 ? sumOf(c) === 10 : c[0] === 6);
    const active = beat === 0 ? row !== null : true;
    return (
      <Stage>
        <DiceGrid
          x={420}
          y={150}
          cell={110}
          labels="sum"
          dim={(c) => active && !B(c)}
          tone={(c) => (active && B(c) && A(c) && (beat === 0 ? row === 6 : answer !== null) ? C.amber : active && B(c) ? C.cyan : null)}
          onPaint={
            beat === 0
              ? (k) => {
                  const r = Math.floor(k / 10);
                  setRow(r);
                  if (r === 6) unlock();
                }
              : undefined
          }
        />
        {beat === 0 && row === 6 && (
          <>
            <Formula x={1290} y={300} size={26} color={C.amber} tex="P(10\mid\text{rojo }6)=\tfrac{1}{6}" />
            <Formula x={1290} y={400} size={22} color={C.muted} tex="P(10)=\tfrac{3}{36}=\tfrac{1}{12}" />
          </>
        )}
        {beat === 1 && answer !== null && <Formula x={1290} y={330} size={26} color={C.amber} tex="P(\text{rojo }6\mid10)=\tfrac{1}{3}" />}
      </Stage>
    );
  }
  const joint = OCT.map((r) => r.map((v) => v / 400));
  const pickRow = (i: number) => {
    if (i !== 0) return;
    setVip(true);
    unlock();
  };
  const showVip = beat === 2 ? vip : beat === 3 ? true : false;
  return (
    <Stage>
      <Html x={800} y={130} size={22} color={C.muted}>
        <span>Registro de octubre · 400 jugadores</span>
      </Html>
      <Table
        x={520}
        y={250}
        rows={['VIP', 'Regular']}
        cols={['Ganó', 'Perdió']}
        data={beat === 4 ? OCT : joint}
        fmtV={beat === 4 ? String : f2}
        rowSums={beat !== 4}
        colSums={beat === 4}
        onRow={beat === 2 ? pickRow : undefined}
        onCell={beat === 2 ? (i) => pickRow(i) : undefined}
        dimRow={(i) => (beat === 2 && showVip && i === 1) || (beat === 3 && answer !== null && i === 0)}
        tone={(i, j) => (beat === 2 && showVip && i === 0 ? (j === 0 ? C.amber : C.cyan) : beat === 3 && answer !== null && i === 1 ? (j === 0 ? C.amber : C.cyan) : beat === 4 && answer !== null && j === 0 ? (i === 0 ? C.amber : C.cyan) : null)}
      />
      {beat === 2 && vip && <Formula y={560} size={30} tex="P(\text{ganó}\mid\text{VIP})=\dfrac{0{,}15}{0{,}20}=0{,}75" />}
      {beat === 3 && answer !== null && <Formula y={560} size={30} tex="P(\text{ganó}\mid\text{regular})=\dfrac{0{,}20}{0{,}80}=0{,}25" />}
      {beat === 4 && answer !== null && <Formula y={560} size={30} tex="P(\text{VIP}\mid\text{ganó})=\dfrac{60}{140}\approx0{,}43" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const CONDS: { text: string; tex: string; f: (c: Cell) => boolean }[] = [
  { text: 'el dado rojo es 4', tex: '\\text{rojo}=4', f: (c) => c[0] === 4 },
  { text: 'la suma es 8', tex: 'a+b=8', f: (c) => sumOf(c) === 8 },
  { text: 'salió algún 5', tex: '\\text{algún }5', f: (c) => c[0] === 5 || c[1] === 5 },
  { text: 'salieron dobles', tex: 'a=b', f: (c) => c[0] === c[1] },
  { text: 'el blanco es mayor que 4', tex: 'b>4', f: (c) => c[1] > 4 },
];
const TARGETS: { text: string; tex: string; f: (c: Cell) => boolean }[] = [
  { text: 'la suma sea mayor que 7', tex: 'a+b>7', f: (c) => sumOf(c) > 7 },
  { text: 'el blanco sea par', tex: 'b\\ \\text{par}', f: (c) => c[1] % 2 === 0 },
  { text: 'el rojo sea mayor que el blanco', tex: 'a>b', f: (c) => c[0] > c[1] },
  { text: 'salga algún 6', tex: '\\text{algún }6', f: (c) => c[0] === 6 || c[1] === 6 },
];

function Given({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    let B = pick(r, CONDS);
    let A = pick(r, TARGETS);
    for (let k = 0; k < 20 && ALL.filter((c) => A.f(c) && B.f(c)).length === 0; k++) {
      B = pick(r, CONDS);
      A = pick(r, TARGETS);
    }
    const counts = [
      [randInt(r, 2, 9) * 10, randInt(r, 2, 9) * 10],
      [randInt(r, 2, 9) * 10, randInt(r, 2, 9) * 10],
      [randInt(r, 2, 9) * 10, randInt(r, 2, 9) * 10],
    ];
    const mesa = randInt(r, 0, 2);
    const reverse = r() < 0.5;
    return { A, B, counts, mesa, reverse };
  }, [seed]);
  const [val, setVal] = useState('');
  const MESAS = ['Mesa 1', 'Mesa 3', 'Mesa 7'];

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Vera alcanza a ver que **${data.B.text}**. Sabiendo eso, ¿qué probabilidad hay de que ${data.A.text}?`, `P(${data.A.tex}\\mid ${data.B.tex})`);
      api.hints(['Solo cuentan las casillas iluminadas: las que cumplen lo que ya sabes.', 'Entre esas, cuenta las que además cumplen lo que preguntas.']);
    } else if (round === 1) {
      api.prompt(`Manos del sábado. Si una mano se jugó en la ${MESAS[data.mesa].toLowerCase()}, ¿qué probabilidad hay de que haya ganado el jugador?`, `P(\\text{gana}\\mid\\text{${MESAS[data.mesa].toLowerCase()}})`);
      api.hints(['Quédate solo con la fila de esa mesa.', 'Divide la celda «gana el jugador» por el total de la fila.']);
    } else {
      api.prompt(
        data.reverse ? `De las manos que ganó el jugador, ¿qué fracción se jugó en la ${MESAS[data.mesa].toLowerCase()}?` : `De las manos que ganó la casa, ¿qué fracción se jugó en la ${MESAS[data.mesa].toLowerCase()}?`,
        `P(\\text{${MESAS[data.mesa].toLowerCase()}}\\mid\\text{${data.reverse ? 'gana el jugador' : 'gana la casa'}})`,
      );
      api.hints(['Ahora lo que sabes es el resultado: quédate con esa columna.', 'Divide la celda de la mesa por el total de la columna.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    if (round === 0) {
      const nB = ALL.filter(data.B.f).length;
      const nAB = ALL.filter((c) => data.A.f(c) && data.B.f(c)).length;
      if (Math.abs(v - nAB / nB) < 1e-3) return api.result(true, `$${fracTex(nAB, nB)}$: ${nAB} de las ${nB} casillas posibles.`);
      if (Math.abs(v - nAB / 36) < 1e-3) return api.result(false, `Dividiste por 36. Pero ya sabes que ${data.B.text}: solo quedan ${nB} casillas posibles.`);
      return api.result(false, `Quedan ${nB} casillas posibles. Cuenta en cuántas ${data.A.text}.`);
    }
    const c = data.counts;
    const m = data.mesa;
    if (round === 1) {
      const rowT = c[m][0] + c[m][1];
      const t = c[m][0] / rowT;
      if (Math.abs(v - t) < 0.006) return api.result(true, `$\\frac{${c[m][0]}}{${rowT}}\\approx${f2(t).replace(',', '{,}')}$.`);
      const tot = c.flat().reduce((a, b) => a + b, 0);
      if (Math.abs(v - c[m][0] / tot) < 0.006) return api.result(false, `Eso es $P(\\text{gana},\\ \\text{mesa})$: dividiste por todas las manos. Si ya sabes la mesa, divide por las ${rowT} manos de esa fila.`);
      return api.result(false, `La ${MESAS[m].toLowerCase()} tiene ${rowT} manos; el jugador ganó ${c[m][0]}.`);
    }
    const j = data.reverse ? 0 : 1;
    const colT = c[0][j] + c[1][j] + c[2][j];
    const t = c[m][j] / colT;
    if (Math.abs(v - t) < 0.006) return api.result(true, `$\\frac{${c[m][j]}}{${colT}}\\approx${f2(t).replace(',', '{,}')}$. Se divide por la columna, no por la fila.`);
    const rowT = c[m][0] + c[m][1];
    if (Math.abs(v - c[m][j] / rowT) < 0.006) return api.result(false, `Esa es la pregunta al revés: dividiste por la fila de la mesa. Aquí lo sabido es el resultado: divide por la columna (${colT}).`);
    return api.result(false, `La columna tiene ${colT} manos; ${c[m][j]} son de la ${MESAS[m].toLowerCase()}.`);
  };

  if (round === 0)
    return (
      <Stage>
        <DiceGrid x={420} y={150} cell={110} labels="sum" dim={(c) => !data.B.f(c)} tone={(c) => (data.B.f(c) ? C.cyan : null)} />
        <NumberField x={1130} y={480} value={val} onChange={setVal} onEnter={submit} label="P =" width={4} />
        <Confirm onClick={submit} />
      </Stage>
    );
  return (
    <Stage>
      <Table
        x={560}
        y={200}
        rows={MESAS}
        cols={['Gana el jugador', 'Gana la casa']}
        cw={250}
        data={data.counts}
        rowSums
        colSums
        total
        tone={(i, j) => (round === 1 ? (i === data.mesa ? (j === 0 ? C.amber : C.cyan) : null) : j === (data.reverse ? 0 : 1) ? (i === data.mesa ? C.amber : C.cyan) : null)}
      />
      <NumberField x={560} y={640} value={val} onChange={setVal} onEnter={submit} label="P =" width={5} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w5-c5',
  world: 'probability',
  code: '5.5',
  title: 'Dado que…',
  subtitle: 'Probabilidad condicional',
  glyph: 'P(A\\mid B)',
  kind: 'level',
  guide: 'iris',
  teaser: 'Saber algo cambia las probabilidades. ¿Ganan más los VIP, o solo parece? Hay que preguntar bien: «de los VIP» no es «de los que ganaron».',
  learn: 'Probabilidad condicional como universo reducido, $P(A\\mid B)=P(A\\cap B)/P(B)$, regla del producto y por qué $P(A\\mid B)\\ne P(B\\mid A)$.',
  glyphs: ['cond', 'product'],
  pitfalls: ['En $P(A\\mid B)$ se divide por $B$, lo que ya se sabe.', '$P(\\text{VIP}\\mid\\text{ganó})$ y $P(\\text{ganó}\\mid\\text{VIP})$ responden preguntas distintas.'],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'nar', text: 'Casino Aurora, 21:00. Un dado se detiene junto a la mano de Vera.' },
        { who: 'vera', text: 'Alcancé a ver el rojo antes que el blanco. Hay clientes que apuestan como si supieran algo más.' },
        { who: 'iris', text: 'El Barón dice que la mayoría de los ganadores es regular. Necesito ver qué parte de los VIP ganó, aunque cambie la pregunta.' },
        { who: 'vera', text: 'Les muestro esa fila, pero no me dejen el registro abierto cuando él pase.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Lo que ya se sabe',
      Scene: GivenDemo,
      beats: [
        {
          say: 'Vera ve que el dado rojo cayó en 6. Con eso, muchas casillas ya no son posibles.',
          gate: 'Toca la fila donde el rojo es 6.',
          note: { label: 'Condicionar', tex: 'P(A\\mid B)=\\frac{|A\\cap B|}{|B|}', body: 'Si se sabe $B$, el universo se reduce a $B$. Rojo 6: quedan 6 casillas, y una suma 10.' },
        },
        {
          say: 'Ahora al revés: alguien anuncia que la suma fue 10.',
          ask: {
            prompt: 'Sabiendo que la suma es 10, ¿qué probabilidad hay de que el rojo sea 6?',
            options: ['1/3', '1/6', '1/12'],
            answer: 0,
            explain: 'La suma 10 deja tres casillas: (4,6), (5,5) y (6,4). En una el rojo es 6.',
          },
          note: { label: 'El orden importa', tex: 'P(\\text{rojo }6\\mid10)=\\tfrac13\\ne\\tfrac16', body: 'Cambiar lo que se sabe cambia el universo.' },
        },
        {
          say: 'En la tabla de octubre, condicionar es quedarse con una fila.',
          gate: 'Toca la fila de los VIP.',
          note: { label: 'Con probabilidades', tex: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}', body: '$0{,}15/0{,}20=0{,}75$. Despejando: $P(A\\cap B)=P(A\\mid B)\\,P(B)$.' },
        },
        {
          say: 'Los VIP ganan el 75 % de las veces. Compáralos con el resto.',
          ask: {
            prompt: '¿Cuánto vale $P(\\text{ganó}\\mid\\text{regular})$?',
            options: ['0,25', '0,20', '0,80'],
            answer: 0,
            explain: 'Fila de los regulares: $0{,}20/0{,}80=0{,}25$. El 0,20 es la conjunta, no la condicional.',
          },
          note: { label: 'Comparar condiciones', body: 'VIP: 75 % gana. Regular: 25 %. En juegos de azar honestos, ser VIP no debería cambiar nada.' },
        },
        {
          say: 'El Barón se defiende: «la mayoría de los ganadores son clientes comunes».',
          ask: {
            prompt: 'De los que ganaron, ¿qué fracción es VIP?',
            options: ['Cerca de 0,43', '0,75', '0,20'],
            answer: 0,
            explain: 'Ganaron 140; 60 son VIP: $60/140\\approx0{,}43$. Es cierto que la mayoría de los ganadores es regular, pero porque hay muchos más regulares.',
          },
          note: { label: 'P(A|B) ≠ P(B|A)', tex: 'P(\\text{VIP}\\mid\\text{ganó})\\approx0{,}43', body: 'Distinto de $P(\\text{ganó}\\mid\\text{VIP})=0{,}75$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Lo que se sabe', Comp: Given, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'teo', text: 'Terminó ganando el 75 % de los VIP y el 25 % de los regulares. Ser VIP triplica la frecuencia de ganar en ese registro.' },
        { who: 'iris', text: 'Ferrer eligió bien qué cifra contar.' },
        { who: 'vera', text: 'La mayoría de los VIP pide la mesa 7. La mía.' },
        { who: 'iris', text: '¿La piden ellos, Vera, o los sientan aquí?' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'cond', world: 'probability', tex: 'P(A\\mid B)', name: 'Probabilidad condicional', read: 'pe de a dado be', meaning: 'Probabilidad de $A$ sabiendo que ocurrió $B$: $P(A\\cap B)/P(B)$.', warn: 'No es simétrica: $P(A\\mid B)\\ne P(B\\mid A)$ en general.' },
  { id: 'product', world: 'probability', tex: 'P(A\\cap B)=P(A\\mid B)P(B)', name: 'Regla del producto', read: 'regla del producto', meaning: 'Para que ocurran ambos: que ocurra $B$, y luego $A$ sabiendo $B$.' },
];
