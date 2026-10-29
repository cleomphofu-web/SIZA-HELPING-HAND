# Design tools

Two small scripts that let any coding agent (even a cheaper model) match the Framer template exactly instead of guessing from pictures.

## One-time setup (in your repo)
```
npm i -D playwright pngjs pixelmatch
npx playwright install chromium
```
(Record the three dev dependencies in `docs/adr/002-dependencies.md`.)

## 1. Capture the reference and extract tokens (you run this once, on your computer)
```
node tools/design/extract-framer-tokens.mjs https://siza.framer.website docs/design-reference/extract
```
Output in `docs/design-reference/extract/`: full-page screenshots at 375, 768 and 1440 px, `tokens-<page>-<width>.json` (fonts, colours, type styles, radii, spacing, transitions, layer names and sizes), `assets-manifest.json` (a list of asset URLs; nothing is downloaded, so check the template licence before using any asset).
If you give no paths, the script opens the home page, finds the site's own links and captures each page (up to 12). To capture hidden pages (project detail, blog detail, legal, 404), list their paths after the output folder.

**Reference coverage:** the template only covers the pages it contains (and your Framer export may only have some of them). Login, host app, helper app and admin screens have **no reference**. See the `siza-design-fidelity` skill: those are composed from the template's components and tokens and approved by the owner from screenshots, not pixel-compared.

## 2. Put the Framer-to-code export in place
Copy the plugin's output into `docs/design-reference/framer-export/` (home, contact, and any other page you can export). It is reference only: excluded from build, lint and tests.

## 3. Check a build against the reference (the agent runs this)
```
node tools/design/visual-diff.mjs capture http://localhost:3000/dev/fidelity/home out/home-1440.png 1440
node tools/design/visual-diff.mjs compare docs/design-reference/extract/screens/home-1440.png out/home-1440.png --out out/diff
```
It compares the page in 900 px slices and prints the mismatch percentage per slice, plus any page-height difference. Exit code 1 means a slice or the height is outside tolerance. Options: `--tol 8`, `--slice 900`, `--skip 3,4` (ignore slices with video or counters), `--height-tol 5`.

Tested here: the comparison logic and the in-page collector (against a sample page). The browser launch and live capture are untested because this environment cannot download browsers: run step 1 yourself and tell the agent if anything fails.

## If the agent's environment cannot run the capture (no internet or browser)
Double-click `tools/windows/capture-desktop-design.bat` (or `capture-all-design.bat`) in File Explorer. It runs the capture on your own computer, shows progress, and says when it is finished; then tell the agent. If it is interrupted, double-click it again: finished pages are skipped. To see the site while it is being built, double-click `tools/windows/start-site.bat`. These .bat files are untested (written without a Windows machine): if one fails, send the text in the window to the agent.
Options for the script: `--only=mobile|tablet|desktop` and `--skip-existing`.
