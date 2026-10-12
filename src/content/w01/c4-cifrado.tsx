import { useEffect, useMemo, useState } from 'react';
import { Panel } from '../../art/props';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Arrow } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng, shuffle } from '../shared/rng';
import { Confirm, dec } from '../shared/ui';

// ============================================================================
// CASO 1.4 · «El mensaje cifrado» — composición e inversas
// Letra → número → engranajes. Componer = encadenar; el orden importa; para descifrar se
// deshacen los pasos en orden inverso; una máquina que junta dos letras no se puede invertir.
// ============================================================================

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const num = (ch: string) => ABC.indexOf(ch) + 1;
const letter = (n: number) => (Number.isInteger(n) && n >= 1 && n <= 26 ? ABC[n - 1] : null);

export interface Op {
  k: 'add' | 'sub' | 'mul' | 'div';
  v: number;
}
export const apply = (o: Op, x: number) => (o.k === 'add' ? x + o.v : o.k === 'sub' ? x - o.v : o.k === 'mul' ? x * o.v : x / o.v);
export const inv = (o: Op): Op => ({ k: o.k === 'add' ? 'sub' : o.k === 'sub' ? 'add' : o.k === 'mul' ? 'div' : 'mul', v: o.v });
export const opLabel = (o: Op) => `${{ add: '+', sub: '−', mul: '×', div: '÷' }[o.k]}${o.v}`;
const same = (a: Op, b: Op) => a.k === b.k && a.v === b.v;
export const run = (ops: Op[], x: number) => ops.reduce((acc, o) => apply(o, acc), x);
export const show = (n: number) => (Number.isInteger(n) ? String(n) : dec(n, 2));

/** A chain of gears: value chips between operation boxes, left to right. */
export function Pipeline({ ops, input, x, y, gap = 230, color = C.cyan, inLabel }: { ops: (Op | null)[]; input: number | null; x: number; y: number; gap?: number; color?: string; inLabel?: string }) {
  const vals: (number | null)[] = [input];
  for (const o of ops) {
    const prev = vals[vals.length - 1];
    vals.push(prev === null || o === null ? null : apply(o, prev));
  }
  return (
    <g>
      {vals.map((v, i) => {
        const cx = x + i * gap;
        const bad = v !== null && (!Number.isInteger(v) || v < 1);
        return (
          <g key={'v' + i}>
            <rect x={cx - 52} y={y - 34} width={104} height={68} rx={10} fill="#0b0918" stroke={bad ? C.red : i === 0 ? C.amber : color} strokeWidth={2.5} />
            <Html x={cx} y={y} size={30} color={bad ? C.red : C.text}>
              <span className="prop-tag">{v === null ? '·' : show(v)}</span>
            </Html>
            {i === 0 && inLabel && (
              <Html x={cx} y={y - 58} size={18} color={C.amber}>
                <span className="prop-tag">{inLabel}</span>
              </Html>
            )}
          </g>
        );
      })}
      {ops.map((o, i) => {
        const cx = x + i * gap + gap / 2;
        return (
          <g key={'o' + i}>
            <Arrow from={[cx - gap / 2 + 56, y]} to={[cx + gap / 2 - 58, y]} color={C.dim} width={2.5} />
            <rect x={cx - 38} y={y - 74} width={76} height={40} rx={8} fill={o ? '#1d1733' : 'transparent'} stroke={o ? color : C.dim} strokeDasharray={o ? undefined : '6 6'} strokeWidth={2} />
            <Html x={cx} y={y - 54} size={22} color={o ? color : C.dim}>
              <span className="prop-tag">{o ? opLabel(o) : '?'}</span>
            </Html>
          </g>
        );
      })}
    </g>
  );
}

function LetterKeys({ x, y, letters, onPick, sel, cols = 13, size = 64 }: { x: number; y: number; letters: string; onPick: (ch: string) => void; sel: string[]; cols?: number; size?: number }) {
  return (
    <g>
      {[...letters].map((ch, i) => {
        const cx = x + (i % cols) * (size + 10);
        const cy = y + Math.floor(i / cols) * (size + 10);
        const on = sel.includes(ch);
        return (
          <g key={ch} onClick={() => onPick(ch)} style={{ cursor: 'pointer' }}>
            <rect x={cx} y={cy} width={size} height={size} rx={8} fill={on ? '#28e7fa33' : '#120f22'} stroke={on ? C.cyan : C.line} strokeWidth={2} />
            <Html x={cx + size / 2} y={cy + size / 2 - 6} size={26} color={on ? C.text : C.muted}>
              <span className="prop-tag">{ch}</span>
            </Html>
            <Html x={cx + size / 2} y={cy + size - 12} size={12} color={C.dim}>
              <span className="prop-tag">{num(ch)}</span>
            </Html>
          </g>
        );
      })}
    </g>
  );
}

const MUL3: Op = { k: 'mul', v: 3 };
const ADD7: Op = { k: 'add', v: 7 };

// ---------------------------------------------------------------- demo
function CipherDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const [ch, setCh] = useState<string | null>(null);
  const [slots, setSlots] = useState<Op[]>([]);
  const decodeOK = slots.length === 2 && same(slots[0], inv(ADD7)) && same(slots[1], inv(MUL3));
  useEffect(() => {
    if (decodeOK) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodeOK]);
  const tiles: Op[] = [inv(MUL3), inv(ADD7)];

  return (
    <Stage>
      {/* beat 0: encode a letter */}
      {beat === 0 && (
        <g>
          <Html x={800} y={130} size={22} color={C.muted}>
            <span>Máquina de la bodega · alfabeto de 26 letras, A = 1</span>
          </Html>
          <Pipeline ops={[MUL3, ADD7]} input={ch ? num(ch) : null} x={560} y={330} inLabel={ch ?? 'letra'} />
          <Html x={560 + 2 * 230 + 90} y={330} size={22} anchor="left" color={C.text}>
            <span>código</span>
          </Html>
          <LetterKeys x={500} y={540} letters="ABCDEFGH" cols={8} sel={ch ? [ch] : []} onPick={(c) => { setCh(c); unlock(); }} />
        </g>
      )}
      {/* beat 1: order of the gears */}
      {beat === 1 && (
        <g>
          <Html x={300} y={260} size={22} anchor="right" color={C.cyan}>
            <Tex tex="g(f(x))" />
          </Html>
          <Pipeline ops={[MUL3, ADD7]} input={3} x={400} y={260} inLabel="C" />
          <Group opacity={answer !== null ? 1 : 0.15}>
            <Html x={300} y={560} size={22} anchor="right" color={C.magenta}>
              <Tex tex="f(g(x))" />
            </Html>
            <Pipeline ops={[ADD7, MUL3]} input={3} x={400} y={560} color={C.magenta} inLabel="C" />
          </Group>
        </g>
      )}
      {/* beat 2: decode 22 */}
      {beat === 2 && (
        <g>
          <Html x={800} y={130} size={22} color={C.muted}>
            <span>Primer número de la nota: 22. Monta la máquina que lo devuelve a su letra.</span>
          </Html>
          <Pipeline ops={[slots[0] ?? null, slots[1] ?? null]} input={22} x={560} y={340} color={C.amber} inLabel="código" />
          {slots.length === 2 && (
            <Html x={560 + 2 * 230} y={420} size={30} color={decodeOK ? C.green : C.red}>
              <span className="prop-tag">{decodeOK ? 'E' : 'no es una letra'}</span>
            </Html>
          )}
          {tiles.map((o, i) => {
            const used = slots.some((s) => same(s, o));
            return (
              <g key={i} onClick={() => !used && slots.length < 2 && setSlots([...slots, o])} style={{ cursor: used ? 'default' : 'pointer' }} opacity={used ? 0.3 : 1}>
                <rect x={620 + i * 220} y={560} width={150} height={70} rx={10} fill="#1d1733" stroke={C.amber} strokeWidth={2.5} />
                <Html x={695 + i * 220} y={595} size={30} color={C.amber}>
                  <span className="prop-tag">{opLabel(o)}</span>
                </Html>
              </g>
            );
          })}
          {slots.length > 0 && !decodeOK && (
            <Html x={800} y={700} size={20} interactive>
              <button className="stage-btn" onClick={() => setSlots([])}>
                Vaciar
              </button>
            </Html>
          )}
        </g>
      )}
      {/* beat 3: the inverse as reversed arrows */}
      {beat === 3 && (
        <g>
          {'ABCDEF'.split('').map((c, i) => {
            const y = 220 + i * 90;
            const k = at(3);
            return (
              <g key={c}>
                <Html x={520} y={y} size={30} color={C.amber}>
                  <span className="prop-tag">{c}</span>
                </Html>
                <Html x={1080} y={y} size={30} color={C.cyan}>
                  <span className="prop-tag">{3 * num(c) + 7}</span>
                </Html>
                <Arrow from={[570, y]} to={[1030, y]} color={C.cyan} width={2.5} opacity={1 - k} />
                <Arrow from={[1030, y]} to={[570, y]} color={C.amber} width={2.5} opacity={k} />
              </g>
            );
          })}
          <Html x={800} y={150} size={26} color={C.text}>
            <Tex tex={at(3) < 0.5 ? 'c=3x+7' : 'x=\\dfrac{c-7}{3}'} />
          </Html>
        </g>
      )}
      {/* beat 4: a machine that merges letters */}
      {beat === 4 && (
        <g>
          <Html x={800} y={140} size={22} color={C.muted}>
            <span>Máquina B: multiplica por 3 y se queda con el último dígito.</span>
          </Html>
          {[
            ['A', 230],
            ['K', 420],
            ['U', 610],
          ].map(([c, y]) => (
            <g key={c}>
              <Html x={480} y={Number(y)} size={34} color={C.amber}>
                <span className="prop-tag">{c}</span>
              </Html>
              <Html x={760} y={Number(y)} size={22} color={C.muted}>
                <Tex tex={`3\\cdot${num(String(c))}=${3 * num(String(c))}`} />
              </Html>
              <Arrow from={[540, Number(y)]} to={[660, Number(y)]} color={C.dim} />
              <Arrow from={[880, Number(y)]} to={[1080, 420]} color={answer !== null ? C.red : C.dim} width={answer !== null ? 3 : 2} />
            </g>
          ))}
          <circle cx={1130} cy={420} r={46} fill="#0b0918" stroke={C.red} strokeWidth={3} />
          <Html x={1130} y={420} size={40} color={C.text}>
            <span className="prop-tag">3</span>
          </Html>
        </g>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const WORDS = ['NORTE', 'GRUA', 'MUELLE', 'CERRO', 'NOCHE', 'FARO', 'MAREA', 'VIERNES'];
const MERGERS: { name: string; tex: string; f: (x: number) => number }[] = [
  { name: 'multiplica por 3 y se queda con el último dígito', tex: 'x\\mapsto \\text{último dígito de }3x', f: (x) => (3 * x) % 10 },
  { name: 'mide la distancia a la M (13)', tex: 'x\\mapsto |x-13|', f: (x) => Math.abs(x - 13) },
  { name: 'divide por 2 y descarta los decimales', tex: 'x\\mapsto \\lfloor x/2\\rfloor', f: (x) => Math.floor(x / 2) },
  { name: 'suma las cifras del número', tex: 'x\\mapsto \\text{suma de cifras de }x', f: (x) => String(x).split('').reduce((a, d) => a + Number(d), 0) },
];

function Decoder({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const word = pick(r, WORDS);
    if (round === 2) return { word, merger: pick(r, MERGERS), ops: [] as Op[], tiles: [] as Op[] };
    const a = pick(r, [2, 3, 4, 5]);
    const b = 1 + Math.floor(r() * 9);
    const ops: Op[] = round === 0 ? (r() < 0.5 ? [{ k: 'mul', v: a }, { k: 'add', v: b }] : [{ k: 'add', v: b }, { k: 'mul', v: a }]) : [{ k: 'add', v: b }, { k: 'mul', v: a }, { k: 'sub', v: pick(r, [2, 3, 4, 5, 6].filter((v) => v !== b && v < a * (1 + b))) }];
    const tiles = shuffle(r, [...ops.map(inv), ...ops.slice(0, round === 0 ? 1 : 2)]);
    return { word, ops, tiles, merger: MERGERS[0] };
  }, [seed, round]);
  const codes = useMemo(() => [...data.word].map((c) => run(data.ops, num(c))), [data]);
  const [slots, setSlots] = useState<(number | null)[]>(() => data.ops.map(() => null));
  const [sel, setSel] = useState<string[]>([]);

  useEffect(() => {
    if (round === 0) {
      api.prompt('Este fragmento se cifró con la máquina de arriba. Arma abajo la máquina que lo descifra.', '\\text{descifrar}=\\text{cifrar}^{-1}');
      api.hints(['Cada engranaje se deshace con su operación contraria: $+$ con $-$, $\\times$ con $\\div$.', 'El último paso del cifrado es el primero que hay que deshacer.']);
    } else if (round === 1) {
      api.prompt('Ahora la máquina tiene tres engranajes. Arma la que descifra este fragmento.', '(h\\circ g\\circ f)^{-1}=f^{-1}\\circ g^{-1}\\circ h^{-1}');
      api.hints(['Hay fichas de sobra: no todas sirven.', 'Lee la máquina de cifrado de derecha a izquierda y anota la operación contraria de cada paso.']);
    } else {
      api.prompt(`La máquina C ${data.merger.name}. Demuestra que no se puede descifrar: encuentra **dos letras** que den el mismo número.`, data.merger.tex);
      api.hints(['Prueba letras y mira sus salidas: busca una salida repetida.', 'Compara letras que estén a 10 posiciones de distancia, o en lados opuestos de la M.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const built = slots.map((i) => (i === null ? null : data.tiles[i]));
  const submit = () => {
    if (round < 2) {
      if (built.some((o) => o === null)) return;
      const ops = built as Op[];
      const out = codes.map((c) => run(ops, c));
      const ok = out.every((v, i) => v === num(data.word[i]));
      if (ok) return api.result(true, `Se lee **${data.word}**. Cada paso se deshizo en orden inverso.`);
      const c0 = codes[0];
      const trail = [c0];
      for (const o of ops) trail.push(apply(o, trail[trail.length - 1]));
      return api.result(false, `Con tu máquina, ${trail.map(show).join(' → ')}. Debía dar ${num(data.word[0])} (${data.word[0]}).`);
    }
    if (sel.length < 2) return;
    const [a, b] = sel;
    const fa = data.merger.f(num(a));
    const fb = data.merger.f(num(b));
    if (fa === fb) return api.result(true, `${a} y ${b} dan ${fa}. Si la nota dice ${fa}, no hay forma de saber cuál de las dos era: la máquina no tiene inversa.`);
    return api.result(false, `${a} da ${fa} y ${b} da ${fb}: salidas distintas.`);
  };

  if (round < 2) {
    const firstEmpty = slots.indexOf(null);
    return (
      <Stage>
        <Panel x={160} y={90} w={1280} h={170} title="NOTA DE LA BODEGA">
          <Html x={800} y={185} size={40} color={C.text}>
            <span className="prop-tag">{codes.map(show).join('  ·  ')}</span>
          </Html>
        </Panel>
        <Html x={180} y={360} size={18} anchor="left" color={C.cyan}>
          <span className="prop-tag">CIFRAR</span>
        </Html>
        <Pipeline ops={data.ops} input={num(data.word[0])} x={420} y={360} gap={200} inLabel={data.word[0]} />
        <Html x={180} y={560} size={18} anchor="left" color={C.amber}>
          <span className="prop-tag">DESCIFRAR</span>
        </Html>
        <Pipeline ops={built} input={codes[0]} x={420} y={560} gap={200} color={C.amber} />
        {slots.map((ti, i) => (
          <rect key={i} x={420 + i * 200 + 100 - 40} y={560 - 76} width={80} height={44} fill="transparent" style={{ cursor: ti === null ? 'default' : 'pointer' }} onClick={() => setSlots(slots.map((v, k) => (k === i ? null : v)))} />
        ))}
        {data.tiles.map((o, i) => {
          const used = slots.includes(i);
          return (
            <g key={i} onClick={() => !used && firstEmpty >= 0 && setSlots(slots.map((v, k) => (k === firstEmpty ? i : v)))} style={{ cursor: used ? 'default' : 'pointer' }} opacity={used ? 0.25 : 1}>
              <rect x={420 + i * 170} y={700} width={140} height={64} rx={10} fill="#1d1733" stroke={C.amber} strokeWidth={2.5} />
              <Html x={490 + i * 170} y={732} size={28} color={C.amber}>
                <span className="prop-tag">{opLabel(o)}</span>
              </Html>
            </g>
          );
        })}
        <Html x={180} y={732} size={16} anchor="left" color={C.muted}>
          <span>Fichas</span>
        </Html>
        <Confirm onClick={submit} disabled={slots.some((v) => v === null)} />
      </Stage>
    );
  }
  const toggle = (c: string) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : s.length >= 2 ? [s[1], c] : [...s, c]));
  return (
    <Stage>
      <Panel x={160} y={90} w={1280} h={150} title="MÁQUINA C">
        <Html x={800} y={175} size={34} color={C.text}>
          <Tex tex={data.merger.tex} />
        </Html>
      </Panel>
      <LetterKeys x={330} y={300} letters={ABC} sel={sel} onPick={toggle} />
      {sel.map((c, i) => (
        <g key={c}>
          <Html x={600 + i * 400} y={560} size={40} color={C.amber}>
            <span className="prop-tag">{c}</span>
          </Html>
          <Arrow from={[640 + i * 400, 560]} to={[760 + i * 400, 560]} color={C.dim} />
          <Html x={810 + i * 400} y={560} size={40} color={sel.length === 2 && data.merger.f(num(sel[0])) === data.merger.f(num(sel[1])) ? C.red : C.cyan}>
            <span className="prop-tag">{data.merger.f(num(c))}</span>
          </Html>
        </g>
      ))}
      <Confirm onClick={submit} disabled={sel.length < 2} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c4',
  world: 'foundations',
  code: '1.4',
  title: 'El mensaje cifrado',
  subtitle: 'Composición e inversas',
  glyph: 'f^{-1}',
  kind: 'level',
  guide: 'teo',
  teaser: 'En la puerta de la bodega del km 60 hay una nota con números. Una máquina convirtió letras en códigos: hay que hacerla andar hacia atrás.',
  learn: 'Componer funciones, por qué importa el orden, función inversa como deshacer pasos en orden contrario, y por qué una función que junta entradas no se puede invertir.',
  glyphs: ['compose', 'inverse', 'injective'],
  pitfalls: ['$g\\circ f$ significa «primero $f$, después $g$»: se lee de derecha a izquierda.', '$f^{-1}$ no es $1/f$: es la función que deshace a $f$.', 'Para invertir una cadena, se deshace primero el último paso.'],
  steps: [
    {
      kind: 'scene',
      place: 'bodega',
      lines: [
        { who: 'nar', text: 'Bodega del km 60, jueves, 18:00; cruje una plancha del techo.' },
        { who: 'teo', text: 'La nota tiene puros números y esta caja tiene dos engranajes con teclado. Todavía funciona.' },
        { who: 'iris', text: 'Descifra la nota sin destrozar la caja. Es lo único aquí que puede contar algo.' },
        { who: 'teo', text: 'Puedo probar una letra y seguir qué le hace cada engranaje. Después deshago los pasos.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La máquina',
      Scene: CipherDemo,
      beats: [
        {
          say: 'La máquina cambia cada letra por su número y lo pasa por dos engranajes: primero multiplica por 3, luego suma 7.',
          gate: 'Pulsa una letra del teclado.',
          note: { label: 'Composición', tex: '(g\\circ f)(x)=g(f(x))=3x+7', body: '$f$: multiplicar por 3. $g$: sumar 7. La salida de $f$ entra a $g$.' },
        },
        {
          say: 'Arriba, la máquina original con la letra C. Abajo, los mismos engranajes en el otro orden.',
          ask: {
            prompt: 'Si primero suma 7 y luego multiplica por 3, ¿qué sale con la C?',
            options: ['30', '16', '10'],
            answer: 0,
            explain: '$3+7=10$ y $10\\cdot3=30$. La máquina original daba 16: el orden de los engranajes cambia el resultado.',
          },
          note: { label: 'El orden importa', tex: 'f(g(x))=3(x+7)\\neq g(f(x))' },
        },
        {
          say: 'Para descifrar hay que deshacer cada paso. El último que se hizo es el primero que se deshace.',
          gate: 'Pulsa las dos fichas en el orden que descifra el 22.',
          note: { label: 'Inversa', tex: '(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}', body: 'Primero restar 7, luego dividir por 3: $22\\to15\\to5$, la **E**. Como quitarse zapatos y calcetines.' },
        },
        {
          say: 'La inversa da vuelta todas las flechas: cada código vuelve a su letra.',
          dur: 2.2,
          note: { label: 'Despejar', tex: 'c=3x+7\\iff x=\\frac{c-7}{3}' },
        },
        {
          say: 'La nota trae un segundo mensaje, hecho con otra máquina.',
          ask: {
            prompt: 'La máquina B convierte A, K y U en 3. Si el mensaje dice 3, ¿qué letra era?',
            options: ['No se puede saber', 'La A', 'La K'],
            answer: 0,
            explain: 'Tres letras distintas terminan en el mismo número. Al volver no hay una sola flecha que seguir: la máquina B no tiene inversa.',
          },
          note: { label: 'Inyectiva', tex: 'f(a)=f(b)\\Rightarrow a=b', body: 'Solo se puede invertir una función que nunca junta dos entradas en la misma salida.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Descifrado', Comp: Decoder, rounds: 3 },
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'nar', text: 'Oficina NÓESIS, jueves, 20:00; la lámpara alumbra el libro abierto.' },
        { who: 'teo', text: 'La nota fija la cita: viernes, nueve, muelle norte. A las 21:00.' },
        { who: 'iris', text: 'Si llegamos antes, quizá sepamos para quién es. En la bodega también estaba este libro de cuentas.' },
        { who: 'tu', text: 'Guardaron la hora como un secreto y los pagos a mano.' },
        { who: 'iris', text: 'Mira el margen. El Contador dejó cuentas pendientes.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'compose', world: 'foundations', tex: 'g\\circ f', name: 'Composición', read: 'ge compuesta con efe', meaning: 'Aplicar primero $f$ y luego $g$: $(g\\circ f)(x)=g(f(x))$.', warn: 'Se lee de derecha a izquierda.' },
  { id: 'inverse', world: 'foundations', tex: 'f^{-1}', name: 'Función inversa', read: 'efe inversa', meaning: 'La función que deshace a $f$: si $f(x)=y$, entonces $f^{-1}(y)=x$.', warn: 'No es $1/f$.' },
  { id: 'injective', world: 'foundations', tex: 'f(a)=f(b)\\Rightarrow a=b', name: 'Inyectiva', read: 'inyectiva', meaning: 'Entradas distintas dan salidas distintas. Es la condición para poder invertir.' },
];
