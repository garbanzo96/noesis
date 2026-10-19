import { useEffect, useMemo, useRef, useState } from 'react';
import { Die } from '../../art/props';
import { clamp } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
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
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseProb } from '../shared/ui';
import { Formula } from './kit';

// ============================================================================
// CASO 5.8 · «El dado cargado» — teorema de Bayes
// Dos hipótesis (dado honesto H, dado cargado L). Diagrama de áreas: ancho = probabilidad
// previa, alto = verosimilitud de lo observado. Observar = borrar lo incompatible y
// renormalizar. El posterior de una tirada es el previo de la siguiente. La base importa.
// ============================================================================

const X0 = 360;
const Y0 = 150;
const S = 560;

/**
 * Unit square: column widths are the prior of each hypothesis, the lit band inside each column
 * is the likelihood of the observation. When `observed`, the rest fades out.
 */
function AreaBayes({
  prior,
  like,
  names,
  observed,
  obsLabel,
}: {
  prior: number;
  like: [number, number];
  names: [string, string];
  observed: boolean;
  obsLabel: string;
}) {
  const w = useTween([prior, 1 - prior], 0.6);
  const h = useTween(like, 0.6);
  const fade = useTween(observed ? 1 : 0, 0.6);
  const cols = [
    { x: X0, w: w[0] * S, h: h[0] * S, c: C.red, n: names[0] },
    { x: X0 + w[0] * S, w: w[1] * S, h: h[1] * S, c: C.cyan, n: names[1] },
  ];
  const a = [prior * like[0], (1 - prior) * like[1]];
  const post = a[0] / (a[0] + a[1]);
  return (
    <g>
      <rect x={X0} y={Y0} width={S} height={S} fill="#120f22" stroke={C.line} />
      {cols.map((k, i) => (
        <g key={i}>
          <rect
            x={k.x + 2}
            y={Y0 + 2}
            width={Math.max(0, k.w - 4)}
            height={S - k.h - 4}
            fill={k.c}
            opacity={0.12 * (1 - fade)}
          />
          <rect
            x={k.x + 2}
            y={Y0 + S - k.h}
            width={Math.max(0, k.w - 4)}
            height={k.h - 2}
            fill={k.c}
            opacity={0.6}
          />
          <rect x={k.x} y={Y0} width={k.w} height={S} fill="none" stroke={C.line} strokeWidth={2} />
          <Html x={k.x + k.w / 2} y={Y0 - 24} size={18} color={k.c}>
            <span>
              {k.n} · {dec(i === 0 ? prior : 1 - prior, 3)}
            </span>
          </Html>
          {k.w > 40 && (
            <Html x={k.x + k.w / 2} y={Y0 + S - k.h / 2} size={16} color={C.text}>
              <span className="prop-tag">{obsLabel}</span>
            </Html>
          )}
        </g>
      ))}
      <Html x={X0 + S + 40} y={Y0 + 60} size={20} anchor="left" color={C.muted}>
        <span>ancho: probabilidad previa</span>
      </Html>
      <Html x={X0 + S + 40} y={Y0 + 95} size={20} anchor="left" color={C.muted}>
        <span>alto: probabilidad de «{obsLabel}»</span>
      </Html>
      {observed && (
        <>
          {/* the surviving areas side by side, renormalized */}
          <rect
            x={X0 + S + 40}
            y={Y0 + 180}
            width={360 * post}
            height={60}
            fill={C.red}
            opacity={0.7}
          />
          <rect
            x={X0 + S + 40 + 360 * post}
            y={Y0 + 180}
            width={360 * (1 - post)}
            height={60}
            fill={C.cyan}
            opacity={0.7}
          />
          <Html x={X0 + S + 40} y={Y0 + 270} size={22} anchor="left" color={C.text}>
            <Tex
              tex={`P(\\text{${names[0].toLowerCase()}}\\mid\\text{${obsLabel}})=${dec(post, 3).replace(',', '{,}')}`}
            />
          </Html>
        </>
      )}
    </g>
  );
}

// ---------------------------------------------------------------- demo
function BayesDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [seen, setSeen] = useState(false);
  const [n, setN] = useState(0);
  const onN = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 360) / 120, 0, 8));
    setN(v);
    if (v === 5) unlock();
  });
  useEffect(() => setSeen(false), [beat]);
  const names: [string, string] = ['Cargado', 'Honesto'];
  if (beat === 0)
    return (
      <Stage>
        <AreaBayes prior={0.5} like={[0.5, 1 / 6]} names={names} observed={seen} obsLabel="6" />
        <Html x={X0 + S + 200} y={Y0 + 400} size={22} interactive>
          <button
            className={`stage-btn ${seen ? '' : 'on'}`}
            onClick={() => {
              setSeen(true);
              unlock();
            }}
          >
            Lanzar: sale un 6
          </button>
        </Html>
        {seen && <Die x={X0 + S + 200} y={Y0 + 480} value={6} size={70} />}
      </Stage>
    );
  if (beat === 1)
    return (
      <Stage>
        <AreaBayes
          prior={0.75}
          like={[0.5, 1 / 6]}
          names={names}
          observed={answer !== null}
          obsLabel="6"
        />
      </Stage>
    );
  if (beat === 2)
    return (
      <Stage>
        <AreaBayes prior={0.9} like={[0.1, 1 / 6]} names={names} observed={seen} obsLabel="3" />
        <Html x={X0 + S + 200} y={Y0 + 400} size={22} interactive>
          <button
            className={`stage-btn ${seen ? '' : 'on'}`}
            onClick={() => {
              setSeen(true);
              unlock();
            }}
          >
            Lanzar: sale un 3
          </button>
        </Html>
      </Stage>
    );
  if (beat === 3)
    return (
      <Stage>
        <AreaBayes
          prior={0.1}
          like={[0.5, 1 / 6]}
          names={names}
          observed={answer !== null}
          obsLabel="6"
        />
      </Stage>
    );
  const odds0 = 1 / 9;
  const odds = odds0 * 3 ** n;
  const post = odds / (1 + odds);
  return (
    <Stage ref={svg}>
      <Html x={800} y={140} size={22} color={C.muted}>
        <span>Previa 0,1. Cada 6 multiplica las chances del cargado por 3.</span>
      </Html>
      {Array.from({ length: n }, (_, i) => (
        <Die key={i} x={420 + i * 90} y={260} value={6} size={64} />
      ))}
      <rect x={360} y={360} width={900} height={50} fill="#1d1733" />
      <rect x={360} y={360} width={900 * post} height={50} fill={C.red} opacity={0.75} />
      <line
        x1={360 + 900 * 0.95}
        x2={360 + 900 * 0.95}
        y1={340}
        y2={430}
        stroke={C.green}
        strokeWidth={3}
        strokeDasharray="6 6"
      />
      <Html x={360 + 900 * 0.95} y={450} size={16} color={C.green}>
        <span className="prop-tag">0,95</span>
      </Html>
      <Formula
        y={540}
        size={28}
        tex={`\\frac{P(L\\mid x)}{P(H\\mid x)}=\\frac19\\cdot3^{${n}}=${dec(odds, 2).replace(',', '{,}')}\\ \\Rightarrow\\ P(L\\mid x)=${dec(post, 3).replace(',', '{,}')}`}
      />
      <line x1={360} x2={1320} y1={680} y2={680} stroke={C.line} strokeWidth={3} />
      {Array.from({ length: 9 }, (_, k) => (
        <Html key={k} x={360 + k * 120} y={715} size={16} color={C.dim}>
          <span className="prop-tag">{k}</span>
        </Html>
      ))}
      <rect
        x={340}
        y={650}
        width={1000}
        height={60}
        fill="transparent"
        onPointerDown={onN}
        style={{ cursor: 'ew-resize' }}
      />
      <Knob x={360 + n * 120} y={680} onPointerDown={onN} cursor="ew-resize" label={`${n}×6`} />
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function WhichDie({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const prior = pick(r, [0.5, 0.2, 0.3, 0.25]);
    const q = pick(r, [1 / 2, 1 / 3]);
    const second6 = r() < 0.5;
    const base = pick(r, [0.01, 0.02, 0.05]);
    const sens = pick(r, [0.9, 0.95, 0.99]);
    const fp = pick(r, [0.05, 0.1]);
    return { prior, q, second6, base, sens, fp };
  }, [seed]);
  const [val, setVal] = useState('');
  const qTex = data.q === 0.5 ? '\\tfrac12' : '\\tfrac13';
  const qOther = (1 - data.q) / 5; // loaded die: the other five faces share the rest

  useEffect(() => {
    if (round === 0) {
      api.prompt(
        `El Barón usa el dado cargado con probabilidad ${dec(data.prior)}. El cargado saca 6 con probabilidad $${qTex}$; el honesto, $\\tfrac16$. Sale un 6. ¿Probabilidad de que sea el cargado?`,
        'P(L\\mid6)=\\frac{P(6\\mid L)P(L)}{P(6\\mid L)P(L)+P(6\\mid H)P(H)}',
      );
      api.hints([
        'Área del cargado que muestra 6: previa por verosimilitud.',
        'Divide esa área por toda el área que muestra 6 (cargado y honesto).',
      ]);
    } else if (round === 1) {
      api.prompt(
        `Mismo dado, misma previa (${dec(data.prior)}). Salen dos tiradas: un 6 y luego ${data.second6 ? 'otro 6' : 'un 2'}. ¿Probabilidad de que sea el cargado?`,
        'P(L\\mid x_1,x_2)\\propto P(x_1\\mid L)\\,P(x_2\\mid L)\\,P(L)',
      );
      api.hints([
        `El cargado reparte lo que no es 6 entre las otras cinco caras: cada una tiene ${dec(qOther, 3)}.`,
        'Multiplica las verosimilitudes de las dos tiradas (son independientes dado el dado) y renormaliza.',
      ]);
    } else {
      api.prompt(
        `El ${dec(data.base * 100)} % de las fichas en circulación son falsas. El detector marca el ${dec(data.sens * 100)} % de las falsas, pero también el ${dec(data.fp * 100)} % de las auténticas. Una ficha fue marcada. ¿Probabilidad de que sea falsa?`,
        'P(F\\mid +)=\\frac{P(+\\mid F)P(F)}{P(+)}',
      );
      api.hints([
        'Imagina 10 000 fichas: cuántas falsas marca y cuántas auténticas marca.',
        'Divide las falsas marcadas por todas las marcadas.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    const { prior, q } = data;
    if (round === 0) {
      const a = prior * q;
      const b = (1 - prior) / 6;
      const t = a / (a + b);
      if (Math.abs(v - t) < 0.005)
        return api.result(
          true,
          `$\\frac{${dec(prior)}\\cdot${qTex}}{${dec(prior)}\\cdot${qTex}+${dec(1 - prior)}\\cdot\\tfrac16}\\approx${dec(t, 3)}$`.replace(
            /(\d),(\d)/g,
            '$1{,}$2',
          ),
        );
      if (Math.abs(v - q) < 0.005)
        return api.result(
          false,
          `Esa es $P(6\\mid L)$, al revés de lo pedido. Hay que ponderar por la previa y dividir por todos los 6.`,
        );
      if (Math.abs(v - a) < 0.005)
        return api.result(
          false,
          `Esa es el área del cargado con 6, $P(L\\cap 6)$. Falta dividir por toda el área que muestra 6.`,
        );
      return api.result(
        false,
        `Cargado y 6: $${dec(prior)}\\cdot${qTex}$. Honesto y 6: $${dec(1 - prior)}\\cdot\\tfrac16$. Divide el primero por la suma.`.replace(
          /(\d),(\d)/g,
          '$1{,}$2',
        ),
      );
    }
    if (round === 1) {
      const l2 = data.second6 ? q : qOther;
      const a = prior * q * l2;
      const b = ((1 - prior) / 6) * (1 / 6);
      const t = a / (a + b);
      if (Math.abs(v - t) < 0.005)
        return api.result(
          true,
          `Cargado: $${dec(prior)}\\cdot${dec(q, 3)}\\cdot${dec(l2, 3)}$. Honesto: $${dec(1 - prior)}\\cdot\\tfrac16\\cdot\\tfrac16$. Posterior $\\approx${dec(t, 3)}$.`.replace(
            /(\d),(\d)/g,
            '$1{,}$2',
          ),
        );
      const one = (prior * q) / (prior * q + (1 - prior) / 6);
      if (Math.abs(v - one) < 0.005)
        return api.result(
          false,
          'Ese es el posterior después de una sola tirada. Usa la segunda: multiplica por su verosimilitud y renormaliza.',
        );
      return api.result(
        false,
        `Para el cargado, la segunda tirada tiene probabilidad ${dec(l2, 3)}; para el honesto, $\\tfrac16$. Multiplica por la previa y las dos tiradas.`,
      );
    }
    const a = data.base * data.sens;
    const b = (1 - data.base) * data.fp;
    const t = a / (a + b);
    if (Math.abs(v - t) < 0.005)
      return api.result(
        true,
        `De 10 000 fichas: ${Math.round(10000 * a)} falsas marcadas y ${Math.round(10000 * b)} auténticas marcadas. $\\frac{${Math.round(10000 * a)}}{${Math.round(10000 * (a + b))}}\\approx${dec(t, 3)}$.`.replace(
          /(\d),(\d)/g,
          '$1{,}$2',
        ),
      );
    if (Math.abs(v - data.sens) < 0.005)
      return api.result(
        false,
        `${dec(data.sens)} es $P(+\\mid F)$. Pero las falsas son raras: la mayoría de las marcadas son auténticas.`,
      );
    return api.result(
      false,
      `En 10 000 fichas: ${Math.round(10000 * data.base)} falsas (marca ${Math.round(10000 * a)}) y ${Math.round(10000 * (1 - data.base))} auténticas (marca ${Math.round(10000 * b)}).`,
    );
  };

  return (
    <Stage>
      {round < 2 ? (
        <AreaBayes
          prior={data.prior}
          like={[data.q, 1 / 6]}
          names={['Cargado', 'Honesto']}
          observed={false}
          obsLabel="6"
        />
      ) : (
        <AreaBayes
          prior={data.base}
          like={[data.sens, data.fp]}
          names={['Falsa', 'Auténtica']}
          observed={false}
          obsLabel="marcada"
        />
      )}
      {round === 1 && (
        <>
          <Die x={X0 + S + 120} y={Y0 + 260} value={6} size={70} />
          <Die x={X0 + S + 220} y={Y0 + 260} value={data.second6 ? 6 : 2} size={70} />
        </>
      )}
      <NumberField
        x={X0 + S + 40}
        y={Y0 + 420}
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
// Clase · Bayes con frecuencias: una moneda honesta y una con dos caras, 100 repeticiones.
// ---------------------------------------------------------------------------
const COINS = [
  { name: 'Honesta', x: 150, heads: (i: number) => i % 2 === 0 },
  { name: 'Trucada (dos caras)', x: 590, heads: () => true },
];
const DOT = { y: 300, gap: 40, r: 15 };
const TOSS = { x0: 1090, x1: 1420, y: 620 };

function BayesLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const { beat } = beats;
  const tossed = beat === 0 ? 0 : beat === 1 ? Math.round(50 * t) : 50;
  const drag = useSvgDrag(svg, (px) => {
    const v = clamp((px - TOSS.x0) / (TOSS.x1 - TOSS.x0), 0, 1);
    setT(v);
    if (v > 0.98) unlock();
  });
  const onlyHeads = (beat === 2 && answer !== null) || beat >= 3;
  return (
    <Stage ref={svg}>
      {COINS.map((coin, k) => {
        const heads = Array.from({ length: 50 }, (_, i) => i < tossed && coin.heads(i)).filter(
          Boolean,
        ).length;
        return (
          <g key={coin.name}>
            <Cap x={coin.x + 195} y={DOT.y - 50} size={22} color={k ? C.magenta : C.cyan}>
              {coin.name}: 50
            </Cap>
            {Array.from({ length: 50 }, (_, i) => {
              const done = i < tossed,
                head = done && coin.heads(i),
                x = coin.x + (i % 10) * DOT.gap + DOT.r,
                y = DOT.y + Math.floor(i / 10) * DOT.gap;
              const col = !done ? C.line : head ? C.amber : C.muted;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={DOT.r}
                  fill={col}
                  fillOpacity={onlyHeads && !head ? 0.12 : done ? 0.9 : 0.5}
                />
              );
            })}
            {tossed > 0 && (
              <Cap x={coin.x + 195} y={DOT.y + 5 * DOT.gap + 30} size={21} color={C.amber}>
                {`${heads} caras`}
              </Cap>
            )}
          </g>
        );
      })}
      <Cap x={540} y={620} size={20} color={C.muted}>
        Cada punto es una repetición: se elige una moneda al azar y se lanza.
      </Cap>
      {beat === 1 && (
        <>
          <line x1={TOSS.x0} x2={TOSS.x1} y1={TOSS.y} y2={TOSS.y} stroke={C.line} strokeWidth={4} />
          <Knob
            x={TOSS.x0 + t * (TOSS.x1 - TOSS.x0)}
            y={TOSS.y}
            onPointerDown={drag}
            axis="x"
            color={C.amber}
          />
          <Cap x={1255} y={TOSS.y + 55} size={19} color={C.muted}>
            lanzar las 100 monedas
          </Cap>
        </>
      )}
      {beat === 0 && <Cap x={1270} y={280} tex="P(T)=P(H)=\tfrac12" color={C.text} />}
      {beat >= 1 && tossed === 50 && (
        <Cap x={1270} y={280} tex="25+50=75\ \text{caras}" color={C.amber} />
      )}
      {onlyHeads && (
        <Cap x={1270} y={380} tex="P(T\mid C)=\tfrac{50}{75}=\tfrac23" color={C.magenta} />
      )}
      {beat >= 3 && (
        <Cap
          x={1270}
          y={480}
          tex="P(C)=\tfrac12\cdot1+\tfrac12\cdot\tfrac12=\tfrac34"
          color={C.green}
        />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Teorema de Bayes',
  Scene: BayesLesson,
  beats: [
    {
      say: 'En una bolsa hay una moneda honesta y una con dos caras. Sacas una al azar: antes de lanzar, cada una tiene la mitad.',
      board: {
        label: 'Antes de mirar',
        tex: '\\p{1}{P(T)}=\\p{2}{\\tfrac12}',
        parts: ['probabilidad de la trucada', 'probabilidad antes de mirar'],
      },
    },
    {
      say: 'Imagina 100 repeticiones. Lanza las monedas y cuenta cuántas caras aporta cada una.',
      gate: 'Arrastra la perilla hasta el final para lanzar las 100.',
      board: {
        label: 'Cómo sale cara',
        tex: '\\p{1}{P(C\\mid T)=1},\\quad\\p{2}{P(C\\mid H)=\\tfrac12}',
        parts: ['cara con moneda trucada', 'cara con moneda honesta'],
      },
    },
    {
      say: 'Salió cara. Ahora solo importan los puntos ámbar.',
      ask: {
        prompt: 'Salió cara. ¿Probabilidad de que sea la trucada?',
        options: ['2/3', '1/2', '1'],
        answer: 0,
        explain:
          'De 75 caras, 50 vienen de la trucada: 50/75 = 2/3. La honesta también produce caras.',
      },
      board: {
        label: 'Después de mirar',
        tex: '\\p{1}{P(T\\mid C)}=\\p{2}{\\tfrac{50}{75}}=\\p{3}{\\tfrac23}',
        parts: ['trucada tras ver cara', 'caras de la trucada', 'probabilidad actualizada'],
      },
    },
    {
      say: 'La misma cuenta en fórmula: lo que aporta la trucada, dividido por todas las formas de ver cara. Es el **teorema de Bayes**.',
      board: {
        label: 'Bayes',
        tex: '\\p{1}{P(T\\mid C)}=\\p{2}{\\frac{P(C\\mid T)\\,P(T)}{P(C)}}',
        parts: ['trucada tras ver cara', 'aporte entre todas las caras'],
      },
    },
    {
      say: 'El denominador suma los dos caminos que terminan en cara: es la probabilidad total.',
      board: {
        label: 'Denominador',
        tex: '\\p{1}{P(C)}=\\p{2}{P(C\\mid T)P(T)+P(C\\mid H)P(H)}=\\p{3}{\\tfrac34}',
        parts: ['probabilidad de cara', 'suma de ambos caminos', 'probabilidad total de cara'],
      },
    },
  ],
};

export const level: LevelSpec = {
  id: 'w5-c8',
  world: 'probability',
  code: '5.8',
  title: 'El dado cargado',
  subtitle: 'Teorema de Bayes',
  glyph: 'P(H\\mid x)',
  kind: 'level',
  guide: 'teo',
  teaser:
    'En la mesa 7 hay un dado honesto o uno cargado, y no sabemos cuál. Cada tirada es una pista, y Bayes dice cuánto debe cambiar la sospecha.',
  learn:
    'Teorema de Bayes como diagrama de áreas: previa por verosimilitud, renormalizar; evidencia que se acumula; el peso de la base; chances y razón de verosimilitud.',
  glyphs: ['bayes', 'prior', 'likelihood'],
  pitfalls: [
    '$P(6\\mid L)$ no es $P(L\\mid 6)$.',
    'Si la hipótesis es rara, una prueba buena puede dejarla igual de improbable.',
    'El posterior de una observación es la previa de la siguiente.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'nar',
          text: 'Casino Aurora, diez de la noche. El dado rebotó contra el borde de la mesa 7 y quedó, otra vez, en seis.',
        },
        {
          who: 'teo',
          text: 'El cargado saca 6 la mitad de las veces, y el honesto una de cada seis. Desde la cámara no distingo cuál dejó el Barón.',
        },
        {
          who: 'vera',
          text: 'Lo cambia en una de cada diez manos. Si intentan tocarlo, llama al guardia.',
        },
        {
          who: 'iris',
          text: 'Entonces sigamos las tiradas. Necesito algo más firme que la forma de su bolsillo.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Evidencia',
      Scene: BayesDemo,
      beats: [
        {
          say: 'Mitad de chances para cada dado. En cada columna, lo coloreado es la probabilidad de sacar 6 con ese dado.',
          gate: 'Lanza el dado.',
          note: {
            label: 'Teorema de Bayes',
            tex: 'P(L\\mid6)=\\frac{P(6\\mid L)\\,P(L)}{P(6)}',
            body: 'Se borra lo que no es compatible con el 6 y se renormaliza: $\\tfrac{1/4}{1/4+1/12}=\\tfrac34$.',
          },
        },
        {
          say: 'Ahora la sospecha de partida es 3/4. El dado se lanza otra vez.',
          ask: {
            prompt: 'Sale otro 6. ¿Qué pasa con la probabilidad de que sea el cargado?',
            options: ['Sube a 0,9', 'Se queda en 0,75', 'Baja'],
            answer: 0,
            explain:
              'Cargado: $\\tfrac34\\cdot\\tfrac12=\\tfrac38$. Honesto: $\\tfrac14\\cdot\\tfrac16=\\tfrac1{24}$. Renormalizando: $\\tfrac{9}{10}$.',
          },
          note: {
            label: 'Evidencia acumulada',
            body: 'El posterior de una tirada es la previa de la siguiente.',
          },
        },
        {
          say: 'Con 0,9 de sospecha, sale un 3. El cargado saca 3 con probabilidad 0,1; el honesto, con $\\tfrac16$.',
          gate: 'Lanza otra vez.',
          note: {
            label: 'Evidencia en contra',
            body: 'Un 3 es más probable con el honesto: la sospecha baja, de 0,9 a 0,84.',
          },
        },
        {
          say: 'Pero Vera dice que el Barón solo cambia el dado en una de cada diez manos.',
          ask: {
            prompt: 'Con previa 0,1, sale un 6. ¿Probabilidad de que sea el cargado?',
            options: ['0,25', '0,75', '0,5'],
            answer: 0,
            explain:
              'Cargado: $0{,}1\\cdot0{,}5=0{,}05$. Honesto: $0{,}9\\cdot\\tfrac16=0{,}15$. $\\tfrac{0{,}05}{0{,}20}=0{,}25$. Si la hipótesis es rara, un 6 no basta.',
          },
          note: {
            label: 'La base importa',
            body: 'Con previa 0,1, un 6 deja la sospecha en 0,25, no en 0,75.',
          },
        },
        {
          say: 'Cada 6 es tres veces más probable con el cargado: multiplica sus chances por 3.',
          gate: 'Arrastra el contador de seises hasta pasar 0,95.',
          note: {
            label: 'Razón de verosimilitud',
            tex: '\\frac{P(L\\mid x)}{P(H\\mid x)}=\\frac{P(x\\mid L)}{P(x\\mid H)}\\cdot\\frac{P(L)}{P(H)}',
            body: 'Con previa 0,1, hacen falta cinco seises seguidos para pasar 0,95.',
          },
        },
      ],
    },
    { kind: 'challenge', title: '¿Cuál dado?', Comp: WhichDie, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        {
          who: 'teo',
          text: 'Con una posibilidad inicial de 0,1, cinco seises seguidos pasan de 0,95 para el cargado. Pasó cuando jugó el VIP del sombrero.',
        },
        { who: 'iris', text: 'Entonces el dado entra a la mesa con él.' },
        {
          who: 'vera',
          text: 'Paga con fichas de la casa, siempre de las grandes. Ferrer celebra incluso cuando tiene que pagarle.',
        },
        { who: 'tu', text: 'Veamos cuánto le cuesta a la casa esa celebración.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'bayes',
    world: 'probability',
    tex: 'P(H\\mid x)=\\frac{P(x\\mid H)P(H)}{P(x)}',
    name: 'Teorema de Bayes',
    read: 'pe de hache dado equis',
    meaning: 'Actualiza la probabilidad de una hipótesis $H$ después de observar $x$.',
  },
  {
    id: 'prior',
    world: 'probability',
    tex: 'P(H)',
    name: 'Probabilidad previa',
    read: 'previa',
    meaning: 'Lo que se cree de $H$ antes de observar.',
  },
  {
    id: 'likelihood',
    world: 'probability',
    tex: 'P(x\\mid H)',
    name: 'Verosimilitud',
    read: 'pe de equis dado hache',
    meaning: 'Qué tan probable es lo observado si $H$ fuera cierta.',
    warn: 'No es la probabilidad de $H$.',
  },
];

export { lesson };
