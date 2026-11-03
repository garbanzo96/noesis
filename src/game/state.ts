import { useSyncExternalStore } from 'react';
import { configureAudio } from './audio';

// Single source of truth for progress. Pure update functions + a tiny external store.
// Persistence is local (localStorage) and exportable; nothing here certifies mastery beyond
// what the stars encode: completed, without hints, without errors.
// Each person has a session on this device: a name and its own save. Nothing leaves the device;
// a backup file is what moves a session to another computer.

export interface LevelRecord {
  done: boolean;
  stars: [boolean, boolean, boolean];
  attempts: number;
  bestSeconds?: number;
  firstAt?: number;
}
export type GameMode = 'adventure' | 'complete';
export interface Settings {
  sfx: boolean;
  music: boolean;
  volume: number;
  reducedMotion: boolean;
  textSpeed: 'slow' | 'normal' | 'instant';
  /** complete mode: every world and case open. Adventure mode follows the story in order. */
  freeMode: boolean;
}
export interface GameState {
  version: 3;
  xp: number;
  levels: Record<string, LevelRecord>;
  glyphs: string[];
  codex: string[];
  modules: string[];
  predictions: { right: number; total: number };
  settings: Settings;
  booted: boolean;
  last: { world?: string; level?: string };
}

export const STORAGE_KEY = 'noesis.v3';

export function initialState(): GameState {
  return {
    version: 3,
    xp: 0,
    levels: {},
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
    booted: false,
    last: {},
  };
}

export interface LevelResult {
  levelId: string;
  world: string;
  boss: boolean;
  hintsUsed: number;
  errors: number;
  seconds: number;
  glyphs: string[];
  codex: string[];
  module?: string;
}

export const STAR_XP = 50;
export const COMPLETE_XP = 50;

export function starsFor(
  r: Pick<LevelResult, 'hintsUsed' | 'errors'>,
): [boolean, boolean, boolean] {
  return [true, r.hintsUsed === 0, r.errors === 0];
}

/** Returns new state and the XP gained (only newly earned stars pay). */
export function completeLevel(
  s: GameState,
  r: LevelResult,
): { state: GameState; gained: number; newStars: boolean[] } {
  const prev = s.levels[r.levelId];
  const earned = starsFor(r);
  const merged: [boolean, boolean, boolean] = [
    earned[0] || !!prev?.stars[0],
    earned[1] || !!prev?.stars[1],
    earned[2] || !!prev?.stars[2],
  ];
  const newStars = merged.map((v, i) => v && !prev?.stars[i]);
  const mult = r.boss ? 2 : 1;
  const gained =
    (newStars.filter(Boolean).length * STAR_XP + (prev?.done ? 0 : COMPLETE_XP)) * mult;
  const rec: LevelRecord = {
    done: true,
    stars: merged,
    attempts: (prev?.attempts ?? 0) + 1,
    bestSeconds: Math.min(prev?.bestSeconds ?? Infinity, r.seconds),
    firstAt: prev?.firstAt ?? Date.now(),
  };
  const uniq = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  return {
    gained,
    newStars,
    state: {
      ...s,
      xp: s.xp + gained,
      levels: { ...s.levels, [r.levelId]: rec },
      glyphs: uniq(s.glyphs, r.glyphs),
      codex: uniq(s.codex, r.codex),
      modules: r.module ? uniq(s.modules, [r.module]) : s.modules,
      last: { world: r.world, level: r.levelId },
    },
  };
}

export const RANKS = [
  'Aspirante',
  'Analista',
  'Analista senior',
  'Detective',
  'Detective senior',
  'Especialista',
  'Agente de élite',
  'Leyenda de NÓESIS',
];
/** XP needed for each rank. A full run (128 cases, every star) is about 28 000 XP, so the
 *  top rank arrives near the end of the city, not after the first districts. */
export const RANK_AT = [0, 600, 1800, 3800, 6600, 10200, 15000, 21000];
export const rankOf = (xp: number) => RANK_AT.reduce((r, t, i) => (xp >= t ? i : r), 0);
/** fraction of the way to the next rank (1 at the top rank) */
export const rankProgress = (xp: number) => {
  const r = rankOf(xp);
  if (r >= RANK_AT.length - 1) return 1;
  return (xp - RANK_AT[r]) / (RANK_AT[r + 1] - RANK_AT[r]);
};

// ---------- validation / persistence ----------
function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
export function validate(raw: unknown): GameState | null {
  if (!isObj(raw) || raw.version !== 3) return null;
  const base = initialState();
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((v) => typeof v === 'string') : []);
  const levels: Record<string, LevelRecord> = {};
  if (isObj(raw.levels)) {
    for (const [k, v] of Object.entries(raw.levels)) {
      if (!isObj(v)) continue;
      const st = Array.isArray(v.stars) ? v.stars.map(Boolean) : [];
      levels[k] = {
        done: !!v.done,
        stars: [!!st[0], !!st[1], !!st[2]],
        attempts: Number(v.attempts) || 0,
        bestSeconds: Number.isFinite(Number(v.bestSeconds)) ? Number(v.bestSeconds) : undefined,
        firstAt: Number(v.firstAt) || undefined,
      };
    }
  }
  // settings can come from a backup file: only known fields with the right type get through
  const given = isObj(raw.settings) ? raw.settings : {};
  const flag = (k: 'sfx' | 'music' | 'reducedMotion' | 'freeMode') =>
    typeof given[k] === 'boolean' ? given[k] : base.settings[k];
  const volume = Number(given.volume);
  const settings: Settings = {
    sfx: flag('sfx'),
    music: flag('music'),
    reducedMotion: flag('reducedMotion'),
    freeMode: flag('freeMode'),
    volume:
      typeof given.volume === 'number' && volume >= 0 && volume <= 1
        ? volume
        : base.settings.volume,
    textSpeed:
      (['slow', 'normal', 'instant'] as const).find((t) => t === given.textSpeed) ??
      base.settings.textSpeed,
  };
  return {
    ...base,
    xp: Math.max(0, Number(raw.xp) || 0),
    levels,
    glyphs: strings(raw.glyphs),
    codex: strings(raw.codex),
    modules: strings(raw.modules),
    predictions: isObj(raw.predictions)
      ? { right: Number(raw.predictions.right) || 0, total: Number(raw.predictions.total) || 0 }
      : base.predictions,
    settings,
    booted: !!raw.booted,
    last: isObj(raw.last) ? (raw.last as GameState['last']) : {},
  };
}

function read(key: string): unknown {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null; /* corrupted or blocked storage: start fresh */
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; /* storage may be unavailable (private mode); the session still works */
  }
}
const forget = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to clean up */
  }
};

// ---------- sessions ----------
export interface Session {
  id: string;
  name: string;
  createdAt: number;
  lastAt: number;
}
interface SessionIndex {
  current: string | null;
  list: Session[];
}
const INDEX_KEY = 'noesis.sessions';
const MAX_NAME = 24;
/** a real backup is a few KB: anything near this size is not one */
const MAX_BACKUP = 2_000_000;
const saveKey = (id: string) => `${STORAGE_KEY}.${id}`;
const cleanName = (raw: string) =>
  raw.replace(/\p{C}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim();
const newSession = (name: string): Session => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
  name,
  createdAt: Date.now(),
  lastAt: Date.now(),
});
function isSession(x: unknown): x is Session {
  return isObj(x) && typeof x.id === 'string' && typeof x.name === 'string';
}

function openIndex(): SessionIndex {
  const raw = read(INDEX_KEY);
  if (isObj(raw) && Array.isArray(raw.list)) {
    const list = raw.list.filter(isSession);
    return { current: list.find((s) => s.id === raw.current)?.id ?? null, list };
  }
  // a save from before sessions existed becomes the first one, with everything open as it was
  const legacy = validate(read(STORAGE_KEY));
  if (!legacy) return { current: null, list: [] };
  const first = newSession('Mi partida');
  const opened = { current: first.id, list: [first] };
  const adopted = { ...legacy, settings: { ...legacy.settings, freeMode: true } };
  if (write(saveKey(first.id), adopted) && write(INDEX_KEY, opened)) forget(STORAGE_KEY);
  return opened;
}
function load(id: string | null): GameState {
  return (id && validate(read(saveKey(id)))) || initialState();
}
function save(s: GameState) {
  if (index.current) write(saveKey(index.current), s);
}

// ---------- store ----------
let index = openIndex();
let state: GameState = load(index.current);
const listeners = new Set<() => void>();
configureAudio({ sfx: state.settings.sfx, music: false, volume: state.settings.volume });
// browsers only let audio start after a gesture: the score begins on the first click or key
if (typeof window !== 'undefined') {
  const wake = () => {
    window.removeEventListener('pointerdown', wake);
    window.removeEventListener('keydown', wake);
    configureAudio({ music: store.get().settings.music });
  };
  window.addEventListener('pointerdown', wake);
  window.addEventListener('keydown', wake);
}

export const store = {
  get: () => state,
  set(next: GameState) {
    state = next;
    save(state);
    listeners.forEach((l) => l());
  },
  update(fn: (s: GameState) => GameState) {
    store.set(fn(state));
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useGame(): GameState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function setSettings(patch: Partial<Settings>) {
  store.update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const st = store.get().settings;
  configureAudio({ sfx: st.sfx, music: st.music, volume: st.volume });
}

export function recordPrediction(right: boolean) {
  store.update((s) => ({
    ...s,
    predictions: { right: s.predictions.right + (right ? 1 : 0), total: s.predictions.total + 1 },
  }));
}

export function resetState() {
  store.set({ ...initialState(), booted: true, settings: store.get().settings });
}

export const gameMode = (s: GameState): GameMode =>
  s.settings.freeMode ? 'complete' : 'adventure';
export const setGameMode = (mode: GameMode) => setSettings({ freeMode: mode === 'complete' });

export const sessions = () => index.list;
export const currentSession = () => index.list.find((s) => s.id === index.current) ?? null;
/** what the session list shows about a session, without entering it */
export function sessionSummary(id: string) {
  const s = id === index.current ? state : load(id);
  return {
    done: Object.values(s.levels).filter((l) => l.done).length,
    xp: s.xp,
    mode: gameMode(s),
  };
}

function open(id: string | null, next: GameState) {
  index = {
    current: id,
    list: index.list.map((s) => (s.id === id ? { ...s, lastAt: Date.now() } : s)),
  };
  write(INDEX_KEY, index);
  store.set(next);
  configureAudio({ sfx: next.settings.sfx, volume: next.settings.volume });
}
function add(name: string, next: GameState): Session {
  const taken = (n: string) => index.list.some((s) => s.name.toLowerCase() === n.toLowerCase());
  let unique = name;
  for (let i = 2; taken(unique); i++) unique = `${name.slice(0, MAX_NAME - 5)} (${i})`;
  const session = newSession(unique);
  index = { ...index, list: [...index.list, session] };
  open(session.id, next);
  return session;
}

export function createSession(rawName: string, mode: GameMode): Session | null {
  const name = cleanName(rawName);
  if (!name) return null;
  const base = initialState();
  return add(name, {
    ...base,
    settings: { ...base.settings, freeMode: mode === 'complete' },
  });
}
export function enterSession(id: string) {
  if (index.list.some((s) => s.id === id)) open(id, load(id));
}
export function leaveSession() {
  open(null, initialState());
}
export function deleteSession(id: string) {
  forget(saveKey(id));
  const wasCurrent = id === index.current;
  index = {
    current: wasCurrent ? null : index.current,
    list: index.list.filter((s) => s.id !== id),
  };
  write(INDEX_KEY, index);
  if (wasCurrent) open(null, initialState());
}

/** the backup file: the save itself plus the name of the session */
export function exportSession(): string {
  return JSON.stringify({ name: currentSession()?.name, ...state }, null, 2);
}
/** A backup always arrives as a new session, so it can never overwrite someone's progress. */
export function importSession(json: string): Session | null {
  if (json.length > MAX_BACKUP) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const next = validate(raw);
  if (!next) return null;
  const name = isObj(raw) && typeof raw.name === 'string' ? cleanName(raw.name) : '';
  return add(name || 'Partida importada', next);
}
