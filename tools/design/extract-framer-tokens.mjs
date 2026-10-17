#!/usr/bin/env node
// Capture reference screenshots and extract design tokens from a live site (built for Framer sites).
// Usage: node extract-framer-tokens.mjs <baseUrl> <outDir> [path ...]   (no paths = discover the pages from the home page links)
// Example: node extract-framer-tokens.mjs https://siza.framer.website docs/design-reference/extract / /about /contact
// Needs: npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { collect } from './collect-in-page.mjs';

const [base, outDir = 'docs/design-reference/extract', ...paths] = process.argv.slice(2);
if (!base) { console.error('usage: node extract-framer-tokens.mjs <baseUrl> <outDir> [path ...]'); process.exit(2); }
let pages = paths.length ? paths : null; // null = discover the site's own pages from its links
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-'));

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0; const step = 400;
      const t = setInterval(() => {
        window.scrollBy(0, step); y += step;
        if (y >= document.documentElement.scrollHeight + step) {
          clearInterval(t); window.scrollTo(0, 0); setTimeout(resolve, 800);
        }
      }, 150);
    });
  });
}

await fs.mkdir(path.join(outDir, 'screens'), { recursive: true });
const browser = await chromium.launch();

// No paths given: open the home page, collect its internal links and capture each page once (max 12).
if (!pages) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(new URL('/', base).toString(), { waitUntil: 'networkidle', timeout: 60000 });
  const origin = new URL(base).origin;
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  await ctx.close();
  const found = new Set(['/']);
  for (const h of hrefs) {
    try {
      const u = new URL(h, base);
      if (u.origin === origin && !/^(mailto|tel):/.test(h)) found.add(u.pathname.replace(/\/$/, '') || '/');
    } catch { /* ignore bad links */ }
  }
  pages = [...found].slice(0, 12);
  console.log(`discovered pages: ${pages.join(' ')}`);
}
const assets = new Set();
const summary = [];
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('response', (r) => {
      const u = r.url();
      if (/framerusercontent\.com|fonts\.(gstatic|googleapis)\.com|fontshare|\.(woff2?|ttf|otf|mp4|webm|png|jpe?g|webp|svg)(\?|$)/i.test(u)) assets.add(u);
    });
    for (const p of pages) {
      const url = new URL(p, base).toString();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await autoScroll(page);
      await page.waitForTimeout(1200);
      const name = `${slug(p)}-${vp.width}`;
      await page.screenshot({ path: path.join(outDir, 'screens', `${name}.png`), fullPage: true });
      const data = await page.evaluate(collect);
      await fs.writeFile(path.join(outDir, `tokens-${name}.json`), JSON.stringify(data, null, 2));
      summary.push({ page: p, viewport: vp.name, height: data.page.scrollHeight, textStyles: data.textStyles.length, colors: data.backgrounds.length });
      console.log(`captured ${name} (height ${data.page.scrollHeight}px)`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(outDir, 'assets-manifest.json'), JSON.stringify([...assets].sort(), null, 2));
await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`done: ${outDir} (assets listed, not downloaded: check the template licence before reusing any asset)`);
