import { describe, expect, it } from 'vitest';
import {
  OBS_REPORT, beliefUpdate, bellmanStep, correct, optimalStep, policyValue, predict, q2, qBelief,
  signalProb, threshold, v1, voi,
} from '../src/content/w13/kit';

const near = (a: number, b: number, d = 3) => expect(a).toBeCloseTo(b, d);

// the numbers the World 13 script quotes
describe('mercado con estado oculto', () => {
  it('corrige con Bayes', () => {
    near(correct(0.2, true), 0.5);
    near(correct(0.5, true), 0.8);
    near(correct(0.5, false), 0.2);
  });
  it('predice con la transición', () => {
    near(predict(0.2, 'esperar'), 0.34);
    near(predict(0.2, 'calmar'), 0.1);
    let b = 0.2;
    for (let i = 0; i < 400; i++) b = predict(b, 'esperar');
    near(b, 2 / 3);
  });
  it('filtra', () => {
    near(signalProb(0.34), 0.404);
    near(beliefUpdate(0.2, 'esperar', true), 0.673);
    near(beliefUpdate(0.2, 'esperar', false), 0.114);
  });
  it('decide por umbral', () => {
    near(threshold(), 0.4);
    near(v1(0.3), -3);
    near(v1(0.7), -4);
    near(qBelief(0.25, 'esperar'), -2.5);
  });
  it('compara a dos etapas', () => {
    near(q2(0.2, 'esperar'), -4.066);
    near(q2(0.2, 'calmar'), -4.9);
  });
  it('valora la información', () => {
    near(signalProb(0.4, OBS_REPORT), 0.42);
    near(correct(0.4, true, OBS_REPORT), 6 / 7);
    near(voi(0.4), 1.92);
    near(voi(0.1), 0.18);
    near(voi(0.9), 0);
    near(voi(0.05), 0);
    near(voi(0.2414), 1, 2);
    near(voi(0.619), 1, 2);
  });
  it('itera Bellman', () => {
    const v = policyValue(['esperar', 'esperar']);
    near(v[1] - v[0], (bellmanStep(v, ['esperar', 'esperar'])[1] - bellmanStep(v, ['esperar', 'esperar'])[0]));
    let o: [number, number] = [0, 0];
    for (let k = 0; k < 400; k++) o = optimalStep(o);
    console.log(JSON.stringify({ nunca: policyValue(['esperar', 'esperar']), rumor: policyValue(['esperar', 'calmar']), siempre: policyValue(['calmar', 'calmar']), opt: o, v1: bellmanStep([0, 0], ['esperar', 'calmar']), v2: bellmanStep(bellmanStep([0, 0], ['esperar', 'calmar']), ['esperar', 'calmar']) }));
  });
});
