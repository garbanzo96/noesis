import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Side column for the blackboard (lesson) or the notebook (investigation, practice).
 * Docked on wide screens; on narrow or short screens it becomes a drawer opened from a
 * button that shows how many entries it holds and bumps when a new one arrives.
 */
export function Rail({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count]);
  return (
    <>
      <button className="rail-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-rail-toggle>
        <span>{label}</span>
        <b key={bump} className={bump ? 'bump' : ''}>
          {count}
        </b>
      </button>
      <div className={`rail ${open ? 'open' : ''}`} data-rail>
        <button className="rail-close" onClick={() => setOpen(false)} aria-label="Cerrar">
          ✕
        </button>
        {children}
      </div>
      {open && <div className="rail-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}

/**
 * Fly copies of `srcs` to where the rail keeps its newest entry (or to the drawer button when
 * the rail is hidden), so the player sees the formula being filed away.
 */
export function flyToRail(srcs: HTMLElement[], reduced: boolean) {
  if (reduced || srcs.length === 0) return;
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const docked = rail && getComputedStyle(rail).position !== 'fixed';
  const target = docked ? (rail.querySelector('ol') ?? rail) : document.querySelector<HTMLElement>('[data-rail-toggle]');
  if (!target) return;
  const t = target.getBoundingClientRect();
  const tx = t.left + Math.min(t.width, 300) / 2;
  const ty = docked ? Math.min(t.bottom, window.innerHeight - 40) : t.top + t.height / 2;
  for (const src of srcs) {
    const r = src.getBoundingClientRect();
    if (r.width === 0) continue;
    const clone = src.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: '0', zIndex: '60', pointerEvents: 'none' });
    clone.classList.add('flyer');
    document.body.appendChild(clone);
    const s = Math.max(0.25, Math.min(1, 280 / r.width));
    const a = clone.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${tx - (r.left + r.width / 2)}px, ${ty - (r.top + r.height / 2)}px) scale(${s})`, opacity: 0.15 },
      ],
      { duration: 620, easing: 'cubic-bezier(.6,0,.25,1)' },
    );
    a.onfinish = () => clone.remove();
  }
}
