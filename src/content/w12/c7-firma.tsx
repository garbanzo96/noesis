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
import { Bars, benford, fmt, tnum } from './kit';

// ============================================================================
// CASO 12.7 · «La firma» — ley de Benford
// En montos reales, el primer dígito d aparece con P(d) = log₁₀(1 + 1/d): 0,301 para el 1 y
// 0,046 para el 9. Los registros de la máquina tienen primeros dígitos casi uniformes (≈ 0,111).
// ============================================================================

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BEN = DIGITS.map((_, i) => benford(i + 1));
const UNIFORM = DIGITS.map(() => 1 / 9);
const BAR = { x: 200, base: 600, w: 720, h: 380, max: 0.35 };
const RULER = { x: 200, y: 640, w: 720 };

/** a log ruler from 1 to 10: the room for each first digit is log₁₀(d+1) − log₁₀(d) */
function LogRuler() {
  return (
    <g>
      {DIGITS.map((d, i) => {
        const a = Math.log10(i + 1),
          b = Math.log10(i + 2);
        return (
          <g key={d}>
            <rect
              x={RULER.x + a * RULER.w}
              y={RULER.y}
              width={(b - a) * RULER.w}
              height={44}
              fill={i === 0 ? C.amber : C.cyan}
              fillOpacity={i === 0 ? 0.75 : 0.3}
              stroke={C.bg}
              strokeWidth={2}
            />
            <Cap x={RULER.x + ((a + b) / 2) * RULER.w} y={RULER.y + 22} size={17} color={C.text}>
              {d}
            </Cap>
          </g>
        );
      })}
      <Cap x={RULER.x + RULER.w / 2} y={RULER.y + 74} size={18} color={C.muted}>
        Escala logarítmica de 1 a 10: ir de 1 a 2 es duplicar; de 9 a 10, apenas un 11 % más.
      </Cap>
    </g>
  );
}

function BenfordLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [p1, setP1] = useState(1 / 9);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (_px, py) => {
    const v = clamp((BAR.base - py) / BAR.h, 0, 1) * BAR.max;
    setP1(v);
    if (Math.abs(v - BEN[0]) < 0.012) {
      setP1(BEN[0]);
      unlock();
    }
  });
  const values = beat === 2 ? [p1, ...BEN.slice(1)] : beat === 3 && answer !== null ? UNIFORM : BEN;
  return (
    <Stage ref={svg}>
      {beat !== 1 && (
        <Bars
          labels={DIGITS}
          values={values}
          color={beat === 3 && answer !== null ? C.magenta : C.amber}
          x={BAR.x}
          base={BAR.base}
          w={BAR.w}
          h={BAR.h}
          max={BAR.max}
          digits={3}
        />
      )}
      {beat === 1 && <LogRuler />}
      {beat === 1 && (
        <Bars
          labels={DIGITS}
          values={BEN}
          x={BAR.x}
          base={560}
          w={BAR.w}
          h={300}
          max={BAR.max}
          digits={3}
        />
      )}
      {beat === 2 && (
        <Knob
          x={BAR.x + BAR.w / 18}
          y={BAR.base - (p1 / BAR.max) * BAR.h}
          onPointerDown={drag}
          axis="y"
          color={C.amber}
        />
      )}
      <Cap x={550} y={150} size={21} color={C.muted}>
        {beat === 3 && answer !== null
          ? 'Primeros dígitos en los registros de la máquina'
          : 'Primer dígito de montos reales de compras'}
      </Cap>
      <Cap x={1270} y={220} tex="P(d)=\log_{10}\!\left(1+\tfrac1d\right)" color={C.amber} />
      {beat >= 2 && (
        <Cap x={1270} y={310} tex={`P(1)=${tnum(beat === 2 ? p1 : BEN[0], 3)}`} color={C.amber} />
      )}
      {beat === 3 && answer !== null && (
        <Cap x={1270} y={400} tex="\text{máquina}:\ P(1)\approx0{,}111" color={C.magenta} />
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'La ley de Benford',
  intro: {
    question: '¿Por qué en las cifras reales el primer dígito es 1 tan seguido?',
    text: 'En muchos datos reales, como montos o poblaciones, el primer dígito no es parejo: el 1 aparece cerca de un 30 % de las veces. Esa es la ley de Benford, y los datos inventados suelen romperla. Las facturas de La Fábrica pasan los controles de proporciones, pero los montos no tienen esa firma.',
  },
  Scene: BenfordLesson,
  beats: [
    {
      say: 'La **ley de Benford** describe la distribución del primer dígito significativo $d$, entre 1 y 9, en ciertos conjuntos de cantidades. Se aplica de forma aproximada a datos que abarcan varios órdenes de magnitud y crecen multiplicando, como muchos montos de compras.\n\n$P(d)$ se lee «probabilidad de de» y $\\log_{10}$, «logaritmo en base diez». La ley asigna cerca del 30 % al 1 y menos del 5 % al 9; no se aplica a cualquier lista de números.',
      board: {
        label: 'Ley de Benford',
        tex: '\\p{1}{P(d)}=\\p{2}{\\log_{10}\\!\\left(1+\\tfrac1d\\right)}',
        parts: ['probabilidad del dígito', 'proporción según benford'],
      },
    },
    {
      say: 'En una **escala logarítmica**, distancias iguales representan factores de multiplicación iguales. El tramo de 1 a 2 ocupa más espacio que el de 9 a 10: el primero duplica la cantidad y el segundo la aumenta cerca de un 11 %.\n\nEl ancho del tramo de un dígito $d$ es $\\log_{10}(d+1)-\\log_{10}d$, que equivale a $\\log_{10}(1+1/d)$. Si los logaritmos se distribuyen de manera uniforme en esta escala, ese ancho da la probabilidad de cada primer dígito.',
      board: {
        label: 'El ancho de cada dígito',
        tex: '\\p{1}{\\log_{10}(d+1)-\\log_{10}d}\\p{2}{=\\log_{10}\\!\\left(1+\\tfrac1d\\right)}',
        parts: ['ancho en escala logarítmica', 'probabilidad del dígito'],
      },
    },
    {
      say: 'Para hallar la probabilidad del primer dígito 1, sustituye $d=1$ en la fórmula de Benford. La expresión $P(1)$ se lee «probabilidad de uno». El resultado es una proporción entre 0 y 1, que también puedes expresar como porcentaje.',
      gate: '¿Qué proporción predice Benford para el primer dígito 1? Calcula $\\log_{10}2$ y ajusta la barra mirando el valor de $P(1)$.',
      after:
        '$\\log_{10}2\\approx0{,}301$: cerca del 30,1 % de los montos que siguen Benford empieza con 1. Esa proporción sirve para comparar los registros con la ley.',
      board: {
        label: 'El dígito 1',
        tex: '\\p{1}{P(1)}=\\p{2}{\\log_{10}2}\\p{3}{\\approx0{,}301}',
        parts: ['probabilidad de empezar en 1', 'con la ley de benford', 'proporción de unos'],
      },
    },
    {
      say: 'La máquina de la Fábrica aprendió las proporciones de las columnas, pero sortea los montos parejo dentro de cada rango. Si los nueve primeros dígitos tienen la misma probabilidad, la suma de sus probabilidades debe ser 1. Usa esa condición para comparar el reparto con Benford.',
      ask: {
        prompt: 'Si los primeros dígitos salen parejos, ¿qué fracción empieza con 1?',
        options: ['≈ 0,111', '≈ 0,301', '0,5'],
        answer: 0,
        explain:
          'Parejo entre 9 dígitos es 1/9 ≈ 0,111: casi tres veces menos que en los montos reales.',
      },
      board: {
        label: 'Parejo',
        tex: '\\p{1}{P(d)}=\\p{2}{\\tfrac19\\approx0{,}111}',
        parts: ['probabilidad del dígito', 'proporción con sorteo parejo'],
      },
    },
    {
      say: 'Comparar las frecuencias de los primeros dígitos con Benford es una prueba sencilla para buscar irregularidades en montos. Una diferencia grande puede justificar una revisión, pero por sí sola no demuestra que los datos sean fabricados. Antes de comparar, hay que evaluar si los datos cumplen las condiciones para seguir la ley.',
      board: {
        label: 'La firma',
        tex: '\\p{1}{\\text{real}\\approx\\text{Benford}},\\ \\p{2}{\\text{fabricado}\\approx\\text{parejo}}',
        parts: ['firma de montos reales', 'firma de montos fabricados'],
      },
    },
  ],
};

function AmountsDemo({ beats, unlock }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const unlocked = useRef(new Set<number>());
  const [count, setCount] = useState(100);
  const [marked, setMarked] = useState<number[]>([]);
  const { beat } = beats;
  const finish = (step: number) => {
    if (beat === step && !unlocked.current.has(step)) {
      unlocked.current.add(step);
      unlock();
    }
  };
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 0) return;
    const next = Math.round(clamp((x - 200) / 720, 0, 1) * 500);
    setCount(next);
    if (Math.abs(next - 301) <= 10) finish(0);
  });
  const observed = [112, 109, 113, 110, 111, 112, 109, 112, 112];
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <>
          <Cap x={560} y={220} size={28} color={C.text}>Montos que empiezan con 1</Cap>
          <Cap x={560} y={310} size={32} color={C.amber}>{`${count} de 1000`}</Cap>
          <line x1={200} x2={920} y1={480} y2={480} stroke={C.line} strokeWidth={4} />
          {[0, 100, 200, 300, 400, 500].map((n) => (
            <Cap key={n} x={200 + (n / 500) * 720} y={540} size={24} color={C.muted}>
              {n}
            </Cap>
          ))}
          <Knob x={200 + (count / 500) * 720} y={480} onPointerDown={drag} axis="x" color={C.amber} />
          <Cap x={1260} y={300} size={26} tex="P(1)=\log_{10}2" color={C.amber} />
        </>
      ) : (
        <>
          <Cap x={560} y={150} size={26} color={C.text}>Primeros dígitos del lote: 1000 montos</Cap>
          <line x1={190} x2={930} y1={600} y2={600} stroke={C.line} strokeWidth={2} />
          {observed.map((n, i) => {
            const x = 200 + i * 80;
            const height = (n / 350) * 380;
            return (
              <g key={i}>
                <rect x={x + 12} y={600 - height} width={56} height={height} rx={6} fill={C.magenta} fillOpacity={0.75} />
                <Cap x={x + 40} y={600 - height - 24} size={24} color={C.text}>{n}</Cap>
                <Cap x={x + 40} y={635} size={24} color={C.muted}>{DIGITS[i]}</Cap>
                <Cap x={x + 40} y={680} size={24} color={C.amber}>{Math.round(BEN[i] * 1000)}</Cap>
                {beat === 1 && (
                  <Choices
                    x={x + 40}
                    y={735}
                    options={[i + 1]}
                    value={marked.includes(i + 1) ? i + 1 : null}
                    onPick={(digit) => {
                      const next = marked.includes(digit) ? marked.filter((d) => d !== digit) : [...marked, digit];
                      setMarked(next);
                      if (beat === 1 && next.length === 3 && [1, 2, 3].every((d) => next.includes(d))) finish(1);
                    }}
                  />
                )}
              </g>
            );
          })}
          <Cap x={1260} y={240} size={26} color={C.text}>Arriba: conteos del lote</Cap>
          <Cap x={1260} y={300} size={26} color={C.amber}>Abajo: esperados por Benford</Cap>
          <Cap x={1260} y={360} size={24} color={C.muted}>Marca los dígitos bajo lo esperado</Cap>
        </>
      )}
    </Stage>
  );
}

function BenfordPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 179 + round);
    const dig = randInt(r, 1, 9);
    const n = pick(r, [500, 1000, 2000]);
    const k = randInt(r, 2, 5);
    return { dig, n, k, p: benford(dig), upTo: Math.log10(k + 1) };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    api.prompt(
      [
        `Según Benford, ¿qué probabilidad tiene el primer dígito ${d.dig}? Tres decimales.`,
        `En ${d.n} montos reales, ¿cuántos esperas que empiecen con ${d.dig}? Redondea al entero.`,
        `¿Qué probabilidad tiene un monto real de empezar con un dígito entre 1 y ${d.k}? Tres decimales.`,
      ][round],
      ['P(d)=\\log_{10}(1+\\tfrac1d)', 'n\\cdot P(d)', 'P(d\\le k)=\\log_{10}(k+1)'][round],
    );
    api.hints(
      [
        ['Calcula 1 + 1/d.', 'Saca logaritmo en base 10.'],
        ['Primero P(d) con Benford.', 'Multiplica por la cantidad de montos.'],
        ['La suma de los tramos de 1 a k va de log 1 a log(k + 1).', 'log₁₀ 1 = 0.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.p) < 0.0011)
        return api.result(true, `$\\log_{10}(1+\\tfrac1{${d.dig}})\\approx${tnum(d.p, 3)}$.`);
      if (Math.abs(v - 1 / 9) < 0.002)
        return api.result(
          false,
          'Eso es repartir parejo. Benford le da más peso a los dígitos chicos.',
        );
      return api.result(false, `Calcula log₁₀(1 + 1/${d.dig}).`);
    }
    if (round === 1) {
      const t = Math.round(d.n * d.p);
      if (Math.abs(v - t) <= 1)
        return api.result(true, `$${d.n}\\cdot${tnum(d.p, 3)}\\approx${t}$.`);
      if (Math.abs(v - d.n / 9) <= 1)
        return api.result(false, 'Repartiste parejo. Usa la probabilidad de Benford.');
      return api.result(false, `P(${d.dig}) ≈ ${fmt(d.p, 3)}; multiplícalo por ${d.n}.`);
    }
    if (Math.abs(v - d.upTo) < 0.0011)
      return api.result(true, `$\\log_{10}${d.k + 1}\\approx${tnum(d.upTo, 3)}$.`);
    if (Math.abs(v - d.k / 9) < 0.002)
      return api.result(
        false,
        'Esa suma es pareja. Con Benford, los tramos se suman hasta log₁₀(k + 1).',
      );
    return api.result(false, `Suma los tramos de 1 a ${d.k}: queda log₁₀(${d.k + 1}).`);
  };
  return (
    <Stage>
      <LogRuler />
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['P(d) =', 'montos =', 'P(d ≤ k) ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c7',
  world: 'generative',
  code: '12.7',
  title: 'La firma',
  subtitle: 'Ley de Benford',
  glyph: '\\log_{10}(1+\\tfrac1d)',
  kind: 'level',
  guide: 'joaquin',
  teaser:
    'Los registros pasan todos los controles de proporciones. Joaquín tiene una sospecha con los montos.',
  learn:
    'Usar la ley de Benford para el primer dígito de montos reales y reconocer la firma de datos fabricados.',
  glyphs: ['gen-benford'],
  pitfalls: [
    'Benford vale para cantidades que crecen multiplicando y abarcan varios órdenes de magnitud.',
    'Un reparto parejo de primeros dígitos es sospechoso en montos reales.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Oficina de turno, diez para las tres. Joaquín ordenaba facturas de compras de dosis sobre el mesón, y el café se enfriaba en un frasco de vidrio.',
        },
        {
          who: 'joaquin',
          text: 'Llevo veinte años viendo facturas. Las verdaderas empiezan con 1 una y otra vez, y estas no.',
        },
        { who: 'teo', text: 'Eso tiene nombre: ley de Benford.' },
        { who: 'iris', text: 'Entonces cuenta los primeros dígitos.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Los montos del lote',
      Scene: AmountsDemo,
      beats: [
        {
          say: 'Tenemos mil montos reales de compras de la Clínica, de otros años. Usemos Benford para estimar cuántos deberían empezar con 1 y tener una referencia para comparar el lote.',
          gate: '¿Cuántos esperas que empiecen con 1? Calcula $1000\\cdot\\log_{10}2$ y ubica tu estimación en la escala.',
          after: 'De 1000 montos se esperan cerca de 301 que empiecen con 1, porque $1000\\cdot0{,}301\\approx301$.',
          note: { label: 'Montos reales', tex: '1000\\cdot0{,}301\\approx301' },
        },
        {
          say: 'Ahora tenemos mil montos del lote de la Fábrica. El gráfico muestra cuántos empiezan con cada dígito.',
          gate: 'Compara cada conteo del lote con el esperado por Benford. Marca los dígitos que aparecen menos veces de lo esperado.',
          after: 'Los dígitos 1, 2 y 3 aparecen 112, 109 y 113 veces, frente a 301, 176 y 125 esperadas por Benford. Los conteos del lote van de 109 a 113, cerca de un reparto parejo.',
          note: {
            label: 'Lote de la Fábrica',
            tex: '112\\ll301',
            body: 'Los primeros dígitos del lote son casi parejos.',
          },
        },
        {
          say: 'El lote tiene 112 montos que empiezan con 1, frente a los 301 esperados según Benford.',
          ask: {
            prompt: 'En el lote de la Fábrica, 112 empiezan con 1. ¿Qué indica?',
            options: [
              'Los primeros dígitos salen parejos: firma de fabricación',
              'Son montos reales',
              'Nada: es azar',
            ],
            answer: 0,
            explain: '112 de 1000 está cerca de 1/9 y lejos de 301. El reparto parejo justifica revisar el lote.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Contar primeros dígitos', Comp: BenfordPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín juntó las facturas falsas en una pila aparte, y fue la pila más alta.',
        },
        {
          who: 'joaquin',
          text: 'En la central dicen que ya lo corrigieron, que el lote nuevo sale perfecto.',
        },
        {
          who: 'iris',
          text: 'Veamos el lote nuevo, entonces. Una cifra demasiado perfecta también se puede medir.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-benford',
    world: 'generative',
    tex: 'P(d)=\\log_{10}(1+\\tfrac1d)',
    name: 'Ley de Benford',
    read: 'pe de de igual logaritmo de uno más uno sobre de',
    meaning: 'Probabilidad del primer dígito en cantidades que crecen multiplicando.',
    warn: 'No vale para números con un rango estrecho, como estaturas o códigos.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Ley de Benford',
      tex: 'P(d)=\\log_{10}\\!\\left(1+\\tfrac1d\\right),\\ d=1,\\dots,9',
    },
    { label: 'Acumulada', tex: 'P(d\\le k)=\\log_{10}(k+1)' },
  ],
  props: [
    { label: 'Valores', tex: 'P(1)\\approx0{,}301,\\ P(9)\\approx0{,}046' },
    {
      label: 'Firma',
      tex: '\\text{parejo}\\Rightarrow P(d)=\\tfrac19',
      body: 'Un reparto parejo en montos reales es sospechoso.',
    },
  ],
};

export { lesson };
