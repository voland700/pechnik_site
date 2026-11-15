// Браузерные проверки FeaturedProductsTabs.
// Перед запуском: npm run preview -- --port 4321.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.FEATURED_PRODUCTS_TEST_URL ?? 'http://127.0.0.1:4321/';
const SHOTS = '.tmp/shots';
const EXPECTED_CATEGORIES = [
  'Печи для бани',
  'Грили и мангалы',
  'Печное литьё',
  'Аксессуары',
  'Посуда',
  'Отопительные печи',
  'Печи-камины',
  'Кирпич и смеси',
];
const EXPECTED_COUNTS = [10, 10, 10, 10, 6, 6, 8, 8];
const EXPECTED_COLUMNS = { 320: 1, 360: 1, 390: 1, 430: 2, 576: 2, 768: 3, 1024: 4, 1200: 5, 1440: 5, 1920: 5 };
mkdirSync(SHOTS, { recursive: true });

const results = [];
function report(name, pass, extra = '') {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

async function newPage(width = 1440, height = 1200) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const errors = [];
  const failedResponses = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-featured-tabs][data-featured-tabs-initialized="true"]');
  return { page, errors, failedResponses };
}

// --- Сетка, однострочные вкладки и переполнение на всех ширинах ТЗ ---------------
for (const [widthText, expectedColumns] of Object.entries(EXPECTED_COLUMNS)) {
  const width = Number(widthText);
  const { page, errors, failedResponses } = await newPage(width);
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('[data-featured-tabs]');
    const tablist = root.querySelector('[data-featured-tablist]');
    const tabs = [...root.querySelectorAll('[data-featured-tab]')];
    const grid = root.querySelector('.featured-products__panel:not([hidden]) .featured-products__grid');
    const cards = [...grid.querySelectorAll('.product-card')];
    const firstTop = cards[0].getBoundingClientRect().top;
    return {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cards: cards.length,
      firstRowCards: cards.filter((card) => Math.abs(card.getBoundingClientRect().top - firstTop) < 2).length,
      cardOverflow: cards.filter((card) => card.scrollWidth > card.clientWidth + 1).length,
      controlsVisible: cards.every((card) => {
        const input = card.querySelector('[data-quantity-input]');
        const button = card.querySelector('.product-card__add-button');
        return input.getBoundingClientRect().width > 0 && button.getBoundingClientRect().height > 0;
      }),
      flexWrap: getComputedStyle(tablist).flexWrap,
      overflowX: getComputedStyle(tablist).overflowX,
      tabOverflow: tablist.scrollWidth > tablist.clientWidth,
      tabsSameRow: tabs.every((tab) => Math.abs(tab.getBoundingClientRect().top - tabs[0].getBoundingClientRect().top) < 2),
      visiblePanels: root.querySelectorAll('.featured-products__panel:not([hidden])').length,
    };
  });
  report(`${width}px: сетка ${expectedColumns} колонок`, metrics.columns === expectedColumns, JSON.stringify(metrics));
  report(`${width}px: нет переполнения страницы и карточек`, metrics.pageOverflow <= 0 && metrics.cardOverflow === 0);
  report(`${width}px: 10 карточек, одна панель, покупка доступна`, metrics.cards === 10 && metrics.visiblePanels === 1 && metrics.controlsVisible);
  report(`${width}px: вкладки в одной строке с overflow-x auto`, metrics.flexWrap === 'nowrap' && metrics.overflowX === 'auto' && metrics.tabsSameRow);
  if (width <= 390) {
    report(`${width}px: навигация действительно прокручивается`, metrics.tabOverflow);
  }
  if (width >= 1200) {
    report(`${width}px: ровно пять ProductCard в первом ряду`, metrics.firstRowCards === 5);
  }
  report(`${width}px: нет ошибок JS и HTTP`, errors.length === 0 && failedResponses.length === 0, [...errors, ...failedResponses].join('; '));

  if ([390, 1200, 1440].includes(width)) {
    const section = await page.$('[data-featured-tabs]');
    await section.screenshot({ path: `${SHOTS}/featured-products-${width}.png` });
  }
  await page.close();
}

// --- Данные, начальное состояние и ARIA -------------------------------------------
{
  const { page, errors, failedResponses } = await newPage(1440);
  const structure = await page.evaluate(() => {
    const root = document.querySelector('[data-featured-tabs]');
    const tabs = [...root.querySelectorAll('[data-featured-tab]')];
    const panels = [...root.querySelectorAll('[data-featured-panel]')];
    const ids = [...root.querySelectorAll('[id]')].map((element) => element.id);
    return {
      names: tabs.map((tab) => tab.textContent.trim()),
      counts: panels.map((panel) => panel.querySelectorAll('.product-card').length),
      totalCards: root.querySelectorAll('.product-card').length,
      uniqueIds: new Set(ids).size === ids.length,
      activeTab: tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
      activeClass: tabs[0].classList.contains('active'),
      activePanel: panels[0].classList.contains('behold'),
      hiddenPanels: panels.slice(1).every((panel) => panel.hidden),
      rovingTabindex: tabs.every((tab, index) => tab.tabIndex === (index === 0 ? 0 : -1)),
      ariaLinks: tabs.every((tab, index) => tab.getAttribute('aria-controls') === panels[index].id)
        && panels.every((panel, index) => panel.getAttribute('aria-labelledby') === tabs[index].id),
      roles: root.querySelector('[role="tablist"]') !== null
        && tabs.every((tab) => tab.getAttribute('role') === 'tab')
        && panels.every((panel) => panel.getAttribute('role') === 'tabpanel'),
      badPrice: root.querySelector('#product-123 .product-card__current-price')?.textContent.trim(),
      imageMaxWidth: getComputedStyle(root.querySelector('.product-card__image')).maxWidth,
      imageMaxHeight: getComputedStyle(root.querySelector('.product-card__image')).maxHeight,
    };
  });
  report('Восемь категорий в исходном порядке', structure.names.join('|') === EXPECTED_CATEGORIES.join('|'), structure.names.join('|'));
  report('68 карточек; лимит и исходное количество соблюдены', structure.totalCards === 68 && structure.counts.join(',') === EXPECTED_COUNTS.join(','), structure.counts.join(','));
  report('Первая вкладка активна, остальные панели hidden', structure.activeTab === 0 && structure.activeClass && structure.activePanel && structure.hiddenPanels);
  report('ARIA Tabs, связи id и roving tabindex корректны', structure.ariaLinks && structure.roles && structure.rovingTabindex && structure.uniqueIds);
  report('Цена id=123 сохранена без исправления', structure.badPrice === '5 3000 руб.', structure.badPrice);
  report('Изображение ProductCard ограничено 100% по ширине и высоте', structure.imageMaxWidth === '100%' && structure.imageMaxHeight === '100%', `${structure.imageMaxWidth} / ${structure.imageMaxHeight}`);

  // Циклическая клавиатурная навигация с автоматической активацией.
  await page.focus('[data-featured-tab="0"]');
  await page.keyboard.press('ArrowRight');
  let keyboard = await page.evaluate(() => ({
    selected: document.querySelector('[data-featured-tab][aria-selected="true"]')?.dataset.featuredTab,
    focused: document.activeElement?.dataset.featuredTab,
    panel: document.querySelector('[data-featured-panel].behold')?.dataset.featuredPanel,
  }));
  report('ArrowRight активирует и фокусирует следующую вкладку', keyboard.selected === '1' && keyboard.focused === '1' && keyboard.panel === '1');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  keyboard = await page.evaluate(() => ({
    selected: document.querySelector('[data-featured-tab][aria-selected="true"]')?.dataset.featuredTab,
    focused: document.activeElement?.dataset.featuredTab,
  }));
  report('ArrowLeft циклически переходит к последней вкладке', keyboard.selected === '7' && keyboard.focused === '7');
  await page.keyboard.press('Home');
  report('Home выбирает первую вкладку', await page.$eval('[data-featured-tab="0"]', (tab) => tab.getAttribute('aria-selected') === 'true'));
  await page.keyboard.press('End');
  report('End выбирает последнюю вкладку', await page.$eval('[data-featured-tab="7"]', (tab) => tab.getAttribute('aria-selected') === 'true'));
  await page.keyboard.press('Tab');
  report('Tab переходит в активную панель, а не на соседнюю вкладку', await page.evaluate(() => document.activeElement.closest('[data-featured-panel]')?.dataset.featuredPanel === '7'));

  // Количество и DOM карточки сохраняются после возврата на вкладку.
  await page.evaluate(() => document.querySelector('[data-featured-tab="0"]').click());
  await page.click('[data-featured-panel="0"] [data-quantity-action="increase"]');
  await page.$eval('[data-featured-panel="0"] .product-card', (card) => { card.__featuredTestMarker = true; });
  await page.evaluate(() => document.querySelector('[data-featured-tab="1"]').click());
  await page.evaluate(() => document.querySelector('[data-featured-tab="0"]').click());
  const preserved = await page.$eval('[data-featured-panel="0"] .product-card', (card) => ({
    quantity: card.querySelector('[data-quantity-input]').value,
    sameDom: card.__featuredTestMarker === true,
  }));
  report('Количество и DOM карточки сохраняются при переключении', preserved.quantity === '2' && preserved.sameDom, JSON.stringify(preserved));

  // В исходных данных обе категории занимают два ряда: 10 и 6 товаров.
  // Переход 2 → 1 ряд отдельно проверяется на временном fixture из 5 товаров.
  const tallHeight = await page.$eval('[data-featured-panel="0"]', (panel) => panel.getBoundingClientRect().height);
  await page.evaluate(() => document.querySelector('[data-featured-tab="4"]').click());
  const shortHeight = await page.$eval('[data-featured-panel="4"]', (panel) => panel.getBoundingClientRect().height);
  const hiddenHaveNoSize = await page.$$eval('[data-featured-panel][hidden]', (panels) => panels.every((panel) => panel.getBoundingClientRect().height === 0));
  const secondPanelRows = await page.$eval('[data-featured-panel="4"] .featured-products__grid', (grid) => {
    const tops = new Set([...grid.querySelectorAll('.product-card')].map((card) => Math.round(card.getBoundingClientRect().top)));
    return tops.size;
  });
  report('Высота естественная: 6 товаров = 2 ряда, скрытые панели не занимают место', secondPanelRows === 2 && Math.abs(shortHeight - tallHeight) < 2 && hiddenHaveNoSize, `${tallHeight.toFixed(0)} → ${shortHeight.toFixed(0)}`);

  // Анимация появления и reduced motion.
  const animation = await page.$eval('[data-featured-panel="4"]', (panel) => ({
    name: getComputedStyle(panel).animationName,
    duration: getComputedStyle(panel).animationDuration,
  }));
  report('Активная панель имеет появление 0.5s', animation.name === 'featured-products-occurrence' && animation.duration === '0.5s', JSON.stringify(animation));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluate(() => document.querySelector('[data-featured-tab="5"]').click());
  report('prefers-reduced-motion отключает анимацию', await page.$eval('[data-featured-panel="5"]', (panel) => getComputedStyle(panel).animationName === 'none'));

  // Все изображения открываются после первого показа соответствующей панели.
  let imagesOk = true;
  for (let index = 0; index < EXPECTED_CATEGORIES.length; index += 1) {
    await page.evaluate((tabIndex) => document.querySelector(`[data-featured-tab="${tabIndex}"]`).click(), index);
    await page.waitForFunction((panelIndex) => {
      const images = [...document.querySelectorAll(`[data-featured-panel="${panelIndex}"] .product-card__image`)];
      return images.every((image) => image.complete && image.naturalWidth > 0);
    }, { timeout: 10000 }, index).catch(() => { imagesOk = false; });
  }
  report('Все 68 изображений загружаются при открытии панелей', imagesOk);
  report('Нет ошибок после клавиатуры, вкладок и карточек', errors.length === 0 && failedResponses.length === 0, [...errors, ...failedResponses].join('; '));
  await page.close();
}

// --- Автопрокрутка без вертикального смещения документа ----------------------------
{
  const { page, errors, failedResponses } = await newPage(390);
  await page.$eval('[data-featured-tabs]', (root) => root.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  await page.focus('[data-featured-tab="0"]');
  await new Promise((resolve) => setTimeout(resolve, 700));
  const before = await page.evaluate(() => window.scrollY);
  // Первые четыре панели содержат по 10 товаров: их одинаковая высота
  // исключает влияние изменения размеров документа на вертикальный scrollY.
  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press('ArrowRight');
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
  const after = await page.evaluate(() => {
    const list = document.querySelector('[data-featured-tablist]');
    const tab = document.querySelector('[data-featured-tab="3"]');
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      scrollLeft: list.scrollLeft,
      visible: tabRect.left >= listRect.left - 1 && tabRect.right <= listRect.right + 1,
    };
  });
  report('Стрелки автоматически прокручивают выбранную вкладку в видимую область', after.visible && after.scrollLeft > 0, JSON.stringify(after));
  // До 1rem на небольшую браузерную компенсацию позиции сфокусированной кнопки.
  report('Горизонтальная автопрокрутка без существенного вертикального смещения', Math.abs(after.scrollY - before) <= 16, `${before} → ${after.scrollY}`);
  report('Mobile: нет ошибок JS и HTTP', errors.length === 0 && failedResponses.length === 0, [...errors, ...failedResponses].join('; '));
  await page.close();
}

// --- Progressive enhancement без JavaScript ---------------------------------------
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const fallback = await page.evaluate(() => {
    const root = document.querySelector('[data-featured-tabs]');
    const panels = [...root.querySelectorAll('[data-featured-panel]')];
    return {
      cards: root.querySelectorAll('.product-card').length,
      visiblePanels: panels.filter((panel) => getComputedStyle(panel).display !== 'none').length,
      headingsVisible: panels.every((panel) => getComputedStyle(panel.querySelector('.featured-products__panel-title')).display !== 'none'),
      tabsHidden: getComputedStyle(root.querySelector('[data-featured-tablist]')).display === 'none',
    };
  });
  report('Без JS доступны все 68 товаров и восемь секций без дублирования', fallback.cards === 68 && fallback.visiblePanels === 8 && fallback.headingsVisible && fallback.tabsHidden, JSON.stringify(fallback));
  await page.close();
}

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n=== Итого: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
