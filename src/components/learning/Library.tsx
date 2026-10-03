import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { lessons, worlds, getWorld } from '../../content';
import { parseNumber } from '../../domain/math';
import type { GameState, Lesson, Question, WorldId } from '../../domain/types';
import { Math as Formula } from '../ui/Math';

interface LibraryProps {
  state: GameState;
  onNavigateWorld: (id: WorldId) => void;
}
const sourceNames: Record<string, string> = {
  guide: 'Guías de nivelación G00–G13',
  parr: 'Parr, Pezzulo y Friston · Active Inference',
  'bayes-notes': 'Apuntes de inferencia estadística bayesiana',
  bogacz: 'Bogacz · Tutorial de energía libre',
  'fep-math': 'Fundamentos matemáticos del FEP',
  mann: 'Mann et al. · Modelos e inferencia activa',
  friston: 'Friston et al. · Dinámica y estados estacionarios',
  namjoshi: 'Namjoshi · Fundamentals of Active Inference',
};
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
function normalized(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

function ReferenceQuestion({ question, index }: { question: Question; index: number }) {
  const [value, setValue] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | null>(null);
  const [hint, setHint] = useState(false);
  const id = `reference-question-${index}`;
  function check(event: FormEvent) {
    event.preventDefault();
    const answer = question.type === 'numeric' ? parseNumber(value) : choice;
    if (answer === null || !Number.isFinite(answer)) {
      setFeedback('invalid');
      return;
    }
    setFeedback(
      Math.abs(answer - question.answer) <=
        (question.type === 'numeric' ? (question.tolerance ?? 0.001) : 0)
        ? 'correct'
        : 'incorrect',
    );
  }
  return (
    <article className="reference-question">
      <h4>
        {index + 1}. {question.prompt}
      </h4>
      {question.formula && <Formula tex={question.formula} block />}
      <form onSubmit={check} aria-labelledby={id}>
        <span id={id} className="sr-only">
          Respuesta al ejercicio {index + 1}
        </span>
        {question.type === 'choice' ? (
          <fieldset className="answer-options">
            <legend className="sr-only">Elige una respuesta</legend>
            {question.options?.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={choice === optionIndex ? 'answer-option selected' : 'answer-option'}
              >
                <input
                  type="radio"
                  name={id}
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
        ) : (
          <label className="numeric-answer">
            Tu respuesta
            <input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFeedback(null);
              }}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,5 · 1/2"
            />
          </label>
        )}
        <div className="question-actions">
          <button type="submit">Comprobar</button>
          <button type="button" onClick={() => setHint(!hint)} aria-expanded={hint}>
            {hint ? 'Ocultar pista' : 'Ver pista'}
          </button>
        </div>
      </form>
      {hint && <p className="hint-text">{rich(question.hint)}</p>}
      <div aria-live="polite" className={`question-feedback ${feedback ?? ''}`}>
        {feedback === 'invalid' && (
          <p>Introduce una respuesta válida. Puedes escribir decimales o una fracción.</p>
        )}
        {feedback === 'incorrect' && (
          <p>Aún no coincide. Revisa el dominio y las operaciones; puedes volver a intentarlo.</p>
        )}
        {feedback === 'correct' && <p>Correcto. {rich(question.explanation)}</p>}
      </div>
      {feedback === 'incorrect' && (
        <details className="reference-solution">
          <summary>Consultar la explicación</summary>
          <p>{rich(question.explanation)}</p>
        </details>
      )}
    </article>
  );
}

function LessonDetail({
  lesson,
  state,
  onNavigateWorld,
}: {
  lesson: Lesson;
  state: GameState;
  onNavigateWorld: (id: WorldId) => void;
}) {
  const world = getWorld(lesson.world);
  const mastered = state.lessonMastery.includes(lesson.id);
  return (
    <article className="lesson-detail" aria-labelledby="lesson-detail-title">
      <header className="lesson-detail-header">
        <p className="eyebrow">
          {world.name} · {lesson.minutes} min ·{' '}
          {mastered ? 'Progreso histórico registrado' : 'Referencia y práctica'}
        </p>
        <h2 id="lesson-detail-title">{lesson.title}</h2>
        <p>{lesson.subtitle}</p>
        <button type="button" onClick={() => onNavigateWorld(lesson.world)}>
          Ir al laboratorio de {world.name}
        </button>
      </header>
      <section className="lesson-intuition">
        <h3>La intuición</h3>
        <p>{rich(lesson.intuition)}</p>
      </section>
      <section className="lesson-core">
        <h3>El núcleo</h3>
        <div className="core-grid">
          {lesson.core.map((concept, index) => (
            <article key={index}>
              <h4>{concept.label}</h4>
              <p>{rich(concept.body)}</p>
              {concept.formula && <Formula tex={concept.formula} block />}
            </article>
          ))}
        </div>
      </section>
      <section className="lesson-derivation">
        <h3>Construcción paso a paso</h3>
        <ol>
          {lesson.derivation.map((step, index) => (
            <li key={index}>
              <Formula tex={step.formula} block />
              <p>{rich(step.reason)}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="lesson-example">
        <h3>Un caso resuelto</h3>
        <p>{rich(lesson.example.problem)}</p>
        <div className="worked-solution">{rich(lesson.example.solution)}</div>
      </section>
      <aside className="lesson-pitfall">
        <h3>La distinción que importa</h3>
        <p>{rich(lesson.pitfall)}</p>
      </aside>
      <section className="lesson-bridge">
        <h3>Puente a inferencia activa</h3>
        <p>{rich(lesson.bridge)}</p>
      </section>
      <section className="lesson-practice">
        <h3>Comprobar tu comprensión</h3>
        <p className="section-note">
          Esta práctica de referencia permite repetir y consultar. Las misiones del laboratorio
          registran tus soluciones sin ayuda.
        </p>
        {lesson.questions.map((question, index) => (
          <ReferenceQuestion key={`${lesson.id}-${index}`} question={question} index={index} />
        ))}
      </section>
      <footer className="lesson-sources">
        <h3>Fuentes de estudio</h3>
        <ul>
          {lesson.references.map((reference) => (
            <li key={reference}>{sourceNames[reference] ?? reference}</li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

export function Library({ state, onNavigateWorld }: LibraryProps) {
  const [query, setQuery] = useState('');
  const [world, setWorld] = useState<WorldId | 'all'>(() => {
    const id = window.location.hash.split('/')[1];
    return worlds.some((w) => w.id === id) ? (id as WorldId) : 'all';
  });
  const [selected, setSelected] = useState<string | null>(state.lastLesson);
  const filtered = useMemo(() => {
    const terms = normalized(query).split(/\s+/).filter(Boolean);
    return lessons
      .filter((lesson) => {
        if (world !== 'all' && lesson.world !== world) return false;
        const text = normalized(
          [
            lesson.title,
            lesson.subtitle,
            lesson.intuition,
            lesson.bridge,
            getWorld(lesson.world).name,
            ...lesson.core.map((core) => `${core.label} ${core.body}`),
          ].join(' '),
        );
        return terms.every((term) => text.includes(term));
      })
      .sort(
        (a, b) =>
          getWorld(a.world).number - getWorld(b.world).number ||
          Number(a.id.split('-').at(-1)) - Number(b.id.split('-').at(-1)),
      );
  }, [query, world]);
  const activeLesson = filtered.find((lesson) => lesson.id === selected) ?? filtered[0];
  return (
    <section className="library-view" aria-labelledby="library-title">
      <header className="library-header">
        <p className="eyebrow">Archivo matemático</p>
        <h1 id="library-title">La estructura completa</h1>
        <p>
          {lessons.length} cápsulas: intuición, derivación, ejemplos y práctica. Entra por una
          pregunta o sigue el mundo que necesitas.
        </p>
      </header>
      <div className="library-controls">
        <label>
          Buscar un concepto
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bayes, Jacobiano, precisión…"
          />
        </label>
        <label>
          Filtrar por mundo
          <select
            value={world}
            onChange={(event) => setWorld(event.target.value as WorldId | 'all')}
          >
            <option value="all">Todos los mundos</option>
            {worlds.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number.toString().padStart(2, '0')} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <p role="status">
          {filtered.length} de {lessons.length} cápsulas
        </p>
      </div>
      {activeLesson ? (
        <div className="library-layout">
          <nav className="lesson-list" aria-label="Cápsulas matemáticas">
            {filtered.map((lesson) => {
              const mastered = state.lessonMastery.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-card ${activeLesson.id === lesson.id ? 'active' : ''}`}
                  aria-pressed={activeLesson.id === lesson.id}
                  onClick={() => setSelected(lesson.id)}
                >
                  <span className="lesson-world-label">{getWorld(lesson.world).name}</span>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.subtitle}</span>
                  <small>
                    {lesson.minutes} min{mastered ? ' · Progreso histórico registrado' : ''}
                  </small>
                </button>
              );
            })}
          </nav>
          <LessonDetail
            key={activeLesson.id}
            lesson={activeLesson}
            state={state}
            onNavigateWorld={onNavigateWorld}
          />
        </div>
      ) : (
        <div className="empty-state">
          <h2>No aparece ese concepto</h2>
          <p>Prueba una palabra más amplia o consulta todos los mundos.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setWorld('all');
            }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </section>
  );
}
export default Library;
