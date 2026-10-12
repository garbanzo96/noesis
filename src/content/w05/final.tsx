import { useEffect, useMemo, useState } from 'react';
import { Die, PlayingCard } from '../../art/props';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, dec, parseProb } from '../shared/ui';
import { Formula, Table, fracTex } from './kit';

// ============================================================================
// CASO 5.★ · «La mesa 7» — repaso del distrito
// Cinco momentos de la partida: condicional en una tabla, Bayes con varias tiradas,
// complemento con tiradas independientes, esperanza de la pérdida de la casa y regla de la
// cadena sin reposición.
// ============================================================================

function Table7({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const T = [
      [randInt(r, 14, 20), randInt(r, 2, 6)],
      [randInt(r, 8, 14), randInt(r, 26, 40)],
    ];
    const prior = pick(r, [0.1, 0.2]);
    const sixes = pick(r, [3, 4]);
    const n = pick(r, [3, 4, 5]);
    const bets = pick(r, [20, 40, 50]);
    const stake = pick(r, [50, 100]);
    const red = randInt(r, 4, 7);
    const black = randInt(r, 3, 5);
    return { T, prior, sixes, n, bets, stake, red, black };
  }, [seed]);
  const [val, setVal] = useState('');

  useEffect(() => {
    const P = [
      ['22:00. Teo cuenta las manos de la mesa 7 esta noche. Si un jugador es VIP, ¿qué probabilidad tiene de ganar la mano?', 'P(\\text{gana}\\mid\\text{VIP})', ['Quédate con la fila de los VIP.', 'Divide las manos ganadas por el total de la fila.']],
      [`22:30. Cuando el VIP del sombrero se sienta, salen ${data.sixes} seises seguidos. Previa del dado cargado: ${dec(data.prior)}. El cargado saca 6 con probabilidad $\\tfrac12$. ¿Probabilidad de que el dado sea el cargado?`, 'P(L\\mid 6,\\dots,6)', ['Cargado: previa por $(1/2)^k$. Honesto: previa por $(1/6)^k$.', 'Divide el cargado por la suma de los dos.']],
      [`23:00. El Barón jura que su dado es honesto. Con un dado honesto, ¿qué probabilidad hay de sacar al menos un 6 en ${data.n} tiradas?`, `1-\\left(\\tfrac56\\right)^{${data.n}}`, ['«Al menos uno» es el complemento de «ninguno».', 'Las tiradas son independientes: «ningún 6» es $(5/6)$ multiplicado tantas veces como tiradas.']],
      [`23:30. Con el dado cargado, el VIP apuesta ${data.stake} fichas al 6, ${data.bets} veces. El 6 paga 5 a 1 (ganancia neta 5 por ficha). ¿Cuántas fichas espera perder la casa en total?`, 'E[\\text{pérdida}]=n\\cdot \\text{apuesta}\\cdot E[X]', ['Por ficha: gana 5 con probabilidad $\\tfrac12$ y pierde 1 con $\\tfrac12$.', `Multiplica ese promedio por ${data.stake} fichas y ${data.bets} apuestas.`]],
      [`00:00. Vera hará la señal si las dos próximas cartas del zapato son rojas. Quedan ${data.red} rojas y ${data.black} negras. ¿Probabilidad de que haga la señal?`, 'P(R_1\\cap R_2)=P(R_1)\\,P(R_2\\mid R_1)', ['Primera roja: rojas sobre el total.', 'Segunda roja, sabiendo la primera: una roja menos y una carta menos.']],
    ] as [string, string, string[]][];
    const [p, tex, hs] = P[round];
    api.prompt(p, tex);
    api.hints(hs);
    setVal('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseProb(val);
    if (v === null) return;
    if (round === 0) {
      const [w, l] = data.T[0];
      const t = w / (w + l);
      if (Math.abs(v - t) < 0.006) return api.result(true, `$\\frac{${w}}{${w + l}}\\approx${dec(t, 2)}$. Los regulares ganan $\\frac{${data.T[1][0]}}{${data.T[1][0] + data.T[1][1]}}$.`.replace(/(\d),(\d)/g, '$1{,}$2'));
      const tot = data.T.flat().reduce((a, b) => a + b, 0);
      if (Math.abs(v - w / tot) < 0.006) return api.result(false, 'Dividiste por todas las manos. Sabemos que es VIP: divide por la fila.');
      return api.result(false, `Fila VIP: ${w} ganadas de ${w + l}.`);
    }
    if (round === 1) {
      const a = data.prior * 0.5 ** data.sixes;
      const b = (1 - data.prior) * (1 / 6) ** data.sixes;
      const t = a / (a + b);
      if (Math.abs(v - t) < 0.006) return api.result(true, `Cada 6 multiplica por 3 las chances del cargado: $\\frac{${dec(data.prior)}}{${dec(1 - data.prior)}}\\cdot3^{${data.sixes}}$. Posterior $\\approx${dec(t, 3)}$.`.replace(/(\d),(\d)/g, '$1{,}$2'));
      return api.result(false, `Cargado: $${dec(data.prior)}\\cdot(\\tfrac12)^{${data.sixes}}$. Honesto: $${dec(1 - data.prior)}\\cdot(\\tfrac16)^{${data.sixes}}$. Divide el primero por la suma.`.replace(/(\d),(\d)/g, '$1{,}$2'));
    }
    if (round === 2) {
      const t = 1 - (5 / 6) ** data.n;
      if (Math.abs(v - t) < 0.006) return api.result(true, `$1-(\\tfrac56)^{${data.n}}\\approx${dec(t, 3)}$. Cinco seises seguidos son otra cosa: $(\\tfrac16)^5\\approx0{,}0001$.`.replace(/(\d),(\d)/g, '$1{,}$2'));
      if (Math.abs(v - data.n / 6) < 0.006) return api.result(false, `Sumar $\\tfrac16$ ${data.n} veces cuenta dos veces las tiradas con varios seises. Usa el complemento.`);
      return api.result(false, `«Ningún 6» en ${data.n} tiradas: $(\\tfrac56)^{${data.n}}$. Réstalo de 1.`);
    }
    if (round === 3) {
      const t = data.bets * data.stake * 2;
      if (Math.abs(v - t) < 0.5) return api.result(true, `Por ficha: $5\\cdot\\tfrac12-1\\cdot\\tfrac12=2$. Total: $${data.bets}\\cdot${data.stake}\\cdot2=${t}$ fichas que salen de la casa hacia el VIP.`);
      if (Math.abs(v - data.bets * data.stake * 2.5) < 0.5) return api.result(false, 'Falta descontar lo que el VIP pierde cuando no sale 6: $-1$ con probabilidad $\\tfrac12$.');
      return api.result(false, `Esperanza por ficha: $5\\cdot\\tfrac12-1\\cdot\\tfrac12$. Multiplica por ${data.stake} y por ${data.bets}.`);
    }
    const N = data.red + data.black;
    const t = (data.red / N) * ((data.red - 1) / (N - 1));
    if (Math.abs(v - t) < 0.003) return api.result(true, `$\\frac{${data.red}}{${N}}\\cdot\\frac{${data.red - 1}}{${N - 1}}=${fracTex(data.red * (data.red - 1), N * (N - 1))}$.`);
    if (Math.abs(v - (data.red / N) ** 2) < 0.003) return api.result(false, 'Las cartas no vuelven al zapato: la segunda tiene una roja menos.');
    return api.result(false, `Primera: $\\frac{${data.red}}{${N}}$. Segunda, sabiendo la primera: $\\frac{${data.red - 1}}{${N - 1}}$.`);
  };

  return (
    <Stage>
      {round === 0 && <Table x={560} y={230} rows={['VIP', 'Regular']} cols={['Gana', 'Pierde']} data={data.T} rowSums colSums total tone={(i, j) => (i === 0 ? (j === 0 ? C.amber : C.cyan) : null)} />}
      {round === 1 && Array.from({ length: data.sixes }, (_, i) => <Die key={i} x={800 - (data.sixes - 1) * 60 + i * 120} y={330} value={6} size={90} />)}
      {round === 2 && Array.from({ length: data.n }, (_, i) => <Die key={i} x={800 - (data.n - 1) * 60 + i * 120} y={330} value={0} size={90} />)}
      {round === 3 && <Formula y={330} size={32} tex={`${data.bets}\\ \\text{apuestas}\\times${data.stake}\\ \\text{fichas al }6`} />}
      {round === 4 && (
        <>
          {Array.from({ length: data.red + data.black }, (_, i) => (
            <PlayingCard key={i} x={560 + i * 44} y={330} w={90} rank="" suit="c" faceDown />
          ))}
          <Html x={800} y={460} size={22} color={C.muted}>
            <span>
              {data.red} rojas y {data.black} negras en el zapato
            </span>
          </Html>
        </>
      )}
      <NumberField x={560} y={620} value={val} onChange={setVal} onEnter={submit} label={round === 3 ? 'Fichas:' : 'P ='} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w5-final',
  world: 'probability',
  code: '5.★',
  title: 'La mesa 7',
  subtitle: 'Repaso del distrito',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w5-closed',
  guide: 'iris',
  teaser: 'Partida grande en la mesa 7. El Barón, el VIP del sombrero y un dado que cambia de manos. Cinco momentos, cinco herramientas.',
  learn: 'Usar juntas las herramientas del casino: condicional, Bayes con evidencia repetida, complemento con ensayos independientes, esperanza y árboles sin reposición.',
  glyphs: ['cond', 'bayes', 'indep', 'expect', 'chain'],
  steps: [
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'nar', text: 'Mesa 7 del Casino Aurora, sábado, 22:00. Las fichas ahogan la música.' },
        { who: 'vera', text: 'Llegó el VIP del sombrero; el Barón trae el dado en el bolsillo. No puedo mirar hacia ustedes mientras reparto.' },
        { who: 'teo', text: 'Tengo la cámara sobre la mesa. Necesito las cuentas antes de que guarde el dado otra vez.' },
        { who: 'iris', text: 'Analista, sigue cada apuesta; si Vera hace la señal con las cartas, tenemos que estar listos.' },
      ],
    },
    { kind: 'challenge', title: 'La mesa 7', Comp: Table7, rounds: 5 },
    {
      kind: 'scene',
      place: 'casino',
      lines: [
        { who: 'iris', text: 'Con ese dado, cada ficha al 6 le deja al VIP dos fichas netas en promedio. ¿Cuántas noches generosas llevas, Ferrer?' },
        { who: 'baron', text: 'Mi casa puede pagar sus pérdidas, inspectora. Espero que ustedes puedan pagar semejante acusación.' },
        { who: 'vera', text: 'Las cartas ya salieron; hice la señal. No voy a repartir otra mano.' },
        { who: 'teo', text: 'La libreta de su chaqueta tiene nombres y montos. Todos son pacientes de la Clínica del Cerro.' },
        { who: 'nar', text: 'Ferrer queda bajo custodia; su libreta sigue abierta en la página de la Clínica del Cerro.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
