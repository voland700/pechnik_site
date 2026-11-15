import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
const info = await page.evaluate(() => {
  const grid = document.querySelector('.hero-showcase__grid');
  const slider = document.querySelector('[data-hero-slider]');
  const wrapper = slider.querySelector('.swiper-wrapper');
  const slide = slider.querySelector('.swiper-slide');
  const cs = (el) => getComputedStyle(el);
  return {
    gridCols: cs(grid).gridTemplateColumns,
    gridW: grid.getBoundingClientRect().width,
    sliderCssW: cs(slider).width,
    sliderMinW: cs(slider).minWidth,
    sliderOffsetW: slider.offsetWidth,
    wrapperCssW: cs(wrapper).width,
    wrapperInline: wrapper.getAttribute('style'),
    slideInline: slide.getAttribute('style'),
    swiperWidth: slider.swiper?.width,
    virtualSize: slider.swiper?.virtualSize,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
