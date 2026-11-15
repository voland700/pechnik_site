import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);
await page.hover('[data-hero-slider] .swiper-wrapper');
await new Promise((r) => setTimeout(r, 350));
// ручной клик по координатам центра кнопки
const pt = await page.$eval('.hero-slider__nav--next', (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(pt.x, pt.y, { steps: 5 });
await new Promise((r) => setTimeout(r, 100));
await page.mouse.down();
await new Promise((r) => setTimeout(r, 80));
await page.mouse.up();
await new Promise((r) => setTimeout(r, 1300));
console.log('manual mouse idx:', await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex));
await browser.close();
