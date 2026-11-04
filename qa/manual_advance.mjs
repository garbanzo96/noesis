// Nothing moves on by itself: after an action, a solved round and a lost round, the screen must stay
// put for 6 seconds until the player presses. Usage: node qa/manual_advance.mjs  (frozen build in qa/snap)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const SNAP = new URL('./snap/', import.meta.url).pathname;
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: false, textSpeed: 'fast', freeMode: true },
  booted: true, last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
await ctx.addInitScript((s) => { if (!sessionStorage.getItem('q')) { localStorage.setItem('noesis.v3', s); sessionStorage.setItem('q', '1'); } }, JSON.stringify(fresh));
await ctx.route('http://snap.local/**', (route) => {
  const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
  return route.fulfill({ path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html') });
});
const page = await ctx.newPage();
await page.goto('http://snap.local/index.html#/level/w1-c1');
await page.reload();
await page.waitForFunction(() => window.__run);
const kinds = await page.evaluate(() => window.__run.kinds);
const check = (name, ok) => { console.log(`${ok ? 'ok' : 'FALLA'} ${name}`); if (!ok) process.exitCode = 1; };

await page.evaluate((i) => window.__run.goto(i), kinds.indexOf('lesson'));
await page.waitForTimeout(300);
await page.evaluate(() => window.__demo.goto(4));
await page.waitForTimeout(2500);
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await page.evaluate(() => window.__demo.unlock());
await page.waitForTimeout(6000);
check('la clase no avanza tras la acción', (await page.evaluate(() => window.__demo.beat)) === 4);
check('muestra lo que la acción enseñó', /semiabierto/.test(await page.locator('.gate').innerText()));
await page.keyboard.press('Space');
await page.waitForTimeout(500);
check('Seguir avanza', (await page.evaluate(() => window.__demo.beat)) === 5);

await page.evaluate((i) => window.__run.goto(i), kinds.indexOf('challenge'));
await page.waitForFunction(() => window.__round);
await page.waitForTimeout(500);
await page.evaluate(() => window.__round.pass());
await page.waitForTimeout(6000);
check('la ronda resuelta espera', (await page.evaluate(() => window.__round.round)) === 0);
await page.keyboard.press('Space');
await page.waitForTimeout(500);
check('Espacio pasa a la ronda siguiente', (await page.evaluate(() => window.__round.round)) === 1);
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.__round.fail());
  await page.waitForTimeout(120);
}
await page.waitForTimeout(6000);
check('sin credibilidad espera', (await page.evaluate(() => window.__round.phase)) === 'desync');
await page.keyboard.press('Space');
await page.waitForTimeout(500);
check('Espacio repite la ronda', (await page.evaluate(() => window.__round.phase)) === 'play');
await browser.close();
