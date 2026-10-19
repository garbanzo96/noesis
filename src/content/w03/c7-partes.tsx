import { useEffect, useMemo, useState } from 'react';
import { clamp } from '../../engine/anim';
import { C } from '../../engine/palette';
import { Group, Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng, shuffle } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder } from './kit';

// ============================================================================
// CASO 3.7 · «Por partes» — integración por partes
// La regla del producto al revés: ∫u dv = uv − ∫v du. Visual: el rectángulo uv se reparte en
// dos regiones bajo y sobre la curva (u, v). Elegir u lo que se simplifica al derivar.
// ============================================================================

// ---------------------------------------------------------------- lesson
function PartsLesson({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  if (beat === 0) {
    const k = at(0);
    return (
      <Stage>
        <Cap x={800} y={180} size={34} color={C.text} tex="(uv)'=u'v+uv'" />
        <Cap x={800} y={300} size={32} color={C.text} tex="uv=\int u'v\,dx+\int uv'\,dx" opacity={clamp(k * 3, 0, 1)} />
        <Cap x={800} y={430} size={36} color={C.amber} tex="\int u\,dv=uv-\int v\,du" opacity={clamp(k * 3 - 1.4, 0, 1)} />
      </Stage>
    );
  }
  if (beat === 1) {
    // the classic picture: curve from (u(a),v(a)) to (u(b),v(b))
    const P = plane([0, 5], [0, 4], { x: 380, y: 120, w: 700, h: 560 });
    const g = (u: number) => 0.5 + 0.12 * u * u;
    const ua = 1;
    const ub = 4.5;
    const k = at(1);
    return (
      <Stage>
        <Axes P={P} xTicks={[ua, ub]} yTicks={[g(ua), g(ub)]} xLabel="u" yLabel="v" grid={false} tickLabels={false} />
        <rect x={P.x(0)} y={P.y(g(ub))} width={P.x(ub) - P.x(0)} height={P.y(0) - P.y(g(ub))} fill="none" stroke={C.dim} strokeDasharray="6 6" />
        <Group opacity={clamp(k * 2, 0, 1)}>
          <AreaUnder P={P} f={g} a={ua} b={ub} pos={C.cyan} opacity={0.4} />
        </Group>
        <Group opacity={clamp(k * 2 - 1, 0, 1)}>
          <path d={`M${P.x(0)} ${P.y(g(ua))} L${P.x(ua)} ${P.y(g(ua))} ${Array.from({ length: 41 }, (_, i) => { const u = ua + ((ub - ua) * i) / 40; return `L${P.x(u)} ${P.y(g(u))}`; }).join(' ')} L${P.x(0)} ${P.y(g(ub))} Z`} fill={C.amber} opacity={0.4} />
        </Group>
        <Curve P={P} f={g} a={ua} b={ub} color={C.text} width={3} />
        <Cap x={P.x(2.8)} y={P.y(0.4)} size={22} color={C.cyan} tex="\int v\,du" opacity={clamp(k * 2, 0, 1)} />
        <Cap x={P.x(0.9)} y={P.y(2)} size={22} color={C.amber} tex="\int u\,dv" opacity={clamp(k * 2 - 1, 0, 1)} />
        <Cap x={1300} y={300} size={24} color={C.text} tex="u_bv_b-u_av_a" />
      </Stage>
    );
  }
  if (beat === 2) {
    const k = at(2);
    return (
      <Stage>
        <Cap x={800} y={160} size={32} color={C.text} tex="\int x\,e^x\,dx" />
        <Cap x={800} y={260} size={26} color={C.cyan} tex="u=x\Rightarrow du=dx,\qquad dv=e^x\,dx\Rightarrow v=e^x" opacity={clamp(k * 3, 0, 1)} />
        <Cap x={800} y={370} size={30} color={C.text} tex="=x\,e^x-\int e^x\,dx" opacity={clamp(k * 3 - 1, 0, 1)} />
        <Cap x={800} y={480} size={30} color={C.green} tex="=(x-1)\,e^x+C" opacity={clamp(k * 3 - 2, 0, 1)} />
      </Stage>
    );
  }
  return (
    <Stage>
      <Cap x={800} y={240} size={38} color={C.text} tex="\int x\,\ln x\,dx" />
      {answer !== null && (
        <>
          <Cap x={800} y={380} size={26} color={C.cyan} tex="u=\ln x,\quad dv=x\,dx\ \Rightarrow\ du=\tfrac{dx}{x},\quad v=\tfrac{x^2}{2}" />
          <Cap x={800} y={480} size={28} color={C.green} tex="=\tfrac{x^2}{2}\ln x-\int\tfrac{x}{2}\,dx=\tfrac{x^2}{2}\ln x-\tfrac{x^2}{4}+C" />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Integración por partes',
  Scene: PartsLesson,
  beats: [
    {
      say: 'La regla del producto, integrada a ambos lados y reordenada, da una herramienta para integrar productos.',
      dur: 3.6,
      board: [
        { tex: "(uv)'=\\p{1}{u'v}+\\p{2}{uv'}", parts: ['cambio del primer factor', 'cambio del segundo factor'] },
        { label: 'Por partes', tex: '\\int u\\,dv=\\p{1}{uv}-\\p{2}{\\int v\\,du}', body: 'Se cambia una integral difícil por otra, ojalá más fácil.', parts: ['producto de las funciones', 'integral que se resta'] },
      ],
    },
    {
      say: 'En una imagen: el rectángulo grande menos el chico se reparte en dos regiones. Una es $\\int u\\,dv$; la otra, $\\int v\\,du$.',
      dur: 3.6,
      board: { label: 'Con límites', tex: '\\int_a^b u\\,dv=\\p{1}{\\big[uv\\big]_a^b}-\\p{2}{\\int_a^b v\\,du}', parts: ['producto entre los extremos', 'integral que se resta'] },
    },
    {
      say: 'Ejemplo: $\\int x\\,e^x\\,dx$. Conviene que $u$ sea lo que se **simplifica al derivar** ($x\\to1$) y $dv$ lo que se **sabe integrar** ($e^x$).',
      dur: 4,
      board: [
        { tex: 'u=x,\\ du=dx;\\qquad dv=e^x dx,\\ v=e^x' },
        { tex: '\\int x e^x dx=\\p{1}{x e^x}-\\p{2}{\\int e^x dx}=\\p{3}{(x-1)e^x+C}', parts: ['producto de las funciones', 'integral más simple', 'primitiva del producto'] },
      ],
    },
    {
      say: 'Con un logaritmo, la elección cambia: $\\ln x$ es difícil de integrar pero fácil de derivar.',
      ask: {
        prompt: 'En $\\int x\\ln x\\,dx$, ¿qué conviene llamar $u$?',
        options: ['$u=\\ln x$', '$u=x$', 'Da lo mismo'],
        answer: 0,
        explain: 'Al derivar, $\\ln x$ se vuelve $\\tfrac1x$ y se simplifica con $\\tfrac{x^2}{2}$. Si $u=x$, habría que integrar $\\ln x$, que es más difícil.',
      },
      board: { label: 'Elegir u', body: '$u$: lo que se simplifica al derivar (logaritmos, potencias de $x$). $dv$: lo que se integra fácil (exponenciales, potencias).', tex: '\\p{1}{\\int x\\ln x\\,dx}=\\p{2}{\\tfrac{x^2}{2}\\ln x-\\tfrac{x^2}{4}+C}', parts: ['lo que buscamos', 'primitiva del producto'] },
    },
  ],
};

// ---------------------------------------------------------------- demo
const pump = (t: number) => 4 * t * Math.exp(-t / 2);
const PD = plane([0, 8], [0, 3.5], { x: 300, y: 120, w: 820, h: 520 });

function PumpDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Axes P={PD} xTicks={[0, 2, 4, 6, 8]} yTicks={[1, 2, 3]} xLabel="t\ (\text{h})" yLabel="q" grid />
      <AreaUnder P={PD} f={pump} a={0} b={4} pos={C.violet} opacity={0.4} />
      <Curve P={PD} f={pump} a={0} b={8} color={C.cyan} width={4} />
      <Cap x={1330} y={200} size={24} color={C.cyan} tex="q(t)=4t\,e^{-t/2}" />
      <Group opacity={beat >= 1 || answer !== null ? 1 : 0}>
        <Cap x={1330} y={270} size={20} color={C.green} tex="\int_0^4q=16-48e^{-2}\approx9{,}5" />
      </Group>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const CHOOSE = [
  { tex: '\\int x\\,e^{3x}\\,dx', right: 'x', wrong: ['e^{3x}', 'x\\,e^{3x}'] },
  { tex: '\\int x^2\\ln x\\,dx', right: '\\ln x', wrong: ['x^2', 'x^2\\ln x'] },
  { tex: '\\int t\\,e^{-t}\\,dt', right: 't', wrong: ['e^{-t}', '-t'] },
  { tex: '\\int \\ln x\\,dx', right: '\\ln x', wrong: ['1', 'x'] },
];

function Parts({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const c = pick(r, [1, 2]);
    const L = pick(r, [Math.E, Math.E ** 2, 2, 3]);
    const cse = pick(r, CHOOSE);
    const opts = shuffle(r, [cse.right, ...cse.wrong]);
    return { c, L, cse, opts };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const Ltex = d.L === Math.E ? 'e' : d.L === Math.E ** 2 ? 'e^2' : String(d.L);

  useEffect(() => {
    if (round === 0) {
      api.prompt('Calcula por partes. (Dos decimales.)', `\\int_0^{${d.c}}x\\,e^{x}\\,dx`);
      api.hints(['$u=x$, $dv=e^x\\,dx$.', 'Primitiva: $(x-1)e^x$. Evalúa y resta.']);
    } else if (round === 1) {
      api.prompt('Calcula por partes. (Dos decimales.)', `\\int_1^{${Ltex}}\\ln x\\,dx`);
      api.hints(['$u=\\ln x$, $dv=dx$: $du=\\tfrac{dx}{x}$, $v=x$.', 'Primitiva: $x\\ln x-x$.']);
    } else {
      api.prompt('¿Qué conviene llamar $u$ al integrar por partes?', d.cse.tex);
      api.hints(['$u$ debe simplificarse al derivar.', '$dv$ debe ser fácil de integrar.']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === d.cse.right) return api.result(true, `Con $u=${d.cse.right}$ la nueva integral es más simple que la original.`);
      return api.result(false, `Con $u=${choice}$, la integral que queda es igual o más difícil. Elige lo que se simplifica al derivar.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = (d.c - 1) * Math.exp(d.c) + 1;
      if (Math.abs(v - t) < 0.011) return api.result(true, `$\\big[(x-1)e^x\\big]_0^{${d.c}}=${dec(t, 2).replace(',', '{,}')}$.`);
      if (Math.abs(v - (d.c - 1) * Math.exp(d.c)) < 0.011) return api.result(false, 'Falta restar el valor en 0: $(0-1)e^0=-1$.');
      return api.result(false, 'Primitiva $(x-1)e^x$: evalúa en el límite de arriba y resta el de abajo.');
    }
    const t = d.L * Math.log(d.L) - d.L + 1;
    if (Math.abs(v - t) < 0.011) return api.result(true, `$\\big[x\\ln x-x\\big]_1^{${Ltex}}=${dec(t, 2).replace(',', '{,}')}$.`);
    return api.result(false, `Primitiva $x\\ln x-x$. En 1 vale $-1$; en ${Ltex}, calcula y resta.`);
  };

  if (round === 2)
    return (
      <Stage>
        <Cap x={800} y={260} size={44} color={C.text} tex={d.cse.tex} />
        <Html x={800} y={460} size={28} interactive>
          <div className="stage-choices">
            {d.opts.map((o) => (
              <button key={o} className={`stage-btn ${choice === o ? 'on' : ''}`} onClick={() => setChoice(o)}>
                <Tex tex={`u=${o}`} />
              </button>
            ))}
          </div>
        </Html>
        <Confirm onClick={submit} disabled={choice === null} />
      </Stage>
    );
  return (
    <Stage>
      <Cap x={800} y={300} size={42} color={C.text} tex={round === 0 ? `\\int_0^{${d.c}}x\\,e^{x}\\,dx` : `\\int_1^{${Ltex}}\\ln x\\,dx`} />
      <NumberField x={560} y={500} value={val} onChange={setVal} onEnter={submit} label="=" width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w3-c7',
  world: 'integral',
  code: '3.7',
  title: 'Por partes',
  subtitle: 'Integración por partes',
  glyph: '\\int u\\,dv',
  kind: 'level',
  guide: 'marta',
  teaser: 'La bomba del canal 7 arranca sola a medianoche, llega a su máximo a las dos y se va apagando.',
  learn: 'Integración por partes $\\int u\\,dv=uv-\\int v\\,du$, su imagen geométrica, cómo elegir $u$ y $dv$, y su versión con límites.',
  glyphs: ['parts'],
  pitfalls: ['Si la nueva integral queda más difícil, la elección de $u$ fue mala.', 'En la versión con límites, $uv$ también se evalúa entre $a$ y $b$.', 'No se olvida el signo menos frente a $\\int v\\,du$.'],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'nar', text: 'Canal 7, cinco de la tarde. La carcasa de la bomba vibraba, y el manómetro tenía la aguja pegada con cinta.' },
        { who: 'marta', text: 'Se enciende sola a las 00:00 y llega a su mayor caudal dos horas después. Hay que contar también lo que saca mientras se apaga.' },
        { who: 'teo', text: 'El modelo combina el tiempo desde el arranque con una caída cada vez más lenta. No sirve tratarlo como el goteo.' },
        { who: 'iris', text: 'Cuéntalo hasta las 04:00. Si lo dejaron fuera del informe, quiero saber cuánto dejaron fuera.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La bomba del canal 7',
      Scene: PumpDemo,
      beats: [
        {
          say: 'El caudal de la bomba en miles de m³/h. Sube rápido, alcanza su máximo a las 2 h y luego decae.',
          ask: {
            prompt: 'Para integrar $4t\\,e^{-t/2}$ por partes, ¿qué conviene tomar como $u$?',
            options: ['$u=4t$', '$u=e^{-t/2}$', '$u=4t\\,e^{-t/2}$'],
            answer: 0,
            explain: '$4t$ se simplifica al derivar (queda 4) y $e^{-t/2}$ se integra fácil: $v=-2e^{-t/2}$.',
          },
          note: { label: 'Elección', tex: 'u=4t,\\quad dv=e^{-t/2}dt,\\quad v=-2e^{-t/2}' },
        },
        {
          say: 'Aplicando la fórmula con límites de 0 a 4 horas.',
          dur: 1.8,
          note: { label: 'Bombeo en 4 h', tex: '\\big[-8te^{-t/2}\\big]_0^4+\\int_0^48e^{-t/2}dt\\approx9{,}5', body: 'Mil m³ que tampoco aparecen en el informe.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Por partes', Comp: Parts, rounds: 3 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        { who: 'marta', text: 'La bomba saca unos 9,5 mil m³ entre las 00:00 y las 04:00, y en el informe no aparecen.' },
        { who: 'iris', text: 'Y la válvula vieja sigue abierta a medias. ¿Cuánto perdería si nadie vuelve a cerrarla?' },
        { who: 'teo', text: 'Su caudal baja, pero nunca llega del todo a cero.' },
        { who: 'marta', text: 'La cuenta de cuatro horas no responde eso. Falta contar toda la cola del goteo.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  { id: 'parts', world: 'integral', tex: '\\int u\\,dv=uv-\\int v\\,du', name: 'Integración por partes', read: 'por partes', meaning: 'La regla del producto al revés: cambia una integral de un producto por otra, ojalá más simple.' },
];
