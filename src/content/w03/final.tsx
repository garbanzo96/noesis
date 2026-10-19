import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot } from '../../engine/shapes';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum } from '../shared/ui';
import { AreaUnder } from './kit';

// ============================================================================
// CASO 3.★ · «La compuerta» — repaso del mundo
// Cinco momentos en la sala de control: trapecios con lecturas, cambio neto con signo,
// volumen exacto con una primitiva, fuga en un tramo (sustitución) y pérdida total (impropia).
// ============================================================================

function Gate({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const reads = Array.from({ length: 5 }, () => randInt(r, 2, 9));
    const up = pick(r, [6, 8, 10]);
    const down = pick(r, [3, 4, 5]);
    const a = randInt(r, 1, 3);
    const b = pick(r, [1, 2]);
    const T = pick(r, [2, 3, 4]);
    const A = pick(r, [4, 6, 8]);
    const k = pick(r, [0.5, 1]);
    return { reads, up, down, a, b, T, A, k };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');

  useEffect(() => {
    const P: [string, string, string[]][] = [
      [
        '22:00, sala de control. El caudalímetro intervenido guarda cinco lecturas, una por hora. Estima el volumen con la regla del trapecio.',
        'T_4=\\frac{L_4+R_4}{2}',
        [
          '$L_4$: las cuatro primeras lecturas. $R_4$: las cuatro últimas.',
          'Con $\\Delta x=1$, promedia las dos sumas.',
        ],
      ],
      [
        `23:00. Balance del lago: entraron ${d.up} mil m³ (área verde) y salieron ${d.down + d.up + 2} mil m³ (área roja). ¿Cambio neto del volumen?`,
        '\\int r\\,dt=A_{\\text{arriba}}-A_{\\text{abajo}}',
        ['La salida cuenta negativa.', 'Resta.'],
      ],
      [
        `00:00. La tubería 7 sigue $Q(t)=${d.a === 1 ? '' : d.a}t^2+${d.b}$ miles de m³/h. ¿Cuánto sale entre $t=0$ y $t=3$?`,
        'F(b)-F(a)',
        ['Primitiva: $\\tfrac{a}{3}t^3+bt$.', 'Evalúa en 3 y resta el valor en 0.'],
      ],
      [
        `01:00. La válvula vieja pierde $${d.A}e^{-${dec(d.k, 1).replace(',', '{,}')}t}$ miles de m³/h. ¿Cuánto en las primeras ${d.T} horas? (Dos decimales.)`,
        '\\int_0^T A e^{-kt}dt=\\frac{A}{k}(1-e^{-kT})',
        ['Sustitución $u=-kt$.', 'Resultado: $\\tfrac{A}{k}(1-e^{-kT})$.'],
      ],
      [
        '02:00. Y si nadie la cierra nunca, ¿cuál es la pérdida total?',
        '\\int_0^\\infty A\\,e^{-kt}dt',
        ['Integral impropia: hasta $b$ y luego $b\\to\\infty$.', '$\\tfrac{A}{k}$.'],
      ],
    ];
    const [p, tex, hs] = P[round];
    api.prompt(p, tex);
    api.hints(hs);
    setVal('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const L = d.reads.slice(0, 4).reduce((x, y) => x + y, 0);
    const R = d.reads.slice(1).reduce((x, y) => x + y, 0);
    const answers = [
      (L + R) / 2,
      d.up - (d.down + d.up + 2),
      9 * d.a + 3 * d.b,
      (d.A / d.k) * (1 - Math.exp(-d.k * d.T)),
      d.A / d.k,
    ];
    const t = answers[round];
    if (Math.abs(v - t) < 0.011) {
      const msg = [
        `$T_4=\\tfrac{${L}+${R}}{2}=${dec(t, 2).replace(',', '{,}')}$ mil m³.`,
        `$${d.up}-${d.down + d.up + 2}=${t}$: el lago perdió agua.`,
        `$\\big[\\tfrac{${d.a}}{3}t^3+${d.b}t\\big]_0^3=${t}$ mil m³.`,
        `$\\tfrac{${d.A}}{${dec(d.k, 1).replace(',', '{,}')}}(1-e^{-${dec(d.k * d.T, 1).replace(',', '{,}')}})\\approx${dec(t, 2).replace(',', '{,}')}$ mil m³.`,
        `$\\tfrac{${d.A}}{${dec(d.k, 1).replace(',', '{,}')}}=${dec(t, 2).replace(',', '{,}')}$ mil m³. Teo cierra la válvula a distancia.`,
      ];
      return api.result(true, msg[round]);
    }
    const why = [
      `$L_4=${L}$ y $R_4=${R}$: promédialos.`,
      'Lo que sale resta: verde menos rojo.',
      'Integra (no evalúes $Q$): $\\tfrac{a}{3}t^3+bt$ entre 0 y 3.',
      'Falta el factor $\\tfrac1k$ o el término $e^{-kT}$: revisa la primitiva.',
      'Con $T\\to\\infty$, $e^{-kT}\\to0$.',
    ];
    return api.result(false, why[round]);
  };

  const P0 = plane([0, 4.4], [0, 10], { x: 300, y: 130, w: 820, h: 460 });
  return (
    <Stage>
      {round === 0 &&
        d.reads.map((v, k) => (
          <g key={k}>
            <Dot x={P0.x(k)} y={P0.y(v)} r={8} color={C.text} />
            <Html x={P0.x(k)} y={P0.y(v) - 24} size={18} color={C.text}>
              <span className="prop-tag">{v}</span>
            </Html>
          </g>
        ))}
      {round === 0 && (
        <Axes
          P={P0}
          xTicks={[0, 1, 2, 3, 4]}
          yTicks={[2, 4, 6, 8, 10]}
          xLabel="\text{h}"
          yLabel="Q"
          grid
        />
      )}
      {round === 1 && (
        <>
          <rect
            x={360}
            y={300 - d.up * 18}
            width={360}
            height={d.up * 18}
            fill={C.green}
            opacity={0.4}
          />
          <rect
            x={720}
            y={300}
            width={420}
            height={(d.down + d.up + 2) * 18}
            fill={C.red}
            opacity={0.4}
          />
          <line x1={320} x2={1180} y1={300} y2={300} stroke={C.dim} strokeWidth={3} />
          <Cap x={540} y={260} size={26} color={C.text}>
            +{d.up}
          </Cap>
          <Cap x={930} y={340} size={26} color={C.text}>
            −{d.down + d.up + 2}
          </Cap>
        </>
      )}
      {round === 2 &&
        (() => {
          const P2 = plane([0, 3.4], [0, 9 * d.a + d.b + 2], { x: 300, y: 130, w: 820, h: 460 });
          return (
            <>
              <Axes P={P2} xTicks={[0, 1, 2, 3]} yTicks={[]} xLabel="t" yLabel="Q" grid />
              <AreaUnder
                P={P2}
                f={(t) => d.a * t * t + d.b}
                a={0}
                b={3}
                pos="#5fd3ff"
                opacity={0.35}
              />
              <Curve P={P2} f={(t) => d.a * t * t + d.b} a={0} b={3.4} color={C.cyan} width={4} />
            </>
          );
        })()}
      {round >= 3 &&
        (() => {
          const P3 = plane([0, 10], [0, d.A + 1], { x: 300, y: 130, w: 820, h: 460 });
          return (
            <>
              <Axes P={P3} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[]} xLabel="t" yLabel="q" grid />
              <AreaUnder
                P={P3}
                f={(t) => d.A * Math.exp(-d.k * t)}
                a={0}
                b={round === 3 ? d.T : 10}
                pos={C.violet}
                opacity={0.4}
              />
              <Curve
                P={P3}
                f={(t) => d.A * Math.exp(-d.k * t)}
                a={0}
                b={10}
                color={C.cyan}
                width={4}
              />
            </>
          );
        })()}
      <Html x={1300} y={680} size={16} color={C.muted}>
        <span>{['22:00', '23:00', '00:00', '01:00', '02:00'][round]}</span>
      </Html>
      <NumberField
        x={1200}
        y={300}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label="="
        width={5}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w3-final',
  world: 'integral',
  code: '3.★',
  title: 'La compuerta',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w3-closed',
  guide: 'iris',
  teaser:
    'Noche en la sala de control de la represa. Hay que guardar la cuenta del agua desviada antes de cerrar la válvula.',
  learn:
    'Usar juntas las herramientas del mundo: sumas de Riemann y trapecios, área con signo, primitivas, sustitución e integrales impropias.',
  glyphs: ['riemann', 'netchange', 'ftc2', 'subst', 'improper'],
  steps: [
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'nar',
          text: 'Sala de control de Peñuelas, diez de la noche. Una lámpara zumbaba sobre el escritorio, y nadie se había ido a casa.',
        },
        {
          who: 'marta',
          text: 'El caudalímetro intervenido dejó cinco lecturas, una por hora. Quiero la cuenta guardada antes de tocar la válvula.',
        },
        {
          who: 'teo',
          text: 'Puedo cerrarla a distancia cuando terminemos. El servidor externo todavía tiene acceso.',
        },
        { who: 'iris', text: 'Entonces alguien puede intentar abrirla otra vez.' },
        {
          who: 'marta',
          text: 'Y esa orden va a quedar registrada junto a los volúmenes. Esta noche van a tener que explicar las dos cosas.',
        },
      ],
    },
    { kind: 'challenge', title: 'La compuerta', Comp: Gate, rounds: 5 },
    {
      kind: 'scene',
      place: 'represa',
      lines: [
        {
          who: 'teo',
          text: 'Válvula cerrada a las 02:00, después de contar la pérdida total. Diez minutos después, el servidor externo intentó reabrirla.',
        },
        { who: 'iris', text: '¿Guardaste la conexión?' },
        { who: 'teo', text: 'Sí: viene del centro de control del Metro de Valparaíso.' },
        {
          who: 'marta',
          text: 'El agua dejó de pasar, pero en el registro la orden de abrir sigue apareciendo.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
