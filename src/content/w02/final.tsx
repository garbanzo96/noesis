import { stub } from '../stub';

const m = stub('differential', 'w2-final', '2.★', 'El apagón', 'Repaso del distrito', '\\bigstar');
export const level = { ...m.level, kind: 'boss' as const, module: 'w2-closed' };
export const glyphs = m.glyphs;
