import { useEffect, useState } from 'react';
export function useTimeline(duration = 8, reducedMotion = false) {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(!reducedMotion);
  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      setTime((t) => (t + Math.min(100, now - last) / 1000 / duration) % 1);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);
  return { time, playing, setPlaying, setTime };
}
