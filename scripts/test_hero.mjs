// Браузерные тесты рекламного блока HeroShowcase (Hero Slider + баннеры).
// Запуск: npx astro preview --port 4321 (в отдельном терминале), затем
//         node scripts/test_hero.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:4321/';
const SHOTS = '.tmp/shots';

mkdirSync(SHOTS, { recursive: true });

const results = [];
function report(name, pass, extra = '') {
  results.push(pass);
  console.log(`${pass ? 'PASS ' : 'FAIL '} ${name}${extra ? ` — ${extra}` : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

async function newPage(width, height = 900) {
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

const rects = (page, selector) =>
  page.$$eval(selector, (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );

// --- 1. Переполнение и композиции на всех ширинах ТЗ ----------------------------
for (const width of [390, 576, 768, 1024, 1200, 1440, 1920]) {
  const { page, errors } = await newPage(width);
  await page.waitForSelector('.hero-banner__image');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  report(`${width}px: нет горизонтального переполнения`, overflow <= 0, `delta=${overflow}`);
  report(`${width}px: нет ошибок JS`, errors.length === 0, errors.join('; '));

  const [slider] = await rects(page, '.hero-showcase__slider');
  const banners = await rects(page, '.hero-showcase__banner');
  report(`${width}px: 4 баннера в DOM`, banners.length === 4);

  const approx = (a, b, tol = 2) => Math.abs(a - b) <= tol;

  if (width >= 1200) {
    const left = [banners[0], banners[1]];
    const right = [banners[2], banners[3]];
    report(
      `${width}px: баннеры 1-2 слева, 3-4 справа, слайдер по центру`,
      left.every((b) => b.x + b.w <= slider.x + 1) &&
        right.every((b) => b.x >= slider.x + slider.w - 1),
    );
    report(
      `${width}px: боковые колонки одинаковой ширины`,
      approx(left[0].w, right[0].w) && approx(left[0].w, left[1].w),
      `${left[0].w.toFixed(0)} vs ${right[0].w.toFixed(0)}`,
    );
    report(
      `${width}px: суммарная высота баннеров = высоте слайдера`,
      approx(left[0].h + left[1].h + 20, slider.h, 3),
      `баннеры ${(left[0].h + left[1].h + 20).toFixed(0)}, слайдер ${slider.h.toFixed(0)}`,
    );
    report(
      `${width}px: баннеры в колонке одинаковой высоты`,
      approx(left[0].h, left[1].h) && approx(right[0].h, right[1].h),
    );
    await page.screenshot({ path: `${SHOTS}/hero-${width}.png` });
  } else if (width >= 768) {
    const row1sameY = approx(banners[0].y, banners[1].y);
    const row2sameY = approx(banners[2].y, banners[3].y);
    report(
      `${width}px: слайдер сверху на всю ширину, баннеры под ним`,
      slider.y < banners[0].y && banners.every((b) => approx(b.w, (slider.w - 16) / 2, 24)),
    );
    report(
      `${width}px: сетка 2×2, равные размеры, порядок 1,2 / 3,4`,
      row1sameY && row2sameY && banners[1].y < banners[2].y &&
        banners.every((b) => approx(b.h, banners[0].h)),
    );
    await page.screenshot({ path: `${SHOTS}/hero-${width}.png` });
  } else {
    const ordered = banners.every((b, i) => i === 0 || b.y > banners[i - 1].y);
    report(
      `${width}px: баннеры под слайдером в один столбец, порядок 1→4`,
      slider.y < banners[0].y && ordered && banners.every((b) => approx(b.w, slider.w)),
    );
    await page.screenshot({ path: `${SHOTS}/hero-${width}.png` });
  }
  await page.close();
}

// --- 2. Содержимое баннеров -----------------------------------------------------
{
  const { page } = await newPage(1440);
  const data = await page.$$eval('.hero-banner', (els) =>
    els.map((el) => ({
      tag: el.tagName,
      href: el.getAttribute('href'),
      title: el.querySelector('.hero-banner__title')?.textContent?.trim(),
      text: el.querySelector('.hero-banner__text')?.textContent?.trim(),
      imgOk: el.querySelector('img')?.naturalWidth > 0,
      plaqueBg: getComputedStyle(el.querySelector('.hero-banner__title')).backgroundColor,
      upper: getComputedStyle(el.querySelector('.hero-banner__title')).textTransform,
    })),
  );
  report(
    'Баннеры: заголовки из JSON',
    data.map((d) => d.title).join('|') ===
      'Грили и мангалы|Каминные топки|Печи-камины|Банные печи',
  );
  report('Баннеры: описания выведены, <br> работает', data.every((d) => d.text?.length > 0));
  report('Баннеры: изображения загружены', data.every((d) => d.imgOk));
  report(
    'Баннеры: все кликабельны (ссылки), нет пустых href',
    data.every((d) => d.tag === 'A' && d.href && d.href !== '#'),
  );
  report(
    'Баннеры: сланцевая плашка, uppercase',
    data.every((d) => d.plaqueBg === 'rgb(79, 90, 108)' && d.upper === 'uppercase'),
  );
  const duplicated = await page.evaluate(
    () => document.querySelectorAll('.hero-banner').length !== 4,
  );
  report('Баннеры: нет дублирования DOM', !duplicated);
  const inSwiper = await page.evaluate(
    () => !!document.querySelector('.swiper .hero-banner'),
  );
  report('Баннеры: не зависят от Swiper (вне .swiper)', !inSwiper);

  // Hover-эффект
  await page.hover('.hero-showcase__banner--1');
  await new Promise((r) => setTimeout(r, 350));
  const zoomed = await page.$eval('.hero-showcase__banner--1 img', (el) =>
    getComputedStyle(el).transform.includes('matrix'),
  );
  report('Баннеры: hover масштабирует изображение', zoomed);
  await page.screenshot({
    path: `${SHOTS}/hero-banner-hover.png`,
    clip: { x: 0, y: 0, width: 1440, height: 520 },
  });
  await page.close();
}

// --- 3. Swiper: конфигурация и поведение ----------------------------------------
{
  const { page, errors } = await newPage(1440);
  await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);

  const params = await page.evaluate(() => {
    const s = document.querySelector('[data-hero-slider]').swiper;
    return {
      effect: s.params.effect,
      crossFade: s.params.fadeEffect.crossFade,
      parallax: s.params.parallax === true || s.params.parallax?.enabled === true,
      speed: s.params.speed,
      autoplayRunning: s.autoplay?.running ?? false,
      slides: s.slides.filter((el) => !el.classList.contains('swiper-slide-duplicate')).length,
      bullets: document.querySelectorAll('.hero-slider .swiper-pagination-bullet').length,
    };
  });
  report('Swiper: effect fade + crossFade', params.effect === 'fade' && params.crossFade === true);
  report('Swiper: parallax включён', params.parallax === true);
  report('Swiper: speed 1000 мс', params.speed === 1000);
  report('Swiper: autoplay запущен', params.autoplayRunning === true);
  report('Swiper: 4 слайда, 4 буллета', params.slides === 4 && params.bullets === 4);

  const parallaxAttrs = await page.$$eval('.hero-slider__slide:first-child [data-swiper-parallax-opacity], .hero-slider__slide:first-child [data-swiper-parallax]', (els) => els.length);
  report('Swiper: parallax-атрибуты на слоях слайда', parallaxAttrs >= 5, `${parallaxAttrs} слоёв`);

  // Стрелки скрыты по умолчанию, появляются при наведении на .swiper-wrapper
  const navHidden = await page.$eval('.hero-slider__nav--next', (el) => {
    const cs = getComputedStyle(el);
    return cs.opacity === '0' && cs.pointerEvents === 'none';
  });
  await page.hover('[data-hero-slider] .swiper-wrapper');
  await new Promise((r) => setTimeout(r, 350));
  const navShown = await page.$eval('.hero-slider__nav--next', (el) => {
    const cs = getComputedStyle(el);
    return cs.opacity === '1' && cs.pointerEvents === 'auto';
  });
  report('Swiper: стрелки скрыты, появляются при наведении на wrapper', navHidden && navShown);

  // Fade-переключение: активный слайд меняется, промежуточные opacity плавные
  const before = await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex);
  await page.click('.hero-slider__nav--next');
  await new Promise((r) => setTimeout(r, 1200));
  const after = await page.evaluate(() => {
    const s = document.querySelector('[data-hero-slider]').swiper;
    const active = s.slides[s.activeIndex];
    return { index: s.realIndex, opacity: getComputedStyle(active).opacity };
  });
  report('Swiper: стрелка переключает слайд', after.index === (before + 1) % 4);
  report('Swiper: активный слайд полностью видим после fade', after.opacity === '1');

  // Inert на неактивных слайдах
  const inertOk = await page.evaluate(() => {
    const s = document.querySelector('[data-hero-slider]').swiper;
    return s.slides.every(
      (slide) =>
        slide.classList.contains('swiper-slide-active') !== slide.hasAttribute('inert'),
    );
  });
  report('A11y: неактивные слайды inert', inertOk);

  // Клавиатура
  await page.evaluate(() => document.querySelector('[data-hero-slider]').scrollIntoView());
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 1200));
  const keyIndex = await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex);
  report('Swiper: клавиатура (ArrowRight)', keyIndex === (after.index + 1) % 4);

  // Autoplay: пауза при наведении, возобновление при уходе
  // (сначала уводим курсор за пределы слайдера, чтобы был честный mouseenter)
  await page.mouse.move(10, 850);
  await new Promise((r) => setTimeout(r, 200));
  await page.hover('[data-hero-slider]');
  await new Promise((r) => setTimeout(r, 300));
  const paused = await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.autoplay.paused === true);
  await page.mouse.move(10, 700);
  await new Promise((r) => setTimeout(r, 300));
  const resumed = await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.autoplay.paused === false);
  report('Swiper: autoplay пауза при наведении и возобновление', paused && resumed);

  // Пагинация кликабельна
  await page.click('.hero-slider .swiper-pagination-bullet:nth-child(1)');
  await new Promise((r) => setTimeout(r, 1200));
  const pagIndex = await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex);
  report('Swiper: пагинация переключает слайды', pagIndex === 0);

  report('Swiper: нет ошибок JS за сессию', errors.length === 0, errors.join('; '));
  await page.screenshot({ path: `${SHOTS}/hero-slide-2.png`, clip: { x: 0, y: 0, width: 1440, height: 520 } });
  await page.close();
}

// --- 4. Reduced motion ------------------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);
  const rm = await page.evaluate(() => {
    const s = document.querySelector('[data-hero-slider]').swiper;
    return {
      speed: s.params.speed,
      parallax: s.params.parallax === true || s.params.parallax?.enabled === true,
      autoplay: s.autoplay?.running ?? false,
    };
  });
  report(
    'Reduced motion: без parallax/autoplay, мгновенное переключение',
    rm.speed === 0 && rm.parallax === false && rm.autoplay === false,
    JSON.stringify(rm),
  );
  await page.close();
}

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n=== Итого: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
