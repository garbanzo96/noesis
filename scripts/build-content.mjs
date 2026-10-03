import fs from 'node:fs';
import path from 'node:path';
const worlds = JSON.parse(fs.readFileSync('src/content/worlds.json', 'utf8')).sort(
  (a, b) => a.number - b.number,
);
const chapters = {},
  lessons = [];
const ids = new Set();
for (const world of worlds) {
  const directory = path.join('src/worlds', world.id);
  const chapter = JSON.parse(fs.readFileSync(path.join(directory, 'chapter.json'), 'utf8'));
  const units = JSON.parse(fs.readFileSync(path.join(directory, 'lessons.json'), 'utf8'));
  if (chapter.teachingStages.length !== 5 || chapter.missions.length !== 3)
    throw Error(`Estructura de mundo inválida: ${world.id}`);
  for (const item of [...chapter.teachingStages, ...chapter.missions, ...units]) {
    if (ids.has(item.id)) throw Error(`ID duplicado: ${item.id}`);
    ids.add(item.id);
  }
  if (!units.every((l) => l.world === world.id))
    throw Error(`Lecciones en mundo incorrecto: ${world.id}`);
  chapters[world.id] = chapter;
  lessons.push(...units);
}
fs.writeFileSync('src/content/chapters.json', JSON.stringify(chapters, null, 2) + '\n');
fs.writeFileSync('src/content/lessons.json', JSON.stringify(lessons, null, 2) + '\n');
console.log(
  `${worlds.length} mundos, ${lessons.length} cápsulas, ${Object.values(chapters).reduce((n, c) => n + c.missions.length, 0)} misiones. Contenido compilado.`,
);
