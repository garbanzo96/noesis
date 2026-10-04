import { useClock } from '../../engine/hooks';
import { C } from '../../engine/palette';

export type Mood = 'idle' | 'talk' | 'ok' | 'bad' | 'hint' | 'boss';
const MOOD_COLOR: Record<Mood, string> = {
  idle: C.cyan,
  talk: C.cyan,
  ok: C.green,
  bad: C.red,
  hint: C.amber,
  boss: C.magenta,
};

/**
 * NOESIS: the agent the player is restoring. An iris of rotating arcs whose color is its
 * mood and whose number of lit arcs is how many modules have been restored (0–14).
 */
export function NoesisEye({
  size = 64,
  mood = 'idle',
  modules = 0,
  reduced = false,
}: {
  size?: number;
  mood?: Mood;
  modules?: number;
  reduced?: boolean;
}) {
  const t = useClock(!reduced);
  const col = MOOD_COLOR[mood];
  const pulse = mood === 'talk' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9)) : 0.6 + 0.4 * Math.sin(t * 2);
  const r = 40;
  const arcs = 14;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" className="noesis-eye" aria-hidden>
      <circle r={46} fill="none" stroke={col} strokeOpacity={0.15} strokeWidth={1} />
      <g transform={`rotate(${(t * 12) % 360})`}>
        {Array.from({ length: arcs }, (_, i) => {
          const a0 = (i / arcs) * Math.PI * 2 + 0.06;
          const a1 = ((i + 1) / arcs) * Math.PI * 2 - 0.06;
          const lit = i < modules;
          return (
            <path
              key={i}
              d={`M${r * Math.cos(a0)} ${r * Math.sin(a0)}A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)}`}
              stroke={lit ? col : C.line}
              strokeWidth={lit ? 4 : 3}
              fill="none"
            />
          );
        })}
      </g>
      <g transform={`rotate(${(-t * 30) % 360})`}>
        <circle r={27} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="3 7" opacity={0.7} />
      </g>
      <circle r={16 + 3 * pulse} fill={col} opacity={0.12} />
      <circle r={9 + 2 * pulse} fill={col} opacity={0.9} filter="url(#eye-glow)" />
      <circle r={3.5} fill={C.bg} />
      <defs>
        <filter id="eye-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
