#!/usr/bin/env node
// Turn docs/copy-deck.md into src/content/copy.generated.ts and lint the words.
// Usage: node tools/content/build-copy.mjs [--strict] [--in docs/copy-deck.md] [--out src/content/copy.generated.ts]
// --strict (use in production builds): fail on unresolved [OWNER: ...] / [CONFIRM: ...] and {{LEGAL_TEXT_PENDING}}.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const strict = args.includes('--strict');
const inFile = flag('in', 'docs/copy-deck.md');
const outFile = flag('out', 'src/content/copy.generated.ts');

const BANNED = /guarantee|insured|background[- ]check|secure payment|escrow|100% safe|you choose|\bvetted\b/i;
const OLD_TERMS = /\bcleaners?\b|request a clean\b|become a cleaner|first month free/i;
const KEY = /^([a-z0-9_.-]+): (.*)$/;

const errors = [];
const warnings = [];
const entries = new Map();

const lines = fs.readFileSync(inFile, 'utf8').split(/\r?\n/);
lines.forEach((raw, i) => {
  const line = raw.trimEnd();
  if (!line || line.startsWith('#') || line.startsWith('>')) return;
  const m = KEY.exec(line);
  if (!m) {
    if (/^[a-z0-9_.-]+:/.test(line)) errors.push(`${inFile}:${i + 1} empty or malformed value: ${line.slice(0, 60)}`);
    return; // prose lines in the deck header are ignored
  }
  const [, key, value] = m;
  if (entries.has(key)) { errors.push(`${inFile}:${i + 1} duplicate key "${key}" (first at line ${entries.get(key).line})`); return; }
  entries.set(key, { value, line: i + 1 });
});

const vars = {};
for (const [key, { value, line }] of entries) {
  const isClaim = key.startsWith('claim.');
  const banned = BANNED.exec(value);
  if (banned && !(isClaim && /^vetted$/i.test(banned[0]))) errors.push(`${inFile}:${line} "${key}" contains banned wording "${banned[0]}" (claims belong in claim.* keys and only when enforced)`);
  const old = OLD_TERMS.exec(value);
  if (old) errors.push(`${inFile}:${line} "${key}" uses old wording "${old[0]}" (use "helper"; CTAs are "Request a helper" and "Apply to be a helper")`);
  if (/\[(OWNER|CONFIRM)\b/.test(value)) warnings.push(`${key} (line ${line}): unresolved ${value.match(/\[(OWNER|CONFIRM)[^\]]*\]/)[0]}`);
  if (/\{\{LEGAL_TEXT_PENDING\}\}/.test(value)) warnings.push(`${key} (line ${line}): legal text pending`);
  const v = [...value.matchAll(/(?<!\{)\{([a-zA-Z_]+)\}(?!\})/g)].map((x) => x[1]);
  if (v.length) vars[key] = [...new Set(v)];
}

if (strict && warnings.length) errors.push(...warnings.map((w) => `STRICT: ${w}`));

if (errors.length) {
  console.error(`\ncopy build FAILED (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const keys = [...entries.keys()].sort();
const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(entries.get(k).value)},`).join('\n');
const varBody = Object.keys(vars).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(vars[k])},`).join('\n');
const claimKeys = keys.filter((k) => k.startsWith('claim.'));
const out = `// GENERATED from ${inFile} by tools/content/build-copy.mjs. DO NOT EDIT. Edit the deck and run \`npm run build:copy\`.
export const copy = {
${body}
} as const;

export type CopyKey = keyof typeof copy;

/** Variables each string expects, e.g. "{firstName}". */
export const copyVars: Partial<Record<CopyKey, readonly string[]>> = {
${varBody}
};

/** Keys that make claims. Show only when the matching feature switch is on. */
export const claimKeys: readonly CopyKey[] = ${JSON.stringify(claimKeys)};
`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log(`copy build ok: ${keys.length} keys, ${claimKeys.length} gated claim keys -> ${outFile}`);
if (warnings.length) console.log(`\n${warnings.length} item(s) still need the owner (run with --strict to fail on them):\n- ${warnings.join('\n- ')}`);
