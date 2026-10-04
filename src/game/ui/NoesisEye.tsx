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
 * All motion is CSS (no per-frame React renders).
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
  const col = MOOD_COLOR[mood];
  const r = 40;
  const arcs = 14;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      className={`noesis-eye mood-${mood} ${reduced ? 'still' : ''}`}
      style={{ ['--eye' as string]: col }}
      aria-hidden
    >
      <circle r={46} fill="none" stroke={col} strokeOpacity={0.15} strokeWidth={1} />
      <g className="eye-outer">
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
      <g className="eye-inner">
        <circle r={27} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="3 7" opacity={0.7} />
      </g>
      <circle className="eye-halo" r={18} fill={col} opacity={0.12} />
      <circle className="eye-pupil" r={10} fill={col} opacity={0.9} />
      <circle r={3.5} fill={C.bg} />
    </svg>
  );
}
