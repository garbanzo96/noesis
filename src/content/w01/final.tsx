import { useEffect, useMemo, useRef, useState } from 'react';
import { ContainerBox, Truck } from '../../art/props';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot, Line } from '../../engine/shapes';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng, shuffle } from '../shared/rng';
import { Confirm, Knob, NumberField, dec, hhmm, parseNum, thousands } from '../shared/ui';
import { P, ROAD, Road, X_TICKS, Y_TICKS, roadX } from './c3-camion';
import { type Op, Pipeline, apply, inv, num, opLabel, run, show } from './c4-cifrado';

// ============================================================================
// CASO 1.★ · «La noche del Altamar» — repaso del distrito
// Cinco momentos de la noche, cada uno con una herramienta del puerto: intervalos, lectura de
// una gráfica, intersección de rectas, función inversa y logaritmo.
// ============================================================================

const TP = plane([20, 30], [0, 5], { x: 260, y: 140, w: 1100, h: 520 });

function Night({ seed, round, api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const r = rng(seed);
    // 0 · cold chain
    const temps = shuffle(r, [2, 8, 8.1 + randInt(r, 0, 9) / 10, 1.9 - randInt(r, 0, 9) / 10, 4 + randInt(r, 0, 30) / 10, 5 + randInt(r, 0, 20) / 10, 9 + randInt(r, 0, 20) / 10]);
    // 1 · tide: leave before it drops under the draft
    const tide = { m: 2.4 + r() * 0.3, a: 1.4 + r() * 0.4, phi: 21 + r() * 1.5 };
    const draft = pick(r, [2.8, 3, 3.2]);
    // 2 · chase
    const v1 = pick(r, [40, 50]);
    const [v2, t0] = pick(r, [
      [80, 1],
      [100, 1],
      [75, 0.5],
    ] as [number, number][]);
    // 3 · phone
    const a = pick(r, [2, 3, 4, 5]);
    const sub = r() < 0.5;
    const b = sub ? randInt(r, 1, a - 1) : randInt(r, 2, 9);
    const ops: Op[] = sub ? [{ k: 'mul', v: a }, { k: 'sub', v: b }] : [{ k: 'add', v: b }, { k: 'mul', v: a }];
    const tiles = shuffle(r, [...ops.map(inv), ops[0]]);
    // 4 · wipe
    const base = pick(r, [2, 3]);
    const files = pick(r, [10000, 50000, 100000]);
    const mins = Math.ceil(Math.log(files) / Math.log(base) - 1e-9);
    return { temps, tide, draft, v1, v2, t0, ops, tiles, base, files, mins };
  }, [seed]);
  const h = (t: number) => data.tide.m + data.tide.a * Math.cos((2 * Math.PI * (t - data.tide.phi)) / 12.4);
  // the window that contains the high tide after 21:00, and its end
  const leaveBy = useMemo(() => {
    let t = data.tide.phi;
    while (h(t) >= data.draft && t < 30) t += 0.01;
    return t - 0.01;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const [flags, setFlags] = useState<boolean[]>(() => data.temps.map(() => false));
  const [tl, setTl] = useState(24);
  const onTl = useSvgDrag(svg, (x) => setTl(Math.round(clamp(TP.inv(x, 0)[0], 20, 30) * 12) / 12));
  const [t, setT] = useState(0.5);
  const onT = useSvgDrag(svg, (x) => setT(Math.round(clamp(P.inv(x, 0)[0], 0, 4) * 20) / 20));
  const [slots, setSlots] = useState<(number | null)[]>([null, null]);
  const [val, setVal] = useState('');
  const WORD = 'AURORA';
  const codes = useMemo(() => [...WORD].map((c) => run(data.ops, num(c))), [data]);

  useEffect(() => {
    const prompts: [string, string, string[]][] = [
      ['21:00, muelle norte. El Altamar descarga vacunas. Marca los contenedores que rompieron la cadena de frío.', 'T\\notin[2,8]', ['2,0 y 8,0 °C están dentro: el intervalo es cerrado.', 'Fuera: menos de 2 o más de 8.']],
      [`El Altamar quiere zarpar con el resto de la carga. Su calado exige ${dec(data.draft)} m de marea. Arrastra el marcador a la última hora en que todavía puede salir.`, `h(t)\\ge ${dec(data.draft)}`, ['Sigue la curva después del máximo: busca dónde cruza la línea hacia abajo.', `Cerca de las ${hhmm(leaveBy % 24)}.`]],
      [`El Contador huye en un camión a ${data.v1} km/h. La patrulla sale ${data.t0 === 1 ? 'una hora' : 'media hora'} después a ${data.v2} km/h. Mueve el reloj hasta el instante en que lo alcanza.`, `${data.v1}t=${data.v2}(t-${dec(data.t0)})`, ['Se encuentran en el mismo kilómetro a la misma hora.', `$t=\\frac{${data.v2}\\cdot${dec(data.t0)}}{${data.v2}-${data.v1}}$.`]],
      ['En el camión, su teléfono: un mensaje cifrado con la máquina de la bodega. Arma la máquina que lo descifra.', '(g\\circ f)^{-1}=f^{-1}\\circ g^{-1}', ['Deshaz primero el último engranaje.', 'Cada operación se deshace con su contraria.']],
      [`El teléfono activó un borrado: empieza con 1 archivo y se multiplica por ${data.base} cada minuto. Hay ${thousands(data.files)} archivos. ¿En cuántos minutos completa el borrado?`, `${data.base}^{n}\\ge ${thousands(data.files).replace(/ /g, '\\,')}\\iff n\\ge\\log_{${data.base}}${thousands(data.files).replace(/ /g, '\\,')}`, [data.base === 2 ? '$2^{10}\\approx1000$.' : '$3^{5}=243$ y $3^{10}=59\\,049$.', 'Busca el primer $n$ entero con la potencia por encima del total.']],
    ];
    const [p, tex, hs] = prompts[round];
    api.prompt(p, tex);
    api.hints(hs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 0) {
      const out = data.temps.map((v) => v < 2 || v > 8);
      const k = out.findIndex((o, i) => o !== flags[i]);
      if (k < 0) return api.result(true, `${out.filter(Boolean).length} contenedores fuera de $[2,8]$. Rosa los separa.`);
      return api.result(false, `El ${String.fromCharCode(65 + k)}-${k + 1} marca ${dec(data.temps[k])} °C: ${out[k] ? 'está fuera de [2, 8] y debía marcarse' : 'está dentro de [2, 8]'}.`);
    }
    if (round === 1) {
      if (Math.abs(tl - leaveBy) <= 0.15) return api.result(true, `Hasta las ${hhmm(leaveBy % 24)}: después la marea baja de ${dec(data.draft)} m.`);
      return api.result(false, tl > leaveBy ? `A las ${hhmm(tl % 24)} la marea marca ${dec(h(tl), 2)} m: el Altamar ya tocaría fondo.` : `A las ${hhmm(tl % 24)} todavía hay ${dec(h(tl), 2)} m: puede esperar un poco más.`);
    }
    if (round === 2) {
      const tm = (data.v2 * data.t0) / (data.v2 - data.v1);
      if (Math.abs(t - tm) < 0.03) return api.result(true, `A las ${hhmm(21 + tm)}, en el km ${dec(data.v1 * tm)}. Pero el camión está vacío.`);
      const a = data.v1 * t;
      const p = Math.max(0, data.v2 * (t - data.t0));
      return api.result(false, `A las ${hhmm(21 + t)} el camión va en el km ${dec(a)} y la patrulla en el km ${dec(p)}.`);
    }
    if (round === 3) {
      if (slots.some((s) => s === null)) return;
      const ops = slots.map((i) => data.tiles[i!]);
      const ok = codes.every((c, i) => run(ops, c) === num(WORD[i]));
      if (ok) return api.result(true, 'El mensaje dice **AURORA**.');
      const trail = [codes[0]];
      for (const o of ops) trail.push(apply(o, trail[trail.length - 1]));
      return api.result(false, `Con tu máquina, ${trail.map(show).join(' → ')}; debía dar ${num(WORD[0])}.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    if (v === data.mins) return api.result(true, `$${data.base}^{${data.mins}}=${thousands(data.base ** data.mins)}$ supera ${thousands(data.files)}; $${data.base}^{${data.mins - 1}}$ no. Teo corta la red a tiempo.`);
    return api.result(false, `En ${v} minutos se borran $${data.base}^{${v}}=${thousands(data.base ** v)}$ archivos: ${data.base ** v >= data.files ? 'ya está, pero ¿es el primer minuto?' : 'todavía no alcanza'}.`);
  };

  if (round === 0)
    return (
      <Stage ref={svg}>
        {data.temps.map((v, i) => {
          const x = 260 + (i % 4) * 360;
          const y = 300 + Math.floor(i / 4) * 260;
          return <ContainerBox key={i} x={x} y={y} w={220} h={120} id={`${String.fromCharCode(65 + i)}-${i + 1}`} tag={`${dec(v)} °C`} state={flags[i] ? 'flag' : 'idle'} onClick={() => setFlags(flags.map((f, k) => (k === i ? !f : f)))} />;
        })}
        <Confirm onClick={submit} />
      </Stage>
    );
  if (round === 1) {
    const hh = (v: number) => hhmm(v % 24);
    return (
      <Stage ref={svg}>
        <Axes P={TP} xTicks={[20, 22, 24, 26, 28, 30]} yTicks={[1, 2, 3, 4, 5]} xLabel="\text{hora}" yLabel="h\ (\text{m})" grid tickLabels={false} />
        {[20, 22, 24, 26, 28, 30].map((v) => (
          <Html key={v} x={TP.x(v)} y={TP.y(0) + 24} size={15} color={C.dim}>
            <span className="prop-tag">{hh(v)}</span>
          </Html>
        ))}
        <Curve P={TP} f={h} a={20} b={30} color={C.cyan} width={4} />
        <Line a={TP.pt(20, data.draft)} b={TP.pt(30, data.draft)} color={C.amber} dashed width={2.5} />
        <Line a={TP.pt(tl, 0)} b={TP.pt(tl, h(tl))} color={C.text} dashed />
        <Dot x={TP.x(tl)} y={TP.y(h(tl))} r={9} color={h(tl) >= data.draft ? C.green : C.red} />
        <rect x={TP.x(20) - 20} y={TP.y(0) + 40} width={TP.box.w + 40} height={60} fill="transparent" onPointerDown={onTl} style={{ cursor: 'ew-resize' }} />
        <Knob x={TP.x(tl)} y={TP.y(0) + 70} onPointerDown={onTl} cursor="ew-resize" label={hh(tl)} />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  if (round === 2) {
    const a = data.v1 * t;
    const p = Math.max(0, data.v2 * (t - data.t0));
    return (
      <Stage ref={svg}>
        <Road>
          <Truck x={roadX(Math.min(a, ROAD.km))} y={ROAD.y - 4} s={0.7} color={C.magenta} />
          <Truck x={roadX(Math.min(p, ROAD.km))} y={ROAD.y + 22} s={0.55} color={C.red} label="P" />
        </Road>
        <Axes P={P} xTicks={X_TICKS} yTicks={Y_TICKS} xLabel="t\ (\text{h})" yLabel="d\ (\text{km})" grid />
        <Line a={P.pt(0, 0)} b={P.pt(t, a)} color={C.magenta} width={4} />
        {t > data.t0 && <Line a={P.pt(data.t0, 0)} b={P.pt(t, p)} color={C.red} width={4} />}
        <rect x={P.x(0) - 20} y={P.y(0)} width={P.box.w + 40} height={70} fill="transparent" onPointerDown={onT} />
        <Knob x={P.x(t)} y={P.y(0) + 32} onPointerDown={onT} cursor="ew-resize" label={hhmm(21 + t)} />
        <Confirm onClick={submit} />
      </Stage>
    );
  }
  if (round === 3) {
    const built = slots.map((i) => (i === null ? null : data.tiles[i]));
    const firstEmpty = slots.indexOf(null);
    return (
      <Stage ref={svg}>
        <Html x={800} y={150} size={40} color={C.text}>
          <span className="prop-tag">{codes.map(show).join('  ·  ')}</span>
        </Html>
        <Pipeline ops={data.ops} input={num(WORD[0])} x={520} y={330} gap={220} inLabel="A" />
        <Pipeline ops={built} input={codes[0]} x={520} y={540} gap={220} color={C.amber} />
        {slots.map((ti, i) => (
          <rect key={i} x={520 + i * 220 + 110 - 40} y={540 - 76} width={80} height={44} fill="transparent" style={{ cursor: ti === null ? 'default' : 'pointer' }} onClick={() => setSlots(slots.map((v, k) => (k === i ? null : v)))} />
        ))}
        {data.tiles.map((o, i) => {
          const used = slots.includes(i);
          return (
            <g key={i} onClick={() => !used && firstEmpty >= 0 && setSlots(slots.map((v, k) => (k === firstEmpty ? i : v)))} style={{ cursor: used ? 'default' : 'pointer' }} opacity={used ? 0.25 : 1}>
              <rect x={540 + i * 180} y={690} width={150} height={64} rx={10} fill="#1d1733" stroke={C.amber} strokeWidth={2.5} />
              <Html x={615 + i * 180} y={722} size={28} color={C.amber}>
                <span className="prop-tag">{opLabel(o)}</span>
              </Html>
            </g>
          );
        })}
        <Confirm onClick={submit} disabled={slots.some((s) => s === null)} />
      </Stage>
    );
  }
  return (
    <Stage ref={svg}>
      <Html x={800} y={300} size={30} color={C.red}>
        <Tex tex={`1\\to${data.base}\\to${data.base ** 2}\\to${data.base ** 3}\\to\\cdots\\ \\ge ${thousands(data.files).replace(/ /g, '\\,')}`} />
      </Html>
      <NumberField x={560} y={500} value={val} onChange={setVal} onEnter={submit} label="Minutos:" width={4} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w1-final',
  world: 'foundations',
  code: '1.★',
  title: 'La noche del Altamar',
  subtitle: 'Repaso del distrito',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w1-closed',
  guide: 'iris',
  teaser: 'Viernes, nueve de la noche, muelle norte. El Altamar atraca y el Contador está a bordo. Cinco momentos, cinco herramientas.',
  learn: 'Usar juntas las herramientas del distrito: intervalos, lectura de gráficas, rectas que se cruzan, funciones inversas y logaritmos.',
  glyphs: ['interval', 'func', 'slope', 'inverse', 'log'],
  steps: [
    {
      kind: 'scene',
      place: 'puerto',
      lines: [
        { who: 'nar', text: 'Muelle norte, viernes, 21:00; llueve.' },
        { who: 'rosa', text: 'Ya bajan contenedores del Altamar. Algunos llevan horas sin frío; necesito separarlos antes de que salgan.' },
        { who: 'teo', text: 'Vigilo la red, pero si activan otro borrado tendré que cortarla.' },
        { who: 'iris', text: 'El Contador está a bordo. Cada caja que salga mientras revisamos le compra tiempo.' },
      ],
    },
    { kind: 'challenge', title: 'La noche del Altamar', Comp: Night, rounds: 5 },
    {
      kind: 'scene',
      place: 'puerto',
      lines: [
        { who: 'teo', text: 'Corté la red a tiempo y los registros están a salvo. Rosa separó los contenedores fuera de 2 a 8 °C.' },
        { who: 'iris', text: 'La patrulla alcanzó el camión vacío. El Contador saltó a una lancha y dejó el abrigo.' },
        { who: 'teo', text: 'El teléfono decía AURORA; en el bolsillo del abrigo hay una ficha del Casino Aurora. Coinciden.' },
        { who: 'contador', text: 'Mensaje de voz: «Buen trabajo, detective; habría calculado unos minutos menos para alcanzarme. En el casino, la casa fija los números».' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
