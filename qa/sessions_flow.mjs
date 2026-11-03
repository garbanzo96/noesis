// The whole path of a new player, in the browser or in the packaged app.
//   node qa/sessions_flow.mjs                    (frozen QA build in qa/snap, Chrome)
//   node qa/sessions_flow.mjs --app <executable> (installed or unpacked desktop app)
// Exits 1 on the first broken expectation. Screenshots in qa/out/sessions/.
import { _electron, chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT = new URL('./out/sessions/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const appPath = process.argv[process.argv.indexOf('--app') + 1];
const desktop = process.argv.includes('--app');

let page;
let close;
let restart = null;
const errors = [];
const watch = (p) => {
  p.on('pageerror', (e) => errors.push(e.message));
  // the only expected one: the 400 of the escape attempt below
  p.on(
    'console',
    (m) => m.type() === 'error' && !m.text().includes('status of 400') && errors.push(m.text()),
  );
};
if (desktop) {
  // a throwaway profile folder, so the test never touches a real player's progress
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'noesis-flow-'));
  const launch = async () => {
    const app = await _electron.launch({
      executablePath: appPath,
      args: ['--no-sandbox', `--user-data-dir=${userData}`],
    });
    page = await app.firstWindow();
    watch(page);
    close = () => app.close();
  };
  await launch();
  restart = async () => {
    await close();
    await launch();
  };
} else {
  const SNAP = new URL('./snap/', import.meta.url).pathname;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 860 },
    acceptDownloads: true,
  });
  await ctx.route('http://snap.local/**', (route) => {
    const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
    return route.fulfill({
      path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html'),
    });
  });
  page = await ctx.newPage();
  watch(page);
  await page.goto('http://snap.local/index.html#/', { waitUntil: 'networkidle' });
  close = () => browser.close();
}
const shot = (n) => page.screenshot({ path: `${OUT}${desktop ? 'app-' : ''}${n}.png` });
const text = (sel) => page.locator(sel).first().innerText();
const hash = () => page.evaluate(() => location.hash);
const step = (s) => console.log('ok', s);

await page.waitForSelector('.sessions h1');
assert.equal(await text('.sessions h1'), 'Abre tu expediente');
await page.waitForTimeout(600);
await shot('1-primera-vez');
step('primera vez: pide abrir expediente');

await page.click('.session-form button[type=submit]');
assert.match(await text('.session-error'), /nombre/);
step('no acepta un nombre vacío');

await page.fill('.session-field input', 'Ana');
await page.click('.session-form button[type=submit]');
await page.waitForSelector('.title-screen .logo');
assert.match(await text('.title-meta'), /Ana · Modo aventura/);
await shot('2-titulo');
step('sesión creada en modo aventura');

// the art and fonts must load in every packaging
const art = await page.evaluate(async () => {
  const img = document.querySelector('.title-bg img, img.place-art');
  if (!img) return 'sin imagen';
  await img.decode().catch(() => {});
  return img.naturalWidth > 0 ? 'ok' : `no cargó ${img.src}`;
});
assert.equal(art, 'ok');
step('el arte carga');

await page.evaluate(() => {
  location.hash = '#/level/w5-c1';
});
await page.waitForFunction(() => location.hash === '#/atlas');
await page.waitForSelector('.citymap');
await page.waitForTimeout(800);
await shot('3-mapa-aventura');
step('un caso cerrado devuelve al mapa');

await page.evaluate(() => {
  location.hash = '#/sector/foundations';
});
await page.waitForSelector('.case-card2');
await page.waitForTimeout(800);
assert.equal(await page.locator('.case-card2.locked').count(), 8);
await shot('4-tablero-aventura');
step('en el Mundo 1 solo el primer caso está abierto');

await page.keyboard.press('Escape');
await page
  .locator('button', { hasText: /Ajustes|⚙/ })
  .first()
  .click()
  .catch(() => {});
await page.waitForSelector('.settings', { timeout: 3000 }).catch(async () => {
  await page.evaluate(() => {
    location.hash = '#/';
  });
  await page.locator('.title-menu .btn', { hasText: 'Ajustes' }).click();
  await page.waitForSelector('.settings');
});
await page.selectOption('.settings select >> nth=1', 'complete').catch(async () => {
  await page.locator('.settings select').last().selectOption('complete');
});
await shot('5-ajustes');
assert.equal(await page.locator('.case-card2.locked').count(), 0);
step('el modo completo abre todo');

if (!desktop) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.settings button', { hasText: 'Guardar una copia' }).click(),
  ]);
  const copy = OUT + 'copia.json';
  await download.saveAs(copy);
  assert.match(download.suggestedFilename(), /^noesis-ana-/);
  await page.locator('.settings button', { hasText: 'Cambiar sesión' }).click();
  await page.waitForSelector('.session-list');
  page.once('dialog', (d) => d.accept());
  await page.click('.session-del');
  await page.waitForFunction(() => !document.querySelector('.session-list'));
  await page.setInputFiles('.session-actions input[type=file]', copy);
  await page.waitForSelector('.title-screen .logo');
  assert.match(await text('.title-meta'), /Ana · Modo completo/);
  step('una copia guardada recupera la sesión borrada');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.title-screen .logo');
} else {
  const escape = await page.evaluate(() =>
    fetch('noesis://game/..%2f..%2fpackage.json').then((r) => r.status),
  );
  assert.equal(escape, 400);
  step('el servidor interno no sale de la carpeta del juego');
  await restart();
  await page.waitForSelector('.title-screen .logo');
  step('la sesión sigue al cerrar y abrir la aplicación');
}
assert.match(await text('.title-meta'), /Ana · Modo completo/);
step('la sesión y su modo se recuerdan');

// sound needs a user gesture: a click must not raise errors in the audio graph
await page.locator('.title-menu .btn', { hasText: 'Mapa' }).click();
await page.waitForSelector('.citymap');
await page.waitForTimeout(1200);

await close();
assert.deepEqual(errors, []);
console.log('flujo completo sin errores');
