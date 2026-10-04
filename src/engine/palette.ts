// One palette for the whole game. Following 3Blue1Brown's rule, a color names an entity
// and keeps that meaning across worlds: once cyan means "input / hidden state" it never
// means anything else. Semantic aliases make that contract explicit in scene code.
export const C = {
  bg: '#070613',
  bg2: '#0b0a1a',
  panel: '#0e0c20',
  line: '#2b2340',
  grid: '#1a1530',
  text: '#f3f0ff',
  muted: '#9d93b5',
  dim: '#5d5478',
  cyan: '#28e7fa',
  amber: '#ffbc5e',
  violet: '#a88aff',
  magenta: '#ff3ba7',
  green: '#4dffa6',
  red: '#ff5470',
  blue: '#6f9cff',
  teal: '#3df5c9',
} as const;

export const ENTITY = {
  /** inputs, domains, hidden states s */
  input: C.cyan,
  /** outputs, codomains, observations o */
  output: C.amber,
  /** probabilities, beliefs q, normalized mass */
  belief: C.violet,
  /** scores, log-space quantities, energies, preferences */
  log: C.magenta,
  /** confirmed results */
  ok: C.green,
  /** errors and violated conditions */
  bad: C.red,
  /** operators / machines */
  op: C.blue,
} as const;

export type ColorName = keyof typeof C;
