// Drive one lesson gate by hand: reach the beat, drag the knob to a stage point, confirm it unlocks.
// Usage: node qa/gate_check.mjs w3-c6 1 2 0 1500,690   (level, step index, beat, knob index, target x,y in stage units)
// Screenshots before/after in qa/out/gates/. Needs the frozen QA build in qa/snap.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [id, step, beat, knob, target] = process.argv.slice(2);
const [tx, ty] = target.split(',').map(Number);
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
await page.goto(`http://snap.local/index.html#/level/${id}/${step}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) {
  const b = await page.evaluate(() => window.__demo?.beat);
  if (b === Number(beat)) break;
  await page.evaluate(() => window.__demo?.unlock?.());
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
}
await page.waitForTimeout(1500);
const st0 = await page.evaluate(() => ({
  beat: window.__demo?.beat,
  locked: window.__demo?.locked,
}));
await page.screenshot({ path: `${OUT}${id}-b${beat}-before.png` });
const where = (k, tx, ty) =>
  page.evaluate(
    ([k, tx, ty]) => {
      const knobs = [...document.querySelectorAll('.knob')];
      // the stage that owns the knob, mapped with the same CTM the drag hook uses
      const svg = knobs[k].ownerSVGElement;
      // the handle's own circle: the knob group also holds the cue halo and arrows
      const r = (knobs[k].querySelector('circle') ?? knobs[k]).getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = tx;
      pt.y = ty;
      const p = pt.matrixTransform(svg.getScreenCTM());
      return {
        knob: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
        target: { x: p.x, y: p.y },
        n: knobs.length,
      };
    },
    [k, tx, ty],
  );
const box = await where(Number(knob), tx, ty);
const sx = box.target.x;
const sy = box.target.y;
await page.mouse.move(box.knob.x, box.knob.y);
await page.mouse.down();
for (let i = 1; i <= 12; i++)
  await page.mouse.move(
    box.knob.x + ((sx - box.knob.x) * i) / 12,
    box.knob.y + ((sy - box.knob.y) * i) / 12,
  );
await page.mouse.up();
await page.waitForTimeout(800);
const st1 = await page.evaluate(() => ({
  beat: window.__demo?.beat,
  locked: window.__demo?.locked,
}));
await page.screenshot({ path: `${OUT}${id}-b${beat}-after.png` });
const box1 = await where(Number(knob), tx, ty).catch(() => null);
console.log(
  JSON.stringify({
    id,
    knobs: box.n,
    from: box.knob,
    to: box.target,
    landed: box1?.knob,
    before: st0,
    after: st1,
    errors,
  }),
);
await browser.close();
