import { useEffect, useMemo, useRef, useState } from 'react';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import { Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Grid, Vec, dot, lattice, n, norm, sc, snap, txtV, type V2 } from './kit';

// ============================================================================
// CASO 4.3 · «La vía en desuso» — producto punto
// u·v = u1v1 + u2v2; signo ↔ ángulo; u·v = |u||v|cos θ; v·v = |v|²; proyección y
// componente de un vector en una dirección.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);

/** Angle arc between two vectors at the origin. */
function Arc({ a, b, r = 46, color = C.violet }: { a: V2; b: V2; r?: number; color?: string }) {
  if (norm(a) === 0 || norm(b) === 0) return null;
  const t1 = Math.atan2(a[1], a[0]);
  let t2 = Math.atan2(b[1], b[0]);
  let d = t2 - t1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  t2 = t1 + d;
  const [ox, oy] = P.pt(0, 0);
  const p = (t: number) => `${ox + r * Math.cos(t)} ${oy - r * Math.sin(t)}`;
  return <path d={`M${p(t1)} A ${r} ${r} 0 0 ${d > 0 ? 0 : 1} ${p(t2)}`} fill="none" stroke={color} strokeWidth={3} />;
}
const angleDeg = (a: V2, b: V2) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (norm(a) * norm(b))))) * 180) / Math.PI;

/** Shadow of v on the line of u: projection vector and the perpendicular drop. */
function Shadow({ u, v, color = C.green }: { u: V2; v: V2; color?: string }) {
  const pr = sc(dot(u, v) / dot(u, u), u);
  return (
    <g>
      <Line a={P.pt(-u[0] * 2, -u[1] * 2)} b={P.pt(u[0] * 2, u[1] * 2)} color={C.dim} width={1.5} dashed />
      <Line a={P.pt(v[0], v[1])} b={P.pt(pr[0], pr[1])} color={C.muted} width={2} dashed />
      <Vec P={P} v={pr} color={color} width={7} opacity={0.9} />
    </g>
  );
}

// ---------------------------------------------------------------- lesson
function DotLesson({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const u: V2 = [3, 1];
  const [v, setV] = useState<V2>([2, 3]);
  const onV = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    if (t[0] === 0 && t[1] === 0) return;
    setV(t);
    if (beat === 1 && dot(u, t) === 0) unlock();
    if (beat === 5 && dot(u, t) < 0) unlock();
  });
  const drag = beat === 1 || beat === 5;
  const vv: V2 = drag ? v : beat === 3 ? [3, 4] : [2, 3];
  const d = dot(u, vv);
  const sign = d > 0 ? C.green : d < 0 ? C.red : C.text;
  return (
    <Stage ref={svg}>
      <Grid P={P} opacity={0} />
      {beat !== 3 && <Vec P={P} v={u} color={C.cyan} label="\vec u" off={[20, 22]} />}
      {(beat === 4 || beat === 5) && <Shadow u={u} v={vv} color={d >= 0 ? C.green : C.red} />}
      <Vec P={P} v={vv} color={C.amber} label="\vec v" off={[-10, -28]} />
      {(beat === 1 || beat === 2) && <Arc a={u} b={vv} />}
      {drag && <Knob x={P.x(vv[0])} y={P.y(vv[1])} color={C.amber} onPointerDown={onV} r={14} />}
      {beat <= 1 && (
        <>
          <Cap x={1370} y={230} size={22} color={C.cyan} tex={`\\vec u=${txtV(u)}`} />
          <Cap x={1370} y={280} size={22} color={C.amber} tex={`\\vec v=${txtV(vv)}`} />
          <Cap x={1370} y={350} size={24} color={beat === 1 ? sign : C.text} tex={`\\vec u\\cdot\\vec v=${n(u[0])}\\cdot${n(vv[0]).replace(/^-.*/, '($&)')}+${n(u[1])}\\cdot${n(vv[1]).replace(/^-.*/, '($&)')}=${n(d)}`} />
          {beat === 1 && <Cap x={1370} y={410} size={20} color={sign}>{d > 0 ? 'ángulo agudo' : d < 0 ? 'ángulo obtuso' : 'perpendiculares'}</Cap>}
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1370} y={230} size={22} color={C.text} tex="\vec u\cdot\vec v=9" />
          <Cap x={1370} y={290} size={22} color={C.text} tex="\|\vec u\|=\sqrt{10},\ \ \|\vec v\|=\sqrt{13}" />
          <Cap x={1370} y={350} size={22} color={C.violet} tex={`\\cos\\theta=\\tfrac{9}{\\sqrt{130}}\\approx0{,}789`} />
          <Cap x={1370} y={410} size={22} color={C.violet} tex={`\\theta\\approx${dec(angleDeg(u, [2, 3]), 1).replace(',', '{,}')}^\\circ`} />
        </>
      )}
      {beat === 3 && (
        <>
          <Vec P={P} v={[3, 0]} color={C.amber} width={3} dashed />
          <Cap x={1370} y={260} size={24} color={answer !== null ? C.green : C.text} tex={answer !== null ? '(3,4)\\cdot(3,4)=9+16=25=5^2' : '(3,4)\\cdot(3,4)=\\ ?'} />
        </>
      )}
      {(beat === 4 || beat === 5) && (
        <>
          <Cap x={1370} y={230} size={22} color={C.text} tex={`\\vec u\\cdot\\vec v=${n(d)}`} />
          <Cap x={1370} y={290} size={22} color={d >= 0 ? C.green : C.red} tex={`\\operatorname{comp}_{\\vec u}\\vec v=\\tfrac{${n(d)}}{\\sqrt{10}}\\approx${n(d / Math.sqrt(10))}`} />
          <Cap x={1370} y={350} size={20} color={C.muted}>{d >= 0 ? 'la sombra apunta como u' : 'la sombra apunta al revés'}</Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Producto punto',
  Scene: DotLesson,
  beats: [
    {
      say: 'Para medir cuánto apuntan dos vectores hacia el mismo lado se usa el **producto punto**: se multiplican las componentes correspondientes y se suman. El resultado es un número, no un vector.',
      dur: 2.8,
      board: { label: 'Producto punto', tex: '\\vec u\\cdot\\vec v=\\p{1}{\\cC{u_1}\\cA{v_1}}+\\p{2}{\\cC{u_2}\\cA{v_2}}', body: 'Ejemplo: $(3,1)\\cdot(2,3)=6+3=9$.' },
    },
    {
      say: 'Su **signo** dice hacia dónde apuntan: positivo si forman un ángulo agudo, cero si son perpendiculares, negativo si el ángulo es obtuso.',
      gate: 'Arrastra la punta de $\\vec v$ hasta que el producto punto sea $0$.',
      board: { label: 'Signo y ángulo', tex: '\\vec u\\cdot\\vec v\\ \\begin{cases}\\p{1}{>0} & \\text{agudo}\\\\\\p{2}{=0} & \\text{perpendiculares}\\\\\\p{3}{<0} & \\text{obtuso}\\end{cases}' },
    },
    {
      say: 'La razón es geométrica: el producto punto también vale $\\|\\vec u\\|\\,\\|\\vec v\\|\\cos\\theta$, con $\\theta$ el ángulo entre ellos. El coseno es positivo para ángulos agudos y negativo para obtusos.',
      dur: 3,
      board: { label: 'Forma geométrica', tex: '\\vec u\\cdot\\vec v=\\p{1}{\\|\\vec u\\|\\,\\|\\vec v\\|}\\,\\p{2}{\\cos\\theta}', body: 'Despejando: $\\cos\\theta=\\dfrac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|\\,\\|\\vec v\\|}$.' },
    },
    {
      say: 'Un vector consigo mismo forma un ángulo de $0^\\circ$, con coseno 1. Por eso el producto punto contiene a la norma.',
      ask: { prompt: '¿Cuánto es $(3,4)\\cdot(3,4)$?', options: ['25', '7', '12'], answer: 0, explain: '$9+16=25=\\|(3,4)\\|^2$.' },
      board: { label: 'Consigo mismo', tex: '\\vec v\\cdot\\vec v=\\p{1}{v_1^2+v_2^2}=\\p{2}{\\|\\vec v\\|^2}' },
    },
    {
      say: 'La **proyección** de $\\vec v$ sobre $\\vec u$ es su sombra sobre la recta de $\\vec u$, con luz perpendicular. Su largo con signo es la **componente** de $\\vec v$ en la dirección de $\\vec u$.',
      dur: 3,
      board: [
        { label: 'Componente en una dirección', tex: '\\operatorname{comp}_{\\vec u}\\vec v=\\frac{\\p{1}{\\vec u\\cdot\\vec v}}{\\p{2}{\\|\\vec u\\|}}' },
        { label: 'Proyección', tex: '\\operatorname{proy}_{\\vec u}\\vec v=\\p{1}{\\frac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|^2}}\\,\\p{2}{\\vec u}', body: 'Aquí: $\\tfrac{9}{10}(3,1)=(2{,}7;\\,0{,}9)$.' },
      ],
    },
    {
      say: 'Si el ángulo es obtuso, la sombra cae del otro lado: la componente es negativa.',
      gate: 'Arrastra $\\vec v$ hasta que su sombra apunte al revés que $\\vec u$.',
    },
  ],
};

// ---------------------------------------------------------------- demo
const PV = lattice(700, 440, 44, 10, 7);
const D: V2 = [4, 3];
const VT: V2 = [8, 6];
const MAIN: V2 = [-3, 4];

function SensorDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  return (
    <Stage>
      <Grid P={PV} opacity={0} />
      <Line a={PV.pt(-8, -6)} b={PV.pt(10, 7.5)} color="#9cff6e" width={8} opacity={0.25} />
      <Cap x={PV.x(-6.5)} y={PV.y(-4)} size={16} color="#9cff6e">
        vía en desuso
      </Cap>
      {beat >= 2 && (
        <>
          <Line a={PV.pt(4.2, -5.6)} b={PV.pt(-4.2, 5.6)} color={C.amber} width={8} opacity={0.25 * at(2)} />
          <Cap x={PV.x(-3)} y={PV.y(5.8)} size={16} color={C.amber} opacity={at(2)}>
            línea principal
          </Cap>
          <Vec P={PV} v={MAIN} color={C.amber} width={4} label="(-3,4)" off={[-40, -10]} size={18} />
        </>
      )}
      <Vec P={PV} v={D} color={C.cyan} width={4} label="\vec d" off={[24, 18]} />
      {beat >= 1 && <Vec P={PV} v={VT} color={C.magenta} width={6} progress={beat === 1 ? at(1) : 1} label="\vec v" off={[-10, -28]} />}
      <Cap x={1370} y={230} size={22} color={C.cyan} tex="\vec d=(4,3),\ \|\vec d\|=5" />
      {beat >= 1 && <Cap x={1370} y={290} size={22} color={C.magenta} tex="\vec v=(8,6)\ \text{km/h}" />}
      {beat >= 1 && (beat > 1 || answer !== null) && <Cap x={1370} y={350} size={22} color={C.green} tex="\tfrac{\vec v\cdot\vec d}{\|\vec d\|}=\tfrac{32+18}{5}=10" />}
      {beat === 2 && answer !== null && <Cap x={1370} y={410} size={22} color={C.green} tex="(8,6)\cdot(-3,4)=-24+24=0" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Ang = 'agudo' | 'recto' | 'obtuso';

function Readings({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 17 + round);
    const nz = (lo: number, hi: number) => {
      let c = 0;
      while (c === 0) c = randInt(r, lo, hi);
      return c;
    };
    const u: V2 = [nz(-4, 5), nz(-4, 5)];
    const v: V2 = [nz(-4, 5), nz(-4, 5)];
    const kind = pick(r, ['agudo', 'recto', 'obtuso'] as Ang[]);
    const a: V2 = [nz(-5, 6), nz(-5, 6)];
    let b: V2 = [nz(-5, 6), nz(-5, 6)];
    if (kind === 'recto') b = sc(pick(r, [1, -1, 2]), [-a[1], a[0]]);
    else
      for (let t = 0; t < 60 && (dot(a, b) === 0 || (dot(a, b) > 0) !== (kind === 'agudo')); t++) b = [nz(-5, 6), nz(-5, 6)];
    const d = pick(r, [[3, 4], [4, 3], [-3, 4], [4, -3], [6, 8], [5, 12]] as V2[]);
    const w: V2 = [nz(-6, 9), nz(-6, 9)];
    return { u, v, a, b, kind: (dot(a, b) === 0 ? 'recto' : dot(a, b) > 0 ? 'agudo' : 'obtuso') as Ang, d, w };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [ang, setAng] = useState<Ang | null>(null);
  const { u, v, a, b, kind, d, w } = data;

  useEffect(() => {
    setVal('');
    setAng(null);
    if (round === 0) {
      api.prompt('Dos lecturas del sensor como vectores. Calcula su producto punto.', '\\vec u\\cdot\\vec v=u_1v_1+u_2v_2');
      api.hints(['Multiplica primera por primera y segunda por segunda.', 'Suma los dos productos, con sus signos.']);
    } else if (round === 1) {
      api.prompt('Sin dibujo: ¿qué ángulo forman estos dos vectores?', '\\vec a\\cdot\\vec b');
      api.hints(['Calcula el producto punto.', 'Positivo: agudo. Cero: recto. Negativo: obtuso.']);
    } else {
      api.prompt('El sensor de una vía con dirección $\\vec d$ mide la componente de la velocidad $\\vec v$ a lo largo de la vía. ¿Qué marca? (Dos decimales si no es exacto.)', '\\operatorname{comp}_{\\vec d}\\vec v=\\frac{\\vec v\\cdot\\vec d}{\\|\\vec d\\|}');
      api.hints([`$\\|\\vec d\\|=${n(norm(d))}$.`, 'Producto punto dividido por la norma de $\\vec d$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (!ang) return;
      if (ang === kind) return api.result(true, `$\\vec a\\cdot\\vec b=${n(dot(a, b))}$: ángulo ${kind}.`);
      return api.result(false, `$\\vec a\\cdot\\vec b=${n(dot(a, b))}$. ${dot(a, b) > 0 ? 'Positivo significa agudo.' : dot(a, b) < 0 ? 'Negativo significa obtuso.' : 'Cero significa perpendiculares.'}`);
    }
    const x = parseNum(val);
    if (x === null) return;
    if (round === 0) {
      const t = dot(u, v);
      if (Math.abs(x - t) < 0.01) return api.result(true, `$${n(u[0])}\\cdot${par(v[0])}+${n(u[1])}\\cdot${par(v[1])}=${n(t)}$.`);
      if (Math.abs(x - (u[0] * v[1] + u[1] * v[0])) < 0.01) return api.result(false, 'Cruzaste las componentes: es primera por primera y segunda por segunda.');
      return api.result(false, `Los productos son $${n(u[0] * v[0])}$ y $${n(u[1] * v[1])}$; revisa la suma y los signos.`);
    }
    const t = dot(w, d) / norm(d);
    if (Math.abs(x - t) < 0.011) return api.result(true, `$\\tfrac{${n(dot(w, d))}}{${n(norm(d))}}=${n(t)}$ km/h.`);
    if (Math.abs(x - dot(w, d)) < 0.01) return api.result(false, `Ese es el producto punto. Falta dividir por $\\|\\vec d\\|=${n(norm(d))}$.`);
    if (Math.abs(x - dot(w, d) / dot(d, d)) < 0.011) return api.result(false, 'Dividiste por $\\|\\vec d\\|^2$: eso da el factor de la proyección, no su largo.');
    return api.result(false, `$\\vec v\\cdot\\vec d=${n(dot(w, d))}$; revísalo y divide por $${n(norm(d))}$.`);
  };

  const PR = lattice(700, 450, round === 2 ? 26 : 50, round === 2 ? 15 : 8, round === 2 ? 13 : 6);
  return (
    <Stage>
      {round !== 1 && <Grid P={PR} opacity={0} R={16} />}
      {round === 0 && (
        <>
          <Vec P={PR} v={u} color={C.cyan} label="\vec u" off={[20, 20]} />
          <Vec P={PR} v={v} color={C.amber} label="\vec v" off={[-20, -24]} />
          <Cap x={1380} y={240} size={24} color={C.cyan} tex={`\\vec u=${txtV(u)}`} />
          <Cap x={1380} y={296} size={24} color={C.amber} tex={`\\vec v=${txtV(v)}`} />
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={700} y={360} size={34} color={C.cyan} tex={`\\vec a=${txtV(a)}`} />
          <Cap x={700} y={440} size={34} color={C.amber} tex={`\\vec b=${txtV(b)}`} />
          <Choices x={700} y={560} options={['agudo', 'recto', 'obtuso'] as Ang[]} value={ang} onPick={setAng} />
        </>
      )}
      {round === 2 && (
        <>
          <Line a={PR.pt(-d[0] * 1.2, -d[1] * 1.2)} b={PR.pt(d[0] * 1.2, d[1] * 1.2)} color="#9cff6e" width={8} opacity={0.25} />
          <Vec P={PR} v={d} color={C.cyan} label="\vec d" off={[24, 18]} />
          <Vec P={PR} v={w} color={C.magenta} label="\vec v" off={[-20, -24]} />
          <Cap x={1380} y={240} size={24} color={C.cyan} tex={`\\vec d=${txtV(d)}`} />
          <Cap x={1380} y={296} size={24} color={C.magenta} tex={`\\vec v=${txtV(w)}\\ \\text{km/h}`} />
        </>
      )}
      {round !== 1 && <NumberField x={1250} y={420} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'u·v =' : 'sensor ='} width={4} />}
      <Confirm onClick={submit} />
    </Stage>
  );
}
const par = (x: number) => (x < 0 ? `(${n(x)})` : n(x));

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c3',
  world: 'linear',
  code: '4.3',
  title: 'La vía en desuso',
  subtitle: 'Producto punto',
  glyph: '\\vec u\\cdot\\vec v',
  kind: 'level',
  guide: 'lucia',
  teaser: 'Los sensores de una vía abandonada siguen midiendo cuánto de la velocidad de cada tren va a lo largo de la vía. Una lectura de anoche no tiene explicación oficial.',
  learn: 'Producto punto por componentes y en forma geométrica, ángulo entre vectores, perpendicularidad, componente y proyección sobre una dirección.',
  glyphs: ['dot', 'proj'],
  pitfalls: ['El producto punto es un número, no un vector.', 'Perpendiculares ⇔ producto punto cero (con vectores no nulos).', 'La componente divide por $\\|\\vec d\\|$; la proyección (vector) divide por $\\|\\vec d\\|^2$ y multiplica por $\\vec d$.'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'lucia', text: 'Los sensores de la vía vieja miden cuánto de la velocidad de un tren va a lo largo de la vía. Anoche, a las 02:10, uno marcó 10 km/h.' },
        { who: 'iris', text: 'Por esa vía no debería pasar nada. ¿Puede ser un tren que iba por otra?' },
      ],
    },
    {
      kind: 'demo',
      title: 'Sensores de la vía',
      Scene: SensorDemo,
      beats: [
        {
          say: 'La vía en desuso apunta en la dirección $\\vec d=(4,3)$. El sensor mide la componente de la velocidad del tren en esa dirección.',
          dur: 1.6,
          note: { label: 'Vía en desuso', tex: '\\vec d=(4,3),\\quad \\|\\vec d\\|=5' },
        },
        {
          say: 'A las 02:10, el GPS del M-7 daba una velocidad $\\vec v=(8,6)$ km/h.',
          ask: { prompt: '¿Qué habría marcado el sensor con el M-7 encima?', options: ['10 km/h', '14 km/h', '50 km/h'], answer: 0, explain: '$\\frac{(8,6)\\cdot(4,3)}{5}=\\frac{32+18}{5}=10$. Coincide con la lectura y con $\\|\\vec v\\|=10$: toda su velocidad iba a lo largo de la vía vieja.' },
          note: { label: 'Componente del M-7', tex: '\\tfrac{\\vec v\\cdot\\vec d}{\\|\\vec d\\|}=\\tfrac{50}{5}=10' },
        },
        {
          say: 'El sensor de la línea principal, cuya dirección es $(-3,4)$, marcó cero en ese momento.',
          ask: { prompt: '¿Es compatible con el M-7 en la vía vieja?', options: ['Sí: $(8,6)\\cdot(-3,4)=0$, iba perpendicular a la principal', 'No: debería marcar 10', 'No se puede saber'], answer: 0, explain: '$-24+24=0$: la velocidad del M-7 no tenía componente en la línea principal.' },
          note: { label: 'Perpendicular a la principal', tex: '(8,6)\\cdot(-3,4)=0' },
        },
      ],
    },
    { kind: 'challenge', title: 'Lecturas de sensor', Comp: Readings, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'lucia', text: 'Entonces el M-7 sí pasó por la vía vieja. Y en las pantallas de control nunca apareció ahí.' },
        { who: 'teo', text: 'Las pantallas no muestran el GPS crudo. Lo pasan por una tabla de conversión del servidor. Voy a buscarla.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'dot', world: 'linear', tex: '\\vec u\\cdot\\vec v', name: 'Producto punto', read: 'u punto ve', meaning: 'Número $u_1v_1+u_2v_2=\\|\\vec u\\|\\|\\vec v\\|\\cos\\theta$. Cero si son perpendiculares.' },
  { id: 'proj', world: 'linear', tex: '\\operatorname{proy}_{\\vec u}\\vec v', name: 'Proyección', read: 'proyección de ve sobre u', meaning: 'Sombra de $\\vec v$ sobre la recta de $\\vec u$: $\\frac{\\vec u\\cdot\\vec v}{\\|\\vec u\\|^2}\\vec u$.' },
];
