import { useEffect, useRef } from 'react';

/**
 * Full-screen ambient layer: a slowly drifting field of data motes and a perspective grid.
 * Canvas2D, ~200 particles; frozen when reduced motion is on.
 */
export function Backdrop({ reduced, accent = '#28e7fa' }: { reduced: boolean; accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const N = 170;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      tw: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 1 / 60;
      ctx.clearRect(0, 0, w, h);
      // horizon grid
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = '#3a2a5c';
      ctx.lineWidth = 1;
      const hor = h * 0.62;
      for (let i = 0; i < 14; i++) {
        const k = (i + ((t * 0.15) % 1)) / 14;
        const y = hor + (h - hor) * k * k;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 18, hor);
        ctx.lineTo(w / 2 + i * w * 0.12, h);
        ctx.stroke();
      }
      ctx.restore();
      for (const p of ps) {
        if (!reduced) {
          p.y -= 0.00006 + p.z * 0.00022;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
        }
        const a = 0.15 + 0.5 * p.z * (0.6 + 0.4 * Math.sin(t * 1.3 + p.tw));
        ctx.fillStyle = p.z > 0.85 ? accent : '#a88aff';
        ctx.globalAlpha = a;
        const s = 0.6 + p.z * 1.6;
        ctx.fillRect(p.x * w, p.y * h, s, s);
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced, accent]);
  return <canvas ref={ref} className="backdrop" aria-hidden />;
}
