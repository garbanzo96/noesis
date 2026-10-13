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
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, frac, kl2, normalize, tnum } from './kit';

const P = [1 / 4, 1 / 2, 1 / 4];
const Q = [1 / 2, 1 / 2, 0];
// Una familia con soporte fijo: q(a) = (a, 1-a, 0).
// Su mínimo global está en a = p₀/(p₀+p₁) = 1/3, KL = log₂(4/3).
const FAMILY = [0.25, 1 / 3, 0.5];
const TRACK = [280, 550, 820];
const KL_TEX = 'KL(q\\Vert p)=\\sum_i q_i\\log_2\\frac{q_i}{p_i}';

/** Probabilidades de entrada: etiquetas en filas fijas, lejos de las barras. */
function PairBars({
  p,
  q,
  pLabels,
  qLabels,
}: {
  p: number[];
  q: number[];
  pLabels?: string[];
  qLabels?: string[];
}) {
  return (
    <g>
      <Cap x={550} y={130} size={23}>
        p: posterior (ámbar) · q: aproximación (celeste)
      </Cap>
      <line x1={160} x2={940} y1={510} y2={510} stroke={C.line} strokeWidth={2} />
      {p.map((v, i) => {
        const x = 280 + i * 270;
        return (
          <g key={i}>
            <rect x={x - 85} y={510 - v * 290} width={70} height={v * 290} rx={7} fill={C.amber} />
            <rect
              x={x + 15}
              y={510 - Math.max(2, q[i] * 290)}
              width={70}
              height={Math.max(2, q[i] * 290)}
              rx={7}
              fill={C.cyan}
            />
            <Cap x={x} y={555} tex={`x_${i}`} size={23} />
            <Cap x={x} y={625} tex={pLabels?.[i] ?? `p=${tnum(v)}`} size={23} color={C.amber} />
            <Cap x={x} y={695} tex={qLabels?.[i] ?? `q=${tnum(q[i])}`} size={23} color={C.cyan} />
          </g>
        );
      })}
    </g>
  );
}

function FamilyLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState(2);
  const { beat } = beats;
  const a = FAMILY[selected];
  const q = beat === 4 ? [1 / 3, 2 / 3, 0] : beat === 3 ? [a, 1 - a, 0] : Q;
  const drag = useSvgDrag(svg, (px) => {
    if (beat !== 3) return;
    const next = TRACK.reduce(
      (best, x, i) => (Math.abs(px - x) < Math.abs(px - TRACK[best]) ? i : best),
      0,
    );
    setSelected(next);
    if (next === 1) unlock();
  });
  useEffect(() => {
    if (beat === 3 && selected === 1) unlock();
  }, [beat, selected, unlock]);
  return (
    <Stage ref={svg}>
      <PairBars p={P} q={q} />
      <Cap x={1250} y={200} tex="q(a)=(a;1-a;0)" color={C.cyan} size={25} />
      {beat >= 1 && <Cap x={1250} y={290} tex="q_i\log_2\frac{q_i}{p_i}" size={26} />}
      {beat === 1 && <Cap x={1250} y={380} tex="q_i=0\Rightarrow\text{aporte }0" size={23} />}
      {beat === 2 && answer !== null && (
        <Cap x={1250} y={380} tex="KL(q\Vert p)=0{,}5\ \text{bits}" color={C.green} size={24} />
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={380} tex={`a=${selected === 1 ? frac(1, 3) : tnum(a)}`} color={C.cyan} />
          <Cap
            x={1250}
            y={470}
            tex={`KL=${tnum(kl2(q, P), 3)}\\ \\text{bits}`}
            color={selected === 1 ? C.green : C.amber}
            size={25}
          />
          <line x1={TRACK[0]} x2={TRACK[2]} y1={795} y2={795} stroke={C.line} strokeWidth={4} />
          {TRACK.map((x, i) => (
            <Cap key={i} x={x} y={750} tex={i === 1 ? frac(1, 3) : tnum(FAMILY[i])} size={22} />
          ))}
          <Knob
            x={TRACK[selected]}
            y={795}
            axis="x"
            label="a"
            color={C.cyan}
            onPointerDown={drag}
          />
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={380} tex="KL_{\min}=\log_2\tfrac43" color={C.green} size={25} />
          <Cap
            x={1250}
            y={470}
            tex="KL_{\min}\approx0{,}415\ \text{bits}"
            color={C.green}
            size={23}
          />
          <Cap x={1250} y={560} size={20}>
            La familia deja x₂ fuera.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'La familia q y la distancia KL',
  Scene: FamilyLesson,
  beats: [
    {
      say: 'Una **familia variacional** limita las formas que puede tomar q, nuestra aproximación al posterior p. Aquí repartimos entre x₀ y x₁; x₂ queda siempre con probabilidad cero.',
      board: {
        label: 'La familia de dos valores',
        tex: 'p=(\\tfrac14;\\tfrac12;\\tfrac14),\\quad q(a)=(a;1-a;0),\\quad 0\\le a\\le1',
      },
    },
    {
      say: 'La **divergencia KL** suma q por el logaritmo de q/p en cada valor. Usamos base 2, así que medimos en bits; cuando q vale cero, su aporte es cero.',
      board: {
        label: 'Medir el desajuste',
        tex: `${KL_TEX}\\ge0`,
        body: 'La KL tiene dirección: intercambiar p y q cambia la cuenta.',
      },
    },
    {
      say: 'Prueba q = (1/2, 1/2, 0). Las razones q/p de los dos valores que cuentan son 2 y 1.',
      ask: {
        prompt: '¿Cuánto vale KL(q ‖ p) con esta q?',
        options: ['0,5 bits', '1 bit', '0 bits'],
        answer: 0,
        explain:
          'log₂2 = 1 y log₂1 = 0: (1/2)·1 + (1/2)·0 = 0,5 bits. El tercer término aporta cero.',
      },
      board: { label: 'Dos términos que cuentan', tex: '\\tfrac12\\log_2 2+\\tfrac12\\log_2 1' },
    },
    {
      say: 'Compara tres recetas de la misma familia. Mueve a entre 1/4, 1/3 y 1/2 y elige la que deja la menor KL.',
      gate: 'Arrastra la perilla hasta la candidata con menor KL.',
      board: {
        label: 'Elegir dentro de la familia',
        tex: 'q^*=\\arg\\min_{q\\in\\mathcal Q}KL(q\\Vert p)',
      },
    },
    {
      say: 'La mejor q reparte 1/3 y 2/3 entre los dos valores permitidos. Todavía queda un desajuste: esta familia nunca puede copiar la probabilidad de x₂.',
      board: {
        label: 'El límite del molde',
        tex: 'q^*=(\\tfrac13;\\tfrac23;0),\\quad KL(q^*\\Vert p)=\\log_2\\tfrac43\\approx0{,}415',
        body: 'KL = 0 requiere q = p en todos los valores; con esta familia es imposible.',
      },
    },
  ],
};

function FamilyDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <PairBars p={P} q={Q} />
      <Cap x={1250} y={200} size={22}>
        Control pequeño del lector
      </Cap>
      <Cap x={1250} y={290} tex="q=(\tfrac12;\tfrac12;0)" color={C.cyan} />
      {answer !== null &&
        (beats.beat === 0 ? (
          <Cap x={1250} y={380} tex="KL(q\Vert p)=0{,}5\ \text{bits}" color={C.green} size={24} />
        ) : (
          <>
            <Cap x={1250} y={380} tex="q_2=0\ne p_2=\tfrac14" color={C.amber} />
            <Cap x={1250} y={470} size={20}>
              Cambiar a no recupera x₂.
            </Cap>
          </>
        ))}
    </Stage>
  );
}

function FamilyPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 181 + round);
    let rawP: number[], rawQ: number[];
    if (round === 0) {
      const denominator = pick(r, [2, 4, 8]);
      const i = randInt(r, 0, 2);
      rawP = [denominator - 1, denominator - 1, denominator - 1];
      rawP[i] = 2;
      rawQ = [0, 0, 0];
      rawQ[i] = 1;
      // Suma 2·denominator: pᵢ = 1/denominator.
    } else if (round === 1) {
      const high = randInt(r, 0, 2),
        excluded = randInt(r, 0, 2);
      rawP = [1, 1, 1];
      rawP[high] = 2;
      rawQ = [1, 1, 1];
      rawQ[excluded] = 0;
    } else {
      rawP = [randInt(r, 1, 4), randInt(r, 1, 4), randInt(r, 1, 4)];
      rawQ = [randInt(r, 1, 3), randInt(r, 1, 3), 0];
    }
    const p = normalize(rawP),
      q = normalize(rawQ);
    const totalP = rawP.reduce((a, b) => a + b, 0),
      totalQ = rawQ.reduce((a, b) => a + b, 0);
    const terms = q.map((v, i) => (v === 0 ? 0 : v * Math.log2(v / p[i])));
    const unweighted = q.reduce((s, v, i) => s + (v === 0 ? 0 : Math.log2(v / p[i])), 0);
    return { p, q, rawP, rawQ, totalP, totalQ, terms, unweighted, target: kl2(q, p) };
  }, [seed, round]);
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    api.prompt(
      [
        'q concentra toda su probabilidad en un valor. Calcula KL(q ‖ p) en bits.',
        'q reparte por igual entre dos valores. Calcula KL(q ‖ p) en bits; usa dos decimales.',
        'q reparte con pesos distintos entre dos valores. Calcula KL(q ‖ p) en bits; usa dos decimales.',
      ][round],
      KL_TEX,
    );
    api.hints(
      [
        [
          'Solo cuenta el valor donde q = 1.',
          'Su aporte es log₂(1/p); los términos con q = 0 aportan cero.',
        ],
        [
          'Calcula log₂(q/p) para las dos filas con q positiva.',
          'Multiplica cada logaritmo por 1/2 antes de sumar.',
        ],
        [
          'Usa las fracciones de las filas para calcular q/p.',
          'Multiplica cada logaritmo por su propio q; un término puede ser negativo.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.006;
    if (near(d.target))
      return api.result(
        true,
        `KL(q ‖ p) = $${tnum(d.target)}$ bits. Los valores con q = 0 aportan cero.`,
      );
    if (near(-d.target) && d.target > 0.006)
      return api.result(
        false,
        'Invertiste la razón dentro del logaritmo: usa q/p. La KL total no puede ser negativa.',
      );
    if (near(d.unweighted) && Math.abs(d.unweighted - d.target) >= 0.006)
      return api.result(
        false,
        'Sumaste los logaritmos sin sus pesos. Multiplica cada uno por la probabilidad q de su fila.',
      );
    if (near(d.target * Math.LN2) && d.target > 0.03)
      return api.result(
        false,
        'Usaste logaritmos naturales. Para obtener bits, usa log₂ o divide el resultado en nats por ln 2.',
      );
    const positiveOnly = d.terms.reduce((s, t) => s + Math.max(0, t), 0);
    if (near(positiveOnly) && Math.abs(positiveOnly - d.target) >= 0.006)
      return api.result(
        false,
        'Quitaste un término negativo. Puede haber aportes negativos; la suma completa de la KL es la que resulta no negativa.',
      );
    return api.result(
      false,
      'Revisa cada fila: q·log₂(q/p). Si q vale cero, omite ese término; después suma todos los aportes.',
    );
  };
  return (
    <Stage>
      <PairBars
        p={d.p}
        q={d.q}
        pLabels={d.rawP.map((v) => `p=${frac(v, d.totalP)}`)}
        qLabels={d.rawQ.map((v) => `q=${frac(v, d.totalQ)}`)}
      />
      <Cap x={1250} y={230} size={22}>
        Logaritmos en base 2
      </Cap>
      <Cap x={1250} y={320} size={20}>
        Las fracciones son exactas.
      </Cap>
      <NumberField
        x={1060}
        y={440}
        value={value}
        onChange={setValue}
        onEnter={submit}
        label="KL ="
        unit="bits"
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-c4',
  world: 'variational',
  code: '11.4',
  title: 'La familia',
  subtitle: 'Aproximar con q y medir con KL',
  glyph: 'KL(q\\Vert p)',
  kind: 'level',
  guide: 'simon',
  teaser: 'La receta del lector permite dos valores. El control tiene tres.',
  learn:
    'Elegir una aproximación q dentro de una familia y calcular su divergencia KL respecto de p, en bits.',
  glyphs: ['vi-family-q', 'vi-family-kl'],
  pitfalls: [
    'La KL pondera cada logaritmo con q y usa la razón q/p.',
    'Un término con q = 0 aporta cero; si q > 0 y p = 0, la KL es infinita.',
    'La mejor q de una familia restringida puede seguir distinta de p.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio de Los Placeres, 23:22. Simón sostiene una taza fría mientras el rack ilumina de lila una carpeta con su firma.',
        },
        {
          who: 'simon',
          text: 'Este es el molde del lector, dos espacios y listo; el control trae tres. Yo ajustaba la mezcla, el molde venía aprobado de arriba.',
        },
        { who: 'iris', text: 'Tu firma está abajo.' },
        {
          who: 'simon',
          text: 'Sí, en la receta; bueno, también en el molde. Halcón prefería los papeles bien horneados.',
        },
        {
          who: 'tu',
          text: 'Guarda esa versión; la comparo con el control antes de que la reemplacen.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El molde firmado',
      Scene: FamilyDemo,
      beats: [
        {
          say: 'El control pequeño guarda p = (1/4, 1/2, 1/4). La receta firmada usa q = (1/2, 1/2, 0).',
          ask: {
            prompt: '¿Qué desajuste tiene la receta, medido con KL(q ‖ p)?',
            options: ['0,5 bits', '0 bits', '1 bit'],
            answer: 0,
            explain:
              'El primer valor aporta 1/2·log₂2 = 1/2. El segundo aporta 1/2·log₂1 = 0 y el tercero, cero.',
          },
          note: {
            label: 'La receta firmada',
            tex: 'KL(q\\Vert p)=\\tfrac12\\log_2 2+\\tfrac12\\log_2 1=0{,}5',
            body: 'Medida en bits, con el promedio tomado según q.',
          },
        },
        {
          say: 'La familia del lector permite cambiar a en q(a) = (a, 1 − a, 0).',
          ask: {
            prompt: '¿Puede algún ajuste de a copiar este p exactamente?',
            options: [
              'No: x₂ siempre queda fuera',
              'Sí: basta elegir a = 1/3',
              'Sí: basta elegir a = 1/4',
            ],
            answer: 0,
            explain:
              'p da 1/4 a x₂ y toda q de esta familia le da cero. a = 1/3 minimiza la KL, pero no la vuelve cero.',
          },
          note: {
            label: 'Restricción de la familia',
            tex: 'q_2=0,\\quad p_2=\\tfrac14,\\quad\\min KL=\\log_2\\tfrac43>0',
            body: 'El mejor ajuste conserva el límite impuesto por el molde.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir el desajuste', Comp: FamilyPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Simón deja la taza sobre la carpeta, ve el círculo húmedo y la levanta de golpe. Su firma queda dentro del borde.',
        },
        {
          who: 'simon',
          text: 'Podíamos mejorar la mezcla, sí, pero ese tercer espacio nunca entraba al horno. La receta decía que había que subir una cota para ajustar lo demás.',
        },
        { who: 'iris', text: '¿También la firmaste?' },
        { who: 'simon', text: 'La siguiente página; todavía está seca.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-family-q',
    world: 'variational',
    tex: 'q\\in\\mathcal Q',
    name: 'Familia variacional',
    read: 'cu pertenece a la familia cu',
    meaning: 'Conjunto de distribuciones permitidas para aproximar el posterior.',
    warn: 'Sus restricciones pueden impedir que q copie p exactamente.',
  },
  {
    id: 'vi-family-kl',
    world: 'variational',
    tex: 'KL(q\\Vert p)',
    name: 'Divergencia KL',
    read: 'ka ele de cu respecto de pe',
    meaning: 'Suma de q·log₂(q/p): mide el desajuste de q respecto de p en bits.',
    warn: 'Tiene dirección y no es una distancia simétrica.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Familia de aproximaciones',
      tex: 'q\\in\\mathcal Q',
      body: 'Eliges la familia antes de ajustar sus parámetros.',
    },
    {
      label: 'Divergencia en bits',
      tex: KL_TEX,
      body: 'Los términos con q = 0 aportan cero. Si q > 0 donde p = 0, la KL es infinita.',
    },
  ],
  props: [
    {
      label: 'No negatividad',
      tex: 'KL(q\\Vert p)\\ge0',
      body: 'Vale cero exactamente cuando q y p son iguales en todos los valores.',
    },
    {
      label: 'Mejor aproximación en la familia',
      tex: 'q^*=\\arg\\min_{q\\in\\mathcal Q}KL(q\\Vert p)',
      body: 'El mínimo puede ser positivo por las restricciones de la familia.',
    },
    {
      label: 'Ejemplo del control',
      tex: 'KL((\\tfrac12;\\tfrac12;0)\\Vert(\\tfrac14;\\tfrac12;\\tfrac14))=0{,}5\\ \\text{bits}',
    },
  ],
};

export { lesson };
