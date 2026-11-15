import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
const section = await page.$('.category-showcase');
await section.screenshot({ path: '.tmp/shots/showcase-v2-1440.png' });
await page.hover('.category-card');
await new Promise((r) => setTimeout(r, 350));
await page.screenshot({ path: '.tmp/shots/showcase-v2-hover.png', clip: { x: 50, y: 610, width: 400, height: 300 } });
await browser.close();
