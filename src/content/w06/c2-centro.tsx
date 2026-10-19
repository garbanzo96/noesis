import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap, NumberLine, lineMap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { DotPlot, Fulcrum, mean, median, num, sorted, sum } from './kit';

// ============================================================================
// CASO 6.2 · «El promedio» — medidas de tendencia central
// Media como punto de equilibrio; sensibilidad a datos extremos; mediana; moda;
// media ponderada con una tabla de frecuencias.
// ============================================================================

const X = lineMap(0, 40, 300, 1140);
const Y0 = 520;

// ---------------------------------------------------------------- lesson
function CenterLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [big, setBig] = useState(7);
  const onBig = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - 300) / 840) * 40, 7, 38));
    setBig(v);
    if (v >= 20) unlock();
  });
  if (beat === 4) {
    const cats: [string, number][] = [
      ['Cerro Alegre', 7],
      ['Playa Ancha', 4],
      ['Placeres', 2],
    ];
    const Q = plane([0, 3], [0, 8], { x: 420, y: 180, w: 600, h: 380 });
    return (
      <Stage>
        <Axes P={Q} yTicks={[0, 2, 4, 6, 8]} yLabel="f" />
        {cats.map(([name, f], k) => (
          <g key={k} opacity={clamp(at(4) * 3 - k, 0, 1)}>
            <rect
              x={Q.x(k + 0.15)}
              y={Q.y(f)}
              width={Q.x(0.7) - Q.x(0)}
              height={Q.y(0) - Q.y(f)}
              fill={k === 0 ? C.green : C.amber}
              opacity={0.6}
            />
            <Cap x={Q.x(k + 0.5)} y={Q.y(0) + 28} size={18} color={C.text}>
              {name}
            </Cap>
          </g>
        ))}
        <Cap
          x={1300}
          y={300}
          size={22}
          color={C.green}
          tex="\text{Mo}=\text{Cerro Alegre}"
          opacity={at(4)}
        />
      </Stage>
    );
  }
  const data =
    beat === 5
      ? [1, 1, 1, 1, 1, 2, 2, 2, 3, 3]
      : beat === 3
        ? [2, 3, 3, 5, 37]
        : [2, 3, 3, 5, beat >= 1 ? big : 7];
  const m = mean(data);
  // beat 0: the fulcrum slides from 12 to the mean while the ruler levels
  const f = beat === 0 ? 12 + (m - 12) * at(0) : m;
  const torque = sum(data.map((x) => x - f));
  const tilt = clamp(torque * 1.2, -14, 14);
  const XX = beat === 5 ? lineMap(0, 4, 300, 1140) : X;
  const md = median(data);
  return (
    <Stage ref={svg}>
      <g transform={`rotate(${tilt} ${XX(f)} ${Y0})`}>
        <line
          x1={XX(0) - 20}
          x2={XX(beat === 5 ? 4 : 40) + 20}
          y1={Y0}
          y2={Y0}
          stroke={C.muted}
          strokeWidth={5}
        />
        <DotPlot X={XX} y={Y0 - 2} xs={data} r={13} color={C.amber} />
      </g>
      {((beat !== 3 && beat !== 5) || answer !== null) && <Fulcrum X={XX} y={Y0} at={f} />}
      <NumberLine X={XX} y={Y0 + 80} lo={0} hi={beat === 5 ? 4 : 40} step={beat === 5 ? 1 : 5} />
      {beat >= 1 && beat <= 2 && (
        <Knob
          x={X(big)}
          y={Y0 - 15}
          color={C.magenta}
          onPointerDown={onBig}
          r={16}
          cursor="ew-resize"
        />
      )}
      {(beat === 2 || (beat === 3 && answer !== null)) && (
        <>
          <line
            x1={XX(md)}
            x2={XX(md)}
            y1={Y0 - 150}
            y2={Y0 + 50}
            stroke={C.cyan}
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          <Cap x={XX(md)} y={Y0 - 175} size={20} color={C.cyan} tex={`\\tilde x=${num(md)}`} />
        </>
      )}
      {((beat !== 3 && beat !== 5) || answer !== null) && (
        <Cap
          x={XX(f)}
          y={Y0 + 150}
          size={22}
          color={C.green}
          tex={`\\bar x=${num(m, 2)}`}
          opacity={beat === 0 ? at(0) : 1}
        />
      )}
      {beat === 2 && (
        <Cap
          x={1370}
          y={230}
          size={20}
          color={C.muted}
          tex={`\\text{ordenados: }${sorted(data).join(',\\ ')}`}
        />
      )}
      {beat === 5 && (
        <>
          <Cap x={1370} y={210} size={20} color={C.text} tex="x_i:\ 1,\ 2,\ 3" />
          <Cap x={1370} y={250} size={20} color={C.amber} tex="f_i:\ 5,\ 3,\ 2" />
          {answer !== null && (
            <Cap
              x={1370}
              y={300}
              size={20}
              color={C.green}
              tex="\tfrac{5\cdot1+3\cdot2+2\cdot3}{10}=1{,}7"
            />
          )}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Medidas de tendencia central',
  intro: {
    question: '¿Qué número representa mejor el valor típico de unos datos?',
    text: 'La media, la mediana y la moda resumen un conjunto de datos en un solo valor, y cada una responde a una pregunta distinta. La media se deja arrastrar por los valores extremos; la mediana, no. El informe presume 46 dosis diarias en promedio, y un solo día explica casi todo ese número.',
  },
  Scene: CenterLesson,
  beats: [
    {
      say: 'La **media** o promedio es la suma de los datos dividida por cuántos son. Tiene un sentido físico: si cada dato es una pesa sobre una regla, la regla queda en equilibrio justo en la media.',
      dur: 3.4,
      board: {
        label: 'Media',
        tex: '\\bar x=\\frac{\\p{1}{x_1+x_2+\\dots+x_n}}{\\p{2}{n}}=\\p{3}{\\frac1n\\sum_{i=1}^n x_i}',
        body: 'Aquí: $\\tfrac{2+3+3+5+7}{5}=4$.',
        parts: ['suma de los datos', 'cantidad de datos', 'promedio como suma'],
      },
    },
    {
      say: 'Ahora aleja un solo dato. Para mantener el equilibrio, el punto de apoyo tiene que correrse hacia él.',
      gate: 'Arrastra la pesa magenta hacia la derecha, más allá de 20.',
      board: {
        label: 'Sensible a los extremos',
        tex: '\\bar x\\ \\text{depende de todos los datos}',
        body: 'Un solo valor extremo puede arrastrar la media lejos de la mayoría.',
      },
    },
    {
      say: 'La **mediana** es el dato del medio cuando se ordenan: deja la mitad de los datos a cada lado. Si son pares, es el promedio de los dos centrales. Fíjate: no se movió con la pesa.',
      dur: 3,
      board: {
        label: 'Mediana',
        tex: '\\p{1}{\\tilde x}=\\p{2}{\\text{dato central (ordenados)}}',
        body: 'Con $n$ par, el promedio de los dos centrales. Es **resistente** a los extremos.',
        parts: ['centro por posición', 'mitad a cada lado'],
      },
    },
    {
      say: 'Compara las dos medidas con un dato extremo.',
      ask: {
        prompt: 'Datos: 2, 3, 3, 5, 37. ¿Media y mediana?',
        options: ['media 10, mediana 3', 'media 3, mediana 10', 'media 5, mediana 3'],
        answer: 0,
        explain:
          'Suma 50 entre 5 datos: media 10. Ordenados, el del medio es 3. Ninguno de los cinco datos está cerca de 10.',
      },
      board: {
        tex: '\\bar x=\\tfrac{50}{5}=\\p{1}{10},\\qquad \\tilde x=\\p{2}{3}',
        parts: ['promedio con el extremo', 'mediana sin cambio'],
      },
    },
    {
      say: 'La **moda** es el valor más frecuente. Sirve incluso para variables cualitativas, como la comuna.',
      dur: 2.4,
      board: {
        label: 'Moda',
        tex: '\\p{1}{\\text{Mo}}=\\p{2}{\\text{valor de mayor frecuencia}}',
        parts: ['valor más común', 'dato que más aparece'],
      },
    },
    {
      say: 'Con una tabla de frecuencias no hace falta escribir cada dato: cada valor se multiplica por cuántas veces aparece. Es una **media ponderada**.',
      ask: {
        prompt: 'Valores 1, 2, 3 con frecuencias 5, 3, 2. ¿Cuál es la media?',
        options: ['1,7', '2', '6'],
        answer: 0,
        explain:
          '$\\tfrac{5\\cdot1+3\\cdot2+2\\cdot3}{5+3+2}=\\tfrac{17}{10}=1{,}7$. El promedio simple de 1, 2 y 3 (que da 2) ignora las frecuencias.',
      },
      board: {
        label: 'Media ponderada',
        tex: '\\bar x=\\frac{\\p{1}{\\sum f_i\\,x_i}}{\\p{2}{\\sum f_i}}',
        parts: ['suma con sus frecuencias', 'cantidad total de datos'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const DOSES = [18, 22, 20, 25, 19, 21, 400, 23, 17, 20, 24, 22, 19, 21, 20];
const PD = plane([0.3, 15.7], [0, 420], { x: 300, y: 140, w: 840, h: 480 });

function DosesDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const m = mean(DOSES);
  const md = median(DOSES);
  const without = DOSES.filter((d) => d !== 400);
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[1, 3, 5, 7, 9, 11, 13, 15]}
        yTicks={[0, 100, 200, 300, 400]}
        xLabel="\text{día}"
        yLabel="\text{dosis}"
        grid
      />
      {DOSES.map((d, k) => (
        <rect
          key={k}
          x={PD.x(k + 1 - 0.35)}
          y={PD.y(d * (beat === 0 ? at(0) : 1))}
          width={PD.x(0.7) - PD.x(0)}
          height={PD.y(0) - PD.y(d * (beat === 0 ? at(0) : 1))}
          fill={d === 400 ? C.magenta : C.amber}
          opacity={0.6}
        />
      ))}
      {beat >= 1 && (beat > 1 || answer !== null) && (
        <>
          <line
            x1={PD.box.x}
            x2={PD.box.x + PD.box.w}
            y1={PD.y(m)}
            y2={PD.y(m)}
            stroke={C.green}
            strokeWidth={3}
            strokeDasharray="10 6"
          />
          <line
            x1={PD.box.x}
            x2={PD.box.x + PD.box.w}
            y1={PD.y(md)}
            y2={PD.y(md)}
            stroke={C.cyan}
            strokeWidth={3}
            strokeDasharray="4 4"
          />
          <Cap x={1370} y={250} size={22} color={C.green} tex={`\\bar x\\approx${num(m, 1)}`} />
          <Cap x={1370} y={300} size={22} color={C.cyan} tex={`\\tilde x=${md}`} />
        </>
      )}
      {beat === 2 && answer !== null && (
        <Cap
          x={1370}
          y={370}
          size={22}
          color={C.amber}
          tex={`\\text{sin el 400: }\\bar x\\approx${num(mean(without), 1)}`}
        />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Center({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 43 + round);
    const xs = Array.from({ length: round === 1 ? pick(r, [6, 7]) : 6 }, () => randInt(r, 10, 40));
    const vals = [0, 1, 2, 3];
    const fr = vals.map(() => randInt(r, 1, 9));
    return { xs, vals, fr };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { xs, vals, fr } = data;
  const XC = lineMap(10, 40, 300, 1100);

  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt(
        'Dosis aplicadas en seis turnos. ¿Cuál es la media? (Dos decimales si no es exacta.)',
        '\\bar x=\\frac1n\\sum x_i',
      );
      api.hints([`La suma es ${sum(xs)}.`, 'Divide por la cantidad de datos.']);
    } else if (round === 1) {
      api.prompt(`Minutos de espera de ${xs.length} pacientes. ¿Cuál es la mediana?`, '\\tilde x');
      api.hints([
        'Primero ordénalos de menor a mayor.',
        xs.length % 2
          ? 'Con una cantidad impar, es el del medio.'
          : 'Con una cantidad par, promedia los dos centrales.',
      ]);
    } else {
      api.prompt(
        'Dosis recibidas por paciente, en una tabla de frecuencias. ¿Cuál es la media? (Dos decimales.)',
        '\\bar x=\\frac{\\sum f_i x_i}{\\sum f_i}',
      );
      api.hints([
        'Multiplica cada valor por su frecuencia y suma.',
        'Divide por el total de pacientes, no por 4.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = mean(xs);
      if (Math.abs(v - t) < 0.006) return api.result(true, `$\\tfrac{${sum(xs)}}{6}=${num(t)}$.`);
      if (Math.abs(v - median(xs)) < 0.01)
        return api.result(false, 'Esa es la mediana. La media suma todos y divide por 6.');
      return api.result(false, `La suma es ${sum(xs)}; divídela por 6.`);
    }
    if (round === 1) {
      const t = median(xs);
      if (Math.abs(v - t) < 0.01)
        return api.result(
          true,
          `Ordenados: ${sorted(xs).join(', ')}. Mediana ${num(t, 1).replace('{,}', ',')}.`,
        );
      if (Math.abs(v - xs[Math.floor(xs.length / 2)]) < 0.01)
        return api.result(
          false,
          'Ese es el dato del medio de la lista sin ordenar. Ordénala primero.',
        );
      return api.result(
        false,
        `Ordenados: ${sorted(xs).join(', ')}. ${xs.length % 2 ? 'Toma el del medio.' : 'Promedia los dos centrales.'}`,
      );
    }
    const t = sum(vals.map((x, k) => x * fr[k])) / sum(fr);
    if (Math.abs(v - t) < 0.006)
      return api.result(
        true,
        `$\\tfrac{${sum(vals.map((x, k) => x * fr[k]))}}{${sum(fr)}}=${num(t)}$.`,
      );
    if (Math.abs(v - 1.5) < 0.01)
      return api.result(
        false,
        'Ese es el promedio de 0, 1, 2 y 3 sin pesos. Cada valor pesa según su frecuencia.',
      );
    if (Math.abs(v - sum(vals.map((x, k) => x * fr[k])) / 4) < 0.01)
      return api.result(false, `Divide por el total de pacientes, ${sum(fr)}, no por 4.`);
    return api.result(
      false,
      `$\\sum f_i x_i=${sum(vals.map((x, k) => x * fr[k]))}$ y $\\sum f_i=${sum(fr)}$.`,
    );
  };

  return (
    <Stage>
      {round < 2 && (
        <>
          <DotPlot X={XC} y={460} xs={xs} r={12} color={C.amber} />
          <NumberLine X={XC} y={470} lo={10} hi={40} step={5} />
          <Cap x={700} y={260} size={30} color={C.text} tex={xs.join(',\\ ')} />
        </>
      )}
      {round === 2 && (
        <>
          <Cap x={420} y={250} size={24} color={C.muted} tex="\text{dosis } x_i" />
          <Cap x={620} y={250} size={24} color={C.muted} tex="\text{pacientes } f_i" />
          {vals.map((x, k) => (
            <g key={k}>
              <Cap x={420} y={310 + k * 56} size={28} color={C.text} tex={String(x)} />
              <Cap x={620} y={310 + k * 56} size={28} color={C.amber} tex={String(fr[k])} />
            </g>
          ))}
        </>
      )}
      <NumberField
        x={1180}
        y={360}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 1 ? 'mediana =' : 'media ='}
        width={4}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c2',
  world: 'statistics',
  code: '6.2',
  title: 'El promedio',
  subtitle: 'Medidas de tendencia central',
  glyph: '\\bar x',
  kind: 'level',
  guide: 'teo',
  teaser:
    'El informe oficial presume «46 dosis diarias en promedio». En el registro día por día, un solo día explica casi todo ese número.',
  learn:
    'Media, mediana y moda; media como punto de equilibrio, efecto de los datos extremos y media ponderada.',
  glyphs: ['st-mean', 'st-median'],
  pitfalls: [
    'Para la mediana, primero se ordenan los datos.',
    'La media se deja arrastrar por valores extremos; la mediana no.',
    'En una tabla de frecuencias se divide por el total de datos $\\sum f_i$.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'nar',
          text: 'Archivo Regional, diez de la mañana. Ana sostenía la hoja por el borde, como si temiera dejarle huellas.',
        },
        {
          who: 'ana',
          text: 'El informe presume «46 dosis diarias en promedio», y lleva el sello de la clínica. Ustedes tendrán que justificar cada cifra que le discutan.',
        },
        {
          who: 'teo',
          text: 'Tengo los quince días de la copia. Podemos verlos completos, sin depender de esa frase.',
        },
        { who: 'iris', text: 'Muéstralos. Quiero saber si hubo algún día así de verdad.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Dosis por día',
      Scene: DosesDemo,
      beats: [
        {
          say: 'Dosis aplicadas cada día de la campaña, según la copia del registro.',
          dur: 1.8,
          note: { label: 'Dosis diarias', tex: 'n=15\\ \\text{días}' },
        },
        {
          say: 'El informe usa la media.',
          ask: {
            prompt: '«46 dosis diarias en promedio». ¿Describe un día típico?',
            options: [
              'No: un solo día de 400 infla la media; la mediana es 21',
              'Sí: la media siempre es el día típico',
              'No: la moda es 400',
            ],
            answer: 0,
            explain:
              'La suma es 691: $\\bar x=691/15\\approx46{,}1$. Pero 14 de los 15 días estuvieron entre 17 y 25; la mediana es 21.',
          },
          note: { label: 'Media y mediana', tex: '\\bar x\\approx46{,}1,\\quad \\tilde x=21' },
        },
        {
          say: 'Teo aparta el día extremo para ver el resto.',
          ask: {
            prompt: 'Sin el día de 400 dosis, ¿cuál es la media?',
            options: ['≈ 20,8', '≈ 46,1', '≈ 28'],
            answer: 0,
            explain:
              '$\\tfrac{691-400}{14}=\\tfrac{291}{14}\\approx20{,}8$. Casi igual a la mediana.',
          },
          note: {
            label: 'Sin el día extremo',
            tex: '\\bar x=\\tfrac{291}{14}\\approx20{,}8',
            body: 'El 12 de agosto se registraron 400 dosis en un solo día.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'El centro de los datos', Comp: Center, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'teo',
          text: 'El promedio da 46,1, pero el día del medio da 21, y sin el día de 400 queda en 20,8. Ese único día arrastra todo el informe.',
        },
        {
          who: 'ana',
          text: 'El 12 de agosto: 400 dosis. El portero recuerda dos buses de Halcón, y su nombre queda fuera de la copia que se lleven.',
        },
        {
          who: 'iris',
          text: 'Por ahora. Antes de decir que el resto fue rellenado, comparemos otros días con la Clínica Norte.',
        },
        { who: 'ana', text: 'Puedo traer ocho de cada clínica. Esos folios se guardaron aparte.' },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'st-mean',
    world: 'statistics',
    tex: '\\bar x',
    name: 'Media',
    read: 'equis barra',
    meaning: 'Suma de los datos dividida por cuántos son; punto de equilibrio de los datos.',
  },
  {
    id: 'st-median',
    world: 'statistics',
    tex: '\\tilde x',
    name: 'Mediana',
    read: 'equis tilde',
    meaning: 'Dato central de los datos ordenados; resistente a valores extremos.',
  },
];
