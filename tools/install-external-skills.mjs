#!/usr/bin/env node
// Install a curated, PINNED set of third-party skills into .claude/skills/ (works on Windows, macOS, Linux; needs Node 20+ and git).
//   node tools/install-external-skills.mjs              # Tier 1 (install now)
//   node tools/install-external-skills.mjs --with-later # Tier 1 + Tier 2 (add when needed)
//   node tools/install-external-skills.mjs --dry-run    # show what would be copied
// Only the skill folders listed below are copied. Nothing from the downloaded repos is executed.
// To upgrade: change a SHA, rerun, review the diff in git.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Pinned sources (all MIT). rust-skills (actionbook) is intentionally NOT installed: Rust-only.
const SOURCES = {
  ecc: { url: 'https://github.com/affaan-m/ECC.git', sha: 'b92f181b3b748d1abbc2afd94af6aa7d8c8fca29', license: 'ECC-LICENSE', label: 'ECC (affaan-m/ECC)' },
  taste: { url: 'https://github.com/Leonxlnx/taste-skill.git', sha: 'f624f37a8c650b9cc550253104925efe4c8de246', license: 'taste-skill-LICENSE', label: 'taste-skill (Leonxlnx)' },
  uiux: { url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git', sha: '7246805992a42b7bba37d4cac83b01416f0c6c44', license: 'ui-ux-pro-max-skill-LICENSE', label: 'ui-ux-pro-max-skill (nextlevelbuilder)' },
};
const ECC_NOW = ['security-review', 'postgres-patterns', 'database-migrations', 'api-design', 'tdd-workflow', 'e2e-testing',
  'react-patterns', 'react-performance', 'frontend-a11y', 'error-handling', 'architecture-decision-records',
  'verification-loop', 'ai-regression-testing', 'safety-guard', 'intent-driven-development',
  'conventional-commit-review', 'make-interfaces-feel-better', 'coding-standards'];
const ECC_LATER = ['santa-method', 'production-audit', 'canary-watch', 'seo', 'search-first', 'brand-voice', 'i18n-sync'];

const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');
const later = args.has('--with-later');
for (const a of args) if (!['--dry-run', '--with-later'].includes(a)) { console.error(`unknown flag ${a}`); process.exit(2); }

const root = process.cwd();
if (!fs.existsSync(path.join(root, 'AGENTS.md'))) { console.error('Run this from the repo root (AGENTS.md not found).'); process.exit(1); }
if (spawnSync('git', ['--version'], { shell: true }).status !== 0) { console.error('git is required (it downloads the pinned skill versions).'); process.exit(1); }

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'siza-skills-'));
const cleanup = () => fs.rmSync(work, { recursive: true, force: true });
process.on('exit', cleanup);

const git = (cwd, a) => {
  const r = spawnSync('git', a, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')} failed: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
};
function fetchRepo(name) {
  const { url, sha } = SOURCES[name];
  const dir = path.join(work, name);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q']);
  git(dir, ['remote', 'add', 'origin', url]);
  git(dir, ['fetch', '-q', '--depth', '1', 'origin', sha]);
  git(dir, ['checkout', '-q', 'FETCH_HEAD']);
  if (git(dir, ['rev-parse', 'HEAD']) !== sha) throw new Error(`SHA mismatch for ${name}`);
  return dir;
}
const dest = path.join(root, '.claude', 'skills');
function copySkill(repoDir, sub, destName) {
  const src = path.join(repoDir, sub);
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) throw new Error(`missing ${sub} in downloaded repo`);
  if (dry) { console.log(`would install ${destName}  <=  ${sub}`); return; }
  const dst = path.join(dest, destName);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true, dereference: true });
  for (const f of fs.readdirSync(dst, { recursive: true })) {
    const full = path.join(dst, f);
    if (/(^|[\\/])\.git/.test(f)) { fs.rmSync(full, { recursive: true, force: true }); continue; }
    try { if (fs.statSync(full).isFile()) fs.chmodSync(full, 0o644); } catch { /* ignore */ }
  }
  console.log(`installed ${destName}`);
}

try {
  fs.mkdirSync(dest, { recursive: true });
  const dirs = { ecc: fetchRepo('ecc'), taste: fetchRepo('taste'), uiux: fetchRepo('uiux') };
  for (const s of ECC_NOW) copySkill(dirs.ecc, `skills/${s}`, s);
  copySkill(dirs.taste, 'skills/taste-skill', 'design-taste-frontend');
  copySkill(dirs.uiux, '.claude/skills/ui-ux-pro-max', 'ui-ux-pro-max');
  if (later) for (const s of ECC_LATER) copySkill(dirs.ecc, `skills/${s}`, s);

  if (!dry) {
    const licDir = path.join(root, 'docs', 'third-party-licenses');
    fs.mkdirSync(licDir, { recursive: true });
    for (const [n, { license }] of Object.entries(SOURCES)) fs.copyFileSync(path.join(dirs[n], 'LICENSE'), path.join(licDir, license));
    const lines = ['# External skills lock', '', ...Object.values(SOURCES).map((s) => `- ${s.label} ${s.sha} (MIT)`), '',
      `Installed: ${ECC_NOW.join(' ')} design-taste-frontend ui-ux-pro-max`];
    if (later) lines.push(`Later tier: ${ECC_LATER.join(' ')}`);
    lines.push('', 'Upstream licences are kept in docs/third-party-licenses/. SIZA skills override these on any conflict (see AGENTS.md).');
    fs.writeFileSync(path.join(dest, 'EXTERNAL-SKILLS-LOCK.md'), `${lines.join('\n')}\n`);
    console.log('Done. Review with: git status');
  }
} catch (e) {
  console.error(`install failed: ${e.message}`);
  process.exit(1);
}
