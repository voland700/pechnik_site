import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });

// прокрутка к витрине
const section = await page.$('.category-showcase');
await section.evaluate((el) => el.scrollIntoView({ block: 'start' }));
await new Promise((r) => setTimeout(r, 300));

// hover на первую карточку
await page.hover('.category-card');
await new Promise((r) => setTimeout(r, 350));

const box = await section.evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
});
await page.screenshot({
  path: '.tmp/shots/showcase-v2-hover.png',
  clip: { x: box.x, y: box.y, width: Math.min(box.width, 1440), height: Math.min(box.height, 800) },
});
await browser.close();
