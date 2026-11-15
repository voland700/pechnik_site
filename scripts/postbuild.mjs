/**
 * Постобработка production-сборки:
 * 1. Создаёт минифицированный dist/css/style.min.css из dist/css/style.css.
 * 2. Переключает <link rel="stylesheet"> в HTML на минифицированный вариант.
 * 3. Переносит клиентский JS-бандл в dist/js/main.js с предсказуемым именем
 *    и обновляет ссылку на него в HTML.
 *    Неминифицированный style.css остаётся в dist для отладки и CMS-интеграции.
 */
import { readdir, readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { transform } from 'esbuild';

const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const cssDir = join(distDir, 'css');
const jsDir = join(distDir, 'js');
const assetsDir = join(distDir, 'assets');

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nested = await htmlFiles(join(dir, entry.name));
      files.push(...nested.map((file) => join(entry.name, file)));
    } else if (entry.name.endsWith('.html')) {
      files.push(entry.name);
    }
  }
  return files;
}

async function main() {
  // --- 1–2. CSS ---
  const cssFiles = (await readdir(cssDir)).filter((f) => f.endsWith('.css'));
  if (!cssFiles.includes('style.css')) {
    throw new Error(
      `postbuild: не найден dist/css/style.css (найдено: ${cssFiles.join(', ') || 'ничего'})`,
    );
  }

  const css = await readFile(join(cssDir, 'style.css'), 'utf8');
  const minified = await transform(css, { loader: 'css', minify: true });
  await writeFile(join(cssDir, 'style.min.css'), minified.code, 'utf8');
  console.log(
    `css/style.css ${kb(Buffer.byteLength(css))} -> css/style.min.css ${kb(Buffer.byteLength(minified.code))}`,
  );

  // --- 3. JS entry -> js/main.js; динамические чанки остаются в assets/ ---
  await mkdir(jsDir, { recursive: true });
  const jsFiles = (await readdir(assetsDir)).filter((f) => f.endsWith('.js'));
  const html = await htmlFiles(distDir);
  const entryNames = new Set();
  for (const file of html) {
    const source = await readFile(join(distDir, file), 'utf8');
    for (const match of source.matchAll(/<script\b[^>]*\bsrc="\/assets\/([^"]+\.js)"/g)) {
      entryNames.add(match[1]);
    }
  }
  if (entryNames.size !== 1) {
    throw new Error(
      `postbuild: ожидалась одна JS-точка входа в HTML, найдено: ${[...entryNames].join(', ') || 'ничего'}`,
    );
  }

  const jsName = [...entryNames][0];
  if (!jsFiles.includes(jsName)) {
    throw new Error(`postbuild: не найдена JS-точка входа dist/assets/${jsName}`);
  }

  // После переноса entry в js/ относительные import() должны по-прежнему
  // вести в assets/, где Rollup оставляет динамические чанки.
  const jsSource = await readFile(join(assetsDir, jsName), 'utf8');
  const jsContent = jsSource
    .replaceAll('import("./', 'import("../assets/')
    .replaceAll("import('./", "import('../assets/")
    .replaceAll('from"./', 'from"../assets/')
    .replaceAll("from'./", "from'../assets/");
  await writeFile(join(jsDir, 'main.js'), jsContent, 'utf8');
  await unlink(join(assetsDir, jsName));
  console.log(
    `assets/${jsName} -> js/main.js (${kb(Buffer.byteLength(jsContent))}); чанков в assets: ${jsFiles.length - 1}`,
  );

  // --- Обновление ссылок в HTML ---
  for (const file of await htmlFiles(distDir)) {
    const path = join(distDir, file);
    const html = await readFile(path, 'utf8');
    const updated = html
      .replaceAll('/css/style.css', '/css/style.min.css')
      .replaceAll(`/assets/${jsName}`, '/js/main.js');
    if (updated !== html) {
      await writeFile(path, updated, 'utf8');
      console.log(`${file}: ссылки обновлены (css/style.min.css, js/main.js)`);
    }
  }

  // --- Сводка ---
  for (const [dir, label] of [
    [cssDir, 'css'],
    [jsDir, 'js'],
    [assetsDir, 'assets'],
  ]) {
    for (const file of (await readdir(dir)).sort()) {
      const info = await stat(join(dir, file));
      console.log(`  ${label}/${file} — ${kb(info.size)}`);
    }
  }
}

await main();
