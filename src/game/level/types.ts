import type { ComponentType } from 'react';
import type { Beats } from '../../engine/hooks';
import type { ForgePuzzle } from '../../forge';
import type { sfx } from '../audio';

// ============================================================================
// LEVEL CONTRACT — every level of every world is a LevelDef.
// A level is a short protocol: briefing → demonstration (animated, with predictions)
// → challenge waves (direct manipulation, generated cases) → Forge (derive identities)
// → codex card. The runner owns HUD, console, integrity, hints, stars and results;
// level authors only write scenes and mechanics.
// ============================================================================

export type WorldId =
  | 'foundations'
  | 'differential'
  | 'integral'
  | 'linear'
  | 'probability'
  | 'statistics'
  | 'multivariate'
  | 'information'
  | 'dynamics'
  | 'bayesian'
  | 'variational'
  | 'generative'
  | 'decision'
  | 'active';

export interface LevelDef {
  /** stable id, e.g. 'w01-l11' (progress is keyed by it) */
  id: string;
  world: WorldId;
  /** display code, e.g. '1.11' */
  code: string;
  title: string;
  subtitle: string;
  /** TeX shown on the sector-map node */
  glyph: string;
  kind: 'level' | 'boss';
  /** level ids that must be completed first (soft gate; free mode ignores it) */
  requires: string[];
  /** node position on the sector map, in stage units (1600×900) */
  pos: [number, number];
  /** one sentence: what the player will be able to do afterwards */
  objective: string;
  /** lexicon ids learned in this level */
  glyphs: string[];
  /** codex entry ids unlocked on completion */
  codex: string[];
  /** module granted (bosses) */
  module?: string;
  /** under construction: shown on the map but not playable; does not block dependents */
  wip?: boolean;
  steps: Step[];
}

export type Step = BriefStep | DemoStep | ChallengeStep | ForgeStep | CodexStep;

/** NOESIS speaks. Rich text: $tex$ and **bold**. */
export interface BriefStep {
  kind: 'brief';
  lines: string[];
}

/** An animated demonstration advanced beat by beat (Space / →). */
export interface DemoStep {
  kind: 'demo';
  title: string;
  Scene: ComponentType<DemoProps>;
  beats: Beat[];
}
export interface Beat {
  /** caption spoken by NOESIS during this beat (rich) */
  say: string;
  /** formula shown under the caption (TeX with \g{} glyph tags) */
  tex?: string;
  /** a prediction asked BEFORE the scene reveals the answer; no penalty */
  ask?: { prompt: string; options: string[]; answer: number; explain: string };
  /** the player must interact with the scene (scene calls unlock()) to continue */
  gate?: string;
  /** animation duration in seconds (default 1.4) */
  dur?: number;
}
export interface DemoProps {
  beats: Beats;
  reduced: boolean;
  /** call when the gate interaction for the current beat has been satisfied */
  unlock: () => void;
  /** prediction chosen on the current beat (null until answered) */
  answer: number | null;
}

/** Interactive challenge waves; each round is a new generated case. */
export interface ChallengeStep {
  kind: 'challenge';
  title: string;
  Comp: ComponentType<ChallengeProps>;
  rounds: number;
}
export interface ChallengeProps {
  /** deterministic seed for this round's case */
  seed: number;
  round: number;
  rounds: number;
  reduced: boolean;
  api: ChallengeApi;
}
export interface ChallengeApi {
  /** set the console instruction for this round (rich) and an optional formula */
  prompt: (text: string, tex?: string) => void;
  /** graded hints for this round, revealed one at a time by the player */
  hints: (list: string[]) => void;
  /**
   * Report an attempt. ok=true ends the round (success animation, next case).
   * ok=false costs one integrity cell; msg must say exactly what is wrong.
   */
  result: (ok: boolean, msg?: string) => void;
  sfx: typeof sfx;
}

/** Symbolic derivation puzzles in the Forge. */
export interface ForgeStep {
  kind: 'forge';
  title: string;
  puzzles: ForgePuzzle[];
}

/** Formal card unlocked into the codex. */
export interface CodexStep {
  kind: 'codex';
  entry: string;
}

// ---------- codex & lexicon ----------
export interface CodexEntry {
  id: string;
  world: WorldId;
  title: string;
  /** one-sentence intuition */
  summary: string;
  blocks: { label: string; body?: string; tex?: string }[];
  pitfalls?: string[];
  /** where it shows up in Active Inference */
  aif?: { text: string; tex?: string }[];
  /** level that teaches it */
  level: string;
}

export interface Glyph {
  id: string;
  /** TeX of the symbol */
  tex: string;
  name: string;
  /** how to read it aloud (Spanish) */
  read: string;
  meaning: string;
  /** collision / warning, if any */
  warn?: string;
  aif?: string;
  world: WorldId;
}

export interface SectorDef {
  world: WorldId;
  number: number;
  name: string;
  tag: string;
  /** TeX emblem */
  emblem: string;
  accent: string;
  description: string;
  /** NOESIS lines when entering the sector */
  intro: string[];
  /** module restored by the boss */
  module: { id: string; name: string; description: string };
  levels: LevelDef[];
  /** zone labels drawn on the sector map */
  zones: { label: string; x: number; y: number }[];
}

/** What a level file exports. Layout (pos) and gating (requires) are set by the sector index. */
export type LevelSpec = Omit<LevelDef, 'pos' | 'requires'>;
export interface LevelModule {
  level: LevelSpec;
  codex: CodexEntry[];
  glyphs: Glyph[];
}
