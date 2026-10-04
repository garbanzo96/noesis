import { useEffect, useMemo, useState } from 'react';
import { fmt, lerp } from '../../../engine/anim';
import { useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Arrow, Dot } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, DemoProps, Glyph, LevelSpec } from '../../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';

// ============================================================================
// 1.5 · COMPOSICIÓN E INVERSA — encadenar y desandar
// demo: g∘f as a pipeline (right acts first), order matters (prediction), inverse in reverse
//       order (gate: choose the undo order), x² loses the sign, f⁻¹ ≠ 1/f (prediction),
//       generation vs inference, softmax = N∘exp
// challenges: assembly line to hit a target; rewind a chain with inverse blocks
// ============================================================================

interface Block {
  id: string;
  tex: string;
  f: (x: number) => number;
}
const BLOCKS: Block[] = [
  { id: 'x2', tex: '\\times2', f: (x) => 2 * x },
  { id: 'p1', tex: '+1', f: (x) => x + 1 },
  { id: 'm3', tex: '-3', f: (x) => x - 3 },
  { id: 'sq', tex: '(\\cdot)^2', f: (x) => x * x },
  { id: 'h', tex: '\\div2', f: (x) => x / 2 },
  { id: 'neg', tex: '\\times(-1)', f: (x) => -x },
];
const BY = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
interface InvBlock {
  id: string;
  tex: string;
  g: (xs: number[]) => number[];
}
const INV: InvBlock[] = [
  { id: 'h', tex: '\\div2', g: (xs) => xs.map((x) => x / 2) },
  { id: 'm1', tex: '-1', g: (xs) => xs.map((x) => x - 1) },
  { id: 'p3', tex: '+3', g: (xs) => xs.map((x) => x + 3) },
  { id: 'x2', tex: '\\times2', g: (xs) => xs.map((x) => 2 * x) },
  { id: 'neg', tex: '\\times(-1)', g: (xs) => xs.map((x) => -x) },
  { id: 'sqrt', tex: '\\sqrt{\\cdot}', g: (xs) => xs.filter((x) => x >= 0).map(Math.sqrt) },
  { id: 'pmsqrt', tex: '\\pm\\sqrt{\\cdot}', g: (xs) => xs.filter((x) => x >= 0).flatMap((x) => (x === 0 ? [0] : [Math.sqrt(x), -Math.sqrt(x)])) },
];
const INV_BY = Object.fromEntries(INV.map((b) => [b.id, b]));

function MachineBox({ x, y, tex, color = C.blue, w = 150, h = 100, opacity = 1 }: { x: number; y: number; tex: string; color?: string; w?: number; h?: number; opacity?: number }) {
  return (
    <Group opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={14} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={3} />
      <Html x={x} y={y} size={30} color={color}>
        <Tex tex={tex} />
      </Html>
    </Group>
  );
}

// ---------------------------------------------------------------- demo scene
function CompositionDemo({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const rev1 = useTween(beat > 1 || (beat === 1 && answer !== null) ? 1 : 0, 2);
  const [undo, setUndo] = useState<string[]>([]);
  const y = 400;
  const pipeV = 1 - at(4);
  const sqV = at(4) * (1 - at(6));
  const genV = at(6) * (1 - at(7));
  const prevV = at(7);

  // token through f then g
  const t0 = beat === 0 ? at(0) : 1;
  const tokX = (t: number) => (t < 0.5 ? lerp(300, 800, t * 2) : lerp(800, 1300, t * 2 - 1));
  const undoResult = (() => {
    let v = 7;
    for (const u of undo) v = u === 'm1' ? v - 1 : v / 2;
    return v;
  })();
  const pickUndo = (id: string) => {
    if (undo.length >= 2 || undo.includes(id)) return;
    const next = [...undo, id];
    setUndo(next);
    if (next.length === 2 && next[0] === 'm1') unlock();
  };

  return (
    <Stage>
      <Group opacity={pipeV}>
        {/* order-swap: during beat 1 reveal machines swap */}
        {(() => {
          const swap = beat === 1 ? rev1 : 0;
          const fx = lerp(620, 980, swap);
          const gx = lerp(980, 620, swap);
          return (
            <>
              <MachineBox x={fx} y={y} tex="f:\ \times2" />
              <MachineBox x={gx} y={y} tex="g:\ +1" />
            </>
          );
        })()}
        <Arrow from={[300, y]} to={[540, y]} color={C.dim} width={2} />
        <Arrow from={[700, y]} to={[900, y]} color={C.dim} width={2} />
        <Arrow from={[1060, y]} to={[1300, y]} color={C.dim} width={2} />
        {beat === 0 && (
          <>
            <Dot x={tokX(t0)} y={y - 90} r={18} color={t0 < 0.5 ? C.cyan : C.amber} />
            <Html x={tokX(t0)} y={y - 135} size={26} color={C.text}>
              <Tex tex={t0 < 0.33 ? '3' : t0 < 0.66 ? '6' : '7'} />
            </Html>
          </>
        )}
        <Html x={800} y={200} size={34} color={C.text}>
          <Tex tex={beat === 1 && answer !== null ? '(f\\circ g)(3)=f(g(3))=f(4)=8' : '(g\\circ f)(3)=g(f(3))=g(6)=7'} />
        </Html>
        {beat >= 2 && beat <= 3 && (
          <>
            <Html x={800} y={560} size={28} color={C.violet}>
              <Tex tex="(g\circ f)^{-1}=f^{-1}\circ g^{-1}" />
            </Html>
            {beat === 3 && (
              <Html x={800} y={680} size={24} interactive>
                <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center' }}>
                  <span className="panel-note">deshacer 7 en orden:</span>
                  <button className={`stage-btn ${undo.includes('h') ? 'on' : ''}`} onClick={() => pickUndo('h')}>
                    <Tex tex="\div2" />
                  </button>
                  <button className={`stage-btn ${undo.includes('m1') ? 'on' : ''}`} onClick={() => pickUndo('m1')}>
                    <Tex tex="-1" />
                  </button>
                  <button className="stage-btn" onClick={() => setUndo([])}>
                    ↶
                  </button>
                  <Tex tex={`\\Rightarrow\\ ${undo.length ? fmt(undoResult, 2) : '7'}`} />
                </div>
              </Html>
            )}
            {beat === 3 && undo.length === 2 && (
              <Html x={800} y={760} size={24} color={undo[0] === 'm1' ? C.green : C.red}>
                <Tex tex={undo[0] === 'm1' ? '7\\xrightarrow{-1}6\\xrightarrow{\\div2}3\\ \\checkmark' : '7\\xrightarrow{\\div2}3.5\\xrightarrow{-1}2.5\\neq3:\\ \\text{orden equivocado}'} />
              </Html>
            )}
          </>
        )}
      </Group>
      {/* x² loses the sign */}
      <Group opacity={sqV}>
        <MachineBox x={800} y={400} tex="(\cdot)^2" />
        <Arrow from={[420, 300]} to={[715, 380]} color={C.cyan} width={3} />
        <Arrow from={[420, 500]} to={[715, 420]} color={C.cyan} width={3} />
        <Html x={380} y={300} size={30} color={C.cyan}>
          <Tex tex="-2" />
        </Html>
        <Html x={380} y={500} size={30} color={C.cyan}>
          <Tex tex="2" />
        </Html>
        <Arrow from={[885, 400]} to={[1150, 400]} color={C.amber} width={3} />
        <Html x={1200} y={400} size={34} color={C.amber}>
          <Tex tex="4" />
        </Html>
        <Group opacity={beat >= 5 ? 1 : at(4)}>
          <Html x={800} y={620} size={28} color={C.text}>
            <Tex tex="f^{-1}(4)=\{-2,\,2\}:\ \text{la información del signo se perdió}" />
          </Html>
        </Group>
        {beat === 5 && answer !== null && (
          <Html x={800} y={720} size={26} color={C.green}>
            <Tex tex="f(x)=2x:\quad f^{-1}(y)=\tfrac{y}{2}\qquad\text{pero}\qquad \tfrac{1}{f(x)}=\tfrac{1}{2x}" />
          </Html>
        )}
      </Group>
      {/* generation vs inference */}
      <Group opacity={genV}>
        {['s_1', 's_2', 's_3'].map((s, i) => (
          <g key={s}>
            <circle cx={480} cy={250 + i * 160} r={36} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
            <Html x={480} y={250 + i * 160} size={28} color={C.cyan}>
              <Tex tex={s} />
            </Html>
          </g>
        ))}
        {['o_1', 'o_2'].map((o, j) => (
          <g key={o}>
            <circle cx={1120} cy={330 + j * 160} r={36} fill={C.panel} stroke={C.amber} strokeWidth={3} />
            <Html x={1120} y={330 + j * 160} size={28} color={C.amber}>
              <Tex tex={o} />
            </Html>
          </g>
        ))}
        <Arrow from={[520, 250]} to={[1080, 330]} color={C.text} width={2.5} />
        <Arrow from={[520, 410]} to={[1080, 490]} color={C.text} width={2.5} />
        <Arrow from={[520, 570]} to={[1080, 340]} color={C.text} width={2.5} />
        <Html x={800} y={170} size={26} color={C.muted}>
          <span>generar: causa → observación</span>
        </Html>
        <Html x={800} y={700} size={28} color={C.red}>
          <Tex tex="\text{inferir desde } o_1:\ \{s_1,s_3\}\ \text{— ambiguo}" />
        </Html>
      </Group>
      {/* preview */}
      <Group opacity={prevV}>
        <MachineBox x={560} y={360} tex="\exp" />
        <MachineBox x={860} y={360} tex="N" />
        <Arrow from={[320, 360]} to={[480, 360]} color={C.dim} width={2} />
        <Arrow from={[640, 360]} to={[780, 360]} color={C.dim} width={2} />
        <Arrow from={[940, 360]} to={[1100, 360]} color={C.dim} width={2} />
        <Html x={1200} y={360} size={30} color={C.violet}>
          <Tex tex="\sigma(\mathbf z)" />
        </Html>
        <Html x={800} y={560} size={30} color={C.text}>
          <Tex tex="\sigma=N\circ\exp,\qquad \ln\circ\exp=\mathrm{id}" />
        </Html>
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 1: assembly line
function genChain(seed: number, round: number) {
  const r = rng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const len = round < 2 ? 2 : 3;
    const x0 = randInt(r, -3, 5);
    const ids: string[] = [];
    let v = x0;
    let okChain = true;
    for (let k = 0; k < len; k++) {
      const b = pick(r, BLOCKS);
      if (b.id === 'h' && v % 2 !== 0) {
        okChain = false;
        break;
      }
      if (ids.length && ids[ids.length - 1] === b.id) {
        okChain = false;
        break;
      }
      ids.push(b.id);
      v = b.f(v);
    }
    if (okChain && Number.isInteger(v) && Math.abs(v) <= 60 && v !== x0) return { x0, target: v, ref: ids };
  }
  return { x0: 3, target: 7, ref: ['x2', 'p1'] };
}

function Assembly({ seed, round, api }: ChallengeProps) {
  const { x0, target, ref } = useMemo(() => genChain(seed, round), [seed, round]);
  const [chain, setChain] = useState<string[]>([]);
  const vals = chain.reduce<number[]>((acc, id) => [...acc, BY[id].f(acc[acc.length - 1])], [x0]);
  const out = vals[vals.length - 1];
  useEffect(() => {
    api.prompt(`Monta una cadena de máquinas que lleve $x=${x0}$ a $${target}$ (máximo 4 bloques). El dato fluye de izquierda a derecha.`, `${x0}\\ \\longmapsto\\ ${target}`);
    api.hints(['Trabaja hacia atrás desde el objetivo: ¿qué tendría que entrar en la última máquina?', `Una solución: ${ref.map((id) => `$${BY[id].tex}$`).join(' → ')}.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x0, target]);
  const notation = chain.length ? chain.map((id) => `(${BY[id].tex})`).reverse().join('\\circ ') : '\\mathrm{id}';
  const submit = () => {
    if (!chain.length) return api.result(false, 'La cadena está vacía.');
    if (out === target) return api.result(true, `$(${notation})(${x0})=${target}$. Se lee de derecha a izquierda: la última máquina escrita es la primera que actúa.`);
    api.result(false, `Tu cadena da $${fmt(out, 2)}$; se pide $${target}$.`);
  };
  const n = chain.length;
  return (
    <Stage>
      <Html x={800} y={130} size={30} color={C.text}>
        <Tex tex={`(${notation})(${x0})=${fmt(out, 2)}\\quad\\text{objetivo }${target}`} />
      </Html>
      <Dot x={180} y={360} r={20} color={C.cyan} />
      <Html x={180} y={310} size={28} color={C.cyan}>
        <Tex tex={String(x0)} />
      </Html>
      {chain.map((id, i) => {
        const cx = 360 + i * 270;
        return (
          <g key={i}>
            <Arrow from={[cx - 160, 360]} to={[cx - 85, 360]} color={C.dim} width={2} />
            <MachineBox x={cx} y={360} tex={BY[id].tex} />
            <Html x={cx + 125} y={310} size={24} color={C.amber}>
              <Tex tex={fmt(vals[i + 1], 2)} />
            </Html>
          </g>
        );
      })}
      <Html x={360 + n * 270 - 50} y={360} size={30} color={out === target ? C.green : C.muted} anchor="left">
        <Tex tex={`\\to ${fmt(out, 2)}`} />
      </Html>
      <Html x={800} y={600} size={24} interactive>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          {BLOCKS.map((b) => (
            <button
              key={b.id}
              className="stage-btn"
              disabled={chain.length >= 4}
              onClick={() => {
                api.sfx.click();
                setChain([...chain, b.id]);
              }}
            >
              <Tex tex={b.tex} />
            </button>
          ))}
          <button className="stage-btn" onClick={() => setChain(chain.slice(0, -1))} disabled={!chain.length}>
            ↶
          </button>
        </div>
      </Html>
      <Html x={800} y={740} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge 2: rewind
const REWIND: { chain: string[]; x0: number }[][] = [
  [
    { chain: ['x2', 'p1'], x0: 3 },
    { chain: ['p1', 'x2'], x0: 2 },
  ],
  [
    { chain: ['m3', 'x2'], x0: 5 },
    { chain: ['x2', 'm3'], x0: 4 },
  ],
  [
    { chain: ['neg', 'p1', 'x2'], x0: 2 },
    { chain: ['x2', 'neg', 'p1'], x0: 3 },
  ],
  [{ chain: ['p1', 'sq'], x0: -3 }],
];
function Rewind({ seed, round, api }: ChallengeProps) {
  const cs = useMemo(() => pick(rng(seed), REWIND[Math.min(round, REWIND.length - 1)]), [seed, round]);
  const y = cs.chain.reduce((v, id) => BY[id].f(v), cs.x0);
  const [inv, setInv] = useState<string[]>([]);
  const cands = inv.reduce<number[]>((xs, id) => INV_BY[id].g(xs), [y]);
  const nonInj = cs.chain.includes('sq');
  useEffect(() => {
    api.prompt(`La cadena produjo $${y}$. **Rebobina**: elige bloques inversos, empezando por deshacer la **última** máquina, hasta recuperar la entrada.`, `${cs.chain.map((id) => `(${BY[id].tex})`).reverse().join('\\circ ')}\\,(x)=${y}`);
    api.hints([
      '$(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}$: se deshace en orden **inverso**.',
      nonInj ? 'Elevar al cuadrado pierde el signo: su «inversa» devuelve **dos** candidatos, $\\pm\\sqrt{\\cdot}$.' : `Primero deshaz $${BY[cs.chain[cs.chain.length - 1]].tex}$.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs]);
  const submit = () => {
    if (!inv.length) return api.result(false, 'Aún no has elegido bloques inversos.');
    if (inv.length < cs.chain.length) return api.result(false, `Faltan pasos: la cadena tiene ${cs.chain.length} máquinas y has deshecho ${inv.length}.`);
    if (cands.length === 1 && Math.abs(cands[0] - cs.x0) < 1e-9) return api.result(true, `Entrada recuperada: $x=${cs.x0}$. Cada máquina se deshizo en orden inverso.`);
    if (cands.some((c) => Math.abs(c - cs.x0) < 1e-9))
      return api.result(true, `Candidatos $\\{${cands.map((c) => fmt(c, 2)).join(',')}\\}$: la entrada fue $${cs.x0}$, pero la cadena no puede saberlo. Perdió información: no es inyectiva.`);
    if (nonInj && inv.includes('sqrt'))
      return api.result(false, `$\\sqrt{\\cdot}$ solo devuelve la raíz positiva y llega a $${cands.map((c) => fmt(c, 2)).join(',')}$. La entrada real fue negativa: $(\\cdot)^2$ borró el signo. Usa $\\pm\\sqrt{\\cdot}$.`);
    api.result(false, `Llegas a $${cands.map((c) => fmt(c, 2)).join(',') || '\\varnothing'}$, que no reproduce la salida. Revisa el **orden**: la última máquina se deshace primero.`);
  };
  return (
    <Stage>
      <Html x={800} y={130} size={28} color={C.muted}>
        <span>cadena original (izquierda → derecha)</span>
      </Html>
      {cs.chain.map((id, i) => (
        <MachineBox key={i} x={500 + i * 230} y={230} tex={BY[id].tex} w={140} h={80} />
      ))}
      <Html x={500 + cs.chain.length * 230 - 60} y={230} size={30} color={C.amber} anchor="left">
        <Tex tex={`\\to ${y}`} />
      </Html>
      <Html x={800} y={360} size={28} color={C.violet}>
        <Tex tex={`${y}${inv.map((id) => `\\xrightarrow{${INV_BY[id].tex}}`).join('\\cdots')}\\ \\Rightarrow\\ \\{${cands.map((c) => fmt(c, 2)).join(',\\,')}\\}`} />
      </Html>
      <Html x={800} y={560} size={24} interactive>
        <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '40em' }}>
          {INV.filter((b) => nonInj || (b.id !== 'sqrt' && b.id !== 'pmsqrt')).map((b) => (
            <button
              key={b.id}
              className="stage-btn"
              disabled={inv.length >= 4}
              onClick={() => {
                api.sfx.click();
                setInv([...inv, b.id]);
              }}
            >
              <Tex tex={b.tex} />
            </button>
          ))}
          <button className="stage-btn" onClick={() => setInv(inv.slice(0, -1))} disabled={!inv.length}>
            ↶
          </button>
        </div>
      </Html>
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
  id: 'w01-l05',
  world: 'foundations',
  code: '1.5',
  title: 'Composición e inversa',
  subtitle: 'encadenar y desandar',
  glyph: '\\circ',
  kind: 'level',
  objective: 'Leer $g\\circ f$ (actúa primero $f$), invertir cadenas en orden inverso y reconocer cuándo una función pierde información y no se puede invertir.',
  glyphs: ['circ', 'inverse', 'id'],
  codex: ['w01-composicion'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Mis modelos son **cadenas**: un estado genera una observación, una puntuación pasa por $\\exp$ y luego se normaliza.',
        'Inferir es recorrer la cadena **al revés**: de lo observado a lo que lo causó. Eso solo funciona si ninguna máquina destruyó información.',
      ],
    },
    {
      kind: 'demo',
      title: 'Cadena',
      Scene: CompositionDemo,
      beats: [
        { say: 'Dos máquinas en serie. El dato entra en $f$ y lo que sale entra en $g$. Se escribe $g\\circ f$: actúa primero la de la **derecha**.', tex: '(g\\g{circ}{\\circ}f)(x):=g(f(x))', dur: 2.6 },
        {
          say: 'El orden importa.',
          tex: 'f(x)=2x,\\quad g(x)=x+1',
          ask: {
            prompt: '¿Cuánto vale $(f\\circ g)(3)$?',
            options: ['$8$', '$7$', '$6$'],
            answer: 0,
            explain: 'Primero $g$: $g(3)=4$; luego $f$: $f(4)=8$. En cambio $(g\\circ f)(3)=7$. En general $g\\circ f\\neq f\\circ g$.',
          },
          dur: 1.4,
        },
        { say: 'Deshacer una cadena es recorrerla al revés, invirtiendo **cada** máquina: lo último que se hizo es lo primero que se deshace.', tex: '(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}', dur: 1.8 },
        {
          say: 'Prueba: la salida fue $7$. Elige en qué orden deshacer $\\times2$ y $+1$.',
          tex: 'f^{\\g{inverse}{-1}}(g^{-1}(7))=\\;?',
          gate: 'Deshaz $7$ en el orden correcto para recuperar $3$.',
        },
        { say: 'Algunas máquinas **destruyen** información. $x\\mapsto x^2$ manda $-2$ y $2$ al mismo sitio: desde $4$ no se sabe de dónde vino.', tex: 'x\\mapsto x^2\\ \\text{no es inyectiva:}\\ f^{-1}(4)=\\{-2,2\\}', dur: 2.2 },
        {
          say: 'Una confusión de notación frecuente.',
          tex: 'f^{-1}\\ \\overset{?}{=}\\ \\tfrac1f',
          ask: {
            prompt: '¿Es $f^{-1}$ lo mismo que $1/f$?',
            options: ['No: $f^{-1}$ deshace $f$; $1/f$ es el recíproco de su valor', 'Sí', 'Solo para funciones lineales'],
            answer: 0,
            explain: 'Con $f(x)=2x$: $f^{-1}(y)=y/2$, pero $1/f(x)=1/(2x)$. El $-1$ como superíndice de una función significa **inversa**, no potencia.',
          },
        },
        { say: 'Un modelo generativo va de causas a observaciones. **Inferir** invierte ese camino; si dos estados producen lo mismo, la inversa es ambigua y hace falta probabilidad.', tex: '\\text{generar: } s\\mapsto o\\qquad \\text{inferir: } o\\mapsto\\ ?', dur: 2.2 },
        { say: 'Lo que viene se arma por composición: softmax es normalizar después de exponenciar; $\\ln$ deshace $\\exp$.', tex: '\\sigma=N\\circ\\exp,\\qquad \\ln\\circ\\exp=\\g{id}{\\mathrm{id}}', dur: 2 },
      ],
    },
    { kind: 'challenge', title: 'Cadena de montaje', Comp: Assembly, rounds: 5 },
    { kind: 'challenge', title: 'Rebobinar', Comp: Rewind, rounds: 4 },
    { kind: 'codex', entry: 'w01-composicion' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-composicion',
    world: 'foundations',
    level: 'w01-l05',
    title: 'Composición e inversa',
    summary: 'Componer encadena máquinas (actúa primero la de la derecha); invertir desanda el camino y exige no haber perdido información.',
    blocks: [
      { label: 'Composición', tex: '(g\\circ f)(x):=g(f(x))', body: 'En general $g\\circ f\\neq f\\circ g$.' },
      { label: 'Identidad', tex: '\\mathrm{id}(x)=x,\\qquad f\\circ\\mathrm{id}=\\mathrm{id}\\circ f=f' },
      { label: 'Inversa', tex: 'f^{-1}(f(x))=x,\\qquad f(f^{-1}(y))=y' },
      { label: 'Inversa de una composición', tex: '(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}' },
      { label: 'Existencia', tex: 'f\\ \\text{inyectiva}:\\ f(a)=f(b)\\Rightarrow a=b', body: 'Solo las inyectivas tienen inversa (sobre su imagen). $x^2$ en $\\mathbb R$ no; en $(0,\\infty)$ sí, con inversa $\\sqrt{\\cdot}$.' },
    ],
    pitfalls: [
      'Leer $g\\circ f$ de izquierda a derecha.',
      'Creer que $f^{-1}=1/f$.',
      'Confundir $\\circ$ (composición) con $\\odot$ (producto componente a componente).',
    ],
    aif: [
      { tex: '\\frac{d}{dx}\\ln f(x)=\\frac{f\'(x)}{f(x)}', text: 'La regla de la cadena exige ver $\\ln\\circ f$ (sector 02).' },
      { tex: '\\sigma=N\\circ\\exp', text: 'Softmax es normalizar compuesto con exponenciar.' },
      { tex: 's\\mapsto o\\ \\ \\text{vs}\\ \\ o\\mapsto s', text: 'Generar vs inferir: invertir un modelo generativo (guía G09).' },
    ],
  },
];

export const glyphs: Glyph[] = [
  { id: 'circ', world: 'foundations', tex: '\\circ', name: 'Composición', read: 'compuesta con', meaning: '$(g\\circ f)(x)=g(f(x))$: primero $f$, luego $g$.', warn: 'No confundir con $\\odot$ (producto componente a componente).' },
  { id: 'inverse', world: 'foundations', tex: 'f^{-1}', name: 'Función inversa', read: 'inversa de efe', meaning: 'La máquina que deshace $f$: $f^{-1}(f(x))=x$.', warn: 'No es $1/f$.' },
  { id: 'id', world: 'foundations', tex: '\\mathrm{id}', name: 'Identidad', read: 'identidad', meaning: 'La función que no cambia nada: $\\mathrm{id}(x)=x$.' },
];
