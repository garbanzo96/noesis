import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, NumberField, parseProb } from '../shared/ui';
import { Formula, Table, f2 } from './kit';

// ============================================================================
// CASO 5.4 · «La tabla de jugadores» — probabilidad conjunta y marginal
// Conteos de jugadores (VIP/regular × ganó/perdió) → dividir por el total da probabilidades
// conjuntas que suman 1; sumar filas o columnas da las marginales.
// ============================================================================

const COUNTS = [
  [60, 20],
  [80, 240],
];

// ---------------------------------------------------------------- demo
function TableDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [divided, setDivided] = useState(false);
  const [cols, setCols] = useState(false);
  const [hid, setHid] = useState<number | null>(null);
  const joint = COUNTS.map((r) => r.map((v) => v / 400));
  const T3 = [
    [0.12, 0.18],
    [0.2, 0.25],
    [0.2, 0.05],
  ];

  if (beat <= 2)
    return (
      <Stage>
        <Html x={800} y={130} size={22} color={C.muted}>
          <span>Registro de octubre · 400 jugadores</span>
        </Html>
        <Table
          x={520}
          y={260}
          rows={['VIP', 'Regular']}
          cols={['Ganó', 'Perdió']}
          data={divided || beat > 0 ? joint : COUNTS}
          fmtV={divided || beat > 0 ? f2 : String}
          rowSums={beat >= 1 && answer !== null}
          colSums={beat === 2 && cols}
          total={beat === 2 && cols}
          tone={(i, j) => (beat === 0 && divided && i === 0 && j === 0 ? C.amber : beat === 1 && answer !== null && i === 0 ? C.cyan : null)}
        />
        {beat === 0 && (
          <Html x={800} y={560} size={22} interactive>
            <button
              className={`stage-btn ${divided ? '' : 'on'}`}
              onClick={() => {
                setDivided(true);
                unlock();
              }}
            >
              Dividir todo por 400
            </button>
          </Html>
        )}
        {beat === 0 && divided && <Formula y={660} size={28} tex="P(\text{VIP},\ \text{ganó})=\tfrac{60}{400}=0{,}15" />}
        {beat === 2 && (
          <Html x={800} y={600} size={22} interactive>
            <button
              className={`stage-btn ${cols ? '' : 'on'}`}
              onClick={() => {
                setCols(true);
                unlock();
              }}
            >
              Sumar columnas
            </button>
          </Html>
        )}
        {beat === 2 && cols && <Formula y={700} size={28} color={C.magenta} tex="P(\text{ganó})=0{,}15+0{,}20=0{,}35" />}
      </Stage>
    );
  return (
    <Stage>
      <Html x={800} y={130} size={22} color={C.muted}>
        <span>Manos jugadas el viernes, por mesa y resultado</span>
      </Html>
      <Table x={560} y={240} rows={['Mesa 1', 'Mesa 3', 'Mesa 7']} cols={['Gana el jugador', 'Gana la casa']} cw={250} data={T3} fmtV={f2} hidden={(i, j) => hid !== 0.05 && i === 2 && j === 1} tone={(i, j) => (i === 2 && j === 1 ? (hid === 0.05 ? C.green : C.amber) : null)} />
      <Choices
        x={800}
        y={560}
        label="La celda oculta vale:"
        options={[0.05, 0.1, 0.2]}
        value={hid}
        onPick={(v) => {
          setHid(v);
          if (v === 0.05) unlock();
        }}
        render={(v) => f2(v)}
      />
      {hid !== null && <Formula y={660} size={26} color={hid === 0.05 ? C.green : C.red} tex={`0{,}12+0{,}18+0{,}20+0{,}25+0{,}20+${f2(hid).replace(',', '{,}')}=${f2(0.95 + hid).replace(',', '{,}')}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Registry({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0: counts
    const N = pick(r, [200, 400, 500]);
    const a = randInt(r, 2, 6) * (N / 100) * 5;
    const b = randInt(r, 1, 4) * (N / 100) * 5;
    const c = randInt(r, 2, 6) * (N / 100) * 5;
    const counts = [
      [a, b],
      [c, N - a - b - c],
    ];
    const cell: [number, number] = [randInt(r, 0, 1), randInt(r, 0, 1)];
    // round 1: 3×2 joint table
    const raw = [randInt(r, 2, 8), randInt(r, 2, 8), randInt(r, 2, 8), randInt(r, 2, 8), randInt(r, 2, 8)];
    const rest = 40 - raw.reduce((x, y) => x + y, 0);
    const vals = [...raw, Math.max(1, rest)];
    const tot = vals.reduce((x, y) => x + y, 0);
    const T = [
      [vals[0] / tot, vals[1] / tot],
      [vals[2] / tot, vals[3] / tot],
      [vals[4] / tot, vals[5] / tot],
    ].map((row) => row.map((v) => Math.round(v * 100) / 100));
    // force exact sum 1 on the last cell
    const s = T.flat().reduce((x, y) => x + y, 0);
    T[2][1] = Math.round((T[2][1] + 1 - s) * 100) / 100;
    const row = randInt(r, 0, 2);
    // round 2: hidden cell given a column marginal
    const U = [
      [randInt(r, 5, 20) / 100, randInt(r, 5, 20) / 100, randInt(r, 5, 15) / 100],
      [randInt(r, 5, 20) / 100, randInt(r, 5, 15) / 100, 0],
    ];
    U[1][2] = Math.round((1 - U.flat().reduce((x, y) => x + y, 0)) * 100) / 100;
    const hj = randInt(r, 0, 2);
    const hi = randInt(r, 0, 1);
    const colM = Math.round((U[0][hj] + U[1][hj]) * 100) / 100;
    return { N, counts, cell, T, row, U, hi, hj, colM };
  }, [seed]);
  const [val, setVal] = useState('');
  const ROWS0 = ['VIP', 'Regular'];
  const COLS0 = ['Ganó', 'Perdió'];

  useEffect(() => {
    if (round === 0) {
      const [i, j] = data.cell;
      api.prompt(`Registro de noviembre: ${data.N} jugadores. ¿Qué fracción de **todos** los jugadores fue ${ROWS0[i]} y ${COLS0[j].toLowerCase()}?`, `P(\\text{${ROWS0[i]}},\\ \\text{${COLS0[j].toLowerCase()}})`);
      api.hints(['Una sola celda: la que cumple las dos cosas.', `Divide esa celda por los ${data.N} jugadores.`]);
    } else if (round === 1) {
      api.prompt(`Probabilidades conjuntas de las manos del sábado. ¿Qué fracción de las manos se jugó en la mesa ${[1, 3, 7][data.row]}?`, `P(\\text{mesa }${[1, 3, 7][data.row]})=\\sum_j P(\\text{mesa }${[1, 3, 7][data.row]},\\ j)`);
      api.hints(['Da lo mismo quién ganó: suma la fila completa.', 'Responde en decimales, por ejemplo 0,35.']);
    } else {
      api.prompt(`Una celda está borrada. Teo sabe que la columna «${['Dados', 'Cartas', 'Ruleta'][data.hj]}» suma ${f2(data.colM)}. ¿Cuánto vale la celda?`, `P(\\text{${['Dados', 'Cartas', 'Ruleta'][data.hj]}})=${f2(data.colM).replace(',', '{,}')}`);
      api.hints(['La marginal de una columna es la suma de sus celdas.', 'Resta a la marginal la otra celda de esa columna.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    if (round === 0) {
      const [i, j] = data.cell;
      const t = data.counts[i][j] / data.N;
      if (Math.abs(v - t) < 0.005) return api.result(true, `$\\frac{${data.counts[i][j]}}{${data.N}}=${f2(t).replace(',', '{,}')}$.`);
      const rowT = data.counts[i][j] / (data.counts[i][0] + data.counts[i][1]);
      if (Math.abs(v - rowT) < 0.005) return api.result(false, `Dividiste por los ${ROWS0[i]} (${data.counts[i][0] + data.counts[i][1]}). Se pide la fracción de **todos** los jugadores: divide por ${data.N}.`);
      return api.result(false, `La celda ${ROWS0[i]}–${COLS0[j].toLowerCase()} tiene ${data.counts[i][j]} jugadores de ${data.N}.`);
    }
    if (round === 1) {
      const t = data.T[data.row][0] + data.T[data.row][1];
      if (Math.abs(v - t) < 0.005) return api.result(true, `$${f2(data.T[data.row][0])}+${f2(data.T[data.row][1])}=${f2(t)}$`.replace(/(\d),(\d)/g, '$1{,}$2'));
      if (Math.abs(v - data.T[data.row][0]) < 0.005 || Math.abs(v - data.T[data.row][1]) < 0.005) return api.result(false, 'Esa es solo una celda. La mesa incluye manos ganadas y perdidas: suma la fila.');
      return api.result(false, `La fila de la mesa ${[1, 3, 7][data.row]} tiene ${f2(data.T[data.row][0])} y ${f2(data.T[data.row][1])}.`);
    }
    const t = data.U[data.hi][data.hj];
    if (Math.abs(v - t) < 0.005) return api.result(true, `$${f2(data.colM)}-${f2(data.U[1 - data.hi][data.hj])}=${f2(t)}$`.replace(/(\d),(\d)/g, '$1{,}$2'));
    return api.result(false, `Con ${f2(v)}, la columna sumaría ${f2(v + data.U[1 - data.hi][data.hj])}, no ${f2(data.colM)}.`);
  };

  if (round === 0)
    return (
      <Stage>
        <Table x={520} y={220} rows={ROWS0} cols={COLS0} data={data.counts} rowSums colSums total />
        <NumberField x={520} y={620} value={val} onChange={setVal} onEnter={submit} label="P =" width={5} />
        <Confirm onClick={submit} />
      </Stage>
    );
  if (round === 1)
    return (
      <Stage>
        <Table x={560} y={200} rows={['Mesa 1', 'Mesa 3', 'Mesa 7']} cols={['Gana el jugador', 'Gana la casa']} cw={250} data={data.T} fmtV={f2} tone={(i) => (i === data.row ? C.cyan : null)} />
        <NumberField x={560} y={620} value={val} onChange={setVal} onEnter={submit} label="P =" width={5} />
        <Confirm onClick={submit} />
      </Stage>
    );
  return (
    <Stage>
      <Table x={460} y={220} rows={['VIP', 'Regular']} cols={['Dados', 'Cartas', 'Ruleta']} data={data.U} fmtV={f2} hidden={(i, j) => i === data.hi && j === data.hj} tone={(i, j) => (j === data.hj ? (i === data.hi ? C.amber : C.magenta) : null)} />
      <Html x={460 + (data.hj + 0.5) * 210} y={220 + 2.5 * 92} size={26} color={C.magenta}>
        <span className="prop-tag">Σ = {f2(data.colM)}</span>
      </Html>
      <NumberField x={460} y={620} value={val} onChange={setVal} onEnter={submit} label="Celda =" width={5} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w5-c4',
  world: 'probability',
  code: '5.4',
  title: 'La tabla de jugadores',
  subtitle: 'Probabilidad conjunta y marginal',
  glyph: 'P(A,B)',
  kind: 'level',
  guide: 'teo',
  teaser: 'El registro de jugadores cruza dos datos: si eran VIP y si ganaron. Leerlo bien es saber qué fracción hace qué.',
  learn: 'Tablas de conteo, probabilidad conjunta $P(A,B)$ como fracción del total, marginales sumando filas o columnas, y que todas las celdas suman 1.',
  glyphs: ['joint', 'marginal'],
  pitfalls: ['$P(\\text{VIP},\\text{ganó})$ se divide por **todos** los jugadores, no solo por los VIP.', 'La marginal de una fila es la suma de la fila completa.'],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'teo', text: 'Registro de octubre: 400 jugadores. Para cada uno, si era VIP y si terminó el mes ganando o perdiendo.' },
        { who: 'iris', text: 'Una tabla de dos entradas. Léela conmigo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El registro',
      Scene: TableDemo,
      beats: [
        {
          say: 'Cada celda cuenta jugadores que cumplen dos cosas a la vez: 60 VIP ganaron.',
          gate: 'Convierte los conteos en fracciones del total.',
          note: { label: 'Probabilidad conjunta', tex: 'P(\\text{VIP},\\ \\text{ganó})=\\tfrac{60}{400}=0{,}15', body: 'Fracción de **todos** los jugadores que cumplen ambas cosas. Las cuatro celdas suman 1.' },
        },
        {
          say: 'Ahora Iris pregunta por una sola cosa, sin importar si ganaron o no.',
          ask: {
            prompt: '¿Qué fracción de los jugadores es VIP?',
            options: ['0,20', '0,15', '0,75'],
            answer: 0,
            explain: 'Los VIP están en toda la primera fila: los que ganaron y los que perdieron. $0{,}15+0{,}05=0{,}20$.',
          },
          note: { label: 'Marginal', tex: 'P(\\text{VIP})=\\sum_j P(\\text{VIP},\\ j)', body: 'Sumar la fila «olvida» la otra variable.' },
        },
        {
          say: 'Lo mismo funciona por columnas.',
          gate: 'Suma las columnas.',
          note: { label: 'Marginal por columnas', tex: 'P(\\text{ganó})=0{,}15+0{,}20=0{,}35', body: 'Los totales de filas y de columnas suman 1 cada uno.' },
        },
        {
          say: 'Otra tabla: manos del viernes por mesa. Una celda está tapada con café.',
          gate: 'Elige el valor de la celda oculta.',
          note: { label: 'Todo suma 1', tex: '\\sum_i\\sum_j P(i,j)=1', body: 'Cada mano cae en exactamente una celda.' },
        },
      ],
    },
    { kind: 'challenge', title: 'El registro', Comp: Registry, rounds: 3 },
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'iris', text: 'El 20 % de los jugadores es VIP. Y de los que ganaron, casi la mitad son VIP.' },
        { who: 'iris', text: 'Eso huele mal. Pero «de los que ganaron» es otra pregunta. Necesitamos condicionar.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'joint', world: 'probability', tex: 'P(A,B)', name: 'Probabilidad conjunta', read: 'pe de a coma be', meaning: 'Probabilidad de que ocurran $A$ y $B$ a la vez. Lo mismo que $P(A\\cap B)$.' },
  { id: 'marginal', world: 'probability', tex: 'P(A)=\\sum_b P(A,b)', name: 'Marginal', read: 'marginal de a', meaning: 'Se obtiene sumando la conjunta sobre todos los valores de la otra variable.' },
];
