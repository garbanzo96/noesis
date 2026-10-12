import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import { Arrow } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap, NumberLine, lineMap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { DotPlot, mean, num, sd, sum, variance } from './kit';

// ============================================================================
// CASO 6.3 · «Demasiado parejo» — medidas de dispersión
// Rango; desviaciones (suman cero); varianza; desviación estándar; efecto de sumar o
// multiplicar; varianza muestral con n − 1.
// ============================================================================

const TIGHT = [17, 18, 19, 20, 20, 21, 22, 23];
const WIDE = [5, 9, 14, 20, 22, 27, 30, 33];
const D = [2, 4, 4, 4, 5, 5, 7, 9];

// ---------------------------------------------------------------- lesson
function SpreadLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState([8, 9, 10, 11, 12]);
  const active = useRef(0);
  const XG = lineMap(0, 20, 300, 1100);
  const onPt = (k: number) => (e: React.PointerEvent) => {
    active.current = k;
    drag(e);
  };
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - 300) / 800) * 20, 0, 20));
    setPts((o) => {
      const n = o.map((t, i) => (i === active.current ? v : t));
      if (sd(n) > 3) unlock();
      return n;
    });
  });
  if (beat === 0) {
    const XA = lineMap(0, 40, 300, 1100);
    return (
      <Stage>
        {[TIGHT, WIDE].map((xs, i) => (
          <g key={i} opacity={clamp(at(0) * 2 - i * 0.5, 0, 1)}>
            <DotPlot X={XA} y={330 + i * 260} xs={xs} r={12} color={i ? C.magenta : C.cyan} />
            <NumberLine X={XA} y={340 + i * 260} lo={0} hi={40} step={5} />
            <line x1={XA(20)} x2={XA(20)} y1={230 + i * 260} y2={340 + i * 260} stroke={C.green} strokeWidth={3} strokeDasharray="6 6" />
            <Cap x={1330} y={300 + i * 260} size={22} color={i ? C.magenta : C.cyan} tex={`\\bar x=20,\\ R=${Math.max(...xs) - Math.min(...xs)}`} />
          </g>
        ))}
      </Stage>
    );
  }
  if (beat === 4) {
    const m = mean(pts);
    const s = sd(pts);
    return (
      <Stage ref={svg}>
        <rect x={XG(m - s)} y={300} width={XG(m + s) - XG(m - s)} height={180} fill={C.violet} opacity={0.18} />
        <line x1={XG(m)} x2={XG(m)} y1={280} y2={480} stroke={C.green} strokeWidth={3} />
        {pts.map((p, k) => (
          <Knob key={k} x={XG(p)} y={440 - k * 30} color={C.amber} onPointerDown={onPt(k)} r={13} cursor="ew-resize" />
        ))}
        <NumberLine X={XG} y={500} lo={0} hi={20} step={2} />
        <Cap x={1370} y={260} size={24} color={C.green} tex={`\\bar x=${num(m, 1)}`} />
        <Cap x={1370} y={320} size={24} color={s > 3 ? C.green : C.violet} tex={`\\sigma=${num(s, 2)}`} />
        <Cap x={1370} y={380} size={18} color={C.muted}>banda: media ± σ</Cap>
      </Stage>
    );
  }
  // beats 1–3 and 5: one row per datum, deviations from the mean
  const XD = lineMap(0, 10, 300, 900);
  const m = mean(D);
  const devs = D.map((x) => x - m);
  return (
    <Stage>
      <line x1={XD(m)} x2={XD(m)} y1={150} y2={560} stroke={C.green} strokeWidth={3} strokeDasharray="8 6" />
      <Cap x={XD(m)} y={130} size={20} color={C.green} tex="\bar x=5" />
      {D.map((x, i) => {
        const y = 180 + i * 48;
        const d = devs[i];
        return (
          <g key={i}>
            {d !== 0 && <Arrow from={[XD(m), y]} to={[XD(x), y]} color={d > 0 ? C.green : C.red} width={3} progress={beat === 1 ? at(1) : 1} />}
            <circle cx={XD(x)} cy={y} r={10} fill={C.amber} />
            {beat >= 2 && (
              <>
                <rect x={1000} y={y - 12} width={d * d * 22 * (beat === 2 ? at(2) : 1)} height={24} fill={C.violet} opacity={0.6} />
                <Cap x={980} y={y} size={16} color={C.muted} anchor="right" tex={`(${num(d)})^2`} />
              </>
            )}
            {beat === 1 && <Cap x={XD(x) + (d >= 0 ? 34 : -34)} y={y} size={16} color={d > 0 ? C.green : d < 0 ? C.red : C.muted} tex={num(d)} />}
          </g>
        );
      })}
      <NumberLine X={XD} y={580} lo={0} hi={10} step={1} />
      {beat === 1 && <Cap x={1300} y={300} size={22} color={C.text} tex={`\\sum(x_i-\\bar x)=${num(sum(devs))}`} opacity={at(1)} />}
      {beat >= 2 && <Cap x={1300} y={600} size={22} color={C.violet} tex={`\\sigma^2=\\tfrac{${sum(devs.map((d) => d * d))}}{8}=${num(variance(D))}`} />}
      {(beat === 3 && answer !== null) || beat === 5 ? <rect x={XD(m - 2)} y={150} width={XD(m + 2) - XD(m - 2)} height={410} fill={C.violet} opacity={0.12} /> : null}
      {beat === 3 && answer !== null && <Cap x={1300} y={650} size={22} color={C.green} tex="\sigma=\sqrt4=2" />}
      {beat === 5 && <Cap x={1300} y={650} size={22} color={C.amber} tex={`s^2=\\tfrac{32}{7}\\approx${num(variance(D, true))}`} />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Medidas de dispersión',
  Scene: SpreadLesson,
  beats: [
    {
      say: 'Estos dos grupos tienen la misma media, 20, y son muy distintos: uno apretado y otro desparramado. Hace falta medir la **dispersión**. La más simple es el **rango**: el mayor menos el menor.',
      dur: 3,
      board: { label: 'Rango', tex: 'R=\\p{1}{x_{\\max}}-\\p{2}{x_{\\min}}', body: 'Fácil, pero depende solo de dos datos.' },
    },
    {
      say: 'Mejor: mirar cuánto se aleja **cada** dato de la media, su **desviación**. Pero las desviaciones siempre suman cero: las de arriba compensan exactamente las de abajo.',
      dur: 3,
      board: { label: 'Desviaciones', tex: '\\p{1}{x_i-\\bar x},\\qquad \\p{2}{\\sum_i(x_i-\\bar x)=0}' },
    },
    {
      say: 'Para que no se cancelen, se elevan al cuadrado: todas quedan positivas y las grandes pesan más. Su promedio es la **varianza**.',
      dur: 3,
      board: { label: 'Varianza', tex: '\\sigma^2=\\frac{1}{\\p{2}{n}}\\p{1}{\\sum_{i=1}^n(x_i-\\bar x)^2}' },
    },
    {
      say: 'La varianza queda en unidades al cuadrado. Su raíz, la **desviación estándar**, vuelve a las unidades de los datos: es una distancia típica a la media.',
      ask: { prompt: 'Aquí $\\sigma^2=4$. ¿Cuánto vale la desviación estándar?', options: ['2', '4', '16'], answer: 0, explain: '$\\sigma=\\sqrt4=2$: los datos se alejan típicamente unas 2 unidades de la media 5.' },
      board: { label: 'Desviación estándar', tex: '\\sigma=\\sqrt{\\sigma^2}' },
    },
    {
      say: 'Pruébalo: separa los datos y mira crecer la banda $\\bar x\\pm\\sigma$. Mover todos juntos no cambia $\\sigma$; alejarlos entre sí, sí.',
      gate: 'Arrastra los puntos hasta que la desviación estándar supere 3.',
      board: { label: 'Sumar y multiplicar', tex: '\\sigma_{x+c}=\\p{1}{\\sigma_x},\\qquad \\sigma_{k x}=\\p{2}{|k|\\,\\sigma_x}', body: 'Sumar una constante a todos los datos no cambia la dispersión; multiplicarlos por $k$ la multiplica por $|k|$.' },
    },
    {
      say: 'Con una **muestra** (no toda la población) se divide por $n-1$. La media de la muestra está, por construcción, en medio de sus propios datos, y dividir por $n$ subestimaría la dispersión real.',
      dur: 3.4,
      board: { label: 'Varianza muestral', tex: 's^2=\\frac{1}{\\p{1}{n-1}}\\sum_{i=1}^n(x_i-\\bar x)^2', body: 'Y la desviación estándar muestral es $s=\\sqrt{s^2}$.' },
    },
  ],
};

// ---------------------------------------------------------------- demo
const NORTE = [12, 25, 18, 30, 15, 22, 28, 10];
const CERRO = [20, 19, 21, 20, 20, 21, 19, 20];

function TwoClinics({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const XC = lineMap(5, 35, 300, 1100);
  const showS = beat >= 2 || (beat === 1 && answer !== null);
  return (
    <Stage>
      {[NORTE, CERRO].map((xs, i) => {
        const s = sd(xs);
        return (
          <g key={i} opacity={beat === 0 ? clamp(at(0) * 2 - i * 0.5, 0, 1) : 1}>
            {showS && <rect x={XC(20 - s)} y={200 + i * 270} width={XC(20 + s) - XC(20 - s)} height={130} fill={C.violet} opacity={0.18} />}
            <DotPlot X={XC} y={330 + i * 270} xs={xs} r={12} color={i ? C.magenta : C.cyan} />
            <NumberLine X={XC} y={340 + i * 270} lo={5} hi={35} step={5} />
            <Cap x={300} y={190 + i * 270} size={20} color={i ? C.magenta : C.cyan} anchor="left">
              {i ? 'Clínica del Cerro' : 'Clínica Norte'}
            </Cap>
            <Cap x={1330} y={290 + i * 270} size={22} color={C.text} tex={`\\bar x=${num(mean(xs))}${showS ? `,\\ \\sigma\\approx${num(s, 1)}` : ''}`} />
          </g>
        );
      })}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Spread({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 47 + round);
    let xs: number[] = [];
    for (let t = 0; t < 100; t++) {
      xs = Array.from({ length: round === 1 ? 4 : 5 }, () => randInt(r, 2, 20));
      if (Number.isInteger(mean(xs))) break;
    }
    const s0 = pick(r, [3, 4, 5, 6, 8]);
    const k = pick(r, [2, 3, -2, 0.5]);
    const c = pick(r, [5, 10, -4, 100]);
    return { xs, s0, k, c };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { xs, s0, k, c } = data;
  const XC = lineMap(0, 22, 300, 1100);

  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt('Dosis de cinco días. Calcula la desviación estándar (de estos cinco datos, dividiendo por $n$). Dos decimales.', '\\sigma=\\sqrt{\\tfrac1n\\sum(x_i-\\bar x)^2}');
      api.hints([`La media es ${num(mean(xs))}.`, 'Eleva al cuadrado cada desviación, promedia y saca raíz.']);
    } else if (round === 1) {
      api.prompt('Cuatro días tomados al azar de un registro largo: es una muestra. Calcula la varianza muestral $s^2$. Dos decimales.', 's^2=\\tfrac{1}{n-1}\\sum(x_i-\\bar x)^2');
      api.hints([`La media es ${num(mean(xs))}.`, 'Suma los cuadrados de las desviaciones y divide por $n-1=3$.']);
    } else {
      const op = k === 0.5 ? 'se divide por 2' : `se multiplica por ${k}`;
      api.prompt(`Las dosis diarias tienen $\\sigma=${s0}$. Si cada dato ${op} y después se le suma ${c}, ¿cuál es la nueva desviación estándar?`, '\\sigma_{kx+c}=|k|\\,\\sigma_x');
      api.hints(['Sumar una constante no cambia la dispersión.', 'Multiplicar por $k$ la multiplica por $|k|$.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const ss = sum(xs.map((x) => (x - mean(xs)) ** 2));
    if (round === 0) {
      const t = sd(xs);
      if (Math.abs(v - t) < 0.011) return api.result(true, `$\\sigma=\\sqrt{\\tfrac{${num(ss)}}{5}}\\approx${num(t)}$.`);
      if (Math.abs(v - variance(xs)) < 0.011) return api.result(false, 'Esa es la varianza. Falta la raíz cuadrada.');
      if (Math.abs(v - sd(xs, true)) < 0.011) return api.result(false, 'Dividiste por $n-1$. Aquí se pide dividir por $n=5$.');
      return api.result(false, `La suma de los cuadrados de las desviaciones es ${num(ss)}.`);
    }
    if (round === 1) {
      const t = variance(xs, true);
      if (Math.abs(v - t) < 0.011) return api.result(true, `$s^2=\\tfrac{${num(ss)}}{3}\\approx${num(t)}$.`);
      if (Math.abs(v - variance(xs)) < 0.011) return api.result(false, 'Dividiste por $n$. En una muestra se divide por $n-1$.');
      if (Math.abs(v - sd(xs, true)) < 0.011) return api.result(false, 'Esa es $s$. Se pide la varianza $s^2$, sin raíz.');
      return api.result(false, `La suma de los cuadrados de las desviaciones es ${num(ss)}.`);
    }
    const t = Math.abs(k) * s0;
    if (Math.abs(v - t) < 0.01) return api.result(true, `$|${k === 0.5 ? '\\tfrac12' : k}|\\cdot${s0}=${num(t)}$. La suma de ${c} solo desplaza los datos.`);
    if (Math.abs(v - (t + c)) < 0.01 || Math.abs(v - (k * s0 + c)) < 0.01) return api.result(false, `Sumar ${c} mueve todos los datos juntos: no cambia la dispersión.`);
    if (Math.abs(v - k * s0) < 0.01) return api.result(false, 'Una desviación estándar no puede ser negativa: usa $|k|$.');
    return api.result(false, `Solo importa el factor: $|k|\\cdot\\sigma$.`);
  };

  return (
    <Stage>
      {round < 2 && (
        <>
          <DotPlot X={XC} y={460} xs={xs} r={13} color={C.amber} />
          <NumberLine X={XC} y={470} lo={0} hi={22} step={2} />
          <Cap x={700} y={260} size={32} color={C.text} tex={xs.join(',\\ ')} />
        </>
      )}
      {round === 2 && <Cap x={600} y={330} size={32} color={C.text} tex={`\\sigma_x=${s0}\\qquad y=${k === 0.5 ? '\\tfrac{x}{2}' : `${k}x`}${c > 0 ? '+' : ''}${c}`} />}
      <NumberField x={1180} y={360} value={val} onChange={setVal} onEnter={submit} label={round === 1 ? 's² =' : 'σ ='} width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c3',
  world: 'statistics',
  code: '6.3',
  title: 'Demasiado parejo',
  subtitle: 'Medidas de dispersión',
  glyph: '\\sigma',
  kind: 'level',
  guide: 'iris',
  teaser: 'Dos clínicas con el mismo promedio diario. Una tiene días buenos y malos, como cualquier registro real. La otra, casi ninguna variación.',
  learn: 'Rango, desviaciones, varianza, desviación estándar, efecto de transformaciones lineales y varianza muestral.',
  glyphs: ['st-var', 'st-sd'],
  pitfalls: ['Las desviaciones suman cero: por eso se elevan al cuadrado.', 'La desviación estándar es la raíz de la varianza y tiene las unidades de los datos.', 'Con una muestra se divide por $n-1$.'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'iris', text: 'La Clínica Norte también vacunó a mayores, la misma campaña. ¿Cómo son sus días?' },
        { who: 'ana', text: 'Saqué ocho días de cada clínica. Mismo promedio: 20 dosis diarias.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Dos clínicas',
      Scene: TwoClinics,
      beats: [
        {
          say: 'Dosis diarias de ocho días en cada clínica.',
          dur: 2,
          note: { label: 'Misma media', tex: '\\bar x_N=\\bar x_C=20' },
        },
        {
          say: 'El promedio no las distingue. La dispersión, sí.',
          ask: { prompt: '¿Cuál tiene mayor desviación estándar?', options: ['Norte, $\\sigma\\approx7$', 'Cerro, $\\sigma\\approx7$', 'Son iguales'], answer: 0, explain: 'En la Norte las desviaciones van de $-10$ a $+10$: $\\sigma\\approx6{,}9$. En el Cerro casi todas son 0 o $\\pm1$: $\\sigma\\approx0{,}7$.' },
          note: { label: 'Desviaciones estándar', tex: '\\sigma_N\\approx6{,}9,\\quad \\sigma_C\\approx0{,}7' },
        },
        {
          say: 'Un registro real cambia de un día a otro: lluvia, feriados, turnos, gente que no llega.',
          ask: { prompt: '¿Qué sugiere $\\sigma_C\\approx0{,}7$?', options: ['Que esos días se escribieron a mano para cuadrar con el promedio', 'Que la clínica del Cerro es más eficiente', 'Nada en particular'], answer: 0, explain: 'Ocho días seguidos entre 19 y 21 dosis es demasiado regular. Los datos inventados suelen tener muy poca dispersión.' },
          note: { label: 'Demasiado parejo', tex: '\\sigma_C\\ll\\sigma_N', body: 'Datos fabricados para que el promedio cuadre.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir la dispersión', Comp: Spread, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'ana', text: 'Alguien rellenó esos días con números parecidos al promedio. Pero dejó el total semanal intacto.' },
        { who: 'iris', text: 'Entonces comparemos ese total con el de todas las clínicas de la región.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'st-var', world: 'statistics', tex: '\\sigma^2,\\ s^2', name: 'Varianza', read: 'sigma cuadrado, ese cuadrado', meaning: 'Promedio de los cuadrados de las desviaciones a la media (con $n-1$ en una muestra).' },
  { id: 'st-sd', world: 'statistics', tex: '\\sigma,\\ s', name: 'Desviación estándar', read: 'sigma, ese', meaning: 'Raíz de la varianza: distancia típica de los datos a la media, en sus unidades.' },
];
