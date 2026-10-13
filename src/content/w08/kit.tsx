import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Group, Html } from '../../engine/Stage';
import { Cap } from '../shared/lesson';
import { DragCue, Knob, dec } from '../shared/ui';

export const ACCENT = '#38d9c5';
export const SYMBOLS = ['A', 'B', 'C', 'D'];
export const P = [1 / 2, 1 / 4, 1 / 8, 1 / 8];
export const COUNTS = [32, 16, 8, 8];
export const CODES: Record<string, string> = { A: '0', B: '10', C: '110', D: '111' };
export const COLORS = [ACCENT, C.amber, C.magenta, C.violet, C.green, C.blue, C.cyan, C.red];
export const fmtComma = (v: number, digits = 4) => dec(v, digits);
/** «1 bit», «2 bits», «1,75 bits». */
export const bitsText = (v: number) => `${fmtComma(v)} ${v === 1 ? 'bit' : 'bits'}`;

export const num = (v: number, digits = 4) =>
  fmtComma(v, digits).replace('−', '-').replace(',', '{,}');
export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const near = (x: number, y: number, tx: number, ty: number) =>
  (x - tx) ** 2 + (y - ty) ** 2 <= 24 ** 2;
const prob = (p: number) => {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('Probabilidad fuera de [0,1].');
};
export function distribution(ps: readonly number[]) {
  ps.forEach(prob);
  if (!ps.length || Math.abs(sum(ps) - 1) > 1e-10)
    throw new RangeError('La distribución debe sumar uno.');
}
export function info(p: number) {
  prob(p);
  return p === 0 ? Infinity : -Math.log2(p);
}
export function entropy(ps: readonly number[]) {
  distribution(ps);
  return sum(ps.map((p) => (p === 0 ? 0 : p * info(p))));
}
function tableDistribution(table: readonly (readonly number[])[]) {
  if (!table.length || !table[0].length || table.some((row) => row.length !== table[0].length))
    throw new RangeError('Tabla rectangular requerida.');
  distribution(table.flat());
}
export function jointEntropy(table: readonly (readonly number[])[]) {
  tableDistribution(table);
  return entropy(table.flat());
}
/** given='rows' gives H(column | row); 'columns' gives H(row | column). */
export function conditionalEntropy(
  table: readonly (readonly number[])[],
  given: 'rows' | 'columns' = 'rows',
) {
  tableDistribution(table);
  const marginal =
    given === 'rows' ? table.map(sum) : table[0].map((_, j) => sum(table.map((row) => row[j])));
  return jointEntropy(table) - entropy(marginal);
}
export function mutualInfo(table: readonly (readonly number[])[]) {
  tableDistribution(table);
  return (
    entropy(table.map(sum)) +
    entropy(table[0].map((_, j) => sum(table.map((row) => row[j])))) -
    jointEntropy(table)
  );
}
export function kl(p: readonly number[], q: readonly number[]) {
  distribution(p);
  distribution(q);
  if (p.length !== q.length) throw new RangeError('Soportes de distinto tamaño.');
  return sum(p.map((v, i) => (v === 0 ? 0 : q[i] === 0 ? Infinity : v * Math.log2(v / q[i]))));
}
export function meanLength(ps: readonly number[], lengths: readonly number[]) {
  distribution(ps);
  if (ps.length !== lengths.length || lengths.some((v) => !Number.isFinite(v) || v < 0))
    throw new RangeError('Longitudes inválidas.');
  return sum(ps.map((p, i) => p * lengths[i]));
}
export const binaryEntropy = (p: number) => entropy([p, 1 - p]);
export const bscCapacity = (p: number) => 1 - binaryEntropy(p);
const bitsOnly = (bits: string, n?: number) => {
  if (!/^[01]+$/.test(bits) || (n !== undefined && bits.length !== n))
    throw new RangeError('Palabra binaria inválida.');
};
export function xor(bits: string | readonly number[]) {
  if (typeof bits === 'string') bitsOnly(bits);
  const bs = typeof bits === 'string' ? [...bits].map(Number) : bits;
  if (bs.some((v) => v !== 0 && v !== 1)) throw new RangeError('XOR requiere bits.');
  return sum(bs) % 2;
}
export function hammingEncode(data: string) {
  bitsOnly(data, 4);
  const [a, b, c, d] = [...data].map(Number);
  return [xor([a, b, d]), xor([a, c, d]), a, xor([b, c, d]), b, c, d].join('');
}
export function hammingSyndrome(word: string) {
  bitsOnly(word, 7);
  const w = [...word].map(Number);
  const s1 = xor([w[0], w[2], w[4], w[6]]),
    s2 = xor([w[1], w[2], w[5], w[6]]),
    s4 = xor([w[3], w[4], w[5], w[6]]);
  return { bits: `${s4}${s2}${s1}`, position: s1 + 2 * s2 + 4 * s4, checks: [s1, s2, s4] };
}
export function hammingCorrect(word: string, assumeAtMostOneError: boolean) {
  const syndrome = hammingSyndrome(word);
  if (!assumeAtMostOneError) return { ...syndrome, word, data: null, guaranteed: false };
  const w = [...word];
  if (syndrome.position) w[syndrome.position - 1] = w[syndrome.position - 1] === '0' ? '1' : '0';
  return {
    ...syndrome,
    word: w.join(''),
    data: [w[2], w[4], w[5], w[6]].join(''),
    guaranteed: true,
  };
}
export interface PrefixNode {
  id: string;
  weight: number;
  symbol?: string;
  code?: string;
  x: number;
  y: number;
}
export interface PrefixEdge {
  from: string;
  to: string;
  bit: 0 | 1;
}
export interface HuffmanTree {
  nodes: PrefixNode[];
  edges: PrefixEdge[];
  root: string;
  codes: Record<string, string>;
  lengths: number[];
}
export function huffman(
  ps: readonly number[],
  labels = ps.map((_, i) => String.fromCharCode(65 + i)),
): HuffmanTree {
  distribution(ps);
  if (labels.length !== ps.length || new Set(labels).size !== labels.length)
    throw new RangeError('Etiquetas inválidas.');
  type Branch = { id: string; weight: number; symbol?: string; left?: Branch; right?: Branch };
  const pool: Branch[] = ps
    .map((weight, i) => ({ id: labels[i], symbol: labels[i], weight }))
    .filter((n) => n.weight > 0);
  while (pool.length > 1) {
    pool.sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
    const left = pool.shift()!,
      right = pool.shift()!;
    pool.push({ id: left.id + right.id, weight: left.weight + right.weight, left, right });
  }
  const nodes: PrefixNode[] = [],
    edges: PrefixEdge[] = [],
    codes: Record<string, string> = {};
  const leaves = ps.filter((p) => p > 0).length;
  let leaf = 0;
  const walk = (n: Branch, code: string): number => {
    let x: number;
    if (n.symbol) {
      x = leaves === 1 ? 525 : 220 + (leaf++ * 600) / (leaves - 1);
      codes[n.symbol] = code;
    } else {
      const lx = walk(n.left!, code + '0'),
        rx = walk(n.right!, code + '1');
      x = (lx + rx) / 2;
      edges.push({ from: n.id, to: n.left!.id, bit: 0 }, { from: n.id, to: n.right!.id, bit: 1 });
    }
    nodes.push({
      id: n.id,
      weight: n.weight,
      symbol: n.symbol,
      code: n.symbol ? code : undefined,
      x,
      y: 175 + code.length * 135,
    });
    return x;
  };
  walk(pool[0], '');
  return {
    nodes,
    edges,
    root: pool[0].id,
    codes,
    lengths: labels.map((l) => codes[l]?.length ?? 0),
  };
}
export function isPrefix(codes: Record<string, string>) {
  const values = Object.values(codes);
  return (
    values.length > 0 &&
    values.every((a, i) => /^[01]+$/.test(a) && values.every((b, j) => i === j || !b.startsWith(a)))
  );
}
export function decodePrefix(bits: string, tree: HuffmanTree | Record<string, string>) {
  const codes =
    'codes' in tree && typeof tree.codes === 'object'
      ? tree.codes
      : (tree as Record<string, string>);
  if (!isPrefix(codes))
    return {
      status: 'invalid' as const,
      symbols: [] as string[],
      groups: [] as number[],
      pending: '',
    };
  const symbols: string[] = [],
    groups: number[] = [];
  let pending = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== '0' && bits[i] !== '1')
      return { status: 'invalid' as const, symbols, groups, pending };
    pending += bits[i];
    const match = Object.entries(codes).find(([, c]) => c === pending);
    if (match) {
      symbols.push(match[0]);
      groups.push(i + 1);
      pending = '';
    } else if (!Object.values(codes).some((c) => c.startsWith(pending)))
      return { status: 'invalid' as const, symbols, groups, pending };
  }
  return {
    status: pending ? ('incomplete' as const) : ('complete' as const),
    symbols,
    groups,
    pending,
  };
}
export const TREE = huffman(P);

/** A token keeps its grab offset; drop validation uses the token centre in stage units. */
export function DragToken({
  x,
  y,
  label,
  color = ACCENT,
  onDrop,
  cue = true,
}: {
  x: number;
  y: number;
  label: ReactNode;
  color?: string;
  /** Show the drag guide on this token. Only one token per step should carry it. */
  cue?: boolean;
  onDrop: (x: number, y: number) => void;
}) {
  const svg = useRef<SVGSVGElement | null>(null),
    offset = useRef([0, 0]);
  const [pos, setPos] = useState<[number, number]>([x, y]);
  useEffect(() => setPos([x, y]), [x, y]);
  const drag = useSvgDrag(svg, (px, py, phase) => {
    if (phase === 'start') offset.current = [px - pos[0], py - pos[1]];
    const next: [number, number] = [px - offset.current[0], py - offset.current[1]];
    setPos(next);
    if (phase === 'end') {
      onDrop(...next);
      setPos([x, y]);
    }
  });
  return (
    <g
      onPointerDown={(e) => {
        svg.current = e.currentTarget.ownerSVGElement;
        drag(e);
      }}
      style={{ cursor: 'grab' }}
    >
      <circle cx={pos[0]} cy={pos[1]} r={36} fill={C.panel} stroke={color} strokeWidth={3} />
      <Cap x={pos[0]} y={pos[1]} size={20} color={color}>
        {label}
      </Cap>
      {cue && <DragCue x={pos[0]} y={pos[1]} color={color} r={36} />}
    </g>
  );
}
export function DiscreteDial({
  value,
  max,
  onChange,
  onSettle,
  x = 1080,
  y = 430,
  width = 330,
  labels,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  onSettle?: (n: number) => void;
  x?: number;
  y?: number;
  width?: number;
  labels?: string[];
}) {
  const svg = useRef<SVGSVGElement | null>(null);
  const drag = useSvgDrag(svg, (px, _py, phase) => {
    const n = Math.round(clamp(((px - x) / width) * max, 0, max));
    onChange(n);
    if (phase === 'end') onSettle?.(n);
  });
  return (
    <>
      <line x1={x} x2={x + width} y1={y} y2={y} stroke={C.line} strokeWidth={4} />
      {Array.from({ length: max + 1 }, (_, i) => (
        <g key={i}>
          <line
            x1={x + (i * width) / max}
            x2={x + (i * width) / max}
            y1={y - 9}
            y2={y + 9}
            stroke={C.dim}
          />
          <Cap x={x + (i * width) / max} y={y + 60} size={18}>
            {labels?.[i] ?? i}
          </Cap>
        </g>
      ))}
      <Knob
        x={x + (value * width) / max}
        y={y}
        axis="x"
        onPointerDown={(e) => {
          svg.current = (e.currentTarget as SVGGElement).ownerSVGElement;
          drag(e);
        }}
        color={ACCENT}
      />
    </>
  );
}
export function SymbolTray({
  counts,
  selected,
  onPick,
  labels = SYMBOLS,
  y = 350,
  showInfo = false,
}: {
  counts: number[];
  selected?: number;
  onPick?: (i: number) => void;
  labels?: string[];
  y?: number;
  showInfo?: boolean;
}) {
  const total = sum(counts);
  let start = 170;
  return (
    <>
      {counts.map((n, i) => {
        const w = total ? (720 * n) / total : 0,
          x = start;
        start += w;
        return (
          <g key={i} onClick={() => onPick?.(i)} style={{ cursor: onPick ? 'pointer' : undefined }}>
            {w > 0 && (
              <rect
                x={x}
                y={y}
                width={w}
                height={140}
                rx={6}
                fill={COLORS[i]}
                fillOpacity={selected === i ? 0.4 : 0.14}
                stroke={COLORS[i]}
                strokeWidth={selected === i ? 4 : 2}
              />
            )}
            {w > 0 && (
              <Cap x={x + w / 2} y={y + 70} size={28} color={COLORS[i]}>
                {labels[i]}
              </Cap>
            )}
          </g>
        );
      })}
      {counts.map((n, i) => (
        <Cap key={i} x={230 + i * 200} y={y + 210} size={20} color={COLORS[i]}>
          {labels[i]}: {n}/{total}
          {showInfo && n > 0 ? ` · ${bitsText(info(n / total))}` : ''}
        </Cap>
      ))}
    </>
  );
}
export function SplitTree({
  depth,
  path = '111',
  progress = 1,
}: {
  depth: number;
  path?: string;
  progress?: number;
}) {
  const d = Math.max(0, Math.min(3, depth));
  return (
    <>
      {Array.from({ length: 4 }, (_, level) => {
        const count = 2 ** level,
          active = level === 0 ? 0 : parseInt(path.slice(0, level), 2);
        return (
          <Group key={level} opacity={level <= d ? clamp(progress * (d + 1) - level, 0, 1) : 0.3}>
            {Array.from({ length: count }, (_, i) => {
              const x = 170 + ((i + 0.5) * 720) / count,
                y = 190 + level * 130;
              return (
                <g key={i}>
                  {level > 0 && (
                    <line
                      x1={170 + ((Math.floor(i / 2) + 0.5) * 720) / (count / 2)}
                      y1={y - 95}
                      x2={x}
                      y2={y - 22}
                      stroke={i === active ? ACCENT : C.muted}
                      strokeWidth={3}
                    />
                  )}
                  <rect
                    x={x - 330 / count}
                    y={y - 22}
                    width={660 / count}
                    height={44}
                    rx={6}
                    fill={i === active && level <= d ? ACCENT : C.panel}
                    fillOpacity={0.25}
                    stroke={i === active && level <= d ? ACCENT : C.muted}
                    strokeWidth={2}
                  />
                  <Cap x={x} y={y} size={18}>
                    {8 / count}
                  </Cap>
                </g>
              );
            })}
          </Group>
        );
      })}
      <Cap x={530} y={710} size={20}>
        Cada nivel conserva la mitad que contiene la luz.
      </Cap>
    </>
  );
}
/** Each chip is one eighth of the source. A successful drop transfers exactly one chip. */
export function SourceBars({
  probabilities,
  lengths,
  onTransfer,
  labels,
  reveal = true,
  progress = 1,
}: {
  probabilities: number[];
  lengths?: number[];
  onTransfer?: (from: number, to: number) => void;
  labels?: string[];
  reveal?: boolean;
  progress?: number;
}) {
  distribution(probabilities);
  const m = probabilities.length,
    spacing = 720 / m;
  return (
    <>
      {probabilities.map((p, i) => {
        const x = 170 + (i + 0.5) * spacing,
          h = p * 430;
        return (
          <g key={i}>
            <rect
              x={x - spacing * 0.3}
              y={570 - h * progress}
              width={spacing * 0.6}
              height={h * progress}
              fill={COLORS[i]}
              fillOpacity={0.3}
              stroke={COLORS[i]}
              strokeWidth={2}
            />
            <Cap x={x} y={610} color={COLORS[i]}>
              {labels?.[i] ?? String.fromCharCode(65 + i)}
            </Cap>
            <Cap x={x} y={660} size={18}>
              {fmtComma(p)}
            </Cap>
            {onTransfer ? (
              <>
                <circle
                  cx={x}
                  cy={710}
                  r={24}
                  fill="none"
                  stroke={COLORS[i]}
                  strokeDasharray="5 5"
                />
                {p >= 1 / 8 && (
                  <DragToken
                    x={x}
                    y={570 - h - 65}
                    label="⅛"
                    color={COLORS[i]}
                    cue={i === 0}
                    onDrop={(px, py) => {
                      const j = probabilities.findIndex((_, k) =>
                        near(px, py, 170 + (k + 0.5) * spacing, 710),
                      );
                      if (j >= 0 && j !== i) onTransfer(i, j);
                    }}
                  />
                )}
              </>
            ) : (
              <Cap x={x} y={720} size={17}>
                {reveal
                  ? `aporta ${fmtComma(p === 0 ? 0 : p * (lengths?.[i] ?? info(p)))}`
                  : `largo ${lengths?.[i] ?? (p === 0 ? '—' : fmtComma(info(p)))}`}
              </Cap>
            )}
          </g>
        );
      })}
      {reveal && <Cap x={1250} y={250} color={ACCENT} tex={`H=${num(entropy(probabilities))}`} />}
      {onTransfer && (
        <Cap x={1250} y={340} size={18}>
          Suelta la ficha en el círculo destino.
        </Cap>
      )}
    </>
  );
}
export function PrefixTree({
  nodes,
  edges,
  active = '',
  onJoin,
}: {
  nodes: PrefixNode[];
  edges: PrefixEdge[];
  active?: string;
  onJoin?: (a: PrefixNode, b: PrefixNode) => void;
}) {
  const [dropped, setDropped] = useState<string[]>([]),
    [message, setMessage] = useState('');
  const signature = nodes.map((n) => n.id).join('|');
  useEffect(() => {
    setDropped([]);
    setMessage('');
  }, [signature]);
  if (onJoin) {
    const ordered = [...nodes].sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
    const targets: [[number, number], [number, number]] = [
      [410, 520],
      [670, 520],
    ];
    return (
      <>
        {targets.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={24} fill={C.panel} stroke={ACCENT} strokeWidth={3} />
            <Cap x={x} y={y + 65} size={18}>
              Unión {i + 1}
            </Cap>
          </g>
        ))}
        {nodes.map((n, i) => {
          const slot = dropped.indexOf(n.id),
            x = slot < 0 ? 230 + i * 190 : targets[slot][0],
            y = slot < 0 ? 270 : targets[slot][1];
          return (
            <g key={n.id}>
              <DragToken
                x={x}
                y={y}
                label={n.id}
                color={slot < 0 ? C.amber : ACCENT}
                cue={slot < 0 && i === nodes.findIndex((m) => !dropped.includes(m.id))}
                onDrop={(px, py) => {
                  const target = targets.findIndex(([tx, ty]) => near(px, py, tx, ty));
                  if (target < 0 || dropped.includes(n.id)) return;
                  if (n.id !== ordered[target].id) {
                    setMessage(
                      `En el destino ${target + 1} va ${ordered[target].id}, de peso ${fmtComma(ordered[target].weight)}.`,
                    );
                    return;
                  }
                  const next = [...dropped];
                  next[target] = n.id;
                  setDropped(next);
                  setMessage('Peso ubicado.');
                  if (next[0] && next[1]) {
                    const a = nodes.find((v) => v.id === next[0])!,
                      b = nodes.find((v) => v.id === next[1])!;
                    onJoin(a, b);
                  }
                }}
              />
              <Cap x={x} y={y - 65} size={20} tex={num(n.weight)} />
            </g>
          );
        })}
        <Cap x={540} y={175} size={22}>
          Dos pesos menores; en empate, orden por etiqueta.
        </Cap>
        <Cap x={540} y={690} size={19} color={ACCENT}>
          {message}
        </Cap>
      </>
    );
  }
  return (
    <>
      {edges.map((e) => {
        const a = nodes.find((n) => n.id === e.from)!,
          b = nodes.find((n) => n.id === e.to)!;
        return (
          <g key={e.from + e.to}>
            <line
              x1={a.x}
              y1={a.y + 24}
              x2={b.x}
              y2={b.y - 24}
              stroke={active.startsWith(b.code ?? b.id) ? ACCENT : C.dim}
              strokeWidth={3}
            />
            <Cap
              x={(a.x + b.x) / 2 + (e.bit ? 20 : -20)}
              y={(a.y + b.y) / 2}
              size={18}
              color={C.amber}
            >
              {e.bit}
            </Cap>
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={28}
            fill={C.panel}
            stroke={n.symbol ? ACCENT : C.dim}
            strokeWidth={2}
          />
          <Cap x={n.x} y={n.y} size={17}>
            {fmtComma(n.weight)}
          </Cap>
          {n.symbol && (
            <>
              <Cap x={n.x} y={n.y + 48} color={ACCENT}>
                {n.symbol}
              </Cap>
              <Cap x={n.x} y={n.y + 88} size={20}>
                {n.code}
              </Cap>
            </>
          )}
        </g>
      ))}
    </>
  );
}
export function BitTape({
  bits,
  groups = [],
  erased = [],
  flipped = [],
  cursor,
  onCursor,
  onCorrect,
  x = 170,
  y = 360,
  width = 720,
}: {
  bits: string;
  groups?: number[];
  erased?: number[];
  flipped?: number[];
  cursor?: number;
  onCursor?: (i: number) => void;
  onCorrect?: (i: number) => void;
  x?: number;
  y?: number;
  width?: number;
}) {
  const spacing = width / Math.max(bits.length, 1),
    svg = useRef<SVGSVGElement | null>(null);
  const drag = useSvgDrag(svg, (px, _py, phase) => {
    if (phase === 'end') onCursor?.(Math.round(clamp((px - x) / spacing, 0, bits.length)));
  });
  return (
    <>
      {[...bits].map((b, i) => (
        <g key={i}>
          <rect
            x={x + i * spacing}
            y={y}
            width={spacing - 5}
            height={75}
            rx={5}
            fill={C.panel}
            stroke={erased.includes(i) ? C.amber : flipped.includes(i) ? C.red : ACCENT}
            strokeWidth={2}
          />
          <Cap x={x + (i + 0.5) * spacing - 2} y={y + 37} size={25}>
            {erased.includes(i) ? '?' : b}
          </Cap>
        </g>
      ))}
      {groups.map((i) => (
        <line
          key={i}
          x1={x + i * spacing - 2}
          x2={x + i * spacing - 2}
          y1={y - 18}
          y2={y + 90}
          stroke={C.amber}
          strokeWidth={4}
        />
      ))}
      {cursor !== undefined && (
        <>
          <line
            x1={x + cursor * spacing}
            x2={x + cursor * spacing}
            y1={y - 10}
            y2={y + 75}
            stroke={C.magenta}
            strokeWidth={3}
          />
          {onCursor && (
            <Knob
              x={x + cursor * spacing}
              y={y + 140}
              axis="x"
              color={C.magenta}
              onPointerDown={(e) => {
                svg.current = (e.currentTarget as SVGGElement).ownerSVGElement;
                drag(e);
              }}
            />
          )}
        </>
      )}
      {onCorrect && (
        <DragToken
          x={230}
          y={y + 210}
          label="↺"
          color={C.red}
          onDrop={(px, py) => {
            const i = [...bits].findIndex((_, j) =>
              near(px, py, x + (j + 0.5) * spacing - 2, y + 37),
            );
            if (i >= 0) onCorrect(i);
          }}
        />
      )}
    </>
  );
}
/** Exact rational label for the dyadic probabilities used by the terminal. */
export function fraction(v: number) {
  if (!Number.isFinite(v)) return '+\\infty';
  for (let d = 1; d <= 256; d *= 2) {
    const n = v * d;
    if (Number.isInteger(n)) return d === 1 ? String(n) : `\\frac{${n}}{${d}}`;
  }
  return num(v);
}
export const ROUTE_COUNTS = [
  [4, 4, 0, 0],
  [0, 0, 4, 4],
];
export const ROUTE_TABLE = ROUTE_COUNTS.map((row) => row.map((n) => n / sum(ROUTE_COUNTS.flat())));
export const PILOT_COUNTS = [
  [4, 4],
  [4, 4],
];
export const Q = [1 / 8, 1 / 2, 1 / 4, 1 / 8];
export const Q_CODES = { A: '110', B: '0', C: '10', D: '111' };

/** Large joint table. A row filter renormalizes; larger tables retain all rows via paging. */
export function JointGrid({
  counts,
  rows,
  columns,
  filter,
  columnFilter,
  onFilter,
  showInfo = false,
  progress = 1,
}: {
  counts: number[][];
  rows: string[];
  columns: string[];
  filter?: number;
  columnFilter?: number;
  onFilter?: (i: number) => void;
  showInfo?: boolean;
  progress?: number;
}) {
  const [page, setPage] = useState(0);
  const signature = rows.join('|') + columns.join('|');
  useEffect(() => setPage(0), [signature, filter, columnFilter]);
  const total = sum(counts.flat());
  const rowIds = filter === undefined ? counts.map((_, i) => i) : [filter];
  const colIds = columnFilter === undefined ? columns.map((_, i) => i) : [columnFilter];
  const pages = Math.ceil(rowIds.length / 4);
  const visible = rowIds.slice(Math.min(page, pages - 1) * 4, (Math.min(page, pages - 1) + 1) * 4);
  const cw = 600 / colIds.length,
    ch = 420 / visible.length;
  const denominator =
    filter !== undefined
      ? sum(counts[filter])
      : columnFilter !== undefined
        ? sum(counts.map((row) => row[columnFilter]))
        : total;
  return (
    <>
      <Cap x={535} y={135} size={21} color={ACCENT}>
        {filter !== undefined
          ? `Torre conocida: ${rows[filter]}`
          : columnFilter !== undefined
            ? `Ruta conocida: ${columns[columnFilter]}`
            : 'X = torre · Y = ruta'}
      </Cap>
      {colIds.map((j, v) => (
        <Cap key={j} x={290 + (v + 0.5) * cw} y={200} size={20}>
          {columns[j]}
        </Cap>
      ))}
      {visible.map((i, v) => (
        <g key={i}>
          <Cap x={210} y={240 + (v + 0.5) * ch} size={20} color={ACCENT}>
            {rows[i]}
          </Cap>
          {colIds.map((j, u) => {
            const n = counts[i][j],
              p = denominator ? n / denominator : 0;
            const x = 290 + u * cw,
              y = 240 + v * ch;
            return (
              <g key={j}>
                <rect
                  x={x}
                  y={y}
                  width={cw - 5}
                  height={ch - 5}
                  rx={6}
                  fill={n ? '#164d48' : C.panel}
                  stroke={n ? ACCENT : C.muted}
                  strokeWidth={2}
                />
                {!n && (
                  <path
                    d={`M${x + 10} ${y + 10}L${x + cw - 15} ${y + ch - 15}`}
                    stroke={C.muted}
                    strokeWidth={2}
                  />
                )}
                <Cap x={x + cw / 2} y={y + ch * 0.32} size={columns.length > 4 ? 17 : 22}>
                  {n}
                </Cap>
                <Cap
                  x={x + cw / 2}
                  y={y + ch * 0.7}
                  size={columns.length > 4 ? 17 : 22}
                  tex={showInfo && p > 0 ? `${num(info(p))}\\ \\text{bits}` : fraction(p)}
                  color={n ? ACCENT : C.muted}
                />
                {n > 0 &&
                  ch > 180 &&
                  Array.from({ length: Math.min(n, 4) }, (_, k) => (
                    <circle
                      key={k}
                      cx={x + (cw * (k + 1)) / (Math.min(n, 4) + 1)}
                      cy={y + ch * (0.88 - 0.08 * progress)}
                      r={7}
                      fill={ACCENT}
                    />
                  ))}
              </g>
            );
          })}
        </g>
      ))}
      {pages > 1 && (
        <Html x={540} y={730} size={20} interactive>
          <div className="stage-choices">
            <button className="stage-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
              ↑
            </button>
            <span>
              Filas {page * 4 + 1}–{Math.min((page + 1) * 4, rowIds.length)} de {rowIds.length}
            </span>
            <button
              className="stage-btn"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              ↓
            </button>
          </div>
        </Html>
      )}
      {onFilter && (
        <>
          <circle cx={820} cy={745} r={24} stroke={ACCENT} strokeWidth={3} fill={C.panel} />
          <Cap x={820} y={805} size={18}>
            Filtro
          </Cap>
          {rows.map((r, i) => (
            <DragToken
              key={r}
              x={230 + i * 160}
              y={745}
              label={r}
              cue={i === rows.length - 1}
              onDrop={(x, y) => {
                if (near(x, y, 820, 745)) onFilter(i);
              }}
            />
          ))}
        </>
      )}
    </>
  );
}
/** Equal-height areas: the overlap and each exclusive strip use the same scale per bit. */
export function SharedBits({
  hx,
  hy,
  hxy,
  showShared = true,
  showReadings = true,
  labelY = 'Y',
  progress = 1,
}: {
  hx: number;
  hy: number;
  hxy: number;
  showShared?: boolean;
  showReadings?: boolean;
  labelY?: string;
  progress?: number;
}) {
  const shared = hx + hy - hxy;
  if (shared < -1e-10 || shared > Math.min(hx, hy) + 1e-10)
    throw new RangeError('Entropías incompatibles.');
  const scale = 720 / Math.max(hxy, 1),
    x = 170,
    y = 250,
    h = 400;
  const exclusiveX = hx - shared,
    exclusiveY = hy - shared;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={720}
        height={h}
        rx={8}
        fill={C.panel}
        stroke={C.muted}
        strokeWidth={2}
      />
      {exclusiveX > 0 && (
        <rect x={x} y={y} width={exclusiveX * scale} height={h} fill={ACCENT} fillOpacity={0.7} />
      )}
      {shared > 0 && (
        <rect
          x={x + exclusiveX * scale}
          y={y}
          width={shared * scale}
          height={h}
          fill={C.magenta}
          fillOpacity={0.7}
        />
      )}
      {exclusiveY > 0 && (
        <rect
          x={x + hx * scale}
          y={y}
          width={exclusiveY * scale}
          height={h}
          fill={C.amber}
          fillOpacity={0.7}
        />
      )}
      <path d={`M${x} 225V205H${x + hx * scale}V225`} fill="none" stroke={ACCENT} strokeWidth={4} />
      <Cap x={x + (hx * scale) / 2} y={165} color={ACCENT} tex={`H(X)=${num(hx)}`} />
      <path
        d={`M${x + exclusiveX * scale} 675V695H${x + hxy * scale}V675`}
        fill="none"
        stroke={C.amber}
        strokeWidth={4}
      />
      <Cap
        x={x + (exclusiveX + hy / 2) * scale}
        y={740}
        color={C.amber}
        tex={`H(${labelY})=${num(hy)}`}
      />
      {shared > 0 && (
        <Cap x={x + (exclusiveX + shared / 2) * scale} y={450} size={21}>
          {showShared ? bitsText(shared) : 'Compartido'}
        </Cap>
      )}
      {exclusiveX > 0 && (
        <Cap x={x + (exclusiveX * scale) / 2} y={450} size={20}>
          Solo X
        </Cap>
      )}
      {exclusiveY > 0 && (
        <Cap x={x + (hx + exclusiveY / 2) * scale} y={450} size={20}>
          Solo {labelY}
        </Cap>
      )}
      <line
        x1={x}
        x2={x + hxy * scale * progress}
        y1={y + h}
        y2={y + h}
        stroke={C.text}
        strokeWidth={4}
      />
      {showReadings && (
        <>
          <Cap x={1250} y={240} tex={`H(X)=${num(hx)}`} color={ACCENT} />
          <Cap x={1250} y={330} tex={`H(${labelY})=${num(hy)}`} color={C.amber} />
          <Cap x={1250} y={420} tex={`H(X,${labelY})=${num(hxy)}`} />
          {showShared && (
            <Cap x={1250} y={530} color={C.magenta}>
              Compartido: {bitsText(shared)}
            </Cap>
          )}
        </>
      )}
    </>
  );
}
/** Both tapes use a common bit scale. Individual signed contributions stay signed. */
export function CodeCost({
  source,
  profile,
  lengths,
  labels = SYMBOLS,
  count = 8,
  showReadings = true,
  showExcess = true,
  showContributions = true,
  progress = 1,
}: {
  source: number[];
  profile: number[];
  lengths?: number[];
  labels?: string[];
  count?: number;
  showReadings?: boolean;
  showExcess?: boolean;
  showContributions?: boolean;
  progress?: number;
}) {
  distribution(source);
  distribution(profile);
  const own = source.map((p) => (p === 0 ? 0 : info(p))),
    other = lengths ?? profile.map(info);
  const costs = [own, other].map((ls) => meanLength(source, ls) * count);
  const scale = 720 / Math.max(...costs, 1);
  return (
    <>
      {[own, other].map((ls, row) => {
        let x = 170;
        return (
          <g key={row}>
            <Cap x={530} y={185 + row * 270} size={21}>
              {row === 0 ? 'Código de la fuente' : 'Código del perfil elegido'}
            </Cap>
            {source.map((p, i) => {
              const n = count * p,
                w = n * ls[i] * scale,
                start = x;
              x += w;
              if (!n) return null;
              return (
                <g key={i}>
                  <rect
                    x={start}
                    y={230 + row * 270}
                    width={w * progress}
                    height={160}
                    fill={COLORS[i]}
                    fillOpacity={0.7}
                    stroke={COLORS[i]}
                    strokeWidth={3}
                  />
                  {Array.from({ length: Math.max(0, Math.ceil(n * ls[i]) - 1) }, (_, j) => (
                    <line
                      key={j}
                      x1={start + (j + 1) * scale}
                      x2={start + (j + 1) * scale}
                      y1={235 + row * 270}
                      y2={265 + row * 270}
                      stroke={C.text}
                      strokeWidth={1.5}
                    />
                  ))}
                  <Cap x={start + w / 2} y={310 + row * 270} size={21}>
                    {labels[i]} × {n}
                  </Cap>
                </g>
              );
            })}
          </g>
        );
      })}
      {showReadings && (
        <>
          <Cap x={1250} y={240}>
            Propio: {bitsText(costs[0])}
          </Cap>
          <Cap x={1250} y={330}>
            Perfil: {bitsText(costs[1])}
          </Cap>
          {showExcess && (
            <Cap x={1250} y={420} color={C.amber}>
              Exceso: {bitsText(costs[1] - costs[0])}
            </Cap>
          )}
        </>
      )}
      {showContributions &&
        source.map((p, i) => {
          const delta = p * (other[i] - own[i]);
          return (
            <Cap
              key={i}
              x={230 + i * 190}
              y={745}
              size={20}
              color={COLORS[i]}
              tex={`${labels[i]}:\\ ${delta > 0 ? '+' : ''}${fraction(delta)}`}
            />
          );
        })}
    </>
  );
}
export function BinaryChannel({
  p,
  inputBalance,
  rate,
  trace = '00110101',
  onP,
  onRate,
}: {
  p: number;
  inputBalance: number;
  rate: number;
  trace?: string;
  onP?: (p: number) => void;
  onRate?: (r: number) => void;
}) {
  prob(p);
  prob(inputBalance);
  bitsOnly(trace);
  const choices = [0, 1 / 8, 1 / 4, 1 / 2],
    rates = [1 / 16, 1 / 8, 1 / 4, 1 / 2];
  return (
    <>
      {[0, 1].map((b) => (
        <g key={b}>
          <line
            x1={170}
            x2={900}
            y1={300 + b * 210}
            y2={300 + b * 210}
            stroke={b ? C.amber : ACCENT}
            strokeWidth={5}
          />
          <Cap x={170} y={240 + b * 210}>
            {b}
          </Cap>
        </g>
      ))}
      {[...trace].map((b, i) => {
        const flip = ((i * 5 + 3) % 16) / 16 < p,
          x = 220 + i * 80,
          y = 300 + Number(b) * 210;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={10} fill={ACCENT} />
            <path
              d={`M${x} ${y} L${x + 50} ${flip ? 810 - y : y}`}
              stroke={flip ? C.red : ACCENT}
              strokeWidth={3}
            />
          </g>
        );
      })}
      <Cap x={530} y={650} size={18}>
        Traza reproducible; las probabilidades salen del modelo.
      </Cap>
      <Cap x={1250} y={190}>
        P(inversión) = {fmtComma(p)}
      </Cap>
      <Cap x={1250} y={280}>
        C = {fmtComma(bscCapacity(p))} bits/uso
      </Cap>
      <Cap x={1250} y={370}>
        R = {fmtComma(rate)} bits/uso
      </Cap>
      {onP && (
        <DiscreteDial
          value={choices.indexOf(p)}
          max={3}
          y={470}
          labels={choices.map((v) => fmtComma(v))}
          onChange={() => {}}
          onSettle={(i) => onP(choices[i])}
        />
      )}
      {onRate && (
        <DiscreteDial
          value={rates.indexOf(rate)}
          max={3}
          y={640}
          labels={rates.map((v) => fmtComma(v))}
          onChange={() => {}}
          onSettle={(i) => onRate(rates[i])}
        />
      )}
      <Cap x={530} y={730} size={18}>
        P(entrada 1) = {fmtComma(inputBalance)}
      </Cap>
    </>
  );
}
export function ParityRack({
  received,
  mode,
  checks = [],
  syndrome,
  onCorrect,
}: {
  received: string;
  mode: 'parity' | 'repetition' | 'hamming';
  checks?: number[];
  syndrome?: string;
  onCorrect?: (i: number) => void;
}) {
  bitsOnly(received);
  const [group, setGroup] = useState(0),
    groups = [
      [1, 3, 5, 7],
      [2, 3, 6, 7],
      [4, 5, 6, 7],
    ];
  return (
    <>
      <BitTape bits={received} y={350} onCorrect={onCorrect} />
      {[...received].map((_, i) => (
        <Cap
          key={i}
          x={170 + ((i + 0.5) * 720) / received.length - 2}
          y={310}
          size={18}
          color={mode === 'hamming' && groups[group].includes(i + 1) ? C.amber : C.muted}
        >
          {i + 1}
        </Cap>
      ))}
      {mode === 'hamming' && (
        <>
          <DragToken
            x={200}
            y={650}
            label="⌕"
            onDrop={(x, y) => {
              const j = [1, 2, 4].findIndex((v) =>
                near(x, y, 170 + ((v - 0.5) * 720) / received.length - 2, 387),
              );
              if (j >= 0) setGroup(j);
            }}
          />
          <Cap x={530} y={670} size={18}>
            Grupo {2 ** group}: {groups[group].join(', ')}
          </Cap>
        </>
      )}
      <Cap x={1250} y={250}>
        Unos: {sum([...received].map(Number))}
      </Cap>
      <Cap x={1250} y={340}>
        XOR = {xor(received)}
      </Cap>
      {mode === 'repetition' && (
        <Cap x={1250} y={430}>
          Mayoría: {sum([...received].map(Number)) > received.length / 2 ? 1 : 0}
        </Cap>
      )}
      {mode === 'hamming' && (
        <>
          <Cap x={1250} y={430}>
            Síndrome: {syndrome ?? hammingSyndrome(received).bits}
          </Cap>
          <Cap x={1250} y={520}>
            Checks: {(checks.length ? checks : hammingSyndrome(received).checks).join(', ')}
          </Cap>
        </>
      )}
    </>
  );
}
