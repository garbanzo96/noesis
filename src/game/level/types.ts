import type { ComponentType } from 'react';
import type { CastId } from '../../art/cast';
import type { PlaceId } from '../../art/places';
import type { Beats } from '../../engine/hooks';
import type { ForgePuzzle } from '../../forge';
import type { sfx } from '../audio';

// ============================================================================
// CASE CONTRACT — every level is a case of the Agencia NÓESIS.
//   scene (dialogue in a location) → demo (guided investigation: every beat is an action
//   or a prediction; notes fill the notebook) → challenge rounds (the case itself) →
//   closing scene. The runner owns HUD, notebook, credibility, hints, stars and results.
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

/** A notebook entry: the formal side of what the player just did. */
export interface Note {
  label: string;
  tex?: string;
  body?: string;
}

/** Reference of a topic: definitions and properties/identities, written in general form. */
export interface TopicRef {
  defs: Note[];
  props: Note[];
}

export interface LevelDef {
  /** stable id, e.g. 'w01-l03' (progress is keyed by it) */
  id: string;
  world: WorldId;
  /** display code, e.g. '1.3' */
  code: string;
  /** case title */
  title: string;
  /** mathematical topic */
  subtitle: string;
  /** TeX shown on the case card */
  glyph: string;
  kind: 'level' | 'boss';
  /** story order: cases that come before this one (a recommendation, never a lock) */
  requires: string[];
  /** position on the district board, in stage units (1600×900) */
  pos: [number, number];
  /** one sentence: the situation of the case */
  teaser: string;
  /** one sentence: the mathematics the player will master */
  learn: string;
  /** character who guides the investigation (default: iris) */
  guide?: CastId;
  /** lexicon ids introduced */
  glyphs: string[];
  /** extra notebook entries beyond those collected in the demo */
  notes?: Note[];
  /** typical mistakes, shown in the notebook card */
  pitfalls?: string[];
  /** reference sheet of the topic, shown in Resources: general definitions and properties */
  ref?: TopicRef;
  /** reward of a boss (district closed) */
  module?: string;
  /** under construction: shown but not playable; does not block dependents */
  wip?: boolean;
  steps: Step[];
}

export type Step = SceneStep | LessonStep | DemoStep | ChallengeStep | ForgeStep;

export interface Line {
  /** speaker; 'tu' = the player, 'nar' = narration */
  who: CastId | 'tu' | 'nar';
  text: string;
}
/** Dialogue in a location. Rich text: $tex$ and **bold**. */
export interface SceneStep {
  kind: 'scene';
  place: PlaceId;
  lines: Line[];
}

/** Guided investigation. Beats are actions (gate), predictions (ask) or short reveals. */
/** A line of the lesson blackboard; with a label it is also copied to the case notebook. */
export interface BoardLine {
  tex: string;
  label?: string;
  body?: string;
  /** what each \p{n}{…} part means, in order: shown under it with a brace while it is written */
  parts?: string[];
}
/**
 * The lesson: the concept developed from scratch with animations and interactive tools, while
 * the blackboard builds the formal side term by term. Narrated by NÓESIS. Comes before the
 * investigation, so nothing is applied before it has been introduced.
 */
export interface LessonStep {
  kind: 'lesson';
  title: string;
  Scene: ComponentType<DemoProps>;
  beats: Beat[];
}
export interface DemoStep {
  kind: 'demo';
  title: string;
  Scene: ComponentType<DemoProps>;
  beats: Beat[];
}
export interface Beat {
  /** one or two short sentences: what to look at or do */
  say: string;
  /** formula shown with the prompt */
  tex?: string;
  /** notebook entry revealed when the beat is completed */
  note?: Note;
  /** a prediction asked BEFORE the scene reveals the answer; no penalty */
  ask?: { prompt: string; options: string[]; answer: number; explain: string };
  /** instruction for an interaction; the scene calls unlock() when satisfied */
  gate?: string;
  /** animation duration in seconds (default 1.4; lessons 2.2) */
  dur?: number;
  /** lesson only: formula line(s) written on the blackboard during this beat */
  board?: BoardLine | BoardLine[];
}
export interface DemoProps {
  beats: Beats;
  reduced: boolean;
  unlock: () => void;
  answer: number | null;
}

/** The case: generated rounds of direct manipulation with consequences in the scene. */
export interface ChallengeStep {
  kind: 'challenge';
  title: string;
  Comp: ComponentType<ChallengeProps>;
  rounds: number;
}
export interface ChallengeProps {
  seed: number;
  round: number;
  rounds: number;
  reduced: boolean;
  api: ChallengeApi;
}
export interface ChallengeApi {
  /** instruction for this round (rich) and an optional formula */
  prompt: (text: string, tex?: string) => void;
  /** two graded hints */
  hints: (list: string[]) => void;
  /** ok=true ends the round; ok=false costs credibility and msg must name the discrepancy */
  result: (ok: boolean, msg?: string) => void;
  sfx: typeof sfx;
}

export interface ForgeStep {
  kind: 'forge';
  title: string;
  puzzles: ForgePuzzle[];
}

// ---------- codex & lexicon ----------
export interface CodexEntry {
  id: string;
  world: WorldId;
  title: string;
  summary: string;
  blocks: Note[];
  pitfalls?: string[];
  level: string;
}

export interface Glyph {
  id: string;
  tex: string;
  name: string;
  /** how to read it aloud (Spanish) */
  read: string;
  meaning: string;
  /** collision / warning */
  warn?: string;
  world: WorldId;
}

export interface SectorDef {
  world: WorldId;
  number: number;
  /** district name */
  name: string;
  /** mathematical area */
  tag: string;
  accent: string;
  place: PlaceId;
  description: string;
  levels: LevelDef[];
  /** what closing the district reveals */
  module: { id: string; name: string; description: string };
}

/** What a level file exports. Layout (pos) and gating (requires) are set by the district index. */
export type LevelSpec = Omit<LevelDef, 'pos' | 'requires'>;
export interface LevelModule {
  level: LevelSpec;
  glyphs: Glyph[];
  /** the topic's lesson, inserted right after the opening scene */
  lesson?: LessonStep;
}
