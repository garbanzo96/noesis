// Removes CSS rules whose every selector needs a class that no source file mentions.
// Usage: node qa/css_dead.mjs [--write]   Classes built at runtime are protected by DYNAMIC.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const DYNAMIC = /^(tone-|ghost-|mood-|ap-|lc-|k-|katex|mord|mbin|mrel|mop|mopen|mclose|mpunct|frac-line|cC|cA|cM|cG|cR)/;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p) : /\.(tsx?|html)$/.test(p) ? [p] : [];
});
const source = [...walk('src'), 'index.html'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const used = (c) => DYNAMIC.test(c) || new RegExp(`(^|[^\\w-])${c}([^\\w-]|$)`).test(source);
const write = process.argv.includes('--write');
let removed = 0;
const names = new Set();
for (const f of ['src/styles/game.css', 'src/styles/v5.css', 'src/styles/screens-mobile.css']) {
  const root = postcss.parse(fs.readFileSync(f, 'utf8'));
  root.walkRules((rule) => {
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    const keep = rule.selectors.filter((sel) => {
      const dead = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter((c) => !used(c));
      dead.forEach((c) => names.add(c));
      return dead.length === 0;
    });
    if (keep.length === rule.selectors.length) return;
    removed++;
    if (keep.length) rule.selectors = keep;
    else rule.remove();
  });
  root.walkAtRules((a) => {
    if (a.name === 'media' && a.nodes?.length === 0) a.remove();
  });
  if (write) fs.writeFileSync(f, root.toString());
}
console.log(`${names.size} clases sin uso · ${removed} reglas afectadas`);
console.log([...names].sort().join(' '));
