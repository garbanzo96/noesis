import { useLayoutEffect, type RefObject } from 'react';

/**
 * Formulas in the narrow rail (board and notebook) shrink to the column width instead of being
 * clipped. The zoom goes on each `.board-tex` / `.note-tex` box (React never rewrites its style,
 * while the KaTeX markup inside can be replaced on any render), never below 55 %. Re-fits when the
 * rail width changes and once more after the KaTeX fonts settle.
 */
export function useFitTex(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fit = () =>
      root.querySelectorAll<HTMLElement>('.board-tex, .note-tex').forEach((box) => {
        const k = (box.querySelector('.katex-display > .katex, .katex') ??
          box.firstElementChild) as HTMLElement | null;
        if (!k) return;
        box.style.zoom = '';
        const have = box.clientWidth,
          need = k.scrollWidth;
        if (have > 0 && need > have) box.style.zoom = String(Math.max(0.55, (have / need) * 0.98));
      });
    fit();
    const late = window.setTimeout(fit, 400);
    let lastW = root.clientWidth;
    const watch = new ResizeObserver(() => {
      if (root.clientWidth === lastW) return;
      lastW = root.clientWidth;
      fit();
    });
    watch.observe(root);
    return () => {
      window.clearTimeout(late);
      watch.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
