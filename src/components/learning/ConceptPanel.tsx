import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from '../ui/icons';
import type { Chapter, WorldId } from '../../domain/types';
import { Math as Formula } from '../ui/Math';
import { worldLessons } from '../../content';
export function ConceptPanel({
  chapter,
  world,
  onStage,
  onLibrary,
}: {
  chapter: Chapter;
  world: WorldId;
  onStage: (i: number) => void;
  onLibrary: () => void;
}) {
  const [index, setIndex] = useState(0);
  const stage = chapter.teachingStages[index];
  const choose = (i: number) => {
    setIndex(i);
    onStage(i);
  };
  return (
    <aside className="teaching-panel">
      <div className="concept-header">
        <span className="eyebrow">FUNDAMENTOS / {index + 1} DE 5</span>
        <div className="stage-dots">
          {chapter.teachingStages.map((s, i) => (
            <button
              key={s.id}
              className={index === i ? 'active' : ''}
              aria-label={`Concepto ${i + 1}: ${s.title}`}
              aria-current={index === i ? 'step' : undefined}
              onClick={() => choose(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <h2>{stage.title}</h2>
      <p className="claim">{stage.claim}</p>
      <Formula tex={stage.formula} block />
      <p className="explanation">{stage.explanation}</p>
      <div className="concept-action">
        <span>PONLO A PRUEBA</span>
        <p>{stage.actionLabel}</p>
      </div>
      <div className="concept-navigation">
        <button
          onClick={() => choose(index - 1)}
          disabled={index === 0}
          aria-label="Concepto anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span>{String(index + 1).padStart(2, '0')} / 05</span>
        <button
          onClick={() => choose(index + 1)}
          disabled={index === 4}
          aria-label="Concepto siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <details className="notation-help">
        <summary>Cómo leer estas fórmulas</summary>
        <p>
          «=» afirma igualdad; «:=» define. ∈ significa «pertenece»; Σ suma valores indexados.
          P(A|B) condiciona en B. E es un promedio ponderado. Un subíndice identifica una componente
          o un instante; un superíndice puede ser potencia o etiqueta según la definición.
        </p>
        <p>
          En F y G: s es estado oculto, o observación, q creencia aproximada y π política. ln es
          logaritmo natural; la información se mide en nats.
        </p>
      </details>
      <button className="reference-link" onClick={onLibrary}>
        <BookOpen size={16} /> Profundizar · {worldLessons(world).length} cápsulas
      </button>
    </aside>
  );
}
