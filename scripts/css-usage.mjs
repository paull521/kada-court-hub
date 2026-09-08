#!/usr/bin/env node
/**
 * What does this class cost, and is it safe to touch?
 *
 * The migration needs the same three answers before every component: how many
 * rules carry the prefix, which stylesheets they sit in, and whether anything
 * builds the name at runtime. That last one is the dangerous question - a class
 * assembled as `status-${x}` never appears in the source as a literal, so a
 * search for it comes back empty and the rule looks dead when it is not.
 *
 *   node scripts/css-usage.mjs financial-      one prefix
 *   node scripts/css-usage.mjs --dead          every class no file names
 *
 * The stylesheets are the six hand-written ones; app/tailwind.css is generated
 * vocabulary and is skipped.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SHEETS = [
  "app/globals.css",
  "app/workspaces.css",
  "app/patriotism.css",
  "app/captain-refinement.css",
  "app/owner-refinement.css",
  "app/kch-logo.css",
  "app/desktop.css",
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return [".ts", ".tsx"].includes(extname(name)) ? [full] : [];
  });

const sources = ["app", "components", "lib", "tests"].flatMap(walk);
const blob = sources.map((f) => readFileSync(f, "utf8")).join("\n");
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Prefixes that a template literal completes at runtime, e.g. `status-${x}`. */
const dynamicPrefixes = [
  ...blob.matchAll(/[`"']([a-z][\w-]*?-)\$\{/g),
  ...blob.matchAll(/\$\{[^}]*\}\s*([a-z][\w-]*)/g),
].map((m) => m[1]);

function rulesFor(test) {
  const hits = [];
  for (const sheet of SHEETS) {
    let css;
    try {
      css = strip(readFileSync(sheet, "utf8"));
    } catch {
      continue;
    }
    let count = 0;
    for (const m of css.matchAll(/([^{}]+)\{/g)) {
      const sel = m[1].trim();
      if (!sel.startsWith("@") && test(sel)) count++;
    }
    if (count) hits.push([sheet, count]);
  }
  return hits;
}

const arg = process.argv[2];

if (!arg) {
  console.error("usage: node scripts/css-usage.mjs <class-prefix> | --dead");
  process.exit(1);
}

if (arg === "--dead") {
  const defined = new Set();
  for (const sheet of SHEETS) {
    let css;
    try {
      css = strip(readFileSync(sheet, "utf8"));
    } catch {
      continue;
    }
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1]);
  }
  const named = (c) => new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(blob);
  const maybeDynamic = (c) => dynamicPrefixes.some((p) => c.startsWith(p));

  const dead = [...defined].filter((c) => !named(c)).sort();
  const safe = dead.filter((c) => !maybeDynamic(c));
  const risky = dead.filter(maybeDynamic);

  console.log(`${defined.size} classes defined, ${dead.length} named by no .ts/.tsx file\n`);
  console.log(`SAFE to delete (${safe.length}) - no literal use, no runtime prefix matches:`);
  console.log(safe.map((c) => `  ${c}`).join("\n") || "  none");
  console.log(`\nCHECK BY HAND (${risky.length}) - a template literal could build these:`);
  console.log(risky.map((c) => `  ${c}`).join("\n") || "  none");
  console.log(
    "\nThe visual suite photographs default states only. A class that styles an\n" +
      "error, a canceled game or a suspended owner is not in any screenshot, so\n" +
      "deleting it cannot be verified by running the tests. Read those.",
  );
  process.exit(0);
}

const prefix = arg;
const hits = rulesFor((sel) => sel.includes(`.${prefix}`));
const total = hits.reduce((sum, [, n]) => sum + n, 0);
const users = sources.filter((f) => readFileSync(f, "utf8").includes(prefix));
const dynamic = dynamicPrefixes.filter((p) => prefix.startsWith(p) || p.startsWith(prefix));

console.log(`\n  ${prefix}\n`);
console.log(`  rules: ${total}`);
for (const [sheet, n] of hits) console.log(`    ${n.toString().padStart(4)}  ${sheet}`);
console.log(`\n  named in ${users.length} source file${users.length === 1 ? "" : "s"}:`);
for (const f of users) console.log(`          ${f}`);
if (dynamic.length) {
  console.log(`\n  BUILT AT RUNTIME - a literal search will under-report this:`);
  for (const p of [...new Set(dynamic)]) console.log(`          \`${p}\${...}\``);
}
console.log(
  users.length === 1 && !dynamic.length
    ? "\n  One owner, no runtime construction: safe to convert and delete together.\n"
    : "\n",
);
