import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, hhmm, parseNum, thousands } from '../shared/ui';

// ============================================================================
// CASO 1.7 · «El virus de las grúas» — exponenciales
// Duplicar cada hora: N = 3·2^t sobre una grilla de equipos; lineal contra exponencial; leyes
// de potencias; decaimiento con exponente negativo; crecimiento porcentual; el número e.
// ============================================================================

const COLS = 48;
const ROWS = 32;
const CELL = 16;
const GX = 420;
const GY = 150;

/** Infection order: cells sorted by distance to a seed point, with a little jitter. */
function spreadOrder(seed: number, sx = 0.3, sy = 0.6) {
  const r = rng(seed);
  const cells = Array.from({ length: COLS * ROWS }, (_, k) => {
    const c = k % COLS;
    const rr = Math.floor(k / COLS);
    const d = Math.hypot(c / COLS - sx, (rr / ROWS - sy) * (ROWS / COLS)) + r() * 0.06;
    return { k, d };
  });
  cells.sort((a, b) => a.d - b.d);
  const rank = new Array<number>(COLS * ROWS);
  cells.forEach((c, i) => (rank[c.k] = i));
  return rank;
}

/** The crane control units of the port: one square each, infected ones in red. */
function Grid({ n, rank, color = C.red }: { n: number; rank: number[]; color?: string }) {
  return (
    <g>
      <rect
        x={GX - 10}
        y={GY - 10}
        width={COLS * CELL + 20}
        height={ROWS * CELL + 20}
        fill="#0a0818"
        stroke={C.line}
      />
      {rank.map((rk, k) => {
        const on = rk < n;
        return (
          <rect
            key={k}
            x={GX + (k % COLS) * CELL + 2}
            y={GY + Math.floor(k / COLS) * CELL + 2}
            width={CELL - 4}
            height={CELL - 4}
            fill={on ? color : '#1d1733'}
            opacity={on ? 0.9 : 1}
          />
        );
      })}
    </g>
  );
}

function Clock({
  t,
  max,
  onDrag,
  y = 720,
  label,
}: {
  t: number;
  max: number;
  onDrag: (e: PointerEvent) => void;
  y?: number;
  label?: string;
}) {
  const X = (v: number) => GX + (v / max) * COLS * CELL;
  return (
    <g>
      <line x1={X(0)} x2={X(max)} y1={y} y2={y} stroke={C.line} strokeWidth={3} />
      {Array.from({ length: max + 1 }, (_, k) => (
        <g key={k}>
          <line x1={X(k)} x2={X(k)} y1={y - 8} y2={y + 8} stroke={C.dim} strokeWidth={2} />
          <Html x={X(k)} y={y + 30} size={15} color={C.dim}>
            <span className="prop-tag">{k}</span>
          </Html>
        </g>
      ))}
      <rect
        x={X(0) - 20}
        y={y - 30}
        width={X(max) - X(0) + 40}
        height={60}
        fill="transparent"
        onPointerDown={onDrag}
        style={{ cursor: 'ew-resize' }}
      />
      <Knob x={X(t)} y={y} onPointerDown={onDrag} cursor="ew-resize" label={label ?? `${t} h`} />
    </g>
  );
}

// ---------------------------------------------------------------- demo
function VirusDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const rank = useMemo(() => spreadOrder(7), []);
  const [t, setT] = useState(0);
  const [td, setTd] = useState(0);
  const [n, setN] = useState(1);
  const clockX = (x: number, max: number) =>
    Math.round(clamp(((x - GX) / (COLS * CELL)) * max, 0, max));
  const onT = useSvgDrag(svg, (x) => {
    const v = clockX(x, 9);
    setT(v);
    if (v === 9) unlock();
  });
  const onTd = useSvgDrag(svg, (x) => {
    const v = clockX(x, 9);
    setTd(v);
    if (v === 8) unlock();
  });
  const NS = [1, 2, 3, 4, 6, 12, 24, 100, 1000];
  const onN = useSvgDrag(svg, (x) => {
    const i = Math.round(clamp(((x - 300) / 1000) * (NS.length - 1), 0, NS.length - 1));
    setN(NS[i]);
    if (NS[i] === 1000) unlock();
  });

  if (beat === 0)
    return (
      <Stage ref={svg}>
        <Grid n={3 * 2 ** t} rank={rank} />
        <Html x={GX + COLS * CELL + 40} y={GY + 40} size={26} anchor="left" color={C.red}>
          <span className="prop-tag">{thousands(3 * 2 ** t)}</span>
        </Html>
        <Html x={GX + COLS * CELL + 40} y={GY + 80} size={18} anchor="left" color={C.muted}>
          <span>infectados</span>
        </Html>
        <Html x={GX + COLS * CELL + 40} y={GY + 160} size={24} anchor="left" color={C.text}>
          <Tex tex={`3\\cdot2^{${t}}`} />
        </Html>
        <Clock t={t} max={9} onDrag={onT} />
      </Stage>
    );

  if (beat === 1 || beat === 2) {
    // bars: exponential vs linear
    const H = (v: number) => (v / 1536) * 520;
    return (
      <Stage>
        {Array.from({ length: 10 }, (_, k) => {
          const e = 3 * 2 ** k;
          const l = 3 + 3 * k;
          const x = 330 + k * 100;
          return (
            <g key={k}>
              <rect
                x={x - 30}
                y={700 - H(e)}
                width={36}
                height={H(e)}
                fill={C.red}
                opacity={0.75}
              />
              <rect
                x={x + 8}
                y={700 - H(l)}
                width={22}
                height={Math.max(2, H(l))}
                fill={C.cyan}
                opacity={0.85}
              />
              <Html x={x} y={725} size={16} color={C.dim}>
                <span className="prop-tag">{k} h</span>
              </Html>
              {(k >= 7 || beat === 1) && (
                <Html x={x - 12} y={690 - H(e)} size={14} color={C.red}>
                  <span className="prop-tag">{e}</span>
                </Html>
              )}
            </g>
          );
        })}
        <Html x={330} y={170} size={20} anchor="left" color={C.red}>
          <span>■ se duplica cada hora</span>
        </Html>
        <Html x={330} y={205} size={20} anchor="left" color={C.cyan}>
          <span>■ sumando 3 cada hora</span>
        </Html>
        {beat === 1 && answer !== null && (
          <Html x={1000} y={300} size={26} color={C.text}>
            <Tex tex="N(9)-N(8)=1536-768=768" />
          </Html>
        )}
        {beat === 2 && (
          <Group opacity={answer !== null ? 1 : 0}>
            <Html x={980} y={260} size={28} color={C.text}>
              <Tex tex="2^3\cdot2^3=2^{3+3}=2^6=64" />
            </Html>
          </Group>
        )}
      </Stage>
    );
  }

  if (beat === 3)
    return (
      <Stage ref={svg}>
        <Grid n={1536 / 2 ** td} rank={rank} color={C.red} />
        <Html x={GX + COLS * CELL + 40} y={GY + 40} size={26} anchor="left" color={C.red}>
          <span className="prop-tag">{thousands(1536 / 2 ** td)}</span>
        </Html>
        <Html x={GX + COLS * CELL + 40} y={GY + 80} size={18} anchor="left" color={C.muted}>
          <span>infectados</span>
        </Html>
        <Html x={GX + COLS * CELL + 40} y={GY + 160} size={24} anchor="left" color={C.green}>
          <Tex tex={`1536\\cdot2^{-${td}}`} />
        </Html>
        <Clock t={td} max={9} onDrag={onTd} label={`${td} h`} />
      </Stage>
    );

  if (beat === 4) {
    const steps = [1000, 1100, 1210, 1331];
    return (
      <Stage>
        {steps.map((v, k) => (
          <g key={k} opacity={k <= 1 || answer !== null ? 1 : 0.2}>
            <rect
              x={340 + k * 260}
              y={680 - v * 0.35}
              width={120}
              height={v * 0.35}
              fill={C.amber}
              opacity={0.7}
            />
            <Html x={400 + k * 260} y={710} size={24} color={C.text}>
              <span className="prop-tag">{thousands(v)}</span>
            </Html>
            <Html x={400 + k * 260} y={750} size={16} color={C.dim}>
              <span className="prop-tag">{k} h</span>
            </Html>
            {k > 0 && (
              <Html x={270 + k * 260} y={330} size={22} color={C.amber}>
                <span className="prop-tag">×1,1</span>
              </Html>
            )}
          </g>
        ))}
        <Html x={800} y={180} size={22} color={C.muted}>
          <span>Otra cepa, más lenta: crece 10 % cada hora</span>
        </Html>
      </Stage>
    );
  }

  // beat 5: compounding towards e
  const val = (1 + 1 / n) ** n;
  const i = NS.indexOf(n);
  return (
    <Stage ref={svg}>
      <Html x={800} y={170} size={22} color={C.muted}>
        <span>Crecer 100 % en una hora, pero repartido en n saltos pequeños</span>
      </Html>
      <Html x={800} y={330} size={44} color={C.text}>
        <Tex tex={`\\left(1+\\tfrac{1}{${n}}\\right)^{${n}}=${dec(val, 4)}`} />
      </Html>
      <rect x={300} y={470} width={1000} height={30} fill="#1d1733" />
      <rect
        x={300}
        y={470}
        width={((val - 2) / (Math.E - 2)) * 1000}
        height={30}
        fill={C.amber}
        opacity={0.8}
      />
      <line x1={1300} x2={1300} y1={450} y2={520} stroke={C.green} strokeWidth={3} />
      <Html x={1300} y={545} size={20} color={C.green}>
        <Tex tex="e\approx2{,}71828" />
      </Html>
      <Html x={300} y={545} size={18} color={C.dim}>
        <span className="prop-tag">2</span>
      </Html>
      <line x1={300} x2={1300} y1={680} y2={680} stroke={C.line} strokeWidth={3} />
      {NS.map((v, k) => (
        <Html key={v} x={300 + (k / (NS.length - 1)) * 1000} y={720} size={16} color={C.dim}>
          <span className="prop-tag">{v}</span>
        </Html>
      ))}
      <rect
        x={280}
        y={650}
        width={1040}
        height={60}
        fill="transparent"
        onPointerDown={onN}
        style={{ cursor: 'ew-resize' }}
      />
      <Knob
        x={300 + (i / (NS.length - 1)) * 1000}
        y={680}
        onPointerDown={onN}
        cursor="ew-resize"
        label={`n=${n}`}
      />
      <Group opacity={at(5) > 0.5 ? 1 : 0}>
        <Html x={800} y={790} size={20} color={C.muted}>
          <span>Más saltos dan más, pero nunca pasan de e.</span>
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Containment({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const n0 = pick(r, [2, 3, 5]);
    const b = pick(r, [2, 3]);
    const k = b === 2 ? pick(r, [5, 6, 7]) : pick(r, [3, 4, 5]);
    const pct = pick(r, [10, 20, 50]);
    const start = pick(r, [1000, 2000, 5000]);
    const keep = pick(r, [2, 3, 4]);
    const big = keep === 2 ? 4096 : keep === 3 ? 6561 : 4096;
    const limit = pick(r, [100, 50, 20]);
    let h = 0;
    while (big / keep ** h >= limit) h++;
    return { n0, b, k, pct, start, keep, big, limit, h };
  }, [seed]);
  const [val, setVal] = useState('');
  const rank = useMemo(() => spreadOrder(seed % 997, 0.5, 0.5), [seed]);

  useEffect(() => {
    if (round === 0)
      api.prompt(
        `A las 00:00 había ${data.n0} equipos infectados. A la 01:00 eran ${data.n0 * data.b}. Si sigue igual, ¿cuántos habrá a las ${hhmm(data.k)}?`,
        'N(t)=N_0\\cdot b^{t}',
      );
    else if (round === 1)
      api.prompt(
        `Hay ${thousands(data.start)} archivos cifrados y el número crece un ${data.pct} % cada hora. ¿Cuántos habrá en 2 horas?`,
        'N(t)=N_0\\,(1+r)^t',
      );
    else
      api.prompt(
        `El antivirus deja 1 de cada ${data.keep} infectados cada hora. Hay ${thousands(data.big)}. ¿Cuántas horas faltan para que queden menos de ${data.limit}?`,
        `N(t)=${data.big}\\cdot ${data.keep}^{-t}`,
      );
    api.hints(
      round === 0
        ? [
            `Cada hora se multiplica por ${data.b}: ${data.n0}, ${data.n0 * data.b}, ${data.n0 * data.b ** 2}, …`,
            `$${data.n0}\\cdot${data.b}^{${data.k}}$.`,
          ]
        : round === 1
          ? [
              `Crecer ${data.pct} % es multiplicar por ${dec(1 + data.pct / 100, 2)}.`,
              `El segundo ${data.pct} % se aplica sobre lo que ya creció: $${thousands(data.start)}\\cdot${dec(1 + data.pct / 100, 2)}^2$.`,
            ]
          : [
              `Divide por ${data.keep} una y otra vez y cuenta las veces.`,
              `Busca el primer $t$ con $${data.big}/${data.keep}^t<${data.limit}$.`,
            ],
    );
    setVal('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const truth = data.n0 * data.b ** data.k;
      const lin = data.n0 + data.k * (data.n0 * data.b - data.n0);
      if (v === truth)
        return api.result(
          true,
          `$${data.n0}\\cdot${data.b}^{${data.k}}=${thousands(truth)}$ equipos.`,
        );
      if (v === lin)
        return api.result(
          false,
          `Eso es sumar ${data.n0 * data.b - data.n0} cada hora. El virus no suma: multiplica por ${data.b}.`,
        );
      if (v === data.n0 * data.b * data.k)
        return api.result(
          false,
          `Multiplicaste por ${data.b * data.k}. Son ${data.k} multiplicaciones por ${data.b} seguidas: $${data.b}^{${data.k}}$.`,
        );
      return api.result(
        false,
        `Con ${thousands(v)} no cuadra: a las ${hhmm(data.k)} se han hecho ${data.k} multiplicaciones por ${data.b} desde ${data.n0}.`,
      );
    }
    if (round === 1) {
      const f = 1 + data.pct / 100;
      const truth = Math.round(data.start * f * f);
      const lin = Math.round(data.start * (1 + (2 * data.pct) / 100));
      if (Math.abs(v - truth) < 0.5)
        return api.result(
          true,
          `$${thousands(data.start)}\\cdot${dec(f, 2)}^2=${thousands(truth)}$. Más que sumar ${2 * data.pct} %.`,
        );
      if (Math.abs(v - lin) < 0.5)
        return api.result(
          false,
          `Eso suma ${2 * data.pct} % sobre lo inicial. En la segunda hora el ${data.pct} % se calcula sobre ${thousands(data.start * f)}, no sobre ${thousands(data.start)}.`,
        );
      return api.result(
        false,
        `En la primera hora llega a ${thousands(data.start * f)}. Aplica el ${data.pct} % otra vez sobre eso.`,
      );
    }
    if (v === data.h)
      return api.result(
        true,
        `A las ${data.h} h quedan ${dec(data.big / data.keep ** data.h, 1)}; una hora antes quedaban ${dec(data.big / data.keep ** (data.h - 1), 1)}.`,
      );
    return api.result(
      false,
      `A las ${v} h quedan $${data.big}/${data.keep}^{${v}}\\approx${dec(data.big / data.keep ** v, 1)}$: ${data.big / data.keep ** v < data.limit ? 'ya bajo el límite, pero ¿es la primera hora?' : `todavía ${data.limit} o más`}.`,
    );
  };

  const shown = round === 0 ? data.n0 : round === 1 ? 0 : COLS * ROWS;
  return (
    <Stage>
      <Grid
        n={round === 2 ? shown : round === 0 ? data.n0 * data.b : 0}
        rank={rank}
        color={round === 2 ? C.red : C.red}
      />
      {round === 1 && (
        <Html x={GX + (COLS * CELL) / 2} y={GY + (ROWS * CELL) / 2} size={26} color={C.muted}>
          <span>Servidor de registros · {thousands(data.start)} archivos cifrados</span>
        </Html>
      )}
      <NumberField
        x={GX}
        y={740}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 2 ? 'Horas:' : round === 1 ? 'Archivos en 2 h:' : 'Equipos:'}
        width={6}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c7',
  world: 'foundations',
  code: '1.7',
  title: 'El virus de las grúas',
  subtitle: 'Exponenciales',
  glyph: '2^t',
  kind: 'level',
  guide: 'teo',
  teaser:
    'Un virus se copia de equipo en equipo en la red del puerto, y cada hora hay el doble. Los registros de la salida están ahí.',
  learn:
    'Crecimiento exponencial $N_0b^t$, diferencia con el crecimiento lineal, leyes de potencias, exponentes negativos como división, crecimiento porcentual y el número $e$.',
  glyphs: ['power', 'negexp', 'euler'],
  pitfalls: [
    '$2^{10}$ no es $2\\cdot10$: son diez multiplicaciones por 2.',
    'Crecer 10 % dos veces es crecer 21 %, no 20 %.',
    '$2^{-3}$ es $1/8$, no un número negativo.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        {
          who: 'nar',
          text: 'Sala de servidores, viernes, una de la madrugada. Un ventilador rozaba su carcasa cada pocos segundos, y Teo ya había dejado de oírlo.',
        },
        {
          who: 'teo',
          text: 'Los cuadros rojos son equipos infectados: eran 3 y ahora son 6. Cada uno contagia a otro cada hora.',
        },
        {
          who: 'iris',
          text: 'Lo primero son los registros. Si se pierden las guías, perdemos el camión.',
        },
        {
          who: 'teo',
          text: 'Tengo un antivirus, pero antes necesito saber a qué velocidad se llena la pantalla.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Contagio',
      Scene: VirusDemo,
      beats: [
        {
          say: 'Cada hora, cada equipo infectado infecta a otro: el total se duplica.',
          gate: 'Arrastra el reloj hasta la hora 9.',
          note: {
            label: 'Crecimiento exponencial',
            tex: 'N(t)=3\\cdot2^{t}',
            body: 'No suma lo mismo cada hora: **multiplica** por lo mismo. En 9 horas, 1 536 equipos.',
          },
        },
        {
          say: 'En rojo, el virus. En celeste, algo que suma 3 equipos por hora. Al principio van parejos.',
          ask: {
            prompt:
              'En la primera hora el virus infectó 3 equipos nuevos. ¿Cuántos nuevos infecta entre la hora 8 y la 9?',
            options: ['768', '3', '24'],
            answer: 0,
            explain:
              'Los nuevos de cada hora son tantos como los que ya había: a las 8 h eran 768, así que se suman 768 más.',
          },
          note: {
            label: 'Lineal contra exponencial',
            body: 'Lineal: suma lo mismo cada hora. Exponencial: lo que crece es proporcional a lo que hay.',
          },
        },
        {
          say: 'En 3 horas el virus multiplica los infectados por $2^3=8$.',
          ask: {
            prompt: '¿Por cuánto los multiplica en 6 horas?',
            options: ['Por 64', 'Por 16', 'Por 48'],
            answer: 0,
            explain:
              '6 horas son 3 horas y luego otras 3: multiplicar por 8 y otra vez por 8 da 64. Los exponentes se suman.',
          },
          note: {
            label: 'Leyes de potencias',
            tex: '\\begin{aligned}a^m\\,a^n&=a^{m+n}\\\\ (a^m)^n&=a^{mn}\\\\ a^0&=1\\end{aligned}',
            body: 'Cero horas: no se multiplica nada, por eso $2^0=1$.',
          },
        },
        {
          say: 'Teo lanza un antivirus: cada hora limpia la mitad de los equipos infectados.',
          gate: 'Arrastra el reloj hasta que queden 6 infectados.',
          note: {
            label: 'Decaimiento',
            tex: 'N(t)=1536\\cdot\\left(\\tfrac12\\right)^t=1536\\cdot2^{-t}',
            body: 'Exponente negativo: dividir. $2^{-1}=\\tfrac12$, $2^{-8}=\\tfrac1{256}$.',
          },
        },
        {
          say: 'Otra cepa del virus, más lenta, cifra archivos: su número crece un 10 % cada hora.',
          ask: {
            prompt: 'Si crece 10 % por hora, ¿cuánto crece en 2 horas?',
            options: ['21 %', '20 %', '10 %'],
            answer: 0,
            explain:
              '$1000\\to1100\\to1210$. El segundo 10 % se calcula sobre 1 100, no sobre 1 000: $1{,}1^2=1{,}21$.',
          },
          note: {
            label: 'Crecimiento porcentual',
            tex: 'N(t)=N_0\\,(1+r)^t',
            body: 'Crecer un $r$ por uno cada hora es multiplicar por $1+r$.',
          },
        },
        {
          say: 'Si crecer 100 % en una hora se reparte en muchos saltos pequeños, ¿cuánto se crece?',
          gate: 'Arrastra n hasta 1 000.',
          note: {
            label: 'El número e',
            tex: 'e=\\lim_{n\\to\\infty}\\left(1+\\tfrac1n\\right)^n\\approx2{,}718',
            body: 'El tope del crecimiento repartido en infinitos pasos. Aparece en todo lo que crece de forma continua.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Contención', Comp: Containment, rounds: 3 },
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        {
          who: 'teo',
          text: 'Sin hacer nada, los 3 serían 1 536 en nueve horas. El antivirus puede limpiar la mitad cada hora.',
        },
        { who: 'iris', text: '¿Y aduanas?' },
        {
          who: 'teo',
          text: 'Allá hay otra cepa: empezó con un equipo y se duplica cada hora. En esa red está el millón de registros.',
        },
        {
          who: 'iris',
          text: 'Las 150 dosis salieron por aduanas. Quien eligió dónde soltar el segundo virus sabía qué estaba eligiendo.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'power',
    world: 'foundations',
    tex: 'b^{t}',
    name: 'Potencia',
    read: 'be elevado a te',
    meaning: 'Multiplicar $b$ por sí mismo $t$ veces. $b$ es la base y $t$ el exponente.',
  },
  {
    id: 'negexp',
    world: 'foundations',
    tex: 'b^{-t}=\\frac{1}{b^{t}}',
    name: 'Exponente negativo',
    read: 'be a la menos te',
    meaning: 'Dividir $t$ veces por $b$.',
  },
  {
    id: 'euler',
    world: 'foundations',
    tex: 'e',
    name: 'Número e',
    read: 'e',
    meaning: 'Límite de $(1+1/n)^n$, aproximadamente 2,718. Base natural del crecimiento continuo.',
  },
];
