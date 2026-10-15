// Play a case like a new player and log what is on screen: scenes, every lesson and
// investigation beat (text, formula, question, gate), a wrong answer on purpose, a hint, and
// the feedback in every practice round. Screenshots per beat in qa/out/play/<id>/.
// Usage: node qa/play.mjs w1-c1 [1440x860] > qa/out/play-w1-c1.json   (dev server on :8765)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2];
const [VW, VH] = (process.argv[3] ?? '1440x860').split('x').map(Number);
const OUT = new URL(`./out/play/${id}/`, import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: false, textSpeed: 'normal', freeMode: true },
  booted: true, last: {},
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
await ctx.addInitScript((s) => { if (!sessionStorage.getItem('qa-init')) { localStorage.setItem('noesis.v3', s); sessionStorage.setItem('qa-init', '1'); } }, JSON.stringify(fresh));
// frozen QA build (npx vite build --mode qa --outDir qa/snap) served from disk, so edits to src
// do not reload the page mid-game
const SNAP = new URL('./snap/', import.meta.url).pathname;
await ctx.route('http://snap.local/**', (route) => {
  const u = new URL(route.request().url());
  const f = path.join(SNAP, decodeURIComponent(u.pathname));
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ path: f });
  return route.fulfill({ path: path.join(SNAP, 'index.html') });
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const log = [];
const LOG = new URL(`./out/play-${id}.json`, import.meta.url).pathname;
const flush = () => fs.writeFileSync(LOG, JSON.stringify({ id, errors, log }, null, 1));
const T = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.innerText.trim()).filter(Boolean).join(' | '), sel);
const shot = (n) => page.screenshot({ path: OUT + n + '.png' });
const kind = () => page.evaluate(() => {
  if (document.querySelector('.results')) return 'results';
  if (document.querySelector('.scene')) return 'scene';
  if (window.__round && document.querySelector('.challenge-head')) return 'challenge';
  if (window.__demo && document.querySelector('.beat-dots')) return document.querySelector('.lesson-bg') ? 'lesson' : 'demo';
  return 'other';
});
await page.goto(`http://snap.local/index.html#/level/${id}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
let guard = 0;
let stepNo = 0;
while (guard++ < 200) {
  if (!(await page.evaluate(() => location.hash)).includes(id)) break;
  const k = await kind();
  if (k === 'results') {
    await page.waitForTimeout(2500);
    await shot(`${stepNo}-results`);
    log.push({ step: 'results', text: await T('.results-left') });
    flush();
    break;
  }
  if (k === 'scene') {
    const lines = [];
    let first = true;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(400);
      const txt = await T('.dialogue-text');
      const who = await T('.dialogue-name b');
      if (first) { await page.waitForTimeout(1600); await shot(`${stepNo}-scene`); first = false; }
      lines.push(`${who || 'NARR'}: ${txt}`);
      await page.keyboard.press('Space');
      await page.waitForTimeout(250);
      if ((await kind()) !== 'scene') break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      if ((await kind()) !== 'scene') break;
    }
    log.push({ step: 'scene', lines: [...new Set(lines)] });
    flush();
    stepNo++;
    continue;
  }
  if (k === 'lesson' || k === 'demo') {
    const n = await page.evaluate(() => window.__demo?.count ?? 0);
    const beats = [];
    for (let b = 0; b < n; b++) {
      await page.waitForTimeout(3200);
      const info = {
        b,
        say: await T('.console-text'),
        focus: await T('.focus-label'),
        tex: await page.evaluate(() => [...document.querySelectorAll('.focus-tex .katex-mathml annotation, .focus-tex annotation')].map((a) => a.textContent).join(' | ')),
        gate: await T('.wait-reason, .gate'),
        ask: await T('.ask-prompt'),
        options: await T('.ask-options .opt'),
      };
      await shot(`${stepNo}-${k}-b${b}`);
      const right = await page.evaluate(() => window.__demo?.rightKey || 0);
      if (right) {
        const wrong = (right % 3) + 1;
        await page.keyboard.press(String(wrong));
        await page.waitForTimeout(900);
        info.afterWrong = await T('.ask-explain');
        await shot(`${stepNo}-${k}-b${b}-wrong`);
      }
      await page.evaluate(() => window.__demo?.unlock?.());
      await page.waitForTimeout(600);
      beats.push(info);
      const before = await page.evaluate(() => window.__demo?.beat);
      await page.keyboard.press('Space');
      await page.waitForTimeout(400);
      if ((await page.evaluate(() => window.__demo?.beat)) === before) { await page.keyboard.press('Space'); await page.waitForTimeout(400); }
    }
    log.push({ step: k, beats });
    flush();
    // leave the step if still here
    for (let i = 0; i < 4 && ['lesson', 'demo'].includes(await kind()); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(700); }
    stepNo++;
    continue;
  }
  if (k === 'challenge') {
    const rounds = [];
    for (let r = 0; r < 5 && (await kind()) === 'challenge'; r++) {
      await page.waitForTimeout(1500);
      const info = { r, prompt: await T('.console-text'), head: await T('.challenge-head') };
      await shot(`${stepNo}-challenge-r${r}`);
      const hasInput = await page.evaluate(() => !!document.querySelector('.stage-input, input[inputmode], input[type=text]'));
      if (hasInput) {
        await page.click('.stage-input, input[inputmode], input[type=text]').catch(() => {});
        await page.keyboard.type('0');
        await page.keyboard.press('Enter');
      } else {
        const opt = await page.$('.stage-html button, .choice');
        if (opt) await opt.click().catch(() => {});
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(1200);
      info.afterWrong = await T('.console-text');
      await page.keyboard.press('h');
      await page.waitForTimeout(700);
      info.hint = await T('.hints');
      await shot(`${stepNo}-challenge-r${r}-wrong`);
      await page.evaluate(() => window.__round?.pass());
      await page.waitForTimeout(1300);
      info.afterRight = await T('.console-text');
      rounds.push(info);
      await page.waitForTimeout(3600); // solved rounds advance on their own
    }
    log.push({ step: 'challenge', rounds });
    flush();
    stepNo++;
    continue;
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
}
flush();
await browser.close();
