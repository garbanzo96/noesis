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

// ============================================================================
// CASO 13.3 · «Saber antes» — valor de la información perfecta (EVPI)
// Contrato de 13.1 con p = 0,2: sin información, lo mejor es comprar (E = 4). Sabiendo antes si
// hay brote: comprar solo con brote, E = 0,2·100 + 0,8·0 = 20. EVPI = 20 − 4 = 16.
// ============================================================================

const SW = { x0: 1120, x1: 1400, y: 660 };

/** decision tree: either decide first (left) or learn the state first (right) */
function InfoTree({ informed, highlight }: { informed: boolean; highlight?: boolean }) {
  const box = (x: number, y: number) => (
    <rect
      x={x - 18}
      y={y - 18}
      width={36}
      height={36}
      fill={C.panel}
      stroke={C.amber}
      strokeWidth={3}
    />
  );
  const dot = (x: number, y: number) => (
    <circle cx={x} cy={y} r={18} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
  );
  const branch = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    col: string = C.line,
  ) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={3} />
      <Cap x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 18} size={17} color={C.muted}>
        {label}
      </Cap>
    </g>
  );
  if (!informed)
    return (
      <g>
        {branch(220, 410, 440, 280, 'comprar', C.amber)}
        {branch(220, 410, 440, 560, 'no comprar')}
        {branch(440, 280, 720, 210, 'brote 0,2')}
        {branch(440, 280, 720, 350, 'sin brote 0,8')}
        {box(220, 410)}
        {dot(440, 280)}
        <Cap x={790} y={210} size={21} color={C.green}>
          +100
        </Cap>
        <Cap x={790} y={350} size={21} color={C.magenta}>
          −20
        </Cap>
        <Cap x={520} y={560} size={21} color={C.text}>
          0
        </Cap>
        <Cap x={440} y={240} size={18} color={C.amber} tex="E=4" />
      </g>
    );
  return (
    <g>
      {branch(220, 410, 440, 270, 'brote 0,2')}
      {branch(220, 410, 440, 550, 'sin brote 0,8')}
      {branch(440, 270, 720, 210, 'comprar', highlight ? C.green : C.amber)}
      {branch(440, 270, 720, 330, 'no')}
      {branch(440, 550, 720, 490, 'comprar')}
      {branch(440, 550, 720, 610, 'no', highlight ? C.green : C.amber)}
      {dot(220, 410)}
      {box(440, 270)}
      {box(440, 550)}
      <Cap x={790} y={210} size={21} color={C.green}>
        +100
      </Cap>
      <Cap x={790} y={330} size={21} color={C.text}>
        0
      </Cap>
      <Cap x={790} y={490} size={21} color={C.magenta}>
        −20
      </Cap>
      <Cap x={790} y={610} size={21} color={C.green}>
        0
      </Cap>
      <Cap x={220} y={360} size={18} color={C.cyan} tex="E=20" />
    </g>
  );
}

function InfoLesson({ beats, unlock, answer }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const { beat } = beats;
  const informed = beat === 0 ? false : beat === 1 ? t > 0.5 : true;
  const drag = useSvgDrag(svg, (x) => {
    const v = clamp((x - SW.x0) / (SW.x1 - SW.x0), 0, 1);
    setT(v);
    if (v > 0.95) unlock();
  });
  return (
    <Stage ref={svg}>
      <InfoTree informed={informed} highlight={beat >= 2} />
      <Cap x={540} y={690} size={20} color={C.muted}>
        {informed
          ? 'Primero se sabe si hay brote; después se decide.'
          : 'Primero se decide; después se sabe si hay brote.'}
      </Cap>
      <Cap x={1270} y={200} tex="\text{sin información}:\ E=4" color={C.amber} />
      {informed && <Cap x={1270} y={290} tex="\text{con información}:\ E=20" color={C.cyan} />}
      {beat === 2 && answer !== null && (
        <Cap x={1270} y={380} tex="\text{EVPI}=20-4=16" color={C.green} />
      )}
      {beat >= 3 && <Cap x={1270} y={380} tex="\text{EVPI}=16" color={C.green} />}
      {beat === 1 && (
        <>
          <line x1={SW.x0} x2={SW.x1} y1={SW.y} y2={SW.y} stroke={C.line} strokeWidth={4} />
          <Cap x={SW.x0 - 44} y={SW.y} size={17} color={C.muted} anchor="right">
            decidir antes
          </Cap>
          <Cap x={SW.x1 + 44} y={SW.y} size={17} color={C.muted} anchor="left">
            saber antes
          </Cap>
          <Knob
            x={SW.x0 + t * (SW.x1 - SW.x0)}
            y={SW.y}
            onPointerDown={drag}
            axis="x"
            color={C.cyan}
          />
        </>
      )}
    </Stage>
  );
}

const lesson: LessonStep = {
  kind: 'lesson',
  title: 'Valor de la información perfecta',
  intro: {
    question: '¿Cuánto vale saber el resultado antes de decidir?',
    text: 'El valor de la información perfecta compara lo que se gana decidiendo sabiendo el resultado con lo que se gana decidiendo antes. Nunca es negativo, y pone un techo a lo que vale cualquier dato. Un anuncio filtrado un día antes vale plata, y Valentina quiere saber cuánta.',
  },
  Scene: InfoLesson,
  beats: [
    {
      say: 'Sin información, debes elegir antes de saber si habrá brote. Comprar tiene un valor esperado de $0{,}2\\cdot100+0{,}8\\cdot(-20)=4$; no comprar vale 0. El **valor esperado** es el promedio ponderado de los resultados según sus probabilidades. Para elegir, compara ambos valores: comprar es la mejor opción y vale 4.',
      board: {
        label: 'Sin información',
        tex: '\\p{1}{\\max(4;\\,0)}=\\p{2}{4}',
        parts: ['mejor opción sin saber', 'valor sin información'],
      },
    },
    {
      say: 'La **información perfecta** revela con certeza si habrá brote antes de decidir. Esto permite elegir una acción para cada resultado posible. En el árbol, cambiar el momento en que recibes la información cambia el orden del azar y la decisión.',
      gate: 'Explora el cambio de orden: mueve la perilla hasta el extremo «saber antes». ¿Qué aparece primero en el árbol cuando conoces el resultado antes de decidir?',
      after:
        'El azar queda antes de la decisión. Con brote conviene comprar y sin brote no comprar: el valor esperado sube de 4 a 20.',
      board: {
        label: 'Con información',
        tex: '\\p{1}{0{,}2\\cdot\\max(100;0)}\\p{2}{+0{,}8\\cdot\\max(-20;0)}=\\p{3}{20}',
        parts: ['aporte si hay brote', 'aporte sin brote', 'valor sabiendo antes'],
      },
    },
    {
      say: 'Con información perfecta, compras si hay brote y no compras si no lo hay. El valor esperado de esas decisiones es $0{,}2\\cdot100+0{,}8\\cdot0=20$.\n\nEl **valor esperado de la información perfecta**, o EVPI, se lee «e ve pe i» y mide cuánto aumenta el valor esperado al saber el resultado antes de elegir. Para calcularlo, resta el valor sin información al valor con información; usar solo este último confunde el valor del dato con el valor total de la decisión.',
      ask: {
        prompt: '¿Cuánto vale saber el resultado antes de decidir?',
        options: ['16 por contrato', '20 por contrato', '4 por contrato'],
        answer: 0,
        explain:
          'Con información vale 20 y sin ella 4: la diferencia, 16, es lo que vale saber antes.',
      },
      board: {
        label: 'EVPI',
        tex: '\\p{1}{\\text{EVPI}}=\\p{2}{E[\\text{con información}]-E[\\text{sin información}]}',
        parts: ['valor de saber antes', 'ganancia por informarse'],
      },
    },
    {
      say: 'El valor esperado de la información perfecta nunca es negativo. La notación $\\ge 0$ se lee «mayor o igual que cero». Con información puedes elegir las mismas acciones que sin ella, así que la mejor decisión informada no puede tener menor valor esperado. Puede valer cero si saber el resultado no cambia la mejor decisión.',
      board: {
        label: 'Propiedad',
        tex: '\\p{1}{\\text{EVPI}\\ge0}',
        parts: ['saber nunca resta valor'],
      },
    },
    {
      say: 'En este ejemplo, saber si habrá brote antes de decidir aumenta el valor esperado en 16 por contrato. Para 1 000 contratos en las mismas condiciones, multiplica $1\\,000\\cdot16=16\\,000$. Esa cifra es un aumento esperado, no una ganancia garantizada: los resultados efectivos dependen de si ocurre el brote.',
      board: {
        label: 'Mil contratos',
        tex: '\\p{1}{1000\\cdot16}=\\p{2}{16\\,000}',
        parts: ['ganancia por mil contratos', 'ganancia total'],
      },
    },
  ],
};

function PriceDemo({ beats, unlock }: DemoProps) {
  const svg = useRef<SVGSVGElement>(null);
  const { beat } = beats;
  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const x0 = 1080, x1 = 1440;
  const drag = useSvgDrag(svg, (x) => {
    const fraction = clamp((x - x0) / (x1 - x0), 0, 1);
    if (beat === 0) {
      const value = fraction * 20;
      setPrice(value);
      if (Math.abs(value - 16) <= 0.5) unlock();
    } else if (beat === 1) {
      const value = fraction * 10000;
      setTotal(value);
      if (Math.abs(value - 8000) <= 250) unlock();
    }
  });
  const value = beat === 0 ? price : total;
  const max = beat === 0 ? 20 : 10000;
  return (
    <Stage ref={svg}>
      <InfoTree informed highlight />
      {beat < 2 ? (
        <>
          <Cap x={1260} y={190} size={26} color={C.text}>
            {beat === 0 ? 'Valor de saber por contrato' : 'Valor para 500 contratos'}
          </Cap>
          <Cap x={1260} y={270} size={26} color={C.amber}>
            {beat === 0 ? 'Con información: 20 · Sin información: 4' : 'Valor por contrato: 16'}
          </Cap>
          {beat === 0 && <Cap x={1260} y={340} size={26} color={C.cyan}>Precio del boletín: 10</Cap>}
          <line x1={x0} x2={x1} y1={530} y2={530} stroke={C.line} strokeWidth={4} />
          <Cap x={x0} y={590} size={24} color={C.muted}>0</Cap>
          <Cap x={x1} y={590} size={24} color={C.muted}>{beat === 0 ? '20' : '10 000'}</Cap>
          <Cap x={1260} y={430} size={26} color={C.text}>
            {beat === 0 ? fmt(value, 1) : Math.round(value / 100) * 100}
          </Cap>
          <Knob x={x0 + (value / max) * (x1 - x0)} y={530} onPointerDown={drag} axis="x" color={C.amber} />
        </>
      ) : (
        <Cap x={1260} y={300} size={26} color={C.green}>500 · 16 = 8 000</Cap>
      )}
    </Stage>
  );
}

function EvpiPractice({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed * 193 + round);
    const win = pick(r, [60, 80, 100, 120]);
    const loss = pick(r, [10, 20, 30]);
    const p = pick(r, [0.1, 0.2, 0.25, 0.3]);
    const without = Math.max(0, win * p - loss * (1 - p));
    const withInfo = p * win;
    return { win, loss, p, without, withInfo, evpi: withInfo - without };
  }, [seed, round]);
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const base = `Contrato: +${d.win} si hay brote, −${d.loss} si no; p = ${fmt(d.p, 2)}; no comprar vale 0.`;
    api.prompt(
      base +
        [
          ' ¿Cuánto vale la mejor decisión sin información?',
          ' ¿Cuánto vale decidir sabiendo antes si hay brote?',
          ' ¿Cuánto vale la información perfecta (EVPI)?',
        ][round],
      [
        '\\max(E[\\text{comprar}],\\,0)',
        'p\\cdot G',
        '\\text{EVPI}=E_{\\text{info}}-E_{\\text{sin}}',
      ][round],
    );
    api.hints(
      [
        ['Calcula E[comprar] = p·G − (1 − p)·P.', 'Si es negativo, lo mejor es no comprar: 0.'],
        ['Con información, compras solo si hay brote.', 'Sin brote no compras: 0.'],
        ['Resta los dos valores anteriores.', 'Nunca da negativo.'],
      ][round],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, round]);
  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    const t = [d.without, d.withInfo, d.evpi][round];
    if (Math.abs(v - t) < 0.051) return api.result(true, `$${tnum(t, 1)}$.`);
    if (round === 0 && Math.abs(v - (d.win * d.p - d.loss * (1 - d.p))) < 0.051)
      return api.result(false, 'Ese valor es negativo: entonces conviene no comprar, que vale 0.');
    if (round === 2 && Math.abs(v - d.withInfo) < 0.051)
      return api.result(
        false,
        'Ese es el valor con información. Réstale lo que ya obtenías sin ella.',
      );
    return api.result(
      false,
      [
        'Compara E[comprar] con 0 y quédate con el mayor.',
        'Con brote ganas G con probabilidad p; sin brote, 0.',
        `EVPI = ${fmt(d.withInfo, 1)} − ${fmt(d.without, 1)}.`,
      ][round],
    );
  };
  return (
    <Stage>
      <Cap x={540} y={360} size={24} color={C.text}>
        {`Brote: +${d.win} · Sin brote: −${d.loss}`}
      </Cap>
      <Cap x={540} y={420} size={20} color={C.muted}>
        {`p = ${fmt(d.p, 2)}`}
      </Cap>
      <NumberField
        x={1120}
        y={420}
        value={val}
        onChange={setVal}
        onEnter={submit}
        label={['E sin info =', 'E con info =', 'EVPI ='][round]}
      />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w13-c3',
  world: 'decision',
  code: '13.3',
  title: 'Saber antes',
  subtitle: 'Valor de la información perfecta',
  glyph: '\\text{EVPI}',
  kind: 'level',
  guide: 'valentina',
  teaser: 'Un anuncio filtrado un día antes vale plata. Valentina quiere saber cuánta.',
  learn:
    'Calcular el valor esperado de la información perfecta comparando decidir antes y decidir sabiendo el resultado.',
  glyphs: ['dec-evpi'],
  pitfalls: [
    'Sin información, si comprar tiene valor esperado negativo, lo mejor vale 0.',
    'El EVPI es una diferencia: con información menos sin información.',
  ],
  steps: [
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        {
          who: 'nar',
          text: 'Sala de operaciones, seis y veinte de la tarde. Los operadores se habían ido; quedaban las pantallas y el zumbido del aire acondicionado.',
        },
        {
          who: 'valentina',
          text: 'En este piso un dato llega a todos al mismo tiempo. Si alguien lo tiene un día antes, eso tiene precio.',
        },
        { who: 'iris', text: 'Quiero el precio exacto.' },
        {
          who: 'teo',
          text: 'Se calcula comparando dos árboles: decidir antes y decidir sabiendo.',
        },
      ],
    },
    {
      kind: 'demo',
      title: 'El precio del dato',
      Scene: PriceDemo,
      beats: [
        {
          say: 'Un informante vende el boletín sanitario un día antes a 10 por contrato. ¿Le conviene comprarlo a quien opera estos contratos?',
          gate: 'Calcula cuánto vale saber antes y marca ese valor en la escala. Compáralo con el precio del boletín.',
          after: 'Saber antes vale 20 − 4 = 16 por contrato. Como el boletín cuesta 10, deja 6 por contrato en valor esperado.',
          note: { label: 'Precio del dato', tex: '\\text{EVPI}=16>10' },
        },
        {
          say: 'La cuenta sospechosa operó 500 contratos con el anuncio adelantado. ¿Cuánto valió para ella saber antes?',
          gate: 'Calcula el valor para los 500 contratos y ubícalo en la escala.',
          after: 'Para 500 contratos, saber antes aumentó el valor esperado en 500 · 16 = 8 000.',
          note: {
            label: 'Ganancia por saber',
            tex: '500\\cdot16=8\\,000',
            body: 'Ese valor no existe si el dato llega a todos a la vez.',
          },
        },
        {
          say: 'La cuenta obtuvo un aumento esperado de 8 000 por recibir el anuncio antes. El resultado efectivo depende de si ocurre el brote.',
        },
      ],
    },
    { kind: 'challenge', title: 'Ponerle precio al dato', Comp: EvpiPractice, rounds: 3 },
    {
      kind: 'scene',
      place: 'bolsa',
      lines: [
        { who: 'nar', text: 'Valentina apagó una pantalla, y la sala se oscureció un tono.' },
        {
          who: 'valentina',
          text: 'Ocho mil por saber un día antes. Y lo hicieron todos los meses.',
        },
        {
          who: 'iris',
          text: 'Entonces la ganancia depende también de cuánto esperan para cobrar.',
        },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  {
    id: 'dec-evpi',
    world: 'decision',
    tex: '\\text{EVPI}',
    name: 'Valor de la información perfecta',
    read: 'e ve pe i',
    meaning: 'Cuánto aumenta el valor esperado si se conoce el resultado antes de decidir.',
    warn: 'Nunca es negativo.',
  },
];

export const ref: TopicRef = {
  defs: [
    { label: 'EVPI', tex: '\\text{EVPI}=E[\\text{con información}]-E[\\text{sin información}]' },
    { label: 'Con información', tex: 'E=\\sum_s P(s)\\max_a u(a,s)' },
  ],
  props: [
    { label: 'No negativo', tex: '\\text{EVPI}\\ge0' },
    { label: 'Ejemplo', tex: '20-4=16' },
  ],
};

export { lesson };
