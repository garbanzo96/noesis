import { useEffect, useState } from 'react';
import { Math as Formula } from '../ui/Math';
export function Foundation() {
  const [x, setX] = useState(0.5);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      setT((t) => (t + (now - last) / 6500) % 1);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const y = 2 * x + 1,
    z = y * y;
  return (
    <div className="scene-shell">
      <div className="scene-eyebrow">
        01 / CIRCUITO DE COMPOSICIÓN <span>SIMULACIÓN EN TIEMPO REAL</span>
      </div>
      <svg
        className="math-scene"
        viewBox="0 0 960 440"
        role="img"
        aria-label={`La entrada ${x} pasa por f y g. Salida ${z}`}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#292044" strokeWidth="1" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <rect width="960" height="440" fill="url(#grid)" />
        <path d="M90 220H870" stroke="#493671" strokeWidth="2" />
        {[180, 420, 660].map((a, i) => (
          <g key={a}>
            <rect
              x={a - 70}
              y="151"
              width="140"
              height="138"
              fill="#0b0920"
              stroke={i === 2 ? '#ff3ba7' : '#28e7fa'}
              strokeWidth="2"
            />
            <text x={a} y="182" textAnchor="middle" fill="#8d81a8" fontSize="13">
              {['ENTRADA', 'FUNCIÓN f', 'FUNCIÓN g'][i]}
            </text>
            <text x={a} y="228" textAnchor="middle" fill="#f3f0ff" fontSize="28">
              {[x.toFixed(2), '2x + 1', 'y²'][i]}
            </text>
            <text x={a} y="266" textAnchor="middle" fill="#28e7fa" fontSize="16">
              {['x', `y = ${y.toFixed(2)}`, `z = ${z.toFixed(2)}`][i]}
            </text>
          </g>
        ))}
        <circle
          cx={90 + 780 * t}
          cy="220"
          r="11"
          fill="#28e7fa"
          opacity=".25"
          filter="url(#glow)"
        />
        <circle cx={90 + 780 * t} cy="220" r="5" fill="#28e7fa" />
        <text x="480" y="358" textAnchor="middle" fill="#a88aff" fontSize="20">
          ENTRADA → TRANSFORMACIÓN → TRANSFORMACIÓN
        </text>
        <text x="480" y="387" textAnchor="middle" fill="#8d81a8" fontSize="14">
          El orden de las operaciones cambia el resultado.
        </text>
      </svg>
      <div className="scene-controls">
        <button onClick={() => setPlaying(!playing)}>{playing ? 'Ⅱ Pausar' : '▶ Animar'}</button>
        <label>
          Entrada x{' '}
          <input
            type="range"
            min="-1"
            max="2"
            step=".05"
            value={x}
            onChange={(e) => setX(+e.target.value)}
          />
          <output>{x.toFixed(2)}</output>
        </label>
      </div>
      <div className="scene-equation">
        <Formula
          tex={`(g\\circ f)(${x.toFixed(2)})=(2\\cdot ${x.toFixed(2)}+1)^2=${z.toFixed(2)}`}
          block
        />
      </div>
    </div>
  );
}
