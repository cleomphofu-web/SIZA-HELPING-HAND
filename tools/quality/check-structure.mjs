#!/usr/bin/env node
// Repo hygiene: forbidden old-direction terms, byte-identical duplicate files, and repeated export names.
// Usage: node tools/quality/check-structure.mjs [--config tools/quality/forbidden-terms.json] [--root .]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const root = path.resolve(flag('root', '.'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(root, flag('config', 'tools/quality/forbidden-terms.json')), 'utf8'));

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const ignored = (r) => cfg.ignoreDirs.some((d) => r === d || r.startsWith(`${d}/`) || r.includes(`/${d}/`)) || cfg.ignoreFiles.includes(r);
function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const r = rel(full);
    if (ignored(r)) continue;
    if (e.isDirectory()) yield* walk(full); else yield full;
  }
}
const files = cfg.scanDirs.flatMap((d) => [...walk(path.join(root, d))]);
const errors = [];
const warnings = [];
const isText = (f) => /\.(ts|tsx|js|jsx|mjs|css|json|md|html|sql|svg|txt)$/.test(f);

// 1. forbidden terms
const rules = cfg.rules.map((r) => ({ ...r, re: new RegExp(r.pattern, r.flags) }));
for (const f of files.filter(isText)) {
  const r = rel(f);
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (rule.onlyIn && !rule.onlyIn.some((p) => r.startsWith(p))) continue;
      if (rule.re.test(line)) errors.push(`${r}:${i + 1} [${rule.id}] ${rule.message}`);
    }
  });
}

// 2. byte-identical duplicate files
const seen = new Map();
for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  if (!cfg.duplicateFiles.extensions.includes(ext)) continue;
  const buf = fs.readFileSync(f);
  if (buf.length < cfg.duplicateFiles.minBytes) continue;
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (seen.has(h)) errors.push(`${rel(f)} is byte-identical to ${seen.get(h)} (duplicate: keep one and import it)`);
  else seen.set(h, rel(f));
}

// 3. repeated export names (warning)
const allowPath = path.resolve(root, cfg.duplicateExports.allowFile);
const allow = fs.existsSync(allowPath) ? new Set(JSON.parse(fs.readFileSync(allowPath, 'utf8'))) : new Set();
const exportsByName = new Map();
const exportRe = /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g;
for (const f of files.filter((x) => cfg.duplicateExports.extensions.includes(path.extname(x)))) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(exportRe)) {
    const name = m[1];
    if (cfg.duplicateExports.ignoreNames.includes(name) || allow.has(name)) continue;
    exportsByName.set(name, [...(exportsByName.get(name) ?? []), rel(f)]);
  }
}
for (const [name, where] of exportsByName) {
  const uniq = [...new Set(where)];
  if (uniq.length > 1) warnings.push(`export "${name}" is defined in ${uniq.length} files (${uniq.join(', ')}): merge or rename, or add to allowed-duplicate-exports.json with a reason`);
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  console.error(`\ncheck:structure FAILED (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`check:structure ok (${files.length} files scanned, ${warnings.length} warning(s))`);
