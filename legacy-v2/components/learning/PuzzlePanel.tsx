import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Chapter, GameState, Puzzle, WorldId } from '../../domain/types';
import { parseNumber } from '../../domain/math';
import { Math as Formula } from '../ui/Math';
import { makeVariant } from '../../content/variants';
import { loadAssessment, saveAssessment, freshSeed } from './assessment';

interface PuzzlePanelProps {
  world: WorldId;
  chapter: Chapter;
  state: GameState;
  onAnswer: (id: string, correct: boolean, assisted: boolean) => void;
}
function rich(text: string): ReactNode {
  return text
    .split(/(\$[^$\n]+\$)/g)
    .map((part, index) =>
      part.startsWith('$') && part.endsWith('$') ? (
        <Formula key={index} tex={part.slice(1, -1)} />
      ) : (
        part
      ),
    );
}

function PuzzleCard({
  puzzle: basePuzzle,
  index,
  world,
  chapter,
  state,
  onAnswer,
}: PuzzlePanelProps & { puzzle: Puzzle; index: number }) {
  const [assessment, setAssessment] = useState(() => loadAssessment(basePuzzle.id));
  const puzzle = useMemo(
    () => (assessment.seed === 0 ? basePuzzle : makeVariant(world, basePuzzle, assessment.seed)),
    [assessment.seed, basePuzzle, world],
  );
  const [value, setValue] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const assisted = assessment.assisted;
  const setAssisted = (assisted: boolean) => {
    const next = { ...assessment, assisted };
    setAssessment(next);
    saveAssessment(basePuzzle.id, next);
  };
  const newCase = () => {
    let seed = freshSeed(assessment.seed);
    for (let i = 0; i < 20 && makeVariant(world, basePuzzle, seed).setup === puzzle.setup; i++)
      seed = (seed + 104729) >>> 0;
    const next = { seed, assisted: false };
    setAssessment(next);
    saveAssessment(basePuzzle.id, next);
    setValue('');
    setChoice(null);
    setSequence([]);
    setHintVisible(false);
    setFeedback(null);
    setAttempted(false);
  };
  const [hintVisible, setHintVisible] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | null>(null);
  const [attempted, setAttempted] = useState(false);
  const evidence = state.evidence.filter(
    (item) => item.world === world && item.id === puzzle.id && item.correct,
  );
  const independent =
    evidence.some((item) => item.independent) ||
    (evidence.length === 0 && Boolean(state.worlds[world]?.puzzles.includes(puzzle.id)));
  const supported = !independent && evidence.length > 0;
  const target = Array.isArray(puzzle.answer) ? puzzle.answer : [];
  const stageLabel = (id: string) =>
    chapter.teachingStages.find((stage) => stage.id === id)?.title ?? id;
  const sequencePool = (
    puzzle.choices?.length ? puzzle.choices : chapter.teachingStages.map((stage) => stage.id)
  )
    .slice()
    .reverse();
  function check(event: FormEvent) {
    event.preventDefault();
    let correct = false;
    if (puzzle.kind === 'numeric') {
      const parsed = parseNumber(value);
      if (!Number.isFinite(parsed) || typeof puzzle.answer !== 'number') {
        setFeedback('invalid');
        return;
      }
      correct = Math.abs(parsed - puzzle.answer) <= (puzzle.tolerance ?? 0.001);
    } else if (puzzle.kind === 'choice') {
      if (choice === null) {
        setFeedback('invalid');
        return;
      }
      correct = choice === puzzle.answer;
    } else {
      if (sequence.length !== target.length) {
        setFeedback('invalid');
        return;
      }
      correct = sequence.every((id, position) => id === target[position]);
    }
    setAttempted(true);
    setFeedback(correct ? 'correct' : 'incorrect');
    onAnswer(puzzle.id, correct, assisted);
  }
  function move(position: number, offset: number) {
    const destination = position + offset;
    if (destination < 0 || destination >= sequence.length) return;
    setSequence((previous) => {
      const next = previous.slice();
      [next[position], next[destination]] = [next[destination], next[position]];
      return next;
    });
    setFeedback(null);
  }
  const titleId = `${puzzle.id}-title`;
  const responseId = `${puzzle.id}-response`;
  const hintId = `${puzzle.id}-hint`;
  const precision = Math.max(3, Math.ceil(-Math.log10(puzzle.tolerance ?? 0.001)));
  function errorExplanation() {
    if (puzzle.kind === 'numeric') {
      const proposed = parseNumber(value);
      if (/probabilidad/i.test(puzzle.prompt) && (proposed < 0 || proposed > 1))
        return 'Buscas una probabilidad: debe estar entre cero y uno. Comprueba si has escrito un peso sin normalizar.';
      if (/varianza|desviaci[oó]n est[aá]ndar/i.test(puzzle.prompt) && proposed < 0)
        return 'La dispersión se construye a partir de desviaciones cuadradas y no puede ser negativa. Distingue el signo de un error de su varianza.';
      return 'El valor aún no corresponde a este caso. Separa los aportes, comprueba las unidades y aplica cada operación en el orden del modelo.';
    }
    if (puzzle.kind === 'sequence')
      return 'Ese orden aún no conserva las dependencias. Identifica qué salida necesita cada etapa antes de decidir cuál puede venir después.';
    return 'La opción aún no satisface todas las condiciones del caso. Contrasta su afirmación con el modelo y con lo que se observó realmente.';
  }
  return (
    <article
      className={`puzzle-card ${independent ? 'mastered' : supported ? 'supported' : ''}`}
      aria-labelledby={titleId}
    >
      <header className="puzzle-header">
        <span className="puzzle-index">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">
            {independent
              ? 'Resolución sin ayuda registrada'
              : supported
                ? 'Resuelta con apoyo'
                : 'Misión de transferencia'}
          </p>
          <h3 id={titleId}>{puzzle.title}</h3>
        </div>
      </header>
      {assessment.seed !== 0 && (
        <p className="case-label">
          {puzzle.kind === 'numeric'
            ? 'CASO NUEVO · VALORES DIFERENTES'
            : 'MISMO PRINCIPIO · OPCIONES REORDENADAS'}
        </p>
      )}
      <p className="puzzle-brief">{rich(puzzle.brief)}</p>
      <div className="puzzle-setup">
        <h4>Situación</h4>
        <p>{rich(puzzle.setup)}</p>
      </div>
      <form onSubmit={check} className="puzzle-form">
        <label id={responseId} className="puzzle-prompt">
          {rich(puzzle.prompt)}
        </label>
        {puzzle.formula && <Formula tex={puzzle.formula} block />}
        {puzzle.kind === 'numeric' && (
          <div className="numeric-answer">
            <input
              aria-labelledby={responseId}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFeedback(null);
              }}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Escribe un decimal o una fracción"
              aria-describedby={`${puzzle.id}-format`}
            />
            <small id={`${puzzle.id}-format`}>
              Acepta 0,75, 0.75 o 3/4. Aproxima a {precision} decimales si tu respuesta no es
              exacta.
            </small>
          </div>
        )}
        {puzzle.kind === 'choice' && (
          <fieldset className="answer-options" aria-labelledby={responseId}>
            <legend className="sr-only">Elige una respuesta a la misión</legend>
            {puzzle.choices?.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`answer-option ${choice === optionIndex ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`${puzzle.id}-choice`}
                  checked={choice === optionIndex}
                  onChange={() => {
                    setChoice(optionIndex);
                    setFeedback(null);
                  }}
                />
                <span>{rich(option)}</span>
              </label>
            ))}
          </fieldset>
        )}
        {puzzle.kind === 'sequence' && (
          <div className="sequence-answer" aria-labelledby={responseId}>
            <p>
              Construye el orden de {target.length} etapas. Puedes añadir, mover o retirar cada una.
            </p>
            <div className="sequence-pool">
              {sequencePool.map((id, poolIndex) => (
                <button
                  key={`${id}-${poolIndex}`}
                  type="button"
                  onClick={() => {
                    setSequence((previous) => [...previous, id]);
                    setFeedback(null);
                  }}
                  disabled={sequence.length >= target.length}
                >
                  Añadir {stageLabel(id)}
                </button>
              ))}
            </div>
            <ol className="sequence-selected">
              {sequence.map((id, position) => (
                <li key={`${id}-${position}`}>
                  <span>{stageLabel(id)}</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => move(position, -1)}
                      disabled={position === 0}
                      aria-label={`Mover ${stageLabel(id)} una posición antes`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(position, 1)}
                      disabled={position === sequence.length - 1}
                      aria-label={`Mover ${stageLabel(id)} una posición después`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSequence((previous) => previous.filter((_, item) => item !== position));
                        setFeedback(null);
                      }}
                      aria-label={`Retirar ${stageLabel(id)} de la posición ${position + 1}`}
                    >
                      Retirar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="puzzle-actions">
          <button type="submit">Comprobar propuesta</button>
          <button
            type="button"
            onClick={() => {
              setHintVisible(!hintVisible);
              setAssisted(true);
            }}
            aria-expanded={hintVisible}
            aria-controls={hintId}
          >
            {hintVisible ? 'Ocultar pista' : 'Usar una pista'}
          </button>
        </div>
        {(assisted || attempted || independent) && (
          <button type="button" className="new-case" onClick={newCase}>
            {puzzle.kind === 'numeric'
              ? 'Nuevo caso sin ayuda'
              : 'Reintentar sin ayuda · otro orden'}
          </button>
        )}
        {assisted && (
          <p className="assistance-note">
            Intento con apoyo. Practica aquí; resuelve un caso nuevo sin consultar ayudas.
          </p>
        )}
      </form>
      {hintVisible && (
        <aside id={hintId} className="hint-text">
          <strong>Pista</strong>
          <p>{rich(puzzle.hint)}</p>
        </aside>
      )}
      <div className={`puzzle-feedback ${feedback ?? ''}`} role="status" aria-live="polite">
        {feedback === 'invalid' && (
          <p>
            {puzzle.kind === 'numeric'
              ? 'Introduce un número válido o una fracción con denominador distinto de cero.'
              : puzzle.kind === 'choice'
                ? 'Elige una de las respuestas antes de comprobar.'
                : `Añade exactamente ${target.length} etapas antes de comprobar.`}
          </p>
        )}
        {feedback === 'incorrect' && <p>{errorExplanation()} Puedes volver a intentarlo.</p>}
        {feedback === 'correct' && (
          <p>
            {assisted
              ? 'Resuelto con apoyo. La explicación conecta el resultado con su uso.'
              : 'Resuelto sin ayuda. Compara tu cálculo con la explicación y la transferencia.'}
          </p>
        )}
      </div>
      {attempted && (
        <details
          className="puzzle-solution"
          onToggle={(event) => {
            if (event.currentTarget.open && feedback !== 'correct') setAssisted(true);
          }}
        >
          <summary>Examinar la solución y su transferencia</summary>
          <h4>Por qué funciona</h4>
          <p>{rich(puzzle.solution)}</p>
          <h4>Qué podrás hacer con esto</h4>
          <p>{rich(puzzle.transfer)}</p>
        </details>
      )}
    </article>
  );
}

export function PuzzlePanel(props: PuzzlePanelProps) {
  const count = props.chapter.missions.filter((mission) => {
    const evidence = props.state.evidence.filter(
      (item) => item.world === props.world && item.id === mission.id && item.correct,
    );
    return (
      evidence.some((item) => item.independent) ||
      (evidence.length === 0 && props.state.worlds[props.world]?.puzzles.includes(mission.id))
    );
  }).length;
  return (
    <section className="puzzle-panel" aria-labelledby="puzzle-panel-title">
      <header className="puzzle-panel-header">
        <p className="eyebrow">Aplicar y justificar</p>
        <h2 id="puzzle-panel-title">Misiones del mundo</h2>
        <p>
          Resuelve el caso y comprueba la idea que permite transferirlo. Usar pistas cuenta como
          práctica asistida.
        </p>
        <p className="mastery-count" role="status">
          {count} de {props.chapter.missions.length} misiones resueltas sin ayuda
        </p>
      </header>
      <div className="puzzle-grid">
        {props.chapter.missions.map((puzzle, index) => (
          <PuzzleCard
            key={`${props.world}-${puzzle.id}`}
            {...props}
            puzzle={puzzle}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
export default PuzzlePanel;
