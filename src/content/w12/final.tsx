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
import { pick, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, NumberField, parseNum } from '../shared/ui';
import { chi2, fmt, mean, tnum, varMle } from './kit';

const SAMPLE = 'x=F^{-1}(u)';
const FIT = '\\hat\\mu=\\frac1n\\sum_i x_i,\\qquad\\hat\\sigma^2=\\frac1n\\sum_i(x_i-\\hat\\mu)^2';
const MIX = 'r_A=\\frac{\\pi P_A(x)}{\\pi P_A(x)+(1-\\pi)P_B(x)}';
const STATIONARY = '\\pi_S=\\frac{P(N\\to S)}{P(S\\to N)+P(N\\to S)}';
const CHI = '\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i}';
const LINES = [
  'El sorteo',
  'Media y varianza',
  'Dos máquinas',
  'Entre turnos',
  'El desvío del lote',
];
const LABELS = ['bajo', 'medio', 'alto'];

/** Solo datos de entrada: la cinta nunca imprime los resultados de la revisión. */
function LotReport({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 193 + round);
    // Centésimos enteros para que los límites acumulados no dependan de redondeos.
    const probs = pick(r, [
      [20, 50, 30],
      [30, 40, 30],
      [25, 50, 25],
    ]);
    const u = pick(r, [15, 20, 25, 30, 65, 70, 75, 90]);
    const category = u < probs[0] ? 0 : u < probs[0] + probs[1] ? 1 : 2;
    const center = pick(r, [5, 6, 7, 8]);
    const spread = pick(r, [1, 2, 3]);
    const xs = shuffle(
      r,
      [-2, -1, 0, 1, 2].map((x) => center + spread * x),
    );
    const mu = mean(xs);
    const variance = varMle(xs);
    const pi = pick(r, [0.25, 0.5, 0.75]);
    const pa = pick(r, [0.15, 0.3, 0.5]);
    const pb = pick(r, [0.15, 0.3, 0.5]);
    const mixture = pi * pa + (1 - pi) * pb;
    const responsibility = (pi * pa) / mixture;
    const sn = pick(r, [0.1, 0.2, 0.3]);
    const ns = pick(r, [0.3, 0.4, 0.5]);
    const stationary = ns / (sn + ns);
    // Modelo fijado, mismo total observado y esperado; no se ajustan parámetros.
    const expected = pick(r, [
      [50, 30, 20],
      [40, 40, 20],
      [25, 25, 50],
    ]);
    const shift = pick(r, [-10, -5, 5, 10]);
    const observed = [expected[0] + shift, expected[1] - shift, expected[2]];
    return {
      probs,
      u,
      category,
      xs,
      mu,
      variance,
      pi,
      pa,
      pb,
      mixture,
      responsibility,
      sn,
      ns,
      stationary,
      expected,
      observed,
      discrepancy: chi2(observed, expected),
    };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const [varianceValue, setVarianceValue] = useState('');
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    setValue('');
    setVarianceValue('');
    setChoice(null);
    api.prompt(
      [
        `Lectura 1. La máquina sortea u = ${fmt(d.u / 100)}. Usa los tramos de la tabla: el extremo izquierdo se incluye y el derecho se excluye. ¿Qué nivel sale?`,
        'Lectura 2. Calcula la media y la varianza del lote de cinco registros. Para este ajuste divide por n = 5. Completa ambos campos con dos decimales.',
        'Lectura 3. El registro tiene x = 2. Con la proporción de máquinas y sus probabilidades de la tabla, ¿cuánto vale la responsabilidad de A? Responde entre 0 y 1, con dos decimales.',
        'Lectura 4. Los registros pasan entre sano (S) y enfermo (N). ¿Cuál es la probabilidad estacionaria de S? Responde entre 0 y 1, con dos decimales.',
        'Lectura 5. Compara los conteos observados con los esperados de un modelo ya fijado. ¿Cuánto vale χ² para este lote? Dos decimales.',
      ][round],
      [SAMPLE, FIT, MIX, STATIONARY, CHI][round],
    );
    api.hints(
      [
        [
          'Compara u con los extremos de cada tramo.',
          'Un u igual al extremo derecho pertenece al tramo siguiente.',
        ],
        [
          'Suma los cinco valores y divide por cinco para la media.',
          'Resta la media, eleva cada diferencia al cuadrado, suma y divide por cinco.',
        ],
        [
          'A aporta π·P_A(2); B aporta (1 − π)·P_B(2).',
          'Divide el aporte de A por la suma de ambos aportes.',
        ],
        [
          'En equilibrio, el flujo S → N iguala al flujo N → S.',
          'Divide P(N → S) por la suma de las dos probabilidades de cambio.',
        ],
        [
          'Calcula (O − E)²/E en cada categoría.',
          'Suma los tres aportes; las diferencias con signo no se cancelan al cuadrarlas.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);

  const submit = () => {
    if (round === 0) {
      if (choice === null) return;
      if (choice === LABELS[d.category])
        return api.result(
          true,
          `u = ${fmt(d.u / 100)} cae en el tramo ${choice}. Esa carpeta sale de la cinta.`,
        );
      const boundary = d.u === d.probs[0] || d.u === d.probs[0] + d.probs[1];
      return api.result(
        false,
        boundary
          ? 'El sorteo cayó justo en un límite. El extremo derecho se excluye: toma el tramo que empieza ahí.'
          : 'Revisa el tramo que contiene u, usando los límites acumulados; la probabilidad de cada nivel es el ancho del tramo.',
      );
    }
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const near = (a: number, b: number) => Math.abs(a - b) < 0.0051;
    if (round === 1) {
      const variance = parseNum(varianceValue);
      if (variance === null || !Number.isFinite(variance)) return;
      if (!near(v, d.mu))
        return api.result(
          false,
          near(v, d.mu * 5)
            ? 'Anotaste la suma como media. Divídela por los cinco registros antes de calcular las distancias.'
            : 'La media no calza: suma los cinco registros y divide por cinco; después usa ese centro para la varianza.',
        );
      if (!near(variance, d.variance))
        return api.result(
          false,
          near(variance, (d.variance * 5) / 4)
            ? 'Usaste n − 1. La varianza del ajuste normal divide por n = 5.'
            : near(variance, Math.sqrt(d.variance))
              ? 'Anotaste la desviación estándar. Aquí se pide la varianza, antes de sacar la raíz.'
              : near(variance, 0)
                ? 'Las diferencias con signo se cancelan. Eleva cada una al cuadrado antes de sumar.'
                : 'Revisa los cuadrados de las distancias a la media y divide su suma por cinco.',
        );
      return api.result(
        true,
        `$\\hat\\mu=${tnum(d.mu)}$ y $\\hat\\sigma^2=${tnum(d.variance)}$. Los cuadrados suman ${fmt(d.variance * 5)} y el divisor es 5.`,
      );
    }
    const target = [0, 0, d.responsibility, d.stationary, d.discrepancy][round];
    if (near(v, target))
      return api.result(
        true,
        [
          '',
          '',
          `$r_A=\\frac{${tnum(d.pi * d.pa, 4)}}{${tnum(d.mixture, 4)}}\\approx${tnum(target)}$. El denominador incluye ambas máquinas.`,
          `$\\pi_S=\\frac{${tnum(d.ns)}}{${tnum(d.sn)}+${tnum(d.ns)}}\\approx${tnum(target)}$. Los flujos entre turnos quedan equilibrados.`,
          `$\\chi^2\\approx${tnum(target)}$. El lote conserva el total; el estadístico suma los desvíos cuadrados relativos a lo esperado.`,
        ][round],
      );
    const why =
      round === 2
        ? near(v, d.pi * d.pa)
          ? 'Ese es el aporte conjunto de A. Falta dividir por la probabilidad total del registro.'
          : near(v, d.pa / (d.pa + d.pb))
            ? 'Omitiste la proporción de máquinas. Pondera A con π y B con 1 − π antes de dividir.'
            : near(v, 1 - target)
              ? 'Calculaste la responsabilidad de B. El numerador pedido es el aporte de A.'
              : 'Multiplica π por P_A(2) y divide por la suma de los aportes de A y B.'
        : round === 3
          ? near(v, 1 - target)
            ? 'Ese es el peso estacionario de N. Para S, el numerador es la transición que llega desde N.'
            : near(v, 1 - d.sn)
              ? 'Permanecer sano un día no es la probabilidad estacionaria. También cuenta el regreso desde N.'
              : 'Usa P(N → S) arriba y la suma de las dos probabilidades de cambio abajo.'
          : near(
                v,
                d.observed.reduce(
                  (sum, o, i) => sum + Math.abs(o - d.expected[i]) / d.expected[i],
                  0,
                ),
              )
            ? 'Falta elevar al cuadrado las diferencias. χ² suma (O − E)²/E.'
            : near(
                  v,
                  d.observed.reduce((sum, o, i) => sum + (o - d.expected[i]) ** 2, 0),
                )
              ? 'Sumaste los cuadrados, pero cada uno debe dividirse por su conteo esperado.'
              : near(v, 0)
                ? 'Las diferencias con signo suman cero porque el total se conserva. Cuadra cada diferencia antes de sumar.'
                : 'Calcula (O − E)²/E fila por fila y suma; redondea solo al final.';
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
        Control de salida · La Fábrica
      </Cap>
      {LINES.map((line, i) => (
        <g key={line}>
          <circle
            cx={215 + i * 170}
            cy={245}
            r={13}
            fill={i < round ? C.green : i === round ? C.amber : C.line}
          />
          <Cap x={215 + i * 170} y={290} size={19} color={i === round ? C.amber : C.muted}>
            {i + 1}
          </Cap>
        </g>
      ))}
      <Cap x={555} y={355} size={24} color={C.amber}>
        {LINES[round]}
      </Cap>
      {(round === 0 || round === 4) && (
        <>
          {(round === 0
            ? ['Nivel', 'Desde (incluido)', 'Hasta (excluido)']
            : ['Nivel', 'Observado O', 'Esperado E']
          ).map((label, i) => (
            <Cap key={label} x={295 + i * 255} y={435} size={21} color={C.cyan}>
              {label}
            </Cap>
          ))}
          {LABELS.map((label, i) => (
            <g key={label}>
              <Cap x={295} y={515 + i * 80} size={23}>
                {label}
              </Cap>
              <Cap x={550} y={515 + i * 80} size={23}>
                {round === 0
                  ? fmt((i === 0 ? 0 : i === 1 ? d.probs[0] : d.probs[0] + d.probs[1]) / 100)
                  : d.observed[i]}
              </Cap>
              <Cap x={805} y={515 + i * 80} size={23}>
                {round === 0
                  ? fmt((i === 0 ? d.probs[0] : i === 1 ? d.probs[0] + d.probs[1] : 100) / 100)
                  : d.expected[i]}
              </Cap>
            </g>
          ))}
        </>
      )}
      {round === 1 && (
        <>
          <rect
            x={185}
            y={500}
            width={740}
            height={65}
            rx={12}
            fill={C.bg}
            stroke={C.line}
            strokeWidth={3}
          />
          {d.xs.map((x, i) => (
            <g key={i}>
              <rect
                x={210 + i * 145}
                y={430}
                width={110}
                height={120}
                rx={8}
                fill={C.bg}
                stroke={C.cyan}
                strokeWidth={2}
              />
              <Cap x={265 + i * 145} y={490} size={30}>
                {fmt(x)}
              </Cap>
            </g>
          ))}
          <Cap x={555} y={650} size={22} color={C.muted}>
            Cinco registros de entrada · divisor n
          </Cap>
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={555} y={455} size={25}>{`Proporción de A: π = ${fmt(d.pi)}`}</Cap>
          <Cap x={555} y={545} tex={`P_A(2)=${tnum(d.pa)}`} size={26} color={C.cyan} />
          <Cap x={555} y={635} tex={`P_B(2)=${tnum(d.pb)}`} size={26} color={C.green} />
        </>
      )}
      {round === 3 && (
        <>
          <Cap x={555} y={455} tex={`P(S\\to N)=${tnum(d.sn)}`} size={27} color={C.cyan} />
          <Cap x={555} y={555} tex={`P(N\\to S)=${tnum(d.ns)}`} size={27} color={C.green} />
          <Cap x={555} y={655} size={21} color={C.muted}>
            S: sano · N: enfermo
          </Cap>
        </>
      )}
      <Cap x={1250} y={260} size={23}>
        Lectura {round + 1} de 5
      </Cap>
      <Cap x={1250} y={350} size={21} color={C.muted}>
        {round === 0 ? `Sorteo u = ${fmt(d.u / 100)}` : 'Completa el control de salida'}
      </Cap>
      {round === 0 ? (
        <Choices x={1250} y={470} options={LABELS} value={choice} onPick={setChoice} />
      ) : (
        <NumberField
          x={1050}
          y={470}
          value={value}
          onChange={setValue}
          onEnter={submit}
          label={['', 'Media =', 'r_A =', 'π_S =', 'χ² ='][round]}
          width={5}
        />
      )}
      {round === 1 && (
        <NumberField
          x={1050}
          y={580}
          value={varianceValue}
          onChange={setVarianceValue}
          onEnter={submit}
          label="Varianza ="
          width={5}
        />
      )}
      <Cap x={1250} y={690} size={19} color={C.muted}>
        {round === 0 ? 'Elige el nivel de la carpeta' : 'Dos decimales · redondea al final'}
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w12-final',
  world: 'generative',
  code: '12.★',
  title: 'El lote perfecto',
  subtitle: 'Cinco lecturas de la fábrica',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w12-closed',
  guide: 'joaquin',
  teaser:
    'El último lote espera en la cinta. Joaquín tiene que firmar su salida antes del cambio de turno.',
  learn:
    'Revisar un lote con muestreo, media y varianza, responsabilidad de mezcla, probabilidad estacionaria y χ².',
  glyphs: ['gen-final-lot'],
  pitfalls: [
    'El extremo derecho de un tramo de muestreo pertenece al siguiente tramo.',
    'La varianza del ajuste normal divide por n; la desviación estándar es su raíz.',
    'La responsabilidad incluye las proporciones de ambas máquinas.',
    'La probabilidad de permanecer un día en S difiere de su peso estacionario.',
    'χ² divide cada diferencia cuadrada por su propio conteo esperado.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Barón, doce para las cuatro. Una carpeta golpeaba el tope de la cinta una y otra vez, y Joaquín tenía el lápiz apoyado sobre la guía de salida, sin firmar.',
        },
        {
          who: 'joaquin',
          text: 'El cambio de turno es en doce minutos. Este lote queda a mi nombre.',
        },
        {
          who: 'teo',
          text: 'El archivo trae hasta el sorteo de cada carpeta. Puedo copiar también el destino, aunque esa columna tiene otro permiso.',
        },
        {
          who: 'iris',
          text: '¿Por qué protegerían el destino con más cuidado que a los pacientes?',
        },
        { who: 'joaquin', text: 'Cinco lecturas. Después veo si le pongo la firma.' },
        { who: 'tu', text: 'Deja la guía al lado del archivo; tiene la misma hora de salida.' },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas del lote', Comp: LotReport, rounds: 5 },
    {
      kind: 'scene',
      place: 'fabrica',
      lines: [
        {
          who: 'nar',
          text: 'Joaquín tachó la guía con el lápiz y detuvo la cinta. En el silencio, Teo abrió el registro de despachos que había quedado bajo la última carpeta.',
        },
        { who: 'joaquin', text: 'Retenido. Que el turno de día pregunte arriba.' },
        {
          who: 'teo',
          text: 'El destino dice «La Bolsa»: seguros sanitarios y apuestas de Halcón. Cada envío llegó antes del anuncio que movió el precio.',
        },
        {
          who: 'iris',
          text: 'Inventaban pacientes, y alguien apostaba a lo que esos pacientes iban a provocar.',
        },
        {
          who: 'tu',
          text: 'Guarda los despachos junto con las apuestas. Las horas también cuentan.',
        },
        {
          who: 'joaquin',
          text: 'Yo sacaba lotes por esta puerta, y del otro lado cobraban por adelantado.',
        },
        {
          who: 'nar',
          text: 'Teo abrió la carpeta de La Bolsa. La primera operación de Halcón tenía la hora de un despacho de La Fábrica, y el anuncio público aparecía dos horas después.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'gen-final-lot',
    world: 'generative',
    tex: CHI,
    name: 'Control de salida del lote',
    read: 'ji cuadrado igual a la suma de observado menos esperado al cuadrado, dividido por esperado',
    meaning:
      'Resume el desvío de los conteos de un lote respecto de un modelo fijado, con esperados positivos.',
    warn: 'Un ajuste casi perfecto puede ser sospechoso; χ² por sí solo no prueba el origen del lote.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Muestreo por acumulada',
      tex: SAMPLE,
      body: 'u es uniforme en [0, 1); cada tramo incluye el extremo izquierdo y excluye el derecho.',
    },
    {
      label: 'Ajuste normal',
      tex: FIT,
      body: 'La media y la varianza se calculan con los n registros; la varianza divide por n.',
    },
    {
      label: 'Responsabilidad de A',
      tex: MIX,
      body: 'π es la proporción de A; el denominador suma los aportes de ambas máquinas.',
    },
  ],
  props: [
    {
      label: 'Equilibrio entre dos estados',
      tex: STATIONARY,
      body: 'Para una cadena de dos estados con ambas probabilidades de cambio positivas.',
    },
    {
      label: 'Desvío de conteos',
      tex: CHI,
      body: 'Observados y esperados tienen el mismo total; cada esperado debe ser positivo.',
    },
    {
      label: 'Lote demasiado perfecto',
      tex: '\\chi^2<2{,}73',
      body: 'Con 8 grados de libertad, 2,73 es el corte inferior del 5 %. Es una señal para revisar; no demuestra fabricación.',
    },
  ],
};

// El final conserva tres pasos: escena, cinco lecturas y escena de cierre.
const lesson: LessonStep | undefined = undefined;
export { lesson };
