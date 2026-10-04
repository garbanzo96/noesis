import { describe, expect, it, vi } from 'vitest';
import type { GameState, WorldId } from '../src/domain/types';
import { chapters } from '../src/content';
import {
  awardField,
  awardPuzzle,
  campaignPrerequisites,
  completeWorld,
  createInitialState,
  initialState,
  markStage,
  puzzleIds,
  worldStatus,
  WORLD_IDS,
} from '../src/engine/progress';
import {
  loadState,
  parseState,
  saveState,
  serializeState,
  STORAGE_KEY,
  validateState,
} from '../src/engine/persistence';
import { gameReducer } from '../src/engine/useGame';
function passWorld(state: GameState, world: WorldId): GameState {
  for (const id of puzzleIds(world)) state = awardPuzzle(state, world, id, true);
  return awardField(state, world);
}
function passPrerequisites(state: GameState, world: WorldId): GameState {
  for (const prior of campaignPrerequisites[world])
    state = passWorld(passPrerequisites(state, prior), prior);
  return state;
}
describe('evidence and gates', () => {
  it('starts with 14 known worlds and only foundations available', () => {
    expect(WORLD_IDS).toHaveLength(14);
    for (const id of WORLD_IDS)
      expect(worldStatus(initialState, id)).toBe(id === 'foundations' ? 'available' : 'locked');
  });
  it('counts unique stage previews without rewarding clicks or granting skills', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) state = markStage(state, 'foundations', i);
    state = markStage(state, 'foundations', 0);
    state = markStage(state, 'active', 0);
    expect(state.worlds.foundations?.stages).toEqual([0, 1, 2, 3, 4]);
    expect(state.xp).toBe(0);
    expect(worldStatus(completeWorld(state, 'foundations'), 'foundations')).toBe('available');
    expect(markStage(state, 'foundations', -1)).toBe(state);
    expect(markStage(state, 'foundations', 100)).toBe(state);
    expect(markStage(state, 'foundations', NaN)).toBe(state);
  });
  it('requires three independent puzzles and a transfer field', () => {
    let state = createInitialState();
    for (const id of puzzleIds('foundations')) state = awardPuzzle(state, 'foundations', id, true);
    expect(state.xp).toBe(120);
    expect(worldStatus(state, 'foundations')).toBe('available');
    state = awardField(state, 'foundations');
    expect(worldStatus(state, 'foundations')).toBe('complete');
    expect(state.xp).toBe(340);
    expect(worldStatus(state, 'probability')).toBe('available');
  });
  it('keeps assisted work visible without accreditation, and upgrades later independent proof', () => {
    let state = createInitialState();
    for (const id of puzzleIds('foundations'))
      state = awardPuzzle(state, 'foundations', id, true, true);
    state = awardField(state, 'foundations');
    expect(state.worlds.foundations?.puzzles).toEqual([]);
    expect(state.xp).toBe(80);
    expect(state.evidence.filter((e) => e.kind === 'puzzle').every((e) => !e.independent)).toBe(
      true,
    );
    expect(worldStatus(state, 'probability')).toBe('locked');
    for (const id of puzzleIds('foundations')) state = awardPuzzle(state, 'foundations', id, true);
    expect(state.xp).toBe(340);
    expect(state.evidence).toHaveLength(4);
  });
  it('records errors without XP penalty and never erases independently earned proof', () => {
    const id = puzzleIds('foundations')[0];
    let state = awardPuzzle(createInitialState(), 'foundations', id, false);
    expect(state.xp).toBe(0);
    expect(state.worlds.foundations?.attempts).toBe(1);
    state = awardPuzzle(state, 'foundations', id, true);
    state = awardPuzzle(state, 'foundations', id, false, true);
    expect(state.xp).toBe(40);
    expect(state.evidence).toHaveLength(1);
    expect(state.evidence[0].independent && state.evidence[0].correct).toBe(true);
  });
  it('prevents replay farming and leaves the previous state immutable', () => {
    const before = createInitialState();
    let state = passWorld(before, 'foundations');
    for (let i = 0; i < 20; i++)
      state = completeWorld(passWorld(state, 'foundations'), 'foundations');
    expect(state.xp).toBe(340);
    expect(state.rewarded).toHaveLength(5);
    expect(state.history).toHaveLength(5);
    expect(state.evidence).toHaveLength(4);
    expect(before.worlds).toEqual({});
    expect(before.evidence).toEqual([]);
    expect(before.rewarded).toEqual([]);
  });
  it('rejects locked and invented missions and a mission borrowed from another world', () => {
    const state = createInitialState();
    expect(awardPuzzle(state, 'active', puzzleIds('active')[0], true)).toBe(state);
    expect(awardField(state, 'active')).toBe(state);
    expect(awardPuzzle(state, 'foundations', 'invented', true)).toBe(state);
    expect(awardPuzzle(state, 'foundations', puzzleIds('probability')[0], true)).toBe(state);
  });
  it('uses the reviewed DAG: Bayes bypasses statistics but decision requires variational', () => {
    let state = passWorld(passWorld(createInitialState(), 'foundations'), 'probability');
    expect(worldStatus(state, 'bayesian')).toBe('available');
    expect(state.worlds.statistics?.completed).toBeUndefined();
    state = passWorld(passPrerequisites(state, 'generative'), 'generative');
    state = passWorld(state, 'information');
    expect(worldStatus(state, 'decision')).toBe('locked');
    state = passWorld(passPrerequisites(state, 'variational'), 'variational');
    expect(worldStatus(state, 'decision')).toBe('available');
  });
  it('does not trust completion flags without independent evidence', () => {
    const state = createInitialState();
    state.worlds.foundations = {
      stages: [0, 1, 2, 3, 4],
      puzzles: puzzleIds('foundations'),
      field: true,
      completed: true,
      attempts: 3,
      stars: 3,
    };
    expect(worldStatus(state, 'foundations')).toBe('available');
    expect(worldStatus(state, 'probability')).toBe('locked');
  });
  it('finishes all 14 worlds with exact finite rewards', () => {
    let state = createInitialState();
    for (const world of WORLD_IDS) state = passWorld(passPrerequisites(state, world), world);
    expect(WORLD_IDS.every((world) => worldStatus(state, world) === 'complete')).toBe(true);
    expect(state.xp).toBe(14 * (3 * 40 + 80 + 140));
    expect(state.evidence).toHaveLength(56);
    expect(state.rewarded).toHaveLength(70);
  });
});
describe('safe persistence', () => {
  it('round-trips evidence without increasing rewards and preserves timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
    let source = passWorld(createInitialState(), 'foundations');
    source = awardPuzzle(source, 'probability', puzzleIds('probability')[0], true, true);
    const imported = parseState(serializeState(source))!;
    expect(imported.xp).toBe(340);
    expect(imported.evidence).toEqual(source.evidence);
    expect(imported.rewarded).toEqual(source.rewarded);
    expect(imported.worlds).toEqual(source.worlds);
    expect(awardField(imported, 'foundations').xp).toBe(340);
    vi.useRealTimers();
  });
  it('recomputes imported XP, rank, awards and completion from evidence', () => {
    const source = createInitialState();
    source.xp = 999999;
    source.rank = 500;
    source.rewarded = ['world:active', 'world:foundations'];
    source.worlds.foundations = {
      stages: [],
      puzzles: puzzleIds('foundations'),
      field: true,
      completed: true,
      attempts: 3,
      stars: 3,
    };
    const parsed = parseState(JSON.stringify(source))!;
    expect(parsed.xp).toBe(0);
    expect(parsed.rank).toBe(1);
    expect(parsed.rewarded).toEqual([]);
    expect(worldStatus(parsed, 'probability')).toBe('locked');
  });
  it('does not credit imported descendant evidence when prerequisites are missing', () => {
    const source = createInitialState();
    source.evidence = puzzleIds('active').map((id) => ({
      id,
      world: 'active',
      kind: 'puzzle',
      correct: true,
      independent: true,
      at: 1,
    }));
    source.evidence.push({
      id: 'active-field',
      world: 'active',
      kind: 'field',
      correct: true,
      independent: true,
      at: 1,
    });
    const parsed = parseState(JSON.stringify(source))!;
    expect(parsed.xp).toBe(0);
    expect(worldStatus(parsed, 'active')).toBe('locked');
  });
  it('deduplicates imported evidence and awards', () => {
    const source = passWorld(createInitialState(), 'foundations');
    source.evidence = [...source.evidence, ...source.evidence, ...source.evidence];
    source.rewarded = [...source.rewarded, ...source.rewarded];
    const parsed = parseState(JSON.stringify(source))!;
    expect(parsed.xp).toBe(340);
    expect(parsed.evidence).toHaveLength(4);
    expect(parsed.rewarded).toHaveLength(5);
  });
  it('preserves legacy XP separately without crediting clicks or mastered flags', () => {
    const state = parseState(
      JSON.stringify({
        version: 1,
        xp: 3000,
        completedLessons: ['foundations-1'],
        mastered: ['active-1'],
      }),
    )!;
    expect(state.legacyXp).toBe(3000);
    expect(state.xp).toBe(0);
    expect(state.lessonMastery).toEqual([]);
    expect(state.evidence).toEqual([]);
    expect(worldStatus(state, 'active')).toBe('locked');
  });
  it('rejects malformed, unknown-version, invalid-world, nonfinite and invalid-settings data', () => {
    for (const raw of ['{', 'null', '{}', '{"version":99,"xp":10}', '{"version":2,"xp":10}'])
      expect(parseState(raw)).toBeNull();
    const invalid = createInitialState();
    (invalid.worlds as Record<string, unknown>).invented = {};
    expect(parseState(JSON.stringify(invalid))).toBeNull();
    expect(validateState({ ...createInitialState(), xp: NaN })).toBe(false);
    expect(
      parseState(
        JSON.stringify({
          ...createInitialState(),
          settings: { sound: 'yes', reducedMotion: false, density: 'comfortable' },
        }),
      ),
    ).toBeNull();
  });
  it('requires independent evidence for imported lesson mastery', () => {
    const state = createInitialState();
    state.lessonMastery = ['foundations-1'];
    expect(parseState(JSON.stringify(state))!.lessonMastery).toEqual([]);
  });
  it('survives storage failure and falls back from corruption to valid legacy data', () => {
    expect(
      loadState({
        getItem: () => {
          throw new Error('blocked');
        },
      }).xp,
    ).toBe(0);
    expect(
      saveState(createInitialState(), {
        setItem: () => {
          throw new Error('full');
        },
      }),
    ).toBe(false);
    expect(
      loadState({
        getItem: (key) =>
          key === STORAGE_KEY ? '{' : key === 'enigma-progress' ? '{"xp":777}' : null,
      }).legacyXp,
    ).toBe(777);
  });
  it('writes valid exports under the versioned storage key', () => {
    const write = vi.fn();
    expect(saveState(passWorld(createInitialState(), 'foundations'), { setItem: write })).toBe(
      true,
    );
    expect(write.mock.calls[0][0]).toBe(STORAGE_KEY);
    expect(parseState(write.mock.calls[0][1])?.xp).toBe(340);
  });
  it('rejects invalid import without discarding work, updates settings and resets cleanly', () => {
    const state = passWorld(createInitialState(), 'foundations');
    expect(gameReducer(state, { type: 'import', data: '{}' })).toBe(state);
    const originalSound = state.settings.sound;
    const changed = gameReducer(state, { type: 'settings', settings: { sound: !originalSound } });
    expect(changed.settings.sound).toBe(!originalSound);
    expect(state.settings.sound).toBe(originalSound);
    const reset = gameReducer(changed, { type: 'reset' });
    expect(reset.xp).toBe(0);
    expect(reset.worlds).toEqual({});
    expect(reset).not.toBe(initialState);
  });
});

describe('content and dependency integrity', () => {
  it('validates each mathematical task against its world, kind, domain and reference IDs', async () => {
    const { chapters, lessons, worlds } = await import('../src/content');
    expect(new Set(worlds.map((w) => w.id)).size).toBe(14);
    expect(worlds.map((w) => w.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(lessons).toHaveLength(70);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(70);
    const ids: string[] = [];
    for (const world of WORLD_IDS) {
      const chapter = chapters[world]!;
      expect(chapter.teachingStages).toHaveLength(5);
      expect(chapter.missions).toHaveLength(3);
      expect(
        chapter.relatedLessonIds.every((id) => lessons.find((l) => l.id === id)?.world === world),
      ).toBe(true);
      expect(new Set(chapter.relatedLessonIds).size).toBe(chapter.relatedLessonIds.length);
      for (const stage of chapter.teachingStages) {
        expect(stage.id.startsWith(`${world}-stage-`)).toBe(true);
        expect(stage.formula.length).toBeGreaterThan(0);
        ids.push(stage.id);
      }
      for (const mission of chapter.missions) {
        expect(mission.id.startsWith(`${world}-mission-`)).toBe(true);
        if (mission.kind === 'numeric') {
          expect(typeof mission.answer).toBe('number');
          expect(Number.isFinite(mission.answer)).toBe(true);
          expect(mission.tolerance ?? 0.001).toBeGreaterThan(0);
        } else if (mission.kind === 'choice') {
          expect(Number.isInteger(mission.answer)).toBe(true);
          expect(mission.answer).toBeGreaterThanOrEqual(0);
          expect(mission.answer).toBeLessThan(mission.choices!.length);
        } else {
          expect(Array.isArray(mission.answer)).toBe(true);
          expect(
            (mission.answer as string[]).every((id) =>
              chapter.teachingStages.some((s) => s.id === id),
            ),
          ).toBe(true);
        }
        ids.push(mission.id);
      }
    }
    expect(new Set(ids).size).toBe(112);
  });
  it('checks numerical Bayes, precision, variational and prospective targets independently', async () => {
    const { bayes, entropy, softmax } = await import('../src/domain/math');
    const target = (world: WorldId, index: number) =>
      chapters[world]!.missions[index].answer as number;
    expect(target('bayesian', 0)).toBeCloseTo(bayes(0.01, 0.9, 0.05), 6);
    const lambdaPrior = 1 / 4,
      lambdaSensor = 1 / 1;
    expect(target('bayesian', 2)).toBeCloseTo(
      (lambdaPrior * 0 + lambdaSensor * 2) / (lambdaPrior + lambdaSensor),
      6,
    );
    const gap = 0.5 * Math.log(0.5 / 0.75) + 0.5 * Math.log(0.5 / 0.25);
    const F = 0.5 * Math.log(0.5 / 0.3) + 0.5 * Math.log(0.5 / 0.1);
    expect(F + Math.log(0.4)).toBeCloseTo(gap, 12);
    expect(target('variational', 1)).toBeCloseTo(gap, 6);
    expect(target('decision', 0)).toBeCloseTo(entropy(0.5), 6);
    expect(target('decision', 1)).toBeCloseTo(softmax([0, -Math.log(3)])[0], 6);
  });
  it('keeps the prerequisite graph acyclic and every full gate reachable', () => {
    const visited = new Set<WorldId>(),
      visiting = new Set<WorldId>();
    const visit = (world: WorldId) => {
      expect(visiting.has(world)).toBe(false);
      if (visited.has(world)) return;
      visiting.add(world);
      for (const prior of campaignPrerequisites[world]) {
        expect(WORLD_IDS).toContain(prior);
        visit(prior);
      }
      visiting.delete(world);
      visited.add(world);
    };
    WORLD_IDS.forEach(visit);
    expect(visited.size).toBe(14);
  });
  it('migrates the actual v1 production key and settings without legacy mastery', () => {
    const legacy = {
      version: 1,
      xp: 1470,
      records: { 'foundations-1': { mastered: true } },
      questionXP: ['foundations-1:1'],
      settings: { sound: false, dense: true },
      lastLesson: 'foundations-1',
    };
    const migrated = loadState({
      getItem: (key) => (key === 'noesis-progress-v1' ? JSON.stringify(legacy) : null),
    });
    expect(migrated.legacyXp).toBe(1470);
    expect(migrated.xp).toBe(0);
    expect(migrated.settings).toEqual({ sound: false, reducedMotion: false, density: 'compact' });
    expect(migrated.lastLesson).toBe('foundations-1');
    expect(migrated.lessonMastery).toEqual([]);
    expect(migrated.evidence).toEqual([]);
  });
  it('retains assisted status through export and reload without granting points', () => {
    let state = createInitialState();
    const id = puzzleIds('foundations')[0];
    state = awardPuzzle(state, 'foundations', id, true, true);
    const imported = parseState(serializeState(state))!;
    expect(imported.xp).toBe(0);
    expect(imported.worlds.foundations?.puzzles).toEqual([]);
    expect(imported.evidence[0]).toMatchObject({ id, correct: true, independent: false });
  });
});

describe('persistent award chronology', () => {
  it('dates a field-before-puzzles run by actual evidence instead of replay order', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T09:00:00Z'));
    let state = awardField(createInitialState(), 'foundations');
    for (const [index, id] of puzzleIds('foundations').entries()) {
      vi.setSystemTime(new Date(`2026-10-03T09:0${index + 1}:00Z`));
      state = awardPuzzle(state, 'foundations', id, true);
    }
    const imported = parseState(serializeState(state))!;
    expect(imported.history).toEqual(state.history);
    expect(imported.history[0].xp).toBe(80);
    expect(imported.history.at(-1)?.xp).toBe(140);
    vi.useRealTimers();
  });
  it('rejects timestamps outside the JavaScript Date domain before serializing', () => {
    const state = awardPuzzle(
      createInitialState(),
      'foundations',
      puzzleIds('foundations')[0],
      true,
    );
    state.evidence[0].at = Number.MAX_SAFE_INTEGER;
    expect(validateState(state)).toBe(false);
    expect(parseState(JSON.stringify(state))).toBeNull();
  });
});
