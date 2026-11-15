import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);
await new Promise((r) => setTimeout(r, 1500));
const dump = () => page.evaluate(() => {
  const s = document.querySelector('[data-hero-slider]').swiper;
  return s.slides.map((el) => ({
    dup: el.classList.contains('swiper-slide-duplicate'),
    active: el.classList.contains('swiper-slide-active'),
    inert: el.hasAttribute('inert'),
    opacity: getComputedStyle(el).opacity,
  }));
});
console.log('init:', JSON.stringify(await dump()));
await page.click('.hero-slider__nav--next');
await new Promise((r) => setTimeout(r, 300));
console.log('mid:', JSON.stringify(await dump()));
await new Promise((r) => setTimeout(r, 1200));
console.log('end:', JSON.stringify(await dump()));
await browser.close();
