import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Arrow, Axes, Dot } from '../../engine/shapes';
import type {
  ChallengeProps,
  DemoProps,
  Glyph,
  LessonStep,
  LevelSpec,
} from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { gauss, mean, num, sd, sum } from './kit';

// ============================================================================
// CASO 6.8 · «La relación» — correlación y regresión lineal
// Diagrama de dispersión; coeficiente r; recta de mínimos cuadrados; b = r·sy/sx y
// a = ȳ − b·x̄; predicción y residuo; correlación no es causalidad.
// ============================================================================

const corr = (xs: number[], ys: number[]) => {
  const mx = mean(xs);
  const my = mean(ys);
  return (
    sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) /
    Math.sqrt(sum(xs.map((x) => (x - mx) ** 2)) * sum(ys.map((y) => (y - my) ** 2)))
  );
};
const fit = (xs: number[], ys: number[]) => {
  const b = (corr(xs, ys) * sd(ys)) / sd(xs);
  return { b, a: mean(ys) - b * mean(xs) };
};

// fixed noise for the lesson cloud
const Z1 = (() => {
  const r = rng(77);
  return Array.from({ length: 30 }, () => gauss(r));
})();
const Z2 = (() => {
  const r = rng(78);
  return Array.from({ length: 30 }, () => gauss(r));
})();
const LX = [1, 2, 3, 4, 5, 6, 7, 8];
const LY = [2.1, 3.9, 3.2, 5.8, 5.1, 7.4, 6.6, 8.9];
const PL = plane([0, 9], [0, 10], { x: 300, y: 140, w: 760, h: 480 });

// ---------------------------------------------------------------- lesson
function RegLesson({ beats, unlock, answer }: DemoProps) {
  const { at, beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [rho, setRho] = useState(0.5);
  const [ends, setEnds] = useState<[number, number]>([5, 5]);
  const which = useRef(0);
  const best = fit(LX, LY);
  const sse = (a: number, b: number) => sum(LX.map((x, i) => (LY[i] - (a + b * x)) ** 2));
  const minS = sse(best.a, best.b);
  const onRho = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(-1 + ((x - 1230) / 260) * 2, -0.98, 0.98) * 20) / 20;
    setRho(v);
    const ys = Z1.map((z, i) => v * z + Math.sqrt(1 - v * v) * Z2[i]);
    if (corr(Z1, ys) < -0.8) unlock();
  });
  const onEnd = (k: number) => (e: React.PointerEvent) => {
    which.current = k;
    dragEnd(e);
  };
  const dragEnd = useSvgDrag(svg, (_x, y) => {
    const v = clamp(PL.inv(0, y)[1], 0, 10);
    setEnds((o) => {
      const n: [number, number] = which.current === 0 ? [v, o[1]] : [o[0], v];
      const b = (n[1] - n[0]) / 9;
      if (sse(n[0], b) <= minS * 1.1) unlock();
      return n;
    });
  });
  if (beat === 1) {
    const ys = Z1.map((z, i) => rho * z + Math.sqrt(1 - rho * rho) * Z2[i]);
    const P1 = plane([-3, 3], [-3, 3], { x: 360, y: 140, w: 520, h: 520 });
    return (
      <Stage ref={svg}>
        <Axes
          P={P1}
          xTicks={[-3, -2, -1, 0, 1, 2, 3]}
          yTicks={[-3, -2, -1, 0, 1, 2, 3]}
          grid
          tickLabels={false}
        />
        {Z1.map((x, i) => (
          <Dot
            key={i}
            x={P1.x(x)}
            y={P1.y(clamp(ys[i], -3, 3))}
            r={7}
            color={C.cyan}
            glow={false}
          />
        ))}
        <line x1={1230} x2={1490} y1={420} y2={420} stroke={C.line} strokeWidth={3} />
        <Cap x={1230} y={455} size={16} color={C.dim} tex="-1" />
        <Cap x={1360} y={455} size={16} color={C.dim} tex="0" />
        <Cap x={1490} y={455} size={16} color={C.dim} tex="1" />
        <Knob
          x={1230 + ((rho + 1) / 2) * 260}
          y={420}
          color={C.cyan}
          onPointerDown={onRho}
          cursor="ew-resize"
        />
        <Cap x={1360} y={340} size={26} color={C.cyan} tex={`r=${num(corr(Z1, ys), 2)}`} />
      </Stage>
    );
  }
  const showFit = beat >= 3;
  const a = beat === 2 ? ends[0] : best.a;
  const b = beat === 2 ? (ends[1] - ends[0]) / 9 : best.b;
  return (
    <Stage ref={svg}>
      {beat === 5 ? (
        <>
          {[
            ['calor', 760, 230],
            ['venta de helados', 480, 470],
            ['personas en la playa', 1040, 470],
          ].map(([t, x, y], k) => (
            <g key={k} opacity={clamp(at(5) * 3 - k, 0, 1)}>
              <rect
                x={(x as number) - 140}
                y={(y as number) - 40}
                width={280}
                height={80}
                rx={12}
                fill={C.panel}
                stroke={k ? C.amber : C.magenta}
                strokeWidth={3}
              />
              <Cap x={x as number} y={y as number} size={22} color={C.text}>
                {t as string}
              </Cap>
            </g>
          ))}
          <Arrow from={[700, 280]} to={[540, 420]} color={C.magenta} width={3} progress={at(5)} />
          <Arrow from={[820, 280]} to={[980, 420]} color={C.magenta} width={3} progress={at(5)} />
          <line
            x1={630}
            x2={890}
            y1={470}
            y2={470}
            stroke={C.dim}
            strokeWidth={3}
            strokeDasharray="8 8"
            opacity={at(5)}
          />
          <Cap x={760} y={580} size={18} color={C.muted}>
            correlacionadas, sin que una cause la otra
          </Cap>
        </>
      ) : (
        <>
          <Axes
            P={PL}
            xTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
            yTicks={[0, 2, 4, 6, 8, 10]}
            xLabel="x"
            yLabel="y"
            grid
          />
          {beat >= 2 &&
            beat !== 4 &&
            LX.map((x, i) => {
              const yh = a + b * x;
              const side = Math.abs(PL.y(LY[i]) - PL.y(yh));
              return (
                <g key={i}>
                  <line
                    x1={PL.x(x)}
                    x2={PL.x(x)}
                    y1={PL.y(LY[i])}
                    y2={PL.y(yh)}
                    stroke={C.red}
                    strokeWidth={2}
                  />
                  {beat === 2 && (
                    <rect
                      x={PL.x(x)}
                      y={Math.min(PL.y(LY[i]), PL.y(yh))}
                      width={side}
                      height={side}
                      fill={C.red}
                      opacity={0.15}
                    />
                  )}
                </g>
              );
            })}
          {beat >= 2 && beat !== 4 && (
            <line
              x1={PL.x(0)}
              x2={PL.x(9)}
              y1={PL.y(a)}
              y2={PL.y(a + 9 * b)}
              stroke={showFit ? C.green : C.amber}
              strokeWidth={4}
            />
          )}
          {LX.map((x, i) => (
            <Dot
              key={i}
              x={PL.x(x)}
              y={PL.y(LY[i])}
              r={8}
              color={C.cyan}
              opacity={beat === 0 ? clamp(at(0) * 8 - i, 0, 1) : 1}
            />
          ))}
          {beat === 2 && (
            <>
              <Knob
                x={PL.x(0)}
                y={PL.y(ends[0])}
                color={C.amber}
                onPointerDown={onEnd(0)}
                cursor="ns-resize"
              />
              <Knob
                x={PL.x(9)}
                y={PL.y(ends[1])}
                color={C.amber}
                onPointerDown={onEnd(1)}
                cursor="ns-resize"
              />
              <Cap
                x={1370}
                y={260}
                size={22}
                color={C.red}
                tex={`\\sum e_i^2=${num(sse(a, b), 2)}`}
              />
              <Cap
                x={1370}
                y={320}
                size={18}
                color={C.muted}
                tex={`\\text{mínimo posible: }${num(minS, 2)}`}
              />
            </>
          )}
          {beat === 3 && (
            <>
              <circle
                cx={PL.x(mean(LX))}
                cy={PL.y(mean(LY))}
                r={11}
                fill="none"
                stroke={C.amber}
                strokeWidth={3}
              />
              <Cap
                x={PL.x(mean(LX)) + 50}
                y={PL.y(mean(LY)) + 30}
                size={18}
                color={C.amber}
                tex="(\bar x,\bar y)"
              />
              <Cap
                x={1370}
                y={260}
                size={22}
                color={C.green}
                tex={`\\hat y=${num(best.a, 2)}+${num(best.b, 2)}\\,x`}
              />
              <Cap x={1370} y={320} size={20} color={C.text} tex={`r=${num(corr(LX, LY), 2)}`} />
            </>
          )}
          {beat === 4 && (
            <>
              <Cap x={1370} y={260} size={22} color={C.text} tex="\hat y=10+2x" />
              {answer !== null && (
                <Cap
                  x={1370}
                  y={320}
                  size={22}
                  color={C.green}
                  tex="\hat y(15)=40,\ \ e=52-40=12"
                />
              )}
            </>
          )}
          {beat === 0 && (
            <Cap x={1370} y={260} size={20} color={C.muted}>
              un punto por individuo
            </Cap>
          )}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Correlación y regresión lineal',
  Scene: RegLesson,
  beats: [
    {
      say: 'Para ver si dos variables se relacionan se usa un **diagrama de dispersión**: un punto por individuo, con una variable en cada eje.',
      dur: 2.6,
      board: {
        label: 'Diagrama de dispersión',
        tex: '(\\p{1}{x_i},\\,\\p{2}{y_i}),\\quad i=1,\\dots,n',
        parts: ['primera variable del caso', 'segunda variable del caso'],
      },
    },
    {
      say: 'El **coeficiente de correlación** $r$ mide qué tan alineados están los puntos sobre una recta. Va de $-1$ a $1$: el signo da la dirección y el tamaño, la fuerza.',
      gate: 'Mueve el control hasta que la correlación sea menor que −0,8.',
      board: {
        label: 'Correlación',
        tex: 'r=\\frac{1}{n-1}\\sum_i\\p{1}{\\frac{x_i-\\bar x}{s_x}}\\cdot\\p{2}{\\frac{y_i-\\bar y}{s_y}}',
        body: '$r\\approx\\pm1$: casi una recta. $r\\approx0$: sin relación lineal.',
        parts: ['desviación horizontal típica', 'desviación vertical típica'],
      },
    },
    {
      say: 'La **recta de regresión** es la que mejor pasa entre los puntos: la que hace más chica la suma de los cuadrados de los **residuos**, las distancias verticales de cada punto a la recta.',
      gate: 'Arrastra los extremos de la recta hasta acercarte al mínimo de la suma de cuadrados.',
      board: {
        label: 'Mínimos cuadrados',
        tex: '\\min_{a,b}\\ \\sum_i\\big(\\p{1}{y_i}-(\\p{2}{a+b\\,x_i})\\big)^2',
        parts: ['valor observado del caso', 'valor que predice la recta'],
      },
    },
    {
      say: 'La recta óptima tiene fórmula: la pendiente es $r$ por el cociente de las desviaciones estándar, y la recta pasa por el punto de las medias $(\\bar x,\\bar y)$.',
      dur: 3,
      board: {
        label: 'Coeficientes',
        tex: '\\begin{gathered}\\hat y=a+b\\,x\\\\ \\p{1}{b=r\\,\\frac{s_y}{s_x}},\\quad \\p{2}{a=\\bar y-b\\,\\bar x}\\end{gathered}',
        parts: ['inclinación de la recta', 'altura inicial de la recta'],
      },
    },
    {
      say: 'La recta sirve para **predecir**, y el **residuo** dice cuánto se aleja un caso real de lo esperado.',
      ask: {
        prompt: 'Con $\\hat y=10+2x$ y un caso real $(15,\\,52)$: ¿predicción y residuo?',
        options: [
          'predicción 40, residuo 12',
          'predicción 52, residuo 0',
          'predicción 40, residuo −12',
        ],
        answer: 0,
        explain:
          '$\\hat y=10+2\\cdot15=40$; residuo $e=y-\\hat y=52-40=12$: el caso está 12 por encima de lo esperado.',
      },
      board: {
        label: 'Residuo',
        tex: 'e_i=\\p{1}{y_i}-\\p{2}{\\hat y_i}',
        parts: ['valor observado del caso', 'valor esperado del caso'],
      },
    },
    {
      say: 'Cuidado: **correlación no es causalidad**. Dos variables pueden moverse juntas porque ambas dependen de una tercera.',
      dur: 2.8,
      board: {
        label: 'Correlación no es causa',
        tex: '\\p{1}{r}\\approx\\p{2}{1\\ \\not}\\Rightarrow\\p{3}{\\ x\\ \\text{causa}\\ y}',
        parts: ['fuerza de relación', 'alineación no basta', 'relación de causa'],
      },
    },
  ],
};

// ---------------------------------------------------------------- demo
const CX = [4, 5, 6, 7, 8, 9, 10, 11, 13, 12];
const CY = [3.9, 4.7, 5.8, 6.6, 7.7, 8.5, 9.6, 10.4, 12.3, 6];
const PD = plane([0, 14], [0, 14], { x: 360, y: 120, w: 560, h: 560 });

function ClinicsDemo({ beats, answer }: DemoProps) {
  const { at, beat } = beats;
  const pred = beat >= 1 && (beat > 1 || answer !== null);
  return (
    <Stage>
      <Axes
        P={PD}
        xTicks={[0, 2, 4, 6, 8, 10, 12, 14]}
        yTicks={[0, 2, 4, 6, 8, 10, 12, 14]}
        xLabel="\text{recibidas}"
        yLabel="\text{registradas}"
        grid
      />
      {beat >= 1 && (
        <line
          x1={PD.x(0)}
          x2={PD.x(14)}
          y1={PD.y(0)}
          y2={PD.y(0.95 * 14)}
          stroke={C.green}
          strokeWidth={3}
        />
      )}
      {CX.map((x, i) => (
        <Dot
          key={i}
          x={PD.x(x)}
          y={PD.y(CY[i])}
          r={i === 9 ? 11 : 8}
          color={i === 9 ? C.magenta : C.cyan}
          opacity={beat === 0 ? clamp(at(0) * 10 - i, 0, 1) : 1}
        />
      ))}
      <Cap x={PD.x(12) + 70} y={PD.y(6)} size={16} color={C.magenta}>
        Cerro
      </Cap>
      {pred && (
        <circle cx={PD.x(12)} cy={PD.y(11.4)} r={9} fill="none" stroke={C.green} strokeWidth={3} />
      )}
      {beat === 2 && answer !== null && (
        <line
          x1={PD.x(12)}
          x2={PD.x(12)}
          y1={PD.y(11.4)}
          y2={PD.y(6)}
          stroke={C.red}
          strokeWidth={4}
        />
      )}
      <Cap x={1300} y={230} size={20} color={C.muted}>
        cientos de dosis
      </Cap>
      {beat >= 1 && <Cap x={1300} y={280} size={22} color={C.green} tex="\hat y\approx0{,}95\,x" />}
      {pred && <Cap x={1300} y={340} size={22} color={C.green} tex="\hat y(12)=11{,}4" />}
      {beat === 2 && answer !== null && (
        <Cap x={1300} y={400} size={22} color={C.red} tex="e=6-11{,}4=-5{,}4" />
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Regression({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 71 + round);
    const rr = pick(r, [0.6, 0.75, 0.8, -0.5, 0.9]);
    const sx = pick(r, [2, 4, 5, 10]);
    const sy = pick(r, [3, 6, 8, 12, 15]);
    const mx = pick(r, [10, 20, 40, 50]);
    const my = pick(r, [30, 45, 60, 80]);
    const b = pick(r, [0.8, 1.5, 2, 2.5, 0.9]);
    const a = randInt(r, -10, 20);
    const x = randInt(r, 5, 40);
    const y = Math.round(a + b * x + randInt(r, -9, 9));
    return { rr, sx, sy, mx, my, b, a, x, y };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { rr, sx, sy, mx, my, b, a, x, y } = data;

  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt(
        `Dosis recibidas ($x$) y registradas ($y$) en las clínicas: $r=${num(rr)}$, $s_x=${sx}$, $s_y=${sy}$. ¿Cuál es la pendiente de la recta de regresión? (Dos decimales.)`,
        'b=r\\,\\frac{s_y}{s_x}',
      );
      api.hints([
        'Multiplica $r$ por el cociente de las desviaciones.',
        'Es $s_y$ sobre $s_x$, no al revés.',
      ]);
    } else if (round === 1) {
      api.prompt(
        `Con pendiente $b=${num(b)}$, $\\bar x=${mx}$ y $\\bar y=${my}$, ¿cuánto vale la ordenada $a$? (Dos decimales.)`,
        'a=\\bar y-b\\,\\bar x',
      );
      api.hints(['La recta pasa por $(\\bar x,\\bar y)$.', `$a=${my}-${num(b)}\\cdot${mx}$.`]);
    } else {
      api.prompt(
        `Recta: $\\hat y=${a}+${num(b)}\\,x$. Una clínica recibió $x=${x}$ y registró $y=${y}$. ¿Cuál es su residuo? (Dos decimales.)`,
        'e=y-\\hat y',
      );
      api.hints([
        `$\\hat y=${a}+${num(b)}\\cdot${x}$.`,
        'Residuo: lo observado menos lo predicho.',
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const t = (rr * sy) / sx;
      if (Math.abs(v - t) < 0.011)
        return api.result(true, `$b=${num(rr)}\\cdot\\tfrac{${sy}}{${sx}}=${num(t)}$.`);
      if (Math.abs(v - (rr * sx) / sy) < 0.011)
        return api.result(false, 'Invertiste el cociente: es $s_y/s_x$.');
      return api.result(false, `$${num(rr)}\\cdot${sy}/${sx}$.`);
    }
    if (round === 1) {
      const t = my - b * mx;
      if (Math.abs(v - t) < 0.011)
        return api.result(true, `$a=${my}-${num(b)}\\cdot${mx}=${num(t)}$.`);
      if (Math.abs(v - (mx - b * my)) < 0.011)
        return api.result(false, 'Intercambiaste $\\bar x$ y $\\bar y$.');
      return api.result(false, `$a=\\bar y-b\\bar x=${my}-${num(b * mx)}$.`);
    }
    const yh = a + b * x;
    const t = y - yh;
    if (Math.abs(v - t) < 0.011)
      return api.result(true, `$\\hat y=${num(yh)}$ y $e=${y}-${num(yh)}=${num(t)}$.`);
    if (Math.abs(v + t) < 0.011)
      return api.result(false, 'El residuo es observado menos predicho: $y-\\hat y$.');
    return api.result(false, `Primero $\\hat y=${a}+${num(b)}\\cdot${x}$.`);
  };

  const P = plane([0, 50], [0, 140], { x: 300, y: 160, w: 700, h: 420 });
  return (
    <Stage>
      {round === 2 && (
        <>
          <Axes
            P={P}
            xTicks={[0, 10, 20, 30, 40, 50]}
            yTicks={[0, 20, 40, 60, 80, 100, 120, 140]}
            xLabel="x"
            yLabel="y"
            grid
          />
          <line
            x1={P.x(0)}
            x2={P.x(50)}
            y1={P.y(clamp(a, 0, 140))}
            y2={P.y(clamp(a + 50 * b, 0, 140))}
            stroke={C.green}
            strokeWidth={3}
          />
          <Dot x={P.x(x)} y={P.y(clamp(y, 0, 140))} r={9} color={C.magenta} />
        </>
      )}
      {round < 2 && (
        <Cap
          x={620}
          y={330}
          size={32}
          color={C.text}
          tex={
            round === 0
              ? `r=${num(rr)},\\quad s_x=${sx},\\quad s_y=${sy}`
              : `b=${num(b)},\\quad \\bar x=${mx},\\quad \\bar y=${my}`
          }
        />
      )}
      <NumberField
        x={1150}
        y={360}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={round === 0 ? 'b =' : round === 1 ? 'a =' : 'e ='}
        width={4}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w6-c8',
  world: 'statistics',
  code: '6.8',
  title: 'La relación',
  subtitle: 'Correlación y regresión lineal',
  glyph: '\\hat y=a+bx',
  kind: 'level',
  guide: 'ana',
  teaser:
    'En cada clínica, las dosis recibidas y las registradas deberían ir juntas. Una recta lo muestra, y muestra también qué clínica se aparta.',
  learn:
    'Diagramas de dispersión, coeficiente de correlación, recta de mínimos cuadrados, predicción, residuos y la diferencia entre correlación y causalidad.',
  glyphs: ['st-r', 'st-reg'],
  pitfalls: [
    'La pendiente es $r\\,s_y/s_x$ (la de $y$ arriba).',
    'El residuo es $y-\\hat y$: positivo si el caso queda sobre la recta.',
    'Una correlación alta no prueba que una variable cause la otra.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'nar',
          text: 'Archivo Regional, seis de la tarde. La guía de despacho crujió al desplegarse; tenía un doblez en cuatro que nadie había deshecho en meses.',
        },
        {
          who: 'ana',
          text: 'Diez clínicas: dosis recibidas según las guías y dosis registradas en sus libros. El Cerro firmó la recepción, pero su registro se queda corto.',
        },
        { who: 'iris', text: 'Necesito medir cuánto antes de llamarlo desvío.' },
        {
          who: 'ana',
          text: 'Comparemos con las otras nueve y dejemos las unidades a la vista. Estas columnas están en cientos de dosis.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'Recibidas y registradas',
      Scene: ClinicsDemo,
      beats: [
        {
          say: 'Cada punto es una clínica: dosis recibidas en el eje horizontal y registradas en el vertical, en cientos.',
          dur: 2,
          note: {
            label: 'Diez clínicas',
            tex: '(x_i,\\,y_i)',
            body: '$x$: dosis recibidas; $y$: dosis registradas (cientos).',
          },
        },
        {
          say: 'Sin la clínica del Cerro, la recta de regresión es casi $\\hat y=0{,}95\\,x$, con $r\\approx0{,}99$: se registra el 95 % de lo que llega.',
          ask: {
            prompt: 'El Cerro recibió 12 (1 200 dosis). ¿Cuánto predice la recta?',
            options: ['≈ 11,4', '≈ 6', '≈ 12'],
            answer: 0,
            explain: '$0{,}95\\cdot12=11{,}4$: unas 1 140 dosis registradas.',
          },
          note: { label: 'Predicción para el Cerro', tex: '\\hat y=0{,}95\\cdot12=11{,}4' },
        },
        {
          say: 'El registro del Cerro dice 6, es decir, 600 dosis.',
          ask: {
            prompt: '¿Cuál es su residuo?',
            options: ['−5,4: faltan unas 540 dosis', '+5,4', '0'],
            answer: 0,
            explain:
              '$e=6-11{,}4=-5{,}4$ cientos. Ninguna otra clínica se aleja más de 0,2 de la recta.',
          },
          note: {
            label: 'Residuo del Cerro',
            tex: 'e=6-11{,}4=-5{,}4',
            body: 'Unas 540 dosis recibidas que no aparecen en ningún registro.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'La recta', Comp: Regression, rounds: 3 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        {
          who: 'teo',
          text: 'Recibió 1 200 y registró 600, y por lo que hacen las otras clínicas uno esperaría unas 1 140. La diferencia con esa referencia es −5,4 cientos, unas 540 dosis.',
        },
        {
          who: 'ana',
          text: 'De esas 540, la copia permite seguir 400 hasta los trabajadores de Halcón. Quedan 140 sin rastro.',
        },
        {
          who: 'iris',
          text: 'Las guías y la copia van juntas en el informe, cada diferencia con su respaldo.',
        },
        {
          who: 'ana',
          text: 'De acuerdo; así puedo firmarlo con ustedes. Las 140 siguen sin aparecer en ninguna carpeta de pacientes.',
        },
      ],
    },
  ],
};

export { lesson };

export const glyphs: Glyph[] = [
  {
    id: 'st-r',
    world: 'statistics',
    tex: 'r',
    name: 'Coeficiente de correlación',
    read: 'erre',
    meaning: 'Entre $-1$ y $1$: dirección y fuerza de la relación lineal entre dos variables.',
  },
  {
    id: 'st-reg',
    world: 'statistics',
    tex: '\\hat y=a+bx',
    name: 'Recta de regresión',
    read: 'y gorro igual a más be equis',
    meaning: 'Recta de mínimos cuadrados: $b=r\\,s_y/s_x$, $a=\\bar y-b\\bar x$.',
  },
];
