// Record the score in every mood plus the feedback sounds, and print level stats per mood.
// Usage: node qa/listen.mjs   (needs the frozen QA build: npx vite build --mode qa --outDir qa/snap)
// Writes qa/out/audio/<mood>.webm and feedback.webm.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = new URL('./out/audio/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const SNAP = new URL('./snap/', import.meta.url).pathname;
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.route('http://snap.local/**', (route) => {
  const f = path.join(SNAP, decodeURIComponent(new URL(route.request().url()).pathname));
  return route.fulfill({
    path: fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(SNAP, 'index.html'),
  });
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://snap.local/index.html#/', { waitUntil: 'networkidle' });
await page.mouse.click(5, 5);
await page.waitForTimeout(500);
await page.evaluate(() => {
  const { tap } = window.__audio;
  const { ctx, master } = tap();
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  master.connect(an);
  const dest = ctx.createMediaStreamDestination();
  master.connect(dest);
  window.__rec = { an, dest };
});
async function take(name, ms, during) {
  await page.evaluate(() => {
    const { dest } = window.__rec;
    const chunks = [];
    const r = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
    r.ondataavailable = (e) => chunks.push(e.data);
    r.start();
    window.__rec.r = r;
    window.__rec.chunks = chunks;
    window.__rec.stats = { peak: 0, sum: 0, n: 0 };
    const buf = new Float32Array(2048);
    window.__rec.iv = setInterval(() => {
      window.__rec.an.getFloatTimeDomainData(buf);
      for (const v of buf) {
        window.__rec.stats.peak = Math.max(window.__rec.stats.peak, Math.abs(v));
        window.__rec.stats.sum += v * v;
        window.__rec.stats.n++;
      }
    }, 40);
  });
  if (during) await during();
  await page.waitForTimeout(ms);
  const b64 = await page.evaluate(
    () =>
      new Promise((res) => {
        clearInterval(window.__rec.iv);
        window.__rec.r.onstop = async () => {
          const blob = new Blob(window.__rec.chunks, { type: 'audio/webm' });
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let s = '';
          for (let i = 0; i < bytes.length; i += 0x8000)
            s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          res({ b64: btoa(s), stats: window.__rec.stats });
        };
        window.__rec.r.stop();
      }),
  );
  fs.writeFileSync(OUT + name + '.webm', Buffer.from(b64.b64, 'base64'));
  const { peak, sum, n } = b64.stats;
  console.log(
    name.padEnd(10),
    'peak',
    peak.toFixed(3),
    'rms',
    Math.sqrt(sum / Math.max(1, n)).toFixed(4),
  );
}
const moods = (process.argv[2] ?? 'title,map,scene,lesson,demo,challenge,boss,results').split(',');
for (const [i, m] of moods.entries()) {
  await page.evaluate(
    ([m, w]) => {
      window.__audio.music.world(w);
      window.__audio.music.mood(m);
    },
    [m, i % 2 ? 5 : 0],
  );
  await page.waitForTimeout(3000);
  await take(m, 12000);
}
await page.evaluate(() => window.__audio.music.mood('challenge'));
await page.waitForTimeout(2000);
await take('feedback', 9000, async () => {
  const seq = [
    ['ok', 0],
    ['ok', 1],
    ['ok', 2],
    ['bad'],
    ['hint'],
    ['unlock'],
    ['select'],
    ['advance'],
    ['complete'],
  ];
  for (const [f, a] of seq) {
    await page.evaluate(([f, a]) => window.__audio.sfx[f](a), [f, a]);
    await page.waitForTimeout(900);
  }
});
console.log('errors', errors);
await browser.close();
