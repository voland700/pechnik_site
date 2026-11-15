import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
const info = await page.evaluate(() => {
  const widest = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 2000) widest.push(`${el.tagName}.${el.className} w=${Math.round(r.width)}`);
  });
  const sw = document.querySelector('[data-hero-slider]');
  const s = sw?.swiper;
  return {
    widest: widest.slice(0, 10),
    wrapperTransform: sw?.querySelector('.swiper-wrapper')?.style.transform,
    fadeCssLoaded: !!document.querySelector('.swiper-slide')?.getAttribute('style'),
    slideStyle: sw?.querySelector('.swiper-slide')?.getAttribute('style'),
    parallaxParam: JSON.stringify(s?.params?.parallax),
    parallaxEnabled: s?.parallax?.enabled,
    navNext: (() => {
      const b = sw?.querySelector('.swiper-button-next');
      const r = b?.getBoundingClientRect();
      const cs = b ? getComputedStyle(b) : null;
      return r ? { x: r.x, y: r.y, w: r.width, h: r.height, display: cs.display, zIndex: cs.zIndex } : null;
    })(),
    slideRects: s ? s.slides.slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className, x: Math.round(r.x), w: Math.round(r.width), op: getComputedStyle(el).opacity };
    }) : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
