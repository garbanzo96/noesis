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
import { pick, randInt, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { ev, fmt, tnum } from './kit';

// El costo de entrar tarde se paga solo si se invierte después del dato.
// El dato revela el estado antes de tomar esa segunda decisión.
type Position = { p: number; gain: number; loss: number; cost: number };
const EXAMPLE: Position = { p: 0.5, gain: 60, loss: 20, cost: 10 };
function values(d: Position) {
  const good = Math.max(d.gain - d.cost, 0);
  const bad = Math.max(-d.loss - d.cost, 0);
  const now = ev([d.p, 1 - d.p], [d.gain, -d.loss]);
  const wait = ev([d.p, 1 - d.p], [good, bad]);
  return { good, bad, now, wait, best: Math.max(now, wait) };
}

function Node({ x, y, chance = false }: { x: number; y: number; chance?: boolean }) {
  return chance ? (
    <circle cx={x} cy={y} r={23} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
  ) : (
    <rect
      x={x - 21}
      y={y - 21}
      width={42}
      height={42}
      fill={C.panel}
      stroke={C.amber}
      strokeWidth={3}
    />
  );
}

/** Solo datos de entrada: nunca selecciona ramas ni imprime valores resueltos. */
function DecisionTree({ d }: { d: Position }) {
  const branches = [
    [180, 380, 420, 210],
    [180, 380, 420, 540],
    [420, 210, 870, 140],
    [420, 210, 870, 280],
    [420, 540, 650, 460],
    [420, 540, 650, 670],
    [650, 460, 870, 410],
    [650, 460, 870, 510],
    [650, 670, 870, 610],
    [650, 670, 870, 730],
  ];
  return (
    <g>
      <Cap x={550} y={65} size={23}>
        Cuadrado: eliges · Círculo: azar
      </Cap>
      {branches.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.line} strokeWidth={3} />
      ))}
      <Node x={180} y={380} />
      <Node x={420} y={210} chance />
      <Node x={420} y={540} chance />
      <Node x={650} y={460} />
      <Node x={650} y={670} />
      <Cap x={180} y={435} size={19}>
        Inicio
      </Cap>
      <Cap x={280} y={250} size={19}>
        Invertir ahora
      </Cap>
      <Cap x={280} y={505} size={19}>
        Esperar al dato
      </Cap>
      <Cap x={630} y={115} size={18}>
        Bueno: {fmt(d.p)}
      </Cap>
      <Cap x={630} y={295} size={18}>
        Malo: {fmt(1 - d.p)}
      </Cap>
      <Cap x={530} y={410} size={18}>
        Bueno: {fmt(d.p)}
      </Cap>
      <Cap x={490} y={640} size={18}>
        Malo: {fmt(1 - d.p)}
      </Cap>
      <Cap x={650} y={365} size={19} color={C.amber}>
        A · Dato bueno
      </Cap>
      <Cap x={650} y={575} size={19} color={C.amber}>
        B · Dato malo
      </Cap>
      {[410, 610].map((y) => (
        <Cap key={y} x={770} y={y - 35} size={17}>
          Invertir
        </Cap>
      ))}
      {[510, 730].map((y) => (
        <Cap key={y} x={770} y={y + 30} size={17}>
          No invertir
        </Cap>
      ))}
      {[140, 280, 410, 510, 610, 730].map((y) => (
        <circle key={y} cx={870} cy={y} r={5} fill={C.text} />
      ))}
      <Cap x={920} y={140} size={20}>
        {d.gain}
      </Cap>
      <Cap x={920} y={280} size={20}>
        −{d.loss}
      </Cap>
      <Cap x={920} y={410} size={19}>
        {d.gain} − {d.cost}
      </Cap>
      <Cap x={920} y={510} size={20}>
        0
      </Cap>
      <Cap x={920} y={610} size={19}>
        −{d.loss} − {d.cost}
      </Cap>
      <Cap x={920} y={730} size={20}>
        0
      </Cap>
    </g>
  );
}

function TreeLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [solved, setSolved] = useState(0);
  const solvedRef = useRef(0);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 1) return;
    const next = Math.round(clamp((px - 240) / 210, 0, 3));
    // Un salto al final no salta los nodos: hay que pasar por A, B y el azar de ahora.
    if (next !== solvedRef.current + 1) return;
    solvedRef.current = next;
    setSolved(next);
    if (next === 3) unlock();
  });
  const showGood = beat >= 2 || (beat === 1 && solved >= 1);
  const showBad = beat >= 2 || (beat === 1 && solved >= 2);
  const showNow = beat >= 2 || (beat === 1 && solved >= 3);
  const showWait = beat >= 3 || (beat === 2 && answer !== null);
  return (
    <Stage ref={svg}>
      <DecisionTree d={EXAMPLE} />
      <Cap x={1250} y={150} size={21}>
        Costo al invertir tarde: 10
      </Cap>
      {showGood && <Cap x={1250} y={240} tex="V(A)=\max(50,0)=50" color={C.amber} />}
      {showBad && <Cap x={1250} y={330} tex="V(B)=\max(-30,0)=0" color={C.amber} />}
      {showNow && <Cap x={1250} y={420} tex="V_{\text{ahora}}=30-10=20" color={C.cyan} size={21} />}
      {showWait && (
        <Cap x={1250} y={510} tex="V_{\text{esperar}}=0{,}5\cdot50=25" color={C.cyan} size={21} />
      )}
      {beat >= 3 && (
        <Cap x={1250} y={600} tex="V_{\text{inicio}}=\max(20,25)=25" color={C.green} size={21} />
      )}
      {beat === 4 && (
        <Cap x={1250} y={690} size={20}>
          Esperar; invertir solo con dato bueno.
        </Cap>
      )}
      {beat === 1 && (
        <>
          <line x1={240} x2={870} y1={820} y2={820} stroke={C.line} strokeWidth={4} />
          {['Hojas', 'A', 'B', 'Azar ahora'].map((label, i) => (
            <g key={label}>
              <line x1={240 + i * 210} x2={240 + i * 210} y1={810} y2={830} stroke={C.muted} />
              <Cap x={240 + i * 210} y={870} size={18}>
                {label}
              </Cap>
            </g>
          ))}
          <Knob x={240 + solved * 210} y={820} axis="x" onPointerDown={drag} color={C.amber} />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Resolver desde las hojas',
  Scene: TreeLesson,
  beats: [
    {
      say: 'Un **árbol de decisiones** separa tus elecciones del azar. El cuadrado inicial permite invertir ahora o esperar un dato que revela el estado; entrar tarde cuesta 10 solo si inviertes.',
      board: {
        label: 'Dos tipos de nodo',
        tex: '\\text{azar: promedio},\\ \\text{decisión: máximo}',
      },
    },
    {
      say: 'Empieza en las hojas: con dato bueno elige entre 60 − 10 y 0; con dato malo, entre −20 − 10 y 0. Después promedia los pagos de invertir ahora, donde todavía desconoces el estado.',
      gate: 'Arrastra la perilla por A, luego B y finalmente «Azar ahora», sin saltarte nodos.',
      board: {
        label: 'Resolver hacia atrás',
        tex: '\\p{1}{V(A)}=\\p{2}{\\max(60-10,0)},\\quad\\p{3}{ V(B)}=\\p{4}{\\max(-20-10,0)}',
      },
    },
    {
      say: 'Al esperar, podrás elegir después del dato: el nodo bueno vale 50 y el malo vale 0. Cada dato tiene probabilidad 0,5.',
      ask: {
        prompt: '¿Cuánto vale esperar, antes de conocer el dato?',
        options: ['25', '50', '20'],
        answer: 0,
        explain:
          'En el círculo promedias: 0,5 · 50 + 0,5 · 0 = 25. El 50 corresponde solo al dato bueno; 20 es el valor de invertir ahora.',
      },
      board: { label: 'Nodo de azar', tex: '\\p{1}{V(s)}=\\p{2}{\\sum_j p_j\\,V(s_j)}' },
    },
    {
      say: 'Llegaste al cuadrado inicial. Compara 20 por invertir ahora con 25 por esperar: eliges esperar y conservas un margen esperado de 5.',
      board: { label: 'Decisión inicial', tex: '\\p{1}{V_{\\text{inicio}}}=\\p{2}{\\max(20,25)}=\\p{3}{25}' },
    },
    {
      say: 'Una **política** especifica qué harás en cada decisión: esperar ahora e invertir solo si el dato es bueno. Resuelve cada nodo cuando ya tengas los valores de sus ramas.',
      board: {
        label: 'Regla del árbol',
        tex: '\\text{azar: promedio},\\ \\text{decisión: máximo}',
        body: 'Los valores son pagos netos. El costo de entrar tarde se resta una vez y solo en la rama donde se invierte.',
      },
    },
  ],
};

function DeskDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <DecisionTree d={EXAMPLE} />
      <Cap x={1250} y={190} size={21}>
        Dato antes de la segunda decisión
      </Cap>
      <Cap x={1250} y={280} size={21}>
        Costo solo si entras tarde: 10
      </Cap>
      {answer !== null &&
        (beats.beat === 0 ? (
          <Cap
            x={1250}
            y={390}
            tex="V_{\text{ahora}}=0{,}5\cdot60-0{,}5\cdot20=20"
            size={19}
            color={C.green}
          />
        ) : (
          <>
            <Cap
              x={1250}
              y={390}
              tex="V_{\text{esperar}}=0{,}5\cdot50=25"
              size={21}
              color={C.green}
            />
            <Cap x={1250} y={480} tex="25>20" color={C.green} />
            <Cap x={1250} y={570} size={21}>
              Esperar; invertir con dato bueno.
            </Cap>
          </>
        ))}
    </Stage>
  );
}

function TreePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 313 + round);
    return {
      p: pick(r, [0.25, 0.4, 0.5, 0.6, 0.75]),
      gain: randInt(r, 4, 9) * 10,
      loss: randInt(r, 1, 4) * 10,
      cost: randInt(r, 1, 10) * 10,
    };
  }, [seed, round]);
  const v = values(d);
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setInput('');
    setChoice(null);
    api.prompt(
      [
        `El dato es bueno: invertir deja ${d.gain} − ${d.cost}; no invertir deja 0. ¿Cuánto vale este nodo de decisión?`,
        `El dato revela el estado; sale bueno con probabilidad ${fmt(d.p)}. Calcula el valor esperado de esperar, eligiendo la mejor acción después del dato. Escribe hasta dos decimales.`,
        'Resuelve el árbol completo. En el cuadrado inicial, ¿conviene invertir ahora, esperar o dan el mismo valor esperado?',
      ][round],
      [
        'V(A)=\\max(g-c,0)',
        'V_{\\text{esperar}}=p\\,\\max(g-c,0)+(1-p)\\,\\max(-l-c,0)',
        'V_{\\text{inicio}}=\\max(V_{\\text{ahora}},V_{\\text{esperar}})',
      ][round],
    );
    api.hints(
      [
        [
          'Calcula el pago neto de invertir con dato bueno.',
          'En un cuadrado eliges el mayor pago; puedes no invertir y recibir 0.',
        ],
        [
          'Resuelve primero los dos cuadrados que vienen después del dato.',
          'Promedia esos dos valores con p y 1 − p. El costo ya está incluido en los pagos netos.',
        ],
        [
          'Invertir ahora vale p · ganancia − (1 − p) · pérdida.',
          'Esperar vale p · máximo(ganancia − costo, 0). Compara ambos valores; puede haber empate.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      const correct =
        Math.abs(v.now - v.wait) < 1e-8 ? 'Empatan' : v.now > v.wait ? 'Invertir ahora' : 'Esperar';
      if (choice === correct)
        return api.result(
          true,
          `Ahora vale ${fmt(v.now)} y esperar vale ${fmt(v.wait)}. ${correct === 'Empatan' ? 'Ambas opciones dan el mismo valor esperado.' : `Conviene ${correct.toLowerCase()}.`}`,
        );
      if (choice === 'Empatan')
        return api.result(
          false,
          'Tener dos ramas no las hace equivalentes. Calcula el valor de cada opción antes de compararlas.',
        );
      if (choice === 'Esperar')
        return api.result(
          false,
          'Esperar permite evitar la pérdida, pero entrar tarde cuesta. Compara el promedio neto de esperar con el de invertir ahora.',
        );
      return api.result(
        false,
        'Al invertir ahora también puede ocurrir el estado malo. Incluye su pérdida y compara con esperar, donde puedes no invertir después del dato.',
      );
    }
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const near = (x: number) => Math.abs(n - x) <= 0.0051;
    const target = round === 0 ? v.good : v.wait;
    if (near(target))
      return api.result(
        true,
        round === 0
          ? `$V(A)=\\max(${d.gain}-${d.cost},0)=${tnum(v.good)}$. ${v.good > 0 ? 'Elige invertir.' : 'No invertir alcanza el máximo de 0.'}`
          : `$V_{\\text{esperar}}=${tnum(d.p)}\\cdot${tnum(v.good)}+${tnum(1 - d.p)}\\cdot0=${tnum(v.wait)}$. Primero eliges y después promedias.`,
      );
    if (round === 0 && near(d.gain - d.cost))
      return api.result(
        false,
        'Ese es el pago de invertir, pero queda bajo 0. En el cuadrado puedes elegir no invertir y recibir 0.',
      );
    if (round === 0 && near((d.gain - d.cost) / 2))
      return api.result(
        false,
        'Promediaste dos acciones. En un cuadrado eliges el máximo; las acciones no son un sorteo.',
      );
    if (round === 0 && near(d.gain))
      return api.result(false, 'Falta restar el costo de entrar después del dato.');
    if (round === 1 && near(v.good))
      return api.result(
        false,
        'Usaste el máximo en un círculo. El dato bueno no está garantizado: pondera por su probabilidad.',
      );
    if (round === 1 && near(d.p * (d.gain - d.cost) + (1 - d.p) * (-d.loss - d.cost)))
      return api.result(
        false,
        'Invertiste después de ambos datos. En cada cuadrado puedes elegir no invertir si el pago es negativo.',
      );
    if (round === 1 && near(d.p * d.gain))
      return api.result(false, 'Falta el costo de entrar tarde en la rama donde inviertes.');
    if (round === 1 && near(v.wait - d.cost))
      return api.result(
        false,
        'Restaste el costo otra vez. Ya está incluido en el pago neto de cada inversión tardía.',
      );
    if (round === 1 && near(d.p * d.gain - d.cost))
      return api.result(
        false,
        'Cobraste el costo aun cuando no inviertes. Réstalo dentro de la rama de inversión y luego pondera.',
      );
    return api.result(
      false,
      round === 0
        ? 'Compara el pago neto de invertir con 0 y elige el mayor.'
        : 'Resuelve cada cuadrado con un máximo. Después promedia esos valores con las probabilidades de las ramas.',
    );
  };
  return (
    <Stage>
      <DecisionTree d={d} />
      <Cap x={1250} y={180} size={22}>
        Ganancia: {d.gain} · Pérdida: {d.loss}
      </Cap>
      <Cap x={1250} y={270} size={22}>
        Costo al invertir tarde: {d.cost}
      </Cap>
      <Cap x={1250} y={360} size={21}>
        P(dato bueno) = {fmt(d.p)}
      </Cap>
      {round === 2 ? (
        <Choices
          x={1250}
          y={490}
          options={['Invertir ahora', 'Esperar', 'Empatan']}
          value={choice}
          onPick={setChoice}
        />
      ) : (
        <NumberField
          x={1080}
          y={490}
          value={input}
          onChange={setInput}
          onEnter={submit}
          label={round === 0 ? 'V(A) =' : 'V(esperar) ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c2',
  world: 'decision',
  code: '13.2',
  title: 'El árbol',
  subtitle: 'Árboles de decisión',
  glyph: '\\max_a Q(s,a)',
  kind: 'level',
  guide: 'valentina',
  teaser: 'La mesa tiene dos horarios de entrada. Valentina necesita decidir antes del cierre.',
  learn: 'Resolver árboles desde las hojas: máximo en decisiones y promedio en nodos de azar.',
  glyphs: ['dec-tree-chance', 'dec-tree-choice'],
  pitfalls: [
    'En un cuadrado eliges el máximo; en un círculo promedias con las probabilidades.',
    'Las decisiones posteriores pueden depender del dato recibido.',
    'El costo de entrar tarde se paga una vez y solo cuando inviertes.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'La Bolsa, 21:54. El reloj de cierre parpadea sobre el vidrio; Valentina mantiene el cursor encima de una orden pendiente.',
        },
        {
          who: 'valentina',
          text: 'Entrar ahora deja sesenta si el anuncio es bueno y pierde veinte si es malo. Mitad y mitad; la posición sigue abierta.',
        },
        { who: 'tu', text: 'Podemos esperar el anuncio y entrar después.' },
        {
          who: 'valentina',
          text: 'Diez de costo por entrar tarde. Con dato malo puedo quedarme fuera, siempre que mi jefe no cierre la mesa antes.',
        },
        { who: 'iris', text: 'Deja esa orden pendiente. Quiero ver las dos rutas.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La orden pendiente',
      Scene: DeskDemo,
      beats: [
        {
          say: 'Valentina conserva la entrada inmediata: probabilidad 0,5 de ganar 60 y 0,5 de perder 20.',
          ask: {
            prompt: '¿Qué valor esperado tiene invertir ahora?',
            options: ['20', '40', '60'],
            answer: 0,
            explain:
              '0,5 · 60 + 0,5 · (−20) = 20. El 40 sale al cambiar el signo de la pérdida; 60 ignora la rama mala.',
          },
          note: {
            label: 'Entrada inmediata',
            tex: 'V_{\\text{ahora}}=0{,}5\\cdot60+0{,}5\\cdot(-20)=20',
          },
        },
        {
          say: 'Si espera, entra solo con dato bueno: gana 60 menos 10 de costo. Con dato malo no invierte y recibe 0.',
          ask: {
            prompt: '¿Qué ruta conviene en el cuadrado inicial?',
            options: ['Esperar', 'Invertir ahora', 'Dan lo mismo'],
            answer: 0,
            explain:
              'Esperar vale 0,5 · 50 + 0,5 · 0 = 25; invertir ahora vale 20. El margen esperado de esperar es 5.',
          },
          note: {
            label: 'La ruta elegida',
            tex: 'V_{\\text{esperar}}=0{,}5\\cdot\\max(60-10,0)+0{,}5\\cdot\\max(-20-10,0)=25',
            body: 'La política espera el anuncio y solo invierte con dato bueno. El costo de entrar tarde se cobra al invertir.',
          },
        },
      ],
    },
    {
      kind: 'challenge',
      title: 'Resolver posiciones antes del cierre',
      Comp: TreePractice,
      rounds: 3,
    },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina retira el cursor de la orden. En la pantalla contigua, una posición ya cerrada conserva la hora de entrada.',
        },
        {
          who: 'valentina',
          text: 'Esperar deja cinco más de margen esperado. Esta cuenta entró antes del anuncio y justo eligió la rama buena.',
        },
        { who: 'iris', text: 'Una vez puede ser suerte.' },
        {
          who: 'valentina',
          text: 'Sí. Por eso guardé los otros horarios fuera del sistema de la mesa.',
        },
        { who: 'nar', text: 'Se quita el audífono y desliza una libreta debajo del teclado.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-tree-chance',
    world: 'decision',
    tex: 'V(s)=\\sum_j p_j\\,V(s_j)',
    name: 'Nodo de azar',
    read: 've de ese, suma de pe sub jota por ve de ese sub jota',
    meaning:
      'Un círculo vale el promedio de los valores de sus ramas, ponderado por sus probabilidades.',
    warn: 'Las probabilidades suman 1; el resultado del azar no se elige.',
  },
  {
    id: 'dec-tree-choice',
    world: 'decision',
    tex: 'V(s)=\\max_a Q(s,a)',
    name: 'Nodo de decisión',
    read: 've de ese, máximo sobre a de cu de ese coma a',
    meaning:
      'Un cuadrado toma el mayor valor entre las acciones disponibles; Q(s,a) es el valor de cada acción.',
    warn: 'Primero resuelve los nodos que vienen después. Puede haber varias acciones con el mismo máximo.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Nodo de azar',
      tex: 'V(s)=\\sum_j p_j\\,V(s_j),\\quad \\sum_j p_j=1',
      body: 'Promedio de valores de continuación con las probabilidades de las ramas.',
    },
    {
      label: 'Nodo de decisión',
      tex: 'V(s)=\\max_a Q(s,a)',
      body: 'Q(s,a) incluye los pagos netos y las decisiones posteriores de esa rama.',
    },
    {
      label: 'Política',
      tex: 'a^*(s)\\in\\operatorname{argmax}_a Q(s,a)',
      body: 'Especifica una acción en cada nodo de decisión, según la información disponible ahí.',
    },
  ],
  props: [
    {
      label: 'Resolver hacia atrás',
      tex: '\\text{hojas}\\longrightarrow\\text{nodos posteriores}\\longrightarrow\\text{inicio}',
      body: 'En un árbol finito, resuelve un nodo cuando todas sus continuaciones ya tengan valor.',
    },
    {
      label: 'Esperar el dato de este caso',
      tex: 'V_{\\text{esperar}}=p\\,\\max(g-c,0)+(1-p)\\,\\max(-l-c,0)',
      body: 'El dato revela el estado. g es la ganancia, l la pérdida y c el costo de invertir después; no invertir paga 0.',
    },
    {
      label: 'Invertir ahora',
      tex: 'V_{\\text{ahora}}=p\\,g-(1-p)\\,l',
      body: 'Se invierte antes de conocer el dato, sin el costo de entrada tardía.',
    },
  ],
};

export { lesson };
