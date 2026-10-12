// Headless QA: node qa/shot.mjs '<json spec>' | spec.json
// spec: { url, viewport?, storage?, steps: [{wait|key|keys|click|clickText|clickSel|dragStage|clickStage|eval|shot}] }
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const arg = process.argv[2];
const spec = JSON.parse(fs.existsSync(arg) ? fs.readFileSync(arg, 'utf8') : arg);
const out = new URL('./out/', import.meta.url).pathname;
const storage = spec.storage ?? JSON.parse(fs.readFileSync(new URL('./storage.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: spec.viewport?.[0] ?? 1440, height: spec.viewport?.[1] ?? 860 } });
await ctx.addInitScript((s) => { try { localStorage.setItem('noesis.v3', s); if (!location.search.includes('coach')) localStorage.setItem('noesis.coach.lesson', '1'); } catch {} }, JSON.stringify(storage));
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto(spec.url, { waitUntil: 'networkidle' });
const toClient = (pts) => page.evaluate(([a, b, c, d]) => {
  const el = document.querySelector('.stage-svg');
  const r = el.getBoundingClientRect();
  const k = Math.min(r.width / 1600, r.height / 900);
  const ox = r.left + (r.width - 1600 * k) / 2, oy = r.top + (r.height - 900 * k) / 2;
  return [ox + a * k, oy + b * k, ox + c * k, oy + d * k];
}, pts);
for (const st of spec.steps ?? []) {
  if (st.wait) await page.waitForTimeout(st.wait);
  if (st.key) await page.keyboard.press(st.key);
  if (st.keys) for (const k of st.keys) { await page.keyboard.press(k); await page.waitForTimeout(st.gap ?? 150); }
  if (st.click) await page.mouse.click(st.click[0], st.click[1]);
  if (st.clickText) await page.getByText(st.clickText, { exact: false }).first().click();
  if (st.clickSel) await page.locator(st.clickSel).first().click();
  if (st.dragStage) { const c = await toClient(st.dragStage); await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.mouse.move(c[2], c[3], { steps: 12 }); await page.mouse.up(); }
  if (st.clickStage) { const c = await toClient([...st.clickStage, ...st.clickStage]); await page.mouse.click(c[0], c[1]); }
  if (st.eval) { const r = await page.evaluate(st.eval); if (r !== undefined) console.log('EVAL', JSON.stringify(r)); }
  if (st.shot) await page.screenshot({ path: out + st.shot });
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
