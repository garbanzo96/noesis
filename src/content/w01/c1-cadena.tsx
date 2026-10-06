import { useEffect, useMemo, useRef, useState } from 'react';
import { ContainerBox, Thermometer } from '../../art/props';
import { clamp, fmt } from '../../engine/anim';
import { useSvgDrag, useTween } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, rng, shuffle } from '../shared/rng';

// ============================================================================
// CASO 1.1 · «Cadena de frío» — conjuntos e intervalos
// Vacunas que solo resisten entre 2 y 8 °C. Concreto → símbolo:
//   termómetro → [2,8]; lectura 8,1 → ∉; insulina → [2,8); contenedores marcados → conjunto
//   por comprensión; diagrama de Venn con contenedores reales → ∩, ∪; contar → |A∪R|.
// ============================================================================

const dec = (v: number) => fmt(v, 1).replace('.', ',');
const T_MIN = -2;
const T_MAX = 14;
const TOP = 150;
const BOTTOM = 620;
const TY = (t: number) => BOTTOM - ((t - T_MIN) / (T_MAX - T_MIN)) * (BOTTOM - TOP);
const fromY = (y: number) => T_MIN + ((BOTTOM - y) / (BOTTOM - TOP)) * (T_MAX - T_MIN);

// ---------------------------------------------------------------- demo
const BATCH = [
  { id: 'ALT-01', t: 4.5 },
  { id: 'ALT-02', t: 8.0 },
  { id: 'ALT-03', t: 9.3 },
  { id: 'ALT-04', t: 1.6 },
  { id: 'ALT-05', t: 2.0 },
  { id: 'ALT-06', t: 11.0 },
];
const DAMAGED = new Set(['ALT-03', 'ALT-04', 'ALT-06']);

// Venn tokens: A = containers of the Altamar, R = damaged (also one from the Brisa)
type Region = 'AR' | 'A' | 'R' | 'none';
const TOKENS: { id: string; region: Region }[] = [
  { id: 'ALT-01', region: 'A' },
  { id: 'ALT-02', region: 'A' },
  { id: 'ALT-03', region: 'AR' },
  { id: 'ALT-04', region: 'AR' },
  { id: 'ALT-05', region: 'A' },
  { id: 'ALT-06', region: 'AR' },
  { id: 'BRI-01', region: 'none' },
  { id: 'BRI-02', region: 'R' },
  { id: 'BRI-03', region: 'none' },
];
const CA = { x: 620, y: 430, r: 230 };
const CR = { x: 940, y: 430, r: 230 };
function regionAt(x: number, y: number): Region {
  const inA = Math.hypot(x - CA.x, y - CA.y) < CA.r;
  const inR = Math.hypot(x - CR.x, y - CR.y) < CR.r;
  return inA && inR ? 'AR' : inA ? 'A' : inR ? 'R' : 'none';
}
const SLOTS: Record<Region, [number, number][]> = {
  A: [
    [500, 330],
    [480, 430],
    [500, 530],
  ],
  AR: [
    [780, 340],
    [780, 430],
    [780, 520],
  ],
  R: [
    [1060, 430],
    [1080, 340],
    [1080, 520],
  ],
  none: [
    [1340, 250],
    [1340, 360],
    [1340, 470],
    [1340, 580],
  ],
};

function ColdChainDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [temp, setTemp] = useState(5);
  const onDrag = useSvgDrag(svg, (_x, y) => {
    if (beat !== 0) return;
    let t = Math.round(clamp(fromY(y), T_MIN, T_MAX) * 10) / 10;
    if (Math.abs(t - 8) < 0.15) t = 8;
    setTemp(t);
    if (t === 8) unlock();
  });
  const rev1 = useTween(beat > 1 || (beat === 1 && answer !== null) ? 1 : 0, 0.9);
  const shown = beat === 0 ? temp : beat === 1 ? 8 + 0.1 * rev1 : 8;
  const halfOpen = beat >= 2;
  const inside = halfOpen ? shown >= 2 && shown < 8 : shown >= 2 && shown <= 8;

  // beat 3: flag damaged containers
  const [flags, setFlags] = useState<string[]>([]);
  useEffect(() => {
    if (beat !== 3) return;
    const ok = flags.length === DAMAGED.size && flags.every((f) => DAMAGED.has(f));
    if (ok) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags, beat]);

  // beat 4: drag tokens into the Venn diagram
  const start = useMemo(() => Object.fromEntries(TOKENS.map((t, i) => [t.id, [250 + (i % 9) * 140, 800] as [number, number]])), []);
  const [pos, setPos] = useState<Record<string, [number, number]>>(start);
  const dragId = useRef<string | null>(null);
  const onTokenDrag = useSvgDrag(svg, (x, y, phase) => {
    const id = dragId.current;
    if (!id) return;
    if (phase === 'end') {
      const r = regionAt(x, y);
      const used = Object.entries(pos).filter(([k, p]) => k !== id && regionAt(p[0], p[1]) === r && p[1] < 760).length;
      const slot = SLOTS[r][Math.min(used, SLOTS[r].length - 1)];
      setPos({ ...pos, [id]: y > 740 ? start[id] : slot });
      dragId.current = null;
      return;
    }
    setPos({ ...pos, [id]: [x, y] });
  });
  useEffect(() => {
    if (beat !== 4) return;
    const ok = TOKENS.every((t) => pos[t.id][1] < 760 && regionAt(pos[t.id][0], pos[t.id][1]) === t.region);
    if (ok) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, beat]);

  const thermoV = 1 - at(3);
  const batchV = beat === 3 ? at(3) : 0;
  const vennV = at(4);

  return (
    <Stage ref={svg}>
      {/* ---------- thermometer and one container ---------- */}
      <Group opacity={thermoV}>
        <Thermometer x={330} top={TOP} bottom={BOTTOM} tMin={T_MIN} tMax={T_MAX} value={shown} band={[2, 8]} bandOpen={[false, halfOpen]} ticks={[0, 2, 4, 6, 8, 10, 12, 14]} />
        {beat === 0 && (
          <g style={{ cursor: 'ns-resize' }} onPointerDown={onDrag}>
            <rect x={270} y={TOP - 30} width={120} height={BOTTOM - TOP + 80} fill="transparent" />
            <path d={`M${300} ${TY(temp)} l-30 -16 v32 z`} fill={C.text} />
          </g>
        )}
        <Html x={330} y={TOP - 50} size={20} color={C.muted}>
          <span className="panel-title">°C</span>
        </Html>
        <ContainerBox x={980} y={330} w={360} h={190} color="#1e5a6e" id={beat >= 1 && beat < 2 ? 'ALT-12' : beat >= 2 ? 'INSULINA' : 'ALT-07'} tag={`${dec(shown)} °C`} tagColor={inside ? C.green : C.red} state={inside ? 'ok' : 'flag'} />
        <Html x={980} y={510} size={30} color={inside ? C.green : C.red}>
          <span className="verdict">{inside ? 'DENTRO DEL RANGO' : 'FUERA DEL RANGO'}</span>
        </Html>
        <Html x={980} y={580} size={34} color={C.text}>
          <Tex tex={`${dec(shown)}\\ ${inside ? '\\in' : '\\notin'}\\ ${halfOpen ? '[2,8)' : '[2,8]'}`} />
        </Html>
      </Group>

      {/* ---------- the batch: flag the damaged ones ---------- */}
      <Group opacity={batchV}>
        {BATCH.map((b, i) => {
          const x = 400 + (i % 3) * 400;
          const y = 300 + Math.floor(i / 3) * 260;
          const on = flags.includes(b.id);
          return (
            <ContainerBox
              key={b.id}
              x={x}
              y={y}
              id={b.id}
              tag={`${dec(b.t)} °C`}
              tagColor={on ? C.red : C.text}
              color={['#7a2a4a', '#1e5a6e', '#6b5a24'][i % 3]}
              w={240}
              h={140}
              state={on ? 'flag' : 'idle'}
              onClick={beat === 3 ? () => setFlags(on ? flags.filter((f) => f !== b.id) : [...flags, b.id]) : undefined}
            />
          );
        })}
        <Html x={800} y={120} size={26} color={C.muted}>
          <span>clic en un contenedor para marcarlo · marcados: {flags.length}</span>
        </Html>
      </Group>

      {/* ---------- Venn diagram ---------- */}
      <Group opacity={vennV}>
        <circle cx={CA.x} cy={CA.y} r={CA.r} fill={C.cyan} fillOpacity={0.07} stroke={C.cyan} strokeWidth={3} />
        <circle cx={CR.x} cy={CR.y} r={CR.r} fill={C.red} fillOpacity={0.07} stroke={C.red} strokeWidth={3} />
        <Html x={CA.x - 150} y={CA.y - 250} size={26} color={C.cyan}>
          <Tex tex="A:\ \text{vinieron en el Altamar}" />
        </Html>
        <Html x={CR.x + 150} y={CR.y - 250} size={26} color={C.red}>
          <Tex tex="R:\ \text{rompieron la cadena}" />
        </Html>
        <Html x={780} y={CA.y + 270} size={24} color={C.text}>
          <Tex tex="A\cap R" />
        </Html>
        <Html x={1340} y={160} size={20} color={C.dim}>
          <span>fuera de A y de R</span>
        </Html>
        {beat >= 4 &&
          TOKENS.map((t) => {
            const [x, y] = pos[t.id];
            const right = y < 760 && regionAt(x, y) === t.region;
            return (
              <g
                key={t.id}
                style={{ cursor: beat === 4 ? 'grab' : undefined }}
                onPointerDown={
                  beat === 4
                    ? (e) => {
                        dragId.current = t.id;
                        onTokenDrag(e);
                      }
                    : undefined
                }
              >
                <rect x={x - 62} y={y - 26} width={124} height={52} rx={8} fill={t.id.startsWith('ALT') ? '#123848' : '#3a2a14'} stroke={right && beat > 4 ? C.green : t.region === 'AR' || t.region === 'R' ? C.red : C.line} strokeWidth={2.5} />
                <Html x={x} y={y} size={18} color={C.text}>
                  <span className="prop-id">{t.id}</span>
                </Html>
              </g>
            );
          })}
        {beat === 4 && (
          <Html x={800} y={860} size={20} color={C.muted}>
            <span>arrastra cada contenedor a su región · los rojos rompieron la cadena</span>
          </Html>
        )}
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
interface Product {
  name: string;
  lo: number;
  hi: number;
  loOpen: boolean;
  hiOpen: boolean;
  tex: string;
  words: string;
}
const PRODUCTS: Product[] = [
  { name: 'Vacunas', lo: 2, hi: 8, loOpen: false, hiOpen: false, tex: '[2,8]', words: 'entre 2 y 8 °C, ambos incluidos' },
  { name: 'Insulina', lo: 2, hi: 8, loOpen: false, hiOpen: true, tex: '[2,8)', words: 'desde 2 °C y siempre bajo 8 °C' },
  { name: 'Reactivo B', lo: -5, hi: 0, loOpen: false, hiOpen: true, tex: '[-5,0)', words: 'desde −5 °C y siempre bajo 0 °C' },
  { name: 'Vacuna oral', lo: 2, hi: 6, loOpen: true, hiOpen: false, tex: '(2,6]', words: 'más de 2 °C y como máximo 6 °C' },
  { name: 'Plasma', lo: -Infinity, hi: -18, loOpen: true, hiOpen: false, tex: '(-\\infty,-18]', words: 'a −18 °C o menos' },
];
const inInterval = (p: Product, t: number) => (p.loOpen ? t > p.lo : t >= p.lo) && (p.hiOpen ? t < p.hi : t <= p.hi);

function makeBatch(seed: number, p: Product) {
  const r = rng(seed);
  const edges = [p.lo, p.hi].filter(Number.isFinite);
  const pool = [...edges, ...edges.map((e) => e + 0.1), ...edges.map((e) => e - 0.1)];
  const span = Number.isFinite(p.lo) ? p.hi - p.lo : 10;
  const base = Number.isFinite(p.lo) ? p.lo : p.hi - 10;
  for (let k = 0; k < 6; k++) pool.push(Math.round((base - 3 + r() * (span + 6)) * 10) / 10);
  const temps = shuffle(r, pool).slice(0, 6);
  // make sure there is at least one inside and one outside
  if (!temps.some((t) => inInterval(p, t))) temps[0] = Number.isFinite(p.lo) ? (p.lo + p.hi) / 2 : p.hi - 2;
  if (temps.every((t) => inInterval(p, t))) temps[1] = p.hi + 1.5;
  const prefix = pick(r, ['ALT', 'BRI', 'NOR']);
  return temps.map((t, i) => ({ id: `${prefix}-${10 + i * 3 + Math.floor(r() * 3)}`, t: Math.round(t * 10) / 10 }));
}

function Inspection({ seed, round, api }: ChallengeProps) {
  if (round === 0) return <FlagRound seed={seed} api={api} />;
  if (round === 1) return <BuildInterval seed={seed} api={api} />;
  return <VennRound seed={seed} api={api} />;
}

function FlagRound({ seed, api }: { seed: number; api: ChallengeProps['api'] }) {
  const product = useMemo(() => pick(rng(seed), PRODUCTS.slice(0, 4)), [seed]);
  const batch = useMemo(() => makeBatch(seed, product), [seed, product]);
  const [flags, setFlags] = useState<string[]>([]);
  useEffect(() => {
    api.prompt(`Lote de **${product.name.toLowerCase()}**: rango permitido $${product.tex}$ (${product.words}). Marca los contenedores que rompieron la cadena y confirma.`, `T\\notin${product.tex}`);
    api.hints(['Revisa primero las lecturas que caen justo en un extremo: ¿corchete o paréntesis?', `Fuera del rango: ${batch.filter((b) => !inInterval(product, b.t)).map((b) => b.id).join(', ')}.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch]);
  const submit = () => {
    for (const b of batch) {
      const out = !inInterval(product, b.t);
      const marked = flags.includes(b.id);
      if (out === marked) continue;
      const edge = b.t === product.lo || b.t === product.hi;
      if (marked)
        return api.result(false, `${b.id} marca ${dec(b.t)} °C y eso está **dentro** de $${product.tex}$${edge ? ': el corchete incluye ese extremo' : ''}. No debía marcarse.`);
      return api.result(false, `${b.id} marca ${dec(b.t)} °C y eso está **fuera** de $${product.tex}$${edge ? ': el paréntesis excluye ese extremo' : ''}. Faltó marcarlo.`);
    }
    api.result(true, `Correcto. $R=\\{${batch.filter((b) => !inInterval(product, b.t)).map((b) => `\\text{${b.id}}`).join(',')}\\}$ rompieron la cadena.`);
  };
  return (
    <Stage>
      {batch.map((b, i) => {
        const on = flags.includes(b.id);
        return (
          <ContainerBox
            key={b.id}
            x={360 + (i % 3) * 440}
            y={300 + Math.floor(i / 3) * 270}
            w={260}
            h={150}
            id={b.id}
            tag={`${dec(b.t)} °C`}
            tagColor={on ? C.red : C.text}
            color={['#7a2a4a', '#1e5a6e', '#6b5a24', '#3b2c6e'][i % 4]}
            state={on ? 'flag' : 'idle'}
            onClick={() => {
              api.sfx.click();
              setFlags(on ? flags.filter((f) => f !== b.id) : [...flags, b.id]);
            }}
          />
        );
      })}
      <Html x={800} y={130} size={30} color={C.cyan}>
        <Tex tex={`\\text{${product.name}}:\\ ${product.tex}`} />
      </Html>
      <Html x={800} y={820} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Confirmar inspección ▸
        </button>
      </Html>
    </Stage>
  );
}

function BuildInterval({ seed, api }: { seed: number; api: ChallengeProps['api'] }) {
  const product = useMemo(() => pick(rng(seed), PRODUCTS.slice(1)), [seed]);
  const svg = useRef<SVGSVGElement>(null);
  const tMin = -30;
  const tMax = 15;
  const top = 140;
  const bottom = 720;
  const Y = (t: number) => (t === Infinity ? top - 40 : t === -Infinity ? bottom + 40 : bottom - ((t - tMin) / (tMax - tMin)) * (bottom - top));
  const fromYY = (y: number) => {
    if (y > bottom + 20) return -Infinity;
    if (y < top - 20) return Infinity;
    return Math.round(tMin + ((bottom - y) / (bottom - top)) * (tMax - tMin));
  };
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(10);
  const [loOpen, setLoOpen] = useState(false);
  const [hiOpen, setHiOpen] = useState(false);
  const which = useRef<'lo' | 'hi' | null>(null);
  const press = useRef({ y: 0, moved: false });
  const onDrag = useSvgDrag(svg, (_x, y, phase) => {
    if (phase === 'start') {
      which.current = Math.abs(y - Y(lo)) < Math.abs(y - Y(hi)) ? 'lo' : 'hi';
      press.current = { y, moved: false };
      return;
    }
    if (Math.abs(y - press.current.y) > 6) press.current.moved = true;
    if (phase === 'end') {
      if (!press.current.moved && which.current) {
        const v = which.current === 'lo' ? lo : hi;
        if (!Number.isFinite(v)) {
          api.sfx.bad();
          api.prompt(`Un extremo infinito siempre es **abierto**: $\\infty$ no es una temperatura. Producto: ${product.name.toLowerCase()}, ${product.words}.`);
        } else if (which.current === 'lo') setLoOpen(!loOpen);
        else setHiOpen(!hiOpen);
      }
      which.current = null;
      return;
    }
    if (!press.current.moved) return;
    const v = fromYY(y);
    if (which.current === 'lo' && v < hi && v !== Infinity) {
      setLo(v);
      if (v === -Infinity) setLoOpen(true);
    }
    if (which.current === 'hi' && v > lo && v !== -Infinity) {
      setHi(v);
      if (v === Infinity) setHiOpen(true);
    }
  });
  const show = (v: number) => (v === Infinity ? '\\infty' : v === -Infinity ? '-\\infty' : String(v));
  const tex = `${loOpen ? '(' : '['}${show(lo)},${show(hi)}${hiOpen ? ')' : ']'}`;
  useEffect(() => {
    api.prompt(`Ficha técnica de **${product.name.toLowerCase()}**: ${product.words}. Arrastra los dos límites del termómetro y haz clic en un límite para alternar incluido / excluido.`);
    api.hints(['Para cada extremo pregunta: ¿esa temperatura exacta está permitida?', `El rango es $${product.tex}$.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);
  const submit = () => {
    if (lo !== product.lo || hi !== product.hi)
      return api.result(false, `Tus límites van de $${show(lo)}$ a $${show(hi)}$ °C; la ficha dice «${product.words}».`);
    if (loOpen !== product.loOpen || hiOpen !== product.hiOpen) {
      const side = loOpen !== product.loOpen ? 'inferior' : 'superior';
      const should = loOpen !== product.loOpen ? product.loOpen : product.hiOpen;
      return api.result(false, `Los límites están bien, pero el ${side} debe estar ${should ? '**excluido** (paréntesis)' : '**incluido** (corchete)'}.`);
    }
    api.result(true, `$${product.tex}$: ${product.words}.`);
  };
  const bracket = (y: number, open: boolean, up: boolean) => {
    const d = up ? 1 : -1;
    return open ? (
      <path d={`M300 ${y + 16 * d} Q320 ${y - 6 * d} 340 ${y + 16 * d}`} fill="none" stroke={C.cyan} strokeWidth={5} transform={`rotate(0)`} />
    ) : (
      <path d={`M300 ${y + 16 * d} L300 ${y} L340 ${y} L340 ${y + 16 * d}`} fill="none" stroke={C.cyan} strokeWidth={5} />
    );
  };
  return (
    <Stage ref={svg}>
      <rect x={300} y={top - 50} width={40} height={bottom - top + 100} rx={20} fill="#0a0818" stroke="#3d3160" strokeWidth={3} />
      <rect x={300} y={Y(hi)} width={40} height={Y(lo) - Y(hi)} fill={C.green} opacity={0.25} />
      {[-30, -25, -20, -15, -10, -5, 0, 5, 10, 15].map((t) => (
        <g key={t}>
          <line x1={344} x2={362} y1={Y(t)} y2={Y(t)} stroke={C.muted} strokeWidth={2} />
          <Html x={372} y={Y(t)} size={18} anchor="left" color={C.muted}>
            <span className="prop-tag">{t}°</span>
          </Html>
        </g>
      ))}
      <Html x={320} y={top - 70} size={18} color={C.muted}>
        <Tex tex="+\infty" />
      </Html>
      <Html x={320} y={bottom + 72} size={18} color={C.muted}>
        <Tex tex="-\infty" />
      </Html>
      <g pointerEvents="none">
        {bracket(Y(hi), hiOpen, true)}
        {bracket(Y(lo), loOpen, false)}
      </g>
      <g onPointerDown={onDrag} style={{ cursor: 'ns-resize' }}>
        <rect x={240} y={top - 90} width={160} height={bottom - top + 180} fill="transparent" />
      </g>
      <Html x={1000} y={330} size={30} color={C.text}>
        <Tex tex={`\\text{${product.name}}`} />
      </Html>
      <Html x={1000} y={420} size={24} color={C.muted}>
        <span>{product.words}</span>
      </Html>
      <Html x={1000} y={530} size={44} color={C.cyan}>
        <Tex tex={tex} />
      </Html>
      <Html x={1000} y={700} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Registrar rango ▸
        </button>
      </Html>
    </Stage>
  );
}

const VENN_TASKS = [
  { tex: 'A\\cap R', words: 'del Altamar **y** dañados', f: (r: Region) => r === 'AR' },
  { tex: 'A\\setminus R', words: 'del Altamar que **no** se dañaron', f: (r: Region) => r === 'A' },
  { tex: 'A\\cup R', words: 'del Altamar **o** dañados (o ambas cosas)', f: (r: Region) => r !== 'none' },
  { tex: 'R\\setminus A', words: 'dañados que **no** vinieron en el Altamar', f: (r: Region) => r === 'R' },
];
function VennRound({ seed, api }: { seed: number; api: ChallengeProps['api'] }) {
  const { task, tokens } = useMemo(() => {
    const r = rng(seed);
    const task = pick(r, VENN_TASKS);
    const regions: Region[] = shuffle(r, ['AR', 'AR', 'A', 'A', 'A', 'R', 'R', 'none', 'none', pick(r, ['AR', 'A', 'R'] as Region[])]);
    const counters: Record<string, number> = { ALT: 20, BRI: 30 };
    const tokens = regions.map((rg) => {
      const ship = rg === 'A' || rg === 'AR' ? 'ALT' : 'BRI';
      counters[ship] += 1 + Math.floor(r() * 3);
      return { id: `${ship}-${counters[ship]}`, region: rg };
    });
    return { task, tokens };
  }, [seed]);
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => {
    api.prompt(`Rosa necesita la lista de contenedores ${task.words}: selecciona $${task.tex}$.`, task.tex);
    api.hints(['Recorre las cuatro regiones del diagrama y decide cuáles cumplen la condición.', `Son ${tokens.filter((t) => task.f(t.region)).length} contenedores.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);
  const place: Record<Region, [number, number][]> = {
    A: [
      [470, 300],
      [450, 430],
      [470, 560],
      [560, 640],
    ],
    AR: [
      [780, 320],
      [780, 430],
      [780, 540],
    ],
    R: [
      [1090, 300],
      [1110, 430],
      [1090, 560],
    ],
    none: [
      [1400, 240],
      [1400, 350],
      [1400, 460],
      [1400, 570],
    ],
  };
  const used: Record<Region, number> = { A: 0, AR: 0, R: 0, none: 0 };
  const submit = () => {
    const wrong = tokens.find((t) => task.f(t.region) !== sel.includes(t.id));
    if (!wrong) return api.result(true, `$${task.tex}=\\{${tokens.filter((t) => task.f(t.region)).map((t) => `\\text{${t.id}}`).join(',')}\\}$, ${tokens.filter((t) => task.f(t.region)).length} elementos.`);
    const where = { AR: 'en ambos conjuntos', A: 'solo en $A$', R: 'solo en $R$', none: 'fuera de los dos' }[wrong.region];
    api.result(false, `${wrong.id} está ${where}: ${task.f(wrong.region) ? 'pertenece' : 'no pertenece'} a $${task.tex}$.`);
  };
  return (
    <Stage>
      <circle cx={CA.x} cy={CA.y} r={CA.r} fill={C.cyan} fillOpacity={0.07} stroke={C.cyan} strokeWidth={3} />
      <circle cx={CR.x} cy={CR.y} r={CR.r} fill={C.red} fillOpacity={0.07} stroke={C.red} strokeWidth={3} />
      <Html x={CA.x - 160} y={CA.y - 250} size={26} color={C.cyan}>
        <Tex tex="A:\ \text{Altamar}" />
      </Html>
      <Html x={CR.x + 160} y={CR.y - 250} size={26} color={C.red}>
        <Tex tex="R:\ \text{dañados}" />
      </Html>
      {tokens.map((t) => {
        const slot = place[t.region][used[t.region]++ % place[t.region].length];
        const on = sel.includes(t.id);
        return (
          <g
            key={t.id}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              api.sfx.click();
              setSel(on ? sel.filter((s) => s !== t.id) : [...sel, t.id]);
            }}
          >
            <rect x={slot[0] - 64} y={slot[1] - 27} width={128} height={54} rx={8} fill={on ? '#2a1640' : t.id.startsWith('ALT') ? '#123848' : '#3a2a14'} stroke={on ? C.text : C.line} strokeWidth={on ? 4 : 2} />
            <Html x={slot[0]} y={slot[1]} size={18} color={C.text}>
              <span className="prop-id">{t.id}</span>
            </Html>
          </g>
        );
      })}
      <Html x={800} y={790} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Entregar lista ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w1-c1',
  world: 'foundations',
  code: '1.1',
  title: 'Cadena de frío',
  subtitle: 'Conjuntos e intervalos',
  glyph: '[2,8]',
  kind: 'level',
  guide: 'teo',
  teaser: 'Cuarenta cajas de vacunas desaparecieron y otras llegaron calientes. Hay que saber qué contenedores rompieron la cadena de frío.',
  learn: 'Pertenencia, intervalos abiertos y cerrados, conjuntos por comprensión, intersección, unión y diferencia.',
  glyphs: ['in', 'interval', 'setbuilder', 'cap', 'cup', 'setminus', 'card', 'reals'],
  pitfalls: [
    'Un extremo con paréntesis no pertenece al intervalo: $8\\notin[2,8)$.',
    'Sumar $|A|+|B|$ cuenta dos veces los elementos de $A\\cap B$.',
    '$\\infty$ no es un número: un extremo infinito siempre va con paréntesis.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        { who: 'iris', text: 'Anoche desaparecieron cuarenta cajas de vacunas de la bodega 9. Las que quedaron no están mejor.' },
        { who: 'teo', text: 'Cada contenedor registra su temperatura. Estas vacunas solo resisten entre 2 y 8 grados.' },
        { who: 'iris', text: 'Quiero la lista exacta de contenedores que salieron de ese rango. Sin «más o menos».' },
        { who: 'tu', text: '¿Y cómo se escribe «entre 2 y 8» sin ambigüedad?' },
        { who: 'teo', text: 'Con un intervalo. Ven, te lo muestro con los registros.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Registros',
      Scene: ColdChainDemo,
      beats: [
        {
          say: 'Este es el registro del contenedor ALT-07. El rango seguro es la franja verde.',
          gate: 'Arrastra la lectura del termómetro hasta exactamente 8 °C.',
          note: { label: 'Intervalo cerrado', tex: '[2,8]=\\{x\\in\\mathbb R:\\ 2\\le x\\le 8\\}', body: 'Los corchetes incluyen los extremos: 2 y 8 están permitidos.' },
        },
        {
          say: 'El sensor del contenedor ALT-12 marcó 8,1 °C.',
          ask: {
            prompt: '¿Está 8,1 °C dentro del rango $[2,8]$?',
            options: ['No: supera el máximo', 'Sí: es casi 8', 'Depende del redondeo'],
            answer: 0,
            explain: '$8{,}1>8$. Un intervalo no tiene tolerancia: lo que pasa del extremo queda fuera, por poco que sea.',
          },
          note: { label: 'Pertenencia', tex: '8\\in[2,8],\\qquad 8{,}1\\notin[2,8]', body: '$\\in$ se lee «pertenece a»; $\\notin$, «no pertenece a».' },
        },
        {
          say: 'La insulina se daña justo a 8 °C. Su rango se escribe con paréntesis a la derecha: el 8 queda fuera.',
          tex: '[2,8)',
          dur: 1.6,
          note: { label: 'Intervalo semiabierto', tex: '[2,8)=\\{x:\\ 2\\le x<8\\}', body: 'Corchete: extremo incluido. Paréntesis: extremo excluido.' },
        },
        {
          say: 'Llegaron seis contenedores del Altamar con vacunas.',
          gate: 'Marca los que rompieron la cadena de frío $[2,8]$.',
          dur: 1.2,
          note: { label: 'Conjunto por comprensión', tex: 'R=\\{c:\\ \\text{temperatura de }c\\notin[2,8]\\}', body: 'Se lee: «los contenedores $c$ tales que…». Aquí $R=\\{\\text{ALT-03},\\text{ALT-04},\\text{ALT-06}\\}$.' },
        },
        {
          say: 'Rosa trae también los de la Brisa. $A$ son los del Altamar; $R$, los dañados de ambos barcos.',
          gate: 'Arrastra cada contenedor a su región del diagrama.',
          dur: 1.2,
          note: { label: 'Intersección, unión, diferencia', tex: 'A\\cap R,\\qquad A\\cup R,\\qquad A\\setminus R', body: '$\\cap$: en ambos. $\\cup$: en al menos uno. $\\setminus$: en el primero pero no en el segundo.' },
        },
        {
          say: 'Para el informe hay que contar.',
          tex: '|A|=6,\\quad |R|=4,\\quad |A\\cap R|=3',
          ask: {
            prompt: '¿Cuántos contenedores hay en $A\\cup R$?',
            options: ['7', '10', '3'],
            answer: 0,
            explain: 'Si sumas $6+4$ cuentas dos veces los 3 del centro. $|A\\cup R|=6+4-3=7$.',
          },
          note: { label: 'Contar una unión', tex: '|A\\cup R|=|A|+|R|-|A\\cap R|', body: '$|A|$ es el número de elementos de $A$.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Inspección', Comp: Inspection, rounds: 3 },
    {
      kind: 'scene',
      place: 'bodega',
      lines: [
        { who: 'rosa', text: 'Los tres dañados vinieron en el Altamar. Y el Altamar vuelve esta noche.' },
        { who: 'iris', text: 'Entonces necesito saber a qué hora puede atracar. Teo, consigue la tabla de mareas.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'in', world: 'foundations', tex: '\\in', name: 'Pertenece', read: 'pertenece a', meaning: '$x\\in A$: $x$ es un elemento de $A$. Su negación es $\\notin$.' },
  { id: 'interval', world: 'foundations', tex: '[a,b)', name: 'Intervalo', read: 'intervalo de a a b', meaning: 'Todos los números entre $a$ y $b$. Corchete: extremo incluido. Paréntesis: excluido.', warn: '$\\infty$ siempre va con paréntesis.' },
  { id: 'setbuilder', world: 'foundations', tex: '\\{x:\\ \\ldots\\}', name: 'Conjunto por comprensión', read: 'el conjunto de los x tales que', meaning: 'Los elementos que cumplen la condición escrita tras los dos puntos.' },
  { id: 'cap', world: 'foundations', tex: '\\cap', name: 'Intersección', read: 'intersección', meaning: '$A\\cap B$: elementos que están en $A$ **y** en $B$.' },
  { id: 'cup', world: 'foundations', tex: '\\cup', name: 'Unión', read: 'unión', meaning: '$A\\cup B$: elementos que están en $A$, en $B$ o en ambos.' },
  { id: 'setminus', world: 'foundations', tex: '\\setminus', name: 'Diferencia', read: 'menos', meaning: '$A\\setminus B$: elementos de $A$ que no están en $B$.' },
  { id: 'card', world: 'foundations', tex: '|A|', name: 'Cardinal', read: 'cardinal de A', meaning: 'Número de elementos de un conjunto finito.', warn: 'Para un número, $|x|$ es su valor absoluto.' },
  { id: 'reals', world: 'foundations', tex: '\\mathbb R', name: 'Números reales', read: 'erre', meaning: 'Todos los números de la recta, con decimales. $\\infty$ no pertenece a $\\mathbb R$.' },
];
