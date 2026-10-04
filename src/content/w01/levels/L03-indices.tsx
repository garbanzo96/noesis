import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Arrow, Brace } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { BoxRow, boxCenter } from '../shared/Boxes';
import { pick, randInt, rng } from '../shared/rng';

// ============================================================================
// 1.3 · ÍNDICES — un índice es una dirección
// demo: list with addresses, x_i by pointer, slices (prediction), componentwise ops,
//       whole-list machine (drag gate: one input changes every output), table a_ij,
//       superscript labels (prediction), 1-based vs 0-based
// challenge: addressing tasks (slices, shifted indices, a_ij, index-vs-value, componentwise)
// ============================================================================

const v1 = (v: number) => fmt(v, 2).replace('−', '-');

// ---------------------------------------------------------------- demo scene
function IndexDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const base = [0.2, 0.5, 0.1, 0.9, 0.3];
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1);
  const rev6 = useTween(beat > 6 || (beat === 6 && answer !== null) ? 1 : 0, 1);
  const [x2, setX2] = useState(0.5);
  const startY = useRef({ y: 0, v: 0.5 });
  const onDrag = useSvgDrag(svg, (_x, y, phase) => {
    if (beat !== 4) return;
    if (phase === 'start') {
      startY.current = { y, v: x2 };
      return;
    }
    const v = Math.round(clamp(startY.current.v + (startY.current.y - y) / 250, 0.05, 1.5) * 20) / 20;
    setX2(v);
    if (Math.abs(v - 0.5) > 0.12) unlock();
  });
  const doubling = beat === 3 ? at(3) : beat > 3 ? 0 : 0;
  const vals = base.map((v, i) => {
    if (beat === 3) return lagged(doubling, i, 5, 0.4) > 0.5 ? 2 * v : v;
    if (beat === 4 && i === 1) return x2;
    return v;
  });
  const listV = 1 - at(5);
  const tableV = at(5) * (1 - at(7));
  const pyV = at(7);
  const y = 380;
  const n = 5;
  const sum = vals.reduce((a, b) => a + b, 0);

  return (
    <Stage ref={svg}>
      <Group opacity={listV}>
        <BoxRow x={800} y={y} values={vals} fmtValue={v1} highlight={beat === 1 ? [2] : []} selected={rev2 > 0.5 && beat === 2 ? [1, 2, 3] : []} />
        <Html x={800} y={200} size={30} color={C.text}>
          <Tex tex={`\\mathbf x=(${vals.map(v1).join(',\\,')})`} />
        </Html>
        {beat === 1 && (
          <Group opacity={at(1)}>
            <Arrow from={[boxCenter(800, n, 2), 560]} to={[boxCenter(800, n, 2), 470]} color={C.cyan} width={4} />
            <Html x={boxCenter(800, n, 2)} y={590} size={28} color={C.cyan}>
              <Tex tex="i=3" />
            </Html>
            <Html x={boxCenter(800, n, 2) + 230} y={590} size={28} color={C.amber}>
              <Tex tex="x_3=0.1" />
            </Html>
          </Group>
        )}
        {beat === 2 && rev2 > 0 && (
          <Group opacity={rev2}>
            <Brace x1={boxCenter(800, n, 1) - 60} x2={boxCenter(800, n, 3) + 60} y={470} />
            <Html x={boxCenter(800, n, 2)} y={540} size={28} color={C.violet}>
              <Tex tex="x_{2:4}=(x_2,x_3,x_4)" />
            </Html>
          </Group>
        )}
        {beat === 3 && (
          <Group opacity={at(3)}>
            <rect x={boxCenter(800, n, 0) - 70 + (boxCenter(800, n, 4) - boxCenter(800, n, 0)) * at(3)} y={300} width={140} height={160} rx={10} fill={C.blue} opacity={0.15} />
            <Html x={800} y={560} size={28} color={C.blue}>
              <Tex tex="(2\mathbf x)_i=2\,x_i\quad\text{para cada }i" />
            </Html>
          </Group>
        )}
        {beat === 4 && (
          <Group opacity={at(4)}>
            <g style={{ cursor: 'ns-resize' }} onPointerDown={onDrag}>
              <rect x={boxCenter(800, n, 1) - 60} y={y - 45} width={120} height={90} fill="transparent" />
            </g>
            <Html x={boxCenter(800, n, 1)} y={y - 75} size={20} color={C.text}>
              <span className="panel-note">⇕ arrastra</span>
            </Html>
            <rect x={460} y={500} width={680} height={60} rx={10} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={2} />
            <Html x={800} y={530} size={26} color={C.blue}>
              <Tex tex="N(\mathbf x)=\mathbf x/\textstyle\sum_j x_j" />
            </Html>
            <BoxRow x={800} y={660} values={vals.map((v) => v / sum)} fmtValue={(v) => fmt(v, 2)} valueColor={C.violet} showAddr={false} />
          </Group>
        )}
      </Group>
      {/* table a_ij */}
      <Group opacity={tableV}>
        {(() => {
          const rows = 3;
          const cols = 4;
          const cw = 140;
          const ch = 90;
          const gx = 800 - (cols * cw) / 2;
          const gy = 230;
          const A = [
            [0.8, 0.1, 0.3, 0.25],
            [0.1, 0.7, 0.3, 0.25],
            [0.1, 0.2, 0.4, 0.5],
          ];
          return (
            <>
              {A.map((row, i) =>
                row.map((v, j) => {
                  const hl = beat === 5 && i === 1 && j === 2;
                  return (
                    <g key={`${i}-${j}`}>
                      <rect x={gx + j * cw + 4} y={gy + i * ch + 4} width={cw - 8} height={ch - 8} rx={8} fill={hl ? C.violet : C.panel} fillOpacity={hl ? 0.3 : 1} stroke={hl ? C.text : C.line} strokeWidth={hl ? 3 : 1.5} />
                      <Html x={gx + j * cw + cw / 2} y={gy + i * ch + ch / 2} size={24} color={C.text}>
                        <Tex tex={fmt(v, 2)} />
                      </Html>
                    </g>
                  );
                }),
              )}
              {[0, 1, 2].map((i) => (
                <Html key={'i' + i} x={gx - 50} y={gy + i * ch + ch / 2} size={22} color={C.amber}>
                  <Tex tex={`o_${i + 1}`} />
                </Html>
              ))}
              {[0, 1, 2, 3].map((j) => (
                <Html key={'j' + j} x={gx + j * cw + cw / 2} y={gy - 30} size={22} color={C.cyan}>
                  <Tex tex={`s_${j + 1}`} />
                </Html>
              ))}
              <Html x={800} y={gy + rows * ch + 60} size={28} color={C.text}>
                <Tex tex="A_{23}:\ \text{fila }2\ (\text{observación}),\ \text{columna }3\ (\text{estado})" />
              </Html>
              <Group opacity={rev6}>
                <Html x={800} y={gy + rows * ch + 130} size={28} color={C.green}>
                  <Tex tex="\mathbf B^{u=1},\ \mathbf B^{u=2}:\ u\ \text{etiqueta la acción, no es un exponente}" />
                </Html>
              </Group>
            </>
          );
        })()}
      </Group>
      {/* 1-based vs 0-based */}
      <Group opacity={pyV}>
        <BoxRow x={800} y={380} values={base} fmtValue={v1} />
        {base.map((_, i) => (
          <Html key={i} x={boxCenter(800, n, i)} y={520} size={20} color={C.magenta}>
            <span className="panel-note">x[{i}]</span>
          </Html>
        ))}
        <Html x={330} y={470} size={20} color={C.cyan} anchor="right">
          <span className="panel-note">matemáticas</span>
        </Html>
        <Html x={330} y={520} size={20} color={C.magenta} anchor="right">
          <span className="panel-note">Python</span>
        </Html>
        <Html x={800} y={640} size={28} color={C.text}>
          <Tex tex="x_1\ \leftrightarrow\ \texttt{x[0]},\qquad x_{2:4}\ \leftrightarrow\ \texttt{x[1:4]}" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Task =
  | { kind: 'select'; text: string; tex: string; want: number[]; why: string }
  | { kind: 'cell'; text: string; i: number; j: number }
  | { kind: 'value'; text: string; tex: string; want: number; why: string };

function makeTask(seed: number, round: number) {
  const r = rng(seed);
  const n = 6;
  const x = Array.from({ length: n }, () => randInt(r, 1, 9) / 10);
  let task: Task;
  switch (round) {
    case 0: {
      const a = randInt(r, 2, 3);
      const b = a + randInt(r, 1, 2);
      task = { kind: 'select', text: `Marca las casillas de $x_{${a}:${b}}$.`, tex: `x_{${a}:${b}}`, want: Array.from({ length: b - a + 1 }, (_, k) => a - 1 + k), why: `$x_{${a}:${b}}=(${Array.from({ length: b - a + 1 }, (_, k) => `x_{${a + k}}`).join(',')})$: incluye ambos extremos.` };
      break;
    }
    case 1: {
      const i = randInt(r, 1, 4);
      const off = pick(r, [1, 2]);
      task = { kind: 'select', text: `Con $i=${i}$, marca la casilla de $x_{i+${off}}$.`, tex: `x_{i+${off}}`, want: [i + off - 1], why: `$i+${off}=${i + off}$: la dirección se calcula antes de leer.` };
      break;
    }
    case 2: {
      const i = randInt(r, 1, 3);
      let j = randInt(r, 1, 4);
      if (j === i) j = (j % 4) + 1;
      task = { kind: 'cell', text: `Marca la entrada $A_{${i}${j}}$ de la matriz.`, i, j };
      break;
    }
    case 3: {
      const t = pick(r, [0.4, 0.5, 0.6]);
      const want = x.map((v, k) => (v > t ? k : -1)).filter((k) => k >= 0);
      task = { kind: 'select', text: `Marca los **índices** $i$ con $x_i>${t}$ (selecciona sus casillas).`, tex: `\\{i:\\ x_i>${t}\\}`, want, why: `Los índices son direcciones: ${want.length ? want.map((k) => k + 1).join(', ') : 'ninguno'}. Los valores solo deciden cuáles.` };
      break;
    }
    case 4: {
      const c = pick(r, [2, 3, 10]);
      const i = randInt(r, 1, n);
      task = { kind: 'value', text: `Calcula $(${c}\\mathbf x)_{${i}}$.`, tex: `(${c}\\mathbf x)_{${i}}`, want: c * x[i - 1], why: `Componente a componente: $(${c}\\mathbf x)_{${i}}=${c}\\,x_{${i}}=${c}\\cdot${fmt(x[i - 1], 1)}$.` };
      break;
    }
    default: {
      // whole-list operation: normalized component, with a list summing to 2 or 4
      const m = 4;
      const ys = pick(r, [
        [0.2, 0.6, 0.8, 0.4],
        [0.5, 0.5, 1, 2],
        [1, 0.4, 0.2, 0.4],
      ]);
      for (let k = 0; k < m; k++) x[k] = ys[k];
      x.length = m;
      const i = randInt(r, 1, m);
      const s = ys.reduce((a, b) => a + b, 0);
      task = { kind: 'value', text: `Calcula $N(\\mathbf x)_{${i}}$ con $N(\\mathbf x)=\\mathbf x/\\sum_j x_j$.`, tex: `N(\\mathbf x)_{${i}}`, want: ys[i - 1] / s, why: `$N(\\mathbf x)_{${i}}=x_{${i}}/\\sum_j x_j=${fmt(ys[i - 1], 1)}/${fmt(s, 1)}$: depende de **toda** la lista.` };
    }
  }
  return { x, task };
}

function Addressing({ seed, round, api }: ChallengeProps) {
  const { x, task } = useMemo(() => makeTask(seed, round), [seed, round]);
  const [sel, setSel] = useState<number[]>([]);
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [val, setVal] = useState('');
  const A = useMemo(() => {
    const r = rng(seed ^ 0x9e3779b9);
    return Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => randInt(r, 1, 9) / 10));
  }, [seed]);
  useEffect(() => {
    api.prompt(task.text, task.kind === 'cell' ? `A_{${task.i}${task.j}}` : task.tex);
    api.hints(
      task.kind === 'cell'
        ? ['Primer índice: **fila**; segundo: **columna**.', `Fila ${task.i} (observación $o_${task.i}$), columna ${task.j} (estado $s_${task.j}$).`]
        : task.kind === 'select'
          ? ['El subíndice es una dirección: cuenta desde 1.', task.why]
          : ['Opera sobre los valores de las casillas indicadas.', task.why],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);
  const submit = () => {
    if (task.kind === 'select') {
      const a = [...sel].sort();
      const b = [...task.want].sort();
      if (a.length === b.length && a.every((v, k) => v === b[k])) return api.result(true, task.why);
      const extra = a.find((v) => !b.includes(v));
      const miss = b.find((v) => !a.includes(v));
      return api.result(false, extra !== undefined ? `La casilla ${extra + 1} no corresponde a $${task.tex}$.` : `Falta la casilla ${miss! + 1}.`);
    }
    if (task.kind === 'cell') {
      if (!cell) return api.result(false, 'Marca una entrada de la matriz.');
      if (cell[0] === task.i && cell[1] === task.j) return api.result(true, `$A_{${task.i}${task.j}}=${fmt(A[task.i - 1][task.j - 1], 1)}$: fila ${task.i}, columna ${task.j}.`);
      if (cell[0] === task.j && cell[1] === task.i) return api.result(false, `Marcaste $A_{${cell[0]}${cell[1]}}$: invertiste fila y columna. El **primer** índice es la fila.`);
      return api.result(false, `Marcaste $A_{${cell[0]}${cell[1]}}$ (fila ${cell[0]}, columna ${cell[1]}).`);
    }
    const v = Number(val.replace(',', '.'));
    if (!Number.isFinite(v) || val.trim() === '') return api.result(false, 'Escribe un número.');
    if (Math.abs(v - task.want) < 0.006) return api.result(true, task.why);
    api.result(false, `Escribiste $${fmt(v, 3)}$; ${task.why}`);
  };
  return (
    <Stage>
      {task.kind !== 'cell' ? (
        <>
          <Html x={800} y={200} size={30} color={C.text}>
            <Tex tex={`\\mathbf x=(${x.map((v) => fmt(v, 1)).join(',\\,')})`} />
          </Html>
          <BoxRow
            x={800}
            y={420}
            values={x}
            fmtValue={(v) => fmt(v, 1)}
            selected={sel}
            onBox={
              task.kind === 'select'
                ? (i) => {
                    api.sfx.click();
                    setSel(sel.includes(i) ? sel.filter((k) => k !== i) : [...sel, i]);
                  }
                : undefined
            }
          />
        </>
      ) : (
        (() => {
          const cw = 150;
          const ch = 100;
          const gx = 800 - 2 * cw;
          const gy = 220;
          return (
            <>
              {A.map((row, i) =>
                row.map((v, j) => {
                  const on = cell && cell[0] === i + 1 && cell[1] === j + 1;
                  return (
                    <g
                      key={`${i}-${j}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        api.sfx.click();
                        setCell([i + 1, j + 1]);
                      }}
                    >
                      <rect x={gx + j * cw + 5} y={gy + i * ch + 5} width={cw - 10} height={ch - 10} rx={8} fill={on ? C.violet : C.panel} fillOpacity={on ? 0.3 : 1} stroke={on ? C.text : C.line} strokeWidth={on ? 3 : 1.5} />
                      <Html x={gx + j * cw + cw / 2} y={gy + i * ch + ch / 2} size={26} color={C.text}>
                        <Tex tex={fmt(v, 1)} />
                      </Html>
                    </g>
                  );
                }),
              )}
              {[1, 2, 3].map((i) => (
                <Html key={'r' + i} x={gx - 50} y={gy + (i - 1) * ch + ch / 2} size={22} color={C.amber}>
                  <Tex tex={`i=${i}`} />
                </Html>
              ))}
              {[1, 2, 3, 4].map((j) => (
                <Html key={'c' + j} x={gx + (j - 1) * cw + cw / 2} y={gy - 30} size={22} color={C.cyan}>
                  <Tex tex={`j=${j}`} />
                </Html>
              ))}
            </>
          );
        })()
      )}
      {task.kind === 'value' && (
        <Html x={800} y={600} size={26} interactive>
          <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center' }}>
            <Tex tex={`${task.tex}=`} />
            <input className="stage-input" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus />
          </div>
        </Html>
      )}
      <Html x={800} y={740} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l03',
  world: 'foundations',
  code: '1.3',
  title: 'Índices',
  subtitle: 'listas indexadas',
  glyph: 'x_i',
  kind: 'level',
  objective: 'Leer índices como **direcciones**: subíndices, rangos $x_{1:N}$, entradas $A_{ij}$, etiquetas $\\mathbf B^u$, y distinguir operaciones componente a componente de operaciones sobre la lista entera.',
  glyphs: ['index', 'tuple', 'slice', 'bold', 'suplabel', 'entry'],
  codex: ['w01-indices'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Mis creencias no son un número: son **listas**, una probabilidad por estado. Mis matrices relacionan listas con listas.',
        'Un índice es una **dirección**: $i$ dice dónde mirar; $x_i$ es lo que hay ahí. Confundir dirección y contenido rompe cualquier ecuación del libro.',
      ],
    },
    {
      kind: 'demo',
      title: 'Casillero',
      Scene: IndexDemo,
      beats: [
        { say: 'Una lista: cinco casillas con dirección (abajo) y contenido (dentro). En negrita, la lista entera.', tex: '\\g{bold}{\\mathbf x}=\\g{tuple}{(x_1,\\dots,x_5)}', dur: 1.6 },
        { say: 'El índice apunta: con $i=3$, $x_i$ es el **contenido** de la casilla 3.', tex: '\\Cin{i}=3\\ \\Rightarrow\\ \\g{index}{x_{\\Cin{i}}}=\\Cout{0.1}', dur: 1.6 },
        {
          say: 'Un rango de índices selecciona un tramo.',
          tex: 'x_{2:4}=\\;?',
          ask: {
            prompt: '¿Qué es $x_{2:4}$?',
            options: ['$(x_2,x_3,x_4)$', '$x_2\\,x_3\\,x_4$', '$x_2+x_3+x_4$'],
            answer: 0,
            explain: '$x_{2:4}:=(x_2,x_3,x_4)$ es una **sublista**, con ambos extremos incluidos. En el libro $o_{1:\\tau}$ es la historia de observaciones.',
          },
        },
        { say: 'Las operaciones **componente a componente** actúan sobre cada casilla por separado.', tex: '(2\\mathbf x)_i=2\\,x_i,\\qquad(\\ln\\mathbf x)_i=\\ln x_i', dur: 2.6 },
        {
          say: 'Otras operaciones toman la **lista entera**: normalizar divide cada casilla por la suma de todas. Cambia una entrada y mira qué pasa.',
          tex: 'N(\\mathbf x)_i=\\frac{x_i}{\\sum_j x_j}\\quad\\Rightarrow\\quad f(\\mathbf x)_i\\neq f(x_i)',
          gate: 'Arrastra la casilla $x_2$ hacia arriba o abajo: observa cómo cambian **todas** las salidas.',
        },
        { say: 'Dos índices direccionan una tabla. Convención del libro para $\\mathbf A$: fila = observación, columna = estado.', tex: '\\g{entry}{A_{ij}}=p(o=i\\mid s=j)', dur: 1.8 },
        {
          say: 'No todo superíndice es una potencia.',
          tex: '\\g{suplabel}{\\mathbf B^{u}}',
          ask: {
            prompt: 'En $\\mathbf B^{u}$, ¿qué es $u$?',
            options: ['Una etiqueta: la acción que elige la matriz', 'Un exponente', 'Un índice de fila'],
            answer: 0,
            explain: 'Hay una matriz de transición por acción: $\\mathbf B^{u=1},\\mathbf B^{u=2},\\dots$. El contexto (y el registro de notación) distingue etiqueta de potencia.',
          },
        },
        {
          say: 'En matemáticas se cuenta desde 1; en Python, desde 0. Al pasar del libro al código, todos los índices se desplazan.',
          tex: 'x_1\\leftrightarrow\\texttt{x[0]},\\qquad \\g{slice}{x_{1:N}}\\leftrightarrow\\texttt{x[0:N]}',
          dur: 1.8,
        },
      ],
    },
    { kind: 'challenge', title: 'Direcciones', Comp: Addressing, rounds: 6 },
    { kind: 'codex', entry: 'w01-indices' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-indices',
    world: 'foundations',
    level: 'w01-l03',
    title: 'Índices y listas',
    summary: 'Un índice es una dirección; $x_i$ es el contenido de esa dirección. La negrita nombra la lista entera.',
    blocks: [
      { label: 'Lista', tex: '\\mathbf x=(x_1,\\dots,x_n),\\qquad x_{1:N}:=(x_1,\\dots,x_N)' },
      { label: 'Tiempo y trayectorias', tex: 'x_\\tau,\\qquad \\tilde x:=(x_1,\\dots,x_T)', body: 'La tilde nombra una trayectoria, no una aproximación.' },
      { label: 'Componente a componente', tex: '(c\\mathbf x)_i=c\\,x_i,\\quad(\\mathbf x-\\mathbf y)_i=x_i-y_i,\\quad(\\ln\\mathbf x)_i=\\ln x_i' },
      { label: 'Sobre la lista entera', tex: 'f(\\mathbf x)_i\\neq f(x_i)\\ \\text{en general};\\quad \\text{p. ej. } N(\\mathbf x)_i=x_i/\\textstyle\\sum_j x_j' },
      { label: 'Tablas', tex: 'A_{ij}:\\ \\text{fila }i,\\ \\text{columna }j;\\qquad \\mathbf A_{ij}=p(o=i\\mid s=j)' },
      { label: 'Etiquetas', tex: '\\mathbf B^{u}', body: 'Superíndice-etiqueta (una matriz por acción), no potencia.' },
      { label: 'Código', tex: 'x_1\\leftrightarrow\\texttt{x[0]}', body: 'Matemáticas cuenta desde 1; Python desde 0.' },
    ],
    pitfalls: [
      'Confundir el índice $i$ (dirección) con el valor $x_i$ (contenido).',
      'Leer $\\mathbf B^{u}$ como potencia.',
      'Invertir fila y columna en $A_{ij}$.',
      'Olvidar el desfase de 1 al pasar a código.',
    ],
    aif: [
      { tex: '\\sigma(\\ln\\mathbf E-\\gamma\\mathbf G)', text: '$\\ln$ y la resta actúan componente a componente; $\\sigma$ actúa sobre la lista entera (guía G10).' },
      { tex: '\\mathbf A_{ij}=p(o=i\\mid s=j)', text: 'Matriz de verosimilitud: cada **columna** es una distribución sobre observaciones.' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'index', world: 'foundations', tex: 'x_i', name: 'Subíndice', read: 'equis sub i', meaning: 'El contenido de la dirección $i$ de la lista $\\mathbf x$.' },
  { id: 'tuple', world: 'foundations', tex: '(x_1,\\dots,x_n)', name: 'Lista (tupla)', read: 'equis uno hasta equis ene', meaning: 'Colección ordenada de $n$ componentes.' },
  { id: 'slice', world: 'foundations', tex: 'x_{1:N}', name: 'Rango de una lista', read: 'equis de uno a ene', meaning: '$x_{1:N}:=(x_1,\\dots,x_N)$, ambos extremos incluidos.', aif: '$o_{1:\\tau}$: observaciones hasta el tiempo $\\tau$.' },
  { id: 'bold', world: 'foundations', tex: '\\mathbf z', name: 'Negrita: lista o vector', read: 'zeta (vector)', meaning: 'Nombra la lista entera; $z_i$ es su componente $i$. Formalizado como vector columna en el sector 04.' },
  { id: 'suplabel', world: 'foundations', tex: '\\mathbf B^{u}', name: 'Superíndice-etiqueta', read: 'be de u', meaning: 'El superíndice elige una matriz de una familia (una por acción $u$).', warn: 'No es una potencia.' },
  { id: 'entry', world: 'foundations', tex: 'A_{ij}', name: 'Entrada de una tabla', read: 'a sub i jota', meaning: 'Fila $i$, columna $j$. En $\\mathbf A$ del libro: fila = observación, columna = estado.' },
];
