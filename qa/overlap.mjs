// Layout audit: walks every lesson, investigation and practice round of the given worlds and
// reports (1) stage labels that overlap each other, (2) labels that leave the stage,
// (3) text rendered under 12 px. Usage: node qa/overlap.mjs [w4,w6] [1440x860] > report.json
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const worlds = (process.argv[2] ?? 'w1,w2,w3,w4,w5,w6').split(',');
const [VW, VH] = (process.argv[3] ?? '1440x860').split('x').map(Number);
const storage = fs.readFileSync(new URL('./storage.json', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
await ctx.addInitScript((s) => { localStorage.setItem('noesis.v3', s); if (!location.search.includes('coach')) localStorage.setItem('noesis.coach.lesson', '1'); localStorage.setItem('noesis.coach.practice', '1'); }, storage);
const page = await ctx.newPage();

const audit = () => page.evaluate(() => {
    const stage = document.querySelector('.stage');
    if (!stage) return null;
    const sr = stage.getBoundingClientRect();
    const els = [...document.querySelectorAll('.stage-overlay .stage-html')].filter((e) => {
      const st = getComputedStyle(e);
      return Number(st.opacity) > 0.05 && e.textContent.trim().length > 0;
    });
    const boxes = els.map((e) => {
      const r = e.getBoundingClientRect();
      return { t: e.textContent.trim().slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(e).fontSize), inter: !!e.querySelector('button,input') };
    });
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix <= 2 || iy <= 2) continue;
        const frac = (ix * iy) / Math.min(a.w * a.h, b.w * b.h);
        if (frac > 0.15) overlaps.push([a.t, b.t, Math.round(frac * 100)]);
      }
    const outside = boxes.filter((b) => b.x < sr.left - 4 || b.y < sr.top - 4 || b.x + b.w > sr.right + 4 || b.y + b.h > sr.bottom + 4).map((b) => b.t);
    const small = [...document.querySelectorAll('.console, .focus-strip, .rail, .level-hud, .stage-meta, .challenge-head')]
      .flatMap((root) => [...root.querySelectorAll('*')])
      .filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.offsetParent !== null)
      .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
      .map((e) => `${e.className || e.tagName}: ${e.textContent.trim().slice(0, 24)}`);
    return { overlaps, outside, small: [...new Set(small)].slice(0, 8) };
  });

const levels = await (async () => {
  for (let t = 0; t < 5; t++) {
    try {
      await page.goto(`http://localhost:${process.env.QA_PORT ?? 8765}/#/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const v = await page.evaluate(() => window.__levels ?? null);
      if (v) return v;
    } catch {
      await page.waitForTimeout(1500);
    }
  }
  return null;
})();
if (!levels) {
  console.error('window.__levels missing (dev build only)');
  process.exit(1);
}

const report = [];
for (const lv of levels.filter((l) => worlds.some((w) => l.id.startsWith(w + '-')))) {
  for (const [k, kind] of lv.steps.entries()) {
    if (kind !== 'lesson' && kind !== 'demo' && kind !== 'challenge') continue;
    await page.goto(`http://localhost:${process.env.QA_PORT ?? 8765}/?step=${k}#/level/${lv.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const n = kind === 'challenge' ? lv.rounds[k] : await page.evaluate(() => window.__demo?.count ?? 0);
    for (let b = 0; b < n; b++) {
      await page.keyboard.press('Space'); // finish typing
      await page.waitForTimeout(kind === 'lesson' ? 2600 : 1700);
      if (kind !== 'challenge') {
        const ask = await page.evaluate(() => window.__demo?.rightKey || 0);
        if (ask) {
          await page.keyboard.press(String(ask));
          await page.waitForTimeout(500);
        }
      }
      let r = null;
      try {
        r = await audit();
      } catch {
        r = null;
      }
      if (r && (r.overlaps.length || r.outside.length || r.small.length)) report.push({ id: lv.id, step: kind, at: b, ...r });
      if (kind === 'challenge') {
        await page.evaluate(() => window.__round?.pass());
        await page.waitForTimeout(500);
        await page.keyboard.press('Space');
        await page.waitForTimeout(700);
      } else {
        await page.evaluate(() => window.__demo?.unlock?.());
        await page.waitForTimeout(300);
        const still = await page.evaluate(() => window.__demo?.beat);
        if (still === b) await page.keyboard.press('Space');
        await page.waitForTimeout(500);
      }
    }
  }
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
