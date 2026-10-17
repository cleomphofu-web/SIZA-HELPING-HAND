#!/usr/bin/env node
// One-command setup so nobody has to type commands by hand.
// Usage (from the repo root): node tools/bootstrap.mjs [--dry-run] [--skip-install] [--skip-browser]
// Does: creates the folders the docs expect, makes .gitignore safe, adds the package.json scripts,
// installs the dev tools (playwright, pngjs, pixelmatch, knip) and the Chromium browser used by the design tools.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');
const skipInstall = args.has('--skip-install');
const skipBrowser = args.has('--skip-browser');
const root = process.cwd();
const log = (m) => console.log(m);
const act = (m) => log(`${dry ? '[dry-run] would: ' : ''}${m}`);

if (!fs.existsSync(path.join(root, 'package.json'))) {
  console.error('No package.json here. Run this from the repo root.');
  process.exit(1);
}
const major = Number(process.versions.node.split('.')[0]);
if (major < 20) { console.error(`Node ${process.versions.node} is too old. Install Node 20 or newer.`); process.exit(1); }

// 1. folders
const dirs = [
  'docs/design-reference/extract', 'docs/design-reference/framer-export', 'docs/archive', 'docs/realign', 'docs/adr', 'docs/ux', 'docs/plans',
  'public/assets/images/logos', 'public/assets/images/hero', 'public/assets/images/services', 'public/assets/images/how-it-works',
  'public/assets/images/about', 'public/assets/images/helpers', 'public/assets/images/illustrations', 'public/assets/images/og', 'public/assets/videos',
];
for (const d of dirs) {
  const full = path.join(root, d);
  if (!fs.existsSync(full)) {
    act(`create ${d}`);
    if (!dry) { fs.mkdirSync(full, { recursive: true }); fs.writeFileSync(path.join(full, '.gitkeep'), ''); }
  }
}

// 2. .gitignore
const giPath = path.join(root, '.gitignore');
const wanted = ['node_modules', '.next', '.env', '.env.*', '!.env.example', '*.tsbuildinfo', 'coverage', 'out', 'playwright-report', 'test-results'];
const gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : '';
const have = new Set(gi.split(/\r?\n/).map((l) => l.trim()));
const missing = wanted.filter((w) => !have.has(w) && !have.has(`/${w}`) && !have.has(`${w}/`));
if (missing.length) {
  act(`add to .gitignore: ${missing.join(', ')}`);
  if (!dry) fs.writeFileSync(giPath, `${gi.replace(/\s*$/, '\n')}\n# added by tools/bootstrap.mjs\n${missing.join('\n')}\n`);
}

// 3. package.json scripts (never overwrite an existing script)
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts ??= {};
const scripts = {
  'build:copy': 'node tools/content/build-copy.mjs',
  'build:copy:strict': 'node tools/content/build-copy.mjs --strict',
  'check:structure': 'node tools/quality/check-structure.mjs',
  'design:extract': 'node tools/design/extract-framer-tokens.mjs https://siza.framer.website docs/design-reference/extract',
  'design:capture': 'node tools/design/visual-diff.mjs capture',
  'design:compare': 'node tools/design/visual-diff.mjs compare',
  knip: 'knip',
};
for (const [k, v] of Object.entries(scripts)) {
  if (!pkg.scripts[k]) { act(`add script "${k}"`); pkg.scripts[k] = v; }
}
if (!dry) fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// 4. dev dependencies and browser
const run = (cmd, a) => {
  act(`${cmd} ${a.join(' ')}`);
  if (dry) return 0;
  const r = spawnSync(cmd, a, { stdio: 'inherit', shell: true, cwd: root });
  return r.status ?? 1;
};
if (!skipInstall) {
  const status = run('npm', ['install', '--save-dev', 'playwright', 'pngjs', 'pixelmatch', 'knip']);
  if (status !== 0) { console.error('npm install failed. Check your internet connection and run this again.'); process.exit(status); }
}
if (!skipBrowser) {
  const status = run('npx', ['playwright', 'install', 'chromium']);
  if (status !== 0) console.error('Could not download the Chromium browser (needed only for the design tools). If you are behind a firewall or in a sandbox, run this on your own computer.');
}

log(dry ? '\nDry run finished. Nothing was changed.' : '\nBootstrap finished. Record the new dev dependencies in docs/adr/002-dependencies.md.');
