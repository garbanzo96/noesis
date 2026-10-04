import { useSyncExternalStore } from 'react';
import { configureAudio } from './audio';

// Single source of truth for progress. Pure update functions + a tiny external store.
// Persistence is local (localStorage) and exportable; nothing here certifies mastery beyond
// what the stars encode: completed, without hints, with at most one error.

export interface LevelRecord {
  done: boolean;
  stars: [boolean, boolean, boolean];
  attempts: number;
  bestSeconds?: number;
  firstAt?: number;
}
export interface Settings {
  sfx: boolean;
  music: boolean;
  volume: number;
  reducedMotion: boolean;
  textSpeed: 'slow' | 'normal' | 'instant';
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
      music: false,
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

export function starsFor(r: Pick<LevelResult, 'hintsUsed' | 'errors'>): [boolean, boolean, boolean] {
  return [true, r.hintsUsed === 0, r.errors <= 1];
}

/** Returns new state and the XP gained (only newly earned stars pay). */
export function completeLevel(s: GameState, r: LevelResult): { state: GameState; gained: number; newStars: boolean[] } {
  const prev = s.levels[r.levelId];
  const earned = starsFor(r);
  const merged: [boolean, boolean, boolean] = [
    earned[0] || !!prev?.stars[0],
    earned[1] || !!prev?.stars[1],
    earned[2] || !!prev?.stars[2],
  ];
  const newStars = merged.map((v, i) => v && !prev?.stars[i]);
  const mult = r.boss ? 2 : 1;
  const gained = (newStars.filter(Boolean).length * STAR_XP + (prev?.done ? 0 : COMPLETE_XP)) * mult;
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
  'Observador',
  'Cartógrafo',
  'Modelador',
  'Analista',
  'Inferente',
  'Navegante',
  'Investigador',
  'Arquitecto',
  'Estratega',
  'Constructor',
  'Sintetizador',
  'Agente',
];
export const RANK_XP = 500;
export const rankOf = (xp: number) => Math.min(RANKS.length - 1, Math.floor(xp / RANK_XP));

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
  const settings = isObj(raw.settings) ? { ...base.settings, ...raw.settings } : base.settings;
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
    settings: settings as Settings,
    booted: !!raw.booted,
    last: isObj(raw.last) ? (raw.last as GameState['last']) : {},
  };
}

function load(): GameState {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return validate(JSON.parse(s)) ?? initialState();
  } catch {
    /* corrupted or blocked storage: start fresh */
  }
  return initialState();
}
function save(s: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage may be unavailable (private mode); the session still works */
  }
}

// ---------- store ----------
let state: GameState = load();
const listeners = new Set<() => void>();
configureAudio({ sfx: state.settings.sfx, music: false, volume: state.settings.volume });

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

export function exportState(): string {
  return JSON.stringify(store.get(), null, 2);
}
export function importState(json: string): boolean {
  try {
    const v = validate(JSON.parse(json));
    if (!v) return false;
    store.set(v);
    return true;
  } catch {
    return false;
  }
}
export function resetState() {
  store.set({ ...initialState(), booted: true, settings: store.get().settings });
}
