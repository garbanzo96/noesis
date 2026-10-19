import { useEffect, useMemo, useState } from 'react';
import { C } from '../../engine/palette';
import { Html, Stage, plane } from '../../engine/Stage';
import { Axes, Curve, Dot } from '../../engine/shapes';
import type { ChallengeProps, Glyph, LevelSpec } from '../../game/level/types';
import { pick, randInt, rng } from '../shared/rng';
import { Confirm, NumberField, dec, parseNum } from '../shared/ui';
import { Formula } from '../w05/kit';
import { Tangent, nt } from './kit';

// ============================================================================
// CASO 2.★ · «El apagón» — repaso del distrito
// Cinco momentos de la noche: límite lateral en el salto, potencia desde el medidor, razón de
// engranajes, punto de máxima potencia y estimación lineal de la temperatura.
// ============================================================================

function Hole({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={9} fill={C.bg} stroke={C.cyan} strokeWidth={3} />;
}

function Blackout({ seed, round, api }: ChallengeProps) {
  const data = useMemo(() => {
    const r = rng(seed);
    const before = pick(r, [220, 230]);
    const after = before - pick(r, [4, 6, 8, 10]);
    const ea = pick(r, [1.5, 2, 3]);
    const eb = randInt(r, 2, 6);
    const et = pick(r, [0.5, 1, 1.5]);
    const nT = pick(r, [48, 60]);
    const nM = pick(r, [12, 16]);
    const rpm = pick(r, [300, 450]);
    const pa = pick(r, [16, 20, 24]);
    const pb = pick(r, [0.1, 0.2]);
    const T0 = randInt(r, 85, 100);
    const Tp = pick(r, [0.8, 1.2, 1.5, 2]);
    const h = pick(r, [5, 10]);
    return { before, after, ea, eb, et, nT, nM, rpm, pa, pb, T0, Tp, h };
  }, [seed]);
  const d = data;
  const [val, setVal] = useState('');

  useEffect(() => {
    const P: [string, string, string[]][] = [
      [`03:12, sala de control. La tensión cae de golpe. ¿A qué valor se acerca justo **después** del salto, en volts?`, '\\lim_{t\\to3{,}2^+}V(t)', ['Mira solo el tramo de la derecha.', 'El punto lleno es el valor registrado en el instante; el límite lateral mira los vecinos.']],
      [`03:40. El medidor del subsuelo marca $E(t)=${nt(d.ea, 1)}t^2+${d.eb}t$ MWh. ¿Qué potencia tira en $t=${nt(d.et, 1)}$ h, en MW?`, "P=E'(t)", ["Deriva: $E'(t)=" + nt(2 * d.ea, 1) + 't+' + d.eb + '$.', 'Reemplaza el tiempo.']],
      [`04:00. La turbina 3 (${d.nT} dientes) mueve el piñón del generador extra (${d.nM} dientes). Si la turbina gira a ${d.rpm} rpm, ¿a cuántas rpm gira el generador?`, '\\tfrac{dG}{dT}=\\tfrac{N_T}{N_G}', ['Cada vuelta de la turbina hace pasar sus dientes por el piñón.', `Razón: ${d.nT}/${d.nM}.`]],
      [`04:12. El transformador entrega $P(I)=${d.pa}I-${nt(d.pb, 1)}I^2$ kW. ¿Cuál es la **potencia máxima** que puede entregar, en kW?`, "P'(I)=0", ['Primero la corriente óptima: $P\'(I)=0$.', 'Después evalúa $P$ en esa corriente.']],
      [`04:20. El transformador está a ${d.T0} °C y sube a ${nt(d.Tp, 1)} °C/min. Con la aproximación lineal, ¿qué temperatura tendrá en ${d.h} minutos?`, "T(t_0+h)\\approx T(t_0)+T'(t_0)\\,h", ['Temperatura actual más ritmo por tiempo.', `$${d.T0}+${nt(d.Tp, 1)}\\cdot${d.h}$.`]],
    ];
    const [p, tex, hs] = P[round];
    api.prompt(p, tex);
    api.hints(hs);
    setVal('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, data]);

  const submit = () => {
    const v = parseNum(val);
    if (v === null) return;
    if (round === 0) {
      if (Math.abs(v - d.after) < 0.5) return api.result(true, `Por la derecha se acerca a ${d.after} V; por la izquierda, a ${d.before} V. El límite no existe: es el salto de la carga oculta.`);
      if (Math.abs(v - d.before) < 0.5) return api.result(false, `${d.before} V es el límite por la izquierda, antes del salto.`);
      return api.result(false, 'Sigue el tramo de la derecha hasta el instante del salto.');
    }
    if (round === 1) {
      const t = 2 * d.ea * d.et + d.eb;
      if (Math.abs(v - t) < 0.01) return api.result(true, `$E'(${nt(d.et, 1)})=${nt(2 * d.ea, 1)}\\cdot${nt(d.et, 1)}+${d.eb}=${nt(t, 2)}$ MW.`);
      return api.result(false, `$E'(t)=${nt(2 * d.ea, 1)}t+${d.eb}$. Reemplaza $t=${nt(d.et, 1)}$.`);
    }
    if (round === 2) {
      const t = (d.rpm * d.nT) / d.nM;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$${d.rpm}\\cdot\\tfrac{${d.nT}}{${d.nM}}=${dec(t, 1)}$ rpm. El generador extra gira ${dec(d.nT / d.nM, 1)} veces más rápido.`);
      if (Math.abs(v - (d.rpm * d.nM) / d.nT) < 0.5) return api.result(false, 'Al revés: una rueda grande que mueve una chica la hace girar más rápido.');
      return api.result(false, `Multiplica las rpm por la razón ${d.nT}/${d.nM}.`);
    }
    if (round === 3) {
      const Is = d.pa / (2 * d.pb);
      const t = d.pa * Is - d.pb * Is * Is;
      if (Math.abs(v - t) < 0.5) return api.result(true, `$I^*=${nt(Is, 1)}$ A y $P(I^*)=${nt(t, 1)}$ kW. La carga oculta estaba justo ahí.`);
      if (Math.abs(v - Is) < 0.5) return api.result(false, `${nt(Is, 1)} A es la corriente óptima. Falta evaluar la potencia en ella.`);
      return api.result(false, `$P'(I)=${d.pa}-${nt(2 * d.pb, 1)}I=0$ da $I^*=${nt(Is, 1)}$. Evalúa $P(I^*)$.`);
    }
    const t = d.T0 + d.Tp * d.h;
    if (Math.abs(v - t) < 0.05) return api.result(true, `≈ ${nt(t, 1)} °C. ${t >= 110 ? 'Pasa los 110 °C: Teo corta la carga justo a tiempo.' : 'Queda bajo los 110 °C, por poco.'}`);
    return api.result(false, `$${d.T0}+${nt(d.Tp, 1)}\\cdot${d.h}$.`);
  };

  const Q = plane([2.6, 3.8], [d.after - 6, d.before + 6], { x: 300, y: 130, w: 960, h: 480 });
  const vL = (t: number) => d.before + 0.6 * Math.sin(5 * t);
  const vR = (t: number) => d.after + 0.6 * Math.sin(5 * t);
  return (
    <Stage>
      {round === 0 ? (
        <>
          <Axes P={Q} xTicks={[2.8, 3, 3.2, 3.4, 3.6]} yTicks={[d.after - 4, d.after, d.before, d.before + 4]} xLabel="t\ (\text{h})" yLabel="V" grid />
          <Curve P={Q} f={vL} a={2.6} b={3.199} color={C.cyan} width={4} />
          <Curve P={Q} f={vR} a={3.201} b={3.8} color={C.cyan} width={4} />
          <Hole x={Q.x(3.2)} y={Q.y(vL(3.2))} />
          <Dot x={Q.x(3.2)} y={Q.y(vR(3.2))} r={8} color={C.cyan} />
        </>
      ) : round === 3 ? (
        (() => {
          const Is = d.pa / (2 * d.pb);
          const f = (i: number) => d.pa * i - d.pb * i * i;
          const R = plane([0, 2 * Is], [0, f(Is) * 1.2], { x: 300, y: 130, w: 960, h: 480 });
          return (
            <>
              <Axes P={R} xTicks={[0, Is / 2, Is, (3 * Is) / 2, 2 * Is].map((x) => Math.round(x))} yTicks={[]} xLabel="I" yLabel="P" grid />
              <Curve P={R} f={f} a={0} b={2 * Is} color={C.cyan} width={4} />
              <Tangent P={R} f={f} a={Is * 0.5} half={Is * 0.3} color={C.amber} />
            </>
          );
        })()
      ) : (
        <Formula
          y={300}
          size={36}
          tex={round === 1 ? `E(t)=${nt(d.ea, 1)}t^2+${d.eb}t` : round === 2 ? `${d.nT}\\ \\text{dientes}\\ \\to\\ ${d.nM}\\ \\text{dientes}` : `T=${d.T0}\\,^\\circ\\text{C},\\quad T'=${nt(d.Tp, 1)}\\ \\tfrac{^\\circ\\text{C}}{\\text{min}}`}
        />
      )}
      <Html x={1290} y={680} size={16} color={C.muted}>
        <span>{['03:12', '03:40', '04:00', '04:12', '04:20'][round]}</span>
      </Html>
      <NumberField x={560} y={700} value={val} onChange={setVal} onEnter={submit} label={['Volts:', 'MW:', 'rpm:', 'kW:', '°C:'][round]} width={6} />
      <Confirm onClick={submit} />
    </Stage>
  );
}

export const level: LevelSpec = {
  id: 'w2-final',
  world: 'differential',
  code: '2.★',
  title: 'El apagón',
  subtitle: 'Repaso del distrito',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w2-closed',
  guide: 'iris',
  teaser: 'Hay que bajar al subsuelo antes de las 04:35, cuando el transformador se quema. Nadia firmó la entrada con su nombre completo.',
  learn: 'Usar juntas las herramientas del distrito: límites laterales, derivada como potencia, razones encadenadas, optimización y aproximación lineal.',
  glyphs: ['lateral', 'deriv', 'chain-rule', 'crit', 'linapprox'],
  steps: [
    {
      kind: 'scene',
      place: 'planta',
      lines: [
        { who: 'nar', text: 'Central Halcón Energía, tres de la madrugada. Nadia firmó la planilla de entrada con su nombre completo, cosa que no hacía nunca.' },
        { who: 'nadia', text: 'Tengo las llaves del subsuelo. A las 03:12 se conecta la carga, y el transformador puede llegar a 110 °C.' },
        { who: 'teo', text: 'Sigo los medidores mientras bajamos. Tenemos que llegar al corte antes de las 04:35.' },
        { who: 'iris', text: 'Nadia, abrir esa puerta te va a costar explicaciones.' },
        { who: 'nadia', text: 'Ya firmé el turno. Prefiero tener que explicar lo que pasó.' },
      ],
    },
    { kind: 'challenge', title: 'El apagón', Comp: Blackout, rounds: 5 },
    {
      kind: 'scene',
      place: 'servidores',
      lines: [
        { who: 'nar', text: 'Subsuelo de la central, cuatro y media. Los ventiladores rugían, y el aire estaba tibio como en una panadería.' },
        { who: 'teo', text: 'Cientos de servidores: aquí termina la carga nocturna de 12 MW. Llegamos antes de los 110 °C.' },
        { who: 'nadia', text: 'Se enfrían con agua de la represa Peñuelas, y lo que entra por esa tubería supera el caudal registrado.' },
        { who: 'iris', text: 'Entonces alguien está alterando los caudalímetros para que esta sala no aparezca.' },
        { who: 'nadia', text: 'El cable tenía una firma pendiente, y la tubería trae un informe de caudal firmado por la misma persona.' },
      ],
    },
  ],
};

export const glyphs: Glyph[] = [];
