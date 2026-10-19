import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import { Dot, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap, mix } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Grid, Vec, add, eqV, lattice, n, norm, sc, snap, sub, texV, txtV, type V2 } from './kit';

// ============================================================================
// CASO 4.1 · «Desplazamientos» — vectores
// Flecha con tamaño y dirección; componentes; norma (Pitágoras); suma punta con cola;
// producto por escalar; el vector entre dos puntos es punta menos cola.
// ============================================================================

const P = lattice(720, 450, 60, 7, 5);

/** Dashed legs of a vector: horizontal (amber) then vertical (magenta), with their lengths. */
function Legs({ v, from = [0, 0], opacity = 1 }: { v: V2; from?: V2; opacity?: number }) {
  if (opacity <= 0) return null;
  const a = P.pt(from[0], from[1]);
  const b = P.pt(from[0] + v[0], from[1]);
  const c = P.pt(from[0] + v[0], from[1] + v[1]);
  return (
    <g opacity={opacity}>
      <Line a={a} b={b} color={C.amber} dashed width={3} />
      <Line a={b} b={c} color={C.magenta} dashed width={3} />
      {v[0] !== 0 && <Cap x={(a[0] + b[0]) / 2} y={a[1] + (v[1] >= 0 ? 24 : -24)} size={20} color={C.amber} tex={n(v[0])} />}
      {v[1] !== 0 && <Cap x={b[0] + (v[0] >= 0 ? 24 : -24)} y={(b[1] + c[1]) / 2} size={20} color={C.magenta} tex={n(v[1])} />}
    </g>
  );
}

// ---------------------------------------------------------------- lesson
function VectorLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<V2>([3, 2]);
  const [k, setK] = useState(1);
  const onTip = useSvgDrag(svg, (x, y) => {
    const t = snap(P, x, y);
    setTip(t);
    if (eqV(t, [-2, 4])) unlock();
  });
  const onK = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(-2 + ((x - 1210) / 300) * 5, -2, 3) * 2) / 2;
    setK(v);
    if (v < 0) unlock();
  });
  const u: V2 = [3, 1];
  const w: V2 = [1, 3];
  const pP: V2 = [-2, 1];
  const pQ: V2 = [3, 3];
  return (
    <Stage ref={svg}>
      <Grid P={P} opacity={0} />
      {beat === 0 &&
        ([
          [-6, -3],
          [-2, 1],
          [2, -3],
        ] as V2[]).map((t, i) => <Vec key={i} P={P} v={[3, 2]} from={t} color={C.cyan} progress={clamp(at(0) * 3 - i, 0, 1)} label={i === 2 ? '\\vec v' : undefined} />)}
      {beat === 0 && <Cap x={1360} y={300} size={22} color={C.muted}>tres copias, un solo vector</Cap>}
      {beat === 1 && (
        <>
          <Legs v={[3, 2]} opacity={at(1)} />
          <Vec P={P} v={[3, 2]} label="\vec v" />
          <Cap x={1360} y={300} size={26} color={C.text} tex="\vec v=\begin{pmatrix}3\\2\end{pmatrix}=(3,\,2)" />
        </>
      )}
      {beat === 2 && (
        <>
          <Legs v={tip} />
          <Vec P={P} v={tip} label="\vec v" />
          <Dot x={P.x(-2)} y={P.y(4)} r={7} color={C.green} ring />
          <Knob x={P.x(tip[0])} y={P.y(tip[1])} color={C.cyan} onPointerDown={onTip} r={14} />
          <Cap x={1360} y={300} size={26} color={C.text} tex={`\\vec v=${texV(tip)}`} />
        </>
      )}
      {beat === 3 && (
        <>
          <Legs v={[3, 4]} />
          <Vec P={P} v={[3, 4]} label="\vec v" off={[-30, -10]} />
          <path d={`M${P.x(3) - 18} ${P.y(0)} L${P.x(3) - 18} ${P.y(0) - 18} L${P.x(3)} ${P.y(0) - 18}`} fill="none" stroke={C.muted} strokeWidth={2} />
          <Cap x={1360} y={300} size={26} color={answer !== null ? C.green : C.text} tex={answer !== null ? '\\|\\vec v\\|=\\sqrt{3^2+4^2}=5' : '\\|\\vec v\\|=\\ ?'} />
        </>
      )}
      {beat === 4 && (
        <>
          <Vec P={P} v={u} color={C.cyan} label="\vec u" off={[10, 26]} />
          <Vec P={P} v={w} from={mix([0, 0], u, at(4)) as V2} color={C.amber} label="\vec v" off={[-28, -6]} />
          <Vec P={P} v={w} color={C.amber} opacity={0.25 * at(4)} />
          <Vec P={P} v={add(u, w)} color={C.green} progress={clamp(at(4) * 2 - 1, 0, 1)} label="\vec u+\vec v" off={[30, -20]} />
          <Cap x={1360} y={300} size={24} color={C.text} tex="\begin{pmatrix}3\\1\end{pmatrix}+\begin{pmatrix}1\\3\end{pmatrix}=\begin{pmatrix}4\\4\end{pmatrix}" opacity={at(4)} />
        </>
      )}
      {beat === 5 && (
        <>
          <Vec P={P} v={[2, 1]} color={C.dim} width={9} />
          <Vec P={P} v={sc(k, [2, 1])} color={k < 0 ? C.magenta : C.cyan} label="k\vec v" />
          <line x1={1210} x2={1510} y1={420} y2={420} stroke={C.line} strokeWidth={3} />
          {[-2, -1, 0, 1, 2, 3].map((t) => (
            <Cap key={t} x={1210 + ((t + 2) / 5) * 300} y={452} size={15} color={C.dim} tex={String(t)} />
          ))}
          <Knob x={1210 + ((k + 2) / 5) * 300} y={420} color={k < 0 ? C.magenta : C.cyan} onPointerDown={onK} cursor="ew-resize" label={`k=${dec(k)}`} />
          <Cap x={1360} y={300} size={24} color={C.text} tex={`${n(k)}\\begin{pmatrix}2\\\\1\\end{pmatrix}=${texV(sc(k, [2, 1]))}`} />
        </>
      )}
      {beat === 6 && (
        <>
          <Vec P={P} v={pP} color={C.dim} width={3} dashed />
          <Vec P={P} v={pQ} color={C.dim} width={3} dashed />
          <Dot x={P.x(pP[0])} y={P.y(pP[1])} r={9} color={C.cyan} />
          <Dot x={P.x(pQ[0])} y={P.y(pQ[1])} r={9} color={C.amber} />
          <Cap x={P.x(pP[0]) - 34} y={P.y(pP[1]) - 26} size={22} color={C.cyan} tex="P" />
          <Cap x={P.x(pQ[0]) + 30} y={P.y(pQ[1]) - 26} size={22} color={C.amber} tex="Q" />
          {answer !== null && <Vec P={P} v={sub(pQ, pP)} from={pP} color={C.green} label="\overrightarrow{PQ}" off={[-60, -34]} />}
          <Cap x={1360} y={300} size={24} color={C.text} tex={answer !== null ? '\\begin{pmatrix}3\\\\3\\end{pmatrix}-\\begin{pmatrix}-2\\\\1\\end{pmatrix}=\\begin{pmatrix}5\\\\2\\end{pmatrix}' : '\\overrightarrow{PQ}=\\ ?'} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Vectores',
  Scene: VectorLesson,
  beats: [
    {
      say: 'Un desplazamiento tiene **tamaño** y **dirección**, y se dibuja como una flecha. Eso es un **vector**: importa cuánto y hacia dónde, no desde dónde parte.',
      dur: 2.8,
      board: { label: 'Vector', tex: '\\p{1}{\\vec v}', body: 'Flecha con tamaño y dirección. Trasladada a cualquier lugar, sigue siendo el mismo vector.', parts: ['desplazamiento con dirección'] },
    },
    {
      say: 'Para describirlo con números se cuentan sus **componentes**: cuánto avanza en $x$ y cuánto en $y$.',
      dur: 2.4,
      board: { label: 'Componentes', tex: '\\vec v=\\begin{pmatrix}\\p{1}{\\cA{v_1}}\\\\\\p{2}{\\cM{v_2}}\\end{pmatrix}=\\p{3}{\\begin{pmatrix}3\\\\2\\end{pmatrix}}', body: 'También se escribe en una línea: $\\vec v=(3,2)$.', parts: ['cuánto avanza horizontal', 'cuánto avanza vertical', 'desplazamiento del ejemplo'] },
    },
    {
      say: 'Las componentes pueden ser negativas: hacia la izquierda o hacia abajo.',
      gate: 'Arrastra la punta de la flecha hasta el punto verde, $(-2,\\,4)$.',
    },
    {
      say: 'La **longitud** del vector, su **norma**, sale de Pitágoras: las componentes son los catetos de un triángulo rectángulo.',
      ask: { prompt: '¿Cuánto mide $\\vec v=(3,4)$?', options: ['5', '7', '25'], answer: 0, explain: '$\\sqrt{3^2+4^2}=\\sqrt{25}=5$. Sumar las componentes (7) mediría un camino en escalera, no la flecha.' },
      board: { label: 'Norma', tex: '\\|\\vec v\\|=\\sqrt{\\p{1}{v_1^2}+\\p{2}{v_2^2}}', parts: ['horizontal al cuadrado', 'vertical al cuadrado'] },
    },
    {
      say: '**Sumar** dos vectores es hacer un desplazamiento y después el otro: la cola del segundo se pone en la punta del primero. En números, se suman componente a componente.',
      dur: 3,
      board: { label: 'Suma', tex: '\\p{1}{\\cC{\\vec u}}+\\p{2}{\\cA{\\vec v}}=\\p{3}{\\begin{pmatrix}u_1+v_1\\\\u_2+v_2\\end{pmatrix}}', body: 'El orden no importa: $\\vec u+\\vec v=\\vec v+\\vec u$ (las dos rutas forman un paralelogramo).', parts: ['primer desplazamiento', 'segundo desplazamiento', 'desplazamiento total'] },
    },
    {
      say: 'Multiplicar por un número $k$, un **escalar**, estira la flecha $k$ veces. Si $k$ es negativo, además la da vuelta.',
      gate: 'Mueve $k$ hasta un valor negativo.',
      board: { label: 'Escalar por vector', tex: 'k\\,\\vec v=\\begin{pmatrix}\\p{1}{k\\,v_1}\\\\\\p{1}{k\\,v_2}\\end{pmatrix}', body: '$-\\vec v$ es el viaje de vuelta. Restar es sumar el opuesto: $\\vec u-\\vec v=\\vec u+(-1)\\vec v$.', parts: ['componentes escaladas'] },
    },
    {
      say: 'Último ingrediente: el vector que va de un punto $P$ a un punto $Q$ se obtiene restando, **punta menos cola**.',
      ask: { prompt: '¿Qué vector va de $P=(-2,1)$ a $Q=(3,3)$?', options: ['(5, 2)', '(1, 4)', '(−5, −2)'], answer: 0, explain: '$Q-P=(3-(-2),\\,3-1)=(5,2)$. El opuesto, $(-5,-2)$, va de $Q$ a $P$.' },
      board: { label: 'De un punto a otro', tex: '\\overrightarrow{PQ}=\\p{1}{Q}-\\p{2}{P}', parts: ['punto de llegada', 'punto de partida'] },
    },
  ],
};

// ---------------------------------------------------------------- demo
const STATIONS: { at: V2; name: string; color?: string }[] = [
  { at: [0, 0], name: 'Puerto' },
  { at: [6, 0], name: 'Taller El Salto', color: C.amber },
  { at: [3, 4], name: 'Cocheras Barón', color: C.red },
  { at: [-4, 2], name: 'Bellavista' },
  { at: [-3, -3], name: 'Francia' },
  { at: [4, -3], name: 'Viña' },
];
const LEGS: V2[] = [
  [4, 1],
  [2, 2],
  [-3, 1],
];

function Network() {
  const segs: [V2, V2][] = [
    [[-4, 2], [0, 0]],
    [[0, 0], [6, 0]],
    [[-3, -3], [0, 0]],
    [[0, 0], [4, -3]],
    [[6, 0], [3, 4]],
  ];
  return (
    <g>
      {segs.map(([a, b], i) => (
        <Line key={i} a={P.pt(a[0], a[1])} b={P.pt(b[0], b[1])} color={i === 4 ? C.dim : '#9cff6e'} width={i === 4 ? 3 : 6} dashed={i === 4} opacity={0.4} />
      ))}
      {STATIONS.map((s) => (
        <g key={s.name}>
          <circle cx={P.x(s.at[0])} cy={P.y(s.at[1])} r={10} fill={C.bg} stroke={s.color ?? '#cfe'} strokeWidth={3} />
          <Cap x={P.x(s.at[0])} y={P.y(s.at[1]) + 28} size={15} color={s.color ?? C.muted}>
            {s.name}
          </Cap>
        </g>
      ))}
    </g>
  );
}

function TripDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const names = ['\\vec a', '\\vec b', '\\vec c'];
  const cols = [C.cyan, C.amber, C.magenta];
  const chained = beat >= 2 || (beat === 1 && answer !== null);
  let tail: V2 = [0, 0];
  return (
    <Stage>
      <Grid P={P} opacity={0} />
      <Network />
      {LEGS.map((v, i) => {
        if (beat === 0 && i > 0) return null;
        const from = chained ? tail : ([0, 0] as V2);
        tail = add(tail, v);
        return <Vec key={i} P={P} v={v} from={from} color={cols[i]} progress={beat === 0 ? at(0) : 1} opacity={chained || beat === 0 ? 1 : 0.75} label={names[i]} off={[0, -28]} size={20} />;
      })}
      {chained && <Vec P={P} v={[3, 4]} color={C.green} width={4} dashed />}
      {beat === 2 && answer !== null && <Vec P={P} v={[3, -4]} from={[3, 4]} color={C.red} dashed label="?" off={[30, 0]} />}
      <Cap x={1360} y={240} size={22} color={C.text} tex="\vec a=(4,1)" />
      <Cap x={1360} y={290} size={22} color={C.text} tex="\vec b=(2,2)" opacity={beat >= 1 ? 1 : 0.3} />
      <Cap x={1360} y={340} size={22} color={C.text} tex="\vec c=(-3,1)" opacity={beat >= 1 ? 1 : 0.3} />
      {chained && <Cap x={1360} y={410} size={22} color={C.green} tex="\vec a+\vec b+\vec c=(3,4)" />}
      {beat === 2 && answer !== null && <Cap x={1360} y={470} size={22} color={C.red} tex="(6,0)-(3,4)=(3,-4)" />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Logbook({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed * 7 + round);
    const comp = () => {
      let c = 0;
      while (c === 0) c = randInt(r, -3, 4);
      return c;
    };
    let legs: V2[] = [];
    for (let t = 0; t < 50; t++) {
      legs = [0, 1, 2].map(() => [comp(), comp()] as V2);
      const s = legs.reduce(add, [0, 0] as V2);
      if (Math.abs(s[0]) <= 6 && Math.abs(s[1]) <= 4 && !eqV(s, [0, 0])) break;
    }
    const single = pick(r, [[3, 4], [-4, 3], [2, 5], [-3, -2], [4, -4], [-1, 5], [5, 2]] as V2[]);
    let u: V2 = [2, 1];
    let w: V2 = [-1, 2];
    let k1 = 2;
    let k2 = -1;
    for (let t = 0; t < 80; t++) {
      u = [randInt(r, -2, 3), randInt(r, -2, 2)];
      w = [randInt(r, -2, 2), randInt(r, -2, 3)];
      k1 = pick(r, [2, 3, -1, -2]);
      k2 = pick(r, [1, -1, 2, -2]);
      const res = add(sc(k1, u), sc(k2, w));
      if (norm(u) > 0 && norm(w) > 0 && Math.abs(res[0]) <= 6 && Math.abs(res[1]) <= 4 && Math.abs(u[0] * w[1] - u[1] * w[0]) > 0) break;
    }
    return { legs, single, u, w, k1, k2 };
  }, [seed, round]);
  const [pt, setPt] = useState<V2>([0, 0]);
  const [val, setVal] = useState('');
  const onDrag = useSvgDrag(svg, (x, y) => setPt(snap(P, x, y)));
  const { legs, single, u, w, k1, k2 } = data;
  const sum = legs.reduce(add, [0, 0] as V2);
  const combo = add(sc(k1, u), sc(k2, w));
  const coef = (k: number, s: string, first: boolean) => (k === 1 ? (first ? '' : '+') : k === -1 ? '-' : k > 0 && !first ? `+${k}` : `${k}`) + s;
  const comboTex = `${coef(k1, '\\vec u', true)}${coef(k2, '\\vec v', false)}`;

  useEffect(() => {
    setPt([0, 0]);
    setVal('');
    if (round === 0) {
      api.prompt('Bitácora del M-7 desde la estación Puerto (el origen). Arrastra el marcador al punto donde terminó tras los tres tramos.', '\\vec a+\\vec b+\\vec c');
      api.hints(['Suma por separado las primeras componentes y las segundas.', `La primera componente es $${legs.map((v) => n(v[0])).join('+').replace(/\+-/g, '-')}$.`]);
    } else if (round === 1) {
      api.prompt('Un tramo de vía en línea recta. ¿Cuántos kilómetros mide? (Dos decimales si no es exacto.)', '\\|\\vec v\\|=\\sqrt{v_1^2+v_2^2}');
      api.hints(['Las componentes son los catetos.', `$\\sqrt{${n(single[0])}^2+${n(single[1])}^2}$`.replace(/(-\d+)\^2/g, '($1)^2')]);
    } else {
      api.prompt(`La grúa de vía combina dos movimientos. Arrastra el marcador al punto $${comboTex}$.`, `${comboTex}`);
      api.hints(['Primero multiplica cada vector por su número; después suma componente a componente.', `$${n(k1)}\\vec u=${texV(sc(k1, u))}$`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      const v = parseNum(val);
      if (v === null) return;
      const t = norm(single);
      if (Math.abs(v - t) < 0.011) return api.result(true, `$\\sqrt{${single[0] ** 2}+${single[1] ** 2}}=${n(t)}$ km.`);
      if (Math.abs(v - (Math.abs(single[0]) + Math.abs(single[1]))) < 0.01) return api.result(false, 'Sumaste las componentes: eso mide un camino en escalera. La flecha es la hipotenusa.');
      if (Math.abs(v - (single[0] ** 2 + single[1] ** 2)) < 0.01) return api.result(false, 'Falta la raíz cuadrada.');
      return api.result(false, 'Eleva al cuadrado cada componente, suma y saca raíz.');
    }
    const target = round === 0 ? sum : combo;
    if (eqV(pt, target)) return api.result(true, round === 0 ? `Terminó en $${txtV(sum)}$.` : `$${comboTex}=${texV(combo)}$.`);
    const bad = pt[0] !== target[0] ? 'primera' : 'segunda';
    if (round === 0) return api.result(false, `Tu punto es $${txtV(pt)}$. Revisa la ${bad} componente: suma esa componente de los tres tramos, con su signo.`);
    if (eqV(pt, add(u, w)) || eqV(pt, add(sc(k1, u), w))) return api.result(false, 'Te faltó multiplicar algún vector por su número.');
    return api.result(false, `Tu punto es $${txtV(pt)}$. Revisa la ${bad} componente de $${n(k1)}\\vec u$ y de $${n(k2)}\\vec v$.`);
  };

  return (
    <Stage ref={svg}>
      <Grid P={P} opacity={0} />
      {round === 1 && (
        <>
          <Vec P={P} v={[single[0], 0]} color={C.amber} width={3} dashed />
          <Vec P={P} v={single} color={C.cyan} label="\vec v" />
          <Cap x={1360} y={260} size={26} color={C.text} tex={`\\vec v=${texV(single)}\\ \\text{km}`} />
          <NumberField x={1230} y={420} value={val} onChange={setVal} onEnter={submit} label="‖v‖ =" width={4} unit="km" />
        </>
      )}
      {round === 0 &&
        legs.map((v, i) => <Cap key={i} x={1360} y={220 + i * 56} size={24} color={[C.cyan, C.amber, C.magenta][i]} tex={`${['\\vec a', '\\vec b', '\\vec c'][i]}=(${n(v[0])},\\,${n(v[1])})`} />)}
      {round === 2 && (
        <>
          <Vec P={P} v={u} color={C.cyan} label="\vec u" off={[16, 24]} />
          <Vec P={P} v={w} color={C.amber} label="\vec v" off={[-26, -12]} />
          <Cap x={1360} y={230} size={24} color={C.cyan} tex={`\\vec u=(${n(u[0])},\\,${n(u[1])})`} />
          <Cap x={1360} y={286} size={24} color={C.amber} tex={`\\vec v=(${n(w[0])},\\,${n(w[1])})`} />
        </>
      )}
      {round !== 1 && (
        <>
          <Dot x={P.x(0)} y={P.y(0)} r={8} color={C.text} />
          <Knob x={P.x(pt[0])} y={P.y(pt[1])} color={C.green} onPointerDown={onDrag} r={14} />
          <Cap x={1360} y={460} size={24} color={C.green} tex={`\\text{marcador: }${txtV(pt)}`} />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w4-c1',
  world: 'linear',
  code: '4.1',
  title: 'Desplazamientos',
  subtitle: 'Vectores',
  glyph: '\\vec v',
  kind: 'level',
  guide: 'lucia',
  teaser: 'Hace tres semanas que un tren de mantención, el M-7, sale de noche sin estar programado. Su GPS solo guarda desplazamientos, y hay que sumarlos para saber adónde fue.',
  learn: 'Vectores como flechas y como pares de números: componentes, norma, suma, producto por escalar y el vector entre dos puntos.',
  glyphs: ['vec', 'vnorm'],
  pitfalls: ['Un vector no tiene posición fija: la misma flecha trasladada es el mismo vector.', 'La norma no es la suma de las componentes: $\\|(3,4)\\|=5$, no $7$.', 'El vector de $P$ a $Q$ es $Q-P$ (punta menos cola), no $P-Q$.'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Centro de control del Metro de Valparaíso, una y cuarenta de la madrugada. Quedaba una sola controladora en la sala, y en las otras sillas colgaban abrigos de gente que ya se había ido.' },
        { who: 'lucia', text: 'Lucía Ferrada, controladora de turno. Hace tres semanas que el M-7 sale de noche sin estar programado, y si abro su registro, mi nombre queda en la consulta.' },
        { who: 'iris', text: 'El servidor que intentó reabrir la válvula de la represa está en este mismo edificio. Tu nombre ya está cerca de esa historia, abras o no el registro.' },
        { who: 'lucia', text: 'La bitácora dice que vuelve al Taller El Salto, pero el GPS solo guarda cuánto se movió en cada tramo. Ayúdenme a ubicarlo antes de que termine mi turno.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Los tramos del M-7',
      Scene: TripDemo,
      beats: [
        {
          say: 'El M-7 sale de la estación Puerto, que tomamos como origen. Su primer tramo es el vector $\\vec a$, en kilómetros.',
          dur: 1.6,
          note: { label: 'Tramos del M-7', tex: '\\vec a=(4,1),\\ \\vec b=(2,2),\\ \\vec c=(-3,1)' },
        },
        {
          say: 'Los tramos se encadenan: cada uno parte donde terminó el anterior.',
          ask: { prompt: '¿Dónde terminó el M-7?', options: ['(3, 4): Cocheras Barón', '(6, 0): Taller El Salto', '(9, 4): fuera de la red'], answer: 0, explain: 'Componente a componente: $4+2-3=3$ y $1+2+1=4$.' },
          note: { label: 'Desplazamiento total', tex: '\\vec a+\\vec b+\\vec c=(3,4)' },
        },
        {
          say: 'El registro oficial dice que terminó en el Taller El Salto, en $(6,0)$. Para eso le falta un tramo que el GPS no tiene.',
          ask: { prompt: '¿Qué tramo llevaría de las cocheras al taller?', options: ['(3, −4)', '(−3, 4)', '(9, 4)'], answer: 0, explain: 'Punta menos cola: $(6,0)-(3,4)=(3,-4)$. Mide $\\sqrt{9+16}=5$ km y no aparece en la bitácora.' },
          note: { label: 'Tramo inventado', tex: '(6,0)-(3,4)=(3,-4)', body: 'Cinco kilómetros que el M-7 nunca recorrió.' },
        },
      ],
    },
    { kind: 'challenge', title: 'La bitácora', Comp: Logbook, rounds: 3 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'lucia', text: 'El recorrido termina en (3, 4), en las Cocheras Barón. Según mi jefe, están cerradas desde 2071.' },
        { who: 'teo', text: 'Para volver al Taller El Salto le faltaría el tramo (3, −4), 5 km que el GPS nunca guardó.' },
        { who: 'tu', text: 'Guarda la versión del GPS y también la del registro. Nos van a pedir las dos.' },
        { who: 'iris', text: 'Una cochera cerrada desde 2071 no debería necesitar corriente. Vale la pena ir a ver si la tiene.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'vec', world: 'linear', tex: '\\vec v', name: 'Vector', read: 've vector', meaning: 'Flecha con tamaño y dirección; en el plano se describe con sus componentes $(v_1,v_2)$.' },
  { id: 'vnorm', world: 'linear', tex: '\\|\\vec v\\|', name: 'Norma', read: 'norma de ve', meaning: 'Longitud del vector: $\\sqrt{v_1^2+v_2^2}$ (Pitágoras).' },
];
