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
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum } from './kit';

// Dos mesas Bernoulli, premio de una unidad por acierto y tasas fijas desconocidas.
// Explorar sortea uniformemente entre ambas, incluida la favorita actual.
function Tables({
  wins = [3, 1],
  trials = 5,
  rates,
}: {
  wins?: number[];
  trials?: number;
  rates?: number[];
}) {
  return (
    <g>
      {wins.map((w, i) => {
        const x = 180 + i * 400;
        const color = i === 0 ? C.cyan : C.magenta;
        return (
          <g key={i}>
            <rect
              x={x}
              y={210}
              width={340}
              height={350}
              rx={20}
              fill={C.panel}
              stroke={color}
              strokeWidth={3}
            />
            <Cap x={x + 170} y={255} size={28} color={color}>
              Mesa {i === 0 ? 'A' : 'B'}
            </Cap>
            {Array.from({ length: trials }, (_, j) => (
              <circle
                key={j}
                cx={x + 50 + (j % 5) * 60}
                cy={335 + Math.floor(j / 5) * 65}
                r={18}
                fill={j < w ? color : C.bg}
                stroke={j < w ? color : C.line}
                strokeWidth={3}
              />
            ))}
            <Cap x={x + 170} y={490} size={22}>
              {w} {w === 1 ? 'acierto' : 'aciertos'} de {trials}
            </Cap>
            <Cap x={x + 170} y={620} size={22} color={rates ? color : C.muted}>
              {rates ? `Tasa real: ${fmt(rates[i])}` : 'Tasa real desconocida'}
            </Cap>
          </g>
        );
      })}
    </g>
  );
}

function Policy({ epsilon }: { epsilon: number }) {
  return (
    <g>
      <Cap x={550} y={205} size={26}>
        Una decisión antes del cierre
      </Cap>
      <rect x={180} y={280} width={740 * (1 - epsilon)} height={85} fill={C.cyan} rx={8} />
      {epsilon > 0 && (
        <rect
          x={180 + 740 * (1 - epsilon)}
          y={280}
          width={740 * epsilon}
          height={85}
          fill={C.amber}
          rx={8}
        />
      )}
      <Cap x={550} y={405} tex={`1-\\varepsilon=${tnum(1 - epsilon)}`} color={C.cyan} />
      <Cap x={550} y={485} tex={`\\varepsilon=${tnum(epsilon)}`} color={C.amber} />
      <Cap x={550} y={565} size={22}>
        Explotar: elegir la mejor frecuencia observada.
      </Cap>
      <Cap x={550} y={645} size={22}>
        Explorar: sortear A o B, cada una con probabilidad 1/2.
      </Cap>
    </g>
  );
}

function ExploreLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [epsilon, setEpsilon] = useState(0);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 3) return;
    const next = Math.round(clamp((x - 1090) / 320, 0, 1) * 10) / 10;
    setEpsilon(next);
    if (next === 0.2) unlock();
  });
  return (
    <Stage ref={svg}>
      {beat <= 2 && <Tables rates={beat === 2 ? [0.4, 0.6] : undefined} />}
      {beat === 3 && <Policy epsilon={epsilon} />}
      {beat === 4 && <Tables rates={[0.4, 0.6]} />}
      <Cap x={1250} y={200} size={23}>
        {beat === 3 ? 'Regla ε-codiciosa' : 'Un acierto paga 1'}
      </Cap>
      {beat === 0 && (
        <>
          <Cap x={1250} y={290} tex="\widehat\mu_A=3/5=0{,}6" color={C.cyan} />
          <Cap x={1250} y={380} tex="\widehat\mu_B=1/5=0{,}2" color={C.magenta} />
          <Cap x={1250} y={470} size={21}>
            Frecuencias de la muestra
          </Cap>
        </>
      )}
      {beat === 1 && answer !== null && (
        <>
          <Cap x={1250} y={290} size={22} color={C.amber}>
            Cinco pruebas pueden engañar.
          </Cap>
          <Cap x={1250} y={380} size={21}>
            La tasa real aún no se conoce.
          </Cap>
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={290} tex="\mu_A=0{,}4" color={C.cyan} />
          <Cap x={1250} y={380} tex="\mu_B=0{,}6" color={C.magenta} />
          <Cap x={1250} y={470} size={21}>
            A parecía mejor; B lo era.
          </Cap>
        </>
      )}
      {beat === 3 && (
        <>
          <Cap x={1250} y={290} tex={`P(B)=\\varepsilon/2=${tnum(epsilon / 2)}`} color={C.amber} />
          <Cap
            x={1250}
            y={380}
            tex={`P(A)=1-\\varepsilon/2=${tnum(1 - epsilon / 2)}`}
            color={C.cyan}
          />
          <line x1={1090} x2={1410} y1={610} y2={610} stroke={C.line} strokeWidth={4} />
          <Knob
            x={1090 + epsilon * 320}
            y={610}
            axis="x"
            onPointerDown={drag}
            label="ε"
            color={C.amber}
          />
          <Cap x={1250} y={700} size={21}>
            ε = {fmt(epsilon)}
          </Cap>
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={290} tex="\mu^*-\mu_A=0{,}2" color={C.amber} />
          <Cap x={1250} y={380} tex="100\cdot0{,}2=20" color={C.green} />
          <Cap x={1250} y={470} size={21}>
            Aciertos esperados que dejas pasar
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Explorar o explotar',
  Scene: ExploreLesson,
  beats: [
    {
      say: 'Cada mesa paga una unidad si aciertas. Sus tasas reales son desconocidas: tras cinco pruebas, A lleva tres aciertos y B lleva uno.',
      board: {
        label: 'Frecuencia observada',
        tex: '\\p{1}{\\widehat\\mu_a}=\\p{2}{\\frac{\\text{aciertos en }a}{\\text{pruebas en }a}}',
      },
    },
    {
      say: '**Explotar** es elegir la mesa con mejor frecuencia observada. Con estos registros elegirías A.',
      ask: {
        prompt: '¿Estos cinco intentos por mesa garantizan que A tiene la mayor tasa real?',
        options: [
          'No; una muestra corta puede engañar',
          'Sí; tres aciertos siempre vencen a uno',
          'Sí; 0,6 es la tasa real de A',
        ],
        answer: 0,
        explain:
          'Las frecuencias describen estas pruebas. No garantizan el orden de las tasas reales; dejar de probar B puede mantener una elección equivocada.',
      },
      board: { label: 'Explotar', tex: '\\p{1}{a}=\\p{2}{\\arg\\max_a\\widehat\\mu_a}' },
    },
    {
      say: 'En este ejemplo, las tasas reales son A: 0,4 y B: 0,6. **Explorar** permite reunir más pruebas de una mesa que al principio parecía peor.',
      board: {
        label: 'Muestra y tasa real',
        tex: '\\widehat\\mu_a\\ne\\mu_a\\ \\text{en general}',
      },
    },
    {
      say: 'La regla **ε-codiciosa** explora con probabilidad ε y explota el resto. Al explorar sortea entre las dos mesas, incluida la favorita actual A.',
      gate: 'Arrastra la perilla hasta ε = 0,2.',
      board: {
        label: 'Exploración uniforme',
        tex: '\\p{1}{P(B)}=\\p{2}{\\frac\\varepsilon2},\\quad\\p{3}{ P(A)}=\\p{4}{1-\\varepsilon+\\frac\\varepsilon2}',
      },
    },
    {
      say: 'El **arrepentimiento** suma lo que dejas de ganar en promedio respecto de la mejor mesa real. Jugar cien veces A cuesta 20 aciertos esperados; el resultado efectivo puede variar.',
      board: {
        label: 'Arrepentimiento esperado',
        tex: '\\p{1}{R_T}=\\p{2}{\\sum_{t=1}^T(\\mu^*-\\mu_{a_t})},\\quad\\p{3}{\\mu^*}=\\p{4}{\\max_a\\mu_a}',
      },
    },
  ],
};

function DeskDemo({ beats, answer }: DemoProps) {
  const { beat } = beats;
  return (
    <Stage>
      <Tables rates={beat === 1 ? [0.4, 0.6] : undefined} />
      <Cap x={1250} y={200} size={24}>
        Registro de la mesa
      </Cap>
      <Cap x={1250} y={290} tex={beat === 0 ? '\\varepsilon=0{,}2' : 'T=100'} />
      <Cap x={1250} y={380} size={21}>
        {beat === 0 ? 'A es la favorita observada.' : 'Las 100 jugadas fueron en A.'}
      </Cap>
      {answer !== null && (
        <Cap
          x={1250}
          y={470}
          tex={beat === 0 ? 'P(B)=0{,}2/2=0{,}1' : 'R=100(0{,}6-0{,}4)=20'}
          color={C.green}
        />
      )}
    </Stage>
  );
}

function ExplorePractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 223 + round);
    const trials = pick(r, [5, 10]);
    const winsA = trials === 5 ? pick(r, [3, 4]) : pick(r, [6, 7, 8]);
    const winsB = trials === 5 ? pick(r, [1, 2]) : pick(r, [2, 3, 4]);
    const epsilon = pick(r, [0.1, 0.2, 0.3, 0.4]);
    const low = pick(r, [0.2, 0.3, 0.4]);
    const high = pick(r, [0.6, 0.7, 0.8]);
    const plays = pick(r, [20, 50, 100]);
    const worse = pick(r, ['A', 'B']);
    return { trials, winsA, winsB, epsilon, low, high, plays, worse };
  }, [seed, round]);
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    api.prompt(
      [
        `A tuvo ${d.winsA} aciertos en ${d.trials} pruebas. ¿Cuál es su frecuencia observada? Escribe un decimal entre 0 y 1.`,
        `A tiene la mayor frecuencia observada. Con ε = ${fmt(d.epsilon)}, exploras uniformemente entre A y B. ¿Qué probabilidad total tiene elegir B? Escribe un decimal.`,
        `La mesa ${d.worse} tiene tasa real ${fmt(d.low)} y la otra ${fmt(d.high)}. Si juegas ${d.plays} veces en ${d.worse}, ¿cuál es el arrepentimiento esperado?`,
      ][round],
      [
        '\\widehat\\mu_A=\\frac{\\text{aciertos}}{\\text{pruebas}}',
        'P(B)=\\varepsilon\\,P(B\\mid\\text{explorar})',
        'R=T(\\mu^*-\\mu_{\\text{elegida}})',
      ][round],
    );
    api.hints(
      [
        [
          'Divide los aciertos por el total de pruebas.',
          'La frecuencia observada va de 0 a 1; no es una garantía de la tasa real.',
        ],
        [
          'B solo se elige en la rama de exploración.',
          'En esa rama cada mesa recibe la mitad de la probabilidad.',
        ],
        [
          'Calcula primero la diferencia entre la mejor tasa y la elegida.',
          'Multiplica esa diferencia por el número de jugadas.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(value);
    if (v === null || !Number.isFinite(v)) return;
    const near = (n: number) => Math.abs(v - n) < 0.00051;
    const target = [d.winsA / d.trials, d.epsilon / 2, d.plays * (d.high - d.low)][round];
    if (near(target))
      return api.result(
        true,
        [
          `Frecuencia observada: $${d.winsA}/${d.trials}=${tnum(target)}$. La tasa real sigue desconocida.`,
          `B recibe la mitad de la exploración: $${tnum(d.epsilon)}/2=${tnum(target)}$. Explorar también puede elegir A.`,
          `Dejas pasar $${d.plays}(${tnum(d.high)}-${tnum(d.low)})=${tnum(target)}$ aciertos esperados.`,
        ][round],
      );
    if (round === 0) {
      if (near(d.winsA))
        return api.result(false, 'Ese es el número de aciertos. Divídelo por el total de pruebas.');
      if (near(1 - target))
        return api.result(
          false,
          'Calculaste la frecuencia de fallos. Usa los aciertos de A en el numerador.',
        );
      if (near(100 * target))
        return api.result(
          false,
          'Escribiste un porcentaje. Ingresa la frecuencia como decimal entre 0 y 1.',
        );
      return api.result(false, 'Usa aciertos de A / pruebas en A; no sumes las pruebas de B.');
    }
    if (round === 1) {
      if (near(d.epsilon))
        return api.result(
          false,
          'ε es la probabilidad de explorar. La mitad de esa rama elige A y la mitad B.',
        );
      if (near(1 - d.epsilon / 2))
        return api.result(
          false,
          'Esa es la probabilidad de A: recibe la explotación y la mitad de la exploración.',
        );
      if (near(0.5))
        return api.result(
          false,
          'Un medio es la probabilidad de B solo dentro de la exploración. Multiplica por ε.',
        );
      return api.result(false, 'B no recibe la rama de explotación. Multiplica ε por 1/2.');
    }
    if (near(d.high - d.low))
      return api.result(
        false,
        'Esa es la pérdida esperada por jugada. Falta multiplicar por el número de jugadas.',
      );
    if (near(d.plays * d.low))
      return api.result(
        false,
        'Calculaste los aciertos esperados de la mesa elegida. El arrepentimiento compara con la mejor.',
      );
    if (near(d.plays * d.high))
      return api.result(
        false,
        'Ese es el rendimiento esperado de la mejor mesa. Resta el de la elegida.',
      );
    return api.result(
      false,
      'Resta tasa mejor menos tasa elegida y multiplica por las jugadas; el arrepentimiento no es negativo.',
    );
  };
  return (
    <Stage>
      {round < 2 ? (
        <Tables wins={[d.winsA, d.winsB]} trials={d.trials} />
      ) : (
        <>
          <rect
            x={180}
            y={230}
            width={740}
            height={350}
            rx={20}
            fill={C.panel}
            stroke={C.line}
            strokeWidth={3}
          />
          <Cap x={550} y={290} size={26}>
            {d.plays} jugadas en {d.worse}
          </Cap>
          <Cap x={550} y={390} size={24}>
            Tasa de {d.worse}: {fmt(d.low)}
          </Cap>
          <Cap x={550} y={490} size={24}>
            Tasa de {d.worse === 'A' ? 'B' : 'A'}: {fmt(d.high)}
          </Cap>
        </>
      )}
      <Cap x={1250} y={200} size={24}>
        {['Contar aciertos', 'Sortear una mesa', 'Medir el costo'][round]}
      </Cap>
      {round === 1 && (
        <Cap x={1250} y={290} tex={`\\varepsilon=${tnum(d.epsilon)}`} color={C.amber} />
      )}
      <NumberField
        x={1080}
        y={470}
        value={value}
        onChange={setValue}
        onEnter={submit}
        label={['frecuencia =', 'P(B) =', 'R ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c7',
  world: 'decision',
  code: '13.7',
  title: 'Explorar o explotar',
  subtitle: 'Bandidos',
  glyph: '\\varepsilon',
  kind: 'level',
  guide: 'valentina',
  teaser: 'Dos mesas, diez pruebas y una posición que nadie quiso revisar antes del cierre.',
  learn:
    'Distinguir frecuencia observada y tasa real, calcular una elección ε-codiciosa y su arrepentimiento esperado.',
  glyphs: ['dec-epsilon-greedy', 'dec-bandit-regret'],
  pitfalls: [
    'Una muestra corta puede invertir el orden de las tasas reales.',
    'Explorar al azar también puede elegir la mesa favorita: la otra recibe ε/2.',
    'El arrepentimiento compara rendimientos esperados; no cuenta los fallos efectivos.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Ocho y dieciocho. El audífono de Valentina crepitaba mientras ponía dos registros de prueba frente al reloj de cierre.',
        },
        {
          who: 'valentina',
          text: 'Tres aciertos en A y uno en B. El operador cargó toda la posición a A y dejó de probar B.',
        },
        { who: 'iris', text: '¿Y le fue bien?' },
        {
          who: 'valentina',
          text: 'Hasta que empezó a perder margen. Tengo cinco pruebas por mesa y ocho minutos para revisar el criterio.',
        },
        {
          who: 'tu',
          text: 'Deja las dos abiertas en pantalla. Con cinco pruebas no me alcanza para descartar B.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El margen de una muestra',
      Scene: DeskDemo,
      beats: [
        {
          say: 'A sigue siendo la favorita observada. El protocolo explora el 20 % de las veces y, al explorar, sortea entre ambas mesas.',
          ask: {
            prompt: 'Con ε = 0,2, ¿qué probabilidad total tiene elegir B?',
            options: ['0,1', '0,2', '0,5'],
            answer: 0,
            explain:
              'B recibe la mitad de la rama de exploración: 0,2 · 1/2 = 0,1. La otra mitad vuelve a elegir A.',
          },
          note: {
            label: 'Protocolo de prueba',
            tex: 'P(B)=0{,}2\\cdot\\tfrac12=0{,}1',
            body: 'El 20 % de exploración no significa cambiar de mesa el 20 % de las veces.',
          },
        },
        {
          say: 'Para evaluar el criterio, ahora conocemos las tasas reales: A acierta con 0,4 y B con 0,6. El registro contiene cien jugadas en A.',
          ask: {
            prompt: '¿Cuántos aciertos esperados se dejaron pasar respecto de jugar siempre B?',
            options: ['20', '40', '60'],
            answer: 0,
            explain:
              'La diferencia por jugada es 0,6 − 0,4 = 0,2. En cien jugadas suma 20; 40 es el rendimiento esperado de A y 60 el de B.',
          },
          note: {
            label: 'Costo de quedarse con A',
            tex: 'R_{100}=100(0{,}6-0{,}4)=20',
            body: 'Es una comparación de promedios, no una pérdida observada de exactamente 20.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Revisar el protocolo', Comp: ExplorePractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Valentina achicó la ventana de pruebas. Detrás apareció una orden con hora de entrada anterior al anuncio sanitario.',
        },
        {
          who: 'valentina',
          text: 'Esta cuenta no hizo pruebas en ninguna mesa. Entró directo, con el veinte por ciento del capital.',
        },
        { who: 'iris', text: '¿Y firmaste el margen?' },
        {
          who: 'valentina',
          text: 'Firmé el cierre. La orden ya estaba puesta cuando abrí el turno.',
        },
        {
          who: 'nar',
          text: 'El reloj pasó a las 20:19. Valentina mantenía el cursor sobre su propia firma.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-epsilon-greedy',
    world: 'decision',
    tex: '\\varepsilon',
    name: 'Exploración ε-codiciosa',
    read: 'épsilon',
    meaning:
      'Probabilidad de explorar al azar; con probabilidad 1 − ε se elige la mejor frecuencia observada.',
    warn: 'Explorar sortea entre todas las mesas, incluida la favorita actual.',
  },
  {
    id: 'dec-bandit-regret',
    world: 'decision',
    tex: 'R_T=\\sum_{t=1}^T(\\mu^*-\\mu_{a_t})',
    name: 'Arrepentimiento esperado',
    read: 'erre sub te',
    meaning: 'Suma de diferencias entre la mejor tasa real y la tasa de cada mesa elegida.',
    warn: 'Usa tasas reales como referencia; no equivale a los fallos observados.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Bandido de dos mesas',
      tex: '\\mu_a=P(\\text{acierto}\\mid a)',
      body: 'Cada elección produce un acierto o un fallo. Las tasas reales son fijas y desconocidas; un acierto paga una unidad.',
    },
    {
      label: 'Frecuencia observada',
      tex: '\\widehat\\mu_a=\\frac{S_a}{N_a}',
      body: 'Sₐ cuenta los aciertos y Nₐ las pruebas en la mesa a, con Nₐ > 0.',
    },
    {
      label: 'Regla ε-codiciosa',
      tex: '0\\le\\varepsilon\\le1',
      body: 'Explota la mejor frecuencia observada con probabilidad 1 − ε; explora uniformemente entre todas las mesas con probabilidad ε. Al reunir datos, actualiza las frecuencias.',
    },
    {
      label: 'Arrepentimiento esperado',
      tex: 'R_T=\\sum_{t=1}^T(\\mu^*-\\mu_{a_t}),\\quad\\mu^*=\\max_a\\mu_a',
    },
  ],
  props: [
    {
      label: 'Dos mesas con favorita única A',
      tex: 'P(A)=1-\\frac\\varepsilon2,\\quad P(B)=\\frac\\varepsilon2',
      body: 'La rama de exploración también puede elegir A. Si hay empate, hace falta definir cómo se resuelve.',
    },
    { label: 'Elegir siempre la peor', tex: 'R_T=T(\\mu^*-\\mu_{\\text{peor}})' },
    {
      label: 'Exploración y horizonte',
      body: 'Probar otras mesas cuesta rendimiento inmediato y puede mejorar elecciones posteriores. Un ε fijo positivo sigue explorando incluso después de identificar la mejor mesa; no garantiza arrepentimiento cero.',
    },
  ],
};

export { lesson };
