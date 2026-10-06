import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, parseNum } from '../shared/ui';
import { Secant, SlopeLine, Tangent, nt } from './kit';

// ============================================================================
// CASO 2.2 · «Potencia» — la derivada
// Medidor de energía E(t) de la carga oculta. Potencia media = pendiente de una secante;
// achicar el intervalo → potencia instantánea = pendiente de la tangente = E'(a). De cerca, la
// curva es casi recta. Unidades de la derivada.
// ============================================================================

const E = (t: number) => 2 * t * t + 3 * t;
const P = plane([0, 2.2], [0, 16], { x: 300, y: 130, w: 1000, h: 540 });
const X_T = [0, 0.5, 1, 1.5, 2];
const Y_T = [2, 4, 6, 8, 10, 12, 14, 16];

// ---------------------------------------------------------------- demo
function PowerDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const svg = useRef<SVGSVGElement>(null);
  const [b, setB] = useState(1.6);
  const [h, setH] = useState(0.8);
  const [zoom, setZoom] = useState(1);
  const onB = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(P.inv(x, 0)[0], 1.1, 2.2) * 20) / 20;
    setB(v);
    if (Math.abs(v - 2) < 1e-9) unlock();
  });
  const onH = useSvgDrag(svg, (x) => {
    const v = clamp(P.inv(x, 0)[0] - 1, 0.005, 1);
    const snapped = v < 0.05 ? Math.round(v * 200) / 200 : Math.round(v * 100) / 100;
    setH(Math.max(0.005, snapped));
    if (snapped <= 0.02) unlock();
  });
  const onZ = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(1 + ((x - 400) / 800) * 49, 1, 50));
    setZoom(v);
    if (v >= 50) unlock();
  });

  if (beat === 0 || beat === 1) {
    const bb = beat === 0 ? b : 1 + h;
    const m = (E(bb) - E(1)) / (bb - 1);
    return (
      <Stage ref={svg}>
        <Axes P={P} xTicks={X_T} yTicks={Y_T} xLabel="t\ (\text{h})" yLabel="E\ (\text{MWh})" grid />
        <Curve P={P} f={E} a={0} b={2.2} color={C.cyan} width={4} />
        {beat === 1 && h < 0.2 && <Tangent P={P} f={E} a={1} m={7} half={1} color={C.green} />}
        <Secant P={P} f={E} a={1} b={bb} unitY="\ \text{MWh}" unitX="\ \text{h}" />
        <Dot x={P.x(bb)} y={P.y(E(bb))} r={12} color={C.magenta} ring onPointerDown={beat === 0 ? onB : undefined} cursor="ew-resize" />
        <Html x={1330} y={220} size={22} anchor="left" color={C.magenta}>
          <Tex tex={`\\dfrac{\\Delta E}{\\Delta t}=${nt(m, 3)}\\ \\text{MW}`} />
        </Html>
        {beat === 1 && (
          <>
            <rect x={P.x(1)} y={P.y(0)} width={P.x(2) - P.x(1)} height={70} fill="transparent" onPointerDown={onH} style={{ cursor: 'ew-resize' }} />
            <Knob x={P.x(1 + h)} y={P.y(0) + 34} onPointerDown={onH} cursor="ew-resize" label={`h=${dec(h, 3)}`} />
            <Html x={1330} y={330} size={18} anchor="left" color={C.muted}>
              <span>
                h=1 → 9 MW
                <br />h=0,5 → 8 MW
                <br />h=0,1 → 7,2 MW
                <br />h=0,01 → 7,02 MW
              </span>
            </Html>
          </>
        )}
      </Stage>
    );
  }
  if (beat === 2) {
    // magnifier around (1, 5): the window shrinks by `zoom`
    const half = 0.5 / zoom;
    const Z = plane([1 - half, 1 + half], [5 - 7 * half * 1.1, 5 + 7 * half * 1.1], { x: 360, y: 130, w: 880, h: 560 });
    return (
      <Stage ref={svg}>
        <rect x={360} y={130} width={880} height={560} fill="#0a0818" stroke={C.line} />
        <Curve P={Z} f={E} a={1 - half} b={1 + half} color={C.cyan} width={5} />
        <SlopeLine P={Z} a={1} ya={5} m={7} x0={1 - half} x1={1 + half} color={C.green} width={2} dashed />
        <Dot x={Z.x(1)} y={Z.y(5)} r={8} color={C.amber} />
        <Html x={800} y={110} size={20} color={C.muted}>
          <span>
            Lupa ×{zoom} alrededor de t = 1 h · ventana de {dec(2 * half * 60, 1)} minutos
          </span>
        </Html>
        <line x1={400} x2={1200} y1={780} y2={780} stroke={C.line} strokeWidth={3} />
        <rect x={380} y={750} width={840} height={60} fill="transparent" onPointerDown={onZ} style={{ cursor: 'ew-resize' }} />
        <Knob x={400 + ((zoom - 1) / 49) * 800} y={780} onPointerDown={onZ} cursor="ew-resize" label={`×${zoom}`} />
      </Stage>
    );
  }
  return (
    <Stage>
      <Axes P={P} xTicks={X_T} yTicks={Y_T} xLabel="t\ (\text{h})" yLabel="E\ (\text{MWh})" grid />
      <Curve P={P} f={E} a={0} b={2.2} color={C.cyan} width={4} />
      {beat === 3 ? (
        <>
          <Tangent P={P} f={E} a={1} m={7} half={0.8} color={C.green} />
          <Html x={1330} y={260} size={24} anchor="left" color={C.text}>
            <Tex tex="\dfrac{E(1+h)-E(1)}{h}=7+2h" />
          </Html>
        </>
      ) : (
        <>
          <Tangent P={P} f={E} a={1.5} m={9} half={0.7} color={C.green} />
          {answer !== null && (
            <Html x={1330} y={260} size={24} anchor="left" color={C.green}>
              <Tex tex="E'(1{,}5)=9\ \tfrac{\text{MWh}}{\text{h}}=9\ \text{MW}" />
            </Html>
          )}
        </>
      )}
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
function Meter({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    const a = pick(r, [1, 1.5, 2, 2.5, 3]);
    const b = randInt(r, 1, 4);
    const f = (t: number) => a * t * t + b * t;
    const t1 = pick(r, [0.5, 1]);
    const t2 = t1 + pick(r, [0.5, 1]);
    const t0 = pick(r, [0.5, 1, 1.5]);
    const c = pick(r, [2, 3, 4, 5]);
    const k = pick(r, [1, 2, 3, 4]);
    return { a, b, f, t1, t2, t0, c, k };
  }, [seed]);
  const ymax = data.f(2.2);
  const Q = plane([0, 2.2], [0, Math.ceil(ymax / 5) * 5], { x: 300, y: 130, w: 1000, h: 540 });
  const yt = Array.from({ length: Math.ceil(ymax / 5) }, (_, i) => (i + 1) * 5);
  const [m, setM] = useState(1);
  const onM = useSvgDrag(svg, (_x, y) => {
    const yy = Q.inv(0, y)[1];
    setM(Math.round(((yy - data.f(data.t0)) / 0.6) * 10) / 10);
  });
  const [val, setVal] = useState('');
  const fmtE = `E(t)=${data.a === 1 ? '' : nt(data.a, 1)}t^2+${data.b === 1 ? '' : data.b}t`;

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Medidor del alimentador 4. ¿Cuál fue la potencia media de la carga entre $t=${nt(data.t1, 1)}$ h y $t=${nt(data.t2, 1)}$ h?`, '\\bar P=\\frac{E(t_2)-E(t_1)}{t_2-t_1}');
      api.hints(['Lee la energía en los dos instantes marcados.', 'Diferencia de energía dividida por la diferencia de tiempo.']);
    } else if (round === 1) {
      api.prompt(`Gira la recta blanca hasta que sea tangente a la curva en $t=${nt(data.t0, 1)}$ h. Su pendiente es la potencia en ese instante.`, `E'(${nt(data.t0, 1)})`);
      api.hints(['Una tangente toca la curva sin cruzarla cerca del punto.', 'Si la recta corta la curva a la derecha del punto, es demasiado empinada... o le falta.']);
    } else {
      api.prompt(`Otro medidor registra $E(t)=${data.c}t^2$. Con el cociente $\\frac{E(t+h)-E(t)}{h}$, calcula la potencia instantánea en $t=${data.k}$ h.`, `E'(${data.k})=\\lim_{h\\to0}\\frac{E(${data.k}+h)-E(${data.k})}{h}`);
      api.hints([`$E(${data.k}+h)=${data.c}(${data.k}+h)^2=${data.c * data.k * data.k}+${2 * data.c * data.k}h+${data.c}h^2$.`, `El cociente queda $${2 * data.c * data.k}+${data.c}h$. Ahora $h\\to0$.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      const t = 2 * data.a * data.t0 + data.b;
      if (Math.abs(m - t) / t <= 0.06) return api.result(true, `Pendiente ${nt(m, 1)}; la exacta es $E'(${nt(data.t0, 1)})=${nt(t, 2)}$ MW.`);
      return api.result(false, `Con pendiente ${dec(m, 1)} la recta ${m > t ? 'sube más rápido que la curva' : 'sube más lento que la curva'} en ese punto: ${m > t ? 'bájala' : 'súbela'}.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      const { f, t1, t2 } = data;
      const t = (f(t2) - f(t1)) / (t2 - t1);
      if (Math.abs(v - t) < 0.01) return api.result(true, `$\\frac{${nt(f(t2))}-${nt(f(t1))}}{${nt(t2 - t1, 1)}}=${nt(t)}$ MW.`);
      if (Math.abs(v - (f(t2) - f(t1))) < 0.01) return api.result(false, `${dec(f(t2) - f(t1), 2)} MWh es la energía consumida. La potencia media divide por el tiempo: ${dec(t2 - t1, 1)} h.`);
      return api.result(false, `$E(${nt(t2, 1)})=${nt(f(t2))}$ y $E(${nt(t1, 1)})=${nt(f(t1))}$. Divide la diferencia por ${dec(t2 - t1, 1)} h.`);
    }
    const t = 2 * data.c * data.k;
    if (Math.abs(v - t) < 0.01) return api.result(true, `$\\frac{E(${data.k}+h)-E(${data.k})}{h}=${t}+${data.c}h\\to${t}$ MW.`);
    if (Math.abs(v - data.c * data.k * data.k) < 0.01) return api.result(false, `${data.c * data.k * data.k} MWh es $E(${data.k})$, la energía acumulada. Se pide el ritmo.`);
    return api.result(false, `Desarrolla $(${data.k}+h)^2$, resta $E(${data.k})$, divide por $h$ y deja $h\\to0$.`);
  };

  return (
    <Stage ref={svg}>
      <Axes P={Q} xTicks={[0, 0.5, 1, 1.5, 2]} yTicks={yt} xLabel="t\ (\text{h})" yLabel="E\ (\text{MWh})" grid />
      <Curve P={Q} f={round === 2 ? (t) => data.c * t * t : data.f} a={0} b={2.2} color={C.cyan} width={4} />
      <Html x={1330} y={180} size={24} anchor="left" color={C.cyan}>
        <Tex tex={round === 2 ? `E(t)=${data.c}t^2` : fmtE} />
      </Html>
      {round === 0 &&
        [data.t1, data.t2].map((t) => (
          <g key={t}>
            <Dot x={Q.x(t)} y={Q.y(data.f(t))} r={9} color={C.magenta} />
            <Html x={Q.x(t) - 12} y={Q.y(data.f(t)) - 26} size={18} anchor="right" color={C.magenta}>
              <Tex tex={`E(${nt(t, 1)})=${nt(data.f(t))}`} />
            </Html>
          </g>
        ))}
      {round === 1 && (
        <>
          <SlopeLine P={Q} a={data.t0} ya={data.f(data.t0)} m={m} x0={data.t0 - 0.9} x1={data.t0 + 0.6} color={C.text} width={3} />
          <Dot x={Q.x(data.t0)} y={Q.y(data.f(data.t0))} r={9} color={C.amber} />
          <Knob x={Q.x(data.t0 + 0.6)} y={Q.y(clamp(data.f(data.t0) + m * 0.6, Q.yr[0], Q.yr[1]))} color={C.text} onPointerDown={onM} cursor="ns-resize" />
          <Html x={1330} y={260} size={22} anchor="left" color={C.text}>
            <Tex tex={`m=${nt(m, 1)}`} />
          </Html>
        </>
      )}
      {round !== 1 && <NumberField x={1330} y={420} value={val} onChange={setVal} onEnter={submit} label="MW:" width={4} />}
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w2-c2',
  world: 'differential',
  code: '2.2',
  title: 'Potencia',
  subtitle: 'La derivada',
  glyph: "f'(a)",
  kind: 'level',
  guide: 'teo',
  teaser: 'El medidor acumula energía. La potencia es el ritmo al que crece: la pendiente de la curva en un instante.',
  learn: 'Razón de cambio media como pendiente de una secante, derivada como límite de esas pendientes, recta tangente, linealidad local y unidades de la derivada.',
  glyphs: ['deriv', 'diffq', 'tangent'],
  pitfalls: ['La derivada es un ritmo (MW), no una cantidad acumulada (MWh).', 'La potencia media en un intervalo no es la potencia en un instante.', 'En el cociente de diferencias, primero se simplifica y después $h\\to0$.'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'teo', text: 'Puse un medidor en el alimentador de la carga oculta. Acumula energía: megawatts-hora desde que se conecta.' },
        { who: 'nadia', text: 'Lo que me importa es la potencia: cuántos megawatts está tirando en cada momento.' },
        { who: 'iris', text: 'Energía acumulada y ritmo. Una es la pendiente de la otra.' },
      ],
    },
    {
      kind: 'demo',
      title: 'El medidor',
      Scene: PowerDemo,
      beats: [
        {
          say: 'La curva es la energía acumulada $E(t)$. Entre dos instantes, la potencia media es lo que subió la energía dividido por el tiempo.',
          gate: 'Arrastra el punto rosado hasta t = 2 h.',
          note: { label: 'Potencia media', tex: '\\frac{\\Delta E}{\\Delta t}=\\frac{E(2)-E(1)}{2-1}=9\\ \\text{MW}', body: 'Es la pendiente de la secante entre los dos puntos.' },
        },
        {
          say: 'Pero Nadia quiere la potencia **en** $t=1$, no en promedio. Achica el intervalo.',
          gate: 'Achica h hasta 0,02 o menos.',
          note: { label: 'Derivada', tex: "E'(1)=\\lim_{h\\to0}\\frac{E(1+h)-E(1)}{h}", body: 'Vale 7 MW. Las secantes se acercan a una recta límite, la tangente; su pendiente es la potencia instantánea.' },
        },
        {
          say: 'Mira la curva con una lupa alrededor de $t=1$.',
          gate: 'Sube la lupa hasta ×50.',
          note: { label: 'Recta tangente', tex: "y=E(a)+E'(a)\\,(t-a)", body: 'De cerca, una curva suave es casi recta. Esa recta es la tangente.' },
        },
        {
          say: 'Con la fórmula $E(t)=2t^2+3t$, el cociente se puede simplificar antes de achicar $h$.',
          ask: {
            prompt: 'Si el cociente es $7+2h$, ¿cuál es la potencia en $t=1$?',
            options: ['7 MW', '9 MW', '7,2 MW'],
            answer: 0,
            explain: 'Con $h\\to0$, el término $2h$ desaparece. 9 era la media en una hora y 7,2 la media en seis minutos.',
          },
          note: { label: 'Calcular la derivada', tex: '\\frac{E(1+h)-E(1)}{h}=7+2h\\ \\to\\ 7', body: 'Se desarrolla $2(1+h)^2+3(1+h)-5=7h+2h^2$ y se divide por $h$.' },
        },
        {
          say: 'Hora y media después de conectarse, la tangente tiene pendiente 9.',
          ask: {
            prompt: '¿Qué significa $E\'(1{,}5)=9$?',
            options: ['En ese instante consume energía a 9 MWh por hora', 'Hasta ese momento consumió 9 MWh', 'En la próxima hora consumirá exactamente 9 MWh'],
            answer: 0,
            explain: 'La derivada es un ritmo: unidades de $E$ por unidad de $t$. MWh por hora son MW. No es lo acumulado ni una promesa para la hora siguiente.',
          },
          note: { label: 'Unidades', body: 'Si $E$ está en MWh y $t$ en horas, $E\'$ está en MWh/h = MW.' },
        },
      ],
    },
    { kind: 'challenge', title: 'El medidor', Comp: Meter, rounds: 3 },
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nadia', text: 'Siete megawatts y subiendo. Eso es lo que consume un barrio entero de los cerros.' },
        { who: 'iris', text: 'Quiero la gráfica completa de la potencia. Si la carga tiene un patrón, ahí se va a ver.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'deriv', world: 'differential', tex: "f'(a)", name: 'Derivada', read: 'efe prima de a', meaning: 'Ritmo de cambio instantáneo de $f$ en $a$: pendiente de la tangente.' },
  { id: 'diffq', world: 'differential', tex: '\\frac{f(a+h)-f(a)}{h}', name: 'Cociente de diferencias', read: 'cociente de diferencias', meaning: 'Pendiente de la secante entre $a$ y $a+h$: razón de cambio media.' },
  { id: 'tangent', world: 'differential', tex: "y=f(a)+f'(a)(x-a)", name: 'Recta tangente', read: 'recta tangente', meaning: 'La recta que mejor aproxima a $f$ cerca de $a$.' },
];
