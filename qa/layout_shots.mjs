// Screenshots of the reading layout in the states that matter: lesson context card, a lesson beat
// mid-build and complete, an answered question, an investigation and a practice round with the
// worked solution open. Usage: node qa/layout_shots.mjs 1440x860 [1280x720 ...] → qa/out/layout/
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = new URL('./out/layout/', import.meta.url).pathname;
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
    reducedMotion: false,
    textSpeed: 'normal',
    freeMode: true,
  },
  booted: true,
  last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const vp of process.argv.slice(2)) {
  const [w, h] = vp.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('i')) {
      localStorage.setItem('noesis.v3', s);
      sessionStorage.setItem('i', '1');
    }
  }, JSON.stringify(fresh));
  await ctx.route('http://snap.local/**', (route) => {
    const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
    return route.fulfill({
      path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html'),
    });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n) => page.screenshot({ path: `${OUT}${vp}-${n}.png` });
  const go = async (hash) => {
    await page.goto('http://snap.local/index.html#/', { waitUntil: 'networkidle' });
    await page.goto(`http://snap.local/index.html#${hash}`, { waitUntil: 'networkidle' });
  };
  // lesson 3.6: context card, then beat 0 while it builds and once complete
  await go('/level/w3-c6/1');
  await page.waitForTimeout(3500);
  await shot('1-intro');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1600);
  await shot('2-beat0-building');
  await page.waitForTimeout(7000);
  await shot('3-beat0-done');
  // lesson 5.1 beat 2: a question answered
  await go('/level/w5-c1/1');
  for (let i = 0; i < 6 && (await page.evaluate(() => window.__demo?.beat)) !== 2; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(6000);
  const rk = await page.evaluate(() => window.__demo?.rightKey);
  if (rk) await page.keyboard.press(String((rk % 3) + 1));
  await page.waitForTimeout(2500);
  await shot('4-lesson-ask');
  // investigation 5.1, beat 3 answered
  await go('/level/w5-c1/2');
  for (let i = 0; i < 8 && (await page.evaluate(() => window.__demo?.beat)) !== 3; i++) {
    const d = await page.evaluate(() => window.__demo);
    if (d?.locked) await page.evaluate(() => window.__demo.unlock());
    if (d?.rightKey && d.answer === null) await page.keyboard.press(String(d.rightKey));
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(6000);
  const rk2 = await page.evaluate(() => window.__demo?.rightKey);
  if (rk2) await page.keyboard.press(String(rk2));
  await page.waitForTimeout(2500);
  await shot('5-demo');
  // practice 8.3: two wrong answers open the worked solution
  await go('/level/w8-c3/3');
  await page.waitForTimeout(3000);
  for (let k = 0; k < 2; k++) {
    await page.evaluate(() => window.__round?.fail?.());
    await page.waitForTimeout(1800);
  }
  await page.keyboard.press('h');
  await page.waitForTimeout(1500);
  await shot('6-practice');
  console.log(vp, 'errores', errors);
  await ctx.close();
}
await browser.close();
