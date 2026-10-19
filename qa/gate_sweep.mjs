// Can a player open every gate of a case's investigation? For each gated beat: sweep each knob
// across the stage with the button held, then click every pointer-cursor element, until the
// beat unlocks. Prints one line per gate. Usage: node qa/gate_sweep.mjs w8-c1 [w8-c2 ...]
// Needs the frozen QA build in qa/snap. Screenshots of stuck gates in qa/out/gates/.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = new URL('./out/gates/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const SNAP = new URL('./snap/', import.meta.url).pathname;
const fresh = {
  version: 3,
  xp: 0,
  levels: {},
  glyphs: [],
  codex: [],
  modules: [],
  predictions: { right: 0, total: 0 },
  settings: {
    sfx: false,
    music: false,
    volume: 0.5,
    reducedMotion: true,
    textSpeed: 'fast',
    freeMode: true,
  },
  booted: true,
  last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
for (const id of process.argv.slice(2)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  await ctx.addInitScript((s) => localStorage.setItem('noesis.v3', s), JSON.stringify(fresh));
  await ctx.route('http://snap.local/**', (route) => {
    const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
    return route.fulfill({
      path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html'),
    });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://snap.local/index.html#/', { waitUntil: 'networkidle' });
  const step = await page.evaluate(
    (id) => window.__levels.find((l) => l.id === id).steps.indexOf('demo'),
    id,
  );
  await page.goto(`http://snap.local/index.html#/level/${id}/${step}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1200);
  const state = () =>
    page.evaluate(() => ({
      beat: window.__demo?.beat,
      locked: window.__demo?.locked,
      count: window.__demo?.count,
      right: window.__demo?.rightKey,
      answer: window.__demo?.answer,
    }));
  const n = (await state()).count ?? 0;
  const tries = new Map();
  for (let guard = 0; guard < n * 4; guard++) {
    let s = await state();
    // left the investigation (the hook keeps its last value after unmount)
    if (
      s.beat === undefined ||
      !(await page.evaluate(
        () => !!document.querySelector('.beat-dots') && !document.querySelector('.challenge-head'),
      ))
    )
      break;
    if (s.locked) {
      const gate = await page.evaluate(
        () => document.querySelector('.wait-reason, .gate')?.innerText?.trim() ?? '',
      );
      let how = '';
      // 1) knobs: sweep horizontally, then vertically, button held
      const knobs = await page.evaluate(() => document.querySelectorAll('.knob').length);
      for (let k = 0; k < knobs && !how; k++) {
        for (const dir of ['x', 'y', 'x-', 'y-']) {
          const g = await page.evaluate((k) => {
            const el = document.querySelectorAll('.knob')[k];
            if (!el) return null;
            const r = (el.querySelector('circle') ?? el).getBoundingClientRect();
            const s = el.ownerSVGElement.getBoundingClientRect();
            return {
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              s: { x: s.x, y: s.y, w: s.width, h: s.height },
            };
          }, k);
          if (!g) break;
          await page.mouse.move(g.x, g.y);
          await page.mouse.down();
          const N = 48;
          for (let i = 0; i <= N && !how; i++) {
            const t = i / N;
            const px =
              dir === 'x' ? g.s.x + t * g.s.w : dir === 'x-' ? g.s.x + (1 - t) * g.s.w : g.x;
            const py =
              dir === 'y' ? g.s.y + t * g.s.h : dir === 'y-' ? g.s.y + (1 - t) * g.s.h : g.y;
            await page.mouse.move(px, py);
            if (!(await state()).locked) how = `knob ${k} ${dir}`;
          }
          await page.mouse.up();
          await page.waitForTimeout(150);
          if (!(await state()).locked) how ||= `knob ${k} ${dir} (al soltar)`;
          if (how) break;
        }
      }
      // 1b) knobs whose drop counts only on release (cursors, tapes): drop at each point in turn
      for (let k = 0; k < knobs && !how; k++) {
        for (const dir of ['x', 'y']) {
          const g0 = await page.evaluate((k) => {
            const s = document
              .querySelectorAll('.knob')
              [k]?.ownerSVGElement?.getBoundingClientRect();
            return s && { x: s.x, y: s.y, w: s.width, h: s.height };
          }, k);
          if (!g0) break;
          const N = 40;
          for (let i = 0; i <= N && !how; i++) {
            const g = await page.evaluate((k) => {
              const el = document.querySelectorAll('.knob')[k];
              if (!el) return null;
              const r = (el.querySelector('circle') ?? el).getBoundingClientRect();
              return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }, k);
            if (!g) break;
            const t = i / N;
            await page.mouse.move(g.x, g.y);
            await page.mouse.down();
            await page.mouse.move(
              dir === 'x' ? g0.x + t * g0.w : g.x,
              dir === 'y' ? g0.y + t * g0.h : g.y,
              { steps: 3 },
            );
            await page.mouse.up();
            await page.waitForTimeout(60);
            if (!(await state()).locked) how = `knob ${k} soltando en cada punto (${dir})`;
          }
        }
      }
      // 1c) drag-and-drop tokens (grab cursor): drop each one on a grid over the stage
      if (!how) {
        const tokens = await page.evaluate(
          () =>
            [...document.querySelectorAll('.stage-area svg g')].filter(
              (g) => getComputedStyle(g).cursor === 'grab' && !g.closest('.knob'),
            ).length,
        );
        for (let k = 0; k < tokens && !how; k++) {
          const box = await page.evaluate(() => {
            const r = document.querySelector('.stage-area svg').getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          });
          for (let gy = 1; gy <= 14 && !how; gy++)
            for (let gx = 1; gx <= 25 && !how; gx++) {
              const t = await page.evaluate((k) => {
                const g = [...document.querySelectorAll('.stage-area svg g')].filter(
                  (g) => getComputedStyle(g).cursor === 'grab' && !g.closest('.knob'),
                )[k];
                const c = g?.querySelector('circle')?.getBoundingClientRect();
                return c && { x: c.x + c.width / 2, y: c.y + c.height / 2 };
              }, k);
              if (!t) break;
              await page.mouse.move(t.x, t.y);
              await page.mouse.down();
              await page.mouse.move(box.x + (gx / 26) * box.w, box.y + (gy / 15) * box.h, {
                steps: 4,
              });
              await page.mouse.up();
              if (!(await state()).locked) how = `ficha ${k} soltada en ${gx},${gy}`;
            }
        }
      }
      // 2) clickable things in the stage (choices, marks, tiles)
      if (!how) {
        const pts = await page.evaluate(() => {
          const stage = document.querySelector('.stage-area');
          if (!stage) return [];
          return (
            [...stage.querySelectorAll('button, [role=button], g, rect, circle, path, text')]
              .filter((e) => !e.closest('.stage-meta'))
              .filter((e) => getComputedStyle(e).cursor === 'pointer' || e.tagName === 'BUTTON')
              // real buttons first: a choice row is the likeliest action
              .sort((a, b) => (b.tagName === 'BUTTON') - (a.tagName === 'BUTTON'))
              .map((e) => e.getBoundingClientRect())
              .filter((r) => r.width > 4 && r.height > 4)
              .map((r) => [r.x + r.width / 2, r.y + r.height / 2])
              .slice(0, 120)
          );
        });
        for (const [x, y] of pts) {
          await page.mouse.click(x, y);
          await page.waitForTimeout(120);
          if (!(await state()).locked) {
            how = `click ${Math.round(x)},${Math.round(y)}`;
            break;
          }
        }
      }
      if (!how) {
        bad++;
        await page.screenshot({ path: `${OUT}${id}-b${s.beat}-stuck.png` });
        console.log(`${id} b${s.beat} ATASCADO · ${gate}`);
        await page.evaluate(() => window.__demo?.unlock?.());
      } else console.log(`${id} b${s.beat} ok (${how}) · ${gate}`);
      await page.waitForTimeout(700);
      continue;
    }
    // the first key can land while the text is still typing: retry until the answer registers
    if (s.right && s.answer === null && (tries.get(s.beat) ?? 0) < 6) {
      tries.set(s.beat, (tries.get(s.beat) ?? 0) + 1);
      await page.keyboard.press(String(s.right));
      await page.waitForTimeout(500);
      continue;
    }
    const before = s.beat;
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    if ((await state()).beat === before) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
    }
    const after = await state();
    if (after.beat === before && !after.locked) break;
  }
  if (errors.length) console.log(id, 'ERRORES', errors.slice(0, 3));
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
