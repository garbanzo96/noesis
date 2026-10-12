// Walk every beat of a demo step and screenshot each: node qa/walk.mjs <levelId> <prefix> [step=1]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [, , id, prefix = 'w', demoStep = '1'] = process.argv;
const out = new URL('./out/', import.meta.url).pathname;
const storage = fs.readFileSync(new URL('./storage.json', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
await ctx.addInitScript((s) => { localStorage.setItem('noesis.v3', s); if (!location.search.includes('coach')) localStorage.setItem('noesis.coach.lesson', '1'); }, storage);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:8765/?step=${demoStep}#/level/${id}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const count = await page.evaluate(() => window.__demo?.count ?? 0);
for (let b = 0; b < count; b++) {
  await page.waitForTimeout(2300);
  await page.screenshot({ path: `${out}${prefix}-b${b}.png` });
  const hasAsk = await page.evaluate(() => !!document.querySelector('.ask-options'));
  if (hasAsk) { const k = await page.evaluate(() => window.__demo?.rightKey || 1); await page.keyboard.press(String(k)); await page.waitForTimeout(1400); await page.screenshot({ path: `${out}${prefix}-b${b}r.png` }); }
  await page.evaluate(() => window.__demo?.unlock?.());
  await page.waitForTimeout(1500);
  const still = await page.evaluate(() => window.__demo?.beat);
  if (still === b) await page.keyboard.press('Space');
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
