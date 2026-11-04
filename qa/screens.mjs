// Every screen outside a case, at each size: title, prologue, map, chapter, district, settings,
// resources, sessions. Same readable-text audit as the sweep, with screenshots in qa/out/screens/.
// Usage: SNAP=dir node qa/screens.mjs 1470x830 1280x720 ...
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { readable } from './readable.mjs';

const OUT = new URL('./out/screens/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const SNAP = new URL(`./${process.env.SNAP ?? 'snap'}/`, import.meta.url).pathname;
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: true, textSpeed: 'instant', freeMode: true },
  booted: true, last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let total = 0;
for (const vp of process.argv.slice(2)) {
  const [w, h] = vp.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('q')) { localStorage.setItem('noesis.v3', s); sessionStorage.setItem('q', '1'); }
  }, JSON.stringify(fresh));
  await ctx.route('http://snap.local/**', (route) => {
    const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
    return route.fulfill({ path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html') });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const look = async (name) => {
    await page.waitForTimeout(350);
    const issues = (await page.evaluate(readable)).filter((i) => i[0] !== 'scroll');
    await page.screenshot({ path: `${OUT}${vp}-${name}.png` });
    total += issues.length;
    if (issues.length) console.log(vp, name, JSON.stringify(issues.slice(0, 6)));
  };
  const go = async (hash) => {
    await page.goto(`http://snap.local/index.html${hash}`, { waitUntil: 'load' });
    await page.reload({ waitUntil: 'load' });
  };
  await go('#/');
  await look('titulo');
  for (const [label, name] of [[/ajustes/i, 'ajustes'], [/sesi/i, 'sesiones'], [/recursos|biblioteca|códice|manual/i, 'recursos']]) {
    await go('#/');
    await page.waitForTimeout(200);
    const b = page.getByRole('button', { name: label }).first();
    if (await b.count()) {
      await b.click();
      await look(name);
    } else console.log(vp, 'sin botón', name);
  }
  await go('#/atlas');
  await look('atlas');
  for (const r of ['capitulo/w1', 'sector/w1', 'sector/w13']) {
    await go(`#/${r}`);
    await look(r.replace('/', '-'));
  }
  await go('#/prologo');
  for (let i = 0; i < 40; i++) {
    await look(`prologo-${i}`);
    const before = await page.evaluate(() => document.body.innerText.slice(0, 400));
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    if ((await page.evaluate(() => document.body.innerText.slice(0, 400))) === before) break;
    if (!(await page.evaluate(() => location.hash.includes('prologo')))) break;
  }
  if (errors.length) console.log(vp, 'errores de página', errors.slice(0, 3));
  await ctx.close();
}
await browser.close();
console.log(`avisos ${total}`);
