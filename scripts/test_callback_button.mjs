// Разовая проверка кнопки «Обратный звонок» (desktop): вид ссылки + hover-стили.
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:4321/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle0' });

const sel = '.topbar__callback';
const base = await page.$eval(sel, (el) => {
  const cs = getComputedStyle(el);
  return {
    border: cs.borderWidth,
    bg: cs.backgroundColor,
    color: cs.color,
    underline: cs.textDecorationLine,
    fontWeight: cs.fontWeight,
  };
});

await page.hover(sel);
await new Promise((r) => setTimeout(r, 250));
const hover = await page.$eval(sel, (el) => {
  const cs = getComputedStyle(el);
  return {
    bg: cs.backgroundColor,
    color: cs.color,
    underline: cs.textDecorationLine,
    offset: cs.textUnderlineOffset,
  };
});

await page.screenshot({
  path: '.tmp/shots/callback-hover-1440.png',
  clip: { x: 700, y: 0, width: 740, height: 60 },
});
await browser.close();

const transparent = (v) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent';
const checks = [
  ['base: без рамки', base.border === '0px'],
  ['base: фон прозрачный', transparent(base.bg)],
  ['hover: фон прозрачный', transparent(hover.bg)],
  ['hover: цвет #e68800', hover.color === 'rgb(230, 136, 0)'],
  ['hover: underline', hover.underline.includes('underline')],
  ['hover: offset 0.25em', Math.abs(parseFloat(hover.offset) - 0.25 * 14) < 1.5 || hover.offset.endsWith('em')],
];
let ok = 0;
for (const [name, pass] of checks) {
  console.log(pass ? 'PASS ' : 'FAIL ', name);
  if (pass) ok++;
}
console.log({ base, hover });
console.log(`=== ${ok}/${checks.length} PASS ===`);
process.exit(ok === checks.length ? 0 : 1);
