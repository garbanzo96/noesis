import { beforeEach, describe, expect, it, vi } from 'vitest';

// The save layer reads localStorage when the module loads, so each "launch" is a fresh import.
const launch = async () => {
  vi.resetModules();
  return import('../src/game/state');
};
const LEGACY = 'noesis.v3';
const legacySave = (level: string) =>
  JSON.stringify({
    version: 3,
    xp: 100,
    levels: { [level]: { done: true, stars: [true, false, false], attempts: 1 } },
    glyphs: [],
    codex: [],
    modules: [],
    predictions: { right: 0, total: 0 },
    settings: {
      sfx: true,
      music: true,
      volume: 0.7,
      reducedMotion: false,
      textSpeed: 'normal',
      freeMode: false,
    },
    booted: true,
    last: {},
  });

// importing the 14 worlds for the first time takes several seconds
vi.setConfig({ testTimeout: 30_000 });
beforeEach(() => localStorage.clear());

describe('sessions', () => {
  it('starts with no session and writes nothing until one exists', async () => {
    const g = await launch();
    expect(g.currentSession()).toBeNull();
    g.store.update((s) => ({ ...s, xp: 50 }));
    expect(localStorage.length).toBe(0);
  });

  it('a new session keeps its name and mode, and survives a restart', async () => {
    const g = await launch();
    const a = g.createSession('  Ana   María ', 'adventure')!;
    expect(a.name).toBe('Ana María');
    expect(g.gameMode(g.store.get())).toBe('adventure');
    g.store.update((s) => ({ ...s, xp: 300 }));
    const again = await launch();
    expect(again.currentSession()?.name).toBe('Ana María');
    expect(again.store.get().xp).toBe(300);
  });

  it('refuses an empty name and makes repeated names distinct', async () => {
    const g = await launch();
    expect(g.createSession('   ', 'adventure')).toBeNull();
    g.createSession('Ana', 'adventure');
    expect(g.createSession('ana', 'complete')!.name).toBe('ana (2)');
  });

  it('progress of one session never reaches another', async () => {
    const g = await launch();
    const a = g.createSession('Ana', 'adventure')!;
    g.store.update((s) => ({ ...s, xp: 500 }));
    g.createSession('Beto', 'complete');
    expect(g.store.get().xp).toBe(0);
    expect(g.gameMode(g.store.get())).toBe('complete');
    g.enterSession(a.id);
    expect(g.store.get().xp).toBe(500);
    expect(g.gameMode(g.store.get())).toBe('adventure');
  });

  it('adopts a save from before sessions existed, without losing it', async () => {
    localStorage.setItem(LEGACY, legacySave('w1-c1'));
    const g = await launch();
    expect(g.currentSession()?.name).toBe('Mi partida');
    expect(g.store.get().levels['w1-c1'].done).toBe(true);
    // those players had everything open: they keep it
    expect(g.gameMode(g.store.get())).toBe('complete');
    expect(localStorage.getItem(LEGACY)).toBeNull();
    const again = await launch();
    expect(again.store.get().xp).toBe(100);
  });

  it('deleting a session removes only its data', async () => {
    const g = await launch();
    const a = g.createSession('Ana', 'adventure')!;
    const b = g.createSession('Beto', 'adventure')!;
    g.store.update((s) => ({ ...s, xp: 70 }));
    g.deleteSession(a.id);
    expect(g.sessions().map((s) => s.id)).toEqual([b.id]);
    expect(g.currentSession()?.id).toBe(b.id);
    expect(g.store.get().xp).toBe(70);
    g.deleteSession(b.id);
    expect(g.currentSession()).toBeNull();
    expect(Object.keys(localStorage).filter((k) => k.startsWith(`${LEGACY}.`))).toEqual([]);
  });

  it('a backup file moves a session to another computer', async () => {
    const g = await launch();
    g.createSession('Ana', 'complete');
    g.store.update((s) => ({ ...s, xp: 900 }));
    const file = g.exportSession();
    localStorage.clear();
    const other = await launch();
    const got = other.importSession(file)!;
    expect(got.name).toBe('Ana');
    expect(other.store.get().xp).toBe(900);
    expect(other.gameMode(other.store.get())).toBe('complete');
  });

  it('a damaged or hostile backup file cannot break the game', async () => {
    const g = await launch();
    expect(g.importSession('no es json')).toBeNull();
    expect(g.importSession('{"version":99}')).toBeNull();
    const hostile = JSON.parse(legacySave('w1-c1'));
    hostile.name = 'x'.repeat(500);
    hostile.settings = { volume: 'fuerte', textSpeed: 'rapidísimo', freeMode: 'sí', sfx: 1 };
    const s = g.importSession(JSON.stringify(hostile))!;
    expect(s.name.length).toBeLessThanOrEqual(24);
    const st = g.store.get().settings;
    expect(st.volume).toBe(0.7);
    expect(st.textSpeed).toBe('normal');
    expect(st.freeMode).toBe(false);
    expect(st.sfx).toBe(true);
    expect(g.importSession('x'.repeat(3_000_000))).toBeNull();
  });
});

describe('adventure mode', () => {
  const setup = async (mode: 'adventure' | 'complete') => {
    const g = await launch();
    const r = await import('../src/content/registry');
    g.createSession('Ana', mode);
    const finish = (ids: string[]) =>
      g.store.update((s) => ({
        ...s,
        levels: Object.fromEntries(
          ids.map((id) => [id, { done: true, stars: [true, true, true], attempts: 1 }]),
        ),
      }));
    return { g, r, finish };
  };

  it('opens one case after another', async () => {
    const { g, r, finish } = await setup('adventure');
    const lv = r.LEVELS;
    expect(r.levelState(g.store.get(), lv['w1-c1'])).toBe('open');
    expect(r.levelState(g.store.get(), lv['w1-c2'])).toBe('locked');
    finish(['w1-c1']);
    expect(r.levelState(g.store.get(), lv['w1-c2'])).toBe('open');
  });

  it('a world opens when the previous one closes its final case', async () => {
    const { g, r, finish } = await setup('adventure');
    expect(r.sectorState(g.store.get(), 'foundations')).toBe('open');
    expect(r.sectorState(g.store.get(), 'differential')).toBe('locked');
    expect(r.levelState(g.store.get(), r.LEVELS['w2-c1'])).toBe('locked');
    const w1 = r.PLAYABLE.foundations!.levels.map((l) => l.id);
    finish(w1);
    expect(r.sectorState(g.store.get(), 'differential')).toBe('open');
    expect(r.levelState(g.store.get(), r.LEVELS['w2-c1'])).toBe('open');
    expect(r.storyNext(g.store.get())?.id).toBe('w2-c1');
  });

  it('every case of the game is reachable by following the story', async () => {
    const { g, r, finish } = await setup('adventure');
    const done: string[] = [];
    for (let i = 0; i < 200; i++) {
      const next = r.storyNext(g.store.get());
      if (!next) break;
      done.push(next.id);
      finish(done);
    }
    const all = Object.values(r.LEVELS).filter((l) => !l.wip);
    expect(new Set(done).size).toBe(all.length);
  });

  it('complete mode opens everything and still records progress', async () => {
    const { g, r, finish } = await setup('complete');
    expect(r.levelState(g.store.get(), r.LEVELS['w14-final'])).toBe('open');
    expect(r.sectorState(g.store.get(), 'active')).toBe('open');
    finish(['w14-final']);
    expect(r.levelState(g.store.get(), r.LEVELS['w14-final'])).toBe('done');
  });

  it('changing mode keeps the progress', async () => {
    const { g, r, finish } = await setup('complete');
    finish(['w1-c1', 'w1-c2', 'w5-c3']);
    g.setGameMode('adventure');
    expect(r.levelState(g.store.get(), r.LEVELS['w1-c2'])).toBe('done');
    expect(r.levelState(g.store.get(), r.LEVELS['w1-c3'])).toBe('open');
    // what was already played stays reachable, even if it comes later in the story
    expect(r.levelState(g.store.get(), r.LEVELS['w5-c3'])).toBe('done');
    expect(r.levelState(g.store.get(), r.LEVELS['w5-c4'])).toBe('locked');
  });
});
