import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const target = args[0] || "index.html";
const outDir = path.resolve(root, args[1] || "shots");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targetPath = path.isAbsolute(target) ? target : path.resolve(root, target);
const targetUrl = target.includes("://") ? target : `file://${targetPath.replace(/\\/g, "/")}`;

const VIEWS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];

const QA_JS = `() => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('body *')].filter(e => {
    const r = e.getBoundingClientRect(); return r.right > vw + 1 && getComputedStyle(e).position !== 'fixed';
  }).slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
  const vids = [...document.querySelectorAll('video')].map(v => ({src: (v.currentSrc || v.src || '').slice(0, 90), ready: v.readyState, paused: v.paused, error: v.error ? v.error.code : null}));
  const imgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(0, 90));
  const fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, ''));
  const h1 = document.querySelector('h1');
  return {
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    viewport: vw,
    horizontalOverflow: document.documentElement.scrollWidth > vw + 1,
    overflowingElements: wide,
    pageHeight: document.documentElement.scrollHeight,
    videos: vids,
    brokenImages: imgs,
    fontsLoaded: [...new Set(fonts)],
    h1: h1 ? { text: h1.innerText.slice(0, 80), fontSize: getComputedStyle(h1).fontSize, font: getComputedStyle(h1).fontFamily.slice(0, 40) } : null,
  };
}`;

async function run() {
  const browser = await chromium.launch();
  const report = {};

  for (const view of VIEWS) {
    const ctx = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      isMobile: view.isMobile,
      hasTouch: view.isMobile,
    });
    const page = await ctx.newPage();

    const errors = [];
    const failed = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 200));
    });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 100)} (${r.failure()?.errorText})`));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push(`${r.url().slice(0, 100)} (HTTP ${r.status()})`);
    });

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    if (view.name === "desktop") {
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(outDir, "desktop-early.png") });
    }

    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {}

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, `${view.name}.png`), fullPage: true });

    const qa = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.right > vw + 1 && getComputedStyle(e).position !== "fixed";
        })
        .slice(0, 5)
        .map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""));
      const vids = [...document.querySelectorAll("video")].map((v) => ({
        src: (v.currentSrc || v.src || "").slice(0, 90),
        ready: v.readyState,
        paused: v.paused,
        error: v.error ? v.error.code : null,
      }));
      const imgs = [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.src.slice(0, 90));
      const fonts = [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => f.family.replace(/"/g, ""));
      const h1 = document.querySelector("h1");
      return {
        title: document.title,
        scrollWidth: document.documentElement.scrollWidth,
        viewport: vw,
        horizontalOverflow: document.documentElement.scrollWidth > vw + 1,
        overflowingElements: wide,
        pageHeight: document.documentElement.scrollHeight,
        videos: vids,
        brokenImages: imgs,
        fontsLoaded: [...new Set(fonts)],
        h1: h1
          ? {
              text: h1.innerText.slice(0, 80),
              fontSize: getComputedStyle(h1).fontSize,
              font: getComputedStyle(h1).fontFamily.slice(0, 40),
            }
          : null,
      };
    });
    qa.consoleErrors = errors.slice(0, 10);
    qa.failedRequests = failed.filter((f) => !f.includes("ERR_ABORTED")).slice(0, 10);
    report[view.name] = qa;

    await ctx.close();
  }

  await browser.close();
  console.log("QA Report:\n", JSON.stringify(report, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
