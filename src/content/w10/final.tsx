import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type { ChallengeProps, Glyph, LevelSpec, TopicRef } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { fmt, ppv, tnum } from './kit';

// ============================================================================
// CASO 10.★ · «El informe sanitario» — repaso del mundo
// Cinco cifras para la fiscalía: VPP real, dos positivos, media posterior de un lote,
// factor de Bayes del lector y positivos esperados frente a los reportados.
// ============================================================================

const LINES = [
  'VPP con la prevalencia real',
  'Dos positivos seguidos',
  'Tasa del lote',
  'El lector',
  'Positivos esperados',
];

function SanitaryReport({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed);
    const prev = pick(r, [0.01, 0.02, 0.05]);
    const one = ppv(prev, 0.9, 0.95);
    const two = ppv(one, 0.9, 0.95);
    const [k, n] = pick(r, [
      [6, 20],
      [8, 20],
      [12, 40],
    ] as [number, number][]);
    const mean = (2 + k) / (10 + n);
    const [kk, nn] = pick(r, [
      [3, 4],
      [4, 5],
      [5, 6],
    ] as [number, number][]);
    const bf = (0.8 ** kk * 0.2 ** (nn - kk)) / 0.5 ** nn;
    const N = pick(r, [2000, 3000, 4000]);
    const expected = N * (0.02 * 0.9 + 0.98 * 0.05);
    return { prev, one, two, k, n, mean, kk, nn, bf, N, expected };
  }, [seed]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const P = [
      [
        `Lectura 1. Prevalencia ${fmt(d.prev * 100, 0)} %, sensibilidad 90 %, especificidad 95 %. ¿P(E | +)? Dos decimales.`,
        '\\text{VPP}=\\frac{s\\pi}{s\\pi+(1-e)(1-\\pi)}',
        [
          'Cuenta positivos verdaderos y falsos en 1000 personas.',
          'Divide los verdaderos por todos los positivos.',
        ],
      ],
      [
        'Lectura 2. La misma persona da positivo otra vez, en un test independiente. ¿P(E | dos positivos)? Dos decimales.',
        'P_{n+1}=\\frac{s P_n}{s P_n+(1-e)(1-P_n)}',
        [
          'Usa el resultado de la lectura 1 como punto de partida.',
          'Aplica Bayes de nuevo con el mismo test.',
        ],
      ],
      [
        `Lectura 3. Prior Beta(2, 8). Un lote da ${d.k} positivos en ${d.n} controles. ¿Media del posterior? Dos decimales.`,
        'E[\\theta]=\\frac{a+k}{a+b+n}',
        [
          'El posterior es Beta(2 + k, 8 + n − k).',
          'La media es el primer parámetro sobre la suma.',
        ],
      ],
      [
        `Lectura 4. El lector marcó ${d.kk} positivos en ${d.nn} controles ambiguos. Honesto: 0,5; alterado: 0,8. ¿Factor de Bayes del alterado? Dos decimales.`,
        'BF=\\frac{0{,}8^k\\,0{,}2^{n-k}}{0{,}5^n}',
        [
          'Alterado: 0,8 por cada positivo y 0,2 por cada negativo.',
          'Divide por 0,5 elevado al total.',
        ],
      ],
      [
        `Lectura 5. Con prevalencia 2 % y el test honesto, ¿cuántos positivos se esperan en ${d.N} tests? Redondea al entero.`,
        'n\\cdot P(+)',
        ['P(+) = 0,9·0,02 + 0,05·0,98.', 'Multiplica por la cantidad de tests.'],
      ],
    ] as [string, string, string[]][];
    const [t, tex, hints] = P[round];
    api.prompt(t, tex);
    api.hints(hints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const target = [d.one, d.two, d.mean, d.bf, d.expected][round];
    const ok = round === 4 ? Math.abs(v - target) <= 1 : Math.abs(v - target) < 0.011;
    if (ok)
      return api.result(
        true,
        [
          `$P(E\\mid+)\\approx${tnum(d.one)}$.`,
          `$P(E\\mid++)\\approx${tnum(d.two)}$.`,
          `$\\tfrac{${2 + d.k}}{${10 + d.n}}\\approx${tnum(d.mean)}$.`,
          `$BF\\approx${tnum(d.bf)}$.`,
          `$${d.N}\\cdot0{,}067\\approx${Math.round(d.expected)}$ positivos.`,
        ][round],
      );
    const why = [
      Math.abs(v - 0.9) < 0.011
        ? 'Esa es la sensibilidad, no P(E | +).'
        : 'Positivos verdaderos sobre todos los positivos.',
      Math.abs(v - d.one) < 0.011
        ? 'Ese es el resultado después del primer test. Falta el segundo.'
        : 'Parte de la lectura 1 y aplica el test otra vez.',
      Math.abs(v - d.k / d.n) < 0.011
        ? 'Esa es la proporción cruda. El prior también cuenta.'
        : `Posterior Beta(${2 + d.k}, ${8 + d.n - d.k}).`,
      Math.abs(v - 1 / d.bf) < 0.011
        ? 'Lo calculaste al revés: el alterado va arriba.'
        : 'Divide la probabilidad de los datos con el alterado por la del honesto.',
      Math.abs(v - d.N * 0.02) <= 1
        ? 'Ese es el número de enfermos. Los positivos incluyen falsos.'
        : 'P(+) = 0,067; multiplícalo por los tests.',
    ][round];
    return api.result(false, why);
  };
  return (
    <Stage>
      <rect
        x={180}
        y={170}
        width={700}
        height={520}
        rx={16}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={2}
      />
      <Cap x={530} y={215} size={24} color={C.text}>
        Informe para la fiscalía
      </Cap>
      {LINES.map((l, i) => (
        <g key={l}>
          <circle
            cx={240}
            cy={300 + i * 80}
            r={14}
            fill={i < round ? C.green : i === round ? C.amber : C.line}
          />
          <Cap
            x={270}
            y={300 + i * 80}
            size={21}
            anchor="left"
            color={i === round ? C.amber : i < round ? C.text : C.muted}
          >
            {`${i + 1}. ${l}`}
          </Cap>
        </g>
      ))}
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['VPP =', 'P =', 'E[θ] =', 'BF =', 'positivos ='][round]}
      />
      <Cap x={1270} y={700} size={17} color={C.muted}>
        {`Lectura ${round + 1} de 5`}
      </Cap>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w10-final',
  world: 'bayesian',
  code: '10.★',
  title: 'El informe sanitario',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w10-closed',
  guide: 'rocio',
  teaser:
    'La fiscalía recibe mañana el informe de la Clínica, con cinco cifras y el respaldo de cada una.',
  learn:
    'Usar juntas las herramientas del mundo: Bayes con conteos, actualización secuencial, posterior Beta, factor de Bayes y predicción.',
  glyphs: ['by-posterior', 'by-update', 'by-beta', 'by-bf', 'by-predictive'],
  steps: [
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Clínica del Cerro, diez de la noche. El laboratorio estaba a oscuras, salvo la lámpara de Rocío y la luz azul del refrigerador.',
        },
        {
          who: 'rocio',
          text: 'Mañana lo leen en la fiscalía. Si una cifra cojea, culpan al laboratorio entero.',
        },
        { who: 'iris', text: 'Entonces revisémoslas una por una, cada una con su cálculo.' },
        { who: 'teo', text: 'Tengo abiertas las planillas, los lotes y la memoria del lector.' },
      ],
    },
    { kind: 'challenge', title: 'Cinco lecturas del informe', Comp: SanitaryReport, rounds: 5 },
    {
      kind: 'scene',
      place: 'clinica',
      lines: [
        {
          who: 'nar',
          text: 'Rocío firmó la última página. El lector, desenchufado, seguía con su luz de calibración encendida.',
        },
        {
          who: 'teo',
          text: 'La memoria del lector trae algo más: un modelo que el Laboratorio usa para decidir cuántos positivos marcar.',
        },
        {
          who: 'rocio',
          text: 'Dicen que es imposible de calcular exacto, y que por eso lo aproximan.',
        },
        {
          who: 'iris',
          text: 'Esa aproximación mandó tres camiones de dosis. Me gustaría saber quién la firmó en el Laboratorio.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];

export const ref: TopicRef = {
  defs: [
    { label: 'Bayes', tex: 'P(H\\mid D)=\\frac{P(D\\mid H)P(H)}{P(D)}' },
    { label: 'Posterior Beta', tex: '\\text{Beta}(a+k,\\,b+n-k)' },
  ],
  props: [
    {
      label: 'Actualización',
      tex: '\\text{chances}_{\\text{después}}=\\text{chances}_{\\text{antes}}\\cdot LR',
    },
    { label: 'Predicción', tex: 'E[\\#+]=n\\,P(+)' },
  ],
};
