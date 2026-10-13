import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Beats } from '../src/engine/hooks';
import type { ChallengeApi } from '../src/game/level/types';
import * as C1 from '../src/content/w09/c1-papel';
import * as C2 from '../src/content/w09/c2-horario';
import * as C3 from '../src/content/w09/c3-paso';
import {
  det2,
  distance,
  eigen2,
  euler,
  linearExact,
  logisticStep,
  nearComponents,
  oscillator,
  polynomial,
  q6,
  q10,
  q26,
} from '../src/content/w09/kit';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let host: HTMLDivElement;
async function mount(content: ReactNode) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(content));
}
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  host?.remove();
  root = undefined;
});
const beats: Beats = {
  beat: 1,
  p: 1,
  count: 6,
  at: () => 1,
  between: () => 1,
  next: () => {},
  prev: () => {},
  goto: () => {},
  animating: false,
};
async function drag(index: number, x: number, y: number) {
  const svg = host.querySelector('svg')!;
  Object.assign(svg, {
    createSVGPoint: () => ({
      x: 0,
      y: 0,
      matrixTransform() {
        return { x: this.x, y: this.y };
      },
    }),
    getScreenCTM: () => ({ inverse: () => ({}) }),
  });
  await act(async () =>
    host
      .querySelectorAll('.knob')
      [
        index
      ].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y })),
  );
  await act(async () =>
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: x, clientY: y })),
  );
}
async function enter(value: number) {
  const input = host.querySelector('input')!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setter.call(input, String(value).replace('.', ','));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function confirm() {
  await act(async () =>
    [...host.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Confirmar'))!
      .click(),
  );
}
const practice = (module: typeof C1 | typeof C2 | typeof C3) => {
  const step = module.level.steps.find((s) => s.kind === 'challenge');
  if (!step || step.kind !== 'challenge') throw new Error('Missing practice');
  return step.Comp;
};
function api() {
  return { prompt: vi.fn(), hints: vi.fn(), result: vi.fn(), sfx: {} } as unknown as ChallengeApi;
}

describe('W09: exact banks and closed solutions', () => {
  it('Euler preserves every specified node and the common horizon', () => {
    expect(euler((_t, y) => y, 0, 1, 0.5, 2)).toEqual([
      [0, 1],
      [0.5, 1.5],
      [1, 2.25],
    ]);
    expect(euler((_t, y) => y, 0, 1, 0.25, 4).map((p) => p[1])).toEqual([
      1,
      5 / 4,
      25 / 16,
      125 / 64,
      625 / 256,
    ]);
    expect(euler((_t, y) => y, 0, 4, 1 / 8, 8).at(-1)).toEqual([1, 43046721 / 4194304]);
    expect(() => euler((_t, y) => y, 0, 1, 0, 1)).toThrow();
  });
  it('matrix exponential covers diagonal, symmetric, rotating and repeated-root families', () => {
    expect(
      linearExact(
        [
          [1, 0],
          [0, -2],
        ],
        [2, 4],
        Math.log(2),
      )[0],
    ).toBeCloseTo(4, 12);
    expect(
      nearComponents(
        linearExact(
          [
            [-2, 1],
            [1, -2],
          ],
          [2, 0],
          Math.log(2),
        ),
        [5 / 8, 3 / 8],
        1e-12,
      ),
    ).toBe(true);
    expect(
      nearComponents(
        linearExact(
          [
            [0, -2],
            [2, 0],
          ],
          [1, 0],
          Math.PI / 4,
        ),
        [0, 1],
        1e-12,
      ),
    ).toBe(true);
    expect(
      linearExact(
        [
          [-5, 1],
          [0, -5],
        ],
        [0, 1],
        1,
      ),
    ).toEqual([Math.exp(-5), Math.exp(-5)]);
    expect(
      eigen2([
        [1, -2],
        [2, 1],
      ]),
    ).toEqual([
      { re: 1, im: 2 },
      { re: 1, im: -2 },
    ]);
    expect(
      det2([
        [1, 0],
        [0, -2],
      ]),
    ).toBe(-2);
  });
  it('oscillator agrees with all three closed forms and their initial conditions', () => {
    for (const [c, q] of [
      [6, q6],
      [10, q10],
      [26, q26],
    ] as const) {
      expect(oscillator(c, 1, 0, 0)).toEqual([1, 0]);
      for (const t of [Math.PI / 4, 0.5, 1, 2])
        expect(oscillator(c, 1, 0, t)[0]).toBeCloseTo(q(t), 11);
    }
  });
  it('logistic diagnostic reproduces the unrounded separation at update ten', () => {
    let x = 1 / 5,
      z = 2001 / 10000;
    for (let n = 0; n < 10; n++) {
      x = logisticStep(4, x);
      z = logisticStep(4, z);
    }
    expect(x).toBeLessThan(0.2);
    expect(z).toBeGreaterThan(0.2);
    expect(distance([x, 0], [z, 0])).toBeCloseTo(0.101341, 6);
    for (const x0 of [1 / 8, 1 / 2, 7 / 8])
      expect(logisticStep(4, logisticStep(4, x0))).toBe(x0 === 1 / 2 ? 0 : 63 / 64);
  });
  it('formats coefficients without unit coefficients, zero terms or double signs', () => {
    expect(
      polynomial([
        [1, 't'],
        [0, ''],
        [-1, 'y'],
        [2.5, ''],
      ]),
    ).toBe('t-y+2{,}5');
  });
});
describe('W09: reachable interaction gates', () => {
  it('paper requires both the time and slope; waiting does not unlock it', async () => {
    const unlock = vi.fn(),
      Scene = C1.lesson.Scene;
    await mount(createElement(Scene, { beats, reduced: true, unlock, answer: null }));
    expect(unlock).not.toHaveBeenCalled();
    await drag(0, 540, 760);
    expect(unlock).not.toHaveBeenCalled();
    await drag(1, 1250, 465);
    expect(unlock).toHaveBeenCalled();
  });
  it('exponential requires the half-height marker and the matching clock', async () => {
    const unlock = vi.fn(),
      Scene = C2.lesson.Scene;
    await mount(createElement(Scene, { beats, reduced: true, unlock, answer: null }));
    await drag(1, 1070 + Math.log(2) * 360, 500);
    expect(unlock).not.toHaveBeenCalled();
    await drag(0, 885, 430);
    expect(unlock).toHaveBeenCalled();
  });
  it('Euler requires the quarter-hour step and final cursor', async () => {
    const unlock = vi.fn(),
      Scene = C3.lesson.Scene;
    await mount(createElement(Scene, { beats, reduced: true, unlock, answer: null }));
    await drag(1, 1430, 470);
    expect(unlock).not.toHaveBeenCalled();
    await drag(0, 180 + 720 / 1.1, 760);
    expect(unlock).toHaveBeenCalled();
  });
});
describe('W09: practice evaluation', () => {
  // Fixed regression answers, checked from the displayed bank data, independent of its generator.
  const fixtures = [
    {
      module: C1,
      seeds: [1, 7, 42, 1234],
      answers: [
        [8, 7, 2],
        [6, 4, 1],
        [1, 6, 3],
        [2, 7, 2],
      ],
    },
    {
      module: C2,
      seeds: [2, 8, 43],
      answers: [
        [1, 4, 4],
        [4, 2, 4],
        [0.5, 1, 4],
      ],
    },
    {
      module: C3,
      seeds: [3, 9, 44],
      answers: [
        [2, 18, 9],
        [1.5, 18, 9],
        [6, 18, 4.5],
      ],
    },
  ];
  for (const fixture of fixtures)
    for (const [i, seed] of fixture.seeds.entries())
      for (const round of [0, 1, 2]) {
        it(`${fixture.module.level.id}, seed ${seed}, round ${round}`, async () => {
          const Comp = practice(fixture.module),
            testApi = api(),
            expected = fixture.answers[i][round];
          await mount(createElement(Comp, { seed, round, rounds: 3, reduced: true, api: testApi }));
          if (fixture.module === C1 && round === 2) {
            const option = [...host.querySelectorAll('button')].find((b) =>
              b.textContent?.includes(`${expected}+t2`),
            );
            expect(option).toBeTruthy();
            await act(async () => option!.click());
          } else {
            if (fixture.module === C3 && round === 2)
              await act(async () =>
                host.querySelectorAll<HTMLButtonElement>('.stage-choices button')[1].click(),
              );
            await enter(expected);
          }
          await confirm();
          expect(testApi.result).toHaveBeenLastCalledWith(true, expect.any(String));
        });
      }
  it('separates a marked level from its slope and enforces the specified tolerance', async () => {
    const Comp = practice(C1),
      testApi = api();
    await mount(
      createElement(Comp, { seed: 42, round: 0, rounds: 3, reduced: true, api: testApi }),
    );
    await enter(2);
    await confirm();
    expect(testApi.result).toHaveBeenLastCalledWith(
      false,
      expect.stringContaining('nivel marcado'),
    );
    await enter(1.006);
    await confirm();
    expect(testApi.result).toHaveBeenLastCalledWith(false, expect.any(String));
    await enter(1.005);
    await confirm();
    expect(testApi.result).toHaveBeenLastCalledWith(true, expect.any(String));
  });
  it('rejects a negative half-life with specific feedback', async () => {
    const Comp = practice(C2),
      testApi = api();
    await mount(
      createElement(Comp, { seed: 43, round: 1, rounds: 3, reduced: true, api: testApi }),
    );
    await enter(-1);
    await confirm();
    expect(testApi.result).toHaveBeenLastCalledWith(false, expect.stringContaining('positivo'));
  });
  it('rejects using the first slope again in the second Euler step', async () => {
    const Comp = practice(C3),
      testApi = api();
    await mount(createElement(Comp, { seed: 3, round: 1, rounds: 3, reduced: true, api: testApi }));
    await enter(16);
    await confirm();
    expect(testApi.result).toHaveBeenLastCalledWith(
      false,
      expect.stringContaining('pendiente inicial'),
    );
  });
});

describe('W09: stage formulas and lesson questions', () => {
  it('renders every lesson/demo beat before and after responding, without broken TeX', async () => {
    const modules = [C1, C2, C3];
    await mount(null);
    for (const module of modules) {
      const demo = module.level.steps.find((s) => s.kind === 'demo');
      if (!demo || demo.kind !== 'demo') throw new Error('Missing demo');
      for (const step of [module.lesson, demo])
        for (const [beat, data] of step.beats.entries()) {
          if (data.ask) {
            expect(data.ask.options).toHaveLength(3);
            expect(data.ask.explain).toBeTruthy();
          }
          for (const answer of [null, data.ask?.answer ?? 0]) {
            const progress: Beats = { ...beats, beat, at: (b) => (b <= beat ? 1 : 0) };
            await act(async () =>
              root!.render(
                createElement(step.Scene, {
                  beats: progress,
                  reduced: true,
                  unlock: () => {},
                  answer,
                }),
              ),
            );
            expect(
              host.querySelector('.katex-error'),
              `${module.level.id} / ${step.kind} / ${beat}`,
            ).toBeNull();
            const labels = [...host.querySelectorAll('.stage-html .tex')]
              .map((node) => node.textContent)
              .join('');
            expect(labels).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/);
          }
        }
    }
  }, 30_000);
});
