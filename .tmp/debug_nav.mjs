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
const st1 = await page.evaluate(() => {
  const el = document.querySelector('.hero-slider__nav--next');
  const r = el.getBoundingClientRect();
  const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    idx: document.querySelector('[data-hero-slider]').swiper.realIndex,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    atPoint: at ? `${at.tagName}.${at.className}` : null,
    cs: { opacity: getComputedStyle(el).opacity, pe: getComputedStyle(el).pointerEvents, display: getComputedStyle(el).display },
  };
});
console.log('before:', JSON.stringify(st1));
await page.click('.hero-slider__nav--next');
await new Promise((r) => setTimeout(r, 1300));
console.log('after:', await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex));
await browser.close();
