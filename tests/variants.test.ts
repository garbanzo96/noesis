import { describe, expect, it } from 'vitest';
import { chapters, worlds } from '../src/content';
import type { Puzzle, WorldId } from '../src/domain/types';
import {
  makeVariant,
  NUMERIC_VARIANT_IDS,
  variantInfo,
  type VariantPuzzle,
} from '../src/content/variants';

const tasks = worlds.flatMap((world) =>
  chapters[world.id]!.missions.map((base) => ({ world: world.id, base })),
);
const numerical = tasks.filter(({ base }) => base.kind === 'numeric');
const choices = tasks.filter(({ base }) => base.kind === 'choice');
const H = (p: number) => -p * Math.log(p) - (1 - p) * Math.log(1 - p);
function close(actual: number, expected: number, digits = 10) {
  expect(actual).toBeCloseTo(expected, digits);
}
function answer(puzzle: VariantPuzzle): number {
  expect(typeof puzzle.answer).toBe('number');
  return puzzle.answer as number;
}
function verify(v: VariantPuzzle) {
  const p = v.variant.parameters,
    actual = answer(v);
  switch (v.id) {
    case 'foundations-mission-1':
      close(actual, (p.a * p.x + p.b) ** 2);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      break;
    case 'foundations-mission-2': {
      const masses = [p.a, p.b, p.c].map((w) => w / (p.a + p.b + p.c));
      close(
        masses.reduce((x, y) => x + y, 0),
        1,
      );
      close(actual, masses[2]);
      break;
    }
    case 'differential-mission-1': {
      const h = 1e-5,
        L = (mu: number) => (mu - p.a) ** 2;
      close(actual, (L(p.mu + h) - L(p.mu - h)) / (2 * h), 5);
      break;
    }
    case 'differential-mission-2': {
      const h = 1e-5,
        L = (mu: number) => (mu - p.a) ** 2;
      const gradient = (L(p.mu + h) - L(p.mu - h)) / (2 * h);
      close(actual, p.mu - p.eta * gradient, 5);
      expect(L(actual)).toBeLessThan(L(p.mu));
      expect(Math.abs(1 - 2 * p.eta)).toBeLessThan(1);
      break;
    }
    case 'integral-mission-1': {
      expect(p.start).toBeGreaterThanOrEqual(0);
      expect(p.end).toBeGreaterThan(p.start);
      expect(p.end).toBeLessThanOrEqual(p.length);
      const mass = (p.end - p.start) / p.length;
      close(actual, mass);
      close(p.length * (1 / p.length), 1);
      break;
    }
    case 'integral-mission-2':
      close(actual * p.length * p.scale, 1);
      expect(actual).toBeGreaterThan(0);
      break;
    case 'linear-mission-1': {
      const first = [p.a, p.b, 1 - p.a - p.b],
        second = [p.c, p.d, 1 - p.c - p.d];
      for (const column of [first, second]) {
        expect(column.every((x) => x >= 0)).toBe(true);
        close(
          column.reduce((x, y) => x + y, 0),
          1,
        );
      }
      const predicted = first.map((x, i) => x * p.rho + second[i] * (1 - p.rho));
      close(
        predicted.reduce((x, y) => x + y, 0),
        1,
      );
      close(actual, predicted[1]);
      break;
    }
    case 'linear-mission-3':
      expect(p.v1).toBeGreaterThan(0);
      expect(p.v2).toBeGreaterThan(0);
      close(actual * p.v1, 1);
      break;
    case 'probability-mission-1': {
      const table = [
        p.prior * p.sensitivity,
        p.prior * (1 - p.sensitivity),
        (1 - p.prior) * p.falsePositive,
        (1 - p.prior) * (1 - p.falsePositive),
      ];
      expect(table.every((x) => x > 0)).toBe(true);
      close(
        table.reduce((x, y) => x + y, 0),
        1,
      );
      close(actual * (table[0] + table[2]), table[0]);
      break;
    }
    case 'probability-mission-2': {
      const marginal = p.prior * p.high + (1 - p.prior) * p.low;
      // Independent conditional sensors retain covariance from their common cause.
      close(actual - marginal ** 2, p.prior * (1 - p.prior) * (p.high - p.low) ** 2);
      expect(actual).toBeGreaterThan(marginal ** 2);
      break;
    }
    case 'statistics-mission-1': {
      expect(Number.isInteger(p.n) && Number.isInteger(p.k)).toBe(true);
      expect(p.k).toBeGreaterThan(0);
      expect(p.k).toBeLessThan(p.n);
      const logL = (theta: number) => p.k * Math.log(theta) + (p.n - p.k) * Math.log1p(-theta);
      const perturbation = 0.001;
      expect(logL(actual)).toBeGreaterThan(logL(actual - perturbation));
      expect(logL(actual)).toBeGreaterThan(logL(actual + perturbation));
      close(actual * p.n, p.k);
      break;
    }
    case 'statistics-mission-2':
      close(actual ** 2, p.sigma ** 2 / p.n);
      expect(p.n).toBeGreaterThan(1);
      break;
    case 'multivariate-mission-1': {
      const L = (x: number, y: number) => (x - p.a) ** 2 + p.c * (y + p.b) ** 2;
      const exact = L(p.dx, p.dy) - L(0, 0);
      // The second-order remainder checks that the first-order answer is NOT the exact change.
      close(exact - actual, p.dx ** 2 + p.c * p.dy ** 2);
      expect(exact).not.toBe(actual);
      break;
    }
    case 'multivariate-mission-2':
      expect(p.h1).toBeGreaterThan(0);
      expect(p.h2).toBeGreaterThan(0);
      close(actual * p.h2, 1);
      break;
    case 'information-mission-1': {
      const cross = -p.q * Math.log(p.p) - (1 - p.q) * Math.log(1 - p.p);
      close(actual, cross - H(p.q));
      expect(actual).toBeGreaterThanOrEqual(0);
      break;
    }
    case 'dynamics-mission-1':
      close((actual - p.x) / p.dt, -p.k * p.x);
      expect(Math.abs(1 - p.k * p.dt)).toBeLessThan(1);
      break;
    case 'dynamics-mission-2':
      close(actual ** 2, p.sigma ** 2 * p.dt);
      expect(p.dt).toBeGreaterThan(0);
      break;
    case 'dynamics-mission-3':
      close(-2 * p.k * actual + 2 * p.D, 0);
      expect(p.k).toBeGreaterThan(0);
      expect(p.D).toBeGreaterThan(0);
      break;
    case 'bayesian-mission-1': {
      const posteriorOdds = actual / (1 - actual),
        priorOdds = p.prior / (1 - p.prior);
      close(posteriorOdds / priorOdds, p.sensitivity / p.falsePositive);
      expect(actual).toBeLessThan(0.5);
      expect(actual).toBeGreaterThan(p.prior);
      break;
    }
    case 'bayesian-mission-2': {
      const alphaPost = p.alpha + p.success,
        betaPost = p.beta + p.failure;
      close(actual * (alphaPost + betaPost), alphaPost);
      expect(p.alpha > 0 && p.beta > 0).toBe(true);
      break;
    }
    case 'bayesian-mission-3': {
      // Derivative of the quadratic negative log posterior must vanish at its fused mean.
      close((actual - p.mu) / p.priorVariance + (actual - p.y) / p.sensorVariance, 0);
      expect(actual).toBeGreaterThan(p.mu);
      expect(actual).toBeLessThan(p.y);
      break;
    }
    case 'variational-mission-1': {
      const evidence = p.joint1 + p.joint2;
      expect(evidence).toBeGreaterThan(0);
      expect(evidence).toBeLessThanOrEqual(1);
      const F =
        actual * Math.log(actual / p.joint1) + (1 - actual) * Math.log((1 - actual) / p.joint2);
      close(F, -Math.log(evidence));
      break;
    }
    case 'variational-mission-2': {
      const F =
        p.q * Math.log(p.q / (p.evidence * p.p)) +
        (1 - p.q) * Math.log((1 - p.q) / (p.evidence * (1 - p.p)));
      close(actual, F + Math.log(p.evidence));
      expect(actual).toBeGreaterThanOrEqual(0);
      break;
    }
    case 'generative-mission-1':
      close(actual / (1 - actual), (p.a / p.b) * (p.prior / (1 - p.prior)));
      break;
    case 'generative-mission-2': {
      const q1 = p.a * p.prior + p.b * (1 - p.prior),
        q2 = (1 - p.a) * p.prior + (1 - p.b) * (1 - p.prior);
      close(actual, q1);
      close(q1 + q2, 1);
      break;
    }
    case 'generative-mission-3': {
      const cases = [
        { x: 0, y: 0, mass: (1 - p.px) * (1 - p.py) },
        { x: 1, y: 0, mass: p.px * (1 - p.py) },
        { x: 0, y: 1, mass: (1 - p.px) * p.py },
        { x: 1, y: 1, mass: p.px * p.py },
      ];
      const selected = cases.filter((c) => c.x || c.y),
        total = selected.reduce((sum, c) => sum + c.mass, 0);
      close(actual, selected.filter((c) => c.x).reduce((sum, c) => sum + c.mass, 0) / total);
      expect(actual).toBeGreaterThan(p.px);
      break;
    }
    case 'decision-mission-1': {
      const risk = p.rho * Math.log(p.rho / 0.5) + (1 - p.rho) * Math.log((1 - p.rho) / 0.5);
      const GA = risk,
        GB = risk + H(p.rho);
      close(actual, GB - GA);
      expect(risk).toBeGreaterThan(0);
      break;
    }
    case 'decision-mission-2': {
      const weights = [
        Math.exp(-p.gamma * p.firstG),
        Math.exp(-p.gamma * (p.firstG + Math.log(p.ratio))),
      ];
      close(actual, weights[0] / (weights[0] + weights[1]));
      close(actual / (1 - actual), p.ratio ** p.gamma);
      break;
    }
    case 'active-mission-1':
      close(actual / (1 - actual), (p.a / p.b) * (p.prior / (1 - p.prior)));
      break;
    case 'active-mission-2':
      close(actual * (p.a + p.b + 1), p.a + 1);
      expect(p.a > 0 && p.b > 0).toBe(true);
      break;
    default:
      throw new Error(`Missing independent audit for ${v.id}`);
  }
}

describe('mathematical numerical variants', () => {
  it('covers all 30 numerical missions and all 14 worlds', () => {
    expect(numerical).toHaveLength(30);
    expect(new Set(numerical.map((item) => item.world)).size).toBe(14);
    expect(NUMERIC_VARIANT_IDS.slice().sort()).toEqual(
      numerical.map((item) => item.base.id).sort(),
    );
  });
  for (const { world, base } of numerical) {
    it(`audits ${base.id} over 50 deterministic cases`, () => {
      const setups = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const v = makeVariant(world, base, seed);
        expect(v.id).toBe(base.id);
        expect(v.kind).toBe('numeric');
        expect(v.variant.newCase).toBe(true);
        expect(v.variant.mode).toBe('numeric-case');
        expect(v.setup).not.toBe(base.setup);
        expect(v.solution.length).toBeGreaterThan(30);
        expect(Number.isFinite(v.answer)).toBe(true);
        expect(v.tolerance ?? 0.001).toBeGreaterThan(0);
        verify(v);
        setups.add(v.setup);
      }
      expect(setups.size).toBeGreaterThan(4);
    });
  }
  it('does not mutate the source and uses stable seeds', () => {
    for (const { world, base } of tasks) {
      const snapshot = JSON.stringify(base);
      const first = makeVariant(world, base, 3497),
        second = makeVariant(world, base, 3497);
      expect(first).toEqual(second);
      expect(JSON.stringify(base)).toBe(snapshot);
      expect(first).not.toBe(base);
    }
  });
  it('accepts large/negative seeds deterministically and handles nonfinite seeds safely', () => {
    const { world, base } = numerical[0];
    for (const seed of [-10, 0, 1, Date.UTC(2026, 9, 3), Number.MAX_SAFE_INTEGER]) {
      expect(makeVariant(world, base, seed)).toEqual(makeVariant(world, base, seed));
      verify(makeVariant(world, base, seed));
    }
    expect(makeVariant(world, base, NaN)).toEqual(makeVariant(world, base, 0));
    expect(makeVariant(world, base, Infinity)).toEqual(makeVariant(world, base, 0));
  });
});

describe('choice variants and explicit repetitions', () => {
  it('reorders all 12 choices while preserving the correct semantic answer', () => {
    expect(choices).toHaveLength(12);
    for (const { world, base } of choices) {
      for (let seed = 0; seed < 20; seed++) {
        const v = makeVariant(world, base, seed);
        expect(v.variant.mode).toBe('choice-order');
        expect(v.variant.newCase).toBe(false);
        expect(v.choices!.slice().sort()).toEqual(base.choices!.slice().sort());
        expect(v.choices).not.toEqual(base.choices);
        expect(v.choices![v.answer as number]).toBe(base.choices![base.answer as number]);
        expect(v.setup).toBe(base.setup);
        expect(v.solution).toBe(base.solution);
      }
    }
  });
  it('labels unknown templates and mismatched worlds as repetitions instead of inventing math', () => {
    const { world, base } = numerical[0];
    const unknown: Puzzle = { ...base, id: `${world}-mission-99` };
    const repeated = makeVariant(world, unknown, 10);
    expect(repeated.answer).toBe(unknown.answer);
    expect(variantInfo(repeated)?.mode).toBe('repeat');
    expect(makeVariant('active' as WorldId, base, 10).variant.newCase).toBe(false);
  });
});

describe('formula rendering', () => {
  it('parses every numerical template as valid LaTeX without hidden display errors', async () => {
    const { default: katex } = await import('katex');
    for (const { world, base } of numerical) {
      for (let seed = 0; seed < 10; seed++) {
        const v = makeVariant(world, base, seed);
        expect(() =>
          katex.renderToString(v.formula, { throwOnError: true, trust: false, strict: 'error' }),
        ).not.toThrow();
      }
    }
  });
});
