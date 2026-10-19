import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Step-by-step build of the stage text. When `key` changes (a new beat or round), the labels and
 * formulas of the HTML overlay that were not on the stage before are held back and appear one by
 * one, in reading order, as `progress` (how much of the narration has been said) advances; with no
 * progress they follow a steady beat. Labels that show up later, as the answer to something the
 * player did, enter on their own. Interactive overlays (inputs, buttons) are never held back.
 */
export function useStageBuild(
  root: RefObject<HTMLElement | null>,
  key: unknown,
  progress: number | undefined,
  reduced: boolean,
) {
  const seen = useRef(new WeakSet<Element>());
  const queue = useRef<HTMLElement[]>([]);
  const shown = useRef(0);
  const target = useRef(0);
  const started = useRef(0);

  const held = (el: HTMLElement) => el.style.pointerEvents !== 'auto';

  useLayoutEffect(() => {
    const overlay = root.current?.querySelector('.stage-overlay');
    queue.current = [];
    shown.current = 0;
    started.current = performance.now();
    if (!overlay) return;
    const fresh = Array.from(overlay.querySelectorAll<HTMLElement>(':scope > .stage-html')).filter(
      (el) => !seen.current.has(el),
    );
    for (const el of fresh) seen.current.add(el);
    if (reduced) return;
    queue.current = fresh.filter(held);
    for (const el of queue.current) el.dataset.build = 'hold';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // labels added after the beat started enter with their own short animation
  useEffect(() => {
    const overlay = root.current?.querySelector('.stage-overlay');
    if (!overlay || reduced) return;
    const mo = new MutationObserver((records) => {
      for (const r of records)
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement) || !n.classList.contains('stage-html')) return;
          if (seen.current.has(n)) return;
          seen.current.add(n);
          n.dataset.build = 'in';
        });
    });
    mo.observe(overlay, { childList: true });
    return () => mo.disconnect();
    // the overlay is replaced when a scene swaps its whole <Stage>
  }, [root, reduced, key]);

  target.current = progress ?? -1;

  // reveal one label at a time, never faster than a readable interval
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      const q = queue.current;
      if (shown.current >= q.length) return;
      const p = target.current;
      // narration paced: everything is out a little before the sentence ends; otherwise 0.35 s each
      const due =
        p >= 0
          ? Math.ceil(Math.min(1, p / 0.85) * q.length)
          : Math.floor((performance.now() - started.current) / 350) + 1;
      if (shown.current < due) {
        q[shown.current].dataset.build = 'in';
        shown.current++;
      }
    }, 260);
    return () => clearInterval(id);
  }, [reduced]);
}
