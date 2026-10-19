import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Stage } from '../../engine/Stage';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { randInt, rng } from '../shared/rng';
import { Confirm, NumberField } from '../shared/ui';
import {
  ACCENT,
  parseExact,
  DiscreteDial,
  JointGrid,
  PILOT_COUNTS,
  ROUTE_COUNTS,
  ROUTE_TABLE,
  SharedBits,
  bitsText,
  conditionalEntropy,
  mutualInfo,
} from './kit';

const PILOT_TABLE = PILOT_COUNTS.map((row) => row.map((n) => n / 16));
const ROUTE_I = mutualInfo(ROUTE_TABLE),
  PILOT_I = mutualInfo(PILOT_TABLE);
function MutualLesson({ beats, unlock, answer, reduced }: DemoProps) {
  const [evidence, setEvidence] = useState(0);
  const [visited, setVisited] = useState(() => new Set<number>());
  const b = beats.beat;
  const pilot = (b === 1 && evidence === 0) || b === 5;
  const complete = visited.size === 2 && evidence === 1;
  const reveal = b !== 0 || reduced || beats.at(0) >= 0.55;
  return (
    <Stage>
      {!reveal && (
        <>
          {[0, 1].map((i) => (
            <g key={i}>
              <rect
                x={170 + i * 360}
                y={240}
                width={350}
                height={420}
                rx={12}
                fill={C.panel}
                stroke={i ? C.amber : ACCENT}
                strokeWidth={4}
              />
              <Cap x={345 + i * 360} y={450} color={i ? C.amber : ACCENT}>
                {i ? 'Ruta cubierta' : 'Torre cubierta'}
              </Cap>
            </g>
          ))}
        </>
      )}
      {reveal &&
        (b <= 1 || b === 5 ? (
          <JointGrid
            counts={pilot ? PILOT_COUNTS : ROUTE_COUNTS}
            rows={['Norte', 'Sur']}
            columns={pilot ? ['Apagado', 'Encendido'] : ['a', 'b', 'c', 'd']}
            columnFilter={!pilot ? 3 : undefined}
            columnName={pilot ? 'piloto' : 'ruta'}
            columnVariable={pilot ? 'Z' : 'Y'}
          />
        ) : (
          <SharedBits
            hx={1}
            hy={2}
            hxy={2}
            showShared={b !== 3 || answer !== null}
            showReadings={false}
            progress={b === 2 && !reduced ? beats.at(2) : 1}
          />
        ))}
      {b === 0 && (
        <>
          <Cap x={1250} y={240} tex="H(X)=1" color={ACCENT} />
          <Cap x={1250} y={340}>
            La ruta d deja una sola torre.
          </Cap>
          <Cap x={1250} y={440}>
            Parte de la ruta responde por X.
          </Cap>
        </>
      )}
      {b === 1 && (
        <>
          <Cap x={1250} y={230} color={ACCENT}>
            {pilot ? 'El piloto conserva las dos torres.' : 'La ruta d identifica Sur.'}
          </Cap>
          <Cap
            x={1250}
            y={330}
            tex={
              pilot
                ? `H(X\\mid Z)=${conditionalEntropy(PILOT_TABLE, 'columns')}`
                : `H(X\\mid Y)=${conditionalEntropy(ROUTE_TABLE, 'columns')}`
            }
          />
          <DiscreteDial
            value={evidence}
            max={1}
            labels={['Piloto', 'Ruta']}
            y={450}
            onChange={setEvidence}
            onSettle={(i) => {
              const next = new Set(visited).add(i);
              setVisited(next);
              setEvidence(i);
              if (i === 1 && next.size === 2 && conditionalEntropy(ROUTE_TABLE, 'columns') === 0)
                unlock();
            }}
          />
          <Cap x={1250} y={600} size={19} color={complete ? C.green : C.amber}>
            {complete
              ? 'Comparación confirmada; ruta seleccionada.'
              : 'Suelta en Piloto; luego suelta en Ruta.'}
          </Cap>
          <Cap x={1250} y={690} size={19}>
            {visited.has(0) ? 'Piloto ✓' : 'Piloto pendiente'} ·{' '}
            {visited.has(1) ? 'Ruta ✓' : 'Ruta pendiente'}
          </Cap>
        </>
      )}
      {b === 2 && (
        <>
          <Cap x={1250} y={240} tex="H(X)=1" color={ACCENT} />
          <Cap x={1250} y={340} tex="H(X\mid Y)=0" />
          <Cap x={1250} y={440} tex={`I(X;Y)=${ROUTE_I}`} color={C.magenta} />
          <Cap x={1250} y={550}>
            Con piloto queda la decisión completa.
          </Cap>
        </>
      )}
      {b === 3 && (
        <>
          <Cap x={1250} y={240} tex="H(X)=1" color={ACCENT} />
          <Cap x={1250} y={330} tex="H(Y)=2" color={C.amber} />
          <Cap x={1250} y={420} tex="H(X,Y)=2" />
          {answer !== null && <Cap x={1250} y={530} tex="I(X;Y)=1+2-2=1" color={C.magenta} />}
        </>
      )}
      {b === 4 && (
        <>
          <Cap x={1250} y={240} tex="H(Y)=2" color={C.amber} />
          <Cap x={1250} y={350} tex="H(Y\mid X)=1" />
          <Cap x={1250} y={460} tex="I(Y;X)=2-1=1" color={C.magenta} />
          <Cap x={1250} y={570}>
            El solapamiento conserva su tamaño.
          </Cap>
        </>
      )}
      {b === 5 && (
        <>
          <Cap x={1250} y={240} tex="p(x,z)=\frac14=\frac12\cdot\frac12" size={21} />
          <Cap x={1250} y={350} tex={`I(X;Z)=${PILOT_I}`} color={C.magenta} />
          <Cap x={1250} y={460} size={19}>
            Cada estado deja Norte y Sur por mitades.
          </Cap>
          <Cap x={1250} y={570} size={19}>
            La asociación no identifica al operador.
          </Cap>
        </>
      )}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Información mutua',
  Scene: MutualLesson,
  beats: [
    {
      say: 'Al retirar la cubierta de la ruta aparece también su torre. Parte de lo que dice Y ya responde de dónde salió; vamos a medir ese contenido compartido.',
      dur: 3,
      board: {
        label: 'Antes de conocer la ruta',
        tex: '\\p{1}{\\cC{H(X)}}=\\p{2}{1}',
        parts: ['incertidumbre inicial', 'bits antes de revelar'],
      },
    },
    {
      say: 'Compara las dos evidencias. La tabla del piloto conserva ambas torres; la ruta d deja solamente Sur.',
      gate: 'Suelta la perilla en Piloto para registrar esa comparación; después arrástrala y suéltala en Ruta.',
      board: [
        {
          label: 'Después de conocer la ruta',
          tex: '\\p{1}{H(X\\mid\\cA{Y})}=\\p{2}{\\cC{0}}',
          parts: ['torre pendiente dada ruta', 'bits restantes de torre'],
        },
        {
          label: 'Después de conocer el piloto',
          tex: '\\p{1}{H(X\\mid\\cM{Z})}=\\p{2}{\\cC{1}}',
          parts: ['torre pendiente dado piloto', 'bits restantes de torre'],
        },
      ],
    },
    {
      say: 'La barra de un bit se resuelve al conocer Y. La **información mutua** mide la reducción promedio de incertidumbre sobre una variable cuando conoces la otra.',
      dur: 3,
      board: {
        label: 'Información compartida',
        tex: '\\p{1}{\\cM{I(X;Y)}}=\\p{2}{\\cC{H(X)}}-\\p{3}{H(X\\mid\\cA{Y})}',
        parts: ['información compartida', 'incertidumbre inicial', 'incertidumbre que queda'],
      },
    },
    {
      say: 'Al sumar las dos entropías cuentas dos veces la zona compartida. Resta la entropía del par para medir ese solapamiento.',
      ask: {
        prompt: 'Con H(X) = 1, H(Y) = 2 y H(X,Y) = 2, ¿cuánto comparten?',
        options: ['3 bits', '1 bit', '0 bits'],
        answer: 1,
        explain:
          '1 + 2 − 2 = 1 bit. El 3 suma sin quitar la duplicación; el 0 supone independencia.',
      },
      board: {
        label: 'Identidad de la información mutua',
        tex: '\\begin{aligned}\\p{1}{\\cM{I(X;Y)}}&=\\p{2}{\\cC{H(X)}+\\cA{H(Y)}}\\\\&\\quad-\\p{3}{H(X,Y)}\\end{aligned}',
        parts: ['información compartida', 'incertidumbres por separado', 'incertidumbre del par'],
      },
    },
    {
      say: 'Invierte el orden. Conocer X deja una decisión de ruta, por lo que Y baja de dos bits a uno. El contenido compartido es el mismo; las incertidumbres pendientes pueden ser distintas.',
      dur: 3,
      board: {
        label: 'Simetría',
        tex: '\\begin{aligned}\\p{1}{I(X;Y)}&=\\p{2}{I(Y;X)}\\\\&=\\p{3}{H(Y)-H(Y\\mid X)}\\end{aligned}',
        parts: ['información compartida', 'mismo contenido al invertir', 'reducción sobre la ruta'],
      },
    },
    {
      say: 'El piloto Z es independiente de la torre en esta tabla: cada cruce pesa el producto de sus marginales. Revelarlo no reduce la incertidumbre; una asociación tampoco explica quién operó el enlace.',
      dur: 3,
      board: [
        {
          label: 'Independencia',
          tex: '\\p{1}{p(x,z)=p(x)p(z)}\\Rightarrow\\p{2}{\\cM{I(X;Z)=0}}',
          parts: ['probabilidades separables', 'sin información compartida'],
        },
        {
          label: 'Cotas',
          tex: '\\p{1}{0}\\le\\p{2}{\\cM{I(X;Y)}}\\le\\p{3}{\\min(H(X),H(Y))}',
          parts: ['mínimo compartido', 'información compartida', 'máximo que pueden compartir'],
        },
      ],
    },
  ],
};
function PilotDemo({ beats, answer }: DemoProps) {
  const [evidence, setEvidence] = useState(0);
  const pilot = evidence === 0;
  return (
    <Stage>
      <JointGrid
        counts={pilot ? PILOT_COUNTS : ROUTE_COUNTS}
        rows={['Norte', 'Sur']}
        columns={pilot ? ['Apagado', 'Encendido'] : ['a', 'b', 'c', 'd']}
        columnVariable={pilot ? 'Z' : 'Y'}
        columnName={pilot ? 'piloto' : 'ruta'}
      />
      <Cap x={1250} y={230}>
        16 registros de salida
      </Cap>
      <Cap x={1250} y={320} size={20}>
        Dos apagados y dos encendidos por par.
      </Cap>
      <DiscreteDial
        value={evidence}
        max={1}
        labels={['Piloto', 'Ruta']}
        y={450}
        onChange={setEvidence}
      />
      {answer !== null && (
        <Cap x={1250} y={590} color={C.magenta} size={20}>
          {beats.beat === 0
            ? `Ruta: ${bitsText(ROUTE_I)} · Piloto: ${bitsText(PILOT_I)}`
            : 'Falta revisar el registro de acceso.'}
        </Cap>
      )}
      <Cap x={530} y={740} size={20}>
        La ruta d conserva el enlace al repetidor de reserva.
      </Cap>
    </Stage>
  );
}
function MutualPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 137 + round),
      k = randInt(r, 1, round === 0 ? 3 : 2),
      a = randInt(r, 1, 2),
      b = randInt(r, 1, 2);
    return {
      k,
      a,
      b,
      hx: round === 1 ? a : k,
      hy: round === 1 ? b : k + (round === 2 ? 1 : 0),
      hxy: round === 1 ? a + b : k + (round === 2 ? 1 : 0),
    };
  }, [seed, round]);
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState('');
  useEffect(() => {
    setFirst('');
    setSecond('');
    api.prompt(
      round === 0
        ? `X tiene ${2 ** data.k} símbolos equiprobables. Y es una copia exacta con otras etiquetas. Calcula I(X;Y), en bits.`
        : round === 1
          ? `X e Y son independientes y uniformes en ${2 ** data.a} y ${2 ** data.b} símbolos. H(X,Y) = ${data.hxy}. Calcula I(X;Y).`
          : 'Y contiene los mismos bits equiprobables de X más un bit independiente. Escribe la información mutua y H(Y dado X).',
    );
    api.hints([
      'Usa I(X;Y) = H(X) + H(Y) − H(X,Y).',
      round === 0
        ? 'Una copia determina X aunque cambien los nombres de sus símbolos.'
        : round === 1
          ? 'La independencia hace que la entropía conjunta sea la suma de las marginales.'
          : 'Para lo pendiente, resta H(X) a H(X,Y).',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseExact(first),
      w = parseExact(second);
    if (v === null || !Number.isFinite(v) || (round === 2 && w === null)) return;
    const target = data.hx + data.hy - data.hxy,
      rest = data.hxy - data.hx;
    if (v === target && (round !== 2 || w === rest))
      return api.result(
        true,
        `$I=${data.hx}+${data.hy}-${data.hxy}=${target}$${round === 2 ? `; $H(Y\\mid X)=${data.hxy}-${data.hx}=${rest}$` : ''}.`,
      );
    if (round === 0 && v === 0)
      return api.result(
        false,
        'Las etiquetas son distintas, pero la copia determina el símbolo original. Comparte toda la información de X.',
      );
    if (round === 1 && v === data.a + data.b)
      return api.result(
        false,
        'Sumaste las entropías sin restar la conjunta. En variables independientes, esa conjunta ya contiene toda la suma.',
      );
    if (round === 1 && v === Math.min(data.a, data.b))
      return api.result(
        false,
        'Ese es el máximo posible de información mutua, no su valor. Estas variables son independientes.',
      );
    if (round === 2 && v === rest && w === target && target !== rest)
      return api.result(
        false,
        'Intercambiaste lo compartido y lo pendiente. El bit agregado a Y sigue sin conocerse después de revelar X.',
      );
    if (round === 2 && w !== rest)
      return api.result(
        false,
        'H(Y dado X) cuenta solo el bit independiente añadido. Los bits copiados de X ya están resueltos.',
      );
    api.result(
      false,
      'Resta la entropía conjunta a la suma de las marginales; no confundas la zona compartida con una zona exclusiva.',
    );
  };
  return (
    <Stage>
      <SharedBits hx={data.hx} hy={data.hy} hxy={data.hxy} showShared={false} />
      <NumberField
        x={1050}
        y={540}
        label="I ="
        width={4}
        value={first}
        onChange={setFirst}
        onEnter={submit}
      />
      {round === 2 && (
        <NumberField
          x={1050}
          y={650}
          label="H(Y|X) ="
          width={4}
          value={second}
          onChange={setSecond}
          onEnter={submit}
        />
      )}
      <Confirm onClick={submit} />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w8-c5',
  world: 'information',
  code: '8.5',
  title: 'El enlace compartido',
  subtitle: 'Información mutua',
  glyph: 'I(X;Y)',
  kind: 'level',
  guide: 'ines',
  teaser: 'Una luz aparece en todas las salidas. Hay que decidir si aporta algo sobre la torre.',
  learn:
    'Medir información compartida, reconocer independencia y distinguir asociación de autoría.',
  glyphs: ['it-mutual', 'it-independent'],
  pitfalls: [
    'Sumar entropías sin restar la conjunta cuenta dos veces lo compartido.',
    'Etiquetas distintas pueden contener la misma información.',
    'La asociación entre torre y ruta no identifica a quien operó el repetidor.',
  ],
  notes: [
    { label: 'Ruta y piloto', tex: 'I(X;Y)=1,\\quad I(X;Z)=0' },
    { label: 'Lo pendiente sobre la torre', tex: 'H(X\\mid Y)=0,\\quad H(X\\mid Z)=1' },
  ],
  steps: [
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        {
          who: 'nar',
          text: 'Mesa de revisión, cinco de la mañana. El café de Teo había formado una película, e Inés seguía de pie junto a la copia del turno.',
        },
        {
          who: 'teo',
          text: 'El piloto aparece en todos los registros. Puede estar avisando la entrega.',
        },
        { who: 'ines', text: 'Parpadea incluso cuando el puerto está vacío.' },
        { who: 'tu', text: 'Veamos si cambia en algo lo que falta saber de la torre.' },
        { who: 'iris', text: 'La luz lleva toda la noche encendida, y la ruta recién apareció.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El piloto de mantenimiento',
      Scene: PilotDemo,
      beats: [
        {
          say: 'En los 16 registros, cada par torre–ruta aparece dos veces con piloto apagado y dos con piloto encendido. Al agrupar por torre y piloto, cada celda reúne cuatro registros.',
          ask: {
            prompt: '¿Qué dato reduce más la incertidumbre sobre la torre?',
            options: ['El piloto: 1 bit', 'Ambos reducen 1 bit', 'La ruta: 1 bit; el piloto: 0'],
            answer: 2,
            explain:
              'La ruta identifica la fila. Cada estado del piloto conserva Norte y Sur por mitades: no reduce la incertidumbre.',
          },
          note: {
            label: 'Comparar las pistas',
            tex: '\\begin{aligned}I(X;Y)&=1+2-2=1\\\\I(X;Z)&=1+1-2=0\\end{aligned}',
          },
        },
        {
          say: 'La ruta d sigue apuntando al repetidor de reserva. El piloto es un ciclo general de mantenimiento; todavía falta leer quién accedió al perfil.',
          ask: {
            prompt: '¿La información mutua de 1 bit prueba quién operó el repetidor?',
            options: [
              'Sí, identifica a Inés',
              'No; mide la asociación y falta revisar el registro de acceso',
              'Sí, porque un bit identifica una persona',
            ],
            answer: 1,
            explain:
              'La variable medida es la torre, no la identidad del operador ni la causa del envío.',
          },
          note: {
            label: 'Alcance de la asociación',
            tex: 'I(X;Y)=I(Y;X)',
            body: 'La asociación orienta la revisión del repetidor; la autoría requiere evidencia de acceso separada.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir lo compartido', Comp: MutualPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'oficina',
      lines: [
        {
          who: 'nar',
          text: 'Teo apartó las líneas del piloto. La taza golpeó la mesa cuando amplió la ficha del repetidor.',
        },
        { who: 'iris', text: 'El perfil tiene tu autorización, Inés.' },
        { who: 'ines', text: 'Autoricé un reinicio. Guarda también el archivo que había antes.' },
        {
          who: 'nar',
          text: 'La copia anterior conservaba las mismas etiquetas, con las ramas en otro orden.',
        },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'it-mutual',
    world: 'information',
    tex: 'I(X;Y)=H(X)+H(Y)-H(X,Y)',
    name: 'Información mutua',
    read: 'i de equis e i',
    meaning: 'Reducción promedio de incertidumbre sobre una variable al conocer la otra.',
    warn: 'Mide asociación; por sí sola no demuestra causalidad ni autoría.',
  },
  {
    id: 'it-independent',
    world: 'information',
    tex: 'p(x,y)=p(x)p(y)',
    name: 'Independencia',
    read: 'probabilidad conjunta igual al producto de las marginales',
    meaning:
      'Conocer una variable no modifica la distribución de la otra; para variables discretas equivale a información mutua cero.',
  },
];
