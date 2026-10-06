import { stub } from '../stub';

const m = stub('foundations', 'w1-final', '1.★', 'La noche del Altamar', 'Caso principal', '\\bigstar');
export const level = { ...m.level, kind: 'boss' as const, module: 'w1-closed' };
export const glyphs = m.glyphs;
