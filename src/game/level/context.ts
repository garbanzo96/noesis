import { createContext, useContext } from 'react';
import type { LevelDef } from './types';
import type { Settings } from '../state';

export interface RunCtx {
  level: LevelDef;
  stepIndex: number;
  reduced: boolean;
  textSpeed: Settings['textSpeed'];
  paused: boolean;
  modules: number;
  /** finish the current step and move to the next one */
  complete: () => void;
  /** register a mistake (affects the precision star) */
  error: () => void;
  /** register a revealed hint (affects the no-hint star) */
  hint: () => void;
}
export const RunContext = createContext<RunCtx | null>(null);
export function useRun(): RunCtx {
  const c = useContext(RunContext);
  if (!c) throw new Error('useRun outside LevelRunner');
  return c;
}

/** Deterministic 32-bit hash for seeds. */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  for (const p of parts.join('|')) {
    h ^= p.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
