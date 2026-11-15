import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
const r = await p.$eval('.category-card__image', (el) => {
  const cs = getComputedStyle(el);
  return { fit: cs.objectFit, pos: cs.objectPosition, loading: el.loading };
});
console.log(r);
await b.close();
