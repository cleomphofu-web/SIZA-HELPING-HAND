#!/usr/bin/env node
// Capture a full-page screenshot of your build, or compare it with a reference screenshot slice by slice.
//   node visual-diff.mjs capture <url> <out.png> [width=1440]
//   node visual-diff.mjs compare <reference.png> <build.png> [--tol 8] [--slice 900] [--skip 3,4] [--height-tol 5] [--out docs/design-reference/diff]
// Needs: npm i -D playwright pngjs pixelmatch && npx playwright install chromium
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [mode, ...rest] = process.argv.slice(2);

function flag(name, def) {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : def;
}

export function sliceImage(png, y, h) {
  const out = new PNG({ width: png.width, height: h });
  out.data.fill(255); // white padding where the image is shorter
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy >= png.height) break;
    const start = sy * png.width * 4;
    png.data.copy(out.data, row * png.width * 4, start, start + png.width * 4);
  }
  return out;
}

export function compare(refPng, buildPng, { slice = 900, tol = 8, skip = [], outDir = null, heightTol = 5 } = {}) {
  if (refPng.width !== buildPng.width) {
    throw new Error(`Width differs (reference ${refPng.width}px, build ${buildPng.width}px). Capture both at the same viewport width.`);
  }
  const total = Math.ceil(Math.max(refPng.height, buildPng.height) / slice);
  const report = [];
  for (let i = 0; i < total; i++) {
    const a = sliceImage(refPng, i * slice, slice);
    const b = sliceImage(buildPng, i * slice, slice);
    const diff = new PNG({ width: a.width, height: slice });
    const bad = pixelmatch(a.data, b.data, diff.data, a.width, slice, { threshold: 0.2 });
    const pct = (bad / (a.width * slice)) * 100;
    const skipped = skip.includes(i);
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `diff-${String(i).padStart(2, '0')}.png`), PNG.sync.write(diff));
    }
    report.push({ slice: i, yFrom: i * slice, yTo: (i + 1) * slice, mismatchPercent: Number(pct.toFixed(2)), skipped, pass: skipped || pct <= tol });
  }
  const heightDifference = buildPng.height - refPng.height;
  const heightOk = (Math.abs(heightDifference) / refPng.height) * 100 <= heightTol;
  return {
    referenceHeight: refPng.height,
    buildHeight: buildPng.height,
    heightDifference,
    heightTolerancePercent: heightTol,
    heightOk,
    tolerancePercent: tol,
    slices: report,
    pass: heightOk && report.every((r) => r.pass),
  };
}

if (mode === 'capture') {
  const [url, out, width = '1440'] = rest;
  if (!url || !out) { console.error('usage: capture <url> <out.png> [width]'); process.exit(2); }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 1 })).newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0; const t = setInterval(() => {
          window.scrollBy(0, 400); y += 400;
          if (y >= document.documentElement.scrollHeight + 400) { clearInterval(t); window.scrollTo(0, 0); setTimeout(resolve, 800); }
        }, 150);
      });
    });
    await page.waitForTimeout(1200);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: true });
    console.log(`saved ${out}`);
  } finally { await browser.close(); }
} else if (mode === 'compare') {
  const [refPath, buildPath] = rest;
  if (!refPath || !buildPath) { console.error('usage: compare <reference.png> <build.png> [--tol 8] [--slice 900] [--skip 3,4] [--out dir]'); process.exit(2); }
  const result = compare(PNG.sync.read(fs.readFileSync(refPath)), PNG.sync.read(fs.readFileSync(buildPath)), {
    slice: Number(flag('slice', 900)),
    tol: Number(flag('tol', 8)),
    skip: String(flag('skip', '')).split(',').filter(Boolean).map(Number),
    outDir: flag('out', null),
    heightTol: Number(flag('height-tol', 5)),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
} else if (mode) {
  console.error('modes: capture | compare'); process.exit(2);
}
