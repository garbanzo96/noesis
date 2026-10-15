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
import { pick, rng, randInt } from '../shared/rng';
import { Confirm, Knob, NumberField, parseNum } from '../shared/ui';
import { fmt, tnum, kl2 } from './kit';

const REAL = [0.25, 0.25, 0.25, 0.25];
const MODEL = [0.4, 0.1, 0.1, 0.4];
const SECTORS = ['Norte', 'Centro', 'Sur', 'Bahía'];
const LOT = 200;
const KL = kl2(REAL, MODEL);
const chiSquare = (obs: number[], exp: number[]) =>
  obs.reduce((sum, o, i) => sum + (o - exp[i]) ** 2 / exp[i], 0);

/** Datos de entrada solamente: las alturas comparten escala, sin resultados calculados. */
function CityDrawing({ p, q, total }: { p: number[]; q: number[]; total?: number }) {
  return (
    <g>
      <Cap x={550} y={90} size={23}>
        Celeste: modelo · ámbar: registros
      </Cap>
      <line x1={150} x2={950} y1={600} y2={600} stroke={C.line} strokeWidth={3} />
      {SECTORS.map((sector, i) => {
        const x = 230 + i * 210;
        return (
          <g key={sector}>
            <Cap x={x} y={170} size={22} color={C.cyan}>
              {total === undefined ? `q = ${fmt(q[i])}` : `E = ${fmt(total * q[i], 0)}`}
            </Cap>
            <Cap x={x} y={240} size={22} color={C.amber}>
              {total === undefined ? `p = ${fmt(p[i])}` : `O = ${fmt(total * p[i], 0)}`}
            </Cap>
            <rect
              x={x - 65}
              y={600 - q[i] * 780}
              width={55}
              height={q[i] * 780}
              rx={6}
              fill={C.cyan}
              fillOpacity={0.55}
            />
            <rect
              x={x + 10}
              y={600 - p[i] * 780}
              width={55}
              height={p[i] * 780}
              rx={6}
              fill={C.amber}
              fillOpacity={0.85}
            />
            <Cap x={x} y={655} size={22}>
              {sector}
            </Cap>
          </g>
        );
      })}
      <Cap x={550} y={735} size={21} color={C.muted}>
        {total === undefined
          ? 'Cuatro sectores · cada distribución suma 1'
          : `${total} registros · mismo total en ambas series`}
      </Cap>
    </g>
  );
}

function ModelLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [middle, setMiddle] = useState(0.1);
  const { beat } = beats;
  const q = beat === 1 ? [0.5 - middle, middle, middle, 0.5 - middle] : MODEL;
  const drag = useSvgDrag(svg, (x) => {
    if (beat !== 1) return;
    const value = Math.round((0.1 + clamp((x - 1100) / 300, 0, 1) * 0.15) * 100) / 100;
    setMiddle(value);
    if (value === 0.25) unlock();
  });
  return (
    <Stage ref={svg}>
      <CityDrawing p={REAL} q={q} total={beat >= 3 ? LOT : undefined} />
      <Cap x={1250} y={170} size={21}>
        {beat >= 3 ? 'Conteos: O = Np; E = Nq' : 'p: registros · q: modelo'}
      </Cap>
      {beat === 0 && (
        <Cap x={1250} y={280} size={21}>
          Compara sector por sector.
        </Cap>
      )}
      {beat === 1 && (
        <>
          <Cap
            x={1250}
            y={280}
            tex={`q_{\\text{Centro}}=q_{\\text{Sur}}=${tnum(middle)}`}
            size={20}
          />
          <Cap
            x={1250}
            y={390}
            tex={`KL=${tnum(kl2(REAL, q), 3)}\\ \\text{bits}`}
            color={C.green}
          />
          <line x1={1100} x2={1400} y1={610} y2={610} stroke={C.line} strokeWidth={4} />
          <Knob x={1100 + ((middle - 0.1) / 0.15) * 300} y={610} axis="x" onPointerDown={drag} />
          <Cap x={1100} y={700} size={19}>
            0,10
          </Cap>
          <Cap x={1400} y={700} size={19}>
            0,25
          </Cap>
        </>
      )}
      {beat === 2 && (
        <>
          <Cap x={1250} y={280} tex="KL(p\Vert q)=\sum_i p_i\log_2\frac{p_i}{q_i}" size={20} />
          {answer !== null && (
            <Cap
              x={1250}
              y={390}
              tex={`KL(p\\Vert q)\\approx${tnum(KL)}\\ \\text{bits}`}
              color={C.green}
            />
          )}
        </>
      )}
      {beat >= 3 && (
        <>
          <Cap x={1250} y={280} tex="\chi^2=\sum_i\frac{(O_i-E_i)^2}{E_i}" size={23} />
          <Cap x={1250} y={390} size={21}>
            Cuadrado de la diferencia.
          </Cap>
          <Cap x={1250} y={500} size={21}>
            Divide por el esperado.
          </Cap>
          {beat === 4 && (
            <Cap x={1250} y={610} size={20}>
              El tamaño del lote importa.
            </Cap>
          )}
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Comparar el mapa con los registros',
  Scene: ModelLesson,
  beats: [
    {
      say: 'Cada par de barras muestra un sector: q es la proporción del modelo y p la de los registros. Aquí los registros reparten un cuarto en cada sector.',
      board: { label: 'Dos distribuciones', tex: '\\p{1}{\\sum_i p_i}=\\p{2}{\\sum_i q_i}=\\p{3}{1}' },
    },
    {
      say: 'La **divergencia KL** mide cuánto se aleja q de p, dando peso según p. Acerca el modelo a los registros: Centro y Sur ganan lo que Norte y Bahía ceden.',
      gate: 'Arrastra la perilla hasta 0,25 para que las cuatro proporciones del modelo coincidan con los registros.',
      board: { label: 'Coincidencia', tex: '\\p{1}{p}=\\p{2}{q}\\Rightarrow\\p{3}{ KL(p\\Vert q)}=\\p{4}{0}' },
    },
    {
      say: 'Vuelve el modelo original: 0,4; 0,1; 0,1; 0,4. Calcula cada término con logaritmo en base 2 y suma, incluidos los términos negativos.',
      ask: {
        prompt: '¿Cuánto vale KL(p‖q) para los registros parejos?',
        options: ['0,32 bits', '0 bits', '0,28 bits'],
        answer: 0,
        explain:
          '0,5 · log₂(0,625) + 0,5 · log₂(2,5) = 0,3219 bits. El 0,28 resulta de invertir p y q; KL tiene dirección.',
      },
      board: { label: 'KL en bits', tex: '\\p{1}{KL(p\\Vert q)}=\\p{2}{\\sum_i p_i\\log_2\\frac{p_i}{q_i}}' },
    },
    {
      say: 'Para **χ²**, pasa de proporciones a conteos: multiplica por el total N. En un lote de 200, el modelo espera 80, 20, 20 y 80; se observan 50 en cada sector.',
      board: {
        label: 'De proporciones a conteos',
        tex: '\\p{1}{O_i}=\\p{2}{Np_i},\\quad\\p{3}{ E_i}=\\p{4}{Nq_i},\\quad\\p{5}{\\chi^2}=\\p{6}{\\sum_i\\frac{(O_i-E_i)^2}{E_i}}',
      },
    },
    {
      say: 'KL conserva su valor si multiplicas todos los conteos por el mismo factor; χ² crece con el tamaño del lote. Una discrepancia pide revisar el modelo y los registros: por sí sola no identifica a quien los alteró.',
      board: {
        label: 'Tamaño del lote',
        tex: '\\p{1}{\\chi^2}=\\p{2}{N\\sum_i\\frac{(p_i-q_i)^2}{q_i}}',
        body: 'Para usar una prueba de ajuste, revisa independencia, conteos esperados suficientes y un modelo fijado antes de observar el lote.',
      },
    },
  ],
};

function CityDemo({ beats, answer }: DemoProps) {
  return (
    <Stage>
      <CityDrawing p={REAL} q={MODEL} total={beats.beat === 1 ? LOT : undefined} />
      <Cap x={1250} y={170} size={22}>
        {beats.beat === 0 ? 'Modelo guardado en el servidor' : 'Lote de auditoría: 200'}
      </Cap>
      <Cap x={1250} y={280} size={21}>
        {beats.beat === 0 ? 'Logaritmos en base 2.' : 'Suma los cuatro sectores.'}
      </Cap>
      {answer !== null &&
        (beats.beat === 0 ? (
          <>
            <Cap
              x={1250}
              y={390}
              tex={`KL(p\\Vert q)\\approx${tnum(KL)}\\ \\text{bits}`}
              color={C.green}
            />
            <Cap x={1250} y={500} size={21}>
              El modelo carga los extremos.
            </Cap>
          </>
        ) : (
          <>
            <Cap x={1250} y={390} tex="\chi^2=2\frac{30^2}{80}+2\frac{30^2}{20}" size={21} />
            <Cap x={1250} y={500} tex="\chi^2=112{,}5" color={C.green} />
          </>
        ))}
    </Stage>
  );
}

function ModelPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 947 + round);
    const edge = pick(r, [0.1, 0.15, 0.2, 0.3, 0.35, 0.4]);
    const q = [edge, 0.5 - edge, 0.5 - edge, edge];
    const total = pick(r, [100, 200, 400, 800]);
    const sector = randInt(r, 0, 3);
    const obs = REAL.map((p) => total * p);
    const exp = q.map((v) => total * v);
    return { q, total, sector, obs, exp, divergence: kl2(REAL, q), chi: chiSquare(obs, exp) };
  }, [seed, round]);
  const [input, setInput] = useState('');
  useEffect(() => {
    setInput('');
    api.prompt(
      [
        'Calcula KL(p‖q) para las proporciones de la pantalla, en bits. Escribe dos decimales.',
        `El lote tiene ${d.total} registros. ¿Cuántos espera el modelo en ${SECTORS[d.sector]}? Usa la proporción q de ese sector.`,
        `Calcula χ² para los ${d.total} registros del lote. Usa los conteos O y E de los cuatro sectores; escribe dos decimales.`,
      ][round],
      [
        'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}',
        'E_i=Nq_i',
        '\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i}',
      ][round],
    );
    api.hints(
      [
        [
          'Cada p vale 0,25; usa p/q dentro del logaritmo en base 2.',
          'Multiplica cada logaritmo por 0,25 y suma los cuatro términos, con su signo.',
        ],
        [
          'El esperado usa q, la proporción del modelo.',
          `Multiplica ${d.total} por q del sector ${SECTORS[d.sector]}.`,
        ],
        [
          'En cada sector calcula la diferencia O − E y elévala al cuadrado.',
          'Divide cada cuadrado por E del mismo sector y suma los cuatro resultados.',
        ],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const n = parseNum(input);
    if (n === null || !Number.isFinite(n)) return;
    const near = (v: number) => Math.abs(n - v) <= 0.0051;
    const target = [d.divergence, d.exp[d.sector], d.chi][round];
    if (near(target))
      return api.result(
        true,
        [
          `$KL(p\\Vert q)\\approx${tnum(d.divergence)}\\ \\text{bits}$. Se pondera con p y se usa log₂.`,
          `$E=${d.total}\\cdot${tnum(d.q[d.sector])}=${tnum(d.exp[d.sector], 0)}$ registros en ${SECTORS[d.sector]}.`,
          `$\\chi^2\\approx${tnum(d.chi)}$. Cada diferencia se eleva al cuadrado y se divide por su esperado.`,
        ][round],
      );
    if (round === 0) {
      if (near(kl2(d.q, REAL)))
        return api.result(
          false,
          'Invertiste la dirección: aquí se pide KL(p‖q). Pondera con p y usa p/q.',
        );
      if (near(d.divergence * Math.LN2))
        return api.result(
          false,
          'Usaste logaritmo natural. Para responder en bits, usa logaritmo en base 2.',
        );
      if (near(d.divergence * 4))
        return api.result(false, 'Falta el peso p = 0,25 delante de cada logaritmo.');
      if (near(0))
        return api.result(
          false,
          'Ambas distribuciones suman 1, pero sus sectores difieren. KL solo vale cero cuando coinciden.',
        );
      return api.result(
        false,
        'Suma los cuatro términos p · log₂(p/q), conservando el signo de cada término.',
      );
    }
    if (round === 1) {
      if (near(d.obs[d.sector]))
        return api.result(
          false,
          'Usaste p y calculaste el observado. El esperado del modelo usa q.',
        );
      if (near(d.q[d.sector]))
        return api.result(
          false,
          'Esa es la proporción. Multiplícala por el total del lote para obtener registros.',
        );
      if (near(d.exp[d.sector] * 100))
        return api.result(
          false,
          'Usaste el porcentaje como número entero: 40 % se multiplica como 0,4.',
        );
      return api.result(
        false,
        `Multiplica el total del lote por q del sector ${SECTORS[d.sector]}.`,
      );
    }
    const rawSquares = d.obs.reduce((sum, o, i) => sum + (o - d.exp[i]) ** 2, 0);
    const noSquare = d.obs.reduce((sum, o, i) => sum + Math.abs(o - d.exp[i]) / d.exp[i], 0);
    if (near(d.chi / d.total))
      return api.result(
        false,
        'Calculaste con proporciones. χ² usa conteos: multiplica ese resultado por el total N.',
      );
    if (near(rawSquares))
      return api.result(false, 'Falta dividir cada cuadrado por el esperado E de su sector.');
    if (near(noSquare) || near(0))
      return api.result(
        false,
        'Eleva cada diferencia al cuadrado antes de dividir. Las diferencias con signo no deben cancelarse.',
      );
    return api.result(false, 'Calcula (O − E)²/E en cada uno de los cuatro sectores y suma.');
  };
  return (
    <Stage>
      <CityDrawing p={REAL} q={d.q} total={round === 2 ? d.total : undefined} />
      <Cap x={1250} y={170} size={23}>
        {round === 0 ? 'Comparación en bits' : `Total N = ${d.total}`}
      </Cap>
      <Cap x={1250} y={280} size={21}>
        {round === 1 ? `Sector: ${SECTORS[d.sector]}` : 'Incluye los cuatro sectores.'}
      </Cap>
      <Cap x={1250} y={390} size={20}>
        {round === 1 ? 'Respuesta en registros.' : 'Redondea a dos decimales.'}
      </Cap>
      <NumberField
        x={1070}
        y={520}
        value={input}
        onChange={setInput}
        onEnter={submit}
        label={['KL =', 'E =', 'χ² ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w14-c8',
  world: 'active',
  code: '14.8',
  title: 'El modelo de la ciudad',
  subtitle: 'KL y χ²',
  glyph: 'KL(p\\Vert q)',
  kind: 'level',
  guide: 'iris',
  teaser: 'El servidor de Halcón reparte la ciudad de una manera que los registros no sostienen.',
  learn:
    'Comparar distribuciones con KL en bits y calcular χ² a partir de conteos observados y esperados.',
  glyphs: ['tor-city-kl', 'tor-city-chi2', 'tor-city-expected'],
  pitfalls: [
    'KL(p‖q) usa p como peso y p/q dentro del logaritmo; invertirlos cambia el valor.',
    'Para bits usa logaritmo en base 2.',
    'χ² usa conteos, diferencias al cuadrado y el esperado como denominador.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'El último descanso antes del piso 40 huele a cable caliente; en una pantalla, Norte y Bahía ocupan casi todo el mapa de recursos.',
        },
        {
          who: 'teo',
          text: 'El sistema lee los registros, pero reparte con otra tabla. Halcón le asignó cuatro décimos a cada extremo y uno a cada sector del medio.',
        },
        {
          who: 'tu',
          text: 'En los registros hay un cuarto por sector. Esa tabla cambia el destino de los recursos.',
        },
        { who: 'iris', text: 'Cuánto cambia. Con una cifra que podamos llevar arriba.' },
      ],
    },
    {
      kind: 'demo',
      title: 'La tabla que mueve los recursos',
      Scene: CityDemo,
      beats: [
        {
          say: 'El archivo guardado fija q = (0,4; 0,1; 0,1; 0,4), mientras los registros dan p = (0,25; 0,25; 0,25; 0,25). Compara los registros contra ese modelo.',
          ask: {
            prompt: '¿Qué distancia KL(p‖q) queda en el informe?',
            options: ['0,28 bits', '0,32 bits', '0 bits'],
            answer: 1,
            explain:
              'KL(p‖q) = 0,3219 bits aproximadamente. El modelo asigna más recursos a Norte y Bahía, donde Halcón tiene contratos; la suma igual a 1 no elimina la discrepancia.',
          },
          note: {
            label: 'Modelo de Halcón',
            tex: 'KL(p\\Vert q)=0{,}5\\log_2(0{,}625)+0{,}5\\log_2(2{,}5)\\approx0{,}32',
            body: 'Registros parejos frente a un modelo concentrado en Norte y Bahía.',
          },
        },
        {
          say: 'Teo separa un lote de auditoría de 200 registros con la misma distribución: 50 por sector. El modelo esperaba 80, 20, 20 y 80.',
          ask: {
            prompt: '¿Cuánto vale χ² al sumar los cuatro sectores?',
            options: ['0,5625', '3600', '112,5'],
            answer: 2,
            explain:
              'Dos sectores aportan 900/80 y dos aportan 900/20: total 112,5. El 0,5625 usa proporciones; 3600 omite dividir por los esperados.',
          },
          note: {
            label: 'Lote de auditoría',
            tex: '\\chi^2=2\\frac{(50-80)^2}{80}+2\\frac{(50-20)^2}{20}=112{,}5',
            body: 'La discrepancia requiere revisar el reparto y la procedencia de los registros; el estadístico solo no prueba quién intervino.',
          },
        },
      ],
    },
    { kind: 'challenge', title: 'Auditar otros repartos', Comp: ModelPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'torre',
      lines: [
        {
          who: 'nar',
          text: 'Teo termina la copia; la pantalla deja el mapa a la izquierda y los contratos de Norte y Bahía a la derecha.',
        },
        {
          who: 'teo',
          text: 'Los registros quedaron parejos. La tabla de reparto concentra los recursos justo donde Halcón tiene contratos; guardé ambas versiones y sus fechas.',
        },
        { who: 'iris', text: 'La tabla también lleva firma. Esa va arriba con nosotros.' },
        {
          who: 'nar',
          text: 'Iris guarda el informe de 0,32 bits bajo el brazo; sobre la puerta de vidrio se enciende el número 40.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'tor-city-kl',
    world: 'active',
    tex: 'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}',
    name: 'Divergencia KL en bits',
    read: 'ka ele de pe respecto de cu',
    meaning: 'Compara las proporciones del modelo q con las de los registros p, ponderando por p.',
    warn: 'Tiene dirección: KL(p‖q) y KL(q‖p) pueden diferir.',
  },
  {
    id: 'tor-city-chi2',
    world: 'active',
    tex: '\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i}',
    name: 'Estadístico χ² de ajuste',
    read: 'ji cuadrado',
    meaning:
      'Suma las diferencias al cuadrado entre conteos observados y esperados, divididas por los esperados.',
    warn: 'Usa conteos y E positivo; una discrepancia no identifica por sí sola a un responsable.',
  },
  {
    id: 'tor-city-expected',
    world: 'active',
    tex: 'E_i=Nq_i',
    name: 'Conteo esperado',
    read: 'e sub i igual a ene por cu sub i',
    meaning: 'Convierte la proporción del modelo en el número esperado de registros de un sector.',
    warn: 'El esperado usa q; el observado usa p.',
  },
];

export const ref: TopicRef = {
  defs: [
    {
      label: 'KL en bits',
      tex: 'KL(p\\Vert q)=\\sum_i p_i\\log_2\\frac{p_i}{q_i}',
      body: 'p y q son distribuciones normalizadas. Un término con p = 0 aporta 0; si p > 0 y q = 0, la divergencia es infinita.',
    },
    {
      label: 'Conteos',
      tex: 'O_i=Np_i,\\quad E_i=Nq_i',
      body: 'N es el total del lote; O es observado y E es esperado por el modelo.',
    },
    {
      label: 'χ² de ajuste',
      tex: '\\chi^2=\\sum_i\\frac{(O_i-E_i)^2}{E_i}',
      body: 'Los esperados deben ser positivos. Para la prueba aproximada, usa registros independientes y esperados suficientes, usualmente al menos 5 por categoría.',
    },
  ],
  props: [
    {
      label: 'Cero y dirección',
      tex: 'KL(p\\Vert q)\\geq0,\\quad KL(p\\Vert q)=0\\iff p=q',
      body: 'Los términos individuales pueden ser negativos; la suma es no negativa. Intercambiar p y q puede cambiar el resultado.',
    },
    {
      label: 'Tamaño del lote',
      tex: '\\chi^2=N\\sum_i\\frac{(p_i-q_i)^2}{q_i}',
      body: 'Manteniendo las proporciones, duplicar N duplica χ²; KL en bits queda igual.',
    },
    {
      label: 'Grados de libertad',
      tex: '\\text{g.l.}=k-1=3',
      body: 'Cuatro sectores con proporciones fijadas de antemano y sin parámetros estimados del lote. El estadístico por sí solo no da una probabilidad de culpabilidad.',
    },
    {
      label: 'Informe de la torre',
      tex: 'KL(p\\Vert q)\\approx0{,}3219\\ \\text{bits},\\quad\\chi^2_{N=200}=112{,}5',
      body: 'p = (0,25; 0,25; 0,25; 0,25); q = (0,4; 0,1; 0,1; 0,4). El segundo resultado corresponde al lote explícito de 200 registros.',
    },
  ],
};

export { lesson };
