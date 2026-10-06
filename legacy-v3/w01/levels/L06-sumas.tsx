import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { BoxRow, boxCenter } from '../shared/Boxes';
import { pick, randInt, rng } from '../shared/rng';

// ============================================================================
// 1.6 · SUMATORIAS — Σ como bucle
// demo: accumulator loop, bound (mute) index, Σc = nc (prediction), linearity,
//       Σxy ≠ ΣxΣy (prediction), sweeping a table collapses an axis (gate), marginalization
// challenge: select exactly the terms a Σ expression adds (lists and tables)
// forge: linearity, constants, expand/collapse, splitting
// ============================================================================

// ---------------------------------------------------------------- demo scene
function SumDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const x = [3, 1, 4, 1, 5];
  const n = x.length;
  const rev3 = useTween(beat > 3 || (beat === 3 && answer !== null) ? 1 : 0, 1);
  const rev5 = useTween(beat > 5 || (beat === 5 && answer !== null) ? 1 : 0, 1);
  const [sweep, setSweep] = useState(0);
  const onDrag = useSvgDrag(svg, (_x, y) => {
    if (beat !== 6) return;
    const s = clamp((y - 250) / 330, 0, 1);
    setSweep(s);
    if (s > 0.97) unlock();
  });
  const sw = beat === 6 ? sweep : beat > 6 ? 1 : 0;

  const loop = beat === 1 ? at(1) : beat > 1 ? 1 : 0;
  const k = Math.min(n - 1, Math.floor(loop * n));
  const partial = x.slice(0, loop >= 1 ? n : k + (loop * n - k > 0.6 ? 1 : 0)).reduce((a, b) => a + b, 0);
  const listV = 1 - at(6);
  const tableV = at(6) * (1 - at(7));
  const aifV = at(7);
  const lin = beat === 4 ? at(4) : 0;
  const shown = x.map((v) => lerp(v, 2 * v + 1, lin));
  const total = beat === 4 ? shown.reduce((a, b) => a + b, 0) : partial;

  const A = [
    [0.1, 0.05, 0.2],
    [0.2, 0.1, 0.05],
    [0.1, 0.15, 0.05],
  ];
  const colSum = [0, 1, 2].map((j) => A.reduce((s, r) => s + r[j], 0));

  return (
    <Stage ref={svg}>
      <Group opacity={listV}>
        <BoxRow x={640} y={360} values={shown} fmtValue={(v) => String(Math.round(v * 10) / 10)} highlight={beat === 1 && loop < 1 ? [k] : []} />
        {/* jar */}
        <path d="M1220 260 L1220 470 Q1220 500 1250 500 L1390 500 Q1420 500 1420 470 L1420 260" fill="none" stroke={C.violet} strokeWidth={3} />
        <rect x={1226} y={500 - Math.min(230, total * 7)} width={188} height={Math.min(230, total * 7)} fill={C.violet} opacity={0.25} />
        <Html x={1320} y={380} size={44} color={C.violet}>
          <Tex tex={String(Math.round(total * 10) / 10)} />
        </Html>
        <Html x={1320} y={545} size={22} color={C.violet}>
          <span className="panel-note">acumulador</span>
        </Html>
        {beat === 1 && loop < 1 && (
          <Dot x={lerp(boxCenter(640, n, k), 1320, (loop * n - k) % 1)} y={lerp(360, 300, Math.sin(((loop * n - k) % 1) * Math.PI))} r={14} color={C.amber} />
        )}
        <Html x={640} y={200} size={36} color={C.text}>
          <Tex
            tex={
              beat === 2
                ? '\\sum_{i=1}^{5}x_i=\\sum_{k=1}^{5}x_k=14'
                : beat === 4
                  ? '\\sum_{i=1}^{5}(2x_i+1)=2\\sum_{i=1}^{5}x_i+5=33'
                  : beat >= 1
                    ? '\\sum_{i=1}^{5}x_i=3+1+4+1+5=14'
                    : '\\sum_{i=1}^{5}x_i'
            }
          />
        </Html>
        {beat === 1 && loop < 1 && (
          <Html x={boxCenter(640, n, k)} y={480} size={26} color={C.cyan}>
            <Tex tex={`i=${k + 1}`} />
          </Html>
        )}
        <Group opacity={beat === 3 ? rev3 : 0}>
          <BoxRow x={640} y={620} values={[2, 2, 2]} valueColor={C.green} />
          <Html x={640} y={740} size={28} color={C.green}>
            <Tex tex="\sum_{i=1}^{3}2=2+2+2=6=3\cdot2" />
          </Html>
        </Group>
        <Group opacity={beat === 5 ? rev5 : 0}>
          <Html x={640} y={640} size={28} color={C.red}>
            <Tex tex="\mathbf x=(1,2),\ \mathbf y=(3,4):\quad \sum_i x_iy_i=1\cdot3+2\cdot4=11\neq(1+2)(3+4)=21" />
          </Html>
        </Group>
      </Group>
      {/* table sweep */}
      <Group opacity={tableV}>
        {A.map((row, i) =>
          row.map((v, j) => {
            const done = sw * 3 > i + 0.5;
            return (
              <g key={`${i}${j}`}>
                <rect x={560 + j * 160} y={250 + i * 110} width={150} height={100} rx={10} fill={C.panel} stroke={done ? C.violet : C.line} strokeWidth={2} opacity={done ? 0.45 : 1} />
                <Html x={635 + j * 160} y={300 + i * 110} size={26} color={C.text} opacity={done ? 0.45 : 1}>
                  <Tex tex={String(v)} />
                </Html>
              </g>
            );
          }),
        )}
        {[0, 1, 2].map((i) => (
          <Html key={'i' + i} x={510} y={300 + i * 110} size={24} color={C.cyan}>
            <Tex tex={`i=${i + 1}`} />
          </Html>
        ))}
        {[0, 1, 2].map((j) => (
          <Html key={'j' + j} x={635 + j * 160} y={220} size={24} color={C.amber}>
            <Tex tex={`j=${j + 1}`} />
          </Html>
        ))}
        <Line a={[540, 250 + sw * 330]} b={[1060, 250 + sw * 330]} color={C.violet} width={4} glow />
        {beat === 6 && (
          <g style={{ cursor: 'ns-resize' }} onPointerDown={onDrag}>
            <rect x={1060} y={230} width={90} height={380} fill="transparent" />
            <Dot x={1100} y={250 + sw * 330} r={16} color={C.violet} ring />
          </g>
        )}
        {[0, 1, 2].map((j) => (
          <Group key={'b' + j} opacity={clamp(sw * 1.2 - 0.1, 0, 1)}>
            <rect x={560 + j * 160} y={620} width={150} height={90} rx={10} fill={C.violet} fillOpacity={0.2} stroke={C.violet} strokeWidth={2} />
            <Html x={635 + j * 160} y={665} size={26} color={C.violet}>
              <Tex tex={`b_${j + 1}=${Math.round(colSum[j] * 100) / 100}`} />
            </Html>
          </Group>
        ))}
        <Html x={1330} y={450} size={30} color={C.text}>
          <Tex tex="b_j=\sum_{i}a_{ij}" />
        </Html>
        <Html x={1330} y={510} size={22} color={C.muted}>
          <span>i desaparece · j sigue libre</span>
        </Html>
      </Group>
      {/* AIF */}
      <Group opacity={aifV}>
        <Html x={800} y={300} size={34} color={C.text}>
          <Tex tex="\sum_{s}p(s)=1" />
        </Html>
        <Html x={800} y={420} size={34} color={C.text}>
          <Tex tex="p(o)=\sum_{s}p(o\mid s)\,p(s)" />
        </Html>
        <Html x={800} y={540} size={30} color={C.text}>
          <Tex tex="F=\sum_{s}q(s)\big[\ln q(s)-\ln p(o,s)\big]" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type SumTask = { kind: 'list' | 'table'; tex: string; want: string[]; note: string };
function sumTask(seed: number, round: number): SumTask {
  const r = rng(seed);
  switch (round) {
    case 0: {
      const a = randInt(r, 1, 3);
      const b = randInt(r, a + 1, 6);
      return { kind: 'list', tex: `\\sum_{i=${a}}^{${b}}x_i`, want: Array.from({ length: b - a + 1 }, (_, k) => `${a + k}`), note: `$i$ recorre de ${a} a ${b}, ambos incluidos.` };
    }
    case 1: {
      const m = pick(r, [2, 3]);
      return { kind: 'list', tex: `\\sum_{k=1}^{${m}}x_{2k}`, want: Array.from({ length: m }, (_, k) => `${2 * (k + 1)}`), note: 'El índice $k$ cuenta pasos; la dirección leída es $2k$.' };
    }
    case 2: {
      const i = randInt(r, 1, 3);
      return { kind: 'table', tex: `\\sum_{j}a_{${i}j}`, want: [1, 2, 3, 4].map((j) => `${i},${j}`), note: `$i=${i}$ fijo; $j$ recorre la fila entera.` };
    }
    case 3: {
      const j = randInt(r, 1, 4);
      return { kind: 'table', tex: `\\sum_{i}a_{i${j}}`, want: [1, 2, 3].map((i) => `${i},${j}`), note: `$j=${j}$ fijo; $i$ recorre la columna.` };
    }
    default:
      return pick(r, [
        { kind: 'table' as const, tex: '\\sum_{i=1}^{3}a_{ii}', want: ['1,1', '2,2', '3,3'], note: 'Ambos índices iguales: la diagonal.' },
        { kind: 'table' as const, tex: '\\sum_{i=1}^{3}\\sum_{j=1}^{i}a_{ij}', want: ['1,1', '2,1', '2,2', '3,1', '3,2', '3,3'], note: 'El límite interior depende del exterior: triángulo inferior.' },
      ]);
  }
}

function Accumulator({ seed, round, api }: ChallengeProps) {
  const task = useMemo(() => sumTask(seed, round), [seed, round]);
  const vals = useMemo(() => {
    const r = rng(seed ^ 0x5bd1e995);
    return task.kind === 'list' ? Array.from({ length: 6 }, () => randInt(r, 1, 9)) : Array.from({ length: 12 }, () => randInt(r, 1, 9));
  }, [seed, task.kind]);
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (k: string) => {
    api.sfx.click();
    setSel(sel.includes(k) ? sel.filter((s) => s !== k) : [...sel, k]);
  };
  useEffect(() => {
    api.prompt(`Marca exactamente los términos que suma $${task.tex}$.`, task.tex);
    api.hints(['Lee el índice que se suma y sus límites; todo lo demás queda fijo.', task.note]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);
  const valueOf = (k: string) => (task.kind === 'list' ? vals[Number(k) - 1] : vals[(Number(k.split(',')[0]) - 1) * 4 + Number(k.split(',')[1]) - 1]);
  const label = (k: string) => (task.kind === 'list' ? `x_{${k}}` : `a_{${k.replace(',', '')}}`);
  const submit = () => {
    const extra = sel.find((s) => !task.want.includes(s));
    const miss = task.want.find((w) => !sel.includes(w));
    if (!extra && !miss) {
      const tot = task.want.reduce((s, k) => s + valueOf(k), 0);
      return api.result(true, `$${task.tex}=${task.want.map((k) => valueOf(k)).join('+')}=${tot}$. ${task.note}`);
    }
    if (extra) return api.result(false, `$${label(extra)}$ no entra en $${task.tex}$. ${task.note}`);
    api.result(false, `Falta $${label(miss!)}$. ${task.note}`);
  };
  return (
    <Stage>
      <Html x={800} y={140} size={44} color={C.text}>
        <Tex tex={task.tex} />
      </Html>
      {task.kind === 'list' ? (
        <BoxRow x={800} y={420} values={vals} selected={sel.map((k) => Number(k) - 1)} onBox={(i) => toggle(`${i + 1}`)} />
      ) : (
        <>
          {[0, 1, 2].map((i) =>
            [0, 1, 2, 3].map((j) => {
              const k = `${i + 1},${j + 1}`;
              const on = sel.includes(k);
              return (
                <g key={k} style={{ cursor: 'pointer' }} onClick={() => toggle(k)}>
                  <rect x={500 + j * 155} y={250 + i * 115} width={145} height={105} rx={10} fill={on ? C.violet : C.panel} fillOpacity={on ? 0.3 : 1} stroke={on ? C.violet : C.line} strokeWidth={on ? 3 : 1.5} />
                  <Html x={572 + j * 155} y={302 + i * 115} size={28} color={C.text}>
                    <Tex tex={String(vals[i * 4 + j])} />
                  </Html>
                </g>
              );
            }),
          )}
          {[1, 2, 3].map((i) => (
            <Html key={'r' + i} x={450} y={302 + (i - 1) * 115} size={22} color={C.cyan}>
              <Tex tex={`i=${i}`} />
            </Html>
          ))}
          {[1, 2, 3, 4].map((j) => (
            <Html key={'c' + j} x={572 + (j - 1) * 155} y={220} size={22} color={C.amber}>
              <Tex tex={`j=${j}`} />
            </Html>
          ))}
        </>
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
  id: 'w01-l06',
  world: 'foundations',
  code: '1.6',
  title: 'Sumatorias',
  subtitle: 'Σ como bucle',
  glyph: '\\textstyle\\sum',
  kind: 'level',
  objective: 'Leer $\\sum$ como un bucle con índice mudo, saber qué términos entran, usar su linealidad y sumar sobre un eje de una tabla (marginalizar).',
  glyphs: ['sum'],
  codex: ['w01-sumas'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Normalizar, promediar, marginalizar, calcular la energía libre: todo pasa por **sumar sobre un índice**.',
        '$\\sum$ es un bucle comprimido en un símbolo. Hay que saber qué recorre, qué deja fijo y qué desaparece.',
      ],
    },
    {
      kind: 'demo',
      title: 'Acumulador',
      Scene: SumDemo,
      beats: [
        { say: 'Una lista y un acumulador vacío. $\\sum$ dice: recorre el índice y acumula.', tex: '\\g{sum}{\\sum}_{i=1}^{5}x_i', dur: 1.6 },
        { say: 'El bucle: $i$ toma los valores $1,\\dots,5$; en cada paso, $x_i$ entra al acumulador.', tex: '\\sum_{i=1}^{5}x_i=x_1+x_2+x_3+x_4+x_5', dur: 4.2 },
        { say: 'El índice sumado **desaparece** del resultado: es mudo. Cambiarle el nombre no cambia nada.', tex: '\\sum_{i}x_i=\\sum_{k}x_k', dur: 1.6 },
        {
          say: '¿Y si lo sumado no depende del índice?',
          tex: '\\sum_{i=1}^{3}2=\\;?',
          ask: { prompt: '¿Cuánto vale $\\sum_{i=1}^{3}2$?', options: ['$6$', '$2$', '$3$'], answer: 0, explain: 'Se suma el 2 una vez por cada valor de $i$: $2+2+2=6$. En general $\\sum_{i=1}^{n}c=nc$.' },
        },
        { say: '$\\sum$ es **lineal**: los factores constantes salen y las sumas se separan.', tex: '\\sum_i(a\\,x_i+b)=a\\sum_i x_i+n\\,b', dur: 2.4 },
        {
          say: 'Pero los productos no se separan.',
          tex: '\\sum_i x_iy_i\\ \\overset{?}{=}\\ \\Big(\\sum_i x_i\\Big)\\Big(\\sum_i y_i\\Big)',
          ask: {
            prompt: '¿Vale $\\sum_i x_iy_i=(\\sum_i x_i)(\\sum_i y_i)$?',
            options: ['No en general', 'Sí, siempre', 'Solo si todo es positivo'],
            answer: 0,
            explain: 'Con $\\mathbf x=(1,2)$ y $\\mathbf y=(3,4)$: $11\\neq21$. A la derecha aparecen los productos cruzados $x_1y_2+x_2y_1$.',
          },
        },
        {
          say: 'Con dos índices, sumar sobre uno **colapsa** ese eje. El otro queda libre: hay una suma por columna.',
          tex: 'b_j=\\sum_i a_{ij}',
          gate: 'Arrastra el barredor hacia abajo por todas las filas.',
        },
        { say: 'En el libro: normalización, evidencia y energía libre son sumas sobre estados.', tex: 'p(o)=\\sum_s p(o\\mid s)\\,p(s)', dur: 1.8 },
      ],
    },
    { kind: 'challenge', title: 'Acumulador', Comp: Accumulator, rounds: 5 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l06-f1',
          title: 'Linealidad',
          brief: 'Separa la suma y saca las constantes.',
          start: 'sum(i, 1, n, a*x_i + b)',
          goal: 'a*sum(i, 1, n, x_i) + n*b',
          rules: ['big-split', 'big-factor', 'big-const', 'expand', 'distribute'],
          par: 3,
          hints: ['Primero separa: $\\sum_i(u_i+v_i)=\\sum_i u_i+\\sum_i v_i$.', 'Luego $a$ sale de su suma y $\\sum_{i=1}^n b=nb$.'],
          bridge: '$\\mathbb E[aX+b]=a\\,\\mathbb E[X]+b$ es esta misma identidad con pesos.',
        },
        {
          id: 'l06-f2',
          title: 'Desplegar',
          brief: 'Escribe la suma explícita, con el factor común fuera.',
          start: 'sum(i, 1, 3, 2*x_i)',
          goal: '2*(x_1 + x_2 + x_3)',
          rules: ['big-factor', 'expand', 'collapse', 'distribute'],
          par: 2,
          hints: ['Saca el 2 y despliega.'],
        },
        {
          id: 'l06-f3',
          title: 'Comprimir',
          brief: 'Un patrón repetido con índices consecutivos: comprímelo en un $\\sum$.',
          start: 'x_1*y_1 + x_2*y_2 + x_3*y_3',
          goal: 'sum(i, 1, 3, x_i*y_i)',
          rules: ['collapse', 'expand', 'big-factor'],
          par: 1,
          bridge: 'Así se escribe un producto escalar $\\mathbf x\\cdot\\mathbf y$ (sector 04).',
        },
        {
          id: 'l06-f4',
          title: 'Restar una suma',
          brief: 'Simplifica: separa la primera suma y cancela.',
          start: 'sum(i, 1, n, x_i + y_i) - sum(i, 1, n, y_i)',
          goal: 'sum(i, 1, n, x_i)',
          rules: ['big-split', 'add-cancel', 'big-factor', 'neg-add'],
          par: 2,
          hints: ['Separa $\\sum_i(x_i+y_i)$ en dos sumas.'],
        },
      ],
    },
    { kind: 'codex', entry: 'w01-sumas' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-sumas',
    world: 'foundations',
    level: 'w01-l06',
    title: 'Sumatorias',
    summary: '$\\sum$ recorre un índice y acumula; el índice sumado es mudo y desaparece del resultado.',
    blocks: [
      { label: 'Definición', tex: '\\sum_{i=1}^{n}x_i:=x_1+\\cdots+x_n,\\qquad \\sum_{i=1}^{0}x_i:=0' },
      { label: 'Índice mudo', tex: '\\sum_i x_i=\\sum_k x_k' },
      { label: 'Linealidad', tex: '\\sum_i(a\\,x_i+b)=a\\sum_i x_i+nb,\\qquad \\sum_i(x_i+y_i)=\\sum_i x_i+\\sum_i y_i' },
      { label: 'Constantes', tex: '\\sum_{i=1}^{n}c=nc' },
      { label: 'Productos', tex: '\\sum_i x_iy_i\\neq\\Big(\\sum_i x_i\\Big)\\Big(\\sum_i y_i\\Big)\\ \\text{en general}' },
      { label: 'Dobles sumas', tex: '\\sum_i\\sum_j a_{ij}=\\sum_j\\sum_i a_{ij},\\qquad b_j=\\sum_i a_{ij}\\ (j\\ \\text{libre})' },
    ],
    pitfalls: ['Sacar fuera de $\\sum$ algo que depende del índice.', 'Separar productos como si fueran sumas.', 'Olvidar qué índice queda libre en una suma parcial.'],
    aif: [
      { tex: 'p(x)=\\sum_\\theta p(x\\mid\\theta)P(\\theta)', text: 'Evidencia como suma sobre hipótesis (guía G06).' },
      { tex: 'F=\\sum_s q(s)\\big[\\ln q(s)-\\ln p(o,s)\\big]', text: 'Energía libre discreta.' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'sum', world: 'foundations', tex: '\\textstyle\\sum', name: 'Sumatoria', read: 'suma de', meaning: '$\\sum_{i=a}^{b}$: recorre $i$ de $a$ a $b$ y acumula sumando. El índice es mudo.', warn: '$\\Sigma$ en negrita o sin índices suele ser una **matriz de covarianza**.', aif: 'Normalización, evidencia $p(o)=\\sum_s p(o,s)$, energía libre.' },
];
