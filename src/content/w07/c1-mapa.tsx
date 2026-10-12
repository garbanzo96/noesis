import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../../engine/anim';
import { useSvgDrag } from '../../engine/hooks';
import { C } from '../../engine/palette';
import { Stage, plane } from '../../engine/Stage';
import { Axes, Dot, Line } from '../../engine/shapes';
import type { ChallengeProps, DemoProps, Glyph, LessonStep, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { ContourMap, Surface, fmt, hill, num, ortho, pair, polynomial, terrain, type V2 } from './kit';

const MAP = plane([-3.2, 3.2], [-3.2, 3.2], { x: 890, y: 180, w: 440, h: 440 });
const SEARCH = plane([-5, 5], [-5, 5], { x: 300, y: 160, w: 600, h: 600 });
const CUTS = [0, 3, 6, 8];
const HEIGHTS = [60, 80, 100, 120, 140];
const uneven = (x: number, y: number) => 9 - (x * x + y * y) * (1 + 0.55 * Math.tanh(x));

function MapLesson({ beats, unlock, reduced }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [point, setPoint] = useState<V2>([0.5, 0.5]);
  const { beat, at } = beats;
  const onPoint = useSvgDrag(svg, (px, py) => {
    const [x, y] = MAP.inv(px, py);
    const p: V2 = [clamp(x, -3, 3), clamp(y, -3, 3)];
    setPoint(p);
    if (Math.abs(hill(...p) - 5) <= 0.15) unlock();
  });
  const P3 = ortho({ cx: 550, cy: 480, scale: 58, zScale: 0.32, azimuth: -0.7 + (beat === 0 && !reduced ? at(0) * 0.8 : 0) });
  const p = P3(...point, hill(...point));
  return <Stage ref={svg}>
    {beat !== 4 && <Surface f={hill} P3={P3} />}
    {beat === 2 && CUTS.map((c, i) => {
      const r = Math.sqrt(9 - c), points = Array.from({ length: 101 }, (_, j) => P3(r * Math.cos(j * Math.PI / 50), r * Math.sin(j * Math.PI / 50), c).join(','));
      const corners: V2[] = [[-3, -3], [3, -3], [3, 3], [-3, 3]];
      return <g key={c} opacity={clamp(at(2) * 4 - i, 0, 1)}>
        <polygon points={corners.map(([x, y]) => P3(x, y, c).join(',')).join(' ')} fill={[C.cyan, C.amber, C.magenta, C.green][i]} fillOpacity={0.05} />
        <polyline points={points.join(' ')} fill="none" stroke={[C.cyan, C.amber, C.magenta, C.green][i]} strokeWidth={3} />
      </g>;
    })}
    <Axes P={MAP} xLabel="x" yLabel="y" />
    <ContourMap P={MAP} f={beat === 4 ? uneven : hill} levels={CUTS} />
    {beat === 1 && <>
      <circle cx={MAP.x(0)} cy={MAP.y(0)} r={2 * MAP.sx} fill="none" stroke={C.green} strokeDasharray="6 8" />
      <Knob x={MAP.x(point[0])} y={MAP.y(point[1])} onPointerDown={onPoint} color={C.amber} r={13} />
      <Dot x={p[0]} y={p[1]} color={C.amber} />
      <Line a={P3(...point, 0)} b={p} color={C.amber} dashed />
      <Cap x={1090} y={680} tex={`h${pair(point)}=${num(hill(...point))}`} color={C.amber} />
    </>}
    <Cap x={550} y={160} tex="h(x,y)=9-x^2-y^2" />
    {beat === 4 && <>
      <Cap x={570} y={320} color={C.cyan}>Curvas juntas: más pendiente.</Cap>
      <Cap x={570} y={400} color={C.green}>Curvas separadas: subida suave.</Cap>
    </>}
    {beat === 5 && <Cap x={820} y={690}>Cada curva reúne puntos de la misma altura.</Cap>}
  </Stage>;
}

const lesson: LessonStep = {
  kind: 'lesson', title: 'Funciones de dos variables y curvas de nivel', Scene: MapLesson,
  beats: [
    { say: 'Mira el cerro mientras gira. Una **función de dos variables** asigna una altura a cada punto del plano.', dur: 4,
      board: { label: 'Superficie', tex: '\\p{1}{\\cC{z}}=\\p{2}{f(\\cA{x},\\cM{y})}', body: 'Dos coordenadas de entrada; un número de salida.' } },
    { say: 'El punto del mapa tiene un punto encima, sobre la superficie. Su altura cambia al arrastrarlo.', gate: 'Arrastra el punto hasta que su altura sea 5; el círculo verde te orienta.',
      board: { label: 'Evaluar', tex: '\\p{1}{h(2,0)}=\\p{2}{9-4-0}=\\p{3}{\\cC{5}}' } },
    { say: 'Corta a alturas fijas: 0, 3, 6 y 8. Cada corte, visto desde arriba, forma una **curva de nivel**.', dur: 4,
      board: { label: 'Curva de nivel', tex: '\\p{1}{\\{(x,y):}\\ \\p{2}{f(x,y)=\\cC{c}\\}}' } },
    { say: 'La ecuación del corte permite reconocer su forma.',
      ask: { prompt: '¿Qué forma tienen las curvas de nivel de $9-x^2-y^2$?', options: ['Círculos centrados en el origen', 'Rectas paralelas', 'Parábolas'], answer: 0, explain: '$9-x^2-y^2=c$ equivale a $x^2+y^2=9-c$. Para $c<9$ son círculos; con $c=9$ queda solo el origen.' },
      board: { label: 'Cerro redondo', tex: '\\p{1}{x^2+y^2}=\\p{2}{9-c}' } },
    { say: 'Este otro terreno tiene curvas desparejas. Entre niveles igualmente espaciados en altura, curvas juntas indican mayor pendiente.',
      ask: { prompt: '¿Dónde conviene subir caminando?', options: ['Donde las curvas están separadas', 'Donde están juntas', 'Da lo mismo'], answer: 0, explain: 'Para subir la misma altura recorres más distancia horizontal: la pendiente es menor.' },
      board: { label: 'Leer la pendiente', tex: '\\p{1}{\\text{curvas juntas}}\\Rightarrow\\p{2}{\\text{más pendiente}}' } },
    { say: 'El mapa reúne los cortes de la superficie vistos desde arriba. Una curva entera representa una sola altura.', dur: 2.4,
      board: { label: 'Mapa de alturas', tex: '\\p{1}{z=f(x,y)}\\longrightarrow\\p{2}{f(x,y)=c}' } },
  ],
};

function LastPosition({ beats, answer }: DemoProps) {
  const show = beats.beat > 0 || answer !== null;
  return <Stage>
    <Axes P={SEARCH} xLabel="\\text{este}" yLabel="\\text{norte}" />
    <ContourMap P={SEARCH} f={terrain} levels={HEIGHTS} />
    {[-1, 1].map((sign) => <g key={sign}>
      <Dot x={SEARCH.x(sign * 3)} y={SEARCH.y(Math.sqrt(8))} color={show ? C.green : C.amber} />
      <Cap x={SEARCH.x(sign * 3)} y={SEARCH.y(Math.sqrt(8)) + 32}>{sign > 0 ? 'Este' : 'Oeste'}</Cap>
    </g>)}
    <Dot x={SEARCH.x(4.5)} y={SEARCH.y(0)} color={C.magenta} />
    <Cap x={SEARCH.x(4.5)} y={SEARCH.y(0) + 34} size={18}>Antena</Cap>
    <Cap x={1250} y={250} tex="\\text{altitud: }120\\,\\mathrm m" />
    <Cap x={1250} y={320} tex="\\text{sobre el suelo: }20\\,\\mathrm m" />
    {show && <Cap x={1250} y={410} tex="120-20=100\\,\\mathrm m" color={C.green} />}
    {beats.beat === 1 && answer !== null && <Cap x={1250} y={490} color={C.amber}>La señal viene del este.</Cap>}
  </Stage>;
}

function MapPractice({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed * 71 + round);
    const poly = polynomial(pick(r, [1, 2, -1]), pick(r, [-2, -1, 1, 3]), pick(r, [-2, -1, 1, 2]), randInt(r, 1, 6));
    const p: V2 = [randInt(r, -2, 3), randInt(r, -2, 2)];
    const a = randInt(r, 12, 30), delta = pick(r, [2, 5, 8, 10, 13]);
    const lo = randInt(r, 3, 7) * 20;
    return { poly, p, a, c: a - delta, lo };
  }, [seed, round]);
  const [val, setVal] = useState('');
  const { poly, p, a, c, lo } = data;
  useEffect(() => {
    setVal('');
    if (round === 0) {
      api.prompt(`Evalúa $f(x,y)=${poly.tex}$ en $${pair(p)}$.`, `f${pair(p)}`);
      api.hints(['Reemplaza cada x y cada y por la coordenada que corresponde.', 'En el término xy multiplica ambas coordenadas; eleva al cuadrado antes de aplicar el signo del coeficiente.']);
    } else if (round === 1) {
      api.prompt(`Para $f(x,y)=${a}-x^2-y^2$, escribe el radio de la curva de nivel $c=${c}$ con dos decimales.`, `x^2+y^2=${a}-${c}`);
      api.hints(['Compara con la ecuación de un círculo: $x^2+y^2=r^2$.', `El radio es $\\sqrt{${a - c}}$.`]);
    } else {
      api.prompt('Las curvas del mapa están separadas por 20 m de altura. Estima la altura del punto a medio camino entre las dos curvas marcadas (interpolación lineal).');
      api.hints(['El punto está a la mitad del intervalo.', `Calcula el promedio de ${lo} m y ${lo + 20} m.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, round]);
  const submit = () => {
    const v = parseNum(val); if (v === null) return;
    const t = round === 0 ? poly.f(...p) : round === 1 ? Math.sqrt(a - c) : lo + 10;
    if (Math.abs(v - t) <= (round === 2 ? 3 : 0.011)) return api.result(true, round === 0 ? `$f${pair(p)}=${num(t)}$.` : round === 1 ? `$r=\\sqrt{${a - c}}\\approx${num(t)}$.` : `Altura estimada: ${fmt(t)} m.`);
    if (round === 0 && Math.abs(v - poly.f(p[1], p[0])) < 0.01) return api.result(false, 'Intercambiaste x e y. La primera coordenada reemplaza x; la segunda, y.');
    if (round === 1 && Math.abs(v - (a - c)) < 0.01) return api.result(false, 'Ese es el radio al cuadrado. Falta sacar la raíz.');
    if (round === 1 && Math.abs(v - Math.sqrt(a + c)) < 0.011) return api.result(false, 'Al despejar queda $x^2+y^2=a-c$: resta el nivel, no lo sumes.');
    if (round === 2 && (v === lo || v === lo + 20)) return api.result(false, 'Elegiste una curva. El punto está a medio camino: toma el promedio de ambas alturas.');
    return api.result(false, round === 0 ? 'Revisa los cuadrados y el signo de cada término; calcula también el producto xy.' : round === 1 ? 'Despeja el radio al cuadrado y saca la raíz; redondea al final.' : 'Suma las alturas de las dos curvas y divide por dos.');
  };
  const P = plane([0, 4], [0, 4], { x: 350, y: 210, w: 460, h: 460 });
  const linear = useMemo(() => (_x: number, y: number) => lo + 20 * y, [lo]);
  return <Stage>
    {round === 0 && <><Surface f={poly.f} P3={ortho({ scale: 45, zScale: 0.12 })} /><Cap x={690} y={160} tex={`f(x,y)=${poly.tex}`} /><Cap x={690} y={650} tex={`P=${pair(p)}`} /></>}
    {round === 1 && <><ContourMap P={SEARCH} f={(x, y) => a - x * x - y * y} levels={[c]} /><Cap x={650} y={150} tex={`f(x,y)=${a}-x^2-y^2`} /></>}
    {round === 2 && <><ContourMap P={P} f={linear} levels={[lo, lo + 20, lo + 40, lo + 60, lo + 80]} /><Dot x={P.x(2)} y={P.y(0.5)} color={C.amber} /><Cap x={P.x(2)} y={P.y(0.5) - 28} color={C.amber}>Punto a la mitad</Cap></>}
    <NumberField x={1060} y={400} label={round === 0 ? 'f =' : round === 1 ? 'r =' : 'altura ='} unit={round === 2 ? 'm' : undefined} value={val} onChange={setVal} onEnter={submit} />
    <Confirm onClick={submit} />
  </Stage>;
}

export const level: LevelSpec = {
  id: 'w7-c1', world: 'multivariate', code: '7.1', title: 'El mapa', subtitle: 'Funciones de dos variables y curvas de nivel', glyph: 'f(x,y)', kind: 'level', guide: 'tomas',
  teaser: 'El último registro del dron da su altitud y su distancia al suelo. Hay dos puntos posibles entre los cerros.',
  learn: 'Evaluar funciones de dos variables, reconocer superficies y leer curvas de nivel.', glyphs: ['mv-function', 'mv-contour'],
  pitfalls: ['La altitud del dron incluye su distancia al suelo: hay que restarla para hallar el terreno.', 'En $a-x^2-y^2=c$, el radio es $\\sqrt{a-c}$.', 'Curvas juntas indican más pendiente solo al comparar intervalos iguales de altura.'],
  steps: [
    { kind: 'scene', place: 'cerros', lines: [
      { who: 'nar', text: 'Cuartel de Bomberos de Cerro Barón, 05:30. Huele a café recalentado; las radios siguen encendidas.' },
      { who: 'tomas', text: 'Tomás Leiva, bombero y piloto de rescate. Su dron marcó 120 metros de altitud y 20 sobre el suelo antes de cortarse.' },
      { who: 'iris', text: 'Del Archivo salieron 140 dosis hacia Halcón Drones. Ese chip sabe dónde las dejaron.' },
      { who: 'tomas', text: 'Tengo dos marcas posibles y lluvia para toda la noche. El café alcanza; el tiempo, menos.' },
      { who: 'iris', text: 'Ubica el suelo bajo esa señal. No pienso registrar dos cerros a ciegas.' },
    ] },
    { kind: 'demo', title: 'La última posición', Scene: LastPosition, beats: [
      { say: 'El dron volaba a 120 m de altitud y a 20 m del suelo. El mapa marca alturas de 60, 80, 100, 120 y 140 m.',
        ask: { prompt: '¿Sobre qué curva estaba?', options: ['La de 100 m', 'La de 120 m', 'La de 140 m'], answer: 0, explain: 'Altura del suelo: $120-20=100$ m. La altitud del dron está por encima del terreno.' }, note: { label: 'Altura del suelo', tex: '120-20=100\\,\\mathrm m' } },
      { say: 'Los dos puntos marcados pertenecen a la curva de 100 m. La antena que recibió la última señal está al este.',
        ask: { prompt: '¿Cuál de los dos puntos marcados corresponde a la señal?', options: ['El del este', 'El del oeste', 'Los dos por igual'], answer: 0, explain: 'La altura deja dos candidatos; la antena del este permite elegir el punto oriental.' }, note: { label: 'Última posición', tex: 'f(x,y)=100', body: 'El punto del este coincide con la antena que recibió la señal.' } },
    ] },
    { kind: 'challenge', title: 'Leer el terreno', Comp: MapPractice, rounds: 3 },
    { kind: 'scene', place: 'cerros', lines: [
      { who: 'nar', text: 'Tomás despliega el mapa sobre el capó mojado; una gota corre por el sendero marcado.' },
      { who: 'tu', text: 'El punto del este. El suelo estaba a 100 metros.' },
      { who: 'iris', text: '¿Lo encontramos ahí?' },
      { who: 'tomas', text: 'Ahí empieza el sendero a la quebrada. Un dron no se queda quieto en una ladera mojada.' },
    ] },
  ],
};
export { lesson };
export const glyphs: Glyph[] = [
  { id: 'mv-function', world: 'multivariate', tex: 'z=f(x,y)', name: 'Función de dos variables', read: 'zeta igual a efe de equis e i', meaning: 'Asigna un número a cada punto de su dominio en el plano; su gráfica es una superficie.' },
  { id: 'mv-contour', world: 'multivariate', tex: 'f(x,y)=c', name: 'Curva de nivel', read: 'efe de equis e i igual a ce', meaning: 'Conjunto de puntos del plano donde la función tiene el mismo valor.' },
];
