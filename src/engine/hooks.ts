import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { smooth, type Rate } from './rate';
import { lerp } from './anim';

/** Calls cb(dt, elapsed) every animation frame while `active`. dt in seconds. */
export function useFrame(cb: (dt: number, elapsed: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ref.current(dt, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Monotonic clock in seconds, re-rendering every frame while active. */
export function useClock(active = true): number {
  const [t, setT] = useState(0);
  useFrame((_, elapsed) => setT(elapsed), active);
  return t;
}

/**
 * Smoothly tween towards `target` whenever it changes (numbers or equal-length arrays).
 * Returns the current animated value. Reduced motion → jumps immediately.
 */
export function useTween<T extends number | number[]>(
  target: T,
  duration = 0.6,
  rate: Rate = smooth,
  instant = false,
): T {
  const [value, setValue] = useState<T>(target);
  const from = useRef<T>(target);
  const to = useRef<T>(target);
  const t0 = useRef(0);
  const [active, setActive] = useState(false);
  const current = useRef<T>(target);
  const key = Array.isArray(target) ? target.join('|') : String(target);
  useEffect(() => {
    if (instant || duration <= 0) {
      current.current = target;
      setValue(target);
      return;
    }
    const sameShape =
      Array.isArray(target) &&
      Array.isArray(current.current) &&
      (current.current as number[]).length === target.length;
    from.current = Array.isArray(target) && !sameShape ? target : current.current;
    to.current = target;
    t0.current = performance.now();
    setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, instant]);
  useFrame(() => {
    const p = Math.min(1, (performance.now() - t0.current) / 1000 / duration);
    const e = rate(p);
    let v: T;
    if (Array.isArray(to.current)) {
      const a = from.current as number[];
      v = (to.current as number[]).map((x, i) => lerp(a[i] ?? x, x, e)) as T;
    } else v = lerp(from.current as number, to.current as number, e) as T;
    current.current = v;
    setValue(v);
    if (p >= 1) setActive(false);
  }, active);
  return value;
}

/**
 * Beat sequencer for demonstrations. `beat` is the current step; `p` its eased progress.
 * `at(b)` → 0 before beat b, eased progress during b, 1 after: scenes are pure functions of it.
 */
export interface Beats {
  beat: number;
  p: number;
  count: number;
  at: (b: number) => number;
  between: (b0: number, b1: number) => number;
  next: () => void;
  prev: () => void;
  goto: (b: number) => void;
  animating: boolean;
}
export function useBeats(
  count: number,
  duration: number | ((beat: number) => number) = 1.4,
  reduced = false,
): Beats {
  const [beat, setBeat] = useState(0);
  const [raw, setRaw] = useState(1);
  const start = useRef(0);
  const [animating, setAnimating] = useState(false);
  const dur = useRef(1.4);
  const goto = useCallback(
    (b: number) => {
      const nb = Math.max(0, Math.min(count - 1, b));
      setBeat(nb);
      dur.current = typeof duration === 'function' ? duration(nb) : duration;
      if (reduced) {
        setRaw(1);
        return;
      }
      setRaw(0);
      start.current = performance.now();
      setAnimating(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, reduced],
  );
  useFrame(() => {
    const r = Math.min(1, (performance.now() - start.current) / 1000 / dur.current);
    setRaw(r);
    if (r >= 1) setAnimating(false);
  }, animating);
  const p = smooth(raw);
  const at = (b: number) => (beat > b ? 1 : beat < b ? 0 : p);
  const between = (b0: number, b1: number) => {
    // progress spread across beats b0..b1 inclusive
    if (beat < b0) return 0;
    if (beat > b1) return 1;
    return (beat - b0 + p) / (b1 - b0 + 1);
  };
  return {
    beat,
    p,
    count,
    at,
    between,
    animating,
    next: () => (beat < count - 1 ? goto(beat + 1) : undefined),
    prev: () => {
      if (beat > 0) {
        setBeat(beat - 1);
        setRaw(1);
        setAnimating(false);
      }
    },
    goto,
  };
}

/** Converts pointer events on an SVG into viewBox coordinates and reports drags. */
export function useSvgDrag(
  svg: RefObject<SVGSVGElement | null>,
  onDrag: (x: number, y: number, phase: 'start' | 'move' | 'end') => void,
) {
  const cb = useRef(onDrag);
  cb.current = onDrag;
  const toLocal = (e: { clientX: number; clientY: number }): [number, number] => {
    const el = svg.current;
    if (!el) return [0, 0];
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = el.getScreenCTM();
    if (!m) return [0, 0];
    const p = pt.matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  return (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const [x, y] = toLocal(e);
    cb.current(x, y, 'start');
    const move = (ev: PointerEvent) => {
      const [mx, my] = toLocal(ev);
      cb.current(mx, my, 'move');
    };
    const up = (ev: PointerEvent) => {
      const [ux, uy] = toLocal(ev);
      cb.current(ux, uy, 'end');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
}

/** Global keyboard shortcut; ignores keys typed into inputs. */
export function useKey(keys: string | string[], handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  const list = Array.isArray(keys) ? keys : [keys];
  const sig = list.join(',');
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (list.includes(e.key) || list.includes(e.code)) {
        ref.current(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, enabled]);
}
