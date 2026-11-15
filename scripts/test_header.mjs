/**
 * Браузерное тестирование Header (ТЗ §20) через puppeteer-core + системный Chrome.
 * Запуск: node scripts/test_header.mjs (нужен запущенный astro preview на :4321).
 * Скриншоты сохраняются в .tmp/shots/.
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = fileURLToPath(new URL('../.tmp/shots/', import.meta.url));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

await mkdir(SHOTS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu'],
});

const page = await browser.newPage();
page.on('pageerror', (err) => check(`JS error: ${err.message}`, false));
page.on('console', (msg) => {
  // 404 предварительных маршрутов (/search/ и др.) — ожидаемо на этом этапе
  if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
    check(`console.error: ${msg.text()}`, false);
  }
});

// --- Матрица ширин -----------------------------------------------------------
const widths = [390, 768, 1024, 1440, 1920];
for (const w of widths) {
  await page.setViewport({ width: w, height: 1000 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${SHOTS}header-${w}.png` });

  const state = await page.evaluate(() => {
    const cs = (sel) => getComputedStyle(document.querySelector(sel)).display;
    return {
      hoverflow: document.documentElement.scrollWidth > window.innerWidth,
      topbar: cs('.topbar'),
      burger: cs('.header__burger'),
      desktopSearch: cs('.header__search'),
      mobileSearch: cs('.header__search-row'),
      stores: cs('.stores'),
      tels: document.querySelectorAll('.stores a[href^="tel:"]').length,
    };
  });
  check(`${w}px: нет горизонтального переполнения`, !state.hoverflow);
  if (w < 992) {
    check(`${w}px: мобильная компоновка (бургер + строка поиска)`,
      state.burger === 'flex' && state.mobileSearch === 'block' && state.topbar === 'none');
  } else {
    check(`${w}px: desktop (topbar, поиск в строке, оба магазина, ${state.tels} тел.)`,
      state.topbar === 'block' && state.desktopSearch === 'flex' &&
      state.stores === 'block' && state.tels === 4);
  }
}

// --- Начальное состояние ------------------------------------------------------
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(BASE, { waitUntil: 'networkidle0' });
const initial = await page.evaluate(() => ({
  stuck: document.querySelector('.header').classList.contains('header--stuck'),
  hoursText: document.querySelector('.header [data-working-hours-text]')?.textContent,
  hoursHidden: document.querySelector('.header [data-working-hours-status]')?.hidden,
  badge: document.querySelector('.cart-link__badge')?.textContent.trim(),
}));
check('Начальное состояние: без header--stuck', !initial.stuck);
check('Статус магазина вычислен по Москве', initial.hoursText === 'Сейчас работаем' || initial.hoursText === 'Магазин закрыт', initial.hoursText);
check('Статус показан после JS', !initial.hoursHidden);
check('Счётчик корзины = 7 (props)', initial.badge === '7');

// --- Sticky при прокрутке ------------------------------------------------------
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForFunction(() => window.scrollY > 1400);
await new Promise((r) => setTimeout(r, 300));
const sticky = await page.evaluate(() => {
  const h = document.querySelector('.header');
  return {
    top: Math.round(h.getBoundingClientRect().top),
    stuck: h.classList.contains('header--stuck'),
    topbarBottom: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom),
    storesBottom: Math.round(document.querySelector('.stores').getBoundingClientRect().bottom),
    searchVisible: document.querySelector('.header__search').getBoundingClientRect().top >= 0,
  };
});
await page.screenshot({ path: `${SHOTS}header-sticky-1440.png` });
check('Sticky: основная строка прилипла к верху (top=0)', sticky.top === 0, `top=${sticky.top}`);
check('Sticky: добавлен класс header--stuck (тень)', sticky.stuck);
check('Sticky: topbar и контакты прокрутились', sticky.topbarBottom <= 0 && sticky.storesBottom <= 0);
check('Sticky: поиск и корзина доступны', sticky.searchVisible);

// Sticky на мобильной: поиск остаётся в закреплённой зоне
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForFunction(() => window.scrollY > 700);
const stickyM = await page.evaluate(() => ({
  top: Math.round(document.querySelector('.header').getBoundingClientRect().top),
  searchRowTop: Math.round(document.querySelector('.header__search-row').getBoundingClientRect().top),
  searchRowVisible: getComputedStyle(document.querySelector('.header__search-row')).display === 'block',
}));
await page.screenshot({ path: `${SHOTS}header-sticky-390.png` });
check('Mobile sticky: строка прилипла, поиск в закреплённой зоне',
  stickyM.top === 0 && stickyM.searchRowVisible && stickyM.searchRowTop >= 0);

// --- Мобильное меню -------------------------------------------------------------
const menu = await page.evaluate(() => {
  const burger = document.querySelector('[data-menu-open]');
  burger.click();
  return new Promise((r) => setTimeout(() => {
    r({
      open: document.querySelector('.mobile-menu').classList.contains('mobile-menu--open'),
      aria: burger.getAttribute('aria-expanded'),
      noScroll: document.body.classList.contains('no-scroll'),
      focusInside: document.querySelector('.mobile-menu__panel').contains(document.activeElement),
      overlayOpacity: getComputedStyle(document.querySelector('.mobile-menu__overlay')).opacity,
      panelTransform: getComputedStyle(document.querySelector('.mobile-menu__panel')).transform,
      menuTels: document.querySelectorAll('.mobile-menu a[href^="tel:"]').length,
      menuLinks: document.querySelectorAll('.mobile-menu__link').length,
      menuCallback: !!document.querySelector('.mobile-menu [data-action="callback"]'),
      menuAccount: !!document.querySelector('.mobile-menu .account-link'),
      menuHours: !!document.querySelector('.mobile-menu [data-working-hours]'),
    });
  }, 500));
});
await page.screenshot({ path: `${SHOTS}mobile-menu-390.png` });
check('Меню: открывается по бургеру, aria-expanded=true', menu.open && menu.aria === 'true');
check('Меню: блокировка фоновой прокрутки', menu.noScroll);
check('Меню: фокус перемещён внутрь панели', menu.focusInside);
check('Меню: панель выехала (transform), overlay виден', menu.panelTransform !== 'none' && menu.overlayOpacity === '1');
check('Меню: 7 пунктов, вход, обратный звонок, график, 4 телефона',
  menu.menuLinks === 7 && menu.menuAccount && menu.menuCallback && menu.menuHours && menu.menuTels === 4);

// Закрытие по Escape
const esc = await page.evaluate(() => {
  document.activeElement.blur?.();
  document.querySelector('.mobile-menu__panel').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  return new Promise((r) => setTimeout(() => {
    r({
      closed: !document.querySelector('.mobile-menu').classList.contains('mobile-menu--open'),
      scrollBack: !document.body.classList.contains('no-scroll'),
      aria: document.querySelector('[data-menu-open]').getAttribute('aria-expanded'),
      focusBack: document.activeElement === document.querySelector('[data-menu-open]'),
    });
  }, 500));
});
check('Меню: закрытие по Escape, aria-expanded=false', esc.closed && esc.aria === 'false');
check('Меню: прокрутка и фокус возвращены', esc.scrollBack && esc.focusBack);

// Открытие → закрытие по overlay
const overlay = await page.evaluate(() => {
  document.querySelector('[data-menu-open]').click();
  return new Promise((r) => setTimeout(() => {
    document.querySelector('.mobile-menu__overlay').click();
    setTimeout(() => {
      r({ closed: !document.querySelector('.mobile-menu').classList.contains('mobile-menu--open') });
    }, 500);
  }, 500));
});
check('Меню: закрытие по клику на overlay', overlay.closed);

// --- Поиск (HTML-форма) ----------------------------------------------------------
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.type('#search-desktop', 'кирпич');
await Promise.all([
  page.waitForNavigation({ waitUntil: 'load' }).catch(() => null),
  page.keyboard.press('Enter'),
]);
check('Поиск: отправка по Enter на /search/?q=', page.url().includes('/search') && page.url().includes('q=%D0%BA%D0%B8%D1%80%D0%BF%D0%B8%D1%87'), page.url());

// --- Счётчик корзины: 0 и 100 -----------------------------------------------------
await page.goto(BASE, { waitUntil: 'networkidle0' });
const badge = await page.evaluate(() => {
  const b = document.querySelector('.cart-link__badge');
  const link = document.querySelector('.cart-link');
  const res = {};
  b.textContent = '0';
  link.classList.remove('cart-link--filled');
  res.zeroBg = getComputedStyle(b).backgroundColor;
  b.textContent = '100';
  link.classList.add('cart-link--filled');
  res.hundredBg = getComputedStyle(b).backgroundColor;
  res.hundredFits = b.getBoundingClientRect().width >= 24;
  return res;
});
check('Счётчик: 0 — нейтральный, 100 — акцентный и помещается',
  badge.zeroBg !== badge.hundredBg && badge.hundredFits);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== Итого: ${results.length - failed.length}/${results.length} PASS ===`);
process.exit(failed.length ? 1 : 0);
