import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Dot } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { pick, rng } from '../shared/rng';

// ============================================================================
// 1.7 · PRODUCTOS — ∏ y encogimiento
// demo: multiplicative accumulator, 0.9^k vs 0.5^k vanishing, empty product (prediction),
//       zero annihilates, c^n and n!, ∏(x+y) ≠ ∏x+∏y (prediction), regrouping, AIF
// challenge: estimate orders of magnitude of products; forge: ∏ identities
// ============================================================================

const sci = (v: number) => {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -2) return fmt(v, 4);
  const m = v / 10 ** e;
  return `${fmt(m, 1)}\\times10^{${e}}`;
};

// ---------------------------------------------------------------- demo scene
function ProdDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1);
  const rev5 = useTween(beat > 5 || (beat === 5 && answer !== null) ? 1 : 0, 1);
  const U = 200;
  const accV = (beat === 0 || beat === 3 ? 1 : 0) * (1 - 0);
  const factors = beat === 3 ? [2, 0, 3, 5] : [2, 0.5, 3];
  const prog = beat === 0 ? at(0) : beat === 3 ? at(3) : 1;
  const steps = Math.floor(prog * factors.length + 1e-9);
  const val = factors.slice(0, steps).reduce((a, b) => a * b, 1);
  const shown = useTween(val, 0.4);
  const k = Math.round((beat === 1 ? at(1) : beat > 1 ? 1 : 0) * 50);

  return (
    <Stage>
      {/* accumulator */}
      <Group opacity={accV}>
        <Html x={800} y={180} size={34} color={C.text}>
          <Tex tex={beat === 3 ? '\\prod x_i=2\\cdot0\\cdot3\\cdot5' : '\\prod_{i=1}^{3}x_i=2\\cdot0.5\\cdot3'} />
        </Html>
        {factors.map((f, i) => (
          <g key={i}>
            <circle cx={560 + i * 160} cy={290} r={40} fill={i < steps ? C.blue : C.panel} fillOpacity={i < steps ? 0.25 : 1} stroke={C.blue} strokeWidth={2.5} />
            <Html x={560 + i * 160} y={290} size={28} color={C.text}>
              <Tex tex={`\\times${f}`} />
            </Html>
          </g>
        ))}
        <rect x={300} y={430} width={Math.max(2, shown * U)} height={60} fill={shown === 0 ? C.red : C.violet} opacity={0.8} rx={4} />
        <line x1={300 + U} x2={300 + U} y1={410} y2={510} stroke={C.dim} strokeWidth={2} strokeDasharray="5 5" />
        <Html x={300 + U} y={540} size={20} color={C.muted}>
          <Tex tex="1" />
        </Html>
        <Html x={300 + Math.max(2, shown * U) + 20} y={460} size={32} color={C.violet} anchor="left">
          <Tex tex={fmt(shown, 2)} />
        </Html>
      </Group>
      {/* shrinking */}
      <Group opacity={beat === 1 || beat === 2 ? 1 : 0}>
        <Html x={800} y={150} size={32} color={C.text}>
          <Tex tex={`k=${k}`} />
        </Html>
        {[0.9, 0.5].map((p, i) => {
          const v = p ** k;
          return (
            <g key={p}>
              <Html x={260} y={300 + i * 170} size={28} color={C.text} anchor="right">
                <Tex tex={`${p}^{k}`} />
              </Html>
              <rect x={300} y={270 + i * 170} width={Math.max(1, v * 1000)} height={56} fill={i ? C.magenta : C.amber} opacity={0.85} rx={3} />
              <Html x={330 + Math.max(1, v * 1000)} y={298 + i * 170} size={26} color={i ? C.magenta : C.amber} anchor="left">
                <Tex tex={sci(v)} />
              </Html>
            </g>
          );
        })}
        <Html x={800} y={680} size={24} color={C.red} opacity={k > 40 ? 1 : 0}>
          <Tex tex="\text{con }10^3\text{ factores }0.5:\ 0.5^{1000}\approx10^{-301}\ \text{— al borde del subdesborde de un computador}" />
        </Html>
        <Group opacity={rev2}>
          <rect x={300} y={590} width={200} height={50} fill={C.green} opacity={0.6} rx={4} />
          <Html x={520} y={615} size={26} color={C.green} anchor="left">
            <Tex tex="\prod_{i=1}^{0}x_i=1\quad(\text{el acumulador empieza en }1)" />
          </Html>
        </Group>
      </Group>
      {/* c^n, n! */}
      <Group opacity={beat === 4 ? at(4) : 0}>
        <Html x={800} y={300} size={36} color={C.text}>
          <Tex tex="\prod_{i=1}^{n}c=c^{n}" />
        </Html>
        <Html x={800} y={420} size={36} color={C.text}>
          <Tex tex="n!:=\prod_{i=1}^{n}i=1\cdot2\cdots n,\qquad 5!=120" />
        </Html>
      </Group>
      {/* ∏(x+y) */}
      <Group opacity={beat === 5 || beat === 6 ? 1 : 0}>
        <Html x={800} y={260} size={32} color={C.text}>
          <Tex tex={beat === 6 ? '\\prod_i x_iy_i=(x_1y_1)(x_2y_2)=(x_1x_2)(y_1y_2)=\\prod_i x_i\\prod_i y_i' : '\\prod_i(x_i+y_i)\\ \\overset{?}{=}\\ \\prod_i x_i+\\prod_i y_i'} />
        </Html>
        <Group opacity={beat === 5 ? rev5 : 0}>
          <Html x={800} y={420} size={30} color={C.red}>
            <Tex tex="\mathbf x=(1,2),\ \mathbf y=(3,4):\ \ (1+3)(2+4)=24\ \neq\ 1\cdot2+3\cdot4=14" />
          </Html>
        </Group>
        {beat === 6 &&
          ['x_1', 'y_1', 'x_2', 'y_2'].map((t, i) => {
            const target = t.startsWith('x') ? (t === 'x_1' ? 0 : 1) : t === 'y_1' ? 2 : 3;
            const x = 560 + (i + (target - i) * at(6)) * 140;
            return (
              <g key={t}>
                <circle cx={x} cy={480} r={40} fill={C.panel} stroke={t.startsWith('x') ? C.cyan : C.amber} strokeWidth={2.5} />
                <Html x={x} y={480} size={26} color={t.startsWith('x') ? C.cyan : C.amber}>
                  <Tex tex={t} />
                </Html>
              </g>
            );
          })}
      </Group>
      {/* AIF */}
      <Group opacity={at(7)}>
        <Html x={800} y={300} size={34} color={C.text}>
          <Tex tex="p(x_{1:N}\mid\theta)=\prod_{i=1}^{N}p(x_i\mid\theta)" />
        </Html>
        <Html x={800} y={420} size={30} color={C.text}>
          <Tex tex="\mathrm{Dir}(\mathbf p\mid\boldsymbol\alpha)\propto\prod_i p_i^{\alpha_i-1}" />
        </Html>
        <Html x={800} y={540} size={26} color={C.amber}>
          <Tex tex="\text{muchos factores en }(0,1)\Rightarrow\text{se trabaja con }\ln\ (1.11)" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge: orders of magnitude
interface MagCase {
  tex: string;
  value: number;
  hint: string;
}
function magCase(seed: number, round: number): MagCase {
  const r = rng(seed);
  switch (round) {
    case 0: {
      const k = pick(r, [10, 20]);
      return { tex: `0.5^{${k}}`, value: 0.5 ** k, hint: `Cada factor $0.5$ quita $\\approx0.30$ dígitos: $${k}\\times0.30\\approx${fmt(k * 0.301, 1)}$.` };
    }
    case 1: {
      const k = pick(r, [20, 50]);
      return { tex: `0.9^{${k}}`, value: 0.9 ** k, hint: `Cada factor $0.9$ quita solo $\\approx0.046$ dígitos: $${k}\\times0.046\\approx${fmt(k * 0.0458, 1)}$.` };
    }
    case 2: {
      const k = pick(r, [3, 5]);
      return { tex: `0.1^{${k}}\\cdot0.5`, value: 0.1 ** k * 0.5, hint: `$0.1^{${k}}=10^{-${k}}$, y el $0.5$ lo reduce un poco más.` };
    }
    case 3:
      return pick(r, [
        { tex: '0.8\\cdot0.9\\cdot0\\cdot0.7', value: 0, hint: 'Hay un factor cero.' },
        { tex: '\\prod_{i=1}^{4}(0.5-0.125\\,i)', value: 0, hint: 'Evalúa el factor con $i=4$.' },
      ]);
    default:
      return pick(r, [
        { tex: '0.2^{10}', value: 0.2 ** 10, hint: 'Cada $0.2$ quita $\\approx0.70$ dígitos.' },
        { tex: '0.99^{100}', value: 0.99 ** 100, hint: 'Factores muy cercanos a 1 apenas encogen: $100\\times0.0044\\approx0.44$ dígitos.' },
      ]);
  }
}

function Magnitude({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => magCase(seed, round), [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  const [e, setE] = useState<number | 'zero'>(-1);
  const X = (k: number) => 1380 - (-k) * 58; // k ∈ [-20, 0]
  const onDrag = useSvgDrag(svg, (x) => {
    const k = Math.round(clamp((x - 1380) / 58, -20, 0));
    if (k !== e) api.sfx.tick();
    setE(k);
  });
  useEffect(() => {
    api.prompt(`¿De qué orden de magnitud es $${cs.tex}$? Arrastra el marcador a la potencia de 10 más cercana (o marca «cero exacto»).`, cs.tex);
    api.hints(['Cuenta cuántos dígitos quita cada factor: $\\log_{10}$ de un producto es la suma de los $\\log_{10}$.', cs.hint]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const submit = () => {
    if (cs.value === 0) {
      if (e === 'zero') return api.result(true, `$${cs.tex}=0$: un solo factor nulo anula todo el producto.`);
      return api.result(false, `Revisa los factores: uno de ellos es $0$, así que el producto es exactamente $0$.`);
    }
    if (e === 'zero') return api.result(false, `Ningún factor es cero: el producto es pequeño ($${sci(cs.value)}$) pero no nulo.`);
    const l = Math.log10(cs.value);
    if (e === Math.round(l) || e === Math.floor(l)) return api.result(true, `$${cs.tex}=${sci(cs.value)}$, orden $10^{${Math.round(l)}}$.`);
    api.result(false, `Marcaste $10^{${e}}$; el valor es $${sci(cs.value)}$, orden $10^{${Math.round(l)}}$.`);
  };
  return (
    <Stage ref={svg}>
      <Html x={800} y={160} size={52} color={C.text}>
        <Tex tex={cs.tex} />
      </Html>
      <line x1={X(-20)} x2={X(0)} y1={480} y2={480} stroke={C.violet} strokeWidth={3} />
      {Array.from({ length: 21 }, (_, i) => -i).map((k) => (
        <g key={k}>
          <line x1={X(k)} x2={X(k)} y1={468} y2={492} stroke={C.violet} strokeWidth={2} />
          {k % 2 === 0 && (
            <Html x={X(k)} y={525} size={18} color={C.muted}>
              <Tex tex={`10^{${k}}`} />
            </Html>
          )}
        </g>
      ))}
      <g onPointerDown={onDrag} style={{ cursor: 'ew-resize' }}>
        <rect x={X(-20) - 30} y={420} width={X(0) - X(-20) + 60} height={120} fill="transparent" />
        {e !== 'zero' && <Dot x={X(e)} y={480} r={16} color={C.amber} ring />}
      </g>
      {e !== 'zero' && (
        <Html x={X(e)} y={420} size={28} color={C.amber}>
          <Tex tex={`10^{${e}}`} />
        </Html>
      )}
      <Html x={800} y={680} size={22} interactive>
        <div style={{ display: 'flex', gap: '0.6em' }}>
          <button className={`stage-btn ${e === 'zero' ? 'on' : ''}`} onClick={() => setE('zero')}>
            cero exacto
          </button>
          <button className="stage-btn on" onClick={submit}>
            Fijar ▸
          </button>
        </div>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l07',
  world: 'foundations',
  code: '1.7',
  title: 'Productos',
  subtitle: '∏ y encogimiento',
  glyph: '\\textstyle\\prod',
  kind: 'level',
  objective: 'Leer $\\prod$ como acumulador multiplicativo (vacío $=1$, un cero anula todo), reagrupar factores y estimar cuánto encoge un producto de probabilidades.',
  glyphs: ['prod', 'factorial'],
  codex: ['w01-productos'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Datos independientes se combinan **multiplicando** sus probabilidades. Con cien datos, cien factores menores que 1.',
        '$\\prod$ es el bucle multiplicativo. Entender cuánto encoge un producto es entender por qué todo el libro trabaja en escala logarítmica.',
      ],
    },
    {
      kind: 'demo',
      title: 'Acumulador multiplicativo',
      Scene: ProdDemo,
      beats: [
        { say: '$\\prod$ recorre el índice y **multiplica**. El acumulador arranca en $1$, el neutro de la multiplicación.', tex: '\\g{prod}{\\prod}_{i=1}^{3}x_i=2\\cdot0.5\\cdot3=3', dur: 3 },
        { say: 'Factores en $(0,1)$ encogen el producto, y cuanto más pequeños, más rápido: $0.5^{50}$ ya es del orden de $10^{-15}$.', tex: '0.9^{50}\\approx0.005,\\qquad 0.5^{50}\\approx8.9\\times10^{-16}', dur: 3.2 },
        {
          say: 'Un caso límite.',
          tex: '\\prod_{i=1}^{0}x_i=\\;?',
          ask: {
            prompt: '¿Cuánto vale el producto vacío $\\prod_{i=1}^{0}x_i$?',
            options: ['$1$', '$0$', 'No está definido'],
            answer: 0,
            explain: 'Sin factores, el acumulador no se toca: queda en $1$. Igual que la suma vacía es $0$. Así $\\prod_{i=1}^{n+1}=\\big(\\prod_{i=1}^{n}\\big)x_{n+1}$ vale también para $n=0$.',
          },
        },
        { say: 'Un solo factor nulo anula el producto entero, y ya no se recupera. Una verosimilitud cero en un dato descarta la hipótesis.', tex: '\\exists i:\\ x_i=0\\ \\Rightarrow\\ \\prod_i x_i=0', dur: 3 },
        { say: 'Factores repetidos son potencias; el factorial multiplica los primeros $n$ enteros.', tex: '\\prod_{i=1}^{n}c=c^{n},\\qquad \\g{factorial}{n!}=\\prod_{i=1}^{n}i', dur: 1.8 },
        {
          say: '¿Se reparte $\\prod$ sobre sumas?',
          tex: '\\prod_i(x_i+y_i)\\ \\overset{?}{=}\\ \\prod_i x_i+\\prod_i y_i',
          ask: {
            prompt: '¿Vale $\\prod_i(x_i+y_i)=\\prod_i x_i+\\prod_i y_i$?',
            options: ['No en general', 'Sí', 'Solo si los términos son positivos'],
            answer: 0,
            explain: 'Con $\\mathbf x=(1,2)$, $\\mathbf y=(3,4)$: $24\\neq14$. Al expandir aparecen todos los productos cruzados.',
          },
        },
        { say: 'Lo que sí vale: los factores se pueden **reagrupar**. Un producto de productos se separa.', tex: '\\prod_i x_iy_i=\\prod_i x_i\\,\\prod_i y_i', dur: 2.2 },
        { say: 'En el libro: la verosimilitud de datos independientes y el prior de Dirichlet son productos.', tex: 'p(x_{1:N}\\mid\\theta)=\\prod_{i=1}^{N}p(x_i\\mid\\theta)', dur: 2 },
      ],
    },
    { kind: 'challenge', title: 'Orden de magnitud', Comp: Magnitude, rounds: 5 },
    {
      kind: 'forge',
      title: 'Forja',
      puzzles: [
        {
          id: 'l07-f1',
          title: 'Constante repetida',
          brief: 'El factor 2 aparece en cada término: sácalo (con su potencia) y despliega.',
          start: 'prod(i, 1, 3, 2*x_i)',
          goal: '8*x_1*x_2*x_3',
          rules: ['big-factor', 'calc', 'expand', 'big-split'],
          par: 3,
          hints: ['En un producto, cada factor constante se repite: sale como $2^3$.', 'Calcula $2^3$ y despliega.'],
        },
        {
          id: 'l07-f2',
          title: 'Separar un producto',
          brief: 'Con límites simbólicos no puedes contar los factores constantes directamente: separa primero.',
          start: 'prod(i, 1, n, c*x_i)',
          goal: 'c^n * prod(i, 1, n, x_i)',
          rules: ['big-factor', 'big-split', 'big-const', 'expand'],
          par: 2,
          hints: ['$\\prod_i(c\\,x_i)=\\prod_i c\\cdot\\prod_i x_i$.', 'Y $\\prod_{i=1}^{n}c=c^n$.'],
          bridge: 'Por eso un factor común en todas las verosimilitudes aparece elevado a $N$.',
        },
      ],
    },
    { kind: 'codex', entry: 'w01-productos' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-productos',
    world: 'foundations',
    level: 'w01-l07',
    title: 'Productos',
    summary: '$\\prod$ acumula multiplicando; con factores en $(0,1)$ el resultado se desvanece rápidamente.',
    blocks: [
      { label: 'Definición', tex: '\\prod_{i=1}^{n}x_i:=x_1\\cdots x_n,\\qquad \\prod_{i=1}^{0}x_i:=1' },
      { label: 'Constantes y factorial', tex: '\\prod_{i=1}^{n}c=c^{n},\\qquad n!:=\\prod_{i=1}^{n}i' },
      { label: 'Reagrupar', tex: '\\prod_i x_iy_i=\\prod_i x_i\\prod_i y_i' },
      { label: 'Cero', tex: '\\exists i:\\ x_i=0\\Rightarrow\\prod_i x_i=0' },
      { label: 'Encogimiento', tex: '0<p<1:\\ p^{n}\\to0', body: 'Un producto de muchas probabilidades cae por debajo de la precisión numérica: de ahí el uso de logaritmos (1.11).' },
    ],
    pitfalls: ['$\\prod(x_i+y_i)\\neq\\prod x_i+\\prod y_i$.', 'Confundir $\\prod$ (producto) con $\\Pi$ (matriz de precisión).', 'Olvidar que el producto vacío vale 1.'],
    aif: [
      { tex: 'p(x_{1:N}\\mid\\theta)=\\prod_i p(x_i\\mid\\theta)', text: 'Datos condicionalmente independientes (guía G06).' },
      { tex: 'p(x,z)=p(x\\mid z)\\,p(z)', text: 'Toda conjunta se factoriza como producto (guía G09).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'prod', world: 'foundations', tex: '\\textstyle\\prod', name: 'Productoria', read: 'producto de', meaning: '$\\prod_{i=a}^{b}$: recorre $i$ y multiplica. Producto vacío $=1$.', warn: '$\\Pi$ (pi mayúscula, sin índices) suele ser una **matriz de precisión**.', aif: 'Verosimilitud de datos independientes.' },
  { id: 'factorial', world: 'foundations', tex: 'n!', name: 'Factorial', read: 'ene factorial', meaning: '$n!=1\\cdot2\\cdots n$; $0!=1$.' },
];
