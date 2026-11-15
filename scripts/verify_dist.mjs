// Статическая проверка production-результата без запуска сервера.
import { access, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const required = ['css/style.css', 'css/style.min.css', 'js/main.js', 'index.html', 'product-card/index.html'];
const results = [];

function report(name, pass, extra = '') {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
}

for (const file of required) {
  try {
    await access(join(dist, file));
    report(`Существует dist/${file}`, true);
  } catch {
    report(`Существует dist/${file}`, false);
  }
}

const demo = await readFile(join(dist, 'product-card/index.html'), 'utf8');
const css = await readFile(join(dist, 'css/style.css'), 'utf8');
const js = await readFile(join(dist, 'js/main.js'), 'utf8');

report('Демо использует минифицированный CSS', demo.includes('/css/style.min.css'));
report('Демо использует dist/js/main.js', demo.includes('/js/main.js'));
report('Демо содержит 11 карточек', (demo.match(/<article\b[^>]*data-product-card\b/g) ?? []).length === 11);
report('Нет пустых ссылок-заглушек href="#"', !demo.includes('href="#"'));
report('Container Queries попали в CSS', css.includes('@container product-card'));
report('Demo custom event попал в JS', js.includes('product-card:demo-submit'));

const imagePaths = [...demo.matchAll(/src="(\/assets\/images\/products\/[^"]+)"/g)].map((match) => match[1]);
report('Найдены изображения всех карточек', imagePaths.length === 11, `${imagePaths.length} шт.`);
report(
  'Все локальные изображения существуют',
  imagePaths.every((src) => existsSync(join(dist, src))),
);

const passed = results.filter(Boolean).length;
console.log(`\n=== Итого: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
