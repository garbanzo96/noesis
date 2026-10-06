import { stub } from '../stub';

const m = stub('probability', 'w5-final', '5.★', 'La mesa 7', 'Caso principal', '\\bigstar');
export const level = { ...m.level, kind: 'boss' as const, module: 'w5-closed' };
export const glyphs = m.glyphs;
