import { useLayoutEffect, useRef, type RefObject } from 'react';

const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';
// controls and cues are interface, not drawing
const SKIP =
  '.knob, .knob-halo, .knob-chevrons, .ghost-hand, defs, pattern, mask, clipPath, marker';

/**
 * Manim-style Create: when `key` changes (a new beat), the strokes that were not on the stage
 * before are drawn along their length and their fills fade in after them. Shapes that were
 * already there stay put, so only what the step adds is "written".
 */
export function useDrawOn(root: RefObject<HTMLElement | null>, key: unknown, reduced: boolean) {
  const seen = useRef(new WeakSet<Element>());
  useLayoutEffect(() => {
    const svg = root.current?.querySelector('svg.stage-svg');
    if (!svg) return;
    const fresh = Array.from(svg.querySelectorAll<SVGGeometryElement>(SHAPES)).filter(
      (el) => !seen.current.has(el) && !el.closest(SKIP),
    );
    for (const el of fresh) seen.current.add(el);
    // shortcut: a step that adds a whole grid (hundreds of shapes) appears at once, no per-shape draw
    if (reduced || fresh.length === 0 || fresh.length > 180) return;
    fresh.forEach((el, i) => {
      const st = getComputedStyle(el);
      const delay = Math.min(i * 22, 600);
      const stroked = st.stroke !== 'none' && parseFloat(st.strokeWidth) > 0;
      const filled = st.fill !== 'none' && parseFloat(st.fillOpacity) > 0;
      const dashed = st.strokeDasharray !== 'none';
      let len = 0;
      try {
        len = el.getTotalLength();
      } catch {
        len = 0;
      }
      if (stroked && !dashed && len > 4) {
        el.animate(
          [
            { strokeDasharray: `${len} ${len}`, strokeDashoffset: `${len}` },
            { strokeDasharray: `${len} ${len}`, strokeDashoffset: '0' },
          ],
          {
            duration: Math.min(1100, 350 + len * 0.6),
            delay,
            easing: EASE_IN_OUT,
            fill: 'backwards',
          },
        );
        if (filled)
          el.animate([{ fillOpacity: 0 }, { fillOpacity: st.fillOpacity }], {
            duration: 400,
            delay: delay + 350,
            easing: 'ease-out',
            fill: 'backwards',
          });
      } else {
        el.animate([{ opacity: 0 }, { opacity: st.opacity }], {
          duration: 380,
          delay,
          easing: 'ease-out',
          fill: 'backwards',
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
