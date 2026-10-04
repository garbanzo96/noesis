import { stub } from '../stub';

const m = stub('w01-boss', '1.★', 'Tres causas, una creencia', 'Núcleo del sector', '\\star');
export const level = { ...m.level, kind: 'boss' as const, module: 'w01-softmax' };
export const { codex, glyphs } = m;
