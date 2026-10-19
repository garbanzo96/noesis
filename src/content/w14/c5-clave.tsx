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
import { pick, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum, thousands } from '../shared/ui';
import { fmt, tnum } from './kit';

/** Cada fila añade una decisión binaria; las hojas no llevan un total calculado. */
function BinaryTree({ depth }: { depth: number }) {
  const x = (level: number, node: number) => 180 + ((node + 0.5) / 2 ** level) * 740;
  const y = (level: number) => 220 + level * 95;
  return (
    <g>
      <Cap x={550} y={125} size={24}>
        Una decisión · dos caminos
      </Cap>
      {Array.from({ length: depth + 1 }, (_, level) => (
        <g key={level}>
          {Array.from({ length: 2 ** level }, (_, node) => (
            <g key={node}>
              {level > 0 && (
                <line
                  x1={x(level - 1, Math.floor(node / 2))}
                  y1={y(level - 1)}
                  x2={x(level, node)}
                  y2={y(level)}
                  stroke={C.line}
                  strokeWidth={2}
                />
              )}
              <circle
                cx={x(level, node)}
                cy={y(level)}
                r={level === depth ? 10 : 7}
                fill={level === depth ? C.amber : C.cyan}
              />
            </g>
          ))}
        </g>
      ))}
      <Cap x={550} y={685} size={20} color={C.muted}>
        Cada punto final es una clave distinta.
      </Cap>
    </g>
  );
}

/** Panel del servidor: muestra solo datos entregados, nunca resuelve la práctica. */
function ServerDrawing({ label, value }: { label: string; value: string }) {
  return (
    <g>
      <rect
        x={180}
        y={190}
        width={740}
        height={470}
        rx={24}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      <Cap x={550} y={250} size={25}>
        Servidor · acceso cerrado
      </Cap>
      {[330, 410, 490].map((y) => (
        <g key={y}>
          <rect
            x={240}
            y={y}
            width={620}
            height={50}
            rx={8}
            fill={C.bg}
            stroke={C.line}
            strokeWidth={2}
          />
          {[280, 310, 340].map((x) => (
            <circle key={x} cx={x} cy={y + 25} r={5} fill={C.amber} />
          ))}
          <line x1={400} x2={810} y1={y + 25} y2={y + 25} stroke={C.dim} strokeWidth={3} />
        </g>
      ))}
      <Cap x={550} y={595} size={22}>
        {label}: {value}
      </Cap>
      <Cap x={550} y={725} size={20} color={C.muted}>
        Una candidata por intento · sin repetir
      </Cap>
    </g>
  );
}

function InformationLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [bits, setBits] = useState(1);
  const beat = beats.beat;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 1) return;
    const next = Math.round(clamp((x - 250) / 600, 0, 1) * 3) + 1;
    setBits(next);
    if (next === 4) unlock();
  });
  const depth = beat === 0 ? 2 : beat === 1 ? bits : 4;
  return (
    <Stage ref={svg}>
      <BinaryTree depth={depth} />
      <Cap x={1250} y={220} tex={`H=${depth}\\ \\text{bits}`} color={C.cyan} />
      {beat !== 3 && <Cap x={1250} y={310} tex={`N=2^{${depth}}=${2 ** depth}`} color={C.amber} />}
      {beat === 1 && (
        <>
          <line x1={250} x2={850} y1={790} y2={790} stroke={C.line} strokeWidth={4} />
          <Knob x={250 + (bits - 1) * 200} y={790} axis="x" onPointerDown={drag} color={C.amber} />
          <Cap x={250} y={850} size={18}>
            1 bit
          </Cap>
          <Cap x={850} y={850} size={18}>
            4 bits
          </Cap>
        </>
      )}
      {beat === 2 && <Cap x={1250} y={400} tex="H=\log_2 N" color={C.green} />}
      {beat === 3 && (
        <>
          <Cap x={1250} y={310} size={22}>
            16 candidatas
          </Cap>
          <Cap x={1250} y={400} size={22}>
            4 intentos por segundo
          </Cap>
          {answer !== null && (
            <Cap x={1250} y={490} tex="T_{\max}=\frac{16}{4}=4\ \text{s}" color={C.green} />
          )}
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={400} size={21}>
            Candidatas equiprobables
          </Cap>
          <Cap x={1250} y={490} tex="T_{\max}=\frac{N}{r}" />
          <Cap x={1250} y={580} size={20}>
            Cada bit extra duplica N.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: contar en bits',
  intro: {
    question: '¿Cuántas claves posibles hay, y cuánto tarda probarlas todas?',
    text: 'Este piso repasa la información de Las Antenas: cada bit duplica las opciones, y un patrón conocido reduce los bits efectivos. Con eso se calcula cuánto tarda una búsqueda completa. El servidor del piso 40 está cerrado con una clave.',
  },
  Scene: InformationLesson,
  beats: [
    {
      say: 'Mira las ramas: cada decisión tiene dos salidas. Dos decisiones binarias permiten cuatro claves distintas; cada decisión agrega un **bit**.',
      board: {
        label: 'Opciones binarias',
        tex: '\\p{1}{N}=\\p{2}{2^H}',
        body: 'H decisiones binarias permiten 2 elevado a H claves.',
        parts: ['cantidad de claves', 'opciones tras las decisiones'],
      },
    },
    {
      say: 'Agrega decisiones al árbol. Cada fila nueva duplica las claves posibles.',
      gate: 'Arrastra la perilla hasta 4 bits.',
      board: {
        label: 'Duplicar las opciones',
        tex: '\\p{1}{2^4}=\\p{2}{16}',
        parts: ['cuatro decisiones binarias', 'claves posibles'],
      },
    },
    {
      say: 'Para N claves equiprobables, la **entropía** cuenta cuántos bits necesitas para distinguirlas. El logaritmo en base 2 deshace la potencia.',
      board: {
        label: 'Información en bits',
        tex: '\\p{1}{H}=\\p{2}{\\log_2 N}',
        body: 'Esta fórmula supone que todas las candidatas tienen la misma probabilidad.',
        parts: ['bits necesarios', 'bits para distinguir claves'],
      },
    },
    {
      say: 'Un sistema prueba esas 16 candidatas a cuatro intentos por segundo, sin repetir. Considera que la correcta queda al final.',
      ask: {
        prompt: '¿Cuánto demora en el peor caso?',
        options: ['4 s', '2 s', '64 s'],
        answer: 0,
        explain:
          '16 candidatas / 4 intentos por segundo = 4 s. Dos segundos sería aproximadamente la mitad del recorrido, no el peor caso.',
      },
      board: {
        label: 'Tiempo máximo de búsqueda',
        tex: '\\p{1}{T_{\\max}}=\\p{2}{N/r}',
        body: 'r es la cantidad de intentos por segundo.',
        parts: ['tiempo máximo de búsqueda', 'candidatas por ritmo'],
      },
    },
    {
      say: 'Una clave larga puede seguir un patrón que deje pocas candidatas. Cuenta las opciones que quedan: su información efectiva puede ser mucho menor que la longitud escrita.',
      board: {
        label: 'Opciones efectivas',
        tex: '\\p{1}{H_{\\text{ef}}}=\\p{2}{\\log_2 N_{\\text{candidatas}}}',
        body: 'Si no son equiprobables, log₂ N es una cota máxima de entropía.',
        parts: ['información efectiva', 'bits según las candidatas'],
      },
    },
  ],
};

function KeyDemo({ beats, answer }: DemoProps) {
  const pattern = beats.beat === 1;
  return (
    <Stage>
      <ServerDrawing
        label={pattern ? 'Patrón de fechas' : 'Longitud de la clave'}
        value={pattern ? '16 bits efectivos' : '40 bits'}
      />
      <Cap x={1250} y={220} tex={pattern ? 'H_{\\text{ef}}=16' : 'H=40'} color={C.cyan} />
      <Cap x={1250} y={310} tex="r=10^9\ \text{intentos/s}" size={20} />
      <Cap
        x={1250}
        y={400}
        tex={pattern ? 'N_{\\text{candidatas}}=2^{16}' : 'N=2^{40}'}
        color={C.amber}
      />
      {answer !== null &&
        (pattern ? (
          <>
            <Cap x={1250} y={490} tex="N_{\text{candidatas}}=65\,536" color={C.green} />
            <Cap x={1250} y={580} size={20}>
              Recorte de 24 bits efectivos
            </Cap>
          </>
        ) : (
          <>
            <Cap x={1250} y={490} tex="T_{\max}\approx1099{,}5\ \text{s}" color={C.green} />
            <Cap x={1250} y={580} tex="T_{\max}\approx18\ \text{min}" color={C.green} />
            <Cap x={1250} y={670} tex="N\approx1{,}1\cdot10^{12}" size={20} />
          </>
        ))}
    </Stage>
  );
}

function KeyPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 431 + round);
    const bits = pick(r, round === 2 ? [12, 14, 16, 18] : [5, 7, 9, 11, 13]);
    const rate = 2 ** pick(r, [4, 5, 6, 7]);
    return { bits, count: 2 ** bits, rate, time: 2 ** bits / rate };
  }, [seed, round]);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    api.prompt(
      [
        `Quedan ${thousands(d.count)} claves equiprobables. ¿Cuántos bits efectivos tiene esta búsqueda?`,
        `Un patrón deja ${d.bits} bits efectivos. ¿Cuántas claves candidatas quedan? Escribe el número sin separador de miles.`,
        `Una clave tiene ${d.bits} bits efectivos. El sistema prueba ${d.rate} candidatas por segundo, sin repetir. ¿Cuántos segundos tarda en el peor caso?`,
      ][round],
      round === 0 ? 'H=\\log_2 N' : round === 1 ? 'N=2^H' : 'T_{\\max}=N/r',
    );
    api.hints(
      round === 0
        ? [
            'Cuenta cuántas duplicaciones llevan de 1 al número de candidatas.',
            'Busca H tal que 2 elevado a H sea la cantidad entregada.',
          ]
        : round === 1
          ? [
              'Cada bit duplica las posibilidades.',
              'Eleva 2 al número de bits efectivos; no multipliques 2 por los bits.',
            ]
          : [
              'Convierte primero los bits en candidatas usando N = 2 elevado a H.',
              'Divide N por los intentos por segundo. En el peor caso recorres todas las candidatas.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const near = (target: number) => Math.abs(n - target) < 0.01;
    const target = round === 0 ? d.bits : round === 1 ? d.count : d.time;
    if (near(target))
      return api.result(
        true,
        [
          `$H=\\log_2 ${d.count}=${d.bits}\\ \\text{bits}$.`,
          `$N=2^{${d.bits}}=${d.count}\\ \\text{claves}$.`,
          `$N=2^{${d.bits}}=${d.count}$; $T_{\\max}=${d.count}/${d.rate}=${tnum(d.time, 0)}\\ \\text{s}$.`,
        ][round],
      );
    if (round === 0) {
      if (near(d.count))
        return api.result(
          false,
          'Ingresaste la cantidad de claves. Los bits cuentan cuántas duplicaciones generan esa cantidad.',
        );
      if (near(Math.log10(d.count)))
        return api.result(false, 'Usaste el logaritmo en base 10. Para medir en bits usa base 2.');
      return api.result(
        false,
        'Busca el exponente de 2 que da la cantidad de candidatas, no la mitad de esa cantidad.',
      );
    }
    if (round === 1) {
      if (near(2 * d.bits))
        return api.result(
          false,
          'Multiplicaste los bits por 2. Cada bit duplica el total anterior: usa una potencia.',
        );
      if (near(d.bits))
        return api.result(
          false,
          'Ese dato está en bits. Convierte a claves calculando 2 elevado a ese número.',
        );
      return api.result(
        false,
        `Parte de una opción y duplica ${d.bits} veces para contar las claves.`,
      );
    }
    if (near(d.time / 2))
      return api.result(
        false,
        'Recorriste solo la mitad de las candidatas. El peor caso exige probarlas todas.',
      );
    if (near(d.count))
      return api.result(
        false,
        'Contaste las candidatas, pero falta dividir por los intentos por segundo para obtener tiempo.',
      );
    if (near(d.bits / d.rate))
      return api.result(
        false,
        'Dividiste bits por intentos por segundo. Primero transforma los bits en cantidad de candidatas.',
      );
    if (near(d.count * d.rate))
      return api.result(
        false,
        'Multiplicaste por la velocidad. Más intentos por segundo acortan el tiempo: divide.',
      );
    if (near(d.time / 60))
      return api.result(false, 'Ese valor está en minutos. La respuesta pedida es en segundos.');
    return api.result(
      false,
      `Calcula 2 elevado a ${d.bits} y divide por ${d.rate}. Incluye todas las candidatas.`,
    );
  };
  return (
    <Stage>
      <ServerDrawing
        label={round === 0 ? 'Candidatas' : 'Información efectiva'}
        value={round === 0 ? thousands(d.count) : `${d.bits} bits`}
      />
      <Cap x={1250} y={220} size={22}>
        Ronda {round + 1} · acceso
      </Cap>
      <Cap x={1250} y={310} size={21}>
        {round === 0 ? `${thousands(d.count)} claves` : `${d.bits} bits efectivos`}
      </Cap>
      <Cap x={1250} y={400} size={20}>
        {round === 2 ? `${fmt(d.rate, 0)} intentos/s` : 'Candidatas equiprobables'}
      </Cap>
      <NumberField
        x={1070}
        y={510}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label={round === 0 ? 'H =' : round === 1 ? 'N =' : 'T ='}
        unit={round === 0 ? 'bits' : round === 1 ? 'claves' : 's'}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c5',
  world: 'active',
  code: '14.5',
  title: 'La clave',
  subtitle: 'Repaso: información y búsqueda',
  glyph: 'H=\\log_2 N',
  kind: 'level',
  guide: 'iris',
  teaser: 'El servidor está cerrado. Teo reconoce un patrón de fechas en las claves del edificio.',
  learn: 'Convertir entre bits y candidatas, y calcular el tiempo de búsqueda en el peor caso.',
  glyphs: ['tor-key-bits', 'tor-key-search'],
  pitfalls: [
    'H = log₂ N supone candidatas equiprobables; la longitud escrita puede superar la información efectiva.',
    'H bits permiten 2 elevado a H claves, no 2 por H.',
    'El peor tiempo es N/r; recorrer la mitad corresponde a otra pregunta.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'El ventilador del servidor vibraba bajo la mesa, y en la pantalla el campo de acceso volvía a quedar vacío.',
        },
        {
          who: 'teo',
          text: 'Cuarenta bits y mil millones de intentos por segundo en esta copia local. Si la clave correcta queda al final, el recorrido completo toma unos dieciocho minutos.',
        },
        { who: 'iris', text: 'Es demasiado. Revisa lo que ya tenemos.' },
        { who: 'tu', text: 'Las claves de los registros repiten fechas.' },
        {
          who: 'teo',
          text: 'Sí, el formato se repite en todo el sistema. Con ese patrón, las candidatas se reducen a dieciséis bits efectivos.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La búsqueda del servidor',
      Scene: KeyDemo,
      beats: [
        {
          say: 'Sin usar el patrón, la clave de 40 bits permite 2⁴⁰ combinaciones. La copia local admite 10⁹ intentos por segundo; supone una búsqueda sin repetir.',
          ask: {
            prompt: '¿Cuánto tarda aproximadamente en el peor caso?',
            options: ['18 min', '9 min', '40 s'],
            answer: 0,
            explain:
              '2⁴⁰ = 1 099 511 627 776. Dividir por 10⁹ da 1099,5 s, cerca de 1100 s o 18 min; 9 min recorre aproximadamente la mitad.',
          },
          note: {
            label: 'Clave completa',
            tex: 'N=2^{40}\\approx1{,}1\\cdot10^{12}',
            body: 'A 10⁹ intentos/s: aproximadamente 1100 s, unos 18 min en el peor caso.',
          },
        },
        {
          say: 'Teo restringe la búsqueda a las fechas del patrón registrado. Ese conjunto tiene 16 bits efectivos; trata sus candidatas como equiprobables.',
          ask: {
            prompt: '¿Cuántas claves necesita considerar ahora?',
            options: ['65 536', '32', '16'],
            answer: 0,
            explain:
              '2¹⁶ = 65 536 candidatas. Multiplicar 16 por 2 no cuenta las duplicaciones sucesivas; el patrón recorta 24 bits efectivos.',
          },
          note: {
            label: 'Patrón de fechas',
            tex: 'N_{\\text{candidatas}}=2^{16}=65\\,536',
            body: 'La reducción depende de que la clave siga ese patrón. Una búsqueda fallida obliga a ampliar el conjunto.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Medir el espacio de búsqueda', Comp: KeyPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Teo cargó la lista de fechas. El indicador de acceso pasó a verde antes de que Iris retirara la mano del respaldo.',
        },
        {
          who: 'teo',
          text: 'Entró dentro del patrón. El servidor ya está copiando los registros, incluida la cuenta que adelantaba las apuestas.',
        },
        { who: 'iris', text: 'Guarda también la firma. La cuenta sola no alcanza.' },
        {
          who: 'nar',
          text: 'En el vidrio se reflejaba una carpeta recién abierta: autorizaciones del piso 40.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-key-bits',
    world: 'active',
    tex: 'H=\\log_2 N',
    name: 'Información de candidatas equiprobables',
    read: 'hache igual al logaritmo en base dos de ene',
    meaning: 'Mide en bits la incertidumbre entre N claves con la misma probabilidad.',
    warn: 'Si hay probabilidades distintas, log₂ N es la entropía máxima, no necesariamente la real.',
  },
  {
    id: 'tor-key-search',
    world: 'active',
    tex: 'T_{\\max}=N/r',
    name: 'Tiempo máximo de búsqueda',
    read: 'te máximo igual a ene dividido por erre',
    meaning:
      'Tiempo para probar N candidatas distintas a una tasa constante de r intentos por segundo.',
    warn: 'Supone búsqueda sin repetir, sin bloqueos y con la correcta dentro del conjunto.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Información equiprobable',
      tex: 'H=\\log_2 N',
      body: 'N es el número de candidatas equiprobables; H se mide en bits.',
    },
    {
      label: 'Candidatas desde bits',
      tex: 'N=2^H',
      body: 'Cada bit adicional duplica la cantidad de opciones.',
    },
    {
      label: 'Búsqueda exhaustiva',
      tex: 'T_{\\max}=\\frac{N}{r}',
      body: 'Con r intentos por segundo y sin repetir, el peor caso recorre todas las candidatas. El tiempo queda en segundos.',
    },
  ],
  props: [
    {
      label: 'Clave del servidor',
      tex: '2^{40}=1\\,099\\,511\\,627\\,776',
      body: 'A 10⁹ intentos/s son 1099,5 s aproximadamente: cerca de 1100 s o 18 min.',
    },
    {
      label: 'Patrón de fechas',
      tex: '2^{16}=65\\,536',
      body: 'El patrón reduce el conjunto a 16 bits efectivos. La clave debe pertenecer a ese conjunto para que la búsqueda resulte.',
    },
    {
      label: 'Reducir bits efectivos',
      tex: '\\frac{2^{40}}{2^{16}}=2^{24}',
      body: 'Recortar 24 bits divide el espacio de búsqueda por 2²⁴, manteniendo la misma tasa de intentos.',
    },
  ],
};

export { lesson };
