import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  Glyph,
  LessonStep,
  LevelSpec,
  TopicRef,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { fmt, kl2, normalize, tnum } from './kit';

// Caso 11.★: cinco lecturas del modelo, sin clase ni investigación adicional.
const LINES = [
  'Puntos de grilla',
  'Conteo Monte Carlo',
  'Muestras con pesos',
  'La cota ELBO',
  'Una sola joroba',
];
const GRID = 'N=k^d';
const MC = '\\widehat\\pi=4\\,\\frac{m}{n}';
const IMPORTANCE = '\\widehat E_p[f]=\\frac{\\sum_i w_i f(x_i)}{\\sum_i w_i}';
const IDENTITY = '\\log_2 p(D)=\\operatorname{ELBO}(q)+KL(q\\Vert p(\\cdot\\mid D))';
const KL = 'KL(q\\Vert p)=\\sum_i q_i\\log_2\\frac{q_i}{p_i}';

function RecipeReport({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed);
    const k = pick(r, [4, 5, 8, 10]);
    const dimensions = pick(r, [3, 4, 5, 6]);
    const [inside, total] = pick(r, [
      [77, 100],
      [79, 100],
      [158, 200],
      [392, 500],
    ] as [number, number][]);
    // Tres muestras prestadas: se muestran los pesos sin normalizar.
    const weights = pick(r, [
      [3, 2, 1],
      [1, 2, 3],
      [2, 3, 1],
      [4, 1, 2],
    ]);
    const values = pick(r, [
      [0, 1, 2],
      [1, 2, 4],
      [0, 2, 3],
    ]);
    const weighted = normalize(weights).reduce((sum, w, i) => sum + w * values[i], 0);
    const numerator = weights.reduce((sum, w, i) => sum + w * values[i], 0);
    const logEvidence = pick(r, [-1, -2, -3, -4]);
    const gap = pick(r, [0.25, 0.5, 0.75, 1.25]);
    const valley = pick(r, [0.08, 0.1, 0.12, 0.16]);
    const p = [(1 - valley) / 2, valley, (1 - valley) / 2];
    const middle = pick(r, [0.16, 0.2, 0.24]);
    // La receta guardada conserva la joroba enferma y omite la sana.
    const q = [0, middle, 1 - middle];
    return {
      k,
      dimensions,
      inside,
      total,
      weights,
      values,
      weighted,
      numerator,
      logEvidence,
      gap,
      p,
      q,
      targets: [k ** dimensions, (4 * inside) / total, weighted, logEvidence - gap, kl2(q, p)],
    };
  }, [seed]);
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    const prompts = [
      `Lectura 1. La receta usa ${d.dimensions} parámetros, con ${d.k} valores por parámetro. ¿Cuántos puntos tiene la grilla? Escribe el entero.`,
      `Lectura 2. El simulador tiró ${d.total} puntos uniformes en el cuadrado unitario; ${d.inside} cayeron en el cuarto de círculo. ¿Qué estimación de π obtienes? Dos decimales.`,
      'Lectura 3. La tabla trae tres muestras y sus pesos de importancia sin normalizar. ¿Cuál es el promedio con pesos de f? Dos decimales.',
      `Lectura 4. log₂ p(D) = ${fmt(d.logEvidence)} y KL(q ‖ posterior) = ${fmt(d.gap)} bits. ¿Cuánto vale la ELBO? Dos decimales.`,
      'Lectura 5. La receta q conserva la joroba enferma. Calcula KL(q ‖ p) con la tabla, en bits y con dos decimales; q = 0 aporta cero.',
    ];
    api.prompt(prompts[round], [GRID, MC, IMPORTANCE, IDENTITY, KL][round]);
    api.hints(
      [
        [
          'Cada parámetro agrega k opciones a cada combinación anterior.',
          'Multiplica k por sí mismo d veces.',
        ],
        [
          'La fracción dentro estima π/4.',
          'Divide el conteo interior por el total y multiplica por 4.',
        ],
        [
          'Multiplica cada f por su peso y suma los productos.',
          'Divide por la suma de los pesos, no por el número de muestras.',
        ],
        [
          'El logaritmo de la evidencia es ELBO + KL.',
          'Resta la KL al logaritmo de la evidencia; la cota queda más abajo.',
        ],
        [
          'Solo aportan las filas con q positiva.',
          'En cada fila multiplica q por log₂(q/p) y suma ambos aportes.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const target = d.targets[round];
    const near = (n: number) => Math.abs(v - n) < 0.006;
    if (round === 0 ? v === target : near(target)) {
      return api.result(
        true,
        [
          `$${d.k}^{${d.dimensions}}=${target}$ puntos. Cada parámetro multiplica las combinaciones.`,
          `$4\\cdot\\tfrac{${d.inside}}{${d.total}}=${tnum(target)}$. El conteo estima un cuarto del círculo.`,
          `$\\tfrac{${d.numerator}}{${d.weights.reduce((a, b) => a + b, 0)}}\\approx${tnum(target)}$. Los pesos se normalizan por su suma.`,
          `$\\operatorname{ELBO}=${tnum(d.logEvidence)}-${tnum(d.gap)}=${tnum(target)}$ bits. La KL es la separación hasta el techo.`,
          `$KL(q\\Vert p)\\approx${tnum(target)}$ bits. La KL finita permite que esta q omita a los sanos.`,
        ][round],
      );
    }
    const why = [
      v === d.k * d.dimensions
        ? 'Sumaste las opciones de los parámetros. Las combinaciones se multiplican: k elevado a d.'
        : v === d.dimensions ** d.k
          ? 'Intercambiaste base y exponente: la base es valores por parámetro; el exponente es la cantidad de parámetros.'
          : 'Cuenta combinaciones completas: cada parámetro multiplica por k la cantidad anterior. Escribe el entero sin separadores.',
      near(d.inside / d.total)
        ? 'Esa fracción estima π/4. Falta multiplicar por 4.'
        : near((4 * (d.total - d.inside)) / d.total)
          ? 'Contaste los puntos de afuera. La estimación usa los que quedaron dentro del cuarto de círculo.'
          : 'Usa cuatro veces el conteo interior dividido por el total; conserva la precisión hasta el final.',
      near(d.numerator / 3)
        ? 'Dividiste por tres muestras. Con pesos sin normalizar, el denominador es la suma de los pesos.'
        : near(d.values.reduce((a, b) => a + b, 0) / 3)
          ? 'Ese es el promedio sin pesos. Cada muestra debe aportar w·f antes de dividir por la suma de w.'
          : near(d.numerator)
            ? 'Sumaste los productos, pero falta dividir por la suma de los pesos.'
            : 'Suma los productos w·f y divide por la suma de w. Redondea al final.',
      near(d.logEvidence + d.gap)
        ? 'Sumaste la KL. La identidad exige restarla para despejar ELBO; la cota no puede superar el techo.'
        : near(d.logEvidence)
          ? 'Ese es el techo. La KL positiva deja a la ELBO por debajo.'
          : 'Despeja ELBO = log₂ p(D) − KL y conserva el signo del logaritmo de la evidencia.',
      near(-target)
        ? 'Invertiste la razón dentro del logaritmo. Usa q/p y pondera con q; la KL total no es negativa.'
        : near(target * Math.LN2)
          ? 'Usaste logaritmos naturales. Para responder en bits, usa logaritmos en base 2.'
          : near(d.q.reduce((sum, q, i) => sum + (q === 0 ? 0 : Math.log2(q / d.p[i])), 0))
            ? 'Faltan los pesos q: cada log₂(q/p) se multiplica por su q.'
            : 'Calcula q·log₂(q/p) en dudoso y enfermo. Sano aporta cero porque q(sano) = 0; la dirección inversa sería infinita.',
    ][round];
    return api.result(false, why);
  };
  return (
    <Stage>
      <rect
        x={160}
        y={135}
        width={790}
        height={610}
        rx={18}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={555} y={180} size={25}>
        La receta del lector
      </Cap>
      {LINES.map((line, i) => (
        <g key={line}>
          <circle
            cx={210 + i * 170}
            cy={245}
            r={13}
            fill={i < round ? C.green : i === round ? C.amber : C.line}
          />
          <Cap x={210 + i * 170} y={290} size={19} color={i === round ? C.amber : C.muted}>
            {i + 1}
          </Cap>
        </g>
      ))}
      <Cap x={555} y={355} size={23} color={C.amber}>
        {LINES[round]}
      </Cap>
      {round === 0 && (
        <>
          <Cap x={555} y={450} size={26}>{`${d.dimensions} parámetros`}</Cap>
          <Cap x={555} y={545} size={26}>{`${d.k} valores por parámetro`}</Cap>
          <Cap x={555} y={650} size={20} color={C.muted}>
            Una opción de cada parámetro por punto.
          </Cap>
        </>
      )}
      {round === 1 && (
        <>
          <Cap x={555} y={450} size={26}>{`${d.inside} puntos dentro`}</Cap>
          <Cap x={555} y={545} size={26}>{`${d.total} puntos en total`}</Cap>
          <Cap x={555} y={650} size={20} color={C.muted}>
            Muestreo uniforme · cuarto de círculo.
          </Cap>
        </>
      )}
      {(round === 2 || round === 4) && (
        <>
          {(round === 2 ? ['Muestra', 'f(x)', 'w'] : ['Estado', 'p', 'q']).map((label, i) => (
            <Cap key={label} x={300 + i * 245} y={440} size={23} color={C.cyan}>
              {label}
            </Cap>
          ))}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <Cap x={300} y={515 + i * 80} size={23}>
                {round === 2 ? i + 1 : ['sano', 'dudoso', 'enfermo'][i]}
              </Cap>
              <Cap x={545} y={515 + i * 80} size={23}>
                {fmt(round === 2 ? d.values[i] : d.p[i])}
              </Cap>
              <Cap x={790} y={515 + i * 80} size={23}>
                {fmt(round === 2 ? d.weights[i] : d.q[i])}
              </Cap>
            </g>
          ))}
        </>
      )}
      {round === 3 && (
        <>
          <Cap
            x={555}
            y={450}
            tex={`\\log_2 p(D)=${tnum(d.logEvidence)}`}
            color={C.cyan}
            size={28}
          />
          <Cap x={555} y={545} tex={`KL=${tnum(d.gap)}\\ \\text{bits}`} color={C.green} size={28} />
          <Cap x={555} y={650} size={20} color={C.muted}>
            Mismo modelo y datos · cota por completar.
          </Cap>
        </>
      )}
      <Cap x={1250} y={260} size={22}>
        Datos de entrada
      </Cap>
      <Cap x={1250} y={350} size={20}>
        {round === 0 ? 'Respuesta entera' : 'Respuesta con dos decimales'}
      </Cap>
      <NumberField
        x={1050}
        y={470}
        value={value}
        onChange={setValue}
        onEnter={submit}
        label={['N =', 'π ≈', 'Media =', 'ELBO =', 'KL ='][round]}
        unit={round >= 3 ? 'bits' : undefined}
        width={round === 0 ? 7 : 5}
      />
      <Cap x={1250} y={610} size={19} color={C.muted}>{`Lectura ${round + 1} de 5`}</Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w11-final',
  world: 'variational',
  code: '11.★',
  title: 'La receta',
  subtitle: 'Cinco lecturas del modelo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w11-closed',
  guide: 'simon',
  teaser:
    'La receta del lector está abierta. Cinco lecturas antes de que el servidor cierre la sesión.',
  learn:
    'Revisar una aproximación con grillas, Monte Carlo, pesos de importancia, la identidad ELBO y KL en bits.',
  glyphs: ['vi-final-recipe'],
  pitfalls: [
    'Las opciones por parámetro se multiplican para contar puntos de grilla.',
    'Los pesos sin normalizar se dividen por su suma.',
    'ELBO = log₂ p(D) − KL; la cota queda debajo del logaritmo de la evidencia.',
    'KL(q ‖ p) puede ser finita aunque q deje fuera una joroba de p.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'Laboratorio de Los Placeres, 00:27. Simón sostiene el cable del servidor entre dos dedos; en la pantalla parpadea el aviso de cierre de sesión.',
        },
        {
          who: 'teo',
          text: '¡La receta completa! Tiene los controles al lado, puedo copiar todo mientras siga abierta.',
        },
        {
          who: 'simon',
          text: 'Cinco lecturas, rápido, antes de que saquen la bandeja; de que corten la sesión, digo. Mi nombre quedó pegado al horno.',
        },
        { who: 'iris', text: '¿Y quién eligió qué se horneaba?' },
        { who: 'simon', text: 'La firma viene al final. Halcón sirve todo con la firma de otro.' },
        {
          who: 'tu',
          text: 'Copio los controles junto con la receta. Así queda cómo la revisamos.',
        },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas de la receta', Comp: RecipeReport, rounds: 5 },
    {
      kind: 'scene',
      place: 'laboratorio',
      lines: [
        {
          who: 'nar',
          text: 'La copia termina y el ventilador baja de golpe. Simón suelta el cable; Teo deja el cursor sobre una carpeta que seguía detrás del informe.',
        },
        { who: 'iris', text: 'Los sanos estaban en el control. En la receta quedaron fuera.' },
        {
          who: 'teo',
          text: 'Espera, hay otra carpeta: «La Fábrica». Registros sintéticos, y al lado dice «indistinguibles de los reales».',
        },
        {
          who: 'simon',
          text: 'Otra cocina, claro, ahora fabrican los ingredientes. Yo revisaba el horno; esa puerta me la dejaron cerrada.',
        },
        { who: 'tu', text: 'Ese sello también queda en la copia.' },
        {
          who: 'nar',
          text: 'Teo abre la carpeta de La Fábrica: filas de pacientes con fechas, exámenes y nombres. En la columna de origen, todas dicen «generado».',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'vi-final-recipe',
    world: 'variational',
    tex: IDENTITY,
    name: 'Revisión de la receta',
    read: 'logaritmo en base dos de la evidencia igual a elbo más ka ele al posterior',
    meaning:
      'La identidad conecta la cota calculable con la distancia de la aproximación al posterior.',
    warn: 'Una KL finita no garantiza conservar todas las jorobas del posterior.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'Grilla', tex: GRID, body: 'd parámetros con k valores cada uno.' },
    {
      label: 'Monte Carlo',
      tex: '\\widehat E[f]=\\frac1n\\sum_{i=1}^n f(x_i)',
      body: 'Muestras de la distribución cuyo promedio quieres estimar.',
    },
    {
      label: 'Pesos de importancia',
      tex: 'w_i=\\frac{p(x_i)}{q(x_i)}',
      body: 'Aquí q es la propuesta de muestreo; debe cubrir los valores donde p es positiva.',
    },
    {
      label: 'KL en bits',
      tex: KL,
      body: 'El promedio usa q. Los términos con q = 0 aportan cero.',
    },
  ],
  props: [
    {
      label: 'Cuarto de círculo',
      tex: MC,
      body: 'm puntos interiores de n tiradas uniformes en el cuadrado unitario.',
    },
    {
      label: 'Promedio con pesos',
      tex: IMPORTANCE,
      body: 'Normaliza por la suma de los pesos; en general es una estimación.',
    },
    {
      label: 'Identidad ELBO',
      tex: IDENTITY,
      body: 'Mismo modelo y datos; logaritmos en base 2 y términos finitos.',
    },
    { label: 'Cota inferior', tex: '\\operatorname{ELBO}(q)\\le\\log_2 p(D)' },
  ],
};

// El índice admite esta exportación opcional; el final conserva solo sus tres pasos.
const lesson: LessonStep | undefined = undefined;
export { lesson };
