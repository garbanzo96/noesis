import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

type Route = { p: number; laterP: number; reward: number; loss: number; gamma: number };
const expected = (p: number, reward: number, loss: number) => p * reward - (1 - p) * loss;
const REVIEW: Route = { p: 0.6, laterP: 0.6, reward: 40, loss: 20, gamma: 0.8 };
const TOWER: Route = { p: 0.7, laterP: 0.7, reward: 50, loss: 30, gamma: 0.9 };

/** Dos rutas del acceso: muestra condiciones, nunca valores calculados ni la mejor acción. */
function AccessDrawing({ d }: { d: Route }) {
  return (
    <g>
      <Cap x={550} y={100} size={23}>
        Dos rutas · los mismos pagos
      </Cap>
      {[
        { label: 'Subir ahora', p: d.p, y: 260 },
        { label: 'Esperar', p: d.laterP, y: 550 },
      ].map(({ label, p, y }) => (
        <g key={label}>
          <rect
            x={160}
            y={y - 120}
            width={790}
            height={240}
            rx={18}
            fill={C.panel}
            stroke={C.line}
            strokeWidth={2}
          />
          <Cap x={255} y={y} size={20}>
            {label}
          </Cap>
          <circle cx={365} cy={y} r={12} fill={C.cyan} />
          <path
            d={`M377 ${y} L660 ${y - 70} M377 ${y} L660 ${y + 70}`}
            fill="none"
            stroke={C.line}
            strokeWidth={3}
          />
          <Cap x={505} y={y - 100} size={19} color={C.violet}>
            Éxito: {fmt(p, 2)}
          </Cap>
          <Cap x={505} y={y + 100} size={19} color={C.violet}>
            Fracaso: {fmt(1 - p, 2)}
          </Cap>
          <circle cx={660} cy={y - 70} r={8} fill={C.amber} />
          <circle cx={660} cy={y + 70} r={8} fill={C.red} />
          <Cap x={795} y={y - 70} size={22} color={C.amber}>
            Pago: +{d.reward}
          </Cap>
          <Cap x={795} y={y + 70} size={22} color={C.red}>
            Pago: −{d.loss}
          </Cap>
        </g>
      ))}
      <Cap x={550} y={710} size={19} color={C.muted}>
        Esperar demora una ronda; no hay pago durante la espera.
      </Cap>
    </g>
  );
}

function DecisionLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [gamma, setGamma] = useState(1);
  const { beat } = beats;
  const improved = beat >= 3;
  const d = {
    ...REVIEW,
    gamma: beat === 2 ? gamma : REVIEW.gamma,
    laterP: improved ? 0.8 : REVIEW.p,
  };
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 2) return;
    const next = Math.round((0.5 + clamp((x - 1100) / 300, 0, 1) * 0.5) * 100) / 100;
    setGamma(next);
    if (next === 0.8) unlock();
  });
  return (
    <Stage ref={svg}>
      <AccessDrawing d={d} />
      <Cap x={1250} y={170} size={21}>
        Repaso · acceso de prueba
      </Cap>
      <Cap x={1250} y={260} tex={`\\gamma=${tnum(d.gamma, 2)}`} color={C.cyan} />
      <Cap x={1250} y={350} tex="E_a=p_a\,G-(1-p_a)L" size={21} />
      {beat === 1 && answer !== null && <Cap x={1250} y={440} tex="E_a=24-8=16" color={C.green} />}
      {beat === 2 && (
        <>
          <Cap x={1250} y={440} tex="E_a=16" />
          <Cap x={1250} y={530} tex={`\\gamma E_e=${tnum(gamma * 16, 2)}`} color={C.amber} />
          <line x1={1100} x2={1400} y1={650} y2={650} stroke={C.line} strokeWidth={4} />
          <Knob
            x={1100 + ((gamma - 0.5) / 0.5) * 300}
            y={650}
            axis="x"
            onPointerDown={drag}
            color={C.cyan}
          />
          <Cap x={1100} y={720} size={18}>
            0,5
          </Cap>
          <Cap x={1400} y={720} size={18}>
            1
          </Cap>
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={440} tex="E_a=16" />
          {answer !== null && (
            <Cap x={1250} y={530} tex="\gamma E_e=0{,}8\cdot28=22{,}4" size={20} color={C.green} />
          )}
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={440} tex="V(s)=\max(E_a;\gamma E_e)" size={20} />
          <Cap x={1250} y={530} tex="V(s)=22{,}4" color={C.green} />
          <Cap x={1250} y={620} size={20}>
            Aquí conviene esperar.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Una ronda tiene costo',
  Scene: DecisionLesson,
  beats: [
    {
      say: 'Cada ruta se abre en dos resultados. El **valor esperado** multiplica cada pago por su probabilidad y suma; conserva el signo de la pérdida.',
      board: {
        label: 'Promedio de los pagos',
        tex: 'E=p\\,G-(1-p)L',
        body: 'G es la ganancia al tener éxito y L es la magnitud positiva de la pérdida al fallar.',
      },
    },
    {
      say: 'En este acceso de prueba, subir tiene probabilidad 0,6 de ganar 40 y probabilidad 0,4 de perder 20.',
      ask: {
        prompt: '¿Cuánto vale subir ahora, en promedio?',
        options: ['16', '32', '24'],
        answer: 0,
        explain:
          '0,6·40 − 0,4·20 = 24 − 8 = 16. El 32 suma la pérdida como ganancia; el 24 omite el fracaso.',
      },
      board: { label: 'Ponderar ambos resultados', tex: 'E_a=0{,}6\\cdot40-0{,}4\\cdot20' },
    },
    {
      say: 'Esperar conserva esas probabilidades, pero demora una ronda. El **descuento** γ convierte el valor futuro a valor de ahora: prueba γ = 0,8.',
      gate: 'Arrastra la perilla de γ hasta 0,8.',
      board: {
        label: 'Una ronda después',
        tex: 'Q(s,\\text{esperar})=\\gamma E_e',
        body: 'Con las mismas probabilidades, 0,8·16 = 12,8: la demora reduce un valor esperado positivo.',
      },
    },
    {
      say: 'Ahora la espera sí mejora el acceso: el éxito pasa a 0,8 y el fracaso a 0,2. Los pagos siguen siendo +40 y −20; γ sigue en 0,8.',
      ask: {
        prompt: '¿Cuánto vale esperar, medido ahora?',
        options: ['28', '22,4', '12,8'],
        answer: 1,
        explain:
          'El nuevo promedio es 0,8·40 − 0,2·20 = 28. Al descontarlo queda 22,4, que supera los 16 de subir ahora.',
      },
      board: {
        label: 'Mejora y demora',
        tex: 'Q(s,\\text{esperar})=0{,}8(0{,}8\\cdot40-0{,}2\\cdot20)',
      },
    },
    {
      say: 'El **valor del estado** V(s) es el mayor valor entre las acciones disponibles. Compara subir ahora con esperar ya descontado; un promedio favorable no garantiza éxito en una sola subida.',
      board: {
        label: 'Elegir la acción',
        tex: 'V(s)=\\max(E_a;\\gamma E_e)',
        body: 'Esperar conviene si γ·E_e > E_a. Con valor positivo y la misma probabilidad, un descuento menor que 1 favorece subir ahora.',
      },
    },
  ],
};

function TowerDemo({ beats, answer }: DemoProps) {
  const waiting = beats.beat === 1;
  return (
    <Stage>
      <AccessDrawing d={TOWER} />
      <Cap x={1250} y={190} size={22}>
        Acceso al piso 40
      </Cap>
      <Cap x={1250} y={280} tex="\gamma=0{,}9" color={C.cyan} />
      {waiting && <Cap x={1250} y={370} tex="E_a=E_e=26" />}
      {answer !== null && (
        <>
          <Cap
            x={1250}
            y={460}
            tex={waiting ? 'Q(s,\\text{esperar})=23{,}4' : 'E_a=35-9=26'}
            size={21}
            color={C.green}
          />
          <Cap x={1250} y={550} size={20}>
            {waiting ? '26 > 23,4 · subir ahora' : 'El fracaso pesa −9 en el promedio.'}
          </Cap>
        </>
      )}
    </Stage>
  );
}

function DecisionPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 457 + round);
    const p = pick(r, [0.5, 0.6, 0.7]);
    const laterP = round === 2 ? Math.min(0.9, p + pick(r, [0, 0.1, 0.2])) : p;
    const reward = pick(r, [40, 50, 60]);
    const loss = pick(r, [10, 20, 30]);
    const gamma = pick(r, [0.6, 0.8, 0.9]);
    return { p, laterP, reward, loss, gamma };
  }, [seed, round]);
  const now = expected(d.p, d.reward, d.loss);
  const future = expected(d.laterP, d.reward, d.loss);
  const wait = d.gamma * future;
  const target = round === 0 ? now : round === 1 ? wait : Math.max(now, wait);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    api.prompt(
      [
        `Otro acceso: éxito ${fmt(d.p, 1)} con pago +${d.reward}; fracaso ${fmt(1 - d.p, 1)} con pago −${d.loss}. ¿Valor esperado de subir ahora?`,
        `Esperar una ronda mantiene éxito ${fmt(d.p, 1)}, pago +${d.reward} y fracaso con pago −${d.loss}. Con γ = ${fmt(d.gamma, 1)}, ¿cuánto vale esperar, medido ahora?`,
        `Subir ahora tiene éxito ${fmt(d.p, 1)}; después de esperar, ${fmt(d.laterP, 1)}. Éxito paga +${d.reward} y fracaso −${d.loss}; γ = ${fmt(d.gamma, 1)}. ¿Cuál es el valor V(s) de la mejor acción? Escribe hasta dos decimales.`,
      ][round],
      ['E_a=p_a\\,G-(1-p_a)L', 'Q(s,\\text{esperar})=\\gamma E_e', 'V(s)=\\max(E_a;\\gamma E_e)'][
        round
      ],
    );
    api.hints([
      'Multiplica cada pago por su probabilidad; el pago de fracaso es negativo.',
      round === 0
        ? 'Suma las dos contribuciones, con sus signos.'
        : round === 1
          ? 'Descuenta todo el promedio futuro una sola vez.'
          : 'Calcula ambos promedios, descuenta solo el de esperar y elige el mayor.',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(input);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.011;
    if (near(target))
      return api.result(
        true,
        round === 2
          ? `Ahora vale ${fmt(now)}; esperar vale ${fmt(wait)}. V(s) = ${fmt(target)}: ${near(now) && near(wait) ? 'ambas acciones empatan' : now > wait ? 'conviene subir ahora' : 'conviene esperar'}.`
          : `${round === 0 ? 'Subir ahora' : 'Esperar, medido ahora'} vale ${fmt(target)}.`,
      );
    const p = round === 0 ? d.p : d.laterP;
    const factor = round === 0 ? 1 : d.gamma;
    if (near(factor * (p * d.reward + (1 - p) * d.loss)))
      return api.result(
        false,
        'Sumaste la pérdida como ganancia. El resultado del fracaso lleva signo negativo.',
      );
    if (near(factor * p * d.reward))
      return api.result(
        false,
        'Contaste solo el éxito. Falta la pérdida ponderada por la probabilidad de fracaso.',
      );
    if (round === 1 && near(future))
      return api.result(
        false,
        'Ese es el promedio futuro. Multiplica todo ese valor por γ para medirlo ahora.',
      );
    if (round === 1 && near(d.gamma * d.p * d.reward - (1 - d.p) * d.loss))
      return api.result(
        false,
        'Descontaste solo la ganancia. Tanto el éxito como el fracaso ocurren después de esperar.',
      );
    if (round === 2 && near(Math.max(now, future)))
      return api.result(
        false,
        'Comparaste con el promedio futuro sin descuento. La espera cuesta una ronda: usa γ·E_e.',
      );
    if (round === 2 && near(Math.min(now, wait)))
      return api.result(
        false,
        'Elegiste el menor valor. V(s) toma el máximo entre las dos acciones.',
      );
    if (round === 2 && near(now + wait))
      return api.result(
        false,
        'Subir ahora y esperar son acciones excluyentes. Compara sus valores; no los sumes.',
      );
    if (round === 2 && near(d.gamma * Math.max(now, future)))
      return api.result(
        false,
        'Descontaste también subir ahora. Solo la espera lleva el factor γ.',
      );
    return api.result(
      false,
      round === 0
        ? 'Usa p·ganancia − (1 − p)·pérdida, con las probabilidades de subir ahora.'
        : round === 1
          ? 'Calcula el promedio con ambos resultados y luego multiplícalo completo por γ.'
          : 'Usa la probabilidad de cada ruta para su promedio. Descuenta la espera y compara los dos valores.',
    );
  };
  return (
    <Stage>
      <AccessDrawing d={d} />
      <Cap x={1250} y={190} tex={`\\gamma=${tnum(d.gamma, 1)}`} color={C.cyan} />
      <Cap x={1250} y={280} size={20}>
        {['Promedio de subir ahora', 'Espera: valor de ahora', 'Mayor valor entre acciones'][round]}
      </Cap>
      <NumberField
        x={1120}
        y={430}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label={['E =', 'γ·E =', 'V(s) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c7',
  world: 'active',
  code: '14.7',
  title: 'Subir o esperar',
  subtitle: 'Valor esperado y descuento',
  glyph: 'V(s)',
  kind: 'level',
  guide: 'iris',
  teaser: 'La puerta del piso 40 está al alcance. Esperar otra ronda puede costar la oportunidad.',
  learn: 'Comparar el valor esperado de actuar ahora con el valor descontado de esperar.',
  glyphs: ['tor-ascent-expectation', 'tor-ascent-discount', 'tor-ascent-value'],
  pitfalls: [
    'El fracaso tiene pago negativo y también pesa en el promedio.',
    'El descuento afecta todo el valor futuro, una vez por ronda de espera.',
    'Compara las acciones con el máximo: no sumes rutas que no puedes tomar juntas.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La puerta de vidrio vibra cuando pasa la ronda de guardias. Iris mantiene un pie en el primer peldaño.',
        },
        {
          who: 'teo',
          text: 'El sistema repite el mismo acceso en la próxima ronda. Esperar no mejora la apertura; solo nos deja más tiempo afuera.',
        },
        { who: 'tu', text: 'Y si fallamos, perdemos el acceso que ya tenemos.' },
        {
          who: 'iris',
          text: 'Entonces cuenta también el fracaso. Decidimos antes de que vuelvan.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La siguiente ronda',
      Scene: TowerDemo,
      beats: [
        {
          say: 'Iris fija los pagos del operativo: +50 si llegan al piso 40 y −30 si fallan. Subir ahora tiene éxito 0,7 y fracaso 0,3.',
          ask: {
            prompt: '¿Cuál es el valor esperado de subir ahora?',
            options: ['35', '44', '26'],
            answer: 2,
            explain: 'El éxito aporta 0,7·50 = 35 y el fracaso aporta 0,3·(−30) = −9. Total: 26.',
          },
          note: {
            label: 'Subir ahora',
            tex: 'E_a=0{,}7\\cdot50+0{,}3\\cdot(-30)=26',
            body: 'El valor esperado incluye la pérdida; no garantiza llegar al piso 40.',
          },
        },
        {
          say: 'La próxima ronda mantiene las mismas probabilidades y pagos. Esperar una ronda tiene descuento γ = 0,9.',
          ask: {
            prompt: '¿Cuánto vale esperar, medido ahora?',
            options: ['23,4', '26', '28,9'],
            answer: 0,
            explain:
              'Multiplica 26 por 0,9: queda 23,4. Subir ahora vale más; dividir por 0,9 aumentaría el valor por demorar.',
          },
          note: {
            label: 'Decisión en la torre',
            tex: 'E_a=26>\\gamma E_e=0{,}9\\cdot26=23{,}4',
            body: 'Se sube ahora. Para que convenga esperar con estos pagos, su probabilidad de éxito tendría que mejorar lo suficiente para compensar la demora.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Comparar otras rutas', Comp: DecisionPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Iris apoya la mano en la barra de la puerta. El indicador cambia de rojo a blanco antes de que termine el zumbido del cierre.',
        },
        { who: 'iris', text: 'Subimos. Esperar nos cuesta y no abre nada mejor.' },
        {
          who: 'teo',
          text: 'El acceso quedó registrado. Desde arriba puedo copiar los servidores antes de que el sistema cambie de turno.',
        },
        {
          who: 'nar',
          text: 'Los pasos de la ronda se pierden abajo. Tras el vidrio del piso 40, una pantalla sigue dibujando el mapa de la ciudad.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-ascent-expectation',
    world: 'active',
    tex: 'E=p\\,G-(1-p)L',
    name: 'Valor esperado del acceso',
    read: 'E igual a p por G menos uno menos p por L',
    meaning: 'Promedio de los pagos de éxito y fracaso, ponderados por sus probabilidades.',
    warn: 'L es la magnitud de la pérdida; su aporte al promedio es negativo.',
  },
  {
    id: 'tor-ascent-discount',
    world: 'active',
    tex: 'Q(s,\\text{esperar})=\\gamma E_e',
    name: 'Descontar la espera',
    read: 'Q de s, esperar, igual a gamma por E de esperar',
    meaning:
      'Convierte el promedio de una ronda futura a valor de ahora, sin pago durante la espera.',
    warn: 'Descuenta ambos resultados futuros; no solo la ganancia.',
  },
  {
    id: 'tor-ascent-value',
    world: 'active',
    tex: 'V(s)=\\max(E_a;\\gamma E_e)',
    name: 'Elegir en el acceso',
    read: 'V de s igual al máximo entre E de ahora y gamma por E de esperar',
    meaning: 'Valor de la mejor acción entre subir ahora y esperar una ronda.',
    warn: 'Las acciones se comparan; sus valores no se suman.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Valor esperado',
      tex: 'E=p\\,G-(1-p)L',
      body: 'Éxito con pago +G y probabilidad p; fracaso con pago −L y probabilidad 1 − p.',
    },
    {
      label: 'Descuento por ronda',
      tex: '0<\\gamma\\le1',
      body: 'Un pago que llega una ronda después se multiplica por γ para medirlo ahora.',
    },
    {
      label: 'Valor del estado',
      tex: 'V(s)=\\max(E_a;\\gamma E_e)',
      body: 'Esta comparación supone una ronda de espera, sin pago inmediato durante ella.',
    },
  ],
  props: [
    { label: 'Condición para esperar', tex: '\\gamma E_e>E_a' },
    {
      label: 'Misma probabilidad y valor positivo',
      tex: 'E_e=E_a>0,\\quad\\gamma<1\\quad\\Rightarrow\\quad\\gamma E_e<E_a',
    },
    { label: 'Acceso al piso 40', tex: 'E_a=35-9=26>0{,}9\\cdot26=23{,}4' },
  ],
};

export { lesson };
