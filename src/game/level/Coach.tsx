import { useLayoutEffect, useState } from 'react';

/**
 * First-time guide: a short tour with a spotlight on each part of the screen. Shown once per
 * device for each `id` (stored in localStorage); every step can be skipped.
 */
export interface CoachStep {
  /** CSS selector of the element to light up (the first visible match is used) */
  target: string;
  title: string;
  text: string;
}

const seen = (id: string) => {
  try {
    return localStorage.getItem(`noesis.coach.${id}`) === '1';
  } catch {
    return true;
  }
};
const markSeen = (id: string) => {
  try {
    localStorage.setItem(`noesis.coach.${id}`, '1');
  } catch {
    /* private mode: the tour simply shows again next time */
  }
};

export function Coach({ id, steps }: { id: string; steps: CoachStep[] }) {
  const [i, setI] = useState(() => (seen(id) ? -1 : 0));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = i >= 0 ? steps[i] : null;
  useLayoutEffect(() => {
    if (!step) return;
    const find = () => {
      const el = [...document.querySelectorAll<HTMLElement>(step.target)].find((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
      setRect(el ? el.getBoundingClientRect() : null);
    };
    find();
    const t = setTimeout(find, 350);
    window.addEventListener('resize', find);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', find);
    };
  }, [step]);
  if (!step) return null;
  const close = () => {
    markSeen(id);
    setI(-1);
  };
  const next = () => (i + 1 < steps.length ? setI(i + 1) : close());
  const pad = 8;
  const r = rect ?? new DOMRect(window.innerWidth / 2 - 100, window.innerHeight / 2 - 50, 200, 100);
  const below = r.top + r.height / 2 < window.innerHeight / 2;
  const cardTop = below ? Math.min(window.innerHeight - 190, r.bottom + 16) : Math.max(12, r.top - 186);
  const cardLeft = Math.max(12, Math.min(window.innerWidth - 352, r.left + r.width / 2 - 170));
  return (
    <div className="coach" role="dialog" aria-label="Guía de la pantalla">
      <div className="coach-spot" style={{ left: r.left - pad, top: r.top - pad, width: r.width + 2 * pad, height: r.height + 2 * pad }} />
      <div className="coach-card" style={{ top: cardTop, left: cardLeft }}>
        <span className="coach-step">
          {i + 1} / {steps.length}
        </span>
        <b>{step.title}</b>
        <p>{step.text}</p>
        <div className="coach-actions">
          <button className="btn ghost small" onClick={close}>
            Saltar guía
          </button>
          <button className="btn primary small" onClick={next} autoFocus>
            {i + 1 < steps.length ? 'Siguiente ▸' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const LESSON_TOUR: CoachStep[] = [
  { target: '.stage-area', title: 'El escenario', text: 'Aquí se ve la idea: figuras que se mueven y, cuando aparece una perilla, puedes arrastrarla. Una mano te muestra el gesto la primera vez.' },
  { target: '.focus-strip', title: 'Lo formal, junto al dibujo', text: 'La fórmula de cada paso se escribe aquí, parte por parte, con los mismos colores del dibujo.' },
  { target: '.console', title: 'NÓESIS te guía', text: 'Lee aquí cada paso. Si hay algo que hacer verás un recuadro con ☝; el botón Seguir espera hasta que lo hagas.' },
  { target: '[data-rail], [data-rail-toggle]', title: 'La pizarra guarda todo', text: 'Al seguir, la fórmula vuela a la pizarra. Ahí queda el registro de la clase para repasar.' },
];
