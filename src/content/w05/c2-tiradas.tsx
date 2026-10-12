import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import { Tex } from '../../engine/Tex';
import type { ChallengeProps, DemoProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum, parseProb } from '../shared/ui';
import { ALL, Bars, type Cell, DiceGrid, Formula, fracTex } from './kit';

// ============================================================================
// CASO 5.2 · «Mil tiradas» — probabilidad clásica y frecuencias
// Contar casillas: P(A)=|A|/|Ω|; la suma de dos dados no es uniforme; la frecuencia relativa
// se acerca a la probabilidad con muchas tiradas; detectar un dado cargado comparando con lo
// esperado.
// ============================================================================

const sumOf = (c: Cell) => c[0] + c[1];
const SUM_COUNTS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
const FACES = ['1', '2', '3', '4', '5', '6'];

// ---------------------------------------------------------------- demo
function RollsDemo({ beats, unlock, answer }: DemoProps) {
  const { beat } = beats;
  const [counts, setCounts] = useState([0, 0, 0, 0, 0, 0]);
  const [pick6, setPick6] = useState<number | null>(null);
  const n = counts.reduce((a, b) => a + b, 0);
  const roll = (k: number) => {
    const c = [...counts];
    for (let i = 0; i < k; i++) c[Math.floor(Math.random() * 6)]++;
    setCounts(c);
    if (n + k >= 1000) unlock();
  };
  const CAM = [190, 205, 170, 185, 130, 320];

  if (beat === 0)
    return (
      <Stage>
        <DiceGrid x={420} y={150} cell={110} labels="sum" tone={(c) => (answer === null ? null : sumOf(c) === 7 ? C.amber : sumOf(c) === 12 ? C.cyan : null)} />
        {answer !== null && (
          <>
            <Formula x={1290} y={350} size={28} color={C.amber} tex={`P(7)=${fracTex(6, 36)}`} />
            <Formula x={1290} y={480} size={28} color={C.cyan} tex="P(12)=\frac{1}{36}" />
          </>
        )}
      </Stage>
    );
  if (beat === 1)
    return (
      <Stage>
        <Html x={800} y={150} size={22} color={C.muted}>
          <span>Las 36 casillas, agrupadas por la suma</span>
        </Html>
        <Bars x={260} y={220} w={1080} h={460} values={SUM_COUNTS} max={6} labels={SUM_COUNTS.map((_, i) => String(i + 2))} fmtV={(v) => `${v}/36`} />
      </Stage>
    );
  if (beat === 2) {
    const freqs = counts.map((c) => (n ? c / n : 0));
    return (
      <Stage>
        <Bars x={300} y={180} w={900} h={460} values={freqs} max={0.35} labels={FACES} fmtV={(v) => dec(v, 3)} refV={1 / 6} />
        <Html x={1220} y={180 + 460 - (1 / 6 / 0.35) * 460} size={18} anchor="left" color={C.green}>
          <Tex tex="\tfrac16\approx0{,}167" />
        </Html>
        <Html x={750} y={760} size={24} interactive>
          <div className="stage-choices">
            {[10, 100, 1000].map((k) => (
              <button key={k} className="stage-btn on" onClick={() => roll(k)}>
                +{k} tiradas
              </button>
            ))}
          </div>
        </Html>
        <Html x={750} y={820} size={20} color={C.muted}>
          <span>{n} tiradas de un dado honesto</span>
        </Html>
      </Stage>
    );
  }
  if (beat === 3)
    return (
      <Stage>
        <Bars x={300} y={200} w={900} h={440} values={[9, 11, 8, 10, 8, 14]} max={20} labels={FACES} refV={10} hi={answer !== null ? 5 : null} />
        <Html x={1220} y={200 + 440 - 220} size={18} anchor="left" color={C.green}>
          <span>esperado: 10</span>
        </Html>
        <Html x={750} y={760} size={22} color={C.muted}>
          <span>60 tiradas de la mesa 2</span>
        </Html>
      </Stage>
    );
  return (
    <Stage>
      <Bars x={300} y={200} w={900} h={440} values={CAM} max={360} labels={FACES} refV={200} hi={pick6} onPick={(i) => { setPick6(i); if (i === 5) unlock(); }} />
      <Html x={1220} y={200 + 440 - (200 / 360) * 440} size={18} anchor="left" color={C.green}>
        <span>esperado: 200</span>
      </Html>
      <Html x={750} y={760} size={22} color={C.muted}>
        <span>Cámara de la mesa 3 · 1 200 tiradas</span>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- challenge
const SUM_EVENTS: { text: string; tex: string; f: (c: Cell) => boolean }[] = [
  { text: 'la suma sea 9', tex: 'P(a+b=9)', f: (c) => sumOf(c) === 9 },
  { text: 'la suma sea 4', tex: 'P(a+b=4)', f: (c) => sumOf(c) === 4 },
  { text: 'la suma sea mayor que 9', tex: 'P(a+b>9)', f: (c) => sumOf(c) > 9 },
  { text: 'salgan dobles', tex: 'P(a=b)', f: (c) => c[0] === c[1] },
  { text: 'la suma sea menor que 5', tex: 'P(a+b<5)', f: (c) => sumOf(c) < 5 },
  { text: 'salga al menos un 6', tex: 'P(\\text{algún }6)', f: (c) => c[0] === 6 || c[1] === 6 },
];

function Cameras({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const ev = pick(r, SUM_EVENTS);
    const loaded = randInt(r, 0, 5);
    const counts = FACES.map((_, i) => (i === loaded ? randInt(r, 150, 168) : randInt(r, 88, 112)));
    const total = counts.reduce((a, b) => a + b, 0);
    const ev2 = pick(r, SUM_EVENTS);
    const n2 = pick(r, [180, 360, 720]);
    return { ev, loaded, counts, total, ev2, n2 };
  }, [seed]);
  const [val, setVal] = useState('');
  const [face, setFace] = useState<number | null>(null);

  useEffect(() => {
    if (round === 0) {
      api.prompt(`Con dados honestos, ¿cuál es la probabilidad de que ${data.ev.text}? Escríbela como fracción, por ejemplo 5/36.`, data.ev.tex);
      api.hints(['Cuenta las casillas del evento.', 'Divide por las 36 casillas: todas son igual de probables.']);
    } else if (round === 1) {
      api.prompt(`La cámara de la mesa 5 grabó ${data.total} tiradas de un dado. Señala la cara cargada.`, `n\\cdot P=${data.total}\\cdot\\tfrac16\\approx${Math.round(data.total / 6)}`);
      api.hints([`Con un dado honesto, cada cara sale unas ${Math.round(data.total / 6)} veces. Diferencias de 10 o 15 son normales.`, 'Busca la cara que se aleja mucho más que las demás.']);
    } else {
      api.prompt(`En ${data.n2} tiradas honestas de dos dados, ¿cuántas veces esperas que ${data.ev2.text}?`, `n\\cdot P(A)`);
      api.hints(['Primero la probabilidad: casillas del evento sobre 36.', `Luego multiplica por las ${data.n2} tiradas.`]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    if (round === 1) {
      if (face === null) return;
      const e = Math.round(data.total / 6);
      if (face === data.loaded) return api.result(true, `La cara ${face + 1} salió ${data.counts[face]} veces y se esperaban unas ${e}. Ese dado está cargado.`);
      return api.result(false, `La cara ${face + 1} salió ${data.counts[face]} veces; se esperaban unas ${e}. Esa diferencia es normal en ${data.total} tiradas.`);
    }
    if (round === 0) {
      const v = parseProb(val);
      if (v === null) return;
      const k = ALL.filter(data.ev.f).length;
      if (Math.abs(v - k / 36) < 1e-4) return api.result(true, `$${data.ev.tex}=${fracTex(k, 36)}$.`);
      const guess = Math.round(v * 36);
      if (Math.abs(v * 36 - guess) < 1e-6) return api.result(false, `Con ${guess}/36 contaste ${guess} casillas; el evento tiene ${k}.`);
      return api.result(false, `Cuenta las casillas del evento (son ${k > 6 ? 'más de 6' : 'pocas'}) y divide por 36.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    const k = ALL.filter(data.ev2.f).length;
    const truth = (data.n2 * k) / 36;
    if (Math.abs(v - truth) < 0.5) return api.result(true, `$${data.n2}\\cdot\\frac{${k}}{36}=${dec(truth)}$ veces, en promedio.`);
    return api.result(false, `La probabilidad es $\\frac{${k}}{36}$; ${dec(v)} veces en ${data.n2} tiradas sería $\\frac{${dec(v)}}{${data.n2}}$.`);
  };

  if (round === 1)
    return (
      <Stage>
        <Bars x={300} y={200} w={900} h={440} values={data.counts} max={200} labels={FACES} refV={data.total / 6} hi={face} onPick={setFace} />
        <Html x={1220} y={200 + 440 - (data.total / 6 / 200) * 440} size={18} anchor="left" color={C.green}>
          <span>esperado: {Math.round(data.total / 6)}</span>
        </Html>
        <Confirm onClick={submit} disabled={face === null} />
      </Stage>
    );
  return (
    <Stage>
      <DiceGrid x={420} y={150} cell={100} labels="sum" />
      <NumberField x={1100} y={500} value={val} onChange={setVal} onEnter={submit} label={round === 0 ? 'P =' : 'Veces:'} width={5} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w5-c2',
  world: 'probability',
  code: '5.2',
  title: 'Mil tiradas',
  subtitle: 'Probabilidad y frecuencia',
  glyph: 'P(A)',
  kind: 'level',
  guide: 'teo',
  teaser: 'Teo tiene las cámaras de todas las mesas. Un dado honesto deja una huella en los números; uno cargado, otra.',
  learn: 'Probabilidad clásica $|A|/|\\Omega|$, distribución de la suma de dos dados, frecuencia relativa y su acercamiento a la probabilidad, valor esperado de un conteo $nP$.',
  glyphs: ['prob', 'freq'],
  pitfalls: ['$|A|/|\\Omega|$ solo vale si todos los resultados son igual de probables.', 'Pocas tiradas pueden alejarse bastante de lo esperado sin que haya trampa.', 'Las 11 sumas posibles no son igual de probables.'],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'nar', text: 'Casino Aurora, 21:15. Teo habla entre chasquidos del auricular.' },
        { who: 'teo', text: 'Tengo 60 tiradas de la mesa 2 y 1 200 de la mesa 3. En las dos sale mucho el 6, pero la primera grabación es corta.' },
        { who: 'iris', text: 'No vamos a acusar a un crupier por una mala racha. Comparemos con lo que debería salir.' },
        { who: 'vera', text: 'Háganlo sin señalar la mesa; cuando alguien reclama, nos cambian el turno a nosotros.' },
      ],
    },
    {
      kind: 'demo',
      title: 'Las cámaras',
      Scene: RollsDemo,
      beats: [
        {
          say: 'Si los dados son honestos, las 36 casillas son igual de probables. Cada casilla muestra su suma.',
          ask: {
            prompt: '¿Qué es más probable: sumar 7 o sumar 12?',
            options: ['Sumar 7', 'Sumar 12', 'Son igual de probables'],
            answer: 0,
            explain: 'El 7 aparece en 6 casillas; el 12 solo en (6,6). La probabilidad cuenta casillas favorables sobre casillas totales.',
          },
          note: { label: 'Probabilidad clásica', tex: 'P(A)=\\frac{|A|}{|\\Omega|}', body: 'Vale cuando todos los resultados son igual de probables. $P(7)=\\tfrac{6}{36}=\\tfrac16$.' },
        },
        {
          say: 'Agrupadas por la suma, las 36 casillas forman una pirámide: el 7 al centro, el 2 y el 12 en los bordes.',
          dur: 1.8,
          note: { label: 'Distribución de la suma', body: '36 resultados igual de probables, pero 11 sumas con probabilidades distintas.' },
        },
        {
          say: 'En la práctica no vemos probabilidades: vemos tiradas. Lanza un dado honesto muchas veces.',
          gate: 'Lanza hasta pasar las 1 000 tiradas.',
          note: { label: 'Frecuencia relativa', tex: 'f_n(A)=\\frac{n_A}{n}\\ \\longrightarrow\\ P(A)', body: '$n_A$: veces que ocurrió $A$ en $n$ tiradas. Con pocas tiradas las barras saltan; con muchas, se acercan a $\\tfrac16$.' },
        },
        {
          say: 'En la mesa 2, el 6 salió 14 veces en 60 tiradas. Se esperaban 10.',
          ask: {
            prompt: '¿Está cargado el dado de la mesa 2?',
            options: ['No se puede afirmar con tan pocas tiradas', 'Sí, sale demasiado el 6', 'No, es imposible que esté cargado'],
            answer: 0,
            explain: 'En 60 tiradas honestas, 14 seises es poco común pero ocurre. Para acusar a alguien hacen falta muchas más tiradas.',
          },
          note: { label: 'Pocas tiradas', body: 'Una desviación pequeña en pocas tiradas no prueba nada.' },
        },
        {
          say: 'La cámara de la mesa 3 registró 1 200 tiradas. Con un dado honesto, cada cara sale unas 200 veces.',
          gate: 'Toca la barra de la cara sospechosa.',
          note: { label: 'Comparar con lo esperado', tex: 'n\\cdot P=1200\\cdot\\tfrac16=200', body: '320 seises en 1 200 tiradas es demasiado lejos de 200: el dado de la mesa 3 está cargado.' },
        },
      ],
    },
    { kind: 'challenge', title: 'Las cámaras', Comp: Cameras, rounds: 3 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'teo', text: 'En la mesa 3 salieron 320 seises en 1 200 tiradas; esperábamos unas 200. Ese dado está cargado.' },
        { who: 'iris', text: 'Bien. ¿Por qué dejar una trampa tan fácil de ver?' },
        { who: 'vera', text: 'Bajen la voz; yo no les mostré ningún dado.' },
        { who: 'vera', text: 'Miren la tabla de pagos que les dejé sobre el paño. Nadie reclama lo que perdió sin entenderla.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [
  { id: 'prob', world: 'probability', tex: 'P(A)', name: 'Probabilidad', read: 'pe de a', meaning: 'Número entre 0 y 1 que mide qué tan posible es $A$. Con resultados igual de probables, $|A|/|\\Omega|$.' },
  { id: 'freq', world: 'probability', tex: 'f_n(A)', name: 'Frecuencia relativa', read: 'efe ene de a', meaning: 'Fracción de las $n$ repeticiones en que ocurrió $A$. Se acerca a $P(A)$ cuando $n$ crece.' },
];
