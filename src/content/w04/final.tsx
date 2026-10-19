import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { Grid, MatInput, Vec, add, det, lattice, mv, n, texM, texV, txtV, type M2, type V2 } from './kit';

// ============================================================================
// CASO 4.★ · «La tabla maestra» — repaso del mundo
// Cinco momentos en la sala de control: tramos del M-7, la pantalla, el sensor de ejes,
// deshacer la tabla y el reparto estable.
// ============================================================================

const P = lattice(640, 450, 56, 7, 5);

function Master({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed);
    const legs: V2[] = [
      [randInt(r, 1, 3), randInt(r, -2, 1)],
      [randInt(r, -2, 2), randInt(r, 1, 2)],
      [randInt(r, -3, 1), randInt(r, -1, 1)],
    ];
    const A: M2 = pick(r, [
      [[2, 0], [-4, 3]],
      [[1, 2], [0, 1]],
      [[2, 1], [1, 1]],
      [[3, -1], [1, 0]],
    ] as M2[]);
    const pos: V2 = [randInt(r, 1, 3), randInt(r, -1, 2)];
    const nm = randInt(r, 1, 4);
    const nc = randInt(r, 3, 7);
    const T: M2 = pick(r, [
      [[2, 1], [1, 1]],
      [[3, 1], [2, 1]],
      [[1, 1], [1, 2]],
    ] as M2[]);
    const real: V2 = [randInt(r, -2, 3), randInt(r, -2, 3)];
    const [p, q] = pick(r, [
      [0.3, 0.1],
      [0.2, 0.3],
      [0.1, 0.4],
      [0.4, 0.1],
    ] as [number, number][]);
    return { legs, A, pos, nm, nc, T, real, screen: mv(T, real), p, q };
  }, [seed]);
  const [vals, setVals] = useState<string[]>(['', '']);
  const [val, setVal] = useState('');
  const set = (i: number, s: string) => setVals((o) => o.map((t, k) => (k === i ? s : t)));
  const sum = d.legs.reduce(add, [0, 0] as V2);
  const trains = d.nm + d.nc;
  const wagons = 2 * d.nm + 4 * d.nc;
  const steady = Math.round((100 * d.q) / (d.p + d.q));

  useEffect(() => {
    const L: [string, string, string[]][] = [
      ['02:00. El M-7 sale de la estación Puerto (el origen). Su GPS registra tres tramos. ¿Dónde termina?', '\\vec a+\\vec b+\\vec c', ['Suma las primeras componentes y las segundas por separado.', 'Cuida los signos.']],
      ['02:20. El servidor pasa esa posición por una tabla antes de dibujarla. ¿Dónde aparece en la pantalla?', 'A\\vec v', ['Fila por vector.', 'Primera componente: primera fila de $A$ por $\\vec v$.']],
      [`02:40. El sensor de ejes del puente cuenta ${trains} trenes y ${wagons} vagones. Mantención: 2 vagones; carga: 4. ¿Cuántos son de carga?`, 'x+y=' + trains + ',\\ \\ 2x+4y=' + wagons, ['Resta 2 veces la primera ecuación a la segunda.', 'Queda $2y=\\ldots$']],
      ['03:00. La grabación muestra un tren de carga en $\\vec b$. Deshaz la tabla $T$ para hallar su posición real.', '\\vec x=T^{-1}\\vec b', [`$\\det T=${n(det(d.T))}$.`, 'Inversa: intercambia la diagonal, cambia el signo de la otra y divide por el determinante.']],
      [`03:20. Cada noche, del Taller sale el ${Math.round(d.p * 100)} % hacia las Cocheras y vuelve el ${Math.round(d.q * 100)} %. Con 100 vagones, ¿cuántos terminan en las Cocheras a la larga?`, 'M\\vec v=\\vec v', ['En equilibrio, lo que sale del Taller iguala lo que entra.', '$pT=qK$ y $T+K=100$.']],
    ];
    const [t, tex, hs] = L[round];
    api.prompt(t, tex);
    api.hints(hs);
    setVals(['', '']);
    setVal('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, d]);

  const submit = () => {
    if (round === 2 || round === 4) {
      const v = parseNum(val);
      if (v === null) return;
      if (round === 2) {
        if (Math.abs(v - d.nc) < 0.01) return api.result(true, `$2y=${wagons}-2\\cdot${trains}=${2 * d.nc}$: ${d.nc} trenes de carga, ninguno en el horario.`);
        if (Math.abs(v - d.nm) < 0.01) return api.result(false, 'Ese es el número de trenes de mantención.');
        return api.result(false, 'Resta 2 veces la primera ecuación a la segunda para eliminar $x$.');
      }
      const k = 100 - steady;
      if (Math.abs(v - k) < 0.6) return api.result(true, `$T=${steady}$ y $K=${k}$: la mayor parte termina en las Cocheras.`);
      if (Math.abs(v - steady) < 0.6) return api.result(false, 'Ese es el Taller. Pregunté por las Cocheras.');
      return api.result(false, 'Reparto estable: lo que sale del Taller ($pT$) iguala lo que llega ($qK$).');
    }
    const v = vals.map(parseNum);
    if (v[0] === null || v[1] === null) return;
    const got: V2 = [v[0], v[1]];
    const target = round === 0 ? sum : round === 1 ? mv(d.A, sum) : d.real;
    if (Math.abs(got[0] - target[0]) < 0.01 && Math.abs(got[1] - target[1]) < 0.01) {
      const msg = [`El M-7 termina en $${txtV(sum)}$.`, `$${texM(d.A)}${texV(sum)}=${texV(target)}$: en pantalla parece otra cosa.`, '', `$T^{-1}\\vec b=${texV(d.real)}$. Comprobación: $T${texV(d.real)}=${texV(d.screen)}$.`];
      return api.result(true, msg[round]);
    }
    const why = [`Tu punto es $${txtV(got)}$: revisa la suma componente a componente.`, 'Usa filas de $A$ por el vector, no columnas.', '', `Con ese punto la pantalla mostraría $${txtV(mv(d.T, got))}$. Revisa la inversa.`];
    return api.result(false, why[round]);
  };

  return (
    <Stage>
      {round <= 1 && <Grid P={P} M={round === 1 ? d.A : undefined} color={C.violet} opacity={round === 1 ? 0.35 : 0} />}
      {round === 0 &&
        d.legs.map((v, i) => <Cap key={i} x={1340} y={220 + i * 56} size={24} color={[C.cyan, C.amber, C.magenta][i]} tex={`${['\\vec a', '\\vec b', '\\vec c'][i]}=${txtV(v)}`} />)}
      {round === 1 && (
        <>
          <Vec P={P} v={sum} color={C.dim} width={3} dashed label="\vec v" />
          <Cap x={1340} y={230} size={24} color={C.text} tex={`A=${texM(d.A)},\\ \\vec v=${texV(sum)}`} />
        </>
      )}
      {round <= 1 && <MatInput x={1220} y={420} vals={vals} onChange={set} onEnter={submit} rows={2} cols={1} label={round === 0 ? 'final =' : 'pantalla ='} />}
      {round === 2 && (
        <>
          <Cap x={640} y={330} size={40} color={C.text} tex={`\\begin{cases}x+y=${trains}\\\\2x+4y=${wagons}\\end{cases}`} />
          <NumberField x={1150} y={340} value={val} onChange={setVal} onEnter={submit} label="carga y =" width={3} />
        </>
      )}
      {round === 3 && (
        <>
          <Cap x={560} y={330} size={38} color={C.text} tex={`T=${texM(d.T)},\\qquad \\vec b=${texV(d.screen)}`} />
          <MatInput x={1150} y={340} vals={vals} onChange={set} onEnter={submit} rows={2} cols={1} label="real =" />
        </>
      )}
      {round === 4 && (
        <>
          <Cap x={600} y={320} size={36} color={C.text} tex={`M=${texM([[1 - d.p, d.q], [d.p, 1 - d.q]], 1)}`} />
          <NumberField x={1100} y={340} value={val} onChange={setVal} onEnter={submit} label="Cocheras →" width={3} unit="vagones" />
        </>
      )}
      <Html x={1300} y={700} size={16} color={C.muted}>
        <span>{['02:00', '02:20', '02:40', '03:00', '03:20'][round]}</span>
      </Html>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w4-final',
  world: 'linear',
  code: '4.★',
  title: 'La tabla maestra',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w4-closed',
  guide: 'lucia',
  teaser: 'Noche en la sala de control del Metro. El M-7 vuelve a salir, y esta vez cada tabla del servidor se deshace a la vista.',
  learn: 'Usar juntas las herramientas del mundo: vectores, matrices como transformaciones, sistemas lineales, inversa y estados estables.',
  glyphs: ['vec', 'matvec', 'system', 'matinv', 'eigen'],
  steps: [
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Centro de control del Metro, dos de la mañana. Lucía había dejado el abrigo puesto en la silla, como quien piensa quedarse poco rato.' },
        { who: 'lucia', text: 'El M-7 acaba de salir de Puerto, y en la pantalla aparece estacionado en el taller. Tengo que mantener esta ventana abierta sin que se note.' },
        { who: 'teo', text: 'Voy guardando cada tramo y cada tabla que aplica el servidor. Si algo cambia, queda en la copia.' },
        { who: 'iris', text: 'Calcula mientras llega, analista. Lucía está apostando su puesto a estos números.' },
      ],
    },
    { kind: 'challenge', title: 'La tabla maestra', Comp: Master, rounds: 5 },
    {
      kind: 'scene',
      place: 'metro',
      lines: [
        { who: 'nar', text: 'Cocheras Barón, veinte para las cuatro. El freno del M-7 crujió junto al vagón sellado, y después no se oyó nada más.' },
        { who: 'lucia', text: 'Llegó justo donde lo seguimos con las cuentas. Mi pantalla todavía lo muestra en el taller.' },
        { who: 'teo', text: 'Hay discos adentro. Llevan la etiqueta «Archivo Regional. Registro de vacunación».' },
        { who: 'iris', text: 'Son los registros de las vacunas del puerto, los mismos pacientes de la Clínica del Cerro. Alguien se tomó el trabajo de esconderlos en una cochera cerrada desde 2071.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
