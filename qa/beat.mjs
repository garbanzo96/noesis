// Screenshot of given beats on the frozen QA build, animations off.
// Usage: node qa/beat.mjs w1-c1 lesson:0,1 demo:4 challenge:0 [--done] [--size=1440x860]  → qa/out/beat/
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const done = args.includes('--done');
const size = (args.find((a) => a.startsWith('--size=')) ?? '--size=1440x860').slice(7);
const [VW, VH] = size.split('x').map(Number);
const [id, ...specs] = args.filter((a) => !a.startsWith('--'));
const OUT = new URL('./out/beat/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const SNAP = new URL('./snap/', import.meta.url).pathname;
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: true, textSpeed: 'instant', freeMode: true },
  booted: true, last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
await ctx.addInitScript((s) => {
  if (!sessionStorage.getItem('q')) {
    localStorage.setItem('noesis.v3', s);
    sessionStorage.setItem('q', '1');
  }
}, JSON.stringify(fresh));
await ctx.route('http://snap.local/**', (route) => {
  const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
  return route.fulfill({ path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html') });
});
const page = await ctx.newPage();
await page.goto(`http://snap.local/index.html#/level/${id}`, { waitUntil: 'load' });
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__run);
const kinds = await page.evaluate(() => window.__run.kinds);
for (const spec of specs) {
  const [kind, list] = spec.split(':');
  await page.evaluate((i) => window.__run.goto(i), kinds.indexOf(kind));
  await page.waitForTimeout(250);
  for (const b of (list ?? '0').split(',').map(Number)) {
    if (kind === 'challenge') {
      for (let r = 0; r < b; r++) {
        await page.evaluate(() => window.__round.pass());
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
      }
    } else {
      await page.evaluate((k) => window.__demo.goto(k), b);
      await page.waitForTimeout(250);
      if (done) {
        const key = await page.evaluate(() => window.__demo.rightKey);
        if (key) await page.keyboard.press(String(key));
        await page.evaluate(() => window.__demo.unlock());
        await page.waitForTimeout(250);
      }
    }
    await page.screenshot({ path: `${OUT}${id}-${kind}-${b}${done ? '-done' : ''}.png` });
    console.log(`${OUT}${id}-${kind}-${b}${done ? '-done' : ''}.png`);
  }
}
await browser.close();
