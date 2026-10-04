import { chapters, worlds } from '../content';
import type { GameState, MasteryEvidence, WorldId, WorldProgress } from '../domain/types';

// Mirrors the reviewed campaign DAG; discipline order is not a prerequisite order.
export const campaignPrerequisites: Record<WorldId, WorldId[]> = {
  foundations: [],
  differential: ['foundations'],
  integral: ['foundations', 'probability'],
  linear: ['foundations', 'probability'],
  probability: ['foundations'],
  statistics: ['probability', 'foundations'],
  multivariate: ['differential', 'linear'],
  information: ['probability', 'foundations'],
  dynamics: ['differential', 'integral', 'probability'],
  bayesian: ['probability', 'foundations'],
  variational: ['bayesian', 'information', 'differential'],
  generative: ['probability', 'linear', 'bayesian'],
  decision: ['generative', 'information', 'variational'],
  active: ['decision', 'generative', 'bayesian', 'variational'],
};
export const REWARDS = { puzzle: 40, field: 80, completion: 140 } as const;
export const WORLD_IDS = worlds.map((world) => world.id);
export const isWorldId = (value: unknown): value is WorldId =>
  typeof value === 'string' && WORLD_IDS.includes(value as WorldId);
export const emptyWorldProgress = (): WorldProgress => ({
  stages: [],
  puzzles: [],
  field: false,
  completed: false,
  attempts: 0,
  stars: 0,
});
export function createInitialState(): GameState {
  return {
    version: 2,
    xp: 0,
    charge: 100,
    rank: 1,
    worlds: {},
    evidence: [],
    rewarded: [],
    lessonMastery: [],
    mistakes: [],
    settings: { sound: false, reducedMotion: false, density: 'comfortable' },
    lastWorld: 'foundations',
    lastLesson: null,
    legacyXp: 0,
    history: [],
  };
}
export const initialState = createInitialState();
export const getProgress = (state: GameState, world: WorldId): WorldProgress =>
  state.worlds[world] ?? emptyWorldProgress();
export const puzzleIds = (world: WorldId): string[] =>
  chapters[world]?.missions.map((p) => p.id) ?? [];
export const fieldId = (world: WorldId): string => `${world}-field`;
export function hasIndependentEvidence(
  state: GameState,
  world: WorldId,
  id: string,
  kind: 'puzzle' | 'field',
): boolean {
  return state.evidence.some(
    (e) => e.world === world && e.id === id && e.kind === kind && e.correct && e.independent,
  );
}
function requirementsMet(state: GameState, world: WorldId): boolean {
  const missions = puzzleIds(world);
  return (
    missions.length === 3 &&
    missions.every((id) => hasIndependentEvidence(state, world, id, 'puzzle')) &&
    hasIndependentEvidence(state, world, fieldId(world), 'field')
  );
}
function isComplete(state: GameState, world: WorldId, visiting = new Set<WorldId>()): boolean {
  if (visiting.has(world) || !state.worlds[world]?.completed || !requirementsMet(state, world))
    return false;
  const path = new Set(visiting).add(world);
  return campaignPrerequisites[world].every((prerequisite) =>
    isComplete(state, prerequisite, path),
  );
}
export function worldStatus(state: GameState, world: WorldId): 'locked' | 'available' | 'complete' {
  if (!isWorldId(world)) return 'locked';
  if (isComplete(state, world)) return 'complete';
  return campaignPrerequisites[world].every((prerequisite) => isComplete(state, prerequisite))
    ? 'available'
    : 'locked';
}
function updateWorld(state: GameState, world: WorldId, progress: WorldProgress): GameState {
  return { ...state, worlds: { ...state.worlds, [world]: progress }, lastWorld: world };
}
function recordEvidence(state: GameState, evidence: MasteryEvidence): GameState {
  const current = state.evidence.find(
    (e) => e.id === evidence.id && e.world === evidence.world && e.kind === evidence.kind,
  );
  // Once independently solved, later practice cannot erase the proof.
  if (current?.correct && current.independent) return state;
  return {
    ...state,
    evidence: [
      ...state.evidence.filter(
        (e) => !(e.id === evidence.id && e.world === evidence.world && e.kind === evidence.kind),
      ),
      evidence,
    ],
  };
}
function grant(state: GameState, key: string, xp: number, world: WorldId): GameState {
  if (state.rewarded.includes(key)) return state;
  const total = state.xp + xp;
  return {
    ...state,
    xp: total,
    rank: 1 + Math.floor(total / 400),
    rewarded: [...state.rewarded, key],
    history: [...state.history, { date: new Date().toISOString(), world, xp }],
  };
}
export function completeWorld(state: GameState, world: WorldId): GameState {
  if (!isWorldId(world) || worldStatus(state, world) === 'locked' || !requirementsMet(state, world))
    return state;
  const progress = getProgress(state, world);
  const next = progress.completed
    ? state
    : updateWorld(state, world, { ...progress, completed: true, stars: 3 });
  return grant(next, `world:${world}`, REWARDS.completion, world);
}
export function awardPuzzle(
  state: GameState,
  world: WorldId,
  id: string,
  correct: boolean,
  assisted = false,
): GameState {
  if (!isWorldId(world) || !puzzleIds(world).includes(id) || worldStatus(state, world) === 'locked')
    return state;
  const progress = getProgress(state, world);
  const independentPass = correct && !assisted;
  const puzzles =
    independentPass && !progress.puzzles.includes(id)
      ? [...progress.puzzles, id]
      : progress.puzzles;
  let next = updateWorld(state, world, {
    ...progress,
    puzzles,
    attempts: progress.attempts + 1,
    stars: Math.min(3, puzzles.length),
  });
  next = recordEvidence(next, {
    id,
    world,
    kind: 'puzzle',
    independent: !assisted,
    correct,
    at: Date.now(),
  });
  if (independentPass) next = grant(next, `puzzle:${world}:${id}`, REWARDS.puzzle, world);
  return completeWorld(next, world);
}
export function awardField(state: GameState, world: WorldId): GameState {
  if (!isWorldId(world) || worldStatus(state, world) === 'locked') return state;
  const progress = getProgress(state, world);
  let next = progress.field ? state : updateWorld(state, world, { ...progress, field: true });
  next = recordEvidence(next, {
    id: fieldId(world),
    world,
    kind: 'field',
    independent: true,
    correct: true,
    at: Date.now(),
  });
  next = grant(next, `field:${world}`, REWARDS.field, world);
  return completeWorld(next, world);
}
export function markStage(state: GameState, world: WorldId, index: number): GameState {
  if (
    !isWorldId(world) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= (chapters[world]?.teachingStages.length ?? 0)
  )
    return state;
  const progress = getProgress(state, world);
  return updateWorld(state, world, {
    ...progress,
    stages: [...new Set([...progress.stages, index])].sort((a, b) => a - b),
  });
}
