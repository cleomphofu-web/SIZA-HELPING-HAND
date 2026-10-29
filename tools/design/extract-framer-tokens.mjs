#!/usr/bin/env node
// Capture reference screenshots and extract design tokens from a live site (built for Framer sites).
// Usage: node extract-framer-tokens.mjs <baseUrl> <outDir> [path ...] [--only=desktop] [--skip-existing]
// (no paths = discover the pages from the home page links; --only limits to one screen size; --skip-existing resumes an interrupted run)
// Example: node extract-framer-tokens.mjs https://siza.framer.website docs/design-reference/extract / /about /contact
// Needs: npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { collect } from './collect-in-page.mjs';

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const [base, outDir = 'docs/design-reference/extract', ...paths] = argv.filter((a) => !a.startsWith('--'));
const only = (flags.find((f) => f.startsWith('--only=')) || '').split('=')[1]; // --only=mobile|tablet|desktop
const skipExisting = flags.includes('--skip-existing'); // resume after an interrupted run
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
      let y = 0; let n = 0; const step = 400;
      const t = setInterval(() => {
        window.scrollBy(0, step); y += step;
        n++;
        if (y >= document.documentElement.scrollHeight + step || n > 120) {
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
const failures = [];
try {
  for (const vp of VIEWPORTS.filter((v) => !only || v.name === only)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('response', (r) => {
      const u = r.url();
      if (/framerusercontent\.com|fonts\.(gstatic|googleapis)\.com|fontshare|\.(woff2?|ttf|otf|mp4|webm|png|jpe?g|webp|svg)(\?|$)/i.test(u)) assets.add(u);
    });
    for (const p of pages) {
      const name = `${slug(p)}-${vp.width}`;
      const shot = path.join(outDir, 'screens', `${name}.png`);
      const tok = path.join(outDir, `tokens-${name}.json`);
      if (skipExisting && (await fs.stat(shot).catch(() => null)) && (await fs.stat(tok).catch(() => null))) {
        console.log(`skipped ${name} (already captured)`);
        continue;
      }
      try {
        await page.goto(new URL(p, base).toString(), { waitUntil: 'networkidle', timeout: 90000 });
        await autoScroll(page);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: shot, fullPage: true, timeout: 180000 });
        const data = await page.evaluate(collect);
        await fs.writeFile(tok, JSON.stringify(data, null, 2));
        summary.push({ page: p, viewport: vp.name, height: data.page.scrollHeight, textStyles: data.textStyles.length, colors: data.backgrounds.length });
        console.log(`captured ${name} (height ${data.page.scrollHeight}px)`);
      } catch (e) {
        failures.push(`${name}: ${e.message.split('\n')[0]}`);
        console.error(`FAILED ${name}: ${e.message.split('\n')[0]} (run again with --skip-existing to resume)`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(outDir, 'assets-manifest.json'), JSON.stringify([...assets].sort(), null, 2));
await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`done: ${outDir} (assets listed, not downloaded: check the template licence before reusing any asset)`);
if (failures.length) { console.error(`${failures.length} capture(s) failed:\n- ${failures.join('\n- ')}`); process.exit(1); }
