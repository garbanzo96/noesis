import { describe, expect, it } from 'vitest';
import { CODEX, GLYPHS, LEVELS, PLAYABLE } from '../src/content/registry';
import { RULE_BY_ID, loadPuzzle } from '../src/forge';
import { solveForge } from '../src/forge/solver';
import { renderTex } from '../src/engine/Tex';

// Content contract checks for every playable level. These run on all levels, including the
// ones written later, so authoring mistakes fail fast.
const levels = Object.values(LEVELS);

describe('content contract', () => {
  it('level ids are unique and steps are non-empty', () => {
    const ids = levels.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of levels) expect(l.steps.length, l.id).toBeGreaterThan(0);
  });

  it('requires point to existing levels of the same sector', () => {
    for (const s of Object.values(PLAYABLE)) {
      const ids = new Set(s!.levels.map((l) => l.id));
      for (const l of s!.levels) for (const r of l.requires) expect(ids.has(r), `${l.id} requires ${r}`).toBe(true);
    }
  });

  it('codex and glyph references resolve', () => {
    for (const l of levels) {
      for (const c of l.codex) expect(CODEX[c], `${l.id} codex ${c}`).toBeTruthy();
      for (const g of l.glyphs) expect(GLYPHS[g], `${l.id} glyph ${g}`).toBeTruthy();
      for (const st of l.steps) if (st.kind === 'codex') expect(CODEX[st.entry], `${l.id} codex step ${st.entry}`).toBeTruthy();
    }
  });

  it('every \\g{id} tag used in demo formulas exists in the lexicon', () => {
    const missing: string[] = [];
    for (const l of levels)
      for (const st of l.steps)
        if (st.kind === 'demo')
          for (const b of st.beats)
            for (const m of `${b.tex ?? ''} ${b.say}`.matchAll(/\\g\{([^}]+)\}/g))
              if (!GLYPHS[m[1]]) missing.push(`${l.id}: ${m[1]}`);
    expect(missing).toEqual([]);
  });

  it('all TeX in codex entries renders without KaTeX errors', () => {
    for (const c of Object.values(CODEX)) {
      for (const b of c.blocks) if (b.tex) expect(renderTex(b.tex, true), `${c.id}/${b.label}`).not.toContain('katex-error');
      for (const a of c.aif ?? []) if (a.tex) expect(renderTex(a.tex, true), c.id).not.toContain('katex-error');
    }
  });

  it('demo beats are well formed', () => {
    for (const l of levels)
      for (const st of l.steps)
        if (st.kind === 'demo') {
          expect(st.beats.length, l.id).toBeGreaterThan(0);
          for (const b of st.beats) {
            if (b.tex) expect(renderTex(b.tex), `${l.id}: ${b.tex}`).not.toContain('katex-error');
            if (b.ask) {
              expect(b.ask.answer, l.id).toBeGreaterThanOrEqual(0);
              expect(b.ask.answer, l.id).toBeLessThan(b.ask.options.length);
            }
          }
        }
  });
});

describe('forge puzzles', () => {
  for (const l of levels)
    for (const st of l.steps)
      if (st.kind === 'forge')
        for (const p of st.puzzles)
          it(`${l.id} · ${p.id} parses, uses known rules and is solvable within par`, () => {
            for (const r of p.rules) expect(RULE_BY_ID[r], `rule ${r}`).toBeTruthy();
            const { start, goal } = loadPuzzle(p);
            expect(start).toBeTruthy();
            expect(goal).toBeTruthy();
            const sol = solveForge(p, p.par);
            expect(sol, `${p.id} has no solution within par ${p.par}`).not.toBeNull();
          });
});
