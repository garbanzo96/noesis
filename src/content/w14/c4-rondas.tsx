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

// Caso 14.4 · Dos registros para los mismos tramos: 2x+y=10, x-y=2.
const X = (x: number) => 220 + 90 * x;
const Y = (y: number) => 660 - 55 * y;
const system = (a: number, total: number, gap: number) =>
  `\\begin{cases}${a === 1 ? '' : a}x+y=${total}\\\\x-y=${gap}\\end{cases}`;

/** Plano del repaso. Las líneas se recortan al primer cuadrante. */
function RoundPlot({
  a = 1,
  total,
  gap,
  target = false,
  solved = false,
}: {
  a?: number;
  total: number;
  gap: number;
  target?: boolean;
  solved?: boolean;
}) {
  const line = (f: (x: number) => number) => {
    const points = Array.from({ length: 161 }, (_, i) => i / 20)
      .map((x) => [x, f(x)])
      .filter(([, y]) => y >= 0 && y <= 8);
    return points.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)} ${Y(y)}`).join(' ');
  };
  const x = (total + gap) / (a + 1);
  const y = x - gap;
  return (
    <g>
      <Cap x={580} y={160} size={24}>
        Dos registros · un mismo par de tiempos
      </Cap>
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <line x1={X(i)} x2={X(i)} y1={Y(0)} y2={Y(8)} stroke={C.line} opacity={0.45} />
          <line x1={X(0)} x2={X(8)} y1={Y(i)} y2={Y(i)} stroke={C.line} opacity={0.45} />
          <Cap x={X(i)} y={695} size={16} color={C.muted}>
            {i}
          </Cap>
          <Cap x={185} y={Y(i)} size={16} color={C.muted}>
            {i}
          </Cap>
        </g>
      ))}
      <line x1={X(0)} x2={X(8)} y1={Y(0)} y2={Y(0)} stroke={C.muted} strokeWidth={2} />
      <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(8)} stroke={C.muted} strokeWidth={2} />
      <Cap x={580} y={745} size={19}>
        x · minutos por tramo largo
      </Cap>
      <Cap x={310} y={190} size={19}>
        y · minutos por tramo corto
      </Cap>
      <path d={line((v) => total - a * v)} fill="none" stroke={C.cyan} strokeWidth={4} />
      <path d={line((v) => v - gap)} fill="none" stroke={C.amber} strokeWidth={4} />
      {target && <circle cx={X(3)} cy={Y(2)} r={12} fill="none" stroke={C.green} strokeWidth={3} />}
      {solved && <circle cx={X(x)} cy={Y(y)} r={7} fill={C.green} />}
    </g>
  );
}

/** Tramos sin escala temporal: repite los datos, nunca los tiempos resueltos. */
function PatrolMap({ a }: { a: number }) {
  return (
    <g>
      <Cap x={560} y={190} size={25}>
        Registro de rondas · pasillo del piso 40
      </Cap>
      <rect
        x={170}
        y={260}
        width={780}
        height={410}
        rx={20}
        fill={C.panel}
        stroke={C.line}
        strokeWidth={3}
      />
      <Cap x={560} y={310} size={22} color={C.cyan}>
        Guardia A · duración total registrada
      </Cap>
      {Array.from({ length: a + 1 }, (_, i) => {
        const width = 640 / (a + 1);
        return (
          <g key={i}>
            <rect
              x={240 + i * width}
              y={370}
              width={width - 12}
              height={65}
              rx={8}
              fill="none"
              stroke={i < a ? C.cyan : C.amber}
              strokeWidth={3}
            />
            <Cap x={240 + i * width + (width - 12) / 2} y={402} tex={i < a ? 'x' : 'y'} />
          </g>
        );
      })}
      <Cap x={560} y={510} size={22} color={C.amber}>
        Guardia B · diferencia entre tramos
      </Cap>
      <Cap x={560} y={585} tex="x-y" size={32} color={C.amber} />
      <Cap x={560} y={720} size={20} color={C.muted}>
        Esquema sin escala · x e y están en minutos.
      </Cap>
    </g>
  );
}

function SystemsLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [total, setTotal] = useState(3);
  const [gap, setGap] = useState(3);
  const beat = beats.beat;
  const dragA = useSvgDrag(svg, (_, y) => {
    const next = Math.round(clamp((660 - y) / 55 + 1, 3, 7));
    setTotal(next);
    if (beat === 1 && next === 5 && gap === 1) unlock();
  });
  const dragB = useSvgDrag(svg, (_, y) => {
    const next = Math.round(clamp(6 - (660 - y) / 55, -1, 3));
    setGap(next);
    if (beat === 1 && total === 5 && next === 1) unlock();
  });
  const predicting = beat === 3;
  const shownTotal = beat <= 1 ? total : predicting ? 7 : 5;
  const shownGap = beat <= 1 ? gap : 1;
  return (
    <Stage ref={svg}>
      {predicting && answer === null ? (
        <PatrolMap a={1} />
      ) : (
        <RoundPlot total={shownTotal} gap={shownGap} target={beat <= 1} solved={beat >= 2} />
      )}
      <Cap x={1250} y={230} tex={`x+y=${shownTotal}`} color={C.cyan} />
      <Cap x={1250} y={320} tex={`x-y=${shownGap}`} color={C.amber} />
      {beat <= 1 && <Cap x={1250} y={410} tex="(x,y)=(3,2)" color={C.green} />}
      {beat === 1 && (
        <>
          <Knob x={X(1)} y={Y(total - 1)} axis="y" color={C.cyan} onPointerDown={dragA} />
          <Knob x={X(6)} y={Y(6 - gap)} axis="y" color={C.amber} onPointerDown={dragB} />
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={410} tex="2x=6" />
          <Cap x={1250} y={500} tex="x=3,\quad y=3-1=2" color={C.green} />
        </>
      )}
      {predicting && answer !== null && (
        <>
          <Cap x={1250} y={410} tex="2x=8\Rightarrow x=4" />
          <Cap x={1250} y={500} tex="y=4-1=3" color={C.green} />
        </>
      )}
      {beat === 4 && (
        <>
          <Cap x={1250} y={410} tex="3+2=5" color={C.cyan} />
          <Cap x={1250} y={500} tex="3-2=1" color={C.amber} />
          <Cap x={1250} y={590} size={22}>
            El par cumple ambos registros.
          </Cap>
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Repaso: dos ecuaciones a la vez',
  intro: {
    question: '¿Cómo se encuentran dos valores que cumplen dos condiciones al mismo tiempo?',
    text: 'Este piso repasa los sistemas lineales del Metro: dos ecuaciones, dos incógnitas, y la eliminación para despejarlas. Dos guardias recorren el piso 40, y sus registros dejan un hueco para cruzar el pasillo.',
  },
  Scene: SystemsLesson,
  beats: [
    {
      say: 'Cada recta reúne los pares que cumplen un registro. Un **sistema lineal** pide un par que cumpla ambos: el punto donde se cruzan.',
      board: {
        label: 'Solución común',
        tex: '\\begin{cases}ax+by=c\\\\dx+ey=f\\end{cases}',
        body: 'El mismo x y el mismo y deben servir en las dos ecuaciones.',
      },
    },
    {
      say: 'El círculo verde marca el par (3, 2). Desplaza ambas rectas para que pasen por él; sus pendientes se mantienen.',
      gate: 'Arrastra las dos perillas verticalmente hasta que las rectas se crucen en el círculo verde.',
    },
    {
      say: 'Con x + y = 5 y x − y = 1, suma las ecuaciones. Los términos y y −y se cancelan: esta **eliminación** deja 2x = 6.',
      board: {
        label: 'Eliminar y',
        tex: '\\p{1}{(x+y)+(x-y)}=\\p{2}{5+1}\\Rightarrow\\p{3}{2x}=\\p{4}{6}',
        body: 'x = 3. Sustituye en x − y = 1 para obtener y = 2.',
        parts: [
          'suma de los registros',
          'suma de los totales',
          'doble del primer tiempo',
          'total al sumar',
        ],
      },
    },
    {
      say: 'Cambia el total a 7 minutos y conserva x − y = 1. Resuelve primero x y después despeja y.',
      ask: {
        prompt: '¿Cuánto vale y en este nuevo sistema?',
        options: ['3 min', '4 min', '5 min'],
        answer: 0,
        explain: 'Al sumar queda 2x = 8, así que x = 4. De 4 − y = 1 resulta y = 3; 4 es x.',
      },
      board: {
        label: 'Sustituir',
        tex: '\\p{1}{2x}=\\p{2}{8}\\Rightarrow\\p{3}{ x}=\\p{4}{4},\\quad\\p{5}{ y}=\\p{6}{x-1}=\\p{7}{3}',
        parts: [
          'doble del primer tiempo',
          'total al sumar',
          'primer tiempo',
          'minutos del primer tramo',
          'segundo tiempo',
          'despeje del segundo tiempo',
          'minutos del segundo tramo',
        ],
      },
    },
    {
      say: 'Vuelve al par (3, 2) del repaso. Comprueba las dos ecuaciones: acertar una sola deja tiempos que el otro registro descarta.',
      board: {
        label: 'Comprobar ambos registros',
        tex: '\\p{1}{3+2}=\\p{2}{5},\\quad\\p{3}{3-2}=\\p{4}{1}',
        parts: [
          'suma de los tiempos',
          'tiempo total',
          'diferencia de los tiempos',
          'minuto de diferencia',
        ],
      },
    },
  ],
};

function RoundsDemo({ beats, answer }: DemoProps) {
  const second = beats.beat === 1;
  return (
    <Stage>
      {answer === null ? <PatrolMap a={2} /> : <RoundPlot a={2} total={10} gap={2} solved />}
      <Cap x={1250} y={230} tex="2x+y=10" color={C.cyan} />
      <Cap x={1250} y={320} tex="x-y=2" color={C.amber} />
      <Cap x={1250} y={410} size={21}>
        {second ? 'Hueco entre rondas: dura y.' : 'x e y: minutos por tramo.'}
      </Cap>
      {answer !== null && (
        <>
          <Cap
            x={1250}
            y={500}
            tex={second ? 'y=4-2=2' : '3x=12\\Rightarrow x=4'}
            color={C.green}
          />
          <Cap x={1250} y={590} tex={second ? '2\\cdot4+2=10,\\quad4-2=2' : 'y=x-2=2'} size={21} />
        </>
      )}
    </Stage>
  );
}

function RoundsPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 239 + round);
    const x = pick(r, [4, 5, 6, 7, 8]);
    const y = pick(r, [1, 2, 3]);
    const a = round === 0 ? 1 : round === 1 ? 2 : pick(r, [3, 4]);
    return { x, y, a, total: a * x + y, gap: x - y };
  }, [seed, round]);
  const [vx, setVx] = useState('');
  const [vy, setVy] = useState('');
  useEffect(() => {
    setVx('');
    setVy('');
    api.prompt(
      round === 2
        ? 'Otro turno deja un hueco de duración y. Resuelve ambos tiempos y anota y en el segundo campo, en minutos.'
        : 'Otro turno, los mismos dos tramos. Halla x e y en minutos para que ambos registros se cumplan.',
      system(d.a, d.total, d.gap),
    );
    api.hints([
      `Suma las ecuaciones: y y −y se cancelan; quedan ${d.a + 1} copias de x.`,
      `Divide ${d.total} + ${d.gap} por ${d.a + 1}. Después usa y = x − ${d.gap}.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const x = parseNum(vx);
    const y = parseNum(vy);
    if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const near = (v: number, w: number) => Math.abs(v - w) < 0.01;
    if (near(x, d.x) && near(y, d.y))
      return api.result(
        true,
        `$${d.a + 1}x=${d.total + d.gap}$: x = ${d.x} min, y = ${d.y} min. Ambos registros se cumplen.${round === 2 ? ` El hueco dura ${d.y} minutos.` : ''}`,
      );
    if (near(x, d.y) && near(y, d.x))
      return api.result(
        false,
        'Intercambiaste los tramos: x es el largo; y es el corto y mide el hueco. Revisa x − y.',
      );
    if (near(x, (d.total + d.gap) / d.a))
      return api.result(
        false,
        `Al sumar quedan ${d.a}x + x = ${d.a + 1}x. Falta contar el x de la segunda ecuación antes de dividir.`,
      );
    if (near(y, x + d.gap))
      return api.result(
        false,
        `Cambiaste el signo al despejar: x − y = ${d.gap} da y = x − ${d.gap}.`,
      );
    if (near(y, d.gap))
      return api.result(
        false,
        'Copiaste la diferencia x − y en el campo y. Esa diferencia es un dato; el tramo corto se obtiene restándola a x.',
      );
    const total = d.a * x + y;
    const gap = x - y;
    if (near(total, d.total))
      return api.result(
        false,
        `El total calza, pero x − y da ${fmt(gap)} min y debe dar ${d.gap}. Comprueba también el segundo registro.`,
      );
    if (near(gap, d.gap))
      return api.result(
        false,
        `La diferencia calza, pero el primer registro da ${fmt(total)} min y debe dar ${d.total}. Suma las ecuaciones para hallar x.`,
      );
    return api.result(
      false,
      `Tus tiempos dan $${d.a}x+y=${tnum(total)}$ y $x-y=${tnum(gap)}$. Suma los registros originales, divide por ${d.a + 1} y sustituye.`,
    );
  };
  return (
    <Stage>
      <PatrolMap a={d.a} />
      <Cap x={1250} y={220} tex={`${d.a === 1 ? '' : d.a}x+y=${d.total}`} color={C.cyan} />
      <Cap x={1250} y={310} tex={`x-y=${d.gap}`} color={C.amber} />
      <Cap x={1250} y={400} size={21}>
        {round === 2 ? 'El hueco dura y minutos.' : 'Dos tiempos por resolver.'}
      </Cap>
      <NumberField
        x={1080}
        y={490}
        value={vx}
        onChange={setVx}
        onEnter={submit}
        label="x ="
        unit="min"
      />
      <NumberField
        x={1080}
        y={590}
        value={vy}
        onChange={setVy}
        onEnter={submit}
        label="y ="
        unit="min"
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c4',
  world: 'active',
  code: '14.4',
  title: 'Las rondas',
  subtitle: 'Repaso: sistemas lineales',
  glyph: '\\begin{cases}2x+y=10\\\\x-y=2\\end{cases}',
  kind: 'level',
  guide: 'iris',
  teaser: 'Dos guardias recorren el piso 40. Sus registros dejan un hueco para cruzar el pasillo.',
  learn: 'Resolver dos ecuaciones lineales por eliminación, sustituir y comprobar ambos registros.',
  glyphs: ['tor-round-system', 'tor-round-elimination'],
  pitfalls: [
    'El mismo par debe cumplir las dos ecuaciones.',
    'Al sumar ax + x quedan (a + 1)x; cuenta ambos términos.',
    'De x − y = d se obtiene y = x − d; la diferencia d no es y.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La radio de un guardia crujió detrás de la puerta cortafuego. Iris apoyó la mano en la barra, todavía sin empujar.',
        },
        {
          who: 'teo',
          text: 'El sistema registra dos tramos largos y uno corto en diez minutos. El otro guardia marca dos minutos de diferencia entre el largo y el corto.',
        },
        {
          who: 'tu',
          text: 'Si el hueco dura lo que el tramo corto, podemos medir cuánto tenemos para cruzar.',
        },
        { who: 'iris', text: 'Mídelo. Yo me quedo con la puerta.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El hueco del piso 40',
      Scene: RoundsDemo,
      beats: [
        {
          say: 'Llama x al tiempo del tramo largo e y al del corto. Los registros dan 2x + y = 10 y x − y = 2, en minutos.',
          ask: {
            prompt: '¿Qué par cumple ambos registros?',
            options: ['x = 4, y = 2', 'x = 2, y = 4', 'x = 5, y = 0'],
            answer: 0,
            explain:
              'Suma: 3x = 12, luego x = 4. Sustituye en x − y = 2: y = 2; el par (5, 0) solo cumple el primer registro.',
          },
          note: {
            label: 'Tiempos de las rondas',
            tex: '\\begin{cases}2x+y=10\\\\x-y=2\\end{cases}\\Rightarrow x=4,\\ y=2',
            body: 'El tramo largo toma 4 minutos y el corto, 2.',
          },
        },
        {
          say: 'El hueco entre rondas dura lo mismo que el tramo corto. Iris necesita ese tiempo para decidir cuándo abrir.',
          ask: {
            prompt: '¿Cuántos minutos tienen para cruzar?',
            options: ['2 min', '4 min', '6 min'],
            answer: 0,
            explain:
              'El hueco corresponde a y = 2 minutos. x = 4 mide el tramo largo; sumar x + y da una duración distinta.',
          },
          note: {
            label: 'Ventana para cruzar',
            tex: 'y=x-2=4-2=2\\ \\text{min}',
            body: 'Comprobación: 2·4 + 2 = 10 y 4 − 2 = 2.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Contrastar otros turnos', Comp: RoundsPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'La radio se alejó. Iris entreabrió la puerta, y una franja de luz blanca cortó el piso.',
        },
        {
          who: 'teo',
          text: 'Cuatro minutos el largo y dos el corto. Los dos registros calzan, y dejé el aviso del sistema en silencio.',
        },
        { who: 'iris', text: 'Dos minutos, entonces. Yo sostengo la puerta.' },
        {
          who: 'nar',
          text: 'Cruzaste junto a Teo. Al fondo, el teclado del servidor encendió una luz roja y pidió una clave.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-round-system',
    world: 'active',
    tex: '\\begin{cases}ax+by=c\\\\dx+ey=f\\end{cases}',
    name: 'Sistema de dos ecuaciones',
    read: 'a equis más be ye igual a ce; de equis más e ye igual a efe',
    meaning:
      'Dos restricciones para las mismas incógnitas. Una solución cumple ambas y pertenece a ambas rectas.',
    warn: 'Cumplir una sola ecuación no resuelve el sistema.',
  },
  {
    id: 'tor-round-elimination',
    world: 'active',
    tex: '(ax+y)+(x-y)=(a+1)x',
    name: 'Eliminación por suma',
    read: 'a equis más ye, más equis menos ye, igual a a más uno por equis',
    meaning:
      'Sumar ecuaciones con coeficientes opuestos de y cancela esa incógnita. Después se despeja x y se sustituye.',
    warn: 'Suma también los lados derechos y conserva el x de la segunda ecuación.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'Sistema lineal',
      tex: '\\begin{cases}ax+by=c\\\\dx+ey=f\\end{cases}',
      body: 'Una solución es un par (x, y) que cumple ambas ecuaciones. Si las rectas se cruzan en un único punto, hay una única solución.',
    },
    {
      label: 'Eliminar una incógnita',
      tex: 'y+(-y)=0',
      body: 'Suma las ecuaciones cuando una incógnita tenga coeficientes opuestos; si hace falta, multiplica antes una ecuación completa.',
    },
  ],
  props: [
    {
      label: 'Registros de la torre',
      tex: '\\begin{cases}2x+y=10\\\\x-y=2\\end{cases}\\Rightarrow3x=12\\Rightarrow x=4,\\ y=2',
    },
    {
      label: 'Sustituir y comprobar',
      tex: 'y=x-2,\\quad2\\cdot4+2=10,\\quad4-2=2',
      body: 'El hueco entre rondas dura y = 2 minutos.',
    },
    {
      label: 'Otras posiciones de las rectas',
      tex: 'ax+by=c',
      body: 'Rectas paralelas distintas no tienen solución común; rectas coincidentes comparten todos sus puntos.',
    },
  ],
};

export { lesson };
