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
export interface World {
  id: WorldId;
  number: number;
  symbol: string;
  name: string;
  tag: string;
  description: string;
  accent: string;
  prerequisites: WorldId[];
  asset: string;
  route: string;
}
export interface TeachingStage {
  id: string;
  title: string;
  claim: string;
  formula: string;
  explanation: string;
  actionLabel: string;
  animation?: string;
}
export interface Puzzle {
  id: string;
  title: string;
  brief: string;
  setup: string;
  kind: 'numeric' | 'choice' | 'sequence';
  prompt: string;
  formula: string;
  choices?: string[];
  answer: number | string[];
  solution: string;
  hint: string;
  transfer: string;
  tolerance?: number;
}
export interface Chapter {
  scenario: string;
  objective: string;
  briefing: string;
  teachingStages: TeachingStage[];
  missions: Puzzle[];
  relatedLessonIds: string[];
  sources: string[];
  scope?: string;
}
export interface Question {
  type: 'choice' | 'numeric';
  prompt: string;
  formula?: string;
  options?: string[];
  answer: number;
  tolerance?: number;
  explanation: string;
  hint: string;
}
export interface Lesson {
  id: string;
  world: WorldId;
  title: string;
  subtitle: string;
  minutes: number;
  visual: string;
  intuition: string;
  core: { label: string; body: string; formula?: string }[];
  derivation: { formula: string; reason: string }[];
  example: { problem: string; solution: string };
  pitfall: string;
  bridge: string;
  questions: Question[];
  references: string[];
}
export interface SceneMedia {
  id: string;
  file: string;
  poster?: string;
  duration?: number;
  stages?: { at: number; title: string; claim: string; formula?: string }[];
}
export type Mode = 'observe' | 'operate' | 'transfer';
export interface MasteryEvidence {
  id: string;
  world: WorldId;
  kind: 'puzzle' | 'field' | 'lesson';
  independent: boolean;
  correct: boolean;
  at: number;
}
export interface WorldProgress {
  stages: number[];
  puzzles: string[];
  field: boolean;
  completed: boolean;
  attempts: number;
  stars: number;
}
export interface GameState {
  version: 2;
  xp: number;
  charge: number;
  rank: number;
  worlds: Partial<Record<WorldId, WorldProgress>>;
  evidence: MasteryEvidence[];
  rewarded: string[];
  lessonMastery: string[];
  mistakes: { lessonId: string; questionIndex: number; due: number; interval: number }[];
  settings: { sound: boolean; reducedMotion: boolean; density: 'compact' | 'comfortable' };
  lastWorld: WorldId;
  lastLesson: string | null;
  legacyXp: number;
  history: { date: string; world: WorldId; xp: number }[];
}
export interface Params {
  [key: string]: number;
}
