import { useState } from 'react';
import { Radar, ArrowLeft, ArrowRight, RotateCcw } from '../ui/icons';
import { bayes, entropy, seedRandom } from '../../domain/math';
import { Math as Formula } from '../ui/Math';
const rng = seedRandom(947);
export function Arena() {
  const [hidden, setHidden] = useState(() => (rng() < 0.5 ? 0 : 1)),
    [belief, setBelief] = useState(0.5),
    [observations, setObservations] = useState<number[]>([]),
    [round, setRound] = useState(1),
    [score, setScore] = useState(0),
    [result, setResult] = useState<null | {
      correct: boolean;
      hidden: number;
      probability: number;
    }>(null),
    [history, setHistory] = useState<{ correct: boolean; score: number; brier: number }[]>([]);
  const accuracy = 0.8;
  const information =
    entropy(belief) -
    ((accuracy * belief + (1 - accuracy) * (1 - belief)) *
      entropy(bayes(belief, accuracy, 1 - accuracy)) +
      ((1 - accuracy) * belief + accuracy * (1 - belief)) *
        entropy(bayes(belief, 1 - accuracy, accuracy)));
  const scan = () => {
    if (observations.length >= 3 || result) return;
    const o = rng() < accuracy ? hidden : 1 - hidden;
    setObservations([...observations, o]);
    setBelief(bayes(belief, o === 0 ? accuracy : 1 - accuracy, o === 0 ? 1 - accuracy : accuracy));
  };
  const choose = (side: number) => {
    if (result) return;
    const correct = side === hidden;
    const gain = (correct ? 200 : 0) - observations.length * 20;
    const brier = (belief - (hidden === 0 ? 1 : 0)) ** 2;
    setScore(score + gain);
    setHistory([...history, { correct, score: gain, brier }]);
    setResult({ correct, hidden, probability: side === 0 ? belief : 1 - belief });
  };
  const next = () => {
    setHidden(rng() < 0.5 ? 0 : 1);
    setBelief(0.5);
    setObservations([]);
    setResult(null);
    setRound(round + 1);
  };
  const reset = () => {
    setHidden(rng() < 0.5 ? 0 : 1);
    setBelief(0.5);
    setObservations([]);
    setResult(null);
    setRound(1);
    setScore(0);
    setHistory([]);
  };
  return (
    <section className="arena">
      <div className="arena-heading">
        <div>
          <span className="eyebrow">ARENA / SENSOR INCIERTO</span>
          <h1>Busca la señal oculta.</h1>
          <p>
            Dos cámaras. Una fuente de señal. El sensor acierta el 80% de las veces. Decide cuánto
            necesitas observar antes de actuar.
          </p>
        </div>
        <div className="arena-score">
          <span>RONDA {round} / 5</span>
          <strong>{score}</strong>
          <small>PUNTOS DE ESTA PARTIDA</small>
        </div>
      </div>
      <div className="arena-board">
        <div className="arena-grid" />
        <div className="arena-radar">
          <Radar size={64} />
          <span>SENSOR A = 0.8</span>
        </div>
        <div className="chambers">
          {[0, 1].map((side) => (
            <button
              className={`chamber ${result?.hidden === side ? 'revealed' : ''}`}
              key={side}
              disabled={!!result}
              onClick={() => choose(side)}
            >
              <span className="chamber-index">{side === 0 ? 'L' : 'R'}</span>
              <div className="signal-orb" />
              <strong>{side === 0 ? 'Cámara izquierda' : 'Cámara derecha'}</strong>
              <span className="chamber-belief">
                {((side === 0 ? belief : 1 - belief) * 100).toFixed(1)}% de creencia
              </span>
              <div className="belief-bar">
                <i style={{ width: `${(side === 0 ? belief : 1 - belief) * 100}%` }} />
              </div>
              <small>
                {result ? (result.hidden === side ? 'FUENTE REAL' : 'VACÍA') : 'Elegir esta cámara'}
              </small>
            </button>
          ))}
        </div>
        <div className="scan-history">
          <span>DATOS</span>
          {observations.length ? (
            observations.map((o, i) => (
              <b key={i}>
                {o === 0 ? <ArrowLeft size={18} /> : <ArrowRight size={18} />} {i + 1}
              </b>
            ))
          ) : (
            <small>Aún no hay observaciones.</small>
          )}
        </div>
      </div>
      <div className="arena-console">
        <div>
          <span className="eyebrow">VALOR DE LA SIGUIENTE OBSERVACIÓN</span>
          <strong>{information.toFixed(3)} nats</strong>
          <p>
            Información mutua esperada, antes de ver el dato. Una observación concreta puede
            aumentar o reducir tu confianza.
          </p>
        </div>
        <button className="primary" onClick={scan} disabled={!!result || observations.length >= 3}>
          <Radar size={18} /> Escanear · −20 puntos{' '}
          <small>{3 - observations.length} disponibles</small>
        </button>
      </div>
      {result && (
        <div className="arena-result" role="status">
          <h2>{result.correct ? 'Fuente localizada.' : 'La fuente estaba en la otra cámara.'}</h2>
          <p>
            Tu creencia para la cámara elegida era {Math.round(result.probability * 100)}%. Una
            decisión razonable puede fallar: el resultado de una ronda y la calidad de la inferencia
            son cosas diferentes.
          </p>
          {round < 5 ? (
            <button className="primary" onClick={next}>
              Siguiente ronda →
            </button>
          ) : (
            <>
              <p>
                Resultado: {history.filter((h) => h.correct).length}/5 aciertos. Error de Brier
                medio: {(history.reduce((s, h) => s + h.brier, 0) / 5).toFixed(3)}. Compara
                precisión, observaciones y coste.
              </p>
              <button className="primary" onClick={reset}>
                <RotateCcw size={16} /> Nueva partida
              </button>
            </>
          )}
        </div>
      )}
      <details className="model-notebook">
        <summary>Inspeccionar el modelo de la partida</summary>
        <p>
          El estado oculto se sortea con prior uniforme al empezar cada ronda; permanece fijo. Cada
          lectura es independiente dado el estado. Se permiten tres lecturas y una decisión. Un
          acierto aporta 200 puntos; cada lectura cuesta 20. La puntuación de arena no modifica la
          acreditación de la campaña.
        </p>
        <Formula
          tex={
            'P(L|o)=\\frac{P(o|L)P(L)}{P(o|L)P(L)+P(o|R)P(R)},\\quad IG=H(s)-\\mathbb E_o H(s|o)'
          }
          block
        />
        <p>
          La partida aplica inferencia bayesiana y una decisión humana. El mundo 13 desarrolla el
          criterio de energía libre esperada con preferencias declaradas.
        </p>
      </details>
    </section>
  );
}
