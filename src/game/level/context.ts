import { createContext, useContext } from 'react';
import type { CastId } from '../../art/cast';
import type { PlaceId } from '../../art/places';
import type { LevelDef, Note } from './types';
import type { Settings } from '../state';

export interface RunCtx {
  level: LevelDef;
  stepIndex: number;
  reduced: boolean;
  textSpeed: Settings['textSpeed'];
  paused: boolean;
  /** character who guides the investigation of this case */
  guide: CastId;
  /** location of the district (faint backdrop behind stages) */
  place: PlaceId;
  /** notebook entries collected so far in this run */
  notes: Note[];
  addNote: (n: Note) => void;
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
