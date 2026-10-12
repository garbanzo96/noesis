import { createContext, useContext } from 'react';

/**
 * Interaction cue: while a step waits for the player to act (a lesson gate, a new practice
 * round), draggable handles pulse and a ghost hand demonstrates the gesture. The first touch
 * on any handle retires the cue for that step.
 */
export interface Cue {
  active: boolean;
  touch: () => void;
}
export const CueCtx = createContext<Cue>({ active: false, touch: () => {} });
export const useCue = () => useContext(CueCtx);
