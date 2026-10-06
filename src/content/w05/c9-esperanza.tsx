import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum } from '../shared/ui';
import { ALL, Bars, type Cell, DiceGrid, Formula, fracTex } from './kit';

// ============================================================================
// CASO 5.9 · «La ventaja de la casa» — variable aleatoria y esperanza
// La ganancia de una partida es una función de los resultados (variable aleatoria); su
// distribución; la esperanza como promedio ponderado (punto de equilibrio); el promedio a la
// larga; la ventaja de la ruleta; linealidad.
// ============================================================================

const sumOf = (c: Cell) => c[0] + c[1];
/** Doble Aurora: playing costs 2 chips; sum 7 pays 5, doubles pay 4, anything else nothing. */
const gain = (c: Cell) => (sumOf(c) === 7 ? 3 : c[0] === c[1] ? 2 : -2);
const SUPPORT = [-2, 2, 3];
const PROBS = [24 / 36, 6 / 36, 6 / 36];

/** Balance beam over the values of X, with weights p(x); the fulcrum can be dragged. */
function Beam({ xs, ps, f, onF, lo = -3, hi = 4 }: { xs: number[]; ps: number[]; f: number; onF?: (e: PointerEvent) => void; lo?: number; hi?: number }) {
  const X = (v: number) => 300 + ((v - lo) / (hi - lo)) * 1000;
  const torque = xs.reduce((a, x, i) => a + ps[i] * (x - f), 0);
  const ang = useTween(clamp(torque * 6, -10, 10), 0.4);
  const y = 480;
  const fx = X(f);
  const balanced = Math.abs(torque) < 0.02;
  return (
    <g>
      <g transform={`rotate(${ang} ${fx} ${y})`}>
        <rect x={X(lo)} y={y - 8} width={X(hi) - X(lo)} height={16} rx={4} fill="#2a2148" stroke={C.line} />
        {xs.map((x, i) => (
          <rect key={i} x={X(x) - 30} y={y - 10 - ps[i] * 300} width={60} height={ps[i] * 300} fill={x < 0 ? C.red : C.green} opacity={0.75} />
        ))}
      </g>
      {xs.map((x, i) => {
        const a = (ang * Math.PI) / 180;
        const dx = X(x) - fx;
        const dy = -36 - ps[i] * 300;
        return (
          <Html key={i} x={fx + dx * Math.cos(a) - dy * Math.sin(a)} y={y + dx * Math.sin(a) + dy * Math.cos(a)} size={18} color={x < 0 ? C.red : C.green}>
            <span className="prop-tag">
              {x > 0 ? '+' : ''}
              {x} · {dec(ps[i], 3)}
            </span>
          </Html>
        );
      })}
      <path d={`M${fx} ${y + 10} L${fx - 32} ${y + 66} L${fx + 32} ${y + 66} Z`} fill={C.panel} stroke={balanced ? C.green : C.text} strokeWidth={3} />
      {onF && <rect x={X(lo) - 20} y={y + 10} width={X(hi) - X(lo) + 40} height={80} fill="transparent" onPointerDown={onF} style={{ cursor: 'ew-resize' }} />}
      <Html x={fx} y={y + 96} size={22} color={balanced ? C.green : C.text}>
        <span className="prop-tag">{dec(f, 2)}</span>
      </Html>
      {Array.from({ length: hi - lo + 1 }, (_, k) => (
        <Html key={k} x={X(lo + k)} y={y + 30} size={14} color={C.dim}>
          <span className="prop-tag">{lo + k}</span>
        </Html>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- demo
function EdgeDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [assigned, setAssigned] = useState(false);
  const [f, setF] = useState(1);
  const [games, setGames] = useState<{ n: number; total: number; hist: number[] }>({ n: 0, total: 0, hist: [] });
  const onF = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(-3 + ((x - 300) / 1000) * 7, -3, 4) * 20) / 20;
    setF(v);
    if (Math.abs(v + 0.5) < 1e-9) unlock();
  });
  const play = (k: number) => {
    let { n, total } = games;
    const hist = [...games.hist];
    for (let i = 0; i < k; i++) {
      const c: Cell = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      total += gain(c);
      n++;
      if (n % Math.max(1, Math.floor(n / 60)) === 0 || i === k - 1) hist.push(total / n);
    }
    setGames({ n, total, hist: hist.slice(-240) });
    if (n >= 1000) unlock();
  };

  if (beat === 0)
    return (
      <Stage>
        <DiceGrid
          x={420}
          y={150}
          cell={110}
          labels={assigned ? 'pair' : 'sum'}
          tone={(c) => (!assigned ? null : gain(c) > 0 ? C.green : C.red)}
        />
        {assigned &&
          ALL.map((c) => (
            <Html key={c[0] * 10 + c[1]} x={420 + (c[1] - 0.5) * 110} y={150 + (c[0] - 0.5) * 110 + 32} size={22} color={gain(c) > 0 ? C.green : C.red}>
              <span className="prop-tag">{gain(c) > 0 ? `+${gain(c)}` : gain(c)}</span>
            </Html>
          ))}
        <Html x={1270} y={260} size={20} color={C.muted}>
          <span>Jugar cuesta 2 fichas</span>
        </Html>
        <Html x={1270} y={300} size={20} color={C.muted}>
          <span>Suma 7 paga 5 · Dobles pagan 4</span>
        </Html>
        <Html x={1270} y={400} size={22} interactive>
          <button
            className={`stage-btn ${assigned ? '' : 'on'}`}
            onClick={() => {
              setAssigned(true);
              unlock();
            }}
          >
            Anotar la ganancia de cada casilla
          </button>
        </Html>
      </Stage>
    );
  if (beat === 1)
    return (
      <Stage>
        <Bars x={400} y={200} w={720} h={440} values={PROBS} max={0.8} labels={['−2', '+2', '+3']} fmtV={(v) => `${Math.round(v * 36)}/36`} hi={answer !== null ? 0 : null} />
        <Html x={760} y={720} size={22} color={C.muted}>
          <span>valores de X (ganancia en fichas)</span>
        </Html>
      </Stage>
    );
  if (beat === 2)
    return (
      <Stage ref={svg}>
        <Beam xs={SUPPORT} ps={PROBS} f={f} onF={onF} />
        <Formula y={760} size={26} tex="E[X]=(-2)\tfrac{24}{36}+2\cdot\tfrac{6}{36}+3\cdot\tfrac{6}{36}=-\tfrac{18}{36}=-0{,}5" />
      </Stage>
    );
  if (beat === 3) {
    const avg = games.n ? games.total / games.n : 0;
    const Y = (v: number) => 420 - v * 120;
    return (
      <Stage>
        <line x1={300} x2={1300} y1={Y(0)} y2={Y(0)} stroke={C.line} strokeWidth={2} />
        <line x1={300} x2={1300} y1={Y(-0.5)} y2={Y(-0.5)} stroke={C.green} strokeDasharray="8 6" strokeWidth={2} />
        <Html x={1320} y={Y(-0.5)} size={18} anchor="left" color={C.green}>
          <span className="prop-tag">−0,5</span>
        </Html>
        {games.hist.map((v, i) =>
          i === 0 ? null : <Line key={i} a={[300 + ((i - 1) / 240) * 1000, Y(clamp(games.hist[i - 1], -2, 3))]} b={[300 + (i / 240) * 1000, Y(clamp(v, -2, 3))]} color={C.amber} width={2.5} />,
        )}
        <Html x={800} y={150} size={26} color={C.text}>
          <span className="prop-tag">
            {games.n} partidas · promedio {dec(avg, 3)} fichas
          </span>
        </Html>
        <Html x={800} y={760} size={24} interactive>
          <div className="stage-choices">
            {[10, 100, 1000].map((k) => (
              <button key={k} className="stage-btn on" onClick={() => play(k)}>
                +{k} partidas
              </button>
            ))}
          </div>
        </Html>
      </Stage>
    );
  }
  return (
    <Stage>
      <Html x={800} y={140} size={22} color={C.muted}>
        <span>Ruleta Aurora: 37 casillas (0 a 36). Una ficha a un número paga 35.</span>
      </Html>
      {Array.from({ length: 37 }, (_, k) => {
        const a = (k / 37) * Math.PI * 2 - Math.PI / 2;
        const red = k !== 0 && k % 2 === 1;
        return (
          <g key={k}>
            <circle cx={800 + Math.cos(a) * 230} cy={440 + Math.sin(a) * 230} r={22} fill={k === 0 ? '#1f7a4a' : red ? '#c8283c' : '#1a1410'} stroke={k === 17 ? C.amber : '#0006'} strokeWidth={k === 17 ? 4 : 2} />
            <Html x={800 + Math.cos(a) * 230} y={440 + Math.sin(a) * 230} size={13} color="#fff">
              <span className="prop-tag">{k}</span>
            </Html>
          </g>
        );
      })}
      {answer !== null && <Formula y={440} size={24} tex="35\cdot\tfrac{1}{37}-1\cdot\tfrac{36}{37}=-\tfrac{1}{37}" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const EVENTS: { text: string; k: number; f: (c: Cell) => boolean }[] = [
  { text: 'suma 7', k: 6, f: (c) => sumOf(c) === 7 },
  { text: 'dobles', k: 6, f: (c) => c[0] === c[1] },
  { text: 'suma 11', k: 2, f: (c) => sumOf(c) === 11 },
  { text: 'suma 4', k: 3, f: (c) => sumOf(c) === 4 },
  { text: 'suma 5', k: 4, f: (c) => sumOf(c) === 5 },
  { text: 'suma 10 o más', k: 6, f: (c) => sumOf(c) >= 10 },
  { text: 'suma 12', k: 1, f: (c) => sumOf(c) === 12 },
];

function Edge({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const ev = pick(r, EVENTS.filter((e) => e.k >= 3));
    const pay = pick(r, [3, 4, 5, 6]);
    const cost = 1;
    const fair = pick(r, EVENTS);
    const n = pick(r, [100, 200, 370]);
    const stake = pick(r, [5, 10, 20]);
    return { ev, pay, cost, fair, n, stake };
  }, [seed]);
  const [val, setVal] = useState('');

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Nuevo juego: apuestas 1 ficha; si sale **${data.ev.text}** recibes ${data.pay} fichas (tu ficha incluida); si no, la pierdes. ¿Cuál es la ganancia esperada por partida?`, 'E[X]=\\sum_x x\\,P(X=x)');
      api.hints([`La ganancia neta es ${data.pay - 1} si ganas y −1 si pierdes.`, `$P(\\text{${data.ev.text}})=\\frac{${data.ev.k}}{36}$.`]);
    } else if (round === 1) {
      api.prompt(`Iris propone un juego justo: apostar 1 ficha a **${data.fair.text}**. ¿Cuántas fichas netas debería pagar la casa si sale, para que la ganancia esperada sea 0?`, 'E[X]=g\\cdot P(A)-1\\cdot P(A^c)=0');
      api.hints([`$P(A)=\\frac{${data.fair.k}}{36}$ y $P(A^c)=\\frac{${36 - data.fair.k}}{36}$.`, 'Despeja $g$: lo que se gana por las veces que se gana debe compensar lo que se pierde.']);
    } else {
      api.prompt(`Un VIP juega ${data.n} veces a la ruleta, ${data.stake} fichas a un número cada vez. ¿Cuántas fichas espera perder en total? (Redondea a un entero.)`, 'E[X_1+\\dots+X_n]=n\\,E[X]');
      api.hints(['Por ficha apostada, la ruleta deja una ganancia esperada de $-\\tfrac{1}{37}$.', 'Multiplica por las fichas de cada jugada y por el número de jugadas.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const p = data.ev.k / 36;
      const t = (data.pay - 1) * p - (1 - p);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$${data.pay - 1}\\cdot${fracTex(data.ev.k, 36, false)}-1\\cdot${fracTex(36 - data.ev.k, 36, false)}\\approx${dec(t, 3)}$ fichas por partida. ${t < 0 ? 'Gana la casa.' : t > 0 ? 'Gana el jugador.' : 'Juego justo.'}`.replace(/(\d),(\d)/g, '$1{,}$2'));
      const naive = data.pay * p - (1 - p);
      if (Math.abs(v - naive) < 0.01) return api.result(false, `Recibir ${data.pay} fichas incluye la tuya: la ganancia neta es ${data.pay - 1}.`);
      return api.result(false, `Ganancia neta: $+${data.pay - 1}$ con probabilidad $${fracTex(data.ev.k, 36, false)}$ y $-1$ con $${fracTex(36 - data.ev.k, 36, false)}$. Pondera y suma.`);
    }
    if (round === 1) {
      const t = (36 - data.fair.k) / data.fair.k;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$${dec(t, 2)}\\cdot\\frac{${data.fair.k}}{36}=\\frac{${36 - data.fair.k}}{36}$: lo ganado compensa lo perdido. Pagar ${dec(t, 2)} a 1.`.replace(/(\d),(\d)/g, '$1{,}$2'));
      const e = v * (data.fair.k / 36) - (36 - data.fair.k) / 36;
      return api.result(false, `Pagando ${dec(v)}, la ganancia esperada sería ${dec(e, 3)}: ${e < 0 ? 'todavía gana la casa' : 'ahora gana el jugador'}.`);
    }
    const t = (data.n * data.stake) / 37;
    if (Math.abs(v - t) <= 1) return api.result(true, `$${data.n}\\cdot${data.stake}\\cdot\\tfrac{1}{37}\\approx${dec(t, 1)}$ fichas. Una partida puede ganar; cien partidas, casi nunca.`.replace(/(\d),(\d)/g, '$1{,}$2'));
    if (Math.abs(v - (data.n * data.stake) / 36) <= 1) return api.result(false, 'La ruleta tiene 37 casillas, no 36: el 0 es la ventaja de la casa.');
    return api.result(false, `Fichas apostadas en total: ${data.n * data.stake}. De cada ficha, la casa se queda en promedio con $\\tfrac{1}{37}$.`);
  };

  return (
    <Stage>
      {round < 2 ? (
        <DiceGrid x={420} y={150} cell={100} labels="sum" tone={(c) => ((round === 0 ? data.ev : data.fair).f(c) ? C.green : null)} />
      ) : (
        <Formula y={300} size={30} tex={`${data.n}\\ \\text{jugadas}\\times${data.stake}\\ \\text{fichas}`} />
      )}
      <NumberField x={round < 2 ? 1080 : 560} y={round < 2 ? 480 : 520} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'E[X] =' : round === 1 ? 'Pago neto:' : 'Pérdida esperada:'} width={5} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w5-c9',
  world: 'probability',
  code: '5.9',
  title: 'La ventaja de la casa',
  subtitle: 'Variable aleatoria y esperanza',
  glyph: 'E[X]',
  kind: 'level',
  guide: 'iris',
  teaser: 'Una partida puede salir bien. Mil partidas, no. La esperanza mide cuánto deja cada juego en promedio, y por qué la casa gana.',
  learn: 'Variable aleatoria como función de los resultados, su distribución, esperanza $E[X]=\\sum x\\,p(x)$ como punto de equilibrio, promedio a la larga, ventaja de la casa y linealidad.',
  glyphs: ['rv', 'expect'],
  pitfalls: ['La esperanza no tiene por qué ser un valor posible de $X$: nadie gana −0,5 fichas en una partida.', 'Ganancia neta ≠ lo que se recibe: descuenta lo apostado.'],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'baron', text: 'Mis juegos son generosos. Algunos pagan cinco a uno.' },
        { who: 'iris', text: 'Cinco a uno, ¿cuántas veces? Lo que importa es el promedio.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Ganancias',
      Scene: EdgeDemo,
      beats: [
        {
          say: '«Doble Aurora»: jugar cuesta 2 fichas. Suma 7 paga 5; dobles pagan 4; lo demás, nada.',
          gate: 'Anota la ganancia neta de cada casilla.',
          note: { label: 'Variable aleatoria', tex: 'X:\\Omega\\to\\mathbb R', body: 'A cada resultado le asigna un número: aquí, la ganancia neta. Suma 7: $+3$. Dobles: $+2$. Lo demás: $-2$.' },
        },
        {
          say: 'Agrupando casillas por su ganancia se obtiene la distribución de $X$.',
          ask: {
            prompt: '¿Cuál es el resultado más frecuente para el jugador?',
            options: ['Perder 2 fichas', 'Ganar 3 fichas', 'Ganar 2 fichas'],
            answer: 0,
            explain: '24 de las 36 casillas dan $-2$: dos de cada tres partidas se pierden.',
          },
          note: { label: 'Distribución', tex: 'p(x)=P(X=x),\\qquad \\sum_x p(x)=1' },
        },
        {
          say: 'El promedio de $X$ pesa cada valor según su probabilidad: es el punto donde la balanza se equilibra.',
          gate: 'Arrastra el apoyo hasta equilibrar la balanza.',
          note: { label: 'Esperanza', tex: 'E[X]=\\sum_x x\\,p(x)=-0{,}5', body: 'En promedio, cada partida le cuesta media ficha al jugador.' },
        },
        {
          say: 'Una partida es impredecible. Muchas, no.',
          gate: 'Juega hasta pasar las 1 000 partidas.',
          note: { label: 'Promedio a la larga', body: 'El promedio de muchas partidas se acerca a $E[X]$. Es lo que la casa cobra de verdad.' },
        },
        {
          say: 'La ruleta del Barón tiene 37 casillas, del 0 al 36. Una ficha a un número paga 35.',
          ask: {
            prompt: '¿Cuánto pierde el jugador, en promedio, por cada ficha?',
            options: ['1/37 de ficha', 'Nada: paga 35 a 1', '1/36 de ficha'],
            answer: 0,
            explain: 'Gana 35 con probabilidad $\\tfrac1{37}$ y pierde 1 con $\\tfrac{36}{37}$. Si fueran 36 casillas sería justo: el 0 es la ventaja de la casa.',
          },
          note: { label: 'Ventaja de la casa', tex: 'E[X]=35\\cdot\\tfrac1{37}-\\tfrac{36}{37}=-\\tfrac1{37}', body: 'Linealidad: $E[aX+b]=aE[X]+b$ y $E[X+Y]=E[X]+E[Y]$. Cien fichas apostadas pierden unas $100/37\\approx2{,}7$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'La ventaja', Comp: Edge, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'iris', text: 'Los juegos honestos le dejan a la casa unas fichas por cada cien. La mesa 7 le hace perder a la casa cuando juegan los VIP.' },
        { who: 'iris', text: 'Pierde a propósito. Así entra el dinero del contrabando y sale limpio como premio.' },
        { who: 'vera', text: 'Esta noche hay partida grande en la mesa 7. El Barón va a estar.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'rv', world: 'probability', tex: 'X:\\Omega\\to\\mathbb R', name: 'Variable aleatoria', read: 'equis', meaning: 'Función que asigna un número a cada resultado del experimento.' },
  { id: 'expect', world: 'probability', tex: 'E[X]', name: 'Esperanza', read: 'esperanza de equis', meaning: 'Promedio ponderado de los valores de $X$: $\\sum_x x\\,P(X=x)$. Es el promedio a la larga.' },
];
