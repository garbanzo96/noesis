import { useEffect, useState } from 'react';
import { FocusStrip } from '../level/FocusStrip';
import type { BoardLine } from '../level/types';

const SAMPLES: BoardLine[] = [
  {
    label: 'Pendiente',
    tex: 'm=\\frac{\\p{1}{\\cM{\\Delta y}}}{\\p{2}{\\cA{\\Delta x}}}=\\p{3}{\\frac{y_2-y_1}{x_2-x_1}}',
    parts: ['cuánto sube', 'cuánto avanza', 'lo mismo, con dos puntos'],
  },
  {
    label: 'Ecuación de la recta',
    tex: 'y=\\p{1}{\\cA{m}}\\,x+\\p{2}{\\cG{b}}',
    parts: ['pendiente: cuánto se inclina', 'altura donde corta el eje y'],
  },
  {
    label: 'Valor esperado',
    tex: '\\p{1}{E[a]}=\\p{2}{\\sum_s}\\p{3}{P(s)}\\,\\p{4}{u(a,s)}',
    parts: ['lo que vale la acción', 'suma sobre los estados', 'qué tan probable', 'cuánto paga'],
  },
];

/** Dev-only lab (#/dev/tex): explained formulas written at a steady pace, for visual QA. */
export function TexLab() {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(0);
    const id = setTimeout(() => setProgress(1), 50);
    return () => clearTimeout(id);
  }, [i]);
  return (
    <div
      className="play lesson"
      style={{ background: '#070613', minHeight: '100vh', padding: 40, display: 'block' }}
    >
      <button className="btn" onClick={() => setI((i + 1) % SAMPLES.length)}>
        Siguiente fórmula ({i + 1}/{SAMPLES.length})
      </button>
      <div style={{ marginTop: 60 }}>
        <FocusStrip key={i} lines={[SAMPLES[i]]} progress={progress} />
      </div>
    </div>
  );
}
