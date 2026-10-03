import { chapters, getLesson } from '../content';
import type { GameState, MasteryEvidence, WorldId } from '../domain/types';
import {
  awardField,
  awardPuzzle,
  campaignPrerequisites,
  createInitialState,
  fieldId,
  isWorldId,
  markStage,
  puzzleIds,
  REWARDS,
  WORLD_IDS,
} from './progress';

export const STORAGE_KEY = 'noesis:progress:v2';
// Verified against the previous app: noesis-progress-v1 is the production key; QA data stays separate.
export const LEGACY_STORAGE_KEYS = [
  'noesis-progress-v1',
  'noesis-v1',
  'noesis:progress:v1',
  'enigma-progress',
  'enigma-progress-v1',
  'noesis-progress',
];
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const natural = (value: unknown): value is number =>
  finite(value) && Number.isSafeInteger(value) && value >= 0;
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((x) => typeof x === 'string');
export function validateSettings(value: unknown): value is GameState['settings'] {
  return (
    object(value) &&
    typeof value.sound === 'boolean' &&
    typeof value.reducedMotion === 'boolean' &&
    (value.density === 'compact' || value.density === 'comfortable')
  );
}
function validEvidence(value: unknown): value is MasteryEvidence {
  if (
    !object(value) ||
    !isWorldId(value.world) ||
    typeof value.id !== 'string' ||
    typeof value.correct !== 'boolean' ||
    typeof value.independent !== 'boolean' ||
    !natural(value.at) ||
    value.at > 8_640_000_000_000_000
  )
    return false;
  if (value.kind === 'puzzle') return puzzleIds(value.world).includes(value.id);
  if (value.kind === 'field') return value.id === fieldId(value.world);
  if (value.kind === 'lesson') return getLesson(value.id)?.world === value.world;
  return false;
}
/** Structural validation. Derived awards and gates are additionally recomputed when parsing. */
export function validateState(value: unknown): value is GameState {
  if (
    !object(value) ||
    value.version !== 2 ||
    !natural(value.xp) ||
    !finite(value.charge) ||
    value.charge < 0 ||
    value.charge > 100 ||
    !natural(value.rank) ||
    value.rank < 1 ||
    !object(value.worlds) ||
    !Array.isArray(value.evidence) ||
    value.evidence.length > 2000 ||
    !value.evidence.every(validEvidence) ||
    !strings(value.rewarded) ||
    !strings(value.lessonMastery) ||
    !value.lessonMastery.every((id) => !!getLesson(id)) ||
    !Array.isArray(value.mistakes) ||
    !validateSettings(value.settings) ||
    !isWorldId(value.lastWorld) ||
    !(
      value.lastLesson === null ||
      (typeof value.lastLesson === 'string' && !!getLesson(value.lastLesson))
    ) ||
    !natural(value.legacyXp) ||
    !Array.isArray(value.history) ||
    value.history.length > 2000
  )
    return false;
  for (const [world, progress] of Object.entries(value.worlds)) {
    if (
      !isWorldId(world) ||
      !object(progress) ||
      !Array.isArray(progress.stages) ||
      !progress.stages.every(
        (index) => natural(index) && index < (chapters[world]?.teachingStages.length ?? 0),
      ) ||
      !strings(progress.puzzles) ||
      !progress.puzzles.every((id) => puzzleIds(world).includes(id)) ||
      typeof progress.field !== 'boolean' ||
      typeof progress.completed !== 'boolean' ||
      !natural(progress.attempts) ||
      !natural(progress.stars) ||
      progress.stars > 3
    )
      return false;
  }
  if (
    !value.mistakes.every(
      (m) =>
        object(m) &&
        typeof m.lessonId === 'string' &&
        !!getLesson(m.lessonId) &&
        natural(m.questionIndex) &&
        m.questionIndex < (getLesson(m.lessonId)?.questions.length ?? 0) &&
        natural(m.due) &&
        finite(m.interval) &&
        m.interval > 0,
    )
  )
    return false;
  if (
    !value.history.every(
      (h) =>
        object(h) &&
        typeof h.date === 'string' &&
        Number.isFinite(Date.parse(h.date)) &&
        isWorldId(h.world) &&
        natural(h.xp),
    )
  )
    return false;
  return true;
}
function normalizeState(source: GameState): GameState {
  let next = createInitialState();
  // Process dependencies before descendants regardless of their storage order.
  const ordered: WorldId[] = [];
  const visited = new Set<WorldId>();
  const visit = (world: WorldId) => {
    if (visited.has(world)) return;
    visited.add(world);
    campaignPrerequisites[world].forEach(visit);
    ordered.push(world);
  };
  WORLD_IDS.forEach(visit);
  for (const world of ordered) {
    for (const index of source.worlds[world]?.stages ?? []) next = markStage(next, world, index);
    for (const id of puzzleIds(world)) {
      const records = source.evidence.filter(
        (e) => e.world === world && e.kind === 'puzzle' && e.id === id,
      );
      const record = records.find((e) => e.correct && e.independent) ?? records.at(-1);
      if (record) next = awardPuzzle(next, world, id, record.correct, !record.independent);
    }
    if (
      source.evidence.some(
        (e) =>
          e.world === world &&
          e.kind === 'field' &&
          e.id === fieldId(world) &&
          e.correct &&
          e.independent,
      )
    ) {
      next = awardField(next, world);
    }
    if (next.worlds[world])
      next.worlds[world] = {
        ...next.worlds[world]!,
        attempts: Math.max(next.worlds[world]!.attempts, source.worlds[world]?.attempts ?? 0),
      };
  }
  // Preserve historical timestamps without trusting historical XP or duplicate awards.
  next.evidence = next.evidence.map((e) => {
    const original = source.evidence.find(
      (r) =>
        r.world === e.world &&
        r.kind === e.kind &&
        r.id === e.id &&
        r.correct === e.correct &&
        r.independent === e.independent,
    );
    return original ? { ...e, at: original.at } : e;
  });
  // Reconstruct chronology from accepted proof, rather than pairing different
  // reward orders by array index (field-before-puzzles used to acquire wrong dates).
  const completionTimes = new Map<WorldId, number>();
  const completionAt = (world: WorldId): number => {
    const cached = completionTimes.get(world);
    if (cached !== undefined) return cached;
    const own = next.evidence
      .filter((e) => e.world === world && e.correct && e.independent)
      .map((e) => e.at);
    const at = Math.max(0, ...own, ...campaignPrerequisites[world].map(completionAt));
    completionTimes.set(world, at);
    return at;
  };
  const history: { date: string; world: WorldId; xp: number }[] = [];
  for (const proof of next.evidence) {
    if (!proof.correct || !proof.independent || proof.kind === 'lesson') continue;
    history.push({
      date: new Date(proof.at).toISOString(),
      world: proof.world,
      xp: REWARDS[proof.kind],
    });
  }
  for (const world of ordered) {
    if (next.worlds[world]?.completed)
      history.push({
        date: new Date(completionAt(world)).toISOString(),
        world,
        xp: REWARDS.completion,
      });
  }
  next.history = history.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  next.settings = { ...source.settings };
  next.lastWorld = source.lastWorld;
  next.lastLesson = source.lastLesson;
  next.legacyXp = source.legacyXp;
  next.mistakes = source.mistakes.map((m) => ({ ...m }));
  const lessonProof = source.evidence.filter(
    (e) => e.kind === 'lesson' && e.independent && e.correct,
  );
  next.evidence.push(
    ...lessonProof
      .filter(
        (e, index) =>
          lessonProof.findIndex((other) => other.id === e.id && other.world === e.world) === index,
      )
      .map((e) => ({ ...e })),
  );
  next.lessonMastery = [
    ...new Set(source.lessonMastery.filter((id) => lessonProof.some((e) => e.id === id))),
  ];
  return next;
}
/** Old XP is retained as history only: it never unlocks a world or certifies a lesson. */
export function migrateLegacy(value: unknown): GameState | null {
  if (!object(value) || (value.version !== undefined && value.version !== 1)) return null;
  const recognized = [
    'xp',
    'completed',
    'completedLessons',
    'mastered',
    'lessonMastery',
    'settings',
  ];
  if (!recognized.some((key) => Object.hasOwn(value, key))) return null;
  if (value.xp !== undefined && !natural(value.xp)) return null;
  const next = createInitialState();
  next.legacyXp = typeof value.xp === 'number' ? value.xp : 0;
  if (validateSettings(value.settings)) next.settings = { ...value.settings };
  else if (object(value.settings)) {
    // v1 used dense rather than density and had no motion preference.
    if (typeof value.settings.sound === 'boolean') next.settings.sound = value.settings.sound;
    if (typeof value.settings.dense === 'boolean')
      next.settings.density = value.settings.dense ? 'compact' : 'comfortable';
  }
  if (isWorldId(value.lastWorld)) next.lastWorld = value.lastWorld;
  if (typeof value.lastLesson === 'string' && getLesson(value.lastLesson))
    next.lastLesson = value.lastLesson;
  return next;
}
export function parseState(text: string): GameState | null {
  if (typeof text !== 'string' || text.length > 2_000_000) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (validateState(value)) return normalizeState(value);
    return migrateLegacy(value);
  } catch {
    return null;
  }
}
export function serializeState(state: GameState): string {
  if (!validateState(state)) throw new TypeError('Estado de progreso inválido.');
  return JSON.stringify(normalizeState(state));
}
export const parse = parseState;
export const serialize = serializeState;
export function loadState(storage?: Pick<Storage, 'getItem'>): GameState {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
    if (!target) return createInitialState();
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = target.getItem(key);
      if (raw === null) continue;
      const state = parseState(raw);
      if (state) return state;
    }
  } catch {
    /* Storage may be unavailable in private browsing or on a file URL. */
  }
  return createInitialState();
}
export function saveState(state: GameState, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const target = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
    if (!target) return false;
    target.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}
