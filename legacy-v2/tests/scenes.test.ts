import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { models, initialParams, lossAfter } from '../src/components/scene/models';
import { bayes, entropy, gaussian, gaussianKL, joint, kl, lerp, softmax } from '../src/domain/math';
import type { Params, WorldId } from '../src/domain/types';
import lessons from '../src/content/lessons.json';
import chapters from '../src/content/chapters.json';
import media from '../src/content/media.json';

const targets: Record<WorldId, Params> = {
  foundations: { x: 0.5 },
  differential: { x: 1, h: 0.02 },
  integral: { n: 40, b: 1 },
  linear: { a: 1, b: 0.5 },
  probability: { column: 1, condition: 1 },
  statistics: { mu: 0, sigma: 0.5 },
  multivariate: { eta: 0.25, steps: 6 },
  information: { p: 0.5, q: 0.5 },
  dynamics: { k: 2, dt: 0.2 },
  bayesian: { prior: 0.01, sensitivity: 0.9, falsePositive: 0.1 },
  variational: { mu: 0.6, sigma: 0.7 },
  generative: { prior: 0.8, accuracy: 0.8 },
  decision: { accuracy: 0.95, gamma: 4 },
  active: { prior: 0.5, accuracy: 0.8, observation: 0 },
};
const ids = Object.keys(models) as WorldId[];
function formulas(value: unknown, field = ''): string[] {
  if (typeof value === 'string')
    return field === 'formula'
      ? [value]
      : [...value.matchAll(/\$([^$\n]+)\$/g)].map((match) => match[1]);
  if (Array.isArray(value)) return value.flatMap((item) => formulas(item));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => formulas(item, key));
  return [];
}

describe('reachable transfer fields', () => {
  it.each(ids)(
    '%s has a reachable target on its controls and does not pass at initialization',
    (id) => {
      const model = models[id];
      expect(model.check(initialParams(id))).toBe(false);
      for (const control of model.controls) {
        const value = targets[id][control.key];
        expect(value).toBeGreaterThanOrEqual(control.min);
        expect(value).toBeLessThanOrEqual(control.max);
        expect(
          Math.abs(
            (value - control.min) / control.step - Math.round((value - control.min) / control.step),
          ),
        ).toBeLessThan(1e-8);
      }
      expect(model.check(targets[id])).toBe(true);
    },
  );
  it.each(ids)('%s keeps readouts finite at every control corner', (id) => {
    const model = models[id];
    const count = 2 ** model.controls.length;
    for (let mask = 0; mask < count; mask++) {
      const p = Object.fromEntries(
        model.controls.map((control, index) => [
          control.key,
          mask & (1 << index) ? control.max : control.min,
        ]),
      );
      for (const output of model.readout(p))
        expect(Number.isFinite(output.value), `${id}: ${output.label}`).toBe(true);
    }
  });
  it('enforces the stated strict secant error rather than accepting the boundary', () => {
    expect(models.differential.check({ x: 1, h: 0.03 })).toBe(false);
    expect(models.differential.check({ x: 1, h: 0.02 })).toBe(true);
    expect(models.differential.readout({ x: 1, h: 0.02 })[0].value).toBeCloseTo(2.02, 10);
  });
  it('right-endpoint rectangles converge from above to the declared integral', () => {
    const errors = [2, 4, 8, 16, 32, 80].map((n) => {
      const values = models.integral.readout({ n, b: 1 });
      expect(values[1].value).toBeCloseTo(1 / 3, 12);
      expect(values[0].value - values[1].value).toBeCloseTo(values[2].value, 12);
      return values[2].value;
    });
    for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThan(errors[i - 1]);
    expect(errors.at(-1)).toBeLessThan(0.02);
  });
  it('distinguishes equality at a single input from equality of composed functions', () => {
    const atZero = models.foundations.readout({ x: 0 });
    expect(atZero[0].value).toBe(atZero[1].value);
    const atHalf = models.foundations.readout({ x: 0.5 });
    expect(atHalf[0].value).toBe(4);
    expect(atHalf[1].value).toBe(1.5);
  });
});

describe('probability, density and information invariants', () => {
  it('uses the same joint table as the geometry and media, and conserves mass throughout interpolation', () => {
    expect(joint).toEqual([0.1, 0.4, 0.2, 0.3]);
    for (const column of [0, 1]) {
      const marginal = column === 0 ? 0.3 : 0.7;
      const conditional = joint.map((value, index) =>
        index % 2 === column ? value / marginal : 0,
      );
      expect(conditional.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
      for (const progress of [0, 0.25, 0.5, 1])
        expect(
          joint
            .map((value, index) => lerp(value, conditional[index], progress))
            .reduce((sum, value) => sum + value, 0),
        ).toBeCloseTo(1, 12);
    }
    expect(models.probability.readout({ column: 1, condition: 1 })[1].value).toBeCloseTo(4 / 7, 12);
  });
  it('Bayes normalizes both joint routes and separates sensitivity from posterior', () => {
    const { prior, sensitivity, falsePositive } = targets.bayesian;
    const positiveH = prior * sensitivity;
    const positiveOther = (1 - prior) * falsePositive;
    const posterior = bayes(prior, sensitivity, falsePositive);
    expect(posterior).toBeCloseTo(positiveH / (positiveH + positiveOther), 12);
    expect(posterior).toBeCloseTo(1 / 12, 12);
    expect(posterior).not.toBeCloseTo(sensitivity, 1);
    expect(posterior / (1 - posterior)).toBeCloseTo(
      (prior / (1 - prior)) * (sensitivity / falsePositive),
      12,
    );
  });
  it('sequential independent readings add log likelihood ratios', () => {
    let belief = 0.5;
    for (let i = 0; i < 3; i++) belief = bayes(belief, 0.8, 0.2);
    expect(belief).toBeCloseTo(64 / 65, 12);
    const contradicting = bayes(belief, 0.2, 0.8);
    expect(contradicting).toBeCloseTo(16 / 17, 12);
  });
  it('prediction with B and correction with A use column-vector orientation', () => {
    const prior = 0.8,
      a = 0.8;
    const predicted = 0.9 * prior + 0.2 * (1 - prior);
    const evidence = a * predicted + (1 - a) * (1 - predicted);
    const output = models.generative.readout({ prior, accuracy: a });
    expect(predicted).toBeCloseTo(0.76, 12);
    expect(output[0].value).toBeCloseTo(predicted, 12);
    expect(output[1].value).toBeCloseTo(evidence, 12);
    expect(output[2].value).toBeCloseTo((a * predicted) / evidence, 12);
    expect(output[2].value).toBeCloseTo(38 / 41, 12);
  });
  it('a Gaussian integrates to one even when its peak is greater than one', () => {
    const step = 0.002;
    for (const [mu, sigma] of [
      [0, 0.25],
      [2, 1.8],
      [-1.5, 0.7],
    ]) {
      let area = 0;
      for (let i = 0; i < 16000; i++) area += gaussian(-16 + (i + 0.5) * step, mu, sigma) * step;
      expect(area).toBeCloseTo(1, 8);
    }
    expect(gaussian(0, 0, 0.25)).toBeGreaterThan(1);
    const output = models.statistics.readout({ mu: 0, sigma: 0.5 });
    expect(output[0].value).toBe(0.25);
    expect(output[1].value).toBe(4);
  });
  it('entropy has the correct endpoints, maximum and information unit', () => {
    expect(entropy(0)).toBe(0);
    expect(entropy(1)).toBe(0);
    expect(entropy(0.5)).toBeCloseTo(Math.log(2), 14);
    for (let i = 1; i < 100; i++) {
      const p = i / 100;
      expect(entropy(p)).toBeGreaterThanOrEqual(0);
      expect(entropy(p)).toBeLessThanOrEqual(Math.log(2));
      expect(entropy(p)).toBeCloseTo(entropy(1 - p), 12);
    }
  });
  it('KL is directed and handles zero-mass support cases correctly', () => {
    expect(kl(0, 0)).toBe(0);
    expect(kl(1, 1)).toBe(0);
    expect(kl(0.5, 0)).toBe(Infinity);
    expect(kl(0.5, 1)).toBe(Infinity);
    expect(kl(0, 0.5)).toBeCloseTo(Math.log(2), 14);
    expect(kl(0.2, 0.7)).not.toBeCloseTo(kl(0.7, 0.2), 5);
    for (let i = 1; i < 100; i++)
      for (const q of [0.01, 0.2, 0.5, 0.8, 0.99]) {
        const value = kl(i / 100, q);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(-1e-14);
      }
  });
  it('Arena expected information is nonnegative and bounded by prior entropy', () => {
    const accuracy = 0.8;
    for (const belief of [0, 0.01, 0.2, 0.5, 0.8, 0.99, 1]) {
      const positive = accuracy * belief + (1 - accuracy) * (1 - belief);
      const remaining = (1 - accuracy) * belief + accuracy * (1 - belief);
      const expectedPosteriorEntropy =
        positive * entropy(bayes(belief, accuracy, 1 - accuracy)) +
        remaining * entropy(bayes(belief, 1 - accuracy, accuracy));
      const information = entropy(belief) - expectedPosteriorEntropy;
      expect(information).toBeGreaterThanOrEqual(-1e-14);
      expect(information).toBeLessThanOrEqual(entropy(belief) + 1e-14);
      if (belief === 0.5) expect(information).toBeCloseTo(Math.log(2) - entropy(0.8), 12);
    }
  });
});

describe('F, G and numerical stability', () => {
  it('Gaussian KL is the F gap and vanishes at the stated posterior', () => {
    expect(gaussianKL(0.6, 0.7)).toBeCloseTo(0, 14);
    expect(gaussianKL(0.6, 1.4)).toBeCloseTo(1.5 - Math.log(2), 12);
    expect(gaussianKL(1.3, 0.7)).toBeCloseTo(0.5, 12);
    const values = models.variational.readout(targets.variational);
    expect(values[0].value).toBe(0);
    expect(values[1].value).toBeCloseTo(1.2, 14);
  });
  it('risk plus ambiguity equals preference cost minus information in the declared symmetric model', () => {
    for (const accuracy of [0.5, 0.6, 0.8, 0.95, 0.99]) {
      const risk = kl(0.5, 0.5),
        ambiguity = entropy(accuracy);
      const information = Math.log(2) - ambiguity,
        preferenceCost = -Math.log(0.5);
      expect(risk + ambiguity).toBeCloseTo(preferenceCost - information, 14);
      const readout = models.decision.readout({ accuracy, gamma: 1 });
      expect(readout[0].value).toBeCloseTo(information, 14);
      expect(readout[1].value).toBeCloseTo(ambiguity, 14);
    }
  });
  it('uninformative channels remain uninformative even at high policy precision', () => {
    for (const gamma of [0.1, 1, 4, 8])
      expect(models.decision.readout({ accuracy: 0.5, gamma })[2].value).toBeCloseTo(0.5, 14);
  });
  it('gamma is inverse temperature and the policy odds reflect gamma times information', () => {
    const accuracy = 0.8;
    let previous = 0.5;
    for (const gamma of [0.1, 1, 4, 8]) {
      const probability = models.decision.readout({ accuracy, gamma })[2].value;
      expect(probability).toBeGreaterThan(previous);
      expect(Math.log(probability / (1 - probability))).toBeCloseTo(
        gamma * (Math.log(2) - entropy(accuracy)),
        12,
      );
      previous = probability;
    }
  });
  it('softmax is normalized, translation invariant and stable for large finite logits', () => {
    const original = softmax([-2, 0, 3]),
      shifted = softmax([998, 1000, 1003]);
    expect(shifted.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 14);
    original.forEach((value, index) => expect(shifted[index]).toBeCloseTo(value, 14));
    expect(softmax([10000, -10000])).toEqual([1, 0]);
  });
  it('gradient steps converge below eta=0.5 and fail at or above the stability boundary', () => {
    expect(lossAfter({ eta: 0.25, steps: 0 })).toBe(8.5);
    let previous = Infinity;
    for (let steps = 0; steps < 10; steps++) {
      const current = lossAfter({ eta: 0.25, steps });
      expect(current).toBeLessThan(previous);
      previous = current;
    }
    expect(lossAfter({ eta: 0.5, steps: 15 })).toBe(4.5);
    expect(lossAfter({ eta: 0.55, steps: 15 })).toBeGreaterThan(8.5);
    expect(models.multivariate.check({ eta: 0.5, steps: 15 })).toBe(false);
  });
  it('Euler contraction agrees with the continuous equilibrium but has its own stability limit', () => {
    expect(models.dynamics.check({ k: 2, dt: 0.2 })).toBe(true);
    expect(models.dynamics.check({ k: 2, dt: 1 })).toBe(false);
    expect(models.dynamics.check({ k: 2, dt: 1.1 })).toBe(false);
    expect(models.dynamics.readout({ k: 2, dt: 1.1 })[0].value).toBeCloseTo(-1.2, 12);
  });
});

describe('renderable mathematical content', () => {
  it('renders every formula in 70 lessons, 70 stages, 42 missions and all media captions', () => {
    expect(lessons).toHaveLength(70);
    expect(Object.values(chapters).flatMap((chapter) => chapter.teachingStages)).toHaveLength(70);
    expect(Object.values(chapters).flatMap((chapter) => chapter.missions)).toHaveLength(42);
    const values = [...formulas(lessons), ...formulas(chapters), ...formulas(media)];
    expect(values.length).toBeGreaterThanOrEqual(636);
    for (const tex of values) {
      expect(tex).not.toMatch(/\\prime\^\{\\prime/);
      expect(() =>
        katex.renderToString(tex, { throwOnError: true, strict: 'ignore', trust: false }),
      ).not.toThrow();
    }
  });
  it.each(ids)('renders the current and successful dynamic formulas for %s', (id) => {
    for (const p of [initialParams(id), targets[id]])
      expect(() =>
        katex.renderToString(models[id].formula(p), {
          throwOnError: true,
          strict: 'ignore',
          trust: false,
        }),
      ).not.toThrow();
  });
});
