import { entropy, kl, bayes } from './math';
export type PolicyId = 'stay' | 'focus' | 'move';
export interface Policy {
  id: PolicyId;
  name: string;
  description: string;
  leftGivenLeft: number;
  leftGivenRight: number;
  accuracy: number;
}
export const policies: Policy[] = [
  {
    id: 'stay',
    name: 'Mantener',
    description: 'Conserva el estado; sensor habitual.',
    leftGivenLeft: 1,
    leftGivenRight: 0,
    accuracy: 0.65,
  },
  {
    id: 'focus',
    name: 'Observar mejor',
    description: 'Conserva el estado; sensor de alta fiabilidad.',
    leftGivenLeft: 1,
    leftGivenRight: 0,
    accuracy: 0.95,
  },
  {
    id: 'move',
    name: 'Orientar a la izquierda',
    description: 'Transición hacia la zona preferida; sensor habitual.',
    leftGivenLeft: 0.85,
    leftGivenRight: 0.65,
    accuracy: 0.65,
  },
];
export const preferences = [0.8, 0.2];
export function predictPolicy(belief: number, policy: Policy) {
  const state = policy.leftGivenLeft * belief + policy.leftGivenRight * (1 - belief);
  const observation = policy.accuracy * state + (1 - policy.accuracy) * (1 - state);
  const risk = kl(observation, preferences[0]),
    ambiguity = entropy(policy.accuracy),
    G = risk + ambiguity;
  const information = entropy(observation) - ambiguity;
  return { state, observation, risk, ambiguity, G, information };
}
export function updateAgent(prediction: number, accuracy: number, observation: 0 | 1) {
  return bayes(
    prediction,
    observation === 0 ? accuracy : 1 - accuracy,
    observation === 0 ? 1 - accuracy : accuracy,
  );
}
export function selectPolicy(belief: number) {
  return [...policies].sort((a, b) => predictPolicy(belief, a).G - predictPolicy(belief, b).G)[0];
}
