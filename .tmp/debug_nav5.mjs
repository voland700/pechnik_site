import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);

// Вариант А: кнопка всегда видима (убираем opacity/pe через style)
await page.addStyleTag({ content: '.hero-slider .hero-slider__nav{opacity:1!important;pointer-events:auto!important;transition:none!important}' });
let pt = await page.$eval('.hero-slider__nav--next', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; });
await page.mouse.move(pt.x, pt.y); await page.mouse.down(); await page.mouse.up();
await new Promise((r) => setTimeout(r, 1300));
console.log('A always-visible idx:', await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex));

// Вариант Б: без ховера, через page.click
await page.click('.hero-slider__nav--next');
await new Promise((r) => setTimeout(r, 1300));
console.log('B page.click idx:', await page.evaluate(() => document.querySelector('[data-hero-slider]').swiper.realIndex));
await browser.close();
