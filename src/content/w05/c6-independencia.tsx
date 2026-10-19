import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
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
import { Confirm, Knob, NumberField, dec, parseNum, parseProb } from '../shared/ui';
import { ALL, type Cell, DiceGrid, Formula, Table, f2, fracTex } from './kit';

// ============================================================================
// CASO 5.6 · «¿Coincidencia?» — independencia
// A y B son independientes si saber B no cambia P(A): P(A|B)=P(A) ⇔ P(A∩B)=P(A)P(B).
// Mosaico: columnas = P(mesa), alturas = P(gana|mesa); independencia = borde recto.
// Ensayos repetidos independientes: p^k, y el azar no tiene memoria.
// ============================================================================

const sumOf = (c: Cell) => c[0] + c[1];

/** Unit square split in columns of width w_i and filled to height h_i (conditional on the column). */
function Mosaic({
  w,
  h,
  labels,
  onH,
  hiCol,
}: {
  w: number[];
  h: number[];
  labels: string[];
  onH?: (e: PointerEvent) => void;
  hiCol?: number;
}) {
  const X0 = 400;
  const Y0 = 160;
  const S = 560;
  let acc = 0;
  return (
    <g>
      <rect x={X0} y={Y0} width={S} height={S} fill="#120f22" stroke={C.line} />
      {w.map((wi, i) => {
        const x = X0 + acc * S;
        acc += wi;
        const hh = h[i] * S;
        return (
          <g key={i}>
            <rect
              x={x + 2}
              y={Y0 + S - hh}
              width={wi * S - 4}
              height={hh}
              fill={i === hiCol ? C.amber : C.green}
              opacity={0.55}
            />
            <rect
              x={x}
              y={Y0}
              width={wi * S}
              height={S}
              fill="none"
              stroke={C.line}
              strokeWidth={2}
            />
            <Html x={x + (wi * S) / 2} y={Y0 + S + 26} size={18} color={C.muted}>
              <span>{labels[i]}</span>
            </Html>
            <Html
              x={x + (wi * S) / 2}
              y={Y0 + S - hh - 18}
              size={18}
              color={i === hiCol ? C.amber : C.green}
            >
              <span className="prop-tag">{f2(h[i])}</span>
            </Html>
            {i === hiCol && onH && (
              <Knob
                x={x + (wi * S) / 2}
                y={Y0 + S - hh}
                color={C.amber}
                onPointerDown={onH}
                cursor="ns-resize"
              />
            )}
          </g>
        );
      })}
      <Html x={X0 - 14} y={Y0 + S} size={16} anchor="right" color={C.dim}>
        <span className="prop-tag">0</span>
      </Html>
      <Html x={X0 - 14} y={Y0} size={16} anchor="right" color={C.dim}>
        <span className="prop-tag">1</span>
      </Html>
      <Html x={X0 + S + 30} y={Y0 + 40} size={18} anchor="left" color={C.green}>
        <span>■ gana el jugador</span>
      </Html>
    </g>
  );
}

// ---------------------------------------------------------------- demo
function IndepDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [h7, setH7] = useState(0.6);
  const onH = useSvgDrag(svg, (_x, y) => {
    const v = Math.round(clamp((720 - y) / 560, 0, 1) * 20) / 20;
    setH7(v);
    if (Math.abs(v - 0.3) < 1e-9) unlock();
  });

  if (beat === 0)
    return (
      <Stage>
        <DiceGrid
          x={420}
          y={150}
          cell={110}
          labels="pair"
          tone={(c) =>
            c[0] % 2 === 0 && c[1] % 2 === 0
              ? C.violet
              : c[0] % 2 === 0
                ? C.red
                : c[1] % 2 === 0
                  ? C.cyan
                  : null
          }
        />
        <Html x={1130} y={250} size={20} anchor="left" color={C.red}>
          <span>■ rojo par</span>
        </Html>
        <Html x={1130} y={290} size={20} anchor="left" color={C.cyan}>
          <span>■ blanco par</span>
        </Html>
        <Html x={1130} y={330} size={20} anchor="left" color={C.violet}>
          <span>■ ambos</span>
        </Html>
        {answer !== null && (
          <Formula x={1290} y={460} size={24} tex="\tfrac{9}{36}=\tfrac12\cdot\tfrac12" />
        )}
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
          dim={(c) => answer !== null && c[0] !== 6}
          tone={(c) => (sumOf(c) >= 10 ? C.amber : null)}
        />
        <Formula
          x={1290}
          y={300}
          size={24}
          color={C.amber}
          tex="P(a+b\ge10)=\tfrac{6}{36}=\tfrac16"
        />
        {answer !== null && (
          <Formula
            x={1290}
            y={420}
            size={24}
            color={C.amber}
            tex="P(a+b\ge10\mid\text{rojo }6)=\tfrac36=\tfrac12"
          />
        )}
      </Stage>
    );
  if (beat === 2)
    return (
      <Stage ref={svg}>
        <Mosaic
          w={[0.4, 0.4, 0.2]}
          h={[0.3, 0.3, h7]}
          labels={['Mesa 1', 'Mesa 3', 'Mesa 7']}
          onH={onH}
          hiCol={2}
        />
        <line
          x1={400}
          x2={960}
          y1={720 - 0.3 * 560}
          y2={720 - 0.3 * 560}
          stroke={C.text}
          strokeDasharray="8 8"
          strokeWidth={2}
        />
        <Html x={1000} y={500} size={22} anchor="left" color={C.text}>
          <Tex tex={`P(\\text{gana}\\mid\\text{mesa 7})=${f2(h7).replace(',', '{,}')}`} />
        </Html>
      </Stage>
    );
  if (beat === 3)
    return (
      <Stage>
        <Table
          x={520}
          y={230}
          rows={['Mesa 7', 'Otras mesas']}
          cols={['Gana el jugador', 'Gana la casa']}
          cw={250}
          data={[
            [0.12, 0.08],
            [0.18, 0.62],
          ]}
          fmtV={f2}
          rowSums
          colSums
          total
          tone={(i, j) => (i === 0 && j === 0 ? C.amber : null)}
        />
        {answer !== null && (
          <Formula
            y={620}
            size={28}
            tex="P(\text{gana})\,P(\text{mesa 7})=0{,}30\cdot0{,}20=0{,}06\ne0{,}12"
          />
        )}
      </Stage>
    );
  const k = 5;
  return (
    <Stage>
      <Html x={800} y={150} size={22} color={C.muted}>
        <span>Ruleta de la mesa 2: los últimos resultados</span>
      </Html>
      {Array.from({ length: k }, (_, i) => (
        <g key={i}>
          <circle
            cx={520 + i * 140}
            cy={330}
            r={52}
            fill="#c8283c"
            stroke="#0006"
            strokeWidth={3}
          />
          <Html x={520 + i * 140} y={330} size={26} color="#fff">
            <span className="prop-tag">R</span>
          </Html>
        </g>
      ))}
      <circle
        cx={520 + k * 140}
        cy={330}
        r={52}
        fill="none"
        stroke={C.text}
        strokeDasharray="8 8"
        strokeWidth={3}
      />
      <Html x={520 + k * 140} y={330} size={34} color={C.text}>
        <span className="prop-tag">?</span>
      </Html>
      {answer !== null && (
        <>
          <Formula
            y={520}
            size={28}
            tex="P(\text{rojo en la 6.ª}\mid5\ \text{rojos})=P(\text{rojo})"
          />
          <Formula
            y={620}
            size={24}
            color={C.muted}
            tex="P(5\ \text{rojos seguidos})=\left(\tfrac12\right)^5=\tfrac1{32}\ \text{(ignorando el cero)}"
          />
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
interface EvPair {
  a: string;
  b: string;
  fa: (c: Cell) => boolean;
  fb: (c: Cell) => boolean;
}
const PAIRS: EvPair[] = [
  { a: 'suma 7', b: 'rojo 3', fa: (c) => sumOf(c) === 7, fb: (c) => c[0] === 3 },
  { a: 'dobles', b: 'rojo 6', fa: (c) => c[0] === c[1], fb: (c) => c[0] === 6 },
  { a: 'suma ≥ 10', b: 'rojo 6', fa: (c) => sumOf(c) >= 10, fb: (c) => c[0] === 6 },
  { a: 'dobles', b: 'algún 6', fa: (c) => c[0] === c[1], fb: (c) => c[0] === 6 || c[1] === 6 },
  { a: 'rojo par', b: 'blanco > 4', fa: (c) => c[0] % 2 === 0, fb: (c) => c[1] > 4 },
  { a: 'suma par', b: 'rojo par', fa: (c) => sumOf(c) % 2 === 0, fb: (c) => c[0] % 2 === 0 },
  { a: 'suma 8', b: 'rojo 1', fa: (c) => sumOf(c) === 8, fb: (c) => c[0] === 1 },
  { a: 'rojo > blanco', b: 'blanco 1', fa: (c) => c[0] > c[1], fb: (c) => c[1] === 1 },
];
const indep = (p: EvPair) => {
  const nA = ALL.filter(p.fa).length;
  const nB = ALL.filter(p.fb).length;
  const nAB = ALL.filter((c) => p.fa(c) && p.fb(c)).length;
  return { nA, nB, nAB, ok: nAB * 36 === nA * nB };
};

function Coincidence({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0: complete a table so that winning is independent of being VIP
    const p = pick(r, [0.2, 0.25, 0.3, 0.4]);
    const nV = pick(r, [40, 80, 100]);
    const nR = pick(r, [200, 300, 400]);
    const a = Math.round(nV * p);
    const c = Math.round(nR * p);
    // round 1: three pairs, mixed
    const pairs = shuffle(r, PAIRS).slice(0, 3);
    // round 2
    const pw = pick(r, [0.4, 0.5, 0.6, 0.3]);
    const k = randInt(r, 2, 4);
    const atLeast = r() < 0.5;
    return { p, nV, nR, a, c, pairs, pw, k, atLeast };
  }, [seed]);
  const [val, setVal] = useState('');
  const [marks, setMarks] = useState<(boolean | null)[]>([null, null, null]);

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        `Teo borró una celda. Si ganar fuera independiente de ser VIP, ¿cuántos VIP habrían ganado?`,
        'P(\\text{gana}\\mid\\text{VIP})=P(\\text{gana}\\mid\\text{regular})',
      );
      api.hints([
        'Calcula qué fracción de los regulares ganó.',
        `Esa misma fracción de los ${data.nV} VIP.`,
      ]);
    } else if (round === 1) {
      api.prompt(
        'Para cada par de apuestas con dos dados, decide si son independientes.',
        'P(A\\cap B)\\overset{?}{=}P(A)\\,P(B)',
      );
      api.hints([
        'Cuenta casillas: $|A\\cap B|\\cdot36$ debe ser igual a $|A|\\cdot|B|$.',
        'O compara: ¿saber $B$ cambia la fracción de casillas de $A$?',
      ]);
    } else {
      api.prompt(
        data.atLeast
          ? `Cada mano, un jugador gana con probabilidad ${dec(data.pw)}, independiente de las demás. ¿Qué probabilidad hay de que gane **al menos una** de ${data.k} manos?`
          : `Cada mano, un jugador gana con probabilidad ${dec(data.pw)}, independiente de las demás. ¿Qué probabilidad hay de que gane **las ${data.k}** manos seguidas?`,
        data.atLeast ? `1-(1-p)^{${data.k}}` : `p^{${data.k}}`,
      );
      api.hints(
        data.atLeast
          ? [
              '«Al menos una» es el complemento de «ninguna».',
              `Perder ${data.k} seguidas: $(1-p)^{${data.k}}$.`,
            ]
          : ['Las manos son independientes: multiplica.', `$p\\cdot p\\cdots p$, ${data.k} veces.`],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (marks.some((m) => m === null)) return;
      const bad = data.pairs.findIndex((p, i) => indep(p).ok !== marks[i]);
      if (bad < 0)
        return api.result(
          true,
          data.pairs
            .map((p) => `${p.a} / ${p.b}: ${indep(p).ok ? 'independientes' : 'dependientes'}`)
            .join(' · ') + '.',
        );
      const p = data.pairs[bad];
      const s = indep(p);
      return api.result(
        false,
        `«${p.a}» y «${p.b}»: $\\frac{${s.nAB}}{36}$ contra $\\frac{${s.nA}}{36}\\cdot\\frac{${s.nB}}{36}=${fracTex(s.nA * s.nB, 1296)}$: ${s.ok ? 'son iguales, son independientes' : 'no son iguales, son dependientes'}.`,
      );
    }
    if (round === 0) {
      const v = parseNum(val);
      if (v === null) return;
      if (Math.abs(v - data.a) < 0.5)
        return api.result(
          true,
          `Regulares: $\\frac{${data.c}}{${data.nR}}=${f2(data.p).replace(',', '{,}')}$. VIP: $${f2(data.p).replace(',', '{,}')}\\cdot${data.nV}=${data.a}$.`,
        );
      return api.result(
        false,
        `Con ${dec(v)} ganadores, $P(\\text{gana}\\mid\\text{VIP})=${dec(v / data.nV, 3)}$, pero entre los regulares es ${f2(data.p)}.`,
      );
    }
    const v = parseProb(val);
    if (v === null) return;
    const t = data.atLeast ? 1 - (1 - data.pw) ** data.k : data.pw ** data.k;
    if (Math.abs(v - t) < 0.002)
      return api.result(
        true,
        `$${data.atLeast ? `1-${dec(1 - data.pw)}^{${data.k}}` : `${dec(data.pw)}^{${data.k}}`}\\approx${dec(t, 3)}$.`.replace(
          /(\d),(\d)/g,
          '$1{,}$2',
        ),
      );
    if (data.atLeast && Math.abs(v - data.k * data.pw) < 0.002)
      return api.result(
        false,
        `Sumar ${data.k} veces ${dec(data.pw)} cuenta dos veces los casos en que gana varias. Usa el complemento.`,
      );
    return api.result(
      false,
      `$${data.atLeast ? `1-${dec(1 - data.pw)}^{${data.k}}` : `${dec(data.pw)}^{${data.k}}`}$ no da ${dec(v, 3)}.`.replace(
        /(\d),(\d)/g,
        '$1{,}$2',
      ),
    );
  };

  if (round === 0)
    return (
      <Stage>
        <Table
          x={520}
          y={230}
          rows={['VIP', 'Regular']}
          cols={['Ganó', 'Perdió']}
          data={[
            [data.a, data.nV - data.a],
            [data.c, data.nR - data.c],
          ]}
          hidden={(i, j) => i === 0}
          rowSums
          tone={(i) => (i === 0 ? C.amber : null)}
        />
        <NumberField
          x={520}
          y={560}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label="VIP que ganaron:"
          width={4}
        />
        <Confirm onClick={submit} />
      </Stage>
    );
  if (round === 1)
    return (
      <Stage>
        {data.pairs.map((p, i) => (
          <g key={i}>
            <Html x={300} y={260 + i * 150} size={28} anchor="left" color={C.text}>
              <span>
                «{p.a}» y «{p.b}»
              </span>
            </Html>
            <Html x={1000} y={260 + i * 150} size={22} anchor="left" interactive>
              <div className="stage-choices">
                <button
                  className={`stage-btn ${marks[i] === true ? 'on' : ''}`}
                  onClick={() => setMarks(marks.map((m, k) => (k === i ? true : m)))}
                >
                  independientes
                </button>
                <button
                  className={`stage-btn ${marks[i] === false ? 'on' : ''}`}
                  onClick={() => setMarks(marks.map((m, k) => (k === i ? false : m)))}
                >
                  dependientes
                </button>
              </div>
            </Html>
          </g>
        ))}
        <Confirm onClick={submit} disabled={marks.some((m) => m === null)} />
      </Stage>
    );
  return (
    <Stage>
      {Array.from({ length: data.k }, (_, i) => (
        <g key={i}>
          <rect
            x={800 - data.k * 90 + i * 180}
            y={260}
            width={150}
            height={200}
            rx={10}
            fill="#2a1640"
            stroke={C.magenta}
            strokeOpacity={0.6}
            strokeWidth={2}
          />
          <Html x={875 - data.k * 90 + i * 180} y={360} size={22} color={C.muted}>
            <span>mano {i + 1}</span>
          </Html>
        </g>
      ))}
      <NumberField
        x={560}
        y={620}
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
// Clase · independencia: moneda y dado (sí), deporte y música (no), y la tabla que lo sería.
// ---------------------------------------------------------------------------
const IND_TBL = { x: 380, y: 270, cw: 250, ch: 125 };
const IND_SLIDER = { x0: 1090, x1: 1420, y: 600, lo: 10, hi: 40 };

function CoinDieGrid() {
  return (
    <>
      {['C', 'S'].map((m, r) =>
        [1, 2, 3, 4, 5, 6].map((d) => {
          const hit = m === 'C' && d === 6,
            x = 200 + (d - 1) * 115,
            y = 280 + r * 115;
          return (
            <g key={`${m}${d}`}>
              <rect
                x={x + 5}
                y={y + 5}
                width={105}
                height={105}
                rx={10}
                fill={hit ? C.green : C.panel}
                fillOpacity={hit ? 0.8 : 1}
                stroke={m === 'C' ? C.amber : d === 6 ? C.magenta : C.line}
                strokeWidth={m === 'C' || d === 6 ? 3 : 2}
              />
              <Cap x={x + 57} y={y + 57} size={24} color={hit ? C.bg : C.text}>
                {`${m}${d}`}
              </Cap>
            </g>
          );
        }),
      )}
      <Cap x={545} y={560} size={21} color={C.muted}>
        Fila ámbar: cara. Columna magenta: sale 6.
      </Cap>
    </>
  );
}

function IndependenceLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(30);
  const { beat } = beats;
  const cell = beat >= 3 ? 20 : beat === 2 ? a : 30;
  const data = [
    [cell, 50 - cell],
    [40 - cell, 10 + cell],
  ];
  const drag = useSvgDrag(svg, (px) => {
    const t = clamp((px - IND_SLIDER.x0) / (IND_SLIDER.x1 - IND_SLIDER.x0), 0, 1);
    const next = Math.round(IND_SLIDER.lo + t * (IND_SLIDER.hi - IND_SLIDER.lo));
    setA(next);
    if (next === 20) unlock();
  });
  const knobX =
    IND_SLIDER.x0 +
    ((a - IND_SLIDER.lo) / (IND_SLIDER.hi - IND_SLIDER.lo)) * (IND_SLIDER.x1 - IND_SLIDER.x0);
  return (
    <Stage ref={svg}>
      {beat === 0 && <CoinDieGrid />}
      {beat === 0 && (
        <Cap x={1270} y={280} tex="P(C\cap6)=\tfrac1{12}=\tfrac12\cdot\tfrac16" color={C.green} />
      )}
      {beat >= 1 && (
        <>
          <Table
            x={IND_TBL.x}
            y={IND_TBL.y}
            cw={IND_TBL.cw}
            ch={IND_TBL.ch}
            rows={['Deporte', 'Sin deporte']}
            cols={['Música', 'Sin música']}
            data={data}
            rowSums
            colSums
            hidden={(i, j) => beat === 3 && answer === null && i === 1 && j === 0}
            tone={(i, j) => (i === 0 && j === 0 ? C.amber : null)}
          />
          <Cap
            x={1270}
            y={240}
            tex={`P(D\\cap M)=${dec(cell / 100, 2).replace(',', '{,}')}`}
            color={C.amber}
          />
          <Cap x={1270} y={330} tex="P(D)\,P(M)=0{,}5\cdot0{,}4=0{,}20" color={C.text} />
          <Cap
            x={1270}
            y={420}
            tex={`P(M\\mid D)=\\tfrac{${cell}}{50}=${dec(cell / 50, 2).replace(',', '{,}')}`}
            color={cell === 20 ? C.green : C.magenta}
          />
        </>
      )}
      {beat === 2 && (
        <>
          <line
            x1={IND_SLIDER.x0}
            x2={IND_SLIDER.x1}
            y1={IND_SLIDER.y}
            y2={IND_SLIDER.y}
            stroke={C.line}
            strokeWidth={4}
          />
          <Knob
            x={knobX}
            y={IND_SLIDER.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
            label={`${a}`}
          />
          <Cap x={1255} y={IND_SLIDER.y + 60} size={19} color={C.muted}>
            personas con deporte y música
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Eventos independientes',
  Scene: IndependenceLesson,
  beats: [
    {
      say: 'Saber que la moneda salió cara no cambia nada del dado. La probabilidad de las dos cosas es el producto.',
      board: { label: 'Independientes', tex: '\\p{1}{P(A\\cap B)}=\\p{2}{P(A)\\,P(B)}', parts: ['ambos eventos juntos', 'producto sin condicionar'] },
    },
    {
      say: 'En el curso de antes no pasa: 30 % hace deporte y música, pero el producto da 20 %.',
      board: { label: 'Dependientes', tex: '\\p{1}{0{,}30}\\p{2}{\\neq0{,}5\\cdot0{,}4=0{,}20}', parts: ['probabilidad conjunta real', 'producto de marginales'] },
    },
    {
      say: 'Mueve personas entre celdas sin cambiar los totales. Busca la tabla donde saber «deporte» no cambie la probabilidad de música.',
      gate: 'Arrastra la perilla hasta que P(M | D) sea igual a P(M) = 0,4.',
      board: { label: 'Condición', tex: '\\p{1}{P(M\\mid D)}=\\p{2}{P(M)}', parts: ['música entre deportistas', 'música en todo el curso'] },
    },
    {
      say: 'Con 20 personas en deporte y música, la tabla queda independiente.',
      ask: {
        prompt: '¿Cuántas personas hay en «sin deporte y música»?',
        options: ['20', '10', '30'],
        answer: 0,
        explain: 'La columna Música suma 40: si 20 hacen deporte, las otras 20 no.',
      },
      board: { label: 'Tabla independiente', tex: '\\p{1}{20}=\\p{2}{100\\cdot0{,}5\\cdot0{,}4}', parts: ['personas en ambas', 'total por probabilidades'] },
    },
    {
      say: 'Dos eventos son independientes cuando saber uno no cambia la probabilidad del otro.',
      board: {
        label: 'Definición',
        tex: '\\p{1}{A,B\\ \\text{independientes}}\\p{2}{\\iff P(B\\mid A)=P(B)}', parts: ['eventos sin influencia', 'saber uno no cambia'],
      },
    },
  ],
};

export const level: LevelSpec = {
  id: 'w5-c6',
  world: 'probability',
  code: '5.6',
  title: '¿Coincidencia?',
  subtitle: 'Independencia',
  glyph: '\\perp',
  kind: 'level',
  guide: 'iris',
  teaser:
    'En un casino honesto, la mesa donde juegas no cambia tus probabilidades. Si las cambia, alguien está tocando el azar.',
  learn:
    'Independencia como «saber $B$ no cambia $P(A)$», la prueba $P(A\\cap B)=P(A)P(B)$, el mosaico de probabilidades, ensayos repetidos y la falacia del jugador.',
  glyphs: ['indep'],
  pitfalls: [
    'Independientes no es lo mismo que disjuntos: dos eventos disjuntos con probabilidad positiva son dependientes.',
    'El azar no tiene memoria: cinco rojos seguidos no hacen más probable el negro.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'nar', text: 'Casino Aurora, 21:20. Vera baja la voz al pasar un guardia.' },
        {
          who: 'vera',
          text: 'Tengo las manos del viernes, separadas por mesa. Necesito saber si lo de la 7 se ve también ahí; ya están hablando de cambiarme de turno.',
        },
        {
          who: 'teo',
          text: '¡Se puede comparar! Cuántas manos llegan a cada mesa y cuántas gana el jugador.',
        },
        {
          who: 'iris',
          text: 'Miremos ese registro antes de que Ferrer te convierta en su explicación.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Independencia',
      Scene: IndepDemo,
      beats: [
        {
          say: 'Dos dados distintos no se comunican. Mira «rojo par» y «blanco par».',
          ask: {
            prompt:
              'Si sabes que el rojo salió par, ¿cambia la probabilidad de que el blanco sea par?',
            options: ['No: sigue siendo 1/2', 'Sí: sube', 'Sí: baja'],
            answer: 0,
            explain:
              'De las 18 casillas con rojo par, 9 tienen blanco par: la mitad, igual que sin saber nada. Y $P(\\text{ambos})=\\tfrac{9}{36}=\\tfrac12\\cdot\\tfrac12$.',
          },
          note: {
            label: 'Independencia',
            tex: '\\begin{aligned}&P(A\\mid B)=P(A)\\\\ \\iff\\ &P(A\\cap B)=P(A)\\,P(B)\\end{aligned}',
            body: 'Saber $B$ no cambia nada sobre $A$.',
          },
        },
        {
          say: '«Suma 10 o más» sí depende del dado rojo.',
          ask: {
            prompt: 'Si el rojo es 6, ¿la probabilidad de sumar 10 o más sube, baja o queda igual?',
            options: ['Sube de 1/6 a 1/2', 'Queda igual', 'Baja'],
            answer: 0,
            explain: 'Con rojo 6 basta un blanco de 4, 5 o 6: tres de seis casillas.',
          },
          note: {
            label: 'Dependencia',
            body: 'Si saber $B$ cambia $P(A)$, los eventos son dependientes.',
          },
        },
        {
          say: 'El mosaico: cada columna es una mesa (ancho = fracción de manos) y lo verde, la fracción que gana el jugador en esa mesa.',
          gate: 'Arrastra la altura de la mesa 7 hasta que ganar no dependa de la mesa.',
          note: {
            label: 'Mosaico',
            body: 'Si las alturas son iguales, el borde queda recto: ganar es independiente de la mesa. En los datos reales, la mesa 7 llegaba a 0,60.',
          },
        },
        {
          say: 'Datos reales del viernes, como probabilidades conjuntas.',
          ask: {
            prompt: '¿Ganar es independiente de jugar en la mesa 7?',
            options: [
              'No: 0,12 es el doble de 0,20 · 0,30',
              'Sí: 0,12 es poco',
              'No se puede saber sin más datos',
            ],
            answer: 0,
            explain:
              'Si fueran independientes, $P(\\text{gana},\\ \\text{mesa 7})$ sería $0{,}30\\cdot0{,}20=0{,}06$. Es el doble.',
          },
          note: {
            label: 'Prueba del producto',
            tex: '0{,}12\\ne0{,}30\\cdot0{,}20',
            body: 'En la mesa 7 se gana demasiado.',
          },
        },
        {
          say: 'Un cliente apuesta fuerte al negro: «Salieron cinco rojos seguidos, ya toca».',
          ask: {
            prompt: '¿Es más probable el negro en la próxima tirada?',
            options: [
              'No: la ruleta no recuerda',
              'Sí: tiene que compensar',
              'Sí, pero solo un poco',
            ],
            answer: 0,
            explain:
              'Cada giro es independiente de los anteriores. Lo raro era la racha completa, $(1/2)^5$, no la próxima tirada.',
          },
          note: {
            label: 'Sin memoria',
            tex: 'P(A_1\\cap\\dots\\cap A_k)=\\prod_{i=1}^{k}P(A_i)',
            body: 'Para ensayos independientes, las probabilidades se multiplican. Pero el próximo resultado no depende de la racha.',
          },
        },
      ],
    },
    { kind: 'challenge', title: '¿Coincidencia?', Comp: Coincidence, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'teo',
          text: 'En la mesa 7 el jugador gana el 60 % de las manos. El cruce real es 0,12; si ganar no dependiera de esa mesa, sería 0,06.',
        },
        { who: 'vera', text: 'El doble. Van a decir que repartí mal.' },
        { who: 'iris', text: '¿Quién trae las cartas?' },
        {
          who: 'vera',
          text: 'El Barón llega con un zapato especial y lo deja junto a mi codo. Nunca me permite elegir otro.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'indep',
    world: 'probability',
    tex: 'A\\perp B',
    name: 'Independencia',
    read: 'a independiente de be',
    meaning: '$P(A\\cap B)=P(A)P(B)$: saber uno no cambia la probabilidad del otro.',
    warn: 'No confundir con disjuntos.',
  },
];

export { lesson };
