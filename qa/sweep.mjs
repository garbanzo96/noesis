// Fast layout sweep of the frozen QA build: every lesson and investigation beat (before and after
// its action or question) and every practice round of the given cases, with animations off. Flags
// what a player would see as broken: labels on top of each other, labels leaving the stage or
// spilling out of their circle, brace labels colliding, the formula strip clipped, TeX errors.
// Usage: npx vite build --mode qa --outDir qa/snap && node qa/sweep.mjs [w1,w2 | w1-c2] [1440x860]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const filter = (process.argv[2] ?? 'all').split(',');
const [VW, VH] = (process.argv[3] ?? '1440x860').split('x').map(Number);
const SNAP = new URL('./snap/', import.meta.url).pathname;
const REPORT = new URL(`./out/sweep-${process.argv[2] ?? 'all'}-${VW}.json`, import.meta.url).pathname;
const fresh = {
  version: 3, xp: 0, levels: {}, glyphs: [], codex: [], modules: [], predictions: { right: 0, total: 0 },
  settings: { sfx: false, music: false, volume: 0.5, reducedMotion: true, textSpeed: 'instant', freeMode: true },
  booted: true, last: {},
};
const ids = fs
  .readdirSync('src/content')
  .filter((d) => /^w\d+$/.test(d))
  .flatMap((d) =>
    fs.readdirSync(`src/content/${d}`).filter((f) => f.endsWith('.tsx')).flatMap((f) => {
      const m = /export const level[^=]*=\s*\{\s*id:\s*'([^']+)'/.exec(fs.readFileSync(`src/content/${d}/${f}`, 'utf8'));
      return m ? [m[1]] : [];
    }),
  )
  .filter((id) => filter[0] === 'all' || filter.some((f) => id === f || id.startsWith(f + '-')));

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
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

const audit = () =>
  page.evaluate(() => {
    const out = [];
    const txt = (e) => e.textContent.trim().slice(0, 36);
    const hit = (a, b) => {
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return ix > 2 && iy > 2 ? (ix * iy) / Math.min(a.width * a.height, b.width * b.height) : 0;
    };
    const stage = document.querySelector('.stage');
    if (stage) {
      const sr = stage.getBoundingClientRect();
      const labels = [...document.querySelectorAll('.stage-overlay .stage-html')].filter(
        (e) => Number(getComputedStyle(e).opacity) > 0.05 && e.textContent.trim(),
      );
      const boxes = labels.map((e) => [e, e.getBoundingClientRect()]);
      for (let i = 0; i < boxes.length; i++) {
        const [a, ra] = boxes[i];
        if (ra.left < sr.left - 4 || ra.top < sr.top - 4 || ra.right > sr.right + 4 || ra.bottom > sr.bottom + 4)
          out.push(['fuera', txt(a)]);
        for (let j = i + 1; j < boxes.length; j++) {
          const f = hit(ra, boxes[j][1]);
          if (f > 0.15) out.push(['encima', txt(a), txt(boxes[j][0]), Math.round(f * 100)]);
        }
      }
      // a label that sits on a circle has to fit inside it
      const circles = [...stage.querySelectorAll('svg circle')]
        .map((c) => c.getBoundingClientRect())
        .filter((c) => c.width > 16 && c.width < 150);
      for (const [e, r] of boxes) {
        const inner = e.querySelector('.prop-tag, .knob-inner') ?? e;
        const q = inner.getBoundingClientRect();
        const cx = q.left + q.width / 2;
        const cy = q.top + q.height / 2;
        const c = circles.find((c) => Math.hypot(c.left + c.width / 2 - cx, c.top + c.height / 2 - cy) < 3);
        if (c && Math.hypot(q.width, q.height * 0.6) / 2 > c.width / 2 + 1) out.push(['circulo', txt(e)]);
      }
    }
    // brace labels: against each other and against the strip that holds them
    const strip = document.querySelector('.focus-strip');
    if (strip) {
      const sr = strip.getBoundingClientRect();
      const notes = [...strip.querySelectorAll('.part-label')].map((e) => [e, e.getBoundingClientRect()]);
      for (let i = 0; i < notes.length; i++) {
        const [a, ra] = notes[i];
        if (ra.left < sr.left - 1 || ra.right > sr.right + 1 || ra.bottom > sr.bottom + 1 || ra.top < sr.top - 1)
          out.push(['llave-fuera', txt(a)]);
        for (let j = i + 1; j < notes.length; j++)
          if (hit(ra, notes[j][1]) > 0.02) out.push(['llaves', txt(a), txt(notes[j][0])]);
        for (const b of strip.querySelectorAll('.focus-body, .focus-label'))
          if (b.style.opacity !== '0' && hit(ra, b.getBoundingClientRect()) > 0.02) out.push(['llave-texto', txt(a), txt(b)]);
      }
      if (strip.scrollHeight > strip.clientHeight + 2) out.push(['franja', strip.scrollHeight - strip.clientHeight]);
    }
    for (const e of document.querySelectorAll('.katex-error')) out.push(['tex', txt(e)]);
    return out;
  });

const report = {};
const add = (id, where, issues) => {
  for (const i of issues) (report[id] ??= []).push([where, ...i]);
};
const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const t0 = Date.now();
for (const id of ids) {
  await page.goto(`http://snap.local/index.html#/level/${id}`, { waitUntil: 'load' }).catch(() => {});
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__run, null, { timeout: 15000 }).catch(() => {});
  const kinds = (await page.evaluate(() => window.__run?.kinds)) ?? [];
  if (!kinds.length) add(id, 'carga', [['no-abre']]);
  for (let s = 0; s < kinds.length; s++) {
    const kind = kinds[s];
    if (kind === 'scene' || kind === 'forge') continue;
    await page.evaluate((i) => window.__run.goto(i), s);
    await page.waitForTimeout(60);
    if (kind === 'challenge') {
      for (let r = 0; r < 6; r++) {
        await page.waitForFunction(() => window.__round, null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(120);
        add(id, `${kind}-r${r}`, await audit());
        const more = await page.evaluate(() => {
          window.__round?.pass();
          return true;
        });
        if (!more) break;
        await settle();
        add(id, `${kind}-r${r}-ok`, await audit());
        await page.keyboard.press('Space');
        await page.waitForTimeout(120);
        if ((await page.evaluate(() => window.__run?.step)) !== s) break;
      }
      continue;
    }
    await page.waitForFunction(() => window.__demo, null, { timeout: 5000 }).catch(() => {});
    const n = (await page.evaluate(() => window.__demo?.count)) ?? 0;
    for (let b = 0; b < n; b++) {
      await page.evaluate((k) => window.__demo.goto(k), b);
      await page.waitForTimeout(90);
      add(id, `${kind}-${b}`, await audit());
      const before = await page.evaluate(() => {
        const d = window.__demo;
        return { locked: d.locked, key: d.rightKey };
      });
      if (before.locked || before.key) {
        if (before.key) await page.keyboard.press(String(before.key));
        await page.evaluate(() => window.__demo.unlock());
        await page.waitForTimeout(90);
        add(id, `${kind}-${b}-hecho`, await audit());
      }
    }
  }
  process.stderr.write(`${id} ${report[id]?.length ?? 0}\n`);
  fs.writeFileSync(REPORT, JSON.stringify({ errors: pageErrors, report }, null, 1));
}
await browser.close();
const all = Object.values(report).flat();
const by = {};
for (const r of all) by[r[1]] = (by[r[1]] ?? 0) + 1;
console.log(`${ids.length} casos en ${Math.round((Date.now() - t0) / 1000)} s · ${all.length} avisos`, by, pageErrors.length ? `· ${pageErrors.length} errores de página` : '');
