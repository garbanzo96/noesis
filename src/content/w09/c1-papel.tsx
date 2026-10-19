import { Readout } from './kit';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Choices, Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { DirectionField, SolutionTrace, fmt, near, num, polynomial } from './kit';

const P = plane([0, 2.2], [0, 8], { x: 180, y: 190, w: 720, h: 480 });
const f = (t: number) => 2 * t;
function PaperLesson({ beats, unlock, reduced, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [time, setTime] = useState(0),
    [slope, setSlope] = useState(0);
  const { beat, at } = beats;
  const check = (t: number, m: number) => {
    if (beat === 1 && near(t, 1, 0.02) && near(m, 2, 0.05)) unlock();
  };
  const onTime = useSvgDrag(svg, (px) => {
    const t = Math.round(clamp((px - 180) / 360, 0, 2) * 100) / 100;
    setTime(t);
    check(t, slope);
  });
  const onSlope = useSvgDrag(svg, (px) => {
    const m = Math.round(clamp((px - 1070) / 90, 0, 4) * 100) / 100;
    setSlope(m);
    check(time, m);
  });
  const t = beat === 1 ? time : beat === 4 ? 2 : reduced ? 2 : 2 * at(beat);
  const initial = beat === 5 ? 3 : 1,
    y = initial + t * t;
  return (
    <Stage ref={svg}>
      {beat === 0 ? (
        <>
          <rect
            x={210}
            y={205}
            width={220}
            height={460}
            rx={12}
            fill={C.panel}
            stroke={C.muted}
            strokeWidth={5}
          />
          <rect
            x={219}
            y={665 - y * 80}
            width={202}
            height={y * 80 - 9}
            fill={C.cyan}
            fillOpacity={0.3}
          />
          <Line a={[219, 665 - y * 80]} b={[421, 665 - y * 80]} color={C.cyan} width={4} />
          <Cap x={320} y={730} size={20}>
            Depósito de demostración
          </Cap>
          <Arrow from={[530, 620]} to={[860, 620]} color={C.amber} />
          <Dot x={530 + t * 165} y={620} color={C.amber} />
          <Cap x={700} y={710}>
            Reloj en minutos
          </Cap>
        </>
      ) : (
        <>
          <Axes P={P} xTicks={[0, 1, 2]} yTicks={[2, 4, 6]} xLabel="t" yLabel="y" grid />
          {beat >= 2 && (
            <DirectionField P={P} f={f} times={[0.2, 0.6, 1, 1.4, 1.8, 2]} levels={[1, 3, 5, 7]} />
          )}
          <SolutionTrace
            P={P}
            solution={(u) => 1 + u * u}
            t0={0}
            t1={2}
            cursor={beat === 1 ? undefined : t}
            slope={f}
            progress={beat === 3 && !reduced ? at(3) : 1}
          />
          {beat === 5 && (
            <SolutionTrace
              P={P}
              solution={(u) => 3 + u * u}
              t0={0}
              t1={2}
              cursor={t}
              slope={f}
              color={C.magenta}
            />
          )}
          {beat === 1 && (
            <>
              <Dot x={P.x(t)} y={P.y(1 + t * t)} color={C.cyan} />
              <Arrow
                from={P.pt(t, 1 + t * t)}
                to={P.pt(t + 0.24, 1 + t * t + 0.24 * slope)}
                color={C.amber}
                width={5}
              />
              <Line a={[180, 760]} b={[900, 760]} color={C.dim} width={4} />
              {[0, 1, 2].map((u) => (
                <Cap key={u} x={180 + 360 * u} y={810} tex={String(u)} />
              ))}
              <Knob x={180 + t * 360} y={760} onPointerDown={onTime} axis="x" color={C.cyan} />
              <Line a={[1070, 465]} b={[1430, 465]} width={4} />
              {[0, 2, 4].map((m) => (
                <Cap key={m} x={1070 + 90 * m} y={520} tex={String(m)} size={18} />
              ))}
              <Knob
                x={1070 + slope * 90}
                y={465}
                onPointerDown={onSlope}
                axis="x"
                color={C.amber}
              />
              <Readout x={1250} y={600} size={19}>
                Pon t en 1 y la pendiente en 2.
              </Readout>
            </>
          )}
        </>
      )}
      <Cap x={1250} y={200} tex={`t\\approx${num(t)}\\,\\mathrm{min}`} color={C.amber} />
      <Cap
        x={1250}
        y={280}
        tex={`y\\approx${num(y)}\\,\\mathrm{cm}`}
        color={beat === 5 ? C.magenta : C.cyan}
      />
      {beat === 1 && (
        <Cap x={1250} y={360} tex={`m=${num(slope)}\\,\\mathrm{cm/min}`} color={C.amber} />
      )}
      {beat >= 2 && (beat !== 4 || answer !== null) && (
        <Cap x={1250} y={360} tex={`y'\\approx${num(f(t))}\\,\\mathrm{cm/min}`} color={C.amber} />
      )}
      {beat >= 3 && beat !== 4 && <Cap x={1250} y={460} tex={`y(0)=${initial}\\,\\mathrm{cm}`} />}
    </Stage>
  );
}
const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Pendiente, solución y valor inicial',
  intro: {
    question: '¿Cómo se describe algo cuando solo conocemos la regla de su cambio?',
    text: 'Empiezan las ecuaciones diferenciales y los sistemas dinámicos. Una ecuación diferencial da la pendiente en cada estado, y una solución es una curva que sigue esas pendientes desde un valor inicial. El papel del registrador guarda una subida que el boletín público dejó horizontal.',
  },
  Scene: PaperLesson,
  beats: [
    {
      say: 'La altura y la rapidez de subida son datos distintos. Mira cómo el nivel gana altura cada vez más rápido.',
      dur: 4,
      board: {
        label: 'Unidades del depósito',
        tex: '\\p{1}{\\cA{t}:\\text{ minutos}},\\quad\\p{2}{\\cC{y}:\\text{ cm}}',
        parts: ['tiempo transcurrido', 'altura del nivel'],
      },
    },
    {
      say: 'Inclina la flecha hasta que acompañe el trazo. Mover la punta cambia la pendiente elegida; el nivel sigue en la curva.',
      gate: 'Arrastra el reloj inferior a t = 1 y la perilla derecha a pendiente 2.',
      board: {
        label: 'Pendiente local',
        tex: '\\p{1}{\\text{pendiente en }t=1:}\\ \\p{2}{\\cA{2}}',
        parts: ['rapidez que buscamos', 'subida por minuto'],
      },
    },
    {
      say: 'Una **ecuación diferencial** da la pendiente que debe tener la solución en cada lugar. En este campo, todas las flechas de una columna tienen la misma inclinación.',
      dur: 3,
      board: [
        {
          label: 'Regla de pendientes',
          tex: "\\p{1}{\\cC{y'}}=\\p{2}{f(t,y)}",
          parts: ['rapidez de cambio', 'regla de pendientes'],
        },
        {
          label: 'Campo del depósito',
          tex: '\\p{1}{f(t,y)}=\\p{2}{\\cA{2t}}',
          parts: ['pendiente del campo', 'doble del tiempo'],
        },
      ],
    },
    {
      say: 'El **valor inicial** elige por dónde parte la curva. La tangente de esta solución sigue las flechas del campo.',
      dur: 4,
      board: [
        {
          label: 'Solución del depósito',
          tex: '\\p{1}{\\cC{y(t)}}=\\p{2}{1+t^2}',
          parts: ['altura del nivel', 'curva del depósito'],
        },
        {
          label: 'Comprobar inicio y pendiente',
          tex: "\\p{1}{y(0)=1},\\quad\\p{2}{y'=2t}",
          parts: ['altura al inicio', 'rapidez de subida'],
        },
      ],
    },
    {
      say: 'Lee la flecha y el indicador de altura por separado.',
      ask: {
        prompt: 'En $t=2$, ¿qué indica la flecha?',
        options: [
          'Que el nivel vale 4 cm',
          'Que el nivel sube a 4 cm/min',
          'Que el nivel subió 2 cm en total',
        ],
        answer: 1,
        explain:
          "$y'(2)=2\\cdot2=4$ cm/min; $y(2)=1+2^2=5$ cm. La flecha indica rapidez de cambio.",
      },
      board: {
        label: 'Nivel y pendiente',
        tex: "\\p{1}{\\cC{y(2)}};\\quad\\p{2}{\\cA{y'(2)}}",
        body: 'Uno se mide en cm; la otra, en cm/min.',
        parts: ['altura a dos minutos', 'rapidez a dos minutos'],
      },
    },
    {
      say: 'Cambiar el inicio a 3 cm desplaza la curva sin cambiar las flechas. Las dos curvas cumplen la misma regla de pendientes.',
      dur: 4,
      board: {
        label: 'Familia de soluciones',
        tex: '\\p{1}{y(t)=\\cM{C}+t^2};\\quad\\p{2}{y(0)=\\cM{C}}',
        parts: ['curvas con distintos inicios', 'altura al inicio'],
      },
    },
  ],
};
function PaperDemo({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [time, setTime] = useState(0),
    [initial, setInitial] = useState(0);
  const { beat } = beats;
  const drag = useSvgDrag(svg, (px, py) => {
    if (beat === 0) {
      const t = Math.round(clamp(((px - P.x(0)) / (P.x(2) - P.x(0))) * 2, 0, 2) * 100) / 100;
      setTime(near(t, 1, 0.03) ? 1 : t);
      if (near(t, 1, 0.03)) unlock();
    } else if (beat === 2) {
      const h = Math.round(clamp(((P.y(0) - py) / (P.y(0) - P.y(4))) * 4, 0, 4) * 100) / 100;
      setInitial(near(h, 3, 0.08) ? 3 : h);
      if (near(h, 3, 0.08)) unlock();
    }
  });
  const t = beat === 0 ? time : 1,
    h0 = beat === 2 ? initial : 3,
    h = h0 + t * t;
  return (
    <Stage ref={svg}>
      <Axes P={P} xTicks={[0, 1, 2]} yTicks={[2, 4, 6]} xLabel="t" yLabel="H" grid />
      <SolutionTrace P={P} solution={(t) => h0 + t * t} t0={0} t1={2} />
      <Dot x={P.x(t)} y={P.y(h)} color={C.cyan} />
      <Line a={P.pt(0.7, 4)} b={P.pt(1.3, 4)} color={C.magenta} dashed width={4} />
      <Arrow
        from={P.pt(t - 0.3, h - 0.3 * f(t))}
        to={P.pt(t + 0.3, h + 0.3 * f(t))}
        color={C.amber}
        width={4}
      />
      {beat === 0 && <Knob x={P.x(t)} y={P.y(h)} onPointerDown={drag} axis="x" />}
      {beat === 2 && (
        <>
          <DirectionField P={P} f={f} times={[0.2, 0.6, 1, 1.4, 1.8, 2]} levels={[1, 3, 5, 7]} />
          <Dot x={P.x(0)} y={P.y(3)} color={C.green} />
          <Knob x={P.x(0)} y={P.y(h0)} onPointerDown={drag} axis="y" />
        </>
      )}
      <Cap x={540} y={755} size={20}>
        t = 0: 01:00 del 18 de agosto · minutos
      </Cap>
      <Cap x={1250} y={210} tex={`H(0)=${num(h0)}\\,\\mathrm{cm}`} />
      <Cap x={1250} y={290} tex={`H(${num(t)})=${num(h)}\\,\\mathrm{cm}`} color={C.cyan} />
      <Cap x={1250} y={370} tex="m_{\mathrm{boletín}}=0" color={C.magenta} />
      <Cap x={1250} y={460} tex={`H'(${num(t)})=${num(f(t))}\\,\\mathrm{cm/min}`} color={C.amber} />
      {beat === 3 && answer !== null && <Cap x={1250} y={550} tex="H(t)=3+t^2" color={C.green} />}
      <Readout x={1250} y={650} size={19}>
        Cabecera: entrada auxiliar
      </Readout>
    </Stage>
  );
}
function PaperPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 109 + round),
      a = randInt(r, 1, 3),
      b = randInt(r, 0, 2),
      t = pick(r, [1, 2]);
    const initial = round === 1 ? pick(r, [2, 3]) : pick(r, [1, 2, 3]);
    return {
      a,
      b,
      t,
      initial,
      rate: a * t + b,
      equation: polynomial([
        [a, 't'],
        [b, ''],
      ]),
      options: shuffle(r, [0, 1, 2]),
    };
  }, [seed, round]);
  const [value, setValue] = useState(''),
    [choice, setChoice] = useState<number | null>(null);
  useEffect(() => {
    setValue('');
    setChoice(null);
    api.prompt(
      round === 0
        ? `Para $y'=${d.equation}$ en $t=${d.t}$ min, el punto marcado tiene nivel ${d.rate + 1} cm. Calcula la pendiente en cm/min.`
        : round === 1
          ? `Para $y'=2t$ y $y(0)=${d.initial}$ cm, calcula $y(${d.t})$ en cm.`
          : `Elige la curva que cumple $y'=2t$ y $y(0)=${d.initial}$.`,
    );
    api.hints(
      round === 0
        ? [
            'Evalúa la regla de pendientes en el tiempo marcado.',
            'El nivel del punto y su rapidez de subida son datos distintos.',
          ]
        : ['La curva debe tener derivada 2t.', 'La constante se fija evaluando la curva en t = 0.'],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const options = [`${d.initial}+t^2`, `${d.initial}+2t`, 't^2'];
  const submit = () => {
    if (round === 2) {
      if (choice === null) return;
      return api.result(
        choice === 0,
        choice === 0
          ? `$(${options[0]})'=2t$ y su inicio vale ${d.initial}.`
          : choice === 1
            ? 'Conservaste el inicio, pero esa recta tiene pendiente 2 constante. Necesitas pendiente 2t.'
            : 'Cumples la regla de pendientes, pero esa curva parte en 0. Falta el valor inicial.',
      );
    }
    const v = parseNum(value);
    if (v === null) return;
    const target = round === 0 ? d.rate : d.initial + d.t ** 2;
    if (near(v, target))
      return api.result(
        true,
        round === 0
          ? `Pendiente: $${d.a}\\cdot${d.t}+${d.b}=${target}$ cm/min.`
          : `$y(${d.t})=${d.initial}+${d.t}^2=${target}$ cm.`,
      );
    if (round === 0 && near(v, d.rate + 1))
      return api.result(
        false,
        'Respondiste el nivel marcado. La pendiente se obtiene de la regla de cambio, en cm/min.',
      );
    if (round === 1 && near(v, 2 * d.t))
      return api.result(
        false,
        'Calculaste la pendiente 2t. Esta ronda pide la altura de la curva, incluido su inicio.',
      );
    if (round === 1 && near(v, d.t ** 2))
      return api.result(false, 'Falta sumar el nivel inicial. La curva parte sobre cero.');
    api.result(
      false,
      round === 0
        ? `Reemplaza t por ${d.t} en la regla; multiplica antes de sumar.`
        : 'Usa y(t) = C + t²: conserva C y eleva el tiempo al cuadrado.',
    );
  };
  const marked = d.rate + 1;
  const Q = plane([0, 2.2], [0, 10], { x: 180, y: 190, w: 720, h: 480 });
  return (
    <Stage>
      <Axes P={Q} xTicks={[0, 1, 2]} yTicks={[2, 4, 6, 8]} xLabel="t" yLabel="y" grid />
      {round === 0 ? (
        <Dot x={Q.x(d.t)} y={Q.y(marked)} color={C.amber} />
      ) : (
        <SolutionTrace P={Q} solution={(t) => d.initial + t * t} t0={0} t1={2} />
      )}
      <Cap x={1250} y={210} tex={round === 0 ? `y'=${d.equation}` : "y'=2t"} />
      <Cap
        x={1250}
        y={300}
        tex={round === 0 ? `t=${d.t};\\quad y=${marked}\\,\\mathrm{cm}` : `y(0)=${d.initial}`}
        color={C.amber}
      />
      {round === 2 ? (
        d.options.map((o, i) => (
          <Choices
            key={o}
            x={1250}
            y={420 + 95 * i}
            options={[o]}
            value={choice}
            onPick={setChoice}
            render={(k) => <Tex tex={`y=${options[k]}`} />}
          />
        ))
      ) : (
        <NumberField
          x={1060}
          y={450}
          label={round === 0 ? 'pendiente =' : `y(${d.t}) =`}
          unit={round === 0 ? 'cm/min' : 'cm'}
          value={value}
          onChange={setValue}
          onEnter={submit}
        />
      )}
      <Cap x={540} y={755} size={19}>
        Depósito de práctica · tiempo en minutos
      </Cap>
      <Confirm
        onClick={submit}
        disabled={round === 2 ? choice === null : parseNum(value) === null}
      />
    </Stage>
  );
}
export const level: LevelSpec = {
  id: 'w9-c1',
  world: 'dynamics',
  code: '9.1',
  title: 'El papel mojado',
  subtitle: 'Ecuaciones diferenciales y campo de direcciones',
  glyph: "y'=f(t,y)",
  kind: 'level',
  guide: 'elena',
  teaser:
    'El registrador conserva una subida que el boletín dejó horizontal. Elena necesita salvar el rollo antes de que lo sobrescriban.',
  learn:
    'Distinguir nivel y pendiente, leer un campo de direcciones y comprobar una solución con su valor inicial.',
  glyphs: ['dy-equation', 'dy-initial'],
  pitfalls: [
    'La flecha indica pendiente, con unidades de nivel por tiempo.',
    'Cumplir la ecuación y cumplir el inicio son condiciones distintas.',
    'Un nivel de 4 cm no implica una pendiente de 4 cm/min.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Observatorio, madrugada del 18 de agosto, dos y veinte. El papel húmedo raspaba al salir del tambor, y Elena sujetó el rollo antes de que Iris tirara de él.',
        },
        {
          who: 'elena',
          text: 'Mira la subida del trazo. En la pantalla, la aguja quedó horizontal.',
        },
        {
          who: 'iris',
          text: '¿Y el boletín salió con lo que dice la pantalla o con lo que dice el papel?',
        },
        { who: 'tu', text: 'Guardemos el papel antes de tocar la consola.' },
        { who: 'nar', text: 'El botón de sobrescritura parpadeaba sobre la firma del turno.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La columna borrada',
      Scene: PaperDemo,
      beats: [
        {
          say: 'El colector de prueba parte en 3 cm. Mueve el punto sobre el papel hasta un minuto y lee el nivel y la pendiente.',
          gate: 'Arrastra el punto de la curva hasta t = 1 min.',
        },
        {
          say: 'El papel marca 4 cm y una pendiente de 2 cm/min; el boletín muestra ese nivel con pendiente cero.',
          ask: {
            prompt: '¿Qué flecha debe acompañar el papel en ese punto?',
            options: ['Horizontal, pendiente 0', 'Pendiente 4', 'Pendiente 2'],
            answer: 2,
            explain: "$H'=2t$, así que $H'(1)=2$ cm/min. El 4 es el nivel del punto.",
          },
          note: {
            label: 'Canal auxiliar original',
            tex: "H(0)=3,\\quad H(1)=4,\\quad H'(1)=2",
            body: 't en minutos desde la 01:00 del 18; dominio de 0 a 2 min. El boletín conservó el nivel y cambió la pendiente.',
          },
        },
        {
          say: 'La cabecera identifica el canal como entrada auxiliar. Ajusta el inicio de la curva al registro de 3 cm y observa cómo conserva las pendientes del campo.',
          gate: 'Arrastra el punto del eje vertical hasta H(0) = 3 cm, en la marca verde.',
        },
        {
          say: 'La curva ajustada parte en 3 cm y pasa por 4 cm al minuto, siguiendo las pendientes del papel.',
          ask: {
            prompt: '¿Cuál conserva el inicio de 3 cm y esas pendientes?',
            options: ['$3+t^2$', '$3+2t$', '$t^2$'],
            answer: 0,
            explain:
              'La primera parte en 3 y tiene derivada 2t. La recta conserva solo el inicio; t² conserva solo las pendientes.',
          },
          note: { label: 'Curva conservada', tex: "H(t)=3+t^2\\Rightarrow H'(t)=2t" },
        },
      ],
    },
    { kind: 'challenge', title: 'Leer el trazo', Comp: PaperPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'observatorio',
      lines: [
        {
          who: 'nar',
          text: 'Elena tapó el botón con la mano. Bajo la mesa, el tambor seguía raspando.',
        },
        {
          who: 'teo',
          text: 'El canal auxiliar salió a una dirección de Halcón, y la pantalla del turno ni lo menciona.',
        },
        { who: 'elena', text: 'Mi compañera firmó lo que pudo ver.' },
        { who: 'iris', text: 'Entonces hay que leer lo que no le dejaron ver.' },
      ],
    },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  {
    id: 'dy-equation',
    world: 'dynamics',
    tex: "y'=f(t,y)",
    name: 'Ecuación diferencial',
    read: 'i prima igual a efe de te e i',
    meaning: 'Regla que asigna la pendiente de una solución a cada tiempo y estado.',
    warn: 'La pendiente y el nivel tienen unidades distintas.',
  },
  {
    id: 'dy-initial',
    world: 'dynamics',
    tex: 'y(t_0)=y_0',
    name: 'Condición inicial',
    read: 'i de te cero igual a i cero',
    meaning:
      'Valor de la solución en el tiempo de origen. Selecciona su inicio entre las curvas que cumplen la regla.',
  },
];
