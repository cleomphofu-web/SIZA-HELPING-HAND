#!/usr/bin/env node
// Fail only when an implemented page refers to an undeclared or absent local asset.
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve("src");
const manifest = fs.readFileSync("docs/ASSET_MANIFEST.md", "utf8");
const declared = new Set(manifest.split(/\r?\n/)
  .filter((line) => line.startsWith("|"))
  .map((line) => line.split("|")[2]?.trim())
  .filter((value) => value?.includes("/")));
const errors = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(sourceRoot).filter((entry) => /\.[jt]sx?$/.test(entry))) {
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(/["'`]\/assets\/images\/([^"'`?#\s]+)["'`]/g)) {
    let asset;
    try {
      asset = decodeURIComponent(match[1]);
    } catch {
      errors.push(`${file}: invalid encoded asset path ${match[1]}`);
      continue;
    }
    if (![...declared].some((slot) => slot.includes(asset))) errors.push(`${file}: images/${asset} is not listed in docs/ASSET_MANIFEST.md`);
    if (!fs.existsSync(path.join("public", "assets", "images", asset))) errors.push(`${file}: public/assets/images/${asset} is missing`);
  }
}

if (errors.length) {
  console.error(`check:assets FAILED:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("check:assets ok (all local image references are declared and present)");
