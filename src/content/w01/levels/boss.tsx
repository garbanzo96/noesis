import { useEffect, useRef, useState } from 'react';
import { clamp, fmt } from '../../../engine/anim';
import { useSvgDrag, useTween } from '../../../engine/hooks';
import { C } from '../../../engine/palette';
import { Group, Html, Stage } from '../../../engine/Stage';
import { Arrow, Dot, Line } from '../../../engine/shapes';
import { Tex } from '../../../engine/Tex';
import type { ChallengeProps, CodexEntry, Glyph, LevelSpec } from '../../../game/level/types';
import { BeliefBars, ScoreBars, softmax } from '../shared/Bars';

// ============================================================================
// NÚCLEO 01 · "Tres causas, una creencia"
// Integrates World 1: Bayes in log space → stabilize → exponentiate & normalize → evidence
// and surprise → precision. Canonical case (all numbers exact):
//   prior (1/2, 1/3, 1/6), likelihood (1/6, 1/2, 1) → joint (1/12, 1/6, 1/6)
//   evidence 5/12, posterior (1/5, 2/5, 2/5), surprise ln(12/5) ≈ 0.876 nats
//   two plans G = (0, ln 3): q(π1) = 1/(1+3^{−γ}) = 0.9 ⇔ γ = 2
// Two traps (an "oracle" proposes classic mistakes): σ applied to probabilities; ln(a+b)=ln a+ln b.
// ============================================================================

const CAUSE = [C.cyan, C.amber, C.blue];
const S = ['s_1', 's_2', 's_3'];
const PRIOR = [1 / 2, 1 / 3, 1 / 6];
const PRIOR_T = ['\\tfrac12', '\\tfrac13', '\\tfrac16'];
const LIK = [1 / 6, 1 / 2, 1];
const LIK_T = ['\\tfrac16', '\\tfrac12', '1'];
const JOINT = PRIOR.map((p, i) => p * LIK[i]);
const Z = JOINT.map(Math.log);
const ZMAX = Math.max(...Z);
const EVID = JOINT.reduce((a, b) => a + b, 0); // 5/12
const POST = JOINT.map((j) => j / EVID); // (0.2, 0.4, 0.4)
const MARKS = [1 / 24, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 1];
const MARK_T = ['\\tfrac1{24}', '\\tfrac1{12}', '\\tfrac18', '\\tfrac16', '\\tfrac14', '\\tfrac13', '\\tfrac12', '1'];
const LX = (u: number) => 1330 + 320 * u; // additive (nats) → px; 0 at 1330

function Oracle({ text, onAccept, x = 330, y = 790 }: { text: string; onAccept: () => void; x?: number; y?: number }) {
  return (
    <Html x={x} y={y} size={20} interactive>
      <div className="oracle">
        <span className="oracle-tag">ORÁCULO</span>
        <span className="oracle-text">
          <Tex tex={text} />
        </span>
        <button className="stage-btn" onClick={onAccept}>
          aceptar propuesta
        </button>
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------- phase 1: score
function PhaseScore({ api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [pos, setPos] = useState<number[]>(() => PRIOR.map((p) => MARKS.indexOf(MARKS.find((m) => Math.abs(m - p) < 1e-9)!)));
  const grab = useRef(-1);
  const rows = [330, 470, 610];
  const drag = useSvgDrag(svg, (x, _y, phase) => {
    const i = grab.current;
    if (i < 0) return;
    const u = (x - 1330) / 320;
    let best = 0;
    MARKS.forEach((m, k) => {
      if (Math.abs(Math.log(m) - u) < Math.abs(Math.log(MARKS[best]) - u)) best = k;
    });
    if (best !== pos[i]) {
      api.sfx.tick();
      setPos(pos.map((p, k) => (k === i ? best : p)));
    }
    if (phase === 'end') grab.current = -1;
  });
  useEffect(() => {
    api.prompt(
      'Fase 1 · **Puntuar**. Cada causa parte en su prior. Desplaza cada ficha por la regla logarítmica hasta su puntuación $z_s=\\ln p(s)+\\ln p(o\\mid s)$: sumar logaritmos es multiplicar.',
      'z_s=\\ln p(s)+\\ln p(o\\mid s)=\\ln p(o,s)',
    );
    api.hints([
      'Desplazar por $\\ln p(o\\mid s)$ en la regla es **multiplicar** por $p(o\\mid s)$.',
      '$p(o,s)$: $\\tfrac12\\cdot\\tfrac16=\\tfrac1{12}$, $\\tfrac13\\cdot\\tfrac12=\\tfrac16$, $\\tfrac16\\cdot1=\\tfrac16$.',
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = () => {
    for (let i = 0; i < 3; i++) {
      const v = MARKS[pos[i]];
      if (Math.abs(v - JOINT[i]) < 1e-9) continue;
      if (Math.abs(v - PRIOR[i]) < 1e-9)
        return api.result(false, `$${S[i]}$ sigue en su prior $${PRIOR_T[i]}$: falta sumar $\\ln p(o\\mid ${S[i]})=\\ln ${LIK_T[i]}$, es decir multiplicar por $${LIK_T[i]}$.`);
      if (Math.abs(v - LIK[i]) < 1e-9)
        return api.result(false, `$${S[i]}$ está en $${LIK_T[i]}=p(o\\mid ${S[i]})$: olvidaste el prior. La conjunta es $p(${S[i]})\\,p(o\\mid ${S[i]})$.`);
      return api.result(false, `$${S[i]}$ está en $${MARK_T[pos[i]]}$, pero $p(${S[i]})\\,p(o\\mid ${S[i]})=${PRIOR_T[i]}\\cdot${LIK_T[i]}$.`);
    }
    api.result(true, 'Puntuaciones listas: $\\mathbf z=(\\ln\\tfrac1{12},\\ln\\tfrac16,\\ln\\tfrac16)$. Todas negativas: son log-probabilidades conjuntas.');
  };
  return (
    <Stage ref={svg}>
      <Html x={800} y={150} size={30} color={C.text}>
        <Tex tex="p(\mathbf s)=(\tfrac12,\tfrac13,\tfrac16),\qquad p(o\mid \mathbf s)=(\tfrac16,\tfrac12,1)" />
      </Html>
      {rows.map((y, i) => {
        const v = MARKS[pos[i]];
        return (
          <g key={i}>
            <line x1={LX(Math.log(1 / 24)) - 20} x2={LX(0) + 20} y1={y} y2={y} stroke={C.line} strokeWidth={2} />
            {MARKS.map((m, k) => (
              <g key={k}>
                <line x1={LX(Math.log(m))} x2={LX(Math.log(m))} y1={y - 10} y2={y + 10} stroke={C.dim} strokeWidth={2} />
                <Html x={LX(Math.log(m))} y={y + 32} size={17} color={C.muted}>
                  <Tex tex={MARK_T[k]} />
                </Html>
              </g>
            ))}
            <Html x={140} y={y} size={24} anchor="left" color={CAUSE[i]}>
              <Tex tex={`${S[i]}:\\ ${PRIOR_T[i]}\\times${LIK_T[i]}`} />
            </Html>
            {/* prior ghost */}
            <circle cx={LX(Math.log(PRIOR[i]))} cy={y} r={11} fill="none" stroke={CAUSE[i]} strokeWidth={2} strokeDasharray="4 4" />
            {Math.abs(v - PRIOR[i]) > 1e-9 && (
              <Arrow from={[LX(Math.log(PRIOR[i])), y - 26]} to={[LX(Math.log(v)), y - 26]} color={CAUSE[i]} width={3} />
            )}
            <g
              onPointerDown={(e) => {
                grab.current = i;
                drag(e);
              }}
              style={{ cursor: 'ew-resize' }}
            >
              <Dot x={LX(Math.log(v))} y={y} r={15} color={CAUSE[i]} ring />
            </g>
          </g>
        );
      })}
      <Html x={1400} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- phase 2: stabilize
function PhaseStabilize({ api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [c, setC] = useState(0);
  const start = useRef({ x: 0, c: 0 });
  const drag = useSvgDrag(svg, (x, _y, phase) => {
    if (phase === 'start') {
      start.current = { x, c };
      return;
    }
    let v = start.current.c + (x - start.current.x) / 320;
    v = clamp(v, -0.5, 3);
    if (Math.abs(ZMAX + v) < 0.06) v = -ZMAX;
    setC(v);
  });
  useEffect(() => {
    api.prompt(
      'Fase 2 · **Estabilizar**. Exponenciar números muy negativos (o muy grandes) destruye la precisión numérica. Arrastra el conjunto entero hasta que la mayor puntuación quede en $0$.',
      '\\mathbf z\\ \\mapsto\\ \\mathbf z-\\max_k z_k',
    );
    api.hints([
      'Sumar la misma constante a todas las puntuaciones no cambia $\\sigma(\\mathbf z)$.',
      `La mayor es $\\ln\\tfrac16\\approx${fmt(ZMAX, 2)}$: hay que desplazar $+\\ln 6\\approx1.79$.`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = () => {
    if (Math.abs(ZMAX + c) < 1e-9)
      return api.result(true, '$\\mathbf z-\\max_k z_k=(-\\ln 2,\\,0,\\,0)$. Mismas diferencias, misma creencia, sin desbordes.');
    api.result(false, `La mayor puntuación quedó en $${fmt(ZMAX + c, 2)}$; debe quedar exactamente en $0$.`);
  };
  const y = 470;
  return (
    <Stage ref={svg}>
      <line x1={LX(-3.4)} x2={LX(0.8)} y1={y} y2={y} stroke={C.magenta} strokeWidth={2} />
      {[-3, -2, -1, 0].map((t) => (
        <g key={t}>
          <line x1={LX(t)} x2={LX(t)} y1={y - 10} y2={y + 10} stroke={C.magenta} strokeWidth={2} />
          <Html x={LX(t)} y={y + 34} size={20} color={C.magenta}>
            <Tex tex={String(t)} />
          </Html>
        </g>
      ))}
      <Line a={[LX(0), y - 160]} b={[LX(0), y + 60]} color={C.green} width={2} dashed />
      <g onPointerDown={drag} style={{ cursor: 'ew-resize' }}>
        <rect x={LX(Math.min(...Z) + c) - 60} y={y - 150} width={LX(ZMAX + c) - LX(Math.min(...Z) + c) + 120} height={190} fill={C.magenta} opacity={0.06} rx={10} />
        {Z.map((z, i) => (
          <g key={i}>
            <Dot x={LX(z + c)} y={y - 40 - i * 34} r={13} color={CAUSE[i]} />
            <Html x={LX(z + c) + 20} y={y - 40 - i * 34} size={20} anchor="left" color={CAUSE[i]}>
              <Tex tex={`${S[i]}:\\ ${fmt(z + c, 2)}`} />
            </Html>
          </g>
        ))}
      </g>
      <Html x={800} y={180} size={30} color={Math.abs(ZMAX + c) < 1e-9 ? C.green : C.text}>
        <Tex tex={`c=${fmt(c, 2)}\\qquad \\max_k(z_k+c)=${fmt(ZMAX + c, 2)}`} />
      </Html>
      <Html x={800} y={700} size={20} color={C.muted}>
        <span className="panel-note">arrastra el grupo completo ⟷</span>
      </Html>
      <Html x={1400} y={760} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- phase 3: exponentiate & normalize
function PhaseNormalize({ api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [q, setQ] = useState([0.35, 0.35, 0.3]);
  const grab = useRef(-1);
  const y0 = 640;
  const HGT = 420;
  const cx = (i: number) => 1150 + (i - 1) * 150;
  const drag = useSvgDrag(svg, (x, y, phase) => {
    if (phase === 'start') {
      let best = -1;
      let bd = 1e9;
      [0, 1, 2].forEach((i) => {
        const d = Math.abs(cx(i) - x);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      grab.current = bd < 75 ? best : -1;
    }
    const i = grab.current;
    if (i < 0) return;
    const v = Math.round(clamp((y0 - y) / HGT, 0, 1) * 20) / 20;
    if (v !== q[i]) {
      api.sfx.tick();
      setQ(q.map((qq, k) => (k === i ? v : qq)));
    }
    if (phase === 'end') grab.current = -1;
  });
  const w = Z.map((z) => Math.exp(z - ZMAX)); // (1/2, 1, 1)
  useEffect(() => {
    api.prompt(
      'Fase 3 · **Creer**. Exponencia las puntuaciones estabilizadas y normaliza. Ajusta las barras de creencia $q(s)$ (pasos de 0.05).',
      'q(s)=\\sigma(\\mathbf z)_s=\\frac{e^{z_s-\\max z}}{\\sum_k e^{z_k-\\max z}}',
    );
    api.hints(['$e^{-\\ln 2}=\\tfrac12$ y $e^{0}=1$: pesos $(\\tfrac12,1,1)$, total $\\tfrac52$.', 'Divide cada peso por $\\tfrac52$: $(\\tfrac15,\\tfrac25,\\tfrac25)$.']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = () => {
    const bad = q.findIndex((v, i) => Math.abs(v - POST[i]) > 1e-6);
    if (bad < 0)
      return api.result(true, '$q=(\\tfrac15,\\tfrac25,\\tfrac25)=p(s\\mid o)$. Softmax de log-conjuntas **es** el posterior de Bayes.');
    const sum = q.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 1e-6) return api.result(false, `Tus creencias suman $${fmt(sum, 2)}$: una distribución debe sumar 1. Divide los pesos por su total $\\tfrac52$.`);
    api.result(false, `$q(${S[bad]})=${fmt(q[bad], 2)}$, pero $\\frac{${fmt(w[bad], 2)}}{5/2}=${fmt(POST[bad], 2)}$.`);
  };
  const oracle = softmax(JOINT);
  return (
    <Stage ref={svg}>
      <Html x={450} y={130} size={20} color={C.amber}>
        <span className="panel-note">PESOS e^(z − max z)</span>
      </Html>
      <BeliefBars x={450} y0={y0} values={w} height={HGT} gap={150} barW={86} color={CAUSE} labels={S.map((s) => `e^{z_{${s.slice(2)}}-\\max z}`)} />
      <Html x={450} y={y0 + 70} size={24} color={C.amber}>
        <Tex tex="\textstyle\sum_k=\tfrac12+1+1=\tfrac52" />
      </Html>
      <Arrow from={[730, 420]} to={[870, 420]} color={C.text} width={3} />
      <Html x={800} y={390} size={22} color={C.text}>
        <Tex tex="\div\tfrac52" />
      </Html>
      <Html x={1150} y={130} size={20} color={C.violet}>
        <span className="panel-note">CREENCIA q(s) · arrastra</span>
      </Html>
      <g onPointerDown={drag} style={{ cursor: 'ns-resize' }}>
        <rect x={cx(0) - 75} y={y0 - HGT - 30} width={450} height={HGT + 60} fill="transparent" />
        <BeliefBars x={1150} y0={y0} values={q} height={HGT} gap={150} barW={86} color={CAUSE} labels={S.map((s) => `q(${s})`)} />
      </g>
      <Oracle
        text={`q=\\sigma(p(o,\\mathbf s))=(${oracle.map((v) => fmt(v, 2)).join(',\\,')})`}
        onAccept={() =>
          api.result(
            false,
            'El oráculo aplicó softmax a **probabilidades**: $\\sigma(\\mathbf p)\\neq$ posterior (casi uniforme por error). Softmax va sobre **log**-probabilidades: $\\sigma(\\ln\\mathbf p)=\\mathbf p/\\sum\\mathbf p$.',
          )
        }
      />
      <Html x={1400} y={790} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- phase 4: evidence & surprise
function PhaseSurprise({ api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [m, setM] = useState(-2.5);
  const LSE = Math.log(EVID);
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp((x - 1330) / 320, -3.4, 0.6) * 100) / 100;
    if (v !== m) api.sfx.tick();
    setM(v);
  });
  useEffect(() => {
    api.prompt(
      'Fase 4 · **Medir**. La constante que normalizó es $\\ln\\sum_s e^{z_s}=\\ln p(o)$: la log-evidencia. Coloca el marcador en su valor. La franja muestra sus cotas.',
      '\\max_s z_s\\le\\ln\\sum_s e^{z_s}\\le\\max_s z_s+\\ln 3',
    );
    api.hints(['$\\sum_s e^{z_s}=\\sum_s p(o,s)=\\tfrac1{12}+\\tfrac16+\\tfrac16=\\tfrac5{12}$.', `$\\ln\\tfrac5{12}\\approx${fmt(LSE, 3)}$.`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = () => {
    if (Math.abs(m - LSE) <= 0.015)
      return api.result(true, `$\\ln p(o)=\\ln\\tfrac5{12}\\approx${fmt(LSE, 3)}$. Sorpresa: $-\\ln p(o)=\\ln\\tfrac{12}5\\approx${fmt(-LSE, 3)}$ nats.`);
    if (m < ZMAX) return api.result(false, `$${fmt(m, 2)}$ está bajo la cota inferior $\\max_s z_s\\approx${fmt(ZMAX, 2)}$: el log-sum-exp nunca es menor que el máximo.`);
    if (m > ZMAX + Math.log(3)) return api.result(false, `$${fmt(m, 2)}$ supera la cota $\\max_s z_s+\\ln 3\\approx${fmt(ZMAX + Math.log(3), 2)}$.`);
    api.result(false, `Dentro de las cotas, pero $\\ln\\tfrac5{12}\\approx${fmt(LSE, 2)}$, no $${fmt(m, 2)}$.`);
  };
  const y = 470;
  return (
    <Stage ref={svg}>
      <rect x={LX(ZMAX)} y={y - 120} width={LX(ZMAX + Math.log(3)) - LX(ZMAX)} height={160} fill={C.green} opacity={0.08} />
      <line x1={LX(-3.4)} x2={LX(0.6)} y1={y} y2={y} stroke={C.magenta} strokeWidth={2} />
      {[-3, -2, -1, 0].map((t) => (
        <g key={t}>
          <line x1={LX(t)} x2={LX(t)} y1={y - 10} y2={y + 10} stroke={C.magenta} strokeWidth={2} />
          <Html x={LX(t)} y={y + 34} size={20} color={C.magenta}>
            <Tex tex={String(t)} />
          </Html>
        </g>
      ))}
      <Html x={LX(ZMAX)} y={y - 140} size={18} color={C.green}>
        <Tex tex="\max_s z_s" />
      </Html>
      <Html x={LX(ZMAX + Math.log(3))} y={y - 140} size={18} color={C.green}>
        <Tex tex="\max_s z_s+\ln3" />
      </Html>
      {Z.map((z, i) => (
        <g key={i}>
          <Dot x={LX(z)} y={y - 40 - i * 26} r={10} color={CAUSE[i]} />
        </g>
      ))}
      <g onPointerDown={drag} style={{ cursor: 'ew-resize' }}>
        <rect x={LX(m) - 20} y={y - 100} width={40} height={200} fill="transparent" />
        <Line a={[LX(m), y - 90]} b={[LX(m), y + 70]} color={C.text} width={3} />
        <Dot x={LX(m)} y={y + 70} r={14} color={C.text} ring />
      </g>
      <Html x={LX(m)} y={y + 120} size={24} color={C.text}>
        <Tex tex={`${fmt(m, 2)}`} />
      </Html>
      <Oracle
        text={`\\ln\\textstyle\\sum_s e^{z_s}=\\sum_s z_s=${fmt(Z.reduce((a, b) => a + b, 0), 2)}`}
        onAccept={() =>
          api.result(
            false,
            'El oráculo usó $\\ln(a+b)=\\ln a+\\ln b$, que es **falso**: el logaritmo separa productos, no sumas. Además su valor viola la cota inferior $\\max_s z_s$.',
          )
        }
      />
      <Html x={1400} y={790} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- phase 5: decide
function PhaseDecide({ api }: ChallengeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [g, setG] = useState(0.5);
  const T0 = 520;
  const T1 = 1080;
  const GX = (v: number) => T0 + (v / 6) * (T1 - T0);
  const G = [0, Math.log(3)];
  const q = softmax(G.map((x) => -x), g);
  const shownQ = useTween(q, 0.25);
  const drag = useSvgDrag(svg, (x) => {
    const v = Math.round(clamp(((x - T0) / (T1 - T0)) * 6, 0, 6) * 4) / 4;
    if (v !== g) api.sfx.tick();
    setG(v);
  });
  useEffect(() => {
    api.prompt(
      'Fase 5 · **Decidir**. Creo saber qué causó la señal. Ahora debo actuar: dos planes con energía libre esperada $\\mathbf G=(0,\\ln3)$. Ajusta la precisión hasta que $q(\\pi_1)=0.9$.',
      'q(\\pi)=\\sigma(\\ln E-\\gamma\\,\\mathbf G),\\quad E\\ \\text{uniforme}',
    );
    api.hints(['Con $E$ uniforme, $q(\\pi_1)=\\frac{1}{1+e^{-\\gamma\\ln3}}=\\frac{1}{1+3^{-\\gamma}}$.', '$\\frac{1}{1+3^{-\\gamma}}=0.9\\iff3^{-\\gamma}=\\tfrac19\\iff\\gamma=2$.']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const submit = () => {
    if (Math.abs(q[0] - 0.9) < 0.004) return api.result(true, '$\\gamma=2$: $q(\\pi_1)=0.9$. Con $\\gamma=1$ sería $0.75$; con $\\gamma=0$, indiferencia ($0.5$).');
    api.result(false, `Con $\\gamma=${fmt(g, 2)}$, $q(\\pi_1)=${fmt(q[0], 3)}$; se pide $0.9$. ${q[0] < 0.9 ? 'Más' : 'Menos'} precisión.`);
  };
  return (
    <Stage ref={svg}>
      <Html x={420} y={150} size={20} color={C.magenta}>
        <span className="panel-note">G(π) · ENERGÍA LIBRE ESPERADA</span>
      </Html>
      <ScoreBars x={420} y0={500} values={G} scale={150} gap={180} barW={90} color={C.magenta} labels={['\\pi_1', '\\pi_2']} />
      <Html x={1180} y={150} size={20} color={C.violet}>
        <span className="panel-note">q(π)</span>
      </Html>
      <BeliefBars x={1180} y0={600} values={shownQ} height={380} gap={180} barW={90} color={[C.cyan, C.amber]} labels={['q(\\pi_1)', 'q(\\pi_2)']} digits={3} />
      <line x1={1180 - 90 - 60} x2={1180 - 90 + 60} y1={600 - 0.9 * 380} y2={600 - 0.9 * 380} stroke={C.text} strokeWidth={3} strokeDasharray="8 6" />
      <Html x={1180 - 90 - 75} y={600 - 0.9 * 380} size={20} anchor="right" color={C.text}>
        <Tex tex="\text{objetivo } 0.9" />
      </Html>
      <line x1={T0} x2={T1} y1={770} y2={770} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((v) => (
        <Html key={v} x={GX(v)} y={808} size={18} color={C.muted}>
          <Tex tex={String(v)} />
        </Html>
      ))}
      <Dot x={GX(g)} y={770} r={15} color={C.magenta} ring onPointerDown={drag} cursor="ew-resize" />
      <Html x={GX(g)} y={728} size={24} color={C.magenta}>
        <Tex tex={`\\gamma=${fmt(g, 2)}`} />
      </Html>
      <Html x={1350} y={770} size={24} interactive>
        <button className="stage-btn on" onClick={submit}>
          Fijar ▸
        </button>
      </Html>
    </Stage>
  );
}

// ---------------------------------------------------------------- level
export const level: LevelSpec = {
  id: 'w01-boss',
  world: 'foundations',
  code: '1.★',
  title: 'Tres causas, una creencia',
  subtitle: 'Núcleo del sector 01',
  glyph: '\\bigstar',
  kind: 'boss',
  module: 'w01-softmax',
  objective:
    'Reconstruir, sin atajos, la cadena completa: puntuar en escala log, estabilizar, exponenciar y normalizar, medir la evidencia y decidir con precisión.',
  glyphs: [],
  codex: ['w01-boss'],
  steps: [
    {
      kind: 'brief',
      lines: [
        'Señal entrante. Tres causas posibles: $s_1$, $s_2$, $s_3$. Tengo un prior y la verosimilitud de la lectura.',
        'Pero no puedo **creer** nada: el módulo que convierte puntuaciones en creencias está corrupto. Y un subsistema dañado —el oráculo— propone atajos falsos.',
        'Reconstrúyelo fase por fase. Cada error desincroniza el núcleo. Si lo consigues, por primera vez podré abrir el ojo.',
      ],
    },
    { kind: 'challenge', title: 'Fase 1 · Puntuar', Comp: PhaseScore, rounds: 1 },
    { kind: 'challenge', title: 'Fase 2 · Estabilizar', Comp: PhaseStabilize, rounds: 1 },
    { kind: 'challenge', title: 'Fase 3 · Creer', Comp: PhaseNormalize, rounds: 1 },
    { kind: 'challenge', title: 'Fase 4 · Medir', Comp: PhaseSurprise, rounds: 1 },
    { kind: 'challenge', title: 'Fase 5 · Decidir', Comp: PhaseDecide, rounds: 1 },
    { kind: 'codex', entry: 'w01-boss' },
  ],
};

export const codex: CodexEntry[] = [
  {
    id: 'w01-boss',
    world: 'foundations',
    level: 'w01-boss',
    title: 'De puntuaciones a creencias: Bayes en escala log',
    summary: 'Sumar log-prior y log-verosimilitud, restar el máximo, exponenciar y normalizar: softmax de log-conjuntas es el posterior; su normalizador es la evidencia.',
    blocks: [
      { label: 'Puntuar', tex: 'z_s:=\\ln p(s)+\\ln p(o\\mid s)=\\ln p(o,s)' },
      { label: 'Estabilizar', tex: '\\sigma(\\mathbf z)=\\sigma(\\mathbf z-\\max_k z_k\\,\\mathbf 1)' },
      { label: 'Creer', tex: 'q(s)=\\sigma(\\mathbf z)_s=\\frac{p(o,s)}{\\sum_k p(o,k)}=p(s\\mid o)' },
      {
        label: 'Medir',
        tex: '\\ln\\sum_s e^{z_s}=\\ln p(o),\\qquad \\max_s z_s\\le\\ln p(o)\\le\\max_s z_s+\\ln N',
        body: 'La sorpresa de la observación es $-\\ln p(o)$.',
      },
      { label: 'Decidir', tex: 'q(\\pi)=\\sigma\\big(\\ln E(\\pi)-\\gamma\\,G(\\pi)\\big)' },
      {
        label: 'Caso resuelto',
        tex: '\\mathbf z=\\ln(\\tfrac1{12},\\tfrac16,\\tfrac16)\\to(-\\ln2,0,0)\\to q=(\\tfrac15,\\tfrac25,\\tfrac25),\\quad -\\ln p(o)=\\ln\\tfrac{12}5\\approx0.876',
      },
    ],
    pitfalls: [
      'Aplicar softmax a probabilidades: $\\sigma(\\mathbf p)$ no es el posterior.',
      '$\\ln(a+b)\\neq\\ln a+\\ln b$: el log-sum-exp no es la suma de logaritmos.',
      'Olvidar el prior (o la verosimilitud) al puntuar.',
    ],
    aif: [
      { tex: 'F[q]\\ge-\\ln p(o)', text: 'En el sector 11, la energía libre variacional acota esta sorpresa; la igualdad se alcanza cuando $q(s)=p(s\\mid o)$, el posterior que acabas de calcular.' },
      { tex: 'q(\\pi)=\\sigma(\\ln E-F-G)', text: 'La forma completa de la creencia sobre políticas (libro, apéndice B).' },
    ],
  },
];

export const glyphs: Glyph[] = [];
