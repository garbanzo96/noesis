import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, kl2, tnum } from './kit';

// Caso 11.8: familia discreta de tres candidatas unimodales, no todas las q posibles.
const P = [0.45, 0.1, 0.45];
const FAMILY = [
  [0.8, 0.2, 0],
  [0.1, 0.8, 0.1],
  [0, 0.2, 0.8],
];
const TRACK = [280, 550, 820];
const LABELS = ['sano', 'dudoso', 'enfermo'];
const KL_TEX = 'KL(q\\Vert p)=\\sum_i q_i\\log_2\\frac{q_i}{p_i}';

/** Barras pareadas; valores en filas fijas para que ninguna etiqueta se cruce. */
function Humps({ p, q }: { p: number[]; q?: number[] }) {
  return (
    <g>
      <Cap x={550} y={130} size={22}>
        p: posterior (ámbar) · q: aproximación (celeste)
      </Cap>
      <line x1={160} x2={940} y1={510} y2={510} stroke={C.line} strokeWidth={2} />
      {p.map((v, i) => {
        const x = TRACK[i];
        return (
          <g key={i}>
            <rect x={x - 85} y={510 - v * 360} width={70} height={v * 360} rx={7} fill={C.amber} />
            {q && (
              <rect
                x={x + 15}
                y={510 - Math.max(2, q[i] * 360)}
                width={70}
                height={Math.max(2, q[i] * 360)}
                rx={7}
                fill={C.cyan}
              />
            )}
            <Cap x={x} y={555} size={22}>
              {LABELS[i]}
            </Cap>
            <Cap x={x} y={625} tex={`p=${tnum(v)}`} color={C.amber} />
            {q && <Cap x={x} y={695} tex={`q=${tnum(q[i])}`} color={C.cyan} />}
          </g>
        );
      })}
    </g>
  );
}

function HumpsLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState(1);
  const { beat } = beats;
  const q =
    beat === 0 ? undefined : beat === 2 ? FAMILY[selected] : beat >= 4 ? FAMILY[2] : FAMILY[0];
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 2) return;
    const next = TRACK.reduce(
      (best, x, i) => (Math.abs(px - x) < Math.abs(px - TRACK[best]) ? i : best),
      0,
    );
    setSelected(next);
    if (next !== 1) unlock();
  });
  useEffect(() => {
    if (beat === 2 && selected !== 1) unlock();
  }, [beat, selected, unlock]);
  return (
    <Stage ref={svg}>
      <Humps p={P} q={q} />
      <Cap x={1250} y={200} size={22}>
        Dos jorobas en p
      </Cap>
      {beat >= 1 && <Cap x={1250} y={290} tex="KL(q\Vert p)" color={C.cyan} size={26} />}
      {beat === 1 && (
        <>
          <Cap x={1250} y={380} tex="KL(q_1\Vert p)\approx0{,}86" size={23} />
          <Cap x={1250} y={470} tex="KL(q_2\Vert p)\approx1{,}97" size={23} />
          <Cap x={1250} y={560} size={20}>
            Ambas cuentas en bits
          </Cap>
        </>
      )}
      {beat === 2 && (
        <>
          <Cap
            x={1250}
            y={380}
            tex={`KL=${tnum(kl2(FAMILY[selected], P), 4)}\\ \\text{bits}`}
            size={23}
          />
          <Cap x={1250} y={470} size={20}>
            Compara las tres candidatas.
          </Cap>
          <line x1={TRACK[0]} x2={TRACK[2]} y1={795} y2={795} stroke={C.line} strokeWidth={4} />
          {TRACK.map((x, i) => (
            <Cap key={i} x={x} y={750} tex={`q_${i + 1}`} />
          ))}
          <Knob
            x={TRACK[selected]}
            y={795}
            axis="x"
            label="q"
            color={C.cyan}
            onPointerDown={drag}
          />
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={380} tex="q_1(E)=0,\quad p(E)=0{,}45" size={22} />
          <Cap x={1250} y={470} tex="KL(p\Vert q_1)=+\infty" color={C.magenta} />
          <Cap x={1250} y={560} size={20}>
            La dirección cambia el costo.
          </Cap>
        </>
      )}
      {beat === 4 && answer !== null && (
        <>
          <Cap x={1250} y={380} tex="q_3(S)=0,\quad p(S)=0{,}45" color={C.magenta} size={22} />
          <Cap x={1250} y={470} size={21}>
            Los sanos quedaron fuera.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Dos jorobas y una KL con dirección',
  Scene: HumpsLesson,
  beats: [
    {
      say: 'El posterior p tiene dos **modas**, o jorobas: sano y enfermo. La familia que probaremos tiene solo tres candidatas, cada una con una sola joroba.',
      board: {
        label: 'Dos jorobas',
        tex: '\\p{1}{p}=\\p{2}{(0{,}45;0{,}1;0{,}45)}',
        parts: ['posterior con dos jorobas', 'probabilidades del caso'],
      },
    },
    {
      say: 'q₁ = (0,8; 0,2; 0) se queda del lado sano; q₂ = (0,1; 0,8; 0,1) se concentra en el valle. KL(q ‖ p) promedia según q: poner mucha probabilidad en ese valle cuesta más.',
      board: [
        { label: 'La dirección del promedio', tex: KL_TEX },
        {
          label: 'Dos candidatas',
          tex: '\\p{1}{KL(q_1\\Vert p)}\\approx\\p{2}{0{,}8641},\\quad\\p{3}{ KL(q_2\\Vert p)}\\approx\\p{4}{1{,}9660}',
          parts: [
            'costo del lado sano',
            'desajuste en bits',
            'costo del valle',
            'desajuste en bits',
          ],
        },
      ],
    },
    {
      say: 'Agrega q₃ = (0; 0,2; 0,8), reflejada hacia enfermo. Compara las tres: las dos de los extremos empatan en el mínimo de esta familia.',
      gate: 'Arrastra la perilla a una candidata que minimice KL(q ‖ p).',
      board: {
        label: 'Elegir entre las tres',
        tex: '\\p{1}{\\mathcal Q}=\\p{2}{\\{q_1,q_2,q_3\\}},\\quad\\p{3}{ q^*\\in\\arg\\min_{q\\in\\mathcal Q}KL(q\\Vert p)}',
        parts: [
          'familia de aproximaciones',
          'tres candidatas permitidas',
          'candidata de menor costo',
        ],
      },
    },
    {
      say: 'Invertir la KL cambia los pesos. En KL(p ‖ q₁), los enfermos pesan 0,45 y q₁ les da cero: el costo es infinito; en KL(q₁ ‖ p), ese término aporta cero.',
      board: {
        label: 'Al invertir la dirección',
        tex: '\\p{1}{p_i>0,\\ q_i}=\\p{2}{0}\\quad\\Rightarrow\\quad\\p{3}{ KL(p\\Vert q)}=\\p{4}{+\\infty}',
        parts: [
          'probabilidades en conflicto',
          'probabilidad omitida',
          'costo al invertir',
          'penalización infinita',
        ],
      },
    },
    {
      say: 'El Laboratorio se quedó con q₃, del lado enfermo. Mira qué pasa con la otra joroba del posterior.',
      ask: {
        prompt: '¿Qué joroba ignora el Laboratorio si su q se queda con «enfermo»?',
        options: ['La de los sanos', 'La de los enfermos', 'Ninguna: q copia ambas'],
        answer: 0,
        explain:
          'q₃ da cero a sano, aunque p le da 0,45. Minimizar esta KL dentro de una familia restringida puede dejar fuera una joroba completa.',
      },
      board: {
        label: 'La receta del Laboratorio',
        tex: '\\p{1}{q_3}=\\p{2}{(0;0{,}2;0{,}8)}',
        body: 'Las dos candidatas laterales empatan; la KL por sí sola no obliga a elegir enfermo.',
        parts: ['aproximación guardada', 'reparto hacia enfermo'],
      },
    },
  ],
};

function RecipeDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <Humps p={P} q={FAMILY[2]} />
      <Cap x={1250} y={200} size={22}>
        Receta guardada: q₃
      </Cap>
      <Cap x={1250} y={290} tex="KL(q_3\Vert p)\approx0{,}86" size={23} />
      {answer !== null &&
        (beats.beat === 0 ? (
          <Cap x={1250} y={380} tex="KL(p\Vert q_3)=+\infty" color={C.magenta} />
        ) : (
          <>
            <Cap x={1250} y={380} tex="KL(q_1\Vert p)=KL(q_3\Vert p)" size={21} color={C.green} />
            <Cap x={1250} y={470} size={20}>
              La elección de lado quedó en la receta.
            </Cap>
          </>
        ))}
    </Stage>
  );
}

function HumpsPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 227 + round);
    const valley = pick(r, [0.08, 0.1, 0.12, 0.16]);
    const p = [(1 - valley) / 2, valley, (1 - valley) / 2];
    const middle = pick(r, [0.16, 0.2, 0.24]);
    const side = pick(r, [0, 2]);
    const lateral = side === 0 ? [1 - middle, middle, 0] : [0, middle, 1 - middle];
    const central = [middle / 2, 1 - middle, middle / 2];
    const lateralFirst = pick(r, [true, false]);
    const candidates = lateralFirst ? [lateral, central] : [central, lateral];
    const target = kl2(lateral, p);
    const unweighted = lateral.reduce((s, v, i) => s + (v === 0 ? 0 : Math.log2(v / p[i])), 0);
    return { p, lateral, candidates, target, unweighted, best: lateralFirst ? 1 : 2 };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setValue('');
    setChoice(null);
    api.prompt(
      [
        'Calcula KL(q ‖ p) con los datos de las barras. Usa dos decimales y logaritmos en base 2.',
        'Compara las dos candidatas de una joroba. Escribe 1 o 2 para elegir la que tiene menor KL(q ‖ p).',
        'Con los datos de las barras, ¿cuánto vale KL(p ‖ q)? Fíjate en la dirección.',
      ][round],
      round === 2 ? 'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}' : KL_TEX,
    );
    api.hints(
      [
        [
          'Solo suman los valores donde q es positiva.',
          'Multiplica cada log₂(q/p) por su q y suma; un aporte puede ser negativo.',
        ],
        [
          'Calcula la KL de cada candidata usando sus propios pesos q.',
          'Concentrarse en el valle pone mucho peso donde p es pequeña.',
        ],
        [
          'Ahora el promedio usa p, no q.',
          'Busca un valor con p positiva y q igual a cero: aparece una división por cero.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === 'Infinita')
        return api.result(
          true,
          'p da probabilidad positiva al valor que q dejó en cero: KL(p ‖ q) = $+\\infty$.',
        );
      return api.result(
        false,
        choice === 'Igual a KL(q ‖ p)'
          ? 'Intercambiaste las distribuciones como si la KL fuera simétrica. Aquí p pesa un valor al que q da cero.'
          : 'Un cero en q no anula el término cuando el promedio usa p. p es positiva ahí y el denominador q vale cero.',
      );
    }
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    if (round === 1) {
      if (v === d.best)
        return api.result(
          true,
          `La candidata ${d.best} tiene ${fmt(d.target)} bits; la del valle tiene ${fmt(kl2(d.candidates[2 - d.best], d.p))} bits.`,
        );
      return api.result(
        false,
        v === 1 || v === 2
          ? 'Elegiste la del valle. Cubrir ambos extremos con una probabilidad pequeña cuesta más aquí porque casi todo q queda donde p es baja.'
          : 'Escribe el número de la candidata, 1 o 2; aquí eliges una receta, no el valor de su KL.',
      );
    }
    const near = (n: number) => Math.abs(v - n) < 0.006;
    if (near(d.target))
      return api.result(
        true,
        `KL(q ‖ p) ≈ $${tnum(d.target)}$ bits. El valor con q = 0 aporta cero en esta dirección.`,
      );
    if (near(-d.target))
      return api.result(
        false,
        'Invertiste la razón: dentro del logaritmo va q/p. La suma de la KL no puede ser negativa.',
      );
    if (near(d.unweighted))
      return api.result(
        false,
        'Faltan los pesos q: cada logaritmo se multiplica por su probabilidad q antes de sumar.',
      );
    if (near(d.target * Math.LN2))
      return api.result(false, 'Usaste logaritmos naturales. Usa base 2 para responder en bits.');
    return api.result(
      false,
      'Suma q·log₂(q/p) en las dos filas con q positiva. El tercer término aporta cero; no inviertas la dirección.',
    );
  };
  return (
    <Stage>
      <Humps p={d.p} q={round === 1 ? undefined : d.lateral} />
      {round === 1 ? (
        <>
          <Cap x={1250} y={210} size={21}>
            Candidatas (sano; dudoso; enfermo)
          </Cap>
          {d.candidates.map((q, i) => (
            <Cap
              key={i}
              x={1250}
              y={300 + i * 90}
              tex={`q_${i + 1}=(${q.map((v) => tnum(v)).join(';')})`}
              size={23}
              color={C.cyan}
            />
          ))}
        </>
      ) : (
        <Cap x={1250} y={230} size={21}>
          Datos de entrada · base 2
        </Cap>
      )}
      {round === 2 ? (
        ['Infinita', '0 bits', 'Igual a KL(q ‖ p)'].map((option, i) => (
          <Choices
            key={option}
            x={1250}
            y={400 + i * 90}
            options={[option]}
            value={choice}
            onPick={setChoice}
          />
        ))
      ) : (
        <NumberField
          x={1060}
          y={500}
          value={value}
          onChange={setValue}
          onEnter={submit}
          label={round === 0 ? 'KL =' : 'Candidata ='}
          unit={round === 0 ? 'bits' : undefined}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c8',
  world: 'variational',
  code: '11.8',
  title: 'Dos jorobas',
  subtitle: 'La dirección de la KL',
  glyph: 'KL(q\\Vert p)',
  kind: 'level',
  guide: 'simon',
  teaser: 'El posterior tiene dos jorobas. La receta guardada conserva la de los enfermos.',
  learn:
    'Comparar aproximaciones de una joroba y reconocer cómo la dirección de la KL permite omitir parte del posterior.',
  glyphs: ['vi-humps-direction', 'vi-humps-missing-support'],
  pitfalls: [
    'KL(q ‖ p) y KL(p ‖ q) pueden tener valores muy distintos.',
    'Una KL finita no garantiza que q conserve todas las jorobas de p.',
    'En este posterior simétrico, las dos candidatas laterales empatan; la KL no exige elegir enfermo.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio de Los Placeres, pasada la medianoche. El ventilador del rack vibraba contra el vidrio, y Simón tapaba con la manga el logo de su antigua credencial.',
        },
        {
          who: 'teo',
          text: 'Encontré el control completo. Tiene un grupo sano tan grande como el enfermo.',
        },
        {
          who: 'simon',
          text: 'La receta admite una sola joroba, y la otra queda fuera. Abre la versión guardada antes de que cambie el turno.',
        },
        { who: 'iris', text: '¿Cuál dejaron fuera?' },
        { who: 'simon', text: 'Míralo tú. Yo perdí un trabajo por preguntar eso.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La receta guardada',
      Scene: RecipeDemo,
      beats: [
        {
          say: 'El archivo usa q₃ = (0; 0,2; 0,8). El control conserva p = (0,45; 0,1; 0,45).',
          ask: {
            prompt: 'Si inviertes la cuenta, ¿cuánto vale KL(p ‖ q₃)?',
            options: ['Infinita', '0,86 bits', '0 bits'],
            answer: 0,
            explain:
              'p(sano) = 0,45 y q₃(sano) = 0: el promedio según p incluye log₂(0,45/0). Por eso la KL inversa es infinita.',
          },
          note: {
            label: 'Lo que la receta omite',
            tex: 'p(S)=0{,}45,\\quad q_3(S)=0,\\quad KL(p\\Vert q_3)=+\\infty',
          },
        },
        {
          say: 'El archivo conserva la joroba enferma. El posterior es simétrico y la candidata reflejada q₁ conserva la sana.',
          ask: {
            prompt: '¿La menor KL(q ‖ p) obligaba a elegir la joroba enferma?',
            options: [
              'No: ambas candidatas laterales empatan',
              'Sí: enfermo siempre cuesta menos',
              'Sí: la KL de q₁ es infinita',
            ],
            answer: 0,
            explain:
              'q₁ y q₃ dan ambas 0,8641 bits. La elección del lado enfermo está en la receta guardada, no determinada por esa comparación.',
          },
          note: {
            label: 'El lado elegido',
            tex: 'KL(q_1\\Vert p)=KL(q_3\\Vert p)\\approx0{,}8641',
            body: 'El Laboratorio guardó q₃: la joroba de los sanos desaparece de la aproximación.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Comparar jorobas', Comp: HumpsPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Teo dejó abierta la receta del lector y apartó las manos del teclado. Simón miraba el pasillo reflejado en la pantalla.',
        },
        { who: 'iris', text: 'Eligieron la de los enfermos. Los sanos estaban en el control.' },
        {
          who: 'simon',
          text: 'El ajuste aceptaba cualquiera de las dos. Yo dije que la receta daba un mínimo y no terminé la frase.',
        },
        { who: 'tu', text: 'El empate también va en el informe.' },
        {
          who: 'simon',
          text: 'Entonces guarda la página completa. La versión que mandaron a la Clínica tenía solo la mitad.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-humps-direction',
    world: 'variational',
    tex: 'KL(q\\Vert p)\\ne KL(p\\Vert q)',
    name: 'Dirección de la KL',
    read: 'ka ele de cu respecto de pe; ka ele de pe respecto de cu',
    meaning:
      'El primer argumento fija los pesos del promedio; invertir los argumentos cambia la cuenta en general.',
    warn: 'En algunos pares ambas KL coinciden; no es una desigualdad universal.',
  },
  {
    id: 'vi-humps-missing-support',
    world: 'variational',
    tex: 'p_i>0,\\ q_i=0\\Rightarrow KL(p\\Vert q)=+\\infty',
    name: 'Probabilidad omitida',
    read: 'pe positiva y cu cero implican ka ele de pe respecto de cu infinita',
    meaning:
      'La KL es infinita si su primer argumento da probabilidad positiva donde el segundo da cero.',
    warn: 'En la dirección q respecto de p, un término con q igual a cero aporta cero.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'KL en bits',
      tex: KL_TEX,
      body: 'El promedio usa q y el logaritmo tiene base 2; los términos con q = 0 aportan cero.',
    },
    {
      label: 'Dirección inversa',
      tex: 'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}',
      body: 'Si p es positiva donde q vale cero, la divergencia es infinita.',
    },
    {
      label: 'Familia del ejemplo',
      tex: '\\mathcal Q=\\{(0{,}8;0{,}2;0),(0{,}1;0{,}8;0{,}1),(0;0{,}2;0{,}8)\\}',
      body: 'Tres candidatas de una joroba; el mínimo se refiere a este conjunto.',
    },
  ],
  props: [
    {
      label: 'Comparación',
      tex: 'KL(q_1\\Vert p)=KL(q_3\\Vert p)\\approx0{,}8641<1{,}9660\\approx KL(q_2\\Vert p)',
      body: 'En este ejemplo, concentrarse en el valle cuesta más que conservar una sola joroba.',
    },
    {
      label: 'Dos jorobas fuera de la familia',
      tex: 'KL((0{,}5;0;0{,}5)\\Vert p)=\\log_2\\tfrac{10}{9}\\approx0{,}1520',
      body: 'Esta q mejora la cuenta, pero tiene dos jorobas y queda fuera de la familia elegida. El resultado depende de esa restricción.',
    },
  ],
};

export { lesson };
