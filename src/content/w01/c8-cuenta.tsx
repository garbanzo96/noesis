import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { DragCue, Confirm, Knob, NumberField, dec, parseNum, thousands } from '../shared/ui';

// ============================================================================
// CASO 1.8 · «Cuenta regresiva» — logaritmos
// ¿Cuántas duplicaciones para llegar a un millón? log₂ como contador de duplicaciones; regla
// logarítmica (factores iguales = distancias iguales); regla de cálculo: log(ab)=log a+log b;
// log(a^k)=k log a; decibeles (base 10); cambio de base y ln.
// ============================================================================

/** Base-2 ruler: value 2^k sits at x0 + k·unit. */
function Ruler2({ x0, y, unit, kmax, offset = 0, color = C.amber, below = false, hi, onClickValue }: { x0: number; y: number; unit: number; kmax: number; offset?: number; color?: string; below?: boolean; hi?: number[]; onClickValue?: (v: number) => void }) {
  const s = below ? 1 : -1;
  return (
    <g>
      <rect x={x0 + offset * unit - 30} y={below ? y : y - 70} width={kmax * unit + 60} height={70} rx={6} fill="#120f22" stroke={color} strokeOpacity={0.5} />
      {Array.from({ length: kmax + 1 }, (_, k) => {
        const x = x0 + (k + offset) * unit;
        const v = 2 ** k;
        const on = hi?.includes(v);
        return (
          <g key={k} onClick={onClickValue ? () => onClickValue(v) : undefined} style={{ cursor: onClickValue ? 'pointer' : undefined }}>
            {onClickValue && <rect x={x - unit / 2} y={below ? y : y - 70} width={unit} height={70} fill="transparent" />}
            <line x1={x} x2={x} y1={y} y2={y + s * 22} stroke={on ? C.text : color} strokeWidth={on ? 4 : 2.5} />
            <Html x={x} y={y + s * 44} size={v >= 1000 ? 15 : 19} color={on ? C.text : color}>
              <span className="prop-tag">{thousands(v)}</span>
            </Html>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------- demo
function LogDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const [off, setOff] = useState(0);
  const offT = useTween(off, 0.25);
  const onT = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - 200) / 1200) * 24, 0, 24));
    setT(v);
    if (v === 20) unlock();
  });
  const grab = useRef(0);
  const onOff = useSvgDrag(svg, (x, _y, phase) => {
    if (phase === 'start') grab.current = x - (260 + off * 90);
    const v = Math.round(clamp((x - grab.current - 260) / 90, 0, 8));
    setOff(v);
    if (v === 3) unlock();
  });

  if (beat === 0) {
    const N = 2 ** t;
    return (
      <Stage ref={svg}>
        <Html x={800} y={140} size={22} color={C.muted}>
          <span>Servidores de aduanas · 1 000 000 de registros · el virus empieza en 1</span>
        </Html>
        <Html x={800} y={290} size={80} color={N >= 1e6 ? C.red : C.text}>
          <span className="prop-tag">{thousands(N)}</span>
        </Html>
        <Html x={800} y={390} size={30} color={C.amber}>
          <Tex tex={`2^{${t}}`} />
        </Html>
        <rect x={200} y={470} width={1200} height={26} fill="#1d1733" />
        <rect x={200} y={470} width={Math.min(1, N / 1e6) * 1200} height={26} fill={N >= 1e6 ? C.red : C.amber} opacity={0.8} />
        <Html x={1400} y={520} size={16} anchor="right" color={C.dim}>
          <span className="prop-tag">1 000 000</span>
        </Html>
        <line x1={200} x2={1400} y1={660} y2={660} stroke={C.line} strokeWidth={3} />
        {Array.from({ length: 25 }, (_, k) => (
          <Html key={k} x={200 + (k / 24) * 1200} y={695} size={14} color={C.dim}>
            <span className="prop-tag">{k}</span>
          </Html>
        ))}
        <rect x={180} y={630} width={1240} height={60} fill="transparent" onPointerDown={onT} style={{ cursor: 'ew-resize' }} />
        <Knob x={200 + (t / 24) * 1200} y={660} onPointerDown={onT} cursor="ew-resize" label={`${t} h`} />
      </Stage>
    );
  }
  if (beat === 1) {
    const X = (e: number) => 200 + (e / 6) * 1200;
    return (
      <Stage>
        <Html x={800} y={160} size={22} color={C.muted}>
          <span>Regla logarítmica: cada paso multiplica por 10</span>
        </Html>
        <line x1={X(0)} x2={X(6)} y1={420} y2={420} stroke={C.amber} strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5, 6].map((e) => (
          <g key={e}>
            <line x1={X(e)} x2={X(e)} y1={404} y2={436} stroke={e === 3 && answer !== null ? C.green : C.amber} strokeWidth={e === 3 && answer !== null ? 5 : 3} />
            <Html x={X(e)} y={470} size={22} color={e === 3 && answer !== null ? C.green : C.text}>
              <span className="prop-tag">{thousands(10 ** e)}</span>
            </Html>
            {e < 6 && (
              <Html x={(X(e) + X(e + 1)) / 2} y={380} size={18} color={C.amber}>
                <span className="prop-tag">×10</span>
              </Html>
            )}
          </g>
        ))}
        {answer !== null && (
          <Html x={800} y={620} size={30} color={C.text}>
            <Tex tex="1\cdot1000=1000,\qquad 1000\cdot1000=1\,000\,000" />
          </Html>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    const unit = 90;
    const x0 = 260;
    return (
      <Stage ref={svg}>
        <Html x={800} y={150} size={22} color={C.muted}>
          <span>Regla de cálculo de Teo: dos reglas iguales, la de abajo se desliza</span>
        </Html>
        <Ruler2 x0={x0} y={400} unit={unit} kmax={12} hi={off === 3 ? [128] : [8]} />
        <g onPointerDown={onOff} style={{ cursor: 'ew-resize' }}>
          <Ruler2 x0={x0} y={410} unit={unit} kmax={8} offset={offT} color={C.cyan} below hi={off === 3 ? [1, 16] : [1]} />
          <DragCue x={x0 + offT * unit} y={410} axis="x" color={C.cyan} />
        </g>
        {off === 3 && (
          <>
            <line x1={x0 + 7 * unit} x2={x0 + 7 * unit} y1={300} y2={520} stroke={C.green} strokeWidth={2} strokeDasharray="6 6" />
            <Html x={800} y={660} size={30} color={C.text}>
              <Tex tex="\log_2 8+\log_2 16=3+4=7=\log_2 128" />
            </Html>
          </>
        )}
      </Stage>
    );
  }
  if (beat === 3)
    return (
      <Stage>
        <Html x={800} y={250} size={34} color={C.text}>
          <Tex tex="2^{10}=1024\approx1000" />
        </Html>
        <Group opacity={answer !== null ? 1 : 0}>
          <Html x={800} y={400} size={34} color={C.text}>
            <Tex tex="1\,000\,000=1000^2\approx\left(2^{10}\right)^2=2^{20}" />
          </Html>
          <Html x={800} y={540} size={30} color={C.amber}>
            <Tex tex="\log_2\left(1000^2\right)=2\log_2 1000\approx2\cdot10=20" />
          </Html>
        </Group>
      </Stage>
    );
  if (beat === 4) {
    const levels = [
      ['susurro', 30],
      ['oficina', 60],
      ['alarma de aduanas', 90],
    ] as const;
    return (
      <Stage>
        {levels.map(([n, db], i) => (
          <g key={n}>
            <rect x={340 + i * 340} y={640 - db * 5} width={160} height={db * 5} fill={i === 2 ? C.red : C.cyan} opacity={0.6} />
            <Html x={420 + i * 340} y={670} size={26} color={C.text}>
              <span className="prop-tag">{db} dB</span>
            </Html>
            <Html x={420 + i * 340} y={710} size={18} color={C.muted}>
              <span>{n}</span>
            </Html>
          </g>
        ))}
        {answer !== null && (
          <Html x={800} y={160} size={28} color={C.text}>
            <Tex tex="90-60=30\ \text{dB}=3\ \text{saltos de}\times10\ \Rightarrow\ \times1000" />
          </Html>
        )}
      </Stage>
    );
  }
  return (
    <Stage>
      <Html x={800} y={230} size={36} color={C.text}>
        <Tex tex="\log_2 N=\dfrac{\log_{10}N}{\log_{10}2}" />
      </Html>
      <Html x={800} y={400} size={30} color={C.amber}>
        <Tex tex="\log_2 1\,000\,000=\dfrac{6}{0{,}301}\approx19{,}93" />
      </Html>
      <Html x={800} y={560} size={30} color={C.cyan}>
        <Tex tex="\ln x=\log_e x,\qquad \ln e=1" />
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Countdown({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    // round 0
    const every = pick(r, [1, 2, 3]);
    const target = pick(r, [5000, 50000, 200000, 1000000]);
    const doublings = Math.ceil(Math.log2(target));
    // round 1
    const mul = r() < 0.6;
    const ka = mul ? randInt(r, 3, 6) : randInt(r, 5, 10);
    const a = 2 ** ka;
    const b = 2 ** (mul ? randInt(r, 2, 5) : randInt(r, 2, Math.min(ka - 1, 8)));
    // round 2
    const k = randInt(r, 1, 4);
    const j = r() < 0.4 ? 1 : 0;
    const base = pick(r, [40, 50, 55, 60]);
    return { every, target, doublings, mul, a, b, k, j, base };
  }, [seed]);
  const [val, setVal] = useState('');
  const [off, setOff] = useState(0);
  const offT = useTween(off, 0.25);
  const [readV, setReadV] = useState<number | null>(null);
  const grab = useRef(0);
  const onOff = useSvgDrag(svg, (x, _y, phase) => {
    if (phase === 'start') grab.current = x - (200 + off * 90);
    setOff(Math.round(clamp((x - grab.current - 200) / 90, -8, 12)));
  });

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Otra cepa empieza en 1 equipo y se duplica cada ${data.every === 1 ? 'hora' : `${data.every} horas`}. ¿Cuántas horas tarda en superar ${thousands(data.target)} equipos?`, `2^{n}>${data.target}\\iff n>\\log_2 ${data.target}`);
      api.hints(['Primero cuenta las duplicaciones que hacen falta: $2^{10}\\approx1000$ ayuda.', `Hacen falta ${data.doublings} duplicaciones. Cada una toma ${data.every} h.`]);
    } else if (round === 1) {
      api.prompt(data.mul ? `Calcula $${data.a}\\times${data.b}$ con la regla: desliza la de abajo y pulsa el resultado en la de arriba.` : `Calcula $${data.a}\\div${data.b}$ con la regla: desliza la de abajo y pulsa el resultado en la de arriba.`, data.mul ? '\\log(ab)=\\log a+\\log b' : '\\log\\frac ab=\\log a-\\log b');
      api.hints([data.mul ? `Pon el 1 de abajo bajo el ${data.a} de arriba.` : `Pon el ${data.b} de abajo bajo el ${data.a} de arriba.`, data.mul ? `Lee arriba lo que queda sobre el ${data.b} de abajo.` : 'Lee arriba lo que queda sobre el 1 de abajo.']);
    } else {
      api.prompt(`En la aduana suena una alarma de ${data.base + 10 * data.k + 3 * data.j} dB; en la oficina hay ${data.base} dB. ¿Cuántas veces más intensa es la alarma?`, '\\Delta\\text{dB}=10\\log_{10}\\frac{I_1}{I_2}');
      api.hints(['Cada 10 dB la intensidad se multiplica por 10.', 'Y 3 dB equivalen, casi exactamente, a multiplicar por 2.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (readV === null) return;
      const truth = data.mul ? data.a * data.b : data.a / data.b;
      if (readV === truth) return api.result(true, `$\\log_2 ${data.a}${data.mul ? '+' : '-'}\\log_2 ${data.b}=${Math.log2(data.a)}${data.mul ? '+' : '-'}${Math.log2(data.b)}=${Math.log2(truth)}$: ${thousands(truth)}.`);
      return api.result(false, `${thousands(readV)} es $2^{${Math.log2(readV)}}$. ${data.mul ? `Sumando distancias: ${Math.log2(data.a)} + ${Math.log2(data.b)}` : `Restando distancias: ${Math.log2(data.a)} − ${Math.log2(data.b)}`} = ${Math.log2(truth)}.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const truth = data.doublings * data.every;
      if (v === truth) return api.result(true, `$2^{${data.doublings}}=${thousands(2 ** data.doublings)}$ supera ${thousands(data.target)} y $2^{${data.doublings - 1}}=${thousands(2 ** (data.doublings - 1))}$ no. ${data.doublings} duplicaciones × ${data.every} h = ${truth} h.`);
      if (v === data.doublings) return api.result(false, `${data.doublings} son las duplicaciones. Pero cada una toma ${data.every} h.`);
      const n = v / data.every;
      return api.result(false, `En ${v} h hay ${dec(n, 1)} duplicaciones: $2^{${dec(n, 1)}}\\approx${thousands(2 ** n)}$, ${2 ** n > data.target ? 'ya lo supera, pero ¿es lo antes posible?' : 'todavía no alcanza'}.`);
    }
    const truth = 10 ** data.k * 2 ** data.j;
    if (Math.abs(v - truth) / truth < 0.06) return api.result(true, `${10 * data.k + 3 * data.j} dB de diferencia: $10^{${data.k}}${data.j ? '\\cdot2' : ''}=${thousands(truth)}$ veces.`);
    if (v === 10 * data.k + 3 * data.j) return api.result(false, `${v} son los decibeles de diferencia, no el factor. Cada 10 dB multiplican por 10.`);
    return api.result(false, `Con ${thousands(v)} veces, la diferencia sería $10\\log_{10}${thousands(v)}\\approx${dec(10 * Math.log10(v), 1)}$ dB, no ${10 * data.k + 3 * data.j}.`);
  };

  if (round === 1) {
    const unit = 90;
    const x0 = 200;
    return (
      <Stage ref={svg}>
        <Ruler2 x0={x0} y={360} unit={unit} kmax={12} hi={readV !== null ? [readV] : []} onClickValue={setReadV} />
        <g onPointerDown={onOff} style={{ cursor: 'ew-resize' }}>
          <Ruler2 x0={x0} y={370} unit={unit} kmax={8} offset={offT} color={C.cyan} below />
          <DragCue x={x0 + offT * unit} y={370} axis="x" color={C.cyan} />
        </g>
        <Html x={800} y={620} size={26} color={C.muted}>
          <span>{readV === null ? 'Pulsa el resultado en la regla de arriba' : `Tu lectura: ${thousands(readV)}`}</span>
        </Html>
        <Confirm onClick={submit} disabled={readV === null} />
      </Stage>
    );
  }
  return (
    <Stage>
      {round === 0 ? (
        <Html x={800} y={300} size={30} color={C.text}>
          <Tex tex={`1\\to2\\to4\\to8\\to\\dots\\to\\ ?\\ >${thousands(data.target).replace(/ /g, '\\,')}`} />
        </Html>
      ) : (
        <>
          <rect x={420} y={520 - (data.base * 4)} width={180} height={data.base * 4} fill={C.cyan} opacity={0.6} />
          <rect x={1000} y={520 - (data.base + 10 * data.k + 3 * data.j) * 4} width={180} height={(data.base + 10 * data.k + 3 * data.j) * 4} fill={C.red} opacity={0.6} />
          <Html x={510} y={550} size={26} color={C.text}>
            <span className="prop-tag">{data.base} dB</span>
          </Html>
          <Html x={1090} y={550} size={26} color={C.text}>
            <span className="prop-tag">{data.base + 10 * data.k + 3 * data.j} dB</span>
          </Html>
        </>
      )}
      <NumberField x={520} y={680} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'Horas:' : 'Veces más intensa:'} width={7} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c8',
  world: 'foundations',
  code: '1.8',
  title: 'Cuenta regresiva',
  subtitle: 'Logaritmos',
  glyph: '\\log',
  kind: 'level',
  guide: 'teo',
  teaser: 'El virus llegó a aduanas. Si se duplica cada hora, ¿cuándo alcanza el millón de registros? La respuesta es un logaritmo.',
  learn: 'Logaritmo como inverso de la potencia y contador de multiplicaciones, escala logarítmica, $\\log(ab)=\\log a+\\log b$, $\\log a^k=k\\log a$, base 10 en decibeles, cambio de base y $\\ln$.',
  glyphs: ['log', 'ln', 'logprod'],
  pitfalls: ['$\\log(a+b)$ no es $\\log a+\\log b$: la regla es para productos.', '$\\log_2 N$ pregunta por el exponente, no por la mitad de $N$.', 'En escala logarítmica, la mitad del camino entre 1 y un millón es 1 000, no 500 000.'],
  steps: [
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        { who: 'nar', text: 'Servidores de aduanas, viernes, 20:40; suena la alarma.' },
        { who: 'teo', text: 'Esta cepa empezó con uno y se duplica cada hora. El millón de registros está en la misma red.' },
        { who: 'iris', text: 'Dame el plazo para aislarla. «Pronto» no cabe en el reloj.' },
        { who: 'tu', text: 'La desconectaría antes de que llegue al millón, aunque quede tiempo para otra copia.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Duplicaciones',
      Scene: LogDemo,
      beats: [
        {
          say: 'La pregunta es al revés que en el caso anterior: no cuántos hay en $t$ horas, sino cuántas horas para llegar a un número.',
          gate: 'Arrastra el reloj hasta pasar el millón.',
          note: { label: 'Logaritmo', tex: '\\log_2 N=t\\iff 2^t=N', body: 'Cuenta cuántas duplicaciones llevan de 1 a $N$. $\\log_2 1\\,000\\,000\\approx19{,}93$: a las 20 h lo supera.' },
        },
        {
          say: 'En una regla logarítmica, cada paso igual multiplica por lo mismo.',
          ask: {
            prompt: 'En esta regla, ¿dónde queda 1 000 entre 1 y 1 000 000?',
            options: ['Justo al medio', 'Muy cerca del 1', 'Muy cerca del millón'],
            answer: 0,
            explain: 'De 1 a 1 000 hay que multiplicar por 1 000; de 1 000 a un millón, también. Mismos factores, mismas distancias.',
          },
          note: { label: 'Escala logarítmica', body: 'Distancias iguales significan factores iguales. Sirve para ver juntos números muy chicos y muy grandes.' },
        },
        {
          say: 'Teo trae una regla de cálculo: dos reglas logarítmicas. Deslizar una sobre otra suma distancias.',
          gate: 'Desliza la regla de abajo hasta que su 1 quede bajo el 8.',
          note: { label: 'Producto a suma', tex: '\\log(ab)=\\log a+\\log b', body: 'Sobre el 16 de abajo se lee 128: $8\\cdot16$. Sumar distancias es multiplicar números.' },
        },
        {
          say: 'Un truco que usaba Teo: $2^{10}=1024$, casi mil.',
          ask: {
            prompt: '¿Cuántas duplicaciones son, aproximadamente, un millón?',
            options: ['Unas 20', 'Unas 2 000', 'Unas 100'],
            answer: 0,
            explain: 'Un millón es mil por mil. Mil son unas 10 duplicaciones, así que un millón son unas 20.',
          },
          note: { label: 'Potencia a producto', tex: '\\log\\left(a^k\\right)=k\\log a' },
        },
        {
          say: 'Los decibeles usan base 10: cada 10 dB más, el sonido es 10 veces más intenso.',
          ask: {
            prompt: 'La oficina está a 60 dB y la alarma a 90 dB. ¿Cuántas veces más intensa es la alarma?',
            options: ['1 000 veces', '30 veces', '1,5 veces'],
            answer: 0,
            explain: '30 dB son tres saltos de 10 dB: $10\\cdot10\\cdot10=1000$.',
          },
          note: { label: 'Base 10', tex: '\\text{dB}=10\\log_{10}\\frac{I}{I_0}' },
        },
        {
          say: 'Cualquier base se puede convertir en otra dividiendo. La base $e$ tiene nombre propio: $\\ln$.',
          dur: 2,
          note: { label: 'Cambio de base', tex: '\\log_b N=\\frac{\\log_{10}N}{\\log_{10}b},\\qquad \\ln=\\log_e', body: '$\\log_{10}2\\approx0{,}301$, así que $\\log_2 10^6\\approx6/0{,}301\\approx19{,}93$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Contrarreloj', Comp: Countdown, rounds: 3 },
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        { who: 'teo', text: 'El modelo llega al millón en unas 19,93 horas; a las 20 lo supera. La aislé a las 19 horas de iniciarse.' },
        { who: 'iris', text: 'El virus nos tuvo aquí mientras preparaban la cita. Hoy es viernes.' },
        { who: 'tu', text: 'La nota decía nueve. Son casi las 21:00.' },
        { who: 'iris', text: 'Y el muelle norte sigue recibiendo carga.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'log', world: 'foundations', tex: '\\log_b N', name: 'Logaritmo', read: 'logaritmo en base be de ene', meaning: 'El exponente al que hay que elevar $b$ para obtener $N$: $\\log_b N=t\\iff b^t=N$.' },
  { id: 'ln', world: 'foundations', tex: '\\ln x', name: 'Logaritmo natural', read: 'ele ene de equis', meaning: 'Logaritmo en base $e\\approx2{,}718$.' },
  { id: 'logprod', world: 'foundations', tex: '\\log(ab)=\\log a+\\log b', name: 'Producto a suma', read: 'log de a por be', meaning: 'El logaritmo convierte multiplicaciones en sumas y potencias en productos.', warn: 'No hay regla para $\\log(a+b)$.' },
];
