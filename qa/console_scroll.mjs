// The explanation scrolls inside its box and never goes under the buttons: the view follows the
// typing, rereading is respected, jumping the typing keeps the start, and a late instruction shows.
// Usage: node qa/console_scroll.mjs  (frozen build in qa/snap, or SNAP=dir)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const SNAP = new URL(`./${process.env.SNAP ?? 'snap'}/`, import.meta.url).pathname;
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: false, textSpeed: 'fast', freeMode: true },
  booted: true, last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 640 } });
await ctx.addInitScript((s) => { if (!sessionStorage.getItem('q')) { localStorage.setItem('noesis.v3', s); sessionStorage.setItem('q', '1'); } }, JSON.stringify(fresh));
await ctx.route('http://snap.local/**', (route) => {
  const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
  return route.fulfill({ path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html') });
});
const page = await ctx.newPage();
const check = (name, ok) => { console.log(`${ok ? 'ok' : 'FALLA'} ${name}`); if (!ok) process.exitCode = 1; };
await page.goto('http://snap.local/index.html#/level/w10-c3');
await page.reload();
await page.waitForFunction(() => window.__run);
const kinds = await page.evaluate(() => window.__run.kinds);
await page.evaluate((i) => window.__run.goto(i), kinds.indexOf('lesson'));
await page.waitForFunction(() => window.__demo);

// longest beat of the class
const state = () => page.evaluate(() => {
  const b = document.querySelector('.console-body');
  const a = document.querySelector('.console-actions');
  return {
    top: b.scrollTop, max: b.scrollHeight - b.clientHeight, typing: !!b.querySelector('.caret'),
    gap: a.getBoundingClientRect().top - b.getBoundingClientRect().bottom,
    mask: getComputedStyle(b).maskImage,
  };
});
const n = await page.evaluate(() => window.__demo.count);
let beat = -1;
for (let k = 0; k < n && beat < 0; k++) {
  await page.evaluate((i) => window.__demo.goto(i), k);
  await page.waitForTimeout(200);
  if (await page.evaluate(() => !!document.querySelector('.console-body .caret')))
    await page.keyboard.press('Space'); // jump the typing
  await page.waitForTimeout(150);
  if ((await state()).max > 40) beat = k;
}
check(`hay un paso largo que necesita scroll (${beat})`, beat >= 0);
await page.evaluate(() => window.__demo.goto(0));
await page.waitForTimeout(100);

// follows the typing
await page.evaluate((i) => window.__demo.goto(i), beat);
await page.waitForFunction(() => {
  const b = document.querySelector('.console-body');
  return b.scrollHeight - b.clientHeight > 20;
}, null, { timeout: 15000 });
await page.waitForTimeout(250);
let s = await state();
check(`sigue la escritura (${s.top} de ${s.max})`, s.typing && s.top >= s.max - 30);
check('el texto no llega a los botones', s.gap >= 0);

// rereading is respected
await page.mouse.move(900, 300);
await page.mouse.wheel(0, -2000);
await page.waitForTimeout(300);
s = await state();
const held = s.top;
await page.waitForTimeout(600);
s = await state();
check('subir a releer no se deshace', s.top === 0 && held === 0);

// and every line can be reached
await page.waitForFunction(() => !document.querySelector('.console-body .caret'), null, { timeout: 20000 });
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(300);
s = await state();
check('se puede llegar al final', s.top >= s.max - 1);

// jumping the typing keeps the start
await page.evaluate(() => window.__demo.goto(0));
await page.waitForTimeout(100);
await page.keyboard.press('Space'); // leave beat 0 finished, or the next one counts as read
await page.waitForTimeout(100);
await page.evaluate((i) => window.__demo.goto(i), beat);
await page.waitForTimeout(250);
await page.keyboard.press('Space');
await page.waitForTimeout(300);
s = await state();
check(`saltar la escritura deja el inicio a la vista (${s.top})`, !s.typing && s.top <= 60);
await page.screenshot({ path: new URL('./out/console-scroll.png', import.meta.url).pathname });
await browser.close();
