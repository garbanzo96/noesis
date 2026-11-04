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
import { randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { bellmanStep, fmt, GAMMA, policyValue, REWARD, TRANS, type Act } from './kit';

const actions: Act[] = ['esperar', 'calmar'];
const target: [Act, Act] = ['esperar', 'calmar'];
const policies: [Act, Act][] = [
  ['esperar', 'esperar'],
  ['esperar', 'calmar'],
  ['calmar', 'esperar'],
  ['calmar', 'calmar'],
];
const policyName = (p: [Act, Act]) => `${p[0]} en calma / ${p[1]} en rumor`;
const q = (s: number, a: Act, v: [number, number]) => bellmanStep(v, [a, a])[s];

function Market({ action = 'esperar', nodes = 2 }: { action?: Act; nodes?: number }) {
  const p = TRANS[action];
  return (
    <g>
      {nodes >= 1 && (
        <>
          <circle cx={350} cy={245} r={100} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
          <Cap x={350} y={245} size={30}>
            Calma
          </Cap>
        </>
      )}
      {nodes >= 2 && (
        <>
          <circle cx={850} cy={245} r={100} fill={C.panel} stroke={C.amber} strokeWidth={3} />
          <Cap x={850} y={245} size={30}>
            Rumor
          </Cap>
          <path
            d="M450 205 Q600 105 750 205 M750 285 Q600 385 450 285"
            fill="none"
            stroke={C.muted}
            strokeWidth={3}
          />
          <path
            d="M734 191 l16 14 l-21 0 M466 299 l-16 -14 l21 0"
            fill="none"
            stroke={C.muted}
            strokeWidth={3}
          />
          <Cap x={600} y={130} size={25}>
            {fmt(p[0], 1)}
          </Cap>
          <Cap x={600} y={360} size={25}>
            {fmt(1 - p[1], 1)}
          </Cap>
          <Cap x={350} y={90} size={24}>
            Calma → calma: {fmt(1 - p[0], 1)}
          </Cap>
          <Cap x={850} y={90} size={24}>
            Rumor → rumor: {fmt(p[1], 1)}
          </Cap>
        </>
      )}
      <Cap x={1250} y={125} size={26}>
        Recompensas
      </Cap>
      <Cap x={1250} y={195} size={24}>
        Calma: esperar 0 · calmar −4
      </Cap>
      <Cap x={1250} y={255} size={24}>
        Rumor: esperar −10 · calmar −4
      </Cap>
      <Cap x={1250} y={315} size={24}>
        Descuento: 0,9
      </Cap>
    </g>
  );
}

function Switches({ pi, set }: { pi: [Act, Act]; set: (s: number, a: Act) => void }) {
  return (
    <>
      <Choices
        x={390}
        y={475}
        label="En calma"
        options={actions}
        value={pi[0]}
        onPick={(a) => set(0, a)}
      />
      <Choices
        x={870}
        y={475}
        label="En rumor"
        options={actions}
        value={pi[1]}
        onPick={(a) => set(1, a)}
      />
    </>
  );
}

function LessonScene({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [action, setAction] = useState<Act>('esperar');
  const [seen, setSeen] = useState<Act[]>([]);
  const [pi, setPi] = useState<[Act, Act]>(['calmar', 'esperar']);
  const [k, setK] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 4) return;
    const n = Math.round(clamp((x - 220) / 850, 0, 1) * 60);
    setK(n);
    const v = policyValue(target, n),
      next = bellmanStep(v, target);
    if (n > 0 && Math.max(...v.map((x, i) => Math.abs(next[i] - x))) < 0.01) unlock();
  });
  const v = policyValue(target, k);
  return (
    <Stage ref={svg}>
      <Market action={action} nodes={beat === 0 && beats.p < 0.5 ? 1 : 2} />
      {beat === 2 && (
        <Choices
          x={600}
          y={475}
          label="Acción"
          options={actions}
          value={action}
          onPick={(a) => {
            setAction(a);
            const next = Array.from(new Set([...seen, a]));
            setSeen(next);
            if (next.length === 2) unlock();
          }}
        />
      )}
      {beat === 3 && (
        <Switches
          pi={pi}
          set={(s, a) => {
            const next = [...pi] as [Act, Act];
            next[s] = a;
            setPi(next);
            if (next[0] === target[0] && next[1] === target[1]) unlock();
          }}
        />
      )}
      {beat === 4 && (
        <>
          <Cap x={250} y={465} size={26}>
            Iteración k = {k}
          </Cap>
          {[0, 1].map((s) => (
            <g key={s}>
              <Cap x={230} y={540 + s * 90} size={25}>
                {s === 0 ? 'Calma' : 'Rumor'}: {fmt(v[s], 2)}
              </Cap>
              <rect
                x={430}
                y={520 + s * 90}
                width={Math.abs(v[s]) * 45}
                height={38}
                fill={s === 0 ? C.cyan : C.amber}
              />
            </g>
          ))}
          <line x1={220} x2={1070} y1={770} y2={770} stroke={C.line} strokeWidth={4} />
          <Knob x={220 + (k / 60) * 850} y={770} axis="x" onPointerDown={drag} />
          <Cap x={220} y={820} size={24}>
            0
          </Cap>
          <Cap x={1070} y={820} size={24}>
            60
          </Cap>
        </>
      )}
      {beat === 5 && (
        <>
          <Cap x={600} y={470} size={25}>
            Valor en calma · nunca: −48,65 · siempre: −40
          </Cap>
          <Cap x={600} y={530} size={25}>
            Calmar solo en rumor: −6,61
          </Cap>
          {answer !== null && (
            <Cap x={600} y={590} size={25} color={C.green}>
              El mayor valor es −6,61
            </Cap>
          )}
        </>
      )}
      {beat === 6 && (
        <>
          <Cap x={620} y={470} size={25}>
            En calma: esperar −6,61 · calmar −10,28
          </Cap>
          <Cap x={620} y={530} size={25}>
            En rumor: esperar −18,92 · calmar −10,28
          </Cap>
        </>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'El mercado como proceso de decisión',
  intro: {
    question:
      '¿Cómo se decide cuando cada acción cambia lo que viene después y lo que viene tiene azar?',
    text: 'Valentina representa la mesa como un mercado con dos estados y dos acciones. El modelo permite comparar decisiones de hoy teniendo en cuenta sus consecuencias futuras.',
  },
  Scene: LessonScene,
  beats: [
    {
      say: 'Un **proceso de decisión de Markov**, o MDP, reúne estados, acciones, transiciones, recompensas y descuento. Se escribe $(S,A,T,r,\\gamma)$. En esta mesa los estados son calma y rumor; las acciones son esperar y calmar.',
      board: {
        label: 'MDP',
        tex: '\\p{1}{(S,A)} ,\\;\\p{2}{T},\\;\\p{3}{r},\\;\\p{4}{\\gamma}',
        parts: ['estados y acciones', 'transición', 'recompensa', 'descuento'],
      },
    },
    {
      say: 'La **propiedad de Markov** dice que, conocido el estado y la acción actuales, la distribución del siguiente estado no depende de la historia anterior. La transición $T$ se lee como probabilidad del estado siguiente dado el actual y la acción. Es la misma idea de las cadenas del Mundo 12, ahora con acciones.',
      board: {
        label: 'Propiedad de Markov',
        tex: '\\p{1}{P(s_{t+1}\\mid s_t,a_t,s_{t-1},\\ldots)}=\\p{2}{T(s_{t+1}\\mid s_t,a_t)}',
        parts: ['probabilidad con historia', 'transición desde hoy'],
      },
    },
    {
      say: 'Cada acción tiene una **transición** propia. Las flechas indican la probabilidad de pasar de un estado a otro; las cifras sobre los nodos indican la probabilidad de permanecer. Compara ambas acciones para ver cómo cambian las filas.',
      gate: 'Pulsa esperar y calmar. ¿Cómo cambia la probabilidad de rumor mañana en cada estado?',
      after:
        'Cada fila suma 1. Al calmar, la probabilidad de rumor mañana es 0,1 desde cualquiera de los dos estados.',
      board: {
        label: 'Transición',
        tex: "\\p{1}{T(s'\\mid s,a)}=\\p{2}{P(s'\\mid s,a)}",
        parts: ['transición', 'probabilidad del estado siguiente'],
      },
    },
    {
      say: 'Una **política** asigna una acción a cada estado. Se lee «pi de ese» y permite repetir una regla cuando el estado vuelve a aparecer. Los dos interruptores describen una política completa.',
      gate: 'Configura la política que espera en calma y calma cuando hay rumor.',
      after:
        'La regla espera en calma y paga 4 para calmar en rumor. Queda definida una acción para cada estado.',
      board: {
        label: 'Política',
        tex: '\\p{1}{\\pi}:\\p{2}{S}\\to\\p{3}{A}',
        parts: ['política', 'estado', 'acción elegida'],
      },
    },
    {
      say: 'El **valor de una política** es la suma esperada de sus recompensas futuras descontadas desde un estado. «Ve pi de ese» satisface la ecuación de Bellman: recompensa de hoy más continuación ponderada y descontada. Partir de cero y repetir la cuenta aproxima ese valor.',
      gate: 'Mueve la perilla de iteraciones hasta que las barras se estabilicen. Observa ambos valores.',
      after:
        'Las barras se acercan a −6,61 en calma y −10,28 en rumor. La iteración aproxima el valor de seguir la misma política a largo plazo.',
      board: {
        label: 'Bellman de una política',
        tex: "\\p{1}{V^\\pi(s)}=\\p{2}{r(s,\\pi(s))}+\\p{3}{\\gamma\\sum_{s'}T(s'\\mid s,\\pi(s))V^\\pi(s')}",
        parts: ['valor de la política', 'recompensa inmediata', 'continuación esperada descontada'],
      },
    },
    {
      say: 'Las políticas pueden compararse desde un mismo estado inicial. Un valor mayor representa una suma esperada de recompensas mayor, aunque todos los resultados sean negativos. La tabla muestra tres reglas posibles desde calma.',
      ask: {
        prompt: '¿Cuál conviene desde calma y por qué pierde siempre calmar?',
        options: [
          'Calmar solo en rumor; siempre calmar también cuesta 4 en calma',
          'Siempre calmar; evita cualquier costo',
          'Nunca calmar; su valor es el mayor',
        ],
        answer: 0,
        explain:
          '−6,61 es mayor que −40 y −48,65. Siempre calmar paga 4 también en los días tranquilos.',
      },
      board: {
        label: 'Comparación',
        tex: '\\p{1}{-6{,}61}>\\p{2}{-40}>\\p{3}{-48{,}65}',
        parts: ['calmar solo en rumor', 'siempre calmar', 'nunca calmar'],
      },
    },
    {
      say: 'El **valor óptimo** elige la mejor acción en cada estado y supone decisiones óptimas después. Se lee «ve estrella de ese»: el máximo sobre acciones de la recompensa inmediata más la continuación esperada descontada. Esta ecuación generaliza la de 13.5 a transiciones con azar.',
      board: {
        label: 'Bellman óptima',
        tex: "\\p{1}{V^*(s)}=\\p{2}{\\max_a}\\left[\\p{3}{r(s,a)}+\\p{4}{\\gamma\\sum_{s'}T(s'\\mid s,a)V^*(s')}\\right]",
        parts: ['valor óptimo', 'mejor acción', 'recompensa inmediata', 'continuación esperada'],
      },
    },
  ],
};

function Investigation({ beats, unlock }: DemoProps) {
  const [pi, setPi] = useState<[Act, Act]>(['esperar', 'esperar']);
  const [visited, setVisited] = useState<string[]>([]);
  const v = policyValue(pi);
  return (
    <Stage>
      <Market />
      {beats.beat === 0 && (
        <>
          <Switches
            pi={pi}
            set={(s, a) => {
              const next = [...pi] as [Act, Act];
              next[s] = a;
              setPi(next);
            }}
          />
          <Choices
            x={620}
            y={570}
            options={['Registrar']}
            value={null}
            onPick={() => {
              const next = Array.from(new Set([...visited, pi.join('/')]));
              setVisited(next);
              if (next.length === 4) unlock();
            }}
          />
          <Cap x={620} y={650} size={25}>
            Valor en calma: {fmt(v[0])} · políticas registradas: {visited.length}/4
          </Cap>
        </>
      )}
      {beats.beat > 0 &&
        policies.map((p, i) => (
          <Cap key={i} x={680} y={430 + i * 70} size={25}>
            {policyName(p)}: {fmt(policyValue(p)[0])}
          </Cap>
        ))}
    </Stage>
  );
}

function Practice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 719 + round);
    return {
      v: [-randInt(r, 1, 6), -randInt(r, 8, 15)] as [number, number],
      s: randInt(r, 0, 1),
      a: actions[randInt(r, 0, 1)],
    };
  }, [seed, round]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setFirst('');
    setSecond('');
    setChoice(null);
    api.prompt(
      [
        `Calcula una iteración de Bellman en ${d.s ? 'rumor' : 'calma'} para la política indicada. Redondea a dos decimales.`,
        `Calcula Q de ambas acciones en ${d.s ? 'rumor' : 'calma'} y elige la mejor. Redondea a dos decimales.`,
        'Calcula una iteración desde los valores de la tabla para cada política y elige la de mayor valor en calma.',
      ][round],
    );
    api.hints([
      'Usa la recompensa y la fila de transición de la acción elegida.',
      'Pondera ambos valores futuros por sus probabilidades y multiplica la suma por 0,9.',
    ]);
  }, [d, round, api]);
  const qs = actions.map((a) => q(d.s, a, d.v));
  const shownPolicies = [policies[0], policies[1], policies[3]];
  const continuations = shownPolicies.map((p) => policyValue(p, 4 + Math.abs(d.v[0])));
  const vals = shownPolicies.map((p, i) => bellmanStep(continuations[i], p)[0]);
  const best = Math.max(...vals);
  const submit = () => {
    const n = parseNum(first),
      m = parseNum(second);
    const near = (x: number | null, y: number) => x !== null && Math.abs(x - y) <= 0.011;
    if (round === 0) {
      const correct = q(d.s, d.a, d.v);
      if (near(n, correct))
        return api.result(
          true,
          `El valor es ${fmt(correct)}: recompensa inmediata más continuación ponderada y descontada.`,
        );
      if (near(n, REWARD[d.a][d.s] + (correct - REWARD[d.a][d.s]) / GAMMA))
        return api.result(false, 'Falta multiplicar la continuación por el descuento 0,9.');
      if (near(n, q(d.s, d.a === 'esperar' ? 'calmar' : 'esperar', d.v)))
        return api.result(false, 'Usaste la fila de la otra acción.');
      if (near(n, REWARD[d.a][d.s] + GAMMA * (d.v[0] + d.v[1])))
        return api.result(
          false,
          'Suma los valores futuros ponderados por las probabilidades de transición.',
        );
      return api.result(
        false,
        'Revisa la recompensa, la fila de transición y el descuento de la continuación.',
      );
    }
    if (round === 1) {
      if (
        near(n, qs[0]) &&
        near(m, qs[1]) &&
        choice &&
        qs[actions.indexOf(choice as Act)] >= Math.max(...qs) - 1e-9
      )
        return api.result(
          true,
          `Esperar vale ${fmt(qs[0])} y calmar ${fmt(qs[1])}; se elige el mayor.`,
        );
      return api.result(
        false,
        'Revisa ambas filas: pondera los estados siguientes, descuenta con 0,9 y elige el mayor valor.',
      );
    }
    const idx = choice === null ? -1 : Number(choice);
    if (idx >= 0 && vals[idx] >= best - 1e-9)
      return api.result(
        true,
        `Los valores en calma son ${vals.map((x) => fmt(x)).join(', ')}. Se elige el mayor.`,
      );
    return api.result(
      false,
      'Calcula la recompensa de calma más la continuación ponderada y descontada para cada política.',
    );
  };
  return (
    <Stage>
      <Market action={d.a} />
      {round !== 2 && (
        <Cap x={600} y={420} size={25}>
          Valores actuales: calma {fmt(d.v[0])} · rumor {fmt(d.v[1])}
        </Cap>
      )}
      {round === 0 && (
        <>
          <Cap x={600} y={480} size={25}>
            Política: {d.a} en {d.s ? 'rumor' : 'calma'}
          </Cap>
          <NumberField
            x={450}
            y={580}
            value={first}
            onChange={setFirst}
            onEnter={submit}
            label="Valor ="
          />
        </>
      )}
      {round === 1 && (
        <>
          <NumberField x={250} y={520} value={first} onChange={setFirst} label="Q esperar =" />
          <NumberField x={800} y={520} value={second} onChange={setSecond} label="Q calmar =" />
          <Choices
            x={600}
            y={650}
            options={actions}
            value={choice}
            onPick={setChoice}
            label="Mejor acción"
          />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={600} y={405} size={24}>
            Valores futuros por política: calma · rumor
          </Cap>
          {continuations.map((v, i) => (
            <Cap key={i} x={600} y={455 + i * 55} size={24}>
              {i + 1}: {policyName(shownPolicies[i])} · {fmt(v[0], 4)} · {fmt(v[1], 4)}
            </Cap>
          ))}
          <Choices
            x={600}
            y={680}
            options={['0', '1', '2']}
            value={choice}
            onPick={setChoice}
            render={(i) => `Política ${Number(i) + 1}`}
          />
        </>
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c9',
  world: 'decision',
  code: '13.9',
  title: 'Lo que se vería desde arriba',
  subtitle: 'Procesos de decisión de Markov',
  glyph: 'V^*(s)',
  kind: 'level',
  guide: 'valentina',
  teaser: 'Una dirección no basta para retener la cuenta: Valentina debe reconstruir cómo decidía.',
  learn: 'Comparar políticas y calcular valores con transiciones aleatorias y descuento.',
  glyphs: ['dec-mdp', 'dec-policy', 'dec-transition'],
  pitfalls: [
    'Descuenta la continuación con γ.',
    'Usa la fila de transición correspondiente a la acción.',
    'Pondera cada valor futuro por su probabilidad.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'La taza de Valentina había dejado un círculo sobre la copia de la dirección: Torre Halcón, piso 40.',
        },
        {
          who: 'valentina',
          text: 'La comisión no va a retener una cuenta por una dirección. Necesito mostrarle cómo decidía.',
        },
        {
          who: 'tu',
          text: 'Podemos empezar por lo que haría una mesa que conociera el estado del mercado.',
        },
        { who: 'iris', text: '¿Y después podremos saber qué veía esa cuenta?' },
        {
          who: 'valentina',
          text: 'Si las órdenes están completas, tendremos algo con qué compararlo.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Las reglas de la mesa',
      Scene: Investigation,
      beats: [
        {
          say: 'Valentina abre las cuatro combinaciones posibles. Regístralas para comparar cuánto vale cada regla desde calma.',
          gate: 'Prueba y registra cada combinación de los dos interruptores. Observa el valor en calma.',
          after:
            'Las cuatro reglas quedan registradas. Calmar solo en rumor alcanza −6,61 desde calma.',
          note: {
            label: 'Políticas de la mesa',
            body: 'De las cuatro políticas, esperar en calma y calmar en rumor tiene el mayor valor desde calma.',
          },
        },
        {
          say: 'La comisión necesita una regla que pueda revisar. Compara los valores anotados desde el mismo estado inicial.',
          ask: {
            prompt: '¿Qué política tiene el mayor valor en calma?',
            options: [
              'Esperar en calma y calmar en rumor',
              'Esperar en ambos estados',
              'Calmar en ambos estados',
            ],
            answer: 0,
            explain:
              'Esperar en calma y calmar en rumor vale −6,61, el mayor de los cuatro valores.',
          },
        },
        {
          say: 'Valentina mira la fila del rumor. Quiere saber qué pasaría con la comparación si los episodios de rumor duraran menos.',
          ask: {
            prompt:
              'Si esperar hiciera que el rumor durara menos, ¿qué pasaría con la ventaja de calmar en rumor?',
            options: ['Bajaría', 'Subiría', 'No podría cambiar'],
            answer: 0,
            explain:
              'Si el rumor termina antes al esperar, la continuación de esperar mejora y la ventaja de pagar por calmar se reduce.',
          },
        },
        {
          say: 'La regla describe una mesa que conoce el estado. Valentina deja las órdenes reales junto a la tabla para revisar qué información tenía la cuenta.',
        },
      ],
    },
    { kind: 'challenge', title: 'Calcular antes de decidir', Comp: Practice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina alineó las órdenes con el borde de la pantalla. La primera compra aparecía junto a una cifra de volumen.',
        },
        {
          who: 'valentina',
          text: 'Tenemos una regla para quien ve el estado. La cuenta dejó órdenes, pero aquí no figura ningún estado del mercado.',
        },
        { who: 'teo', text: 'El volumen sí está publicado. Tengo los registros de cada día.' },
        { who: 'iris', text: 'Entonces conviene mirar esa columna.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-mdp',
    world: 'decision',
    tex: '(S,A,T,r,\\gamma)',
    name: 'Proceso de decisión de Markov',
    read: 'ese, a, te, erre y gamma',
    meaning: 'Modelo de estados, acciones, transiciones, recompensas y descuento.',
  },
  {
    id: 'dec-policy',
    world: 'decision',
    tex: '\\pi:S\\to A',
    name: 'Política',
    read: 'pi de ese a a',
    meaning: 'Regla que asigna una acción a cada estado.',
  },
  {
    id: 'dec-transition',
    world: 'decision',
    tex: "T(s'\\mid s,a)",
    name: 'Transición',
    read: 'te de ese siguiente dado ese y a',
    meaning: 'Probabilidad del estado siguiente dado el estado y la acción actuales.',
  },
];
export const ref: TopicRef = {
  defs: [
    {
      label: 'MDP',
      tex: '(S,A,T,r,\\gamma)',
      body: 'Estados, acciones, probabilidades de transición, recompensas y descuento.',
    },
    { label: 'Política', tex: '\\pi:S\\to A', body: 'Asigna una acción a cada estado.' },
    {
      label: 'Valor de una política',
      tex: 'V^\\pi(s)=\\mathbb{E}_\\pi[\\sum_{t=0}^\\infty\\gamma^t r_t\\mid s_0=s]',
      body: 'Suma esperada de recompensas descontadas al seguir la política.',
    },
  ],
  props: [
    {
      label: 'Bellman de una política',
      tex: "V^\\pi(s)=r(s,\\pi(s))+\\gamma\\sum_{s'}T(s'\\mid s,\\pi(s))V^\\pi(s')",
    },
    {
      label: 'Bellman óptima',
      tex: "V^*(s)=\\max_a[r(s,a)+\\gamma\\sum_{s'}T(s'\\mid s,a)V^*(s')]",
    },
  ],
};
