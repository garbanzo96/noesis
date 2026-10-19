import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { CueCtx, useCue } from '../../engine/cue';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, rng } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { LogisticMap, Readout, fmt, logisticStep, near, num } from './kit';

const MAP = plane([0, 1], [0, 1.1], { x: 180, y: 180, w: 720, h: 400 });
const SERIES = plane([0, 12], [0, 1], { x: 180, y: 675, w: 720, h: 110 });
export function logisticSeries(seed: number, n = 12, r = 4) {
  const values = [seed];
  for (let i = 0; i < n; i++) values.push(logisticStep(r, values[i]));
  return values;
}
export const PUBLIC = logisticSeries(1 / 5);
export const PRIVATE = logisticSeries(2001 / 10000);
export const GAP10 = Math.abs(PRIVATE[10] - PUBLIC[10]);

/** Table values derive from the recurrence without rounding intermediate states. */
export function CopyTable({ last = 10 }: { last?: number }) {
  return (
    <>
      <rect
        x={175}
        y={185}
        width={730}
        height={550}
        rx={12}
        fill={C.panel}
        stroke={C.muted}
        strokeWidth={2}
      />
      <Cap x={235} y={220} size={20}>
        n
      </Cap>
      <Cap x={405} y={220} size={20} color={C.cyan}>
        Pública xₙ
      </Cap>
      <Cap x={615} y={220} size={20} color={C.amber}>
        Privada zₙ
      </Cap>
      <Cap x={820} y={220} size={20}>
        Distancia
      </Cap>
      {PUBLIC.slice(0, last + 1).map((x, n) => (
        <g key={n}>
          <Cap x={235} y={265 + n * 40} size={19}>
            {n}
          </Cap>
          <Cap x={405} y={265 + n * 40} tex={'\\approx' + num(x, 6)} size={19} color={C.cyan} />
          <Cap
            x={615}
            y={265 + n * 40}
            tex={'\\approx' + num(PRIVATE[n], 6)}
            size={19}
            color={C.amber}
          />
          <Cap
            x={820}
            y={265 + n * 40}
            tex={'\\approx' + num(Math.abs(PRIVATE[n] - x), 6)}
            size={19}
          />
        </g>
      ))}
      <Cap x={540} y={790} size={18}>
        Aproximaciones a seis decimales · sin redondear entre pasos
      </Cap>
    </>
  );
}

function MapLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const cue = useCue();
  const [seedIndex, setSeedIndex] = useState(10);
  const [n, setN] = useState(0);
  const visited = useRef(false);
  const [sameDone, setSameDone] = useState(false);
  const z0 = 0.2 + seedIndex / 10000;
  const onSeed = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - 1070) / 36, 0, 10));
    setSeedIndex(next);
    if (next === 0) {
      visited.current = true;
      setSameDone(true);
    }
    if (next === 1 && visited.current && n === 10) unlock();
  });
  const onCount = useSvgDrag(svg, (px) => {
    const next = Math.round(clamp((px - 1070) / 30, 0, 12));
    setN(next);
    if (visited.current && near(z0, 0.2001, 0.0000005) && next === 10) unlock();
  });
  const beat = beats.beat;
  const count =
    beat === 1
      ? n
      : beat === 2
        ? 1
        : beat === 3
          ? 10
          : beat === 4
            ? 2
            : beat === 0
              ? Math.round((reduced ? 1 : beats.at(0)) * 4)
              : 12;
  const seeds = beat === 4 ? [1 / 4, 3 / 4] : [0.2, beat === 1 ? z0 : 0.2001];
  return (
    <Stage ref={svg}>
      <LogisticMap P={MAP} seriesP={SERIES} r={4} seeds={seeds} n={count} readouts={false} />
      <Cap x={540} y={130}>
        Cada salida vuelve a entrar
      </Cap>
      <Cap x={540} y={635} size={18}>
        Series por actualización · sin equivalencia horaria
      </Cap>
      {beat === 1 ? (
        <>
          <Cap x={1250} y={200} tex={'z_0=' + num(z0, 4)} color={C.amber} />
          <Line a={[1070, 300]} b={[1430, 300]} width={4} />
          <Knob x={1070 + seedIndex * 36} y={300} axis="x" onPointerDown={onSeed} color={C.amber} />
          <Readout x={1250} y={370} size={18}>
            0,2000 → 0,2010 · marcas de 0,0001
          </Readout>
          <Cap x={1250} y={470} tex={'n=' + n} />
          <Line a={[1070, 570]} b={[1430, 570]} width={4} />
          <CueCtx.Provider value={{ ...cue, active: false }}>
            <Knob x={1070 + n * 30} y={570} axis="x" onPointerDown={onCount} color={C.cyan} />
          </CueCtx.Provider>
          <Cap x={1370} y={630} tex="10" color={C.green} />
          <Readout x={1250} y={710} size={18}>
            {sameDone ? 'Ahora deja z₀ = 0,2001 y arrastra n a 10.' : 'Primero visita z₀ = 0,2000.'}
          </Readout>
          <Cap
            x={1250}
            y={800}
            tex={'d_n\\approx' + num(Math.abs(logisticSeries(z0)[n] - PUBLIC[n]), 6)}
            size={20}
          />
        </>
      ) : (
        <>
          <Cap
            x={1250}
            y={210}
            tex={beat === 0 ? 'n:\\text{ actualización}' : 'x_{n+1}=4x_n(1-x_n)'}
          />
          <Cap
            x={1250}
            y={310}
            tex={beat === 4 ? '\\frac14\\to\\frac34\\to\\frac34' : 'x_0=0{,}2;\\quad z_0=0{,}2001'}
          />
          <Readout x={1250} y={425} size={19}>
            {beat === 2
              ? 'Una regla determinista: la salida fija la próxima entrada.'
              : beat === 4
                ? 'Inicios excepcionales: 3/4 queda fijo. Una separación aislada no demuestra caos.'
                : 'r = 4: parámetro del mapa discreto; distinto de la tasa logística continua.'}
          </Readout>
          {(beat !== 3 || answer !== null) && (
            <Cap x={1250} y={550} tex={'d_{10}\\approx' + num(GAP10, 6)} color={C.magenta} />
          )}
          <Readout x={1250} y={675} size={19}>
            {beat === 5
              ? 'La distancia baja en los pasos 6 y 9. Más cifras ayudan; todavía hay que medir y revisar.'
              : 'Ambos índices permanecen entre 0 y 1.'}
          </Readout>
          {beat === 4 && (
            <>
              {[0.15, 0.25, 0.5, 0.75, 0.85].map((x) => (
                <Arrow
                  key={x}
                  from={MAP.pt(x, 0.02)}
                  to={MAP.pt(x, 0.02 + (logisticStep(4, x) - 0.02) * (reduced ? 1 : beats.at(4)))}
                  color={C.magenta}
                  width={3}
                />
              ))}
              <polyline
                points={Array.from({ length: 81 }, (_, i) => {
                  const x = 0.15 + (0.7 * i) / 80;
                  return MAP.pt(
                    x,
                    0.02 + (logisticStep(4, x) - 0.02) * (reduced ? 1 : beats.at(4)),
                  ).join(',');
                }).join(' ')}
                fill="none"
                stroke={C.magenta}
                strokeWidth={8}
              />
            </>
          )}
        </>
      )}
    </Stage>
  );
}

export const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Sensibilidad inicial y caos',
  Scene: MapLesson,
  beats: [
    {
      say: 'La ficha entra a la máquina, cambia de nivel y vuelve a entrar. Ahora actualizamos por turnos; todos los niveles quedan entre 0 y 1.',
      dur: 4,
      board: {
        label: 'Reloj discreto',
        tex: '\\p{1}{\\cC{n}}:\\ \\p{2}{\\text{número de actualización}}', parts: ['reloj por turnos', 'cantidad de pasos dados'],
      },
    },
    {
      say: 'Cambia una cifra al inicio y compara después del mismo número de turnos.',
      gate: 'Visita z₀ = 0,2000; después deja z₀ = 0,2001 y arrastra el contador hasta n = 10.',
      board: { label: 'Diferencia inicial', tex: '\\p{1}{|z_0-x_0|}=\\p{2}{\\cA{0{,}0001}}', parts: ['distancia entre los inicios', 'cambio de una cifra'] },
    },
    {
      say: 'Sigue un paso por la parábola y vuelve por la diagonal. La regla es determinista: un inicio exacto fija cada paso; su precisión limita lo que puedes anticipar.',
      dur: 4,
      board: [
        {
          label: 'Mapa logístico discreto',
          tex: '\\p{1}{x_{n+1}}=\\p{2}{\\cC{r}x_n(1-x_n)};\\quad\\p{3}{r=4}', parts: ['nivel del próximo turno', 'regla de actualización', 'parámetro del caso'],
        },
        { label: 'Primer paso', tex: '\\p{1}{x_1}=\\p{2}{4(0{,}2)(0{,}8)}=\\p{3}{0{,}64}', parts: ['nivel del primer turno', 'con los datos del caso', 'nivel tras un paso'] },
      ],
    },
    {
      say: 'Las series se separan sin salir del intervalo. Ambas se ejecutaron con el mismo parámetro y la misma regla.',
      ask: {
        prompt: '¿Qué produjo la diferencia de estas dos ejecuciones?',
        options: [
          'Una regla distinta en cada paso',
          'Un cambio pequeño en el estado inicial',
          'Un crecimiento ilimitado de ambos índices',
        ],
        answer: 1,
        explain:
          'Solo cambió el estado inicial. En n = 10 la distancia es aproximadamente 0,101341; ambos índices siguen acotados.',
      },
      board: { label: 'Comparar en la misma lectura', tex: '\\p{1}{\\cM{d_n}}=\\p{2}{|z_n-x_n|}', parts: ['distancia entre las series', 'diferencia al mismo turno'] },
    },
    {
      say: 'El mapa estira y pliega los inicios. Esta pareja ilustra sensibilidad en el régimen caótico r = 4; una separación aislada también puede ocurrir sin caos, y hay inicios excepcionales.',
      dur: 5,
      board: [
        { label: 'Estiramiento y plegado', tex: '\\p{1}{4x(1-x)}=\\p{2}{1-(2x-1)^2}', parts: ['regla de actualización', 'forma que muestra el pliegue'] },
        {
          label: 'Inicio excepcional',
          tex: '\\p{1}{\\frac14}\\longrightarrow\\p{2}{\\frac34}\\longrightarrow\\p{3}{\\frac34}', parts: ['nivel al inicio', 'nivel tras un paso', 'nivel que se repite'],
        },
      ],
    },
    {
      say: 'La distancia no aumenta en todos los pasos. Conservar más cifras mejora el inicio; todavía necesitas medir y revisar el pronóstico.',
      dur: 4,
      board: [
        {
          label: 'Inicios cercanos',
          tex: '\\p{1}{\\text{misma regla}}+\\p{2}{\\text{inicios cercanos}}', parts: ['regla compartida', 'pequeña diferencia inicial'],
        },
        {
          label: 'Límite del pronóstico',
          tex: '\\p{1}{\\Rightarrow}\\p{2}{\\text{recorridos que pueden separarse}}', parts: ['consecuencia del cambio', 'posible separación futura'],
        },
      ],
    },
  ],
};

function ReservedDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <CopyTable />
      <Cap x={1250} y={200} tex="r=4;\quad n=10" />
      <Readout x={1250} y={290} size={19}>
        Alarma: índice mayor que 0,2 en la lectura 10.
      </Readout>
      <Readout x={1250} y={420} size={19}>
        17 de agosto, 00:00: copia privada. 00:10: recibo de Halcón.
      </Readout>
      <Readout x={1250} y={550} size={19}>
        18 de agosto, 02:10: vacunas recibidas. 02:40: llegan a la Clínica.
      </Readout>
      {answer !== null && (
        <Readout x={1250} y={700} size={19} color={C.green}>
          {beats.beat === 0
            ? 'Solo la copia privada supera 0,2 en n = 10.'
            : 'El recibo prueba acceso previo. El mapa no convierte iteraciones en horas.'}
        </Readout>
      )}
    </Stage>
  );
}

function MapPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const random = rng(seed * 151 + round);
    const r = pick(random, [2, 4]),
      x = pick(random, [1 / 4, 1 / 2, 3 / 4]);
    const start = pick(random, [1 / 8, 1 / 2, 7 / 8]),
      denominator = pick(random, [10000, 5000]);
    return { r, x, start, denominator, epsilon: 1 / denominator };
  }, [seed, round]);
  const [value, setValue] = useState('');
  const [choice, setChoice] = useState<number | null>(null),
    [claim, setClaim] = useState<number | null>(null);
  useEffect(() => {
    setValue('');
    setChoice(null);
    setClaim(null);
    api.prompt(
      round === 0
        ? 'Con r = ' + d.r + ' y x₀ = ' + fmt(d.x) + ', calcula x₁.'
        : round === 1
          ? 'Con r = 4 y x₀ = ' + fmt(d.start, 3) + ', calcula x₂ reutilizando la primera salida.'
          : 'Con r = 4, x₀ = 1/4 y z₀ = 1/4 + ε, donde ε = 1/' +
            d.denominator +
            ', elige la separación exacta tras un paso y qué permite concluir.',
      'x_{n+1}=rx_n(1-x_n)',
    );
    api.hints(
      round === 0
        ? [
            'Multiplica por el complemento 1 − x₀.',
            'Es una actualización discreta, no una ecuación diferencial.',
          ]
        : round === 1
          ? ['Calcula x₁ y úsalo como la nueva entrada.', 'El segundo paso no vuelve a usar x₀.']
          : [
              'Expande 4(1/4 + ε)(3/4 − ε) y resta 3/4.',
              'Una separación aislada no alcanza para demostrar caos.',
            ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    if (round < 2) {
      const v = parseNum(value);
      if (v === null) return;
      const x1 = logisticStep(round === 0 ? d.r : 4, round === 0 ? d.x : d.start);
      const target = round === 0 ? x1 : logisticStep(4, x1);
      if (near(v, target))
        return api.result(
          true,
          '$x_' + (round + 1) + '=' + num(target, 6) + '$. Cada salida alimenta el paso siguiente.',
        );
      return api.result(
        false,
        round === 0
          ? near(v, d.r * d.x)
            ? 'Omitiste el complemento: falta multiplicar por (1 − x₀).'
            : 'Multiplica r por x₀ y por (1 − x₀); no uses una tasa continua.'
          : near(v, x1)
            ? 'Repetiste el inicio o te quedaste en x₁. Usa esa salida como entrada para calcular x₂.'
            : 'Calcula primero x₁ = 4x₀(1 − x₀); después x₂ = 4x₁(1 − x₁).',
      );
    }
    if (choice === null || claim === null) return;
    if (choice !== 0)
      return api.result(
        false,
        choice === 1
          ? 'La diferencia no se conserva: el mapa depende del estado de entrada.'
          : 'Multiplicar ε por r ignora el complemento dependiente del estado. Expande los dos factores.',
      );
    if (claim !== 1)
      return api.result(
        false,
        claim === 0
          ? 'Una separación aislada también puede ocurrir sin caos. Hay que estudiar la dinámica.'
          : 'Compartir la regla permite salidas distintas si los inicios difieren.',
      );
    api.result(
      true,
      '$d_1=2\\varepsilon-4\\varepsilon^2=' +
        num(2 * d.epsilon - 4 * d.epsilon ** 2, 8) +
        '$. Hace falta estudiar la dinámica.',
    );
  };
  return (
    <Stage>
      <LogisticMap
        P={MAP}
        seriesP={SERIES}
        r={round === 0 ? d.r : 4}
        seeds={[round === 0 ? d.x : round === 1 ? d.start : 1 / 4]}
        n={0}
        readouts={false}
      />
      <Cap
        x={1250}
        y={175}
        tex={
          round === 2
            ? '\\varepsilon=\\frac1{' + d.denominator + '}'
            : 'x_0=' + num(round === 0 ? d.x : d.start, 3)
        }
      />
      {round < 2 ? (
        <NumberField
          x={1060}
          y={400}
          label={round === 0 ? 'x₁ =' : 'x₂ ='}
          value={value}
          onChange={setValue}
          onEnter={submit}
        />
      ) : (
        <>
          {['2\\varepsilon-4\\varepsilon^2', '\\varepsilon', '4\\varepsilon'].map((s, i) => (
            <Choices
              key={s}
              x={1250}
              y={285 + i * 80}
              options={[i]}
              value={choice}
              onPick={setChoice}
              render={() => <Tex tex={s} />}
            />
          ))}
          {[
            'Una separación aislada demuestra caos',
            'Hace falta estudiar la dinámica',
            'La regla tuvo que cambiar',
          ].map((s, i) => (
            <Choices
              key={s}
              x={1250}
              y={560 + i * 80}
              options={[i]}
              value={claim}
              onPick={setClaim}
              render={() => <span style={{ fontSize: 'calc(var(--su) * 17)' }}>{s}</span>}
            />
          ))}
        </>
      )}
      <Confirm
        onClick={submit}
        disabled={round < 2 ? parseNum(value) === null : choice === null || claim === null}
      />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w9-c8',
  world: 'dynamics',
  code: '9.8',
  title: 'La cifra que cortaron',
  subtitle: 'Sensibilidad inicial y caos',
  glyph: 'x_{n+1}=rx_n(1-x_n)',
  kind: 'level',
  guide: 'elena',
  teaser:
    'Dos copias usan la misma regla, pero una recortó cifras del inicio. El recibo de la copia precisa enlaza el pronóstico con la entrega.',
  learn:
    'Iterar el mapa logístico, medir sensibilidad inicial y distinguir límites del cálculo de evidencia documental.',
  glyphs: ['dy-map', 'dy-sensitivity'],
  pitfalls: [
    'El parámetro del mapa discreto es distinto de la tasa logística continua.',
    'Cada salida se reutiliza en el siguiente paso.',
    'Una separación aislada no demuestra caos ni prueba quién accedió al pronóstico.',
    'Conservar más cifras no asegura conocimiento perfecto del futuro.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: '18 de agosto, 03:30. El café de Teo dejó una marca seca junto al teclado; las copias parecen iguales en la pantalla.',
        },
        { who: 'teo', text: 'Se ven iguales si escondo las últimas cifras.' },
        { who: 'tu', text: 'Déjalas a la vista. Corre el mismo número de pasos.' },
        { who: 'iris', text: 'Y guarda quién eligió esconderlas.' },
        {
          who: 'nar',
          text: 'Al ampliar la cabecera aparece un recibo que la vista pública había dejado fuera.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'La copia reservada',
      Scene: ReservedDemo,
      beats: [
        {
          say: 'El banco usa r = 4. El original conserva z₀ = 0,2001 y la copia pública usa x₀ = 0,2. Lee la alarma solo en n = 10.',
          ask: {
            prompt: '¿Qué copia activa la alarma de diagnóstico en n = 10?',
            options: [
              'La pública, con aproximadamente 0,147837',
              'Ninguna',
              'La privada, con aproximadamente 0,249178',
            ],
            answer: 2,
            explain:
              'Solo la privada supera 0,2 en esa lectura. La pregunta no pide si cruzaron esa marca en pasos anteriores.',
          },
          note: {
            label: 'Cifras de las dos copias',
            tex: 'x_0=\\frac15;\\quad z_0=\\frac{2001}{10000}',
            body: 'En n = 10, x₁₀ < 0,2 < z₁₀; la distancia es aproximadamente 0,101341.',
          },
        },
        {
          say: 'El paquete de las 00:00 del 17 incluía el canal R y la ventana prevista. El recibo de las 00:10 lo enlaza al mensaje; el parte y la guía registran el traslado efectivo del 18.',
          ask: {
            prompt:
              '¿Qué permite afirmar que Halcón recibió información de la ventana antes de la entrega?',
            options: [
              'El recibo firmado enlazado al pronóstico y al mensaje',
              'Solo que las dos curvas se separaron',
              'Que un sistema caótico predice siempre la hora exacta',
            ],
            answer: 0,
            explain:
              'La sensibilidad explica el límite del cálculo público. La copia y el recibo documentan el acceso temprano; el parte y la guía confirman Observatorio 02:10 y Clínica 02:40.',
          },
          note: {
            label: 'Recepción dentro de la ventana',
            tex: '02{:}00<02{:}10<02{:}30',
            body: '18 de agosto: salida inmediata desde el Observatorio y recepción en la Clínica del Cerro a las 02:40. Las iteraciones del mapa no equivalen a horas.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Seguir las cifras', Comp: MapPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'La guía raspa la mesa al desplegarse. Elena reconoce el sello de la Clínica del Cerro y demora en soltar el borde.',
        },
        {
          who: 'elena',
          text: 'Dejaron la caja acá y la retiraron al tiro. Mi compañera creía que era una entrega de repuestos.',
        },
        { who: 'iris', text: 'El recibo dice vacunas.' },
        { who: 'teo', text: '¡La firma ya estaba en las fichas que Ana guardó en el Archivo!' },
        {
          who: 'nar',
          text: 'Elena deja la guía sobre las fichas: la misma firma une ambas hojas.',
        },
      ],
    },
  ],
};
export const glyphs: Glyph[] = [
  {
    id: 'dy-map',
    world: 'dynamics',
    tex: 'x_{n+1}=rx_n(1-x_n)',
    name: 'Mapa logístico',
    read: 'equis siguiente igual a erre por equis por uno menos equis',
    meaning:
      'Regla discreta que reutiliza cada salida como entrada. Para r = 4 conserva el intervalo [0; 1].',
  },
  {
    id: 'dy-sensitivity',
    world: 'dynamics',
    tex: 'd_n=|z_n-x_n|',
    name: 'Sensibilidad inicial',
    read: 'distancia en ene igual al valor absoluto de zeta menos equis',
    meaning: 'Inicios muy cercanos pueden producir recorridos separados bajo la misma regla.',
    warn: 'Una separación aislada no basta para demostrar caos; tampoco prueba acceso o autoría.',
  },
];
