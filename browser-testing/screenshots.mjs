import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const url = 'https://adil-kaibaliev-production.up.railway.app/?lang=en';

// Desktop screenshot
const desktop = await browser.newPage();
await desktop.setViewport({ width: 1280, height: 900 });
await desktop.goto(url, { waitUntil: 'networkidle2' });
await desktop.waitForSelector('#journey');
await desktop.evaluate(() => document.querySelector('#journey').scrollIntoView());
await new Promise(r => setTimeout(r, 500));
await desktop.screenshot({ path: '/tmp/tl-desktop.png' });

// Scroll down more to see connections
await desktop.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 300));
await desktop.screenshot({ path: '/tmp/tl-desktop-2.png' });

await desktop.close();

// Mobile screenshot
const mobile = await browser.newPage();
await mobile.setViewport({ width: 390, height: 844 });
await mobile.goto(url, { waitUntil: 'networkidle2' });
await mobile.waitForSelector('#journey');
await mobile.evaluate(() => document.querySelector('#journey').scrollIntoView());
await new Promise(r => setTimeout(r, 500));
await mobile.screenshot({ path: '/tmp/tl-mobile.png' });

await mobile.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 300));
await mobile.screenshot({ path: '/tmp/tl-mobile-2.png' });

await mobile.close();
console.log('Done');
