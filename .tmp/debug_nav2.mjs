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
  window.__clicks = 0;
  document.querySelector('.hero-slider__nav--next').addEventListener('click', () => window.__clicks++);
});
await page.hover('[data-hero-slider] .swiper-wrapper');
await new Promise((r) => setTimeout(r, 350));
await page.click('.hero-slider__nav--next');
await new Promise((r) => setTimeout(r, 400));
const r1 = await page.evaluate(() => ({
  clicks: window.__clicks,
  idx: document.querySelector('[data-hero-slider]').swiper.realIndex,
  navEls: JSON.stringify(document.querySelector('[data-hero-slider]').swiper.params.navigation),
}));
console.log('mouse click:', JSON.stringify(r1));
await page.evaluate(() => document.querySelector('.hero-slider__nav--next').click());
await new Promise((r) => setTimeout(r, 400));
console.log('js click idx:', await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex), 'clicks:', await page.evaluate(() => window.__clicks));
await browser.close();
