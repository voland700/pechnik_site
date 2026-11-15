import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelector('[data-hero-slider]')?.swiper);
const state = await page.evaluate(() => {
  const s = document.querySelector('[data-hero-slider]').swiper;
  return {
    running: s.autoplay?.running,
    paused: s.autoplay?.paused,
    autoplayParam: s.params.autoplay,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    visibility: document.visibilityState,
  };
});
console.log(JSON.stringify(state, null, 2));
await new Promise((r) => setTimeout(r, 1500));
const state2 = await page.evaluate(() => {
  const s = document.querySelector('[data-hero-slider]').swiper;
  return { running: s.autoplay?.running, paused: s.autoplay?.paused, index: s.realIndex };
});
console.log(JSON.stringify(state2));
await browser.close();
