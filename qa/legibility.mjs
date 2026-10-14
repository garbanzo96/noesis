// Legibility audit on a frozen QA build (npx vite build --mode qa --outDir qa/snap), served from
// disk through Playwright (no server). For every lesson beat, investigation beat and practice
// round of the given worlds it records:
//   - labels whose box spills out of the panel/card that contains them (overflow)
//   - a JPEG of the stage with labels hidden + label boxes, so qa/legibility.py can measure
//     how busy the drawing is under each label (text over lines, curves or bars)
// Usage: node qa/legibility.mjs w1,w2 [1440x860] > qa/out/leg-w1.json
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const worlds = (process.argv[2] ?? 'w1').split(',');
const [VW, VH] = (process.argv[3] ?? '1440x860').split('x').map(Number);
const SNAP = new URL('./snap/', import.meta.url).pathname;
const OUT = new URL('./out/leg/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const saved = JSON.parse(fs.readFileSync(new URL('./storage.json', import.meta.url), 'utf8'));
// reduced motion: animations jump to their final state, so the audit sees the settled layout
const storage = JSON.stringify({ ...saved, settings: { ...(saved.settings ?? {}), reducedMotion: true } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH } });
await ctx.route('http://snap.local/**', (route) => {
  const u = new URL(route.request().url());
  const f = path.join(SNAP, decodeURIComponent(u.pathname));
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ path: f });
  return route.fulfill({ path: path.join(SNAP, 'index.html') });
});
await ctx.addInitScript((s) => { localStorage.setItem('noesis.v3', s); }, storage);
const page = await ctx.newPage();
const BASE = 'http://snap.local/index.html';

const audit = () => page.evaluate(() => {
  const stage = document.querySelector('.stage');
  if (!stage) return null;
  const sr = stage.getBoundingClientRect();
  const labels = [...document.querySelectorAll('.stage-overlay .stage-html')].filter((e) => {
    const st = getComputedStyle(e);
    return Number(st.opacity) > 0.05 && e.textContent.trim().length > 0 && !e.querySelector('button,input,textarea');
  });
  const boxes = labels.map((e) => {
    // measure the ink, not the wrapper
    const kids = [...e.querySelectorAll('.katex-html, span, b, i, em, strong, small')].filter((k) => k.children.length === 0 || k.classList.contains('katex-html'));
    let r = e.getBoundingClientRect();
    if (kids.length) {
      const rs = kids.map((k) => k.getBoundingClientRect()).filter((q) => q.width > 0 && q.height > 0);
      if (rs.length) r = { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) };
    }
    return { t: e.textContent.trim().slice(0, 48), x0: r.left - sr.left, y0: r.top - sr.top, x1: r.right - sr.left, y1: r.bottom - sr.top };
  });
  const svg = stage.querySelector('svg');
  const shapes = svg ? [...svg.querySelectorAll('rect, path, polygon, circle, ellipse')].filter((el) => {
    const st = getComputedStyle(el);
    const fill = st.fill;
    if (!fill || fill === 'none' || fill === 'transparent' || fill.startsWith('url(')) return false;
    if (Number(st.fillOpacity) * Number(st.opacity) < 0.25) return false;
    const r = el.getBoundingClientRect();
    return r.width > 30 && r.height > 18 && r.width < sr.width * 0.95;
  }).map((el) => { const r = el.getBoundingClientRect(); return { x0: r.left - sr.left, y0: r.top - sr.top, x1: r.right - sr.left, y1: r.bottom - sr.top }; }) : [];
  const overflow = [];
  for (const b of boxes) {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const area = (b.x1 - b.x0) * (b.y1 - b.y0);
    for (const s of shapes) {
      const sa = (s.x1 - s.x0) * (s.y1 - s.y0);
      if (sa < area * 1.3) continue;
      if (cx < s.x0 || cx > s.x1 || cy < s.y0 || cy > s.y1) continue;
      const out = Math.max(s.x0 - b.x0, b.x1 - s.x1, s.y0 - b.y0, b.y1 - s.y1);
      if (out > 3) { overflow.push([b.t, Math.round(out)]); break; }
    }
  }
  return { w: sr.width, h: sr.height, boxes, overflow };
});

const shoot = async (name) => {
  await page.evaluate(() => { const o = document.querySelector('.stage-overlay'); if (o) o.style.visibility = 'hidden'; });
  await page.locator('.stage').first().screenshot({ path: OUT + name, type: 'jpeg', quality: 72 });
  await page.evaluate(() => { const o = document.querySelector('.stage-overlay'); if (o) o.style.visibility = ''; });
};

await page.goto(BASE + '#/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const levels = await page.evaluate(() => window.__levels ?? null);
if (!levels) { console.error('window.__levels missing: build with --mode qa'); process.exit(1); }
const report = [];
for (const lv of levels.filter((l) => worlds.some((w) => l.id === w || l.id.startsWith(w + '-')))) {
  for (const [k, kind] of lv.steps.entries()) {
    if (kind !== 'lesson' && kind !== 'demo' && kind !== 'challenge') continue;
    await page.goto(`${BASE}?step=${k}#/level/${lv.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const n = kind === 'challenge' ? lv.rounds[k] : await page.evaluate(() => window.__demo?.count ?? 0);
    for (let b = 0; b < n; b++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(kind === 'lesson' ? 1100 : 800);
      if (kind !== 'challenge') {
        const ask = await page.evaluate(() => window.__demo?.rightKey || 0);
        if (ask) { await page.keyboard.press(String(ask)); await page.waitForTimeout(500); }
      }
      let r = null;
      try { r = await audit(); } catch { r = null; }
      if (r) {
        const name = `${lv.id}-${k}-${b}.jpg`;
        if (process.env.WITHLABELS) { try { await page.locator('.stage').first().screenshot({ path: OUT + name.replace('.jpg', '-L.jpg'), type: 'jpeg', quality: 80 }); } catch {} }
        try { await shoot(name); } catch {}
        report.push({ id: lv.id, step: kind, k, at: b, shot: name, ...r });
      }
      if (kind === 'challenge') {
        await page.evaluate(() => window.__round?.pass());
        await page.waitForTimeout(400);
        await page.keyboard.press('Space');
        await page.waitForTimeout(600);
      } else {
        await page.evaluate(() => window.__demo?.unlock?.());
        await page.waitForTimeout(250);
        const still = await page.evaluate(() => window.__demo?.beat);
        if (still === b) await page.keyboard.press('Space');
        await page.waitForTimeout(400);
      }
    }
  }
}
console.log(JSON.stringify(report));
await browser.close();
