import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);
await page.evaluate(() => {
  window.__log = [];
  ['mousedown', 'mouseup', 'click'].forEach((t) =>
    document.addEventListener(t, (e) => window.__log.push(`${t}:${e.target.className || e.target.tagName}`), true),
  );
});
await page.hover('[data-hero-slider] .swiper-wrapper');
await new Promise((r) => setTimeout(r, 350));
await page.click('.hero-slider__nav--next');
await new Promise((r) => setTimeout(r, 300));
const log = await page.evaluate(() => ({
  log: window.__log.slice(0, 8),
  allowClick: document.querySelector('[data-hero-slider]').swiper.allowClick,
  idx: document.querySelector('[data-hero-slider]').swiper.realIndex,
}));
console.log(JSON.stringify(log, null, 1));
await browser.close();
