import { useEffect, useReducer } from 'react';
import type { GameState, WorldId } from '../domain/types';
import { awardField, awardPuzzle, createInitialState, markStage } from './progress';
import { loadState, parseState, saveState, validateSettings } from './persistence';

export type GameAction =
  | { type: 'stage'; world: WorldId; index: number }
  | { type: 'puzzle'; world: WorldId; id: string; correct: boolean; assisted?: boolean }
  | { type: 'field'; world: WorldId }
  | { type: 'settings'; settings: Partial<GameState['settings']> }
  | { type: 'reset' }
  | { type: 'import'; data: string };
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'stage':
      return markStage(state, action.world, action.index);
    case 'puzzle':
      return awardPuzzle(state, action.world, action.id, action.correct, action.assisted ?? false);
    case 'field':
      return awardField(state, action.world);
    case 'settings': {
      const settings = { ...state.settings, ...action.settings };
      return validateSettings(settings) ? { ...state, settings } : state;
    }
    case 'reset':
      return createInitialState();
    case 'import':
      return parseState(action.data) ?? state;
    default:
      return state;
  }
}
export const reducer = gameReducer;
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => loadState());
  useEffect(() => {
    saveState(state);
  }, [state]);
  return { state, dispatch };
}
