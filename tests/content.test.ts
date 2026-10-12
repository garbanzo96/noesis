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

  it('glyph references resolve and every playable case has a notebook card', () => {
    for (const l of levels) {
      for (const g of l.glyphs) expect(GLYPHS[g], `${l.id} glyph ${g}`).toBeTruthy();
      if (!l.wip) expect(CODEX[l.id], `${l.id} codex`).toBeTruthy();
    }
  });

  it('cases start with a scene and contain a demo and at least one challenge', () => {
    for (const l of levels) {
      if (l.wip) continue;
      expect(l.steps[0].kind, l.id).toBe('scene');
      expect(l.steps.some((s) => s.kind === 'challenge'), l.id).toBe(true);
    }
  });

  it('no Active Inference vocabulary leaks into the texts', () => {
    const banned = /active inference|inferencia activa|energía libre|free energy|\bAIF\b|q\(\\pi\)|\\ln E/i;
    for (const l of levels) {
      const blob = JSON.stringify(l, (k, v) => (typeof v === 'function' ? undefined : v));
      expect(banned.test(blob), `${l.id} mentions AIF`).toBe(false);
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
    }
  });

  it('every topic has a reference sheet whose TeX renders', () => {
    for (const l of levels) {
      if (l.wip || l.kind === 'boss') continue;
      expect(l.ref, `${l.id} ref`).toBeTruthy();
      expect(l.ref!.defs.length, `${l.id} defs`).toBeGreaterThanOrEqual(2);
      expect(l.ref!.props.length, `${l.id} props`).toBeGreaterThanOrEqual(2);
      for (const n of [...l.ref!.defs, ...l.ref!.props]) if (n.tex) expect(renderTex(n.tex, true), `${l.id}/${n.label}`).not.toContain('katex-error');
    }
  });

  it('every topic has a lesson before it is applied, and its blackboard renders', () => {
    // worlds whose lessons are written; add each world here as its lessons land
    const withLessons = new Set(['foundations', 'differential', 'integral', 'linear', 'statistics']);
    for (const l of levels) {
      if (l.wip || l.kind === 'boss' || !withLessons.has(l.world)) continue;
      const li = l.steps.findIndex((s) => s.kind === 'lesson');
      expect(li, `${l.id} has no lesson`).toBeGreaterThan(0);
      const firstUse = l.steps.findIndex((s) => s.kind === 'demo' || s.kind === 'challenge');
      expect(li, `${l.id} lesson must come before its use`).toBeLessThan(firstUse);
      const st = l.steps[li];
      if (st.kind !== 'lesson') continue;
      for (const b of st.beats) {
        const lines = b.board ? (Array.isArray(b.board) ? b.board : [b.board]) : [];
        for (const ln of lines) expect(renderTex(ln.tex, true), `${l.id}: ${ln.tex}`).not.toContain('katex-error');
      }
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
  it('forge steps are optional', () => expect(true).toBe(true));
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
