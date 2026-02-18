import { chromium } from '@playwright/test';

const shots = [
  ['http://localhost:3000/', 'zeom_home.png'],
  ['http://localhost:3000/login', 'zeom_login.png'],
  ['http://localhost:3000/signup', 'zeom_signup.png'],
];

const outDir = '/Users/pyeondohun/.openclaw/workspace/screenshots';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [url, name] of shots) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
  console.log(`${outDir}/${name}`);
}
await browser.close();
