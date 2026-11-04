import { dec } from '../shared/ui';

// ============================================================================
// Mundo 13 · La Bolsa · kit de decisión secuencial.
// ============================================================================

/** decimal with comma for text («0,20») */
export const fmt = (v: number, digits = 2) => dec(v, digits);
/** decimal with comma for TeX («0{,}20») */
export const tnum = (v: number, digits = 2) => fmt(v, digits).replace(',', '{,}');
/** expected value of an action: Σ P(s)·u(s) */
export const ev = (probs: number[], pays: number[]) =>
  probs.reduce((a, p, i) => a + p * pays[i], 0);
/** present value of a reward r received after t periods with discount γ */
export const discount = (r: number, g: number, t: number) => r * g ** t;
/** Kelly fraction for win probability p and net odds b */
export const kellyFrac = (p: number, b = 1) => p - (1 - p) / b;
/** expected log-growth per bet when staking a fraction f */
export const growth = (p: number, b: number, f: number) =>
  p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f);
/** success probability of the stopping rule that skips the first r − 1 of n */
export const stopSuccess = (n: number, r: number) => {
  if (r <= 1) return 1 / n;
  let s = 0;
  for (let i = r; i <= n; i++) s += 1 / (i - 1);
  return ((r - 1) / n) * s;
};

// ---------------------------------------------------------------- mercado con estado oculto (13.9 a 13.12)
// Dos estados: 0 = calma, 1 = rumor. Dos acciones: esperar o calmar (publicar un comunicado).
// b es siempre la creencia en rumor, P(s = rumor).
export type Act = 'esperar' | 'calmar';
export const GAMMA = 0.9;
/** T[a][s] = P(rumor mañana | s hoy, a) */
export const TRANS: Record<Act, [number, number]> = { esperar: [0.2, 0.9], calmar: [0.1, 0.1] };
/** R[a] = [r(calma, a), r(rumor, a)] */
export const REWARD: Record<Act, [number, number]> = { esperar: [0, -10], calmar: [-4, -4] };
/** P(volumen alto | calma), P(volumen alto | rumor) */
export const OBS_VOL: [number, number] = [0.2, 0.8];
/** P(informe positivo | calma), P(informe positivo | rumor) */
export const OBS_REPORT: [number, number] = [0.1, 0.9];
export const REPORT_COST = 1;

/** prediction step: belief in rumor tomorrow, before looking */
export const predict = (b: number, a: Act, T = TRANS) => (1 - b) * T[a][0] + b * T[a][1];
/** chance of a positive signal under belief b */
export const signalProb = (b: number, obs = OBS_VOL) => (1 - b) * obs[0] + b * obs[1];
/** correction step: Bayes on the belief after a signal */
export const correct = (b: number, positive: boolean, obs = OBS_VOL) => {
  const lr = positive ? [obs[0], obs[1]] : [1 - obs[0], 1 - obs[1]];
  return (b * lr[1]) / (b * lr[1] + (1 - b) * lr[0]);
};
/** the whole filter: predict with the action, then correct with what was seen */
export const beliefUpdate = (b: number, a: Act, positive: boolean, obs = OBS_VOL) =>
  correct(predict(b, a), positive, obs);
/** expected reward of an action under a belief */
export const qBelief = (b: number, a: Act, R = REWARD) => (1 - b) * R[a][0] + b * R[a][1];
/** best immediate value under a belief: the upper envelope of two lines */
export const v1 = (b: number, R = REWARD) =>
  Math.max(qBelief(b, 'esperar', R), qBelief(b, 'calmar', R));
/** belief at which waiting and calming are worth the same */
export const threshold = (R = REWARD) =>
  (R.calmar[0] - R.esperar[0]) / (R.esperar[1] - R.esperar[0] - R.calmar[1] + R.calmar[0]);
/** two-stage value of acting now and deciding again tomorrow with what is seen */
export const q2 = (b: number, a: Act) => {
  const p = predict(b, a);
  const pos = signalProb(p);
  return qBelief(b, a) + GAMMA * (pos * v1(correct(p, true)) + (1 - pos) * v1(correct(p, false)));
};
/** value of looking at a signal before deciding, with the state frozen */
export const voi = (b: number, obs = OBS_REPORT) => {
  const pos = signalProb(b, obs);
  return pos * v1(correct(b, true, obs)) + (1 - pos) * v1(correct(b, false, obs)) - v1(b);
};
/** values of a fixed policy, by iterating its Bellman equation */
export const policyValue = (pi: [Act, Act], steps = 400) => {
  let v: [number, number] = [0, 0];
  for (let k = 0; k < steps; k++) v = bellmanStep(v, pi);
  return v;
};
/** one sweep of the Bellman equation of a policy */
export const bellmanStep = (v: [number, number], pi: [Act, Act]): [number, number] =>
  [0, 1].map((s) => {
    const a = pi[s];
    const up = TRANS[a][s];
    return REWARD[a][s] + GAMMA * ((1 - up) * v[0] + up * v[1]);
  }) as [number, number];
/** one sweep of the optimal Bellman equation */
export const optimalStep = (v: [number, number]): [number, number] =>
  [0, 1].map((s) =>
    Math.max(
      ...(['esperar', 'calmar'] as Act[]).map((a) => {
        const up = TRANS[a][s];
        return REWARD[a][s] + GAMMA * ((1 - up) * v[0] + up * v[1]);
      }),
    ),
  ) as [number, number];
