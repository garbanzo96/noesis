import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const media = JSON.parse(fs.readFileSync('src/content/media.json', 'utf8'));
for (const scene of media.scenes) {
  const filename = path.join('public/media', scene.src),
    buffer = fs.readFileSync(filename);
  if (
    buffer.length !== scene.bytes ||
    crypto.createHash('sha256').update(buffer).digest('hex') !== scene.sha256
  )
    throw Error(`Video alterado: ${scene.id}`);
  if (!fs.existsSync(path.join('public/media', scene.poster)))
    throw Error(`Poster ausente: ${scene.id}`);
  if (
    !scene.stages.every(
      (s, i) => s.at >= 0 && s.at < scene.duration && (i === 0 || s.at > scene.stages[i - 1].at),
    )
  )
    throw Error(`Cronología inválida: ${scene.id}`);
}
console.log(`${media.scenes.length} videos: hashes, posters y cronologías correctos.`);
