import { useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from '../../art/props';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';

// ============================================================================
// CASO 1.5 · «El libro de cuentas» — sumatorias e índices
// Libro con cajas por día x_i → acumular con Σ; límites; sacar constantes; tabla a_ij con
// sumas por fila y por columna; productoria Π para factores que se encadenan.
// ============================================================================

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const X = [12, 8, 15, 10, 9, 14, 6];
const colX = (i: number) => 330 + i * 140;

/** One week of the ledger: day, index, value and the crates stacked above. */
function Ledger({ xs, hi, onPick, top = 120, crates = true, dimOthers = false }: { xs: number[]; hi: (i: number) => boolean; onPick?: (i: number) => void; top?: number; crates?: boolean; dimOthers?: boolean }) {
  return (
    <g>
      <rect x={250} y={top + 300} width={1000} height={170} rx={8} fill="#e9e1cc" opacity={0.08} stroke="#e9e1cc33" />
      {xs.map((v, i) => {
        const on = hi(i);
        const cx = colX(i) + 40;
        return (
          <g key={i} onClick={onPick ? () => onPick(i) : undefined} style={{ cursor: onPick ? 'pointer' : undefined }} opacity={dimOthers && !on ? 0.3 : 1}>
            {onPick && <rect x={cx - 64} y={top} width={128} height={470} fill="transparent" />}
            {crates &&
              Array.from({ length: v }, (_, k) => (
                <rect key={k} x={cx - 26} y={top + 280 - (k + 1) * 17} width={52} height={14} rx={2} fill={on ? '#c98a3a' : '#5b4a33'} stroke="#0006" />
              ))}
            {on && <rect x={cx - 62} y={top + 304} width={124} height={162} rx={8} fill="none" stroke={C.amber} strokeWidth={3} />}
            <Html x={cx} y={top + 330} size={18} color={C.muted}>
              <span className="prop-tag">{DAYS[i]}</span>
            </Html>
            <Html x={cx} y={top + 372} size={22} color={on ? C.amber : C.dim}>
              <Tex tex={`x_{${i + 1}}`} />
            </Html>
            <Html x={cx} y={top + 422} size={34} color={on ? C.text : C.muted}>
              <span className="prop-tag">{v}</span>
            </Html>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------- demo
function LedgerDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(0);
  const [rowsDone, setRowsDone] = useState(false);
  const [colsDone, setColsDone] = useState(false);
  const onK = useSvgDrag(svg, (x) => {
    const v = clamp(Math.round((x - colX(0) - 40) / 140) + 1, 0, 7);
    setK(v);
    if (v === 7) unlock();
  });
  useEffect(() => {
    if (rowsDone && colsDone) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsDone, colsDone]);
  const partial = X.slice(0, k).reduce((a, b) => a + b, 0);

  if (beat <= 2)
    return (
      <Stage ref={svg}>
        <Ledger xs={X} hi={(i) => (beat === 0 ? i < k : beat === 1 ? answer !== null && i >= 2 && i <= 4 : true)} top={110} />
        {beat === 0 && (
          <g>
            <line x1={colX(0) + 40} x2={colX(6) + 40} y1={640} y2={640} stroke={C.line} strokeWidth={3} />
            <Knob x={k === 0 ? colX(0) - 30 : colX(k - 1) + 40} y={640} color={C.amber} onPointerDown={onK} cursor="ew-resize" label={k === 0 ? '' : `i=${k}`} />
            <rect x={240} y={610} width={1050} height={60} fill="transparent" onPointerDown={onK} />
            <Html x={800} y={730} size={30} color={C.text}>
              <Tex tex={k === 0 ? '\\text{total}=0' : `${X.slice(0, k).map((_, i) => `x_{${i + 1}}`).join('+')}=${partial}`} />
            </Html>
            {/* running total */}
            <rect x={1340} y={590 - partial * 6} width={80} height={partial * 6} fill={C.amber} opacity={0.75} />
            <rect x={1340} y={590 - 74 * 6} width={80} height={74 * 6} fill="none" stroke={C.line} strokeDasharray="6 6" />
            <Html x={1380} y={620} size={26} color={C.amber}>
              <span className="prop-tag">{partial}</span>
            </Html>
          </g>
        )}
        {beat === 1 && answer !== null && (
          <Html x={800} y={700} size={30} color={C.amber}>
            <Tex tex="\displaystyle\sum_{i=3}^{5}x_i=x_3+x_4+x_5=15+10+9=34" />
          </Html>
        )}
        {beat === 2 && (
          <Group opacity={answer !== null ? 1 : 0.4}>
            <Html x={800} y={690} size={28} color={C.text}>
              <Tex tex="\displaystyle\sum_{i=1}^{7}12\,x_i=12\cdot12+12\cdot8+\dots+12\cdot6" />
            </Html>
            <Html x={800} y={770} size={30} color={answer !== null ? C.green : C.text}>
              <Tex tex="\displaystyle=12\sum_{i=1}^{7}x_i=12\cdot74=888" />
            </Html>
          </Group>
        )}
      </Stage>
    );

  if (beat === 3) {
    const T = [
      [4, 6, 5, 3],
      [2, 3, 6, 4],
      [7, 1, 2, 5],
    ];
    const rowS = T.map((r) => r.reduce((a, b) => a + b, 0));
    const colS = T[0].map((_, j) => T.reduce((a, r) => a + r[j], 0));
    const gx = (j: number) => 520 + j * 150;
    const gy = (i: number) => 260 + i * 110;
    return (
      <Stage>
        {['Camión A', 'Camión B', 'Camión D'].map((n, i) => (
          <Html key={n} x={420} y={gy(i)} size={22} anchor="right" color={C.muted}>
            <span>
              {n} <Tex tex={`i=${i + 1}`} />
            </span>
          </Html>
        ))}
        {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((n, j) => (
          <Html key={n} x={gx(j)} y={170} size={20} color={C.muted}>
            <span>
              {n} <Tex tex={`j=${j + 1}`} />
            </span>
          </Html>
        ))}
        {T.map((r, i) =>
          r.map((v, j) => (
            <g key={`${i}${j}`}>
              <rect x={gx(j) - 60} y={gy(i) - 42} width={120} height={84} rx={8} fill="#120f22" stroke={C.line} />
              <Html x={gx(j)} y={gy(i)} size={34} color={C.text}>
                <span className="prop-tag">{v}</span>
              </Html>
            </g>
          )),
        )}
        <Html x={gx(1) - 20} y={gy(2) + 110} size={22} color={C.dim}>
          <Tex tex="a_{ij}:\ \text{cajas del camión } i \text{ en la semana } j" />
        </Html>
        {rowsDone &&
          rowS.map((s, i) => (
            <Html key={i} x={gx(4) + 10} y={gy(i)} size={34} color={C.cyan}>
              <span className="prop-tag">{s}</span>
            </Html>
          ))}
        {colsDone &&
          colS.map((s, j) => (
            <Html key={j} x={gx(j)} y={gy(3) + 30} size={34} color={C.magenta}>
              <span className="prop-tag">{s}</span>
            </Html>
          ))}
        {rowsDone && (
          <Html x={gx(4) + 10} y={gy(3) + 30} size={22} color={C.cyan}>
            <Tex tex={`\\sum_i\\sum_j a_{ij}=${rowS.reduce((a, b) => a + b, 0)}`} />
          </Html>
        )}
        {colsDone && (
          <Html x={gx(4) + 10} y={gy(3) + 80} size={22} color={C.magenta}>
            <Tex tex={`\\sum_j\\sum_i a_{ij}=${colS.reduce((a, b) => a + b, 0)}`} />
          </Html>
        )}
        <Html x={600} y={800} size={22} interactive>
          <button className={`stage-btn ${rowsDone ? 'on' : ''}`} onClick={() => setRowsDone(true)}>
            Σ por filas (cada camión)
          </button>
        </Html>
        <Html x={1000} y={800} size={22} interactive>
          <button className={`stage-btn ${colsDone ? 'on' : ''}`} onClick={() => setColsDone(true)}>
            Σ por columnas (cada semana)
          </button>
        </Html>
      </Stage>
    );
  }

  // beat 4: product of growth factors
  const r = [2, 1.5, 0.5];
  const vals = [100, 200, 300, 150];
  const show = answer !== null ? 1 : at(4) > 0 ? 0.35 : 0;
  return (
    <Stage>
      <Html x={800} y={140} size={22} color={C.muted}>
        <span>La cuenta del Contador, semana a semana (en miles)</span>
      </Html>
      {vals.map((v, i) => (
        <g key={i} opacity={i === 0 || answer !== null ? 1 : 0.25}>
          <rect x={360 + i * 280 - 50} y={640 - v * 1.4} width={100} height={v * 1.4} fill={C.cyan} opacity={0.65} />
          <Html x={360 + i * 280} y={670} size={28} color={C.text}>
            <span className="prop-tag">{answer !== null || i === 0 ? v : '?'}</span>
          </Html>
        </g>
      ))}
      {r.map((f, i) => (
        <Html key={i} x={360 + i * 280 + 140} y={360} size={30} color={C.amber}>
          <span className="prop-tag">×{dec(f)}</span>
        </Html>
      ))}
      <Group opacity={show}>
        <Html x={800} y={760} size={30} color={C.text}>
          <Tex tex="\displaystyle\prod_{k=1}^{3}r_k=2\cdot1{,}5\cdot0{,}5=1{,}5" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
interface SumForm {
  tex: string;
  days: number[];
  explain: string;
}
function sumForms(r: () => number): SumForm {
  const kind = Math.floor(r() * 4);
  if (kind === 0) {
    const a = randInt(r, 1, 4);
    const b = randInt(r, a + 1, 7);
    return { tex: `\\sum_{i=${a}}^{${b}}x_i`, days: Array.from({ length: b - a + 1 }, (_, k) => a + k), explain: `$i$ va de ${a} a ${b}, ambos incluidos.` };
  }
  if (kind === 1) {
    const n = randInt(r, 2, 3);
    return { tex: `\\sum_{i=1}^{${n}}x_{2i}`, days: Array.from({ length: n }, (_, k) => 2 * (k + 1)), explain: 'Con $i=1,2,\\dots$ el subíndice es $2i$: días 2, 4, 6…' };
  }
  if (kind === 2) {
    const n = randInt(r, 2, 4);
    return { tex: `\\sum_{i=0}^{${n - 1}}x_{7-i}`, days: Array.from({ length: n }, (_, k) => 7 - k), explain: 'Con $i=0$ el término es $x_7$; luego $x_6$… se recorre desde el domingo hacia atrás.' };
  }
  const n = randInt(r, 2, 3);
  return { tex: `\\sum_{i=1}^{${n}}x_{2i-1}`, days: Array.from({ length: n }, (_, k) => 2 * k + 1), explain: 'El subíndice $2i-1$ da los días impares: 1, 3, 5…' };
}

function Audit({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const xs = Array.from({ length: 7 }, () => randInt(r, 4, 16));
    const form = sumForms(r);
    const T = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => randInt(r, 1, 9)));
    const hole: [number, number] = [randInt(r, 0, 2), randInt(r, 0, 3)];
    const p = pick(r, [2, 3, 5]);
    const f = pick(r, [4, 6, 10]);
    return { xs, form, T, hole, p, f };
  }, [seed]);
  const [sel, setSel] = useState<number[]>([]);
  const [val, setVal] = useState('');
  const S = data.xs.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (round === 0) {
      api.prompt('La auditoría pide revisar esta suma del libro. Marca los días que entran en ella.', data.form.tex);
      api.hints(['Escribe los valores de $i$ uno por uno y reemplázalos en el subíndice.', data.form.explain]);
    } else if (round === 1) {
      const [hi] = data.hole;
      const rowSum = data.T[hi].reduce((a, b) => a + b, 0);
      api.prompt(`Una mancha tapa una celda. Al margen, el Contador anotó que el camión ${hi + 1} llevó en total ${rowSum} cajas. ¿Qué número está bajo la mancha?`, `\\sum_{j=1}^{4}a_{${hi + 1}j}=${rowSum}`);
      api.hints(['La suma de la fila completa es el total anotado.', 'Resta al total las tres celdas visibles de esa fila.']);
    } else {
      api.prompt(`Cada caja se pagó a ${data.p} mil pesos y además cada día hubo un costo fijo de ${data.f} mil. ¿Cuánto se pagó en la semana, en miles?`, `\\sum_{i=1}^{7}\\left(${data.p}\\,x_i+${data.f}\\right)`);
      api.hints([`Separa: $\\sum (${data.p}x_i+${data.f})=${data.p}\\sum x_i+\\sum ${data.f}$.`, `$\\sum_{i=1}^{7}${data.f}=7\\cdot${data.f}$: el costo fijo se suma una vez por día.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      const want = [...data.form.days].sort();
      const got = sel.map((i) => i + 1).sort();
      if (want.length === got.length && want.every((d, i) => d === got[i])) {
        const total = data.form.days.reduce((a, d) => a + data.xs[d - 1], 0);
        return api.result(true, `Días ${data.form.days.join(', ')}: suman ${total} cajas.`);
      }
      const extra = got.find((d) => !want.includes(d));
      const miss = want.find((d) => !got.includes(d));
      return api.result(false, extra !== undefined ? `El día ${extra} ($x_{${extra}}$) no aparece en la suma. ${data.form.explain}` : `Falta el día ${miss}: también es un término. ${data.form.explain}`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 1) {
      const [hi, hj] = data.hole;
      const truth = data.T[hi][hj];
      const rowSum = data.T[hi].reduce((a, b) => a + b, 0);
      if (v === truth) return api.result(true, `${rowSum} − ${data.T[hi].filter((_, j) => j !== hj).join(' − ')} = ${truth}.`);
      return api.result(false, `Con ${dec(v)} la fila sumaría ${rowSum - truth + v}, no ${rowSum}.`);
    }
    const truth = data.p * S + 7 * data.f;
    if (v === truth) return api.result(true, `${data.p}·${S} + 7·${data.f} = ${truth} mil.`);
    if (v === data.p * S + data.f) return api.result(false, `El costo fijo es diario: se suma 7 veces, no una. $\\sum_{i=1}^{7}${data.f}=${7 * data.f}$.`);
    if (v === data.p * S) return api.result(false, `Eso paga solo las cajas. Faltan los costos fijos: $7\\cdot${data.f}$.`);
    return api.result(false, `No cuadra: ${data.p} por ${S} cajas da ${data.p * S}; más el costo fijo de 7 días.`);
  };

  if (round === 0)
    return (
      <Stage>
        <Panel x={560} y={20} w={480} h={130} title="AUDITORÍA">
          <Html x={800} y={90} size={34} color={C.amber}>
            <Tex tex={`\\displaystyle ${data.form.tex}`} />
          </Html>
        </Panel>
        <Ledger xs={data.xs} top={160} hi={(i) => sel.includes(i)} onPick={(i) => setSel((s) => (s.includes(i) ? s.filter((v) => v !== i) : [...s, i]))} />
        <Confirm onClick={submit} disabled={sel.length === 0} />
      </Stage>
    );
  if (round === 1) {
    const [hi, hj] = data.hole;
    const gx = (j: number) => 560 + j * 160;
    const gy = (i: number) => 260 + i * 120;
    return (
      <Stage>
        {data.T.map((row, i) => (
          <Html key={i} x={440} y={gy(i)} size={22} anchor="right" color={i === hi ? C.amber : C.muted}>
            <span>Camión {i + 1}</span>
          </Html>
        ))}
        {[1, 2, 3, 4].map((j) => (
          <Html key={j} x={gx(j - 1)} y={170} size={20} color={C.muted}>
            <span>Sem {j}</span>
          </Html>
        ))}
        {data.T.map((row, i) =>
          row.map((v, j) => {
            const blot = i === hi && j === hj;
            return (
              <g key={`${i}${j}`}>
                <rect x={gx(j) - 64} y={gy(i) - 46} width={128} height={92} rx={8} fill="#120f22" stroke={i === hi ? C.amber : C.line} />
                {blot ? <ellipse cx={gx(j)} cy={gy(i)} rx={50} ry={36} fill="#05030c" /> : <Html x={gx(j)} y={gy(i)} size={34} color={C.text}><span className="prop-tag">{v}</span></Html>}
              </g>
            );
          }),
        )}
        <Html x={gx(4) - 10} y={gy(hi)} size={26} anchor="left" color={C.amber}>
          <span className="prop-tag">Σ = {data.T[hi].reduce((a, b) => a + b, 0)}</span>
        </Html>
        <NumberField x={560} y={700} value={val} onChange={setVal} onEnter={submit} label="Bajo la mancha:" unit="cajas" />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  return (
    <Stage>
      <Ledger xs={data.xs} top={60} hi={() => true} />
      <Html x={800} y={590} size={28} color={C.amber}>
        <Tex tex={`\\displaystyle\\sum_{i=1}^{7}x_i=${S}\\ \\text{cajas}`} />
      </Html>
      <NumberField x={420} y={720} value={val} onChange={setVal} onEnter={submit} label="Pago total:" unit="mil pesos" />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c5',
  world: 'foundations',
  code: '1.5',
  title: 'El libro de cuentas',
  subtitle: 'Sumatorias e índices',
  glyph: '\\textstyle\\sum',
  kind: 'level',
  guide: 'iris',
  teaser: 'El Contador anotaba cada caja a mano. Para leer su libro hay que dominar la notación que resume mil sumas en un símbolo.',
  learn: 'Notación $\\sum$ con índice y límites, sacar constantes de una suma, tablas con doble índice $a_{ij}$ y sumas por filas y columnas, productoria $\\prod$.',
  glyphs: ['sum', 'index', 'prod'],
  pitfalls: ['El índice $i$ es un contador: el resultado no depende de $i$.', 'Los dos límites se incluyen: $\\sum_{i=3}^{5}$ tiene tres términos.', '$\\sum_{i=1}^{7}c=7c$, no $c$.'],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'nar', text: 'Oficina NÓESIS, jueves, 20:15; huele a papel húmedo.' },
        { who: 'iris', text: 'Una página por semana, una columna por día. El Contador anotaba cada caja. Le gusta el orden.' },
        { who: 'teo', text: 'Hay una mancha sobre una cuenta, pero conservó los totales al margen. Podemos reconstruir lo que tapa.' },
        { who: 'iris', text: 'Y seguir los pagos. Las cajas tienen que terminar en algún bolsillo.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El libro',
      Scene: LedgerDemo,
      beats: [
        {
          say: 'Cada día anotó cuántas cajas salieron. Al día $i$ le corresponde el número $x_i$.',
          gate: 'Arrastra el contador desde el lunes hasta el domingo.',
          note: { label: 'Sumatoria', tex: '\\sum_{i=1}^{7}x_i=x_1+x_2+\\dots+x_7=74', body: '$i$ es el contador: recorre los días del 1 al 7 y va sumando cada $x_i$.' },
        },
        {
          say: 'Los números bajo y sobre la Σ dicen dónde empieza y dónde termina el contador.',
          ask: {
            prompt: '¿Qué días entran en $\\sum_{i=3}^{5}x_i$?',
            options: ['Miércoles, jueves y viernes', 'Solo miércoles y viernes', 'De lunes a viernes'],
            answer: 0,
            explain: 'El índice toma los valores 3, 4 y 5, y ambos extremos se incluyen.',
          },
          note: { label: 'Límites', tex: '\\sum_{i=3}^{5}x_i=x_3+x_4+x_5' },
        },
        {
          say: 'El Contador cobraba 12 mil pesos por caja.',
          ask: {
            prompt: '¿Cuál es la forma más corta de calcular lo cobrado en la semana?',
            options: ['Sumar las cajas y multiplicar una vez por 12', 'Multiplicar cada día por 12 y después sumar', 'Multiplicar 12 por 7 días'],
            answer: 0,
            explain: 'Las dos primeras dan lo mismo, porque el 12 está en todos los términos. Sacarlo de la suma ahorra seis multiplicaciones.',
          },
          note: { label: 'Sacar constantes', tex: '\\sum_i c\\,x_i=c\\sum_i x_i', body: 'Y si se suma una constante 7 veces: $\\sum_{i=1}^{7}c=7c$.' },
        },
        {
          say: 'Al final del libro hay una tabla: camiones en las filas, semanas en las columnas. Dos índices.',
          gate: 'Suma por filas y por columnas con los dos botones.',
          note: { label: 'Doble índice', tex: '\\sum_i\\sum_j a_{ij}=\\sum_j\\sum_i a_{ij}', body: '$a_{ij}$: fila $i$, columna $j$. Por filas o por columnas, el total es el mismo: 48.' },
        },
        {
          say: 'En la última página, la cuenta del Contador: cada semana se multiplica por un factor.',
          ask: {
            prompt: 'La cuenta se multiplica por 2, luego por 1,5 y luego por 0,5. ¿Cuánto cambió en total?',
            options: ['Se multiplicó por 1,5', 'Se multiplicó por 4', 'Se multiplicó por 3'],
            answer: 0,
            explain: 'Los factores se encadenan multiplicando: $2\\cdot1{,}5\\cdot0{,}5=1{,}5$. Sumarlos (4) no tiene sentido aquí.',
          },
          note: { label: 'Productoria', tex: '\\prod_{k=1}^{3}r_k=r_1\\,r_2\\,r_3', body: 'Lo mismo que $\\sum$, pero multiplicando.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Auditoría', Comp: Audit, rounds: 3 },
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'teo', text: 'Esa semana salieron 74 cajas a 12 mil pesos: 888 mil. El libro también registra el pago de 1 200 dosis.' },
        { who: 'iris', text: 'Todos los pagos van a la Clínica del Cerro. Una sola cuenta.' },
        { who: 'tu', text: 'La cuenta cobra por todo; falta ver cuánto recibió cada sede.' },
        { who: 'teo', text: 'Puerto, Cerro y Norte. El mismo nombre de clínica aparece sobre tres inventarios distintos.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'sum', world: 'foundations', tex: '\\sum_{i=1}^{n}x_i', name: 'Sumatoria', read: 'suma de i igual 1 hasta n de equis sub i', meaning: 'Suma de $x_1,x_2,\\dots,x_n$. El índice $i$ recorre los enteros entre los límites, ambos incluidos.' },
  { id: 'index', world: 'foundations', tex: 'a_{ij}', name: 'Subíndices', read: 'a sub i jota', meaning: 'Elemento en la fila $i$ y la columna $j$ de una tabla.' },
  { id: 'prod', world: 'foundations', tex: '\\prod_{k=1}^{n}r_k', name: 'Productoria', read: 'producto de k igual 1 hasta n de erre sub k', meaning: 'Producto $r_1\\cdot r_2\\cdots r_n$. Sirve para factores que se encadenan.' },
];
