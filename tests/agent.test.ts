// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import {
  policies,
  preferences,
  predictPolicy,
  selectPolicy,
  updateAgent,
  type Policy,
} from '../src/domain/agent';
import { AgentLoop } from '../src/components/game/AgentLoop';

// Enumerate the four joint events independently of the binary helper formulas.
// Observation rows and state columns have the same ordering: left, right.
function enumerate(belief: number, policy: Policy) {
  const B = [
    [policy.leftGivenLeft, policy.leftGivenRight],
    [1 - policy.leftGivenLeft, 1 - policy.leftGivenRight],
  ];
  const A = [
    [policy.accuracy, 1 - policy.accuracy],
    [1 - policy.accuracy, policy.accuracy],
  ];
  const prior = [belief, 1 - belief];
  const states = B.map((row) => row.reduce((sum, value, index) => sum + value * prior[index], 0));
  const joint = A.map((row) => row.map((value, state) => value * states[state]));
  const observations = joint.map((row) => row.reduce((sum, value) => sum + value, 0));
  const H = (probabilities: number[]) =>
    -probabilities.reduce((sum, p) => sum + (p === 0 ? 0 : p * Math.log(p)), 0);
  const risk = observations.reduce((sum, p, i) => sum + p * Math.log(p / preferences[i]), 0);
  const ambiguity = states.reduce((sum, p, s) => sum + p * H(A.map((row) => row[s])), 0);
  const information = joint.reduce(
    (sum, row, o) =>
      sum +
      row.reduce(
        (inner, p, s) => inner + (p === 0 ? 0 : p * Math.log(p / (observations[o] * states[s]))),
        0,
      ),
    0,
  );
  const crossEntropy = -observations.reduce((sum, p, i) => sum + p * Math.log(preferences[i]), 0);
  return { B, A, states, observations, joint, risk, ambiguity, information, crossEntropy, H };
}

describe('the declared one-step discrete agent', () => {
  it('uses normalized, positive preferences on observations', () => {
    expect(preferences).toEqual([0.8, 0.2]);
    expect(preferences.every((p) => p > 0)).toBe(true);
    expect(preferences.reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 14);
  });

  it.each(policies)('$id has column-stochastic transitions and likelihoods', (policy) => {
    const { B, A } = enumerate(0.5, policy);
    for (const matrix of [B, A])
      for (const column of [0, 1]) {
        expect(matrix.every((row) => row[column] >= 0 && row[column] <= 1)).toBe(true);
        expect(matrix[0][column] + matrix[1][column]).toBeCloseTo(1, 14);
      }
    expect(policy.accuracy).toBeGreaterThan(0.5);
    expect(policy.accuracy).toBeLessThan(1);
  });

  it.each(policies)(
    '$id agrees with exact joint marginalization and both G decompositions',
    (policy) => {
      for (const belief of [0, 0.01, 0.2, 0.5, 0.8, 0.99, 1]) {
        const exact = enumerate(belief, policy),
          p = predictPolicy(belief, policy);
        expect(exact.joint.flat().reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 14);
        expect(p.state).toBeCloseTo(exact.states[0], 14);
        expect(p.observation).toBeCloseTo(exact.observations[0], 14);
        expect(p.risk).toBeCloseTo(exact.risk, 13);
        expect(p.ambiguity).toBeCloseTo(exact.ambiguity, 13);
        expect(p.information).toBeCloseTo(exact.information, 13);
        expect(p.G).toBeCloseTo(exact.risk + exact.ambiguity, 13);
        expect(p.G).toBeCloseTo(exact.crossEntropy - exact.information, 13);
        expect(p.information).toBeCloseTo(exact.H(exact.observations) - exact.ambiguity, 13);
      }
    },
  );

  it.each(policies)(
    '$id remains finite and respects information bounds throughout the belief interval',
    (policy) => {
      for (let i = 0; i <= 1000; i++) {
        const p = predictPolicy(i / 1000, policy),
          exact = enumerate(i / 1000, policy);
        expect(Object.values(p).every(Number.isFinite)).toBe(true);
        expect(p.risk).toBeGreaterThanOrEqual(-1e-12);
        expect(p.G).toBeGreaterThanOrEqual(0);
        expect(p.information).toBeGreaterThanOrEqual(-1e-12);
        expect(p.information).toBeLessThanOrEqual(exact.H(exact.states) + 1e-12);
        expect(p.information).toBeLessThanOrEqual(exact.H(exact.observations) + 1e-12);
      }
    },
  );

  it('distinguishes future states from preferred observations when orienting', () => {
    const move = policies.find((policy) => policy.id === 'move')!;
    const p = predictPolicy(0.2, move);
    expect(p.state).toBeCloseTo(0.85 * 0.2 + 0.65 * 0.8, 14);
    expect(p.state).toBeCloseTo(0.69, 14);
    expect(p.observation).toBeCloseTo(0.65 * 0.69 + 0.35 * 0.31, 14);
    expect(p.observation).toBeCloseTo(0.557, 14);
    expect(p.risk).not.toBeCloseTo(0.69 * Math.log(0.69 / 0.8) + 0.31 * Math.log(0.31 / 0.2), 4);
  });

  it('a more reliable sensor carries more state information under the same prediction', () => {
    const stay = policies.find((policy) => policy.id === 'stay')!;
    const focus = policies.find((policy) => policy.id === 'focus')!;
    for (const belief of [0.01, 0.2, 0.5, 0.8, 0.99]) {
      expect(predictPolicy(belief, focus).state).toBe(predictPolicy(belief, stay).state);
      expect(predictPolicy(belief, focus).information).toBeGreaterThan(
        predictPolicy(belief, stay).information,
      );
    }
    expect(predictPolicy(0, focus).information).toBeCloseTo(0, 14);
    expect(predictPolicy(1, focus).information).toBeCloseTo(0, 14);
  });
});

describe('Bayesian perception after prediction', () => {
  it.each(policies)('$id normalizes both posteriors for both possible observations', (policy) => {
    for (const belief of [0, 0.01, 0.2, 0.5, 0.8, 0.99, 1]) {
      const exact = enumerate(belief, policy),
        predicted = predictPolicy(belief, policy);
      for (const observation of [0, 1] as const) {
        const left = updateAgent(predicted.state, policy.accuracy, observation);
        const right = exact.joint[observation][1] / exact.observations[observation];
        expect(Number.isFinite(left)).toBe(true);
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left).toBeLessThanOrEqual(1);
        expect(left).toBeCloseTo(exact.joint[observation][0] / exact.observations[observation], 13);
        expect(left + right).toBeCloseTo(1, 13);
      }
    }
  });

  it.each(policies)(
    '$id preserves the predicted belief in expectation and reduces entropy by IG',
    (policy) => {
      for (const belief of [0, 0.1, 0.5, 0.9, 1]) {
        const exact = enumerate(belief, policy),
          p = predictPolicy(belief, policy);
        const posterior = [0, 1].map((o) => updateAgent(p.state, policy.accuracy, o as 0 | 1));
        const mean = exact.observations.reduce(
          (sum, probability, o) => sum + probability * posterior[o],
          0,
        );
        const conditionalEntropy = exact.observations.reduce(
          (sum, probability, o) => sum + probability * exact.H([posterior[o], 1 - posterior[o]]),
          0,
        );
        expect(mean).toBeCloseTo(p.state, 13);
        expect(exact.H(exact.states) - conditionalEntropy).toBeCloseTo(p.information, 13);
      }
    },
  );

  it('corrects the predicted future belief rather than the previous belief', () => {
    const move = policies.find((policy) => policy.id === 'move')!;
    const prediction = predictPolicy(0.2, move).state;
    const left = updateAgent(prediction, move.accuracy, 0);
    const right = updateAgent(prediction, move.accuracy, 1);
    expect(left).toBeCloseTo(0.4485 / 0.557, 14);
    expect(right).toBeCloseTo(0.2415 / 0.443, 14);
    expect(left).toBeGreaterThan(prediction);
    expect(right).toBeLessThan(prediction);
    expect(left).not.toBeCloseTo(0.13 / 0.41, 4);
  });

  it('repeated independent readings multiply likelihood odds, without treating accuracy as the posterior', () => {
    let belief = 0.5;
    belief = updateAgent(belief, 0.95, 0);
    expect(belief).toBeCloseTo(0.95, 14);
    belief = updateAgent(belief, 0.95, 0);
    expect(belief).toBeCloseTo(361 / 362, 13);
    belief = updateAgent(belief, 0.95, 1);
    expect(belief).toBeCloseTo(0.95, 13);
    expect(updateAgent(0.2, 0.65, 0)).toBeCloseTo(13 / 41, 13);
  });
});

describe('prospective policy selection', () => {
  it.each([
    [0, 'move'],
    [0.1, 'move'],
    [0.2, 'move'],
    [0.3, 'focus'],
    [0.5, 'focus'],
    [0.8, 'focus'],
    [1, 'focus'],
  ] as const)('belief %s recommends %s by minimum G', (belief, expected) => {
    const selected = selectPolicy(belief);
    expect(selected.id).toBe(expected);
    const chosenG = predictPolicy(belief, selected).G;
    for (const policy of policies)
      expect(chosenG).toBeLessThanOrEqual(predictPolicy(belief, policy).G + 1e-12);
  });

  it('at the uniform initial belief focus wins through lower ambiguity, not by assuming the realized datum', () => {
    const stay = predictPolicy(0.5, policies.find((policy) => policy.id === 'stay')!);
    const focus = predictPolicy(0.5, policies.find((policy) => policy.id === 'focus')!);
    expect(stay.observation).toBeCloseTo(0.5, 14);
    expect(focus.observation).toBeCloseTo(0.5, 14);
    expect(stay.risk).toBeCloseTo(focus.risk, 14);
    expect(focus.ambiguity).toBeLessThan(stay.ambiguity);
    expect(focus.G).toBeCloseTo(0.42165879466008244, 12);
    expect(selectPolicy(0.5).id).toBe('focus');
  });

  it('when the state is known to be right, orienting beats information alone', () => {
    const focus = predictPolicy(0, policies.find((policy) => policy.id === 'focus')!);
    const move = predictPolicy(0, policies.find((policy) => policy.id === 'move')!);
    expect(focus.information).toBeCloseTo(0, 14);
    expect(move.risk).toBeLessThan(focus.risk);
    expect(move.G).toBeLessThan(focus.G);
    expect(selectPolicy(0).id).toBe('move');
  });

  it('does not reorder the declared policies while ranking them', () => {
    const order = policies.map((policy) => policy.id);
    selectPolicy(0);
    selectPolicy(0.5);
    selectPolicy(1);
    expect(policies.map((policy) => policy.id)).toEqual(order);
  });
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('the rendered perception-action loop', () => {
  it('logs prospective G before the datum, updates from that datum, and keeps state revelation observational', async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root!.render(createElement(AgentLoop)));
    expect(
      container.querySelectorAll('.katex-error'),
      container.querySelector('.katex-error')?.getAttribute('title') ?? '',
    ).toHaveLength(0);
    expect(container.querySelectorAll('.katex')).toHaveLength(1);
    const focusCard = Array.from(container.querySelectorAll('.policy-card')).find(
      (card) => card.querySelector('h3')?.textContent === 'Observar mejor',
    )!;
    expect(focusCard.classList.contains('recommended')).toBe(true);
    await act(async () => (focusCard.querySelector('button') as HTMLButtonElement).click());
    const cells = Array.from(container.querySelectorAll('tbody tr:first-child td')).map(
      (cell) => cell.textContent,
    );
    expect(cells).toHaveLength(6);
    expect(cells[3]).toBe('0.500');
    expect(cells[4]).toBe(cells[2] === 'izquierda' ? '0.950' : '0.050');
    expect(cells[5]).toBe('0.422');
    // An intervention that changes B must predict before conditioning on A.
    const priorBelief = cells[2] === 'izquierda' ? 0.95 : 0.05;
    const move = policies.find((policy) => policy.id === 'move')!;
    const exactMove = enumerate(priorBelief, move);
    const moveCard = Array.from(container.querySelectorAll('.policy-card')).find(
      (card) => card.querySelector('h3')?.textContent === 'Orientar a la izquierda',
    )!;
    await act(async () => (moveCard.querySelector('button') as HTMLButtonElement).click());
    const nextCells = Array.from(container.querySelectorAll('tbody tr:first-child td')).map(
      (cell) => cell.textContent,
    );
    const observation = nextCells[2] === 'izquierda' ? 0 : 1;
    expect(nextCells[3]).toBe(exactMove.states[0].toFixed(3));
    expect(nextCells[4]).toBe(
      (exactMove.joint[observation][0] / exactMove.observations[observation]).toFixed(3),
    );
    expect(nextCells[5]).toBe((exactMove.risk + exactMove.ambiguity).toFixed(3));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    const beliefBeforeReveal = container.querySelector('.agent-belief strong')!.textContent;
    await act(async () =>
      (container!.querySelector('input[type="checkbox"]') as HTMLInputElement).click(),
    );
    expect(container.querySelectorAll('tbody tr:first-child td')).toHaveLength(7);
    expect(container.querySelector('.agent-belief strong')!.textContent).toBe(beliefBeforeReveal);
    await act(async () =>
      (container!.querySelector('[aria-label="Reiniciar agente"]') as HTMLButtonElement).click(),
    );
    expect(container.querySelector('.agent-belief strong')!.textContent).toContain('0.500');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });
});
