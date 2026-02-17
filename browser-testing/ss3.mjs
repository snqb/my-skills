import puppeteer from 'puppeteer-core';
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const url = 'https://adil-kaibaliev-production.up.railway.app/?lang=en';

const d = await browser.newPage();
await d.setViewport({ width: 1280, height: 900 });
await d.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await d.evaluate(() => document.querySelector('#journey').scrollIntoView());
await new Promise(r => setTimeout(r, 1500));
await d.screenshot({ path: '/tmp/v3-desk-1.png' });
await d.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 400));
await d.screenshot({ path: '/tmp/v3-desk-2.png' });
await d.close();

const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844 });
await m.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await m.evaluate(() => document.querySelector('#journey').scrollIntoView());
await new Promise(r => setTimeout(r, 1500));
await m.screenshot({ path: '/tmp/v3-mob-1.png' });
await m.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 400));
await m.screenshot({ path: '/tmp/v3-mob-2.png' });
await m.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 400));
await m.screenshot({ path: '/tmp/v3-mob-3.png' });
await m.close();
console.log('Done');
