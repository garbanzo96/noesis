import { useState } from 'react';
import { BrainCircuit, Play, RotateCcw } from '../ui/icons';
import {
  policies,
  predictPolicy,
  selectPolicy,
  updateAgent,
  type PolicyId,
} from '../../domain/agent';
import { seedRandom } from '../../domain/math';
import { Math as Formula } from '../ui/Math';
const rng = seedRandom(2026);
interface Step {
  turn: number;
  policy: string;
  observation: number;
  prior: number;
  posterior: number;
  G: number;
  actual: number;
}
export function AgentLoop() {
  const [belief, setBelief] = useState(0.5),
    [actual, setActual] = useState<0 | 1>(() => (rng() < 0.5 ? 0 : 1)),
    [history, setHistory] = useState<Step[]>([]),
    [reveal, setReveal] = useState(false);
  const recommended = selectPolicy(belief);
  const act = (id: PolicyId) => {
    const policy = policies.find((p) => p.id === id)!,
      prediction = predictPolicy(belief, policy);
    const next = rng() < (actual === 0 ? policy.leftGivenLeft : policy.leftGivenRight) ? 0 : 1;
    const observation = rng() < policy.accuracy ? next : 1 - next;
    const posterior = updateAgent(prediction.state, policy.accuracy, observation as 0 | 1);
    setActual(next);
    setBelief(posterior);
    setHistory([
      {
        turn: history.length + 1,
        policy: policy.name,
        observation,
        prior: prediction.state,
        posterior,
        G: prediction.G,
        actual: next,
      },
      ...history,
    ]);
  };
  const reset = () => {
    setBelief(0.5);
    setActual(rng() < 0.5 ? 0 : 1);
    setHistory([]);
  };
  return (
    <section className="agent-loop">
      <div className="agent-loop-header">
        <div>
          <span className="eyebrow">PROTOCOLO FINAL / AGENTE ACTIVO DISCRETO</span>
          <h2>
            <BrainCircuit size={26} /> Percepción, predicción y acción.
          </h2>
          <p>
            Compara tres políticas por G, ejecuta una y observa cómo el nuevo dato cambia la
            creencia. El estado real está oculto al agente.
          </p>
        </div>
        <button aria-label="Reiniciar agente" onClick={reset}>
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="agent-belief">
        <div>
          <span>CREENCIA PRESENTE</span>
          <strong>P(izquierda) = {belief.toFixed(3)}</strong>
        </div>
        <div className="agent-belief-track">
          <i style={{ width: `${belief * 100}%` }} />
        </div>
        <div>
          <span>POLÍTICA DE MENOR G</span>
          <strong>{recommended.name}</strong>
        </div>
      </div>
      <div className="policy-grid">
        {policies.map((policy) => {
          const p = predictPolicy(belief, policy);
          return (
            <article
              className={`policy-card ${recommended.id === policy.id ? 'recommended' : ''}`}
              key={policy.id}
            >
              <span className="eyebrow">
                {recommended.id === policy.id ? 'MENOR G / RECOMENDADA' : 'POLÍTICA ALTERNATIVA'}
              </span>
              <h3>{policy.name}</h3>
              <p>{policy.description}</p>
              <dl>
                <div>
                  <dt>Estado futuro izquierdo</dt>
                  <dd>{p.state.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Observación izquierda</dt>
                  <dd>{p.observation.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Riesgo KL</dt>
                  <dd>{p.risk.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Ambigüedad H</dt>
                  <dd>{p.ambiguity.toFixed(3)}</dd>
                </div>
                <div className="policy-g">
                  <dt>G = riesgo + ambigüedad</dt>
                  <dd>{p.G.toFixed(3)}</dd>
                </div>
              </dl>
              <button
                className={recommended.id === policy.id ? 'primary' : ''}
                onClick={() => act(policy.id)}
                disabled={history.length >= 12}
              >
                <Play size={14} /> Ejecutar política
              </button>
            </article>
          );
        })}
      </div>
      <div className="agent-step-control">
        <button
          className="primary"
          onClick={() => act(recommended.id)}
          disabled={history.length >= 12}
        >
          <BrainCircuit size={17} /> Ejecutar la recomendación del agente
        </button>
        <p>Mantener es una alternativa de contraste: con este modelo no alcanza el mínimo G.</p>
      </div>
      <div className="agent-history">
        <h3>Cuaderno del bucle · {history.length} / 12 pasos</h3>
        {history.length === 0 ? (
          <p>Antes de actuar, predice qué ocurrirá si el sensor indica derecha.</p>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>t</th>
                  <th>Política</th>
                  <th>Dato o</th>
                  <th>Predicción s</th>
                  <th>Posterior s</th>
                  <th>G previa</th>
                  {reveal && <th>Estado real</th>}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.turn}>
                    <td>{h.turn}</td>
                    <td>{h.policy}</td>
                    <td>{h.observation === 0 ? 'izquierda' : 'derecha'}</td>
                    <td>{h.prior.toFixed(3)}</td>
                    <td>{h.posterior.toFixed(3)}</td>
                    <td>{h.G.toFixed(3)}</td>
                    {reveal && <td>{h.actual === 0 ? 'izquierda' : 'derecha'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <label>
          <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />{' '}
          Revelar estados para auditar el experimento
        </label>
        {history.length >= 12 && <button onClick={reset}>Nuevo experimento</button>}
      </div>
      <details className="model-notebook">
        <summary>Supuestos y cálculo exacto del agente</summary>
        <p>
          Estados y observaciones: izquierda o derecha. Prior inicial uniforme. Cada política
          declara B: mantener y observar mejor usan identidad; orientar usa columnas (0.85,0.15) y
          (0.65,0.35). A tiene columnas (a,1−a) y (1−a,a), con a=0.65 o 0.95. Las preferencias se
          refieren a observaciones: P_C=(0.8,0.2). No hay coste adicional, hábito ni diferencia de F
          presente entre políticas. Horizonte de un paso; se selecciona el mínimo G.
        </p>
        <Formula
          tex={
            "q(s'|\\pi)=B^\\pi q(s),\\quad q(o|\\pi)=A^\\pi q(s'|\\pi),\\quad G_\\pi=D_{KL}(q(o|\\pi)\\|P_C(o))+\\mathbb E_{q(s'|\\pi)}H[A^\\pi_{\\cdot s'}]"
          }
          block
        />
        <p>
          La ambigüedad vale H(a) porque las dos columnas tienen la misma entropía. Tras ejecutar,
          la simulación sortea el estado y el dato; Bayes corrige el estado predicho. Cada tabla usa
          G calculada antes de ver el dato. El agente recomienda el mínimo G; puedes ejecutar otra
          política. Revelar el estado solo sirve para auditar y nunca altera su creencia.
        </p>
      </details>
    </section>
  );
}
