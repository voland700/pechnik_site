// Браузерные проверки ProductCard. Перед запуском: npm run preview -- --port 4321.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.PRODUCT_CARD_TEST_URL ?? 'http://127.0.0.1:4321/product-card/';
const SHOTS = '.tmp/shots';
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

async function newPage(width, height = 1200) {
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
  await page.waitForSelector('[data-product-card-initialized="true"]');
  return { page, errors, failedResponses };
}

const expectedColumns = { 375: 1, 576: 2, 768: 3, 1024: 4, 1200: 5, 1440: 5 };
for (const width of [375, 576, 768, 1024, 1200, 1440]) {
  const { page, errors, failedResponses } = await newPage(width);
  const metrics = await page.evaluate(() => {
    const card = document.querySelector('[data-demo-state="1"] .product-card');
    const quantity = card.querySelector('.product-card__quantity').getBoundingClientRect();
    const button = card.querySelector('.product-card__add-button').getBoundingClientRect();
    const quantityButton = card.querySelector('.product-card__quantity-button').getBoundingClientRect();
    const quantityInput = card.querySelector('.product-card__quantity-input').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cardOverflow: [...document.querySelectorAll('.product-card')].filter(
        (item) => item.scrollWidth > item.clientWidth + 1,
      ).length,
      columns: getComputedStyle(document.querySelector('.product-card-demo__grid')).gridTemplateColumns.split(' ').length,
      purchaseSameRow: Math.abs(quantity.top - button.top) < 2,
      quantityHeight: quantity.height,
      buttonHeight: button.height,
      quantityButtonWidth: quantityButton.width,
      quantityInputWidth: quantityInput.width,
      quantityButtonHeight: quantityButton.height,
      purchaseWidthDelta: Math.abs(quantity.width - button.width),
      actionsGap: Number.parseFloat(getComputedStyle(card.querySelector('.product-card__actions')).columnGap),
      addFontSize: Number.parseFloat(getComputedStyle(card.querySelector('.product-card__add-button')).fontSize),
    };
  });
  report(`${width}px: нет горизонтального переполнения`, metrics.overflow <= 0 && metrics.cardOverflow === 0, JSON.stringify(metrics));
  report(`${width}px: ${expectedColumns[width]} колонок`, metrics.columns === expectedColumns[width], `фактически ${metrics.columns}`);
  report(`${width}px: шрифт кнопки 0.85rem`, Math.abs(metrics.addFontSize - 13.6) < 0.01, `${metrics.addFontSize}px`);
  if (width >= 576) {
    report(`${width}px: gap панели покупки 4px`, metrics.actionsGap === 4, `${metrics.actionsGap}px`);
    report(`${width}px: количество и кнопка занимают по 50%`, metrics.purchaseWidthDelta <= 1, `разница ${metrics.purchaseWidthDelta}px`);
    report(`${width}px: высота контролов 35px`, Math.abs(metrics.quantityHeight - 35) < 1 && Math.abs(metrics.buttonHeight - 35) < 1, `${metrics.quantityHeight}/${metrics.buttonHeight}`);
    report(`${width}px: кнопки количества 35×35px`, Math.abs(metrics.quantityButtonWidth - 35) < 1 && Math.abs(metrics.quantityButtonHeight - 35) < 1, `${metrics.quantityButtonWidth}×${metrics.quantityButtonHeight}px`);
  }
  if (width >= 1200) {
    report(`${width}px: покупка в одну строку при пяти колонках`, metrics.purchaseSameRow);
  }
  report(`${width}px: нет ошибок JS и HTTP`, errors.length === 0 && failedResponses.length === 0, [...errors, ...failedResponses].join('; '));
  if ([375, 576, 768, 1024, 1200, 1440].includes(width)) {
    const name = width === 375 ? 'mobile' : width === 1440 ? 'desktop' : String(width);
    await page.screenshot({ path: `${SHOTS}/product-card-${name}.png`, fullPage: false });
  }
  await page.close();
}

const { page, errors, failedResponses } = await newPage(1440);

const structure = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-demo-state] .product-card')];
  const rect = (selector, card) => {
    const element = card.querySelector(selector);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    const media = card.querySelector('.product-card__media').getBoundingClientRect();
    return { left: box.left - media.left, right: media.right - box.right, top: box.top - media.top, bottom: media.bottom - box.bottom };
  };
  return {
    count: cards.length,
    images: cards.map((card) => {
      const image = card.querySelector('img');
      return { ok: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit };
    }),
    presentation: {
      mediaBackground: getComputedStyle(cards[0].querySelector('.product-card__media')).backgroundColor,
      mediaPadding: getComputedStyle(cards[0].querySelector('.product-card__media-link')).padding,
      titleAlign: getComputedStyle(cards[0].querySelector('.product-card__title-link')).textAlign,
      priceMinHeight: Number.parseFloat(getComputedStyle(cards[0].querySelector('.product-card__price')).minHeight),
      discountBorderStyle: getComputedStyle(cards[1].querySelector('.product-card__discount')).borderTopStyle,
      badgeFontSize: Number.parseFloat(getComputedStyle(cards[1].querySelector('.product-card__badge')).fontSize),
      badgesTop: Number.parseFloat(getComputedStyle(cards[1].querySelector('.product-card__badges')).top),
    },
    linksValid: cards.every((card) => {
      const links = [...card.querySelectorAll('a')];
      return links.length === 2 && links.every((link) => !link.querySelector('a') && document.querySelector(link.getAttribute('href')));
    }),
    badges: cards[5].querySelectorAll('.product-card__badge').length,
    discount: rect('.product-card__discount', cards[1]),
    availability: rect('.product-card__availability', cards[1]),
    orderAvailable: {
      stock: Boolean(cards[6].querySelector('.product-card__availability')),
      disabled: cards[6].querySelector('.product-card__add-button').disabled,
    },
    unavailable: {
      stock: Boolean(cards[7].querySelector('.product-card__availability')),
      controls: [...cards[7].querySelectorAll('.product-card__quantity-input, .product-card__quantity-button, .product-card__add-button')].every((control) => control.disabled),
    },
    request: {
      text: cards[8].querySelector('.product-card__price-request')?.textContent.trim(),
      oldPrice: Boolean(cards[8].querySelector('.product-card__old-price')),
      controls: [...cards[8].querySelectorAll('.product-card__quantity-input, .product-card__quantity-button, .product-card__add-button')].every((control) => control.disabled),
    },
    longTitle: {
      clamp: getComputedStyle(cards[9].querySelector('.product-card__title-link')).webkitLineClamp,
      length: cards[9].querySelector('.product-card__title-link').textContent.trim().length,
    },
  };
});
report('10 обязательных состояний', structure.count === 10);
report('Изображения загружены и используют contain', structure.images.every((image) => image.ok && image.fit === 'contain'));
report('Белый media-фон, нулевые отступы и центрированное название', structure.presentation.mediaBackground === 'rgb(255, 255, 255)' && structure.presentation.mediaPadding === '0px' && structure.presentation.titleAlign === 'center', JSON.stringify(structure.presentation));
report('Цена 3rem, скидка без border, лейблы 0.7rem и top 0.25rem', structure.presentation.priceMinHeight === 48 && structure.presentation.discountBorderStyle === 'none' && Math.abs(structure.presentation.badgeFontSize - 11.2) < 0.01 && structure.presentation.badgesTop === 4, JSON.stringify(structure.presentation));
report('Две независимые ссылки в каждой карточке', structure.linksValid);
report('Несколько лейблов показываются одновременно', structure.badges === 3);
report('Скидка закреплена снизу справа', structure.discount && structure.discount.right < 12 && structure.discount.bottom < 12);
report('Наличие закреплено снизу слева', structure.availability && structure.availability.left < 12 && structure.availability.bottom < 12);
report('inStock=false не блокирует покупку', !structure.orderAvailable.stock && !structure.orderAvailable.disabled);
report('canBuy=false отключает все контролы', structure.unavailable.stock && structure.unavailable.controls);
report('Цена по запросу скрывает старую цену и блокирует покупку', structure.request.text === 'Цена по запросу' && !structure.request.oldPrice && structure.request.controls);
report('Длинное название сохранено полностью и ограничено двумя строками', structure.longTitle.clamp === '2' && structure.longTitle.length > 100);

const input = '[data-demo-state="1"] [data-quantity-input]';
await page.click('[data-demo-state="1"] [data-quantity-action="increase"]');
report('Кнопка + увеличивает количество', await page.$eval(input, (element) => element.value) === '2');
await page.click('[data-demo-state="1"] [data-quantity-action="decrease"]');
await page.click('[data-demo-state="1"] [data-quantity-action="decrease"]');
report('Кнопка − не опускает количество ниже 1', await page.$eval(input, (element) => element.value) === '1');

for (const [raw, expected] of [['12', '12'], ['2.5', '1'], ['-4', '1'], ['', '1'], ['1000', '999']]) {
  await page.$eval(input, (element, value) => {
    element.value = value;
    element.dispatchEvent(new Event('blur'));
  }, raw);
  report(`Ручной ввод «${raw || 'пусто'}» → ${expected}`, await page.$eval(input, (element) => element.value) === expected);
}
report('Карточки независимы', await page.$eval('[data-demo-state="2"] [data-quantity-input]', (element) => element.value) === '1');

await page.evaluate(() => {
  window.__demoEvents = [];
  window.__demoRequests = 0;
  document.addEventListener('product-card:demo-submit', (event) => window.__demoEvents.push(event.detail));
});
await page.$eval(input, (element) => { element.value = '2'; });
await page.click('[data-demo-state="1"] .product-card__add-button');
const submit = await page.evaluate(() => ({
  events: window.__demoEvents,
  output: document.querySelector('[data-demo-state="1"] [data-product-card-output]').textContent,
}));
report('Submit передаёт productId и quantity', submit.events.length === 1 && submit.events[0].productId === '1001' && submit.events[0].quantity === 2, JSON.stringify(submit.events));
report('Показывается техническая обратная связь', submit.output.includes('productId=1001') && submit.output.includes('quantity=2'));

await page.evaluate(() => {
  document.querySelector('[data-demo-state="8"] [data-product-card-form]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
});
report('Disabled-форма не создаёт demo-событий', await page.evaluate(() => window.__demoEvents.length) === 1);

await page.focus('[data-demo-state="1"] .product-card__add-button');
await page.keyboard.press('Tab');
await page.keyboard.down('Shift');
await page.keyboard.press('Tab');
await page.keyboard.up('Shift');
const focusVisible = await page.$eval('[data-demo-state="1"] .product-card__add-button', (element) => {
  const style = getComputedStyle(element);
  return document.activeElement === element && element.matches(':focus-visible') && style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2;
});
report('Видимый keyboard focus', focusVisible);

const layout = await page.evaluate(() => {
  const measure = (card) => {
    const quantity = card.querySelector('.product-card__quantity').getBoundingClientRect();
    const button = card.querySelector('.product-card__add-button').getBoundingClientRect();
    const quantityButton = card.querySelector('.product-card__quantity-button').getBoundingClientRect();
    const input = card.querySelector('.product-card__quantity-input').getBoundingClientRect();
    return {
      sameRow: Math.abs(quantity.top - button.top) < 2,
      stacked: button.top >= quantity.bottom - 1,
      width: card.getBoundingClientRect().width,
      height: quantity.height,
      quantityButtonWidth: quantityButton.width,
      inputWidth: input.width,
    };
  };
  const container = document.querySelector('.product-card-demo__narrow');
  const card = container.querySelector('.product-card');
  container.style.width = '340px';
  const wide = measure(card);
  container.style.width = '210px';
  const narrow = measure(card);
  return { wide, narrow };
});
report('Широкая карточка: количество и кнопка в одной строке', layout.wide.sameRow && layout.wide.inputWidth > layout.wide.quantityButtonWidth, JSON.stringify(layout.wide));
report('Узкая карточка: кнопка переносится вниз, контролы 40px', layout.narrow.stacked && Math.abs(layout.narrow.height - 40) < 1 && Math.abs(layout.narrow.quantityButtonWidth - 40) < 1, JSON.stringify(layout.narrow));
await page.$eval('.product-card-demo__narrow', (element) => element.scrollIntoView({ block: 'center' }));
await new Promise((resolve) => setTimeout(resolve, 100));
const narrow = await page.$('.product-card-demo__narrow');
await narrow.screenshot({ path: `${SHOTS}/product-card-narrow.png` });

await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
report('prefers-reduced-motion отключает переходы', await page.$eval('.product-card', (element) => getComputedStyle(element).transitionDuration === '0s'));

const performance = await page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  return { requests: entries.length, transferKB: Math.round(entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024) };
});
console.log(`INFO Загрузка демо: ${performance.requests} ресурсов, ${performance.transferKB} KB transfer`);
report('Нет ошибок после всех взаимодействий', errors.length === 0 && failedResponses.length === 0, [...errors, ...failedResponses].join('; '));

await page.close();
await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n=== Итого: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
