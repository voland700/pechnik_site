// Браузерные тесты витрины категорий (CategoryShowcase).
// Запуск: npx astro preview --port 4321 (в отдельном терминале), затем
//         node scripts/test_showcase.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SHOWCASE_TEST_URL ?? 'http://localhost:4321/';
const SHOTS = '.tmp/shots';

mkdirSync(SHOTS, { recursive: true });

const results = [];
function report(name, pass, extra = '') {
  results.push(pass);
  console.log(`${pass ? 'PASS ' : 'FAIL '} ${name}${extra ? ` — ${extra}` : ''}`);
}

const EXPECTED_NAMES = [
  'Топки и облицовки', 'Печи-камины', 'Печной кирпич, печные смеси',
  'Каминное и печное литьё (Чугун)', 'Печи для бани', 'Дымоходы',
  'Отопительные печи', 'Печи тандыры', 'Изоляция для печей и каминов',
  'Уличные печи гриль, барбекю и мангалы', 'Мангальные вставки, коптильни для барбекю',
  'Отливки из хромистого чугуна (ЧХ-18)', 'Плиты под казан', 'Чугунные варочные плиты',
  'Усиленные колосниковые решётки', 'Посуда и кухонная утварь',
  'Аксессуары для каминов и печей', 'Камни для бани и сауны',
  'Материалы для монтажа печей', 'Дрова для печей и каминов',
  'Котлы отопления', 'Термометры для печей',
];

// ширина → ожидаемое число колонок
const GRID = { 360: 2, 390: 2, 576: 2, 768: 3, 1024: 4, 1200: 5, 1440: 5, 1920: 5 };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

async function newPage(width, height = 1400) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  return { page, errors };
}

// --- Сетка и переполнение на всех ширинах ТЗ --------------------------------------
for (const [widthText, cols] of Object.entries(GRID)) {
  const width = Number(widthText);
  const { page, errors } = await newPage(width);
  await page.waitForSelector('.category-card__image');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  report(`${width}px: нет горизонтального переполнения`, overflow <= 0, `delta=${overflow}`);

  const actualCols = await page.evaluate(() => {
    const grid = document.querySelector('.category-showcase__grid');
    return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  });
  report(`${width}px: сетка ${cols} колонок`, actualCols === cols, `фактически ${actualCols}`);
  report(`${width}px: нет ошибок JS`, errors.length === 0, errors.join('; '));

  await page.screenshot({ path: `${SHOTS}/showcase-${width}.png`, fullPage: false });
  await page.close();
}

// --- Содержимое и разметка ---------------------------------------------------------
{
  const { page } = await newPage(1440);
  await page.waitForSelector('.category-card__image');

  const names = await page.$$eval('.category-card__title', (els) =>
    els.map((el) => el.textContent.trim()),
  );
  report('22 категории в исходном порядке', names.join('|') === EXPECTED_NAMES.join('|'), `${names.length} шт.`);

  const heading = await page.$eval('.category-showcase__heading', (el) => ({
    tag: el.tagName,
    text: el.textContent.trim(),
  }));
  report('Заголовок секции H2 «Каталог товаров»', heading.tag === 'H2' && heading.text === 'Каталог товаров');

  // Изображение и название — ссылки (заглушка href="#" до CMS)
  const cardLinks = await page.$$eval('.category-card', (cards) =>
    cards.map((card) => ({
      links: card.querySelectorAll('a').length,
      hrefs: Array.from(card.querySelectorAll('a')).map((a) => a.getAttribute('href')),
    })),
  );
  report(
    'Карточки: изображение и название — ссылки',
    cardLinks.every((c) => c.links === 2 && c.hrefs.every((h) => h && h.length > 0)),
  );

  // Hover: плавное затемнение рамки карточки
  const borderBefore = await page.$eval('.category-card', (el) => getComputedStyle(el).borderColor);
  await page.hover('.category-card');
  await new Promise((r) => setTimeout(r, 350));
  const borderAfter = await page.$eval('.category-card', (el) => getComputedStyle(el).borderColor);
  report(
    'Hover: рамка затемняется до #c9c9c9',
    borderAfter === 'rgb(201, 201, 201)' && borderBefore !== borderAfter,
    `${borderBefore} → ${borderAfter}`,
  );

  // Размер шрифта названия 1rem
  const titleFont = await page.$eval('.category-card__title', (el) => getComputedStyle(el).fontSize);
  report('Название: font-size 1rem (16px)', titleFont === '16px', titleFont);

  // Все области изображений квадратные и одинакового размера
  const media = await page.$$eval('.category-card__media', (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }),
  );
  const sameSize = media.every(
    (mItem) => Math.abs(mItem.w - media[0].w) < 1 && Math.abs(mItem.h - media[0].h) < 1,
  );
  const square = media.every((mItem) => Math.abs(mItem.w - mItem.h) < 1.5);
  report('Изображения: все области одинакового квадратного размера', sameSize && square, `${media[0].w.toFixed(0)}×${media[0].h.toFixed(0)}`);

  // Изображения: загружены, contain, центрированы
  const imgs = await page.$$eval('.category-card__image', (els) =>
    els.map((el) => ({
      ok: el.complete && el.naturalWidth > 0,
      fit: getComputedStyle(el).objectFit,
      pos: getComputedStyle(el).objectPosition,
      lazy: el.loading === 'lazy',
      maxWidth: getComputedStyle(el).maxWidth,
      maxHeight: getComputedStyle(el).maxHeight,
    })),
  );
  report('Изображения: все 22 загружены', imgs.every((i) => i.ok));
  report(
    'Изображения: object-fit contain, center, lazy',
    imgs.every((i) => i.fit === 'contain' && (i.pos === 'center' || i.pos === '50% 50%') && i.lazy),
  );
  report(
    'Изображения категорий: max-width и max-height 80%',
    imgs.every((i) => i.maxWidth === '80%' && i.maxHeight === '80%'),
  );

  // Длинные названия: без nowrap/ellipsis, текст не обрезан
  const titles = await page.$$eval('.category-card__title', (els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      return {
        nowrap: cs.whiteSpace === 'nowrap',
        ellipsis: cs.textOverflow === 'ellipsis',
        clamped: cs.webkitLineClamp && cs.webkitLineClamp !== 'none',
        clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      };
    }),
  );
  report(
    'Названия: полные, без nowrap/ellipsis/clamp/обрезки',
    titles.every((t) => !t.nowrap && !t.ellipsis && !t.clamped && !t.clipped),
  );

  // Одинаковая высота карточек в первой строке (5 колонок)
  const rowHeights = await page.$$eval('.category-showcase__item', (els) =>
    els.slice(0, 5).map((el) => el.getBoundingClientRect().height),
  );
  report(
    'Карточки строки одинаковой высоты (desktop)',
    rowHeights.every((h) => Math.abs(h - rowHeights[0]) < 1.5),
    rowHeights.map((h) => h.toFixed(0)).join('/'),
  );

  // Последняя строка: 2 карточки не растянуты на всю ширину
  const lastRow = await page.$$eval('.category-showcase__item', (els) => {
    const items = Array.from(els);
    const last = items.slice(-2).map((el) => el.getBoundingClientRect());
    const first = items[0].getBoundingClientRect();
    return { lastW: last.map((r) => r.width), cardW: first.width };
  });
  report(
    'Последняя строка из 2 карточек не растянута',
    lastRow.lastW.every((w) => Math.abs(w - lastRow.cardW) < 1.5),
  );

  await page.screenshot({ path: `${SHOTS}/showcase-1440-full.png`, fullPage: false });
  await page.close();
}

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n=== Итого: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
