import { createContext, useContext, useEffect, type RefObject } from 'react';

/**
 * Interaction cue: while a step waits for the player to act (a lesson gate, a new practice
 * round), draggable handles pulse and a ghost hand demonstrates the gesture. The first touch
 * on any handle retires the cue for that step.
 */
export interface Cue {
  active: boolean;
  touch: () => void;
}
export const CueCtx = createContext<Cue>({ active: false, touch: () => {} });
export const useCue = () => useContext(CueCtx);

/**
 * A step may wait on several handles at once. All of them keep their halo, but only the first
 * ghost hand plays, so the eye has one gesture to follow.
 */
export function useSingleGhost(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () =>
      el.querySelectorAll<SVGGElement>('.ghost-hand').forEach((g, i) => {
        g.style.display = i ? 'none' : '';
      });
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(el, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [ref]);
}
