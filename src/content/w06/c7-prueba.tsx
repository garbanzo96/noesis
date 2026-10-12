import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Curve } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { Phi, Shade, num, pdf } from './kit';

// ============================================================================
// CASO 6.7 · «La prueba» — pruebas de hipótesis (una proporción)
// H0 y H1; la proporción como media de ceros y unos; estadístico z; valor p como área de
// cola; decisión con α; errores de tipo I y II.
// ============================================================================

const PZ = plane([-4, 4], [0, 0.45], { x: 300, y: 170, w: 840, h: 400 });
const RECS = [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1];

// ---------------------------------------------------------------- lesson
function TestLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [z, setZ] = useState(-1);
  const onZ = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(PZ.inv(x, 0)[0], -3.8, 0) * 20) / 20;
    setZ(v);
    if (Phi(v) < 0.05) unlock();
  });
  if (beat === 0) {
    return (
      <Stage>
        {[0, 1].map((i) => (
          <g key={i} opacity={clamp(at(0) * 2 - i, 0, 1)}>
            <rect x={340 + i * 470} y={240} width={400} height={220} rx={14} fill={C.panel} stroke={i ? C.magenta : C.cyan} strokeWidth={3} />
            <Cap x={540 + i * 470} y={290} size={26} color={i ? C.magenta : C.cyan} tex={i ? 'H_1' : 'H_0'} />
            <Cap x={540 + i * 470} y={350} size={20} color={C.text}>
              {i ? 'lo que sospechamos' : 'la afirmación, supuesta cierta'}
            </Cap>
            <Cap x={540 + i * 470} y={400} size={22} color={C.muted} tex={i ? 'p<0{,}95' : 'p=0{,}95'} />
          </g>
        ))}
        <Cap x={775} y={560} size={20} color={C.muted}>como en un juicio: inocente hasta que la evidencia diga lo contrario</Cap>
      </Stage>
    );
  }
  if (beat === 1) {
    return (
      <Stage>
        {RECS.map((v, k) => (
          <g key={k} opacity={clamp(at(1) * 20 - k * 0.6, 0, 1)}>
            <rect x={330 + (k % 10) * 80} y={250 + Math.floor(k / 10) * 110} width={60} height={80} rx={6} fill={C.panel} stroke={v ? C.green : C.red} strokeWidth={3} />
            <Cap x={360 + (k % 10) * 80} y={290 + Math.floor(k / 10) * 110} size={28} color={v ? C.green : C.red} tex={String(v)} />
          </g>
        ))}
        <Cap x={760} y={530} size={26} color={C.text} tex="\hat p=\tfrac{17}{20}=0{,}85" opacity={at(1)} />
        <Cap x={760} y={580} size={18} color={C.muted}>1 = vacunado · 0 = no vacunado: la proporción es la media de los unos y ceros</Cap>
      </Stage>
    );
  }
  if (beat === 5) {
    const cells = [
      ['', 'H₀ es cierta', 'H₀ es falsa'],
      ['se rechaza H₀', 'error tipo I (α)', 'acierto'],
      ['no se rechaza', 'acierto', 'error tipo II (β)'],
    ];
    return (
      <Stage>
        {cells.map((row, i) =>
          row.map((c, j) => (
            <g key={`${i}-${j}`} opacity={at(5)}>
              <rect x={330 + j * 280} y={220 + i * 110} width={270} height={100} fill={i && j ? (c.startsWith('error') ? '#2a0f1c' : '#0f2a1c') : C.panel} stroke={C.line} />
              <Cap x={465 + j * 280} y={270 + i * 110} size={20} color={c.startsWith('error') ? C.red : c === 'acierto' ? C.green : C.text}>
                {c}
              </Cap>
            </g>
          )),
        )}
      </Stage>
    );
  }
  const zz = beat === 3 ? z : -2;
  const pv = Phi(zz);
  return (
    <Stage ref={svg}>
      <Axes P={PZ} xTicks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]} xLabel="z" />
      {beat >= 3 && <Shade P={PZ} f={(x) => pdf(x)} a={-4} b={zz} color={pv < 0.05 ? C.magenta : C.violet} opacity={0.55} />}
      <Curve P={PZ} f={(x) => pdf(x)} a={-4} b={4} color={C.amber} width={4} />
      <line x1={PZ.x(zz)} x2={PZ.x(zz)} y1={PZ.box.y + 30} y2={PZ.y(0)} stroke={C.magenta} strokeWidth={3} />
      {beat === 3 && <Knob x={PZ.x(z)} y={PZ.y(0) + 40} color={C.magenta} onPointerDown={onZ} cursor="ew-resize" label={num(z, 2)} />}
      {beat === 2 && (
        <>
          <Cap x={1370} y={230} size={22} color={C.text} tex="p_0=0{,}9,\ n=100" />
          <Cap x={1370} y={280} size={22} color={C.text} tex="\hat p=0{,}84" />
          <Cap x={1370} y={340} size={22} color={C.amber} tex="\text{EE}=\sqrt{\tfrac{0{,}9\cdot0{,}1}{100}}=0{,}03" opacity={at(2)} />
          <Cap x={1370} y={400} size={22} color={C.magenta} tex="z=\tfrac{0{,}84-0{,}9}{0{,}03}=-2" opacity={at(2)} />
        </>
      )}
      {beat >= 3 && <Cap x={1370} y={260} size={24} color={pv < 0.05 ? C.magenta : C.violet} tex={`\\text{valor }p=${num(pv, 3)}`} />}
      {beat >= 3 && <Cap x={1370} y={320} size={20} color={C.muted} tex="\alpha=0{,}05" />}
      {beat === 4 && answer !== null && <Cap x={1370} y={390} size={22} color={C.green} tex="0{,}023<0{,}05:\ \text{se rechaza }H_0" />}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Pruebas de hipótesis',
  Scene: TestLesson,
  beats: [
    {
      say: 'Una **prueba de hipótesis** pone a prueba una afirmación con datos. Se parte suponiendo que la afirmación es cierta: es la **hipótesis nula** $H_0$. La **alternativa** $H_1$ es lo que sospechamos.',
      dur: 3.4,
      board: { label: 'Hipótesis', tex: '\\p{1}{H_0:\\ p=p_0}\\qquad \\p{2}{H_1:\\ p<p_0}' },
    },
    {
      say: 'Una proporción es una media de ceros y unos: se anota 1 si la ficha dice «vacunado» y 0 si no. Por eso valen las mismas herramientas que para la media; su error estándar es $\\sqrt{p(1-p)/n}$.',
      dur: 3.6,
      board: { label: 'Proporción muestral', tex: '\\hat p=\\frac{\\p{1}{\\#\\text{éxitos}}}{\\p{2}{n}},\\qquad \\text{EE}=\\p{3}{\\sqrt{\\frac{p_0(1-p_0)}{n}}}' },
    },
    {
      say: 'Si $H_0$ fuera cierta, ¿qué tan lejos podría caer $\\hat p$ solo por azar? Se mide en errores estándar: es el **estadístico de prueba** $z$.',
      dur: 3,
      board: { label: 'Estadístico de prueba', tex: 'z=\\frac{\\p{1}{\\hat p-p_0}}{\\p{2}{\\sqrt{p_0(1-p_0)/n}}}' },
    },
    {
      say: 'El **valor p** es la probabilidad de obtener un resultado al menos así de extremo si $H_0$ fuera cierta: el área de la cola más allá de $z$. Mientras más chico, más difícil de creer $H_0$.',
      gate: 'Mueve $z$ hasta que el valor p sea menor que 0,05.',
      board: { label: 'Valor p', tex: 'p=P(Z\\le z_{\\text{obs}}\\mid H_0)' },
    },
    {
      say: 'Regla de decisión: si el valor p es menor que el **nivel de significación** $\\alpha$ (habitualmente 0,05), se **rechaza** $H_0$. Si no, no se rechaza, lo que no prueba que $H_0$ sea cierta.',
      ask: { prompt: 'Valor p 0,023 con $\\alpha=0{,}05$. ¿Qué se decide?', options: ['Se rechaza $H_0$', 'No se rechaza $H_0$', 'Se demuestra $H_0$'], answer: 0, explain: '$0{,}023<0{,}05$: un resultado así sería muy raro si $H_0$ fuera cierta.' },
      board: { label: 'Decisión', tex: '\\text{valor }p<\\alpha\\ \\Rightarrow\\ \\text{rechazar }H_0' },
    },
    {
      say: 'Hay dos formas de equivocarse: rechazar una $H_0$ verdadera (**error tipo I**, con probabilidad $\\alpha$) o no rechazar una falsa (**error tipo II**).',
      dur: 3,
      board: { label: 'Errores', tex: '\\alpha=P(\\text{tipo I}),\\quad \\beta=P(\\text{tipo II})' },
    },
  ],
};

// ---------------------------------------------------------------- demo
function CoverageDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const zObs = (0.89 - 0.95) / Math.sqrt((0.95 * 0.05) / 400);
  const PD = plane([-7, 4], [0, 0.45], { x: 300, y: 170, w: 840, h: 400 });
  const shown = beat >= 2 && answer !== null;
  return (
    <Stage>
      <Axes P={PD} xTicks={[-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4]} xLabel="z" />
      <Curve P={PD} f={(x) => pdf(x)} a={-7} b={4} color={C.amber} width={4} progress={beat === 0 ? at(0) : 1} />
      <Shade P={PD} f={(x) => pdf(x)} a={-7} b={-1.645} color={C.violet} opacity={0.4} />
      <Cap x={PD.x(-2.6)} y={PD.y(0.12)} size={16} color={C.violet} tex="5\,\%" />
      {shown && <line x1={PD.x(zObs)} x2={PD.x(zObs)} y1={PD.box.y + 40} y2={PD.y(0)} stroke={C.magenta} strokeWidth={4} />}
      <Cap x={1370} y={230} size={22} color={C.text} tex="H_0:\ p=0{,}95" />
      <Cap x={1370} y={280} size={22} color={C.text} tex="n=400" />
      {beat >= 1 && (beat > 1 || answer !== null) && <Cap x={1370} y={330} size={22} color={C.cyan} tex="\hat p=\tfrac{356}{400}=0{,}89" />}
      {shown && <Cap x={1370} y={390} size={22} color={C.magenta} tex={`z\\approx${num(zObs, 1)}`} />}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
type Dec = 'Rechazar H₀' | 'No rechazar H₀';
type Err = 'Error tipo I' | 'Error tipo II' | 'Decisión correcta';

function Tests({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 67 + round);
    const p0 = pick(r, [0.5, 0.8, 0.9, 0.95]);
    const n = pick(r, [100, 200, 400]);
    const x = Math.round(n * (p0 - randInt(r, 1, 8) / 100));
    const zObs = pick(r, [-0.8, -1.2, -1.5, -1.9, -2.1, -2.5, -3.1]);
    const alpha = pick(r, [0.05, 0.01]);
    const truth = pick(r, [true, false]);
    const rej = pick(r, [true, false]);
    return { p0, n, x, zObs, alpha, truth, rej };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [dec, setDec] = useState<Dec | null>(null);
  const [err, setErr] = useState<Err | null>(null);
  const { p0, n, x, zObs, alpha, truth, rej } = data;
  const crit = alpha === 0.05 ? -1.645 : -2.326;

  useEffect(() => {
    setVal('');
    setDec(null);
    setErr(null);
    if (round === 0) {
      api.prompt(`La clínica afirma que el ${Math.round(p0 * 100)} % de sus inscritos se vacunó. En ${n} fichas al azar hay ${x} vacunados. Calcula el estadístico z. (Dos decimales.)`, 'z=\\frac{\\hat p-p_0}{\\sqrt{p_0(1-p_0)/n}}');
      api.hints([`$\\hat p=${x}/${n}=${num(x / n, 4)}$.`, `$\\text{EE}=\\sqrt{${num(p0)}\\cdot${num(1 - p0)}/${n}}\\approx${num(Math.sqrt((p0 * (1 - p0)) / n), 4)}$.`]);
    } else if (round === 1) {
      api.prompt(`Prueba de una cola ($H_1: p<p_0$) con $\\alpha=${num(alpha)}$. El estadístico dio $z=${num(zObs, 1)}$. ¿Qué se decide?`, `z_{\\text{crít}}=${num(crit, 3)}`);
      api.hints([`El valor p es $\\Phi(${num(zObs, 1)})\\approx${num(Phi(zObs), 3)}$.`, 'Se rechaza si el valor p es menor que $\\alpha$ (equivalente: si $z$ cae más allá del valor crítico).']);
    } else {
      api.prompt(`En realidad, la clínica ${truth ? 'sí' : 'no'} vacunó al ${Math.round(p0 * 100)} % ($H_0$ ${truth ? 'cierta' : 'falsa'}), y la prueba ${rej ? 'rechazó' : 'no rechazó'} $H_0$. ¿Qué ocurrió?`, '');
      api.hints(['Rechazar una $H_0$ verdadera es el error tipo I.', 'No rechazar una $H_0$ falsa es el error tipo II.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (!dec) return;
      const should: Dec = Phi(zObs) < alpha ? 'Rechazar H₀' : 'No rechazar H₀';
      if (dec === should) return api.result(true, `Valor p $\\approx${num(Phi(zObs), 3)}$ ${should === 'Rechazar H₀' ? '<' : '\\ge'} ${num(alpha)}.`);
      return api.result(false, `El valor p es $\\approx${num(Phi(zObs), 3)}$; compáralo con $\\alpha=${num(alpha)}$.`);
    }
    if (round === 2) {
      if (!err) return;
      const right: Err = truth && rej ? 'Error tipo I' : !truth && !rej ? 'Error tipo II' : 'Decisión correcta';
      if (err === right) return api.result(true, right === 'Decisión correcta' ? 'La prueba acertó.' : `${right}.`);
      return api.result(false, `$H_0$ era ${truth ? 'cierta' : 'falsa'} y se ${rej ? 'rechazó' : 'mantuvo'}: revisa la tabla de errores.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    const ph = x / n;
    const se0 = Math.sqrt((p0 * (1 - p0)) / n);
    const t = (ph - p0) / se0;
    if (Math.abs(v - t) < 0.011) return api.result(true, `$z=\\tfrac{${num(ph, 4)}-${num(p0)}}{${num(se0, 4)}}\\approx${num(t)}$.`);
    const seHat = Math.sqrt((ph * (1 - ph)) / n);
    if (Math.abs(v - (ph - p0) / seHat) < 0.011) return api.result(false, 'Usaste $\\hat p$ en el error estándar. En la prueba se usa $p_0$: se supone $H_0$ cierta.');
    if (Math.abs(v + t) < 0.011) return api.result(false, 'El signo: es $\\hat p-p_0$.');
    return api.result(false, `$\\hat p=${num(ph, 4)}$ y $\\text{EE}=${num(se0, 4)}$.`);
  };

  return (
    <Stage>
      <Axes P={PZ} xTicks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]} xLabel="z" />
      {round === 1 && <Shade P={PZ} f={(t) => pdf(t)} a={-4} b={crit} color={C.violet} opacity={0.45} />}
      <Curve P={PZ} f={(t) => pdf(t)} a={-4} b={4} color={C.amber} width={4} />
      {round === 1 && <line x1={PZ.x(zObs)} x2={PZ.x(zObs)} y1={PZ.box.y + 40} y2={PZ.y(0)} stroke={C.magenta} strokeWidth={4} />}
      {round === 0 && <NumberField x={1180} y={360} value={val} onChange={setVal} onEnter={submit} label="z =" width={4} />}
      {round === 1 && <Choices x={1300} y={360} options={['Rechazar H₀', 'No rechazar H₀'] as Dec[]} value={dec} onPick={setDec} />}
      {round === 2 && <Choices x={1300} y={300} options={['Error tipo I', 'Error tipo II', 'Decisión correcta'] as Err[]} value={err} onPick={setErr} />}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c7',
  world: 'statistics',
  code: '6.7',
  title: 'La prueba',
  subtitle: 'Pruebas de hipótesis',
  glyph: 'H_0',
  kind: 'level',
  guide: 'iris',
  teaser: 'El informe afirma que el 95 % de los inscritos se vacunó. Con 400 fichas al azar se puede poner esa cifra a prueba.',
  learn: 'Hipótesis nula y alternativa, proporción muestral, estadístico z, valor p, nivel de significación y errores de tipo I y II.',
  glyphs: ['st-h0', 'st-pval'],
  pitfalls: ['En el error estándar de la prueba se usa $p_0$, no $\\hat p$.', 'No rechazar $H_0$ no demuestra que sea cierta.', 'El valor p no es la probabilidad de que $H_0$ sea cierta: se calcula suponiendo que lo es.'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'nar', text: 'Archivo Regional, 16:00. La portada refleja la luz de la lámpara.' },
        { who: 'ana', text: '«95 % de los inscritos recibió su dosis»: así lo repiten los medios. Si lo discutimos, van a pedir las fichas.' },
        { who: 'iris', text: 'Cuatrocientas, elegidas al azar. Calculemos qué tan lejos caen de lo que afirman.' },
        { who: 'tu', text: 'Guardemos también las que dicen «no vacunado»; esos inscritos siguen esperando una explicación.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El 95 %',
      Scene: CoverageDemo,
      beats: [
        {
          say: 'Hipótesis nula: la cifra oficial es cierta. Alternativa: se vacunó menos. Con $\\alpha=0{,}05$, se rechaza si $z$ cae en el 5 % más bajo.',
          dur: 2,
          note: { label: 'Hipótesis', tex: 'H_0:\\ p=0{,}95,\\quad H_1:\\ p<0{,}95' },
        },
        {
          say: 'De las 400 fichas, 356 dicen «vacunado».',
          ask: { prompt: '¿Cuánto vale $\\hat p$?', options: ['0,89', '0,95', '356'], answer: 0, explain: '$356/400=0{,}89$: el 89 % de la muestra.' },
          note: { label: 'Muestra', tex: '\\hat p=\\tfrac{356}{400}=0{,}89' },
        },
        {
          say: 'Si $H_0$ fuera cierta, el error estándar sería $\\sqrt{0{,}95\\cdot0{,}05/400}\\approx0{,}0109$.',
          ask: { prompt: '¿Cuánto vale el estadístico $z$?', options: ['≈ −5,5', '≈ −0,06', '≈ −1,96'], answer: 0, explain: '$\\tfrac{0{,}89-0{,}95}{0{,}0109}\\approx-5{,}5$. El valor p es prácticamente cero: se rechaza $H_0$.' },
          note: { label: 'Estadístico', tex: 'z=\\tfrac{0{,}89-0{,}95}{0{,}0109}\\approx-5{,}5', body: 'Valor p prácticamente cero: se rechaza la cifra oficial.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Pruebas', Comp: Tests, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'teo', text: '356 de 400: el 89 % de la muestra. La distancia frente al 95 % da cerca de −5,5; se rechaza esa cifra oficial.' },
        { who: 'ana', text: 'Hay inscritos sin dosis y el informe los daba por cubiertos. Tengo que conservar sus fichas antes de que alguien las corrija.' },
        { who: 'iris', text: 'Comparemos las guías de entrada con lo registrado en cada clínica.' },
        { who: 'ana', text: 'Las guías llevan firmas de recepción. Ahí alguien tuvo las cajas en sus manos.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'st-h0', world: 'statistics', tex: 'H_0,\\ H_1', name: 'Hipótesis nula y alternativa', read: 'hache cero, hache uno', meaning: '$H_0$: la afirmación que se pone a prueba (se supone cierta). $H_1$: lo que se sospecha.' },
  { id: 'st-pval', world: 'statistics', tex: '\\text{valor }p', name: 'Valor p', read: 'valor pe', meaning: 'Probabilidad, suponiendo $H_0$, de un resultado al menos tan extremo como el observado.' },
];
