export interface Assessment {
  seed: number;
  assisted: boolean;
}
const prefix = 'noesis:assessment:v2:';
export function loadAssessment(id: string): Assessment {
  try {
    const x = JSON.parse(localStorage.getItem(prefix + id) || 'null');
    if (x && Number.isSafeInteger(x.seed) && typeof x.assisted === 'boolean') return x;
  } catch {}
  return { seed: 0, assisted: false };
}
export function saveAssessment(id: string, assessment: Assessment) {
  try {
    localStorage.setItem(prefix + id, JSON.stringify(assessment));
  } catch {}
}
export function freshSeed(previous: number) {
  let seed = Date.now() >>> 0;
  if (seed === previous || seed === 0) seed = (previous + 104729) >>> 0;
  return seed;
}
