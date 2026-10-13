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
import { Choices, Confirm, Knob, NumberField, parseProb } from '../shared/ui';
import { fmt, tnum } from './kit';

const P = [0.2, 0.6, 0.2];
const Q = [0.1, 0.8, 0.1];
const LABELS = ['bajo', 'medio', 'alto'];
const LOT = [1, 8, 1];
// Registros independientes, recetas fijas: razón real/máquina del mismo lote.
const ratio = (counts: number[]) => counts.reduce((v, n, i) => v * (P[i] / Q[i]) ** n, 1);

/** Datos observados y recetas; nunca muestra el resultado de una práctica. */
function DetectorDrawing({ counts, selected }: { counts: number[]; selected?: number }) {
  return (
    <g>
      <Cap x={550} y={100} size={23}>
        Real p: ámbar · Máquina q: celeste
      </Cap>
      <line x1={150} x2={950} y1={450} y2={450} stroke={C.line} strokeWidth={2} />
      {LABELS.map((label, i) => {
        const x = 280 + i * 270;
        return (
          <g key={label}>
            {selected === i && (
              <rect
                x={x - 110}
                y={160}
                width={220}
                height={370}
                rx={12}
                fill={C.amber}
                fillOpacity={0.06}
                stroke={C.amber}
              />
            )}
            {[P[i], Q[i]].map((p, j) => {
              const cx = x + (j === 0 ? -40 : 40);
              return (
                <g key={j}>
                  <rect
                    x={cx - 27}
                    y={450 - p * 300}
                    width={54}
                    height={p * 300}
                    rx={6}
                    fill={j === 0 ? C.amber : C.cyan}
                  />
                  <Cap x={cx} y={425 - p * 300} size={20}>
                    {fmt(p, 1)}
                  </Cap>
                </g>
              );
            })}
            <Cap x={x} y={490}>
              {label}
            </Cap>
            <Cap x={x} y={570} size={22}>
              {counts[i]} en el lote
            </Cap>
          </g>
        );
      })}
      <rect
        x={150}
        y={610}
        width={800}
        height={70}
        rx={12}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      {counts
        .flatMap((n, category) => Array.from({ length: n }, () => category))
        .map((category, i) => (
          <g key={i}>
            <rect
              x={175 + i * 76}
              y={622}
              width={58}
              height={46}
              rx={4}
              fill={C.panel}
              stroke={C.amber}
              strokeWidth={2}
            />
            <Cap x={204 + i * 76} y={645} size={19}>
              {['B', 'M', 'A'][category]}
            </Cap>
          </g>
        ))}
    </g>
  );
}

function DetectorLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [middle, setMiddle] = useState(5);
  const { beat } = beats;
  const rest = 10 - middle;
  const counts = beat === 1 ? [Math.floor(rest / 2), middle, Math.ceil(rest / 2)] : LOT;
  const drag = useSvgDrag(svg, (px) => {
    if (beat === 1) setMiddle(Math.round(clamp((px - 210) / 680, 0, 1) * 10));
  });
  useEffect(() => {
    if (beat === 1 && middle === 8) unlock();
  }, [beat, middle, unlock]);
  return (
    <Stage ref={svg}>
      <DetectorDrawing counts={counts} />
      <Cap x={1250} y={200}>
        10 registros
      </Cap>
      <Cap x={1250} y={290}>
        Mismo lote, dos recetas
      </Cap>
      {beat === 1 && (
        <>
          <Cap x={550} y={710}>
            Cantidad de «medio» en la cinta
          </Cap>
          <line x1={210} x2={890} y1={770} y2={770} stroke={C.line} strokeWidth={5} />
          <line x1={754} x2={754} y1={752} y2={788} stroke={C.green} strokeWidth={3} />
          <Knob x={210 + middle * 68} y={770} axis="x" onPointerDown={drag} color={C.amber} />
          <Cap x={210} y={825}>
            0
          </Cap>
          <Cap x={754} y={825} color={C.green}>
            8
          </Cap>
          <Cap x={890} y={825}>
            10
          </Cap>
        </>
      )}
      {beat >= 2 && (
        <>
          <Cap x={1250} y={380} tex="\frac{p(\mathrm{medio})}{q(\mathrm{medio})}=0{,}75" />
          <Cap x={1250} y={470} tex="\frac{p(\mathrm{bajo})}{q(\mathrm{bajo})}=2" />
          <Cap x={1250} y={560} tex="\frac{p(\mathrm{alto})}{q(\mathrm{alto})}=2" />
        </>
      )}
      {((beat === 3 && answer !== null) || beat === 4) && (
        <Cap x={1250} y={650} tex="\Lambda\approx0{,}4005<1" color={C.green} />
      )}
      {beat === 4 && (
        <Cap x={550} y={760}>
          El lote favorece a q; su origen sigue sin estar probado.
        </Cap>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Comparar el mismo lote',
  Scene: DetectorLesson,
  beats: [
    {
      say: 'Los registros reales siguen p = (0,2; 0,6; 0,2). La máquina usa q = (0,1; 0,8; 0,1): entrega más «medio» y menos extremos.',
      board: { label: 'Dos recetas', tex: 'p=(0{,}2;0{,}6;0{,}2),\\quad q=(0{,}1;0{,}8;0{,}1)' },
    },
    {
      say: 'Arma el lote que quedó retenido en el turno. Arrastra la perilla hasta tener ocho «medio»; los otros dos registros quedan repartidos entre bajo y alto.',
      gate: 'Lleva la cantidad de «medio» a 8.',
      board: { label: 'Lote retenido', tex: 'n_B=1,\\quad n_M=8,\\quad n_A=1' },
    },
    {
      say: 'La **razón de verosimilitudes** divide la probabilidad del mismo dato bajo p por su probabilidad bajo q. Cada «medio» aporta 0,75; cada extremo aporta 2.',
      board: {
        label: 'Un factor por registro',
        tex: '\\frac{p(M)}{q(M)}=\\frac{0{,}6}{0{,}8}=0{,}75,\\quad \\frac{p(B)}{q(B)}=\\frac{p(A)}{q(A)}=2',
      },
    },
    {
      say: 'Con registros independientes dentro de cada receta, multiplica los factores. Un factor repetido ocho veces se escribe con exponente 8.',
      ask: {
        prompt: '¿Cuánto vale la razón real/máquina del lote con ocho «medio» y dos extremos?',
        options: ['≈ 0,40', '10', '≈ 2,50'],
        answer: 0,
        explain:
          'Λ = 0,75⁸ · 2² ≈ 0,4005. Sumar factores da 10; invertir la razón da aproximadamente 2,50.',
      },
      board: {
        label: 'Razón del lote',
        tex: '\\Lambda=\\prod_i\\frac{p(x_i)}{q(x_i)}=0{,}75^8\\cdot2^2',
      },
    },
    {
      say: 'Λ < 1 favorece a la máquina; Λ > 1 favorece a la receta real. El valor 0,40 compara dos explicaciones: no es una probabilidad del origen del lote.',
      board: {
        label: 'Lectura del detector',
        tex: '\\Lambda\\approx0{,}4005<1',
        body: 'La máquina da al mismo lote una verosimilitud unas 2,5 veces mayor. La comparación supone estas dos recetas y registros independientes.',
      },
    },
  ],
};

function RetainedDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <DetectorDrawing counts={LOT} selected={beat === 0 ? 0 : undefined} />
      <Cap x={1250} y={200}>
        Lote retenido: 1 B, 8 M, 1 A
      </Cap>
      <Cap x={1250} y={290}>
        Numerador: real p
      </Cap>
      <Cap x={1250} y={380}>
        Denominador: máquina q
      </Cap>
      {beat === 1 && <Cap x={1250} y={470} tex="\Lambda=0{,}75^8\cdot2^2" />}
      {answer !== null &&
        (beat === 0 ? (
          <Cap x={1250} y={470} tex="p(B)/q(B)=2" color={C.green} />
        ) : (
          <>
            <Cap x={1250} y={560} tex="\Lambda\approx0{,}40<1" color={C.green} />
            <Cap x={1250} y={650} color={C.green}>
              Favorece a la máquina
            </Cap>
          </>
        ))}
    </Stage>
  );
}

function DetectorPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 229 + round);
    const middle = randInt(r, 5, 9);
    const low = randInt(r, 0, 10 - middle);
    const counts = [low, middle, 10 - middle - low];
    const category = randInt(r, 0, 2);
    const factor = P[category] / Q[category];
    const lambda = ratio(counts);
    return { counts, category, factor, lambda, source: lambda > 1 ? 'real' : 'máquina' };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setVal('');
    setChoice(null);
    api.prompt(
      [
        `Un registro es «${LABELS[d.category]}». Calcula su factor p(x)/q(x), real/máquina.`,
        `El lote tiene ${d.counts[0]} bajos, ${d.counts[1]} medios y ${d.counts[2]} altos. Calcula Λ real/máquina con tres decimales.`,
        `El lote tiene ${d.counts[0]} bajos, ${d.counts[1]} medios y ${d.counts[2]} altos. ¿Qué receta favorece la razón real/máquina?`,
      ][round],
      ['p(x)/q(x)', '\\Lambda=\\prod_i p(x_i)/q(x_i)', '\\Lambda>1:\\ p,\\quad \\Lambda<1:\\ q'][
        round
      ],
    );
    api.hints(
      [
        [
          'Busca las dos barras de la categoría indicada.',
          'Divide la barra real por la barra de la máquina.',
        ],
        [
          'Cada medio aporta 0,75; cada extremo aporta 2.',
          'Multiplica 0,75 elevado al número de medios por 2 elevado al número de extremos.',
        ],
        [
          'Calcula el producto de factores real/máquina.',
          'Compara el producto con 1; el numerador corresponde a la receta real.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      if (choice === d.source)
        return api.result(
          true,
          `$\\Lambda\\approx${tnum(d.lambda, 3)}$: el lote favorece a la receta ${d.source}. Eso no prueba su origen.`,
        );
      if (choice === 'iguales')
        return api.result(
          false,
          'Las recetas empatan solo si Λ = 1. Multiplica los factores antes de comparar.',
        );
      return api.result(
        false,
        'Revisa el sentido de la razón: real va arriba. Mayor que 1 favorece a real; menor que 1 favorece a máquina.',
      );
    }
    const v = parseProb(val);
    if (v === null || !Number.isFinite(v)) return;
    const target = round === 0 ? d.factor : d.lambda;
    const near = (n: number) => Math.abs(v - n) < 0.00051;
    if (near(target))
      return api.result(
        true,
        round === 0
          ? `$p(x)/q(x)=${tnum(P[d.category], 1)}/${tnum(Q[d.category], 1)}=${tnum(d.factor, 2)}$. Es un factor, no una probabilidad.`
          : `$\\Lambda=0{,}75^{${d.counts[1]}}\\cdot2^{${d.counts[0] + d.counts[2]}}\\approx${tnum(d.lambda, 3)}$.`,
      );
    if (near(1 / target))
      return api.result(false, 'Invertiste la razón. Divide real por máquina, en ese orden.');
    if (round === 0 && near(P[d.category]))
      return api.result(
        false,
        'Esa es la probabilidad bajo p. Falta dividir por la probabilidad bajo q.',
      );
    if (round === 1 && near(d.counts[1] * 0.75 + (10 - d.counts[1]) * 2))
      return api.result(
        false,
        'Sumaste los factores. Los registros independientes aportan un producto.',
      );
    if (round === 1 && near(0.75 * 2))
      return api.result(
        false,
        'Usaste cada factor una sola vez. Cada registro aporta: usa los conteos como exponentes.',
      );
    if (round === 1 && near(d.lambda / (1 + d.lambda)))
      return api.result(
        false,
        'Convertiste la razón en una probabilidad con pesos iniciales iguales. Aquí se pide Λ, sin esa conversión.',
      );
    if (round === 1 && near(0.75 ** d.counts[1]))
      return api.result(
        false,
        'Contaste solo los medios. Multiplica también por 2 por cada bajo y cada alto.',
      );
    return api.result(
      false,
      round === 0
        ? 'Usa las barras de la misma categoría: p(x) dividido por q(x).'
        : 'Calcula 0,75 elevado al número de medios y multiplícalo por 2 elevado al total de extremos.',
    );
  };
  return (
    <Stage>
      <DetectorDrawing counts={d.counts} selected={round === 0 ? d.category : undefined} />
      <Cap x={1250} y={200}>
        Real p / Máquina q
      </Cap>
      <Cap x={1250} y={290}>
        {round === 0 ? `Registro: ${LABELS[d.category]}` : 'Registros independientes'}
      </Cap>
      {round === 2 ? (
        <Choices
          x={1250}
          y={450}
          options={['real', 'máquina', 'iguales']}
          value={choice}
          onPick={setChoice}
        />
      ) : (
        <NumberField
          x={1080}
          y={450}
          value={val}
          onChange={setVal}
          onEnter={submit}
          label={round === 0 ? 'p/q =' : 'Λ ='}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-c6',
  world: 'generative',
  code: '12.6',
  title: 'El detector',
  subtitle: 'Comparar verosimilitudes',
  glyph: '\\Lambda',
  kind: 'level',
  guide: 'joaquin',
  teaser: 'Un lote espera en la cinta. Halcón lo marcó como real sin guardar su origen.',
  learn: 'Multiplicar razones de verosimilitudes e interpretar qué receta favorece un lote.',
  glyphs: ['gen-likelihood-ratio'],
  pitfalls: [
    'La razón usa real en el numerador y máquina en el denominador.',
    'Los factores se multiplican; los conteos se vuelven exponentes.',
    'Λ no es la probabilidad de que el lote sea real ni una prueba de su origen.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'La Fábrica, 02:40. La cinta chirría bajo diez carpetas retenidas; Joaquín mantiene la mano sobre el interruptor.',
        },
        {
          who: 'joaquin',
          text: 'Ocho medios, un bajo y un alto. El despacho los quiere antes del cambio de turno.',
        },
        { who: 'iris', text: 'El sello dice «real». ¿Quién lo puso?' },
        { who: 'joaquin', text: 'Llegó puesto. Si retengo el lote, queda anotado a mi nombre.' },
        {
          who: 'tu',
          text: 'Tenemos las dos recetas. Comparemos qué tan bien explican estas carpetas.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El lote retenido',
      Scene: RetainedDemo,
      beats: [
        {
          say: 'Joaquín aparta la carpeta baja. Puede salir de cualquiera de las dos recetas.',
          ask: {
            prompt: '¿Qué factor real/máquina aporta un registro bajo?',
            options: ['2', '0,5', '0,2'],
            answer: 0,
            explain: 'p(bajo)/q(bajo) = 0,2/0,1 = 2. Ese registro favorece a la receta real.',
          },
          note: {
            label: 'La carpeta baja',
            tex: 'p(B)/q(B)=0{,}2/0{,}1=2',
            body: 'Un extremo favorece a p, aunque el lote completo puede favorecer a q.',
          },
        },
        {
          say: 'La cinta conserva el lote completo: ocho medios, un bajo y un alto. Compara el producto con 1 antes de leer el sello.',
          ask: {
            prompt: '¿Qué receta hace más probable este lote?',
            options: ['La máquina', 'La real', 'Ambas por igual'],
            answer: 0,
            explain:
              'Λ = 0,75⁸ · 2² ≈ 0,40 < 1. Los ocho medios inclinan el producto hacia la máquina, pese a los dos extremos.',
          },
          note: {
            label: 'Lectura del lote',
            tex: '\\Lambda=0{,}75^8\\cdot2^2\\approx0{,}4005<1',
            body: 'La verosimilitud bajo q es unas 2,5 veces la de p. Hace falta más evidencia para establecer el origen.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Pasar lotes por el detector', Comp: DetectorPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín apaga la cinta. La luz del tablero sigue encendida sobre el sello «real».',
        },
        {
          who: 'joaquin',
          text: 'Lo dejo retenido. Que el turno de mañana lea el cálculo también.',
        },
        { who: 'iris', text: 'El sello promete más de lo que estas carpetas permiten decir.' },
        {
          who: 'joaquin',
          text: 'Hay montos en la última hoja. Hasta el primer dígito lo imprime la máquina.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-likelihood-ratio',
    world: 'generative',
    tex: '\\Lambda=\\prod_i\\frac{p(x_i)}{q(x_i)}',
    name: 'Razón de verosimilitudes',
    read: 'lambda, producto de pe de equis sub i sobre cu de equis sub i',
    meaning: 'Compara cuánto explican dos recetas el mismo lote de registros independientes.',
    warn: 'Mayor que 1 favorece a p; menor que 1 favorece a q. No es una probabilidad del origen.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Verosimilitud del lote',
      tex: 'L_p=\\prod_i p(x_i),\\quad L_q=\\prod_i q(x_i)',
      body: 'Producto para registros independientes bajo cada receta fija.',
    },
    {
      label: 'Razón real/máquina',
      tex: '\\Lambda=\\frac{L_p}{L_q}=\\prod_i\\frac{p(x_i)}{q(x_i)}',
      body: 'Se requiere q(x_i) > 0 para los registros observados.',
    },
  ],
  props: [
    {
      label: 'Agrupar por conteos',
      tex: '\\Lambda=\\prod_c\\left(\\frac{p(c)}{q(c)}\\right)^{n_c}',
      body: 'El factor de una categoría aparece tantas veces como registros tiene. Si solo se guardan conteos, el coeficiente multinomial común se cancela en la razón.',
    },
    {
      label: 'Interpretar la razón',
      tex: '\\Lambda>1:\\ L_p>L_q,\\quad \\Lambda<1:\\ L_p<L_q,\\quad \\Lambda=1:\\ L_p=L_q',
      body: 'Favorecer una receta no demuestra el origen del lote; la comparación depende de las recetas y del supuesto de independencia.',
    },
  ],
};

export { lesson };
