import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, fmt, lerp } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { lagged } from '../../../engine/rate';
import { Group, Html, Stage, plane } from '../../../engine/Stage';
import { Arrow, Axes, Curve, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { pick, rng } from '../shared/rng';

// ============================================================================
// 1.4 · FUNCIONES — máquinas tipadas
// demo: machine x ↦ f(x); arrow diagram with image ⊂ codomain; one input ↦ one output
//       (prediction); graph + vertical-line test; parameters; likelihood role swap
//       (drag θ to the max: gate); L(θ) is not a density in θ (prediction); functional F[q]
// challenges: wire arrow diagrams for a rule; maximize a likelihood by turning θ
// ============================================================================

// ---------------------------------------------------------------- demo scene
function FunctionsDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const rev2 = useTween(beat > 2 || (beat === 2 && answer !== null) ? 1 : 0, 1);
  const rev6 = useTween(beat > 6 || (beat === 6 && answer !== null) ? 1 : 0, 1.2);
  const [theta, setTheta] = useState(0.35);
  const P = plane([0, 1], [0, 0.13], { x: 380, y: 120, w: 840, h: 520 });
  const onDrag = useSvgDrag(svg, (x) => {
    if (beat !== 5) return;
    let t = clamp(P.inv(x, 0)[0], 0, 1);
    if (Math.abs(t - 0.75) < 0.03) {
      t = 0.75;
      unlock();
    }
    setTheta(t);
  });
  const th = beat === 5 ? theta : beat > 5 ? 0.75 : 0.35;
  const L = (t: number) => t ** 3 * (1 - t);

  const machineV = at(0) * (1 - at(1));
  const mapV = at(1) * (1 - at(3));
  const graphV = at(3) * (1 - at(4));
  const paramV = at(4) * (1 - at(5));
  const likV = at(5) * (1 - at(7));
  const funcV = at(7);
  const tok = lerp(0, 1, at(0));

  const dom = [1, 2, 3];
  const cod = ['a', 'b', 'c', 'd'];
  const map = [0, 2, 0];
  const dy = (i: number) => 260 + i * 140;
  const cy = (j: number) => 220 + j * 120;
  const G = plane([-2.2, 2.2], [-1.6, 4.4], { x: 500, y: 90, w: 600, h: 620 });
  const sweep = lerp(-2, 2, at(3));

  return (
    <Stage ref={svg}>
      {/* machine */}
      <Group opacity={machineV}>
        <rect x={680} y={330} width={240} height={160} rx={16} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={3} />
        <Html x={800} y={410} size={44} color={C.blue}>
          <Tex tex="f" />
        </Html>
        <Html x={800} y={530} size={26} color={C.muted}>
          <Tex tex="f(x)=2x+1" />
        </Html>
        <Dot x={lerp(420, 640, Math.min(1, tok * 2))} y={410} r={20} color={C.cyan} opacity={tok < 0.55 ? 1 : 0} />
        <Html x={lerp(420, 640, Math.min(1, tok * 2))} y={360} size={26} color={C.cyan} opacity={tok < 0.55 ? 1 : 0}>
          <Tex tex="x=1" />
        </Html>
        <Dot x={lerp(960, 1180, Math.max(0, tok * 2 - 1))} y={410} r={20} color={C.amber} opacity={tok > 0.5 ? 1 : 0} />
        <Html x={lerp(960, 1180, Math.max(0, tok * 2 - 1))} y={360} size={26} color={C.amber} opacity={tok > 0.5 ? 1 : 0}>
          <Tex tex="f(1)=3" />
        </Html>
      </Group>
      {/* arrow diagram */}
      <Group opacity={mapV}>
        <rect x={420} y={180} width={180} height={420} rx={60} fill="none" stroke={C.cyan} strokeWidth={2} />
        <rect x={1000} y={160} width={180} height={480} rx={60} fill="none" stroke={C.amber} strokeWidth={2} />
        <Html x={510} y={150} size={26} color={C.cyan}>
          <Tex tex="D" />
        </Html>
        <Html x={1090} y={130} size={26} color={C.amber}>
          <Tex tex="C" />
        </Html>
        {dom.map((d, i) => (
          <g key={d}>
            <Dot x={510} y={dy(i)} r={12} color={C.cyan} />
            <Html x={470} y={dy(i)} size={24} color={C.cyan}>
              <Tex tex={String(d)} />
            </Html>
            <Arrow from={[525, dy(i)]} to={[1075, cy(map[i])]} color={C.text} width={2.5} progress={lagged(at(1), i, 3, 0.4)} />
          </g>
        ))}
        {cod.map((c, j) => {
          const inImg = map.includes(j);
          return (
            <g key={c}>
              <Dot x={1090} y={cy(j)} r={12} color={inImg ? C.amber : C.dim} />
              <Html x={1130} y={cy(j)} size={24} color={inImg ? C.amber : C.dim}>
                <Tex tex={c} />
              </Html>
            </g>
          );
        })}
        <Group opacity={rev2}>
          <Arrow from={[525, dy(1)]} to={[1075, cy(3)]} color={C.red} width={2.5} dashed />
          <Html x={800} y={660} size={24} color={C.red}>
            <Tex tex="\text{dos salidas para } 2:\ \text{no es función}" />
          </Html>
        </Group>
        <Html x={800} y={720} size={26} color={C.text} opacity={beat >= 1 ? 1 : 0}>
          <Tex tex="\mathrm{Im}(f)=\{a,c\}\subseteq C=\{a,b,c,d\}" />
        </Html>
      </Group>
      {/* graph + vertical line test */}
      <Group opacity={graphV}>
        <Axes P={G} xTicks={[-2, -1, 1, 2]} yTicks={[1, 2, 3, 4]} />
        <Curve P={G} f={(x) => x * x} a={-2.1} b={2.1} color={C.amber} width={4} />
        <Line a={G.pt(sweep, -1.6)} b={G.pt(sweep, 4.4)} color={C.cyan} width={2} dashed />
        <Dot x={G.x(sweep)} y={G.y(sweep * sweep)} r={10} color={C.cyan} />
        <Html x={1250} y={300} size={28} color={C.text}>
          <Tex tex="\{(x,f(x)):\ x\in D\}" />
        </Html>
        <Html x={1250} y={360} size={22} color={C.muted}>
          <span>cada vertical corta una sola vez</span>
        </Html>
      </Group>
      {/* parameters: Bernoulli */}
      <Group opacity={paramV}>
        <rect x={640} y={250} width={320} height={160} rx={16} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={3} />
        <Html x={800} y={330} size={30} color={C.blue}>
          <Tex tex="p(x\mid\theta)" />
        </Html>
        <circle cx={800} cy={250} r={26} fill={C.panel} stroke={C.magenta} strokeWidth={3} />
        <Line a={[800, 250]} b={[800 + 20 * Math.cos(-Math.PI / 2 + 0.7 * 2 * Math.PI), 250 + 20 * Math.sin(-Math.PI / 2 + 0.7 * 2 * Math.PI)]} color={C.magenta} width={3} />
        <Html x={800} y={200} size={24} color={C.magenta}>
          <Tex tex="\theta=0.7" />
        </Html>
        {[
          { x: 0, p: 0.3 },
          { x: 1, p: 0.7 },
        ].map((b, i) => (
          <g key={i}>
            <rect x={690 + i * 160} y={680 - b.p * 220} width={60} height={b.p * 220} fill={C.violet} opacity={0.8} />
            <Html x={720 + i * 160} y={705} size={22} color={C.cyan}>
              <Tex tex={`x=${b.x}`} />
            </Html>
            <Html x={720 + i * 160} y={680 - b.p * 220 - 22} size={20} color={C.violet}>
              <Tex tex={fmt(b.p, 1)} />
            </Html>
          </g>
        ))}
        <Html x={1200} y={560} size={24} color={C.text}>
          <Tex tex="\textstyle\sum_x p(x\mid\theta)=1" />
        </Html>
      </Group>
      {/* likelihood */}
      <Group opacity={likV}>
        <Axes P={P} xTicks={[0.25, 0.5, 0.75, 1]} yTicks={[0.05, 0.1]} xLabel="\theta" />
        <Curve P={P} f={L} a={0} b={1} color={C.magenta} width={4.5} />
        <Group opacity={rev6}>
          <path
            d={`M${P.x(0)} ${P.y(0)} ${Array.from({ length: 51 }, (_, i) => `L${P.x(i / 50)} ${P.y(L(i / 50))}`).join(' ')} L${P.x(1)} ${P.y(0)} Z`}
            fill={C.magenta}
            opacity={0.15}
          />
          <Html x={P.x(0.45)} y={P.y(0.03)} size={24} color={C.magenta}>
            <Tex tex="\text{área}=0.05\neq1" />
          </Html>
        </Group>
        <Line a={P.pt(th, 0)} b={P.pt(th, L(th))} color={C.text} width={2} dashed />
        <g style={{ cursor: beat === 5 ? 'ew-resize' : undefined }} onPointerDown={beat === 5 ? onDrag : undefined}>
          <rect x={P.x(0)} y={P.y(0.13)} width={P.box.w} height={P.box.h} fill="transparent" />
          <Dot x={P.x(th)} y={P.y(L(th))} r={13} color={Math.abs(th - 0.75) < 1e-9 ? C.green : C.text} ring={beat === 5} />
        </g>
        <Html x={P.x(0.25)} y={P.y(0.115)} size={26} color={C.text}>
          <Tex tex={`\\theta=${fmt(th, 2)},\\ L(\\theta)=${fmt(L(th), 4)}`} />
        </Html>
      </Group>
      {/* functional */}
      <Group opacity={funcV}>
        {[0.5, 0.3, 0.2].map((q, i) => (
          <g key={i}>
            <rect x={380 + i * 90} y={600 - q * 400} width={64} height={q * 400} fill={C.violet} opacity={0.8} />
            <Html x={412 + i * 90} y={625} size={20} color={C.muted}>
              <Tex tex={`q(s_${i + 1})`} />
            </Html>
          </g>
        ))}
        <Arrow from={[680, 450]} to={[800, 450]} color={C.text} width={3} />
        <rect x={820} y={380} width={200} height={140} rx={16} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={3} />
        <Html x={920} y={450} size={36} color={C.blue}>
          <Tex tex="F[\cdot]" />
        </Html>
        <Arrow from={[1040, 450]} to={[1160, 450]} color={C.text} width={3} />
        <Html x={1260} y={450} size={34} color={C.amber}>
          <Tex tex="-1.03" />
        </Html>
        <Html x={800} y={700} size={26} color={C.text}>
          <Tex tex="F[q]=\textstyle\sum_s q(s)\ln q(s):\ \text{entra una función, sale un número}" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: wiring
interface Wiring {
  rule: string;
  dom: number[];
  cod: number[];
  f: (x: number) => number;
  note: string;
}
function wiring(seed: number, round: number): Wiring {
  const r = rng(seed);
  switch (round) {
    case 0: {
      const c = pick(r, [1, 2]);
      return { rule: `f(x)=x+${c}`, dom: [1, 2, 3], cod: [1, 2, 3, 4, 5], f: (x) => x + c, note: 'Cada entrada, una salida; hay valores del codominio que nadie alcanza.' };
    }
    case 1:
      return { rule: 'f(x)=x^2', dom: [-2, -1, 0, 1, 2], cod: [0, 1, 2, 3, 4], f: (x) => x * x, note: '$-2$ y $2$ van al mismo sitio: es función pero **no inyectiva**. Imagen $\\{0,1,4\\}$.' };
    case 2:
      return { rule: 'f(x)=|x-2|', dom: [0, 1, 2, 3, 4], cod: [0, 1, 2, 3], f: (x) => Math.abs(x - 2), note: 'El valor absoluto pliega la recta: imagen $\\{0,1,2\\}$.' };
    case 3: {
      const k = pick(r, [2, 3]);
      return { rule: `f(x)=x \\bmod ${k}`, dom: [1, 2, 3, 4, 5, 6], cod: Array.from({ length: k }, (_, i) => i), f: (x) => x % k, note: `El resto de dividir por ${k}: muchas entradas por salida.` };
    }
    default:
      return {
        rule: 'f(s)=\\arg\\max_o A_{os}',
        dom: [1, 2, 3],
        cod: [1, 2, 3],
        f: (s) => [0, 1, 3, 1][s],
        note: 'La observación más probable de cada estado (moda de cada **columna** de $\\mathbf A$). Los estados 1 y 3 comparten moda: invertir esta función sería ambiguo.',
      };
  }
}
// rows = observations, columns = states; each column sums to 1
const A_TABLE = [
  [0.6, 0.1, 0.5],
  [0.3, 0.2, 0.4],
  [0.1, 0.7, 0.1],
];

function Wiring({ seed, round, api }: ChallengeProps) {
  const w = useMemo(() => wiring(seed, round), [seed, round]);
  const [map, setMap] = useState<(number | null)[]>(() => w.dom.map(() => null));
  const [sel, setSel] = useState<number | null>(0);
  const dy = (i: number) => 450 + (i - (w.dom.length - 1) / 2) * 105;
  const cy = (j: number) => 450 + (j - (w.cod.length - 1) / 2) * 105;
  useEffect(() => {
    api.prompt(`Conecta cada entrada con su salida según $${w.rule}$: clic en una entrada (izquierda) y luego en su salida (derecha).`, w.rule);
    api.hints(['Una función asigna **exactamente una** salida a cada entrada del dominio.', `Calcula $f$ en cada punto: ${w.dom.map((d) => `$f(${d})=${w.f(d)}$`).join(', ')}.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);
  const submit = () => {
    const miss = map.findIndex((m) => m === null);
    if (miss >= 0) return api.result(false, `La entrada $${w.dom[miss]}$ no tiene flecha: una función debe asignar salida a **todo** el dominio.`);
    const bad = w.dom.findIndex((d, i) => w.cod[map[i]!] !== w.f(d));
    if (bad >= 0) return api.result(false, `$f(${w.dom[bad]})=${w.f(w.dom[bad])}$, no $${w.cod[map[bad]!]}$.`);
    const img = [...new Set(w.dom.map(w.f))].sort((a, b) => a - b);
    api.result(true, `Imagen $\\{${img.join(',')}\\}$. ${w.note}`);
  };
  return (
    <Stage>
      <Html x={800} y={130} size={34} color={C.text}>
        <Tex tex={w.rule} />
      </Html>
      {round === 4 && (
        <Html x={1380} y={300} size={18} color={C.muted}>
          <Tex tex={`\\mathbf A=\\begin{pmatrix}${A_TABLE.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}`} />
        </Html>
      )}
      {w.dom.map((d, i) => {
        const m = map[i];
        return m === null ? null : <Arrow key={'a' + i} from={[545, dy(i)]} to={[1035, cy(m)]} color={C.text} width={2.5} />;
      })}
      {w.dom.map((d, i) => (
        <g
          key={'d' + i}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            api.sfx.click();
            setSel(i);
          }}
        >
          <circle cx={520} cy={dy(i)} r={30} fill={sel === i ? C.cyan : C.panel} fillOpacity={sel === i ? 0.3 : 1} stroke={C.cyan} strokeWidth={sel === i ? 4 : 2} />
          <Html x={520} y={dy(i)} size={24} color={C.text}>
            <Tex tex={String(d)} />
          </Html>
        </g>
      ))}
      {w.cod.map((c, j) => (
        <g
          key={'c' + j}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (sel === null) return;
            api.sfx.snap();
            const next = map.slice();
            next[sel] = j;
            setMap(next);
            const free = next.findIndex((m) => m === null);
            setSel(free >= 0 ? free : null);
          }}
        >
          <circle cx={1060} cy={cy(j)} r={30} fill={C.panel} stroke={map.includes(j) ? C.amber : C.line} strokeWidth={map.includes(j) ? 3 : 2} />
          <Html x={1060} y={cy(j)} size={24} color={map.includes(j) ? C.amber : C.muted}>
            <Tex tex={String(c)} />
          </Html>
        </g>
      ))}
      <Html x={520} y={190} size={22} color={C.cyan}>
        <Tex tex="\text{dominio}" />
      </Html>
      <Html x={1060} y={190} size={22} color={C.amber}>
        <Tex tex="\text{codominio}" />
      </Html>
      <Html x={800} y={800} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: maximize likelihood
const DATA: [number, number][][] = [
  [[3, 4]],
  [[1, 4], [2, 5]],
  [[7, 10], [9, 20]],
  [[3, 5], [11, 20]],
];

function MaxLik({ seed, round, api }: ChallengeProps) {
  const [k, n] = useMemo(() => pick(rng(seed), DATA[Math.min(round, DATA.length - 1)]), [seed, round]);
  const svg = useRef<SVGSVGElement>(null);
  const L = (t: number) => t ** k * (1 - t) ** (n - k);
  const best = k / n;
  const Lmax = L(best);
  const P = plane([0, 1], [0, Lmax * 1.25], { x: 300, y: 130, w: 1000, h: 520 });
  const [t, setT] = useState(0.5);
  const onDrag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(P.inv(x, 0)[0], 0, 1) * 20) / 20;
    if (v !== t) api.sfx.tick();
    setT(v);
  });
  const pw = (b: string, e: number) => (e === 1 ? b : `${b}^{${e}}`);
  const Ltex = `${pw('\\theta', k)}${pw('(1-\\theta)', n - k)}`;
  useEffect(() => {
    api.prompt(
      `Datos fijos: ${k} éxitos en ${n} ensayos. Como función de $\\theta$, $L(\\theta)=${Ltex}$. Gira $\\theta$ hasta el **máximo** de la verosimilitud.`,
      `L(\\theta)=p(x_{1:${n}}\\mid\\theta)=${Ltex}`,
    );
    api.hints(['Sube por la curva hasta que deje de subir.', `Para este modelo el máximo está en la proporción observada: $\\theta^*=${k}/${n}=${fmt(best, 2)}$.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, n]);
  const submit = () => {
    if (Math.abs(t - best) < 1e-9) return api.result(true, `$\\theta^*=${fmt(best, 2)}=${k}/${n}$: el estimador de máxima verosimilitud. Mismo modelo, ahora leído como función del parámetro.`);
    api.result(false, `$L(${fmt(t, 2)})$ es menor que el máximo: ${t < best ? 'sube' : 'baja'} $\\theta$ (la curva aún ${t < best ? 'crece' : 'decrece'} hacia la derecha).`);
  };
  const yt = Lmax > 0.01 ? [Number(fmt(Lmax / 2, 3)), Number(fmt(Lmax, 3))] : [];
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[0.25, 0.5, 0.75, 1]} yTicks={yt} xLabel="\theta" tickLabels />
      <Curve P={P} f={L} a={0} b={1} color={C.magenta} width={4.5} />
      <Line a={P.pt(t, 0)} b={P.pt(t, L(t))} color={C.text} width={2} dashed />
      <g style={{ cursor: 'ew-resize' }} onPointerDown={onDrag}>
        <rect x={P.x(0)} y={P.y(Lmax * 1.25)} width={P.box.w} height={P.box.h} fill="transparent" />
        <Dot x={P.x(t)} y={P.y(L(t))} r={14} color={C.text} ring />
      </g>
      <Html x={P.x(t)} y={P.y(0) + 50} size={26} color={C.text}>
        <Tex tex={`\\theta=${fmt(t, 2)}`} />
      </Html>
      <Html x={1400} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-l04',
  world: 'foundations',
  code: '1.4',
  title: 'Funciones',
  subtitle: 'máquinas tipadas',
  glyph: 'f',
  kind: 'level',
  objective: 'Leer $f:D\\to C$: una salida por entrada, imagen vs codominio, parámetros $f(x;\\theta)$, y el cambio de rol que convierte un modelo en una **verosimilitud**.',
  glyphs: ['map', 'mapsto', 'image', 'param', 'functional'],
  codex: ['w01-funciones'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Mi modelo del mundo es una colección de **máquinas**: de estados a observaciones, de creencias a acciones.',
        'Una función tiene un tipo —qué entra, qué sale— y una regla. Sus **parámetros** son perillas que se fijan antes de usarla.',
        'Y la misma fórmula puede leerse de dos maneras: como modelo de los datos, o como verosimilitud de los parámetros.',
      ],
    },
    {
      kind: 'demo',
      title: 'Máquinas',
      Scene: FunctionsDemo,
      beats: [
        { say: 'Una función es una máquina: entra un valor del **dominio**, sale uno del **codominio**.', tex: 'f\\g{map}{:D\\to C},\\qquad x\\g{mapsto}{\\mapsto}2x+1', dur: 2.2 },
        { say: 'En un diagrama de flechas, la **imagen** es lo que efectivamente se alcanza. Puede ser menor que el codominio.', tex: '\\g{image}{\\mathrm{Im}(f)}\\subseteq C', dur: 2 },
        {
          say: '¿Puede una entrada tener dos salidas?',
          tex: '2\\mapsto c\\ \\text{y}\\ 2\\mapsto d\\ ?',
          ask: {
            prompt: 'Si la entrada 2 tuviera flechas hacia $c$ y hacia $d$, ¿seguiría siendo una función?',
            options: ['No: cada entrada tiene exactamente una salida', 'Sí', 'Solo si $c=d$ en valor'],
            answer: 0,
            explain: 'Una función asigna **una** salida a cada entrada. Lo contrario está permitido: varias entradas pueden compartir salida (como $1$ y $3\\mapsto a$).',
          },
        },
        { say: 'El grafo de $f$ es el conjunto de pares $(x,f(x))$. Prueba de la recta vertical: cada vertical lo corta **una** vez.', tex: '\\{(x,f(x)):x\\in D\\}', dur: 2.8 },
        { say: 'Un **parámetro** se fija antes de usar la máquina. Con $\\theta=0.7$, el modelo reparte probabilidad entre $x=0$ y $x=1$.', tex: '\\g{param}{p(x\\mid\\theta)}=\\theta^{x}(1-\\theta)^{1-x}', dur: 2 },
        {
          say: 'Ahora fijemos los **datos**: 3 éxitos en 4 ensayos. La misma fórmula es una función de $\\theta$: la **verosimilitud**.',
          tex: 'L(\\theta):=p(x_{1:4}\\mid\\theta)=\\theta^{3}(1-\\theta)',
          gate: 'Arrastra $\\theta$ hasta el **máximo** de $L$.',
        },
        {
          say: '¿Es $L(\\theta)$ una distribución sobre $\\theta$?',
          tex: 'L(\\theta)=\\theta^{3}(1-\\theta)',
          ask: {
            prompt: 'Con los datos fijos, ¿es $L(\\theta)$ una distribución de probabilidad sobre $\\theta$?',
            options: ['No: no tiene por qué normalizar en $\\theta$', 'Sí, siempre', 'Solo con muchos datos'],
            answer: 0,
            explain: '$p(x\\mid\\theta)$ normaliza en $x$, no en $\\theta$. Aquí el área bajo $L$ es $0.05$. Para obtener una distribución sobre $\\theta$ hace falta Bayes (sector 10).',
          },
        },
        { say: 'Un **funcional** recibe una función entera y devuelve un número. Corchetes en vez de paréntesis.', tex: '\\g{functional}{F[q]}=\\textstyle\\sum_s q(s)\\ln q(s)', dur: 2 },
      ],
    },
    { kind: 'challenge', title: 'Cableado', Comp: Wiring, rounds: 5 },
    { kind: 'challenge', title: 'Máxima verosimilitud', Comp: MaxLik, rounds: 4 },
    { kind: 'codex', entry: 'w01-funciones' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-funciones',
    world: 'foundations',
    level: 'w01-l04',
    title: 'Funciones',
    summary: 'Una función asigna exactamente una salida a cada entrada permitida; los parámetros se fijan antes de usarla.',
    blocks: [
      { label: 'Tipo y regla', tex: 'f:D\\to C,\\qquad x\\mapsto f(x)' },
      { label: 'Imagen', tex: '\\mathrm{Im}(f):=\\{f(x):x\\in D\\}\\subseteq C' },
      { label: 'Grafo', tex: '\\{(x,f(x)):x\\in D\\}\\subseteq D\\times C', body: 'Cada vertical corta el grafo a lo sumo una vez.' },
      { label: 'Monotonía', tex: 'a<b\\Rightarrow f(a)<f(b)\\ \\ (\\text{creciente})', body: 'Una función creciente conserva el orden (y la posición del máximo).' },
      { label: 'Parámetros', tex: 'f(x;\\theta),\\qquad p(x\\mid\\theta)', body: 'Tras «;» o «|» van cantidades fijadas.' },
      {
        label: 'Verosimilitud',
        tex: 'L(\\theta):=p(x\\mid\\theta)\\ \\text{con } x \\text{ fijo}',
        body: 'Función de $\\theta$; no tiene por qué normalizar en $\\theta$.',
      },
      { label: 'Funcional', tex: 'F[q]', body: 'Entra una función entera, sale un número.' },
    ],
    pitfalls: [
      'Creer que $f(x)$ es la función: es su valor en $x$.',
      'Confundir codominio con imagen.',
      'Confundir argumento con parámetro; leer $L(\\theta)$ como densidad sobre $\\theta$.',
    ],
    aif: [
      { tex: 'L(\\theta;x):=p(x\\mid\\theta)', text: 'Con $x$ fijo, función de $\\theta$ que no integra 1 (guía G06).' },
      { tex: 'F[q]', text: 'La energía libre es un funcional: recibe una creencia $q$ y devuelve un número (guía G08).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'map', world: 'foundations', tex: 'f:D\\to C', name: 'Tipo de una función', read: 'efe de de en ce', meaning: '$f$ toma valores de $D$ (dominio) y los lleva a $C$ (codominio).' },
  { id: 'mapsto', world: 'foundations', tex: '\\mapsto', name: 'Se asigna a', read: 'va a', meaning: '$x\\mapsto f(x)$: regla que dice a dónde va cada entrada.', warn: 'No confundir con $\\to$, que va entre conjuntos.' },
  { id: 'image', world: 'foundations', tex: '\\mathrm{Im}(f)', name: 'Imagen', read: 'imagen de efe', meaning: 'Conjunto de valores que $f$ alcanza efectivamente.' },
  { id: 'param', world: 'foundations', tex: 'f(x;\\theta)', name: 'Parámetro', read: 'efe de equis con parámetro theta', meaning: 'Tras «;» (o «|» en probabilidad) van cantidades fijadas, no variables de la función.' },
  { id: 'functional', world: 'foundations', tex: 'F[q]', name: 'Funcional', read: 'efe de q', meaning: 'Recibe una función entera y devuelve un número. Corchetes en vez de paréntesis.', aif: 'Energía libre $F[q]$.' },
];
