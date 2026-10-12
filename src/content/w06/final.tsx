import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage } from '../../engine/Stage';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { Cap } from '../shared/lesson';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, parseNum } from '../shared/ui';
import { MatInput } from '../w04/kit';
import { mean, num, sum } from './kit';

// ============================================================================
// CASO 6.★ · «El informe» — repaso del mundo
// Cinco cifras para el fiscal: media, puntaje z, intervalo de confianza, prueba de una
// proporción y residuo de regresión.
// ============================================================================

function Report({ seed, round, api }: ChallengeProps) {
  const d = useMemo(() => {
    const r = rng(seed);
    const xs = Array.from({ length: 6 }, () => randInt(r, 12, 30));
    const mu = 120;
    const s = 15;
    const x = pick(r, [150, 156, 162, 168, 171]);
    const n = pick(r, [36, 49, 64, 100]);
    const sg = pick(r, [6, 7, 8]);
    const xb = pick(r, [64.5, 65.2, 66, 66.8]);
    const p0 = 0.95;
    const nn = 400;
    const k = pick(r, [352, 356, 360, 364]);
    const b = 0.95;
    const rx = pick(r, [10, 12, 14]);
    const ry = pick(r, [5, 6, 7]);
    return { xs, mu, s, x, n, sg, xb, p0, nn, k, b, rx, ry };
  }, [seed]);
  const [val, setVal] = useState('');
  const [vals, setVals] = useState<string[]>(['', '']);
  const set = (i: number, v: string) => setVals((o) => o.map((t, k) => (k === i ? v : t)));
  const se = d.sg / Math.sqrt(d.n);
  const lo = d.xb - 1.96 * se;
  const hi = d.xb + 1.96 * se;
  const zp = (d.k / d.nn - d.p0) / Math.sqrt((d.p0 * (1 - d.p0)) / d.nn);

  useEffect(() => {
    const L: [string, string, string[]][] = [
      ['Cifra 1. Dosis diarias en seis días de la copia. ¿Cuál es la media? (Dos decimales.)', '\\bar x=\\frac1n\\sum x_i', ['Suma los seis valores.', 'Divide por 6.']],
      [`Cifra 2. Semana 31: el Cerro reporta ${d.x} dosis; la región tiene $\\mu=${d.mu}$ y $\\sigma=${d.s}$. ¿Puntaje z? (Dos decimales.)`, 'z=\\frac{x-\\mu}{\\sigma}', ['Resta la media.', 'Divide por la desviación estándar.']],
      [`Cifra 3. Una muestra de ${d.n} fichas da edad media $\\bar x=${num(d.xb, 1)}$ con $\\sigma=${d.sg}$. Intervalo de confianza del 95 %. (Dos decimales.)`, '\\bar x\\pm1{,}96\\frac{\\sigma}{\\sqrt n}', [`$\\text{EE}=${d.sg}/${Math.sqrt(d.n)}$.`, 'Margen: 1,96 por el error estándar.']],
      [`Cifra 4. De ${d.nn} fichas, ${d.k} dicen «vacunado». Contra $H_0: p=0{,}95$, ¿cuánto vale $z$? (Dos decimales.)`, 'z=\\frac{\\hat p-p_0}{\\sqrt{p_0(1-p_0)/n}}', [`$\\hat p=${num(d.k / d.nn, 3)}$.`, 'El error estándar usa $p_0=0{,}95$.']],
      [`Cifra 5. La recta de las clínicas es $\\hat y=0{,}95\\,x$ (cientos). El Cerro recibió ${d.rx} y registró ${d.ry}. ¿Residuo? (Dos decimales.)`, 'e=y-\\hat y', [`$\\hat y=0{,}95\\cdot${d.rx}$.`, 'Observado menos predicho.']],
    ];
    const [t, tex, hs] = L[round];
    api.prompt(t, tex);
    api.hints(hs);
    setVal('');
    setVals(['', '']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, d]);

  const submit = () => {
    if (round === 2) {
      const v = vals.map(parseNum);
      if (v[0] === null || v[1] === null) return;
      if (Math.abs(v[0] - lo) < 0.02 && Math.abs(v[1] - hi) < 0.02) return api.result(true, `$[${num(lo)};\\ ${num(hi)}]$: 72 queda fuera.`);
      return api.result(false, `Margen: $1{,}96\\cdot\\tfrac{${d.sg}}{${Math.sqrt(d.n)}}=${num(1.96 * se)}$.`);
    }
    const v = parseNum(val);
    if (v === null) return;
    const t = [mean(d.xs), (d.x - d.mu) / d.s, 0, zp, d.ry - d.b * d.rx][round];
    const tol = round === 0 ? 0.006 : 0.011;
    if (Math.abs(v - t) < tol) {
      const msg = [`$\\tfrac{${sum(d.xs)}}{6}=${num(t)}$.`, `$z=${num(t)}$: fuera de lo normal.`, '', `$z\\approx${num(t)}$: se rechaza la cifra del 95 %.`, `$e=${d.ry}-${num(d.b * d.rx)}=${num(t)}$ cientos de dosis.`];
      return api.result(true, msg[round]);
    }
    const why = [`La suma es ${sum(d.xs)}.`, '$z=(x-\\mu)/\\sigma$.', '', 'Usa $p_0$ en el error estándar y cuida el signo.', 'Residuo: observado menos predicho.'];
    return api.result(false, why[round]);
  };

  return (
    <Stage>
      {round === 0 && <Cap x={600} y={330} size={34} color={C.text} tex={d.xs.join(',\\ ')} />}
      {round === 1 && <Cap x={600} y={330} size={30} color={C.text} tex={`x=${d.x},\\ \\mu=${d.mu},\\ \\sigma=${d.s}`} />}
      {round === 2 && <Cap x={600} y={330} size={30} color={C.text} tex={`n=${d.n},\\ \\bar x=${num(d.xb, 1)},\\ \\sigma=${d.sg}`} />}
      {round === 3 && <Cap x={600} y={330} size={30} color={C.text} tex={`n=${d.nn},\\ \\text{vacunados}=${d.k},\\ p_0=0{,}95`} />}
      {round === 4 && <Cap x={600} y={330} size={30} color={C.text} tex={`\\hat y=0{,}95x,\\ x=${d.rx},\\ y=${d.ry}`} />}
      {round === 2 ? (
        <MatInput x={1060} y={340} vals={vals} onChange={set} onEnter={submit} rows={1} cols={2} label="IC =" />
      ) : (
        <NumberField x={1100} y={340} value={val} onChange={setVal} onEnter={submit} label={['media =', 'z =', '', 'z =', 'e ='][round]} width={4} />
      )}
      <Html x={1300} y={700} size={16} color={C.muted}>
        <span>{`cifra ${round + 1} de 5`}</span>
      </Html>
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w6-final',
  world: 'statistics',
  code: '6.★',
  title: 'El informe',
  subtitle: 'Repaso del mundo',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w6-closed',
  guide: 'ana',
  teaser: 'La fiscalía recibe el informe del Archivo mañana. Cada cifra tiene que poder defenderse.',
  learn: 'Usar juntas las herramientas del mundo: medidas de resumen, puntaje z, intervalos de confianza, pruebas de hipótesis y regresión.',
  glyphs: ['st-mean', 'st-z', 'st-ci', 'st-pval', 'st-reg'],
  steps: [
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'nar', text: 'Archivo Regional, 23:00. La lámpara zumba sobre las carpetas.' },
        { who: 'ana', text: 'La fiscalía recibe el informe mañana a las ocho. Quiero revisar las cinco cifras antes de poner mi firma junto a la de su agencia.' },
        { who: 'iris', text: 'Revísalas. Halcón va a buscar el primer número que no podamos defender.' },
        { who: 'teo', text: 'Tengo las copias abiertas y cada cálculo listo para repetir. Nos queda esta noche.' },
      ],
    },
    { kind: 'challenge', title: 'El informe', Comp: Report, rounds: 5 },
    {
      kind: 'scene',
      place: 'archivo',
      lines: [
        { who: 'ana', text: 'Las cinco cifras quedaron verificadas y con sus respaldos. Falta explicar las 140 dosis que seguimos sin ubicar.' },
        { who: 'teo', text: 'Encontré el acceso externo que modificó el registro: «Halcón Drones — base Los Cerros». Esa cuenta dejó rastro.' },
        { who: 'ana', text: 'Las 140 salieron de la clínica en drones; uno no volvió. Perdió la señal sobre una quebrada.' },
        { who: 'iris', text: 'Guarda ese último punto junto al informe. En algún lugar de esa quebrada todavía hay vacunas que nadie recibió.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
