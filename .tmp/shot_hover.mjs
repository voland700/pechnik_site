import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.hover('[data-hero-slider] .swiper-wrapper');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: '.tmp/shots/hero-hover-nav-1440.png', clip: { x: 200, y: 190, width: 1040, height: 500 } });
await browser.close();
